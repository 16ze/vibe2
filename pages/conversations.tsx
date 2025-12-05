"use client";

import { vibe } from "@/api/vibeClient";
import AddFriendModal from "@/components/chat/AddFriendModal";
import ChatView from "@/components/chat/ChatView";
import ConversationItem from "@/components/chat/ConversationItem";
import UserSelectorModal from "@/components/chat/UserSelectorModal";
import { useUI } from "@/contexts/UIContext";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  SquarePen,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Conversations() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [hasActiveStory, setHasActiveStory] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  /**
   * Récupère les fonctions pour masquer/afficher la BottomNav
   */
  const { showBottomNav } = useUI();

  /**
   * Navigation par swipe : Camera <- Conversations -> Profile
   * Désactivé quand un modal ou un chat est ouvert
   */
  const isSwipeDisabled =
    !!selectedConversation ||
    isUserSelectorOpen ||
    isAddFriendOpen ||
    isSearchOpen;
  useSwipeNavigation({
    onSwipeRight: "/camera",
    onSwipeLeft: "/profile",
    disabled: isSwipeDisabled,
  });

  /**
   * S'assure que la BottomNav est visible au montage de la page
   * Important après navigation depuis une page qui la masque (ex: map)
   * showBottomNav est stable grâce à useCallback, donc pas de boucle
   */
  useEffect(() => {
    // Réaffiche immédiatement la BottomNav
    showBottomNav();

    // Sécurité supplémentaire avec un petit délai
    const timer = setTimeout(() => {
      showBottomNav();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Une seule fois au montage, showBottomNav est stable

  /**
   * Récupère l'utilisateur actuel
   */
  useEffect(() => {
    vibe.auth
      .me()
      .then(setCurrentUser)
      .catch(() => {});
  }, []);

  /**
   * Vérifie si l'utilisateur a une story active (non expirée)
   */
  useEffect(() => {
    const checkActiveStory = async () => {
      if (!currentUser?.email) return;

      try {
        const stories = await vibe.entities.Story.filter(
          { created_by: currentUser.email },
          "-created_date"
        );
        const now = new Date();
        const activeStory = stories.find((story: any) => {
          if (!story.expires_at) return false;
          return new Date(story.expires_at) > now;
        });
        setHasActiveStory(!!activeStory);
      } catch (err) {
        console.error("Error checking active story:", err);
      }
    };

    if (currentUser) {
      checkActiveStory();
    }
  }, [currentUser]);

  /**
   * Crée une conversation de bienvenue si aucune n'existe
   */
  useEffect(() => {
    const createWelcomeConversation = async () => {
      if (!currentUser?.email) return;

      try {
        const existingConversations = await vibe.entities.Conversation.filter(
          { created_by: currentUser.email },
          "-last_message_at"
        );

        // Si aucune conversation n'existe, crée une conversation de bienvenue
        if (existingConversations.length === 0) {
          const welcomeConversation = await vibe.entities.Conversation.create({
            participant_name: "Team Vibe",
            participant_avatar: null,
            participant_email: "team@vibe.app",
            last_message: "Bienvenue sur Vibe !",
            last_message_at: new Date().toISOString(),
            last_message_type: "text", // Type du dernier message pour l'icône
            unread_count: 1,
            is_online: false,
            created_by: currentUser.email,
            created_date: new Date().toISOString(),
          });

          // Crée le message de bienvenue
          await vibe.entities.Message.create({
            conversation_id: welcomeConversation.id,
            sender_email: "team@vibe.app",
            sender_name: "Team Vibe",
            content:
              "Bienvenue sur Vibe !\n\nCommence à partager tes moments avec tes amis.",
            media_type: "text",
            created_date: new Date().toISOString(),
          });

          // Invalide le cache pour rafraîchir la liste
          queryClient.invalidateQueries({
            queryKey: ["conversations", currentUser.email],
          });
        }
      } catch (error) {
        console.error("Error creating welcome conversation:", error);
      }
    };

    if (currentUser) {
      createWelcomeConversation();
    }
  }, [currentUser, queryClient]);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];

      const convs = await vibe.entities.Conversation.filter(
        { created_by: currentUser.email },
        "-last_message_at"
      );

      // Trie par updatedAt (last_message_at) - le plus récent en haut
      return convs.sort((a: any, b: any) => {
        const dateA = new Date(
          a.last_message_at || a.created_date || 0
        ).getTime();
        const dateB = new Date(
          b.last_message_at || b.created_date || 0
        ).getTime();
        return dateB - dateA;
      });
    },
    enabled: !!currentUser,
    refetchOnWindowFocus: true, // Rafraîchit quand on revient sur la page
  });

  /**
   * Filtre les conversations selon la recherche
   */
  const filteredConversations =
    isSearchOpen && searchQuery
      ? conversations.filter((conv) =>
          conv.participant_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      : conversations;

  /**
   * Gère le clic sur l'avatar (redirige vers story ou profile)
   */
  const handleAvatarClick = () => {
    if (typeof window === "undefined") return;

    if (hasActiveStory && currentUser?.email) {
      window.location.href = `/feed?view_story=true&user_email=${encodeURIComponent(
        currentUser.email
      )}`;
    } else {
      router.push("/profile");
    }
  };

  /**
   * Gère le clic sur l'icône de recherche
   */
  const handleSearchClick = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery("");
    }
  };

  /**
   * Gère la sélection d'un utilisateur pour créer/ouvrir une conversation
   */
  const handleSelectUser = async (user: any) => {
    if (!currentUser?.email) return;

    try {
      // Vérifie si une conversation existe déjà avec cet utilisateur
      const existingConversations = await vibe.entities.Conversation.filter(
        {
          created_by: currentUser.email,
          participant_email: user.email,
        },
        "-last_message_at"
      );

      if (existingConversations.length > 0) {
        // Si une conversation existe, l'ouvre
        setSelectedConversation(existingConversations[0]);
      } else {
        // Sinon, crée une nouvelle conversation
        const newConversation = await vibe.entities.Conversation.create({
          participant_name: user.full_name || user.username || user.email,
          participant_avatar: user.avatar_url,
          participant_email: user.email,
          last_message: null,
          last_message_at: null,
          last_message_type: null,
          unread_count: 0,
          is_online: false,
          created_by: currentUser.email,
          created_date: new Date().toISOString(),
        });

        // Invalide le cache pour rafraîchir la liste
        queryClient.invalidateQueries({
          queryKey: ["conversations", currentUser.email],
        });

        // Ouvre la nouvelle conversation
        setSelectedConversation(newConversation);
      }
    } catch (error) {
      console.error("Error creating/opening conversation:", error);
    }
  };

  /**
   * Gère le clic sur le bouton de localisation
   */
  const handleMapClick = () => {
    router.push("/map");
  };

  /**
   * Gère le retour depuis ChatView et rafraîchit la liste
   */
  const handleBackFromChat = () => {
    setSelectedConversation(null);
    // Rafraîchit la liste des conversations pour afficher les changements d'état
    queryClient.invalidateQueries({
      queryKey: ["conversations", currentUser?.email],
    });
  };

  if (selectedConversation) {
    return (
      <ChatView
        conversation={selectedConversation}
        currentUser={currentUser}
        onBack={handleBackFromChat}
      />
    );
  }

  return (
    <div className="h-[100dvh] bg-white flex flex-col overflow-hidden pb-20 pb-safe">
      {/* Header refondu - 3 parties */}
      <header className="flex-shrink-0 sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Partie GAUCHE : Avatar Story + Icône Recherche */}
          <div className="flex items-center gap-3">
            {/* Avatar Story */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAvatarClick}
              className="relative flex-shrink-0"
            >
              <div
                className={`relative w-10 h-10 rounded-full overflow-hidden ${
                  hasActiveStory
                    ? "p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600"
                    : ""
                }`}
              >
                <div
                  className={`w-full h-full rounded-full overflow-hidden ${
                    hasActiveStory ? "bg-white" : ""
                  }`}
                >
                  {currentUser?.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={
                        currentUser.full_name ||
                        currentUser.username ||
                        "Avatar"
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500 font-semibold text-base">
                      {currentUser?.full_name?.charAt(0)?.toUpperCase() ||
                        currentUser?.username?.charAt(0)?.toUpperCase() ||
                        currentUser?.email?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </div>
                  )}
                </div>
              </div>
            </motion.button>

            {/* Icône Recherche */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSearchClick}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Search className="w-6 h-6 text-gray-600" />
            </motion.button>
          </div>

          {/* Partie CENTRE : Branding "Vibe" ou Input de recherche */}
          <div className="flex-1 flex justify-center items-center gap-2">
            {isSearchOpen ? (
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full max-w-xs px-3 py-1.5 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            ) : (
              <h1 className="text-xl font-bold text-gray-900">Vibe</h1>
            )}
          </div>

          {/* Partie DROITE : Actions (3 icônes) */}
          <div className="flex items-center gap-2">
            {/* Ajout Amis */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsAddFriendOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <UserPlus className="w-6 h-6 text-gray-600" />
            </motion.button>

            {/* Localisation (Snap Map) */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleMapClick}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <MapPin className="w-6 h-6 text-gray-600" />
            </motion.button>

            {/* Nouveau Message */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsUserSelectorOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <SquarePen className="w-6 h-6 text-gray-600" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Liste des conversations scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune conversation
            </h3>
            <p className="text-gray-500 text-sm">
              Commence à discuter avec tes amis !
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                onClick={setSelectedConversation}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modale de sélection d'utilisateur (Nouveau Message) */}
      <UserSelectorModal
        isOpen={isUserSelectorOpen}
        onClose={() => setIsUserSelectorOpen(false)}
        onSelectUser={handleSelectUser}
        currentUser={currentUser}
      />

      {/* Modale d'ajout d'ami */}
      <AddFriendModal
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}

"use client";

import CommentDrawer from "@/components/comments/CommentDrawer";
import ComposeModal from "@/components/create/ComposeModal";
import PostCard from "@/components/feed/PostCard";
import StoriesBar from "@/components/feed/StoriesBar";
import TextPostCard from "@/components/feed/TextPostCard";
import StoryViewer from "@/components/story/StoryViewer";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { supabase } from "@/lib/supabase";
import { getActiveStories, getFeed, toggleLike } from "@/services/postService";
import { getFollowing } from "@/services/socialService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Loader2, Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Feed() {
  const { user: currentUser } = useAuth();
  const { unreadActivityCount } = useNotification();
  const [viewingStories, setViewingStories] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [feedTab, setFeedTab] = useState<"foryou" | "following">("foryou");
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  /**
   * Navigation par swipe : Feed -> Vibes
   * Désactivé quand des modals sont ouverts ou pendant le visionnage de stories
   */
  const isSwipeDisabled = !!viewingStories || isCommentOpen || isComposeOpen;
  useSwipeNavigation({
    onSwipeLeft: "/vibes",
    disabled: isSwipeDisabled,
  });

  /**
   * Récupère les utilisateurs suivis pour filtrer le feed "Abonnements"
   */
  useEffect(() => {
    const loadFollowing = async () => {
      if (!currentUser?.id || !isMounted) return;
      try {
        const following = await getFollowing(currentUser.id);
        // Extrait les IDs des utilisateurs suivis
        const ids = following
          .map((f) => f.following_id)
          .filter((id): id is string => !!id);
        setFollowingIds(ids);
      } catch (error) {
        console.error("[Feed] Error loading following:", error);
        // En cas d'erreur, on laisse followingIds vide (pas de filtre)
        setFollowingIds([]);
      }
    };
    loadFollowing();
  }, [currentUser?.id, isMounted]);

  /**
   * Marque le composant comme monté côté client
   * Évite les différences d'hydratation entre serveur et client
   */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Récupère les posts depuis Supabase
  const { data: allPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["feed-posts"],
    queryFn: () => getFeed(50),
    enabled: !!currentUser && isMounted, // Attendre que le composant soit monté
  });

  // Récupère les stories depuis Supabase
  const { data: stories = [] } = useQuery({
    queryKey: ["feed-stories"],
    queryFn: () => getActiveStories(50),
    enabled: !!currentUser && isMounted, // Attendre que le composant soit monté
  });

  /**
   * Détecte les query params pour ouvrir automatiquement une story
   * Utilisé pour la navigation depuis la caméra
   */
  useEffect(() => {
    if (!isMounted) return; // Attend que le composant soit monté

    const viewStory = searchParams.get("view_story");
    const userEmail = searchParams.get("user_email");

    if (viewStory === "true" && userEmail) {
      // Trouve les stories de l'utilisateur spécifié
      const userStories = stories.filter(
        (story: any) =>
          story.created_by === userEmail ||
          story.author_name === userEmail ||
          story.author === userEmail
      );

      if (userStories.length > 0) {
        // Ouvre le StoryViewer avec les stories de l'utilisateur
        setViewingStories(userStories);

        // Nettoie l'URL après avoir ouvert la story pour éviter la réouverture au rafraîchissement
        router.replace("/feed", { scroll: false });
      }
    }
  }, [searchParams, stories, router, isMounted]);

  // Récupère les likes de l'utilisateur actuel
  const { data: userLikes = [] } = useQuery({
    queryKey: ["user-likes", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      // Récupère tous les posts likés par l'utilisateur
      const { data, error } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", currentUser.id);
      if (error) {
        console.error("[Feed] Error fetching likes:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!currentUser?.id && isMounted, // Attendre que le composant soit monté
  });

  const likedPostIds = new Set(userLikes.map((l: any) => l.post_id));

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!currentUser?.id) throw new Error("User not authenticated");
      return await toggleLike(postId, currentUser.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-likes", currentUser?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    },
  });

  /**
   * Fonction pour ouvrir le drawer de commentaires
   * Stocke l'ID du post pour lequel on affiche les commentaires
   * @param postId - ID du post pour lequel ouvrir les commentaires
   */
  const handleCommentClick = (postId: string) => {
    setActivePostId(postId);
    setIsCommentOpen(true);
  };

  /**
   * Fonction de rendu conditionnel des posts
   * Affiche TextPostCard pour les posts texte, PostCard pour les médias (images/vidéos)
   */
  const renderPostCard = (post: any, isLiked: boolean, onLike: () => void) => {
    if (post.type === "text") {
      return (
        <TextPostCard
          post={post}
          isLiked={isLiked}
          onLike={onLike}
          onComment={() => handleCommentClick(post.id)}
          onShare={(p) => console.log("Share:", p.id)}
          onSave={(id) => console.log("Save:", id)}
        />
      );
    }

    return (
      <PostCard
        post={post}
        isLiked={isLiked}
        onLike={onLike}
        onComment={() => handleCommentClick(post.id)}
        onShare={(p) => console.log("Share:", p.id)}
        onSave={(id) => console.log("Save:", id)}
      />
    );
  };

  const handleStoryClick = (stories: any, isOwn?: boolean) => {
    if (!stories || stories.length === 0) return;

    if (isOwn) {
      // Si c'est ma propre story, on l'affiche quand même dans le viewer
      console.log("[Feed] Opening own story:", stories);
      setViewingStories(stories);
      return;
    }

    // Pour les autres stories, on les affiche normalement
    console.log("[Feed] Opening story:", stories);
    setViewingStories(stories);
  };

  /**
   * Transforme les posts Supabase en format compatible avec PostCard
   * Calculé uniquement après le montage pour éviter les erreurs d'hydratation
   */
  const transformedPosts = isMounted
    ? allPosts.map((post: any) => ({
        id: post.id,
        type: post.type === "text" ? "text" : "media",
        media_url: post.media_url,
        media_type:
          post.type === "image"
            ? "photo"
            : post.type === "video"
            ? "video"
            : undefined,
        caption: post.content,
        content: post.content,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        author_name:
          post.profiles?.username || post.profiles?.full_name || "Anonyme",
        author_avatar: post.profiles?.avatar_url,
        created_date: post.created_at,
      }))
    : [];

  /**
   * Filtre les posts selon l'onglet actif
   * - "foryou" : affiche tous les posts
   * - "following" : affiche uniquement les posts des utilisateurs suivis
   */
  const posts = !isMounted
    ? []
    : feedTab === "following"
    ? transformedPosts.filter((post: any) => {
        // Trouve l'ID de l'auteur depuis le post Supabase
        const postAuthorId = allPosts.find(
          (p: any) => p.id === post.id
        )?.user_id;
        return postAuthorId && followingIds.includes(postAuthorId);
      })
    : transformedPosts;

  /**
   * Affiche un loader pendant l'hydratation côté client
   * Évite les erreurs de mismatch entre serveur et client
   */
  if (!isMounted) {
    return (
      <div className="h-[100dvh] bg-white overflow-y-auto scrollbar-hide">
        {/* Header avec onglets pendant le chargement */}
        <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="w-10 h-10" />
            <div className="flex items-center gap-8 flex-1 justify-center">
              <span className="text-[15px] font-semibold text-gray-500">
                Pour toi
              </span>
              <span className="text-[15px] font-semibold text-gray-500">
                Abonnements
              </span>
            </div>
            <div className="w-20" />
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-white overflow-y-auto scrollbar-hide pb-20 pb-safe">
      {/* Header avec onglets "Pour toi" / "Abonnements" */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Icône + à gauche pour créer un status */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsComposeOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Créer un nouveau status"
          >
            <Plus className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
          </motion.button>

          {/* Onglets centrés */}
          <div className="flex items-center gap-8 flex-1 justify-center">
            {/* Onglet "Pour toi" */}
            <button
              onClick={() => setFeedTab("foryou")}
              className="relative flex flex-col items-center"
            >
              <span
                className={`text-[15px] font-semibold transition-colors ${
                  feedTab === "foryou"
                    ? "text-gray-900 font-bold"
                    : "text-gray-500 font-normal"
                }`}
              >
                Pour toi
              </span>
              {/* Barre de soulignement pour l'onglet actif */}
              {feedTab === "foryou" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gray-900 rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>

            {/* Onglet "Abonnements" */}
            <button
              onClick={() => setFeedTab("following")}
              className="relative flex flex-col items-center"
            >
              <span
                className={`text-[15px] font-semibold transition-colors ${
                  feedTab === "following"
                    ? "text-gray-900 font-bold"
                    : "text-gray-500 font-normal"
                }`}
              >
                Abonnements
              </span>
              {/* Barre de soulignement pour l'onglet actif */}
              {feedTab === "following" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gray-900 rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </div>

          {/* Actions à droite (recherche, notifications) */}
          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="Rechercher"
            >
              <Search className="w-6 h-6 text-gray-900" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/activity")}
              className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-6 h-6 text-gray-900" />
              {/* Badge rouge si notifications non lues */}
              {unreadActivityCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
                  <span className="text-[10px] font-bold text-white">
                    {unreadActivityCount > 9 ? "9+" : unreadActivityCount}
                  </span>
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      {/* StoriesBar scrollable */}
      <StoriesBar
        stories={stories}
        onStoryClick={handleStoryClick}
        currentUserStory={currentUser}
      />

      {/* Contenu des posts */}
      {postsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        // Empty State - Différent selon l'onglet actif
        feedTab === "following" ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun post d&apos;abonnements
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Abonnez-vous à des créateurs pour voir leurs vibes ici
            </p>
            <button
              className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors"
              disabled
              aria-label="Explorer (bientôt disponible)"
            >
              Explorer
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
              <span className="text-3xl">📸</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun post pour l&apos;instant
            </h3>
            <p className="text-gray-500 text-sm">
              Sois le premier à partager un moment !
            </p>
          </div>
        )
      ) : (
        <div className="divide-y divide-gray-100">
          {posts.map((post: any, index: number) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.05,
                ease: "easeOut",
              }}
            >
              {renderPostCard(post, likedPostIds.has(post.id), () =>
                likeMutation.mutate(post.id)
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {viewingStories && (
          <StoryViewer
            stories={viewingStories}
            onClose={() => setViewingStories(null)}
          />
        )}
      </AnimatePresence>

      {/* CommentDrawer - Ajouté à la fin de la page (hors du scroll) */}
      {/* Passe l'ID du post actif pour isoler les commentaires par post */}
      <CommentDrawer
        isOpen={isCommentOpen}
        onClose={() => {
          setIsCommentOpen(false);
          setActivePostId(null);
        }}
        postId={activePostId}
      />

      {/* ComposeModal - Modal pour créer un nouveau post */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}

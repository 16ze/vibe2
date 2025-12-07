"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getFollowers, getFollowing, getStats } from "@/services/socialService";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  Camera,
  ChevronLeft,
  Grid3X3,
  Settings,
  Share2,
  Shuffle,
  X,
  Trash2,
  Maximize2,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import UsersListModal from "@/components/profile/UsersListModal";
import { supabase } from "@/lib/supabase";
import { deletePost } from "@/services/postService";
import { deleteMedia } from "@/services/mediaService";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

export default function Profile() {
  const { user: currentUser, updateProfile, refreshProfile } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null); // Post sélectionné pour agrandissement
  const [postMenuOpen, setPostMenuOpen] = useState<string | null>(null); // ID du post pour lequel le menu est ouvert
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    username: "",
    bio: "",
    avatar_url: "",
  });

  /**
   * Initialise le formulaire d'édition avec les données actuelles
   */
  useEffect(() => {
    if (currentUser) {
      setEditForm({
        full_name: currentUser.full_name || "",
        username: currentUser.username || "",
        bio: currentUser.bio || "",
        avatar_url: currentUser.avatar_url || "",
      });
    }
  }, [currentUser]);

  /**
   * Ferme le menu de post quand on clique ailleurs
   */
  useEffect(() => {
    const handleClickOutside = () => {
      if (postMenuOpen) {
        setPostMenuOpen(null);
      }
    };

    if (postMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [postMenuOpen]);

  /**
   * Récupère les statistiques du profil avec rafraîchissement automatique
   */
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["profile-stats", currentUser?.id],
    queryFn: () => (currentUser ? getStats(currentUser.id) : null),
    enabled: !!currentUser,
    refetchInterval: 30000, // Rafraîchit toutes les 30 secondes
    refetchOnWindowFocus: true,
  });

  /**
   * Récupère les posts de l'utilisateur avec rafraîchissement automatique
   */
  const { data: posts = [] } = useQuery({
    queryKey: ["user-posts", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!currentUser,
    refetchInterval: 15000, // Rafraîchit toutes les 15 secondes
    refetchOnWindowFocus: true,
  });

  /**
   * Récupère les followers avec rafraîchissement automatique
   */
  const { data: followers = [] } = useQuery({
    queryKey: ["followers", currentUser?.id],
    queryFn: () => (currentUser ? getFollowers(currentUser.id) : []),
    enabled: !!currentUser,
    refetchInterval: 20000, // Rafraîchit toutes les 20 secondes
    refetchOnWindowFocus: true,
  });

  /**
   * Récupère les following avec rafraîchissement automatique
   */
  const { data: following = [] } = useQuery({
    queryKey: ["following", currentUser?.id],
    queryFn: () => (currentUser ? getFollowing(currentUser.id) : []),
    enabled: !!currentUser,
    refetchInterval: 20000, // Rafraîchit toutes les 20 secondes
    refetchOnWindowFocus: true,
  });

  /**
   * Mutation pour supprimer un post
   */
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!currentUser?.id) throw new Error("User not authenticated");
      await deletePost(postId, currentUser.id);
    },
    onSuccess: () => {
      // Invalide les queries pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ["user-posts", currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["profile-stats", currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      setPostMenuOpen(null);
    },
    onError: (error) => {
      console.error("[Profile] Error deleting post:", error);
      alert("Erreur lors de la suppression. Veuillez réessayer.");
    },
  });

  /**
   * Gère la suppression d'un post
   */
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce post ?")) {
      return;
    }
    deletePostMutation.mutate(postId);
  };

  /**
   * Gère l'agrandissement d'un post
   */
  const handlePostClick = (post: any) => {
    setSelectedPost(post);
  };

  /**
   * Gère le partage du profil
   */
  const handleShareProfile = async () => {
    const profileUrl =
      typeof window !== "undefined" ? window.location.href : "";

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentUser?.full_name || currentUser?.username} sur Vibe`,
          text: `Découvre le profil de ${
            currentUser?.full_name || currentUser?.username
          } sur Vibe`,
          url: profileUrl,
        });
      } catch (error) {
        console.log("Partage annulé");
      }
    } else {
      try {
        await navigator.clipboard.writeText(profileUrl);
        alert("Lien du profil copié dans le presse-papier !");
      } catch (error) {
        console.error("Erreur lors de la copie:", error);
      }
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  // Prépare les données pour les modales
  const followersList = followers.map((f) => ({
    id: f.follower_id,
    username: f.follower?.username || "",
    full_name: f.follower?.full_name || "",
    avatar_url: f.follower?.avatar_url || "",
  }));

  const followingList = following.map((f) => ({
    id: f.following_id,
    username: f.following?.username || "",
    full_name: f.following?.full_name || "",
    avatar_url: f.following?.avatar_url || "",
  }));

  return (
    <div className="min-h-screen bg-white pb-20 pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/feed">
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">
            {currentUser.username || currentUser.full_name || "Profil"}
          </h1>
          <Link href="/settings">
            <Settings className="w-6 h-6 text-gray-900" />
          </Link>
        </div>
      </header>

      {/* Profile Header - Design spécifique */}
      <div className="px-4 pt-6">
        {/* Conteneur principal : Texte à gauche, Avatar à droite */}
        <div className="flex flex-row justify-between items-start">
          {/* Colonne GAUCHE : Infos utilisateur */}
          <div className="flex-1 pr-4" style={{ maxWidth: "calc(100% - 100px)" }}>
            {/* Nom d'affichage */}
            <h2 className="text-2xl font-bold text-gray-900">
              {currentUser.full_name || currentUser.username || currentUser.email?.split("@")[0] || "Anonyme"}
            </h2>

            {/* Pseudo */}
            {currentUser.username && (
              <p className="text-gray-500 text-sm mt-0.5">
                @{currentUser.username}
              </p>
            )}

            {/* Bio */}
            {currentUser.bio && (
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap break-words">
                {currentUser.bio}
              </p>
            )}
          </div>

          {/* Colonne DROITE : Avatar rond (grand) */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name || currentUser.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-purple-500">
                  {(currentUser.full_name || currentUser.username || currentUser.email)?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barre de Statistiques */}
        <div className="flex justify-around py-4 border-b border-gray-100 mt-4">
          <div
            className="text-center cursor-pointer"
            onClick={() => setIsFollowersModalOpen(true)}
          >
            <p className="font-bold text-lg text-gray-900">
              {stats?.postsCount || 0}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Posts</p>
          </div>
          <div
            className="text-center cursor-pointer"
            onClick={() => setIsFollowersModalOpen(true)}
          >
            <p className="font-bold text-lg text-gray-900">
              {stats?.followersCount || 0}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Abonnés</p>
          </div>
          <div
            className="text-center cursor-pointer"
            onClick={() => setIsFollowingModalOpen(true)}
          >
            <p className="font-bold text-lg text-gray-900">
              {stats?.followingCount || 0}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Abonnements</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-gray-900">
              {currentUser.score || 0}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Vibe Score</p>
          </div>
        </div>

        {/* Boutons d'Action */}
        <div className="flex gap-3 px-0 py-2 mt-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 h-10 rounded-lg bg-gray-100 text-sm font-semibold text-gray-900 hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            Modifier le profil
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleShareProfile}
            className="flex-1 h-10 rounded-lg bg-gray-100 text-sm font-semibold text-gray-900 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Partager
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-gray-100">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${
            activeTab === "posts" ? "border-gray-900" : "border-transparent"
          }`}
        >
          <Grid3X3
            className={`w-6 h-6 ${
              activeTab === "posts" ? "text-gray-900" : "text-gray-400"
            }`}
          />
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${
            activeTab === "saved" ? "border-gray-900" : "border-transparent"
          }`}
        >
          <Bookmark
            className={`w-6 h-6 ${
              activeTab === "saved" ? "text-gray-900" : "text-gray-400"
            }`}
          />
        </button>
      </div>

      {/* Posts grid */}
      {activeTab === "posts" && (
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map((post: any) => (
            <motion.div
              key={post.id}
              className="aspect-square bg-gray-100 relative group"
            >
              {post.media_type === "video" ? (
                <video
                  src={post.media_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={post.media_url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              
              {/* Overlay avec actions au survol */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-3">
                  {/* Bouton Agrandir */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePostClick(post);
                    }}
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center"
                  >
                    <Maximize2 className="w-5 h-5 text-gray-900" />
                  </motion.button>
                  
                  {/* Bouton Menu (3 points) */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPostMenuOpen(postMenuOpen === post.id ? null : post.id);
                    }}
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center relative"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-900" />
                    
                    {/* Menu déroulant */}
                    {postMenuOpen === post.id && (
                      <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl overflow-hidden z-50 min-w-[120px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post.id);
                          }}
                          disabled={deletePostMutation.isPending}
                          className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}

          {posts.length === 0 && (
            <div className="col-span-3 py-20 text-center">
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-gray-300 flex items-center justify-center mb-4">
                <Grid3X3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Aucun post
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Partage ton premier moment !
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "saved" && (
        <div className="py-20 text-center">
          <div className="w-16 h-16 mx-auto rounded-full border-2 border-gray-300 flex items-center justify-center mb-4">
            <Bookmark className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Sauvegardés</h3>
          <p className="text-sm text-gray-500 mt-1">
            Tes posts sauvegardés apparaîtront ici
          </p>
        </div>
      )}

      {/* Modale Abonnés */}
      <UsersListModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        title="Abonnés"
        users={followersList}
        onUpdate={refetchStats}
      />

      {/* Modale Abonnements */}
      <UsersListModal
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
        title="Abonnements"
        users={followingList}
        onUpdate={refetchStats}
      />

      {/* Modal d'agrandissement d'image */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bouton fermer */}
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Image/Vidéo agrandie */}
              {selectedPost.media_type === "video" ? (
                <video
                  src={selectedPost.media_url}
                  className="w-full h-full object-contain max-h-[90vh] rounded-lg"
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={selectedPost.media_url}
                  alt=""
                  className="w-full h-full object-contain max-h-[90vh] rounded-lg"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modale d'édition du profil */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header de la modale */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900">
                  Modifier le profil
                </h2>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    if (!currentUser) return;
                    try {
                      // Ferme la modale AVANT la mise à jour pour éviter l'écran noir
                      setIsEditModalOpen(false);
                      
                      // Met à jour le profil
                      await updateProfile({
                        full_name: editForm.full_name,
                        username: editForm.username,
                        bio: editForm.bio,
                        avatar_url: editForm.avatar_url,
                      });

                      // Rafraîchit les données après la mise à jour
                      await refreshProfile();
                      refetchStats();
                    } catch (error) {
                      console.error("Error updating profile:", error);
                      alert("Erreur lors de la mise à jour : " + (error as Error).message);
                      // Rouvre la modale en cas d'erreur
                      setIsEditModalOpen(true);
                    }
                  }}
                  className="text-indigo-600 font-semibold"
                >
                  Enregistrer
                </motion.button>
              </div>

              {/* Contenu de la modale */}
              <div className="p-4 space-y-4">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 hover:border-indigo-500 transition-colors bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center"
                    >
                      {editForm.avatar_url ? (
                        <img
                          src={editForm.avatar_url}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-400" />
                      )}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const randomId = Math.floor(Math.random() * 1000);
                        setEditForm((prev) => ({
                          ...prev,
                          avatar_url: `https://i.pravatar.cc/150?u=${randomId}`,
                        }));
                      }}
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-lg"
                      title="Avatar aléatoire"
                    >
                      <Shuffle className="w-4 h-4" />
                    </motion.button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditForm((prev) => ({
                            ...prev,
                            avatar_url: reader.result as string,
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </div>

                {/* Nom complet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white text-gray-900"
                    placeholder="Jean Dupont"
                  />
                </div>

                {/* Nom d'utilisateur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom d'utilisateur
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      @
                    </span>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white text-gray-900"
                      placeholder="jean_dupont"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none bg-white text-gray-900"
                    placeholder="Parle-nous de toi..."
                    maxLength={150}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {editForm.bio.length}/150
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

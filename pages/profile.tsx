import { vibe } from "@/api/vibeClient";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  Camera,
  ChevronLeft,
  Grid3X3,
  Settings,
  Share2,
  Shuffle,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Profile() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    username: "",
    bio: "",
    avatar_url: "",
  });
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Navigation par swipe : Profile -> Conversations
   */
  useSwipeNavigation({
    onSwipeRight: "/conversations",
    disabled: isEditModalOpen,
  });

  /**
   * Récupère l'utilisateur courant
   */
  useEffect(() => {
    vibe.auth
      .me()
      .then((user) => {
        setCurrentUser(user);
        // Initialise le formulaire d'édition avec les données actuelles
        setEditForm({
          full_name: user?.full_name || "",
          username: user?.username || "",
          bio: user?.bio || "",
          avatar_url: user?.avatar_url || "",
        });
      })
      .catch(() => {});
  }, []);

  /**
   * Vérifie le paramètre action=edit dans l'URL pour ouvrir la modale
   */
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "edit") {
      setIsEditModalOpen(true);
      // Nettoie l'URL pour ne pas rouvrir la modale au refresh
      router.replace("/profile", { scroll: false });
    }
  }, [searchParams, router]);

  const { data: posts = [] } = useQuery({
    queryKey: ["user-posts", currentUser?.email],
    queryFn: () =>
      currentUser
        ? vibe.entities.Post.filter(
            { created_by: currentUser.email },
            "-created_date"
          )
        : [],
    enabled: !!currentUser,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ["followers", currentUser?.email],
    queryFn: () =>
      currentUser
        ? vibe.entities.Follow.filter({ following_email: currentUser.email })
        : [],
    enabled: !!currentUser,
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", currentUser?.email],
    queryFn: () =>
      currentUser
        ? vibe.entities.Follow.filter({ follower_email: currentUser.email })
        : [],
    enabled: !!currentUser,
  });

  /**
   * Calcule le score de l'utilisateur
   * Score = nombre de posts * 10 (ou score stocké dans currentUser)
   */
  const userScore = currentUser?.score ?? posts.length * 10;

  /**
   * Gère le partage du profil
   */
  const handleShareProfile = async () => {
    const profileUrl =
      typeof window !== "undefined" ? window.location.href : "";

    if (navigator.share) {
      // Utilise l'API native de partage si disponible
      try {
        await navigator.share({
          title: `${currentUser.full_name || currentUser.username} sur Vibe`,
          text: `Découvre le profil de ${
            currentUser.full_name || currentUser.username
          } sur Vibe`,
          url: profileUrl,
        });
      } catch (error) {
        // L'utilisateur a annulé le partage
        console.log("Partage annulé");
      }
    } else {
      // Fallback : copie l'URL dans le presse-papier
      try {
        await navigator.clipboard.writeText(profileUrl);
        alert("Lien du profil copié dans le presse-papier !");
      } catch (error) {
        console.error("Erreur lors de la copie:", error);
      }
    }
  };

  /**
   * Gère l'ouverture de la modale d'édition du profil
   */
  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  /**
   * Gère l'upload d'un avatar depuis un fichier
   */
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  /**
   * Génère un avatar aléatoire depuis pravatar.cc
   */
  const handleRandomAvatar = () => {
    const randomId = Math.floor(Math.random() * 1000);
    setEditForm((prev) => ({
      ...prev,
      avatar_url: `https://i.pravatar.cc/150?u=${randomId}`,
    }));
  };

  /**
   * Sauvegarde les modifications du profil
   */
  const handleSaveProfile = async () => {
    if (!currentUser?.email) return;

    try {
      // Met à jour l'utilisateur dans le storage
      const { set, get } = await import("idb-keyval");
      const users = (await get("vibe_users")) || [];
      const userIndex = users.findIndex(
        (u: any) => u.email === currentUser.email
      );

      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          full_name: editForm.full_name,
          username: editForm.username,
          bio: editForm.bio,
          avatar_url: editForm.avatar_url,
        };
        await set("vibe_users", users);
      }

      // Met à jour l'état local
      setCurrentUser((prev: any) => ({
        ...prev,
        full_name: editForm.full_name,
        username: editForm.username,
        bio: editForm.bio,
        avatar_url: editForm.avatar_url,
      }));

      // Ferme la modale
      setIsEditModalOpen(false);

      // Invalide les caches React Query si nécessaire
      queryClient.invalidateQueries({
        queryKey: ["user-posts", currentUser.email],
      });

      alert("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Une erreur est survenue lors de la sauvegarde.");
    }
  };

  /**
   * Mutation pour créer un ami de test
   * Crée un utilisateur de test et établit une relation d'amitié bidirectionnelle
   */
  const createTestFriendMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.email) {
        throw new Error("Utilisateur non connecté");
      }

      const testUserEmail = "ami-test@vibe.app";
      const testUserName = "Ami Test";

      // Récupère tous les utilisateurs
      const allUsers = await vibe.integrations.Core.getAllUsers();

      // Vérifie si l'utilisateur de test existe déjà
      let testUser = allUsers.find((u: any) => u.email === testUserEmail);

      if (!testUser) {
        // Crée l'utilisateur de test via le storage
        testUser = {
          email: testUserEmail,
          full_name: testUserName,
          username: "ami_test",
          avatar_url: "https://i.pravatar.cc/150?u=ami-test",
          bio: "Ami de test pour tester les messages",
          created_date: new Date().toISOString(),
        };

        // Ajoute l'utilisateur à la liste
        const updatedUsers = [...allUsers, testUser];
        // Sauvegarde via le storage (méthode directe)
        if (typeof window !== "undefined") {
          const { set } = await import("idb-keyval");
          await set("vibe_users", updatedUsers);
        }
      }

      // Vérifie si les relations existent déjà
      const existingSent = await vibe.entities.Follow.filter({
        follower_email: currentUser.email,
        following_email: testUserEmail,
      });

      const existingReceived = await vibe.entities.Follow.filter({
        follower_email: testUserEmail,
        following_email: currentUser.email,
      });

      // Crée la relation bidirectionnelle si elle n'existe pas
      if (existingSent.length === 0) {
        await vibe.entities.Follow.create({
          follower_email: currentUser.email,
          following_email: testUserEmail,
          status: "FRIENDS",
          created_date: new Date().toISOString(),
        });
      } else if (existingSent[0].status !== "FRIENDS") {
        await vibe.entities.Follow.update(existingSent[0].id, {
          status: "FRIENDS",
        });
      }

      if (existingReceived.length === 0) {
        await vibe.entities.Follow.create({
          follower_email: testUserEmail,
          following_email: currentUser.email,
          status: "FRIENDS",
          created_date: new Date().toISOString(),
        });
      } else if (existingReceived[0].status !== "FRIENDS") {
        await vibe.entities.Follow.update(existingReceived[0].id, {
          status: "FRIENDS",
        });
      }

      return testUser;
    },
    onSuccess: (testUser) => {
      // Invalide les queries pour rafraîchir les données
      queryClient.invalidateQueries({
        queryKey: ["relationships", currentUser?.email],
      });
      queryClient.invalidateQueries({
        queryKey: ["followers", currentUser?.email],
      });
      queryClient.invalidateQueries({
        queryKey: ["following", currentUser?.email],
      });
      alert(
        `✅ Ami de test "${testUser.full_name}" créé avec succès !\n\nTu peux maintenant tester l'envoi de messages, photos et vidéos.`
      );
    },
    onError: (error: any) => {
      console.error("Erreur lors de la création de l'ami de test:", error);
      alert(
        `❌ Erreur: ${error.message || "Impossible de créer l'ami de test"}`
      );
    },
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/">
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">
            {currentUser.username || currentUser.full_name || "Profil"}
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Settings className="w-6 h-6 text-gray-900" />
            </Link>
          </div>
        </div>
      </header>

      {/* Profile Header - Nouvelle structure */}
      <div className="px-4 pt-6">
        {/* Conteneur principal : Infos à gauche, Avatar à droite */}
        <div className="flex flex-row justify-between items-start">
          {/* Colonne GAUCHE : Infos utilisateur */}
          <div
            className="flex-1 pr-4"
            style={{ maxWidth: "calc(100% - 100px)" }}
          >
            {/* Nom d'affichage */}
            <h2 className="text-2xl font-bold text-gray-900">
              {currentUser.full_name || "Utilisateur VIBE"}
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

          {/* Colonne DROITE : Avatar */}
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
                  {(currentUser.full_name ||
                    currentUser.username ||
                    currentUser.email)?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barre de Statistiques */}
        <div className="flex justify-around py-4 border-b border-gray-100 mt-4">
          <div className="text-center">
            <p className="font-bold text-lg text-gray-900">{posts.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Posts</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-gray-900">
              {followers.length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Abonnés</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-gray-900">
              {following.length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Abonnements</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-gray-900">{userScore}</p>
            <p className="text-xs text-gray-500 mt-0.5">Score</p>
          </div>
        </div>

        {/* Boutons d'Action */}
        <div className="flex gap-3 px-0 py-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleEditProfile}
            className="flex-1 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            Modifier le profil
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleShareProfile}
            className="flex-1 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Partager le profil
          </motion.button>
        </div>
        {/* Bouton de test pour créer un ami */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => createTestFriendMutation.mutate()}
          disabled={createTestFriendMutation.isPending}
          className="w-full mt-2 h-10 rounded-lg bg-blue-500 text-sm font-semibold text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-4 h-4" />
          {createTestFriendMutation.isPending
            ? "Création..."
            : "Créer un ami de test"}
        </motion.button>
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
          {posts.map((post) => (
            <motion.div
              key={post.id}
              whileTap={{ scale: 0.98 }}
              className="aspect-square bg-gray-100"
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
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header de la modale */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Modifier le profil
                </h2>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveProfile}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold"
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
                      className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-600 hover:border-indigo-500 transition-colors bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center"
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
                    {/* Bouton avatar aléatoire */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleRandomAvatar}
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
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    Clique pour changer ou utilise l'icône pour un avatar
                    aléatoire
                  </p>
                </div>

                {/* Nom complet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Jean Dupont"
                  />
                </div>

                {/* Nom d'utilisateur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom d'utilisateur
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
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
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="jean_dupont"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Parle-nous de toi..."
                    maxLength={150}
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
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

"use client";

import { vibe } from "@/api/vibeClient";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

interface UserSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: any) => void;
  currentUser: any;
}

/**
 * Modale de sélection d'utilisateur pour créer une nouvelle conversation
 * Affiche la liste de tous les utilisateurs disponibles
 */
export default function UserSelectorModal({
  isOpen,
  onClose,
  onSelectUser,
  currentUser,
}: UserSelectorModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Récupère les relations (Follow) pour déterminer les amis
   */
  const { data: relationships = [] } = useQuery({
    queryKey: ["relationships", currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      try {
        const sent = await vibe.entities.Follow.filter({
          follower_email: currentUser.email,
        });
        const received = await vibe.entities.Follow.filter({
          following_email: currentUser.email,
        });
        return [...sent, ...received];
      } catch (error) {
        console.error("Error fetching relationships:", error);
        return [];
      }
    },
    enabled: isOpen && !!currentUser,
  });

  /**
   * Récupère tous les utilisateurs disponibles et filtre les amis
   */
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen) return;

      try {
        setIsLoading(true);
        // Récupère tous les utilisateurs depuis IndexedDB
        const allUsers = (await vibe.integrations.Core.getAllUsers()) || [];

        // Filtre l'utilisateur actuel
        const otherUsers = allUsers.filter(
          (user: any) => user.email !== currentUser?.email
        );

        /**
         * Détermine si un utilisateur est un ami (FRIENDS)
         * Un utilisateur est ami si les deux relations existent avec status FRIENDS
         */
        const isFriend = (userEmail: string): boolean => {
          const sent = relationships.find(
            (rel: any) =>
              rel.follower_email === currentUser?.email &&
              rel.following_email === userEmail &&
              (rel.status === "FRIENDS" || rel.status === "active")
          );
          const received = relationships.find(
            (rel: any) =>
              rel.follower_email === userEmail &&
              rel.following_email === currentUser?.email &&
              (rel.status === "FRIENDS" || rel.status === "active")
          );
          // Les deux relations doivent exister pour être amis
          return !!(sent && received);
        };

        // Filtre uniquement les amis
        const friends = otherUsers.filter((user: any) => isFriend(user.email));

        // Si aucun ami n'existe, affiche un message vide
        setUsers(friends);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, currentUser?.email, relationships]);

  /**
   * Filtre les utilisateurs selon la recherche
   */
  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Gère la sélection d'un utilisateur
   */
  const handleSelectUser = (user: any) => {
    onSelectUser(user);
    setSearchQuery("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        {/* Modal */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full bg-white rounded-t-3xl max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-900">
              Nouveau messages
            </h2>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100"
            >
              <X className="w-6 h-6 text-gray-600" />
            </motion.button>
          </div>

          {/* Search input */}
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                autoFocus
              />
            </div>
          </div>

          {/* Users list - Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <p className="text-gray-500 text-sm">
                  {searchQuery
                    ? "Aucun ami trouvé"
                    : "Ajoutez d'abord des amis pour discuter."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredUsers.map((user) => (
                  <motion.button
                    key={user.email}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name || user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-base">
                            {(user.full_name || user.username || user.email)
                              ?.charAt(0)
                              ?.toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* User info */}
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900 text-[15px]">
                        {user.full_name || user.username || user.email}
                      </h3>
                      {user.username && user.full_name && (
                        <p className="text-sm text-gray-500">
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

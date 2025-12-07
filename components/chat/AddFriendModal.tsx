"use client";

import {
  followUser,
  getRelationships,
  searchUsers,
  unfollowUser,
} from "@/services/socialService";
import { useUI } from "@/contexts/UIContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Search, UserPlus, X, X as XIcon } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

type RelationshipStatus = "NONE" | "FOLLOWING" | "FOLLOWERS" | "FRIENDS";

/**
 * Modale pour ajouter des amis avec 2 onglets : Explorer et Demandes Reçues
 * Utilise Supabase pour la recherche et la gestion des relations
 */
export default function AddFriendModal({
  isOpen,
  onClose,
  currentUser,
}: AddFriendModalProps) {
  /**
   * Récupère les fonctions pour masquer/afficher la BottomNav
   */
  const { hideBottomNav, showBottomNav } = useUI();
  const [activeTab, setActiveTab] = useState<"explore" | "requests">("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const queryClient = useQueryClient();

  /**
   * Masque la BottomNav quand la modale est ouverte
   * La réaffiche quand la modale est fermée
   */
  useEffect(() => {
    if (isOpen) {
      hideBottomNav();
    } else {
      const timer = setTimeout(() => {
        showBottomNav();
      }, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      showBottomNav();
    };
  }, [isOpen, hideBottomNav, showBottomNav]);

  /**
   * Debounce de la recherche (500ms)
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /**
   * Récupère les relations (follows) de l'utilisateur actuel depuis Supabase
   */
  const { data: relationships = [], refetch: refetchRelationships } = useQuery({
    queryKey: ["relationships", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      try {
        return await getRelationships(currentUser.id);
      } catch (error) {
        console.error("Error fetching relationships:", error);
        return [];
      }
    },
    enabled: isOpen && !!currentUser?.id,
    refetchOnWindowFocus: true,
  });

  /**
   * Recherche des utilisateurs dans Supabase (seulement si query non vide)
   */
  const {
    data: searchedUsers = [],
    isLoading: isSearching,
    error: searchError,
  } = useQuery({
    queryKey: ["search-users", debouncedSearchQuery, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id || !debouncedSearchQuery.trim()) {
        console.log("[AddFriendModal] Search skipped: no query or user");
        return [];
      }
      console.log("[AddFriendModal] Searching users with query:", debouncedSearchQuery);
      try {
        const results = await searchUsers(debouncedSearchQuery, currentUser.id, 20);
        console.log("[AddFriendModal] Search results:", results.length, results);
        return results;
      } catch (error) {
        console.error("[AddFriendModal] Error searching users:", error);
        return [];
      }
    },
    enabled:
      isOpen &&
      activeTab === "explore" &&
      !!currentUser?.id &&
      debouncedSearchQuery.trim().length > 0,
  });

  // Log des erreurs de recherche
  useEffect(() => {
    if (searchError) {
      console.error("[AddFriendModal] Search query error:", searchError);
    }
  }, [searchError]);

  /**
   * Récupère les demandes reçues (utilisateurs qui suivent l'utilisateur actuel)
   */
  const receivedRequests = useMemo(() => {
    if (!currentUser?.id || !relationships.length) return [];

    // Récupère les IDs des utilisateurs qui suivent l'utilisateur actuel
    const followerIds = relationships
      .filter((rel: any) => rel.following_id === currentUser.id)
      .map((rel: any) => rel.follower_id);

    if (followerIds.length === 0) return [];

    // Vérifie si l'utilisateur actuel suit aussi ces utilisateurs (pour exclure les amis)
    const followingIds = relationships
      .filter((rel: any) => rel.follower_id === currentUser.id)
      .map((rel: any) => rel.following_id);

    // Retourne seulement les IDs qui ne sont pas dans followingIds (demandes non mutuelles)
    return followerIds.filter((id: string) => !followingIds.includes(id));
  }, [relationships, currentUser?.id]);

  /**
   * Récupère les profils des demandes reçues
   */
  const { data: requestUsers = [] } = useQuery({
    queryKey: ["request-users", receivedRequests],
    queryFn: async () => {
      if (receivedRequests.length === 0) return [];

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", receivedRequests);

        if (error) {
          console.error("Error fetching request users:", error);
          return [];
        }

        return data || [];
      } catch (error) {
        console.error("Error in request users query:", error);
        return [];
      }
    },
    enabled: isOpen && activeTab === "requests" && receivedRequests.length > 0,
  });

  /**
   * Détermine le statut de relation avec un utilisateur
   */
  const getRelationshipStatus = (userId: string): RelationshipStatus => {
    if (!currentUser?.id || userId === currentUser.id) return "NONE";

    const isFollowing = relationships.some(
      (rel: any) =>
        rel.follower_id === currentUser.id && rel.following_id === userId
    );

    const isFollowedBy = relationships.some(
      (rel: any) =>
        rel.follower_id === userId && rel.following_id === currentUser.id
    );

    if (isFollowing && isFollowedBy) {
      return "FRIENDS";
    } else if (isFollowing) {
      return "FOLLOWING";
    } else if (isFollowedBy) {
      return "FOLLOWERS";
    }

    return "NONE";
  };

  /**
   * Mutation pour suivre un utilisateur
   */
  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!currentUser?.id) throw new Error("User not authenticated");
      await followUser(currentUser.id, targetUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["relationships", currentUser?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["search-users", debouncedSearchQuery, currentUser?.id],
      });
    },
  });

  /**
   * Mutation pour ne plus suivre un utilisateur
   */
  const unfollowMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!currentUser?.id) throw new Error("User not authenticated");
      await unfollowUser(currentUser.id, targetUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["relationships", currentUser?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["search-users", debouncedSearchQuery, currentUser?.id],
      });
    },
  });

  /**
   * Utilisateurs à afficher selon l'onglet actif
   */
  const displayedUsers = useMemo(() => {
    if (activeTab === "explore") {
      // Affiche les résultats de recherche
      return searchedUsers.filter((user: any) => {
        const status = getRelationshipStatus(user.id);
        // Affiche seulement ceux qui ne sont pas déjà amis
        return status !== "FRIENDS";
      });
    } else {
      // Affiche les demandes reçues
      return requestUsers;
    }
  }, [activeTab, searchedUsers, requestUsers, relationships, currentUser?.id]);

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
              Ajouter des amis
            </h2>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100"
            >
              <X className="w-6 h-6 text-gray-600" />
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 flex-shrink-0">
            <button
              onClick={() => {
                setActiveTab("explore");
                setSearchQuery("");
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "explore"
                  ? "text-gray-900 border-b-2 border-gray-900"
                  : "text-gray-500"
              }`}
            >
              Explorer
            </button>
            <button
              onClick={() => {
                setActiveTab("requests");
                setSearchQuery("");
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "requests"
                  ? "text-gray-900 border-b-2 border-gray-900"
                  : "text-gray-500"
              }`}
            >
              Demandes Reçues
              {requestUsers.length > 0 && activeTab !== "requests" && (
                <span className="absolute top-2 right-4 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                  {requestUsers.length}
                </span>
              )}
            </button>
          </div>

          {/* Search input - Visible uniquement dans l'onglet Explorer */}
          {activeTab === "explore" && (
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur (nom, pseudo)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users list - Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
            {activeTab === "explore" && !searchQuery.trim() ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <Search className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-sm">
                  Tapez un nom ou un pseudo pour rechercher
                </p>
              </div>
            ) : displayedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <p className="text-gray-500 text-sm">
                  {activeTab === "explore"
                    ? searchQuery
                      ? "Aucun utilisateur trouvé"
                      : "Tapez pour rechercher"
                    : "Aucune demande reçue"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {displayedUsers.map((user: any) => {
                  const status = getRelationshipStatus(user.id);

                  return (
                    <motion.div
                      key={user.id}
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
                              {(user.full_name || user.username)
                                ?.charAt(0)
                                ?.toUpperCase() || "U"}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* User info */}
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900 text-[15px]">
                          {user.full_name || user.username || "Anonyme"}
                        </h3>
                        {user.username && user.full_name && (
                          <p className="text-sm text-gray-500">
                            @{user.username}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {activeTab === "explore" && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (status === "FOLLOWING") {
                              unfollowMutation.mutate(user.id);
                            } else {
                              followMutation.mutate(user.id);
                            }
                          }}
                          disabled={
                            followMutation.isPending ||
                            unfollowMutation.isPending
                          }
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                            status === "FOLLOWING"
                              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              : "bg-blue-500 text-white hover:bg-blue-600"
                          } ${
                            followMutation.isPending ||
                            unfollowMutation.isPending
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {status === "FOLLOWING" ? (
                            <>
                              <Check className="w-4 h-4" />
                              Suivi
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Suivre
                            </>
                          )}
                        </motion.button>
                      )}

                      {activeTab === "requests" && (
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => followMutation.mutate(user.id)}
                            disabled={followMutation.isPending}
                            className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            Accepter
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => unfollowMutation.mutate(user.id)}
                            disabled={unfollowMutation.isPending}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            <XIcon className="w-4 h-4" />
                            Refuser
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

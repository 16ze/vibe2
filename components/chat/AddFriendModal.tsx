"use client";

import { vibe } from "@/api/vibeClient";
import { useUI } from "@/contexts/UIContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Search, UserPlus, X, X as XIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

type RelationshipStatus =
  | "NONE"
  | "REQUEST_SENT"
  | "REQUEST_RECEIVED"
  | "FRIENDS";

/**
 * Modale pour ajouter des amis avec 2 onglets : Explorer et Demandes Reçues
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
  const queryClient = useQueryClient();

  /**
   * Masque la BottomNav quand la modale est ouverte
   * La réaffiche quand la modale est fermée
   * Pattern robuste avec délai de sécurité pour les animations
   */
  useEffect(() => {
    if (isOpen) {
      hideBottomNav();
    } else {
      // Délai de sécurité pour laisser l'animation de fermeture se finir si besoin
      const timer = setTimeout(() => {
        showBottomNav();
      }, 100);
      return () => clearTimeout(timer);
    }

    // Sécurité ultime au démontage
    return () => {
      showBottomNav();
    };
  }, [isOpen, hideBottomNav, showBottomNav]);

  /**
   * Récupère tous les utilisateurs disponibles
   */
  const { data: allUsers = [] } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      try {
        return await vibe.integrations.Core.getAllUsers();
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    },
    enabled: isOpen,
  });

  /**
   * Récupère toutes les relations (Follow) de l'utilisateur actuel
   */
  const { data: relationships = [], refetch: refetchRelationships } = useQuery({
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
        const allRelations = [...sent, ...received];
        console.log("Relations récupérées:", allRelations);
        return allRelations;
      } catch (error) {
        console.error("Error fetching relationships:", error);
        return [];
      }
    },
    enabled: isOpen && !!currentUser,
    refetchOnWindowFocus: true, // Rafraîchit quand la fenêtre reprend le focus
  });

  /**
   * Détermine le statut de relation avec un utilisateur
   */
  const getRelationshipStatus = (userEmail: string): RelationshipStatus => {
    if (!currentUser?.email || userEmail === currentUser.email) return "NONE";

    const sent = relationships.find(
      (rel: any) =>
        rel.follower_email === currentUser.email &&
        rel.following_email === userEmail
    );
    const received = relationships.find(
      (rel: any) =>
        rel.follower_email === userEmail &&
        rel.following_email === currentUser.email
    );

    // Si les deux relations existent avec status FRIENDS ou active, ils sont amis
    if (
      sent &&
      received &&
      (sent.status === "FRIENDS" || sent.status === "active") &&
      (received.status === "FRIENDS" || received.status === "active")
    ) {
      return "FRIENDS";
    } else if (sent) {
      // Vérifie le statut de la relation envoyée
      if (sent.status === "FRIENDS" || sent.status === "active") {
        return "FRIENDS";
      } else if (sent.status === "REQUEST_SENT" || sent.status === "pending") {
        return "REQUEST_SENT";
      }
    } else if (received) {
      // Vérifie le statut de la relation reçue
      if (received.status === "FRIENDS" || received.status === "active") {
        return "FRIENDS";
      } else if (
        received.status === "REQUEST_SENT" ||
        received.status === "pending" ||
        received.status === "REQUEST_RECEIVED"
      ) {
        return "REQUEST_RECEIVED";
      }
    }

    return "NONE";
  };

  /**
   * Mutation pour envoyer une demande d'ami
   */
  const sendRequestMutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const existing = relationships.find(
        (rel: any) =>
          rel.follower_email === currentUser.email &&
          rel.following_email === userEmail
      );

      if (existing) {
        // Met à jour le statut existant
        return await vibe.entities.Follow.update(existing.id, {
          status: "REQUEST_SENT",
          created_date: new Date().toISOString(),
        });
      } else {
        // Crée une nouvelle relation
        return await vibe.entities.Follow.create({
          follower_email: currentUser.email,
          following_email: userEmail,
          status: "REQUEST_SENT",
          created_date: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["relationships", currentUser?.email],
      });
    },
  });

  /**
   * Mutation pour accepter une demande
   */
  const acceptRequestMutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const received = relationships.find(
        (rel: any) =>
          rel.follower_email === userEmail &&
          rel.following_email === currentUser.email
      );

      if (received) {
        // Met à jour la relation reçue
        await vibe.entities.Follow.update(received.id, {
          status: "FRIENDS",
        });

        // Crée ou met à jour la relation inverse
        const sent = relationships.find(
          (rel: any) =>
            rel.follower_email === currentUser.email &&
            rel.following_email === userEmail
        );

        if (sent) {
          await vibe.entities.Follow.update(sent.id, {
            status: "FRIENDS",
          });
        } else {
          await vibe.entities.Follow.create({
            follower_email: currentUser.email,
            following_email: userEmail,
            status: "FRIENDS",
            created_date: new Date().toISOString(),
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["relationships", currentUser?.email],
      });
    },
  });

  /**
   * Mutation pour refuser une demande
   */
  const rejectRequestMutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const received = relationships.find(
        (rel: any) =>
          rel.follower_email === userEmail &&
          rel.following_email === currentUser.email
      );

      if (received) {
        await vibe.entities.Follow.delete(received.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["relationships", currentUser?.email],
      });
    },
  });

  /**
   * Filtre les utilisateurs selon l'onglet actif
   */
  const getFilteredUsers = () => {
    if (activeTab === "explore") {
      // Affiche les utilisateurs qui ne sont pas encore amis
      const otherUsers = allUsers.filter(
        (user: any) => user.email !== currentUser?.email
      );
      return otherUsers.filter((user: any) => {
        const status = getRelationshipStatus(user.email);
        return status === "NONE" || status === "REQUEST_SENT";
      });
    } else {
      // Pour les demandes reçues, on récupère les emails depuis les relations
      // et on crée des objets utilisateur temporaires si nécessaire
      const receivedRequests = relationships.filter(
        (rel: any) =>
          rel.following_email === currentUser?.email &&
          (rel.status === "REQUEST_RECEIVED" || rel.status === "pending")
      );

      console.log("Demandes reçues trouvées:", receivedRequests);

      // Crée une liste d'utilisateurs à partir des demandes reçues
      const requestUsers = receivedRequests.map((rel: any) => {
        // Cherche l'utilisateur dans allUsers
        const user = allUsers.find((u: any) => u.email === rel.follower_email);

        // Si l'utilisateur n'existe pas, crée un objet temporaire
        if (!user) {
          const emailParts = rel.follower_email.split("@")[0];
          return {
            email: rel.follower_email,
            full_name:
              emailParts.charAt(0).toUpperCase() + emailParts.slice(1) ||
              "Utilisateur Test",
            username: emailParts || "user",
            avatar_url: null,
          };
        }

        return user;
      });

      console.log("Utilisateurs de demandes:", requestUsers);
      return requestUsers;
    }
  };

  const filteredUsers = getFilteredUsers().filter(
    (user: any) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              {getFilteredUsers().length > 0 && activeTab !== "requests" && (
                <span className="absolute top-2 right-4 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                  {getFilteredUsers().length}
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
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Users list - Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <p className="text-gray-500 text-sm">
                  {activeTab === "explore"
                    ? searchQuery
                      ? "Aucun utilisateur trouvé"
                      : "Aucun utilisateur disponible"
                    : "Aucune demande reçue"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredUsers.map((user: any) => {
                  const status = getRelationshipStatus(user.email);

                  return (
                    <motion.div
                      key={user.email}
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

                      {/* Actions */}
                      {activeTab === "explore" && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => sendRequestMutation.mutate(user.email)}
                          disabled={status === "REQUEST_SENT"}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                            status === "REQUEST_SENT"
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-blue-500 text-white hover:bg-blue-600"
                          }`}
                        >
                          {status === "REQUEST_SENT" ? (
                            <>
                              <Check className="w-4 h-4" />
                              Demande envoyée
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Ajouter
                            </>
                          )}
                        </motion.button>
                      )}

                      {activeTab === "requests" && (
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              acceptRequestMutation.mutate(user.email)
                            }
                            className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Accepter
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              rejectRequestMutation.mutate(user.email)
                            }
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
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

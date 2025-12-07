"use client";

import { useAuth } from "@/contexts/AuthContext";
import { followUser, isFollowing, unfollowUser } from "@/services/socialService";
import { AnimatePresence, motion } from "framer-motion";
import { Check, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

interface UsersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: User[];
  onUpdate?: () => void;
}

export default function UsersListModal({
  isOpen,
  onClose,
  title,
  users,
  onUpdate,
}: UsersListModalProps) {
  const { user: currentUser } = useAuth();
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  /**
   * Vérifie le statut de suivi pour chaque utilisateur
   */
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const checkStatuses = async () => {
      const statuses: Record<string, boolean> = {};
      for (const user of users) {
        if (user.id !== currentUser.id) {
          statuses[user.id] = await isFollowing(currentUser.id, user.id);
        }
      }
      setFollowingStatus(statuses);
    };

    checkStatuses();
  }, [isOpen, users, currentUser]);

  /**
   * Gère le suivi/désabonnement
   */
  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUser || targetUserId === currentUser.id) return;

    setLoading((prev) => ({ ...prev, [targetUserId]: true }));

    try {
      const isCurrentlyFollowing = followingStatus[targetUserId];

      if (isCurrentlyFollowing) {
        await unfollowUser(currentUser.id, targetUserId);
        setFollowingStatus((prev) => ({ ...prev, [targetUserId]: false }));
      } else {
        await followUser(currentUser.id, targetUserId);
        setFollowingStatus((prev) => ({ ...prev, [targetUserId]: true }));
      }

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setLoading((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto">
            {users.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">Aucun utilisateur</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 flex-shrink-0">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name || user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-purple-500">
                            {(user.full_name || user.username || "U")[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {user.full_name || user.username}
                        </p>
                        {user.username && (
                          <p className="text-sm text-gray-500 truncate">
                            @{user.username}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bouton Suivre/Abonné */}
                    {currentUser && user.id !== currentUser.id && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleFollowToggle(user.id)}
                        disabled={loading[user.id]}
                        className={`ml-3 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 flex-shrink-0 ${
                          followingStatus[user.id]
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {loading[user.id] ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : followingStatus[user.id] ? (
                          <>
                            <Check className="w-4 h-4" />
                            Abonné
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            Suivre
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

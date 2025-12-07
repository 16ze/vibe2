"use client";

import { followUser, removeFollower } from "@/services/socialService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, Heart, MessageSquare, UserPlus, X } from "lucide-react";
import { useState } from "react";

/**
 * Types de notifications
 */
export type NotificationType = "like" | "comment" | "follow" | "friend_request";

/**
 * Interface pour une notification
 */
export interface Notification {
  id: string;
  type: NotificationType;
  author_name: string;
  author_avatar?: string;
  author_email: string;
  content?: string; // Pour les commentaires
  post_id?: string; // Pour les likes/commentaires
  post_media_url?: string; // Miniature du post
  created_date: string;
  isRead: boolean;
}

/**
 * Props du composant NotificationItem
 */
interface NotificationItemProps {
  /**
   * Notification à afficher
   */
  notification: Notification;

  /**
   * Utilisateur actuel
   */
  currentUser: any;

  /**
   * Callback appelé quand une action est effectuée (ex: accepter demande)
   */
  onAction?: () => void;
}

/**
 * Composant NotificationItem
 * Affiche une notification avec un layout adapté selon le type
 */
export default function NotificationItem({
  notification,
  currentUser,
  onAction,
}: NotificationItemProps) {
  const queryClient = useQueryClient();
  // État local pour le bouton "Suivre en retour" (Optimistic UI)
  const [isFollowingBack, setIsFollowingBack] = useState(false);
  const [isFollowingBackLoading, setIsFollowingBackLoading] = useState(false);

  /**
   * Mutation pour accepter une demande d'ami
   * MIGRÉ : Utilise maintenant followUser() de socialService au lieu de vibeClient
   */
  const acceptRequestMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!currentUser?.id) throw new Error("User not authenticated");
      // Accepter = suivre en retour (crée la relation mutuelle)
      await followUser(currentUser.id, targetUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["relationships", currentUser?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["followers", currentUser?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["following", currentUser?.id],
      });
      onAction?.();
    },
  });

  /**
   * Mutation pour refuser une demande d'ami
   * MIGRÉ : Utilise maintenant removeFollower() de socialService au lieu de vibeClient
   */
  const rejectRequestMutation = useMutation({
      mutationFn: async (targetUserId: string) => {
      if (!currentUser?.id) throw new Error("User not authenticated");
      // Refuser = supprimer le follower (removeFollower)
      await removeFollower(currentUser.id, targetUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["relationships", currentUser?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["followers", currentUser?.id],
      });
      onAction?.();
    },
  });

  /**
   * Génère le texte de la notification selon le type
   */
  const getNotificationText = () => {
    switch (notification.type) {
      case "like":
        return `${notification.author_name} a aimé votre vibe`;
      case "comment":
        return `${notification.author_name} a commenté : "${notification.content}"`;
      case "follow":
        return `${notification.author_name} a commencé à vous suivre`;
      case "friend_request":
        return `${notification.author_name} vous a envoyé une demande d'ami`;
      default:
        return "Nouvelle notification";
    }
  };

  /**
   * Génère l'icône selon le type
   */
  const getNotificationIcon = () => {
    switch (notification.type) {
      case "like":
        return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "follow":
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case "friend_request":
        return <UserPlus className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
        !notification.isRead ? "bg-blue-50/50" : ""
      }`}
    >
      {/* Avatar de l'auteur */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {notification.author_avatar ? (
            <img
              src={notification.author_avatar}
              alt={notification.author_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold">
              {notification.author_name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>
      </div>

      {/* Contenu de la notification */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {/* Icône du type */}
          <div className="flex-shrink-0 mt-0.5">{getNotificationIcon()}</div>

          {/* Texte */}
          <div className="flex-1">
            <p className="text-sm text-gray-900 leading-relaxed">
              <span className="font-semibold">{notification.author_name}</span>{" "}
              {getNotificationText()
                .replace(notification.author_name, "")
                .trim()}
            </p>
          </div>
        </div>

        {/* Actions pour les demandes d'ami */}
        {notification.type === "friend_request" && (
          <div className="flex items-center gap-2 mt-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                acceptRequestMutation.mutate(notification.author_email) // author_email contient l'ID
              }
              disabled={acceptRequestMutation.isPending}
              className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Check className="w-3 h-3" />
              Accepter
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                rejectRequestMutation.mutate(notification.author_email) // author_email contient l'ID
              }
              disabled={rejectRequestMutation.isPending}
              className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <X className="w-3 h-3" />
              Refuser
            </motion.button>
          </div>
        )}

        {/* Bouton "S'abonner en retour" pour les follows */}
        {notification.type === "follow" && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              if (!currentUser?.id || isFollowingBack || isFollowingBackLoading) return;

              // IMPORTANT : Optimistic UI - Met à jour l'état local immédiatement
              setIsFollowingBack(true);
              setIsFollowingBackLoading(true);

              try {
                // Récupère l'ID de l'auteur depuis author_email (qui contient l'ID dans notre cas)
                const targetId = notification.author_email;
                
                // Appelle socialService.followUser
                await followUser(currentUser.id, targetId);

                // Invalide les queries pour rafraîchir les données
                queryClient.invalidateQueries({
                  queryKey: ["following-ids", currentUser.id],
                });
                queryClient.invalidateQueries({
                  queryKey: ["profile-stats", currentUser.id],
                });

                // Appelle le callback si fourni
                onAction?.();
              } catch (error) {
                console.error("[NotificationItem] Error following back:", error);
                // En cas d'erreur, revert l'état optimiste
                setIsFollowingBack(false);
                alert("Erreur lors de l'abonnement. Veuillez réessayer.");
              } finally {
                setIsFollowingBackLoading(false);
              }
            }}
            disabled={isFollowingBack || isFollowingBackLoading}
            className={`mt-2 px-4 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
              isFollowingBack
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-blue-500 text-white hover:bg-blue-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isFollowingBackLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Chargement...</span>
              </>
            ) : isFollowingBack ? (
              <>
                <Check className="w-3 h-3" />
                <span>Abonné</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3" />
                <span>S'abonner en retour</span>
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Miniature du post (pour likes/commentaires) */}
      {(notification.type === "like" || notification.type === "comment") &&
        notification.post_media_url && (
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={notification.post_media_url}
                alt="Post"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
    </motion.div>
  );
}

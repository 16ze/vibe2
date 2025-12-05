"use client";

import { vibe } from "@/api/vibeClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, Heart, MessageSquare, UserPlus, X } from "lucide-react";

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

  /**
   * Mutation pour accepter une demande d'ami
   */
  const acceptRequestMutation = useMutation({
    mutationFn: async (userEmail: string) => {
      // Récupère les relations existantes
      const sent = await vibe.entities.Follow.filter({
        follower_email: currentUser.email,
        following_email: userEmail,
      });
      const received = await vibe.entities.Follow.filter({
        follower_email: userEmail,
        following_email: currentUser.email,
      });

      if (received.length > 0) {
        // Met à jour la relation reçue
        await vibe.entities.Follow.update(received[0].id, {
          status: "FRIENDS",
        });

        // Crée ou met à jour la relation inverse
        if (sent.length > 0) {
          await vibe.entities.Follow.update(sent[0].id, {
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
        queryKey: ["relationships", currentUser.email],
      });
      onAction?.();
    },
  });

  /**
   * Mutation pour refuser une demande d'ami
   */
  const rejectRequestMutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const received = await vibe.entities.Follow.filter({
        follower_email: userEmail,
        following_email: currentUser.email,
      });

      if (received.length > 0) {
        await vibe.entities.Follow.delete(received[0].id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["relationships", currentUser.email],
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
                acceptRequestMutation.mutate(notification.author_email)
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
                rejectRequestMutation.mutate(notification.author_email)
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
            className="mt-2 px-4 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-full hover:bg-blue-600 transition-colors"
          >
            S'abonner en retour
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

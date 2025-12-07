"use client";

import NotificationItem, {
  Notification as NotificationItemType,
} from "@/components/activity/NotificationItem";
import PullToRefresh from "@/components/common/PullToRefresh";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import {
  getNotifications,
  markAllNotificationsAsRead,
} from "@/services/notificationService";
import { motion } from "framer-motion";
import { Bell, ChevronLeft } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

/**
 * Convertit une notification Supabase en format NotificationItem
 */
const formatNotification = (notif: any): NotificationItemType | null => {
  if (!notif || !notif.profiles) return null;

  const actor = notif.profiles;
  // posts peut être un objet ou un array selon la structure Supabase
  const post = Array.isArray(notif.posts) ? notif.posts[0] : notif.posts;

  // Détermine le type de notification
  let type: NotificationItemType["type"] = "like";
  if (notif.type === "comment") {
    type = "comment";
  } else if (notif.type === "follow") {
    type = "follow";
  } else if (notif.type === "message") {
    // Les messages ne sont pas affichés dans Activity, on les ignore
    return null;
  }

  return {
    id: notif.id,
    type,
    author_name: actor.full_name || actor.username || "Anonyme",
    author_avatar: actor.avatar_url,
    author_email: actor.id, // Utilise l'ID comme email pour compatibilité
    content: notif.commentContent, // Pour les commentaires
    post_id: notif.resource_id || post?.id,
    post_media_url: post?.media_url,
    created_date: notif.created_at,
    isRead: notif.is_read || false,
  };
};

/**
 * Groupe les notifications par date
 * Utilise des vérifications de date manuelles pour éviter les problèmes SSR
 */
const groupNotificationsByDate = (notifications: NotificationItemType[]) => {
  const groups: {
    label: string;
    notifications: NotificationItemType[];
  }[] = [];

  // Vérifie que nous sommes côté client
  if (typeof window === "undefined") {
    return groups;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const newNotifications = notifications.filter((n) => !n.isRead);
  const todayNotifications = notifications.filter((n) => {
    if (!n.isRead) return false;
    const notifDate = new Date(n.created_date);
    return notifDate >= today;
  });
  const thisWeekNotifications = notifications.filter((n) => {
    if (!n.isRead) return false;
    const notifDate = new Date(n.created_date);
    return notifDate >= weekAgo && notifDate < today;
  });
  const olderNotifications = notifications.filter((n) => {
    if (!n.isRead) return false;
    const notifDate = new Date(n.created_date);
    return notifDate < weekAgo;
  });

  if (newNotifications.length > 0) {
    groups.push({ label: "Nouveau", notifications: newNotifications });
  }
  if (todayNotifications.length > 0) {
    groups.push({ label: "Aujourd'hui", notifications: todayNotifications });
  }
  if (thisWeekNotifications.length > 0) {
    groups.push({
      label: "Cette semaine",
      notifications: thisWeekNotifications,
    });
  }
  if (olderNotifications.length > 0) {
    groups.push({ label: "Plus ancien", notifications: olderNotifications });
  }

  return groups;
};

/**
 * Page Activity - Centre de notifications
 * Affiche toutes les interactions sociales (likes, commentaires, follows, demandes d'ami)
 */
export default function Activity() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { markActivityAsRead } = useNotification();
  const [notifications, setNotifications] = useState<NotificationItemType[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Marque le composant comme monté côté client
   * Évite les problèmes d'hydratation SSR
   */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Charge les notifications depuis Supabase
   */
  const loadNotifications = async () => {
    if (!currentUser?.id || !isMounted) return;

    try {
      setIsLoading(true);
      const supabaseNotifications = await getNotifications(currentUser.id, 50);
      
      // Convertit les notifications Supabase en format NotificationItem
      const formatted = supabaseNotifications
        .map(formatNotification)
        .filter((n): n is NotificationItemType => n !== null);
      
      setNotifications(formatted);
    } catch (error) {
      console.error("[Activity] Error loading notifications:", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Charge les notifications au montage et quand l'utilisateur change
   */
  useEffect(() => {
    if (isMounted && currentUser?.id) {
      loadNotifications();
      // Marque toutes les notifications comme lues quand on ouvre la page
      markActivityAsRead().catch((error) => {
        console.error("[Activity] Error marking activity as read:", error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, currentUser?.id]); // markActivityAsRead est stable, pas besoin de l'ajouter aux dépendances

  /**
   * Groupe les notifications par date
   */
  const groupedNotifications = isMounted
    ? groupNotificationsByDate(notifications)
    : [];

  /**
   * Compte les notifications non lues
   */
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!isMounted || isLoading || !currentUser) {
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
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </motion.button>
          <h1 className="text-lg font-bold text-gray-900">Activité</h1>
          <div className="w-10" /> {/* Espaceur pour centrer le titre */}
        </div>
      </header>

      {/* PullToRefresh : Enveloppe la liste des notifications */}
      <PullToRefresh onRefresh={loadNotifications}>
        {/* Liste des notifications */}
        {/* IMPORTANT : pb-24 pour éviter que les éléments soient cachés par la BottomNav */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune notification
            </h2>
            <p className="text-sm text-gray-500">
              Tes notifications apparaîtront ici quand tu auras des interactions
            </p>
          </div>
        ) : (
          groupedNotifications.map((group) => (
            <div key={group.label} className="mb-6">
              {/* Label du groupe */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {group.label}
                </h2>
              </div>

              {/* Liste des notifications du groupe */}
              <div className="divide-y divide-gray-50">
                {group.notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    currentUser={currentUser}
                    onAction={async () => {
                      // Marque la notification comme lue dans Supabase
                      try {
                        const { markNotificationAsRead } = await import(
                          "@/services/notificationService"
                        );
                        await markNotificationAsRead(notification.id);
                        // Rafraîchit la liste
                        await loadNotifications();
                      } catch (error) {
                        console.error("[Activity] Error marking notification as read:", error);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
        </div>
      </PullToRefresh>
    </div>
  );
}

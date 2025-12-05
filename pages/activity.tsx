"use client";

import { vibe } from "@/api/vibeClient";
import NotificationItem, {
  Notification,
} from "@/components/activity/NotificationItem";
import { motion } from "framer-motion";
import { Bell, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// Suppression de l'import date-fns pour éviter les problèmes SSR
// Utilisation de vérifications de date manuelles

/**
 * Génère des notifications mock pour tester la page
 */
const generateMockNotifications = (
  currentUserEmail: string
): Notification[] => {
  const mockUsers = [
    {
      name: "Lucas",
      email: "lucas@example.com",
      avatar: "https://i.pravatar.cc/150?u=lucas",
    },
    {
      name: "Emma",
      email: "emma@example.com",
      avatar: "https://i.pravatar.cc/150?u=emma",
    },
    {
      name: "Thomas",
      email: "thomas@example.com",
      avatar: "https://i.pravatar.cc/150?u=thomas",
    },
    {
      name: "Sofiane",
      email: "sofiane@example.com",
      avatar: "https://i.pravatar.cc/150?u=sofiane",
    },
    {
      name: "Léa",
      email: "lea@example.com",
      avatar: "https://i.pravatar.cc/150?u=lea",
    },
    {
      name: "Sarah",
      email: "sarah@example.com",
      avatar: "https://i.pravatar.cc/150?u=sarah",
    },
    {
      name: "Alex",
      email: "alex@example.com",
      avatar: "https://i.pravatar.cc/150?u=alex",
    },
    {
      name: "Marie",
      email: "marie@example.com",
      avatar: "https://i.pravatar.cc/150?u=marie",
    },
  ];

  const mockPosts = [
    { id: "post-1", media_url: "https://picsum.photos/400/400?random=1" },
    { id: "post-2", media_url: "https://picsum.photos/400/400?random=2" },
    { id: "post-3", media_url: "https://picsum.photos/400/400?random=3" },
  ];

  const notifications: Notification[] = [];

  // Notifications d'aujourd'hui (nouvelles)
  notifications.push(
    {
      id: "notif-1",
      type: "like",
      author_name: mockUsers[0].name,
      author_avatar: mockUsers[0].avatar,
      author_email: mockUsers[0].email,
      post_id: mockPosts[0].id,
      post_media_url: mockPosts[0].media_url,
      created_date: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Il y a 30 min
      isRead: false,
    },
    {
      id: "notif-2",
      type: "comment",
      author_name: mockUsers[1].name,
      author_avatar: mockUsers[1].avatar,
      author_email: mockUsers[1].email,
      content: "Trop fort !",
      post_id: mockPosts[1].id,
      post_media_url: mockPosts[1].media_url,
      created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Il y a 2h
      isRead: false,
    },
    {
      id: "notif-3",
      type: "friend_request",
      author_name: mockUsers[2].name,
      author_avatar: mockUsers[2].avatar,
      author_email: mockUsers[2].email,
      created_date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // Il y a 3h
      isRead: false,
    },
    {
      id: "notif-4",
      type: "follow",
      author_name: mockUsers[3].name,
      author_avatar: mockUsers[3].avatar,
      author_email: mockUsers[3].email,
      created_date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // Il y a 5h
      isRead: true,
    }
  );

  // Notifications d'aujourd'hui (lues)
  notifications.push(
    {
      id: "notif-5",
      type: "like",
      author_name: mockUsers[4].name,
      author_avatar: mockUsers[4].avatar,
      author_email: mockUsers[4].email,
      post_id: mockPosts[2].id,
      post_media_url: mockPosts[2].media_url,
      created_date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // Il y a 6h
      isRead: true,
    },
    {
      id: "notif-6",
      type: "comment",
      author_name: mockUsers[5].name,
      author_avatar: mockUsers[5].avatar,
      author_email: mockUsers[5].email,
      content: "J'adore ça !",
      post_id: mockPosts[0].id,
      post_media_url: mockPosts[0].media_url,
      created_date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // Il y a 8h
      isRead: true,
    }
  );

  // Notifications de cette semaine
  notifications.push(
    {
      id: "notif-7",
      type: "follow",
      author_name: mockUsers[6].name,
      author_avatar: mockUsers[6].avatar,
      author_email: mockUsers[6].email,
      created_date: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000
      ).toISOString(), // Il y a 2 jours
      isRead: true,
    },
    {
      id: "notif-8",
      type: "like",
      author_name: mockUsers[7].name,
      author_avatar: mockUsers[7].avatar,
      author_email: mockUsers[7].email,
      post_id: mockPosts[1].id,
      post_media_url: mockPosts[1].media_url,
      created_date: new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000
      ).toISOString(), // Il y a 3 jours
      isRead: true,
    }
  );

  return notifications;
};

/**
 * Groupe les notifications par date
 * Utilise des vérifications de date manuelles pour éviter les problèmes SSR
 */
const groupNotificationsByDate = (notifications: Notification[]) => {
  const groups: {
    label: string;
    notifications: Notification[];
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  /**
   * Marque le composant comme monté côté client
   * Évite les problèmes d'hydratation SSR
   */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Récupère l'utilisateur actuel
   */
  useEffect(() => {
    if (isMounted) {
      vibe.auth
        .me()
        .then(setCurrentUser)
        .catch(() => {});
    }
  }, [isMounted]);

  /**
   * Génère les notifications mock au chargement
   */
  useEffect(() => {
    if (isMounted && currentUser?.email) {
      const mockNotifications = generateMockNotifications(currentUser.email);
      setNotifications(mockNotifications);
    }
  }, [isMounted, currentUser]);

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

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

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

      {/* Liste des notifications */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
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
                    onAction={() => {
                      // Rafraîchit la liste après une action
                      const updated = notifications.map((n) =>
                        n.id === notification.id ? { ...n, isRead: true } : n
                      );
                      setNotifications(updated);
                    }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

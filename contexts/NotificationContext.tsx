"use client";

import { vibe } from "@/api/vibeClient";
import { supabase } from "@/lib/supabase";
import { markAllNotificationsAsRead } from "@/services/notificationService";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, MessageCircle, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Interface pour un toast de notification
 */
interface Toast {
  id: string;
  message: string;
  type: "message" | "activity" | "info" | "success" | "error";
  visible: boolean;
}

/**
 * Interface du contexte de notifications
 */
interface NotificationContextType {
  unreadMessagesCount: number;
  unreadActivityCount: number;
  showToast: (message: string, type?: Toast["type"]) => void;
  setUnreadMessagesCount: (count: number) => void;
  setUnreadActivityCount: (count: number) => void;
  refreshUnreadCounts: () => void;
  markActivityAsRead: () => Promise<void>;
}

/**
 * Contexte des notifications
 */
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

/**
 * Composant Toast individuel
 */
function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: (id: string) => void;
}) {
  /**
   * Retourne l'icône appropriée selon le type de toast
   */
  const getIcon = () => {
    switch (toast.type) {
      case "message":
        return <MessageCircle className="w-5 h-5" />;
      case "activity":
        return <Bell className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  /**
   * Retourne la couleur de l'icône selon le type
   */
  const getIconColor = () => {
    switch (toast.type) {
      case "message":
        return "text-blue-400";
      case "activity":
        return "text-pink-400";
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      default:
        return "text-indigo-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl"
    >
      <span className={getIconColor()}>{getIcon()}</span>
      <p className="text-white text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

/**
 * Provider du contexte de notifications
 * Gère les compteurs de messages/activités non lus et les toasts
 */
export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Affiche un toast de notification
   * Le toast disparaît automatiquement après 3 secondes
   */
  const showToast = useCallback(
    (message: string, type: Toast["type"] = "info") => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newToast: Toast = { id, message, type, visible: true };

      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss après 3 secondes
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  /**
   * Ferme un toast spécifique
   */
  const closeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Marque toutes les notifications d'activité comme lues
   * Appelée quand l'utilisateur ouvre la page Activity
   */
  const markActivityAsRead = useCallback(async () => {
    try {
      // Récupère l'utilisateur actuel depuis Supabase Auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        console.warn("[NotificationContext] No user found to mark activity as read");
        return;
      }

      // Marque toutes les notifications comme lues dans Supabase
      await markAllNotificationsAsRead(user.id);

      // Réinitialise le compteur local
      setUnreadActivityCount(0);

      console.log("[NotificationContext] All activity notifications marked as read");
    } catch (error) {
      console.error("[NotificationContext] Error marking activity as read:", error);
    }
  }, []);

  /**
   * Récupère le nombre de conversations non lues depuis Supabase
   * Une conversation est non lue si :
   * - L'utilisateur est participant
   * - Le dernier message n'est pas de l'utilisateur (last_message_sender_id !== userId)
   * - Le statut est non lu (is_last_message_read === false)
   */
  const fetchUnreadMessagesCount = useCallback(async (userId: string): Promise<number> => {
    try {
      // 1. Récupère toutes les conversations où l'utilisateur est participant
      const { data: participantConvs, error: participantError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);

      if (participantError || !participantConvs || participantConvs.length === 0) {
        return 0;
      }

      const conversationIds = participantConvs.map((p) => p.conversation_id);

      // 2. Compte les conversations non lues
      const { count, error } = await supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .in("id", conversationIds)
        .eq("is_last_message_read", false)
        .neq("last_message_sender_id", userId);

      if (error) {
        console.error("[NotificationContext] Error fetching unread messages count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("[NotificationContext] Error in fetchUnreadMessagesCount:", error);
      return 0;
    }
  }, []);

  /**
   * Récupère le nombre de notifications d'activité non lues depuis Supabase
   */
  const fetchUnreadActivityCount = useCallback(async (userId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) {
        console.error("[NotificationContext] Error fetching unread activity count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("[NotificationContext] Error in fetchUnreadActivityCount:", error);
      return 0;
    }
  }, []);

  /**
   * Rafraîchit les compteurs de messages et d'activité non lus depuis Supabase
   */
  const refreshUnreadCounts = useCallback(async () => {
    try {
      // Récupère l'utilisateur actuel depuis Supabase Auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        // Pas d'utilisateur connecté, on réinitialise les compteurs
        setUnreadMessagesCount(0);
        setUnreadActivityCount(0);
        return;
      }

      // Récupère les compteurs depuis Supabase
      const [messagesCount, activityCount] = await Promise.all([
        fetchUnreadMessagesCount(user.id),
        fetchUnreadActivityCount(user.id),
      ]);

      setUnreadMessagesCount(messagesCount);
      setUnreadActivityCount(activityCount);
    } catch (error) {
      console.error("[NotificationContext] Error refreshing unread counts:", error);
    }
  }, [fetchUnreadMessagesCount, fetchUnreadActivityCount]);

  /**
   * Demande la permission pour les notifications push du navigateur
   */
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }, []);

  /**
   * Affiche une notification push du navigateur
   */
  const showPushNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return;
      }

      if (Notification.permission === "granted") {
        try {
          const notification = new Notification(title, {
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            tag: "vibe-notification",
            requireInteraction: false,
            ...options,
          });

          // Ferme automatiquement après 5 secondes
          setTimeout(() => {
            notification.close();
          }, 5000);

          // Gère le clic sur la notification
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch (error) {
          console.error("[NotificationContext] Error showing push notification:", error);
        }
      }
    },
    []
  );

  /**
   * Initialise les compteurs au montage et écoute les événements
   */
  useEffect(() => {
    // Demande la permission pour les notifications push au montage
    requestNotificationPermission();

    // Rafraîchit les compteurs au montage
    refreshUnreadCounts();

    // Récupère l'utilisateur pour les abonnements Realtime
    let currentUserId: string | null = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      currentUserId = user?.id || null;
    });

    // Abonnement Realtime pour les conversations (messages non lus)
    const conversationsChannel = supabase
      .channel("notification-conversations")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        () => {
          // Rafraîchit le compteur si une conversation a été mise à jour
          refreshUnreadCounts();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const message = payload.new as any;

          // Vérifie si le message est pour l'utilisateur actuel
          if (currentUserId && message.sender_id !== currentUserId) {
            // Récupère l'utilisateur actuel pour vérifier la participation
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) return;

            // Vérifie si l'utilisateur est participant de la conversation
            const { data: participant } = await supabase
              .from("conversation_participants")
              .select("user_id")
              .eq("conversation_id", message.conversation_id)
              .eq("user_id", user.id)
              .maybeSingle();

            if (participant) {
              // Nouveau message reçu, rafraîchit le compteur
              refreshUnreadCounts();

              // Affiche une notification push si la page n'est pas visible ou si on n'est pas sur /conversations
              const isOnConversationsPage =
                typeof window !== "undefined" &&
                window.location.pathname.startsWith("/conversations");

              if (
                document.visibilityState === "hidden" ||
                !isOnConversationsPage
              ) {
                const { data: sender } = await supabase
                  .from("profiles")
                  .select("username, full_name")
                  .eq("id", message.sender_id)
                  .maybeSingle();

                const senderName = sender?.full_name || sender?.username || "Quelqu'un";
                const preview = message.content || (message.media_url ? "📷 Photo" : "Nouveau message");

                showPushNotification(`${senderName}`, {
                  body: preview,
                  tag: `message-${message.conversation_id}`,
                });
              }
            }
          }
        }
      )
      .subscribe();

    // Abonnement Realtime pour les notifications d'activité
    const notificationsChannel = supabase
      .channel("notification-activities")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        async (payload) => {
          const notification = payload.new as any;

          // Vérifie si la notification est pour l'utilisateur actuel
          const { data: { user } } = await supabase.auth.getUser();
          if (!user?.id || notification.user_id !== user.id) return;

          // Incrémente le compteur local
          setUnreadActivityCount((prev) => prev + 1);

          // Affiche un toast
          showToast("Nouvelle notification", "activity");

          // Affiche une notification push si la page n'est pas visible
          if (document.visibilityState === "hidden") {
            const { data: actor } = await supabase
              .from("profiles")
              .select("username, full_name")
              .eq("id", notification.actor_id)
              .maybeSingle();

            const actorName = actor?.full_name || actor?.username || "Quelqu'un";
            let body = "";

            switch (notification.type) {
              case "like":
                body = `${actorName} a aimé votre post`;
                break;
              case "comment":
                body = `${actorName} a commenté votre post`;
                break;
              case "follow":
                body = `${actorName} vous suit maintenant`;
                break;
              default:
                body = "Nouvelle activité";
            }

            showPushNotification("Nouvelle activité", {
              body,
              tag: `activity-${notification.id}`,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        () => {
          // Rafraîchit le compteur si une notification a été mise à jour (marquée comme lue)
          refreshUnreadCounts();
        }
      )
      .subscribe();

    // Écoute les événements de nouveau message (pour compatibilité)
    const handleNewMessage = (event: CustomEvent) => {
      const { senderName, preview } = event.detail || {};
      showToast(
        senderName
          ? `${senderName}: ${preview || "Nouveau message"}`
          : "Nouveau message reçu",
        "message"
      );
      refreshUnreadCounts();
    };

    // Écoute les événements de nouvelle activité (pour compatibilité)
    const handleNewActivity = (event: CustomEvent) => {
      const { message } = event.detail || {};
      showToast(message || "Nouvelle activité", "activity");
      refreshUnreadCounts();
    };

    // Rafraîchit au retour sur la page (window focus)
    const handleFocus = () => {
      refreshUnreadCounts();
    };

    window.addEventListener("new-message" as any, handleNewMessage);
    window.addEventListener("new-activity" as any, handleNewActivity);
    window.addEventListener("focus", handleFocus);

    // Intervalle de rafraîchissement toutes les 10 secondes pour des mises à jour plus fréquentes
    const interval = setInterval(refreshUnreadCounts, 10000);

    return () => {
      window.removeEventListener("new-message" as any, handleNewMessage);
      window.removeEventListener("new-activity" as any, handleNewActivity);
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [refreshUnreadCounts, showToast, requestNotificationPermission, showPushNotification]);

  /**
   * Valeur mémoïsée du contexte
   */
  const value = useMemo(
    () => ({
      unreadMessagesCount,
      unreadActivityCount,
      showToast,
      setUnreadMessagesCount,
      setUnreadActivityCount,
      refreshUnreadCounts,
      markActivityAsRead,
    }),
    [
      unreadMessagesCount,
      unreadActivityCount,
      showToast,
      refreshUnreadCounts,
      markActivityAsRead,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Container des Toasts */}
      <div className="fixed top-4 left-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onClose={closeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

/**
 * Hook pour utiliser le contexte de notifications
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification doit être utilisé dans un NotificationProvider"
    );
  }
  return context;
}


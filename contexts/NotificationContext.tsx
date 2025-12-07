"use client";

import { vibe } from "@/api/vibeClient";
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
   * Rafraîchit les compteurs de messages non lus
   * depuis les conversations en localStorage
   */
  const refreshUnreadCounts = useCallback(async () => {
    try {
      // Récupère les conversations depuis le client
      const conversations = await vibe.entities.Conversation.list();

      // Calcule le nombre total de messages non lus
      const totalUnread = conversations.reduce((acc: number, conv: any) => {
        return acc + (conv.unread_count || 0);
      }, 0);

      setUnreadMessagesCount(totalUnread);

      // Simule un compteur d'activité (à remplacer par une vraie logique plus tard)
      // Pour l'instant, on simule 2 notifications d'activité non lues
      const activityCount =
        typeof window !== "undefined"
          ? parseInt(localStorage.getItem("vibe_unread_activity") || "0", 10)
          : 0;

      setUnreadActivityCount(activityCount);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des notifications:", error);
    }
  }, []);

  /**
   * Initialise les compteurs au montage et écoute les événements
   */
  useEffect(() => {
    // Rafraîchit les compteurs au montage
    refreshUnreadCounts();

    // Écoute les événements de nouveau message
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

    // Écoute les événements de nouvelle activité
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
    };
  }, [refreshUnreadCounts, showToast]);

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
    }),
    [
      unreadMessagesCount,
      unreadActivityCount,
      showToast,
      refreshUnreadCounts,
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


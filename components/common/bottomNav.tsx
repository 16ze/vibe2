"use client";

import { useNotification } from "@/contexts/NotificationContext";
import { Camera, Home, MessageCircle, Play, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Composant Badge de notification
 * Affiche un compteur ou un point rouge
 */
function NotificationBadge({
  count,
  showDot = false,
}: {
  count: number;
  showDot?: boolean;
}) {
  if (count === 0 && !showDot) return null;

  // Si showDot est true, affiche juste un point (pour l'activité)
  if (showDot) {
    return (
      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
    );
  }

  // Sinon affiche le compteur
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
      <span className="text-white text-[10px] font-bold">
        {count > 9 ? "9+" : count}
      </span>
    </span>
  );
}

/**
 * Composant BottomNav - Barre de navigation inférieure
 * Style adaptatif selon le contexte (dark sur /vibes, light ailleurs)
 * Affiche des badges de notification pour les messages et l'activité
 */
export default function BottomNav() {
  const pathname = usePathname();

  /**
   * Récupère les compteurs de notifications du contexte
   * Utilise un try-catch car le contexte peut ne pas être disponible
   */
  let unreadMessagesCount = 0;
  let unreadActivityCount = 0;

  try {
    const notification = useNotification();
    unreadMessagesCount = notification.unreadMessagesCount;
    unreadActivityCount = notification.unreadActivityCount;
  } catch {
    // Le contexte n'est pas disponible, on continue sans badges
  }

  if (!pathname) return null;

  /**
   * Logique de masquage : cache la barre sur certaines pages
   */
  const isCamera = pathname === "/camera";
  const isMap = pathname === "/map";
  const isChatDetail =
    pathname.includes("/conversations/") && pathname !== "/conversations";
  const isSettings = pathname === "/settings";

  if (isCamera || isMap || isChatDetail || isSettings) return null;

  /**
   * LOGIQUE DE STYLE ADAPTATIF
   * Dark mode sur /vibes, light mode par défaut
   */
  const isVibes = pathname === "/vibes";

  const navClasses = isVibes
    ? "fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-gray-800 z-[50] flex justify-around items-center px-2 pb-safe"
    : "fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-[50] flex justify-around items-center px-2 pb-safe";

  const activeClass = isVibes ? "text-white" : "text-black";
  const inactiveClass = isVibes ? "text-gray-600" : "text-gray-400";

  /**
   * Retourne la classe de couleur selon l'état actif/inactif
   */
  const getIconClass = (path: string) => {
    return pathname === path ? activeClass : inactiveClass;
  };

  return (
    <nav className={navClasses}>
      {/* 1. Feed */}
      <Link
        href="/feed"
        className={`p-2 flex flex-col items-center relative ${getIconClass(
          "/feed"
        )}`}
      >
        <Home size={26} strokeWidth={pathname === "/feed" ? 3 : 2} />
      </Link>

      {/* 2. Vibes */}
      <Link
        href="/vibes"
        className={`p-2 flex flex-col items-center ${getIconClass("/vibes")}`}
      >
        <Play size={26} strokeWidth={pathname === "/vibes" ? 3 : 2} />
      </Link>

      {/* 3. CAMERA (Standardisée - même style que les autres) */}
      <Link
        href="/camera"
        className={`p-2 flex flex-col items-center ${getIconClass("/camera")}`}
      >
        <Camera size={26} strokeWidth={pathname === "/camera" ? 3 : 2} />
      </Link>

      {/* 4. Chat - Avec badge de messages non lus */}
      <Link
        href="/conversations"
        className={`p-2 flex flex-col items-center relative ${getIconClass(
          "/conversations"
        )}`}
      >
        <MessageCircle
          size={26}
          strokeWidth={pathname === "/conversations" ? 3 : 2}
        />
        <NotificationBadge count={unreadMessagesCount} />
      </Link>

      {/* 5. Profil - Avec point d'activité non lue */}
      <Link
        href="/profile"
        className={`p-2 flex flex-col items-center relative ${getIconClass(
          "/profile"
        )}`}
      >
        <User size={26} strokeWidth={pathname === "/profile" ? 3 : 2} />
        <NotificationBadge count={0} showDot={unreadActivityCount > 0} />
      </Link>
    </nav>
  );
}

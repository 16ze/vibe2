"use client";

import VibeFeed from "@/components/vibes/VibeFeed";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

/**
 * Page Vibes - Clone TikTok
 * Affiche un feed vertical de vidéos avec scroll snapping
 * La navigation est gérée par le composant parent (Home)
 */
export default function Vibes() {
  /**
   * Navigation par swipe : Feed <- Vibes -> Camera
   * Seuil plus strict (80px) car la page scrolle verticalement
   * Tolérance verticale réduite pour éviter les faux positifs pendant le scroll
   */
  useSwipeNavigation({
    onSwipeRight: "/feed",
    onSwipeLeft: "/camera",
    threshold: 80, // Seuil plus élevé pour éviter les swipes accidentels
    verticalTolerance: 30, // Tolérance verticale plus stricte
  });

  return (
    <div className="h-[100dvh] w-full relative bg-black overflow-hidden pb-20 pb-safe">
      {/* Feed principal avec scroll snapping */}
      <VibeFeed videoCount={10} />
    </div>
  );
}

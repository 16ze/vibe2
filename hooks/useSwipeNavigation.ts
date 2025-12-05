"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

/**
 * Options de configuration pour le hook de navigation par swipe
 */
interface UseSwipeNavigationOptions {
  /**
   * URL de destination lors d'un swipe vers la gauche (→ écran suivant)
   */
  onSwipeLeft?: string;

  /**
   * URL de destination lors d'un swipe vers la droite (← écran précédent)
   */
  onSwipeRight?: string;

  /**
   * Seuil de déclenchement horizontal en pixels (défaut: 50px)
   */
  threshold?: number;

  /**
   * Tolérance verticale en pixels pour ne pas déclencher pendant le scroll (défaut: 50px)
   */
  verticalTolerance?: number;

  /**
   * Désactive le swipe navigation (utile pour les états modaux)
   */
  disabled?: boolean;
}

/**
 * Hook personnalisé pour la navigation par gestes (swipe) entre les écrans
 * 
 * Navigation: Feed <-> Camera <-> Conversations <-> Profile
 * 
 * @param options - Configuration du swipe (destinations, seuils)
 * @returns Objet avec les handlers à attacher au conteneur si besoin
 * 
 * @example
 * // Dans pages/feed.tsx
 * useSwipeNavigation({ onSwipeLeft: '/camera' });
 * 
 * @example
 * // Dans pages/camera.tsx
 * useSwipeNavigation({ onSwipeRight: '/feed', onSwipeLeft: '/conversations' });
 */
export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  verticalTolerance = 50,
  disabled = false,
}: UseSwipeNavigationOptions) {
  const router = useRouter();

  /**
   * Référence pour stocker les coordonnées de départ du touch
   */
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  /**
   * Référence pour éviter les navigations multiples
   */
  const isNavigatingRef = useRef(false);

  /**
   * Gère le début du touch
   */
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isNavigatingRef.current) return;

      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    },
    [disabled]
  );

  /**
   * Gère la fin du touch et détermine la direction du swipe
   */
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (disabled || isNavigatingRef.current || !touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Reset le point de départ
      touchStartRef.current = null;

      // Vérifie la tolérance verticale (évite le déclenchement pendant le scroll)
      if (Math.abs(deltaY) > verticalTolerance) {
        return;
      }

      // Vérifie le seuil horizontal
      if (Math.abs(deltaX) < threshold) {
        return;
      }

      // Détermine la direction et navigue
      if (deltaX < 0 && onSwipeLeft) {
        // Swipe vers la gauche → écran suivant
        isNavigatingRef.current = true;
        router.push(onSwipeLeft);

        // Reset après un délai pour permettre la navigation
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 500);
      } else if (deltaX > 0 && onSwipeRight) {
        // Swipe vers la droite → écran précédent
        isNavigatingRef.current = true;
        router.push(onSwipeRight);

        // Reset après un délai pour permettre la navigation
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 500);
      }
    },
    [disabled, onSwipeLeft, onSwipeRight, router, threshold, verticalTolerance]
  );

  /**
   * Attache les listeners au document au montage
   */
  useEffect(() => {
    if (disabled) return;

    // Vérifie si on est côté client
    if (typeof window === "undefined") return;

    // Attache les listeners au document pour capturer tous les touches
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Cleanup
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [disabled, handleTouchStart, handleTouchEnd]);

  /**
   * Retourne des handlers manuels si besoin d'un contrôle plus fin
   */
  return {
    handlers: {
      onTouchStart: (e: React.TouchEvent) =>
        handleTouchStart(e.nativeEvent as unknown as TouchEvent),
      onTouchEnd: (e: React.TouchEvent) =>
        handleTouchEnd(e.nativeEvent as unknown as TouchEvent),
    },
    /**
     * Force le reset de l'état de navigation (utile après une modale)
     */
    resetNavigation: () => {
      isNavigatingRef.current = false;
      touchStartRef.current = null;
    },
  };
}

export default useSwipeNavigation;


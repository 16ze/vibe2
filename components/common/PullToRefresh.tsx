"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
}

/**
 * Composant PullToRefresh
 * Permet de tirer vers le bas pour rafraîchir le contenu (comme les apps natives)
 * Style minimaliste avec spinner violet Vibe
 */
export default function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // Refs pour éviter les dépendances dans useEffect
  const isPullingRef = useRef<boolean>(false);
  const pullDistanceRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);
  const onRefreshRef = useRef(onRefresh);

  // Met à jour la ref quand onRefresh change
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // Seuil pour déclencher le refresh (en pixels)
  const PULL_THRESHOLD = 80;
  // Distance maximale de pull (pour éviter de tirer trop loin)
  const MAX_PULL_DISTANCE = 120;

  useEffect(() => {
    if (disabled || isRefreshingRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Ne démarre que si on est en haut de la page
      if (container.scrollTop > 0) return;

      startY.current = e.touches[0].clientY;
      isPullingRef.current = true;
      setIsPulling(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current) return;

      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);

      // Limite la distance de pull
      const limitedDistance = Math.min(distance, MAX_PULL_DISTANCE);
      pullDistanceRef.current = limitedDistance;
      setPullDistance(limitedDistance);
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;

      const currentPullDistance = pullDistanceRef.current;

      // Si on a tiré assez loin, déclenche le refresh
      if (currentPullDistance >= PULL_THRESHOLD) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        pullDistanceRef.current = 0;
        setPullDistance(0);

        try {
          await onRefreshRef.current();
        } catch (error) {
          console.error("[PullToRefresh] Error refreshing:", error);
        } finally {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        }
      } else {
        // Sinon, revient à la position initiale
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }

      isPullingRef.current = false;
      setIsPulling(false);
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [disabled]); // Seulement disabled comme dépendance

  // Calcule l'opacité et la rotation du spinner selon la distance
  const spinnerOpacity = Math.min(1, pullDistance / PULL_THRESHOLD);
  const spinnerRotation = (pullDistance / PULL_THRESHOLD) * 360;

  return (
    <div className="relative h-full w-full">
      {/* Indicateur de pull (spinner violet Vibe) */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center"
            style={{
              height: `${Math.min(pullDistance, MAX_PULL_DISTANCE)}px`,
            }}
          >
            <div
              className="flex flex-col items-center justify-center"
              style={{
                opacity: isRefreshing ? 1 : spinnerOpacity,
              }}
            >
              <Loader2
                className="w-6 h-6 text-purple-600"
                style={{
                  transform: isRefreshing
                    ? "rotate(360deg)"
                    : `rotate(${spinnerRotation}deg)`,
                  transition: isRefreshing
                    ? "transform 1s linear infinite"
                    : "transform 0.1s ease-out",
                }}
              />
              {isRefreshing && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-purple-600 mt-1 font-medium"
                >
                  Actualisation...
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenu avec transformation lors du pull */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto"
        style={{
          transform: isPulling
            ? `translateY(${Math.min(pullDistance, MAX_PULL_DISTANCE)}px)`
            : "translateY(0px)",
          transition: isPulling ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}


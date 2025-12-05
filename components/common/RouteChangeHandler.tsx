"use client";

import { useUI } from "@/contexts/UIContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

/**
 * Composant qui écoute les changements de route et FORCE la BottomNav à réapparaître
 * Sécurité globale radicale pour éviter que la BottomNav reste cachée
 * Compatible avec Next.js Pages Router
 */
export default function RouteChangeHandler() {
  const router = useRouter();
  const { showBottomNav, isBottomNavVisible } = useUI();
  const [isMounted, setIsMounted] = useState(false);

  /**
   * Marque le composant comme monté côté client
   */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Écoute les changements de route et FORCE la BottomNav à réapparaître
   */
  useEffect(() => {
    if (!isMounted || !router) return;

    /**
     * FORCE l'affichage de la BottomNav à CHAQUE changement de route
     */
    const handleRouteChange = (url: string) => {
      console.log(
        "[RouteChangeHandler] Navigating to:",
        url,
        "| Force showing BottomNav"
      );
      showBottomNav();
    };

    // Écoute les événements de route
    router.events.on("routeChangeComplete", handleRouteChange);
    router.events.on("routeChangeError", handleRouteChange);

    // Cleanup : retire les listeners
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
      router.events.off("routeChangeError", handleRouteChange);
    };
  }, [router, showBottomNav, isMounted]);

  /**
   * Sécurité radicale : FORCE l'affichage au montage initial
   */
  useEffect(() => {
    if (isMounted) {
      console.log(
        "[RouteChangeHandler] Initial mount | Force showing BottomNav"
      );
      showBottomNav();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  /**
   * Debug: Log de l'état actuel
   */
  useEffect(() => {
    console.log("[RouteChangeHandler] Current state:", {
      isMounted,
      isBottomNavVisible,
    });
  }, [isMounted, isBottomNavVisible]);

  return null;
}

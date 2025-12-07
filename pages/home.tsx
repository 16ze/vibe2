"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import Camera from "./camera";
import Conversations from "./conversations";
import Feed from "./feed";
import Profile from "./profile";
import Vibes from "./vibes";

/**
 * Page principale de l'application
 * Gère la navigation entre les différents écrans
 * MIGRÉ : Utilise maintenant useAuth() au lieu de vibeClient
 */
export default function Home() {
  const { user: currentUser } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0); // Commence sur Feed
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const containerRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  /**
   * Écoute les événements pour masquer/afficher la BottomNav
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleHideBottomNav = () => setHideBottomNav(true);
    const handleShowBottomNav = () => setHideBottomNav(false);

    window.addEventListener("hide-bottom-nav", handleHideBottomNav);
    window.addEventListener("show-bottom-nav", handleShowBottomNav);

    return () => {
      window.removeEventListener("hide-bottom-nav", handleHideBottomNav);
      window.removeEventListener("show-bottom-nav", handleShowBottomNav);
    };
  }, []);

  /**
   * Configuration des écrans de l'application
   * L'ordre correspond aux onglets de la navigation
   */
  const screens = [
    { id: "feed", component: Feed, darkNav: false },
    { id: "vibes", component: Vibes, darkNav: true },
    { id: "camera", component: Camera, darkNav: true },
    { id: "chat", component: Conversations, darkNav: false },
    { id: "profile", component: Profile, darkNav: false },
  ];

  /**
   * Gère le début du swipe
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  /**
   * Gère le mouvement du swipe
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    currentX.current = e.touches[0].clientX;
  };

  /**
   * Gère la fin du swipe et change d'écran si nécessaire
   */
  const handleTouchEnd = () => {
    const diff = startX.current - currentX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && activeIndex < screens.length - 1) {
        setActiveIndex(activeIndex + 1);
      } else if (diff < 0 && activeIndex > 0) {
        setActiveIndex(activeIndex - 1);
      }
    }

    startX.current = 0;
    currentX.current = 0;
  };

  /**
   * Gère la navigation via la barre de navigation
   */
  const handleNavigate = (index: number) => {
    setActiveIndex(index);
  };

  /**
   * Détermine si la navigation doit être en mode sombre
   */
  const isDarkNav = screens[activeIndex]?.darkNav ?? false;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "tween", duration: 0.15 }}
          className="absolute inset-0"
        >
          {React.createElement(screens[activeIndex].component)}
        </motion.div>
      </AnimatePresence>

      {/* BottomNav est maintenant dans le Layout global */}
    </div>
  );
}

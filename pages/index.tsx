"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Page d'accueil (Splash Screen) de l'application VIBE
 * Première page vue par un visiteur non connecté
 * CORRECTION : Le contenu ne s'affiche que si l'utilisateur est confirmé comme NON CONNECTÉ
 * Design "Electric Vibe" - Violet Électrique → Bleu Cyan
 */
export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  /**
   * Redirige automatiquement selon l'état de connexion
   * Si connecté → /feed
   */
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/feed");
    }
  }, [user, isLoading, router]);

  /**
   * SI : Chargement en cours OU Utilisateur détecté (en attente de redirect)
   * ALORS : Afficher un écran blanc (ou noir) simple
   */
  if (isLoading || user) {
    return <div className="min-h-screen w-full bg-white dark:bg-black" />;
  }

  /**
   * SINON (Chargement fini ET Pas d'user) : Afficher la Landing Page
   */

  /**
   * Splash Screen pour les visiteurs non connectés
   * Dégradé Electric Vibe animé
   */
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fond avec dégradé Electric Vibe animé */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "linear-gradient(135deg, #4F46E5 0%, #9333EA 50%, #06B6D4 100%)",
            "linear-gradient(135deg, #9333EA 0%, #06B6D4 50%, #4F46E5 100%)",
            "linear-gradient(135deg, #06B6D4 0%, #4F46E5 50%, #9333EA 100%)",
            "linear-gradient(135deg, #4F46E5 0%, #9333EA 50%, #06B6D4 100%)",
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Effet de glow en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      {/* Contenu centré */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pb-20">
        {/* Logo VIBE animé */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <motion.h1
            className="text-7xl md:text-8xl font-black mb-4 text-white drop-shadow-2xl"
            animate={{
              textShadow: [
                "0 0 20px rgba(255,255,255,0.5)",
                "0 0 40px rgba(255,255,255,0.3)",
                "0 0 20px rgba(255,255,255,0.5)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            VIBE
          </motion.h1>

          {/* Slogan */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-white/90 text-lg md:text-xl font-medium"
          >
            Capturez l'instant. Partagez la vibe.
          </motion.p>
        </motion.div>

        {/* Boutons d'action en bas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="w-full max-w-sm space-y-4 mt-12"
        >
          {/* Bouton "Se connecter" (Outline blanc) */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/login")}
            className="w-full py-4 px-6 bg-transparent border-2 border-white text-white font-semibold text-lg rounded-2xl hover:bg-white/10 transition-all duration-300"
          >
            Se connecter
          </motion.button>

          {/* Bouton "Créer un compte" (Blanc plein, texte Electric Vibe) */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/signup")}
            className="w-full py-4 px-6 bg-white font-semibold text-lg rounded-2xl hover:shadow-2xl transition-all duration-300"
          >
            <span className="text-gradient-vibe">Créer un compte</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

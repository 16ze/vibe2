"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

/**
 * Liste des routes publiques (accessibles sans authentification)
 */
const PUBLIC_ROUTES = ["/", "/login", "/signup"];

/**
 * Props du composant AuthGuard
 */
interface AuthGuardProps {
  /**
   * Fonction render qui reçoit l'état de la route publique
   * Permet de conditionner l'affichage du Layout
   */
  children: (props: { isPublicRoute: boolean }) => React.ReactNode;
}

/**
 * Composant de protection des routes
 * Vérifie si l'utilisateur est authentifié avant d'afficher le contenu
 * Redirige vers /login si l'utilisateur n'est pas connecté et que la route n'est pas publique
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Vérifie si la route actuelle est publique
   */
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname || "");

  /**
   * Redirection intelligente :
   * 1. Si utilisateur connecté ET route publique → redirige vers /feed
   * 2. Si utilisateur non connecté ET route non publique → redirige vers /login
   */
  useEffect(() => {
    if (isLoading) return;

    // Si l'utilisateur est connecté et essaie d'accéder à une page publique, redirige vers /feed
    if (user && isPublicRoute) {
      router.replace("/feed");
      return;
    }

    // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée, redirige vers /login
    if (!user && !isPublicRoute) {
      router.push("/login");
    }
  }, [isLoading, user, isPublicRoute, router, pathname]);

  /**
   * Affiche un écran de chargement pendant la vérification de l'authentification
   */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Logo Vibe qui pulse */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-4xl font-bold text-gradient-vibe"
          >
            VIBE
          </motion.div>
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  /**
   * Si l'utilisateur n'est pas connecté et que la route n'est pas publique,
   * ne rien afficher (la redirection est en cours)
   */
  if (!user && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Redirection...</p>
        </div>
      </div>
    );
  }

  /**
   * Affiche le contenu si l'utilisateur est connecté ou si la route est publique
   * Passe isPublicRoute à la fonction render pour conditionner l'affichage
   */
  return <>{children({ isPublicRoute })}</>;
}


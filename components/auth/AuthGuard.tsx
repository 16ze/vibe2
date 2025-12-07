"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import React from "react";

/**
 * Liste des routes publiques (accessibles sans authentification)
 */
const PUBLIC_PATHS = ["/", "/login", "/signup"];

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
 * Composant de protection des routes - VERSION SIMPLIFIÉE
 * Supprime tous les écrans noirs et logiques complexes
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Si pas chargé, petit spinner simple, PAS d'écran noir bloquant
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-10">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Vérifie si la route actuelle est publique
  const isPublicPath = router.isReady
    ? PUBLIC_PATHS.includes(router.pathname)
    : false;

  // Redirection simple si nécessaire (sans écran de chargement)
  React.useEffect(() => {
    if (!router.isReady || isLoading) return;

    // Si pas connecté et page privée -> Redirige vers Login
    if (!user && !isPublicPath) {
      router.push("/");
      return;
    }

    // Si connecté et page publique -> Redirige vers Feed
    if (user && isPublicPath) {
      router.push("/feed");
      return;
    }
  }, [user, isLoading, router, isPublicPath]);

  // Redirection simple si nécessaire
  return <>{children({ isPublicRoute: isPublicPath })}</>;
}

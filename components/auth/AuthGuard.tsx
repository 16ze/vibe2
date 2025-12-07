"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

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
 * Composant de protection des routes
 * CORRECTION UX : Bloque tout affichage tant que l'authentification est en cours
 * pour éviter le flash de la page Login avant redirection
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Vérifie si la route actuelle est publique
  const isPublicPath = PUBLIC_PATHS.includes(router.pathname);

  /**
   * Redirection intelligente :
   * 1. Si utilisateur connecté ET route publique → redirige vers /feed
   * 2. Si utilisateur non connecté ET route non publique → redirige vers /
   */
  useEffect(() => {
    if (!isLoading) {
      // Si pas connecté et page privée -> Hop, Login
      if (!user && !isPublicPath) {
        router.push("/");
      }

      // Si connecté et page publique -> Hop, Feed
      if (user && isPublicPath) {
        router.push("/feed");
      }
    }
  }, [user, isLoading, router, isPublicPath]);

  // 1. Pendant le chargement initial -> Écran Noir
  if (isLoading) {
    return <div className="fixed inset-0 z-[9999] bg-black" />;
  }

  // 2. Si connecté mais sur une page publique (Accueil/Login) -> Écran Noir en attendant la redirection
  if (user && isPublicPath) {
    return <div className="fixed inset-0 z-[9999] bg-black" />;
  }

  // 3. Si pas connecté et sur page privée -> Écran Noir en attendant la redirection
  if (!user && !isPublicPath) {
    return <div className="fixed inset-0 z-[9999] bg-black" />;
  }

  // 4. Tout est bon, on affiche la page (avec isPublicRoute pour compatibilité)
  return <>{children({ isPublicRoute: isPublicPath })}</>;
}


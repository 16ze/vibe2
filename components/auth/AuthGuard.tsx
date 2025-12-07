"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

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
 * PATTERN CLIENT-ONLY STRICT : Ne rend rien tant que le client n'est pas prêt
 * Évite les écrans noirs/blancs et les problèmes d'hydratation SSR
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  // IMPORTANT : Tous les hooks doivent être appelés AVANT tous les returns conditionnels
  // Pattern Client-Only strict : Ne rien rendre tant que le client n'est pas prêt
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Vérifie si la route actuelle est publique
  const isPublicPath = router.isReady
    ? PUBLIC_PATHS.includes(router.pathname)
    : false;

  /**
   * Timeout de sécurité pour éviter que l'écran noir reste indéfiniment
   */
  useEffect(() => {
    if (isRedirecting) {
      const timeout = setTimeout(() => {
        console.warn("[AuthGuard] Redirection timeout, showing content anyway");
        setIsRedirecting(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isRedirecting]);

  /**
   * Redirection intelligente :
   * 1. Si utilisateur connecté ET route publique → redirige vers /feed
   * 2. Si utilisateur non connecté ET route non publique → redirige vers /
   * 
   * IMPORTANT : Ne redirige que si !isLoading ET isMounted
   */
  useEffect(() => {
    // Ne fait rien si le router n'est pas prêt, pendant le chargement, ou si pas monté
    if (!router.isReady || isLoading || !isMounted) {
      setIsRedirecting(false);
      return;
    }

    // Vérifie si on est déjà sur la bonne page
    const isOnCorrectPage = (user && !isPublicPath) || (!user && isPublicPath);

    if (isOnCorrectPage) {
      setIsRedirecting(false);
      return;
    }

    // Si pas connecté et page privée -> Redirige vers Login
    if (!user && !isPublicPath) {
      setIsRedirecting(true);
      router
        .push("/")
        .then(() => {
          setIsRedirecting(false);
        })
        .catch((err) => {
          console.error("[AuthGuard] Error redirecting to /:", err);
          setIsRedirecting(false);
        });
      return;
    }

    // Si connecté et page publique -> Redirige vers Feed
    if (user && isPublicPath) {
      setIsRedirecting(true);
      router
        .push("/feed")
        .then(() => {
          setIsRedirecting(false);
        })
        .catch((err) => {
          console.error("[AuthGuard] Error redirecting to /feed:", err);
          setIsRedirecting(false);
        });
      return;
    }
  }, [user, isLoading, router, isPublicPath, isMounted]);

  // MAINTENANT on peut faire les returns conditionnels APRÈS tous les hooks
  // Ne rien rendre tant que le client n'est pas monté
  if (!isMounted) {
    return null;
  }

  // 1. Pendant le chargement initial -> Écran de chargement stable
  if (isLoading) {
    return <div className="min-h-screen bg-black" />;
  }

  // 2. Si le router n'est pas prêt -> Écran de chargement stable
  if (!router.isReady) {
    return <div className="min-h-screen bg-black" />;
  }

  // 3. Si on est en train de rediriger -> Écran de chargement stable (avec timeout de sécurité)
  if (isRedirecting) {
    return <div className="min-h-screen bg-black" />;
  }

  // 4. Tout est bon, on affiche la page (avec isPublicRoute pour compatibilité)
  return <>{children({ isPublicRoute: isPublicPath })}</>;
}

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
 * CORRECTION UX : Bloque tout affichage tant que l'authentification est en cours
 * pour éviter le flash de la page Login avant redirection
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  // Marque le composant comme monté (évite les problèmes d'hydratation)
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
   */
  useEffect(() => {
    // Ne fait rien si le router n'est pas prêt ou pendant le chargement
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

  // 0. Pendant le montage initial ou si le router n'est pas prêt -> Écran Noir
  if (!isMounted || !router.isReady || isLoading) {
    return <div className="fixed inset-0 z-[9999] bg-black" />;
  }

  // 2. Si on est en train de rediriger -> Écran Noir (mais avec timeout de sécurité)
  if (isRedirecting) {
    return <div className="fixed inset-0 z-[9999] bg-black" />;
  }

  // 3. Tout est bon, on affiche la page (avec isPublicRoute pour compatibilité)
  return <>{children({ isPublicRoute: isPublicPath })}</>;
}

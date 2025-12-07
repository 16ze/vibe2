import AuthGuard from "@/components/auth/AuthGuard";
import RouteChangeHandler from "@/components/common/RouteChangeHandler";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { UIProvider } from "@/contexts/UIContext";
import { cleanupLocalStorage } from "@/utils/cleanupLocalStorage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../layout";
// IMPORTANT : Charger les styles globaux AVANT tout rendu
import "../styles/globals.css";

// TEMPORAIREMENT DÉSACTIVÉ : Animations de transition pour stabiliser l'app
// TODO: Réactiver une fois que l'app est stable en production
// const PAGE_ORDER = ["/feed", "/vibes", "/camera", "/conversations", "/profile"];
// const slideVariants = { ... };
// const slideTransition = { ... };

/**
 * Composant principal de l'application Next.js
 * Configure React Query, le Layout global et les animations de transition
 */
export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  /**
   * Crée le QueryClient une seule fois par instance de composant
   * Évite les problèmes d'hydratation en le créant côté client uniquement
   */
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true, // Rafraîchit automatiquement au retour sur la page
            refetchOnMount: true, // Rafraîchit au montage du composant
            refetchOnReconnect: true, // Rafraîchit lors de la reconnexion
            retry: 1,
            staleTime: 30 * 1000, // 30 secondes (au lieu de 5 minutes) pour des mises à jour plus fréquentes
            gcTime: 5 * 60 * 1000, // Garde en cache 5 minutes (anciennement cacheTime)
          },
        },
      })
  );

  /**
   * Nettoie le localStorage au montage pour éviter QuotaExceededError
   * Et ajoute un handler global pour capturer les erreurs
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Nettoie une seule fois au démarrage
    cleanupLocalStorage();

    // Handler global pour capturer TOUTES les erreurs (pas seulement QuotaExceededError)
    const handleError = (event: ErrorEvent) => {
      // Log toutes les erreurs pour diagnostic
      console.error("[_app] Global error caught:", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });

      // Nettoie localStorage si QuotaExceededError
      if (event.error?.name === "QuotaExceededError") {
        console.warn("[_app] QuotaExceededError detected, cleaning localStorage...");
        cleanupLocalStorage();
        // Empêche l'erreur de remonter
        event.preventDefault();
      }
    };

    // Handler pour les promesses rejetées
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Log toutes les promesses rejetées pour diagnostic
      console.error("[_app] Unhandled rejection:", {
        reason: event.reason,
        promise: event.promise,
      });

      // Nettoie localStorage si QuotaExceededError
      if (event.reason?.name === "QuotaExceededError") {
        console.warn("[_app] QuotaExceededError in promise, cleaning localStorage...");
        cleanupLocalStorage();
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        {/* Viewport pour PWA - Empêche le zoom et optimise pour mobile */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </Head>
      <AuthProvider>
        <UIProvider>
          <NotificationProvider>
            <RouteChangeHandler />
            <AuthGuard>
              {({ isPublicRoute }) => (
                // TEMPORAIREMENT : Pas d'animations pour stabiliser l'app
                // TODO: Réactiver AnimatePresence une fois stable
                <div className="h-full w-full">
                  {isPublicRoute ? (
                    <Component {...pageProps} />
                  ) : (
                    <Layout currentPageName={Component.name}>
                      <Component {...pageProps} />
                    </Layout>
                  )}
                </div>
              )}
            </AuthGuard>
          </NotificationProvider>
        </UIProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

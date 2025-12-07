import { initializeWithMockData } from "@/api/localStorage";
import AuthGuard from "@/components/auth/AuthGuard";
import RouteChangeHandler from "@/components/common/RouteChangeHandler";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { UIProvider } from "@/contexts/UIContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Layout from "../layout";
import "../styles/globals.css";

/**
 * Ordre des pages principales pour le carrousel
 * Définit la position virtuelle de chaque écran
 */
const PAGE_ORDER = ["/feed", "/vibes", "/camera", "/conversations", "/profile"];

/**
 * Variants pour l'animation de glissement
 * @param direction - 1 pour droite vers gauche, -1 pour gauche vers droite
 */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0.8,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0.8,
  }),
};

/**
 * Configuration de la transition (spring fluide et rapide)
 */
const slideTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

/**
 * Composant principal de l'application Next.js
 * Configure React Query, le Layout global et les animations de transition
 */
export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const prevPathRef = useRef<string>(router.pathname);
  const [direction, setDirection] = useState(0);

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
   * Initialise les données mock au montage de l'application
   */
  useEffect(() => {
    initializeWithMockData();
  }, []);

  /**
   * Calcule la direction de l'animation lors du changement de route
   * Compare les index dans PAGE_ORDER pour déterminer si on va à gauche ou à droite
   */
  useEffect(() => {
    const currentPath = router.pathname;
    const prevPath = prevPathRef.current;

    // Ne calcule la direction que si les deux pages sont dans l'ordre défini
    const currentIndex = PAGE_ORDER.indexOf(currentPath);
    const prevIndex = PAGE_ORDER.indexOf(prevPath);

    if (currentIndex !== -1 && prevIndex !== -1 && currentPath !== prevPath) {
      // Direction positive = page arrive de la droite (on va vers la droite)
      // Direction négative = page arrive de la gauche (on va vers la gauche)
      const newDirection = currentIndex > prevIndex ? 1 : -1;
      setDirection(newDirection);
    } else {
      // Pour les pages hors du carrousel, pas d'animation directionnelle
      setDirection(0);
    }

    // Met à jour la référence du chemin précédent
    prevPathRef.current = currentPath;
  }, [router.pathname]);

  /**
   * Détermine si l'animation de carrousel doit être appliquée
   * Seulement entre les pages principales définies dans PAGE_ORDER
   */
  const shouldAnimate = PAGE_ORDER.includes(router.pathname);

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
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  <motion.div
                    key={router.pathname}
                    custom={direction}
                    variants={shouldAnimate ? slideVariants : undefined}
                    initial={shouldAnimate ? "enter" : false}
                    animate="center"
                    exit={shouldAnimate ? "exit" : undefined}
                    transition={slideTransition}
                    className="h-full w-full"
                  >
                    {isPublicRoute ? (
                      <Component {...pageProps} />
                    ) : (
                      <Layout currentPageName={Component.name}>
                        <Component {...pageProps} />
                      </Layout>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </AuthGuard>
          </NotificationProvider>
        </UIProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

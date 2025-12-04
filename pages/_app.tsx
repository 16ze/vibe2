import React, { useState, useEffect } from "react";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "../layout";
import "../styles/globals.css";
import { initializeWithMockData } from "@/api/localStorage";

/**
 * Composant principal de l'application Next.js
 * Configure React Query et le Layout global
 *
 * Note: Le QueryClient est créé avec useState pour éviter les problèmes
 * d'hydratation entre le serveur et le client
 */
export default function App({ Component, pageProps }: AppProps) {
  /**
   * Crée le QueryClient une seule fois par instance de composant
   * Évite les problèmes d'hydratation en le créant côté client uniquement
   */
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutes
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

  return (
    <QueryClientProvider client={queryClient}>
      <Layout currentPageName={Component.name}>
        <Component {...pageProps} />
      </Layout>
    </QueryClientProvider>
  );
}


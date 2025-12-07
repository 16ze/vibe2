import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { useEffect } from "react";

/**
 * Hook personnalisé pour exiger une authentification
 * Redirige vers /login si l'utilisateur n'est pas connecté
 * 
 * @param redirectTo - Route de redirection si non authentifié (défaut: "/login")
 * @returns { user, isLoading } - Utilisateur actuel et état de chargement
 * 
 * @example
 * ```tsx
 * function MyProtectedPage() {
 *   const { user, isLoading } = useRequireAuth();
 *   
 *   if (isLoading) return <LoadingScreen />;
 *   if (!user) return null; // Redirection en cours
 *   
 *   return <div>Contenu protégé</div>;
 * }
 * ```
 */
export function useRequireAuth(redirectTo: string = "/login") {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Ne fait rien pendant le chargement
    if (isLoading) return;

    // Si pas d'utilisateur et pas déjà sur la page de redirection
    if (!user && router.pathname !== redirectTo) {
      // Sauvegarde l'URL actuelle pour redirection après connexion
      const currentPath = router.asPath;
      router.push({
        pathname: redirectTo,
        query: { redirect: currentPath },
      });
    }
  }, [user, isLoading, router, redirectTo]);

  return { user, isLoading };
}


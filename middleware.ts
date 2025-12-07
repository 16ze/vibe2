import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware Next.js pour protection serveur-side des routes
 * Vérifie l'authentification Supabase avant d'autoriser l'accès aux pages privées
 *
 * NOTE: Le middleware vérifie uniquement la présence d'un token dans les cookies
 * La validation complète se fait côté client via AuthGuard
 */

// Routes publiques (accessibles sans authentification)
const PUBLIC_ROUTES = ["/", "/login", "/signup"];

// Routes privées (nécessitent une authentification)
const PRIVATE_ROUTES = [
  "/feed",
  "/camera",
  "/conversations",
  "/profile",
  "/activity",
  "/vibes",
  "/map",
  "/settings",
  "/home",
];

export async function middleware(request: NextRequest) {
  // TEMPORAIREMENT DÉSACTIVÉ pour éviter les boucles de redirection
  // Le middleware entre en conflit avec AuthGuard qui gère déjà les redirections
  // TODO: Réactiver une fois que AuthGuard est stabilisé

  // Pour l'instant, on laisse tout passer
  // AuthGuard gère les redirections côté client de manière plus fiable
  return NextResponse.next();

  /* CODE ORIGINAL (désactivé)
  const pathname = request.nextUrl.pathname;

  // Vérifie si la route est publique ou privée
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isPrivateRoute = PRIVATE_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Si la route n'est ni publique ni privée, on laisse passer
  if (!isPublicRoute && !isPrivateRoute) {
    return NextResponse.next();
  }

  // Récupère le token depuis les cookies
  const accessToken = request.cookies.get("sb-access-token")?.value;
  const refreshToken = request.cookies.get("sb-refresh-token")?.value;

  // Si la route est privée et qu'il n'y a pas de token
  if (isPrivateRoute && !accessToken && !refreshToken) {
    // Redirige vers la page de connexion
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Si la route est publique et qu'il y a des tokens
  // On laisse passer (AuthGuard gérera la redirection côté client)
  if (isPublicRoute && (accessToken || refreshToken)) {
    // On pourrait rediriger ici, mais AuthGuard le fait déjà
    // On laisse passer pour éviter les conflits
  }

  return NextResponse.next();
  */
}

/**
 * Configuration du matcher pour optimiser les performances
 * Le middleware ne s'exécute que sur les routes spécifiées
 */
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - api (routes API)
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (favicon)
     * - public (fichiers publics)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};

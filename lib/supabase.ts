import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Variables d'environnement Supabase
 * Définies dans .env.local
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Vérifie si Supabase est configuré
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Affiche les warnings en développement uniquement
 */
if (typeof window !== "undefined" && !isSupabaseConfigured) {
  console.warn(
    "⚠️ Supabase n'est pas configuré.\n" +
      "   Crée un fichier .env.local avec:\n" +
      "   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co\n" +
      "   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...\n\n" +
      "   Récupère ces valeurs depuis:\n" +
      "   https://supabase.com/dashboard/project/[PROJECT]/settings/api"
  );
}

/**
 * Client Supabase placeholder pour éviter les erreurs quand non configuré
 * Retourne des réponses vides/erreurs pour toutes les opérations
 */
const createPlaceholderClient = (): SupabaseClient => {
  const notConfiguredError = {
    message: "Supabase n'est pas configuré. Vérifiez votre fichier .env.local",
    code: "NOT_CONFIGURED",
  };

  // Crée un client avec une URL factice (ne sera jamais appelé)
  // Cette approche évite l'erreur "supabaseUrl is required"
  const placeholderUrl = "https://placeholder.supabase.co";
  const placeholderKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDY5MTQ4MDAsImV4cCI6MTk2MjQ5MDgwMH0.placeholder";

  return createClient(placeholderUrl, placeholderKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

/**
 * Client Supabase singleton
 * Utilisé pour toutes les interactions avec la base de données et l'auth
 *
 * @example
 * ```typescript
 * import { supabase, isSupabaseConfigured } from "@/lib/supabase";
 *
 * // Vérifie d'abord si configuré
 * if (!isSupabaseConfigured) {
 *   console.error("Supabase non configuré");
 *   return;
 * }
 *
 * // Requête simple
 * const { data, error } = await supabase
 *   .from("posts")
 *   .select("*")
 *   .limit(10);
 * ```
 */
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        /**
         * Persiste la session dans le localStorage
         * Permet de garder l'utilisateur connecté entre les rafraîchissements
         */
        persistSession: true,
        /**
         * Détecte automatiquement les changements de session
         * (ex: connexion depuis un autre onglet)
         */
        detectSessionInUrl: true,
        /**
         * Utilise le localStorage pour stocker la session
         */
        storage:
          typeof window !== "undefined" ? window.localStorage : undefined,
      },
    })
  : createPlaceholderClient();

/**
 * Type helper pour les erreurs Supabase
 */
export type SupabaseError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

/**
 * Helper pour gérer les erreurs Supabase de manière uniforme
 *
 * @param error - L'erreur retournée par Supabase
 * @returns Un message d'erreur lisible
 */
export function getSupabaseErrorMessage(error: SupabaseError | null): string {
  if (!error) return "";

  // Messages d'erreur personnalisés pour les cas courants
  const errorMessages: Record<string, string> = {
    "Invalid login credentials": "Email ou mot de passe incorrect",
    "Email not confirmed": "Veuillez confirmer votre email",
    "User already registered": "Cet email est déjà utilisé",
    "Password should be at least 6 characters":
      "Le mot de passe doit contenir au moins 6 caractères",
    "Email rate limit exceeded": "Trop de tentatives, réessayez plus tard",
    NOT_CONFIGURED:
      "Supabase n'est pas configuré. Vérifiez votre fichier .env.local",
  };

  return errorMessages[error.message] || error.message;
}

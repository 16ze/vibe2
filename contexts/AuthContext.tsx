"use client";

import {
  getSupabaseErrorMessage,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Interface pour les données utilisateur de l'application
 * Combinaison des données Supabase Auth + table profiles
 */
export interface User {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  score?: number;
  created_date?: string;
}

/**
 * Interface pour le contexte d'authentification
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (userData: {
    email: string;
    password: string;
    full_name?: string;
    username?: string;
    avatar_url?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Récupère le profil complet depuis la table profiles avec retry
 * Gère les race conditions lors de l'inscription
 */
async function fetchProfile(
  userId: string,
  retries: number = 3,
  delayMs: number = 500
): Promise<Partial<User> | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, full_name, avatar_url, bio, created_at")
        .eq("id", userId)
        .maybeSingle(); // Utilise maybeSingle() au lieu de single() pour éviter les erreurs si pas de résultat

      if (error) {
        console.error(
          `[AuthContext] Error fetching profile (attempt ${i + 1}/${retries}):`,
          error.code,
          error.message
        );

        // Si erreur 400 ou 42703, le profil n'existe probablement pas ou la structure est incorrecte
        if (
          error.code === "400" ||
          error.code === "42703" ||
          error.code === "PGRST116"
        ) {
          if (i === retries - 1) {
            console.warn(
              `[AuthContext] Profile not found after ${retries} attempts for user:`,
              userId,
              "Error:",
              error.message
            );
            return null;
          }
          // Continue avec le retry
        } else {
          // Autre type d'erreur, on log et on continue
          console.warn(`[AuthContext] Unexpected error, retrying...`);
        }
      } else if (data) {
        console.log(
          `[AuthContext] Profile found on attempt ${i + 1}/${retries}`
        );
        return {
          username: data?.username || "",
          full_name: data?.full_name || "",
          avatar_url: data?.avatar_url || "",
          bio: data?.bio || "",
          score: 0, // La colonne score n'existe pas dans la table profiles
          created_date: data?.created_at,
        };
      } else {
        // Pas d'erreur mais pas de données non plus
        console.log(
          `[AuthContext] No profile data returned (attempt ${i + 1}/${retries})`
        );
      }

      // Si c'est la dernière tentative, on retourne null
      if (i === retries - 1) {
        console.warn(
          `[AuthContext] Profile not found after ${retries} attempts for user:`,
          userId
        );
        return null;
      }

      // Sinon, on attend avant de réessayer
      console.log(
        `[AuthContext] Profile not found, retrying in ${delayMs}ms... (attempt ${
          i + 1
        }/${retries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (error: any) {
      console.error(
        `[AuthContext] Exception fetching profile (attempt ${
          i + 1
        }/${retries}):`,
        error
      );
      if (i === retries - 1) {
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return null;
}

/**
 * Convertit un utilisateur Supabase + profil vers le format User de l'application
 */
function mapSupabaseUserToAppUser(
  supabaseUser: SupabaseUser | null,
  profile?: Partial<User> | null
): User | null {
  if (!supabaseUser) return null;

  const metadata = supabaseUser.user_metadata || {};

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    // Priorité : profile > metadata > vide
    full_name: profile?.full_name || metadata.full_name || "",
    username: profile?.username || metadata.username || "",
    avatar_url: profile?.avatar_url || metadata.avatar_url || "",
    bio: profile?.bio || metadata.bio || "",
    score: profile?.score || 0,
    created_date: profile?.created_date || supabaseUser.created_at,
  };
}

/**
 * Provider d'authentification Supabase
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /**
   * Charge l'utilisateur complet (Auth + Profile)
   * Si le profil n'existe pas, utilise les métadonnées Auth comme fallback
   */
  const loadUserWithProfile = useCallback(
    async (supabaseUser: SupabaseUser | null) => {
      if (!supabaseUser) {
        setUser(null);
        return null;
      }

      const profile = await fetchProfile(supabaseUser.id);
      // mapSupabaseUserToAppUser gère le cas où profile est null (utilise les métadonnées)
      const appUser = mapSupabaseUserToAppUser(supabaseUser, profile);
      setUser(appUser);
      return appUser;
    },
    []
  );

  /**
   * Initialisation et écoute des changements de session
   */
  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn("[AuthContext] Supabase non configuré - Auth désactivée");
      setIsLoading(false);
      return;
    }

    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("[AuthContext] Error getting session:", error);
          setUser(null);
        } else if (session?.user) {
          await loadUserWithProfile(session.user);
          console.log(
            "[AuthContext] Session restored for:",
            session.user.email
          );
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("[AuthContext] Error initializing auth:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    /**
     * Écoute les changements d'état d'authentification
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthContext] Auth state changed:", event);

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        await loadUserWithProfile(session?.user || null);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserWithProfile]);

  /**
   * Login HYBRIDE : accepte email OU pseudo
   * Si identifier contient '@' -> c'est un email
   * Sinon -> c'est un pseudo, on récupère l'email depuis profiles
   */
  const login = useCallback(
    async (identifier: string, password: string): Promise<User> => {
      if (!isSupabaseConfigured) {
        throw new Error(
          "Supabase n'est pas configuré. Vérifiez votre fichier .env.local"
        );
      }

      if (!identifier || !password) {
        throw new Error("Email/pseudo et mot de passe requis");
      }

      try {
        let email = identifier;

        // Vérifie si c'est un email ou un pseudo
        const isEmail = identifier.includes("@");

        if (!isEmail) {
          // C'est un pseudo -> Récupère l'email depuis la table profiles
          console.log("[AuthContext] Login with username:", identifier);

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("email, id")
            .eq("username", identifier.toLowerCase())
            .maybeSingle();

          if (profileError) {
            console.error(
              "[AuthContext] Error fetching profile by username:",
              profileError
            );
            throw new Error("Erreur lors de la recherche de l'utilisateur");
          }

          if (!profile || !profile.email) {
            throw new Error(
              "Utilisateur introuvable. Vérifiez votre pseudo ou utilisez votre email."
            );
          }

          email = profile.email;
          console.log("[AuthContext] Found email for username:", email);
        }

        // Connexion avec l'email
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw new Error(getSupabaseErrorMessage(error));
        }

        if (!data.user) {
          throw new Error("Erreur lors de la connexion");
        }

        const appUser = await loadUserWithProfile(data.user);
        if (!appUser) {
          throw new Error("Erreur lors de la récupération du profil");
        }

        console.log("[AuthContext] Login successful:", appUser.email);
        return appUser;
      } catch (error: any) {
        console.error("[AuthContext] Login error:", error);
        throw error;
      }
    },
    [loadUserWithProfile]
  );

  /**
   * Inscrit un nouvel utilisateur
   * Les métadonnées sont passées à options.data pour le trigger SQL
   */
  const register = useCallback(
    async (userData: {
      email: string;
      password: string;
      full_name?: string;
      username?: string;
      avatar_url?: string;
    }): Promise<User> => {
      if (!isSupabaseConfigured) {
        throw new Error(
          "Supabase n'est pas configuré. Vérifiez votre fichier .env.local"
        );
      }

      if (!userData.email || !userData.password) {
        throw new Error("Email et mot de passe requis");
      }

      // Vérifie si le username est déjà pris
      if (userData.username) {
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", userData.username.toLowerCase())
          .single();

        if (existingUser) {
          throw new Error("Ce pseudo est déjà utilisé");
        }
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            /**
             * Métadonnées passées au trigger SQL pour créer le profil
             */
            data: {
              username: userData.username?.toLowerCase() || "",
              full_name: userData.full_name || "",
              avatar_url: userData.avatar_url || "",
              bio: "",
            },
          },
        });

        if (error) {
          throw new Error(getSupabaseErrorMessage(error));
        }

        if (!data.user) {
          throw new Error("Erreur lors de l'inscription");
        }

        // Attendre que le trigger SQL crée le profil
        await new Promise((resolve) => setTimeout(resolve, 500));

        const appUser = await loadUserWithProfile(data.user);
        if (!appUser) {
          // Fallback si le profil n'est pas encore créé
          const fallbackUser = mapSupabaseUserToAppUser(data.user, {
            username: userData.username || "",
            full_name: userData.full_name || "",
            avatar_url: userData.avatar_url || "",
          });
          setUser(fallbackUser);
          console.log(
            "[AuthContext] Registration successful (fallback):",
            fallbackUser?.email
          );
          return fallbackUser!;
        }

        console.log("[AuthContext] Registration successful:", appUser.email);
        return appUser;
      } catch (error: any) {
        console.error("[AuthContext] Register error:", error);
        throw error;
      }
    },
    [loadUserWithProfile]
  );

  /**
   * Déconnecte l'utilisateur actuel
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("[AuthContext] Logout error:", error);
      }

      setUser(null);
      router.push("/");
      console.log("[AuthContext] Logout successful");
    } catch (error) {
      console.error("[AuthContext] Logout error:", error);
      setUser(null);
      router.push("/");
    }
  }, [router]);

  /**
   * Met à jour le profil (table profiles + métadonnées Auth)
   */
  const updateProfile = useCallback(
    async (updates: Partial<User>): Promise<void> => {
      if (!user) {
        throw new Error("Aucun utilisateur connecté");
      }

      try {
        // Met à jour la table profiles
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: updates.full_name,
            username: updates.username?.toLowerCase(),
            avatar_url: updates.avatar_url,
            bio: updates.bio,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (profileError) {
          throw new Error(getSupabaseErrorMessage(profileError));
        }

        // Met aussi à jour les métadonnées Auth
        await supabase.auth.updateUser({
          data: {
            full_name: updates.full_name,
            username: updates.username?.toLowerCase(),
            avatar_url: updates.avatar_url,
            bio: updates.bio,
          },
        });

        setUser((prev) => (prev ? { ...prev, ...updates } : null));
        console.log("[AuthContext] Profile updated successfully");
      } catch (error: any) {
        console.error("[AuthContext] Update profile error:", error);
        throw error;
      }
    },
    [user]
  );

  /**
   * Rafraîchit les données du profil depuis Supabase
   */
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();

      if (supabaseUser) {
        await loadUserWithProfile(supabaseUser);
        console.log("[AuthContext] Profile refreshed");
      }
    } catch (error) {
      console.error("[AuthContext] Error refreshing profile:", error);
    }
  }, [user, loadUserWithProfile]);

  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      refreshProfile,
    }),
    [user, isLoading, login, register, logout, updateProfile, refreshProfile]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

/**
 * Hook pour utiliser le contexte d'authentification
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

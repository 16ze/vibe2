import { supabase } from "@/lib/supabase";

/**
 * Service pour gérer les relations sociales (followers/following)
 */

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface Following {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  following: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

/**
 * Récupère la liste des followers d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Liste des followers avec leurs profils
 */
export async function getFollowers(userId: string): Promise<Follower[]> {
  try {
    // Récupère les follows avec les IDs
    const { data: follows, error: followsError } = await supabase
      .from("follows")
      .select("id, follower_id, following_id, created_at")
      .eq("following_id", userId)
      .order("created_at", { ascending: false });

    if (followsError) {
      console.error("[socialService] Error fetching follows:", followsError);
      throw followsError;
    }

    if (!follows || follows.length === 0) {
      return [];
    }

    // Récupère les profils des followers
    const followerIds = follows.map((f) => f.follower_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", followerIds);

    if (profilesError) {
      console.error("[socialService] Error fetching profiles:", profilesError);
      throw profilesError;
    }

    // Combine les données
    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    return follows.map((follow) => ({
      id: follow.id,
      follower_id: follow.follower_id,
      following_id: follow.following_id,
      created_at: follow.created_at,
      follower: profileMap.get(follow.follower_id) || null,
    }));
  } catch (error) {
    console.error("[socialService] Error in getFollowers:", error);
    return [];
  }
}

/**
 * Récupère la liste des utilisateurs suivis par un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Liste des following avec leurs profils
 */
export async function getFollowing(userId: string): Promise<Following[]> {
  try {
    // Récupère les follows avec les IDs
    const { data: follows, error: followsError } = await supabase
      .from("follows")
      .select("id, follower_id, following_id, created_at")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false });

    if (followsError) {
      console.error("[socialService] Error fetching follows:", followsError);
      throw followsError;
    }

    if (!follows || follows.length === 0) {
      return [];
    }

    // Récupère les profils des following
    const followingIds = follows.map((f) => f.following_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", followingIds);

    if (profilesError) {
      console.error("[socialService] Error fetching profiles:", profilesError);
      throw profilesError;
    }

    // Combine les données
    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    return follows.map((follow) => ({
      id: follow.id,
      follower_id: follow.follower_id,
      following_id: follow.following_id,
      created_at: follow.created_at,
      following: profileMap.get(follow.following_id) || null,
    }));
  } catch (error) {
    console.error("[socialService] Error in getFollowing:", error);
    return [];
  }
}

/**
 * Vérifie si un utilisateur suit un autre utilisateur
 * @param currentUserId - ID de l'utilisateur actuel
 * @param targetUserId - ID de l'utilisateur cible
 * @returns true si currentUserId suit targetUserId
 */
export async function isFollowing(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned (normal si pas de relation)
      console.error("[socialService] Error checking follow status:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("[socialService] Error in isFollowing:", error);
    return false;
  }
}

/**
 * Suit un utilisateur
 * @param currentUserId - ID de l'utilisateur actuel
 * @param targetUserId - ID de l'utilisateur à suivre
 */
export async function followUser(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  try {
    // Vérifie si la relation existe déjà
    const { data: existing } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId)
      .single();

    if (existing) {
      console.log("[socialService] Already following this user");
      return;
    }

    // Crée la relation
    const { error: followError } = await supabase.from("follows").insert({
      follower_id: currentUserId,
      following_id: targetUserId,
    });

    if (followError) {
      console.error("[socialService] Error following user:", followError);
      throw followError;
    }

    // Crée une notification pour la personne suivie (si ce n'est pas soi-même)
    if (currentUserId !== targetUserId) {
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: targetUserId,
        actor_id: currentUserId,
        type: "follow",
        is_read: false,
      });

      if (notifError) {
        console.error("[socialService] Error creating notification:", notifError);
        // Ne pas throw ici, la notification est secondaire
      }
    }

    console.log("[socialService] Successfully followed user:", targetUserId);
  } catch (error) {
    console.error("[socialService] Error in followUser:", error);
    throw error;
  }
}

/**
 * Ne suit plus un utilisateur
 * @param currentUserId - ID de l'utilisateur actuel
 * @param targetUserId - ID de l'utilisateur à ne plus suivre
 */
export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId);

    if (error) {
      console.error("[socialService] Error unfollowing user:", error);
      throw error;
    }

    console.log("[socialService] Successfully unfollowed user:", targetUserId);
  } catch (error) {
    console.error("[socialService] Error in unfollowUser:", error);
    throw error;
  }
}

/**
 * Récupère le nombre de followers d'un utilisateur
 * @param userId - ID de l'utilisateur
 */
export async function getFollowersCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    if (error) {
      console.error("[socialService] Error counting followers:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("[socialService] Error in getFollowersCount:", error);
    return 0;
  }
}

/**
 * Récupère le nombre d'utilisateurs suivis par un utilisateur
 * @param userId - ID de l'utilisateur
 */
export async function getFollowingCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    if (error) {
      console.error("[socialService] Error counting following:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("[socialService] Error in getFollowingCount:", error);
    return 0;
  }
}

/**
 * Récupère les statistiques complètes d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Objet avec followersCount, followingCount, postsCount
 */
export async function getStats(userId: string): Promise<{
  followersCount: number;
  followingCount: number;
  postsCount: number;
}> {
  try {
    // Compte les followers
    const followersCount = await getFollowersCount(userId);

    // Compte les following
    const followingCount = await getFollowingCount(userId);

    // Compte les posts
    const { count: postsCount, error: postsError } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (postsError) {
      console.error("[socialService] Error counting posts:", postsError);
    }

    return {
      followersCount,
      followingCount,
      postsCount: postsCount || 0,
    };
  } catch (error) {
    console.error("[socialService] Error in getStats:", error);
    return {
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
    };
  }
}

/**
 * Recherche des utilisateurs dans Supabase par username, full_name ou email
 * @param query - Terme de recherche
 * @param currentUserId - ID de l'utilisateur actuel (pour l'exclure des résultats)
 * @param limit - Nombre maximum de résultats (défaut: 20)
 * @returns Liste des utilisateurs correspondant à la recherche
 */
export async function searchUsers(
  query: string,
  currentUserId: string,
  limit: number = 20
): Promise<
  Array<{
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    email?: string;
  }>
> {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = `%${query.trim()}%`;

    console.log("[socialService] Searching users with term:", searchTerm, "currentUserId:", currentUserId);

    // Recherche dans les profils par username ou full_name (insensible à la casse)
    // Utilisation de deux requêtes séparées pour éviter les problèmes de syntaxe
    const [usernameResults, fullNameResults] = await Promise.all([
      // Recherche par username
      supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .neq("id", currentUserId)
        .ilike("username", searchTerm)
        .limit(limit),
      // Recherche par full_name
      supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .neq("id", currentUserId)
        .ilike("full_name", searchTerm)
        .limit(limit),
    ]);

    // Combine les résultats et supprime les doublons
    const allResults = [
      ...(usernameResults.data || []),
      ...(fullNameResults.data || []),
    ];

    // Supprime les doublons basés sur l'ID
    const uniqueResults = Array.from(
      new Map(allResults.map((user) => [user.id, user])).values()
    );

    // Limite les résultats
    const limitedResults = uniqueResults.slice(0, limit);

    console.log("[socialService] Found users:", limitedResults.length);

    if (usernameResults.error) {
      console.error("[socialService] Error searching by username:", usernameResults.error);
    }
    if (fullNameResults.error) {
      console.error("[socialService] Error searching by full_name:", fullNameResults.error);
    }

    if (usernameResults.error && fullNameResults.error) {
      return [];
    }

    return limitedResults;
  } catch (error) {
    console.error("[socialService] Error in searchUsers:", error);
    return [];
  }
}

/**
 * Récupère les relations (follows) d'un utilisateur depuis Supabase
 * @param currentUserId - ID de l'utilisateur actuel
 * @returns Liste des relations avec les statuts
 */
export async function getRelationships(currentUserId: string): Promise<
  Array<{
    id: string;
    follower_id: string;
    following_id: string;
    created_at: string;
  }>
> {
  try {
    // Récupère toutes les relations où l'utilisateur est follower ou following
    const { data: sent, error: sentError } = await supabase
      .from("follows")
      .select("id, follower_id, following_id, created_at")
      .eq("follower_id", currentUserId);

    const { data: received, error: receivedError } = await supabase
      .from("follows")
      .select("id, follower_id, following_id, created_at")
      .eq("following_id", currentUserId);

    if (sentError || receivedError) {
      console.error("[socialService] Error fetching relationships:", {
        sentError,
        receivedError,
      });
      return [];
    }

    return [...(sent || []), ...(received || [])];
  } catch (error) {
    console.error("[socialService] Error in getRelationships:", error);
    return [];
  }
}


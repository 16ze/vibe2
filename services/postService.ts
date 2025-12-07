import { supabase } from "@/lib/supabase";

/**
 * Service pour gérer les posts et stories avec Supabase
 */

export type PostType = "image" | "video" | "text";
export type StoryType = "image" | "video";

/**
 * Crée un nouveau post
 */
export async function createPost(
  userId: string,
  mediaUrl: string | null,
  type: PostType,
  content?: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        type: type,
        media_url: mediaUrl,
        content: content || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[postService] Error creating post:", error);
      throw error;
    }

    if (!data?.id) {
      throw new Error("Aucun ID retourné après la création du post");
    }

    console.log("[postService] Post created:", data.id);
    return data.id;
  } catch (error) {
    console.error("[postService] Error in createPost:", error);
    throw error;
  }
}

/**
 * Crée une nouvelle story
 * Expire automatiquement dans 24 heures
 */
export async function createStory(
  userId: string,
  mediaUrl: string,
  type: StoryType
): Promise<string> {
  try {
    // Calcule la date d'expiration (24h à partir de maintenant)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data, error } = await supabase
      .from("stories")
      .insert({
        user_id: userId,
        media_url: mediaUrl,
        type: type,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("[postService] Error creating story:", error);
      throw error;
    }

    if (!data?.id) {
      throw new Error("Aucun ID retourné après la création de la story");
    }

    console.log("[postService] Story created:", data.id);
    return data.id;
  } catch (error) {
    console.error("[postService] Error in createStory:", error);
    throw error;
  }
}

/**
 * Récupère le feed des posts
 */
export async function getFeed(limit: number = 50): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        profiles!user_id(
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[postService] Error fetching feed:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("[postService] Error in getFeed:", error);
    return [];
  }
}

/**
 * Récupère les stories actives (non expirées)
 */
export async function getActiveStories(limit: number = 50): Promise<any[]> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("stories")
      .select(
        `
        *,
        profiles!user_id(
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[postService] Error fetching stories:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("[postService] Error in getActiveStories:", error);
    return [];
  }
}

/**
 * Toggle un like sur un post
 * Si le like existe, le supprime (Unlike)
 * Si le like n'existe pas, l'ajoute (Like) et crée une notification
 */
export async function toggleLike(
  postId: string,
  userId: string
): Promise<{ isLiked: boolean; likesCount: number }> {
  try {
    // 1. Vérifie si le like existe déjà (select count)
    const { count, error: checkError } = await supabase
      .from("likes")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (checkError) {
      console.error("[postService] Error checking like:", checkError);
      throw checkError;
    }

    const likeExists = (count || 0) > 0;

    if (likeExists) {
      // 2. Unlike : Supprime le like
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (deleteError) {
        console.error("[postService] Error deleting like:", deleteError);
        throw deleteError;
      }

      // 3. Récupère le nouveau nombre de likes
      const { count, error: countError } = await supabase
        .from("likes")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId);

      if (countError) {
        console.error("[postService] Error counting likes:", countError);
      }

      return {
        isLiked: false,
        likesCount: count || 0,
      };
    } else {
      // 3. Like : Ajoute le like
      const { error: insertError } = await supabase
        .from("likes")
        .insert({
          post_id: postId,
          user_id: userId,
        });

      if (insertError) {
        console.error("[postService] Error inserting like:", insertError);
        throw insertError;
      }

      // 4. Récupère le propriétaire du post pour créer la notification
      const { data: post, error: postError } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (!postError && post && post.user_id !== userId) {
        // Crée une notification seulement si ce n'est pas mon propre post
        const { error: notifError } = await supabase.from("notifications").insert({
          user_id: post.user_id, // Le propriétaire du post
          actor_id: userId, // Moi qui like
          type: "like",
          resource_id: postId,
          is_read: false,
        });

        if (notifError) {
          console.error("[postService] Error creating notification:", notifError);
          // Ne pas throw, la notification est secondaire
        }
      }

      // 5. Récupère le nouveau nombre de likes
      const { count, error: countError } = await supabase
        .from("likes")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId);

      if (countError) {
        console.error("[postService] Error counting likes:", countError);
      }

      return {
        isLiked: true,
        likesCount: count || 0, // Le count inclut déjà le like qu'on vient d'ajouter
      };
    }
  } catch (error) {
    console.error("[postService] Error in toggleLike:", error);
    throw error;
  }
}

/**
 * Récupère les commentaires d'un post avec les profils des auteurs
 * Triés par created_at DESC (plus récents en premier)
 */
export async function getComments(postId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        profiles!user_id(
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[postService] Error fetching comments:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("[postService] Error in getComments:", error);
    return [];
  }
}

/**
 * Ajoute un commentaire à un post
 * Crée aussi une notification pour le propriétaire du post
 */
export async function addComment(
  postId: string,
  userId: string,
  text: string
): Promise<any> {
  try {
    // 1. Insère le commentaire
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: userId,
        content: text,
      })
      .select()
      .single();

    if (commentError) {
      console.error("[postService] Error adding comment:", commentError);
      throw commentError;
    }

    // 2. Récupère le propriétaire du post pour créer la notification
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (!postError && post && post.user_id !== userId) {
      // Crée une notification seulement si ce n'est pas mon propre post
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: post.user_id, // Le propriétaire du post
        actor_id: userId, // Moi qui commente
        type: "comment",
        resource_id: postId,
        is_read: false,
      });

      if (notifError) {
        console.error("[postService] Error creating notification:", notifError);
        // Ne pas throw, la notification est secondaire
      }
    }

    // 3. Récupère le commentaire avec le profil de l'auteur
    const { data: commentWithProfile, error: profileError } = await supabase
      .from("comments")
      .select(
        `
        *,
        profiles!user_id(
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .eq("id", comment.id)
      .single();

    if (profileError) {
      console.error("[postService] Error fetching comment with profile:", profileError);
      return comment;
    }

    return commentWithProfile;
  } catch (error) {
    console.error("[postService] Error in addComment:", error);
    throw error;
  }
}


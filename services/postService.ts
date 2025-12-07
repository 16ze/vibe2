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
 * Récupère le feed des posts avec le nombre de likes et commentaires
 */
export async function getFeed(limit: number = 50): Promise<any[]> {
  try {
    const { data: posts, error } = await supabase
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

    if (!posts || posts.length === 0) {
      return [];
    }

    // Pour chaque post, récupère le nombre réel de likes et commentaires depuis Supabase
    // Utilise des requêtes GET au lieu de HEAD pour éviter les problèmes avec le service worker
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        // Compte les likes (utilise post_id qui existe toujours dans la table)
        const { count: likesCount, error: likesError } = await supabase
          .from("likes")
          .select("post_id", { count: "exact" })
          .eq("post_id", post.id)
          .limit(0); // Limite à 0 pour ne pas récupérer de données, juste le count

        if (likesError) {
          console.warn("[postService] Error counting likes for post", post.id, likesError);
        }

        // Compte les commentaires
        const { count: commentsCount, error: commentsError } = await supabase
          .from("comments")
          .select("post_id", { count: "exact" })
          .eq("post_id", post.id)
          .limit(0); // Limite à 0 pour ne pas récupérer de données, juste le count

        if (commentsError) {
          console.warn("[postService] Error counting comments for post", post.id, commentsError);
        }

        return {
          ...post,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
        };
      })
    );

    return postsWithCounts;
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
    // 1. Vérifie si le like existe déjà (utilise post_id et user_id car la table n'a peut-être pas de colonne id)
    const { data: existingLike, error: checkError } = await supabase
      .from("likes")
      .select("post_id, user_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) {
      console.error("[postService] Error checking like:", checkError);
      throw checkError;
    }

    const likeExists = !!existingLike;

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
        .select("post_id", { count: "exact" })
        .eq("post_id", postId)
        .limit(0); // Limite à 0 pour ne pas récupérer de données, juste le count

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
        .select("post_id", { count: "exact" })
        .eq("post_id", postId)
        .limit(0); // Limite à 0 pour ne pas récupérer de données, juste le count

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
 * Supprime un post et son média associé
 * @param postId - ID du post à supprimer
 * @param userId - ID de l'utilisateur (pour vérifier que c'est le propriétaire)
 */
export async function deletePost(
  postId: string,
  userId: string
): Promise<void> {
  try {
    // 1. Vérifie que le post appartient à l'utilisateur
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("user_id, media_url, type")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      console.error("[postService] Error fetching post:", fetchError);
      throw new Error("Post introuvable");
    }

    if (post.user_id !== userId) {
      throw new Error("Vous n'êtes pas autorisé à supprimer ce post");
    }

    // 2. Supprime le média de Supabase Storage si présent
    if (post.media_url) {
      try {
        // Extrait le chemin du fichier depuis l'URL
        const url = new URL(post.media_url);
        const pathParts = url.pathname.split("/");
        const bucket = pathParts[1]; // "posts" ou "stories"
        const filePath = pathParts.slice(2).join("/"); // Le reste du chemin

        if (bucket && filePath) {
          const { deleteMedia } = await import("@/services/mediaService");
          await deleteMedia(bucket as "posts" | "stories", filePath);
        }
      } catch (mediaError) {
        console.warn("[postService] Error deleting media (continuing anyway):", mediaError);
        // Continue même si la suppression du média échoue
      }
    }

    // 3. Supprime les likes associés
    await supabase.from("likes").delete().eq("post_id", postId);

    // 4. Supprime les commentaires associés
    await supabase.from("comments").delete().eq("post_id", postId);

    // 5. Supprime les notifications associées
    await supabase.from("notifications").delete().eq("resource_id", postId);

    // 6. Supprime le post
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", userId); // Double vérification de sécurité

    if (deleteError) {
      console.error("[postService] Error deleting post:", deleteError);
      throw deleteError;
    }

    console.log("[postService] Post deleted successfully:", postId);
  } catch (error) {
    console.error("[postService] Error in deletePost:", error);
    throw error;
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


import { supabase } from "@/lib/supabase";

/**
 * Service pour gérer les notifications avec Supabase
 */

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: "like" | "comment" | "follow" | "message";
  resource_id?: string;
  is_read: boolean;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  posts?: {
    id: string;
    media_url?: string;
  };
}

/**
 * Récupère les notifications de l'utilisateur
 * Inclut les profils des acteurs et les posts associés
 */
export async function getNotifications(
  userId: string,
  limit: number = 50
): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select(
        `
        *,
        profiles!actor_id(
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[notificationService] Error fetching notifications:", error);
      throw error;
    }

    if (!data) return [];

    // Pour les notifications de type 'like' ou 'comment', récupère aussi le post
    const notificationsWithPosts = await Promise.all(
      data.map(async (notif) => {
        if (
          (notif.type === "like" || notif.type === "comment") &&
          notif.resource_id
        ) {
          // Récupère le post associé
          const { data: post } = await supabase
            .from("posts")
            .select("id, media_url")
            .eq("id", notif.resource_id)
            .single();

          // Pour les commentaires, récupère aussi le contenu du commentaire
          let commentContent: string | undefined;
          if (notif.type === "comment") {
            const { data: comment } = await supabase
              .from("comments")
              .select("content")
              .eq("post_id", notif.resource_id)
              .eq("user_id", notif.actor_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            commentContent = comment?.content;
          }

          return {
            ...notif,
            posts: post ? [post] : undefined,
            commentContent,
          };
        }
        return notif;
      })
    );

    return notificationsWithPosts;
  } catch (error) {
    console.error("[notificationService] Error in getNotifications:", error);
    return [];
  }
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("[notificationService] Error marking notification as read:", error);
      throw error;
    }
  } catch (error) {
    console.error("[notificationService] Error in markNotificationAsRead:", error);
    throw error;
  }
}

/**
 * Marque toutes les notifications comme lues
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("[notificationService] Error marking all notifications as read:", error);
      throw error;
    }
  } catch (error) {
    console.error("[notificationService] Error in markAllNotificationsAsRead:", error);
    throw error;
  }
}


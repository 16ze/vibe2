import { supabase } from "@/lib/supabase";

/**
 * Service pour gérer les conversations et messages avec Supabase
 */

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  media_url?: string;
  type: "text" | "image" | "video";
  created_at: string;
  is_read: boolean;
}

export interface Conversation {
  id: string;
  last_message?: string;
  last_message_type?: string;
  last_message_at?: string;
  last_message_sender_id?: string;
  is_last_message_read: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Envoie un message dans une conversation
 * Met à jour la conversation et crée une notification
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content?: string,
  mediaUrl?: string,
  type: "text" | "image" | "video" = "text"
): Promise<Message> {
  try {
    // 1. Insère le message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content || null,
        media_url: mediaUrl || null,
        type: type,
        is_read: false,
      })
      .select()
      .single();

    if (messageError) {
      console.error("[chatService] Error sending message:", messageError);
      throw messageError;
    }

    // 2. Met à jour la conversation
    const lastMessageText =
      type === "text"
        ? content || ""
        : type === "image"
        ? "📷 Photo"
        : "🎥 Vidéo";

    const { error: convError } = await supabase
      .from("conversations")
      .update({
        last_message: lastMessageText,
        last_message_type: type,
        last_message_at: new Date().toISOString(),
        last_message_sender_id: senderId,
        is_last_message_read: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (convError) {
      console.error("[chatService] Error updating conversation:", convError);
      // Ne pas throw ici, le message est déjà envoyé
    }

    // 3. Récupère les participants de la conversation pour créer la notification
    const { data: participants, error: participantsError } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .neq("user_id", senderId); // Exclut l'expéditeur

    if (!participantsError && participants && participants.length > 0) {
      // Crée une notification pour chaque destinataire
      const notifications = participants.map((p) => ({
        user_id: p.user_id,
        actor_id: senderId,
        type: "message" as const,
        resource_id: conversationId,
        is_read: false,
      }));

      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notifError) {
        console.error("[chatService] Error creating notification:", notifError);
        // Ne pas throw, la notification est secondaire
      }
    }

    return message as Message;
  } catch (error) {
    console.error("[chatService] Error in sendMessage:", error);
    throw error;
  }
}

/**
 * Récupère ou crée une conversation entre deux utilisateurs
 */
export async function getOrCreateConversation(
  currentUserId: string,
  targetUserId: string
): Promise<string> {
  try {
    // 1. Vérifie si une conversation existe déjà
    const { data: existingConvs, error: checkError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", currentUserId);

    if (checkError) {
      console.error("[chatService] Error checking conversations:", checkError);
      throw checkError;
    }

    // Vérifie si une conversation existe avec les deux participants
    if (existingConvs && existingConvs.length > 0) {
      const convIds = existingConvs.map((c) => c.conversation_id);

      const { data: matchingConv, error: matchError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", targetUserId)
        .in("conversation_id", convIds)
        .single();

      if (!matchError && matchingConv) {
        return matchingConv.conversation_id;
      }
    }

    // 2. Crée une nouvelle conversation
    const { data: newConv, error: convError } = await supabase
      .from("conversations")
      .insert({
        last_message: null,
        last_message_type: null,
        last_message_at: null,
        last_message_sender_id: null,
        is_last_message_read: true,
      })
      .select("id")
      .single();

    if (convError || !newConv) {
      console.error("[chatService] Error creating conversation:", convError);
      throw convError || new Error("Failed to create conversation");
    }

    // 3. Ajoute les participants
    const { error: participantsError } = await supabase
      .from("conversation_participants")
      .insert([
        { conversation_id: newConv.id, user_id: currentUserId },
        { conversation_id: newConv.id, user_id: targetUserId },
      ]);

    if (participantsError) {
      console.error("[chatService] Error adding participants:", participantsError);
      throw participantsError;
    }

    return newConv.id;
  } catch (error) {
    console.error("[chatService] Error in getOrCreateConversation:", error);
    throw error;
  }
}

/**
 * Récupère les messages d'une conversation
 */
export async function getMessages(
  conversationId: string,
  limit: number = 50
): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[chatService] Error fetching messages:", error);
      throw error;
    }

    return (data || []).reverse(); // Inverser pour avoir les plus anciens en premier
  } catch (error) {
    console.error("[chatService] Error in getMessages:", error);
    return [];
  }
}

/**
 * Marque les messages d'une conversation comme lus
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    // Marque les messages comme lus
    const { error: messagesError } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("is_read", false);

    if (messagesError) {
      console.error("[chatService] Error marking messages as read:", messagesError);
    }

    // Met à jour la conversation (uniquement si le dernier message n'est pas de moi)
    // Récupère d'abord la conversation pour vérifier
    const { data: conv, error: fetchError } = await supabase
      .from("conversations")
      .select("last_message_sender_id")
      .eq("id", conversationId)
      .single();

    if (!fetchError && conv && conv.last_message_sender_id !== userId) {
      // Le dernier message n'est pas de moi, on peut le marquer comme lu
      const { error: convError } = await supabase
        .from("conversations")
        .update({
          is_last_message_read: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);

      if (convError) {
        console.error("[chatService] Error updating conversation:", convError);
      }
    }
  } catch (error) {
    console.error("[chatService] Error in markMessagesAsRead:", error);
  }
}


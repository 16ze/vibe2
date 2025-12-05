import { vibe } from "@/api/vibeClient";
import ChatInput from "@/components/chat/ChatInput";
import MessageBubble from "@/components/chat/MessageBubble";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Info,
  Loader2,
  MessageCircle,
  Phone,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatViewProps {
  conversation: any;
  currentUser: any;
  onBack: () => void;
}

export default function ChatView({
  conversation,
  currentUser,
  onBack,
}: ChatViewProps) {
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  /**
   * Masque la BottomNav quand ChatView est monté
   */
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hide-bottom-nav"));
    }
    return () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("show-bottom-nav"));
      }
    };
  }, []);

  /**
   * Marque la conversation comme lue au montage du composant
   */
  useEffect(() => {
    const markConversationAsRead = async () => {
      if (!conversation?.id) return;

      try {
        // Met à jour la conversation pour mettre unread_count à 0
        await vibe.entities.Conversation.update(conversation.id, {
          unread_count: 0,
          updated_at: new Date().toISOString(),
        });

        // Invalide le cache pour rafraîchir la liste des conversations
        queryClient.invalidateQueries({
          queryKey: ["conversations", currentUser?.email],
        });
      } catch (error) {
        console.error("Error marking conversation as read:", error);
      }
    };

    markConversationAsRead();
  }, [conversation?.id, currentUser?.email, queryClient]);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", conversation.id],
    queryFn: async () => {
      const msgs = await vibe.entities.Message.filter(
        { conversation_id: conversation.id },
        "created_date"
      );
      // Trie par date croissante (les plus anciens en haut)
      return msgs.sort((a: any, b: any) => {
        const dateA = new Date(a.created_date || 0).getTime();
        const dateB = new Date(b.created_date || 0).getTime();
        return dateA - dateB;
      });
    },
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const newMessage = await vibe.entities.Message.create({
        conversation_id: conversation.id,
        sender_email: currentUser.email,
        sender_name:
          currentUser.full_name || currentUser.email?.split("@")[0] || "Moi",
        media_type: "text",
        created_date: new Date().toISOString(),
        ...(messageData || {}),
      });

      // Met à jour la conversation avec le dernier message
      await vibe.entities.Conversation.update(conversation.id, {
        last_message: messageData?.content || "Nouveau message",
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_type: messageData?.media_type || "text", // Stocke le type pour l'icône
      });

      return newMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversation.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["conversations", currentUser?.email],
      });

      // Scroll vers le bas après un court délai pour laisser le message s'afficher
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
  });

  /**
   * Scroll automatique vers le bas au chargement initial
   */
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      // Scroll immédiat au chargement initial (sans animation)
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    }
  }, [isLoading, messages.length]);

  /**
   * Scroll smooth pour les nouveaux messages (quand on envoie un message)
   */
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const handleSend = (messageData?: any) => {
    sendMutation.mutate(messageData);
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col z-[100]">
      {/* Header */}
      <header className="flex items-center justify-between px-2 h-14 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </motion.button>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                {conversation.participant_avatar ? (
                  <img
                    src={conversation.participant_avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold">
                    {conversation.participant_name?.charAt(0)?.toUpperCase() ||
                      "U"}
                  </div>
                )}
              </div>
              {conversation.is_online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">
                {conversation.participant_name || "Utilisateur"}
              </h2>
              <p className="text-xs text-gray-500">
                {conversation.is_online ? "En ligne" : "Hors ligne"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100">
            <Phone className="w-5 h-5 text-gray-700" />
          </button>
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100">
            <Video className="w-5 h-5 text-gray-700" />
          </button>
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100">
            <Info className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </header>

      {/* Messages scrollables avec scrollbar cachée */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4 bg-gray-50 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-gray-500 text-sm">Commence la conversation !</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => {
              const isOwn = message.sender_email === currentUser?.email;
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showAvatar =
                !isOwn &&
                (!prevMessage ||
                  prevMessage.sender_email !== message.sender_email ||
                  new Date(message.created_date).getTime() -
                    new Date(prevMessage.created_date).getTime() >
                    300000); // 5 minutes

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  avatar={conversation.participant_avatar}
                  senderName={
                    conversation.participant_name || message.sender_name
                  }
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
}

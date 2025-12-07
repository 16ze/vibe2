import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { SendHorizontal, Square } from "lucide-react";

interface ConversationItemProps {
  conversation: any;
  onClick?: (conversation: any) => void;
  isTyping?: boolean;
  currentUserId?: string; // ID de l'utilisateur actuel pour déterminer isMe
}

/**
 * Détermine la couleur selon le type de média
 */
function getMediaTypeColor(mediaType?: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (mediaType) {
    case "photo":
    case "image":
      return {
        bg: "bg-red-500",
        text: "text-red-500",
        border: "border-red-500",
      };
    case "video":
      return {
        bg: "bg-purple-500",
        text: "text-purple-500",
        border: "border-purple-500",
      };
    case "text":
    default:
      return {
        bg: "bg-blue-500",
        text: "text-blue-500",
        border: "border-blue-500",
      };
  }
}

export default function ConversationItem({
  conversation,
  onClick,
  isTyping = false,
  currentUserId,
}: ConversationItemProps) {
  // Utilise last_message_type de la conversation si disponible, sinon 'text' par défaut
  const lastMessageType = conversation.last_message_type || "text";
  const hasUnread = conversation.unread_count > 0;

  // Détermine si le dernier message est de moi
  const isMe =
    currentUserId && conversation.last_message_sender_id === currentUserId;

  // LOGIQUE SNAPCHAT :
  // - Si c'est MON message (isMe) : isRead = is_last_message_read (false = il n'a pas vu = PLEIN, true = il a vu = VIDE)
  // - Si c'est SON message (!isMe) : isRead = !hasUnread (true = j'ai lu = VIDE, false = je n'ai pas lu = PLEIN)
  const isRead = isMe
    ? conversation.is_last_message_read // Si mon message : true = lu par lui (VIDE), false = non lu par lui (PLEIN)
    : !hasUnread; // Si son message : true = lu par moi (VIDE), false = non lu par moi (PLEIN)

  const colors = getMediaTypeColor(lastMessageType);

  /**
   * Détermine la couleur de l'icône selon le type de message (Logique Snapchat)
   * 🔵 BLEU = Message Texte
   * 🔴 ROUGE = Photo/Image
   * 🟣 VIOLET = Vidéo
   */
  const getColorClass = (type: string) => {
    switch (type) {
      case "image":
      case "photo":
        return "text-red-500";
      case "video":
        return "text-purple-500";
      case "text":
      default:
        return "text-blue-500";
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98, backgroundColor: "rgba(0,0,0,0.02)" }}
      onClick={() => onClick?.(conversation)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      {/* Avatar - Gauche */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {conversation.participant_avatar ? (
            <img
              src={conversation.participant_avatar}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-lg">
              {conversation.participant_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
        </div>
        {conversation.is_online && (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-[3px] border-white" />
        )}
      </div>

      {/* Corps - Droite (Colonne) */}
      <div className="flex-1 min-w-0 text-left">
        {/* Ligne 1 : Nom */}
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-[15px] text-gray-900 truncate">
            {conversation.participant_name || "Anonyme"}
          </h3>
        </div>

        {/* Ligne 2 : Statut (Icône + Temps) */}
        {isTyping ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-gray-500 italic">
              En train d'écrire
            </span>
            <TypingIndicator />
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-0.5">
            {/* LOGIQUE SNAPCHAT :
                - FLÈCHE (SendHorizontal) = J'ai envoyé (isMe = true)
                - CARRÉ (Square) = J'ai reçu (isMe = false)
                - PLEIN (fill-current) = Non lu (isRead = false)
                - VIDE (outline) = Lu (isRead = true)
            */}
            {isMe ? (
              // FLÈCHE : J'ai envoyé
              // PLEIN = Il n'a pas vu (isRead = false) → fill-current
              // VIDE = Il a vu (isRead = true) → outline
              <SendHorizontal
                className={`w-[18px] h-[18px] ${getColorClass(
                  lastMessageType
                )} ${!isRead ? "fill-current" : ""}`}
                strokeWidth={isRead ? 2 : 1.5}
              />
            ) : (
              // CARRÉ : J'ai reçu
              // PLEIN = Je n'ai pas lu (isRead = false) → fill-current
              // VIDE = J'ai lu (isRead = true) → outline
              <Square
                className={`w-[18px] h-[18px] ${getColorClass(
                  lastMessageType
                )} ${!isRead ? "fill-current" : ""}`}
                strokeWidth={isRead ? 2 : 1.5}
              />
            )}

            {/* Temps relatif */}
            {conversation.last_message_at && (
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(conversation.last_message_at), {
                  addSuffix: true,
                  includeSeconds: false,
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}

/**
 * Indicateur d'animation "En train d'écrire..."
 */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1 h-1 bg-gray-400 rounded-full"
          animate={{
            y: [0, -4, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

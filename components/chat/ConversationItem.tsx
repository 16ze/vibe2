import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface ConversationItemProps {
  conversation: any;
  onClick?: (conversation: any) => void;
  isTyping?: boolean;
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
}: ConversationItemProps) {
  // Utilise last_message_type de la conversation si disponible, sinon 'text' par défaut
  const lastMessageType = conversation.last_message_type || "text";
  const hasUnread = conversation.unread_count > 0;

  const colors = getMediaTypeColor(lastMessageType);

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
            {conversation.participant_name || "Utilisateur"}
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
            {/* Badge de notification (si non lu) */}
            {hasUnread && (
              <div
                className={`flex-shrink-0 w-2 h-2 ${colors.bg} rounded-full`}
              />
            )}

            {/* Icône de statut */}
            <div
              className={`flex-shrink-0 w-3 h-3 ${
                hasUnread
                  ? colors.bg
                  : `border-2 ${colors.border} bg-transparent`
              } rounded-sm`}
            />

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

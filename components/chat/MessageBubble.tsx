import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  showTime?: boolean;
  showAvatar?: boolean;
  avatar?: string;
  senderName?: string;
}

export default function MessageBubble({ 
  message, 
  isOwn, 
  showTime = true,
  showAvatar = !isOwn, // Affiche l'avatar uniquement pour les messages de l'autre
  avatar,
  senderName
}: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'} px-4 py-0.5`}
    >
      {/* Avatar pour les messages de l'autre personne */}
      {showAvatar && !isOwn ? (
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {avatar ? (
            <img 
              src={avatar} 
              alt={senderName || ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-xs">
              {(senderName || message.sender_name || 'U')?.charAt(0)?.toUpperCase()}
            </div>
          )}
        </div>
      ) : isOwn ? (
        <div className="flex-shrink-0 w-8 h-8" /> // Espaceur pour aligner les messages à droite
      ) : null}

      <div className={`max-w-[75%] ${isOwn ? '' : ''}`}>
        {/* Media content */}
        {message.media_url && (
          <div className={`rounded-2xl overflow-hidden mb-1 ${
            isOwn ? 'rounded-br-md' : 'rounded-bl-md'
          }`}>
            {message.media_type === 'video' ? (
              <video 
                src={message.media_url} 
                className="max-w-full rounded-2xl"
                controls
              />
            ) : message.media_type === 'voice' ? (
              <div className={`px-4 py-3 rounded-2xl ${
                isOwn ? 'bg-blue-500' : 'bg-gray-100'
              }`}>
                <audio src={message.media_url} controls className="w-48" />
              </div>
            ) : (
              <img 
                src={message.media_url} 
                alt="" 
                className="max-w-full rounded-2xl"
              />
            )}
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <div className={`inline-flex flex-col ${
            isOwn 
              ? 'bg-blue-500 text-white rounded-2xl rounded-br-md' 
              : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md'
          }`}>
            {/* Reply preview */}
            {message.reply_to && (
              <div className={`text-xs px-3 pt-2 pb-1 border-l-2 ml-2 mt-2 ${
                isOwn ? 'border-white/50 text-white/70' : 'border-gray-400 text-gray-500'
              }`}>
                {message.reply_to.content?.substring(0, 50)}...
              </div>
            )}
            
            <div className="px-4 py-2.5 flex items-end gap-2">
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
              
              {showTime && (
                <span className={`text-[10px] flex-shrink-0 flex items-center gap-0.5 ${
                  isOwn ? 'text-white/70' : 'text-gray-400'
                }`}>
                  {message.created_date && format(new Date(message.created_date), 'HH:mm')}
                  {isOwn && (
                    message.is_read ? (
                      <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )
                  )}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Reactions */}
        {message.reactions?.length > 0 && (
          <div className={`flex gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {message.reactions.map((reaction: any, idx: number) => (
              <span 
                key={idx}
                className="bg-white shadow-sm rounded-full px-1.5 py-0.5 text-sm border border-gray-100"
              >
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
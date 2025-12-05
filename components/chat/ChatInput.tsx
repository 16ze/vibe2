import { motion } from "framer-motion";
import { Camera, Image, Mic, Send, Smile, X } from "lucide-react";
import React, { useRef, useState } from "react";

interface ChatInputProps {
  onSend?: (data: any) => void;
  onOpenCamera?: () => void;
  onOpenGallery?: () => void;
  replyingTo?: any;
  onCancelReply?: () => void;
}

export default function ChatInput({
  onSend,
  onOpenCamera,
  onOpenGallery,
  replyingTo,
  onCancelReply,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef(null);

  const handleSend = () => {
    if (message.trim()) {
      onSend?.({ content: message.trim(), reply_to_id: replyingTo?.id });
      setMessage("");
      onCancelReply?.();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-3 py-2 pb-safe z-50">
      {/* Reply preview */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-gray-50 rounded-xl">
          <div className="flex-1 border-l-2 border-blue-500 pl-2">
            <p className="text-xs text-gray-500">
              Réponse à {replyingTo.sender_name}
            </p>
            <p className="text-sm text-gray-700 truncate">
              {replyingTo.content}
            </p>
          </div>
          <button onClick={onCancelReply}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Camera button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onOpenCamera}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center"
        >
          <Camera className="w-5 h-5 text-white" />
        </motion.button>

        {/* Input container */}
        <div className="flex-1 flex items-end gap-2 bg-gray-100 rounded-3xl px-4 py-2">
          <button className="flex-shrink-0 pb-0.5">
            <Smile className="w-6 h-6 text-gray-500" />
          </button>

          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-[15px] text-gray-900 placeholder-gray-400 max-h-24"
            style={{ minHeight: "24px" }}
          />

          {!message.trim() ? (
            <div className="flex items-center gap-2 flex-shrink-0 pb-0.5">
              <button onClick={onOpenGallery}>
                <Image className="w-6 h-6 text-gray-500" />
              </button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={() => setIsRecording(true)}
                onPointerUp={() => setIsRecording(false)}
                onPointerLeave={() => setIsRecording(false)}
              >
                <Mic
                  className={`w-6 h-6 transition-colors ${
                    isRecording ? "text-red-500" : "text-gray-500"
                  }`}
                />
              </motion.button>
            </div>
          ) : (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              className="flex-shrink-0 pb-0.5"
            >
              <Send className="w-6 h-6 text-blue-500" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { TextPost } from "@/types/post";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react";
import React, { useEffect, useState } from "react";

/**
 * Props du composant TextPostCard
 * Accepte uniquement les posts de type texte (TextPost)
 * Design style Twitter/Threads : minimaliste, fond blanc, layout horizontal
 */
interface TextPostCardProps {
  post: TextPost;
  onLike?: (postId: string) => void;
  onComment?: (post: TextPost) => void;
  onShare?: (post: TextPost) => void;
  onSave?: (postId: string) => void;
  isLiked?: boolean;
}

/**
 * Fonction utilitaire pour générer un username à partir du nom
 * Exemple: "John Doe" -> "@john_doe"
 */
function generateUsername(name: string): string {
  return `@${name.toLowerCase().replace(/\s+/g, "_")}`;
}

/**
 * Fonction pour formater la date relative de manière compacte
 * Exemple: "il y a 2 heures" -> "2h"
 */
function formatCompactTime(date: Date): string {
  const distance = formatDistanceToNow(date, { addSuffix: true });
  // Simplifie les formats courants
  if (distance.includes("minute")) {
    const minutes = distance.match(/\d+/)?.[0] || "0";
    return `${minutes}min`;
  }
  if (distance.includes("heure") || distance.includes("hour")) {
    const hours = distance.match(/\d+/)?.[0] || "0";
    return `${hours}h`;
  }
  if (distance.includes("jour") || distance.includes("day")) {
    const days = distance.match(/\d+/)?.[0] || "0";
    return `${days}j`;
  }
  return distance;
}

/**
 * Composant TextPostCard
 * Affiche un post de type texte avec un design minimaliste style Twitter/Threads
 * Fond blanc, layout horizontal, pas de dégradé
 */
export default function TextPostCard({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
  isLiked = false,
}: TextPostCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [timeAgo, setTimeAgo] = useState<string>("");

  /**
   * Calcule le temps relatif côté client uniquement
   * Évite les erreurs d'hydratation avec formatDistanceToNow
   */
  useEffect(() => {
    if (post.created_date) {
      const date = new Date(post.created_date);
      setTimeAgo(formatCompactTime(date));
    } else {
      setTimeAgo("Maintenant");
    }
  }, [post.created_date]);

  /**
   * Gère le clic sur le bouton like
   * Met à jour l'état local et appelle le callback parent
   */
  const handleLike = () => {
    if (liked) {
      setLikesCount((prev: number) => prev - 1);
    } else {
      setLikesCount((prev: number) => prev + 1);
    }
    setLiked(!liked);
    onLike?.(post.id);
  };

  /**
   * Divise le contenu en lignes pour gérer les sauts de ligne
   */
  const contentLines = post.content.split("\n");

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
    >
      {/* Container principal avec padding confortable */}
      <div className="px-4 py-5">
        {/* Header : Avatar + Nom + Username + Date */}
        <div className="flex items-start gap-3 mb-4">
          {/* Avatar avec bordure subtile */}
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 flex-shrink-0 ring-1 ring-gray-200">
            {post.author_avatar ? (
              <img
                src={post.author_avatar}
                alt={`Avatar de ${post.author_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-purple-600 font-bold text-base">
                {post.author_name?.charAt(0)?.toUpperCase() || "V"}
              </div>
            )}
          </div>

          {/* Informations utilisateur et date */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-[15px] text-gray-900 hover:underline cursor-pointer">
                {post.author_name || "Utilisateur"}
              </h3>
              <span className="text-[14px] text-gray-500">
                {generateUsername(post.author_name || "utilisateur")}
              </span>
              <span className="text-gray-400">·</span>
              <time className="text-[14px] text-gray-500 hover:underline cursor-pointer">
                {timeAgo}
              </time>
            </div>
          </div>

          {/* Bouton options avec meilleur hover */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full hover:bg-blue-50 transition-colors flex-shrink-0"
            aria-label="Plus d'options"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </motion.button>
        </div>

        {/* Body : Contenu textuel avec meilleure lisibilité */}
        <div className="mb-4 -mt-1">
          <p className="text-[15.5px] leading-[1.6] text-gray-900 whitespace-pre-line break-words font-normal tracking-tight">
            {contentLines.map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < contentLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        </div>

        {/* Footer : Actions (Like, Comment, Share) avec meilleure visibilité */}
        <div className="flex items-center gap-8 pt-2 -mb-1">
          {/* Bouton Comment avec hover amélioré */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onComment?.(post)}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-all duration-200 group relative"
            aria-label="Commenter"
          >
            <div className="p-1.5 rounded-full group-hover:bg-blue-50 transition-colors">
              <MessageCircle className="w-5 h-5 group-hover:fill-blue-500 transition-all" />
            </div>
            {(post.comments_count || 0) > 0 && (
              <span className="text-[13px] font-medium min-w-[20px]">
                {post.comments_count.toLocaleString()}
              </span>
            )}
          </motion.button>

          {/* Bouton Like avec animation améliorée */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-all duration-200 group relative"
            aria-label="Aimer"
          >
            <motion.div
              className="p-1.5 rounded-full group-hover:bg-red-50 transition-colors"
              animate={liked ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart
                className={`w-5 h-5 transition-all ${
                  liked
                    ? "text-red-500 fill-red-500"
                    : "group-hover:fill-red-500"
                }`}
              />
            </motion.div>
            {likesCount > 0 && (
              <span
                className={`text-[13px] font-medium min-w-[20px] transition-colors ${
                  liked ? "text-red-500" : "text-gray-500"
                }`}
              >
                {likesCount.toLocaleString()}
              </span>
            )}
          </motion.button>

          {/* Bouton Share avec hover amélioré */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onShare?.(post)}
            className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-all duration-200 group"
            aria-label="Partager"
          >
            <div className="p-1.5 rounded-full group-hover:bg-green-50 transition-colors">
              <Send className="w-5 h-5 group-hover:fill-green-500 transition-all" />
            </div>
          </motion.button>

          {/* Bouton Save (Bookmark) avec meilleur style */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setSaved(!saved);
              onSave?.(post.id);
            }}
            className="ml-auto text-gray-500 hover:text-purple-500 transition-all duration-200 group"
            aria-label="Enregistrer"
          >
            <div className="p-1.5 rounded-full group-hover:bg-purple-50 transition-colors">
              <Bookmark
                className={`w-5 h-5 transition-all ${
                  saved
                    ? "text-purple-500 fill-purple-500"
                    : "group-hover:fill-purple-500"
                }`}
              />
            </div>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

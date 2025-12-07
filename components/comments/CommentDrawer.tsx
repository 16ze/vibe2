"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { addComment, getComments } from "@/services/postService";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Props du composant CommentDrawer
 */
interface CommentDrawerProps {
  /**
   * Indique si le drawer est ouvert
   */
  isOpen: boolean;

  /**
   * Callback appelé pour fermer le drawer
   */
  onClose: () => void;

  /**
   * ID du post pour lequel afficher les commentaires
   */
  postId: string | null;
}

/**
 * Interface pour un commentaire depuis Supabase
 */
interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

/**
 * Composant CommentDrawer
 * Panneau de commentaires qui slide depuis le bas de l'écran
 * Style TikTok/Instagram avec animation fluide
 * Les commentaires sont filtrés par postId pour isoler chaque post
 */
export default function CommentDrawer({
  isOpen,
  onClose,
  postId,
}: CommentDrawerProps) {
  /**
   * Récupère les fonctions pour masquer/afficher la BottomNav
   */
  const { hideBottomNav, showBottomNav } = useUI();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Charge les commentaires depuis Supabase
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Masque la BottomNav quand le drawer est ouvert
   * La réaffiche quand le drawer est fermé
   * Pattern robuste avec délai de sécurité pour les animations
   */
  useEffect(() => {
    if (isOpen) {
      hideBottomNav();
    } else {
      // Délai de sécurité pour laisser l'animation de fermeture se finir si besoin
      const timer = setTimeout(() => {
        showBottomNav();
      }, 100);
      return () => clearTimeout(timer);
    }

    // Sécurité ultime au démontage
    return () => {
      showBottomNav();
    };
  }, [isOpen, hideBottomNav, showBottomNav]);
  const [newComment, setNewComment] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  /**
   * Charge les commentaires depuis Supabase quand le drawer s'ouvre ou que le postId change
   */
  useEffect(() => {
    const loadComments = async () => {
      if (!postId || !isOpen) {
        setComments([]);
        return;
      }

      try {
        setIsLoading(true);
        const supabaseComments = await getComments(postId);
        // Inverse l'ordre pour avoir les plus anciens en premier (comme Instagram)
        setComments(supabaseComments.reverse());
      } catch (error) {
        console.error("[CommentDrawer] Error loading comments:", error);
        setComments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [postId, isOpen]);

  /**
   * Scroll vers le bas quand de nouveaux commentaires sont ajoutés
   */
  useEffect(() => {
    if (isOpen && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, isOpen]);

  /**
   * Focus sur l'input quand le drawer s'ouvre
   * Bloque le scroll du body quand ouvert
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else {
      document.body.style.overflow = "";
      setNewComment("");
    }
  }, [isOpen]);

  /**
   * Gère l'envoi d'un nouveau commentaire
   * Sauvegarde dans Supabase et ajoute immédiatement à la liste locale
   */
  const handleSendComment = async () => {
    if (!newComment.trim() || !postId || !currentUser?.id) return;

    const commentText = newComment.trim();
    setNewComment("");

    try {
      // Ajoute le commentaire dans Supabase
      const newCommentData = await addComment(postId, currentUser.id, commentText);

      // Ajoute immédiatement le nouveau commentaire à la liste locale
      setComments((prev) => [newCommentData, ...prev]);

      // Invalide le cache des posts pour mettre à jour le compteur de commentaires
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      // Scroll vers le bas après un court délai
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      inputRef.current?.focus();
    } catch (error) {
      console.error("[CommentDrawer] Error sending comment:", error);
      alert("Erreur lors de l'envoi du commentaire. Veuillez réessayer.");
      // Restaure le texte en cas d'erreur
      setNewComment(commentText);
    }
  };

  /**
   * Gère le clic sur "Répondre" pour mentionner un utilisateur
   * Ajoute @username dans l'input et donne le focus (style Instagram)
   * @param username - Nom d'utilisateur à mentionner
   */
  const handleReply = (username: string) => {
    // Ajoute la mention au début de l'input si vide, sinon à la fin
    const mention = `@${username} `;
    setNewComment((prev) => {
      // Si l'input est vide, on ajoute juste la mention
      if (!prev.trim()) {
        return mention;
      }
      // Sinon, on ajoute la mention à la fin avec un espace
      return `${prev}${mention}`;
    });

    // Donne le focus à l'input après un court délai pour s'assurer que le state est mis à jour
    setTimeout(() => {
      inputRef.current?.focus();
      // Place le curseur à la fin du texte
      if (inputRef.current) {
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
      }
    }, 0);
  };

  /**
   * Gère le like d'un commentaire
   */
  const handleLikeComment = (commentId: string) => {
    setLikedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
        setAllComments((prevComments) =>
          prevComments.map((c) =>
            c.id === commentId
              ? { ...c, likes_count: Math.max(0, c.likes_count - 1) }
              : c
          )
        );
      } else {
        newSet.add(commentId);
        setAllComments((prevComments) =>
          prevComments.map((c) =>
            c.id === commentId ? { ...c, likes_count: c.likes_count + 1 } : c
          )
        );
      }
      return newSet;
    });
  };

  /**
   * Formate la date relative de manière compacte
   */
  const formatTimeAgo = (date: string): string => {
    const distance = formatDistanceToNow(new Date(date), { addSuffix: true });
    if (distance.includes("minute")) {
      const minutes = distance.match(/\d+/)?.[0] || "0";
      return `${minutes}m`;
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
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Fond noir semi-transparent qui ferme au clic */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Panel - Panneau qui slide depuis le bas (y: "100%" vers y: 0) */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 flex flex-col"
            style={{ height: "75vh", maxHeight: "75vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle - Barre grise au centre haut pour indiquer qu'on peut tirer */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header - Titre 'Commentaires' centré + bouton fermer (X) à droite */}
            <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-100">
              <div className="flex-1" />
              <h2 className="text-lg font-bold text-gray-900 flex-1 text-center">
                Commentaires
              </h2>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* List - Zone scrollable (overflow-y-auto) contenant les commentaires */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
                  <p className="text-gray-500 text-sm">Chargement...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-gray-500 text-sm">
                    Aucun commentaire pour l&apos;instant
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    Sois le premier à commenter !
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => {
                    const authorName =
                      comment.profiles?.full_name ||
                      comment.profiles?.username ||
                      "Anonyme";
                    const authorAvatar = comment.profiles?.avatar_url;

                    return (
                      <div key={comment.id} className="flex gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 flex-shrink-0">
                          {authorAvatar ? (
                            <img
                              src={authorAvatar}
                              alt={authorName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-purple-600 font-bold text-sm">
                              {authorName?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          )}
                        </div>

                        {/* Contenu du commentaire */}
                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-50 rounded-2xl px-4 py-3">
                            {/* Nom et date */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-gray-900">
                                {authorName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(comment.created_at)}
                              </span>
                            </div>

                            {/* Texte du commentaire */}
                            <p className="text-sm text-gray-900 leading-relaxed">
                              {comment.content}
                            </p>
                          </div>

                          {/* Actions (Like et Répondre) */}
                          <div className="flex items-center gap-4 mt-2 ml-1">
                            <button
                              onClick={() => handleLikeComment(comment.id)}
                              className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors group"
                            >
                              <Heart
                                className={`w-4 h-4 transition-all ${
                                  likedComments.has(comment.id)
                                    ? "text-red-500 fill-red-500"
                                    : "group-hover:fill-red-500"
                                }`}
                              />
                            </button>
                            {/* Bouton Répondre - Ajoute @username dans l'input (style Instagram) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReply(authorName);
                              }}
                              className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              Répondre
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={commentsEndRef} />
                </div>
              )}
            </div>

            {/* Input Zone - Fixée en bas du drawer avec champ texte et bouton envoyer */}
            <div className="border-t border-gray-100 p-4 bg-white">
              <div className="flex items-end gap-3">
                <div className="flex-1 flex items-end gap-2 bg-gray-100 rounded-3xl px-4 py-2.5">
                  <textarea
                    ref={inputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                    placeholder="Ajouter un commentaire..."
                    rows={1}
                    className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-900 placeholder-gray-400 max-h-24"
                    style={{ minHeight: "20px" }}
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSendComment}
                  disabled={!newComment.trim()}
                  className={`p-2.5 rounded-full transition-all ${
                    newComment.trim()
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                  aria-label="Envoyer"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

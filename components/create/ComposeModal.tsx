"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { vibe } from "@/api/vibeClient";
import { TextPost } from "@/types/post";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Props du composant ComposeModal
 */
interface ComposeModalProps {
  /**
   * Indique si le modal est ouvert
   */
  isOpen: boolean;

  /**
   * Callback appelé pour fermer le modal
   */
  onClose: () => void;

  /**
   * Utilisateur actuel (pour l'auteur du post)
   */
  currentUser?: any;
}

/**
 * Composant ComposeModal
 * Modal pour créer un nouveau post texte (status)
 * Design mobile-first, plein écran
 */
export default function ComposeModal({
  isOpen,
  onClose,
  currentUser,
}: ComposeModalProps) {
  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  /**
   * Focus automatique sur le textarea quand le modal s'ouvre
   * Bloque le scroll du body quand ouvert
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = "";
      setContent("");
      setIsPublishing(false);
    }
  }, [isOpen]);

  /**
   * Ajuste automatiquement la hauteur du textarea
   */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  /**
   * Gère la publication du post
   * Crée un TextPost conforme à l'interface TypeScript
   */
  const handlePublish = async () => {
    if (!content.trim() || isPublishing) return;

    setIsPublishing(true);

    try {
      // Récupère l'utilisateur actuel si non fourni
      let user = currentUser;
      if (!user) {
        try {
          user = await vibe.auth.me();
        } catch (error) {
          // Utilisateur par défaut si pas de login
          user = {
            email: "user@vibe.app",
            name: "Utilisateur Vibe",
          };
        }
      }

      // Crée l'objet TextPost conforme à l'interface
      const newPost: Omit<TextPost, "id"> = {
        type: "text",
        content: content.trim(),
        author_name: user.name || user.email?.split("@")[0] || "Utilisateur",
        author_avatar: user.avatar,
        created_by: user.email,
        likes_count: 0,
        comments_count: 0,
        created_date: new Date().toISOString(),
      };

      // Sauvegarde le post via vibeClient
      await vibe.entities.Post.create(newPost);

      // Rafraîchit le feed en invalidant la query
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      // Ferme le modal
      onClose();

      // Optionnel : Dispatch un événement pour notifier d'autres composants
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("post-published"));
      }
    } catch (error) {
      console.error("Erreur lors de la publication du post:", error);
      alert("Erreur lors de la publication. Veuillez réessayer.");
    } finally {
      setIsPublishing(false);
    }
  };

  /**
   * Gère la fermeture du modal avec confirmation si du contenu est saisi
   */
  const handleClose = () => {
    if (content.trim() && !isPublishing) {
      const confirmClose = window.confirm(
        "Voulez-vous vraiment annuler ? Votre texte sera perdu."
      );
      if (!confirmClose) return;
    }
    onClose();
  };

  /**
   * Gère la touche Escape pour fermer
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, content]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClose}
          />

          {/* Modal - Plein écran mobile-first */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              {/* Bouton Annuler à gauche */}
              <button
                onClick={handleClose}
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                disabled={isPublishing}
              >
                Annuler
              </button>

              {/* Titre centré */}
              <h2 className="text-lg font-bold text-gray-900">
                Nouveau Vibe
              </h2>

              {/* Bouton Publier à droite */}
              <button
                onClick={handlePublish}
                disabled={!content.trim() || isPublishing}
                className={`px-4 py-1.5 rounded-full font-semibold text-sm transition-all ${
                  content.trim() && !isPublishing
                    ? "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white hover:opacity-90 shadow-md"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isPublishing ? "Publication..." : "Publier"}
              </button>
            </div>

            {/* Body - Textarea qui prend toute la place restante */}
            <div className="flex-1 overflow-hidden px-4 py-4">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Quoi de neuf ?"
                className="w-full h-full resize-none outline-none bg-transparent text-xl text-gray-900 placeholder-gray-400 leading-relaxed"
                style={{ minHeight: "100%" }}
                disabled={isPublishing}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { createPost } from "@/services/postService";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

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
  /**
   * Récupère les fonctions pour masquer/afficher la BottomNav
   */
  const { hideBottomNav, showBottomNav } = useUI();
  const { user: currentUserAuth } = useAuth();
  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  /**
   * Masque la BottomNav quand le modal est ouvert
   * La réaffiche quand le modal est fermé
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
   * Utilise Supabase pour créer un post texte
   */
  const handlePublish = async () => {
    if (!content.trim() || isPublishing) return;

    // Vérifie que l'utilisateur est connecté
    const user = currentUser || currentUserAuth;
    if (!user?.id) {
      alert("Vous devez être connecté pour publier.");
      return;
    }

    setIsPublishing(true);

    try {
      // Crée le post texte via Supabase (sans média)
      await createPost(user.id, null, "text", content.trim());

      // Rafraîchit le feed en invalidant la query
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts", user.id] });

      // Ferme le modal
      onClose();
    } catch (error) {
      console.error("Erreur lors de la publication du post:", error);
      alert("Erreur lors de la publication : " + (error as Error).message);
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
              <h2 className="text-lg font-bold text-gray-900">Nouveau Vibe</h2>

              {/* Bouton Publier à droite */}
              <button
                onClick={handlePublish}
                disabled={!content.trim() || isPublishing}
                className={`px-4 py-1.5 rounded-full font-semibold text-sm transition-all ${
                  content.trim() && !isPublishing
                    ? "bg-gradient-vibe text-white hover:opacity-90 shadow-md glow-vibe"
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

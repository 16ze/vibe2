"use client";

import { createContext, ReactNode, useContext, useState } from "react";

/**
 * Interface pour le contexte des commentaires
 */
interface CommentsContextType {
  /**
   * Indique si le drawer de commentaires est ouvert
   */
  isDrawerOpen: boolean;

  /**
   * ID du post actif pour lequel on affiche les commentaires
   */
  activePostId: string | null;

  /**
   * Ouvre le drawer de commentaires pour un post spécifique
   * @param postId - ID du post pour lequel afficher les commentaires
   */
  openDrawer: (postId: string) => void;

  /**
   * Ferme le drawer de commentaires
   */
  closeDrawer: () => void;
}

/**
 * Contexte pour gérer l'état du drawer de commentaires
 */
const CommentsContext = createContext<CommentsContextType | undefined>(
  undefined
);

/**
 * Props du provider du contexte des commentaires
 */
interface CommentsProviderProps {
  children: ReactNode;
}

/**
 * Provider du contexte des commentaires
 * Gère l'état global du drawer de commentaires dans l'application
 */
export function CommentsProvider({ children }: CommentsProviderProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);

  /**
   * Ouvre le drawer de commentaires pour un post spécifique
   */
  const openDrawer = (postId: string) => {
    setActivePostId(postId);
    setIsDrawerOpen(true);
    // Empêche le scroll du body quand le drawer est ouvert
    document.body.style.overflow = "hidden";
  };

  /**
   * Ferme le drawer de commentaires
   */
  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setActivePostId(null);
    // Réactive le scroll du body
    document.body.style.overflow = "";
  };

  return (
    <CommentsContext.Provider
      value={{
        isDrawerOpen,
        activePostId,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </CommentsContext.Provider>
  );
}

/**
 * Hook personnalisé pour accéder au contexte des commentaires
 * @throws Error si utilisé en dehors du CommentsProvider
 */
export function useComments() {
  const context = useContext(CommentsContext);
  if (context === undefined) {
    throw new Error("useComments must be used within a CommentsProvider");
  }
  return context;
}

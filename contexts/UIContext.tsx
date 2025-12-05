"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

/**
 * Interface pour le contexte UI
 */
interface UIContextType {
  /**
   * Indique si la BottomNav est visible
   */
  isBottomNavVisible: boolean;

  /**
   * Cache la BottomNav
   */
  hideBottomNav: () => void;

  /**
   * Affiche la BottomNav
   */
  showBottomNav: () => void;
}

/**
 * Contexte UI pour gérer l'état global de l'interface utilisateur
 * Permet de contrôler la visibilité de la BottomNav depuis n'importe quel composant
 */
const UIContext = createContext<UIContextType | undefined>(undefined);

/**
 * Props du provider UI
 */
interface UIProviderProps {
  /**
   * Composants enfants à envelopper
   */
  children: ReactNode;
}

/**
 * Provider UI - Enveloppe l'application pour fournir le contexte UI
 */
export function UIProvider({ children }: UIProviderProps) {
  /**
   * État de visibilité de la BottomNav (visible par défaut)
   */
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);

  /**
   * Cache la BottomNav
   * Utilise useCallback pour éviter la recréation à chaque rendu
   * et prévenir les boucles infinies dans les useEffect des consommateurs
   */
  const hideBottomNav = useCallback(() => {
    setIsBottomNavVisible(false);
  }, []);

  /**
   * Affiche la BottomNav
   * Utilise useCallback pour éviter la recréation à chaque rendu
   * et prévenir les boucles infinies dans les useEffect des consommateurs
   */
  const showBottomNav = useCallback(() => {
    setIsBottomNavVisible(true);
  }, []);

  /**
   * Mémorise la valeur du contexte pour éviter les re-renders inutiles
   * Les fonctions sont déjà stables grâce à useCallback
   */
  const contextValue = useMemo(
    () => ({
      isBottomNavVisible,
      hideBottomNav,
      showBottomNav,
    }),
    [isBottomNavVisible, hideBottomNav, showBottomNav]
  );

  return (
    <UIContext.Provider value={contextValue}>{children}</UIContext.Provider>
  );
}

/**
 * Hook personnalisé pour accéder au contexte UI
 * @throws {Error} Si utilisé en dehors d'un UIProvider
 */
export function useUI(): UIContextType {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}

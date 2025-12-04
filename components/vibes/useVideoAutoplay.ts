'use client';

import React, { useEffect, useRef, useState, RefObject } from 'react';

/**
 * Interface pour les options du hook useVideoAutoplay
 */
interface UseVideoAutoplayOptions {
  /**
   * Seuil de visibilité (0-1) pour considérer qu'un élément est visible
   * @default 0.5
   */
  threshold?: number;
  
  /**
   * Marge racine pour l'IntersectionObserver (en pixels)
   * @default '0px'
   */
  rootMargin?: string;
}

/**
 * Hook personnalisé pour gérer la lecture automatique des vidéos
 * Utilise IntersectionObserver pour détecter quelle vidéo est visible
 * 
 * @param containerRef - Référence au conteneur scrollable
 * @param itemCount - Nombre d'éléments vidéo dans le feed
 * @param options - Options de configuration
 * @returns Tableau d'états indiquant si chaque vidéo est active
 */
export function useVideoAutoplay(
  containerRef: RefObject<HTMLElement>,
  itemCount: number,
  options: UseVideoAutoplayOptions = {}
): boolean[] {
  const { threshold = 0.5, rootMargin = '0px' } = options;
  const [activeIndices, setActiveIndices] = useState<boolean[]>(
    new Array(itemCount).fill(false)
  );
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  /**
   * Initialise les références des éléments
   */
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, itemCount);
  }, [itemCount]);

  /**
   * Configure l'IntersectionObserver pour détecter les vidéos visibles
   */
  useEffect(() => {
    if (!containerRef.current) return;

    // Nettoie l'observer précédent
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    /**
     * Callback appelé quand l'intersection change
     */
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const newActiveIndices = new Array(itemCount).fill(false);

      entries.forEach((entry) => {
        const index = itemRefs.current.indexOf(entry.target as HTMLElement);
        if (index !== -1 && entry.isIntersecting && entry.intersectionRatio >= threshold) {
          newActiveIndices[index] = true;
        }
      });

      setActiveIndices(newActiveIndices);
    };

    // Crée un nouvel observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: containerRef.current,
      rootMargin,
      threshold,
    });

    // Observe tous les éléments
    itemRefs.current.forEach((item) => {
      if (item) {
        observerRef.current?.observe(item);
      }
    });

    // Nettoie lors du démontage
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [containerRef, itemCount, threshold, rootMargin]);

  /**
   * Fonction pour enregistrer une référence d'élément
   */
  const registerItemRef = (index: number, element: HTMLElement | null) => {
    if (itemRefs.current[index] !== element) {
      // Désenregistre l'ancien élément s'il existe
      if (itemRefs.current[index] && observerRef.current) {
        observerRef.current.unobserve(itemRefs.current[index]!);
      }

      itemRefs.current[index] = element;

      // Enregistre le nouvel élément
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    }
  };

  return activeIndices;
}

/**
 * Hook simplifié qui retourne aussi la fonction pour enregistrer les refs
 */
export function useVideoAutoplayWithRefs(
  containerRef: RefObject<HTMLElement>,
  itemCount: number,
  options: UseVideoAutoplayOptions = {}
): [boolean[], (index: number, element: HTMLElement | null) => void] {
  const { threshold = 0.5, rootMargin = '0px' } = options;
  const [activeIndices, setActiveIndices] = useState<boolean[]>(
    new Array(itemCount).fill(false)
  );
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Initialise le tableau de refs avec la bonne taille
    const currentLength = itemRefs.current.length;
    if (currentLength < itemCount) {
      itemRefs.current = [...itemRefs.current, ...new Array(itemCount - currentLength).fill(null)];
    } else if (currentLength > itemCount) {
      itemRefs.current = itemRefs.current.slice(0, itemCount);
    }
  }, [itemCount]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Nettoie l'observer précédent
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    /**
     * Callback appelé quand l'intersection change
     */
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const newActiveIndices = new Array(itemCount).fill(false);

      entries.forEach((entry) => {
        const index = itemRefs.current.indexOf(entry.target as HTMLElement);
        if (index !== -1 && entry.isIntersecting && entry.intersectionRatio >= threshold) {
          newActiveIndices[index] = true;
        }
      });

      setActiveIndices(newActiveIndices);
    };

    // Crée un nouvel observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: containerRef.current,
      rootMargin,
      threshold,
    });

    // Observe tous les éléments déjà enregistrés
    itemRefs.current.forEach((item) => {
      if (item) {
        observerRef.current?.observe(item);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [containerRef, itemCount, threshold, rootMargin]);

  /**
   * Fonction pour enregistrer une référence d'élément
   * Utilise useCallback pour éviter les re-renders inutiles
   */
  const registerItemRef = React.useCallback((index: number, element: HTMLElement | null) => {
    if (itemRefs.current[index] !== element) {
      // Désenregistre l'ancien élément s'il existe
      if (itemRefs.current[index] && observerRef.current) {
        observerRef.current.unobserve(itemRefs.current[index]!);
      }

      itemRefs.current[index] = element;

      // Enregistre le nouvel élément
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    }
  }, []);

  return [activeIndices, registerItemRef];
}


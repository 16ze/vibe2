"use client";

import React, { useState, useEffect, useRef, forwardRef } from "react";
import { indexedDBStorage } from "@/utils/indexedDB";

/**
 * Props du composant MediaRenderer
 */
interface MediaRendererProps {
  /**
   * Source du média : URL classique (http, blob, data) ou ID IndexedDB
   */
  src: string;

  /**
   * Type de média : 'image' ou 'video'
   */
  type: "image" | "video";

  /**
   * Classes CSS supplémentaires
   */
  className?: string;

  /**
   * Props supplémentaires pour l'élément img ou video
   */
  [key: string]: any;
}

/**
 * Composant MediaRenderer
 * Gère l'affichage des médias depuis IndexedDB ou URLs classiques
 * Nettoie automatiquement les URLs blob pour éviter les fuites de mémoire
 * Forward le ref pour permettre le contrôle vidéo depuis le parent
 */
const MediaRenderer = forwardRef<HTMLVideoElement | HTMLImageElement, MediaRendererProps>(
  function MediaRenderer(
    {
      src,
      type,
      className = "",
      ...props
    },
    ref
  ) {
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  /**
   * Détermine si la source est une URL classique (http, blob, data)
   * ou un ID IndexedDB (string simple sans préfixe)
   */
  const isClassicUrl = (url: string): boolean => {
    return (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("blob:") ||
      url.startsWith("data:")
    );
  };

  /**
   * Charge le média depuis IndexedDB ou utilise l'URL directement
   */
  useEffect(() => {
    if (!src) {
      setMediaUrl("");
      setIsLoading(false);
      return;
    }

    // Si c'est une URL classique, l'utilise directement
    if (isClassicUrl(src)) {
      setMediaUrl(src);
      setIsLoading(false);
      return;
    }

    // Sinon, c'est probablement un ID IndexedDB
    // Utilise getFileUrl pour récupérer le Blob
    const loadFromIndexedDB = async () => {
      try {
        setIsLoading(true);
        setError(false);

        // Si src commence par "indexeddb://", on extrait l'ID
        // Sinon, on considère que src est directement l'ID
        const fileId = src.startsWith("indexeddb://")
          ? src.replace("indexeddb://", "")
          : src;

        // Construit l'URL IndexedDB au format attendu
        const indexedDbUrl = `indexeddb://${fileId}`;

        console.log("[MediaRenderer] Loading from IndexedDB:", indexedDbUrl);

        // Récupère l'URL blob depuis IndexedDB
        const url = await indexedDBStorage.File.getFileUrl(indexedDbUrl);

        if (url) {
          // Nettoie l'ancienne URL blob si elle existe
          if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
            URL.revokeObjectURL(blobUrlRef.current);
          }

          setMediaUrl(url);
          blobUrlRef.current = url.startsWith("blob:") ? url : null;
          console.log("[MediaRenderer] Media loaded successfully:", url.substring(0, 50));
        } else {
          console.error("[MediaRenderer] No URL returned from IndexedDB");
          setError(true);
        }
      } catch (err) {
        console.error("[MediaRenderer] Error loading media from IndexedDB:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadFromIndexedDB();

    // Cleanup : révoque l'URL blob au démontage
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [src]);

  /**
   * Affiche un placeholder pendant le chargement
   */
  if (isLoading) {
    return (
      <div
        className={`${className} bg-gray-100 flex items-center justify-center`}
      >
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  /**
   * Affiche un message d'erreur si le chargement a échoué
   */
  if (error || !mediaUrl) {
    return (
      <div
        className={`${className} bg-gray-100 flex items-center justify-center`}
      >
        <div className="text-center px-4">
          <p className="text-gray-400 text-sm">Média non disponible</p>
        </div>
      </div>
    );
  }

  /**
   * Affiche l'image ou la vidéo selon le type
   * Forward le ref pour permettre le contrôle vidéo depuis le parent
   */
  if (type === "video") {
    return (
      <video
        ref={ref as React.Ref<HTMLVideoElement>}
        src={mediaUrl}
        className={className}
        {...props}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <img
      ref={ref as React.Ref<HTMLImageElement>}
      src={mediaUrl}
      alt=""
      className={className}
      {...props}
      onError={() => setError(true)}
    />
  );
});

export default MediaRenderer;


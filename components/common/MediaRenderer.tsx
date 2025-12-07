"use client";

import React, { useEffect, useState, useRef, forwardRef } from "react";
import { indexedDBStorage } from "@/utils/indexedDB";

interface MediaRendererProps {
  src: string;
  type: "image" | "video";
  className?: string;
  alt?: string;
  // Props pour la vidéo
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  // Props supplémentaires
  [key: string]: any;
}

/**
 * Composant MediaRenderer - Version Hybride
 * Gère les URLs distantes (Supabase, HTTP) et les fichiers locaux (IndexedDB)
 */
const MediaRenderer = forwardRef<HTMLVideoElement | HTMLImageElement, MediaRendererProps>(
  function MediaRenderer(
    {
      src,
      type,
      className = "",
      alt,
      autoPlay = true,
      muted = true,
      loop = true,
      playsInline = true,
      controls = false,
      onPlay,
      onPause,
      ...props
    },
    ref
  ) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);
    const blobUrlRef = useRef<string | null>(null);

    useEffect(() => {
      if (!src) {
        setObjectUrl(null);
        setError(false);
        return;
      }

      // VALIDATION CRITIQUE : Pour les vidéos, on refuse les blob URLs (Safari ne les supporte pas)
      if (type === "video" && src.startsWith("blob:")) {
        console.error(
          "[MediaRenderer] ❌ ERREUR : Blob URL détectée pour vidéo. " +
          "Safari ne peut pas charger les vidéos depuis blob URLs. " +
          "L'URL doit être une URL HTTPS directe depuis Supabase Storage. " +
          "URL actuelle:", src
        );
        setError(true);
        setObjectUrl(null);
        return;
      }

      // CAS 1 : C'est une URL Web (Supabase, HTTP, HTTPS, chemins relatifs)
      // IMPORTANT : Pour Safari, on utilise directement les URLs HTTPS, pas de blob URLs
      if (
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("/") ||
        src.startsWith("data:")
      ) {
        // URLs HTTPS directes - Safari les gère bien
        setObjectUrl(src);
        setError(false);
        return;
      }

      // CAS 1.5 : Blob URLs - Acceptées seulement pour les images (pas les vidéos)
      if (src.startsWith("blob:")) {
        if (type === "image") {
          // Les images peuvent utiliser blob URLs
          setObjectUrl(src);
          setError(false);
        } else {
          // Pour les vidéos, on refuse (déjà géré plus haut, mais sécurité)
          setError(true);
          setObjectUrl(null);
        }
        return;
      }

      // CAS 2 : C'est un ID IndexedDB (Legacy / Local)
      // Si src ressemble à un ID simple sans slash
      const loadLocalFile = async () => {
        try {
          setError(false);

          // Construit l'URL IndexedDB au format attendu
          const indexedDbUrl = src.startsWith("indexeddb://")
            ? src
            : `indexeddb://${src}`;

          // Récupère l'URL blob depuis IndexedDB
          const url = await indexedDBStorage.File.getFileUrl(indexedDbUrl);

          if (url && url !== indexedDbUrl) {
            // Nettoie l'ancienne URL blob si elle existe
            if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
              URL.revokeObjectURL(blobUrlRef.current);
            }

            setObjectUrl(url);
            blobUrlRef.current = url.startsWith("blob:") ? url : null;
          } else {
            console.error("[MediaRenderer] No URL returned from IndexedDB");
            setError(true);
          }
        } catch (e) {
          console.error("[MediaRenderer] Erreur chargement local:", e);
          setError(true);
        }
      };

      loadLocalFile();

      // Cleanup : révoque l'URL blob au démontage
      return () => {
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      };
    }, [src]);

    if (error) {
      return (
        <div
          className={`flex items-center justify-center bg-gray-200 text-gray-500 text-xs ${className}`}
        >
          Média non disponible
        </div>
      );
    }

    if (!objectUrl) {
      return <div className={`bg-gray-100 animate-pulse ${className}`} />;
    }

    if (type === "video") {
      return (
        <video
          ref={ref as React.Ref<HTMLVideoElement>}
          src={objectUrl}
          className={className}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          controls={controls}
          onPlay={onPlay}
          onPause={onPause}
          onError={(e) => {
            const videoElement = e.currentTarget;
            const error = videoElement.error;
            
            console.error("[MediaRenderer] Erreur lecture vidéo:", {
              errorCode: error?.code,
              errorMessage: error?.message,
              networkState: videoElement.networkState,
              readyState: videoElement.readyState,
              src: objectUrl,
              isBlob: objectUrl?.startsWith("blob:"),
            });

            // Si c'est une blob URL qui échoue, on essaie de nettoyer
            if (objectUrl?.startsWith("blob:")) {
              console.warn("[MediaRenderer] Blob URL échouée - Safari peut avoir des problèmes avec les blob URLs pour les vidéos");
            }

            setError(true);
          }}
          onLoadStart={() => {
            console.log("[MediaRenderer] Vidéo commence à charger:", objectUrl);
          }}
          onLoadedData={() => {
            console.log("[MediaRenderer] Vidéo chargée avec succès:", objectUrl);
            setError(false);
          }}
          {...props}
        />
      );
    }

    return (
      <img
        ref={ref as React.Ref<HTMLImageElement>}
        src={objectUrl}
        alt={alt || "Post"}
        className={className}
        onError={() => setError(true)}
        {...props}
      />
    );
  }
);

export default MediaRenderer;

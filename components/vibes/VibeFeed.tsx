'use client';

import React, { useRef } from 'react';
import { useVideoAutoplayWithRefs } from './useVideoAutoplay';
import VibeItem from './VibeItem';

/**
 * Interface pour les props du composant VibeFeed
 */
interface VibeFeedProps {
  /**
   * Nombre de vidéos à afficher (pour les tests)
   */
  videoCount?: number;
  
  /**
   * Données des vidéos (optionnel, pour les tests)
   */
  videos?: Array<{
    videoUrl: string;
    username: string;
    avatarUrl?: string;
    description: string;
    musicName: string;
    likesCount?: number;
    commentsCount?: number;
  }>;
}

/**
 * Composant VibeFeed - Feed vertical type TikTok avec scroll snapping
 * Affiche des vidéos en plein écran avec scroll vertical fluide
 * Gère la lecture automatique des vidéos visibles
 */
export default function VibeFeed({ videoCount = 10, videos }: VibeFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Utilise le hook pour détecter les vidéos actives
  const [activeIndices, registerItemRef] = useVideoAutoplayWithRefs(
    containerRef,
    videoCount,
    { threshold: 0.5 }
  );

  /**
   * Génère des données de test si non fournies
   */
  const getVideoData = (index: number) => {
    if (videos && videos[index]) {
      return videos[index];
    }
    
    // Données de test par défaut
    return {
      videoUrl: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`,
      username: `user${index + 1}`,
      avatarUrl: undefined,
      description: `Description de la vidéo #${index + 1}. Cette vidéo est géniale et mérite d'être vue par tous !`,
      musicName: `Original Sound - user${index + 1}`,
      likesCount: Math.floor(Math.random() * 10000),
      commentsCount: Math.floor(Math.random() * 500),
    };
  };

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] w-full snap-y snap-mandatory overflow-y-scroll overscroll-none scrollbar-hide"
      style={{
        scrollBehavior: 'smooth',
      }}
    >
      {/* Conteneur des vidéos */}
      {Array.from({ length: videoCount }).map((_, index) => {
        const videoData = getVideoData(index);
        const itemRef = (element: HTMLElement | null) => {
          registerItemRef(index, element);
        };

        return (
          <div
            key={index}
            ref={itemRef}
            className="h-full w-full snap-center"
            style={{ minHeight: '100dvh' }}
          >
            <VibeItem
              {...videoData}
              isActive={activeIndices[index]}
              isLiked={false}
              isFollowing={false}
            />
          </div>
        );
      })}
    </div>
  );
}


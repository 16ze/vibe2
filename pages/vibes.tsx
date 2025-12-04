'use client';

import React from 'react';
import VibeFeed from '@/components/vibes/VibeFeed';

/**
 * Page Vibes - Clone TikTok
 * Affiche un feed vertical de vidéos avec scroll snapping
 * La navigation est gérée par le composant parent (Home)
 */
export default function Vibes() {
  return (
    <div className="h-[100dvh] w-full relative bg-black overflow-hidden pb-20 pb-safe">
      {/* Feed principal avec scroll snapping */}
      <VibeFeed videoCount={10} />
    </div>
  );
}


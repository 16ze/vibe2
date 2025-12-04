'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Plus, Music, Play, Pause } from 'lucide-react';
import MediaRenderer from '@/components/common/MediaRenderer';

/**
 * Interface pour les props du composant VibeItem
 */
interface VibeItemProps {
  /**
   * URL de la vidéo à afficher
   */
  videoUrl: string;
  
  /**
   * Nom d'utilisateur de l'auteur
   */
  username: string;
  
  /**
   * Avatar de l'auteur
   */
  avatarUrl?: string;
  
  /**
   * Description de la vidéo
   */
  description: string;
  
  /**
   * Nom de la musique
   */
  musicName: string;
  
  /**
   * Nombre de likes
   */
  likesCount?: number;
  
  /**
   * Nombre de commentaires
   */
  commentsCount?: number;
  
  /**
   * Indique si l'utilisateur a déjà liké la vidéo
   */
  isLiked?: boolean;
  
  /**
   * Indique si l'utilisateur suit déjà l'auteur
   */
  isFollowing?: boolean;
  
  /**
   * Indique si cette vidéo est actuellement active (visible à l'écran)
   * Si true, la vidéo joue automatiquement
   */
  isActive?: boolean;
  
  /**
   * Callback appelé lors du like
   */
  onLike?: () => void;
  
  /**
   * Callback appelé lors du follow
   */
  onFollow?: () => void;
  
  /**
   * Callback appelé lors du commentaire
   */
  onComment?: () => void;
  
  /**
   * Callback appelé lors du partage
   */
  onShare?: () => void;
}

/**
 * Composant VibeItem - Représente une seule vidéo dans le feed type TikTok
 * Affiche la vidéo avec overlays pour les interactions et informations
 */
export default function VibeItem({
  videoUrl,
  username,
  avatarUrl,
  description,
  musicName,
  likesCount = 0,
  commentsCount = 0,
  isLiked = false,
  isFollowing = false,
  isActive = false,
  onLike,
  onFollow,
  onComment,
  onShare,
}: VibeItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likesCount);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const playIconTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Vérifie si la description est tronquée
   */
  useEffect(() => {
    if (descriptionRef.current) {
      const isTruncated =
        descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight;
      setIsDescriptionTruncated(isTruncated);
    }
  }, [description]);

  /**
   * Gère le like de la vidéo
   */
  const handleLike = () => {
    if (liked) {
      setLikes((prev) => Math.max(0, prev - 1));
    } else {
      setLikes((prev) => prev + 1);
    }
    setLiked(!liked);
    onLike?.();
  };

  /**
   * Formate les nombres (ex: 1000 -> 1K)
   */
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  /**
   * Gère la lecture automatique basée sur isActive
   */
  useEffect(() => {
    if (!videoRef.current || !isVideoLoaded) return;

    if (isActive && !isManuallyPaused) {
      // Joue la vidéo si elle est active et n'est pas en pause manuelle
      videoRef.current.play().catch((error) => {
        console.error('Error playing video:', error);
      });
      setIsPlaying(true);
    } else {
      // Met en pause et remet à 0 si la vidéo n'est plus active
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    }
  }, [isActive, isManuallyPaused, isVideoLoaded]);

  /**
   * Nettoie les timeouts lors du démontage
   */
  useEffect(() => {
    return () => {
      if (playIconTimeoutRef.current) {
        clearTimeout(playIconTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Gère le clic sur la vidéo pour play/pause manuel
   */
  const handleVideoClick = () => {
    if (!videoRef.current) return;

    // Affiche l'icône Play/Pause brièvement
    setShowPlayIcon(true);
    
    // Nettoie le timeout précédent
    if (playIconTimeoutRef.current) {
      clearTimeout(playIconTimeoutRef.current);
    }
    
    // Cache l'icône après 1 seconde
    playIconTimeoutRef.current = setTimeout(() => {
      setShowPlayIcon(false);
    }, 1000);

    if (isPlaying) {
      // Met en pause manuellement
      videoRef.current.pause();
      setIsPlaying(false);
      setIsManuallyPaused(true);
    } else {
      // Joue manuellement
      videoRef.current.play().catch((error) => {
        console.error('Error playing video:', error);
      });
      setIsPlaying(true);
      setIsManuallyPaused(false);
    }
  };

  return (
    <section className="h-full w-full snap-center relative bg-black">
      {/* Vidéo principale - Utilise MediaRenderer pour gérer IndexedDB */}
      <MediaRenderer
        src={videoUrl}
        type="video"
        className="w-full h-full object-cover cursor-pointer"
        loop
        muted
        playsInline
        onLoadedData={() => setIsVideoLoaded(true)}
        onClick={handleVideoClick}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        ref={videoRef}
      />

      {/* Icône Play/Pause qui apparaît au clic */}
      <AnimatePresence>
        {showPlayIcon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              {isPlaying ? (
                <Pause className="w-10 h-10 text-white fill-white" />
              ) : (
                <Play className="w-10 h-10 text-white fill-white ml-1" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dégradé noir en bas pour la lisibilité du texte */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

      {/* Overlay Droit - Sidebar verticale */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center gap-6 z-10">
        {/* Avatar avec bouton Follow */}
        <div className="relative">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {username[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          {/* Bouton Follow */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onFollow}
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center ${
              isFollowing
                ? 'bg-gray-600'
                : 'bg-gradient-to-r from-purple-600 to-pink-500'
            }`}
          >
            <Plus
              className={`w-4 h-4 ${
                isFollowing ? 'text-white rotate-45' : 'text-white'
              }`}
            />
          </motion.button>
        </div>

        {/* Bouton Like avec compteur */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          >
            <Heart
              className={`w-6 h-6 ${
                liked ? 'fill-red-500 text-red-500' : 'text-white'
              }`}
            />
          </motion.button>
          <span className="text-white text-xs font-semibold">
            {formatCount(likes)}
          </span>
        </div>

        {/* Bouton Comment avec compteur */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onComment}
            className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </motion.button>
          <span className="text-white text-xs font-semibold">
            {formatCount(commentsCount)}
          </span>
        </div>

        {/* Bouton Share */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onShare}
          className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          <Share2 className="w-6 h-6 text-white" />
        </motion.button>

        {/* Disque vinyle animé en bas */}
        <motion.div
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{
            duration: 3,
            repeat: isPlaying ? Infinity : 0,
            ease: 'linear',
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border-2 border-white/20 mt-2"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
        </motion.div>
      </div>

      {/* Overlay Bas - Informations */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-20 z-10">
        {/* Nom d'utilisateur */}
        <div className="mb-3">
          <h3 className="text-white text-base font-bold">
            @{username}
          </h3>
        </div>

        {/* Description avec limite de lignes */}
        <div className="mb-3">
          <p
            ref={descriptionRef}
            className={`text-white text-sm leading-relaxed ${
              showFullDescription ? '' : 'line-clamp-2'
            }`}
          >
            {description}
          </p>
          {isDescriptionTruncated && !showFullDescription && (
            <button
              onClick={() => setShowFullDescription(true)}
              className="text-white/80 text-sm font-medium mt-1"
            >
              plus
            </button>
          )}
        </div>

        {/* Nom de la musique qui défile (marquee) */}
        <div className="flex items-center gap-2 overflow-hidden">
          <Music className="w-4 h-4 text-white flex-shrink-0" />
          <div className="flex-1 overflow-hidden">
            <motion.div
              animate={{
                x: [0, -100],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="flex items-center gap-2"
            >
              <span className="text-white text-sm font-medium whitespace-nowrap">
                {musicName}
              </span>
              {/* Duplique le texte pour un effet de boucle continu */}
              <span className="text-white text-sm font-medium whitespace-nowrap">
                {musicName}
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Indicateur de chargement */}
      {!isVideoLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </section>
  );
}


import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, Send } from 'lucide-react';

interface StoryViewerProps {
  stories: any[];
  initialIndex?: number;
  onClose?: () => void;
}

export default function StoryViewer({ stories, initialIndex = 0, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const story = stories?.[currentIndex];

  /**
   * Timer de progression - s'arrête si isPaused ou isCommenting
   */
  useEffect(() => {
    if (!story) return;
    if (isPaused || isCommenting) return; // Arrête le timer si en pause ou en mode commentaire
    
    const duration = story.media_type === 'video' ? 15000 : 5000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev: number) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose?.();
            return 100;
          }
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, story, stories.length, onClose, isPaused, isCommenting]);

  /**
   * Gère la vidéo : pause si isPaused (hold), play sinon (normal ou commentaire)
   */
  useEffect(() => {
    if (!videoRef.current || story?.media_type !== 'video') return;

    if (isPaused) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => {
        console.error('Error playing video:', err);
      });
    }
  }, [isPaused, story?.media_type]);

  /**
   * Gère le maintien (Hold) - pause la story
   */
  const handleHoldStart = () => {
    // Délai court pour éviter les faux positifs
    holdTimerRef.current = setTimeout(() => {
      setIsPaused(true);
    }, 100);
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsPaused(false);
  };

  /**
   * Gère le focus/blur de l'input de commentaire
   */
  const handleCommentFocus = () => {
    setIsCommenting(true);
  };

  const handleCommentBlur = () => {
    setIsCommenting(false);
  };

  /**
   * Réinitialise la progression quand on change de story
   */
  useEffect(() => {
    setProgress(0);
    setIsPaused(false);
    setIsCommenting(false);
    
    // Nettoie le timer de hold si présent
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, [currentIndex]);

  /**
   * Nettoie le timer de hold au démontage
   */
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose?.();
    }
  };

  if (!story) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black"
      onTouchStart={handleHoldStart}
      onTouchEnd={handleHoldEnd}
      onMouseDown={handleHoldStart}
      onMouseUp={handleHoldEnd}
      onMouseLeave={handleHoldEnd}
    >
      {/* Progress bars */}
      <div className="absolute top-0 inset-x-0 z-20 flex gap-1 px-2 pt-safe py-2">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-50"
              style={{ 
                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-20 pt-safe">
        <div className="flex items-center justify-between px-4 py-3 mt-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
              {story.author_avatar ? (
                <img src={story.author_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                  {story.author_name?.charAt(0)?.toUpperCase() || 'V'}
                </div>
              )}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{story.author_name}</p>
              <p className="text-white/60 text-xs">il y a 2h</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Media */}
      <div className="absolute inset-0 flex items-center justify-center">
        {story.media_type === 'video' ? (
          <video 
            ref={videoRef}
            src={story.media_url} 
            className="w-full h-full object-contain"
            autoPlay
            playsInline
            muted
            loop={isCommenting} // Loop uniquement en mode commentaire
          />
        ) : (
          <img 
            src={story.media_url} 
            alt="" 
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Touch areas for navigation */}
      <div className="absolute inset-0 flex z-10">
        <button 
          onClick={handlePrev} 
          className="w-1/3 h-full"
          aria-label="Previous"
        />
        <div className="w-1/3" />
        <button 
          onClick={handleNext} 
          className="w-1/3 h-full"
          aria-label="Next"
        />
      </div>

      {/* Reply input */}
      <div className="absolute bottom-0 inset-x-0 z-20 pb-safe">
        <div className="flex items-center gap-3 px-4 py-4">
          <input
            type="text"
            placeholder="Envoyer un message..."
            className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-3 text-white placeholder-white/50 text-sm outline-none focus:border-white/40"
            onFocus={handleCommentFocus}
            onBlur={handleCommentBlur}
          />
          <button className="p-2">
            <Heart className="w-6 h-6 text-white" />
          </button>
          <button className="p-2">
            <Send className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
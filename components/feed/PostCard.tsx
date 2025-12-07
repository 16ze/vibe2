import MediaRenderer from "@/components/common/MediaRenderer";
import { MediaPost } from "@/types/post";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Props du composant PostCard
 * Accepte uniquement les posts de type média (MediaPost)
 */
interface PostCardProps {
  post: MediaPost;
  onLike?: (postId: string) => void;
  onComment?: (post: MediaPost) => void;
  onShare?: (post: MediaPost) => void;
  onSave?: (postId: string) => void;
  isLiked?: boolean;
}

export default function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
  isLiked = false,
}: PostCardProps) {
  // Utilise directement isLiked de la prop (synchronisé avec Supabase)
  const [liked, setLiked] = useState(isLiked);
  const [saved, setSaved] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  // Synchronise l'état local avec la prop isLiked quand elle change
  useEffect(() => {
    setLiked(isLiked);
  }, [isLiked]);
  const [timeAgo, setTimeAgo] = useState<string>("");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  // CORRECTION : Gestion de l'état sonore (toujours muet au début pour contourner les restrictions navigateurs)
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Calcule le temps relatif côté client uniquement
   * Évite les erreurs d'hydratation avec formatDistanceToNow
   */
  useEffect(() => {
    if (post.created_date) {
      setTimeAgo(
        formatDistanceToNow(new Date(post.created_date), { addSuffix: true })
      );
    } else {
      setTimeAgo("Maintenant");
    }
  }, [post.created_date]);

  /**
   * IntersectionObserver pour lancer automatiquement la vidéo quand elle est visible
   * (Optionnel mais recommandé pour une meilleure UX)
   */
  useEffect(() => {
    if (
      post.media_type !== "video" ||
      !videoRef.current ||
      !videoContainerRef.current
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            // La vidéo est visible à plus de 50% → on peut la lancer
            if (videoRef.current && !isVideoPlaying) {
              videoRef.current.play().catch((err) => {
                console.log("[PostCard] Autoplay prevented:", err);
              });
            }
          } else {
            // La vidéo n'est plus visible → on la met en pause
            if (videoRef.current && isVideoPlaying) {
              videoRef.current.pause();
            }
          }
        });
      },
      {
        threshold: 0.5, // Déclenche quand 50% de la vidéo est visible
        rootMargin: "0px",
      }
    );

    observer.observe(videoContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [post.media_type, isVideoPlaying]);

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikesCount((prev: number) => prev + 1);
      onLike?.(post.id);
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const handleLike = () => {
    // Optimistic UI : met à jour immédiatement l'état local
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((prev: number) =>
      newLiked ? prev + 1 : Math.max(0, prev - 1)
    );

    // Appelle la fonction parent qui va faire l'appel Supabase
    onLike?.(post.id);
  };

  return (
    <article className="bg-white border-b border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
            {post.author_avatar ? (
              <img
                src={post.author_avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-sm">
                {post.author_name?.charAt(0)?.toUpperCase() || "V"}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">
              {post.author_name || "Anonyme"}
            </p>
          </div>
        </div>
        <button className="p-1">
          <MoreHorizontal className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Media - Utilise MediaRenderer pour gérer IndexedDB et URLs classiques */}
      <div
        ref={videoContainerRef}
        className="relative aspect-square bg-gray-100"
        onDoubleClick={handleDoubleTap}
      >
        {/* CORRECTION BUG : Affichage conditionnel explicite pour vidéo/photo */}
        {/* Vérifie explicitement si c'est une vidéo (media_type peut être "video" ou "photo") */}
        {post.media_type === "video" ? (
          <>
            <MediaRenderer
              ref={videoRef}
              src={post.media_url}
              type="video"
              className="w-full h-full object-cover"
              autoPlay // Lance la lecture automatiquement
              loop // Tourne en boucle
              muted={isMuted} // Contrôlé par le state (doit être true au début)
              playsInline // OBLIGATOIRE pour iOS (sinon ça s'ouvre en plein écran)
              controls={false} // On cache les contrôles natifs
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            />
            {/* Bouton Volume (Overlay) - Petit bouton rond en bas à droite */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation(); // Empêche la propagation du clic vers le post parent
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </motion.button>
          </>
        ) : (
          <MediaRenderer
            src={post.media_url}
            type="image"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}

        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleLike}>
              <Heart
                className={`w-6 h-6 transition-colors ${
                  liked ? "text-red-500 fill-red-500" : "text-gray-900"
                }`}
              />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onComment?.(post)}
            >
              <MessageCircle className="w-6 h-6 text-gray-900" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onShare?.(post)}
            >
              <Send className="w-6 h-6 text-gray-900" />
            </motion.button>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setSaved(!saved);
              onSave?.(post.id);
            }}
          >
            <Bookmark
              className={`w-6 h-6 transition-colors ${
                saved ? "text-gray-900 fill-gray-900" : "text-gray-900"
              }`}
            />
          </motion.button>
        </div>

        {/* Likes count */}
        {likesCount > 0 && (
          <p className="font-semibold text-sm text-gray-900 mb-1">
            {likesCount.toLocaleString()} J'aime{likesCount > 1 ? "s" : ""}
          </p>
        )}

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-gray-900">
            <span className="font-semibold">{post.author_name}</span>{" "}
            {post.caption}
          </p>
        )}

        {/* Comments preview */}
        {(post.comments_count || 0) > 0 && (
          <button
            className="text-sm text-gray-500 mt-1"
            onClick={() => onComment?.(post)}
          >
            Voir les {post.comments_count} commentaires
          </button>
        )}

        {/* Timestamp */}
        <p className="text-[11px] text-gray-400 mt-2 uppercase tracking-wide">
          {timeAgo || "Maintenant"}
        </p>
      </div>
    </article>
  );
}

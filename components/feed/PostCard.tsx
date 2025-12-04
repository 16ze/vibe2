import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MediaPost } from '@/types/post';
import MediaRenderer from '@/components/common/MediaRenderer';

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

export default function PostCard({ post, onLike, onComment, onShare, onSave, isLiked = false }: PostCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [saved, setSaved] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [timeAgo, setTimeAgo] = useState<string>('');

  /**
   * Calcule le temps relatif côté client uniquement
   * Évite les erreurs d'hydratation avec formatDistanceToNow
   */
  useEffect(() => {
    if (post.created_date) {
      setTimeAgo(formatDistanceToNow(new Date(post.created_date), { addSuffix: true }));
    } else {
      setTimeAgo('Maintenant');
    }
  }, [post.created_date]);

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
    if (liked) {
      setLikesCount((prev: number) => prev - 1);
    } else {
      setLikesCount((prev: number) => prev + 1);
    }
    setLiked(!liked);
    onLike?.(post.id);
  };

  return (
    <article className="bg-white border-b border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
            {post.author_avatar ? (
              <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-sm">
                {post.author_name?.charAt(0)?.toUpperCase() || 'V'}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{post.author_name || 'Utilisateur'}</p>
          </div>
        </div>
        <button className="p-1">
          <MoreHorizontal className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Media - Utilise MediaRenderer pour gérer IndexedDB et URLs classiques */}
      <div 
        className="relative aspect-square bg-gray-100"
        onDoubleClick={handleDoubleTap}
      >
        <MediaRenderer
          src={post.media_url}
          type={post.media_type === 'video' ? 'video' : 'image'}
          className="w-full h-full object-cover"
          controls={post.media_type === 'video' ? false : undefined}
          playsInline={post.media_type === 'video' ? true : undefined}
          muted={post.media_type === 'video' ? true : undefined}
          loop={post.media_type === 'video' ? true : undefined}
          loading={post.media_type === 'photo' ? 'lazy' : undefined}
        />
        
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
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
            >
              <Heart className={`w-6 h-6 transition-colors ${
                liked ? 'text-red-500 fill-red-500' : 'text-gray-900'
              }`} />
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
            <Bookmark className={`w-6 h-6 transition-colors ${
              saved ? 'text-gray-900 fill-gray-900' : 'text-gray-900'
            }`} />
          </motion.button>
        </div>

        {/* Likes count */}
        {likesCount > 0 && (
          <p className="font-semibold text-sm text-gray-900 mb-1">
            {likesCount.toLocaleString()} J'aime{likesCount > 1 ? 's' : ''}
          </p>
        )}

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-gray-900">
            <span className="font-semibold">{post.author_name}</span>{' '}
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
          {timeAgo || 'Maintenant'}
        </p>
      </div>
    </article>
  );
}
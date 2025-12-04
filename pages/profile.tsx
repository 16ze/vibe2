import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vibe } from '@/api/vibeClient';
import { motion } from 'framer-motion';
import { Settings, Grid3X3, Bookmark, UserPlus, ChevronLeft, MoreHorizontal, Link2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import Link from 'next/link';

export default function Profile() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('posts');
  const queryClient = useQueryClient();

  useEffect(() => {
    vibe.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: posts = [] } = useQuery({
    queryKey: ['user-posts', currentUser?.email],
    queryFn: () => currentUser ? vibe.entities.Post.filter({ created_by: currentUser.email }, '-created_date') : [],
    enabled: !!currentUser,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['followers', currentUser?.email],
    queryFn: () => currentUser ? vibe.entities.Follow.filter({ following_email: currentUser.email }) : [],
    enabled: !!currentUser,
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following', currentUser?.email],
    queryFn: () => currentUser ? vibe.entities.Follow.filter({ follower_email: currentUser.email }) : [],
    enabled: !!currentUser,
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/">
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">
            {currentUser.username || currentUser.full_name || 'Profil'}
          </h1>
          <div className="flex items-center gap-2">
            <button>
              <Settings className="w-6 h-6 text-gray-900" />
            </button>
          </div>
        </div>
      </header>

      {/* Profile info */}
      <div className="px-4 py-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
              {currentUser.avatar_url ? (
                <img 
                  src={currentUser.avatar_url} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-purple-500">
                  {(currentUser.full_name || currentUser.email)?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 flex justify-around py-2">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{posts.length}</p>
              <p className="text-sm text-gray-500">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{followers.length}</p>
              <p className="text-sm text-gray-500">Abonnés</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{following.length}</p>
              <p className="text-sm text-gray-500">Abonnements</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4">
          <h2 className="font-semibold text-gray-900">
            {currentUser.full_name || 'Utilisateur VIBE'}
          </h2>
          {currentUser.bio && (
            <p className="text-sm text-gray-700 mt-1">{currentUser.bio}</p>
          )}
        </div>

        {/* Edit profile button */}
        <div className="mt-4">
          <button className="w-full py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-900 hover:bg-gray-200 transition-colors">
            Modifier le profil
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-gray-100">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${
            activeTab === 'posts' ? 'border-gray-900' : 'border-transparent'
          }`}
        >
          <Grid3X3 className={`w-6 h-6 ${activeTab === 'posts' ? 'text-gray-900' : 'text-gray-400'}`} />
        </button>
        <button 
          onClick={() => setActiveTab('saved')}
          className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${
            activeTab === 'saved' ? 'border-gray-900' : 'border-transparent'
          }`}
        >
          <Bookmark className={`w-6 h-6 ${activeTab === 'saved' ? 'text-gray-900' : 'text-gray-400'}`} />
        </button>
      </div>

      {/* Posts grid */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              whileTap={{ scale: 0.98 }}
              className="aspect-square bg-gray-100"
            >
              {post.media_type === 'video' ? (
                <video 
                  src={post.media_url} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src={post.media_url} 
                  alt="" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
            </motion.div>
          ))}
          
          {posts.length === 0 && (
            <div className="col-span-3 py-20 text-center">
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-gray-300 flex items-center justify-center mb-4">
                <Grid3X3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Aucun post</h3>
              <p className="text-sm text-gray-500 mt-1">Partage ton premier moment !</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="py-20 text-center">
          <div className="w-16 h-16 mx-auto rounded-full border-2 border-gray-300 flex items-center justify-center mb-4">
            <Bookmark className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Sauvegardés</h3>
          <p className="text-sm text-gray-500 mt-1">Tes posts sauvegardés apparaîtront ici</p>
        </div>
      )}
    </div>
  );
}
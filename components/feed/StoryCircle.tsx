import React from 'react';
import { motion } from 'framer-motion';

interface StoryCircleProps {
  story: any;
  onClick?: () => void;
  isOwn?: boolean;
  hasUnviewed?: boolean;
}

export default function StoryCircle({ story, onClick, isOwn = false, hasUnviewed = true }: StoryCircleProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1 min-w-[72px]"
    >
      <div className={`relative p-[3px] rounded-full ${
        hasUnviewed 
          ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600' 
          : 'bg-gray-200'
      }`}>
        <div className="bg-white p-[2px] rounded-full">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100">
            {story.author_avatar ? (
              <img 
                src={story.author_avatar} 
                alt={story.author_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500 font-semibold text-lg">
                {story.author_name?.charAt(0)?.toUpperCase() || 'V'}
              </div>
            )}
          </div>
        </div>
        {isOwn && (
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white text-xs font-bold">+</span>
          </div>
        )}
      </div>
      <span className="text-[11px] text-gray-700 truncate max-w-[64px] font-medium">
        {isOwn ? 'Ta story' : story.author_name}
      </span>
    </motion.button>
  );
}
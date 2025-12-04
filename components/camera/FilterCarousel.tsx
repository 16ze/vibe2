import React from 'react';
import { motion } from 'framer-motion';

const FILTERS = [
  { id: 'normal', name: 'Normal', style: {} },
  { id: 'clarendon', name: 'Clarendon', style: { filter: 'contrast(1.2) saturate(1.35)' } },
  { id: 'gingham', name: 'Gingham', style: { filter: 'brightness(1.05) hue-rotate(-10deg)' } },
  { id: 'moon', name: 'Moon', style: { filter: 'grayscale(1) contrast(1.1) brightness(1.1)' } },
  { id: 'lark', name: 'Lark', style: { filter: 'contrast(0.9) brightness(1.1) saturate(0.85)' } },
  { id: 'reyes', name: 'Reyes', style: { filter: 'sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)' } },
  { id: 'juno', name: 'Juno', style: { filter: 'contrast(1.2) brightness(1.1) saturate(1.4) sepia(0.05)' } },
  { id: 'slumber', name: 'Slumber', style: { filter: 'brightness(1.05) saturate(0.66)' } },
  { id: 'crema', name: 'Crema', style: { filter: 'contrast(0.95) brightness(1.04) saturate(0.9) sepia(0.15)' } },
  { id: 'ludwig', name: 'Ludwig', style: { filter: 'contrast(1.05) brightness(1.05) saturate(1.2)' } },
  { id: 'aden', name: 'Aden', style: { filter: 'brightness(1.15) saturate(0.85) hue-rotate(-20deg) contrast(0.9)' } },
  { id: 'perpetua', name: 'Perpetua', style: { filter: 'brightness(1.05) contrast(1.1) saturate(1.1)' } },
];

interface FilterCarouselProps {
  selectedFilter: any;
  onSelectFilter: (filter: any) => void;
  previewImage?: string | null;
}

export default function FilterCarousel({ selectedFilter, onSelectFilter, previewImage }: FilterCarouselProps) {
  return (
    <div className="bg-black/80 backdrop-blur-md">
      <div className="flex gap-3 px-4 py-4 overflow-x-auto scrollbar-hide">
        {FILTERS.map((filter) => (
          <motion.button
            key={filter.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectFilter(filter)}
            className={`flex flex-col items-center gap-2 min-w-[72px] ${
              selectedFilter?.id === filter.id ? 'opacity-100' : 'opacity-70'
            }`}
          >
            <div 
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                selectedFilter?.id === filter.id 
                  ? 'border-white' 
                  : 'border-transparent'
              }`}
            >
              {previewImage ? (
                <img 
                  src={previewImage} 
                  alt={filter.name}
                  className="w-full h-full object-cover"
                  style={filter.style}
                />
              ) : (
                <div 
                  className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500"
                  style={filter.style}
                />
              )}
            </div>
            <span className={`text-[11px] font-medium ${
              selectedFilter?.id === filter.id ? 'text-white' : 'text-gray-400'
            }`}>
              {filter.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export { FILTERS };
/**
 * Données mock pour les vidéos Vibe
 * Contient des vidéos de test avec des URLs publiques gratuites
 */

/**
 * Interface pour les données d'auteur
 */
export interface VibeAuthor {
  name: string;
  avatar?: string;
}

/**
 * Interface pour un post Vibe
 */
export interface VibePost {
  id: string;
  videoUrl: string;
  author: VibeAuthor;
  description: string;
  likesCount: number;
  commentsCount: number;
  musicName: string;
}

/**
 * Tableau de posts Vibe mockés
 * Utilise des vidéos gratuites et libres de droits pour les tests
 */
export const mockVibes: VibePost[] = [
  {
    id: 'vibe-1',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    author: {
      name: 'sarah_creative',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    description: 'Juste une journée normale avec mon chat 🐱 #vibes #cute #pet',
    likesCount: 12500,
    commentsCount: 342,
    musicName: 'Original Sound - sarah_creative',
  },
  {
    id: 'vibe-2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    author: {
      name: 'traveler_joe',
      avatar: 'https://i.pravatar.cc/150?img=12',
    },
    description: 'Les meilleures vues sont celles qu\'on partage 🌍✨ #travel #adventure #wanderlust',
    likesCount: 8920,
    commentsCount: 156,
    musicName: 'Summer Vibes - Chill Beats',
  },
  {
    id: 'vibe-3',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    author: {
      name: 'foodie_master',
      avatar: 'https://i.pravatar.cc/150?img=33',
    },
    description: 'Nouvelle recette testée aujourd\'hui ! Qui veut la recette ? 👨‍🍳 #cooking #food #recipe',
    likesCount: 23400,
    commentsCount: 892,
    musicName: 'Kitchen Vibes - Cooking Music',
  },
  {
    id: 'vibe-4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    author: {
      name: 'fitness_life',
      avatar: 'https://i.pravatar.cc/150?img=45',
    },
    description: 'Morning workout done! 💪 La motivation c\'est maintenant #fitness #workout #motivation',
    likesCount: 15600,
    commentsCount: 423,
    musicName: 'Pump Up - Workout Mix',
  },
  {
    id: 'vibe-5',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    author: {
      name: 'dance_queen',
      avatar: 'https://i.pravatar.cc/150?img=20',
    },
    description: 'Nouvelle chorégraphie apprise ! Qu\'est-ce que vous en pensez ? 💃 #dance #choreography',
    likesCount: 31200,
    commentsCount: 1205,
    musicName: 'Dance Floor - Electronic Mix',
  },
  {
    id: 'vibe-6',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    author: {
      name: 'art_creator',
      avatar: 'https://i.pravatar.cc/150?img=15',
    },
    description: 'Processus de création en time-lapse 🎨 L\'art prend vie #art #painting #creative',
    likesCount: 18900,
    commentsCount: 567,
    musicName: 'Creative Flow - Ambient Sounds',
  },
  {
    id: 'vibe-7',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    author: {
      name: 'music_producer',
      avatar: 'https://i.pravatar.cc/150?img=28',
    },
    description: 'Nouveau beat en préparation 🎵 Feedback welcome! #music #producer #beatmaking',
    likesCount: 27800,
    commentsCount: 789,
    musicName: 'Original Sound - music_producer',
  },
  {
    id: 'vibe-8',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    author: {
      name: 'nature_lover',
      avatar: 'https://i.pravatar.cc/150?img=50',
    },
    description: 'Randonnée matinale dans la forêt 🌲 La nature est notre meilleure amie #nature #hiking #outdoor',
    likesCount: 14200,
    commentsCount: 312,
    musicName: 'Nature Sounds - Forest Ambience',
  },
  {
    id: 'vibe-9',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreet.mp4',
    author: {
      name: 'tech_reviewer',
      avatar: 'https://i.pravatar.cc/150?img=8',
    },
    description: 'Unboxing du dernier gadget tech 📱 Spoiler: c\'est incroyable! #tech #unboxing #review',
    likesCount: 22100,
    commentsCount: 654,
    musicName: 'Tech Vibes - Electronic',
  },
  {
    id: 'vibe-10',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    author: {
      name: 'fashion_style',
      avatar: 'https://i.pravatar.cc/150?img=25',
    },
    description: 'OOTD du jour 👗 Parfait pour cette saison! #fashion #ootd #style',
    likesCount: 16700,
    commentsCount: 445,
    musicName: 'Fashion Week - Runway Music',
  },
];

/**
 * Fonction utilitaire pour obtenir un post Vibe par son ID
 */
export function getVibeById(id: string): VibePost | undefined {
  return mockVibes.find((vibe) => vibe.id === id);
}

/**
 * Fonction utilitaire pour obtenir plusieurs posts Vibe
 */
export function getVibes(count?: number): VibePost[] {
  if (count) {
    return mockVibes.slice(0, count);
  }
  return mockVibes;
}






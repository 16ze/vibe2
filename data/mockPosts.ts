/**
 * Données mock pour les posts du Feed
 * Inclut des posts média (image/vidéo) et texte (style Twitter)
 * 
 * IMPORTANT : Structure des types discriminés
 * - Posts média (type: "media") : DOIVENT avoir media_url (obligatoire)
 * - Posts texte (type: "text") : DOIVENT avoir content (obligatoire)
 * 
 * TypeScript valide automatiquement cette structure grâce aux unions discriminées
 */

import { Post } from "@/types/post";

/**
 * Tableau de posts mockés pour le feed
 * Mélange de posts média et texte
 * Tous les posts respectent la structure stricte définie dans types/post.ts
 */
export const mockPosts: Post[] = [
  // Post média - image classique
  {
    id: "post-1",
    type: "media",
    media_url:
      "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800",
    media_type: "photo",
    caption:
      "Coucher de soleil incroyable ce soir #sunset #vibes #photography",
    likes_count: 1245,
    comments_count: 89,
    author_name: "sarah_photo",
    author_avatar: "https://i.pravatar.cc/150?img=1",
    created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },

  // Post texte pur - Style Twitter (sans fond coloré)
  {
    id: "post-2",
    type: "text",
    content: "Je viens de finir mon premier marathon. 42km de pure souffrance mais quelle fierté !",
    likes_count: 3420,
    comments_count: 156,
    author_name: "runner_paris",
    author_avatar: "https://i.pravatar.cc/150?img=5",
    created_date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },

  // Post média - image
  {
    id: "post-3",
    type: "media",
    media_url:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    media_type: "photo",
    caption: "Les montagnes m'appellent #mountains #adventure #travel",
    likes_count: 2890,
    comments_count: 134,
    author_name: "adventure_seeker",
    author_avatar: "https://i.pravatar.cc/150?img=12",
    created_date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },

  // Post texte pur - Pensée du jour
  {
    id: "post-4",
    type: "text",
    content: "Unpopular opinion: le café froid c'est meilleur que le café chaud",
    likes_count: 1876,
    comments_count: 98,
    author_name: "coffee_thoughts",
    author_avatar: "https://i.pravatar.cc/150?img=8",
    created_date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },

  // Post média - vidéo
  {
    id: "post-5",
    type: "media",
    media_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    media_type: "video",
    caption: "Moment de détente #relax #weekend",
    likes_count: 567,
    comments_count: 45,
    author_name: "chill_vibes",
    author_avatar: "https://i.pravatar.cc/150?img=15",
    created_date: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },

  // Post texte pur - Question/débat
  {
    id: "post-6",
    type: "text",
    content: "Les gens qui mettent le lait avant les céréales, vous allez bien ?",
    likes_count: 2134,
    comments_count: 312,
    author_name: "random_thoughts",
    author_avatar: "https://i.pravatar.cc/150?img=22",
    created_date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },

  // Post média - image
  {
    id: "post-7",
    type: "media",
    media_url:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    media_type: "photo",
    caption: "Brunch du dimanche #food #brunch #yummy",
    likes_count: 1567,
    comments_count: 78,
    author_name: "foodie_paris",
    author_avatar: "https://i.pravatar.cc/150?img=25",
    created_date: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
  },

  // Post média - image
  {
    id: "post-8",
    type: "media",
    media_url:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
    media_type: "photo",
    caption: "La beauté de la nature #nature #peaceful #landscape",
    likes_count: 3245,
    comments_count: 189,
    author_name: "nature_lover",
    author_avatar: "https://i.pravatar.cc/150?img=30",
    created_date: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },

  // Post média - vidéo
  {
    id: "post-9",
    type: "media",
    media_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    media_type: "video",
    caption: "Road trip vibes #roadtrip #adventure #travel",
    likes_count: 890,
    comments_count: 56,
    author_name: "travel_addict",
    author_avatar: "https://i.pravatar.cc/150?img=35",
    created_date: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },

  // Post média - image
  {
    id: "post-10",
    type: "media",
    media_url:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    media_type: "photo",
    caption: "Concert incroyable hier soir #music #concert #live",
    likes_count: 4521,
    comments_count: 234,
    author_name: "music_fan",
    author_avatar: "https://i.pravatar.cc/150?img=40",
    created_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },

  // Post texte avec fond coloré - Vibe café
  {
    id: "post-11",
    type: "text",
    content: "Vibe du jour : Café et Code",
    backgroundStyle: "vibe-gradient",
    textStyle: "bold",
    likes_count: 2876,
    comments_count: 145,
    author_name: "dev_life",
    author_avatar: "https://i.pravatar.cc/150?img=45",
    created_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },

  // Post texte avec fond coloré - Soirée
  {
    id: "post-12",
    type: "text",
    content: "Qui est chaud pour sortir ce soir ?",
    backgroundStyle: "vibe-ocean",
    textStyle: "bold",
    likes_count: 1543,
    comments_count: 89,
    author_name: "party_people",
    author_avatar: "https://i.pravatar.cc/150?img=48",
    created_date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },

  // Post texte avec fond coloré - Motivation
  {
    id: "post-13",
    type: "text",
    content: "No pain, no gain",
    backgroundStyle: "vibe-fire",
    textStyle: "bold",
    likes_count: 4210,
    comments_count: 203,
    author_name: "fitness_addict",
    author_avatar: "https://i.pravatar.cc/150?img=52",
    created_date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },

  // === NOUVEAUX POSTS TEXTE PUR (style Twitter) ===

  // Post texte pur - Réflexion tech
  {
    id: "post-14",
    type: "text",
    content: "Rappel : ton code n'a pas besoin d'être parfait pour être mis en prod. Ship it.",
    likes_count: 5234,
    comments_count: 287,
    author_name: "tech_wisdom",
    author_avatar: "https://i.pravatar.cc/150?img=55",
    created_date: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },

  // Post texte pur - Humour quotidien
  {
    id: "post-15",
    type: "text",
    content: "Mon chat vient de renverser mon café sur mon clavier. Lundi classique.",
    likes_count: 8912,
    comments_count: 456,
    author_name: "daily_chaos",
    author_avatar: "https://i.pravatar.cc/150?img=58",
    created_date: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },

  // Post texte pur - Pensée philosophique
  {
    id: "post-16",
    type: "text",
    content: "On passe tellement de temps à planifier qu'on oublie de vivre. Juste une pensée.",
    likes_count: 3678,
    comments_count: 189,
    author_name: "mindful_moments",
    author_avatar: "https://i.pravatar.cc/150?img=61",
    created_date: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

/**
 * Fonction utilitaire pour obtenir un post par son ID
 */
export function getPostById(id: string): Post | undefined {
  return mockPosts.find((post) => post.id === id);
}

/**
 * Fonction utilitaire pour obtenir plusieurs posts
 */
export function getPosts(count?: number): Post[] {
  if (count) {
    return mockPosts.slice(0, count);
  }
  return mockPosts;
}

/**
 * Fonction utilitaire pour obtenir les posts d'un type spécifique
 * @param type - 'media' pour images/vidéos, 'text' pour posts textuels
 */
export function getPostsByType(type: "media" | "text"): Post[] {
  return mockPosts.filter((post) => post.type === type);
}

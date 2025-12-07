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
 * PRODUCTION : Tableau vidé - Les données viennent maintenant de Supabase
 */
export const mockPosts: Post[] = [];

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

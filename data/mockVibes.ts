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
 * PRODUCTION : Tableau vidé - Les données viennent maintenant de Supabase
 */
export const mockVibes: VibePost[] = [];

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

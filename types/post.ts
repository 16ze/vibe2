/**
 * Types pour les posts de l'application VIBE
 * Inclut les posts média (image/vidéo) et texte (style Twitter)
 */

/**
 * Type de post
 * - 'media' : post avec image ou vidéo
 * - 'text' : post textuel pur (style Twitter)
 */
export type PostType = "media" | "text";

/**
 * Presets de dégradés pour les posts texte
 */
export type BackgroundPreset =
  | "vibe-purple" // Dégradé violet signature VIBE
  | "vibe-sunset" // Dégradé orange/rose coucher de soleil
  | "vibe-dark" // Noir profond avec subtil dégradé
  | "vibe-ocean" // Bleu océan profond
  | "vibe-fire" // Rouge/orange feu
  | "vibe-aurora" // Vert/bleu aurore boréale
  | "vibe-midnight" // Bleu nuit profond
  | "vibe-gradient" // Dégradé multicolore
  | string; // Code CSS personnalisé (ex: "linear-gradient(...)")

/**
 * Styles de texte pour les posts texte
 */
export type TextStyle =
  | "default" // Style par défaut
  | "bold" // Texte en gras
  | "italic" // Texte en italique
  | "serif" // Police serif
  | "mono" // Police monospace
  | "handwritten" // Style manuscrit
  | "centered" // Texte centré
  | "left" // Texte aligné à gauche
  | "right"; // Texte aligné à droite

/**
 * Propriétés communes à tous les types de posts
 */
interface BasePost {
  /**
   * Identifiant unique du post
   */
  id: string;

  /**
   * Légende du post
   */
  caption?: string;

  /**
   * Nom du filtre appliqué
   */
  filter?: string;

  /**
   * Nombre de likes
   */
  likes_count: number;

  /**
   * Nombre de commentaires
   */
  comments_count: number;

  /**
   * Nom de l'auteur
   */
  author_name: string;

  /**
   * URL de l'avatar de l'auteur
   */
  author_avatar?: string;

  /**
   * Email de l'auteur (créateur)
   */
  created_by?: string;

  /**
   * Date de création
   */
  created_date?: string;

  /**
   * Date de mise à jour
   */
  updated_date?: string;
}

/**
 * Post de type média (image ou vidéo)
 * Le champ media_url est obligatoire pour ce type
 */
export interface MediaPost extends BasePost {
  /**
   * Type discriminant : toujours "media" pour les posts média
   */
  type: "media";

  /**
   * URL du média (obligatoire pour les posts média)
   */
  media_url: string;

  /**
   * Type de média (photo ou vidéo)
   */
  media_type?: "photo" | "video";

  /**
   * Contenu textuel (optionnel pour les posts média)
   * Peut être utilisé comme légende alternative
   */
  content?: string;
}

/**
 * Post de type texte (style Twitter/X)
 * Le champ content est obligatoire pour ce type
 */
export interface TextPost extends BasePost {
  /**
   * Type discriminant : toujours "text" pour les posts texte
   */
  type: "text";

  /**
   * Contenu textuel (obligatoire pour les posts texte)
   */
  content: string;

  /**
   * Style de fond (pour les posts de type 'text')
   * Peut être un preset ou un code CSS personnalisé
   */
  backgroundStyle?: BackgroundPreset;

  /**
   * Style du texte (pour les posts de type 'text')
   */
  textStyle?: TextStyle;

  /**
   * URL du média (optionnel pour les posts texte)
   * Permet d'ajouter une image/vidéo à un post texte si nécessaire
   */
  media_url?: string;
}

/**
 * Union discriminée pour les posts VIBE
 * TypeScript utilisera le champ 'type' pour déterminer quel type de post est utilisé
 * et validera automatiquement que les champs obligatoires sont présents
 */
export type Post = MediaPost | TextPost;

/**
 * Mapping des presets de fond vers leurs classes CSS Tailwind
 */
export const backgroundPresets: Record<string, string> = {
  // Electric Vibe (Principal)
  "vibe-electric":
    "bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500",
  "vibe-purple":
    "bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-500",
  "vibe-glow": "bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400",

  // Classiques VIBE
  "vibe-dark": "bg-gradient-to-br from-gray-900 via-black to-gray-800",
  "vibe-ocean": "bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500",
  "vibe-fire": "bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500",
  "vibe-aurora": "bg-gradient-to-br from-green-500 via-teal-500 to-blue-600",
  "vibe-midnight": "bg-gradient-to-br from-indigo-900 via-purple-900 to-black",
  "vibe-gradient":
    "bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500",

  // Dégradés modernes
  "vibe-neon": "bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-500",
  "vibe-cyber": "bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600",
  "vibe-tropical":
    "bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600",
  "vibe-coral": "bg-gradient-to-br from-rose-400 via-red-500 to-orange-600",
  "vibe-gold": "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500",
  "vibe-space": "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
  "vibe-candy":
    "bg-gradient-to-tr from-violet-400 via-purple-400 to-indigo-400",
  "vibe-forest": "bg-gradient-to-br from-emerald-800 via-green-700 to-teal-800",
};

/**
 * Mapping des styles de texte vers leurs classes CSS Tailwind
 */
export const textStyles: Record<string, string> = {
  default: "font-sans text-center",
  bold: "font-bold text-center",
  italic: "italic text-center",
  serif: "font-serif text-center",
  mono: "font-mono text-center",
  handwritten: "font-serif italic text-center",
  centered: "text-center",
  left: "text-left",
  right: "text-right",
};

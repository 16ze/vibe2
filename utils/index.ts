/**
 * Utilitaires pour l'application VIBE
 */

/**
 * Crée une URL de page pour la navigation
 * @param pageName - Nom de la page
 * @returns URL de la page
 */
export function createPageUrl(pageName: string): string {
  const routes: Record<string, string> = {
    Home: '/',
    Feed: '/feed',
    Camera: '/camera',
    Conversations: '/conversations',
    Profile: '/profile',
  };
  
  return routes[pageName] || '/';
}

/**
 * Formate un nombre avec des séparateurs
 * @param num - Nombre à formater
 * @returns Nombre formaté (ex: 1 234)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('fr-FR');
}

/**
 * Formate une date en format relatif
 * @param date - Date à formater
 * @returns Date formatée (ex: "il y a 2 heures")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diff = now.getTime() - then.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  if (hours > 0) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  return 'à l\'instant';
}

/**
 * Valide un email
 * @param email - Email à valider
 * @returns true si l'email est valide
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Compresse une image avant upload
 * @param file - Fichier image
 * @param maxWidth - Largeur maximale
 * @param quality - Qualité (0-1)
 * @returns Promise<File> - Fichier compressé
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}







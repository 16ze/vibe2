/**
 * Système de stockage local pour remplacer base44
 * Utilise localStorage pour la persistance des données
 */

/**
 * Génère un ID unique pour les entités
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Classe pour gérer le stockage local des entités
 */
class LocalStorageManager {
  private storageKey: string;

  constructor(entityName: string) {
    this.storageKey = `vibe_${entityName}`;
  }

  /**
   * Récupère toutes les entités depuis le stockage
   */
  getAll(): any[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Sauvegarde toutes les entités dans le stockage
   */
  saveAll(items: any[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        console.error(`[LocalStorage] Quota exceeded for ${this.storageKey}. Attempting cleanup...`);
        // Nettoie les anciennes données si le quota est dépassé
        this.cleanupOldItems(items);
        // Réessaye avec les données nettoyées
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(items));
        } catch (retryError) {
          console.error(`[LocalStorage] Failed to save after cleanup:`, retryError);
        }
      } else {
        console.error(`[LocalStorage] Error saving ${this.storageKey}:`, error);
      }
    }
  }

  /**
   * Nettoie les anciennes entités pour libérer de l'espace
   * Modifie le tableau items en place pour garder uniquement les 50 éléments les plus récents
   */
  private cleanupOldItems(items: any[]): void {
    // Garde uniquement les 50 éléments les plus récents
    const sorted = items.sort((a, b) => {
      const dateA = new Date(a.created_date || a.updated_date || 0).getTime();
      const dateB = new Date(b.created_date || b.updated_date || 0).getTime();
      return dateB - dateA;
    });
    // Modifie le tableau en place
    items.length = 0;
    items.push(...sorted.slice(0, 50));
  }

  /**
   * Ajoute une nouvelle entité
   */
  add(item: any): any {
    const items = this.getAll();
    const newItem = {
      ...item,
      id: generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    items.push(newItem);
    this.saveAll(items);
    return newItem;
  }

  /**
   * Met à jour une entité existante
   */
  update(id: string, updates: Partial<any>): any | null {
    const items = this.getAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    
    items[index] = {
      ...items[index],
      ...updates,
      updated_date: new Date().toISOString(),
    };
    this.saveAll(items);
    return items[index];
  }

  /**
   * Supprime une entité
   */
  delete(id: string): boolean {
    const items = this.getAll();
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;
    this.saveAll(filtered);
    return true;
  }

  /**
   * Filtre les entités selon des critères
   */
  filter(filters: Record<string, any>): any[] {
    const items = this.getAll();
    return items.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        return item[key] === value;
      });
    });
  }

  /**
   * Trie les entités
   */
  sort(items: any[], orderBy?: string): any[] {
    if (!orderBy) return items;
    
    const isDesc = orderBy.startsWith('-');
    const field = isDesc ? orderBy.substring(1) : orderBy;
    
    return [...items].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal === bVal) return 0;
      
      // Gestion des dates
      if (field.includes('date') || field.includes('_at')) {
        const aDate = new Date(aVal).getTime();
        const bDate = new Date(bVal).getTime();
        return isDesc ? bDate - aDate : aDate - bDate;
      }
      
      // Gestion des nombres
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return isDesc ? bVal - aVal : aVal - bVal;
      }
      
      // Gestion des strings
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (isDesc) {
        return bStr.localeCompare(aStr);
      }
      return aStr.localeCompare(bStr);
    });
  }
}

/**
 * Gestionnaire de stockage pour les utilisateurs
 */
class UserStorage {
  private storageKey = 'vibe_users';
  private currentUserKey = 'vibe_current_user';

  /**
   * Récupère l'utilisateur actuel
   */
  getCurrentUser(): any | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(this.currentUserKey);
    if (data) return JSON.parse(data);
    
    // Crée un utilisateur par défaut si aucun n'existe
    const defaultUser = {
      email: 'demo@vibe.app',
      full_name: 'Anonyme',
      username: 'anonyme',
      avatar_url: null,
      bio: null,
      created_date: new Date().toISOString(),
    };
    this.setCurrentUser(defaultUser);
    return defaultUser;
  }

  /**
   * Définit l'utilisateur actuel
   */
  setCurrentUser(user: any): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.currentUserKey, JSON.stringify(user));
      
      // Sauvegarde aussi dans la liste des utilisateurs
      const users = this.getAll();
      const existingIndex = users.findIndex((u) => u.email === user.email);
      if (existingIndex >= 0) {
        users[existingIndex] = user;
      } else {
        users.push(user);
      }
      localStorage.setItem(this.storageKey, JSON.stringify(users));
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        console.error('[LocalStorage] Quota exceeded when saving user. Clearing old users...');
        // Nettoie les anciens utilisateurs (garde uniquement les 10 plus récents)
        const users = this.getAll();
        const cleanedUsers = users.slice(-10);
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(cleanedUsers));
          localStorage.setItem(this.currentUserKey, JSON.stringify(user));
        } catch (retryError) {
          console.error('[LocalStorage] Failed to save user after cleanup:', retryError);
        }
      } else {
        console.error('[LocalStorage] Error saving user:', error);
      }
    }
  }

  /**
   * Récupère tous les utilisateurs
   */
  getAll(): any[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Connexion
   */
  login(email: string, password: string): any {
    const users = this.getAll();
    let user = users.find((u) => u.email === email);
    
    if (!user) {
      // Crée un nouvel utilisateur
      user = {
        email,
        full_name: email.split('@')[0],
        username: email.split('@')[0],
        avatar_url: null,
        bio: null,
        created_date: new Date().toISOString(),
      };
      users.push(user);
      localStorage.setItem(this.storageKey, JSON.stringify(users));
    }
    
    this.setCurrentUser(user);
    return { user, token: 'local_token_' + Date.now() };
  }

  /**
   * Inscription
   */
  register(email: string, password: string, fullName?: string): any {
    const users = this.getAll();
    
    if (users.find((u) => u.email === email)) {
      throw new Error('Email déjà utilisé');
    }
    
    const user = {
      email,
      full_name: fullName || email.split('@')[0],
      username: email.split('@')[0],
      avatar_url: null,
      bio: null,
      created_date: new Date().toISOString(),
    };
    
    users.push(user);
    localStorage.setItem(this.storageKey, JSON.stringify(users));
    this.setCurrentUser(user);
    
    return { user, token: 'local_token_' + Date.now() };
  }

  /**
   * Déconnexion
   */
  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.currentUserKey);
  }
}

/**
 * Gestionnaire de fichiers locaux
 */
class FileStorage {
  /**
   * Upload un fichier et retourne une URL blob
   * CORRECTION : Limite la taille des fichiers stockés en base64 pour éviter QuotaExceededError
   */
  async uploadFile(file: File): Promise<{ file_url: string }> {
    // Stocke l'URL dans le localStorage pour la persistance
    const fileKey = `vibe_file_${generateId()}`;
    
    if (typeof window === 'undefined') {
      // Pour SSR, retourne une URL vide
      return { file_url: '' };
    }
    
    // LIMITE : Ne stocke pas les fichiers de plus de 1MB en base64 dans localStorage
    const MAX_SIZE_FOR_LOCALSTORAGE = 1024 * 1024; // 1MB
    
    // Pour les images, on peut les convertir en base64 pour la persistance
    if (file.type.startsWith('image/') && file.size <= MAX_SIZE_FOR_LOCALSTORAGE) {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          try {
            const base64 = reader.result as string;
            localStorage.setItem(fileKey, base64);
            resolve({ file_url: base64 });
          } catch (error: any) {
            if (error.name === 'QuotaExceededError') {
              console.warn('[FileStorage] Quota exceeded, using blob URL instead');
              // Fallback : utilise une URL blob si le quota est dépassé
              const blobUrl = URL.createObjectURL(file);
              resolve({ file_url: blobUrl });
            } else {
              reject(error);
            }
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    } else {
      // Pour les vidéos ou gros fichiers, on garde l'URL blob (pas de stockage localStorage)
      const blobUrl = URL.createObjectURL(file);
      // Ne stocke PAS l'URL blob dans localStorage (elle est temporaire)
      return { file_url: blobUrl };
    }
  }
}

/**
 * Export des gestionnaires de stockage
 */
export const storage = {
  Post: new LocalStorageManager('post'),
  Story: new LocalStorageManager('story'),
  Like: new LocalStorageManager('like'),
  Comment: new LocalStorageManager('comment'),
  Conversation: new LocalStorageManager('conversation'),
  Message: new LocalStorageManager('message'),
  Follow: new LocalStorageManager('follow'),
  User: new UserStorage(),
  File: new FileStorage(),
};

/**
 * Initialise le stockage avec des données mock si vide
 * Appelé automatiquement au chargement côté client
 */
export function initializeWithMockData(): void {
  if (typeof window === 'undefined') return;

  // Clé pour vérifier si l'initialisation a déjà été faite
  // Incrémente la version pour forcer la réinitialisation après modification des mocks
  const initKey = 'vibe_mock_initialized_v3';
  const isInitialized = localStorage.getItem(initKey);

  // Vérifie si les posts sont déjà initialisés
  const existingPosts = storage.Post.getAll();
  if (existingPosts.length > 0 && isInitialized) return;

  // Import dynamique pour éviter les problèmes SSR
  import('@/data/mockPosts').then(({ mockPosts }) => {
    // Sauvegarde directement tous les posts mock
    const posts = mockPosts.map((post: any) => ({
      ...post,
      created_date: post.created_date || new Date().toISOString(),
      updated_date: new Date().toISOString(),
    }));

    storage.Post.saveAll(posts);
    try {
      localStorage.setItem(initKey, 'true');
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        console.error('[LocalStorage] Quota exceeded during initialization');
      } else {
        console.error('[LocalStorage] Error during initialization:', error);
      }
    }

    console.log('✅ Mock posts initialized:', posts.length);

    // Ne pas forcer le rechargement - les données sont déjà disponibles
    // window.location.reload(); // DÉSACTIVÉ pour éviter les boucles de rechargement
  }).catch((err) => {
    console.error('Failed to load mock posts:', err);
  });
}

// Auto-initialisation côté client DÉSACTIVÉE
// L'initialisation est gérée par _app.tsx pour éviter les appels multiples
// if (typeof window !== 'undefined') {
//   // Attend que le DOM soit prêt
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initializeWithMockData);
//   } else {
//     initializeWithMockData();
//   }
// }


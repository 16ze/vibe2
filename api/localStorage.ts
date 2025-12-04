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
    localStorage.setItem(this.storageKey, JSON.stringify(items));
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
      full_name: 'Utilisateur Demo',
      username: 'demo_user',
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
   */
  async uploadFile(file: File): Promise<{ file_url: string }> {
    // Stocke l'URL dans le localStorage pour la persistance
    const fileKey = `vibe_file_${generateId()}`;
    
    if (typeof window === 'undefined') {
      // Pour SSR, retourne une URL vide
      return { file_url: '' };
    }
    
    // Pour les images, on peut les convertir en base64 pour la persistance
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          localStorage.setItem(fileKey, base64);
          resolve({ file_url: base64 });
        };
        reader.readAsDataURL(file);
      });
    } else {
      // Pour les vidéos, on garde l'URL blob
      const blobUrl = URL.createObjectURL(file);
      localStorage.setItem(fileKey, blobUrl);
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
    localStorage.setItem(initKey, 'true');

    console.log('✅ Mock posts initialized:', posts.length);

    // Force le rechargement de la page pour afficher les données
    window.location.reload();
  }).catch((err) => {
    console.error('Failed to load mock posts:', err);
  });
}

// Auto-initialisation côté client
if (typeof window !== 'undefined') {
  // Attend que le DOM soit prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWithMockData);
  } else {
    initializeWithMockData();
  }
}


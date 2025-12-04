/**
 * Client API local pour VIBE
 * Remplace base44 avec un système de stockage local
 */

import { storage } from './localStorage';

/**
 * Classe pour gérer les entités (CRUD operations)
 */
class EntityClient {
  private storageManager: any;

  constructor(entityName: string) {
    this.storageManager = storage[entityName as keyof typeof storage];
  }

  /**
   * Liste toutes les entités avec tri
   * @param orderBy - Champ de tri (ex: '-created_date' pour décroissant)
   * @param limit - Nombre maximum d'éléments
   */
  async list(orderBy?: string, limit?: number): Promise<any[]> {
    try {
      let items = this.storageManager.getAll();
      
      // Met à jour les compteurs pour les posts
      if (this.storageManager === storage.Post) {
        items = await this.updatePostsCounters(items);
      }
      
      // Trie les éléments
      if (orderBy) {
        items = this.storageManager.sort(items, orderBy);
      }
      
      // Limite le nombre d'éléments
      if (limit) {
        items = items.slice(0, limit);
      }
      
      return items;
    } catch (error) {
      console.error(`Error listing:`, error);
      return [];
    }
  }

  /**
   * Filtre les entités selon des critères
   * @param filters - Objet de filtres
   * @param orderBy - Champ de tri optionnel
   */
  async filter(filters: Record<string, any>, orderBy?: string): Promise<any[]> {
    try {
      let items = this.storageManager.filter(filters);
      
      // Trie les éléments
      if (orderBy) {
        items = this.storageManager.sort(items, orderBy);
      }
      
      return items;
    } catch (error) {
      console.error(`Error filtering ${this.storageManager.storageKey}:`, error);
      return [];
    }
  }

  /**
   * Crée une nouvelle entité
   * @param data - Données de l'entité
   */
  async create(data: Record<string, any>): Promise<any> {
    try {
      const currentUser = storage.User.getCurrentUser();
      
      // Ajoute automatiquement les champs créateur si nécessaire
      if (!data.created_by && currentUser) {
        data.created_by = currentUser.email;
      }
      
      const newItem = this.storageManager.add(data);
      
      // Met à jour les compteurs si nécessaire
      if (data.post_id) {
        await this.updatePostCounters(data.post_id);
      }
      
      return newItem;
    } catch (error) {
      console.error(`Error creating entity:`, error);
      throw error;
    }
  }

  /**
   * Met à jour une entité existante
   * @param id - ID de l'entité
   * @param data - Données à mettre à jour
   */
  async update(id: string, data: Record<string, any>): Promise<any> {
    try {
      const updated = this.storageManager.update(id, data);
      if (!updated) {
        throw new Error(`Entity with id ${id} not found`);
      }
      return updated;
    } catch (error) {
      console.error(`Error updating entity:`, error);
      throw error;
    }
  }

  /**
   * Supprime une entité
   * @param id - ID de l'entité
   */
  async delete(id: string): Promise<void> {
    try {
      const deleted = this.storageManager.delete(id);
      if (!deleted) {
        throw new Error(`Entity with id ${id} not found`);
      }
    } catch (error) {
      console.error(`Error deleting entity:`, error);
      throw error;
    }
  }

  /**
   * Met à jour les compteurs d'un post (likes, comments)
   */
  private async updatePostCounters(postId: string): Promise<void> {
    const likes = storage.Like.filter({ post_id: postId });
    const comments = storage.Comment.filter({ post_id: postId });
    
    const posts = storage.Post.getAll();
    const postIndex = posts.findIndex((p: any) => p.id === postId);
    
    if (postIndex >= 0) {
      posts[postIndex].likes_count = likes.length;
      posts[postIndex].comments_count = comments.length;
      storage.Post.saveAll(posts);
    }
  }

  /**
   * Met à jour les compteurs de tous les posts
   */
  private async updatePostsCounters(posts: any[]): Promise<any[]> {
    return posts.map((post) => {
      const likes = storage.Like.filter({ post_id: post.id });
      const comments = storage.Comment.filter({ post_id: post.id });
      return {
        ...post,
        likes_count: likes.length,
        comments_count: comments.length,
      };
    });
  }
}

/**
 * Client d'authentification
 */
class AuthClient {
  /**
   * Récupère l'utilisateur actuellement connecté
   */
  async me(): Promise<any> {
    try {
      const user = storage.User.getCurrentUser();
      if (!user) {
        throw new Error('No user logged in');
      }
      return user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Retourne un utilisateur par défaut
      return storage.User.getCurrentUser();
    }
  }

  /**
   * Connexion
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe
   */
  async login(email: string, password: string): Promise<any> {
    try {
      const result = storage.User.login(email, password);
      
      // Stocke le token (même si c'est local)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', result.token);
      }
      
      return result;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  /**
   * Inscription
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe
   * @param fullName - Nom complet
   */
  async register(email: string, password: string, fullName?: string): Promise<any> {
    try {
      const result = storage.User.register(email, password, fullName);
      
      // Stocke le token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', result.token);
      }
      
      return result;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    storage.User.logout();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    }
  }
}

/**
 * Client pour les intégrations
 */
class IntegrationsClient {
  /**
   * Upload un fichier
   * @param options - Options d'upload incluant le fichier
   */
  async UploadFile(options: { file: File }): Promise<{ file_url: string }> {
    try {
      return await storage.File.uploadFile(options.file);
    } catch (error) {
      console.error('Error uploading file:', error);
      // Retourne une URL blob de secours
      return {
        file_url: URL.createObjectURL(options.file),
      };
    }
  }

  /**
   * Récupère tous les utilisateurs disponibles
   * @returns Promise avec le tableau d'utilisateurs
   */
  async getAllUsers(): Promise<any[]> {
    try {
      return await storage.User.getAll();
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
}

/**
 * Client principal VIBE (remplace base44)
 */
export const vibe = {
  auth: new AuthClient(),
  entities: {
    Post: new EntityClient('Post'),
    Story: new EntityClient('Story'),
    Like: new EntityClient('Like'),
    Comment: new EntityClient('Comment'),
    Conversation: new EntityClient('Conversation'),
    Message: new EntityClient('Message'),
    Follow: new EntityClient('Follow'),
  },
  integrations: {
    Core: new IntegrationsClient(),
  },
};

// Export aussi sous le nom base44 pour la compatibilité avec le code existant
export const base44 = vibe;


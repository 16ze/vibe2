/**
 * Système de stockage IndexedDB pour VIBE
 * Utilise idb-keyval pour gérer efficacement les fichiers lourds (vidéos, images)
 * Remplace/complémente localStorage pour supporter les Blobs vidéo
 */

import { clear, del, get, set } from "idb-keyval";

/**
 * Génère un ID unique pour les entités
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Classe pour gérer le stockage IndexedDB des entités
 * Toutes les méthodes sont asynchrones pour supporter les opérations IndexedDB
 */
class IndexedDBManager {
  private storageKey: string;

  constructor(entityName: string) {
    this.storageKey = `vibe_${entityName}`;
  }

  /**
   * Récupère toutes les entités depuis IndexedDB
   * @returns Promise avec le tableau d'entités
   */
  async getAll(): Promise<any[]> {
    if (typeof window === "undefined") return [];

    try {
      const data = await get<any[]>(this.storageKey);
      return data || [];
    } catch (error) {
      console.error(`Error getting all items from ${this.storageKey}:`, error);
      return [];
    }
  }

  /**
   * Sauvegarde toutes les entités dans IndexedDB
   * @param items - Tableau d'entités à sauvegarder
   */
  async saveAll(items: any[]): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      await set(this.storageKey, items);
    } catch (error) {
      console.error(`Error saving items to ${this.storageKey}:`, error);
      throw error;
    }
  }

  /**
   * Ajoute une nouvelle entité
   * @param item - Données de l'entité à ajouter
   * @returns Promise avec la nouvelle entité créée
   */
  async add(item: any): Promise<any> {
    const items = await this.getAll();
    const newItem = {
      ...item,
      id: generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    items.push(newItem);
    await this.saveAll(items);
    return newItem;
  }

  /**
   * Met à jour une entité existante
   * @param id - ID de l'entité à mettre à jour
   * @param updates - Données à mettre à jour
   * @returns Promise avec l'entité mise à jour ou null si non trouvée
   */
  async update(id: string, updates: Partial<any>): Promise<any | null> {
    const items = await this.getAll();
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...updates,
      updated_date: new Date().toISOString(),
    };

    await this.saveAll(items);
    return items[index];
  }

  /**
   * Supprime une entité
   * @param id - ID de l'entité à supprimer
   * @returns Promise avec true si supprimée, false sinon
   */
  async delete(id: string): Promise<boolean> {
    const items = await this.getAll();
    const filtered = items.filter((item) => item.id !== id);

    if (filtered.length === items.length) return false;

    await this.saveAll(filtered);
    return true;
  }

  /**
   * Filtre les entités selon des critères
   * @param filters - Objet de filtres (clé: valeur)
   * @returns Promise avec le tableau d'entités filtrées
   */
  async filter(filters: Record<string, any>): Promise<any[]> {
    const items = await this.getAll();
    return items.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        return item[key] === value;
      });
    });
  }

  /**
   * Trie les entités
   * @param items - Tableau d'entités à trier
   * @param orderBy - Champ de tri (ex: '-created_date' pour décroissant)
   * @returns Tableau trié
   */
  sort(items: any[], orderBy?: string): any[] {
    if (!orderBy) return items;

    const isDesc = orderBy.startsWith("-");
    const field = isDesc ? orderBy.substring(1) : orderBy;

    return [...items].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal === bVal) return 0;

      // Gestion des dates
      if (field.includes("date") || field.includes("_at")) {
        const aDate = new Date(aVal).getTime();
        const bDate = new Date(bVal).getTime();
        return isDesc ? bDate - aDate : aDate - bDate;
      }

      // Gestion des nombres
      if (typeof aVal === "number" && typeof bVal === "number") {
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
 * Gestionnaire de stockage IndexedDB pour les utilisateurs
 */
class UserStorage {
  private storageKey = "vibe_users";
  private currentUserKey = "vibe_current_user";

  /**
   * Récupère l'utilisateur actuel
   * @returns Promise avec l'utilisateur actuel ou null
   */
  async getCurrentUser(): Promise<any | null> {
    if (typeof window === "undefined") return null;

    try {
      const data = await get<any>(this.currentUserKey);
      if (data) return data;

      // Crée un utilisateur par défaut si aucun n'existe
      const defaultUser = {
        email: "demo@vibe.app",
        full_name: "Anonyme",
        username: "anonyme",
        avatar_url: null,
        bio: null,
        created_date: new Date().toISOString(),
      };
      await this.setCurrentUser(defaultUser);
      return defaultUser;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  /**
   * Définit l'utilisateur actuel
   * @param user - Données de l'utilisateur
   */
  async setCurrentUser(user: any): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      await set(this.currentUserKey, user);

      // Sauvegarde aussi dans la liste des utilisateurs
      const users = await this.getAll();
      const existingIndex = users.findIndex((u) => u.email === user.email);

      if (existingIndex >= 0) {
        users[existingIndex] = user;
      } else {
        users.push(user);
      }

      await set(this.storageKey, users);
    } catch (error) {
      console.error("Error setting current user:", error);
      throw error;
    }
  }

  /**
   * Récupère tous les utilisateurs
   * @returns Promise avec le tableau d'utilisateurs
   */
  async getAll(): Promise<any[]> {
    if (typeof window === "undefined") return [];

    try {
      const data = await get<any[]>(this.storageKey);
      return data || [];
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  /**
   * Connexion
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe (non utilisé en local mais gardé pour compatibilité)
   * @returns Promise avec l'utilisateur et le token
   */
  async login(
    email: string,
    password: string
  ): Promise<{ user: any; token: string }> {
    const users = await this.getAll();
    let user = users.find((u) => u.email === email);

    if (!user) {
      // Crée un nouvel utilisateur
      user = {
        email,
        full_name: email.split("@")[0],
        username: email.split("@")[0],
        avatar_url: null,
        bio: null,
        created_date: new Date().toISOString(),
      };
      users.push(user);
      await set(this.storageKey, users);
    }

    await this.setCurrentUser(user);
    return { user, token: "local_token_" + Date.now() };
  }

  /**
   * Inscription
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe
   * @param fullName - Nom complet (optionnel)
   * @returns Promise avec l'utilisateur et le token
   */
  async register(
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ user: any; token: string }> {
    const users = await this.getAll();

    if (users.find((u) => u.email === email)) {
      throw new Error("Email déjà utilisé");
    }

    const user = {
      email,
      full_name: fullName || email.split("@")[0],
      username: email.split("@")[0],
      avatar_url: null,
      bio: null,
      created_date: new Date().toISOString(),
    };

    users.push(user);
    await set(this.storageKey, users);
    await this.setCurrentUser(user);

    return { user, token: "local_token_" + Date.now() };
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      await del(this.currentUserKey);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }
}

/**
 * Gestionnaire de fichiers IndexedDB optimisé pour les vidéos
 * Stocke les Blobs directement dans IndexedDB pour une meilleure performance
 */
class FileStorage {
  private blobStoragePrefix = "vibe_blob_";
  private metadataStoragePrefix = "vibe_file_meta_";

  /**
   * Upload un fichier et retourne une URL blob ou une référence IndexedDB
   * Pour les vidéos, stocke le Blob directement dans IndexedDB
   * Pour les images, peut utiliser base64 ou Blob selon la taille
   *
   * @param file - Fichier à uploader
   * @returns Promise avec l'URL du fichier ou la référence IndexedDB
   */
  async uploadFile(file: File): Promise<{ file_url: string }> {
    if (typeof window === "undefined") {
      return { file_url: "" };
    }

    const fileId = generateId();
    const blobKey = `${this.blobStoragePrefix}${fileId}`;
    const metaKey = `${this.metadataStoragePrefix}${fileId}`;

    try {
      // Pour les vidéos, stocke directement le Blob dans IndexedDB
      if (file.type.startsWith("video/")) {
        const blob = new Blob([file], { type: file.type });
        await set(blobKey, blob);

        // Stocke les métadonnées séparément
        const metadata = {
          id: fileId,
          type: file.type,
          name: file.name,
          size: file.size,
          created_date: new Date().toISOString(),
        };
        await set(metaKey, metadata);

        // Retourne une URL spéciale qui sera résolue par getFileUrl
        return { file_url: `indexeddb://${fileId}` };
      }

      // Pour les images, on peut utiliser base64 pour les petites images
      // ou Blob pour les grandes images
      if (file.type.startsWith("image/")) {
        // Si l'image est petite (< 1MB), utilise base64 pour compatibilité
        if (file.size < 1024 * 1024) {
          const reader = new FileReader();
          return new Promise((resolve, reject) => {
            reader.onloadend = () => {
              const base64 = reader.result as string;
              resolve({ file_url: base64 });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } else {
          // Pour les grandes images, utilise IndexedDB
          const blob = new Blob([file], { type: file.type });
          await set(blobKey, blob);

          const metadata = {
            id: fileId,
            type: file.type,
            name: file.name,
            size: file.size,
            created_date: new Date().toISOString(),
          };
          await set(metaKey, metadata);

          return { file_url: `indexeddb://${fileId}` };
        }
      }

      // Pour les autres types de fichiers, stocke dans IndexedDB
      const blob = new Blob([file], { type: file.type });
      await set(blobKey, blob);

      const metadata = {
        id: fileId,
        type: file.type,
        name: file.name,
        size: file.size,
        created_date: new Date().toISOString(),
      };
      await set(metaKey, metadata);

      return { file_url: `indexeddb://${fileId}` };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  /**
   * Récupère l'URL blob d'un fichier stocké dans IndexedDB
   * @param fileUrl - URL du fichier (format: indexeddb://fileId ou base64/data URL)
   * @returns Promise avec l'URL blob ou l'URL originale
   */
  async getFileUrl(fileUrl: string): Promise<string> {
    if (!fileUrl) return "";

    // Si c'est déjà une URL blob ou base64, retourne directement
    if (
      fileUrl.startsWith("blob:") ||
      fileUrl.startsWith("data:") ||
      fileUrl.startsWith("http")
    ) {
      return fileUrl;
    }

    // Si c'est une référence IndexedDB, récupère le Blob
    if (fileUrl.startsWith("indexeddb://")) {
      const fileId = fileUrl.replace("indexeddb://", "");
      const blobKey = `${this.blobStoragePrefix}${fileId}`;

      try {
        const blob = await get<Blob>(blobKey);
        if (blob) {
          // Crée une URL blob temporaire
          return URL.createObjectURL(blob);
        }
      } catch (error) {
        console.error("Error getting file from IndexedDB:", error);
      }
    }

    return fileUrl;
  }

  /**
   * Supprime un fichier de IndexedDB
   * @param fileUrl - URL du fichier à supprimer
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl || !fileUrl.startsWith("indexeddb://")) return;

    const fileId = fileUrl.replace("indexeddb://", "");
    const blobKey = `${this.blobStoragePrefix}${fileId}`;
    const metaKey = `${this.metadataStoragePrefix}${fileId}`;

    try {
      await del(blobKey);
      await del(metaKey);
    } catch (error) {
      console.error("Error deleting file from IndexedDB:", error);
    }
  }

  /**
   * Récupère les métadonnées d'un fichier
   * @param fileUrl - URL du fichier
   * @returns Promise avec les métadonnées ou null
   */
  async getFileMetadata(fileUrl: string): Promise<any | null> {
    if (!fileUrl || !fileUrl.startsWith("indexeddb://")) return null;

    const fileId = fileUrl.replace("indexeddb://", "");
    const metaKey = `${this.metadataStoragePrefix}${fileId}`;

    try {
      return await get(metaKey);
    } catch (error) {
      console.error("Error getting file metadata:", error);
      return null;
    }
  }

  /**
   * Nettoie les URLs blob temporaires (à appeler quand on n'a plus besoin du fichier)
   * @param url - URL blob à révoquer
   */
  revokeBlobUrl(url: string): void {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Export des gestionnaires de stockage IndexedDB
 * Interface identique à localStorage.ts pour faciliter la migration
 */
export const indexedDBStorage = {
  Post: new IndexedDBManager("post"),
  Story: new IndexedDBManager("story"),
  Like: new IndexedDBManager("like"),
  Comment: new IndexedDBManager("comment"),
  Conversation: new IndexedDBManager("conversation"),
  Message: new IndexedDBManager("message"),
  Follow: new IndexedDBManager("follow"),
  User: new UserStorage(),
  File: new FileStorage(),
};

/**
 * Fonction utilitaire pour migrer les données de localStorage vers IndexedDB
 * À appeler une seule fois lors de la première utilisation
 */
export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;

  const migrationKey = "vibe_indexeddb_migrated";
  const migrated = localStorage.getItem(migrationKey);

  if (migrated) {
    console.log("Migration already completed");
    return;
  }

  try {
    console.log("Starting migration from localStorage to IndexedDB...");

    const entities = [
      "post",
      "story",
      "like",
      "comment",
      "conversation",
      "message",
      "follow",
    ];

    for (const entity of entities) {
      const key = `vibe_${entity}`;
      const data = localStorage.getItem(key);

      if (data) {
        try {
          const items = JSON.parse(data);
          const storageKey = (entity.charAt(0).toUpperCase() +
            entity.slice(1)) as keyof typeof indexedDBStorage;
          const storage = indexedDBStorage[storageKey];
          // Vérifie que c'est un IndexedDBManager (qui a la méthode saveAll)
          if (
            storage &&
            "saveAll" in storage &&
            typeof storage.saveAll === "function"
          ) {
            await storage.saveAll(items);
            console.log(`Migrated ${entity}: ${items.length} items`);
          }
        } catch (error) {
          console.error(`Error migrating ${entity}:`, error);
        }
      }
    }

    // Migre les utilisateurs
    const usersKey = "vibe_users";
    const usersData = localStorage.getItem(usersKey);
    if (usersData) {
      try {
        const users = JSON.parse(usersData);
        await indexedDBStorage.User.setCurrentUser(users[0] || null);
        console.log(`Migrated users: ${users.length} users`);
      } catch (error) {
        console.error("Error migrating users:", error);
      }
    }

    try {
      localStorage.setItem(migrationKey, "true");
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        console.error('[IndexedDB] Quota exceeded when saving migration flag');
      } else {
        console.error('[IndexedDB] Error saving migration flag:', error);
      }
    }
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

/**
 * Fonction utilitaire pour nettoyer IndexedDB (supprime toutes les données)
 * À utiliser avec précaution !
 */
export async function clearIndexedDB(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    await clear();
    console.log("IndexedDB cleared successfully");
  } catch (error) {
    console.error("Error clearing IndexedDB:", error);
  }
}

/**
 * Fonction de nettoyage du localStorage pour éviter QuotaExceededError
 * Nettoie toutes les anciennes données vibe_* sauf la session Supabase
 */

export function cleanupLocalStorage(): void {
  if (typeof window === "undefined") return;

  try {
    console.log("[cleanupLocalStorage] Starting cleanup...");

    // Liste des clés à nettoyer (toutes les clés vibe_* sauf Supabase)
    const keysToClean: string[] = [];
    const keysToKeep = [
      // Session Supabase (commence par sb-)
      // On garde toutes les clés qui commencent par sb-
    ];

    // Parcourt toutes les clés du localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Garde la session Supabase
      if (key.startsWith("sb-")) {
        continue;
      }

      // Nettoie toutes les clés vibe_* (ancien système)
      if (key.startsWith("vibe_")) {
        keysToClean.push(key);
      }
    }

    // Nettoie les clés identifiées
    let cleanedCount = 0;
    for (const key of keysToClean) {
      try {
        localStorage.removeItem(key);
        cleanedCount++;
      } catch (error) {
        console.warn(`[cleanupLocalStorage] Failed to remove ${key}:`, error);
      }
    }

    console.log(`[cleanupLocalStorage] Cleaned ${cleanedCount} keys`);

    // Vérifie la taille restante
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }

    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(`[cleanupLocalStorage] Remaining localStorage size: ${sizeInMB} MB`);

    // Si toujours trop plein (> 4MB), nettoie aussi les anciennes sessions Supabase
    if (totalSize > 4 * 1024 * 1024) {
      console.warn("[cleanupLocalStorage] Still too large, cleaning old Supabase sessions...");
      
      // Nettoie les anciennes sessions Supabase (garde seulement la dernière)
      const supabaseKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sb-")) {
          supabaseKeys.push(key);
        }
      }

      // Garde seulement les clés essentielles
      const essentialKeys = supabaseKeys.filter(key => 
        key.includes("auth-token") || key.includes("user")
      );

      // Supprime les autres
      for (const key of supabaseKeys) {
        if (!essentialKeys.includes(key)) {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.warn(`[cleanupLocalStorage] Failed to remove Supabase key ${key}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error("[cleanupLocalStorage] Error during cleanup:", error);
  }
}

/**
 * Nettoie automatiquement le localStorage si QuotaExceededError
 * À appeler dans un try/catch autour de localStorage.setItem
 */
export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    if (error.name === "QuotaExceededError") {
      console.warn("[safeSetItem] Quota exceeded, cleaning localStorage...");
      cleanupLocalStorage();
      
      // Réessaye après nettoyage
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryError) {
        console.error("[safeSetItem] Still failed after cleanup:", retryError);
        return false;
      }
    }
    console.error("[safeSetItem] Error setting item:", error);
    return false;
  }
}


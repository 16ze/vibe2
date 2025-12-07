import { supabase } from "@/lib/supabase";

/**
 * Service pour gérer l'upload de médias vers Supabase Storage
 */

export type StorageBucket = "posts" | "stories" | "messages";

/**
 * Upload un fichier vers Supabase Storage
 * @param file - Le fichier Blob à uploader
 * @param bucket - Le bucket de destination
 * @param userId - L'ID de l'utilisateur
 * @returns L'URL publique du fichier uploadé
 */
export async function uploadMedia(
  file: Blob,
  bucket: StorageBucket,
  userId: string
): Promise<string> {
  try {
    // Validation des paramètres
    if (!file || file.size === 0) {
      throw new Error("Le fichier est vide ou invalide");
    }

    if (!userId || userId.trim() === "") {
      throw new Error("L'ID utilisateur est requis");
    }

    // CORRECTION CRITIQUE : Détection stricte du type et Content-Type explicite
    const isVideo = file.type.startsWith("video/");

    // Si c'est une vidéo, on force .mp4 (plus compatible) ou .webm
    // Si c'est une image, on force .jpg
    let fileExt: string;
    let contentType: string;

    if (isVideo) {
      // Détermine l'extension selon le type MIME du fichier
      if (file.type.includes("mp4") || file.type.includes("quicktime")) {
        fileExt = "mp4";
        contentType = "video/mp4"; // Force le type exact
      } else if (file.type.includes("webm")) {
        fileExt = "webm";
        contentType = "video/webm"; // Force le type exact
      } else {
        // Fallback : utilise mp4 par défaut (plus compatible)
        fileExt = "mp4";
        contentType = "video/mp4";
      }
    } else {
      fileExt = "jpg";
      contentType = "image/jpeg";
    }

    // Génère un nom de fichier unique : ${userId}/${Date.now()}.${ext}
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}.${fileExt}`;

    console.log("[mediaService] Uploading file:", {
      fileName,
      bucket,
      size: file.size,
      originalType: file.type,
      detectedExt: fileExt,
      contentType,
      isVideo,
    });

    // Upload DIRECT vers Supabase Storage avec Content-Type explicite
    // CRITIQUE : Le Content-Type doit être explicite pour que les vidéos soient lisibles
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: contentType, // Force le Content-Type explicite
      });

    if (error) {
      console.error("[mediaService] Upload error:", error);
      throw error;
    }

    if (!data?.path) {
      throw new Error("Aucun chemin retourné après l'upload");
    }

    console.log("[mediaService] Upload successful, path:", data.path);

    // Récupère l'URL publique
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      throw new Error("Impossible de récupérer l'URL publique du fichier");
    }

    const publicUrl = String(urlData.publicUrl);
    console.log("[mediaService] Public URL:", publicUrl);

    return publicUrl;
  } catch (error: any) {
    console.error("[mediaService] Error in uploadMedia:", error);
    throw error;
  }
}

/**
 * Supprime un fichier de Supabase Storage
 */
export async function deleteMedia(
  bucket: StorageBucket,
  filePath: string
): Promise<void> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error("[mediaService] Delete error:", error);
      throw error;
    }
  } catch (error) {
    console.error("[mediaService] Error in deleteMedia:", error);
    throw error;
  }
}


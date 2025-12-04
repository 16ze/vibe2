"use client";

import { vibe } from "@/api/vibeClient";
import FilterCarousel, { FILTERS } from "@/components/camera/FilterCarousel";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Grid3X3,
  Image,
  Pencil,
  RotateCcw,
  Sticker,
  Timer,
  Type,
  X,
  Zap,
  ZapOff,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

type AspectRatio = "1:1" | "4:5" | "16:9";
type CaptureMode = "STORY" | "POST" | "VIBES";

/**
 * Composant overlay pour afficher le masque visuel du ratio d'aspect
 * Crée des bandes noires pour montrer la zone qui sera capturée
 * Ne s'affiche que si captureMode === 'POST'
 */
function AspectRatioOverlay({
  ratio,
  show,
}: {
  ratio: AspectRatio;
  show: boolean;
}) {
  if (!show) return null;

  const containerRef = useRef<HTMLDivElement>(null);
  const [maskStyle, setMaskStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const updateMask = () => {
      if (!containerRef.current) return;

      const container = containerRef.current.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Parse le ratio
      const [ratioW, ratioH] = ratio.split(":").map(Number);
      const targetRatio = ratioW / ratioH;
      const containerRatio = containerWidth / containerHeight;

      let top = 0;
      let bottom = 0;
      let left = 0;
      let right = 0;

      if (containerRatio > targetRatio) {
        // Le conteneur est plus large → bandes noires sur les côtés
        const visibleWidth = containerHeight * targetRatio;
        const sideWidth = (containerWidth - visibleWidth) / 2;
        left = sideWidth;
        right = sideWidth;
      } else {
        // Le conteneur est plus haut → bandes noires en haut et en bas
        const visibleHeight = containerWidth / targetRatio;
        const topBottomHeight = (containerHeight - visibleHeight) / 2;
        top = topBottomHeight;
        bottom = topBottomHeight;
      }

      setMaskStyle({
        top: `${top}px`,
        bottom: `${bottom}px`,
        left: `${left}px`,
        right: `${right}px`,
      });
    };

    updateMask();
    window.addEventListener("resize", updateMask);
    const interval = setInterval(updateMask, 100); // Mise à jour périodique

    return () => {
      window.removeEventListener("resize", updateMask);
      clearInterval(interval);
    };
  }, [ratio]);

  return (
    <>
      {/* Bande supérieure */}
      <div
        className="absolute left-0 right-0 bg-black/70 pointer-events-none z-10"
        style={{
          top: 0,
          height: maskStyle.top || "0px",
        }}
      />
      {/* Bande inférieure */}
      <div
        className="absolute left-0 right-0 bg-black/70 pointer-events-none z-10"
        style={{
          bottom: 0,
          height: maskStyle.bottom || "0px",
        }}
      />
      {/* Bande gauche */}
      <div
        className="absolute top-0 bottom-0 bg-black/70 pointer-events-none z-10"
        style={{
          left: 0,
          width: maskStyle.left || "0px",
        }}
      />
      {/* Bande droite */}
      <div
        className="absolute top-0 bottom-0 bg-black/70 pointer-events-none z-10"
        style={{
          right: 0,
          width: maskStyle.right || "0px",
        }}
      />
      <div ref={containerRef} className="hidden" />
    </>
  );
}

/**
 * Sélecteur de mode (STORY / POST / VIBES)
 * Fait partie de la barre de navigation en bas
 */
function ModeSelector({
  currentMode,
  onModeChange,
}: {
  currentMode: CaptureMode;
  onModeChange: (mode: CaptureMode) => void;
}) {
  return (
    <div className="flex gap-1 px-2 py-1.5 bg-black/20 backdrop-blur-sm rounded-full">
      {(["STORY", "POST", "VIBES"] as CaptureMode[]).map((mode) => (
        <motion.button
          key={mode}
          whileTap={{ scale: 0.95 }}
          onClick={() => onModeChange(mode)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            currentMode === mode ? "text-white" : "text-white/50"
          }`}
        >
          {mode}
        </motion.button>
      ))}
    </div>
  );
}

/**
 * Sélecteur de ratio d'aspect
 * Visible uniquement si mode === 'POST'
 * Placé en haut de l'écran
 */
function AspectRatioSelector({
  currentRatio,
  onRatioChange,
  visible,
}: {
  currentRatio: AspectRatio;
  onRatioChange: (ratio: AspectRatio) => void;
  visible: boolean;
}) {
  if (!visible) return null;

  const ratios: { value: AspectRatio; label: string }[] = [
    { value: "1:1", label: "1:1" },
    { value: "4:5", label: "4:5" },
    { value: "16:9", label: "16:9" },
  ];

  return (
    <div className="absolute top-20 inset-x-0 z-30 flex justify-center">
      <div className="flex gap-1 px-2 py-1.5 bg-black/20 backdrop-blur-sm rounded-full">
        {ratios.map((ratio) => (
          <motion.button
            key={ratio.value}
            whileTap={{ scale: 0.95 }}
            onClick={() => onRatioChange(ratio.value)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              currentRatio === ratio.value
                ? "text-white bg-white/10"
                : "text-white/50"
            }`}
          >
            {ratio.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default function Camera() {
  const [mode, setMode] = useState("capture"); // capture, preview, edit
  const [capturedMedia, setCapturedMedia] = useState<{
    type: string;
    url: string;
    file?: File;
  } | null>(null);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [flashOn, setFlashOn] = useState(false);
  const [timerOn, setTimerOn] = useState(false);
  const [gridOn, setGridOn] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>("STORY");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasActiveStory, setHasActiveStory] = useState(false);

  /**
   * Calcule le ratio effectif selon le mode
   * STORY → forcé à 9:16
   * VIBES → forcé à 9:16 (comme STORY)
   * POST → utilise aspectRatio
   */
  const effectiveRatio =
    captureMode === "STORY" || captureMode === "VIBES" ? "9:16" : aspectRatio;
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  /**
   * Récupère l'utilisateur actuel et vérifie s'il a une story active
   */
  useEffect(() => {
    vibe.auth
      .me()
      .then((user) => {
        setCurrentUser(user);
      })
      .catch(() => {});

    // Vérifie si l'utilisateur a une story active (non expirée)
    const checkActiveStory = async () => {
      try {
        const user = await vibe.auth.me();
        if (user?.email) {
          const stories = await vibe.entities.Story.filter(
            { created_by: user.email },
            "-created_date"
          );
          const now = new Date();
          const activeStory = stories.find((story: any) => {
            if (!story.expires_at) return false;
            return new Date(story.expires_at) > now;
          });
          setHasActiveStory(!!activeStory);
        }
      } catch (err) {
        console.error("Error checking active story:", err);
      }
    };
    checkActiveStory();
  }, []);

  /**
   * Marque le composant comme monté côté client
   * Évite les problèmes d'hydratation
   */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Initialise la caméra au montage du composant
   * Nettoie le stream au démontage
   */
  useEffect(() => {
    // Vérifie que nous sommes côté client
    if (typeof window === "undefined") return;

    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  /**
   * Force la lecture de la vidéo quand le stream change
   */
  useEffect(() => {
    if (videoRef.current && streamRef.current && !isLoading && !cameraError) {
      console.log("[Camera] Ensuring video playback");
      videoRef.current.play().catch((err) => {
        console.error("[Camera] Error forcing play:", err);
      });
    }
  }, [isLoading, cameraError]);

  /**
   * Démarre le stream vidéo de la caméra
   * Gère les erreurs et les états de chargement
   */
  const startCamera = async () => {
    // Vérifie que nous sommes côté client
    if (typeof window === "undefined") {
      console.log("[Camera] Window not available");
      setIsLoading(false);
      return;
    }

    // Vérifie que l'API est disponible
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("[Camera] MediaDevices API not available");
      setCameraError("Votre navigateur ne supporte pas l'accès à la caméra");
      setIsLoading(false);
      return;
    }

    try {
      console.log("[Camera] Starting camera...");
      setIsLoading(true);
      setCameraError(null);

      // Arrête le stream précédent s'il existe
      stopCamera();

      // Demande l'accès à la caméra
      console.log(
        "[Camera] Requesting camera access with facingMode:",
        facingMode
      );
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true,
      });

      console.log("[Camera] Stream received:", stream);
      console.log("[Camera] Stream tracks:", stream.getTracks().length);
      streamRef.current = stream;

      // Attendre un peu pour que le ref soit disponible
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (videoRef.current) {
        console.log("[Camera] Attaching stream to video element");
        videoRef.current.srcObject = stream;

        // Force la lecture
        videoRef.current.play().catch((err) => {
          console.error("[Camera] Error playing video:", err);
        });

        // Attend que la vidéo soit prête
        videoRef.current.onloadedmetadata = () => {
          console.log("[Camera] Video metadata loaded");
          console.log(
            "[Camera] Video dimensions:",
            videoRef.current?.videoWidth,
            "x",
            videoRef.current?.videoHeight
          );
          setIsLoading(false);
        };

        // Fallback : si onloadedmetadata ne se déclenche pas
        videoRef.current.oncanplay = () => {
          console.log("[Camera] Video can play");
          setIsLoading(false);
        };
      } else {
        console.error("[Camera] videoRef.current is null!");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Erreur d'accès à la caméra:", err);
      setIsLoading(false);

      // Messages d'erreur spécifiques selon le type d'erreur
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setCameraError(
          "Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur."
        );
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        setCameraError("Aucune caméra trouvée sur cet appareil.");
      } else if (
        err.name === "NotReadableError" ||
        err.name === "TrackStartError"
      ) {
        setCameraError(
          "La caméra est déjà utilisée par une autre application."
        );
      } else {
        setCameraError("Impossible d'accéder à la caméra. Veuillez réessayer.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  /**
   * Calcule les dimensions de crop selon le ratio d'aspect
   * Retourne les coordonnées source (sx, sy, sw, sh) et les dimensions destination (dw, dh)
   */
  const calculateCropDimensions = (
    videoWidth: number,
    videoHeight: number,
    ratio: "9:16" | AspectRatio
  ): {
    sx: number;
    sy: number;
    sw: number;
    sh: number;
    dw: number;
    dh: number;
  } => {
    // Parse le ratio (ex: "9:16" -> [9, 16])
    const [ratioW, ratioH] = ratio.split(":").map(Number);
    const targetRatio = ratioW / ratioH;

    // Ratio de la vidéo source
    const sourceRatio = videoWidth / videoHeight;

    let sx = 0;
    let sy = 0;
    let sw = videoWidth;
    let sh = videoHeight;
    let dw: number;
    let dh: number;

    if (sourceRatio > targetRatio) {
      // La vidéo est plus large que le ratio cible → crop horizontal (couper les côtés)
      sh = videoHeight;
      sw = videoHeight * targetRatio;
      sx = (videoWidth - sw) / 2; // Centre horizontalement
      sy = 0;
    } else {
      // La vidéo est plus haute que le ratio cible → crop vertical (couper le haut/bas)
      sw = videoWidth;
      sh = videoWidth / targetRatio;
      sx = 0;
      sy = (videoHeight - sh) / 2; // Centre verticalement
    }

    // Dimensions de destination (haute qualité)
    const maxDimension = 1920; // Résolution maximale
    if (ratioW > ratioH) {
      // Paysage
      dw = maxDimension;
      dh = maxDimension / targetRatio;
    } else {
      // Portrait ou carré
      dh = maxDimension;
      dw = maxDimension * targetRatio;
    }

    return { sx, sy, sw, sh, dw, dh };
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const videoWidth = videoRef.current.videoWidth || 1280;
    const videoHeight = videoRef.current.videoHeight || 720;

    // Utilise le ratio effectif (9:16 pour STORY, aspectRatio pour POST)
    const { sx, sy, sw, sh, dw, dh } = calculateCropDimensions(
      videoWidth,
      videoHeight,
      effectiveRatio
    );

    // Crée le canvas avec les dimensions exactes du ratio
    const canvas = document.createElement("canvas");
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Applique le filtre si sélectionné
    if (selectedFilter.style?.filter) {
      ctx.filter = selectedFilter.style.filter;
    }

    // Dessine uniquement la zone cropée (center crop)
    ctx.drawImage(
      videoRef.current,
      sx,
      sy,
      sw,
      sh, // Source: zone à extraire de la vidéo
      0,
      0,
      dw,
      dh // Destination: dimensions du canvas
    );

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedMedia({ type: "photo", url: dataUrl });
    setMode("preview");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith("video") ? "video" : "photo";
      setCapturedMedia({ type, url, file });
      setMode("preview");
    }
  };

  /**
   * Gère la publication d'un post ou story
   * Sauvegarde le média dans IndexedDB au lieu de Base64
   * @param type - Type de publication : 'story' ou 'post'
   */
  const handlePost = async (type: "story" | "post") => {
    if (!capturedMedia) return;
    setIsSaving(true);

    try {
      let fileUrl: string;

      // Convertit le média en File si nécessaire
      let fileToSave: File;

      if (capturedMedia.file) {
        // Si on a déjà un File, l'utilise directement
        fileToSave = capturedMedia.file;
      } else if (capturedMedia.url.startsWith("data:")) {
        // Convertit le data URL en Blob puis en File
        const blob = await (await fetch(capturedMedia.url)).blob();
        const fileExtension = capturedMedia.type === "video" ? "mp4" : "jpg";
        const mimeType =
          capturedMedia.type === "video" ? "video/mp4" : "image/jpeg";
        fileToSave = new File([blob], `capture.${fileExtension}`, {
          type: mimeType,
        });
      } else {
        // Si c'est déjà une URL blob, la convertit en File
        const blob = await (await fetch(capturedMedia.url)).blob();
        const fileExtension = capturedMedia.type === "video" ? "mp4" : "jpg";
        const mimeType =
          capturedMedia.type === "video" ? "video/mp4" : "image/jpeg";
        fileToSave = new File([blob], `capture.${fileExtension}`, {
          type: mimeType,
        });
      }

      // Sauvegarde le fichier dans IndexedDB via vibeClient
      // Cela retourne une URL au format indexeddb://fileId
      const uploadResult = await vibe.integrations.Core.UploadFile({
        file: fileToSave,
      });
      fileUrl = uploadResult.file_url;

      // Récupère l'utilisateur actuel
      const user = await vibe.auth.me();

      if (type === "story") {
        // Crée une story
        await vibe.entities.Story.create({
          media_url: fileUrl,
          media_type: capturedMedia.type,
          author_name: user.full_name || user.email,
          author_avatar: user.avatar_url,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
        queryClient.invalidateQueries({ queryKey: ["stories"] });
      } else {
        // Crée un MediaPost conforme à l'interface TypeScript
        await vibe.entities.Post.create({
          type: "media",
          media_url: fileUrl, // ID IndexedDB au format indexeddb://fileId
          media_type: capturedMedia.type === "video" ? "video" : "photo",
          author_name:
            user.full_name || user.email?.split("@")[0] || "Utilisateur",
          author_avatar: user.avatar_url,
          created_by: user.email,
          likes_count: 0,
          comments_count: 0,
          created_date: new Date().toISOString(),
          filter: selectedFilter.id,
        });
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }

      // Réinitialise et redirige vers le Feed
      setCapturedMedia(null);
      setMode("capture");

      // Redirige vers le Feed après publication
      if (typeof window !== "undefined") {
        window.location.href = "/feed";
      }
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Erreur lors de la publication. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetCapture = () => {
    setCapturedMedia(null);
    setMode("capture");
    setSelectedFilter(FILTERS[0]);
  };

  /**
   * Ne rend rien avant que le composant soit monté côté client
   * Évite les problèmes d'hydratation
   */
  if (!isMounted) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  /**
   * Affiche l'écran de chargement pendant l'initialisation de la caméra
   */
  if (isLoading) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-sm">Chargement de la caméra...</p>
        </div>
      </div>
    );
  }

  /**
   * Affiche l'écran d'erreur si la caméra ne peut pas être accédée
   */
  if (cameraError) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-white text-lg font-semibold mb-2">
            Erreur de caméra
          </h2>
          <p className="text-white/70 text-sm mb-6">{cameraError}</p>
          <div className="flex gap-3 justify-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCameraError(null);
                startCamera();
              }}
              className="px-6 py-3 bg-white text-black rounded-xl font-semibold text-sm"
            >
              Réessayer
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/feed";
                }
              }}
              className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold text-sm"
            >
              Retour
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden bg-black"
      style={{
        // Permet le swipe en mode capture, bloque en mode preview
        touchAction: mode === "capture" ? "pan-x" : "none",
      }}
    >
      {/* Camera preview - TOUJOURS rendu, même si le stream n'est pas encore là */}
      <div className="absolute inset-0 bg-black z-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          style={selectedFilter.style}
        />

        {/* Aspect Ratio Overlay - Masque visuel pour montrer la zone de crop */}
        {/* Ne s'affiche que si captureMode === 'POST' */}
        <AspectRatioOverlay ratio={aspectRatio} show={captureMode === "POST"} />

        {/* Grid overlay */}
        {gridOn && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/20" />
              ))}
            </div>
          </div>
        )}
      </div>

      {mode === "capture" ? (
        <>
          {/* Bouton Profil/Story - Haut Gauche */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (typeof window !== "undefined") {
                if (hasActiveStory && currentUser?.email) {
                  // Redirige vers le feed avec les paramètres pour ouvrir la story
                  window.location.href = `/feed?view_story=true&user_email=${encodeURIComponent(
                    currentUser.email
                  )}`;
                } else {
                  window.location.href = "/profile";
                }
              }
            }}
            className="absolute top-6 left-4 z-20"
          >
            <div
              className={`relative ${
                hasActiveStory
                  ? "p-[3px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600"
                  : ""
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full overflow-hidden ${
                  hasActiveStory ? "bg-white p-[2px]" : ""
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
                  {currentUser?.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name || "Profile"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500 font-semibold text-lg">
                      {currentUser?.full_name?.charAt(0)?.toUpperCase() ||
                        currentUser?.email?.charAt(0)?.toUpperCase() ||
                        "V"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.button>

          {/* Barre d'outils verticale - Haut Droite */}
          <div className="absolute top-6 right-4 flex flex-col gap-6 z-20">
            {/* Flash */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setFlashOn(!flashOn)}
              className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center"
            >
              {flashOn ? (
                <Zap className="w-6 h-6 text-white drop-shadow-md" />
              ) : (
                <ZapOff className="w-6 h-6 text-white drop-shadow-md" />
              )}
            </motion.button>

            {/* Grille */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setGridOn(!gridOn)}
              className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center ${
                gridOn ? "bg-white/20" : "bg-black/20"
              }`}
            >
              <Grid3X3
                className={`w-6 h-6 drop-shadow-md ${
                  gridOn ? "text-white" : "text-white"
                }`}
              />
            </motion.button>

            {/* Minuteur */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setTimerOn(!timerOn)}
              className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center ${
                timerOn ? "bg-white/20" : "bg-black/20"
              }`}
            >
              <Timer
                className={`w-6 h-6 drop-shadow-md ${
                  timerOn ? "text-white" : "text-white"
                }`}
              />
            </motion.button>
          </div>

          {/* Sélecteur de ratio d'aspect - Visible uniquement si POST */}
          <AspectRatioSelector
            currentRatio={aspectRatio}
            onRatioChange={setAspectRatio}
            visible={captureMode === "POST"}
          />

          {/* Déclencheur (Shutter) - Centré au-dessus de la barre de navigation */}
          <div className="absolute inset-x-0 bottom-32 z-30 flex justify-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onPointerDown={capturePhoto}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-red-500 scale-110"
                  : "bg-white/20 backdrop-blur-sm"
              }`}
            >
              <div
                className={`rounded-full transition-all ${
                  isRecording
                    ? "w-8 h-8 bg-red-600 rounded-lg"
                    : "w-16 h-16 bg-white"
                }`}
              />
            </motion.button>
          </div>

          {/* Barre de navigation en bas (Galerie | Mode | Rotation) */}
          <div className="absolute bottom-8 left-0 right-0 z-30 px-4">
            <div className="flex items-center justify-between">
              {/* Gauche : Bouton Galerie */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-xl overflow-hidden bg-gray-800 border-2 border-white/30 flex items-center justify-center"
              >
                <Image className="w-5 h-5 text-white/70" />
              </motion.button>

              {/* Centre : Sélecteur de mode */}
              <ModeSelector
                currentMode={captureMode}
                onModeChange={setCaptureMode}
              />

              {/* Droite : Bouton Rotation Caméra */}
              <motion.button
                whileTap={{ scale: 0.9, rotate: 180 }}
                onClick={() =>
                  setFacingMode((f) => (f === "user" ? "environment" : "user"))
                }
                className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center"
              >
                <RotateCcw className="w-6 h-6 text-white drop-shadow-md" />
              </motion.button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
      ) : (
        <>
          {/* Preview mode */}
          <div className="absolute inset-0" style={selectedFilter.style}>
            {capturedMedia?.type === "video" ? (
              <video
                src={capturedMedia.url}
                className="w-full h-full object-contain"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={capturedMedia?.url}
                alt=""
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Bouton de retour (X) en haut à gauche */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={resetCapture}
            className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <X className="w-6 h-6 text-white" />
          </motion.button>

          {/* Outils d'édition en haut à droite */}
          <div className="absolute top-4 right-4 z-50 flex gap-3">
            <button className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Type className="w-5 h-5 text-white" />
            </button>
            <button className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Pencil className="w-5 h-5 text-white" />
            </button>
            <button className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Sticker className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Filter carousel */}
          <div className="absolute bottom-24 inset-x-0">
            <FilterCarousel
              selectedFilter={selectedFilter}
              onSelectFilter={setSelectedFilter}
              previewImage={capturedMedia?.url}
            />
          </div>

          {/* Action buttons */}
          <div className="absolute bottom-20 inset-x-0 pb-safe">
            <div className="flex items-center justify-center gap-4 px-6 py-6">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  handlePost(captureMode === "STORY" ? "story" : "post")
                }
                disabled={isSaving}
                className="flex-1 py-4 bg-white rounded-2xl text-gray-900 font-semibold text-sm disabled:opacity-50"
              >
                {isSaving ? "Publication..." : "Publier"}
              </motion.button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

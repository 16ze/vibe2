"use client";

import FilterCarousel, { FILTERS } from "@/components/camera/FilterCarousel";
import UserSelectorModal from "@/components/chat/UserSelectorModal";
import { useAuth } from "@/contexts/AuthContext";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { uploadMedia } from "@/services/mediaService";
import { createPost, createStory, getActiveStories } from "@/services/postService";
import { getOrCreateConversation, sendMessage } from "@/services/chatService";
import {
  Download,
  Grid3X3,
  Image,
  Pencil,
  RotateCcw,
  Send,
  Sparkles,
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
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [hasActiveStory, setHasActiveStory] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Par défaut, la vidéo est muette
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(
    null
  );
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // État pour afficher/masquer les filtres
  const [isCoolingDown, setIsCoolingDown] = useState(false); // Cooldown après fermeture de preview

  // Refs pour l'enregistrement vidéo
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const selectedMimeTypeRef = useRef<string>(""); // Stocke le MIME type sélectionné

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
   * Navigation par swipe : Vibes <- Camera -> Conversations
   * Désactivé en mode preview, pendant l'enregistrement, ou quand le modal est ouvert
   */
  const isSwipeDisabled =
    mode !== "capture" || isRecording || isSendModalOpen || isSaving;
  useSwipeNavigation({
    onSwipeRight: "/vibes",
    onSwipeLeft: "/conversations",
    disabled: isSwipeDisabled,
  });

  /**
   * Vérifie si l'utilisateur a une story active (non expirée)
   */
  useEffect(() => {
    const checkActiveStory = async () => {
      try {
        if (currentUser?.id) {
          const stories = await getActiveStories(50);
          const userStories = stories.filter(
            (story: any) => story.user_id === currentUser.id
          );
          setHasActiveStory(userStories.length > 0);
        }
      } catch (err) {
        console.error("Error checking active story:", err);
      }
    };
    if (currentUser?.id) {
      checkActiveStory();
    }
  }, [currentUser]);

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
    return () => {
      stopCamera();
      // Nettoie l'enregistrement si en cours
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      // Nettoie le timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      // Nettoie les URLs blob créées
      if (capturedMedia?.url && capturedMedia.url.startsWith("blob:")) {
        URL.revokeObjectURL(capturedMedia.url);
      }
    };
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

      // Demande l'accès à la caméra avec contraintes optimisées pour mobile
      console.log(
        "[Camera] Requesting camera access with facingMode:",
        facingMode
      );
      
      // Contraintes vidéo optimisées pour mobile
      const videoConstraints: MediaTrackConstraints = {
        facingMode: facingMode === "user" ? "user" : "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true,
      });

      console.log("[Camera] Stream received:", stream);
      console.log("[Camera] Stream active:", stream.active);
      console.log(
        "[Camera] Stream tracks:",
        stream.getTracks().map((t) => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState,
        }))
      );
      streamRef.current = stream;

      // Attendre un peu pour que le ref soit disponible
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (videoRef.current) {
        console.log("[Camera] Attaching stream to video element");
        console.log("[Camera] videoRef.current exists:", !!videoRef.current);
        
        // S'assure que la vidéo est muette pour l'autoplay sur mobile
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;
        
        videoRef.current.srcObject = stream;
        console.log(
          "[Camera] srcObject assigned:",
          !!videoRef.current.srcObject
        );

        // Force la lecture immédiatement
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("[Camera] Video playing successfully");
              setIsLoading(false);
            })
            .catch((err) => {
              console.error("[Camera] Error playing video:", err);
              // Réessaye après un court délai
              setTimeout(() => {
                videoRef.current?.play().catch((e) => {
                  console.error("[Camera] Retry play failed:", e);
                  setIsLoading(false);
                });
              }, 500);
            });
        }

        // Attend que la vidéo soit prête
        videoRef.current.onloadedmetadata = () => {
          console.log("[Camera] Video metadata loaded");
          console.log(
            "[Camera] Video dimensions:",
            videoRef.current?.videoWidth,
            "x",
            videoRef.current?.videoHeight
          );
          // Force le play si pas déjà en cours
          if (videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch((err) => {
              console.error("[Camera] Error playing after metadata:", err);
            });
          }
          setIsLoading(false);
        };

        // Fallback : si onloadedmetadata ne se déclenche pas
        videoRef.current.oncanplay = () => {
          console.log("[Camera] Video can play");
          if (videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch((err) => {
              console.error("[Camera] Error playing after canplay:", err);
            });
          }
          setIsLoading(false);
        };

        // Gestion d'erreur du stream
        stream.getVideoTracks().forEach((track) => {
          track.addEventListener("ended", () => {
            console.log("[Camera] Video track ended");
            setIsLoading(false);
          });
          // Vérifie l'état du track
          if (track.readyState === "ended") {
            console.log("[Camera] Video track already ended");
            setIsLoading(false);
          }
        });
      } else {
        console.error("[Camera] videoRef.current is null!");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("[Camera] Erreur d'accès à la caméra:", err);
      setIsLoading(false);

      // Messages d'erreur spécifiques selon le type d'erreur
      // IMPORTANT MOBILE : Messages clairs pour guider l'utilisateur
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setCameraError(
          "Veuillez autoriser la caméra dans vos réglages. Allez dans les paramètres de votre navigateur et activez l'accès à la caméra pour ce site."
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
          "La caméra est déjà utilisée par une autre application. Fermez les autres applications qui utilisent la caméra et réessayez."
        );
      } else if (err.name === "OverconstrainedError") {
        setCameraError(
          "Les paramètres de la caméra ne sont pas supportés par votre appareil. Veuillez réessayer."
        );
      } else {
        setCameraError(
          "Impossible d'accéder à la caméra. Veuillez vérifier vos paramètres et réessayer."
        );
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

  /**
   * Démarre l'enregistrement vidéo avec MediaRecorder
   * CORRECTION BUG #2 : Détection correcte du type MIME (mp4 ou webm)
   */
  const startRecording = async () => {
    if (!streamRef.current || !videoRef.current || isCoolingDown) return;

    try {
      // Nettoie les chunks précédents
      recordedChunksRef.current = [];

      // CORRECTION BUG #2 : Détecte le type supporté (mp4 prioritaire, puis webm)
      const mimeType = MediaRecorder.isTypeSupported("video/mp4")
        ? "video/mp4"
        : "video/webm";

      selectedMimeTypeRef.current = mimeType;

      console.log(
        "[Camera] Starting recording with MIME type:",
        mimeType
      );

      // Crée le MediaRecorder avec le stream
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps pour une bonne qualité
      });

      mediaRecorderRef.current = mediaRecorder;

      // Écoute les données enregistrées
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // Gère la fin de l'enregistrement
      mediaRecorder.onstop = () => {
        console.log(
          "[Camera] Recording stopped, chunks:",
          recordedChunksRef.current.length
        );

        // CORRECTION BUG #2 : Utilise le MIME type stocké dans la ref
        const finalMimeType = selectedMimeTypeRef.current || mimeType;

        console.log("[Camera] Creating video Blob with MIME type:", finalMimeType);

        // CORRECTION CRITIQUE : Crée le Blob final avec le bon type MIME
        // Le type doit être 'video/mp4' ou 'video/webm' pour être lisible
        const blob = new Blob(recordedChunksRef.current, {
          type: finalMimeType,
        });

        console.log("[Camera] Blob created:", {
          size: blob.size,
          type: blob.type,
          expectedType: finalMimeType,
        });

        // Crée l'URL pour la preview
        const videoUrl = URL.createObjectURL(blob);

        // Crée un File pour la sauvegarde avec le bon type MIME
        const fileExtension = finalMimeType.includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `recording.${fileExtension}`, {
          type: finalMimeType,
        });

        console.log("[Camera] File created for upload:", {
          name: file.name,
          size: file.size,
          type: file.type,
          extension: fileExtension,
        });

        // RÈGLE ABSOLUE : Ne jamais sauvegarder directement, toujours passer en mode preview
        setCapturedMedia({
          type: "video",
          url: videoUrl,
          file: file,
        });
        setMode("preview");
        setIsRecording(false);
        setRecordingStartTime(null);
        console.log("[Camera] Video recorded, switching to preview mode");
      };

      // Gère les erreurs
      mediaRecorder.onerror = (event) => {
        console.error("[Camera] MediaRecorder error:", event);
        setIsRecording(false);
        setRecordingStartTime(null);
      };

      // Démarre l'enregistrement
      mediaRecorder.start(100); // Collecte les données toutes les 100ms
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      console.log("[Camera] Recording started");
    } catch (error) {
      console.error("[Camera] Error starting recording:", error);
      setIsRecording(false);
      setRecordingStartTime(null);
    }
  };

  /**
   * Arrête l'enregistrement vidéo
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log("[Camera] Stopping recording...");
      mediaRecorderRef.current.stop();
      // Le reste est géré par onstop
    }
  };

  /**
   * Capture une photo depuis le stream vidéo
   */
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
    // RÈGLE ABSOLUE : Ne jamais sauvegarder directement, toujours passer en mode preview
    setCapturedMedia({ type: "photo", url: dataUrl });
    setMode("preview");
    console.log("[Camera] Photo captured, switching to preview mode");
  };

  /**
   * Gère le début de l'interaction avec le bouton déclencheur
   * Détecte si c'est un long press (vidéo) ou un clic court (photo)
   * CORRECTION BUG #1 : Vérifie le cooldown avant de démarrer
   */
  const handleShutterDown = () => {
    // CORRECTION BUG #1 : Ne rien faire si on est en cooldown
    if (isCoolingDown) {
      return;
    }

    // Annule le timer précédent s'il existe
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // Démarre un timer pour détecter le long press (200ms)
    longPressTimerRef.current = setTimeout(() => {
      // Long press détecté → démarre l'enregistrement vidéo
      startRecording();
    }, 200);
  };

  /**
   * Gère la fin de l'interaction avec le bouton déclencheur
   * CORRECTION BUG #1 : Vérifie le cooldown avant de capturer
   */
  const handleShutterUp = () => {
    // CORRECTION BUG #1 : Ne rien faire si on est en cooldown
    if (isCoolingDown) {
      return;
    }

    // Annule le timer du long press
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isRecording) {
      // Si on était en train d'enregistrer, arrête l'enregistrement
      stopRecording();
    } else {
      // Sinon, c'était un clic court → prend une photo
      capturePhoto();
    }
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
  /**
   * Gère la publication selon le mode (STORY, POST, VIBES)
   * Upload le média vers Supabase Storage et crée l'entité appropriée
   */
  const handlePost = async () => {
    if (!capturedMedia || !currentUser?.id) {
      alert("Vous devez être connecté pour publier.");
      return;
    }
    setIsSaving(true);

    try {
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

      // Upload le fichier vers Supabase Storage
      console.log("[Camera] Uploading file to Supabase Storage...");
      const bucket = captureMode === "STORY" ? "stories" : "posts";
      const mediaUrl = await uploadMedia(fileToSave, bucket, currentUser.id);
      console.log("[Camera] File uploaded, media_url:", mediaUrl);

      // Détermine le type de média pour Supabase (image ou video)
      const mediaType: "image" | "video" = capturedMedia.type.includes("video")
        ? "video"
        : "image";

      if (captureMode === "STORY") {
        // Crée une Story (expire dans 24h)
        await createStory(currentUser.id, mediaUrl, mediaType);
        queryClient.invalidateQueries({ queryKey: ["feed-stories"] });
        queryClient.invalidateQueries({ queryKey: ["stories"] });

        // Redirige vers le Feed
        router.push("/feed");
      } else if (captureMode === "VIBES") {
        // Mode VIBES : force le type vidéo et crée un Post
        if (capturedMedia.type !== "video") {
          alert("Le mode Vibes ne supporte que les vidéos.");
          setIsSaving(false);
          return;
        }

        await createPost(currentUser.id, mediaUrl, "video");
        queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
        queryClient.invalidateQueries({ queryKey: ["posts"] });

        // Redirige vers /vibes
        router.push("/vibes");
      } else {
        // Mode POST : crée un Post avec le type correct (image ou video)
        console.log(
          "[Camera] Creating POST with type:",
          mediaType,
          "media_url:",
          mediaUrl
        );
        await createPost(currentUser.id, mediaUrl, mediaType);
        queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
        queryClient.invalidateQueries({ queryKey: ["posts"] });

        // Redirige vers le Feed
        router.push("/feed");
      }

      // Réinitialise après publication
      setCapturedMedia(null);
      setMode("capture");
    } catch (err) {
      console.error("[Camera] Failed to publish:", err);
      alert("Erreur lors de la publication. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Gère l'envoi du média à un ami (style Snapchat)
   */
  const handleSendToFriend = async (selectedUser: any) => {
    if (!capturedMedia || !currentUser?.id) {
      alert("Vous devez être connecté pour envoyer un média.");
      return;
    }

    try {
      setIsSaving(true);

      // Convertit le média en File
      let fileToSave: File;
      if (capturedMedia.file) {
        fileToSave = capturedMedia.file;
      } else if (capturedMedia.url.startsWith("data:")) {
        const blob = await (await fetch(capturedMedia.url)).blob();
        const fileExtension = capturedMedia.type === "video" ? "mp4" : "jpg";
        const mimeType =
          capturedMedia.type === "video" ? "video/mp4" : "image/jpeg";
        fileToSave = new File([blob], `capture.${fileExtension}`, {
          type: mimeType,
        });
      } else {
        const blob = await (await fetch(capturedMedia.url)).blob();
        const fileExtension = capturedMedia.type === "video" ? "mp4" : "jpg";
        const mimeType =
          capturedMedia.type === "video" ? "video/mp4" : "image/jpeg";
        fileToSave = new File([blob], `capture.${fileExtension}`, {
          type: mimeType,
        });
      }

      // Upload le fichier vers Supabase Storage
      const mediaUrl = await uploadMedia(
        fileToSave,
        "messages",
        currentUser.id
      );

      // Trouve ou crée la conversation avec l'utilisateur sélectionné
      const conversationId = await getOrCreateConversation(
        currentUser.id,
        selectedUser.id
      );

      // Détermine le type de message
      const messageType: "text" | "image" | "video" =
        capturedMedia.type === "video" ? "video" : "image";

      // Envoie le message avec le média
      await sendMessage(
        conversationId,
        currentUser.id,
        undefined, // Pas de contenu texte
        mediaUrl,
        messageType
      );

      // Affiche un toast
      alert("Envoyé !");

      // Ferme la modale et retourne à la caméra
      setIsSendModalOpen(false);
      resetCapture();

      // Invalide le cache des conversations
      queryClient.invalidateQueries({
        queryKey: ["conversations", currentUser.id],
      });
    } catch (err) {
      console.error("[Camera] Failed to send media:", err);
      alert("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Réinitialise la capture et nettoie les ressources
   * CORRECTION BUG #1 : Empêche la capture involontaire après fermeture
   */
  const resetCapture = (e?: React.MouseEvent) => {
    // Stop propagation pour éviter que l'événement traverse
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Active le cooldown pour empêcher les captures involontaires
    setIsCoolingDown(true);
    setTimeout(() => {
      setIsCoolingDown(false);
    }, 500);

    // Arrête l'enregistrement si en cours
    if (isRecording && mediaRecorderRef.current) {
      stopRecording();
    }

    // Nettoie le timer du long press
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Nettoie les chunks enregistrés
    recordedChunksRef.current = [];
    mediaRecorderRef.current = null;

    // Réinitialise les états
    setCapturedMedia(null);
    setMode("capture");
    setSelectedFilter(FILTERS[0]);
    setIsRecording(false);
    setRecordingStartTime(null);
    setIsMuted(true); // Réinitialise le son à muet
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
      {/* 
        STRUCTURE CORRIGÉE :
        - La vidéo est en absolute inset-0 z-0 pour couvrir tout l'écran
        - Tous les contrôles sont dans un conteneur relative z-10 par-dessus
      */}

      {/* Camera preview - Vidéo en absolute pour couvrir tout l'écran */}
      {/* IMPORTANT MOBILE : h-[100dvh] au lieu de h-full pour Dynamic Viewport Height */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-[100dvh] w-full object-cover z-0"
        style={selectedFilter.style}
        onLoadedMetadata={() => {
          console.log("[Camera] Video metadata loaded in JSX");
          if (videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch(console.error);
          }
        }}
        onCanPlay={() => {
          console.log("[Camera] Video can play in JSX");
          if (videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch(console.error);
          }
        }}
      />

      {/* Conteneur pour tous les contrôles et overlays - z-10 pour être au-dessus de la vidéo */}
      {/* IMPORTANT MOBILE : h-[100dvh] au lieu de h-full pour Dynamic Viewport Height */}
      <div className="relative z-10 h-[100dvh] w-full pointer-events-none">
        {/* Aspect Ratio Overlay - Masque visuel pour montrer la zone de crop */}
        {/* Ne s'affiche que si captureMode === 'POST' */}
        <AspectRatioOverlay ratio={aspectRatio} show={captureMode === "POST"} />

        {/* Grid overlay */}
        {gridOn && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/20" />
              ))}
            </div>
          </div>
        )}

        {/* Tous les contrôles interactifs - pointer-events-auto pour être cliquables */}
        <div className="absolute inset-0 pointer-events-auto">
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

                {/* Bouton Filtres */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowFilters(!showFilters)}
                  className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center ${
                    showFilters ? "bg-yellow-500/30" : "bg-black/20"
                  }`}
                >
                  <Sparkles
                    className={`w-6 h-6 drop-shadow-md ${
                      showFilters ? "text-yellow-300" : "text-white"
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

              {/* 
            EMPILEMENT VERTICAL DES CONTRÔLES (du bas vers le haut) :
            - Couche 1 (bottom-8)  : Barre de navigation (Galerie | Mode | Rotation)
            - Couche 2 (bottom-24) : Déclencheur (Shutter Button) - z-50 pour être au-dessus
            - Couche 3 (bottom-48) : Carrousel de filtres
          */}

              {/* Couche 3 : Filter carousel - Juste au-dessus du bouton déclencheur, visible uniquement si showFilters === true */}
              {mode === "capture" && showFilters && (
                <div className="absolute bottom-32 inset-x-0 z-30">
                  <FilterCarousel
                    selectedFilter={selectedFilter}
                    onSelectFilter={setSelectedFilter}
                    previewImage={undefined}
                  />
                </div>
              )}

              {/* Couche 2 : Déclencheur (Shutter) - Centré, au-dessus de la barre de navigation */}
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50">
                <motion.button
                  onPointerDown={handleShutterDown}
                  onPointerUp={handleShutterUp}
                  onPointerCancel={handleShutterUp}
                  onTouchStart={handleShutterDown}
                  onTouchEnd={handleShutterUp}
                  onTouchCancel={handleShutterUp}
                  onMouseDown={handleShutterDown}
                  onMouseUp={handleShutterUp}
                  onMouseLeave={handleShutterUp}
                  className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-200 ${
                    isRecording
                      ? "border-red-500 bg-red-500 scale-110"
                      : "border-white bg-white/20 backdrop-blur-sm"
                  }`}
                >
                  <div
                    className={`rounded-full transition-all duration-200 ${
                      isRecording
                        ? "w-8 h-8 bg-red-600 rounded-lg"
                        : "w-16 h-16 bg-white"
                    }`}
                  />
                  {/* Barre de progression circulaire pendant l'enregistrement */}
                  {isRecording && recordingStartTime && (
                    <svg
                      className="absolute inset-0 w-20 h-20 -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="4"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="white"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                          duration: 60, // 60 secondes max
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    </svg>
                  )}
                </motion.button>
              </div>

              {/* Couche 1 : Barre de navigation en bas (Galerie | Mode | Rotation) */}
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
                      setFacingMode((f) =>
                        f === "user" ? "environment" : "user"
                      )
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
                    muted={isMuted}
                    playsInline
                    controls={false}
                  />
                ) : (
                  <img
                    src={capturedMedia?.url}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Bouton de contrôle du son (uniquement pour les vidéos) */}
              {capturedMedia?.type === "video" && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute bottom-32 right-4 z-50 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
                >
                  {isMuted ? (
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M7 10l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                  )}
                </motion.button>
              )}

              {/* Bouton de retour (X) en haut à gauche */}
              {/* CORRECTION BUG #1 : stopPropagation pour éviter la capture involontaire */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => resetCapture(e)}
                className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
              >
                <X className="w-6 h-6 text-white" />
              </motion.button>

              {/* Outils d'édition en haut à droite - Fond sombre translucide pour meilleure visibilité */}
              <div className="absolute top-4 right-4 z-50 flex gap-3">
                <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Type className="w-5 h-5 text-white" />
                </button>
                <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-white" />
                </button>
                <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Sticker className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Barre d'actions refondue - 3 boutons alignés */}
              <div className="absolute bottom-6 left-4 right-4 z-50 flex items-center justify-between pb-safe">
                {/* Gauche : Bouton Enregistrer */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={async () => {
                    if (!capturedMedia) return;
                    try {
                      // Crée un lien de téléchargement
                      const link = document.createElement("a");
                      link.href = capturedMedia.url;
                      link.download = `vibe-${Date.now()}.${
                        capturedMedia.type === "video" ? "mp4" : "jpg"
                      }`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (err) {
                      console.error("Error downloading media:", err);
                      alert("Erreur lors du téléchargement");
                    }
                  }}
                  className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
                >
                  <Download className="w-6 h-6 text-white" />
                </motion.button>

                {/* Centre : Bouton principal de publication */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePost}
                  disabled={isSaving}
                  className="flex-1 mx-4 py-4 bg-white rounded-full text-gray-900 font-bold text-sm disabled:opacity-50"
                >
                  {isSaving
                    ? "Publication..."
                    : captureMode === "STORY"
                    ? "Ma Story"
                    : "Publier"}
                </motion.button>

                {/* Droite : Bouton "Envoyer à..." */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSendModalOpen(true)}
                  disabled={isSaving}
                  className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              {/* Modale de sélection d'utilisateur pour "Envoyer à..." */}
              {currentUser && (
                <UserSelectorModal
                  isOpen={isSendModalOpen}
                  onClose={() => setIsSendModalOpen(false)}
                  onSelectUser={handleSendToFriend}
                  currentUser={currentUser}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

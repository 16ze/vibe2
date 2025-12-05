import { motion } from "framer-motion";
import { Image } from "lucide-react";

interface CameraControlsProps {
  onCapture: () => void;
  onOpenGallery: () => void;
  isRecording: boolean;
  lastPhoto?: string | null;
}

/**
 * Contrôles de base de la caméra
 * Contient uniquement le déclencheur et le bouton galerie
 * Les autres contrôles sont dans la barre verticale en haut à droite
 */
export default function CameraControls({
  onCapture,
  onOpenGallery,
  isRecording,
  lastPhoto,
}: CameraControlsProps) {
  return (
    <div className="absolute inset-x-0 bottom-0">
      <div className="flex items-center justify-center gap-8 px-6 py-8">
        {/* Gallery thumbnail - Bas gauche */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onOpenGallery}
          className="w-12 h-12 rounded-xl overflow-hidden bg-gray-800 border-2 border-white/30"
        >
          {lastPhoto ? (
            <img
              src={lastPhoto}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="w-5 h-5 text-white/70" />
            </div>
          )}
        </motion.button>

        {/* Capture button - Centre */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onPointerDown={onCapture}
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

        {/* Espaceur pour aligner avec la galerie */}
        <div className="w-12 h-12" />
      </div>
    </div>
  );
}

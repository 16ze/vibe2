"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, MapPin } from "lucide-react";

/**
 * Page de localisation (Snap Map)
 * Affiche une carte avec les utilisateurs proches
 */
export default function Map() {
  const router = useRouter();

  return (
    <div className="h-[100dvh] bg-white flex flex-col overflow-hidden pb-20 pb-safe">
      {/* Header */}
      <header className="flex-shrink-0 sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </motion.button>

          <h1 className="text-xl font-bold text-gray-900">Carte</h1>

          <div className="w-10" /> {/* Espaceur pour centrer le titre */}
        </div>
      </header>

      {/* Map content */}
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Carte en développement
          </h2>
          <p className="text-gray-500 text-sm">
            La fonctionnalité de localisation sera bientôt disponible
          </p>
        </div>
      </div>
    </div>
  );
}


import { motion } from "framer-motion";
import { Camera, Home, MessageCircle, Play } from "lucide-react";

/**
 * Interface pour les props du composant BottomNav
 */
interface BottomNavProps {
  /**
   * Index de l'onglet actif
   */
  activeIndex: number;

  /**
   * Callback appelé lors de la navigation
   */
  onNavigate?: (index: number) => void;

  /**
   * Variante de style (light pour fond clair, dark pour fond sombre)
   */
  variant?: "light" | "dark";

  /**
   * URL de l'avatar de l'utilisateur pour l'onglet profil
   */
  userAvatar?: string;
}

/**
 * Configuration des onglets de navigation (sans le profil qui est géré séparément)
 */
const tabs = [
  { id: "feed", icon: Home },
  { id: "vibes", icon: Play },
  { id: "camera", icon: Camera },
  { id: "chat", icon: MessageCircle },
];

/**
 * Composant BottomNav - Barre de navigation inférieure
 * Affiche les onglets principaux de l'application avec icônes uniquement
 */
export default function BottomNav({
  activeIndex,
  onNavigate,
  variant = "light",
  userAvatar,
}: BottomNavProps) {
  const isDark = variant === "dark";
  const profileIndex = 4;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 w-full pb-safe z-[9999] ${
        isDark
          ? "bg-gradient-to-t from-black/95 via-black/80 to-black/60"
          : "bg-white border-t border-gray-100"
      }`}
    >
      <div className="flex items-center justify-around h-12 px-4">
        {/* Onglets avec icônes */}
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeIndex === index;

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => onNavigate?.(index)}
              className="relative flex items-center justify-center p-2"
            >
              <Icon
                className={`w-7 h-7 transition-colors ${
                  isActive
                    ? isDark
                      ? "text-white"
                      : "text-gray-900"
                    : isDark
                    ? "text-white/60"
                    : "text-gray-400"
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </motion.button>
          );
        })}

        {/* Onglet Profil avec photo */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate?.(profileIndex)}
          className="relative flex items-center justify-center p-2"
        >
          <div
            className={`w-7 h-7 rounded-full overflow-hidden transition-all ${
              activeIndex === profileIndex
                ? isDark
                  ? "ring-2 ring-white"
                  : "ring-2 ring-gray-900"
                : isDark
                ? "ring-1 ring-white/30"
                : "ring-1 ring-gray-200"
            }`}
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="Profil"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">U</span>
              </div>
            )}
          </div>
        </motion.button>
      </div>
    </nav>
  );
}

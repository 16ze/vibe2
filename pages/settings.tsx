"use client";

import { vibe } from "@/api/vibeClient";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  LogOut,
  Moon,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Clé localStorage pour les préférences de thème
 */
const THEME_STORAGE_KEY = "vibe_theme";
const USER_SETTINGS_KEY = "vibe_user_settings";

/**
 * Interface pour un item de paramètre
 */
interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  hasChevron?: boolean;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onClick?: () => void;
  danger?: boolean;
}

/**
 * Composant Item de paramètre réutilisable
 */
function SettingsItem({
  icon,
  label,
  value,
  hasChevron,
  hasSwitch,
  switchValue,
  onSwitchChange,
  onClick,
  danger,
}: SettingsItemProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 ${
        danger ? "text-red-500" : "text-gray-900 dark:text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={danger ? "text-red-500" : "text-gray-500 dark:text-gray-400"}>
          {icon}
        </span>
        <span className={`font-medium ${danger ? "text-red-500" : ""}`}>
          {label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {value && (
          <span className="text-gray-400 dark:text-gray-500 text-sm">{value}</span>
        )}

        {hasChevron && (
          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        )}

        {hasSwitch && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSwitchChange?.(!switchValue);
            }}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              switchValue ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <motion.div
              initial={false}
              animate={{ x: switchValue ? 20 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
            />
          </button>
        )}
      </div>
    </motion.button>
  );
}

/**
 * Composant Section de paramètres
 */
function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 mb-2">
        {title}
      </h3>
      <div className="bg-white dark:bg-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/**
 * Page des Paramètres de l'application
 * Design iOS Settings style avec sections groupées
 */
export default function Settings() {
  const { logout } = useAuth();
  const router = useRouter();

  /**
   * État utilisateur courant
   */
  const [currentUser, setCurrentUser] = useState<any>(null);

  /**
   * États pour les switches
   */
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [isGhostMode, setIsGhostMode] = useState(false);

  /**
   * Récupère l'utilisateur et ses préférences au montage
   */
  useEffect(() => {
    // Récupère l'utilisateur courant
    vibe.auth
      .me()
      .then((user) => {
        setCurrentUser(user);
        // Initialise les préférences depuis les settings de l'utilisateur
        if (user?.settings) {
          setIsPrivateAccount(user.settings.private || false);
          setIsGhostMode(user.settings.ghost || false);
        }
      })
      .catch(() => {});

    // Récupère le thème depuis localStorage
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      const isDark = savedTheme === "dark";
      setIsDarkMode(isDark);

      // Applique le thème au chargement
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      // Récupère aussi les settings utilisateur depuis localStorage
      const savedSettings = localStorage.getItem(USER_SETTINGS_KEY);
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setIsPrivateAccount(settings.private || false);
          setIsGhostMode(settings.ghost || false);
        } catch (e) {
          console.error("Error parsing user settings:", e);
        }
      }
    }
  }, []);

  /**
   * Gère le changement de thème (Dark Mode)
   */
  const handleDarkModeChange = (value: boolean) => {
    setIsDarkMode(value);

    if (typeof window !== "undefined") {
      if (value) {
        document.documentElement.classList.add("dark");
        localStorage.setItem(THEME_STORAGE_KEY, "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem(THEME_STORAGE_KEY, "light");
      }
    }
  };

  /**
   * Sauvegarde les préférences utilisateur dans localStorage
   */
  const saveUserSettings = (settings: { private?: boolean; ghost?: boolean }) => {
    if (typeof window !== "undefined") {
      const currentSettings = localStorage.getItem(USER_SETTINGS_KEY);
      let newSettings = { private: isPrivateAccount, ghost: isGhostMode };

      if (currentSettings) {
        try {
          newSettings = { ...JSON.parse(currentSettings), ...settings };
        } catch (e) {
          console.error("Error parsing settings:", e);
        }
      } else {
        newSettings = { ...newSettings, ...settings };
      }

      localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(newSettings));

      // Émet un événement pour notifier les autres composants
      window.dispatchEvent(new CustomEvent("user-settings-changed", { detail: newSettings }));
    }
  };

  /**
   * Gère le changement de compte privé
   */
  const handlePrivateAccountChange = (value: boolean) => {
    setIsPrivateAccount(value);
    saveUserSettings({ private: value });
  };

  /**
   * Gère le changement de mode fantôme
   */
  const handleGhostModeChange = (value: boolean) => {
    setIsGhostMode(value);
    saveUserSettings({ ghost: value });
  };

  /**
   * Gère le clic sur "Modifier le profil"
   */
  const handleEditProfile = () => {
    router.push("/profile?action=edit");
  };

  /**
   * Gère le clic sur "Notifications"
   */
  const handleNotifications = () => {
    alert("🔔 Paramètres de notifications bientôt disponibles !");
  };

  /**
   * Gère le clic sur "Langue"
   */
  const handleLanguage = () => {
    alert("🌍 Sélection de langue bientôt disponible !");
  };

  /**
   * Gère la déconnexion
   */
  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir vous déconnecter ?"
    );
    if (confirmed) {
      await logout();
      router.push("/");
    }
  };

  /**
   * Gère la suppression du compte
   */
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "⚠️ ATTENTION ⚠️\n\nÊtes-vous sûr de vouloir supprimer votre compte ?\n\nCette action est IRRÉVERSIBLE et supprimera :\n- Votre profil\n- Tous vos posts\n- Toutes vos conversations\n- Toutes vos données"
    );

    if (confirmed) {
      const doubleConfirm = window.confirm(
        "Dernière confirmation : tapez OK pour supprimer définitivement votre compte."
      );

      if (doubleConfirm && currentUser?.email) {
        try {
          // Supprime les posts de l'utilisateur
          const userPosts = await vibe.entities.Post.filter({
            created_by: currentUser.email,
          });
          for (const post of userPosts) {
            await vibe.entities.Post.delete(post.id);
          }

          // Supprime les stories de l'utilisateur
          const userStories = await vibe.entities.Story.filter({
            created_by: currentUser.email,
          });
          for (const story of userStories) {
            await vibe.entities.Story.delete(story.id);
          }

          // Supprime les conversations de l'utilisateur
          const userConversations = await vibe.entities.Conversation.filter({
            created_by: currentUser.email,
          });
          for (const conv of userConversations) {
            await vibe.entities.Conversation.delete(conv.id);
          }

          // Supprime les follows
          const userFollows = await vibe.entities.Follow.filter({
            follower_email: currentUser.email,
          });
          for (const follow of userFollows) {
            await vibe.entities.Follow.delete(follow.id);
          }

          // Nettoie le localStorage
          if (typeof window !== "undefined") {
            localStorage.removeItem(THEME_STORAGE_KEY);
            localStorage.removeItem(USER_SETTINGS_KEY);
            localStorage.removeItem("vibe_current_user");
          }

          // Déconnecte l'utilisateur
          await logout();

          // Redirige vers l'accueil
          alert("Votre compte a été supprimé avec succès.");
          router.push("/");
        } catch (error) {
          console.error("Erreur lors de la suppression du compte:", error);
          alert("Une erreur est survenue lors de la suppression du compte.");
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/profile">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
            </motion.button>
          </Link>

          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Paramètres
          </h1>

          <div className="w-10" /> {/* Spacer pour centrer le titre */}
        </div>
      </header>

      {/* Contenu */}
      <div className="p-4 pb-20">
        {/* Section COMPTE */}
        <SettingsSection title="Compte">
          <SettingsItem
            icon={<User className="w-5 h-5" />}
            label="Modifier le profil"
            hasChevron
            onClick={handleEditProfile}
          />
          <SettingsItem
            icon={<Bell className="w-5 h-5" />}
            label="Notifications"
            hasChevron
            onClick={handleNotifications}
          />
          <SettingsItem
            icon={<Globe className="w-5 h-5" />}
            label="Langue"
            value="Français"
            hasChevron
            onClick={handleLanguage}
          />
        </SettingsSection>

        {/* Section CONFIDENTIALITÉ */}
        <SettingsSection title="Confidentialité">
          <SettingsItem
            icon={
              isPrivateAccount ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )
            }
            label="Compte Privé"
            hasSwitch
            switchValue={isPrivateAccount}
            onSwitchChange={handlePrivateAccountChange}
          />
          <SettingsItem
            icon={<Shield className="w-5 h-5" />}
            label="Mode Fantôme"
            hasSwitch
            switchValue={isGhostMode}
            onSwitchChange={handleGhostModeChange}
          />
        </SettingsSection>

        {/* Section APPARENCE */}
        <SettingsSection title="Apparence">
          <SettingsItem
            icon={<Moon className="w-5 h-5" />}
            label="Mode Sombre"
            hasSwitch
            switchValue={isDarkMode}
            onSwitchChange={handleDarkModeChange}
          />
        </SettingsSection>

        {/* Section ZONE DANGER */}
        <SettingsSection title="Zone Danger">
          <SettingsItem
            icon={<LogOut className="w-5 h-5" />}
            label="Déconnexion"
            danger
            onClick={handleLogout}
          />
          <SettingsItem
            icon={<Trash2 className="w-5 h-5" />}
            label="Supprimer le compte"
            danger
            onClick={handleDeleteAccount}
          />
        </SettingsSection>

        {/* Footer avec version */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-400 dark:text-gray-500">VIBE v1.0.0</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Made with{" "}
            <span className="text-gradient-vibe font-medium">Electric Vibe</span>
          </p>
        </div>
      </div>
    </div>
  );
}

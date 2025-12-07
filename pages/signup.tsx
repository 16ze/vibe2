"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, User, ArrowRight, ChevronLeft, Camera, Shuffle } from "lucide-react";

/**
 * Page d'inscription
 * Formulaire complet avec avatar, pseudo, email et mot de passe
 */
export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Gère l'upload d'un avatar depuis le fichier
   */
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Génère un avatar aléatoire depuis pravatar.cc
   */
  const handleRandomAvatar = () => {
    const randomId = Math.floor(Math.random() * 1000);
    setAvatarUrl(`https://i.pravatar.cc/150?u=${randomId}`);
  };

  /**
   * Gère la soumission du formulaire d'inscription
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await register({
        email,
        password,
        full_name: fullName || undefined,
        username: username || undefined,
        avatar_url: avatarUrl || undefined,
      });

      // Redirige vers le feed après inscription réussie
      router.push("/feed");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header simple avec bouton Retour */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center px-4 h-14">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </motion.button>
          <h1 className="ml-4 text-lg font-semibold text-gray-900">
            Inscription
          </h1>
        </div>
      </header>

      {/* Contenu principal avec scroll */}
      <div className="p-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <h2 className="text-5xl font-black mb-3">
              <span className="text-gradient-vibe">VIBE</span>
            </h2>
            <p className="text-gray-600 text-base">
              Crée ton compte pour commencer
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar - Cercle cliquable */}
            <div className="flex flex-col items-center mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Avatar
              </label>
              <div className="relative">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 hover:border-indigo-500 transition-colors bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-400" />
                  )}
                </motion.button>
                {/* Bouton pour avatar aléatoire */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRandomAvatar}
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-lg"
                  title="Avatar aléatoire"
                >
                  <Shuffle className="w-4 h-4" />
                </motion.button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                Clique pour uploader ou utilise l'icône pour un avatar aléatoire
              </p>
            </div>

            {/* Pseudo (@...) */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Pseudo
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-8 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                  placeholder="jean_dupont"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Nom complet */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nom complet (optionnel)
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                  placeholder="Jean Dupont"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                  placeholder="ton@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Minimum 6 caractères
              </p>
            </div>

            {/* Message d'erreur */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Bouton "C'est parti !" */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-vibe text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl glow-vibe mt-6"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Inscription...
                </>
              ) : (
                <>
                  C'est parti !
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Lien vers la connexion */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Déjà un compte ?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-indigo-600 font-semibold hover:underline"
              >
                Se connecter
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


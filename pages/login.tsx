"use client";

import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ArrowRight, AtSign, ChevronLeft, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

/**
 * Page de connexion
 * Login HYBRIDE : accepte email OU pseudo
 */
export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  /**
   * Gère la soumission du formulaire de connexion
   * Le login accepte un email OU un pseudo
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(identifier, password);
      router.push("/feed");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la connexion");
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
          <h1 className="ml-4 text-lg font-semibold text-gray-900">Connexion</h1>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-10">
            <h2 className="text-5xl font-black mb-3">
              <span className="text-gradient-vibe">VIBE</span>
            </h2>
            <p className="text-gray-600 text-base">
              Connecte-toi pour continuer
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email ou Pseudo */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email ou pseudo
              </label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                  placeholder="ton@email.com ou pseudo"
                  autoComplete="username"
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
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
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

            {/* Bouton de connexion */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-vibe text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl glow-vibe mt-6"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Lien vers l'inscription */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Pas de compte ?{" "}
              <button
                onClick={() => router.push("/signup")}
                className="text-indigo-600 font-semibold hover:underline"
              >
                S'inscrire
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

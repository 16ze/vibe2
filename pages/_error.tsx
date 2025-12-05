import React from 'react';
import type { NextPageContext } from 'next';
import { motion } from 'framer-motion';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

/**
 * Interface pour les props du composant d'erreur
 */
interface ErrorProps {
  statusCode?: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

/**
 * Composant d'erreur personnalisé pour Next.js
 * Affiche une page d'erreur stylisée en cas de problème
 */
function Error({ statusCode, err }: ErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center"
        >
          <AlertCircle className="w-10 h-10 text-red-500" />
        </motion.div>

        <h1 className="text-4xl font-black text-gray-900 mb-2">
          {statusCode || 'Erreur'}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {statusCode === 404
            ? "La page que vous cherchez n'existe pas."
            : statusCode === 500
            ? "Une erreur serveur s'est produite."
            : err?.message || "Une erreur inattendue s'est produite."}
        </p>

        <div className="flex gap-3 justify-center">
          <Link href="/">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-vibe text-white rounded-xl font-semibold hover:shadow-lg transition-shadow glow-vibe"
            >
              <Home className="w-5 h-5" />
              Accueil
            </motion.button>
          </Link>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Recharger
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Fonction pour récupérer les props initiales de l'erreur
 */
Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;






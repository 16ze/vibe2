import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

/**
 * Page 500 personnalisée pour les erreurs serveur
 */
export default function ServerError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4">
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
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </motion.div>

        <h1 className="text-6xl font-black text-gray-900 mb-2">500</h1>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Erreur serveur
        </h2>
        
        <p className="text-gray-600 mb-8">
          Une erreur interne s'est produite. Notre équipe a été notifiée et travaille à résoudre le problème.
        </p>

        <div className="flex gap-3 justify-center">
          <Link href="/">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
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
            Réessayer
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}






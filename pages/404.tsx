import React from 'react';
import { motion } from 'framer-motion';
import { Home, Search } from 'lucide-react';
import Link from 'next/link';

/**
 * Page 404 personnalisée pour les pages non trouvées
 */
export default function NotFound() {
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
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-100 flex items-center justify-center"
        >
          <Search className="w-10 h-10 text-purple-500" />
        </motion.div>

        <h1 className="text-6xl font-black text-gray-900 mb-2">404</h1>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Page non trouvée
        </h2>
        
        <p className="text-gray-600 mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <Link href="/">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-vibe text-white rounded-xl font-semibold hover:shadow-lg transition-shadow glow-vibe mx-auto"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}






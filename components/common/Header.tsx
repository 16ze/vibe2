import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, Plus } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  showAdd?: boolean;
  onSearch?: () => void;
  onNotifications?: () => void;
  onAdd?: () => void;
  /**
   * Callback appelé quand on clique sur l'icône + (remplace le logo)
   */
  onCompose?: () => void;
}

/**
 * Composant Header réutilisable
 * Affiche une icône + à la place du logo (pour créer un status) et les actions
 * 
 * @param title - Titre à afficher (optionnel, non utilisé si onCompose est fourni)
 * @param showSearch - Afficher le bouton de recherche
 * @param showNotifications - Afficher le bouton de notifications
 * @param showAdd - Afficher le bouton d'ajout
 * @param onSearch - Callback pour le bouton de recherche
 * @param onNotifications - Callback pour le bouton de notifications
 * @param onAdd - Callback pour le bouton d'ajout
 * @param onCompose - Callback pour l'icône + (ouvre le modal de création)
 */
export default function Header({ 
  title = 'VIBE', 
  showSearch = true, 
  showNotifications = true, 
  showAdd = false, 
  onSearch, 
  onNotifications, 
  onAdd,
  onCompose 
}: HeaderProps) {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Icône + à la place du logo - Ouvre le modal pour créer un status */}
        {onCompose ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onCompose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Créer un nouveau status"
          >
            <Plus className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
          </motion.button>
        ) : (
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            {title}
          </h1>
        )}
        
        <div className="flex items-center gap-1">
          {showAdd && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onAdd}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-6 h-6 text-gray-900" />
            </motion.button>
          )}
          {showSearch && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onSearch}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Search className="w-6 h-6 text-gray-900" />
            </motion.button>
          )}
          {showNotifications && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onNotifications}
              className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-6 h-6 text-gray-900" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}
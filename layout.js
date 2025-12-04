import React from 'react';

/**
 * Composant Layout principal de l'application
 * Fournit la structure de base pour toutes les pages
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {React.ReactNode} props.children - Le contenu à afficher
 * @param {string} props.currentPageName - Le nom de la page actuelle (optionnel)
 */
export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}
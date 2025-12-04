# 📱 VIBE - Application Mobile Sociale

Application mobile sociale hybride entre Snapchat et Instagram, centrée sur le partage de moments visuels et la messagerie instantanée.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ 
- npm ou pnpm

### Installation

```bash
npm install
```

### Lancement en développement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📋 Structure du projet

```
vibe2/
├── api/                    # Client API local (vibeClient)
├── components/             # Composants React réutilisables
│   ├── camera/            # Composants pour l'appareil photo
│   ├── chat/              # Composants de messagerie
│   ├── common/            # Composants communs
│   ├── feed/              # Composants du feed
│   └── story/             # Composants des stories
├── entities/              # Schémas JSON des entités
├── pages/                 # Pages Next.js
│   ├── feed.ts           # Écran Feed
│   ├── camera.ts         # Écran Appareil photo
│   ├── conversations.ts  # Écran Conversations
│   ├── home.ts           # Page principale avec navigation
│   └── profile.ts        # Page profil
├── styles/                # Styles globaux
└── utils/                 # Utilitaires
```

## 🏗️ Architecture

### Navigation principale

L'application utilise une navigation horizontale à 3 écrans :

- **[FEED]** ←→ **[APPAREIL PHOTO]** ←→ **[CONVERSATIONS]**

Navigation par swipe horizontal entre les écrans.

### Stack technique

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: React Query (TanStack Query)
- **Icons**: Lucide React
- **Date formatting**: date-fns

## 🔧 Configuration

### Stockage des données

Le projet utilise **localStorage** pour la persistance des données. Toutes les données sont stockées localement dans le navigateur :
- Posts, Stories, Messages, Conversations
- Utilisateurs et authentification
- Fichiers uploadés (images en base64, vidéos en blob URLs)

**Note** : Les données sont persistantes entre les sessions mais spécifiques à chaque navigateur/domaine.

## 📱 Fonctionnalités

### ✅ Implémentées

- Navigation horizontale entre les 3 écrans principaux
- Feed avec posts et stories
- Appareil photo avec filtres
- Messagerie instantanée
- Système de likes
- Stories éphémères (24h)

### 🚧 En développement

- Authentification complète
- Appels audio/vidéo
- Notifications push
- Modération de contenu

## 🛠️ Scripts disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Build de production
- `npm run start` - Lance le serveur de production
- `npm run lint` - Vérifie le code avec ESLint

## 📝 Notes

- Le projet est configuré pour fonctionner avec Next.js en mode pages
- Les composants utilisent TypeScript
- Le styling utilise Tailwind CSS avec des classes utilitaires
- Les animations sont gérées par Framer Motion

## 🔐 Sécurité

- Validation des entrées utilisateur
- Gestion sécurisée des tokens d'authentification
- HTTPS obligatoire en production

## 📄 Licence

Propriétaire - Tous droits réservés


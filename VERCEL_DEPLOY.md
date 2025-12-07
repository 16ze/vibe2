# 🚀 Guide de Déploiement Vercel pour VIBE PWA

## ✅ Checklist Pré-Déploiement

### 1. Variables d'Environnement
Dans Vercel Dashboard → Settings → Environment Variables, ajoutez :
- `NEXT_PUBLIC_SUPABASE_URL` : URL de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Clé anonyme Supabase

### 2. Configuration Supabase
- ✅ RLS (Row Level Security) activé sur toutes les tables
- ✅ Storage buckets configurés (`posts`, `stories`)
- ✅ Realtime activé pour les tables nécessaires
- ✅ Triggers SQL pour création automatique de profils

### 3. PWA Configuration
- ✅ `manifest.json` configuré dans `/public/manifest.json`
- ✅ Service Worker (`sw.js`) dans `/public/sw.js`
- ✅ `register-sw.js` dans `/public/register-sw.js`
- ✅ Meta tags PWA dans `pages/_document.tsx`
- ⚠️ **ICÔNES MANQUANTES** : Créez les icônes dans `/public/icons/` :
  - `icon-192.png` (192x192px)
  - `icon-512.png` (512x512px)

### 4. Next.js Configuration
- ✅ `next.config.js` configuré avec images remotePatterns
- ✅ Build script dans `package.json`

## 📋 Étapes de Déploiement

### Option 1 : Via GitHub (Recommandé)
1. Connectez votre repo GitHub à Vercel
2. Vercel détectera automatiquement Next.js
3. Ajoutez les variables d'environnement dans Vercel Dashboard
4. Déployez !

### Option 2 : Via Vercel CLI
```bash
npm i -g vercel
vercel login
vercel
```

## 🔧 Configuration Vercel

### Build Settings
- **Framework Preset** : Next.js
- **Build Command** : `npm run build` (par défaut)
- **Output Directory** : `.next` (par défaut)
- **Install Command** : `npm install` (par défaut)

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## 🎯 Post-Déploiement

### 1. Vérification PWA
- Ouvrez l'URL de déploiement sur mobile
- Vérifiez que l'option "Ajouter à l'écran d'accueil" apparaît
- Testez l'installation PWA

### 2. Vérification Supabase
- Testez la connexion
- Testez la création de posts/stories
- Vérifiez les notifications en temps réel

### 3. Domain Custom (Optionnel)
- Dans Vercel Dashboard → Settings → Domains
- Ajoutez votre domaine personnalisé

## ⚠️ Points d'Attention

1. **Icônes PWA** : Les icônes doivent être créées avant le déploiement pour que le PWA soit installable
2. **HTTPS** : Vercel fournit HTTPS automatiquement (requis pour PWA)
3. **Service Worker** : Vérifiez que `/sw.js` est accessible après déploiement
4. **CORS** : Configurez les URLs autorisées dans Supabase Dashboard → Authentication → URL Configuration

## 🔍 Debugging

### Vérifier le Service Worker
```javascript
// Dans la console du navigateur
navigator.serviceWorker.getRegistrations().then(console.log);
```

### Vérifier le Manifest
- Ouvrez `https://votre-app.vercel.app/manifest.json`
- Vérifiez que toutes les icônes sont accessibles

### Logs Vercel
- Vercel Dashboard → Deployments → [Dernier déploiement] → Logs

## 📱 Test PWA

### iOS (Safari)
1. Ouvrez l'app dans Safari
2. Appuyez sur le bouton "Partager"
3. Sélectionnez "Sur l'écran d'accueil"
4. L'app devrait s'ouvrir en mode standalone

### Android (Chrome)
1. Ouvrez l'app dans Chrome
2. Menu (3 points) → "Ajouter à l'écran d'accueil"
3. L'app devrait s'ouvrir en mode standalone


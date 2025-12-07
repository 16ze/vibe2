# 🔍 Diagnostic Supabase - Vérification de la Connexion

## Problème Signalé
Plus de photos, plus d'abonnés, rien ne s'affiche.

## ✅ Corrections Appliquées

1. **Feed.tsx** : Les posts et stories se chargent maintenant même sans utilisateur connecté
   - Avant : `enabled: !!currentUser && isMounted`
   - Après : `enabled: isMounted`

2. **Page de diagnostic** : `/debug-supabase` pour tester la connexion

## 🔧 Vérifications à Faire

### 1. Variables d'Environnement sur Vercel

Vérifiez que ces variables sont définies dans Vercel Dashboard → Settings → Environment Variables :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**Comment vérifier :**
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Settings → Environment Variables
4. Vérifiez que les deux variables sont présentes

### 2. Configuration Supabase

Vérifiez dans Supabase Dashboard :

1. **RLS (Row Level Security)** :
   - Table `posts` : RLS activé avec politiques pour `SELECT` public
   - Table `profiles` : RLS activé avec politiques pour `SELECT` public
   - Table `follows` : RLS activé avec politiques appropriées

2. **Storage Buckets** :
   - Bucket `posts` : Public ou avec politiques d'accès
   - Bucket `stories` : Public ou avec politiques d'accès

3. **Authorized URLs** :
   - Settings → API → Authorized URLs
   - Ajoutez votre URL Vercel : `https://vibe2-nine.vercel.app`

### 3. Utiliser la Page de Diagnostic

Accédez à : `https://vibe2-nine.vercel.app/debug-supabase`

Cette page va tester :
- ✅ Configuration Supabase (variables d'environnement)
- ✅ Connexion à Supabase
- ✅ Authentification utilisateur
- ✅ Requête getFeed()
- ✅ Requête getStats()
- ✅ Requête getFollowers()
- ✅ Existence des tables

### 4. Vérifier la Console du Navigateur

Ouvrez la console (F12) et cherchez :
- ❌ Erreurs `Supabase n'est pas configuré`
- ❌ Erreurs `400 Bad Request` ou `401 Unauthorized`
- ❌ Erreurs `42703` (colonne inexistante)

### 5. Vérifier l'Authentification

Si vous n'êtes pas connecté :
- Les posts publics devraient quand même s'afficher
- Les abonnés/abonnements nécessitent une connexion

## 🐛 Problèmes Courants

### Problème 1 : Variables d'environnement manquantes
**Symptôme** : Rien ne se charge, console affiche "Supabase n'est pas configuré"
**Solution** : Ajouter les variables dans Vercel Dashboard

### Problème 2 : RLS trop restrictif
**Symptôme** : Erreurs 401 ou 403 dans la console
**Solution** : Vérifier les politiques RLS dans Supabase Dashboard

### Problème 3 : Tables inexistantes
**Symptôme** : Erreurs 400 ou 42703
**Solution** : Vérifier que les tables existent dans Supabase

### Problème 4 : Utilisateur non connecté
**Symptôme** : Pas d'abonnés/abonnements mais les posts devraient s'afficher
**Solution** : Se connecter pour voir les données personnelles

## 📝 Actions Immédiates

1. **Accédez à `/debug-supabase`** pour voir l'état exact
2. **Vérifiez les variables d'environnement sur Vercel**
3. **Vérifiez les politiques RLS dans Supabase**
4. **Vérifiez la console du navigateur pour les erreurs**


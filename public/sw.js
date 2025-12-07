// Service Worker basique pour PWA
// Ce fichier sera servi depuis /public/sw.js

const CACHE_NAME = 'vibe-v1';
const urlsToCache = [
  '/',
  '/feed',
  '/camera',
  '/conversations',
  '/profile',
  '/manifest.json',
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Stratégie de cache : Network First, puis Cache
// IMPORTANT : Exclut Supabase et les requêtes non-GET du cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // CRITIQUE : Bypass complet pour Supabase (ne pas intercepter)
  // Vérifie aussi les sous-domaines et les chemins API
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.io') ||
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/') ||
    url.pathname.includes('/storage/v1/') ||
    url.pathname.includes('/realtime/v1/')
  ) {
    // Laisse passer directement sans interception - CRITIQUE pour Supabase
    event.respondWith(fetch(request).catch((err) => {
      console.error('[SW] Supabase fetch error (bypassed):', err);
      // Retourne une erreur réseau plutôt qu'un cache
      throw err;
    }));
    return;
  }

  // Bypass pour les requêtes POST, PUT, DELETE, PATCH (ne peuvent pas être mises en cache)
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    event.respondWith(fetch(request));
    return;
  }

  // Pour les autres requêtes GET (pages, assets), utilise Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Ne met en cache que les réponses valides (200-299) et clonables
        if (response.status >= 200 && response.status < 300 && response.type === 'basic') {
          // Clone la réponse pour la mettre en cache
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache).catch((err) => {
              // Ignore les erreurs de cache silencieusement
              console.warn('[SW] Erreur lors de la mise en cache:', err);
            });
          });
        }
        return response;
      })
      .catch(() => {
        // Si le réseau échoue, essaie le cache uniquement pour les pages HTML
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match(request);
        }
        // Pour les autres ressources, retourne une erreur réseau
        throw new Error('Network request failed');
      })
  );
});

// Écoute les messages pour forcer la mise à jour
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


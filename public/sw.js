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
  if (url.hostname.includes('supabase.co')) {
    // Laisse passer directement sans interception
    event.respondWith(fetch(request));
    return;
  }

  // Bypass pour les requêtes POST, PUT, DELETE (ne peuvent pas être mises en cache)
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Pour les autres requêtes GET (pages, assets), utilise Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Ne met en cache que les réponses valides (200-299)
        if (response.status >= 200 && response.status < 300) {
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
        // Si le réseau échoue, essaie le cache uniquement pour les pages
        return caches.match(request);
      })
  );
});


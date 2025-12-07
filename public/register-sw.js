// Enregistrement du Service Worker pour PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('[PWA] Service Worker enregistré avec succès:', registration.scope);
      })
      .catch(function(error) {
        console.log('[PWA] Échec de l\'enregistrement du Service Worker:', error);
      });
  });
}


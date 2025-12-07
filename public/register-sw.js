// Enregistrement du Service Worker pour PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('[PWA] Service Worker enregistré avec succès:', registration.scope);
        
        // Force la mise à jour du Service Worker si une nouvelle version est disponible
        registration.addEventListener('updatefound', function() {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nouvelle version disponible, force l'activation
              console.log('[PWA] Nouvelle version du Service Worker disponible');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          });
        });
      })
      .catch(function(error) {
        console.log('[PWA] Échec de l\'enregistrement du Service Worker:', error);
      });

    // Vérifie les mises à jour toutes les heures
    setInterval(function() {
      navigator.serviceWorker.getRegistration().then(function(registration) {
        if (registration) {
          registration.update();
        }
      });
    }, 3600000); // 1 heure
  });
}


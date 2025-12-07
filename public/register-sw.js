// Enregistrement du Service Worker pour PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    // Désactive temporairement le Service Worker si on détecte des erreurs Supabase
    // TODO: Réactiver une fois que le SW est corrigé pour tous les utilisateurs
    const disableSW = sessionStorage.getItem('disableSW') === 'true';
    
    if (disableSW) {
      console.log('[PWA] Service Worker désactivé temporairement');
      // Désenregistre tous les Service Workers existants
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
          registration.unregister();
          console.log('[PWA] Service Worker désenregistré');
        }
      });
      return;
    }

    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('[PWA] Service Worker enregistré avec succès:', registration.scope);
        
        // Force la mise à jour du Service Worker si une nouvelle version est disponible
        registration.addEventListener('updatefound', function() {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', function() {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nouvelle version disponible, force l'activation
                console.log('[PWA] Nouvelle version du Service Worker disponible');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                // Recharge après un court délai
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }
            });
          }
        });

        // Vérifie immédiatement s'il y a une mise à jour
        registration.update();
      })
      .catch(function(error) {
        console.log('[PWA] Échec de l\'enregistrement du Service Worker:', error);
      });

    // Vérifie les mises à jour toutes les 5 minutes (au lieu d'1 heure)
    setInterval(function() {
      navigator.serviceWorker.getRegistration().then(function(registration) {
        if (registration) {
          registration.update();
        }
      });
    }, 300000); // 5 minutes

    // Détecte les erreurs Supabase et désactive le SW si nécessaire
    window.addEventListener('unhandledrejection', function(event) {
      if (event.reason && event.reason.message && event.reason.message.includes('Failed to fetch')) {
        const url = event.reason.stack || '';
        if (url.includes('supabase.co')) {
          console.error('[PWA] Erreur Supabase détectée, désactivation du Service Worker');
          sessionStorage.setItem('disableSW', 'true');
          window.location.reload();
        }
      }
    });
  });
}


/**
 * Self-Destroying Service Worker
 * Used to retire the old, aggressively-caching service-worker.js from client browsers.
 */

self.addEventListener('install', (event) => {
    console.log('[Retired SW] Installing self-destroying service worker...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[Retired SW] Activating and unregistering old service worker...');
    event.waitUntil(
        self.registration.unregister()
            .then(() => self.clients.claim())
            .then(() => {
                // Wipe all caches registered under the old service worker names
                return caches.keys().then((keys) => {
                    return Promise.all(
                        keys.map((key) => {
                            console.log('[Retired SW] Deleting cache:', key);
                            return caches.delete(key);
                        })
                    );
                });
            })
            .then(() => {
                console.log('[Retired SW] Unregistration and cache clearing complete.');
            })
    );
});

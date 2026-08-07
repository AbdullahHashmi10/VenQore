const CACHE_NAME = 'venqore-pos-v6';
const STATIC_CACHE = 'venqore-pos-static-v6';
const DYNAMIC_CACHE = 'venqore-pos-dynamic-v6';

const STATIC_ASSETS = [
    '/admin',
    '/css/app.css',
    '/js/app.js',
    '/images/logo.png',
];

// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('Service Worker: Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== STATIC_CACHE && cache !== DYNAMIC_CACHE) {
                        console.log('Service Worker: Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch Event - Network First Strategy
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone the response
                const responseClone = response.clone();

                // Cache dynamic content
                if (event.request.method === 'GET') {
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }

                return response;
            })
            .catch(() => {
                // If network fails, try cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Return offline page if available
                    if (event.request.mode === 'navigate') {
                        return caches.match('/admin');
                    }
                });
            })
    );
});

// Background Sync (for offline actions)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    console.log('Service Worker: Syncing data...');
    // Add your sync logic here
}

// Push Notifications (optional for future)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'VenQore POS Notification';
    const options = {
        body: data.body || 'You have a new notification',
        icon: '/images/icons/icon-192x192.png',
        badge: '/images/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/admin'
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});

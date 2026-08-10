const CACHE_NAME = 'venqore-pos-v3.2';

const STATIC_ASSETS = [
    '/favicon.ico',
    '/offline.html',
];

// Routes that must NEVER be served from cache or intercepted by SW (Auth & Financials)
const BYPASS_ROUTES = [
    '/login',
    '/register',
    '/logout',
    '/v3/sales',
    '/v3/purchases',
    '/v3/reports',
    '/v3/journal',
    '/v3/payments',
    '/v3/dashboard',
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // CRITICAL: Never intercept cross-origin requests.
    if (url.origin !== self.location.origin) {
        return;
    }

    const isBypass = BYPASS_ROUTES.some(path => url.pathname.startsWith(path));
    const isApi = url.pathname.startsWith('/api') || url.pathname.startsWith('/v3');
    const isStaticAsset = url.pathname.startsWith('/build/') || 
                          url.pathname.startsWith('/images/') || 
                          url.pathname.startsWith('/fonts/') ||
                          url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/i);

    // Only GET requests can be cached. Auth routes & API routes must ALWAYS be direct to server.
    if (event.request.method !== 'GET' || isApi || isBypass || !isStaticAsset) {
        return;
    }

    // Build assets (/build/*): No caching in SW. 
    // Hashed filenames ensure correct browser caching, SW interference causes stale chunk errors.
    if (url.pathname.startsWith('/build/')) {
        return; 
    }

    // Static assets (images, fonts): cache-first with network fallback
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            });
        }).catch(error => {
            console.error('[SW] Fetch failed for', event.request.url, error);
        })
    );
});

const CACHE_NAME = 'amd-erp-v1';

// Only cache static UI assets — NEVER cache financial API responses.
// Financial data must always be fetched live from the server.
const STATIC_ASSETS = [
    '/',
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
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
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

    // CRITICAL: Never intercept cross-origin requests (e.g. Vite dev server on port 5173/5174).
    // This prevents the SW from breaking the dev environment by failing to cache
    // cross-origin assets and returning null Responses that crash React.
    if (url.origin !== self.location.origin) {
        return;
    }

    const isBypass = BYPASS_ROUTES.some(path => url.pathname.startsWith(path));
    const isApi = url.pathname.startsWith('/api') || url.pathname.startsWith('/v3');
    const isStaticAsset = url.pathname.startsWith('/build/') || 
                          url.pathname.startsWith('/images/') || 
                          url.pathname.startsWith('/fonts/') ||
                          url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/i);

    // Only GET requests can be cached. 
    // Auth routes and API routes must ALWAYS be direct to server.
    if (event.request.method !== 'GET' || isApi || isBypass || !isStaticAsset) {
        return; // Let browser handle normally
    }


    // Static assets: cache-first
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                // DON'T cache if response is not 200 OK or if it's opaque/redirected in a way that breaks
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            });
        }).catch(error => {
            console.error('[SW] Fetch failed for', event.request.url, error);
            // Ignore for static assets
        })
    );
});

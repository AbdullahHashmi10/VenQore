/* VenQore QR menu service worker: if the connection drops at the table, the last menu page still opens.
   Only plain page loads under /catalogue/ are cached; orders, status checks and calls always go to the network. */
const CACHE = 'vq-onsite-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
    const r = e.request;
    const u = new URL(r.url);
    if (r.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith('/catalogue/')) return;
    if (/\/(order|call)(\/|$)/.test(u.pathname) || r.headers.get('X-Inertia') || r.mode !== 'navigate') return;
    e.respondWith(
        fetch(r).then((res) => {
            if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); }
            return res;
        }).catch(() => caches.match(r).then((hit) => hit || new Response('Offline. Please ask a member of staff.', { status: 503, headers: { 'Content-Type': 'text/plain' } }))),
    );
});

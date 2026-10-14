/**
 * VenQore service worker (v4) — see docs/OFFLINE_CONTRACT.md
 *
 * What it does
 *  1. Keeps the app itself (/build JS+CSS, fonts, images) so the app can OPEN with no internet.
 *  2. Keeps a copy of every store page the person has opened (the page HTML for a fresh
 *     start, and the Inertia JSON for in-app navigation). Network first: live data
 *     always wins when the server answers. Only when it does not answer (offline, or
 *     slower than the timeout) is the saved copy served, stamped so the app can say
 *     "this is saved data, not live".
 *  3. Never keeps API calls, writes, logins or anything outside /s/{store}/.
 *
 * Limits: saved pages older than 7 days are ignored (same limit as the licence check),
 * and every saved page is deleted on log-in / log-out so a shared PC never shows the
 * previous person's data.
 */
const VERSION = 'v4';
const SHELL_CACHE = `venqore-shell-${VERSION}`;
const ASSET_CACHE = `venqore-assets-${VERSION}`;
const PAGE_CACHE = `venqore-pages-${VERSION}`;
const KEEP = [SHELL_CACHE, ASSET_CACHE, PAGE_CACHE];

const OFFLINE_LIMIT_MS = 7 * 24 * 60 * 60 * 1000; // keep equal to resources/js/lib/offlinePolicy.js
const DOC_TIMEOUT_MS = 8000;
const XHR_TIMEOUT_MS = 6000;
const MAX_ASSETS = 600;
const MAX_PAGES = 150;

const SHELL_URLS = ['/offline.html', '/favicon.ico'];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_URLS)).catch(() => {}));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    const type = event.data && event.data.type;
    if (type === 'CLEAR_PAGES') event.waitUntil(caches.delete(PAGE_CACHE));
    if (type === 'PRUNE_PAGES') event.waitUntil(prunePages());
    if (type === 'SKIP_WAITING') self.skipWaiting();
});

// Drop saved pages older than the offline limit (the newest copy of each page is always replaced on fetch).
async function prunePages() {
    try {
        const cache = await caches.open(PAGE_CACHE);
        for (const req of await cache.keys()) {
            const res = await cache.match(req);
            const at = res ? Number(res.headers.get('x-vq-cached-at')) || 0 : 0;
            if (!at || Date.now() - at > OFFLINE_LIMIT_MS) await cache.delete(req);
        }
    } catch { /* best effort */ }
}

// ── helpers ──────────────────────────────────────────────────────────────────
const isStorePath = (p) => /^\/s\/[^/]+(\/|$)/.test(p);
const isAuthPath = (p) => /^\/(login|logout|register|VenQore-login|auth|forgot-password|reset-password|two-factor|email-otp)/i.test(p);
const isInertia = (req) => req.headers.get('x-inertia') === 'true';
const isPartial = (req) => !!req.headers.get('x-inertia-partial-data');
const isDocument = (req) =>
    req.mode === 'navigate' || req.destination === 'document' ||
    ((req.headers.get('accept') || '').includes('text/html') && !isInertia(req));

function race(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
    ]);
}

function pageKey(url, kind) {
    const u = new URL(url);
    u.hash = '';
    u.searchParams.set('__vq', kind);
    return u.href;
}

async function stamp(response) {
    const headers = new Headers(response.headers);
    headers.set('x-vq-cached-at', String(Date.now()));
    return new Response(await response.blob(), { status: response.status, statusText: response.statusText, headers });
}

async function trim(cache, max) {
    const keys = await cache.keys();
    if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

/** A saved page, or null when none / too old. Inertia JSON gets a snapshot marker added. */
async function savedPage(key, kind) {
    const cache = await caches.open(PAGE_CACHE);
    const hit = await cache.match(key);
    if (!hit) return null;
    const at = Number(hit.headers.get('x-vq-cached-at')) || 0;
    if (!at || Date.now() - at > OFFLINE_LIMIT_MS) { await cache.delete(key); return null; }
    if (kind !== 'inertia') return hit;
    try {
        const page = await hit.clone().json();
        page.props = Object.assign({}, page.props, { vq_offline_snapshot: { at } });
        const headers = new Headers(hit.headers);
        headers.set('content-type', 'application/json');
        headers.set('x-inertia', 'true');
        headers.set('vary', 'X-Inertia');
        return new Response(JSON.stringify(page), { status: 200, headers });
    } catch (e) {
        return null;
    }
}

function rememberPage(event, key, response) {
    // Only a plain 200 for exactly this URL. Redirects (login bounces) and errors are never saved.
    if (!response || response.status !== 200 || response.redirected || response.type === 'opaqueredirect') return;
    if (new URL(response.url || key).pathname.match(/\/(login|logout)/)) return;
    const copy = response.clone();
    event.waitUntil((async () => {
        const cache = await caches.open(PAGE_CACHE);
        await cache.put(key, await stamp(copy));
        await trim(cache, MAX_PAGES);
    })().catch(() => {}));
}

async function pageNetworkFirst(event, req, kind) {
    const key = pageKey(req.url, kind);
    try {
        const response = await race(fetch(req), kind === 'document' ? DOC_TIMEOUT_MS : XHR_TIMEOUT_MS);
        rememberPage(event, key, response);
        return response;
    } catch (err) {
        const saved = await savedPage(key, kind);
        if (saved) return saved;
        if (kind === 'document') {
            const shell = await caches.match('/offline.html');
            if (shell) return shell;
        }
        return Response.error();
    }
}

async function assetCacheFirst(event, req) {
    const cache = await caches.open(ASSET_CACHE);
    const hit = await cache.match(req);
    if (hit) return hit;
    try {
        const response = await fetch(req);
        if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            event.waitUntil(cache.put(req, copy).then(() => trim(cache, MAX_ASSETS)).catch(() => {}));
        }
        return response;
    } catch (err) {
        return Response.error();
    }
}

// ── routing ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    // Signing in or out wipes every saved page (shared PCs). The request itself goes straight through.
    if (isAuthPath(url.pathname)) {
        if (req.method !== 'GET' || isDocument(req)) event.waitUntil(caches.delete(PAGE_CACHE));
        return;
    }

    if (req.method !== 'GET') return;

    const p = url.pathname;
    if (p === '/sw.js' || p === '/ping' || p === '/up' || p.startsWith('/api/') || p.startsWith('/v3/') || p.includes('/qr')) return;

    // The app itself: hashed build files never change, so keep them for offline starts.
    if (p.startsWith('/build/') || p.startsWith('/fonts/') || p.startsWith('/images/') || p.startsWith('/_ds/') ||
        /\.(?:js|css|woff2?|ttf|eot|png|jpe?g|gif|svg|ico|webp)$/i.test(p)) {
        if (p.endsWith('/manifest.json')) return;
        event.respondWith(assetCacheFirst(event, req));
        return;
    }

    // Store pages: live first, saved copy when the server cannot be reached.
    if (isStorePath(p)) {
        if (isInertia(req)) {
            if (isPartial(req)) return;
            event.respondWith(pageNetworkFirst(event, req, 'inertia'));
        } else if (isDocument(req)) {
            event.respondWith(pageNetworkFirst(event, req, 'document'));
        }
    }
});

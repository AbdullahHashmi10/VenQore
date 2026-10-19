/**
 * Page-side half of the offline page cache (public/sw.js is the other half).
 * See docs/OFFLINE_CONTRACT.md.
 */
import { isOnline } from '@/lib/connectivity';
import { OFFLINE_LIMIT_MS } from '@/lib/offlinePolicy';

/** Same key format as pageKey() in public/sw.js. */
function pageKey(href, kind) {
    const u = new URL(href, window.location.origin);
    u.hash = '';
    u.searchParams.set('__vq', kind);
    return u.href;
}

/** Remember which store this browser works in, so the offline screen can offer its saved pages. */
export function rememberStore(slug) {
    if (!slug) return;
    try { window.localStorage.setItem('vq_last_store', slug); } catch { /* storage blocked: only the shortcut is lost */ }
}

/** Is there a usable saved copy of this page (for in-app navigation)? */
export async function isPageSaved(href) {
    if (typeof caches === 'undefined') return false;
    try {
        const hit = await caches.match(pageKey(href, 'inertia'));
        if (!hit) return false;
        const at = Number(hit.headers.get('x-vq-cached-at')) || 0;
        return at > 0 && Date.now() - at <= OFFLINE_LIMIT_MS;
    } catch {
        return false;
    }
}

/** Tell the service worker to forget every saved page (log-out on a shared PC). */
export function clearSavedPages() {
    try { navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_PAGES' }); } catch { /* no service worker */ }
}

const SWEEP_KEY = 'vq_sweep_at';
const KNOWN_KEY = 'vq_known_pages_';
const SWEEP_EVERY_MS = 30 * 60 * 1000;
const MAX_WARM_PAGES = 40;
const CORE = ['pos', 'foh/overview', 'foh/tables', 'foh/takeaway', 'foh/delivery'];
// Links that do something (or leave the app) instead of showing a page: never fetched in the background.
const SKIP = /(logout|signout|export|download|print|pdf|csv|xlsx|\/api\/|\/qr|switch|impersonate|delete|destroy|oauth|callback|\/ping|\.[a-z0-9]{2,5}$)/i;

/** Pure: from any list of links, the store pages worth keeping fresh (same store, no actions, no duplicates, capped). */
export function selectWarmPaths(hrefs, slug, origin = 'http://x') {
    const base = `/s/${encodeURIComponent(slug)}`;
    const out = [];
    const seen = new Set();
    for (const h of hrefs || []) {
        let u;
        try { u = new URL(h, origin); } catch { continue; }
        if (u.origin !== new URL(origin).origin) continue;
        if (u.pathname !== base && !u.pathname.startsWith(`${base}/`)) continue;
        if (SKIP.test(u.pathname)) continue;
        const path = u.pathname.replace(/\/+$/, '') + u.search;
        if (seen.has(path)) continue;
        seen.add(path);
        out.push(path);
        if (out.length >= MAX_WARM_PAGES) break;
    }
    return out;
}

function knownPages(slug) {
    try { return JSON.parse(window.localStorage.getItem(KNOWN_KEY + slug) || '[]'); } catch { return []; }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * While online, keep every page of the store saved and fresh so it opens with no internet,
 * showing the data as of the last time the internet was there. The service worker replaces each
 * copy as it is fetched and drops copies older than 7 days. Skips if swept in the last 30 minutes.
 */
export async function warmOfflinePages({ slug, version, force = false }) {
    try {
        if (!slug || !isOnline() || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
        if (document.visibilityState === 'hidden') return;
        const last = Number(window.localStorage.getItem(SWEEP_KEY) || 0);
        if (!force && Date.now() - last < SWEEP_EVERY_MS) return;
        // Wait until the service worker controls this page, otherwise nothing would be kept.
        if (!navigator.serviceWorker.controller) return;

        const base = `/s/${encodeURIComponent(slug)}`;
        const seenNow = Array.from(document.querySelectorAll('a[href]')).map((a) => a.getAttribute('href'));
        const known = selectWarmPaths([...knownPages(slug), ...seenNow], slug, window.location.origin);
        try { window.localStorage.setItem(KNOWN_KEY + slug, JSON.stringify(known)); } catch { /* storage blocked */ }
        const paths = selectWarmPaths([...CORE.map((c) => `${base}/${c}`), window.location.pathname, ...known], slug, window.location.origin);

        for (const path of paths) {
            if (!isOnline()) return;
            // The page as a fresh start would load it, and as in-app navigation would load it.
            await fetch(path, { headers: { Accept: 'text/html' }, credentials: 'same-origin' }).catch(() => {});
            await fetch(path, {
                headers: { Accept: 'text/html, application/xhtml+xml', 'X-Inertia': 'true', 'X-Inertia-Version': version || '', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            }).catch(() => {});
            await wait(250); // gentle on the server and the till
        }
        // The code the till and the floor need, so they can draw with no internet.
        await Promise.allSettled([import('@/Pages/Pos.jsx'), import('@/Pages/Foh/Index.jsx')]);
        try { navigator.serviceWorker.controller?.postMessage({ type: 'PRUNE_PAGES' }); } catch { /* no service worker */ }
        window.localStorage.setItem(SWEEP_KEY, String(Date.now()));
    } catch { /* warming is best effort */ }
}

/** Run the sweep soon, then keep it going while the app is open and whenever the internet returns. */
export function startAutoCaching({ slug, version }) {
    const run = () => warmOfflinePages({ slug, version });
    const first = setTimeout(run, 8000);
    const tick = setInterval(run, 5 * 60 * 1000); // each run self-limits to every 30 minutes
    const onBack = () => { setTimeout(run, 3000); };
    window.addEventListener('online', onBack);
    document.addEventListener('visibilitychange', onBack);
    return () => {
        clearTimeout(first); clearInterval(tick);
        window.removeEventListener('online', onBack);
        document.removeEventListener('visibilitychange', onBack);
    };
}

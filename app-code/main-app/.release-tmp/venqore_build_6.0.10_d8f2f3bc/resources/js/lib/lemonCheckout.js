/**
 * VenQore — Lemon Squeezy in-app checkout overlay
 * ------------------------------------------------------------------
 * Lemon Squeezy is our Merchant of Record, which means card details must
 * always be entered on their PCI-compliant page — we can never collect the
 * card number ourselves. What we *can* do is stop throwing the user out of
 * VenQore: `lemon.js` renders that same checkout as an overlay on top of the
 * current page, so the app stays visible behind it and there is no page
 * navigation, no white flash, and no "where did my dashboard go?" moment.
 *
 * This module:
 *   1. Lazy-loads lemon.js on first use (zero cost on POS / dashboard pages).
 *   2. Guarantees `embed=1` is present on the checkout URL.
 *   3. Bridges Lemon Squeezy's event bus to per-call callbacks.
 *   4. Falls back to a hard redirect if the script cannot load, so a blocked
 *      CDN or an offline terminal can never make checkout unreachable.
 *
 * Usage:
 *   import { openLemonCheckout } from '@/lib/lemonCheckout';
 *   openLemonCheckout(url, { onSuccess: () => router.reload() });
 */

const LEMON_JS_SRC = 'https://app.lemonsqueezy.com/js/lemon.js';
const LOAD_TIMEOUT_MS = 12000;

let loaderPromise = null;

/** Callbacks for the checkout that is currently on screen. */
let activeHandlers = null;

/**
 * Ensure `embed=1` is on the checkout URL so it renders overlay-styled.
 *
 * CRITICAL: API-generated checkouts come back signed
 * (/checkout/custom/{id}?signature=…) and that signature covers the query
 * string. Adding ANY parameter to a signed URL makes Lemon Squeezy reject it
 * with "Invalid signature" (403). Those URLs already carry their display
 * options from the API request body, so they must be passed through untouched.
 *
 * Only unsigned static store URLs (/checkout/buy/{uuid}) get decorated here.
 */
export function toEmbeddableUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;

    try {
        const url = new URL(rawUrl, window.location.origin);

        if (url.searchParams.has('signature')) return rawUrl;

        url.searchParams.set('embed', '1');
        return url.toString();
    } catch {
        // Not parseable (relative/odd URL) — append naively rather than fail,
        // but still never touch something that looks signed.
        if (rawUrl.includes('signature=') || rawUrl.includes('embed=')) return rawUrl;
        return `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}embed=1`;
    }
}

/**
 * Central event handler. Lemon Squeezy emits a single stream of events for the
 * whole page, so we dispatch to whichever checkout is currently open.
 */
function handleLemonEvent(payload) {
    const name = payload?.event ?? payload;
    const handlers = activeHandlers;

    if (!handlers) return;

    if (name === 'Checkout.Success') {
        // The overlay shows Lemon Squeezy's own success screen. Give the user a
        // moment to read it, then hand control back to the app.
        handlers.onSuccess?.(payload?.data ?? null);
        return;
    }

    // Lemon.js has used both names across versions — accept either.
    if (name === 'Checkout.Closed' || name === 'Checkout.Close') {
        activeHandlers = null;
        handlers.onClose?.();
    }
}

/**
 * Inject lemon.js exactly once and resolve with the global LemonSqueezy object.
 */
function loadLemonJs() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return Promise.reject(new Error('lemon.js requires a browser environment'));
    }

    if (window.LemonSqueezy?.Url?.Open) {
        return Promise.resolve(window.LemonSqueezy);
    }

    if (loaderPromise) return loaderPromise;

    loaderPromise = new Promise((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            loaderPromise = null; // allow a later retry
            reject(new Error('lemon.js load timed out'));
        }, LOAD_TIMEOUT_MS);

        const finish = () => {
            if (settled) return;

            // In an SPA the auto-initialiser may have already run before our
            // components mounted, so re-run it explicitly. Safe to call twice.
            try {
                window.createLemonSqueezy?.();
            } catch {
                /* non-fatal — Url.Open still works without the DOM scanner */
            }

            if (!window.LemonSqueezy?.Url?.Open) {
                settled = true;
                clearTimeout(timer);
                loaderPromise = null;
                reject(new Error('lemon.js loaded but did not initialise'));
                return;
            }

            try {
                window.LemonSqueezy.Setup({ eventHandler: handleLemonEvent });
            } catch {
                /* Setup is optional; the overlay still opens without events */
            }

            settled = true;
            clearTimeout(timer);
            resolve(window.LemonSqueezy);
        };

        const existing = document.querySelector(`script[src="${LEMON_JS_SRC}"]`);
        if (existing) {
            if (existing.dataset.loaded === '1') {
                finish();
            } else {
                existing.addEventListener('load', finish, { once: true });
                existing.addEventListener('error', () => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    loaderPromise = null;
                    reject(new Error('lemon.js failed to load'));
                }, { once: true });
            }
            return;
        }

        const script = document.createElement('script');
        script.src = LEMON_JS_SRC;
        script.defer = true;
        script.addEventListener('load', () => {
            script.dataset.loaded = '1';
            finish();
        }, { once: true });
        script.addEventListener('error', () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            loaderPromise = null;
            script.remove();
            reject(new Error('lemon.js failed to load'));
        }, { once: true });

        document.head.appendChild(script);
    });

    return loaderPromise;
}

/**
 * Warm the script up ahead of time so the overlay opens instantly when the
 * user actually clicks. Call this when a billing screen mounts. Never throws.
 */
export function preloadLemonCheckout() {
    loadLemonJs().catch(() => { /* fallback redirect will cover it */ });
}

/**
 * Open a Lemon Squeezy checkout as an overlay on the current page.
 *
 * @param {string} url                Checkout URL (from the server).
 * @param {object} [options]
 * @param {Function} [options.onSuccess]  Fired when payment completes.
 * @param {Function} [options.onClose]    Fired when the overlay is dismissed.
 * @param {Function} [options.onError]    Fired if the overlay could not open.
 * @param {boolean}  [options.redirectOnFailure=true]  Hard-redirect fallback.
 * @returns {Promise<boolean>} true if the overlay opened, false if we fell back.
 */
export async function openLemonCheckout(url, options = {}) {
    const {
        onSuccess,
        onClose,
        onError,
        redirectOnFailure = true,
    } = options;

    if (!url) {
        onError?.(new Error('No checkout URL was provided.'));
        return false;
    }

    const embedUrl = toEmbeddableUrl(url);

    try {
        const lemon = await loadLemonJs();

        activeHandlers = {
            onSuccess: (data) => {
                onSuccess?.(data);
            },
            onClose: () => {
                onClose?.();
            },
        };

        lemon.Url.Open(embedUrl);
        return true;
    } catch (error) {
        activeHandlers = null;
        onError?.(error);

        // Never block a paying customer: fall back to the hosted checkout.
        if (redirectOnFailure) {
            window.location.href = embedUrl;
        }
        return false;
    }
}

/** Programmatically dismiss the overlay (e.g. after a success callback). */
export function closeLemonCheckout() {
    try {
        window.LemonSqueezy?.Url?.Close?.();
    } catch {
        /* already closed */
    }
    activeHandlers = null;
}

export default openLemonCheckout;

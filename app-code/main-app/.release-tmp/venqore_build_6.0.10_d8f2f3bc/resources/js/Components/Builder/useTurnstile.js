/**
 * useTurnstile — a Cloudflare Turnstile token for public POSTs guarded by the
 * `turnstile` middleware (e.g. /workspace/converse/start, /workspace/provision).
 *
 * Without this the builder never sent a token, so the moment a Turnstile
 * secret is configured in production every start call returns 422 and the AI
 * builder dies. The middleware fails open when no key is set, so this hook is
 * a no-op locally (getToken() resolves null).
 *
 * The widget renders with appearance 'interaction-only' into a small fixed
 * container: invisible for almost everyone, a checkbox only when Cloudflare
 * wants a human interaction. Tokens are single-use, so each getToken() hands
 * out the current token and resets the widget for the next call.
 */
import { useCallback, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

const SCRIPT_ID = 'cf-turnstile-script';

function loadScript() {
    return new Promise((resolve) => {
        if (window.turnstile) return resolve(window.turnstile);
        let s = document.getElementById(SCRIPT_ID);
        if (!s) {
            s = document.createElement('script');
            s.id = SCRIPT_ID;
            s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            s.async = true;
            s.defer = true;
            document.head.appendChild(s);
        }
        s.addEventListener('load', () => resolve(window.turnstile));
        s.addEventListener('error', () => resolve(null));
    });
}

export default function useTurnstile() {
    const siteKey = usePage()?.props?.turnstile_site_key || '';
    const widgetId = useRef(null);
    const token = useRef(null);
    const waiters = useRef([]);
    const box = useRef(null);

    useEffect(() => {
        if (!siteKey || typeof window === 'undefined') return undefined;
        let cancelled = false;
        const el = document.createElement('div');
        el.setAttribute('data-tone-ignore', '');
        el.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:900;';
        document.body.appendChild(el);
        box.current = el;
        loadScript().then((ts) => {
            if (cancelled || !ts) return;
            widgetId.current = ts.render(el, {
                sitekey: siteKey,
                appearance: 'interaction-only',
                callback: (t) => {
                    token.current = t;
                    waiters.current.splice(0).forEach((w) => w(t));
                },
                'expired-callback': () => { token.current = null; },
                'error-callback': () => { token.current = null; },
            });
        });
        return () => {
            cancelled = true;
            try { if (widgetId.current !== null) window.turnstile?.remove(widgetId.current); } catch (e) { /* ignore */ }
            el.remove();
        };
    }, [siteKey]);

    /** Resolves a fresh token (or null when Turnstile is not configured / times out). */
    return useCallback(() => {
        if (!siteKey) return Promise.resolve(null);
        const take = (t) => {
            token.current = null;
            try { if (widgetId.current !== null) window.turnstile?.reset(widgetId.current); } catch (e) { /* ignore */ }
            return t;
        };
        if (token.current) return Promise.resolve(take(token.current));
        return new Promise((resolve) => {
            const timer = setTimeout(() => resolve(null), 15000);
            waiters.current.push((t) => { clearTimeout(timer); resolve(take(t)); });
        });
    }, [siteKey]);
}

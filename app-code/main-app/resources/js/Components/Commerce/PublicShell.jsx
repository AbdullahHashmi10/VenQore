import React, { createContext, useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import StorefrontHeader from '@/Components/Commerce/StorefrontHeader';
import SiteHeader from '@/Components/Site/SiteHeader';
import '../../../css/commerce-shop.css';
import { money } from '@/lib/commerce';

const KEY = 'vqs-theme';
const read = () => { try { const v = localStorage.getItem(KEY); if (v === 'light' || v === 'dark') return v; } catch { /* storage blocked */ } return null; };
const device = () => (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

/** Current shopper theme + toggle, for pages that draw their own header (bare mode). */
export const ShellThemeContext = createContext({ theme: 'light', toggle: () => {} });

/** Fire a small confirmation toast from anywhere in the shop. */
export const shopToast = (text) => { try { window.dispatchEvent(new CustomEvent('vqs-toast', { detail: text })); } catch { /* ignore */ } };

function Ambient({ theme }) {
    const ref = useRef(null);
    useEffect(() => {
        const cv = ref.current;
        if (!cv || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return undefined;
        const ctx = cv.getContext('2d');
        let w = 0; let h = 0; let raf = 0; let on = true;
        const rgb = theme === 'dark' ? '35,196,166' : '11,170,143';
        const pts = Array.from({ length: 38 }, () => ({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 2.2, vx: (Math.random() - .5) * .00022, vy: -.00006 - Math.random() * .00022, a: .15 + Math.random() * .5 }));
        const size = () => { const d = Math.min(window.devicePixelRatio || 1, 2); w = cv.clientWidth; h = cv.clientHeight; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
        const tick = () => {
            if (!on) return;
            ctx.clearRect(0, 0, w, h);
            pts.forEach((p) => {
                p.x += p.vx * 16; p.y += p.vy * 16;
                if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); }
                if (p.x < -.02) p.x = 1.02; if (p.x > 1.02) p.x = -.02;
                ctx.beginPath(); ctx.fillStyle = `rgba(${rgb},${p.a})`; ctx.arc(p.x * w, p.y * h, p.r, 0, 6.283); ctx.fill();
            });
            raf = requestAnimationFrame(tick);
        };
        const vis = () => { on = !document.hidden; if (on) { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); } };
        size(); window.addEventListener('resize', size); document.addEventListener('visibilitychange', vis);
        raf = requestAnimationFrame(tick);
        return () => { on = false; cancelAnimationFrame(raf); window.removeEventListener('resize', size); document.removeEventListener('visibilitychange', vis); };
    }, [theme]);
    return <canvas ref={ref} className="vqs-ambient" aria-hidden="true" />;
}

/** The public commerce shell owns document scrolling; the app shell locks it. */
export function useCommerceShell() {
    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const app = document.getElementById('app');
        const prev = {
            shell: html.getAttribute('data-vq-shell'),
            htmlOverflowY: html.style.overflowY,
            htmlOverflowX: html.style.overflowX,
            bodyOverflow: body.style.overflow,
            bodyHeight: body.style.height,
            appHeight: app?.style.height,
            appOverflow: app?.style.overflow,
        };
        html.setAttribute('data-vq-shell', 'commerce');
        html.style.overflowY = 'auto';
        html.style.overflowX = 'clip';
        body.style.overflow = 'visible';
        body.style.height = 'auto';
        if (app) {
            app.style.height = 'auto';
            app.style.overflow = 'visible';
        }
        return () => {
            if (prev.shell) html.setAttribute('data-vq-shell', prev.shell);
            else html.removeAttribute('data-vq-shell');
            html.style.overflowY = prev.htmlOverflowY;
            html.style.overflowX = prev.htmlOverflowX;
            body.style.overflow = prev.bodyOverflow;
            body.style.height = prev.bodyHeight;
            if (app) {
                app.style.height = prev.appHeight;
                app.style.overflow = prev.appOverflow;
            }
        };
    }, []);
}

/** #RRGGBB -> CSS variables that override the template accent. */
function brandVars(hex, theme, hex2) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return undefined;
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const on = lum > 0.62 ? '#14110f' : '#ffffff';
    const mix = (t) => `rgb(${Math.round(r * (1 - t))} ${Math.round(g * (1 - t))} ${Math.round(b * (1 - t))})`;
    const lift = (t) => `rgb(${Math.round(r + (255 - r) * t)} ${Math.round(g + (255 - g) * t)} ${Math.round(b + (255 - b) * t)})`;
    const text = theme === 'dark' ? lift(0.35) : (lum > 0.55 ? mix(0.45) : hex);
    return {
        '--vq-accent': hex, '--vq-accent-fill': hex, '--vq-accent-text': text, '--vq-on-accent': on,
        '--vqs-grad': /^#[0-9a-fA-F]{6}$/.test(hex2 || '') ? `linear-gradient(135deg, ${hex}, ${hex2})` : hex, '--vqs-on-grad': on,
        '--vq-accent-quiet': `rgb(${r} ${g} ${b} / .12)`, '--vq-accent-quiet-line': `rgb(${r} ${g} ${b} / .35)`,
    };
}

/** Shopper shell (VenQore Shops design): uses StorefrontHeader on storefronts, SiteHeader on generic pages. */
export default function PublicShell({ children, title, bag, storeSlug, ratingSummary, customer, catalogueTheme = 'visual-grid', catalogueOnly = false, onsite = false, bare = false, headless = false }) {
    useCommerceShell();
    const brand = usePage().props?.store?.brand_color;
    const brand2 = usePage().props?.store?.brand_color_2;
    const [theme, setTheme] = useState(() => read() || device());
    const [toasts, setToasts] = useState([]);
    const [bump, setBump] = useState(false);
    const prev = useRef(bag?.count ?? 0);

    useEffect(() => {
        if (read()) return undefined;
        const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
        if (!mq) return undefined;
        const f = () => { if (!read()) setTheme(mq.matches ? 'dark' : 'light'); };
        mq.addEventListener?.('change', f);
        return () => mq.removeEventListener?.('change', f);
    }, []);

    useEffect(() => {
        const on = (e) => {
            const id = Date.now() + Math.random();
            setToasts((t) => [...t.slice(-2), { id, text: e.detail, out: false }]);
            setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x))), 2200);
            setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2550);
        };
        window.addEventListener('vqs-toast', on);
        return () => window.removeEventListener('vqs-toast', on);
    }, []);

    useEffect(() => {
        const c = bag?.count ?? 0;
        if (c > prev.current) { setBump(true); const t = setTimeout(() => setBump(false), 600); prev.current = c; return () => clearTimeout(t); }
        prev.current = c; return undefined;
    }, [bag?.count]);

    const toggleTheme = () => setTheme((t) => { const n = t === 'dark' ? 'light' : 'dark'; try { localStorage.setItem(KEY, n); } catch { /* storage blocked */ } return n; });

    // Bare: the page draws its own header, footer and toasts (VenQore storefront design). The account,
    // rating and track-order modals still come from StorefrontHeader, rendered headless.
    if (bare) {
        return (
            <div className={`vqs-shop vqs-shop--bare vqs-template--${catalogueTheme}`} style={brandVars(brand, theme, brand2)} data-theme={theme} data-customer-mode={catalogueOnly ? 'catalogue' : 'ordering'}>
                <ShellThemeContext.Provider value={{ theme, toggle: toggleTheme }}>
                    {children}
                </ShellThemeContext.Provider>
                {storeSlug && headless && <StorefrontHeader headless storeTitle={title} storeSlug={storeSlug} ratingSummary={ratingSummary} customer={customer} />}
            </div>
        );
    }

    return (
        <div className={`vqs-shop vqs-template--${catalogueTheme} ${onsite ? 'vqs-catalogue-studio' : ''}`} style={brandVars(brand, theme, brand2)} data-theme={theme} data-customer-mode={catalogueOnly ? 'catalogue' : 'ordering'}>
            {!onsite && <Ambient theme={theme} />}
            {storeSlug ? (
                <StorefrontHeader
                    bag={bag ? { ...bag, bump } : undefined}
                    storeTitle={title}
                    storeSlug={storeSlug}
                    ratingSummary={ratingSummary}
                    customer={customer}
                    onsite={onsite}
                />
            ) : (
                <SiteHeader
                    bag={bag ? { ...bag, bump } : undefined}
                    storeTitle={title}
                    storeSlug={storeSlug}
                />
            )}
            <main className="vqs-wrap vqs-main" key={title || 'dir'}>{children}</main>
            <footer className="vqs-wrap vqs-foot">
                {onsite ? 'Local catalogue · Orders are sent directly to this business’s POS over its local network.' : catalogueOnly ? 'Prices and availability are set by this business. Contact them to buy or ask about an item.' : <>Orders are requests to the business and are confirmed by them. Prices and availability are set by each business. <Link href="/order-lookup" style={{ textDecoration: 'underline' }}>Lost your order link?</Link></>}
            </footer>
            <div className="vqs-toasts" aria-live="polite">
                {toasts.map((t) => <div key={t.id} className={`vqs-toast ${t.out ? 'out' : ''}`}><span className="ic"><Check size={16} /></span>{t.text}</div>)}
            </div>
        </div>
    );
}

import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Moon, ShoppingBag, Sun, Check, Store } from 'lucide-react';
import '../../../css/commerce-shop.css';
import { SHOP_MARK } from '@/lib/shopMark';
import { money } from '@/lib/commerce';

const KEY = 'vqs-theme';
const read = () => { try { const v = localStorage.getItem(KEY); if (v === 'light' || v === 'dark') return v; } catch { /* storage blocked */ } return null; };
const device = () => (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

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

/** Shopper shell (VenQore Shops design): no merchant navigation, no account chrome. Light + dark. */
export default function PublicShell({ children, title, bag }) {
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

    const flip = () => { const n = theme === 'dark' ? 'light' : 'dark'; setTheme(n); try { localStorage.setItem(KEY, n); } catch { /* ignore */ } };

    return (
        <div className="vqs-shop" data-theme={theme}>
            <Ambient theme={theme} />
            <div className="vqs-strip"><div className="vqs-wrap vqs-strip-in"><b><i className="dot" />VenQore Shops</b><span>Direct from independent businesses · guest checkout · no account needed</span></div></div>
            <header className="vqs-topbar">
                <div className="vqs-wrap vqs-topbar-in" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Link href="/shop" className="vqs-brand" style={{ gap: 12 }}>
                        <span className="vqs-brandmark"><span><img src={SHOP_MARK} alt="" /></span></span>
                        <span className="vqs-brandtext">
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>VenQore <span className="vqs-tag">Storefronts</span></span>
                            <span className="vqs-brandsub">Shop direct from local businesses</span>
                        </span>
                    </Link>
                    <span className="vqs-spacer" />
                    {title && <span className="vqs-crumbpill"><Store size={14} />{title}</span>}
                    <button type="button" className="vqs-iconbtn" onClick={flip} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title={theme === 'dark' ? 'Light theme' : 'Dark theme'}>
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    {bag && (
                        <button type="button" className={`vqs-bagbtn ${bump ? 'bump' : ''}`} onClick={bag.onClick} aria-label={`Open bag, ${bag.count} items`}>
                            <span><ShoppingBag size={17} /><b className={`vqs-bagcount ${bump ? 'bump' : ''}`}>{bag.count}</b></span>
                            <span>{money(bag.total)}</span>
                        </button>
                    )}
                </div>
            </header>
            <main className="vqs-wrap vqs-main" key={title || 'dir'}>{children}</main>
            <footer className="vqs-wrap vqs-foot">
                Orders are requests to the business and are confirmed by them. Prices and availability are set by each business. <Link href="/order-lookup" style={{ textDecoration: 'underline' }}>Lost your order link?</Link>
            </footer>
            <div className="vqs-toasts" aria-live="polite">
                {toasts.map((t) => <div key={t.id} className={`vqs-toast ${t.out ? 'out' : ''}`}><span className="ic"><Check size={16} /></span>{t.text}</div>)}
            </div>
        </div>
    );
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, MessageCircle, Lock, Menu, X, Sun, Moon, ChevronDown } from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';

import { vq } from '@/theme/runtime';
/* ═══════════════════════════════════════════════════════════════════════════
   SHARED MARKETING LAYOUT — Midnight Nebula 2.0 (light/dark aware)

   Header: deliberately minimal. Four grouped entries (Product, Pricing,
   Resources, Company) instead of ten flat links. Every SEO page the header
   used to expose is still one click away — it now lives in a dropdown and
   in the full footer sitemap, so internal link equity is preserved while
   the chrome stays clean.

   Theme: the toggle lives in the header on every page. First-time visitors
   get dark on the landing page (the hero is designed for it) and light on
   every other marketing page; see Contexts/ThemeContext.jsx. Light mode is
   fully art-directed here — aurora blobs, drifting particles and spotlight
   all have first-class light values, not just dimmed dark ones.

   All helper exports below are preserved with identical signatures.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Scroll reveal ───────────────────────────────────────────────────────── */
export function useScrollReveal(options = {}) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el); } },
            { threshold: options.threshold !== undefined ? options.threshold : 0, rootMargin: options.rootMargin || '0px 0px -50px 0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, isVisible];
}

export const RevealOnScroll = ({ children, delay = 0, direction = 'up', className = '', as: Tag = 'div' }) => {
    const [ref, isVisible] = useScrollReveal();
    const transforms = {
        up: 'translateY(40px)', down: 'translateY(-40px)',
        left: 'translateX(40px)', right: 'translateX(-40px)',
        scale: 'scale(0.95)', none: 'none',
    };
    return (
        <Tag ref={ref} className={className} style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'none' : transforms[direction],
            transition: `opacity 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
            willChange: 'opacity, transform',
        }}>
            {children}
        </Tag>
    );
};

/* ── Animated counter ────────────────────────────────────────────────────── */
export const AnimatedCounter = ({ end, suffix = '', prefix = '', duration = 2000 }) => {
    const [count, setCount] = useState(0);
    const [ref, isVisible] = useScrollReveal();
    const hasAnimated = useRef(false);
    useEffect(() => {
        if (!isVisible || hasAnimated.current) return;
        hasAnimated.current = true;
        const startTime = performance.now();
        const animate = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [isVisible, end, duration]);
    return <span ref={ref}>{prefix}{count}{suffix}</span>;
};

/* ── Magnetic button ─────────────────────────────────────────────────────── */
export const MagneticButton = ({ children, href, className = '', variant = 'primary', ...props }) => {
    const btnRef = useRef(null);
    const handleMouseMove = useCallback((e) => {
        const btn = btnRef.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
    }, []);
    const handleMouseLeave = useCallback(() => { if (btnRef.current) btnRef.current.style.transform = ''; }, []);

    const baseClass = variant === 'primary'
        ? 'px-9 py-4 bg-accent-fill text-accent-on font-bold text-[15px] rounded-full shadow-[0_8px_40px_-8px_rgba(15,23,42,0.35)] dark:shadow-[0_8px_40px_-8px_rgba(255,255,255,0.35)] hover:shadow-[0_0_70px_-6px_rgb(var(--vq-ramp-teal-500)/0.4)] dark:hover:shadow-[0_0_70px_-6px_rgb(var(--vq-ramp-teal-400)/0.55)]'
        : variant === 'ghost'
            ? 'px-8 py-4 bg-void-900/[0.04] dark:bg-white/[0.04] border border-void-900/10 dark:border-white/12 text-ink font-bold text-[15px] rounded-full hover:bg-interactive-hover/[0.08] dark:hover:bg-white/[0.08] hover:border-line-strong dark:hover:border-white/25 backdrop-blur-md'
            : 'px-7 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-full shadow-xl ';

    const Tag = href ? Link : 'button';
    return (
        <Tag ref={btnRef} href={href}
            className={`${baseClass} ${className} inline-flex items-center justify-center gap-2.5 cursor-pointer`}
            onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
            style={{ transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease, background 0.3s ease' }}
            {...props}>
            {children}
        </Tag>
    );
};

/* ── Section label ───────────────────────────────────────────────────────── */
// `text` is accepted alongside `children` because seven call sites pass it and
// were rendering an empty pill. Reading both is one line; chasing the call
// sites is seven files that will drift again.
export const SectionLabel = ({ children, text, icon: Icon }) => (
    <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 dark:border-brand-400/20 text-brand-600 dark:text-brand-300 text-2xs font-bold tracking-[0.3em] uppercase mb-8 backdrop-blur-sm">
        {Icon && <Icon size={13} />}
        {children ?? text}
    </div>
);

/* ── Glass card ──────────────────────────────────────────────────────────── */
export const GlassCard = ({ children, className = '', hover = true, padding = 'p-8', ...props }) => (
    <div
        className={`relative ${padding} rounded-xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/[0.07] backdrop-blur-sm ${hover ? 'hover:bg-interactive-hover/[0.05] dark:hover:bg-white/[0.06] hover:border-brand-500/30 dark:hover:border-brand-500/20 hover:shadow-2xl hover:-translate-y-1' : ''} transition-all duration-slower group ${className}`}
        {...props}
    >
        {children}
    </div>
);

/* ── reduced motion ──────────────────────────────────────────────────────── */
function useMkRM() {
    const [r, setR] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const on = () => setR(mq.matches); on();
        mq.addEventListener?.('change', on);
        return () => mq.removeEventListener?.('change', on);
    }, []);
    return r;
}

/* ── scroll progress bar ─────────────────────────────────────────────────── */
const MkScrollProgress = () => {
    const [p, setP] = useState(0);
    useEffect(() => {
        const h = () => { const d = document.documentElement; const max = d.scrollHeight - d.clientHeight; setP(max > 0 ? Math.min(1, window.scrollY / max) : 0); };
        h(); window.addEventListener('scroll', h, { passive: true }); window.addEventListener('resize', h);
        return () => { window.removeEventListener('scroll', h); window.removeEventListener('resize', h); };
    }, []);
    return (
        <div className="fixed top-0 left-0 right-0 z-sticky h-[2px]">
            <div className="h-full w-full origin-left bg-gradient-to-r from-brand-500 via-brand-400 to-cyan-400 transition-transform duration-fast ease-out" style={{ transform: `scaleX(${p})` }} />
        </div>
    );
};

/* ── ambient background (no images — gradient keeps content crisp) ──────────
   Light mode is art-directed, not a dimmed copy of dark. Dark uses luminous
   colour on near-black; light uses saturated colour on a warm paper white,
   with stronger blob alpha (light backgrounds swallow colour, so the same
   numbers that read as "glow" on black read as "nothing" on white) and a
   vignette that darkens toward the edges instead of washing out. */
const MkAmbient = ({ isDarkMode }) => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0" style={{
            background: isDarkMode
                ? 'radial-gradient(120% 95% at 50% -10%, rgb(var(--vq-ramp-teal-950)) 0%, rgb(var(--vq-ramp-ink-950)) 46%, rgb(var(--vq-ramp-ink-950)) 100%)'
                : 'radial-gradient(125% 100% at 50% -12%, rgb(var(--vq-ramp-teal-50)) 0%, rgb(var(--vq-ramp-ink-50)) 38%, rgb(var(--vq-ramp-ink-50)) 72%, rgb(var(--vq-bg)) 100%)',
        }} />
        <div className={`absolute -top-[10%] left-1/2 w-[140vw] h-[85vh] -translate-x-1/2 ${isDarkMode ? 'vqm-beams' : 'vqm-beams-light'}`} />
        <div className="absolute top-[-26%] left-[-16%] w-[52vw] h-[52vw] rounded-full blur-[190px] vqm-blob" style={{ background: `radial-gradient(circle, rgb(var(--vq-ramp-teal-500) / ${isDarkMode ? 0.15 : 0.22}), transparent 62%)` }} />
        <div className="absolute top-[-22%] right-[-16%] w-[48vw] h-[48vw] rounded-full blur-[190px] vqm-blob2" style={{ background: `radial-gradient(circle, rgb(var(--vq-ramp-teal-400) / ${isDarkMode ? 0.12 : 0.18}), transparent 62%)` }} />
        <div className="absolute bottom-[-28%] left-[28%] w-[46vw] h-[46vw] rounded-full blur-[210px] vqm-blob" style={{ background: `radial-gradient(circle, rgb(var(--vq-ramp-sky-400) / ${isDarkMode ? 0.07 : 0.14}), transparent 62%)` }} />
        {!isDarkMode && (
            <div className="absolute top-[18%] right-[6%] w-[34vw] h-[34vw] rounded-full blur-[200px] vqm-blob2" style={{ background: 'radial-gradient(circle, rgb(var(--vq-ramp-lime-400) / 0.10), transparent 64%)' }} />
        )}
        <div className={`absolute inset-0 vqm-grid ${isDarkMode ? 'opacity-[0.35]' : 'opacity-[0.65]'}`} />
        <div className="absolute inset-0" style={{
            background: isDarkMode
                ? 'radial-gradient(95% 75% at 50% 40%, rgb(var(--vq-ramp-ink-950) / 0) 0%, rgb(var(--vq-ramp-ink-950) / 0.5) 100%)'
                : 'radial-gradient(100% 80% at 50% 34%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.10) 52%, rgb(var(--vq-ramp-teal-500) / 0.06) 100%)',
        }} />
        <div className={`absolute inset-0 vqm-grain ${isDarkMode ? 'opacity-[0.3]' : 'opacity-[0.18]'}`} />
    </div>
);

/** `#59dbc0` -> `rgba(89,219,192,` — canvas cannot resolve a CSS custom property. */
const triplet = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},`;
};

/* ── particle field ──────────────────────────────────────────────────────── */
const MkParticles = ({ isDarkMode }) => {
    const reduced = useMkRM();
    const canvasRef = useRef(null);
    useEffect(() => {
        if (reduced || window.matchMedia('(pointer: coarse)').matches) return;
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w, h, raf = 0, parts = [], running = true;
        // Light mode needs deeper, larger, more opaque motes — a 0.3-alpha
        // indigo dot vanishes on white but glows on black. These are tuned
        // by eye so both themes read as the same "drifting stars" idea.
        const COLORS = isDarkMode
            ? [triplet(vq.teal[300]), triplet(vq.sky[300]), triplet(vq.lime[300])]
            : [triplet(vq.teal[600]), triplet(vq.sky[600]), triplet(vq.lime[600])];
        const resize = () => {
            w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight;
            const count = Math.min(60, Math.floor(w / 32));
            parts = Array.from({ length: count }, () => ({
                x: Math.random() * w, y: Math.random() * h,
                r: Math.random() * (isDarkMode ? 1.5 : 1.9) + (isDarkMode ? 0.4 : 0.6),
                vy: -(Math.random() * 0.2 + 0.05), vx: (Math.random() - 0.5) * 0.1,
                a: Math.random() * (isDarkMode ? 0.3 : 0.34) + (isDarkMode ? 0.06 : 0.12),
                c: COLORS[(Math.random() * COLORS.length) | 0], tw: Math.random() * Math.PI * 2,
            }));
        };
        const draw = () => {
            if (!running) return;
            ctx.clearRect(0, 0, w, h);
            for (const p of parts) {
                p.y += p.vy; p.x += p.vx; p.tw += 0.02;
                if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
                if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
                const a = p.a * (0.55 + 0.45 * Math.sin(p.tw));
                ctx.beginPath(); ctx.fillStyle = p.c + a.toFixed(3) + ')'; ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
            }
            raf = requestAnimationFrame(draw);
        };
        const onVis = () => { running = !document.hidden; if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } };
        resize(); draw();
        window.addEventListener('resize', resize); document.addEventListener('visibilitychange', onVis);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVis); };
    }, [reduced, isDarkMode]);
    if (reduced) return null;
    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 hidden md:block" style={{ opacity: isDarkMode ? 0.5 : 0.7 }} />;
};

/* ── cursor spotlight ────────────────────────────────────────────────────── */
const MkSpotlight = ({ isDarkMode }) => {
    const reduced = useMkRM();
    const ref = useRef(null);
    useEffect(() => {
        if (reduced || window.matchMedia('(pointer: coarse)').matches) return;
        const el = ref.current; let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
        const move = (e) => { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); };
        const loop = () => {
            cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
            if (el) el.style.transform = `translate(${cx}px, ${cy}px)`;
            raf = Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(loop) : 0;
        };
        window.addEventListener('pointermove', move, { passive: true });
        return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
    }, [reduced]);
    if (reduced) return null;
    return (
        <div className="fixed inset-0 pointer-events-none z-base hidden md:block">
            <div ref={ref} className="absolute -left-[300px] -top-[300px] w-[600px] h-[600px] rounded-full" style={{ background: `radial-gradient(circle, rgb(var(--vq-ramp-teal-500) / ${isDarkMode ? 0.06 : 0.10}), transparent 60%)` }} />
        </div>
    );
};

/* ── theme toggle switch (matches Profile/Edit.jsx dark-mode toggle) ──────── */
const ThemeToggle = ({ isDarkMode, onToggle, compact = false }) => (
    <button
        type="button"
        onClick={onToggle}
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`relative ${compact ? 'w-11 h-6' : 'w-14 h-7'} rounded-full transition-all duration-slow shrink-0 ${isDarkMode ? 'bg-brand-600 shadow-lg ' : 'bg-sunken'}`}
    >
        <div className={`absolute top-1 ${compact ? 'w-4 h-4' : 'w-5 h-5'} bg-white rounded-full shadow-sm transition-all duration-slow flex items-center justify-center ${isDarkMode ? (compact ? 'left-6' : 'left-8') : 'left-1'}`}>
            {isDarkMode ? <Moon size={compact ? 10 : 12} className="text-brand-600" /> : <Sun size={compact ? 10 : 12} className="text-amber-500" />}
        </div>
    </button>
);

const isExceptionPath = (pathname = '') => {
    const prefixes = ['/tools', '/blog', '/docs', '/documentation'];
    return prefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SITE MAP — single source of truth for header dropdowns, the footer sitemap
   and the RelatedPages block. Add a marketing page here once and it is
   automatically reachable and internally linked from every surface.
   ═══════════════════════════════════════════════════════════════════════════ */
export const SITE = {
    product: [
        { label: 'Point of Sale', href: '/features/point-of-sale', desc: 'Fast, offline-capable terminal' },
        { label: 'Inventory (FIFO)', href: '/features/inventory-management', desc: 'Batches, serials, real costing' },
        { label: 'Accounting', href: '/features/accounting', desc: 'True double-entry ledger' },
        { label: 'Offline POS', href: '/features/offline-pos', desc: 'Keep selling with no internet' },
        { label: 'Growth Engine', href: '/features/growth-engine', desc: 'Campaigns, loyalty, retention' },
        { label: 'All features', href: '/features', desc: 'The complete capability map' },
    ],
    solutions: [
        { label: 'Pharmacy', href: '/solutions/pharmacy' },
        { label: 'Grocery', href: '/solutions/grocery' },
        { label: 'Electronics', href: '/solutions/electronics-store' },
        { label: 'Clothing', href: '/solutions/clothing' },
        { label: 'Wholesale', href: '/solutions/wholesale' },
        { label: 'Multi-store', href: '/solutions/multi-store' },
    ],
    compare: [
        { label: 'VenQore vs Square', href: '/compare/venqore-vs-square' },
        { label: 'VenQore vs Vyapar', href: '/compare/venqore-vs-vyapar' },
        { label: 'All comparisons', href: '/compare' },
    ],
    resources: [
        { label: 'Free tools', href: '/tools', desc: 'Invoices, barcodes, calculators' },
        { label: 'Documentation', href: '/docs', desc: 'Guides and how-tos' },
        { label: 'Blog', href: '/blog', desc: 'Retail and accounting playbooks' },
        { label: 'Roadmap', href: '/roadmap', desc: 'What ships next' },
        { label: 'Live demo', href: '/demo', desc: 'Try it with sample data' },
    ],
    // Pricing deliberately lives ONLY as a top-level header item. Listing it
    // here too made both the "Pricing" pill and the "Company" pill light up
    // on /pricing, which read as a bug.
    company: [
        { label: 'About', href: '/about' },
        { label: 'Partners', href: '/partners' },
        { label: 'Contact', href: '/contact' },
        { label: 'Newsletter', href: '/subscribe' },
    ],
    comingSoon: [
        { label: 'VenSynQ', href: '/vensynq', desc: 'Multi-channel stock sync' },
        { label: 'SmartCapture', href: '/smartcapture', desc: 'Photo & voice to ledger' },
    ],
    legal: [
        { label: 'Terms', href: '/terms' },
        { label: 'Privacy', href: '/privacy' },
        { label: 'Refunds', href: '/refund-policy' },
    ],
};

/* Header groups — four entries, that is the whole header. Everything else
   lives inside these panels or in the footer sitemap. */
const NAV_GROUPS = [
    {
        key: 'product',
        label: 'Product',
        columns: [
            { heading: 'Capabilities', items: SITE.product },
            { heading: 'By industry', items: SITE.solutions, footerLink: { label: 'All solutions', href: '/solutions' } },
        ],
    },
    { key: 'pricing', label: 'Pricing', href: '/pricing' },
    {
        key: 'resources',
        label: 'Resources',
        columns: [
            { heading: 'Learn & use', items: SITE.resources },
            { heading: 'Compare', items: SITE.compare },
        ],
    },
    {
        key: 'company',
        label: 'Company',
        columns: [
            { heading: 'VenQore', items: SITE.company },
            { heading: 'Coming soon', items: SITE.comingSoon },
        ],
    },
];

/* ── header dropdown ─────────────────────────────────────────────────────── */
const NavDropdown = ({ group, isOpen, onOpen, onClose, isActive }) => {
    const closeTimer = useRef(null);

    const open = () => { clearTimeout(closeTimer.current); onOpen(group.key); };
    // Small grace period so diagonal mouse travel into the panel doesn't
    // slam it shut — the classic "menu closes before you reach it" bug.
    const close = () => { closeTimer.current = setTimeout(onClose, 140); };
    useEffect(() => () => clearTimeout(closeTimer.current), []);

    return (
        <div className="relative" onMouseEnter={open} onMouseLeave={close}>
            <button
                type="button"
                onClick={() => (isOpen ? onClose() : onOpen(group.key))}
                aria-expanded={isOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1.5 px-4 py-2 text-1xs font-bold uppercase tracking-[0.18em] rounded-full transition-colors duration-slow ${
                    isOpen || isActive
                        ? 'text-ink bg-sunken dark:bg-white/[0.10]'
                        : 'text-ink-muted hover:text-ink dark:hover:text-white hover:bg-interactive-hover/[0.04] dark:hover:bg-white/[0.04]'
                }`}
            >
                {group.label}
                <ChevronDown size={13} className={`transition-transform duration-slow ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div
                className={`absolute left-1/2 -translate-x-1/2 top-full pt-3 transition-all duration-normal ${
                    isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'
                }`}
            >
                <div className="w-[min(38rem,92vw)] p-6 rounded-2xl bg-white/95 dark:bg-void-900/95 backdrop-blur-2xl border border-line dark:border-white/[0.08] shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)] dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {group.columns.map((col) => (
                            <div key={col.heading}>
                                <p className="text-3xs font-bold uppercase tracking-[0.25em] text-ink-muted mb-3 px-3">
                                    {col.heading}
                                </p>
                                <div className="space-y-0.5">
                                    {col.items.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onClose}
                                            className="block px-3 py-2 rounded-xl hover:bg-interactive-hover/[0.04] dark:hover:bg-white/[0.05] transition-colors group/item"
                                        >
                                            <span className="block text-sm font-bold text-ink group-hover/item:text-brand-600 dark:group-hover/item:text-brand-300 transition-colors">
                                                {item.label}
                                            </span>
                                            {item.desc && (
                                                <span className="block text-2xs text-ink-muted mt-0.5 leading-snug">
                                                    {item.desc}
                                                </span>
                                            )}
                                        </Link>
                                    ))}
                                    {col.footerLink && (
                                        <Link
                                            href={col.footerLink.href}
                                            onClick={onClose}
                                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-2 text-2xs font-bold uppercase tracking-[0.15em] text-brand-600 dark:text-brand-300 hover:gap-2.5 transition-all"
                                        >
                                            {col.footerLink.label} <ArrowRight size={11} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── mobile accordion group ──────────────────────────────────────────────── */
const MobileNavGroup = ({ group, onNavigate }) => {
    const [open, setOpen] = useState(false);

    if (group.href) {
        return (
            <Link
                href={group.href}
                onClick={onNavigate}
                className="block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-ink-secondary hover:bg-interactive-hover/[0.04] dark:hover:bg-white/[0.05] transition-colors"
            >
                {group.label}
            </Link>
        );
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-ink-secondary hover:bg-interactive-hover/[0.04] dark:hover:bg-white/[0.05] transition-colors"
            >
                {group.label}
                <ChevronDown size={15} className={`transition-transform duration-slow ${open ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-slow ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="pl-3 pb-2 pt-1 space-y-3">
                        {group.columns.map((col) => (
                            <div key={col.heading}>
                                <p className="text-3xs font-bold uppercase tracking-[0.25em] text-ink-muted px-4 mb-1">
                                    {col.heading}
                                </p>
                                {col.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        className="block px-4 py-2 rounded-lg text-sm font-medium text-ink-muted hover:text-ink dark:hover:text-white hover:bg-interactive-hover/[0.03] dark:hover:bg-white/[0.04] transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                                {col.footerLink && (
                                    <Link
                                        href={col.footerLink.href}
                                        onClick={onNavigate}
                                        className="block px-4 py-2 rounded-lg text-sm font-bold text-brand-600 dark:text-brand-300"
                                    >
                                        {col.footerLink.label} →
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── related pages block ─────────────────────────────────────────────────────
   Drop this in just above the footer on any SEO page to hand the reader
   (and the crawler) the next three or four logical destinations. */
export const RelatedPages = ({ title = 'Keep exploring', items = [], className = '' }) => {
    if (!items.length) return null;
    return (
        <section className={`px-6 pb-24 relative z-10 ${className}`}>
            <div className="max-w-6xl mx-auto">
                <div className="flex items-end justify-between gap-4 mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">{title}</h2>
                    <div className="hidden sm:block flex-1 h-px bg-sunken dark:bg-white/[0.08]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group p-6 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/[0.07] hover:border-brand-500/30 hover:bg-interactive-hover/[0.04] dark:hover:bg-white/[0.05] hover:-translate-y-1 transition-all duration-slow"
                        >
                            {item.eyebrow && (
                                <span className="block text-3xs font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400 mb-3">
                                    {item.eyebrow}
                                </span>
                            )}
                            <span className="block text-base font-bold text-ink mb-2 leading-snug">
                                {item.label}
                            </span>
                            {item.desc && (
                                <span className="block text-sm text-ink-muted leading-relaxed mb-4">
                                    {item.desc}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.15em] text-ink-secondary group-hover:gap-3 group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-all">
                                Read more <ArrowRight size={11} />
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ── breadcrumb-free inline link helper ──────────────────────────────────────
   Use for in-copy contextual links so they are visually consistent site-wide. */
export const InlineLink = ({ href, children, className = '' }) => (
    <Link
        href={href}
        className={`font-semibold text-brand-600 dark:text-brand-300 underline decoration-brand-500/30 underline-offset-4 hover:decoration-brand-500 transition-colors ${className}`}
    >
        {children}
    </Link>
);

/* ═══════════════════════════════════════════════════════════════════════════
   LAYOUT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function MarketingLayout({ children, title, description }) {
    const { props } = usePage();
    const settings = props.settings || {};
    const appName = settings.app_name || 'VenQore';
    /**
     * PUBLIC PAGES ONLY. `/images/logo.png` is 668 KB and was being fetched
     * twice per page (header + footer) on every marketing route — a real LCP
     * penalty on the exact pages we want Google to like. `/images/venqore-icon.png`
     * is the same mark at 24 KB.
     *
     * A tenant's own uploaded `logo_url` still wins, and the authenticated app,
     * dashboard, print templates and PWA icons are untouched — they keep using
     * the original asset.
     */
    const logo = settings.logo_url || '/images/venqore-icon.png';
    const { isDarkMode, toggleTheme } = useTheme();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const [openGroup, setOpenGroup] = useState(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    /*
       The authenticated app is a fixed-viewport shell — app.css locks
       html/body/#app to overflow:hidden so each screen scrolls internally.
       This is the public site: a normal long page with no internal scroll
       container. Marking <html> for the lifetime of every marketing page
       lifts that lock (see app.css) and restores it automatically the
       moment Inertia navigates back into the authenticated app.
    */
    useEffect(() => {
        const html = document.documentElement;
        html.setAttribute('data-vq-shell', 'marketing');
        return () => html.removeAttribute('data-vq-shell');
    }, []);

    // Esc closes any open dropdown; clicking outside the nav does too.
    useEffect(() => {
        if (!openGroup) return;
        const onKey = (e) => { if (e.key === 'Escape') setOpenGroup(null); };
        const onClick = (e) => { if (!e.target.closest('[data-vq-nav]')) setOpenGroup(null); };
        document.addEventListener('keydown', onKey);
        document.addEventListener('click', onClick);
        return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); };
    }, [openGroup]);

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    // A group is "active" when the current URL lives anywhere inside it.
    const groupIsActive = (group) => {
        if (group.href) return currentPath === group.href;
        return group.columns.some((col) =>
            col.items.some((i) => currentPath === i.href || (i.href !== '/' && currentPath.startsWith(i.href + '/')))
            || (col.footerLink && currentPath.startsWith(col.footerLink.href))
        );
    };

    return (
        <div className="min-h-screen bg-app text-ink font-sans selection:bg-brand-500/30 dark:selection:bg-brand-500/40 overflow-x-clip antialiased transition-colors duration-slow">
            <Head>
                <title>{title || `${appName}`}</title>
                {description && <meta name="description" content={description} />}
                <meta name="theme-color" content={isDarkMode ? vq.void[900] : vq.slate[50]} />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            </Head>

            <MkScrollProgress />
            <MkAmbient isDarkMode={isDarkMode} />
            <MkParticles isDarkMode={isDarkMode} />
            <MkSpotlight isDarkMode={isDarkMode} />

            {/* Navigation */}
            <nav data-vq-nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-slower ${scrolled || openGroup ? 'bg-white/80 dark:bg-void-900/80 backdrop-blur-2xl border-b border-line dark:border-white/[0.06] py-3' : 'py-5'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2">
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 shrink">
                        <img src={logo} alt={appName} width="36" height="36" fetchpriority="high" decoding="async" className="h-8 sm:h-9 w-auto shrink-0 transition-transform duration-slow" />
                        <span className="font-bold text-ink text-base sm:text-lg uppercase tracking-tighter truncate" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{appName}</span>
                    </Link>
                    <div className="hidden lg:flex items-center gap-1">
                        {NAV_GROUPS.map(group => (
                            group.href ? (
                                <Link key={group.key} href={group.href}
                                    className={`px-4 py-2 text-1xs font-bold uppercase tracking-[0.18em] transition-colors duration-slow rounded-full ${currentPath === group.href ? 'text-ink bg-sunken dark:bg-white/[0.10]' : 'text-ink-muted hover:text-ink dark:hover:text-white hover:bg-interactive-hover/[0.04] dark:hover:bg-white/[0.04]'}`}>
                                    {group.label}
                                </Link>
                            ) : (
                                <NavDropdown
                                    key={group.key}
                                    group={group}
                                    isOpen={openGroup === group.key}
                                    isActive={groupIsActive(group)}
                                    onOpen={setOpenGroup}
                                    onClose={() => setOpenGroup(null)}
                                />
                            )
                        ))}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {isExceptionPath(currentPath) && <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} compact />}
                        <Link href="/login" className="hidden sm:block px-5 py-2.5 text-1xs font-bold uppercase tracking-[0.2em] text-ink-muted hover:text-ink dark:hover:text-white transition-colors">Sign In</Link>
                        <Link href="/register" className="px-4 sm:px-6 py-2 sm:py-2.5 bg-accent-fill text-accent-on rounded-full text-2xs sm:text-1xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] whitespace-nowrap transition-all hover:shadow-[0_0_40px_-6px_rgb(var(--vq-ramp-teal-500)/0.4)] dark:hover:shadow-[0_0_40px_-6px_rgba(255,255,255,0.5)]">Start Free</Link>
                        <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 -mr-1 text-ink-secondary hover:text-ink dark:hover:text-white transition-colors" aria-label="Menu" aria-expanded={mobileMenu}>
                            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
                <div className={`lg:hidden overflow-hidden transition-all duration-slower ${mobileMenu ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-4 sm:px-6 py-6 space-y-1 max-h-[78vh] overflow-y-auto bg-white/95 dark:bg-void-900/95 backdrop-blur-2xl border-t border-line dark:border-white/[0.06]">
                        {NAV_GROUPS.map(group => (
                            <MobileNavGroup key={group.key} group={group} onNavigate={() => setMobileMenu(false)} />
                        ))}
                        <div className="pt-3 mt-3 border-t border-line dark:border-white/[0.06] sm:hidden">
                            <Link href="/login" onClick={() => setMobileMenu(false)}
                                className="block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-ink-muted hover:text-ink dark:hover:text-white hover:bg-interactive-hover/[0.04] dark:hover:bg-white/[0.04] transition-colors">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10">{children}</main>

            {/* Footer */}
            <footer className="border-t border-line dark:border-white/[0.06] pt-24 pb-12 px-6 relative z-10 bg-app">
                {/* Brand + CTA rail */}
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
                    <div className="lg:col-span-5">
                        <Link href="/" className="flex items-center gap-3 mb-8">
                            <img src={logo} alt={appName} width="40" height="40" loading="lazy" decoding="async" className="h-10 w-auto" />
                            <span className="font-bold text-ink text-xl uppercase tracking-tighter" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{appName}</span>
                        </Link>
                        <p className="text-ink-muted max-w-sm leading-relaxed text-sm mb-8 font-medium">
                            Run your business, not your software. The all-in-one operating system for point of sale, inventory, and real accounting.
                        </p>
                        <a href="https://wa.me/923091999489" aria-label="Chat on WhatsApp" className="inline-flex p-3 rounded-xl bg-sunken dark:bg-white/5 border border-line dark:border-white/5 text-ink-muted hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all duration-slow">
                            <MessageCircle size={18} />
                        </a>
                    </div>
                    <div className="lg:col-span-7 lg:justify-self-end lg:text-right">
                        <h4 className="text-2xs font-bold text-ink-secondary uppercase tracking-[0.3em] mb-4">Start today</h4>
                        <p className="text-ink-muted text-sm mb-6 leading-relaxed max-w-xs lg:ml-auto">
                            14-day trial. No credit card. Your data stays yours.
                        </p>
                        <div className="flex flex-wrap lg:justify-end gap-3">
                            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-full text-2xs font-bold uppercase tracking-[0.15em] transition-all shadow-lg ">
                                Get Started <ArrowRight size={12} />
                            </Link>
                            <Link href="/demo" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-line dark:border-white/12 text-ink-secondary text-2xs font-bold uppercase tracking-[0.15em] hover:bg-interactive-hover/[0.04] dark:hover:bg-white/[0.05] transition-all">
                                Live Demo
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Full sitemap — the header is minimal, so this is where every
                    SEO page stays crawlable and one click from anywhere. */}
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-10 mb-16 pt-12 border-t border-line dark:border-white/[0.06]">
                    {[
                        { heading: 'Capabilities', links: SITE.product },
                        { heading: 'By industry', links: [...SITE.solutions, { label: 'All solutions', href: '/solutions' }] },
                        { heading: 'Resources', links: SITE.resources },
                        { heading: 'Compare', links: SITE.compare },
                        // Pricing is header-only in the nav, but the footer is the
                        // full sitemap, so it belongs here.
                        { heading: 'Company', links: [{ label: 'Pricing', href: '/pricing' }, ...SITE.company, ...SITE.comingSoon] },
                    ].map(col => (
                        <div key={col.heading}>
                            <h4 className="text-2xs font-bold text-ink-secondary uppercase tracking-[0.3em] mb-5">{col.heading}</h4>
                            <ul className="space-y-3">
                                {col.links.map(l => (
                                    <li key={l.href}>
                                        <Link href={l.href} className="text-sm text-ink-muted hover:text-ink dark:hover:text-white transition-colors font-medium">
                                            {l.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-line dark:border-white/[0.06]">
                    <span className="text-ink-muted text-2xs font-bold uppercase tracking-[0.2em]">© 2026 {appName}. All rights reserved.</span>
                    <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-2xs font-bold uppercase tracking-[0.15em] text-ink-muted">
                        {SITE.legal.map(l => (
                            <Link key={l.href} href={l.href} className="hover:text-ink dark:hover:text-neutral-300 transition-colors">{l.label}</Link>
                        ))}
                    </div>
                </div>
            </footer>

            {/* Motion system */}
            <style>{`
                * { font-family: 'Inter','Figtree',system-ui,sans-serif; }
                h1,h2,h3,h4,h5,h6,.font-display { font-family: 'Space Grotesk','Inter',system-ui,sans-serif; }
                html { scroll-behavior: smooth; }
                .tabular-nums { font-variant-numeric: tabular-nums; }

                @keyframes vqm-blob { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(3%,2%) scale(1.06);} }
                .vqm-blob { animation: vqm-blob 18s ease-in-out infinite; }
                .vqm-blob2 { animation: vqm-blob 22s ease-in-out infinite 3s; }
                .vqm-beams {
                    background: conic-gradient(from 90deg at 50% 0%,
                        transparent 0deg, rgb(var(--vq-ramp-teal-500) / 0.07) 10deg, transparent 22deg,
                        transparent 44deg, rgb(var(--vq-ramp-teal-400) / 0.06) 56deg, transparent 70deg,
                        transparent 104deg, rgb(var(--vq-ramp-teal-500) / 0.05) 118deg, transparent 134deg);
                    filter: blur(22px); transform-origin: 50% 0%;
                    animation: vqm-beamspin 26s ease-in-out infinite;
                }
                /* Light-mode beams: same sweep, deeper pigment so the shafts
                   are actually perceivable against a white page. */
                .vqm-beams-light {
                    background: conic-gradient(from 90deg at 50% 0%,
                        transparent 0deg, rgb(var(--vq-ramp-teal-500) / 0.13) 10deg, transparent 22deg,
                        transparent 44deg, rgb(var(--vq-ramp-teal-400) / 0.11) 56deg, transparent 70deg,
                        transparent 104deg, rgb(var(--vq-ramp-teal-600) / 0.09) 118deg, transparent 134deg);
                    filter: blur(26px); transform-origin: 50% 0%;
                    animation: vqm-beamspin 26s ease-in-out infinite;
                }
                @keyframes vqm-beamspin { 0%,100%{transform:translateX(-50%) rotate(-7deg);} 50%{transform:translateX(-50%) rotate(7deg);} }
                .vqm-grid { background-image:
                    linear-gradient(rgb(var(--vq-ramp-teal-500) / 0.055) 1px,transparent 1px),
                    linear-gradient(90deg,rgb(var(--vq-ramp-teal-500) / 0.055) 1px,transparent 1px);
                    background-size: 64px 64px;
                    mask-image: radial-gradient(120% 90% at 50% 0%, #000 0%, transparent 78%);
                    -webkit-mask-image: radial-gradient(120% 90% at 50% 0%, #000 0%, transparent 78%); }
                .dark .vqm-grid { background-image:
                    linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),
                    linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px);
                    mask-image: none; -webkit-mask-image: none; }
                .vqm-grain { background-image: url('/images/noise.svg'); background-repeat: repeat; }

                @keyframes vq-pulse-slow { 0%,100% { opacity:.15; transform:scale(1); } 50% { opacity:.25; transform:scale(1.05); } }
                .vq-pulse-slow { animation: vq-pulse-slow 12s ease-in-out infinite; }
                .vq-pulse-slow-delay { animation: vq-pulse-slow 14s ease-in-out infinite 3s; }
                @keyframes vq-float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
                .vq-float { animation: vq-float 6s ease-in-out infinite; }
                .vq-float-delay { animation: vq-float 6s ease-in-out infinite 2s; }
                @keyframes vq-shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
                .vq-shimmer { background-size:200% auto; animation: vq-shimmer 4s linear infinite; }
                @keyframes vq-blink { 0%,100%{opacity:1;} 50%{opacity:.25;} }
                .vq-blink { animation: vq-blink 1.6s ease-in-out infinite; }
                @keyframes vq-border-glow { 0%,100% { border-color: rgb(var(--vq-ramp-teal-500) / 0.1); } 50% { border-color: rgb(var(--vq-ramp-teal-500) / 0.3); } }
                .vq-border-glow { animation: vq-border-glow 4s ease-in-out infinite; }
                @keyframes vq-gradient-shift { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
                .vq-gradient-shift { background-size:200% 200%; animation: vq-gradient-shift 8s ease infinite; }

                /*
                   V6's identity is one hue — teal, mint-on-pine (see
                   resources/css/venqore-v6/tokens/colors.css). This used to
                   be a three-stop indigo/violet/cyan gradient left over from
                   the pre-V6 "Midnight Nebula" palette; --vq-indigo-* and
                   --vq-violet-* are old-system aliases that the V6 generator
                   now points at teal and plum respectively (see
                   resources/css/theme.generated.css), which is why only part
                   of this gradient looked "fixed" — indigo landed on brand
                   teal, violet landed on plum (a real V6 colour, but not this
                   component's colour), and the #0891b2/#22d3ee cyan stops
                   were never tokens at all. Single definition now, on-brand
                   in both modes, no duplicate elsewhere.
                */
                .vq-headline-grad {
                    background: linear-gradient(100deg, rgb(var(--vq-ramp-teal-600)) 0%, rgb(var(--vq-ramp-teal-400)) 50%, rgb(var(--vq-ramp-teal-600)) 100%);
                    -webkit-background-clip: text; background-clip: text; color: transparent;
                    background-size: 200% auto; animation: vq-shimmer 6s linear infinite;
                }
                .dark .vq-headline-grad {
                    background: linear-gradient(100deg, rgb(var(--vq-ramp-teal-400)) 0%, rgb(var(--vq-ramp-teal-300)) 50%, rgb(var(--vq-ramp-teal-400)) 100%);
                    -webkit-background-clip: text; background-clip: text; color: transparent;
                    background-size: 200% auto;
                }
                /* rgba(99,102,241,*) was Tailwind indigo-500 — off-brand. Retinted to V6 teal. */
                .vq-text-glow { text-shadow: none; }
                .dark .vq-text-glow { text-shadow: 0 0 80px rgb(var(--vq-ramp-teal-500) / 0.4); }
                .vq-text-glow-strong { text-shadow: none; }
                .dark .vq-text-glow-strong { text-shadow: 0 0 120px rgb(var(--vq-ramp-teal-500) / 0.6), 0 0 40px rgb(var(--vq-ramp-teal-500) / 0.2); }

                .no-scrollbar::-webkit-scrollbar { display:none; }
                .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
                .vq-grid-pattern { background-image: linear-gradient(rgb(var(--vq-ramp-teal-500) / 0.04) 1px,transparent 1px), linear-gradient(90deg,rgb(var(--vq-ramp-teal-500) / 0.04) 1px,transparent 1px); background-size:60px 60px; }
                .dark .vq-grid-pattern { background-image: linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px); }
                .vq-dot-pattern { background-image: radial-gradient(rgb(var(--vq-ramp-teal-500) / 0.08) 1px,transparent 1px); background-size:30px 30px; }
                .dark .vq-dot-pattern { background-image: radial-gradient(rgba(255,255,255,0.05) 1px,transparent 1px); }

                ::-webkit-scrollbar { width:10px; }
                ::-webkit-scrollbar-track { background:transparent; }
                ::-webkit-scrollbar-thumb { background:rgb(var(--vq-ramp-teal-500) / 0.25); border-radius:10px; }
                ::-webkit-scrollbar-thumb:hover { background:rgb(var(--vq-ramp-teal-500) / 0.4); }

                @media (prefers-reduced-motion: reduce) {
                    *, *::before, *::after { animation-duration:0.001ms !important; animation-iteration-count:1 !important; transition-duration:0.001ms !important; }
                }
`}</style>
        </div>
    );
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, MessageCircle, Lock, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED MARKETING LAYOUT — Midnight Nebula 2.0 (now light/dark aware)
   Background, nav and footer now carry dark: variants and read/write the
   same ThemeContext (localStorage 'amd_theme') used by the authenticated
   app, so a visitor's preference follows them across the whole site,
   marketing pages and tools included. Toggle lives in the header.
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
            { threshold: options.threshold || 0.12, rootMargin: options.rootMargin || '0px 0px -60px 0px' }
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
        ? 'px-9 py-4 bg-slate-900 dark:bg-white text-white dark:text-[#05030f] font-black text-[15px] rounded-full shadow-[0_8px_40px_-8px_rgba(15,23,42,0.35)] dark:shadow-[0_8px_40px_-8px_rgba(255,255,255,0.35)] hover:shadow-[0_0_70px_-6px_rgba(99,102,241,0.4)] dark:hover:shadow-[0_0_70px_-6px_rgba(165,180,252,0.55)]'
        : variant === 'ghost'
            ? 'px-8 py-4 bg-slate-900/[0.04] dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/12 text-slate-900 dark:text-white font-bold text-[15px] rounded-full hover:bg-slate-900/[0.08] dark:hover:bg-white/[0.08] hover:border-slate-900/25 dark:hover:border-white/25 backdrop-blur-md'
            : 'px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-full shadow-xl shadow-indigo-600/25';

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
export const SectionLabel = ({ children, icon: Icon }) => (
    <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 dark:border-indigo-400/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-black tracking-[0.3em] uppercase mb-8 backdrop-blur-sm">
        {Icon && <Icon size={13} />}
        {children}
    </div>
);

/* ── Glass card ──────────────────────────────────────────────────────────── */
export const GlassCard = ({ children, className = '', hover = true, padding = 'p-8', ...props }) => (
    <div
        className={`relative ${padding} rounded-[2rem] bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.07] dark:border-white/[0.07] backdrop-blur-sm ${hover ? 'hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] hover:border-indigo-500/30 dark:hover:border-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-900/5 dark:hover:shadow-indigo-900/10 hover:-translate-y-1' : ''} transition-all duration-500 group ${className}`}
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
        <div className="fixed top-0 left-0 right-0 z-[60] h-[2px]">
            <div className="h-full w-full origin-left bg-gradient-to-r from-indigo-500 via-violet-400 to-cyan-400 transition-transform duration-150 ease-out" style={{ transform: `scaleX(${p})` }} />
        </div>
    );
};

/* ── ambient background (no images — gradient keeps content crisp) ────────── */
const MkAmbient = ({ isDarkMode }) => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0" style={{
            background: isDarkMode
                ? 'radial-gradient(120% 95% at 50% -10%, #0c0922 0%, #070518 46%, #040210 100%)'
                : 'radial-gradient(120% 95% at 50% -10%, #f5f4ff 0%, #fbfbff 46%, #ffffff 100%)',
        }} />
        <div className="absolute -top-[10%] left-1/2 w-[140vw] h-[85vh] -translate-x-1/2 vqm-beams" />
        <div className="absolute top-[-26%] left-[-16%] w-[52vw] h-[52vw] rounded-full blur-[190px] vqm-blob" style={{ background: `radial-gradient(circle, rgba(99,102,241,${isDarkMode ? 0.15 : 0.10}), transparent 62%)` }} />
        <div className="absolute top-[-22%] right-[-16%] w-[48vw] h-[48vw] rounded-full blur-[190px] vqm-blob2" style={{ background: `radial-gradient(circle, rgba(139,92,246,${isDarkMode ? 0.12 : 0.08}), transparent 62%)` }} />
        <div className="absolute bottom-[-28%] left-[28%] w-[46vw] h-[46vw] rounded-full blur-[210px] vqm-blob" style={{ background: `radial-gradient(circle, rgba(34,211,238,${isDarkMode ? 0.07 : 0.05}), transparent 62%)` }} />
        <div className={`absolute inset-0 vqm-grid ${isDarkMode ? 'opacity-[0.35]' : 'opacity-[0.5]'}`} />
        <div className="absolute inset-0" style={{
            background: isDarkMode
                ? 'radial-gradient(95% 75% at 50% 40%, rgba(4,2,12,0) 0%, rgba(4,2,12,0.5) 100%)'
                : 'radial-gradient(95% 75% at 50% 40%, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 100%)',
        }} />
        {isDarkMode && <div className="absolute inset-0 vqm-grain opacity-[0.3]" />}
    </div>
);

/* ── particle field ──────────────────────────────────────────────────────── */
const MkParticles = ({ isDarkMode }) => {
    const reduced = useMkRM();
    const canvasRef = useRef(null);
    useEffect(() => {
        if (reduced || window.matchMedia('(pointer: coarse)').matches) return;
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w, h, raf = 0, parts = [], running = true;
        const COLORS = isDarkMode
            ? ['rgba(129,140,248,', 'rgba(167,139,250,', 'rgba(34,211,238,']
            : ['rgba(99,102,241,', 'rgba(139,92,246,', 'rgba(6,182,212,'];
        const resize = () => {
            w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight;
            const count = Math.min(60, Math.floor(w / 32));
            parts = Array.from({ length: count }, () => ({
                x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5 + 0.4,
                vy: -(Math.random() * 0.2 + 0.05), vx: (Math.random() - 0.5) * 0.1,
                a: Math.random() * (isDarkMode ? 0.3 : 0.18) + 0.06, c: COLORS[(Math.random() * COLORS.length) | 0], tw: Math.random() * Math.PI * 2,
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
    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 hidden md:block" style={{ opacity: 0.5 }} />;
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
        <div className="fixed inset-0 pointer-events-none z-[5] hidden md:block">
            <div ref={ref} className="absolute -left-[300px] -top-[300px] w-[600px] h-[600px] rounded-full" style={{ background: `radial-gradient(circle, rgba(99,102,241,${isDarkMode ? 0.06 : 0.05}), transparent 60%)` }} />
        </div>
    );
};

/* ── theme toggle switch (matches Profile/Edit.jsx dark-mode toggle) ──────── */
const ThemeToggle = ({ isDarkMode, onToggle, compact = false }) => (
    <button
        type="button"
        onClick={onToggle}
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`relative ${compact ? 'w-11 h-6' : 'w-14 h-7'} rounded-full transition-all duration-300 shrink-0 ${isDarkMode ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-slate-300'}`}
    >
        <div className={`absolute top-1 ${compact ? 'w-4 h-4' : 'w-5 h-5'} bg-white rounded-full shadow-sm transition-all duration-300 flex items-center justify-center ${isDarkMode ? (compact ? 'left-6' : 'left-8') : 'left-1'}`}>
            {isDarkMode ? <Moon size={compact ? 10 : 12} className="text-indigo-600" /> : <Sun size={compact ? 10 : 12} className="text-amber-500" />}
        </div>
    </button>
);

/* ═══════════════════════════════════════════════════════════════════════════
   LAYOUT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function MarketingLayout({ children, title, description }) {
    const { props } = usePage();
    const settings = props.settings || {};
    const appName = settings.app_name || 'VenQore';
    const logo = settings.logo_url || '/images/logo.png';
    const { isDarkMode, toggleTheme } = useTheme();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Tools', href: '/tools' },
        { label: 'Blog', href: '/blog' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
    ];
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <div className="min-h-screen bg-white dark:bg-[#04020c] text-slate-900 dark:text-white font-sans selection:bg-indigo-500/30 dark:selection:bg-indigo-500/40 overflow-x-clip antialiased transition-colors duration-300">
            <Head>
                <title>{title || `${appName}`}</title>
                {description && <meta name="description" content={description} />}
                <meta name="theme-color" content={isDarkMode ? '#04020c' : '#ffffff'} />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <MkScrollProgress />
            <MkAmbient isDarkMode={isDarkMode} />
            <MkParticles isDarkMode={isDarkMode} />
            <MkSpotlight isDarkMode={isDarkMode} />

            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 dark:bg-[#04020c]/80 backdrop-blur-2xl border-b border-slate-900/[0.06] dark:border-white/[0.06] py-3' : 'py-5'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2">
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 shrink">
                        <img src={logo} alt={appName} className="h-8 sm:h-9 w-auto shrink-0 group-hover:scale-105 transition-transform duration-300" />
                        <span className="font-black text-slate-900 dark:text-white text-base sm:text-lg uppercase tracking-tighter truncate" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{appName}</span>
                    </Link>
                    <div className="hidden lg:flex items-center gap-1">
                        {navLinks.map(link => (
                            <Link key={link.href} href={link.href}
                                className={`relative px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 rounded-full ${currentPath === link.href ? 'text-slate-900 dark:text-white bg-slate-900/[0.06] dark:bg-white/[0.06]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.04]'}`}>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} compact />
                        <Link href="/login" className="hidden sm:block px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Sign In</Link>
                        <Link href="/register" className="px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-900 dark:bg-white text-white dark:text-[#05030f] rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] whitespace-nowrap transition-all hover:scale-105 hover:shadow-[0_0_40px_-6px_rgba(99,102,241,0.4)] dark:hover:shadow-[0_0_40px_-6px_rgba(255,255,255,0.5)]">Start Free</Link>
                        <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 -mr-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="Menu" aria-expanded={mobileMenu}>
                            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
                <div className={`lg:hidden overflow-hidden transition-all duration-500 ${mobileMenu ? 'max-h-[560px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-4 sm:px-6 py-6 space-y-1 bg-white/95 dark:bg-[#04020c]/95 backdrop-blur-2xl border-t border-slate-900/[0.06] dark:border-white/[0.06]">
                        {navLinks.map(link => (
                            <Link key={link.href} href={link.href} onClick={() => setMobileMenu(false)}
                                className={`block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors ${currentPath === link.href ? 'text-slate-900 dark:text-white bg-slate-900/5 dark:bg-white/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.04]'}`}>
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-3 mt-3 border-t border-slate-900/[0.06] dark:border-white/[0.06] sm:hidden">
                            <Link href="/login" onClick={() => setMobileMenu(false)}
                                className="block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.04] transition-colors">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10">{children}</main>

            {/* Footer */}
            <footer className="border-t border-slate-900/[0.06] dark:border-white/[0.06] pt-24 pb-12 px-6 relative z-10 bg-white dark:bg-[#04020c]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
                    <div className="md:col-span-5">
                        <Link href="/" className="flex items-center gap-3 mb-8">
                            <img src={logo} alt={appName} className="h-10 w-auto" />
                            <span className="font-black text-slate-900 dark:text-white text-xl uppercase tracking-tighter" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{appName}</span>
                        </Link>
                        <p className="text-slate-500 dark:text-slate-500 max-w-sm leading-relaxed text-sm mb-8">
                            The all-in-one POS &amp; ERP built on financial truth. Every sale, purchase and transfer writes a correct journal entry — automatically.
                        </p>
                        <a href="https://wa.me/923091999489" className="inline-flex p-3 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/5 dark:border-white/5 text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all duration-300">
                            <MessageCircle size={18} />
                        </a>
                    </div>
                    <div className="md:col-span-2">
                        <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.3em] mb-6">Platform</h4>
                        <ul className="space-y-3">
                            {[{ label: 'Features', href: '/features' }, { label: 'Pricing', href: '/pricing' }, { label: 'Tools', href: '/tools' }, { label: 'Blog', href: '/blog' }, { label: 'About', href: '/about' }].map(l => (
                                <li key={l.href}><Link href={l.href} className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">{l.label}</Link></li>
                            ))}
                        </ul>
                    </div>
                    <div className="md:col-span-2">
                        <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.3em] mb-6">Resources</h4>
                        <ul className="space-y-3">
                            {[{ label: 'Contact', href: '/contact' }, { label: 'Live Demo', href: '/demo' }, { label: 'Terms', href: '/terms' }, { label: 'Privacy', href: '/privacy' }].map(l => (
                                <li key={l.href}><Link href={l.href} className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">{l.label}</Link></li>
                            ))}
                        </ul>
                    </div>
                    <div className="md:col-span-3">
                        <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.3em] mb-6">Start Today</h4>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">14-day free trial. Full access. No credit card required.</p>
                        <Link href="/register" className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-black uppercase tracking-[0.15em] transition-all hover:scale-105 shadow-lg shadow-indigo-600/25">
                            Get Started <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-900/[0.06] dark:border-white/[0.06]">
                    <span className="text-slate-500 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">© 2026 {appName}. All rights reserved.</span>
                    <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-600">
                        <Link href="/terms" className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Privacy</Link>
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
                        transparent 0deg, rgba(129,140,248,0.07) 10deg, transparent 22deg,
                        transparent 44deg, rgba(167,139,250,0.06) 56deg, transparent 70deg,
                        transparent 104deg, rgba(34,211,238,0.05) 118deg, transparent 134deg);
                    filter: blur(22px); transform-origin: 50% 0%;
                    animation: vqm-beamspin 26s ease-in-out infinite;
                }
                @keyframes vqm-beamspin { 0%,100%{transform:translateX(-50%) rotate(-7deg);} 50%{transform:translateX(-50%) rotate(7deg);} }
                .vqm-grid { background-image:
                    linear-gradient(rgba(99,102,241,0.05) 1px,transparent 1px),
                    linear-gradient(90deg,rgba(99,102,241,0.05) 1px,transparent 1px);
                    background-size: 64px 64px; }
                .dark .vqm-grid { background-image:
                    linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),
                    linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px); }
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
                @keyframes vq-border-glow { 0%,100% { border-color: rgba(99,102,241,0.1); } 50% { border-color: rgba(99,102,241,0.3); } }
                .vq-border-glow { animation: vq-border-glow 4s ease-in-out infinite; }
                @keyframes vq-gradient-shift { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
                .vq-gradient-shift { background-size:200% 200%; animation: vq-gradient-shift 8s ease infinite; }

                .vq-headline-grad {
                    background: linear-gradient(100deg,#4f46e5 0%,#7c3aed 40%,#0891b2 80%);
                    -webkit-background-clip: text; background-clip: text; color: transparent;
                    background-size: 200% auto; animation: vq-shimmer 6s linear infinite;
                }
                .dark .vq-headline-grad {
                    background: linear-gradient(100deg,#818cf8 0%,#a78bfa 40%,#22d3ee 80%);
                    -webkit-background-clip: text; background-clip: text; color: transparent;
                    background-size: 200% auto;
                }
                .vq-text-glow { text-shadow: none; }
                .dark .vq-text-glow { text-shadow: 0 0 80px rgba(99,102,241,0.4); }
                .vq-text-glow-strong { text-shadow: none; }
                .dark .vq-text-glow-strong { text-shadow: 0 0 120px rgba(99,102,241,0.6), 0 0 40px rgba(99,102,241,0.2); }

                .no-scrollbar::-webkit-scrollbar { display:none; }
                .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
                .vq-grid-pattern { background-image: linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px), linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px); background-size:60px 60px; }
                .dark .vq-grid-pattern { background-image: linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px); }
                .vq-dot-pattern { background-image: radial-gradient(rgba(99,102,241,0.08) 1px,transparent 1px); background-size:30px 30px; }
                .dark .vq-dot-pattern { background-image: radial-gradient(rgba(255,255,255,0.05) 1px,transparent 1px); }

                ::-webkit-scrollbar { width:10px; }
                ::-webkit-scrollbar-track { background:transparent; }
                ::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.25); border-radius:10px; }
                ::-webkit-scrollbar-thumb:hover { background:rgba(99,102,241,0.4); }

                @media (prefers-reduced-motion: reduce) {
                    *, *::before, *::after { animation-duration:0.001ms !important; animation-iteration-count:1 !important; transition-duration:0.001ms !important; }
                }
            `}</style>
        </div>
    );
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, MessageCircle, Menu, X } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED MARKETING LAYOUT — "The Ledger" (2026-07-03)
   The site is a ledger, and the ledger is alive.

   Dark cover (Abyss) → paper pages → dark back cover. See DESIGN_NOTES.md.
   Replaces Midnight Nebula. All legacy helper exports keep their signatures
   so pages not yet rewritten continue to work on the dark base.

   Tokens:  Abyss #071614 · Deep Teal #1E7E82 · Mint #7FE9CE
            Paper #F5F2E9 · Ink #0D211D · Brass #C4A468
   Type:    Fraunces (display) · Inter (body) · IBM Plex Mono (figures)
   ═══════════════════════════════════════════════════════════════════════════ */

export const TOKENS = {
    abyss: '#071614',
    teal:  '#1E7E82',
    mint:  '#7FE9CE',
    paper: '#F5F2E9',
    ink:   '#0D211D',
    brass: '#C4A468',
};

/* ── Reduced-motion preference ───────────────────────────────────────────── */
export function useReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const on = () => setReduced(mq.matches);
        on();
        mq.addEventListener?.('change', on);
        return () => mq.removeEventListener?.('change', on);
    }, []);
    return reduced;
}

/* ── Capability gate for the one heavy enhancement (hero 3D) ─────────────────
   True only when the device explicitly qualifies. Any doubt → false. */
export function useEnhancedCapability() {
    const reduced = useReducedMotion();
    const [capable, setCapable] = useState(false);
    useEffect(() => {
        if (reduced) { setCapable(false); return; }
        let cancelled = false;
        const check = () => {
            try {
                const nav = window.navigator || {};
                const conn = nav.connection || {};
                if (conn.saveData) return false;
                if (/^(slow-2g|2g|3g)$/.test(conn.effectiveType || '')) return false;
                if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
                if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 4) return false;
                const c = document.createElement('canvas');
                const gl = c.getContext('webgl2') || c.getContext('webgl');
                if (!gl) return false;
                gl.getExtension('WEBGL_lose_context')?.loseContext();
                return true;
            } catch { return false; }
        };
        const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
        const handle = idle(() => { if (!cancelled) setCapable(check()); });
        return () => {
            cancelled = true;
            (window.cancelIdleCallback || clearTimeout)(handle);
        };
    }, [reduced]);
    return capable;
}

/* ── Scroll reveal (one-shot, IO-based — the only ambient motion on site) ── */
export function useScrollReveal(options = {}) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setIsVisible(true);
            return;
        }
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el); } },
            { threshold: options.threshold || 0.12, rootMargin: options.rootMargin || '0px 0px -48px 0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, isVisible];
}

export const RevealOnScroll = ({ children, delay = 0, direction = 'up', className = '', as: Tag = 'div' }) => {
    const [ref, isVisible] = useScrollReveal();
    const transforms = {
        up: 'translateY(22px)', down: 'translateY(-22px)',
        left: 'translateX(22px)', right: 'translateX(-22px)',
        scale: 'scale(0.98)', none: 'none',
    };
    return (
        <Tag ref={ref} className={className} style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'none' : transforms[direction],
            transition: `opacity 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
        }}>
            {children}
        </Tag>
    );
};

/* ── Animated counter (used for the honest figures only) ─────────────────── */
export const AnimatedCounter = ({ end, suffix = '', prefix = '', duration = 1400, decimals = 0 }) => {
    const [count, setCount] = useState(0);
    const [ref, isVisible] = useScrollReveal();
    const hasAnimated = useRef(false);
    useEffect(() => {
        if (!isVisible || hasAnimated.current) return;
        hasAnimated.current = true;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setCount(end); return; }
        const startTime = performance.now();
        const animate = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setCount(+(eased * end).toFixed(decimals));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [isVisible, end, duration, decimals]);
    return <span ref={ref} className="font-mono tabular-nums">{prefix}{count.toLocaleString()}{suffix}</span>;
};

/* ── Buttons ──────────────────────────────────────────────────────────────
   Legacy name `MagneticButton` kept for compatibility; the magnet is gone
   on purpose (see DESIGN_NOTES.md — restraint is the premium tell). */
export const MagneticButton = ({ children, href, className = '', variant = 'primary', surface = 'dark', ...props }) => {
    const styles = {
        primary: surface === 'dark'
            ? 'bg-[#7FE9CE] text-[#071614] hover:bg-[#a5f2de] shadow-[0_10px_36px_-12px_rgba(127,233,206,0.45)]'
            : 'bg-[#0D211D] text-[#F5F2E9] hover:bg-[#1E7E82]',
        ghost: surface === 'dark'
            ? 'bg-transparent border border-[rgba(127,233,206,0.28)] text-[#F5F2E9] hover:border-[rgba(127,233,206,0.6)] hover:bg-[rgba(127,233,206,0.06)]'
            : 'bg-transparent border border-[rgba(13,33,29,0.25)] text-[#0D211D] hover:border-[#1E7E82] hover:text-[#1E7E82]',
        small: 'bg-[#1E7E82] text-white hover:bg-[#249199]',
    };
    const Tag = href ? Link : 'button';
    return (
        <Tag
            href={href}
            className={`inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-semibold text-[15px] transition-all duration-300 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E7E82] ${styles[variant] || styles.primary} ${className}`}
            {...props}
        >
            {children}
        </Tag>
    );
};
export const Btn = MagneticButton;

/* ── Entry label — the site's signature typographic system ─────────────────
   `ENTRY 03 · INVENTORY` set in mono with a brass number and hairline rule.
   Legacy `SectionLabel` maps onto it. */
export const EntryLabel = ({ number, children, surface = 'paper', className = '' }) => (
    <div className={`flex items-baseline gap-4 mb-8 ${className}`}>
        {number && (
            <span className="font-mono text-[13px] font-semibold tracking-[0.08em] text-[#C4A468]">
                {String(number).padStart(2, '0')}
            </span>
        )}
        <span className={`font-mono text-[11px] font-medium tracking-[0.32em] uppercase ${surface === 'paper' ? 'text-[#1E7E82]' : 'text-[#7FE9CE]'}`}>
            {children}
        </span>
        <span aria-hidden="true" className={`flex-1 h-px translate-y-[-3px] ${surface === 'paper' ? 'bg-[rgba(13,33,29,0.14)]' : 'bg-[rgba(245,242,233,0.12)]'}`} />
    </div>
);

export const SectionLabel = ({ children, icon: Icon }) => (
    <div className="inline-flex items-center gap-2.5 mb-8 font-mono text-[11px] font-medium tracking-[0.32em] uppercase text-[#7FE9CE]">
        {Icon && <Icon size={13} aria-hidden="true" />}
        {children}
    </div>
);

/* ── Cards ────────────────────────────────────────────────────────────────
   Legacy GlassCard keeps its API; on the new system it renders as a quiet
   bordered surface appropriate to the dark base. */
export const GlassCard = ({ children, className = '', hover = true, padding = 'p-8', ...props }) => (
    <div
        className={`relative ${padding} rounded-2xl bg-[rgba(245,242,233,0.03)] border border-[rgba(245,242,233,0.09)] ${hover ? 'transition-colors duration-300 hover:border-[rgba(127,233,206,0.32)]' : ''} ${className}`}
        {...props}
    >
        {children}
    </div>
);

export const PaperCard = ({ children, className = '', padding = 'p-8', ...props }) => (
    <div
        className={`relative ${padding} rounded-2xl bg-white/60 border border-[rgba(13,33,29,0.12)] transition-colors duration-300 hover:border-[#1E7E82] ${className}`}
        {...props}
    >
        {children}
    </div>
);

/* ── Ledger figure — a labelled monospaced number ────────────────────────── */
export const LedgerFigure = ({ value, label, surface = 'dark' }) => (
    <div className="flex flex-col gap-1.5">
        <span className={`font-mono tabular-nums text-2xl sm:text-3xl font-semibold ${surface === 'dark' ? 'text-[#F5F2E9]' : 'text-[#0D211D]'}`}>{value}</span>
        <span className={`font-mono text-[10px] tracking-[0.26em] uppercase ${surface === 'dark' ? 'text-[rgba(245,242,233,0.5)]' : 'text-[rgba(13,33,29,0.55)]'}`}>{label}</span>
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   LAYOUT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function MarketingLayout({ children, title, description }) {
    const { props } = usePage();
    const settings = props.settings || {};
    const appName = settings.app_name || 'VenQore';
    const logo = settings.logo_url || '/images/logo.png';
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 32);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!mobileMenu) return;
        const onKey = (e) => { if (e.key === 'Escape') setMobileMenu(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [mobileMenu]);

    const navLinks = [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'VenSynQ', href: '/vensynq' },
        { label: 'SmartCapture', href: '/smartcapture' },
        { label: 'About', href: '/about' },
    ];
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <div className="min-h-screen bg-[#071614] text-[#F5F2E9] antialiased overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <Head>
                <title>{title || appName}</title>
                {description && <meta name="description" content={description} />}
                <meta name="theme-color" content="#071614" />
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=fraunces:400,500,600,700,900,400i|ibm-plex-mono:400,500,600|inter:400,500,600,700&display=swap" rel="stylesheet" />
            </Head>

            <a href="#vq-main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-5 focus:py-3 focus:bg-[#7FE9CE] focus:text-[#071614] focus:rounded-full focus:font-semibold focus:text-sm">
                Skip to content
            </a>

            {/* Navigation */}
            <nav aria-label="Main" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${scrolled || mobileMenu ? 'bg-[rgba(7,22,20,0.9)] backdrop-blur-xl border-b border-[rgba(245,242,233,0.08)] py-3' : 'py-5'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2">
                    <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7FE9CE] rounded-sm">
                        <img src={logo} alt="" className="h-8 sm:h-9 w-auto shrink-0" />
                        <span className="font-semibold text-[#F5F2E9] text-base sm:text-lg tracking-tight truncate" style={{ fontFamily: "'Fraunces', serif" }}>{appName}</span>
                    </Link>
                    <div className="hidden lg:flex items-center gap-0.5">
                        {navLinks.map(link => (
                            <Link key={link.href} href={link.href}
                                aria-current={currentPath === link.href ? 'page' : undefined}
                                className={`relative px-4 py-2 text-[13px] font-medium transition-colors duration-300 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7FE9CE] ${currentPath === link.href ? 'text-[#7FE9CE]' : 'text-[rgba(245,242,233,0.66)] hover:text-[#F5F2E9]'}`}>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <Link href="/login" className="hidden sm:block px-4 py-2.5 text-[13px] font-medium text-[rgba(245,242,233,0.66)] hover:text-[#F5F2E9] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7FE9CE] rounded-full">Sign in</Link>
                        <Link href="/register" className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#7FE9CE] text-[#071614] rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors hover:bg-[#a5f2de] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7FE9CE]">Start free</Link>
                        <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 -mr-1 text-[rgba(245,242,233,0.8)] hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7FE9CE] rounded" aria-label={mobileMenu ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenu}>
                            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
                <div className={`lg:hidden overflow-hidden transition-all duration-400 ${mobileMenu ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-4 sm:px-6 py-5 space-y-0.5 border-t border-[rgba(245,242,233,0.08)]">
                        {navLinks.map(link => (
                            <Link key={link.href} href={link.href} onClick={() => setMobileMenu(false)}
                                className={`block px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${currentPath === link.href ? 'text-[#7FE9CE] bg-[rgba(127,233,206,0.06)]' : 'text-[rgba(245,242,233,0.72)] hover:text-white hover:bg-[rgba(245,242,233,0.05)]'}`}>
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-3 mt-2 border-t border-[rgba(245,242,233,0.08)] sm:hidden">
                            <Link href="/login" onClick={() => setMobileMenu(false)}
                                className="block px-4 py-3 rounded-xl text-[15px] font-medium text-[rgba(245,242,233,0.72)] hover:text-white hover:bg-[rgba(245,242,233,0.05)] transition-colors">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main id="vq-main" className="relative">{children}</main>

            {/* Footer — the back cover */}
            <footer className="border-t border-[rgba(245,242,233,0.08)] pt-20 pb-10 px-6 relative bg-[#071614]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
                    <div className="md:col-span-5">
                        <Link href="/" className="flex items-center gap-3 mb-7">
                            <img src={logo} alt="" className="h-9 w-auto" />
                            <span className="font-semibold text-[#F5F2E9] text-xl tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>{appName}</span>
                        </Link>
                        <p className="text-[rgba(245,242,233,0.55)] max-w-sm leading-relaxed text-sm mb-7">
                            The offline-first POS &amp; ERP where every sale, purchase and transfer
                            writes a correct, balanced journal entry — automatically.
                        </p>
                        <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-[rgba(245,242,233,0.35)] mb-7">
                            Trial balance 0.00 · always
                        </p>
                        <a href="https://wa.me/923091999489" className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-[rgba(245,242,233,0.14)] text-[rgba(245,242,233,0.6)] text-[13px] hover:text-[#7FE9CE] hover:border-[rgba(127,233,206,0.4)] transition-colors" aria-label="Chat with the founder on WhatsApp">
                            <MessageCircle size={15} aria-hidden="true" /> Message the founder
                        </a>
                    </div>
                    <div className="md:col-span-2">
                        <h4 className="font-mono text-[10px] font-medium text-[rgba(245,242,233,0.45)] uppercase tracking-[0.3em] mb-6">Product</h4>
                        <ul className="space-y-3">
                            {[{ label: 'Features', href: '/features' }, { label: 'Pricing', href: '/pricing' }, { label: 'Live demo', href: '/demo' }, { label: 'VenSynQ', href: '/vensynq' }, { label: 'SmartCapture', href: '/smartcapture' }].map(l => (
                                <li key={l.href}><Link href={l.href} className="text-sm text-[rgba(245,242,233,0.55)] hover:text-[#F5F2E9] transition-colors">{l.label}</Link></li>
                            ))}
                        </ul>
                    </div>
                    <div className="md:col-span-2">
                        <h4 className="font-mono text-[10px] font-medium text-[rgba(245,242,233,0.45)] uppercase tracking-[0.3em] mb-6">Company</h4>
                        <ul className="space-y-3">
                            {[{ label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' }, { label: 'Contact', href: '/contact' }, { label: 'Newsletter', href: '/subscribe' }].map(l => (
                                <li key={l.href}><Link href={l.href} className="text-sm text-[rgba(245,242,233,0.55)] hover:text-[#F5F2E9] transition-colors">{l.label}</Link></li>
                            ))}
                        </ul>
                    </div>
                    <div className="md:col-span-3">
                        <h4 className="font-mono text-[10px] font-medium text-[rgba(245,242,233,0.45)] uppercase tracking-[0.3em] mb-6">Start today</h4>
                        <p className="text-[rgba(245,242,233,0.55)] text-sm mb-6 leading-relaxed">14-day free trial. Full access. No credit card required.</p>
                        <Link href="/register" className="inline-flex items-center gap-2 px-7 py-3 bg-[#7FE9CE] text-[#071614] rounded-full text-[13px] font-semibold transition-colors hover:bg-[#a5f2de]">
                            Get started <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-[rgba(245,242,233,0.08)]">
                    <span className="text-[rgba(245,242,233,0.35)] text-xs">© 2026 {appName}. All rights reserved.</span>
                    <div className="flex gap-7 text-xs text-[rgba(245,242,233,0.4)]">
                        <Link href="/terms" className="hover:text-[rgba(245,242,233,0.75)] transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-[rgba(245,242,233,0.75)] transition-colors">Privacy</Link>
                        <Link href="/refund-policy" className="hover:text-[rgba(245,242,233,0.75)] transition-colors">Refunds</Link>
                    </div>
                </div>
            </footer>

            {/* Global stylesheet — tokens + the few rules the system needs */}
            <style>{`
                :root {
                    --vq-abyss:#071614; --vq-teal:#1E7E82; --vq-mint:#7FE9CE;
                    --vq-paper:#F5F2E9; --vq-ink:#0D211D; --vq-brass:#C4A468;
                }
                .font-display, h1, h2, h3, h4 { font-family:'Fraunces', Georgia, serif; }
                .font-mono { font-family:'IBM Plex Mono', ui-monospace, monospace; }
                html { scroll-behavior:smooth; }
                ::selection { background:rgba(127,233,206,0.35); color:#0D211D; }
                .tabular-nums { font-variant-numeric:tabular-nums; }

                /* Ledger ruling — the paper texture is drawn, not photographed */
                .vq-paper-ruled {
                    background-color:var(--vq-paper);
                    background-image:linear-gradient(rgba(13,33,29,0.045) 1px, transparent 1px);
                    background-size:100% 44px;
                }
                .vq-margin-rule { box-shadow:inset 3px 0 0 0 rgba(30,126,130,0.55); }

                ::-webkit-scrollbar { width:10px; }
                ::-webkit-scrollbar-track { background:var(--vq-abyss); }
                ::-webkit-scrollbar-thumb { background:rgba(30,126,130,0.5); border-radius:10px; }
                ::-webkit-scrollbar-thumb:hover { background:rgba(30,126,130,0.8); }

                @media (prefers-reduced-motion: reduce) {
                    html { scroll-behavior:auto; }
                    *, *::before, *::after {
                        animation-duration:0.001ms !important;
                        animation-iteration-count:1 !important;
                        transition-duration:0.001ms !important;
                    }
                }
            `}</style>
        </div>
    );
}

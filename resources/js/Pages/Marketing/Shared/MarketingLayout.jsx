import React, { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight, MessageCircle, Lock, Menu, X
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   SCROLL REVEAL SYSTEM — Intersection Observer with stagger support
   ═══════════════════════════════════════════════════════════════════════ */

export function useScrollReveal(options = {}) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el); } },
            { threshold: options.threshold || 0.15, rootMargin: options.rootMargin || '0px 0px -60px 0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return [ref, isVisible];
}

export const RevealOnScroll = ({ children, delay = 0, direction = 'up', className = '', as: Tag = 'div' }) => {
    const [ref, isVisible] = useScrollReveal();
    const transforms = {
        up: 'translateY(40px)',
        down: 'translateY(-40px)',
        left: 'translateX(40px)',
        right: 'translateX(-40px)',
        scale: 'scale(0.95)',
        none: 'none',
    };
    return (
        <Tag
            ref={ref}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'none' : transforms[direction],
                transition: `opacity 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </Tag>
    );
};

/* ═══════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER — Counts up when in viewport
   ═══════════════════════════════════════════════════════════════════════ */

export const AnimatedCounter = ({ end, suffix = '', prefix = '', duration = 2000 }) => {
    const [count, setCount] = useState(0);
    const [ref, isVisible] = useScrollReveal();
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (!isVisible || hasAnimated.current) return;
        hasAnimated.current = true;
        const startTime = performance.now();
        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [isVisible, end, duration]);

    return <span ref={ref}>{prefix}{count}{suffix}</span>;
};

/* ═══════════════════════════════════════════════════════════════════════
   MAGNETIC BUTTON — Premium hover with cursor-awareness
   ═══════════════════════════════════════════════════════════════════════ */

export const MagneticButton = ({ children, href, className = '', variant = 'primary', ...props }) => {
    const btnRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const btn = btnRef.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) scale(1.02)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (btnRef.current) btnRef.current.style.transform = '';
    }, []);

    const baseClass = variant === 'primary'
        ? 'px-10 py-4 bg-white text-[#020010] font-black text-sm uppercase tracking-[0.15em] rounded-full hover:shadow-[0_0_60px_-5px_rgba(255,255,255,0.35)] transition-shadow duration-500'
        : variant === 'ghost'
            ? 'px-10 py-4 bg-white/5 border border-white/10 text-white font-bold text-sm uppercase tracking-[0.15em] rounded-full hover:bg-white/10 hover:border-white/20 transition-all duration-500 backdrop-blur-sm'
            : 'px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-[0.15em] rounded-full shadow-xl shadow-indigo-600/25 hover:shadow-indigo-500/40 transition-all duration-500';

    const Tag = href ? Link : 'button';

    return (
        <Tag
            ref={btnRef}
            href={href}
            className={`${baseClass} ${className} inline-flex items-center gap-3 cursor-pointer`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease, background 0.3s ease' }}
            {...props}
        >
            {children}
        </Tag>
    );
};

/* ═══════════════════════════════════════════════════════════════════════
   SECTION LABEL — The premium micro-label above each section title
   ═══════════════════════════════════════════════════════════════════════ */

export const SectionLabel = ({ children, icon: Icon }) => (
    <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase mb-8">
        {Icon && <Icon size={13} />}
        {children}
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   GLASS CARD — Glassmorphism card with hover depth
   ═══════════════════════════════════════════════════════════════════════ */

export const GlassCard = ({ children, className = '', hover = true, padding = 'p-8' }) => (
    <div className={`
        relative ${padding} rounded-[2rem] bg-white/[0.03] border border-white/[0.06]
        backdrop-blur-sm
        ${hover ? 'hover:bg-white/[0.06] hover:border-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-900/10 hover:-translate-y-1' : ''}
        transition-all duration-500 group
        ${className}
    `}>
        {children}
    </div>
);


/* ═══════════════════════════════════════════════════════════════════════
   MARKETING LAYOUT — Shared nav, footer, ambient, and motion styles
   ═══════════════════════════════════════════════════════════════════════ */

export default function MarketingLayout({ children, title, description }) {
    const { props } = usePage();
    const settings = props.settings || {};
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
        { label: 'Blog', href: '/blog' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
    ];

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <div className="min-h-screen bg-[#020010] text-white font-sans selection:bg-indigo-500/40 overflow-x-hidden">
            <Head>
                <title>{title || `${settings.app_name || 'VenQore'}`}</title>
                {description && <meta name="description" content={description} />}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-900/15 rounded-full blur-[160px] vq-pulse-slow" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] bg-violet-900/10 rounded-full blur-[140px] vq-pulse-slow-delay" />
                <div className="absolute top-[40%] left-[50%] w-[40vw] h-[40vw] bg-purple-900/5 rounded-full blur-[200px] vq-pulse-slow" />
            </div>

            {/* ── Navigation ───────────────────────────────────────── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${scrolled ? 'bg-[#020010]/80 backdrop-blur-2xl border-b border-white/5 py-3' : 'py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <img src={settings.logo_url || "/images/logo.png"} alt="Logo" className="h-9 w-auto group-hover:scale-105 transition-transform duration-300" />
                        <span className="font-black text-white text-lg uppercase tracking-tighter">{settings.app_name || 'VenQore'}</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 rounded-full
                                    ${currentPath === link.href ? 'text-white bg-white/[0.06]' : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'}
                                `}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/login" className="hidden sm:block px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link
                            href="/register"
                            className="px-7 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[11px] font-black uppercase tracking-[0.15em] transition-all hover:scale-105 shadow-lg shadow-indigo-600/25"
                        >
                            Start Free
                        </Link>
                        {/* Mobile toggle */}
                        <button
                            onClick={() => setMobileMenu(!mobileMenu)}
                            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`lg:hidden overflow-hidden transition-all duration-500 ${mobileMenu ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 py-6 space-y-1 bg-[#020010]/95 backdrop-blur-2xl border-t border-white/5">
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors
                                    ${currentPath === link.href ? 'text-white bg-white/5' : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'}
                                `}
                                onClick={() => setMobileMenu(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* ── Main Content ─────────────────────────────────── */}
            <main className="relative z-10">
                {children}
            </main>

            {/* ── Footer ───────────────────────────────────────── */}
            <footer className="border-t border-white/5 pt-24 pb-12 px-6 relative z-10 bg-[#020010]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
                    <div className="md:col-span-5">
                        <Link href="/" className="flex items-center gap-3 mb-8">
                            <img src={settings.logo_url || "/images/logo.png"} alt="Logo" className="h-10 w-auto" />
                            <span className="font-black text-white text-xl uppercase tracking-tighter">{settings.app_name || 'VenQore'}</span>
                        </Link>
                        <p className="text-slate-600 max-w-sm leading-relaxed text-sm mb-8">
                            The operations platform built on financial truth. Every sale, purchase, and transfer writes a correct journal entry — automatically.
                        </p>
                        <div className="flex gap-3">
                            <a href="https://wa.me/92XXXXXXXXXX" className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all duration-300">
                                <MessageCircle size={18} />
                            </a>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Platform</h4>
                        <ul className="space-y-3">
                            {['Features', 'Pricing', 'Blog', 'About'].map(l => (
                                <li key={l}><Link href={`/${l.toLowerCase()}`} className="text-sm text-slate-600 hover:text-white transition-colors font-medium">{l}</Link></li>
                            ))}
                        </ul>
                    </div>
                    <div className="md:col-span-2">
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Resources</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'Contact', href: '/contact' },
                                { label: 'Live Demo', href: '/demo' },
                                { label: 'Terms', href: '/terms' },
                                { label: 'Privacy', href: '/privacy' },
                            ].map(l => (
                                <li key={l.href}><Link href={l.href} className="text-sm text-slate-600 hover:text-white transition-colors font-medium">{l.label}</Link></li>
                            ))}
                        </ul>
                    </div>
                    <div className="md:col-span-3">
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Start Today</h4>
                        <p className="text-slate-600 text-sm mb-6 leading-relaxed">14-day free trial. Full access. No credit card required.</p>
                        <Link href="/register" className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-black uppercase tracking-[0.15em] transition-all hover:scale-105 shadow-lg shadow-indigo-600/25">
                            Get Started <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
                    <span className="text-slate-700 text-[10px] font-black uppercase tracking-[0.2em]">© 2026 {settings.app_name || 'VenQore'}. All rights reserved.</span>
                    <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-700">
                        <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
                    </div>
                </div>
            </footer>

            {/* ── Motion System Keyframes ──────────────────────── */}
            <style>{`
                * { font-family: 'Inter', 'Figtree', system-ui, sans-serif; }
                h1, h2, h3, h4, h5, h6, .font-display { font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif; }

                @keyframes vq-pulse-slow {
                    0%, 100% { opacity: 0.15; transform: scale(1); }
                    50% { opacity: 0.25; transform: scale(1.05); }
                }
                .vq-pulse-slow { animation: vq-pulse-slow 12s ease-in-out infinite; }
                .vq-pulse-slow-delay { animation: vq-pulse-slow 14s ease-in-out infinite 3s; }

                @keyframes vq-float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                .vq-float { animation: vq-float 6s ease-in-out infinite; }
                .vq-float-delay { animation: vq-float 6s ease-in-out infinite 2s; }

                @keyframes vq-shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .vq-shimmer { background-size: 200% auto; animation: vq-shimmer 4s linear infinite; }

                @keyframes vq-border-glow {
                    0%, 100% { border-color: rgba(99,102,241,0.1); }
                    50% { border-color: rgba(99,102,241,0.3); }
                }
                .vq-border-glow { animation: vq-border-glow 4s ease-in-out infinite; }

                @keyframes vq-gradient-shift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .vq-gradient-shift { background-size: 200% 200%; animation: vq-gradient-shift 8s ease infinite; }

                .vq-text-glow { text-shadow: 0 0 80px rgba(99, 102, 241, 0.4); }
                .vq-text-glow-strong { text-shadow: 0 0 120px rgba(99, 102, 241, 0.6), 0 0 40px rgba(99,102,241,0.2); }

                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                /* Smooth scroll for the whole page */
                html { scroll-behavior: smooth; }

                /* Custom grid pattern */
                .vq-grid-pattern {
                    background-image:
                        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
                    background-size: 60px 60px;
                }

                /* Dot pattern */
                .vq-dot-pattern {
                    background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
                    background-size: 30px 30px;
                }
            `}</style>
        </div>
    );
}

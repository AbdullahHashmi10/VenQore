import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight, Check, Play, Star, ChevronDown,
    ShieldCheck, Calculator, Boxes, Cpu, Zap,
    RefreshCw, Globe, BarChart3, ScanBarcode, MessageCircle,
    ZapOff, AlertTriangle, Fingerprint, Lock, ChevronRight,
    Layers, Database, GitBranch, Activity, Target,
    ArrowUpRight, Sparkles, Eye, Users, Workflow, Menu, X
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   VENQORE LANDING PAGE — "The Books Are Always Right."
   
   Design: Cinematic dark SaaS. Precision. Authority. Intelligence.
   Motion: Scroll-triggered reveals, parallax depth, stagger entrances.
   Feel: Like accessing the control system of a high-end financial tool.
   
   Architecture:
     1. HERO — Statement + social proof strip
     2. PATTERN INTERRUPT — "The Uncomfortable Truth"
     3. HOW IT WORKS — Interactive architecture diagram
     4. PROOF ENGINE — Stats + mechanism table
     5. FEATURES — Bento grid with depth
     6. SOCIAL PROOF — Testimonial blocks
     7. FAQ — Accordion
     8. FINAL CTA — Conversion closer
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Scroll Reveal Hook ─────────────────────────────────────────────── */
function useScrollReveal(options = {}) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.unobserve(el); } },
            { threshold: options.threshold || 0.12, rootMargin: '0px 0px -50px 0px' }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return [ref, isVisible];
}

const Reveal = ({ children, delay = 0, direction = 'up', className = '' }) => {
    const [ref, vis] = useScrollReveal();
    const t = { up: 'translateY(40px)', down: 'translateY(-30px)', left: 'translateX(40px)', right: 'translateX(-40px)', scale: 'scale(0.96)' };
    return (
        <div ref={ref} className={className} style={{
            opacity: vis ? 1 : 0,
            transform: vis ? 'none' : (t[direction] || t.up),
            transition: `opacity 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
        }}>
            {children}
        </div>
    );
};

/* ── Animated Counter ───────────────────────────────────────────────── */
const AnimCounter = ({ end, suffix = '', prefix = '', duration = 2200 }) => {
    const [count, setCount] = useState(0);
    const [ref, vis] = useScrollReveal();
    const ran = useRef(false);
    useEffect(() => {
        if (!vis || ran.current) return;
        ran.current = true;
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            setCount(Math.round((1 - Math.pow(1 - p, 4)) * end));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [vis]);
    return <span ref={ref}>{prefix}{count}{suffix}</span>;
};

/* ── Magnetic Button ────────────────────────────────────────────────── */
const MagBtn = ({ children, href, variant = 'primary', className = '' }) => {
    const r = useRef(null);
    const onMove = useCallback(e => {
        const b = r.current; if (!b) return;
        const rect = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - rect.left - rect.width / 2) * 0.12}px, ${(e.clientY - rect.top - rect.height / 2) * 0.12}px) scale(1.02)`;
    }, []);
    const onLeave = useCallback(() => { if (r.current) r.current.style.transform = ''; }, []);

    const base = variant === 'primary'
        ? 'px-12 py-5 bg-white text-[#020010] font-black text-base rounded-full hover:shadow-[0_0_80px_-10px_rgba(255,255,255,0.4)]'
        : variant === 'ghost'
            ? 'px-10 py-5 bg-white/5 border border-white/10 text-white font-bold text-base rounded-full hover:bg-white/10 hover:border-white/20 backdrop-blur-sm'
            : 'px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-full shadow-xl shadow-indigo-600/25';

    return (
        <Link ref={r} href={href || '/register'} className={`${base} inline-flex items-center gap-3 transition-all duration-300 ${className}`}
            onMouseMove={onMove} onMouseLeave={onLeave}
            style={{ transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease, background 0.3s ease' }}
        >
            {children}
        </Link>
    );
};

/* ── Section Label ──────────────────────────────────────────────────── */
const Label = ({ children, icon: Ic }) => (
    <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase mb-8">
        {Ic && <Ic size={13} />}
        {children}
    </div>
);

/* ── Feature Bento Card ─────────────────────────────────────────────── */
const BentoCard = ({ icon: Ic, title, body, color, className = '', delay = 0 }) => {
    const colorMap = {
        indigo: 'bg-indigo-500/15 text-indigo-400',
        cyan: 'bg-cyan-500/15 text-cyan-400',
        amber: 'bg-amber-500/15 text-amber-400',
        emerald: 'bg-emerald-500/15 text-emerald-400',
        pink: 'bg-pink-500/15 text-pink-400',
        violet: 'bg-violet-500/15 text-violet-400',
    };
    return (
        <Reveal delay={delay} className={className}>
            <div className="group relative h-full p-8 rounded-[2.5rem] bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.05] hover:border-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-900/10 hover:-translate-y-1 transition-all duration-500">
                <div className={`w-13 h-13 rounded-2xl ${colorMap[color] || colorMap.indigo} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                    style={{ width: '3.25rem', height: '3.25rem' }}>
                    <Ic size={24} />
                </div>
                <h3 className="text-xl font-black text-white mb-3 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
                <p className="text-slate-500 leading-relaxed text-[14px]">{body}</p>
            </div>
        </Reveal>
    );
};

/* ── Mechanism Row ──────────────────────────────────────────────────── */
const MechanismRow = ({ title, mechanism, outcome, delay }) => (
    <Reveal delay={delay}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors">
            <div className="font-black text-white text-[15px] tracking-tight uppercase flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                {title}
            </div>
            <div className="text-slate-500 text-sm font-medium italic">{mechanism}</div>
            <div className="text-indigo-300 font-bold text-sm tracking-wide bg-indigo-500/10 px-4 py-2 rounded-full w-fit">
                {outcome}
            </div>
        </div>
    </Reveal>
);

/* ── FAQ Item ───────────────────────────────────────────────────────── */
const FaqItem = ({ question, answer }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-white/5">
            <button onClick={() => setOpen(!open)}
                className="w-full py-7 flex items-center justify-between text-left group">
                <span className="text-lg font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors pr-6">{question}</span>
                <ChevronDown size={18} className={`transform transition-transform duration-500 flex-shrink-0 ${open ? 'rotate-180 text-indigo-400' : 'text-slate-700'}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'max-h-96 pb-7' : 'max-h-0'}`}>
                <p className="text-slate-500 leading-relaxed">{answer}</p>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
    const { props } = usePage();
    const settings = props.settings || {};
    const [scrolled, setScrolled] = useState(false);
    const [heroLoaded, setHeroLoaded] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const [activeArch, setActiveArch] = useState(0);

    useEffect(() => {
        setHeroLoaded(true);
        const h = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', h, { passive: true });
        return () => window.removeEventListener('scroll', h);
    }, []);

    // Auto-rotate architecture tabs
    useEffect(() => {
        const t = setInterval(() => setActiveArch(p => (p + 1) % 4), 4000);
        return () => clearInterval(t);
    }, []);

    const archLayers = [
        { label: 'Transaction', desc: 'Every sale, purchase, return, and transfer passes through validated business rules before anything is recorded.', icon: Activity },
        { label: 'Financial Core', desc: 'The Double-Entry Wall forces mathematically balanced journal entries. FIFO Engine calculates real cost per batch.', icon: Database },
        { label: 'Intelligence', desc: 'Three AI models: Customer Return Predictor, Stock Depletion Forecaster, and Churn Risk Detector.', icon: Cpu },
        { label: 'Reporting', desc: '38 verified reports from a single source of truth. P&L, Balance Sheet, Cash Flow — every number traces to an entry.', icon: BarChart3 },
    ];

    const navLinks = [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Blog', href: '/blog' },
        { label: 'About', href: '/about' },
    ];

    return (
        <div className="min-h-screen bg-[#020010] text-white overflow-x-hidden selection:bg-indigo-500/40">
            <Head>
                <title>{`${settings.app_name || 'VenQore'} — The Books Are Always Right.`}</title>
                <meta name="description" content="VenQore is the first operations platform built on financial truth. Every sale, return, transfer, and payment writes a correct journal entry." />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            {/* ── Ambient Background ───────────────────────────── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-900/15 rounded-full blur-[160px] vq-pulse" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] bg-violet-900/10 rounded-full blur-[140px] vq-pulse-d" />
                <div className="absolute top-[30%] right-[20%] w-[30vw] h-[30vw] bg-purple-900/5 rounded-full blur-[200px] vq-pulse" />
            </div>

            {/* ── Navigation ───────────────────────────────────── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${scrolled ? 'bg-[#020010]/80 backdrop-blur-2xl border-b border-white/5 py-3' : 'py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <img src={settings.logo_url || "/images/logo.png"} alt="Logo" className="h-9 w-auto group-hover:scale-105 transition-transform duration-300" />
                        <span className="font-black text-white text-lg uppercase tracking-tighter" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{settings.app_name || 'VenQore'}</span>
                    </Link>
                    <div className="hidden lg:flex items-center gap-1">
                        {navLinks.map(link => (
                            <Link key={link.href} href={link.href}
                                className="px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:bg-white/[0.03] rounded-full transition-all duration-300">
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="hidden sm:block px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">Sign In</Link>
                        <Link href="/register" className="px-7 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[11px] font-black uppercase tracking-[0.15em] transition-all hover:scale-105 shadow-lg shadow-indigo-600/25">
                            Start Free
                        </Link>
                        <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
                            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
                {/* Mobile Menu */}
                <div className={`lg:hidden overflow-hidden transition-all duration-500 ${mobileMenu ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 py-6 space-y-1 bg-[#020010]/95 backdrop-blur-2xl border-t border-white/5">
                        {navLinks.map(link => (
                            <Link key={link.href} href={link.href}
                                className="block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/[0.03] transition-colors"
                                onClick={() => setMobileMenu(false)}>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="relative z-10">

                {/* ══════════════════════════════════════════════════
                   1. HERO — "The Books Are Always Right."
                   ══════════════════════════════════════════════════ */}
                <section className="relative min-h-[95vh] flex flex-col items-center justify-center text-center px-6 pt-32 pb-24">
                    <div className={`transition-all duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] transform ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>

                        {/* Micro-label */}
                        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase mb-12">
                            <ShieldCheck size={14} className="animate-pulse" />
                            Auditor-Grade Financial Accuracy
                        </div>

                        {/* Headline */}
                        <h1 className="mb-8 leading-[0.88] relative" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            <span className="block text-6xl md:text-8xl lg:text-[9rem] font-black tracking-tighter">
                                <span className="relative inline-block">
                                    <span className="hero-text-rise bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent py-2 px-1 block">
                                        The Books Are
                                    </span>
                                    <span className="absolute inset-0 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent opacity-15 blur-sm pointer-events-none py-2 px-1 hero-glitch">The Books Are</span>
                                </span>
                            </span>
                            <span className="block text-6xl md:text-8xl lg:text-[9rem] font-black tracking-tighter -mt-2 md:-mt-6">
                                <span className="relative inline-block">
                                    <span className="hero-text-rise-d bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent py-2 px-1 block vq-text-glow-strong">
                                        Always Right.
                                    </span>
                                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent opacity-15 blur-sm pointer-events-none py-2 px-1 hero-glitch-slow z-[-1]">Always Right.</span>
                                </span>
                            </span>
                        </h1>

                        {/* Sub-headline */}
                        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-14 font-medium"
                            style={{ transitionDelay: '0.3s', opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'none' : 'translateY(20px)', transition: 'all 1s cubic-bezier(0.22,1,0.36,1) 0.4s' }}>
                            VenQore is the POS and ERP platform where every sale, purchase, and transfer automatically creates a correct journal entry — <span className="text-white font-semibold">without an accountant in the room.</span>
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
                            style={{ opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'none' : 'translateY(20px)', transition: 'all 1s cubic-bezier(0.22,1,0.36,1) 0.6s' }}>
                            <MagBtn href="/register" variant="primary">
                                Start Free Trial <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </MagBtn>
                            <MagBtn href="/demo" variant="ghost">
                                <Play size={16} fill="currentColor" /> Live Demo
                            </MagBtn>
                        </div>

                        {/* Stats Strip */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-white/[0.06] pt-10"
                            style={{ opacity: heroLoaded ? 1 : 0, transition: 'opacity 1s ease 0.8s' }}>
                            {[
                                { val: 1.2, suffix: 's', label: 'Scan to Journal', fixed: true },
                                { val: 38, suffix: '', label: 'Verified Reports' },
                                { val: 0, suffix: '', label: 'Balance Error', display: 'FIFO' },
                                { val: 0, suffix: '', label: 'Cost Basis', display: '0.00' },
                            ].map((s, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-3xl md:text-4xl font-black text-white mb-1 uppercase tracking-tighter leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                        {s.display || <><AnimCounter end={s.val} />{s.suffix}</>}
                                    </div>
                                    <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.25em]">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Scroll indicator */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 animate-bounce">
                        <div className="w-[1px] h-8 bg-gradient-to-b from-transparent to-white/30" />
                        <ChevronDown size={14} />
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════
                   2. PATTERN INTERRUPT — "The Uncomfortable Truth"
                   ══════════════════════════════════════════════════ */}
                <section className="py-32 px-6">
                    <div className="max-w-7xl mx-auto">
                        <Reveal>
                            <div className="bg-slate-900/20 border border-white/[0.06] rounded-[4rem] p-10 md:p-20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 text-white/[0.03] pointer-events-none">
                                    <ZapOff size={240} strokeWidth={0.3} />
                                </div>
                                <div className="max-w-4xl relative z-10">
                                    <Label icon={AlertTriangle}>The Uncomfortable Truth</Label>
                                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-10 leading-[0.88]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                        Most business software <br />
                                        <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent italic">lies to you.</span>
                                    </h2>
                                    <div className="space-y-6 text-lg md:text-xl text-slate-400 leading-relaxed font-medium max-w-3xl">
                                        <p>Not maliciously. Just structurally. Your "revenue" includes the tax you owe the government. Your profit includes units you bought at last year's price. Your inventory value is calculated from a number that was silently overwritten three purchases ago.</p>
                                        <p className="text-white font-semibold">You've been making decisions on fabricated data. We built VenQore to end that.</p>
                                    </div>

                                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5">
                                        {[
                                            { icon: AlertTriangle, title: 'Tax-as-Revenue Fraud', body: 'Most systems inflate your top-line by 10-20% by including VAT/GST as revenue. We separate them at the DB level.', color: 'red' },
                                            { icon: Calculator, title: 'The FIFO Lie', body: 'Calculated profit using overwritten averages? Your margins are permanently wrong. We track every batch cost.', color: 'orange' },
                                            { icon: Fingerprint, title: 'Immutable Ledger', body: "Edits without reversal trails? That's not accounting, it's guessing. VenQore forces audit-proof logic.", color: 'indigo' },
                                        ].map((card, i) => (
                                            <Reveal key={i} delay={0.1 + i * 0.1}>
                                                <div className={`p-8 rounded-[2rem] bg-${card.color === 'red' ? 'red' : card.color === 'orange' ? 'orange' : 'indigo'}-500/[0.04] border border-${card.color === 'red' ? 'red' : card.color === 'orange' ? 'orange' : 'indigo'}-500/10 hover:border-${card.color === 'red' ? 'red' : card.color === 'orange' ? 'orange' : 'indigo'}-500/20 transition-all duration-500 h-full`}>
                                                    <card.icon className={`text-${card.color === 'red' ? 'red' : card.color === 'orange' ? 'orange' : 'indigo'}-500 mb-6`} size={28} />
                                                    <h4 className="text-white font-bold mb-3 tracking-tight">{card.title}</h4>
                                                    <p className="text-slate-600 text-sm leading-relaxed">{card.body}</p>
                                                </div>
                                            </Reveal>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════
                   3. HOW IT WORKS — Interactive Architecture Diagram
                   ══════════════════════════════════════════════════ */}
                <section className="py-32 px-6">
                    <div className="max-w-6xl mx-auto">
                        <Reveal>
                            <div className="text-center mb-16">
                                <Label icon={Layers}>System Architecture</Label>
                                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[0.88]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                    Four Layers.<br /><span className="text-indigo-400">One Truth.</span>
                                </h2>
                            </div>
                        </Reveal>

                        <Reveal delay={0.15}>
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[3rem] overflow-hidden">
                                {/* Layer Tabs */}
                                <div className="grid grid-cols-2 md:grid-cols-4 border-b border-white/5">
                                    {archLayers.map((layer, i) => (
                                        <button key={i} onClick={() => setActiveArch(i)}
                                            className={`relative p-6 text-left transition-all duration-500 ${activeArch === i ? 'bg-indigo-500/5' : 'hover:bg-white/[0.02]'}`}>
                                            {activeArch === i && <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-indigo-500 rounded-full" />}
                                            <div className={`text-[9px] font-black uppercase tracking-[0.3em] mb-2 transition-colors ${activeArch === i ? 'text-indigo-400' : 'text-slate-700'}`}>
                                                Layer {i + 1}
                                            </div>
                                            <div className={`text-sm font-bold tracking-tight transition-colors ${activeArch === i ? 'text-white' : 'text-slate-600'}`}>
                                                {layer.label}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Active Layer */}
                                <div className="p-8 md:p-14">
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-center">
                                        <div className="md:col-span-3">
                                            <div className="flex items-center gap-4 mb-6">
                                                {React.createElement(archLayers[activeArch].icon, { size: 28, className: 'text-indigo-400' })}
                                                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                                    {archLayers[activeArch].label}
                                                </h3>
                                            </div>
                                            <p className="text-slate-400 leading-relaxed text-lg mb-8">
                                                {archLayers[activeArch].desc}
                                            </p>
                                            <MagBtn href="/features" variant="accent" className="text-sm">
                                                Explore All Layers <ArrowRight size={14} />
                                            </MagBtn>
                                        </div>
                                        <div className="md:col-span-2">
                                            {/* Animated visual indicator */}
                                            <div className="relative aspect-square max-w-[260px] mx-auto">
                                                {[0, 1, 2, 3].map(i => (
                                                    <div key={i}
                                                        className={`absolute rounded-[2rem] border transition-all duration-700 ${activeArch === i
                                                            ? 'bg-indigo-500/10 border-indigo-500/30 shadow-lg shadow-indigo-500/10 scale-100 opacity-100'
                                                            : activeArch > i
                                                                ? 'bg-white/[0.02] border-white/5 scale-95 opacity-40'
                                                                : 'bg-white/[0.01] border-white/[0.03] scale-95 opacity-20'
                                                            }`}
                                                        style={{
                                                            inset: `${i * 15}%`,
                                                            zIndex: 4 - i,
                                                        }}
                                                    >
                                                        {activeArch === i && (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="text-5xl font-black text-indigo-400/20" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                                                    {i + 1}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════
                   4. PROOF — Mechanisms Table + Stats
                   ══════════════════════════════════════════════════ */}
                <section className="py-32 px-6">
                    <div className="max-w-7xl mx-auto">
                        <Reveal>
                            <div className="text-center mb-16">
                                <Label icon={Target}>Proof, Not Promises</Label>
                                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.88]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                    The Architecture<br />of <span className="text-indigo-400">Truth.</span>
                                </h2>
                                <p className="text-slate-500 text-lg max-w-xl mx-auto mt-6">Every feature traceable to a real financial problem.</p>
                            </div>
                        </Reveal>

                        <Reveal delay={0.1}>
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[3rem] overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 border-b border-white/[0.06] bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                                    <div>Unique Mechanism</div>
                                    <div>What It Is</div>
                                    <div>The Outcome</div>
                                </div>
                                <MechanismRow delay={0.12} title="FIFO Engine" mechanism="Batch-level inventory tracking" outcome="Real COGS per sale" />
                                <MechanismRow delay={0.16} title="Double-Entry Wall" mechanism="SaleObserver blocks direct edits" outcome="Audit-Proof Ledger" />
                                <MechanismRow delay={0.20} title="Hardware Heartbeat" mechanism="Electron power-state detection" outcome="Loss-Proof POS" />
                                <MechanismRow delay={0.24} title="Auto-Assembly" mechanism="BOM-triggered manufacturing" outcome="Instant Stock Fulfillment" />
                                <MechanismRow delay={0.28} title="Three AI Brains" mechanism="Retention, Forecasting, Churn" outcome="Proactive Intelligence" />
                            </div>
                        </Reveal>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
                            {[
                                { end: 38, suffix: '', label: 'Reports' },
                                { end: 25, suffix: '+', label: 'Shortcuts' },
                                { end: 10, suffix: '', label: 'POS Tabs' },
                                { end: 15, suffix: 'min', label: 'Setup' },
                            ].map((s, i) => (
                                <Reveal key={i} delay={0.1 + i * 0.08}>
                                    <div className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="text-3xl font-black text-white mb-1 tracking-tighter" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                            <AnimCounter end={s.end} />{s.suffix}
                                        </div>
                                        <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">{s.label}</div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════
                   5. FEATURES — Bento Grid
                   ══════════════════════════════════════════════════ */}
                <section id="features" className="py-32 px-6">
                    <div className="max-w-7xl mx-auto">
                        <Reveal>
                            <div className="text-center mb-16">
                                <Label icon={Sparkles}>Core Capabilities</Label>
                                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                    Six Pillars. <span className="text-indigo-400">Zero Compromises.</span>
                                </h2>
                            </div>
                        </Reveal>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <BentoCard delay={0.0} icon={ShieldCheck} title="Financial Accuracy" body="Every transaction posts a journal entry. Every cost is tracked by batch. Every balance sheet balances. Auditor-grade statements — automatically." color="indigo" />
                            <BentoCard delay={0.06} icon={Boxes} title="Operational Control" body="Multi-warehouse, batch-tracked, expiry-aware inventory. Stock transfers with audit trails. Nothing moves without a record." color="cyan" />
                            <BentoCard delay={0.12} icon={Zap} title="Professional POS" body="25+ keyboard shortcuts. 10 simultaneous tabs. Crash Airbag saves carts before the server knows there's a problem." color="amber" />
                            <BentoCard delay={0.18} icon={Cpu} title="AI Intelligence" body="Predicting when customers return, forecasting stock depletion, detecting churn before it happens. Signal over noise." color="emerald" />
                            <BentoCard delay={0.24} icon={BarChart3} title="38 Master Reports" body="P&L, Balance Sheet, Aged Receivables, Stock Valuation — all from the same verified ledger. Not approximations." color="pink" />
                            <BentoCard delay={0.30} icon={RefreshCw} title="Staff Management" body="Role-gated dashboards, attendance with gap detection, kiosk lockdown, and manager overrides. Your team, fully managed." color="violet" />
                        </div>

                        <Reveal delay={0.2}>
                            <div className="text-center mt-12">
                                <MagBtn href="/features" variant="ghost" className="text-sm">
                                    Explore All Features <ArrowRight size={14} />
                                </MagBtn>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════
                   6. SOCIAL PROOF — Testimonials
                   ══════════════════════════════════════════════════ */}
                <section className="py-32 px-6 border-y border-white/5">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <Reveal>
                            <div>
                                <Label icon={Users}>Built for Operators</Label>
                                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[0.88] uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                    Real Results.<br /><span className="text-indigo-400">Real Operators.</span>
                                </h2>
                                <p className="text-xl text-slate-500 leading-relaxed mb-10">
                                    We built VenQore for the operator who is done guessing. Here's what they say.
                                </p>
                                <MagBtn href="/about" variant="ghost" className="text-sm">
                                    Learn Our Story <ArrowRight size={14} />
                                </MagBtn>
                            </div>
                        </Reveal>
                        <div className="space-y-5">
                            {[
                                { text: "For the first time, my daily revenue matched what my accountant calculated at month-end. We're not adjusting numbers anymore — they just come out right.", author: "Electronics Retailer, 3 locations" },
                                { text: "We process 800+ transactions a day. The keyboard shortcuts and multi-tab system mean our cashiers never touch a mouse. Throughput went up 30%.", author: "Supermarket Operator" }
                            ].map((q, i) => (
                                <Reveal key={i} delay={i * 0.12} direction="left">
                                    <div className="p-8 rounded-[2.5rem] bg-indigo-600/[0.04] border-l-[3px] border-indigo-600 hover:bg-indigo-600/[0.06] transition-colors duration-500">
                                        <p className="text-lg text-slate-300 italic mb-6 leading-relaxed">"{q.text}"</p>
                                        <div className="text-[11px] font-black text-white uppercase tracking-[0.15em]">— {q.author}</div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════
                   7. FAQ
                   ══════════════════════════════════════════════════ */}
                <section className="py-32 px-6">
                    <div className="max-w-3xl mx-auto">
                        <Reveal>
                            <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-16 tracking-tighter" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                Common <span className="text-indigo-400">Questions</span>
                            </h2>
                        </Reveal>
                        <Reveal delay={0.1}>
                            <div>
                                <FaqItem question="Is VenQore a POS or an accounting system?" answer="Both. The POS generates double-entry journal entries automatically. The accounting module generates auditor-grade statements from those entries. They're the same system — not integrated, not synced, not connected. The same." />
                                <FaqItem question="Do I need an accountant to use it?" answer="No. VenQore handles the double-entry mechanics automatically. Every sale, purchase, return, and adjustment creates the correct journal entry. Your accountant can verify the output — they just won't need to create it manually." />
                                <FaqItem question="How long does setup take?" answer="The onboarding wizard takes 10–15 minutes. If you're migrating from existing software, your full data history can be imported the same day. Most businesses are processing live transactions within 24 hours." />
                                <FaqItem question="Does it work with unstable power?" answer="Yes. The desktop station runs locally and syncs when online. Active carts survive crashes, reloads, and power interruptions. The Hardware Heartbeat system distinguishes power cuts from manual shutdowns." />
                                <FaqItem question="What happens to my data if I cancel?" answer="It's yours. Export it at any time. We don't hold data hostage." />
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════
                   8. FINAL CTA — Conversion Closer
                   ══════════════════════════════════════════════════ */}
                <section className="py-32 px-6 text-center overflow-hidden">
                    <div className="max-w-4xl mx-auto relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/8 rounded-full blur-[140px] pointer-events-none" />
                        <Reveal>
                            <h2 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9] relative z-10" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                You already know <br />your <span className="text-indigo-400">numbers are wrong.</span>
                            </h2>
                            <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed relative z-10">
                                The only question is whether you'll fix it this year or keep guessing. 14-day free trial, full access, no credit card required.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                                <MagBtn href="/register" variant="primary">
                                    Start Your Free Trial <ArrowRight size={18} />
                                </MagBtn>
                                <MagBtn href="/contact" variant="ghost">
                                    Talk to Sales
                                </MagBtn>
                            </div>
                        </Reveal>
                    </div>
                </section>
            </main>

            {/* ── Footer ───────────────────────────────────────── */}
            <footer className="border-t border-white/5 pt-24 pb-12 px-6 relative z-10 bg-[#020010]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
                    <div className="md:col-span-5">
                        <Link href="/" className="flex items-center gap-3 mb-8">
                            <img src={settings.logo_url || "/images/logo.png"} alt="Logo" className="h-10 w-auto" />
                            <span className="font-black text-white text-xl uppercase tracking-tighter" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{settings.app_name || 'VenQore'}</span>
                        </Link>
                        <p className="text-slate-600 max-w-sm leading-relaxed text-sm">
                            The operations platform built on financial truth. Every sale, purchase, and transfer writes a correct journal entry — automatically.
                        </p>
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
                            {[{ l: 'Contact', h: '/contact' }, { l: 'Live Demo', h: '/demo' }, { l: 'Terms', h: '/terms' }, { l: 'Privacy', h: '/privacy' }].map(i => (
                                <li key={i.h}><Link href={i.h} className="text-sm text-slate-600 hover:text-white transition-colors font-medium">{i.l}</Link></li>
                            ))}
                        </ul>
                    </div>
                    <div className="md:col-span-3">
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Connect</h4>
                        <div className="space-y-3">
                            <a href="https://wa.me/92XXXXXXXXXX" className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-600/[0.06] border border-emerald-500/10 text-emerald-400 hover:bg-emerald-600/[0.1] transition-all duration-300">
                                <MessageCircle size={20} />
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest">WhatsApp Sales</div>
                                    <div className="text-[10px] opacity-60">Immediate Response</div>
                                </div>
                            </a>
                            <Link href="/contact" className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-600/[0.06] border border-indigo-500/10 text-indigo-400 hover:bg-indigo-600/[0.1] transition-all duration-300">
                                <Lock size={20} />
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest">Book a Demo</div>
                                    <div className="text-[10px] opacity-60">1-on-1 Walkthrough</div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
                    <span className="text-slate-700 text-[10px] font-black uppercase tracking-[0.2em]">© 2026 {settings.app_name || 'VenQore'}. All rights reserved. The Books Are Always Right.</span>
                    <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-700">
                        <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
                    </div>
                </div>
            </footer>

            {/* ── Keyframes ────────────────────────────────────── */}
            <style>{`
                * { font-family: 'Inter', 'Figtree', system-ui, sans-serif; }

                @keyframes vq-p { 0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.25;transform:scale(1.05)} }
                .vq-pulse { animation: vq-p 12s ease-in-out infinite; }
                .vq-pulse-d { animation: vq-p 14s ease-in-out infinite 3s; }

                @keyframes hero-rise {
                    0% { transform: translateY(120%); opacity: 0; filter: blur(12px); }
                    100% { transform: translateY(0); opacity: 1; filter: blur(0); }
                }
                .hero-text-rise { animation: hero-rise 1.2s cubic-bezier(0.22,1,0.36,1) forwards; }
                .hero-text-rise-d { animation: hero-rise 1.2s cubic-bezier(0.22,1,0.36,1) 0.25s forwards; transform: translateY(120%); }

                @keyframes h-glitch {
                    0%,100%{transform:translate(0)}20%{transform:translate(-2px,2px)}40%{transform:translate(-2px,-2px)}60%{transform:translate(2px,2px)}80%{transform:translate(2px,-2px)}
                }
                .hero-glitch { animation: h-glitch 0.2s linear infinite; opacity: 0; }

                @keyframes h-glitch-s {
                    0%,100%{transform:translate(0)}10%{transform:translate(-1px,1px)}20%{transform:translate(1px,-1px)}
                }
                .hero-glitch-slow { animation: h-glitch-s 3s linear infinite; }

                .vq-text-glow-strong { text-shadow: 0 0 100px rgba(99,102,241,0.5), 0 0 40px rgba(99,102,241,0.2); }

                .vq-grid-pattern {
                    background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
                    background-size: 60px 60px;
                }

                html { scroll-behavior: smooth; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

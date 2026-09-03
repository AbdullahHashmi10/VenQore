import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import MarketingLayout, {
    RevealOnScroll, SectionLabel
} from './Shared/MarketingLayout';
import { 
    Package, ExternalLink, ArrowRight, Sparkles, 
    CheckCircle2, Lock, Activity, Hexagon, Fingerprint,
    Cpu, Rocket, Database, Layers
} from 'lucide-react';

export default function DigitalProducts({ products, stats }) {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Filter products by status
    const activeProducts = products.filter(p => p.status === 'active');
    const devProducts = products.filter(p => p.status === 'dev');
    const soonProducts = products.filter(p => p.status === 'soon');

    return (
        <MarketingLayout
            title="VenQore Digital Products catalog"
            description="Explore our premium collection of offline POS modules, standalone platforms, and custom accounting extensions."
        >
            <Head title="Digital Products & Registry Catalog" />

            {/* This catalog is art-directed dark end to end — ambient blobs,
                glass cards, glow. Rather than retint 400 lines, it opts out of
                the light theme and stays dark under the shared header. */}
            <div className="relative min-h-screen bg-[#020010] text-white overflow-hidden pb-40 [color-scheme:dark]">
                {/* 
                    DYNAMIC AMBIENT BACKGROUND 
                    Reacts slightly to mouse position for a parallax/floating feel
                */}
                <div 
                    className="fixed inset-0 z-0 pointer-events-none transition-transform duration-slower ease-out"
                    style={{ transform: `translate(${(mousePosition.x - window.innerWidth / 2) * -0.02}px, ${(mousePosition.y - window.innerHeight / 2) * -0.02}px)` }}
                >
                    <div className="absolute top-[-10%] left-[20%] w-[800px] h-[800px] bg-brand-600/10 rounded-full blur-[180px]" />
                    <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-brand-700/10 rounded-full blur-[150px]" />
                    <div className="absolute bottom-[-10%] left-[10%] w-[700px] h-[700px] bg-emerald-600/5 rounded-full blur-[150px]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
                </div>

                {/* HERO HEADER */}
                <section className="relative pt-32 md:pt-48 pb-20 px-4 md:px-6 z-10 text-center max-w-4xl mx-auto space-y-8 flex flex-col items-center">
                    <RevealOnScroll>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md mb-6">
                            <Sparkles className="w-4 h-4 text-brand-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-neutral-300">VenQore Ecosystem</span>
                        </div>
                        <h1 className="text-[2.75rem] xs:text-5xl md:text-8xl font-bold tracking-tighter leading-[0.9] uppercase font-display text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-200 to-neutral-500 drop-shadow-2xl">
                            Digital <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">Registry</span>
                        </h1>
                        <p className="mt-8 text-ink-muted text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-light">
                            The definitive suite of double-entry ledger systems, point-of-sale registers, and analytics overlays. Built for zero-latency, offline-first operational dominance.
                        </p>
                    </RevealOnScroll>

                    {/* Stats Counter Strip - Glassmorphic floating island */}
                    <RevealOnScroll delay={0.1}>
                        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-8 p-2 bg-neutral-900/40 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl ">
                            <div className="text-center px-6 py-4">
                                <span className="block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2">Total Modules</span>
                                <span className="text-3xl font-bold text-white">{stats.total}</span>
                            </div>
                            <div className="w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                            <div className="text-center px-6 py-4">
                                <span className="block text-2xs font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 justify-center">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                                    Live & Active
                                </span>
                                <span className="text-3xl font-bold text-emerald-400">{stats.done}</span>
                            </div>
                            <div className="w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                            <div className="text-center px-6 py-4">
                                <span className="block text-2xs font-bold text-brand-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 justify-center">
                                    <Activity className="w-3 h-3" />
                                    In Pipeline
                                </span>
                                <span className="text-3xl font-bold text-brand-400">{stats.pending}</span>
                            </div>
                        </div>
                    </RevealOnScroll>
                </section>

                <div className="max-w-[85rem] mx-auto px-4 md:px-8 space-y-32 md:space-y-48 relative z-10 mt-10">

                    {/* ────────────────────────────────────────────────────────
                        SECTION 1: THE CORE SYSTEM & ACTIVE CONTROLLERS (70% Focus)
                        ──────────────────────────────────────────────────────── */}
                    <section className="space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-500/20 pb-6 relative">
                            <div className="absolute bottom-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-brand-500 to-transparent"></div>
                            <div className="space-y-2">
                                <span className="text-xs font-bold tracking-[0.25em] text-emerald-400 uppercase flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute opacity-75"></span>
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 relative"></span>
                                    Core Flagship Modules
                                </span>
                                <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white uppercase font-display">
                                    Fully Operational
                                </h2>
                            </div>
                            <p className="text-sm text-ink-muted max-w-md md:text-right leading-relaxed border-l border-white/10 pl-4 md:border-none md:pl-0">
                                Tested, deployed, and production-ready accounting systems with fully operational double-entry ledger registers.
                            </p>
                        </div>

                        {activeProducts.length === 0 ? (
                            <div className="p-12 rounded-2xl bg-sunken border border-white/5 backdrop-blur-sm text-center text-ink-muted">
                                <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No active flagship modules configured.</p>
                            </div>
                        ) : (
                            <div className="space-y-16">
                                {activeProducts.map((product, i) => (
                                    <div 
                                        key={product.id}
                                        className="relative rounded-2xl bg-neutral-900/40 backdrop-blur-xl border border-white/10 overflow-hidden group transition-all duration-slower hover:border-brand-500/50 hover:shadow-[0_0_80px_-20px_rgba(99,102,241,0.3)] flex flex-col xl:flex-row"
                                    >
                                        {/* Animated Grid Background */}
                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] opacity-20 group-hover:opacity-40 transition-opacity duration-slower"></div>
                                        
                                        {/* Gradient Glow Follow */}
                                        <div className="absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-slower blur-xl bg-gradient-to-r from-brand-500/20 via-brand-500/20 to-emerald-500/20 -z-10"></div>

                                        {/* Left Side: Product Details */}
                                        <div className="flex-1 p-8 md:p-14 lg:p-20 relative z-10 flex flex-col justify-center">
                                            <div className="flex flex-wrap items-center gap-4 mb-8">
                                                <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4" /> Validated Core
                                                </div>
                                                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-mono">
                                                    Build {product.version || 'v1.0.0'}
                                                </div>
                                            </div>

                                            <h3 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
                                                {product.name}
                                            </h3>
                                            
                                            <p className="text-ink-muted text-lg md:text-xl leading-relaxed font-light max-w-3xl mb-12">
                                                {product.description}
                                            </p>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mt-auto">
                                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                                    <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                                                        <Database className="w-5 h-5 text-brand-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white mb-1">Ledger Integrity</h4>
                                                        <p className="text-xs text-ink-muted leading-relaxed">Cryptographically secure double-entry transaction routing.</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                                    <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                                                        <Layers className="w-5 h-5 text-brand-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white mb-1">Component Expansion</h4>
                                                        <p className="text-xs text-ink-muted leading-relaxed">Hot-swappable UI layouts without touching core logic.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Action Panel */}
                                        <div className="w-full xl:w-[450px] bg-neutral-950/80 backdrop-blur-2xl border-l border-white/10 p-8 md:p-12 relative z-10 flex flex-col justify-center border-t xl:border-t-0 border-white/5">
                                            <div className="mb-8 space-y-2">
                                                <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center mb-6">
                                                    <Fingerprint className="w-6 h-6 text-brand-400" />
                                                </div>
                                                <h4 className="text-xl font-bold text-white">Acquisition Portals</h4>
                                                <p className="text-sm text-ink-muted">Select an authorized merchant provider to license this module.</p>
                                            </div>

                                            {(!product.platforms || product.platforms.length === 0) ? (
                                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center border-dashed">
                                                    <p className="text-ink-muted text-sm">No external checkout gateways configured yet.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {product.platforms.map((platform, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={platform.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="group/btn relative w-full p-5 bg-gradient-to-r from-brand-600 to-brand-600 rounded-2xl flex items-center justify-between transition-all duration-slow hover:shadow-[0_10px_40px_-10px_rgba(99,102,241,0.8)] overflow-hidden"
                                                        >
                                                            {/* Button Hover effect */}
                                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-slow ease-out"></div>
                                                            
                                                            <div className="relative z-10 flex items-center gap-4">
                                                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                                                                    <Sparkles className="w-4 h-4 text-white" />
                                                                </div>
                                                                <div>
                                                                    <span className="block text-xs text-brand-100 font-medium mb-0.5">Secure Checkout</span>
                                                                    <span className="block text-sm font-bold text-white uppercase tracking-wider">{platform.label || platform.name}</span>
                                                                </div>
                                                            </div>
                                                            <div className="relative z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-brand-600 text-white transition-colors">
                                                                <ArrowRight className="w-5 h-5 group-hover/btn:-rotate-45 transition-transform" />
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>


                    {/* ────────────────────────────────────────────────────────
                        SECTION 2: THE ACTIVE PIPELINE (20% Focus)
                        ──────────────────────────────────────────────────────── */}
                    <section className="space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
                            <div className="space-y-2">
                                <span className="text-xs font-bold tracking-[0.25em] text-brand-400 uppercase flex items-center gap-2">
                                    <Activity className="w-4 h-4 animate-pulse" />
                                    Active Pipeline
                                </span>
                                <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-white uppercase font-display">
                                    Under Construction
                                </h2>
                            </div>
                            <p className="text-sm text-ink-muted max-w-sm md:text-right leading-relaxed">
                                High-priority modules currently in the engineering bay. Architecture defined, coding in progress.
                            </p>
                        </div>

                        {devProducts.length === 0 ? (
                            <div className="p-8 rounded-2xl bg-white/5 border border-white/5 text-center text-ink-muted">
                                No pipeline modules in active assembly.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {devProducts.map((product) => (
                                    <div 
                                        key={product.id}
                                        onClick={() => setSelectedProduct(product)}
                                        className="group cursor-pointer p-8 rounded-2xl bg-neutral-900/30 border border-white/10 hover:bg-interactive-hover hover:border-brand-500/40 transition-all duration-slower relative overflow-hidden backdrop-blur-sm"
                                    >
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl group-hover:bg-brand-500/10 transition-colors duration-slower"></div>
                                        
                                        <div className="relative z-10 flex flex-col h-full justify-between space-y-8">
                                            <div>
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                                                        <Cpu className="w-6 h-6 text-brand-400 group-hover:animate-pulse" />
                                                    </div>
                                                    <div className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-2xs font-bold uppercase tracking-widest">
                                                        Engineering Bay
                                                    </div>
                                                </div>
                                                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-brand-300 transition-colors">{product.name}</h3>
                                                <p className="text-ink-muted text-sm leading-relaxed line-clamp-3 font-light">
                                                    {product.description}
                                                </p>
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
                                                    <span className="text-xs text-ink-muted font-mono">Build {product.version || 'Beta Dev'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-brand-400 text-sm font-bold group-hover:translate-x-2 transition-transform duration-slow">
                                                    Preview Links <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>


                    {/* ────────────────────────────────────────────────────────
                        SECTION 3: FUTURE EXPANSION ROADMAP (10% Focus)
                        ──────────────────────────────────────────────────────── */}
                    <section className="space-y-10 opacity-70 hover:opacity-100 transition-opacity duration-slower">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-4">
                            <div className="space-y-1">
                                <span className="text-2xs font-bold tracking-[0.2em] text-ink-muted uppercase flex items-center gap-2">
                                    <Lock className="w-3 h-3" />
                                    Future Add-ons
                                </span>
                                <h2 className="text-2xl font-bold tracking-tight text-ink-muted uppercase font-display">
                                    Conceptual Roadmap
                                </h2>
                            </div>
                            <p className="text-xs text-ink-secondary max-w-xs md:text-right">
                                Blueprints generated. Engineering blocked until current pipeline clears.
                            </p>
                        </div>

                        {soonProducts.length === 0 ? (
                            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.02] text-center text-ink-secondary text-sm">
                                No roadmap items cataloged.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {soonProducts.map((product) => (
                                    <div 
                                        key={product.id}
                                        className="p-6 bg-sunken border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[220px]"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-950/80 z-0"></div>
                                        
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-center mb-4 opacity-50">
                                                <Hexagon className="w-6 h-6 text-ink-muted" />
                                                <Lock className="w-4 h-4 text-ink-secondary" />
                                            </div>
                                            <h4 className="text-base font-bold text-neutral-300 mb-2 leading-tight">
                                                {product.name}
                                            </h4>
                                            <p className="text-ink-muted text-2xs leading-relaxed line-clamp-3">
                                                {product.description}
                                            </p>
                                        </div>
                                        
                                        <div className="relative z-10 pt-4 mt-4 border-t border-white/5">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/50 border border-neutral-700 text-3xs font-bold text-ink-muted uppercase tracking-widest">
                                                Pending Core
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                </div>

                {/* MODAL FOR DEVELOPMENT PREVIEWS */}
                {selectedProduct && (
                    <div className="fixed inset-0 z-command flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-xl">
                        <div 
                            className="absolute inset-0 z-0" 
                            onClick={() => setSelectedProduct(null)}
                        ></div>
                        <div className="max-w-xl w-full bg-neutral-900/90 border border-brand-500/30 p-8 md:p-12 rounded-2xl shadow-[0_0_100px_-20px_rgba(99,102,241,0.4)] relative z-10 transform scale-100 animate-in zoom-in-95 duration-normal">
                            
                            <button 
                                onClick={() => setSelectedProduct(null)}
                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-ink-muted hover:text-white"
                            >
                                ✕
                            </button>

                            <div className="mb-8 text-center flex flex-col items-center">
                                <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center mb-6">
                                    <Rocket className="w-8 h-8 text-brand-400" />
                                </div>
                                <span className="text-2xs font-bold uppercase tracking-[0.3em] text-brand-400 mb-2 block">Early Access Preview</span>
                                <h2 className="text-3xl font-bold text-white mb-4">{selectedProduct.name}</h2>
                                <p className="text-ink-muted text-sm leading-relaxed max-w-sm">
                                    {selectedProduct.description}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-2xs font-bold uppercase tracking-widest text-ink-muted border-b border-white/10 pb-2">Pre-order / Testing Portals</h4>
                                {(!selectedProduct.platforms || selectedProduct.platforms.length === 0) ? (
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center border-dashed">
                                        <p className="text-ink-muted text-sm">Testing portals are currently closed.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                        {selectedProduct.platforms.map((platform, idx) => (
                                            <a
                                                key={idx}
                                                href={platform.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full p-5 bg-white/5 border border-white/10 hover:border-brand-500/50 rounded-2xl flex items-center justify-between hover:bg-brand-500/10 transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                                                        <ExternalLink className="w-4 h-4 text-ink-muted group-hover:text-brand-400" />
                                                    </div>
                                                    <div>
                                                        <span className="block text-2xs text-ink-muted uppercase tracking-wider mb-0.5">Platform</span>
                                                        <span className="block text-sm font-bold text-white">{platform.label || platform.name}</span>
                                                    </div>
                                                </div>
                                                <div className="px-4 py-1.5 rounded-full bg-white/5 text-xs text-ink-muted group-hover:bg-white/10 group-hover:text-white transition-colors">
                                                    Access
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MarketingLayout>
    );
}

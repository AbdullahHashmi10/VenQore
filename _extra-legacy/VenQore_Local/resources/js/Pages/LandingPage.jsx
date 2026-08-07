import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight, Check, Play, Star, ChevronDown,
    ShieldCheck, Calculator, Boxes, Cpu, Zap,
    RefreshCw, Globe, BarChart3, ScanBarcode, MessageCircle,
    ZapOff, AlertTriangle, Fingerprint, Lock
} from 'lucide-react';

/* ─── Shared Components ─────────────────────────────────────────── */

const FeatureCard = ({ icon: Icon, title, body, color }) => (
    <div className="group relative p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/[0.07] transition-all duration-500">
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
            <Icon size={28} />
        </div>
        <h3 className="text-xl font-black text-white mb-3 tracking-tight">{title}</h3>
        <p className="text-slate-400 leading-relaxed text-sm">{body}</p>
    </div>
);

const MechanismItem = ({ title, mechanism, outcome }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors">
        <div className="font-black text-white text-lg tracking-tight uppercase flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            {title}
        </div>
        <div className="text-slate-400 text-sm font-medium italic">{mechanism}</div>
        <div className="text-indigo-300 font-bold text-sm tracking-wide bg-indigo-500/10 px-4 py-2 rounded-full w-fit">
            {outcome}
        </div>
    </div>
);

const FaqItem = ({ question, answer }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-white/5">
            <button 
                onClick={() => setOpen(!open)}
                className="w-full py-6 flex items-center justify-between text-left hover:text-indigo-400 transition-colors"
            >
                <span className="text-lg font-bold text-white tracking-tight">{question}</span>
                <ChevronDown size={20} className={`transform transition-transform duration-300 ${open ? 'rotate-180 text-indigo-400' : 'text-slate-600'}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-500 ${open ? 'max-h-96 pb-6' : 'max-h-0'}`}>
                <p className="text-slate-400 leading-relaxed">{answer}</p>
            </div>
        </div>
    );
};

/* ─── Main Landing Page ─────────────────────────────────────────── */

export default function LandingPage() {
    const {
        store
    } = usePage().props;

    const { props } = usePage();
    const settings = props.settings || {};
    const [scrolled, setScrolled] = useState(false);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setAnimate(true);
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#020010] text-white font-sans selection:bg-indigo-500/40 no-scrollbar overflow-x-hidden">
            <Head>
                <title>{`${settings.app_name || 'VenQore'} — The Books Are Always Right.`}</title>
                <meta name="description" content="VenQore is the first operations platform built on financial truth. Every sale, return, transfer, and payment writes a correct journal entry." />
            </Head>

            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-900/15 rounded-full blur-[160px] animate-pulse-slow" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] bg-violet-900/10 rounded-full blur-[140px] animate-pulse-slow-delay" />
                <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            {/* Nav */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#020010]/80 backdrop-blur-xl border-b border-white/5 py-3' : 'py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <img src={settings.logo_url || "/images/logo.png"} alt="Logo" className="h-10 w-auto" />
                        <span className="font-black text-white text-xl uppercase tracking-tighter">{settings.app_name || 'VenQore'}</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-10">
                        <Link href="/features" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Features</Link>
                        <Link href="/pricing" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Pricing</Link>
                        <Link href="/blog" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Blog</Link>
                        <Link href="/about" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">About</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hidden sm:block text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">Sign In</Link>
                        <Link href="/register" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all hover:scale-105 shadow-xl shadow-indigo-600/30">
                            Start Free Trial
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="relative z-10">
                {/* ── 1. HERO ──────────────────────────────────────────────── */}
                <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-32 pb-24">
                    <div className={`transition-all duration-1000 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase mb-10">
                            <ShieldCheck size={14} className="animate-pulse" />
                            Auditor-Grade Financial Accuracy
                        </div>
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 leading-[0.85] text-glow relative overflow-hidden pb-4">
                            <span className="relative inline-block overflow-hidden">
                                <span className="block animate-character-rise bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                                    The Books Are
                                </span>
                                <span className="absolute inset-0 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent opacity-20 blur-sm animate-glitch-fast">The Books Are</span>
                            </span>
                            <br />
                            <span className="relative inline-block overflow-hidden">
                                <span className="block animate-character-rise-delay bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent text-glow">
                                    Always Right.
                                </span>
                                <span className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent opacity-20 blur-sm animate-glitch-slow">Always Right.</span>
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-12 font-medium">
                            VenQore is the POS and ERP platform where every sale, purchase, and transfer automatically creates a correct journal entry — <span className="text-white">without an accountant in the room.</span>
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                            <Link href="/register" className="group flex items-center gap-3 px-12 py-5 bg-white text-black hover:bg-indigo-50 rounded-full font-black text-lg transition-all hover:scale-105 hover:shadow-[0_0_50px_-5px_rgba(255,255,255,0.4)]">
                                Start Free Trial
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="/demo" className="flex items-center gap-3 px-10 py-5 bg-white/5 border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-sm">
                                <Play size={18} fill="currentColor" /> Live Demo
                            </Link>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-white/10 pt-10 px-4">
                            {[
                                { val: '1.2s', label: 'Scan to Journal' },
                                { val: '38', label: 'Verified Reports' },
                                { val: 'FIFO', label: 'Cost Basis' },
                                { val: '0.00', label: 'Balance Error' }
                            ].map((stat, i) => ( stat &&
                                <div key={i} className="text-center">
                                    <div className="text-3xl font-black text-white mb-1 uppercase tracking-tighter leading-none">{stat.val}</div>
                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 2. PATTERN INTERRUPT ─────────────────────────────────── */}
                <section className="py-32 px-6">
                    <div className="max-w-7xl mx-auto bg-slate-900/30 border border-white/10 rounded-[4rem] p-12 md:p-24 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 text-white/5 pointer-events-none">
                            <ZapOff size={200} strokeWidth={0.5} />
                        </div>
                        <div className="max-w-4xl relative z-10">
                            <h2 className="text-indigo-400 text-sm font-black uppercase tracking-[0.3em] mb-10">The Uncomfortable Truth</h2>
                            <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-10 leading-[0.9]">
                                Most business software <br />
                                <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent italic">lies to you.</span>
                            </h3>
                            <div className="space-y-8 text-xl md:text-2xl text-slate-400 leading-relaxed font-medium">
                                <p>Not maliciously. Just structurally. Your "revenue" includes the tax you owe the government. Your profit includes units you bought at last year's price. Your inventory value is calculated from a number that was silently overwritten three purchases ago.</p>
                                <p className="text-white">You've been making decisions on fabricated data. We built VenQore to end that.</p>
                            </div>
                            
                            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/10">
                                    <AlertTriangle className="text-red-500 mb-6" size={32} />
                                    <h4 className="text-white font-bold mb-3">Tax-as-Revenue Fraud</h4>
                                    <p className="text-slate-500 text-sm">Most systems inflate your top-line by 10-20% by including VAT/GST as revenue. We separate them at the DB level.</p>
                                </div>
                                <div className="p-8 rounded-3xl bg-orange-500/5 border border-orange-500/10">
                                    <Calculator className="text-orange-500 mb-6" size={32} />
                                    <h4 className="text-white font-bold mb-3">The FIFO Lie</h4>
                                    <p className="text-slate-500 text-sm">Calculated profit using overwritten averages? Your margins are permanently wrong. We track every batch cost.</p>
                                </div>
                                <div className="p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                                    <Fingerprint className="text-indigo-500 mb-6" size={32} />
                                    <h4 className="text-white font-bold mb-3">Immutable Ledger</h4>
                                    <p className="text-slate-500 text-sm">Edits without reversal trails? That's not accounting, it's guessing. VenQore forces audit-proof logic.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 3. MECHANISMS (TRUTH TABLE) ─────────────────────────── */}
                <section className="py-32 px-6 max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 uppercase leading-none">
                            The Architecture <br /> of <span className="text-indigo-500">Truth.</span>
                        </h2>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto">Every feature traceable to a real financial problem.</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                            <div>Unique Mechanism</div>
                            <div>What It Is</div>
                            <div>The Outcome</div>
                        </div>
                        <MechanismItem 
                            title="FIFO Engine" 
                            mechanism="Batch-level inventory tracking" 
                            outcome="Real COGS per sale" 
                        />
                        <MechanismItem 
                            title="Double-Entry Wall" 
                            mechanism="SaleObserver blocks direct edits" 
                            outcome="Audit-Proof Ledger" 
                        />
                        <MechanismItem 
                            title="Hardware Heartbeat" 
                            mechanism="Electron power-state detection" 
                            outcome="Loss-Proof POS" 
                        />
                        <MechanismItem 
                            title="Auto-Assembly" 
                            mechanism="BOM-triggered manufacturing" 
                            outcome="Instant Stock Fulfillment" 
                        />
                        <MechanismItem 
                            title="Three AI Brains" 
                            mechanism="Retention, Forecasting, Churn" 
                            outcome="Proactive Intelligence" 
                        />
                    </div>
                </section>

                {/* ── 4. CORE BENEFITS ─────────────────────────────────────── */}
                <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FeatureCard 
                            icon={ShieldCheck} 
                            title="Financial Accuracy"
                            body="Every transaction posts a journal entry. Every cost is tracked by batch. Every balance sheet balances. Auditor-grade financial statements."
                            color="bg-indigo-500/20 text-indigo-400"
                        />
                        <FeatureCard 
                            icon={Boxes} 
                            title="Operational Control"
                            body="Manage multiple warehouses, stock transfers with audit trails, and batch/expiry management. Nothing moves without a record."
                            color="bg-cyan-500/20 text-cyan-400"
                        />
                        <FeatureCard 
                            icon={Zap} 
                            title="Professional POS"
                            body="25+ keyboard shortcuts. 10 simultaneous tabs. Crash airbag that saves carts locally before the server knows there is a problem."
                            color="bg-amber-500/20 text-amber-400"
                        />
                        <FeatureCard 
                            icon={Cpu} 
                            title="Intelligence Built In"
                            body="Predicting when customers will return, forecasting stock depletion, and detecting churn before it happens. Signal over noise."
                            color="bg-emerald-500/20 text-emerald-400"
                        />
                        <FeatureCard 
                            icon={BarChart3} 
                            title="38 Master Reports"
                            body="P&L, Balance Sheet, Aged Receivables, Stock Valuation — all generated from the same verified ledger. Not approximations."
                            color="bg-pink-500/20 text-pink-400"
                        />
                        <FeatureCard 
                            icon={RefreshCw} 
                            title="Full Staff Lifecycle"
                            body="Role-gated dashboards, attendance with gap detection, kiosk lockdown, and manager overrides. Your team, fully managed."
                            color="bg-indigo-500/20 text-indigo-400"
                        />
                    </div>
                </section>

                {/* ── 5. SOCIAL PROOF ──────────────────────────────────────── */}
                <section className="py-32 px-6 border-t border-white/5 bg-white/[0.01]">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                        <div>
                            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[0.9] uppercase">
                                Built for <br /> <span className="text-indigo-500">Operators.</span>
                            </h2>
                            <p className="text-xl text-slate-400 leading-relaxed mb-10">
                                We've seen what happens to businesses running on substandard software. We built VenQore for the operator who is done guessing.
                            </p>
                            <Link href="/about" className="text-indigo-400 font-bold flex items-center gap-2 hover:text-white transition-colors">
                                LEARN OUR STORY <ArrowRight size={18} />
                            </Link>
                        </div>
                        <div className="space-y-8">
                            {[
                                { text: "For the first time, my daily revenue matched what my accountant calculated at month-end. We're not adjusting numbers anymore — they just come out right.", author: "Electronics Retailer, 3 locations" },
                                { text: "We process 800+ transactions a day. The keyboard shortcuts and multi-tab system mean our cashiers never touch a mouse. Throughput went up 30%.", author: "Supermarket Operator" }
                            ].map((quote, i) => ( quote &&
                                <div key={i} className="p-8 rounded-[2.5rem] bg-indigo-600/5 border-l-4 border-indigo-600">
                                    <p className="text-lg text-slate-300 italic mb-6 leading-relaxed">"{quote.text}"</p>
                                    <div className="text-sm font-black text-white uppercase tracking-widest">— {quote.author}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 6. FAQ ───────────────────────────────────────────────── */}
                <section className="py-32 px-6 max-w-4xl mx-auto">
                    <h2 className="text-4xl font-black text-white text-center mb-16 tracking-tighter uppercase">Common Questions</h2>
                    <div className="space-y-4">
                        <FaqItem 
                            question="Is VenQore a POS or an accounting system?" 
                            answer="Both. The POS generates double-entry journal entries automatically. The accounting module generates auditor-grade statements from those entries. They're the same system — not integrated, not synced, not connected. The same." 
                        />
                        <FaqItem 
                            question="Do I need an accountant to use it?" 
                            answer="No. VenQore handles the double-entry mechanics automatically. Every sale, purchase, return, and adjustment creates the correct journal entry. Your accountant can verify the output — they just won't need to create it manually." 
                        />
                        <FaqItem 
                            question="How long does setup take?" 
                            answer="The onboarding wizard takes 10–15 minutes. If you're migrating from Vyapar, your full data history can be imported the same day. Most businesses are processing live transactions within 24 hours of signing up." 
                        />
                        <FaqItem 
                            question="Does it work with unstable power?" 
                            answer="Yes. The desktop station runs locally and syncs when online. Active carts survive crashes, reloads, and power interruptions. The Hardware Heartbeat system distinguishes power cuts from manual shutdowns." 
                        />
                        <FaqItem 
                            question="What happens to my data if I cancel?" 
                            answer="It's yours. Export it at any time. We don't hold data hostage." 
                        />
                    </div>
                </section>

                {/* ── 7. FINAL CTA ─────────────────────────────────────────── */}
                <section className="py-32 px-6 text-center overflow-hidden">
                    <div className="max-w-4xl mx-auto relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                        <h2 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-tight relative z-10">
                            You already know <br /> your <span className="text-indigo-500">numbers are wrong.</span>
                        </h2>
                        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed relative z-10">
                            The only question is whether you'll fix it this year or keep guessing. 14-day free trial, full access, no credit card required.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                            <Link href="/register" className="px-12 py-5 bg-white text-black rounded-full font-black text-xl hover:bg-slate-100 transition-all hover:scale-105 shadow-2xl shadow-indigo-900/30">
                                Start Your Free Trial →
                            </Link>
                            <Link href="/contact" className="px-12 py-5 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 rounded-full font-bold text-xl hover:bg-indigo-600/20 transition-all backdrop-blur-sm">
                                Talk to Sales
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-24 px-6 relative z-10 bg-[#020010]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-3 mb-8">
                            <img src={settings.logo_url || "/images/logo.png"} alt="Logo" className="h-12 w-auto" />
                            <span className="font-black text-white text-2xl uppercase tracking-tighter">{settings.app_name || 'VenQore'}</span>
                        </Link>
                        <p className="text-slate-500 max-w-md leading-relaxed">
                            VenQore replaces your POS, your accountant's spreadsheets, your warehouse clipboard, your staff attendance log, and your supplier ledger — with one system that keeps numbers other software can't even compute.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8">Platform</h4>
                        <ul className="space-y-4 text-sm text-slate-500 font-bold">
                            <li><Link href="/features" className="hover:text-white transition-colors uppercase">Features</Link></li>
                            <li><Link href="/pricing" className="hover:text-white transition-colors uppercase">Pricing</Link></li>
                            <li><Link href="/blog" className="hover:text-white transition-colors uppercase">Blog</Link></li>
                            <li><Link href="/about" className="hover:text-white transition-colors uppercase">About Us</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8">Connect</h4>
                        <div className="space-y-6">
                            <a href="https://wa.me/92XXXXXXXXXX" className="flex items-center gap-3 p-4 rounded-3xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 transition-all">
                                <MessageCircle size={24} />
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest">WhatsApp Sales</div>
                                    <div className="text-[10px] opacity-70">Immediate Response</div>
                                </div>
                            </a>
                            <Link href="/contact" className="flex items-center gap-3 p-4 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20 transition-all">
                                <Lock size={24} />
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest">Book a Demo</div>
                                    <div className="text-[10px] opacity-70">1-on-1 Personalized Walkthrough</div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pt-12 border-t border-white/5">
                    <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">© 2026 VenQore. All rights reserved. The Books Are Always Right.</span>
                    <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-700">
                        <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
                    </div>
                </div>
            </footer>

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.15; transform: scale(1); }
                    50% { opacity: 0.25; transform: scale(1.05); }
                }
                .animate-pulse-slow { animation: pulse-slow 12s ease-in-out infinite; }
                .animate-pulse-slow-delay { animation: pulse-slow 14s ease-in-out infinite 2s; }
                
                @keyframes character-rise {
                    0% { transform: translateY(110%); opacity: 0; filter: blur(10px); }
                    100% { transform: translateY(0); opacity: 1; filter: blur(0); }
                }
                .animate-character-rise { 
                    animation: character-rise 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
                .animate-character-rise-delay { 
                    animation: character-rise 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
                    transform: translateY(110%);
                }
                
                @keyframes glitch-fast {
                    0%, 100% { transform: translate(0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); }
                }
                .animate-glitch-fast { animation: glitch-fast 0.2s linear infinite; opacity: 0; }
                
                @keyframes glitch-slow {
                    0%, 100% { transform: translate(0); }
                    10% { transform: translate(-1px, 1px); }
                    20% { transform: translate(1px, -1px); }
                }
                .animate-glitch-slow { animation: glitch-slow 3s linear infinite; }

                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .animate-shimmer {
                    background-size: 200% auto;
                    animation: shimmer 8s linear infinite;
                }
                .text-glow { text-shadow: 0 0 60px rgba(99, 102, 241, 0.4); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

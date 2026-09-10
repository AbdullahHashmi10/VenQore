import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight, Check, CheckCircle2, ShieldCheck, Scale, Sparkles,
    Clock, ChevronDown, ChevronUp, Layers, Zap, Boxes, Database,
    Scan, Receipt, Bot, Repeat, Building2, TrendingUp, ShoppingCart,
    Truck, Cpu, Warehouse, Banknote, FileText, AlertTriangle, Play,
    Plus, Lock, RefreshCw, BarChart3, Users, ExternalLink, Globe,
    ChevronRight, CornerDownRight, CheckCircle, Package, Send
} from 'lucide-react';
import MarketingLayout, { RevealOnScroll, MagneticButton, SectionLabel, GlassCard } from './Marketing/Shared/MarketingLayout';

/* ── Animated Counter Hook ─────────────────────────────────────────────────── */
function AnimCounter({ end, decimals = 0, suffix = '', prefix = '', duration = 1800 }) {
    const [val, setVal] = useState(0);
    const ref = useRef(null);
    const ran = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !ran.current) {
                ran.current = true;
                const start = performance.now();
                const target = Number(end);
                const step = (now) => {
                    const progress = Math.min(1, (now - start) / duration);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    setVal(target * eased);
                    if (progress < 1) requestAnimationFrame(step);
                    else setVal(target);
                };
                requestAnimationFrame(step);
            }
        }, { threshold: 0.2 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [end, duration]);

    const formatted = decimals > 0
        ? val.toFixed(decimals)
        : Math.round(val).toLocaleString();

    return (
        <span ref={ref}>
            {prefix}{formatted}{suffix}
        </span>
    );
}

export default function LandingPage() {
    const { auth = {}, flash = {} } = usePage().props;

    // Hero prompt state
    const [promptText, setPromptText] = useState('');
    const promptPlaceholders = useMemo(() => [
        'Retail pharmacy with batch & expiry tracking...',
        'Wholesale FMCG distributor with 30-day credit aging...',
        'Multi-branch clothing boutique with variant matrix...',
        'Electronics repair & retail with serial IMEI lineage...',
        'Supermarket with fast lane barcode scanning...'
    ], []);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % promptPlaceholders.length);
        }, 3600);
        return () => clearInterval(interval);
    }, [promptPlaceholders]);

    const handlePromptSubmit = (e) => {
        e?.preventDefault();
        const text = promptText.trim() || promptPlaceholders[placeholderIndex];
        router.visit('/build-workspace?prompt=' + encodeURIComponent(text));
    };

    const handleSelectChip = (chipText) => {
        setPromptText(chipText);
        router.visit('/build-workspace?prompt=' + encodeURIComponent(chipText));
    };

    // ── 5-Stage Compiler Theater State ──────────────────────────────────────────
    const [activeStage, setActiveStage] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const compilerStages = useMemo(() => [
        {
            num: '01',
            title: 'Intent',
            sub: 'You describe how you operate',
            heading: 'THE OWNER TYPES',
            code: 'Retail pharmacy with 2 branches, 3 cashiers per shift, batch-level FEFO expiry tracking, and distributor credit terms on 30-day invoices.',
            explainer: 'No forms. No implementation consultant. One paragraph in your own words.'
        },
        {
            num: '02',
            title: 'Parse',
            sub: 'Entities, workflows & ledger routes',
            heading: 'DOMAIN DECONSTRUCTION',
            entities: ['Drugs & SKUs', 'Batches (FEFO)', 'Expiry Dates', 'Branches (2)', 'Distributors'],
            workflows: ['Counter Checkout', 'Batch-first Picking', 'Branch Transfers', 'Expiry Write-off'],
            financialRoutes: ['Accounts Payable (30-day terms)', 'Sales Tax on Invoice', 'FIFO Inventory Valuation']
        },
        {
            num: '03',
            title: 'Select',
            sub: 'Proven engines parameterized',
            heading: 'ENGINE TOPOLOGY',
            engines: [
                { name: 'POS Checkout', status: 'SELECTED' },
                { name: 'Batch & Expiry', status: 'SELECTED' },
                { name: 'Stock Ledger (FIFO)', status: 'SELECTED' },
                { name: 'Manufacturing BOM', status: 'BYPASSED' },
                { name: 'Purchases & Credit', status: 'SELECTED' },
                { name: 'Branch Transfers', status: 'SELECTED' },
                { name: 'Payroll Engine', status: 'BYPASSED' },
                { name: 'Core Ledger', status: 'ALWAYS ON' }
            ]
        },
        {
            num: '04',
            title: 'Wire',
            sub: 'Routes bound to double-entry core',
            heading: 'LEDGER WIRING',
            topology: [
                { source: 'POS Terminals (Branch 1 & 2)', target: 'Stock & Batch Engine', type: 'Instant Debit' },
                { source: 'Purchase Receipts', target: 'Payables & Terms Ledger', type: 'Credit 30-day' },
                { source: 'SmartCapture Scan', target: 'Core Ledger Invariant', type: 'Self-Balanced' }
            ]
        },
        {
            num: '05',
            title: 'Live',
            sub: 'Your verified system, running',
            heading: 'ACTIVE TERMINAL',
            cart: [
                { item: 'Amoxicillin 500mg × 2', batch: 'BATCH A-2291 · EXP 03/2027', price: '$24.00' },
                { item: 'Insulin pen refill', batch: 'BATCH C-0417 · EXP 11/2026', price: '$48.50' },
                { item: 'Paracetamol strip × 4', batch: 'BATCH P-8802 · EXP 08/2028', price: '$8.00' }
            ],
            total: '$80.50',
            checksPassed: '8/8 Correctness Laws Verified',
            debitCredit: 'Debits $80.50 = Credits $80.50'
        }
    ], []);

    useEffect(() => {
        if (!isAutoPlaying) return;
        const timer = setInterval(() => {
            setActiveStage((prev) => (prev + 1) % compilerStages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [isAutoPlaying, compilerStages.length]);

    // ── Product Showcase Tabs ───────────────────────────────────────────────────
    const [activeShowcase, setActiveShowcase] = useState(0);
    const showcaseTabs = useMemo(() => [
        {
            id: 'pos',
            title: '01 · The Register',
            subtitle: 'A till you compose yourself.',
            badge: 'OFFLINE FIRST',
            desc: 'Keyboard-first, barcode-ready, and laid out the way your counter actually works. Split tender, parked sales, partial returns against the original line — and an instant PIN cashier switch.',
            href: '/pos',
            sampleData: [
                { line: 'Amoxicillin 500mg × 2', sub: 'BATCH A-2291 · EXP 03/2027', val: '$24.00' },
                { line: 'Insulin pen refill', sub: 'BATCH C-0417 · EXP 11/2026', val: '$48.50' },
                { line: 'Paracetamol strip × 4', sub: 'BATCH P-8802 · EXP 08/2028', val: '$8.00' },
            ],
            total: '$80.50'
        },
        {
            id: 'documents',
            title: '02 · Documents',
            subtitle: '13 document types, one verified editor.',
            badge: 'LINKED FLOWS',
            desc: 'Quote, sales order, delivery challan, invoice, credit note, purchase order, GRN, supplier bill, statement — all the same editor, all posting through the immutable general ledger.',
            href: '/documents',
            sampleData: [
                { line: 'Converted from Quote Q-0288', sub: 'Same items, same customer, zero retyping', val: 'LINKED' },
                { line: 'Posted to Core Ledger', sub: 'AR $80.50 / Revenue $72.00 / Tax $8.50', val: '7/7 CHECKS' },
                { line: 'Delivery Status', sub: 'Waybill generated · Dispatch confirmed', val: 'DISPATCHED' }
            ],
            total: '13 TYPES'
        },
        {
            id: 'blueprint',
            title: '03 · Blueprint',
            subtitle: 'Describe the change. Read the diff. Approve it.',
            badge: 'VERSIONED DIFF',
            desc: 'Adding a branch, a sales channel or a whole product line is a sentence. Blueprint shows you exactly what it will add, alter and touch downstream before a single row moves.',
            href: '/blueprint',
            sampleData: [
                { line: '+ Tier pricing matrix', sub: 'New engine wired', val: 'ADD' },
                { line: '+ Branch transfers', sub: 'Atomic double-entry stock routes', val: 'ADD' },
                { line: '~ Customer record', sub: 'Gains credit limit & price tier', val: 'ALTER' }
            ],
            total: 'ZERO DOWNTIME'
        },
        {
            id: 'reckoner',
            title: '04 · The Reckoner',
            subtitle: 'One single place a number is defined.',
            badge: '58 READINGS',
            desc: 'Every figure on every screen resolves to a single definition you can inspect and audit. No two reports disagreeing about margin, because there is only one definition in the entire system.',
            href: '/reckoner',
            sampleData: [
                { line: 'Gross margin', sub: '(Revenue − COGS) ÷ Revenue', val: '34.2%' },
                { line: 'True Revenue', sub: 'Posted sales, net of returns and tax', val: '$148,920' },
                { line: 'FIFO COGS', sub: 'Batch cost lineage at time of sale', val: '$97,989' }
            ],
            total: 'ZERO DRIFT'
        },
        {
            id: 'dashboard',
            title: '05 · The Dashboard',
            subtitle: 'It builds itself out of what you turned on.',
            badge: 'LIVE INTELLIGENCE',
            desc: 'A pharmacy sees expiry exposure and supplier aging. A boutique sees variant sell-through and channel split. Same engine, same 58 readings underneath — only relevant metrics appear.',
            href: '/dashboard-preview',
            sampleData: [
                { line: 'Consolidated Cash Position', sub: 'Across all active registers', val: '$42,100' },
                { line: 'Expiring in 45 days', sub: '3 batches flagged for FEFO priority', val: '$1,840' },
                { line: 'Payables over 30 days', sub: '2 suppliers pending settlement', val: '$4,120' }
            ],
            total: '58 METRICS'
        }
    ], []);

    // ── 8 Correctness Laws ──────────────────────────────────────────────────────
    const correctnessLaws = useMemo(() => [
        { num: '01', title: 'Debits Equal Credits Always', desc: 'Every transaction posts balanced double-entry journals. Unbalanced entries are rejected at the engine level.' },
        { num: '02', title: 'Immutable Posted Ledger', desc: 'Posted records can never be edited or erased in place. Corrections flow strictly through reversal entries.' },
        { num: '03', title: 'True FIFO Cost Lineage', desc: 'Inventory consumes the exact purchase batch cost in sequence, ensuring auditor-grade COGS.' },
        { num: '04', title: 'Derived Zero-Drift Balances', desc: 'Account balances are calculated deterministically from posted history, eliminating silent total drift.' },
        { num: '05', title: 'Universal Tenant Scoping', desc: 'Global query scopes enforce strict multi-tenant isolation across all 116 data models.' },
        { num: '06', title: 'Atomic Multi-Branch Transfers', desc: 'Stock movements between locations deduct from source and credit destination in a single atomic transaction.' },
        { num: '07', title: 'Auditable Reversible Actions', desc: 'Every user and cashier action produces an immutable audit trail with full cryptographic traceability.' },
        { num: '08', title: 'Automated Continuous Verification', desc: 'Eight correctness laws and 1,600+ tests execute against every build before code is allowed to ship.' }
    ], []);

    // ── Industry Verticals Switcher ─────────────────────────────────────────────
    const [selectedIndustry, setSelectedIndustry] = useState('pharmacy');
    const industriesData = useMemo(() => ({
        pharmacy: {
            name: 'Pharmacy & Healthcare',
            headline: 'FEFO batch expiry tracking with instant lane checkout',
            features: ['Batch & Expiry Date Management', 'Short-Dated Stock Alerts (45 Days)', 'Doctor & Prescription Reference', 'Narcotics & Controlled Schedule Logs'],
            badge: 'HEALTHCARE READY',
            href: '/solutions/pharmacy'
        },
        grocery: {
            name: 'Supermarket & Grocery',
            headline: 'High-speed lane barcode scanning with weight scale integration',
            features: ['Weighed Item & Barcode Scale Sync', 'Fast Multi-Cart Park & Recall', 'Automated Reorder Trigger Points', 'Daily Margin & Shrinkage Analytics'],
            badge: 'HIGH SPEED',
            href: '/solutions/grocery'
        },
        clothing: {
            name: 'Apparel & Boutiques',
            headline: 'Size, color, and fit variant matrix with customer loyalty',
            features: ['2D Size/Color Variant Grid', 'Seasonal Collection Tagging', 'Customer Loyalty & Khata Points', 'Rail Price Tag Sheet Printing'],
            badge: 'VARIANT MATRIX',
            href: '/solutions/clothing'
        },
        electronics: {
            name: 'Electronics & Repairs',
            headline: 'Serial IMEI tracking from purchase PO to warranty claims',
            features: ['Serial Number & IMEI Lineage', 'Repair Job Card & Dispatch', 'Warranty History Lookup in Seconds', 'Deposit & Split Tender Intake'],
            badge: 'SERIAL TRACKING',
            href: '/solutions/electronics-store'
        },
        wholesale: {
            name: 'Wholesale & Distribution',
            headline: 'Tier pricing, credit aging, container POs and delivery challans',
            features: ['Customer Tier Pricing Matrix', 'Aged Receivables & WhatsApp Khata', 'Partial Delivery Challans', 'Multi-Warehouse Atomic Transfers'],
            badge: 'B2B DISTRIBUTION',
            href: '/solutions/wholesale'
        },
        multi: {
            name: 'Multi-Store Chains',
            headline: 'Consolidated executive visibility across all branches and channels',
            features: ['Central Stock Balancing', 'Inter-Branch Stock Transfers', 'Aggregated P&L and Balance Sheet', 'Role-Based Cashier Security'],
            badge: 'ENTERPRISE READY',
            href: '/solutions/multi-store'
        }
    }), []);

    // ── Pricing Switcher ────────────────────────────────────────────────────────
    const [isAnnual, setIsAnnual] = useState(true);

    // ── FAQ Accordion ───────────────────────────────────────────────────────────
    const [openFaq, setOpenFaq] = useState(null);
    const faqs = useMemo(() => [
        {
            q: 'Is my accounting safe if an AI configured it?',
            a: 'Yes. The AI composes your system — which modules run, what your fields are called, who approves what. It never touches the accounting engine. Debits equal credits or the transaction does not post, and that rule is in the deterministic engine, not in a prompt.'
        },
        {
            q: 'What happens if the Blueprint gets my setup wrong?',
            a: 'You see the full plan before anything is real. Every module, field, and workflow is editable. Nothing posts to your books until you approve it, and every applied configuration keeps a version snapshot you can roll back.'
        },
        {
            q: 'Can I add more branches or channels later?',
            a: 'Just describe the change in plain English. Blueprint shows you a diff — what is added, what changes, and what is affected downstream — and you approve it in seconds. Adding a branch or e-commerce store is a sentence, not a 3-month consulting project.'
        },
        {
            q: 'Does VenQore work when my internet goes down?',
            a: 'Yes. VenQore is built as an offline-first Progressive Web App (PWA). Your POS checkout, barcode lookups, local carts, and WebUSB receipt printing run seamlessly without internet and sync back automatically when connectivity returns.'
        },
        {
            q: 'Are there any hidden transaction fees or markups like Square?',
            a: 'Zero. VenQore charges a flat subscription starting at $18/month (or free forever on Solo tier). We charge $0 transaction fees regardless of whether you process $1,000 or $1,000,000.'
        }
    ], []);

    return (
        <MarketingLayout title="VenQore — The AI ERP Builder for POS, Stock & Accounting">
            <Head>
                <title>VenQore — The AI ERP Builder for POS, Stock &amp; Accounting</title>
                <meta name="description" content="Describe your business in plain language. VenQore assembles the operating system that runs it, with verified double-entry accounting under every module." />
            </Head>

            {/* ══════════════════════════════════════════════════════════════════════
                1. HERO SECTION WITH INTERACTIVE AI PROMPT
                ══════════════════════════════════════════════════════════════════════ */}
            <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto text-center overflow-hidden">
                {/* Background Ambient Halo */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-brand-500/10 blur-[140px] pointer-events-none rounded-full" />

                <RevealOnScroll direction="up">
                    <SectionLabel icon={Sparkles} text="THE AI ERP BUILDER" />

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-ink tracking-tight mb-6 mt-4 max-w-4xl mx-auto font-display leading-[1.08]">
                        Tell us how you operate.<br />
                        We <span className="text-brand-500 relative inline-block">assemble<span className="absolute left-0 right-0 bottom-1.5 h-1.5 rounded-full bg-brand-500/30"></span></span> your system.
                    </h1>

                    <p className="text-lg md:text-xl text-ink-secondary max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                        VenQore is an AI ERP builder for retail and wholesale. Describe how you operate and it assembles the system that runs it — point of sale, inventory, purchasing, invoicing and real double-entry accounting — keeping only the modules you use. Starts at $18 a month, or free on Solo, with no implementation project.
                    </p>

                    {/* Interactive Prompt & Preset Builder */}
                    <div className="max-w-2xl mx-auto mb-8">
                        <form onSubmit={handlePromptSubmit} className="relative rounded-2xl border border-line dark:border-white/10 bg-surface/90 dark:bg-white/[0.03] backdrop-blur-xl shadow-2xl p-2.5 transition-all focus-within:border-brand-500/50 focus-within:ring-2 focus-within:ring-brand-500/20">
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={promptText}
                                    onChange={(e) => setPromptText(e.target.value)}
                                    placeholder={promptPlaceholders[placeholderIndex]}
                                    className="w-full bg-transparent border-none outline-none text-ink text-sm md:text-base px-4 py-3 placeholder:text-ink-muted focus:ring-0"
                                />
                                <button
                                    type="submit"
                                    className="vq-btn vq-btn--primary shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
                                >
                                    <span>Build System</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </form>

                        {/* Industry Preset Quick Chips */}
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                            <span className="text-2xs uppercase tracking-widest text-ink-muted font-bold mr-2">Try Presets:</span>
                            <button onClick={() => handleSelectChip('Retail pharmacy with FEFO batch expiry')} className="px-3 py-1 rounded-full text-xs font-semibold bg-sunken dark:bg-white/5 text-ink-secondary hover:text-brand-500 hover:bg-brand-500/10 border border-line dark:border-white/5 transition-all">
                                💊 Pharmacy
                            </button>
                            <button onClick={() => handleSelectChip('Wholesale distributor with 30-day credit aging')} className="px-3 py-1 rounded-full text-xs font-semibold bg-sunken dark:bg-white/5 text-ink-secondary hover:text-brand-500 hover:bg-brand-500/10 border border-line dark:border-white/5 transition-all">
                                📦 Wholesale
                            </button>
                            <button onClick={() => handleSelectChip('Supermarket with lane barcode scanning & scale')} className="px-3 py-1 rounded-full text-xs font-semibold bg-sunken dark:bg-white/5 text-ink-secondary hover:text-brand-500 hover:bg-brand-500/10 border border-line dark:border-white/5 transition-all">
                                🛒 Grocery
                            </button>
                            <button onClick={() => handleSelectChip('Clothing boutique with size color variants')} className="px-3 py-1 rounded-full text-xs font-semibold bg-sunken dark:bg-white/5 text-ink-secondary hover:text-brand-500 hover:bg-brand-500/10 border border-line dark:border-white/5 transition-all">
                                👗 Apparel
                            </button>
                            <button onClick={() => handleSelectChip('Multi-branch retail chain with central stock')} className="px-3 py-1 rounded-full text-xs font-semibold bg-sunken dark:bg-white/5 text-ink-secondary hover:text-brand-500 hover:bg-brand-500/10 border border-line dark:border-white/5 transition-all">
                                🏢 Multi-Store
                            </button>
                        </div>
                    </div>

                    {/* Value Metrics Row */}
                    <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-ink-muted font-medium mb-12">
                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-brand-500" /> 46 modules, only yours switched on</span>
                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-brand-500" /> 58 readings, one definition each</span>
                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-brand-500" /> 8 correctness laws run on every release</span>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-wrap justify-center items-center gap-4">
                        <MagneticButton href="/demo" variant="primary">
                            Explore Live Demo — No Signup <ArrowRight className="w-4 h-4 ml-2" />
                        </MagneticButton>
                        <MagneticButton href="/build-workspace" variant="secondary">
                            Start Building Now
                        </MagneticButton>
                    </div>
                </RevealOnScroll>
            </section>

            {/* ══════════════════════════════════════════════════════════════════════
                2. TICKER STRIP — CONTINUOUS VERIFICATION
                ══════════════════════════════════════════════════════════════════════ */}
            <div className="border-y border-line dark:border-white/5 bg-sunken/40 dark:bg-white/[0.01] py-4 overflow-hidden">
                <div className="flex gap-12 text-xs font-semibold uppercase tracking-wider text-ink-secondary whitespace-nowrap animate-marquee">
                    <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-500"></span> 2 Businesses Live Today Running Real Money Through Core Ledger</span>
                    <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-500"></span> Eight Correctness Laws Run on Every Release</span>
                    <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-500"></span> One Core Ledger Under Every Module</span>
                    <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-500"></span> 46 Proven Modules Parameterized in Milliseconds</span>
                    <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-500"></span> Zero Balance Drift with Immutable Double-Entry Ledger</span>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════════
                3. PROOF & METRICS STRIP
                ══════════════════════════════════════════════════════════════════════ */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <RevealOnScroll direction="up">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                        <span className="text-2xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">WHAT WE CAN ACTUALLY PROVE</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-3xs font-bold uppercase">
                            <ShieldCheck size={12} /> AMAZON SP-API APPROVED
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="p-6 rounded-2xl bg-surface border border-line dark:border-white/5">
                            <div className="text-3xl md:text-4xl font-bold text-ink mb-1 font-numeric">
                                <AnimCounter end={2} />
                            </div>
                            <div className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-2">Businesses Live Today</div>
                            <p className="text-xs text-ink-muted">Real counters, real money every day — including the shop this system was built for.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-surface border border-line dark:border-white/5">
                            <div className="text-3xl md:text-4xl font-bold text-ink mb-1 font-numeric">
                                <AnimCounter end={1600} suffix="+" />
                            </div>
                            <div className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-2">Automated Tests</div>
                            <p className="text-xs text-ink-muted">Continuous correctness suite run against every calculation and release.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-surface border border-line dark:border-white/5">
                            <div className="text-3xl md:text-4xl font-bold text-ink mb-1 font-numeric">
                                <AnimCounter end={8} suffix=" / 8" />
                            </div>
                            <div className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-2">Correctness Laws</div>
                            <p className="text-xs text-ink-muted">Every transaction is checked eight ways before the ledger accepts it.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-surface border border-line dark:border-white/5">
                            <div className="text-3xl md:text-4xl font-bold text-ink mb-1 font-numeric">
                                <AnimCounter end={46} />
                            </div>
                            <div className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-2">Proven Modules</div>
                            <p className="text-xs text-ink-muted">Hardened in production, ready to be wired instantly for your business.</p>
                        </div>
                    </div>
                </RevealOnScroll>
            </section>

            {/* ══════════════════════════════════════════════════════════════════════
                4. THE PROBLEM — COMPARISON MATRIX
                ══════════════════════════════════════════════════════════════════════ */}
            <section className="py-20 px-6 max-w-7xl mx-auto border-t border-line dark:border-white/5">
                <RevealOnScroll direction="up">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <SectionLabel icon={Scale} text="THE PROBLEM" />
                        <h2 className="text-3xl md:text-5xl font-bold text-ink tracking-tight mb-4 mt-3">
                            Rigid software, or hallucinated software.
                        </h2>
                        <p className="text-ink-secondary text-base md:text-lg">
                            For thirty years those were the only two options. One asks your business to change shape. The other invents your numbers.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Option 1 */}
                        <div className="p-8 rounded-2xl bg-surface border border-line dark:border-white/5 flex flex-col justify-between">
                            <div>
                                <span className="text-2xs font-bold uppercase tracking-widest text-ink-muted">LEGACY ERP / POS</span>
                                <h3 className="text-xl font-bold text-ink mt-2 mb-3">Clunky &amp; Inflexible</h3>
                                <p className="text-sm text-ink-secondary leading-relaxed mb-6">
                                    500 pre-built menus and rigid settings. A bakery gets buried in wholesale manufacturing screens. A pharmacy finds batch expiry was never built into checkout.
                                </p>
                            </div>
                            <ul className="space-y-2 text-xs text-ink-muted border-t border-line dark:border-white/5 pt-4">
                                <li className="flex items-center gap-2 text-rose-500 font-medium">✕ 3 to 6 months of expensive implementation</li>
                                <li className="flex items-center gap-2 text-rose-500 font-medium">✕ Hundreds of cluttered menus you never use</li>
                            </ul>
                        </div>

                        {/* Option 2 */}
                        <div className="p-8 rounded-2xl bg-surface border border-line dark:border-white/5 flex flex-col justify-between">
                            <div>
                                <span className="text-2xs font-bold uppercase tracking-widest text-ink-muted">GENERIC AI APP BUILDERS</span>
                                <h3 className="text-xl font-bold text-ink mt-2 mb-3">Hallucinated Books</h3>
                                <p className="text-sm text-ink-secondary leading-relaxed mb-6">
                                    A prompt generates raw code from scratch. Raw code breaks accounting rules, invents numbers, and cracks under real transaction load.
                                </p>
                            </div>
                            <ul className="space-y-2 text-xs text-ink-muted border-t border-line dark:border-white/5 pt-4">
                                <li className="flex items-center gap-2 text-rose-500 font-medium">✕ No double-entry ledger invariants</li>
                                <li className="flex items-center gap-2 text-rose-500 font-medium">✕ Cannot trust financial totals for audits</li>
                            </ul>
                        </div>

                        {/* Option 3: VenQore */}
                        <div className="p-8 rounded-2xl bg-brand-500/10 border-2 border-brand-500/40 flex flex-col justify-between relative overflow-hidden shadow-xl">
                            <div className="absolute top-4 right-4 bg-brand-500 text-white text-2xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                THE COMPILER
                            </div>
                            <div>
                                <span className="text-2xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">VENQORE · THE AI COMPILER</span>
                                <h3 className="text-xl font-bold text-ink mt-2 mb-3">Both, without the trade</h3>
                                <p className="text-sm text-ink-secondary leading-relaxed mb-6">
                                    AI compiles your intent into parameterized, battle-tested financial modules. The agility of natural language with the arithmetic of hardened double-entry accounting.
                                </p>
                            </div>
                            <ul className="space-y-2 text-xs text-brand-700 dark:text-brand-300 border-t border-brand-500/20 pt-4 font-semibold">
                                <li className="flex items-center gap-2">✓ 100% custom workflows, 0% hallucinated arithmetic</li>
                                <li className="flex items-center gap-2">✓ Live in minutes with verified double-entry books</li>
                            </ul>
                        </div>
                    </div>
                </RevealOnScroll>
            </section>

            {/* ══════════════════════════════════════════════════════════════════════
                5. CORE VALUE — LEDGER BALANCE EQUATION
                ══════════════════════════════════════════════════════════════════════ */}
            <section className="py-20 px-6 max-w-5xl mx-auto text-center border-t border-line dark:border-white/5">
                <RevealOnScroll direction="up">
                    <SectionLabel icon={Scale} text="THE CORE VALUE" />
                    <h2 className="text-3xl md:text-5xl font-bold text-ink tracking-tight mb-4 mt-3">
                        Flexible where it should be. Rigid where it must be.
                    </h2>
                    <p className="text-ink-secondary text-base md:text-lg max-w-2xl mx-auto mb-10">
                        The AI decides what your system looks like. It never decides what your numbers say. Those are two different jobs, and VenQore is the only platform that keeps them strictly apart.
                    </p>

                    <div className="inline-flex flex-wrap items-center justify-center gap-8 p-8 rounded-2xl bg-surface border border-line dark:border-white/5 shadow-2xl">
                        <div className="text-center sm:text-right">
                            <span className="text-2xs font-bold uppercase tracking-widest text-ink-muted block mb-1">TOTAL DEBITS</span>
                            <span className="text-2xl sm:text-4xl font-bold text-brand-600 dark:text-brand-400 font-numeric">$66,365.20</span>
                        </div>
                        <div className="text-2xl sm:text-4xl font-bold text-ink-muted">=</div>
                        <div className="text-center sm:text-left">
                            <span className="text-2xs font-bold uppercase tracking-widest text-ink-muted block mb-1">TOTAL CREDITS</span>
                            <span className="text-2xl sm:text-4xl font-bold text-brand-600 dark:text-brand-400 font-numeric">$66,365.20</span>
                        </div>
                    </div>
                    <p className="text-xs text-ink-muted mt-4">
                        Debits equal credits or the transaction is refused — that rule lives in the engine, not in a prompt.
                    </p>
                </RevealOnScroll>
            </section>

            {/* ══════════════════════════════════════════════════════════════════════
                6. 5-STAGE COMPILER THEATER (INTERACTIVE SIMULATION)
                ══════════════════════════════════════════════════════════════════════ */}
            <section id="compiler" className="py-24 px-6 max-w-7xl mx-auto border-t border-line dark:border-white/5">
                <RevealOnScroll direction="up">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <SectionLabel icon={Cpu} text="5-STAGE COMPILER THEATER" />
                        <h2 className="text-3xl md:text-5xl font-bold text-ink tracking-tight mb-4 mt-3">
                            Watch AI compile your business system.
                        </h2>
                        <p className="text-ink-secondary text-base md:text-lg">
                            From natural language prompt to a running, multi-register operating system in five automated stages.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8 items-start">
                        {/* Stages Selector Column */}
                        <div className="lg:col-span-4 space-y-3">
                            {compilerStages.map((stage, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setActiveStage(idx); setIsAutoPlaying(false); }}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${activeStage === idx
                                        ? 'bg-brand-500/10 border-brand-500/40 shadow-lg'
                                        : 'bg-surface/50 border-line dark:border-white/5 hover:border-brand-500/20'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold font-numeric px-2 py-0.5 rounded ${activeStage === idx ? 'bg-brand-500 text-white' : 'bg-sunken text-ink-muted'
                                            }`}>
                                            {stage.num}
                                        </span>
                                        <div>
                                            <h4 className="text-sm font-bold text-ink">{stage.title}</h4>
                                            <p className="text-2xs text-ink-muted">{stage.sub}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Live Theater Display Box */}
                        <div className="lg:col-span-8 p-6 md:p-8 rounded-2xl bg-surface border border-line dark:border-white/10 shadow-2xl min-h-[420px] flex flex-col justify-between">
                            <div className="flex items-center justify-between border-b border-line dark:border-white/5 pb-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                                    <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                                    <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                                    <span className="text-2xs font-bold uppercase tracking-widest text-ink-muted ml-2">
                                        COMPILER · STAGE {compilerStages[activeStage].num}: {compilerStages[activeStage].title}
                                    </span>
                                </div>
                                <span className="text-2xs font-bold text-brand-500 uppercase tracking-widest animate-pulse">● ACTIVE RUN</span>
                            </div>

                            {/* Stage Content Renderers */}
                            <div className="flex-1 flex flex-col justify-center">
                                {activeStage === 0 && (
                                    <div className="space-y-4">
                                        <span className="text-2xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">INPUT INTENT</span>
                                        <p className="text-lg md:text-xl font-medium text-ink leading-relaxed font-mono bg-sunken/60 p-4 rounded-xl border border-line dark:border-white/5">
                                            "{compilerStages[0].code}"
                                        </p>
                                        <p className="text-xs text-ink-muted">{compilerStages[0].explainer}</p>
                                    </div>
                                )}

                                {activeStage === 1 && (
                                    <div className="space-y-4">
                                        <span className="text-2xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">IDENTIFIED DOMAIN OBJECTS</span>
                                        <div className="grid sm:grid-cols-3 gap-4">
                                            <div className="p-3 bg-sunken rounded-xl border border-line dark:border-white/5">
                                                <span className="text-3xs uppercase font-bold text-ink-muted block mb-2">ENTITIES</span>
                                                <ul className="text-xs space-y-1 text-ink font-medium">
                                                    {compilerStages[1].entities.map((e, i) => <li key={i}>• {e}</li>)}
                                                </ul>
                                            </div>
                                            <div className="p-3 bg-sunken rounded-xl border border-line dark:border-white/5">
                                                <span className="text-3xs uppercase font-bold text-ink-muted block mb-2">WORKFLOWS</span>
                                                <ul className="text-xs space-y-1 text-ink font-medium">
                                                    {compilerStages[1].workflows.map((w, i) => <li key={i}>• {w}</li>)}
                                                </ul>
                                            </div>
                                            <div className="p-3 bg-sunken rounded-xl border border-line dark:border-white/5">
                                                <span className="text-3xs uppercase font-bold text-ink-muted block mb-2">FINANCIAL ROUTES</span>
                                                <ul className="text-xs space-y-1 text-ink font-medium">
                                                    {compilerStages[1].financialRoutes.map((f, i) => <li key={i}>• {f}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeStage === 2 && (
                                    <div className="space-y-4">
                                        <span className="text-2xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">ENGINE SELECTION</span>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {compilerStages[2].engines.map((eng, i) => (
                                                <div key={i} className={`p-3 rounded-xl border ${eng.status === 'SELECTED' || eng.status === 'ALWAYS ON' ? 'bg-brand-500/10 border-brand-500/30 text-ink' : 'bg-sunken/40 border-line text-ink-muted opacity-50'}`}>
                                                    <div className="text-xs font-bold">{eng.name}</div>
                                                    <div className="text-3xs font-semibold uppercase mt-1 text-brand-600 dark:text-brand-400">{eng.status}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeStage === 3 && (
                                    <div className="space-y-4">
                                        <span className="text-2xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">LEDGER TOPOLOGY WIRING</span>
                                        <div className="space-y-2.5 font-mono text-xs">
                                            {compilerStages[3].topology.map((t, i) => (
                                                <div key={i} className="p-3 bg-sunken rounded-xl border border-line dark:border-white/5 flex items-center justify-between">
                                                    <span className="text-ink font-semibold">{t.source}</span>
                                                    <span className="text-brand-500">───►</span>
                                                    <span className="text-ink font-semibold">{t.target}</span>
                                                    <span className="text-3xs font-bold uppercase px-2 py-0.5 rounded bg-brand-500/15 text-brand-500">{t.type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeStage === 4 && (
                                    <div className="space-y-4">
                                        <span className="text-2xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">ACTIVE REGISTER · READY TO OPERATE</span>
                                        <div className="p-4 bg-sunken rounded-xl border border-line dark:border-white/5 space-y-2">
                                            {compilerStages[4].cart.map((item, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs pb-2 border-b border-line/50 last:border-none last:pb-0">
                                                    <div>
                                                        <div className="font-bold text-ink">{item.item}</div>
                                                        <div className="text-3xs text-ink-muted">{item.batch}</div>
                                                    </div>
                                                    <span className="font-bold font-numeric text-ink">{item.price}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center pt-2 font-bold">
                                            <span className="text-xs text-ink-muted">TOTAL (POSTED TO LEDGER)</span>
                                            <span className="text-lg text-brand-600 dark:text-brand-400 font-numeric">{compilerStages[4].total}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-line dark:border-white/5 flex items-center justify-between text-xs text-ink-muted">
                                <span>Stage {activeStage + 1} of 5</span>
                                <Link href="/build-workspace" className="text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1">
                                    Assemble Your Business Now <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </RevealOnScroll>
            </section>

            {/* ══════════════════════════════════════════════════════════════════════
                7. PRODUCT SHOWCASE — 5 CORE SURFACES
                ══════════════════════════════════════════════════════════════════════ */}
            <section id="showcase" className="py-24 px-6 max-w-7xl mx-auto border-t border-line dark:border-white/5">
                <RevealOnScroll direction="up">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <SectionLabel icon={Boxes} text="SURFACES YOU TOUCH" />
                        <h2 className="text-3xl md:text-5xl font-bold text-ink tracking-tight mb-4 mt-3">
                            Five screens. Everything else is behind them.
                        </h2>
                        <p className="text-ink-secondary text-base md:text-lg">
                            Simple interfaces on top, rigorous mathematics underneath.
                        </p>
                    </div>

                    {/* Showcase Tabs */}
                    <div className="flex flex-wrap justify-center gap-2 mb-10">
                        {showcaseTabs.map((tab, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveShowcase(idx)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeShowcase === idx
                                    ? 'bg-brand-500 text-white shadow-lg'
                                    : 'bg-surface border border-line dark:border-white/5 text-ink-secondary hover:text-ink'
                                    }`}
                            >
                                {tab.title}
                            </button>
                        ))}
                    </div>

                    {/* Showcase Active Surface Card */}
                    <div className="p-8 rounded-3xl bg-surface border border-line dark:border-white/10 shadow-2xl">
                        <div className="grid md:grid-cols-12 gap-8 items-center">
                            <div className="md:col-span-6 space-y-4">
                                <span className="inline-block px-3 py-1 rounded-full text-3xs font-bold uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                                    {showcaseTabs[activeShowcase].badge}
                                </span>
                                <h3 className="text-2xl md:text-3xl font-bold text-ink font-display">
                                    {showcaseTabs[activeShowcase].subtitle}
                                </h3>
                                <p className="text-ink-secondary text-sm md:text-base leading-relaxed">
                                    {showcaseTabs[activeShowcase].desc}
                                </p>
                                <Link
                                    href={showcaseTabs[activeShowcase].href}
                                    className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline pt-2"
                                >
                                    <span>Explore {showcaseTabs[activeShowcase].title.split('·')[1]}</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </div>

                            <div className="md:col-span-6 p-6 rounded-2xl bg-sunken border border-line dark:border-white/5 shadow-inner">
                                <div className="space-y-3">
                                    {showcaseTabs[activeShowcase].sampleData.map((row, i) => (
                                        <div key={i} className="p-3 bg-surface rounded-xl border border-line dark:border-white/5 flex items-center justify-between text-xs">
                                            <div>
                                                <div className="font-bold text-ink">{row.line}</div>
                                                <div className="text-3xs text-ink-muted">{row.sub}</div>
                                            </div>
                                            <span className="font-bold font-numeric text-brand-600 dark:text-brand-400">{row.val}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-line dark:border-white/5">
                                    <span className="text-3xs uppercase font-bold text-ink-muted">SUMMARY STATUS</span>
                                    <span className="text-sm font-bold font-numeric text-ink">{showcaseTabs[activeShowcase].total}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </RevealOnScroll>
            </section>

            {/* ══════════════════════════════════════════════════════════════════════
                8. EIGHT CORRECTNESS LAWS (INVARIANTS)
                ══════════════════════════════════════════════════════════════════════ */}
            <section className="py-24 px-6 max-w-7xl mx-auto border-t border-line dark:border-white/5">
                <RevealOnScroll direction="up">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <SectionLabel icon={ShieldCheck} text="MATHEMATICAL PROOF" />
                        <h2 className="text-3xl md:text-5xl font-bold text-ink tracking-tight mb-4 mt-3">
                            The Eight Correctness Laws.
                        </h2>
                        <p className="text-ink-secondary text-base md:text-lg">
                            Financial integrity enforced at the database level on every transaction.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {correctnessLaws.map((law, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-surface border border-line dark:border-white/5 flex flex-col justify-between hover:border-brand-500/30 transition-all">
                                <div>
                                    <span className="text-xs font-bold font-numeric text-brand-600 dark:text-brand-400 block mb-2">{law.num}</span>
                                    <h4 className="text-base font-bold text-ink mb-2">{law.title}</h4>
                                    <p className="text-xs text-ink-muted leading-relaxed">{law.desc}</p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-line dark:border-white/5 text-3xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 size={12} /> INVARIANT VERIFIED
                                </div>
                            </div>
                        ))}
                    </div>
                </RevealOnScroll>
            </section>

            {/* ══════════════════════════════════════════════════════════════════════
                9. INDUSTRY SOLUTIONS TABS
                ══════════════════════════════════════════════════════════════════════ */}
            <section className="py-24 px-6 max-w-7xl mx-auto border-t border-line dark:border-white/5">
                <RevealOnScroll direction="up">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <SectionLabel icon={Building2} text="TAILORED VERTICALS" />
                        <h2 className="text-3xl md:text-5xl font-bold text-ink tracking-tight mb-4 mt-3">
                            Configured for your exact trade.
                        </h2>
                        <p className="text-ink-secondary text-base md:text-lg">
                            Pre-compiled topologies for high-velocity retail, wholesale, and multi-store operations.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mb-10">
                        {Object.keys(industriesData).map((key) => (
                            <button
                                key={key}
                                onClick={() => setSelectedIndustry(key)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedIndustry === key
                                    ? 'bg-brand-500 text-white shadow-lg'
                                    : 'bg-surface border border-line dark:border-white/5 text-ink-secondary hover:text-ink'
                                    }`}
                            >
                                {industriesData[key].name.split('&')[0]}
                            </button>
                        ))}
                    </div>

                    <div className="p-8 rounded-3xl bg-surface border border-line dark:border-white/10 shadow-2xl">
                        <div className="max-w-3xl mx-auto text-center space-y-4">
                            <span className="px-3 py-1 rounded-full text-3xs font-bold uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                                {industriesData[selectedIndustry].badge}
                            </span>
                            <h3 className="text-2xl md:text-3xl font-bold text-ink">
                                {industriesData[selectedIndustry].name}
                            </h3>
                            <p className="text-base text-ink-secondary">
                                {industriesData[selectedIndustry].headline}
                            </p>

                            <div className="grid sm:grid-cols-2 gap-3 pt-6 text-left">
                                {industriesData[selectedIndustry].features.map((feat, idx) => (
                                    <div key={idx} className="p-3 bg-sunken rounded-xl border border-line dark:border-white/5 flex items-center gap-2.5 text-xs font-semibold text-ink">
                                        <Check className="w-4 h-4 text-brand-500 shrink-0" />
                                        <span>{feat}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-8">
                                <Link
                                    href={industriesData[selectedIndustry].href}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 transition-all shadow-lg"
                                >
                                    <span>Explore Full {industriesData[selectedIndustry].name} Solution</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </RevealOnScroll>
            </section>

            {/* ══════════════════════════════════════════════════════════════════════
                10. PRICING TEASER CARDS
                ══════════════════════════════════════════════════════════════════════ */}
            <section className="py-24 px-6 max-w-7xl mx-auto border-t border-line dark:border-white/5">
                <RevealOnScroll direction="up">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <SectionLabel icon={Banknote} text="TRANSPARENT PRICING" />
                        <h2 className="text-3xl md:text-5xl font-bold text-ink tracking-tight mb-4 mt-3">
                            Starts free. Scales with your volume.
                        </h2>
                        <p className="text-ink-secondary text-base md:text-lg mb-8">
                            Zero transaction fees. Zero hidden markups. 14-day free trial on paid plans.
                        </p>

                        {/* Annual / Monthly Toggle */}
                        <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-sunken border border-line dark:border-white/5">
                            <button
                                onClick={() => setIsAnnual(false)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!isAnnual ? 'bg-surface text-ink shadow' : 'text-ink-muted'}`}
                            >
                                Monthly Billing
                            </button>
                            <button
                                onClick={() => setIsAnnual(true)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isAnnual ? 'bg-brand-500 text-white shadow' : 'text-ink-muted'}`}
                            >
                                Annual Billing (Save 17%)
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {/* Solo Plan */}
                        <div className="p-6 rounded-2xl bg-surface border border-line dark:border-white/5 flex flex-col justify-between">
                            <div>
                                <h4 className="text-lg font-bold text-ink">Solo</h4>
                                <p className="text-xs text-ink-muted mb-4">Single cash counter &amp; small shop</p>
                                <div className="text-3xl font-bold text-ink font-numeric mb-6">$0 <span className="text-xs text-ink-muted">/ forever</span></div>
                                <ul className="space-y-2 text-xs text-ink-secondary mb-6">
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> 1 POS Register</li>
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> 500 SKUs</li>
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> Offline Checkout</li>
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> Full Double-Entry Ledger</li>
                                </ul>
                            </div>
                            <Link href="/register" className="w-full py-2.5 rounded-xl border border-line text-center text-xs font-bold text-ink hover:bg-sunken">
                                Start Free
                            </Link>
                        </div>

                        {/* Starter Plan */}
                        <div className="p-6 rounded-2xl bg-surface border border-line dark:border-white/5 flex flex-col justify-between">
                            <div>
                                <h4 className="text-lg font-bold text-ink">Starter</h4>
                                <p className="text-xs text-ink-muted mb-4">Growing shop with inventory tracking</p>
                                <div className="text-3xl font-bold text-ink font-numeric mb-6">
                                    {isAnnual ? '$15' : '$18'} <span className="text-xs text-ink-muted">/ month</span>
                                </div>
                                <ul className="space-y-2 text-xs text-ink-secondary mb-6">
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> 2 POS Registers</li>
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> 5,000 SKUs</li>
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> FIFO Batch &amp; Expiry</li>
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> Google Drive Backups</li>
                                </ul>
                            </div>
                            <Link href="/pricing" className="w-full py-2.5 rounded-xl border border-line text-center text-xs font-bold text-ink hover:bg-sunken">
                                View Details
                            </Link>
                        </div>

                        {/* Growth Plan */}
                        <div className="p-6 rounded-2xl bg-brand-500/10 border-2 border-brand-500/40 flex flex-col justify-between relative shadow-xl">
                            <div className="absolute top-3 right-3 bg-brand-500 text-white text-3xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                                POPULAR
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-ink">Growth</h4>
                                <p className="text-xs text-ink-muted mb-4">Multi-store &amp; wholesale operations</p>
                                <div className="text-3xl font-bold text-brand-600 dark:text-brand-400 font-numeric mb-6">
                                    {isAnnual ? '$41' : '$49'} <span className="text-xs text-ink-muted">/ month</span>
                                </div>
                                <ul className="space-y-2 text-xs text-ink-secondary mb-6">
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> 6 POS Registers</li>
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> 25,000 SKUs</li>
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> Inter-Branch Transfers</li>
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> WhatsApp Reminders &amp; Khata</li>
                                </ul>
                            </div>
                            <Link href="/pricing" className="w-full py-2.5 rounded-xl bg-brand-500 text-center text-xs font-bold text-white hover:bg-brand-600 shadow-md">
                                Start 14-Day Trial
                            </Link>
                        </div>

                        {/* Scale Plan */}
                        <div className="p-6 rounded-2xl bg-surface border border-line dark:border-white/5 flex flex-col justify-between">
                            <div>
                                <h4 className="text-lg font-bold text-ink">Scale</h4>
                                <p className="text-xs text-ink-muted mb-4">Large chains &amp; custom workflows</p>
                                <div className="text-3xl font-bold text-ink font-numeric mb-6">
                                    {isAnnual ? '$249' : '$299'} <span className="text-xs text-ink-muted">/ month</span>
                                </div>
                                <ul className="space-y-2 text-xs text-ink-secondary mb-6">
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> 20 POS Registers</li>
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> 250,000 SKUs</li>
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> VenSynQ Multi-Channel</li>
                                    <li className="flex items-center gap-2"><Check size={14} className="text-brand-500" /> Dedicated 4-hr SLA Support</li>
                                </ul>
                            </div>
                            <Link href="/pricing" className="w-full py-2.5 rounded-xl border border-line text-center text-xs font-bold text-ink hover:bg-sunken">
                                View Enterprise
                            </Link>
                        </div>
                    </div>
                </RevealOnScroll>
            </section>

            {/* ══════════════════════════════════════════════════════════════════════
                11. FAQ ACCORDION
                ══════════════════════════════════════════════════════════════════════ */}
            <section className="py-24 px-6 max-w-4xl mx-auto border-t border-line dark:border-white/5">
                <RevealOnScroll direction="up">
                    <div className="text-center mb-16">
                        <SectionLabel icon={Sparkles} text="FREQUENT QUESTIONS" />
                        <h2 className="text-3xl md:text-5xl font-bold text-ink tracking-tight mb-4 mt-3">
                            Questions &amp; Honest Answers.
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="p-6 rounded-2xl bg-surface border border-line dark:border-white/5 transition-all"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full flex items-center justify-between text-left font-bold text-base text-ink"
                                >
                                    <span>{faq.q}</span>
                                    <ChevronDown size={18} className={`transform transition-transform ${openFaq === idx ? 'rotate-180 text-brand-500' : 'text-ink-muted'}`} />
                                </button>
                                {openFaq === idx && (
                                    <p className="mt-4 text-sm text-ink-secondary leading-relaxed border-t border-line dark:border-white/5 pt-4">
                                        {faq.a}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </RevealOnScroll>
            </section>

            {/* ══════════════════════════════════════════════════════════════════════
                12. FINAL CALL TO ACTION BANNER
                ══════════════════════════════════════════════════════════════════════ */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <div className="p-12 md:p-16 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 text-white text-center shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                        <h2 className="text-3xl md:text-5xl font-bold font-display leading-tight">
                            Run your business. Not five subscriptions and a notebook.
                        </h2>
                        <p className="text-brand-100 text-base md:text-lg">
                            Start a 14-day trial or explore the running demo store immediately with zero signup.
                        </p>
                        <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
                            <Link
                                href="/demo"
                                className="px-8 py-4 rounded-xl bg-white text-brand-700 font-bold text-sm hover:bg-brand-50 transition-all shadow-lg"
                            >
                                Explore Live Demo
                            </Link>
                            <Link
                                href="/build-workspace"
                                className="px-8 py-4 rounded-xl bg-brand-800/80 text-white font-bold text-sm hover:bg-brand-900 transition-all border border-white/20"
                            >
                                Build Your System Now
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}

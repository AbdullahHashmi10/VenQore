import React, { useState, useRef, useEffect, useCallback } from 'react';
import MarketingLayout, {
    RevealOnScroll, AnimatedCounter, MagneticButton, SectionLabel, GlassCard, useScrollReveal
} from './Shared/MarketingLayout';
import {
    ShieldCheck, Boxes, Zap, Cpu, BarChart3, RefreshCw,
    ArrowRight, ScanBarcode, Globe, Calculator, Lock,
    Fingerprint, Layers, Database, GitBranch, Activity,
    Gauge, PieChart, Users, Warehouse, Receipt, CreditCard,
    TrendingUp, Bell, Shield, FileText, CheckCircle2,
    ChevronRight, Sparkles, Eye, Target, Workflow
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   FEATURES PAGE — "The Architecture of Control"
   Visual Concept: A technical blueprint that unfolds layer by layer.
   Each scroll reveals a deeper system. Feels like peeling back
   the engineering of a precision instrument.
   ═══════════════════════════════════════════════════════════════════════ */

const FeatureModule = ({ icon: Icon, title, description, features, color, index }) => {
    const [expanded, setExpanded] = useState(false);
    const colorMap = {
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', glow: 'shadow-indigo-500/10' },
        cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'shadow-cyan-500/10' },
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' },
        pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20', glow: 'shadow-pink-500/10' },
        violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', glow: 'shadow-violet-500/10' },
        rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', glow: 'shadow-rose-500/10' },
        sky: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', glow: 'shadow-sky-500/10' },
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', glow: 'shadow-blue-500/10' },
    };
    const c = colorMap[color] || colorMap.indigo;

    return (
        <RevealOnScroll delay={index * 0.08}>
            <div
                className={`relative rounded-[2rem] border ${c.border} bg-white/[0.02] overflow-hidden transition-all duration-700 cursor-pointer group
                    ${expanded ? `shadow-2xl ${c.glow} bg-white/[0.04]` : 'hover:bg-white/[0.04] hover:shadow-xl'}`}
                onClick={() => setExpanded(!expanded)}
            >
                {/* Header */}
                <div className="p-8 flex items-start gap-6">
                    <div className={`w-14 h-14 rounded-2xl ${c.bg} ${c.text} flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                        <Icon size={26} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-black text-white tracking-tight font-display">{title}</h3>
                            <ChevronRight size={18} className={`text-slate-600 transition-transform duration-500 flex-shrink-0 ${expanded ? 'rotate-90' : ''}`} />
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
                    </div>
                </div>

                {/* Expanded Features */}
                <div className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-8 pb-8 pt-2 border-t border-white/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                            {features.map((f, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                                    <CheckCircle2 size={16} className={`${c.text} mt-0.5 flex-shrink-0`} />
                                    <span className="text-sm text-slate-400 leading-relaxed">{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </RevealOnScroll>
    );
};

/* ── Architecture Diagram Node ──────────────────────────────────────── */
const ArchNode = ({ label, sublabel, icon: Icon, active, onClick, color = 'indigo' }) => (
    <button
        onClick={onClick}
        className={`relative p-5 rounded-2xl border transition-all duration-500 text-left group w-full
            ${active
                ? `bg-${color}-500/10 border-${color}-500/30 shadow-lg shadow-${color}-500/10`
                : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10'
            }`}
    >
        <Icon size={22} className={`mb-3 transition-colors duration-300 ${active ? `text-${color}-400` : 'text-slate-600 group-hover:text-slate-400'}`} />
        <div className={`text-sm font-bold tracking-tight transition-colors ${active ? 'text-white' : 'text-slate-400'}`}>{label}</div>
        {sublabel && <div className="text-[10px] text-slate-600 mt-1 uppercase tracking-widest font-bold">{sublabel}</div>}
        {active && <div className={`absolute -top-px left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent`} />}
    </button>
);

export default function Features() {
    const [activeArch, setActiveArch] = useState(0);

    const architectureLayers = [
        {
            title: 'Transaction Layer',
            description: 'Every sale, purchase, return, and transfer passes through the Transaction Engine. It validates data integrity, enforces business rules, and generates the financial primitives that feed every downstream system.',
            nodes: ['POS Terminal', 'Purchase Engine', 'Returns Processor', 'Transfer Manager'],
        },
        {
            title: 'Financial Core',
            description: 'The Double-Entry Wall ensures that every transaction creates a mathematically balanced journal entry. The FIFO Engine calculates true cost-of-goods-sold per item, per batch — not averages, not estimates.',
            nodes: ['Double-Entry Wall', 'FIFO Cost Engine', 'Tax Isolation', 'Immutable Ledger'],
        },
        {
            title: 'Intelligence Layer',
            description: 'Three AI models run continuously: Customer Return Predictor, Stock Depletion Forecaster, and Churn Risk Detector. They generate actionable signals, not dashboards you\'ll never read — plus a floating AI assistant that answers ledger and report questions in plain English.',
            nodes: ['Return Predictor', 'Stock Forecast', 'Churn Detector', 'AI Assistant'],
        },
        {
            title: 'Reporting Engine',
            description: '40+ verified reports generated from a single source of truth. P&L, Balance Sheet, Aged Receivables, Trial Balance — every number traces back to an immutable journal entry.',
            nodes: ['P&L Statement', 'Balance Sheet', 'Cash Flow', 'Custom Reports'],
        },
    ];

    const modules = [
        {
            icon: ShieldCheck, title: 'Financial Accuracy Engine', color: 'indigo',
            description: 'Auditor-grade double-entry bookkeeping that runs automatically with every transaction — and a 665+ test suite that proves it.',
            features: [
                'Automatic journal entries on every sale, purchase, and return',
                'FIFO batch-level cost tracking — real COGS, not averages',
                'Tax separated at the database level — never inflates revenue',
                'Immutable ledger with reversal-only corrections, no silent edits',
                'Verified by 665+ tests and 4,000+ live assertions across 13 reconciliation gates',
                'DECIMAL(20,4) precision on every currency column — no rounding drift',
            ]
        },
        {
            icon: Zap, title: 'Professional POS Terminal', color: 'amber',
            description: 'Built for speed operators — keyboard-first checkout, 10 simultaneous tabs, crash-proof architecture.',
            features: [
                'High-speed keyboard-first checkout (F1–F4 hotkeys) for zero-mouse operation',
                '10 simultaneous cart tabs, plus Park & Recall to hold a bill and serve someone else',
                'Crash Airbag — cart state survives browser crashes and power loss',
                'Barcode, serial & IMEI scanning with a typo-tolerant fuzzy product finder',
                'Multi-account split payments — Cash, Card, Bank Transfer, and Khata Credit combined',
                'Senior Mode accessibility toggle — 40% larger fonts, high-contrast colors',
            ]
        },
        {
            icon: Boxes, title: 'Inventory, Warehouses & Manufacturing', color: 'cyan',
            description: 'Multi-warehouse, batch-tracked, expiry-aware inventory — with built-in auto-assembly manufacturing.',
            features: [
                'Multi-warehouse "Godown" transfers with full audit trails and waybills',
                'Product variants (size, color, weight) with FIFO cost pools per batch',
                'Auto-Assembly Cookbook — composite items built from BOM recipes in real time',
                'Batch and expiry tracking with proactive expiry alerts',
                'Stock Take Audit Wizard reconciles system counts against physical stock',
                'Disaster Claim Manager logs theft, fire, or water damage write-offs against insurance',
            ]
        },
        {
            icon: Receipt, title: 'Customer Khata & B2B Invoicing', color: 'rose',
            description: 'Every customer gets a credit ledger, a wholesale price list, and an invoice that pays itself off automatically.',
            features: [
                'Customer credit registry (Khata) with running balances and credit limits',
                'Multi-payment invoices with automatic oldest-bill-first payment allocation',
                'Wholesale vs retail pricing tiers assigned per customer',
                'B2B Proposal Builder — quotations convert to tax invoices in one click',
                'Loyalty points and digital wallet credit issued on returns',
                'Automated recurring invoicing on custom daily, weekly, or monthly schedules',
            ]
        },
        {
            icon: Workflow, title: 'Procurement & Supplier Management', color: 'sky',
            description: 'Buy on credit, track every vendor balance, and never miss a reorder point again.',
            features: [
                'Supplier credit registry (Khata) tracking what you owe and payment terms',
                'Purchase Order tracker — Draft → Ordered → Partially Received → Received',
                'Partial shipment intake without closing out the original PO',
                'Cost Price Fluctuator alerts when a supplier raises unit prices',
                'Auto-generating purchase orders when stock drops below reorder thresholds',
                'Landing cost allocation — freight and customs distributed across batch cost',
            ]
        },
        {
            icon: Globe, title: 'E-Commerce & Multi-Channel Sync', color: 'blue',
            description: 'Sync stock and orders across WooCommerce and a growing list of marketplaces — without double-selling.',
            features: [
                'Real-time WooCommerce webhook sync — orders deduct inventory instantly',
                'VenSynQ command center expanding to Amazon, TikTok Shop, and eBay',
                '3-click OAuth connection for new marketplace accounts',
                'Automated commission isolation — clean net margins calculated per channel',
                'Dropshipping Order Automator with Just-in-Time supplier PO drafts',
                'Bulk tracking sync pushes carrier details back to every connected store',
            ]
        },
        {
            icon: Cpu, title: 'AI Growth Engine', color: 'emerald',
            description: 'Three AI models and a plain-English assistant that work the floor while you sleep.',
            features: [
                'Customer Return Predictor — know which idle customers are coming back',
                'Stock Depletion Forecaster — know what you\'re about to run out of',
                'Churn Risk Detector flags customers slipping away before they leave',
                'Floating AI Assistant answers ledger and report questions in plain English',
                'WhatsApp-ready re-engagement message drafts',
                'Powered by a real-time websocket sync engine for instant signals',
            ]
        },
        {
            icon: BarChart3, title: '40+ Master Reports', color: 'pink',
            description: 'Every report generated from the same verified ledger. Not approximations — verified financial statements.',
            features: [
                'Profit & Loss, Balance Sheet, Cash Flow, and Trial Balance',
                'Aged Receivables & Payables with 30/60/90/120-day buckets',
                'Item-wise, Party-wise, and Category-wise profitability',
                'Day Book, Account Ledger, and full Transaction History',
                'Tax Compliance Summary with separated GST/VAT input and output credits',
                'Stock Valuation, Stock Aging, and Movement History',
            ]
        },
        {
            icon: RefreshCw, title: 'Staff, Roles & SuperAdmin HQ', color: 'violet',
            description: 'Role-based access, attendance tracking, and the SuperAdmin command center that runs the whole platform.',
            features: [
                'Role-gated dashboards — staff only see the tools their role permits',
                'Alphanumeric staff invitation codes — no shared admin passwords',
                'Attendance tracking with shift gap detection and security audit logs',
                'Instant 4-digit cashier PIN login between shifts',
                'SuperAdmin Command Center — an 8-tab war room for SaaS-wide monitoring',
                'Subscription plan gates with Redis-cached usage limits per tier',
            ]
        },
    ];

    return (
        <MarketingLayout
            title="Features — VenQore"
            description="Every feature in VenQore is traceable to a real financial problem. Explore the architecture of operational truth."
        >
            {/* ── 1. HERO — "The System" ──────────────────────── */}
            <section className="relative pt-40 pb-24 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <RevealOnScroll>
                        <SectionLabel icon={Layers}>System Architecture</SectionLabel>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.1}>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 font-display">
                            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Every Feature.</span>
                            <br />
                            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent vq-text-glow">One Truth.</span>
                        </h1>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.2}>
                        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
                            VenQore isn't a collection of features bolted together. It's a single system where every capability traces back to one principle: <span className="text-white">financial accuracy at the transaction level.</span>
                        </p>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── 2. ARCHITECTURE VISUALIZER ─────────────────── */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <RevealOnScroll>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[3rem] overflow-hidden">
                            {/* Layer Tabs */}
                            <div className="grid grid-cols-2 md:grid-cols-4 border-b border-white/5">
                                {architectureLayers.map((layer, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveArch(i)}
                                        className={`p-6 text-left transition-all duration-500 border-b-2 ${
                                            activeArch === i
                                                ? 'border-indigo-500 bg-indigo-500/5'
                                                : 'border-transparent hover:bg-white/[0.02]'
                                        }`}
                                    >
                                        <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${activeArch === i ? 'text-indigo-400' : 'text-slate-600'}`}>
                                            Layer {i + 1}
                                        </div>
                                        <div className={`text-sm font-bold tracking-tight ${activeArch === i ? 'text-white' : 'text-slate-500'}`}>
                                            {layer.title}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Active Layer Content */}
                            <div className="p-8 md:p-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                    <div>
                                        <h3 className="text-3xl font-black text-white mb-6 tracking-tight font-display">
                                            {architectureLayers[activeArch].title}
                                        </h3>
                                        <p className="text-slate-400 leading-relaxed text-lg mb-8">
                                            {architectureLayers[activeArch].description}
                                        </p>
                                        <MagneticButton href="/register" variant="accent">
                                            Explore in Demo <ArrowRight size={16} />
                                        </MagneticButton>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {architectureLayers[activeArch].nodes.map((node, i) => (
                                            <div
                                                key={node}
                                                className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-indigo-500/20 hover:bg-indigo-500/5 transition-all duration-500"
                                                style={{ transitionDelay: `${i * 50}ms` }}
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-3">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                </div>
                                                <div className="text-sm font-bold text-white tracking-tight">{node}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── 3. STATS STRIP ─────────────────────────────── */}
            <section className="py-16 px-6 border-y border-white/5">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { val: 40, suffix: '+', label: 'Verified Reports' },
                        { val: 665, suffix: '+', label: 'Passing Tests' },
                        { val: 10, suffix: '', label: 'Simultaneous Tabs' },
                        { val: 0, suffix: '.00', label: 'Balance Error', prefix: '' },
                    ].map((s, i) => (
                        <RevealOnScroll key={i} delay={i * 0.1}>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter font-display">
                                    {s.prefix}<AnimatedCounter end={s.val} />{s.suffix}
                                </div>
                                <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.25em]">{s.label}</div>
                            </div>
                        </RevealOnScroll>
                    ))}
                </div>
            </section>

            {/* ── 4. FEATURE MODULES — Expandable deep-dive ──── */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-20">
                            <SectionLabel icon={Target}>Deep Dive</SectionLabel>
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] font-display">
                                Nine Engines.<br />
                                <span className="text-indigo-400">Zero Compromises.</span>
                            </h2>
                        </div>
                    </RevealOnScroll>

                    <div className="space-y-4">
                        {modules.map((mod, i) => (
                            <FeatureModule key={i} index={i} {...mod} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 5. COMPARISON STRIP ────────────────────────── */}
            <section className="py-32 px-6 vq-dot-pattern">
                <div className="max-w-5xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter font-display mb-4">
                                Not an Upgrade.<br /><span className="text-indigo-400">A Replacement.</span>
                            </h2>
                            <p className="text-slate-500 max-w-xl mx-auto">What you lose when your software doesn't understand accounting.</p>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={0.1}>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2.5rem] overflow-hidden">
                            {/* Header */}
                            <div className="grid grid-cols-3 p-6 border-b border-white/5 text-[10px] font-black uppercase tracking-[0.25em]">
                                <div className="text-slate-600">Capability</div>
                                <div className="text-red-400/60 text-center">Typical POS</div>
                                <div className="text-indigo-400 text-center">VenQore</div>
                            </div>
                            {/* Rows */}
                            {[
                                ['Revenue Calculation', 'Includes tax as revenue', 'Tax isolated at DB level'],
                                ['Cost Tracking', 'Weighted average (overwrites)', 'FIFO per batch, immutable'],
                                ['Journal Entries', 'Manual or none', 'Auto on every transaction'],
                                ['Crash Recovery', 'Data loss likely', 'Cart survives power failure'],
                                ['Report Accuracy', 'Best guess', 'Single verified ledger'],
                                ['Inventory Valuation', 'Last purchase price', 'True FIFO batch cost'],
                                ['E-Commerce Sync', 'Manual CSV exports, stale counts', 'Real-time WooCommerce & marketplace sync'],
                                ['Multi-Store Management', 'Disconnected spreadsheets per branch', 'One SaaS dashboard, role-based access'],
                            ].map(([cap, old, venqore], i, arr) => (
                                <div key={i} className={`grid grid-cols-3 p-6 items-center ${i < arr.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/[0.02] transition-colors`}>
                                    <div className="text-sm font-bold text-white">{cap}</div>
                                    <div className="text-sm text-slate-600 text-center italic">{old}</div>
                                    <div className="text-sm text-indigo-300 font-semibold text-center">{venqore}</div>
                                </div>
                            ))}
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── 6. CTA ─────────────────────────────────────── */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-4xl mx-auto relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                    <RevealOnScroll>
                        <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-tight relative z-10 font-display">
                            See It <span className="text-indigo-400">Working.</span>
                        </h2>
                        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed relative z-10">
                            14-day free trial. Full access. No credit card. Set up in 15 minutes.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                            <MagneticButton href="/register" variant="primary">
                                Start Free Trial <ArrowRight size={16} />
                            </MagneticButton>
                            <MagneticButton href="/demo" variant="ghost">
                                Live Demo
                            </MagneticButton>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>
        </MarketingLayout>
    );
}

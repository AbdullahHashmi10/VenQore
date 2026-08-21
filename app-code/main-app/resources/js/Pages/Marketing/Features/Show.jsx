import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import MarketingLayout, {
    RevealOnScroll,
    MagneticButton,
    SectionLabel,
    GlassCard,
    RelatedPages,
} from '../Shared/MarketingLayout';
import { featurePagesData } from '../../../Data/featurePages';
import {
    DemoStyles, ProfitLossDemo, PosInvoiceDemo,
    GrowthEngineDemo, CookbookDemo,
} from '../Shared/FeatureDemos';
import {
    ArrowRight, CheckCircle2, X, ChevronDown, ChevronUp,
    ShoppingCart, BookOpen, Package, WifiOff, ScanBarcode,
    Layers, CreditCard, Printer, Lock, Database, Repeat,
    Smartphone, Palette, Warehouse, GitMerge, BarChart3,
    Landmark, List, Calendar, RefreshCw, Scale, FileText,
    ShieldCheck, Zap, Gift, TrendingDown, ArrowLeftRight,
    Pause, TrendingUp,
} from 'lucide-react';

const iconMap = {
    ShoppingCart, BookOpen, Package, WifiOff, ScanBarcode, Layers,
    CreditCard, Printer, Lock, Database, Repeat, Smartphone, Palette,
    Warehouse, GitMerge, BarChart3, Landmark, List, Calendar, RefreshCw,
    Scale, FileText, ShieldCheck, Zap, Gift, TrendingDown, ArrowLeftRight,
    Pause, TrendingUp,
};

const statusColors = {
    shipped: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    building: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    planned: 'bg-neutral-100 text-ink-secondary dark:bg-surface dark:text-ink-muted',
};

const statusLabel = {
    shipped: '✓ Shipped',
    building: '⚙ Rolling Out',
    planned: '◦ Planned',
};

/**
 * Cross-domain internal links per feature. The existing `crossLinks` pills
 * keep the reader inside /features; this map deliberately pushes sideways
 * into Solutions, Compare and Tools so every feature page also feeds the
 * industry and comparison clusters.
 */
const RELATED_BY_FEATURE = {
    'point-of-sale': [
        { eyebrow: 'Solution', label: 'POS for Grocery', href: '/solutions/grocery', desc: 'Weighed items, fast lanes, tight margins.' },
        { eyebrow: 'Compare', label: 'VenQore vs Square', href: '/compare/venqore-vs-square', desc: 'Zero transaction fees vs 2.6% + 10¢.' },
        { eyebrow: 'Feature', label: 'Offline POS', href: '/features/offline-pos', desc: 'Keep ringing up sales with no internet.' },
        { eyebrow: 'Free tool', label: 'Receipt Generator', href: '/tools/receipt-generator', desc: 'Make a receipt now, no account needed.' },
    ],
    'inventory-management': [
        { eyebrow: 'Solution', label: 'Pharmacy', href: '/solutions/pharmacy', desc: 'Batch and expiry tracking done properly.' },
        { eyebrow: 'Solution', label: 'Wholesale', href: '/solutions/wholesale', desc: 'Bulk units, price tiers, real costing.' },
        { eyebrow: 'Free tool', label: 'Stock Count Sheet', href: '/tools/stock-count-sheet', desc: 'Print a count sheet for your next stocktake.' },
        { eyebrow: 'Free tool', label: 'Margin Calculator', href: '/tools/margin-calculator', desc: 'Check what a price actually earns you.' },
    ],
    accounting: [
        { eyebrow: 'Compare', label: 'VenQore vs Vyapar', href: '/compare/venqore-vs-vyapar', desc: 'Double-entry ledger vs single-entry billing.' },
        { eyebrow: 'Feature', label: 'FIFO Inventory', href: '/features/inventory-management', desc: 'Where your cost of goods actually comes from.' },
        { eyebrow: 'Free tool', label: 'Invoice Generator', href: '/tools/invoice-generator', desc: 'A clean, correct invoice in a minute.' },
        { eyebrow: 'Free tool', label: 'Credit Note Generator', href: '/tools/credit-note-generator', desc: 'Issue a returns credit the right way.' },
    ],
    'offline-pos': [
        { eyebrow: 'Feature', label: 'Point of Sale', href: '/features/point-of-sale', desc: 'The terminal offline mode is built into.' },
        { eyebrow: 'Solution', label: 'Multi-store', href: '/solutions/multi-store', desc: 'Branches that sync when the line comes back.' },
        { eyebrow: 'Compare', label: 'VenQore vs Square', href: '/compare/venqore-vs-square', desc: 'What happens when the internet drops.' },
        { eyebrow: 'Coming soon', label: 'VenSynQ', href: '/vensynq', desc: 'One stock pool across every channel.' },
    ],
    'growth-engine': [
        { eyebrow: 'Solution', label: 'Clothing', href: '/solutions/clothing', desc: 'Seasons, sizes and repeat customers.' },
        { eyebrow: 'Solution', label: 'Electronics', href: '/solutions/electronics-store', desc: 'Serial tracking and warranty follow-up.' },
        { eyebrow: 'Feature', label: 'Real Accounting', href: '/features/accounting', desc: 'See what your campaigns actually earned.' },
        { eyebrow: 'Free tool', label: 'QR Menu Generator', href: '/tools/qr-menu-generator', desc: 'Put a scannable menu on every table.' },
    ],
};

/**
 * The live demo that belongs on each deep-dive page.
 *
 * The /features hub shows all six demos; a visitor arriving on a deep-dive
 * straight from search previously saw none of them — the page where proof
 * matters most had the least proof. Each slug now gets the one demo that
 * actually demonstrates its claim.
 *
 * `offline-pos` intentionally reuses the POS terminal: offline mode IS the
 * POS, and a second cart demo would say the same thing twice.
 */
const DEMO_BY_FEATURE = {
    'point-of-sale': {
        Component: PosInvoiceDemo,
        eyebrow: 'Try it now',
        title: <>Ring up a sale <span className="text-brand-600 dark:text-brand-400">right here.</span></>,
        lead: 'This is the real checkout. Add products, change quantities, pick a payment method and complete the sale. Nothing is saved — it is yours to play with.',
    },
    'offline-pos': {
        Component: PosInvoiceDemo,
        eyebrow: 'Try it now',
        title: <>The same terminal, <span className="text-brand-600 dark:text-brand-400">with or without a line.</span></>,
        lead: 'Offline mode is not a stripped-down fallback screen — it is this exact terminal, running from local storage and syncing the moment you are back online.',
    },
    accounting: {
        Component: ProfitLossDemo,
        eyebrow: 'Try it now',
        title: <>A Profit &amp; Loss that <span className="text-emerald-600 dark:text-emerald-400">reconciles.</span></>,
        lead: 'Switch periods and watch every figure recompute from the same verified ledger. This is the real report, drawn from real double-entry journals.',
    },
    'inventory-management': {
        Component: CookbookDemo,
        eyebrow: 'Try it now',
        title: <>Watch FIFO costing <span className="text-amber-600 dark:text-amber-400">actually happen.</span></>,
        lead: 'Define a Bill of Materials, produce a batch, and see raw stock deduct at its real per-batch cost — not an average that quietly overwrote itself.',
    },
    'growth-engine': {
        Component: GrowthEngineDemo,
        eyebrow: 'Try it now',
        title: <>Every insight <span className="text-violet-400">shows its working.</span></>,
        lead: 'Four brains read your customers, stock, margin and cash. Each one exposes the numbers behind its call, and each prediction is scored afterwards against what actually happened.',
    },
};

export default function FeatureShow({ slug }) {
    const data = featurePagesData[slug] || featurePagesData['point-of-sale'];
    const related = RELATED_BY_FEATURE[slug] || RELATED_BY_FEATURE['point-of-sale'];
    const demo = DEMO_BY_FEATURE[slug];
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

    return (
        <MarketingLayout>
            <Head>
                <title>{data.metaTitle}</title>
                <meta name="description" content={data.metaDescription} />
            </Head>

            {/* ── HERO ───────────────────────────────────────────────── */}
            <section className="relative pt-32 pb-16 px-6 max-w-7xl mx-auto text-center">
                <RevealOnScroll direction="up">
                    <SectionLabel icon={ShieldCheck} text={data.heroBadge} />

                    <div className="inline-flex items-center gap-2 mt-4 mb-3">
                        <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${statusColors[data.status]}`}>
                            {statusLabel[data.status]}
                        </span>
                        <span className="text-xs text-ink-muted font-medium">{data.category}</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold text-ink tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
                        {data.headline}
                    </h1>
                    <p className="text-lg md:text-xl text-ink-secondary max-w-3xl mx-auto mb-10 leading-relaxed">
                        {data.subhead}
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 mb-14">
                        <MagneticButton href="/demo" variant="primary">
                            Try Live Demo — No Signup <ArrowRight className="w-4 h-4 ml-2 inline" />
                        </MagneticButton>
                        <MagneticButton href="/pricing" variant="secondary">
                            See Pricing — From $36/month
                        </MagneticButton>
                    </div>

                    {/* Stats strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto p-6 rounded-2xl bg-app border border-line">
                        {data.stats.map((stat, i) => (
                            <div key={i} className="text-center p-3">
                                <div className="text-2xl md:text-3xl font-bold text-brand-600 dark:text-brand-400">
                                    {stat.value}
                                </div>
                                <div className="text-2xs font-bold uppercase tracking-wider text-ink-muted mt-1">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </RevealOnScroll>
            </section>

            {/* ── ANSWER BLOCK (GEO-optimised extractable answer) ───── */}
            <section className="py-12 px-6 max-w-4xl mx-auto">
                <RevealOnScroll direction="up">
                    <div className="rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 p-8 md:p-10">
                        <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3">Quick Answer</p>
                        <h2 className="text-xl md:text-2xl font-bold text-ink mb-4">
                            {data.answerBlock.question}
                        </h2>
                        <p className="text-ink-secondary leading-relaxed text-base md:text-lg">
                            {data.answerBlock.answer}
                        </p>
                    </div>
                </RevealOnScroll>
            </section>

            {/* ── LIVE DEMO ──────────────────────────────────────────────
                Placed immediately after the answer block: the reader has just
                been told what this does, so this is the moment to show it
                rather than make them scroll past three sections of claims. */}
            {demo && (
                <section className="py-16 md:py-20 px-6">
                    <div className="max-w-6xl mx-auto">
                        <RevealOnScroll direction="up">
                            <div className="text-center mb-10 max-w-3xl mx-auto">
                                <SectionLabel icon={Zap}>{demo.eyebrow}</SectionLabel>
                                <h2 className="text-3xl md:text-5xl font-bold text-ink tracking-tight leading-tight mb-4 mt-4">
                                    {demo.title}
                                </h2>
                                <p className="text-ink-secondary text-base md:text-lg leading-relaxed">
                                    {demo.lead}
                                </p>
                            </div>
                        </RevealOnScroll>
                        <RevealOnScroll direction="up" delay={0.1}>
                            <demo.Component />
                        </RevealOnScroll>
                        <p className="text-center text-xs text-ink-muted mt-6">
                            Simulated with sample data — nothing you do here is saved.{''}
                            <Link href="/demo" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
                                Want the full store? Launch the live demo →
                            </Link>
                        </p>
                    </div>
                    <DemoStyles />
                </section>
            )}

            {/* ── PAIN POINTS ────────────────────────────────────────── */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <RevealOnScroll direction="up">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
                            Where Generic Software Falls Short
                        </h2>
                        <p className="text-ink-secondary">
                            The gaps that cost retailers money every day — and how VenQore closes them.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {data.painPoints.map((item, i) => (
                            <GlassCard key={i} className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                        <X className="w-5 h-5 text-rose-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-2">
                                            Without VenQore
                                        </p>
                                        <p className="text-ink-secondary text-sm mb-4">
                                            {item.pain}
                                        </p>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                                                {item.fix}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </RevealOnScroll>
            </section>

            {/* ── FEATURE DEEP-DIVE CARDS ────────────────────────────── */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <RevealOnScroll direction="up">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
                            What's Included
                        </h2>
                        <p className="text-ink-secondary">
                            Every capability below is shipped and live in VenQore today. No plugins, no add-ons.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.features.map((feat, i) => {
                            const Icon = iconMap[feat.icon] || CheckCircle2;
                            return (
                                <GlassCard key={i} className="p-6 flex flex-col gap-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                                        </div>
                                        {feat.tag && (
                                            <span className="text-2xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full whitespace-nowrap">
                                                {feat.tag}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-ink mb-2">
                                            {feat.title}
                                        </h3>
                                        <p className="text-ink-secondary text-sm leading-relaxed">
                                            {feat.description}
                                        </p>
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                </RevealOnScroll>
            </section>

            {/* ── COMPARISON TABLE ───────────────────────────────────── */}
            <section className="py-20 px-6 max-w-5xl mx-auto">
                <RevealOnScroll direction="up">
                    <div className="text-center mb-12 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
                            {data.comparisonTable.title}
                        </h2>
                    </div>

                    <div className="rounded-2xl overflow-hidden border border-line">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-app border-b border-line">
                                    <th className="py-4 px-6 text-left font-bold text-ink-secondary text-xs uppercase tracking-wider">
                                        Feature
                                    </th>
                                    <th className="py-4 px-6 text-left font-bold text-brand-600 dark:text-brand-400 text-xs uppercase tracking-wider">
                                        VenQore
                                    </th>
                                    <th className="py-4 px-6 text-left font-bold text-ink-muted text-xs uppercase tracking-wider">
                                        Typical Alternative
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line bg-surface">
                                {data.comparisonTable.rows.map((row, i) => (
                                    <tr key={i} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                        <td className="py-4 px-6 font-semibold text-ink-secondary">
                                            {row.feature}
                                        </td>
                                        <td className="py-4 px-6 text-emerald-700 dark:text-emerald-400 font-medium">
                                            <span className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                                {row.venqore}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-ink-muted">
                                            {row.competitor}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </RevealOnScroll>
            </section>

            {/* ── FAQ ────────────────────────────────────────────────── */}
            <section className="py-20 px-6 max-w-3xl mx-auto">
                <RevealOnScroll direction="up">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {data.faqs.map((faq, i) => (
                            <div
                                key={i}
                                className="rounded-2xl border border-line overflow-hidden"
                            >
                                <button
                                    id={`faq-${slug}-${i}`}
                                    onClick={() => toggleFaq(i)}
                                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-surface hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors"
                                    aria-expanded={openFaq === i}
                                >
                                    <span className="font-bold text-ink text-sm">
                                        {faq.q}
                                    </span>
                                    {openFaq === i
                                        ? <ChevronUp className="w-4 h-4 text-ink-muted flex-shrink-0" />
                                        : <ChevronDown className="w-4 h-4 text-ink-muted flex-shrink-0" />}
                                </button>
                                {openFaq === i && (
                                    <div className="px-6 pb-5 bg-surface text-sm text-ink-secondary leading-relaxed">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </RevealOnScroll>
            </section>

            {/* ── CROSS-LINKS ────────────────────────────────────────── */}
            <section className="py-16 px-6 max-w-5xl mx-auto">
                <RevealOnScroll direction="up">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-ink mb-2">
                            Explore Related Pages
                        </h2>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        {data.crossLinks.map((link, i) => (
                            <Link
                                key={i}
                                href={link.href}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sunken hover:bg-brand-50 dark:hover:bg-brand-900/30 text-ink-secondary hover:text-brand-600 dark:hover:text-brand-400 font-semibold text-sm transition-all duration-normal"
                            >
                                {link.label}
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        ))}
                        <Link
                            href="/features"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition-all duration-normal"
                        >
                            All Features <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </RevealOnScroll>
            </section>

            {/* ── FINAL CTA ──────────────────────────────────────────── */}
            <section className="py-24 px-6 max-w-4xl mx-auto text-center">
                <RevealOnScroll direction="up">
                    <h2 className="text-3xl md:text-5xl font-bold text-ink mb-6 tracking-tight">
                        Ready to see it for yourself?
                    </h2>
                    <p className="text-lg text-ink-secondary mb-10 max-w-2xl mx-auto">
                        Walk into a fully loaded VenQore store — ring up sales, open the P&L, check inventory.
                        No signup. Resets daily.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <MagneticButton href="/demo" variant="primary">
                            Try Live Demo — No Signup <ArrowRight className="w-4 h-4 ml-2 inline" />
                        </MagneticButton>
                        <MagneticButton href="/register" variant="secondary">
                            Start 14-Day Free Trial
                        </MagneticButton>
                    </div>
                    <p className="text-xs text-ink-muted mt-6">
                        Plans from $36/month · No credit card for trial · Cancel any time
                    </p>
                </RevealOnScroll>
            </section>

            <RelatedPages title="Related reading" items={related} />
        </MarketingLayout>
    );
}

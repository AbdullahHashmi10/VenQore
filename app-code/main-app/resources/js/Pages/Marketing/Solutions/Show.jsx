import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import MarketingLayout, { RevealOnScroll, MagneticButton, SectionLabel, GlassCard, RelatedPages } from '../Shared/MarketingLayout';
import { solutionsData } from '../../../Data/solutions';
import {
    ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Scale, Sparkles,
    Pill, Smartphone, Calendar, Clock, RotateCcw, Scan, Users, QrCode,
    FileText, Repeat, Truck, TrendingUp, ChevronDown, ChevronUp, Layers
} from 'lucide-react';

const iconMap = {
    Pill, Smartphone, Calendar, Clock, RotateCcw, Scan, Users,
    QrCode, FileText, Repeat, Truck, TrendingUp, Scale
};

/**
 * Each industry page hands the reader the two features that matter most for
 * that trade, a neighbouring industry, and a free tool they can use today —
 * so /solutions feeds /features, /tools and the other way round.
 */
const RELATED_BY_INDUSTRY = {
    pharmacy: [
        { eyebrow: 'Feature', label: 'Batch & Expiry Tracking', href: '/features/inventory-management', desc: 'Never sell an expired pack again.' },
        { eyebrow: 'Feature', label: 'Real Accounting', href: '/features/accounting', desc: 'Audit-ready books without a second system.' },
        { eyebrow: 'Solution', label: 'Grocery', href: '/solutions/grocery', desc: 'Same shelf-life problems, different aisle.' },
        { eyebrow: 'Free tool', label: 'Label Sheet Generator', href: '/tools/label-sheet-generator', desc: 'Print shelf labels on standard sheets.' },
    ],
    grocery: [
        { eyebrow: 'Feature', label: 'Point of Sale', href: '/features/point-of-sale', desc: 'Lane speed with weighed and loose items.' },
        { eyebrow: 'Feature', label: 'FIFO Inventory', href: '/features/inventory-management', desc: 'Real margins on fast-moving stock.' },
        { eyebrow: 'Free tool', label: 'Price Tag Generator', href: '/tools/price-tag-generator', desc: 'Clean shelf tags in a couple of clicks.' },
        { eyebrow: 'Free tool', label: 'Margin Calculator', href: '/tools/margin-calculator', desc: 'Check a price before you print it.' },
    ],
    'electronics-store': [
        { eyebrow: 'Feature', label: 'Serial Tracking', href: '/features/inventory-management', desc: 'Every unit traceable from purchase to warranty.' },
        { eyebrow: 'Feature', label: 'Point of Sale', href: '/features/point-of-sale', desc: 'High-value sales with proper controls.' },
        { eyebrow: 'Compare', label: 'VenQore vs Square', href: '/compare/venqore-vs-square', desc: 'What card fees cost on big-ticket items.' },
        { eyebrow: 'Free tool', label: 'Barcode Generator', href: '/tools/barcode-generator', desc: 'Create scannable codes for any product.' },
    ],
    clothing: [
        { eyebrow: 'Feature', label: 'Variants & Attributes', href: '/features/inventory-management', desc: 'Size and colour handled as one product.' },
        { eyebrow: 'Feature', label: 'Growth Engine', href: '/features/growth-engine', desc: 'Bring last season\'s buyers back.' },
        { eyebrow: 'Free tool', label: 'Price Tag Generator', href: '/tools/price-tag-generator', desc: 'Rail-ready tags with your branding.' },
        { eyebrow: 'Solution', label: 'Multi-store', href: '/solutions/multi-store', desc: 'Move stock between branches cleanly.' },
    ],
    wholesale: [
        { eyebrow: 'Feature', label: 'FIFO Inventory', href: '/features/inventory-management', desc: 'Bulk units, conversions and true cost.' },
        { eyebrow: 'Feature', label: 'Real Accounting', href: '/features/accounting', desc: 'Credit terms and receivables that reconcile.' },
        { eyebrow: 'Free tool', label: 'Purchase Order Generator', href: '/tools/purchase-order-generator', desc: 'Send a proper PO to your supplier.' },
        { eyebrow: 'Free tool', label: 'Quote Generator', href: '/tools/quote-generator', desc: 'Quote a bulk order in minutes.' },
    ],
    'multi-store': [
        { eyebrow: 'Feature', label: 'Offline POS', href: '/features/offline-pos', desc: 'Branches keep selling through outages.' },
        { eyebrow: 'Feature', label: 'Real Accounting', href: '/features/accounting', desc: 'One consolidated ledger across locations.' },
        { eyebrow: 'Coming soon', label: 'VenSynQ', href: '/vensynq', desc: 'Add online channels to the same stock pool.' },
        { eyebrow: 'Free tool', label: 'Stock Count Sheet', href: '/tools/stock-count-sheet', desc: 'Run a coordinated count in every branch.' },
    ],
};

export default function Show({ slug }) {
    const data = solutionsData[slug] || solutionsData['pharmacy'];
    const related = RELATED_BY_INDUSTRY[slug] || RELATED_BY_INDUSTRY['pharmacy'];
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <MarketingLayout>
            <Head>
                <title>{data.metaTitle}</title>
                <meta name="description" content={data.metaDescription} />
            </Head>

            {/* Hero Section */}
            <section className="relative pt-32 pb-16 px-6 max-w-7xl mx-auto text-center">
                <RevealOnScroll direction="up">
                    <SectionLabel icon={ShieldCheck} text={data.heroBadge} />
                    <h1 className="text-4xl md:text-6xl font-bold text-ink tracking-tight mb-6 mt-4 max-w-4xl mx-auto">
                        {data.headline}
                    </h1>
                    <p className="text-lg md:text-xl text-ink-secondary max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                        {data.subhead}
                    </p>

                    <div className="flex flex-wrap justify-center items-center gap-4 mb-14">
                        <MagneticButton href="/demo" variant="primary">
                            Try Live Demo — No Signup <ArrowRight className="w-4 h-4 ml-2" />
                        </MagneticButton>
                        <MagneticButton href="/register" variant="secondary">
                            Start Free 14-Day Trial
                        </MagneticButton>
                    </div>

                    {/* Stats Strip */}
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

            {/* Industry Pain Points Section */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <RevealOnScroll direction="up">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
                            The Silent Profit Leaks in {data.name} Operations
                        </h2>
                        <p className="text-ink-secondary text-base">
                            Generic POS systems hide operational losses behind manual spreadsheets. VenQore fixes the root cause directly at the till.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {data.painPoints.map((item, i) => (
                            <GlassCard key={i} className="p-8 rounded-2xl border border-line">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-bold text-ink">
                                        {item.title}
                                    </h3>
                                </div>
                                <div className="mb-6 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-sm text-ink-secondary">
                                    <strong className="text-rose-600 dark:text-rose-400">The Problem:</strong> {item.problem}
                                </div>
                                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-sm text-ink-secondary">
                                    <strong className="text-emerald-600 dark:text-emerald-400">VenQore Solution:</strong> {item.solution}
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </RevealOnScroll>
            </section>

            {/* Feature Deep-Dive Section */}
            <section className="py-20 px-6 bg-app border-y border-line">
                <div className="max-w-7xl mx-auto">
                    <RevealOnScroll direction="up">
                        <div className="text-center mb-16 max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
                                Purpose-Built Capabilities for {data.name} Retailers
                            </h2>
                            <p className="text-ink-secondary text-base">
                                Every feature is engineered to protect stock accuracy, eliminate repeated typing, and maintain auditor-grade books.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {data.features.map((feat, i) => {
                                const Icon = iconMap[feat.icon] || ShieldCheck;
                                return (
                                    <div key={i} className="p-8 rounded-2xl bg-surface border border-line shadow-sm">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center mb-6">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-ink mb-3">
                                            {feat.title}
                                        </h3>
                                        <p className="text-ink-secondary text-sm leading-relaxed">
                                            {feat.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* Double-Entry Accounting Impact Section */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <RevealOnScroll direction="up">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/20">
                                <Scale className="w-4 h-4" /> LEDGER TRUTH ENGINE
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
                                {data.accountingImpact.title}
                            </h2>
                            <p className="text-ink-secondary text-base leading-relaxed">
                                {data.accountingImpact.description}
                            </p>
                        </div>

                        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 md:p-8 text-white shadow-2xl overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-800 text-xs font-bold uppercase tracking-widest text-ink-muted">
                                        <th className="pb-4">Account Name &amp; Code</th>
                                        <th className="pb-4 text-emerald-600 dark:text-emerald-400">Debit ($)</th>
                                        <th className="pb-4 text-brand-600 dark:text-brand-400">Credit ($)</th>
                                        <th className="pb-4">Automated Impact Note</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/60 font-mono text-xs md:text-sm">
                                    {data.accountingImpact.entries.map((entry, i) => (
                                        <tr key={i} className="hover:bg-interactive-hover">
                                            <td className="py-3.5 font-sans font-semibold text-neutral-200">{entry.account}</td>
                                            <td className="py-3.5 text-emerald-600 dark:text-emerald-400 font-bold">{entry.debit}</td>
                                            <td className="py-3.5 text-brand-600 dark:text-brand-400 font-bold">{entry.credit}</td>
                                            <td className="py-3.5 font-sans text-ink-muted text-xs">{entry.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </RevealOnScroll>
            </section>

            {/* Cross-Linking Navigation */}
            <section className="py-16 px-6 bg-app border-t border-line">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">Compare Competitors</h4>
                        <div className="flex flex-wrap gap-3">
                            {data.compareCrossLinks.map((link, i) => (
                                <Link key={i} href={link.href} className="px-4 py-2 rounded-xl bg-surface border border-line text-sm font-semibold text-ink hover:border-brand-500 transition-colors">
                                    {link.name} →
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">Platform Capabilities</h4>
                        <div className="flex flex-wrap gap-3">
                            {data.featureCrossLinks.map((link, i) => (
                                <Link key={i} href={link.href} className="px-4 py-2 rounded-xl bg-surface border border-line text-sm font-semibold text-ink hover:border-brand-500 transition-colors">
                                    {link.name} →
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Accordion Section */}
            <section className="py-24 px-6 max-w-4xl mx-auto">
                <RevealOnScroll direction="up">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
                            Frequently Asked Questions — {data.name} POS
                        </h2>
                        <p className="text-ink-secondary text-base">
                            Everything you need to know about setting up VenQore for your {data.name.toLowerCase()} business.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {data.faqs.map((faq, i) => (
                            <div key={i} className="border border-line rounded-2xl overflow-hidden bg-surface">
                                <button
                                    onClick={() => toggleFaq(i)}
                                    className="w-full text-left p-6 font-bold text-ink flex items-center justify-between gap-4"
                                >
                                    <span>{faq.q}</span>
                                    {openFaq === i ? <ChevronUp className="w-5 h-5 text-brand-500 shrink-0" /> : <ChevronDown className="w-5 h-5 text-ink-muted shrink-0" />}
                                </button>
                                {openFaq === i && (
                                    <div className="px-6 pb-6 text-sm text-ink-secondary leading-relaxed border-t border-line pt-4">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </RevealOnScroll>
            </section>

            {/* Final CTA */}
            <section className="py-24 px-6 text-center max-w-4xl mx-auto border-t border-line">
                <h2 className="text-3xl md:text-5xl font-bold text-ink mb-6">
                    Ready to Upgrade Your {data.name} Operations?
                </h2>
                <p className="text-lg text-ink-secondary mb-8 max-w-2xl mx-auto">
                    Start your 14-day free trial today or test drive our interactive live demo with zero signup required.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <MagneticButton href="/register" variant="primary">
                        Start 14-Day Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                    </MagneticButton>
                    <MagneticButton href="/demo" variant="secondary">
                        Explore Live Demo
                    </MagneticButton>
                </div>
            </section>

            <RelatedPages title="Related reading" items={related} />
        </MarketingLayout>
    );
}

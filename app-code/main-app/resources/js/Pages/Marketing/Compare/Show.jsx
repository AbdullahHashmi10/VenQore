import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import MarketingLayout, { RevealOnScroll, MagneticButton, SectionLabel, RelatedPages } from '../Shared/MarketingLayout';

/**
 * Comparison pages are high-intent but narrow. These links push the reader
 * toward the feature proof and the industry page that closes the sale.
 */
const RELATED_BY_COMPETITOR = {
    square: [
        { eyebrow: 'Feature', label: 'Point of Sale', href: '/features/point-of-sale', desc: 'The terminal you would be switching to.' },
        { eyebrow: 'Feature', label: 'Real Accounting', href: '/features/accounting', desc: 'Built in, not bolted on via QuickBooks.' },
        { eyebrow: 'Compare', label: 'VenQore vs Vyapar', href: '/compare/venqore-vs-vyapar', desc: 'The other comparison people run.' },
        { eyebrow: 'Pricing', label: 'See what it costs', href: '/pricing', desc: 'Flat plans, no per-transaction cut.' },
    ],
    vyapar: [
        { eyebrow: 'Feature', label: 'Real Accounting', href: '/features/accounting', desc: 'Double-entry, not single-entry billing.' },
        { eyebrow: 'Feature', label: 'FIFO Inventory', href: '/features/inventory-management', desc: 'Costing that survives an audit.' },
        { eyebrow: 'Compare', label: 'VenQore vs Square', href: '/compare/venqore-vs-square', desc: 'The other comparison people run.' },
        { eyebrow: 'Solution', label: 'Wholesale', href: '/solutions/wholesale', desc: 'Where the ledger difference bites hardest.' },
    ],
};
import { competitors } from '@/Data/competitors';
import { ArrowRight, Check, X, ChevronDown, Scale, Calculator, ShieldCheck, HelpCircle } from 'lucide-react';

export default function CompareShow({ slug }) {
    const data = competitors[slug] || competitors['square'];
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
                    <SectionLabel icon={Scale} text={`VENQORE VS ${data.name.toUpperCase()}`} />
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6 mt-4 max-w-4xl mx-auto leading-tight">
                        {data.headline}
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                        {data.subtitle}
                    </p>
                </RevealOnScroll>
            </section>

            {/* Quick Summary Cards */}
            <section className="pb-16 px-6 max-w-5xl mx-auto">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* VenQore Card */}
                    <div className="bg-emerald-500/10 border-2 border-emerald-500/40 rounded-3xl p-8 relative overflow-hidden">
                        <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full">
                            RECOMMENDED
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">VenQore</h3>
                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold mb-6">The All-in-One Operating System</p>
                        <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                            <li className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span><strong>Price:</strong> {data.venqorePrice}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span><strong>Processing Fees:</strong> {data.venqoreTxFee}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span><strong>Accounting:</strong> {data.venqoreAccounting}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span><strong>Offline Access:</strong> {data.venqoreOffline}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Competitor Card */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{data.name}</h3>
                        <p className="text-slate-500 font-semibold mb-6">Legacy System</p>
                        <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                            <li className="flex items-center gap-2">
                                <X className="w-5 h-5 text-rose-500 shrink-0" />
                                <span><strong>Price:</strong> {data.competitorPrice}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <X className="w-5 h-5 text-rose-500 shrink-0" />
                                <span><strong>Processing Fees:</strong> {data.competitorTxFee}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <X className="w-5 h-5 text-rose-500 shrink-0" />
                                <span><strong>Accounting:</strong> {data.competitorAccounting}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <X className="w-5 h-5 text-rose-500 shrink-0" />
                                <span><strong>Offline Access:</strong> {data.competitorOffline}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Pricing Math Breakdown */}
            <section className="py-16 bg-slate-900 text-white px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
                        <Calculator className="w-4 h-4" /> Real Margin Math
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        The True Cost Comparison at {data.pricingMath.monthlySales} / Month
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8 my-8 text-left">
                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
                            <h4 className="text-lg font-bold text-slate-300 mb-2">{data.name} Total Cost</h4>
                            <p className="text-2xl font-black text-rose-400 mb-2">{data.pricingMath.squareFee || data.pricingMath.vyaparFee}</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Accumulates every month as processing fees scale with your revenue.
                            </p>
                        </div>
                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-emerald-500/50">
                            <h4 className="text-lg font-bold text-emerald-400 mb-2">VenQore Total Cost</h4>
                            <p className="text-2xl font-black text-emerald-300 mb-2">{data.pricingMath.venqoreFee}</p>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Fixed monthly subscription with no transaction markups. Keep 100% of your earnings.
                            </p>
                        </div>
                    </div>
                    <div className="inline-block bg-emerald-500 text-slate-950 font-black text-lg px-6 py-3 rounded-xl">
                        {data.pricingMath.annualSavings}
                    </div>
                </div>
            </section>

            {/* 15-Row Comparison Table */}
            <section className="py-20 px-6 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
                        Detailed Feature-by-Feature Matrix
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                        Compare VenQore side-by-side with {data.name} across core business operations.
                    </p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse min-w-[640px]">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                <th className="p-4 text-sm font-bold text-slate-900 dark:text-white w-2/5">Feature / Capability</th>
                                <th className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 w-3/10 bg-emerald-500/5">VenQore</th>
                                <th className="p-4 text-sm font-bold text-slate-500 w-3/10">{data.name}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                            {data.table.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">{row.feature}</td>
                                    <td className="p-4 font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/5">
                                        <div className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>{row.venqore}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-slate-400">
                                        <span>{row.competitor}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Honest Verdict Section */}
            <section className="py-16 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-10">
                        Honest Recommendation: Which Should You Choose?
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                                When to Choose {data.name}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {data.honestVerdict.chooseCompetitor}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-emerald-500/40">
                            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-3">
                                When to Choose VenQore
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {data.honestVerdict.chooseVenQore}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQs Accordion */}
            <section className="py-20 px-6 max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <SectionLabel icon={HelpCircle} text="FREQUENTLY ASKED QUESTIONS" />
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                        Questions About Switching from {data.name} to VenQore
                    </h2>
                </div>

                <div className="space-y-4">
                    {data.faqs.map((faq, idx) => (
                        <div
                            key={idx}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors"
                        >
                            <button
                                onClick={() => toggleFaq(idx)}
                                className="w-full p-6 text-left font-bold text-slate-900 dark:text-white flex items-center justify-between gap-4"
                            >
                                <span>{faq.q}</span>
                                <ChevronDown className={`w-5 h-5 transition-transform duration-200 text-slate-500 dark:text-slate-400 ${openFaq === idx ? 'rotate-180 text-emerald-500' : ''}`} />
                            </button>
                            {openFaq === idx && (
                                <div className="px-6 pb-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-4">
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-24 px-6 text-center max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                    Switch to VenQore Today
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
                    Start a 14-day free trial. Our team assists with zero-downtime data migration from {data.name}.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <MagneticButton href="/register" variant="primary">
                        Start 14-Day Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                    </MagneticButton>
                    <MagneticButton href="/demo" variant="secondary">
                        Try Live Interactive Demo
                    </MagneticButton>
                </div>
            </section>

            <RelatedPages
                title="Related reading"
                items={RELATED_BY_COMPETITOR[slug] || RELATED_BY_COMPETITOR.square}
            />
        </MarketingLayout>
    );
}

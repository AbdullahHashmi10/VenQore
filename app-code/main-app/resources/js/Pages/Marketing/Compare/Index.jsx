import React from 'react';
import { Head, Link } from '@inertiajs/react';
import MarketingLayout, { RevealOnScroll, MagneticButton, SectionLabel, InlineLink, RelatedPages } from '../Shared/MarketingLayout';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, BarChart3, Scale, Layers } from 'lucide-react';

export default function CompareIndex({ competitors }) {
    return (
        <MarketingLayout>
            <Head>
                <title>VenQore POS & ERP Comparisons — See How VenQore Compares</title>
                <meta name="description" content="Compare VenQore with Square, Vyapar, Shopify POS, Lightspeed and Toast. Discover why growing businesses choose VenQore for zero transaction fees and built-in double-entry accounting." />
            </Head>

            {/* Hero */}
            <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
                <RevealOnScroll direction="up">
                    <SectionLabel icon={Scale} text="HONEST COMPETITOR COMPARISONS" />
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6 mt-4">
                        How VenQore Compares to <br />
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                            Legacy POS & Billing Systems
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                        Most POS software charges 2.6%+ on every sale or leaves your accounting incomplete. VenQore gives you a flat{' '}
                        <InlineLink href="/pricing">subscription</InlineLink> with $0 processing markups and built-in{' '}
                        <InlineLink href="/features/accounting">double-entry bookkeeping</InlineLink> on top of a{' '}
                        <InlineLink href="/features/point-of-sale">full point of sale</InlineLink>.
                    </p>
                </RevealOnScroll>
            </section>

            {/* Competitors Grid */}
            <section className="pb-24 px-6 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-8">
                    {competitors.map((item, idx) => (
                        <RevealOnScroll key={item.slug} delay={idx * 0.15}>
                            <div className="h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between">
                                <div>
                                    <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
                                        {item.tag}
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                                        VenQore vs {item.name}
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                                        {item.summary}
                                    </p>
                                </div>
                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                        Detailed Breakdown &amp; Pricing Math
                                    </span>
                                    <Link
                                        href={`/compare/${item.slug}`}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:bg-emerald-600 dark:hover:bg-emerald-400 transition-colors"
                                    >
                                        Compare <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </RevealOnScroll>
                    ))}
                </div>
            </section>

            {/* Core Pillars */}
            <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            The 4 VenQore Standard Guarantee
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300">
                            Every comparison page adheres to strict engineering and financial truth rules.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { icon: ShieldCheck, title: "Zero Processing Markup", text: "Pay flat subscription rates with $0 hidden transaction percentages." },
                            { icon: BarChart3, title: "Auditor-Grade Books", text: "Every sale, purchase, and refund creates a balanced double-entry journal." },
                            { icon: Zap, title: "100% Offline PWA", text: "Keep checking out customers even during complete internet blackouts." },
                            { icon: Layers, title: "1,500+ Automated Tests", text: "Financial precision verified by robust automated regression suites." },
                        ].map((pillar, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <pillar.icon className="w-8 h-8 text-emerald-500 mb-4" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{pillar.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{pillar.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6 text-center max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                    Ready to Take Control of Your Margins?
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
                    Start a 14-day free trial with full feature access — no credit card required.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <MagneticButton href="/register" variant="primary">
                        Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                    </MagneticButton>
                    <MagneticButton href="/demo" variant="secondary">
                        Explore Interactive Demo
                    </MagneticButton>
                </div>
            </section>

            <RelatedPages
                title="Before you decide"
                items={[
                    { eyebrow: 'Feature', label: 'Real Accounting', href: '/features/accounting', desc: 'The double-entry ledger the comparisons hinge on.' },
                    { eyebrow: 'Feature', label: 'Offline POS', href: '/features/offline-pos', desc: 'What happens to your till when the line drops.' },
                    { eyebrow: 'Pricing', label: 'Plans & pricing', href: '/pricing', desc: 'Flat monthly cost with no per-sale markup.' },
                    { eyebrow: 'Solutions', label: 'Find your trade', href: '/solutions', desc: 'Industry-specific setups, from pharmacy to wholesale.' },
                ]}
            />
        </MarketingLayout>
    );
}

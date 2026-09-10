import React from 'react';
import { Head, Link } from '@inertiajs/react';
import MarketingLayout, { RevealOnScroll, MagneticButton, SectionLabel, GlassCard, InlineLink, RelatedPages } from '../Shared/MarketingLayout';
import { solutionsHubList } from '../../../Data/solutions';
import { ArrowRight, Layers, Pill, Smartphone, ShoppingCart, Truck, Shirt, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';

const iconMap = {
    Pill,
    Smartphone,
    ShoppingCart,
    Truck,
    Shirt,
    Building2
};

export default function Index() {
    return (
        <MarketingLayout>
            <Head>
                <title>Industry Solutions — Industry-Specific Business Operating Systems | VenQore</title>
                <meta name="description" content="Explore VenQore's industry-tailored POS and ERP operating systems. Built for Pharmacy batch/expiry, Electronics IMEI tracking, Grocery, Wholesale, and Multi-Store retail." />
            </Head>

            {/* Hero Section */}
            <section className="relative pt-32 pb-16 px-6 max-w-7xl mx-auto text-center">
                <RevealOnScroll direction="up">
                    <SectionLabel icon={Layers} text="INDUSTRY OPERATING SYSTEMS" />
                    <h1 className="text-4xl md:text-6xl font-bold text-ink tracking-tight mb-6 mt-4">
                        Software Built for Your Specific Trade
                    </h1>
                    <p className="text-lg md:text-xl text-ink-secondary max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                        Generic POS systems force your business into a standard cash register box. VenQore delivers trade-specific controls —
                        from <InlineLink href="/solutions/pharmacy">pharmacy expiry tracking</InlineLink> to{''}
                        <InlineLink href="/solutions/electronics-store">smartphone IMEI logs</InlineLink> — backed by{''}
                        <InlineLink href="/features/accounting">auditor-grade accounting</InlineLink> and{''}
                        <InlineLink href="/features/inventory-management">FIFO inventory</InlineLink>.
                    </p>
                </RevealOnScroll>
            </section>

            {/* Solutions Grid */}
            <section className="pb-24 px-6 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {solutionsHubList.map((sol, i) => {
                        const Icon = iconMap[sol.iconName] || Layers;
                        return (
                            <RevealOnScroll key={sol.slug} delay={i * 0.1} direction="up">
                                <GlassCard className="h-full flex flex-col justify-between p-8 rounded-2xl border border-line hover:border-brand-500/40 transition-all duration-slow">
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <span className={`text-2xs font-bold uppercase px-3 py-1 rounded-full ${sol.badgeColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : sol.badgeColor === 'indigo' ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20' : 'bg-neutral-500/10 text-ink-muted border border-line-strong'}`}>
                                                {sol.badge}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-ink mb-3">
                                            {sol.name}
                                        </h3>
                                        <p className="text-ink-secondary text-sm leading-relaxed mb-6">
                                            {sol.desc}
                                        </p>
                                    </div>
                                    <div>
                                        <Link
                                            href={sol.href}
                                            className="inline-flex items-center text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 group"
                                        >
                                            Explore {sol.name} <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </GlassCard>
                            </RevealOnScroll>
                        );
                    })}
                </div>
            </section>

            {/* Proof Guarantee */}
            <section className="py-20 px-6 bg-neutral-900 text-white rounded-2xl max-w-7xl mx-auto mb-24">
                <div className="max-w-4xl mx-auto text-center">
                    {/* This panel is permanently dark in both themes, so its
                        contents keep dark-mode colours — no light partners. */}
                    <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        One Ledger Core. Every Industry Capability.
                    </h2>
                    <p className="text-neutral-300 text-base md:text-lg mb-8 leading-relaxed">
                        No matter your trade, every transaction updates the same verified double-entry General Ledger — the
                        engine behind <InlineLink href="/features/accounting" className="text-emerald-300 decoration-emerald-400/40">VenQore's accounting</InlineLink> and{''}
                        <InlineLink href="/features/inventory-management" className="text-emerald-300 decoration-emerald-400/40">FIFO inventory</InlineLink>.
                        Guarded by 1,500+ automated tests, your reports match your money down to the cent.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <MagneticButton href="/demo" variant="primary">
                            Try Live Demo — No Signup
                        </MagneticButton>
                        <MagneticButton href="/pricing" variant="ghost">
                            View Pricing Plans
                        </MagneticButton>
                    </div>
                </div>
            </section>

            <RelatedPages
                title="Explore the platform"
                items={[
                    { eyebrow: 'Feature', label: 'Point of Sale', href: '/features/point-of-sale', desc: 'The terminal every industry setup is built on.' },
                    { eyebrow: 'Feature', label: 'FIFO Inventory', href: '/features/inventory-management', desc: 'Batches, serials, variants and real costing.' },
                    { eyebrow: 'Compare', label: 'How VenQore compares', href: '/compare', desc: 'Side by side with Square and Vyapar.' },
                    { eyebrow: 'Free tools', label: 'Try a tool first', href: '/tools', desc: 'Invoices, barcodes and calculators, no signup.' },
                ]}
            />
        </MarketingLayout>
    );
}

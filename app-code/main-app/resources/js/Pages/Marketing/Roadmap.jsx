import React from 'react';
import { Head, Link } from '@inertiajs/react';
import MarketingLayout, { RevealOnScroll, MagneticButton, SectionLabel } from './Shared/MarketingLayout';
import { ArrowRight, CheckCircle2, Clock, Sparkles, Layers, Bot, Zap, Globe, ShieldCheck } from 'lucide-react';

export default function Roadmap() {
    return (
        <MarketingLayout>
            <Head>
                <title>Public Product Roadmap — VenQore (Now / Next / Later)</title>
                <meta name="description" content="Explore VenQore's public product roadmap. See what is shipped today, what is rolling out next, and how we are building toward zero-typing business management." />
            </Head>

            {/* Hero Section */}
            <section className="relative pt-32 pb-16 px-6 max-w-7xl mx-auto text-center">
                <RevealOnScroll direction="up">
                    <SectionLabel icon={Clock} text="PUBLIC PRODUCT ROADMAP" />
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6 mt-4">
                        Where VenQore is Headed
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                        First we put everything in one place. Now we are teaching it to fill itself in. Eventually nobody types anything.
                    </p>
                </RevealOnScroll>
            </section>

            {/* Roadmap Pillars: Now / Next / Later */}
            <section className="pb-24 px-6 max-w-6xl mx-auto">
                <div className="space-y-12">
                    {/* NOW: Shipped */}
                    <RevealOnScroll direction="up">
                        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">
                            <div className="absolute top-6 right-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider">
                                <CheckCircle2 className="w-4 h-4" /> SHIPPED &amp; LIVE
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3">
                                1. Now — One System for the Whole Business
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-6">
                                Everything you need to run your retail or wholesale business in one place — point of sale, inventory, purchasing, invoicing, customer credit khata, expenses, staff, and auditor-grade double-entry accounting.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                {[
                                    "Point of Sale (POS) with Touch & Barcode Checkout",
                                    "Auditor-Grade Double-Entry General Ledger & Balance Sheet",
                                    "FIFO Cost Batching & Inventory Lineage Tracking",
                                    "100% Offline-First PWA (Works without Internet)",
                                    "WooCommerce Synchronization (Stock out, Orders in)",
                                    "40+ Financial & Operational Reports from One Ledger",
                                    "Serial & IMEI Tracking + Batch Expiry Controls",
                                    "1,500+ Automated Verification & Integrity Tests"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                        <span className="font-semibold">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* NEXT: Rolling Out */}
                    <RevealOnScroll direction="up">
                        <div className="bg-white dark:bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">
                            <div className="absolute top-6 right-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-black uppercase tracking-wider">
                                <Zap className="w-4 h-4" /> ROLLING OUT NOW
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3">
                                2. Next — The System Fills Itself In
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-6">
                                Eliminating manual data entry. Information enters your business via paper, voice, WhatsApp, or marketplaces, and VenQore turns it into ready-made ledger entries automatically.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                {[
                                    "SmartCapture AI: Photos of invoices & paper bills to digital records",
                                    "SmartCapture Voice: Spoken voice notes drafted into editable sales",
                                    "VenSynQ Amazon Integration: Stock & order sync for Amazon Sellers",
                                    "VenSynQ TikTok Shop & eBay Integration: Multi-marketplace sync",
                                    "Automated Debt & Payment Reminders via WhatsApp",
                                    "AI Owner Insights: Restock recommendations & customer churn alerts"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 text-slate-800 dark:text-slate-200 border border-indigo-100 dark:border-indigo-900/40">
                                        <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
                                        <span className="font-semibold">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* LATER: Building Toward */}
                    <RevealOnScroll direction="up">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-lg">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider mb-4">
                                <Globe className="w-4 h-4" /> BUILDING TOWARD
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3">
                                3. Later — Zero-Typing Business Management
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-6">
                                Businesses on VenQore stop typing entirely. One company's invoice lands as another company's bill automatically across our secure B2B network.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                {[
                                    "VenQore B2B Trade Network: One-click supplier-to-buyer invoice posting",
                                    "Turnkey Hosted Online Storefronts for Every Business",
                                    "Vena Autonomous AI Business Advisor: Financial health & inventory tuning",
                                    "Cross-Border Automated Multi-Currency Tax Settlements"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300">
                                        <Bot className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0" />
                                        <span className="font-semibold">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 text-center max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                    Be Part of the Future of Business Software
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
                    Start your 14-day free trial today or explore our live demo without signing up.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <MagneticButton href="/register" variant="primary">
                        Start 14-Day Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                    </MagneticButton>
                    <MagneticButton href="/demo" variant="secondary">
                        Explore Live Interactive Demo
                    </MagneticButton>
                </div>
            </section>
        </MarketingLayout>
    );
}

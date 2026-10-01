import React from 'react';
import { Head } from '@inertiajs/react';
import MarketingLayout, { RevealOnScroll, MagneticButton, SectionLabel } from './Shared/MarketingLayout';
import { ArrowRight, CheckCircle2, Clock, Sparkles, Bot, Zap, Globe } from 'lucide-react';

/* Now / Next / Later — one card style, status told by a token colour
   (success / accent / quiet) on the top rule, the badge and the item icons. */
const PHASES = [
    {
        key: 'now',
        badge: { className: 'vq-badge vq-badge--success', icon: CheckCircle2, label: 'Shipped & live' },
        title: '1. Now — One System for the Whole Business',
        text: 'Everything you need to run your retail or wholesale business in one place — point of sale, inventory, purchasing, invoicing, customer credit khata, expenses, staff, and auditor-grade double-entry accounting.',
        itemIcon: CheckCircle2,
        items: [
            'Point of Sale (POS) with Touch & Barcode Checkout',
            'Auditor-Grade Double-Entry General Ledger & Balance Sheet',
            'FIFO Cost Batching & Inventory Lineage Tracking',
            '100% Offline-First PWA (Works without Internet)',
            'WooCommerce Synchronization (Stock out, Orders in)',
            '40+ Financial & Operational Reports from One Ledger',
            'Serial & IMEI Tracking + Batch Expiry Controls',
            'Eight correctness laws, run on every release',
        ],
    },
    {
        key: 'next',
        badge: { className: 'vq-badge vq-badge--accent', icon: Zap, label: 'Rolling out now' },
        title: '2. Next — The System Fills Itself In',
        text: 'Eliminating manual data entry. Information enters your business via paper, voice, WhatsApp, or marketplaces, and VenQore turns it into ready-made ledger entries automatically.',
        itemIcon: Sparkles,
        items: [
            'SmartCapture AI: Photos of invoices & paper bills to digital records',
            'SmartCapture Voice: Spoken voice notes drafted into editable sales',
            'VenSynQ Amazon Integration: Stock & order sync for Amazon Sellers',
            'VenSynQ TikTok Shop & eBay Integration: Multi-marketplace sync',
            'Automated Debt & Payment Reminders via WhatsApp',
            'AI Owner Insights: Restock recommendations & customer churn alerts',
        ],
    },
    {
        key: 'later',
        badge: { className: 'vq-badge vq-badge--soon', icon: Globe, label: 'Building toward' },
        title: '3. Later — Zero-Typing Business Management',
        text: "Businesses on VenQore stop typing entirely. One company's invoice lands as another company's bill automatically across our secure B2B network.",
        itemIcon: Bot,
        items: [
            'VenQore B2B Trade Network: One-click supplier-to-buyer invoice posting',
            'Turnkey Hosted Online Storefronts for Every Business',
            'Vena Autonomous AI Business Advisor: Financial health & inventory tuning',
            'Cross-Border Automated Multi-Currency Tax Settlements',
        ],
    },
];

export default function Roadmap() {
    return (
        <MarketingLayout>
            <Head>
                <title>Public Product Roadmap — VenQore (Now / Next / Later)</title>
                <meta name="description" content="Explore VenQore's public product roadmap. See what is shipped today, what is rolling out next, and how we are building toward zero-typing business management." />
            </Head>

            {/* Hero Section */}
            <section className="vq-section vq-mc-top">
                <div className="vq-amb" aria-hidden="true"><span className="vq-amb__aurora" style={{ opacity: 0.22 }} /></div>
                <div className="vq-container" style={{ position: 'relative' }}>
                    <div className="vq-mc-head">
                        <SectionLabel icon={Clock} text="Public product roadmap" />
                        <h1 className="vq-display">Where VenQore is <em className="vq-italic">headed.</em></h1>
                        <p className="vq-lede vq-mt-6">
                            First we put everything in one place. Now we are teaching it to fill itself in. Eventually nobody types anything.
                        </p>
                    </div>
                </div>
            </section>

            {/* Roadmap Pillars: Now / Next / Later */}
            <section className="vq-section vq-mc-body">
                <div className="vq-container">
                    <div className="vq-stack vq-gap-6">
                        {PHASES.map((phase) => {
                            const BadgeIcon = phase.badge.icon;
                            const ItemIcon = phase.itemIcon;
                            return (
                                <RevealOnScroll key={phase.key} direction="up">
                                    <div className={`vq-card vq-card--xl vq-mc-phase vq-mc-phase--${phase.key}`} style={{ padding: 'clamp(28px, 4vw, 48px)' }}>
                                        <div className="vq-mc-phase__head">
                                            <h2 className="vq-h2">{phase.title}</h2>
                                            <span className={phase.badge.className}>
                                                <BadgeIcon size={14} aria-hidden="true" /> {phase.badge.label}
                                            </span>
                                        </div>
                                        <p className="vq-body vq-text-2 vq-mt-4" style={{ maxWidth: '68ch' }}>{phase.text}</p>
                                        <div className="vq-mc-items">
                                            {phase.items.map((item, i) => (
                                                <div key={i} className="vq-mc-item">
                                                    <ItemIcon size={18} aria-hidden="true" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </RevealOnScroll>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="vq-section vq-section--alt">
                <div className="vq-container">
                    <div className="vq-section-head vq-section-head--center" style={{ marginBottom: 0 }}>
                        <h2 className="vq-h1">Be Part of the Future of Business Software</h2>
                        <p className="vq-lede">
                            Describe your business and watch it get built — 14 days at Core level with full feature access. Or explore the live demo without signing up.
                        </p>
                        <div className="vq-row vq-wrap vq-gap-3 vq-mt-8" style={{ justifyContent: 'center' }}>
                            <MagneticButton href="/build-workspace" variant="primary" className="vq-btn--lg">
                                Start building <span className="vq-btn__arrow"><ArrowRight size={16} aria-hidden="true" /></span>
                            </MagneticButton>
                            <MagneticButton href="/demo" variant="secondary" className="vq-btn--lg">
                                Explore Live Interactive Demo
                            </MagneticButton>
                        </div>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}

import React from 'react';
import { Head, Link } from '@inertiajs/react';
import MarketingLayout, { InlineLink, RelatedPages } from '../Shared/MarketingLayout';
import BusinessTypes from '@/Components/Site/BusinessTypes';
import { BUSINESS_TYPE_CLAIM } from '@/Components/Site/sectorCatalog';
import { solutionsHubList } from '../../../Data/solutions';
import { ArrowRight, Layers, Pill, Smartphone, ShoppingCart, Truck, Shirt, Building2, ShieldCheck } from 'lucide-react';

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
                <meta name="description" content="VenQore assembles business software for 85+ kinds of business in five sectors — services and repairs, retail, food and hospitality, wholesale and light manufacturing — on one double-entry ledger." />
            </Head>

            {/* Hero */}
            <section className="vq-section vq-mkt-hero">
                <div className="vq-container">
                    <div className="vq-section-head vq-section-head--center" style={{ marginBottom: 0 }}>
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Industry operating systems</span>
                        <h1 className="vq-display vq-mt-4">Software built for your specific trade — {BUSINESS_TYPE_CLAIM} of them.</h1>
                        <p className="vq-lede">
                            Generic POS systems force your business into a standard cash register box. VenQore delivers trade-specific controls —
                            from <InlineLink href="/solutions/pharmacy">pharmacy expiry tracking</InlineLink> to{' '}
                            <InlineLink href="/solutions/electronics-store">smartphone IMEI logs</InlineLink> — backed by{' '}
                            <InlineLink href="/features/accounting">auditor-grade accounting</InlineLink> and{' '}
                            <InlineLink href="/features/inventory-management">FIFO inventory</InlineLink>.
                        </p>
                    </div>
                </div>
            </section>

            {/* Solutions grid */}
            <section className="vq-section" style={{ paddingTop: 0 }}>
                <div className="vq-container">
                    <div className="vq-grid vq-grid--3">
                        {solutionsHubList.map((sol) => {
                            const Icon = iconMap[sol.iconName] || Layers;
                            const badge = sol.badgeColor === 'emerald' ? 'vq-badge--success' : sol.badgeColor === 'indigo' ? 'vq-badge--accent' : '';
                            return (
                                <Link key={sol.slug} href={sol.href} className="vq-card vq-card--xl vq-card--interactive vq-mkt-card">
                                    <div className="vq-row" style={{ justifyContent: 'space-between' }}>
                                        <span className="vq-tile__icon" style={{ marginBottom: 0 }}><Icon aria-hidden="true" /></span>
                                        {sol.badge && <span className={`vq-badge ${badge}`}>{sol.badge}</span>}
                                    </div>
                                    <h2 className="vq-tile__title vq-mt-6">{sol.name}</h2>
                                    <p className="vq-tile__body vq-mt-3">{sol.desc}</p>
                                    <span className="vq-link vq-mkt-card__cta">
                                        Explore {sol.name} <ArrowRight size={16} aria-hidden="true" />
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* All 85+ business types, by sector — the directory the header and landing link to. */}
            <BusinessTypes variant="directory" className="vq-section--alt" />

            {/* One ledger core */}
            <section className="vq-section">
                <div className="vq-container">
                    <div className="vq-section-head vq-section-head--center" style={{ marginBottom: 0 }}>
                        <span className="vq-tile__icon" style={{ margin: '0 auto var(--vq-space-5)' }}><ShieldCheck aria-hidden="true" /></span>
                        <h2 className="vq-h1">One ledger core. Every industry capability.</h2>
                        <p className="vq-lede">
                            No matter your trade, every transaction updates the same verified double-entry General Ledger — the
                            engine behind <InlineLink href="/features/accounting">VenQore's accounting</InlineLink> and{' '}
                            <InlineLink href="/features/inventory-management">FIFO inventory</InlineLink>.
                            Guarded by eight correctness laws that run against every reading, your reports match your money down to the cent.
                        </p>
                        <div className="vq-row vq-wrap vq-gap-3 vq-mt-8" style={{ justifyContent: 'center' }}>
                            <Link href="/demo" className="vq-btn vq-btn--primary vq-btn--lg">
                                Try the live demo — no signup <ArrowRight size={16} className="vq-btn__arrow" aria-hidden="true" />
                            </Link>
                            <Link href="/pricing" className="vq-btn vq-btn--secondary vq-btn--lg">View pricing</Link>
                        </div>
                    </div>
                </div>
            </section>

            <div className="vq-mt-16">
            <RelatedPages
                title="Explore the platform"
                items={[
                    { eyebrow: 'Feature', label: 'Point of Sale', href: '/features/point-of-sale', desc: 'The terminal every industry setup is built on.' },
                    { eyebrow: 'Feature', label: 'FIFO Inventory', href: '/features/inventory-management', desc: 'Batches, serials, variants and real costing.' },
                    { eyebrow: 'Compare', label: 'How VenQore compares', href: '/compare', desc: 'Side by side with Square and Vyapar.' },
                    { eyebrow: 'Free tools', label: 'Try a tool first', href: '/tools', desc: 'Invoices, barcodes and calculators, no signup.' },
                ]}
            />
            </div>
        </MarketingLayout>
    );
}

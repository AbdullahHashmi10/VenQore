import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import MarketingLayout, { RelatedPages } from '../Shared/MarketingLayout';
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

            {/* Hero */}
            <section className="vq-section vq-mkt-hero">
                <div className="vq-container">
                    <div className="vq-section-head vq-section-head--center" style={{ marginBottom: 0, maxWidth: 880 }}>
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">{data.heroBadge}</span>
                        <h1 className="vq-display vq-mt-4">{data.headline}</h1>
                        <p className="vq-lede">{data.subhead}</p>
                        <div className="vq-row vq-wrap vq-gap-3 vq-mt-8" style={{ justifyContent: 'center' }}>
                            <Link href="/demo" className="vq-btn vq-btn--primary vq-btn--lg">
                                Try the live demo — no signup <ArrowRight size={16} className="vq-btn__arrow" aria-hidden="true" />
                            </Link>
                            <Link href="/register" className="vq-btn vq-btn--secondary vq-btn--lg">
                                Start free 14-day trial
                            </Link>
                        </div>
                    </div>

                    {/* Stats strip */}
                    <div className="vq-grid vq-grid--4 vq-mt-16 vq-mkt-stats">
                        {data.stats.map((stat, i) => (
                            <div key={i} className="vq-card vq-stat">
                                <span className="vq-stat__label">{stat.label}</span>
                                <span className="vq-stat__value vq-stat__value--sm">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pain points */}
            <section className="vq-section vq-section--alt">
                <div className="vq-container">
                    <div className="vq-section-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Where the money leaks</span>
                        <h2 className="vq-h1 vq-mt-4">The silent profit leaks in {data.name} operations</h2>
                        <p className="vq-lede">
                            Generic POS systems hide operational losses behind manual spreadsheets. VenQore fixes the root cause directly at the till.
                        </p>
                    </div>

                    <div className="vq-grid vq-grid--2">
                        {data.painPoints.map((item, i) => (
                            <article key={i} className="vq-card vq-card--xl vq-mkt-pain">
                                <h3 className="vq-tile__title">{item.title}</h3>
                                <div className="vq-mkt-pain__row vq-mkt-pain__row--problem vq-mt-5">
                                    <span className="vq-mkt-pain__label"><AlertTriangle size={16} aria-hidden="true" /> The problem</span>
                                    <p>{item.problem}</p>
                                </div>
                                <div className="vq-mkt-pain__row vq-mkt-pain__row--fix vq-mt-3">
                                    <span className="vq-mkt-pain__label"><CheckCircle2 size={16} aria-hidden="true" /> The VenQore fix</span>
                                    <p>{item.solution}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Capabilities */}
            <section className="vq-section">
                <div className="vq-container">
                    <div className="vq-section-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Capabilities</span>
                        <h2 className="vq-h1 vq-mt-4">Purpose-built for {data.name} retailers</h2>
                        <p className="vq-lede">
                            Every feature is engineered to protect stock accuracy, eliminate repeated typing, and maintain auditor-grade books.
                        </p>
                    </div>

                    <div className="vq-grid vq-grid--3">
                        {data.features.map((feat, i) => {
                            const Icon = iconMap[feat.icon] || ShieldCheck;
                            return (
                                <div key={i} className="vq-card vq-card--xl vq-tile">
                                    <span className="vq-tile__icon"><Icon aria-hidden="true" /></span>
                                    <h3 className="vq-tile__title">{feat.title}</h3>
                                    <p className="vq-tile__body">{feat.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Ledger impact */}
            <section className="vq-section vq-section--alt">
                <div className="vq-container">
                    <div className="vq-section-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Ledger truth engine</span>
                        <h2 className="vq-h1 vq-mt-4">{data.accountingImpact.title}</h2>
                        <p className="vq-lede">{data.accountingImpact.description}</p>
                    </div>

                    <div className="vq-mkt-table-wrap">
                        <table className="vq-mkt-table">
                            <thead>
                                <tr>
                                    <th scope="col">Account name &amp; code</th>
                                    <th scope="col">Debit ($)</th>
                                    <th scope="col">Credit ($)</th>
                                    <th scope="col">Automated impact</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.accountingImpact.entries.map((entry, i) => (
                                    <tr key={i}>
                                        <th scope="row">{entry.account}</th>
                                        <td className="vq-num vq-mkt-dr">{entry.debit}</td>
                                        <td className="vq-num vq-mkt-cr">{entry.credit}</td>
                                        <td>{entry.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Cross-links */}
            <section className="vq-section vq-section--tight">
                <div className="vq-container">
                    <div className="vq-grid vq-grid--2">
                        <div>
                            <h2 className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Compare competitors</h2>
                            <div className="vq-row vq-wrap vq-gap-3 vq-mt-5">
                                {data.compareCrossLinks.map((link, i) => (
                                    <Link key={i} href={link.href} className="vq-chip">{link.name} <ArrowRight size={14} aria-hidden="true" /></Link>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h2 className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Platform capabilities</h2>
                            <div className="vq-row vq-wrap vq-gap-3 vq-mt-5">
                                {data.featureCrossLinks.map((link, i) => (
                                    <Link key={i} href={link.href} className="vq-chip">{link.name} <ArrowRight size={14} aria-hidden="true" /></Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="vq-section" style={{ paddingTop: 'var(--vq-space-8)' }}>
                <div className="vq-container vq-container--narrow">
                    <div className="vq-section-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">FAQ</span>
                        <h2 className="vq-h1 vq-mt-4">Frequently asked questions — {data.name} POS</h2>
                        <p className="vq-lede">
                            Everything you need to know about setting up VenQore for your {data.name.toLowerCase()} business.
                        </p>
                    </div>

                    <div className="vq-tools__faq">
                        {data.faqs.map((faq, i) => (
                            <div key={i} className="vq-tools__faq-item" data-open={openFaq === i ? 'true' : 'false'}>
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(i)}
                                    aria-expanded={openFaq === i}
                                    className="vq-tools__faq-q"
                                >
                                    <span>{faq.q}</span>
                                    <ChevronDown size={20} aria-hidden="true" />
                                </button>
                                {openFaq === i && <p className="vq-tools__faq-a">{faq.a}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="vq-section" style={{ paddingTop: 0 }}>
                <div className="vq-container">
                    <div className="vq-card vq-card--xl vq-mkt-cta">
                        <h2 className="vq-h1">Ready to upgrade your {data.name} operations?</h2>
                        <p className="vq-lede">
                            Describe your business and VenQore assembles the system for it — 14 days at Core level with full feature access. Or test drive the live demo with no signup at all.
                        </p>
                        <div className="vq-row vq-wrap vq-gap-3 vq-mkt-cta__actions">
                            <Link href="/build-workspace" className="vq-btn vq-btn--primary vq-btn--lg">
                                Start building <ArrowRight size={16} className="vq-btn__arrow" aria-hidden="true" />
                            </Link>
                            <Link href="/demo" className="vq-btn vq-btn--secondary vq-btn--lg">Explore the live demo</Link>
                        </div>
                    </div>
                </div>
            </section>

            <RelatedPages title="Related reading" items={related} />
        </MarketingLayout>
    );
}

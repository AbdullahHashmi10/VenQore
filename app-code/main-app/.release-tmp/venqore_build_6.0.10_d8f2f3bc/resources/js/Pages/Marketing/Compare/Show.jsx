import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import MarketingLayout, { RelatedPages } from '../Shared/MarketingLayout';

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

            {/* Hero */}
            <section className="vq-section vq-mkt-hero">
                <div className="vq-container">
                    <div className="vq-section-head vq-section-head--center" style={{ marginBottom: 0, maxWidth: 900 }}>
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">VenQore vs {data.name}</span>
                        <h1 className="vq-display vq-mt-4">{data.headline}</h1>
                        <p className="vq-lede">{data.subtitle}</p>
                    </div>

                    {/* Quick summary */}
                    <div className="vq-grid vq-grid--2 vq-mt-16 vq-cmp-sum">
                        <div className="vq-card vq-card--xl vq-cmp-sum__us">
                            <div className="vq-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                <div>
                                    <h2 className="vq-h3">VenQore</h2>
                                    <p className="vq-small vq-accent-text vq-mt-2" style={{ fontWeight: 600 }}>The AI ERP builder</p>
                                </div>
                                <span className="vq-badge vq-badge--accent">Recommended</span>
                            </div>
                            <ul className="vq-mkt-list vq-mt-6">
                                <li><Check aria-hidden="true" /><span><strong>Price:</strong> {data.venqorePrice}</span></li>
                                <li><Check aria-hidden="true" /><span><strong>Processing fees:</strong> {data.venqoreTxFee}</span></li>
                                <li><Check aria-hidden="true" /><span><strong>Accounting:</strong> {data.venqoreAccounting}</span></li>
                                <li><Check aria-hidden="true" /><span><strong>Offline access:</strong> {data.venqoreOffline}</span></li>
                            </ul>
                        </div>
                        <div className="vq-card vq-card--xl vq-card--flat vq-cmp-sum__them">
                            <h2 className="vq-h3">{data.name}</h2>
                            <p className="vq-small vq-text-3 vq-mt-2" style={{ fontWeight: 600 }}>Legacy system</p>
                            <ul className="vq-mkt-list vq-mkt-list--x vq-mt-6">
                                <li><X aria-hidden="true" /><span><strong>Price:</strong> {data.competitorPrice}</span></li>
                                <li><X aria-hidden="true" /><span><strong>Processing fees:</strong> {data.competitorTxFee}</span></li>
                                <li><X aria-hidden="true" /><span><strong>Accounting:</strong> {data.competitorAccounting}</span></li>
                                <li><X aria-hidden="true" /><span><strong>Offline access:</strong> {data.competitorOffline}</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing math */}
            <section className="vq-section vq-section--alt">
                <div className="vq-container">
                    <div className="vq-section-head vq-section-head--center">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Real margin math</span>
                        <h2 className="vq-h1 vq-mt-4">The true cost comparison at {data.pricingMath.monthlySales} / month</h2>
                    </div>
                    <div className="vq-grid vq-grid--2" style={{ maxWidth: 900, marginInline: 'auto' }}>
                        <div className="vq-card vq-card--xl vq-stat">
                            <span className="vq-stat__label">{data.name} total cost</span>
                            <span className="vq-stat__value vq-stat__value--sm vq-cmp-them">{data.pricingMath.squareFee || data.pricingMath.vyaparFee}</span>
                            <span className="vq-stat__note">Accumulates every month as processing fees scale with your revenue.</span>
                        </div>
                        <div className="vq-card vq-card--xl vq-stat vq-cmp-sum__us">
                            <span className="vq-stat__label">VenQore total cost</span>
                            <span className="vq-stat__value vq-stat__value--sm vq-cmp-us">{data.pricingMath.venqoreFee}</span>
                            <span className="vq-stat__note">Fixed monthly subscription with no transaction markups. Keep 100% of your earnings.</span>
                        </div>
                    </div>
                    <div className="vq-center vq-mt-8">
                        <span className="vq-cmp-savings">{data.pricingMath.annualSavings}</span>
                    </div>
                </div>
            </section>

            {/* Feature matrix */}
            <section className="vq-section">
                <div className="vq-container">
                    <div className="vq-section-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Side by side</span>
                        <h2 className="vq-h1 vq-mt-4">Detailed feature-by-feature matrix</h2>
                        <p className="vq-lede">Compare VenQore side-by-side with {data.name} across core business operations.</p>
                    </div>
                    <div className="vq-mkt-table-wrap">
                        <table className="vq-mkt-table">
                            <thead>
                                <tr>
                                    <th scope="col" style={{ width: '38%' }}>Feature / capability</th>
                                    <th scope="col" className="is-us">VenQore</th>
                                    <th scope="col">{data.name}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.table.map((row, idx) => (
                                    <tr key={idx}>
                                        <th scope="row">{row.feature}</th>
                                        <td className="is-us">
                                            <span className="vq-row vq-gap-2" style={{ alignItems: 'flex-start' }}>
                                                <Check size={16} className="vq-cmp-tick" aria-hidden="true" />
                                                <span>{row.venqore}</span>
                                            </span>
                                        </td>
                                        <td>{row.competitor}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Verdict */}
            <section className="vq-section vq-section--alt">
                <div className="vq-container">
                    <div className="vq-section-head vq-section-head--center">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Honest recommendation</span>
                        <h2 className="vq-h1 vq-mt-4">Which should you choose?</h2>
                    </div>
                    <div className="vq-grid vq-grid--2" style={{ maxWidth: 1000, marginInline: 'auto' }}>
                        <div className="vq-card vq-card--xl">
                            <h3 className="vq-h3">When to choose {data.name}</h3>
                            <p className="vq-small vq-text-2 vq-mt-3" style={{ lineHeight: 1.65 }}>{data.honestVerdict.chooseCompetitor}</p>
                        </div>
                        <div className="vq-card vq-card--xl vq-cmp-sum__us">
                            <h3 className="vq-h3">When to choose VenQore</h3>
                            <p className="vq-small vq-text-2 vq-mt-3" style={{ lineHeight: 1.65 }}>{data.honestVerdict.chooseVenQore}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="vq-section">
                <div className="vq-container vq-container--narrow">
                    <div className="vq-section-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Frequently asked questions</span>
                        <h2 className="vq-h1 vq-mt-4">Questions about switching from {data.name} to VenQore</h2>
                    </div>
                    <div className="vq-tools__faq">
                        {data.faqs.map((faq, idx) => (
                            <div key={idx} className="vq-tools__faq-item" data-open={openFaq === idx ? 'true' : 'false'}>
                                <button type="button" onClick={() => toggleFaq(idx)} aria-expanded={openFaq === idx} className="vq-tools__faq-q">
                                    <span>{faq.q}</span>
                                    <ChevronDown size={20} aria-hidden="true" />
                                </button>
                                {openFaq === idx && <p className="vq-tools__faq-a">{faq.a}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="vq-section" style={{ paddingTop: 0 }}>
                <div className="vq-container">
                    <div className="vq-card vq-card--xl vq-mkt-cta">
                        <h2 className="vq-h1">Switch to VenQore today</h2>
                        <p className="vq-lede">
                            Start a 14-day free trial. Our team assists with zero-downtime data migration from {data.name}.
                        </p>
                        <div className="vq-row vq-wrap vq-gap-3 vq-mkt-cta__actions">
                            <Link href="/build-workspace" className="vq-btn vq-btn--primary vq-btn--lg">
                                Start building <ArrowRight size={16} className="vq-btn__arrow" aria-hidden="true" />
                            </Link>
                            <Link href="/demo" className="vq-btn vq-btn--secondary vq-btn--lg">Try the live interactive demo</Link>
                        </div>
                    </div>
                </div>
            </section>

            <RelatedPages
                title="Related reading"
                items={RELATED_BY_COMPETITOR[slug] || RELATED_BY_COMPETITOR.square}
            />
        </MarketingLayout>
    );
}

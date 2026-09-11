import React from 'react';
import { Head, Link } from '@inertiajs/react';
import MarketingLayout, { InlineLink, RelatedPages } from '../Shared/MarketingLayout';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, BarChart3, Scale, Layers } from 'lucide-react';

export default function CompareIndex({ competitors = [] }) {
    return (
        <MarketingLayout>
            <Head>
                <title>VenQore POS & ERP Comparisons — See How VenQore Compares</title>
                <meta name="description" content="Compare VenQore with Square, Vyapar, Shopify POS, Lightspeed and Toast. Discover why growing businesses choose VenQore for zero transaction fees and built-in double-entry accounting." />
            </Head>

            {/* Hero */}
            <section className="vq-section vq-mkt-hero">
                <div className="vq-container">
                    <div className="vq-section-head vq-section-head--center" style={{ marginBottom: 0, maxWidth: 880 }}>
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Honest competitor comparisons</span>
                        <h1 className="vq-display vq-mt-4">How VenQore compares to legacy POS &amp; billing systems</h1>
                        <p className="vq-lede">
                            Most POS software charges 2.6%+ on every sale or leaves your accounting incomplete. VenQore gives you a flat{' '}
                            <InlineLink href="/pricing">subscription</InlineLink> with $0 processing markups and built-in{' '}
                            <InlineLink href="/features/accounting">double-entry bookkeeping</InlineLink> on top of a{' '}
                            <InlineLink href="/features/point-of-sale">full point of sale</InlineLink>.
                        </p>
                    </div>
                </div>
            </section>

            {/* Competitors */}
            <section className="vq-section" style={{ paddingTop: 0 }}>
                <div className="vq-container">
                    <div className="vq-grid vq-grid--2">
                        {competitors.map((item) => (
                            <Link key={item.slug} href={`/compare/${item.slug}`} className="vq-card vq-card--xl vq-card--interactive vq-mkt-card">
                                <span className="vq-badge vq-badge--accent" style={{ alignSelf: 'flex-start' }}>{item.tag}</span>
                                <h2 className="vq-h2 vq-mt-5" style={{ color: 'var(--vq-text)' }}>VenQore vs {item.name}</h2>
                                <p className="vq-body vq-text-2 vq-mt-3" style={{ lineHeight: 1.65 }}>{item.summary}</p>
                                <div className="vq-mkt-card__cta">
                                    <span className="vq-link">Detailed breakdown &amp; pricing math <ArrowRight size={16} aria-hidden="true" /></span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pillars */}
            <section className="vq-section vq-section--alt">
                <div className="vq-container">
                    <div className="vq-section-head vq-section-head--center">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">The standard</span>
                        <h2 className="vq-h1 vq-mt-4">The four VenQore guarantees</h2>
                        <p className="vq-lede">Every comparison page adheres to strict engineering and financial truth rules.</p>
                    </div>

                    <div className="vq-grid vq-grid--4">
                        {[
                            { icon: ShieldCheck, title: "Zero Processing Markup", text: "Pay flat subscription rates with $0 hidden transaction percentages." },
                            { icon: BarChart3, title: "Auditor-Grade Books", text: "Every sale, purchase, and refund creates a balanced double-entry journal." },
                            { icon: Zap, title: "100% Offline PWA", text: "Keep checking out customers even during complete internet blackouts." },
                            { icon: Layers, title: "Eight Correctness Laws", text: "Financial precision verified by robust automated regression suites." },
                        ].map((pillar, i) => (
                            <div key={i} className="vq-card vq-tile">
                                <span className="vq-tile__icon"><pillar.icon aria-hidden="true" /></span>
                                <h3 className="vq-tile__title" style={{ fontSize: 20 }}>{pillar.title}</h3>
                                <p className="vq-tile__body">{pillar.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="vq-section">
                <div className="vq-container">
                    <div className="vq-card vq-card--xl vq-mkt-cta">
                        <h2 className="vq-h1">Ready to take control of your margins?</h2>
                        <p className="vq-lede">Start a 14-day free trial with full feature access — cancel anytime.</p>
                        <div className="vq-row vq-wrap vq-gap-3 vq-mkt-cta__actions">
                            <Link href="/register" className="vq-btn vq-btn--primary vq-btn--lg">
                                Start free trial <ArrowRight size={16} className="vq-btn__arrow" aria-hidden="true" />
                            </Link>
                            <Link href="/demo" className="vq-btn vq-btn--secondary vq-btn--lg">Explore the interactive demo</Link>
                        </div>
                    </div>
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

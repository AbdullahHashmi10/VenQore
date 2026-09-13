import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import MarketingLayout, { RelatedPages } from '../Shared/MarketingLayout';
import { featurePagesData } from '../../../Data/featurePages';
import {
    DemoStyles, ProfitLossDemo, PosInvoiceDemo,
    GrowthEngineDemo, CookbookDemo,
} from '../Shared/FeatureDemos';
import {
    ArrowRight, CheckCircle2, X, ChevronDown, ChevronUp,
    ShoppingCart, BookOpen, Package, WifiOff, ScanBarcode,
    Layers, CreditCard, Printer, Lock, Database, Repeat,
    Smartphone, Palette, Warehouse, GitMerge, BarChart3,
    Landmark, List, Calendar, RefreshCw, Scale, FileText,
    ShieldCheck, Zap, Gift, TrendingDown, ArrowLeftRight,
    Pause, TrendingUp,
} from 'lucide-react';

const iconMap = {
    ShoppingCart, BookOpen, Package, WifiOff, ScanBarcode, Layers,
    CreditCard, Printer, Lock, Database, Repeat, Smartphone, Palette,
    Warehouse, GitMerge, BarChart3, Landmark, List, Calendar, RefreshCw,
    Scale, FileText, ShieldCheck, Zap, Gift, TrendingDown, ArrowLeftRight,
    Pause, TrendingUp,
};

const statusColors = {
    shipped: 'vq-badge--success',
    building: 'vq-badge--warning',
    planned: 'vq-badge--soon',
};

const statusLabel = {
    shipped: '✓ Shipped',
    building: '⚙ Rolling Out',
    planned: '◦ Planned',
};

/**
 * Cross-domain internal links per feature. The existing `crossLinks` pills
 * keep the reader inside /features; this map deliberately pushes sideways
 * into Solutions, Compare and Tools so every feature page also feeds the
 * industry and comparison clusters.
 */
const RELATED_BY_FEATURE = {
    'point-of-sale': [
        { eyebrow: 'Solution', label: 'POS for Grocery', href: '/solutions/grocery', desc: 'Weighed items, fast lanes, tight margins.' },
        { eyebrow: 'Compare', label: 'VenQore vs Square', href: '/compare/venqore-vs-square', desc: 'Zero transaction fees vs 2.6% + 10¢.' },
        { eyebrow: 'Feature', label: 'Offline POS', href: '/features/offline-pos', desc: 'Keep ringing up sales with no internet.' },
        { eyebrow: 'Free tool', label: 'Receipt Generator', href: '/tools/receipt-generator', desc: 'Make a receipt now, no account needed.' },
    ],
    'inventory-management': [
        { eyebrow: 'Solution', label: 'Pharmacy', href: '/solutions/pharmacy', desc: 'Batch and expiry tracking done properly.' },
        { eyebrow: 'Solution', label: 'Wholesale', href: '/solutions/wholesale', desc: 'Bulk units, price tiers, real costing.' },
        { eyebrow: 'Free tool', label: 'Stock Count Sheet', href: '/tools/stock-count-sheet', desc: 'Print a count sheet for your next stocktake.' },
        { eyebrow: 'Free tool', label: 'Margin Calculator', href: '/tools/margin-calculator', desc: 'Check what a price actually earns you.' },
    ],
    accounting: [
        { eyebrow: 'Compare', label: 'VenQore vs Vyapar', href: '/compare/venqore-vs-vyapar', desc: 'Double-entry ledger vs single-entry billing.' },
        { eyebrow: 'Feature', label: 'FIFO Inventory', href: '/features/inventory-management', desc: 'Where your cost of goods actually comes from.' },
        { eyebrow: 'Free tool', label: 'Invoice Generator', href: '/tools/invoice-generator', desc: 'A clean, correct invoice in a minute.' },
        { eyebrow: 'Free tool', label: 'Credit Note Generator', href: '/tools/credit-note-generator', desc: 'Issue a returns credit the right way.' },
    ],
    'offline-pos': [
        { eyebrow: 'Feature', label: 'Point of Sale', href: '/features/point-of-sale', desc: 'The terminal offline mode is built into.' },
        { eyebrow: 'Solution', label: 'Multi-store', href: '/solutions/multi-store', desc: 'Branches that sync when the line comes back.' },
        { eyebrow: 'Compare', label: 'VenQore vs Square', href: '/compare/venqore-vs-square', desc: 'What happens when the internet drops.' },
        { eyebrow: 'Coming soon', label: 'VenSynQ', href: '/vensynq', desc: 'One stock pool across every channel.' },
    ],
    'growth-engine': [
        { eyebrow: 'Solution', label: 'Clothing', href: '/solutions/clothing', desc: 'Seasons, sizes and repeat customers.' },
        { eyebrow: 'Solution', label: 'Electronics', href: '/solutions/electronics-store', desc: 'Serial tracking and warranty follow-up.' },
        { eyebrow: 'Feature', label: 'Real Accounting', href: '/features/accounting', desc: 'See what your campaigns actually earned.' },
        { eyebrow: 'Free tool', label: 'QR Menu Generator', href: '/tools/qr-menu-generator', desc: 'Put a scannable menu on every table.' },
    ],
};

/**
 * The live demo that belongs on each deep-dive page.
 *
 * The /features hub shows all six demos; a visitor arriving on a deep-dive
 * straight from search previously saw none of them — the page where proof
 * matters most had the least proof. Each slug now gets the one demo that
 * actually demonstrates its claim.
 *
 * `offline-pos` intentionally reuses the POS terminal: offline mode IS the
 * POS, and a second cart demo would say the same thing twice.
 */
const DEMO_BY_FEATURE = {
    'point-of-sale': {
        Component: PosInvoiceDemo,
        eyebrow: 'Try it now',
        title: <>Ring up a sale <span className="vq-accent-text">right here.</span></>,
        lead: 'This is the real checkout. Add products, change quantities, pick a payment method and complete the sale. Nothing is saved — it is yours to play with.',
    },
    'offline-pos': {
        Component: PosInvoiceDemo,
        eyebrow: 'Try it now',
        title: <>The same terminal, <span className="vq-accent-text">with or without a line.</span></>,
        lead: 'Offline mode is not a stripped-down fallback screen — it is this exact terminal, running from local storage and syncing the moment you are back online.',
    },
    accounting: {
        Component: ProfitLossDemo,
        eyebrow: 'Try it now',
        title: <>A Profit &amp; Loss that <span className="vq-accent-text">reconciles.</span></>,
        lead: 'Switch periods and watch every figure recompute from the same verified ledger. This is the real report, drawn from real double-entry journals.',
    },
    'inventory-management': {
        Component: CookbookDemo,
        eyebrow: 'Try it now',
        title: <>Watch FIFO costing <span className="vq-accent-text">actually happen.</span></>,
        lead: 'Define a Bill of Materials, produce a batch, and see raw stock deduct at its real per-batch cost — not an average that quietly overwrote itself.',
    },
    'growth-engine': {
        Component: GrowthEngineDemo,
        eyebrow: 'Try it now',
        title: <>Every insight <span className="vq-accent-text">shows its working.</span></>,
        lead: 'Four brains read your customers, stock, margin and cash. Each one exposes the numbers behind its call, and each prediction is scored afterwards against what actually happened.',
    },
};

export default function FeatureShow({ slug }) {
    const data = featurePagesData[slug] || featurePagesData['point-of-sale'];
    const related = RELATED_BY_FEATURE[slug] || RELATED_BY_FEATURE['point-of-sale'];
    const demo = DEMO_BY_FEATURE[slug];
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

    return (
        <MarketingLayout>
            <Head>
                <title>{data.metaTitle}</title>
                <meta name="description" content={data.metaDescription} />
            </Head>

            {/* ── HERO ───────────────────────────────────────────────── */}
            <section className="vq-section vq-mkt-hero">
                <div className="vq-container">
                    <div className="vq-section-head vq-section-head--center" style={{ marginBottom: 0, maxWidth: 900 }}>
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">{data.heroBadge}</span>
                        <div className="vq-row vq-gap-3 vq-wrap vq-mt-4" style={{ justifyContent: 'center' }}>
                            <span className={`vq-badge ${statusColors[data.status] || ''}`}>{statusLabel[data.status]}</span>
                            <span className="vq-caption">{data.category}</span>
                        </div>
                        <h1 className="vq-display vq-mt-5">{data.headline}</h1>
                        <p className="vq-lede">{data.subhead}</p>
                        <div className="vq-row vq-wrap vq-gap-3 vq-mt-8" style={{ justifyContent: 'center' }}>
                            <Link href="/demo" className="vq-btn vq-btn--primary vq-btn--lg">
                                Try the live demo — no signup <ArrowRight size={16} className="vq-btn__arrow" aria-hidden="true" />
                            </Link>
                            <Link href="/pricing" className="vq-btn vq-btn--secondary vq-btn--lg">
                                See pricing — from $49/month or free
                            </Link>
                        </div>
                    </div>

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

            {/* ── ANSWER BLOCK (GEO-optimised extractable answer) ───── */}
            <section className="vq-section" style={{ paddingTop: 0 }}>
                <div className="vq-container vq-container--narrow">
                    <div className="vq-card vq-card--xl vq-mkt-answer">
                        <span className="vq-eyebrow vq-eyebrow--accent">Quick answer</span>
                        <h2 className="vq-h2 vq-mt-3">{data.answerBlock.question}</h2>
                        <p className="vq-mt-4">{data.answerBlock.answer}</p>
                    </div>
                </div>
            </section>

            {/* ── LIVE DEMO ──────────────────────────────────────────────
                Placed immediately after the answer block: the reader has just
                been told what this does, so this is the moment to show it
                rather than make them scroll past three sections of claims. */}
            {demo && (
                <section className="vq-section vq-section--alt">
                    <div className="vq-container">
                        <div className="vq-section-head vq-section-head--center">
                            <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">{demo.eyebrow}</span>
                            <h2 className="vq-h1 vq-mt-4">{demo.title}</h2>
                            <p className="vq-lede">{demo.lead}</p>
                        </div>
                        <demo.Component />
                        <p className="vq-small vq-text-2 vq-center vq-mt-6" style={{ marginInline: 'auto' }}>
                            Simulated with sample data — nothing you do here is saved.{' '}
                            <Link href="/demo">Want the full store? Launch the live demo →</Link>
                        </p>
                    </div>
                    <DemoStyles />
                </section>
            )}

            {/* ── PAIN POINTS ────────────────────────────────────────── */}
            <section className="vq-section">
                <div className="vq-container">
                    <div className="vq-section-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">The gaps</span>
                        <h2 className="vq-h1 vq-mt-4">Where generic software falls short</h2>
                        <p className="vq-lede">The gaps that cost retailers money every day — and how VenQore closes them.</p>
                    </div>

                    <div className="vq-grid vq-grid--2">
                        {data.painPoints.map((item, i) => (
                            <article key={i} className="vq-card vq-card--xl vq-mkt-pain">
                                <div className="vq-mkt-pain__row vq-mkt-pain__row--problem">
                                    <span className="vq-mkt-pain__label"><X size={16} aria-hidden="true" /> Without VenQore</span>
                                    <p>{item.pain}</p>
                                </div>
                                <div className="vq-mkt-pain__row vq-mkt-pain__row--fix vq-mt-3">
                                    <span className="vq-mkt-pain__label"><CheckCircle2 size={16} aria-hidden="true" /> With VenQore</span>
                                    <p>{item.fix}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURE DEEP-DIVE CARDS ────────────────────────────── */}
            <section className="vq-section vq-section--alt">
                <div className="vq-container">
                    <div className="vq-section-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">What's included</span>
                        <h2 className="vq-h1 vq-mt-4">Every capability, shipped</h2>
                        <p className="vq-lede">Every capability below is shipped and live in VenQore today. No plugins, no add-ons.</p>
                    </div>

                    <div className="vq-grid vq-grid--3">
                        {data.features.map((feat, i) => {
                            const Icon = iconMap[feat.icon] || CheckCircle2;
                            return (
                                <div key={i} className="vq-card vq-card--xl vq-tile">
                                    <div className="vq-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                        <span className="vq-tile__icon"><Icon aria-hidden="true" /></span>
                                        {feat.tag && <span className="vq-badge vq-badge--success">{feat.tag}</span>}
                                    </div>
                                    <h3 className="vq-tile__title" style={{ fontSize: 20 }}>{feat.title}</h3>
                                    <p className="vq-tile__body">{feat.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── COMPARISON TABLE ───────────────────────────────────── */}
            <section className="vq-section">
                <div className="vq-container">
                    <div className="vq-section-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Side by side</span>
                        <h2 className="vq-h1 vq-mt-4">{data.comparisonTable.title}</h2>
                    </div>

                    <div className="vq-mkt-table-wrap">
                        <table className="vq-mkt-table">
                            <thead>
                                <tr>
                                    <th scope="col" style={{ width: '34%' }}>Feature</th>
                                    <th scope="col" className="is-us">VenQore</th>
                                    <th scope="col">Typical alternative</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.comparisonTable.rows.map((row, i) => (
                                    <tr key={i}>
                                        <th scope="row">{row.feature}</th>
                                        <td className="is-us">
                                            <span className="vq-row vq-gap-2" style={{ alignItems: 'flex-start' }}>
                                                <CheckCircle2 size={16} className="vq-cmp-tick" aria-hidden="true" />
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

            {/* ── FAQ ────────────────────────────────────────────────── */}
            <section className="vq-section vq-section--alt">
                <div className="vq-container vq-container--narrow">
                    <div className="vq-section-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">FAQ</span>
                        <h2 className="vq-h1 vq-mt-4">Frequently asked questions</h2>
                    </div>

                    <div className="vq-tools__faq">
                        {data.faqs.map((faq, i) => (
                            <div key={i} className="vq-tools__faq-item" data-open={openFaq === i ? 'true' : 'false'}>
                                <button
                                    type="button"
                                    id={`faq-${slug}-${i}`}
                                    onClick={() => toggleFaq(i)}
                                    className="vq-tools__faq-q"
                                    aria-expanded={openFaq === i}
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

            {/* ── CROSS-LINKS ────────────────────────────────────────── */}
            <section className="vq-section vq-section--tight">
                <div className="vq-container">
                    <div className="vq-section-head vq-section-head--center" style={{ marginBottom: 'var(--vq-space-8)' }}>
                        <h2 className="vq-h2">Explore related pages</h2>
                    </div>
                    <div className="vq-row vq-wrap vq-gap-3" style={{ justifyContent: 'center' }}>
                        {data.crossLinks.map((link, i) => (
                            <Link key={i} href={link.href} className="vq-chip">
                                {link.label} <ArrowRight size={14} aria-hidden="true" />
                            </Link>
                        ))}
                        <Link href="/features" className="vq-chip vq-chip--on">
                            All features <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── FINAL CTA ──────────────────────────────────────────── */}
            <section className="vq-section" style={{ paddingTop: 0 }}>
                <div className="vq-container">
                    <div className="vq-card vq-card--xl vq-mkt-cta">
                        <h2 className="vq-h1">Ready to see it for yourself?</h2>
                        <p className="vq-lede">
                            Walk into a fully loaded VenQore store — ring up sales, open the P&amp;L, check inventory.
                            No signup. Resets daily.
                        </p>
                        <div className="vq-row vq-wrap vq-gap-3 vq-mkt-cta__actions">
                            <Link href="/demo" className="vq-btn vq-btn--primary vq-btn--lg">
                                Try the live demo — no signup <ArrowRight size={16} className="vq-btn__arrow" aria-hidden="true" />
                            </Link>
                            <Link href="/build-workspace" className="vq-btn vq-btn--secondary vq-btn--lg">Start building</Link>
                        </div>
                        <p className="vq-caption vq-mt-6" style={{ marginInline: 'auto' }}>
                            Plans from $49/month (Starter) · $99/mo (Core) · $299/mo (Scale) · Free forever (Solo) · 14-day trial · Cancel anytime
                        </p>
                    </div>
                </div>
            </section>

            <RelatedPages title="Related reading" items={related} />
        </MarketingLayout>
    );
}

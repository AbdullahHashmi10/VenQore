import React from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { RefreshCw, ShoppingCart, Store, CheckCircle2, ArrowRight, Mail, Zap } from 'lucide-react';
import MarketingLayout, { RelatedPages, InlineLink } from './Shared/MarketingLayout';

/**
 * VenSynQ — coming-soon / SEO landing page (2026-07-03).
 * Target queries: "sync POS with WooCommerce/Amazon/eBay/TikTok", "multi-channel inventory sync".
 * Server-rendered meta + static HTML for this route live in app/Support/MarketingSeo.php.
 *
 * Now rendered inside MarketingLayout so it carries the site logo, minimal
 * header and full footer sitemap like every other marketing page.
 */
export default function VenSynQ() {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        email: '',
        interest: 'cloud',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/subscribe', { preserveScroll: true });
    };

    const channels = [
        { name: 'WooCommerce', status: 'LIVE', desc: 'Stock synced automatically; online orders become POS sales with correct COGS and a balanced journal entry.' },
        { name: 'Amazon', status: 'COMING SOON', desc: 'Marketplace listings, FBA-aware stock levels, settlement-ready accounting.' },
        { name: 'eBay', status: 'COMING SOON', desc: 'Listings and order import with SKU matching into the same single ledger.' },
        { name: 'TikTok Shop', status: 'COMING SOON', desc: 'Social commerce orders reconciled like any other sale — to the cent.' },
    ];

    return (
        <MarketingLayout
            title="VenSynQ — Sync Your POS with WooCommerce, Amazon, eBay & TikTok Shop"
            description="VenSynQ keeps one inventory and one ledger across your counter and every online channel. WooCommerce is live today; Amazon, eBay and TikTok Shop are next."
        >
            <div className="max-w-5xl mx-auto px-6 pt-32 md:pt-36 pb-20">
                {/* Hero */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sunken dark:bg-white/[0.04] border border-line dark:border-white/10 text-2xs font-bold tracking-[0.3em] uppercase mb-8">
                        <RefreshCw size={12} className="text-emerald-500 dark:text-emerald-400" />
                        <span className="text-ink-secondary">Multi-Channel Sync Engine</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-ink">
                        One Inventory. One Ledger.<br />
                        <span className="vq-headline-grad">Every Channel.</span>
                    </h1>
                    <p className="text-lg text-ink-secondary max-w-2xl mx-auto leading-relaxed">
                        VenSynQ connects your physical store's <InlineLink href="/features/point-of-sale">POS inventory</InlineLink> and{''}
                        <InlineLink href="/features/accounting">accounting</InlineLink> to your online channels — so a sale anywhere
                        updates stock and books everywhere.{''}
                        <span className="text-ink font-semibold">WooCommerce is live today.</span>{''}
                        Amazon, eBay and TikTok Shop are on the way.
                    </p>
                </div>

                {/* Channels */}
                <div className="grid md:grid-cols-2 gap-4 mb-16">
                    {channels.map((c) => (
                        <div key={c.name} className="p-6 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-bold text-ink">{c.name}</h2>
                                <span className={`text-3xs font-bold tracking-widest px-2.5 py-1 rounded-full ${c.status === 'LIVE' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-brand-500/15 text-brand-600 dark:text-brand-300'}`}>
                                    {c.status}
                                </span>
                            </div>
                            <p className="text-sm text-ink-secondary leading-relaxed">{c.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Why it's different */}
                <div className="mb-16 p-8 rounded-2xl bg-sunken dark:bg-white/[0.02] border border-line dark:border-white/10">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-ink">
                        <Zap size={20} className="text-amber-500 dark:text-amber-400" /> Why VenSynQ is different
                    </h2>
                    <ul className="space-y-3">
                        {[
                            <>Not just a stock mirror — every online order posts a balanced <InlineLink href="/features/accounting">double-entry journal</InlineLink> with real <InlineLink href="/features/inventory-management">FIFO cost of goods</InlineLink>.</>,
                            <>SKU-based matching with conflict detection, so the counter and the website never disagree. Generate clean codes with our free <InlineLink href="/tools/sku-generator">SKU generator</InlineLink>.</>,
                            <>Webhook signature verification on every inbound order — security first.</>,
                            <>One dashboard: physical tills and online channels reconciled in the same verified ledger. Ideal for <InlineLink href="/solutions/multi-store">multi-store operators</InlineLink>.</>,
                        ].map((t, i) => (
                            <li key={i} className="flex items-start gap-3 text-ink-secondary text-sm leading-relaxed">
                                <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" /> <span>{t}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Waitlist */}
                <div className="p-8 md:p-10 rounded-2xl bg-gradient-to-br from-brand-500/10 to-emerald-500/10 border border-brand-500/20 text-center">
                    <Mail size={28} className="mx-auto text-brand-500 dark:text-brand-300 mb-4" />
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 text-ink">Be first in when each channel opens.</h2>
                    <p className="text-ink-secondary mb-8 max-w-xl mx-auto text-sm leading-relaxed">
                        Join the VenSynQ waitlist — one email the moment Amazon, eBay or TikTok Shop sync goes
                        live. No spam, ever.
                    </p>
                    {wasSuccessful || flash?.success ? (
                        <p className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"><CheckCircle2 size={18} /> You're on the list — we'll email you at launch.</p>
                    ) : (
                        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <input
                                type="email"
                                required
                                aria-label="Email address"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="you@yourstore.com"
                                className="flex-1 px-5 py-3.5 rounded-xl bg-white dark:bg-white/[0.06] border border-line dark:border-white/10 text-ink placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                            />
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm tracking-wide transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                            >
                                Join Waitlist <ArrowRight size={15} />
                            </button>
                        </form>
                    )}
                    {errors.email && <p className="mt-3 text-xs text-rose-500 dark:text-rose-400 font-semibold">{errors.email}</p>}
                </div>
            </div>

            <RelatedPages
                title="Where to go next"
                items={[
                    { eyebrow: 'Feature', label: 'FIFO Inventory', href: '/features/inventory-management', desc: 'How VenQore costs every unit you sell, batch by batch.' },
                    { eyebrow: 'Feature', label: 'Real Accounting', href: '/features/accounting', desc: 'The double-entry ledger every synced order posts into.' },
                    { eyebrow: 'Solution', label: 'Multi-store', href: '/solutions/multi-store', desc: 'Run several branches and channels off one stock pool.' },
                    { eyebrow: 'Coming soon', label: 'SmartCapture', href: '/smartcapture', desc: 'Turn a photo or a sentence into a posted transaction.' },
                ]}
            />
        </MarketingLayout>
    );
}

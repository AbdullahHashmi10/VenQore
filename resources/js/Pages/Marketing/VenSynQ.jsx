import React from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, ArrowRight, Plug } from 'lucide-react';
import MarketingLayout, { RevealOnScroll, EntryLabel, Btn } from './Shared/MarketingLayout';

/**
 * VenSynQ — multi-channel sync engine page ("The Ledger" system, 2026-07-03).
 * Server-rendered meta + crawler HTML for this route live in app/Support/MarketingSeo.php.
 * Waitlist posts to /subscribe (NewsletterController) — unchanged.
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
            description="VenSynQ is VenQore's multi-channel sync engine: one inventory, one ledger, every marketplace. WooCommerce is live; Amazon, eBay and TikTok Shop are coming."
        >
            {/* Dark cover band */}
            <section className="relative pt-32 sm:pt-36 pb-16 sm:pb-20 px-6 overflow-hidden">
                <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(80% 65% at 50% 20%, rgba(30,126,130,0.26) 0%, rgba(7,22,20,0) 62%)' }} />
                <div className="relative max-w-3xl mx-auto text-center">
                    <p className="font-mono text-[11px] sm:text-xs tracking-[0.34em] uppercase text-[#7FE9CE] mb-7 inline-flex items-center gap-2.5">
                        <Plug size={13} aria-hidden="true" /> Multi-channel sync engine
                    </p>
                    <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.06] font-medium text-[#F5F2E9] mb-7">
                        One inventory. One ledger.<br />Every channel.
                    </h1>
                    <p className="text-[rgba(245,242,233,0.7)] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
                        VenSynQ connects your physical store&rsquo;s POS inventory and accounting to
                        your online channels — a sale anywhere updates stock and books everywhere.{' '}
                        <strong className="text-[#F5F2E9] font-semibold">WooCommerce is live today.</strong>{' '}
                        Amazon, eBay and TikTok Shop are on the bench.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Btn href="/demo" variant="primary" surface="dark">Try the live demo <ArrowRight size={16} aria-hidden="true" /></Btn>
                        <Btn href="#vensynq-waitlist" variant="ghost" surface="dark">Join the waitlist</Btn>
                    </div>
                </div>
            </section>

            {/* Paper body */}
            <div className="vq-paper-ruled text-[#0D211D] rounded-t-[2.5rem]">
                <section className="max-w-5xl mx-auto px-6 pt-20 pb-14">
                    <RevealOnScroll>
                        <EntryLabel number={1}>Channels</EntryLabel>
                    </RevealOnScroll>
                    <div className="grid md:grid-cols-2 gap-5">
                        {channels.map((c, i) => (
                            <RevealOnScroll key={c.name} delay={i * 0.05}>
                                <div className="h-full p-7 rounded-2xl bg-white/60 border border-[rgba(13,33,29,0.12)] transition-colors duration-300 hover:border-[#1E7E82]">
                                    <div className="flex items-center justify-between mb-3.5">
                                        <h2 className="font-display text-xl font-medium">{c.name}</h2>
                                        <span className={`font-mono text-[10px] tracking-[0.18em] px-3 py-1 rounded-full border ${c.status === 'LIVE'
                                            ? 'text-[#1E7E82] border-[rgba(30,126,130,0.35)] bg-[rgba(30,126,130,0.07)]'
                                            : 'text-[#C4A468] border-[rgba(196,164,104,0.4)] bg-[rgba(196,164,104,0.07)]'}`}>
                                            {c.status}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-[rgba(13,33,29,0.68)]">{c.desc}</p>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </section>

                <section className="max-w-5xl mx-auto px-6 py-14 vq-margin-rule">
                    <RevealOnScroll>
                        <EntryLabel number={2}>Why it&rsquo;s different</EntryLabel>
                        <h2 className="font-display text-3xl sm:text-4xl font-medium mb-8">Sync that keeps books,<br />not just counts.</h2>
                        <ul className="space-y-4 max-w-2xl">
                            {[
                                'Not a stock mirror — every online order posts a balanced double-entry journal with real FIFO cost of goods.',
                                'SKU-based matching with conflict detection, so the counter and the website never disagree.',
                                'Webhook signature verification on every inbound order — security first.',
                                'One dashboard: physical tills and online channels reconciled in the same verified ledger.',
                            ].map((t) => (
                                <li key={t} className="flex items-start gap-3 text-[15px] leading-relaxed text-[rgba(13,33,29,0.78)]">
                                    <CheckCircle2 size={17} className="text-[#1E7E82] mt-0.5 shrink-0" aria-hidden="true" /> {t}
                                </li>
                            ))}
                        </ul>
                    </RevealOnScroll>
                </section>

                {/* Waitlist */}
                <section id="vensynq-waitlist" className="max-w-3xl mx-auto px-6 py-16 sm:pb-24">
                    <RevealOnScroll>
                        <div className="rounded-2xl border border-[rgba(13,33,29,0.15)] bg-white/70 p-8 sm:p-10 text-center">
                            <EntryLabel className="justify-center">Waitlist</EntryLabel>
                            <h2 className="font-display text-2xl sm:text-3xl font-medium mb-3">Be first in when each channel opens.</h2>
                            <p className="text-[rgba(13,33,29,0.65)] mb-8 max-w-xl mx-auto text-sm leading-relaxed">
                                One email the moment Amazon, eBay or TikTok Shop sync goes live. No spam, ever.
                            </p>
                            {wasSuccessful || flash?.success ? (
                                <p className="inline-flex items-center gap-2 text-[#1E7E82] font-semibold">
                                    <CheckCircle2 size={18} aria-hidden="true" /> You&rsquo;re on the list — we&rsquo;ll email you at launch.
                                </p>
                            ) : (
                                <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                    <label htmlFor="vensynq-email" className="sr-only">Email address</label>
                                    <input
                                        id="vensynq-email"
                                        type="email"
                                        required
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="you@yourstore.com"
                                        className="flex-1 px-5 py-3.5 rounded-full bg-white border border-[rgba(13,33,29,0.2)] text-[#0D211D] placeholder-[rgba(13,33,29,0.4)] focus:outline-none focus:ring-2 focus:ring-[#1E7E82] text-sm"
                                    />
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-7 py-3.5 rounded-full bg-[#0D211D] hover:bg-[#1E7E82] text-[#F5F2E9] font-semibold text-sm transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E7E82]"
                                    >
                                        Join waitlist <ArrowRight size={15} aria-hidden="true" />
                                    </button>
                                </form>
                            )}
                            {errors.email && <p className="mt-3 text-xs text-[#a33d2f] font-semibold" role="alert">{errors.email}</p>}
                        </div>
                    </RevealOnScroll>
                </section>
            </div>
        </MarketingLayout>
    );
}

import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { RefreshCw, ShoppingCart, Store, CheckCircle2, ArrowRight, Mail, Zap } from 'lucide-react';

/**
 * VenSynQ — coming-soon / SEO landing page (2026-07-03).
 * Target queries: "sync POS with WooCommerce/Amazon/eBay/TikTok", "multi-channel inventory sync".
 * Server-rendered meta + static HTML for this route live in app/Support/MarketingSeo.php.
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
        <div className="min-h-screen bg-[#050510] text-white" style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}>
            <Head title="VenSynQ — Sync Your POS with WooCommerce, Amazon, eBay & TikTok Shop" />

            <div className="max-w-5xl mx-auto px-6 py-20">
                {/* Nav back */}
                <div className="mb-14 flex items-center justify-between">
                    <Link href="/" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">← VenQore</Link>
                    <Link href="/demo" className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Try the live demo →</Link>
                </div>

                {/* Hero */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-black tracking-[0.3em] uppercase mb-8">
                        <RefreshCw size={12} className="text-emerald-400" />
                        <span className="text-slate-300">Multi-Channel Sync Engine</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
                        One Inventory. One Ledger.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Every Channel.</span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        VenSynQ connects your physical store's POS inventory and accounting to your online
                        channels — so a sale anywhere updates stock and books everywhere.{' '}
                        <span className="text-white font-semibold">WooCommerce is live today.</span>{' '}
                        Amazon, eBay and TikTok Shop are on the way.
                    </p>
                </div>

                {/* Channels */}
                <div className="grid md:grid-cols-2 gap-4 mb-16">
                    {channels.map((c) => (
                        <div key={c.name} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-black">{c.name}</h2>
                                <span className={`text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full ${c.status === 'LIVE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-indigo-500/15 text-indigo-300'}`}>
                                    {c.status}
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">{c.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Why it's different */}
                <div className="mb-16 p-8 rounded-3xl bg-white/[0.02] border border-white/10">
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><Zap size={20} className="text-amber-400" /> Why VenSynQ is different</h2>
                    <ul className="space-y-3">
                        {[
                            'Not just a stock mirror — every online order posts a balanced double-entry journal with real FIFO cost of goods.',
                            'SKU-based matching with conflict detection, so the counter and the website never disagree.',
                            'Webhook signature verification on every inbound order — security first.',
                            'One dashboard: physical tills and online channels reconciled in the same verified ledger.',
                        ].map((t, i) => (
                            <li key={i} className="flex items-start gap-3 text-slate-300 text-sm leading-relaxed">
                                <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" /> {t}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Waitlist */}
                <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border border-indigo-500/20 text-center">
                    <Mail size={28} className="mx-auto text-indigo-300 mb-4" />
                    <h2 className="text-2xl md:text-3xl font-black mb-3">Be first in when each channel opens.</h2>
                    <p className="text-slate-400 mb-8 max-w-xl mx-auto text-sm leading-relaxed">
                        Join the VenSynQ waitlist — one email the moment Amazon, eBay or TikTok Shop sync goes
                        live. No spam, ever.
                    </p>
                    {wasSuccessful || flash?.success ? (
                        <p className="inline-flex items-center gap-2 text-emerald-400 font-bold"><CheckCircle2 size={18} /> You're on the list — we'll email you at launch.</p>
                    ) : (
                        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <input
                                type="email"
                                required
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="you@yourstore.com"
                                className="flex-1 px-5 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                            />
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-black text-sm tracking-wide transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                            >
                                Join Waitlist <ArrowRight size={15} />
                            </button>
                        </form>
                    )}
                    {errors.email && <p className="mt-3 text-xs text-rose-400 font-semibold">{errors.email}</p>}
                </div>

                {/* Footer links */}
                <div className="mt-16 text-center text-sm text-slate-500 space-x-4">
                    <Link href="/features" className="hover:text-white transition-colors">Features</Link>
                    <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                    <Link href="/smartcapture" className="hover:text-white transition-colors">SmartCapture</Link>
                    <Link href="/demo" className="hover:text-white transition-colors">Live Demo</Link>
                </div>
            </div>
        </div>
    );
}

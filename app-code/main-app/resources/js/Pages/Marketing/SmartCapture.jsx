import React from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Camera, Mic, ScanLine, CheckCircle2, ArrowRight, Mail, Sparkles } from 'lucide-react';
import MarketingLayout, { RelatedPages, InlineLink } from './Shared/MarketingLayout';

/**
 * SmartCapture — coming-soon / SEO landing page (2026-07-03).
 * Target queries: "convert scanned invoice to digital", "voice to invoice",
 * "photo of receipt into accounting". Server-rendered meta + static HTML for
 * this route live in app/Support/MarketingSeo.php.
 *
 * Now rendered inside MarketingLayout so it carries the site logo, minimal
 * header and full footer sitemap like every other marketing page.
 */
export default function SmartCapture() {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        email: '',
        interest: 'cloud',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/subscribe', { preserveScroll: true });
    };

    const steps = [
        { icon: Camera, title: '1 · Snap or speak', desc: 'Photograph any paper invoice or receipt — or just say it: "sold 5 bags of rice to Ali on credit".' },
        { icon: ScanLine, title: '2 · VenQore reads it', desc: 'Line items are extracted and matched to YOUR product catalog with confidence scores — not just a stored image.' },
        { icon: Sparkles, title: '3 · Review & post', desc: 'You confirm the draft. One tap posts it to the verified double-entry ledger with correct FIFO costing.' },
    ];

    return (
        <MarketingLayout
            title="SmartCapture — Turn Paper Invoices & Voice Notes into Digital Records"
            description="SmartCapture turns a photo of a supplier bill or a spoken voice note into a structured, reviewable transaction in VenQore — posted to a real double-entry ledger."
        >
            <div className="max-w-5xl mx-auto px-6 pt-32 md:pt-36 pb-20">
                {/* Hero */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/[0.04] dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-2xs font-black tracking-[0.3em] uppercase mb-8">
                        <Sparkles size={12} className="text-amber-500 dark:text-amber-400" />
                        <span className="text-slate-600 dark:text-slate-300">AI Input Layer · Coming Soon</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-slate-900 dark:text-white">
                        From Paper or Voice<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-rose-500 dark:from-amber-400 dark:to-rose-400">to Posted Books.</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        SmartCapture turns a photo of any supplier bill — or a spoken voice note — into a
                        structured digital transaction in VenQore.{' '}
                        <span className="text-slate-900 dark:text-white font-semibold">No more evening data entry.</span>
                    </p>
                </div>

                {/* How it works */}
                <div className="grid md:grid-cols-3 gap-4 mb-16">
                    {steps.map((s) => (
                        <div key={s.title} className="p-6 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.07] dark:border-white/10 text-center">
                            <s.icon size={24} className="mx-auto text-indigo-500 dark:text-indigo-300 mb-4" />
                            <h2 className="font-black mb-2 text-sm tracking-wide text-slate-900 dark:text-white">{s.title}</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>

                {/* What it handles */}
                <div className="mb-16 p-8 rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.02] border border-slate-900/[0.07] dark:border-white/10">
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-900 dark:text-white">
                        <Mic size={20} className="text-rose-500 dark:text-rose-400" /> Built for how shops actually work
                    </h2>
                    <ul className="space-y-3">
                        {[
                            <>Supplier bills and purchase receipts — scanned into editable line items with quantities and costs. Need one right now? Use the free <InlineLink href="/tools/invoice-generator">invoice generator</InlineLink>.</>,
                            <>Voice memos in plain language become drafted sales, purchases or expenses for your review.</>,
                            <>Every capture is matched against your real catalog and <InlineLink href="/features/inventory-management">FIFO cost history</InlineLink> before anything posts.</>,
                            <>Nothing skips the engine: confirmed captures post as balanced journal entries, like everything in <InlineLink href="/features/accounting">VenQore accounting</InlineLink>.</>,
                        ].map((t, i) => (
                            <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" /> <span>{t}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Waitlist */}
                <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-amber-500/10 to-rose-500/10 border border-amber-500/20 text-center">
                    <Mail size={28} className="mx-auto text-amber-500 dark:text-amber-300 mb-4" />
                    <h2 className="text-2xl md:text-3xl font-black mb-3 text-slate-900 dark:text-white">Be first in line when SmartCapture ships.</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto text-sm leading-relaxed">
                        It's in final testing now. Join the waitlist and you'll get one email at launch — plus
                        early-access pricing. No spam, ever.
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
                                className="flex-1 px-5 py-3.5 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                            />
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm tracking-wide transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
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
                    { eyebrow: 'Feature', label: 'Real Accounting', href: '/features/accounting', desc: 'The double-entry ledger every capture posts into.' },
                    { eyebrow: 'Feature', label: 'FIFO Inventory', href: '/features/inventory-management', desc: 'Cost history that makes scanned bills land correctly.' },
                    { eyebrow: 'Coming soon', label: 'VenSynQ', href: '/vensynq', desc: 'One inventory and one ledger across every sales channel.' },
                    { eyebrow: 'Free tool', label: 'Invoice Generator', href: '/tools/invoice-generator', desc: 'Make a clean invoice today, no account needed.' },
                ]}
            />
        </MarketingLayout>
    );
}

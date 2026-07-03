import React from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Camera, ScanLine, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import MarketingLayout, { RevealOnScroll, EntryLabel, Btn } from './Shared/MarketingLayout';

/**
 * SmartCapture — coming-soon page ("The Ledger" system, 2026-07-03).
 * Server-rendered meta + crawler HTML for this route live in app/Support/MarketingSeo.php.
 * Waitlist posts to /subscribe (NewsletterController) — unchanged.
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
        { icon: Camera, n: '01', title: 'Snap or speak', desc: 'Photograph any paper invoice or receipt — or just say it: “sold 5 bags of rice to Ali on credit”.' },
        { icon: ScanLine, n: '02', title: 'VenQore reads it', desc: 'Line items are extracted and matched to your product catalog with confidence scores — not just a stored image.' },
        { icon: Sparkles, n: '03', title: 'Review & post', desc: 'You confirm the draft. One tap posts it to the verified double-entry ledger with correct FIFO costing.' },
    ];

    return (
        <MarketingLayout
            title="SmartCapture — Turn Paper Invoices & Voice Notes into Digital Records"
            description="SmartCapture converts a photo of a supplier invoice or a spoken voice note into a structured, ledger-ready transaction inside VenQore. Coming soon — join the waitlist."
        >
            {/* Dark cover band */}
            <section className="relative pt-32 sm:pt-36 pb-16 sm:pb-20 px-6 overflow-hidden">
                <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(80% 65% at 50% 20%, rgba(30,126,130,0.26) 0%, rgba(7,22,20,0) 62%)' }} />
                <div className="relative max-w-3xl mx-auto text-center">
                    <p className="font-mono text-[11px] sm:text-xs tracking-[0.34em] uppercase text-[#C4A468] mb-7 inline-flex items-center gap-2.5">
                        <Sparkles size={13} aria-hidden="true" /> AI input layer · coming soon
                    </p>
                    <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.06] font-medium text-[#F5F2E9] mb-7">
                        From paper or voice<br />to posted books.
                    </h1>
                    <p className="text-[rgba(245,242,233,0.7)] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
                        SmartCapture turns a photo of any supplier bill — or a spoken voice note —
                        into a structured digital transaction in VenQore.{' '}
                        <strong className="text-[#F5F2E9] font-semibold">No more evening data entry.</strong>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Btn href="#smartcapture-waitlist" variant="primary" surface="dark">Join the waitlist <ArrowRight size={16} aria-hidden="true" /></Btn>
                        <Btn href="/demo" variant="ghost" surface="dark">Try the live demo</Btn>
                    </div>
                </div>
            </section>

            {/* Paper body */}
            <div className="vq-paper-ruled text-[#0D211D] rounded-t-[2.5rem]">
                <section className="max-w-5xl mx-auto px-6 pt-20 pb-14">
                    <RevealOnScroll>
                        <EntryLabel number={1}>How it works</EntryLabel>
                    </RevealOnScroll>
                    <div className="grid md:grid-cols-3 gap-5">
                        {steps.map((s, i) => (
                            <RevealOnScroll key={s.title} delay={i * 0.06}>
                                <div className="h-full p-7 rounded-2xl bg-white/60 border border-[rgba(13,33,29,0.12)] transition-colors duration-300 hover:border-[#1E7E82]">
                                    <div className="flex items-center justify-between mb-5">
                                        <s.icon size={21} className="text-[#1E7E82]" aria-hidden="true" />
                                        <span className="font-mono text-[13px] font-semibold text-[#C4A468]">{s.n}</span>
                                    </div>
                                    <h2 className="font-display text-xl font-medium mb-2.5">{s.title}</h2>
                                    <p className="text-sm leading-relaxed text-[rgba(13,33,29,0.68)]">{s.desc}</p>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </section>

                <section className="max-w-5xl mx-auto px-6 py-14 vq-margin-rule">
                    <RevealOnScroll>
                        <EntryLabel number={2}>Why it matters</EntryLabel>
                        <h2 className="font-display text-3xl sm:text-4xl font-medium mb-8">
                            Captured like magic.<br />Posted like accounting.
                        </h2>
                        <ul className="space-y-4 max-w-2xl">
                            {[
                                'Scan to invoice: supplier bills become editable line items, not stored images.',
                                'Voice to transaction: a spoken memo becomes a drafted sale for your review.',
                                'Catalog matching: recognized items map to your real products and cost history.',
                                'Ledger-ready: every capture posts as a balanced journal entry, like everything in VenQore.',
                            ].map((t) => (
                                <li key={t} className="flex items-start gap-3 text-[15px] leading-relaxed text-[rgba(13,33,29,0.78)]">
                                    <CheckCircle2 size={17} className="text-[#1E7E82] mt-0.5 shrink-0" aria-hidden="true" /> {t}
                                </li>
                            ))}
                        </ul>
                    </RevealOnScroll>
                </section>

                {/* Waitlist */}
                <section id="smartcapture-waitlist" className="max-w-3xl mx-auto px-6 py-16 sm:pb-24">
                    <RevealOnScroll>
                        <div className="rounded-2xl border border-[rgba(13,33,29,0.15)] bg-white/70 p-8 sm:p-10 text-center">
                            <EntryLabel className="justify-center">Waitlist</EntryLabel>
                            <h2 className="font-display text-2xl sm:text-3xl font-medium mb-3">Be first in when it ships.</h2>
                            <p className="text-[rgba(13,33,29,0.65)] mb-8 max-w-xl mx-auto text-sm leading-relaxed">
                                SmartCapture is in final testing. One email at launch — nothing else.
                            </p>
                            {wasSuccessful || flash?.success ? (
                                <p className="inline-flex items-center gap-2 text-[#1E7E82] font-semibold">
                                    <CheckCircle2 size={18} aria-hidden="true" /> You&rsquo;re on the list — we&rsquo;ll email you at launch.
                                </p>
                            ) : (
                                <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                    <label htmlFor="smartcapture-email" className="sr-only">Email address</label>
                                    <input
                                        id="smartcapture-email"
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

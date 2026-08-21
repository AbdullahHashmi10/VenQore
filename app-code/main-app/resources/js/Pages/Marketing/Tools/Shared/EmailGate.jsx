import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Mail } from 'lucide-react';

/**
 * EmailGate — the shared capture modal for gated deliverables (bulk exports,
 * PDF reports, benchmark comparisons, etc).
 *
 * HARD RULES (plan §6.1, §6.2, §15.2):
 *  - Only ever shown for volume/branding/portability upgrades, NEVER for the
 *    core single-item output of a tool. Callers are responsible for only
 *    invoking this when the user has crossed a real gate threshold.
 *  - The marketing checkbox is UNCHECKED by default and uses the exact
 *    approved wording below. Do not reword without a plan update.
 *  - Posts to tools.lead.store, which always sends the requested deliverable
 *    regardless of the checkbox (see ToolLeadService::capture two-track model).
 */
export default function EmailGate({ open, onClose, toolSlug, toolName, deliverable, context = {}, onSuccess, title, subtitle }) {
    const [submitted, setSubmitted] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        name: '',
        marketing_consent: false,
        tool_slug: toolSlug,
        tool_name: toolName,
        deliverable: deliverable || null,
        context,
    });

    if (!open) return null;

    const submit = (e) => {
        e.preventDefault();
        post('/tools/lead', {
            preserveScroll: true,
            onSuccess: () => {
                setSubmitted(true);
                // Hand control back to the caller so the file downloads
                // immediately — the user asked for a file, so they get the
                // file. The email is captured, not held over their head.
                onSuccess?.();
            },
        });
    };

    const handleClose = () => {
        setSubmitted(false);
        reset();
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-drawer flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={handleClose}>
            <div
                className="w-full max-w-md rounded-2xl bg-neutral-950 border border-line dark:border-white/10 p-8 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={handleClose} className="absolute top-5 right-5 text-ink-muted hover:text-white transition-colors" aria-label="Close">
                    <X size={20} />
                </button>

                {!submitted ? (
                    <>
                        <div className="w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-400/20 flex items-center justify-center mb-5">
                            <Mail size={20} className="text-brand-300" />
                        </div>
                        <h3 className="text-xl font-bold text-ink mb-2">{title || 'Where should we send it?'}</h3>
                        <p className="text-sm text-ink-muted mb-6">
                            {subtitle || "Your PDF downloads straight away — we'll email you a copy so you can find it later."}
                        </p>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <input
                                    type="email"
                                    required
                                    placeholder="you@company.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-line dark:border-white/10 text-ink placeholder-slate-500 text-sm focus:outline-none focus:border-brand-400/50"
                                />
                                {errors.email && <p className="text-xs text-red-400 mt-1.5">{errors.email}</p>}
                            </div>

                            <div>
                                <input
                                    type="text"
                                    placeholder="Name (optional)"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-line dark:border-white/10 text-ink placeholder-slate-500 text-sm focus:outline-none focus:border-brand-400/50"
                                />
                            </div>

                            {/* Marketing checkbox — UNCHECKED by default. Do not change. (plan §15.2) */}
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.marketing_consent}
                                    onChange={(e) => setData('marketing_consent', e.target.checked)}
                                    className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-brand-500"
                                />
                                <span className="text-xs text-ink-muted leading-relaxed">
                                    Also send me occasional retail and POS tips from VenQore. No spam, unsubscribe anytime.
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 bg-white text-void-900 rounded-xl text-sm font-bold uppercase tracking-wide transition-transform disabled:opacity-50 disabled:"
                            >
                                {processing ? 'Sending…' : 'Download my PDF'}
                            </button>

                            <p className="text-1xs text-ink-secondary text-center leading-relaxed">
                                We'll email your file right away. We never sell your data.{''}
                                <a href="/privacy" className="underline hover:text-ink-muted">Privacy Policy</a>
                            </p>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mx-auto mb-5">
                            <Mail size={22} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-ink mb-2">Check your email</h3>
                        <p className="text-sm text-ink-muted mb-6">
                            We've sent your file to {data.email}.
                        </p>
                        <button
                            onClick={handleClose}
                            className="px-6 py-2.5 bg-white/[0.06] border border-white/15 text-ink rounded-full text-sm font-bold hover:bg-white/[0.1] transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

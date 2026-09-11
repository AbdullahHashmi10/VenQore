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
        <div className="vq-gate" onClick={handleClose}>
            <div
                className="vq-gate__card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="vq-gate-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button type="button" onClick={handleClose} className="vq-gate__close" aria-label="Close">
                    <X size={20} />
                </button>

                {!submitted ? (
                    <>
                        <div className="vq-tile__icon" aria-hidden="true">
                            <Mail size={20} />
                        </div>
                        <h3 id="vq-gate-title" className="vq-h3 vq-mt-2">{title || 'Where should we send it?'}</h3>
                        <p className="vq-small vq-text-2 vq-mt-2">
                            {subtitle || "Your PDF downloads straight away — we'll email you a copy so you can find it later."}
                        </p>

                        <form onSubmit={submit} className="vq-gate__form">
                            <div className="vq-field">
                                <label htmlFor="vq-gate-email" className="vq-label">Email</label>
                                <input
                                    id="vq-gate-email"
                                    type="email"
                                    required
                                    placeholder="you@company.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="vq-input"
                                />
                                {errors.email && <p className="vq-gate__error">{errors.email}</p>}
                            </div>

                            <div className="vq-field">
                                <label htmlFor="vq-gate-name" className="vq-label">Name <span className="vq-text-3">(optional)</span></label>
                                <input
                                    id="vq-gate-name"
                                    type="text"
                                    placeholder="Your name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="vq-input"
                                />
                            </div>

                            {/* Marketing checkbox — UNCHECKED by default. Do not change. (plan §15.2) */}
                            <label className="vq-gate__consent">
                                <input
                                    type="checkbox"
                                    checked={data.marketing_consent}
                                    onChange={(e) => setData('marketing_consent', e.target.checked)}
                                />
                                <span>
                                    Also send me occasional retail and POS tips from VenQore. No spam, unsubscribe anytime.
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={processing}
                                className="vq-btn vq-btn--primary vq-btn--lg vq-btn--block"
                            >
                                {processing ? 'Sending…' : 'Download my PDF'}
                            </button>

                            <p className="vq-caption vq-center" style={{ marginInline: 'auto' }}>
                                We'll email your file right away. We never sell your data.{' '}
                                <a href="/privacy">Privacy Policy</a>
                            </p>
                        </form>
                    </>
                ) : (
                    <div className="vq-center" style={{ paddingBlock: 'var(--vq-space-4)' }}>
                        <div className="vq-gate__done" aria-hidden="true">
                            <Mail size={22} />
                        </div>
                        <h3 id="vq-gate-title" className="vq-h3">Check your email</h3>
                        <p className="vq-small vq-text-2 vq-mt-2" style={{ marginInline: 'auto' }}>
                            We've sent your file to {data.email}.
                        </p>
                        <button type="button" onClick={handleClose} className="vq-btn vq-btn--secondary vq-mt-6">
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import MarketingLayout, {
    RevealOnScroll, MagneticButton, SectionLabel
} from './Shared/MarketingLayout';
import { Mail, Send, CheckCircle2, Loader2 } from 'lucide-react';
import useTurnstile from '@/Components/Builder/useTurnstile';

export default function Newsletter() {
    const getTurnstileToken = useTurnstile();
    const { data, setData, post, processing, errors, reset, wasSuccessful, transform } = useForm({
        name: '',
        email: '',
        interest: 'cloud',
    });

    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const turnstileToken = await getTurnstileToken();
        transform((d) => (turnstileToken ? { ...d, 'cf-turnstile-response': turnstileToken } : d));
        post(route('marketing.newsletter.submit'), {
            onSuccess: () => {
                setSubmitted(true);
                reset();
            }
        });
    };

    const options = [
        { id: 'cloud', label: 'Cloud Updates', desc: 'New updates on the Cloud Website' },
        { id: 'digital', label: 'Digital Products', desc: 'Digital products only (Offline standalones)' },
        { id: 'both', label: 'Both channels', desc: 'Get updates on both systems' }
    ];

    return (
        <MarketingLayout
            title="Newsletter Subscription — VenQore"
            description="Subscribe to the VenQore Master Operation Suite newsletter to receive product updates, scaling strategies, and offline module blueprints."
        >
            <section className="vq-section vq-mc-top">
                <div className="vq-amb" aria-hidden="true"><span className="vq-amb__aurora" style={{ opacity: 0.22 }} /></div>
                <div className="vq-container" style={{ position: 'relative' }}>
                    <div className="vq-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 'clamp(40px, 6vw, 88px)', alignItems: 'start' }}>
                        <RevealOnScroll>
                            <div className="vq-mc-head">
                                <SectionLabel icon={Mail}>Stay Ahead</SectionLabel>
                                <h1 className="vq-display">Subscribe to <em className="vq-italic">VenQore Insights.</em></h1>
                                <p className="vq-lede vq-mt-6">
                                    Get direct notifications about standalone offline releases, exclusive Etsy coupon updates, and enterprise database schemas.
                                </p>
                            </div>
                        </RevealOnScroll>

                        <RevealOnScroll delay={0.1}>
                            <div className="vq-card vq-card--xl" style={{ padding: 'clamp(28px, 4vw, 40px)', boxShadow: 'var(--vq-elev-2)' }}>
                                {submitted ? (
                                    <div className="vq-center" style={{ paddingBlock: 'var(--vq-space-8)' }}>
                                        <span className="vq-mc-icon vq-mc-icon--lg vq-mc-icon--round" style={{ '--tone': 'var(--vq-success)' }}>
                                            <CheckCircle2 size={30} aria-hidden="true" />
                                        </span>
                                        <h2 className="vq-h2 vq-mt-6">Check your inbox</h2>
                                        <p className="vq-body vq-text-2 vq-mt-3" style={{ marginInline: 'auto', maxWidth: '40ch' }}>
                                            Click the confirmation link we sent before we add you to the newsletter.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setSubmitted(false)}
                                            className="vq-btn vq-btn--quiet vq-mt-6"
                                        >
                                            Subscribe another email
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit}>
                                        {/* Name Input */}
                                        <div className="vq-mc-field">
                                            <label htmlFor="newsletter-name" className="vq-mc-label">Your Name</label>
                                            <input
                                                id="newsletter-name"
                                                type="text"
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                placeholder="John Doe"
                                                className="vq-input"
                                                autoComplete="name"
                                            />
                                            {errors.name && <p className="vq-mc-error">{errors.name}</p>}
                                        </div>

                                        {/* Email Input */}
                                        <div className="vq-mc-field">
                                            <label htmlFor="newsletter-email" className="vq-mc-label">
                                                Email Address <span className="req">*</span>
                                            </label>
                                            <input
                                                id="newsletter-email"
                                                type="email"
                                                required
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                                placeholder="john@example.com"
                                                className="vq-input"
                                                autoComplete="email"
                                            />
                                            {errors.email && <p className="vq-mc-error">{errors.email}</p>}
                                        </div>

                                        {/* Preference Selector Cards */}
                                        <div className="vq-mc-field" role="group" aria-labelledby="newsletter-interest">
                                            <div id="newsletter-interest" className="vq-mc-label">Get updates for</div>
                                            <div className="vq-mc-options">
                                                {options.map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => setData('interest', opt.id)}
                                                        className="vq-mc-option"
                                                        aria-pressed={data.interest === opt.id}
                                                    >
                                                        <span className="vq-mc-option__radio" aria-hidden="true" />
                                                        <span>
                                                            <span className="vq-mc-option__label">{opt.label}</span>
                                                            <span className="vq-mc-option__desc">{opt.desc}</span>
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                            {errors.interest && <p className="vq-mc-error">{errors.interest}</p>}
                                        </div>

                                        <div className="vq-mt-8">
                                            <MagneticButton
                                                type="submit"
                                                disabled={processing}
                                                variant="primary"
                                                className="vq-btn--lg vq-btn--block"
                                                style={{ opacity: processing ? 0.6 : undefined }}
                                            >
                                                {processing ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        Subscribe Now
                                                        <span className="vq-btn__arrow"><Send size={16} aria-hidden="true" /></span>
                                                    </>
                                                )}
                                            </MagneticButton>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}

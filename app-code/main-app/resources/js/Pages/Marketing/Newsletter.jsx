import React, { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import MarketingLayout, {
    RevealOnScroll, MagneticButton, SectionLabel, GlassCard
} from './Shared/MarketingLayout';
import { Mail, Send, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

export default function Newsletter() {
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
        name: '',
        email: '',
        interest: 'cloud',
    });

    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('marketing.newsletter.submit'), {
            onSuccess: () => {
                setSubmitted(true);
                reset();
            }
        });
    };

    return (
        <MarketingLayout
            title="Newsletter Subscription — VenQore"
            description="Subscribe to the VenQore Master Operation Suite newsletter to receive product updates, scaling strategies, and offline module blueprints."
        >
            <section className="relative pt-40 pb-24 px-6 min-h-[85vh] flex items-center justify-center">
                {/* Visual background accents */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />

                <div className="max-w-xl w-full mx-auto relative z-10">
                    <RevealOnScroll>
                        <div className="text-center mb-8">
                            <SectionLabel icon={Mail}>Stay Ahead</SectionLabel>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mt-4 mb-4 font-display">
                                <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">Subscribe to</span>{''}
                                <span className="bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent vq-text-glow">VenQore Insights.</span>
                            </h1>
                            <p className="text-ink-muted text-sm md:text-base max-w-md mx-auto leading-relaxed">
                                Get direct notifications about standalone offline releases, exclusive Etsy coupon updates, and enterprise database schemas.
                            </p>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={0.1}>
                        <GlassCard className="p-8 border border-white/[0.06] bg-neutral-900/40 backdrop-blur-xl rounded-xl shadow-2xl relative">
                            {submitted ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-ink mb-2">You're on the list!</h3>
                                    <p className="text-ink-muted text-sm leading-relaxed mb-6">
                                        We've registered your subscription. Keep an eye on your inbox for our upcoming releases.
                                    </p>
                                    <button
                                        onClick={() => setSubmitted(false)}
                                        className="text-brand-600 dark:text-brand-400 font-semibold text-xs tracking-wider uppercase hover:text-brand-300 transition-colors"
                                    >
                                        Subscribe another email
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name Input */}
                                    <div className="relative group">
                                        <label className="block text-2xs font-bold uppercase tracking-[0.25em] mb-3 text-ink-muted group-focus-within:text-brand-400 transition-colors">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 focus:border-brand-500/40 focus:bg-brand-500/[0.03] rounded-2xl text-white text-sm outline-none transition-all duration-slower"
                                        />
                                        {errors.name && (
                                            <p className="text-red-400 text-xs mt-2 font-medium">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Email Input */}
                                    <div className="relative group">
                                        <label className="block text-2xs font-bold uppercase tracking-[0.25em] mb-3 text-ink-muted group-focus-within:text-brand-400 transition-colors">
                                            Email Address <span className="text-brand-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            placeholder="john@example.com"
                                            className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 focus:border-brand-500/40 focus:bg-brand-500/[0.03] rounded-2xl text-white text-sm outline-none transition-all duration-slower"
                                        />
                                        {errors.email && (
                                            <p className="text-red-400 text-xs mt-2 font-medium">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* Preference Selector Cards */}
                                    <div className="space-y-3">
                                        <label className="block text-2xs font-bold uppercase tracking-[0.25em] text-ink-muted">
                                            Get updates for
                                        </label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                { id: 'cloud', label: 'Cloud Updates', desc: 'New updates on the Cloud Website' },
                                                { id: 'digital', label: 'Digital Products', desc: 'Digital products only (Offline standalones)' },
                                                { id: 'both', label: 'Both channels', desc: 'Get updates on both systems' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setData('interest', opt.id)}
                                                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-slow flex flex-col gap-1 ${
                                                        data.interest === opt.id
                                                            ? 'bg-brand-500/10 border-brand-500/40 text-white shadow-lg'
                                                            : 'bg-white/[0.02] border-white/[0.06] text-ink-muted hover:border-white/10 hover:bg-white/[0.04]'
                                                    }`}
                                                >
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${data.interest === opt.id ? 'text-brand-400' : 'text-neutral-200'}`}>
                                                        {opt.label}
                                                    </span>
                                                    <span className="text-1xs leading-relaxed opacity-85">{opt.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {errors.interest && (
                                            <p className="text-red-400 text-xs mt-2 font-medium">{errors.interest}</p>
                                        )}
                                    </div>


                                    <MagneticButton
                                        type="submit"
                                        disabled={processing}
                                        variant="indigo"
                                        className="w-full h-14 rounded-2xl font-bold text-sm tracking-[0.15em] uppercase flex items-center justify-center gap-3 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Subscribe Now
                                                <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </MagneticButton>
                                </form>
                            )}
                        </GlassCard>
                    </RevealOnScroll>
                </div>
            </section>
        </MarketingLayout>
    );
}

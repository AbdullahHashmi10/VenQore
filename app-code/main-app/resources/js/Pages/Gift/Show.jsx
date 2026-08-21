import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Gift, Sparkles, ArrowRight, CheckCircle2, Clock, LogIn } from 'lucide-react';

/**
 * Gift/Show.jsx — public "You've been gifted..." acceptance page.
 *
 * Reached via /gift/{token}. Anyone can view this without logging in.
 * Clicking Accept either:
 *   - submits directly (if already logged in), or
 *   - is disabled with a "Log in / Register to accept" prompt that sends
 *     them into the normal auth flow, which round-trips back here via
 *     GiftRedirect once they're authenticated.
 */
export default function GiftShow({
    token, plan_name, plan_description, duration_label, label,
    is_authenticated, already_redeemed_by_me,
}) {
    const { post, processing } = useForm({});

    // This page is public, so it renders for visitors with no Ziggy route data
    // and no session. Building URLs with route() at render time threw and took
    // the whole page down with a blank "Cannot convert undefined or null to
    // object" — a gift link that crashes is worse than no gift link, so every
    // URL here is a plain string with route() only as an enhancement.
    const url = (name, fallback) => {
        try {
            return typeof route === 'function' ? route(name) : fallback;
        } catch {
            return fallback;
        }
    };

    const acceptUrl   = `/gift/${encodeURIComponent(token ?? '')}`;
    const registerUrl = url('register', '/register');
    const loginUrl    = url('login', '/login');

    const accept = (e) => {
        e.preventDefault();
        post(acceptUrl);
    };

    // A grant whose plan row was deleted would otherwise render "undefined".
    const planLabel     = plan_name || 'VenQore Access';
    const durationText  = duration_label || 'a limited time';

    return (
        <div className="min-h-screen bg-void-950 text-white font-sans flex items-center justify-center p-8">
            {/* The title MUST be a single string child.
                Inertia's <Head> serialises children itself, and its walker calls
                Object.keys(child.props) on each one. Mixing literal text with an
                expression — <title>Gifted — {planLabel}</title> — compiles to TWO
                children, so the walker recurses into a raw string, whose .props
                is undefined, and Object.keys(undefined) throws. That killed the
                whole page render, which is the blank gift page.
                Interpolating into one template literal keeps it a single child. */}
            <Head title={`You've Been Gifted VenQore — ${planLabel}`} />

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[120px]" />
                </div>
            </div>

            <div className="relative z-10 max-w-xl w-full text-center">
                <div className="w-24 h-24 mx-auto rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-4xl mb-8 shadow-2xl">
                    🎁
                </div>

                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-brand-500/10 border border-brand-500/20 text-brand-400 uppercase tracking-widest">
                    You've Been Gifted
                </span>

                <h1 className="text-4xl font-bold mt-4 mb-3 tracking-tight">
                    {planLabel}
                    <br />
                    <span className="bg-gradient-to-r from-brand-400 to-purple-500 bg-clip-text text-transparent">
                        for {durationText}
                    </span>
                </h1>

                {plan_description && (
                    <p className="text-ink-muted text-lg mb-8 leading-relaxed">{plan_description}</p>
                )}

                {label && (
                    <p className="text-ink-secondary text-sm mb-6 italic">"{label}"</p>
                )}

                {already_redeemed_by_me ? (
                    <div className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                        <CheckCircle2 size={20} /> You've already accepted this gift.
                    </div>
                ) : (
                    <form onSubmit={accept}>
                        {is_authenticated ? (
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white font-bold text-base transition-all hover:shadow-lg hover: disabled:opacity-60"
                            >
                                <Sparkles size={18} />
                                {processing ? 'Applying your gift…' : 'Accept Gift'}
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <a
                                    href={registerUrl}
                                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white font-bold text-base transition-all"
                                >
                                    <Sparkles size={18} /> Create Account &amp; Accept Gift
                                </a>
                                <a
                                    href={loginUrl}
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 font-bold text-sm transition-all"
                                >
                                    <LogIn size={15} /> Already have an account? Log in
                                </a>
                            </div>
                        )}
                    </form>
                )}

                <p className="text-ink-secondary text-xs mt-8 flex items-center justify-center gap-1.5">
                    <Clock size={12} /> Your access starts the moment you accept.
                </p>
            </div>
        </div>
    );
}

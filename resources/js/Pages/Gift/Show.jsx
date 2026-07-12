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

    const accept = (e) => {
        e.preventDefault();
        post(route('gift.accept', { token }));
    };

    return (
        <div className="min-h-screen bg-[#020010] text-white font-sans flex items-center justify-center p-8">
            <Head><title>You've Been Gifted VenQore — {plan_name}</title></Head>

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
                </div>
            </div>

            <div className="relative z-10 max-w-xl w-full text-center">
                <div className="w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-4xl mb-8 shadow-2xl">
                    🎁
                </div>

                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-widest">
                    You've Been Gifted
                </span>

                <h1 className="text-4xl font-black mt-4 mb-3 tracking-tight">
                    {plan_name}
                    <br />
                    <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                        for {duration_label}
                    </span>
                </h1>

                {plan_description && (
                    <p className="text-slate-400 text-lg mb-8 leading-relaxed">{plan_description}</p>
                )}

                {label && (
                    <p className="text-slate-600 text-sm mb-6 italic">"{label}"</p>
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
                                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-base transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-60"
                            >
                                <Sparkles size={18} />
                                {processing ? 'Applying your gift…' : 'Accept Gift'}
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <a
                                    href={route('register')}
                                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-base transition-all hover:scale-[1.02]"
                                >
                                    <Sparkles size={18} /> Create Account &amp; Accept Gift
                                </a>
                                <a
                                    href={route('login')}
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-sm transition-all"
                                >
                                    <LogIn size={15} /> Already have an account? Log in
                                </a>
                            </div>
                        )}
                    </form>
                )}

                <p className="text-slate-700 text-xs mt-8 flex items-center justify-center gap-1.5">
                    <Clock size={12} /> Your access starts the moment you accept.
                </p>
            </div>
        </div>
    );
}

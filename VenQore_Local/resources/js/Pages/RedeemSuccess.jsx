import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Crown, ArrowRight, Copy, ExternalLink, Zap, Sparkles } from 'lucide-react';

/**
 * RedeemSuccess.jsx — Phase 7
 *
 * Shown after a successful AppSumo code redemption.
 * Shows what plan was activated, how many codes are stacked,
 * and a direct link to the tenant's subdomain.
 */
export default function RedeemSuccess({ type, plan, description, codes_used, subdomain, login_url }) {
    const planColor = {
        ltd_1: 'from-slate-400 to-slate-600',
        ltd_2: 'from-indigo-400 to-purple-500',
        ltd_3: 'from-amber-400 to-orange-500',
    }[plan] || 'from-indigo-400 to-purple-500';

    const planEmoji = { ltd_1: '⚡', ltd_2: '🚀', ltd_3: '👑' }[plan] || '✨';

    const nextTierMessage = codes_used < 3
        ? `Stack ${3 - codes_used} more code${3 - codes_used > 1 ? 's' : ''} to upgrade to ${codes_used + 1 === 2 ? 'Growth' : 'Business'} plan.`
        : 'You have the maximum 3 codes stacked — Business plan unlocked. 🎉';

    return (
        <div className="min-h-screen bg-[#020010] text-white font-sans flex items-center justify-center p-8">
            <Head><title>License Activated — VenQore</title></Head>

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
                </div>
                <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            <div className="relative z-10 max-w-xl w-full text-center">
                {/* Success icon */}
                <div className={`w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br ${planColor} flex items-center justify-center text-4xl mb-8 shadow-2xl animate-bounce`}>
                    {planEmoji}
                </div>

                {/* Headline */}
                <div className="mb-2">
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-widest">
                        {type === 'stacked' ? 'Plan Upgraded' : 'License Activated'}
                    </span>
                </div>
                <h1 className="text-4xl font-black mt-4 mb-3 tracking-tight">
                    {type === 'stacked' ? 'Code Stacked Successfully!' : 'Welcome to VenQore!'}
                </h1>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                    Your lifetime license is active.
                    <br />
                    <span className={`font-bold bg-gradient-to-r ${planColor} bg-clip-text text-transparent`}>
                        {description}
                    </span>
                </p>

                {/* Codes stacked indicator */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    {[1, 2, 3].map((n) => (
                        <div
                            key={n}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black border-2 transition-all ${
                                n <= codes_used
                                    ? `bg-gradient-to-br ${planColor} border-transparent text-white shadow-lg`
                                    : 'bg-white/5 border-white/10 text-slate-600'
                            }`}
                        >
                            {n}
                        </div>
                    ))}
                </div>
                <p className="text-slate-500 text-xs mb-10">{nextTierMessage}</p>

                {/* CTA */}
                <div className="space-y-4">
                    <a
                        href={login_url}
                        id="success-goto-dashboard"
                        className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-base transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25"
                    >
                        <Sparkles size={18} />
                        {type === 'new' ? 'Set Up My Store' : 'Go to Dashboard'}
                        <ArrowRight size={16} />
                    </a>

                    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-400">
                        <ExternalLink size={13} className="shrink-0 text-slate-500" />
                        <span className="truncate text-slate-500">{login_url}</span>
                    </div>
                </div>

                <p className="text-slate-700 text-xs mt-8">
                    Bookmark your store URL. Your store lives at{' '}
                    <span className="text-slate-500">{subdomain}.venqore.com</span>
                </p>
            </div>
        </div>
    );
}

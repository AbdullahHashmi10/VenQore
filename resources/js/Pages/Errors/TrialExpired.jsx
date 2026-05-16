import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Clock, CreditCard, ArrowRight, Tag } from 'lucide-react';


/**
 * Errors/TrialExpired.jsx — Definitive Plan
 *
 * Shown when a trial store reaches its trial_ends_at date.
 * TenantMiddleware changes status to 'suspended' and redirects here.
 */
export default function TrialExpired() {
    const { store } = usePage().props;

    return (
        <div className="min-h-screen bg-[#02000f] text-white font-sans flex items-center justify-center p-6">
            <Head title="Trial Expired — VenQore" />

            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-amber-900/10 rounded-full blur-[140px]" />
            </div>

            <div className="relative z-10 w-full max-w-lg text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
                    <Clock size={28} className="text-amber-400" />
                </div>

                <h1 className="text-2xl font-black text-white mb-2">Your Trial Has Ended</h1>
                <p className="text-slate-400 text-sm mb-8">
                    Your 14-day free trial has expired. Upgrade to a plan to continue using VenQore,
                    or redeem an AppSumo code if you purchased a lifetime license.
                </p>

                <div className="rounded-2xl border border-white/10 bg-white/3 p-6 mb-6">
                    <div className="grid grid-cols-3 gap-3 mb-5 text-left">
                        <PlanCard plan="Starter" price="$12" color="slate" features={['Everything in trial', '3 staff', '1 warehouse']} />
                        <PlanCard plan="Growth" price="$24" color="indigo" features={['10 staff', '3 warehouses', 'AI Engine']} badge="Popular" />
                        <PlanCard plan="Business" price="$49" color="purple" features={['Unlimited staff', 'API access', 'White-label']} />
                    </div>

                    {store && (
                        <Link
                            href={route('store.billing', { store_slug: store.slug })}
                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl
                                bg-gradient-to-r from-indigo-500 to-purple-600
                                hover:from-indigo-400 hover:to-purple-500
                                text-white font-bold transition-all hover:scale-[1.02]"
                        >
                            <CreditCard size={16} /> Upgrade Now <ArrowRight size={14} />
                        </Link>
                    )}
                </div>

                <p className="text-slate-500 text-sm">
                    Have an AppSumo code?{' '}
                    <Link href={route('redeem')} className="text-orange-400 hover:text-orange-300 inline-flex items-center gap-1">
                        <Tag size={13} /> Redeem lifetime access
                    </Link>
                </p>

                <div className="flex items-center justify-center gap-4 mt-6">
                    <Link href={route('hub')} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                        Switch store
                    </Link>
                    <Link href={route('logout')} method="delete" as="button" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                        Sign out
                    </Link>
                </div>
            </div>
        </div>
    );
}

function PlanCard({ plan, price, color, features, badge }) {
    const colors = {
        slate:  { header: 'bg-slate-500/10 border-slate-500/20 text-slate-300', dot: 'bg-slate-400' },
        indigo: { header: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300', dot: 'bg-indigo-400' },
        purple: { header: 'bg-purple-500/10 border-purple-500/20 text-purple-300', dot: 'bg-purple-400' },
    };
    const cfg = colors[color];
    return (
        <div className={`rounded-xl border p-3 relative ${cfg.header}`}>
            {badge && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-indigo-500 text-[10px] font-bold text-white whitespace-nowrap">
                    {badge}
                </div>
            )}
            <p className="text-xs font-bold mb-0.5">{plan}</p>
            <p className="text-lg font-black mb-2">{price}<span className="text-xs font-normal opacity-60">/mo</span></p>
            {features.map(f => (
                <div key={f} className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                    {f}
                </div>
            ))}
        </div>
    );
}

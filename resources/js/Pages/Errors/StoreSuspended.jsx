import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PauseCircle, CreditCard, ArrowRight, LogOut } from 'lucide-react';

/**
 * Errors/StoreSuspended.jsx — Definitive Plan
 *
 * Shown by TenantMiddleware when a store's status is 'suspended' or 'cancelled'.
 * Owners see billing CTA, non-owners see "contact owner" message.
 */
export default function StoreSuspended({ store_name, plan, billing_url }) {
    return (
        <div className="min-h-screen bg-[#02000f] text-white font-sans flex items-center justify-center p-6">
            <Head title="Store Suspended — VenQore" />

            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[140px]" />
            </div>

            <div className="relative z-10 w-full max-w-md text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
                    <PauseCircle size={28} className="text-red-400" />
                </div>

                <h1 className="text-2xl font-black text-white mb-2">Store Suspended</h1>
                <p className="text-slate-400 text-sm mb-2">
                    <strong className="text-white">{store_name}</strong> has been suspended.
                </p>
                <p className="text-slate-500 text-xs mb-8">
                    This usually happens when a trial expires or a payment fails.
                    Please update your billing to restore access.
                </p>

                <div className="space-y-3">
                    {billing_url && (
                        <a
                            href={billing_url}
                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold transition-all hover:scale-[1.02]"
                        >
                            <CreditCard size={16} />
                            Update Billing
                            <ArrowRight size={14} />
                        </a>
                    )}

                    <Link
                        href={route('hub')}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
                    >
                        <ArrowRight size={15} />
                        Go to My Stores
                    </Link>

                    <Link
                        href={route('logout')}
                        method="delete"
                        as="button"
                        className="flex items-center justify-center gap-2 w-full py-3 text-slate-600 hover:text-slate-400 text-sm transition-colors"
                    >
                        <LogOut size={14} />
                        Sign out
                    </Link>
                </div>
            </div>
        </div>
    );
}

import React from 'react';
import { usePage, Head, Link } from '@inertiajs/react';
import { Store, Tag, ArrowRight, Sparkles, Users, Key } from 'lucide-react';

/**
 * Store/CreateOrJoin.jsx — Definitive Plan
 *
 * Landing page for users who have no active stores.
 * Shown immediately after registration/login when memberships are empty.
 *
 * Two paths:
 *  A) Create a new store (uses available license or creates free trial)
 *  B) Join an existing store via join code (for staff/cashiers)
 */
export default function CreateOrJoin({ has_license = false, license_plan = 'trial' }) {
    return (
        <div className="min-h-screen bg-[#02000f] text-white font-sans flex flex-col">
            <Head title="Get Started — VenQore" />

            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-indigo-900/15 rounded-full blur-[130px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[100px]" />
            </div>

            {/* Nav */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <img src="/images/logo.png" alt="VenQore" className="h-8 w-8 object-contain" />
                    <span className="font-black text-lg text-white">VenQore<span className="text-indigo-400">.</span></span>
                </div>
                <Link
                    href={route('logout')}
                    method="delete"
                    as="button"
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                    Sign out
                </Link>
            </header>

            <div className="relative z-10 flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-2xl">

                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold mb-6">
                            <Sparkles size={14} />
                            {has_license ? `${license_plan.charAt(0).toUpperCase() + license_plan.slice(1)} plan ready` : 'Welcome to VenQore'}
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white mb-3">
                            Let's get you started
                        </h1>
                        <p className="text-slate-400 text-lg">
                            Create your store or join an existing one with a code.
                        </p>
                    </div>

                    {/* Choice cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Create store */}
                        <Link
                            href={route('store.create')}
                            className="group relative rounded-2xl border border-white/10 bg-white/3 hover:bg-indigo-500/8 hover:border-indigo-500/40 p-8 flex flex-col transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-6 group-hover:bg-indigo-500/25 transition-colors">
                                <Store size={24} className="text-indigo-400" />
                            </div>

                            <h2 className="text-xl font-black text-white mb-2">Create a Store</h2>
                            <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-6">
                                {has_license
                                    ? `Use your ${license_plan} plan license to create your store. Full access from day one.`
                                    : 'Start your free 14-day trial. No credit card required to begin.'}
                            </p>

                            <div className="space-y-2 mb-6">
                                {has_license ? (
                                    <>
                                        <Feature text="License ready to use" />
                                        <Feature text="Full plan features unlocked" />
                                        <Feature text="Set up in 2 minutes" />
                                    </>
                                ) : (
                                    <>
                                        <Feature text="14-day free trial" />
                                        <Feature text="No credit card needed" />
                                        <Feature text="Set up in 2 minutes" />
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm group-hover:gap-3 transition-all">
                                Create store <ArrowRight size={16} />
                            </div>

                            {/* Glow on hover */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </Link>

                        {/* Join store */}
                        <Link
                            href={route('store.join')}
                            className="group relative rounded-2xl border border-white/10 bg-white/3 hover:bg-emerald-500/5 hover:border-emerald-500/30 p-8 flex flex-col transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                                <Key size={24} className="text-emerald-400" />
                            </div>

                            <h2 className="text-xl font-black text-white mb-2">Join a Store</h2>
                            <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-6">
                                Enter the 7-character join code from your store owner to instantly join as a team member.
                            </p>

                            <div className="space-y-2 mb-6">
                                <Feature text="Instant access with join code" color="emerald" />
                                <Feature text="Role assigned by store owner" color="emerald" />
                                <Feature text="No license required" color="emerald" />
                            </div>

                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm group-hover:gap-3 transition-all">
                                Join with code <ArrowRight size={16} />
                            </div>
                        </Link>
                    </div>

                    {/* AppSumo code */}
                    <div className="mt-6 text-center">
                        <p className="text-slate-500 text-sm">
                            Have an AppSumo code?{' '}
                            <Link href={route('redeem')} className="text-orange-400 hover:text-orange-300 font-semibold transition-colors inline-flex items-center gap-1">
                                <Tag size={13} /> Redeem it here
                            </Link>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}

function Feature({ text, color = 'indigo' }) {
    const colors = {
        indigo: 'text-indigo-400',
        emerald: 'text-emerald-400',
    };
    return (
        <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center bg-current/10 ${colors[color]}`}>
                <svg viewBox="0 0 12 12" fill="currentColor" className="w-2.5 h-2.5">
                    <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
            </div>
            {text}
        </div>
    );
}

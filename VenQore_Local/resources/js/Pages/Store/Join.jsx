import React, { useState } from 'react';
import { usePage, Head, Link, useForm } from '@inertiajs/react';
import {
    Key, ArrowRight, ArrowLeft, Loader2, AlertCircle, Store
} from 'lucide-react';

/**
 * Store/Join.jsx — Definitive Plan
 *
 * Join a store by entering its 7-character join code (e.g. VQ-A3F9).
 * Anyone with the code becomes a Cashier in that store (default role).
 * Store owner can upgrade the role later from the Staff page.
 *
 * URL: /join
 */
export default function JoinStore() {
    const { data, setData, post, processing, errors } = useForm({
        join_code: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('store.join.submit', { store_slug: store.slug }));
    };

    const formatCode = (raw) => {
        // Force VQ- prefix display + uppercase + only alphanumeric after prefix
        const cleaned = raw.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        return cleaned;
    };

    return (
        <div className="min-h-screen bg-[#02000f] text-white font-sans flex flex-col">
            <Head title="Join a Store — VenQore" />

            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-emerald-900/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-[100px]" />
            </div>

            {/* Nav */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <img src="/images/logo.png" alt="VenQore" className="h-8 w-8 object-contain" />
                    <span className="font-black text-lg text-white">VenQore<span className="text-indigo-400">.</span></span>
                </div>
                <Link
                    href={route('store.create-or-join', { store_slug: store.slug })}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={14} /> Back
                </Link>
            </header>

            <div className="relative z-10 flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mb-5">
                            <Key size={24} className="text-emerald-400" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
                            Join a Store
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Ask your store owner for the 7-character join code.
                            <br />Codes look like: <span className="font-mono text-emerald-400">VQ-A3F9</span>
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Store Join Code <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="join-code"
                                type="text"
                                value={data.join_code}
                                onChange={e => setData('join_code', formatCode(e.target.value))}
                                placeholder="VQ-XXXX"
                                maxLength={7}
                                className={`w-full px-5 py-4 rounded-xl bg-white/5 border text-white placeholder-slate-600
                                    font-mono text-2xl tracking-[0.25em] text-center uppercase
                                    focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-colors
                                    ${errors.join_code ? 'border-red-500 bg-red-500/5' : 'border-white/10 hover:border-white/20'}`}
                                autoFocus
                            />
                            {errors.join_code && (
                                <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
                                    <AlertCircle size={12} /> {errors.join_code}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="rounded-xl border border-white/8 bg-white/3 p-4 text-xs text-slate-400 space-y-1.5">
                            <div className="flex items-start gap-2">
                                <Store size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                                <span>You'll join as a <strong className="text-slate-200">Cashier</strong> by default. The store owner can update your role.</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Key size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                                <span>The code can be found in the store's <strong className="text-slate-200">Staff Settings</strong> page.</span>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            id="join-store-submit"
                            type="submit"
                            disabled={processing || data.join_code.length < 6}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl
                                bg-gradient-to-r from-emerald-500 to-teal-600
                                hover:from-emerald-400 hover:to-teal-500
                                text-white font-bold text-base transition-all
                                hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/25
                                disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <><Loader2 size={18} className="animate-spin" /> Joining…</>
                            ) : (
                                <><Key size={18} /> Join Store <ArrowRight size={16} /></>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-slate-600 mt-6">
                        Want to create your own store?{' '}
                        <Link href={route('store.create', { store_slug: store.slug })} className="text-slate-400 hover:text-indigo-400 transition-colors underline underline-offset-2">
                            Create a store
                        </Link>
                    </p>

                </div>
            </div>
        </div>
    );
}

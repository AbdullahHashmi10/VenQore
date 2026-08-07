import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Store, ArrowRight, ArrowLeft, Loader2, Check, Sparkles,
    Clock, CreditCard, Pencil
} from 'lucide-react';

/**
 * Store/Create.jsx — Plan-gated store creation, Step 2
 *
 * URL: /new-store?plan=<slug>&interval=<monthly|annual>
 *
 * Reached only after a plan has been chosen on Step 1 (Store/SelectPlan), or
 * directly when the user holds a pre-paid/AppSumo license (plan predetermined).
 *
 * Collects the store name and starts the trial on the selected plan. The plan
 * + interval ride along with the submission so the server can record what to
 * charge once the trial ends.
 */

function FieldLabel({ children, required }) {
    return (
        <label className="block text-sm font-semibold text-slate-300 mb-2">
            {children} {required && <span className="text-red-400">*</span>}
        </label>
    );
}

function FieldError({ message }) {
    if (!message) return null;
    return <p className="text-red-400 text-xs mt-1.5">{message}</p>;
}

function InputBase({ className = '', hasError, ...props }) {
    return (
        <input
            {...props}
            className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-slate-500
                focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors
                ${hasError ? 'border-red-500 bg-red-500/5' : 'border-white/10 hover:border-white/20'}
                ${className}`}
        />
    );
}

export default function CreateStore({ available_license = null, selected_plan = null, trial_days = 14 }) {
    const { data, setData, post, processing, errors } = useForm({
        name:     '',
        plan:     selected_plan?.slug || '',
        interval: selected_plan?.interval || 'monthly',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('store.store'));
    };

    const fmtCharge = () => {
        if (!selected_plan) return null;
        const sym = selected_plan.symbol || '$';
        const amt = Number(selected_plan.amount || 0);
        const rounded = Number.isInteger(amt) ? amt : Math.round(amt);
        const money = sym === 'Rs' ? `Rs ${rounded.toLocaleString()}` : `${sym}${rounded.toLocaleString()}`;
        return `${money}/${selected_plan.cadence === 'year' ? 'yr' : 'mo'}`;
    };

    const backHref = available_license ? route('store.create-or-join') : route('store.create');

    return (
        <div className="min-h-screen bg-[#02000f] text-white font-sans">
            <Head title="Create Store — VenQore" />

            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-900/15 rounded-full blur-[140px]" />
                <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[100px]" />
            </div>

            {/* Nav */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <img src="/images/logo.png" alt="VenQore" className="h-8 w-8 object-contain" />
                    <span className="font-black text-lg text-white">VenQore<span className="text-indigo-400">.</span></span>
                </div>
                <Link
                    href={backHref}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={14} /> {available_license ? 'Back' : 'Change plan'}
                </Link>
            </header>

            <div className="relative z-10 flex items-center justify-center p-6 min-h-[calc(100vh-65px)]">
                <div className="w-full max-w-xl">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 mb-5">
                            <Store size={24} className="text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
                            Name your store
                        </h1>
                        <p className="text-slate-400 text-sm">
                            {available_license
                                ? `Your ${available_license.plan} license will be activated for this store.`
                                : `Last step — your ${trial_days}-day free trial starts as soon as your store is created.`}
                        </p>
                    </div>

                    {/* Plan summary (self-serve trial) */}
                    {selected_plan && (
                        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4 mb-6">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                                        <Sparkles size={16} className="text-indigo-300" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">
                                            {selected_plan.name} plan
                                            <span className="text-slate-400 font-medium"> · {selected_plan.interval === 'annual' ? 'Annual' : 'Monthly'}</span>
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                                            <Clock size={11} className="text-emerald-400" />
                                            Free for {trial_days} days, then {fmtCharge()}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={route('store.create')}
                                    className="flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
                                >
                                    <Pencil size={11} /> Change
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* License badge (pre-paid) */}
                    {available_license && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 mb-6">
                            <Sparkles size={16} className="text-emerald-400 shrink-0" />
                            <p className="text-sm text-emerald-300">
                                <span className="font-bold capitalize">{available_license.plan} plan</span> license will be activated for this store
                            </p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Store name */}
                        <div>
                            <FieldLabel required>Store Name</FieldLabel>
                            <InputBase
                                id="store-name"
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="e.g. Ali Electronics, Green Mart..."
                                hasError={!!errors.name}
                                autoFocus
                                maxLength={100}
                            />
                            <FieldError message={errors.name} />
                            <FieldError message={errors.plan} />
                        </div>

                        {/* Quick preview */}
                        {data.name && (
                            <div className="px-4 py-3 rounded-xl bg-white/3 border border-white/8 text-sm text-slate-400">
                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Your store URL will be</span>
                                <span className="text-white font-mono text-xs">
                                    venqore.com/s/<span className="text-indigo-300">[ID]</span>/dashboard
                                </span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            id="create-store-submit"
                            type="submit"
                            disabled={processing || !data.name}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl
                                bg-gradient-to-r from-indigo-500 to-purple-600
                                hover:from-indigo-400 hover:to-purple-500
                                text-white font-bold text-base transition-all
                                hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/25
                                disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed mt-2"
                        >
                            {processing ? (
                                <><Loader2 size={18} className="animate-spin" /> Creating store…</>
                            ) : (
                                <><Store size={18} /> {available_license ? 'Create Store' : 'Start my free trial'} <ArrowRight size={16} /></>
                            )}
                        </button>

                        <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                            {available_license
                                ? 'You can rename your store and change settings at any time.'
                                : <><CreditCard size={11} /> No card charged today. You can cancel anytime before your trial ends.</>}
                        </p>
                    </form>

                </div>
            </div>
        </div>
    );
}

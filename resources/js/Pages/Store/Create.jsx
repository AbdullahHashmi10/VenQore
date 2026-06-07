import React, { useState } from 'react';
import { usePage, Head, Link, useForm } from '@inertiajs/react';
import {
    Store, Globe, Clock, ArrowRight, ArrowLeft, Loader2,
    Check, ChevronDown, Sparkles, MapPin
} from 'lucide-react';

/**
 * Store/Create.jsx — Definitive Plan
 *
 * New store creation form.
 * URL: /new-store
 *
 * Collected: name, currency_code, timezone, industry (optional)
 * Creates store → redirects to /s/{id}/setup (onboarding wizard)
 */

const CURRENCIES = [
    { code: 'PKR', symbol: 'Rs.',  label: 'Pakistani Rupee'   },
    { code: 'USD', symbol: '$',    label: 'US Dollar'          },
    { code: 'EUR', symbol: '€',    label: 'Euro'               },
    { code: 'GBP', symbol: '£',    label: 'British Pound'      },
    { code: 'AED', symbol: 'AED',  label: 'UAE Dirham'         },
    { code: 'SAR', symbol: 'SAR',  label: 'Saudi Riyal'        },
    { code: 'INR', symbol: '₹',    label: 'Indian Rupee'       },
    { code: 'CAD', symbol: 'CA$',  label: 'Canadian Dollar'    },
    { code: 'AUD', symbol: 'A$',   label: 'Australian Dollar'  },
    { code: 'SGD', symbol: 'S$',   label: 'Singapore Dollar'   },
    { code: 'CNY', symbol: '¥',    label: 'Chinese Yuan'       },
    { code: 'JPY', symbol: '¥',    label: 'Japanese Yen'       },
];

const INDUSTRIES = [
    { key: 'retail',       label: 'Retail / General Store',  emoji: '🏪' },
    { key: 'grocery',      label: 'Grocery / Supermarket',   emoji: '🛒' },
    { key: 'fashion',      label: 'Fashion / Clothing',      emoji: '👗' },
    { key: 'electronics',  label: 'Electronics',             emoji: '📱' },
    { key: 'pharmacy',     label: 'Pharmacy / Medical',      emoji: '💊' },
    { key: 'restaurant',   label: 'Restaurant / Food',       emoji: '🍽️' },
    { key: 'manufacturing',label: 'Manufacturing / Factory',  emoji: '🏭' },
    { key: 'services',     label: 'Services / Consulting',   emoji: '💼' },
    { key: 'other',        label: 'Other',                   emoji: '✨' },
];

// Common timezones — user can type to filter in a real implementation
const TIMEZONES = [
    'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Riyadh',
    'Asia/Singapore', 'Asia/Tokyo', 'Asia/Shanghai',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin',
    'America/New_York', 'America/Chicago', 'America/Los_Angeles',
    'America/Toronto', 'Australia/Sydney', 'Pacific/Auckland',
    'UTC',
];

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
            className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-slate-600 
                focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors
                ${hasError ? 'border-red-500 bg-red-500/5' : 'border-white/10 hover:border-white/20'}
                ${className}`}
        />
    );
}

function SelectBase({ className = '', hasError, children, ...props }) {
    return (
        <div className="relative">
            <select
                {...props}
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white
                    focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors
                    appearance-none cursor-pointer
                    ${hasError ? 'border-red-500' : 'border-white/10 hover:border-white/20'}
                    ${className}`}
            >
                {children}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
    );
}

export default function CreateStore({ available_license }) {
    const { data, setData, post, processing, errors } = useForm({
        name:          '',
        currency_code: 'PKR',
        timezone:      Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi',
        industry:      '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('store.store'));
    };

    const selectedCurrency = CURRENCIES.find(c => c.code === data.currency_code) ?? CURRENCIES[0];

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
                    href={route('store.create-or-join')}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={14} /> Back
                </Link>
            </header>

            <div className="relative z-10 flex items-center justify-center p-6 min-h-[calc(100vh-65px)]">
                <div className="w-full max-w-xl">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 mb-5">
                            <Store size={24} className="text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
                            Create your store
                        </h1>
                        <p className="text-slate-400 text-sm">
                            {available_license
                                ? `You have a ${available_license.plan} license ready to activate.`
                                : 'Free 14-day trial · No credit card needed'}
                        </p>
                    </div>

                    {/* License badge */}
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
                                <><Store size={18} /> Create Store <ArrowRight size={16} /></>
                            )}
                        </button>

                        <p className="text-center text-xs text-slate-600">
                            You can rename your store and change settings at any time.
                        </p>
                    </form>

                </div>
            </div>
        </div>
    );
}

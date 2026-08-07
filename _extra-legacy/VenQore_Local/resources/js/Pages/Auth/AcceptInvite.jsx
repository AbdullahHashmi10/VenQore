import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    Mail, Users, ArrowRight, Loader2, Eye, EyeOff,
    CheckCircle, Crown, Zap, Store
} from 'lucide-react';

/**
 * Auth/AcceptInvite.jsx — Definitive Plan
 *
 * Staff invite acceptance page.
 * URL: /invite/{token}
 *
 * Shown when a staff member clicks the invite link from their email.
 * If account already exists, they just accept (no password needed).
 * If new user, they set a password here.
 */

const ROLE_INFO = {
    owner:   { label: 'Owner',   icon: Crown,   color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20' },
    admin:   { label: 'Admin',   icon: Zap,     color: 'text-indigo-400',  bg: 'bg-indigo-400/10',  border: 'border-indigo-400/20' },
    manager: { label: 'Manager', icon: Users,   color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/20' },
    cashier: { label: 'Cashier', icon: Store,   color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    viewer:  { label: 'Viewer',  icon: Users,   color: 'text-slate-400',   bg: 'bg-slate-400/10',   border: 'border-slate-400/20' },
};

export default function AcceptInvite({ token, invite_email, store_name, role }) {
    const [showPass, setShowPass] = useState(false);
    const roleInfo = ROLE_INFO[role] ?? ROLE_INFO.viewer;
    const RoleIcon = roleInfo.icon;

    const { data, setData, post, processing, errors } = useForm({
        token,
        name:     '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('invite.complete'));
    };

    return (
        <div className="min-h-screen bg-[#02000f] text-white font-sans flex flex-col items-center justify-center p-6">
            <Head title={`Join ${store_name} — VenQore`} />

            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-900/15 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">

                {/* Top icon */}
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <img src="/images/logo.png" alt="VenQore" className="w-10 h-10 object-contain" />
                    </div>
                </div>

                {/* Invite card */}
                <div className="rounded-2xl border border-white/10 bg-white/3 p-8">

                    {/* Store + role info */}
                    <div className="text-center mb-8">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium mb-4 ${roleInfo.color} ${roleInfo.bg} ${roleInfo.border}`}>
                            <RoleIcon size={14} />
                            {roleInfo.label}
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight mb-2">
                            You're invited!
                        </h1>
                        <p className="text-slate-300 text-sm">
                            <strong className="text-white">{store_name}</strong> has invited you to join as a{' '}
                            <strong className={roleInfo.color}>{roleInfo.label}</strong>.
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500">
                            <Mail size={12} />
                            <span>Sent to: <span className="text-slate-300">{invite_email}</span></span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={submit} className="space-y-4">
                        <input type="hidden" value={token} name="token" />

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Your Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="invite-name"
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="How should we call you?"
                                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-slate-600
                                    focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors
                                    ${errors.name ? 'border-red-500' : 'border-white/10 hover:border-white/20'}`}
                                autoFocus
                            />
                            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                        </div>

                        {/* Password — only if new user */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Set a Password <span className="text-slate-500 font-normal">(skip if you already have an account)</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="invite-password"
                                    type={showPass ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    placeholder="Min 8 characters"
                                    className={`w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border text-white placeholder-slate-600
                                        focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors
                                        ${errors.password ? 'border-red-500' : 'border-white/10 hover:border-white/20'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                        </div>

                        {/* Accept button */}
                        <button
                            id="accept-invite-submit"
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
                                <><Loader2 size={18} className="animate-spin" /> Joining…</>
                            ) : (
                                <><CheckCircle size={18} /> Accept & Enter Store <ArrowRight size={16} /></>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-slate-600 mt-5">
                        By joining, you agree to VenQore's{' '}
                        <a href="/terms" className="text-slate-500 hover:text-slate-300 underline">Terms of Service</a>.
                    </p>
                </div>

                <p className="text-center text-xs text-slate-600 mt-4">
                    If you weren't expecting this invite, you can safely close this page.
                </p>
            </div>
        </div>
    );
}

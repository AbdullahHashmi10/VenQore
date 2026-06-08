import { useEffect, useState } from 'react';
import axios from 'axios';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock, ArrowRight, ShieldCheck, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   STAFF LOGIN PAGE — Premium Dark Cinematic (Midnight Nebula)
   Split-screen: ambient branding left · glass form right
   ═══════════════════════════════════════════════════════════════════════ */

const AuthInput = ({ icon: Icon, label, error, ...props }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label className={`block text-[10px] font-black uppercase tracking-[0.25em] mb-2.5 transition-colors duration-300 ${focused ? 'text-violet-400' : 'text-slate-500'}`}>
                {label}
            </label>
            <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${focused ? 'text-violet-400' : 'text-slate-600'}`}>
                    <Icon size={18} />
                </div>
                <input
                    {...props}
                    onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
                    onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
                    className={`w-full pl-12 pr-4 py-4 bg-white/[0.02] border rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none transition-all duration-500
                        ${focused ? 'border-violet-500/40 bg-violet-500/[0.02] shadow-lg shadow-violet-900/10' : 'border-white/[0.06] hover:border-white/[0.1]'}
                        ${error ? 'border-red-500/40' : ''}
                    `}
                />
                <div className={`absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-violet-500 to-transparent transition-opacity duration-500 ${focused ? 'opacity-100' : 'opacity-0'}`} />
            </div>
            {error && <p className="text-red-400 text-xs mt-2 font-medium">{error}</p>}
        </div>
    );
};

export default function StaffLogin({ status, flash }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        return () => reset('password');
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('staff.login.store'));
    };

    return (
        <div className="min-h-screen w-full flex bg-[#02000c] font-sans selection:bg-violet-500/40 selection:text-white">
            <Head title="Staff Access Portal" />

            {/* ── Left Panel — Branding ─────────────────────── */}
            <div className="hidden lg:flex w-[45%] relative overflow-hidden items-center justify-center p-16 border-r border-white/[0.03]">
                {/* Ambient blobs */}
                <div className="absolute top-[-20%] right-[-15%] w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                }} />

                <div className="relative z-10 text-center max-w-md">
                    <div className="mb-10 flex justify-center">
                        <div className="w-20 h-20 bg-white/[0.03] backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/[0.06] shadow-2xl shadow-violet-900/20">
                            <KeyRound className="w-10 h-10 text-violet-400" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-white mb-4 tracking-tighter leading-[0.95]" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
                        Staff Hub.
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Secure authorization portal for VenQore platform support agents, content writers, marketing specialists, and platform managers.
                    </p>

                    <div className="mt-12 flex justify-center gap-4">
                        <div className="px-6 py-3 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-xs font-bold text-slate-400 flex items-center gap-2">
                            <ShieldCheck size={14} className="text-violet-500" /> Platform Level
                        </div>
                        <div className="px-6 py-3 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-xs font-bold text-slate-400 flex items-center gap-2">
                            <ShieldCheck size={14} className="text-violet-500" /> Secure Sessions
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right Panel — Form ───────────────────────── */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative">
                <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="w-full max-w-md relative z-10">
                    {/* Header */}
                    <div className="mb-10 text-center sm:text-left">
                        <span className="text-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-3">
                            Platform Command Portal
                        </span>
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
                            Staff Authorization
                        </h2>
                        <p className="text-slate-500 text-sm">
                            Please authenticate using your credentials to enter the cockpit.
                        </p>
                    </div>

                    {/* Status message */}
                    {status && (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
                            {status}
                        </div>
                    )}

                    {/* Error message */}
                    {flash?.error && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-8">
                            {flash.error}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-5">
                            <AuthInput
                                icon={Mail}
                                label="Email Address"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="yourname@venqore.com"
                                autoComplete="username"
                                autoFocus
                                error={errors.email}
                            />

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.25em] mb-2.5 text-slate-500">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        className="w-full pl-12 pr-12 py-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none focus:border-violet-500/40 focus:bg-violet-500/[0.02] focus:shadow-lg focus:shadow-violet-900/10 hover:border-white/[0.1] transition-all duration-500"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-600 hover:text-slate-400 transition-colors">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-400 text-xs mt-2 font-medium">{errors.password}</p>}
                            </div>

                            <div className="flex items-center">
                                <label className="flex items-center cursor-pointer group">
                                    <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)}
                                        className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-violet-600 focus:ring-violet-500/20 focus:ring-offset-0" />
                                    <span className="ml-2.5 text-sm text-slate-500 group-hover:text-slate-400 transition-colors">Remember me</span>
                                </label>
                            </div>

                            <button type="submit" disabled={processing}
                                className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white text-[#02000c] rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:shadow-[0_0_60px_-10px_rgba(139,92,246,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50">
                                {processing ? <><Loader2 size={18} className="animate-spin" /> Authorizing...</> : <>Enter Staff Hub <ArrowRight size={16} /></>}
                            </button>
                        </div>
                    </form>

                    {/* Back link */}
                    <div className="mt-10 text-center">
                        <Link href={route('login')} className="font-semibold text-xs text-slate-600 hover:text-violet-400 transition-colors">
                            ← Regular Store Account Login
                        </Link>
                    </div>
                </div>
            </div>

            <style>{`
                * { font-family: 'Inter', system-ui, sans-serif; }
            `}</style>
        </div>
    );
}

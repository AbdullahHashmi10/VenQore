import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import { Mail, ArrowRight, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════════
   FORGOT PASSWORD — Premium Dark Cinematic
   Centered card with ambient lighting. Clean, focused, reassuring.
   ═══════════════════════════════════════════════════════════════════════ */

export default function ForgotPassword({ status, settings }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });
    const [focused, setFocused] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#020010] font-sans selection:bg-indigo-500/40 p-6 relative overflow-hidden">
            <Head title="Forgot Password" />

            {/* Ambient */}
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/15 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] bg-violet-900/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
            }} />

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-10">
                    <Link href="/" className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.08] hover:scale-105 transition-transform">
                        <img src={settings?.company_logo ? `/storage/${settings.company_logo}` : "/images/logo.png"} alt="Logo" className="w-10 h-10 object-contain"
                            onError={(e) => { e.target.onerror = null; e.target.src = "/images/logo.png"; }} />
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2.5rem] p-8 md:p-10 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <KeyRound size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>Reset Password</h2>
                            <p className="text-xs text-slate-600">We'll send you a secure reset link</p>
                        </div>
                    </div>

                    {status && (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label className={`block text-[10px] font-black uppercase tracking-[0.25em] mb-2.5 transition-colors duration-300 ${focused ? 'text-indigo-400' : 'text-slate-600'}`}>
                                Email Address
                            </label>
                            <div className="relative">
                                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${focused ? 'text-indigo-400' : 'text-slate-700'}`}>
                                    <Mail size={18} />
                                </div>
                                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)}
                                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                                    placeholder="name@company.com" autoComplete="username" autoFocus
                                    className={`w-full pl-12 pr-4 py-4 bg-white/[0.03] border rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none transition-all duration-500
                                        ${focused ? 'border-indigo-500/40 bg-indigo-500/[0.03] shadow-lg shadow-indigo-900/10' : 'border-white/[0.08] hover:border-white/[0.12]'}`} />
                                <div className={`absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent transition-opacity duration-500 ${focused ? 'opacity-100' : 'opacity-0'}`} />
                            </div>
                            {errors.email && <p className="text-red-400 text-xs mt-2 font-medium">{errors.email}</p>}
                        </div>

                        <button type="submit" disabled={processing}
                            className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white text-[#020010] rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50">
                            {processing ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : <>Send Reset Link <ArrowRight size={16} /></>}
                        </button>

                        <Link href={route('login')}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-white hover:bg-white/[0.06] rounded-2xl font-bold text-sm transition-all active:scale-[0.98]">
                            <ArrowLeft size={16} /> Back to Sign In
                        </Link>
                    </form>
                </div>
            </div>

            <style>{`* { font-family: 'Inter', 'Figtree', system-ui, sans-serif; }`}</style>
        </div>
    );
}

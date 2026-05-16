import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { Lock, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff, Mail } from 'lucide-react';
import { useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════════
   RESET PASSWORD — Premium Dark Cinematic
   ═══════════════════════════════════════════════════════════════════════ */

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token, email,
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#020010] font-sans selection:bg-indigo-500/40 p-6 relative overflow-hidden">
            <Head title="Reset Password" />

            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/15 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] bg-emerald-900/8 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
            }} />

            <div className="relative z-10 w-full max-w-md">
                <div className="flex justify-center mb-10">
                    <Link href="/" className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.08] hover:scale-105 transition-transform">
                        <img src="/images/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                    </Link>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2.5rem] p-8 md:p-10 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>Set New Password</h2>
                            <p className="text-xs text-slate-600">Choose a strong password for your account</p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        {/* Email (read-only display) */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.25em] mb-2.5 text-slate-600">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700"><Mail size={18} /></div>
                                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-slate-400 text-sm outline-none" readOnly />
                            </div>
                            {errors.email && <p className="text-red-400 text-xs mt-2">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.25em] mb-2.5 text-slate-600">New Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700"><Lock size={18} /></div>
                                <input type={showPassword ? 'text' : 'password'} value={data.password} onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••" autoComplete="new-password" autoFocus
                                    className="w-full pl-12 pr-12 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] hover:border-white/[0.12] transition-all duration-500" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-700 hover:text-slate-400 transition-colors">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-400 text-xs mt-2">{errors.password}</p>}
                        </div>

                        {/* Confirm */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.25em] mb-2.5 text-slate-600">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700"><Lock size={18} /></div>
                                <input type={showPassword ? 'text' : 'password'} value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="••••••••" autoComplete="new-password"
                                    className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] hover:border-white/[0.12] transition-all duration-500" />
                            </div>
                            {errors.password_confirmation && <p className="text-red-400 text-xs mt-2">{errors.password_confirmation}</p>}
                        </div>

                        <button type="submit" disabled={processing}
                            className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white text-[#020010] rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 mt-2">
                            {processing ? <><Loader2 size={18} className="animate-spin" /> Resetting...</> : <>Reset Password <ArrowRight size={16} /></>}
                        </button>
                    </form>
                </div>
            </div>

            <style>{`* { font-family: 'Inter', 'Figtree', system-ui, sans-serif; }`}</style>
        </div>
    );
}

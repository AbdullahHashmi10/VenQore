import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { User, Mail, Lock, ArrowRight, Shield, Check, Eye, EyeOff, Loader2, Zap, BarChart3, Boxes } from 'lucide-react';
import { useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════════
   REGISTER PAGE — Premium Dark Cinematic
   ═══════════════════════════════════════════════════════════════════════ */

const AuthInput = ({ icon: Icon, label, error, children, ...props }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label className={`block text-[10px] font-black uppercase tracking-[0.25em] mb-2.5 transition-colors duration-300 ${focused ? 'text-indigo-400' : 'text-slate-600'}`}>
                {label}
            </label>
            <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${focused ? 'text-indigo-400' : 'text-slate-700'}`}>
                    <Icon size={18} />
                </div>
                <input
                    {...props}
                    onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
                    onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
                    className={`w-full pl-12 pr-4 py-4 bg-white/[0.03] border rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none transition-all duration-500
                        ${focused ? 'border-indigo-500/40 bg-indigo-500/[0.03] shadow-lg shadow-indigo-900/10' : 'border-white/[0.08] hover:border-white/[0.12]'}
                        ${error ? 'border-red-500/40' : ''}
                    `}
                />
                {children}
                <div className={`absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent transition-opacity duration-500 ${focused ? 'opacity-100' : 'opacity-0'}`} />
            </div>
            {error && <p className="text-red-400 text-xs mt-2 font-medium">{error}</p>}
        </div>
    );
};

export default function Register() {
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (data.password.length < 8) {
            errors.password = 'Password must be at least 8 characters.';
            return;
        }
        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
            onError: (err) => {
                console.error('Registration failed:', err);
                if (err.email) alert('This email is already registered.');
            }
        });
    };

    const benefits = [
        { icon: Shield, title: 'Auditor-Grade Accuracy', desc: 'Every transaction writes a correct journal entry' },
        { icon: Zap, title: 'Professional POS', desc: '25+ shortcuts, crash-proof architecture' },
        { icon: BarChart3, title: '38 Verified Reports', desc: 'P&L, Balance Sheet, Cash Flow & more' },
        { icon: Boxes, title: 'Full Inventory Control', desc: 'FIFO, batch tracking, multi-warehouse' },
    ];

    return (
        <div className="min-h-screen w-full flex bg-[#020010] font-sans selection:bg-indigo-500/40 selection:text-white">
            <Head title="Create Account" />

            {/* ── Left Panel — Branding ─────────────────────── */}
            <div className="hidden lg:flex w-[45%] relative overflow-hidden items-center justify-center p-16">
                <div className="absolute top-[-15%] right-[-15%] w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }} />

                <div className="relative z-10 max-w-md">
                    <div className="mb-10 flex justify-center">
                        <div className="w-20 h-20 bg-white/[0.04] backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/[0.08] shadow-2xl shadow-emerald-900/20">
                            <img src="/images/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-white mb-4 tracking-tighter leading-[0.95] text-center" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
                        Start Your Free Trial.
                    </h1>
                    <p className="text-slate-500 text-base leading-relaxed text-center mb-12">
                        14 days. Full access. No credit card required.
                    </p>

                    {/* Benefits */}
                    <div className="space-y-3">
                        {benefits.map((b, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors duration-300">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
                                    <b.icon size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white tracking-tight">{b.title}</h3>
                                    <p className="text-xs text-slate-600">{b.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right Panel — Form ───────────────────────── */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative">
                <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="w-full max-w-md relative z-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-10">
                        <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.08]">
                            <img src="/images/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
                            Create your account
                        </h2>
                        <p className="text-slate-600 text-sm">Start your 14-day free trial today.</p>
                    </div>

                    {/* Google OAuth */}
                    <button type="button" onClick={() => window.location.href = route('auth.google')}
                        className="flex items-center justify-center gap-3 w-full py-4 px-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-sm font-bold text-white hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 active:scale-[0.98] mb-6">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
                        <div className="relative flex justify-center text-[10px]">
                            <span className="px-4 bg-[#020010] text-slate-700 font-bold uppercase tracking-widest">or</span>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <AuthInput icon={User} label="Full Name" type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="John Doe" autoComplete="name" autoFocus required error={errors.name} />
                        <AuthInput icon={Mail} label="Email Address" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="name@company.com" autoComplete="username" required error={errors.email} />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.25em] mb-2.5 text-slate-600">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700"><Lock size={18} /></div>
                                    <input type={showPassword ? 'text' : 'password'} value={data.password} onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••" autoComplete="new-password" minLength="8" required
                                        className="w-full pl-12 pr-10 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] hover:border-white/[0.12] transition-all duration-500" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-700 hover:text-slate-400 transition-colors">
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-400 text-xs mt-2">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.25em] mb-2.5 text-slate-600">Confirm</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700"><Lock size={18} /></div>
                                    <input type={showPassword ? 'text' : 'password'} value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="••••••••" autoComplete="new-password" required
                                        className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] hover:border-white/[0.12] transition-all duration-500" />
                                </div>
                                {errors.password_confirmation && <p className="text-red-400 text-xs mt-2">{errors.password_confirmation}</p>}
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-3 pt-1">
                            <button id="terms-checkbox" type="button" onClick={() => setAgreedToTerms(!agreedToTerms)}
                                className={`w-5 h-5 rounded-md flex items-center justify-center border-2 shrink-0 mt-0.5 transition-all duration-300 ${agreedToTerms ? 'bg-indigo-600 border-indigo-600' : 'bg-white/[0.03] border-white/[0.12] hover:border-indigo-500/40'}`}>
                                {agreedToTerms && <Check size={12} className="text-white" strokeWidth={3} />}
                            </button>
                            <label className="text-sm text-slate-600 leading-relaxed cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                                I agree to VenQore's{' '}
                                <Link href={route('terms')} target="_blank" className="text-indigo-400/70 hover:text-indigo-400 transition-colors" onClick={e => e.stopPropagation()}>Terms</Link>
                                {' '}and{' '}
                                <Link href={route('privacy')} target="_blank" className="text-indigo-400/70 hover:text-indigo-400 transition-colors" onClick={e => e.stopPropagation()}>Privacy Policy</Link>
                            </label>
                        </div>

                        {/* Submit */}
                        <button id="register-submit" type="submit" disabled={processing || !agreedToTerms}
                            className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white text-[#020010] rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
                            {processing ? <><Loader2 size={18} className="animate-spin" /> Creating account...</> : <>Create Account <ArrowRight size={16} /></>}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-sm text-slate-700">
                            Already have an account?{' '}
                            <Link href={route('login')} className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`* { font-family: 'Inter', 'Figtree', system-ui, sans-serif; }`}</style>
        </div>
    );
}

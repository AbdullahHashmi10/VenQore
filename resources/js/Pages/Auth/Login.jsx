import { useEffect, useState } from 'react';
import axios from 'axios';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock, ArrowRight, Grip, X, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   LOGIN PAGE — Premium Dark Cinematic
   Split-screen: ambient branding left · glass form right
   ═══════════════════════════════════════════════════════════════════════ */

const AuthInput = ({ icon: Icon, label, error, ...props }) => {
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
                {/* Focus glow */}
                <div className={`absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent transition-opacity duration-500 ${focused ? 'opacity-100' : 'opacity-0'}`} />
            </div>
            {error && <p className="text-red-400 text-xs mt-2 font-medium">{error}</p>}
        </div>
    );
};

export default function Login({ status, canResetPassword, settings, passcode_login_available }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        email: '',
        password: '',
        remember: false,
        loginMethod: 'email',
        passcode: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        return () => reset('password');
    }, []);

    const submitPasscode = async () => {
        if (!processing && data.passcode) {
            try {
                const { data: csrfData } = await axios.get('/refresh-csrf');
                if (csrfData?.token) {
                    const meta = document.querySelector('meta[name="csrf-token"]');
                    if (meta) meta.setAttribute('content', csrfData.token);
                    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfData.token;
                }
            } catch { /* proceed */ }
            post(route('login.passcode'), {
                preserveScroll: true,
                onError: () => setData('passcode', ''),
            });
        }
    };

    const handlePasscodeChange = (newPasscode) => {
        setData('passcode', newPasscode);
        if (errors.passcode) clearErrors('passcode');
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (data.loginMethod !== 'passcode') return;
            if (/^[0-9]$/.test(e.key)) {
                const c = data.passcode || '';
                if (c.length < 10) handlePasscodeChange(c + e.key);
            } else if (e.key === 'Backspace') {
                handlePasscodeChange((data.passcode || '').slice(0, -1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                submitPasscode();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [data.loginMethod, data.passcode, processing]);

    const submit = async (e) => {
        e.preventDefault();
        if (data.loginMethod === 'email') {
            try {
                const { data: csrfData } = await axios.get('/refresh-csrf');
                if (csrfData?.token) {
                    const meta = document.querySelector('meta[name="csrf-token"]');
                    if (meta) meta.setAttribute('content', csrfData.token);
                    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfData.token;
                }
            } catch { /* proceed */ }
            post(route('login'));
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#020010] font-sans selection:bg-indigo-500/40 selection:text-white">
            <Head title="Sign In" />

            {/* ── Left Panel — Branding ─────────────────────── */}
            <div className="hidden lg:flex w-[45%] relative overflow-hidden items-center justify-center p-16">
                {/* Ambient blobs */}
                <div className="absolute top-[-20%] right-[-15%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }} />

                <div className="relative z-10 text-center max-w-md">
                    <div className="mb-10 flex justify-center">
                        <div className="w-20 h-20 bg-white/[0.04] backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/[0.08] shadow-2xl shadow-indigo-900/20">
                            <img
                                src={settings?.company_logo ? `/storage/${settings.company_logo}` : "/images/logo.png"}
                                alt="Logo"
                                className="w-12 h-12 object-contain"
                                onError={(e) => { e.target.onerror = null; e.target.src = "/images/logo.png"; }}
                            />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-white mb-4 tracking-tighter leading-[0.95]" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
                        {settings?.business_name || 'Welcome Back.'}
                    </h1>
                    <p className="text-slate-500 text-base leading-relaxed">
                        {settings?.login_hero_text || 'The operations platform where every transaction writes a correct journal entry. Automatically.'}
                    </p>

                    {/* Trust indicators */}
                    <div className="mt-12 grid grid-cols-3 gap-4">
                        {[
                            { val: '38', label: 'Reports' },
                            { val: '0.00', label: 'Balance Error' },
                            { val: 'FIFO', label: 'Cost Basis' },
                        ].map((s, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                                <div className="text-lg font-black text-white tracking-tighter" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.val}</div>
                                <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right Panel — Form ───────────────────────── */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative">
                {/* Subtle ambient on form side */}
                <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="w-full max-w-md relative z-10">

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-10">
                        <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.08]">
                            <img src="/images/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                        </div>
                    </div>

                    {/* Header */}
                    <div className="mb-10">
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
                            Sign in
                        </h2>
                        <p className="text-slate-600 text-sm">
                            Enter your credentials to access the dashboard.
                        </p>
                    </div>

                    {/* Status message */}
                    {status && (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
                            {status}
                        </div>
                    )}

                    {data.loginMethod === 'passcode' ? (
                        /* ── Passcode Mode ─────────────────────── */
                        <div className="space-y-6">
                            <div className="text-center mb-4">
                                <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] mb-6">Enter Passcode</div>
                                <div className="flex justify-center gap-2.5 mb-6 min-h-[20px]">
                                    {(data.passcode || '').split('').map((_, i) => (
                                        <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${errors.passcode ? 'bg-red-500 animate-pulse' : 'bg-indigo-500 shadow-lg shadow-indigo-500/30'}`} />
                                    ))}
                                </div>
                                {errors.passcode && <p className="text-red-400 text-sm font-bold">{errors.passcode}</p>}
                            </div>

                            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button key={num} type="button"
                                        onClick={() => { const c = data.passcode || ''; if (c.length < 10) handlePasscodeChange(c + num); }}
                                        className="h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xl font-bold text-white hover:bg-white/[0.06] hover:border-white/[0.12] hover:scale-105 active:scale-95 transition-all duration-200">
                                        {num}
                                    </button>
                                ))}
                                <button type="button" onClick={submitPasscode}
                                    className="h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 hover:scale-105 active:scale-95 transition-all">
                                    <ArrowRight size={22} />
                                </button>
                                <button type="button"
                                    onClick={() => { const c = data.passcode || ''; if (c.length < 10) handlePasscodeChange(c + '0'); }}
                                    className="h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xl font-bold text-white hover:bg-white/[0.06] hover:border-white/[0.12] hover:scale-105 active:scale-95 transition-all duration-200">
                                    0
                                </button>
                                <button type="button" onClick={() => handlePasscodeChange((data.passcode || '').slice(0, -1))}
                                    className="h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 flex items-center justify-center transition-all active:scale-95">
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="mt-8 text-center">
                                <button type="button" onClick={() => setData('loginMethod', 'email')}
                                    className="text-sm font-medium text-slate-600 hover:text-indigo-400 transition-colors">
                                    ← Back to Email Login
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ── Email Mode ────────────────────────── */
                        <div className="space-y-6">
                            {/* Google OAuth */}
                            <button type="button" onClick={() => window.location.href = route('auth.google')}
                                className="flex items-center justify-center gap-3 w-full py-4 px-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-sm font-bold text-white hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 active:scale-[0.98]">
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
                                <div className="relative flex justify-center text-[10px]">
                                    <span className="px-4 bg-[#020010] text-slate-700 font-bold uppercase tracking-widest">or</span>
                                </div>
                            </div>

                            <form onSubmit={submit} className="space-y-5">
                                <AuthInput
                                    icon={Mail}
                                    label="Email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="name@company.com"
                                    autoComplete="username"
                                    autoFocus
                                    error={errors.email}
                                />

                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-[0.25em] mb-2.5 text-slate-600`}>Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            className="w-full pl-12 pr-12 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] focus:shadow-lg focus:shadow-indigo-900/10 hover:border-white/[0.12] transition-all duration-500"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-700 hover:text-slate-400 transition-colors">
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-400 text-xs mt-2 font-medium">{errors.password}</p>}
                                </div>

                                {/* Remember / Forgot */}
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center cursor-pointer group">
                                        <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)}
                                            className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0" />
                                        <span className="ml-2.5 text-sm text-slate-600 group-hover:text-slate-400 transition-colors">Remember me</span>
                                    </label>
                                    {canResetPassword && (
                                        <Link href={route('password.request')} className="text-sm font-medium text-indigo-400/70 hover:text-indigo-400 transition-colors">
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>

                                {/* Submit */}
                                <button type="submit" disabled={processing}
                                    className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white text-[#020010] rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {processing ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : <>Sign In <ArrowRight size={16} /></>}
                                </button>

                                {/* Passcode login */}
                                {passcode_login_available && (
                                    <button type="button" onClick={() => setData('loginMethod', 'passcode')}
                                        className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.1] rounded-2xl font-bold text-sm transition-all active:scale-[0.98]">
                                        <Grip size={18} /> Login with Passcode
                                    </button>
                                )}
                            </form>
                        </div>
                    )}

                    {/* Register link */}
                    <div className="mt-10 text-center">
                        <p className="text-sm text-slate-700">
                            Don't have an account?{' '}
                            <Link href={route('register')} className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                                Create one for free
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                * { font-family: 'Inter', 'Figtree', system-ui, sans-serif; }
            `}</style>
        </div>
    );
}

import { useEffect } from 'react';
import axios from 'axios';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock, ArrowRight, Grip, X } from 'lucide-react';

export default function Login({ status, canResetPassword, settings, passcode_login_available }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        email: '',
        password: '',
        remember: false,
        loginMethod: 'email',
        passcode: '',
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submitPasscode = async () => {
        if (!processing && data.passcode) {
            try {
                // Silently refresh the CSRF token before submitting
                // This ensures login always works, even if the user sat on this page a long time
                const { data: csrfData } = await axios.get('/refresh-csrf');
                if (csrfData?.token) {
                    const meta = document.querySelector('meta[name="csrf-token"]');
                    if (meta) meta.setAttribute('content', csrfData.token);
                    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfData.token;
                }
            } catch {
                // If token refresh fails, proceed anyway — the server will handle it
            }
            post(route('login.passcode'), {
                preserveScroll: true,
                onError: () => {
                    setData('passcode', '');
                },
            });
        }
    };

    // Handle keyboard input for passcode
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (data.loginMethod !== 'passcode') return;

            // Allow numbers 0-9
            if (/^[0-9]$/.test(e.key)) {
                const current = data.passcode || '';
                if (current.length < 10) {
                    handlePasscodeChange(current + e.key);
                }
            }
            // Allow Backspace
            else if (e.key === 'Backspace') {
                const current = data.passcode || '';
                handlePasscodeChange(current.slice(0, -1));
            }
            // Allow Enter
            else if (e.key === 'Enter') {
                e.preventDefault();
                submitPasscode();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [data.loginMethod, data.passcode, processing]);

    const handlePasscodeChange = (newPasscode) => {
        setData('passcode', newPasscode);
        if (errors.passcode) {
            clearErrors('passcode');
        }
    };

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
            } catch { /* proceed anyway */ }
            post(route('login'));
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white">
            <Head title="Log in" />

            {/* Left Side - Branding & Visuals */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
                {/* Mesh Gradient Background */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 pointer-events-none"></div>

                {/* Content */}
                <div className="relative z-10 text-center text-white max-w-lg">
                    <div className="mb-8 flex justify-center">
                        <div className="w-24 h-24 bg-white/5 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl border border-white/10 ring-1 ring-white/5">
                            <img
                                src={settings?.company_logo ? `/storage/${settings.company_logo}` : "/images/logo.png"}
                                alt="Logo"
                                className="w-16 h-16 object-contain drop-shadow-md"
                            />
                        </div>
                    </div>
                    <h1 className="text-5xl font-bold mb-6 tracking-tight">
                        {settings?.business_name || 'Welcome to VenQore'}
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        {settings?.login_hero_text || 'The ultimate Point of Sale and Inventory Management solution. Streamline your business, track sales, and manage stock with ease.'}
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
                <div className="w-full max-w-md space-y-8">

                    {/* Mobile Logo (Visible only on small screens) */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <img src="/images/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Sign in to your account</h2>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            Please enter your details to access the dashboard.
                        </p>
                    </div>

                    {status && (
                        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-medium border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                            {status}
                        </div>
                    )}

                    {data.loginMethod === 'passcode' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-6">
                                <div className="flex justify-center gap-3 mb-8 min-h-[16px]">
                                    {(data.passcode || '').split('').map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-4 h-4 rounded-full transition-all duration-200 bg-indigo-600 scale-110 ${errors.passcode ? 'bg-red-500 animate-pulse' : ''}`}
                                        />
                                    ))}
                                </div>
                                {errors.passcode && (
                                    <p className="text-red-500 text-sm font-bold animate-bounce">{errors.passcode}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => {
                                            const current = data.passcode || '';
                                            if (current.length < 10) {
                                                handlePasscodeChange(current + num);
                                            }
                                        }}
                                        className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg hover:scale-105 transition-all active:scale-95"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <div className="col-start-1">
                                    <button
                                        type="button"
                                        onClick={submitPasscode}
                                        className="w-full h-14 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center active:scale-95"
                                    >
                                        <ArrowRight size={24} />
                                    </button>
                                </div>
                                <div className="col-start-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const current = data.passcode || '';
                                            if (current.length < 10) {
                                                handlePasscodeChange(current + '0');
                                            }
                                        }}
                                        className="w-full h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg hover:scale-105 transition-all active:scale-95"
                                    >
                                        0
                                    </button>
                                </div>
                                <div className="col-start-3">
                                    <button
                                        type="button"
                                        onClick={() => handlePasscodeChange((data.passcode || '').slice(0, -1))}
                                        className="w-full h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all flex items-center justify-center active:scale-95"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-8 text-center">
                                <button
                                    type="button"
                                    onClick={() => { setData('loginMethod', 'email'); }}
                                    className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                >
                                    Back to Email Login
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            {/* Google Sign-in Button */}
                            <button
                                type="button"
                                onClick={() => window.location.href = route('auth.google')}
                                className="flex items-center justify-center gap-3 w-full py-3.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg transition-all active:scale-[0.98]"
                            >
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
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-slate-50 dark:bg-slate-950 text-slate-400">or sign in with email</span>
                                </div>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                <div className="space-y-2">
                                    <InputLabel htmlFor="email" value="Email Address" className="text-slate-700 dark:text-slate-300 font-bold" />
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                            <Mail size={20} />
                                        </div>
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className="block w-full pl-11 pr-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                            autoComplete="username"
                                            isFocused={true}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="name@company.com"
                                        />
                                    </div>
                                    <InputError message={errors.email} />
                                </div>

                            <div className="space-y-2">
                                <InputLabel htmlFor="password" value="Password" className="text-slate-700 dark:text-slate-300 font-bold" />
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="block w-full pl-11 pr-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center cursor-pointer group">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    />
                                    <span className="ms-2 text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Remember me</span>
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                )}
                            </div>

                            <div className="flex flex-col gap-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {processing ? 'Signing in...' : 'Sign in'}
                                    {!processing && <ArrowRight size={20} />}
                                </button>

                                {passcode_login_available && (
                                    <button
                                        type="button"
                                        onClick={() => { setData('loginMethod', 'passcode'); }}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
                                    >
                                        <Grip size={20} />
                                        Login with Passcode
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                    )}

                    <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Don't have an account?{' '}
                            <Link href={route('register')} className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors">
                                Sign up for free
                            </Link>
                        </p>
                    </div>

                </div>
            </div>
        </div >
    );
}

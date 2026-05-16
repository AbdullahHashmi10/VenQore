import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { User, Mail, Lock, ArrowRight, Shield, Check } from 'lucide-react';
import { useState } from 'react';

export default function Register() {
    const [agreedToTerms, setAgreedToTerms] = useState(false);

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


    return (
        <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white">
            <Head title="Create Account" />

            {/* Left Side - Branding & Visuals */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
                {/* Mesh Gradient Background */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 pointer-events-none"></div>

                {/* Content */}
                <div className="relative z-10 text-center text-white max-w-lg">
                    <div className="mb-8 flex justify-center">
                        <div className="w-24 h-24 bg-white/5 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl border border-white/10 ring-1 ring-white/5">
                            <img src="/images/logo.png" alt="Logo" className="w-16 h-16 object-contain drop-shadow-md" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-bold mb-6 tracking-tight">Join VenQore Today</h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Create your account to unlock powerful inventory management,
                        insightful reports, and seamless point of sale operations.
                    </p>

                    {/* Feature Highlights */}
                    <div className="mt-12 space-y-4 text-left">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Secure & Private</h3>
                                <p className="text-sm text-slate-400">Your data is encrypted and protected</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
                <div className="w-full max-w-md space-y-8">

                    {/* Mobile Logo (Visible only on small screens) */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <img src="/images/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Create your account</h2>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            Fill in the details below to get started.
                        </p>
                    </div>

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
                            <span className="px-4 bg-slate-50 dark:bg-slate-950 text-slate-400">or register with email</span>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="space-y-2">
                            <InputLabel htmlFor="name" value="Full Name" className="text-slate-700 dark:text-slate-300 font-bold" />
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <User size={20} />
                                </div>
                                <TextInput
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    className="block w-full pl-11 pr-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                    autoComplete="name"
                                    isFocused={true}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <InputError message={errors.name} />
                        </div>

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
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="name@company.com"
                                    required
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        minLength="8"
                                        required
                                    />

                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="space-y-2">
                                <InputLabel htmlFor="password_confirmation" value="Confirm Password" className="text-slate-700 dark:text-slate-300 font-bold" />
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <TextInput
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className="block w-full pl-11 pr-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <InputError message={errors.password_confirmation} />
                            </div>
                        </div>

                        {/* Terms of Service Checkbox — §12 Pre-Launch (CAN-SPAM + AppSumo required) */}
                        <div className="flex items-start gap-3 pt-1">
                            <button
                                id="terms-checkbox"
                                type="button"
                                onClick={() => setAgreedToTerms(!agreedToTerms)}
                                className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 mt-0.5 transition-all ${
                                    agreedToTerms
                                        ? 'bg-indigo-600 border-indigo-600'
                                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                                }`}
                            >
                                {agreedToTerms && <Check size={12} className="text-white" strokeWidth={3} />}
                            </button>
                            <label
                                htmlFor="terms-checkbox"
                                className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer"
                                onClick={() => setAgreedToTerms(!agreedToTerms)}
                            >
                                I agree to VenQore's{' '}
                                <Link href={route('terms')} target="_blank" className="text-indigo-600 hover:underline dark:text-indigo-400" onClick={e => e.stopPropagation()}>
                                    Terms of Service
                                </Link>{' '}and{' '}
                                <Link href={route('privacy')} target="_blank" className="text-indigo-600 hover:underline dark:text-indigo-400" onClick={e => e.stopPropagation()}>
                                    Privacy Policy
                                </Link>
                            </label>
                        </div>

                        <button
                            id="register-submit"
                            type="submit"
                            disabled={processing || !agreedToTerms}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Creating account...' : 'Create Account'}
                            {!processing && <ArrowRight size={20} />}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Already have an account?{' '}
                            <Link href={route('login')} className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

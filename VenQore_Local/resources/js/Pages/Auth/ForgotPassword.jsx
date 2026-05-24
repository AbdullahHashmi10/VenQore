import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import React from 'react';

export default function ForgotPassword({ status, settings }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white">
            <Head title="Forgot Password" />

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
                                onError={(e) => { e.target.onerror = null; e.target.src = "/images/logo.png" }}
                            />
                        </div>
                    </div>
                    <h1 className="text-5xl font-bold mb-6 tracking-tight">
                        {settings?.business_name || 'VENQORE'}
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Reset your password to regain access to your dashboard and continue managing your business seamlessly.
                    </p>
                </div>
            </div>

            {/* Right Side - Forgot Password Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
                <div className="w-full max-w-md space-y-8">

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <img src="/images/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Reset Password</h2>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            Enter your email address to receive a secure password reset link.
                        </p>
                    </div>

                    {status && (
                        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-medium border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
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

                        <div className="flex flex-col gap-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Sending...' : 'Send Reset Link'}
                                {!processing && <ArrowRight size={20} />}
                            </button>

                            <Link
                                href={route('login')}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
                            >
                                <ArrowLeft size={16} />
                                Back to Log in
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

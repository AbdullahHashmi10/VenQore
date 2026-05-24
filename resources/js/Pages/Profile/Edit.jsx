import React, { useState } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    User,
    Mail,
    Lock,
    Save,
    AlertTriangle,
    Trash2,
    CheckCircle,
    ArrowLeft,
    Key,
    Eye,
    EyeOff,
    Smartphone,
    Moon,
    Sun,
    Type,
    Shield
} from 'lucide-react';

export default function Edit({ mustVerifyEmail, status }) {
    const {
        store
    } = usePage().props;

    const { auth, settings } = usePage().props;
    const user = auth.user;

    // Profile form
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name || '',
        email: user.email || '',
    });

    // Password form
    const { data: passwordData, setData: setPasswordData, put: putPassword, errors: passwordErrors, processing: passwordProcessing, recentlySuccessful: passwordRecentlySuccessful, reset: resetPassword } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Personal Passcode form
    const [passcodeData, setPasscodeData] = useState({
        enable_passcode: user.has_passcode ? true : false,
        passcode: '',
        confirm_passcode: '',
    });
    const [passcodeError, setPasscodeError] = useState('');
    const [passcodeSaved, setPasscodeSaved] = useState(false);
    const [passcodeSaving, setPasscodeSaving] = useState(false);
    const [showPasscode, setShowPasscode] = useState(false);

    // Security PIN form (for sensitive operations)
    const [securityPinData, setSecurityPinData] = useState({
        enable_security_pin: user.security_pin ? true : false,
        security_pin: '',
        confirm_security_pin: '',
    });
    const [securityPinError, setSecurityPinError] = useState('');
    const [securityPinSaved, setSecurityPinSaved] = useState(false);
    const [securityPinSaving, setSecurityPinSaving] = useState(false);
    const [showSecurityPin, setShowSecurityPin] = useState(false);

    // Delete account
    const { delete: destroy, processing: deleteProcessing } = useForm({
        password: '',
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');

    // Preferences
    const [preferences, setPreferences] = useState({
        dark_mode: localStorage.getItem('amd_theme') === 'dark',
        senior_mode: settings?.senior_mode === '1',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('store.profile.update', { store_slug: store.slug }));
    };

    const submitPassword = (e) => {
        e.preventDefault();
        putPassword(route('password.update'), {
            onSuccess: () => resetPassword(),
        });
    };

    const submitPasscode = async (e) => {
        e.preventDefault();
        setPasscodeError('');

        if (passcodeData.enable_passcode) {
            if (!passcodeData.passcode || passcodeData.passcode.length < 4) {
                setPasscodeError('Passcode must be at least 4 digits');
                return;
            }
            if (passcodeData.passcode !== passcodeData.confirm_passcode) {
                setPasscodeError('Passcodes do not match');
                return;
            }
        }

        setPasscodeSaving(true);
        try {
            await router.post(route('store.profile.passcode', { store_slug: store.slug }), {
                passcode: passcodeData.enable_passcode ? passcodeData.passcode : null,
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setPasscodeSaved(true);
                    setPasscodeData(prev => ({ ...prev, passcode: '', confirm_passcode: '' }));
                    setTimeout(() => setPasscodeSaved(false), 3000);
                },
                onError: (errors) => {
                    setPasscodeError(errors.passcode || 'Failed to update passcode');
                }
            });
        } finally {
            setPasscodeSaving(false);
        }
    };

    const submitSecurityPin = async (e) => {
        e.preventDefault();
        setSecurityPinError('');

        if (securityPinData.enable_security_pin) {
            if (!securityPinData.security_pin || securityPinData.security_pin.length !== 6) {
                setSecurityPinError('Security PIN must be exactly 6 digits');
                return;
            }
            if (securityPinData.security_pin !== securityPinData.confirm_security_pin) {
                setSecurityPinError('Security PINs do not match');
                return;
            }
        }

        setSecurityPinSaving(true);
        try {
            await router.post(route('store.profile.security-pin', { store_slug: store.slug }), {
                security_pin: securityPinData.enable_security_pin ? securityPinData.security_pin : null,
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setSecurityPinSaved(true);
                    setSecurityPinData(prev => ({ ...prev, security_pin: '', confirm_security_pin: '' }));
                    setTimeout(() => setSecurityPinSaved(false), 3000);
                },
                onError: (errors) => {
                    setSecurityPinError(errors.security_pin || 'Failed to update security PIN');
                }
            });
        } finally {
            setSecurityPinSaving(false);
        }
    };

    const deleteAccount = (e) => {
        e.preventDefault();
        destroy(route('store.profile.destroy', { store_slug: store.slug }), {
            data: { password: deletePassword },
        });
    };

    const toggleDarkMode = () => {
        const newMode = !preferences.dark_mode;
        setPreferences(prev => ({ ...prev, dark_mode: newMode }));
        localStorage.setItem('amd_theme', newMode ? 'dark' : 'light');
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const toggleSeniorMode = () => {
        const newValue = !preferences.senior_mode;
        setPreferences(prev => ({ ...prev, senior_mode: newValue }));
        router.post(route("store.settings.update", {
            store_slug: store.slug
        }), {
            settings: { ...settings, senior_mode: newValue ? '1' : '0' }
        }, { preserveScroll: true });
    };

    return (
        <OneGlanceLayout title="Profile Settings" activeMenu="System">
            <Head title="Profile Settings" />
            {/* Main scrollable container */}
            <div className="h-full overflow-y-auto">
                <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 pb-24">
                    {/* Back Link */}
                    <Link
                        href={route('store.home', { store_slug: store.slug })}
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </Link>

                    {/* Profile Information Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold">
                                    {(user.name || user.email).substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">Profile Information</h1>
                                    <p className="text-indigo-100 text-sm">Update your account's profile information and email address.</p>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={submit} className="p-6 space-y-6">
                            {/* Success Message */}
                            {recentlySuccessful && (
                                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle size={20} />
                                    <span className="text-sm font-medium">Profile updated successfully!</span>
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                                    <User size={14} className="inline mr-2" />
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="Your name"
                                />
                                {errors.name && <p className="mt-2 text-sm text-red-500">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                                    <Mail size={14} className="inline mr-2" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="your@email.com"
                                />
                                {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email}</p>}
                            </div>

                            {mustVerifyEmail && user.email_verified_at === null && (
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                                    <p className="text-sm text-amber-700 dark:text-amber-400">
                                        Your email address is unverified.{' '}
                                        <Link
                                            href={route('verification.send')}
                                            method="post"
                                            as="button"
                                            className="underline hover:text-amber-900 dark:hover:text-amber-300"
                                        >
                                            Click here to re-send the verification email.
                                        </Link>
                                    </p>
                                    {status === 'verification-link-sent' && (
                                        <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                                            A new verification link has been sent to your email address.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Save Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Personal Preferences Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Smartphone size={20} className="text-indigo-500" />
                                Personal Preferences
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Customize your experience with these personal settings.</p>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Dark Mode Toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                        {preferences.dark_mode ? <Moon size={20} className="text-indigo-500" /> : <Sun size={20} className="text-amber-500" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white">Dark Mode</p>
                                        <p className="text-xs text-slate-500">Switch between light and dark themes</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleDarkMode}
                                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${preferences.dark_mode ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${preferences.dark_mode ? 'left-8' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Senior Mode Toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                        <Type size={20} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white">Senior Mode (Large Text)</p>
                                        <p className="text-xs text-slate-500">Increase text size for better readability</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleSeniorMode}
                                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${preferences.senior_mode ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${preferences.senior_mode ? 'left-8' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Personal Passcode Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Key size={20} className="text-indigo-500" />
                                Personal Passcode (Quick Login PIN)
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Set up a 4-6 digit PIN for quick login instead of email/password.</p>
                        </div>

                        <form onSubmit={submitPasscode} className="p-6 space-y-6">
                            {passcodeSaved && (
                                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle size={20} />
                                    <span className="text-sm font-medium">Passcode updated successfully!</span>
                                </div>
                            )}

                            {passcodeError && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400">
                                    <AlertTriangle size={20} />
                                    <span className="text-sm font-medium">{passcodeError}</span>
                                </div>
                            )}

                            {/* Enable Passcode Toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                        <Shield size={20} className="text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white">Enable Quick Login PIN</p>
                                        <p className="text-xs text-slate-500">
                                            {user.has_passcode ? 'You have a passcode set. Update or disable it below.' : 'No passcode set yet.'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPasscodeData(prev => ({ ...prev, enable_passcode: !prev.enable_passcode }))}
                                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${passcodeData.enable_passcode ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${passcodeData.enable_passcode ? 'left-8' : 'left-1'}`} />
                                </button>
                            </div>

                            {passcodeData.enable_passcode && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                                                New Passcode (4-6 digits)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPasscode ? "text" : "password"}
                                                    value={passcodeData.passcode}
                                                    onChange={(e) => setPasscodeData(prev => ({ ...prev, passcode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono tracking-[0.5em] text-center text-lg"
                                                    placeholder="••••••"
                                                    maxLength={6}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasscode(!showPasscode)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showPasscode ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                                                Confirm Passcode
                                            </label>
                                            <input
                                                type={showPasscode ? "text" : "password"}
                                                value={passcodeData.confirm_passcode}
                                                onChange={(e) => setPasscodeData(prev => ({ ...prev, confirm_passcode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono tracking-[0.5em] text-center text-lg"
                                                placeholder="••••••"
                                                maxLength={6}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl">
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                            <strong>Tip:</strong> This PIN allows you to quickly log in from the login screen using just a 4-6 digit code instead of your email and password.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={passcodeSaving}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
                                >
                                    <Key size={18} />
                                    {passcodeSaving ? 'Saving...' : (passcodeData.enable_passcode ? 'Save Passcode' : 'Disable Passcode')}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Security Passcode Card (6 Digits) */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden" id="security-pin-section">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-violet-50/30 dark:bg-violet-900/10">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Shield size={20} className="text-violet-600" />
                                Security Passcode (Transaction PIN)
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Set up a mandatory 6-digit PIN for sensitive tasks like adding capital, deleting records, or changing settings.</p>
                        </div>

                        <form onSubmit={submitSecurityPin} className="p-6 space-y-6">
                            {securityPinSaved && (
                                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle size={20} />
                                    <span className="text-sm font-medium">Security PIN updated successfully!</span>
                                </div>
                            )}

                            {securityPinError && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400">
                                    <AlertTriangle size={20} />
                                    <span className="text-sm font-medium">{securityPinError}</span>
                                </div>
                            )}

                            {/* Enable Security PIN Toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                        <Lock size={20} className="text-violet-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white">Enable Transaction Security</p>
                                        <p className="text-xs text-slate-500">
                                            {user.security_pin ? 'Security PIN is currently active.' : 'Security PIN is not set yet.'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSecurityPinData(prev => ({ ...prev, enable_security_pin: !prev.enable_security_pin }))}
                                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${securityPinData.enable_security_pin ? 'bg-violet-600 shadow-lg shadow-violet-500/30' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${securityPinData.enable_security_pin ? 'left-8' : 'left-1'}`} />
                                </button>
                            </div>

                            {securityPinData.enable_security_pin && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                                                New Security PIN (Exactly 6 digits)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showSecurityPin ? "text" : "password"}
                                                    value={securityPinData.security_pin}
                                                    onChange={(e) => setSecurityPinData(prev => ({ ...prev, security_pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all font-mono tracking-[0.5em] text-center text-lg"
                                                    placeholder="••••••"
                                                    maxLength={6}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSecurityPin(!showSecurityPin)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showSecurityPin ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                                                Confirm Security PIN
                                            </label>
                                            <input
                                                type={showSecurityPin ? "text" : "password"}
                                                value={securityPinData.confirm_security_pin}
                                                onChange={(e) => setSecurityPinData(prev => ({ ...prev, confirm_security_pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all font-mono tracking-[0.5em] text-center text-lg"
                                                placeholder="••••••"
                                                maxLength={6}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl">
                                        <p className="text-sm text-violet-700 dark:text-violet-300">
                                            <strong>Safety First:</strong> This PIN is separate from your login code. It provides an extra layer of protection for your business capital and sensitive records.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={securityPinSaving}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 transition-all disabled:opacity-50"
                                >
                                    <Shield size={18} />
                                    {securityPinSaving ? 'Saving...' : (securityPinData.enable_security_pin ? 'Save Security PIN' : 'Disable Security PIN')}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Update Password Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Lock size={20} className="text-indigo-500" />
                                Update Password
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Ensure your account is using a long, random password to stay secure.</p>
                        </div>

                        <form onSubmit={submitPassword} className="p-6 space-y-6">
                            {passwordRecentlySuccessful && (
                                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle size={20} />
                                    <span className="text-sm font-medium">Password updated successfully!</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.current_password}
                                    onChange={(e) => setPasswordData('current_password', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                                {passwordErrors.current_password && <p className="mt-2 text-sm text-red-500">{passwordErrors.current_password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.password}
                                    onChange={(e) => setPasswordData('password', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                                {passwordErrors.password && <p className="mt-2 text-sm text-red-500">{passwordErrors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Confirm Password</label>
                                <input
                                    type="password"
                                    value={passwordData.password_confirmation}
                                    onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                                {passwordErrors.password_confirmation && <p className="mt-2 text-sm text-red-500">{passwordErrors.password_confirmation}</p>}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={passwordProcessing}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                                >
                                    <Lock size={18} />
                                    {passwordProcessing ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Delete Account Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-red-200 dark:border-red-900/50 overflow-hidden">
                        <div className="p-6 border-b border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <AlertTriangle size={20} />
                                Danger Zone
                            </h2>
                            <p className="text-sm text-red-500/80 mt-1">Once you delete your account, there is no going back. Please be certain.</p>
                        </div>

                        <div className="p-6">
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all"
                            >
                                <Trash2 size={18} />
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 m-4">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Are you sure?</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm.
                        </p>

                        <form onSubmit={deleteAccount}>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all mb-4"
                            />

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleteProcessing}
                                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all disabled:opacity-50"
                                >
                                    {deleteProcessing ? 'Deleting...' : 'Delete Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}

import React, { useState, useEffect } from 'react';
import { usePage, Head, Link, useForm, router } from '@inertiajs/react';
import {
    Key, ArrowRight, ArrowLeft, Loader2, AlertCircle, Store, Mail, CheckCircle, RefreshCw, X
} from 'lucide-react';

function InviteCard({ invite, onDismiss }) {
    const [accepting, setAccepting] = useState(false);

    return (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Mail size={16} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">
                    Invited to <span className="text-emerald-300">{invite.store_name}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                    As <span className="capitalize font-medium text-slate-300">{invite.role}</span> · {invite.plan} plan
                </p>
                <div className="flex gap-2 mt-3">
                    <Link
                        href={invite.accept_url}
                        onClick={() => setAccepting(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-400 transition-colors"
                    >
                        <CheckCircle size={12} /> Accept
                    </Link>
                    <button
                        onClick={onDismiss}
                        className="px-3 py-1.5 rounded-lg text-slate-400 text-xs hover:text-slate-200 hover:bg-white/5 transition-colors"
                    >
                        Ignore
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Store/Join.jsx — Definitive Plan
 *
 * Join a store by entering its 7-character join code (e.g. VQ-A3F9).
 * Anyone with the code becomes a Cashier in that store (default role).
 * Store owner can upgrade the role later from the Staff page.
 *
 * URL: /join
 */
export default function JoinStore({ pending_invites = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        join_code: '',
    });

    const [invites, setInvites] = useState(pending_invites);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [checkingCode, setCheckingCode] = useState(false);
    const [codeError, setCodeError] = useState('');

    // Auto-show modal if there are pending invites on load
    useEffect(() => {
        if (invites.length > 0) {
            setShowCodeModal(true);
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('store.join.submit'));
    };

    const handleCheckCode = async (e) => {
        e.preventDefault();
        setCheckingCode(true);
        setCodeError('');

        try {
            const response = await window.axios.post(route('invite.validate-code'), { code: inviteCode });
            if (response.data.valid) {
                router.visit(route('invite.accept', { token: response.data.invitation.token }));
            }
        } catch (error) {
            setCodeError(error.response?.data?.message || 'Invalid or expired invite code.');
            setCheckingCode(false);
        }
    };

    const dismissInvite = (token) => {
        setInvites(prev => prev.filter(i => i.token !== token));
    };

    const formatCode = (raw) => {
        const cleaned = raw.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        return cleaned;
    };

    return (
        <div className="min-h-screen bg-[#02000f] text-white font-sans flex flex-col">
            <Head title="Join a Store — VenQore" />

            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-emerald-900/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-[100px]" />
            </div>

            {/* Nav */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <img src="/images/logo.png" alt="VenQore" className="h-8 w-8 object-contain" />
                    <span className="font-black text-lg text-white">VenQore<span className="text-indigo-400">.</span></span>
                </div>
                <Link
                    href={route('store.create-or-join')}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={14} /> Back
                </Link>
            </header>

            <div className="relative z-10 flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mb-5">
                            <Key size={24} className="text-emerald-400" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
                            Join a Store
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Ask your store owner for the 7-character join code.
                        </p>
                    </div>

                    {/* Check Invites Button */}
                    <div className="flex justify-center mb-10">
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                setShowCodeModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-sm hover:bg-indigo-500/20 transition-all relative"
                        >
                            <Mail size={16} /> 
                            {invites.length > 0 ? `View Pending Invites (${invites.length})` : 'Check for Invites'}
                            {invites.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Store Join Code <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="join-code"
                                type="text"
                                value={data.join_code}
                                onChange={e => setData('join_code', formatCode(e.target.value))}
                                placeholder="VQ-XXXX"
                                maxLength={7}
                                className={`w-full px-5 py-4 rounded-xl bg-white/5 border text-white placeholder-slate-600
                                    font-mono text-2xl tracking-[0.25em] text-center uppercase
                                    focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-colors
                                    ${errors.join_code ? 'border-red-500 bg-red-500/5' : 'border-white/10 hover:border-white/20'}`}
                                autoFocus
                            />
                            {errors.join_code && (
                                <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
                                    <AlertCircle size={12} /> {errors.join_code}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="rounded-xl border border-white/8 bg-white/3 p-4 text-xs text-slate-400 space-y-1.5">
                            <div className="flex items-start gap-2">
                                <Store size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                                <span>You'll join as a <strong className="text-slate-200">Cashier</strong> by default. The store owner can update your role.</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Key size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                                <span>The code can be found in the store's <strong className="text-slate-200">Staff Settings</strong> page.</span>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            id="join-store-submit"
                            type="submit"
                            disabled={processing || data.join_code.length < 6}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl
                                bg-gradient-to-r from-emerald-500 to-teal-600
                                hover:from-emerald-400 hover:to-teal-500
                                text-white font-bold text-base transition-all
                                hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/25
                                disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <><Loader2 size={18} className="animate-spin" /> Joining…</>
                            ) : (
                                <><Key size={18} /> Join Store <ArrowRight size={16} /></>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-slate-600 mt-6">
                        Want to create your own store?{' '}
                        <Link href={route('store.create')} className="text-slate-400 hover:text-indigo-400 transition-colors underline underline-offset-2">
                            Create a store
                        </Link>
                    </p>

                </div>
            </div>

            {/* Invite Code Modal */}
            {showCodeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[85vh]">
                        
                        {/* Modal Bg Decals */}
                        <div className="absolute top-0 right-0 p-8 pt-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mt-10 -mr-10 pointer-events-none"></div>
                        
                        <div className="p-8 shrink-0">
                            <h2 className="text-xl font-black text-white mb-2">
                                Pending Invitations
                            </h2>
                            <p className="text-sm text-slate-400">
                                Manage your pending store invitations or join via short code.
                            </p>
                        </div>
                        
                        <div className="px-8 pb-4 overflow-y-auto min-h-0 space-y-3 custom-scrollbar text-left">
                            {invites.length > 0 ? (
                                invites.map(invite => (
                                    <InviteCard
                                        key={invite.token}
                                        invite={invite}
                                        onDismiss={() => dismissInvite(invite.token)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-6 rounded-2xl border border-slate-800 bg-slate-800/30">
                                    <Mail size={24} className="text-slate-600 mx-auto mb-2" />
                                    <p className="text-slate-400 text-sm">You have no pending invitations.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 shrink-0 border-t border-slate-800 bg-slate-900/50">
                            <h3 className="text-sm font-bold text-slate-300 mb-3 text-left">Have a short code?</h3>
                            <form onSubmit={handleCheckCode}>
                                <input
                                    type="text"
                                    placeholder="e.g. VQ-A3X9"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    className="w-full bg-slate-800 border items-center text-center font-mono tracking-[0.2em] border-slate-700 text-white text-lg rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-inner"
                                />
                                {codeError && (
                                    <p className="text-xs font-bold text-red-400 mt-2 flex items-center gap-1 justify-center">
                                        <AlertCircle size={12} /> {codeError}
                                    </p>
                                )}
                                
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCodeModal(false)}
                                        className="flex-1 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={checkingCode || !inviteCode}
                                        className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-colors shadow-lg shadow-indigo-600/20"
                                    >
                                        {checkingCode ? 'Checking...' : 'Check Code'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

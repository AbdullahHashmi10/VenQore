import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Store, Plus, ArrowRight, Clock, Crown, Zap, Users,
    ChevronRight, Mail, CheckCircle, Building2, Sparkles,
    AlertCircle, RefreshCw, Calculator, ShoppingBag
} from 'lucide-react';

/**
 * Hub/Index.jsx — Definitive Plan
 *
 * Store picker shown when a user has 2+ active stores.
 * Single-store users never see this — they go straight in after login.
 *
 * Features:
 *  - Lists all accessible stores with plan badge, role, and status
 *  - Shows pending invites as dismissible cards
 *  - "Create New Store" CTA
 *  - Last-used store highlighted
 */

const PLAN_CONFIG = {
    trial:    { label: 'Trial',    color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20' },
    starter:  { label: 'Starter',  color: 'text-slate-300',   bg: 'bg-slate-400/10',   border: 'border-slate-400/20' },
    growth:   { label: 'Growth',   color: 'text-indigo-300',  bg: 'bg-indigo-400/10',  border: 'border-indigo-400/20' },
    business: { label: 'Business', color: 'text-purple-300',  bg: 'bg-purple-400/10',  border: 'border-purple-400/20' },
    ltd:      { label: 'Lifetime', color: 'text-emerald-300', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
};

const ROLE_LABELS = {
    owner:   { label: 'Owner',   icon: Crown,   color: 'text-amber-400' },
    admin:   { label: 'Admin',   icon: Zap,     color: 'text-indigo-400' },
    manager: { label: 'Manager', icon: Users,   color: 'text-blue-400' },
    cashier: { label: 'Cashier', icon: Store,   color: 'text-emerald-400' },
    viewer:            { label: 'Viewer',            icon: Building2,    color: 'text-slate-400' },
    // PROBLEM 8 FIX: Added missing roles so they don't fall back to "Viewer"
    accountant:        { label: 'Accountant',       icon: Calculator,   color: 'text-blue-400' },
    purchasing_officer:{ label: 'Purchasing Officer', icon: ShoppingBag, color: 'text-orange-400' },
};

function PlanBadge({ plan }) {
    const cfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.starter;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            {cfg.label}
        </span>
    );
}

function RoleChip({ role }) {
    const cfg = ROLE_LABELS[role] ?? ROLE_LABELS.viewer;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
            <Icon size={11} /> {cfg.label}
        </span>
    );
}

function StoreCard({ membership, isLast }) {
    const [navigating, setNavigating] = useState(false);
    const daysLeft = membership.trial_ends_at
        ? Math.max(0, Math.ceil((new Date(membership.trial_ends_at) - Date.now()) / 86400000))
        : null;

    const go = () => {
        setNavigating(true);
        router.visit(membership.url);
    };

    return (
        <button
            onClick={go}
            disabled={navigating}
            className={`group w-full text-left rounded-2xl border p-5 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-indigo-500/10 active:scale-[0.99] disabled:opacity-60 ${
                isLast
                    ? 'border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-400/60'
                    : 'border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15'
            }`}
        >
            <div className="flex items-center gap-4">
                {/* Store avatar */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${
                    isLast ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/8 text-white'
                }`}>
                    {membership.store_name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-white truncate">{membership.store_name}</span>
                        {isLast && (
                            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 rounded-full px-2 py-0.5">
                                Last used
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <PlanBadge plan={membership.plan} />
                        <RoleChip role={membership.role} />
                        {daysLeft !== null && daysLeft <= 7 && (
                            <span className="flex items-center gap-1 text-xs text-amber-400">
                                <Clock size={10} />
                                {daysLeft === 0 ? 'Trial expired' : `${Math.ceil(daysLeft)}d left`}
                            </span>
                        )}
                    </div>
                </div>

                <div className={`shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${
                    navigating ? 'opacity-0' : ''
                }`}>
                    {navigating ? (
                        <RefreshCw size={18} className="text-indigo-400 animate-spin" />
                    ) : (
                        <ChevronRight size={18} className="text-slate-500 group-hover:text-indigo-400" />
                    )}
                </div>
            </div>
        </button>
    );
}

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

export default function HubIndex({ memberships = [], pending_invites = [] }) {
    const { props } = usePage();
    const settings = props.settings || {};
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

    const dismissInvite = (token) => {
        setInvites(prev => prev.filter(i => i.token !== token));
    };

    const handleCheckCode = async (e) => {
        e.preventDefault();
        setCheckingCode(true);
        setCodeError('');

        try {
            // Check the short code via the validation endpoint using Axios (standard Inertia pattern)
            const response = await window.axios.post(route('invite.validate-code'), { code: inviteCode });
            if (response.data.valid) {
                // If valid, redirect to the acceptance flow using the resolved token
                router.visit(route('invite.accept', { token: response.data.invitation.token }));
            }
        } catch (error) {
            setCodeError(error.response?.data?.message || 'Invalid or expired invite code.');
            setCheckingCode(false);
        }
    };

    const activeMemberships = memberships.filter(m => m.status !== 'suspended');
    const lastUsed = memberships.find(m => m.is_last_used);

    return (
        <div className="min-h-screen bg-[#02000f] text-white font-sans">
            <Head title="Your Stores — VenQore" />

            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-900/15 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-lg">

                    {/* Top right action */}
                    <div className="absolute top-0 right-0 p-6">
                        <Link 
                            href={route('logout')} 
                            method="post" 
                            as="button"
                            className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-2 group"
                        >
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">Sign out</span>
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-red-500/20 group-hover:border-red-500/40 transition-all">
                                <Zap size={14} className="group-hover:text-red-400" />
                            </div>
                        </Link>
                    </div>

                    {/* Logo + Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-5 shadow-xl overflow-hidden">
                            <img src={settings.logo_url || "/images/logo.png"} alt="Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">
                            Welcome back to {settings.app_name || 'VenQore'}
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Select a store to continue
                        </p>
                    </div>

                    {/* Check Invites Button */}
                    <div className="flex justify-center mb-6">
                        <button 
                            onClick={() => setShowCodeModal(true)}
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

                    {/* Store list */}
                    <div className="space-y-2 mb-6">
                        {activeMemberships.length === 0 ? (
                            <div className="text-center py-12 rounded-2xl border border-white/8 bg-white/3">
                                <AlertCircle size={32} className="text-slate-500 mx-auto mb-3" />
                                <p className="text-slate-400 text-sm">No active stores found</p>
                            </div>
                        ) : (
                            activeMemberships.map(m => (
                                <StoreCard
                                    key={m.store_id}
                                    membership={m}
                                    isLast={m.is_last_used}
                                />
                            ))
                        )}
                    </div>

                    <div className="border-t border-white/8 pt-5">
                        <Link
                            href={route('store.create')}
                            className="group flex items-center justify-between w-full px-5 py-4 rounded-2xl border border-dashed border-white/15 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all duration-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/5 group-hover:bg-indigo-500/15 border border-white/10 group-hover:border-indigo-500/30 flex items-center justify-center transition-all">
                                    <Plus size={16} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                                        Create a new store
                                    </p>
                                    <p className="text-xs text-slate-500">14-day free trial · No card required</p>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                    </div>

                    <p className="text-center text-xs text-slate-600 mt-4">
                        Have a permanent store code?{' '}
                        <Link href={route('store.join')} className="text-slate-400 hover:text-indigo-400 transition-colors underline underline-offset-2">
                            Join via link
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
                        
                        <div className="px-8 pb-4 overflow-y-auto min-h-0 space-y-3 custom-scrollbar">
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
                            <h3 className="text-sm font-bold text-slate-300 mb-3">Have a short code?</h3>
                            <form onSubmit={handleCheckCode}>
                                <input
                                    type="text"
                                    placeholder="e.g. VQ-A3X9"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    className="w-full bg-slate-800 border items-center text-center font-mono tracking-[0.2em] border-slate-700 text-white text-lg rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
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

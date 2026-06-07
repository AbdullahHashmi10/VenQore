import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Store, Plus, ArrowRight, Clock, Crown, Zap, Users,
    ChevronRight, Mail, CheckCircle, Building2, Sparkles,
    AlertCircle, RefreshCw
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
    viewer:  { label: 'Viewer',  icon: Building2, color: 'text-slate-400' },
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

    const dismissInvite = (token) => {
        setInvites(prev => prev.filter(i => i.token !== token));
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

                    {/* Pending invites */}
                    {invites.length > 0 && (
                        <div className="space-y-3 mb-6">
                            {invites.map(invite => (
                                <InviteCard
                                    key={invite.token}
                                    invite={invite}
                                    onDismiss={() => dismissInvite(invite.token)}
                                />
                            ))}
                        </div>
                    )}

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
                        Have a store join code?{' '}
                        <Link href={route('store.join')} className="text-slate-400 hover:text-indigo-400 transition-colors underline underline-offset-2">
                            Join a store
                        </Link>
                    </p>

                </div>
            </div>
        </div>
    );
}

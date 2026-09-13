import React, { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Store, Check, ArrowRight, Loader2, Plus, Search, X, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const PLAN_BADGES = {
    trial: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    starter: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    growth: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    business: 'bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-800',
    ltd: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
};

const ROLE_LABELS = {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    cashier: 'Cashier',
    accountant: 'Accountant',
    viewer: 'Viewer',
};

export default function StoreSwitcherModal({ isOpen, onClose }) {
    const { props } = usePage();
    const currentStore = props.store;
    const [stores, setStores] = useState(null);
    const [loading, setLoading] = useState(false);
    const [navigatingId, setNavigatingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const modalRef = useRef(null);

    // Fetch stores on modal open
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            if (stores === null) {
                setLoading(true);
                axios.get(route('my-stores.api'))
                    .then((res) => setStores(res.data || []))
                    .catch(() => setStores([]))
                    .finally(() => setLoading(false));
            }
        }
    }, [isOpen]);

    // Handle ESC key and scroll locking
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const filteredStores = (stores || []).filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            s.name?.toLowerCase().includes(q) ||
            s.plan?.toLowerCase().includes(q) ||
            s.role?.toLowerCase().includes(q)
        );
    });

    const handleSwitch = (s) => {
        if (s.store_id === currentStore?.id) {
            onClose();
            return;
        }
        setNavigatingId(s.store_id);
        onClose();
        router.visit(s.url);
    };

    return (
        <div
            className="fixed inset-0 z-modal bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="bg-surface rounded-2xl shadow-2xl border border-line dark:border-white/10 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-line flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                            <Store size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-ink">Switch Store</h3>
                                {stores && (
                                    <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                                        {stores.length} {stores.length === 1 ? 'store' : 'stores'}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-ink-muted mt-0.5">
                                Select an active store or organization to switch context
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search Bar */}
                {(stores && stores.length > 2) && (
                    <div className="px-4 py-3 border-b border-line bg-app/40">
                        <div className="relative flex items-center">
                            <Search size={15} className="absolute left-3 text-ink-muted" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search stores by name or role..."
                                className="w-full bg-surface border border-line rounded-xl pl-9 pr-4 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-brand-500"
                                autoFocus
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 text-ink-muted hover:text-ink text-xs"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Store List */}
                <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2.5 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-ink-muted">
                            <Loader2 size={28} className="animate-spin text-brand-500 mb-2" />
                            <p className="text-sm font-medium">Loading your stores...</p>
                        </div>
                    ) : filteredStores.length === 0 ? (
                        <div className="text-center py-10 text-ink-muted">
                            <Store size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-medium">
                                {searchQuery ? 'No matching stores found.' : 'No stores associated with your account.'}
                            </p>
                        </div>
                    ) : (
                        filteredStores.map((s) => {
                            const isCurrent = s.store_id === currentStore?.id;
                            const isNavigating = navigatingId === s.store_id;

                            return (
                                <div
                                    key={s.store_id}
                                    onClick={() => handleSwitch(s)}
                                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer group ${
                                        isCurrent
                                            ? 'border-brand-500/40 bg-brand-50/40 dark:bg-brand-950/20 shadow-xs ring-1 ring-brand-500/20'
                                            : 'border-line bg-surface hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Store Avatar */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                                            isCurrent
                                                ? 'bg-gradient-brand text-white'
                                                : 'bg-surface border border-line text-ink-secondary group-hover:border-brand-400 group-hover:text-brand-600 transition-colors'
                                        }`}>
                                            {s.name?.charAt(0).toUpperCase() || 'S'}
                                        </div>

                                        {/* Store Info */}
                                        <div className="min-w-0 text-left">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-ink truncate group-hover:text-brand-600 transition-colors">
                                                    {s.name}
                                                </h4>
                                                {isCurrent && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                        <Check size={10} /> Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded-md text-2xs font-bold capitalize border ${PLAN_BADGES[s.plan] || PLAN_BADGES.starter}`}>
                                                    {s.plan || 'Free'}
                                                </span>
                                                <span className="text-2xs text-ink-muted flex items-center gap-1 font-medium">
                                                    <ShieldCheck size={11} className="text-ink-muted" />
                                                    {ROLE_LABELS[s.role] || s.role || 'Member'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="shrink-0 ml-3">
                                        {isCurrent ? (
                                            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/30">
                                                Current
                                            </span>
                                        ) : isNavigating ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sunken text-ink-muted text-xs font-semibold">
                                                <Loader2 size={13} className="animate-spin text-brand-500" />
                                                <span>Switching...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-line group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-600 text-ink-secondary text-xs font-semibold transition-all">
                                                <span>Switch</span>
                                                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-line bg-app/50 flex items-center justify-between">
                    {currentStore && (
                        <button
                            onClick={() => {
                                onClose();
                                router.visit(route('store.create', { store_slug: currentStore.slug }));
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                        >
                            <Plus size={14} />
                            <span>Create New Store</span>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="ml-auto px-4 py-2 rounded-xl text-xs font-bold text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

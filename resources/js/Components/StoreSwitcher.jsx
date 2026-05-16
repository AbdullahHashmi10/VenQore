import React, { useState, useRef, useEffect, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Store, ChevronDown, Plus, Check, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';

/**
 * StoreSwitcher.jsx — Definitive Plan
 *
 * In-app store switcher dropdown shown in the sidebar.
 * Lazy-loads the list from /api/my-stores on first open.
 * Clicking a store navigates to its dashboard.
 *
 * Props:
 *   currentStore  — { id, name, plan, status } (from Inertia shared data)
 *   myRole        — the user's role in the current store
 *
 * Usage (in AuthenticatedLayout.jsx):
 *   <StoreSwitcher />
 */

const PLAN_COLORS = {
    trial:    'text-amber-400',
    starter:  'text-slate-400',
    growth:   'text-indigo-400',
    business: 'text-purple-400',
    ltd:      'text-emerald-400',
};

export default function StoreSwitcher() {
    const { props } = usePage();
    const store    = props.store;
    const myRole   = props.my_role;

    const [open, setOpen]       = useState(false);
    const [stores, setStores]   = useState(null);  // null = not loaded yet
    const [loading, setLoading] = useState(false);
    const [navigating, setNav]  = useState(null);

    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const loadStores = useCallback(async () => {
        if (stores !== null) return;
        setLoading(true);
        try {
            const res = await axios.get(route('my-stores.api'));
            setStores(res.data);
        } catch {
            setStores([]);
        } finally {
            setLoading(false);
        }
    }, [stores]);

    const toggle = () => {
        if (!open) loadStores();
        setOpen(prev => !prev);
    };

    const switchTo = (s) => {
        if (s.store_id === store?.id) {
            setOpen(false);
            return;
        }
        setNav(s.store_id);
        setOpen(false);
        router.visit(s.url);
    };

    if (!store) return null;

    const planColor = PLAN_COLORS[store.plan] ?? 'text-slate-400';

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                onClick={toggle}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300 border
                    ${open
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
                    }`}
                aria-label="Switch store"
                aria-expanded={open}
            >
                {/* Store avatar */}
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm leading-none">
                    {store.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0 text-left hidden lg:block">
                    <p className="text-sm font-bold truncate leading-tight">{store.name}</p>
                </div>

                <ChevronDown
                    size={14}
                    className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`}
                />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute left-0 right-0 mt-1 z-50 rounded-xl border border-white/12 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">

                    {/* Header */}
                    <div className="px-3 py-2 border-b border-white/8">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Your Stores</p>
                    </div>

                    {/* Store list */}
                    <div className="p-1 max-h-64 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 size={16} className="animate-spin text-slate-500" />
                            </div>
                        ) : stores?.length === 0 ? (
                            <p className="text-xs text-slate-500 text-center py-4">No other stores</p>
                        ) : (
                            stores?.map(s => {
                                const isCurrent = s.store_id === store.id;
                                return (
                                    <button
                                        key={s.store_id}
                                        onClick={() => switchTo(s)}
                                        disabled={navigating === s.store_id}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left
                                            ${isCurrent
                                                ? 'bg-indigo-500/10 text-white cursor-default'
                                                : 'text-slate-300 hover:bg-white/6 hover:text-white active:scale-[0.98]'
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                            isCurrent ? 'bg-indigo-500/25 text-indigo-300' : 'bg-white/8 text-slate-300'
                                        }`}>
                                            {s.name.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate leading-tight">{s.name}</p>
                                            <p className={`text-[10px] capitalize leading-tight ${PLAN_COLORS[s.plan] ?? 'text-slate-500'}`}>
                                                {s.plan} · {s.role}
                                            </p>
                                        </div>

                                        {isCurrent ? (
                                            <Check size={13} className="text-indigo-400 shrink-0" />
                                        ) : navigating === s.store_id ? (
                                            <Loader2 size={13} className="animate-spin text-slate-500 shrink-0" />
                                        ) : (
                                            <ArrowRight size={13} className="text-slate-600 shrink-0" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer: create new store */}
                    <div className="p-1 border-t border-white/8">
                        <button
                            onClick={() => { setOpen(false); router.visit(route('store.create', { store_slug: store.slug })); }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/8 transition-all text-sm"
                        >
                            <Plus size={14} />
                            <span className="font-medium">Create new store</span>
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
}

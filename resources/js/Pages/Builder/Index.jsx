import React, { useMemo, useState, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    Sparkles, ArrowRight, Check, X, AlertTriangle, Loader2,
    PlusCircle, MinusCircle, HelpCircle, ShieldAlert, Search,
    Store, Layers, Package, Wrench, ScanBarcode, FileText,
    FileSignature, Truck, RotateCcw, Gift, FileMinus, Users,
    Factory, Boxes, Warehouse, ArrowLeftRight, SlidersHorizontal,
    CalendarClock, Barcode, Scan, Bell, Scale, RefreshCw,
    ShoppingCart, ClipboardList, PackageCheck, Undo2, FilePlus,
    Coins, Globe, Cog, ClipboardCheck, BadgeCheck, Receipt,
    Landmark, GitCompare, BookUser, Calculator, CalendarCheck,
    BarChart3, ShieldCheck, Send, ChefHat, UtensilsCrossed,
    CheckCircle2, Star, Filter, Info, ChevronRight, CheckCheck,
} from 'lucide-react';
import Toggle from '@/Components/Toggle';

const GROUP_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const GROUP_THEMES = {
    A: { name: 'Catalog', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
    B: { name: 'Sell', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    C: { name: 'Stock', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    D: { name: 'Buy', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    E: { name: 'Make', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    F: { name: 'Money', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
    G: { name: 'Grow', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
};

const MODULE_ICONS = {
    products: Package,
    services: Wrench,
    pos: ScanBarcode,
    park_recall: SlidersHorizontal,
    layaway: CalendarClock,
    invoicing: FileText,
    quotations: FileSignature,
    delivery_challan: Truck,
    sales_returns: RotateCcw,
    promotions_discounts: Gift,
    credit_notes: FileMinus,
    price_tiers: Layers,
    customers: Users,
    suppliers: Factory,
    sales_reps: Users,
    inventory: Boxes,
    multi_warehouse: Warehouse,
    stock_transfers: ArrowLeftRight,
    stock_adjustments: SlidersHorizontal,
    batch_tracking: CalendarClock,
    batches_expiry: CalendarClock,
    serial_tracking: Barcode,
    serials: Barcode,
    barcodes_labels: Scan,
    low_stock_alerts: Bell,
    uom_conversions: Scale,
    reorder_automation: RefreshCw,
    purchases: ShoppingCart,
    purchase_requisitions: ClipboardList,
    goods_received: PackageCheck,
    purchase_returns: Undo2,
    debit_notes: FilePlus,
    landed_costs: Coins,
    supplier_portal: Globe,
    manufacturing: Cog,
    bom_assembly: Cog,
    work_orders: ClipboardCheck,
    quality_inspections: BadgeCheck,
    expenses: Receipt,
    payments: Landmark,
    bank_accounts: Landmark,
    bank_reconciliation: GitCompare,
    khata_credit: BookUser,
    tax_engine: Calculator,
    payroll_light: CalendarCheck,
    staff_attendance: CalendarCheck,
    reports: BarChart3,
    audit_trail: ShieldCheck,
    e_invoicing: Send,
    cookbook: ChefHat,
    table_service: UtensilsCrossed,
};

const SPRING = { type: 'spring', stiffness: 400, damping: 34, mass: 0.8 };

export default function BuilderIndex({
    modules: rawModules = [],
    builderModules = null,
    groupLabels = {},
    highlight = null,
    businessType = null,
    businessLabel = null,
    businessSector = null,
    businessPreset = null,
    recommendedModules = [],
}) {
    const modules = builderModules || (Array.isArray(rawModules) && typeof rawModules[0] === 'object' ? rawModules : []);
    const { store } = usePage().props;
    const still = useReducedMotion();

    const [moduleState, setModuleState] = useState(() =>
        Object.fromEntries(modules.map((m) => [m.key, !!m.enabled]))
    );
    const [busy, setBusy] = useState(false);
    const [preview, setPreview] = useState(null);
    const [pendingDisable, setPendingDisable] = useState(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [modifyText, setModifyText] = useState('');
    const [modifyBusy, setModifyBusy] = useState(false);
    const [modifyResult, setModifyResult] = useState(null);

    // Filters and search state
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'enabled' | 'disabled' | 'recommended' | group letter (A-G)
    const [sortBy, setSortBy] = useState('recommended'); // 'recommended' | 'active' | 'name' | 'group'

    const byKey = useMemo(() => Object.fromEntries(modules.map((m) => [m.key, m])), [modules]);

    const dirty = useMemo(
        () => modules.some((m) => !!moduleState[m.key] !== !!m.enabled),
        [moduleState, modules]
    );

    const highlightMod = highlight ? byKey[highlight] : null;

    const routeArgs = (extra = {}) => ({ store_slug: store?.slug, ...extra });

    const totalCount = modules.length;
    const enabledCount = useMemo(() => Object.values(moduleState).filter(Boolean).length, [moduleState]);
    const recommendedCount = useMemo(() => modules.filter((m) => m.recommended).length, [modules]);

    const runPreview = async (nextState) => {
        setBusy(true);
        setError('');
        try {
            const keys = Object.keys(nextState).filter((k) => nextState[k]);
            const { data } = await axios.post(route('store.builder.preview', routeArgs()), { modules: keys });
            if (data.success) {
                setPreview(data);
                const synced = {};
                modules.forEach((m) => { synced[m.key] = data.modules.includes(m.key); });
                setModuleState(synced);
            }
        } catch (e) {
            setError(e?.response?.data?.message || "Couldn't check that change — try again.");
        } finally {
            setBusy(false);
        }
    };

    const handleToggleOn = (mod) => {
        setError('');
        setNotice('');
        const next = { ...moduleState, [mod.key]: true };
        setModuleState(next);
        runPreview(next);
    };

    const startDisable = async (mod) => {
        setError('');
        setNotice('');
        setBusy(true);
        try {
            const { data } = await axios.get(
                route('store.builder.data-at-stake', routeArgs({ module: mod.key }))
            );
            if (data.success) {
                setPendingDisable({ module: mod, atStake: data.at_stake || {}, cascade: data.cascade || [mod.key] });
            }
        } catch (e) {
            setError(e?.response?.data?.message || "Couldn't check that module — try again.");
        } finally {
            setBusy(false);
        }
    };

    const confirmDisable = () => {
        if (!pendingDisable) return;
        const next = { ...moduleState };
        pendingDisable.cascade.forEach((k) => { next[k] = false; });
        setPendingDisable(null);
        setModuleState(next);
        runPreview(next);
    };

    const answerQuestion = (optionKey) => {
        const next = { ...moduleState, [optionKey]: true };
        setModuleState(next);
        runPreview(next);
    };

    const resolveBlockTogether = (blockedKey, dependents) => {
        const next = { ...moduleState };
        next[blockedKey] = false;
        dependents.forEach((k) => { next[k] = false; });
        setModuleState(next);
        runPreview(next);
    };

    const discardChanges = () => {
        setModuleState(Object.fromEntries(modules.map((m) => [m.key, !!m.enabled])));
        setPreview(null);
        setError('');
        setNotice('');
    };

    const applyChanges = async () => {
        setBusy(true);
        setError('');
        try {
            const keys = Object.keys(moduleState).filter((k) => moduleState[k]);
            const { data } = await axios.post(route('store.builder.apply', routeArgs()), { modules: keys });
            if (data.success) {
                setNotice('Saved — your modules and workspace are updated.');
                router.reload();
            }
        } catch (e) {
            const resp = e?.response?.data;
            if (resp?.reason === 'questions_pending') {
                setPreview((p) => ({ ...p, questions: resp.questions }));
                setError('Answer the question below, then save again.');
            } else if (resp?.reason === 'disable_blocked') {
                setError(resp.message);
            } else {
                setError(resp?.message || "Couldn't save changes — try again.");
            }
        } finally {
            setBusy(false);
        }
    };

    const enableAllRecommended = () => {
        const next = { ...moduleState };
        modules.forEach((m) => {
            if (m.recommended) {
                next[m.key] = true;
            }
        });
        setModuleState(next);
        runPreview(next);
    };

    const submitModify = async (e) => {
        e.preventDefault();
        if (!modifyText.trim()) return;
        setModifyBusy(true);
        setModifyResult(null);
        try {
            const { data } = await axios.post(route('store.builder.modify', routeArgs()), { text: modifyText });
            setModifyResult(data);
            if (data.success && data.intent !== 'ADD_CARD') {
                setModifyText('');
                router.reload();
            }
        } catch (e) {
            setModifyResult(e?.response?.data || { success: false, message: "Couldn't process that — try again." });
        } finally {
            setModifyBusy(false);
        }
    };

    const questions = preview?.questions || [];
    const blocks = preview?.blocks || {};
    const hasBlocks = Object.keys(blocks).length > 0;
    const addedEntries = Object.entries(preview?.added || {});

    // Filtered & Sorted Modules list
    const filteredModules = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        let list = modules.filter((m) => {
            // Text search
            if (q) {
                const inLabel = (m.label || '').toLowerCase().includes(q);
                const inDesc = (m.description || '').toLowerCase().includes(q);
                const inKey = m.key.toLowerCase().includes(q);
                const inOpens = (m.opens || '').toLowerCase().includes(q);
                const inAliases = Array.isArray(m.aliases) && m.aliases.some((a) => a.toLowerCase().includes(q));
                if (!inLabel && !inDesc && !inKey && !inOpens && !inAliases) return false;
            }

            // Tab filter
            if (activeFilter === 'enabled') return !!moduleState[m.key];
            if (activeFilter === 'disabled') return !moduleState[m.key];
            if (activeFilter === 'recommended') return !!m.recommended;
            if (GROUP_ORDER.includes(activeFilter)) return m.group === activeFilter;
            return true;
        });

        // Sorting
        list = [...list].sort((a, b) => {
            if (sortBy === 'recommended') {
                if (a.recommended && !b.recommended) return -1;
                if (!a.recommended && b.recommended) return 1;
                if (!!moduleState[a.key] !== !!moduleState[b.key]) return moduleState[a.key] ? -1 : 1;
                return a.label.localeCompare(b.label);
            }
            if (sortBy === 'active') {
                if (!!moduleState[a.key] !== !!moduleState[b.key]) return moduleState[a.key] ? -1 : 1;
                return a.label.localeCompare(b.label);
            }
            if (sortBy === 'name') {
                return a.label.localeCompare(b.label);
            }
            if (sortBy === 'group') {
                const gDiff = a.group.localeCompare(b.group);
                if (gDiff !== 0) return gDiff;
                return a.label.localeCompare(b.label);
            }
            return 0;
        });

        return list;
    }, [modules, moduleState, searchQuery, activeFilter, sortBy]);

    const allRecommendedActive = useMemo(() => {
        const recs = modules.filter((m) => m.recommended);
        return recs.length > 0 && recs.every((m) => !!moduleState[m.key]);
    }, [modules, moduleState]);

    return (
        <OneGlanceLayout title="Builder" activeMenu="Settings">
            <Head title="Modules & Capabilities" />

            <div className="w-full max-w-[1920px] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
                
                {/* ── Top Header & Business Banner ────────────────────────────── */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-brand-600">
                            <Sparkles size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Module Suite &amp; Workspace Builder</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-ink mt-1">Manage Business Modules</h1>
                        <p className="text-sm text-ink-muted mt-1 max-w-3xl">
                            Turn capabilities on or off anytime. Modules adapt your dashboards, registers, documents, and navigation seamlessly without deleting any existing records.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            href={route('store.onboarding.v2', routeArgs())}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-line bg-surface text-xs font-semibold text-ink-secondary hover:text-brand-600 hover:border-brand-500/50 shadow-sm transition-all"
                        >
                            <Sparkles size={14} className="text-brand-600" />
                            Run AI Setup Wizard
                        </Link>
                    </div>
                </div>

                {/* ── Active Business Profile Card ─────────────────────────────── */}
                <div className="rounded-2xl border border-line bg-gradient-to-r from-surface via-surface to-brand-500/5 p-5 sm:p-6 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-600 shrink-0 shadow-inner">
                                <Store size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-500/10 px-2.5 py-0.5 rounded-full border border-brand-500/20">
                                        Active Business Profile
                                    </span>
                                    {businessSector && (
                                        <span className="text-xs font-medium text-ink-muted bg-sunken px-2.5 py-0.5 rounded-full border border-line">
                                            Sector: {businessSector.replace(/_/g, ' ')}
                                        </span>
                                    )}
                                    {businessPreset && (
                                        <span className="text-xs font-medium text-ink-muted bg-sunken px-2.5 py-0.5 rounded-full border border-line">
                                            Preset: {businessPreset.replace(/_/g, ' ')}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-ink mt-1.5 capitalize">
                                    {businessLabel || (businessType ? businessType.replace(/_/g, ' ') : 'General Store & Services')}
                                </h2>
                                <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
                                    Configured with tailored defaults, terminology, and {recommendedCount} recommended core modules for your trade.
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats & Actions */}
                        <div className="flex items-center gap-4 sm:gap-6 shrink-0 border-t md:border-t-0 md:border-l border-line pt-4 md:pt-0 md:pl-6">
                            <div className="flex items-center gap-4 text-center">
                                <div>
                                    <div className="text-xl font-bold text-ink font-numeric">{enabledCount} <span className="text-xs font-normal text-ink-muted">/ {totalCount}</span></div>
                                    <div className="text-3xs uppercase font-semibold text-ink-muted tracking-wider">Active</div>
                                </div>
                                <div className="w-px h-8 bg-line" />
                                <div>
                                    <div className="text-xl font-bold text-amber-600 font-numeric">{recommendedCount}</div>
                                    <div className="text-3xs uppercase font-semibold text-ink-muted tracking-wider">Recommended</div>
                                </div>
                            </div>

                            {recommendedCount > 0 && (
                                <button
                                    type="button"
                                    onClick={enableAllRecommended}
                                    disabled={busy || allRecommendedActive}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0 ${
                                        allRecommendedActive
                                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 cursor-default'
                                            : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95'
                                    }`}
                                >
                                    {allRecommendedActive ? (
                                        <>
                                            <CheckCheck size={14} />
                                            <span>All Recommended Active</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={14} />
                                            <span>Enable Recommended ({recommendedCount})</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Highlighted missing module banner ────────────────────────── */}
                {highlightMod && !moduleState[highlightMod.key] && (
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-brand-500/40 bg-brand-500/10 shadow-sm animate-pulse">
                        <div className="flex items-center gap-3">
                            <ShieldAlert size={22} className="text-brand-600 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-ink">
                                    You tried accessing <span className="text-brand-600">{highlightMod.label}</span>
                                </p>
                                <p className="text-xs text-ink-muted">
                                    This module is currently disabled. Turn it on below to unlock its pages, register workflows, and reports.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleToggleOn(highlightMod)}
                            className="shrink-0 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-sm"
                        >
                            Turn on {highlightMod.label}
                        </button>
                    </div>
                )}

                {/* ── Natural Language Prompt Bar ─────────────────────────────── */}
                <div className="p-4 rounded-2xl border border-line bg-surface/80 shadow-sm">
                    <form onSubmit={submitModify} className="flex flex-col sm:flex-row gap-2.5">
                        <div className="relative flex-1">
                            <Sparkles size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-600 pointer-events-none" />
                            <input
                                id="vq-builder-modify"
                                type="text"
                                value={modifyText}
                                onChange={(e) => setModifyText(e.target.value)}
                                placeholder='Type what you want: e.g. "turn on invoicing and batch tracking" or "call customers patients"'
                                className="w-full pl-10 pr-4 py-2.5 bg-sunken border border-line rounded-xl text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                maxLength={200}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={modifyBusy || !modifyText.trim()}
                            className="px-4 py-2.5 rounded-xl bg-ink text-surface text-xs sm:text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shrink-0"
                        >
                            {modifyBusy ? <Loader2 size={16} className="animate-spin" /> : <span>Apply Instruction</span>}
                            {!modifyBusy && <ArrowRight size={14} />}
                        </button>
                    </form>
                    {modifyResult && (
                        <div
                            className={`mt-2.5 text-xs rounded-xl px-3 py-2 flex items-center justify-between ${
                                modifyResult.success
                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                                    : 'bg-red-500/10 text-red-600 border border-red-500/30'
                            }`}
                        >
                            <span>{modifyResult.message}</span>
                            {modifyResult.intent === 'ADD_CARD' && (
                                <button
                                    type="button"
                                    onClick={() => router.visit(route('store.dashboard', routeArgs()))}
                                    className="ml-2 underline font-semibold text-brand-600"
                                >
                                    Go to dashboard
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-600 flex items-center gap-2">
                        <AlertTriangle size={16} className="shrink-0" /> {error}
                    </div>
                )}

                {questions.map((q) => (
                    <div key={q.for} className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 shadow-sm">
                        <div className="flex items-start gap-3">
                            <HelpCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-ink font-semibold">{q.prompt}</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {q.options.map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => answerQuestion(opt)}
                                            className="px-3.5 py-1.5 rounded-lg bg-surface border border-line text-xs font-bold text-ink hover:border-brand-500 hover:text-brand-600 transition-colors shadow-sm"
                                        >
                                            {byKey[opt]?.label || opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {hasBlocks && (
                    <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 space-y-3 shadow-sm">
                        {Object.entries(blocks).map(([key, verdict]) => (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-2">
                                    <ShieldAlert size={18} className="text-red-600 shrink-0 mt-0.5" />
                                    <p className="text-xs sm:text-sm text-ink">{verdict.message}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => resolveBlockTogether(key, verdict.dependents)}
                                    className="shrink-0 px-3 py-1.5 rounded-lg bg-surface border border-red-500/30 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                                >
                                    Turn these off together
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Filter & Search Controls ─────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, key, description, or capabilities…"
                            className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-9 text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                aria-label="Clear search"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-muted hover:bg-sunken hover:text-ink"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Sorting dropdown */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                        <span className="text-xs text-ink-muted font-medium">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="h-10 px-3 py-1.5 bg-surface border border-line rounded-xl text-xs font-semibold text-ink focus:ring-2 focus:ring-brand-500 outline-none shadow-sm cursor-pointer"
                        >
                            <option value="recommended">Recommended first</option>
                            <option value="active">Active first</option>
                            <option value="name">Name (A–Z)</option>
                            <option value="group">Group order</option>
                        </select>
                    </div>
                </div>

                {/* ── Category & Group Filter Pills ────────────────────────────── */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                        type="button"
                        onClick={() => setActiveFilter('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                            activeFilter === 'all'
                                ? 'bg-ink text-surface border-ink shadow-sm'
                                : 'bg-surface text-ink-secondary border-line hover:border-line-strong'
                        }`}
                    >
                        All <span className="opacity-70 font-numeric">({totalCount})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveFilter('enabled')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                            activeFilter === 'enabled'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-surface text-emerald-600 border-line hover:border-emerald-500/40'
                        }`}
                    >
                        ✓ Active <span className="opacity-80 font-numeric">({enabledCount})</span>
                    </button>

                    {recommendedCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setActiveFilter('recommended')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                                activeFilter === 'recommended'
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                    : 'bg-surface text-amber-600 border-line hover:border-amber-500/40'
                            }`}
                        >
                            <Star size={12} className="fill-current" />
                            <span>Recommended <span className="opacity-80 font-numeric">({recommendedCount})</span></span>
                        </button>
                    )}

                    <div className="w-px h-5 bg-line shrink-0 mx-1" />

                    {GROUP_ORDER.map((g) => {
                        const count = modules.filter((m) => m.group === g).length;
                        if (!count) return null;
                        const theme = GROUP_THEMES[g] || GROUP_THEMES.G;
                        const label = groupLabels[g] || theme.name;
                        const isSelected = activeFilter === g;

                        return (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setActiveFilter(isSelected ? 'all' : g)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                                    isSelected
                                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                        : 'bg-surface text-ink-secondary border-line hover:border-line-strong'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : theme.color.replace('text-', 'bg-')}`} />
                                <span>{g} · {label}</span>
                                <span className="opacity-60 font-numeric text-3xs">({count})</span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Cards Grid ──────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
                    <AnimatePresence initial={false}>
                        {filteredModules.map((m, mi) => {
                            const isEnabled = !!moduleState[m.key];
                            const isHighlighted = highlight === m.key;
                            const IconCmp = MODULE_ICONS[m.key] || Layers;
                            const theme = GROUP_THEMES[m.group] || GROUP_THEMES.G;
                            const groupName = groupLabels[m.group] || theme.name;

                            return (
                                <motion.div
                                    key={m.key}
                                    layout={!still}
                                    initial={still ? false : { opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{
                                        duration: 0.22,
                                        delay: Math.min(mi, 12) * 0.015,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className={`group relative rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 shadow-sm ${
                                        isHighlighted
                                            ? 'ring-2 ring-brand-500 border-brand-500 bg-brand-500/5 shadow-md'
                                            : isEnabled
                                              ? 'border-brand-500/40 bg-gradient-to-b from-brand-500/[0.04] to-transparent shadow-brand-500/5'
                                              : 'border-line bg-surface hover:border-line-strong hover:shadow'
                                    }`}
                                >
                                    <div>
                                        {/* Card Header: Icon + Group + Toggle */}
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                                        isEnabled
                                                            ? 'bg-brand-600 text-white shadow-sm'
                                                            : 'bg-sunken text-ink-muted group-hover:text-ink'
                                                    }`}
                                                >
                                                    <IconCmp size={18} strokeWidth={2} />
                                                </div>
                                                <div>
                                                    <span className="inline-block text-3xs font-bold uppercase tracking-wider text-ink-muted bg-sunken px-2 py-0.5 rounded-md border border-line">
                                                        {m.group} · {groupName}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Toggle switch */}
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Toggle
                                                    enabled={isEnabled}
                                                    onChange={(next) => (next ? handleToggleOn(m) : startDisable(m))}
                                                    disabled={busy}
                                                />
                                            </div>
                                        </div>

                                        {/* Title and Badges */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-ink text-base group-hover:text-brand-600 transition-colors">
                                                    {m.label}
                                                </h3>
                                                {m.recommended && (
                                                    <span className="inline-flex items-center gap-1 text-3xs font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                                        <Star size={10} className="fill-current" /> Recommended
                                                    </span>
                                                )}
                                                {isEnabled && (
                                                    <span className="inline-flex items-center gap-1 text-3xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                                        <Check size={10} strokeWidth={3} /> Active
                                                    </span>
                                                )}
                                            </div>

                                            {/* Description */}
                                            <p className="text-xs text-ink-muted leading-relaxed">
                                                {m.description || 'Core business capabilities and data workflows.'}
                                            </p>
                                        </div>

                                        {/* What it opens for */}
                                        {m.opens && (
                                            <div className="mt-3 pt-2.5 border-t border-line/60">
                                                <span className="block text-3xs font-bold uppercase text-ink-muted tracking-wider">
                                                    Unlocks for:
                                                </span>
                                                <p className="text-2xs text-ink-secondary mt-0.5 leading-snug">
                                                    {m.opens}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Footer: Metadata and relationships */}
                                    <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-2 flex-wrap text-3xs text-ink-muted font-medium">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {m.cards_count > 0 && (
                                                <span className="inline-flex items-center gap-1 bg-sunken px-2 py-0.5 rounded-md border border-line text-ink-secondary" title="Analytics metrics provided on your dashboard">
                                                    <BarChart3 size={11} className="text-brand-600" />
                                                    <span>{m.cards_count} Metrics</span>
                                                </span>
                                            )}

                                            {m.requires && m.requires.length > 0 && (
                                                <span className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md border border-amber-500/20" title="Requires other modules">
                                                    Needs: {m.requires.map(k => byKey[k]?.label || k).join(', ')}
                                                </span>
                                            )}

                                            {m.enhances && m.enhances.length > 0 && (
                                                <span className="bg-sunken px-2 py-0.5 rounded-md border border-line" title="Integrates with other modules">
                                                    Works with: {m.enhances.slice(0, 2).map(k => byKey[k]?.label || k).join(', ')}
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => (isEnabled ? startDisable(m) : handleToggleOn(m))}
                                            disabled={busy}
                                            className={`text-xs font-bold hover:underline shrink-0 ${
                                                isEnabled ? 'text-red-500' : 'text-brand-600'
                                            }`}
                                        >
                                            {isEnabled ? 'Turn off' : 'Turn on'}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {filteredModules.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center text-ink-muted mx-auto">
                            <Search size={20} />
                        </div>
                        <h3 className="text-base font-bold text-ink">No modules found matching &ldquo;{searchQuery}&rdquo;</h3>
                        <p className="text-xs text-ink-muted max-w-md mx-auto">
                            Try searching for other keywords like &ldquo;sales&rdquo;, &ldquo;stock&rdquo;, &ldquo;barcode&rdquo;, or reset the active filters.
                        </p>
                        <button
                            type="button"
                            onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                            className="px-4 py-2 rounded-xl bg-ink text-surface text-xs font-bold hover:opacity-90 transition-opacity"
                        >
                            Reset filters
                        </button>
                    </div>
                )}
            </div>

            {/* ── Save Bar (Bottom Floating) ───────────────────────────────── */}
            <AnimatePresence>
                {dirty && (
                    <motion.div
                        initial={still ? { opacity: 0 } : { y: '100%' }}
                        animate={still ? { opacity: 1 } : { y: 0 }}
                        exit={still ? { opacity: 0 } : { y: '100%' }}
                        transition={SPRING}
                        className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl"
                    >
                        <div className="text-xs sm:text-sm text-ink-secondary">
                            <div className="font-semibold text-ink">You have unsaved module configuration changes</div>
                            {addedEntries.length > 0 && (
                                <div className="text-brand-600 mt-0.5">
                                    Auto-enabling required dependencies: {addedEntries.map(([k]) => byKey[k]?.label || k).join(', ')}.
                                </div>
                            )}
                            {notice && <span className="text-emerald-600 font-bold">{notice}</span>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={discardChanges}
                                disabled={busy}
                                className="px-4 py-2.5 rounded-xl border border-line text-xs sm:text-sm font-semibold text-ink-secondary hover:bg-sunken transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                type="button"
                                onClick={applyChanges}
                                disabled={busy || questions.length > 0}
                                className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs sm:text-sm font-bold hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all"
                            >
                                {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Data-at-Stake Confirmation Modal ──────────────────────────── */}
            {pendingDisable && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={still ? false : { opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={SPRING}
                        className="w-full max-w-md rounded-2xl bg-surface border border-line shadow-2xl p-6 space-y-4"
                    >
                        <div className="flex items-center gap-3 text-amber-600">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                <MinusCircle size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-ink text-base">Turn off {pendingDisable.module.label}?</h3>
                                <p className="text-xs text-ink-muted">Review data impact before proceeding</p>
                            </div>
                        </div>

                        {Object.keys(pendingDisable.atStake).length > 0 ? (
                            <div className="p-3.5 rounded-xl bg-sunken border border-line space-y-2">
                                <p className="text-xs text-ink-muted">
                                    <strong className="text-ink">Zero data is deleted:</strong> All existing records remain completely safe in your database, but will be hidden from daily menus until you turn this module back on:
                                </p>
                                <ul className="text-xs text-ink-secondary space-y-1.5 pt-1">
                                    {Object.entries(pendingDisable.atStake).map(([table, count]) => (
                                        <li key={table} className="flex justify-between items-center bg-surface px-2.5 py-1 rounded-lg border border-line">
                                            <span className="capitalize font-medium">{table.replace(/_/g, ' ')}</span>
                                            <span className="font-bold text-ink font-numeric">{count} records</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="text-xs text-ink-muted bg-sunken p-3 rounded-xl border border-line">
                                No records currently stored for this module. You can safely turn it off anytime.
                            </p>
                        )}

                        {pendingDisable.cascade.length > 1 && (
                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-ink space-y-1">
                                <span className="font-bold text-amber-600">Dependent modules also affected:</span>
                                <p className="text-ink-secondary">
                                    {pendingDisable.cascade
                                        .filter((k) => k !== pendingDisable.module.key)
                                        .map((k) => byKey[k]?.label || k)
                                        .join(', ')}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setPendingDisable(null)}
                                className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-ink-secondary hover:bg-sunken transition-colors"
                            >
                                Keep Enabled
                            </button>
                            <button
                                type="button"
                                onClick={confirmDisable}
                                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-sm"
                            >
                                Turn Off Module
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </OneGlanceLayout>
    );
}

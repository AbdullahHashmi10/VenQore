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
import { ModuleCatalog } from '@/Components/Builder';

const GROUP_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const GROUP_THEMES = {
    A: { name: 'Catalog', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
    B: { name: 'Sell', color: 'text-success-700 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    C: { name: 'Stock', color: 'text-warning-700 dark:text-amber-400', bg: 'bg-warning-500/10 border-warning-500/20' },
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
                setPendingDisable({ module: mod, atStake: data.at_stake || {}, pending: data.pending || [], cascade: data.cascade || [mod.key] });
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

        // Sorting - stable order so toggling cards on/off does not jump their positions
        list = [...list].sort((a, b) => {
            if (sortBy === 'recommended') {
                if (a.recommended && !b.recommended) return -1;
                if (!a.recommended && b.recommended) return 1;
                const gDiff = (a.group || '').localeCompare(b.group || '');
                if (gDiff !== 0) return gDiff;
                return a.label.localeCompare(b.label);
            }
            if (sortBy === 'active') {
                // If user explicitly asks to sort by active, sort active first, but keep secondary sort stable
                const aActive = !!moduleState[a.key];
                const bActive = !!moduleState[b.key];
                if (aActive !== bActive) return aActive ? -1 : 1;
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

    const activeKeys = useMemo(() => Object.keys(moduleState).filter((k) => moduleState[k]), [moduleState]);
    const recommendedMap = useMemo(
        () => Object.fromEntries(modules.filter((m) => m.recommended).map((m) => [m.key, true])),
        [modules],
    );
    const recommendedOn = modules.filter((m) => m.recommended && moduleState[m.key]).length;
    const onCatalogToggle = (key, nextOn) => {
        const mod = byKey[key];
        if (!mod) return;
        nextOn ? handleToggleOn(mod) : startDisable(mod);
    };
    const scrollToCatalog = () =>
        document.getElementById('vq-module-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const tradeLabel = businessLabel || (businessType ? businessType.replace(/_/g, ' ') : null);

    return (
        <OneGlanceLayout title="Builder" activeMenu="Settings">
            <Head title="Modules" />

            <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 pb-32 sm:px-6 lg:px-8">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-2xs font-bold uppercase tracking-widest text-accent-text">Store configuration</p>
                        <h1 className="mt-1 text-2xl font-semibold text-ink sm:text-3xl">Your modules</h1>
                        <p className="mt-1 max-w-3xl text-sm text-ink-secondary">
                            Switch features on or off at any time. Turning something off only hides it &mdash;
                            your records are never deleted.
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-6">
                        <div className="text-right">
                            <div className="vq-num text-2xl font-semibold text-ink">
                                {enabledCount}<span className="text-sm font-normal text-ink-muted"> / {totalCount}</span>
                            </div>
                            <div className="text-3xs font-semibold uppercase tracking-widest text-ink-muted">switched on</div>
                        </div>
                    </div>
                </div>

                {/* ── Recommended setup (guided by default) ─────────────────── */}
                {recommendedCount > 0 && (
                    <div className="overflow-hidden rounded-xl border border-accent bg-surface shadow-sm">
                        <div className="flex flex-col gap-5 bg-accent-quiet p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex min-w-0 items-start gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-fill text-accent-on">
                                    <Store size={22} />
                                </span>
                                <div className="min-w-0">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-fill px-2.5 py-1 text-3xs font-bold uppercase tracking-widest text-accent-on">
                                        <Sparkles size={11} /> We recommend
                                    </span>
                                    <h2 className="mt-2 text-lg font-semibold capitalize text-ink">
                                        {tradeLabel ? `The setup for your ${tradeLabel}` : 'The setup for your business'}
                                    </h2>
                                    <p className="mt-0.5 text-sm text-ink-secondary">
                                        {allRecommendedActive
                                            ? `You're on our recommended setup — all ${recommendedCount} are on. Add anything extra below.`
                                            : `${recommendedOn} of ${recommendedCount} recommended modules are on. Switching the rest on gives you the system we'd set up for a business like yours.`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                                {allRecommendedActive ? (
                                    <span className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold text-ink">
                                        <CheckCheck size={16} className="text-accent-text" /> Recommended setup is on
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={enableAllRecommended}
                                        disabled={busy}
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent-fill px-5 text-sm font-semibold text-accent-on shadow-sm transition-colors duration-fast hover:bg-accent-fill-hover disabled:opacity-60"
                                    >
                                        <Sparkles size={15} /> Use the recommended setup
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={scrollToCatalog}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold text-ink-secondary transition-colors duration-fast hover:border-line-strong hover:text-ink"
                                >
                                    <SlidersHorizontal size={15} /> Choose myself
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 px-5 py-3 text-xs text-ink-secondary sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <span>Not sure what you need? Answer a few questions and we&rsquo;ll work it out again.</span>
                            <Link
                                href={route('store.onboarding.v2', routeArgs())}
                                className="inline-flex items-center gap-1 font-semibold text-accent-text hover:underline"
                            >
                                Ask me the questions <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>
                )}

                {/* ── Module they tried to open ──────────────────────────────── */}
                {highlightMod && !moduleState[highlightMod.key] && (
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-accent bg-accent-quiet p-4">
                        <div className="flex items-center gap-3">
                            <ShieldAlert size={20} className="shrink-0 text-accent-text" />
                            <div>
                                <p className="text-sm font-semibold text-ink">{highlightMod.label} is switched off</p>
                                <p className="text-xs text-ink-secondary">Turn it on to open its pages, reports and register options.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleToggleOn(highlightMod)}
                            className="shrink-0 rounded-md bg-accent-fill px-4 py-2 text-xs font-semibold text-accent-on hover:bg-accent-fill-hover"
                        >
                            Turn on {highlightMod.label}
                        </button>
                    </div>
                )}

                {/* ── Say it in words ────────────────────────────────────────── */}
                <form onSubmit={submitModify} className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface p-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Sparkles size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-accent-text" />
                        <input
                            id="vq-builder-modify"
                            type="text"
                            value={modifyText}
                            onChange={(e) => setModifyText(e.target.value)}
                            placeholder='Or just say it: "turn on invoicing and batch tracking", "call customers patients"'
                            className="h-11 w-full rounded-md border border-line bg-sunken pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                            maxLength={200}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={modifyBusy || !modifyText.trim()}
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-50"
                    >
                        {modifyBusy ? <Loader2 size={16} className="animate-spin" /> : <>Do it <ArrowRight size={14} /></>}
                    </button>
                </form>
                {modifyResult && (
                    <div className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs ${modifyResult.success ? 'border-success-500/30 bg-success-500/10 text-success-700' : 'border-danger-500/30 bg-danger-500/10 text-danger-700'}`}>
                        <span>{modifyResult.success ? '✓ ' : '✕ '}{modifyResult.message}</span>
                        {modifyResult.intent === 'ADD_CARD' && (
                            <button type="button" onClick={() => router.visit(route('store.dashboard', routeArgs()))} className="font-semibold text-accent-text underline">
                                Go to dashboard
                            </button>
                        )}
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 p-4 text-sm text-danger-700">
                        <AlertTriangle size={16} className="shrink-0" /> {error}
                    </div>
                )}

                {questions.map((q) => (
                    <div key={q.for} className="rounded-lg border border-warning-500/30 bg-warning-500/10 p-4">
                        <div className="flex items-start gap-3">
                            <HelpCircle size={20} className="mt-0.5 shrink-0 text-warning-700" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-ink">{q.prompt}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {q.options.map((opt) => (
                                        <button key={opt} type="button" onClick={() => answerQuestion(opt)}
                                            className="rounded-md border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink hover:border-accent hover:text-accent-text">
                                            {byKey[opt]?.label || opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {hasBlocks && (
                    <div className="space-y-3 rounded-lg border border-danger-500/30 bg-danger-500/10 p-4">
                        {Object.entries(blocks).map(([key, verdict]) => (
                            <div key={key} className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div className="flex items-start gap-2">
                                    <ShieldAlert size={18} className="mt-0.5 shrink-0 text-danger-700" />
                                    <p className="text-sm text-ink">{verdict.message}</p>
                                </div>
                                <button type="button" onClick={() => resolveBlockTogether(key, verdict.dependents)}
                                    className="shrink-0 rounded-md border border-danger-500/30 bg-surface px-3 py-1.5 text-xs font-semibold text-danger-700">
                                    Turn these off together
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── The catalogue ──────────────────────────────────────────── */}
                <div id="vq-module-catalog" className="scroll-mt-6 pt-2">
                    <ModuleCatalog
                        modules={modules}
                        active={activeKeys}
                        recommended={recommendedMap}
                        highlight={highlight}
                        disabled={busy}
                        onToggle={onCatalogToggle}
                    />
                </div>
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
                                <div className="text-accent-text mt-0.5">
                                    Auto-enabling required dependencies: {addedEntries.map(([k]) => byKey[k]?.label || k).join(', ')}.
                                </div>
                            )}
                            {notice && <span className="text-success-700 font-bold">{notice}</span>}
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
                                className="px-5 py-2.5 rounded-xl bg-accent-fill text-accent-on text-xs sm:text-sm font-bold hover:bg-accent-fill-hover disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all"
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
                        className="w-full max-w-md rounded-xl bg-surface border border-line shadow-2xl p-6 space-y-4"
                    >
                        <div className="flex items-center gap-3 text-warning-700">
                            <div className="w-10 h-10 rounded-xl bg-warning-500/10 border border-warning-500/20 flex items-center justify-center shrink-0">
                                <MinusCircle size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-ink text-base">Turn off {pendingDisable.module.label}?</h3>
                                <p className="text-xs text-ink-muted">Review data impact before proceeding</p>
                            </div>
                        </div>

                        {(pendingDisable.pending || []).length > 0 && (
                            <div className="p-3.5 rounded-xl bg-danger-500/10 border border-danger-500/30 text-xs text-ink space-y-1.5">
                                <span className="font-bold text-danger-700">Customers are waiting right now</span>
                                <ul className="text-ink-secondary space-y-1">
                                    {pendingDisable.pending.map((p) => (
                                        <li key={p.label}><strong className="text-ink font-numeric">{p.count}</strong> {p.label}</li>
                                    ))}
                                </ul>
                                <p className="text-ink-secondary">Finish or reject these first. Once this is off you will not be able to open them from the menu, and new customers will not be able to order.</p>
                            </div>
                        )}

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
                            <div className="p-3.5 rounded-xl bg-warning-500/10 border border-warning-500/30 text-xs text-ink space-y-1">
                                <span className="font-bold text-warning-700">Dependent modules also affected:</span>
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
                                className="px-4 py-2 rounded-xl bg-danger-600 text-white text-xs font-bold hover:bg-danger-700 transition-colors shadow-sm"
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

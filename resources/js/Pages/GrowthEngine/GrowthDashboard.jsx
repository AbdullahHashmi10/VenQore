import React, { useState, useMemo, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { getCurrencySymbol } from '@/Utils/format';
import {
    Sparkles, AlertTriangle, RefreshCcw, ArrowRight,
    CheckCircle2, Clock, Package, Users, Wallet, Percent, ShieldCheck,
    X, ChevronRight, Target, Activity, Info, BellOff, MessageCircle,
} from 'lucide-react';

/**
 * Growth Engine — dashboard.
 *
 * The V1 version of this file rendered THREE HARDCODED FAKE recommendations
 * ("Bilal General Store has missed their usual weekly order") whenever the real
 * result set was empty — which, given the backend was querying a table that
 * never contained sales, was always. Business owners were looking at invented
 * data about invented customers and treating it as insight.
 *
 * It also:
 *   - rendered `rec.action`, a field the backend never sent, so every real card
 *     had a blank button;
 *   - had four filter buttons wired to `useState` that filtered nothing;
 *   - summed `potential_revenue` from one page and labelled it the total.
 *
 * This version renders only real data, states plainly when there is none,
 * distinguishes "nothing to report" from "not analysed yet", and exposes the
 * engine's own accuracy so the owner can calibrate how much to trust it.
 */

const BRAIN_META = {
    customer:  { icon: Users,   label: 'Customers', tone: 'indigo'  },
    inventory: { icon: Package, label: 'Stock',     tone: 'emerald' },
    profit:    { icon: Percent, label: 'Profit',    tone: 'amber'   },
    cash:      { icon: Wallet,  label: 'Cash & Ops',tone: 'sky'     },
};

const TONE = {
    indigo:  'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    amber:   'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    sky:     'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
};

const PRIORITY_STYLE = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
    high:   'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    low:    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

const money = (v) => {
    const n = Number(v || 0);
    if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000)   return `${(n / 100000).toFixed(2)} Lac`;
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

export default function GrowthDashboard({
    recommendations,
    stats,
    facets,
    scorecard,
    engineStatus,
    trend,
    filters = {},
}) {
    const cur = getCurrencySymbol();
    const { store } = usePage().props;

    const [selected, setSelected]   = useState(null);
    const [detail, setDetail]       = useState(null);
    const [busy, setBusy]           = useState(false);
    const [refreshing, setRefresh]  = useState(false);
    const [notice, setNotice]       = useState(null);
    const [showScore, setShowScore] = useState(false);
    const [hidden, setHidden]       = useState([]);   // optimistic removals

    const rows = useMemo(
        () => (recommendations?.data || []).filter((r) => !hidden.includes(r.id)),
        [recommendations, hidden]
    );

    const hasAnySignals = (stats?.total_signals || 0) > 0;

    // ── Filtering is server-side. V1's buttons were decorative. ──────────
    const applyFilter = useCallback((key, value) => {
        const next = { ...filters };
        if (!value || next[key] === value) delete next[key];
        else next[key] = value;
        router.get(route('store.growth-engine.index', { store_slug: store.slug }), next, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }, [filters, store]);

    const openSignal = async (rec) => {
        setSelected(rec);
        setDetail(null);
        try {
            const { data } = await axios.get(route('store.growth-engine.show', { store_slug: store.slug, id: rec.id }));
            setDetail(data);
        } catch {
            setDetail({ recommendation: rec, context: {}, track_record: null });
        }
    };

    const interact = async (rec, action, payload = {}) => {
        setBusy(true);
        try {
            await axios.post(route(`store.growth-engine.${action}`, { store_slug: store.slug, id: rec.id }), payload);
            if (action !== 'act') setHidden((h) => [...h, rec.id]);
            setSelected(null);
            setNotice(
                action === 'act'     ? 'Marked as done — the engine will check whether it worked.'
              : action === 'snooze'  ? 'Snoozed. It will come back if it is still relevant.'
              :                        'Dismissed. This type will be shown less often.'
            );
            setTimeout(() => setNotice(null), 4000);
        } finally {
            setBusy(false);
        }
    };

    const doRefresh = async () => {
        setRefresh(true);
        try {
            const { data } = await axios.post(route('store.growth-engine.refresh', { store_slug: store.slug }));
            setNotice(data.message);
        } catch (e) {
            setNotice(e?.response?.data?.message || 'Could not start the analysis.');
        } finally {
            setRefresh(false);
            setTimeout(() => setNotice(null), 6000);
        }
    };

    const whatsapp = async (rec) => {
        try {
            const { data } = await axios.get(route('store.growth-engine.whatsapp', { store_slug: store.slug, id: rec.id }));
            window.open(data.url, '_blank', 'noopener');
            await interact(rec, 'act');
        } catch (e) {
            setNotice(e?.response?.data?.error || 'No phone number on file.');
            setTimeout(() => setNotice(null), 4000);
        }
    };

    return (
        <OneGlanceLayout title="Growth Engine" activeMenu="Growth Engine">
            <Head title="Growth Engine" />

            {notice && (
                <div className="mb-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-5 py-3 text-sm font-medium text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
                    <Info size={16} /> {notice}
                </div>
            )}

            {/* ───────────────────────── HEADER ───────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-6 md:p-8 text-white shadow-xl mb-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                                    <Sparkles size={22} className="text-yellow-300" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Growth Engine</h1>
                                {scorecard?.maturity && (
                                    <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold">
                                        <Activity size={12} /> {scorecard.maturity.label}
                                    </span>
                                )}
                            </div>
                            <p className="text-indigo-100 max-w-2xl text-sm md:text-base">
                                Four brains reading your sales, stock, margin and cash — every insight tracked,
                                checked against what actually happened, and tuned to your business.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Stat label="Opportunity on the table" value={`${cur} ${money(stats?.potential_revenue)}`} />
                            <Stat label="Live insights" value={stats?.total_signals ?? 0} />
                            {stats?.realised_value > 0 && (
                                <Stat label="Recovered so far" value={`${cur} ${money(stats.realised_value)}`} accent />
                            )}
                        </div>
                    </div>

                    {/* Per-brain strip */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                        {(stats?.by_brain || []).map((b) => {
                            const meta = BRAIN_META[b.brain] || BRAIN_META.customer;
                            const Icon = meta.icon;
                            const active = filters.brain === b.brain;
                            return (
                                <button
                                    key={b.brain}
                                    onClick={() => applyFilter('brain', b.brain)}
                                    className={`text-left p-3 rounded-2xl border transition-all ${
                                        active
                                            ? 'bg-white text-indigo-900 border-white shadow-lg'
                                            : 'bg-white/10 border-white/10 hover:bg-white/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon size={15} className={active ? 'text-indigo-700' : 'text-indigo-200'} />
                                        <span className={`text-xs font-bold uppercase tracking-wide ${active ? 'text-indigo-700' : 'text-indigo-200'}`}>
                                            {meta.label}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold">{b.count}</span>
                                        {b.value > 0 && (
                                            <span className={`text-xs ${active ? 'text-indigo-600' : 'text-indigo-200'}`}>
                                                {cur} {money(b.value)}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ───────────────────── CONTROLS ───────────────────── */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <FilterChip active={!filters.category && !filters.brain && !filters.priority}
                    onClick={() => router.get(route('store.growth-engine.index', { store_slug: store.slug }), {}, { preserveScroll: true })}>
                    Everything
                </FilterChip>

                {(facets?.categories || []).map((c) => (
                    <FilterChip key={c.key} active={filters.category === c.key}
                        onClick={() => applyFilter('category', c.key)}>
                        {c.label} <span className="opacity-60">{c.count}</span>
                    </FilterChip>
                ))}

                <FilterChip active={filters.priority === 'urgent'} onClick={() => applyFilter('priority', 'urgent')}>
                    <AlertTriangle size={13} className="inline mr-1" /> Urgent only
                </FilterChip>

                <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => setShowScore(true)}
                        className="px-4 py-2 rounded-full text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                        <ShieldCheck size={15} />
                        {scorecard?.overall_precision != null
                            ? `${scorecard.overall_precision}% accurate`
                            : 'How accurate is this?'}
                    </button>
                    <button onClick={doRefresh} disabled={refreshing}
                        className="px-4 py-2 rounded-full text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                        <RefreshCcw size={15} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Starting…' : 'Re-analyse'}
                    </button>
                </div>
            </div>

            {/* ───────────────────── FEED ───────────────────── */}
            {rows.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {rows.map((rec) => (
                        <SignalCard key={rec.id} rec={rec} cur={cur} onOpen={() => openSignal(rec)} />
                    ))}
                </div>
            ) : (
                <EmptyState hasAnySignals={hasAnySignals} engineStatus={engineStatus}
                    maturity={scorecard?.maturity} filters={filters}
                    onClear={() => router.get(route('store.growth-engine.index', { store_slug: store.slug }), {}, { preserveScroll: true })}
                    onRefresh={doRefresh} refreshing={refreshing} />
            )}

            {/* Pagination */}
            {recommendations?.last_page > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    {recommendations.links.map((l, i) => (
                        <button key={i} disabled={!l.url}
                            onClick={() => l.url && router.visit(l.url, { preserveScroll: true })}
                            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                                l.active ? 'bg-indigo-600 text-white'
                                : l.url ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            }`}
                            dangerouslySetInnerHTML={{ __html: l.label }} />
                    ))}
                </div>
            )}

            {/* ───────────────────── DETAIL PANEL ───────────────────── */}
            {selected && (
                <DetailPanel
                    rec={selected} detail={detail} cur={cur} busy={busy}
                    onClose={() => setSelected(null)}
                    onAct={() => interact(selected, 'act')}
                    onDismiss={() => interact(selected, 'dismiss')}
                    onSnooze={(d) => interact(selected, 'snooze', { days: d })}
                    onWhatsApp={() => whatsapp(selected)}
                />
            )}

            {showScore && (
                <ScorecardPanel scorecard={scorecard} cur={cur} trend={trend}
                    engineStatus={engineStatus} onClose={() => setShowScore(false)} />
            )}
        </OneGlanceLayout>
    );
}

/* ══════════════════════════ SUB-COMPONENTS ══════════════════════════ */

function Stat({ label, value, accent }) {
    return (
        <div className={`text-center px-5 py-3 rounded-2xl border ${
            accent ? 'bg-emerald-400/20 border-emerald-300/30' : 'bg-white/10 border-white/10'
        } backdrop-blur-sm`}>
            <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold whitespace-nowrap">{label}</p>
            <p className="text-xl font-bold mt-0.5">{value}</p>
        </div>
    );
}

function FilterChip({ active, onClick, children }) {
    return (
        <button onClick={onClick}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                active
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}>
            {children}
        </button>
    );
}

function SignalCard({ rec, cur, onOpen }) {
    const meta = BRAIN_META[rec.brain] || BRAIN_META.customer;
    const Icon = meta.icon;

    return (
        <div onClick={onOpen}
            className="group bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-slate-100 dark:border-slate-800 cursor-pointer flex flex-col">

            <div className="flex items-start justify-between gap-3 mb-3">
                <div className={`p-2.5 rounded-2xl border ${TONE[meta.tone]} group-hover:scale-105 transition-transform`}>
                    <Icon size={18} />
                </div>
                <div className="flex items-center gap-1.5">
                    {!rec.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500" title="New" />}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${PRIORITY_STYLE[rec.priority] || PRIORITY_STYLE.low}`}>
                        {rec.priority}
                    </span>
                </div>
            </div>

            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{rec.type_label}</p>
            <h3 className="font-bold text-[15px] text-slate-800 dark:text-white leading-snug mb-2">{rec.title}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-[13px] leading-relaxed mb-4 line-clamp-4">{rec.message}</p>

            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                    {Number(rec.potential_revenue) > 0 && (
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
                            {cur} {money(rec.potential_revenue)}
                        </p>
                    )}
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                        <Target size={11} /> {Math.round(rec.confidence)}% confidence
                        {rec.seen_count > 1 && <span className="ml-1">· seen {rec.seen_count}×</span>}
                    </p>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
        </div>
    );
}

/**
 * The empty state carries real information now.
 *
 * V1 filled this space with three fabricated recommendations, so the owner had
 * no way to know the engine had produced nothing. Distinguishing "your business
 * looks healthy" from "this has never been analysed" is the whole point.
 */
function EmptyState({ hasAnySignals, engineStatus, maturity, filters, onClear, onRefresh, refreshing }) {
    const isFiltered = Object.keys(filters || {}).length > 0;

    if (isFiltered && hasAnySignals) {
        return (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Sparkles size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Nothing matches that filter</h3>
                <p className="text-slate-500 mt-1 text-sm">There are other insights waiting under different filters.</p>
                <button onClick={onClear} className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
                    Show everything
                </button>
            </div>
        );
    }

    if (!engineStatus?.has_run) {
        return (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-500">
                    <Activity size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Not analysed yet</h3>
                <p className="text-slate-500 mt-1 text-sm max-w-md mx-auto">
                    The engine runs automatically each morning. You can start the first analysis now —
                    it usually takes under a minute.
                </p>
                <button onClick={onRefresh} disabled={refreshing}
                    className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2">
                    <RefreshCcw size={15} className={refreshing ? 'animate-spin' : ''} />
                    Analyse my business now
                </button>
            </div>
        );
    }

    return (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                <CheckCircle2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Nothing needs your attention</h3>
            <p className="text-slate-500 mt-1 text-sm max-w-md mx-auto">
                No customers slipping, no stock about to run out, no margin or cash problems found.
                {engineStatus?.customers > 0 && (
                    <> Last checked {engineStatus.customers.toLocaleString()} customers and {engineStatus.products?.toLocaleString()} products.</>
                )}
            </p>
            {maturity?.stage === 'learning' && (
                <p className="text-xs text-slate-400 mt-3 max-w-md mx-auto">{maturity.detail}</p>
            )}
        </div>
    );
}

function DetailPanel({ rec, detail, cur, busy, onClose, onAct, onDismiss, onSnooze, onWhatsApp }) {
    const meta = BRAIN_META[rec.brain] || BRAIN_META.customer;
    const Icon = meta.icon;
    const evidence = detail?.recommendation?.evidence || rec.evidence || {};
    const track = detail?.track_record;
    const orders = detail?.context?.recent_orders || [];
    const canWhatsApp = rec.action_type === 'whatsapp' || rec.action_type === 'send_reminder';

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto">

                <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-start gap-3">
                    <div className={`p-2.5 rounded-2xl border ${TONE[meta.tone]}`}><Icon size={18} /></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                            {rec.brain_label} · {rec.type_label}
                        </p>
                        <h2 className="font-bold text-slate-800 dark:text-white leading-tight">{rec.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-6">
                    <p className="text-[14px] leading-relaxed text-slate-700 dark:text-slate-300">{rec.message}</p>

                    {rec.action_hint && (
                        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-wider font-bold text-indigo-500 mb-0.5">What to do</p>
                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">{rec.action_hint}</p>
                        </div>
                    )}

                    {Number(rec.potential_revenue) > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-4 py-3">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600">At stake</p>
                                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{cur} {money(rec.potential_revenue)}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 px-4 py-3">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Confidence</p>
                                <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{Math.round(rec.confidence)}%</p>
                            </div>
                        </div>
                    )}

                    {/* The numbers behind the claim — so it can be checked. */}
                    {Object.keys(evidence).length > 0 && (
                        <div>
                            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">Why we're telling you this</p>
                            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                                {Object.entries(evidence).map(([k, v]) => (
                                    <div key={k} className="flex items-center justify-between gap-4 px-4 py-2.5">
                                        <span className="text-[13px] text-slate-500 dark:text-slate-400">{k}</span>
                                        <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 text-right">{String(v)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {orders.length > 0 && (
                        <div>
                            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">Their recent orders</p>
                            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                                {orders.map((o, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate">{o.reference}</p>
                                            <p className="text-[11px] text-slate-400">{o.date ? new Date(o.date).toLocaleDateString() : '—'}</p>
                                        </div>
                                        <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{cur} {money(o.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Honest track record for this insight type. */}
                    {track && track.gradeable && track.precision != null && (
                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">This kind of insight, for you</p>
                            <p className="text-[13px] text-slate-600 dark:text-slate-300">
                                Correct <strong>{track.precision}%</strong> of the time across {track.graded} checked
                                prediction{track.graded === 1 ? '' : 's'}. You've acted on {track.acted} of {track.generated}.
                            </p>
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 space-y-2">
                    {canWhatsApp && (
                        <button onClick={onWhatsApp} disabled={busy}
                            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                            <MessageCircle size={16} /> Message on WhatsApp
                        </button>
                    )}
                    {rec.action_url && (
                        <a href={rec.action_url}
                            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2">
                            Open in the system <ArrowRight size={16} />
                        </a>
                    )}
                    <div className="flex gap-2">
                        <button onClick={onAct} disabled={busy}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-1.5">
                            <CheckCircle2 size={15} /> Done
                        </button>
                        <button onClick={() => onSnooze(7)} disabled={busy}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-1.5">
                            <Clock size={15} /> Later
                        </button>
                        <button onClick={onDismiss} disabled={busy}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-1.5">
                            <BellOff size={15} /> Not useful
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * The accuracy report.
 *
 * Showing this openly is a deliberate choice. An engine that says "I get
 * stockout warnings right 8 times out of 10 and churn warnings 5 times out of
 * 10" earns more trust than one that presents every guess with equal silent
 * certainty — and it tells the owner exactly which insights to lean on.
 */
function ScorecardPanel({ scorecard, cur, trend, engineStatus, onClose }) {
    const m = scorecard?.maturity;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto">
                <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center gap-3">
                    <ShieldCheck size={20} className="text-indigo-500" />
                    <h2 className="font-bold text-slate-800 dark:text-white flex-1">How accurate is the Growth Engine?</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={18} /></button>
                </div>

                <div className="px-6 py-5 space-y-6">
                    {m && (
                        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-bold text-indigo-900 dark:text-indigo-200">{m.label}</p>
                                <span className="text-xs font-bold text-indigo-500">{m.progress}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-indigo-100 dark:bg-indigo-950 overflow-hidden mb-2">
                                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${m.progress}%` }} />
                            </div>
                            <p className="text-[13px] text-indigo-800 dark:text-indigo-300 leading-relaxed">{m.detail}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                        <MiniStat label="Insights given" value={scorecard?.total_generated ?? 0} />
                        <MiniStat label="Checked" value={scorecard?.total_graded ?? 0} />
                        <MiniStat label="Correct" value={scorecard?.overall_precision != null ? `${scorecard.overall_precision}%` : '—'} />
                    </div>

                    {scorecard?.realised_value > 0 && (
                        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4">
                            <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-600">Value recovered because you acted</p>
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{cur} {money(scorecard.realised_value)}</p>
                            <p className="text-[12px] text-emerald-700/70 dark:text-emerald-400/70 mt-1">
                                Counted only where you marked an insight as done and the result was verified afterwards.
                            </p>
                        </div>
                    )}

                    {(scorecard?.brains || []).map((b) => {
                        const meta = BRAIN_META[b.brain] || BRAIN_META.customer;
                        const Icon = meta.icon;
                        if (!b.generated) return null;
                        return (
                            <div key={b.brain} className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
                                    <div className={`p-2 rounded-xl border ${TONE[meta.tone]}`}><Icon size={15} /></div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-slate-800 dark:text-white">{b.label}</p>
                                        <p className="text-[11px] text-slate-500">
                                            {b.generated} insight{b.generated === 1 ? '' : 's'} · {b.acted} acted on
                                            {b.precision != null && ` · ${b.precision}% correct`}
                                        </p>
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {b.types.slice(0, 6).map((t) => (
                                        <div key={t.type} className="px-4 py-2.5 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate">
                                                    {t.label}
                                                    {t.muted && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 uppercase font-bold">Muted</span>}
                                                </p>
                                                <p className="text-[11px] text-slate-400">
                                                    {t.generated} shown · {t.acted} acted
                                                    {t.sensitivity !== 1 && ` · sensitivity ${t.sensitivity.toFixed(2)}×`}
                                                </p>
                                            </div>
                                            <span className={`text-[13px] font-bold shrink-0 ${
                                                t.precision == null ? 'text-slate-300'
                                                : t.precision >= 70 ? 'text-emerald-600'
                                                : t.precision >= 45 ? 'text-amber-600' : 'text-red-500'
                                            }`}>
                                                {t.precision != null ? `${t.precision}%` : t.gradeable ? '—' : 'n/a'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    <p className="text-[12px] text-slate-400 leading-relaxed">
                        Only predictions can be scored. Observations — like "this stock hasn't sold in 90 days" —
                        are facts rather than forecasts, so they are marked <em>n/a</em> and excluded from the
                        accuracy figures rather than inflating them.
                    </p>

                    {engineStatus?.last_run_at && (
                        <p className="text-[12px] text-slate-400">
                            Last analysed {new Date(engineStatus.last_run_at).toLocaleString()}
                            {engineStatus.duration_ms ? ` in ${(engineStatus.duration_ms / 1000).toFixed(1)}s` : ''}.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function MiniStat({ label, value }) {
    return (
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 px-3 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">{value}</p>
        </div>
    );
}

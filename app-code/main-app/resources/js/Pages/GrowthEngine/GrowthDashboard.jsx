import React, { useState, useMemo, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { ReportShell, ReportKpis, filterInputCls } from '@/Components/Reports/ReportKit';
import { getCurrencySymbol } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
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
 * - rendered `rec.action`, a field the backend never sent, so every real card
 * had a blank button;
 * - had four filter buttons wired to `useState` that filtered nothing;
 * - summed `potential_revenue` from one page and labelled it the total.
 *
 * This version renders only real data, states plainly when there is none,
 * distinguishes "nothing to report" from "not analysed yet", and exposes the
 * engine's own accuracy so the owner can calibrate how much to trust it.
 */

const BRAIN_META = {
 customer: { icon: Users, label: 'Customers', tone: 'indigo' },
 inventory: { icon: Package, label: 'Stock', tone: 'emerald' },
 profit: { icon: Percent, label: 'Profit', tone: 'amber' },
 cash: { icon: Wallet, label: 'Cash & Ops',tone: 'sky' },
};

const TONE = {
 indigo: 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800',
 emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
 amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
 sky: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
};

const PRIORITY_STYLE = {
 urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
 high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
 medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
 low: 'bg-neutral-100 text-ink-secondary dark:bg-surface dark:text-ink-muted border-line',
};

const money = (v) => {
 const n = Number(v || 0);
 const abs = Math.abs(n);
 if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
 if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
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
 const tt = useTermText();
 const cur = getCurrencySymbol();
 const { store } = usePage().props;

 const [selected, setSelected] = useState(null);
 const [detail, setDetail] = useState(null);
 const [busy, setBusy] = useState(false);
 const [refreshing, setRefresh] = useState(false);
 const [notice, setNotice] = useState(null);
 const [showScore, setShowScore] = useState(false);
 const [hidden, setHidden] = useState([]); // optimistic removals

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
 action === 'act' ? 'Marked as done — the engine will check whether it worked.'
 : action === 'snooze' ? 'Snoozed. It will come back if it is still relevant.'
 : 'Dismissed. This type will be shown less often.'
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

 const resetFilters = () => router.get(route('store.growth-engine.index', { store_slug: store.slug }), {}, { preserveScroll: true });
 const sel = `${filterInputCls}`;

 const toolbarFilters = (
 <>
 <select value={filters.category || ''} onChange={(e) => applyFilter('category', e.target.value)} className={sel} aria-label="Category">
 <option value="">All categories</option>
 {(facets?.categories || []).map((c) => (
 <option key={c.key} value={c.key}>{c.label} ({c.count})</option>
 ))}
 </select>
 <select value={filters.priority || ''} onChange={(e) => applyFilter('priority', e.target.value)} className={sel} aria-label="Priority">
 <option value="">Any priority</option>
 <option value="urgent">Urgent only</option>
 <option value="high">High</option>
 <option value="medium">Medium</option>
 </select>
 {Object.keys(filters).length > 0 && (
 <button type="button" onClick={resetFilters} className="h-10 rounded-[12px] px-3 text-sm font-bold text-ink-secondary hover:bg-interactive-hover">Clear</button>
 )}
 </>
 );

 const toolbarActions = (
 <>
 <button type="button" onClick={() => setShowScore(true)}
 className="flex h-10 items-center gap-2 rounded-[12px] border border-line px-3 text-sm font-bold text-ink-secondary transition-colors hover:bg-interactive-hover">
 <ShieldCheck size={16} />
 <span className="hidden sm:inline">{scorecard?.overall_precision != null ? `${scorecard.overall_precision}% accurate` : 'How accurate?'}</span>
 </button>
 <button type="button" onClick={doRefresh} disabled={refreshing}
 className="flex h-10 items-center gap-2 rounded-[12px] bg-brand-600 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-50">
 <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
 {refreshing ? 'Starting…' : 'Re-analyse'}
 </button>
 </>
 );

 return (
 <ReportShell title="Growth Engine" subtitle={scorecard?.maturity?.label} activeKey="growth" navGroups={[]} showHub={false} activeMenu="Growth Engine"
 filters={toolbarFilters} actions={toolbarActions}>

 {notice && (
 <div className="flex shrink-0 items-center gap-2 rounded-[12px] border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-200">
 <Info size={16} /> {notice}
 </div>
 )}

 <ReportKpis items={[
 { label: 'Opportunity on the table', value: `${cur} ${money(stats?.potential_revenue)}`, icon: Wallet, tone: 'emerald', sub: 'Money these insights could recover' },
 { label: 'Live insights', value: stats?.total_signals ?? 0, icon: Sparkles, tone: 'brand', sub: `${stats?.unread_count ?? 0} not yet read` },
 { label: 'Urgent now', value: stats?.urgent_count ?? 0, icon: AlertTriangle, tone: 'rose', valueTone: (stats?.urgent_count ?? 0) > 0 ? 'rose' : undefined, sub: 'Need attention first' },
 { label: 'Recovered so far', value: `${cur} ${money(stats?.realised_value)}`, icon: CheckCircle2, tone: 'sky', sub: 'Confirmed by what happened next' },
 ]} />

 {/* Brain strip: one tap filters to that brain */}
 <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
 {(stats?.by_brain || []).map((b) => {
 const meta = BRAIN_META[b.brain] || BRAIN_META.customer;
 const Icon = meta.icon;
 const active = filters.brain === b.brain;
 return (
 <button key={b.brain} type="button" onClick={() => applyFilter('brain', b.brain)}
 className={`flex h-14 min-w-0 items-center gap-3 rounded-[14px] border px-4 text-left transition-colors ${active ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-line bg-surface hover:bg-interactive-hover'}`}>
 <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border ${TONE[meta.tone]}`}><Icon size={16} /></span>
 <span className="min-w-0 flex-1">
 <span className="block truncate text-sm font-bold text-ink">{tt(meta.label)}</span>
 <span className="block truncate text-xs text-ink-muted">{b.count} insight{b.count === 1 ? '' : 's'}{b.value > 0 ? ` · ${cur} ${money(b.value)}` : ''}</span>
 </span>
 </button>
 );
 })}
 </div>

 {rows.length > 0 ? (
 <div className="grid shrink-0 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
 {rows.map((rec) => (
 <SignalCard key={rec.id} rec={rec} cur={cur} onOpen={() => openSignal(rec)} />
 ))}
 </div>
 ) : (
 <EmptyState hasAnySignals={hasAnySignals} engineStatus={engineStatus}
 maturity={scorecard?.maturity} filters={filters}
 onClear={resetFilters}
 onRefresh={doRefresh} refreshing={refreshing} />
 )}

 {recommendations?.last_page > 1 && (
 <div className="flex shrink-0 flex-wrap justify-center gap-2 pb-2">
 {recommendations.links.map((l, i) => (
 <button key={i} disabled={!l.url}
 onClick={() => l.url && router.visit(l.url, { preserveScroll: true })}
 className={`h-10 min-w-10 rounded-[12px] px-3 text-sm font-bold transition-colors ${
 l.active ? 'bg-brand-600 text-white'
 : l.url ? 'border border-line bg-surface text-ink-secondary hover:bg-interactive-hover'
 : 'cursor-not-allowed text-ink-faint'
 }`}
 dangerouslySetInnerHTML={{ __html: l.label }} />
 ))}
 </div>
 )}

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
 </ReportShell>
 );
}

/* ══════════════════════════ SUB-COMPONENTS ══════════════════════════ */

function SignalCard({ rec, cur, onOpen }) {
 const meta = BRAIN_META[rec.brain] || BRAIN_META.customer;
 const Icon = meta.icon;

 return (
 <div onClick={onOpen}
 className="group flex cursor-pointer flex-col rounded-[14px] border border-line bg-surface p-4 shadow-sm transition-colors hover:border-brand-300">
 <div className="mb-3 flex items-center gap-3">
 <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border ${TONE[meta.tone]}`}><Icon size={18} /></span>
 <p className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wider text-ink-muted">{rec.type_label}</p>
 {!rec.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" title="New" />}
 <span className={`shrink-0 rounded-[8px] border px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${PRIORITY_STYLE[rec.priority] || PRIORITY_STYLE.low}`}>
 {rec.priority}
 </span>
 </div>

 <h3 className="mb-1.5 text-base font-bold leading-snug text-ink">{rec.title}</h3>
 <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-ink-secondary">{rec.message}</p>

 <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
 <div className="min-w-0">
 {Number(rec.potential_revenue) > 0 && (
 <p className="truncate text-base font-bold text-emerald-600 dark:text-emerald-400">{cur} {money(rec.potential_revenue)}</p>
 )}
 <p className="flex items-center gap-1 truncate text-xs text-ink-muted">
 <Target size={12} /> {Math.round(rec.confidence)}% confidence
 {rec.seen_count > 1 && <span className="ml-1">· seen {rec.seen_count}×</span>}
 </p>
 </div>
 <ChevronRight size={18} className="shrink-0 text-ink-faint transition-colors group-hover:text-brand-500" />
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
 <div className="text-center py-20 bg-surface rounded-[14px] border border-line">
 <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center mx-auto mb-4 text-ink-muted">
 <Sparkles size={28} />
 </div>
 <h3 className="text-lg font-bold text-ink">Nothing matches that filter</h3>
 <p className="text-ink-muted mt-1 text-sm">There are other insights waiting under different filters.</p>
 <button onClick={onClear} className="mt-5 px-5 py-2.5 rounded-[12px] bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">
 Show everything
 </button>
 </div>
 );
 }

 if (!engineStatus?.has_run) {
 return (
 <div className="text-center py-20 bg-surface rounded-[14px] border border-line">
 <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-500">
 <Activity size={28} />
 </div>
 <h3 className="text-lg font-bold text-ink">Not analysed yet</h3>
 <p className="text-ink-muted mt-1 text-sm max-w-md mx-auto">
 The engine runs automatically each morning. You can start the first analysis now —
 it usually takes under a minute.
 </p>
 <button onClick={onRefresh} disabled={refreshing}
 className="mt-5 px-5 py-2.5 rounded-[12px] bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 inline-flex items-center gap-2">
 <RefreshCcw size={15} className={refreshing ? 'animate-spin' : ''} />
 Analyse my business now
 </button>
 </div>
 );
 }

 const brainErrs = Object.entries(engineStatus?.brain_errors || {});
 if (brainErrs.length > 0) {
 return (
 <div className="text-center py-16 bg-surface rounded-[14px] border border-amber-300">
 <h3 className="text-lg font-bold text-ink">The analysis ran into a problem</h3>
 <p className="text-ink-muted mt-1 text-sm max-w-xl mx-auto">
 {brainErrs.length} part{brainErrs.length === 1 ? '' : 's'} of the engine could not read your data, so "no insights" would be misleading. Press refresh to retry; if it repeats, send this to support:
 </p>
 <ul className="mt-3 max-w-2xl mx-auto text-left text-xs font-mono text-ink-secondary space-y-1 px-4">
 {brainErrs.map(([brain, msg]) => (<li key={brain} className="break-words"><b>{brain}</b>: {String(msg).slice(0, 300)}</li>))}
 </ul>
 </div>
 );
 }

 return (
 <div className="text-center py-20 bg-surface rounded-[14px] border border-line">
 <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
 <CheckCircle2 size={28} />
 </div>
 <h3 className="text-lg font-bold text-ink">Nothing needs your attention</h3>
 <p className="text-ink-muted mt-1 text-sm max-w-md mx-auto">
 No customers slipping, no stock about to run out, no margin or cash problems found.
 {engineStatus?.customers > 0 && (
 <> Last checked {engineStatus.customers.toLocaleString()} customers and {engineStatus.products?.toLocaleString()} products.</>
 )}
 </p>
 {maturity?.stage === 'learning' && (
 <p className="text-xs text-ink-muted mt-3 max-w-md mx-auto">{maturity.detail}</p>
 )}
 </div>
 );
}

/** A centred popup above everything (including the top bar). Click outside or press Esc to close. */
function PopupFrame({ onClose, width = 'max-w-2xl', children }) {
 React.useEffect(() => {
 const onKey = (e) => { if (e.key === 'Escape') onClose(); };
 window.addEventListener('keydown', onKey);
 return () => window.removeEventListener('keydown', onKey);
 }, [onClose]);
 return createPortal(
 <div className="fixed inset-0 z-[2200] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
 <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" onClick={onClose} />
 <div className={`relative flex max-h-[90vh] w-full ${width} flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-2xl`}>
 {children}
 </div>
 </div>,
 document.body
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
 <PopupFrame onClose={onClose} width="max-w-2xl">

 <div className="shrink-0 border-b border-line bg-surface px-6 py-4 flex items-start gap-3">
 <div className={`p-2.5 rounded-[12px] border ${TONE[meta.tone]}`}><Icon size={18} /></div>
 <div className="flex-1 min-w-0">
 <p className="text-2xs uppercase tracking-wider font-bold text-ink-muted">
 {rec.brain_label} · {rec.type_label}
 </p>
 <h2 className="text-lg font-bold text-ink leading-tight">{rec.title}</h2>
 </div>
 <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-[12px] hover:bg-interactive-hover text-ink-muted" aria-label="Close">
 <X size={18} />
 </button>
 </div>

 <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-6">
 <p className="text-[15px] leading-relaxed text-ink-secondary">{rec.message}</p>

 {rec.action_hint && (
 <div className="rounded-[14px] bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 px-4 py-3">
 <p className="text-1xs uppercase tracking-wider font-bold text-brand-500 mb-0.5">What to do</p>
 <p className="text-sm font-medium text-brand-900 dark:text-brand-200">{rec.action_hint}</p>
 </div>
 )}

 {Number(rec.potential_revenue) > 0 && (
 <div className="grid grid-cols-2 gap-3">
 <div className="rounded-[14px] bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-4 py-3">
 <p className="text-2xs uppercase tracking-wider font-bold text-emerald-600">At stake</p>
 <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{cur} {money(rec.potential_revenue)}</p>
 </div>
 <div className="rounded-[14px] bg-app border border-line px-4 py-3">
 <p className="text-2xs uppercase tracking-wider font-bold text-ink-muted">Confidence</p>
 <p className="text-lg font-bold text-ink-secondary dark:text-ink">{Math.round(rec.confidence)}%</p>
 </div>
 </div>
 )}

 {/* The numbers behind the claim — so it can be checked. */}
 {Object.keys(evidence).length > 0 && (
 <div>
 <p className="text-1xs uppercase tracking-wider font-bold text-ink-muted mb-2">Why we're telling you this</p>
 <div className="rounded-[14px] border border-line divide-y divide-line">
 {Object.entries(evidence).map(([k, v]) => (
 <div key={k} className="flex flex-wrap items-center justify-between gap-y-2 gap-4 px-4 py-2.5">
 <span className="text-[13px] text-ink-muted">{k}</span>
 <span className="text-[13px] font-semibold text-ink text-right">{String(v)}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {orders.length > 0 && (
 <div>
 <p className="text-1xs uppercase tracking-wider font-bold text-ink-muted mb-2">Their recent orders</p>
 <div className="rounded-[14px] border border-line divide-y divide-line max-h-56 overflow-y-auto">
 {orders.map((o, i) => (
 <div key={i} className="flex flex-wrap items-center justify-between gap-y-2 gap-3 px-4 py-2.5">
 <div className="min-w-0">
 <p className="text-[13px] font-medium text-ink-secondary truncate">{o.reference}</p>
 <p className="text-1xs text-ink-muted">{o.date ? new Date(o.date).toLocaleDateString() : '—'}</p>
 </div>
 <span className="text-[13px] font-semibold text-ink">{cur} {money(o.amount)}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Honest track record for this insight type. */}
 {track && track.gradeable && track.precision != null && (
 <div className="rounded-[14px] bg-app border border-line px-4 py-3">
 <p className="text-1xs uppercase tracking-wider font-bold text-ink-muted mb-1">This kind of insight, for you</p>
 <p className="text-[13px] text-ink-secondary">
 Correct <strong>{track.precision}%</strong> of the time across {track.graded} checked
 prediction{track.graded === 1 ? '' : 's'}. You've acted on {track.acted} of {track.generated}.
 </p>
 </div>
 )}
 </div>

 <div className="shrink-0 border-t border-line bg-surface px-6 py-4 space-y-2">
 {canWhatsApp && (
 <button onClick={onWhatsApp} disabled={busy}
 className="w-full py-3 rounded-[12px] bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
 <MessageCircle size={16} /> Message on WhatsApp
 </button>
 )}
 {rec.action_url && (
 <a href={rec.action_url}
 className="w-full py-3 rounded-[12px] bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 flex items-center justify-center gap-2">
 Open in the system <ArrowRight size={16} />
 </a>
 )}
 <div className="flex gap-2">
 <button onClick={onAct} disabled={busy}
 className="flex-1 py-2.5 rounded-[12px] border border-line text-ink-secondary font-semibold text-sm hover:bg-sunken dark:hover:bg-interactive-hover disabled:opacity-50 flex items-center justify-center gap-1.5">
 <CheckCircle2 size={15} /> Done
 </button>
 <button onClick={() => onSnooze(7)} disabled={busy}
 className="flex-1 py-2.5 rounded-[12px] border border-line text-ink-secondary font-semibold text-sm hover:bg-sunken dark:hover:bg-interactive-hover disabled:opacity-50 flex items-center justify-center gap-1.5">
 <Clock size={15} /> Later
 </button>
 <button onClick={onDismiss} disabled={busy}
 className="flex-1 py-2.5 rounded-[12px] border border-line text-ink-muted font-semibold text-sm hover:bg-sunken dark:hover:bg-interactive-hover disabled:opacity-50 flex items-center justify-center gap-1.5">
 <BellOff size={15} /> Not useful
 </button>
 </div>
 </div>
 </PopupFrame>
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
 <PopupFrame onClose={onClose} width="max-w-2xl">
 <div className="shrink-0 border-b border-line bg-surface px-6 py-4 flex items-center gap-3">
 <ShieldCheck size={20} className="text-brand-500" />
 <h2 className="text-lg font-bold text-ink flex-1">How accurate is the Growth Engine?</h2>
 <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-[12px] hover:bg-interactive-hover text-ink-muted" aria-label="Close"><X size={18} /></button>
 </div>

 <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-6">
 {m && (
 <div className="rounded-[14px] bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 p-4">
 <div className="flex flex-wrap items-center justify-between gap-y-2 mb-2">
 <p className="font-bold text-brand-900 dark:text-brand-200">{m.label}</p>
 <span className="text-xs font-bold text-brand-500">{m.progress}%</span>
 </div>
 <div className="h-2 rounded-full bg-brand-100 dark:bg-brand-950 overflow-hidden mb-2">
 <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${m.progress}%` }} />
 </div>
 <p className="text-[13px] text-brand-800 dark:text-brand-300 leading-relaxed">{m.detail}</p>
 </div>
 )}

 <div className="grid grid-cols-3 gap-3">
 <MiniStat label="Insights given" value={scorecard?.total_generated ?? 0} />
 <MiniStat label="Checked" value={scorecard?.total_graded ?? 0} />
 <MiniStat label="Correct" value={scorecard?.overall_precision != null ? `${scorecard.overall_precision}%` : '—'} />
 </div>

 {scorecard?.realised_value > 0 && (
 <div className="rounded-[14px] bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4">
 <p className="text-1xs uppercase tracking-wider font-bold text-emerald-600">Value recovered because you acted</p>
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
 <div key={b.brain} className="rounded-[14px] border border-line overflow-hidden">
 <div className="flex items-center gap-3 px-4 py-3 bg-app">
 <div className={`p-2 rounded-[12px] border ${TONE[meta.tone]}`}><Icon size={15} /></div>
 <div className="flex-1">
 <p className="font-bold text-sm text-ink">{b.label}</p>
 <p className="text-1xs text-ink-muted">
 {b.generated} insight{b.generated === 1 ? '' : 's'} · {b.acted} acted on
 {b.precision != null && ` · ${b.precision}% correct`}
 </p>
 </div>
 </div>
 <div className="divide-y divide-line">
 {b.types.slice(0, 6).map((t) => (
 <div key={t.type} className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-y-2 gap-3">
 <div className="min-w-0">
 <p className="text-[13px] font-medium text-ink-secondary truncate">
 {t.label}
 {t.muted && <span className="ml-2 text-2xs px-1.5 py-0.5 rounded bg-sunken text-ink-muted uppercase font-bold">Muted</span>}
 </p>
 <p className="text-1xs text-ink-muted">
 {t.generated} shown · {t.acted} acted
 {t.sensitivity !== 1 && ` · sensitivity ${t.sensitivity.toFixed(2)}×`}
 </p>
 </div>
 <span className={`text-[13px] font-bold shrink-0 ${
 t.precision == null ? 'text-neutral-300'
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

 <p className="text-[12px] text-ink-muted leading-relaxed">
 Only predictions can be scored. Observations — like "this stock hasn't sold in 90 days" —
 are facts rather than forecasts, so they are marked <em>n/a</em> and excluded from the
 accuracy figures rather than inflating them.
 </p>

 {engineStatus?.last_run_at && (
 <p className="text-[12px] text-ink-muted">
 Last analysed {new Date(engineStatus.last_run_at).toLocaleString()}
 {engineStatus.duration_ms ? ` in ${(engineStatus.duration_ms / 1000).toFixed(1)}s` : ''}.
 </p>
 )}
 </div>
 </PopupFrame>
 );
}

function MiniStat({ label, value }) {
 return (
 <div className="rounded-[14px] bg-app border border-line px-3 py-3 text-center">
 <p className="text-2xs uppercase tracking-wider font-bold text-ink-muted">{label}</p>
 <p className="text-lg font-bold text-ink mt-0.5">{value}</p>
 </div>
 );
}

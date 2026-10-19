import React, { useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FileSpreadsheet, LayoutGrid, Printer, Inbox } from 'lucide-react';

import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { NavTitle } from '@/Components/ListShell';
import { buildReportCatalog, reportNavGroups, currentReportKey } from '@/lib/reportCatalog';
import { exportRowsToCsv, canExportCsv } from '@/lib/exportCsv';
import PrintService from '@/Utils/PrintService';

/**
 * ReportKit — the shared frame every report is built from.
 *
 * Reports are not list pages: they scroll like the dashboard and may carry any
 * number of KPI cards, charts and tables. What they share with the rest of the
 * app is the measurement contract:
 *   - 14px outer radius, 12px inner (buttons, inputs, chips)
 *   - 8px (gap-2) between every block, 16px page sides
 *   - toolbar h-14, controls h-10, table rows h-12, KPI cards h-[92px], 4 per row
 *
 * Other modules' dashboards reuse it with `navGroups` (their own sibling-page menu),
 * `activeKey` (current page id), `activeMenu` (dock group to highlight) and `showHub={false}`.
 *
 *   <ReportShell title="Sales Report" filters={<DateRangeFilter .../>} exportConfig={{ filename, columns, rows }}>
 *     <ReportKpis items={[...]} />
 *     <ReportSection title="Revenue trend"><TrendChart .../></ReportSection>
 *     <ReportSection title="Sales" flush><ReportTable columns rows /></ReportSection>
 *   </ReportShell>
 */

/* ───────────────────────── Shell ───────────────────────── */

export function ReportShell({ title, subtitle, activeKey, filters, actions, exportConfig, children, hideNav = false, navGroups, activeMenu = 'Insights', showHub = true }) {
    const { store, hiddenReports = [], planFeatures = {} } = usePage().props;
    const catalog = useMemo(
        () => buildReportCatalog({ slug: store?.slug, hiddenReports, planFeatures }),
        [store?.slug, hiddenReports, planFeatures],
    );
    const billingHref = useMemo(() => {
        try { return route('store.billing', { store_slug: store?.slug }); } catch (e) { return '/billing'; }
    }, [store?.slug]);
    const groups = useMemo(() => (navGroups || (hideNav ? [] : reportNavGroups(catalog, billingHref))), [navGroups, catalog, billingHref, hideNav]);
    const hubHref = useMemo(() => {
        try { return route('store.reports.index', { store_slug: store?.slug }); } catch (e) { return '#'; }
    }, [store?.slug]);
    const activeId = activeKey || (navGroups ? null : currentReportKey(catalog));

    return (
        <OneGlanceLayout title={title} activeMenu={activeMenu} noPadding dockInset>
            <Head title={title} />
            <div className="flex h-full min-h-0 min-w-0 flex-col gap-2 bg-app px-2 pb-2 pt-2 md:px-4">
                {/* Row 1 · toolbar: title, filters and actions share one row */}
                <div className="relative z-20 flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[14px] border border-line bg-surface px-2 shadow-sm print:hidden">
                    <div className="flex min-w-0 items-center gap-2">
                        <NavTitle title={title} groups={groups} activeId={activeId} />
                        {subtitle ? <span className="hidden truncate text-sm text-ink-muted 2xl:block">{subtitle}</span> : null}
                    </div>
                    {filters ? (
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 py-1 lg:justify-end">
                            {filters}
                        </div>
                    ) : null}
                    <div className="flex shrink-0 items-center gap-2">
                        {actions}
                        {exportConfig ? <ExportButton {...exportConfig} /> : null}
                        <button type="button" onClick={() => PrintService.printPage()} title="Print"
                            className="flex h-10 w-10 items-center justify-center rounded-[12px] text-ink-muted transition-colors hover:bg-interactive-hover">
                            <Printer size={18} />
                        </button>
                        {showHub ? (
                        <Link href={hubHref} title="All reports"
                            className="flex h-10 items-center gap-2 rounded-[12px] border border-line px-3 text-sm font-bold text-ink-secondary transition-colors hover:bg-interactive-hover">
                            <LayoutGrid size={16} /><span className="hidden sm:inline">All reports</span>
                        </Link>
                        ) : null}
                    </div>
                </div>


                {/* Print header */}
                <div className="mb-2 hidden text-center print:block">
                    <h1 className="text-2xl font-bold text-ink">{title}</h1>
                    {subtitle ? <p className="text-ink-muted">{subtitle}</p> : null}
                    <p className="mt-1 text-sm text-ink-muted">Generated on {new Date().toLocaleString()}</p>
                </div>

                {/* Body · scrolls like the dashboard */}
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain print:overflow-visible">
                    {children}
                </div>
            </div>
        </OneGlanceLayout>
    );
}

/* ───────────────────────── Export ───────────────────────── */

/** CSV download of the rows given; hidden for anyone without export permission. */
export function ExportButton({ filename, columns, rows }) {
    if (!canExportCsv()) return null;
    return (
        <button type="button" title="Export CSV" onClick={() => exportRowsToCsv(filename, columns, rows)}
            className="flex h-10 w-10 items-center justify-center rounded-[12px] text-emerald-600 transition-colors hover:bg-interactive-hover">
            <FileSpreadsheet size={18} />
        </button>
    );
}

/* ───────────────────────── KPI cards ───────────────────────── */

const TONES = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    sky: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
    rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    slate: 'bg-sunken text-ink-secondary',
};
const VALUE_TONES = { emerald: 'text-emerald-600', rose: 'text-rose-600', amber: 'text-amber-600' };

/**
 * KPI cards: any number of them, all the same size, wrapping to fit.
 * item: { label, value, icon, tone, valueTone, sub, trend: 'up'|'down'|'flat', href }
 */
export function ReportKpis({ items = [] }) {
    const list = items.filter(Boolean);
    if (!list.length) return null;
    /* Even rows: up to 4 in one row, 5-6 sit 3 + 3, 7-8 sit 4 + 4. */
    const n = list.length;
    const grid = n === 1 ? 'grid-cols-1'
        : n === 2 ? 'grid-cols-1 sm:grid-cols-2'
        : n === 3 ? 'grid-cols-1 sm:grid-cols-3'
        : n === 4 ? 'grid-cols-2 xl:grid-cols-4'
        : n === 5 ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-5'
        : n <= 6 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : 'grid-cols-2 xl:grid-cols-4';
    return (
        <div className={`grid shrink-0 gap-2 ${grid}`}>
            {list.map((k) => {
                const Icon = k.icon;
                const Tag = k.href ? Link : 'div';
                const trend = k.trend === 'up' ? { c: 'text-emerald-600', s: '▲' } : k.trend === 'down' ? { c: 'text-rose-600', s: '▼' } : k.trend === 'flat' ? { c: 'text-ink-muted', s: '–' } : null;
                return (
                    <Tag key={k.label} {...(k.href ? { href: k.href } : {})}
                        className={`flex h-[92px] min-w-0 items-center gap-4 rounded-[14px] border border-line bg-surface px-5 shadow-sm ${k.href ? 'transition-colors hover:border-brand-300' : ''}`}>
                        {Icon ? (
                            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] ${TONES[k.tone] || TONES.brand}`}><Icon size={22} /></span>
                        ) : null}
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-ink-muted">{k.label}</span>
                            <span className={`flex items-baseline gap-1.5 truncate text-2xl font-bold leading-8 tabular-nums ${VALUE_TONES[k.valueTone] || 'text-ink'}`}>
                                {trend ? <span className={`text-sm ${trend.c}`} aria-hidden>{trend.s}</span> : null}
                                <span className="truncate">{k.value}</span>
                            </span>
                            <span className="block h-4 truncate text-xs leading-4 text-ink-muted">{k.sub || ''}</span>
                        </span>
                    </Tag>
                );
            })}
        </div>
    );
}

/* ───────────────────────── Section card ───────────────────────── */

/** A titled card. `flush` removes body padding (tables). `right` is the header's action slot. */
export function ReportSection({ title, subtitle, icon: Icon, tone = 'brand', right, flush = false, className = '', bodyClassName = '', children }) {
    return (
        <section className={`flex min-w-0 flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-sm ${className}`}>
            {(title || right) && (
                <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-4">
                    <div className="flex min-w-0 items-center gap-3">
                        {Icon ? <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] ${TONES[tone] || TONES.brand}`}><Icon size={16} /></span> : null}
                        <div className="min-w-0">
                            <h2 className="truncate text-base font-bold leading-tight text-ink">{title}</h2>
                            {subtitle ? <p className="truncate text-sm text-ink-muted">{subtitle}</p> : null}
                        </div>
                    </div>
                    {right ? <div className="flex shrink-0 items-center gap-2">{right}</div> : null}
                </header>
            )}
            <div className={`${flush ? '' : 'p-4'} min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
        </section>
    );
}

/** A responsive row of sections: 12 columns on lg, stacked below. Use `span` on children via ReportCol. */
export function ReportGrid({ children, className = '' }) {
    return <div className={`grid shrink-0 grid-cols-1 gap-2 lg:grid-cols-12 ${className}`}>{children}</div>;
}
export function ReportCol({ span = 6, children, className = '' }) {
    const map = { 3: 'lg:col-span-3', 4: 'lg:col-span-4', 5: 'lg:col-span-5', 6: 'lg:col-span-6', 7: 'lg:col-span-7', 8: 'lg:col-span-8', 9: 'lg:col-span-9', 12: 'lg:col-span-12' };
    return <div className={`flex min-w-0 flex-col [&>section]:h-full ${map[span] || map[6]} ${className}`}>{children}</div>;
}

/* ───────────────────────── Table ───────────────────────── */

/**
 * columns: [{ key, label, align:'left'|'right'|'center', render?:(row)=>node, get?:(row)=>value (sort + csv), sortable?:bool, width?, className? }]
 * totals:  { [columnKey]: node } shown in a sticky footer row.
 * Rows are always h-12 and single-line so no row is taller than another.
 */
export function ReportTable({ columns, rows = [], rowKey, onRowClick, totals, pageSize = 50, empty = 'No data for this period', emptyIcon: EmptyIcon = Inbox, maxHeight }) {
    const [sort, setSort] = useState({ key: null, dir: 'asc' });
    const [page, setPage] = useState(1);

    const valueOf = (col, row) => (col.get ? col.get(row) : row[col.key]);

    const sorted = useMemo(() => {
        if (!sort.key) return rows;
        const col = columns.find((c) => c.key === sort.key);
        if (!col) return rows;
        const dir = sort.dir === 'asc' ? 1 : -1;
        return [...rows].sort((a, b) => {
            const x = valueOf(col, a); const y = valueOf(col, b);
            const nx = parseFloat(x); const ny = parseFloat(y);
            if (!Number.isNaN(nx) && !Number.isNaN(ny) && String(nx) === String(x).trim() && String(ny) === String(y).trim()) return (nx - ny) * dir;
            return String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true }) * dir;
        });
    }, [rows, sort, columns]);

    const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const current = Math.min(page, pages);
    const view = pageSize ? sorted.slice((current - 1) * pageSize, current * pageSize) : sorted;
    const align = (a) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');
    const toggle = (col) => {
        if (!col.sortable) return;
        setSort((s) => (s.key === col.key ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'asc' }));
    };

    return (
        <div>
            <div className="overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="sticky top-0 z-10 h-10 border-b border-line bg-app">
                            {columns.map((col) => (
                                <th key={col.key} onClick={() => toggle(col)} style={col.width ? { width: col.width } : undefined}
                                    className={`whitespace-nowrap bg-app px-4 text-xs font-bold uppercase tracking-wider text-ink-muted ${align(col.align)} ${col.sortable ? 'cursor-pointer select-none hover:bg-interactive-hover' : ''}`}>
                                    <span className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                                        {col.label}
                                        {sort.key === col.key ? (sort.dir === 'asc' ? <ChevronUp size={13} className="text-brand-500" /> : <ChevronDown size={13} className="text-brand-500" />) : null}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {view.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-12">
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sunken text-ink-muted"><EmptyIcon size={22} /></span>
                                        <p className="text-sm font-bold text-ink-secondary">{empty}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : view.map((row, i) => (
                            <tr key={rowKey ? rowKey(row, i) : i} onClick={onRowClick ? () => onRowClick(row) : undefined}
                                className={`h-12 border-l-4 border-transparent transition-colors hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 ${onRowClick ? 'cursor-pointer' : ''}`}>
                                {columns.map((col) => (
                                    <td key={col.key} className={`max-w-[28rem] truncate whitespace-nowrap px-4 text-sm text-ink-secondary ${align(col.align)} ${col.className || ''}`}>
                                        {col.render ? col.render(row, i) : valueOf(col, row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                    {totals && view.length > 0 ? (
                        <tfoot>
                            <tr className="sticky bottom-0 h-12 border-t-2 border-line bg-app">
                                {columns.map((col, i) => (
                                    <td key={col.key} className={`whitespace-nowrap bg-app px-4 text-sm font-bold text-ink ${align(col.align)}`}>
                                        {totals[col.key] !== undefined ? totals[col.key] : (i === 0 ? 'Total' : '')}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    ) : null}
                </table>
            </div>
            {pageSize && sorted.length > pageSize ? (
                <div className="flex h-12 items-center justify-between border-t border-line px-4 text-xs text-ink-muted">
                    <span>{(current - 1) * pageSize + 1}–{Math.min(current * pageSize, sorted.length)} of {sorted.length}</span>
                    <span className="flex items-center gap-1">
                        <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} className="flex h-8 w-8 items-center justify-center rounded-[12px] hover:bg-interactive-hover disabled:opacity-40"><ChevronLeft size={16} /></button>
                        <span className="px-2 font-bold text-ink-secondary">{current} / {pages}</span>
                        <button type="button" disabled={current >= pages} onClick={() => setPage(current + 1)} className="flex h-8 w-8 items-center justify-center rounded-[12px] hover:bg-interactive-hover disabled:opacity-40"><ChevronRight size={16} /></button>
                    </span>
                </div>
            ) : null}
        </div>
    );
}

/* ───────────────────────── Filters ───────────────────────── */

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const PRESETS = [
    ['Today', () => { const t = new Date(); return [ymd(t), ymd(t)]; }],
    ['7 days', () => { const t = new Date(); const f = new Date(); f.setDate(t.getDate() - 6); return [ymd(f), ymd(t)]; }],
    ['30 days', () => { const t = new Date(); const f = new Date(); f.setDate(t.getDate() - 29); return [ymd(f), ymd(t)]; }],
    ['This month', () => { const t = new Date(); return [ymd(new Date(t.getFullYear(), t.getMonth(), 1)), ymd(t)]; }],
    ['Last month', () => { const t = new Date(); return [ymd(new Date(t.getFullYear(), t.getMonth() - 1, 1)), ymd(new Date(t.getFullYear(), t.getMonth(), 0))]; }],
    ['This year', () => { const t = new Date(); return [ymd(new Date(t.getFullYear(), 0, 1)), ymd(t)]; }],
];

const inputCls = 'h-10 rounded-[12px] border border-line bg-app px-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500';

/** One dropdown: Today, 7 days, 30 days, This month, Last month, This year, Custom.
 *  Picking Custom reveals the from/to dates beside it. onChange({ from, to }). */
export function DateRangeFilter({ from, to, onChange, presets = true }) {
    const match = PRESETS.find(([, fn]) => { const [f, t] = fn(); return f === from && t === to; });
    const [custom, setCustom] = useState(false);
    const isCustom = custom || (!match && Boolean(from || to));
    const value = isCustom ? 'custom' : (match ? match[0] : 'custom');
    const dates = (
        <div className="flex items-center gap-2">
            <input type="date" value={from || ''} onChange={(e) => onChange({ from: e.target.value, to })} className={inputCls} aria-label="From date" />
            <span className="text-sm text-ink-muted">to</span>
            <input type="date" value={to || ''} onChange={(e) => onChange({ from, to: e.target.value })} className={inputCls} aria-label="To date" />
        </div>
    );
    if (!presets) return dates;
    return (
        <div className="flex flex-wrap items-center gap-2">
            <select value={value} aria-label="Period"
                onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'custom') { setCustom(true); return; }
                    setCustom(false);
                    const hit = PRESETS.find(([l]) => l === v);
                    if (hit) { const [f, t] = hit[1](); onChange({ from: f, to: t }); }
                }}
                className={`${inputCls} min-w-[9rem] font-semibold`}>
                {PRESETS.map(([label]) => <option key={label} value={label}>{label}</option>)}
                <option value="custom">Custom range…</option>
            </select>
            {isCustom ? dates : null}
        </div>
    );
}

/** Same dropdown for pages whose periods are named ids (this_month, custom...). options: [{ id|value, label }]. */
export function RangePicker({ value, onChange, options = [], className = '' }) {
    return (
        <select value={value ?? ''} aria-label="Period" onChange={(e) => onChange(e.target.value)}
            className={`${inputCls} min-w-[9rem] font-semibold ${className}`}>
            {options.map((o) => {
                const id = typeof o === 'string' ? o : (o.id ?? o.value);
                const label = typeof o === 'string' ? o.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : o.label;
                return <option key={id} value={id}>{label}</option>;
            })}
        </select>
    );
}

/** A labelled select the same height as everything else in the filter row. */
export function FilterSelect({ label, value, onChange, options, className = '' }) {
    return (
        <label className={`flex items-center gap-2 ${className}`}>
            {label ? <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">{label}</span> : null}
            <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls}>
                {options.map((o) => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
            </select>
        </label>
    );
}

export const filterInputCls = inputCls;

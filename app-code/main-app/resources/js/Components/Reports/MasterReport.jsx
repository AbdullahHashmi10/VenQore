import React, { useState, useMemo, useRef, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Search, ArrowUpRight, ChevronLeft, ChevronRight, X, BarChart3 } from 'lucide-react';

import { formatCurrency, formatNumber } from '@/Utils/format';
import {
    ReportKpis, ReportSection, ReportTable, DateRangeFilter, FilterSelect, ExportButton, filterInputCls,
} from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart } from '@/Components/Reports/ReportCharts';

/**
 * MASTER REPORT — the generic report body.
 *
 * Renders whatever blocks its props describe, in the order every report uses:
 *   filters  ->  KPI cards (stats)  ->  chart (chartData + chartConfig)  ->  table (columns + data)
 *
 * It is a BODY, not a page frame: it renders inside ReportShell (or any other
 * layout) and does not draw a toolbar of its own, so the page title/report menu
 * stay with the shell. Props contract is unchanged:
 *
 *   stats        [{ label, value, subValue, type:'up'|'down'|'neutral', icon:<Element/> }]
 *   chartData    rows; chartConfig { type:'area'|'line'|'bar'|'pie', dataKey (string|array), xAxisKey, nameKey,
 *                bars:[{dataKey,name}], unit?, title? }
 *   columns      [{ key, label, sortable, align, render(row), width, type:'currency'|'number'|'date' }]
 *   data         table rows
 *   filters      [{ key, type:'universal_search'|'select', label, options:[{value,label}] }]
 *   filterValues / onFilterChange({...filterValues, ...changes})   (start_date / end_date presets + custom range)
 *   onSearch(query)           shows a search box when given
 *   currentPage/totalPages/onPageChange   server paging footer
 *   enableInfiniteScroll/onLoadMore/hasMore/loadingMore
 *   isLoading
 * onFilterClick / onExport are accepted but no longer needed: the CSV export is the kit's ExportButton
 * (permission-gated) over the table's columns and rows.
 */

const getPath = (obj, path) => String(path).split('.').reduce((o, i) => (o ? o[i] : null), obj);

const isDateLike = (v) => v !== undefined && v !== null && typeof v !== 'number' && !Number.isNaN(new Date(v).getTime()) && /\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(String(v));

function UniversalSearch({ def, filterValues, onFilterChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const options = def.options || [];
    const selected = filterValues[def.key] ? options.find((o) => o.value == filterValues[def.key]) : null;
    const list = (query === '' ? options : options.filter((o) => String(o.label).toLowerCase().includes(query.toLowerCase()))).slice(0, 50);

    return (
        <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
            <input
                type="text"
                placeholder={def.label || 'Search customer...'}
                className={`${filterInputCls} w-full pl-9 pr-9`}
                value={selected ? selected.label : query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onFilterChange && onFilterChange({ ...filterValues, [def.key]: null });
                    setIsOpen(true);
                }}
                onFocus={() => { setIsOpen(true); if (filterValues[def.key]) setQuery(''); }}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            />
            {isOpen && (
                <div className="absolute left-0 top-full z-30 mt-2 max-h-60 w-full overflow-y-auto rounded-[14px] border border-line bg-surface p-1 shadow-xl">
                    {list.length > 0 ? list.map((opt) => (
                        <button key={opt.value} type="button"
                            className="block h-10 w-full truncate rounded-[12px] px-3 text-left text-sm text-ink-secondary hover:bg-interactive-hover"
                            onClick={() => {
                                onFilterChange && onFilterChange({ ...filterValues, [def.key]: opt.value });
                                setQuery(opt.label);
                                setIsOpen(false);
                            }}>
                            {opt.label}
                        </button>
                    )) : <div className="p-3 text-center text-xs text-ink-muted">No results found</div>}
                </div>
            )}
            {filterValues[def.key] && (
                <button type="button" aria-label="Clear"
                    onClick={() => { onFilterChange && onFilterChange({ ...filterValues, [def.key]: null }); setQuery(''); }}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[12px] text-ink-muted hover:text-rose-500">
                    <X size={14} />
                </button>
            )}
        </div>
    );
}

const MasterReport = ({
    title,
    subTitle,
    showTitle = false,
    stats = [],
    chartData = [],
    chartConfig = {},
    columns = [],
    data = [],
    filters = [],
    filterValues = {},
    onFilterChange,
    onSearch,
    onExport, // eslint-disable-line no-unused-vars
    onFilterClick, // eslint-disable-line no-unused-vars
    hideExport = false,
    isLoading = false,
    emptyMessage = 'No results found matching your criteria',

    currentPage = 1,
    totalPages = 1,
    onPageChange,

    enableInfiniteScroll = false,
    onLoadMore = null,
    hasMore = false,
    loadingMore = false,
}) => {
    const { store, settings } = usePage().props;
    const money = store || settings;
    const observerTarget = useRef(null);

    useEffect(() => {
        if (!enableInfiniteScroll || !onLoadMore || !hasMore) return undefined;
        const el = observerTarget.current;
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting && !loadingMore) onLoadMore(); },
            { threshold: 0.1, rootMargin: '200px' },
        );
        if (el) observer.observe(el);
        return () => { if (el) observer.unobserve(el); };
    }, [enableInfiniteScroll, onLoadMore, hasMore, loadingMore]);

    const filterDefs = Array.isArray(filters) ? filters : [];
    const universal = filterDefs.find((f) => f.type === 'universal_search');
    const selects = filterDefs.filter((f) => f.type === 'select');
    const hasDates = typeof onFilterChange === 'function';

    /* ── KPI cards ── */
    const kpis = useMemo(() => (stats || []).map((s) => {
        const iconEl = s.icon;
        const Icon = React.isValidElement(iconEl) ? (p) => React.cloneElement(iconEl, { size: p.size }) : ArrowUpRight;
        return {
            label: s.label,
            value: s.value,
            sub: s.subValue,
            icon: Icon,
            tone: s.type === 'up' ? 'emerald' : s.type === 'down' ? 'amber' : 'brand',
            trend: s.type === 'up' || s.type === 'down' ? s.type : undefined,
        };
    }), [stats]);

    /* ── Chart ── */
    const chart = useMemo(() => {
        if (!chartData || chartData.length === 0) return null;
        const xKey = chartConfig.xAxisKey || chartConfig.nameKey || 'name';
        const unit = chartConfig.unit || 'decimal';
        if (chartConfig.type === 'pie') {
            const vKey = Array.isArray(chartConfig.dataKey) ? chartConfig.dataKey[0] : (chartConfig.dataKey || 'value');
            return {
                kind: 'pie', unit,
                slices: chartData.map((r) => ({ name: String(r[chartConfig.nameKey || xKey] ?? ''), value: Number(r[vKey]) || 0 })).filter((s) => s.value > 0),
            };
        }
        let keys;
        if (Array.isArray(chartConfig.bars) && chartConfig.bars.length) keys = chartConfig.bars.map((b) => ({ key: b.dataKey, name: b.name || b.dataKey }));
        else if (Array.isArray(chartConfig.dataKey)) keys = chartConfig.dataKey.map((k) => ({ key: k, name: k }));
        else keys = [{ key: chartConfig.dataKey || 'value', name: title || 'Value' }];
        const seriesList = keys.map((k) => ({
            name: k.name,
            points: chartData.map((r) => ({ x: r[xKey], y: Number(r[k.key]) || 0 })),
        }));
        let type = chartConfig.type === 'bar' ? 'bar' : (chartConfig.type === 'line' ? 'line' : 'area');
        if (type !== 'bar' && !chartData.every((r) => isDateLike(r[xKey]))) type = 'bar';
        return { kind: 'trend', type, unit, series: seriesList };
    }, [chartData, chartConfig, title]);

    /* ── Table ── */
    const tableColumns = useMemo(() => columns.map((col, idx) => ({
        key: col.key ?? `c${idx}`,
        label: col.label,
        align: col.align,
        width: col.width,
        sortable: !!col.sortable,
        get: (row) => (col.key ? getPath(row, col.key) : ''),
        render: (row, i) => {
            if (col.render) return col.render(row, i);
            const v = getPath(row, col.key);
            if (col.type === 'currency') return formatCurrency(v, money);
            if (col.type === 'number') return formatNumber(v, null, money);
            if (col.type === 'date') return v ? new Date(v).toLocaleDateString() : '-';
            return v || v === 0 ? v : <span className="italic text-ink-muted">-</span>;
        },
    })), [columns, money]);

    const exportColumns = useMemo(() => columns.filter((c) => c.key).map((c) => ({ label: c.label, get: (row) => getPath(row, c.key) })), [columns]);

    const serverPaged = !enableInfiniteScroll && totalPages > 1;
    const showFilters = universal || selects.length > 0 || hasDates || onSearch || (!hideExport && columns.length > 0);

    return (
        <div className="flex min-w-0 shrink-0 flex-col gap-2">
            {showTitle && title ? (
                <div className="px-1">
                    <h1 className="text-xl font-bold tracking-tight text-ink">{title}</h1>
                    {subTitle ? <p className="text-xs font-medium text-ink-muted">{subTitle}</p> : null}
                </div>
            ) : null}

            {showFilters && (
                <div className="relative z-20 flex shrink-0 flex-wrap items-center gap-2 rounded-[14px] border border-line bg-surface p-2 shadow-sm print:hidden">
                    {onSearch && (
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                            <input type="text" placeholder="Search report..." onChange={(e) => onSearch(e.target.value)} className={`${filterInputCls} w-full pl-9 md:w-64`} />
                        </div>
                    )}
                    {universal && <UniversalSearch def={universal} filterValues={filterValues} onFilterChange={onFilterChange} />}
                    {selects.map((f) => (
                        <FilterSelect key={f.key} label={f.label} value={filterValues[f.key] ?? ''}
                            onChange={(v) => onFilterChange && onFilterChange({ ...filterValues, [f.key]: v === '' ? null : v })}
                            options={[{ value: '', label: 'All' }, ...(f.options || [])]} />
                    ))}
                    {hasDates && (
                        <DateRangeFilter from={filterValues.start_date} to={filterValues.end_date}
                            onChange={({ from, to }) => onFilterChange({ ...filterValues, start_date: from, end_date: to })} />
                    )}
                    {!hideExport && columns.length > 0 && (
                        <div className="ml-auto"><ExportButton filename={String(title || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-')} columns={exportColumns} rows={data} /></div>
                    )}
                </div>
            )}

            {kpis.length > 0 && <ReportKpis items={kpis} />}

            {chart && (
                <ReportSection title={chartConfig.title || 'Analytics overview'} icon={BarChart3}>
                    {chart.kind === 'pie'
                        ? <DonutChart slices={chart.slices} unit={chart.unit} height={280} />
                        : <TrendChart series={chart.series} type={chart.type} unit={chart.unit} height={280} />}
                </ReportSection>
            )}

            <ReportSection title={chart || kpis.length ? 'Details' : title} subtitle={`${data.length} ${data.length === 1 ? 'record' : 'records'}`} flush>
                {isLoading ? (
                    <div className="flex flex-col">
                        {[...Array(5)].map((_, i) => <div key={i} className="flex h-12 items-center border-b border-line px-4"><div className="h-4 w-3/4 animate-pulse rounded-[12px] bg-sunken" /></div>)}
                    </div>
                ) : (
                    <ReportTable columns={tableColumns} rows={data} rowKey={(r, i) => r.id ?? i}
                        pageSize={serverPaged || enableInfiniteScroll ? 0 : 100} empty={emptyMessage} />
                )}

                {enableInfiniteScroll && (
                    <>
                        <div ref={observerTarget} className="h-4" />
                        {loadingMore && (
                            <div className="flex h-12 items-center justify-center gap-2 text-ink-muted">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                <span className="text-xs font-bold uppercase">Loading more...</span>
                            </div>
                        )}
                    </>
                )}

                {serverPaged && (
                    <div className="flex h-12 items-center justify-between border-t border-line px-4">
                        <span className="text-xs font-bold text-ink-muted">Page {currentPage} of {totalPages}</span>
                        <div className="flex items-center gap-2">
                            <button type="button" disabled={currentPage <= 1} onClick={() => onPageChange && onPageChange(currentPage - 1)}
                                className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-line text-ink-muted hover:bg-interactive-hover disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft size={16} /></button>
                            <button type="button" disabled={currentPage >= totalPages} onClick={() => onPageChange && onPageChange(currentPage + 1)}
                                className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-line text-ink-muted hover:bg-interactive-hover disabled:cursor-not-allowed disabled:opacity-50"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </ReportSection>
        </div>
    );
};

export default MasterReport;

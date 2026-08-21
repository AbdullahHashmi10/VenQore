import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Printer,
    Download,
    Search,
    Filter,
    Calendar,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    RefreshCw
} from 'lucide-react';
import FilterPanel from '@/Components/FilterPanel';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { formatCurrency, formatNumber } from '@/Utils/format';

import { vq } from '@/theme/runtime';
/**
 * MASTER REPORT COMPONENT (The "Report Factory")
 * 
 * This component is designed to handle ANY report by accepting data/config as props.
 * It includes:
 * 1. KPI Cards Row
 * 2. Dynamic Chart Section
 * 3. Filter/Search Bar
 * 4. Data Table with Sorting & Pagination
 */

const MasterReport = ({
    title,
    stats = [], // [{ label, value, subValue, type: 'up'|'down'|'neutral', icon: Node }]
    chartData = [],
    chartConfig = { type: 'area', dataKey: 'value', xAxisKey: 'name', color: vq.indigo[500] },
    columns = [], // [{ key, label, sortable: bool, align: 'left'|'right'|'center', render: fn, width }]
    data = [], // Table Rows
    filters = [], // Definition of filters
    filterValues = {},
    onFilterChange,
    onSearch, // (query) => void
    onFilterClick, // () => void
    onExport, // (type) => void
    isLoading = false,

    // Pagination Props
    currentPage = 1,
    totalPages = 1,
    onPageChange,

    // Infinite Scroll Props
    enableInfiniteScroll = false,
    onLoadMore = null,
    hasMore = false,
    loadingMore = false,
}) => {
    const { store, settings } = usePage().props;
 
    // Local State for sorting (if client side) - though server side is better for big reports
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [isCustomOpen, setIsCustomOpen] = useState(false);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        // In real app, might trigger server sort here
    };

    const observerTarget = React.useRef(null);

    // Intersection Observer for Infinite Scroll
    React.useEffect(() => {
        if (!enableInfiniteScroll || !onLoadMore || !hasMore) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !loadingMore) {
                    onLoadMore();
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [enableInfiniteScroll, onLoadMore, hasMore, loadingMore]);

    // Client-side sorting wrapper (optional usage)
    const sortedData = React.useMemo(() => {
        if (!sortConfig.key) return data;
        return [...data].sort((a, b) => {
            // Handle nested keys e.g. 'customer.name'
            const getValue = (obj, path) => path.split('.').reduce((o, i) => (o ? o[i] : null), obj);

            const aVal = getValue(a, sortConfig.key);
            const bVal = getValue(b, sortConfig.key);

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    return (
        <div className="flex flex-col h-full space-y-2">

            {/* 1. HEADER & ACTIONS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-ink tracking-tight">
                        {title}
                    </h1>
                    <p className="text-xs text-ink-muted font-medium">
                        Real-time analytics and data reporting
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search report..."
                            onChange={(e) => onSearch && onSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-surface border border-line rounded-xl text-sm font-bold focus:ring-2 ring-brand-500/20 outline-none w-full md:w-64 transition-all hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                        />
                    </div>

                    {onFilterClick && (
                        <button
                            onClick={onFilterClick}
                            className="p-2 bg-surface border border-line rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary transition-all shadow-sm active:scale-95"
                        >
                            <Filter size={20} />
                        </button>
                    )}

                    <button
                        onClick={() => onExport && onExport('csv')}
                        className="p-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-all active:scale-95 border border-brand-100 dark:border-brand-800"
                        title="Export CSV"
                    >
                        <Download size={20} />
                    </button>

                    <button
                        onClick={() => onExport && onExport('print')}
                        className="p-2 bg-sunken text-ink-secondary rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-all active:scale-95 border border-line"
                        title="Print Report"
                    >
                        <Printer size={20} />
                    </button>
                </div>
            </div>

            {/* 1.5 FILTERS (New Custom Layout) */}
            <div className="bg-surface border border-line rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md shadow-neutral-200/5 dark:shadow-none shrink-0">
                {/* Left: Universal Search (Customer) */}
                <div className="w-full md:w-auto md:flex-1 md:max-w-md relative z-20">
                    {filters.find(f => f.type === 'universal_search') && (() => {
                        const f = filters.find(f => f.type === 'universal_search');
                        const [isOpen, setIsOpen] = useState(false);
                        const [query, setQuery] = useState('');
                        const options = f.options || [];
                        const filteredOptions = query === ''
                            ? options.slice(0, 50)
                            : options.filter(opt => opt.label.toLowerCase().includes(query.toLowerCase())).slice(0, 50);

                        return (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                                <input
                                    type="text"
                                    placeholder={f.label || "Search customer..."}
                                    className="w-full pl-10 pr-4 py-2 bg-app border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20"
                                    value={filterValues[f.key] ? options.find(o => o.value == filterValues[f.key])?.label : query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        onFilterChange({ ...filterValues, [f.key]: null }); // Clear selection on type
                                        setIsOpen(true);
                                    }}
                                    onFocus={() => {
                                        setIsOpen(true);
                                        // If value exists, clear query to show list? Or keep label?
                                        if (filterValues[f.key]) setQuery('');
                                    }}
                                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                                />
                                {isOpen && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-surface rounded-xl shadow-xl border border-line max-h-60 overflow-y-auto custom-scrollbar p-1">
                                        {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-brand-50 dark:hover:bg-interactive-hover text-ink-secondary"
                                                onClick={() => {
                                                    onFilterChange({ ...filterValues, [f.key]: opt.value });
                                                    setQuery(opt.label);
                                                    setIsOpen(false);
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        )) : (
                                            <div className="p-3 text-xs text-ink-muted text-center">No results found</div>
                                        )}
                                    </div>
                                )}
                                {filterValues[f.key] && (
                                    <button
                                        onClick={() => {
                                            onFilterChange({ ...filterValues, [f.key]: null });
                                            setQuery('');
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-red-500"
                                    >
                                        <div className="bg-sunken rounded-full p-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                        </div>
                                    </button>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* Right: Date Presets */}
                <div className="flex bg-sunken p-1 rounded-xl shrink-0 items-center transition-all duration-slow">
                    {[
                        { label: 'Today', type: 'today' },
                        { label: 'This Month', type: 'month' },
                        { label: 'This Year', type: 'year' },
                    ].map((preset, idx) => {
                        // Logic to check if active
                        const isActive = (() => {
                            if (!filterValues.start_date || !filterValues.end_date) return false;

                            const getRange = (type) => {
                                const today = new Date();
                                const toLocalISO = (d) => {
                                    const offset = d.getTimezoneOffset() * 60000;
                                    return new Date(d.getTime() - offset).toISOString().split('T')[0];
                                };

                                let start, end;
                                if (type === 'month') {
                                    start = new Date(today.getFullYear(), today.getMonth(), 1);
                                    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                                } else if (type === 'year') {
                                    start = new Date(today.getFullYear(), 0, 1);
                                    end = new Date(today.getFullYear(), 11, 31);
                                } else {
                                    start = new Date();
                                    end = new Date();
                                }
                                return { start: toLocalISO(start), end: toLocalISO(end) };
                            };

                            const range = getRange(preset.type);
                            return filterValues.start_date === range.start && filterValues.end_date === range.end;
                        })();

                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    setIsCustomOpen(false); // Close custom view when preset is clicked
                                    const today = new Date();
                                    const toLocalISO = (d) => {
                                        const offset = d.getTimezoneOffset() * 60000;
                                        return new Date(d.getTime() - offset).toISOString().split('T')[0];
                                    };

                                    let start = new Date();
                                    let end = new Date();

                                    if (preset.type === 'month') {
                                        start = new Date(today.getFullYear(), today.getMonth(), 1);
                                        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                                    } else if (preset.type === 'year') {
                                        start = new Date(today.getFullYear(), 0, 1);
                                        end = new Date(today.getFullYear(), 11, 31);
                                    }

                                    onFilterChange({
                                        ...filterValues,
                                        start_date: toLocalISO(start),
                                        end_date: toLocalISO(end)
                                    });
                                }}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${isActive
                                    ? 'bg-sunken text-brand-600 shadow-sm'
                                    : 'text-ink-muted hover:text-brand-600'
                                    }`}
                            >
                                {preset.label}
                            </button>
                        );
                    })}

                    {/* Custom Date Trigger & Inputs */}
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsCustomOpen(!isCustomOpen)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors ${isCustomOpen ? 'text-brand-600' : 'text-ink-muted hover:text-brand-600'
                                }`}
                        >
                            Custom {isCustomOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        </button>

                        {isCustomOpen && (
                            <div className="flex items-center gap-2 pl-2 overflow-hidden transition-all duration-slow animate-in slide-in-from-left-2 fade-in">
                                <input
                                    type="date"
                                    value={filterValues.start_date || ''}
                                    onChange={(e) => onFilterChange({ ...filterValues, start_date: e.target.value })}
                                    className="w-28 px-2 py-1 text-xs bg-sunken border border-line dark:border-line rounded-md focus:ring-1 focus:ring-brand-500 outline-none text-ink-secondary dark:text-ink"
                                />
                                <span className="text-ink-muted text-2xs font-bold">TO</span>
                                <input
                                    type="date"
                                    value={filterValues.end_date || ''}
                                    onChange={(e) => onFilterChange({ ...filterValues, end_date: e.target.value })}
                                    className="w-28 px-2 py-1 text-xs bg-sunken border border-line dark:border-line rounded-md focus:ring-1 focus:ring-brand-500 outline-none text-ink-secondary dark:text-ink"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. STATS CARDS (Single Line Compact Layout) */}
            {stats.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-surface border border-line rounded-xl p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                            {/* Decorative Background */}
                            <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-neutral-50 to-transparent dark:from-neutral-800/50 opacity-50 group-hover:w-24 transition-all duration-slower" />

                            {/* Left: Icon + Label */}
                            <div className="flex items-center gap-3 relative z-10">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${stat.type === 'up' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                                    stat.type === 'down' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                                        'bg-brand-50 text-brand-600 dark:bg-brand-900/20'
                                    }`}>
                                    {/* Safely handle icon: Clone if Element, render Fallback if missing/invalid */}
                                    {React.isValidElement(stat.icon) ? (
                                        React.cloneElement(stat.icon, { size: 16 })
                                    ) : (
                                        // Fallback icon if none provided or invalid
                                        <ArrowUpRight size={16} />
                                    )}
                                </div>
                                <p className="text-1xs font-bold text-ink-muted uppercase tracking-wide">{stat.label}</p>
                            </div>

                            {/* Right: Value */}
                            <div className="relative z-10 text-right">
                                <div className="flex items-center gap-2 justify-end">
                                    <h3 className="text-lg font-bold text-ink tracking-tight">{stat.value}</h3>
                                    {stat.subValue && (
                                        <span className={`text-2xs font-bold ${stat.type === 'up' ? 'text-emerald-500' : 'text-amber-500'
                                            }`}>
                                            {stat.subValue}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 3. CHART SECTION (Conditional) */}
            {chartData.length > 0 && (
                <div className="bg-surface border border-line rounded-2xl p-5 shadow-xl shadow-neutral-200/20 dark:shadow-black/20 shrink-0 h-80 min-h-[320px] relative">
                    <h3 className="text-sm font-bold text-ink-muted uppercase mb-4">Analytics Overview</h3>
                    <div className="w-full h-full pb-6">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            {chartConfig.type === 'bar' ? (
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={vq.slate[200]} opacity={0.5} />
                                    <XAxis dataKey={chartConfig.xAxisKey} axisLine={false} tickLine={false} tick={{ fill: vq.slate[400], fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: vq.slate[400], fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: vq.slate[100] }}
                                    />
                                    {Array.isArray(chartConfig.dataKey) ? chartConfig.dataKey.map((key, i) => (
                                        <Bar key={key} dataKey={key} fill={[vq.indigo[500], vq.purple[500], vq.pink[500]][i % 3]} radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    )) : (
                                        <Bar dataKey={chartConfig.dataKey} fill={chartConfig.color} radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    )}
                                    <Legend />
                                </BarChart>
                            ) : (
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={chartConfig.color} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={chartConfig.color} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={vq.slate[200]} opacity={0.5} />
                                    <XAxis dataKey={chartConfig.xAxisKey} axisLine={false} tickLine={false} tick={{ fill: vq.slate[400], fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: vq.slate[400], fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey={chartConfig.dataKey} stroke={chartConfig.color} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* 4. DATA TABLE */}
            <div className="flex-1 bg-surface border border-line rounded-2xl shadow-xl shadow-neutral-200/20 dark:shadow-black/20 flex flex-col min-h-0 overflow-hidden">
                {/* Table Header / Toolbar optional */}

                {/* Scrollable Table */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-app sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                {columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        onClick={() => col.sortable && handleSort(col.key)}
                                        className={`px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 select-none' : ''}`}
                                        style={{ width: col.width, textAlign: col.align || 'left' }}
                                    >
                                        <div className={`flex items-center gap-2 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                                            {col.label}
                                            {col.sortable && (
                                                <div className="flex flex-col">
                                                    <ChevronUp size={10} className={sortConfig.key === col.key && sortConfig.direction === 'asc' ? 'text-brand-600' : 'text-neutral-300'} />
                                                    <ChevronDown size={10} className={sortConfig.key === col.key && sortConfig.direction === 'desc' ? 'text-brand-600' : 'text-neutral-300'} />
                                                </div>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {isLoading ? (
                                // Loading Skeleton
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {columns.map((_, c) => (
                                            <td key={c} className="px-6 py-4">
                                                <div className="h-4 bg-sunken rounded w-3/4"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : sortedData.length === 0 ? (
                                // Empty State
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-12 text-center text-ink-muted">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sunken mb-4">
                                            <Search size={24} className="opacity-50" />
                                        </div>
                                        <p className="font-medium">No results found matching your criteria</p>
                                    </td>
                                </tr>
                            ) : (
                                // Data Rows
                                sortedData.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-brand-50/30 dark:hover:bg-interactive-hover transition-colors group">
                                        {columns.map((col, cIdx) => (
                                            <td
                                                key={cIdx}
                                                className={`px-6 py-4 text-sm font-medium text-ink-secondary whitespace-nowrap`}
                                                style={{ textAlign: col.align || 'left' }}
                                            >
                                                {col.render ? col.render(row) : (
                                                    // Default Render Logic
                                                    col.type === 'currency' ? formatCurrency(row[col.key], store || settings) :
                                                        col.type === 'number' ? formatNumber(row[col.key], null, store || settings) :
                                                            col.type === 'date' ? new Date(row[col.key]).toLocaleDateString() :
                                                                row[col.key] || <span className="text-neutral-300 italic">-</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}

                            {enableInfiniteScroll && (
                                <>
                                    <tr ref={observerTarget}>
                                        <td colSpan={columns.length} className="h-4 p-0"></td>
                                    </tr>
                                    {loadingMore && (
                                        <tr>
                                            <td colSpan={columns.length} className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2 text-ink-muted">
                                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-xs font-bold uppercase">Loading more...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {!enableInfiniteScroll && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-line bg-sunken/50 dark:bg-surface flex items-center justify-between shrink-0">
                        <span className="text-xs font-bold text-ink-muted">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage <= 1}
                                onClick={() => onPageChange && onPageChange(currentPage - 1)}
                                className="p-2 rounded-lg bg-surface border border-line text-ink-muted disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sunken dark:hover:bg-interactive-hover transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => onPageChange && onPageChange(currentPage + 1)}
                                className="p-2 rounded-lg bg-surface border border-line text-ink-muted disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sunken dark:hover:bg-interactive-hover transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MasterReport;

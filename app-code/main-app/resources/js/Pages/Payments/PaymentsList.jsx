import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrencySymbol } from '@/Utils/format';
import axios from 'axios';
import { usePage, Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import {
    ArrowDownCircle, ArrowUpCircle, Search, TrendingUp, TrendingDown,
    CreditCard, Banknote, Building2, ChevronUp, ChevronDown,
    Plus, RefreshCw, Calendar, User, Hash, StickyNote
} from 'lucide-react';

const formatCurrency = (val, store) =>
    (getCurrencySymbol()) + ' ' + (new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(val || 0)));

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const MethodIcon = ({ method }) => {
    const m = (method || '').toLowerCase();
    if (m === 'bank') return <Building2 size={12} />;
    if (m === 'card') return <CreditCard size={12} />;
    return <Banknote size={12} />;
};

const SortBtn = ({ label, sortKey, current, onSort }) => (
    <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1.5 text-xs font-bold text-ink-secondary uppercase tracking-wider hover:text-ink transition-colors"
    >
        {label}
        {current.key === sortKey
            ? current.dir === 'asc' ? <ChevronUp size={13} className="text-brand-600" /> : <ChevronDown size={13} className="text-brand-600" />
            : <span className="w-3" />}
    </button>
);

function PaymentRow({ item, type, store }) {
    const isIn = type === 'in';
    return (
        <tr className="group hover:bg-interactive-hover transition-colors border-b border-line last:border-0">
            {/* Date */}
            <td className="px-4 py-3 text-xs font-semibold text-ink tabular-nums whitespace-nowrap">
                {formatDate(item.date || item.created_at)}
            </td>
            {/* Party */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${isIn ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                        {(item.party?.name || 'G')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-ink truncate">
                            {item.party?.name || <span className="text-ink-muted italic">Walk-in Contact</span>}
                        </p>
                        {item.reference && (
                            <span className="text-[11px] font-mono font-medium text-ink-secondary bg-surface-2 px-1.5 py-0.5 rounded border border-line">
                                #{item.reference}
                            </span>
                        )}
                    </div>
                </div>
            </td>
            {/* Method */}
            <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-2 border border-line text-xs font-semibold text-ink uppercase">
                    <MethodIcon method={item.method} />
                    {item.method || 'Cash'}
                </span>
            </td>
            {/* Notes */}
            <td className="px-4 py-3 text-xs font-medium text-ink-secondary max-w-[180px] truncate">
                {item.notes || '—'}
            </td>
            {/* Amount */}
            <td className="px-4 py-3 text-right">
                <span className={`text-sm font-bold tabular-nums ${isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                    {isIn ? '+' : '−'} {formatCurrency(item.amount, store)}
                </span>
            </td>
        </tr>
    );
}

function PaymentPanel({ type, payments, sort, onSort, loading, observerRef, stats, store }) {
    const isIn = type === 'in';
    const accent = isIn
        ? { bg: 'bg-emerald-600 hover:bg-emerald-700', light: 'bg-emerald-50/80 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/60' }
        : { bg: 'bg-rose-600 hover:bg-rose-700', light: 'bg-rose-50/80 dark:bg-rose-950/30', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/60' };

    const sorted = [...payments].sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1;
        if (sort.key === 'amount') return (parseFloat(a.amount) - parseFloat(b.amount)) * dir;
        if (sort.key === 'date') return ((a.date || '') > (b.date || '') ? 1 : -1) * dir;
        return ((a.party?.name || '') > (b.party?.name || '') ? 1 : -1) * dir;
    });

    return (
        <div className="flex flex-col rounded-2xl border border-line bg-surface shadow-sm overflow-hidden min-h-0 flex-1">
            {/* Panel Header */}
            <div className={`flex flex-wrap items-center justify-between gap-y-2 px-5 py-3.5 border-b border-line ${accent.light}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isIn ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20' : 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'}`}>
                        {isIn ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-ink">
                            {isIn ? 'Payment In' : 'Payment Out'}
                        </h3>
                        <p className="text-xs font-medium text-ink-secondary">
                            {isIn ? 'Money received from customers & contacts' : 'Money paid out to suppliers & expenses'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-xl font-black tabular-nums ${accent.text}`}>
                        {formatCurrency(stats?.total || 0, store)}
                    </p>
                    <p className="text-xs font-semibold text-ink-secondary">
                        {payments.length} records · Today: <strong className="text-ink font-bold">{formatCurrency(stats?.today || 0, store)}</strong>
                    </p>
                </div>
            </div>

            {/* Add Button Bar */}
            <div className="px-5 py-2.5 border-b border-line bg-surface flex flex-wrap items-center justify-between gap-y-2 shrink-0">
                <span className="text-xs font-semibold text-ink-secondary">
                    {payments.length} {isIn ? 'Receipt' : 'Payment'} transaction{payments.length === 1 ? '' : 's'}
                </span>
                <Link
                    href={isIn ? route('store.payments.in', { store_slug: store.slug }) : route('store.payments.out', { store_slug: store.slug })}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95 ${accent.bg}`}
                >
                    <Plus size={14} />
                    Record {isIn ? 'Payment In' : 'Payment Out'}
                </Link>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1 min-h-0">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-surface-2/90 backdrop-blur-sm border-b border-line">
                        <tr>
                            <th className="px-4 py-3 w-[18%]">
                                <SortBtn label="Date" sortKey="date" current={sort} onSort={onSort} />
                            </th>
                            <th className="px-4 py-3 w-[36%]">
                                <SortBtn label="Party / Contact" sortKey="party" current={sort} onSort={onSort} />
                            </th>
                            <th className="px-4 py-3 w-[16%] text-xs font-bold text-ink-secondary uppercase tracking-wider">Method</th>
                            <th className="px-4 py-3 w-[14%] text-xs font-bold text-ink-secondary uppercase tracking-wider">Notes</th>
                            <th className="px-4 py-3 w-[16%] text-right">
                                <SortBtn label="Amount" sortKey="amount" current={sort} onSort={onSort} />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-16 text-center text-ink-secondary">
                                    <div className={`w-14 h-14 rounded-2xl ${accent.light} border ${accent.border} flex items-center justify-center mx-auto mb-3`}>
                                        {isIn ? <ArrowDownCircle size={26} className={accent.text} /> : <ArrowUpCircle size={26} className={accent.text} />}
                                    </div>
                                    <p className="font-bold text-ink text-base">No {isIn ? 'incoming' : 'outgoing'} payments yet</p>
                                    <p className="text-xs text-ink-secondary mt-1 max-w-xs mx-auto">Click &ldquo;Record {isIn ? 'Payment In' : 'Payment Out'}&rdquo; to add your first transaction</p>
                                </td>
                            </tr>
                        ) : (
                            sorted.map(item => <PaymentRow key={item.id} item={item} type={type} store={store} />)
                        )}
                        <tr ref={observerRef} className="h-1">
                            <td colSpan={5}>
                                {loading && (
                                    <div className="flex justify-center py-2">
                                        <RefreshCw size={14} className="text-ink-secondary animate-spin" />
                                    </div>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function PaymentsIndex({ payments = {}, stats = {}, filters = {}, store }) {
    const allData = payments.data || [];
    const inPayments = allData.filter(p => p.type === 'in');
    const outPayments = allData.filter(p => p.type === 'out');

    const [search, setSearch] = useState(filters.search || '');
    const [period, setPeriod] = useState(filters.filter || 'all');
    const [dateRange, setDateRange] = useState({ from: filters.from_date || '', to: filters.to_date || '' });

    const [allPayments, setAllPayments] = useState(allData);
    const [nextUrl, setNextUrl] = useState(payments.next_page_url);
    const [loadingMore, setLoadingMore] = useState(false);
    const observerInRef = useRef(null);
    const observerOutRef = useRef(null);
    const isLoadingRef = useRef(false);

    const [sortIn, setSortIn] = useState({ key: 'date', dir: 'desc' });
    const [sortOut, setSortOut] = useState({ key: 'date', dir: 'desc' });

    useEffect(() => {
        if (payments.data && payments.current_page === 1) {
            setAllPayments(payments.data);
            setNextUrl(payments.next_page_url);
        }
    }, [payments]);

    const fetchMore = useCallback(async () => {
        if (!nextUrl || isLoadingRef.current) return;
        isLoadingRef.current = true;
        setLoadingMore(true);
        try {
            const res = await axios.get(nextUrl, { headers: { Accept: 'application/json' } });
            setAllPayments(prev => {
                const ids = new Set(prev.map(p => p.id));
                return [...prev, ...res.data.data.filter(p => !ids.has(p.id))];
            });
            setNextUrl(res.data.next_page_url);
        } finally {
            isLoadingRef.current = false;
            setLoadingMore(false);
        }
    }, [nextUrl]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting) fetchMore(); },
            { threshold: 0.1, rootMargin: '400px' }
        );
        [observerInRef, observerOutRef].forEach(r => { if (r.current) observer.observe(r.current); });
        return () => observer.disconnect();
    }, [fetchMore]);

    const applyFilters = (extra = {}) => {
        router.get(route('store.payments.index', { store_slug: store.slug }), {
            search, filter: period,
            from_date: dateRange.from, to_date: dateRange.to,
            ...extra,
        }, { preserveState: true, preserveScroll: true });
    };

    const handlePeriod = (val) => {
        setPeriod(val);
        applyFilters({ filter: val });
    };

    const handleDate = (e) => {
        const newRange = { ...dateRange, [e.target.name]: e.target.value };
        setDateRange(newRange);
        if (newRange.from && newRange.to) applyFilters({ from_date: newRange.from, to_date: newRange.to, filter: 'custom' });
    };

    const filteredIn = allPayments.filter(p => p.type === 'in');
    const filteredOut = allPayments.filter(p => p.type === 'out');

    const makeSort = (setter) => (key) =>
        setter(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));

    // Derived stats
    const totalIn = filteredIn.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const totalOut = filteredOut.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const netFlow = totalIn - totalOut;
    const today = new Date().toISOString().slice(0, 10);
    const todayIn = filteredIn.filter(p => (p.date || '').startsWith(today)).reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const todayOut = filteredOut.filter(p => (p.date || '').startsWith(today)).reduce((s, p) => s + parseFloat(p.amount || 0), 0);

    const periods = [
        { val: 'all', label: 'All Time' },
        { val: 'today', label: 'Today' },
        { val: 'month', label: 'This Month' },
        { val: 'custom', label: 'Custom' },
    ];

    return (
        <OneGlanceLayout title="Payments" activeMenu="Money">
            <Head title="Payments — In & Out" />

            <div className="flex flex-col h-full bg-app p-2 md:p-3 gap-3 overflow-hidden">
                <MoneyModuleTabs activeTab="payments" />

                {/* ── Top Summary KPI Bar ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
                    {/* Total Received Card */}
                    <div className="bg-surface px-5 py-4 rounded-2xl border border-line flex flex-wrap items-center justify-between gap-y-2 shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                                <ArrowDownCircle size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Total Received</p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    {formatCurrency(totalIn, store)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[11px] font-semibold text-ink-muted uppercase block">Today</span>
                            <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                                {formatCurrency(todayIn, store)}
                            </span>
                        </div>
                    </div>

                    {/* Total Paid Out Card */}
                    <div className="bg-surface px-5 py-4 rounded-2xl border border-line flex flex-wrap items-center justify-between gap-y-2 shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm">
                                <ArrowUpCircle size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Total Paid Out</p>
                                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
                                    {formatCurrency(totalOut, store)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[11px] font-semibold text-ink-muted uppercase block">Today</span>
                            <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-xs font-bold text-rose-700 dark:text-rose-300 tabular-nums">
                                {formatCurrency(todayOut, store)}
                            </span>
                        </div>
                    </div>

                    {/* Net Cash Flow Card */}
                    <div className={`px-5 py-4 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-y-2 ${
                        netFlow >= 0
                            ? 'bg-surface border-line'
                            : 'bg-surface border-line'
                    }`}>
                        <div className="flex items-center gap-3.5">
                            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shadow-sm ${
                                netFlow >= 0 
                                    ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-200 dark:border-brand-800/80 text-brand-600 dark:text-brand-400' 
                                    : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80 text-amber-600 dark:text-amber-400'
                            }`}>
                                {netFlow >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Net Cash Flow</p>
                                <p className={`text-2xl font-black tabular-nums ${netFlow >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                    {netFlow >= 0 ? '+' : '−'} {formatCurrency(Math.abs(netFlow), store)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[11px] font-semibold text-ink-muted uppercase block">Activity</span>
                            <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-lg bg-surface-2 border border-line text-xs font-bold text-ink tabular-nums">
                                {filteredIn.length + filteredOut.length} transaction{(filteredIn.length + filteredOut.length) === 1 ? '' : 's'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-surface px-4 py-3 rounded-2xl border border-line shadow-sm shrink-0">
                    {/* Period pills */}
                    <div className="flex items-center gap-1.5">
                        {periods.map(p => (
                            <button
                                key={p.val}
                                onClick={() => handlePeriod(p.val)}
                                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${period === p.val
                                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                                        : 'bg-surface-2 text-ink-secondary hover:text-ink hover:bg-interactive-hover border border-line'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {period === 'custom' && (
                        <div className="flex items-center gap-2 animate-in fade-in">
                            <Calendar size={14} className="text-ink-secondary" />
                            <input type="date" name="from" value={dateRange.from} onChange={handleDate}
                                className="px-2.5 py-1 text-xs font-semibold bg-app border border-line rounded-lg text-ink focus:ring-1 focus:ring-brand-500" />
                            <span className="text-ink-secondary text-xs font-bold">→</span>
                            <input type="date" name="to" value={dateRange.to} onChange={handleDate}
                                className="px-2.5 py-1 text-xs font-semibold bg-app border border-line rounded-lg text-ink focus:ring-1 focus:ring-brand-500" />
                        </div>
                    )}

                    <div className="relative min-w-[240px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyFilters({ search })}
                            placeholder="Search contact, reference..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-app border border-line rounded-xl text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* ── Two Panels Side by Side ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0 overflow-hidden">
                    <PaymentPanel
                        type="in"
                        payments={filteredIn}
                        sort={sortIn}
                        onSort={makeSort(setSortIn)}
                        loading={loadingMore}
                        observerRef={observerInRef}
                        stats={{ total: totalIn, today: todayIn }}
                        store={store}
                    />
                    <PaymentPanel
                        type="out"
                        payments={filteredOut}
                        sort={sortOut}
                        onSort={makeSort(setSortOut)}
                        loading={loadingMore}
                        observerRef={observerOutRef}
                        stats={{ total: totalOut, today: todayOut }}
                        store={store}
                    />
                </div>
            </div>
        </OneGlanceLayout>
    );
}

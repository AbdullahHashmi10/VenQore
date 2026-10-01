import PrintService from '@/Utils/PrintService';
import React, { useState, useCallback, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { getCurrencySymbol } from '@/Utils/format';
import { 
    Clock, 
    CheckSquare, 
    RotateCcw, 
    XCircle, 
    Search, 
    FileSpreadsheet, 
    Printer, 
    Eye, 
    Send,
    Edit3, 
    CheckCircle, 
    FileText,
    Filter,
    ChevronDown
} from 'lucide-react';

export default function MySubmissions({ documents = { data: [] }, filters = {}, stats = {} }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug || window.location.pathname.split('/')[2];
    const allDocs = Array.isArray(documents) ? documents : (documents?.data || []);
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

    const safeFilters = (filters && typeof filters === 'object' && !Array.isArray(filters)) ? filters : {};

    const [searchTerm, setSearchTerm] = useState(
        typeof safeFilters.search === 'string' ? safeFilters.search : (params.get('search') || '')
    );
    const [activeStatus, setActiveStatus] = useState(
        typeof safeFilters.status === 'string' ? safeFilters.status : (params.get('status') || '')
    );
    const [isStatsExpanded, setIsStatsExpanded] = useState(true);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const renderCurrency = (val) => {
        const symbol = getCurrencySymbol(store) || 'Rs';
        return (val < 0 ? '-' : '') + symbol + ' ' + new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(val) || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-PK', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    };

    const applyFilters = useCallback((newParams) => {
        router.get(window.location.pathname, {
            search: searchTerm || undefined,
            status: activeStatus || undefined,
            ...newParams
        }, { preserveState: true, preserveScroll: true, replace: true });
    }, [searchTerm, activeStatus]);

    const [debouncedSearch] = useMemo(() => {
        let timer;
        return [
            (val) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    applyFilters({ search: val });
                }, 400);
            }
        ];
    }, [applyFilters]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        debouncedSearch(e.target.value);
    };

    const handleStatusFilter = (status) => {
        setActiveStatus(status);
        applyFilters({ status: status || undefined });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                        <Clock size={11} className="animate-spin-slow" /> Waiting
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
                        <CheckCircle size={11} /> Approved
                    </span>
                );
            case 'returned':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-300/60 dark:border-orange-700/60">
                        <RotateCcw size={11} /> Needs Correction
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300/60 dark:border-rose-700/60">
                        <XCircle size={11} /> Rejected
                    </span>
                );
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase bg-sunken text-ink-muted">{status}</span>;
        }
    };

    const formatTypeLabel = (type) => {
        switch (type) {
            case 'purchase_posting': return 'Purchase Bill';
            case 'purchase_return': return 'Purchase Return';
            case 'sales_invoice': return 'Sales Invoice';
            case 'sales_return': return 'Sales Return';
            case 'pos_refund': return 'POS Refund';
            case 'pos_void': return 'POS Void';
            case 'customer_receipt': return 'Customer Receipt';
            case 'supplier_payment': return 'Supplier Payment';
            case 'operating_expense': return 'Operating Expense';
            case 'fund_transfer': return 'Vault Transfer';
            case 'capital_injection': return 'Capital Add';
            case 'owner_drawings': return 'Owner Drawing';
            case 'inventory_adjust': return 'Stock Adjust';
            case 'proposal': return 'Sales Proposal';
            default: return type ? type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Transaction';
        }
    };

    const exportToCsv = () => {
        const headers = ['Document #', 'Type', 'Status', 'Amount', 'Date', 'Description'];
        const rows = allDocs.map(d => [
            d.document_number,
            d.document_type,
            d.status,
            d.amount,
            d.created_at,
            `"${(d.description || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `my_submissions_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const statusFilters = [
        { id: '', label: `All (${stats.total_count || allDocs.length})`, activeColor: 'bg-brand-600 text-white' },
        { id: 'pending', label: `Waiting (${stats.pending_count || 0})`, activeColor: 'bg-amber-600 text-white' },
        { id: 'returned', label: `Needs Correction (${stats.returned_count || 0})`, activeColor: 'bg-orange-600 text-white' },
        { id: 'approved', label: `Approved (${stats.approved_count || 0})`, activeColor: 'bg-emerald-600 text-white' },
        { id: 'rejected', label: `Rejected (${stats.rejected_count || 0})`, activeColor: 'bg-rose-600 text-white' },
    ];

    return (
        <OneGlanceLayout title="My Submissions" activeMenu="Approvals">
            <Head title="My Approval Submissions" />

            <div className="flex flex-col min-h-full lg:h-full bg-app p-1 md:p-2 gap-1 lg:overflow-hidden relative">

                {/* 1. Header Bar: Submitter Only - Strictly NO Reviewer or Policies Tabs */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-surface border border-line p-2 rounded-2xl shadow-sm shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-sunken p-1.5 rounded-xl shrink-0">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-surface text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                <Send size={14} />
                                <span>My Submissions</span>
                                {(stats?.pending_count || 0) > 0 && (
                                    <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-2xs font-mono font-bold ml-1">
                                        {stats.pending_count}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 pr-2 text-xs font-semibold text-ink-muted">
                        <span>Total Tracked: <strong className="text-ink font-bold">{stats?.total_count || allDocs.length}</strong></span>
                    </div>
                </div>

                {/* Mobile Stats Toggle/Summary */}
                <div className="flex md:hidden items-center justify-between bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    <button
                        onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                        className="flex items-center gap-1.5 text-xs font-bold text-ink-muted uppercase text-left shrink-0 mr-2"
                    >
                        <span>Stats Summary</span>
                        <ChevronDown size={16} className={`transition-transform duration-normal ${isStatsExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {!isStatsExpanded && (
                        <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="text-amber-600">Waiting: {stats?.pending_count || 0}</span>
                            <span className="text-neutral-300 dark:text-ink-secondary">|</span>
                            <span className="text-orange-600">Rework: {stats?.returned_count || 0}</span>
                        </div>
                    )}
                </div>

                {/* 2. Compact Stats Cards Section - Matches Sales Structure and Minimal Vertical Space */}
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? 'grid' : 'hidden md:grid'}`}>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-col items-start gap-1 justify-between sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Pending Review</p>
                        </div>
                        <p className="text-base font-bold text-amber-600">{renderCurrency(stats?.pending_amount || 0)}</p>
                    </div>

                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-col items-start gap-1 justify-between sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                                <RotateCcw size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Needs Correction</p>
                        </div>
                        <p className="text-base font-bold text-orange-600">{stats?.returned_count || 0}</p>
                    </div>

                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-col items-start gap-1 justify-between sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckSquare size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Approved & Posted</p>
                        </div>
                        <p className="text-base font-bold text-emerald-600">{renderCurrency(stats?.approved_amount || 0)}</p>
                    </div>

                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-col items-start gap-1 justify-between sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
                                <FileText size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Total Submissions</p>
                        </div>
                        <p className="text-base font-bold text-ink">{stats?.total_count ?? allDocs.length}</p>
                    </div>
                </div>

                {/* 3. Header & Filter Bar - Desktop Layout */}
                <div className="hidden lg:flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-bold text-ink uppercase tracking-tight shrink-0">
                            MY <span className="text-brand-600">SUBMISSIONS</span>
                        </h1>
                        <div className="h-4 w-px bg-sunken mx-1"></div>
                        <div className="flex items-center gap-1 overflow-x-auto max-w-xl scrollbar-hide py-0.5">
                            {statusFilters.map((item) => {
                                const isActive = activeStatus === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleStatusFilter(item.id)}
                                        className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all whitespace-nowrap ${
                                            isActive
                                                ? `${item.activeColor} shadow-xs`
                                                : 'bg-sunken text-ink-muted hover:bg-interactive-hover hover:text-ink'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Search + Export & Print Icons */}
                    <div className="flex items-center gap-2">
                        <div className="w-64 relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearch}
                                placeholder="Search by doc #, partner, memo..."
                                className="w-full pl-9 pr-4 py-2 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={16} />
                        </div>
                        <div className="flex items-center gap-0.5 border-l border-line pl-2">
                            <button onClick={exportToCsv} className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600" title="Export Excel / CSV">
                                <FileSpreadsheet size={18} />
                            </button>
                            <button onClick={() => PrintService.printPage()} className="p-1.5 hover:bg-interactive-hover rounded-lg text-ink-muted" title="Print">
                                <Printer size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Header Area - Mobile Layout */}
                <div className="flex lg:hidden flex-col gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    <div className="flex items-center justify-between w-full">
                        <h1 className="text-sm font-bold text-ink uppercase tracking-tight">
                            MY <span className="text-brand-600">SUBMISSIONS</span>
                        </h1>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => { setShowMobileSearch(!showMobileSearch); if (showMobileFilters) setShowMobileFilters(false); }}
                                className={`p-2 rounded-lg transition-colors ${showMobileSearch ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}
                                title="Search"
                            >
                                <Search size={16} />
                            </button>
                            <button
                                onClick={() => { setShowMobileFilters(!showMobileFilters); if (showMobileSearch) setShowMobileSearch(false); }}
                                className={`p-2 rounded-lg transition-colors ${showMobileFilters ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}
                                title="Filters"
                            >
                                <Filter size={16} />
                            </button>
                            <button onClick={exportToCsv} className="p-2 rounded-lg bg-sunken text-emerald-600" title="Export">
                                <FileSpreadsheet size={16} />
                            </button>
                            <button onClick={() => PrintService.printPage()} className="p-2 rounded-lg bg-sunken text-ink-muted" title="Print">
                                <Printer size={16} />
                            </button>
                        </div>
                    </div>

                    {showMobileSearch && (
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearch}
                                placeholder="Search by doc #, partner, memo..."
                                className="w-full pl-9 pr-4 py-2 text-sm bg-app border border-line rounded-xl outline-none"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                        </div>
                    )}

                    {showMobileFilters && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-line">
                            {statusFilters.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleStatusFilter(item.id)}
                                    className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full ${
                                        activeStatus === item.id ? item.activeColor : 'bg-sunken text-ink-muted'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. Main Submissions Table - Strict Sales Structure & Vertical Conservation */}
                <div className="bg-surface rounded-xl border border-line shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="overflow-auto flex-1 scrollbar-thin">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-sunken/60 sticky top-0 z-10 border-b border-line text-2xs font-extrabold uppercase text-ink-muted tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3">DATE</th>
                                    <th className="py-2.5 px-3">DOCUMENT #</th>
                                    <th className="py-2.5 px-3">TRANSACTION</th>
                                    <th className="py-2.5 px-3">DETAILS / SUMMARY</th>
                                    <th className="py-2.5 px-3 text-right">AMOUNT</th>
                                    <th className="py-2.5 px-3 text-center">STATUS</th>
                                    <th className="py-2.5 px-3 text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line text-xs font-medium text-ink-secondary">
                                {allDocs.length > 0 ? (
                                    allDocs.map((doc) => {
                                        const payload = doc.current_revision?.payload || {};
                                        const partnerName = payload.party_name || payload.supplier_name || payload.customer_name || doc.description;

                                        return (
                                            <tr key={doc.id} className="hover:bg-interactive-hover transition-colors group">
                                                {/* Date */}
                                                <td className="py-2.5 px-3 font-mono text-ink-muted whitespace-nowrap">
                                                    {formatDate(doc.created_at)}
                                                </td>

                                                {/* Document # */}
                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                    <Link 
                                                        href={route('store.approvals.show', { store_slug: storeSlug, id: doc.id })}
                                                        className="font-bold text-brand-600 hover:text-brand-700 hover:underline font-mono"
                                                    >
                                                        {doc.document_number}
                                                    </Link>
                                                    <span className="block text-2xs font-mono text-ink-muted">v{doc.version || 1}</span>
                                                </td>

                                                {/* Type */}
                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                    <span className="px-2 py-0.5 rounded-md text-2xs font-bold bg-sunken border border-line text-ink">
                                                        {formatTypeLabel(doc.document_type)}
                                                    </span>
                                                </td>

                                                {/* Details */}
                                                <td className="py-2.5 px-3 max-w-xs truncate text-ink-secondary">
                                                    {partnerName || doc.description || '-'}
                                                </td>

                                                {/* Amount */}
                                                <td className="py-2.5 px-3 text-right font-mono font-bold text-sm text-ink whitespace-nowrap">
                                                    {renderCurrency(doc.amount)}
                                                </td>

                                                {/* Status */}
                                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                                    {getStatusBadge(doc.status)}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {doc.status === 'returned' && (
                                                            <Link
                                                                href={route('store.approvals.correct', { store_slug: storeSlug, id: doc.id })}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                                                            >
                                                                <Edit3 size={12} />
                                                                <span>Correct</span>
                                                            </Link>
                                                        )}
                                                        <Link
                                                            href={route('store.approvals.show', { store_slug: storeSlug, id: doc.id })}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-sunken hover:bg-interactive-hover text-ink border border-line rounded-lg text-xs font-bold shadow-xs transition"
                                                        >
                                                            <Eye size={12} />
                                                            <span>Details</span>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center text-ink-muted space-y-2">
                                            <Send size={36} className="mx-auto text-ink-muted/40" />
                                            <p className="text-sm font-bold text-ink">No approval submissions found</p>
                                            <p className="text-xs text-ink-muted">
                                                Transactions you submit that require supervisor review will appear here.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </OneGlanceLayout>
    );
}

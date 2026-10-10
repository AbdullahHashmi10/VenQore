import PrintService from '@/Utils/PrintService';
import React, { useState, useCallback, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { getCurrencySymbol } from '@/Utils/format';
import ApprovalsModuleTabs from '@/Components/ApprovalsModuleTabs';
import { 
    Clock, 
    CheckSquare, 
    RotateCcw, 
    Search, 
    FileSpreadsheet, 
    Printer, 
    Eye, 
    ShieldCheck, 
    FileText,
    Filter,
    ChevronDown
} from 'lucide-react';
import MobileStats from '@/Components/MobileStats';

export default function ApprovalsInbox({ documents = { data: [] }, filters = {}, stats = {} }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug || window.location.pathname.split('/')[2];
    const allDocs = Array.isArray(documents) ? documents : (documents?.data || []);
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

    const safeFilters = (filters && typeof filters === 'object' && !Array.isArray(filters)) ? filters : {};

    const [searchTerm, setSearchTerm] = useState(
        typeof safeFilters.search === 'string' ? safeFilters.search : (params.get('search') || '')
    );
    const [selectedType, setSelectedType] = useState(
        typeof safeFilters.type === 'string' ? safeFilters.type : (params.get('type') || '')
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
            type: selectedType || undefined,
            ...newParams
        }, { preserveState: true, preserveScroll: true, replace: true });
    }, [searchTerm, selectedType]);

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

    const handleFilterType = (type) => {
        setSelectedType(type);
        applyFilters({ type: type || undefined });
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
        const headers = ['Document #', 'Type', 'Maker', 'Amount', 'Date', 'Description'];
        const rows = allDocs.map(d => [
            d.document_number,
            d.document_type,
            d.maker?.name || 'Staff Member',
            d.amount,
            d.created_at,
            `"${(d.description || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `approvals_inbox_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filterTypesList = [
        { id: '', label: `All Types (${stats?.pending_count ?? allDocs.length})` },
        { id: 'purchase_posting', label: 'Purchase Bills' },
        { id: 'sales_invoice', label: 'Sales Invoices' },
        { id: 'customer_receipt', label: 'Customer Receipts' },
        { id: 'supplier_payment', label: 'Supplier Payments' },
        { id: 'operating_expense', label: 'Expenses' },
        { id: 'purchase_return', label: 'Purchase Returns' },
        { id: 'sales_return', label: 'Sales Returns' },
        { id: 'fund_transfer', label: 'Transfers' },
    ];

    return (
        <OneGlanceLayout title="Approval Inbox" activeMenu="Approvals">
            <Head title="Approval Inbox (Reviewer)" />

            <div className="flex flex-col min-h-full lg:h-full bg-app p-1 md:p-2 gap-1 lg:overflow-hidden relative">

                {/* 1. Module Tabs Strip - Matches SellModuleTabs */}
                <ApprovalsModuleTabs activeTab="inbox" pendingCount={stats?.pending_count ?? allDocs.length} />

                {/* Mobile Stats Toggle/Summary */}
                <MobileStats bp="md" open={isStatsExpanded} onToggle={() => setIsStatsExpanded(!isStatsExpanded)} items={[
  { label: 'Pending Review', value: renderCurrency(stats?.pending_amount || 0), tone: 'amber' },
  { label: 'Needs Correction', value: stats?.returned_count || 0, tone: 'orange' },
  { label: 'Approved & Posted', value: renderCurrency(stats?.approved_amount || 0), tone: 'emerald' },
  { label: 'Total Submissions', value: stats?.total_count ?? allDocs.length, tone: 'ink' }
]} />

                {/* 2. Compact Stats Cards Section - Matches Sales Structure and Minimal Vertical Space */}
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 hidden md:grid`}>
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
                            APPROVAL <span className="text-brand-600">INBOX</span>
                        </h1>
                        <div className="h-4 w-px bg-sunken mx-1"></div>
                        <div className="flex items-center gap-1 overflow-x-auto max-w-xl scrollbar-hide py-0.5">
                            {filterTypesList.map((item) => {
                                const isActive = selectedType === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleFilterType(item.id)}
                                        className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all whitespace-nowrap ${
                                            isActive
                                                ? 'bg-brand-600 text-white shadow-xs'
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
                                placeholder="Search doc #, maker..."
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
                    <div className="flex flex-wrap items-center justify-between gap-y-2 w-full">
                        <h1 className="text-sm font-bold text-ink uppercase tracking-tight">
                            APPROVAL <span className="text-brand-600">INBOX</span>
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
                                placeholder="Search doc #, maker..."
                                className="w-full pl-9 pr-4 py-2 text-sm bg-app border border-line rounded-xl outline-none"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                        </div>
                    )}

                    {showMobileFilters && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-line">
                            {filterTypesList.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleFilterType(item.id)}
                                    className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full ${
                                        selectedType === item.id ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. Main Documents Table - Strict Sales Structure & Vertical Conservation */}
                <div className="bg-surface rounded-xl border border-line shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="overflow-auto flex-1 scrollbar-thin">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-sunken/60 sticky top-0 z-10 border-b border-line text-2xs font-extrabold uppercase text-ink-muted tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3">DATE</th>
                                    <th className="py-2.5 px-3">DOCUMENT #</th>
                                    <th className="py-2.5 px-3">TRANSACTION</th>
                                    <th className="py-2.5 px-3">MAKER / SUBMITTER</th>
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

                                                {/* Maker / Submitter */}
                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-bold text-2xs flex items-center justify-center shrink-0">
                                                            {(doc.maker?.name || 'S').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold text-ink">{doc.maker?.name || 'Staff'}</span>
                                                    </div>
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
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                                                        <Clock size={11} className="animate-spin-slow" /> Pending Review
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                                    <Link
                                                        href={route('store.approvals.show', { store_slug: storeSlug, id: doc.id })}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                                                    >
                                                        <Eye size={12} />
                                                        <span>Review</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-16 text-center text-ink-muted space-y-2">
                                            <ShieldCheck size={36} className="mx-auto text-ink-muted/40" />
                                            <p className="text-sm font-bold text-ink">All Clear! No approval items waiting</p>
                                            <p className="text-xs text-ink-muted">
                                                Transactions awaiting your verification and review will appear here.
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

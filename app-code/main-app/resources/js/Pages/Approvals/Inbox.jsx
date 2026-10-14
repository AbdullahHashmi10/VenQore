import PrintService from '@/Utils/PrintService';
import React, { useState, useCallback, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { getCurrencySymbol } from '@/Utils/format';
import ApprovalsModuleTabs from '@/Components/ApprovalsModuleTabs';
import { ListPageFrame, ListToolbar, ListStatCards } from '@/Components/ListShell';
import ListFilterPill from '@/Components/ListFilterPill';
import { useStoreRoute } from '@/Hooks/useStoreRoute';
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
    ChevronDown, AlertCircle, Layers, Settings } from 'lucide-react';
import MobileStats from '@/Components/MobileStats';
import MobileListHeader from '@/Components/MobileListHeader';

export default function ApprovalsInbox({ documents = { data: [] }, filters = {}, stats = {} }) {
    const { store, auth } = usePage().props;
    const { storeRoute } = useStoreRoute();
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

    const isReviewer = Boolean(auth?.user?.can_review_approvals && !auth?.user?.requires_approval);
    const approvalNavGroups = isReviewer ? [{ id: 'approvals', label: 'Approvals', items: [
        { id: 'inbox', label: 'Reviewer Inbox', href: storeRoute('store.approvals.inbox'), icon: ShieldCheck },
        { id: 'settings', label: 'Approval Policies', href: route('store.settings', { store_slug: store?.slug, tab: 'approvals' }), icon: Settings },
    ] }] : [];

    return (
        <OneGlanceLayout title="Approval Inbox" activeMenu="Approvals" noPadding>
            <Head title="Approval Inbox (Reviewer)" />

            <ListPageFrame className="flex flex-col min-h-full bg-app p-2.5 gap-1">

                {/* 1. Module Tabs Strip - Matches SellModuleTabs */}
                <div className="md:hidden"><ApprovalsModuleTabs activeTab="inbox" pendingCount={stats?.pending_count ?? allDocs.length} /></div>

                {/* PHONE header (Inventory pattern) */}
                <MobileListHeader
                    title="Approval Inbox"
                    filters={[{ key: 'type', icon: Layers, label: 'Document type', value: selectedType, options: filterTypesList, onChange: handleFilterType }]}
                    search={{ event: true,  value: searchTerm, onChange: handleSearch, placeholder: 'Search doc #, maker...' }}
                    actions={[{ icon: FileSpreadsheet, label: 'Export CSV', onClick: exportToCsv }]}
                />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'Pending Review', value: renderCurrency(stats?.pending_amount || 0), tone: 'amber', icon: Clock },
                    { label: 'Needs Correction', value: stats?.returned_count || 0, tone: 'orange', icon: RotateCcw },
                    { label: 'Approved & Posted', value: renderCurrency(stats?.approved_amount || 0), tone: 'emerald', icon: CheckSquare },
                    { label: 'Total Submissions', value: stats?.total_count ?? allDocs.length, tone: 'ink', icon: FileText }
                ]} />

                {/* Desktop: ROW 1 toolbar + ROW 2 stat cards */}
                <ListToolbar
                    title="Approval Inbox"
                    navGroups={approvalNavGroups}
                    activeId="inbox"
                    left={(
                        <ListFilterPill
                            icon={Layers}
                            label="All types"
                            value={selectedType}
                            allValue=""
                            options={filterTypesList.map((f) => ({ value: f.id, label: f.label }))}
                            onChange={handleFilterType}
                        />
                    )}
                    search={{ value: searchTerm, onChange: (v) => handleSearch({ target: { value: v } }), placeholder: 'Search doc #, maker...' }}
                    actions={(
                        <>
                            <button type="button" onClick={exportToCsv} className="h-10 w-10 flex items-center justify-center rounded-[12px] text-emerald-600 hover:bg-interactive-hover transition-colors" title="Export Excel / CSV">
                                <FileSpreadsheet size={18} />
                            </button>
                            <button type="button" onClick={() => PrintService.printPage()} className="h-10 w-10 flex items-center justify-center rounded-[12px] text-ink-muted hover:bg-interactive-hover transition-colors" title="Print">
                                <Printer size={18} />
                            </button>
                        </>
                    )}
                />
                <ListStatCards cards={[
                    { label: 'Pending Review', value: renderCurrency(stats?.pending_amount || 0), icon: Clock, icon_tone: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', value_tone: 'text-amber-600' },
                    { label: 'Needs Correction', value: stats?.returned_count || 0, icon: RotateCcw, icon_tone: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', value_tone: 'text-orange-600' },
                    { label: 'Approved & Posted', value: renderCurrency(stats?.approved_amount || 0), icon: CheckSquare, icon_tone: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', value_tone: 'text-emerald-600' },
                    { label: 'Total Submissions', value: stats?.total_count ?? allDocs.length, icon: FileText },
                ]} />

                {/* 4. Main Documents Table - Strict Sales Structure & Vertical Conservation */}
                <div className="bg-surface rounded-xl md:rounded-[14px] border border-line shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="overflow-auto flex-1 scrollbar-thin">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-sunken/60 sticky top-0 z-10 border-b border-line text-2xs font-extrabold uppercase text-ink-muted tracking-wider">
                                <tr>
                                    <th className="sticky top-0 z-10 bg-sunken py-2.5 px-3">DATE</th>
                                    <th className="sticky top-0 z-10 bg-sunken py-2.5 px-3">DOCUMENT #</th>
                                    <th className="sticky top-0 z-10 bg-sunken py-2.5 px-3">TRANSACTION</th>
                                    <th className="sticky top-0 z-10 bg-sunken py-2.5 px-3">MAKER / SUBMITTER</th>
                                    <th className="sticky top-0 z-10 bg-sunken py-2.5 px-3">DETAILS / SUMMARY</th>
                                    <th className="sticky top-0 z-10 bg-sunken py-2.5 px-3 text-right">AMOUNT</th>
                                    <th className="sticky top-0 z-10 bg-sunken py-2.5 px-3 text-center">STATUS</th>
                                    <th className="sticky top-0 z-10 bg-sunken py-2.5 px-3 text-right">ACTIONS</th>
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

            </ListPageFrame>
        </OneGlanceLayout>
    );
}

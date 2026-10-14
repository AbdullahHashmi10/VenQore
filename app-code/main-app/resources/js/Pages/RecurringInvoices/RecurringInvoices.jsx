import PrintService from '@/Utils/PrintService';
import React, { useState, useMemo } from 'react';
import { getCurrencySymbol } from '@/Utils/format';
import { usePage, Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Repeat, Search, Plus, Download, Eye, Edit, Trash2, Play, Pause, Calendar, Clock, DollarSign, Users, Printer, ChevronDown, ChevronUp, X, Filter, Check } from 'lucide-react';
import { useAlert } from '@/Contexts/AlertContext';
import SellModuleTabs, { useSellNavGroups } from '@/Components/SellModuleTabs';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
import { useTermText } from '@/lib/terms';
import MobileStats from '@/Components/MobileStats';

export default function RecurringInvoicesIndex({ recurringInvoices = [] }) {
    const tt = useTermText();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
    const { showConfirm, showAlert } = useAlert();
    const { store } = usePage().props;
    const navGroups = useSellNavGroups();

    // Filter invoices
    const filteredInvoices = useMemo(() => {
        return recurringInvoices.filter(item => {
            const matchesSearch = !searchTerm ||
                item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [recurringInvoices, searchTerm, statusFilter]);

    // Stats
    const stats = useMemo(() => {
        return {
            total: recurringInvoices.length,
            active: recurringInvoices.filter(i => i.status === 'active').length,
            paused: recurringInvoices.filter(i => i.status === 'paused').length,
            monthlyRevenue: recurringInvoices
                .filter(i => i.status === 'active')
                .reduce((sum, i) => sum + parseFloat(i.amount || 0), 0)
        };
    }, [recurringInvoices]);

    const getStatusBadge = (status) => {
        const styles = {
            active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            completed: 'bg-neutral-100 text-ink-secondary dark:bg-app dark:text-ink-muted',
        };
        return styles[status] || styles.active;
    };

    const getFrequencyLabel = (frequency) => {
        const labels = {
            daily: 'Daily',
            weekly: 'Weekly',
            monthly: 'Monthly',
            quarterly: 'Quarterly',
            yearly: 'Yearly'
        };
        return labels[frequency] || frequency;
    };

    const handleToggleStatus = (invoice) => {
        const newStatus = invoice.status === 'active' ? 'paused' : 'active';
        showConfirm({
            title: `${newStatus === 'active' ? 'Resume' : 'Pause'} Recurring Invoice?`,
            message: `This will ${newStatus === 'active' ? 'resume' : 'pause'} automatic invoice generation.`,
            type: 'warning',
            confirmLabel: 'Yes, Continue',
            onConfirm: () => {
                router.post(route('store.recurring-invoices.toggle', invoice.id));
            }
        });
    };

    const handleDelete = (invoice) => {
        showConfirm({
            title: 'Delete Recurring Invoice?',
            message: 'This will stop all future invoices. Existing invoices will remain.',
            type: 'danger',
            confirmLabel: 'Yes, Delete',
            onConfirm: () => {
                router.delete(route('store.recurring-invoices.destroy', invoice.id));
            }
        });
    };

    return (
        <OneGlanceLayout title="Recurring Invoices" activeMenu="Sell" noPadding>
            <Head title="Recurring Invoices" />
            <ListPageFrame className="flex flex-col min-h-full bg-app p-2.5 gap-1">
                <div className="md:hidden"><SellModuleTabs activeTab="recurring" /></div>

                {/* Desktop header: row 1 toolbar, row 2 stat cards */}
                <ListToolbar
                    title="Recurring Invoices"
                    navGroups={navGroups}
                    activeId="recurring"
                    left={(
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 pl-3 pr-8 rounded-[12px] border border-line bg-surface text-sm font-semibold text-ink outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer hover:bg-interactive-hover" aria-label="Status">
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                        </select>
                    )}
                    search={{ value: searchTerm, onChange: (v) => setSearchTerm(v), placeholder: tt('Search by title or customer...') }}
                    actions={(
                        <>
                            <button type="button" className="h-10 w-10 rounded-[12px] border border-line bg-surface flex items-center justify-center hover:bg-interactive-hover transition-colors text-ink-muted" title="Print" onClick={() => PrintService.printPage()}><Printer size={18} /></button>
                            <ListAddButton href={route('store.recurring-invoices.create', { store_slug: store.slug })} icon={Plus}>New Recurring</ListAddButton>
                        </>
                    )}
                />
                <ListStatCards cards={[
                    { label: 'Total', value: stats.total, icon: Repeat, icon_tone: 'bg-brand-100 text-brand-600' },
                    { label: 'Active', value: stats.active, icon: Play, icon_tone: 'bg-emerald-100 text-emerald-600', value_tone: 'text-emerald-600' },
                    { label: 'Paused', value: stats.paused, icon: Pause, icon_tone: 'bg-amber-100 text-amber-600', value_tone: 'text-amber-600' },
                    { label: 'Monthly Revenue', value: (stats.monthlyRevenue < 0 ? '-' : '') + (getCurrencySymbol()) + ' ' + new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(stats.monthlyRevenue) || 0), icon: DollarSign, icon_tone: 'bg-brand-100 text-brand-600', value_tone: 'text-brand-600' },
                ]} />

               {/* Mobile header (phone only) */}
 <div className="md:hidden relative z-40 shrink-0 bg-surface border border-line rounded-[14px] shadow-sm">
 {showMobileFilters && <div className="fixed inset-0 z-30" onClick={() => setShowMobileFilters(false)} aria-hidden="true" />}
 <div className="relative z-40 h-12 flex items-center gap-1 px-1.5">
 <div className="min-w-0 flex-1 pl-2">
 <span className="text-[15px] font-bold text-ink tracking-tight truncate block">Recurring Invoices</span>
 </div>
 <div>
 <button type="button" onClick={() => setShowMobileFilters(!showMobileFilters)} aria-haspopup="listbox" aria-expanded={showMobileFilters} aria-label="Filter"
 className={`h-9 px-2 rounded-[10px] border flex items-center gap-1 transition-colors ${statusFilter !== 'all' ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'border-line bg-app text-ink-secondary'}`}>
 <Filter size={16} />
 <ChevronDown size={14} className={`transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`} />
 </button>
 {showMobileFilters && (
 <div role="listbox" className="absolute left-0 right-0 top-full mt-1 max-h-[60vh] overflow-y-auto bg-surface border border-line rounded-[12px] shadow-xl p-1.5 animate-[vqDrop_0.16s_ease-out] origin-top">
 {[['all', 'All'], ['active', 'Active'], ['paused', 'Paused']].map(([key, label]) => (
 <button key={key} type="button" role="option" aria-selected={statusFilter === key} onClick={() => { setStatusFilter(key); setShowMobileFilters(false); }}
 className={`w-full h-10 px-3 rounded-[8px] text-sm text-left flex items-center justify-between gap-2 ${statusFilter === key ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-semibold' : 'text-ink active:bg-interactive-hover'}`}>
 <span className="truncate">{label}</span>
 {statusFilter === key && <Check size={15} className="shrink-0" />}
 </button>
 ))}
 </div>
 )}
 </div>
 <button type="button" onClick={() => setShowMobileSearch(!showMobileSearch)} aria-label="Search"
 className={`h-9 w-9 rounded-[10px] flex items-center justify-center transition-colors ${showMobileSearch || searchTerm ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'bg-app text-ink-secondary'}`}>
 <Search size={17} />
 </button>
 <Link href={route('store.recurring-invoices.create', { store_slug: store.slug })} aria-label="New Recurring"
 className="h-9 w-9 rounded-[10px] bg-brand-600 text-white flex items-center justify-center shadow-sm active:bg-brand-700">
 <Plus size={19} />
 </Link>
 </div>
 {showMobileSearch && (
 <div className="px-1.5 pb-1.5 -mt-0.5">
 <div className="relative">
 <input autoFocus type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={tt('Search by title or customer...')}
 className="w-full h-10 pl-9 pr-3 text-sm bg-app border border-line rounded-[10px] text-ink placeholder:text-ink-muted outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={15} />
 </div>
 </div>
 )}
 </div>

 <MobileStats bp="md" hero={3} items={[
 { label: 'Total', value: stats.total, tone: 'brand', icon: Repeat },
 { label: 'Active', value: stats.active, tone: 'emerald', icon: Play },
 { label: 'Paused', value: stats.paused, tone: 'amber', icon: Pause },
 { label: 'Monthly Revenue', value: (stats.monthlyRevenue < 0 ? '-' : '') + (getCurrencySymbol()) + ' ' + new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(stats.monthlyRevenue) || 0), tone: 'brand', icon: DollarSign }
 ]} />

  {/* Main Table container */}
                <div className="flex-1 md:min-h-0 overflow-auto md:rounded-[14px] md:border md:border-line md:shadow-sm bg-transparent md:bg-surface">
                    <table className="hidden md:table w-full text-left border-collapse">
                        <thead className="bg-app text-ink-muted font-bold uppercase text-2xs tracking-widest sticky top-0 z-10 backdrop-blur-sm">
                            <tr className="border-b border-line">
                                <th className="sticky top-0 z-10 bg-app px-6 py-3">Title</th>
                                <th className="sticky top-0 z-10 bg-app px-6 py-3">{tt('Customer')}</th>
                                <th className="sticky top-0 z-10 bg-app px-6 py-3 text-right">Amount</th>
                                <th className="sticky top-0 z-10 bg-app px-6 py-3 text-center">Frequency</th>
                                <th className="sticky top-0 z-10 bg-app px-6 py-3">Next Invoice</th>
                                <th className="sticky top-0 z-10 bg-app px-6 py-3 text-center">Generated</th>
                                <th className="sticky top-0 z-10 bg-app px-6 py-3 text-center">Status</th>
                                <th className="sticky top-0 z-10 bg-app px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <Repeat size={48} className="mx-auto text-ink-muted mb-4" />
                                        <p className="text-ink-secondary font-bold">No recurring invoices found</p>
                                        <p className="text-ink-muted text-sm mt-1">Create one to automate your billing</p>
                                        <Link
                                            href={route('store.recurring-invoices.create', { store_slug: store.slug })}
                                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium shadow-md"
                                        >
                                            <Plus size={18} />
                                            Create Recurring Invoice
                                        </Link>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                        <td className="px-6 py-3">
                                            <span className="font-bold text-ink">
                                                {invoice.title || `Recurring #${invoice.id}`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center">
                                                    <Users size={14} className="text-brand-600 dark:text-brand-400" />
                                                </div>
                                                <span className="font-medium text-ink-secondary">
                                                    {invoice.customer?.name || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="font-bold text-ink">
                                                {(parseFloat(invoice.amount || 0) < 0 ? '-' : '') + (getCurrencySymbol()) + ' ' + new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(parseFloat(invoice.amount || 0)) || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded-lg text-xs font-bold">
                                                {getFrequencyLabel(invoice.frequency)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2 text-ink-secondary">
                                                <Calendar size={14} />
                                                {invoice.next_invoice_date ? new Date(invoice.next_invoice_date).toLocaleDateString() : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className="font-bold text-ink">
                                                {invoice.invoices_generated || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadge(invoice.status)}`}>
                                                {invoice.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleToggleStatus(invoice)}
                                                    className={`p-2 rounded-lg transition-all ${invoice.status === 'active'
                                                            ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                                        }`}
                                                    title={invoice.status === 'active' ? 'Pause' : 'Resume'}
                                                >
                                                    {invoice.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                                                </button>
                                                <Link
                                                    href={route('store.recurring-invoices.edit', invoice.id)}
                                                    className="p-2 text-ink-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-all"
                                                >
                                                    <Edit size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(invoice)}
                                                    className="p-2 text-ink-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Mobile View - Cards List */}
                    <div className="md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent">
                        {filteredInvoices.length === 0 ? (
                            <div className="bg-surface rounded-xl p-4 sm:p-8 text-center border border-line">
                                <Repeat size={32} className="mx-auto text-ink-muted mb-2" />
                                <p className="text-sm font-bold text-ink-secondary">No recurring invoices found</p>
                            </div>
                        ) : (
                            filteredInvoices.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="bg-surface p-4 rounded-xl border border-line shadow-sm flex flex-col gap-3 transition-transform"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="font-bold text-sm text-ink">
                                                {invoice.title || `Recurring #${invoice.id}`}
                                            </span>
                                            <div className="flex items-center gap-1 text-2xs text-ink-muted mt-0.5">
                                                <Calendar size={10} />
                                                <span>Next: {invoice.next_invoice_date ? new Date(invoice.next_invoice_date).toLocaleDateString() : '-'}</span>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${getStatusBadge(invoice.status)}`}>
                                            {invoice.status || 'active'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center border-t border-b border-line py-2.5">
                                        <div>
                                            <p className="text-2xs font-bold text-ink-muted uppercase tracking-wider">{tt('Customer')}</p>
                                            <p className="text-xs font-bold text-ink mt-0.5">{invoice.customer?.name || 'Unknown'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xs font-bold text-ink-muted uppercase tracking-wider">Amount</p>
                                            <p className="text-xs font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                                                {(parseFloat(invoice.amount || 0) < 0 ? '-' : '') + (getCurrencySymbol()) + ' ' + new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(parseFloat(invoice.amount || 0)) || 0)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <div className="text-ink-muted text-1xs">
                                            Freq: <span className="font-bold text-ink-secondary">{getFrequencyLabel(invoice.frequency)}</span> • Gen: <span className="font-bold text-ink-secondary">{invoice.invoices_generated || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleToggleStatus(invoice)}
                                                className={`p-1.5 rounded-lg border transition-colors ${invoice.status === 'active'
                                                        ? 'text-amber-600 border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10'
                                                        : 'text-emerald-600 border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10'
                                                    }`}
                                                title={invoice.status === 'active' ? 'Pause' : 'Resume'}
                                            >
                                                {invoice.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                                            </button>
                                            <Link
                                                href={route('store.recurring-invoices.edit', invoice.id)}
                                                className="p-1.5 text-ink-muted bg-app border border-line rounded-lg hover:text-brand-600 transition-colors"
                                            >
                                                <Edit size={14} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(invoice)}
                                                className="p-1.5 text-ink-muted bg-app border border-line rounded-lg hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </ListPageFrame>
        </OneGlanceLayout>
    );
}

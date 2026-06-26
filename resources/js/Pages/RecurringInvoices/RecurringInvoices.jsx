import React, { useState, useMemo } from 'react';
import { getCurrencySymbol } from '@/Utils/format';
import { usePage, Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    Repeat,
    Search,
    Plus,
    Download,
    Eye,
    Edit,
    Trash2,
    Play,
    Pause,
    Calendar,
    Clock,
    DollarSign,
    Users,
    Printer,
    ChevronDown,
    ChevronUp,
    X
} from 'lucide-react';
import { useAlert } from '@/Contexts/AlertContext';
import SellModuleTabs from '@/Components/SellModuleTabs';

export default function RecurringInvoicesIndex({ recurringInvoices = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
    const { showConfirm, showAlert } = useAlert();
    const { store } = usePage().props;

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
            completed: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
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
        <OneGlanceLayout title="Recurring Invoices" activeMenu="Sell">
            <Head title="Recurring Invoices" />
            <div className="flex flex-col min-h-full lg:h-full bg-slate-50 dark:bg-slate-950 p-1 md:p-2 gap-1 lg:overflow-hidden relative">
                <SellModuleTabs activeTab="recurring" />

                {/* Mobile Stats Toggle/Summary */}
                <div className="flex md:hidden items-center justify-between bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <button
                        onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase text-left shrink-0 mr-2"
                    >
                        <span>Stats Summary</span>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isStatsExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {!isStatsExpanded && (
                        <div className="flex flex-col gap-1 items-end text-xs font-extrabold text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                                <span className="text-indigo-600 dark:text-indigo-400">Total: {stats.total}</span>
                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                <span className="text-emerald-600">Active: {stats.active}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Cards Section - Compact Single Line */}
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? 'grid' : 'hidden md:grid'}`}>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Repeat size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <Play size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Active</p>
                        </div>
                        <p className="text-base font-black text-emerald-600">{stats.active}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <Pause size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Paused</p>
                        </div>
                        <p className="text-base font-black text-amber-600">{stats.paused}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                <DollarSign size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Monthly Revenue</p>
                        </div>
                        <p className="text-base font-black text-purple-600">{(stats.monthlyRevenue < 0 ? '-' : '') + (getCurrencySymbol()) + ' ' + new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(stats.monthlyRevenue) || 0)}</p>
                    </div>
                </div>

                {/* PC / Desktop Header Area (Hidden on Mobile) */}
                <div className="hidden lg:flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Recurring <span className="text-indigo-600">Invoices</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >All</button>
                        <button
                            onClick={() => setStatusFilter('active')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'active' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Active</button>
                        <button
                            onClick={() => setStatusFilter('paused')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'paused' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Paused</button>
                    </div>

                    {/* Right: Search + Actions */}
                    <div className="flex items-center gap-2">
                        <div className="w-64 relative">
                            <input
                                type="text"
                                placeholder="Search by title or customer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none text-slate-800 dark:text-white"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <Link
                                href={route('store.recurring-invoices.create', { store_slug: store.slug })}
                                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                <Plus size={18} />
                                <span className="text-sm font-bold hidden sm:inline">New Recurring</span>
                            </Link>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Print" onClick={() => window.print()}>
                                <Printer size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Layout Header Area */}
                <div className="flex lg:hidden flex-col gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center justify-between w-full">
                        <h1 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            Recurring Invoices
                        </h1>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => { setShowMobileSearch(!showMobileSearch); if (showMobileFilters) setShowMobileFilters(false); }}
                                className={`p-2 rounded-lg transition-colors ${showMobileSearch ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                title="Search"
                            >
                                <Search size={16} />
                            </button>
                            <button
                                onClick={() => { setShowMobileFilters(!showMobileFilters); if (showMobileSearch) setShowMobileSearch(false); }}
                                className={`p-2 rounded-lg transition-colors ${showMobileFilters ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                title="Filters"
                            >
                                <ChevronDown size={16} />
                            </button>
                            <Link
                                href={route('store.recurring-invoices.create', { store_slug: store.slug })}
                                className="p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
                                title="New Recurring"
                            >
                                <Plus size={16} />
                            </Link>
                        </div>
                    </div>

                    {showMobileSearch && (
                        <div className="w-full relative mt-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                            <input
                                type="text"
                                placeholder="Search by title or customer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none text-slate-800 dark:text-white"
                            />
                            <Search className="absolute left-3 top-[65%] -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        </div>
                    )}

                    {showMobileFilters && (
                        <div className="w-full mt-1 border-t border-slate-100 dark:border-slate-800 pt-2 flex flex-col gap-2">
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                >All</button>
                                <button
                                    onClick={() => setStatusFilter('active')}
                                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'active' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                >Active</button>
                                <button
                                    onClick={() => setStatusFilter('paused')}
                                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'paused' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                >Paused</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Table container */}
                <div className="flex-1 overflow-auto md:rounded-xl md:border md:border-slate-200 md:dark:border-slate-800 md:shadow-sm bg-transparent md:bg-white md:dark:bg-slate-900">
                    <table className="hidden md:table w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px] tracking-widest sticky top-0 z-10 backdrop-blur-sm">
                            <tr className="border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-3">Title</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3 text-center">Frequency</th>
                                <th className="px-6 py-3">Next Invoice</th>
                                <th className="px-6 py-3 text-center">Generated</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <Repeat size={48} className="mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                                        <p className="text-slate-600 dark:text-slate-300 font-bold">No recurring invoices found</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Create one to automate your billing</p>
                                        <Link
                                            href={route('store.recurring-invoices.create', { store_slug: store.slug })}
                                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium shadow-md"
                                        >
                                            <Plus size={18} />
                                            Create Recurring Invoice
                                        </Link>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-3">
                                            <span className="font-bold text-slate-800 dark:text-white">
                                                {invoice.title || `Recurring #${invoice.id}`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                                    <Users size={14} className="text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                                    {invoice.customer?.name || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="font-bold text-slate-800 dark:text-white">
                                                {(parseFloat(invoice.amount || 0) < 0 ? '-' : '') + (getCurrencySymbol()) + ' ' + new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(parseFloat(invoice.amount || 0)) || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-bold">
                                                {getFrequencyLabel(invoice.frequency)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <Calendar size={14} />
                                                {invoice.next_invoice_date ? new Date(invoice.next_invoice_date).toLocaleDateString() : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className="font-bold text-slate-800 dark:text-white">
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
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                >
                                                    <Edit size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(invoice)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
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
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800">
                                <Repeat size={32} className="mx-auto text-slate-400 mb-2" />
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-350">No recurring invoices found</p>
                            </div>
                        ) : (
                            filteredInvoices.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 transition-transform"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="font-bold text-sm text-slate-800 dark:text-white">
                                                {invoice.title || `Recurring #${invoice.id}`}
                                            </span>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                                <Calendar size={10} />
                                                <span>Next: {invoice.next_invoice_date ? new Date(invoice.next_invoice_date).toLocaleDateString() : '-'}</span>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${getStatusBadge(invoice.status)}`}>
                                            {invoice.status || 'active'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center border-t border-b border-slate-100 dark:border-slate-800/60 py-2.5">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer</p>
                                            <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5">{invoice.customer?.name || 'Unknown'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</p>
                                            <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                                                {(parseFloat(invoice.amount || 0) < 0 ? '-' : '') + (getCurrencySymbol()) + ' ' + new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(parseFloat(invoice.amount || 0)) || 0)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <div className="text-slate-500 text-[11px]">
                                            Freq: <span className="font-bold text-slate-700 dark:text-slate-350">{getFrequencyLabel(invoice.frequency)}</span> • Gen: <span className="font-bold text-slate-700 dark:text-slate-350">{invoice.invoices_generated || 0}</span>
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
                                                className="p-1.5 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg hover:text-indigo-600 transition-colors"
                                            >
                                                <Edit size={14} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(invoice)}
                                                className="p-1.5 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg hover:text-red-600 transition-colors"
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
            </div>
        </OneGlanceLayout>
    );
}

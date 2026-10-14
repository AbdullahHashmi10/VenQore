import { exportRowsToCsv, canExportCsv } from '@/lib/exportCsv';
import React, { useState, useEffect } from 'react';
import { usePage, Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import StockModuleTabs, { useStockNavGroups, ListFilterSelect } from '@/Components/StockModuleTabs';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
import PrintService from '@/Utils/PrintService';
import Pagination from '@/Components/Pagination';
import { useDebounce } from 'use-debounce';
import {
 ArrowLeftRight,
 Search,
 Plus,
 Download,
 Eye,
 CheckCircle,
 XCircle,
 Clock,
 Warehouse,
 Package,
 ArrowRight,
 Truck,
 ChevronUp,
 ChevronDown,
 Printer
} from 'lucide-react';

export default function StockTransfers({ transfers = { data: [], links: [] }, warehouses = [], stats = {}, filters = {} }) {
 const { props } = usePage();
 const store = props.store || {};
 const navGroups = useStockNavGroups();
 const [searchTerm, setSearchTerm] = useState(filters.search || '');
 const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
 const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
 const [debouncedSearch] = useDebounce(searchTerm, 500);

 // Trigger server-side search
 useEffect(() => {
 if (debouncedSearch !== (filters.search || '')) {
 router.get(route('store.stock-transfers.index', { store_slug: store.slug }), {
 search: debouncedSearch,
 status: statusFilter === 'all' ? null : statusFilter
 }, {
 preserveState: true,
 preserveScroll: true,
 replace: true
 });
 }
 }, [debouncedSearch]);

 // Trigger status filter
 const handleStatusChange = (status) => {
 setStatusFilter(status);
 router.get(route('store.stock-transfers.index', { store_slug: store.slug }), {
 search: searchTerm,
 status: status === 'all' ? null : status
 }, {
 preserveState: true,
 preserveScroll: true,
 replace: true
 });
 };

 const getStatusBadge = (status) => {
 const styles = {
 completed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle },
 pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: Clock },
 in_transit: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: Truck },
 cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: XCircle },
 in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: Truck },
 };
 return styles[status] || styles.pending;
 };

 const handleSort = (key) => {
 setSortConfig(prev => ({
 key,
 direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
 }));
 };

 const SortIcon = ({ columnKey }) => {
 if (sortConfig.key !== columnKey) return null;
 return sortConfig.direction === 'asc'
 ? <ChevronUp size={14} className="text-brand-500" />
 : <ChevronDown size={14} className="text-brand-500" />;
 };

 const transferList = transfers.data || [];

 return (
 <OneGlanceLayout title="Stock Transfers" activeMenu="Stock" noPadding>
 <Head title="Stock Transfers" />

 <ListPageFrame className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
 <ListToolbar
 title="Stock Transfers"
 navGroups={navGroups}
 activeId="transfers"
 left={
 <ListFilterSelect
 value={statusFilter}
 onChange={handleStatusChange}
 ariaLabel="Status"
 options={[{ value: 'all', label: 'All statuses' }, { value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In Transit' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }]}
 />
 }
 search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search transfers...' }}
 actions={
 <>
 <button style={canExportCsv() ? undefined : { display: 'none' }} className="h-10 w-10 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-[12px] text-emerald-600" title="Export" onClick={() => exportRowsToCsv('stock-transfers', [{label:'Transfer #',get:r=>r.reference_number||`TRF-${r.id}`},{label:'From',get:r=>r.from_warehouse?.name},{label:'To',get:r=>r.to_warehouse?.name},{label:'Items',get:r=>r.items?.length||r.items_count||0},{label:'Date',get:r=>r.created_at},{label:'Status',get:r=>r.status}], transferList)}>
 <Download size={16} />
 </button>
 <button onClick={() => PrintService.printPage()} className="h-10 w-10 flex items-center justify-center hover:bg-interactive-hover rounded-[12px] text-ink-muted hover:text-ink transition-colors" title="Print">
 <Printer size={16} />
 </button>
 <ListAddButton icon={Plus} href={route('store.stock-transfers.create', { store_slug: store.slug })}>New Transfer</ListAddButton>
 </>
 }
 />
 <ListStatCards cards={[
 { label: 'Total', value: stats.total_transfers || 0, icon: ArrowLeftRight, icon_tone: 'bg-sunken text-ink-secondary' },
 { label: 'Pending', value: stats.pending_approval || 0, icon: Clock, icon_tone: 'bg-amber-50 text-amber-600', value_tone: 'text-amber-600' },
 { label: 'In Transit', value: stats.in_progress || 0, icon: Truck, icon_tone: 'bg-blue-50 text-blue-600', value_tone: 'text-blue-600' },
 { label: 'Completed', value: stats.completed || 0, icon: CheckCircle, icon_tone: 'bg-emerald-50 text-emerald-600', value_tone: 'text-emerald-600' },
 ]} />

 {/* Stats Row - Compact Single Line (like Proposals) */}
<MobileListHeader
 title="Stock Transfers"
 navGroups={navGroups}
 activeId="transfers"
 filter={{
 active: statusFilter !== 'all',
 sections: [{ label: 'Status', value: statusFilter, options: [{ value: 'all', label: 'All statuses' }, { value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In Transit' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }], onSelect: handleStatusChange }],
 }}
 search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search transfers...' }}
 actions={[{ icon: Printer, label: 'Print', onClick: () => PrintService.printPage() }]}
 add={{ href: route('store.stock-transfers.create', { store_slug: store.slug }), label: 'New Transfer' }}
 />
 <MobileStats bp="md" hero={0} items={[
 { label: 'Total', value: stats.total_transfers || 0, tone: 'ink', icon: ArrowLeftRight },
 { label: 'Pending', value: stats.pending_approval || 0, tone: 'amber', icon: Clock },
 { label: 'In Transit', value: stats.in_progress || 0, tone: 'blue', icon: Truck },
 { label: 'Completed', value: stats.completed || 0, tone: 'emerald', icon: CheckCircle },
 ]} />

 {/* Header Bar - Title + Filter Pills + Search */}

 {/* Main Table */}
 <div className="flex-1 min-h-0 overflow-auto rounded-xl md:rounded-[14px] border border-line shadow-sm bg-surface">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-app border-b border-line sticky top-0 z-10">
 <th
 onClick={() => handleSort('reference')}
 className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
 >
 <div className="flex items-center gap-1">
 Transfer # <SortIcon columnKey="reference" />
 </div>
 </th>
 <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
 From → To
 </th>
 <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">
 Items
 </th>
 <th
 onClick={() => handleSort('date')}
 className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
 >
 <div className="flex items-center gap-1">
 Date <SortIcon columnKey="date" />
 </div>
 </th>
 <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">
 Status
 </th>
 <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">
 Actions
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-line">
 {transferList.length === 0 ? (
 <tr>
 <td colSpan={6} className="p-5 sm:p-12">
 <div className="flex flex-col items-center justify-center text-center">
 <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-3">
 <ArrowLeftRight size={28} className="text-ink-muted" />
 </div>
 <p className="text-base font-bold text-ink-secondary mb-1">No transfers found</p>
 <p className="text-sm text-ink-muted mb-3">Create a new transfer to move stock between warehouses</p>
 <Link
 href={route('store.stock-transfers.create', { store_slug: store.slug })}
 className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-bold text-sm"
 >
 <Plus size={16} />
 Create First Transfer
 </Link>
 </div>
 </td>
 </tr>
 ) : (
 transferList.map((transfer) => {
 const statusStyle = getStatusBadge(transfer.status);
 const StatusIcon = statusStyle.icon;

 return (
 <tr
 key={transfer.id}
 className={`
 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all cursor-pointer
 ${transfer.status === 'pending' ? 'border-l-4 border-amber-500' :
 transfer.status === 'in_progress' || transfer.status === 'in_transit' ? 'border-l-4 border-blue-500' :
 transfer.status === 'completed' ? 'border-l-4 border-emerald-500' :
 transfer.status === 'cancelled' ? 'border-l-4 border-red-500' :
 'border-l-4 border-transparent'}
`}
 onClick={() => router.visit(route('store.stock-transfers.show', transfer.id))}
 >
 <td className="p-3">
 <span className="font-mono font-bold text-sm text-brand-600 dark:text-brand-400">
 {transfer.reference_number || `TRF-${transfer.id}`}
 </span>
 </td>
 <td className="p-3">
 <div className="flex items-center gap-2">
 <div className="flex items-center gap-1.5">
 <Warehouse size={14} className="text-ink-muted" />
 <span className="font-medium text-sm text-ink-secondary">
 {transfer.from_warehouse?.name || 'Unknown'}
 </span>
 </div>
 <ArrowRight size={14} className="text-brand-500" />
 <div className="flex items-center gap-1.5">
 <Warehouse size={14} className="text-ink-muted" />
 <span className="font-medium text-sm text-ink-secondary">
 {transfer.to_warehouse?.name || 'Unknown'}
 </span>
 </div>
 </div>
 </td>
 <td className="p-3 text-center">
 <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sunken rounded text-xs font-bold">
 <Package size={12} />
 {transfer.items?.length || transfer.items_count || 0}
 </span>
 </td>
 <td className="p-3 text-sm text-ink-secondary">
 {new Date(transfer.created_at).toLocaleDateString('en-PK', {
 day: '2-digit',
 month: 'short',
 year: 'numeric'
 })}
 </td>
 <td className="p-3 text-center">
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`}>
 <StatusIcon size={10} />
 {transfer.status?.replace('_', ' ') || 'pending'}
 </span>
 </td>
 <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
 <Link
 href={route('store.stock-transfers.show', transfer.id)}
 className="p-1.5 text-ink-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-all inline-flex"
 >
 <Eye size={16} />
 </Link>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination - Compact */}
 {transfers.links && transfers.links.length > 3 && (
 <div className="shrink-0 bg-surface rounded-xl border border-line shadow-sm px-3 py-2">
 <Pagination links={transfers.links} />
 </div>
 )}
 </ListPageFrame>
 </OneGlanceLayout>
 );
}

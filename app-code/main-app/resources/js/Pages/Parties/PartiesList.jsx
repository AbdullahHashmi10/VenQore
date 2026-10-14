import { exportRowsToCsv, canExportCsv } from '@/lib/exportCsv';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import ContactsModuleTabs, { useContactsNavGroups } from '@/Components/ContactsModuleTabs';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
import ListFilterPill from '@/Components/ListFilterPill';
import PrintService from '@/Utils/PrintService';
import FormModal, { FormField, FormInput, FormSelect, FormTextarea, PrimaryButton, SecondaryButton } from '@/Components/FormModal';
import {
 Users, Plus, UserCheck, Building2, TrendingUp, TrendingDown, FileText,
 Search, Download, Printer, Edit2, Trash2, Eye, ChevronUp, ChevronDown, X, Filter
} from 'lucide-react';
import { useAlert } from '@/Contexts/AlertContext';
import PlanGate from '@/Components/PlanGate';
import { useTerms, useTermText } from '@/lib/terms';
import axios from 'axios';
import MobileListHeader from '@/Components/MobileListHeader';

export default function PartiesIndex({ parties = {}, stats = {}, flash }) {
 const { showAlert, showConfirm } = useAlert();
 const { url, store } = usePage().props;
 const { t, tp } = useTerms();
 const tt = useTermText();
 const contactsNavGroups = useContactsNavGroups();
 const { url: currentUrl } = usePage();
 const params = new URLSearchParams(window.location.search);
 const type = params.get('type');
 const isLedgersRoute = currentUrl.includes('ledgers');
 const activeTab = isLedgersRoute ? 'ledgers' : (type === 'customer' ? 'customers' : (type === 'supplier' ? 'suppliers' : 'all'));

 // Infinite Scroll State
 const [allParties, setAllParties] = useState(Array.isArray(parties.data) ? parties.data : []);
 const [nextPageUrl, setNextPageUrl] = useState(parties.next_page_url);
 const isLoading = useRef(false);
 const observerTarget = useRef(null);

 const [searchTerm, setSearchTerm] = useState(params.get('search') || '');
 const [typeFilter, setTypeFilter] = useState(params.get('type') || (params.get('type') === null ? (isLedgersRoute ? 'all' : activeTab) : params.get('type')) || 'all');

 const [sortConfig, setSortConfig] = useState({ 
 key: params.get('sort_by') || 'name', 
 direction: params.get('sort_dir') || 'asc' 
 });

 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingParty, setEditingParty] = useState(null);
 const [loading, setLoading] = useState(false);

 // PIN Modal State
 const [isPinModalOpen, setIsPinModalOpen] = useState(false);
 const [pinToSubmit, setPinToSubmit] = useState('');
 const [partyToDelete, setPartyToDelete] = useState(null); // stores single party or 'bulk' string
 const [pinError, setPinError] = useState('');

 // Bulk Selection State
 const [selectedParties, setSelectedParties] = useState([]);

 // Mobile responsiveness toggle states
 const [isStatsExpanded, setIsStatsExpanded] = useState(false);
 const [showMobileSearch, setShowMobileSearch] = useState(false);
 const [showMobileFilters, setShowMobileFilters] = useState(false);

 // Debounced Search Logic
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
 }, [sortConfig, typeFilter]);

 useEffect(() => {
 if (searchTerm !== (params.get('search') || '')) {
 debouncedSearch(searchTerm);
 }
 }, [searchTerm]);

 // Apply Filters
 const applyFilters = (newParams) => {
 router.get(route(isLedgersRoute ? 'store.parties.ledgers' : 'store.parties.index', { store_slug: store?.slug }), {
 search: searchTerm,
 type: typeFilter,
 sort_by: sortConfig.key,
 sort_dir: sortConfig.direction,
 ...newParams
 }, { preserveState: true, preserveScroll: true, replace: true });
 };

 // Use raw data from server (already sorted globally)
 const sortedParties = allParties;

 // Sorting
 const handleSort = (key) => {
 const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
 setSortConfig({ key, direction });
 applyFilters({ sort_by: key, sort_dir: direction });
 };

 // Sync state when props change (e.g. server search/filter)
 useEffect(() => {
 if (parties.data && parties.current_page === 1) {
 setAllParties(Array.isArray(parties.data) ? parties.data : []);
 setNextPageUrl(parties.next_page_url);
 }
 }, [parties]);

 const [formData, setFormData] = useState({
 name: '',
 phone: '',
 email: '',
 type: 'customer',
 opening_balance: 0,
 opening_balance_type: 'receivable',
 credit_limit: '',
 payment_terms: '',
 address: '',
 notes: '',
 category: '',
 sub_category: ''
 });
 const [errors, setErrors] = useState({});

 // Format currency


 // Fetch Next Page
 const fetchNextPage = useCallback(async () => {
 if (!nextPageUrl || isLoading.current) return;

 isLoading.current = true;
 try {
 const response = await axios.get(nextPageUrl, {
 headers: { 'Accept': 'application/json' }
 });
 const newParties = response.data.data;

 setAllParties(prev => {
 const safePrev = Array.isArray(prev) ? prev : [];
 const existingIds = new Set(safePrev.map(p => p.id));
 const uniqueNew = newParties.filter(p => !existingIds.has(p.id));
 return [...safePrev, ...uniqueNew];
 });
 setNextPageUrl(response.data.next_page_url);
 } catch (error) {
 console.error("Failed to load more parties:", error);
 } finally {
 isLoading.current = false;
 }
 }, [nextPageUrl]);

 // Intersection Observer
 useEffect(() => {
 const observer = new IntersectionObserver(
 entries => {
 if (entries[0].isIntersecting && nextPageUrl && !isLoading.current) {
 fetchNextPage();
 }
 },
 { threshold: 0.1, rootMargin: '800px' }
 );

 if (observerTarget.current) observer.observe(observerTarget.current);
 return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
 }, [nextPageUrl, fetchNextPage]);

 const handleServerSearch = (e) => {
 if (e.key === 'Enter') {
 applyFilters({ search: searchTerm });
 }
 };

 const handleTypeFilter = (newType) => {
 setTypeFilter(newType);
 applyFilters({ type: newType });
 };

 const SortIcon = ({ columnKey }) => {
 if (sortConfig.key !== columnKey) return null;
 return sortConfig.direction === 'asc'
 ? <ChevronUp size={14} className="text-brand-500" />
 : <ChevronDown size={14} className="text-brand-500" />;
 };

 // Open create modal
 const handleCreate = () => {
 setEditingParty(null);
 setFormData({
 name: '',
 phone: '',
 email: '',
 type: 'customer',
 opening_balance: 0,
 opening_balance_type: 'receivable',
 credit_limit: '',
 payment_terms: '',
 address: '',
 notes: ''
 });
 setErrors({});
 setIsModalOpen(true);
 };

 // Dock quick action: /parties?new=1 opens the add-contact form
 useEffect(() => {
 const sp = new URLSearchParams(window.location.search);
 if (sp.get('new')) {
 handleCreate();
 sp.delete('new');
 const q = sp.toString();
 window.history.replaceState({}, '', window.location.pathname + (q ? `?${q}` : ''));
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 // Open edit modal
 const handleEdit = (party) => {
 setEditingParty(party);
 setFormData({
 name: party.name || '',
 phone: party.phone || '',
 email: party.email || '',
 type: party.type || 'customer',
 opening_balance: party.opening_balance || 0,
 opening_balance_type: party.opening_balance_type || 'receivable',
 credit_limit: party.credit_limit || '',
 payment_terms: party.payment_terms || '',
 address: party.address || '',
 notes: party.notes || '',
 category: party.category || '',
 sub_category: party.sub_category || ''
 });
 setErrors({});
 setIsModalOpen(true);
 };

 // View Party Ledger
 const handleViewLedger = (party) => {
 router.visit(route('store.parties.ledger', { store_slug: store?.slug, party: party.id }));
 };

 // Selection Handlers
 const handleSelectAll = (e) => {
 if (e.target.checked) {
 setSelectedParties(sortedParties.map(p => p.id));
 } else {
 setSelectedParties([]);
 }
 };

 const handleSelectRow = (id) => {
 if (selectedParties.includes(id)) {
 setSelectedParties(selectedParties.filter(item => item !== id));
 } else {
 setSelectedParties([...selectedParties, id]);
 }
 };

 // Handle delete (Single or Bulk)
 const handleDelete = async (party, passcode = null) => {
 if (party === 'bulk') {
 if (!passcode) {
 showConfirm({
 title: 'Confirm Bulk Delete',
 message: `Are you sure you want to delete the ${selectedParties.length} selected contacts?`,
 confirmLabel: 'Yes, Delete Selected',
 onConfirm: () => performBulkDelete(passcode)
 });
 } else {
 performBulkDelete(passcode);
 }
 return;
 }

 if (!passcode) {
 showConfirm({
 title: 'Confirm Delete',
 message: `Are you sure you want to delete "${party.name}"?`,
 confirmLabel: 'Yes, Delete',
 onConfirm: () => performDelete(party, passcode)
 });
 } else {
 performDelete(party, passcode);
 }
 };

 const performDelete = async (party, passcode = null) => {
 try {
 await axios.delete(route('store.parties.destroy', { store_slug: store?.slug, party: party.id }), { data: { passcode } });
 if (isPinModalOpen) {
 setIsPinModalOpen(false);
 setPinToSubmit('');
 setPinError('');
 setPartyToDelete(null);
 }
 setSelectedParties(prev => prev.filter(id => id !== party.id));
 router.reload({ only: ['parties', 'stats'] });
 } catch (error) {
 if (error.response?.status === 422 && error.response.data.requires_passcode) {
 setPartyToDelete(party);
 setIsPinModalOpen(true);
 } else if (error.response?.status === 403) {
 setPinError(error.response?.data?.message || 'Invalid PIN.');
 } else {
 alert(error.response?.data?.message || 'Failed to delete party');
 }
 }
 };

 const performBulkDelete = async (passcode = null) => {
 try {
 await axios.delete(route('store.parties.bulk-destroy', { store_slug: store?.slug }), { 
 data: { ids: selectedParties, passcode } 
 });
 if (isPinModalOpen) {
 setIsPinModalOpen(false);
 setPinToSubmit('');
 setPinError('');
 setPartyToDelete(null);
 }
 setSelectedParties([]);
 router.reload({ only: ['parties', 'stats'] });
 } catch (error) {
 if (error.response?.status === 422 && error.response.data.requires_passcode) {
 setPartyToDelete('bulk');
 setIsPinModalOpen(true);
 } else if (error.response?.status === 403) {
 setPinError(error.response?.data?.message || 'Invalid PIN.');
 } else {
 alert(error.response?.data?.message || 'Failed to delete selected contacts');
 }
 }
 };

 // Submit form
 const handleSubmit = async (e) => {
 e.preventDefault();
 setLoading(true);
 setErrors({});

 try {
 if (editingParty) {
 await axios.put(route('store.parties.update', { store_slug: store?.slug, party: editingParty.id }), formData);
 } else {
 await axios.post(route('store.parties.store', { store_slug: store?.slug }), formData);
 }
 setIsModalOpen(false);
 router.reload({ only: ['parties', 'stats'] });
 } catch (error) {
 if (error.response?.status === 422) {
 setErrors(error.response.data.errors || {});
 } else {
 alert(error.response?.data?.message || 'An error occurred');
 }
 } finally {
 setLoading(false);
 }
 };

 return (
 <OneGlanceLayout title="Contacts" activeMenu="Contacts" noPadding>
 <Head title="Contacts" />

 <ListPageFrame className="flex flex-col h-full bg-app p-3.5 gap-1 overflow-hidden">
 <div className="md:hidden"><ContactsModuleTabs activeTab={activeTab} /></div>

 {/* Mobile Stats Toggle/Summary */}
                <MobileListHeader
                    title={activeTab === 'customers' ? tp('customer', 'Customers') : activeTab === 'suppliers' ? tp('supplier', 'Suppliers') : activeTab === 'ledgers' ? 'Ledgers' : 'All Parties'}
                    navGroups={contactsNavGroups}
                    activeId={activeTab}
                    links={[{ label: 'Print', icon: Printer, onClick: () => PrintService.printPage() }]}
                    filter={{
                        active: typeFilter !== 'all',
                        sections: [
                            { label: 'Type', value: typeFilter, options: [{ value: 'all', label: 'All types' }, { value: 'customer', label: tp('customer', 'Customers') }, { value: 'supplier', label: tp('supplier', 'Suppliers') }], onSelect: handleTypeFilter },
                        ],
                    }}
                    search={{ value: searchTerm, onChange: (v) => setSearchTerm(v), onKeyDown: handleServerSearch, placeholder: 'Search contacts...' }}
                    add={{ onClick: handleCreate, label: 'Add Party' }}
                    stats={{ hero: 2, items: [
                        { label: 'Total Parties', value: stats.total || 0, tone: 'brand', icon: Users },
                        { label: tp('customer', 'Customers'), value: stats.customers || 0, tone: 'blue', icon: UserCheck },
                        { label: 'To Receive', value: formatCurrency(stats.receivables), tone: 'emerald', icon: TrendingUp },
                        { label: 'Payables', value: formatCurrency(stats.payables), tone: 'rose', icon: TrendingDown },
                    ] }}
                />

 {/* ── Desktop: ROW 1 toolbar + ROW 2 stat cards ── */}
 <ListToolbar
 title={activeTab === 'customers' ? tp('customer', 'Customers') : activeTab === 'suppliers' ? tp('supplier', 'Suppliers') : activeTab === 'ledgers' ? 'Ledgers' : 'All Parties'}
 navGroups={contactsNavGroups}
 activeId={activeTab}
 left={(
 <ListFilterPill
 icon={Users}
 label="All types"
 value={typeFilter}
 options={[{ value: 'all', label: 'All types' }, { value: 'customer', label: tp('customer', 'Customers') }, { value: 'supplier', label: tp('supplier', 'Suppliers') }]}
 onChange={handleTypeFilter}
 />
 )}
 search={{ value: searchTerm, onChange: (v) => setSearchTerm(v), onKeyDown: handleServerSearch, placeholder: 'Search contacts...' }}
 actions={(
 <>
 <button style={canExportCsv() ? undefined : { display: 'none' }} type="button" className="h-10 w-10 flex items-center justify-center rounded-[12px] text-emerald-600 hover:bg-interactive-hover transition-colors" title="Export" onClick={() => exportRowsToCsv('parties', [{label:'Name',get:r=>r.name},{label:'Type',get:r=>r.type},{label:'Phone',get:r=>r.phone},{label:'Email',get:r=>r.email},{label:'Credit Limit',get:r=>r.credit_limit}], sortedParties)}>
 <Download size={18} />
 </button>
 <button type="button" className="h-10 w-10 flex items-center justify-center rounded-[12px] text-ink-muted hover:bg-interactive-hover transition-colors" title="Print" onClick={() => PrintService.printPage()}>
 <Printer size={18} />
 </button>
 <ListAddButton icon={Plus} onClick={handleCreate}>Add Party</ListAddButton>
 </>
 )}
 />
 <PlanGate feature="outstanding_balance_grid" showUpgradeBadge={false}>
 <ListStatCards cards={[
 { label: 'Total Parties', value: stats.total || 0, icon: Users },
 { label: tp('customer', 'Customers'), value: stats.customers || 0, icon: UserCheck, icon_tone: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', value_tone: 'text-blue-600' },
 { label: 'To Receive', value: formatCurrency(stats.receivables), icon: TrendingUp, icon_tone: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', value_tone: 'text-emerald-600' },
 { label: 'Payables', value: formatCurrency(stats.payables), icon: TrendingDown, icon_tone: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400', value_tone: 'text-rose-600' },
 ]} />
 </PlanGate>

 {/* Mobile Toolbar (md:hidden) */}

 {/* Bulk Actions Bar */}
 {selectedParties.length > 0 && (
 <div className="bg-brand-600 text-white px-4 py-2 rounded-xl flex flex-wrap items-center justify-between gap-y-2 shadow-lg animate-in slide-in-from-top-2 shrink-0">
 <span className="font-bold text-sm">{selectedParties.length} Selected</span>
 <div className="flex items-center gap-2">
 <button
 onClick={() => handleDelete('bulk')}
 className="px-3 py-1 bg-white text-brand-600 rounded-lg text-xs font-bold hover:bg-interactive-hover transition-colors flex items-center gap-1"
 >
 <Trash2 size={14} /> Delete Selected
 </button>
 <button
 onClick={() => setSelectedParties([])}
 className="p-1 hover:bg-brand-700 rounded transition-colors"
 >
 <X size={16} />
 </button>
 </div>
 </div>
 )}

 {/* Main Contacts Area */}
 <div className="flex-1 min-h-0 overflow-auto rounded-xl md:rounded-[14px] border border-line shadow-sm bg-surface">
 
 {/* Desktop Table View */}
 <div className="hidden sm:block">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-app border-b border-line sticky top-0 z-10">
 <th className="sticky top-0 z-10 bg-app p-3 w-10">
 <input
 type="checkbox"
 className="rounded border-line text-brand-600 focus:ring-brand-600 cursor-pointer"
 checked={selectedParties.length === sortedParties.length && sortedParties.length > 0}
 onChange={handleSelectAll}
 />
 </th>
 <th
 onClick={() => handleSort('name')}
 className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
 >
 <div className="flex items-center gap-1">
 Party Name <SortIcon columnKey="name" />
 </div>
 </th>
 <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">
 Type
 </th>
 <th
 onClick={() => handleSort('balance')}
 className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover text-right"
 >
 <div className="flex items-center justify-end gap-1">
 Balance <SortIcon columnKey="balance" />
 </div>
 </th>
 <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right">
 Credit Limit
 </th>
 <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
 Phone
 </th>
 <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">
 Actions
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-line">
 {sortedParties.length > 0 ? (
 sortedParties.map((party) => {
 const isOverdue = party.type === 'customer' && party.credit_limit && parseFloat(party.current_balance || 0) > parseFloat(party.credit_limit);
 return (
 <tr
 key={party.id}
 className={`
 transition-all cursor-pointer
 ${isOverdue 
 ? 'border-l-4 border-red-500 bg-rose-50/50 hover:bg-rose-100/50 dark:bg-rose-950/10 dark:hover:bg-rose-900/20' 
 : party.type === 'customer' ? 'border-l-4 border-blue-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10' : 'border-l-4 border-amber-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10'
 }
 ${selectedParties.includes(party.id) ? 'bg-brand-50 dark:bg-brand-900/20' : ''}
`}
 onClick={() => handleViewLedger(party)}
 >
 <td className="p-3 w-10" onClick={(e) => e.stopPropagation()}>
 <input
 type="checkbox"
 className="rounded border-line text-brand-600 focus:ring-brand-600 cursor-pointer"
 checked={selectedParties.includes(party.id)}
 onChange={() => handleSelectRow(party.id)}
 />
 </td>
 <td className="p-3">
 <div className="flex items-center gap-2">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${party.type === 'customer'
 ? 'bg-blue-100 dark:bg-blue-900/30'
 : 'bg-amber-100 dark:bg-amber-900/30'
 }`}>
 {party.type === 'customer' ? (
 <UserCheck size={14} className="text-blue-600 dark:text-blue-400" />
 ) : (
 <Building2 size={14} className="text-amber-600 dark:text-amber-400" />
 )}
 </div>
 <div>
 <p className="font-bold text-sm text-ink">{party.name}</p>
 {party.email && <p className="text-2xs text-ink-muted">{party.email}</p>}
 </div>
 </div>
 </td>
 <td className="p-3 text-center">
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${party.type === 'customer'
 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
 : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
 }`}>
 {party.type === 'customer' ? tt('Customer') : tt('Supplier')}
 </span>
 </td>
 <td className="p-3 text-right">
 <div>
 <span className={`font-bold text-sm ${(party.type === 'customer' && party.current_balance >= 0) || (party.type === 'supplier' && party.current_balance < 0)
 ? 'text-emerald-600' // Asset (Receivable)
 : 'text-red-600' // Liability (Payable)
 }`}>
 {formatCurrency(Math.abs(party.current_balance || 0))}
 </span>
 <p className="text-2xs text-ink-muted">
 {party.current_balance > 0 ? (party.type === 'customer' ? 'To Receive' : 'To Pay') :
 party.current_balance < 0 ? (party.type === 'customer' ? 'To Pay' : 'To Receive') : 'Settled'}
 </p>
 </div>
 </td>
 <td className="p-3 text-right text-sm text-ink-secondary">
 {party.credit_limit ? formatCurrency(party.credit_limit) : '-'}
 </td>
 <td className="p-3 text-sm text-ink-secondary">
 {party.phone || '-'}
 </td>
 <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
 <div className="flex items-center justify-center gap-1">
 <button
 onClick={() => handleViewLedger(party)}
 className="p-1.5 text-ink-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-all"
 title="View Ledger"
 >
 <FileText size={16} />
 </button>
 <button
 onClick={() => handleEdit(party)}
 className="p-1.5 text-ink-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
 title="Edit"
 >
 <Edit2 size={16} />
 </button>
 <button
 onClick={() => handleDelete(party)}
 className="p-1.5 text-ink-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
 title="Delete"
 >
 <Trash2 size={16} />
 </button>
 </div>
 </td>
 </tr>
 );
 })
 ) : (
 <tr>
 <td colSpan={7} className="p-5 sm:p-12">
 <div className="flex flex-col items-center justify-center text-center">
 <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-3">
 <Users size={28} className="text-ink-muted" />
 </div>
 <p className="text-base font-bold text-ink-secondary mb-1">No parties found</p>
 <p className="text-sm text-ink-muted mb-3">{tt('Add your first customer or supplier')}</p>
 <button
 onClick={handleCreate}
 className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-bold text-sm"
 >
 <Plus size={16} />
 Add Party
 </button>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Mobile Stacked Card View */}
 <div className="block sm:hidden divide-y divide-line">
 {sortedParties.length > 0 ? (
 sortedParties.map((party) => {
 const isOverdue = party.type === 'customer' && party.credit_limit && parseFloat(party.current_balance || 0) > parseFloat(party.credit_limit);
 return (
 <div
 key={party.id}
 onClick={() => handleViewLedger(party)}
 className={`p-3 hover:bg-brand-50/20 dark:hover:bg-brand-900/10 flex flex-col gap-2 cursor-pointer relative ${
 isOverdue
 ? 'border-l-4 border-red-500 bg-rose-50/50 hover:bg-rose-100/50 dark:bg-rose-950/10'
 : party.type === 'customer' ? 'border-l-4 border-blue-500' : 'border-l-4 border-amber-500'
 } ${selectedParties.includes(party.id) ? 'bg-brand-50/40 dark:bg-brand-900/10' : ''}`}
 >
 <div className="flex items-start justify-between gap-2">
 <div className="flex gap-2 items-start">
 <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
 <input
 type="checkbox"
 className="rounded border-line text-brand-600 focus:ring-brand-600 cursor-pointer"
 checked={selectedParties.includes(party.id)}
 onChange={() => handleSelectRow(party.id)}
 />
 </div>
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
 party.type === 'customer' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
 }`}>
 {party.type === 'customer' ? (
 <UserCheck size={14} className="text-blue-600 dark:text-blue-400" />
 ) : (
 <Building2 size={14} className="text-amber-600 dark:text-amber-400" />
 )}
 </div>
 <div>
 <p className="font-bold text-ink text-xs">{party.name}</p>
 {party.phone && (
 <p className="text-2xs text-ink-muted font-mono mt-0.5">{party.phone}</p>
 )}
 </div>
 </div>
 <div className="text-right shrink-0">
 <span className={`font-bold text-xs ${
 (party.type === 'customer' && party.current_balance >= 0) || (party.type === 'supplier' && party.current_balance < 0)
 ? 'text-emerald-600' : 'text-red-600'
 }`}>
 {formatCurrency(Math.abs(party.current_balance || 0))}
 </span>
 <p className="text-3xs text-ink-muted uppercase font-bold tracking-tight">
 {party.current_balance > 0 ? (party.type === 'customer' ? 'To Receive' : 'To Pay') :
 party.current_balance < 0 ? (party.type === 'customer' ? 'To Pay' : 'To Receive') : 'Settled'}
 </p>
 </div>
 </div>
 
 <div className="flex flex-wrap items-center justify-between gap-y-2 text-2xs text-ink-muted bg-surface/50 dark:bg-app p-1.5 rounded-lg border border-line">
 <span>Limit: {party.credit_limit ? formatCurrency(party.credit_limit) : '-'}</span>
 <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
 <button onClick={() => handleViewLedger(party)} className="p-1 text-ink-muted hover:text-brand-600 rounded">
 <FileText size={14} />
 </button>
 <button onClick={() => handleEdit(party)} className="p-1 text-ink-muted hover:text-blue-600 rounded">
 <Edit2 size={14} />
 </button>
 <button onClick={() => handleDelete(party)} className="p-1 text-ink-muted hover:text-red-600 rounded">
 <Trash2 size={14} />
 </button>
 </div>
 </div>
 </div>
 );
 })
 ) : (
 <div className="p-5 sm:p-12 text-center text-ink-muted text-xs">
 <Users size={24} className="mx-auto mb-2 opacity-50" />
 No contacts available
 </div>
 )}
 </div>

 {/* Infinite Scroll Sentinel inside scroll container */}
 <div ref={observerTarget} className="p-4 text-center text-ink-muted text-sm opacity-0 h-4">
 {nextPageUrl ? 'Loading...' : ''}
 </div>
 </div>
 </ListPageFrame>

 {/* Create/Edit Modal */}
 <FormModal
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 title={editingParty ? 'Edit Party' : 'Add Party'}
 subtitle={editingParty ? 'Update party details' : tt('Add a new customer or supplier')}
 size="lg"
 errors={errors}
 footer={
 <div className="flex justify-end gap-3">
 <SecondaryButton onClick={() => setIsModalOpen(false)}>
 Cancel
 </SecondaryButton>
 <PrimaryButton onClick={handleSubmit} loading={loading}>
 {editingParty ? 'Update' : 'Create'}
 </PrimaryButton>
 </div>
 }
 >
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <FormField label="Party Name" required error={errors.name?.[0]}>
 <FormInput
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 placeholder="Enter party name"
 error={errors.name}
 />
 </FormField>

 <FormField label="Type" required>
 <FormSelect
 value={formData.type}
 onChange={(e) => setFormData({ ...formData, type: e.target.value })}
 >
 <option value="customer">{tt('Customer')}</option>
 <option value="supplier">{tt('Supplier')}</option>
 </FormSelect>
 </FormField>
 </div>

 {(usePage().props.settings?.party_grouping === '1' || usePage().props.settings?.party_grouping === true) && (
 <div className="grid grid-cols-2 gap-4">
 <FormField label="Category">
 <FormInput
 value={formData.category}
 onChange={(e) => setFormData({ ...formData, category: e.target.value })}
 placeholder="e.g. Retailer, Wholesaler"
 />
 </FormField>
 <FormField label="Sub-Category">
 <FormInput
 value={formData.sub_category}
 onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
 placeholder="e.g. Area A, Area B"
 />
 </FormField>
 </div>
 )}

 <div className="grid grid-cols-2 gap-4">
 <FormField label="Phone" error={errors.phone?.[0]}>
 <FormInput
 value={formData.phone}
 onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
 placeholder="e.g., 0300-1234567"
 />
 </FormField>

 <FormField label="Email" error={errors.email?.[0]}>
 <FormInput
 type="email"
 value={formData.email}
 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 placeholder="email@example.com"
 />
 </FormField>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="col-span-2 grid grid-cols-2 gap-2">
 <FormField label="Opening Balance" hint="Initial balance">
 <FormInput
 type="number"
 value={formData.opening_balance}
 onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
 placeholder="0"
 />
 </FormField>
 <FormField label="Balance Type">
 <FormSelect
 value={formData.opening_balance_type}
 onChange={(e) => setFormData({ ...formData, opening_balance_type: e.target.value })}
 >
 <option value="receivable">To Receive (Dr)</option>
 <option value="payable">To Pay (Cr)</option>
 </FormSelect>
 </FormField>
 </div>

 {(usePage().props.settings?.enable_credit_limit ?? '1') !== '0' && (
 <FormField label="Credit Limit">
 <FormInput
 type="number"
 value={formData.credit_limit}
 onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
 placeholder="No limit"
 />
 </FormField>
 )}

 <FormField label="Payment Terms">
 <FormInput
 value={formData.payment_terms}
 onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
 placeholder="e.g., Net 30"
 />
 </FormField>
 </div>

 <FormField label="Address">
 <FormTextarea
 value={formData.address}
 onChange={(e) => setFormData({ ...formData, address: e.target.value })}
 placeholder="Enter full address"
 rows={2}
 />
 </FormField>

 <FormField label="Notes">
 <FormTextarea
 value={formData.notes}
 onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
 placeholder="Additional notes about this party"
 rows={2}
 />
 </FormField>
 </form>
 </FormModal>

 {/* PIN Validation Modal */}
 <FormModal
 isOpen={isPinModalOpen}
 onClose={() => {
 setIsPinModalOpen(false);
 setPinToSubmit('');
 setPinError('');
 setPartyToDelete(null);
 }}
 title="Passcode Required"
 subtitle={partyToDelete === 'bulk'
 ? "Some of the selected contacts have outstanding balances. A Manager or Admin passcode is required to delete them."
 : "This contact has an outstanding balance. A Manager or Admin passcode is required to delete it."
 }
 size="sm"
 footer={
 <div className="flex justify-end gap-3">
 <SecondaryButton onClick={() => setIsPinModalOpen(false)}>
 Cancel
 </SecondaryButton>
 <PrimaryButton
 onClick={() => handleDelete(partyToDelete, pinToSubmit)}
 className="bg-red-600 hover:bg-red-700 text-white"
 >
 Confirm Delete
 </PrimaryButton>
 </div>
 }
 >
 <div className="space-y-4">
 <FormField label="Enter Passcode" error={pinError}>
 <FormInput
 type="password"
 value={pinToSubmit}
 onChange={(e) => {
 setPinToSubmit(e.target.value);
 setPinError('');
 }}
 placeholder="Enter PIN"
 autoFocus
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.preventDefault();
 handleDelete(partyToDelete, pinToSubmit);
 }
 }}
 />
 </FormField>
 </div>
 </FormModal>
 </OneGlanceLayout>
 );
}

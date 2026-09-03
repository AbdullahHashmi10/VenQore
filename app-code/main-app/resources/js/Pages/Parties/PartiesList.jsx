import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import ContactsModuleTabs from '@/Components/ContactsModuleTabs';
import FormModal, { FormField, FormInput, FormSelect, FormTextarea, PrimaryButton, SecondaryButton } from '@/Components/FormModal';
import {
 Users, Plus, UserCheck, Building2, TrendingUp, TrendingDown, FileText,
 Search, Download, Printer, Edit2, Trash2, Eye, ChevronUp, ChevronDown, X, Filter
} from 'lucide-react';
import { useAlert } from '@/Contexts/AlertContext';
import PlanGate from '@/Components/PlanGate';
import axios from 'axios';

export default function PartiesIndex({ parties = {}, stats = {}, flash }) {
 const { showAlert, showConfirm } = useAlert();
 const { url, store } = usePage().props;
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
 <OneGlanceLayout title="Contacts" activeMenu="Contacts">
 <Head title="Contacts" />

 <div className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
 <ContactsModuleTabs activeTab={activeTab} />

 {/* Mobile Stats Toggle/Summary */}
 <div className="sm:hidden flex items-center justify-between bg-surface px-3 py-2.5 rounded-xl border border-line shadow-sm shrink-0">
 <button
 onClick={() => setIsStatsExpanded(!isStatsExpanded)}
 className="flex items-center gap-1 text-2xs font-bold text-ink-muted uppercase shrink-0 mr-2"
 >
 <span>Stats Summary</span>
 <ChevronDown size={14} className={`transition-transform duration-normal ${isStatsExpanded ? 'rotate-180' : ''}`} />
 </button>
 {!isStatsExpanded && (
 <div className="text-2xs font-bold text-ink-muted truncate">
 <span className="text-emerald-600">Rec: {formatCurrency(stats.receivables)}</span>
 <span className="mx-1">|</span>
 <span className="text-rose-600">Pay: {formatCurrency(stats.payables)}</span>
 </div>
 )}
 </div>

 {/* Stats Cards - Responsive Grid */}
 <PlanGate feature="outstanding_balance_grid" showUpgradeBadge={false}>
 <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 ${isStatsExpanded ? 'grid' : 'hidden sm:grid'}`}>
 <div className="bg-surface px-2.5 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
 <div className="flex items-center gap-1.5 shrink-0">
 <div className="p-1 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg shrink-0">
 <Users size={14} />
 </div>
 <p className="text-2xs sm:text-xs font-bold text-ink-muted uppercase tracking-tight truncate">Total Parties</p>
 </div>
 <p className="text-sm sm:text-base md:text-lg font-bold text-ink leading-none mt-1 sm:mt-0">{stats.total || 0}</p>
 </div>
 <div className="bg-surface px-2.5 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
 <div className="flex items-center gap-1.5 shrink-0">
 <div className="p-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
 <UserCheck size={14} />
 </div>
 <p className="text-2xs sm:text-xs font-bold text-ink-muted uppercase tracking-tight truncate">Customers</p>
 </div>
 <p className="text-sm sm:text-base md:text-lg font-bold text-blue-600 leading-none mt-1 sm:mt-0">{stats.customers || 0}</p>
 </div>
 <div className="bg-surface px-2.5 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
 <div className="flex items-center gap-1.5 shrink-0">
 <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
 <TrendingUp size={14} />
 </div>
 <p className="text-2xs sm:text-xs font-bold text-ink-muted uppercase tracking-tight truncate">To Receive</p>
 </div>
 <p className="text-sm sm:text-base md:text-lg font-bold text-emerald-600 leading-none mt-1 sm:mt-0">{formatCurrency(stats.receivables)}</p>
 </div>
 <div className="bg-surface px-2.5 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
 <div className="flex items-center gap-1.5 shrink-0">
 <div className="p-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg shrink-0">
 <TrendingDown size={14} />
 </div>
 <p className="text-2xs sm:text-xs font-bold text-ink-muted uppercase tracking-tight truncate">Payables</p>
 </div>
 <p className="text-sm sm:text-base md:text-lg font-bold text-rose-600 leading-none mt-1 sm:mt-0">{formatCurrency(stats.payables)}</p>
 </div>
 </div>
 </PlanGate>

 {/* Mobile Toolbar (sm:hidden) */}
 <div className="sm:hidden flex flex-col bg-surface rounded-xl border border-line shadow-sm shrink-0">
 <div className="flex items-center justify-between px-3 py-2">
 <h1 className="text-xs font-bold text-ink uppercase tracking-tight">
 {activeTab === 'customers' ? 'Customers' : activeTab === 'suppliers' ? 'Suppliers' : 'All'} <span className="text-brand-600">Contacts</span>
 </h1>
 <div className="flex items-center gap-1">
 <button
 onClick={() => { setShowMobileSearch(!showMobileSearch); if (showMobileFilters) setShowMobileFilters(false); }}
 className={`p-1.5 rounded-lg transition-colors ${showMobileSearch ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
 title="Search"
 >
 <Search size={14} />
 </button>
 <button
 onClick={() => { setShowMobileFilters(!showMobileFilters); if (showMobileSearch) setShowMobileSearch(false); }}
 className={`p-1.5 rounded-lg transition-colors ${showMobileFilters ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
 title="Filter"
 >
 <Filter size={14} />
 </button>
 <div className="flex items-center border-l border-line pl-1.5 ml-0.5">
 <button className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded" title="Export">
 <Download size={14} />
 </button>
 <button className="p-1 text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded" title="Print">
 <Printer size={14} />
 </button>
 </div>
 <button
 onClick={handleCreate}
 className="ml-1 px-2.5 py-1.5 bg-gradient-brand text-white rounded-lg flex items-center gap-1 transition-all shadow-md font-bold text-2xs"
 >
 <Plus size={12} /> Add
 </button>
 </div>
 </div>

 {/* Expandable Mobile Search */}
 {showMobileSearch && (
 <div className="px-3 pb-2 border-t border-line pt-2 animate-in slide-in-from-top duration-normal">
 <div className="relative w-full">
 <input
 autoFocus
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 onKeyDown={handleServerSearch}
 placeholder="Search contacts..."
 className="w-full pl-8 pr-4 py-1.5 text-xs bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
 />
 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={12} />
 </div>
 </div>
 )}

 {/* Expandable Mobile Filters panel */}
 {showMobileFilters && (
 <div className="px-3 pb-2 border-t border-line pt-2 animate-in slide-in-from-top duration-normal">
 <div className="flex items-center gap-1.5">
 <span className="text-3xs font-bold text-ink-muted uppercase tracking-wider shrink-0">Type:</span>
 <div className="flex bg-sunken rounded-lg p-1 gap-1 flex-1">
 <button
 onClick={() => { handleTypeFilter('all'); setShowMobileFilters(false); }}
 className={`flex-1 text-center py-1 rounded text-3xs font-bold uppercase transition-all ${typeFilter === 'all' ? 'bg-sunken text-brand-600 dark:text-brand-400 shadow-sm' : 'text-ink-muted'}`}
 >All</button>
 <button
 onClick={() => { handleTypeFilter('customer'); setShowMobileFilters(false); }}
 className={`flex-1 text-center py-1 rounded text-3xs font-bold uppercase transition-all ${typeFilter === 'customer' ? 'bg-sunken text-blue-600 dark:text-blue-400 shadow-sm' : 'text-ink-muted'}`}
 >Customers</button>
 <button
 onClick={() => { handleTypeFilter('supplier'); setShowMobileFilters(false); }}
 className={`flex-1 text-center py-1 rounded text-3xs font-bold uppercase transition-all ${typeFilter === 'supplier' ? 'bg-sunken text-amber-600 dark:text-amber-400 shadow-sm' : 'text-ink-muted'}`}
 >Suppliers</button>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Desktop Header Bar (sm:flex, hidden on mobile) */}
 <div className="hidden sm:flex flex-row items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
 {/* Left: Title + Filter Pills */}
 <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
 <div className="flex items-center gap-2">
 <h1 className="text-sm sm:text-lg font-bold text-ink uppercase tracking-tight shrink-0">
 {activeTab === 'customers' ? 'Customers' : activeTab === 'suppliers' ? 'Suppliers' : 'All'} <span className="text-brand-600">Contacts</span>
 </h1>
 <div className="hidden sm:block h-4 w-px bg-sunken mx-1"></div>
 </div>
 <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
 <button
 onClick={() => handleTypeFilter('all')}
 className={`px-2 py-0.5 text-3xs sm:text-2xs font-bold uppercase rounded-full transition-all shrink-0 ${typeFilter === 'all'
 ? 'bg-brand-600 text-white shadow-sm'
 : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
 }`}
 >All</button>
 <button
 onClick={() => handleTypeFilter('customer')}
 className={`px-2 py-0.5 text-3xs sm:text-2xs font-bold uppercase rounded-full transition-all shrink-0 ${typeFilter === 'customer'
 ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-sm '
 : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
 }`}
 >Customers</button>
 <button
 onClick={() => handleTypeFilter('supplier')}
 className={`px-2 py-0.5 text-3xs sm:text-2xs font-bold uppercase rounded-full transition-all shrink-0 ${typeFilter === 'supplier'
 ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm '
 : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
 }`}
 >Suppliers</button>
 </div>
 </div>

 {/* Right: Search + Actions + Add Button */}
 <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
 <div className="relative flex-1 sm:flex-none">
 <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
 <input
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 onKeyDown={handleServerSearch}
 placeholder="Search..."
 className="pl-8 pr-2 py-1 text-xs bg-app border border-line rounded-lg focus:ring-2 ring-brand-500/20 focus:border-brand-500 outline-none w-full sm:w-36"
 />
 </div>
 <div className="flex items-center gap-1 shrink-0">
 <div className="flex items-center gap-0.5 border-l border-line pl-1.5">
 <button className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600" title="Export">
 <Download size={14} />
 </button>
 <button className="p-1 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted" title="Print">
 <Printer size={14} />
 </button>
 </div>
 <button
 onClick={handleCreate}
 className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gradient-brand text-white rounded-lg transition-all font-bold shadow-md shrink-0"
 >
 <Plus size={12} />
 <span>Add Party</span>
 </button>
 </div>
 </div>
 </div>
 
 {/* Bulk Actions Bar */}
 {selectedParties.length > 0 && (
 <div className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 shrink-0">
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
 <div className="flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface">
 
 {/* Desktop Table View */}
 <div className="hidden sm:block">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-app border-b border-line sticky top-0 z-10">
 <th className="p-3 w-10">
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
 <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">
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
 <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right">
 Credit Limit
 </th>
 <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
 Phone
 </th>
 <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">
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
 {party.type === 'customer' ? 'Customer' : 'Supplier'}
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
 <td colSpan={7} className="p-12">
 <div className="flex flex-col items-center justify-center text-center">
 <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-3">
 <Users size={28} className="text-ink-muted" />
 </div>
 <p className="text-base font-bold text-ink-secondary mb-1">No parties found</p>
 <p className="text-sm text-ink-muted mb-3">Add your first customer or supplier</p>
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
 
 <div className="flex items-center justify-between text-2xs text-ink-muted bg-surface/50 dark:bg-app p-1.5 rounded-lg border border-line">
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
 <div className="p-12 text-center text-ink-muted text-xs">
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
 </div>

 {/* Create/Edit Modal */}
 <FormModal
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 title={editingParty ? 'Edit Party' : 'Add Party'}
 subtitle={editingParty ? 'Update party details' : 'Add a new customer or supplier'}
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
 <option value="customer">Customer</option>
 <option value="supplier">Supplier</option>
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

 <div className="grid grid-cols-3 gap-4">
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

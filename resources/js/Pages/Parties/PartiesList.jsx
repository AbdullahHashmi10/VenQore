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
            ? <ChevronUp size={14} className="text-indigo-500" />
            : <ChevronDown size={14} className="text-indigo-500" />;
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

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <ContactsModuleTabs activeTab={activeTab} />

                {/* Mobile Stats Toggle/Summary */}
                <div className="sm:hidden flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <button
                        onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase shrink-0 mr-2"
                    >
                        <span>Stats Summary</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isStatsExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {!isStatsExpanded && (
                        <div className="text-[10px] font-bold text-slate-500 truncate">
                            <span className="text-emerald-600">Rec: {formatCurrency(stats.receivables)}</span>
                            <span className="mx-1">|</span>
                            <span className="text-rose-600">Pay: {formatCurrency(stats.payables)}</span>
                        </div>
                    )}
                </div>

                {/* Stats Cards - Responsive Grid */}
                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 ${isStatsExpanded ? 'grid' : 'hidden sm:grid'}`}>
                    <div className="bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                                <Users size={14} />
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate">Total Parties</p>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white leading-none mt-1 sm:mt-0">{stats.total || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                                <UserCheck size={14} />
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate">Customers</p>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg font-black text-blue-600 leading-none mt-1 sm:mt-0">{stats.customers || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                                <TrendingUp size={14} />
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate">To Receive</p>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg font-black text-emerald-600 leading-none mt-1 sm:mt-0">{formatCurrency(stats.receivables)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg shrink-0">
                                <TrendingDown size={14} />
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate">Payables</p>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg font-black text-rose-600 leading-none mt-1 sm:mt-0">{formatCurrency(stats.payables)}</p>
                    </div>
                </div>

                {/* Mobile Toolbar (sm:hidden) */}
                <div className="sm:hidden flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center justify-between px-3 py-2">
                        <h1 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            {activeTab === 'customers' ? 'Customers' : activeTab === 'suppliers' ? 'Suppliers' : 'All'} <span className="text-indigo-600">Contacts</span>
                        </h1>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => { setShowMobileSearch(!showMobileSearch); if (showMobileFilters) setShowMobileFilters(false); }}
                                className={`p-1.5 rounded-lg transition-colors ${showMobileSearch ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                title="Search"
                            >
                                <Search size={14} />
                            </button>
                            <button
                                onClick={() => { setShowMobileFilters(!showMobileFilters); if (showMobileSearch) setShowMobileSearch(false); }}
                                className={`p-1.5 rounded-lg transition-colors ${showMobileFilters ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                title="Filter"
                            >
                                <Filter size={14} />
                            </button>
                            <div className="flex items-center border-l border-slate-200 dark:border-slate-800 pl-1.5 ml-0.5">
                                <button className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded" title="Export">
                                    <Download size={14} />
                                </button>
                                <button className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 rounded" title="Print">
                                    <Printer size={14} />
                                </button>
                            </div>
                            <button
                                onClick={handleCreate}
                                className="ml-1 px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg flex items-center gap-1 transition-all shadow-md font-bold text-[10px]"
                            >
                                <Plus size={12} /> Add
                            </button>
                        </div>
                    </div>

                    {/* Expandable Mobile Search */}
                    {showMobileSearch && (
                        <div className="px-3 pb-2 border-t border-slate-100 dark:border-slate-800/80 pt-2 animate-in slide-in-from-top duration-200">
                            <div className="relative w-full">
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleServerSearch}
                                    placeholder="Search contacts..."
                                    className="w-full pl-8 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                            </div>
                        </div>
                    )}

                    {/* Expandable Mobile Filters panel */}
                    {showMobileFilters && (
                        <div className="px-3 pb-2 border-t border-slate-100 dark:border-slate-800/80 pt-2 animate-in slide-in-from-top duration-200">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Type:</span>
                                <div className="flex bg-slate-100 dark:bg-slate-850 rounded-lg p-1 gap-1 flex-1">
                                    <button
                                        onClick={() => { handleTypeFilter('all'); setShowMobileFilters(false); }}
                                        className={`flex-1 text-center py-1 rounded text-[9px] font-bold uppercase transition-all ${typeFilter === 'all' ? 'bg-white dark:bg-slate-705 text-indigo-650 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                    >All</button>
                                    <button
                                        onClick={() => { handleTypeFilter('customer'); setShowMobileFilters(false); }}
                                        className={`flex-1 text-center py-1 rounded text-[9px] font-bold uppercase transition-all ${typeFilter === 'customer' ? 'bg-white dark:bg-slate-705 text-blue-650 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                    >Customers</button>
                                    <button
                                        onClick={() => { handleTypeFilter('supplier'); setShowMobileFilters(false); }}
                                        className={`flex-1 text-center py-1 rounded text-[9px] font-bold uppercase transition-all ${typeFilter === 'supplier' ? 'bg-white dark:bg-slate-705 text-amber-650 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                    >Suppliers</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Header Bar (sm:flex, hidden on mobile) */}
                <div className="hidden sm:flex flex-row items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <h1 className="text-sm sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                                {activeTab === 'customers' ? 'Customers' : activeTab === 'suppliers' ? 'Suppliers' : 'All'} <span className="text-indigo-600">Contacts</span>
                            </h1>
                            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                            <button
                                onClick={() => handleTypeFilter('all')}
                                className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase rounded-full transition-all shrink-0 ${typeFilter === 'all'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >All</button>
                            <button
                                onClick={() => handleTypeFilter('customer')}
                                className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase rounded-full transition-all shrink-0 ${typeFilter === 'customer'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-sm shadow-blue-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >Customers</button>
                            <button
                                onClick={() => handleTypeFilter('supplier')}
                                className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase rounded-full transition-all shrink-0 ${typeFilter === 'supplier'
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm shadow-amber-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >Suppliers</button>
                        </div>
                    </div>

                    {/* Right: Search + Actions + Add Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleServerSearch}
                                placeholder="Search..."
                                className="pl-8 pr-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none w-full sm:w-36"
                            />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-1.5">
                                <button className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600" title="Export">
                                    <Download size={14} />
                                </button>
                                <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Print">
                                    <Printer size={14} />
                                </button>
                            </div>
                            <button
                                onClick={handleCreate}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-bold shadow-md shrink-0"
                            >
                                <Plus size={12} />
                                <span>Add Party</span>
                            </button>
                        </div>
                    </div>
                </div>
 
                {/* Bulk Actions Bar */}
                {selectedParties.length > 0 && (
                    <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 shrink-0">
                        <span className="font-bold text-sm">{selectedParties.length} Selected</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleDelete('bulk')}
                                className="px-3 py-1 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1"
                            >
                                <Trash2 size={14} /> Delete Selected
                            </button>
                            <button
                                onClick={() => setSelectedParties([])}
                                className="p-1 hover:bg-indigo-700 rounded transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Contacts Area */}
                <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    
                    {/* Desktop Table View */}
                    <div className="hidden sm:block">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                    <th className="p-3 w-10">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                            checked={selectedParties.length === sortedParties.length && sortedParties.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th
                                        onClick={() => handleSort('name')}
                                        className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <div className="flex items-center gap-1">
                                            Party Name <SortIcon columnKey="name" />
                                        </div>
                                    </th>
                                    <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                                        Type
                                    </th>
                                    <th
                                        onClick={() => handleSort('balance')}
                                        className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-right"
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Balance <SortIcon columnKey="balance" />
                                        </div>
                                    </th>
                                    <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                                        Credit Limit
                                    </th>
                                    <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sortedParties.length > 0 ? (
                                    sortedParties.map((party) => (
                                        <tr
                                            key={party.id}
                                            className={`
                                                hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer
                                                ${party.type === 'customer' ? 'border-l-4 border-blue-500' : 'border-l-4 border-amber-500'}
                                                ${selectedParties.includes(party.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                                            `}
                                            onClick={() => handleViewLedger(party)}
                                        >
                                            <td className="p-3 w-10" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
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
                                                        <p className="font-bold text-sm text-slate-800 dark:text-white">{party.name}</p>
                                                        {party.email && <p className="text-[10px] text-slate-400">{party.email}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${party.type === 'customer'
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
                                                        : 'text-red-600'     // Liability (Payable)
                                                        }`}>
                                                        {formatCurrency(Math.abs(party.current_balance || 0))}
                                                    </span>
                                                    <p className="text-[10px] text-slate-400">
                                                        {party.current_balance > 0 ? (party.type === 'customer' ? 'To Receive' : 'To Pay') :
                                                            party.current_balance < 0 ? (party.type === 'customer' ? 'To Pay' : 'To Receive') : 'Settled'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right text-sm text-slate-600 dark:text-slate-400">
                                                {party.credit_limit ? formatCurrency(party.credit_limit) : '-'}
                                            </td>
                                            <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                                                {party.phone || '-'}
                                            </td>
                                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleViewLedger(party)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                        title="View Ledger"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(party)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(party)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-12">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                                    <Users size={28} className="text-slate-400" />
                                                </div>
                                                <p className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">No parties found</p>
                                                <p className="text-sm text-slate-500 mb-3">Add your first customer or supplier</p>
                                                <button
                                                    onClick={handleCreate}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold text-sm"
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
                    <div className="block sm:hidden divide-y divide-slate-150 dark:divide-slate-800">
                        {sortedParties.length > 0 ? (
                            sortedParties.map((party) => (
                                <div
                                    key={party.id}
                                    onClick={() => handleViewLedger(party)}
                                    className={`p-3 hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 flex flex-col gap-2 cursor-pointer relative ${
                                        party.type === 'customer' ? 'border-l-4 border-blue-500' : 'border-l-4 border-amber-500'
                                    } ${selectedParties.includes(party.id) ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex gap-2 items-start">
                                            <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
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
                                                <p className="font-bold text-slate-850 dark:text-white text-xs">{party.name}</p>
                                                {party.phone && (
                                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{party.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`font-black text-xs ${
                                                (party.type === 'customer' && party.current_balance >= 0) || (party.type === 'supplier' && party.current_balance < 0)
                                                    ? 'text-emerald-600' : 'text-red-600'
                                            }`}>
                                                {formatCurrency(Math.abs(party.current_balance || 0))}
                                            </span>
                                            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">
                                                {party.current_balance > 0 ? (party.type === 'customer' ? 'To Receive' : 'To Pay') :
                                                    party.current_balance < 0 ? (party.type === 'customer' ? 'To Pay' : 'To Receive') : 'Settled'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                                        <span>Limit: {party.credit_limit ? formatCurrency(party.credit_limit) : '-'}</span>
                                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => handleViewLedger(party)} className="p-1 text-slate-400 hover:text-indigo-600 rounded">
                                                <FileText size={14} />
                                            </button>
                                            <button onClick={() => handleEdit(party)} className="p-1 text-slate-400 hover:text-blue-600 rounded">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(party)} className="p-1 text-slate-400 hover:text-red-600 rounded">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-slate-400 text-xs">
                                <Users size={24} className="mx-auto mb-2 opacity-50" />
                                No contacts available
                            </div>
                        )}
                    </div>

                    {/* Infinite Scroll Sentinel inside scroll container */}
                    <div ref={observerTarget} className="p-4 text-center text-slate-400 text-sm opacity-0 h-4">
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

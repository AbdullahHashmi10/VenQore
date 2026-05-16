import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import ContactsModuleTabs from '@/Components/ContactsModuleTabs';
import FormModal, { FormField, FormInput, FormSelect, FormTextarea, PrimaryButton, SecondaryButton } from '@/Components/FormModal';
import {
    Users, Plus, UserCheck, Building2, TrendingUp, TrendingDown, FileText,
    Search, Download, Printer, Edit2, Trash2, Eye, ChevronUp, ChevronDown
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
    const [partyToDelete, setPartyToDelete] = useState(null);
    const [pinError, setPinError] = useState('');

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
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0
        }).format(value || 0);
    };

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

    // Handle delete
    const handleDelete = async (party, passcode = null) => {
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
    }; function handleDeleteLegacy(party) {
        // Keeping this just in case but we transitioned to performDelete
    }

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

                {/* Stats Cards - 4 Separate Cards in Row */}
                <div className="grid grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Users size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Parties</p>
                        </div>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{stats.total || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <UserCheck size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Customers</p>
                        </div>
                        <p className="text-lg font-black text-blue-600">{stats.customers || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <TrendingUp size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">To Receive</p>
                        </div>
                        <p className="text-lg font-black text-emerald-600">{formatCurrency(stats.receivables)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                <TrendingDown size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Payables</p>
                        </div>
                        <p className="text-lg font-black text-rose-600">{formatCurrency(stats.payables)}</p>
                    </div>
                </div>

                {/* Header Bar - Title + Filter Pills + Search + Add Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            {activeTab === 'customers' ? 'Customers' : activeTab === 'suppliers' ? 'Suppliers' : 'All'} <span className="text-indigo-600">Contacts</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => handleTypeFilter('all')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${typeFilter === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >All</button>
                        <button
                            onClick={() => handleTypeFilter('customer')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${typeFilter === 'customer'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >Customers</button>
                        <button
                            onClick={() => handleTypeFilter('supplier')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${typeFilter === 'supplier'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >Suppliers</button>
                    </div>

                    {/* Right: Search + Actions + Add Button */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleServerSearch}
                                placeholder="Search parties..."
                                className="pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none w-44"
                            />
                        </div>
                        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <button className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600" title="Export">
                                <Download size={16} />
                            </button>
                            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Print">
                                <Printer size={16} />
                            </button>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-bold text-xs shadow-lg shadow-indigo-500/20"
                        >
                            <Plus size={14} />
                            Add Party
                        </button>
                    </div>
                </div>

                {/* Main Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
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
                                        `}
                                        onClick={() => handleViewLedger(party)}
                                    >
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
                                    <td colSpan={6} className="p-12">
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
                subtitle="This party has a non-zero balance. A Manager or Admin passcode is required to delete it."
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

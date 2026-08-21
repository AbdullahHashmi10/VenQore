import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import FormModal, { FormField, FormInput, FormSelect, FormTextarea, PrimaryButton, SecondaryButton } from '@/Components/FormModal';
import ConfirmModal from '@/Components/ConfirmModal';
import ExpenseTourGuide from '@/Components/ExpenseTourGuide';
import {
    Receipt,
    Plus,
    TrendingDown,
    Calendar,
    Tag,
    Wallet,
    Search,
    Printer,
    FileSpreadsheet,
    MoreVertical,
    Trash2,
    Edit,
    CheckSquare,
    ChevronUp,
    ChevronDown,
    CreditCard,
    DollarSign,
    Upload,
    FileText,
    Layers,
    X,
    Check,
    User,
    Building2,
    Monitor,
    AlertTriangle,
    Filter,
    History,
    CornerUpRight
} from 'lucide-react';
import axios from 'axios';

import { vq } from '@/theme/runtime';
// -- Party Search Field (same component as Payments In/Out) ------------------
const AC_OFF = 'payee-search-' + Math.random().toString(36).slice(2);

function PartySearchField({ value, selectedParty, onSelect, onClear, store }) {
    const [query, setQuery] = React.useState(value || '');
    const [results, setResults] = React.useState([]);
    const [defaultResults, setDefaultResults] = React.useState([]);
    const [open, setOpen] = React.useState(false);
    const [searching, setSearching] = React.useState(false);
    const debounceRef = React.useRef(null);
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        axios.get(route("store.parties.search", {
            store_slug: store.slug
        }), { params: {} })
            .then(res => setDefaultResults((res.data || []).slice(0, 5)))
            .catch(() => { });
    }, []);

    const doSearch = React.useCallback(async (q) => {
        setSearching(true);
        try {
            const res = await axios.get(route("store.parties.search", {
                store_slug: store.slug
            }), { params: q ? { search: q } : {} });
            setResults(res.data || []);
            setOpen(true);
        } catch { setResults([]); }
        finally { setSearching(false); }
    }, []);

    const handleInput = (e) => {
        const q = e.target.value;
        setQuery(q);
        if (selectedParty) onClear();
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(q), 220);
    };

    const handleFocus = () => {
        if (!query) { setResults(defaultResults); setOpen(defaultResults.length > 0); }
        else { setOpen(results.length > 0); }
    };

    const handleSelect = (party) => { setQuery(party.name); setOpen(false); onSelect(party); };
    const handleClear = () => { setQuery(''); setResults(defaultResults); setOpen(false); onClear(); };

    React.useEffect(() => {
        const h = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <div className={`flex items-center gap-4 px-6 h-16 rounded-2xl border transition-all focus-within:ring-[6px] focus-within:ring-brand-500/10 shadow-sm ${selectedParty ? 'border-emerald-500/60 bg-surface' : 'border-line focus-within:border-brand-500 bg-surface'}
                }`}>
                <Search size={14} className="text-ink-muted shrink-0" />
                <input
                    type="text" name={AC_OFF} value={query}
                    onChange={handleInput} onFocus={handleFocus}
                    placeholder="Search party name or phone..."
                    autoComplete="new-password"
                    className="flex-1 bg-transparent border-none outline-none text-base font-bold text-ink placeholder-slate-400 focus:ring-0"
                    style={{ boxShadow: 'none' }}
                />
                {searching && <div className="w-3.5 h-3.5 border-2 border-line-strong border-t-emerald-400 rounded-full animate-spin shrink-0" />}
                {(query || selectedParty) && !searching && (
                    <button type="button" onClick={handleClear} className="text-ink-muted hover:text-white transition shrink-0"><X size={13} /></button>
                )}
            </div>

            {selectedParty && (
                <div className="mt-1.5 flex items-center gap-2 px-1">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center"><User size={9} className="text-emerald-400" /></div>
                    <span className="text-xs font-semibold text-emerald-400">{selectedParty.name}</span>
                    {selectedParty.type && <span className="text-3xs font-bold uppercase px-1.5 py-0.5 rounded-full bg-white/10 text-ink-muted">{selectedParty.type}</span>}
                </div>
            )}

            {open && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 shadow-2xl z-sticky max-h-52 overflow-auto" style={{ background: vq.slate[800] }}>
                    {results.map(party => {
                        const bal = parseFloat(party.current_balance || 0);
                        const settled = Math.abs(bal) < 0.01;
                        const isReceive = (party.balance_direction === 'To Receive') || (bal > 0);
                        return (
                            <button key={party.id} type="button" onClick={() => handleSelect(party)}
                                className="w-full px-4 py-2.5 text-left hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${party.type === 'customer' ? 'bg-blue-500/20' : 'bg-amber-500/20'}`}>
                                    {party.type === 'customer'
                                        ? <User size={12} className="text-blue-400" />
                                        : <Building2 size={12} className="text-amber-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{party.name}</p>
                                    <p className="text-2xs text-ink-muted truncate">{party.phone || party.email || party.type}</p>
                                </div>
                                {!settled && (
                                    <span className={`text-2xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${isReceive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                                        {isReceive ? 'To Receive' : 'To Pay'}: {getCurrencySymbol()} {Math.abs(bal).toLocaleString()}
                                    </span>
                                )}
                                {settled && <span className="text-2xs font-bold px-1.5 py-0.5 rounded-full shrink-0 bg-white/10 text-ink-muted">Settled</span>}
                            </button>
                        );
                    })}
                </div>
            )}

            {open && results.length === 0 && !searching && query && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 shadow-xl z-sticky px-4 py-4 text-center text-sm text-ink-muted" style={{ background: vq.slate[800] }}>
                    No results for "{query}"
                </div>
            )}
        </div>
    );
}

// -- Custom Select (Dark Theme) ----------------------------------------------
function CustomSelect({ value, onChange, options, placeholder, error, onAddNew }) {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef(null);
    const selected = options.find(o => String(o.value) === String(value));

    React.useEffect(() => {
        const h = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`w-full h-16 px-6 rounded-2xl text-base font-bold flex justify-between items-center border transition-all shadow-sm outline-none cursor-pointer bg-surface ${open ? 'border-brand-500 ring-[6px] ring-brand-500/10' :
                    error ? 'border-rose-500' : 'border-line hover:border-line-strong'
                    }`}
            >
                <span className={selected ? 'text-ink' : 'text-ink-muted'}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown size={14} className={`text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl border border-white/10 z-drawer py-1 max-h-52 overflow-auto hide-scrollbar" style={{ background: vq.slate[800] }}>
                    <button
                        type="button"
                        onClick={() => { onChange(''); setOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-ink-muted hover:bg-white/5 transition-colors"
                    >
                        {placeholder}
                    </button>

                    {options.map(opt => {
                        const isSelected = String(value) === String(opt.value);
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-l-2 ${isSelected
                                    ? 'border-brand-500 bg-brand-500/10 text-white font-bold'
                                    : 'border-transparent text-neutral-300 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}

                    {/* Add New Option */}
                    {onAddNew && (
                        <button
                            id="tour-add-expense-category-btn"
                            type="button"
                            onClick={() => { setOpen(false); onAddNew(); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-brand-400 font-bold hover:bg-brand-500/10 transition-colors flex items-center gap-2 border-t border-white/5 mt-1"
                        >
                            <Plus size={14} />
                            Create New Category
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
export default function ExpensesIndex({ expenses = [], categories = [], stats = {}, bankAccounts = [], cashBalance = 0, filters = {} }) {
    const {
        store
    } = usePage().props;

    // Infinite Scroll State
    const [allExpenses, setAllExpenses] = useState(expenses.data || []);
    const [nextPageUrl, setNextPageUrl] = useState(expenses.next_page_url);
    const isLoading = useRef(false);
    const observerTarget = useRef(null);

    // Sync state
    useEffect(() => {
        if (expenses.data && expenses.current_page === 1) {
            setAllExpenses(expenses.data);
            setNextPageUrl(expenses.next_page_url);
        }
    }, [expenses]);

    // Fetch Next Page
    const fetchNextPage = useCallback(async () => {
        if (!nextPageUrl || isLoading.current) return;
        isLoading.current = true;
        try {
            const response = await axios.get(nextPageUrl, { headers: { 'Accept': 'application/json' } });
            const newItems = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
            setAllExpenses(prev => {
                if (!Array.isArray(prev)) prev = [];
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNew = newItems.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNew];
            });
            setNextPageUrl(response.data?.next_page_url || null);
        } catch (error) { console.error(error); } finally { isLoading.current = false; }
    }, [nextPageUrl]);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextPageUrl && !isLoading.current) fetchNextPage();
        }, { threshold: 0.1, rootMargin: '800px' });
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
    }, [nextPageUrl, fetchNextPage]);

    // --- HOOKS ---
    const scrollContainerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Column Config
    // Parse URL params for sync
    const params = new URLSearchParams(window.location.search);

    const [searchTerm, setSearchTerm] = useState(params.get('search') || '');
    const [activeFilter, setActiveFilter] = useState(params.get('filter') || 'all');
    const [activeCategory, setActiveCategory] = useState(params.get('category') || 'all');
    const [dateRange, setDateRange] = useState({
        from: params.get('from_date') || '',
        to: params.get('to_date') || ''
    });

    const [sortConfig, setSortConfig] = useState({ 
        key: params.get('sort_by') || 'date', 
        direction: params.get('sort_dir') || 'desc' 
    });

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
    }, [sortConfig, activeFilter, activeCategory, dateRange]);

    useEffect(() => {
        if (searchTerm !== (params.get('search') || '')) {
            debouncedSearch(searchTerm);
        }
    }, [searchTerm]);

    // Apply Filters
    const applyFilters = (newParams) => {
        router.get(route('store.expenses.index', { store_slug: store.slug }), {
            search: searchTerm,
            filter: activeFilter,
            category: activeCategory === 'all' ? '' : activeCategory,
            from_date: dateRange.from,
            to_date: dateRange.to,
            sort_by: sortConfig.key,
            sort_dir: sortConfig.direction,
            ...newParams
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    // Use raw data from server (already sorted globally)
    const sortedExpenses = allExpenses;

    // Sorting
    const handleSort = (key) => {
        const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, direction });
        applyFilters({ sort_by: key, sort_dir: direction });
    };

    function resolveValue(item, key) {
        switch (key) {
            case 'date': return item.date;
            case 'category': return item.category || 'Uncategorized';
            case 'amount': return parseFloat(item.amount);
            default: return item[key];
        }
    }

    // Category Creation State
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const [editingExpense, setEditingExpense] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: '',
        expense_category_id: '',
        category: '',
        amount: '',
        tax_amount: '',
        payment_method: 'cash',
        bank_account_id: '',
        payee: '',
        reference: '',
        description: '',
        notes: '',
        attachment: null
    });
    const [errors, setErrors] = useState({});
    const [selectedParty, setSelectedParty] = useState(null);

    // Derived State for Grand Total in Form
    const grandTotalValue = (parseFloat(formData.amount) || 0) + (parseFloat(formData.tax_amount) || 0);

    // Mouse Drag Handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    // Wheel Scroll Handler
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            const handleWheel = (e) => {
                if (e.deltaY !== 0) {
                    e.preventDefault();
                    container.scrollLeft += e.deltaY;
                }
            };
            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => container.removeEventListener('wheel', handleWheel);
        }
    }, []);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.get('action') === 'add') {
            handleCreate();
        }
    }, []);

    // Formatters

    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    const handleServerSearch = (e) => {
        if (e.key === 'Enter') {
            applyFilters({ search: searchTerm });
        }
    };

    // Trigger filters on category/filter change (need wrappers)
    const handleCategoryChange = (catId) => {
        setActiveCategory(catId);
        applyFilters({ category: catId === 'all' ? '' : catId });
    };

    const handleFilterChange = (filterType) => {
        setActiveFilter(filterType);
        applyFilters({ filter: filterType });
    };

    // CRUD Handlers
    const handleCreate = () => {
        setEditingExpense(null);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            expense_category_id: activeCategory !== 'all' ? activeCategory : '',
            channel: '',
            category: '',
            amount: '',
            tax_amount: '',
            payment_method: 'cash',
            bank_account_id: '',
            payee: '',
            reference: '',
            description: '',
            notes: '',
            attachment: null
        });
        setErrors({});
        setSelectedParty(null);
        setIsModalOpen(true);
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setSelectedParty(expense.party_id ? { id: expense.party_id, name: expense.payee } : null);
        setFormData({
            date: expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
            expense_category_id: expense.expense_category_id || '',
            channel: expense.channel || '',
            category: expense.category || '',
            amount: expense.amount || '',
            tax_amount: expense.tax_amount || '',
            payment_method: expense.payment_method || 'cash',
            bank_account_id: expense.bank_account_id || '',
            payee: expense.payee || '',
            party_id: expense.party_id || '',
            reference: expense.reference || '',
            description: expense.description || '',
            notes: expense.notes || '',
            attachment: null // Don't preload file
        });
        setErrors({});
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setExpenseToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!expenseToDelete) return;
        try {
            await axios.delete(route('store.expenses.destroy', expenseToDelete));
            setShowDeleteModal(false);
            setExpenseToDelete(null);
            router.reload({ only: ['expenses', 'stats'] });
        } catch (error) {
            alert('Failed to delete expense');
        }
    };

    const handleCreateCategory = async (nameOverride = null) => {
        const nameToUse = (typeof nameOverride === 'string' ? nameOverride : newCategoryName).trim();
        if (!nameToUse) return;

        try {
            // Using /expenses/category endpoint (ensure route exists)
            const res = await axios.post(route('store.expenses.category.store', { store_slug: store.slug }), { name: nameToUse });

            if (res.data.success) {
                setNewCategoryName('');
                setIsCreatingCategory(false);

                // If editing form is open, select the new category
                if (isModalOpen && res.data.category) {
                    setFormData(prev => ({ ...prev, expense_category_id: res.data.category.id }));
                }

                router.reload({ only: ['categories'] });
                // Note: Router reload might be async, but form state update should persist if we handled it right.
                // However, inertia reload preserves component state by default (except page props which update).
            }
        } catch (e) {
            alert('Failed to create category. ' + (e.response?.data?.message || ''));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) data.append(key, formData[key]);
        });

        // Validations
        const newErrors = {};
        if (!formData.description?.trim()) newErrors.description = ['Description is required'];
        if (formData.payment_method === 'bank' && !formData.bank_account_id) newErrors.bank_account_id = ['Bank account is required'];

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        try {
            if (editingExpense) {
                // Axios put with FormData needs _method spoofing
                data.append('_method', 'PUT');
                await axios.post(route('store.expenses.update', editingExpense.id), data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await axios.post(route('store.expenses.store', { store_slug: store.slug }), data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setIsModalOpen(false);
            if (store?.onboarding_step === 'expense_tour') {
                router.post(
                    route('store.onboarding.step', { store_slug: store?.slug }),
                    { step: 'expense_congratulations' },
                    { preserveScroll: true }
                );
            } else {
                router.reload({ only: ['expenses', 'stats'] });
            }
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
            } else {
                alert('An error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <OneGlanceLayout title="Expenses" activeMenu="Money">
            <Head title="Expenses" />

            <div className="flex flex-col h-full bg-app p-2 gap-1 overflow-y-auto md:overflow-hidden">
                <MoneyModuleTabs activeTab="expenses" />

                {/* Mobile Stats Toggle/Summary */}
                <div className="flex md:hidden items-center justify-between bg-surface px-3 py-2.5 rounded-xl border border-line shadow-sm shrink-0">
                    <button
                        onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                        className="flex items-center gap-1.5 text-xs font-bold text-ink-muted uppercase text-left shrink-0 mr-2"
                    >
                        <span>Stats Summary</span>
                        <ChevronDown size={16} className={`transition-transform duration-normal ${isStatsExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {!isStatsExpanded && (
                        <div className="flex flex-col gap-1 items-end text-xs font-bold text-ink-secondary">
                            <div className="flex items-center gap-2">
                                <span className="text-rose-600 dark:text-rose-400">Today: {formatCurrency(stats.today)}</span>
                                <span className="text-neutral-300 dark:text-ink-secondary">|</span>
                                <span className="text-purple-600 dark:text-purple-400">Month: {formatCurrency(stats.month)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Cards - Compact Row */}
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? 'grid' : 'hidden md:grid'}`}>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                <TrendingDown size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Today's Expenses</p>
                        </div>
                        <p className="text-base font-bold text-ink">{formatCurrency(stats.today)}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <Calendar size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">This Week</p>
                        </div>
                        <p className="text-base font-bold text-amber-600">{formatCurrency(stats.week)}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                <Wallet size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">This Month</p>
                        </div>
                        <p className="text-base font-bold text-purple-600">{formatCurrency(stats.month)}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-sunken text-ink-secondary rounded-lg">
                                <Receipt size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Total Expenses</p>
                        </div>
                        <p className="text-base font-bold text-ink">{formatCurrency(stats.total)}</p>
                    </div>
                </div>

                {/* Category Bar Row - Integrated below stats */}
                <div
                    ref={scrollContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    className="bg-surface px-2 py-2 rounded-xl border border-line shadow-sm shrink-0 flex items-center gap-2 overflow-x-auto custom-scrollbar cursor-grab active:cursor-grabbing select-none"
                >
                    {/* Label: hidden on mobile */}
                    <div className="hidden md:flex items-center gap-2 shrink-0">
                        <Layers size={14} className="text-ink-muted" />
                        <span className="text-xs font-bold text-ink-muted uppercase mr-2">Categories:</span>
                    </div>

                    {/* Add Category Section */}
                    {isCreatingCategory && !isModalOpen ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 relative z-raised">
                            <input
                                autoFocus
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateCategory();
                                    if (e.key === 'Escape') setIsCreatingCategory(false);
                                }}
                                placeholder="Category Name"
                                className="w-40 md:w-56 px-3 py-1.5 text-xs font-semibold bg-surface border border-brand-300 dark:border-line rounded-lg text-ink placeholder-slate-400 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none transition-all shadow-sm"
                            />
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleCreateCategory()}
                                    className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-sm active:scale-95 transition-all"
                                    title="Save Category (Enter)"
                                >
                                    <Check size={14} />
                                </button>
                                <button
                                    onClick={() => setIsCreatingCategory(false)}
                                    className="p-1.5 bg-sunken text-ink-muted dark:text-ink-secondary rounded-lg hover:bg-interactive-hover dark:hover:bg-interactive-hover shadow-sm active:scale-95 transition-all"
                                    title="Cancel (Esc)"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop: full label button */}
                            <button
                                onClick={() => setIsCreatingCategory(true)}
                                className="hidden md:flex px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed border-line dark:border-line text-ink-muted hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 transition-all whitespace-nowrap items-center gap-1"
                            >
                                <Plus size={12} /> Add Category
                            </button>
                            {/* Mobile: icon-only button */}
                            <button
                                onClick={() => setIsCreatingCategory(true)}
                                className="md:hidden p-1.5 rounded-lg border border-dashed border-line dark:border-line text-ink-muted hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 transition-all shrink-0"
                                title="Add Category"
                            >
                                <Plus size={14} />
                            </button>
                        </>
                    )}

                    <div className="h-6 w-px bg-sunken mx-1 shrink-0"></div>

                    <button
                        onClick={() => handleCategoryChange('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeCategory === 'all' ? 'bg-neutral-800 text-white dark:bg-white dark:text-ink' : 'bg-sunken text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover'}`}
                    >
                        {/* Mobile: shorter label */}
                        <span className="md:hidden">All</span>
                        <span className="hidden md:inline">All Categories</span>
                    </button>

                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${String(activeCategory) === String(cat.id) ? 'bg-brand-600 text-white shadow-lg ' : 'bg-brand-50 dark:bg-brand-900/10 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30'}`}
                        >
                            <span>{cat.name}</span>
                        </button>
                    ))}
                </div>

                {/* Mobile Toolbar (hidden on desktop) */}
                <div className="md:hidden flex flex-col gap-0 bg-surface rounded-xl border border-line shadow-sm shrink-0">
                    {/* Title row + icon buttons */}
                    <div className="flex items-center justify-between px-3 py-2">
                        <h1 className="text-sm font-bold text-ink uppercase tracking-tight">
                            Expenses <span className="text-rose-600">Transactions</span>
                        </h1>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => { setShowMobileSearch(!showMobileSearch); if (showMobileFilters) setShowMobileFilters(false); }}
                                className={`p-2 rounded-lg transition-colors ${showMobileSearch ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
                                title="Search"
                            >
                                <Search size={16} />
                            </button>
                            <button
                                onClick={() => { setShowMobileFilters(!showMobileFilters); if (showMobileSearch) setShowMobileSearch(false); }}
                                className={`p-2 rounded-lg transition-colors ${showMobileFilters ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
                                title="Filter"
                            >
                                <Filter size={16} />
                            </button>
                            <button
                                id="tour-expense-create-btn-mobile"
                                onClick={handleCreate}
                                className="ml-1 px-3.5 py-2 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 font-bold text-xs"
                            >
                                <Plus size={14} /> Record
                            </button>
                        </div>
                    </div>

                    {/* Expandable Search */}
                    {showMobileSearch && (
                        <div className="px-3 pb-2 border-t border-line pt-2 animate-in slide-in-from-top duration-normal">
                            <div className="relative w-full">
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleServerSearch}
                                    placeholder="Search expenses..."
                                    className="w-full pl-9 pr-4 py-1.5 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={14} />
                            </div>
                        </div>
                    )}

                    {/* Expandable Filters */}
                    {showMobileFilters && (
                        <div className="px-3 pb-2 border-t border-line pt-2 animate-in slide-in-from-top duration-normal flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-2xs font-bold text-ink-muted uppercase tracking-wider shrink-0">Period:</span>
                                <div className="flex bg-sunken rounded-lg p-1 gap-1 flex-1">
                                    <button onClick={() => { handleFilterChange('all'); setShowMobileFilters(false); }} className={`flex-1 text-center py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === 'all' ? 'bg-sunken text-ink shadow-sm' : 'text-ink-muted hover:text-ink-secondary'}`}>All</button>
                                    <button onClick={() => { handleFilterChange('today'); setShowMobileFilters(false); }} className={`flex-1 text-center py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === 'today' ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600' : 'text-ink-muted hover:text-ink-secondary'}`}>Today</button>
                                    <button onClick={() => { handleFilterChange('month'); setShowMobileFilters(false); }} className={`flex-1 text-center py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === 'month' ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600' : 'text-ink-muted hover:text-ink-secondary'}`}>Month</button>
                                    <button onClick={() => { handleFilterChange('year'); setShowMobileFilters(false); }} className={`flex-1 text-center py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === 'year' ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600' : 'text-ink-muted hover:text-ink-secondary'}`}>Year</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content Area - Desktop table / Mobile cards below */}
                <div className="hidden md:flex flex-col flex-1 min-h-0 bg-surface rounded-xl border border-line shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-2 md:p-3 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-2 bg-sunken/50 dark:bg-surface shrink-0">
                        {/* Left/Top actions: Search & Filters (Desktop) / Mobile Toggle Buttons */}
                        <div className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto">
                            <div className="hidden md:flex items-center gap-2">
                                <div className="w-64 relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={handleServerSearch}
                                        placeholder="Search expenses..."
                                        className="w-full pl-9 pr-4 py-2 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={16} />
                                </div>

                                <div className="flex bg-surface rounded-lg border border-line p-1">
                                    <button onClick={() => handleFilterChange('all')} className={`px-3 py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === 'all' ? 'bg-sunken text-ink' : 'text-ink-muted hover:text-ink-secondary'}`}>All Time</button>
                                    <button onClick={() => handleFilterChange('today')} className={`px-3 py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === 'today' ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600' : 'text-ink-muted hover:text-ink-secondary'}`}>Today</button>
                                </div>
                            </div>

                            {/* Mobile Toggle Buttons */}
                            <div className="flex md:hidden items-center gap-1">
                                <button
                                    onClick={() => { setShowMobileSearch(!showMobileSearch); if (showMobileFilters) setShowMobileFilters(false); }}
                                    className={`p-2 rounded-lg transition-colors ${showMobileSearch ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
                                >
                                    <Search size={18} />
                                </button>
                                <button
                                    onClick={() => { setShowMobileFilters(!showMobileFilters); if (showMobileSearch) setShowMobileSearch(false); }}
                                    className={`p-2 rounded-lg transition-colors ${showMobileFilters ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
                                >
                                    <Filter size={18} />
                                </button>
                            </div>

                            <button
                                id="tour-expense-create-btn-mobile"
                                onClick={handleCreate}
                                className="md:hidden px-3.5 py-2 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 font-bold text-xs"
                            >
                                <Plus size={14} />
                                Record
                            </button>
                        </div>

                        {/* Desktop Create Button */}
                        <div className="hidden md:flex items-center gap-2">
                            <button
                                id="tour-expense-create-btn"
                                onClick={handleCreate}
                                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95 font-bold text-sm"
                            >
                                <Plus size={16} />
                                Record Expense
                            </button>
                        </div>
                    </div>

                    {/* Mobile Expandable Search */}
                    {showMobileSearch && (
                        <div className="md:hidden px-3 py-2 border-b border-line bg-app animate-in slide-in-from-top duration-normal w-full">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleServerSearch}
                                    placeholder="Search expenses..."
                                    className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={16} />
                            </div>
                        </div>
                    )}

                    {/* Mobile Expandable Filters */}
                    {showMobileFilters && (
                        <div className="md:hidden px-3 py-2.5 border-b border-line bg-app animate-in slide-in-from-top duration-normal flex flex-col gap-2 w-full">
                            <div className="flex items-center gap-2">
                                <span className="text-2xs font-bold text-ink-muted uppercase tracking-wider">Time:</span>
                                <div className="flex bg-surface rounded-lg border border-line p-1 flex-1">
                                    <button onClick={() => { handleFilterChange('all'); setShowMobileFilters(false); }} className={`flex-1 text-center py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === 'all' ? 'bg-sunken text-ink' : 'text-ink-muted hover:text-ink-secondary'}`}>All Time</button>
                                    <button onClick={() => { handleFilterChange('today'); setShowMobileFilters(false); }} className={`flex-1 text-center py-1 rounded text-2xs font-bold uppercase transition-colors ${activeFilter === 'today' ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600' : 'text-ink-muted hover:text-ink-secondary'}`}>Today</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table / List View */}
                    <div className="flex-1 overflow-auto hidden md:block">
                        <table className="hidden md:table w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-app border-b border-line">
                                <tr>
                                    <th onClick={() => handleSort('date')} className="p-4 text-xs font-bold text-ink-muted uppercase cursor-pointer hover:bg-sunken dark:hover:bg-interactive-hover transition-colors w-[12%]">
                                        <div className="flex items-center gap-1">Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div>
                                    </th>
                                    <th className="p-4 text-xs font-bold text-ink-muted uppercase w-[15%]">Category</th>
                                    <th className="p-4 text-xs font-bold text-ink-muted uppercase w-[25%]">Description & Payee</th>
                                    <th className="p-4 text-xs font-bold text-ink-muted uppercase w-[12%]">Payment</th>
                                    <th className="p-4 text-xs font-bold text-ink-muted uppercase w-[10%]">Ref</th>
                                    <th onClick={() => handleSort('amount')} className="p-4 text-xs font-bold text-ink-muted uppercase cursor-pointer hover:bg-sunken dark:hover:bg-interactive-hover transition-colors text-right w-[15%]">
                                        <div className="flex items-center justify-end gap-1">Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div>
                                    </th>
                                    <th className="p-4 text-xs font-bold text-ink-muted uppercase text-right w-[11%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line bg-surface">
                                {sortedExpenses.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-ink-muted">
                                            <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Layers size={32} className="text-neutral-300" />
                                            </div>
                                            <p className="font-bold text-ink-secondary">No expenses found</p>
                                            <p className="text-sm opacity-70">Try adjusting filters or record a new expense.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedExpenses.map((item) => (
                                        <tr key={item.id} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover group transition-colors">
                                            <td className="p-4 text-sm font-medium text-ink-secondary tabular-nums">{formatDate(item.date)}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wide border ${item.category_color ? `bg-${item.category_color}-50 text-${item.category_color}-600 border-${item.category_color}-200` : 'bg-sunken text-ink-secondary border-line'}`}>
                                                    {item.category || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-ink line-clamp-1">{item.description || 'No description'}</span>
                                                    {item.payee && <span className="text-1xs font-semibold text-ink-muted flex items-center gap-1"><Search size={10} /> {item.payee}</span>}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${item.payment_method === 'cash' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                                                    <span className="uppercase text-xs font-bold text-ink-secondary">{item.payment_method}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs font-mono text-ink-muted">{item.reference || '-'}</td>
                                            <td className="p-4 text-right">
                                                <span className="font-bold text-rose-600 text-sm tabular-nums">{formatCurrency(parseFloat(item.amount) + (parseFloat(item.tax_amount) || 0))}</span>
                                                {item.tax_amount > 0 && <p className="text-3xs text-ink-muted">(Inc. Tax: {getCurrencySymbol()} {item.tax_amount})</p>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-600 rounded transition-colors" title="Edit">
                                                        <Edit size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(item.id)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 rounded transition-colors" title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Mobile View - Cards List (hidden — rendered outside this container for natural page scroll) */}
                        <div className="hidden">
                            {sortedExpenses.length === 0 ? (
                                <div className="bg-surface rounded-xl p-8 text-center border border-line mx-2">
                                    <Layers size={32} className="mx-auto text-ink-muted mb-2" />
                                    <p className="text-sm font-bold text-ink-secondary">No expenses found</p>
                                </div>
                            ) : (
                                sortedExpenses.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3 mx-0 bg-surface border-b border-line flex flex-col gap-2 cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors"
                                        onClick={() => handleEdit(item)}
                                    >
                                        {/* Row 1: Description/Payee (Left), Reference & Date (Right) */}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-bold text-ink text-sm leading-tight">
                                                    {item.description || 'No description'}
                                                </h3>
                                                {item.payee && (
                                                    <p className="text-2xs text-ink-muted font-semibold mt-0.5">{item.payee}</p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0 ml-2">
                                                {item.reference && (
                                                    <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 block">
                                                        {item.reference}
                                                    </span>
                                                )}
                                                <span className="text-2xs text-ink-muted font-semibold block mt-0.5">
                                                    {formatDate(item.date)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Row 2: Category badge + payment method badge */}
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-3xs font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded border border-rose-200/30">
                                                {item.category || 'Uncategorized'}
                                            </span>
                                            {item.payment_method && (
                                                <span className="text-3xs font-bold uppercase bg-sunken text-ink-secondary dark:bg-surface dark:text-ink-muted px-2 py-0.5 rounded border border-line dark:border-line">
                                                    {item.payment_method}
                                                </span>
                                            )}
                                        </div>

                                        {/* Row 3: Amount (Left) + Action Icons (Right) */}
                                        <div className="flex items-center justify-between border-t border-line pt-2 mt-1">
                                            <div className="flex items-center gap-6">
                                                <div>
                                                    <span className="text-3xs text-ink-muted font-bold uppercase block tracking-wider">Amount</span>
                                                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                                        {formatCurrency(parseFloat(item.amount) + (parseFloat(item.tax_amount) || 0))}
                                                    </span>
                                                </div>
                                                {parseFloat(item.tax_amount) > 0 && (
                                                    <div>
                                                        <span className="text-3xs text-ink-muted font-bold uppercase block tracking-wider">Tax</span>
                                                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                                            {formatCurrency(item.tax_amount)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(item.id)}
                                                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-ink-muted hover:text-rose-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop infinite scroll observer */}
                        <div ref={observerTarget} className="hidden md:block mt-4 p-4 text-center text-ink-muted text-sm opacity-0 h-4">
                            {nextPageUrl ? 'Loading...' : ''}
                        </div>
                    </div>
                </div>

                {/* Mobile Cards - outside the container so page scrolls freely */}
                <div className="md:hidden flex flex-col gap-2 pb-20">
                    {sortedExpenses.length === 0 ? (
                        <div className="bg-surface rounded-xl p-8 text-center border border-line">
                            <Layers size={32} className="mx-auto text-ink-muted mb-2" />
                            <p className="text-sm font-bold text-ink-secondary">No expenses found</p>
                            <p className="text-xs text-ink-muted mt-1">Try adjusting filters or record a new expense.</p>
                        </div>
                    ) : (
                        sortedExpenses.map((item) => (
                            <div
                                key={item.id}
                                className="p-3 bg-surface rounded-xl border border-line shadow-sm flex flex-col gap-2 cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                                onClick={() => handleEdit(item)}
                            >
                                {/* Row 1: Description/Payee (Left), Reference & Date (Right) */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-ink text-sm leading-tight">
                                            {item.description || 'No description'}
                                        </h3>
                                        {item.payee && (
                                            <p className="text-2xs text-ink-muted font-semibold mt-0.5">{item.payee}</p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        {item.reference && (
                                            <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 block">
                                                {item.reference}
                                            </span>
                                        )}
                                        <span className="text-2xs text-ink-muted font-semibold block mt-0.5">
                                            {formatDate(item.date)}
                                        </span>
                                    </div>
                                </div>

                                {/* Row 2: Category badge + payment method badge */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-3xs font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded border border-rose-200/30">
                                        {item.category || 'Uncategorized'}
                                    </span>
                                    {item.payment_method && (
                                        <span className="text-3xs font-bold uppercase bg-sunken text-ink-secondary dark:bg-surface dark:text-ink-muted px-2 py-0.5 rounded border border-line dark:border-line">
                                            {item.payment_method}
                                        </span>
                                    )}
                                </div>

                                {/* Row 3: Amount + Tax (Left) | Actions (Right) */}
                                <div className="flex items-center justify-between border-t border-line pt-2 mt-1">
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <span className="text-3xs text-ink-muted font-bold uppercase block tracking-wider">Amount</span>
                                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                                {formatCurrency(parseFloat(item.amount) + (parseFloat(item.tax_amount) || 0))}
                                            </span>
                                        </div>
                                        {parseFloat(item.tax_amount) > 0 && (
                                            <div>
                                                <span className="text-3xs text-ink-muted font-bold uppercase block tracking-wider">Tax</span>
                                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                                    {formatCurrency(item.tax_amount)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(item.id)}
                                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-ink-muted hover:text-rose-600 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Mobile infinite scroll observer */}
                    <div ref={observerTarget} className="py-4 text-center text-ink-muted text-sm">
                        {nextPageUrl ? 'Loading more...' : ''}
                    </div>
                </div>
            </div>

            {/* -- Modern Pro Expense Modal -- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-drawer flex items-end sm:items-center justify-center p-0 sm:p-6" style={{ backdropFilter: 'blur(16px)', backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
                    <div className="relative w-full max-w-[95vw] 2xl:max-w-[1500px] h-full sm:h-auto sm:max-h-[96vh] bg-app rounded-none sm:rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border border-line animate-in fade-in zoom-in-95 duration-slower">

                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                        {/* -- Header -- */}
                        <div className="relative z-10 px-4 sm:px-8 py-4 sm:py-6 border-b border-line flex items-center justify-between bg-surface backdrop-blur-xl">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-violet-800 flex items-center justify-center shadow-xl transform transition-transform hover:rotate-3 duration-slow">
                                    <Receipt size={28} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-ink tracking-tight">
                                        {editingExpense ? 'Refine Record' : 'Record New Expense'}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-3xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active V3 Sync</span>
                                        </div>
                                        <p className="text-3xs font-bold text-ink-muted uppercase tracking-widest opacity-80">Verified Ledger Entry</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {grandTotalValue > 0 && (
                                    <div className="hidden lg:block text-right px-6 py-2.5 rounded-2xl bg-brand-50/50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/50 shadow-inner">
                                        <p className="text-3xs font-bold text-brand-400 uppercase tracking-widest leading-none mb-1.5">Grand Total Impact</p>
                                        <p className="text-2xl font-bold text-brand-600 dark:text-brand-400 tracking-tight">
                                            {formatCurrency(grandTotalValue)}
                                        </p>
                                    </div>
                                )}
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl text-ink-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-900 group"
                                >
                                    <X size={24} className="transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* -- Body -- */}
                        <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-8 custom-scrollbar">
                            {errors && Object.keys(errors).length > 0 && (
                                <div className="mb-6 p-6 rounded-xl bg-rose-500/10 border-2 border-rose-500/20 dark:bg-rose-950/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 animate-in slide-in-from-top-4 duration-slow">
                                    <div className="flex items-center gap-3 mb-3">
                                        <AlertTriangle size={24} className="shrink-0 text-rose-500" />
                                        <h4 className="text-base font-bold uppercase tracking-wider">Please correct the following:</h4>
                                    </div>
                                    <ul className="list-disc pl-5 space-y-1 text-sm font-bold">
                                        {Object.entries(errors).map(([field, messages]) => {
                                            const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                            const msg = Array.isArray(messages) ? messages[0] : messages;
                                            return (
                                                <li key={field} className="tracking-tight">
                                                    <span className="capitalize">{fieldLabel}</span>: {msg}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                            <form encType="multipart/form-data">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">

                                    {/* Primary Logistics */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-surface shadow-md border border-line flex items-center justify-center text-brand-600 dark:text-brand-400">
                                                <Layers size={20} />
                                            </div>
                                            <h3 className="text-xs font-bold text-ink uppercase tracking-widest">Basic Details</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <div id="tour-expense-category" className="group">
                                                <label className="block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1 group-focus-within:text-brand-500 transition-colors">Expense Category <span className="text-rose-500">*</span></label>
                                                {isCreatingCategory && isModalOpen ? (
                                                    <div className="flex items-center gap-2 animate-in zoom-in-95 duration-normal">
                                                        <div className="relative flex-1">
                                                            <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                                                            <input
                                                                id="tour-new-expense-category-name"
                                                                autoFocus
                                                                type="text"
                                                                value={newCategoryName}
                                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleCreateCategory();
                                                                    if (e.key === 'Escape') setIsCreatingCategory(false);
                                                                }}
                                                                placeholder="New Category Name..."
                                                                className="w-full h-12 pl-9 pr-4 rounded-xl text-sm font-bold bg-surface border border-brand-500 text-ink focus:ring-4 focus:ring-brand-500/10 outline-none transition-all shadow-sm"
                                                            />
                                                        </div>
                                                        <button type="button" onClick={() => handleCreateCategory()} className="w-12 h-12 flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 active:scale-95 transition-all"><Check size={18} /></button>
                                                        <button type="button" onClick={() => setIsCreatingCategory(false)} className="w-12 h-12 flex items-center justify-center bg-surface border border-line text-ink-muted rounded-xl hover:text-rose-500 hover:border-rose-500 active:scale-95 transition-all"><X size={18} /></button>
                                                    </div>
                                                ) : (
                                                    <CustomSelect
                                                        value={formData.expense_category_id}
                                                        onChange={(val) => setFormData({ ...formData, expense_category_id: val })}
                                                        placeholder="— Select Category —"
                                                        error={errors.expense_category_id}
                                                        options={categories.map(c => ({ value: c.id, label: c.name }))}
                                                        onAddNew={() => setIsCreatingCategory(true)}
                                                    />
                                                )}
                                                {errors.expense_category_id?.[0] && !isCreatingCategory && <p className="text-rose-500 text-2xs font-bold mt-2 ml-1 flex items-center gap-1"><X size={10} /> {errors.expense_category_id[0]}</p>}
                                            </div>

                                            <div className="group">
                                                <label className="block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1 group-focus-within:text-brand-500 transition-colors">Date of Expense <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="date"
                                                    value={formData.date}
                                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                    className="w-full h-12 px-4 rounded-xl text-sm font-bold bg-surface border border-line text-ink focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none shadow-sm"
                                                />
                                            </div>

                                            <div id="tour-expense-amount" className="group p-6 rounded-xl bg-brand-600 text-white shadow-xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                                <label className="block text-3xs font-bold text-brand-200 uppercase tracking-widest mb-3">Amount (Excl. Tax) <span className="text-white">*</span></label>
                                                <div className="relative flex items-center">
                                                    <span className="text-3xl font-bold text-brand-300/40 mr-3 select-none">{getCurrencySymbol()}</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.amount}
                                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                        placeholder="0.00"
                                                        className="w-full bg-transparent text-4xl font-bold text-white border-none focus:ring-0 placeholder-indigo-400/50 p-0"
                                                    />
                                                </div>
                                                {errors.amount?.[0] && <div className="mt-3 bg-rose-500/30 backdrop-blur-sm border border-rose-500/30 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5"><X size={10} /> <span className="text-3xs font-bold">{errors.amount[0]}</span></div>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial Routing */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-surface shadow-md border border-line flex items-center justify-center text-emerald-500">
                                                <CreditCard size={20} />
                                            </div>
                                            <h3 className="text-xs font-bold text-ink uppercase tracking-widest">Payment & Tax</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1">Payee / Vendor</label>
                                                <PartySearchField
                                                    store={store}
                                                    value={formData.payee}
                                                    selectedParty={selectedParty}
                                                    onSelect={(party) => {
                                                        setSelectedParty(party);
                                                        setFormData(f => ({ ...f, payee: party.name, party_id: party.id }));
                                                    }}
                                                    onClear={() => {
                                                        setSelectedParty(null);
                                                        setFormData(f => ({ ...f, payee: '', party_id: '' }));
                                                    }}
                                                />
                                            </div>

                                            <div className="group">
                                                <label className="block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1">Payment Method</label>
                                                <div className="grid grid-cols-2 gap-3 p-1.5 bg-sunken rounded-2xl border border-line shadow-inner">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, payment_method: 'cash' })}
                                                        className={`h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${formData.payment_method === 'cash' ? 'bg-sunken shadow text-emerald-600 dark:text-emerald-400 border border-line dark:border-line' : 'text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300'}`}
                                                    >
                                                        <DollarSign size={14} /> CASH
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, payment_method: 'bank' })}
                                                        className={`h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${formData.payment_method === 'bank' ? 'bg-sunken shadow text-blue-600 dark:text-blue-400 border border-line dark:border-line' : 'text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300'}`}
                                                    >
                                                        <Monitor size={14} /> BANK
                                                    </button>
                                                </div>
                                            </div>

                                            {formData.payment_method === 'bank' && (
                                                <div className="animate-in fade-in slide-in-from-top-2 duration-slow">
                                                    <label className="block text-2xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-2 ml-1">Bank Account <span className="text-rose-500">*</span></label>
                                                    <CustomSelect
                                                        value={formData.bank_account_id}
                                                        onChange={(val) => setFormData({ ...formData, bank_account_id: val })}
                                                        placeholder="Choose Bank Account"
                                                        error={errors.bank_account_id}
                                                        options={bankAccounts.map(b => ({
                                                            value: b.id,
                                                            label: (
                                                                <div className="flex items-center justify-between gap-2 w-full">
                                                                    <span className="truncate">
                                                                        {b.name || b.bank_name} {b.account_number && <span className="text-ink-muted text-2xs ml-1">({b.account_number})</span>}
                                                                    </span>
                                                                    <span className="text-2xs font-bold text-ink-muted shrink-0">{getCurrencySymbol()} {b.current_balance?.toLocaleString() || 0}</span>
                                                                </div>
                                                            )
                                                        }))}
                                                    />
                                                    {errors.bank_account_id?.[0] && <p className="text-rose-500 text-2xs font-bold mt-2 ml-1"><X size={10} className="inline" /> {errors.bank_account_id[0]}</p>}
                                                </div>
                                            )}

                                            {formData.payment_method === 'cash' && (
                                                <div className="animate-in fade-in slide-in-from-top-2 duration-slow">
                                                    <label className="block text-2xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-2 ml-1">Current Liquidity</label>
                                                    <div className="flex items-center justify-between h-12 px-4 rounded-xl bg-surface border border-line shadow-sm">
                                                        <span className="text-sm font-bold text-ink-secondary">Cash in Hand</span>
                                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{getCurrencySymbol()} {cashBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="group">
                                                <label className="block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1">Tax Amount</label>
                                                <div className="relative flex items-center">
                                                    <span className="absolute left-4 text-ink-muted font-bold text-xs">{getCurrencySymbol()}</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.tax_amount}
                                                        onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                                                        placeholder="0.00"
                                                        className="w-full h-12 pl-12 px-4 rounded-xl text-sm font-bold bg-surface border border-line text-ink focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Context & Proof */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-surface shadow-md border border-line flex items-center justify-center text-sky-500">
                                                <FileText size={20} />
                                            </div>
                                            <h3 className="text-xs font-bold text-ink uppercase tracking-widest">Context & Proof</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1">Reference No.</label>
                                                <input
                                                    type="text"
                                                    value={formData.reference}
                                                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                                    placeholder="Receipt # or Bill Code"
                                                    className="w-full h-12 px-4 rounded-xl text-sm font-mono bg-surface border border-line text-ink focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none shadow-sm"
                                                />
                                            </div>

                                            <div id="tour-expense-description" className="group">
                                                <label className="block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1">Description <span className="text-rose-500">*</span></label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    placeholder="Specify the operational purpose..."
                                                    rows={3}
                                                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium bg-surface border ${errors.description ? 'border-rose-500' : 'border-line'} text-ink focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none resize-none placeholder-slate-400 dark:placeholder-slate-500 shadow-sm`}
                                                />
                                                {errors.description?.[0] && <p className="text-rose-500 text-2xs font-bold mt-2 ml-1"><X size={10} className="inline" /> {errors.description[0]}</p>}
                                            </div>

                                            <div className="group">
                                                <label className="block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 ml-1">Physical Evidence</label>
                                                <label
                                                    className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all p-6 text-center cursor-pointer ${formData.attachment ? 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-400 shadow-sm' : 'bg-app border-line hover:border-brand-400 dark:hover:border-brand-500'}`}
                                                >
                                                    <input type="file" className="sr-only" onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] })} accept="image/*,.pdf" />
                                                    {formData.attachment ? (
                                                        <>
                                                            <div className="w-14 h-14 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg animate-in zoom-in-75 duration-slow">
                                                                <Check size={28} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-bold text-brand-600 dark:text-brand-400 truncate max-w-[200px] px-2">{formData.attachment.name}</p>
                                                                <p className="text-3xs text-ink-muted font-bold uppercase tracking-widest">Captured Successfully</p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-14 h-14 rounded-xl bg-surface border border-line flex items-center justify-center text-ink-muted shadow-sm transition-transform duration-slow">
                                                                <Upload size={24} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-bold text-ink-secondary group-hover:text-brand-500 transition-colors uppercase tracking-widest">SECURE RECEIPT</p>
                                                                <p className="text-3xs text-ink-muted font-bold uppercase tracking-widest">PDF or Image Transfer</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </form>
                        </div>

                        {/* -- Footer -- */}
                        <div className="relative z-20 px-4 sm:px-8 py-4 sm:py-6 border-t border-line bg-app flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col">
                                    <p className="text-3xs font-bold text-ink-muted uppercase tracking-widest leading-none mb-2">Total Payable</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-bold text-ink tracking-tight">
                                            {formatCurrency(grandTotalValue)}
                                        </p>
                                        <span className="text-2xs font-bold text-rose-500 uppercase tracking-widest px-1.5 py-0.5 bg-rose-500/10 rounded-md border border-rose-500/20">OUT</span>
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-sunken dark:bg-surface hidden md:block" />
                                <div className="hidden md:flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${formData.payment_method === 'cash' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
                                        <p className="text-2xs font-bold text-ink-muted uppercase tracking-widest">
                                            {formData.payment_method === 'cash' ? 'Direct Liquidity Reduction' : 'Bank Reconciliation Pending'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface border border-line">
                                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                                        <p className="text-3xs text-ink-muted font-bold uppercase tracking-widest">Automatic V3 Ledger Sync</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 sm:flex-none px-6 h-12 rounded-xl text-xs font-bold text-ink-muted hover:text-ink dark:hover:text-neutral-200 transition-all uppercase tracking-widest border border-transparent hover:border-line dark:hover:border-line-strong"
                                >
                                    Cancel
                                </button>
                                <button
                                    id="tour-expense-submit"
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-1 sm:flex-none px-10 h-12 rounded-xl bg-brand-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-700 hover:shadow-lg hover: active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>Saving...</span>
                                        </div>
                                    ) : (
                                        <span>{editingExpense ? 'Update Record' : 'Save Record'}</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Expense"
                message="Are you sure you want to delete this expense record? This action cannot be undone."
                confirmLabel="Delete Expense"
                isDangerous={true}
            />
            <ExpenseTourGuide store={store} categories={categories} />
        </OneGlanceLayout>
    );
}

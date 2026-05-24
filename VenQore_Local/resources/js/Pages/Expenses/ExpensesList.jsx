import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import FormModal, { FormField, FormInput, FormSelect, FormTextarea, PrimaryButton, SecondaryButton } from '@/Components/FormModal';
import ConfirmModal from '@/Components/ConfirmModal';
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
    Monitor
} from 'lucide-react';
import axios from 'axios';

// ── Party Search Field (same component as Payments In/Out) ──────────────────
const AC_OFF = 'payee-search-' + Math.random().toString(36).slice(2);

function PartySearchField({ value, selectedParty, onSelect, onClear }) {
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
            <div className={`flex items-center gap-4 px-6 h-16 rounded-2xl border transition-all focus-within:ring-[6px] focus-within:ring-indigo-500/10 shadow-sm ${selectedParty ? 'border-emerald-500/60 bg-white dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 bg-white dark:bg-slate-800'}
                }`}>
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                    type="text" name={AC_OFF} value={query}
                    onChange={handleInput} onFocus={handleFocus}
                    placeholder="Search party name or phone..."
                    autoComplete="new-password"
                    className="flex-1 bg-transparent border-none outline-none text-base font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:ring-0"
                    style={{ boxShadow: 'none' }}
                />
                {searching && <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-emerald-400 rounded-full animate-spin shrink-0" />}
                {(query || selectedParty) && !searching && (
                    <button type="button" onClick={handleClear} className="text-slate-500 hover:text-white transition shrink-0"><X size={13} /></button>
                )}
            </div>

            {selectedParty && (
                <div className="mt-1.5 flex items-center gap-2 px-1">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center"><User size={9} className="text-emerald-400" /></div>
                    <span className="text-xs font-semibold text-emerald-400">{selectedParty.name}</span>
                    {selectedParty.type && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-white/10 text-slate-400">{selectedParty.type}</span>}
                </div>
            )}

            {open && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 shadow-2xl z-[60] max-h-52 overflow-auto" style={{ background: '#1e293b' }}>
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
                                    <p className="text-[10px] text-slate-400 truncate">{party.phone || party.email || party.type}</p>
                                </div>
                                {!settled && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${isReceive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                                        {isReceive ? 'To Receive' : 'To Pay'}: Rs {Math.abs(bal).toLocaleString()}
                                    </span>
                                )}
                                {settled && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 bg-white/10 text-slate-400">Settled</span>}
                            </button>
                        );
                    })}
                </div>
            )}

            {open && results.length === 0 && !searching && query && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 shadow-xl z-[60] px-4 py-4 text-center text-sm text-slate-500" style={{ background: '#1e293b' }}>
                    No results for "{query}"
                </div>
            )}
        </div>
    );
}

// ── Custom Select (Dark Theme) ──────────────────────────────────────────────
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
                className={`w-full h-16 px-6 rounded-2xl text-base font-bold flex justify-between items-center border transition-all shadow-sm outline-none cursor-pointer bg-white dark:bg-slate-800 ${open ? 'border-indigo-500 ring-[6px] ring-indigo-500/10' :
                    error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
            >
                <span className={selected ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl border border-white/10 z-[60] py-1 max-h-52 overflow-auto hide-scrollbar" style={{ background: '#1e293b' }}>
                    <button
                        type="button"
                        onClick={() => { onChange(''); setOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:bg-white/5 transition-colors"
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
                                    ? 'border-indigo-500 bg-indigo-500/10 text-white font-bold'
                                    : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}

                    {/* Add New Option */}
                    {onAddNew && (
                        <button
                            type="button"
                            onClick={() => { setOpen(false); onAddNew(); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-indigo-400 font-bold hover:bg-indigo-500/10 transition-colors flex items-center gap-2 border-t border-white/5 mt-1"
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

    // Formatters
    const formatCurrency = (val) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(Math.abs(val || 0));
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
            date: expense.date || new Date().toISOString().split('T')[0],
            expense_category_id: expense.expense_category_id || '',
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
            const res = await axios.post('/expenses/category', { name: nameToUse });

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
            router.reload({ only: ['expenses', 'stats'] });
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

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <MoneyModuleTabs activeTab="expenses" />

                {/* Stats Cards - Compact Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                <TrendingDown size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Today's Expenses</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(stats.today)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <Calendar size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">This Week</p>
                        </div>
                        <p className="text-base font-black text-amber-600">{formatCurrency(stats.week)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                <Wallet size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">This Month</p>
                        </div>
                        <p className="text-base font-black text-purple-600">{formatCurrency(stats.month)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                                <Receipt size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Expenses</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(stats.total)}</p>
                    </div>
                </div>

                {/* Category Bar Row - Integrated below stats */}
                <div
                    ref={scrollContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    className="bg-white dark:bg-slate-900 px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 flex items-center gap-2 overflow-x-auto custom-scrollbar cursor-grab active:cursor-grabbing select-none"
                >
                    <div className="flex items-center gap-2 shrink-0">
                        <Layers size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase mr-2">Categories:</span>
                    </div>

                    {/* Add Category Section */}
                    {isCreatingCategory && !isModalOpen ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 relative z-[10]">
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
                                className="w-56 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-indigo-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all shadow-sm"
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
                                    className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 shadow-sm active:scale-95 transition-all"
                                    title="Cancel (Esc)"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreatingCategory(true)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all whitespace-nowrap flex items-center gap-1"
                        >
                            <Plus size={12} /> Add Category
                        </button>
                    )}

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 shrink-0"></div>

                    <button
                        onClick={() => handleCategoryChange('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeCategory === 'all' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        All Categories
                    </button>

                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${String(activeCategory) === String(cat.id) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'}`}
                        >
                            <span>{cat.name}</span>
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                            <div className="w-64 relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleServerSearch}
                                    placeholder="Search expenses..."
                                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>

                            <div className="flex bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                                <button onClick={() => handleFilterChange('all')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${activeFilter === 'all' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}>All Time</button>
                                <button onClick={() => handleFilterChange('today')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${activeFilter === 'today' ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}>Today</button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20 active:scale-95 font-bold text-sm"
                            >
                                <Plus size={16} />
                                Record Expense
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th onClick={() => handleSort('date')} className="p-4 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors w-[12%]">
                                        <div className="flex items-center gap-1">Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div>
                                    </th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase w-[15%]">Category</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase w-[25%]">Description & Payee</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase w-[12%]">Payment</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase w-[10%]">Ref</th>
                                    <th onClick={() => handleSort('amount')} className="p-4 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-right w-[15%]">
                                        <div className="flex items-center justify-end gap-1">Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div>
                                    </th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right w-[11%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                {sortedExpenses.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-slate-400">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Layers size={32} className="text-slate-300" />
                                            </div>
                                            <p className="font-bold text-slate-600 dark:text-slate-300">No expenses found</p>
                                            <p className="text-sm opacity-70">Try adjusting filters or record a new expense.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedExpenses.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors">
                                            <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300 tabular-nums">{formatDate(item.date)}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${item.category_color ? `bg-${item.category_color}-50 text-${item.category_color}-600 border-${item.category_color}-200` : 'bg-slate-100 text-slate-600 border-slate-200'} `}>
                                                    {item.category || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{item.description || 'No description'}</span>
                                                    {item.payee && <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1"><Search size={10} /> {item.payee}</span>}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${item.payment_method === 'cash' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                                                    <span className="uppercase text-xs font-bold text-slate-600 dark:text-slate-400">{item.payment_method}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs font-mono text-slate-500">{item.reference || '-'}</td>
                                            <td className="p-4 text-right">
                                                <span className="font-black text-rose-600 text-sm tabular-nums">{formatCurrency(parseFloat(item.amount) + (parseFloat(item.tax_amount) || 0))}</span>
                                                {item.tax_amount > 0 && <p className="text-[9px] text-slate-400">(Inc. Tax: {item.tax_amount})</p>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 rounded transition-colors" title="Edit">
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
                        <div ref={observerTarget} className="mt-4 p-4 text-center text-slate-400 text-sm opacity-0 h-4">
                            {nextPageUrl ? 'Loading...' : ''}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modern Pro Expense Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ backdropFilter: 'blur(16px)', backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
                    <div className="relative w-full max-w-[95vw] 2xl:max-w-[1500px] bg-slate-50 dark:bg-slate-900 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500" style={{ maxHeight: '96vh' }}>

                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                        {/* ── Header ── */}
                        <div className="relative z-10 px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/90 backdrop-blur-xl">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex items-center justify-center shadow-xl shadow-indigo-500/30 transform transition-transform hover:rotate-3 duration-300">
                                    <Receipt size={28} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {editingExpense ? 'Refine Record' : 'Record New Expense'}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active V3 Sync</span>
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-80">Verified Ledger Entry</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {grandTotal > 0 && (
                                    <div className="hidden lg:block text-right px-6 py-2.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 shadow-inner">
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1.5">Grand Total Impact</p>
                                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                                            {formatCurrency(grandTotal)}
                                        </p>
                                    </div>
                                )}
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-900 group"
                                >
                                    <X size={24} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* ── Body ── */}
                        <div className="relative z-10 flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                            <form encType="multipart/form-data">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">

                                    {/* Primary Logistics */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                <Layers size={20} />
                                            </div>
                                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Basic Details</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-500 transition-colors">Expense Category <span className="text-rose-500">*</span></label>
                                                {isCreatingCategory && isModalOpen ? (
                                                    <div className="flex items-center gap-2 animate-in zoom-in-95 duration-200">
                                                        <div className="relative flex-1">
                                                            <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                value={newCategoryName}
                                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleCreateCategory();
                                                                    if (e.key === 'Escape') setIsCreatingCategory(false);
                                                                }}
                                                                placeholder="New Category Name..."
                                                                className="w-full h-12 pl-9 pr-4 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-indigo-500 text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                                                            />
                                                        </div>
                                                        <button type="button" onClick={() => handleCreateCategory()} className="w-12 h-12 flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 active:scale-95 transition-all"><Check size={18} /></button>
                                                        <button type="button" onClick={() => setIsCreatingCategory(false)} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl hover:text-rose-500 hover:border-rose-500 active:scale-95 transition-all"><X size={18} /></button>
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
                                                {errors.expense_category_id?.[0] && !isCreatingCategory && <p className="text-rose-500 text-[10px] font-bold mt-2 ml-1 flex items-center gap-1"><X size={10} /> {errors.expense_category_id[0]}</p>}
                                            </div>

                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-500 transition-colors">Date of Expense <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="date"
                                                    value={formData.date}
                                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                    className="w-full h-12 px-4 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none shadow-sm"
                                                />
                                            </div>

                                            <div className="group p-6 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                                <label className="block text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-3">Amount (Excl. Tax) <span className="text-white">*</span></label>
                                                <div className="relative flex items-center">
                                                    <span className="text-3xl font-black text-indigo-300/40 mr-3 select-none">Rs</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.amount}
                                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                        placeholder="0.00"
                                                        className="w-full bg-transparent text-4xl font-black text-white border-none focus:ring-0 placeholder-indigo-400/50 p-0"
                                                    />
                                                </div>
                                                {errors.amount?.[0] && <div className="mt-3 bg-rose-500/30 backdrop-blur-sm border border-rose-500/30 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5"><X size={10} /> <span className="text-[9px] font-bold">{errors.amount[0]}</span></div>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial Routing */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-500">
                                                <CreditCard size={20} />
                                            </div>
                                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Payment & Tax</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Payee / Vendor</label>
                                                <PartySearchField
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
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Payment Method</label>
                                                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, payment_method: 'cash' })}
                                                        className={`h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${formData.payment_method === 'cash' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                                    >
                                                        <DollarSign size={14} /> CASH
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, payment_method: 'bank' })}
                                                        className={`h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${formData.payment_method === 'bank' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                                    >
                                                        <Monitor size={14} /> BANK
                                                    </button>
                                                </div>
                                            </div>

                                            {formData.payment_method === 'bank' && (
                                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <label className="block text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-2 ml-1">Bank Account <span className="text-rose-500">*</span></label>
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
                                                                        {b.name || b.bank_name} {b.account_number && <span className="text-slate-500 text-[10px] ml-1">({b.account_number})</span>}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-slate-400 shrink-0">Rs {b.current_balance?.toLocaleString() || 0}</span>
                                                                </div>
                                                            )
                                                        }))}
                                                    />
                                                    {errors.bank_account_id?.[0] && <p className="text-rose-500 text-[10px] font-bold mt-2 ml-1"><X size={10} className="inline" /> {errors.bank_account_id[0]}</p>}
                                                </div>
                                            )}

                                            {formData.payment_method === 'cash' && (
                                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <label className="block text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-2 ml-1">Current Liquidity</label>
                                                    <div className="flex items-center justify-between h-12 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Cash in Hand</span>
                                                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">Rs {cashBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Tax Amount</label>
                                                <div className="relative flex items-center">
                                                    <span className="absolute left-4 text-slate-400 dark:text-slate-500 font-bold text-xs">PKR</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.tax_amount}
                                                        onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                                                        placeholder="0.00"
                                                        className="w-full h-12 pl-12 px-4 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Context & Proof */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sky-500">
                                                <FileText size={20} />
                                            </div>
                                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Context & Proof</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Reference No.</label>
                                                <input
                                                    type="text"
                                                    value={formData.reference}
                                                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                                    placeholder="Receipt # or Bill Code"
                                                    className="w-full h-12 px-4 rounded-xl text-sm font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none shadow-sm"
                                                />
                                            </div>

                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Description <span className="text-rose-500">*</span></label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    placeholder="Specify the operational purpose..."
                                                    rows={3}
                                                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border ${errors.description ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none placeholder-slate-400 dark:placeholder-slate-500 shadow-sm`}
                                                />
                                                {errors.description?.[0] && <p className="text-rose-500 text-[10px] font-bold mt-2 ml-1"><X size={10} className="inline" /> {errors.description[0]}</p>}
                                            </div>

                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Physical Evidence</label>
                                                <label
                                                    className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all p-6 text-center cursor-pointer ${formData.attachment ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-400 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'}`}
                                                >
                                                    <input type="file" className="sr-only" onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] })} accept="image/*,.pdf" />
                                                    {formData.attachment ? (
                                                        <>
                                                            <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg animate-in zoom-in-75 duration-300">
                                                                <Check size={28} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[200px] px-2">{formData.attachment.name}</p>
                                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Captured Successfully</p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                                                <Upload size={24} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors uppercase tracking-widest">SECURE RECEIPT</p>
                                                                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">PDF or Image Transfer</p>
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

                        {/* ── Footer ── */}
                        <div className="relative z-20 px-8 py-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Total Payable</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                            {formatCurrency(grandTotal)}
                                        </p>
                                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest px-1.5 py-0.5 bg-rose-500/10 rounded-md border border-rose-500/20">OUT</span>
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
                                <div className="hidden md:flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${formData.payment_method === 'cash' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                            {formData.payment_method === 'cash' ? 'Direct Liquidity Reduction' : 'Bank Reconciliation Pending'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Automatic V3 Ledger Sync</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 sm:flex-none px-6 h-12 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all uppercase tracking-widest border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-1 sm:flex-none px-10 h-12 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
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
        </OneGlanceLayout>
    );
}

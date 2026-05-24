import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StockModuleTabs from '@/Components/StockModuleTabs';
import FormModal, { FormField, FormInput, FormTextarea, PrimaryButton, SecondaryButton } from '@/Components/FormModal';
import axios from 'axios';
import {
    Tag,
    Plus,
    FolderTree,
    Layers,
    Box,
    BarChart3,
    MoreVertical,
    Edit,
    Trash2,
    CheckSquare,
    ChevronUp,
    ChevronDown,
    X,
    Search
} from 'lucide-react';

export default function Categories({ categories: serverCategories = [], stats, filters }) {
    const { flash, store } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', parent_id: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');

    // Infinite Scroll State
    const [allCategories, setAllCategories] = useState(serverCategories.data || []);
    const [nextPageUrl, setNextPageUrl] = useState(serverCategories.next_page_url);
    const isLoading = useRef(false);
    const observerTarget = useRef(null);

    // Sync state
    useEffect(() => {
        if (serverCategories.data && serverCategories.current_page === 1) {
            setAllCategories(serverCategories.data);
            setNextPageUrl(serverCategories.next_page_url);
        }
    }, [serverCategories]);

    // Fetch Next Page
    const fetchNextPage = useCallback(async () => {
        if (!nextPageUrl || isLoading.current) return;
        isLoading.current = true;
        try {
            const response = await axios.get(nextPageUrl, { headers: { 'Accept': 'application/json' } });
            const newItems = response.data.data;
            setAllCategories(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNew = newItems.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNew];
            });
            setNextPageUrl(response.data.next_page_url);
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

    const [selectedCategories, setSelectedCategories] = useState([]);

    // UI State
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [draggedColumn, setDraggedColumn] = useState(null);

    // Columns Configuration
    const [tableColumns, setTableColumns] = useState([
        { key: 'name', label: 'Category Name', width: '30%' },
        { key: 'description', label: 'Description', width: '30%' },
        { key: 'products_count', label: 'Products', width: '15%' },
        { key: 'created_at', label: 'Created', width: '15%' },
        { key: 'actions', label: 'Actions', width: '10%' }
    ]);

    // Click Outside Handler
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (activeActionMenu && !e.target.closest('.action-menu-container')) {
                setActiveActionMenu(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeActionMenu]);

    // Helper to resolve values for sorting
    function resolveValue(item, key) {
        if (!item) return '';
        const val = item[key];
        return val ? String(val).toLowerCase() : '';
    }

    // Memoized Sorted Data
    const sortedCategories = useMemo(() => {
        const data = Array.isArray(allCategories) ? allCategories : [];
        return [...data].sort((a, b) => {
            const direction = sortConfig.direction === 'asc' ? 1 : -1;
            const valA = resolveValue(a, sortConfig.key);
            const valB = resolveValue(b, sortConfig.key);
            if (valA < valB) return -1 * direction;
            if (valA > valB) return 1 * direction;
            return 0;
        });
    }, [allCategories, sortConfig]);

    // Search Handler
    const handleServerSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('store.categories.index', { store_slug: store?.slug }), {
                search: searchTerm,
            }, { preserveState: true, preserveScroll: true });
        }
    };

    // Sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // Selection
    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedCategories(sortedCategories.map(c => c.id));
        else setSelectedCategories([]);
    };

    const handleSelectRow = (id) => {
        if (selectedCategories.includes(id)) setSelectedCategories(selectedCategories.filter(i => i !== id));
        else setSelectedCategories([...selectedCategories, id]);
    };

    // Bulk Delete
    const handleBulkDelete = () => {
        if (!confirm(`Delete ${selectedCategories.length} categories? Products will be uncategorized.`)) return;
        alert("Bulk delete not yet configured for categories.");
    };

    // CRUD Handlers
    const handleCreate = () => {
        setEditingCategory(null);
        setFormData({ name: '', description: '', parent_id: '' });
        setErrors({});
        setIsModalOpen(true);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name || '',
            description: category.description || '',
            parent_id: category.parent_id || ''
        });
        setErrors({});
        setIsModalOpen(true);
        setActiveActionMenu(null);
    };

    const handleDelete = async (category) => {
        if (!confirm(`Delete "${category.name}"?`)) return;
        try {
            await axios.delete(route('store.categories.destroy', { store_slug: store?.slug, category: category.id }));
            const remaining = allCategories.filter(c => c.id !== category.id);
            setAllCategories(remaining);
            router.reload({ only: ['categories', 'stats'] });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete category');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            if (editingCategory) {
                await axios.put(route('store.categories.update', { store_slug: store?.slug, category: editingCategory.id }), formData);
            } else {
                await axios.post(route('store.categories.store', { store_slug: store?.slug }), formData);
            }
            setIsModalOpen(false);
            router.reload({ only: ['categories', 'stats'] });
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

    // Drag & Drop Columns
    const handleDragStart = (e, index) => setDraggedColumn(index);
    const handleDragOver = (e, index) => e.preventDefault();
    const handleDrop = (e, dropIndex) => {
        if (draggedColumn === null) return;
        const newCols = [...tableColumns];
        const draggedItem = newCols[draggedColumn];
        newCols.splice(draggedColumn, 1);
        newCols.splice(dropIndex, 0, draggedItem);
        setTableColumns(newCols);
        setDraggedColumn(null);
    };

    const parentOptions = allCategories.filter(c => !editingCategory || c.id !== editingCategory.id);

    return (
        <OneGlanceLayout title="Categories" activeMenu="Stock">
            <Head title="Categories" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden relative">



                <StockModuleTabs activeTab="categories" />

                {/* Compact Stats Cards (Matches SalesHistory) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Layers size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Categories</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{stats?.total_categories || 0}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <FolderTree size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Main Categories</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{stats?.parent_categories || 0}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <Box size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Products Linked</p>
                        </div>
                        <p className="text-base font-black text-emerald-600">{stats?.total_products || 0}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
                                <BarChart3 size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-500 uppercase truncate">Top Category</p>
                            </div>
                        </div>
                        <p className="text-sm font-black text-purple-600 truncate max-w-[50%]" title={stats?.most_populated?.name}>
                            {stats?.most_populated?.name || '-'}
                        </p>
                    </div>
                </div>

                {/* Header Actions (Matches SalesHistory Header) */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Product <span className="text-indigo-600">Categories (Updated)</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <span className="text-[10px] font-bold uppercase rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1">
                            List View
                        </span>
                    </div>

                    {/* Right: Search + Button */}
                    <div className="flex items-center gap-2">
                        <div className="w-64 relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleServerSearch}
                                placeholder="Search categories..."
                                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <button
                                onClick={handleCreate}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm shadow-indigo-500/20"
                            >
                                <Plus size={14} /> Add New
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedCategories.length > 0 && (
                    <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
                        <span className="font-bold text-sm">{selectedCategories.length} Selected</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBulkDelete}
                                className="px-3 py-1 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1"
                            >
                                <Trash2 size={14} /> Delete Selected
                            </button>
                            <button
                                onClick={() => setSelectedCategories([])}
                                className="p-1 hover:bg-indigo-700 rounded transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Custom Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                        checked={selectedCategories.length === sortedCategories.length && sortedCategories.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                {tableColumns.map((col, index) => (
                                    <th
                                        key={col.key}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onClick={() => col.key !== 'actions' && handleSort(col.key)}
                                        className={`
                                            p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider 
                                            cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                                            ${draggedColumn === index ? 'opacity-50 border-2 border-dashed border-indigo-500' : ''}
                                        `}
                                        style={{ width: col.width }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.label}
                                            {col.key !== 'actions' && sortConfig.key === col.key && (
                                                sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-indigo-500" /> : <ChevronDown size={14} className="text-indigo-500" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sortedCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={tableColumns.length + 1} className="p-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                <Tag size={32} className="text-slate-400" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">No categories found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedCategories.map((row) => (
                                    <tr
                                        key={row.id}
                                        className={`
                                            hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer
                                            ${selectedCategories.includes(row.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                                        `}
                                    >
                                        <td className="p-4 w-10" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={selectedCategories.includes(row.id)}
                                                onChange={() => handleSelectRow(row.id)}
                                            />
                                        </td>
                                        {tableColumns.map((col) => (
                                            <td key={`${row.id}-${col.key}`} className="p-4 text-sm text-slate-700 dark:text-slate-300">
                                                {(() => {
                                                    switch (col.key) {
                                                        case 'name':
                                                            return (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                                                        <Tag size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-slate-800 dark:text-white">{row.name}</p>
                                                                        {row.parent && (
                                                                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                                                <FolderTree size={10} /> {row.parent.name}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        case 'description':
                                                            return <span className="text-slate-500 truncate max-w-xs block">{row.description || '-'}</span>;
                                                        case 'products_count':
                                                            return (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300">
                                                                    {row.products_count || 0}
                                                                </span>
                                                            );
                                                        case 'created_at':
                                                            return <span className="text-slate-500 text-xs">{new Date(row.created_at).toLocaleDateString()}</span>;
                                                        case 'actions':
                                                            return (
                                                                <div className="relative action-menu-container">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActiveActionMenu(activeActionMenu === row.id ? null : row.id);
                                                                        }}
                                                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                                                    >
                                                                        <MoreVertical size={16} />
                                                                    </button>

                                                                    {activeActionMenu === row.id && (
                                                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 animate-in zoom-in-95 p-1">
                                                                            <button
                                                                                onClick={() => handleEdit(row)}
                                                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                                                                            >
                                                                                <Edit size={14} /> Edit Category
                                                                            </button>
                                                                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setActiveActionMenu(null);
                                                                                    handleDelete(row);
                                                                                }}
                                                                                className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 text-sm text-red-600"
                                                                            >
                                                                                <Trash2 size={14} /> Delete
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        default:
                                                            return row[col.key];
                                                    }
                                                })()}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Infinite Scroll Sentinel */}
                    <div ref={observerTarget} className="p-4 text-center text-slate-400 text-sm border-t border-slate-100 dark:border-slate-800 opacity-0">
                        {nextPageUrl ? 'Loading...' : (sortedCategories.length > 0 ? 'End of list' : '')}
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <FormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCategory ? 'Edit Category' : 'Create Category'}
                subtitle={editingCategory ? 'Update category details' : 'Add a new product category'}
                footer={
                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton onClick={handleSubmit} loading={loading}>
                            {editingCategory ? 'Update' : 'Create'}
                        </PrimaryButton>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField label="Category Name" required error={errors.name?.[0]}>
                        <FormInput
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Electronics, Clothing"
                            error={errors.name}
                        />
                    </FormField>

                    <FormField label="Parent Category" hint="Leave empty for top-level category">
                        <select
                            value={formData.parent_id}
                            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500/20"
                        >
                            <option value="">None (Top Level)</option>
                            {parentOptions.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Description" error={errors.description?.[0]}>
                        <FormTextarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Optional description for this category"
                            rows={3}
                        />
                    </FormField>
                </form>
            </FormModal>
        </OneGlanceLayout>
    );
}

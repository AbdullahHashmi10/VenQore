import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePage, Head, useForm, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PremiumButton from '@/Components/PremiumButton';
import ContactsModuleTabs from '@/Components/ContactsModuleTabs';
import { Truck, Plus, Search, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';

export default function SuppliersIndex({ suppliers }) {
    const { store } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Infinite Scroll State
    const [allSuppliers, setAllSuppliers] = useState(suppliers.data || []);
    const [nextPageUrl, setNextPageUrl] = useState(suppliers.next_page_url);
    const isLoading = useRef(false);
    const observerTarget = useRef(null);

    // Sync state when props change
    useEffect(() => {
        if (suppliers.data && suppliers.current_page === 1) {
            setAllSuppliers(suppliers.data);
            setNextPageUrl(suppliers.next_page_url);
        }
    }, [suppliers]);

    // Fetch Next Page
    const fetchNextPage = useCallback(async () => {
        if (!nextPageUrl || isLoading.current) return;
        isLoading.current = true;
        try {
            const response = await axios.get(nextPageUrl, { headers: { 'Accept': 'application/json' } });
            setAllSuppliers(prev => [...prev, ...response.data.data]);
            setNextPageUrl(response.data.next_page_url);
        } catch (error) {
            console.error("Failed to load more suppliers:", error);
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
            router.get(route('store.suppliers.index', { store_slug: store.slug }), { search: searchTerm }, { preserveState: true, preserveScroll: true });
        }
    };

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        tax_id: '',
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingSupplier) {
            put(route('store.suppliers.update', { store_slug: store.slug, supplier: editingSupplier.id }), {
                onSuccess: () => {
                    closeModal();
                },
            });
        } else {
            post(route('store.suppliers.store', { store_slug: store.slug }), {
                onSuccess: () => {
                    closeModal();
                },
            });
        }
    };

    const openModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setData({
                name: supplier.name,
                contact_person: supplier.contact_person || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
                tax_id: supplier.tax_id || '',
                notes: supplier.notes || '',
            });
        } else {
            setEditingSupplier(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
        reset();
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this supplier?')) {
            router.delete(route('store.suppliers.destroy', { store_slug: store.slug, supplier: id }));
        }
    };



    return (
        <OneGlanceLayout title="Suppliers" activeMenu="Contacts">
            <Head title="Suppliers" />

            <div className="h-full flex flex-col">
                <ContactsModuleTabs activeTab="suppliers" />

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                <Truck size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Suppliers</h2>
                                <p className="text-slate-500 dark:text-slate-400">Manage your vendor relationships.</p>
                            </div>
                        </div>
                        <PremiumButton onClick={() => openModal()}>
                            <Plus size={18} />
                            Add Supplier
                        </PremiumButton>
                    </div>

                    {/* Search */}
                    <div className="mb-6 relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search suppliers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleServerSearch}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                        />
                    </div>

                    {/* List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allSuppliers.map(supplier => (
                            <div key={supplier.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow group">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{supplier.name}</h3>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(supplier)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(supplier.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                                    {supplier.contact_person && (
                                        <div className="flex items-center gap-2">
                                            <Truck size={14} />
                                            <span>{supplier.contact_person}</span>
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail size={14} />
                                            <a href={`mailto:${supplier.email}`} className="hover:text-indigo-500">{supplier.email}</a>
                                        </div>
                                    )}
                                    {supplier.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={14} />
                                            <span>{supplier.phone}</span>
                                        </div>
                                    )}
                                    {supplier.address && (
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} />
                                            <span className="truncate">{supplier.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Infinite Scroll Sentinel */}
                    <div ref={observerTarget} className="p-4 text-center text-slate-400 text-sm opacity-0 h-4">
                        {nextPageUrl ? 'Loading...' : ''}
                    </div>

                    {/* Modal */}
                    {isModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                        {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                                    </h3>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Company Name</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Contact Person</label>
                                            <input
                                                type="text"
                                                value={data.contact_person}
                                                onChange={(e) => setData('contact_person', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                                            <input
                                                type="text"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Address</label>
                                        <textarea
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            rows="2"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none resize-none"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <PremiumButton type="submit" disabled={processing}>
                                            {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                                        </PremiumButton>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}

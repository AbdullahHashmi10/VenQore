import React, { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    Bike, User, Plus, Phone, DollarSign, CheckCircle2,
    XCircle, Clock, MapPin, Search, Filter, Edit3, Trash2,
    AlertCircle, Sparkles, X, Loader2, ArrowRight, ShieldCheck,
    Navigation, ExternalLink,
} from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import RestaurantFeatureGate from '@/Components/Restaurant/RestaurantFeatureGate';
import ConfirmModal from '@/Components/ConfirmModal';
import { formatCurrency } from '@/Utils/format';

export default function RestaurantRiders({
    storeSlug,
    riders: initialRiders = [],
    deliveryEnabled = true,
    preparesOrdersEnabled = true,
}) {
    const [riders, setRiders] = useState(initialRiders);
    const [isDeliveryActive, setIsDeliveryActive] = useState(deliveryEnabled);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive' | 'busy'
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editRider, setEditRider] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        commission_rate: '0.00',
        notes: '',
        status: 'active',
    });

    const resetForm = () => {
        setFormData({
            name: '',
            phone: '',
            commission_rate: '0.00',
            notes: '',
            status: 'active',
        });
        setErrorMsg('');
    };

    const notify = (message, type = 'success') => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('amd:toast', {
                detail: { message, type }
            }));
        }
    };

    // Filtered riders
    const filteredRiders = useMemo(() => {
        return riders.filter(r => {
            const matchesSearch = !search ||
                r.name?.toLowerCase().includes(search.toLowerCase()) ||
                r.phone?.toLowerCase().includes(search.toLowerCase()) ||
                r.notes?.toLowerCase().includes(search.toLowerCase());

            if (!matchesSearch) return false;

            if (statusFilter === 'active') return r.status === 'active';
            if (statusFilter === 'inactive') return r.status === 'inactive';
            if (statusFilter === 'busy') return (r.live_count || 0) > 0;

            return true;
        });
    }, [riders, search, statusFilter]);

    // Live counts
    const metrics = useMemo(() => {
        const total = riders.length;
        const active = riders.filter(r => r.status === 'active').length;
        const onDelivery = riders.filter(r => (r.live_count || 0) > 0).length;
        const totalActiveDeliveries = riders.reduce((acc, r) => acc + (r.live_count || 0), 0);
        return { total, active, onDelivery, totalActiveDeliveries };
    }, [riders]);

    // Open add modal
    const handleOpenAdd = () => {
        resetForm();
        setAddModalOpen(true);
    };

    // Open edit modal
    const handleOpenEdit = (rider) => {
        setEditRider(rider);
        setFormData({
            name: rider.name || '',
            phone: rider.phone || '',
            commission_rate: String(rider.commission_rate ?? '0.00'),
            notes: rider.notes || '',
            status: rider.status || 'active',
        });
        setErrorMsg('');
    };

    // Submit Add Rider
    const handleCreateRider = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setErrorMsg('Rider name is required.');
            return;
        }

        setSaving(true);
        setErrorMsg('');
        try {
            const res = await axios.post(route('store.restaurant.riders.store', { store_slug: storeSlug }), {
                name: formData.name.trim(),
                phone: formData.phone.trim() || null,
                commission_rate: parseFloat(formData.commission_rate) || 0,
                notes: formData.notes.trim() || null,
                status: 'active',
            });

            const newRider = res.data.rider || {
                id: res.data.id || Date.now(),
                name: formData.name.trim(),
                phone: formData.phone.trim() || null,
                commission_rate: parseFloat(formData.commission_rate) || 0,
                notes: formData.notes.trim() || null,
                status: 'active',
                live_count: 0,
            };

            setRiders(prev => [newRider, ...prev]);
            notify('Rider created successfully!');
            setAddModalOpen(false);
            resetForm();
        } catch (err) {
            console.error('Failed to create rider:', err);
            setErrorMsg(err?.response?.data?.message || 'Failed to save rider.');
        } finally {
            setSaving(false);
        }
    };

    // Submit Edit Rider
    const handleUpdateRider = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setErrorMsg('Rider name is required.');
            return;
        }

        setSaving(true);
        setErrorMsg('');
        try {
            await axios.put(route('store.restaurant.riders.update', {
                store_slug: storeSlug,
                id: editRider.id,
            }), {
                name: formData.name.trim(),
                phone: formData.phone.trim() || null,
                commission_rate: parseFloat(formData.commission_rate) || 0,
                notes: formData.notes.trim() || null,
                status: formData.status,
            });

            setRiders(prev => prev.map(r => r.id === editRider.id ? {
                ...r,
                name: formData.name.trim(),
                phone: formData.phone.trim() || null,
                commission_rate: parseFloat(formData.commission_rate) || 0,
                notes: formData.notes.trim() || null,
                status: formData.status,
            } : r));

            notify('Rider updated successfully!');
            setEditRider(null);
            resetForm();
        } catch (err) {
            console.error('Failed to update rider:', err);
            setErrorMsg(err?.response?.data?.message || 'Failed to update rider.');
        } finally {
            setSaving(false);
        }
    };

    // Quick toggle active / inactive
    const handleQuickToggle = async (rider) => {
        const newStatus = rider.status === 'active' ? 'inactive' : 'active';
        try {
            await axios.put(route('store.restaurant.riders.update', {
                store_slug: storeSlug,
                id: rider.id,
            }), {
                name: rider.name,
                status: newStatus,
            });

            setRiders(prev => prev.map(r => r.id === rider.id ? { ...r, status: newStatus } : r));
            notify(`Rider marked as ${newStatus}.`);
        } catch (err) {
            notify('Failed to update status.', 'error');
        }
    };

    // Delete Rider
    const handleDeleteRider = async () => {
        if (!deleteId) return;
        setSaving(true);
        try {
            await axios.delete(route('store.restaurant.riders.destroy', {
                store_slug: storeSlug,
                id: deleteId,
            }));

            setRiders(prev => prev.filter(r => r.id !== deleteId));
            notify('Rider removed from active riders.');
            setDeleteId(null);
        } catch (err) {
            notify('Failed to remove rider.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isDeliveryActive) {
        return (
            <OneGlanceLayout>
                <Head title="Delivery Riders — Feature Disabled" />
                <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-y-2 pb-4 border-b border-line">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
                                <Bike size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
                                    <span>Delivery Riders</span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 font-medium">
                                        Staff Records
                                    </span>
                                </h1>
                                <p className="text-xs sm:text-sm text-ink-muted">
                                    Manage your delivery fleet and drivers. Riders are staff members and do not consume user login seats.
                                </p>
                            </div>
                        </div>
                    </div>
                    <RestaurantFeatureGate
                        storeSlug={storeSlug}
                        title="Delivery Orders & Riders Are Currently Disabled"
                        description="Delivery lane is switched off in restaurant settings. Turn this setting on to start adding riders, tracking active dispatches, and managing driver cashups."
                        settingKey="lane_delivery"
                        turnOnLabel="Turn this setting on"
                        isEnabled={isDeliveryActive}
                        icon={Bike}
                        onToggled={(val) => setIsDeliveryActive(val)}
                        mode="full"
                        badgeText="Delivery Service"
                    />
                </div>
            </OneGlanceLayout>
        );
    }

    return (
        <OneGlanceLayout>
            <Head title="Delivery Riders — Restaurant" />

            <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
                                <Bike size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
                                    <span>Delivery Riders</span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 font-medium">
                                        Staff Records
                                    </span>
                                </h1>
                                <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
                                    Manage your delivery fleet and drivers. Riders are staff members and do not consume user login seats.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href={route('store.restaurant.dispatch', { store_slug: storeSlug })}
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface hover:bg-sunken text-ink-secondary hover:text-ink border border-line text-xs font-semibold transition-all shadow-sm"
                        >
                            <Navigation size={14} className="text-brand-600 dark:text-brand-400" />
                            <span>Dispatch Board</span>
                        </Link>

                        <button
                            type="button"
                            onClick={handleOpenAdd}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                        >
                            <Plus size={16} />
                            <span>Add New Rider</span>
                        </button>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-sm relative overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-y-2 mb-2">
                            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Total Riders</span>
                            <span className="p-2 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"><Bike size={16} /></span>
                        </div>
                        <div className="text-2xl font-bold text-ink">{metrics.total}</div>
                        <p className="text-xs text-ink-muted mt-1">Registered delivery staff</p>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-sm relative overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-y-2 mb-2">
                            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Active On Duty</span>
                            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={16} /></span>
                        </div>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.active}</div>
                        <p className="text-xs text-ink-muted mt-1">Available for new deliveries</p>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-sm relative overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-y-2 mb-2">
                            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Out on Delivery</span>
                            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"><Clock size={16} /></span>
                        </div>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.onDelivery}</div>
                        <p className="text-xs text-ink-muted mt-1">{metrics.totalActiveDeliveries} in transit</p>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-sm relative overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-y-2 mb-2">
                            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Seat Licenses</span>
                            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"><ShieldCheck size={16} /></span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">0 Seats Used</div>
                        <p className="text-xs text-ink-muted mt-1">Unlimited staff riders allowed</p>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface border border-line rounded-2xl">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search rider by name, phone, or vehicle..."
                            className="w-full bg-sunken border border-line rounded-xl pl-9 pr-4 py-2 text-xs text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto">
                        {[
                            { key: 'all', label: 'All Riders' },
                            { key: 'active', label: 'Active' },
                            { key: 'busy', label: 'On Delivery' },
                            { key: 'inactive', label: 'Inactive' },
                        ].map((filter) => (
                            <button
                                key={filter.key}
                                type="button"
                                onClick={() => setStatusFilter(filter.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                                    statusFilter === filter.key
                                        ? 'bg-brand-600 dark:bg-brand-500 text-white shadow-sm'
                                        : 'text-ink-muted hover:text-ink hover:bg-sunken'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Riders List / Table */}
                <div className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden">
                    {filteredRiders.length === 0 ? (
                        <div className="py-16 text-center px-4">
                            <div className="w-14 h-14 rounded-3xl bg-sunken border border-line flex items-center justify-center mx-auto mb-4 text-ink-muted">
                                <Bike size={28} />
                            </div>
                            <h3 className="text-base font-bold text-ink mb-1">
                                {search ? 'No riders matching your search' : 'No delivery riders added yet'}
                            </h3>
                            <p className="text-xs text-ink-muted max-w-sm mx-auto mb-6">
                                {search
                                    ? 'Try checking for typos or clear your search query.'
                                    : 'Add your delivery staff members here. They can then be assigned orders directly from the POS and dispatch board.'}
                            </p>
                            {!search && (
                                <button
                                    type="button"
                                    onClick={handleOpenAdd}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 text-white text-xs font-bold transition-all"
                                >
                                    <Plus size={16} />
                                    <span>Add First Rider</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-line bg-sunken/40 text-ink-muted font-semibold">
                                        <th className="py-3 px-4">Rider</th>
                                        <th className="py-3 px-4">Contact Phone</th>
                                        <th className="py-3 px-4">Commission</th>
                                        <th className="py-3 px-4">Live Status</th>
                                        <th className="py-3 px-4">Duty Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {filteredRiders.map((rider) => {
                                        const initials = rider.name
                                            .split(' ')
                                            .map(p => p[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase();

                                        const hasActiveDeliveries = (rider.live_count || 0) > 0;

                                        return (
                                            <tr key={rider.id} className="hover:bg-sunken/50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 shrink-0">
                                                            {initials || <User size={14} />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-ink text-sm">{rider.name}</div>
                                                            {rider.notes && (
                                                                <div className="text-xs text-ink-muted truncate max-w-xs">{rider.notes}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    {rider.phone ? (
                                                        <a
                                                            href={`tel:${rider.phone}`}
                                                            className="text-xs text-ink hover:text-brand-600 dark:hover:text-brand-400 font-medium inline-flex items-center gap-1.5"
                                                        >
                                                            <Phone size={12} className="text-ink-muted" />
                                                            <span>{rider.phone}</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-ink-muted">—</span>
                                                    )}
                                                </td>

                                                <td className="py-3 px-4">
                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(rider.commission_rate || 0)}
                                                    </span>
                                                    <span className="text-xs text-ink-muted ml-1">/ del</span>
                                                </td>

                                                <td className="py-3 px-4">
                                                    {hasActiveDeliveries ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 font-semibold text-xs">
                                                            <Clock size={11} />
                                                            <span>{rider.live_count} Live Deliveries</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sunken border border-line text-ink-muted text-xs">
                                                            <span>Idle (Ready)</span>
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="py-3 px-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickToggle(rider)}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                                                            rider.status === 'active'
                                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50 hover:bg-emerald-100'
                                                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700/50 hover:bg-red-100'
                                                        }`}
                                                        title="Click to toggle status"
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${rider.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                        <span className="capitalize">{rider.status}</span>
                                                    </button>
                                                </td>

                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={route('store.restaurant.dispatch.rider-cashup', {
                                                                store_slug: storeSlug,
                                                                rider_id: rider.id,
                                                            })}
                                                            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
                                                            title="Rider Daily Cash-Up"
                                                        >
                                                            <DollarSign size={15} />
                                                        </Link>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEdit(rider)}
                                                            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
                                                            title="Edit Rider"
                                                        >
                                                            <Edit3 size={15} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteId(rider.id)}
                                                            className="p-1.5 rounded-lg text-ink-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            title="Remove Rider"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Rider Modal */}
            {addModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md bg-surface border border-line rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex flex-wrap items-center justify-between gap-y-2 pb-4 border-b border-line mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400">
                                    <Bike size={20} />
                                </div>
                                <h3 className="text-base font-bold text-ink">Add Delivery Rider</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAddModalOpen(false)}
                                className="text-ink-muted hover:text-ink p-1 rounded-lg hover:bg-sunken"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateRider} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                                    Rider Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. John Doe, Alex"
                                    className="w-full bg-sunken border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                                    Contact Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="e.g. +1 555-0199"
                                    className="w-full bg-sunken border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                                    Commission Rate (Per Delivery)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-xs">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.commission_rate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: e.target.value }))}
                                        placeholder="0.00"
                                        className="w-full bg-sunken border border-line rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    />
                                </div>
                                <p className="text-xs text-ink-muted mt-1">Paid to the rider per completed delivery.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                                    Vehicle / Notes
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="e.g. Red Motorbike #24, Electric Bike"
                                    className="w-full bg-sunken border border-line rounded-xl px-3.5 py-2 text-xs text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                />
                            </div>

                            <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 text-xs text-brand-800 dark:text-brand-300 flex items-start gap-2">
                                <ShieldCheck size={16} className="shrink-0 text-brand-600 dark:text-brand-400 mt-0.5" />
                                <span>
                                    <strong>No Login Seat Required:</strong> Riders are saved as delivery staff records and do not use up your account's user seats.
                                </span>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
                                <button
                                    type="button"
                                    onClick={() => setAddModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-line text-xs font-semibold text-ink-muted hover:text-ink hover:bg-sunken"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 text-white text-xs font-bold shadow-sm disabled:opacity-60 cursor-pointer"
                                >
                                    {saving && <Loader2 size={14} className="animate-spin" />}
                                    <span>Save Rider</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Rider Modal */}
            {editRider && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md bg-surface border border-line rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex flex-wrap items-center justify-between gap-y-2 pb-4 border-b border-line mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400">
                                    <Edit3 size={20} />
                                </div>
                                <h3 className="text-base font-bold text-ink">Edit Rider Details</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditRider(null)}
                                className="text-ink-muted hover:text-ink p-1 rounded-lg hover:bg-sunken"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleUpdateRider} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                                    Rider Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-sunken border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                                    Contact Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full bg-sunken border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                                    Commission Rate (Per Delivery)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-xs">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.commission_rate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: e.target.value }))}
                                        className="w-full bg-sunken border border-line rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                                    Duty Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full bg-sunken border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                >
                                    <option value="active">Active (Available for delivery)</option>
                                    <option value="inactive">Inactive (Off duty)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                                    Vehicle / Notes
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full bg-sunken border border-line rounded-xl px-3.5 py-2 text-xs text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
                                <button
                                    type="button"
                                    onClick={() => setEditRider(null)}
                                    className="px-4 py-2.5 rounded-xl border border-line text-xs font-semibold text-ink-muted hover:text-ink hover:bg-sunken"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 text-white text-xs font-bold shadow-sm disabled:opacity-60 cursor-pointer"
                                >
                                    {saving && <Loader2 size={14} className="animate-spin" />}
                                    <span>Update Details</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete / Deactivate */}
            <ConfirmModal
                isOpen={!!deleteId}
                title="Remove Rider?"
                message="Are you sure you want to deactivate this rider? They will no longer appear in the dispatch order assignment picker."
                confirmText="Yes, Deactivate"
                cancelText="Cancel"
                confirmVariant="danger"
                onConfirm={handleDeleteRider}
                onCancel={() => setDeleteId(null)}
            />
        </OneGlanceLayout>
    );
}

import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    Wrench,
    Plus,
    Search,
    Filter,
    Calendar,
    User,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    Clock,
    RotateCcw,
    LogOut,
    Edit,
    Trash2,
    X,
    Layers,
    DollarSign,
    Hammer,
    ShieldAlert,
    ArrowRight
} from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';

import ServiceNavTabs from '@/Pages/Services/ServiceNavTabs';

const STATUS_CONFIG = {
    available: { label: 'Available in Shop', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40', icon: CheckCircle2 },
    with_staff: { label: 'Checked Out', bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40', icon: User },
    in_maintenance: { label: 'In Maintenance', bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40', icon: AlertTriangle },
    lost: { label: 'Lost / Missing', bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40', icon: ShieldAlert },
    retired: { label: 'Retired', bg: 'bg-sunken text-ink-muted border-line', icon: Hammer },
};

export default function Tools({ tools, filters = {}, stats = {}, employees = [], categories = [] }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '');
    const tt = useTermText();

    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    
    // Modal states
    const [isToolModalOpen, setIsToolModalOpen] = useState(false);
    const [editingTool, setEditingTool] = useState(null);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [selectedToolForAction, setSelectedToolForAction] = useState(null);

    // Tool Form
    const [form, setForm] = useState({
        name: '',
        category: '',
        description: '',
        status: 'available',
        holder_employee_id: '',
        current_location: 'Shop / Storeroom',
        maintenance_interval_days: 90,
        last_maintenance_at: '',
        purchase_cost: '',
        notes: '',
    });

    // Checkout Form
    const [checkoutForm, setCheckoutForm] = useState({
        employee_id: '',
        location: '',
        quantity: 1,
    });

    // Maintenance Form
    const [maintenanceForm, setMaintenanceForm] = useState({
        maintenance_date: new Date().toISOString().split('T')[0],
        cost: '',
        notes: '',
    });

    const openAddTool = () => {
        setEditingTool(null);
        setForm({
            name: '',
            category: categories[0] || 'General Tools',
            description: '',
            status: 'available',
            holder_employee_id: '',
            current_location: 'Shop / Storeroom',
            maintenance_interval_days: 90,
            last_maintenance_at: new Date().toISOString().split('T')[0],
            purchase_cost: '',
            notes: '',
        });
        setIsToolModalOpen(true);
    };

    const openEditTool = (tool) => {
        setEditingTool(tool);
        setForm({
            name: tool.name || '',
            category: tool.category || '',
            description: tool.description || '',
            status: tool.status || 'available',
            holder_employee_id: tool.holder_employee_id || '',
            current_location: tool.current_location || '',
            maintenance_interval_days: tool.maintenance_interval_days || 90,
            last_maintenance_at: tool.last_maintenance_at || '',
            purchase_cost: tool.purchase_cost || '',
            notes: tool.notes || '',
        });
        setIsToolModalOpen(true);
    };

    const handleSaveTool = (e) => {
        e.preventDefault();
        if (editingTool) {
            router.put(route('store.tools.update', { store_slug: storeSlug, tool: editingTool.id }), form, {
                onSuccess: () => setIsToolModalOpen(false),
            });
        } else {
            router.post(route('store.tools.store', { store_slug: storeSlug }), form, {
                onSuccess: () => setIsToolModalOpen(false),
            });
        }
    };

    const openCheckout = (tool) => {
        setSelectedToolForAction(tool);
        setCheckoutForm({
            employee_id: tool.holder_employee_id || (employees[0]?.id || ''),
            location: tool.current_location || 'Service Van #1',
            quantity: 1,
        });
        setIsCheckoutModalOpen(true);
    };

    const handleCheckout = (e) => {
        e.preventDefault();
        if (!selectedToolForAction) return;
        router.post(route('store.tools.checkout', { store_slug: storeSlug, tool: selectedToolForAction.id }), checkoutForm, {
            onSuccess: () => setIsCheckoutModalOpen(false),
        });
    };

    const handleCheckin = (tool) => {
        router.post(route('store.tools.checkin', { store_slug: storeSlug, tool: tool.id }));
    };

    const openMaintenance = (tool) => {
        setSelectedToolForAction(tool);
        setMaintenanceForm({
            maintenance_date: new Date().toISOString().split('T')[0],
            cost: '',
            notes: 'Inspected and certified ready for service.',
        });
        setIsMaintenanceModalOpen(true);
    };

    const handleLogMaintenance = (e) => {
        e.preventDefault();
        if (!selectedToolForAction) return;
        router.post(route('store.tools.maintenance', { store_slug: storeSlug, tool: selectedToolForAction.id }), maintenanceForm, {
            onSuccess: () => setIsMaintenanceModalOpen(false),
        });
    };

    const handleDeleteTool = (tool) => {
        if (confirm(`Remove "${tool.name}" from tools inventory?`)) {
            router.delete(route('store.tools.destroy', { store_slug: storeSlug, tool: tool.id }));
        }
    };

    const applyFilter = (status) => {
        setSelectedStatus(status);
        router.get(route('store.tools.index', { store_slug: storeSlug }), { search, status }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearch = (e) => {
        if (e.key !== 'Enter') return;
        router.get(route('store.tools.index', { store_slug: storeSlug }), { search, status: selectedStatus }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <OneGlanceLayout title="Tools & Equipment" activeMenu="Stock">
            <Head title="Tools & Equipment Management" />

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
                {/* Unified Services Tabs */}
                <ServiceNavTabs active="tools" />

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-accent-quiet text-accent-text">
                                <Wrench size={22} />
                            </span>
                            <div>
                                <h1 className="text-xl font-bold text-ink flex items-center gap-2">
                                    Tools & Field Equipment
                                </h1>
                                <p className="text-xs text-ink-muted">
                                    {tt('Track workshop tools, vehicle kits, staff checkouts, and maintenance cadences.')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={openAddTool}
                            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent-fill px-4 text-xs font-semibold text-accent-on shadow-glow transition-colors hover:bg-accent-fill-hover"
                        >
                            <Plus size={15} /> Add Tool
                        </button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl border border-line bg-surface shadow-xs">
                        <span className="text-3xs font-bold uppercase tracking-wider text-ink-muted block">Total Equipment</span>
                        <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-2xl font-black text-ink">{stats.total ?? 0}</span>
                            <Wrench size={16} className="text-indigo-500" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-line bg-surface shadow-xs">
                        <span className="text-3xs font-bold uppercase tracking-wider text-emerald-600 block">Available in Shop</span>
                        <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-2xl font-black text-emerald-600">{stats.available ?? 0}</span>
                            <CheckCircle2 size={16} className="text-emerald-500" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-line bg-surface shadow-xs">
                        <span className="text-3xs font-bold uppercase tracking-wider text-blue-600 block">{tt('Checked Out to Staff')}</span>
                        <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-2xl font-black text-blue-600">{stats.with_staff ?? 0}</span>
                            <User size={16} className="text-blue-500" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-line bg-surface shadow-xs">
                        <span className="text-3xs font-bold uppercase tracking-wider text-amber-600 block">Maintenance Due Soon</span>
                        <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-2xl font-black text-amber-600">{stats.due_maintenance ?? 0}</span>
                            <AlertTriangle size={16} className="text-amber-500" />
                        </div>
                    </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-line">
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                        {[
                            { key: 'all', label: 'All Equipment' },
                            { key: 'available', label: 'Available' },
                            { key: 'with_staff', label: tt('With Staff') },
                            { key: 'due_maintenance', label: 'Maintenance Due (7d)' },
                            { key: 'in_maintenance', label: 'In Repair' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => applyFilter(tab.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                                    selectedStatus === tab.key
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-sunken text-ink-secondary hover:bg-interactive-hover'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearch}
                            placeholder={tt('Search tools, staff, category...')}
                            className="w-full pl-9 pr-3 py-1.5 bg-app border border-line rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    </div>
                </div>

                {/* Tools Grid / Table */}
                <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-xs">
                    {tools.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <Wrench size={36} className="mx-auto text-ink-muted mb-2 opacity-50" />
                            <h3 className="text-sm font-bold text-ink">No tools found</h3>
                            <p className="text-xs text-ink-muted mt-1">Register shop tools or equipment to track field assignments.</p>
                            <button onClick={openAddTool} className="mt-4 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold">
                                + Register Tool
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-app border-b border-line text-ink-muted uppercase font-bold text-3xs tracking-wider">
                                        <th className="p-3">Tool / Equipment</th>
                                        <th className="p-3">Category</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Current Holder / Location</th>
                                        <th className="p-3">Next Maintenance</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {tools.data.map(tool => {
                                        const statusObj = STATUS_CONFIG[tool.status] || STATUS_CONFIG.available;
                                        const StatusIcon = statusObj.icon;
                                        const isDue = tool.next_maintenance_due_at && new Date(tool.next_maintenance_due_at) <= new Date(Date.now() + 7 * 86400000);

                                        return (
                                            <tr key={tool.id} className="hover:bg-sunken/40 transition-colors">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0 border border-line">
                                                            <Wrench size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-ink">{tool.name}</p>
                                                            {tool.description && <p className="text-3xs text-ink-muted line-clamp-1">{tool.description}</p>}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="p-3">
                                                    <span className="px-2 py-0.5 rounded-md bg-sunken font-semibold text-3xs text-ink-secondary border border-line">
                                                        {tool.category || 'General'}
                                                    </span>
                                                </td>

                                                <td className="p-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold border ${statusObj.bg}`}>
                                                        <StatusIcon size={10} />
                                                        {statusObj.label}
                                                    </span>
                                                </td>

                                                <td className="p-3">
                                                    {tool.holder ? (
                                                        <div className="flex items-center gap-1.5 font-bold text-ink">
                                                            <User size={12} className="text-blue-500" />
                                                            <span>{tool.holder.name}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-ink-muted">
                                                            <MapPin size={12} />
                                                            <span>{tool.current_location || 'Shop / Storeroom'}</span>
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="p-3">
                                                    {tool.next_maintenance_due_at ? (
                                                        <div className="flex items-center gap-1">
                                                            <span className={`font-semibold tabular-nums ${isDue ? 'text-amber-600 font-bold' : 'text-ink-secondary'}`}>
                                                                {tool.next_maintenance_due_at}
                                                            </span>
                                                            {isDue && <AlertTriangle size={12} className="text-amber-500" title="Maintenance due soon" />}
                                                        </div>
                                                    ) : (
                                                        <span className="text-ink-muted">—</span>
                                                    )}
                                                </td>

                                                <td className="p-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {tool.status === 'with_staff' ? (
                                                            <button
                                                                onClick={() => handleCheckin(tool)}
                                                                className="px-2 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                                                                title="Return tool to shop"
                                                            >
                                                                <RotateCcw size={11} /> Return
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => openCheckout(tool)}
                                                                className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 rounded font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                                                                title="Check out to employee/job"
                                                            >
                                                                <LogOut size={11} /> Check Out
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => openMaintenance(tool)}
                                                            className="p-1 hover:bg-interactive-hover rounded text-ink-muted hover:text-amber-600"
                                                            title="Log maintenance"
                                                        >
                                                            <Clock size={13} />
                                                        </button>

                                                        <button
                                                            onClick={() => openEditTool(tool)}
                                                            className="p-1 hover:bg-interactive-hover rounded text-ink-muted hover:text-indigo-600"
                                                            title="Edit"
                                                        >
                                                            <Edit size={13} />
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteTool(tool)}
                                                            className="p-1 hover:bg-rose-50 rounded text-ink-muted hover:text-rose-600"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={13} />
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

            {/* Add / Edit Tool Modal */}
            {isToolModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-surface w-full max-w-lg rounded-2xl border border-line shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="flex items-center justify-between p-4 border-b border-line">
                            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                                <Wrench size={16} className="text-indigo-600" />
                                {editingTool ? 'Edit Tool / Equipment' : 'Register New Tool'}
                            </h2>
                            <button onClick={() => setIsToolModalOpen(false)} className="p-1 rounded-lg text-ink-muted hover:bg-sunken">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTool} className="p-4 space-y-3.5 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="font-bold text-ink block mb-1">Tool / Equipment Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. Cordless Hammer Drill, Vacuum Pump"
                                        className="w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-ink block mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        placeholder="Power Tools, Diagnostics, HVAC"
                                        className="w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-ink block mb-1">Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="available">Available in Shop</option>
                                        <option value="with_staff">{tt('With Staff / In Field')}</option>
                                        <option value="in_maintenance">In Maintenance</option>
                                        <option value="lost">Lost / Missing</option>
                                        <option value="retired">Retired</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="font-bold text-ink block mb-1">Assigned Holder (Optional)</label>
                                    <select
                                        value={form.holder_employee_id}
                                        onChange={(e) => setForm({ ...form, holder_employee_id: e.target.value })}
                                        className="w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">None (In Shop)</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="font-bold text-ink block mb-1">Current Location</label>
                                    <input
                                        type="text"
                                        value={form.current_location}
                                        onChange={(e) => setForm({ ...form, current_location: e.target.value })}
                                        placeholder="Shop shelf A3, Van #2"
                                        className="w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-ink block mb-1">Maintenance Cadence (Days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.maintenance_interval_days}
                                        onChange={(e) => setForm({ ...form, maintenance_interval_days: e.target.value })}
                                        placeholder="e.g. 90 (every 3 months)"
                                        className="w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-ink block mb-1">Last Maintenance Date</label>
                                    <input
                                        type="date"
                                        value={form.last_maintenance_at}
                                        onChange={(e) => setForm({ ...form, last_maintenance_at: e.target.value })}
                                        className="w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-ink block mb-1">Purchase / Replacement Cost</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.purchase_cost}
                                        onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="font-bold text-ink block mb-1">Notes / Serial Number</label>
                                    <textarea
                                        rows={2}
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        placeholder="Serial #, battery specs, warranty details..."
                                        className="w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                                <button type="button" onClick={() => setIsToolModalOpen(false)} className="px-4 py-2 rounded-xl bg-sunken text-ink font-bold">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm">
                                    {editingTool ? 'Save Changes' : 'Register Tool'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Check Out Tool Modal */}
            {isCheckoutModalOpen && selectedToolForAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-surface w-full max-w-md rounded-2xl border border-line shadow-2xl p-5 space-y-4 animate-in zoom-in-95 text-xs">
                        <div className="flex items-center justify-between border-b border-line pb-3">
                            <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                                <LogOut size={16} className="text-blue-600" />
                                Check Out: {selectedToolForAction.name}
                            </h3>
                            <button onClick={() => setIsCheckoutModalOpen(false)} className="p-1 text-ink-muted">
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleCheckout} className="space-y-3">
                            <div>
                                <label className="font-bold text-ink block mb-1">{tt('Assign to Staff Member *')}</label>
                                <select
                                    required
                                    value={checkoutForm.employee_id}
                                    onChange={(e) => setCheckoutForm({ ...checkoutForm, employee_id: e.target.value })}
                                    className="w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="font-bold text-ink block mb-1">Field Location / Vehicle</label>
                                <input
                                    type="text"
                                    value={checkoutForm.location}
                                    onChange={(e) => setCheckoutForm({ ...checkoutForm, location: e.target.value })}
                                    placeholder={tt('e.g. Service Van #1, Client Site')}
                                    className="w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsCheckoutModalOpen(false)} className="px-3 py-1.5 bg-sunken text-ink font-bold rounded-lg">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm">
                                    Confirm Check Out
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Log Maintenance Modal */}
            {isMaintenanceModalOpen && selectedToolForAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-surface w-full max-w-md rounded-2xl border border-line shadow-2xl p-5 space-y-4 animate-in zoom-in-95 text-xs">
                        <div className="flex items-center justify-between border-b border-line pb-3">
                            <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                                <Clock size={16} className="text-amber-600" />
                                Log Maintenance: {selectedToolForAction.name}
                            </h3>
                            <button onClick={() => setIsMaintenanceModalOpen(false)} className="p-1 text-ink-muted">
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleLogMaintenance} className="space-y-3">
                            <div>
                                <label className="font-bold text-ink block mb-1">{tt('Service / Inspection Date')}</label>
                                <input
                                    type="date"
                                    required
                                    value={maintenanceForm.maintenance_date}
                                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenance_date: e.target.value })}
                                    className="w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-ink block mb-1">{tt('Service Cost (If Any)')}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={maintenanceForm.cost}
                                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-ink block mb-1">Inspection Notes & Findings</label>
                                <textarea
                                    rows={2}
                                    value={maintenanceForm.notes}
                                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                                    placeholder="Oil changed, blades sharpened, safety test passed..."
                                    className="w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <p className="text-3xs text-ink-muted">
                                Logging maintenance will reset the countdown and recalculate the next due date based on {selectedToolForAction.maintenance_interval_days || 90} days interval.
                            </p>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="px-3 py-1.5 bg-sunken text-ink font-bold rounded-lg">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm">
                                    Record Maintenance
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
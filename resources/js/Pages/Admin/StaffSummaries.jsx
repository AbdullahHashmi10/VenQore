import React, { useState, useMemo, useEffect } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { getCurrencySymbol } from '@/Utils/format';
import {
    Users, Plus, Search, Edit3, Trash2, Shield, Mail, Clock,
    CheckCircle, XCircle, UserPlus, X, Check, ShoppingCart,
    Package, BarChart2, DollarSign, Settings, FileText, Truck,
    UserCheck, Eye, Lock, Crown, Star, Calendar, Timer, Activity,
    User, BadgeCheck, Zap, Copy, MessageCircle, Phone, RotateCcw,
    ChevronDown, AlertCircle, Send, Ban, RefreshCw, BarChart, Sparkles,
    TrendingUp, Printer, Download, Award
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine
} from 'recharts';

// ─── Role definitions ──────────────────────────────────────────────────────
const ROLES = {
    admin:           { name: 'Admin',            description: 'Full management access',    icon: Shield,       color: 'from-violet-500 to-purple-600',  badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400' },
    manager:         { name: 'Manager',          description: 'Operations manager',         icon: Star,         color: 'from-blue-500 to-cyan-600',      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
    cashier:         { name: 'Cashier',          description: 'POS & Sales only',           icon: ShoppingCart, color: 'from-emerald-500 to-teal-600',   badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
    inventory_staff: { name: 'Inventory Staff',  description: 'Stock management',           icon: Package,      color: 'from-orange-500 to-red-600',     badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' },
    accountant:      { name: 'Accountant',       description: 'Financial reporting',        icon: DollarSign,   color: 'from-green-500 to-emerald-600',  badge: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' },
    support:         { name: 'Support',          description: 'Troubleshooting & Help',     icon: BadgeCheck,   color: 'from-pink-500 to-rose-600',      badge: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400' },
    custom:          { name: 'Custom',           description: 'Specific permissions',       icon: Settings,     color: 'from-slate-500 to-slate-600',    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400' },
    viewer:          { name: 'Viewer',           description: 'Read-only access',           icon: Eye,          color: 'from-gray-500 to-gray-600',      badge: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400' },
};

const ROLE_PERMISSIONS = {
    admin: ['pos', 'sales', 'inventory', 'purchasing', 'crm', 'reports', 'accounting', 'logs', 'discounts', 'team', 'settings'],
    manager: ['pos', 'sales', 'inventory', 'purchasing', 'crm', 'reports', 'discounts', 'team'],
    cashier: ['pos', 'sales_view', 'crm'],
    inventory_staff: ['inventory', 'purchasing'],
    accountant: ['accounting', 'reports', 'sales_view'],
    support: ['logs', 'settings', 'team'],
    viewer: ['sales_view', 'reports'],
    custom: []
};

const MODULES = [
    { id: 'pos', name: 'POS Terminal', desc: 'Access point of sale', icon: ShoppingCart },
    { id: 'sales', name: 'Sales Management', desc: 'View sales & invoices', icon: FileText },
    { id: 'sales_view', name: 'View Sales Only', desc: 'Read-only sales access', icon: Eye },
    { id: 'inventory', name: 'Inventory', desc: 'Product & stock management', icon: Package },
    { id: 'purchasing', name: 'Purchasing', desc: 'Supplier & PO management', icon: Truck },
    { id: 'crm', name: 'CRM', desc: 'Customer management', icon: Users },
    { id: 'reports', name: 'Reports', desc: 'Business analytics', icon: BarChart2 },
    { id: 'accounting', name: 'Accounting', desc: 'Financial statements', icon: DollarSign },
    { id: 'logs', name: 'Audit Logs', desc: 'View system logs', icon: Activity },
    { id: 'discounts', name: 'Discounts', desc: 'Manage promotions', icon: Zap },
    { id: 'team', name: 'Team Access', desc: 'Manage users & roles', icon: UserCheck },
    { id: 'settings', name: 'Settings', desc: 'System configuration', icon: Settings },
];

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS = {
    pending:            { label: 'Pending',           color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700',    dot: 'bg-amber-500' },
    no_account:         { label: 'No Account',        color: 'text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',     dot: 'bg-slate-400' },
    awaiting_approval:  { label: 'Awaiting Approval', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700',       dot: 'bg-blue-500 animate-pulse' },
    active:             { label: 'Active',            color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700', dot: 'bg-emerald-500 animate-pulse' },
    expired:            { label: 'Expired',           color: 'text-red-500 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',             dot: 'bg-red-500' },
    revoked:            { label: 'Revoked',           color: 'text-red-400 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',             dot: 'bg-red-400' },
    declined:           { label: 'Declined',          color: 'text-slate-400 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-500',                          dot: 'bg-slate-400' },
    suspended:          { label: 'Suspended',         color: 'text-red-500 bg-red-50 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800',             dot: 'bg-red-500' },
};

// ─── Helpers ───────────────────────────────────────────────────────────────
const getRoleInfo = (role) => {
    if (role === 'owner') {
        return { name: 'Owner', description: 'Store Owner', icon: Crown, color: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' };
    }
    return ROLES[role] || { name: role ? role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Staff', description: 'Store Staff', icon: Shield, color: 'from-slate-500 to-slate-600', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400' };
};

const getStatusCfg = (status) => STATUS[status] || STATUS.pending;

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(() => {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    });
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function StaffSummaries({ users = [], invitations = [], attendance = { today: {}, history: {} }, staffData = [] }) {
    const { store, url } = usePage().props;
    const [activeTab, setActiveTab] = useState('attendance');
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null); // Attendance drill-down
    const [sortConfig, setSortConfig] = useState('sales'); // for summaries sorting

    // Form structure for Invite Member
    const { data, setData, post, processing, errors, reset } = useForm({
        invitee_name:  '',
        invitee_email: '',
        invitee_phone: '',
        roles:         ['cashier'],
        permissions:   ROLE_PERMISSIONS.cashier,
    });

    // Check URL parameters on mount and when URL changes
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && ['attendance', 'summaries', 'members', 'invitations'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [url]);

    // Update URL query parameters when tab is changed locally
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        const nextUrl = `${window.location.pathname}?tab=${tabId}`;
        window.history.pushState({ path: nextUrl }, '', nextUrl);
    };

    // Calculate aggregated stats
    const stats = useMemo(() => {
        return {
            totalStaff: staffData.length,
            totalSales: staffData.reduce((sum, s) => sum + (s.totalSales || 0), 0),
            totalTransactions: staffData.reduce((sum, s) => sum + (s.transactionCount || 0), 0),
            topPerformer: staffData.reduce((prev, current) => (prev.totalSales > current.totalSales) ? prev : current, {})
        };
    }, [staffData]);

    const activeMembers    = users.filter(u => u.role !== 'platform_admin').length;
    const pendingInvites   = invitations.filter(i => ['pending', 'no_account'].includes(i.status)).length;
    const awaitingApproval = invitations.filter(i => i.status === 'awaiting_approval').length;

    // Filter Summaries list
    const filteredSummaries = useMemo(() => {
        let result = staffData.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        result.sort((a, b) => {
            if (sortConfig === 'sales') return b.totalSales - a.totalSales;
            if (sortConfig === 'transactions') return b.transactionCount - a.transactionCount;
            if (sortConfig === 'avg') return b.avgTransaction - a.avgTransaction;
            return 0;
        });

        return result;
    }, [staffData, searchQuery, sortConfig]);

    // Filter invitations
    const filteredInvitations = useMemo(() =>
        invitations.filter(inv => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (inv.invitee_name || '').toLowerCase().includes(q)
                || (inv.invitee_email || '').toLowerCase().includes(q)
                || (inv.short_code || '').toLowerCase().includes(q);
        }),
    [invitations, searchQuery]);

    // Filter members
    const filteredMembers = useMemo(() =>
        users.filter(u => {
            if (u.role === 'platform_admin') return false;
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return u.name.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q));
        }),
    [users, searchQuery]);

    const handleCopy = (inv) => {
        copyToClipboard(inv.short_code);
        setCopiedId(inv.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('store.admin.invitations.store', { store_slug: store?.slug }), {
            onSuccess: () => { setShowAddModal(false); reset(); },
        });
    };

    const toggleRole = (roleKey) => {
        setData(d => ({
            ...d,
            roles: [roleKey],
            permissions: ROLE_PERMISSIONS[roleKey] || []
        }));
    };

    const togglePermission = (modId) => {
        setData(d => {
            const isSelected = d.permissions.includes(modId);
            const newPermissions = isSelected
                ? d.permissions.filter(p => p !== modId)
                : [...d.permissions, modId];
            
            return {
                ...d,
                roles: ['custom'],
                permissions: newPermissions
            };
        });
    };

    const action = (routeName, inv) => {
        router.post(route(routeName, { store_slug: store?.slug, invitation: inv.id }), {}, {
            onSuccess: () => setOpenMenu(null),
        });
    };

    const whatsappShare = (inv) => {
        const link = `${window.location.origin}/invite/accept?token=${inv.token || ''}`;
        const msg  = encodeURIComponent(
            `Hi ${inv.invitee_name}! You've been invited to join *${store?.name}* on VenQore.\n\n` +
            `Your invite code: *${inv.short_code}*\n\nOr click: ${link}`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    };

    const formatCurrency = (value) => {
        return (getCurrencySymbol()) + ' ' + (parseFloat(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    };

    return (
        <OneGlanceLayout title="Staff & Attendance" activeMenu="Staff Summaries" mode="admin">
            <Head title="Staff & Attendance" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                
                {/* Unified Premium Navigation & Invite Bar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl shadow-sm shrink-0">
                    
                    {/* Left & Center: Invite Button + Unified Navigation Tabs */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        
                        {/* Invite Member Button on far left */}
                        <button onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.03] active:scale-95 shrink-0">
                            <Plus size={16} />
                            <span>Invite Member</span>
                        </button>

                        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block shrink-0"></div>

                        {/* Navigation Tabs */}
                        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto max-w-full">
                            {[
                                { id: 'attendance', label: 'Staff Attendance', icon: Clock },
                                { id: 'summaries', label: 'Staff Summaries', icon: BarChart2 },
                                { id: 'members', label: 'Members', icon: Users, badge: activeMembers },
                                { id: 'invitations', label: 'Invitations', icon: Send, badge: pendingInvites > 0 ? pendingInvites : null },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 ${
                                        activeTab === tab.id
                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <tab.icon size={13} />
                                    <span>{tab.label}</span>
                                    {tab.badge && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                                            activeTab === tab.id
                                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}>
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Search Input + Action triggers */}
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <div className="relative flex-1 lg:flex-initial">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search ${activeTab}...`}
                                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none lg:w-60 transition-all text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Awaiting Approval Banner */}
                {awaitingApproval > 0 && activeTab === 'invitations' && (
                    <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl shrink-0">
                        <AlertCircle size={16} className="text-blue-500 shrink-0" />
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                            {awaitingApproval} team member{awaitingApproval > 1 ? 's' : ''} accepted their invite and is waiting for your approval.
                        </span>
                    </div>
                )}

                {/* Content View Routing */}
                <div className="flex-1 overflow-y-auto min-h-0 flex flex-col mt-1">
                    
                    {/* TAB: Staff Attendance */}
                    {activeTab === 'attendance' && (
                        <AttendanceTable
                            attendance={attendance}
                            users={users}
                            onDetail={(user) => setSelectedUser(user)}
                        />
                    )}

                    {/* TAB: Staff Summaries */}
                    {activeTab === 'summaries' && (
                        <div className="flex flex-col gap-2 h-full min-h-0">
                            
                            {/* Summaries Stats row */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 shrink-0">
                                <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                            <Users size={14} />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Active Staff</p>
                                    </div>
                                    <p className="text-base font-black text-slate-900 dark:text-white">{stats.totalStaff}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                            <DollarSign size={14} />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Total Sales</p>
                                    </div>
                                    <p className="text-base font-black text-emerald-600">{formatCurrency(stats.totalSales)}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                            <Package size={14} />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Transactions</p>
                                    </div>
                                    <p className="text-base font-black text-blue-600">{stats.totalTransactions}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                            <Award size={14} />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Top Performer</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[100px]">{stats.topPerformer.name || '-'}</p>
                                        <p className="text-[10px] text-emerald-500 font-bold">{formatCurrency(stats.topPerformer.totalSales || 0)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Sort control bar */}
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sort Performance:</span>
                                <button
                                    onClick={() => setSortConfig('sales')}
                                    className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full transition-all ${sortConfig === 'sales'
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >Total Sales</button>
                                <button
                                    onClick={() => setSortConfig('transactions')}
                                    className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full transition-all ${sortConfig === 'transactions'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 ring-1 ring-blue-500/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >Transactions</button>
                                <button
                                    onClick={() => setSortConfig('avg')}
                                    className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full transition-all ${sortConfig === 'avg'
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 ring-1 ring-purple-500/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >Avg. Ticket</button>
                            </div>

                            {/* Staff Sales Grid */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
                                    {filteredSummaries.length > 0 ? (
                                        filteredSummaries.map((staff, index) => (
                                            <div key={staff.id || index} className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group">
                                                {index === 0 && sortConfig === 'sales' && (
                                                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                                        <Award size={10} /> Top Sales
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                                                        index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                                                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                                                                'bg-gradient-to-br from-indigo-500 to-purple-600'
                                                        }`}>
                                                        {staff.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 dark:text-white truncate max-w-[150px]">{staff.name}</h3>
                                                        <p className="text-xs text-slate-500">{staff.role}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                            <DollarSign size={13} />
                                                            <span className="text-xs font-medium">Total Sales</span>
                                                        </div>
                                                        <span className="font-bold text-sm text-slate-800 dark:text-white">
                                                            {formatCurrency(staff.totalSales)}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                                                                <Package size={11} />
                                                                <span className="text-[9px] font-bold uppercase">Txns</span>
                                                            </div>
                                                            <p className="font-bold text-slate-800 dark:text-white">{staff.transactionCount}</p>
                                                        </div>
                                                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                                                                <TrendingUp size={11} />
                                                                <span className="text-[9px] font-bold uppercase">Avg</span>
                                                            </div>
                                                            <p className="font-bold text-slate-800 dark:text-white max-w-full truncate">
                                                                {getCurrencySymbol()} {Math.round(staff.avgTransaction).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                                                        <div className="flex items-center gap-1">
                                                            <Clock size={11} />
                                                            Last Active:
                                                        </div>
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">{staff.lastActive}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                <Users size={32} className="text-slate-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-700 dark:text-white">No staff performance data</h3>
                                            <p className="text-slate-500">Try adjusting your search criteria</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: Members List */}
                    {activeTab === 'members' && (
                        <MembersTable
                            users={filteredMembers}
                            store={store}
                        />
                    )}

                    {/* TAB: Invitations List */}
                    {activeTab === 'invitations' && (
                        <InvitationsTable
                            invitations={filteredInvitations}
                            copiedId={copiedId}
                            openMenu={openMenu}
                            setOpenMenu={setOpenMenu}
                            onCopy={handleCopy}
                            onWhatsApp={whatsappShare}
                            onApprove={inv => action('store.admin.invitations.approve', inv)}
                            onDecline={inv => action('store.admin.invitations.decline', inv)}
                            onRevoke={inv  => action('store.admin.invitations.revoke', inv)}
                            onResend={inv  => action('store.admin.invitations.resend', inv)}
                        />
                    )}
                </div>
            </div>

            {/* ── Attendance Detail Modal ── */}
            {selectedUser && (
                <AttendanceDetailModal
                    user={selectedUser}
                    history={attendance.history?.[selectedUser.id] || {}}
                    onClose={() => setSelectedUser(null)}
                />
            )}

            {/* ── Invite Member Modal ── */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 overflow-y-auto custom-scrollbar">
                    <div className="bg-[#0f172a] rounded-[2rem] shadow-2xl w-full max-w-[1100px] border border-slate-700/50 flex flex-col md:flex-row relative mt-auto mb-auto">
                        
                        <button onClick={() => { setShowAddModal(false); reset(); }}
                            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-20">
                            <X size={20} />
                        </button>

                        {/* LEFT COLUMN: Form & Roles */}
                        <div className="w-full md:w-[420px] shrink-0 p-8 flex flex-col bg-[#0f172a] rounded-l-[2rem] border-b md:border-b-0 md:border-r border-slate-700/50">
                            <div className="flex items-center gap-4 mb-8">
                                <h3 className="font-extrabold text-2xl text-white tracking-tight">Invite Member</h3>
                                <div className="h-4 w-px bg-slate-700"></div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">TEAM LINK</span>
                            </div>

                            <form id="invite-form" onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <User size={13} /> CREDENTIALS
                                    </h4>
                                    
                                    <div className="space-y-1 focus-within:text-indigo-400 transition-colors text-slate-500">
                                        <label className="text-[10px] font-bold uppercase tracking-wider ml-1">Name</label>
                                        <input type="text" value={data.invitee_name} onChange={e => setData('invitee_name', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-500"
                                            placeholder="Full Name" required />
                                        {errors.invitee_name && <p className="text-[10px] text-red-400 ml-1">{errors.invitee_name}</p>}
                                    </div>
                                    <div className="space-y-1 focus-within:text-indigo-400 transition-colors text-slate-500">
                                        <label className="text-[10px] font-bold uppercase tracking-wider ml-1">Email</label>
                                        <input type="email" value={data.invitee_email} onChange={e => setData('invitee_email', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-500"
                                            placeholder="Email Address" required />
                                        {errors.invitee_email && <p className="text-[10px] text-red-400 ml-1">{errors.invitee_email}</p>}
                                    </div>
                                    <div className="space-y-1 focus-within:text-indigo-400 transition-colors text-slate-500">
                                        <label className="text-[10px] font-bold uppercase tracking-wider ml-1">Phone Number</label>
                                        <input type="text" value={data.invitee_phone} onChange={e => setData('invitee_phone', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-500"
                                            placeholder="Optional" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <Crown size={13} /> ASSIGN ROLE
                                        </h4>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {Object.entries(ROLES).map(([key, role]) => {
                                            const isSelected = data.roles.includes(key);
                                            return (
                                                <button key={key} type="button" onClick={() => toggleRole(key)}
                                                    className={`p-2.5 rounded-xl border flex gap-2 text-left transition-all ${
                                                        isSelected
                                                            ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/20'
                                                            : 'bg-[#1e293b] border-[#334155] hover:border-indigo-400/50 hover:bg-[#1e293b]/80'
                                                    }`}>
                                                    <div className={`mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                                                        <role.icon size={14} />
                                                    </div>
                                                    <div>
                                                        <div className={`text-[11px] font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>{role.name}</div>
                                                        <div className={`text-[9px] font-medium leading-tight mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`} style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{role.description}</div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.roles && <p className="text-[10px] text-red-400 ml-1">{errors.roles}</p>}
                                </div>
                            </form>
                        </div>

                        {/* RIGHT COLUMN: Permissions Visualizer */}
                        <div className="flex-1 p-8 bg-[#0f172a] rounded-r-[2rem] flex flex-col relative overflow-hidden">
                            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                            
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="space-y-0.5">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        <Shield size={13} className="text-indigo-400" /> System Visibility
                                    </h4>
                                </div>
                                <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 flex items-center gap-1.5 tracking-widest uppercase">
                                    <Sparkles size={11} /> Live Visibility
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 content-start overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                {MODULES.map(mod => {
                                    const isActive = data.permissions.includes(mod.id);
                                    return (
                                        <button key={mod.id} type="button" onClick={() => togglePermission(mod.id)}
                                            className={`p-3 rounded-xl border flex gap-3 text-left transition-all duration-200 group/mod ${
                                            isActive 
                                            ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.15)]' 
                                            : 'bg-slate-800/20 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700 hover:bg-slate-800/40'
                                        }`}>
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                                isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-[#1e293b] text-slate-500 group-hover/mod:text-slate-400'
                                            }`}>
                                                <mod.icon size={16} />
                                            </div>
                                            <div className="flex flex-col justify-center min-w-0">
                                                <div className={`text-[11px] font-bold leading-tight truncate ${isActive ? 'text-white' : 'text-slate-400 group-hover/mod:text-slate-300'}`}>{mod.name}</div>
                                                <div className="text-[8px] text-slate-500 leading-tight mt-0.5 truncate">{mod.desc}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-slate-800/50 flex items-center justify-between relative z-10 shrink-0">
                                <div className="space-y-0.5">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Visibility Summary</div>
                                    <div className="text-xs font-black text-white">
                                        <span className={data.permissions.length > 0 ? 'text-indigo-400' : 'text-slate-500'}>
                                             {data.permissions.length} Modules Assigned
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => { setShowAddModal(false); reset(); }}
                                        className="px-4 py-2.5 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">
                                        Discard
                                    </button>
                                    <button type="submit" form="invite-form" disabled={processing || data.roles.length === 0}
                                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-[0.15em] shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2">
                                        <Send size={12} />
                                        Send Invitation
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}

// ─── Invitations Table Component ───────────────────────────────────────────
function InvitationsTable({ invitations, copiedId, openMenu, setOpenMenu, onCopy, onWhatsApp, onApprove, onDecline, onRevoke, onResend }) {
    if (invitations.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Send size={48} className="stroke-[0.7]" />
                <div className="text-center">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-wider">No active invitations</h3>
                    <p className="text-xs text-slate-400 mt-1">Use the "Invite Member" button to invite your first teammate.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/40 sticky top-0 z-10">
                        <tr className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-3.5">Name & Email</th>
                            <th className="px-6 py-3.5">Phone</th>
                            <th className="px-6 py-3.5">Role(s)</th>
                            <th className="px-6 py-3.5">Invite Code</th>
                            <th className="px-6 py-3.5">Status</th>
                            <th className="px-6 py-3.5">Expires</th>
                            <th className="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {invitations.map(inv => {
                            const roles    = inv.roles || ['cashier'];
                            const roleInfo = getRoleInfo(roles[0]);
                            const st       = getStatusCfg(inv.status);

                            return (
                                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group text-slate-700 dark:text-slate-300">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleInfo.color} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                                                {(inv.invitee_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{inv.invitee_name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">{inv.invitee_email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-xs text-slate-500 font-medium">
                                        {inv.invitee_phone || <span className="text-slate-300 dark:text-slate-700">—</span>}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {roles.map(r => {
                                                const ri = getRoleInfo(r);
                                                return (
                                                    <span key={r} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${ri.badge}`}>
                                                        <ri.icon size={8} />{ri.name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        {inv.short_code ? (
                                            <button onClick={() => onCopy(inv)}
                                                className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700 hover:border-indigo-400/30 rounded-lg transition-colors group/code">
                                                <code className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 group-hover/code:text-indigo-600">
                                                    {inv.short_code}
                                                </code>
                                                {copiedId === inv.id
                                                    ? <Check size={11} className="text-emerald-500" />
                                                    : <Copy size={11} className="text-slate-400 group-hover/code:text-indigo-500" />
                                                }
                                            </button>
                                        ) : (
                                            <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${st.color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                                            {st.label}
                                        </span>
                                        {inv.status === 'awaiting_approval' && (
                                            <div className="flex items-center gap-1 mt-1.5">
                                                <button onClick={() => onApprove(inv)}
                                                    className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold rounded-lg transition-colors">
                                                    <Check size={8} /> Approve
                                                </button>
                                                <button onClick={() => onDecline(inv)}
                                                    className="flex items-center gap-1 px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white text-[9px] font-bold rounded-lg transition-colors">
                                                    <X size={8} /> Decline
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-[10px] text-slate-400 font-semibold font-mono">
                                        {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </td>
                                    <td className="px-6 py-3 text-right relative">
                                        <div className="relative inline-block">
                                            <button onClick={() => setOpenMenu(openMenu === inv.id ? null : inv.id)}
                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                                                <ChevronDown size={14} />
                                            </button>
                                            {openMenu === inv.id && (
                                                <>
                                                    <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />
                                                    <div className="absolute right-0 top-8 z-30 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-2xl shadow-xl py-1.5 overflow-hidden text-left border border-slate-200 dark:border-slate-800">
                                                        <button onClick={() => { onWhatsApp(inv); setOpenMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                            <MessageCircle size={13} className="text-emerald-500" /> Share via WhatsApp
                                                        </button>
                                                        <button onClick={() => { onCopy(inv); setOpenMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                            <Copy size={13} className="text-indigo-500" /> Copy Code
                                                        </button>
                                                        {['pending', 'no_account', 'expired'].includes(inv.status) && (
                                                            <button onClick={() => { onResend(inv); setOpenMenu(null); }}
                                                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                                <RefreshCw size={13} className="text-blue-500" /> Resend (+48h)
                                                            </button>
                                                        )}
                                                        {['pending', 'no_account', 'awaiting_approval'].includes(inv.status) && (
                                                            <>
                                                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                                <button onClick={() => { onRevoke(inv); setOpenMenu(null); }}
                                                                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                                                    <Ban size={13} /> Revoke Invite
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Attendance Table Component ───────────────────────────────────────────
function AttendanceTable({ attendance, users, onDetail }) {
    const todayData = attendance.today || {};
    const staff = users.filter(u => u.role !== 'platform_admin');

    if (staff.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Clock size={48} className="stroke-[0.7]" />
                <p className="text-xs font-medium text-slate-400">No active members found for attendance tracking.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/40 sticky top-0 z-10">
                        <tr className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-3.5">Staff Member</th>
                            <th className="px-6 py-3.5">Today's First In</th>
                            <th className="px-6 py-3.5">Current Status</th>
                            <th className="px-6 py-3.5">Total Time Today</th>
                            <th className="px-6 py-3.5 text-right">Activity Insight</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {staff.map(user => {
                            const data = todayData?.[user.id];
                            const isActive = data?.is_active;
                            
                            let totalTime = '—';
                            if (data?.total_mins !== undefined && data?.total_mins !== null) {
                                const mins = Math.max(0, Math.round(data.total_mins));
                                const h = Math.floor(mins / 60);
                                const m = mins % 60;
                                totalTime = `${h}h ${m}m`;
                            }

                            return (
                                <tr key={user.id} onClick={() => onDetail(user)}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer group text-slate-700 dark:text-slate-300">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-sm group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-600 transition-colors">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{user.name}</p>
                                                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{user.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-xs text-slate-500 font-mono font-semibold">
                                        {data?.first_in || <span className="text-slate-300 dark:text-slate-700">Not arrived</span>}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                            isActive 
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/50'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                                            {isActive ? 'Present now' : 'Logged out'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                                        {totalTime}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-500 transition-all">
                                            <BarChart size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Attendance Detail Modal Component ─────────────────────────────────────
function AttendanceDetailModal({ user, history, onClose }) {
    const [dateRange, setDateRange] = useState('30');

    const chartData = useMemo(() => {
        const rangeInt = parseInt(dateRange);
        const result = [];
        const today = new Date();
        for (let i = rangeInt - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const dayLogs = history[dateStr];
            const logSummary = Array.isArray(dayLogs) ? dayLogs[0] : dayLogs;
            result.push({
                date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                in: logSummary?.in_val ?? null,
                out: logSummary?.out_val ?? null,
                inLabel: logSummary?.in ?? '—',
                outLabel: logSummary?.out ?? '—',
            });
        }
        return result;
    }, [history, dateRange]);

    const formatYAxis = (hour) => {
        if (hour === 0) return '12 AM';
        if (hour === 12) return '12 PM';
        return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-3xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[580px]">
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-black text-base text-slate-800 dark:text-white leading-none">{user.name}</h3>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{user.role} Timings</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl">
                            {['7', '14', '30'].map(range => (
                                <button key={range} onClick={() => setDateRange(range)}
                                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${
                                        dateRange === range 
                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' 
                                            : 'text-slate-500'
                                    }`}>
                                    {range} Days
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto min-h-0 flex flex-col gap-4">
                    <div className="flex justify-between items-end shrink-0">
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrival & Departure Consistencies</h4>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                                <span className="text-[9px] font-bold uppercase text-slate-500">Arrival</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                                <span className="text-[9px] font-bold uppercase text-slate-500">Departure</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* TIMELINE AREA CHART CONTAINER */}
                    <div className="flex-1 min-h-[220px] bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 relative overflow-hidden">
                        <div className="absolute inset-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}} dy={5} />
                                    <YAxis domain={[0, 24]} axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 700, fill: '#94a3b8'}} tickFormatter={formatYAxis} ticks={[0, 4, 8, 12, 16, 20, 24]} />
                                    <Tooltip content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-lg">
                                                    <p className="text-[10px] font-black text-slate-800 dark:text-white mb-1.5">{payload[0].payload.date}</p>
                                                    <div className="space-y-1 text-[11px] font-semibold">
                                                        <div className="flex items-center gap-3 justify-between">
                                                            <span className="text-slate-500">First In:</span>
                                                            <span className="text-indigo-600">{payload[0].payload.inLabel || '—'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 justify-between">
                                                            <span className="text-slate-500">Last Out:</span>
                                                            <span className="text-rose-500">{payload[0].payload.outLabel || '—'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }} />
                                    <Area type="monotone" dataKey="in" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIn)" />
                                    <Area type="monotone" dataKey="out" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOut)" />
                                    <ReferenceLine y={9} stroke="#6366f1" strokeDasharray="3 3" opacity={0.2} label={{ position: 'right', value: '9 AM', fill: '#6366f1', fontSize: 9 }} />
                                    <ReferenceLine y={18} stroke="#f43f5e" strokeDasharray="3 3" opacity={0.2} label={{ position: 'right', value: '6 PM', fill: '#f43f5e', fontSize: 9 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Stats Grids */}
                    <div className="grid grid-cols-3 gap-4 shrink-0">
                        <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-800/40">
                            <div className="flex items-center gap-1.5 mb-0.5 text-indigo-600 dark:text-indigo-400">
                                <Zap size={13} />
                                <span className="text-[9px] font-bold uppercase">Average Arrival</span>
                            </div>
                            <p className="text-base font-black text-indigo-700 dark:text-indigo-450">
                                {chartData.filter(d => d.in).length > 0 ? (() => {
                                    const avg = chartData.filter(d => d.in).reduce((s,d) => s + d.in, 0) / chartData.filter(d => d.in).length;
                                    const h = Math.floor(avg);
                                    const m = Math.round((avg - h) * 60);
                                    return `${h % 12 || 12}:${m < 10 ? '0'+m : m} ${h >= 12 ? 'PM' : 'AM'}`;
                                })() : '—'}
                            </p>
                        </div>
                        <div className="bg-rose-50/50 dark:bg-rose-900/20 p-3.5 rounded-xl border border-rose-100 dark:border-rose-800/40">
                            <div className="flex items-center gap-1.5 mb-0.5 text-rose-600 dark:text-rose-400">
                                <RotateCcw size={13} />
                                <span className="text-[9px] font-bold uppercase">Average Departure</span>
                            </div>
                            <p className="text-base font-black text-rose-700 dark:text-rose-455">
                                {chartData.filter(d => d.out).length > 0 ? (() => {
                                    const avg = chartData.filter(d => d.out).reduce((s,d) => s + d.out, 0) / chartData.filter(d => d.out).length;
                                    const h = Math.floor(avg);
                                    const m = Math.round((avg - h) * 60);
                                    return `${h % 12 || 12}:${m < 10 ? '0'+m : m} ${h >= 12 ? 'PM' : 'AM'}`;
                                })() : '—'}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                            <div className="flex items-center gap-1.5 mb-0.5 text-slate-500">
                                <Activity size={13} />
                                <span className="text-[9px] font-bold uppercase">Punctuality</span>
                            </div>
                            <p className="text-base font-black text-slate-800 dark:text-white">Consistent</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Member Modal Component ───────────────────────────────────────────
function EditMemberModal({ member, onClose }) {
    const { store } = usePage().props;
    const { data, setData, patch, processing, errors } = useForm({
        role: member.role,
        display_name: member.display_name ?? '',
        status: member.status,
        permissions: member.permissions ?? [],
    });

    const handleRoleSelect = (roleKey) => {
        setData(d => ({
            ...d,
            role: roleKey,
            permissions: ROLE_PERMISSIONS[roleKey] || d.permissions
        }));
    };

    const togglePermission = (modId) => {
        setData(d => {
            const isSelected = d.permissions.includes(modId);
            const newPermissions = isSelected
                ? d.permissions.filter(p => p !== modId)
                : [...d.permissions, modId];
            
            return {
                ...d,
                role: 'custom',
                permissions: newPermissions
            };
        });
    };

    const submit = (e) => {
        e.preventDefault();
        patch(route('store.staff.update', { store_slug: store?.slug, member: member.membership_id }), {
            onSuccess: onClose,
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 md:p-8 overflow-y-auto custom-scrollbar">
            <div className="bg-[#0f172a] rounded-[2rem] shadow-2xl w-full max-w-[1100px] border border-slate-700/50 flex flex-col md:flex-row relative mt-auto mb-auto">
                
                <button onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-20">
                    <X size={18} />
                </button>

                {/* LEFT COLUMN: Main credentials & Roles */}
                <div className="w-full md:w-[420px] shrink-0 p-8 flex flex-col bg-[#0f172a] rounded-l-[2rem] border-b md:border-b-0 md:border-r border-slate-700/50">
                    <div className="flex items-center gap-3.5 mb-6">
                        <h3 className="font-extrabold text-xl text-white tracking-tight">Edit Member</h3>
                        <div className="h-4 w-px bg-slate-700"></div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{member.name}</span>
                    </div>

                    <form id="edit-form" onSubmit={submit} className="flex flex-col gap-5 flex-1">
                        
                        {/* Display Name */}
                        <div className="space-y-1 focus-within:text-indigo-400 transition-colors text-slate-500">
                            <label className="text-[10px] font-bold uppercase tracking-wider ml-1">Display Name</label>
                            <input type="text" value={data.display_name} onChange={e => setData('display_name', e.target.value)}
                                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Display Name" />
                            {errors.display_name && <p className="text-[10px] text-red-400 ml-1">{errors.display_name}</p>}
                        </div>

                        {/* Role Select */}
                        <div className="space-y-1 focus-within:text-indigo-400 transition-colors text-slate-500">
                            <label className="text-[10px] font-bold uppercase tracking-wider ml-1">Role</label>
                            <select value={data.role} onChange={e => handleRoleSelect(e.target.value)}
                                disabled={member.role === 'owner'}
                                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="cashier">Cashier</option>
                                <option value="accountant">Accountant</option>
                                <option value="purchasing_officer">Purchasing Officer</option>
                                <option value="viewer">Viewer</option>
                                <option value="custom">Custom (Tailored Permissions)</option>
                            </select>
                            {member.role === 'owner' && (
                                <p className="text-[10px] text-slate-550 ml-1">Owner role cannot be changed.</p>
                            )}
                            {errors.role && <p className="text-[10px] text-red-400 ml-1">{errors.role}</p>}
                        </div>

                        {/* Status Select */}
                        <div className="space-y-1 focus-within:text-indigo-400 transition-colors text-slate-500">
                            <label className="text-[10px] font-bold uppercase tracking-wider ml-1">Status</label>
                            <select value={data.status} onChange={e => setData('status', e.target.value)}
                                disabled={member.role === 'owner'}
                                className="w-full px-4 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                            </select>
                            {errors.status && <p className="text-[10px] text-red-400 ml-1">{errors.status}</p>}
                        </div>

                        {/* Role helper card */}
                        <div className="mt-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 text-[11px] text-slate-400">
                            {data.role === 'owner' && "💡 Fully scopes absolute store authority. Inviolable."}
                            {data.role === 'admin' && "💡 Full administrative view and control, including all staff configurations."}
                            {data.role === 'manager' && "💡 Operational and reports monitoring authority. Cannot configure roles."}
                            {data.role === 'cashier' && "💡 Access terminal interface. Absolute lock out of reports."}
                            {data.role === 'accountant' && "💡 Comprehensive financial, tax, and ledger configurations access."}
                            {data.role === 'viewer' && "💡 Read-only viewer access to key charts and indicators."}
                            {data.role === 'custom' && "💡 Dynamically configured custom permission matrix for unique team roles."}
                        </div>
                    </form>
                </div>

                {/* RIGHT COLUMN: Custom Visibility Grid / Permissions Manager */}
                <div className="flex-1 p-8 bg-[#0f172a] rounded-r-[2rem] flex flex-col relative overflow-hidden">
                    <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="space-y-0.5">
                            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                <Shield size={13} className="text-indigo-400" /> Module Access Control
                            </h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-5">Configure tailorable access visibility</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 flex items-center gap-1.5 tracking-widest uppercase">
                            <Sparkles size={11} /> Live Editor
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 content-start overflow-y-auto pr-2 custom-scrollbar relative z-10">
                        {MODULES.map(mod => {
                            const isActive = data.permissions.includes(mod.id);
                            const disabled = member.role === 'owner';
                            
                            return (
                                <button key={mod.id} type="button" 
                                    onClick={() => !disabled && togglePermission(mod.id)}
                                    disabled={disabled}
                                    className={`p-3 rounded-xl border flex gap-3 text-left transition-all duration-200 group/mod ${
                                    isActive 
                                    ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.15)]' 
                                    : 'bg-slate-800/20 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700 hover:bg-slate-800/40'
                                    } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}>
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                        isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-[#1e293b] text-slate-500 group-hover/mod:text-slate-400'
                                    }`}>
                                        <mod.icon size={16} />
                                    </div>
                                    <div className="flex flex-col justify-center min-w-0">
                                        <div className={`text-[11px] font-bold leading-tight truncate ${isActive ? 'text-white' : 'text-slate-400 group-hover/mod:text-slate-300'}`}>{mod.name}</div>
                                        <div className="text-[8px] text-slate-500 leading-tight mt-0.5 truncate">{mod.desc}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-slate-800/50 flex items-center justify-between relative z-10 shrink-0">
                        <div className="space-y-0.5">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Visibility Summary</div>
                            <div className="text-xs font-black text-white">
                                <span className={data.permissions.length > 0 ? 'text-indigo-400' : 'text-slate-500'}>
                                     {data.permissions.length} Modules Enabled
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={onClose}
                                className="px-4 py-2.5 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">
                                Discard
                            </button>
                            <button type="submit" form="edit-form" disabled={processing}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-[0.15em] shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2">
                                <Check size={12} />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Members Table Component ───────────────────────────────────────────────
function MembersTable({ users, store }) {
    const { my_role } = usePage().props;
    const canManage = ['owner', 'admin'].includes(my_role);
    const [openMenu, setOpenMenu] = useState(null);
    const [editingMember, setEditingMember] = useState(null);

    const handleRemove = (member) => {
        if (!confirm(`Remove ${member.name} from the store? They will lose all access immediately.`)) return;
        router.delete(route('store.staff.remove', { store_slug: store?.slug, member: member.membership_id }), {
            onSuccess: () => setOpenMenu(null),
        });
    };

    if (users.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Users size={48} className="stroke-[0.7]" />
                <p className="text-xs text-slate-400">No active members found matching criteria.</p>
            </div>
        );
    }

    return (
        <>
            {editingMember && (
                <EditMemberModal
                    member={editingMember}
                    onClose={() => setEditingMember(null)}
                />
            )}
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/40 sticky top-0 z-10">
                            <tr className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-3.5">Member</th>
                                <th className="px-6 py-3.5">Role & Access</th>
                                <th className="px-6 py-3.5">Email</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5">Joined</th>
                                {canManage && <th className="px-6 py-3.5 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {users.map(user => {
                                const role = getRoleInfo(user.role);
                                const RoleIcon = role.icon;
                                const st = getStatusCfg(user.status);
                                const isOwner = user.role === 'owner';

                                return (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group text-slate-700 dark:text-slate-300">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white font-bold shadow-sm text-sm`}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-850 dark:text-slate-200 text-xs">
                                                        {user.display_name || user.name}
                                                        {user.role === 'owner' && <span className="ml-2 text-[8px] font-black bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-widest">Owner</span>}
                                                    </p>
                                                    <p className="text-[9px] text-slate-400 font-mono">ID: {user.id || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${role.badge}`}>
                                                <RoleIcon size={8} />{role.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-xs text-slate-550 dark:text-slate-400 font-mono">{user.email || '—'}</td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${st.color}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                                                {st.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-xs text-slate-500 font-medium">
                                            {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        
                                        {canManage && (
                                            <td className="px-6 py-3 text-right relative">
                                                {!isOwner && (
                                                    <div className="relative inline-block">
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => { setEditingMember(user); setOpenMenu(null); }}
                                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors border border-indigo-200/50 dark:border-indigo-700/50">
                                                                <Settings size={11} /> Permissions
                                                            </button>
                                                            <button onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                                                <ChevronDown size={14} />
                                                            </button>
                                                        </div>
                                                        {openMenu === user.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />
                                                                <div className="absolute right-0 top-9 z-30 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-2xl shadow-xl py-1.5 overflow-hidden text-left">
                                                                    <button onClick={() => { setEditingMember(user); setOpenMenu(null); }}
                                                                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                                        <Edit3 size={13} className="text-indigo-500" /> Edit Permissions
                                                                    </button>
                                                                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                                    <button onClick={() => handleRemove(user)}
                                                                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                                                        <Trash2 size={13} /> Remove Member
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

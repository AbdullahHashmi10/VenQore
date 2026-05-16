import React, { useState, useMemo } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import {
    Users, Plus, Search, Edit3, Trash2, Shield, Mail, Clock,
    CheckCircle, XCircle, UserPlus, X, Check, ShoppingCart,
    Package, BarChart2, DollarSign, Settings, FileText, Truck,
    UserCheck, Eye, Lock, Crown, Star, Calendar, Timer, Activity,
    User, BadgeCheck, Zap, Copy, MessageCircle, Phone, RotateCcw,
    ChevronDown, AlertCircle, Send, Ban, RefreshCw, BarChart, Sparkles
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
};

// ─── Helpers ───────────────────────────────────────────────────────────────
const getRoleInfo  = (role) => ROLES[role] || ROLES.cashier;
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
export default function AdminUsers({ users = [], invitations = [], attendance = [] }) {
    const { store } = usePage().props;
    const [activeTab,    setActiveTab]    = useState('invitations');
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery,  setSearchQuery]  = useState('');
    const [copiedId,     setCopiedId]     = useState(null);
    const [openMenu,     setOpenMenu]     = useState(null);
    const [selectedUser, setSelectedUser] = useState(null); // For attendance drill-down

    const { data, setData, post, processing, errors, reset } = useForm({
        invitee_name:  '',
        invitee_email: '',
        invitee_phone: '',
        roles:         ['cashier'],
        permissions:   ROLE_PERMISSIONS.cashier,
    });

    // ── Stats
    const activeMembers    = users.filter(u => u.role !== 'platform_admin').length;
    const pendingInvites   = invitations.filter(i => ['pending', 'no_account'].includes(i.status)).length;
    const awaitingApproval = invitations.filter(i => i.status === 'awaiting_approval').length;

    // ── Filtered invitations
    const filtered = useMemo(() =>
        invitations.filter(inv => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (inv.invitee_name || '').toLowerCase().includes(q)
                || (inv.invitee_email || '').toLowerCase().includes(q)
                || (inv.short_code || '').toLowerCase().includes(q);
        }),
    [invitations, searchQuery]);

    // ── Copy code
    const handleCopy = (inv) => {
        copyToClipboard(inv.short_code);
        setCopiedId(inv.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // ── Invite form submit
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('store.admin.invitations.store', { store_slug: store?.slug }), {
            onSuccess: () => { setShowAddModal(false); reset(); },
        });
    };

    // ── Role toggle in form
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

    // ── Action helpers
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

    return (
        <OneGlanceLayout title="Team & Access Control" mode="admin">
            <Head title="Team Management" />

            <div className="h-full flex flex-col gap-6 max-w-[1600px] mx-auto">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Users className="text-indigo-500" />
                            Team Management
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Invite staff by code or magic link — no passwords, ever.</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 md:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search invitations..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                            />
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                            {[
                                { id: 'invitations', label: 'Invitations', icon: Send },
                                { id: 'members',     label: 'Members',     icon: Users },
                                { id: 'attendance',  label: 'Attendance',  icon: Clock },
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}>
                                    <tab.icon size={14} />{tab.label}
                                </button>
                            ))}
                        </div>

                        <button onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95">
                            <Send size={18} />
                            <span className="hidden sm:inline">Invite Member</span>
                        </button>
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                    <StatCard title="Active Members"    value={activeMembers}    icon={<Users size={20} className="text-white" />}         color="bg-indigo-500" />
                    <StatCard title="Pending Invites"   value={pendingInvites}   icon={<Send size={20} className="text-white" />}           color="bg-amber-500" />
                    <StatCard title="Awaiting Approval" value={awaitingApproval} icon={<AlertCircle size={20} className="text-white" />}    color="bg-blue-500"  subtext={awaitingApproval > 0 ? 'Action required' : ''} />
                    <StatCard title="Total Invitations" value={invitations.length} icon={<Activity size={20} className="text-white" />}     color="bg-slate-500" />
                </div>

                {/* ── Awaiting Approval Banner ── */}
                {awaitingApproval > 0 && (
                    <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shrink-0">
                        <AlertCircle size={18} className="text-blue-500 shrink-0" />
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            {awaitingApproval} team member{awaitingApproval > 1 ? 's' : ''} accepted their invite and {awaitingApproval > 1 ? 'are' : 'is'} waiting for your approval.
                        </span>
                    </div>
                )}

                {activeTab === 'invitations' && (
                    <InvitationsTable
                        invitations={filtered}
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
                {activeTab === 'members' && <MembersTable users={users} store={store} />}
                {activeTab === 'attendance' && (
                    <AttendanceTable 
                        attendance={attendance || { today: {}, history: {} }} 
                        users={users} 
                        onDetail={(user) => setSelectedUser(user)} 
                    />
                )}
            </div>

            {/* ── Attendance Detail Modal ── */}
            {selectedUser && (
                <AttendanceDetailModal 
                    user={selectedUser} 
                    history={attendance.history?.[selectedUser.id] || {}} 
                    onClose={() => setSelectedUser(null)} 
                />
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 overflow-y-auto custom-scrollbar">
                    <div className="bg-[#0f172a] rounded-[2rem] shadow-2xl w-full max-w-[1200px] border border-slate-700/50 flex flex-col md:flex-row relative mt-auto mb-auto">
                        
                        <button onClick={() => { setShowAddModal(false); reset(); }}
                            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-20">
                            <X size={20} />
                        </button>

                        {/* LEFT COLUMN: Form & Roles */}
                        <div className="w-full md:w-[450px] shrink-0 p-8 md:p-10 border-b md:border-b-0 md:border-r border-slate-700/50 flex flex-col bg-[#0f172a] rounded-l-[2rem]">
                            <div className="flex items-center gap-4 mb-10">
                                <h3 className="font-extrabold text-2xl text-white tracking-tight">Invite Member</h3>
                                <div className="h-4 w-px bg-slate-700"></div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">SEND INVITATION</span>
                            </div>

                            <form id="invite-form" onSubmit={handleSubmit} className="flex flex-col gap-10 flex-1">
                                
                                {/* Credentials */}
                                <div className="space-y-5">
                                    <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <User size={14} /> CREDENTIALS
                                    </h4>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5 focus-within:text-indigo-400 transition-colors text-slate-500">
                                            <label className="text-[10px] font-bold uppercase tracking-wider ml-1">Name</label>
                                            <input type="text" value={data.invitee_name} onChange={e => setData('invitee_name', e.target.value)}
                                                className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-500"
                                                placeholder="Full Name" required />
                                            {errors.invitee_name && <p className="text-[10px] text-red-400 ml-1">{errors.invitee_name}</p>}
                                        </div>
                                        <div className="space-y-1.5 focus-within:text-indigo-400 transition-colors text-slate-500">
                                            <label className="text-[10px] font-bold uppercase tracking-wider ml-1">Email</label>
                                            <input type="email" value={data.invitee_email} onChange={e => setData('invitee_email', e.target.value)}
                                                className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-500"
                                                placeholder="Email Address" required />
                                            {errors.invitee_email && <p className="text-[10px] text-red-400 ml-1">{errors.invitee_email}</p>}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5 focus-within:text-indigo-400 transition-colors text-slate-500">
                                        <label className="text-[10px] font-bold uppercase tracking-wider ml-1">Phone Number</label>
                                        <input type="text" value={data.invitee_phone} onChange={e => setData('invitee_phone', e.target.value)}
                                            className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-500"
                                            placeholder="Optional" />
                                    </div>
                                </div>

                                {/* Roles */}
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <Crown size={14} /> ASSIGN ROLE
                                        </h4>
                                        <span className="text-[10px] font-bold text-indigo-400 tracking-wider">
                                            {data.roles.length > 0 ? ROLES[data.roles[0]]?.name?.toUpperCase() : 'NONE'}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(ROLES).map(([key, role]) => {
                                            const isSelected = data.roles.includes(key);
                                            return (
                                                <button key={key} type="button" onClick={() => toggleRole(key)}
                                                    className={`p-3 rounded-xl border flex gap-3 text-left transition-all ${
                                                        isSelected
                                                            ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-600/20'
                                                            : 'bg-[#1e293b] border-[#334155] hover:border-indigo-400/50 hover:bg-[#1e293b]/80'
                                                    }`}>
                                                    <div className={`mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                                                        <role.icon size={16} />
                                                    </div>
                                                    <div>
                                                        <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>{role.name}</div>
                                                        <div className={`text-[9px] font-medium leading-tight mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>{role.description}</div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.roles && <p className="text-[10px] text-red-400 ml-1">{errors.roles}</p>}
                                </div>
                                
                            </form>
                        </div>

                        {/* RIGHT COLUMN: Permissions Visualization */}
                        <div className="flex-1 p-8 md:p-10 bg-[#0f172a] rounded-r-[2rem] flex flex-col relative overflow-hidden">
                            {/* Ambient glow in right panel */}
                            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                            
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="space-y-1">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        <Shield size={14} className="text-indigo-400" /> System Visibility
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-6">
                                        Module Access Control
                                    </p>
                                </div>
                                <div className="px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 flex items-center gap-2 tracking-widest uppercase">
                                    <Sparkles size={12} /> Live Permissions Preview
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 content-start overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                {MODULES.map(mod => {
                                    const isActive = data.permissions.includes(mod.id);
                                    return (
                                        <button key={mod.id} type="button" onClick={() => togglePermission(mod.id)}
                                            className={`p-4 rounded-[1.5rem] border-2 flex gap-4 text-left transition-all duration-300 group/mod ${
                                            isActive 
                                            ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.1)]' 
                                            : 'bg-slate-800/20 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700 hover:bg-slate-800/40'
                                        }`}>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                                                isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'bg-[#1e293b] text-slate-500 group-hover/mod:text-slate-400 group-hover/mod:scale-110'
                                            }`}>
                                                <mod.icon size={20} />
                                            </div>
                                            <div className="flex flex-col justify-center min-w-0">
                                                <div className={`text-xs font-black leading-tight truncate transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover/mod:text-slate-300'}`}>{mod.name}</div>
                                                <div className="text-[9px] text-slate-500 leading-tight mt-1 truncate">{mod.desc}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {/* Bottom Footer Actions inside Right Panel */}
                            <div className="mt-8 pt-8 border-t border-slate-800/50 flex items-center justify-between relative z-10">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        Summary
                                    </div>
                                    <div className="text-sm font-black text-white">
                                        <span className={data.permissions.length > 0 ? 'text-indigo-400' : 'text-slate-500'}>
                                             {data.permissions.length} Modules
                                        </span>
                                        <span className="text-slate-600 mx-2">/</span>
                                        <span className="text-slate-500 font-bold">{MODULES.length} Total</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button type="button" onClick={() => { setShowAddModal(false); reset(); }}
                                        className="px-6 py-3 text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors">
                                        Discard
                                    </button>
                                    <button type="submit" form="invite-form" disabled={processing || data.roles.length === 0}
                                        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all flex items-center gap-3">
                                        <Send size={16} />
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

// ─── Invitations Table ─────────────────────────────────────────────────────
function InvitationsTable({ invitations, copiedId, openMenu, setOpenMenu, onCopy, onWhatsApp, onApprove, onDecline, onRevoke, onResend }) {
    if (invitations.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Send size={64} className="stroke-[0.7]" />
                <div className="text-center">
                    <h3 className="text-lg font-semibold">No invitations yet</h3>
                    <p className="text-sm mt-1">Click "Add Member" to invite your first team member.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                        <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4">Name & Email</th>
                            <th className="px-6 py-4">Phone</th>
                            <th className="px-6 py-4">Role(s)</th>
                            <th className="px-6 py-4">Invite Code</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Expires</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {invitations.map(inv => {
                            const roles    = inv.roles || ['cashier'];
                            const roleInfo = getRoleInfo(roles[0]);
                            const RoleIcon = roleInfo.icon;
                            const st       = getStatusCfg(inv.status);

                            return (
                                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                                    {/* Name & Email */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleInfo.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                                                {(inv.invitee_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{inv.invitee_name}</p>
                                                <p className="text-xs text-slate-400 font-mono">{inv.invitee_email}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Phone */}
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {inv.invitee_phone || <span className="text-slate-300">—</span>}
                                    </td>

                                    {/* Roles */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {roles.map(r => {
                                                const ri = getRoleInfo(r);
                                                return (
                                                    <span key={r} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ri.badge}`}>
                                                        <ri.icon size={9} />{ri.name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </td>

                                    {/* Invite Code */}
                                    <td className="px-6 py-4">
                                        {inv.short_code ? (
                                            <button onClick={() => onCopy(inv)}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 rounded-lg transition-colors group/code">
                                                <code className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 group-hover/code:text-indigo-600">
                                                    {inv.short_code}
                                                </code>
                                                {copiedId === inv.id
                                                    ? <Check size={12} className="text-emerald-500" />
                                                    : <Copy size={12} className="text-slate-400 group-hover/code:text-indigo-500" />
                                                }
                                            </button>
                                        ) : (
                                            <span className="text-slate-300 text-xs">—</span>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${st.color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                                            {st.label}
                                        </span>
                                        {/* Approve/Decline buttons for awaiting_approval */}
                                        {inv.status === 'awaiting_approval' && (
                                            <div className="flex items-center gap-1 mt-2">
                                                <button onClick={() => onApprove(inv)}
                                                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors">
                                                    <Check size={10} /> Approve
                                                </button>
                                                <button onClick={() => onDecline(inv)}
                                                    className="flex items-center gap-1 px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-colors">
                                                    <X size={10} /> Decline
                                                </button>
                                            </div>
                                        )}
                                    </td>

                                    {/* Expires */}
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </td>

                                    {/* 3-dot Menu */}
                                    <td className="px-6 py-4 text-right relative">
                                        <div className="relative inline-block">
                                            <button onClick={() => setOpenMenu(openMenu === inv.id ? null : inv.id)}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors opacity-0 group-hover:opacity-100">
                                                <ChevronDown size={16} />
                                            </button>
                                            {openMenu === inv.id && (
                                                <div className="absolute right-0 top-10 z-30 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-2 overflow-hidden">
                                                    {/* WhatsApp */}
                                                    <button onClick={() => { whatsappShare(inv); setOpenMenu(null); }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                        <MessageCircle size={14} className="text-emerald-500" /> Share via WhatsApp
                                                    </button>
                                                    {/* Copy Code */}
                                                    <button onClick={() => { handleCopy(inv); setOpenMenu(null); }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                        <Copy size={14} className="text-indigo-500" /> Copy Invite Code
                                                    </button>
                                                    {/* Resend */}
                                                    {['pending', 'no_account', 'expired'].includes(inv.status) && (
                                                        <button onClick={() => { action('store.admin.invitations.resend', inv); setOpenMenu(null); }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                            <RefreshCw size={14} className="text-blue-500" /> Resend (+48h)
                                                        </button>
                                                    )}
                                                    {/* Revoke */}
                                                    {['pending', 'no_account', 'awaiting_approval'].includes(inv.status) && (
                                                        <>
                                                            <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                                                            <button onClick={() => { action('store.admin.invitations.revoke', inv); setOpenMenu(null); }}
                                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                                <Ban size={14} /> Revoke Invite
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
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


// ─── Attendance Table ──────────────────────────────────────────────────────
function AttendanceTable({ attendance, users, onDetail }) {
    const todayData = attendance.today || {};
    const staff = users.filter(u => u.role !== 'platform_admin');

    return (
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                        <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4">Staff Member</th>
                            <th className="px-6 py-4">Today's First In</th>
                            <th className="px-6 py-4">Current Status</th>
                            <th className="px-6 py-4">Total Time Today</th>
                            <th className="px-6 py-4 text-right">Activity Insight</th>
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
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-sm group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{user.name}</p>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{user.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                                        {data?.first_in || <span className="text-slate-300">Not arrived</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                            isActive 
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                            {isActive ? 'Present now' : 'Logged out'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
                                        {totalTime}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-500 transition-all">
                                            <BarChart size={18} />
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

// ─── Attendance Detail Modal ───────────────────────────────────────────────
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
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[650px]">
                <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-slate-800 dark:text-white leading-none">{user.name}</h3>
                            <p className="text-sm text-slate-500 mt-1 uppercase font-bold tracking-widest">{user.role} Analytics</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl">
                            {['7', '14', '30'].map(range => (
                                <button key={range} onClick={() => setDateRange(range)}
                                    className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${
                                        dateRange === range 
                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' 
                                            : 'text-slate-500'
                                    }`}>
                                    {range} Days
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="space-y-8 h-full flex flex-col">
                        <div className="flex justify-between items-end">
                            <div>
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Login & Logout Consistency</h4>
                                <p className="text-xs text-slate-500 mt-1">Timeline of first daily check-in vs last daily check-out.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Arrival Time</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Departure Time</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[300px] w-full bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 relative overflow-hidden">
                            <div className="absolute inset-6">
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
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} dy={10} />
                                        <YAxis domain={[0, 24]} axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} tickFormatter={formatYAxis} ticks={[0, 4, 8, 12, 16, 20, 24]} />
                                        <Tooltip content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-2xl">
                                                        <p className="text-xs font-black text-slate-800 dark:text-white mb-2">{payload[0].payload.date}</p>
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-4 justify-between">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">First In:</span>
                                                                <span className="text-xs font-bold text-indigo-600">{payload[0].payload.inLabel || '—'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4 justify-between">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Last Out:</span>
                                                                <span className="text-xs font-bold text-rose-500">{payload[0].payload.outLabel || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }} />
                                        <Area type="monotone" dataKey="in" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                                        <Area type="monotone" dataKey="out" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
                                        <ReferenceLine y={9} stroke="#6366f1" strokeDasharray="3 3" opacity={0.3} label={{ position: 'right', value: '9 AM', fill: '#6366f1', fontSize: 10 }} />
                                        <ReferenceLine y={18} stroke="#f43f5e" strokeDasharray="3 3" opacity={0.3} label={{ position: 'right', value: '6 PM', fill: '#f43f5e', fontSize: 10 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                                <div className="flex items-center gap-2 mb-1">
                                    <Zap size={14} className="text-indigo-500" />
                                    <span className="text-[10px] font-black text-indigo-600 uppercase">Average In</span>
                                </div>
                                <p className="text-lg font-black text-indigo-700 dark:text-indigo-400">
                                    {chartData.filter(d => d.in).length > 0 ? (() => {
                                        const avg = chartData.filter(d => d.in).reduce((s,d) => s + d.in, 0) / chartData.filter(d => d.in).length;
                                        const h = Math.floor(avg);
                                        const m = Math.round((avg - h) * 60);
                                        return `${h}:${m < 10 ? '0'+m : m}`;
                                    })() : '—'}
                                </p>
                            </div>
                            <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-800">
                                <div className="flex items-center gap-2 mb-1">
                                    <RotateCcw size={14} className="text-rose-500" />
                                    <span className="text-[10px] font-black text-rose-600 uppercase">Average Out</span>
                                </div>
                                <p className="text-lg font-black text-rose-700 dark:text-rose-400">
                                    {chartData.filter(d => d.out).length > 0 ? (() => {
                                        const avg = chartData.filter(d => d.out).reduce((s,d) => s + d.out, 0) / chartData.filter(d => d.out).length;
                                        const h = Math.floor(avg);
                                        const m = Math.round((avg - h) * 60);
                                        return `${h}:${m < 10 ? '0'+m : m}`;
                                    })() : '—'}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-slate-500">
                                    <Activity size={14} />
                                    <span className="text-[10px] font-black uppercase">Punctuality</span>
                                </div>
                                <p className="text-lg font-black text-slate-800 dark:text-white">Professional</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Members Table ─────────────────────────────────────────────────────────
function MembersTable({ users, store }) {
    const filtered = users.filter(u => u.role !== 'platform_admin');
    if (filtered.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Users size={64} className="stroke-[0.7]" />
                <p className="text-sm">No active members yet. Invite someone to get started.</p>
            </div>
        );
    }
    return (
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                        <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4">Member</th>
                            <th className="px-6 py-4">Role & Access</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filtered.map(user => {
                            const role = getRoleInfo(user.role);
                            const RoleIcon = role.icon;
                            return (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white font-bold shadow-md`}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{user.name}</p>
                                                <p className="text-xs text-slate-400 font-mono">ID: {user.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${role.badge}`}>
                                            <RoleIcon size={10} />{role.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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

// ─── StatCard ──────────────────────────────────────────────────────────────
function StatCard({ title, value, icon, color, subtext }) {
    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">{value || 0}</h3>
                {subtext && <p className="text-[10px] text-amber-500 font-semibold mt-1">{subtext}</p>}
            </div>
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
        </div>
    );
}

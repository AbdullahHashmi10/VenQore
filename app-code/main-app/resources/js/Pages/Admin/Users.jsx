import React, { useState, useMemo, useEffect } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import {
    Users, Plus, Search, Edit3, Trash2, Shield, Mail, Clock,
    CheckCircle, XCircle, UserPlus, X, Check, ShoppingCart,
    Package, BarChart2, DollarSign, Settings, FileText, Truck,
    UserCheck, Eye, Lock, Crown, Star, Calendar, Timer, Activity,
    User, BadgeCheck, Zap, Copy, MessageCircle, Phone, RotateCcw,
    ChevronDown, AlertCircle, Send, Ban, RefreshCw, BarChart, Sparkles, Award, TrendingUp, ChevronRight
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine
} from 'recharts';
import { getCurrencySymbol } from '@/Utils/format';

import { vq } from '@/theme/runtime';
// ─── Role definitions ──────────────────────────────────────────────────────
const ROLES = {
    owner:           { name: 'Owner', description: 'Store owner — full access', icon: Crown,        color: 'from-amber-500 to-yellow-600', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    admin:           { name: 'Admin', description: 'Full management access', icon: Shield,       color: 'from-brand-500 to-brand-700', badge: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400' },
    manager:         { name: 'Manager', description: 'Operations manager', icon: Star,         color: 'from-blue-500 to-cyan-600', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
    cashier:         { name: 'Cashier', description: 'POS & Sales only', icon: ShoppingCart, color: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
    inventory_staff: { name: 'Inventory Staff', description: 'Stock management', icon: Package,      color: 'from-orange-500 to-red-600', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' },
    accountant:      { name: 'Accountant', description: 'Financial reporting', icon: DollarSign,   color: 'from-brand-800 to-brand-900', badge: 'bg-brand-100 text-brand-800 dark:bg-brand-800/30 dark:text-brand-300' },
    support:         { name: 'Support', description: 'Troubleshooting & Help', icon: BadgeCheck,   color: 'from-lime-500 to-lime-600', badge: 'bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-400' },
    custom:          { name: 'Custom', description: 'Specific permissions', icon: Settings,     color: 'from-neutral-500 to-neutral-600', badge: 'bg-neutral-100 text-ink-secondary dark:bg-neutral-500/20 dark:text-ink-muted' },
    viewer:          { name: 'Viewer', description: 'Read-only access', icon: Eye,          color: 'from-neutral-500 to-neutral-600', badge: 'bg-neutral-100 text-ink-secondary dark:bg-neutral-500/20 dark:text-ink-secondary' },
};

const ROLE_PERMISSIONS = {
    admin: [
        'pos.open_session', 'pos.checkout', 'pos.discounts', 'pos.void_item', 'pos.refund', 'pos.close_session',
        'sales.view', 'sales.create', 'sales.edit', 'sales.void', 'sales.quotations', 'sales.returns',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.adjust', 'inventory.transfer', 'inventory.barcodes',
        'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.void', 'purchases.costs', 'purchases.suppliers',
        'finance.balances', 'finance.transactions', 'finance.receive_payment', 'finance.send_payment', 'finance.expenses', 'finance.journal',
        'reports.summary', 'reports.financial', 'reports.stock', 'reports.performance', 'reports.audit',
        'admin.staff_view', 'admin.staff_manage', 'admin.settings_view', 'admin.settings_manage', 'admin.receipt_print', 'admin.taxes_methods', 'admin.warehouses', 'admin.data_recovery'
    ],
    manager: [
        'pos.open_session', 'pos.checkout', 'pos.discounts', 'pos.void_item', 'pos.refund', 'pos.close_session',
        'sales.view', 'sales.create', 'sales.edit', 'sales.void', 'sales.quotations', 'sales.returns',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.transfer', 'inventory.barcodes',
        'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.costs', 'purchases.suppliers',
        'reports.summary', 'reports.stock', 'reports.performance',
        'admin.staff_view', 'admin.settings_view', 'admin.receipt_print'
    ],
    cashier: [
        'pos.open_session', 'pos.checkout', 'pos.discounts', 'pos.close_session',
        'inventory.view'
    ],
    inventory_staff: [
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.transfer', 'inventory.barcodes',
        'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.costs', 'purchases.suppliers',
        'reports.stock'
    ],
    accountant: [
        'finance.balances', 'finance.transactions', 'finance.receive_payment', 'finance.send_payment', 'finance.expenses', 'finance.journal',
        'reports.summary', 'reports.financial', 'reports.audit',
        'sales.view', 'purchases.view', 'inventory.view'
    ],
    support: [
        'reports.audit',
        'admin.staff_view', 'admin.staff_manage', 'admin.settings_view', 'admin.settings_manage'
    ],
    viewer: [
        'reports.summary', 'reports.financial', 'reports.stock',
        'sales.view', 'inventory.view', 'purchases.view', 'finance.transactions'
    ],
    custom: []
};

const PERMISSION_CATEGORIES = [
    {
        id: 'pos_register',
        name: 'POS & Register',
        desc: 'Register cash flow and checkout operations',
        icon: ShoppingCart,
        permissions: [
            { id: 'pos.checkout', name: 'Scan & Checkout', desc: 'Process sales and payments at the register' },
            { id: 'pos.discounts', name: 'Apply Cart Discounts', desc: 'Apply discounts to active shopping cart items' },
            { id: 'pos.refund', name: 'Register Refunds', desc: 'Process customer returns & refunds directly at the POS' },
        ]
    },
    {
        id: 'sales_invoices',
        name: 'Sales & Invoices',
        desc: 'Direct sales orders, invoices, and quotations',
        icon: FileText,
        permissions: [
            { id: 'sales.view', name: 'View Sales Directory', desc: 'View complete list of store sales and invoice records' },
            { id: 'sales.create', name: 'Create Sales Invoices', desc: 'Generate new direct invoices and sales orders' },
            { id: 'sales.edit', name: 'Edit Sales Invoices', desc: 'Modify existing sales drafts or unpaid invoices' },
            { id: 'sales.void', name: 'Void/Cancel Invoices', desc: 'Permanently cancel or delete completed sales' },
            { id: 'sales.quotations', name: 'Quotations & Proposals', desc: 'Create and manage client estimates & quotes' },
            { id: 'sales.returns', name: 'Standard Returns', desc: 'Handle standard customer returns and refund logs' },
        ]
    },
    {
        id: 'stock_inventory',
        name: 'Stock & Inventory',
        desc: 'Product catalog and warehouse adjustments',
        icon: Package,
        permissions: [
            { id: 'inventory.view', name: 'View Products & Stock', desc: 'Access the products catalog and view stock levels' },
            { id: 'inventory.create', name: 'Add New Products', desc: 'Add new items and setup product variations' },
            { id: 'inventory.edit', name: 'Edit Products', desc: 'Edit product details, selling prices, and attributes' },
            { id: 'inventory.delete', name: 'Delete Products', desc: 'Permanently remove items from the catalog' },
            { id: 'inventory.adjust', name: 'Manual Stock Adjustments', desc: 'Manually adjust stock for lost/damaged inventory' },
            { id: 'inventory.transfer', name: 'Warehouse Transfers', desc: 'Record moving stock between warehouse depots' },
            { id: 'inventory.barcodes', name: 'Print Barcode Labels', desc: 'Generate barcode stickers for items' },
        ]
    },
    {
        id: 'purchasing_suppliers',
        name: 'Purchasing & Procurement',
        desc: 'Vendor POs, supply records, and COGS margins',
        icon: Truck,
        permissions: [
            { id: 'purchases.view', name: 'View Purchases', desc: 'View past supplier purchases & expense records' },
            { id: 'purchases.create', name: 'Create Purchase Orders', desc: 'Generate new Purchase Orders (POs)' },
            { id: 'purchases.edit', name: 'Edit Purchase Orders', desc: 'Modify pending or draft purchase orders' },
            { id: 'purchases.void', name: 'Void Purchase Orders', desc: 'Cancel or delete purchase orders' },
            { id: 'purchases.costs', name: 'Wholesale Cost Viewer', desc: 'View wholesale purchase prices & cost histories' },
            { id: 'purchases.suppliers', name: 'Manage Suppliers', desc: 'Create supplier directories and log ledgers' },
        ]
    },
    {
        id: 'money_finance',
        name: 'Money & Finance',
        desc: 'Petty cash, bank accounts, and giving/taking money',
        icon: DollarSign,
        permissions: [
            { id: 'finance.balances', name: 'View Cash & Bank Balances', desc: 'View safe deposit box, registers, & bank balances' },
            { id: 'finance.transactions', name: 'View Cash Flow Ledger', desc: 'View list of all recent payments & cash flow history' },
            { id: 'finance.receive_payment', name: 'Record Customer Payments', desc: 'Collect and record outstanding client money' },
            { id: 'finance.send_payment', name: 'Record Vendor Payments', desc: 'Record payouts & pay outstanding supplier balances' },
            { id: 'finance.expenses', name: 'Record Business Expenses', desc: 'Record operational expenses (bills, rent, electricity)' },
            { id: 'finance.journal', name: 'Accounting Journal Entries', desc: 'Create debit/credit adjustments (bookkeeper overrides)' },
        ]
    },
    {
        id: 'insights_reports',
        name: 'Insights & Reports',
        desc: 'Net profit margins, audits, and performance tracking',
        icon: BarChart2,
        permissions: [
            { id: 'reports.summary', name: 'Dashboard KPI Viewer', desc: 'View net margins, global sales stats, & dashboard KPIs' },
            { id: 'reports.financial', name: 'Financial Statements', desc: 'Export Balance Sheets, Tax Summaries, & Profit/Loss reports' },
            { id: 'reports.stock', name: 'Stock Reports', desc: 'Track low-stock warnings and movement histories' },
            { id: 'reports.performance', name: 'Staff Sales Performance', desc: 'Access leaderboard metrics & staff sales counts' },
            { id: 'reports.audit', name: 'Security Audit Logs', desc: 'Read audit trails showing exactly who performed what action' },
        ]
    },
    {
        id: 'store_admin',
        name: 'Store Administration',
        desc: 'Staff recruitments, VAT configurations, and system backups',
        icon: Settings,
        permissions: [
            { id: 'admin.staff_view', name: 'View Staff & Attendance', desc: 'View staff schedules, attendance logs, and hour sheets' },
            { id: 'admin.staff_manage', name: 'Manage Team & Permissions', desc: 'Invite staff, edit roles, change checkboxes, or suspend' },
            { id: 'admin.settings_view', name: 'View General Settings', desc: 'Access store details and active configurations' },
            { id: 'admin.settings_manage', name: 'Edit General Settings', desc: 'Update operating hours, store names, or upload logos' },
            { id: 'admin.receipt_print', name: 'Receipt & Print Settings', desc: 'Customize invoice layout printing options' },
            { id: 'admin.taxes_methods', name: 'Manage Taxes & Payments', desc: 'Configure VAT sales tax rates & store payment modes' },
            { id: 'admin.warehouses', name: 'Manage Warehouses', desc: 'Create new branches and inventory warehouses' },
            { id: 'admin.data_recovery', name: 'Data & Disaster Recovery', desc: 'Restore voided items via recycle bin, or export tables' },
            { id: 'admin.billing_store', name: 'Billing & Store Deletion', desc: 'Upgrade subscriptions, change cards, or delete store database (owner)' },
        ]
    }
];

const PermissionsSelector = ({ selectedPermissions = [], onChange, disabled = false }) => {
    const handleToggle = (permId) => {
        if (disabled) return;
        const isSelected = selectedPermissions.includes(permId);
        const newPerms = isSelected
            ? selectedPermissions.filter(p => p !== permId)
            : [...selectedPermissions, permId];
        onChange(newPerms);
    };

    const handleToggleCategory = (catId, catPerms) => {
        if (disabled) return;
        const allSelected = catPerms.every(p => selectedPermissions.includes(p.id));
        let newPerms;
        if (allSelected) {
            newPerms = selectedPermissions.filter(p => !catPerms.some(cp => cp.id === p));
        } else {
            const toAdd = catPerms.map(cp => cp.id).filter(id => !selectedPermissions.includes(id));
            newPerms = [...selectedPermissions, ...toAdd];
        }
        onChange(newPerms);
    };

    return (
        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 max-h-[500px]">
            {PERMISSION_CATEGORIES.map(cat => {
                const catPerms = cat.permissions;
                const isCatActive = catPerms.every(p => selectedPermissions.includes(p.id));
                const isCatPartial = catPerms.some(p => selectedPermissions.includes(p.id)) && !isCatActive;
                const CatIcon = cat.icon;

                return (
                    <div key={cat.id} className="bg-neutral-800/30 border border-neutral-700/30 rounded-2xl p-4 transition-all hover:border-line-strong">
                        {/* Category Header */}
                        <div className="flex items-center justify-between gap-4 mb-3 pb-3 border-b border-neutral-800/60">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-800 text-ink-faint`}>
                                    <CatIcon size={16} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white leading-tight">{cat.name}</h4>
                                    <p className="text-3xs text-ink-muted leading-tight mt-0.5">{cat.desc}</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => handleToggleCategory(cat.id, catPerms)}
                                className={`px-2 py-0.5 rounded-lg text-3xs font-bold uppercase tracking-wider transition-all border ${
                                    isCatActive
                                        ? 'bg-brand-600/20 border-brand-500 text-brand-400'
                                        : isCatPartial
                                            ? 'bg-amber-600/15 border-amber-500/50 text-amber-400'
                                            : 'bg-sunken/50 border-neutral-700/50 text-ink-muted hover:text-white'
                                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                {isCatActive ? 'Full Access' : isCatPartial ? 'Partial' : 'No Access'}
                            </button>
                        </div>

                        {/* Sub Permissions Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {catPerms.map(perm => {
                                const isActive = selectedPermissions.includes(perm.id);
                                return (
                                    <button
                                        key={perm.id}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => handleToggle(perm.id)}
                                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all duration-normal group/mod ${
                                            isActive
                                                ? 'bg-brand-600/10 border-brand-500/40 shadow-[0_0_15px_rgba(79,70,229,0.05)]'
                                                : 'bg-sunken/20 border-neutral-900 opacity-60 hover:opacity-100 hover:border-line-strong hover:bg-interactive-hover'
                                        } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                                            isActive
                                                ? 'bg-brand-600 border-brand-500 text-white'
                                                : 'border-neutral-700 bg-neutral-800'
                                        }`}>
                                            {isActive && <Check size={8} strokeWidth={3} />}
                                        </div>
                                        <div className="flex flex-col justify-center min-w-0">
                                            <div className={`text-2xs font-bold leading-tight truncate ${isActive ? 'text-white' : 'text-ink-muted group-hover/mod:text-neutral-300'}`}>{perm.name}</div>
                                            <div className="text-4xs text-ink-muted leading-tight mt-0.5 truncate">{perm.desc}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS = {
    pending:            { label: 'Pending', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700', dot: 'bg-amber-500' },
    no_account:         { label: 'No Account', color: 'text-ink-muted bg-neutral-50 border-line dark:bg-surface dark:text-ink-muted dark:border-line', dot: 'bg-neutral-400' },
    awaiting_approval:  { label: 'Awaiting Approval', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700', dot: 'bg-blue-500 animate-pulse' },
    active:             { label: 'Active', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700', dot: 'bg-emerald-500 animate-pulse' },
    expired:            { label: 'Expired', color: 'text-red-500 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800', dot: 'bg-red-500' },
    revoked:            { label: 'Revoked', color: 'text-red-400 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800', dot: 'bg-red-400' },
    declined:           { label: 'Declined', color: 'text-ink-muted bg-neutral-50 border-line dark:bg-surface dark:text-ink-muted', dot: 'bg-neutral-400' },
    suspended:          { label: 'Suspended', color: 'text-red-500 bg-red-50 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800', dot: 'bg-red-500' },
};

// ─── Helpers ───────────────────────────────────────────────────────────────
const getRoleInfo  = (role) => ROLES[role] || ROLES.viewer;
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
export default function AdminUsers({ users = [], invitations = [], attendance = [], staffData = [] }) {
    const { store } = usePage().props;
    const [activeTab,    setActiveTab]    = useState('members');
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery,  setSearchQuery]  = useState('');
    const [copiedId,     setCopiedId]     = useState(null);
    const [openMenu,     setOpenMenu]     = useState(null);
    const [selectedUser, setSelectedUser] = useState(null); // For attendance drill-down
    const [sortConfig,   setSortConfig]   = useState('sales');

    const groups = [
        {
            id: 'team',
            label: 'Team',
            icon: Users,
            items: [
                { id: 'members', label: 'Members List', icon: Users },
                { id: 'invitations', label: 'Invitations', icon: Send },
            ]
        },
        {
            id: 'attendance',
            label: 'Attendance & Sales',
            icon: Clock,
            items: [
                { id: 'attendance', label: 'Attendance Logs', icon: Clock },
                { id: 'summaries', label: 'Staff Summaries', icon: BarChart2 },
            ]
        }
    ];

    const getInitialGroup = () => {
        const foundGroup = groups.find(g => g.items.some(item => item.id === activeTab));
        return foundGroup ? foundGroup.id : 'team';
    };

    const [activeGroup, setActiveGroup] = useState(getInitialGroup);

    useEffect(() => {
        const foundGroup = groups.find(g => g.items.some(item => item.id === activeTab));
        if (foundGroup) {
            setActiveGroup(foundGroup.id);
        }
    }, [activeTab]);

    // Calculate aggregated stats
    const stats = useMemo(() => {
        const data = staffData || [];
        return {
            totalStaff: data.length,
            totalSales: data.reduce((sum, s) => sum + (s.totalSales || 0), 0),
            totalTransactions: data.reduce((sum, s) => sum + (s.transactionCount || 0), 0),
            topPerformer: data.reduce((prev, current) => (prev.totalSales > current.totalSales) ? prev : current, {})
        };
    }, [staffData]);

    // Filter Summaries list
    const filteredSummaries = useMemo(() => {
        const data = staffData || [];
        let result = data.filter(s =>
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

    const attendanceStats = useMemo(() => {
        const todayLogs = Object.values(attendance?.today || {});
        const activeNow = todayLogs.filter(a => a.is_active).length;
        const totalPresent = todayLogs.length;
        const totalMins = todayLogs.reduce((sum, a) => sum + (a.total_mins || 0), 0);
        const totalHours = (totalMins / 60).toFixed(1);

        return {
            activeNow,
            totalPresent,
            totalHours: `${totalHours} hrs`,
            totalStaff: users.filter(u => u.role !== 'platform_admin').length
        };
    }, [attendance, users]);

    const formatCurrency = (value) => {
        return (getCurrencySymbol()) + ' ' + (parseFloat(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    };

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
        if (!store?.slug) return;
        post(route('store.admin.invitations.store', { store_slug: store.slug }), {
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
        if (!store?.slug) return;
        router.post(route(routeName, { store_slug: store.slug, invitation: inv.id }), {}, {
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

            <div className="h-full flex flex-col gap-3 max-w-[1600px] mx-auto">

                {/* ── Premium Grouped Tab Header ── */}
                <div className="flex flex-col lg:flex-row items-center gap-4 bg-surface border border-line p-2 rounded-2xl shadow-sm shrink-0">
                    {/* Level 1: Category Selector */}
                    <div className="flex items-center gap-1 bg-sunken p-1.5 rounded-xl shrink-0 overflow-x-auto max-w-full">
                        {groups.map((group) => {
                            const Icon = group.icon;
                            const isActive = activeGroup === group.id;

                            return (
                                <button
                                    key={group.id}
                                    onClick={() => {
                                        setActiveGroup(group.id);
                                        setActiveTab(group.items[0].id);
                                    }}
                                    className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-normal whitespace-nowrap
                                        ${isActive
                                            ? 'bg-sunken text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                            : 'text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 hover:bg-interactive-hover dark:hover:bg-interactive-hover'
                                        }
`}
                                >
                                    <Icon size={13} className={isActive ? 'opacity-100' : 'opacity-70'} />
                                    {group.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Separator / Arrow */}
                    <div className="hidden lg:flex items-center text-neutral-300 dark:text-ink-secondary">
                        <ChevronRight size={16} />
                    </div>

                    {/* Level 2: Sub Navigation Items */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full lg:w-auto flex-1">
                        {groups.find(g => g.id === activeGroup)?.items.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-normal border whitespace-nowrap
                                        ${isActive
                                            ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400 font-bold'
                                            : 'bg-transparent border-transparent text-ink-secondary hover:bg-interactive-hover hover:border-line dark:text-ink-muted dark:hover:bg-interactive-hover dark:hover:border-line-strong'
                                        }
`}
                                >
                                    <Icon size={13} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Midnight Nebula Action Button */}
                    <div className="shrink-0 self-stretch flex items-center">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="relative h-full px-5 py-2.5 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-slow flex items-center gap-2 overflow-hidden group shadow-xl"
                        >
                            {/* Midnight Nebula Background */}
                            <div className="absolute inset-0 bg-neutral-900 z-0">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-brand-600/50 rounded-full blur-xl -translate-y-1/2 translate-x-1/4 group-hover:bg-brand-500/60 transition-colors animate-pulse"></div>
                                <div className="absolute bottom-0 left-0 w-16 h-16 bg-brand-600/30 rounded-full blur-xl translate-y-1/3 -translate-x-1/3 group-hover:bg-brand-500/40 transition-colors"></div>
                                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-60"></div>
                            </div>
                            {/* Content */}
                            <Plus size={16} strokeWidth={3} className="relative z-10" />
                            <span className="hidden sm:inline relative z-10">Invite Member</span>
                        </button>
                    </div>
                </div>

                {/* ── Stats ── */}
                {['members', 'invitations'].includes(activeTab) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
                        <StatCard title="Active Members" value={activeMembers}    icon={<Users size={16} />}         color="bg-brand-500" />
                        <StatCard title="Pending Invites" value={pendingInvites}   icon={<Send size={16} />}           color="bg-amber-500" />
                        <StatCard title="Awaiting Approval" value={awaitingApproval} icon={<AlertCircle size={16} />} color="bg-blue-500" subtext={awaitingApproval > 0 ? 'Action required' : ''} />
                        <StatCard title="Total Invitations" value={invitations.length} icon={<Activity size={16} />} color="bg-neutral-500" />
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
                        <StatCard title="On Duty Now" value={attendanceStats.activeNow}    icon={<Clock size={16} />}         color="bg-emerald-500" />
                        <StatCard title="Present Today" value={attendanceStats.totalPresent} icon={<UserCheck size={16} />}     color="bg-brand-500" />
                        <StatCard title="Total Time Logged" value={attendanceStats.totalHours} icon={<Timer size={16} />}         color="bg-blue-500" />
                        <StatCard title="Total Staff" value={attendanceStats.totalStaff}   icon={<Users size={16} />}         color="bg-neutral-500" />
                    </div>
                )}

                {activeTab === 'summaries' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
                        <StatCard title="Active Staff" value={stats.totalStaff}             icon={<Users size={16} />}         color="bg-brand-500" />
                        <StatCard title="Total Sales" value={formatCurrency(stats.totalSales)} icon={<DollarSign size={16} />}   color="bg-emerald-500" />
                        <StatCard title="Transactions" value={stats.totalTransactions}      icon={<Package size={16} />}       color="bg-blue-500" />
                        <StatCard title="Top Performer" value={stats.topPerformer.name || '-'} icon={<Award size={16} />} color="bg-amber-500" subtext={stats.topPerformer.totalSales ? formatCurrency(stats.topPerformer.totalSales) : ''} />
                    </div>
                )}

                {/* ── Sub Header / Search & Filters Bar ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface border border-line p-3 rounded-2xl shadow-sm gap-4 shrink-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
                            {activeTab === 'members' && 'Team Members'}
                            {activeTab === 'invitations' && 'Invitations & Invites'}
                            {activeTab === 'attendance' && 'Attendance Registry'}
                            {activeTab === 'summaries' && 'Performance Summaries'}
                        </h2>
                        <div className="h-4 w-px bg-sunken dark:bg-surface mx-2" />

                        {activeTab === 'summaries' ? (
                            <div className="flex items-center gap-1.5">
                                <span className="text-3xs font-bold text-ink-muted uppercase tracking-widest mr-1">Sort:</span>
                                <button
                                    onClick={() => setSortConfig('sales')}
                                    className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-md transition-all ${sortConfig === 'sales'
                                        ? 'bg-emerald-600 text-white shadow-sm font-bold'
                                        : 'bg-sunken text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover'
                                        }`}
                                >Total Sales</button>
                                <button
                                    onClick={() => setSortConfig('transactions')}
                                    className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-md transition-all ${sortConfig === 'transactions'
                                        ? 'bg-brand-600 text-white shadow-sm font-bold'
                                        : 'bg-sunken text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover'
                                        }`}
                                >Transactions</button>
                                <button
                                    onClick={() => setSortConfig('avg')}
                                    className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-md transition-all ${sortConfig === 'avg'
                                        ? 'bg-brand-600 text-white shadow-sm font-bold'
                                        : 'bg-sunken text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover'
                                        }`}
                                >Avg. Ticket</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 bg-sunken p-0.5 rounded-lg text-2xs font-bold uppercase">
                                <span className="px-2.5 py-1 bg-brand-600 text-white rounded-md shadow-sm">All</span>
                            </div>
                        )}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full md:w-72 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted group-focus-within:text-brand-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 text-xs border border-line rounded-xl bg-app text-ink focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm"
                        />
                    </div>
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
                {activeTab === 'summaries' && (
                    <div className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto">
                        {/* Staff Sales Grid */}
                        <div className="pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredSummaries.length > 0 ? (
                                    filteredSummaries.map((staff, index) => (
                                        <div key={staff.id || index} className="relative bg-surface rounded-2xl border border-line shadow-sm p-4 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all group">
                                            {index === 0 && sortConfig === 'sales' && (
                                                <div className="absolute top-3 right-3 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-2xs font-bold flex items-center gap-1 shadow-sm">
                                                    <Award size={10} /> Top Sales
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                                                    index === 1 ? 'bg-gradient-to-br from-neutral-400 to-neutral-500' :
                                                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                                                            'bg-gradient-brand'
                                                    }`}>
                                                    {staff.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-ink truncate max-w-[150px]">{staff.name}</h3>
                                                    <p className="text-xs text-ink-muted">{staff.role}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between p-2 rounded-xl bg-app">
                                                    <div className="flex items-center gap-2 text-ink-muted">
                                                        <DollarSign size={13} />
                                                        <span className="text-xs font-medium">Total Sales</span>
                                                    </div>
                                                    <span className="font-bold text-sm text-ink">
                                                        {formatCurrency(staff.totalSales)}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2 rounded-xl bg-app">
                                                        <div className="flex items-center gap-1.5 text-ink-muted mb-1">
                                                            <Package size={11} />
                                                            <span className="text-3xs font-bold uppercase">Txns</span>
                                                        </div>
                                                        <p className="font-bold text-ink">{staff.transactionCount}</p>
                                                    </div>
                                                    <div className="p-2 rounded-xl bg-app">
                                                        <div className="flex items-center gap-1.5 text-ink-muted mb-1">
                                                            <TrendingUp size={11} />
                                                            <span className="text-3xs font-bold uppercase">Avg</span>
                                                        </div>
                                                        <p className="font-bold text-ink max-w-full truncate">
                                                            {getCurrencySymbol()} {Math.round(staff.avgTransaction).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-2 border-t border-line text-xs text-ink-muted">
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={11} />
                                                        Last Active:
                                                    </div>
                                                    <span className="font-medium text-ink-secondary">{staff.lastActive}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-4">
                                            <Users size={32} className="text-ink-muted" />
                                        </div>
                                        <h3 className="text-lg font-bold text-ink-secondary dark:text-white">No staff performance data</h3>
                                        <p className="text-ink-muted">Try adjusting your search criteria</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
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
                <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 overflow-y-auto custom-scrollbar">
                    <div className="bg-neutral-900 rounded-xl shadow-2xl w-full max-w-[1200px] border border-neutral-700/50 flex flex-col md:flex-row relative mt-auto mb-auto">

                        <button onClick={() => { setShowAddModal(false); reset(); }}
                            className="absolute top-6 right-6 p-2 rounded-full text-ink-muted hover:text-white hover:bg-interactive-hover transition-colors z-20">
                            <X size={20} />
                        </button>

                        {/* LEFT COLUMN: Form & Roles */}
                        <div className="w-full md:w-[450px] shrink-0 p-8 md:p-10 border-b md:border-b-0 md:border-r border-neutral-700/50 flex flex-col bg-neutral-900 rounded-l-xl">
                            <div className="flex items-center gap-4 mb-10">
                                <h3 className="font-bold text-2xl text-white tracking-tight">Invite Member</h3>
                                <div className="h-4 w-px bg-neutral-700"></div>
                                <span className="text-xs font-bold text-ink-muted uppercase tracking-widest">SEND INVITATION</span>
                            </div>

                            <form id="invite-form" onSubmit={handleSubmit} className="flex flex-col gap-10 flex-1">

                                {/* Credentials */}
                                <div className="space-y-5">
                                    <h4 className="flex items-center gap-2 text-2xs font-bold text-ink-muted uppercase tracking-widest">
                                        <User size={14} /> CREDENTIALS
                                    </h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5 focus-within:text-brand-400 transition-colors text-ink-muted">
                                            <label className="text-2xs font-bold uppercase tracking-wider ml-1">Name</label>
                                            <input type="text" value={data.invitee_name} onChange={e => setData('invitee_name', e.target.value)}
                                                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted"
                                                placeholder="Full Name" required />
                                            {errors.invitee_name && <p className="text-2xs text-red-400 ml-1">{errors.invitee_name}</p>}
                                        </div>
                                        <div className="space-y-1.5 focus-within:text-brand-400 transition-colors text-ink-muted">
                                            <label className="text-2xs font-bold uppercase tracking-wider ml-1">Email</label>
                                            <input type="email" value={data.invitee_email} onChange={e => setData('invitee_email', e.target.value)}
                                                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted"
                                                placeholder="Email Address" required />
                                            {errors.invitee_email && <p className="text-2xs text-red-400 ml-1">{errors.invitee_email}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 focus-within:text-brand-400 transition-colors text-ink-muted">
                                        <label className="text-2xs font-bold uppercase tracking-wider ml-1">Phone Number</label>
                                        <input type="text" value={data.invitee_phone} onChange={e => setData('invitee_phone', e.target.value)}
                                            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted"
                                            placeholder="Optional" />
                                    </div>
                                </div>

                                {/* Roles */}
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="flex items-center gap-2 text-2xs font-bold text-ink-muted uppercase tracking-widest">
                                            <Crown size={14} /> ASSIGN ROLE
                                        </h4>
                                        <span className="text-2xs font-bold text-brand-400 tracking-wider">
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
                                                            ? 'bg-brand-600 border-brand-500 shadow-xl '
                                                            : 'bg-neutral-800 border-neutral-700 hover:border-brand-400/50 hover:bg-interactive-hover'
                                                    }`}>
                                                    <div className={`mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-ink-muted'}`}>
                                                        <role.icon size={16} />
                                                    </div>
                                                    <div>
                                                        <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-neutral-300'}`}>{role.name}</div>
                                                        <div className={`text-3xs font-medium leading-tight mt-0.5 ${isSelected ? 'text-brand-200' : 'text-ink-muted'}`}>{role.description}</div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.roles && <p className="text-2xs text-red-400 ml-1">{errors.roles}</p>}
                                </div>

                            </form>
                        </div>

                        {/* RIGHT COLUMN: Permissions Visualization */}
                        <div className="flex-1 p-8 md:p-10 bg-neutral-900 rounded-r-xl flex flex-col relative overflow-hidden">
                            {/* Ambient glow in right panel */}
                            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />

                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="space-y-1">
                                    <h4 className="flex items-center gap-2 text-2xs font-bold text-ink-muted uppercase tracking-[0.2em]">
                                        <Shield size={14} className="text-brand-400" /> System Visibility
                                    </h4>
                                    <p className="text-2xs text-ink-muted font-bold uppercase tracking-widest pl-6">
                                        Module Access Control
                                    </p>
                                </div>
                                <div className="px-4 py-2 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-2xs font-bold text-brand-400 flex items-center gap-2 tracking-widest uppercase">
                                    <Sparkles size={12} /> Live Permissions Preview
                                </div>
                            </div>

                            <PermissionsSelector
                                selectedPermissions={data.permissions}
                                onChange={(perms) => setData(d => ({ ...d, role: 'custom', permissions: perms }))}
                            />

                            {/* Bottom Footer Actions inside Right Panel */}
                            <div className="mt-8 pt-8 border-t border-neutral-800/50 flex items-center justify-between relative z-10">
                                <div className="space-y-1">
                                    <div className="text-2xs font-bold text-ink-muted uppercase tracking-widest">
                                        Summary
                                    </div>
                                    <div className="text-sm font-bold text-white">
                                        <span className={data.permissions.length > 0 ? 'text-brand-400' : 'text-ink-muted'}>
                                             {data.permissions.length} Action Items Enabled
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button type="button" onClick={() => { setShowAddModal(false); reset(); }}
                                        className="px-6 py-3 text-ink-muted hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
                                        Discard
                                    </button>
                                    <button type="submit" form="invite-form" disabled={processing || data.roles.length === 0}
                                        className="px-10 py-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all flex items-center gap-3">
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
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-300 dark:text-ink-secondary gap-4 bg-surface rounded-2xl border border-line">
                <Send size={64} className="stroke-[0.7]" />
                <div className="text-center">
                    <h3 className="text-lg font-semibold">No invitations yet</h3>
                    <p className="text-sm mt-1">Click "Add Member" to invite your first team member.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-surface border border-line rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-app sticky top-0 z-10">
                        <tr className="text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line">
                            <th className="px-6 py-4">Name & Email</th>
                            <th className="px-6 py-4">Phone</th>
                            <th className="px-6 py-4">Role(s)</th>
                            <th className="px-6 py-4">Invite Code</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Expires</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {invitations.map(inv => {
                            const roles    = inv.roles || ['cashier'];
                            const roleInfo = getRoleInfo(roles[0]);
                            const RoleIcon = roleInfo.icon;
                            const st       = getStatusCfg(inv.status);

                            return (
                                <tr key={inv.id} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group">
                                    {/* Name & Email */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleInfo.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                                                {(inv.invitee_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-ink-secondary dark:text-ink text-sm">{inv.invitee_name}</p>
                                                <p className="text-xs text-ink-muted font-mono">{inv.invitee_email}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Phone */}
                                    <td className="px-6 py-4 text-sm text-ink-muted">
                                        {inv.invitee_phone || <span className="text-neutral-300">—</span>}
                                    </td>

                                    {/* Roles */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {roles.map(r => {
                                                const ri = getRoleInfo(r);
                                                return (
                                                    <span key={r} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${ri.badge}`}>
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
                                                className="flex items-center gap-2 px-3 py-1.5 bg-sunken hover:bg-brand-50 dark:hover:bg-brand-900/20 border border-line hover:border-brand-300 rounded-lg transition-colors group/code">
                                                <code className="text-xs font-mono font-bold text-ink-secondary group-hover/code:text-brand-600">
                                                    {inv.short_code}
                                                </code>
                                                {copiedId === inv.id
                                                    ? <Check size={12} className="text-emerald-500" />
                                                    : <Copy size={12} className="text-ink-muted group-hover/code:text-brand-500" />
                                                }
                                            </button>
                                        ) : (
                                            <span className="text-neutral-300 text-xs">—</span>
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
                                                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-2xs font-bold rounded-lg transition-colors">
                                                    <Check size={10} /> Approve
                                                </button>
                                                <button onClick={() => onDecline(inv)}
                                                    className="flex items-center gap-1 px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white text-2xs font-bold rounded-lg transition-colors">
                                                    <X size={10} /> Decline
                                                </button>
                                            </div>
                                        )}
                                    </td>

                                    {/* Expires */}
                                    <td className="px-6 py-4 text-xs text-ink-muted">
                                        {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </td>

                                    {/* 3-dot Menu */}
                                    <td className="px-6 py-4 text-right relative">
                                        <div className="relative inline-block">
                                            <button onClick={() => setOpenMenu(openMenu === inv.id ? null : inv.id)}
                                                className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 transition-colors opacity-0 group-hover:opacity-100">
                                                <ChevronDown size={16} />
                                            </button>
                                            {openMenu === inv.id && (
                                                <div className="absolute right-0 top-10 z-30 w-48 bg-surface border border-line rounded-[14px] shadow-2xl py-2 overflow-hidden">
                                                    {/* WhatsApp */}
                                                    <button onClick={() => { onWhatsApp(inv); setOpenMenu(null); }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                                        <MessageCircle size={14} className="text-emerald-500" /> Share via WhatsApp
                                                    </button>
                                                    {/* Copy Code */}
                                                    <button onClick={() => { onCopy(inv); setOpenMenu(null); }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                                        <Copy size={14} className="text-brand-500" /> Copy Invite Code
                                                    </button>
                                                    {/* Resend */}
                                                    {['pending', 'no_account', 'expired'].includes(inv.status) && (
                                                        <button onClick={() => { onResend(inv); setOpenMenu(null); }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                                            <RefreshCw size={14} className="text-blue-500" /> Resend (+48h)
                                                        </button>
                                                    )}
                                                    {/* Revoke */}
                                                    {['pending', 'no_account', 'awaiting_approval'].includes(inv.status) && (
                                                        <>
                                                            <div className="my-1 border-t border-line" />
                                                            <button onClick={() => { onRevoke(inv); setOpenMenu(null); }}
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
        <div className="flex-1 bg-surface border border-line rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-app sticky top-0 z-10">
                        <tr className="text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line">
                            <th className="px-6 py-4">Staff Member</th>
                            <th className="px-6 py-4">Today's First In</th>
                            <th className="px-6 py-4">Current Status</th>
                            <th className="px-6 py-4">Total Time Today</th>
                            <th className="px-6 py-4 text-right">Activity Insight</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
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
                                    className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors cursor-pointer group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-sunken flex items-center justify-center text-ink-muted font-bold text-sm group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 transition-colors">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-ink-secondary dark:text-ink text-sm">{user.name}</p>
                                                <p className="text-2xs text-ink-muted uppercase font-bold tracking-wider">{user.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-ink-muted font-mono">
                                        {data?.first_in || <span className="text-neutral-300">Not arrived</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold uppercase border ${
                                            isActive
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                                                : 'bg-app text-ink-muted border-line'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-sunken'}`}></div>
                                            {isActive ? 'Present now' : 'Logged out'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-ink-secondary font-mono">
                                        {totalTime}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-500 transition-all">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-sticky flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-4xl border border-line overflow-hidden flex flex-col h-[650px]">
                <div className="px-8 py-6 bg-sunken/50 dark:bg-app border-b border-line flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-ink leading-none">{user.name}</h3>
                            <p className="text-sm text-ink-muted mt-1 uppercase font-bold tracking-widest">{user.role} Analytics</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-sunken/50 dark:bg-surface p-1 rounded-xl">
                            {['7', '14', '30'].map(range => (
                                <button key={range} onClick={() => setDateRange(range)}
                                    className={`px-3 py-1 text-2xs font-bold uppercase rounded-lg transition-all ${
                                        dateRange === range
                                            ? 'bg-sunken text-brand-600 shadow-sm'
                                            : 'text-ink-muted'
                                    }`}>
                                    {range} Days
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-muted hover:text-red-500 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="space-y-8 h-full flex flex-col">
                        <div className="flex justify-between items-end">
                            <div>
                                <h4 className="text-sm font-bold text-ink-muted uppercase tracking-widest">Login & Logout Consistency</h4>
                                <p className="text-xs text-ink-muted mt-1">Timeline of first daily check-in vs last daily check-out.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                                    <span className="text-2xs font-bold uppercase text-ink-muted tracking-wider">Arrival Time</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                    <span className="text-2xs font-bold uppercase text-ink-muted tracking-wider">Departure Time</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[300px] w-full bg-surface/50 dark:bg-surface rounded-2xl border border-line p-6 relative overflow-hidden">
                            <div className="absolute inset-6">
                                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={vq.indigo[500]} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={vq.indigo[500]} stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={vq.rose[500]} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={vq.rose[500]} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={vq.slate[200]} opacity={0.5} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: vq.slate[500]}} dy={10} />
                                        <YAxis domain={[0, 24]} axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: vq.slate[400]}} tickFormatter={formatYAxis} ticks={[0, 4, 8, 12, 16, 20, 24]} />
                                        <Tooltip content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-surface border border-line p-4 rounded-2xl shadow-2xl">
                                                        <p className="text-xs font-bold text-ink mb-2">{payload[0].payload.date}</p>
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-4 justify-between">
                                                                <span className="text-2xs font-bold text-ink-muted uppercase">First In:</span>
                                                                <span className="text-xs font-bold text-brand-600">{payload[0].payload.inLabel || '—'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4 justify-between">
                                                                <span className="text-2xs font-bold text-ink-muted uppercase">Last Out:</span>
                                                                <span className="text-xs font-bold text-rose-500">{payload[0].payload.outLabel || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }} />
                                        <Area type="monotone" dataKey="in" stroke={vq.indigo[500]} strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                                        <Area type="monotone" dataKey="out" stroke={vq.rose[500]} strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
                                        <ReferenceLine y={9} stroke={vq.indigo[500]} strokeDasharray="3 3" opacity={0.3} label={{ position: 'right', value: '9 AM', fill: vq.indigo[500], fontSize: 10 }} />
                                        <ReferenceLine y={18} stroke={vq.rose[500]} strokeDasharray="3 3" opacity={0.3} label={{ position: 'right', value: '6 PM', fill: vq.rose[500], fontSize: 10 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl border border-brand-100 dark:border-brand-800">
                                <div className="flex items-center gap-2 mb-1">
                                    <Zap size={14} className="text-brand-500" />
                                    <span className="text-2xs font-bold text-brand-600 uppercase">Average In</span>
                                </div>
                                <p className="text-lg font-bold text-brand-700 dark:text-brand-400">
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
                                    <span className="text-2xs font-bold text-rose-600 uppercase">Average Out</span>
                                </div>
                                <p className="text-lg font-bold text-rose-700 dark:text-rose-400">
                                    {chartData.filter(d => d.out).length > 0 ? (() => {
                                        const avg = chartData.filter(d => d.out).reduce((s,d) => s + d.out, 0) / chartData.filter(d => d.out).length;
                                        const h = Math.floor(avg);
                                        const m = Math.round((avg - h) * 60);
                                        return `${h}:${m < 10 ? '0'+m : m}`;
                                    })() : '—'}
                                </p>
                            </div>
                            <div className="bg-app p-4 rounded-2xl border border-line">
                                <div className="flex items-center gap-2 mb-1 text-ink-muted">
                                    <Activity size={14} />
                                    <span className="text-2xs font-bold uppercase">Punctuality</span>
                                </div>
                                <p className="text-lg font-bold text-ink">Professional</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Member Modal ──────────────────────────────────────────────────────
function EditMemberModal({ member, onClose }) {
    const { store } = usePage().props;
    const { data, setData, patch, processing, errors } = useForm({
        role: member.role || 'custom',
        custom_role_name: member.custom_role_name ?? '',
        display_name: member.display_name ?? '',
        status: member.status,
        permissions: member.permissions ?? ROLE_PERMISSIONS[member.role] ?? [],
        passcode: '',
    });

    const toggleRole = (roleKey) => {
        setData(d => ({
            ...d,
            role: roleKey,
            permissions: ROLE_PERMISSIONS[roleKey] || []
        }));
    };

    const submit = (e) => {
        e.preventDefault();
        if (!store?.slug) return;
        console.log('Submitting data:', JSON.stringify(data));
        console.log('Patching to:', route('store.admin.users.update', { store_slug: store.slug, member: member.membership_id }));
        patch(route('store.admin.users.update', { store_slug: store.slug, member: member.membership_id }), {
            onSuccess: onClose,
        });
    };

    return (
        <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm z-sticky flex items-center justify-center p-4 md:p-8 overflow-y-auto custom-scrollbar">
            <div className="bg-neutral-900 rounded-xl shadow-2xl w-full max-w-[1200px] border border-neutral-700/50 flex flex-col md:flex-row relative mt-auto mb-auto">

                <button onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full text-ink-muted hover:text-white hover:bg-interactive-hover transition-colors z-20">
                    <X size={20} />
                </button>

                {/* LEFT COLUMN: Form & Roles */}
                <div className="w-full md:w-[450px] shrink-0 p-8 md:p-10 border-b md:border-b-0 md:border-r border-neutral-700/50 flex flex-col bg-neutral-900 rounded-l-xl max-h-[85vh] overflow-y-auto">
                    <div className="flex items-center gap-4 mb-10">
                        <h3 className="font-bold text-2xl text-white tracking-tight">Edit Member</h3>
                        <div className="h-4 w-px bg-neutral-700"></div>
                        <span className="text-xs font-bold text-ink-muted uppercase tracking-widest">{member.name}</span>
                    </div>

                    <form id="edit-member-form" onSubmit={submit} className="flex flex-col gap-10 flex-1">

                        {/* Member Profile */}
                        <div className="space-y-5">
                            <h4 className="flex items-center gap-2 text-2xs font-bold text-ink-muted uppercase tracking-widest">
                                <User size={14} /> MEMBER PROFILE
                            </h4>

                            <div className="space-y-1.5 focus-within:text-brand-400 transition-colors text-ink-muted">
                                <label className="text-2xs font-bold uppercase tracking-wider ml-1">Display Name</label>
                                <input type="text" value={data.display_name} onChange={e => setData('display_name', e.target.value)}
                                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted"
                                    placeholder="Display Name" required />
                                {errors.display_name && <p className="text-2xs text-red-400 ml-1">{errors.display_name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 focus-within:text-brand-400 transition-colors text-ink-muted">
                                    <label className="text-2xs font-bold uppercase tracking-wider ml-1">Status</label>
                                    <select value={data.status} onChange={e => setData('status', e.target.value)}
                                        disabled={member.role === 'owner'}
                                        className="w-full px-4 py-3 bg-sunken border border-neutral-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all">
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                    {errors.status && <p className="text-2xs text-red-400 ml-1">{errors.status}</p>}
                                </div>

                                <div className="space-y-1.5 focus-within:text-brand-400 transition-colors text-ink-muted">
                                    <label className="text-2xs font-bold uppercase tracking-wider ml-1">Passcode PIN</label>
                                    <input type="password" value={data.passcode} onChange={e => setData('passcode', e.target.value)}
                                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted font-mono"
                                        placeholder="Keep original PIN" maxLength={6} />
                                    {errors.passcode && <p className="text-2xs text-red-400 ml-1">{errors.passcode}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Roles */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h4 className="flex items-center gap-2 text-2xs font-bold text-ink-muted uppercase tracking-widest">
                                    <Crown size={14} /> ASSIGN ROLE
                                </h4>
                                <span className="text-2xs font-bold text-brand-400 tracking-wider">
                                    {data.role ? ROLES[data.role]?.name?.toUpperCase() : 'NONE'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(ROLES).map(([key, role]) => {
                                    const isSelected = data.role === key;
                                    const isOwner = member.role === 'owner';
                                    return (
                                        <button key={key} type="button"
                                            disabled={isOwner}
                                            onClick={() => toggleRole(key)}
                                            className={`p-3 rounded-xl border flex gap-3 text-left transition-all ${
                                                isSelected
                                                    ? 'bg-brand-600 border-brand-500 shadow-xl '
                                                    : 'bg-sunken border-neutral-700 hover:border-brand-400/50 hover:bg-interactive-hover'
                                            } ${isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <div className={`mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-ink-muted'}`}>
                                                <role.icon size={16} />
                                            </div>
                                            <div>
                                                <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-neutral-300'}`}>{role.name}</div>
                                                <div className={`text-3xs font-medium leading-tight mt-0.5 ${isSelected ? 'text-brand-200' : 'text-ink-muted'}`}>{role.description}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {data.role === 'custom' && (
                                <div className="mt-3">
                                    <label className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-1 block">
                                        Custom Role Name <span className="text-ink-muted font-normal normal-case">(optional — shown as badge)</span>
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={30}
                                        placeholder="e.g. Senior Accountant, Floor Supervisor..."
                                        value={data.custom_role_name}
                                        onChange={e => setData('custom_role_name', e.target.value)}
                                        className="w-full bg-neutral-800 border border-neutral-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                                    />
                                </div>
                            )}
                            {errors.role && <p className="text-2xs text-red-400 ml-1">{errors.role}</p>}
                        </div>

                    </form>
                </div>

                {/* RIGHT COLUMN: Permissions Visualization */}
                <div className="flex-1 p-8 md:p-10 bg-neutral-900 rounded-r-xl flex flex-col relative overflow-hidden">
                    {/* Ambient glow in right panel */}
                    <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="space-y-1">
                            <h4 className="flex items-center gap-2 text-2xs font-bold text-ink-muted uppercase tracking-[0.2em]">
                                <Shield size={14} className="text-brand-400" /> System Visibility
                            </h4>
                            <p className="text-2xs text-ink-muted font-bold uppercase tracking-widest pl-6">
                                Module Access Control
                            </p>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-2xs font-bold text-brand-400 flex items-center gap-2 tracking-widest uppercase">
                            <Sparkles size={12} /> Live Permissions Preview
                        </div>
                    </div>

                    <PermissionsSelector
                        selectedPermissions={data.permissions}
                        onChange={(perms) => setData(d => ({ ...d, role: 'custom', permissions: perms }))}
                        disabled={member.role === 'owner'}
                    />

                    {/* Bottom Footer Actions inside Right Panel */}
                    <div className="mt-8 pt-8 border-t border-neutral-800/50 flex items-center justify-between relative z-10">
                        <div className="space-y-1">
                            <div className="text-2xs font-bold text-ink-muted uppercase tracking-widest">
                                Summary
                            </div>
                            <div className="text-sm font-bold text-white">
                                <span className={data.permissions.length > 0 ? 'text-brand-400' : 'text-ink-muted'}>
                                     {data.permissions.length} Action Items Enabled
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={onClose}
                                className="px-6 py-3 text-ink-muted hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
                                Discard
                            </button>
                            <button type="submit" form="edit-member-form" disabled={processing}
                                className="px-10 py-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all flex items-center gap-3">
                                <Check size={16} />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// ─── Members Table ─────────────────────────────────────────────────────────
function MembersTable({ users, store }) {
    const { my_role } = usePage().props;
    const canManage = ['owner', 'admin'].includes(my_role);
    const [openMenu, setOpenMenu] = useState(null);
    const [editingMember, setEditingMember] = useState(null);

    const filtered = users.filter(u => u.role !== 'platform_admin');

    const handleRemove = (member) => {
        if (!confirm(`Remove ${member.name} from the store? They will lose all access immediately.`)) return;
        if (!store?.slug) return;
        router.delete(route('store.admin.users.remove', { store_slug: store.slug, member: member.membership_id }), {
            onSuccess: () => setOpenMenu(null),
        });
    };

    if (filtered.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-300 dark:text-ink-secondary gap-4 bg-surface rounded-2xl border border-line">
                <Users size={64} className="stroke-[0.7]" />
                <p className="text-sm">No active members yet. Invite someone to get started.</p>
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
            <div className="flex-1 bg-surface border border-line rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-app sticky top-0 z-10">
                            <tr className="text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line">
                                <th className="px-6 py-4">Member</th>
                                <th className="px-6 py-4">Role & Access</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Joined</th>
                                {canManage && <th className="px-6 py-4 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {filtered.map(user => {
                                const resolvedRole = (() => {
                                    if (user.role && user.role !== 'custom' && ROLES[user.role]) return user.role;
                                    if (user.custom_role_name) return 'custom';
                                    // Find closest preset by permission overlap
                                    let bestMatch = 'custom';
                                    let bestScore = -1;
                                    const userPerms = user.permissions ?? [];
                                    for (const [key, perms] of Object.entries(ROLE_PERMISSIONS)) {
                                        if (key === 'custom' || !perms.length) continue;
                                        const score = perms.filter(p => userPerms.includes(p)).length;
                                        if (score > bestScore) { bestScore = score; bestMatch = key; }
                                    }
                                    return bestMatch;
                                })();
                                const role = getRoleInfo(resolvedRole);
                                const RoleIcon = role.icon;
                                const badgeLabel = user.role === 'custom' && user.custom_role_name
                                    ? user.custom_role_name
                                    : role.name;
                                const st = getStatusCfg(user.status);
                                const isOwner = user.role === 'owner';

                                return (
                                    <tr key={user.id} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white font-bold shadow-md`}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-ink-secondary dark:text-ink text-sm">
                                                        {user.display_name || user.name}
                                                        {user.role === 'owner' && <span className="ml-2 text-2xs font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-widest">Owner</span>}
                                                    </p>
                                                    <p className="text-xs text-ink-muted font-mono">ID: {user.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${role.badge}`}>
                                                <RoleIcon size={10} />{badgeLabel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-ink-muted font-mono">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${st.color}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                                                {st.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-ink-muted">
                                            {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>

                                        {/* Actions Menu */}
                                        {canManage && (
                                            <td className="px-6 py-4 text-right relative">
                                                {!isOwner && (
                                                    <div className="relative inline-block">
                                                        <button onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                                                            className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 transition-colors opacity-0 group-hover:opacity-100">
                                                            <ChevronDown size={16} />
                                                        </button>
                                                        {openMenu === user.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />
                                                                <div className="absolute right-0 top-10 z-30 w-48 bg-surface border border-line rounded-[14px] shadow-2xl py-2 overflow-hidden text-left">
                                                                    <button onClick={() => { setEditingMember(user); setOpenMenu(null); }}
                                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                                                        <Edit3 size={14} className="text-brand-500" /> Edit Role & Access
                                                                    </button>
                                                                    <div className="my-1 border-t border-line" />
                                                                    <button onClick={() => handleRemove(user)}
                                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                                        <Trash2 size={14} /> Remove Member
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

// ─── StatCard ──────────────────────────────────────────────────────────────
function StatCard({ title, value, icon, color, subtext }) {
    return (
        <div className="bg-surface px-3 py-1.5 rounded-xl border border-line shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center text-white shrink-0 shadow-md `}>
                    {icon}
                </div>
                <div>
                    <span className="text-2xs font-bold text-ink-muted uppercase tracking-wider">{title}</span>
                    {subtext && <p className="text-4xs text-amber-500 font-semibold">{subtext}</p>}
                </div>
            </div>
            <h3 className="text-base font-bold text-ink">{value || 0}</h3>
        </div>
    );
}

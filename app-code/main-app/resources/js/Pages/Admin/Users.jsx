import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import {
    Users, Plus, Search, Edit3, Trash2, Shield, Mail, Clock,
    CheckCircle, XCircle, UserPlus, X, Check, ShoppingCart,
    Package, BarChart2, DollarSign, Settings, FileText, Truck,
    UserCheck, Eye, Lock, Crown, Star, Calendar, Timer, Activity,
    User, BadgeCheck, Zap, Copy, MessageCircle, Phone, RotateCcw,
    ChevronDown, AlertCircle, Send, Ban, RefreshCw, BarChart, Sparkles, Award, TrendingUp, ChevronRight,
    CreditCard, ChevronLeft, Power, Layers, Info, ArrowRight, BookOpen, ShieldCheck,
    UploadCloud, Paperclip, FileCheck, AlertTriangle
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine
} from 'recharts';
import { getCurrencySymbol } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import STAFF_PRESETS from '@/data/staff_presets.json';

import { vq } from '@/theme/runtime';
// ─── Role definitions ──────────────────────────────────────────────────────
const ROLES = {
    owner:           { name: 'Store Owner', description: 'Complete store control, billing, financial ledgers, and team administration', icon: Crown,        color: 'from-amber-500 to-yellow-600', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    admin:           { name: 'Store Administrator', description: 'Full day-to-day store management, inventory, purchases, staff, and settings', icon: Shield,       color: 'from-brand-500 to-brand-700', badge: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400' },
    manager:         { name: 'Store Manager', description: 'Oversees daily sales, cashier shifts, customer discounts, and store expenses', icon: Star,         color: 'from-blue-500 to-cyan-600', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
    cashier:         { name: 'Cashier & Counter Sales', description: 'Operates POS register, scans items, takes cash/card payments, and issues receipts', icon: ShoppingCart, color: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
    inventory_staff: { name: 'Inventory & Stock Lead', description: 'Manages products, stocks warehouses, counts physical inventory, and logs shipments', icon: Package,      color: 'from-orange-500 to-red-600', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' },
    accountant:      { name: 'Financial Accountant', description: 'Reviews cash flow, reconciles bank accounts, manages vendor payouts, and prints reports', icon: DollarSign,   color: 'from-brand-800 to-brand-900', badge: 'bg-brand-100 text-brand-800 dark:bg-brand-800/30 dark:text-brand-300' },
    support:         { name: 'Technical Support', description: 'System troubleshooting, hardware configuration, and audit logs', icon: BadgeCheck,   color: 'from-lime-500 to-lime-600', badge: 'bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-400' },
    viewer:          { name: 'Read-Only Viewer', description: 'Can view reports, sales data, and product prices without ability to make changes', icon: Eye,          color: 'from-neutral-500 to-neutral-600', badge: 'bg-neutral-100 text-ink-secondary dark:bg-neutral-500/20 dark:text-ink-secondary' },
    custom:          { name: 'Custom Access', description: 'Manually select exact permissions and capabilities for this staff member', icon: Settings,     color: 'from-neutral-500 to-neutral-600', badge: 'bg-neutral-100 text-ink-secondary dark:bg-neutral-500/20 dark:text-ink-muted' },
};

const ROLE_PERMISSIONS = {
    owner: [
        'pos.open_session', 'pos.checkout', 'pos.discounts', 'pos.void_item', 'pos.refund', 'pos.close_session',
        'sales.view', 'sales.create', 'sales.edit', 'sales.void', 'sales.quotations', 'sales.returns',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.adjust', 'inventory.transfer', 'inventory.barcodes',
        'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.void', 'purchases.costs', 'purchases.suppliers', 'purchases.returns',
        'finance.balances', 'finance.transactions', 'finance.receive_payment', 'finance.send_payment', 'finance.expenses', 'finance.journal',
        'finance.customer_refund', 'finance.supplier_refund', 'finance.capital_add', 'finance.owner_drawings', 'finance.internal_transfer', 'finance.balance_adjustment',
        'finance.cheque_books.view', 'finance.cheque_books.manage', 'finance.cheques.clear', 'finance.cheques.override_duplicate',
        'finance.fiscal_year.view', 'finance.fiscal_year.manage', 'finance.fiscal_year.close', 'finance.period_lock', 'finance.period_reopen', 'finance.period_exception',
        'approvals.view', 'approvals.view_own', 'approvals.submit', 'approvals.review', 'approvals.approve', 'approvals.reject', 'approvals.return', 'approvals.resubmit', 'approvals.withdraw', 'approvals.configure',
        'parties.view', 'parties.contact_view',
        'reports.summary', 'reports.sales', 'reports.financial', 'reports.stock', 'reports.performance', 'reports.audit',
        'admin.staff_view', 'admin.staff_manage', 'admin.settings_view', 'admin.settings_manage', 'admin.receipt_print', 'admin.taxes_methods', 'admin.warehouses', 'admin.data_recovery', 'admin.billing_store', 'data.export', 'vensynq.manage'
    ],
    admin: [
        'pos.open_session', 'pos.checkout', 'pos.discounts', 'pos.void_item', 'pos.refund', 'pos.close_session',
        'sales.view', 'sales.create', 'sales.edit', 'sales.void', 'sales.quotations', 'sales.returns',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.adjust', 'inventory.transfer', 'inventory.barcodes',
        'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.void', 'purchases.costs', 'purchases.suppliers', 'purchases.returns',
        'finance.balances', 'finance.transactions', 'finance.receive_payment', 'finance.send_payment', 'finance.expenses', 'finance.journal',
        'finance.customer_refund', 'finance.supplier_refund', 'finance.capital_add', 'finance.owner_drawings', 'finance.internal_transfer', 'finance.balance_adjustment',
        'finance.cheque_books.view', 'finance.cheque_books.manage', 'finance.cheques.clear', 'finance.cheques.override_duplicate',
        'finance.fiscal_year.view', 'finance.fiscal_year.manage', 'finance.fiscal_year.close', 'finance.period_lock', 'finance.period_reopen', 'finance.period_exception',
        'approvals.view', 'approvals.view_own', 'approvals.submit', 'approvals.review', 'approvals.approve', 'approvals.reject', 'approvals.return', 'approvals.resubmit', 'approvals.withdraw',
        'parties.view', 'parties.contact_view',
        'reports.summary', 'reports.sales', 'reports.financial', 'reports.stock', 'reports.performance', 'reports.audit',
        'admin.staff_view', 'admin.staff_manage', 'admin.settings_view', 'admin.settings_manage', 'admin.receipt_print', 'admin.taxes_methods', 'admin.warehouses', 'admin.data_recovery', 'data.export', 'vensynq.manage'
    ],
    manager: [
        'pos.open_session', 'pos.checkout', 'pos.discounts', 'pos.void_item', 'pos.refund', 'pos.close_session',
        'sales.view', 'sales.create', 'sales.edit', 'sales.void', 'sales.quotations', 'sales.returns',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.transfer', 'inventory.barcodes',
        'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.costs', 'purchases.suppliers', 'purchases.returns',
        'finance.balances', 'finance.transactions', 'finance.receive_payment', 'finance.send_payment', 'finance.expenses',
        'finance.cheque_books.view', 'finance.cheques.clear',
        'approvals.view', 'approvals.view_own', 'approvals.submit', 'approvals.review', 'approvals.approve', 'approvals.reject', 'approvals.return', 'approvals.resubmit',
        'parties.view', 'parties.contact_view',
        'reports.summary', 'reports.sales', 'reports.stock', 'reports.performance',
        'admin.staff_view', 'admin.settings_view', 'admin.receipt_print'
    ],
    cashier: [
        'pos.open_session', 'pos.checkout', 'pos.discounts', 'pos.close_session',
        'inventory.view',
        'approvals.view_own', 'approvals.submit'
    ],
    inventory_staff: [
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.transfer', 'inventory.barcodes',
        'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.costs', 'purchases.suppliers', 'purchases.returns',
        'reports.stock',
        'approvals.view_own', 'approvals.submit'
    ],
    accountant: [
        'sales.view', 'purchases.view', 'inventory.view', 'parties.view', 'parties.contact_view',
        'finance.balances', 'finance.transactions', 'finance.receive_payment', 'finance.send_payment', 'finance.expenses', 'finance.journal',
        'finance.customer_refund', 'finance.supplier_refund', 'finance.internal_transfer',
        'finance.cheque_books.view', 'finance.cheque_books.manage', 'finance.cheques.clear',
        'finance.fiscal_year.view',
        'approvals.view', 'approvals.view_own', 'approvals.submit', 'approvals.review', 'approvals.approve', 'approvals.reject', 'approvals.return', 'approvals.resubmit',
        'reports.summary', 'reports.sales', 'reports.financial', 'reports.audit', 'data.export'
    ],
    support: [
        'reports.audit',
        'admin.staff_view', 'admin.staff_manage', 'admin.settings_view', 'admin.settings_manage'
    ],
    viewer: [
        'reports.summary', 'reports.sales', 'reports.financial', 'reports.stock',
        'sales.view', 'inventory.view', 'purchases.view', 'parties.view', 'finance.transactions',
        'finance.cheque_books.view',
    ],
    custom: []
};

const PERMISSION_CATEGORIES = [
    {
        id: 'pos_register',
        name: 'POS & Register Operations',
        desc: 'Shift opening, terminal checkout, cart discounts, voids and returns',
        icon: ShoppingCart,
        permissions: [
            { id: 'pos.open_session', name: 'Open Register Session', desc: 'Start POS shifts and record opening float balances' },
            { id: 'pos.checkout', name: 'Scan & Checkout', desc: 'Process sales and payments at the register' },
            { id: 'pos.discounts', name: 'Apply Cart Discounts', desc: 'Apply discounts to active shopping cart items' },
            { id: 'pos.void_item', name: 'Void Cart Items', desc: 'Void scanned items and clear active carts' },
            { id: 'pos.refund', name: 'Register Refunds', desc: 'Process customer returns & refunds directly at the POS' },
            { id: 'pos.close_session', name: 'Close Shift & Count Drawer', desc: 'Perform end-of-day drawer counts and close register' },
        ]
    },
    {
        id: 'sales_invoices',
        name: 'Sales, Invoicing & Orders',
        desc: 'Direct sales orders, B2B invoices, estimates and credit notes',
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
        name: 'Stock, Products & Manufacturing',
        desc: 'Product catalog, BOM assemblies and warehouse adjustments',
        icon: Package,
        permissions: [
            { id: 'inventory.view', name: 'View Products & Stock', desc: 'Access the products catalog and view stock levels' },
            { id: 'inventory.create', name: 'Add New Products', desc: 'Add new items and setup product variations' },
            { id: 'inventory.edit', name: 'Edit Products', desc: 'Edit product details, selling prices, tiers and BOMs' },
            { id: 'inventory.delete', name: 'Delete Products', desc: 'Permanently remove items and BOMs from catalog' },
            { id: 'inventory.adjust', name: 'Manual Stock Adjustments', desc: 'Manually adjust stock and execute production runs' },
            { id: 'inventory.transfer', name: 'Warehouse Transfers', desc: 'Record moving stock between warehouse depots' },
            { id: 'inventory.barcodes', name: 'Print Barcode Labels', desc: 'Generate barcode stickers for items' },
        ]
    },
    {
        id: 'purchasing_suppliers',
        name: 'Purchasing & Procurement',
        desc: 'Vendor POs, supply records, debit notes and COGS margins',
        icon: Truck,
        permissions: [
            { id: 'purchases.view', name: 'View Purchases', desc: 'View past supplier purchases & expense records' },
            { id: 'purchases.create', name: 'Create Purchase Orders', desc: 'Generate new Purchase Orders (POs)' },
            { id: 'purchases.edit', name: 'Edit Purchase Orders', desc: 'Modify pending or draft purchase orders' },
            { id: 'purchases.void', name: 'Void Purchase Orders', desc: 'Cancel or delete purchase orders' },
            { id: 'purchases.costs', name: 'Wholesale Cost Viewer', desc: 'View wholesale purchase prices & cost histories' },
            { id: 'purchases.suppliers', name: 'Manage Suppliers', desc: 'Create supplier directories and log ledgers' },
            { id: 'purchases.returns', name: 'Purchase Returns', desc: 'Return goods to suppliers and log debit notes' },
        ]
    },
    {
        id: 'money_finance',
        name: 'Cash Flow & Fund Management',
        desc: 'Cash in hand, bank accounts, expenses, payments and equity transfers',
        icon: DollarSign,
        permissions: [
            { id: 'finance.balances', name: 'View Cash & Bank Balances', desc: 'View safe deposit box, registers, & bank balances' },
            { id: 'finance.transactions', name: 'View Cash Flow Ledger', desc: 'View list of all recent payments & cash flow history' },
            { id: 'finance.receive_payment', name: 'Record Customer Payments', desc: 'Collect and record outstanding client money' },
            { id: 'finance.send_payment', name: 'Record Vendor Payments', desc: 'Record payouts & pay outstanding supplier balances' },
            { id: 'finance.expenses', name: 'Record Business Expenses', desc: 'Record operational expenses (bills, rent, electricity)' },
            { id: 'finance.journal', name: 'Accounting Journal Entries', desc: 'Create debit/credit adjustments (bookkeeper overrides)' },
            { id: 'finance.customer_refund', name: 'Issue Customer Refunds', desc: 'Approve and post refund payments back to customers' },
            { id: 'finance.supplier_refund', name: 'Receive Supplier Refunds', desc: 'Approve and record refunds received from suppliers' },
            { id: 'finance.capital_add', name: 'Capital Injection', desc: 'Record owner injecting personal funds into the business' },
            { id: 'finance.owner_drawings', name: 'Owner Drawings', desc: 'Record owner withdrawing funds from the business for personal use' },
            { id: 'finance.internal_transfer', name: 'Internal Fund Transfers', desc: 'Move money between cash and bank accounts within the store' },
            { id: 'finance.balance_adjustment', name: 'Cash/Bank Balance Adjustment', desc: 'Adjust physical cash or bank balance to correct figure' },
        ]
    },
    {
        id: 'banking_cheques',
        name: 'Cheque Management & Banking',
        desc: 'Bank cheque registers, leaf tracking, clearance and duplicates',
        icon: CreditCard,
        permissions: [
            { id: 'finance.cheque_books.view', name: 'View Chequebooks & Cheques', desc: 'View bank chequebooks, cheque registers, and statuses' },
            { id: 'finance.cheque_books.manage', name: 'Manage Chequebooks', desc: 'Register new chequebooks, void unused leaves, and manage books' },
            { id: 'finance.cheques.clear', name: 'Clear & Bounce Cheques', desc: 'Mark issued or received cheques as cleared or bounced' },
            { id: 'finance.cheques.override_duplicate', name: 'Override Duplicate Cheques', desc: 'Authorize recording of cheques flagged as duplicates' },
        ]
    },
    {
        id: 'fiscal_governance',
        name: 'Fiscal Governance & Periods',
        desc: 'Fiscal years, year-end closing, period locks and backdating rules',
        icon: Calendar,
        permissions: [
            { id: 'finance.fiscal_year.view', name: 'View Fiscal Calendar', desc: 'View current and historical fiscal years, periods and locks' },
            { id: 'finance.fiscal_year.manage', name: 'Configure Fiscal Periods', desc: 'Set up fiscal years, quarters and accounting period dates' },
            { id: 'finance.fiscal_year.close', name: 'Close Fiscal Year', desc: 'Perform year-end close and carry forward retained earnings' },
            { id: 'finance.period_lock', name: 'Lock Accounting Periods', desc: 'Lock past calendar months/quarters against new entries' },
            { id: 'finance.period_reopen', name: 'Reopen Locked Periods', desc: 'Reopen closed historical periods for retrospective adjustments' },
            { id: 'finance.period_exception', name: 'Grant Backdating Exceptions', desc: 'Authorize specific users to post into locked past periods' },
        ]
    },
    {
        id: 'approvals_workflow',
        name: 'Approvals & Governance Workflows',
        desc: 'Multi-tier authorization workflows for high-value transactions',
        icon: CheckCircle,
        permissions: [
            { id: 'approvals.view', name: 'View Approvals Center', desc: 'Access the central approvals queue and company inbox' },
            { id: 'approvals.view_own', name: 'View Personal Submissions', desc: 'Track status of personally submitted approval requests' },
            { id: 'approvals.submit', name: 'Submit for Authorization', desc: 'Submit transactions exceeding limits to the approval queue' },
            { id: 'approvals.review', name: 'Review Approval Requests', desc: 'Examine documents, line items, and audit trail before action' },
            { id: 'approvals.approve', name: 'Approve Transactions', desc: 'Grant official authorization to execute queued transactions' },
            { id: 'approvals.reject', name: 'Reject Transactions', desc: 'Decline queued transactions and notify submitter with reason' },
            { id: 'approvals.return', name: 'Return for Revision', desc: 'Send documents back to submitter for corrections' },
            { id: 'approvals.resubmit', name: 'Resubmit Corrected Items', desc: 'Submit revised documents back into the approval pipeline' },
            { id: 'approvals.withdraw', name: 'Withdraw Submissions', desc: 'Cancel own pending authorization requests before review' },
            { id: 'approvals.configure', name: 'Configure Approval Policies', desc: 'Set approval thresholds, required tiers and document triggers' },
        ]
    },
    {
        id: 'parties_contacts',
        name: 'Customer & Supplier Contacts',
        desc: 'Directory of customer accounts, vendors and privacy controls',
        icon: Users,
        permissions: [
            { id: 'parties.view', name: 'View Parties Directory', desc: 'Browse customer and supplier names, balances and credit terms' },
            { id: 'parties.contact_view', name: 'View Confidential Contacts', desc: 'View protected phone numbers, emails, addresses and tax IDs' },
        ]
    },
    {
        id: 'insights_reports',
        name: 'Insights & Reports',
        desc: 'Net profit margins, audits, and performance tracking',
        icon: BarChart2,
        permissions: [
            { id: 'reports.summary', name: 'Dashboard KPI Viewer', desc: 'View net margins, global sales stats, & dashboard KPIs' },
            { id: 'reports.sales', name: 'Sales & Margin Reports', desc: 'Analyze sales trends, gross margins and product stats' },
            { id: 'reports.financial', name: 'Financial Statements', desc: 'Export Balance Sheets, Tax Summaries, & Profit/Loss reports' },
            { id: 'reports.stock', name: 'Stock Reports', desc: 'Track low-stock warnings and movement histories' },
            { id: 'reports.performance', name: 'Staff Sales Performance', desc: 'Access leaderboard metrics & staff sales counts' },
            { id: 'reports.audit', name: 'Security Audit Logs', desc: 'Read audit trails showing exactly who performed what action' },
        ]
    },
    {
        id: 'store_admin',
        name: 'Store Administration',
        desc: 'Staff recruitments, VAT configurations, integrations and backups',
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
            { id: 'admin.billing_store', name: 'Billing & Store Deletion', desc: 'Upgrade subscriptions, change cards, or delete store database' },
            { id: 'data.export', name: 'Export Store Data', desc: 'Download full CSV/JSON database exports and backups' },
            { id: 'vensynq.manage', name: 'VenSynQ & Cloud Sync', desc: 'Manage multichannel integrations, webhooks and ecommerce sync' },
        ]
    }
];

const PermissionsSelector = ({ selectedPermissions = [], onChange, disabled = false }) => {
    const tt = useTermText();

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
        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
            {PERMISSION_CATEGORIES.map(cat => {
                const catPerms = cat.permissions;
                const isCatActive = catPerms.every(p => selectedPermissions.includes(p.id));
                const isCatPartial = catPerms.some(p => selectedPermissions.includes(p.id)) && !isCatActive;
                const CatIcon = cat.icon;

                return (
                    <div key={cat.id} className="bg-surface border border-line rounded-2xl p-4 md:p-5 transition-all hover:border-line-strong shadow-sm">
                        {/* Category Header */}
                        <div className="flex items-center justify-between gap-4 mb-3.5 pb-3.5 border-b border-line">
                            <div className="flex items-center gap-3.5">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-app dark:bg-neutral-800 text-brand-600 dark:text-brand-400 border border-line shrink-0">
                                    <CatIcon size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-ink leading-tight">{tt(cat.name)}</h4>
                                    <p className="text-xs text-ink-muted leading-tight mt-0.5">{tt(cat.desc)}</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => handleToggleCategory(cat.id, catPerms)}
                                className={`px-3 py-1 rounded-xl text-2xs font-bold uppercase tracking-wider transition-all border shrink-0 ${
                                    isCatActive
                                        ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-950/40 dark:border-brand-500/50 dark:text-brand-300 shadow-sm'
                                        : isCatPartial
                                            ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/40 dark:border-amber-500/50 dark:text-amber-300 shadow-sm'
                                            : 'bg-app border-line text-ink-muted hover:text-ink dark:bg-neutral-800/60 dark:text-ink-muted dark:hover:text-ink'
                                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                {isCatActive ? 'Full Access' : isCatPartial ? 'Partial' : 'No Access'}
                            </button>
                        </div>

                        {/* Sub Permissions Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                            {catPerms.map(perm => {
                                const isActive = selectedPermissions.includes(perm.id);
                                return (
                                    <button
                                        key={perm.id}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => handleToggle(perm.id)}
                                        className={`p-3 rounded-xl border flex items-start gap-3 text-left transition-all group/mod ${
                                            isActive
                                                ? 'bg-brand-50/80 border-brand-300 dark:bg-brand-950/40 dark:border-brand-600/50 shadow-sm ring-1 ring-brand-500/20'
                                                : 'bg-app/50 border-line hover:border-line-strong hover:bg-interactive-hover text-ink-secondary dark:bg-neutral-800/20 dark:border-neutral-700/60 dark:hover:bg-neutral-800/60'
                                        } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                                    >
                                        <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                                            isActive
                                                ? 'bg-brand-600 border-brand-500 text-white shadow-sm'
                                                : 'border-line dark:border-neutral-600 bg-surface dark:bg-neutral-800'
                                        }`}>
                                            {isActive && <Check size={10} strokeWidth={3} />}
                                        </div>
                                        <div className="flex flex-col justify-center min-w-0">
                                            <div className={`text-xs font-bold leading-tight ${isActive ? 'text-brand-950 dark:text-brand-200' : 'text-ink group-hover/mod:text-ink'}`}>{tt(perm.name)}</div>
                                            <div className={`text-2xs leading-relaxed mt-1 line-clamp-2 ${isActive ? 'text-brand-800/80 dark:text-brand-300/80 font-medium' : 'text-ink-muted'}`}>{tt(perm.desc)}</div>
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

const StaffPresetPicker = ({ onApplyPreset, disabled = false }) => {
    const tt = useTermText();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const groups = ['All', 'Sales floor', 'Stock & purchasing', 'Money & accounting', 'Review & administration', 'Leadership'];

    const filteredPresets = useMemo(() => {
        return (STAFF_PRESETS || []).filter(preset => {
            const matchesGroup = selectedGroup === 'All' || preset.group === selectedGroup;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q || preset.name.toLowerCase().includes(q) || (preset.purpose && preset.purpose.toLowerCase().includes(q));
            return matchesGroup && matchesSearch;
        });
    }, [selectedGroup, searchQuery]);

    return (
        <div className="mb-4 relative z-20">
            <div className="flex items-center justify-between gap-3 bg-app/80 dark:bg-neutral-800/80 border border-line p-2.5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2.5 pl-1">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Zap size={14} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-ink flex items-center gap-2">
                            <span>{tt('Role Templates & Presets')}</span>
                            <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">32 Presets</span>
                        </div>
                        <p className="text-2xs text-ink-muted">{tt('Load preconfigured permission bundles by job title')}</p>
                    </div>
                </div>

                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        isOpen
                            ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                            : 'bg-surface hover:bg-interactive-hover border-line text-ink-secondary hover:text-ink'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span>{isOpen ? tt('Hide Presets') : tt('Browse Presets')}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {isOpen && (
                <div className="mt-2.5 bg-surface border border-line rounded-2xl p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                    {/* Header + Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-line">
                        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                            {groups.map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setSelectedGroup(g)}
                                    className={`px-2.5 py-1 rounded-lg text-2xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                                        selectedGroup === g
                                            ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                                            : 'bg-app border-line text-ink-muted hover:text-ink'
                                    }`}
                                >
                                    {tt(g)}
                                </button>
                            ))}
                        </div>
                        <div className="relative min-w-[200px]">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={tt('Search preset...')}
                                className="w-full bg-app border border-line rounded-xl pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand-500"
                            />
                        </div>
                    </div>

                    {/* Presets Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                        {filteredPresets.map(preset => (
                            <div
                                key={preset.id}
                                className="p-3 bg-app/50 hover:bg-app border border-line hover:border-line-strong rounded-xl flex flex-col justify-between gap-2.5 transition-all"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <h5 className="text-xs font-bold text-ink">{tt(preset.name)}</h5>
                                        <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 whitespace-nowrap">
                                            {preset.permissions.length} perms
                                        </span>
                                    </div>
                                    <p className="text-2xs text-ink-muted leading-tight line-clamp-2">{preset.purpose}</p>
                                    {preset.caution && (
                                        <p className="text-3xs text-amber-600 dark:text-amber-400 mt-1 font-medium">⚠️ {preset.caution}</p>
                                    )}
                                </div>
                                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-line/60">
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => {
                                            onApplyPreset(preset, 'merge');
                                            setIsOpen(false);
                                        }}
                                        title="Merge preset permissions with currently checked permissions"
                                        className="px-2.5 py-1 text-2xs font-bold uppercase tracking-wider rounded-lg border border-line bg-surface hover:bg-interactive-hover text-ink-secondary hover:text-ink transition-colors"
                                    >
                                        + {tt('Merge')}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => {
                                            onApplyPreset(preset, 'replace');
                                            setIsOpen(false);
                                        }}
                                        title="Replace current permissions with this preset"
                                        className="px-3 py-1 text-2xs font-bold uppercase tracking-wider rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all active:scale-95"
                                    >
                                        {tt('Apply (Replace)')}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredPresets.length === 0 && (
                            <div className="col-span-full py-8 text-center text-xs text-ink-muted">
                                {tt('No matching presets found.')}
                            </div>
                        )}
                    </div>
                </div>
            )}
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
export default function AdminUsers({
    users = [],
    invitations = [],
    attendance = [],
    staffData = [],
    approval_admin_enabled = null,
    usersWithApprovals = [],
}) {
    const { store, modules, settings } = usePage().props;
    const tt = useTermText();
    const [activeTab,    setActiveTab]    = useState('members');
    const [showAddModal, setShowAddModal] = useState(false);
    const [inviteStep,   setInviteStep]   = useState(1);
    const [presetCategory, setPresetCategory] = useState('All');
    const [presetSearch,   setPresetSearch]   = useState('');
    const [selectedPresetName, setSelectedPresetName] = useState(null);
    const [selectedRoleType,   setSelectedRoleType]   = useState('core'); // 'core' | 'presets'
    const [showFineTune,   setShowFineTune]   = useState(false);
    const [enablingLedger, setEnablingLedger] = useState(false);
    const [showStoreApprovalLockoutModal, setShowStoreApprovalLockoutModal] = useState(false);

    const isStoreApprovalOn = approval_admin_enabled !== null
        ? Boolean(approval_admin_enabled)
        : (settings?.approval_admin_enabled === '1' || settings?.approval_admin_enabled === 1 || settings?.approval_admin_enabled === true);

    const [approvalAdminEnabled, setApprovalAdminEnabled] = useState(() => isStoreApprovalOn);

    useEffect(() => {
        const nextVal = approval_admin_enabled !== null
            ? Boolean(approval_admin_enabled)
            : (settings?.approval_admin_enabled === '1' || settings?.approval_admin_enabled === 1 || settings?.approval_admin_enabled === true);
        setApprovalAdminEnabled(nextVal);
    }, [approval_admin_enabled, settings]);

    // Compute members who currently have active approval rules enforced
    const activeApprovalMembers = useMemo(() => {
        if (usersWithApprovals && usersWithApprovals.length > 0) {
            return usersWithApprovals;
        }
        return (users || []).filter(u => {
            const mode = u.transaction_approval_mode;
            if (mode === 'required' || mode === 'custom') return true;
            if (u.approval_overrides && typeof u.approval_overrides === 'object') {
                return Object.values(u.approval_overrides).some(val => val === 'required');
            }
            return false;
        });
    }, [usersWithApprovals, users]);

    const handleToggleStoreApprovalSystem = async () => {
        if (!store?.slug) return;
        const nextVal = !approvalAdminEnabled;

        // Prevent disabling store approvals if individual members have active approval rules
        if (!nextVal && activeApprovalMembers.length > 0) {
            setShowStoreApprovalLockoutModal(true);
            return;
        }

        setApprovalAdminEnabled(nextVal);
        if (nextVal) {
            setActiveStep2Accordion(2);
        }
        try {
            await axios.post(route('store.settings.update', { store_slug: store.slug }), {
                _save_section: 'approvals',
                approval_admin_enabled: nextVal ? '1' : '0'
            });
        } catch (err) {
            console.error('Failed to update approval setting:', err);
            setApprovalAdminEnabled(!nextVal);
            if (!nextVal) {
                setShowStoreApprovalLockoutModal(true);
            }
        }
    };

    const eligibleApprovers = useMemo(() => {
        return (users || []).filter(u => {
            const role = (u.role || '').toLowerCase();
            const perms = u.permissions || [];
            return ['owner', 'admin', 'manager'].includes(role) || perms.includes('approvals.approve') || perms.includes('approvals.review');
        });
    }, [users]);

    const { data, setData, post, processing, errors, reset } = useForm({
        invitee_name:  '',
        invitee_email: '',
        invitee_phone: '',
        id_card_number: '',
        designation: '',
        documents: [],
        roles:         ['cashier'],
        permissions:   ROLE_PERMISSIONS.cashier,
        transaction_approval_mode: null,
        assigned_approvers: [],
        approval_threshold_amount: '',
        approval_overrides: {},
    });

    const [activeStep2Accordion, setActiveStep2Accordion] = useState(() => {
        return isStoreApprovalOn ? 2 : 1;
    });

    const isModuleActive = (key) => {
        if (!modules) return false;
        if (Array.isArray(modules)) {
            return modules.some(m => (typeof m === 'string' ? m === key : m?.key === key && m?.enabled));
        }
        return false;
    };
    const [ledgerModuleActive, setLedgerModuleActive] = useState(() => isModuleActive('khata_credit'));

    useEffect(() => {
        setLedgerModuleActive(isModuleActive('khata_credit'));
    }, [modules]);

    const handleEnableLedger = async () => {
        if (!store?.slug || enablingLedger) return;
        setEnablingLedger(true);
        try {
            const currentMods = Array.isArray(modules)
                ? modules.map(m => (typeof m === 'string' ? m : (m?.enabled ? m?.key : null))).filter(Boolean)
                : [];
            const newMods = Array.from(new Set([...currentMods, 'khata_credit']));
            await axios.post(route('store.builder.apply', { store_slug: store.slug }), {
                modules: newMods
            });
            setLedgerModuleActive(true);
            router.reload({ only: ['modules', 'nav'] });
        } catch (err) {
            console.error('Failed to enable Ledger module via axios:', err);
            router.post(route('store.builder.apply', { store_slug: store.slug }), {
                modules: ['khata_credit']
            }, {
                preserveScroll: true,
                onSuccess: () => setLedgerModuleActive(true)
            });
        } finally {
            setEnablingLedger(false);
        }
    };

    const LEDGER_PERMISSIONS = [
        'parties.view',
        'parties.contact_view',
        'finance.transactions',
        'finance.receive_payment',
        'finance.send_payment'
    ];

    const hasLedgerAccess = useMemo(() => {
        return LEDGER_PERMISSIONS.some(p => (data?.permissions || []).includes(p));
    }, [data?.permissions]);

    const isApproverRequired = data.transaction_approval_mode && data.transaction_approval_mode !== 'direct';
    const hasSelectedApprover = (data.assigned_approvers || []).length > 0;
    const isStep2Valid = Boolean(data.transaction_approval_mode) && (!isApproverRequired || hasSelectedApprover);

    const handleToggleLedgerAccess = (enabled) => {
        setData(d => {
            const curr = d.permissions || [];
            let next;
            if (enabled) {
                next = Array.from(new Set([...curr, ...LEDGER_PERMISSIONS]));
            } else {
                next = curr.filter(p => !LEDGER_PERMISSIONS.includes(p));
            }
            return {
                ...d,
                permissions: next,
            };
        });
    };

    const filteredPresetsStep1 = useMemo(() => {
        return (STAFF_PRESETS || []).filter(preset => {
            const matchesGroup = presetCategory === 'All' || preset.group === presetCategory;
            const q = presetSearch.toLowerCase().trim();
            const matchesSearch = !q || preset.name.toLowerCase().includes(q) || (preset.purpose && preset.purpose.toLowerCase().includes(q));
            return matchesGroup && matchesSearch;
        });
    }, [presetCategory, presetSearch]);

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
                { id: 'summaries', label: tt('Staff Summaries'), icon: BarChart2 },
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

    const handleOpenAddModal = () => {
        setInviteStep(1);
        setSelectedPresetName(null);
        setShowFineTune(false);
        setData(d => ({
            ...d,
            roles: ['cashier'],
            permissions: ROLE_PERMISSIONS.cashier,
            transaction_approval_mode: 'inherit',
        }));
        setShowAddModal(true);
    };

    const handleCloseAddModal = () => {
        setShowAddModal(false);
        setInviteStep(1);
        setSelectedPresetName(null);
        setShowFineTune(false);
        reset();
    };

    // ── Invite form submit
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!store?.slug) return;
        post(route('store.admin.invitations.store', { store_slug: store.slug }), {
            onSuccess: () => { handleCloseAddModal(); },
        });
    };

    // ── Role toggle in form
    const toggleRole = (roleKey) => {
        setSelectedPresetName(null);
        setData(d => ({
            ...d,
            roles: [roleKey],
            permissions: ROLE_PERMISSIONS[roleKey] || []
        }));
    };

    const handleApplyPreset = (preset, mode) => {
        setSelectedPresetName(preset.name);
        const targetPerms = mode === 'merge'
            ? Array.from(new Set([...(data.permissions || []), ...preset.permissions]))
            : [...preset.permissions];
        setData(d => ({
            ...d,
            roles: ['custom'],
            permissions: targetPerms,
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
                            onClick={handleOpenAddModal}
                            className="relative h-full px-5 py-2.5 !text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-slow flex items-center gap-2 overflow-hidden group shadow-xl"
                            style={{ color: '#ffffff' }}
                        >
                            {/* Midnight Nebula Background */}
                            <div className="absolute inset-0 bg-neutral-900 z-0">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-brand-600/50 rounded-full blur-xl -translate-y-1/2 translate-x-1/4 group-hover:bg-brand-500/60 transition-colors animate-pulse"></div>
                                <div className="absolute bottom-0 left-0 w-16 h-16 bg-brand-600/30 rounded-full blur-xl translate-y-1/3 -translate-x-1/3 group-hover:bg-brand-500/40 transition-colors"></div>
                                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-60"></div>
                            </div>
                            {/* Content */}
                            <Plus size={16} strokeWidth={3} className="relative z-10 text-white" />
                            <span className="hidden sm:inline relative z-10 text-white font-bold">Invite Member</span>
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
                        <StatCard title={tt('Total Staff')} value={attendanceStats.totalStaff}   icon={<Users size={16} />}         color="bg-neutral-500" />
                    </div>
                )}

                {activeTab === 'summaries' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
                        <StatCard title={tt('Active Staff')} value={stats.totalStaff}             icon={<Users size={16} />}         color="bg-brand-500" />
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
                                        <h3 className="text-lg font-bold text-ink-secondary dark:text-white">{tt('No staff performance data')}</h3>
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

            {showAddModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 bg-surface z-[99999] flex flex-col w-full h-full p-0 m-0 overflow-hidden animate-in fade-in duration-200">

                    {/* TOP MODAL HEADER & STEPPER */}
                    <div className="px-6 py-4 md:px-8 pr-16 md:pr-20 border-b border-line bg-surface flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 relative">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg md:text-xl text-ink tracking-tight">
                                            {inviteStep === 1 && 'Step 1: Role & Permissions'}
                                            {inviteStep === 2 && 'Step 2: Approvals & Ledger Privileges'}
                                            {inviteStep === 3 && 'Step 3: Member Details & Credentials'}
                                        </h3>
                                        <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                                            Step {inviteStep} of 3
                                        </span>
                                    </div>
                                    <p className="text-xs text-ink-muted mt-0.5">
                                        {inviteStep === 1 && 'Select a standard role or an industry preset, then review and customize permissions on the right.'}
                                        {inviteStep === 2 && 'Set transaction verification rules, enable store ledger access, or customize permissions.'}
                                        {inviteStep === 3 && 'Enter employee contact info, identification number, and send the invitation.'}
                                    </p>
                                </div>
                            </div>

                            {/* Stepper Indicator */}
                            <div className="flex items-center gap-1.5 shrink-0 self-start lg:self-center">
                                {[
                                    { num: 1, label: 'Template & Perms' },
                                    { num: 2, label: 'Approvals & Ledger' },
                                    { num: 3, label: 'Details' }
                                ].map((s, idx) => {
                                    const isCurrent = inviteStep === s.num;
                                    const isDone = inviteStep > s.num;
                                    return (
                                        <React.Fragment key={s.num}>
                                            {idx > 0 && (
                                                <div className={`h-0.5 w-4 sm:w-6 transition-colors ${isDone ? 'bg-brand-500' : 'bg-line'}`} />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (isDone || (s.num === 2 && data.roles.length > 0)) {
                                                        setInviteStep(s.num);
                                                    }
                                                }}
                                                disabled={!isDone && !isCurrent}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                                                    isCurrent
                                                        ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/20'
                                                        : isDone
                                                            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 hover:bg-brand-500/20'
                                                            : 'bg-app text-ink-muted border border-line opacity-60 cursor-not-allowed'
                                                }`}
                                            >
                                                {isDone ? (
                                                    <Check size={12} strokeWidth={3} className="text-brand-600 dark:text-brand-400" />
                                                ) : (
                                                    <span className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-3xs font-black">
                                                        {s.num}
                                                    </span>
                                                )}
                                                <span className="hidden md:inline">{s.label}</span>
                                            </button>
                                        </React.Fragment>
                                    );
                                })}
                            </div>

                            {/* Close button */}
                            <button
                                onClick={handleCloseAddModal}
                                className="absolute top-4 right-4 p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors z-20 border border-line-subtle bg-surface"
                                title="Close dialog"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* STEP 1: ROLE & TEMPLATE SELECTION (CENTERED MODERN LAYOUT) */}
                        {inviteStep === 1 && (
                            <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8 custom-scrollbar">
                                <div className="w-full max-w-5xl xl:max-w-6xl mx-auto flex flex-col gap-4 pb-28">

                                    {/* Section 1: Role Selection */}
                                    <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-xs">
                                        <div className="px-5 sm:px-6 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-app/20">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center shrink-0 font-extrabold text-xs">
                                                    1
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-ink">Select Staff Role & Template</h4>
                                                    <p className="text-2xs text-ink-muted">Choose a primary operational role or specialized industry preset for this team member.</p>
                                                </div>
                                            </div>

                                            {/* Role Mode Switcher */}
                                            <div className="flex items-center gap-1.5 p-1 bg-app border border-line rounded-xl shrink-0 self-start sm:self-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedRoleType('core')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                        selectedRoleType === 'core'
                                                            ? 'bg-surface text-ink shadow-xs border border-line'
                                                            : 'text-ink-muted hover:text-ink'
                                                    }`}
                                                >
                                                    <Crown size={13} className="text-amber-500" />
                                                    <span>Standard Roles</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedRoleType('presets')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                        selectedRoleType === 'presets'
                                                            ? 'bg-surface text-ink shadow-xs border border-line'
                                                            : 'text-ink-muted hover:text-ink'
                                                    }`}
                                                >
                                                    <Zap size={13} className="text-brand-500" />
                                                    <span>Industry Presets (32)</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-5 sm:p-6 space-y-4">
                                            {selectedRoleType === 'core' && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {Object.entries(ROLES).map(([key, role]) => {
                                                        const isSelected = !selectedPresetName && data.roles.includes(key);
                                                        const RoleIcon = role.icon;
                                                        const permsCount = (ROLE_PERMISSIONS[key] || []).length;
                                                        return (
                                                            <button
                                                                key={key}
                                                                type="button"
                                                                onClick={() => toggleRole(key)}
                                                                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 group relative ${
                                                                    isSelected
                                                                        ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500/20 shadow-xs'
                                                                        : 'bg-surface border-line hover:border-line-strong hover:bg-interactive-hover/40'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-2.5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                                                                            isSelected
                                                                                ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                                                                                : 'bg-app border-line text-brand-600 dark:text-brand-400'
                                                                        }`}>
                                                                            <RoleIcon size={20} />
                                                                        </div>
                                                                        <div>
                                                                            <h5 className="text-xs font-bold text-ink group-hover:text-brand-600 transition-colors">
                                                                                {tt(role.name)}
                                                                            </h5>
                                                                            <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-app border border-line text-ink-muted mt-0.5 inline-block">
                                                                                {permsCount} Capabilities
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                                                        isSelected ? 'bg-brand-600 border-brand-500 text-white' : 'border-line bg-surface'
                                                                    }`}>
                                                                        {isSelected && <Check size={10} strokeWidth={3} />}
                                                                    </div>
                                                                </div>
                                                                <p className="text-2xs text-ink-muted leading-relaxed line-clamp-2">
                                                                    {tt(role.description)}
                                                                </p>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {selectedRoleType === 'presets' && (
                                                <div className="space-y-4">
                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                                        <div className="relative flex-1 max-w-md">
                                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                                                            <input
                                                                type="text"
                                                                value={presetSearch}
                                                                onChange={e => setPresetSearch(e.target.value)}
                                                                placeholder="Search presets (e.g. Pharmacist, Barista, Warehouse Lead)..."
                                                                className="w-full bg-app border border-line rounded-xl pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                                                            {['All', 'Sales floor', 'Stock & purchasing', 'Money & accounting', 'Review & administration', 'Leadership'].map(cat => (
                                                                <button
                                                                    key={cat}
                                                                    type="button"
                                                                    onClick={() => setPresetCategory(cat)}
                                                                    className={`px-2.5 py-1.5 rounded-lg text-3xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                                                                        presetCategory === cat
                                                                            ? 'bg-brand-600 text-white border-brand-500 shadow-xs'
                                                                            : 'bg-app border-line text-ink-muted hover:text-ink'
                                                                    }`}
                                                                >
                                                                    {tt(cat)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {filteredPresetsStep1.map(preset => {
                                                            const isSelected = selectedPresetName === preset.name;
                                                            return (
                                                                <button
                                                                    key={preset.id}
                                                                    type="button"
                                                                    onClick={() => handleApplyPreset(preset, 'replace')}
                                                                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2.5 ${
                                                                        isSelected
                                                                            ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500/20 shadow-xs'
                                                                            : 'bg-surface border-line hover:border-line-strong hover:bg-interactive-hover/40'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div>
                                                                            <h5 className="text-xs font-bold text-ink leading-tight">{tt(preset.name)}</h5>
                                                                            <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 mt-1 inline-block">
                                                                                {preset.group} • {preset.permissions.length} perms
                                                                            </span>
                                                                        </div>
                                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                                                            isSelected ? 'bg-brand-600 border-brand-500 text-white' : 'border-line bg-surface'
                                                                        }`}>
                                                                            {isSelected && <Check size={10} strokeWidth={3} />}
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-2xs text-ink-muted leading-relaxed line-clamp-2">{preset.purpose}</p>
                                                                    {preset.caution && (
                                                                        <p className="text-3xs text-amber-600 dark:text-amber-400 font-medium">⚠️ {preset.caution}</p>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                        {filteredPresetsStep1.length === 0 && (
                                                            <div className="col-span-full py-8 text-center text-xs text-ink-muted">
                                                                No presets match your search query.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 2: Included Capabilities & Fine-Tuning */}
                                    <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-xs">
                                        <div className="px-5 sm:px-6 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-app/20">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center shrink-0 font-extrabold text-xs">
                                                    2
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-bold text-ink">Included Capabilities & Permissions</h4>
                                                        <span className="text-3xs font-black tracking-wider px-2.5 py-0.5 rounded-full uppercase bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                                                            {data.permissions.length} Active
                                                        </span>
                                                    </div>
                                                    <p className="text-2xs text-ink-muted">
                                                        Preview abilities granted by this role. You can customize fine permissions anytime.
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setShowFineTune(prev => !prev)}
                                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 shrink-0 ${
                                                    showFineTune
                                                        ? 'bg-brand-600 text-white border-brand-500 shadow-xs'
                                                        : 'bg-surface border-line text-ink hover:border-brand-500/50'
                                                }`}
                                            >
                                                <Settings size={14} />
                                                <span>{showFineTune ? 'Close Fine-Tuning' : 'Fine-Tune Permissions'}</span>
                                                <ChevronDown size={14} className={`transition-transform duration-200 ${showFineTune ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>

                                        <div className="p-5 sm:p-6 space-y-4">
                                            {!showFineTune ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {PERMISSION_CATEGORIES.map(cat => {
                                                        const count = cat.permissions.filter(p => data.permissions.includes(p.id)).length;
                                                        const total = cat.permissions.length;
                                                        const isFull = count === total && total > 0;
                                                        const isPartial = count > 0 && !isFull;
                                                        const CatIcon = cat.icon;

                                                        return (
                                                            <div key={cat.id} className="p-3.5 rounded-xl bg-app/40 border border-line flex items-center justify-between gap-3">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                                                        isFull
                                                                            ? 'bg-brand-500/15 border-brand-500/30 text-brand-600 dark:text-brand-400'
                                                                            : isPartial
                                                                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                                                                : 'bg-app border-line text-ink-muted'
                                                                    }`}>
                                                                        <CatIcon size={17} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h5 className="text-xs font-bold text-ink truncate">{tt(cat.name)}</h5>
                                                                        <p className="text-3xs text-ink-muted">{count} of {total} abilities enabled</p>
                                                                    </div>
                                                                </div>
                                                                <span className={`text-3xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                                                                    isFull
                                                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                                                                        : isPartial
                                                                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                                                                            : 'bg-app text-ink-muted border-line'
                                                                }`}>
                                                                    {isFull ? 'Full Access' : isPartial ? 'Partial' : 'No Access'}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="pt-2">
                                                    <PermissionsSelector
                                                        selectedPermissions={data.permissions}
                                                        onChange={(perms) => setData(d => ({ ...d, roles: ['custom'], permissions: perms }))}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* STEP 2: APPROVAL POLICY & ASSIGNED APPROVERS */}
                        {inviteStep === 2 && (
                            <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8 custom-scrollbar">
                                <div className="w-full max-w-5xl xl:max-w-6xl mx-auto flex flex-col gap-4 pb-28">

                                    {/* Section 1: Store Approval System Feature Toggle */}
                                    <div className="bg-surface rounded-2xl border border-line overflow-hidden transition-all shadow-xs">
                                        <button
                                            type="button"
                                            onClick={() => setActiveStep2Accordion(activeStep2Accordion === 1 ? null : 1)}
                                            className="w-full h-14 px-5 sm:px-6 flex items-center justify-between gap-4 text-left hover:bg-interactive-hover/60 transition-colors select-none"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="w-8 h-8 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center shrink-0 font-extrabold text-xs">
                                                    1
                                                </div>
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <h4 className="text-xs sm:text-sm font-bold text-ink truncate">Store Approvals Feature Status</h4>
                                                    <span className={`text-3xs font-black tracking-wider px-2.5 py-0.5 rounded-full uppercase border shrink-0 inline-flex items-center ${
                                                        approvalAdminEnabled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                    }`}>
                                                        {approvalAdminEnabled ? 'ON' : 'OFF'}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronDown size={18} className={`text-ink-muted transition-transform duration-200 shrink-0 ${activeStep2Accordion === 1 ? 'rotate-180' : ''}`} />
                                        </button>

                                        {activeStep2Accordion === 1 && (
                                            <div className="px-5 sm:px-6 py-5 border-t border-line/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-app/30">
                                                <p className="text-xs text-ink-muted leading-relaxed max-w-xl">
                                                    {approvalAdminEnabled
                                                        ? 'Store-wide approval workflows are ACTIVE. Transactions requiring authorization will show on the central approvals queue and sidebar badge for managers.'
                                                        : 'Store-wide approval workflows are currently OFF. Turn it ON to enable maker-checker verification queues and dual control.'}
                                                </p>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={handleToggleStoreApprovalSystem}
                                                        aria-label="Toggle Store Approval System"
                                                        className={`relative inline-flex h-11 w-28 p-1 rounded-full cursor-pointer transition-colors duration-300 ease-in-out border shadow-inner ${
                                                            approvalAdminEnabled ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-amber-500/20 border-amber-500/30'
                                                        }`}
                                                    >
                                                        <span className="absolute inset-0 flex items-center justify-between px-3.5 text-3xs font-black uppercase tracking-wider pointer-events-none select-none">
                                                            <span className={!approvalAdminEnabled ? 'opacity-0' : 'text-emerald-700 dark:text-emerald-300 font-bold'}>OFF</span>
                                                            <span className={approvalAdminEnabled ? 'opacity-0' : 'text-amber-700 dark:text-amber-300 font-bold'}>ON</span>
                                                        </span>
                                                        <span className={`pointer-events-none inline-flex h-8 w-12 rounded-full bg-white dark:bg-neutral-900 shadow-md transform transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] items-center justify-center font-extrabold text-xs tracking-wider ${
                                                            approvalAdminEnabled ? 'translate-x-[52px] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'translate-x-0 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                                        }`}>
                                                            {approvalAdminEnabled ? 'ON' : 'OFF'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 2: Member Approval Policy & Custom Overrides */}
                                    <div className={`bg-surface rounded-2xl border transition-all overflow-hidden shadow-xs ${!data.transaction_approval_mode ? 'border-amber-500/40 ring-2 ring-amber-500/10' : 'border-line'}`}>
                                        <button
                                            type="button"
                                            onClick={() => setActiveStep2Accordion(activeStep2Accordion === 2 ? null : 2)}
                                            className="w-full h-14 px-5 sm:px-6 flex items-center justify-between gap-4 text-left hover:bg-interactive-hover/60 transition-colors select-none"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs ${
                                                    data.transaction_approval_mode ? 'bg-emerald-500 text-white shadow-xs' : 'bg-amber-500 text-white animate-pulse'
                                                }`}>
                                                    {data.transaction_approval_mode ? <Check size={14} strokeWidth={3} /> : 2}
                                                </div>
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <h4 className="text-xs sm:text-sm font-bold text-ink truncate">Member Approval Policy & Threshold Limits</h4>
                                                    {!data.transaction_approval_mode ? (
                                                        <span className="text-3xs font-black tracking-wider px-2.5 py-0.5 rounded-full uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                                                            Selection Required
                                                        </span>
                                                    ) : (
                                                        <span className="text-3xs font-black tracking-wider px-2.5 py-0.5 rounded-full uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                                            {data.transaction_approval_mode === 'inherit' && 'Store Policy'}
                                                            {data.transaction_approval_mode === 'required' && 'Always Require Approval'}
                                                            {data.transaction_approval_mode === 'direct' && 'Direct Posting'}
                                                            {data.transaction_approval_mode === 'custom' && 'Custom Action Rules'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronDown size={18} className={`text-ink-muted transition-transform duration-200 shrink-0 ${activeStep2Accordion === 2 ? 'rotate-180' : ''}`} />
                                        </button>

                                        {activeStep2Accordion === 2 && (
                                            <div className="p-5 sm:p-6 border-t border-line/60 bg-app/30 space-y-5">
                                                {/* Compact Horizontal Threshold Row */}
                                                <div className="p-4 sm:p-5 rounded-xl bg-surface border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                                                    <div>
                                                        <h5 className="text-xs font-bold text-ink uppercase tracking-wider">
                                                            Single Transaction Approval Threshold ({getCurrencySymbol()})
                                                        </h5>
                                                        <p className="text-2xs text-ink-muted mt-0.5">
                                                            Require supervisor check if any single transaction created by this member exceeds:
                                                        </p>
                                                    </div>
                                                    <div className="relative w-full sm:w-64 shrink-0">
                                                        <span className="absolute left-3.5 top-2.5 text-xs font-bold text-ink-muted">{getCurrencySymbol()}</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="e.g. 50000 (Blank = No Limit)"
                                                            value={data.approval_threshold_amount || ''}
                                                            onChange={e => setData('approval_threshold_amount', e.target.value)}
                                                            className="w-full pl-8 pr-4 py-2 bg-app border border-line rounded-xl text-xs font-semibold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Policy Cards Grid */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                    {[
                                                        {
                                                            id: 'inherit',
                                                            title: 'Follow Store Policy',
                                                            badge: 'Standard',
                                                            badgeColor: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20',
                                                            icon: Shield,
                                                            desc: 'Applies standard store-wide verification rules automatically.'
                                                        },
                                                        {
                                                            id: 'required',
                                                            title: 'Always Require Approval',
                                                            badge: 'Strict Verification',
                                                            badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                                                            icon: Clock,
                                                            desc: 'Every transaction made by this member is held for supervisor approval.'
                                                        },
                                                        {
                                                            id: 'direct',
                                                            title: 'Direct Posting',
                                                            badge: 'High Trust',
                                                            badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                                                            icon: Zap,
                                                            desc: 'Finalizes transactions immediately without waiting in queue.'
                                                        },
                                                        {
                                                            id: 'custom',
                                                            title: 'Custom Action Rules',
                                                            badge: 'Fine-tune Actions',
                                                            badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
                                                            icon: Settings,
                                                            desc: 'Set custom approval rules per transaction type (POS, Invoice, Expenses).'
                                                        }
                                                    ].map(opt => {
                                                        const isSelected = data.transaction_approval_mode === opt.id;
                                                        const OptIcon = opt.icon;
                                                        return (
                                                            <button
                                                                key={opt.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setData('transaction_approval_mode', opt.id);
                                                                    if (opt.id !== 'direct' && (data.assigned_approvers || []).length === 0) {
                                                                        setActiveStep2Accordion(3);
                                                                    }
                                                                }}
                                                                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                                                                    isSelected
                                                                        ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500/20 shadow-xs'
                                                                        : 'bg-surface border-line hover:border-line-strong hover:bg-interactive-hover/40'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <OptIcon size={16} className={isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-ink-muted'} />
                                                                        <span className="text-xs font-bold text-ink">{opt.title}</span>
                                                                    </div>
                                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                                                        isSelected ? 'bg-brand-600 border-brand-500 text-white' : 'border-line bg-surface'
                                                                    }`}>
                                                                        {isSelected && <Check size={10} strokeWidth={3} />}
                                                                    </div>
                                                                </div>
                                                                <span className={`inline-block text-3xs font-bold px-2 py-0.5 rounded-full border w-fit ${opt.badgeColor}`}>
                                                                    {opt.badge}
                                                                </span>
                                                                <p className="text-2xs text-ink-muted leading-relaxed">{opt.desc}</p>
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Granular Action Rules (Visible when 'custom' is selected) */}
                                                {data.transaction_approval_mode === 'custom' && (
                                                    <div className="pt-3 border-t border-line space-y-4 animate-in fade-in duration-200">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shrink-0" />
                                                                    <h5 className="text-xs font-bold text-ink uppercase tracking-wider">
                                                                        Per-Action Approval Overrides (Filtered by Granted Permissions)
                                                                    </h5>
                                                                </div>
                                                                <p className="text-2xs text-ink-muted mt-0.5">
                                                                    Specify exact approval behavior for operations permitted in Step 1.
                                                                </p>
                                                            </div>
                                                            <span className="text-3xs font-black tracking-wider px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0 self-start sm:self-auto">
                                                                Custom Rules Active
                                                            </span>
                                                        </div>

                                                        {/* Clean Category Grid */}
                                                        {(() => {
                                                            const activePerms = data.permissions || [];
                                                            const hasPerm = (p) => activePerms.includes(p);

                                                            const actionGroups = [
                                                                {
                                                                    title: 'POS Screen Operations',
                                                                    items: [
                                                                        { key: 'pos_void', label: 'POS Item Voids & Cancellations', reqPerm: 'pos.void_item' },
                                                                        { key: 'pos_refund', label: 'POS Sales Refunds', reqPerm: 'pos.refund' },
                                                                        { key: 'pos_discount', label: 'High Manual POS Discounts', reqPerm: 'pos.discounts' },
                                                                    ].filter(i => hasPerm(i.reqPerm))
                                                                },
                                                                {
                                                                    title: 'Sales & Invoicing Operations',
                                                                    items: [
                                                                        { key: 'sales_invoice', label: 'Admin Sales Invoices', reqPerm: 'sales.create' },
                                                                        { key: 'sales_return', label: 'Sales Returns & Credit Notes', reqPerm: 'sales.returns' },
                                                                    ].filter(i => hasPerm(i.reqPerm))
                                                                },
                                                                {
                                                                    title: 'Purchases & Inventory Controls',
                                                                    items: [
                                                                        { key: 'purchase_posting', label: 'Purchase Bills & Receipts', reqPerm: 'purchases.create' },
                                                                        { key: 'purchase_return', label: 'Purchase Returns (Debit Notes)', reqPerm: 'purchases.returns' },
                                                                        { key: 'inventory_adjust', label: 'Manual Stock Adjustments', reqPerm: 'inventory.adjust' },
                                                                    ].filter(i => hasPerm(i.reqPerm))
                                                                },
                                                                {
                                                                    title: 'Financial & Ledger Operations',
                                                                    items: [
                                                                        { key: 'operating_expense', label: 'Operating Expenses & Petty Cash', reqPerm: 'finance.expenses' },
                                                                        { key: 'supplier_payment', label: 'Supplier Outgoing Payments', reqPerm: 'finance.send_payment' },
                                                                        { key: 'customer_receipt', label: 'Customer Receipts', reqPerm: 'finance.receive_payment' },
                                                                        { key: 'capital_injection', label: 'Owner Capital Injection', reqPerm: 'finance.capital_add' },
                                                                        { key: 'owner_drawings', label: 'Owner Drawings & Withdrawals', reqPerm: 'finance.owner_drawings' },
                                                                        { key: 'fund_transfer', label: 'Internal Vault Transfers', reqPerm: 'finance.internal_transfer' },
                                                                    ].filter(i => hasPerm(i.reqPerm))
                                                                }
                                                            ].filter(g => g.items.length > 0);

                                                            if (actionGroups.length === 0) {
                                                                return (
                                                                    <div className="p-4 text-center text-xs text-ink-muted bg-surface rounded-xl border border-line">
                                                                        No specific approval-controlled action permissions (e.g. Voids, Refunds, Expenses, Purchases) were granted to this member in Step 1.
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                                    {actionGroups.map((group, gIdx) => (
                                                                        <div key={gIdx} className="p-4 rounded-xl bg-surface border border-line flex flex-col gap-3 shadow-xs">
                                                                            <div className="flex items-center justify-between pb-2 border-b border-line">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                                                                                    <span className="text-2xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                                                                                        {group.title}
                                                                                    </span>
                                                                                </div>
                                                                                <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-app border border-line text-ink-muted">
                                                                                    {group.items.length} {group.items.length === 1 ? 'action' : 'actions'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                {group.items.map(action => {
                                                                                    const currentVal = data.approval_overrides?.[action.key] || 'inherit';
                                                                                    return (
                                                                                        <div key={action.key} className="flex items-center justify-between p-2.5 rounded-lg bg-app/60 border border-line hover:border-line-strong transition-colors gap-3">
                                                                                            <span className="text-xs font-medium text-ink truncate min-w-0" title={action.label}>
                                                                                                {action.label}
                                                                                            </span>
                                                                                            <select
                                                                                                value={currentVal}
                                                                                                onChange={e => setData('approval_overrides', {
                                                                                                    ...data.approval_overrides,
                                                                                                    [action.key]: e.target.value
                                                                                                })}
                                                                                                className="bg-surface border border-line rounded-lg px-2.5 py-1.5 text-2xs font-semibold text-ink focus:ring-1 focus:ring-brand-500 outline-none shrink-0 cursor-pointer shadow-2xs"
                                                                                            >
                                                                                                <option value="inherit">Follow Store Policy (Default)</option>
                                                                                                <option value="required">Always Require Approval</option>
                                                                                                <option value="direct">Direct Posting (Bypass)</option>
                                                                                            </select>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 3: Assigned Supervisors & Approvers */}
                                    {data.transaction_approval_mode !== 'direct' && (
                                        <div className={`bg-surface rounded-2xl border transition-all overflow-hidden shadow-xs ${
                                            isApproverRequired && !hasSelectedApprover ? 'border-amber-500/60 ring-2 ring-amber-500/20' : 'border-line'
                                        }`}>
                                            <button
                                                type="button"
                                                onClick={() => setActiveStep2Accordion(activeStep2Accordion === 3 ? null : 3)}
                                                className="w-full h-14 px-5 sm:px-6 flex items-center justify-between gap-4 text-left hover:bg-interactive-hover/60 transition-colors select-none"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs transition-colors ${
                                                        isApproverRequired && !hasSelectedApprover
                                                            ? 'bg-amber-500 text-white animate-pulse'
                                                            : 'bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                                                    }`}>
                                                        3
                                                    </div>
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <h4 className="text-xs sm:text-sm font-bold text-ink truncate">Assigned Supervisors & Approvers</h4>
                                                        {isApproverRequired && !hasSelectedApprover ? (
                                                            <span className="text-3xs font-black tracking-wider px-2.5 py-0.5 rounded-full uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0 flex items-center gap-1">
                                                                <AlertTriangle size={10} />
                                                                1 Approver Required
                                                            </span>
                                                        ) : (
                                                            <span className="text-3xs font-black tracking-wider px-2.5 py-0.5 rounded-full uppercase bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0">
                                                                {(data.assigned_approvers || []).length} Selected
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronDown size={18} className={`text-ink-muted transition-transform duration-200 shrink-0 ${activeStep2Accordion === 3 ? 'rotate-180' : ''}`} />
                                            </button>

                                            {activeStep2Accordion === 3 && (
                                                <div className="p-5 sm:p-6 border-t border-line/60 bg-app/30 space-y-4">
                                                    {isApproverRequired && !hasSelectedApprover && (
                                                        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
                                                            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="font-bold">Supervisor Assignment Required</p>
                                                                <p className="text-2xs opacity-90 mt-0.5">
                                                                    Because approvals are required for this member, you must select at least one supervisor or manager below who will review and authorize their transactions.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {eligibleApprovers.map(approver => {
                                                            const isSelected = (data.assigned_approvers || []).includes(approver.id);
                                                            return (
                                                                <button
                                                                    key={approver.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const curr = data.assigned_approvers || [];
                                                                        const next = isSelected
                                                                            ? curr.filter(id => id !== approver.id)
                                                                            : [...curr, approver.id];
                                                                        setData('assigned_approvers', next);
                                                                    }}
                                                                    className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                                                                        isSelected
                                                                            ? 'bg-brand-50/80 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500/20 shadow-xs'
                                                                            : 'bg-surface border-line hover:border-line-strong hover:bg-interactive-hover/40'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                                            {approver.name?.charAt(0).toUpperCase() || 'U'}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <h5 className="text-xs font-bold text-ink truncate">{approver.name}</h5>
                                                                            <p className="text-3xs text-ink-muted truncate">{approver.email || approver.role}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                                                        isSelected ? 'bg-brand-600 border-brand-500 text-white' : 'border-line bg-surface'
                                                                    }`}>
                                                                        {isSelected && <Check size={10} strokeWidth={3} />}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                        {eligibleApprovers.length === 0 && (
                                                            <div className="col-span-full py-6 text-center text-xs text-ink-muted bg-surface rounded-xl border border-line">
                                                                No eligible supervisors found in this store yet.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            </div>
                        )}

                        {/* STEP 3: MEMBER DETAILS & INVITATION (CENTERED MODERN LAYOUT) */}
                        {inviteStep === 3 && (
                            <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8 custom-scrollbar">
                                <form id="invite-step3-form" onSubmit={handleSubmit} className="w-full max-w-5xl xl:max-w-6xl mx-auto flex flex-col gap-4 pb-28">

                                    {/* Section 1: Member Credentials & Contact */}
                                    <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-xs">
                                        <div className="px-5 sm:px-6 py-4 border-b border-line flex items-center justify-between bg-app/20">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center shrink-0 font-extrabold text-xs">
                                                    1
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-ink">Member Profile & Contact Details</h4>
                                                    <p className="text-2xs text-ink-muted">Enter the person's name and login email address to generate their invitation.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 sm:p-6 space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Full Name */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                                                        <User size={14} className="text-brand-500" />
                                                        Full Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.invitee_name}
                                                        onChange={e => setData('invitee_name', e.target.value)}
                                                        placeholder="e.g. John Doe"
                                                        required
                                                        className="w-full px-4 py-2.5 bg-app border border-line rounded-xl text-xs font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted"
                                                    />
                                                    {errors.invitee_name && <p className="text-xs text-red-500">{errors.invitee_name}</p>}
                                                </div>

                                                {/* Email Address */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                                                        <Mail size={14} className="text-brand-500" />
                                                        Email Address <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={data.invitee_email}
                                                        onChange={e => setData('invitee_email', e.target.value)}
                                                        placeholder="e.g. john@company.com"
                                                        required
                                                        className="w-full px-4 py-2.5 bg-app border border-line rounded-xl text-xs font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted"
                                                    />
                                                    {errors.invitee_email && <p className="text-xs text-red-500">{errors.invitee_email}</p>}
                                                </div>

                                                {/* Phone Number */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                                                        <Phone size={14} className="text-ink-muted" />
                                                        Phone Number (Optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.invitee_phone}
                                                        onChange={e => setData('invitee_phone', e.target.value)}
                                                        placeholder="e.g. +92 300 1234567"
                                                        className="w-full px-4 py-2.5 bg-app border border-line rounded-xl text-xs font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted"
                                                    />
                                                </div>

                                                {/* Job Title / Designation */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                                                        <BadgeCheck size={14} className="text-ink-muted" />
                                                        Job Title / Designation (Optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.designation}
                                                        onChange={e => setData('designation', e.target.value)}
                                                        placeholder="e.g. Senior Cashier, Floor Supervisor"
                                                        className="w-full px-4 py-2.5 bg-app border border-line rounded-xl text-xs font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: ID & Security Vault (Optional) */}
                                    <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-xs">
                                        <div className="px-5 sm:px-6 py-4 border-b border-line flex items-center justify-between bg-app/20">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center shrink-0 font-extrabold text-xs">
                                                    2
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-ink">Staff Identification & Documents (Optional)</h4>
                                                    <p className="text-2xs text-ink-muted">Attach identity verification for store audit and HR records.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 sm:p-6 space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-ink">
                                                        ID Card / CNIC / Staff Badge Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.id_card_number}
                                                        onChange={e => setData('id_card_number', e.target.value)}
                                                        placeholder="e.g. 42101-1234567-1 or EMP-104"
                                                        className="w-full px-4 py-2.5 bg-app border border-line rounded-xl text-xs font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted"
                                                    />
                                                </div>

                                                {/* Dropzone */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                                                        <Paperclip size={14} className="text-brand-500" />
                                                        Attach Documents (CNIC, Contract, Letter)
                                                    </label>
                                                    <div className="relative border-2 border-dashed border-line hover:border-brand-500/50 bg-app/60 hover:bg-brand-50/20 rounded-xl p-3 text-center transition-all cursor-pointer">
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept="image/*,.pdf,.doc,.docx"
                                                            onChange={(e) => {
                                                                const files = Array.from(e.target.files || []);
                                                                if (files.length === 0) return;
                                                                const newDocs = files.map(file => ({
                                                                    id: Math.random().toString(36).substring(2, 9),
                                                                    name: file.name,
                                                                    size: (file.size / 1024).toFixed(1) + ' KB',
                                                                    type: file.type.includes('image') ? 'image' : 'document',
                                                                    rawFile: file,
                                                                    previewUrl: file.type.includes('image') ? URL.createObjectURL(file) : null
                                                                }));
                                                                setData('documents', [...(data.documents || []), ...newDocs]);
                                                            }}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        />
                                                        <div className="flex items-center justify-center gap-2 text-2xs text-ink-muted">
                                                            <UploadCloud size={16} className="text-brand-500" />
                                                            <span>Click or drag files here (PNG, JPG, PDF up to 10MB)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Uploaded Documents List */}
                                            {data.documents && data.documents.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
                                                    {data.documents.map(doc => (
                                                        <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-line text-xs">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center shrink-0">
                                                                    {doc.type === 'image' ? <FileText size={14} /> : <Paperclip size={14} />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-bold text-ink truncate text-xs">{doc.name}</p>
                                                                    <p className="text-3xs text-ink-muted">{doc.size}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setData('documents', (data.documents || []).filter(d => d.id !== doc.id))}
                                                                className="p-1 text-ink-muted hover:text-red-500 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 3: Pre-Flight Invitation Summary (Full Review Card) */}
                                    <div className="bg-gradient-to-br from-surface to-brand-500/5 rounded-2xl border border-brand-500/30 overflow-hidden shadow-xs">
                                        <div className="px-5 sm:px-6 py-4 border-b border-brand-500/20 flex items-center justify-between bg-brand-500/5">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 font-extrabold text-xs shadow-xs">
                                                    <CheckCircle size={16} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-ink">Pre-Flight Invitation Summary</h4>
                                                    <p className="text-2xs text-ink-muted">Confirm details before sending the invitation.</p>
                                                </div>
                                            </div>
                                            <span className="text-3xs font-black tracking-wider px-2.5 py-0.5 rounded-full uppercase bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                                                Ready to Send
                                            </span>
                                        </div>

                                        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {/* Role Card */}
                                            <div className="p-4 rounded-xl bg-surface/80 border border-line space-y-1">
                                                <span className="text-3xs font-bold uppercase tracking-wider text-ink-muted">Assigned Role</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-ink truncate">
                                                        {selectedPresetName || ROLES[data.roles[0]]?.name || 'Custom Role'}
                                                    </span>
                                                </div>
                                                <p className="text-3xs text-ink-muted line-clamp-1">
                                                    {data.permissions.length} capabilities enabled
                                                </p>
                                            </div>

                                            {/* Policy Card */}
                                            <div className="p-4 rounded-xl bg-surface/80 border border-line space-y-1">
                                                <span className="text-3xs font-bold uppercase tracking-wider text-ink-muted">Approval Policy</span>
                                                <p className="text-xs font-bold text-ink truncate">
                                                    {data.transaction_approval_mode === 'inherit' && 'Follow Store Policy'}
                                                    {data.transaction_approval_mode === 'required' && 'Always Require Approval'}
                                                    {data.transaction_approval_mode === 'direct' && 'Direct Posting (Bypass)'}
                                                    {data.transaction_approval_mode === 'custom' && 'Custom Action Rules'}
                                                </p>
                                                <p className="text-3xs text-ink-muted">
                                                    {data.approval_threshold_amount ? `Threshold: ${getCurrencySymbol()} ${Number(data.approval_threshold_amount).toLocaleString()}` : 'No single-item threshold'}
                                                </p>
                                            </div>

                                            {/* Approvers Card */}
                                            <div className="p-4 rounded-xl bg-surface/80 border border-line space-y-1.5">
                                                <span className="text-3xs font-bold uppercase tracking-wider text-ink-muted">Designated Approvers</span>
                                                {data.transaction_approval_mode === 'direct' ? (
                                                    <p className="text-xs font-semibold text-ink-muted">None needed (Direct posting)</p>
                                                ) : (data.assigned_approvers || []).length > 0 ? (
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {data.assigned_approvers.map(id => {
                                                            const approver = eligibleApprovers.find(a => a.id === id);
                                                            if (!approver) return null;
                                                            return (
                                                                <span key={id} className="inline-flex items-center gap-1 text-3xs font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                                                                    <span className="w-3.5 h-3.5 rounded-full bg-brand-600 text-white flex items-center justify-center text-4xs">
                                                                        {approver.name?.charAt(0).toUpperCase()}
                                                                    </span>
                                                                    {approver.name}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">⚠️ No approver selected</p>
                                                )}
                                            </div>

                                            {/* Invitation Validity Card */}
                                            <div className="p-4 rounded-xl bg-surface/80 border border-line space-y-1">
                                                <span className="text-3xs font-bold uppercase tracking-wider text-ink-muted">Invitation Validity</span>
                                                <p className="text-xs font-bold text-ink">48 Hours Window</p>
                                                <p className="text-3xs text-ink-muted">Magic link + short join code generated</p>
                                            </div>
                                        </div>
                                    </div>

                                </form>
                            </div>
                        )}

                        {/* BOTTOM MODAL FOOTER */}
                        <div className="px-6 py-4 md:px-8 border-t border-line bg-surface flex items-center justify-between gap-4 shrink-0">
                            <div>
                                {inviteStep === 1 && (
                                    <button
                                        type="button"
                                        onClick={handleCloseAddModal}
                                        className="px-5 py-2.5 rounded-xl border border-line bg-surface hover:bg-interactive-hover text-ink-secondary hover:text-ink text-xs font-bold uppercase tracking-wider transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                                {inviteStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setInviteStep(s => s - 1)}
                                        className="px-5 py-2.5 rounded-xl border border-line bg-surface hover:bg-interactive-hover text-ink-secondary hover:text-ink text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                                    >
                                        <ChevronLeft size={15} />
                                        <span>Back</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {inviteStep < 3 && (
                                    <div className="flex items-center gap-3">
                                        {inviteStep === 2 && !isStep2Valid && isApproverRequired && !hasSelectedApprover && (
                                            <span className="hidden sm:inline-flex items-center gap-1.5 text-2xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                                <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                                                Select at least 1 supervisor in Section 3 to continue
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (inviteStep === 1) {
                                                    const isOn = settings?.approval_admin_enabled === '1' || settings?.approval_admin_enabled === 1 || settings?.approval_admin_enabled === true || approvalAdminEnabled;
                                                    setActiveStep2Accordion(isOn ? 2 : 1);
                                                }
                                                setInviteStep(s => s + 1);
                                            }}
                                            disabled={inviteStep === 1 ? data.roles.length === 0 : !isStep2Valid}
                                            className="px-7 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            <span>{inviteStep === 1 ? 'Next: Approvals & Ledger' : 'Next: Member Details'}</span>
                                            <ChevronRight size={15} />
                                        </button>
                                    </div>
                                )}
                                {inviteStep === 3 && (
                                    <button
                                        type="submit"
                                        form="invite-step3-form"
                                        disabled={processing || !data.invitee_name?.trim() || !data.invitee_email?.trim()}
                                        className="px-8 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2.5"
                                    >
                                        <Send size={15} />
                                        <span>{processing ? 'Sending...' : 'Send Invitation'}</span>
                                    </button>
                                )}
                            </div>
                        </div>

                </div>,
                document.body
            )}

            {/* Store Approvals Accidental Disable Prevention Modal */}
            {showStoreApprovalLockoutModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
                        onClick={() => setShowStoreApprovalLockoutModal(false)}
                        aria-hidden="true"
                    />

                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative z-10 w-full max-w-lg bg-surface border border-line dark:border-neutral-700 rounded-3xl shadow-2xl p-6 sm:p-7 backdrop-blur-md animate-in zoom-in-95 slide-in-from-bottom-3 duration-fast flex flex-col gap-5"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-xs">
                                    <AlertCircle size={24} className="animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-ink tracking-tight">
                                        Cannot Turn Off Store Approvals
                                    </h3>
                                    <p className="text-2xs sm:text-xs text-ink-muted font-medium mt-0.5">
                                        Active member approval rules are currently enforced
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowStoreApprovalLockoutModal(false)}
                                className="w-8 h-8 rounded-xl bg-app hover:bg-interactive-hover border border-line text-ink-muted hover:text-ink flex items-center justify-center transition-colors shrink-0"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="text-xs text-ink-secondary dark:text-ink-muted leading-relaxed space-y-2">
                            <p>
                                Store approvals cannot be turned off because individual team members currently have active approval policies or action-specific overrides configured.
                            </p>
                            <p className="text-2xs text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3">
                                To prevent accidental bypass of approvals or policy loss, please edit the members listed below and set their approval mode to "Follow store policy" or "Direct posting" before disabling the store-wide system.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="text-3xs font-bold uppercase tracking-wider text-ink-muted px-1 flex items-center justify-between">
                                <span>Configured Members ({activeApprovalMembers.length})</span>
                                <span>Active Rule</span>
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                                {activeApprovalMembers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-app/80 border border-line gap-3"
                                    >
                                        <div className="min-w-0 flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center shrink-0 border border-brand-500/20">
                                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-ink truncate">{user.name}</p>
                                                <p className="text-3xs text-ink-muted truncate">{user.email || user.role}</p>
                                            </div>
                                        </div>
                                        <span className="text-3xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                                            {user.transaction_approval_mode === 'custom' ? 'Custom Rules' : 'Always Required'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-line">
                            <button
                                type="button"
                                onClick={() => setShowStoreApprovalLockoutModal(false)}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm transition-all text-center"
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </OneGlanceLayout>
    );
}

// ─── Invitations Table ─────────────────────────────────────────────────────
function InvitationsTable({ invitations, copiedId, openMenu, setOpenMenu, onCopy, onWhatsApp, onApprove, onDecline, onRevoke, onResend }) {
    const tt = useTermText();
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
                                                        <ri.icon size={9} />{tt(ri.name)}
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
    const tt = useTermText();
    const todayData = attendance.today || {};
    const staff = users.filter(u => u.role !== 'platform_admin');

    return (
        <div className="flex-1 bg-surface border border-line rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-app sticky top-0 z-10">
                        <tr className="text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line">
                            <th className="px-6 py-4">{tt('Staff Member')}</th>
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

    return typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 bg-neutral-950/80 dark:bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
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
        </div>,
        document.body
    ) : null;
}

// ─── Edit Member Modal ──────────────────────────────────────────────────────
function EditMemberModal({ member, onClose, users = [] }) {
    const { store } = usePage().props;
    const tt = useTermText();
    const { data, setData, patch, processing, errors } = useForm({
        role: member.role || 'custom',
        custom_role_name: member.custom_role_name ?? '',
        display_name: member.display_name ?? '',
        status: member.status,
        permissions: member.permissions ?? ROLE_PERMISSIONS[member.role] ?? [],
        passcode: '',
        transaction_approval_mode: member.transaction_approval_mode ?? 'inherit',
        permission_override_mode: member.permission_override_mode ?? 'inherit',
        approval_overrides: member.approval_overrides ?? {},
        assigned_approvers: member.assigned_approvers ?? [],
        approval_threshold_amount: member.approval_threshold_amount ?? '',
    });

    const isApproverRequired = member.role !== 'owner' && data.transaction_approval_mode !== 'direct';
    const hasSelectedApprover = (data.assigned_approvers || []).length > 0;
    const isApprovalValid = !isApproverRequired || hasSelectedApprover;

    const eligibleApprovers = useMemo(() => {
        return (users || []).filter(u => {
            if (u.id === member?.id) return false;
            const role = (u.role || '').toLowerCase();
            const perms = u.permissions || [];
            return ['owner', 'admin', 'manager'].includes(role) || perms.includes('approvals.approve') || perms.includes('approvals.review');
        });
    }, [users, member]);

    const toggleRole = (roleKey) => {
        setData(d => ({
            ...d,
            role: roleKey,
            permissions: ROLE_PERMISSIONS[roleKey] || [],
            permission_override_mode: 'inherit',
        }));
    };

    const handleApplyPreset = (preset, mode) => {
        const targetPerms = mode === 'merge'
            ? Array.from(new Set([...(data.permissions || []), ...preset.permissions]))
            : [...preset.permissions];
        setData(d => ({
            ...d,
            role: 'custom',
            custom_role_name: mode === 'replace' ? preset.name : (d.custom_role_name || preset.name),
            permissions: targetPerms,
            permission_override_mode: 'custom',
        }));
    };

    const submit = (e) => {
        e.preventDefault();
        if (!store?.slug || !isApprovalValid) return;
        patch(route('store.admin.users.update', { store_slug: store.slug, member: member.membership_id || member.id }), {
            onSuccess: onClose,
        });
    };

    return typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 bg-neutral-950/80 dark:bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px] border border-line flex flex-col lg:flex-row relative my-auto max-h-[92vh] overflow-hidden">

                <button onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors z-20 border border-line-subtle bg-surface">
                    <X size={20} />
                </button>

                {/* LEFT COLUMN: Form & Roles */}
                <div className="w-full lg:w-[460px] xl:w-[500px] shrink-0 p-6 md:p-8 xl:p-10 border-b lg:border-b-0 lg:border-r border-line flex flex-col bg-surface overflow-y-auto custom-scrollbar max-h-[90vh]">
                    <div className="flex items-center gap-3.5 mb-8">
                        <h3 className="font-bold text-2xl text-ink tracking-tight">Edit Member</h3>
                        <div className="h-4 w-px bg-line"></div>
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest truncate">{member.name}</span>
                    </div>

                    <form id="edit-member-form" onSubmit={submit} className="flex flex-col gap-8 flex-1">

                        {/* Member Profile */}
                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xs font-bold text-ink-secondary uppercase tracking-wider">
                                <User size={15} className="text-brand-500" /> Member Profile
                            </h4>

                            <div className="space-y-1.5 focus-within:text-brand-600 transition-colors text-ink-secondary">
                                <label className="text-xs font-bold uppercase tracking-wider ml-1">Display Name</label>
                                <input type="text" value={data.display_name} onChange={e => setData('display_name', e.target.value)}
                                    className="w-full px-4 py-3 bg-app border border-line rounded-xl text-sm font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted dark:bg-neutral-800/80 dark:border-neutral-700 dark:text-white"
                                    placeholder="Display Name" required />
                                {errors.display_name && <p className="text-xs text-red-500 ml-1">{errors.display_name}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5 focus-within:text-brand-600 transition-colors text-ink-secondary">
                                    <label className="text-xs font-bold uppercase tracking-wider ml-1">Status</label>
                                    <select value={data.status} onChange={e => setData('status', e.target.value)}
                                        disabled={member.role === 'owner'}
                                        className="w-full px-4 py-3 bg-app border border-line rounded-xl text-sm font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:bg-neutral-800/80 dark:border-neutral-700 dark:text-white">
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                    {errors.status && <p className="text-xs text-red-500 ml-1">{errors.status}</p>}
                                </div>

                                <div className="space-y-1.5 focus-within:text-brand-600 transition-colors text-ink-secondary">
                                    <label className="text-xs font-bold uppercase tracking-wider ml-1">Passcode PIN</label>
                                    <input type="password" value={data.passcode} onChange={e => setData('passcode', e.target.value)}
                                        className="w-full px-4 py-3 bg-app border border-line rounded-xl text-sm font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted font-mono dark:bg-neutral-800/80 dark:border-neutral-700 dark:text-white"
                                        placeholder="Keep original PIN" maxLength={6} />
                                    {errors.passcode && <p className="text-xs text-red-500 ml-1">{errors.passcode}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Roles */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-ink-secondary uppercase tracking-wider">
                                    <Crown size={15} className="text-brand-500" /> Assign Role
                                </h4>
                                <span className="text-xs font-bold text-brand-600 dark:text-brand-400 tracking-wider">
                                    {data.role ? tt(ROLES[data.role]?.name || '')?.toUpperCase() : 'NONE'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(ROLES).map(([key, role]) => {
                                    const isSelected = data.role === key;
                                    const isOwner = member.role === 'owner';
                                    return (
                                        <button key={key} type="button"
                                            disabled={isOwner}
                                            onClick={() => toggleRole(key)}
                                            className={`p-3.5 rounded-xl border flex gap-3 text-left transition-all ${
                                                isSelected
                                                    ? 'bg-brand-600 text-white border-brand-500 shadow-md ring-2 ring-brand-500/20'
                                                    : 'bg-app border-line hover:border-brand-400/50 hover:bg-interactive-hover text-ink dark:bg-neutral-800/60 dark:border-neutral-700'
                                            } ${isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <div className={`mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-brand-500 dark:text-brand-400'}`}>
                                                <role.icon size={18} />
                                            </div>
                                            <div>
                                                <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-ink dark:text-white'}`}>{tt(role.name)}</div>
                                                <div className={`text-2xs font-medium leading-tight mt-1 ${isSelected ? 'text-brand-100' : 'text-ink-muted'}`}>{tt(role.description)}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {data.role === 'custom' && (
                                <div className="mt-3">
                                    <label className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1 block">
                                        Custom Role Name <span className="text-ink-muted font-normal normal-case">(optional — shown as badge)</span>
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={30}
                                        placeholder="e.g. Senior Accountant, Floor Supervisor..."
                                        value={data.custom_role_name}
                                        onChange={e => setData('custom_role_name', e.target.value)}
                                        className="w-full bg-app border border-line rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500 transition dark:bg-neutral-800/80 dark:border-neutral-700 dark:text-white"
                                    />
                                </div>
                            )}
                            {errors.role && <p className="text-xs text-red-500 ml-1">{errors.role}</p>}
                        </div>

                        {/* Approval Mode — owners/admins only */}
                        {(member.role !== 'owner') && (
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-ink-secondary uppercase tracking-wider">
                                    <Shield size={15} className="text-brand-500" /> Transaction Approval
                                </h4>
                                <p className="text-xs text-ink-muted leading-relaxed">
                                    Controls whether this employee's transactions require a supervisor to approve before they post.
                                </p>
                                <div className="space-y-2.5">
                                    {[
                                        {
                                            value: 'inherit',
                                            label: 'Follow store policy',
                                            description: 'Uses the store-wide approval setting',
                                        },
                                        {
                                            value: 'required',
                                            label: 'Always require approval',
                                            description: 'Every transaction this employee creates goes to the approval queue',
                                        },
                                        {
                                            value: 'direct',
                                            label: 'Always post directly',
                                            description: 'Bypasses the approval queue regardless of store policy',
                                        },
                                    ].map(opt => (
                                        <label key={opt.value}
                                            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                data.transaction_approval_mode === opt.value
                                                    ? 'bg-brand-50/80 border-brand-300 dark:bg-brand-950/40 dark:border-brand-500 shadow-sm ring-1 ring-brand-500/20'
                                                    : 'bg-app border-line hover:border-line-strong text-ink dark:bg-neutral-800/40 dark:border-neutral-700'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="transaction_approval_mode"
                                                value={opt.value}
                                                checked={data.transaction_approval_mode === opt.value}
                                                onChange={() => setData('transaction_approval_mode', opt.value)}
                                                className="mt-0.5 accent-brand-500 shrink-0"
                                            />
                                            <div>
                                                <div className="text-xs font-bold text-ink">{opt.label}</div>
                                                <div className="text-2xs text-ink-muted mt-0.5">{opt.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {errors.transaction_approval_mode && (
                                    <p className="text-xs text-red-500 ml-1">{errors.transaction_approval_mode}</p>
                                )}

                                {/* Approval Threshold Amount */}
                                <div className="space-y-1.5 focus-within:text-brand-600 transition-colors text-ink-secondary">
                                    <label className="text-xs font-bold uppercase tracking-wider ml-1">
                                        Approval Threshold Amount <span className="text-ink-muted font-normal normal-case">(optional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={data.approval_threshold_amount}
                                        onChange={e => setData('approval_threshold_amount', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-app border border-line rounded-xl text-sm font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted dark:bg-neutral-800/80 dark:border-neutral-700 dark:text-white font-mono"
                                        placeholder="e.g. 5000 (auto-approve below this amount)"
                                    />
                                    <p className="text-3xs text-ink-muted ml-1">
                                        Transactions under this value post directly. Only transactions above this threshold go to queue.
                                    </p>
                                </div>

                                {/* Assigned Supervisors & Approvers */}
                                {data.transaction_approval_mode !== 'direct' && (
                                    <div className={`p-4 rounded-xl border space-y-3 transition-all ${
                                        isApproverRequired && !hasSelectedApprover
                                            ? 'bg-amber-500/5 border-amber-500/50 ring-2 ring-amber-500/20'
                                            : 'bg-app/40 border-line'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <UserCheck size={14} className="text-brand-500" />
                                                <span className="text-xs font-bold text-ink uppercase tracking-wider">
                                                    Assigned Supervisors & Approvers
                                                </span>
                                            </div>
                                            {isApproverRequired && !hasSelectedApprover ? (
                                                <span className="text-3xs font-black tracking-wider px-2.5 py-0.5 rounded-full uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                                    <AlertTriangle size={10} /> 1 Approver Required
                                                </span>
                                            ) : (
                                                <span className="text-3xs font-black tracking-wider px-2.5 py-0.5 rounded-full uppercase bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                                                    {(data.assigned_approvers || []).length} Selected
                                                </span>
                                            )}
                                        </div>

                                        {isApproverRequired && !hasSelectedApprover && (
                                            <p className="text-2xs text-amber-700 dark:text-amber-300 font-medium">
                                                Because approvals are active, you must select at least one supervisor below to review this member's actions.
                                            </p>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                            {eligibleApprovers.map(approver => {
                                                const isSelected = (data.assigned_approvers || []).includes(approver.id);
                                                return (
                                                    <button
                                                        key={approver.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const curr = data.assigned_approvers || [];
                                                            const next = isSelected
                                                                ? curr.filter(id => id !== approver.id)
                                                                : [...curr, approver.id];
                                                            setData('assigned_approvers', next);
                                                        }}
                                                        className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between gap-2 ${
                                                            isSelected
                                                                ? 'bg-brand-50/90 dark:bg-brand-950/60 border-brand-500 ring-1 ring-brand-500/30'
                                                                : 'bg-surface border-line hover:border-line-strong'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-3xs flex items-center justify-center shrink-0">
                                                                {approver.name?.charAt(0).toUpperCase() || 'U'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-ink truncate leading-tight">{approver.name}</p>
                                                                <p className="text-3xs text-ink-muted truncate">{approver.role}</p>
                                                            </div>
                                                        </div>
                                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                                            isSelected ? 'bg-brand-600 border-brand-500 text-white' : 'border-line bg-surface'
                                                        }`}>
                                                            {isSelected && <Check size={8} strokeWidth={3} />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                            {eligibleApprovers.length === 0 && (
                                                <p className="col-span-full py-3 text-center text-2xs text-ink-muted bg-surface rounded-lg border border-line">
                                                    No eligible supervisors available.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Action-Specific Approval Overrides */}
                                <div className="pt-4 border-t border-line space-y-2.5">
                                    <div className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
                                        Action-Specific Approval Overrides
                                    </div>
                                    <p className="text-xs text-ink-muted">
                                        Override default store and role policy for specific operations:
                                    </p>
                                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                                        {[
                                            { key: 'customer_receipt', label: 'Customer Receipts' },
                                            { key: 'supplier_payment', label: 'Supplier Payments' },
                                            { key: 'sales_invoice', label: 'Admin Sales Invoices' },
                                            { key: 'operating_expense', label: 'Operating Expenses' },
                                            { key: 'supplier_refund', label: 'Supplier Refunds' },
                                            { key: 'purchase_posting', label: 'Purchase & Bills' },
                                            { key: 'sales_return', label: 'Sales Returns & Refunds' },
                                            { key: 'purchase_return', label: 'Purchase Returns (Debit Notes)' },
                                            { key: 'capital_injection', label: 'Owner Capital Injection' },
                                            { key: 'owner_drawings', label: 'Owner Drawings' },
                                            { key: 'fund_transfer', label: 'Internal Fund Transfers' },
                                            { key: 'balance_adjustment', label: 'Balance Adjustments' },
                                        ].map(action => {
                                            const currentVal = data.approval_overrides?.[action.key] || 'inherit';
                                            return (
                                                <div key={action.key} className="flex items-center justify-between p-2.5 rounded-xl bg-app border border-line dark:bg-neutral-800/50 dark:border-neutral-700">
                                                    <span className="text-xs font-medium text-ink">{action.label}</span>
                                                    <select
                                                        value={currentVal}
                                                        onChange={e => setData('approval_overrides', {
                                                            ...data.approval_overrides,
                                                            [action.key]: e.target.value,
                                                        })}
                                                        className="bg-surface border border-line rounded-lg px-2.5 py-1 text-xs text-ink focus:outline-none focus:border-brand-500 dark:bg-neutral-900 dark:border-neutral-600 dark:text-white"
                                                    >
                                                        <option value="inherit">Inherit</option>
                                                        <option value="direct">Direct</option>
                                                        <option value="required">Required</option>
                                                    </select>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                    </form>
                </div>

                {/* RIGHT COLUMN: Permissions Visualization */}
                <div className="flex-1 p-6 md:p-8 xl:p-10 bg-sunken/40 dark:bg-surface flex flex-col justify-between relative overflow-hidden">
                    {/* Ambient glow in right panel */}
                    <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="space-y-1">
                            <h4 className="flex items-center gap-2 text-xs font-bold text-ink uppercase tracking-wider">
                                <Shield size={16} className="text-brand-600 dark:text-brand-400" /> System Visibility & Access
                            </h4>
                            <p className="text-xs text-ink-muted font-medium pl-6">
                                Module Access Control
                            </p>
                        </div>
                        <div className="px-3.5 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-2 tracking-wider uppercase">
                            <Sparkles size={13} /> Live Permissions Preview
                        </div>
                    </div>

                    <StaffPresetPicker onApplyPreset={handleApplyPreset} disabled={member.role === 'owner'} />

                    <PermissionsSelector
                        selectedPermissions={data.permissions}
                        onChange={(perms) => setData(d => ({ ...d, role: 'custom', permissions: perms }))}
                        disabled={member.role === 'owner'}
                    />

                    {/* Bottom Footer Actions inside Right Panel */}
                    <div className="mt-6 pt-6 border-t border-line flex items-center justify-between relative z-10">
                        <div className="space-y-0.5">
                            <div className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                                Summary
                            </div>
                            <div className="text-sm font-bold text-ink">
                                <span className={data.permissions.length > 0 ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-ink-muted'}>
                                     {data.permissions.length} Permissions Active
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isApprovalValid && (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                                    <AlertTriangle size={14} className="shrink-0" />
                                    <span>1 Approver Required</span>
                                </div>
                            )}
                            <button type="button" onClick={onClose}
                                className="px-5 py-2.5 rounded-xl border border-line bg-surface hover:bg-interactive-hover text-ink-secondary hover:text-ink text-xs font-bold uppercase tracking-wider transition-colors">
                                Discard
                            </button>
                            <button type="submit" form="edit-member-form" disabled={processing || !isApprovalValid}
                                className={`px-7 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 ${
                                    !isApprovalValid
                                        ? 'bg-neutral-300 dark:bg-neutral-800 text-ink-muted cursor-not-allowed border border-line'
                                        : 'bg-brand-600 hover:bg-brand-500 text-white shadow-md hover:shadow-lg active:scale-95'
                                }`}>
                                <Check size={16} />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    ) : null;
}

// ─── Member Profile & Security Vault Modal ──────────────────────────────
function MemberProfileModal({ member, onClose }) {
    const tt = useTermText();
    const resolvedRole = (() => {
        if (member.role && member.role !== 'custom' && ROLES[member.role]) return member.role;
        if (member.custom_role_name) return 'custom';
        return 'cashier';
    })();
    const roleInfo = getRoleInfo(resolvedRole);
    const RoleIcon = roleInfo.icon;
    const st = getStatusCfg(member.status);

    return typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 bg-neutral-950/80 dark:bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-3xl border border-line overflow-hidden flex flex-col relative my-auto max-h-[90vh]">
                {/* Header Banner */}
                <div className="p-6 md:p-8 bg-sunken/60 dark:bg-app border-b border-line flex justify-between items-start relative">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${roleInfo.color} flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shrink-0`}>
                            {(member.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-xl md:text-2xl text-ink leading-tight">{member.display_name || member.name}</h3>
                                {member.role === 'owner' && (
                                    <span className="text-3xs font-black bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-widest">
                                        Owner
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase ${roleInfo.badge}`}>
                                    <RoleIcon size={11} /> {member.custom_role_name || tt(roleInfo.name)}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold border ${st.color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                                    {st.label}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-interactive-hover rounded-xl text-ink-muted hover:text-ink transition-colors border border-line-subtle bg-surface">
                        <X size={20} />
                    </button>
                </div>

                {/* Body Details */}
                <div className="p-6 md:p-8 overflow-y-auto space-y-6 custom-scrollbar">
                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-app border border-line space-y-3">
                            <h4 className="text-xs font-extrabold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                                <User size={14} className="text-brand-500" /> Personal Credentials
                            </h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1 border-b border-line/60">
                                    <span className="text-ink-muted">Email Address:</span>
                                    <span className="font-semibold text-ink font-mono">{member.email || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-line/60">
                                    <span className="text-ink-muted">Phone Contact:</span>
                                    <span className="font-semibold text-ink">{member.phone || member.invitee_phone || 'Not recorded'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-line/60">
                                    <span className="text-ink-muted">ID / CNIC Number:</span>
                                    <span className="font-bold text-brand-600 dark:text-brand-400 font-mono">{member.id_card_number || '42101-1234567-1'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-ink-muted">Designation:</span>
                                    <span className="font-semibold text-ink">{member.designation || member.role || 'Staff Member'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-app border border-line space-y-3">
                            <h4 className="text-xs font-extrabold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-emerald-500" /> Approvals & Policy
                            </h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1 border-b border-line/60">
                                    <span className="text-ink-muted">Approval Policy:</span>
                                    <span className="font-semibold text-ink capitalize">
                                        {member.transaction_approval_mode === 'required' ? 'Always Require Approval' :
                                         member.transaction_approval_mode === 'direct' ? 'Direct Posting (Bypass)' : 'Follow Store Policy'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-line/60">
                                    <span className="text-ink-muted">Active Permissions:</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {(member.permissions || []).length} Privileges Granted
                                    </span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-ink-muted">Membership Date:</span>
                                    <span className="font-semibold text-ink">
                                        {member.created_at ? new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Employee Security Documents Vault */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-extrabold text-ink uppercase tracking-wider flex items-center gap-1.5">
                                <Paperclip size={14} className="text-brand-500" /> Employee Documents & Security Vault
                            </h4>
                            <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                                Verified Vault
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { name: 'CNIC_Front_Copy.jpg', type: 'CNIC Identification Photo', size: '1.2 MB', icon: FileText },
                                { name: 'Employment_Appointment_Letter.pdf', type: 'Verified Contract Letter', size: '450 KB', icon: FileCheck },
                            ].map((doc, idx) => {
                                const DocIcon = doc.icon;
                                return (
                                    <div key={idx} className="p-3.5 rounded-2xl bg-surface border border-line flex items-center justify-between hover:border-brand-500/40 transition-all">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                                                <DocIcon size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-ink text-xs truncate">{doc.name}</p>
                                                <p className="text-3xs text-ink-muted truncate">{doc.type} • {doc.size}</p>
                                            </div>
                                        </div>
                                        <button className="px-3 py-1.5 rounded-xl bg-sunken hover:bg-interactive-hover text-2xs font-bold text-ink-secondary hover:text-ink transition-colors flex items-center gap-1 shrink-0">
                                            <Eye size={12} /> View
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 px-6 bg-sunken/40 border-t border-line flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-colors">
                        Close Profile
                    </button>
                </div>
            </div>
        </div>,
        document.body
    ) : null;
}

// ─── Members Table ─────────────────────────────────────────────────────────
function MembersTable({ users, store }) {
    const { my_role } = usePage().props;
    const tt = useTermText();
    const canManage = ['owner', 'admin'].includes(my_role);
    const [openMenu, setOpenMenu] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [viewingProfileMember, setViewingProfileMember] = useState(null);

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
                    users={users}
                />
            )}
            {viewingProfileMember && (
                <MemberProfileModal
                    member={viewingProfileMember}
                    onClose={() => setViewingProfileMember(null)}
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
                                    : tt(role.name);
                                const st = getStatusCfg(user.status);
                                const isOwner = user.role === 'owner';

                                return (
                                    <tr key={user.id} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group">
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => setViewingProfileMember(user)}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white font-bold shadow-md`}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-ink-secondary dark:text-ink text-sm group-hover:text-brand-600 transition-colors">
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
                                                <div className="relative inline-block">
                                                    <button onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                                                        className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 transition-colors opacity-0 group-hover:opacity-100">
                                                        <ChevronDown size={16} />
                                                    </button>
                                                    {openMenu === user.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />
                                                            <div className="absolute right-0 top-10 z-30 w-52 bg-surface border border-line rounded-[14px] shadow-2xl py-2 overflow-hidden text-left">
                                                                <button onClick={() => { setViewingProfileMember(user); setOpenMenu(null); }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                                                    <Eye size={14} className="text-blue-500" /> View Profile & Vault
                                                                </button>
                                                                {!isOwner && (
                                                                    <>
                                                                        <button onClick={() => { setEditingMember(user); setOpenMenu(null); }}
                                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                                                            <Edit3 size={14} className="text-brand-500" /> Edit Role & Access
                                                                        </button>
                                                                        <div className="my-1 border-t border-line" />
                                                                        <button onClick={() => handleRemove(user)}
                                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                                            <Trash2 size={14} /> Remove Member
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
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

/**
 * VENQORE - App Registry
 * Central registry of all pages, actions, settings, and commands.
 * This powers the Omni-Search feature.
 */

import {
    Home, ShoppingCart, Box, Users, DollarSign, TrendingUp, History, Trash2, Settings,
    FileText, CreditCard, BarChart2, PlusCircle, Printer, Database, Shield, Sparkles,
    Package, Tag, Warehouse, BookOpen, Receipt, Clock, Calculator, Percent, Building2,
    UserPlus, FilePlus, Download, Upload, Layers, Activity, Eye, Edit, ArrowRightLeft
} from 'lucide-react';

// ============================================
// CATEGORY DEFINITIONS
// ============================================
export const CATEGORIES = {
    NAVIGATION: 'navigation',
    ACTION: 'action',
    REPORT: 'report',
    SETTING: 'setting',
    RECORD: 'record', // Products, Parties, Invoices (from DB search)
};

// ============================================
// APP REGISTRY - All searchable items
// ============================================
export const APP_REGISTRY = [
    // ==========================================
    // DASHBOARDS & HOME
    // ==========================================
    {
        id: 'home',
        title: 'Home',
        subtitle: 'Main dashboard & quick access',
        keywords: ['home', 'dashboard', 'main', 'start', 'overview'],
        icon: Home,
        category: CATEGORIES.NAVIGATION,
        route: 'home',
    },
    {
        id: 'pos',
        title: 'Point of Sale',
        subtitle: 'Open the POS terminal',
        keywords: ['pos', 'sell', 'checkout', 'terminal', 'cash register', 'billing', 'counter'],
        icon: ShoppingCart,
        category: CATEGORIES.NAVIGATION,
        route: 'store.pos',
    },

    // ==========================================
    // INVENTORY / STOCK
    // ==========================================
    {
        id: 'inventory-dashboard',
        title: 'Inventory Dashboard',
        subtitle: 'Stock overview & analytics',
        keywords: ['inventory', 'stock', 'warehouse', 'items', 'products'],
        icon: Box,
        category: CATEGORIES.NAVIGATION,
        route: 'store.inventory.dashboard',
    },
    {
        id: 'inventory-list',
        title: 'Product List',
        subtitle: 'View & manage all products',
        keywords: ['products', 'items', 'inventory', 'list', 'catalog'],
        icon: Package,
        category: CATEGORIES.NAVIGATION,
        route: 'inventory.index',
    },
    {
        id: 'stock-levels',
        title: 'Stock Levels',
        subtitle: 'Current stock quantities',
        keywords: ['stock', 'levels', 'quantity', 'remaining', 'available'],
        icon: Layers,
        category: CATEGORIES.NAVIGATION,
        route: 'inventory.stock-levels',
    },
    {
        id: 'stock-operations',
        title: 'Stock Operations',
        subtitle: 'Transfers, adjustments & audits',
        keywords: ['stock', 'transfer', 'adjust', 'audit', 'operations', 'movement'],
        icon: ArrowRightLeft,
        category: CATEGORIES.NAVIGATION,
        route: 'stock-operations',
    },
    {
        id: 'categories',
        title: 'Categories',
        subtitle: 'Product categories management',
        keywords: ['categories', 'groups', 'types', 'classification'],
        icon: Tag,
        category: CATEGORIES.NAVIGATION,
        route: 'categories.index',
    },
    {
        id: 'suppliers',
        title: 'Suppliers',
        subtitle: 'Manage your suppliers',
        keywords: ['suppliers', 'vendors', 'wholesalers'],
        icon: Building2,
        category: CATEGORIES.NAVIGATION,
        route: 'suppliers.index',
    },
    {
        id: 'purchase-orders',
        title: 'Purchase Orders',
        subtitle: 'Manage purchase orders',
        keywords: ['purchase', 'orders', 'po', 'buy'],
        icon: FileText,
        category: CATEGORIES.NAVIGATION,
        route: 'purchase-orders.index',
    },
    {
        id: 'production',
        title: 'Production Runs',
        subtitle: 'Manufacturing & production',
        keywords: ['production', 'manufacturing', 'make', 'assemble'],
        icon: Activity,
        category: CATEGORIES.NAVIGATION,
        route: 'production.index',
    },
    {
        id: 'cookbook',
        title: 'Cookbook (Recipes)',
        subtitle: 'Product recipes & formulas',
        keywords: ['cookbook', 'recipes', 'formula', 'bom', 'bill of materials'],
        icon: BookOpen,
        category: CATEGORIES.NAVIGATION,
        route: 'cookbook.index',
    },
    {
        id: 'labels',
        title: 'Print Labels',
        subtitle: 'Generate product labels & barcodes',
        keywords: ['labels', 'barcode', 'print', 'stickers'],
        icon: Tag,
        category: CATEGORIES.NAVIGATION,
        route: 'labels.index',
    },
    {
        id: 'attributes',
        title: 'Product Attributes',
        subtitle: 'Size, color, variants',
        keywords: ['attributes', 'variants', 'size', 'color', 'options'],
        icon: Layers,
        category: CATEGORIES.NAVIGATION,
        route: 'attributes.index',
    },

    // ==========================================
    // SALES
    // ==========================================
    {
        id: 'sales-dashboard',
        title: 'Sales Dashboard',
        subtitle: 'Sales overview & analytics',
        keywords: ['sales', 'revenue', 'dashboard', 'sell'],
        icon: TrendingUp,
        category: CATEGORIES.NAVIGATION,
        route: 'store.sales.dashboard',
    },
    {
        id: 'sales-list',
        title: 'Sales List',
        subtitle: 'View all sales transactions',
        keywords: ['sales', 'transactions', 'history', 'invoices'],
        icon: Receipt,
        category: CATEGORIES.NAVIGATION,
        route: 'sales.index',
    },
    {
        id: 'sales-analytics',
        title: 'Sales Analytics',
        subtitle: 'Advanced sales insights',
        keywords: ['analytics', 'insights', 'charts', 'trends'],
        icon: BarChart2,
        category: CATEGORIES.NAVIGATION,
        route: 'sales.analytics',
    },
    {
        id: 'sales-pre-sales',
        title: 'Pre-Sales',
        subtitle: 'Manage pre-sales / quotes',
        keywords: ['sale', 'orders', 'quotes', 'proforma', 'pre-sale'],
        icon: FileText,
        category: CATEGORIES.NAVIGATION,
        route: 'pre-sales.index',
    },
    {
        id: 'parked-sales',
        title: 'Parked Sales (Hold Bills)',
        subtitle: 'View parked/held transactions',
        keywords: ['parked', 'hold', 'saved', 'pending'],
        icon: Clock,
        category: CATEGORIES.NAVIGATION,
        route: 'parked-sales.index',
    },

    // ==========================================
    // CONTACTS / PARTIES
    // ==========================================
    {
        id: 'parties',
        title: 'Parties',
        subtitle: 'Customers & suppliers ledger',
        keywords: ['parties', 'customers', 'suppliers', 'contacts', 'ledger'],
        icon: Users,
        category: CATEGORIES.NAVIGATION,
        route: 'store.parties.index',
    },
    {
        id: 'customers',
        title: 'Customers',
        subtitle: 'Manage customer database',
        keywords: ['customers', 'clients', 'buyers'],
        icon: UserPlus,
        category: CATEGORIES.NAVIGATION,
        route: 'customers.index',
    },

    // ==========================================
    // MONEY / FINANCE
    // ==========================================
    {
        id: 'transactions',
        title: 'All Transactions',
        subtitle: 'View all financial transactions',
        keywords: ['transactions', 'all', 'money', 'finance'],
        icon: DollarSign,
        category: CATEGORIES.NAVIGATION,
        route: 'store.funds.index',
    },
    {
        id: 'purchases',
        title: 'Purchases',
        subtitle: 'Purchase bills & invoices',
        keywords: ['purchases', 'bills', 'buying', 'vendors'],
        icon: ShoppingCart,
        category: CATEGORIES.NAVIGATION,
        route: 'purchases.index',
    },
    {
        id: 'payments',
        title: 'Payments',
        subtitle: 'Payment in & out',
        keywords: ['payments', 'receive', 'pay', 'collection'],
        icon: CreditCard,
        category: CATEGORIES.NAVIGATION,
        route: 'payments.index',
    },
    {
        id: 'payment-in',
        title: 'Payment In (Receive)',
        subtitle: 'Record incoming payment',
        keywords: ['receive', 'collection', 'payment in', 'incoming'],
        icon: CreditCard,
        category: CATEGORIES.NAVIGATION,
        route: 'payments.in',
    },
    {
        id: 'payment-out',
        title: 'Payment Out (Pay)',
        subtitle: 'Record outgoing payment',
        keywords: ['pay', 'payment out', 'outgoing', 'disbursement'],
        icon: CreditCard,
        category: CATEGORIES.NAVIGATION,
        route: 'payments.out',
    },
    {
        id: 'expenses',
        title: 'Expenses',
        subtitle: 'Track business expenses',
        keywords: ['expenses', 'costs', 'spending', 'bills'],
        icon: Receipt,
        category: CATEGORIES.NAVIGATION,
        route: 'expenses.index',
    },
    {
        id: 'bank-accounts',
        title: 'Bank Accounts',
        subtitle: 'Manage bank & cash accounts',
        keywords: ['bank', 'accounts', 'cash', 'wallet'],
        icon: Building2,
        category: CATEGORIES.NAVIGATION,
        route: 'bank-accounts.index',
    },
    {
        id: 'receivables',
        title: 'Receivables',
        subtitle: 'Money owed to you',
        keywords: ['receivables', 'owed', 'pending', 'dues'],
        icon: DollarSign,
        category: CATEGORIES.NAVIGATION,
        route: 'finance.receivables',
    },
    {
        id: 'payables',
        title: 'Payables',
        subtitle: 'Money you owe',
        keywords: ['payables', 'owe', 'debts', 'liabilities'],
        icon: DollarSign,
        category: CATEGORIES.NAVIGATION,
        route: 'finance.payables',
    },

    // ==========================================
    // ACCOUNTING
    // ==========================================
    {
        id: 'accounting-dashboard',
        title: 'Accounting Dashboard',
        subtitle: 'Financial overview',
        keywords: ['accounting', 'finance', 'dashboard'],
        icon: Calculator,
        category: CATEGORIES.NAVIGATION,
        route: 'accounting.dashboard',
    },
    {
        id: 'chart-of-accounts',
        title: 'Chart of Accounts',
        subtitle: 'Account ledgers & structure',
        keywords: ['chart', 'accounts', 'ledger', 'coa'],
        icon: Database,
        category: CATEGORIES.NAVIGATION,
        route: 'accounting.index',
    },
    {
        id: 'profit-loss',
        title: 'Profit & Loss (P&L)',
        subtitle: 'Income statement',
        keywords: ['profit', 'loss', 'pnl', 'income', 'statement', 'earnings'],
        icon: TrendingUp,
        category: CATEGORIES.NAVIGATION,
        route: 'accounting.pnl',
    },
    {
        id: 'balance-sheet',
        title: 'Balance Sheet',
        subtitle: 'Assets, liabilities & equity',
        keywords: ['balance', 'sheet', 'assets', 'liabilities', 'equity'],
        icon: FileText,
        category: CATEGORIES.NAVIGATION,
        route: 'accounting.balance-sheet',
    },

    // ==========================================
    // REPORTS
    // ==========================================
    {
        id: 'reports-dashboard',
        title: 'Reports Hub',
        subtitle: 'All reports in one place',
        keywords: ['reports', 'analytics', 'insights', 'data'],
        icon: BarChart2,
        category: CATEGORIES.NAVIGATION,
        route: 'reports.dashboard',
    },
    {
        id: 'report-sales',
        title: 'Sales Report',
        subtitle: 'Detailed sales analysis',
        keywords: ['sales', 'report', 'revenue'],
        icon: BarChart2,
        category: CATEGORIES.REPORT,
        route: 'store.reports.sales',
    },
    {
        id: 'report-purchases',
        title: 'Purchase Report',
        subtitle: 'Purchase analysis',
        keywords: ['purchase', 'report', 'buying'],
        icon: BarChart2,
        category: CATEGORIES.REPORT,
        route: 'store.reports.purchases',
    },
    {
        id: 'report-day-book',
        title: 'Day Book',
        subtitle: 'Daily transactions summary',
        keywords: ['day', 'book', 'daily', 'journal'],
        icon: BookOpen,
        category: CATEGORIES.REPORT,
        route: 'store.reports.day-book',
    },
    {
        id: 'report-profit-loss',
        title: 'Profit & Loss Report',
        subtitle: 'Detailed P&L analysis',
        keywords: ['profit', 'loss', 'report', 'margin'],
        icon: TrendingUp,
        category: CATEGORIES.REPORT,
        route: 'store.reports.profit-loss',
    },
    {
        id: 'report-party-statement',
        title: 'Party Statement',
        subtitle: 'Ledger for specific party',
        keywords: ['party', 'statement', 'ledger', 'account'],
        icon: FileText,
        category: CATEGORIES.REPORT,
        route: 'store.reports.party-statement',
    },
    {
        id: 'report-stock-valuation',
        title: 'Stock Valuation',
        subtitle: 'Inventory value report',
        keywords: ['stock', 'valuation', 'inventory', 'value'],
        icon: Package,
        category: CATEGORIES.REPORT,
        route: 'store.reports.stock-valuation',
    },
    {
        id: 'report-low-stock',
        title: 'Low Stock Report',
        subtitle: 'Items below reorder level',
        keywords: ['low', 'stock', 'reorder', 'shortage'],
        icon: Package,
        category: CATEGORIES.REPORT,
        route: 'store.reports.low-stock',
    },
    {
        id: 'report-expiry',
        title: 'Expiry Report',
        subtitle: 'Expiring products',
        keywords: ['expiry', 'expiring', 'date', 'shelf life'],
        icon: Clock,
        category: CATEGORIES.REPORT,
        route: 'store.reports.expiry',
    },
    {
        id: 'report-tax',
        title: 'Tax Report',
        subtitle: 'Tax collected & payable',
        keywords: ['tax', 'gst', 'vat', 'fbr'],
        icon: Percent,
        category: CATEGORIES.REPORT,
        route: 'store.reports.tax',
    },
    {
        id: 'report-bank-statement',
        title: 'Bank Statement',
        subtitle: 'Bank account transactions',
        keywords: ['bank', 'statement', 'transactions'],
        icon: Building2,
        category: CATEGORIES.REPORT,
        route: 'store.reports.bank-statement',
    },
    {
        id: 'report-expenses',
        title: 'Expense Report',
        subtitle: 'Expense analysis',
        keywords: ['expense', 'report', 'spending'],
        icon: Receipt,
        category: CATEGORIES.REPORT,
        route: 'store.reports.expenses',
    },
    {
        id: 'report-cash-flow',
        title: 'Cash Flow',
        subtitle: 'Money in & out analysis',
        keywords: ['cash', 'flow', 'liquidity'],
        icon: DollarSign,
        category: CATEGORIES.REPORT,
        route: 'store.reports.cash-flow',
    },
    {
        id: 'report-trial-balance',
        title: 'Trial Balance',
        subtitle: 'Accounting trial balance',
        keywords: ['trial', 'balance', 'accounting'],
        icon: Calculator,
        category: CATEGORIES.REPORT,
        route: 'store.reports.trial-balance',
    },
    {
        id: 'report-item-wise-profit',
        title: 'Item-wise Profit',
        subtitle: 'Profit by product',
        keywords: ['item', 'product', 'profit', 'margin'],
        icon: TrendingUp,
        category: CATEGORIES.REPORT,
        route: 'store.reports.item-wise-profit',
    },
    {
        id: 'report-party-wise-profit',
        title: 'Party-wise Profit/Loss',
        subtitle: 'Profit by customer/supplier',
        keywords: ['party', 'customer', 'profit', 'loss'],
        icon: Users,
        category: CATEGORIES.REPORT,
        route: 'store.reports.party-wise-profit-loss',
    },
    {
        id: 'report-discount',
        title: 'Discount Report',
        subtitle: 'Discounts given analysis',
        keywords: ['discount', 'offers', 'concession'],
        icon: Percent,
        category: CATEGORIES.REPORT,
        route: 'store.reports.discount',
    },

    // ==========================================
    // ADMIN & SETTINGS
    // ==========================================
    {
        id: 'settings',
        title: 'Settings',
        subtitle: 'App preferences & configuration',
        keywords: ['settings', 'preferences', 'config', 'options'],
        icon: Settings,
        category: CATEGORIES.SETTING,
        route: 'settings',
    },
    {
        id: 'admin-panel',
        title: 'Store Admin Panel',
        subtitle: 'Manage your store',
        keywords: ['admin', 'panel', 'system', 'management', 'store settings'],
        icon: Shield,
        category: CATEGORIES.NAVIGATION,
        route: 'store.settings',  // Store-scoped — NOT /admin-panel
    },
    {
        id: 'admin-settings',
        title: 'System Settings',
        subtitle: 'Business, print, tax settings',
        keywords: ['system', 'settings', 'admin', 'configuration'],
        icon: Settings,
        category: CATEGORIES.SETTING,
        route: 'store.settings',  // Store-scoped settings
    },
    {
        id: 'admin-users',
        title: 'Staff Management',
        subtitle: 'Manage staff & users',
        keywords: ['users', 'staff', 'employees', 'team', 'accounts'],
        icon: Users,
        category: CATEGORIES.NAVIGATION,
        route: 'store.staff',  // Store-scoped staff
    },

    {
        id: 'admin-logs',
        title: 'Activity Log',
        subtitle: 'Activity & audit logs',
        keywords: ['logs', 'activity', 'errors', 'history', 'audit'],
        icon: FileText,
        category: CATEGORIES.NAVIGATION,
        route: 'activity-log.index',
    },
    {
        id: 'admin-staff',
        title: 'Staff Summaries',
        subtitle: 'Staff performance & attendance',
        keywords: ['staff', 'attendance', 'performance', 'employees'],
        icon: Users,
        category: CATEGORIES.NAVIGATION,
        route: 'staff-attendance.index',
    },

    // ==========================================
    // UTILITY PAGES
    // ==========================================
    {
        id: 'activity-log',
        title: 'Activity Log',
        subtitle: 'Recent actions & history',
        keywords: ['activity', 'log', 'history', 'audit', 'changes'],
        icon: History,
        category: CATEGORIES.NAVIGATION,
        route: 'activity-log.index',
    },
    {
        id: 'recycle-bin',
        title: 'Recycle Bin',
        subtitle: 'Deleted items & restore',
        keywords: ['recycle', 'bin', 'trash', 'deleted', 'restore'],
        icon: Trash2,
        category: CATEGORIES.NAVIGATION,
        route: 'recycle-bin.index',
    },
    {
        id: 'import-export',
        title: 'Import / Export',
        subtitle: 'Bulk data import & export',
        keywords: ['import', 'export', 'csv', 'excel', 'bulk'],
        icon: Download,
        category: CATEGORIES.NAVIGATION,
        route: 'store.admin.data',
    },
    {
        id: 'growth-engine',
        title: 'Growth Engine',
        subtitle: 'AI recommendations & loyalty',
        keywords: ['growth', 'engine', 'ai', 'recommendations', 'loyalty'],
        icon: Sparkles,
        category: CATEGORIES.NAVIGATION,
        route: 'growth-engine.index',
    },
    {
        id: 'notifications',
        title: 'Notifications',
        subtitle: 'View all notifications',
        keywords: ['notifications', 'alerts', 'messages'],
        icon: Activity,
        category: CATEGORIES.NAVIGATION,
        route: 'notifications.index',
    },

    // ==========================================
    // QUICK ACTIONS (Create/Add)
    // ==========================================
    {
        id: 'action-new-sale',
        title: 'Create New Sale',
        subtitle: 'Open POS to make a sale',
        keywords: ['new', 'create', 'sale', 'sell', 'add'],
        icon: PlusCircle,
        category: CATEGORIES.ACTION,
        route: 'store.pos',
        action: 'create',
    },
    {
        id: 'action-new-invoice',
        title: 'Create Invoice',
        subtitle: 'Create a detailed invoice',
        keywords: ['new', 'create', 'invoice', 'bill', 'add'],
        icon: FilePlus,
        category: CATEGORIES.ACTION,
        route: 'sales.invoice.create',
        action: 'create',
    },
    {
        id: 'action-new-pre-sale',
        title: 'Create Pre-Sale',
        subtitle: 'Create a new pre-sale/quote',
        keywords: ['new', 'create', 'sale', 'order', 'quote', 'proforma', 'pre-sale'],
        icon: FilePlus,
        category: CATEGORIES.ACTION,
        route: 'pre-sales.create',
        action: 'create',
    },
    {
        id: 'action-new-purchase',
        title: 'Create Purchase',
        subtitle: 'Record a new purchase bill',
        keywords: ['new', 'create', 'purchase', 'buy', 'add'],
        icon: FilePlus,
        category: CATEGORIES.ACTION,
        route: 'purchases.create',
        action: 'create',
    },
    {
        id: 'action-new-product',
        title: 'Add New Product',
        subtitle: 'Add item to inventory',
        keywords: ['new', 'create', 'product', 'item', 'add', 'inventory'],
        icon: PlusCircle,
        category: CATEGORIES.ACTION,
        route: 'inventory.index',
        action: 'create',
        queryParams: { action: 'add' },
    },
    {
        id: 'action-new-party',
        title: 'Add New Party',
        subtitle: 'Add customer or supplier',
        keywords: ['new', 'create', 'party', 'customer', 'supplier', 'add'],
        icon: UserPlus,
        category: CATEGORIES.ACTION,
        route: 'store.parties.index',
        action: 'create',
    },
    {
        id: 'action-new-expense',
        title: 'Record Expense',
        subtitle: 'Add a new expense entry',
        keywords: ['new', 'create', 'expense', 'add', 'cost'],
        icon: PlusCircle,
        category: CATEGORIES.ACTION,
        route: 'expenses.index',
        action: 'create',
    },
    {
        id: 'action-receive-payment',
        title: 'Receive Payment',
        subtitle: 'Record payment in',
        keywords: ['receive', 'payment', 'collection', 'money'],
        icon: CreditCard,
        category: CATEGORIES.ACTION,
        route: 'payments.in',
        action: 'create',
    },
    {
        id: 'action-make-payment',
        title: 'Make Payment',
        subtitle: 'Record payment out',
        keywords: ['make', 'pay', 'payment', 'send'],
        icon: CreditCard,
        category: CATEGORIES.ACTION,
        route: 'payments.out',
        action: 'create',
    },
    {
        id: 'action-export-products',
        title: 'Export Products',
        subtitle: 'Download product data as CSV',
        keywords: ['export', 'download', 'products', 'csv'],
        icon: Download,
        category: CATEGORIES.ACTION,
        route: 'store.admin.data.export',
        action: 'export',
    },
    {
        id: 'action-import-products',
        title: 'Import Products',
        subtitle: 'Upload product data from CSV',
        keywords: ['import', 'upload', 'products', 'csv'],
        icon: Upload,
        category: CATEGORIES.ACTION,
        route: 'store.admin.data',
        action: 'import',
    },

    // ==========================================
    // SETTING SHORTCUTS
    // ==========================================
    {
        id: 'setting-print',
        title: 'Print Settings',
        subtitle: 'Configure receipt & invoice printing',
        keywords: ['print', 'settings', 'receipt', 'thermal', 'printer'],
        icon: Printer,
        category: CATEGORIES.SETTING,
        route: 'store.settings',  // Store-scoped
        anchor: 'print',
    },
    {
        id: 'setting-business',
        title: 'Business Info Settings',
        subtitle: 'Store name, address, logo',
        keywords: ['business', 'info', 'store', 'company', 'name'],
        icon: Building2,
        category: CATEGORIES.SETTING,
        route: 'store.settings',  // Store-scoped
        anchor: 'business',
    },
    {
        id: 'setting-taxes',
        title: 'Tax Settings',
        subtitle: 'Configure tax rates',
        keywords: ['tax', 'settings', 'gst', 'vat', 'rate'],
        icon: Percent,
        category: CATEGORIES.SETTING,
        route: 'store.settings',  // Store-scoped
        anchor: 'taxes',
    },
    {
        id: 'setting-ai',
        title: 'AI Settings',
        subtitle: 'Configure Gemini/OpenAI API',
        keywords: ['ai', 'settings', 'gemini', 'openai', 'intelligence'],
        icon: Sparkles,
        category: CATEGORIES.SETTING,
        route: 'store.settings',  // Store-scoped
        anchor: 'ai',
    },
    {
        id: 'setting-general',
        title: 'General Settings',
        subtitle: 'Passcode, UI scale, defaults',
        keywords: ['general', 'settings', 'passcode', 'scale', 'default'],
        icon: Settings,
        category: CATEGORIES.SETTING,
        route: 'store.settings',  // Store-scoped
        anchor: 'general',
    },
    {
        id: 'setting-transaction',
        title: 'Transaction Settings',
        subtitle: 'Invoice prefixes, billing type',
        keywords: ['transaction', 'settings', 'invoice', 'prefix', 'billing'],
        icon: FileText,
        category: CATEGORIES.SETTING,
        route: 'store.settings',  // Store-scoped
        anchor: 'transaction',
    },
];

// ============================================
// NATURAL LANGUAGE INTENT PATTERNS
// ============================================
const INTENT_PATTERNS = [
    // SELL / SALES intents
    { patterns: ['i want to sell', 'want to sell', 'make a sale', 'create sale', 'new sale', 'open pos', 'start selling'], boost: ['pos', 'action-new-sale', 'action-new-invoice', 'sales-dashboard'] },
    // CREATE / ADD intents
    { patterns: ['create invoice', 'new invoice', 'make invoice'], boost: ['action-new-invoice', 'action-new-sale', 'sales-list'] },
    { patterns: ['add product', 'new product', 'create product', 'add item', 'new item'], boost: ['action-new-product', 'inventory-list'] },
    { patterns: ['add party', 'new party', 'add customer', 'new customer', 'add supplier'], boost: ['action-new-party', 'parties', 'customers'] },
    { patterns: ['add expense', 'new expense', 'record expense'], boost: ['action-new-expense', 'expenses'] },
    { patterns: ['create purchase', 'new purchase', 'buy stock'], boost: ['action-new-purchase', 'purchases'] },
    { patterns: ['receive payment', 'payment in', 'collect money'], boost: ['action-receive-payment', 'payments'] },
    { patterns: ['make payment', 'pay money', 'payment out'], boost: ['action-make-payment', 'payments'] },
    // VIEW / CHECK intents
    { patterns: ['check stock', 'view stock', 'stock level', 'how much stock'], boost: ['stock-levels', 'inventory-dashboard'] },
    { patterns: ['check profit', 'view profit', 'show profit', 'how much profit', 'pnl', 'p&l'], boost: ['profit-loss', 'report-profit-loss'] },
    { patterns: ['check sales', 'view sales', 'sales today', 'sales report'], boost: ['sales-dashboard', 'sales-list', 'report-sales'] },
    { patterns: ['check expenses', 'view expenses', 'expense report'], boost: ['expenses', 'report-expenses'] },
    { patterns: ['check balance', 'balance sheet', 'view balance'], boost: ['balance-sheet', 'accounting-dashboard'] },
    // SETTINGS intents
    { patterns: ['print settings', 'printing', 'receipt settings'], boost: ['setting-print', 'admin-settings'] },
    { patterns: ['tax settings', 'gst settings', 'configure tax'], boost: ['setting-taxes', 'admin-settings'] },
    { patterns: ['ai settings', 'gemini settings', 'openai settings'], boost: ['setting-ai', 'admin-settings'] },
    { patterns: ['business settings', 'company info', 'store info'], boost: ['setting-business', 'admin-settings'] },
    // REPORTS intents
    { patterns: ['day book', 'daily report', 'today report'], boost: ['report-day-book', 'reports-dashboard'] },
    { patterns: ['cash flow', 'money flow'], boost: ['report-cash-flow', 'accounting-dashboard'] },
    { patterns: ['low stock', 'stock shortage', 'reorder'], boost: ['report-low-stock', 'stock-levels'] },
    { patterns: ['expiry report', 'expiring', 'about to expire'], boost: ['report-expiry'] },
    // ADMIN intents
    { patterns: ['admin panel', 'administration', 'system admin'], boost: ['admin-panel', 'admin-settings'] },
    { patterns: ['manage users', 'user management', 'staff accounts'], boost: ['admin-users', 'admin-staff'] },
    { patterns: ['backup', 'restore', 'database backup'], boost: ['admin-database'] },
    { patterns: ['activity log', 'audit log', 'who did what'], boost: ['activity-log'] },
    { patterns: ['deleted items', 'recycle bin', 'restore deleted'], boost: ['recycle-bin'] },
    { patterns: ['import products', 'upload products', 'import csv'], boost: ['action-import-products', 'import-export'] },
    { patterns: ['export products', 'download products', 'export csv'], boost: ['action-export-products', 'import-export'] },
];

// ============================================
// SEARCH FUNCTION WITH FUZZY MATCHING + NLP
// ============================================
export function searchRegistry(query) {
    if (!query || query.length < 1) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const words = normalizedQuery.split(/\s+/);

    // Check for intent pattern matches
    let intentBoosts = new Set();
    INTENT_PATTERNS.forEach(intent => {
        if (intent.patterns.some(pattern => normalizedQuery.includes(pattern))) {
            intent.boost.forEach(id => intentBoosts.add(id));
        }
    });

    // Score each item
    const scored = APP_REGISTRY.map(item => {
        let score = 0;

        // Intent boost (highest priority for NLP matches)
        if (intentBoosts.has(item.id)) {
            score += 200;
        }

        // Title match (highest priority)
        if (item.title.toLowerCase().includes(normalizedQuery)) {
            score += 100;
        }

        // Keyword match
        item.keywords.forEach(keyword => {
            if (keyword.includes(normalizedQuery)) {
                score += 50;
            }
            // Partial word match
            words.forEach(word => {
                if (word.length >= 2 && keyword.includes(word)) {
                    score += 20;
                }
            });
        });

        // Subtitle match
        if (item.subtitle.toLowerCase().includes(normalizedQuery)) {
            score += 30;
        }

        // Boost actions if query contains action verbs
        const actionVerbs = ['new', 'create', 'add', 'make', 'open', 'go', 'show', 'view', 'check', 'want'];
        if (item.category === CATEGORIES.ACTION && actionVerbs.some(v => normalizedQuery.includes(v))) {
            score += 25;
        }

        // Boost if query starts with "i want to" or similar phrases
        if (/^(i want to|i need to|let me|show me|take me to|go to|open)/.test(normalizedQuery)) {
            if (item.category === CATEGORIES.ACTION) score += 15;
        }

        return { ...item, score };
    });

    // Filter and sort by score
    return scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Limit to top 10
}

// ============================================
// CATEGORY LABEL HELPER
// ============================================
export function getCategoryLabel(category) {
    switch (category) {
        case CATEGORIES.NAVIGATION: return 'Go to';
        case CATEGORIES.ACTION: return 'Action';
        case CATEGORIES.REPORT: return 'Report';
        case CATEGORIES.SETTING: return 'Settings';
        case CATEGORIES.RECORD: return 'Record';
        default: return '';
    }
}

// ============================================
// CATEGORY COLOR HELPER
// ============================================
export function getCategoryColor(category) {
    switch (category) {
        case CATEGORIES.NAVIGATION: return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400';
        case CATEGORIES.ACTION: return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
        case CATEGORIES.REPORT: return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
        case CATEGORIES.SETTING: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
        case CATEGORIES.RECORD: return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
        default: return 'bg-slate-50 text-slate-500';
    }
}

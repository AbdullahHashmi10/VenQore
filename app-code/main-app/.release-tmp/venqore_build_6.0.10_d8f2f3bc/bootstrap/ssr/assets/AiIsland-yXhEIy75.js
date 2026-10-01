import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import React, { useRef, useId, useState, useCallback, useLayoutEffect, useEffect, useMemo } from "react";
import { usePage, Link, router } from "@inertiajs/react";
import { useMotionValue, useTransform, useSpring, motion, useReducedMotion, AnimatePresence } from "motion/react";
import { Home, Sparkles, ShoppingCart, Armchair, Utensils, Box, Package, Layers, ArrowRightLeft, Tag, Building2, FileText, Activity, BookOpen, TrendingUp, Receipt, BarChart2, Clock, Users, UserPlus, DollarSign, CreditCard, Calculator, Database, Percent, Settings, Shield, History, Trash2, Download, PlusCircle, FilePlus, Upload, Printer, Mic, Camera, AlertCircle, AlertTriangle, X, MessageSquare, Zap, Bell, ScanLine, Search, CornerDownLeft, ChevronRight, ArrowUpRight, CheckCircle2, BellOff, Inbox, Volume2, VolumeX, ArrowRight } from "lucide-react";
import { createPortal } from "react-dom";
import { T as ThinkingOrb } from "./ThinkingOrb-CQCcf5-R.js";
import { c as useAppearance, b as useTheme, a as useWorkspace } from "../ssr.js";
const CATEGORIES = {
  NAVIGATION: "navigation",
  ACTION: "action",
  REPORT: "report",
  SETTING: "setting"
};
const APP_REGISTRY = [
  // ==========================================
  // DASHBOARDS & HOME
  // ==========================================
  {
    id: "home",
    title: "Home",
    subtitle: "Main dashboard & quick access",
    keywords: ["home", "dashboard", "main", "start", "overview"],
    icon: Home,
    category: CATEGORIES.NAVIGATION,
    route: "home"
  },
  {
    id: "system-builder",
    title: "System Builder (Modules & Features)",
    subtitle: "Turn business modules on or off any time with zero data loss",
    keywords: ["builder", "modules", "features", "customize", "add module", "enable", "disable", "apps", "plugins", "setup"],
    icon: Sparkles,
    category: CATEGORIES.NAVIGATION,
    route: "store.builder"
  },
  {
    id: "pos",
    title: "Point of Sale",
    subtitle: "Open the POS terminal",
    keywords: ["pos", "sell", "checkout", "terminal", "cash register", "billing", "counter"],
    icon: ShoppingCart,
    category: CATEGORIES.NAVIGATION,
    route: "store.pos"
  },
  {
    id: "tables-floor",
    title: "Table Service (Floor View)",
    subtitle: "Open the dining room floor plan & live table orders",
    keywords: ["tables", "table service", "floor plan", "dine in", "restaurant", "seating", "covers", "waiter", "orders", "lane"],
    icon: Armchair,
    category: CATEGORIES.NAVIGATION,
    route: "store.tables.index"
  },
  {
    id: "tables-plan",
    title: "Floor Plan Builder (Zones & Tables)",
    subtitle: "Design dining zones, add tables, configure seats and numbers",
    keywords: ["floor builder", "table layout", "dining room setup", "zones", "patio", "terrace", "restaurant layout"],
    icon: Utensils,
    category: CATEGORIES.NAVIGATION,
    route: "store.tables.plan"
  },
  // ==========================================
  // INVENTORY / STOCK
  // ==========================================
  {
    id: "inventory-dashboard",
    title: "Inventory Dashboard",
    subtitle: "Stock overview & analytics",
    keywords: ["inventory", "stock", "warehouse", "items", "products"],
    icon: Box,
    category: CATEGORIES.NAVIGATION,
    route: "store.inventory.dashboard"
  },
  {
    id: "inventory-list",
    title: "Product List",
    subtitle: "View & manage all products",
    keywords: ["products", "items", "inventory", "list", "catalog"],
    icon: Package,
    category: CATEGORIES.NAVIGATION,
    route: "inventory.index"
  },
  {
    id: "stock-levels",
    title: "Stock Levels",
    subtitle: "Current stock quantities",
    keywords: ["stock", "levels", "quantity", "remaining", "available"],
    icon: Layers,
    category: CATEGORIES.NAVIGATION,
    route: "inventory.stock-levels"
  },
  {
    id: "stock-operations",
    title: "Stock Operations",
    subtitle: "Transfers, adjustments & audits",
    keywords: ["stock", "transfer", "adjust", "audit", "operations", "movement"],
    icon: ArrowRightLeft,
    category: CATEGORIES.NAVIGATION,
    route: "stock-operations"
  },
  {
    id: "categories",
    title: "Categories",
    subtitle: "Product categories management",
    keywords: ["categories", "groups", "types", "classification"],
    icon: Tag,
    category: CATEGORIES.NAVIGATION,
    route: "categories.index"
  },
  {
    id: "suppliers",
    title: "Suppliers",
    subtitle: "Manage your suppliers",
    keywords: ["suppliers", "vendors", "wholesalers"],
    icon: Building2,
    category: CATEGORIES.NAVIGATION,
    route: "suppliers.index"
  },
  {
    id: "purchase-orders",
    title: "Purchase Orders",
    subtitle: "Manage purchase orders",
    keywords: ["purchase", "orders", "po", "buy"],
    icon: FileText,
    category: CATEGORIES.NAVIGATION,
    route: "purchase-orders.index"
  },
  {
    id: "production",
    title: "Production Runs",
    subtitle: "Manufacturing & production",
    keywords: ["production", "manufacturing", "make", "assemble"],
    icon: Activity,
    category: CATEGORIES.NAVIGATION,
    route: "production.index"
  },
  {
    id: "cookbook",
    title: "Cookbook (Recipes)",
    subtitle: "Product recipes & formulas",
    keywords: ["cookbook", "recipes", "formula", "bom", "bill of materials"],
    icon: BookOpen,
    category: CATEGORIES.NAVIGATION,
    route: "cookbook.index"
  },
  {
    id: "labels",
    title: "Print Labels",
    subtitle: "Generate product labels & barcodes",
    keywords: ["labels", "barcode", "print", "stickers"],
    icon: Tag,
    category: CATEGORIES.NAVIGATION,
    route: "labels.index"
  },
  {
    id: "attributes",
    title: "Product Attributes",
    subtitle: "Size, color, variants",
    keywords: ["attributes", "variants", "size", "color", "options"],
    icon: Layers,
    category: CATEGORIES.NAVIGATION,
    route: "attributes.index"
  },
  // ==========================================
  // SALES
  // ==========================================
  {
    id: "sales-dashboard",
    title: "Sales Dashboard",
    subtitle: "Sales overview & analytics",
    keywords: ["sales", "revenue", "dashboard", "sell"],
    icon: TrendingUp,
    category: CATEGORIES.NAVIGATION,
    route: "store.sales.dashboard"
  },
  {
    id: "sales-list",
    title: "Sales List",
    subtitle: "View all sales transactions",
    keywords: ["sales", "transactions", "history", "invoices"],
    icon: Receipt,
    category: CATEGORIES.NAVIGATION,
    route: "sales.index"
  },
  {
    id: "sales-analytics",
    title: "Sales Analytics",
    subtitle: "Advanced sales insights",
    keywords: ["analytics", "insights", "charts", "trends"],
    icon: BarChart2,
    category: CATEGORIES.NAVIGATION,
    route: "sales.analytics"
  },
  {
    id: "sales-pre-sales",
    title: "Pre-Sales",
    subtitle: "Manage pre-sales / quotes",
    keywords: ["sale", "orders", "quotes", "proforma", "pre-sale"],
    icon: FileText,
    category: CATEGORIES.NAVIGATION,
    route: "pre-sales.index"
  },
  {
    id: "parked-sales",
    title: "Parked Sales (Hold Bills)",
    subtitle: "View parked/held transactions",
    keywords: ["parked", "hold", "saved", "pending"],
    icon: Clock,
    category: CATEGORIES.NAVIGATION,
    route: "parked-sales.index"
  },
  // ==========================================
  // CONTACTS / PARTIES
  // ==========================================
  {
    id: "parties",
    title: "Parties",
    subtitle: "Customers & suppliers ledger",
    keywords: ["parties", "customers", "suppliers", "contacts", "ledger"],
    icon: Users,
    category: CATEGORIES.NAVIGATION,
    route: "store.parties.index"
  },
  {
    id: "customers",
    title: "Customers",
    subtitle: "Manage customer database",
    keywords: ["customers", "clients", "buyers"],
    icon: UserPlus,
    category: CATEGORIES.NAVIGATION,
    route: "customers.index"
  },
  // ==========================================
  // MONEY / FINANCE
  // ==========================================
  {
    id: "transactions",
    title: "All Transactions",
    subtitle: "View all financial transactions",
    keywords: ["transactions", "all", "money", "finance"],
    icon: DollarSign,
    category: CATEGORIES.NAVIGATION,
    route: "store.funds.index"
  },
  {
    id: "purchases",
    title: "Purchases",
    subtitle: "Purchase bills & invoices",
    keywords: ["purchases", "bills", "buying", "vendors"],
    icon: ShoppingCart,
    category: CATEGORIES.NAVIGATION,
    route: "purchases.index"
  },
  {
    id: "payments",
    title: "Payments",
    subtitle: "Payment in & out",
    keywords: ["payments", "receive", "pay", "collection"],
    icon: CreditCard,
    category: CATEGORIES.NAVIGATION,
    route: "payments.index"
  },
  {
    id: "payment-in",
    title: "Payment In (Receive)",
    subtitle: "Record incoming payment",
    keywords: ["receive", "collection", "payment in", "incoming"],
    icon: CreditCard,
    category: CATEGORIES.NAVIGATION,
    route: "payments.in"
  },
  {
    id: "payment-out",
    title: "Payment Out (Pay)",
    subtitle: "Record outgoing payment",
    keywords: ["pay", "payment out", "outgoing", "disbursement"],
    icon: CreditCard,
    category: CATEGORIES.NAVIGATION,
    route: "payments.out"
  },
  {
    id: "expenses",
    title: "Expenses",
    subtitle: "Track business expenses",
    keywords: ["expenses", "costs", "spending", "bills"],
    icon: Receipt,
    category: CATEGORIES.NAVIGATION,
    route: "expenses.index"
  },
  {
    id: "bank-accounts",
    title: "Bank Accounts",
    subtitle: "Manage bank & cash accounts",
    keywords: ["bank", "accounts", "cash", "wallet"],
    icon: Building2,
    category: CATEGORIES.NAVIGATION,
    route: "bank-accounts.index"
  },
  {
    id: "receivables",
    title: "Receivables",
    subtitle: "Money owed to you",
    keywords: ["receivables", "owed", "pending", "dues"],
    icon: DollarSign,
    category: CATEGORIES.NAVIGATION,
    route: "finance.receivables"
  },
  {
    id: "payables",
    title: "Payables",
    subtitle: "Money you owe",
    keywords: ["payables", "owe", "debts", "liabilities"],
    icon: DollarSign,
    category: CATEGORIES.NAVIGATION,
    route: "finance.payables"
  },
  // ==========================================
  // ACCOUNTING
  // ==========================================
  {
    id: "accounting-dashboard",
    title: "Accounting Dashboard",
    subtitle: "Financial overview",
    keywords: ["accounting", "finance", "dashboard"],
    icon: Calculator,
    category: CATEGORIES.NAVIGATION,
    route: "accounting.dashboard"
  },
  {
    id: "chart-of-accounts",
    title: "Chart of Accounts",
    subtitle: "Account ledgers & structure",
    keywords: ["chart", "accounts", "ledger", "coa"],
    icon: Database,
    category: CATEGORIES.NAVIGATION,
    route: "accounting.index"
  },
  {
    id: "profit-loss",
    title: "Profit & Loss (P&L)",
    subtitle: "Income statement",
    keywords: ["profit", "loss", "pnl", "income", "statement", "earnings"],
    icon: TrendingUp,
    category: CATEGORIES.NAVIGATION,
    route: "accounting.pnl"
  },
  {
    id: "balance-sheet",
    title: "Balance Sheet",
    subtitle: "Assets, liabilities & equity",
    keywords: ["balance", "sheet", "assets", "liabilities", "equity"],
    icon: FileText,
    category: CATEGORIES.NAVIGATION,
    route: "accounting.balance-sheet"
  },
  // ==========================================
  // REPORTS
  // ==========================================
  {
    id: "reports-dashboard",
    title: "Reports Hub",
    subtitle: "All reports in one place",
    keywords: ["reports", "analytics", "insights", "data"],
    icon: BarChart2,
    category: CATEGORIES.NAVIGATION,
    route: "reports.dashboard"
  },
  {
    id: "report-sales",
    title: "Sales Report",
    subtitle: "Detailed sales analysis",
    keywords: ["sales", "report", "revenue"],
    icon: BarChart2,
    category: CATEGORIES.REPORT,
    route: "store.reports.sales"
  },
  {
    id: "report-purchases",
    title: "Purchase Report",
    subtitle: "Purchase analysis",
    keywords: ["purchase", "report", "buying"],
    icon: BarChart2,
    category: CATEGORIES.REPORT,
    route: "store.reports.purchases"
  },
  {
    id: "report-day-book",
    title: "Day Book",
    subtitle: "Daily transactions summary",
    keywords: ["day", "book", "daily", "journal"],
    icon: BookOpen,
    category: CATEGORIES.REPORT,
    route: "store.reports.day-book"
  },
  {
    id: "report-profit-loss",
    title: "Profit & Loss Report",
    subtitle: "Detailed P&L analysis",
    keywords: ["profit", "loss", "report", "margin"],
    icon: TrendingUp,
    category: CATEGORIES.REPORT,
    route: "store.reports.profit-loss"
  },
  {
    id: "report-party-statement",
    title: "Party Statement",
    subtitle: "Ledger for specific party",
    keywords: ["party", "statement", "ledger", "account"],
    icon: FileText,
    category: CATEGORIES.REPORT,
    route: "store.reports.party-statement"
  },
  {
    id: "report-stock-valuation",
    title: "Stock Valuation",
    subtitle: "Inventory value report",
    keywords: ["stock", "valuation", "inventory", "value"],
    icon: Package,
    category: CATEGORIES.REPORT,
    route: "store.reports.stock-valuation"
  },
  {
    id: "report-low-stock",
    title: "Low Stock Report",
    subtitle: "Items below reorder level",
    keywords: ["low", "stock", "reorder", "shortage"],
    icon: Package,
    category: CATEGORIES.REPORT,
    route: "store.reports.low-stock"
  },
  {
    id: "report-expiry",
    title: "Expiry Report",
    subtitle: "Expiring products",
    keywords: ["expiry", "expiring", "date", "shelf life"],
    icon: Clock,
    category: CATEGORIES.REPORT,
    route: "store.reports.expiry"
  },
  {
    id: "report-tax",
    title: "Tax Report",
    subtitle: "Tax collected & payable",
    keywords: ["tax", "gst", "vat", "fbr"],
    icon: Percent,
    category: CATEGORIES.REPORT,
    route: "store.reports.tax"
  },
  {
    id: "report-bank-statement",
    title: "Bank Statement",
    subtitle: "Bank account transactions",
    keywords: ["bank", "statement", "transactions"],
    icon: Building2,
    category: CATEGORIES.REPORT,
    route: "store.reports.bank-statement"
  },
  {
    id: "report-expenses",
    title: "Expense Report",
    subtitle: "Expense analysis",
    keywords: ["expense", "report", "spending"],
    icon: Receipt,
    category: CATEGORIES.REPORT,
    route: "store.reports.expenses"
  },
  {
    id: "report-cash-flow",
    title: "Cash Flow",
    subtitle: "Money in & out analysis",
    keywords: ["cash", "flow", "liquidity"],
    icon: DollarSign,
    category: CATEGORIES.REPORT,
    route: "store.reports.cash-flow"
  },
  {
    id: "report-trial-balance",
    title: "Trial Balance",
    subtitle: "Accounting trial balance",
    keywords: ["trial", "balance", "accounting"],
    icon: Calculator,
    category: CATEGORIES.REPORT,
    route: "store.reports.trial-balance"
  },
  {
    id: "report-item-wise-profit",
    title: "Item-wise Profit",
    subtitle: "Profit by product",
    keywords: ["item", "product", "profit", "margin"],
    icon: TrendingUp,
    category: CATEGORIES.REPORT,
    route: "store.reports.item-wise-profit"
  },
  {
    id: "report-party-wise-profit",
    title: "Party-wise Profit/Loss",
    subtitle: "Profit by customer/supplier",
    keywords: ["party", "customer", "profit", "loss"],
    icon: Users,
    category: CATEGORIES.REPORT,
    route: "store.reports.party-wise-profit-loss"
  },
  {
    id: "report-discount",
    title: "Discount Report",
    subtitle: "Discounts given analysis",
    keywords: ["discount", "offers", "concession"],
    icon: Percent,
    category: CATEGORIES.REPORT,
    route: "store.reports.discount"
  },
  // ==========================================
  // ADMIN & SETTINGS
  // ==========================================
  {
    id: "settings",
    title: "Settings",
    subtitle: "App preferences & configuration",
    keywords: ["settings", "preferences", "config", "options"],
    icon: Settings,
    category: CATEGORIES.SETTING,
    route: "settings"
  },
  {
    id: "admin-panel",
    title: "Store Admin Panel",
    subtitle: "Manage your store",
    keywords: ["admin", "panel", "system", "management", "store settings"],
    icon: Shield,
    category: CATEGORIES.NAVIGATION,
    route: "store.settings"
    // Store-scoped — NOT /admin-panel
  },
  {
    id: "admin-settings",
    title: "System Settings",
    subtitle: "Business, print, tax settings",
    keywords: ["system", "settings", "admin", "configuration"],
    icon: Settings,
    category: CATEGORIES.SETTING,
    route: "store.settings"
    // Store-scoped settings
  },
  {
    id: "admin-users",
    title: "Staff Management",
    subtitle: "Manage staff & users",
    keywords: ["users", "staff", "employees", "team", "accounts"],
    icon: Users,
    category: CATEGORIES.NAVIGATION,
    route: "store.staff"
    // Store-scoped staff
  },
  {
    id: "admin-logs",
    title: "Activity Log",
    subtitle: "Activity & audit logs",
    keywords: ["logs", "activity", "errors", "history", "audit"],
    icon: FileText,
    category: CATEGORIES.NAVIGATION,
    route: "activity-log.index"
  },
  {
    id: "admin-staff",
    title: "Staff Summaries",
    subtitle: "Staff performance & attendance",
    keywords: ["staff", "attendance", "performance", "employees"],
    icon: Users,
    category: CATEGORIES.NAVIGATION,
    route: "staff-attendance.index"
  },
  // ==========================================
  // UTILITY PAGES
  // ==========================================
  {
    id: "activity-log",
    title: "Activity Log",
    subtitle: "Recent actions & history",
    keywords: ["activity", "log", "history", "audit", "changes"],
    icon: History,
    category: CATEGORIES.NAVIGATION,
    route: "activity-log.index"
  },
  {
    id: "recycle-bin",
    title: "Recycle Bin",
    subtitle: "Deleted items & restore",
    keywords: ["recycle", "bin", "trash", "deleted", "restore"],
    icon: Trash2,
    category: CATEGORIES.NAVIGATION,
    route: "recycle-bin.index"
  },
  {
    id: "import-export",
    title: "Import / Export",
    subtitle: "Bulk data import & export",
    keywords: ["import", "export", "csv", "excel", "bulk"],
    icon: Download,
    category: CATEGORIES.NAVIGATION,
    route: "store.admin.data"
  },
  {
    id: "growth-engine",
    title: "Growth Engine",
    subtitle: "AI recommendations & loyalty",
    keywords: ["growth", "engine", "ai", "recommendations", "loyalty"],
    icon: Sparkles,
    category: CATEGORIES.NAVIGATION,
    route: "growth-engine.index"
  },
  {
    id: "notifications",
    title: "Notifications",
    subtitle: "View all notifications",
    keywords: ["notifications", "alerts", "messages"],
    icon: Activity,
    category: CATEGORIES.NAVIGATION,
    route: "notifications.index"
  },
  // ==========================================
  // QUICK ACTIONS (Create/Add)
  // ==========================================
  {
    id: "action-new-sale",
    title: "Create New Sale",
    subtitle: "Open POS to make a sale",
    keywords: ["new", "create", "sale", "sell", "add"],
    icon: PlusCircle,
    category: CATEGORIES.ACTION,
    route: "store.pos",
    action: "create"
  },
  {
    id: "action-new-invoice",
    title: "Create Invoice",
    subtitle: "Create a detailed invoice",
    keywords: ["new", "create", "invoice", "bill", "add"],
    icon: FilePlus,
    category: CATEGORIES.ACTION,
    route: "sales.invoice.create",
    action: "create"
  },
  {
    id: "action-new-pre-sale",
    title: "Create Pre-Sale",
    subtitle: "Create a new pre-sale/quote",
    keywords: ["new", "create", "sale", "order", "quote", "proforma", "pre-sale"],
    icon: FilePlus,
    category: CATEGORIES.ACTION,
    route: "pre-sales.create",
    action: "create"
  },
  {
    id: "action-new-purchase",
    title: "Create Purchase",
    subtitle: "Record a new purchase bill",
    keywords: ["new", "create", "purchase", "buy", "add"],
    icon: FilePlus,
    category: CATEGORIES.ACTION,
    route: "purchases.create",
    action: "create"
  },
  {
    id: "action-new-product",
    title: "Add New Product",
    subtitle: "Add item to inventory",
    keywords: ["new", "create", "product", "item", "add", "inventory"],
    icon: PlusCircle,
    category: CATEGORIES.ACTION,
    route: "inventory.index",
    action: "create",
    queryParams: { action: "add" }
  },
  {
    id: "action-new-party",
    title: "Add New Party",
    subtitle: "Add customer or supplier",
    keywords: ["new", "create", "party", "customer", "supplier", "add"],
    icon: UserPlus,
    category: CATEGORIES.ACTION,
    route: "store.parties.index",
    action: "create"
  },
  {
    id: "action-new-expense",
    title: "Record Expense",
    subtitle: "Add a new expense entry",
    keywords: ["new", "create", "expense", "add", "cost"],
    icon: PlusCircle,
    category: CATEGORIES.ACTION,
    route: "expenses.index",
    action: "create"
  },
  {
    id: "action-receive-payment",
    title: "Receive Payment",
    subtitle: "Record payment in",
    keywords: ["receive", "payment", "collection", "money"],
    icon: CreditCard,
    category: CATEGORIES.ACTION,
    route: "payments.in",
    action: "create"
  },
  {
    id: "action-make-payment",
    title: "Make Payment",
    subtitle: "Record payment out",
    keywords: ["make", "pay", "payment", "send"],
    icon: CreditCard,
    category: CATEGORIES.ACTION,
    route: "payments.out",
    action: "create"
  },
  {
    id: "action-export-products",
    title: "Export Products",
    subtitle: "Download product data as CSV",
    keywords: ["export", "download", "products", "csv"],
    icon: Download,
    category: CATEGORIES.ACTION,
    route: "store.admin.data.export",
    action: "export"
  },
  {
    id: "action-import-products",
    title: "Import Products",
    subtitle: "Upload product data from CSV",
    keywords: ["import", "upload", "products", "csv"],
    icon: Upload,
    category: CATEGORIES.ACTION,
    route: "store.admin.data",
    action: "import"
  },
  // ==========================================
  // SETTING SHORTCUTS
  // ==========================================
  {
    id: "setting-print",
    title: "Print Settings",
    subtitle: "Configure receipt & invoice printing",
    keywords: ["print", "settings", "receipt", "thermal", "printer"],
    icon: Printer,
    category: CATEGORIES.SETTING,
    route: "store.settings",
    // Store-scoped
    anchor: "print"
  },
  {
    id: "setting-business",
    title: "Business Info Settings",
    subtitle: "Store name, address, logo",
    keywords: ["business", "info", "store", "company", "name"],
    icon: Building2,
    category: CATEGORIES.SETTING,
    route: "store.settings",
    // Store-scoped
    anchor: "business"
  },
  {
    id: "setting-taxes",
    title: "Tax Settings",
    subtitle: "Configure tax rates",
    keywords: ["tax", "settings", "gst", "vat", "rate"],
    icon: Percent,
    category: CATEGORIES.SETTING,
    route: "store.settings",
    // Store-scoped
    anchor: "taxes"
  },
  {
    id: "setting-ai",
    title: "AI Settings",
    subtitle: "Configure Gemini/OpenAI API",
    keywords: ["ai", "settings", "gemini", "openai", "intelligence"],
    icon: Sparkles,
    category: CATEGORIES.SETTING,
    route: "store.settings",
    // Store-scoped
    anchor: "ai"
  },
  {
    id: "setting-general",
    title: "General Settings",
    subtitle: "Passcode, UI scale, defaults",
    keywords: ["general", "settings", "passcode", "scale", "default"],
    icon: Settings,
    category: CATEGORIES.SETTING,
    route: "store.settings",
    // Store-scoped
    anchor: "general"
  },
  {
    id: "setting-transaction",
    title: "Transaction Settings",
    subtitle: "Invoice prefixes, billing type",
    keywords: ["transaction", "settings", "invoice", "prefix", "billing"],
    icon: FileText,
    category: CATEGORIES.SETTING,
    route: "store.settings",
    // Store-scoped
    anchor: "transaction"
  }
];
const INTENT_PATTERNS = [
  // SELL / SALES intents
  { patterns: ["i want to sell", "want to sell", "make a sale", "create sale", "new sale", "open pos", "start selling"], boost: ["pos", "action-new-sale", "action-new-invoice", "sales-dashboard"] },
  // CREATE / ADD intents
  { patterns: ["create invoice", "new invoice", "make invoice"], boost: ["action-new-invoice", "action-new-sale", "sales-list"] },
  { patterns: ["add product", "new product", "create product", "add item", "new item"], boost: ["action-new-product", "inventory-list"] },
  { patterns: ["add party", "new party", "add customer", "new customer", "add supplier"], boost: ["action-new-party", "parties", "customers"] },
  { patterns: ["add expense", "new expense", "record expense"], boost: ["action-new-expense", "expenses"] },
  { patterns: ["create purchase", "new purchase", "buy stock"], boost: ["action-new-purchase", "purchases"] },
  { patterns: ["receive payment", "payment in", "collect money"], boost: ["action-receive-payment", "payments"] },
  { patterns: ["make payment", "pay money", "payment out"], boost: ["action-make-payment", "payments"] },
  // VIEW / CHECK intents
  { patterns: ["check stock", "view stock", "stock level", "how much stock"], boost: ["stock-levels", "inventory-dashboard"] },
  { patterns: ["check profit", "view profit", "show profit", "how much profit", "pnl", "p&l"], boost: ["profit-loss", "report-profit-loss"] },
  { patterns: ["check sales", "view sales", "sales today", "sales report"], boost: ["sales-dashboard", "sales-list", "report-sales"] },
  { patterns: ["check expenses", "view expenses", "expense report"], boost: ["expenses", "report-expenses"] },
  { patterns: ["check balance", "balance sheet", "view balance"], boost: ["balance-sheet", "accounting-dashboard"] },
  // SETTINGS intents
  { patterns: ["print settings", "printing", "receipt settings"], boost: ["setting-print", "admin-settings"] },
  { patterns: ["tax settings", "gst settings", "configure tax"], boost: ["setting-taxes", "admin-settings"] },
  { patterns: ["ai settings", "gemini settings", "openai settings"], boost: ["setting-ai", "admin-settings"] },
  { patterns: ["business settings", "company info", "store info"], boost: ["setting-business", "admin-settings"] },
  // REPORTS intents
  { patterns: ["day book", "daily report", "today report"], boost: ["report-day-book", "reports-dashboard"] },
  { patterns: ["cash flow", "money flow"], boost: ["report-cash-flow", "accounting-dashboard"] },
  { patterns: ["low stock", "stock shortage", "reorder"], boost: ["report-low-stock", "stock-levels"] },
  { patterns: ["expiry report", "expiring", "about to expire"], boost: ["report-expiry"] },
  // ADMIN intents
  { patterns: ["admin panel", "administration", "system admin"], boost: ["admin-panel", "admin-settings"] },
  { patterns: ["manage users", "user management", "staff accounts"], boost: ["admin-users", "admin-staff"] },
  { patterns: ["backup", "restore", "database backup"], boost: ["admin-database"] },
  { patterns: ["activity log", "audit log", "who did what"], boost: ["activity-log"] },
  { patterns: ["deleted items", "recycle bin", "restore deleted"], boost: ["recycle-bin"] },
  { patterns: ["import products", "upload products", "import csv"], boost: ["action-import-products", "import-export"] },
  { patterns: ["export products", "download products", "export csv"], boost: ["action-export-products", "import-export"] }
];
function searchRegistry(query, tt = (s) => s) {
  if (!query || query.length < 1) return [];
  const normalizedQuery = query.toLowerCase().trim();
  const words = normalizedQuery.split(/\s+/);
  let intentBoosts = /* @__PURE__ */ new Set();
  INTENT_PATTERNS.forEach((intent) => {
    if (intent.patterns.some((pattern) => normalizedQuery.includes(pattern))) {
      intent.boost.forEach((id) => intentBoosts.add(id));
    }
  });
  const scored = APP_REGISTRY.map((item) => {
    let score = 0;
    if (intentBoosts.has(item.id)) {
      score += 200;
    }
    if (item.title.toLowerCase().includes(normalizedQuery)) {
      score += 100;
    }
    item.keywords.forEach((keyword) => {
      if (keyword.includes(normalizedQuery)) {
        score += 50;
      }
      words.forEach((word) => {
        if (word.length >= 2 && keyword.includes(word)) {
          score += 20;
        }
      });
    });
    if (item.subtitle.toLowerCase().includes(normalizedQuery)) {
      score += 30;
    }
    const actionVerbs = ["new", "create", "add", "make", "open", "go", "show", "view", "check", "want"];
    if (item.category === CATEGORIES.ACTION && actionVerbs.some((v) => normalizedQuery.includes(v))) {
      score += 25;
    }
    if (/^(i want to|i need to|let me|show me|take me to|go to|open)/.test(normalizedQuery)) {
      if (item.category === CATEGORIES.ACTION) score += 15;
    }
    return { ...item, score };
  });
  return scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 10).map((item) => ({ ...item, title: tt(item.title), subtitle: tt(item.subtitle) }));
}
const DUR = { d1: 0.12, d2: 0.2, d3: 0.32 };
const EASE_OUT = [0.22, 1, 0.36, 1];
const EASE_SPRING_SOFT = [0.32, 1.28, 0.5, 1];
const STAGGER = 0.06;
const OPEN_W = { type: "spring", stiffness: 380, damping: 34, mass: 1 };
const OPEN_H = { type: "spring", stiffness: 460, damping: 40, mass: 0.9 };
const CLOSE_W = { type: "spring", stiffness: 520, damping: 42, mass: 0.85 };
const CLOSE_H = { type: "spring", stiffness: 400, damping: 38, mass: 1 };
const POP = { type: "spring", stiffness: 520, damping: 30, mass: 1.15 };
const geometryTransition = (isGrowing, isAlert = false) => {
  if (isAlert) return { width: POP, height: POP };
  return isGrowing ? { width: OPEN_W, height: OPEN_H } : { width: CLOSE_W, height: CLOSE_H };
};
const contentVariants = {
  initial: { opacity: 0, scale: 1.05, filter: "blur(8px)" },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: DUR.d3, delay: DUR.d1 * 0.5, ease: EASE_OUT }
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    filter: "blur(6px)",
    transition: { duration: DUR.d1, ease: EASE_OUT }
  }
};
const listVariants = {
  animate: { transition: { staggerChildren: STAGGER, delayChildren: DUR.d1 } }
};
const itemVariants = {
  initial: { opacity: 0, y: 8, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: DUR.d3, ease: EASE_SPRING_SOFT }
  }
};
const RADIUS_CEILING = 28;
const radiusForHeight = (h) => Math.min(h / 2, RADIUS_CEILING);
const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function useIslandAnchor(slotRef) {
  const [anchor, setAnchor] = useState({ cx: 0, top: 0, ready: false });
  const frame = useRef(0);
  const measure = useCallback(() => {
    const el = slotRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    setAnchor((prev) => {
      const cx = r.left + r.width / 2;
      const top = r.top;
      if (prev.ready && Math.abs(prev.cx - cx) < 0.5 && Math.abs(prev.top - top) < 0.5) return prev;
      return { cx, top, ready: true };
    });
  }, [slotRef]);
  const schedule = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(measure);
  }, [measure]);
  useLayoutEffect(() => {
    measure();
    const el = slotRef.current;
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    if (ro && el) ro.observe(el);
    if (ro) ro.observe(document.documentElement);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    return () => {
      cancelAnimationFrame(frame.current);
      ro?.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, { capture: true });
    };
  }, [measure, schedule, slotRef]);
  return anchor;
}
function IslandShell({
  width,
  height,
  restWidth,
  restHeight,
  isOpen,
  isAlert = false,
  tone = "neutral",
  // 'neutral' | 'accent' | 'warning' | 'danger'
  sheen: sheenEnabled = true,
  onHoverChange,
  onScrimClick,
  children,
  slotClassName = "",
  ariaLabel = "VenQore Island"
}) {
  const slotRef = useRef(null);
  const surfaceRef = useRef(null);
  const anchor = useIslandAnchor(slotRef);
  const gooId = useId().replace(/:/g, "");
  const reduced = prefersReducedMotion();
  const isGrowing = width * height > restWidth * restHeight;
  const hMV = useMotionValue(restHeight);
  const radius = useTransform(hMV, (h) => radiusForHeight(h));
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 220, damping: 30, mass: 0.7 });
  const sy = useSpring(py, { stiffness: 220, damping: 30, mass: 0.7 });
  const sheen = useTransform(
    [sx, sy],
    ([x, y]) => `radial-gradient(110px circle at ${x * 100}% ${y * 100}%, rgba(35,196,166,.09), rgba(255,255,255,.025) 40%, transparent 70%)`
  );
  const handlePointer = (e) => {
    const el = surfaceRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    py.set(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
  };
  const toneRing = {
    neutral: "rgba(255,255,255,.10)",
    accent: "rgba(35,196,166,.42)",
    warning: "rgba(255,205,91,.45)",
    danger: "rgba(255,138,107,.48)"
  }[tone];
  const toneGlow = {
    neutral: "0 24px 56px -16px rgba(13,20,18,.42)",
    accent: "0 24px 56px -16px rgba(11,170,143,.40)",
    warning: "0 24px 56px -16px rgba(166,105,10,.38)",
    danger: "0 24px 56px -16px rgba(196,68,58,.40)"
  }[tone];
  const transition = reduced ? { width: { duration: DUR.d2, ease: EASE_OUT }, height: { duration: DUR.d2, ease: EASE_OUT } } : geometryTransition(isGrowing, isAlert);
  const island = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      motion.div,
      {
        "aria-hidden": true,
        initial: false,
        animate: { opacity: isOpen ? 1 : 0 },
        transition: { duration: DUR.d3, ease: EASE_OUT },
        onClick: onScrimClick,
        className: "fixed inset-0 z-command-scrim",
        style: {
          zIndex: "calc(var(--vq-z-command, 1000) - 1)",
          background: "rgb(13 20 18 / .40)",
          backdropFilter: "blur(10px) saturate(120%)",
          WebkitBackdropFilter: "blur(10px) saturate(120%)",
          pointerEvents: isOpen ? "auto" : "none"
        }
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "fixed z-command",
        style: {
          zIndex: "var(--vq-z-command, 1000)",
          left: anchor.cx,
          top: anchor.top,
          transform: "translateX(-50%)",
          pointerEvents: "none",
          opacity: anchor.ready ? 1 : 0
        },
        children: [
          /* @__PURE__ */ jsx("svg", { width: "0", height: "0", style: { position: "absolute" }, "aria-hidden": true, children: /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("filter", { id: `goo-${gooId}`, children: [
            /* @__PURE__ */ jsx("feGaussianBlur", { in: "SourceGraphic", stdDeviation: "9", result: "blur" }),
            /* @__PURE__ */ jsx(
              "feColorMatrix",
              {
                in: "blur",
                mode: "matrix",
                values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -12",
                result: "goo"
              }
            ),
            /* @__PURE__ */ jsx("feBlend", { in: "SourceGraphic", in2: "goo" })
          ] }) }) }),
          /* @__PURE__ */ jsxs(
            motion.div,
            {
              "aria-hidden": true,
              className: "absolute left-1/2 top-0",
              style: { filter: `url(#goo-${gooId})`, transform: "translateX(-50%)", pointerEvents: "none" },
              animate: { opacity: isAlert ? 1 : 0 },
              transition: { duration: DUR.d2, ease: EASE_OUT },
              children: [
                /* @__PURE__ */ jsx(
                  motion.div,
                  {
                    initial: { width: restWidth, height: restHeight },
                    animate: { width, height },
                    transition,
                    style: { borderRadius: radius, background: "#0D1412" }
                  }
                ),
                /* @__PURE__ */ jsx(
                  motion.span,
                  {
                    className: "absolute rounded-full",
                    style: { background: "#0D1412", width: 16, height: 16, left: "50%", marginLeft: -8 },
                    animate: isAlert ? { top: [restHeight * 0.5, -14, restHeight * 0.5], scale: [0.4, 1, 0.4], opacity: [0, 1, 0] } : { top: restHeight * 0.5, scale: 0.4, opacity: 0 },
                    transition: { duration: 0.62, ease: EASE_OUT, times: [0, 0.45, 1] }
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            motion.div,
            {
              ref: surfaceRef,
              "aria-label": ariaLabel,
              onPointerMove: handlePointer,
              onPointerEnter: () => onHoverChange?.(true),
              onPointerLeave: () => {
                px.set(0.5);
                py.set(0.5);
                onHoverChange?.(false);
              },
              className: "relative overflow-hidden",
              initial: { width: restWidth, height: restHeight },
              animate: { width, height },
              style: {
                borderRadius: radius,
                pointerEvents: "auto",
                background: "linear-gradient(180deg, #131C19 0%, #0D1412 42%, #070C0A 100%)",
                boxShadow: `inset 0 1px 0 rgba(255,255,255,.10), inset 0 0 0 1px ${toneRing}, 0 2px 6px rgba(13,20,18,.20), ${toneGlow}`,
                color: "#F1F5F2",
                willChange: "width, height"
              },
              transition,
              onUpdate: (latest) => {
                if (typeof latest.height === "number") hMV.set(latest.height);
              },
              children: [
                sheenEnabled && /* @__PURE__ */ jsx(
                  motion.div,
                  {
                    "aria-hidden": true,
                    className: "pointer-events-none absolute inset-0",
                    style: { background: sheen, mixBlendMode: "plus-lighter" }
                  }
                ),
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    "aria-hidden": true,
                    className: "pointer-events-none absolute inset-x-0 top-0 h-1/2",
                    style: { background: "linear-gradient(180deg, rgba(255,255,255,.07), transparent)" }
                  }
                ),
                children
              ]
            }
          )
        ]
      }
    )
  ] });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        ref: slotRef,
        className: slotClassName,
        style: { width: restWidth, height: restHeight },
        "aria-hidden": true
      }
    ),
    typeof document !== "undefined" && createPortal(island, document.body)
  ] });
}
const CARET_SPRING = { stiffness: 500, damping: 30, mass: 0.5 };
function SmoothCaretInput({
  type = "text",
  value = "",
  onChange,
  placeholder = "",
  className = "",
  inputClassName = "",
  icon: Icon = null,
  caretColor = "bg-brand-500",
  disabled = false,
  id,
  name,
  required = false,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const mirrorRef = useRef(null);
  const containerRef = useRef(null);
  const reduced = useReducedMotion();
  const caretX = useMotionValue(0);
  const caretOpacity = useMotionValue(0);
  const [caretHeight, setCaretHeight] = useState(20);
  const springX = useSpring(caretX, reduced ? { stiffness: 1e4, damping: 100, mass: 0.1 } : CARET_SPRING);
  const syncMirror = useCallback(() => {
    const input = inputRef.current;
    const mirror = mirrorRef.current;
    if (!input || !mirror) return null;
    const cs = window.getComputedStyle(input);
    mirror.style.font = cs.font;
    mirror.style.fontFamily = cs.fontFamily;
    mirror.style.fontSize = cs.fontSize;
    mirror.style.fontWeight = cs.fontWeight;
    mirror.style.letterSpacing = cs.letterSpacing;
    mirror.style.fontFeatureSettings = cs.fontFeatureSettings;
    return cs;
  }, []);
  const updateCaret = useCallback(() => {
    const input = inputRef.current;
    const mirror = mirrorRef.current;
    if (!input || !mirror) return;
    const cs = syncMirror();
    if (!cs) return;
    const selStart = input.selectionStart ?? 0;
    const selEnd = input.selectionEnd ?? 0;
    const hasSelection = selStart !== selEnd;
    const caretIndex = hasSelection ? input.selectionDirection === "backward" ? selStart : selEnd : selStart;
    const before = (input.value || "").slice(0, caretIndex);
    mirror.textContent = before;
    if (before.endsWith(" ")) mirror.innerHTML = before.replace(/ /g, "&nbsp;");
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const absolute = before.length ? mirror.offsetWidth + padL : padL;
    const maxScroll = Math.max(0, input.scrollWidth - input.clientWidth);
    const visibleRight = input.scrollLeft + input.clientWidth - padR;
    const visibleLeft = input.scrollLeft + padL;
    if (absolute > visibleRight) {
      input.scrollLeft = Math.min(absolute - input.clientWidth + padR, maxScroll);
    } else if (absolute < visibleLeft) {
      input.scrollLeft = Math.max(0, absolute - padL);
    }
    const x = absolute - input.scrollLeft;
    const minX = padL - 1;
    const maxX = input.clientWidth - padR;
    const visible = x >= minX && x <= maxX + 1;
    caretX.set(Math.min(Math.max(x, minX), maxX));
    setCaretHeight(Math.round(parseFloat(cs.fontSize) * 1.15) || 20);
    caretOpacity.set(isFocused && !disabled && visible && !hasSelection ? 1 : 0);
  }, [syncMirror, caretX, caretOpacity, isFocused, disabled]);
  const updateRef = useRef(updateCaret);
  useEffect(() => {
    updateRef.current = updateCaret;
  }, [updateCaret]);
  useEffect(() => {
    updateRef.current();
  }, [value, isFocused]);
  useEffect(() => {
    const input = inputRef.current;
    const container = containerRef.current;
    if (!input || !container) return void 0;
    const refresh = () => {
      if (document.activeElement === input) updateRef.current();
    };
    const onSelectionChange = () => {
      if (document.activeElement !== input) return;
      requestAnimationFrame(refresh);
    };
    document.addEventListener("selectionchange", onSelectionChange);
    input.addEventListener("scroll", refresh);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(refresh) : null;
    ro?.observe(container);
    if (document.fonts) {
      document.fonts.addEventListener?.("loadingdone", refresh);
      document.fonts.ready?.then(refresh).catch(() => {
      });
    }
    refresh();
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      input.removeEventListener("scroll", refresh);
      ro?.disconnect();
      document.fonts?.removeEventListener?.("loadingdone", refresh);
    };
  }, []);
  const handleChange = (e) => {
    onChange?.(e);
    requestAnimationFrame(() => updateRef.current());
  };
  return /* @__PURE__ */ jsxs(
    "label",
    {
      ref: containerRef,
      htmlFor: id,
      className: `relative flex items-center w-full ${className}`,
      children: [
        Icon && /* @__PURE__ */ jsx("div", { className: "absolute left-3.5 z-10 text-ink-muted pointer-events-none flex items-center justify-center", children: /* @__PURE__ */ jsx(Icon, { size: 18 }) }),
        /* @__PURE__ */ jsx(
          "span",
          {
            ref: mirrorRef,
            className: "absolute opacity-0 pointer-events-none whitespace-pre select-none left-0 top-0 invisible",
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: inputRef,
            id,
            name,
            type,
            value,
            required,
            onChange: handleChange,
            onFocus: () => setIsFocused(true),
            onBlur: () => {
              setIsFocused(false);
              caretOpacity.set(0);
            },
            placeholder,
            disabled,
            style: { caretColor: "transparent" },
            className: `w-full bg-surface border border-line rounded-xl py-2.5 ${Icon ? "pl-10 " : "pl-3.5 "}pr-3.5 text-sm font-medium text-ink placeholder-ink-muted outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${inputClassName}`,
            ...props
          }
        ),
        /* @__PURE__ */ jsx(
          motion.div,
          {
            "aria-hidden": "true",
            className: `absolute left-0 w-[2px] rounded-full pointer-events-none ${caretColor}`,
            style: {
              x: springX,
              opacity: caretOpacity,
              height: caretHeight,
              boxShadow: "0 0 8px rgba(11,170,143,0.6)"
            }
          }
        )
      ]
    }
  );
}
function useDictation({ locale, onText, onFinal } = {}) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(
    () => typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const recRef = useRef(null);
  const baseRef = useRef("");
  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch (e) {
    }
    setListening(false);
  }, []);
  const start = useCallback((currentValue = "") => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    try {
      recRef.current?.abort();
    } catch (e) {
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = locale === "ur" ? "ur-PK" : locale === "hi" ? "hi-IN" : locale === "ar" ? "ar-SA" : "en-US";
    baseRef.current = currentValue ? `${currentValue} ` : "";
    rec.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      const merged = (baseRef.current + text).trimStart();
      onText?.(merged);
      if (event.results[event.results.length - 1].isFinal) onFinal?.(merged);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch (e) {
      setListening(false);
    }
  }, [locale, onText, onFinal]);
  const toggle = useCallback((currentValue = "") => {
    if (listening) stop();
    else start(currentValue);
  }, [listening, start, stop]);
  useEffect(() => () => {
    try {
      recRef.current?.abort();
    } catch (e) {
    }
  }, []);
  return { listening, supported, start, stop, toggle };
}
const SUGGESTION_GROUPS = [
  {
    id: "sales",
    label: "Sales",
    items: [
      { prompt: "sales today", label: "Today's sales" },
      { prompt: "sales this week", label: "Sales this week" },
      { prompt: "sales this month vs last month", label: "This month vs last month" },
      { prompt: "best selling products", label: "Best selling products" },
      { prompt: "sales by branch", label: "Sales by branch" },
      { prompt: "average order value", label: "Average order value" }
    ]
  },
  {
    id: "money",
    label: "Money",
    items: [
      { prompt: "profit this month", label: "Profit this month" },
      { prompt: "cash in hand", label: "Cash in hand" },
      { prompt: "expenses this month", label: "Expenses this month" },
      { prompt: "receivables", label: "Customer receivables" },
      { prompt: "payables", label: "Supplier payables" },
      { prompt: "tax collected this month", label: "Tax collected" }
    ]
  },
  {
    id: "stock",
    label: "Stock",
    items: [
      { prompt: "low stock", label: "Low stock items" },
      { prompt: "out of stock items", label: "Out of stock" },
      { prompt: "total stock value", label: "Total stock value" },
      { prompt: "dead stock", label: "Dead stock" },
      { prompt: "items expiring soon", label: "Expiring soon" },
      { prompt: "stock by warehouse", label: "Stock by warehouse" }
    ]
  },
  {
    id: "people",
    label: "Customers",
    items: [
      { prompt: "top customers", label: "Top customers" },
      { prompt: "customers who have not bought in 60 days", label: "Inactive customers" },
      { prompt: "new customers this month", label: "New customers this month" },
      { prompt: "customer balances", label: "Customer balances" }
    ]
  },
  {
    id: "ops",
    label: "Operations",
    items: [
      { prompt: "purchases this month", label: "Purchases this month" },
      { prompt: "pending purchase orders", label: "Pending purchase orders" },
      { prompt: "invoices due this week", label: "Invoices due this week" },
      { prompt: "held orders", label: "Held orders" },
      { prompt: "staff attendance today", label: "Staff attendance today" }
    ]
  }
];
const ALL_SUGGESTIONS = SUGGESTION_GROUPS.flatMap(
  (g) => g.items.map((i) => ({ ...i, group: g.label, groupId: g.id }))
);
const buildSuggestionFeed = (recent = [], tt = (s) => s) => {
  const seen = /* @__PURE__ */ new Set();
  const feed = [];
  recent.forEach((r) => {
    const key = r.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    feed.push({ prompt: r, label: r, group: "Recent", groupId: "recent", recent: true });
  });
  ALL_SUGGESTIONS.forEach((s) => {
    const key = s.prompt.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    feed.push({ ...s, label: tt(s.label), group: tt(s.group) });
  });
  return feed;
};
const SmartCapturePanel = React.lazy(() => import("./SmartCapturePanel-DWJ8Nvcj.js"));
const ChatWidget = React.lazy(() => import("./ChatWidget-91hOmjPv.js"));
const STORAGE_RECENT_QUERIES = "venqore_island_recent_queries";
const STORAGE_SOUND_ENABLED = "venqore_island_sound_enabled";
const STORAGE_READ_ALERTS = "venqore_island_read_alert_ids";
const getScopedStorageKey = (baseKey, storeSlug, userId) => {
  const storeKey = storeSlug || "global";
  const userKey = userId ? `u${userId}` : "anon";
  return `${baseKey}.${storeKey}.${userKey}`;
};
const T = {
  eyebrow: { fontSize: 12, lineHeight: 1.2, letterSpacing: "0.12em", fontWeight: 600, textTransform: "uppercase" },
  caption: { fontSize: 14, lineHeight: 1.45 },
  // FLOOR
  small: { fontSize: 15, lineHeight: 1.5 },
  // list rows
  body: { fontSize: 17, lineHeight: 1.6, letterSpacing: "-0.002em" }
};
const CONTROL_H = 44;
const MODES = {
  rest: { w: 420, h: CONTROL_H },
  // A bare circle reads as a dot of chrome nobody knows to press. The collapsed
  // full-screen island is a labelled pill — small enough to ignore over a POS
  // screen, legible enough to be an offer.
  orb: { w: 154, h: CONTROL_H },
  orbHover: { w: 340, h: CONTROL_H },
  working: { w: 340, h: CONTROL_H },
  alert: { w: 470, h: 84 },
  open: { w: 760, h: 600 }
};
const ORB_FOR = {
  idle: "breathing",
  search: "searching",
  compute: "solving",
  sync: "connecting",
  chat: "listening",
  growth: "weaving",
  capture: "shaping",
  compose: "composing"
};
const TABS = [
  { id: "ask", label: "Ask Vena", icon: Sparkles, orb: "compute", mesh: "var(--vq-mesh-vena)", accent: "#59DBC0", sub: "Ask anything about this store" },
  { id: "chat", label: "Support", icon: MessageSquare, orb: "chat", mesh: "var(--vq-mesh-support)", accent: "#8FD9F5", sub: "Talk to the VenQore team" },
  { id: "growth", label: "Growth", icon: Zap, orb: "growth", mesh: "var(--vq-mesh-growth)", accent: "#E0B4E0", sub: "Opportunities found for you" },
  { id: "alerts", label: "Alerts", icon: Bell, orb: "idle", mesh: "var(--vq-mesh-alerts)", accent: "#FFDD8E", sub: "Everything needing attention" },
  { id: "capture", label: "Capture", icon: ScanLine, orb: "capture", mesh: "var(--vq-mesh-capture)", accent: "#93EBD6", sub: "Scan a document into your records" }
];
const TAB = Object.fromEntries(TABS.map((t) => [t.id, t]));
const INK = "rgba(241,245,242,";
const playIslandHaptic = (type = "pop", soundEnabled = true) => {
  if (!soundEnabled || typeof window === "undefined") return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    const ramp = (f0, f1, g, dur, wave = "sine") => {
      osc.type = wave;
      osc.frequency.setValueAtTime(f0, t);
      if (f1) osc.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.55);
      gain.gain.setValueAtTime(g, t);
      gain.gain.exponentialRampToValueAtTime(1e-4, t + dur);
      osc.start(t);
      osc.stop(t + dur);
    };
    if (type === "ring" || type === "alert") ramp(880, 1175, 0.14, 0.28);
    else if (type === "pop") ramp(440, 780, 0.09, 0.12);
    else if (type === "click") ramp(360, null, 0.045, 0.04);
    else if (type === "dismiss") ramp(260, 130, 0.07, 0.15);
    else if (type === "success") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, t);
      osc.frequency.setValueAtTime(659.25, t + 0.08);
      osc.frequency.setValueAtTime(783.99, t + 0.16);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(1e-4, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.35);
    } else ramp(420, null, 0.04, 0.05);
  } catch (e) {
  }
};
const Pane = ({ children }) => /* @__PURE__ */ jsx(
  motion.div,
  {
    variants: contentVariants,
    initial: "initial",
    animate: "animate",
    exit: "exit",
    className: "absolute inset-0",
    children
  }
);
const PaneShell = ({ tab, orbState, paused, right, children, flush = false }) => {
  const meta = TAB[tab];
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "h-full min-h-0 flex flex-col overflow-hidden",
      style: { background: meta.mesh, borderRadius: 20 },
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex items-center gap-3 px-4 py-3 shrink-0",
            style: { borderBottom: `1px solid ${INK}.08)` },
            children: [
              /* @__PURE__ */ jsx("span", { className: "grid place-items-center shrink-0", style: { width: 30, height: 30 }, children: /* @__PURE__ */ jsx(ThinkingOrb, { state: orbState || meta.orb, size: 28, theme: "dark", paused }) }),
              /* @__PURE__ */ jsxs("span", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("span", { className: "block truncate", style: { ...T.body, fontWeight: 700, color: "#F1F5F2" }, children: meta.label }),
                /* @__PURE__ */ jsx("span", { className: "block truncate", style: { ...T.caption, color: `${INK}.60)` }, children: meta.sub })
              ] }),
              right
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: `flex-1 min-h-0 overflow-y-auto custom-scrollbar ${flush ? "" : "p-3"}`, children })
      ]
    }
  );
};
const withHeaders = (feed) => {
  let last = null;
  return feed.map((item) => {
    const header = item.group === last ? null : item.group;
    last = item.group;
    return { ...item, header };
  });
};
const SuggestionList = ({ feed, onPick, accent = "#59DBC0" }) => {
  const rows = withHeaders(feed);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "h-full min-h-0 overflow-y-auto custom-scrollbar",
      style: {
        maskImage: "linear-gradient(to bottom, transparent, #000 14px, #000 calc(100% - 14px), transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 14px, #000 calc(100% - 14px), transparent)"
      },
      children: /* @__PURE__ */ jsx(motion.div, { variants: listVariants, initial: "initial", animate: "animate", className: "space-y-1.5 py-2", children: rows.map((item, i) => {
        const header = item.header;
        return /* @__PURE__ */ jsxs(React.Fragment, { children: [
          header && /* @__PURE__ */ jsx(
            motion.p,
            {
              variants: itemVariants,
              className: "px-1 pt-2 pb-1",
              style: { ...T.eyebrow, color: `${INK}.42)` },
              children: header
            }
          ),
          /* @__PURE__ */ jsxs(
            motion.button,
            {
              variants: itemVariants,
              type: "button",
              onClick: () => onPick(item.prompt),
              whileHover: { x: 3 },
              transition: { type: "spring", stiffness: 520, damping: 34 },
              className: "w-full flex items-center gap-3 p-3 rounded-2xl text-left group",
              style: { background: `${INK}.05)` },
              children: [
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: "grid place-items-center shrink-0 rounded-xl",
                    style: { width: 32, height: 32, background: `${INK}.06)`, color: accent },
                    children: item.recent ? /* @__PURE__ */ jsx(Clock, { size: 15 }) : /* @__PURE__ */ jsx(Search, { size: 15 })
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "flex-1 min-w-0 truncate", style: { ...T.small, fontWeight: 600, color: `${INK}.9)` }, children: item.label }),
                /* @__PURE__ */ jsx(ArrowRight, { size: 15, className: "opacity-0 group-hover:opacity-100 shrink-0", style: { color: accent } })
              ]
            }
          )
        ] }, `${item.groupId}-${item.prompt}-${i}`);
      }) })
    }
  );
};
function AiIsland({
  onAskAi,
  isAiLoading = false,
  compact = false,
  // full-screen pages: orb-only until hovered
  extraAlerts = []
}) {
  const { auth, store, growth_engine, vensynq_enabled } = usePage().props;
  const { isDark: appearanceIsDark } = useAppearance() || { isDark: true };
  const { isDarkMode: themeIsDark } = useTheme() || { isDarkMode: true };
  const { activeInvoices, currentInvoiceId } = useWorkspace() || {};
  const [mode, setMode] = useState("rest");
  const [tab, setTab] = useState("ask");
  const [activity, setActivity] = useState("idle");
  const [workingLabel, setWorkingLabel] = useState("");
  const [hovered, setHovered] = useState(false);
  const [captureTab, setCaptureTab] = useState("image");
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE_SOUND_ENABLED);
      return v !== null ? v === "true" : true;
    } catch {
      return true;
    }
  });
  const [query, setQuery] = useState("");
  const [dbResults, setDbResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(null);
  const [isAiAnswering, setIsAiAnswering] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [notifications, setNotifications] = useState({ unread_count: 0, critical_count: 0, latest: [] });
  const [activeNotification, setActiveNotification] = useState(null);
  const [alertCountdown, setAlertCountdown] = useState(100);
  const [isHoveringAlert, setIsHoveringAlert] = useState(false);
  const recentStorageKey = useMemo(
    () => getScopedStorageKey(STORAGE_RECENT_QUERIES, store?.slug, auth?.user?.id),
    [store?.slug, auth?.user?.id]
  );
  const alertsStorageKey = useMemo(
    () => getScopedStorageKey(STORAGE_READ_ALERTS, store?.slug, auth?.user?.id),
    [store?.slug, auth?.user?.id]
  );
  const [recentQueries, setRecentQueries] = useState(() => {
    try {
      const key = getScopedStorageKey(STORAGE_RECENT_QUERIES, store?.slug, auth?.user?.id);
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      setRecentQueries(JSON.parse(localStorage.getItem(recentStorageKey) || "[]"));
    } catch {
      setRecentQueries([]);
    }
  }, [recentStorageKey]);
  const [orbPaused, setOrbPaused] = useState(
    () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)
  );
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const sync = () => setOrbPaused(Boolean(mq?.matches) || document.hidden);
    document.addEventListener("visibilitychange", sync);
    mq?.addEventListener?.("change", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      mq?.removeEventListener?.("change", sync);
    };
  }, []);
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1440);
  const [vh, setVh] = useState(typeof window !== "undefined" ? window.innerHeight : 900);
  useEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isOpen = mode === "open";
  const userRole = auth?.user?.role;
  const userPerms = useMemo(() => auth?.user?.permissions || [], [auth?.user?.permissions]);
  const isFullAccess = ["owner", "admin", "manager", "platform_admin"].includes(userRole);
  const canUseSmartCapture = vensynq_enabled && (isFullAccess || userPerms.some((p) => /^(pos|sales|purchases)/.test(p)));
  const target = useMemo(() => {
    if (mode === "open") {
      if (tab === "capture") {
        return { w: Math.min(vw * 0.92, 1480), h: vh * 0.92 };
      }
      return MODES.open;
    }
    if (mode === "rest" && compact) return hovered ? MODES.orbHover : MODES.orb;
    return MODES[mode] || MODES.rest;
  }, [mode, tab, compact, hovered, vw, vh]);
  const width = Math.min(target.w, vw - 48);
  const height = Math.min(target.h, vh - 88);
  const restBase = compact ? MODES.orb : MODES.rest;
  const restWidth = Math.min(restBase.w, vw - 48);
  const restHeight = restBase.h;
  const tone = mode === "alert" ? activeNotification?.severity === "critical" ? "danger" : "warning" : isOpen || mode === "working" ? "accent" : "neutral";
  const haptic = useCallback((t) => playIslandHaptic(t, soundEnabled), [soundEnabled]);
  const toggleSound = (e) => {
    e?.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem(STORAGE_SOUND_ENABLED, String(next));
    } catch {
    }
    if (next) playIslandHaptic("pop", true);
  };
  const openIsland = useCallback((nextTab) => {
    haptic("pop");
    if (nextTab) setTab(nextTab);
    setMode("open");
    setTimeout(() => document.getElementById("ai-island-input")?.focus(), 240);
  }, [haptic]);
  const closeIsland = useCallback(() => {
    haptic("dismiss");
    setMode("rest");
    setQuery("");
    setDbResults([]);
    setAiAnswer(null);
    setIsSearchingDb(false);
    setIsAiAnswering(false);
    setActivity("idle");
  }, [haptic]);
  const openCapture = useCallback((which = "image") => {
    haptic("pop");
    setCaptureTab(which);
    setTab("capture");
    setMode("open");
  }, [haptic]);
  const isUserTransacting = useCallback(() => {
    if (typeof window === "undefined") return false;
    const p = window.location.pathname;
    if (/\/(pos|sales\/create|purchases\/create)/.test(p)) return true;
    if (activeInvoices && Object.keys(activeInvoices).length > 0 && currentInvoiceId) return true;
    const el = document.activeElement;
    if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) && el.id !== "ai-island-input") return true;
    return false;
  }, [activeInvoices, currentInvoiceId]);
  const raiseAlert = useCallback((n) => {
    if (!n) return;
    setActiveNotification(n);
    setAlertCountdown(100);
    haptic("ring");
    setMode("alert");
  }, [haptic]);
  const fetchNotifications = useCallback(() => {
    if (!store?.slug && !auth?.user) return;
    const summaryUrl = store?.slug ? `/s/${store.slug}/api/notifications/summary` : "/api/notifications/summary";
    window.axios?.get(summaryUrl).then((res) => {
      if (!res.data) return;
      setNotifications(res.data);
      const top = res.data.latest?.find((n) => !n.read_at && ["critical", "important"].includes(n.severity));
      if (top && !isUserTransacting() && mode === "rest") raiseAlert(top);
    }).catch(() => {
    });
  }, [store?.slug, auth?.user, isUserTransacting, mode, raiseAlert]);
  useEffect(() => {
    fetchNotifications();
    const i = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        fetchNotifications();
      }
    }, 35e3);
    return () => clearInterval(i);
  }, [fetchNotifications]);
  useEffect(() => {
    const onAlert = (e) => {
      if (e.detail && !isUserTransacting() && mode !== "open") raiseAlert(e.detail);
    };
    const onSync = (e) => {
      if (e.detail && !isUserTransacting()) raiseAlert({
        id: "sync-complete",
        title: "Sync Complete",
        message: e.detail.message || "All channels in sync.",
        severity: "info"
      });
    };
    window.addEventListener("venqore-island-alert", onAlert);
    window.addEventListener("venqore-island-sync", onSync);
    return () => {
      window.removeEventListener("venqore-island-alert", onAlert);
      window.removeEventListener("venqore-island-sync", onSync);
    };
  }, [mode, isUserTransacting, raiseAlert]);
  useEffect(() => {
    let t;
    if (mode === "alert" && !isHoveringAlert) {
      t = setInterval(() => {
        setAlertCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(t);
            setMode("rest");
            setActiveNotification(null);
            return 100;
          }
          return prev - 2;
        });
      }, 80);
    }
    return () => clearInterval(t);
  }, [mode, isHoveringAlert]);
  const dismissAlert = (e) => {
    e?.stopPropagation();
    haptic("dismiss");
    setActiveNotification(null);
    setMode("rest");
  };
  const ambient = useMemo(() => {
    const l = [];
    if (growth_engine?.popup?.description) l.push(growth_engine.popup.description);
    else if (growth_engine?.count > 0) l.push(`${growth_engine.count} growth recommendations ready`);
    l.push("Ask Vena anything about your store");
    l.push('Try "sales today", "low stock", "profit this month"');
    return l;
  }, [growth_engine]);
  useEffect(() => {
    if (mode !== "rest") return;
    const i = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        setTickerIndex((p) => (p + 1) % ambient.length);
      }
    }, 6500);
    return () => clearInterval(i);
  }, [ambient.length, mode]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && /^[kKfF]$/.test(e.key)) {
        e.preventDefault();
        if (isOpen) closeIsland();
        else openIsland("ask");
      }
      if (e.key === "Escape" && isOpen) closeIsland();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, openIsland, closeIsland]);
  const checkPerm = useCallback((req) => {
    if (userRole === "platform_admin") return true;
    if (!req || req.length === 0) return isFullAccess;
    return req.some((p) => userPerms.includes(p));
  }, [userRole, isFullAccess, userPerms]);
  const getRequiredPerms = useCallback((item) => {
    const r = item.route || "";
    if (r.includes("pos")) return ["pos"];
    if (/inventory|production/.test(r)) return ["inventory"];
    if (r.includes("sales")) return ["sales", "sales_view"];
    if (/reports|finance/.test(r)) return ["reports", "finance"];
    if (r.includes("settings")) return ["settings"];
    if (/parties|customer/.test(r)) return ["customers"];
    return [];
  }, []);
  const results = useMemo(() => {
    if (!query?.trim()) return [];
    return searchRegistry(query.trim()).filter((i) => checkPerm(getRequiredPerms(i)));
  }, [query, checkPerm, getRequiredPerms]);
  useEffect(() => {
    if (!query || query.trim().length < 2 || !store?.slug) return;
    const q = query.trim();
    const t = setTimeout(() => {
      setActivity("search");
      setIsSearchingDb(true);
      window.axios?.get(route("store.global.search", { store_slug: store.slug }), { params: { query: q } }).then((res) => setDbResults(res.data || [])).catch(() => setDbResults([])).finally(() => {
        setIsSearchingDb(false);
        setActivity("idle");
      });
    }, 240);
    return () => clearTimeout(t);
  }, [query, store?.slug]);
  const saveRecent = (text) => {
    if (!text?.trim()) return;
    const next = [text, ...recentQueries.filter((q) => q.toLowerCase() !== text.toLowerCase())].slice(0, 6);
    setRecentQueries(next);
    try {
      localStorage.setItem(recentStorageKey, JSON.stringify(next));
    } catch {
    }
  };
  const askVena = (text) => {
    if (!store?.slug || !text?.trim()) return;
    haptic("click");
    setIsAiAnswering(true);
    setActivity("compute");
    setAiAnswer(null);
    saveRecent(text);
    if (onAskAi) onAskAi(text);
    window.axios?.get(route("store.ai.query", { store_slug: store.slug }), { params: { query: text } }).then((res) => {
      const d = res.data || {};
      const body = d.response || d.answer || d.summary;
      if (body) {
        setAiAnswer({ text: body, records: d.records || [] });
        haptic("success");
      }
    }).catch((err) => console.error("Island AI error:", err)).finally(() => {
      setIsAiAnswering(false);
      setActivity("idle");
    });
  };
  const navigateToItem = (item) => {
    try {
      haptic("pop");
      const name = item.route.startsWith("store.") ? item.route : `store.${item.route}`;
      router.visit(route(name, { ...item.queryParams, store_slug: store?.slug }));
      closeIsland();
    } catch {
      closeIsland();
    }
  };
  const totalSelectable = results.length + dbResults.length;
  const onInputKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      haptic("click");
      setSelectedIndex((p) => (p + 1) % Math.max(1, totalSelectable));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      haptic("click");
      setSelectedIndex((p) => (p - 1 + totalSelectable) % Math.max(1, totalSelectable));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) return navigateToItem(results[selectedIndex]);
      const db = dbResults[selectedIndex - results.length];
      if (db?.url) {
        haptic("pop");
        router.visit(db.url);
        return closeIsland();
      }
      if (query.trim().length > 1) askVena(query.trim());
    }
  };
  const dictation = useDictation({
    locale: store?.locale,
    onText: setQuery,
    onFinal: (text) => {
      if (text?.trim()) saveRecent(text.trim());
    }
  });
  const startDictation = useCallback(() => {
    haptic("click");
    if (mode !== "open" || tab !== "ask") {
      setTab("ask");
      setMode("open");
    }
    setTimeout(() => dictation.toggle(query), mode === "open" ? 0 : 260);
  }, [dictation, haptic, mode, tab, query]);
  const suggestionFeed = useMemo(() => buildSuggestionFeed(recentQueries), [recentQueries]);
  const busy = isAiAnswering || isSearchingDb || isAiLoading;
  const orbState = dictation.listening ? ORB_FOR.chat : ORB_FOR[busy ? isAiAnswering ? "compute" : "search" : activity] || ORB_FOR.idle;
  const [readAlertIds, setReadAlertIds] = useState(() => {
    try {
      const key = getScopedStorageKey(STORAGE_READ_ALERTS, store?.slug, auth?.user?.id);
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      setReadAlertIds(JSON.parse(localStorage.getItem(alertsStorageKey) || "[]"));
    } catch {
      setReadAlertIds([]);
    }
  }, [alertsStorageKey]);
  const toggleAlertRead = useCallback((id) => {
    setReadAlertIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(alertsStorageKey, JSON.stringify(next));
      } catch (e) {
      }
      return next;
    });
  }, [alertsStorageKey]);
  const allAlerts = useMemo(
    () => [...extraAlerts || [], ...notifications.latest || []],
    [extraAlerts, notifications.latest]
  );
  const toggleMarkAllAlerts = useCallback(() => {
    const allIds = allAlerts.map((n, i) => String(n.id || `alert-${i}`));
    const hasUnread = allIds.some((id) => !readAlertIds.includes(id));
    const next = hasUnread ? Array.from(/* @__PURE__ */ new Set([...readAlertIds, ...allIds])) : [];
    setReadAlertIds(next);
    try {
      localStorage.setItem(alertsStorageKey, JSON.stringify(next));
    } catch (e) {
    }
  }, [allAlerts, readAlertIds, alertsStorageKey]);
  const unread = useMemo(() => {
    return allAlerts.filter((n, i) => !readAlertIds.includes(String(n.id || `alert-${i}`))).length;
  }, [allAlerts, readAlertIds]);
  const badge = unread > 0 && /* @__PURE__ */ jsx(
    motion.span,
    {
      initial: { scale: 0.5, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { type: "spring", stiffness: 600, damping: 24 },
      className: "grid place-items-center shrink-0",
      style: {
        ...T.caption,
        fontWeight: 700,
        height: 22,
        minWidth: 22,
        padding: "0 7px",
        borderRadius: 999,
        background: "#23C4A6",
        color: "#062421"
      },
      children: unread > 99 ? "99+" : unread
    }
  );
  const iconBtn = (onClick, title, children, accent) => /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick,
      title,
      "aria-label": title,
      className: "grid place-items-center shrink-0 rounded-xl",
      style: {
        width: 34,
        height: 34,
        color: accent || `${INK}.6)`,
        background: `${INK}.06)`,
        transition: "background 120ms var(--vq-ease-out)"
      },
      children
    }
  );
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(
    IslandShell,
    {
      width,
      height,
      restWidth,
      restHeight,
      isOpen,
      isAlert: mode === "alert",
      tone,
      sheen: !isOpen,
      onScrimClick: closeIsland,
      onHoverChange: setHovered,
      slotClassName: "shrink-0",
      ariaLabel: "VenQore AI and notifications",
      children: /* @__PURE__ */ jsxs(AnimatePresence, { mode: "wait", initial: false, children: [
        mode === "rest" && /* @__PURE__ */ jsx(Pane, { children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: "w-full h-full flex items-center gap-2",
            style: { padding: compact && !hovered ? "0 14px" : "0 8px 0 14px" },
            children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => openIsland("ask"),
                  className: "flex-1 min-w-0 h-full flex items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#23C4A6]/60 rounded-xl",
                  "aria-label": "Open VenQore AI",
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "shrink-0 grid place-items-center", style: { width: 26, height: 26 }, children: /* @__PURE__ */ jsx(ThinkingOrb, { state: orbState, size: 24, theme: "dark", paused: orbPaused }) }),
                    compact ? /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", initial: false, children: /* @__PURE__ */ jsx(
                      motion.span,
                      {
                        initial: { opacity: 0, y: 5, filter: "blur(3px)" },
                        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
                        exit: { opacity: 0, y: -5, filter: "blur(3px)" },
                        transition: { duration: DUR.d2, ease: EASE_OUT },
                        className: "flex-1 min-w-0 truncate",
                        style: { ...T.small, fontWeight: 600, color: `${INK}${hovered ? ".72)" : ".88)"}` },
                        children: hovered ? "Ask Vena anything, or scan a document" : "Ask Vena"
                      },
                      hovered ? "open" : "idle"
                    ) }) : /* @__PURE__ */ jsx("span", { className: "flex-1 min-w-0 overflow-hidden", children: /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: /* @__PURE__ */ jsx(
                      motion.span,
                      {
                        initial: { opacity: 0, y: 7, filter: "blur(3px)" },
                        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
                        exit: { opacity: 0, y: -7, filter: "blur(3px)" },
                        transition: { duration: DUR.d3, ease: EASE_OUT },
                        className: "block truncate",
                        style: { ...T.small, color: `${INK}.78)` },
                        children: ambient[tickerIndex]
                      },
                      tickerIndex
                    ) }) })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(AnimatePresence, { initial: false, children: !(compact && !hovered) && /* @__PURE__ */ jsxs(
                motion.span,
                {
                  initial: { opacity: 0, scale: 0.8, width: 0 },
                  animate: { opacity: 1, scale: 1, width: "auto" },
                  exit: { opacity: 0, scale: 0.8, width: 0 },
                  transition: { duration: DUR.d2, ease: EASE_OUT },
                  className: "flex items-center gap-1.5 shrink-0 overflow-hidden",
                  children: [
                    badge,
                    dictation.supported && /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: (e) => {
                          e.stopPropagation();
                          startDictation();
                        },
                        className: "grid place-items-center shrink-0 rounded-xl",
                        style: {
                          width: 32,
                          height: 32,
                          background: dictation.listening ? "#23C4A6" : `${INK}.07)`,
                          color: dictation.listening ? "#062421" : `${INK}.62)`,
                          transition: "background 120ms var(--vq-ease-out), color 120ms var(--vq-ease-out)"
                        },
                        title: "Speak your question",
                        "aria-label": "Speak your question",
                        children: /* @__PURE__ */ jsx(Mic, { size: 16 })
                      }
                    ),
                    canUseSmartCapture && /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: (e) => {
                          e.stopPropagation();
                          openCapture("image");
                        },
                        className: "grid place-items-center shrink-0 rounded-xl",
                        style: { width: 32, height: 32, background: `${INK}.07)`, color: `${INK}.62)` },
                        title: "Scan a document",
                        "aria-label": "Scan a document",
                        children: /* @__PURE__ */ jsx(Camera, { size: 16 })
                      }
                    )
                  ]
                },
                "pill-actions"
              ) })
            ]
          }
        ) }, "rest"),
        mode === "working" && /* @__PURE__ */ jsx(Pane, { children: /* @__PURE__ */ jsxs("div", { className: "w-full h-full flex items-center gap-3 px-4", children: [
          /* @__PURE__ */ jsx("span", { className: "shrink-0 grid place-items-center", style: { width: 26, height: 26 }, children: /* @__PURE__ */ jsx(ThinkingOrb, { state: ORB_FOR[activity] || "connecting", size: 24, theme: "dark", paused: orbPaused }) }),
          /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", style: { ...T.small, fontWeight: 600, color: `${INK}.92)` }, children: workingLabel || "Working" })
        ] }) }, "working"),
        mode === "alert" && /* @__PURE__ */ jsx(Pane, { children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: "w-full h-full flex flex-col justify-between px-4 py-3",
            onMouseEnter: () => setIsHoveringAlert(true),
            onMouseLeave: () => setIsHoveringAlert(false),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx(
                  motion.span,
                  {
                    initial: { scale: 0.6, rotate: -12 },
                    animate: { scale: 1, rotate: 0 },
                    transition: { type: "spring", stiffness: 520, damping: 26 },
                    className: "grid place-items-center shrink-0 rounded-2xl",
                    style: {
                      width: 38,
                      height: 38,
                      background: activeNotification?.severity === "critical" ? "rgba(255,138,107,.16)" : "rgba(255,205,91,.16)",
                      color: activeNotification?.severity === "critical" ? "#FFAE96" : "#FFDD8E"
                    },
                    children: activeNotification?.severity === "critical" ? /* @__PURE__ */ jsx(AlertCircle, { size: 19 }) : /* @__PURE__ */ jsx(AlertTriangle, { size: 19 })
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("p", { className: "truncate", style: { ...T.small, fontWeight: 700, color: "#F1F5F2" }, children: activeNotification?.title || "Store alert" }),
                  /* @__PURE__ */ jsx("p", { className: "truncate", style: { ...T.caption, color: `${INK}.65)` }, children: activeNotification?.message || activeNotification?.desc || "Action required in your store." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
                  activeNotification?.action_url ? /* @__PURE__ */ jsx(
                    Link,
                    {
                      href: activeNotification.action_url,
                      onClick: () => setMode("rest"),
                      className: "rounded-xl",
                      style: { ...T.caption, fontWeight: 700, padding: "8px 14px", background: "#23C4A6", color: "#062421" },
                      children: activeNotification.action_text || "View"
                    }
                  ) : /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => openIsland("alerts"),
                      className: "rounded-xl",
                      style: { ...T.caption, fontWeight: 700, padding: "8px 14px", background: "#23C4A6", color: "#062421" },
                      children: "Review"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: dismissAlert,
                      className: "grid place-items-center rounded-lg",
                      style: { width: 30, height: 30, color: `${INK}.55)` },
                      "aria-label": "Dismiss alert",
                      children: /* @__PURE__ */ jsx(X, { size: 17 })
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-full rounded-full overflow-hidden", style: { height: 3, background: `${INK}.12)` }, children: /* @__PURE__ */ jsx(
                motion.div,
                {
                  className: "h-full rounded-full",
                  animate: { width: `${alertCountdown}%` },
                  transition: { duration: 0.08, ease: "linear" },
                  style: { background: activeNotification?.severity === "critical" ? "#FF8A6B" : "#FFCD5B" }
                }
              ) })
            ]
          }
        ) }, "alert"),
        mode === "open" && /* @__PURE__ */ jsx(Pane, { children: /* @__PURE__ */ jsxs("div", { className: "w-full h-full flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-4 pt-4 pb-3 shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto custom-scrollbar", children: TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              const count = t.id === "alerts" ? unread : t.id === "growth" ? growth_engine?.count || 0 : 0;
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    setTab(t.id);
                    haptic("click");
                  },
                  className: "relative flex items-center gap-2 rounded-xl shrink-0",
                  style: {
                    ...T.caption,
                    fontWeight: 700,
                    padding: "9px 14px",
                    color: active ? "#062421" : `${INK}.66)`
                  },
                  children: [
                    active && /* @__PURE__ */ jsx(
                      motion.span,
                      {
                        layoutId: "island-tab",
                        className: "absolute inset-0 rounded-xl",
                        style: { background: "#23C4A6" },
                        transition: { type: "spring", stiffness: 480, damping: 36 }
                      }
                    ),
                    /* @__PURE__ */ jsxs("span", { className: "relative flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(Icon, { size: 15 }),
                      /* @__PURE__ */ jsx("span", { children: t.label }),
                      count > 0 && /* @__PURE__ */ jsx(
                        "span",
                        {
                          className: "rounded-full",
                          style: {
                            ...T.eyebrow,
                            letterSpacing: 0,
                            padding: "1px 6px",
                            background: active ? "rgba(6,36,33,.22)" : "rgba(35,196,166,.22)",
                            color: active ? "#062421" : "#59DBC0"
                          },
                          children: count
                        }
                      )
                    ] })
                  ]
                },
                t.id
              );
            }) }),
            iconBtn(
              toggleSound,
              soundEnabled ? "Mute island sounds" : "Enable island sounds",
              soundEnabled ? /* @__PURE__ */ jsx(Volume2, { size: 17 }) : /* @__PURE__ */ jsx(VolumeX, { size: 17 })
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: closeIsland,
                className: "rounded-xl shrink-0",
                style: {
                  ...T.caption,
                  fontWeight: 700,
                  padding: "8px 13px",
                  background: `${INK}.08)`,
                  color: `${INK}.65)`
                },
                children: "ESC"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 px-4 pb-4", children: /* @__PURE__ */ jsxs(AnimatePresence, { mode: "wait", initial: false, children: [
            tab === "ask" && /* @__PURE__ */ jsx(motion.div, { variants: contentVariants, initial: "initial", animate: "animate", exit: "exit", className: "h-full", children: /* @__PURE__ */ jsx(
              PaneShell,
              {
                tab: "ask",
                orbState,
                paused: orbPaused,
                flush: true,
                right: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
                  canUseSmartCapture && iconBtn(() => openCapture("image"), "Scan a document", /* @__PURE__ */ jsx(Camera, { size: 17 }), "#93EBD6"),
                  canUseSmartCapture && iconBtn(() => openCapture("audio"), "Speak a transaction", /* @__PURE__ */ jsx(Mic, { size: 17 }), "#93EBD6")
                ] }),
                children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full min-h-0", children: [
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: "flex items-center gap-3 px-4 shrink-0",
                      style: { height: 60, borderBottom: `1px solid ${INK}.08)` },
                      children: [
                        /* @__PURE__ */ jsx(Search, { size: 19, style: { color: `${INK}.5)`, flex: "none" } }),
                        /* @__PURE__ */ jsx(
                          SmoothCaretInput,
                          {
                            id: "ai-island-input",
                            value: query,
                            onChange: (e) => setQuery(e.target.value),
                            onKeyDown: onInputKey,
                            placeholder: dictation.listening ? "Listening…" : "Ask Vena, or search screens and records…",
                            autoComplete: "off",
                            caretColor: "bg-[#23C4A6]",
                            className: "flex-1 min-w-0",
                            inputClassName: "!bg-transparent !border-0 !rounded-none !px-0 !py-0 !text-[17px] !leading-[1.6] !font-medium !text-[#F1F5F2] placeholder:!text-[rgba(241,245,242,0.42)] focus:!ring-0 focus:!border-transparent"
                          }
                        ),
                        dictation.supported && /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => dictation.toggle(query),
                            className: "grid place-items-center shrink-0 rounded-xl",
                            style: {
                              width: 36,
                              height: 36,
                              background: dictation.listening ? "#23C4A6" : `${INK}.06)`,
                              color: dictation.listening ? "#062421" : `${INK}.62)`,
                              transition: "background 120ms var(--vq-ease-out), color 120ms var(--vq-ease-out)"
                            },
                            title: dictation.listening ? "Stop listening" : "Speak your question",
                            "aria-label": dictation.listening ? "Stop listening" : "Speak your question",
                            children: dictation.listening ? /* @__PURE__ */ jsx(
                              motion.span,
                              {
                                animate: { scale: [1, 1.18, 1] },
                                transition: { duration: 1.1, repeat: Infinity, ease: "easeInOut" },
                                className: "grid place-items-center",
                                children: /* @__PURE__ */ jsx(Mic, { size: 17 })
                              }
                            ) : /* @__PURE__ */ jsx(Mic, { size: 17 })
                          }
                        ),
                        query && /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => {
                              setQuery("");
                              setAiAnswer(null);
                            },
                            className: "grid place-items-center shrink-0",
                            style: { width: 30, height: 30, color: `${INK}.5)` },
                            "aria-label": "Clear search",
                            children: /* @__PURE__ */ jsx(X, { size: 18 })
                          }
                        )
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 space-y-2.5", children: [
                    aiAnswer && /* @__PURE__ */ jsxs(
                      motion.div,
                      {
                        initial: { opacity: 0, y: 10 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: DUR.d3, ease: EASE_OUT },
                        className: "p-4 rounded-2xl",
                        style: { background: "rgba(35,196,166,.12)", boxShadow: "inset 0 0 0 1px rgba(35,196,166,.28)" },
                        children: [
                          /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 mb-2", style: { ...T.eyebrow, color: "#59DBC0" }, children: [
                            /* @__PURE__ */ jsx(Sparkles, { size: 14 }),
                            " Vena"
                          ] }),
                          /* @__PURE__ */ jsx("p", { className: "whitespace-pre-line", style: { ...T.small, color: `${INK}.94)` }, children: aiAnswer.text })
                        ]
                      }
                    ),
                    query && !aiAnswer && /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => askVena(query),
                        className: "w-full flex items-center gap-3 p-3 rounded-2xl text-left",
                        style: { background: "rgba(35,196,166,.12)", boxShadow: "inset 0 0 0 1px rgba(35,196,166,.3)" },
                        children: [
                          /* @__PURE__ */ jsx("span", { className: "p-2 rounded-xl shrink-0", style: { background: "#23C4A6", color: "#062421" }, children: /* @__PURE__ */ jsx(Sparkles, { size: 16 }) }),
                          /* @__PURE__ */ jsxs("span", { className: "flex-1 min-w-0", children: [
                            /* @__PURE__ */ jsxs("span", { className: "block truncate", style: { ...T.small, fontWeight: 700, color: "#F1F5F2" }, children: [
                              "Ask Vena: “",
                              query,
                              "”"
                            ] }),
                            /* @__PURE__ */ jsx("span", { className: "block", style: { ...T.caption, color: `${INK}.6)` }, children: "Computes against live store data" })
                          ] }),
                          /* @__PURE__ */ jsx(CornerDownLeft, { size: 16, style: { color: "#59DBC0" } })
                        ]
                      }
                    ),
                    !query && !aiAnswer && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 px-3 pb-3 pt-1", children: /* @__PURE__ */ jsx(
                      SuggestionList,
                      {
                        feed: suggestionFeed,
                        onPick: (prompt) => {
                          setQuery(prompt);
                          askVena(prompt);
                        }
                      }
                    ) }),
                    results.slice(0, 6).map((item, i) => {
                      const Icon = item.icon || FileText;
                      const sel = selectedIndex === i;
                      return /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => navigateToItem(item),
                          className: "w-full flex items-center gap-3 p-3 rounded-2xl text-left",
                          style: {
                            background: sel ? "#23C4A6" : `${INK}.05)`,
                            color: sel ? "#062421" : `${INK}.9)`
                          },
                          children: [
                            /* @__PURE__ */ jsx(Icon, { size: 16, className: "shrink-0" }),
                            /* @__PURE__ */ jsx("span", { className: "flex-1 min-w-0 truncate", style: { ...T.small, fontWeight: 600 }, children: item.title }),
                            /* @__PURE__ */ jsx(ChevronRight, { size: 15, className: "opacity-60" })
                          ]
                        },
                        item.id || i
                      );
                    }),
                    dbResults.slice(0, 6).map((item, i) => {
                      const sel = selectedIndex === results.length + i;
                      return /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => {
                            if (item.url) {
                              haptic("pop");
                              router.visit(item.url);
                              closeIsland();
                            }
                          },
                          className: "w-full flex items-center gap-3 p-3 rounded-2xl text-left",
                          style: {
                            background: sel ? "#23C4A6" : `${INK}.05)`,
                            color: sel ? "#062421" : `${INK}.9)`
                          },
                          children: [
                            /* @__PURE__ */ jsx(Box, { size: 16, className: "shrink-0" }),
                            /* @__PURE__ */ jsx("span", { className: "flex-1 min-w-0 truncate", style: { ...T.small, fontWeight: 600 }, children: item.title || item.name }),
                            /* @__PURE__ */ jsx(ArrowUpRight, { size: 15, className: "opacity-60" })
                          ]
                        },
                        i
                      );
                    })
                  ] })
                ] })
              }
            ) }, "ask"),
            tab === "chat" && /* @__PURE__ */ jsx(motion.div, { variants: contentVariants, initial: "initial", animate: "animate", exit: "exit", className: "h-full", children: /* @__PURE__ */ jsx(PaneShell, { tab: "chat", orbState: "listening", paused: orbPaused, flush: true, children: /* @__PURE__ */ jsx("div", { className: "h-full min-h-0 overflow-hidden bg-transparent", children: /* @__PURE__ */ jsx(React.Suspense, { fallback: /* @__PURE__ */ jsx("div", { className: "h-full grid place-items-center text-xs opacity-50", children: "Loading Support..." }), children: /* @__PURE__ */ jsx(ChatWidget, { embedded: true }) }) }) }) }, "chat"),
            tab === "growth" && /* @__PURE__ */ jsx(motion.div, { variants: contentVariants, initial: "initial", animate: "animate", exit: "exit", className: "h-full", children: /* @__PURE__ */ jsx(PaneShell, { tab: "growth", orbState: "weaving", paused: orbPaused, children: growth_engine?.count > 0 ? /* @__PURE__ */ jsxs(motion.div, { variants: listVariants, initial: "initial", animate: "animate", className: "space-y-3", children: [
              /* @__PURE__ */ jsxs(
                motion.div,
                {
                  variants: itemVariants,
                  className: "p-4 rounded-2xl",
                  style: { background: `${INK}.06)`, boxShadow: "inset 0 0 0 1px rgba(224,180,224,.22)" },
                  children: [
                    /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 mb-1.5", style: { ...T.body, fontWeight: 700, color: "#E0B4E0" }, children: [
                      /* @__PURE__ */ jsx(Zap, { size: 18 }),
                      " ",
                      growth_engine.count,
                      " opportunities"
                    ] }),
                    /* @__PURE__ */ jsx("p", { style: { ...T.small, color: `${INK}.82)` }, children: growth_engine?.popup?.description || "High-impact recommendations ready for review." })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(motion.div, { variants: itemVariants, children: /* @__PURE__ */ jsxs(
                Link,
                {
                  href: route("store.growth-engine.index", { store_slug: store?.slug }),
                  onClick: closeIsland,
                  className: "w-full flex items-center justify-center gap-2 rounded-2xl",
                  style: { ...T.small, fontWeight: 700, padding: "13px 16px", background: "#23C4A6", color: "#062421" },
                  children: [
                    "Open Growth Engine ",
                    /* @__PURE__ */ jsx(ArrowUpRight, { size: 16 })
                  ]
                }
              ) })
            ] }) : /* @__PURE__ */ jsx("div", { className: "h-full grid place-items-center text-center px-6", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "mx-auto mb-3 grid place-items-center", style: { width: 64, height: 64 }, children: /* @__PURE__ */ jsx(ThinkingOrb, { state: "weaving", size: 60, theme: "dark", paused: orbPaused }) }),
              /* @__PURE__ */ jsx("p", { style: { ...T.body, fontWeight: 700, color: `${INK}.88)` }, children: "Growth Engine is watching" }),
              /* @__PURE__ */ jsx("p", { style: { ...T.small, color: `${INK}.58)`, marginTop: 4 }, children: "New opportunities appear here as they are found." })
            ] }) }) }) }, "growth"),
            tab === "alerts" && /* @__PURE__ */ jsx(motion.div, { variants: contentVariants, initial: "initial", animate: "animate", exit: "exit", className: "h-full", children: /* @__PURE__ */ jsx(
              PaneShell,
              {
                tab: "alerts",
                orbState: unread > 0 ? "searching" : "breathing",
                paused: orbPaused,
                right: allAlerts.length > 0 && /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: toggleMarkAllAlerts,
                    className: "text-xs font-semibold px-2.5 py-1 rounded-lg transition-all",
                    style: {
                      background: `${INK}.08)`,
                      color: unread > 0 ? "#59DBC0" : `${INK}.7)`,
                      border: `1px solid ${INK}.12)`
                    },
                    children: unread > 0 ? "Mark all read" : "Mark unread"
                  }
                ),
                children: allAlerts.length ? /* @__PURE__ */ jsx(motion.div, { variants: listVariants, initial: "initial", animate: "animate", className: "space-y-2.5", children: allAlerts.map((n, i) => {
                  const alertId = String(n.id || `alert-${i}`);
                  const isRead = readAlertIds.includes(alertId);
                  return /* @__PURE__ */ jsxs(
                    motion.div,
                    {
                      variants: itemVariants,
                      className: "flex items-center gap-3.5 p-3.5 rounded-2xl transition-all",
                      style: {
                        background: isRead ? `${INK}.03)` : `${INK}.07)`,
                        border: isRead ? "1px solid transparent" : `1px solid ${INK}.1)`,
                        opacity: isRead ? 0.72 : 1
                      },
                      children: [
                        /* @__PURE__ */ jsx(
                          "div",
                          {
                            className: "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                            style: {
                              background: n.severity === "critical" ? "rgba(255,174,150,0.14)" : n.severity === "important" ? "rgba(255,221,142,0.14)" : "rgba(89,219,192,0.14)",
                              color: n.severity === "critical" ? "#FFAE96" : n.severity === "important" ? "#FFDD8E" : "#59DBC0"
                            },
                            children: n.severity === "critical" ? /* @__PURE__ */ jsx(AlertCircle, { size: 19 }) : n.severity === "important" ? /* @__PURE__ */ jsx(AlertTriangle, { size: 19 }) : /* @__PURE__ */ jsx(CheckCircle2, { size: 19 })
                          }
                        ),
                        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 flex flex-col justify-center", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                            /* @__PURE__ */ jsx("p", { className: "truncate", style: { ...T.small, fontWeight: 700, color: isRead ? `${INK}.65)` : "#F1F5F2" }, children: n.title }),
                            isRead && /* @__PURE__ */ jsx("span", { className: "text-3xs font-semibold px-1.5 py-0.5 rounded", style: { background: `${INK}.08)`, color: `${INK}.5)` }, children: "Read" })
                          ] }),
                          /* @__PURE__ */ jsx("p", { style: { ...T.caption, color: `${INK}.60)`, marginTop: 1 }, children: n.message || n.desc })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              type: "button",
                              onClick: (e) => {
                                e.stopPropagation();
                                toggleAlertRead(alertId);
                              },
                              title: isRead ? "Mark as unread" : "Mark as read",
                              className: "p-1.5 rounded-lg transition-colors flex items-center justify-center",
                              style: { color: isRead ? `${INK}.4)` : "#59DBC0", background: `${INK}.05)` },
                              children: /* @__PURE__ */ jsx(CheckCircle2, { size: 16 })
                            }
                          ),
                          n.action_url && /* @__PURE__ */ jsx(
                            Link,
                            {
                              href: n.action_url,
                              onClick: closeIsland,
                              className: "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center",
                              style: {
                                background: "rgba(89,219,192,0.15)",
                                color: "#59DBC0",
                                border: "1px solid rgba(89,219,192,0.3)"
                              },
                              children: "View"
                            }
                          )
                        ] })
                      ]
                    },
                    alertId
                  );
                }) }) : /* @__PURE__ */ jsx("div", { className: "h-full grid place-items-center text-center px-6", children: /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx(BellOff, { size: 30, className: "mx-auto mb-3", style: { color: `${INK}.32)` } }),
                  /* @__PURE__ */ jsx("p", { style: { ...T.body, fontWeight: 700, color: `${INK}.82)` }, children: "All clear" }),
                  /* @__PURE__ */ jsx("p", { style: { ...T.small, color: `${INK}.55)`, marginTop: 4 }, children: "Nothing needs your attention." })
                ] }) })
              }
            ) }, "alerts"),
            tab === "capture" && /* @__PURE__ */ jsx(motion.div, { variants: contentVariants, initial: "initial", animate: "animate", exit: "exit", className: "h-full", children: /* @__PURE__ */ jsx(PaneShell, { tab: "capture", orbState: "shaping", paused: orbPaused, flush: true, children: canUseSmartCapture ? /* @__PURE__ */ jsx("div", { className: "h-full min-h-0 overflow-hidden bg-transparent", children: /* @__PURE__ */ jsx(React.Suspense, { fallback: /* @__PURE__ */ jsx("div", { className: "h-full grid place-items-center text-xs opacity-50", children: "Loading Smart Capture..." }), children: /* @__PURE__ */ jsx(
              SmartCapturePanel,
              {
                embedded: true,
                isOpen: true,
                initialTab: captureTab,
                onClose: () => setTab("ask")
              }
            ) }) }) : /* @__PURE__ */ jsx("div", { className: "h-full grid place-items-center text-center px-6", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Inbox, { size: 30, className: "mx-auto mb-3", style: { color: `${INK}.32)` } }),
              /* @__PURE__ */ jsx("p", { style: { ...T.body, fontWeight: 700, color: `${INK}.82)` }, children: "Smart Capture is not enabled" }),
              /* @__PURE__ */ jsx("p", { style: { ...T.small, color: `${INK}.55)`, marginTop: 4 }, children: "Enable VenSynQ to scan documents into your records." })
            ] }) }) }) }, "capture")
          ] }) })
        ] }) }, "open")
      ] })
    }
  ) });
}
export {
  AiIsland as A
};

import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, useRef, useMemo, useId, useCallback, useLayoutEffect } from "react";
import { usePage, router, Link } from "@inertiajs/react";
import { useMotionValue, useTransform, useSpring, motion, useReducedMotion, AnimatePresence } from "motion/react";
import { Home, ShoppingCart, Box, Package, Layers, ArrowRightLeft, Tag, Building2, FileText, Activity, BookOpen, TrendingUp, Receipt, BarChart2, Clock, Users, UserPlus, DollarSign, CreditCard, Calculator, Database, Percent, Settings, Shield, History, Trash2, Download, Sparkles, PlusCircle, FilePlus, Upload, Printer, Brain, Settings2, X, Loader2, KeyRound, CheckCircle2, Plus, ChevronRight, User, AlertTriangle, Lock, Eye, Zap, Camera, Mic, Type, FilePlus2, RefreshCw, TestTube2, ChevronDown, Search, Check, AlertCircle, RotateCcw, Send, Minimize2, Maximize2, Play, MessageSquare, Bell, ScanLine, CornerDownLeft, ArrowUpRight, BellOff, Inbox, Volume2, VolumeX, ArrowRight } from "lucide-react";
import { createPortal } from "react-dom";
import { T as ThinkingOrb } from "./ThinkingOrb-DGYTy5s1.js";
import axios from "axios";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
import Dexie from "dexie";
import { h as useAppearance, g as useTheme, f as useWorkspace } from "../ssr.js";
function VenaLogo({
  size = 24,
  className = "",
  animated = true,
  speed = "normal",
  style = {},
  ...props
}) {
  const duration = speed === "fast" ? "5s" : speed === "slow" ? "16s" : "10s";
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 1024 1024",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      className: `shrink-0 ${animated ? "vena-live-spin" : ""} ${className}`,
      style: {
        transformOrigin: "50% 50%",
        ...animated ? { animationDuration: duration } : {},
        ...style
      },
      ...props,
      children: [
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#5ECEBF",
            points: "332.9,657.7 212.7,727.3 212.2,727 212.1,727 212.4,605.5 333.1,535.6 333,587.8 332.9,657.3"
          }
        ),
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#5ECEBF",
            points: "443.9,727 323.4,796.8 217.8,736 338.3,666.2 398.2,700.7"
          }
        ),
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#42AFA8",
            points: "151.8,761.8 31,831.5 31.3,710.5 31.3,692.5 31.4,640.7 31.4,623 31.6,501.1 212.2,396.5 212.8,396.8 212.8,396.2 333.5,326.2 333.5,344.5 333.3,465.8 152.1,570.7 152,640.5 151.9,692.3 151.9,692.3"
          }
        ),
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#42AFA8",
            points: "444.2,935.9 323.7,1005.7 216.8,944.2 216.8,944.2 203,936.3 156.6,909.6 142.6,901.5 37,840.8 36.1,840.2 156.8,770.5 157.5,770.9 217,805.2 217.1,805.2 217.1,805.2 263.1,831.7 323.5,866.4 337.5,874.5 337.5,874.5 397.8,909.2 397.8,909.2"
          }
        ),
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#5ECEBF",
            points: "614.1,430.9 568.8,404.8 509.1,370.5 509.1,370.5 509.4,231.5 613.9,291.6 613.9,309 614,378.7"
          }
        ),
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#5ECEBF",
            points: "499.3,370.3 498.7,370 393.7,430.8 393.8,379.2 393.9,309.7 393.9,291.2 498.5,230.7 498.5,230.7 499.6,231.3 499.6,231.3"
          }
        ),
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#7AEED1",
            points: "613.8,622.7 508.5,561.8 508.5,561.8 508.5,440.4 508.9,440.6 613.1,501.2 613.8,622.1"
          }
        ),
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#7AEED1",
            points: "609.1,631.3 504.7,691.7 504.2,691.4 503.8,691.2 399.6,630.7 503.7,570.3 503.8,570.4"
          }
        ),
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#7AEED1",
            points: "498.7,561.6 394.6,622 393.8,501 393.9,500.4 498.2,439.9 498.8,440.2"
          }
        ),
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#037300",
            points: "508.5,561.8 508.4,561.8 508.5,561.8"
          }
        ),
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#42AFA8",
            points: "795.2,535.1 780.1,526.4 674.4,465.6 674.2,343.7 674.2,326.3 674.2,326.3 674.2,274.1 674.1,256.7 613.8,222 568.5,195.9 509.5,162 509.5,160.4 507.9,21.9 509.8,23 509.8,23 613.5,82.7 628.6,91.4 673.9,117.4 689,126.1 794.6,186.9 794.6,186.9 794.7,204.3 794.8,273.9 794.8,326.2 794.9,395.8 795,395.8 795.1,517.7"
          }
        ),
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#42AFA8",
            points: "499.7,160.2 212.9,326.4 213,275.2 213,275.2 213.1,205.7 213.2,186.8 498.1,21.8"
          }
        ),
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#5ECEBF",
            points: "795.5,726.6 674.7,657.1 674.6,587.5 674.5,535.3 719.8,561.3 780.2,596 795.3,604.7"
          }
        ),
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#5ECEBF",
            points: "790.7,735.1 685.3,796.2 670.2,787.6 609.8,752.8 564.5,726.8 670,665.7"
          }
        ),
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#42AFA8",
            points: "976.5,830.8 855.8,761.3 855.7,691.7 855.6,639.5 855.5,569.8 855.5,552.4 855.4,482.8 855.3,430.5 900.6,456.6 900.6,456.6 961,491.3 976,500 976.2,621.9 976.3,639.3 976.3,691.5 976.4,708.9"
          }
        ),
        /* @__PURE__ */ jsx(
          "polygon",
          {
            fill: "#42AFA8",
            points: "971.8,839.3 685.6,1005.2 670.5,996.5 610.1,961.8 610.1,961.8 564.9,935.7 504.5,901 503.4,900.3 503.3,900.3 397.9,839.7 383.8,831.5 504.3,761.7 609.9,822.5 625,831.2 670.3,857.2 685.4,865.9 851.1,769.9"
          }
        )
      ]
    }
  );
}
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
    id: "pos",
    title: "Point of Sale",
    subtitle: "Open the POS terminal",
    keywords: ["pos", "sell", "checkout", "terminal", "cash register", "billing", "counter"],
    icon: ShoppingCart,
    category: CATEGORIES.NAVIGATION,
    route: "store.pos"
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
const LEMON_JS_SRC = "https://app.lemonsqueezy.com/js/lemon.js";
const LOAD_TIMEOUT_MS = 12e3;
let loaderPromise = null;
let activeHandlers = null;
function toEmbeddableUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
  try {
    const url = new URL(rawUrl, window.location.origin);
    if (url.searchParams.has("signature")) return rawUrl;
    url.searchParams.set("embed", "1");
    return url.toString();
  } catch {
    if (rawUrl.includes("signature=") || rawUrl.includes("embed=")) return rawUrl;
    return `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}embed=1`;
  }
}
function handleLemonEvent(payload) {
  const name = payload?.event ?? payload;
  const handlers = activeHandlers;
  if (!handlers) return;
  if (name === "Checkout.Success") {
    handlers.onSuccess?.(payload?.data ?? null);
    return;
  }
  if (name === "Checkout.Closed" || name === "Checkout.Close") {
    activeHandlers = null;
    handlers.onClose?.();
  }
}
function loadLemonJs() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("lemon.js requires a browser environment"));
  }
  if (window.LemonSqueezy?.Url?.Open) {
    return Promise.resolve(window.LemonSqueezy);
  }
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      loaderPromise = null;
      reject(new Error("lemon.js load timed out"));
    }, LOAD_TIMEOUT_MS);
    const finish = () => {
      if (settled) return;
      try {
        window.createLemonSqueezy?.();
      } catch {
      }
      if (!window.LemonSqueezy?.Url?.Open) {
        settled = true;
        clearTimeout(timer);
        loaderPromise = null;
        reject(new Error("lemon.js loaded but did not initialise"));
        return;
      }
      try {
        window.LemonSqueezy.Setup({ eventHandler: handleLemonEvent });
      } catch {
      }
      settled = true;
      clearTimeout(timer);
      resolve(window.LemonSqueezy);
    };
    const existing = document.querySelector(`script[src="${LEMON_JS_SRC}"]`);
    if (existing) {
      if (existing.dataset.loaded === "1") {
        finish();
      } else {
        existing.addEventListener("load", finish, { once: true });
        existing.addEventListener("error", () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          loaderPromise = null;
          reject(new Error("lemon.js failed to load"));
        }, { once: true });
      }
      return;
    }
    const script = document.createElement("script");
    script.src = LEMON_JS_SRC;
    script.defer = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "1";
      finish();
    }, { once: true });
    script.addEventListener("error", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      loaderPromise = null;
      script.remove();
      reject(new Error("lemon.js failed to load"));
    }, { once: true });
    document.head.appendChild(script);
  });
  return loaderPromise;
}
function preloadLemonCheckout() {
  loadLemonJs().catch(() => {
  });
}
async function openLemonCheckout(url, options = {}) {
  const {
    onSuccess,
    onClose,
    onError,
    redirectOnFailure = true
  } = options;
  if (!url) {
    onError?.(new Error("No checkout URL was provided."));
    return false;
  }
  const embedUrl = toEmbeddableUrl(url);
  try {
    const lemon = await loadLemonJs();
    activeHandlers = {
      onSuccess: (data) => {
        onSuccess?.(data);
      },
      onClose: () => {
        onClose?.();
      }
    };
    lemon.Url.Open(embedUrl);
    return true;
  } catch (error) {
    activeHandlers = null;
    onError?.(error);
    if (redirectOnFailure) {
      window.location.href = embedUrl;
    }
    return false;
  }
}
function closeLemonCheckout() {
  try {
    window.LemonSqueezy?.Url?.Close?.();
  } catch {
  }
  activeHandlers = null;
}
function SmartCapturePanel({ isOpen, onClose, initialTab = "image", embedded = false }) {
  const { store, ai_tiers: aiTiers = {} } = usePage().props;
  const tt = useTermText();
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ctx, setCtx] = useState(null);
  const [ctxLoading, setCtxLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioSource, setAudioSource] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const [textInput, setTextInput] = useState("");
  const [capturePartyId, setCapturePartyId] = useState("");
  const [capturePartySide, setCapturePartySide] = useState("customer");
  const [forkDialog, setForkDialog] = useState(null);
  const [acknowledgeLocked, setAcknowledgeLocked] = useState(false);
  const [targetType, setTargetType] = useState("");
  const [customCommand, setCustomCommand] = useState("");
  const [isHandwritten, setIsHandwritten] = useState(false);
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [dictating, setDictating] = useState(false);
  const [appendMode, setAppendMode] = useState(false);
  const [appendDocType, setAppendDocType] = useState("pre_invoice");
  const [appendDocId, setAppendDocId] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({ provider: "gemini", api_key: "", model: "" });
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState(null);
  const [availableModels, setAvailableModels] = useState(null);
  const [modelsBusy, setModelsBusy] = useState(false);
  const [rateLimit, setRateLimit] = useState(null);
  const extractInFlight = useRef(false);
  const idempotencyKeyRef = useRef(null);
  const [isPurchasingAddon, setIsPurchasingAddon] = useState(null);
  const handlePurchaseAddon = (addonType) => {
    setIsPurchasingAddon(addonType);
    axios.post(`/store/${store?.slug}/billing/checkout-addon`, { addon_type: addonType }).then((res) => {
      if (!res.data.url) {
        alert(res.data.error || "Failed to create checkout.");
        setIsPurchasingAddon(null);
        return;
      }
      openLemonCheckout(res.data.url, {
        onSuccess: () => {
          setTimeout(async () => {
            await axios.post(`/store/${store?.slug}/billing/sync-subscription`).catch(() => {
            });
            closeLemonCheckout();
            router.reload({ preserveScroll: true });
            setIsPurchasingAddon(null);
          }, 2200);
        },
        onClose: () => setIsPurchasingAddon(null),
        onError: () => setIsPurchasingAddon(null)
      });
    }).catch((err) => {
      console.error(err);
      alert("Failed to generate checkout link. Please check your network connection.");
      setIsPurchasingAddon(null);
    });
  };
  const baseUrl = useMemo(() => {
    try {
      return route("store.smart-capture.extract", { store_slug: store?.slug }).replace(/\/extract$/, "");
    } catch (e) {
      return `/s/${store?.slug}/smart-capture`;
    }
  }, [store?.slug]);
  const maxFiles = ctx?.limits?.max_files ?? 5;
  const locked = ctx && !ctx.entitlement?.allowed;
  useEffect(() => {
    if (!isOpen) return;
    setCtxLoading(true);
    axios.get(`${baseUrl}/context`).then((res) => setCtx(res.data)).catch(() => setCtx(null)).finally(() => setCtxLoading(false));
  }, [isOpen, baseUrl]);
  useEffect(() => {
    if (!rateLimit || rateLimit.seconds <= 0) return;
    const id = setInterval(() => {
      setRateLimit((prev) => {
        if (!prev) return null;
        if (prev.seconds <= 1) return null;
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1e3);
    return () => clearInterval(id);
  }, [rateLimit]);
  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1e3);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recording]);
  if (!isOpen) return null;
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(Array.from(e.dataTransfer.files));
  };
  const handleFileChange = (e) => {
    if (e.target.files?.length) addFiles(Array.from(e.target.files));
    e.target.value = "";
  };
  const addFiles = (files) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const maxMb = ctx?.limits?.max_image_mb ?? 10;
    const next = [...selectedFiles];
    for (const file of files) {
      if (next.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files per scan.`);
        break;
      }
      if (!validTypes.includes(file.type)) {
        setError("Unsupported file format. Please upload JPG, PNG, WEBP or PDF.");
        continue;
      }
      if (file.size > maxMb * 1024 * 1024) {
        setError(`"${file.name}" exceeds the ${maxMb}MB limit.`);
        continue;
      }
      const entry = { file, preview: null };
      if (file.type.startsWith("image/")) {
        entry.preview = URL.createObjectURL(file);
      }
      next.push(entry);
      setError(null);
    }
    setSelectedFiles(next);
  };
  const removeFile = (idx) => {
    setSelectedFiles((prev) => {
      const next = [...prev];
      if (next[idx]?.preview) URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
  };
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let options = { mimeType: "audio/webm" };
      if (!MediaRecorder.isTypeSupported("audio/webm")) options = { mimeType: "audio/mp4" };
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: options.mimeType });
        setAudioBlob(blob);
        setAudioSource("recorded");
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Audio capture failed:", err);
      setError("Permission denied. Could not access microphone.");
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };
  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const validTypes = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/aac", "audio/x-m4a", "audio/m4a"];
    const maxMb = ctx?.limits?.max_audio_mb ?? 25;
    if (!validTypes.includes(file.type) && !file.type.startsWith("audio/")) {
      setError("Unsupported audio format. Use MP3, WAV, M4A, OGG or WEBM.");
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setError(`Audio exceeds the ${maxMb}MB limit.`);
      return;
    }
    setAudioBlob(file);
    setAudioSource("uploaded");
    setError(null);
  };
  const convertToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });
  const handleExtract = async () => {
    if (extractInFlight.current || loading) return;
    if (rateLimit) return;
    extractInFlight.current = true;
    setLoading(true);
    setError(null);
    setExtractedData(null);
    try {
      const payload = {
        type: activeTab,
        target_type: targetType || null,
        custom_command: customCommand || null,
        // Told to the model so it does not invent a party from a
        // letterhead, and used to pre-fill the review screen.
        party_id: capturePartyId || null
      };
      if (activeTab === "image") {
        if (selectedFiles.length === 0) {
          setError("Please add at least one photo or PDF first.");
          setLoading(false);
          return;
        }
        payload.files = [];
        for (const entry of selectedFiles) {
          const data = await convertToBase64(entry.file);
          payload.files.push({ base64: data.split(",")[1], mime: entry.file.type });
        }
      } else if (activeTab === "audio") {
        if (!audioBlob) {
          setError("Please record or upload a voice memo first.");
          setLoading(false);
          return;
        }
        const data = await convertToBase64(audioBlob);
        payload.base64 = data.split(",")[1];
        payload.mime_type = audioBlob.type;
      } else {
        if (!textInput.trim()) {
          setError("Please type or paste some text first.");
          setLoading(false);
          return;
        }
        payload.text = textInput;
      }
      const response = await axios.post(`${baseUrl}/extract`, payload);
      if (response.data.success) {
        setExtractedData(response.data);
        setSelectedPartyId(response.data.suggested_party_id || "");
        setSelectedCategoryId(response.data.suggested_category_id || "");
        setPaymentMethod(response.data.action === "purchase" ? "credit" : "cash");
        idempotencyKeyRef.current = crypto?.randomUUID?.() || `sc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      } else {
        setError(response.data.message || "Failed to extract transaction details.");
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 402) {
        axios.get(`${baseUrl}/context`).then((res) => setCtx(res.data)).catch(() => {
        });
        setError(data?.message || "AI Scan is locked for this store.");
      } else if (status === 429) {
        setRateLimit({
          seconds: Math.max(1, parseInt(data?.retry_after ?? 30, 10)),
          message: data?.message || "The AI provider is rate limiting this key.",
          daily: !!data?.daily
        });
        setError(null);
      } else if (status === 409) {
        setError(data?.message || "A scan is already running for this store. Give it a moment.");
      } else {
        setError(data?.message || "AI extraction failed. Please check your AI settings and try again.");
      }
    } finally {
      extractInFlight.current = false;
      setLoading(false);
    }
  };
  const handleItemChange = (idx, field, value) => {
    setExtractedData((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[idx] = { ...updatedItems[idx], [field]: value };
      return { ...prev, items: updatedItems };
    });
  };
  const handleProductPick = (idx, value) => {
    setExtractedData((prev) => {
      const updatedItems = [...prev.items];
      const item = { ...updatedItems[idx] };
      if (value === "__create_new__") {
        item.product_id = null;
        item.create_new = {
          name: item.raw_name,
          price: item.unit_price || 0,
          cost_price: 0
        };
      } else {
        item.product_id = value;
        item.create_new = null;
        const candidate = (item.candidates || []).find((c) => String(c.id) === String(value));
        if (candidate && (item.unit_price === null || item.unit_price === void 0 || item.unit_price === "")) {
          item.unit_price = candidate.sale_price;
        }
      }
      updatedItems[idx] = item;
      return { ...prev, items: updatedItems };
    });
  };
  const removeItem = (idx) => {
    setExtractedData((prev) => {
      const updatedItems = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items: updatedItems };
    });
  };
  const isExpense = extractedData?.action === "expense";
  const partyType = extractedData ? ["purchase", "pre_purchase", "purchase_return"].includes(extractedData.action) ? "supplier" : "customer" : "customer";
  const partyList = partyType === "supplier" ? ctx?.parties?.suppliers || [] : ctx?.parties?.customers || [];
  const candidateIds = new Set((extractedData?.party_candidates || []).map((c) => String(c.id)));
  const itemsReady = extractedData?.items?.length > 0 && extractedData.items.every(
    (i) => isExpense ? true : i.product_id || i.create_new && i.create_new.name?.trim()
  );
  const isAppending = appendMode && !!appendDocId;
  const partyReady = isAppending ? true : isExpense ? !!selectedCategoryId : !!selectedPartyId;
  const appendReady = !appendMode || appendDocType && appendDocId;
  const policyFor = (action) => ctx?.document_policy?.[action] || null;
  const currentPolicy = extractedData ? policyFor(extractedData.action) : null;
  const handleConfirmTransaction = async (options = {}) => {
    if (!extractedData || confirming) return;
    const action = options.overrideAction || extractedData.action;
    const policy = policyFor(action);
    const isAppending2 = appendMode && !!appendDocId;
    if (!options.resolved && !isAppending2 && policy?.locking) {
      setAcknowledgeLocked(false);
      setForkDialog({
        action,
        label: policy.label,
        handoffUrl: policy.handoff_url,
        draftAction: policy.draft_action,
        draftLabel: policy.draft_label
      });
      return;
    }
    setConfirming(true);
    setError(null);
    const postItems = extractedData.items.map((item) => ({
      product_id: item.create_new ? null : item.product_id,
      create_new: item.create_new ? {
        name: item.create_new.name,
        price: parseFloat(item.create_new.price || 0),
        cost_price: parseFloat(item.create_new.cost_price || 0)
      } : null,
      qty: parseFloat(item.qty || 1),
      unit_price: parseFloat(item.unit_price || 0),
      name: item.raw_name,
      // The exact wording the AI read. The server pairs it with whatever
      // product the user settled on, and remembers it for this store.
      raw_name: item.raw_name
    }));
    const payload = {
      action,
      mode: options.mode || "create",
      acknowledge_locked: !!options.acknowledgeLocked,
      party_id: isExpense ? null : selectedPartyId,
      party: extractedData.party,
      notes: extractedData.notes || null,
      payment_method: isExpense && paymentMethod === "credit" ? "cash" : paymentMethod,
      expense_category: isExpense ? extractedData.expense_category || null : null,
      expense_category_id: isExpense ? selectedCategoryId : null,
      date: extractedData.date || null,
      reference: extractedData.reference || null,
      append_to: appendMode && appendDocId ? { type: appendDocType, id: appendDocId } : null,
      // Same key on a retry => the server returns the original result
      // instead of posting a second transaction.
      idempotency_key: idempotencyKeyRef.current,
      items: postItems
    };
    try {
      const response = await axios.post(`${baseUrl}/confirm`, payload);
      if (response.data.success && response.data.mode === "handoff") {
        setForkDialog(null);
        onClose();
        router.visit(response.data.redirect);
        return;
      }
      if (response.data.success) {
        setForkDialog(null);
        setSuccessData({
          ...response.data.data,
          message: response.data.message,
          duplicate: response.data.duplicate,
          createdProducts: response.data.created_products || []
        });
        axios.get(`${baseUrl}/context`).then((r) => setCtx(r.data)).catch(() => {
        });
      } else {
        setError(response.data.message || "Failed to post transaction.");
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === "requires_review" || data?.code === "requires_acknowledgement") {
        const policy2 = policyFor(action);
        setAcknowledgeLocked(false);
        setForkDialog({
          action,
          label: data.label || policy2?.label,
          handoffUrl: policy2?.handoff_url,
          draftAction: data.draft_action ?? policy2?.draft_action,
          draftLabel: policy2?.draft_label
        });
      } else {
        setForkDialog(null);
        setError(data?.message || "Transaction creation failed. Check the details and try again.");
      }
    } finally {
      setConfirming(false);
    }
  };
  const calculateGrossTotal = () => {
    if (!extractedData) return "0.00";
    return extractedData.items.reduce((sum, item) => sum + parseFloat(item.qty || 1) * parseFloat(item.unit_price || 0), 0).toFixed(2);
  };
  const resetAll = () => {
    setSuccessData(null);
    setExtractedData(null);
    setSelectedFiles([]);
    setAudioBlob(null);
    setAudioSource(null);
    setTextInput("");
    setSelectedPartyId("");
    setSelectedCategoryId("");
    setAppendDocId("");
    setError(null);
    setRateLimit(null);
    setForkDialog(null);
    setAcknowledgeLocked(false);
    idempotencyKeyRef.current = null;
  };
  const navigateToSuccessDoc = () => {
    if (!successData) return;
    onClose();
    let path = null;
    try {
      if (successData.type === "purchase") {
        path = route("store.v3.purchases.show", { store_slug: store.slug, purchase: successData.id });
      } else if (successData.type === "sale" || successData.type === "invoice") {
        path = route("store.sales.dashboard", { store_slug: store.slug });
      } else if (successData.type === "expense") {
        path = route("store.expenses.index", { store_slug: store.slug });
      } else if (successData.type === "return") {
        path = route("store.returns-history.index", { store_slug: store.slug });
      } else if (successData.type === "proposal") {
        path = route("store.proposals.show", { store_slug: store.slug, proposal: successData.id });
      } else if (successData.type === "pre_invoice") {
        path = route("store.sales-orders.show", { store_slug: store.slug, sales_order: successData.id });
      } else if (successData.type === "pre_purchase") {
        path = route("store.purchase-orders.show", { store_slug: store.slug, purchase_order: successData.id });
      } else if (successData.type === "recurring_invoice") {
        path = route("store.recurring-invoices.index", { store_slug: store.slug });
      } else if (successData.type === "purchase_return") {
        path = route("store.debit-notes.show", { store_slug: store.slug, id: successData.id });
      }
    } catch (e) {
    }
    if (path) router.visit(path);
  };
  const openSettings = () => {
    setShowSettings(true);
    setSettingsMsg(null);
    setAvailableModels(null);
    axios.get(`${baseUrl}/settings`).then((res) => {
      setSettings(res.data);
      setSettingsForm({
        provider: res.data.provider || "gemini",
        api_key: res.data.api_key_masked || "",
        model: res.data.model || ""
      });
    }).catch((err) => setSettingsMsg({ ok: false, text: err.response?.data?.message || "Could not load settings." }));
  };
  const discoverModels = async () => {
    setModelsBusy(true);
    setSettingsMsg(null);
    try {
      const res = await axios.post(`${baseUrl}/settings/models`, {
        provider: settingsForm.provider,
        api_key: settingsForm.api_key
      });
      setAvailableModels(res.data.models || []);
      if (!res.data.models?.length) {
        setSettingsMsg({ ok: false, text: "No models were returned for this key." });
      }
    } catch (err) {
      setSettingsMsg({ ok: false, text: err.response?.data?.message || "Could not load the model list." });
    } finally {
      setModelsBusy(false);
    }
  };
  const saveSettings = async () => {
    setSettingsBusy(true);
    setSettingsMsg(null);
    try {
      const res = await axios.post(`${baseUrl}/settings`, settingsForm);
      setSettingsMsg({ ok: true, text: res.data.message || "Saved." });
      axios.get(`${baseUrl}/context`).then((r) => setCtx(r.data)).catch(() => {
      });
    } catch (err) {
      setSettingsMsg({ ok: false, text: err.response?.data?.message || "Failed to save settings." });
    } finally {
      setSettingsBusy(false);
    }
  };
  const testSettings = async () => {
    setSettingsBusy(true);
    setSettingsMsg(null);
    try {
      const res = await axios.post(`${baseUrl}/settings/test`, settingsForm);
      setSettingsMsg({ ok: res.data.success, text: res.data.message });
    } catch (err) {
      setSettingsMsg({ ok: false, text: err.response?.data?.message || "Connection test failed." });
    } finally {
      setSettingsBusy(false);
    }
  };
  const providerLabels = { gemini: "Google Gemini", openai: "OpenAI", anthropic: "Anthropic (Claude)", deepseek: "DeepSeek" };
  const providerCaps = ctx?.settings?.providers || {};
  const openDocs = ctx?.open_documents?.[appendDocType] || [];
  const renderAdvancedControls = () => {
    const pagesUsed = ctx?.entitlement?.pages_used ?? 0;
    const pagesLimit = ctx?.entitlement?.pages_limit ?? 0;
    const usagePercent = pagesLimit > 0 ? Math.min(100, Math.round(pagesUsed / pagesLimit * 100)) : 0;
    return /* @__PURE__ */ jsxs("div", { className: "mb-6 space-y-4 text-left bg-white/[0.03] backdrop-blur-md p-5 rounded-2xl border border-white/[0.08] relative z-20 font-sans shadow-lg", children: [
      pagesLimit > 0 && usagePercent >= 80 && /* @__PURE__ */ jsxs("div", { className: `p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between gap-3 border ${usagePercent >= 100 ? "bg-rose-500/10 border-rose-500/30 text-rose-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "shrink-0" }),
          /* @__PURE__ */ jsx("span", { children: usagePercent >= 100 ? `100% Quota Exceeded (${pagesUsed}/${pagesLimit} pages used). Upgrade tier or switch to BYOK.` : `Quota Warning: ${usagePercent}% of monthly AI pages used (${pagesUsed}/${pagesLimit} pages).` })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: openSettings,
            className: "px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-2xs font-bold whitespace-nowrap text-white transition-colors",
            children: "BYOK / Upgrade"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setAppendMode(false),
            className: `flex-1 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${!appendMode ? "bg-[#23C4A6] border-[#23C4A6] text-[#062421] shadow-[0_2px_12px_rgba(35,196,166,0.25)]" : "bg-white/[0.04] border-white/[0.08] text-[rgba(241,245,242,0.7)] hover:text-white hover:bg-white/[0.08]"}`,
            children: [
              /* @__PURE__ */ jsx(FilePlus2, { size: 14 }),
              "Create New Document"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setAppendMode(true),
            className: `flex-1 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${appendMode ? "bg-[#23C4A6] border-[#23C4A6] text-[#062421] shadow-[0_2px_12px_rgba(35,196,166,0.25)]" : "bg-white/[0.04] border-white/[0.08] text-[rgba(241,245,242,0.7)] hover:text-white hover:bg-white/[0.08]"}`,
            children: [
              /* @__PURE__ */ jsx(Layers, { size: 14 }),
              "Add to Existing Document"
            ]
          }
        )
      ] }),
      appendMode ? /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "capture-append-doc-type", className: "text-2xs font-bold uppercase tracking-wider text-[rgba(241,245,242,0.5)] block ml-1", children: "Document Type" }),
          /* @__PURE__ */ jsx(
            CustomSelect,
            {
              id: "capture-append-doc-type",
              value: appendDocType,
              onChange: (e) => {
                setAppendDocType(e.target.value);
                setAppendDocId("");
              },
              options: [
                { value: "pre_invoice", label: tt("Sales Order (Pre-Invoice)") },
                { value: "pre_purchase", label: tt("Purchase Order (Pre-Purchase)") },
                { value: "proposal", label: "Proposal / Quote" },
                { value: "recurring_invoice", label: "Recurring Invoice" }
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "capture-append-doc-id", className: "text-2xs font-bold uppercase tracking-wider text-[rgba(241,245,242,0.5)] block ml-1", children: "Target Document" }),
          /* @__PURE__ */ jsx(
            CustomSelect,
            {
              id: "capture-append-doc-id",
              value: appendDocId,
              onChange: (e) => setAppendDocId(e.target.value),
              placeholder: "-- Select an open document --",
              options: [
                { value: "", label: "-- Select an open document --" },
                ...openDocs.map((doc) => ({
                  value: doc.id,
                  label: `${doc.reference || doc.id?.slice(0, 8)} — ${doc.party || "No party"}${doc.total !== void 0 && doc.total !== null ? ` — ${parseFloat(doc.total).toFixed(2)}` : ""} (${doc.status})`
                }))
              ]
            }
          ),
          openDocs.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-2xs text-amber-400 font-semibold ml-1", children: "No open documents of this type found." })
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 md:col-span-2", children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "capture-party-select", className: "text-2xs font-bold uppercase tracking-wider text-[rgba(241,245,242,0.5)] block ml-1", children: [
            "Who is this document for? ",
            /* @__PURE__ */ jsx("span", { className: "normal-case font-bold text-[rgba(241,245,242,0.4)]", children: "(optional — helps the AI a lot)" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              CustomSelect,
              {
                id: "capture-party-side",
                value: capturePartySide,
                onChange: (e) => {
                  setCapturePartySide(e.target.value);
                  setCapturePartyId("");
                },
                className: "w-36 shrink-0",
                options: [
                  { value: "customer", label: tt("Customer") },
                  { value: "supplier", label: tt("Supplier") }
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              CustomSelect,
              {
                id: "capture-party-select",
                value: capturePartyId,
                onChange: (e) => setCapturePartyId(e.target.value),
                placeholder: "Let the AI read it from the document",
                className: "flex-1",
                options: [
                  { value: "", label: "Let the AI read it from the document" },
                  ...(capturePartySide === "supplier" ? ctx?.parties?.suppliers || [] : ctx?.parties?.customers || []).map((p) => ({ value: p.id, label: p.name }))
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "capture-target-type", className: "text-2xs font-bold uppercase tracking-wider text-[rgba(241,245,242,0.5)] block ml-1", children: "What would you like to create?" }),
          /* @__PURE__ */ jsx(
            CustomSelect,
            {
              id: "capture-target-type",
              value: targetType,
              onChange: (e) => setTargetType(e.target.value),
              placeholder: "No Preference (Auto-Detect)",
              options: [
                { value: "", label: "No Preference (Auto-Detect)" },
                {
                  groupLabel: "Editable afterwards — safest",
                  options: [
                    { value: "pre_invoice", label: tt("Pre-Sale (Sales Order)") },
                    { value: "pre_purchase", label: tt("Purchase Order") },
                    { value: "proposal", label: "Proposal / Quote" },
                    { value: "recurring_invoice", label: "Recurring Invoice" }
                  ]
                },
                {
                  groupLabel: "Final — cannot be edited once posted",
                  options: [
                    { value: "sale", label: "Sales Invoice" },
                    { value: "purchase", label: "Purchase Bill" },
                    { value: "expense", label: "Operating Expense" },
                    { value: "return", label: "Sales Return" },
                    { value: "purchase_return", label: "Purchase Return (Debit Note)" }
                  ]
                }
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "capture-custom-commands", className: "text-2xs font-bold uppercase tracking-wider text-[rgba(241,245,242,0.5)] block ml-1", children: "Text Commands / Instructions (Optional)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "capture-custom-commands",
              type: "text",
              value: customCommand,
              onChange: (e) => setCustomCommand(e.target.value),
              placeholder: "e.g. 'Use wholesale prices', 'Skip tax'",
              className: "w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.12] focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 rounded-xl text-xs outline-none text-[#F1F5F2] placeholder:text-white/30 font-medium transition-colors"
            }
          )
        ] })
      ] })
    ] });
  };
  const renderSettingsDrawer = () => /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-md animate-in fade-in duration-fast", onClick: () => setShowSettings(false), children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md h-full bg-[#0D1412] border-l border-white/10 p-6 overflow-y-auto animate-in slide-in-from-right duration-normal text-[#F1F5F2]", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(KeyRound, { size: 18, className: "text-[#23C4A6]" }),
        /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-[#F1F5F2]", children: "AI Settings (Bring Your Own Key)" })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => setShowSettings(false), className: "w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-[rgba(241,245,242,0.6)] mb-6 leading-relaxed", children: "Use your own API key from any major AI provider. Your key is stored only for this store and is never shared with other stores." }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-[rgba(241,245,242,0.5)] block mb-1.5", children: "Provider" }),
        /* @__PURE__ */ jsx(
          CustomSelect,
          {
            value: settingsForm.provider,
            onChange: (e) => setSettingsForm((f) => ({ ...f, provider: e.target.value, model: "" })),
            options: Object.keys(providerLabels || {}).map((p) => ({
              value: p,
              label: providerLabels[p]
            }))
          }
        ),
        providerCaps[settingsForm.provider] && /* @__PURE__ */ jsxs("p", { className: "text-2xs text-[rgba(241,245,242,0.5)] mt-1.5 ml-1", children: [
          "Supports: ",
          ["image", "audio", "text"].filter((t) => providerCaps[settingsForm.provider][t]).map((t) => t === "image" ? "Photos" : t === "audio" ? "Voice" : "Text").join(", "),
          !providerCaps[settingsForm.provider].image && " — no photo scanning!"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-[rgba(241,245,242,0.5)] block mb-1.5", children: "API Key" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: settingsForm.api_key,
            onChange: (e) => setSettingsForm((f) => ({ ...f, api_key: e.target.value })),
            placeholder: "Paste your API key",
            className: "w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.12] focus:border-teal-400/50 rounded-xl text-xs font-mono outline-none text-[#F1F5F2] placeholder:text-white/30"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-[rgba(241,245,242,0.5)]", children: "Model (optional)" }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: discoverModels,
              disabled: modelsBusy,
              className: "text-2xs font-bold uppercase tracking-wider text-[#23C4A6] hover:text-[#2dd4bf] flex items-center gap-1 disabled:opacity-40",
              children: [
                modelsBusy ? /* @__PURE__ */ jsx(Loader2, { size: 11, className: "animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { size: 11 }),
                "Load available models"
              ]
            }
          )
        ] }),
        availableModels?.length ? /* @__PURE__ */ jsx(
          CustomSelect,
          {
            value: settingsForm.model,
            onChange: (e) => setSettingsForm((f) => ({ ...f, model: e.target.value })),
            options: [
              { value: "", label: `Recommended default (${settings?.default_models?.[settingsForm.provider]})` },
              ...availableModels.map((m) => ({
                value: m.id,
                label: `${m.label} — ${m.id}`
              }))
            ]
          }
        ) : /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: settingsForm.model,
            onChange: (e) => setSettingsForm((f) => ({ ...f, model: e.target.value })),
            placeholder: settings?.default_models?.[settingsForm.provider] || "Default model",
            className: "w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.12] focus:border-teal-400/50 rounded-xl text-xs font-mono outline-none text-[#F1F5F2] placeholder:text-white/30"
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-2xs text-[rgba(241,245,242,0.5)] mt-1.5 ml-1 leading-relaxed", children: 'Leave empty for the recommended default. Newer Flash models read handwriting better and usually cost less — press "Load available models" to see what your key can use.' })
      ] }),
      settingsMsg && /* @__PURE__ */ jsx("div", { className: `p-3 rounded-xl text-xs font-bold ${settingsMsg.ok ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`, children: settingsMsg.text }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: testSettings,
            disabled: settingsBusy,
            className: "flex-1 px-4 py-2.5 border border-white/15 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-40",
            children: [
              settingsBusy ? /* @__PURE__ */ jsx(Loader2, { className: "animate-spin", size: 14 }) : /* @__PURE__ */ jsx(TestTube2, { size: 14 }),
              "Test Connection"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: saveSettings,
            disabled: settingsBusy,
            className: "flex-1 px-4 py-2.5 bg-[#23C4A6] hover:bg-[#2dd4bf] text-[#062421] rounded-xl text-xs font-bold transition-all disabled:opacity-40",
            children: "Save Settings"
          }
        )
      ] })
    ] })
  ] }) });
  const renderForkDialog = () => {
    if (!forkDialog) return null;
    const { label, handoffUrl, draftAction, draftLabel } = forkDialog;
    const canHandoff = !!handoffUrl;
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-0 z-sticky flex items-center justify-center bg-black/75 backdrop-blur-md p-6 animate-in fade-in duration-fast",
        onClick: () => !confirming && setForkDialog(null),
        children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: "w-full max-w-lg bg-[#0D1412] border border-white/10 rounded-2xl p-7 shadow-2xl animate-in zoom-in-95 duration-normal text-[#F1F5F2]",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0", children: /* @__PURE__ */ jsx(Lock, { size: 20 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("h3", { className: "text-base font-bold text-[#F1F5F2] tracking-tight", children: [
                    "A ",
                    label,
                    " cannot be edited later"
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-[rgba(241,245,242,0.6)] mt-1 leading-relaxed", children: "Once posted it becomes a permanent accounting record. Fixing a mistake then means issuing a return or credit note — you cannot simply change it." })
                ] })
              ] }),
              canHandoff ? /* @__PURE__ */ jsxs("p", { className: "text-xs text-[rgba(241,245,242,0.7)] leading-relaxed mb-5 bg-white/[0.03] border border-white/10 rounded-2xl p-4", children: [
                "Choosing ",
                /* @__PURE__ */ jsx("span", { className: "font-bold text-[#F1F5F2]", children: "Continue" }),
                " takes you to the ",
                label,
                " screen with everything already filled in from this scan. Nothing is saved until you press Save there, so you get one last look at every line."
              ] }) : /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-2.5 text-xs text-[rgba(241,245,242,0.8)] leading-relaxed mb-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 cursor-pointer", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: acknowledgeLocked,
                    onChange: (e) => setAcknowledgeLocked(e.target.checked),
                    className: "mt-0.5 w-4 h-4 rounded accent-[#23C4A6] shrink-0"
                  }
                ),
                /* @__PURE__ */ jsxs("span", { children: [
                  "There is no draft version of a ",
                  label,
                  ", so this will post straight to your ledger. I have checked every line and understand it cannot be edited afterwards."
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2.5", children: [
                canHandoff && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => handleConfirmTransaction({ resolved: true, mode: "handoff" }),
                    disabled: confirming,
                    className: "w-full px-5 py-3 bg-[#23C4A6] hover:bg-[#2dd4bf] text-[#062421] rounded-xl text-xs font-bold transition-all active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2",
                    children: [
                      confirming ? /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsx(ChevronRight, { size: 14 }),
                      "Continue — review on the ",
                      label,
                      " screen"
                    ]
                  }
                ),
                draftAction && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => handleConfirmTransaction({ resolved: true, overrideAction: draftAction, mode: "create" }),
                    disabled: confirming,
                    className: "w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-[#F1F5F2] hover:border-teal-400/40 transition-all active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2",
                    children: [
                      /* @__PURE__ */ jsx(FilePlus2, { size: 14 }),
                      "Make a ",
                      draftLabel,
                      " instead — I can still change it"
                    ]
                  }
                ),
                !canHandoff && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleConfirmTransaction({ resolved: true, mode: "create", acknowledgeLocked: true }),
                    disabled: confirming || !acknowledgeLocked,
                    className: "w-full px-5 py-3 bg-[#23C4A6] hover:bg-[#2dd4bf] text-[#062421] rounded-xl text-xs font-bold transition-all active:scale-[0.99] disabled:opacity-30",
                    children: confirming ? "Posting…" : `Post this ${label} now`
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setForkDialog(null),
                    disabled: confirming,
                    className: "w-full px-5 py-2.5 text-xs font-bold text-[rgba(241,245,242,0.5)] hover:text-white transition-colors disabled:opacity-40",
                    children: "No, take me back to the review"
                  }
                )
              ] })
            ]
          }
        )
      }
    );
  };
  const renderLocked = () => /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col justify-center p-8 overflow-y-auto max-h-full text-[#F1F5F2]", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center mb-6", children: [
      /* @__PURE__ */ jsx("div", { className: "w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mb-3 shrink-0", children: /* @__PURE__ */ jsx(Lock, { size: 28 }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-[#F1F5F2] tracking-tight", children: "AI Scan is Locked" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-[rgba(241,245,242,0.6)] mt-2 max-w-md leading-relaxed", children: ctx?.entitlement?.message || "AI Scan requires the AI add-on. Every store gets 10 free credits to test out the capabilities." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between text-left", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
            /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-4xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/25", children: "BYOK Lifetime" }),
            /* @__PURE__ */ jsxs("div", { className: "text-lg font-bold text-[#F1F5F2]", children: [
              "$5 ",
              /* @__PURE__ */ jsx("span", { className: "text-2xs font-normal text-[rgba(241,245,242,0.5)]", children: "once" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("h5", { className: "text-xs font-bold text-[#F1F5F2] mb-1.5", children: "Bring Your Own Key" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-[rgba(241,245,242,0.55)] leading-relaxed", children: "Provide your own Gemini, OpenAI, Claude, or DeepSeek API key. Bypass platform fees forever." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-2", children: ctx?.entitlement?.reason === "no_key" ? /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: openSettings,
            className: "w-full py-2 bg-[#23C4A6] hover:bg-[#2dd4bf] text-[#062421] rounded-lg text-2xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5",
            children: [
              /* @__PURE__ */ jsx(KeyRound, { size: 12 }),
              " Configure API Key"
            ]
          }
        ) : /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handlePurchaseAddon("ai_byok"),
            disabled: isPurchasingAddon !== null,
            className: "w-full py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-2xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5",
            children: isPurchasingAddon === "ai_byok" ? /* @__PURE__ */ jsx(Loader2, { size: 12, className: "animate-spin" }) : "Buy BYOK Unlock"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "md:col-span-2 p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between text-left", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
          /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-4xs font-bold uppercase tracking-wider bg-[#23C4A6]/15 text-[#93EBD6] border border-[#23C4A6]/25", children: "Managed API" }),
          /* @__PURE__ */ jsx("span", { className: "text-2xs text-[rgba(241,245,242,0.5)]", children: "Monthly Tiers" })
        ] }),
        /* @__PURE__ */ jsx("h5", { className: "text-xs font-bold text-[#F1F5F2] mb-1.5", children: "Managed AI Subscriptions" }),
        /* @__PURE__ */ jsx("p", { className: "text-2xs text-[rgba(241,245,242,0.55)] leading-relaxed mb-3", children: "No API keys or developer setup needed. Access our premium high-speed models instantly. Select a volume:" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: Object.entries(aiTiers).map(([key, tier]) => /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => handlePurchaseAddon(`ai_${key}`),
            className: "p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-teal-400/40 hover:bg-teal-400/[0.05] cursor-pointer transition-all flex flex-col justify-between group",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-0.5", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-1xs font-bold text-[#F1F5F2] group-hover:text-[#93EBD6] transition-colors", children: [
                  "AI ",
                  tier.name || key.toUpperCase()
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-1xs font-bold text-[#23C4A6]", children: [
                  "$",
                  tier.price_monthly
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-4xs text-[rgba(241,245,242,0.45)]", children: [
                (tier.pages || 0).toLocaleString(),
                " scans / ",
                (tier.queries || 0).toLocaleString(),
                " queries"
              ] })
            ]
          },
          key
        )) })
      ] }) })
    ] })
  ] });
  if (typeof document === "undefined") return null;
  const captureBody = /* @__PURE__ */ jsxs(
    "div",
    {
      className: embedded ? "w-full h-full bg-transparent flex flex-col overflow-hidden relative font-sans text-[#F1F5F2]" : "w-full max-w-4xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden h-[720px] relative font-sans text-[#F1F5F2]",
      style: embedded ? {} : { background: "var(--vq-mesh-capture, #080D0C)" },
      children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-96 h-96 bg-[#23C4A6]/5 rounded-full blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-96 h-96 bg-[#23C4A6]/5 rounded-full blur-[100px] pointer-events-none" }),
        showSettings && renderSettingsDrawer(),
        renderForkDialog(),
        !embedded && /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("div", { className: "p-6 bg-black/40 text-[#F1F5F2] shrink-0 flex items-center justify-between border-b border-white/10 relative z-10 backdrop-blur-md", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-2xl bg-[#23C4A6]/20 border border-[#23C4A6]/30 flex items-center justify-center text-[#93EBD6]", children: /* @__PURE__ */ jsx(Sparkles, { size: 20, className: "animate-pulse" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold tracking-tight text-[#F1F5F2]", children: "AI Scan" }),
              /* @__PURE__ */ jsxs("p", { className: "text-2xs text-[#93EBD6] font-bold uppercase tracking-wider mt-0.5 flex flex-wrap items-center gap-x-2", children: [
                /* @__PURE__ */ jsx("span", { children: "AI-Powered Transaction Entry" }),
                (ctx?.entitlement?.mode === "managed" || ctx?.entitlement?.mode === "free") && ctx?.entitlement?.scans_limit > 0 && /* @__PURE__ */ jsxs("span", { className: "text-[rgba(241,245,242,0.6)] normal-case", children: [
                  "(",
                  ctx.entitlement.scans_used,
                  "/",
                  ctx.entitlement.scans_limit,
                  " scans used)"
                ] }),
                ctx?.learning?.total > 0 && /* @__PURE__ */ jsxs(
                  "span",
                  {
                    className: "text-[#93EBD6] normal-case flex items-center gap-1",
                    title: "Corrections your team has made. AI Scan reuses them automatically.",
                    children: [
                      /* @__PURE__ */ jsx(Brain, { size: 11 }),
                      " ",
                      ctx.learning.total,
                      " learned"
                    ]
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: openSettings,
                title: "AI Settings (BYOK)",
                className: "w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-[rgba(241,245,242,0.65)] hover:text-white transition-all active:scale-95",
                children: /* @__PURE__ */ jsx(Settings2, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onClose,
                className: "w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-[rgba(241,245,242,0.65)] hover:text-white transition-all active:scale-95",
                children: /* @__PURE__ */ jsx(X, { size: 16 })
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-hidden flex flex-col relative z-10", children: ctxLoading && !ctx ? /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "animate-spin text-[#23C4A6]", size: 28 }) }) : locked && !extractedData && !successData ? renderLocked() : rateLimit && !extractedData && !successData ? (
          /* RATE LIMITED — we wait, we never auto-retry */
          /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-normal text-[#F1F5F2]", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mb-5", children: /* @__PURE__ */ jsx(Clock, { size: 30 }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-[#F1F5F2] tracking-tight", children: rateLimit.daily ? "Daily AI quota reached" : "Sending a little too fast" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-[rgba(241,245,242,0.6)] mt-2 max-w-sm leading-relaxed", children: rateLimit.message }),
            !rateLimit.daily && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-col items-center gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-4xl font-bold text-[#F1F5F2] tabular-nums", children: [
                rateLimit.seconds,
                "s"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold uppercase tracking-wider text-[rgba(241,245,242,0.5)]", children: "Ready again shortly" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs text-[rgba(241,245,242,0.5)] mt-6 max-w-sm leading-relaxed", children: "Your document is still here — nothing was lost, and no request was wasted. We never retry automatically, because that is what burns through a free-tier key." }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-3", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setRateLimit(null),
                  className: "px-6 py-2.5 border border-white/15 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all active:scale-95",
                  children: "Back to my document"
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: openSettings,
                  className: "px-6 py-2.5 bg-[#23C4A6] hover:bg-[#2dd4bf] text-[#062421] rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5",
                  children: [
                    /* @__PURE__ */ jsx(KeyRound, { size: 13 }),
                    " Use a different key"
                  ]
                }
              )
            ] })
          ] })
        ) : successData ? (
          /* SUCCESS STATE */
          /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-slow text-[#F1F5F2]", children: [
            /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 shadow-inner animate-bounce", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 44 }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-[#F1F5F2] tracking-tight", children: successData.appended ? "Items Added!" : "Transaction Created!" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-[rgba(241,245,242,0.65)] mt-2 max-w-sm", children: successData.message || `Structured ${successData.type} transaction successfully processed.` }),
            /* @__PURE__ */ jsxs("div", { className: "mt-8 bg-white/[0.03] p-6 rounded-2xl border border-white/10 max-w-sm w-full space-y-2 text-left", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-semibold text-[rgba(241,245,242,0.55)]", children: [
                /* @__PURE__ */ jsx("span", { children: "Type:" }),
                /* @__PURE__ */ jsx("span", { className: "text-[#F1F5F2] uppercase font-bold", children: successData.type?.replace(/_/g, " ") })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-semibold text-[rgba(241,245,242,0.55)]", children: [
                /* @__PURE__ */ jsx("span", { children: "Reference:" }),
                /* @__PURE__ */ jsx("span", { className: "text-[#F1F5F2] font-mono", children: successData.reference })
              ] }),
              successData.appended ? /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-semibold text-[rgba(241,245,242,0.55)]", children: [
                /* @__PURE__ */ jsx("span", { children: "Lines Added:" }),
                /* @__PURE__ */ jsx("span", { className: "text-[#F1F5F2] font-bold", children: successData.appended })
              ] }) : null,
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-semibold text-[rgba(241,245,242,0.55)]", children: [
                /* @__PURE__ */ jsx("span", { children: "Total:" }),
                /* @__PURE__ */ jsxs("span", { className: "text-[#23C4A6] font-bold", style: { fontFamily: "var(--vq-font-numeric)" }, children: [
                  "Rs. ",
                  Math.abs(successData.total || 0).toFixed(2)
                ] })
              ] })
            ] }),
            successData.createdProducts?.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-5 max-w-sm w-full text-left bg-white/[0.03] border border-[#23C4A6]/25 rounded-2xl p-4", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-2xs font-bold uppercase tracking-wider text-[#23C4A6] mb-2 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Plus, { size: 11 }),
                successData.createdProducts.length,
                " ",
                tt(successData.createdProducts.length > 1 ? "new products" : "new product"),
                " added to your catalogue"
              ] }),
              /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: successData.createdProducts.map((p) => /* @__PURE__ */ jsxs("li", { className: "text-1xs text-[rgba(241,245,242,0.8)] font-semibold", children: [
                p.name,
                " ",
                /* @__PURE__ */ jsxs("span", { className: "text-[rgba(241,245,242,0.45)] font-mono", children: [
                  "(",
                  p.sku,
                  ")"
                ] })
              ] }, p.id)) }),
              /* @__PURE__ */ jsxs("p", { className: "text-2xs text-[rgba(241,245,242,0.5)] mt-2 leading-relaxed", children: [
                "Check the spelling — a misread name creates a near-duplicate that splits your reports. You can find these under ",
                tt("Products"),
                ', filtered by "created by AI Scan".'
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-8 flex gap-4", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: resetAll,
                  className: "px-6 py-3 border border-white/15 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all active:scale-95",
                  children: "Scan Another"
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: navigateToSuccessDoc,
                  className: "px-8 py-3 bg-[#23C4A6] hover:bg-[#2dd4bf] text-[#062421] rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 flex items-center gap-1.5",
                  children: [
                    /* @__PURE__ */ jsx("span", { children: "View Document" }),
                    /* @__PURE__ */ jsx(ChevronRight, { size: 14 })
                  ]
                }
              )
            ] })
          ] })
        ) : extractedData ? (
          /* AI REVIEW & CONFIRMATION */
          /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col overflow-hidden animate-in fade-in duration-normal", children: [
            /* @__PURE__ */ jsxs("div", { className: "px-8 py-4 bg-white/[0.03] border-b border-white/[0.08] backdrop-blur-md flex flex-wrap items-end gap-5 justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end gap-5", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-3xs font-bold uppercase text-[rgba(241,245,242,0.55)] mb-1", children: "Transaction Intent" }),
                  /* @__PURE__ */ jsx(
                    CustomSelect,
                    {
                      value: extractedData.action,
                      onChange: (e) => {
                        const action = e.target.value;
                        setExtractedData({ ...extractedData, action });
                        setSelectedPartyId("");
                      },
                      disabled: appendMode && !!appendDocId,
                      className: "min-w-[160px]",
                      options: [
                        { value: "sale", label: "Sales Invoice" },
                        { value: "purchase", label: "Purchase" },
                        { value: "expense", label: "Operating Expense" },
                        { value: "return", label: "Sales Return" },
                        { value: "proposal", label: "Proposal" },
                        { value: "pre_invoice", label: tt("Pre-Invoice (Sales Order)") },
                        { value: "pre_purchase", label: tt("Pre-Purchase (Purchase Order)") },
                        { value: "recurring_invoice", label: "Recurring Invoice" },
                        { value: "purchase_return", label: "Purchase Return (Debit Note)" }
                      ]
                    }
                  )
                ] }),
                isExpense ? /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("label", { className: "block text-3xs font-bold uppercase text-[rgba(241,245,242,0.55)] mb-1", children: [
                    "Expense Category ",
                    /* @__PURE__ */ jsx("span", { className: "text-rose-400", children: "*" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    CustomSelect,
                    {
                      value: selectedCategoryId,
                      onChange: (e) => setSelectedCategoryId(e.target.value),
                      placeholder: "-- Select category --",
                      isError: !selectedCategoryId,
                      className: "min-w-[180px]",
                      options: [
                        { value: "", label: "-- Select category --" },
                        ...(ctx?.expense_categories || []).map((cat) => ({
                          value: cat.id,
                          label: cat.name
                        }))
                      ]
                    }
                  ),
                  extractedData.expense_category && /* @__PURE__ */ jsxs("p", { className: "text-3xs text-[#23C4A6] font-bold mt-1", children: [
                    "AI suggested: ",
                    extractedData.expense_category
                  ] })
                ] }) : /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("label", { className: "block text-3xs font-bold uppercase text-[rgba(241,245,242,0.55)] mb-1", children: [
                    partyType === "supplier" ? tt("Supplier") : tt("Customer"),
                    " ",
                    /* @__PURE__ */ jsx("span", { className: "text-rose-400", children: "*" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 font-sans", children: [
                    /* @__PURE__ */ jsx(User, { size: 12, className: "text-[rgba(241,245,242,0.45)]" }),
                    /* @__PURE__ */ jsx(
                      CustomSelect,
                      {
                        value: selectedPartyId,
                        onChange: (e) => setSelectedPartyId(e.target.value),
                        placeholder: `-- Select ${partyType} --`,
                        isError: !selectedPartyId,
                        className: "min-w-[200px]",
                        options: [
                          { value: "", label: `-- Select ${partyType} --` },
                          ...(extractedData.party_candidates || []).length > 0 ? [{
                            groupLabel: `AI matches for "${extractedData.party}"`,
                            options: extractedData.party_candidates.map((c) => ({
                              value: c.id,
                              label: c.name,
                              confidence: c.confidence
                            }))
                          }] : [],
                          {
                            groupLabel: `All ${partyType}s`,
                            options: partyList.filter((p) => !candidateIds.has(String(p.id))).map((p) => ({
                              value: p.id,
                              label: p.name
                            }))
                          }
                        ]
                      }
                    )
                  ] }),
                  extractedData.party && /* @__PURE__ */ jsxs("p", { className: "text-3xs text-[#23C4A6] font-bold mt-1", children: [
                    'AI read: "',
                    extractedData.party,
                    '"'
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-3xs font-bold uppercase text-[rgba(241,245,242,0.55)] mb-1", children: "Payment Method" }),
                /* @__PURE__ */ jsx("div", { className: "flex gap-1.5", children: (isExpense ? ["cash", "bank"] : ["cash", "credit", "bank"]).map((method) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setPaymentMethod(method),
                    className: `px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${paymentMethod === method ? "bg-[#23C4A6] border-[#23C4A6] text-[#062421] shadow-[0_0_10px_rgba(35,196,166,0.3)]" : "bg-white/[0.04] border-white/[0.08] text-[rgba(241,245,242,0.7)] hover:bg-white/[0.08] hover:text-[#F1F5F2]"}`,
                    children: method
                  },
                  method
                )) })
              ] })
            ] }),
            appendMode && appendDocId && /* @__PURE__ */ jsxs("div", { className: "px-8 py-2.5 bg-[#23C4A6]/10 border-b border-[#23C4A6]/20 flex items-center gap-2 text-xs font-bold text-[#23C4A6]", children: [
              /* @__PURE__ */ jsx(Layers, { size: 13 }),
              "Items will be ADDED to the selected existing ",
              appendDocType.replace(/_/g, " "),
              " — no new document will be created."
            ] }),
            extractedData.party_preselected?.type_mismatch && /* @__PURE__ */ jsxs("div", { className: "px-8 py-2.5 bg-rose-500/10 border-b border-rose-500/20 flex items-center gap-2 text-xs font-bold text-rose-400", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { size: 13 }),
              "You chose the ",
              extractedData.party_preselected.type,
              ' "',
              extractedData.party_preselected.name,
              '", but this looks like a ',
              partyType,
              " document. Pick the right ",
              partyType,
              " below."
            ] }),
            !isAppending && currentPolicy?.locking && /* @__PURE__ */ jsxs("div", { className: "px-8 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs font-bold text-amber-400", children: [
              /* @__PURE__ */ jsx(Lock, { size: 13 }),
              currentPolicy.handoff_url ? `A ${currentPolicy.label} cannot be edited once posted — you will get a final review on the ${currentPolicy.label} screen before anything is saved.` : `A ${currentPolicy.label} posts a permanent ledger entry that cannot be edited afterwards.`
            ] }),
            extractedData.meta?.learned_lines > 0 && /* @__PURE__ */ jsxs("div", { className: "px-8 py-2.5 bg-[#23C4A6]/10 border-b border-[#23C4A6]/20 flex items-center gap-2 text-xs font-bold text-[#23C4A6]", children: [
              /* @__PURE__ */ jsx(Brain, { size: 13 }),
              extractedData.meta.learned_lines,
              " line",
              extractedData.meta.learned_lines > 1 ? "s were" : " was",
              " matched from what your store taught AI Scan previously — already filled in below."
            ] }),
            typeof extractedData.document_confidence === "number" && extractedData.document_confidence < 70 && /* @__PURE__ */ jsxs("div", { className: "px-8 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs font-bold text-amber-400", children: [
              /* @__PURE__ */ jsx(Eye, { size: 13 }),
              "This document was hard to read (",
              extractedData.document_confidence,
              "% legible). Check the amber and red lines carefully before posting."
            ] }),
            (extractedData.date || extractedData.reference || extractedData.notes || extractedData.meta) && /* @__PURE__ */ jsxs("div", { className: "px-8 py-2.5 border-b border-white/[0.08] bg-black/20 flex flex-wrap items-center gap-4 text-2xs font-semibold text-[rgba(241,245,242,0.5)]", children: [
              extractedData.date && /* @__PURE__ */ jsxs("span", { children: [
                "Date read: ",
                /* @__PURE__ */ jsx("span", { className: "text-[#F1F5F2] font-semibold", children: extractedData.date })
              ] }),
              extractedData.reference && /* @__PURE__ */ jsxs("span", { children: [
                "Ref: ",
                /* @__PURE__ */ jsx("span", { className: "text-[#F1F5F2] font-mono", children: extractedData.reference })
              ] }),
              extractedData.notes && /* @__PURE__ */ jsxs("span", { className: "truncate max-w-md", children: [
                "Notes: ",
                /* @__PURE__ */ jsx("span", { className: "text-[#F1F5F2]", children: extractedData.notes })
              ] }),
              extractedData.meta?.api_requests ? /* @__PURE__ */ jsxs("span", { className: "ml-auto flex items-center gap-1 text-[#23C4A6]", title: "One scan costs exactly one AI request", children: [
                /* @__PURE__ */ jsx(Zap, { size: 11 }),
                extractedData.meta.api_requests,
                " API request",
                extractedData.meta.api_requests > 1 ? "s" : "",
                extractedData.meta.model ? ` · ${extractedData.meta.model}` : ""
              ] }) : null
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-6 custom-scrollbar", children: [
              error && /* @__PURE__ */ jsxs("div", { className: "mb-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-bold flex items-start gap-2", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "text-rose-400 mt-0.5 shrink-0" }),
                /* @__PURE__ */ jsx("span", { children: error })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-3", children: extractedData.items.map((item, idx) => {
                const isNew = !!item.create_new;
                const isLearned = !!item.learned && !isNew;
                const isHigh = item.confidence >= 90;
                const isMedium = item.confidence >= 60 && item.confidence < 90;
                const unclearReading = item.needs_review || item.read_confidence !== null && item.read_confidence < 70;
                return /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `p-4 rounded-2xl border backdrop-blur-sm transition-all flex flex-col gap-3 ${isLearned ? "bg-[#23C4A6]/[0.04] border-[#23C4A6]/30" : isNew ? "bg-sky-500/[0.04] border-sky-500/30" : isHigh ? "bg-emerald-500/[0.03] border-emerald-500/20" : isMedium ? "bg-amber-500/[0.03] border-amber-500/20" : "bg-rose-500/[0.03] border-rose-500/20"}`,
                    children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                          /* @__PURE__ */ jsxs("span", { className: "text-2xs font-bold text-[rgba(241,245,242,0.55)] uppercase tracking-wider", children: [
                            "AI read: ",
                            /* @__PURE__ */ jsxs("span", { className: "text-[#F1F5F2]", children: [
                              '"',
                              item.raw_name,
                              '"'
                            ] })
                          ] }),
                          unclearReading && /* @__PURE__ */ jsxs("span", { className: "px-1.5 py-0.5 rounded-full text-4xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1", children: [
                            /* @__PURE__ */ jsx(Eye, { size: 9 }),
                            " Check this reading"
                          ] })
                        ] }),
                        isLearned && item.match_reason && /* @__PURE__ */ jsxs("span", { className: "text-2xs font-bold text-[#23C4A6] flex items-center gap-1 mt-0.5", children: [
                          /* @__PURE__ */ jsx(Brain, { size: 10 }),
                          " Remembered — ",
                          item.match_reason
                        ] }),
                        !isExpense ? /* @__PURE__ */ jsxs("div", { className: "mt-2 space-y-2", children: [
                          /* @__PURE__ */ jsx(
                            CustomSelect,
                            {
                              value: isNew ? "__create_new__" : item.product_id || "",
                              onChange: (e) => handleProductPick(idx, e.target.value),
                              placeholder: tt("-- Match a store product --"),
                              options: [
                                { value: "", label: tt("-- Match a store product --"), disabled: true },
                                ...(item.candidates || []).map((c) => ({
                                  value: c.id,
                                  label: c.name,
                                  learned: c.learned,
                                  confidence: c.confidence,
                                  sku: c.sku
                                })),
                                { value: "__create_new__", label: tt("＋ Create as NEW product…") }
                              ]
                            }
                          ),
                          isNew && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 bg-black/30 rounded-xl border border-white/10", children: [
                            /* @__PURE__ */ jsxs("div", { className: "sm:col-span-3", children: [
                              /* @__PURE__ */ jsx("label", { className: "block text-3xs font-bold text-[#23C4A6] uppercase", children: tt("New Product Name") }),
                              /* @__PURE__ */ jsx(
                                "input",
                                {
                                  type: "text",
                                  value: item.create_new.name,
                                  onChange: (e) => handleItemChange(idx, "create_new", { ...item.create_new, name: e.target.value }),
                                  className: "w-full mt-1 px-2.5 py-1.5 bg-white/[0.05] border border-white/10 rounded-lg text-xs font-bold text-[#F1F5F2] outline-none focus:border-[#23C4A6] focus:ring-1 focus:ring-[#23C4A6]"
                                }
                              )
                            ] }),
                            /* @__PURE__ */ jsxs("div", { children: [
                              /* @__PURE__ */ jsx("label", { className: "block text-3xs font-bold text-[#23C4A6] uppercase", children: "Sale Price" }),
                              /* @__PURE__ */ jsx(
                                "input",
                                {
                                  type: "number",
                                  min: "0",
                                  step: "any",
                                  value: item.create_new.price,
                                  onChange: (e) => handleItemChange(idx, "create_new", { ...item.create_new, price: e.target.value }),
                                  className: "w-full mt-1 px-2.5 py-1.5 bg-white/[0.05] border border-white/10 rounded-lg text-xs font-bold text-[#F1F5F2] outline-none focus:border-[#23C4A6] focus:ring-1 focus:ring-[#23C4A6]"
                                }
                              )
                            ] }),
                            /* @__PURE__ */ jsxs("div", { children: [
                              /* @__PURE__ */ jsx("label", { className: "block text-3xs font-bold text-[#23C4A6] uppercase", children: "Cost Price" }),
                              /* @__PURE__ */ jsx(
                                "input",
                                {
                                  type: "number",
                                  min: "0",
                                  step: "any",
                                  value: item.create_new.cost_price,
                                  onChange: (e) => handleItemChange(idx, "create_new", { ...item.create_new, cost_price: e.target.value }),
                                  className: "w-full mt-1 px-2.5 py-1.5 bg-white/[0.05] border border-white/10 rounded-lg text-xs font-bold text-[#F1F5F2] outline-none focus:border-[#23C4A6] focus:ring-1 focus:ring-[#23C4A6]"
                                }
                              )
                            ] })
                          ] }),
                          !isNew && (!item.candidates || item.candidates.length === 0) && /* @__PURE__ */ jsxs("span", { className: "text-rose-400 text-xs font-bold flex items-center gap-1 mt-1", children: [
                            /* @__PURE__ */ jsx(AlertTriangle, { size: 12 }),
                            tt('No matches found — use "Create as NEW product".')
                          ] })
                        ] }) : /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs font-bold text-[#F1F5F2]", children: item.raw_name })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("label", { className: "block text-3xs font-bold text-[rgba(241,245,242,0.5)] uppercase", children: "Quantity" }),
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "number",
                              value: item.qty,
                              onChange: (e) => handleItemChange(idx, "qty", e.target.value),
                              className: "w-20 px-2 py-1.5 bg-white/[0.05] border border-white/10 rounded-lg text-xs font-bold text-center text-[#F1F5F2] outline-none focus:border-[#23C4A6] focus:ring-1 focus:ring-[#23C4A6]",
                              min: "0.0001",
                              step: "any",
                              style: { fontFamily: "var(--vq-font-numeric)" }
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("label", { className: "block text-3xs font-bold text-[rgba(241,245,242,0.5)] uppercase", children: "Unit Price" }),
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "number",
                              value: item.unit_price ?? 0,
                              onChange: (e) => handleItemChange(idx, "unit_price", e.target.value),
                              className: "w-24 px-2 py-1.5 bg-white/[0.05] border border-white/10 rounded-lg text-xs font-bold text-center text-[#F1F5F2] outline-none focus:border-[#23C4A6] focus:ring-1 focus:ring-[#23C4A6]",
                              min: "0",
                              step: "any",
                              style: { fontFamily: "var(--vq-font-numeric)" }
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "pt-4 flex items-center gap-2", children: [
                          /* @__PURE__ */ jsx("span", { className: `px-2 py-1 text-4xs font-bold uppercase rounded-full border ${isLearned ? "bg-[#23C4A6]/15 text-[#23C4A6] border-[#23C4A6]/30" : isNew ? "bg-sky-500/15 text-sky-300 border-sky-500/30" : isHigh ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : isMedium ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "bg-rose-500/15 text-rose-300 border-rose-500/30"}`, children: isLearned ? "Learned" : isNew ? tt("New Product") : `${item.confidence}% Match` }),
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              onClick: () => removeItem(idx),
                              title: "Remove line",
                              className: "w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-[rgba(241,245,242,0.5)] hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all",
                              children: /* @__PURE__ */ jsx(Trash2, { size: 12 })
                            }
                          )
                        ] })
                      ] })
                    ] })
                  },
                  idx
                );
              }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 border-t border-white/[0.08] shrink-0 flex items-center justify-between bg-black/40 backdrop-blur-md", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[rgba(241,245,242,0.5)] font-medium", children: "Estimated Gross:" }),
                /* @__PURE__ */ jsxs("span", { className: "font-bold text-[#F1F5F2] text-base ml-1.5", style: { fontFamily: "var(--vq-font-numeric)" }, children: [
                  "Rs. ",
                  calculateGrossTotal()
                ] }),
                !partyReady ? /* @__PURE__ */ jsx("span", { className: "block text-2xs text-rose-400 font-bold mt-0.5", children: isExpense ? "Select an expense category to continue." : `Select the ${partyType} to continue.` }) : /* @__PURE__ */ jsxs("span", { className: "block text-2xs text-[#23C4A6] font-bold mt-0.5 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Brain, { size: 10 }),
                  " Your choices here are remembered for this store — next scan will fill them in for you."
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      setExtractedData(null);
                      setError(null);
                    },
                    className: "px-6 py-2.5 border border-white/15 rounded-xl text-xs font-bold text-[rgba(241,245,242,0.8)] hover:bg-white/10 transition-all active:scale-95",
                    children: "Re-Intake"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleConfirmTransaction(),
                    disabled: confirming || !itemsReady || !partyReady || !appendReady,
                    className: "px-8 py-2.5 bg-[#23C4A6] hover:bg-[#2dd4bf] text-[#062421] rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(35,196,166,0.35)] transition-all active:scale-95 disabled:opacity-30 disabled:shadow-none",
                    children: confirming ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                      /* @__PURE__ */ jsx(Loader2, { className: "animate-spin", size: 14 }),
                      /* @__PURE__ */ jsx("span", { children: "Working..." })
                    ] }) : /* @__PURE__ */ jsx("span", { children: isAppending ? "Add to Document" : currentPolicy?.locking ? currentPolicy.handoff_url ? "Review & Finalise…" : "Post Transaction…" : `Create ${currentPolicy?.label || "Document"}` })
                  }
                )
              ] })
            ] })
          ] })
        ) : loading ? (
          /* LOADING */
          /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-normal", children: [
            /* @__PURE__ */ jsx("div", { className: "relative mb-6 flex items-center justify-center", children: /* @__PURE__ */ jsx(ThinkingOrb, { state: "shaping", size: 68, theme: "dark" }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-[#F1F5F2] tracking-tight", children: "AI Intake in Progress..." }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-[rgba(241,245,242,0.6)] mt-2 max-w-[320px] leading-relaxed", children: [
              "Reading your ",
              activeTab === "image" ? `document (${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""})` : activeTab === "audio" ? "voice memo" : "text",
              " and matching items against your catalog..."
            ] })
          ] })
        ) : (
          /* INTAKE */
          /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 px-8 pt-5 pb-4 shrink-0 border-b border-white/[0.08]", children: [
              /* @__PURE__ */ jsx("div", { className: "inline-flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md", children: [
                { key: "image", icon: Camera, label: "Photos / PDF" },
                { key: "audio", icon: Mic, label: "Voice Memo" },
                { key: "text", icon: Type, label: "Text" }
              ].map((tab) => {
                const on = activeTab === tab.key;
                return /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      setActiveTab(tab.key);
                      setError(null);
                    },
                    className: `flex items-center gap-2 rounded-xl transition-all h-10 px-4 text-xs font-bold ${on ? "bg-[#23C4A6]/15 text-[#93EBD6] border border-[#23C4A6]/30 shadow-[0_0_12px_rgba(35,196,166,0.2)]" : "text-[rgba(241,245,242,0.6)] hover:text-[#F1F5F2] hover:bg-white/[0.03] border border-transparent"}`,
                    children: [
                      /* @__PURE__ */ jsx(tab.icon, { size: 15 }),
                      /* @__PURE__ */ jsx("span", { children: tab.label })
                    ]
                  },
                  tab.key
                );
              }) }),
              (ctx?.entitlement?.mode === "managed" || ctx?.entitlement?.mode === "free") && ctx?.entitlement?.scans_limit > 0 && /* @__PURE__ */ jsxs("span", { className: "text-xs text-[rgba(241,245,242,0.55)] px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]", style: { fontFamily: "var(--vq-font-numeric)" }, children: [
                ctx.entitlement.scans_used,
                "/",
                ctx.entitlement.scans_limit,
                " scans"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-8 custom-scrollbar", children: [
              error && /* @__PURE__ */ jsxs("div", { className: "mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-bold flex items-start gap-2 animate-in slide-in-from-top-2", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "text-rose-400 mt-0.5 shrink-0" }),
                /* @__PURE__ */ jsx("span", { children: error })
              ] }),
              renderAdvancedControls(),
              activeTab === "image" ? (
                /* MULTI-PHOTO TAB */
                /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col justify-between min-h-[300px]", children: [
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      onDragEnter: handleDrag,
                      onDragOver: handleDrag,
                      onDragLeave: handleDrag,
                      onDrop: handleDrop,
                      className: `flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all min-h-[260px] ${dragActive ? "border-[#23C4A6] bg-[#23C4A6]/10 scale-[0.99]" : selectedFiles.length > 0 ? "border-white/15 bg-black/20 backdrop-blur-sm" : "border-white/15 hover:border-[#23C4A6]/50 bg-white/[0.02] hover:bg-white/[0.04]"}`,
                      children: [
                        selectedFiles.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 justify-center", children: [
                            selectedFiles.map((entry, idx) => /* @__PURE__ */ jsxs("div", { className: "relative w-28 h-28 rounded-2xl overflow-hidden border border-white/15 bg-black/30 flex items-center justify-center shadow-md", children: [
                              entry.preview ? /* @__PURE__ */ jsx("img", { src: entry.preview, alt: `Page ${idx + 1}`, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxs("div", { className: "text-center px-2", children: [
                                /* @__PURE__ */ jsx(FileText, { className: "text-[#23C4A6] mx-auto mb-1", size: 26 }),
                                /* @__PURE__ */ jsx("p", { className: "text-4xs font-bold text-[rgba(241,245,242,0.7)] truncate max-w-[96px]", children: entry.file.name })
                              ] }),
                              /* @__PURE__ */ jsx("span", { className: "absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/70 border border-white/10 text-white text-4xs font-bold rounded-md", children: idx + 1 }),
                              /* @__PURE__ */ jsx(
                                "button",
                                {
                                  onClick: () => removeFile(idx),
                                  className: "absolute top-1.5 right-1.5 w-5 h-5 bg-black/70 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-colors",
                                  children: /* @__PURE__ */ jsx(X, { size: 10 })
                                }
                              )
                            ] }, idx)),
                            selectedFiles.length < maxFiles && /* @__PURE__ */ jsxs("label", { htmlFor: "capture-file-picker", className: "w-28 h-28 rounded-2xl border-2 border-dashed border-white/20 hover:border-[#23C4A6]/60 flex flex-col items-center justify-center text-[rgba(241,245,242,0.6)] hover:text-[#23C4A6] cursor-pointer transition-all bg-white/[0.02]", children: [
                              /* @__PURE__ */ jsx(Plus, { size: 22 }),
                              /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold mt-1", children: "Add More" })
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxs("p", { className: "text-center text-2xs text-[rgba(241,245,242,0.5)] font-semibold mt-4", children: [
                            selectedFiles.length,
                            "/",
                            maxFiles,
                            " files — multiple photos are treated as pages of ONE document."
                          ] })
                        ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center max-w-xs", children: [
                          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#23C4A6] mx-auto mb-4 shadow-[0_0_15px_rgba(35,196,166,0.15)]", children: /* @__PURE__ */ jsx(Upload, { size: 28 }) }),
                          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-[#F1F5F2]", children: "Upload invoice / receipt / handwritten note" }),
                          /* @__PURE__ */ jsxs("p", { className: "text-xs text-[rgba(241,245,242,0.6)] mt-1.5 leading-relaxed", children: [
                            "Drag & drop up to ",
                            maxFiles,
                            " photos or PDFs (printed OR handwritten), or click to browse. Long receipt? Snap it in sections."
                          ] }),
                          /* @__PURE__ */ jsx(
                            "label",
                            {
                              htmlFor: "capture-file-picker",
                              className: "mt-6 inline-block px-6 py-2.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-[#F1F5F2] rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md",
                              children: "Browse Files"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "file",
                            accept: "image/jpeg,image/png,image/webp,.pdf",
                            multiple: true,
                            onChange: handleFileChange,
                            className: "hidden",
                            id: "capture-file-picker"
                          }
                        )
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "pt-6 shrink-0 text-right", children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: handleExtract,
                      disabled: selectedFiles.length === 0 || loading || !!rateLimit,
                      className: "px-8 py-3.5 bg-[#23C4A6] hover:bg-[#2dd4bf] active:scale-95 text-[#062421] font-bold rounded-xl text-xs shadow-[0_0_20px_rgba(35,196,166,0.35)] transition-all disabled:opacity-30 disabled:shadow-none",
                      children: loading ? "Scanning…" : `Scan ${selectedFiles.length || ""} ${selectedFiles.length === 1 ? "page" : "pages"} — 1 AI request`
                    }
                  ) })
                ] })
              ) : activeTab === "audio" ? (
                /* VOICE TAB — record OR upload */
                /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col justify-between min-h-[300px]", children: [
                  /* @__PURE__ */ jsx("div", { className: "flex-1 border border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 bg-white/[0.02] backdrop-blur-sm", children: audioBlob ? /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-[#23C4A6]/10 border border-[#23C4A6]/25 rounded-2xl flex items-center justify-center text-[#23C4A6] mx-auto mb-4 animate-pulse shadow-[0_0_15px_rgba(35,196,166,0.2)]", children: /* @__PURE__ */ jsx(Mic, { size: 30 }) }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-[#F1F5F2]", children: audioSource === "uploaded" ? "Audio File Ready" : "Voice Memo Recorded" }),
                    /* @__PURE__ */ jsx("p", { className: "text-2xs text-[rgba(241,245,242,0.6)] mt-1", children: audioSource === "uploaded" && audioBlob.name ? audioBlob.name : "Audio capture ready for analysis" }),
                    /* @__PURE__ */ jsx("audio", { src: URL.createObjectURL(audioBlob), controls: true, className: "mt-4 mx-auto max-w-[260px] h-9" }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => {
                          setAudioBlob(null);
                          setAudioSource(null);
                        },
                        className: "mt-6 px-4 py-2 border border-rose-500/30 rounded-xl text-2xs font-bold text-rose-300 hover:bg-rose-500/10 transition-all",
                        children: "Delete Audio"
                      }
                    )
                  ] }) : recording ? /* @__PURE__ */ jsxs("div", { className: "text-center space-y-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "relative w-20 h-20 mx-auto flex items-center justify-center", children: [
                      /* @__PURE__ */ jsx("div", { className: "absolute w-20 h-20 bg-rose-500/20 rounded-full animate-ping opacity-60" }),
                      /* @__PURE__ */ jsx("div", { className: "absolute w-16 h-16 bg-rose-500/30 rounded-full animate-pulse" }),
                      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.4)] relative z-20", children: /* @__PURE__ */ jsx("div", { className: "w-4 h-4 bg-white rounded-sm" }) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-rose-400 tracking-tight", style: { fontFamily: "var(--vq-font-numeric)" }, children: formatTime(recordingTime) }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-[rgba(241,245,242,0.6)] mt-1.5", children: "Microphone active. Speak transaction items..." })
                    ] }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: stopRecording,
                        className: "px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95",
                        children: "Stop Recording"
                      }
                    )
                  ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center max-w-sm space-y-4", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-white/[0.04] border border-white/10 rounded-2xl flex items-center justify-center text-[#23C4A6] mx-auto shadow-[0_0_15px_rgba(35,196,166,0.15)]", children: /* @__PURE__ */ jsx(Mic, { size: 26 }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-[#F1F5F2]", children: "Voice memo" }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-[rgba(241,245,242,0.6)] leading-relaxed mt-1", children: 'Record now, or upload an existing audio file (e.g. "Invoice received from Vendor XYZ: 10 Cokes, 3 units of Pepsi")' })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-3 pt-2", children: [
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: startRecording,
                          className: "px-5 py-3 bg-[#23C4A6] hover:bg-[#2dd4bf] text-[#062421] rounded-xl text-xs font-bold transition-all active:scale-95 shadow-[0_0_15px_rgba(35,196,166,0.3)] flex items-center gap-1.5",
                          children: [
                            /* @__PURE__ */ jsx(Mic, { size: 14 }),
                            /* @__PURE__ */ jsx("span", { children: "Start Recording" })
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        "label",
                        {
                          htmlFor: "capture-audio-picker",
                          className: "px-5 py-3 border border-white/15 bg-white/[0.04] rounded-xl text-xs font-bold text-[#F1F5F2] hover:bg-white/[0.08] cursor-pointer transition-all active:scale-95 flex items-center gap-1.5",
                          children: [
                            /* @__PURE__ */ jsx(Upload, { size: 14 }),
                            /* @__PURE__ */ jsx("span", { children: "Upload Audio" })
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "file",
                          accept: "audio/*",
                          onChange: handleAudioUpload,
                          className: "hidden",
                          id: "capture-audio-picker"
                        }
                      )
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsx("div", { className: "pt-6 shrink-0 text-right", children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: handleExtract,
                      disabled: !audioBlob || loading || !!rateLimit,
                      className: "px-8 py-3.5 bg-[#23C4A6] hover:bg-[#2dd4bf] active:scale-95 text-[#062421] font-bold rounded-xl text-xs shadow-[0_0_20px_rgba(35,196,166,0.35)] transition-all disabled:opacity-30 disabled:shadow-none",
                      children: "Proceed to Extract"
                    }
                  ) })
                ] })
              ) : (
                /* TEXT TAB */
                /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col justify-between min-h-[300px]", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 border border-white/10 rounded-2xl p-6 bg-white/[0.02] backdrop-blur-sm flex flex-col", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold uppercase tracking-wider text-[rgba(241,245,242,0.55)] block mb-2.5", children: "Type or paste your transaction text" }),
                    /* @__PURE__ */ jsx(
                      "textarea",
                      {
                        value: textInput,
                        onChange: (e) => setTextInput(e.target.value),
                        placeholder: "e.g.\nBought from Ali Traders:\n10 x Coca Cola 1.5L @ 180\n5 x Lays Masala @ 50\n2 cartons Nestle Water",
                        maxLength: 2e4,
                        className: "flex-1 min-h-[180px] w-full p-4 bg-black/25 border border-white/10 rounded-2xl text-sm text-[#F1F5F2] placeholder-[rgba(241,245,242,0.3)] outline-none resize-none focus:ring-2 focus:ring-[#23C4A6]/30 focus:border-[#23C4A6]/60 font-medium leading-relaxed"
                      }
                    ),
                    /* @__PURE__ */ jsx("p", { className: "text-2xs text-[rgba(241,245,242,0.5)] font-semibold mt-2.5", children: "Works with item lists, copied invoices, WhatsApp order messages — any language." })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "pt-6 shrink-0 text-right", children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: handleExtract,
                      disabled: !textInput.trim() || loading || !!rateLimit,
                      className: "px-8 py-3.5 bg-[#23C4A6] hover:bg-[#2dd4bf] active:scale-95 text-[#062421] font-bold rounded-xl text-xs shadow-[0_0_20px_rgba(35,196,166,0.35)] transition-all disabled:opacity-30 disabled:shadow-none",
                      children: "Proceed to Extract"
                    }
                  ) })
                ] })
              )
            ] })
          ] })
        ) })
      ]
    }
  );
  if (embedded) return captureBody;
  return createPortal(
    /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-toast flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-normal font-sans", children: captureBody }),
    document.body
  );
}
function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  searchThreshold = 5,
  disabledOptions = [],
  isError = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const flatOptions = useMemo(() => {
    const list = [];
    if (!options) return list;
    options.forEach((opt) => {
      if (opt.groupLabel) {
        (opt.options || []).forEach((subOpt) => {
          list.push({ ...subOpt, groupLabel: opt.groupLabel });
        });
      } else {
        list.push(opt);
      }
    });
    return list;
  }, [options]);
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);
  const filteredOptions = useMemo(() => {
    if (!options) return [];
    if (!search.trim()) return options;
    const query = search.toLowerCase();
    return options.map((opt) => {
      if (opt.groupLabel) {
        const subFiltered = (opt.options || []).filter(
          (subOpt) => String(subOpt.label || "").toLowerCase().includes(query) || String(subOpt.value || "").toLowerCase().includes(query) || String(subOpt.sku || "").toLowerCase().includes(query)
        );
        return subFiltered.length > 0 ? { ...opt, options: subFiltered } : null;
      } else {
        const matches = String(opt.label || "").toLowerCase().includes(query) || String(opt.value || "").toLowerCase().includes(query) || String(opt.sku || "").toLowerCase().includes(query);
        return matches ? opt : null;
      }
    }).filter(Boolean);
  }, [options, search]);
  const totalOptionsCount = flatOptions.length;
  const selectedOption = flatOptions.find((o) => String(o.value) === String(value));
  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
    }
  };
  return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: `relative select-none ${className}`, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        disabled,
        onClick: () => !disabled && setIsOpen(!isOpen),
        onKeyDown: handleKeyDown,
        className: `w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] border rounded-xl text-xs font-semibold text-[#F1F5F2] transition-all text-left outline-none disabled:opacity-40 disabled:cursor-not-allowed ${isError ? "border-rose-500/60" : isOpen ? "border-[#23C4A6]/60 bg-white/[0.08] shadow-[0_0_12px_rgba(35,196,166,0.15)] ring-1 ring-[#23C4A6]/30" : "border-white/10 hover:border-white/20"}`,
        children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1 truncate", children: selectedOption ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 truncate", children: [
            selectedOption.learned && /* @__PURE__ */ jsx(Brain, { size: 12, className: "text-[#23C4A6] shrink-0" }),
            /* @__PURE__ */ jsx("span", { className: "truncate", children: selectedOption.label }),
            selectedOption.confidence !== void 0 && /* @__PURE__ */ jsxs("span", { className: "text-3xs bg-[#23C4A6]/15 text-[#23C4A6] border border-[#23C4A6]/30 px-1 py-0.5 rounded font-bold shrink-0", children: [
              selectedOption.confidence,
              "%"
            ] }),
            selectedOption.sku && /* @__PURE__ */ jsxs("span", { className: "text-3xs text-[rgba(241,245,242,0.45)] font-mono shrink-0", children: [
              "(SKU: ",
              selectedOption.sku,
              ")"
            ] })
          ] }) : /* @__PURE__ */ jsx("span", { className: "text-[rgba(241,245,242,0.4)] font-normal", children: placeholder }) }),
          /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: `text-[rgba(241,245,242,0.5)] transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-[#23C4A6]" : ""}` })
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsxs("div", { className: "absolute left-0 mt-1.5 min-w-full w-max max-w-[340px] max-h-72 bg-[#0c1412]/95 border border-white/15 rounded-[14px] shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(35,196,166,0.06)] backdrop-blur-2xl overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-top-1 duration-150 p-1.5", children: [
      totalOptionsCount > searchThreshold && /* @__PURE__ */ jsxs("div", { className: "p-2 mb-1 border border-white/10 rounded-[10px] flex items-center gap-2 bg-white/[0.04]", children: [
        /* @__PURE__ */ jsx(Search, { size: 12, className: "text-[rgba(241,245,242,0.45)] shrink-0" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "Search...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "w-full bg-transparent border-0 p-0 text-xs text-[#F1F5F2] placeholder-[rgba(241,245,242,0.4)] focus:ring-0 outline-none",
            autoFocus: true
          }
        ),
        search && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setSearch(""), className: "text-[rgba(241,245,242,0.5)] hover:text-white transition-colors", children: /* @__PURE__ */ jsx(X, { size: 10 }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-y-auto flex-1 max-h-56 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10 pr-0.5", children: filteredOptions.length === 0 ? /* @__PURE__ */ jsx("div", { className: "px-3 py-4 text-center text-xs text-[rgba(241,245,242,0.45)]", children: "No results found" }) : filteredOptions.map((opt, groupIdx) => {
        if (opt.groupLabel) {
          return /* @__PURE__ */ jsxs("div", { className: "mb-1.5 last:mb-0", children: [
            /* @__PURE__ */ jsx("div", { className: "px-2.5 py-1 text-3xs font-bold uppercase tracking-wider text-[rgba(241,245,242,0.4)]", children: opt.groupLabel }),
            /* @__PURE__ */ jsx("div", { className: "mt-0.5 space-y-0.5", children: (opt.options || []).map((subOpt) => {
              const isSelected = String(subOpt.value) === String(value);
              const isOptDisabled = disabledOptions.includes(subOpt.value) || subOpt.disabled;
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  disabled: isOptDisabled,
                  onClick: () => {
                    if (!isOptDisabled) {
                      onChange({ target: { value: subOpt.value } });
                      setIsOpen(false);
                      setSearch("");
                    }
                  },
                  className: `w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-[10px] transition-all duration-150 ${isSelected ? "bg-[#23C4A6]/15 text-[#93EBD6] font-bold border border-[#23C4A6]/30 shadow-[0_0_12px_rgba(35,196,166,0.1)]" : "text-[rgba(241,245,242,0.85)] hover:bg-white/[0.07] hover:text-white border border-transparent"} ${isOptDisabled ? "opacity-40 cursor-not-allowed" : ""}`,
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5 truncate mr-2", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 truncate", children: [
                        subOpt.learned && /* @__PURE__ */ jsx(Brain, { size: 11, className: isSelected ? "text-[#93EBD6]" : "text-[#23C4A6]" }),
                        /* @__PURE__ */ jsx("span", { className: "truncate", children: subOpt.label }),
                        subOpt.confidence !== void 0 && /* @__PURE__ */ jsxs("span", { className: `text-3xs px-1.5 py-0.5 rounded font-bold shrink-0 ${isSelected ? "bg-[#23C4A6]/25 text-[#93EBD6]" : "bg-[#23C4A6]/15 text-[#23C4A6]"}`, children: [
                          subOpt.confidence,
                          "%"
                        ] })
                      ] }),
                      subOpt.subtext && /* @__PURE__ */ jsx("span", { className: `text-2xs ${isSelected ? "text-[#93EBD6]/70" : "text-[rgba(241,245,242,0.5)]"}`, children: subOpt.subtext })
                    ] }),
                    isSelected && /* @__PURE__ */ jsx(Check, { size: 13, className: "shrink-0 text-[#23C4A6]" })
                  ]
                },
                subOpt.value
              );
            }) })
          ] }, groupIdx);
        } else {
          const isSelected = String(opt.value) === String(value);
          const isOptDisabled = disabledOptions.includes(opt.value) || opt.disabled;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              disabled: isOptDisabled,
              onClick: () => {
                if (!isOptDisabled) {
                  onChange({ target: { value: opt.value } });
                  setIsOpen(false);
                  setSearch("");
                }
              },
              className: `w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-[10px] transition-all duration-150 ${isSelected ? "bg-[#23C4A6]/15 text-[#93EBD6] font-bold border border-[#23C4A6]/30 shadow-[0_0_12px_rgba(35,196,166,0.1)]" : "text-[rgba(241,245,242,0.85)] hover:bg-white/[0.07] hover:text-white border border-transparent"} ${isOptDisabled ? "opacity-40 cursor-not-allowed" : ""}`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5 truncate mr-2", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 truncate", children: [
                    opt.learned && /* @__PURE__ */ jsx(Brain, { size: 11, className: isSelected ? "text-[#93EBD6]" : "text-[#23C4A6]" }),
                    /* @__PURE__ */ jsx("span", { className: "truncate", children: opt.label }),
                    opt.confidence !== void 0 && /* @__PURE__ */ jsxs("span", { className: `text-3xs px-1.5 py-0.5 rounded font-bold shrink-0 ${isSelected ? "bg-[#23C4A6]/25 text-[#93EBD6]" : "bg-[#23C4A6]/15 text-[#23C4A6]"}`, children: [
                      opt.confidence,
                      "%"
                    ] })
                  ] }),
                  opt.subtext && /* @__PURE__ */ jsx("span", { className: `text-2xs ${isSelected ? "text-[#93EBD6]/70" : "text-[rgba(241,245,242,0.5)]"}`, children: opt.subtext })
                ] }),
                isSelected && /* @__PURE__ */ jsx(Check, { size: 13, className: "shrink-0 text-[#23C4A6]" })
              ]
            },
            opt.value
          );
        }
      }) })
    ] })
  ] });
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
        className: "fixed inset-0 z-modal-scrim",
        style: {
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
const db = new Dexie("VenQoreChatbotDB");
db.version(1).stores({
  sessions: "session_uuid, status, visitor_name, visitor_email, updated_at",
  messages: "++id, session_uuid, sender_type, sender_name, body, created_at"
});
function ChatWidget({ embedded = false }) {
  const { store, auth, turnstile_site_key } = usePage().props;
  const { url } = usePage();
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileWidgetId = useRef(null);
  const turnstileContainerRef = useRef(null);
  useEffect(() => {
    if (!turnstile_site_key) return;
    const renderWidget = () => {
      if (window.turnstile && turnstileContainerRef.current && turnstileWidgetId.current === null) {
        try {
          turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
            sitekey: turnstile_site_key,
            size: "invisible",
            callback: (token) => {
              setTurnstileToken(token);
            },
            "expired-callback": () => {
              setTurnstileToken(null);
              if (turnstileWidgetId.current !== null && window.turnstile) {
                window.turnstile.reset(turnstileWidgetId.current);
              }
            },
            "error-callback": () => {
              setTurnstileToken(null);
            }
          });
        } catch (err) {
          console.warn("Turnstile render warning:", err);
        }
      }
    };
    const scriptId = "cf-turnstile-script";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.turnstile && window.turnstile.ready) {
          window.turnstile.ready(renderWidget);
        } else {
          renderWidget();
        }
      };
      document.head.appendChild(script);
    } else {
      if (window.turnstile && window.turnstile.ready) {
        window.turnstile.ready(renderWidget);
      } else {
        renderWidget();
      }
    }
    return () => {
      if (turnstileWidgetId.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetId.current);
        } catch (e) {
        }
        turnstileWidgetId.current = null;
      }
    };
  }, [turnstile_site_key]);
  const showMobileNavBar = (() => {
    if (!auth?.user) return false;
    const path = url.toLowerCase();
    const isReturnsHistoryList = path.includes("/returns-history") && !path.includes("/create") && !path.includes("/edit") && !path.includes("/return-detail");
    if (isReturnsHistoryList) return true;
    if (path.includes("/pos")) return false;
    const isCreateFlow = path.includes("/create");
    const isEditFlow = path.includes("/edit");
    const isReturnFlow = path.includes("/return") && !path.includes("/returns-history");
    const isRefundFlow = path.includes("/refund");
    const isSetupFlow = path.includes("/setup") || path.includes("/new-store") || path.includes("/start") || path.includes("/build-workspace");
    if (isCreateFlow || isEditFlow || isReturnFlow || isRefundFlow || isSetupFlow) {
      return false;
    }
    return true;
  })();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [confirmNewChat, setConfirmNewChat] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [visitorName, setVisitorName] = useState(auth?.user?.name || "Guest");
  const [visitorEmail, setVisitorEmail] = useState(auth?.user?.email || "");
  const [messageText, setMessageText] = useState("");
  const [sessionUuid, setSessionUuid] = useState(() => {
    if (!store) return null;
    return localStorage.getItem(`vq_chat_uuid_${store.id}`) || null;
  });
  const [sessionStatus, setSessionStatus] = useState("bot_active");
  const [venaContext, setVenaContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  useRef(null);
  const activeChannel = useRef(null);
  const typingTimeoutRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (store) {
      const cachedUuid = localStorage.getItem(`vq_chat_uuid_${store.id}`);
      if (cachedUuid && cachedUuid !== sessionUuid) {
        setSessionUuid(cachedUuid);
      }
    }
  }, [store]);
  useEffect(() => {
    if (auth?.user) {
      setVisitorName(auth.user.name || "Guest");
      setVisitorEmail(auth.user.email || "");
    }
  }, [auth]);
  useEffect(() => {
    if (sessionUuid && store) restoreSession();
  }, [sessionUuid, store]);
  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, typing, isOpen]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isExpanded) setIsExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isExpanded]);
  useEffect(() => {
    if ((embedded || isOpen || isExpanded) && !started && !loading && !sessionUuid && store) {
      handleStartSession();
    }
  }, [embedded, isOpen, isExpanded, started, loading, sessionUuid, store]);
  const fetchVenaContext = async () => {
    try {
      const res = await axios.get(`/api/${store.slug}/vena/context`);
      setVenaContext(res.data);
    } catch (err) {
      console.warn("Vena: Could not fetch subscription context.", err);
    }
  };
  const restoreSession = async () => {
    setLoading(true);
    setConnectionError(null);
    try {
      const cachedMsgs = await db.messages.where("session_uuid").equals(sessionUuid).sortBy("created_at");
      if (cachedMsgs.length > 0) {
        setMessages(cachedMsgs);
        setStarted(true);
      }
      const res = await axios.post(`/api/${store.slug}/chatbot/session`, { session_uuid: sessionUuid });
      const data = res.data;
      if (data.session_uuid && data.session_uuid !== sessionUuid) {
        setSessionUuid(data.session_uuid);
        localStorage.setItem(`vq_chat_uuid_${store?.id}`, data.session_uuid);
      }
      setSessionStatus(data.status);
      setVisitorName(data.visitor_name);
      setVisitorEmail(data.visitor_email);
      if (data.messages?.length > 0) {
        setMessages(data.messages);
        await db.transaction("rw", db.messages, async () => {
          await db.messages.where("session_uuid").equals(sessionUuid).delete();
          await db.messages.bulkAdd(data.messages.map((m) => ({
            session_uuid: sessionUuid,
            sender_type: m.sender_type,
            sender_name: m.sender_name,
            body: m.body,
            created_at: m.created_at
          })));
        });
      }
      setStarted(true);
      initializeEcho(data.session_uuid || sessionUuid);
      fetchVenaContext();
    } catch (err) {
      console.warn("Failed to restore chat session, auto-healing with fresh session:", err);
      localStorage.removeItem(`vq_chat_uuid_${store?.id}`);
      setSessionUuid(null);
      await handleStartSession();
    } finally {
      setLoading(false);
    }
  };
  const handleStartSession = async (e) => {
    setLoading(true);
    setConnectionError(null);
    try {
      const name = auth?.user?.name || "Guest";
      const email = auth?.user?.email || null;
      const tokenToSubmit = turnstileToken || (window.turnstile ? window.turnstile.getResponse() : null);
      const res = await axios.post(`/api/${store?.slug}/chatbot/session`, {
        visitor_name: name,
        visitor_email: email,
        turnstile_token: tokenToSubmit
      });
      const data = res.data;
      setSessionUuid(data.session_uuid);
      setSessionStatus(data.status);
      localStorage.setItem(`vq_chat_uuid_${store?.id}`, data.session_uuid);
      await db.sessions.put({
        session_uuid: data.session_uuid,
        status: data.status,
        visitor_name: name,
        visitor_email: email,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      setMessages(data.messages || []);
      setStarted(true);
      initializeEcho(data.session_uuid);
      fetchVenaContext();
    } catch (err) {
      console.error("Failed to start session:", err);
      setConnectionError(err?.response?.data?.error || err?.message || "Unable to connect to support.");
    } finally {
      setLoading(false);
    }
  };
  const handleNewChat = () => {
    setConfirmNewChat(false);
    setConnectionError(null);
    if (activeChannel.current) {
      activeChannel.current.stopListening(".MessageSent").stopListening(".TypingStarted").stopListening(".TypingStopped").stopListening(".SessionStatusChanged");
      activeChannel.current = null;
    }
    localStorage.removeItem(`vq_chat_uuid_${store.id}`);
    setSessionUuid(null);
    setMessages([]);
    setStarted(false);
    setSessionStatus("bot_active");
    setVisitorName("");
    setVisitorEmail("");
    setMessageText("");
    setTyping(false);
    setVenaContext(null);
  };
  const initializeEcho = (uuid) => {
    return;
  };
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || messageText;
    if (!text.trim() || sending) return;
    if (!textToSend) setMessageText("");
    setSending(true);
    const tempId = `temp_${Date.now()}`;
    const tempMsg = {
      id: tempId,
      sender_type: "visitor",
      sender_name: visitorName || "Guest",
      body: text,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);
    try {
      handleVisitorTyping(false);
      const res = await axios.post(`/api/${store.slug}/chatbot/session/${sessionUuid}/message`, {
        body: text,
        vena_context: venaContext || null
      });
      if (res.data.success) {
        const serverMsg = res.data.message;
        setMessages((prev) => prev.map((m) => m.id === tempId ? serverMsg : m));
        await db.messages.add({
          session_uuid: sessionUuid,
          sender_type: serverMsg.sender_type,
          sender_name: serverMsg.sender_name,
          body: serverMsg.body,
          created_at: serverMsg.created_at
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        sender_type: "system",
        sender_name: "System",
        body: "We are experiencing a brief connection issue. Your message has been saved and a support team member will follow up shortly.",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }]);
    } finally {
      setSending(false);
    }
  };
  const handleVisitorTyping = (isTyping) => {
    if (!sessionUuid) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    axios.post(`/api/${store.slug}/chatbot/session/${sessionUuid}/typing`, { typing: isTyping });
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => handleVisitorTyping(false), 4e3);
    }
  };
  const executeAction = (actionName) => {
    const routes = {
      pos: "store.pos",
      create_invoice: "store.sales.invoice.create",
      expenses: "store.expenses.index",
      invoices: "store.sales.dashboard",
      settings: "store.settings"
    };
    if (actionName === "handoff") {
      handleSendMessage("I need to speak with a member of your support team, please.");
      return;
    }
    if (routes[actionName]) {
      setIsOpen(false);
      setIsExpanded(false);
      router.visit(route(routes[actionName], { store_slug: store.slug }));
    }
  };
  const renderMessageBody = (body) => {
    const regex = /\[([^\]]+)\]\(action:([a-zA-Z0-9_-]+)\)/g;
    let lastIndex = 0;
    const result = [];
    let match;
    while ((match = regex.exec(body)) !== null) {
      const textBefore = body.slice(lastIndex, match.index);
      if (textBefore) result.push(/* @__PURE__ */ jsx("span", { className: "whitespace-pre-wrap", children: textBefore }, lastIndex));
      result.push(
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => executeAction(match[2]),
            className: embedded ? "inline-flex items-center gap-1.5 px-3 py-1.5 my-1 mx-0.5 bg-white/10 text-[#93ebd6] border border-white/15 hover:bg-white/15 rounded-lg text-xs font-bold shadow-sm transition-all" : "inline-flex items-center gap-1.5 px-3 py-1.5 my-1 mx-0.5 bg-surface text-brand-600 dark:bg-surface dark:text-brand-400 border border-line hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-xs font-bold shadow-sm transition-all duration-normal",
            children: [
              /* @__PURE__ */ jsx(Play, { size: 10, className: embedded ? "fill-[#23C4A6] stroke-none" : "fill-brand-600 dark:fill-brand-400 stroke-none" }),
              match[1]
            ]
          },
          match.index
        )
      );
      lastIndex = regex.lastIndex;
    }
    const textAfter = body.slice(lastIndex);
    if (textAfter) result.push(/* @__PURE__ */ jsx("span", { className: "whitespace-pre-wrap", children: textAfter }, lastIndex));
    return result.length > 0 ? result : body;
  };
  const renderChatBody = () => /* @__PURE__ */ jsx(Fragment, { children: !started ? /* @__PURE__ */ jsx("div", { className: "flex-1 p-8 flex flex-col items-center justify-center relative z-10 text-center space-y-4", children: connectionError ? /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-2xl flex items-center justify-center mb-1 ${embedded ? "bg-rose-500/15 border border-rose-500/30 text-rose-300" : "bg-rose-50 border border-rose-200 text-rose-500"}`, children: /* @__PURE__ */ jsx(AlertCircle, { size: 22 }) }),
    /* @__PURE__ */ jsx("p", { className: `text-sm font-semibold max-w-[260px] ${embedded ? "text-rose-200" : "text-rose-600"}`, children: connectionError }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => handleStartSession(),
        className: `px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${embedded ? "bg-white/10 hover:bg-white/15 text-white border border-white/10 shadow-sm" : "bg-brand-600 hover:bg-brand-700 text-white shadow-md"}`,
        children: [
          /* @__PURE__ */ jsx(RotateCcw, { size: 13 }),
          "Retry Connection"
        ]
      }
    )
  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Loader2, { className: `animate-spin ${embedded ? "text-[#23C4A6]" : "text-brand-500"}`, size: 32 }),
    /* @__PURE__ */ jsx("p", { style: { fontSize: 15 }, className: embedded ? "text-white/70 font-medium" : "text-ink-muted font-medium", children: "Connecting to support…" })
  ] }) }) : (
    /* Message stream */
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col overflow-hidden relative z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar", children: [
        messages.length === 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-center p-6 space-y-2 opacity-70", children: [
          /* @__PURE__ */ jsx(Sparkles, { size: 24, className: embedded ? "text-[#23C4A6] animate-pulse" : "text-brand-500 animate-pulse" }),
          /* @__PURE__ */ jsx("h5", { className: `text-xs font-bold ${embedded ? "text-white" : "text-ink-secondary dark:text-ink"}`, children: "Start a Conversation" }),
          /* @__PURE__ */ jsx("p", { className: `text-2xs max-w-[200px] ${embedded ? "text-white/60" : "text-ink-muted"}`, children: "Send a message and our support team will reply instantly." })
        ] }),
        messages.map((m, i) => {
          const isVisitor = m.sender_type === "visitor";
          const isBot = m.sender_type === "bot";
          const isSystem = m.sender_type === "system";
          if (isSystem) return null;
          return /* @__PURE__ */ jsx("div", { className: `flex ${isVisitor ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1 duration-fast`, children: /* @__PURE__ */ jsxs("div", { style: { fontSize: 15, lineHeight: 1.5 }, className: `max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${isVisitor ? embedded ? "bg-gradient-to-r from-[#23C4A6] to-[#1da58c] text-[#062421] font-semibold rounded-tr-none shadow-md shadow-[#23C4A6]/20" : "bg-brand-600 text-white rounded-tr-none font-medium" : isBot ? embedded ? "bg-white/[0.08] text-white/90 border border-white/10 rounded-tl-none leading-relaxed backdrop-blur-md" : "bg-sunken text-ink rounded-tl-none leading-relaxed" : embedded ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30 rounded-tl-none leading-relaxed" : "bg-brand-50 dark:bg-brand-950/20 text-brand-950 dark:text-brand-300 border border-brand-100 dark:border-brand-900 rounded-tl-none leading-relaxed"}`, children: [
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, letterSpacing: "0.12em", fontWeight: 600 }, className: "uppercase mb-1.5 opacity-70 flex items-center gap-1.5", children: [
              isBot && /* @__PURE__ */ jsx(VenaLogo, { size: 12 }),
              isVisitor ? "You" : isBot ? "Vena AI" : "Support"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "whitespace-pre-line leading-relaxed", children: renderMessageBody(m.body) })
          ] }) }, i);
        }),
        typing && /* @__PURE__ */ jsxs("div", { style: { fontSize: 14 }, className: `flex items-center gap-2 font-medium py-2 animate-pulse ${embedded ? "text-white/60" : "text-ink-muted"}`, children: [
          /* @__PURE__ */ jsx(Loader2, { size: 14, className: `animate-spin ${embedded ? "text-[#23C4A6]" : "text-brand-500"}` }),
          /* @__PURE__ */ jsx("span", { children: "Support is typing…" })
        ] }),
        /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
      ] }),
      !messages.some((m) => m.sender_type === "visitor") && /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 shrink-0", style: { borderTop: embedded ? "1px solid rgba(255,255,255,0.08)" : "1px solid var(--vq-line-soft)" }, children: [
        /* @__PURE__ */ jsx(
          "p",
          {
            style: { fontSize: 12, letterSpacing: "0.12em", fontWeight: 600 },
            className: `uppercase mb-2.5 ${embedded ? "text-white/50" : "text-ink-muted"}`,
            children: "Jump to"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3", children: [["Point of Sale", "pos"], ["New invoice", "create_invoice"], ["Expenses", "expenses"]].map(([label, action]) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => executeAction(action),
            style: { fontSize: 14, fontWeight: 700, height: 44 },
            className: embedded ? "px-3 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-[#23C4A6]/40 text-white/90 flex items-center justify-center transition-all rounded-xl shadow-sm backdrop-blur-sm" : "px-3 bg-surface border border-line hover:border-brand-300 text-ink flex items-center justify-center transition-all rounded-xl",
            children: label
          },
          action
        )) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-6 shrink-0", style: {
        borderTop: embedded ? "1px solid rgba(255,255,255,0.08)" : "1px solid var(--vq-line-soft)",
        background: embedded ? "transparent" : "var(--vq-surface)"
      }, children: /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
        e.preventDefault();
        handleSendMessage();
      }, className: "flex gap-2 relative items-center", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: messageText,
            onChange: (e) => {
              setMessageText(e.target.value);
              handleVisitorTyping(e.target.value.length > 0);
            },
            className: embedded ? "flex-1 pl-4 pr-12 py-3 bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-[#23C4A6]/50 focus:border-[#23C4A6] text-white transition-all font-sans placeholder-white/30" : "flex-1 pl-4 pr-12 py-3 bg-app border border-line rounded-2xl text-xs outline-none focus:ring-2 focus:ring-brand-500 text-ink transition-all font-sans placeholder-slate-400",
            placeholder: "Type your message here...",
            disabled: sending
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: !messageText.trim() || sending,
            className: embedded ? "absolute right-1.5 p-2 bg-[#23C4A6] hover:bg-[#20b297] active:scale-90 text-[#062421] font-bold rounded-xl transition-all shadow-md disabled:opacity-30 disabled:hover:bg-[#23C4A6] disabled:active:scale-100 flex items-center justify-center" : "absolute right-1.5 p-2 bg-brand-600 hover:bg-brand-700 active:scale-90 text-white rounded-xl transition-all shadow-md disabled:opacity-30 disabled:hover:bg-brand-600 disabled:active:scale-100 flex items-center justify-center",
            children: /* @__PURE__ */ jsx(Send, { size: 14 })
          }
        )
      ] }) })
    ] })
  ) });
  const renderHeader = (closeFn) => /* @__PURE__ */ jsxs("div", { className: "px-5 py-4 bg-neutral-900 text-white shrink-0 relative flex items-center justify-between border-b border-neutral-800/80", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-15 pointer-events-none" }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 relative z-10", children: [
      /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-brand-600/30 border border-brand-500/30 flex items-center justify-center p-2 text-brand-400 shadow-inner shrink-0", children: /* @__PURE__ */ jsx(VenaLogo, { size: 24, className: "drop-shadow-sm" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h4", { className: "text-sm font-bold tracking-tight flex items-center gap-1.5", children: [
          "Vena AI Support",
          sessionStatus === "agent_active" && /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-1" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-2xs text-brand-300 font-bold uppercase tracking-wider mt-0.5", children: "Online" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 relative z-10", children: [
      started && (confirmNewChat ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted font-medium mr-1", children: "Start over?" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleNewChat,
            className: "px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-2xs font-bold transition-all active:scale-90",
            children: "Yes"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setConfirmNewChat(false),
            className: "px-2.5 py-1 bg-neutral-700 hover:bg-interactive-hover text-neutral-300 rounded-lg text-2xs font-bold transition-all active:scale-90",
            children: "No"
          }
        )
      ] }) : /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setConfirmNewChat(true),
          title: "Start a new chat",
          className: "w-8 h-8 rounded-xl bg-neutral-800/60 hover:bg-interactive-hover border border-neutral-700/50 flex items-center justify-center text-ink-muted hover:text-white transition-all duration-normal active:scale-90",
          children: /* @__PURE__ */ jsx(RotateCcw, { size: 13 })
        }
      )),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setIsExpanded((v) => !v),
          title: isExpanded ? "Collapse chat" : "Expand to sidebar",
          className: "w-8 h-8 rounded-xl bg-neutral-800/60 hover:bg-interactive-hover border border-neutral-700/50 flex items-center justify-center text-ink-muted hover:text-white transition-all duration-normal active:scale-90",
          children: isExpanded ? /* @__PURE__ */ jsx(Minimize2, { size: 13 }) : /* @__PURE__ */ jsx(Maximize2, { size: 13 })
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: closeFn,
          className: "w-8 h-8 rounded-xl bg-neutral-800/60 hover:bg-interactive-hover border border-neutral-700/50 flex items-center justify-center text-ink-muted hover:text-white transition-all duration-normal active:scale-90",
          children: /* @__PURE__ */ jsx(X, { size: 14 })
        }
      )
    ] })
  ] });
  if (!store) return null;
  if (embedded) {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full w-full font-sans relative overflow-hidden", children: [
      renderChatBody(),
      /* @__PURE__ */ jsx("div", { ref: turnstileContainerRef, id: "turnstile-chat-container", className: "hidden" })
    ] });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    isExpanded && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 bg-black/20 backdrop-blur-[2px] z-command transition-opacity duration-slow",
        onClick: () => setIsExpanded(false)
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `fixed top-0 right-0 h-full z-command flex flex-col bg-surface border-l border-line shadow-2xl transition-all duration-slow ease-out font-sans ${isExpanded ? "translate-x-0 w-[420px]" : "translate-x-full w-[420px]"}`,
        style: { isolation: "isolate" },
        children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-[80px] pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-64 h-64 bg-brand-500/5 rounded-full blur-[80px] pointer-events-none" }),
          renderHeader(() => {
            setIsExpanded(false);
            setIsOpen(false);
          }),
          renderChatBody()
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: `fixed right-6 z-sticky font-sans transition-all duration-slow ${showMobileNavBar ? "bottom-[100px] lg:bottom-6" : "bottom-6"}`, style: { isolation: "isolate" }, children: [
      isOpen && !isExpanded && /* @__PURE__ */ jsxs("div", { className: "mb-4 w-96 h-[520px] bg-surface border border-line rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-slow relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-[50px] pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-48 h-48 bg-brand-500/5 rounded-full blur-[50px] pointer-events-none" }),
        renderHeader(() => setIsOpen(false)),
        renderChatBody()
      ] }),
      !isExpanded && /* @__PURE__ */ jsxs(
        "button",
        {
          id: "tour-chat-widget-btn",
          onClick: () => setIsOpen((v) => !v),
          className: "w-14 h-14 rounded-full bg-surface text-ink-secondary dark:text-white border border-line hover:text-white shadow-2xl flex items-center justify-center transform active:scale-95 transition-all duration-slow group relative overflow-hidden",
          children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-brand opacity-0 group-hover:opacity-100 transition-opacity duration-slow" }),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-15 pointer-events-none" }),
            /* @__PURE__ */ jsx("div", { className: "relative z-10 flex items-center justify-center", children: isOpen ? /* @__PURE__ */ jsx(X, { size: 22, className: "animate-in spin-in-90 duration-slow" }) : /* @__PURE__ */ jsx(VenaLogo, { size: 28, className: "animate-in zoom-in duration-slow drop-shadow-sm" }) })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { ref: turnstileContainerRef, id: "turnstile-chat-container", className: "hidden" }),
    /* @__PURE__ */ jsx("style", { children: `
 .custom-scrollbar::-webkit-scrollbar { width: 4px; }
 .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
 .custom-scrollbar::-webkit-scrollbar-thumb { background: rgb(var(--vq-slate-300)); border-radius: 10px; }
 .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgb(var(--vq-slate-700)); }
 .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgb(var(--vq-slate-400)); }
 .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgb(var(--vq-slate-600)); }
` })
  ] });
}
const STORAGE_RECENT_QUERIES = "venqore_island_recent_queries";
const STORAGE_SOUND_ENABLED = "venqore_island_sound_enabled";
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
  const [recentQueries, setRecentQueries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_RECENT_QUERIES) || "[]");
    } catch {
      return [];
    }
  });
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
    const i = setInterval(fetchNotifications, 35e3);
    return () => clearInterval(i);
  }, [fetchNotifications]);
  useEffect(() => {
    const onAlert = (e) => {
      if (e.detail && !isUserTransacting() && mode !== "open") raiseAlert(e.detail);
    };
    const onSync = (e) => {
      if (mode !== "rest") return;
      setActivity(e.detail?.activity || "sync");
      setWorkingLabel(e.detail?.label || "Syncing with Reckoner");
      setMode("working");
      setTimeout(() => {
        setMode("rest");
        setActivity("idle");
      }, e.detail?.duration || 2500);
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
    const i = setInterval(() => setTickerIndex((p) => (p + 1) % ambient.length), 6500);
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
      localStorage.setItem(STORAGE_RECENT_QUERIES, JSON.stringify(next));
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
    window.axios?.post(route("store.ai.query", { store_slug: store.slug }), { message: text }).then((res) => {
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
      const db2 = dbResults[selectedIndex - results.length];
      if (db2?.url) {
        haptic("pop");
        router.visit(db2.url);
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
  const allAlerts = useMemo(
    () => [...extraAlerts || [], ...notifications.latest || []],
    [extraAlerts, notifications.latest]
  );
  const unread = (notifications.unread_count || 0) + (extraAlerts?.length || 0);
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
            tab === "chat" && /* @__PURE__ */ jsx(motion.div, { variants: contentVariants, initial: "initial", animate: "animate", exit: "exit", className: "h-full", children: /* @__PURE__ */ jsx(PaneShell, { tab: "chat", orbState: "listening", paused: orbPaused, flush: true, children: /* @__PURE__ */ jsx("div", { className: "h-full min-h-0 overflow-hidden bg-transparent", children: /* @__PURE__ */ jsx(ChatWidget, { embedded: true }) }) }) }, "chat"),
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
            tab === "alerts" && /* @__PURE__ */ jsx(motion.div, { variants: contentVariants, initial: "initial", animate: "animate", exit: "exit", className: "h-full", children: /* @__PURE__ */ jsx(PaneShell, { tab: "alerts", orbState: unread > 0 ? "searching" : "breathing", paused: orbPaused, children: allAlerts.length ? /* @__PURE__ */ jsx(motion.div, { variants: listVariants, initial: "initial", animate: "animate", className: "space-y-2", children: allAlerts.map((n, i) => /* @__PURE__ */ jsxs(
              motion.div,
              {
                variants: itemVariants,
                className: "flex items-start gap-3 p-3 rounded-2xl",
                style: { background: `${INK}.06)` },
                children: [
                  /* @__PURE__ */ jsx("span", { className: "mt-0.5 shrink-0", style: { color: n.severity === "critical" ? "#FFAE96" : n.severity === "important" ? "#FFDD8E" : "#59DBC0" }, children: n.severity === "critical" ? /* @__PURE__ */ jsx(AlertCircle, { size: 18 }) : n.severity === "important" ? /* @__PURE__ */ jsx(AlertTriangle, { size: 18 }) : /* @__PURE__ */ jsx(CheckCircle2, { size: 18 }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsx("p", { className: "truncate", style: { ...T.small, fontWeight: 700, color: "#F1F5F2" }, children: n.title }),
                    /* @__PURE__ */ jsx("p", { style: { ...T.caption, color: `${INK}.65)` }, children: n.message || n.desc })
                  ] }),
                  n.action_url && /* @__PURE__ */ jsx(
                    Link,
                    {
                      href: n.action_url,
                      onClick: closeIsland,
                      className: "shrink-0",
                      style: { ...T.caption, fontWeight: 700, color: "#59DBC0" },
                      children: "View"
                    }
                  )
                ]
              },
              n.id || i
            )) }) : /* @__PURE__ */ jsx("div", { className: "h-full grid place-items-center text-center px-6", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(BellOff, { size: 30, className: "mx-auto mb-3", style: { color: `${INK}.32)` } }),
              /* @__PURE__ */ jsx("p", { style: { ...T.body, fontWeight: 700, color: `${INK}.82)` }, children: "All clear" }),
              /* @__PURE__ */ jsx("p", { style: { ...T.small, color: `${INK}.55)`, marginTop: 4 }, children: "Nothing needs your attention." })
            ] }) }) }) }, "alerts"),
            tab === "capture" && /* @__PURE__ */ jsx(motion.div, { variants: contentVariants, initial: "initial", animate: "animate", exit: "exit", className: "h-full", children: /* @__PURE__ */ jsx(PaneShell, { tab: "capture", orbState: "shaping", paused: orbPaused, flush: true, children: canUseSmartCapture ? /* @__PURE__ */ jsx("div", { className: "h-full min-h-0 overflow-hidden bg-transparent", children: /* @__PURE__ */ jsx(
              SmartCapturePanel,
              {
                embedded: true,
                isOpen: true,
                initialTab: captureTab,
                onClose: () => setTab("ask")
              }
            ) }) : /* @__PURE__ */ jsx("div", { className: "h-full grid place-items-center text-center px-6", children: /* @__PURE__ */ jsxs("div", { children: [
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
  AiIsland as A,
  VenaLogo as V,
  closeLemonCheckout as c,
  openLemonCheckout as o,
  preloadLemonCheckout as p
};

import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import { usePage, useForm, Head, router } from "@inertiajs/react";
import { Users, Send, Clock, BarChart2, ChevronRight, Plus, AlertCircle, Activity, UserCheck, Timer, DollarSign, Package, Award, Search, TrendingUp, X, User, Crown, Eye, Settings, BadgeCheck, ShoppingCart, Star, Shield, Sparkles, Check, Copy, ChevronDown, MessageCircle, RefreshCw, Ban, Edit3, Trash2, BarChart, Zap, RotateCcw, FileText, Truck, CreditCard, Calendar, CheckCircle } from "lucide-react";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, ReferenceLine } from "recharts";
import { g as getCurrencySymbol } from "./format-Dor_DYzH.js";
import { u as useTermText } from "./terms-BnWz3Igl.js";
import { v as vq } from "./runtime-zM7XrUga.js";
import "react-dom";
import "./plans-Dp89V3MJ.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-B_UmKR56.js";
import "./ThinkingOrb-CQCcf5-R.js";
import "./AiIsland-yXhEIy75.js";
import "motion/react";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
const STAFF_PRESETS = /* @__PURE__ */ JSON.parse('[{"id":"checkout","name":"Checkout operator","group":"Sales floor","purpose":"Run checkout and track personal work without store finances.","permissions":["pos.open_session","pos.checkout","pos.close_session","inventory.view","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":""},{"id":"senior_checkout","name":"Senior checkout operator","group":"Sales floor","purpose":"Handle cart discounts and item corrections; no refund payments by default.","permissions":["pos.open_session","pos.checkout","pos.close_session","pos.discounts","pos.void_item","inventory.view","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":""},{"id":"shift_lead","name":"Shift lead","group":"Sales floor","purpose":"Coordinate counter work and inspect sales. No profit, bank balances or team permission editing.","permissions":["pos.open_session","pos.checkout","pos.close_session","pos.discounts","pos.void_item","sales.view","reports.performance","inventory.view","admin.staff_view","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":""},{"id":"invoice_clerk","name":"Invoice clerk","group":"Sales floor","purpose":"Create and follow own invoices and submissions.","permissions":["sales.create","inventory.view","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":""},{"id":"sales_coordinator","name":"Sales coordinator","group":"Sales floor","purpose":"Manage sales records and quotations without cash-ledger or cost access.","permissions":["sales.view","sales.create","sales.edit","sales.quotations","inventory.view","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":""},{"id":"returns_desk","name":"Returns desk","group":"Sales floor","purpose":"Prepare authorized customer returns. Paying refunds is a separate delegation.","permissions":["sales.view","sales.returns","pos.refund","inventory.view","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":"Refund payment authority is deliberately excluded; pos.refund behavior must be reconciled so an integrated payout cannot bypass finance.customer_refund."},{"id":"stock_lookup","name":"Stock lookup assistant","group":"Stock & purchasing","purpose":"Check availability and product details without valuation or stock mutations.","permissions":["inventory.view"],"caution":""},{"id":"catalogue_editor","name":"Catalogue editor","group":"Stock & purchasing","purpose":"Maintain product records and labels; no deletion, cost or margin reporting.","permissions":["inventory.view","inventory.create","inventory.edit","inventory.barcodes","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":""},{"id":"warehouse_operator","name":"Warehouse operator","group":"Stock & purchasing","purpose":"Count and transfer stock within assigned locations.","permissions":["inventory.view","inventory.adjust","inventory.transfer","inventory.barcodes","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":""},{"id":"inventory_planner","name":"Inventory planner","group":"Stock & purchasing","purpose":"Monitor stock health, expiry and valuation with explicit stock reporting.","permissions":["inventory.view","reports.stock","inventory.barcodes","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":"reports.stock includes monetary stock valuation in this contract; use Stock lookup assistant when that is inappropriate."},{"id":"purchasing_clerk","name":"Purchasing clerk","group":"Stock & purchasing","purpose":"Draft purchases and follow personal submissions without wholesale analytics.","permissions":["purchases.create","inventory.view","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":""},{"id":"procurement_lead","name":"Procurement lead","group":"Stock & purchasing","purpose":"Manage procurement, supplier records, cost analysis and returns.","permissions":["purchases.view","purchases.create","purchases.edit","purchases.costs","purchases.suppliers","purchases.returns","inventory.view","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":""},{"id":"production_operator","name":"Production operator","group":"Stock & purchasing","purpose":"Track production quantities and material adjustments; no cost or profit reporting.","permissions":["inventory.view","inventory.adjust","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":"There is no production-specific grant in the 77-key vocabulary. These grants also allow inventory adjustments outside production. This cannot be a tightly isolated production role without additional record/workflow scoping."},{"id":"collections","name":"Collections clerk","group":"Money & accounting","purpose":"Record customer receipts and follow personal receipt submissions.","permissions":["finance.receive_payment","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":"This grant does not authorize the customer balance directory. Delegate finance.balances separately only if the broader balance access is intended."},{"id":"payables","name":"Payables clerk","group":"Money & accounting","purpose":"Record supplier payments; no store-wide bank or ledger summaries.","permissions":["finance.send_payment","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":""},{"id":"expenses","name":"Expense submitter","group":"Money & accounting","purpose":"Submit expenses and correct returned personal entries.","permissions":["finance.expenses","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":""},{"id":"journal_clerk","name":"Journal clerk","group":"Money & accounting","purpose":"Prepare journal entries and track personal posting work.","permissions":["finance.journal","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":"Creating journal entries is powerful accounting authority. This preset does not grant financial statements or approval rights."},{"id":"bookkeeper","name":"Bookkeeper","group":"Money & accounting","purpose":"Reconcile receipts, payments and journals with explicit ledger and balance access.","permissions":["finance.balances","finance.transactions","finance.receive_payment","finance.send_payment","finance.expenses","finance.journal","sales.view","purchases.view","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":""},{"id":"accountant","name":"Reporting accountant","group":"Money & accounting","purpose":"Review statements, costs, tax and fiscal periods without fund mutations.","permissions":["reports.financial","reports.summary","reports.audit","purchases.view","purchases.costs","finance.balances","finance.transactions","finance.fiscal_year.view","data.export"],"caution":""},{"id":"cheque_operator","name":"Cheque operations clerk","group":"Money & accounting","purpose":"Manage cheque books and clearing using dedicated cheque grants.","permissions":["finance.cheque_books.view","finance.cheque_books.manage","finance.cheques.clear","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":"Cheque registers may contain counterparty and cheque amounts. This does not grant all bank balances or duplicate overrides."},{"id":"refund_officer","name":"Refund payment officer","group":"Money & accounting","purpose":"Issue explicit customer refunds and record supplier refunds.","permissions":["finance.customer_refund","finance.supplier_refund","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":"Sensitive delegation. Record-scoped refund sources and amount limits still apply; no general capital, drawings or balance adjustment."},{"id":"treasury","name":"Treasury operator","group":"Money & accounting","purpose":"Inspect balances and move funds between authorized store accounts.","permissions":["finance.balances","finance.transactions","finance.internal_transfer","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":"Do not auto-include capital injections, drawings, balance adjustments or cheque overrides."},{"id":"fiscal_controller","name":"Fiscal period controller","group":"Money & accounting","purpose":"Manage year closing and posting-period controls with explicit grants.","permissions":["finance.fiscal_year.view","finance.fiscal_year.manage","finance.fiscal_year.close","finance.period_lock","finance.period_reopen","finance.period_exception","reports.financial","reports.audit"],"caution":"Closing, reopening and exceptions are sensitive. Enforce period eligibility, audit trails and any separation-of-duties rules."},{"id":"approval_observer","name":"Approval observer","group":"Review & administration","purpose":"Read assigned approval work without making decisions.","permissions":["approvals.view","approvals.inbox"],"caution":""},{"id":"approval_reviewer","name":"Approval reviewer","group":"Review & administration","purpose":"Review assigned submissions and make only delegated decisions.","permissions":["approvals.view","approvals.inbox","approvals.review","approvals.approve","approvals.reject","approvals.return"],"caution":"Decision grants are incomplete without an explicit allowed-action assignment. They must not mean approval authority over every business operation."},{"id":"external_auditor","name":"External auditor","group":"Review & administration","purpose":"Read financial and audit reports and export permitted data; no mutations.","permissions":["reports.financial","reports.audit","reports.stock","finance.fiscal_year.view","data.export"],"caution":"The selected financial and stock report grants expose sensitive values. Restrict tenant/branch and engagement duration."},{"id":"people_admin","name":"People administrator","group":"Review & administration","purpose":"View staff and manage authorized employee grants.","permissions":["admin.staff_view","admin.staff_manage","users.manage"],"caution":"Prevent self-escalation, owner reassignment and grants beyond the administrator’s delegation ceiling."},{"id":"store_configurator","name":"Store configurator","group":"Review & administration","purpose":"Maintain store setup, printing, tax settings and locations.","permissions":["admin.settings_view","admin.settings_manage","admin.receipt_print","admin.taxes_methods","admin.warehouses"],"caution":"Settings access does not authorize tax liabilities, sales revenue or financial statements."},{"id":"integration_operator","name":"Integration operator","group":"Review & administration","purpose":"Manage marketplace connections and stock sync without channel profit.","permissions":["vensynq.manage","inventory.view"],"caution":""},{"id":"operations_manager","name":"Operations manager","group":"Leadership","purpose":"Coordinate sales, inventory and purchasing without profit, bank or sensitive fund controls.","permissions":["sales.view","sales.create","sales.edit","sales.quotations","purchases.view","purchases.create","purchases.edit","inventory.view","inventory.adjust","inventory.transfer","admin.staff_view","reports.summary","reports.performance","approvals.view_own","approvals.submit","approvals.withdraw","approvals.resubmit"],"caution":""},{"id":"business_viewer","name":"Business performance viewer","group":"Leadership","purpose":"Read sales and staff performance without cost, profit or money balances.","permissions":["reports.summary","reports.performance"],"caution":""},{"id":"owner","name":"Owner capability reference","group":"Leadership","purpose":"Reference showing all 77 explicit capabilities; do not assign as an ordinary staff default.","permissions":["pos.open_session","pos.checkout","pos.discounts","pos.void_item","pos.refund","pos.close_session","sales.view","sales.create","sales.edit","sales.void","sales.quotations","sales.returns","inventory.view","inventory.create","inventory.edit","inventory.delete","inventory.adjust","inventory.transfer","inventory.barcodes","purchases.view","purchases.create","purchases.edit","purchases.void","purchases.costs","purchases.suppliers","finance.balances","finance.transactions","finance.receive_payment","finance.send_payment","finance.expenses","finance.journal","reports.summary","reports.financial","reports.stock","reports.performance","reports.audit","admin.staff_view","admin.staff_manage","admin.settings_view","admin.settings_manage","admin.receipt_print","admin.taxes_methods","admin.warehouses","admin.data_recovery","admin.billing_store","approvals.view","approvals.view_own","approvals.submit","approvals.inbox","approvals.review","approvals.approve","approvals.reject","approvals.return","approvals.withdraw","approvals.resubmit","approvals.configure","data.export","records.force_delete","users.manage","vensynq.manage","finance.customer_refund","finance.supplier_refund","purchases.returns","finance.capital_add","finance.owner_drawings","finance.internal_transfer","finance.balance_adjustment","finance.cheque_books.view","finance.cheque_books.manage","finance.cheques.clear","finance.cheques.override_duplicate","finance.fiscal_year.view","finance.fiscal_year.manage","finance.fiscal_year.close","finance.period_lock","finance.period_reopen","finance.period_exception"],"caution":"Reference only. Existing owner semantics remain separate. Sensitive fund changes, permanent deletion, overrides and access delegation require their own execution controls."}]');
const ROLES = {
  owner: { name: "Owner", description: "Store owner — full access", icon: Crown, color: "from-amber-500 to-yellow-600", badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" },
  admin: { name: "Admin", description: "Full management access", icon: Shield, color: "from-brand-500 to-brand-700", badge: "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400" },
  manager: { name: "Manager", description: "Operations manager", icon: Star, color: "from-blue-500 to-cyan-600", badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" },
  cashier: { name: "Cashier", description: "POS & Sales only", icon: ShoppingCart, color: "from-emerald-500 to-teal-600", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" },
  inventory_staff: { name: "Inventory Staff", description: "Stock management", icon: Package, color: "from-orange-500 to-red-600", badge: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" },
  accountant: { name: "Accountant", description: "Financial reporting", icon: DollarSign, color: "from-brand-800 to-brand-900", badge: "bg-brand-100 text-brand-800 dark:bg-brand-800/30 dark:text-brand-300" },
  support: { name: "Support", description: "Troubleshooting & Help", icon: BadgeCheck, color: "from-lime-500 to-lime-600", badge: "bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-400" },
  custom: { name: "Custom", description: "Specific permissions", icon: Settings, color: "from-neutral-500 to-neutral-600", badge: "bg-neutral-100 text-ink-secondary dark:bg-neutral-500/20 dark:text-ink-muted" },
  viewer: { name: "Viewer", description: "Read-only access", icon: Eye, color: "from-neutral-500 to-neutral-600", badge: "bg-neutral-100 text-ink-secondary dark:bg-neutral-500/20 dark:text-ink-secondary" }
};
const ROLE_PERMISSIONS = {
  admin: [
    "pos.open_session",
    "pos.checkout",
    "pos.discounts",
    "pos.void_item",
    "pos.refund",
    "pos.close_session",
    "sales.view",
    "sales.create",
    "sales.edit",
    "sales.void",
    "sales.quotations",
    "sales.returns",
    "inventory.view",
    "inventory.create",
    "inventory.edit",
    "inventory.delete",
    "inventory.adjust",
    "inventory.transfer",
    "inventory.barcodes",
    "purchases.view",
    "purchases.create",
    "purchases.edit",
    "purchases.void",
    "purchases.costs",
    "purchases.suppliers",
    "purchases.returns",
    "finance.balances",
    "finance.transactions",
    "finance.receive_payment",
    "finance.send_payment",
    "finance.expenses",
    "finance.journal",
    "finance.customer_refund",
    "finance.supplier_refund",
    "finance.capital_add",
    "finance.owner_drawings",
    "finance.internal_transfer",
    "finance.balance_adjustment",
    "finance.cheque_books.view",
    "finance.cheque_books.manage",
    "finance.cheques.clear",
    "finance.cheques.override_duplicate",
    "finance.fiscal_year.view",
    "finance.fiscal_year.manage",
    "finance.fiscal_year.close",
    "finance.period_lock",
    "finance.period_reopen",
    "finance.period_exception",
    "approvals.view",
    "approvals.view_own",
    "approvals.submit",
    "approvals.review",
    "approvals.approve",
    "approvals.reject",
    "approvals.return",
    "approvals.resubmit",
    "approvals.withdraw",
    "approvals.configure",
    "parties.view",
    "parties.contact_view",
    "reports.summary",
    "reports.sales",
    "reports.financial",
    "reports.stock",
    "reports.performance",
    "reports.audit",
    "admin.staff_view",
    "admin.staff_manage",
    "admin.settings_view",
    "admin.settings_manage",
    "admin.receipt_print",
    "admin.taxes_methods",
    "admin.warehouses",
    "admin.data_recovery",
    "admin.billing_store",
    "data.export",
    "vensynq.manage"
  ],
  manager: [
    "pos.open_session",
    "pos.checkout",
    "pos.discounts",
    "pos.void_item",
    "pos.refund",
    "pos.close_session",
    "sales.view",
    "sales.create",
    "sales.edit",
    "sales.void",
    "sales.quotations",
    "sales.returns",
    "inventory.view",
    "inventory.create",
    "inventory.edit",
    "inventory.adjust",
    "inventory.transfer",
    "inventory.barcodes",
    "purchases.view",
    "purchases.create",
    "purchases.edit",
    "purchases.costs",
    "purchases.suppliers",
    "purchases.returns",
    "finance.balances",
    "finance.transactions",
    "finance.receive_payment",
    "finance.send_payment",
    "finance.expenses",
    "finance.cheque_books.view",
    "finance.cheques.clear",
    "approvals.view",
    "approvals.view_own",
    "approvals.submit",
    "approvals.review",
    "approvals.approve",
    "approvals.reject",
    "approvals.return",
    "approvals.resubmit",
    "parties.view",
    "parties.contact_view",
    "reports.summary",
    "reports.sales",
    "reports.stock",
    "reports.performance",
    "admin.staff_view",
    "admin.settings_view",
    "admin.receipt_print"
  ],
  cashier: [
    "pos.open_session",
    "pos.checkout",
    "pos.discounts",
    "pos.close_session",
    "inventory.view",
    "approvals.view_own",
    "approvals.submit"
  ],
  inventory_staff: [
    "inventory.view",
    "inventory.create",
    "inventory.edit",
    "inventory.adjust",
    "inventory.transfer",
    "inventory.barcodes",
    "purchases.view",
    "purchases.create",
    "purchases.edit",
    "purchases.costs",
    "purchases.suppliers",
    "purchases.returns",
    "reports.stock",
    "approvals.view_own",
    "approvals.submit"
  ],
  accountant: [
    "sales.view",
    "purchases.view",
    "inventory.view",
    "parties.view",
    "parties.contact_view",
    "finance.balances",
    "finance.transactions",
    "finance.receive_payment",
    "finance.send_payment",
    "finance.expenses",
    "finance.journal",
    "finance.customer_refund",
    "finance.supplier_refund",
    "finance.internal_transfer",
    "finance.cheque_books.view",
    "finance.cheque_books.manage",
    "finance.cheques.clear",
    "finance.fiscal_year.view",
    "approvals.view",
    "approvals.view_own",
    "approvals.submit",
    "approvals.review",
    "approvals.approve",
    "approvals.reject",
    "approvals.return",
    "approvals.resubmit",
    "reports.summary",
    "reports.sales",
    "reports.financial",
    "reports.audit",
    "data.export"
  ],
  support: [
    "reports.audit",
    "admin.staff_view",
    "admin.staff_manage",
    "admin.settings_view",
    "admin.settings_manage"
  ],
  viewer: [
    "reports.summary",
    "reports.sales",
    "reports.financial",
    "reports.stock",
    "sales.view",
    "inventory.view",
    "purchases.view",
    "parties.view",
    "finance.transactions",
    "finance.cheque_books.view"
  ],
  custom: []
};
const PERMISSION_CATEGORIES = [
  {
    id: "pos_register",
    name: "POS & Register Operations",
    desc: "Shift opening, terminal checkout, cart discounts, voids and returns",
    icon: ShoppingCart,
    permissions: [
      { id: "pos.open_session", name: "Open Register Session", desc: "Start POS shifts and record opening float balances" },
      { id: "pos.checkout", name: "Scan & Checkout", desc: "Process sales and payments at the register" },
      { id: "pos.discounts", name: "Apply Cart Discounts", desc: "Apply discounts to active shopping cart items" },
      { id: "pos.void_item", name: "Void Cart Items", desc: "Void scanned items and clear active carts" },
      { id: "pos.refund", name: "Register Refunds", desc: "Process customer returns & refunds directly at the POS" },
      { id: "pos.close_session", name: "Close Shift & Count Drawer", desc: "Perform end-of-day drawer counts and close register" }
    ]
  },
  {
    id: "sales_invoices",
    name: "Sales, Invoicing & Orders",
    desc: "Direct sales orders, B2B invoices, estimates and credit notes",
    icon: FileText,
    permissions: [
      { id: "sales.view", name: "View Sales Directory", desc: "View complete list of store sales and invoice records" },
      { id: "sales.create", name: "Create Sales Invoices", desc: "Generate new direct invoices and sales orders" },
      { id: "sales.edit", name: "Edit Sales Invoices", desc: "Modify existing sales drafts or unpaid invoices" },
      { id: "sales.void", name: "Void/Cancel Invoices", desc: "Permanently cancel or delete completed sales" },
      { id: "sales.quotations", name: "Quotations & Proposals", desc: "Create and manage client estimates & quotes" },
      { id: "sales.returns", name: "Standard Returns", desc: "Handle standard customer returns and refund logs" }
    ]
  },
  {
    id: "stock_inventory",
    name: "Stock, Products & Manufacturing",
    desc: "Product catalog, BOM assemblies and warehouse adjustments",
    icon: Package,
    permissions: [
      { id: "inventory.view", name: "View Products & Stock", desc: "Access the products catalog and view stock levels" },
      { id: "inventory.create", name: "Add New Products", desc: "Add new items and setup product variations" },
      { id: "inventory.edit", name: "Edit Products", desc: "Edit product details, selling prices, tiers and BOMs" },
      { id: "inventory.delete", name: "Delete Products", desc: "Permanently remove items and BOMs from catalog" },
      { id: "inventory.adjust", name: "Manual Stock Adjustments", desc: "Manually adjust stock and execute production runs" },
      { id: "inventory.transfer", name: "Warehouse Transfers", desc: "Record moving stock between warehouse depots" },
      { id: "inventory.barcodes", name: "Print Barcode Labels", desc: "Generate barcode stickers for items" }
    ]
  },
  {
    id: "purchasing_suppliers",
    name: "Purchasing & Procurement",
    desc: "Vendor POs, supply records, debit notes and COGS margins",
    icon: Truck,
    permissions: [
      { id: "purchases.view", name: "View Purchases", desc: "View past supplier purchases & expense records" },
      { id: "purchases.create", name: "Create Purchase Orders", desc: "Generate new Purchase Orders (POs)" },
      { id: "purchases.edit", name: "Edit Purchase Orders", desc: "Modify pending or draft purchase orders" },
      { id: "purchases.void", name: "Void Purchase Orders", desc: "Cancel or delete purchase orders" },
      { id: "purchases.costs", name: "Wholesale Cost Viewer", desc: "View wholesale purchase prices & cost histories" },
      { id: "purchases.suppliers", name: "Manage Suppliers", desc: "Create supplier directories and log ledgers" },
      { id: "purchases.returns", name: "Purchase Returns", desc: "Return goods to suppliers and log debit notes" }
    ]
  },
  {
    id: "money_finance",
    name: "Cash Flow & Fund Management",
    desc: "Cash in hand, bank accounts, expenses, payments and equity transfers",
    icon: DollarSign,
    permissions: [
      { id: "finance.balances", name: "View Cash & Bank Balances", desc: "View safe deposit box, registers, & bank balances" },
      { id: "finance.transactions", name: "View Cash Flow Ledger", desc: "View list of all recent payments & cash flow history" },
      { id: "finance.receive_payment", name: "Record Customer Payments", desc: "Collect and record outstanding client money" },
      { id: "finance.send_payment", name: "Record Vendor Payments", desc: "Record payouts & pay outstanding supplier balances" },
      { id: "finance.expenses", name: "Record Business Expenses", desc: "Record operational expenses (bills, rent, electricity)" },
      { id: "finance.journal", name: "Accounting Journal Entries", desc: "Create debit/credit adjustments (bookkeeper overrides)" },
      { id: "finance.customer_refund", name: "Issue Customer Refunds", desc: "Approve and post refund payments back to customers" },
      { id: "finance.supplier_refund", name: "Receive Supplier Refunds", desc: "Approve and record refunds received from suppliers" },
      { id: "finance.capital_add", name: "Capital Injection", desc: "Record owner injecting personal funds into the business" },
      { id: "finance.owner_drawings", name: "Owner Drawings", desc: "Record owner withdrawing funds from the business for personal use" },
      { id: "finance.internal_transfer", name: "Internal Fund Transfers", desc: "Move money between cash and bank accounts within the store" },
      { id: "finance.balance_adjustment", name: "Cash/Bank Balance Adjustment", desc: "Adjust physical cash or bank balance to correct figure" }
    ]
  },
  {
    id: "banking_cheques",
    name: "Cheque Management & Banking",
    desc: "Bank cheque registers, leaf tracking, clearance and duplicates",
    icon: CreditCard,
    permissions: [
      { id: "finance.cheque_books.view", name: "View Chequebooks & Cheques", desc: "View bank chequebooks, cheque registers, and statuses" },
      { id: "finance.cheque_books.manage", name: "Manage Chequebooks", desc: "Register new chequebooks, void unused leaves, and manage books" },
      { id: "finance.cheques.clear", name: "Clear & Bounce Cheques", desc: "Mark issued or received cheques as cleared or bounced" },
      { id: "finance.cheques.override_duplicate", name: "Override Duplicate Cheques", desc: "Authorize recording of cheques flagged as duplicates" }
    ]
  },
  {
    id: "fiscal_governance",
    name: "Fiscal Governance & Periods",
    desc: "Fiscal years, year-end closing, period locks and backdating rules",
    icon: Calendar,
    permissions: [
      { id: "finance.fiscal_year.view", name: "View Fiscal Calendar", desc: "View current and historical fiscal years, periods and locks" },
      { id: "finance.fiscal_year.manage", name: "Configure Fiscal Periods", desc: "Set up fiscal years, quarters and accounting period dates" },
      { id: "finance.fiscal_year.close", name: "Close Fiscal Year", desc: "Perform year-end close and carry forward retained earnings" },
      { id: "finance.period_lock", name: "Lock Accounting Periods", desc: "Lock past calendar months/quarters against new entries" },
      { id: "finance.period_reopen", name: "Reopen Locked Periods", desc: "Reopen closed historical periods for retrospective adjustments" },
      { id: "finance.period_exception", name: "Grant Backdating Exceptions", desc: "Authorize specific users to post into locked past periods" }
    ]
  },
  {
    id: "approvals_workflow",
    name: "Approvals & Governance Workflows",
    desc: "Multi-tier authorization workflows for high-value transactions",
    icon: CheckCircle,
    permissions: [
      { id: "approvals.view", name: "View Approvals Center", desc: "Access the central approvals queue and company inbox" },
      { id: "approvals.view_own", name: "View Personal Submissions", desc: "Track status of personally submitted approval requests" },
      { id: "approvals.submit", name: "Submit for Authorization", desc: "Submit transactions exceeding limits to the approval queue" },
      { id: "approvals.review", name: "Review Approval Requests", desc: "Examine documents, line items, and audit trail before action" },
      { id: "approvals.approve", name: "Approve Transactions", desc: "Grant official authorization to execute queued transactions" },
      { id: "approvals.reject", name: "Reject Transactions", desc: "Decline queued transactions and notify submitter with reason" },
      { id: "approvals.return", name: "Return for Revision", desc: "Send documents back to submitter for corrections" },
      { id: "approvals.resubmit", name: "Resubmit Corrected Items", desc: "Submit revised documents back into the approval pipeline" },
      { id: "approvals.withdraw", name: "Withdraw Submissions", desc: "Cancel own pending authorization requests before review" },
      { id: "approvals.configure", name: "Configure Approval Policies", desc: "Set approval thresholds, required tiers and document triggers" }
    ]
  },
  {
    id: "parties_contacts",
    name: "Customer & Supplier Contacts",
    desc: "Directory of customer accounts, vendors and privacy controls",
    icon: Users,
    permissions: [
      { id: "parties.view", name: "View Parties Directory", desc: "Browse customer and supplier names, balances and credit terms" },
      { id: "parties.contact_view", name: "View Confidential Contacts", desc: "View protected phone numbers, emails, addresses and tax IDs" }
    ]
  },
  {
    id: "insights_reports",
    name: "Insights & Reports",
    desc: "Net profit margins, audits, and performance tracking",
    icon: BarChart2,
    permissions: [
      { id: "reports.summary", name: "Dashboard KPI Viewer", desc: "View net margins, global sales stats, & dashboard KPIs" },
      { id: "reports.sales", name: "Sales & Margin Reports", desc: "Analyze sales trends, gross margins and product stats" },
      { id: "reports.financial", name: "Financial Statements", desc: "Export Balance Sheets, Tax Summaries, & Profit/Loss reports" },
      { id: "reports.stock", name: "Stock Reports", desc: "Track low-stock warnings and movement histories" },
      { id: "reports.performance", name: "Staff Sales Performance", desc: "Access leaderboard metrics & staff sales counts" },
      { id: "reports.audit", name: "Security Audit Logs", desc: "Read audit trails showing exactly who performed what action" }
    ]
  },
  {
    id: "store_admin",
    name: "Store Administration",
    desc: "Staff recruitments, VAT configurations, integrations and backups",
    icon: Settings,
    permissions: [
      { id: "admin.staff_view", name: "View Staff & Attendance", desc: "View staff schedules, attendance logs, and hour sheets" },
      { id: "admin.staff_manage", name: "Manage Team & Permissions", desc: "Invite staff, edit roles, change checkboxes, or suspend" },
      { id: "admin.settings_view", name: "View General Settings", desc: "Access store details and active configurations" },
      { id: "admin.settings_manage", name: "Edit General Settings", desc: "Update operating hours, store names, or upload logos" },
      { id: "admin.receipt_print", name: "Receipt & Print Settings", desc: "Customize invoice layout printing options" },
      { id: "admin.taxes_methods", name: "Manage Taxes & Payments", desc: "Configure VAT sales tax rates & store payment modes" },
      { id: "admin.warehouses", name: "Manage Warehouses", desc: "Create new branches and inventory warehouses" },
      { id: "admin.data_recovery", name: "Data & Disaster Recovery", desc: "Restore voided items via recycle bin, or export tables" },
      { id: "admin.billing_store", name: "Billing & Store Deletion", desc: "Upgrade subscriptions, change cards, or delete store database" },
      { id: "data.export", name: "Export Store Data", desc: "Download full CSV/JSON database exports and backups" },
      { id: "vensynq.manage", name: "VenSynQ & Cloud Sync", desc: "Manage multichannel integrations, webhooks and ecommerce sync" }
    ]
  }
];
const PermissionsSelector = ({ selectedPermissions = [], onChange, disabled = false }) => {
  const tt = useTermText();
  const handleToggle = (permId) => {
    if (disabled) return;
    const isSelected = selectedPermissions.includes(permId);
    const newPerms = isSelected ? selectedPermissions.filter((p) => p !== permId) : [...selectedPermissions, permId];
    onChange(newPerms);
  };
  const handleToggleCategory = (catId, catPerms) => {
    if (disabled) return;
    const allSelected = catPerms.every((p) => selectedPermissions.includes(p.id));
    let newPerms;
    if (allSelected) {
      newPerms = selectedPermissions.filter((p) => !catPerms.some((cp) => cp.id === p));
    } else {
      const toAdd = catPerms.map((cp) => cp.id).filter((id) => !selectedPermissions.includes(id));
      newPerms = [...selectedPermissions, ...toAdd];
    }
    onChange(newPerms);
  };
  return /* @__PURE__ */ jsx("div", { className: "space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 max-h-[520px]", children: PERMISSION_CATEGORIES.map((cat) => {
    const catPerms = cat.permissions;
    const isCatActive = catPerms.every((p) => selectedPermissions.includes(p.id));
    const isCatPartial = catPerms.some((p) => selectedPermissions.includes(p.id)) && !isCatActive;
    const CatIcon = cat.icon;
    return /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-4 md:p-5 transition-all hover:border-line-strong shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 mb-3.5 pb-3.5 border-b border-line", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5", children: [
          /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl flex items-center justify-center bg-app dark:bg-neutral-800 text-brand-600 dark:text-brand-400 border border-line shrink-0", children: /* @__PURE__ */ jsx(CatIcon, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink leading-tight", children: tt(cat.name) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted leading-tight mt-0.5", children: tt(cat.desc) })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            disabled,
            onClick: () => handleToggleCategory(cat.id, catPerms),
            className: `px-3 py-1 rounded-xl text-2xs font-bold uppercase tracking-wider transition-all border shrink-0 ${isCatActive ? "bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-950/40 dark:border-brand-500/50 dark:text-brand-300 shadow-sm" : isCatPartial ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/40 dark:border-amber-500/50 dark:text-amber-300 shadow-sm" : "bg-app border-line text-ink-muted hover:text-ink dark:bg-neutral-800/60 dark:text-ink-muted dark:hover:text-ink"} ${disabled ? "cursor-not-allowed opacity-50" : ""}`,
            children: isCatActive ? "Full Access" : isCatPartial ? "Partial" : "No Access"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5", children: catPerms.map((perm) => {
        const isActive = selectedPermissions.includes(perm.id);
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            disabled,
            onClick: () => handleToggle(perm.id),
            className: `p-3 rounded-xl border flex items-start gap-3 text-left transition-all group/mod ${isActive ? "bg-brand-50/80 border-brand-300 dark:bg-brand-950/40 dark:border-brand-600/50 shadow-sm ring-1 ring-brand-500/20" : "bg-app/50 border-line hover:border-line-strong hover:bg-interactive-hover text-ink-secondary dark:bg-neutral-800/20 dark:border-neutral-700/60 dark:hover:bg-neutral-800/60"} ${disabled ? "cursor-not-allowed opacity-40" : ""}`,
            children: [
              /* @__PURE__ */ jsx("div", { className: `w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all ${isActive ? "bg-brand-600 border-brand-500 text-white shadow-sm" : "border-line dark:border-neutral-600 bg-surface dark:bg-neutral-800"}`, children: isActive && /* @__PURE__ */ jsx(Check, { size: 10, strokeWidth: 3 }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-center min-w-0", children: [
                /* @__PURE__ */ jsx("div", { className: `text-xs font-bold leading-tight ${isActive ? "text-brand-950 dark:text-brand-200" : "text-ink group-hover/mod:text-ink"}`, children: tt(perm.name) }),
                /* @__PURE__ */ jsx("div", { className: `text-2xs leading-relaxed mt-1 line-clamp-2 ${isActive ? "text-brand-800/80 dark:text-brand-300/80 font-medium" : "text-ink-muted"}`, children: tt(perm.desc) })
              ] })
            ]
          },
          perm.id
        );
      }) })
    ] }, cat.id);
  }) });
};
const StaffPresetPicker = ({ onApplyPreset, disabled = false }) => {
  const tt = useTermText();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const groups = ["All", "Sales floor", "Stock & purchasing", "Money & accounting", "Review & administration", "Leadership"];
  const filteredPresets = useMemo(() => {
    return (STAFF_PRESETS || []).filter((preset) => {
      const matchesGroup = selectedGroup === "All" || preset.group === selectedGroup;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || preset.name.toLowerCase().includes(q) || preset.purpose && preset.purpose.toLowerCase().includes(q);
      return matchesGroup && matchesSearch;
    });
  }, [selectedGroup, searchQuery]);
  return /* @__PURE__ */ jsxs("div", { className: "mb-4 relative z-20", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 bg-app/80 dark:bg-neutral-800/80 border border-line p-2.5 rounded-2xl shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 pl-1", children: [
        /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Zap, { size: 14 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "text-xs font-bold text-ink flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { children: tt("Role Templates & Presets") }),
            /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20", children: "32 Presets" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: tt("Load preconfigured permission bundles by job title") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          disabled,
          onClick: () => setIsOpen(!isOpen),
          className: `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${isOpen ? "bg-brand-600 text-white border-brand-500 shadow-sm" : "bg-surface hover:bg-interactive-hover border-line text-ink-secondary hover:text-ink"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`,
          children: [
            /* @__PURE__ */ jsx("span", { children: isOpen ? tt("Hide Presets") : tt("Browse Presets") }),
            /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: `transition-transform duration-200 ${isOpen ? "rotate-180" : ""}` })
          ]
        }
      )
    ] }),
    isOpen && /* @__PURE__ */ jsxs("div", { className: "mt-2.5 bg-surface border border-line rounded-2xl p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-line", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0", children: groups.map((g) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setSelectedGroup(g),
            className: `px-2.5 py-1 rounded-lg text-2xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${selectedGroup === g ? "bg-brand-600 text-white border-brand-500 shadow-sm" : "bg-app border-line text-ink-muted hover:text-ink"}`,
            children: tt(g)
          },
          g
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "relative min-w-[200px]", children: [
          /* @__PURE__ */ jsx(Search, { size: 13, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              placeholder: tt("Search preset..."),
              className: "w-full bg-app border border-line rounded-xl pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand-500"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar", children: [
        filteredPresets.map((preset) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "p-3 bg-app/50 hover:bg-app border border-line hover:border-line-strong rounded-xl flex flex-col justify-between gap-2.5 transition-all",
            children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 mb-1", children: [
                  /* @__PURE__ */ jsx("h5", { className: "text-xs font-bold text-ink", children: tt(preset.name) }),
                  /* @__PURE__ */ jsxs("span", { className: "text-3xs font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 whitespace-nowrap", children: [
                    preset.permissions.length,
                    " perms"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-tight line-clamp-2", children: preset.purpose }),
                preset.caution && /* @__PURE__ */ jsxs("p", { className: "text-3xs text-amber-600 dark:text-amber-400 mt-1 font-medium", children: [
                  "⚠️ ",
                  preset.caution
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1.5 pt-2 border-t border-line/60", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    disabled,
                    onClick: () => {
                      onApplyPreset(preset, "merge");
                      setIsOpen(false);
                    },
                    title: "Merge preset permissions with currently checked permissions",
                    className: "px-2.5 py-1 text-2xs font-bold uppercase tracking-wider rounded-lg border border-line bg-surface hover:bg-interactive-hover text-ink-secondary hover:text-ink transition-colors",
                    children: [
                      "+ ",
                      tt("Merge")
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    disabled,
                    onClick: () => {
                      onApplyPreset(preset, "replace");
                      setIsOpen(false);
                    },
                    title: "Replace current permissions with this preset",
                    className: "px-3 py-1 text-2xs font-bold uppercase tracking-wider rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all active:scale-95",
                    children: tt("Apply (Replace)")
                  }
                )
              ] })
            ]
          },
          preset.id
        )),
        filteredPresets.length === 0 && /* @__PURE__ */ jsx("div", { className: "col-span-full py-8 text-center text-xs text-ink-muted", children: tt("No matching presets found.") })
      ] })
    ] })
  ] });
};
const STATUS = {
  pending: { label: "Pending", color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700", dot: "bg-amber-500" },
  no_account: { label: "No Account", color: "text-ink-muted bg-neutral-50 border-line dark:bg-surface dark:text-ink-muted dark:border-line", dot: "bg-neutral-400" },
  awaiting_approval: { label: "Awaiting Approval", color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700", dot: "bg-blue-500 animate-pulse" },
  active: { label: "Active", color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700", dot: "bg-emerald-500 animate-pulse" },
  expired: { label: "Expired", color: "text-red-500 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800", dot: "bg-red-500" },
  revoked: { label: "Revoked", color: "text-red-400 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800", dot: "bg-red-400" },
  declined: { label: "Declined", color: "text-ink-muted bg-neutral-50 border-line dark:bg-surface dark:text-ink-muted", dot: "bg-neutral-400" },
  suspended: { label: "Suspended", color: "text-red-500 bg-red-50 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800", dot: "bg-red-500" }
};
const getRoleInfo = (role) => ROLES[role] || ROLES.viewer;
const getStatusCfg = (status) => STATUS[status] || STATUS.pending;
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  });
}
function AdminUsers({ users = [], invitations = [], attendance = [], staffData = [] }) {
  const { store } = usePage().props;
  const tt = useTermText();
  const [activeTab, setActiveTab] = useState("members");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortConfig, setSortConfig] = useState("sales");
  const groups = [
    {
      id: "team",
      label: "Team",
      icon: Users,
      items: [
        { id: "members", label: "Members List", icon: Users },
        { id: "invitations", label: "Invitations", icon: Send }
      ]
    },
    {
      id: "attendance",
      label: "Attendance & Sales",
      icon: Clock,
      items: [
        { id: "attendance", label: "Attendance Logs", icon: Clock },
        { id: "summaries", label: tt("Staff Summaries"), icon: BarChart2 }
      ]
    }
  ];
  const getInitialGroup = () => {
    const foundGroup = groups.find((g) => g.items.some((item) => item.id === activeTab));
    return foundGroup ? foundGroup.id : "team";
  };
  const [activeGroup, setActiveGroup] = useState(getInitialGroup);
  useEffect(() => {
    const foundGroup = groups.find((g) => g.items.some((item) => item.id === activeTab));
    if (foundGroup) {
      setActiveGroup(foundGroup.id);
    }
  }, [activeTab]);
  const stats = useMemo(() => {
    const data2 = staffData || [];
    return {
      totalStaff: data2.length,
      totalSales: data2.reduce((sum, s) => sum + (s.totalSales || 0), 0),
      totalTransactions: data2.reduce((sum, s) => sum + (s.transactionCount || 0), 0),
      topPerformer: data2.reduce((prev, current) => prev.totalSales > current.totalSales ? prev : current, {})
    };
  }, [staffData]);
  const filteredSummaries = useMemo(() => {
    const data2 = staffData || [];
    let result = data2.filter(
      (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    result.sort((a, b) => {
      if (sortConfig === "sales") return b.totalSales - a.totalSales;
      if (sortConfig === "transactions") return b.transactionCount - a.transactionCount;
      if (sortConfig === "avg") return b.avgTransaction - a.avgTransaction;
      return 0;
    });
    return result;
  }, [staffData, searchQuery, sortConfig]);
  const attendanceStats = useMemo(() => {
    const todayLogs = Object.values(attendance?.today || {});
    const activeNow = todayLogs.filter((a) => a.is_active).length;
    const totalPresent = todayLogs.length;
    const totalMins = todayLogs.reduce((sum, a) => sum + (a.total_mins || 0), 0);
    const totalHours = (totalMins / 60).toFixed(1);
    return {
      activeNow,
      totalPresent,
      totalHours: `${totalHours} hrs`,
      totalStaff: users.filter((u) => u.role !== "platform_admin").length
    };
  }, [attendance, users]);
  const formatCurrency = (value) => {
    return getCurrencySymbol() + " " + parseFloat(value || 0).toLocaleString(void 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };
  const { data, setData, post, processing, errors, reset } = useForm({
    invitee_name: "",
    invitee_email: "",
    invitee_phone: "",
    roles: ["cashier"],
    permissions: ROLE_PERMISSIONS.cashier
  });
  const activeMembers = users.filter((u) => u.role !== "platform_admin").length;
  const pendingInvites = invitations.filter((i) => ["pending", "no_account"].includes(i.status)).length;
  const awaitingApproval = invitations.filter((i) => i.status === "awaiting_approval").length;
  const filtered = useMemo(
    () => invitations.filter((inv) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (inv.invitee_name || "").toLowerCase().includes(q) || (inv.invitee_email || "").toLowerCase().includes(q) || (inv.short_code || "").toLowerCase().includes(q);
    }),
    [invitations, searchQuery]
  );
  const handleCopy = (inv) => {
    copyToClipboard(inv.short_code);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2e3);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!store?.slug) return;
    post(route("store.admin.invitations.store", { store_slug: store.slug }), {
      onSuccess: () => {
        setShowAddModal(false);
        reset();
      }
    });
  };
  const toggleRole = (roleKey) => {
    setData((d) => ({
      ...d,
      roles: [roleKey],
      permissions: ROLE_PERMISSIONS[roleKey] || []
    }));
  };
  const handleApplyPreset = (preset, mode) => {
    const targetPerms = mode === "merge" ? Array.from(/* @__PURE__ */ new Set([...data.permissions || [], ...preset.permissions])) : [...preset.permissions];
    setData((d) => ({
      ...d,
      roles: ["custom"],
      permissions: targetPerms
    }));
  };
  const action = (routeName, inv) => {
    if (!store?.slug) return;
    router.post(route(routeName, { store_slug: store.slug, invitation: inv.id }), {}, {
      onSuccess: () => setOpenMenu(null)
    });
  };
  const whatsappShare = (inv) => {
    const link = `${window.location.origin}/invite/accept?token=${inv.token || ""}`;
    const msg = encodeURIComponent(
      `Hi ${inv.invitee_name}! You've been invited to join *${store?.name}* on VenQore.

Your invite code: *${inv.short_code}*

Or click: ${link}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Team & Access Control", mode: "admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "Team Management" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-3 max-w-[1600px] mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row items-center gap-4 bg-surface border border-line p-2 rounded-2xl shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 bg-sunken p-1.5 rounded-xl shrink-0 overflow-x-auto max-w-full", children: groups.map((group) => {
          const Icon = group.icon;
          const isActive = activeGroup === group.id;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => {
                setActiveGroup(group.id);
                setActiveTab(group.items[0].id);
              },
              className: `
                                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-normal whitespace-nowrap
                                        ${isActive ? "bg-sunken text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 hover:bg-interactive-hover dark:hover:bg-interactive-hover"}
`,
              children: [
                /* @__PURE__ */ jsx(Icon, { size: 13, className: isActive ? "opacity-100" : "opacity-70" }),
                group.label
              ]
            },
            group.id
          );
        }) }),
        /* @__PURE__ */ jsx("div", { className: "hidden lg:flex items-center text-neutral-300 dark:text-ink-secondary", children: /* @__PURE__ */ jsx(ChevronRight, { size: 16 }) }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 overflow-x-auto scrollbar-hide w-full lg:w-auto flex-1", children: groups.find((g) => g.id === activeGroup)?.items.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setActiveTab(tab.id),
              className: `
                                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-normal border whitespace-nowrap
                                        ${isActive ? "bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400 font-bold" : "bg-transparent border-transparent text-ink-secondary hover:bg-interactive-hover hover:border-line dark:text-ink-muted dark:hover:bg-interactive-hover dark:hover:border-line-strong"}
`,
              children: [
                /* @__PURE__ */ jsx(Icon, { size: 13 }),
                tab.label
              ]
            },
            tab.id
          );
        }) }),
        /* @__PURE__ */ jsx("div", { className: "shrink-0 self-stretch flex items-center", children: /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowAddModal(true),
            className: "relative h-full px-5 py-2.5 !text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-slow flex items-center gap-2 overflow-hidden group shadow-xl",
            style: { color: "#ffffff" },
            children: [
              /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-neutral-900 z-0", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-20 h-20 bg-brand-600/50 rounded-full blur-xl -translate-y-1/2 translate-x-1/4 group-hover:bg-brand-500/60 transition-colors animate-pulse" }),
                /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-16 h-16 bg-brand-600/30 rounded-full blur-xl translate-y-1/3 -translate-x-1/3 group-hover:bg-brand-500/40 transition-colors" }),
                /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-60" })
              ] }),
              /* @__PURE__ */ jsx(Plus, { size: 16, strokeWidth: 3, className: "relative z-10 text-white" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline relative z-10 text-white font-bold", children: "Invite Member" })
            ]
          }
        ) })
      ] }),
      ["members", "invitations"].includes(activeTab) && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0", children: [
        /* @__PURE__ */ jsx(StatCard, { title: "Active Members", value: activeMembers, icon: /* @__PURE__ */ jsx(Users, { size: 16 }), color: "bg-brand-500" }),
        /* @__PURE__ */ jsx(StatCard, { title: "Pending Invites", value: pendingInvites, icon: /* @__PURE__ */ jsx(Send, { size: 16 }), color: "bg-amber-500" }),
        /* @__PURE__ */ jsx(StatCard, { title: "Awaiting Approval", value: awaitingApproval, icon: /* @__PURE__ */ jsx(AlertCircle, { size: 16 }), color: "bg-blue-500", subtext: awaitingApproval > 0 ? "Action required" : "" }),
        /* @__PURE__ */ jsx(StatCard, { title: "Total Invitations", value: invitations.length, icon: /* @__PURE__ */ jsx(Activity, { size: 16 }), color: "bg-neutral-500" })
      ] }),
      activeTab === "attendance" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0", children: [
        /* @__PURE__ */ jsx(StatCard, { title: "On Duty Now", value: attendanceStats.activeNow, icon: /* @__PURE__ */ jsx(Clock, { size: 16 }), color: "bg-emerald-500" }),
        /* @__PURE__ */ jsx(StatCard, { title: "Present Today", value: attendanceStats.totalPresent, icon: /* @__PURE__ */ jsx(UserCheck, { size: 16 }), color: "bg-brand-500" }),
        /* @__PURE__ */ jsx(StatCard, { title: "Total Time Logged", value: attendanceStats.totalHours, icon: /* @__PURE__ */ jsx(Timer, { size: 16 }), color: "bg-blue-500" }),
        /* @__PURE__ */ jsx(StatCard, { title: tt("Total Staff"), value: attendanceStats.totalStaff, icon: /* @__PURE__ */ jsx(Users, { size: 16 }), color: "bg-neutral-500" })
      ] }),
      activeTab === "summaries" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0", children: [
        /* @__PURE__ */ jsx(StatCard, { title: tt("Active Staff"), value: stats.totalStaff, icon: /* @__PURE__ */ jsx(Users, { size: 16 }), color: "bg-brand-500" }),
        /* @__PURE__ */ jsx(StatCard, { title: "Total Sales", value: formatCurrency(stats.totalSales), icon: /* @__PURE__ */ jsx(DollarSign, { size: 16 }), color: "bg-emerald-500" }),
        /* @__PURE__ */ jsx(StatCard, { title: "Transactions", value: stats.totalTransactions, icon: /* @__PURE__ */ jsx(Package, { size: 16 }), color: "bg-blue-500" }),
        /* @__PURE__ */ jsx(StatCard, { title: "Top Performer", value: stats.topPerformer.name || "-", icon: /* @__PURE__ */ jsx(Award, { size: 16 }), color: "bg-amber-500", subtext: stats.topPerformer.totalSales ? formatCurrency(stats.topPerformer.totalSales) : "" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center bg-surface border border-line p-3 rounded-2xl shadow-sm gap-4 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-sm font-bold uppercase tracking-wider text-ink", children: [
            activeTab === "members" && "Team Members",
            activeTab === "invitations" && "Invitations & Invites",
            activeTab === "attendance" && "Attendance Registry",
            activeTab === "summaries" && "Performance Summaries"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-sunken dark:bg-surface mx-2" }),
          activeTab === "summaries" ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-ink-muted uppercase tracking-widest mr-1", children: "Sort:" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSortConfig("sales"),
                className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-md transition-all ${sortConfig === "sales" ? "bg-emerald-600 text-white shadow-sm font-bold" : "bg-sunken text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover"}`,
                children: "Total Sales"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSortConfig("transactions"),
                className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-md transition-all ${sortConfig === "transactions" ? "bg-brand-600 text-white shadow-sm font-bold" : "bg-sunken text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover"}`,
                children: "Transactions"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSortConfig("avg"),
                className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-md transition-all ${sortConfig === "avg" ? "bg-brand-600 text-white shadow-sm font-bold" : "bg-sunken text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover"}`,
                children: "Avg. Ticket"
              }
            )
          ] }) : /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 bg-sunken p-0.5 rounded-lg text-2xs font-bold uppercase", children: /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 bg-brand-600 text-white rounded-md shadow-sm", children: "All" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative w-full md:w-72 group", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted group-focus-within:text-brand-500 transition-colors", size: 16 }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: `Search ${activeTab}...`,
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "w-full pl-9 pr-4 py-1.5 text-xs border border-line rounded-xl bg-app text-ink focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm"
            }
          )
        ] })
      ] }),
      awaitingApproval > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shrink-0", children: [
        /* @__PURE__ */ jsx(AlertCircle, { size: 18, className: "text-blue-500 shrink-0" }),
        /* @__PURE__ */ jsxs("span", { className: "text-sm font-semibold text-blue-700 dark:text-blue-300", children: [
          awaitingApproval,
          " team member",
          awaitingApproval > 1 ? "s" : "",
          " accepted their invite and ",
          awaitingApproval > 1 ? "are" : "is",
          " waiting for your approval."
        ] })
      ] }),
      activeTab === "invitations" && /* @__PURE__ */ jsx(
        InvitationsTable,
        {
          invitations: filtered,
          copiedId,
          openMenu,
          setOpenMenu,
          onCopy: handleCopy,
          onWhatsApp: whatsappShare,
          onApprove: (inv) => action("store.admin.invitations.approve", inv),
          onDecline: (inv) => action("store.admin.invitations.decline", inv),
          onRevoke: (inv) => action("store.admin.invitations.revoke", inv),
          onResend: (inv) => action("store.admin.invitations.resend", inv)
        }
      ),
      activeTab === "members" && /* @__PURE__ */ jsx(MembersTable, { users, store }),
      activeTab === "attendance" && /* @__PURE__ */ jsx(
        AttendanceTable,
        {
          attendance: attendance || { today: {}, history: {} },
          users,
          onDetail: (user) => setSelectedUser(user)
        }
      ),
      activeTab === "summaries" && /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4 h-full min-h-0 overflow-y-auto", children: /* @__PURE__ */ jsx("div", { className: "pb-4", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: filteredSummaries.length > 0 ? filteredSummaries.map((staff, index) => /* @__PURE__ */ jsxs("div", { className: "relative bg-surface rounded-2xl border border-line shadow-sm p-4 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all group", children: [
        index === 0 && sortConfig === "sales" && /* @__PURE__ */ jsxs("div", { className: "absolute top-3 right-3 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-2xs font-bold flex items-center gap-1 shadow-sm", children: [
          /* @__PURE__ */ jsx(Award, { size: 10 }),
          " Top Sales"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: `w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md ${index === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500" : index === 1 ? "bg-gradient-to-br from-neutral-400 to-neutral-500" : index === 2 ? "bg-gradient-to-br from-orange-400 to-red-500" : "bg-gradient-brand"}`, children: staff.name.charAt(0) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink truncate max-w-[150px]", children: staff.name }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: staff.role })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2 rounded-xl bg-app", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-ink-muted", children: [
              /* @__PURE__ */ jsx(DollarSign, { size: 13 }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-medium", children: "Total Sales" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-ink", children: formatCurrency(staff.totalSales) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-2 rounded-xl bg-app", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-ink-muted mb-1", children: [
                /* @__PURE__ */ jsx(Package, { size: 11 }),
                /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase", children: "Txns" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: staff.transactionCount })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-2 rounded-xl bg-app", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-ink-muted mb-1", children: [
                /* @__PURE__ */ jsx(TrendingUp, { size: 11 }),
                /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase", children: "Avg" })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "font-bold text-ink max-w-full truncate", children: [
                getCurrencySymbol(),
                " ",
                Math.round(staff.avgTransaction).toLocaleString()
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-2 border-t border-line text-xs text-ink-muted", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Clock, { size: 11 }),
              "Last Active:"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-ink-secondary", children: staff.lastActive })
          ] })
        ] })
      ] }, staff.id || index)) : /* @__PURE__ */ jsxs("div", { className: "col-span-full py-12 flex flex-col items-center justify-center text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Users, { size: 32, className: "text-ink-muted" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink-secondary dark:text-white", children: tt("No staff performance data") }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-muted", children: "Try adjusting your search criteria" })
      ] }) }) }) })
    ] }),
    selectedUser && /* @__PURE__ */ jsx(
      AttendanceDetailModal,
      {
        user: selectedUser,
        history: attendance.history?.[selectedUser.id] || {},
        onClose: () => setSelectedUser(null)
      }
    ),
    showAddModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-neutral-950/70 dark:bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-2xl w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px] border border-line flex flex-col lg:flex-row relative my-auto max-h-[92vh] overflow-hidden", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            setShowAddModal(false);
            reset();
          },
          className: "absolute top-5 right-5 p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors z-20 border border-line-subtle bg-surface",
          children: /* @__PURE__ */ jsx(X, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "w-full lg:w-[460px] xl:w-[500px] shrink-0 p-6 md:p-8 xl:p-10 border-b lg:border-b-0 lg:border-r border-line flex flex-col bg-surface overflow-y-auto custom-scrollbar", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5 mb-8", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-2xl text-ink tracking-tight", children: "Invite Member" }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-line" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink-muted uppercase tracking-widest", children: "SEND INVITATION" })
        ] }),
        /* @__PURE__ */ jsxs("form", { id: "invite-form", onSubmit: handleSubmit, className: "flex flex-col gap-8 flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("h4", { className: "flex items-center gap-2 text-xs font-bold text-ink-secondary uppercase tracking-wider", children: [
              /* @__PURE__ */ jsx(User, { size: 15, className: "text-brand-500" }),
              " Credentials"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 focus-within:text-brand-600 transition-colors text-ink-secondary", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider ml-1", children: "Name" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: data.invitee_name,
                    onChange: (e) => setData("invitee_name", e.target.value),
                    className: "w-full px-4 py-3 bg-app border border-line rounded-xl text-sm font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted dark:bg-neutral-800/80 dark:border-neutral-700 dark:text-white",
                    placeholder: "Full Name",
                    required: true
                  }
                ),
                errors.invitee_name && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 ml-1", children: errors.invitee_name })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 focus-within:text-brand-600 transition-colors text-ink-secondary", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider ml-1", children: "Email" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "email",
                    value: data.invitee_email,
                    onChange: (e) => setData("invitee_email", e.target.value),
                    className: "w-full px-4 py-3 bg-app border border-line rounded-xl text-sm font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted dark:bg-neutral-800/80 dark:border-neutral-700 dark:text-white",
                    placeholder: "Email Address",
                    required: true
                  }
                ),
                errors.invitee_email && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 ml-1", children: errors.invitee_email })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 focus-within:text-brand-600 transition-colors text-ink-secondary", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider ml-1", children: "Phone Number" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.invitee_phone,
                  onChange: (e) => setData("invitee_phone", e.target.value),
                  className: "w-full px-4 py-3 bg-app border border-line rounded-xl text-sm font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted dark:bg-neutral-800/80 dark:border-neutral-700 dark:text-white",
                  placeholder: "Optional"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("h4", { className: "flex items-center gap-2 text-xs font-bold text-ink-secondary uppercase tracking-wider", children: [
                /* @__PURE__ */ jsx(Crown, { size: 15, className: "text-brand-500" }),
                " Assign Role"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-brand-600 dark:text-brand-400 tracking-wider", children: data.roles.length > 0 ? tt(ROLES[data.roles[0]]?.name || "")?.toUpperCase() : "NONE" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: Object.entries(ROLES).map(([key, role]) => {
              const isSelected = data.roles.includes(key);
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => toggleRole(key),
                  className: `p-3.5 rounded-xl border flex gap-3 text-left transition-all ${isSelected ? "bg-brand-600 text-white border-brand-500 shadow-md ring-2 ring-brand-500/20" : "bg-app border-line hover:border-brand-400/50 hover:bg-interactive-hover text-ink dark:bg-neutral-800/60 dark:border-neutral-700"}`,
                  children: [
                    /* @__PURE__ */ jsx("div", { className: `mt-0.5 shrink-0 ${isSelected ? "text-white" : "text-brand-500 dark:text-brand-400"}`, children: /* @__PURE__ */ jsx(role.icon, { size: 18 }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("div", { className: `text-xs font-bold leading-tight ${isSelected ? "text-white" : "text-ink dark:text-white"}`, children: tt(role.name) }),
                      /* @__PURE__ */ jsx("div", { className: `text-2xs font-medium leading-tight mt-1 ${isSelected ? "text-brand-100" : "text-ink-muted"}`, children: tt(role.description) })
                    ] })
                  ]
                },
                key
              );
            }) }),
            errors.roles && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 ml-1", children: errors.roles })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 p-6 md:p-8 xl:p-10 bg-sunken/40 dark:bg-surface flex flex-col justify-between relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 right-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6 relative z-10", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxs("h4", { className: "flex items-center gap-2 text-xs font-bold text-ink uppercase tracking-wider", children: [
              /* @__PURE__ */ jsx(Shield, { size: 16, className: "text-brand-600 dark:text-brand-400" }),
              " System Visibility & Access"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted font-medium pl-6", children: "Fine-grained module access control for this member" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "px-3.5 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-2 tracking-wider uppercase", children: [
            /* @__PURE__ */ jsx(Sparkles, { size: 13 }),
            " Live Permissions Preview"
          ] })
        ] }),
        /* @__PURE__ */ jsx(StaffPresetPicker, { onApplyPreset: handleApplyPreset }),
        /* @__PURE__ */ jsx(
          PermissionsSelector,
          {
            selectedPermissions: data.permissions,
            onChange: (perms) => setData((d) => ({ ...d, roles: ["custom"], permissions: perms }))
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-6 border-t border-line flex items-center justify-between relative z-10", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Summary" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-bold text-ink", children: /* @__PURE__ */ jsxs("span", { className: data.permissions.length > 0 ? "text-brand-600 dark:text-brand-400 font-bold" : "text-ink-muted", children: [
              data.permissions.length,
              " Permissions Active"
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  setShowAddModal(false);
                  reset();
                },
                className: "px-5 py-2.5 rounded-xl border border-line bg-surface hover:bg-interactive-hover text-ink-secondary hover:text-ink text-xs font-bold uppercase tracking-wider transition-colors",
                children: "Discard"
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "submit",
                form: "invite-form",
                disabled: processing || data.roles.length === 0,
                className: "px-7 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2.5",
                children: [
                  /* @__PURE__ */ jsx(Send, { size: 15 }),
                  "Send Invitation"
                ]
              }
            )
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
function InvitationsTable({ invitations, copiedId, openMenu, setOpenMenu, onCopy, onWhatsApp, onApprove, onDecline, onRevoke, onResend }) {
  const tt = useTermText();
  if (invitations.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center text-neutral-300 dark:text-ink-secondary gap-4 bg-surface rounded-2xl border border-line", children: [
      /* @__PURE__ */ jsx(Send, { size: 64, className: "stroke-[0.7]" }),
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "No invitations yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: 'Click "Add Member" to invite your first team member.' })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "flex-1 bg-surface border border-line rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0", children: /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
    /* @__PURE__ */ jsx("thead", { className: "bg-app sticky top-0 z-10", children: /* @__PURE__ */ jsxs("tr", { className: "text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line", children: [
      /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Name & Email" }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Phone" }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Role(s)" }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Invite Code" }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Status" }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Expires" }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Actions" })
    ] }) }),
    /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: invitations.map((inv) => {
      const roles = inv.roles || ["cashier"];
      const roleInfo = getRoleInfo(roles[0]);
      roleInfo.icon;
      const st = getStatusCfg(inv.status);
      return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group", children: [
        /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-xl bg-gradient-to-br ${roleInfo.color} flex items-center justify-center text-white font-bold text-sm shadow-md`, children: (inv.invitee_name || "?").charAt(0).toUpperCase() }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-bold text-ink-secondary dark:text-ink text-sm", children: inv.invitee_name }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted font-mono", children: inv.invitee_email })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-ink-muted", children: inv.invitee_phone || /* @__PURE__ */ jsx("span", { className: "text-neutral-300", children: "—" }) }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: roles.map((r) => {
          const ri = getRoleInfo(r);
          return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${ri.badge}`, children: [
            /* @__PURE__ */ jsx(ri.icon, { size: 9 }),
            tt(ri.name)
          ] }, r);
        }) }) }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: inv.short_code ? /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => onCopy(inv),
            className: "flex items-center gap-2 px-3 py-1.5 bg-sunken hover:bg-brand-50 dark:hover:bg-brand-900/20 border border-line hover:border-brand-300 rounded-lg transition-colors group/code",
            children: [
              /* @__PURE__ */ jsx("code", { className: "text-xs font-mono font-bold text-ink-secondary group-hover/code:text-brand-600", children: inv.short_code }),
              copiedId === inv.id ? /* @__PURE__ */ jsx(Check, { size: 12, className: "text-emerald-500" }) : /* @__PURE__ */ jsx(Copy, { size: 12, className: "text-ink-muted group-hover/code:text-brand-500" })
            ]
          }
        ) : /* @__PURE__ */ jsx("span", { className: "text-neutral-300 text-xs", children: "—" }) }),
        /* @__PURE__ */ jsxs("td", { className: "px-6 py-4", children: [
          /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${st.color}`, children: [
            /* @__PURE__ */ jsx("span", { className: `w-1.5 h-1.5 rounded-full ${st.dot}` }),
            st.label
          ] }),
          inv.status === "awaiting_approval" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mt-2", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => onApprove(inv),
                className: "flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-2xs font-bold rounded-lg transition-colors",
                children: [
                  /* @__PURE__ */ jsx(Check, { size: 10 }),
                  " Approve"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => onDecline(inv),
                className: "flex items-center gap-1 px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white text-2xs font-bold rounded-lg transition-colors",
                children: [
                  /* @__PURE__ */ jsx(X, { size: 10 }),
                  " Decline"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-xs text-ink-muted", children: inv.expires_at ? new Date(inv.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—" }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right relative", children: /* @__PURE__ */ jsxs("div", { className: "relative inline-block", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setOpenMenu(openMenu === inv.id ? null : inv.id),
              className: "p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 transition-colors opacity-0 group-hover:opacity-100",
              children: /* @__PURE__ */ jsx(ChevronDown, { size: 16 })
            }
          ),
          openMenu === inv.id && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-10 z-30 w-48 bg-surface border border-line rounded-[14px] shadow-2xl py-2 overflow-hidden", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  onWhatsApp(inv);
                  setOpenMenu(null);
                },
                className: "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors",
                children: [
                  /* @__PURE__ */ jsx(MessageCircle, { size: 14, className: "text-emerald-500" }),
                  " Share via WhatsApp"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  onCopy(inv);
                  setOpenMenu(null);
                },
                className: "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors",
                children: [
                  /* @__PURE__ */ jsx(Copy, { size: 14, className: "text-brand-500" }),
                  " Copy Invite Code"
                ]
              }
            ),
            ["pending", "no_account", "expired"].includes(inv.status) && /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  onResend(inv);
                  setOpenMenu(null);
                },
                className: "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors",
                children: [
                  /* @__PURE__ */ jsx(RefreshCw, { size: 14, className: "text-blue-500" }),
                  " Resend (+48h)"
                ]
              }
            ),
            ["pending", "no_account", "awaiting_approval"].includes(inv.status) && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "my-1 border-t border-line" }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => {
                    onRevoke(inv);
                    setOpenMenu(null);
                  },
                  className: "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(Ban, { size: 14 }),
                    " Revoke Invite"
                  ]
                }
              )
            ] })
          ] })
        ] }) })
      ] }, inv.id);
    }) })
  ] }) }) });
}
function AttendanceTable({ attendance, users, onDetail }) {
  const tt = useTermText();
  const todayData = attendance.today || {};
  const staff = users.filter((u) => u.role !== "platform_admin");
  return /* @__PURE__ */ jsx("div", { className: "flex-1 bg-surface border border-line rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0", children: /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
    /* @__PURE__ */ jsx("thead", { className: "bg-app sticky top-0 z-10", children: /* @__PURE__ */ jsxs("tr", { className: "text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line", children: [
      /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: tt("Staff Member") }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Today's First In" }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Current Status" }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Total Time Today" }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Activity Insight" })
    ] }) }),
    /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: staff.map((user) => {
      const data = todayData?.[user.id];
      const isActive = data?.is_active;
      let totalTime = "—";
      if (data?.total_mins !== void 0 && data?.total_mins !== null) {
        const mins = Math.max(0, Math.round(data.total_mins));
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        totalTime = `${h}h ${m}m`;
      }
      return /* @__PURE__ */ jsxs(
        "tr",
        {
          onClick: () => onDetail(user),
          className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors cursor-pointer group",
          children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-sunken flex items-center justify-center text-ink-muted font-bold text-sm group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 transition-colors", children: user.name.charAt(0).toUpperCase() }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-ink-secondary dark:text-ink text-sm", children: user.name }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted uppercase font-bold tracking-wider", children: user.role })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-ink-muted font-mono", children: data?.first_in || /* @__PURE__ */ jsx("span", { className: "text-neutral-300", children: "Not arrived" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold uppercase border ${isActive ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200" : "bg-app text-ink-muted border-line"}`, children: [
              /* @__PURE__ */ jsx("div", { className: `w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-sunken"}` }),
              isActive ? "Present now" : "Logged out"
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm font-bold text-ink-secondary font-mono", children: totalTime }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsx("button", { className: "p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-500 transition-all", children: /* @__PURE__ */ jsx(BarChart, { size: 18 }) }) })
          ]
        },
        user.id
      );
    }) })
  ] }) }) });
}
function AttendanceDetailModal({ user, history, onClose }) {
  const [dateRange, setDateRange] = useState("30");
  const chartData = useMemo(() => {
    const rangeInt = parseInt(dateRange);
    const result = [];
    const today = /* @__PURE__ */ new Date();
    for (let i = rangeInt - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const dayLogs = history[dateStr];
      const logSummary = Array.isArray(dayLogs) ? dayLogs[0] : dayLogs;
      result.push({
        date: d.toLocaleDateString([], { month: "short", day: "numeric" }),
        in: logSummary?.in_val ?? null,
        out: logSummary?.out_val ?? null,
        inLabel: logSummary?.in ?? "—",
        outLabel: logSummary?.out ?? "—"
      });
    }
    return result;
  }, [history, dateRange]);
  const formatYAxis = (hour) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-neutral-950/70 dark:bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-2xl w-full max-w-4xl border border-line overflow-hidden flex flex-col h-[650px]", children: [
    /* @__PURE__ */ jsxs("div", { className: "px-8 py-6 bg-sunken/50 dark:bg-app border-b border-line flex justify-between items-center shrink-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ", children: user.name.charAt(0).toUpperCase() }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-xl text-ink leading-none", children: user.name }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted mt-1 uppercase font-bold tracking-widest", children: [
            user.role,
            " Analytics"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "flex bg-sunken/50 dark:bg-surface p-1 rounded-xl", children: ["7", "14", "30"].map((range) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setDateRange(range),
            className: `px-3 py-1 text-2xs font-bold uppercase rounded-lg transition-all ${dateRange === range ? "bg-sunken text-brand-600 shadow-sm" : "text-ink-muted"}`,
            children: [
              range,
              " Days"
            ]
          },
          range
        )) }),
        /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-muted hover:text-red-500 rounded-full transition-colors", children: /* @__PURE__ */ jsx(X, { size: 24 }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 p-8 overflow-y-auto", children: /* @__PURE__ */ jsxs("div", { className: "space-y-8 h-full flex flex-col", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink-muted uppercase tracking-widest", children: "Login & Logout Consistency" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1", children: "Timeline of first daily check-in vs last daily check-out." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full bg-brand-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold uppercase text-ink-muted tracking-wider", children: "Arrival Time" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full bg-rose-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold uppercase text-ink-muted tracking-wider", children: "Departure Time" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-[300px] w-full bg-surface/50 dark:bg-surface rounded-2xl border border-line p-6 relative overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "absolute inset-6", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 100, minHeight: 100, children: /* @__PURE__ */ jsxs(AreaChart, { data: chartData, children: [
        /* @__PURE__ */ jsxs("defs", { children: [
          /* @__PURE__ */ jsxs("linearGradient", { id: "colorIn", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: vq.indigo[500], stopOpacity: 0.3 }),
            /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: vq.indigo[500], stopOpacity: 0 })
          ] }),
          /* @__PURE__ */ jsxs("linearGradient", { id: "colorOut", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: vq.rose[500], stopOpacity: 0.3 }),
            /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: vq.rose[500], stopOpacity: 0 })
          ] })
        ] }),
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: vq.slate[200], opacity: 0.5 }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "date", axisLine: false, tickLine: false, tick: { fontSize: 10, fontWeight: 700, fill: vq.slate[500] }, dy: 10 }),
        /* @__PURE__ */ jsx(YAxis, { domain: [0, 24], axisLine: false, tickLine: false, tick: { fontSize: 9, fontWeight: 700, fill: vq.slate[400] }, tickFormatter: formatYAxis, ticks: [0, 4, 8, 12, 16, 20, 24] }),
        /* @__PURE__ */ jsx(Tooltip, { content: ({ active, payload }) => {
          if (active && payload && payload.length) {
            return /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line p-4 rounded-2xl shadow-2xl", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink mb-2", children: payload[0].payload.date }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted uppercase", children: "First In:" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-brand-600", children: payload[0].payload.inLabel || "—" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted uppercase", children: "Last Out:" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-rose-500", children: payload[0].payload.outLabel || "—" })
                ] })
              ] })
            ] });
          }
          return null;
        } }),
        /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "in", stroke: vq.indigo[500], strokeWidth: 3, fillOpacity: 1, fill: "url(#colorIn)" }),
        /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "out", stroke: vq.rose[500], strokeWidth: 3, fillOpacity: 1, fill: "url(#colorOut)" }),
        /* @__PURE__ */ jsx(ReferenceLine, { y: 9, stroke: vq.indigo[500], strokeDasharray: "3 3", opacity: 0.3, label: { position: "right", value: "9 AM", fill: vq.indigo[500], fontSize: 10 } }),
        /* @__PURE__ */ jsx(ReferenceLine, { y: 18, stroke: vq.rose[500], strokeDasharray: "3 3", opacity: 0.3, label: { position: "right", value: "6 PM", fill: vq.rose[500], fontSize: 10 } })
      ] }) }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl border border-brand-100 dark:border-brand-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
            /* @__PURE__ */ jsx(Zap, { size: 14, className: "text-brand-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-brand-600 uppercase", children: "Average In" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-brand-700 dark:text-brand-400", children: chartData.filter((d) => d.in).length > 0 ? (() => {
            const avg = chartData.filter((d) => d.in).reduce((s, d) => s + d.in, 0) / chartData.filter((d) => d.in).length;
            const h = Math.floor(avg);
            const m = Math.round((avg - h) * 60);
            return `${h}:${m < 10 ? "0" + m : m}`;
          })() : "—" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
            /* @__PURE__ */ jsx(RotateCcw, { size: 14, className: "text-rose-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-rose-600 uppercase", children: "Average Out" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-rose-700 dark:text-rose-400", children: chartData.filter((d) => d.out).length > 0 ? (() => {
            const avg = chartData.filter((d) => d.out).reduce((s, d) => s + d.out, 0) / chartData.filter((d) => d.out).length;
            const h = Math.floor(avg);
            const m = Math.round((avg - h) * 60);
            return `${h}:${m < 10 ? "0" + m : m}`;
          })() : "—" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-app p-4 rounded-2xl border border-line", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1 text-ink-muted", children: [
            /* @__PURE__ */ jsx(Activity, { size: 14 }),
            /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold uppercase", children: "Punctuality" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink", children: "Professional" })
        ] })
      ] })
    ] }) })
  ] }) });
}
function EditMemberModal({ member, onClose }) {
  const { store } = usePage().props;
  const tt = useTermText();
  const { data, setData, patch, processing, errors } = useForm({
    role: member.role || "custom",
    custom_role_name: member.custom_role_name ?? "",
    display_name: member.display_name ?? "",
    status: member.status,
    permissions: member.permissions ?? ROLE_PERMISSIONS[member.role] ?? [],
    passcode: "",
    transaction_approval_mode: member.transaction_approval_mode ?? "inherit",
    permission_override_mode: member.permission_override_mode ?? "inherit",
    approval_overrides: member.approval_overrides ?? {}
  });
  const toggleRole = (roleKey) => {
    setData((d) => ({
      ...d,
      role: roleKey,
      permissions: ROLE_PERMISSIONS[roleKey] || [],
      permission_override_mode: "inherit"
    }));
  };
  const handleApplyPreset = (preset, mode) => {
    const targetPerms = mode === "merge" ? Array.from(/* @__PURE__ */ new Set([...data.permissions || [], ...preset.permissions])) : [...preset.permissions];
    setData((d) => ({
      ...d,
      role: "custom",
      custom_role_name: mode === "replace" ? preset.name : d.custom_role_name || preset.name,
      permissions: targetPerms,
      permission_override_mode: "custom"
    }));
  };
  const submit = (e) => {
    e.preventDefault();
    if (!store?.slug) return;
    console.log("Submitting data:", JSON.stringify(data));
    console.log("Patching to:", route("store.admin.users.update", { store_slug: store.slug, member: member.membership_id }));
    patch(route("store.admin.users.update", { store_slug: store.slug, member: member.membership_id }), {
      onSuccess: onClose
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-neutral-950/70 dark:bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-2xl w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px] border border-line flex flex-col lg:flex-row relative my-auto max-h-[92vh] overflow-hidden", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onClose,
        className: "absolute top-5 right-5 p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors z-20 border border-line-subtle bg-surface",
        children: /* @__PURE__ */ jsx(X, { size: 20 })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "w-full lg:w-[460px] xl:w-[500px] shrink-0 p-6 md:p-8 xl:p-10 border-b lg:border-b-0 lg:border-r border-line flex flex-col bg-surface overflow-y-auto custom-scrollbar max-h-[90vh]", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5 mb-8", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-2xl text-ink tracking-tight", children: "Edit Member" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-line" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest truncate", children: member.name })
      ] }),
      /* @__PURE__ */ jsxs("form", { id: "edit-member-form", onSubmit: submit, className: "flex flex-col gap-8 flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("h4", { className: "flex items-center gap-2 text-xs font-bold text-ink-secondary uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx(User, { size: 15, className: "text-brand-500" }),
            " Member Profile"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 focus-within:text-brand-600 transition-colors text-ink-secondary", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider ml-1", children: "Display Name" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.display_name,
                onChange: (e) => setData("display_name", e.target.value),
                className: "w-full px-4 py-3 bg-app border border-line rounded-xl text-sm font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted dark:bg-neutral-800/80 dark:border-neutral-700 dark:text-white",
                placeholder: "Display Name",
                required: true
              }
            ),
            errors.display_name && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 ml-1", children: errors.display_name })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 focus-within:text-brand-600 transition-colors text-ink-secondary", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider ml-1", children: "Status" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: data.status,
                  onChange: (e) => setData("status", e.target.value),
                  disabled: member.role === "owner",
                  className: "w-full px-4 py-3 bg-app border border-line rounded-xl text-sm font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:bg-neutral-800/80 dark:border-neutral-700 dark:text-white",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "active", children: "Active" }),
                    /* @__PURE__ */ jsx("option", { value: "suspended", children: "Suspended" })
                  ]
                }
              ),
              errors.status && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 ml-1", children: errors.status })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 focus-within:text-brand-600 transition-colors text-ink-secondary", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider ml-1", children: "Passcode PIN" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "password",
                  value: data.passcode,
                  onChange: (e) => setData("passcode", e.target.value),
                  className: "w-full px-4 py-3 bg-app border border-line rounded-xl text-sm font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-ink-muted font-mono dark:bg-neutral-800/80 dark:border-neutral-700 dark:text-white",
                  placeholder: "Keep original PIN",
                  maxLength: 6
                }
              ),
              errors.passcode && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 ml-1", children: errors.passcode })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("h4", { className: "flex items-center gap-2 text-xs font-bold text-ink-secondary uppercase tracking-wider", children: [
              /* @__PURE__ */ jsx(Crown, { size: 15, className: "text-brand-500" }),
              " Assign Role"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-brand-600 dark:text-brand-400 tracking-wider", children: data.role ? tt(ROLES[data.role]?.name || "")?.toUpperCase() : "NONE" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: Object.entries(ROLES).map(([key, role]) => {
            const isSelected = data.role === key;
            const isOwner = member.role === "owner";
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                disabled: isOwner,
                onClick: () => toggleRole(key),
                className: `p-3.5 rounded-xl border flex gap-3 text-left transition-all ${isSelected ? "bg-brand-600 text-white border-brand-500 shadow-md ring-2 ring-brand-500/20" : "bg-app border-line hover:border-brand-400/50 hover:bg-interactive-hover text-ink dark:bg-neutral-800/60 dark:border-neutral-700"} ${isOwner ? "opacity-50 cursor-not-allowed" : ""}`,
                children: [
                  /* @__PURE__ */ jsx("div", { className: `mt-0.5 shrink-0 ${isSelected ? "text-white" : "text-brand-500 dark:text-brand-400"}`, children: /* @__PURE__ */ jsx(role.icon, { size: 18 }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("div", { className: `text-xs font-bold leading-tight ${isSelected ? "text-white" : "text-ink dark:text-white"}`, children: tt(role.name) }),
                    /* @__PURE__ */ jsx("div", { className: `text-2xs font-medium leading-tight mt-1 ${isSelected ? "text-brand-100" : "text-ink-muted"}`, children: tt(role.description) })
                  ] })
                ]
              },
              key
            );
          }) }),
          data.role === "custom" && /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
            /* @__PURE__ */ jsxs("label", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1 block", children: [
              "Custom Role Name ",
              /* @__PURE__ */ jsx("span", { className: "text-ink-muted font-normal normal-case", children: "(optional — shown as badge)" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                maxLength: 30,
                placeholder: "e.g. Senior Accountant, Floor Supervisor...",
                value: data.custom_role_name,
                onChange: (e) => setData("custom_role_name", e.target.value),
                className: "w-full bg-app border border-line rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500 transition dark:bg-neutral-800/80 dark:border-neutral-700 dark:text-white"
              }
            )
          ] }),
          errors.role && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 ml-1", children: errors.role })
        ] }),
        member.role !== "owner" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("h4", { className: "flex items-center gap-2 text-xs font-bold text-ink-secondary uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx(Shield, { size: 15, className: "text-brand-500" }),
            " Transaction Approval"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted leading-relaxed", children: "Controls whether this employee's transactions require a supervisor to approve before they post." }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2.5", children: [
            {
              value: "inherit",
              label: "Follow store policy",
              description: "Uses the store-wide approval setting"
            },
            {
              value: "required",
              label: "Always require approval",
              description: "Every transaction this employee creates goes to the approval queue"
            },
            {
              value: "direct",
              label: "Always post directly",
              description: "Bypasses the approval queue regardless of store policy"
            }
          ].map((opt) => /* @__PURE__ */ jsxs(
            "label",
            {
              className: `flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${data.transaction_approval_mode === opt.value ? "bg-brand-50/80 border-brand-300 dark:bg-brand-950/40 dark:border-brand-500 shadow-sm ring-1 ring-brand-500/20" : "bg-app border-line hover:border-line-strong text-ink dark:bg-neutral-800/40 dark:border-neutral-700"}`,
              children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "radio",
                    name: "transaction_approval_mode",
                    value: opt.value,
                    checked: data.transaction_approval_mode === opt.value,
                    onChange: () => setData("transaction_approval_mode", opt.value),
                    className: "mt-0.5 accent-brand-500 shrink-0"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-ink", children: opt.label }),
                  /* @__PURE__ */ jsx("div", { className: "text-2xs text-ink-muted mt-0.5", children: opt.description })
                ] })
              ]
            },
            opt.value
          )) }),
          errors.transaction_approval_mode && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 ml-1", children: errors.transaction_approval_mode }),
          /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-line space-y-2.5", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-ink-secondary uppercase tracking-wider", children: "Action-Specific Approval Overrides" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Override default store and role policy for specific operations:" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar", children: [
              { key: "customer_receipt", label: "Customer Receipts" },
              { key: "supplier_payment", label: "Supplier Payments" },
              { key: "sales_invoice", label: "Admin Sales Invoices" },
              { key: "operating_expense", label: "Operating Expenses" },
              { key: "supplier_refund", label: "Supplier Refunds" },
              { key: "purchase_posting", label: "Purchase & Bills" },
              { key: "sales_return", label: "Sales Returns & Refunds" },
              { key: "purchase_return", label: "Purchase Returns (Debit Notes)" },
              { key: "capital_injection", label: "Owner Capital Injection" },
              { key: "owner_drawings", label: "Owner Drawings" },
              { key: "fund_transfer", label: "Internal Fund Transfers" },
              { key: "balance_adjustment", label: "Balance Adjustments" }
            ].map((action) => {
              const currentVal = data.approval_overrides?.[action.key] || "inherit";
              return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2.5 rounded-xl bg-app border border-line dark:bg-neutral-800/50 dark:border-neutral-700", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-ink", children: action.label }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: currentVal,
                    onChange: (e) => setData("approval_overrides", {
                      ...data.approval_overrides,
                      [action.key]: e.target.value
                    }),
                    className: "bg-surface border border-line rounded-lg px-2.5 py-1 text-xs text-ink focus:outline-none focus:border-brand-500 dark:bg-neutral-900 dark:border-neutral-600 dark:text-white",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "inherit", children: "Inherit" }),
                      /* @__PURE__ */ jsx("option", { value: "direct", children: "Direct" }),
                      /* @__PURE__ */ jsx("option", { value: "required", children: "Required" })
                    ]
                  }
                )
              ] }, action.key);
            }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 p-6 md:p-8 xl:p-10 bg-sunken/40 dark:bg-surface flex flex-col justify-between relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 right-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6 relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxs("h4", { className: "flex items-center gap-2 text-xs font-bold text-ink uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx(Shield, { size: 16, className: "text-brand-600 dark:text-brand-400" }),
            " System Visibility & Access"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted font-medium pl-6", children: "Module Access Control" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "px-3.5 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-2 tracking-wider uppercase", children: [
          /* @__PURE__ */ jsx(Sparkles, { size: 13 }),
          " Live Permissions Preview"
        ] })
      ] }),
      /* @__PURE__ */ jsx(StaffPresetPicker, { onApplyPreset: handleApplyPreset, disabled: member.role === "owner" }),
      /* @__PURE__ */ jsx(
        PermissionsSelector,
        {
          selectedPermissions: data.permissions,
          onChange: (perms) => setData((d) => ({ ...d, role: "custom", permissions: perms })),
          disabled: member.role === "owner"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-6 border-t border-line flex items-center justify-between relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Summary" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm font-bold text-ink", children: /* @__PURE__ */ jsxs("span", { className: data.permissions.length > 0 ? "text-brand-600 dark:text-brand-400 font-bold" : "text-ink-muted", children: [
            data.permissions.length,
            " Permissions Active"
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "px-5 py-2.5 rounded-xl border border-line bg-surface hover:bg-interactive-hover text-ink-secondary hover:text-ink text-xs font-bold uppercase tracking-wider transition-colors",
              children: "Discard"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              form: "edit-member-form",
              disabled: processing,
              className: "px-7 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2.5",
              children: [
                /* @__PURE__ */ jsx(Check, { size: 16 }),
                "Save Changes"
              ]
            }
          )
        ] })
      ] })
    ] })
  ] }) });
}
function MembersTable({ users, store }) {
  const { my_role } = usePage().props;
  const tt = useTermText();
  const canManage = ["owner", "admin"].includes(my_role);
  const [openMenu, setOpenMenu] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const filtered = users.filter((u) => u.role !== "platform_admin");
  const handleRemove = (member) => {
    if (!confirm(`Remove ${member.name} from the store? They will lose all access immediately.`)) return;
    if (!store?.slug) return;
    router.delete(route("store.admin.users.remove", { store_slug: store.slug, member: member.membership_id }), {
      onSuccess: () => setOpenMenu(null)
    });
  };
  if (filtered.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center text-neutral-300 dark:text-ink-secondary gap-4 bg-surface rounded-2xl border border-line", children: [
      /* @__PURE__ */ jsx(Users, { size: 64, className: "stroke-[0.7]" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm", children: "No active members yet. Invite someone to get started." })
    ] });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    editingMember && /* @__PURE__ */ jsx(
      EditMemberModal,
      {
        member: editingMember,
        onClose: () => setEditingMember(null)
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "flex-1 bg-surface border border-line rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0", children: /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-app sticky top-0 z-10", children: /* @__PURE__ */ jsxs("tr", { className: "text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line", children: [
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Member" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Role & Access" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Email" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Joined" }),
        canManage && /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: filtered.map((user) => {
        const resolvedRole = (() => {
          if (user.role && user.role !== "custom" && ROLES[user.role]) return user.role;
          if (user.custom_role_name) return "custom";
          let bestMatch = "custom";
          let bestScore = -1;
          const userPerms = user.permissions ?? [];
          for (const [key, perms] of Object.entries(ROLE_PERMISSIONS)) {
            if (key === "custom" || !perms.length) continue;
            const score = perms.filter((p) => userPerms.includes(p)).length;
            if (score > bestScore) {
              bestScore = score;
              bestMatch = key;
            }
          }
          return bestMatch;
        })();
        const role = getRoleInfo(resolvedRole);
        const RoleIcon = role.icon;
        const badgeLabel = user.role === "custom" && user.custom_role_name ? user.custom_role_name : tt(role.name);
        const st = getStatusCfg(user.status);
        const isOwner = user.role === "owner";
        return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white font-bold shadow-md`, children: user.name.charAt(0).toUpperCase() }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("p", { className: "font-bold text-ink-secondary dark:text-ink text-sm", children: [
                user.display_name || user.name,
                user.role === "owner" && /* @__PURE__ */ jsx("span", { className: "ml-2 text-2xs font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-widest", children: "Owner" })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted font-mono", children: [
                "ID: ",
                user.id
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${role.badge}`, children: [
            /* @__PURE__ */ jsx(RoleIcon, { size: 10 }),
            badgeLabel
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-ink-muted font-mono", children: user.email }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${st.color}`, children: [
            /* @__PURE__ */ jsx("span", { className: `w-1.5 h-1.5 rounded-full ${st.dot}` }),
            st.label
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-ink-muted", children: new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }),
          canManage && /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right relative", children: !isOwner && /* @__PURE__ */ jsxs("div", { className: "relative inline-block", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setOpenMenu(openMenu === user.id ? null : user.id),
                className: "p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 transition-colors opacity-0 group-hover:opacity-100",
                children: /* @__PURE__ */ jsx(ChevronDown, { size: 16 })
              }
            ),
            openMenu === user.id && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-20", onClick: () => setOpenMenu(null) }),
              /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-10 z-30 w-48 bg-surface border border-line rounded-[14px] shadow-2xl py-2 overflow-hidden text-left", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      setEditingMember(user);
                      setOpenMenu(null);
                    },
                    className: "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors",
                    children: [
                      /* @__PURE__ */ jsx(Edit3, { size: 14, className: "text-brand-500" }),
                      " Edit Role & Access"
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "my-1 border-t border-line" }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => handleRemove(user),
                    className: "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors",
                    children: [
                      /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                      " Remove Member"
                    ]
                  }
                )
              ] })
            ] })
          ] }) })
        ] }, user.id);
      }) })
    ] }) }) })
  ] });
}
function StatCard({ title, value, icon, color, subtext }) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-1.5 rounded-xl border border-line shadow-sm flex items-center justify-between group hover:shadow-md transition-all", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
      /* @__PURE__ */ jsx("div", { className: `w-8 h-8 ${color} rounded-lg flex items-center justify-center text-white shrink-0 shadow-md `, children: icon }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider", children: title }),
        subtext && /* @__PURE__ */ jsx("p", { className: "text-4xs text-amber-500 font-semibold", children: subtext })
      ] })
    ] }),
    /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-ink", children: value || 0 })
  ] });
}
export {
  AdminUsers as default
};

import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useState, useCallback } from "react";
import { Head, router, usePage, useForm } from "@inertiajs/react";
import { P as PlatformShell } from "./PlatformShell-CbpSfCJ6.js";
import { v as vq } from "./marketing-pages-CTBAvetE.js";
import { Activity, Table2, Grid3x3, Database, LayoutGrid, Star, Edit3, Copy, Trash2, ChevronRight, ChevronDown, Shield, RefreshCw, Save, Layers, Info, Zap, Ticket, Server, Award } from "lucide-react";
import "./PlatformLayout-CFRlnfbA.js";
import "./ui-CLtSftB2.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
const FEATURE_GROUPS = [
  // ────────────────────────────────────────────────────────────────────────
  // Part 1 — Onboarding, Setup & First Impression  (Features 1–20)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "onboarding",
    emoji: "🚀",
    label: "Onboarding & First Impression",
    description: "Landing page, trial, instant setup, and platform presence features.",
    features: [
      { key: "demo_store", label: "#1 · Interactive Demo Store", type: "boolean", note: "One-click demo launch from landing page" },
      { key: "free_trial_days", label: "#2 · Free Trial Days", type: "number", note: "Blank = no trial; 14 = two-week trial" },
      { key: "instant_store_creator", label: "#3 · Instant Store Creator (Name Only)", type: "boolean", note: "Infrastructure — normally always enabled" },
      { key: "industry_seeding", label: "#4 · Smart Industry Archetype Seeding", type: "boolean" },
      { key: "dark_theme", label: '#5 · "Midnight Nebula" Dark Theme', type: "boolean" },
      { key: "light_theme", label: "#6 · Harmonious Light Theme", type: "boolean" },
      { key: "multi_store_hub", label: "#7 · Multi-Store Hub Dashboard", type: "boolean" },
      { key: "multi_store_roles", label: "#8 · Granular Multi-Store User Roles", type: "boolean" },
      { key: "cashier_pin_login", label: "#9 · Instant Cashier PIN Login", type: "boolean" },
      { key: "device_adaptive", label: "#10 · Device-Adaptive Layouts", type: "boolean" },
      { key: "pwa_install", label: "#11 · Web App / PWA Install", type: "boolean" },
      { key: "guided_setup_tour", label: "#12 · Self-Guiding Setup Tour", type: "boolean" },
      { key: "coupon_stacking", label: "#13 · Flexible Coupon Code Stacking", type: "boolean" },
      { key: "platform_status_badge", label: "#14 · Platform Live Status Badge", type: "boolean" },
      { key: "system_cache_refresher", label: "#15 · System Cache Refresher", type: "boolean" },
      { key: "owner_profile_card", label: "#16 · Owner Profile Card", type: "boolean" },
      { key: "one_click_system_wipe", label: "#17 · One-Click System Wipe", type: "boolean" },
      { key: "smtp_mail", label: "#18 · Custom SMTP Mail Server", type: "boolean" },
      { key: "sms_gateway", label: "#19 · SMS Gateway Integrations", type: "boolean" },
      { key: "security_activity_log", label: "#20 · Security Activity Log", type: "boolean" }
    ]
  },
  // ────────────────────────────────────────────────────────────────────────
  // Part 2 — POS Supercharged Checkout  (Features 21–55)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "pos",
    emoji: "🛒",
    label: "POS & Supercharged Checkout",
    description: "Checkout terminal, scanner, printing, and payment features.",
    features: [
      { key: "barcode_scanner", label: "#21 · Instant Barcode Scanner Integration", type: "boolean" },
      { key: "imei_scanner", label: "#22 · Unique Serial & IMEI Scanner", type: "boolean" },
      { key: "keyboard_hotkeys", label: "#23 · High-Speed Keyboard-First Checkout", type: "boolean" },
      { key: "senior_mode", label: '#24 · Accessibility "Senior Mode" Toggle', type: "boolean" },
      { key: "high_contrast_colors", label: "#25 · High-Contrast Price/Qty Color Coding", type: "boolean" },
      { key: "profit_peek", label: '#26 · Secret Owner "Profit Peek" Swipe', type: "boolean" },
      { key: "cart_tabs_limit", label: "#27 · Multi-Tab Customer Checkout", type: "number", note: "Max parallel cart tabs (blank = unlimited)" },
      { key: "park_recall", label: "#28 · Park & Recall (Hold Bill)", type: "boolean" },
      { key: "inflight_product_creation", label: "#29 · In-Flight Product Creation", type: "boolean" },
      { key: "cart_session_protection", label: "#30 · Cart Rescue & Session Protection", type: "boolean" },
      { key: "contextual_qty_modifiers", label: "#31 · Contextual Quantity Modifiers", type: "boolean" },
      { key: "auto_customer_discounts", label: "#32 · Auto-Applying Customer Discounts", type: "boolean" },
      { key: "fuzzy_product_finder", label: "#33 · Typo Fuzzy Finder (Product Search)", type: "boolean" },
      { key: "auto_cash_rounding", label: "#34 · Automatic Cash Rounding", type: "boolean" },
      { key: "split_payments", label: "#35 · Multi-Account Split Payments", type: "boolean" },
      { key: "daily_cash_audit", label: "#36 · Daily Cash Register Audit", type: "boolean" },
      { key: "silent_webusb_printing", label: "#37 · Silent WebUSB Thermal Printing", type: "boolean" },
      { key: "receipt_cutline_padding", label: "#38 · Receipt Cut-Line Padding", type: "boolean" },
      { key: "custom_thermal_widths", label: "#39 · Custom Thermal Roll Widths (80/58mm)", type: "boolean" },
      { key: "dynamic_accent_colors", label: "#40 · Dynamic Accent Colors on Docs", type: "boolean" },
      { key: "invoice_column_toggles", label: "#41 · Column Toggles on Invoices", type: "boolean" },
      { key: "amount_to_words", label: "#42 · Dynamic Amount-to-Words Translation", type: "boolean" },
      { key: "receipt_qr_code", label: "#43 · Verification QR Code Generation", type: "boolean" },
      { key: "branded_receipt_sync", label: "#44 · Branded Receipt Sync (Logo/Header)", type: "boolean" },
      { key: "auto_assembly_checkout", label: "#45 · Auto-Assembly Composite Items at POS", type: "boolean" },
      { key: "pos_negative_stock_alert", label: "#46 · POS Negative Stock Alert Badge", type: "boolean" },
      { key: "negative_stock_lock", label: "#47 · Negative Stock Sales Lock", type: "boolean" },
      { key: "service_fee_additions", label: "#48 · Dynamic Service Fee Additions", type: "boolean" },
      { key: "auto_vat_gst", label: "#49 · Automatic VAT/GST Calculations", type: "boolean" },
      { key: "custom_charge_toggle", label: "#50 · Quick Custom Charge Toggle", type: "boolean" },
      { key: "fuzzy_customer_lookup", label: "#51 · Fuzzy Customer Name Lookup", type: "boolean" },
      { key: "recent_invoices_panel", label: "#52 · Recent Invoices List (Last 50)", type: "boolean" },
      { key: "cashier_change_helper", label: "#53 · Cashier Change Helper", type: "boolean" },
      { key: "barcode_label_print", label: "#54 · Barcode Label Printing Factory", type: "boolean" },
      { key: "label_qr_codes", label: "#55 · Dynamic Label QR Codes", type: "boolean" }
    ]
  },
  // ────────────────────────────────────────────────────────────────────────
  // Part 3 — Invoicing, Customer Khata & Receivables  (Features 56–90)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "invoicing",
    emoji: "🧾",
    label: "Invoicing, Khata & Receivables",
    description: "Customer credit tracking, invoicing, loyalty, and debt collection.",
    features: [
      { key: "customer_khata", label: "#56 · Customer Credit Registry (Khata)", type: "boolean" },
      { key: "customer_payments_log", label: "#57 · Customer Payments Log", type: "boolean" },
      { key: "customer_statements", label: "#58 · Customer Statement Generator (PDF)", type: "boolean" },
      { key: "aged_receivables", label: "#59 · Aged Receivables / Sales Aging Report", type: "boolean" },
      { key: "whatsapp_reminders", label: "#60 · Dynamic WhatsApp Debt Reminders", type: "boolean" },
      { key: "sms_debt_alerts", label: "#61 · Frictionless SMS Debt Alerts", type: "boolean" },
      { key: "credit_limit_rules", label: "#62 · Credit Limit Rules", type: "boolean" },
      { key: "multi_payment_invoices", label: "#63 · Multi-Payment Invoices (Partial)", type: "boolean" },
      { key: "customer_payment_alloc", label: "#64 · Customer Payment Allocations", type: "boolean" },
      { key: "anniversary_tracker", label: "#65 · Customer Birth & Anniversary Tracker", type: "boolean" },
      { key: "customer_ltv_score", label: "#66 · Customer Lifetime Value Score", type: "boolean" },
      { key: "customer_wallet", label: "#67 · Customer Wallet Credit", type: "boolean" },
      { key: "loyalty_points", label: "#68 · Loyalty Points System", type: "boolean" },
      { key: "digital_gift_cards", label: "#69 · Digital Gift Cards", type: "boolean" },
      { key: "wholesale_pricing", label: "#70 · Wholesale vs Retail Pricing Tiers", type: "boolean" },
      { key: "b2b_proposal_builder", label: "#71 · B2B Proposal Builder", type: "boolean" },
      { key: "quotation_conversion", label: "#72 · One-Click Quotation Conversion", type: "boolean" },
      { key: "inflight_session_recovery", label: "#73 · In-Flight Session Recovery", type: "boolean" },
      { key: "tax_inclusive_exclusive", label: "#74 · Invoiced Tax Inclusive/Exclusive Toggle", type: "boolean" },
      { key: "b2b_margin_displayer", label: "#75 · B2B Invoice Margin Displayer", type: "boolean" },
      { key: "sales_return_vouchers", label: "#76 · Sales Return Vouchers", type: "boolean" },
      { key: "b2b_invoice_designer", label: "#77 · Interactive B2B Invoice Designer", type: "boolean" },
      { key: "pre_sales_reservation", label: "#78 · Pre-Sales Reservation Mode", type: "boolean" },
      { key: "recurring_invoicing", label: "#79 · Automated Recurring Invoicing", type: "boolean" },
      { key: "refund_reason_analysis", label: "#80 · Refund Reason Analysis", type: "boolean" },
      { key: "tax_exempt_customers", label: "#81 · Tax-Exempt Customer Toggles", type: "boolean" },
      { key: "customer_address_book", label: "#82 · Customer Address Book", type: "boolean" },
      { key: "a4_invoice_pdf", label: "#83 · A4 Corporate Invoice Export", type: "boolean" },
      { key: "letter_size_invoice", label: "#84 · Letter-Size Invoice Format", type: "boolean" },
      { key: "outstanding_balance_grid", label: "#85 · Detailed Outstanding Balance Grid", type: "boolean" },
      { key: "payment_due_dates", label: "#86 · Customer Payment Due Dates", type: "boolean" },
      { key: "overdue_highlights", label: "#87 · Overdue Customer Highlights (Red)", type: "boolean" },
      { key: "lump_sum_payments", label: "#88 · Lump-Sum Customer Payments", type: "boolean" },
      { key: "partial_payment_indicator", label: "#89 · Partial Payment Indicator Badge", type: "boolean" },
      { key: "unified_party_ledger", label: "#90 · Unified Party Ledger", type: "boolean" }
    ]
  },
  // ────────────────────────────────────────────────────────────────────────
  // Part 4 — Procurement, Suppliers & Payables  (Features 91–115)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "procurement",
    emoji: "📦",
    label: "Procurement & Suppliers",
    description: "Vendor management, purchase orders, payables, and supplier tracking.",
    features: [
      { key: "supplier_khata", label: "#91 · Supplier Credit Register (Khata)", type: "boolean" },
      { key: "delayed_supplier_payments", label: "#92 · Delayed Supplier Payments", type: "boolean" },
      { key: "supplier_statements", label: "#93 · Supplier Statement Generator (PDF)", type: "boolean" },
      { key: "aged_payables", label: "#94 · Aged Payables Directory", type: "boolean" },
      { key: "installment_payments", label: "#95 · Installment Payments Log", type: "boolean" },
      { key: "purchase_orders", label: "#96 · Purchase Orders (POs) Tracker", type: "boolean" },
      { key: "partial_shipments", label: "#97 · Partial Shipments Intake", type: "boolean" },
      { key: "supplier_debit_notes", label: "#98 · Supplier Debit Notes", type: "boolean" },
      { key: "auto_cost_adjuster", label: "#99 · Automated Cost Price Adjuster", type: "boolean" },
      { key: "cost_price_fluctuator", label: "#100 · Cost Price Fluctuator Alert", type: "boolean" },
      { key: "supplier_lead_time", label: "#101 · Supplier Lead Time Tracker", type: "boolean" },
      { key: "landing_costs", label: "#102 · Landing Cost Allocations", type: "boolean" },
      { key: "suppliers_directory", label: "#103 · Suppliers Directory", type: "boolean" },
      { key: "supplier_sku_mapping", label: "#104 · Supplier SKU Mapping", type: "boolean" },
      { key: "inbound_expiry_tracking", label: "#105 · Inbound Expiry Date Tracking", type: "boolean" },
      { key: "purchase_returns", label: "#106 · Purchase Returns Register", type: "boolean" },
      { key: "auto_po_generation", label: "#107 · Auto-Generating Purchase Orders", type: "boolean" },
      { key: "bulk_supplier_payments", label: "#108 · Bulk Supplier Payments", type: "boolean" },
      { key: "payables_grid", label: "#109 · Outstanding Payables Grid", type: "boolean" },
      { key: "reconciled_bank_payments", label: "#110 · Reconciled Bank Payments", type: "boolean" },
      { key: "tax_inclusive_procurement", label: "#111 · Tax-Inclusive Procurement Toggle", type: "boolean" },
      { key: "supplier_outstanding_alerts", label: "#112 · Supplier Outstanding Alerts", type: "boolean" },
      { key: "supplier_refund_tracker", label: "#113 · Supplier Refund Tracker", type: "boolean" },
      { key: "custom_payment_terms", label: "#114 · Custom Supplier Payment Terms", type: "boolean" },
      { key: "purchase_pdf_upload", label: "#115 · Purchase Invoice PDF Importer", type: "boolean" }
    ]
  },
  // ────────────────────────────────────────────────────────────────────────
  // Part 5 — Inventory, Barcode & Multi-Warehouse  (Features 116–135)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "inventory",
    emoji: "🏭",
    label: "Inventory & Multi-Warehouse",
    description: "Stock management, batches, variants, BOM, and warehouse isolation.",
    features: [
      { key: "locations", label: "#116 · Multi-Warehouse Isolation", type: "number", note: "Number of warehouses allowed (blank = unlimited)" },
      { key: "stock_transfer", label: "#117 · Stock Transfer Vouchers", type: "boolean" },
      { key: "product_variants", label: "#118 · Product Variant Support", type: "boolean" },
      { key: "fifo_costing", label: "#119 · Variant-Aware FIFO Costing", type: "boolean" },
      { key: "barcode_label_factory", label: "#120 · Barcode Label Print Factory (Inventory)", type: "boolean" },
      { key: "batch_tracking", label: "#121 · Batch Intake Numbers Tracker", type: "boolean" },
      { key: "batch_expiry", label: "#122 · Batch Expiry Warnings", type: "boolean" },
      { key: "stock_take_audit", label: "#123 · Stock Take Audit Wizard", type: "boolean" },
      { key: "disaster_claim", label: "#124 · Disaster Claim Asset Manager", type: "boolean" },
      { key: "bill_of_materials", label: "#125 · Bill of Materials (BOM) Recipes", type: "boolean" },
      { key: "auto_assembly_logic", label: '#126 · "Garam Masala" Auto-Assembly Logic', type: "boolean" },
      { key: "production_simulator", label: "#127 · Production Run Simulator", type: "boolean" },
      { key: "recipe_history_archival", label: "#128 · Recipe History Archival", type: "boolean" },
      { key: "product_history_timeline", label: "#129 · Product History Timeline", type: "boolean" },
      { key: "category_management", label: "#130 · Category Management Center", type: "boolean" },
      { key: "stock_levels_view", label: "#131 · Stock Levels View Dashboard", type: "boolean" },
      { key: "low_stock_alerts", label: "#132 · Low Stock Threshold Alert", type: "boolean" },
      { key: "imei_lifecycle", label: "#133 · IMEI Lifecycle Tracking", type: "boolean" },
      { key: "uom_converter", label: "#134 · Unit of Measure (UOM) Converter", type: "boolean" },
      { key: "sku_limit", label: "SKU / Product Limit", type: "number", note: "Max products (blank = unlimited)" }
    ]
  },
  // ────────────────────────────────────────────────────────────────────────
  // Part 6 — E-Commerce Sync, WooCommerce & VenSynQ  (Features 136–147)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "ecommerce",
    emoji: "🔄",
    label: "E-Commerce & VenSynQ",
    description: "WooCommerce webhook sync, marketplace connectors, and dropshipping.",
    features: [
      { key: "vensync_command", label: "#136 · VenSynQ Command Center", type: "boolean" },
      { key: "marketplace_oauth", label: "#137 · 3-Click OAuth Connection", type: "boolean" },
      { key: "commission_isolation", label: "#138 · Automated Commission Isolation", type: "boolean" },
      { key: "dropshipping", label: "#139 · Dropshipping Order Automator", type: "boolean" },
      { key: "jit_procurement", label: "#140 · Just-in-Time (JIT) Procurement Drafts", type: "boolean" },
      { key: "bulk_tracking_sync", label: "#141 · Bulk Tracking ID Sync", type: "boolean" },
      { key: "multichannel_expense_alloc", label: "#142 · Multi-Channel Expense Allocations", type: "boolean" },
      { key: "woocommerce", label: "#143 · WooCommerce Real-Time Webhook", type: "boolean" },
      { key: "woocommerce_customer_reg", label: "#144 · WooCommerce Customer Auto-Registry", type: "boolean" },
      { key: "woocommerce_stock_sync", label: "#145 · WooCommerce Stock Synchronization", type: "boolean" },
      { key: "woocommerce_orders_bridge", label: "#146 · Dynamic Orders Bridge (WooCommerce)", type: "boolean" },
      { key: "web_catalog_toggles", label: "#147 · Web Store Catalog Toggles", type: "boolean" }
    ]
  },
  // ────────────────────────────────────────────────────────────────────────
  // Part 7 — Double-Entry Accounting & Cash Registers  (Features 148–160)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "accounting",
    emoji: "🏦",
    label: "Double-Entry Accounting & Finance",
    description: "Ledger engine, bank reconciliation, depreciation, and fiscal controls.",
    features: [
      { key: "double_entry_ledger", label: "#148 · Double-Entry Journal Ledger Engine", type: "boolean" },
      { key: "cash_account_reconciliation", label: "#149 · Automated Cash Account Reconciliation", type: "boolean" },
      { key: "fixed_asset_depreciation", label: "#150 · Fixed Asset Depreciation Tracker", type: "boolean" },
      { key: "loan_ledger", label: "#151 · Business Loan Principal & Interest", type: "boolean" },
      { key: "inter_register_transfers", label: "#152 · Inter-Register Cash Transfer Logs", type: "boolean" },
      { key: "advance_allocation", label: "#153 · Supplier & Customer Advance Allocation", type: "boolean" },
      { key: "fiscal_year_closing", label: "#154 · Fiscal Year Closing Wizard", type: "boolean" },
      { key: "debit_credit_notes", label: "#155 · Debit & Credit Note Registers", type: "boolean" },
      { key: "bank_reconciliation", label: "#156 · Bank Reconciliation Truth Checker", type: "boolean" },
      { key: "tax_summary_engine", label: "#157 · Tax Summary Engine", type: "boolean" },
      { key: "expense_manager", label: "#158 · Expense Manager with Receipt Uploads", type: "boolean" },
      { key: "charity_engine", label: "#159 · Charity Percentage Engine", type: "boolean" },
      { key: "petty_cash", label: "#160 · Petty Cash Allocation Logs", type: "boolean" }
    ]
  },
  // ────────────────────────────────────────────────────────────────────────
  // Part 8 — The Report Factory  (Features 161–200)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "reports",
    emoji: "📊",
    label: "Report Factory (40 Reports)",
    description: "Complete 40-report suite — toggle individual reports per plan.",
    features: [
      { key: "reports", label: "Reports Access Level", type: "select", options: ["basic", "advanced", "enterprise"] },
      { key: "report_sales_summary", label: "#161 · Sales Summary Report", type: "boolean" },
      { key: "report_daily_sales_trend", label: "#162 · Daily Sales Trend", type: "boolean" },
      { key: "report_purchases", label: "#163 · Purchases Report", type: "boolean" },
      { key: "report_day_book", label: "#164 · Day Book Log", type: "boolean" },
      { key: "report_profit_loss", label: "#165 · Profit & Loss Statement", type: "boolean" },
      { key: "report_account_ledger", label: "#166 · Account Ledger Report", type: "boolean" },
      { key: "report_party_statement", label: "#167 · Party Statement (Khata Ledger)", type: "boolean" },
      { key: "report_transactions_history", label: "#168 · Transactions History", type: "boolean" },
      { key: "report_stock_valuation", label: "#169 · Stock Valuation Report", type: "boolean" },
      { key: "report_low_stock", label: "#170 · Low Stock Shortages Report", type: "boolean" },
      { key: "report_stock_movement", label: "#171 · Stock Movement History", type: "boolean" },
      { key: "report_expenses_directory", label: "#172 · Expenses Directory", type: "boolean" },
      { key: "report_tax_compliance", label: "#173 · Tax Compliance Summary", type: "boolean" },
      { key: "report_bank_statements", label: "#174 · Bank Statements Log", type: "boolean" },
      { key: "report_expiring_soon", label: "#175 · Expiring Soon Alert", type: "boolean" },
      { key: "report_balance_sheet", label: "#176 · Balance Sheet", type: "boolean" },
      { key: "report_all_parties_credit", label: "#177 · All Parties Credit Summary", type: "boolean" },
      { key: "report_trial_balance", label: "#178 · Double-Entry Trial Balance", type: "boolean" },
      { key: "report_item_profit", label: "#179 · Item-Wise Profit Analysis", type: "boolean" },
      { key: "report_party_profitability", label: "#180 · Party-Wise Profitability", type: "boolean" },
      { key: "report_general_discount", label: "#181 · General Discount Report", type: "boolean" },
      { key: "report_cash_flow", label: "#182 · Cash Flow Statement", type: "boolean" },
      { key: "report_sales_aging", label: "#183 · Sales Aging Report", type: "boolean" },
      { key: "report_sales_orders_status", label: "#184 · Sales Orders Status", type: "boolean" },
      { key: "report_bill_profitability", label: "#185 · Bill-Wise Profitability", type: "boolean" },
      { key: "report_expense_by_category", label: "#186 · Expense by Category", type: "boolean" },
      { key: "report_expense_by_item", label: "#187 · Expense by Item", type: "boolean" },
      { key: "report_stock_by_category", label: "#188 · Stock Summary by Category", type: "boolean" },
      { key: "report_sales_by_party", label: "#189 · Sales & Purchases by Party", type: "boolean" },
      { key: "report_sales_by_category", label: "#190 · Sales & Purchases by Category", type: "boolean" },
      { key: "report_category_pl", label: "#191 · Category Profit & Loss", type: "boolean" },
      { key: "report_item_discounting", label: "#192 · Item-Wise Discounting", type: "boolean" },
      { key: "report_sales_order_items", label: "#193 · Sales Order Items Detail", type: "boolean" },
      { key: "report_stock_aging", label: "#194 · Stock Aging Analysis", type: "boolean" },
      { key: "report_sales_party_group", label: "#195 · Sales & Purchases by Party Group", type: "boolean" },
      { key: "report_item_by_party", label: "#196 · Item Report by Party", type: "boolean" },
      { key: "report_party_by_item", label: "#197 · Party Report by Item", type: "boolean" },
      { key: "report_tax_rate_breakdown", label: "#198 · Tax Rate Breakdown", type: "boolean" },
      { key: "report_graph_analytics", label: "#199 · Graph Analytics Dashboard", type: "boolean" },
      { key: "report_loan_statement", label: "#200 · Loan Statement", type: "boolean" }
    ]
  },
  // ────────────────────────────────────────────────────────────────────────
  // Part 9 — AI Bubble & Platform HQ Command  (Features 201–226)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "platform_hq",
    emoji: "🌌",
    label: "Platform HQ & Infrastructure",
    description: "Multi-tenant isolation, SuperAdmin controls, AI assistant, and enforcement gates.",
    features: [
      { key: "ai_assistant", label: "#201 · Floating AI Assistant (AI Bubble)", type: "boolean" },
      { key: "multitenant_isolation", label: "#202 · Path-Based URL Multi-Tenant Isolation", type: "boolean", note: "Infrastructure — always enabled" },
      { key: "three_zone_security", label: "#203 · Three-Zone Security Boundaries", type: "boolean", note: "Infrastructure — always enabled" },
      { key: "superadmin_command_center", label: "#204 · SuperAdmin Command Center", type: "boolean" },
      { key: "subscription_enforcement", label: "#205 · Subscription Limit Enforcement", type: "boolean", note: "Infrastructure — always enabled" },
      { key: "redis_plan_gates", label: "#206 · Redis-Cached Plan Gates", type: "boolean" },
      { key: "limit_override_manager", label: "#207 · Automated Limit Override Manager", type: "boolean" },
      { key: "invitation_codes", label: "#208 · Alphanumeric Invitation Codes", type: "boolean" },
      { key: "demo_sandbox_cloner", label: "#209 · Ephemeral Demo Sandbox Cloner", type: "boolean" },
      { key: "sandbox_time_shift", label: "#210 · Sandbox Time-Shift Engine", type: "boolean" },
      { key: "sandbox_expiration", label: "#211 · Sandbox Expiration Logic", type: "boolean" },
      { key: "soft_delete_trash", label: "#212 · Soft-Delete Trash Management", type: "boolean" },
      { key: "immutable_db_locks", label: "#213 · Immutable Database Locks", type: "boolean", note: "Infrastructure — always enabled" },
      { key: "balanced_reversals", label: "#214 · Balanced Transaction Reversals", type: "boolean", note: "Infrastructure — always enabled" },
      { key: "double_entry_account_maps", label: "#215 · Double-Entry Account Maps", type: "boolean", note: "Infrastructure — always enabled" },
      { key: "custom_tax_rates", label: "#216 · Custom Tax Rate Configurator", type: "boolean" },
      { key: "customer_credit_limits_cfg", label: "#217 · Customer Credit Limits (Config)", type: "boolean" },
      { key: "low_stock_threshold_cfg", label: "#218 · Low Stock Alerts Threshold (Config)", type: "boolean" },
      { key: "cashier_inactivity_logout", label: "#219 · Cashier Inactivity Auto-Logout", type: "boolean" },
      { key: "passcode_security_controls", label: "#220 · Passcode Security Controls", type: "boolean" },
      { key: "stock_reservation_rules", label: "#221 · Stock Reservation Rules", type: "boolean" },
      { key: "barcode_pattern_recognition", label: "#222 · Barcode Pattern Recognition", type: "boolean" },
      { key: "auto_assembly_recipes", label: "#223 · Auto-Assembly Cookbook Recipes", type: "boolean" },
      { key: "multi_currency", label: "#224 · Multi-Currency Format Configurations", type: "boolean" },
      { key: "module_toggles", label: "#225 · Glass Door Module Toggles", type: "boolean" },
      { key: "hard_lock_negative_stock", label: "#226 · Hard-Lock Negative Stock Settings", type: "boolean" },
      // Core numeric limits
      { key: "transactions_per_month", label: "Transactions / Month", type: "number", note: "blank = unlimited" },
      { key: "staff_limit", label: "Staff Accounts", type: "number", note: "blank = unlimited" },
      { key: "multi_branch", label: "Multi-Branch Locations", type: "number", note: "0 = disabled; blank = unlimited" },
      { key: "api_access", label: "Public REST API Access", type: "boolean" }
    ]
  },
  // ────────────────────────────────────────────────────────────────────────
  // Part 10 — AI & Automation Extras  (from Pricing Files)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "ai_extras",
    emoji: "🤖",
    label: "AI & Automation Extras",
    description: "HyperSearch, SmartCapture, Growth Engine, and AI-powered automation features.",
    features: [
      { key: "hypersearch_byok", label: "HyperSearch BYOK (Bring Your Own API Key)", type: "boolean", note: "Free AI search using own OpenAI/Gemini key" },
      { key: "smart_capture", label: "SmartCapture (AI Invoice Scan)", type: "boolean", note: "Photo/image/audio → data entry" },
      { key: "smart_capture_limit", label: "SmartCapture Scans / Month", type: "number" },
      { key: "growth_engine", label: "Growth Engine (AI Retention Rules)", type: "boolean" },
      { key: "ai_churn_predictions", label: "AI Churn Predictions", type: "boolean" },
      { key: "ai_revenue_forecasting", label: "AI Revenue Forecasting", type: "boolean" },
      { key: "ai_outreach_copy", label: "AI WhatsApp Outreach Copy Generation", type: "boolean" },
      { key: "ai_queries_limit", label: "AI Assistant Queries / Month", type: "number" },
      { key: "ai_outreach_limit", label: "AI Outreach Copies / Month", type: "number" },
      { key: "owners_daily_pulse", label: "Owner's Daily Pulse Report", type: "boolean", note: "Digest-style daily business summary" }
    ]
  },
  // ────────────────────────────────────────────────────────────────────────
  // Part 11 — Live Chat & Customer Engagement  (from Pricing Files)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "live_chat",
    emoji: "💬",
    label: "Live Chat & Customer Engagement",
    description: "Embedded live chat widget, AI bot, agent handoff, and co-pilot suggestions.",
    features: [
      { key: "live_chat_widget", label: "Live Chat Widget (Storefront)", type: "boolean" },
      { key: "ai_bot_handoff", label: "AI Bot → Human Agent Handoff", type: "boolean" },
      { key: "canned_responses", label: "Canned Responses Library", type: "boolean" },
      { key: "ai_copilot_suggestions", label: "AI Co-Pilot Suggestions (for Agents)", type: "boolean" },
      { key: "passive_learning_engine", label: "Passive Learning Engine", type: "boolean" },
      { key: "agent_referral", label: "Agent-to-Agent Chat Referral", type: "boolean" }
    ]
  },
  // ────────────────────────────────────────────────────────────────────────
  // Part 12 — Support & Onboarding Perks  (from Pricing Files)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "support_perks",
    emoji: "🎯",
    label: "Support & Onboarding Perks",
    description: "Premium support tiers, dedicated account manager, and white-glove onboarding.",
    features: [
      { key: "dedicated_account_manager", label: "Dedicated Account Manager", type: "boolean" },
      { key: "white_glove_onboarding", label: "White-Glove Onboarding", type: "boolean" },
      { key: "white_label", label: "White Label / Custom Branding", type: "boolean" },
      { key: "industry_templates_count", label: "Industry Pre-Made Templates", type: "number", note: "Number of templates included (e.g. 16)" },
      { key: "priority_support", label: "Priority Support Access", type: "boolean" },
      { key: "email_support", label: "Email Support", type: "boolean" },
      { key: "chat_support", label: "Chat Support", type: "boolean" },
      { key: "phone_support", label: "Phone / Call Support", type: "boolean" }
    ]
  }
];
FEATURE_GROUPS.reduce((acc, g) => acc + g.features.length, 0);
const FEATURE_DEFAULTS = {
  "demo_store": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "free_trial_days": {
    "trial": "14",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "instant_store_creator": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "industry_seeding": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "dark_theme": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "light_theme": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "multi_store_hub": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "multi_store_roles": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "cashier_pin_login": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "device_adaptive": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "pwa_install": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "guided_setup_tour": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "coupon_stacking": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "platform_status_badge": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "system_cache_refresher": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "owner_profile_card": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "one_click_system_wipe": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "smtp_mail": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "sms_gateway": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "security_activity_log": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "barcode_scanner": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "imei_scanner": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "keyboard_hotkeys": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "senior_mode": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "high_contrast_colors": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "profit_peek": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "cart_tabs_limit": {
    "trial": "3",
    "starter": "3",
    "growth": "10",
    "business": "50"
  },
  "park_recall": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "inflight_product_creation": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "cart_session_protection": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "contextual_qty_modifiers": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "auto_customer_discounts": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "fuzzy_product_finder": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "auto_cash_rounding": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "split_payments": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "daily_cash_audit": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "silent_webusb_printing": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "receipt_cutline_padding": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "custom_thermal_widths": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "dynamic_accent_colors": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "invoice_column_toggles": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "amount_to_words": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "receipt_qr_code": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "branded_receipt_sync": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "auto_assembly_checkout": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "pos_negative_stock_alert": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "negative_stock_lock": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "service_fee_additions": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "auto_vat_gst": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "custom_charge_toggle": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "fuzzy_customer_lookup": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "recent_invoices_panel": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "cashier_change_helper": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "barcode_label_print": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "label_qr_codes": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "customer_khata": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "customer_payments_log": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "customer_statements": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "aged_receivables": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "whatsapp_reminders": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "sms_debt_alerts": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "credit_limit_rules": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "multi_payment_invoices": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "customer_payment_alloc": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "anniversary_tracker": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "customer_ltv_score": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "customer_wallet": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "loyalty_points": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "digital_gift_cards": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "wholesale_pricing": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "b2b_proposal_builder": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "quotation_conversion": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "inflight_session_recovery": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "tax_inclusive_exclusive": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "b2b_margin_displayer": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "sales_return_vouchers": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "b2b_invoice_designer": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "pre_sales_reservation": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "recurring_invoicing": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "refund_reason_analysis": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "tax_exempt_customers": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "customer_address_book": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "a4_invoice_pdf": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "letter_size_invoice": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "outstanding_balance_grid": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "payment_due_dates": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "overdue_highlights": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "lump_sum_payments": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "partial_payment_indicator": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "unified_party_ledger": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "supplier_khata": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "delayed_supplier_payments": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "supplier_statements": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "aged_payables": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "installment_payments": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "purchase_orders": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "partial_shipments": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "supplier_debit_notes": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "auto_cost_adjuster": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "cost_price_fluctuator": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "supplier_lead_time": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "landing_costs": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "suppliers_directory": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "supplier_sku_mapping": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "inbound_expiry_tracking": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "purchase_returns": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "auto_po_generation": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "bulk_supplier_payments": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "purchase_pdf_upload": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "reconciled_bank_payments": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "tax_inclusive_procurement": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "supplier_outstanding_alerts": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "supplier_refund_tracker": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "custom_payment_terms": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "locations": {
    "trial": "1",
    "starter": "1",
    "growth": "3",
    "business": "10"
  },
  "stock_transfer": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "product_variants": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "fifo_costing": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "barcode_label_factory": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "batch_tracking": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "batch_expiry": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "stock_take_audit": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "disaster_claim": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "bill_of_materials": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "auto_assembly_logic": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "production_simulator": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "recipe_history_archival": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "product_history_timeline": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "category_management": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "stock_levels_view": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "low_stock_alerts": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "imei_lifecycle": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "uom_converter": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "sku_limit": {
    "trial": "50",
    "starter": "1000",
    "growth": "10000",
    "business": "50000"
  },
  "vensync_command": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "marketplace_oauth": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "commission_isolation": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "dropshipping": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "jit_procurement": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "bulk_tracking_sync": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "multichannel_expense_alloc": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "woocommerce": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "woocommerce_customer_reg": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "woocommerce_stock_sync": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "woocommerce_orders_bridge": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "web_catalog_toggles": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "double_entry_ledger": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "cash_account_reconciliation": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "fixed_asset_depreciation": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "loan_ledger": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "inter_register_transfers": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "advance_allocation": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "fiscal_year_closing": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "debit_credit_notes": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "bank_reconciliation": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "tax_summary_engine": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "expense_manager": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "charity_engine": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "petty_cash": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "reports": {
    "trial": "basic",
    "starter": "basic",
    "growth": "advanced",
    "business": "advanced"
  },
  "report_sales_summary": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "report_low_stock": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "report_expenses_directory": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "report_party_statement": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "report_cash_flow": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "report_stock_valuation": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "report_purchases": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "report_daily_sales_trend": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_day_book": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_tax_compliance": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_general_discount": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_bank_statements": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_account_ledger": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_stock_aging": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_expiring_soon": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_profit_loss": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_trial_balance": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "report_transactions_history": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "report_item_profit": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "report_bill_profitability": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "report_graph_analytics": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "report_loan_statement": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "report_sales_aging": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "report_sales_orders_status": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "report_party_profitability": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "report_expense_by_category": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_expense_by_item": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_stock_by_category": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_sales_by_party": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_sales_by_category": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_category_pl": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_item_discounting": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_sales_order_items": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_sales_party_group": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_item_by_party": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_party_by_item": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "report_tax_rate_breakdown": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "ai_assistant": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "superadmin_command_center": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "redis_plan_gates": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "limit_override_manager": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "invitation_codes": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "demo_sandbox_cloner": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "sandbox_time_shift": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "sandbox_expiration": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "soft_delete_trash": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "custom_tax_rates": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "customer_credit_limits_cfg": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "low_stock_threshold_cfg": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "cashier_inactivity_logout": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "passcode_security_controls": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "stock_reservation_rules": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "barcode_pattern_recognition": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "auto_assembly_recipes": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "multi_currency": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "module_toggles": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "hard_lock_negative_stock": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "transactions_per_month": {
    "trial": null,
    "starter": null,
    "growth": null,
    "business": null
  },
  "staff_limit": {
    "trial": "2",
    "starter": "3",
    "growth": "10",
    "business": "50"
  },
  "multi_branch": {
    "trial": "0",
    "starter": "0",
    "growth": "3",
    "business": "10"
  },
  "api_access": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "hypersearch_byok": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "smart_capture": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "smart_capture_limit": {
    "trial": null,
    "starter": null,
    "growth": null,
    "business": null
  },
  "growth_engine": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "ai_churn_predictions": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "ai_revenue_forecasting": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "ai_outreach_copy": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "ai_queries_limit": {
    "trial": null,
    "starter": null,
    "growth": null,
    "business": null
  },
  "ai_outreach_limit": {
    "trial": null,
    "starter": null,
    "growth": null,
    "business": null
  },
  "owners_daily_pulse": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "live_chat_widget": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "ai_bot_handoff": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "canned_responses": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "ai_copilot_suggestions": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "passive_learning_engine": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "agent_referral": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "0"
  },
  "dedicated_account_manager": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "white_glove_onboarding": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "white_label": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "industry_templates_count": {
    "trial": "16",
    "starter": "16",
    "growth": "16",
    "business": "16"
  },
  "priority_support": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  },
  "email_support": {
    "trial": "1",
    "starter": "1",
    "growth": "1",
    "business": "1"
  },
  "chat_support": {
    "trial": "0",
    "starter": "0",
    "growth": "1",
    "business": "1"
  },
  "phone_support": {
    "trial": "0",
    "starter": "0",
    "growth": "0",
    "business": "1"
  }
};
const getFeatureDefault = (featureKey, planSlug) => {
  let baseSlug = planSlug;
  if (planSlug === "ltd_1") baseSlug = "starter";
  else if (planSlug === "ltd_2") baseSlug = "growth";
  else if (planSlug === "ltd_3") baseSlug = "business";
  if (planSlug === "ltd_1" && featureKey === "transactions_per_month") return "500";
  if (planSlug === "ltd_2" && featureKey === "transactions_per_month") return "2000";
  if (planSlug === "ltd_3" && featureKey === "transactions_per_month") return "6000";
  return FEATURE_DEFAULTS[featureKey]?.[baseSlug] ?? null;
};
const LIMIT_KEYS = [
  { key: "transactions_per_month", label: "Transactions / Month", reset: "monthly" },
  { key: "sku_limit", label: "SKU / Product Limit", reset: "never" },
  { key: "locations", label: "Warehouse Locations", reset: "never" },
  { key: "staff_limit", label: "Staff Seats", reset: "never" },
  { key: "woocommerce", label: "WooCommerce Integration", reset: "never" },
  { key: "api_access", label: "API Access Key", reset: "never" },
  { key: "growth_engine", label: "Growth Engine AI", reset: "never" },
  { key: "multi_branch", label: "Multi-Branch Support", reset: "never" },
  { key: "reports", label: "Reports Complexity", reset: "never" }
];
const planTypeColor = (type) => ({
  trial: vq.indigo[500],
  subscription: vq.sky[400],
  ltd: vq.amber[500],
  enterprise: vq.emerald[500]
})[type] || vq.slate[400];
function FeatureCell({ planId, planSlug, feature, value, onSave, saving }) {
  const isExplicit = value !== null && value !== void 0 && value !== "";
  const defaultValue = getFeatureDefault(feature.key, planSlug);
  const hasDefault = defaultValue !== null && defaultValue !== void 0 && defaultValue !== "";
  const [localNum, setLocalNum] = useState(value ?? "");
  const [editing, setEditing] = useState(false);
  React.useEffect(() => {
    setLocalNum(value ?? "");
  }, [value]);
  if (feature.type === "number") {
    const displayPlaceholder = hasDefault ? String(defaultValue) : "∞";
    return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }, children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          value: localNum,
          placeholder: displayPlaceholder,
          onChange: (e) => {
            setLocalNum(e.target.value);
            setEditing(true);
          },
          onBlur: () => {
            if (editing) {
              onSave(planId, feature.key, localNum === "" ? null : localNum);
              setEditing(false);
            }
          },
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              onSave(planId, feature.key, localNum === "" ? null : localNum);
              setEditing(false);
              e.target.blur();
            }
          },
          title: isExplicit ? `Custom Override: ${value}` : `System Default: ${displayPlaceholder}`,
          style: {
            width: 70,
            background: editing ? "rgba(99,102,241,0.08)" : isExplicit ? "rgba(99,102,241,0.15)" : "rgba(0,0,0,0.2)",
            border: `1px solid ${editing ? "rgba(99,102,241,0.4)" : isExplicit ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)"}`,
            color: isExplicit ? vq.indigo[200] : vq.slate[600],
            padding: "5px 8px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: isExplicit ? 800 : 500,
            fontFamily: "monospace",
            textAlign: "center",
            outline: "none",
            transition: "all 0.15s"
          }
        }
      ),
      saving && /* @__PURE__ */ jsx(RefreshCw, { size: 10, style: { color: vq.indigo[500], animation: "spin 1s linear infinite" } })
    ] });
  }
  if (feature.type === "select") {
    const opts = feature.options || [];
    return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }, children: [
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: value ?? "",
          onChange: (e) => onSave(planId, feature.key, e.target.value || null),
          title: isExplicit ? `Custom Override: ${value}` : `System Default: ${defaultValue ?? "default"}`,
          style: {
            background: isExplicit ? "rgba(99,102,241,0.15)" : "rgba(0,0,0,0.25)",
            border: `1px solid ${isExplicit ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)"}`,
            color: isExplicit ? vq.indigo[200] : vq.slate[600],
            padding: "5px 8px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            outline: "none"
          },
          children: [
            /* @__PURE__ */ jsx("option", { value: "", style: { color: vq.slate[600] }, children: defaultValue ? `default (${defaultValue})` : "default" }),
            opts.map((o) => /* @__PURE__ */ jsx("option", { value: o, children: o }, o))
          ]
        }
      ),
      saving && /* @__PURE__ */ jsx(RefreshCw, { size: 10, style: { color: vq.indigo[500], animation: "spin 1s linear infinite" } })
    ] });
  }
  const isEnabled = isExplicit ? value === "1" || value === "true" || value === true : defaultValue === "1" || defaultValue === "true" || defaultValue === true || defaultValue === 1;
  const isDisabled = isExplicit ? value === "0" || value === "false" || value === false : defaultValue === "0" || defaultValue === "false" || defaultValue === false || defaultValue === 0;
  const next = isEnabled ? "0" : "1";
  let bg, color, border, label;
  if (isEnabled) {
    if (isExplicit) {
      bg = "rgba(16,185,129,0.16)";
      color = vq.emerald[400];
      border = "1px solid rgba(16,185,129,0.45)";
      label = "✓";
    } else {
      bg = "rgba(16,185,129,0.05)";
      color = "rgba(52,211,153,0.5)";
      border = "1px dashed rgba(16,185,129,0.25)";
      label = "✓";
    }
  } else if (isDisabled) {
    if (isExplicit) {
      bg = "rgba(239,68,68,0.12)";
      color = vq.red[400];
      border = "1px solid rgba(239,68,68,0.35)";
      label = "✕";
    } else {
      bg = "rgba(239,68,68,0.03)";
      color = "rgba(248,113,113,0.4)";
      border = "1px dashed rgba(239,68,68,0.15)";
      label = "✕";
    }
  } else {
    bg = "rgba(255,255,255,0.03)";
    color = vq.slate[600];
    border = "1px solid rgba(255,255,255,0.05)";
    label = "—";
  }
  const titleText = isExplicit ? `${isEnabled ? "Enabled (Override)" : "Disabled (Override)"} · Click to toggle` : `${isEnabled ? "Enabled (Default)" : "Disabled (Default)"} · Click to override`;
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }, children: /* @__PURE__ */ jsx(
    "button",
    {
      onClick: () => onSave(planId, feature.key, next),
      disabled: saving,
      title: titleText,
      style: {
        background: bg,
        color,
        border,
        width: 36,
        height: 28,
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 900,
        cursor: saving ? "wait" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.12s",
        opacity: saving ? 0.6 : 1
      },
      onMouseEnter: (e) => {
        if (!saving) e.currentTarget.style.transform = "scale(1.1)";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.transform = "scale(1)";
      },
      children: saving ? /* @__PURE__ */ jsx(RefreshCw, { size: 10, style: { animation: "spin 1s linear infinite" } }) : label
    }
  ) });
}
function FeatureMatrix({ plans }) {
  const { vensynq_enabled } = usePage().props;
  const vensynqKeys = [
    "vensync_command",
    "marketplace_oauth",
    "commission_isolation",
    "dropshipping",
    "jit_procurement",
    "bulk_tracking_sync",
    "multichannel_expense_alloc"
  ];
  const filteredGroups = FEATURE_GROUPS.map((group) => {
    if (group.id === "ecommerce" && !vensynq_enabled) {
      return {
        ...group,
        features: group.features.filter((f) => !vensynqKeys.includes(f.key))
      };
    }
    return group;
  });
  const totalFilteredFeatures = filteredGroups.reduce((acc, g) => acc + g.features.length, 0);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [stagedChanges, setStagedChanges] = useState({});
  const [saving, setSaving] = useState(false);
  const [localMatrix, setLocalMatrix] = useState(() => {
    const m = {};
    plans.forEach((plan) => {
      m[plan.id] = {};
      (plan.limits || []).forEach((l) => {
        m[plan.id][l.key] = l.value;
      });
    });
    return m;
  });
  const toggleGroup = (groupId) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };
  const handleCellChange = useCallback((planId, featureKey, newValue) => {
    setLocalMatrix((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], [featureKey]: newValue }
    }));
    setStagedChanges((prev) => {
      const planChanges = { ...prev[planId], [featureKey]: newValue };
      const originalPlan = plans.find((p) => p.id === planId);
      const originalLimit = originalPlan?.limits?.find((l) => l.key === featureKey);
      const originalValue = originalLimit?.value ?? null;
      const normNew = newValue !== null ? String(newValue) : null;
      const normOrig = originalValue !== null ? String(originalValue) : null;
      if (normNew === normOrig) {
        delete planChanges[featureKey];
      }
      const next = { ...prev, [planId]: planChanges };
      if (Object.keys(next[planId]).length === 0) {
        delete next[planId];
      }
      return next;
    });
  }, [plans]);
  const stagedCount = Object.values(stagedChanges).reduce((acc, changes) => acc + Object.keys(changes).length, 0);
  const handleSaveStaged = () => {
    if (stagedCount === 0) return;
    setSaving(true);
    router.put(
      route("platform.plans.bulk-update"),
      { changes: stagedChanges },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          setStagedChanges({});
        },
        onFinish: () => setSaving(false)
      }
    );
  };
  const handleDiscardChanges = () => {
    if (confirm(`Discard all ${stagedCount} unsaved feature matrix changes?`)) {
      const restored = {};
      plans.forEach((plan) => {
        restored[plan.id] = {};
        (plan.limits || []).forEach((l) => {
          restored[plan.id][l.key] = l.value;
        });
      });
      setLocalMatrix(restored);
      setStagedChanges({});
    }
  };
  const planColors = [vq.indigo[400], vq.sky[400], vq.emerald[500], vq.amber[500], vq.pink[500], vq.violet[400]];
  const handleBulkSet = useCallback((planId, value) => {
    const boolKeys = filteredGroups.flatMap(
      (g) => g.features.filter((f) => f.type === "boolean").map((f) => f.key)
    );
    setLocalMatrix((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        ...Object.fromEntries(boolKeys.map((k) => [k, value]))
      }
    }));
    setStagedChanges((prev) => {
      const planChanges = { ...prev[planId] };
      const originalPlan = plans.find((p) => p.id === planId);
      boolKeys.forEach((key) => {
        const originalLimit = originalPlan?.limits?.find((l) => l.key === key);
        const originalValue = originalLimit?.value ?? null;
        const normNew = value !== null ? String(value) : null;
        const normOrig = originalValue !== null ? String(originalValue) : null;
        if (normNew === normOrig) {
          delete planChanges[key];
        } else {
          planChanges[key] = value;
        }
      });
      const next = { ...prev, [planId]: planChanges };
      if (Object.keys(next[planId]).length === 0) {
        delete next[planId];
      }
      return next;
    });
  }, [plans]);
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 0, position: "relative" }, children: [
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 24px",
      background: "rgba(99,102,241,0.05)",
      border: "1px solid rgba(99,102,241,0.12)",
      borderRadius: "16px 16px 0 0",
      borderBottom: "none"
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
        /* @__PURE__ */ jsx(Grid3x3, { size: 16, color: vq.indigo[400] }),
        /* @__PURE__ */ jsx("span", { style: { color: vq.indigo[200], fontSize: 13, fontWeight: 800 }, children: "Feature Matrix" }),
        /* @__PURE__ */ jsxs("span", { style: { background: "rgba(99,102,241,0.15)", color: vq.indigo[400], fontSize: 10, fontWeight: 900, padding: "3px 10px", borderRadius: 6, border: "1px solid rgba(99,102,241,0.2)" }, children: [
          totalFilteredFeatures,
          " FEATURES · ",
          plans.length,
          " PLANS"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: vq.slate[600], display: "flex", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ jsx("span", { style: { display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)" } }),
          "✓ Enabled"
        ] }),
        /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: vq.slate[600], display: "flex", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ jsx("span", { style: { display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" } }),
          "✕ Disabled"
        ] }),
        /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: vq.slate[600], display: "flex", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ jsx("span", { style: { display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } }),
          "— Default"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 24px",
      background: "rgba(15,23,42,0.9)",
      border: "1px solid rgba(99,102,241,0.1)",
      borderTop: "none",
      borderBottom: "none",
      overflowX: "auto"
    }, children: [
      /* @__PURE__ */ jsx("span", { style: { color: vq.slate[600], fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }, children: "Bulk Actions:" }),
      plans.map((plan, pi) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }, children: [
        /* @__PURE__ */ jsx("span", { style: { color: planColors[pi % planColors.length], fontSize: 10, fontWeight: 800, maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: plan.name }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleBulkSet(plan.id, "1"),
            title: `Enable all boolean features for ${plan.name}`,
            style: {
              background: "rgba(16,185,129,0.1)",
              color: vq.emerald[500],
              border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 10,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s"
            },
            onMouseEnter: (e) => e.currentTarget.style.background = "rgba(16,185,129,0.2)",
            onMouseLeave: (e) => e.currentTarget.style.background = "rgba(16,185,129,0.1)",
            children: "✓ All ON"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleBulkSet(plan.id, "0"),
            title: `Disable all boolean features for ${plan.name}`,
            style: {
              background: "rgba(239,68,68,0.08)",
              color: vq.red[400],
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 10,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s"
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.16)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            },
            children: "✕ All OFF"
          }
        )
      ] }, plan.id))
    ] }),
    /* @__PURE__ */ jsx("div", { style: { overflowX: "auto", background: "rgba(10,14,26,0.8)", borderRadius: "0 0 16px 16px", border: "1px solid rgba(255,255,255,0.05)", borderTop: "1px solid rgba(99,102,241,0.12)" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", minWidth: plans.length * 120 + 260 }, children: [
      /* @__PURE__ */ jsxs("colgroup", { children: [
        /* @__PURE__ */ jsx("col", { style: { width: 260, minWidth: 200 } }),
        plans.map((p) => /* @__PURE__ */ jsx("col", { style: { width: 120, minWidth: 100 } }, p.id))
      ] }),
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { style: { background: "rgba(255,255,255,0.02)", borderBottom: "2px solid rgba(99,102,241,0.15)", position: "sticky", top: 0, zIndex: 20 }, children: [
        /* @__PURE__ */ jsx("th", { style: { padding: "14px 20px", textAlign: "left", color: vq.slate[500], fontWeight: 900, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }, children: "Feature / Capability" }),
        plans.map((plan, idx) => /* @__PURE__ */ jsx("th", { style: { padding: "14px 16px", textAlign: "center", verticalAlign: "bottom" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }, children: [
          /* @__PURE__ */ jsx("div", { style: {
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: planColors[idx % planColors.length],
            boxShadow: `0 0 8px ${planColors[idx % planColors.length]}`
          } }),
          /* @__PURE__ */ jsx("span", { style: { color: planColors[idx % planColors.length], fontWeight: 900, fontSize: 13, letterSpacing: "-0.01em" }, children: plan.name }),
          /* @__PURE__ */ jsx("span", { style: { color: vq.slate[600], fontSize: 9, fontFamily: "monospace", fontWeight: 700 }, children: plan.slug })
        ] }) }, plan.id))
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: filteredGroups.map((group, gi) => {
        const isCollapsed = collapsedGroups[group.id];
        return /* @__PURE__ */ jsxs(React.Fragment, { children: [
          /* @__PURE__ */ jsx(
            "tr",
            {
              style: { background: "rgba(99,102,241,0.06)", borderTop: gi > 0 ? "2px solid rgba(99,102,241,0.08)" : "none", cursor: "pointer" },
              onClick: () => toggleGroup(group.id),
              children: /* @__PURE__ */ jsx("td", { colSpan: plans.length + 1, style: { padding: "10px 20px" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
                /* @__PURE__ */ jsx("span", { style: { fontSize: 14 }, children: group.emoji }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { style: { color: vq.indigo[300], fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }, children: group.label }),
                  group.description && !isCollapsed && /* @__PURE__ */ jsx("div", { style: { color: vq.slate[600], fontSize: 10, marginTop: 2 }, children: group.description })
                ] }),
                /* @__PURE__ */ jsxs("span", { style: { color: vq.slate[600], fontSize: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", padding: "1px 7px", borderRadius: 5, flexShrink: 0 }, children: [
                  group.features.length,
                  " features"
                ] }),
                /* @__PURE__ */ jsx("span", { style: { marginLeft: "auto", color: vq.slate[600] }, children: isCollapsed ? /* @__PURE__ */ jsx(ChevronRight, { size: 13 }) : /* @__PURE__ */ jsx(ChevronDown, { size: 13 }) })
              ] }) })
            }
          ),
          !isCollapsed && group.features.map((feature, fi) => /* @__PURE__ */ jsxs(
            "tr",
            {
              style: { borderBottom: "1px solid rgba(255,255,255,0.025)", transition: "background 0.1s" },
              onMouseEnter: (e) => e.currentTarget.style.background = "rgba(255,255,255,0.015)",
              onMouseLeave: (e) => e.currentTarget.style.background = "",
              children: [
                /* @__PURE__ */ jsx("td", { style: { padding: "9px 20px 9px 32px" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 2 }, children: [
                  /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                    /* @__PURE__ */ jsx("span", { style: { color: vq.slate[400], fontSize: 12, fontWeight: 600 }, children: feature.label }),
                    feature.type === "number" && /* @__PURE__ */ jsx("span", { style: { fontSize: 9, color: vq.sky[400], background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }, children: "NUM" }),
                    feature.type === "select" && /* @__PURE__ */ jsx("span", { style: { fontSize: 9, color: vq.amber[500], background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }, children: "TIER" })
                  ] }),
                  feature.note && /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: vq.slate[600], fontStyle: "italic" }, children: feature.note })
                ] }) }),
                plans.map((plan) => /* @__PURE__ */ jsx("td", { style: { padding: "7px 12px", textAlign: "center" }, children: /* @__PURE__ */ jsx(
                  FeatureCell,
                  {
                    planId: plan.id,
                    planSlug: plan.slug,
                    feature,
                    value: localMatrix[plan.id]?.[feature.key],
                    onSave: handleCellChange,
                    saving
                  }
                ) }, plan.id))
              ]
            },
            feature.key
          ))
        ] }, group.id);
      }) })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { style: { marginTop: 12, display: "flex", alignItems: "center", gap: 8, color: vq.slate[600], fontSize: 11 }, children: [
      /* @__PURE__ */ jsx(Shield, { size: 11 }),
      'Changes are staged locally. Click "Save Changes" at the bottom to publish all updates instantly to active tenants.'
    ] }),
    stagedCount > 0 && /* @__PURE__ */ jsxs("div", { style: {
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(15, 23, 42, 0.95)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(99, 102, 241, 0.35)",
      borderRadius: 16,
      padding: "14px 28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 32,
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.2)",
      zIndex: 50,
      animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
    }, children: [
      /* @__PURE__ */ jsx("style", { children: `
                        @keyframes fadeInUp {
                            from { opacity: 0; transform: translate(-50%, 20px); }
                            to   { opacity: 1; transform: translate(-50%, 0); }
                        }
                    ` }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
        /* @__PURE__ */ jsx("span", { style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "rgba(99, 102, 241, 0.2)",
          color: vq.indigo[300],
          fontSize: 12,
          fontWeight: 900,
          border: "1px solid rgba(99, 102, 241, 0.4)"
        }, children: stagedCount }),
        /* @__PURE__ */ jsx("span", { style: { color: vq.indigo[200], fontSize: 13, fontWeight: 700 }, children: "Unsaved Feature Matrix changes pending" })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10 }, children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleDiscardChanges,
            disabled: saving,
            style: {
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: vq.slate[400],
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s"
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
              e.currentTarget.style.color = vq.red[400];
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = vq.slate[400];
            },
            children: "Discard"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleSaveStaged,
            disabled: saving,
            style: {
              background: "linear-gradient(to right, #6366f1, #8b5cf6)",
              border: "none",
              color: "#ffffff",
              padding: "8px 20px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              transition: "all 0.15s"
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.transform = "scale(1.03)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.transform = "scale(1)";
            },
            children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(RefreshCw, { size: 13, style: { animation: "spin 1s linear infinite", marginRight: 4 } }),
              "Saving..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Save, { size: 13, style: { marginRight: 4 } }),
              "Save Changes"
            ] })
          }
        )
      ] })
    ] })
  ] });
}
function PlanDrawer({ open, onClose, plan, platforms }) {
  const isEdit = !!plan;
  const { data, setData, post, put, processing, errors, reset } = useForm({
    platform_id: plan?.platform_id ?? (platforms[0]?.id ?? ""),
    name: plan?.name ?? "",
    display_name: plan?.display_name ?? "",
    slug: plan?.slug ?? "",
    type: plan?.type ?? "subscription",
    price_monthly: plan?.price_monthly ?? "",
    price_annual: plan?.price_annual ?? "",
    price_lifetime: plan?.price_lifetime ?? "",
    price_monthly_pkr: plan?.price_monthly_pkr ?? "",
    price_annual_pkr: plan?.price_annual_pkr ?? "",
    price_lifetime_pkr: plan?.price_lifetime_pkr ?? "",
    checkout_url_usd: plan?.checkout_url_usd ?? "",
    checkout_url_pkr: plan?.checkout_url_pkr ?? "",
    is_featured: plan?.is_featured ?? false,
    is_active: plan?.is_active ?? true,
    is_visible: plan?.is_visible ?? true,
    sort_order: plan?.sort_order ?? 0,
    internal_notes: plan?.internal_notes ?? "",
    limits: LIMIT_KEYS.map(({ key, reset: reset2 }) => {
      const existing = plan?.limits?.find((l) => l.key === key);
      return { key, value: existing?.value ?? "", reset_period: existing?.reset_period ?? reset2 };
    })
  });
  const submit = (e) => {
    e.preventDefault();
    if (isEdit) {
      put(route("platform.plans.update", { plan: plan.id }), { onSuccess: () => {
        reset();
        onClose();
      } });
    } else {
      post(route("platform.plans.store"), { onSuccess: () => {
        reset();
        onClose();
      } });
    }
  };
  if (!open) return null;
  return /* @__PURE__ */ jsxs("div", { style: { position: "fixed", inset: 0, zIndex: 100, display: "flex", animation: "fadeIn 0.25s ease-out" }, children: [
    /* @__PURE__ */ jsx("div", { style: { flex: 1, background: "rgba(2, 6, 23, 0.7)", backdropFilter: "blur(8px)", transition: "all 0.3s" }, onClick: onClose }),
    /* @__PURE__ */ jsxs("div", { style: {
      width: 600,
      background: vq.void[800],
      overflowY: "auto",
      boxShadow: "-10px 0 40px rgba(0,0,0,0.6)",
      display: "flex",
      flexDirection: "column",
      borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
      position: "relative"
    }, children: [
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom, #6366f1, #8b5cf6)" } }),
      /* @__PURE__ */ jsxs("div", { style: { padding: "28px 32px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h2", { style: { margin: 0, fontSize: 20, fontWeight: 900, color: vq.slate[50], display: "flex", alignItems: "center", gap: 10, letterSpacing: "-0.02em" }, children: [
            /* @__PURE__ */ jsx(Layers, { size: 20, color: vq.indigo[400] }),
            " ",
            isEdit ? `Edit Plan: ${plan.name}` : "Create New Plan"
          ] }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: vq.slate[500], fontFamily: "monospace", marginTop: 4, display: "block" }, children: "Standard-aligned subscription pipeline parameters" })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: onClose, style: { background: "rgba(255,255,255,0.04)", border: "none", color: vq.slate[400], width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }, onMouseEnter: (e) => e.currentTarget.style.background = "rgba(239,68,68,0.15)", onMouseLeave: (e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)", children: "✕" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, style: { flex: 1, padding: "32px", display: "flex", flexDirection: "column", gap: 24 }, children: [
        /* @__PURE__ */ jsxs("section", { style: cardSection, children: [
          /* @__PURE__ */ jsxs("h3", { style: sectionTitle, children: [
            /* @__PURE__ */ jsx(Info, { size: 12 }),
            " Basic Config"
          ] }),
          /* @__PURE__ */ jsxs("div", { style: grid2, children: [
            /* @__PURE__ */ jsx(Field, { label: "Platform System", error: errors.platform_id, children: /* @__PURE__ */ jsx("select", { style: input, value: data.platform_id, onChange: (e) => setData("platform_id", e.target.value), disabled: isEdit, children: platforms.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id)) }) }),
            /* @__PURE__ */ jsx(Field, { label: "Tier Type", error: errors.type, children: /* @__PURE__ */ jsx("select", { style: input, value: data.type, onChange: (e) => setData("type", e.target.value), children: ["trial", "subscription", "ltd", "enterprise"].map((t) => /* @__PURE__ */ jsx("option", { value: t, children: t.toUpperCase() }, t)) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: grid3, children: [
            /* @__PURE__ */ jsx(Field, { label: "Plan Title", error: errors.name, children: /* @__PURE__ */ jsx("input", { style: input, value: data.name, onChange: (e) => setData("name", e.target.value), placeholder: "e.g. Starter" }) }),
            /* @__PURE__ */ jsx(Field, { label: "Display Name", error: errors.display_name, children: /* @__PURE__ */ jsx("input", { style: input, value: data.display_name, onChange: (e) => setData("display_name", e.target.value), placeholder: "e.g. Starter Engine" }) }),
            /* @__PURE__ */ jsx(Field, { label: "Identifier Slug", error: errors.slug, children: /* @__PURE__ */ jsx("input", { style: input, value: data.slug, onChange: (e) => setData("slug", e.target.value), placeholder: "e.g. starter", disabled: isEdit }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: grid3, children: [
            /* @__PURE__ */ jsx(ToggleField, { label: "Featured Tier", value: data.is_featured, onChange: (v) => setData("is_featured", v) }),
            /* @__PURE__ */ jsx(ToggleField, { label: "Active State", value: data.is_active, onChange: (v) => setData("is_active", v) }),
            /* @__PURE__ */ jsx(ToggleField, { label: "Visible public", value: data.is_visible, onChange: (v) => setData("is_visible", v) })
          ] }),
          /* @__PURE__ */ jsx(Field, { label: "Sort Priority Order", error: errors.sort_order, children: /* @__PURE__ */ jsx("input", { style: { ...input, width: 120 }, type: "number", value: data.sort_order, onChange: (e) => setData("sort_order", +e.target.value) }) })
        ] }),
        /* @__PURE__ */ jsxs("section", { style: cardSection, children: [
          /* @__PURE__ */ jsxs("h3", { style: sectionTitle, children: [
            /* @__PURE__ */ jsx(Zap, { size: 12 }),
            " Standard Monies (USD)"
          ] }),
          /* @__PURE__ */ jsxs("div", { style: grid3, children: [
            /* @__PURE__ */ jsx(Field, { label: "Monthly Rate", error: errors.price_monthly, children: /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
              /* @__PURE__ */ jsx("span", { style: inputPrefix, children: "$" }),
              /* @__PURE__ */ jsx("input", { style: { ...input, paddingLeft: 24 }, type: "number", step: "0.01", value: data.price_monthly, onChange: (e) => setData("price_monthly", e.target.value), placeholder: "29.00" })
            ] }) }),
            /* @__PURE__ */ jsx(Field, { label: "Annual Rate", error: errors.price_annual, children: /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
              /* @__PURE__ */ jsx("span", { style: inputPrefix, children: "$" }),
              /* @__PURE__ */ jsx("input", { style: { ...input, paddingLeft: 24 }, type: "number", step: "0.01", value: data.price_annual, onChange: (e) => setData("price_annual", e.target.value), placeholder: "290.00" })
            ] }) }),
            /* @__PURE__ */ jsx(Field, { label: "Lifetime (LTD)", error: errors.price_lifetime, children: /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
              /* @__PURE__ */ jsx("span", { style: inputPrefix, children: "$" }),
              /* @__PURE__ */ jsx("input", { style: { ...input, paddingLeft: 24 }, type: "number", step: "0.01", value: data.price_lifetime, onChange: (e) => setData("price_lifetime", e.target.value), placeholder: "179.00" })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }, children: [
            /* @__PURE__ */ jsx("h4", { style: { ...sectionTitle, color: vq.emerald[400], fontSize: 11, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }, children: "🇵🇰 Localized Rupee Pricing (PKR Overrides)" }),
            /* @__PURE__ */ jsxs("div", { style: grid3, children: [
              /* @__PURE__ */ jsx(Field, { label: "Monthly (PKR)", error: errors.price_monthly_pkr, children: /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
                /* @__PURE__ */ jsx("span", { style: { ...inputPrefix, color: vq.emerald[400] }, children: "Rs" }),
                /* @__PURE__ */ jsx("input", { style: { ...input, paddingLeft: 30 }, type: "number", value: data.price_monthly_pkr, onChange: (e) => setData("price_monthly_pkr", e.target.value), placeholder: "1100" })
              ] }) }),
              /* @__PURE__ */ jsx(Field, { label: "Annual (PKR)", error: errors.price_annual_pkr, children: /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
                /* @__PURE__ */ jsx("span", { style: { ...inputPrefix, color: vq.emerald[400] }, children: "Rs" }),
                /* @__PURE__ */ jsx("input", { style: { ...input, paddingLeft: 30 }, type: "number", value: data.price_annual_pkr, onChange: (e) => setData("price_annual_pkr", e.target.value), placeholder: "11000" })
              ] }) }),
              /* @__PURE__ */ jsx(Field, { label: "Lifetime (PKR)", error: errors.price_lifetime_pkr, children: /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
                /* @__PURE__ */ jsx("span", { style: { ...inputPrefix, color: vq.emerald[400] }, children: "Rs" }),
                /* @__PURE__ */ jsx("input", { style: { ...input, paddingLeft: 30 }, type: "number", value: data.price_lifetime_pkr, onChange: (e) => setData("price_lifetime_pkr", e.target.value), placeholder: "22120" })
              ] }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { style: cardSection, children: [
          /* @__PURE__ */ jsxs("h3", { style: sectionTitle, children: [
            /* @__PURE__ */ jsx(Ticket, { size: 12 }),
            " Lemon Squeezy Gateway Routing"
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [
            /* @__PURE__ */ jsx(Field, { label: "Standard Checkout URL (USD)", error: errors.checkout_url_usd, children: /* @__PURE__ */ jsx("input", { style: input, type: "url", value: data.checkout_url_usd, onChange: (e) => setData("checkout_url_usd", e.target.value), placeholder: "https://checkout.lemonsqueezy.com/buy/..." }) }),
            /* @__PURE__ */ jsx(Field, { label: "Localized Checkout URL (PKR)", error: errors.checkout_url_pkr, children: /* @__PURE__ */ jsx("input", { style: input, type: "url", value: data.checkout_url_pkr, onChange: (e) => setData("checkout_url_pkr", e.target.value), placeholder: "https://checkout.lemonsqueezy.com/buy/..." }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { style: cardSection, children: [
          /* @__PURE__ */ jsxs("h3", { style: sectionTitle, children: [
            /* @__PURE__ */ jsx(Server, { size: 12 }),
            " System Limits & Allowances"
          ] }),
          /* @__PURE__ */ jsx("div", { style: { overflowX: "auto", background: "rgba(0,0,0,0.2)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.04)" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 }, children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { style: { borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }, children: ["System Feature / Key Allowances", "Max Allowance (blank = ∞)", "Reset Frequency"].map((h) => /* @__PURE__ */ jsx("th", { style: { padding: "10px 14px", textAlign: "left", color: vq.slate[500], fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }, children: h }, h)) }) }),
            /* @__PURE__ */ jsx("tbody", { children: data.limits.map((lim, i) => /* @__PURE__ */ jsxs("tr", { style: { borderBottom: "1px solid rgba(255,255,255,0.03)" }, children: [
              /* @__PURE__ */ jsx("td", { style: { padding: "12px 14px", color: vq.slate[200], fontSize: 12, fontWeight: 600 }, children: LIMIT_KEYS[i]?.label || lim.key }),
              /* @__PURE__ */ jsx("td", { style: { padding: "8px 14px" }, children: /* @__PURE__ */ jsx(
                "input",
                {
                  style: { ...input, padding: "6px 12px", fontSize: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" },
                  value: lim.value ?? "",
                  placeholder: "Unlimited",
                  onChange: (e) => {
                    const updated = [...data.limits];
                    updated[i] = { ...updated[i], value: e.target.value || null };
                    setData("limits", updated);
                  }
                }
              ) }),
              /* @__PURE__ */ jsx("td", { style: { padding: "8px 14px" }, children: /* @__PURE__ */ jsx(
                "select",
                {
                  style: { ...input, padding: "6px 12px", fontSize: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" },
                  value: lim.reset_period,
                  onChange: (e) => {
                    const updated = [...data.limits];
                    updated[i] = { ...updated[i], reset_period: e.target.value };
                    setData("limits", updated);
                  },
                  children: ["never", "monthly", "annually"].map((r) => /* @__PURE__ */ jsx("option", { value: r, children: r.toUpperCase() }, r))
                }
              ) })
            ] }, lim.key)) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("section", { style: cardSection, children: [
          /* @__PURE__ */ jsxs("h3", { style: sectionTitle, children: [
            /* @__PURE__ */ jsx(Award, { size: 12 }),
            " Executive Internal Notes"
          ] }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              style: { ...input, height: 80, resize: "vertical", fontFamily: "inherit" },
              value: data.internal_notes,
              onChange: (e) => setData("internal_notes", e.target.value),
              placeholder: "Notes for the platforms team only. Highly confidential..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: "12px", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }, children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, style: btnSecondary, children: "Cancel" }),
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: processing, style: btnPrimary, children: processing ? "Saving..." : isEdit ? "Save Changes" : "Publish Plan" })
        ] })
      ] })
    ] })
  ] });
}
function PlansIndex({ plans, platforms }) {
  const [activeTab, setActiveTab] = useState(platforms[0]?.id);
  const [viewMode, setViewMode] = useState("list");
  const [drawerPlan, setDrawerPlan] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const filteredPlans = plans.filter((p) => p.platform_id === activeTab);
  const openCreate = () => {
    setDrawerPlan(null);
    setDrawerOpen(true);
  };
  const openEdit = (plan) => {
    setDrawerPlan(plan);
    setDrawerOpen(true);
  };
  const closeDrawer = () => setDrawerOpen(false);
  const duplicate = (plan) => {
    if (confirm(`Duplicate subscription plan "${plan.name}"?`)) {
      router.post(route("platform.plans.duplicate", { plan: plan.id }));
    }
  };
  const destroy = (plan) => {
    if (confirm(`Delete subscription plan "${plan.name}"? This is completely irreversible.`)) {
      router.delete(route("platform.plans.destroy", { plan: plan.id }));
    }
  };
  const archive = (plan) => {
    if (confirm(`Archive subscription plan "${plan.name}"? This will disable it and hide it from signup lists.`)) {
      router.post(route("platform.plans.archive", { plan: plan.id }));
    }
  };
  const unarchive = (plan) => {
    if (confirm(`Unarchive subscription plan "${plan.name}"?`)) {
      router.post(route("platform.plans.unarchive", { plan: plan.id }));
    }
  };
  const toggleActive = (plan) => {
    router.put(route("platform.plans.update", { plan: plan.id }), { is_active: !plan.is_active });
  };
  return /* @__PURE__ */ jsxs(PlatformShell, { title: "SaaS Subscriptions", mode: "admin", activeMenu: "Plans & Limits", children: [
    /* @__PURE__ */ jsx(Head, { title: "Plans & Limits | VenQore Platform HQ" }),
    /* @__PURE__ */ jsx("style", { children: `
                .badge-glass {
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            ` }),
    /* @__PURE__ */ jsxs("div", { style: { padding: "32px 40px", minHeight: "100vh", background: vq.gray[950], position: "relative", overflow: "hidden" }, children: [
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: "-10%", right: "-5%", width: 500, height: 500, background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none" } }),
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", bottom: "-15%", left: "-5%", width: 550, height: 550, background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", filter: "blur(90px)", pointerEvents: "none" } }),
      /* @__PURE__ */ jsxs("div", { style: { position: "relative", zIndex: 10 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 36 }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, color: vq.indigo[400], fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }, children: [
              /* @__PURE__ */ jsx(Activity, { size: 14 }),
              " Monetization Pipeline"
            ] }),
            /* @__PURE__ */ jsx("h1", { style: { margin: 0, fontSize: 32, fontWeight: 900, color: vq.slate[50], letterSpacing: "-0.03em" }, children: "Subscription Tiers" }),
            /* @__PURE__ */ jsx("p", { style: { margin: "6px 0 0", color: vq.slate[500], fontSize: 14, maxWidth: 550, lineHeight: 1.6 }, children: "Edit limit matrices, toggle features per tier, and configure pricing. Changes propagate instantly to all active tenants." })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10, alignItems: "center" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 3 }, children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setViewMode("list"),
                  style: {
                    background: viewMode === "list" ? "rgba(99,102,241,0.15)" : "transparent",
                    color: viewMode === "list" ? vq.indigo[300] : vq.slate[500],
                    border: viewMode === "list" ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                    padding: "8px 16px",
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s"
                  },
                  children: [
                    /* @__PURE__ */ jsx(Table2, { size: 13 }),
                    " Plans List"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setViewMode("matrix"),
                  style: {
                    background: viewMode === "matrix" ? "rgba(99,102,241,0.15)" : "transparent",
                    color: viewMode === "matrix" ? vq.indigo[300] : vq.slate[500],
                    border: viewMode === "matrix" ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                    padding: "8px 16px",
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s"
                  },
                  children: [
                    /* @__PURE__ */ jsx(Grid3x3, { size: 13 }),
                    " Feature Matrix"
                  ]
                }
              )
            ] }),
            viewMode === "list" && /* @__PURE__ */ jsx("button", { onClick: openCreate, style: btnPrimary, children: "+ Create New Plan" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 32, paddingBottom: 2 }, children: platforms.map((p) => {
          const isTabActive = activeTab === p.id;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setActiveTab(p.id),
              style: {
                background: isTabActive ? "rgba(99,102,241,0.12)" : "transparent",
                border: `1px solid ${isTabActive ? "rgba(99,102,241,0.4)" : "transparent"}`,
                color: isTabActive ? vq.indigo[300] : vq.slate[500],
                padding: "10px 22px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                borderRadius: "12px 12px 0 0",
                transition: "all 0.20s",
                display: "flex",
                alignItems: "center",
                gap: 8
              },
              children: [
                /* @__PURE__ */ jsx(Database, { size: 13 }),
                " ",
                p.name,
                /* @__PURE__ */ jsx("span", { style: {
                  marginLeft: 6,
                  background: isTabActive ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                  color: isTabActive ? vq.indigo[200] : vq.slate[600],
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontSize: 10,
                  fontFamily: "monospace",
                  fontWeight: 900
                }, children: plans.filter((pl) => pl.platform_id === p.id).length })
              ]
            },
            p.id
          );
        }) }),
        viewMode === "list" && /* @__PURE__ */ jsx("div", { style: {
          background: "rgba(30,41,59,0.3)",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
        }, children: /* @__PURE__ */ jsx("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 14 }, children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { style: { background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }, children: ["Subscription Tier", "Platform Type", "Standard Pricing", "Active Stores", "Key Limits Matrix", "Visibility", "Operator Control"].map((h) => /* @__PURE__ */ jsx("th", { style: { padding: "16px 20px", textAlign: "left", color: vq.slate[400], fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }, children: h }, h)) }) }),
          /* @__PURE__ */ jsx("tbody", { children: filteredPlans.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: 7, style: { padding: "72px 0", textAlign: "center", color: vq.slate[600], fontSize: 14 }, children: [
            /* @__PURE__ */ jsx(LayoutGrid, { size: 24, style: { margin: "0 auto 12px", opacity: 0.5 } }),
            'No plans registered under this platform yet. Click "+ Create New Plan" to establish one.'
          ] }) }) : filteredPlans.map((plan, i) => /* @__PURE__ */ jsxs(
            "tr",
            {
              style: { borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s ease" },
              onMouseEnter: (e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)",
              onMouseLeave: (e) => e.currentTarget.style.background = "",
              children: [
                /* @__PURE__ */ jsx("td", { style: { padding: "18px 20px" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
                  /* @__PURE__ */ jsx("div", { style: { width: 8, height: 8, borderRadius: "50%", background: plan.is_active ? vq.emerald[500] : vq.slate[500], boxShadow: plan.is_active ? "0 0 8px #10b981" : "none", flexShrink: 0 } }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("div", { style: { fontWeight: 800, color: vq.slate[100], fontSize: 14 }, children: plan.name }),
                    /* @__PURE__ */ jsx("div", { style: { fontSize: 10, color: vq.slate[600], marginTop: 2, fontFamily: "monospace" }, children: plan.slug })
                  ] }),
                  plan.is_featured && /* @__PURE__ */ jsxs("span", { style: { background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: vq.amber[400], fontSize: 9, padding: "2px 8px", borderRadius: 6, fontWeight: 900, letterSpacing: "0.08em" }, children: [
                    /* @__PURE__ */ jsx(Star, { size: 8, style: { display: "inline", marginRight: 4, verticalAlign: "middle" } }),
                    "FEATURED"
                  ] })
                ] }) }),
                /* @__PURE__ */ jsx("td", { style: { padding: "18px 20px" }, children: /* @__PURE__ */ jsx("span", { style: { background: planTypeColor(plan.type) + "15", color: planTypeColor(plan.type), border: `1px solid ${planTypeColor(plan.type)}30`, padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }, children: plan.type }) }),
                /* @__PURE__ */ jsxs("td", { style: { padding: "18px 20px", color: vq.slate[300], fontSize: 13, fontWeight: 600 }, children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    plan.price_monthly ? `$${parseFloat(plan.price_monthly).toFixed(0)}/mo` : "",
                    plan.price_annual ? ` · $${parseFloat(plan.price_annual).toFixed(0)}/yr` : "",
                    plan.price_lifetime ? `$${parseFloat(plan.price_lifetime).toFixed(0)} once` : "",
                    !plan.price_monthly && !plan.price_annual && !plan.price_lifetime ? /* @__PURE__ */ jsx("span", { style: { color: vq.slate[600] }, children: "—" }) : ""
                  ] }),
                  (plan.price_monthly_pkr || plan.price_annual_pkr || plan.price_lifetime_pkr) && /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: vq.emerald[500], marginTop: 4, fontWeight: 700 }, children: [
                    plan.price_monthly_pkr ? `Rs ${parseFloat(plan.price_monthly_pkr).toFixed(0)}/mo` : "",
                    plan.price_annual_pkr ? ` · Rs ${parseFloat(plan.price_annual_pkr).toFixed(0)}/yr` : "",
                    plan.price_lifetime_pkr ? ` · Rs ${parseFloat(plan.price_lifetime_pkr).toFixed(0)} once` : ""
                  ] })
                ] }),
                /* @__PURE__ */ jsx("td", { style: { padding: "18px 20px" }, children: /* @__PURE__ */ jsx("span", { style: { fontWeight: 900, color: plan.active_tenant_count > 0 ? vq.emerald[500] : vq.slate[600], fontSize: 16, fontFamily: "monospace" }, children: plan.active_tenant_count ?? 0 }) }),
                /* @__PURE__ */ jsx("td", { style: { padding: "18px 20px" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 400 }, children: [
                  plan.limits?.slice(0, 4).map((l) => /* @__PURE__ */ jsxs("span", { style: { fontSize: 10, color: vq.slate[400], background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: 6, fontFamily: "monospace" }, children: [
                    LIMIT_KEYS.find((k) => k.key === l.key)?.label.replace(" Integration", "").replace(" AI", "").replace(" Support", "") || l.key,
                    ": ",
                    l.value ?? "∞"
                  ] }, l.key)),
                  plan.limits?.length > 4 && /* @__PURE__ */ jsxs("span", { style: { fontSize: 9, color: vq.slate[600], padding: "3px 6px", fontWeight: 700 }, children: [
                    "+",
                    plan.limits.length - 4,
                    " more"
                  ] })
                ] }) }),
                /* @__PURE__ */ jsx("td", { style: { padding: "18px 20px" }, children: plan.archived_at ? /* @__PURE__ */ jsx("span", { style: { color: vq.red[500], background: "rgba(239,68,68,0.1)", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, border: "1px solid rgba(239,68,68,0.2)", textTransform: "uppercase", letterSpacing: "0.05em" }, children: "Archived" }) : /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => toggleActive(plan),
                    style: {
                      background: plan.is_active ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
                      color: plan.is_active ? vq.emerald[500] : vq.slate[500],
                      border: `1px solid ${plan.is_active ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.06)"}`,
                      padding: "4px 14px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      transition: "all 0.15s ease"
                    },
                    children: plan.is_active ? "Visible" : "Hidden"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { style: { padding: "18px 20px" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
                  /* @__PURE__ */ jsxs("button", { onClick: () => openEdit(plan), style: btnSmall, children: [
                    /* @__PURE__ */ jsx(Edit3, { size: 11 }),
                    " Edit"
                  ] }),
                  /* @__PURE__ */ jsxs("button", { onClick: () => duplicate(plan), style: btnSmall, children: [
                    /* @__PURE__ */ jsx(Copy, { size: 11 }),
                    " Clone"
                  ] }),
                  plan.archived_at ? /* @__PURE__ */ jsx("button", { onClick: () => unarchive(plan), style: { ...btnSmall, color: vq.emerald[500], background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }, title: "Restore Plan", children: "Restore" }) : /* @__PURE__ */ jsx("button", { onClick: () => archive(plan), style: { ...btnSmall, color: vq.amber[500], background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }, title: "Archive Plan", children: "Archive" }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => destroy(plan),
                      disabled: plan.active_tenant_count > 0,
                      title: plan.active_tenant_count > 0 ? `${plan.active_tenant_count} tenants on this plan` : "Delete",
                      style: {
                        ...btnSmall,
                        color: vq.red[500],
                        background: "rgba(239,68,68,0.05)",
                        border: "1px solid rgba(239,68,68,0.15)",
                        opacity: plan.active_tenant_count > 0 ? 0.3 : 1,
                        cursor: plan.active_tenant_count > 0 ? "not-allowed" : "pointer"
                      },
                      children: /* @__PURE__ */ jsx(Trash2, { size: 11 })
                    }
                  )
                ] }) })
              ]
            },
            plan.id
          )) })
        ] }) }) }),
        viewMode === "matrix" && (filteredPlans.length === 0 ? /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: "72px 0", color: vq.slate[600] }, children: [
          /* @__PURE__ */ jsx(Grid3x3, { size: 28, style: { margin: "0 auto 14px", opacity: 0.4 } }),
          /* @__PURE__ */ jsx("p", { children: "No plans exist for this platform yet. Create a plan first, then return here to configure its feature matrix." }),
          /* @__PURE__ */ jsx("button", { onClick: () => setViewMode("list"), style: { ...btnPrimary, marginTop: 16 }, children: "Go to Plans List" })
        ] }) : /* @__PURE__ */ jsx(FeatureMatrix, { plans: filteredPlans }))
      ] })
    ] }),
    drawerOpen && /* @__PURE__ */ jsx(PlanDrawer, { open: drawerOpen, onClose: closeDrawer, plan: drawerPlan, platforms })
  ] });
}
function Field({ label, error, children }) {
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 6, width: "100%" }, children: [
    /* @__PURE__ */ jsx("label", { style: { fontSize: 11, color: vq.slate[400], fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }, children: label }),
    children,
    error && /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: vq.red[500], fontWeight: 600, marginTop: 2 }, children: error })
  ] });
}
function ToggleField({ label, value, onChange }) {
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 6, width: "100%" }, children: [
    /* @__PURE__ */ jsx("label", { style: { fontSize: 11, color: vq.slate[400], fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }, children: label }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => onChange(!value),
        style: {
          background: value ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.02)",
          color: value ? vq.indigo[300] : vq.slate[500],
          border: "1px solid " + (value ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"),
          padding: "8px 16px",
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 800,
          cursor: "pointer",
          transition: "all 0.15s ease",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        },
        children: value ? "✓ On" : "Off"
      }
    )
  ] });
}
const cardSection = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.04)",
  borderRadius: 18,
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 16
};
const sectionTitle = {
  margin: "0 0 4px",
  fontSize: 11,
  fontWeight: 900,
  color: vq.indigo[400],
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  display: "flex",
  alignItems: "center",
  gap: 6
};
const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 };
const input = {
  width: "100%",
  boxSizing: "border-box",
  background: vq.gray[900],
  border: "1px solid rgba(255,255,255,0.08)",
  color: vq.slate[50],
  padding: "10px 14px",
  borderRadius: 10,
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
  transition: "border 0.2s"
};
const inputPrefix = {
  position: "absolute",
  left: 12,
  top: "52%",
  transform: "translateY(-50%)",
  color: vq.slate[600],
  fontSize: 13,
  fontWeight: 700
};
const btnPrimary = {
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  color: "#fff",
  border: "none",
  padding: "11px 24px",
  borderRadius: 12,
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(99,102,241,0.25)",
  transition: "all 0.15s"
};
const btnSecondary = {
  background: "rgba(255,255,255,0.03)",
  color: vq.slate[400],
  border: "1px solid rgba(255,255,255,0.06)",
  padding: "10px 22px",
  borderRadius: 12,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer"
};
const btnSmall = {
  background: "rgba(255,255,255,0.03)",
  color: vq.slate[300],
  border: "1px solid rgba(255,255,255,0.05)",
  padding: "6px 14px",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 11,
  cursor: "pointer",
  whiteSpace: "nowrap",
  display: "flex",
  alignItems: "center",
  gap: 5,
  transition: "all 0.15s"
};
export {
  PlansIndex as default
};

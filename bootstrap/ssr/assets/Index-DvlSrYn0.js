import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useState, useCallback } from "react";
import { Head, router, usePage, useForm } from "@inertiajs/react";
import { P as PlatformShell } from "./PlatformShell-B1IWUXx4.js";
import { n as normalizePlan } from "./plans-CxabWI_P.js";
import { v as vq } from "./runtime-DwSFgQZq.js";
import { Activity, Table2, Grid3x3, Database, LayoutGrid, Star, Edit3, Copy, Trash2, ChevronRight, ChevronDown, Shield, RefreshCw, Save, Layers, Info, Zap, Ticket, Server, Award } from "lucide-react";
import "./PlatformLayout-l0DusZka.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./ui-CY-levCx.js";
import "./AiIsland-DlkwqCwv.js";
import "motion/react";
import "./ThinkingOrb-CQCcf5-R.js";
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
const FEATURE_GROUPS = [
  {
    id: "onboarding",
    emoji: "🚀",
    label: "Onboarding & First Impression",
    description: "Landing page, trial, instant setup, and platform presence features.",
    features: [
      { "key": "demo_store", "label": "Interactive Demo Store", "type": "system", "note": "Infrastructure — demo store toggle" },
      { "key": "free_trial_days", "label": "Free Trial Days", "type": "number", "note": "Blank = 0 days; 14 = 14-day trial" },
      { "key": "instant_store_creator", "label": "Instant Store Creator", "type": "system", "note": "Infrastructure — store creation engine" },
      { "key": "industry_seeding", "label": "Smart Industry Archetype Seeding", "type": "boolean" },
      { "key": "dark_theme", "label": '"Midnight Nebula" Dark Theme', "type": "boolean" },
      { "key": "light_theme", "label": "Harmonious Light Theme", "type": "boolean" },
      { "key": "multi_store_hub", "label": "Multi-Store Hub Dashboard", "type": "boolean" },
      { "key": "multi_store_roles", "label": "Granular Multi-Store User Roles", "type": "boolean" },
      { "key": "cashier_pin_login", "label": "Instant Cashier PIN Login", "type": "boolean" },
      { "key": "device_adaptive", "label": "Device-Adaptive Layouts", "type": "boolean" },
      { "key": "pwa_install", "label": "Web App / PWA Install", "type": "system" },
      { "key": "guided_setup_tour", "label": "Self-Guiding Setup Tour", "type": "boolean" },
      { "key": "coupon_stacking", "label": "Flexible Coupon Code Stacking", "type": "boolean" },
      { "key": "platform_status_badge", "label": "Platform Live Status Badge", "type": "boolean" },
      { "key": "system_cache_refresher", "label": "System Cache Refresher", "type": "boolean" },
      { "key": "owner_profile_card", "label": "Owner Profile Card", "type": "boolean" },
      { "key": "one_click_system_wipe", "label": "One-Click System Wipe", "type": "boolean" },
      { "key": "smtp_mail", "label": "Custom SMTP Mail Server", "type": "boolean" },
      { "key": "sms_gateway", "label": "SMS Gateway Integrations", "type": "boolean" }
    ]
  },
  {
    id: "core_limits",
    emoji: "⚡",
    label: "Core Limits & Quotas",
    description: "Commercial scale fences, SKU capacity, staff seats, locations and register hardware.",
    features: [
      { "key": "sku_limit", "label": "Product Catalogue Limit (SKUs)", "type": "number", "note": "500 Solo · 5k Starter · 25k Core · 250k Scale" },
      { "key": "staff_limit", "label": "Full Staff Seats", "type": "number", "note": "1 Solo · 1 Starter · 5 Core · 25 Scale" },
      { "key": "locations", "label": "Store Locations / Warehouses", "type": "number", "note": "1 Solo/Starter/Core · 10 Scale" },
      { "key": "location_limit", "label": "Location Limit Alias", "type": "number", "note": "Enforced secondary location gate" },
      { "key": "registers", "label": "Register Terminals (POS)", "type": "number", "note": "1 Solo · 2 Starter · 6 Core · 20 Scale" },
      { "key": "till_logins", "label": "Till PIN Logins", "type": "number", "note": "2 on Solo · Unlimited on paid" },
      { "key": "devices_per_seat", "label": "Hardware Devices per Seat", "type": "number", "note": "2 Solo · 3 Starter/Core · 5 Scale" },
      { "key": "visible_history_days", "label": "Visible History Days", "type": "number", "note": "30 days on Solo · Unlimited on paid" },
      { "key": "transactions_per_month", "label": "Monthly Transactions Limit", "type": "number", "note": "100 on Solo · Unlimited on paid" },
      { "key": "service_jobs_per_month", "label": "Monthly Service Jobs", "type": "number", "note": "20 on Solo · Unlimited on paid" }
    ]
  },
  {
    id: "security",
    emoji: "🛡️",
    label: "Security, Audit & Granular Roles",
    description: "Activity logs, tamper-evident audit trails, and granular RBAC roles.",
    features: [
      { "key": "security_activity_log", "label": "Security Activity Log", "type": "boolean", "note": "Audit log of staff & login actions" },
      { "key": "audit_trail", "label": "Immutable Audit Trail", "type": "boolean", "note": "Financial and inventory mutation audit log" },
      { "key": "custom_roles", "label": "Granular Custom Roles & Permissions", "type": "boolean", "note": "Create bespoke permission sets" }
    ]
  },
  {
    id: "pos",
    emoji: "🛒",
    label: "POS & Supercharged Checkout",
    description: "Checkout terminal, scanner, printing, and payment features.",
    features: [
      { "key": "pos", "label": "POS Terminal Module", "type": "boolean", "note": "Core point-of-sale interface" },
      { "key": "barcode_scanner", "label": "Instant Barcode Scanner Integration", "type": "boolean" },
      { "key": "imei_scanner", "label": "Unique Serial & IMEI Scanner", "type": "boolean" },
      { "key": "serial_tracking", "label": "Serial Number Tracking", "type": "boolean", "note": "Per-item serial lifecycle tracking" },
      { "key": "keyboard_hotkeys", "label": "High-Speed Keyboard-First Checkout", "type": "boolean" },
      { "key": "senior_mode", "label": 'Accessibility "Senior Mode" Toggle', "type": "boolean" },
      { "key": "high_contrast_colors", "label": "High-Contrast Price/Qty Color Coding", "type": "boolean" },
      { "key": "profit_peek", "label": 'Owner "Profit Peek" Swipe', "type": "boolean" },
      { "key": "cart_tabs_limit", "label": "Multi-Tab Customer Checkout", "type": "number", "note": "Max parallel cart tabs" },
      { "key": "park_recall", "label": "Park & Recall (Hold Bill)", "type": "boolean" },
      { "key": "inflight_product_creation", "label": "In-Flight Product Creation", "type": "boolean" },
      { "key": "cart_session_protection", "label": "Cart Rescue & Session Protection", "type": "boolean" },
      { "key": "contextual_qty_modifiers", "label": "Contextual Quantity Modifiers", "type": "boolean" },
      { "key": "auto_customer_discounts", "label": "Automatic Customer Discounts", "type": "boolean" },
      { "key": "fuzzy_product_finder", "label": "Typo Fuzzy Finder (Product Search)", "type": "boolean" },
      { "key": "auto_cash_rounding", "label": "Automatic Cash Rounding", "type": "boolean" },
      { "key": "split_payments", "label": "Multi-Account Split Payments", "type": "boolean" },
      { "key": "daily_cash_audit", "label": "Daily Cash Register Audit", "type": "boolean" },
      { "key": "silent_webusb_printing", "label": "Silent WebUSB Thermal Printing", "type": "boolean" },
      { "key": "receipt_cutline_padding", "label": "Receipt Cut-Line Padding", "type": "boolean" },
      { "key": "custom_thermal_widths", "label": "Custom Thermal Roll Widths (80/58mm)", "type": "boolean" },
      { "key": "dynamic_accent_colors", "label": "Dynamic Accent Colors on Docs", "type": "boolean" },
      { "key": "invoice_column_toggles", "label": "Column Toggles on Invoices", "type": "boolean" },
      { "key": "amount_to_words", "label": "Dynamic Amount-to-Words Translation", "type": "boolean" },
      { "key": "receipt_qr_code", "label": "Verification QR Code Generation", "type": "boolean" },
      { "key": "branded_receipt_sync", "label": "Branded Receipt Sync (Logo/Header)", "type": "boolean" },
      { "key": "pos_negative_stock_alert", "label": "POS Negative Stock Alert Badge", "type": "boolean" },
      { "key": "negative_stock_lock", "label": "Negative Stock Sales Lock", "type": "boolean" },
      { "key": "service_fee_additions", "label": "Dynamic Service Fee Additions", "type": "boolean" },
      { "key": "auto_vat_gst", "label": "Automatic VAT/GST Calculations", "type": "boolean" },
      { "key": "custom_charge_toggle", "label": "Quick Custom Charge Toggle", "type": "boolean" },
      { "key": "fuzzy_customer_lookup", "label": "Fuzzy Customer Name Lookup", "type": "boolean" },
      { "key": "recent_invoices_panel", "label": "Recent Invoices List", "type": "boolean" },
      { "key": "cashier_change_helper", "label": "Cashier Change Helper", "type": "boolean" },
      { "key": "barcode_label_print", "label": "Barcode Label Printing Factory", "type": "boolean" },
      { "key": "label_qr_codes", "label": "Dynamic Label QR Codes", "type": "boolean" },
      { "key": "barcode_label_factory", "label": "Custom Label Designer Factory", "type": "boolean" }
    ]
  },
  {
    id: "invoicing",
    emoji: "🧾",
    label: "Invoicing, Customer Khata & Receivables",
    description: "Customer credit tracking, invoicing, loyalty, and debt collection.",
    features: [
      { "key": "customer_khata", "label": "Digital Customer Khata Ledger", "type": "boolean" },
      { "key": "customer_payments_log", "label": "Customer Payments Log", "type": "boolean" },
      { "key": "customer_statements", "label": "Monthly Customer Statements", "type": "boolean" },
      { "key": "aged_receivables", "label": "Aged Receivables (30/60/90+ Days)", "type": "boolean" },
      { "key": "credit_limit_rules", "label": "Customer Credit Limit Enforcer", "type": "boolean" },
      { "key": "multi_payment_invoices", "label": "Multi-Payment Invoices (Partial/Milestone)", "type": "boolean" },
      { "key": "customer_payment_alloc", "label": "FIFO Invoice Payment Allocation", "type": "boolean" },
      { "key": "anniversary_tracker", "label": "Birthday & Anniversary Tracker", "type": "boolean" },
      { "key": "customer_ltv_score", "label": "Customer Lifetime Value (LTV) Badge", "type": "boolean" },
      { "key": "customer_wallet", "label": "Customer Prepaid Wallet / Store Credit", "type": "boolean" },
      { "key": "loyalty_points", "label": "Loyalty Points Engine", "type": "boolean" },
      { "key": "digital_gift_cards", "label": "Digital Gift Cards System", "type": "boolean" },
      { "key": "marketing_campaigns", "label": "SMS/Email Marketing Campaigns", "type": "boolean" },
      { "key": "wholesale_pricing", "label": "Tiered B2B Wholesale Pricing", "type": "boolean" },
      { "key": "b2b_proposal_builder", "label": "B2B Quotation & Proposal Builder", "type": "boolean" },
      { "key": "quotation_conversion", "label": "One-Click Quote-to-Invoice Conversion", "type": "boolean" },
      { "key": "inflight_session_recovery", "label": "Invoice Draft Recovery", "type": "boolean" },
      { "key": "tax_inclusive_exclusive", "label": "Tax-Inclusive vs Exclusive Pricing Toggle", "type": "boolean" },
      { "key": "b2b_margin_displayer", "label": "Live Margin & Profit Display on Invoices", "type": "boolean" },
      { "key": "sales_return_vouchers", "label": "Sales Return Credit Vouchers", "type": "boolean" },
      { "key": "b2b_invoice_designer", "label": "B2B Commercial Invoice Template", "type": "boolean" },
      { "key": "pre_sales_reservation", "label": "Pre-Sales Stock Reservation", "type": "boolean" },
      { "key": "refund_reason_analysis", "label": "Refund Reason Analysis", "type": "boolean" },
      { "key": "tax_exempt_customers", "label": "Tax-Exempt Customer Classification", "type": "boolean" },
      { "key": "customer_address_book", "label": "Multi-Address Book per Customer", "type": "boolean" },
      { "key": "a4_invoice_pdf", "label": "Standard A4 PDF Invoices", "type": "boolean" },
      { "key": "letter_size_invoice", "label": "US Letter Size Invoice Option", "type": "boolean" },
      { "key": "outstanding_balance_grid", "label": "Outstanding Balance Grid", "type": "boolean" },
      { "key": "payment_due_dates", "label": "Custom Payment Due Dates", "type": "boolean" },
      { "key": "overdue_highlights", "label": "Visual Overdue Invoice Highlights", "type": "boolean" },
      { "key": "lump_sum_payments", "label": "Lump-Sum Payment Distribution", "type": "boolean" },
      { "key": "partial_payment_indicator", "label": "Partial Payment Progress Indicators", "type": "boolean" },
      { "key": "unified_party_ledger", "label": "Unified Customer/Vendor Cross-Ledger", "type": "boolean" },
      { "key": "recurring_invoices", "label": "Automated Recurring Invoices", "type": "boolean" },
      { "key": "recurring_invoicing", "label": "Recurring Invoicing Engine", "type": "boolean" },
      { "key": "invoice_reminders", "label": "Overdue Invoice Auto-Reminders", "type": "boolean" }
    ]
  },
  {
    id: "procurement",
    emoji: "📦",
    label: "Procurement, Suppliers & Payables",
    description: "Purchase orders, supplier khata, landed costs, and supplier payments.",
    features: [
      { "key": "supplier_khata", "label": "Supplier Khata Ledger", "type": "boolean" },
      { "key": "delayed_supplier_payments", "label": "Post-Dated Supplier Payment Schedules", "type": "boolean" },
      { "key": "supplier_statements", "label": "Supplier Account Statements", "type": "boolean" },
      { "key": "aged_payables", "label": "Aged Payables (30/60/90+ Days)", "type": "boolean" },
      { "key": "installment_payments", "label": "Supplier Installment Plans", "type": "boolean" },
      { "key": "purchase_orders", "label": "Full Purchase Order Workflow", "type": "boolean" },
      { "key": "partial_shipments", "label": "Partial Goods Received (GRN)", "type": "boolean" },
      { "key": "supplier_debit_notes", "label": "Supplier Debit Notes", "type": "boolean" },
      { "key": "auto_cost_adjuster", "label": "Automated Inventory Cost Adjuster", "type": "boolean" },
      { "key": "cost_price_fluctuator", "label": "Cost Price Fluctuation Alerts", "type": "boolean" },
      { "key": "supplier_lead_time", "label": "Supplier Lead Time Tracker", "type": "boolean" },
      { "key": "landing_costs", "label": "Landed Cost Distribution (Freight/Customs)", "type": "boolean" },
      { "key": "suppliers_directory", "label": "Suppliers Directory & Contacts", "type": "boolean" },
      { "key": "supplier_sku_mapping", "label": "Supplier SKU to Internal SKU Mapping", "type": "boolean" },
      { "key": "inbound_expiry_tracking", "label": "Inbound Expiry Date Verification", "type": "boolean" },
      { "key": "purchase_returns", "label": "Purchase Return & Refund Manager", "type": "boolean" },
      { "key": "auto_po_generation", "label": "Auto-Generate PO from Low Stock", "type": "boolean" },
      { "key": "bulk_supplier_payments", "label": "Bulk Supplier Payment Allocations", "type": "boolean" },
      { "key": "purchase_pdf_upload", "label": "Attach Supplier Invoice PDFs to POs", "type": "boolean" },
      { "key": "reconciled_bank_payments", "label": "Reconciled Bank Payment Logs", "type": "boolean" },
      { "key": "tax_inclusive_procurement", "label": "Tax-Inclusive Supplier Invoicing", "type": "boolean" },
      { "key": "supplier_outstanding_alerts", "label": "Supplier Payment Due Alerts", "type": "boolean" },
      { "key": "supplier_refund_tracker", "label": "Supplier Overpayment Refund Tracker", "type": "boolean" },
      { "key": "custom_payment_terms", "label": "Custom Vendor Payment Terms", "type": "boolean" }
    ]
  },
  {
    id: "inventory",
    emoji: "🏭",
    label: "Inventory, Production & Manufacturing",
    description: "Multi-location inventory, FIFO valuation, Bill of Materials, and work orders.",
    features: [
      { "key": "stock_transfer", "label": "Inter-Warehouse Stock Transfers", "type": "boolean" },
      { "key": "product_variants", "label": "Product Matrix Variants (Size/Color)", "type": "boolean" },
      { "key": "fifo_costing", "label": "True FIFO Inventory Costing", "type": "boolean" },
      { "key": "batch_tracking", "label": "Batch / Lot Number Tracking", "type": "boolean" },
      { "key": "batch_expiry", "label": "Batch Expiry Date Guard", "type": "boolean" },
      { "key": "stock_take_audit", "label": "Full Stock-Take & Physical Count Audits", "type": "boolean" },
      { "key": "disaster_claim", "label": "Damaged / Lost Goods Write-Off Manager", "type": "boolean" },
      { "key": "bill_of_materials", "label": "Bill of Materials (BOM) Recipes", "type": "boolean" },
      { "key": "production", "label": "Production Runs & Assembly", "type": "boolean" },
      { "key": "manufacturing", "label": "Manufacturing Module", "type": "boolean" },
      { "key": "auto_assembly_logic", "label": "Automatic Recipe Deduction on Sale", "type": "boolean" },
      { "key": "auto_assembly_checkout", "label": "POS Auto-Assembly Composite Items", "type": "boolean" },
      { "key": "production_simulator", "label": "Production Cost & Yield Simulator", "type": "boolean" },
      { "key": "recipe_history_archival", "label": "Recipe Cost & Ingredient Version History", "type": "boolean" },
      { "key": "product_history_timeline", "label": "Product Stock Movement Audit Timeline", "type": "boolean" },
      { "key": "category_management", "label": "Nested Category & Brand Tree", "type": "boolean" },
      { "key": "stock_levels_view", "label": "Real-Time Multi-Branch Stock Levels", "type": "boolean" },
      { "key": "low_stock_alerts", "label": "Low Stock & Reorder Point Alerts", "type": "boolean" },
      { "key": "uom_converter", "label": "Unit of Measure (UOM) Conversion Matrix", "type": "boolean" }
    ]
  },
  {
    id: "ecommerce_channels",
    emoji: "🌐",
    label: "E-Commerce, Multi-Branch & Channels",
    description: "Multi-branch operations, marketplace synchronization, and API/Webhooks.",
    features: [
      { "key": "multi_branch", "label": "Multi-Branch Operations Engine", "type": "boolean", "note": "Scale fence — multi-branch capability" },
      { "key": "woocommerce", "label": "WooCommerce Two-Way Sync", "type": "boolean", "note": "Live catalog, stock, and order bridge" },
      { "key": "amazon_sync", "label": "Amazon Marketplace Sync", "type": "boolean" },
      { "key": "ebay_sync", "label": "eBay Marketplace Sync", "type": "boolean" },
      { "key": "tiktok_sync", "label": "TikTok Shop Sync", "type": "boolean" },
      { "key": "woocommerce_customer_reg", "label": "WooCommerce Customer Registration Bridge", "type": "boolean" },
      { "key": "woocommerce_stock_sync", "label": "Instant Webhook Stock Sync to Store", "type": "boolean" },
      { "key": "woocommerce_orders_bridge", "label": "Automated Web Order Fulfillment Bridge", "type": "boolean" },
      { "key": "web_catalog_toggles", "label": "Selective Web-Catalog Visibility per SKU", "type": "boolean" },
      { "key": "api_access", "label": "REST API Access Token", "type": "boolean" },
      { "key": "webhooks", "label": "Real-Time Outgoing Event Webhooks", "type": "boolean" },
      { "key": "api_webhooks", "label": "Full Developer API & Webhooks Access", "type": "boolean" },
      { "key": "white_label", "label": "White-Label Branding (Remove VenQore Badges)", "type": "boolean" },
      { "key": "network_basic", "label": "Basic Network Node Federation", "type": "boolean" },
      { "key": "network_unlimited", "label": "Unlimited Enterprise Network Nodes", "type": "boolean" },
      { "key": "consolidated_reporting", "label": "Consolidated Multi-Entity Financials", "type": "boolean" },
      { "key": "vensync_command", "label": "VenSync Multi-Channel Command Center", "type": "boolean" }
    ]
  },
  {
    id: "accounting",
    emoji: "📊",
    label: "Double-Entry Accounting & Finance",
    description: "General ledger, bank reconciliation, fixed asset depreciation, and compliance.",
    features: [
      { "key": "double_entry_ledger", "label": "Double-Entry General Ledger (GL)", "type": "boolean" },
      { "key": "cash_account_reconciliation", "label": "Cash in Hand Reconciliation", "type": "boolean" },
      { "key": "loan_ledger", "label": "Commercial Loan & EMI Tracker", "type": "boolean" },
      { "key": "inter_register_transfers", "label": "Till-to-Bank Cash Transfers", "type": "boolean" },
      { "key": "advance_allocation", "label": "Advance Payment Multi-Invoice Allocation", "type": "boolean" },
      { "key": "debit_credit_notes", "label": "Formal Debit & Credit Notes Engine", "type": "boolean" },
      { "key": "tax_summary_engine", "label": "Real-Time Tax Liability Calculator", "type": "boolean" },
      { "key": "expense_manager", "label": "Operating Expense Category Manager", "type": "boolean" },
      { "key": "charity_engine", "label": "Automated Charity / Zakat Allocations", "type": "boolean" },
      { "key": "petty_cash", "label": "Petty Cash Voucher Register", "type": "boolean" },
      { "key": "fixed_asset_depreciation", "label": "Fixed Asset Depreciation Ledger", "type": "boolean" },
      { "key": "fiscal_year_closing", "label": "Fiscal Year-End Closing & Balance Carry", "type": "boolean" },
      { "key": "bank_reconciliation", "label": "Bank Statement Reconciliation Engine", "type": "boolean" },
      { "key": "e_invoicing", "label": "Electronic Invoicing & Fiscal Signatures", "type": "boolean" },
      { "key": "fund_management", "label": "Internal Capital & Partner Capital Accounts", "type": "boolean" },
      { "key": "google_drive_backup", "label": "Automated Google Drive Encrypted Backups", "type": "boolean" },
      { "key": "adviser_seat", "label": "External Accountant / CPA Read Seat", "type": "boolean" }
    ]
  },
  {
    id: "ai_signals",
    emoji: "🧠",
    label: "AI, Signals & Intelligence",
    description: "Smart receipt OCR capture, conversational AI assistants, and growth forecasting.",
    features: [
      { "key": "ai_assistant", "label": "Conversational AI POS Copilot", "type": "boolean" },
      { "key": "smart_capture", "label": "SmartCapture Optical Invoice Scanner", "type": "boolean" },
      { "key": "hypersearch_byok", "label": "HyperSearch BYOK (Bring Your Own Key)", "type": "boolean" },
      { "key": "ai_credits_monthly", "label": "Monthly AI Engine Credits", "type": "number", "note": "100 Solo · 500 Starter · 2000 Core · 10000 Scale" },
      { "key": "ai_scans_monthly", "label": "Monthly SmartCapture OCR Scans", "type": "number", "note": "10 on Solo · Unlimited on paid" },
      { "key": "ai_system_builder", "label": "Autonomous Store Builder & Theme AI", "type": "boolean" },
      { "key": "growth_engine", "label": "Autonomous Growth Recommendations", "type": "boolean" },
      { "key": "growth_signals", "label": "Predictive Inventory Stockout Signals", "type": "boolean" },
      { "key": "bulk_upload", "label": "AI Multi-Format Product Importer (CSV/Excel)", "type": "boolean" },
      { "key": "live_chat_widget", "label": "Real-Time Live Chat Customer Widget", "type": "boolean" }
    ]
  },
  {
    id: "services_industry",
    emoji: "🛠️",
    label: "Services, Work Orders & Industry Modules",
    description: "Job cards, repair ticketing, service contracts, and specialized retail verticals.",
    features: [
      { "key": "services", "label": "Services & Labor Catalog", "type": "boolean", "note": "Service items with hourly/fixed rates" },
      { "key": "service_jobs", "label": "Service Job Cards & Status Board", "type": "boolean" },
      { "key": "service_contracts", "label": "Annual Maintenance Contracts (AMC)", "type": "boolean" },
      { "key": "work_orders", "label": "Internal Shop Work Orders", "type": "boolean" },
      { "key": "optical_prescription", "label": "Optometry Rx & Axis Measurement Matrix", "type": "boolean" },
      { "key": "tailor_measurements", "label": "Apparel & Bespoke Tailoring Measurements", "type": "boolean" },
      { "key": "jewelry_metal_rates", "label": "Precious Metals Daily Karat Rate Engine", "type": "boolean" }
    ]
  },
  {
    id: "support_system",
    emoji: "🤝",
    label: "Support, SLA & System Capabilities",
    description: "Support channel tiering, SLA, and lifetime platform infrastructure.",
    features: [
      { "key": "chat_support", "label": "Priority In-App Chat Support", "type": "boolean" },
      { "key": "whatsapp_reminders", "label": "Automated WhatsApp Customer Reminders", "type": "boolean" },
      { "key": "dedicated_account_manager", "label": "Dedicated Customer Success Manager", "type": "boolean" },
      { "key": "ltd", "label": "AppSumo / LTD Lifetime Architecture Flag", "type": "system", "note": "System flag — lifetime account" }
    ]
  },
  {
    id: "reports_universal",
    emoji: "📈",
    label: "Reports & Analytics (Universal Access)",
    description: "All 23 comprehensive business reports are included on every plan under V11 §1.1 Universal Architecture.",
    features: [
      { "key": "reports", "label": "Reporting Complexity Tier", "type": "select", "note": "Basic on Solo · Advanced on Starter/Core/Scale", "options": ["basic", "advanced"] },
      { "key": "report_sales_records", "label": "Sales Records Report", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_purchase_records", "label": "Purchase Records Report", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_stock_records", "label": "Stock Movement Records", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_stock_valuation", "label": "FIFO Stock Valuation Report", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_profit_loss", "label": "Income Statement (Profit & Loss)", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_cash_flow", "label": "Cash Flow Statement", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_expenses", "label": "Operating Expense Breakdown", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_tax", "label": "Tax Liability & GST Audit Report", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_day_book", "label": "Daily Journal / Day Book", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_party_records", "label": "Customer & Vendor Party Directory", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_sales_analytics", "label": "Deep Sales Trend & Peak Hours Analytics", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_profitability", "label": "Item & Category Margin Profitability", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_discounts", "label": "Discounting & Coupon Leakage Audit", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_aging", "label": "Aged Debtors & Creditors Waterfall", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_balance_sheet", "label": "Formal Balance Sheet", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_expense_analysis", "label": "Overhead & OpEx Ratio Analysis", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_party_insights", "label": "Customer Retention & Churn Analytics", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "owners_daily_pulse", "label": "Owner Daily Pulse Dashboard Summary", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_ledger", "label": "General Ledger Detail Audit", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_point_in_time", "label": "Historical Point-in-Time Inventory", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_cross_party", "label": "Cross-Party Balance Reconciliations", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_loans", "label": "Loan & Amortization Schedule", "type": "boolean", "note": "Included on every plan (V11 §1.1)" },
      { "key": "report_export", "label": "Universal CSV/Excel/PDF Batch Exporter", "type": "boolean", "note": "Included on every plan (V11 §1.1)" }
    ]
  }
];
FEATURE_GROUPS.reduce((acc, g) => acc + g.features.length, 0);
const FEATURE_DEFAULTS = {
  "demo_store": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "free_trial_days": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "0",
    "trial": "0",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "0"
  },
  "instant_store_creator": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "industry_seeding": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "dark_theme": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "light_theme": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "multi_store_hub": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "multi_store_roles": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "cashier_pin_login": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "device_adaptive": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "pwa_install": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "guided_setup_tour": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "coupon_stacking": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "platform_status_badge": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "system_cache_refresher": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "owner_profile_card": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "one_click_system_wipe": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "smtp_mail": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "sms_gateway": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "security_activity_log": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "0"
  },
  "audit_trail": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "0"
  },
  "custom_roles": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "0"
  },
  "pos": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "barcode_scanner": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "imei_scanner": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "serial_tracking": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "keyboard_hotkeys": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "senior_mode": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "high_contrast_colors": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "profit_peek": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "cart_tabs_limit": {
    "solo": "5",
    "starter": "10",
    "core": "25",
    "scale": "50",
    "trial": "25",
    "ltd_1": "10",
    "ltd_2": "25",
    "ltd_3": "50"
  },
  "park_recall": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "inflight_product_creation": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "cart_session_protection": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "contextual_qty_modifiers": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "auto_customer_discounts": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "fuzzy_product_finder": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "auto_cash_rounding": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "split_payments": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "daily_cash_audit": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "silent_webusb_printing": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "receipt_cutline_padding": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "custom_thermal_widths": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "dynamic_accent_colors": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "invoice_column_toggles": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "amount_to_words": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "receipt_qr_code": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "branded_receipt_sync": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "pos_negative_stock_alert": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "negative_stock_lock": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "service_fee_additions": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "auto_vat_gst": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "custom_charge_toggle": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "fuzzy_customer_lookup": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "recent_invoices_panel": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "cashier_change_helper": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "barcode_label_print": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "label_qr_codes": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "barcode_label_factory": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "customer_khata": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "customer_payments_log": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "customer_statements": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "aged_receivables": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "credit_limit_rules": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "multi_payment_invoices": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "customer_payment_alloc": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "anniversary_tracker": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "customer_ltv_score": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "customer_wallet": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "loyalty_points": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "digital_gift_cards": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "marketing_campaigns": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "wholesale_pricing": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "b2b_proposal_builder": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "quotation_conversion": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "inflight_session_recovery": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "tax_inclusive_exclusive": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "b2b_margin_displayer": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "sales_return_vouchers": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "b2b_invoice_designer": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "pre_sales_reservation": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "refund_reason_analysis": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "tax_exempt_customers": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "customer_address_book": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "a4_invoice_pdf": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "letter_size_invoice": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "outstanding_balance_grid": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "payment_due_dates": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "overdue_highlights": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "lump_sum_payments": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "partial_payment_indicator": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "unified_party_ledger": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "recurring_invoices": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "invoice_reminders": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "supplier_khata": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "delayed_supplier_payments": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "supplier_statements": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "aged_payables": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "installment_payments": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "purchase_orders": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "partial_shipments": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "supplier_debit_notes": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "auto_cost_adjuster": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "cost_price_fluctuator": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "supplier_lead_time": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "landing_costs": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "suppliers_directory": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "supplier_sku_mapping": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "inbound_expiry_tracking": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "purchase_returns": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "auto_po_generation": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "bulk_supplier_payments": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "purchase_pdf_upload": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "reconciled_bank_payments": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "tax_inclusive_procurement": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "supplier_outstanding_alerts": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "supplier_refund_tracker": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "custom_payment_terms": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "locations": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "10",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "2",
    "ltd_3": "5"
  },
  "location_limit": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "10",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "2",
    "ltd_3": "5"
  },
  "stock_transfer": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "product_variants": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "fifo_costing": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "batch_tracking": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "batch_expiry": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "stock_take_audit": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "disaster_claim": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "bill_of_materials": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "production": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "manufacturing": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "auto_assembly_logic": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "auto_assembly_checkout": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "production_simulator": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "recipe_history_archival": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "product_history_timeline": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "category_management": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "stock_levels_view": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "low_stock_alerts": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "uom_converter": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "sku_limit": {
    "solo": "500",
    "starter": "5000",
    "core": "25000",
    "scale": "250000",
    "trial": "25000",
    "ltd_1": "5000",
    "ltd_2": "25000",
    "ltd_3": "50000"
  },
  "staff_limit": {
    "solo": "1",
    "starter": "1",
    "core": "5",
    "scale": "25",
    "trial": "5",
    "ltd_1": "1",
    "ltd_2": "2",
    "ltd_3": "5"
  },
  "till_logins": {
    "solo": "2",
    "starter": null,
    "core": null,
    "scale": null,
    "trial": null,
    "ltd_1": null,
    "ltd_2": null,
    "ltd_3": null
  },
  "registers": {
    "solo": "1",
    "starter": "2",
    "core": "6",
    "scale": "20",
    "trial": "6",
    "ltd_1": "2",
    "ltd_2": "4",
    "ltd_3": "10"
  },
  "devices_per_seat": {
    "solo": "2",
    "starter": "3",
    "core": "3",
    "scale": "5",
    "trial": "3",
    "ltd_1": "3",
    "ltd_2": "3",
    "ltd_3": "3"
  },
  "visible_history_days": {
    "solo": "30",
    "starter": null,
    "core": null,
    "scale": null,
    "trial": null,
    "ltd_1": null,
    "ltd_2": null,
    "ltd_3": null
  },
  "transactions_per_month": {
    "solo": "100",
    "starter": null,
    "core": null,
    "scale": null,
    "trial": null,
    "ltd_1": null,
    "ltd_2": null,
    "ltd_3": null
  },
  "service_jobs_per_month": {
    "solo": "20",
    "starter": null,
    "core": null,
    "scale": null,
    "trial": null,
    "ltd_1": null,
    "ltd_2": null,
    "ltd_3": null
  },
  "multi_branch": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "0",
    "ltd_1": "0",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "woocommerce": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "0",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "1"
  },
  "amazon_sync": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "0",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "1"
  },
  "ebay_sync": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "0",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "1"
  },
  "tiktok_sync": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "0",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "1"
  },
  "woocommerce_customer_reg": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "0",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "1"
  },
  "woocommerce_stock_sync": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "0",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "1"
  },
  "woocommerce_orders_bridge": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "0",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "1"
  },
  "web_catalog_toggles": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "api_access": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "0"
  },
  "webhooks": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "0"
  },
  "api_webhooks": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "0"
  },
  "white_label": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "0",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "0"
  },
  "network_basic": {
    "solo": "0",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "network_unlimited": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "0"
  },
  "consolidated_reporting": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "0",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "0"
  },
  "double_entry_ledger": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "cash_account_reconciliation": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "loan_ledger": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "inter_register_transfers": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "advance_allocation": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "debit_credit_notes": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "tax_summary_engine": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "expense_manager": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "charity_engine": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "petty_cash": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "fixed_asset_depreciation": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "fiscal_year_closing": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "bank_reconciliation": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "e_invoicing": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "fund_management": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "google_drive_backup": {
    "solo": "0",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "adviser_seat": {
    "solo": "0",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "reports": {
    "solo": "basic",
    "starter": "advanced",
    "core": "advanced",
    "scale": "advanced",
    "trial": "advanced",
    "ltd_1": "advanced",
    "ltd_2": "advanced",
    "ltd_3": "advanced"
  },
  "report_sales_records": {
    "solo": "0",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_purchase_records": {
    "solo": "0",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_stock_records": {
    "solo": "0",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_stock_valuation": {
    "solo": "0",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_profit_loss": {
    "solo": "0",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_cash_flow": {
    "solo": "0",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_expenses": {
    "solo": "0",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_tax": {
    "solo": "0",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_day_book": {
    "solo": "0",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_party_records": {
    "solo": "0",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_sales_analytics": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_profitability": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_discounts": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_aging": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_balance_sheet": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_expense_analysis": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_party_insights": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "owners_daily_pulse": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "report_ledger": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "1"
  },
  "report_point_in_time": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "1"
  },
  "report_cross_party": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "1"
  },
  "report_loans": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "1"
  },
  "report_export": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "1"
  },
  "ai_assistant": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "smart_capture": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "hypersearch_byok": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "ai_credits_monthly": {
    "solo": "100",
    "starter": "500",
    "core": "2000",
    "scale": "10000",
    "trial": "2000",
    "ltd_1": "500",
    "ltd_2": "2000",
    "ltd_3": "10000"
  },
  "ai_scans_monthly": {
    "solo": "10",
    "starter": null,
    "core": null,
    "scale": null,
    "trial": null,
    "ltd_1": null,
    "ltd_2": null,
    "ltd_3": null
  },
  "ai_system_builder": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "growth_engine": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "0"
  },
  "growth_signals": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "0"
  },
  "bulk_upload": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "live_chat_widget": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "services": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "service_jobs": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "service_contracts": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "optical_prescription": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "tailor_measurements": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "jewelry_metal_rates": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "work_orders": {
    "solo": "1",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "chat_support": {
    "solo": "0",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "dedicated_account_manager": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "1",
    "trial": "0",
    "ltd_1": "0",
    "ltd_2": "0",
    "ltd_3": "1"
  },
  "recurring_invoicing": {
    "solo": "1",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "vensync_command": {
    "solo": "0",
    "starter": "0",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "0",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "whatsapp_reminders": {
    "solo": "0",
    "starter": "1",
    "core": "1",
    "scale": "1",
    "trial": "1",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  },
  "ltd": {
    "solo": "0",
    "starter": "0",
    "core": "0",
    "scale": "0",
    "trial": "0",
    "ltd_1": "1",
    "ltd_2": "1",
    "ltd_3": "1"
  }
};
const getFeatureDefault = (featureKey, planSlug) => {
  let baseSlug = normalizePlan(planSlug);
  if (baseSlug === "ltd_1") baseSlug = "starter";
  else if (baseSlug === "ltd_2") baseSlug = "core";
  else if (baseSlug === "ltd_3") baseSlug = "scale";
  if (["ltd_1", "ltd_2", "ltd_3"].includes(planSlug) && featureKey === "transactions_per_month") {
    return null;
  }
  return FEATURE_DEFAULTS[featureKey]?.[baseSlug] ?? FEATURE_DEFAULTS[featureKey]?.[planSlug] ?? null;
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
  if (feature.type === "system" || feature.readOnly) {
    return /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }, children: /* @__PURE__ */ jsx(
      "span",
      {
        title: "System Infrastructure Gate (Protected)",
        style: {
          fontSize: 10,
          color: vq.slate[500],
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "3px 8px",
          borderRadius: 6,
          fontWeight: 700,
          fontFamily: "monospace"
        },
        children: "SYS"
      }
    ) });
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
  const { vensynq_enabled, canonical_keys } = usePage().props;
  const vensynqKeys = [
    "vensync_command",
    "marketplace_oauth",
    "commission_isolation",
    "dropshipping",
    "jit_procurement",
    "bulk_tracking_sync",
    "multichannel_expense_alloc"
  ];
  const existingKeys = new Set(FEATURE_GROUPS.flatMap((g) => g.features.map((f) => f.key)));
  const ungroupedKeys = (canonical_keys || []).filter((k) => !existingKeys.has(k));
  const allGroups = [...FEATURE_GROUPS];
  if (ungroupedKeys.length > 0) {
    allGroups.push({
      id: "ungrouped_new",
      label: "Ungrouped / New Features",
      emoji: "📦",
      description: "Canonical features detected from plan matrix that are pending categorization",
      features: ungroupedKeys.map((k) => ({
        key: k,
        label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        type: k.includes("limit") || k.includes("count") || k.includes("days") || k.includes("seats") || k.includes("registers") || k.includes("locations") || k.includes("credits") || k.includes("jobs") ? "number" : "boolean",
        note: "Auto-detected from canonical plan matrix"
      }))
    });
  }
  const filteredGroups = allGroups.map((group) => {
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
      (g) => g.features.filter((f) => f.type === "boolean" && f.type !== "system" && !f.system && !f.readOnly).map((f) => f.key)
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
  }, [plans, filteredGroups]);
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 0, position: "relative" }, children: [
    /* @__PURE__ */ jsxs("div", { style: {
      margin: "0 0 16px 0",
      padding: "12px 18px",
      background: "rgba(11, 170, 143, 0.08)",
      border: "1px solid rgba(11, 170, 143, 0.25)",
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      gap: 12,
      color: "#0BAA8F",
      fontSize: 12,
      fontWeight: 600
    }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: 16 }, children: "📊" }),
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Universal Reports (V11 §1.1):" }),
        " All 23 business, audit, and analytical reports are universal and included on every plan. Individual per-report gating has been deprecated."
      ] })
    ] }),
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
              background: "linear-gradient(to right, rgb(var(--vq-indigo-500)), rgb(var(--vq-violet-500)))",
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
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom, rgb(var(--vq-indigo-500)), rgb(var(--vq-violet-500)))" } }),
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
                  /* @__PURE__ */ jsx("div", { style: { width: 8, height: 8, borderRadius: "50%", background: plan.is_active ? vq.emerald[500] : vq.slate[500], boxShadow: plan.is_active ? "0 0 8px rgb(var(--vq-emerald-500))" : "none", flexShrink: 0 } }),
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
  background: "linear-gradient(135deg, rgb(var(--vq-indigo-500)), rgb(var(--vq-violet-500)))",
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

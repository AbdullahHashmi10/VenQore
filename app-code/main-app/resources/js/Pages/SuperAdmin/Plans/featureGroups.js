/**
 * VenQore Feature Matrix — Complete 240+ Feature Definitions
 *
 * Groups map to the 9 sections of VENQORE_FEATURE_SPECTRUM.md
 * plus 2 extra groups for AI extras and Live Chat (from pricing files).
 *
 * Feature types:
 *   boolean — toggle on / off per plan
 *   number  — numeric limit (blank = unlimited)
 *   select  — choose from a fixed set of string values
 *
 * Keys MUST match the string used in PlanGate::check() / Tenant::getLimit()
 * when you add server-side enforcement. Infrastructure features (always-on)
 * are still listed so you have a complete audit-ready record.
 */

export const FEATURE_GROUPS = [

    // ────────────────────────────────────────────────────────────────────────
    // Part 1 — Onboarding, Setup & First Impression  (Features 1–20)
    // ────────────────────────────────────────────────────────────────────────
    {
        id: 'onboarding', emoji: '🚀', label: 'Onboarding & First Impression',
        description: 'Landing page, trial, instant setup, and platform presence features.',
        features: [
            { key: 'demo_store',              label: '#1 · Interactive Demo Store',            type: 'boolean', note: 'One-click demo launch from landing page' },
            { key: 'free_trial_days',         label: '#2 · Free Trial Days',                   type: 'number',  note: 'Blank = no trial; 14 = two-week trial' },
            { key: 'instant_store_creator',   label: '#3 · Instant Store Creator (Name Only)', type: 'boolean', note: 'Infrastructure — normally always enabled' },
            { key: 'industry_seeding',        label: '#4 · Smart Industry Archetype Seeding',  type: 'boolean' },
            { key: 'dark_theme',              label: '#5 · "Midnight Nebula" Dark Theme',       type: 'boolean' },
            { key: 'light_theme',             label: '#6 · Harmonious Light Theme',            type: 'boolean' },
            { key: 'multi_store_hub',         label: '#7 · Multi-Store Hub Dashboard',         type: 'boolean' },
            { key: 'multi_store_roles',       label: '#8 · Granular Multi-Store User Roles',   type: 'boolean' },
            { key: 'cashier_pin_login',       label: '#9 · Instant Cashier PIN Login',         type: 'boolean' },
            { key: 'device_adaptive',         label: '#10 · Device-Adaptive Layouts',          type: 'boolean' },
            { key: 'pwa_install',             label: '#11 · Web App / PWA Install',            type: 'boolean' },
            { key: 'guided_setup_tour',       label: '#12 · Self-Guiding Setup Tour',          type: 'boolean' },
            { key: 'coupon_stacking',         label: '#13 · Flexible Coupon Code Stacking',    type: 'boolean' },
            { key: 'platform_status_badge',   label: '#14 · Platform Live Status Badge',       type: 'boolean' },
            { key: 'system_cache_refresher',  label: '#15 · System Cache Refresher',           type: 'boolean' },
            { key: 'owner_profile_card',      label: '#16 · Owner Profile Card',               type: 'boolean' },
            { key: 'one_click_system_wipe',   label: '#17 · One-Click System Wipe',            type: 'boolean' },
            { key: 'smtp_mail',               label: '#18 · Custom SMTP Mail Server',          type: 'boolean' },
            { key: 'sms_gateway',             label: '#19 · SMS Gateway Integrations',         type: 'boolean' },
            { key: 'security_activity_log',   label: '#20 · Security Activity Log',            type: 'boolean' },
        ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // Part 2 — POS Supercharged Checkout  (Features 21–55)
    // ────────────────────────────────────────────────────────────────────────
    {
        id: 'pos', emoji: '🛒', label: 'POS & Supercharged Checkout',
        description: 'Checkout terminal, scanner, printing, and payment features.',
        features: [
            { key: 'barcode_scanner',            label: '#21 · Instant Barcode Scanner Integration',     type: 'boolean' },
            { key: 'imei_scanner',               label: '#22 · Unique Serial & IMEI Scanner',            type: 'boolean' },
            { key: 'keyboard_hotkeys',           label: '#23 · High-Speed Keyboard-First Checkout',      type: 'boolean' },
            { key: 'senior_mode',                label: '#24 · Accessibility "Senior Mode" Toggle',      type: 'boolean' },
            { key: 'high_contrast_colors',       label: '#25 · High-Contrast Price/Qty Color Coding',    type: 'boolean' },
            { key: 'profit_peek',                label: '#26 · Secret Owner "Profit Peek" Swipe',        type: 'boolean' },
            { key: 'cart_tabs_limit',            label: '#27 · Multi-Tab Customer Checkout',             type: 'number',  note: 'Max parallel cart tabs (blank = unlimited)' },
            { key: 'park_recall',                label: '#28 · Park & Recall (Hold Bill)',               type: 'boolean' },
            { key: 'inflight_product_creation',  label: '#29 · In-Flight Product Creation',              type: 'boolean' },
            { key: 'cart_session_protection',    label: '#30 · Cart Rescue & Session Protection',        type: 'boolean' },
            { key: 'contextual_qty_modifiers',   label: '#31 · Contextual Quantity Modifiers',           type: 'boolean' },
            { key: 'auto_customer_discounts',    label: '#32 · Auto-Applying Customer Discounts',        type: 'boolean' },
            { key: 'fuzzy_product_finder',       label: '#33 · Typo Fuzzy Finder (Product Search)',      type: 'boolean' },
            { key: 'auto_cash_rounding',         label: '#34 · Automatic Cash Rounding',                 type: 'boolean' },
            { key: 'split_payments',             label: '#35 · Multi-Account Split Payments',            type: 'boolean' },
            { key: 'daily_cash_audit',           label: '#36 · Daily Cash Register Audit',               type: 'boolean' },
            { key: 'silent_webusb_printing',     label: '#37 · Silent WebUSB Thermal Printing',          type: 'boolean' },
            { key: 'receipt_cutline_padding',    label: '#38 · Receipt Cut-Line Padding',                type: 'boolean' },
            { key: 'custom_thermal_widths',      label: '#39 · Custom Thermal Roll Widths (80/58mm)',    type: 'boolean' },
            { key: 'dynamic_accent_colors',      label: '#40 · Dynamic Accent Colors on Docs',           type: 'boolean' },
            { key: 'invoice_column_toggles',     label: '#41 · Column Toggles on Invoices',              type: 'boolean' },
            { key: 'amount_to_words',            label: '#42 · Dynamic Amount-to-Words Translation',     type: 'boolean' },
            { key: 'receipt_qr_code',            label: '#43 · Verification QR Code Generation',         type: 'boolean' },
            { key: 'branded_receipt_sync',       label: '#44 · Branded Receipt Sync (Logo/Header)',      type: 'boolean' },
            { key: 'auto_assembly_checkout',     label: '#45 · Auto-Assembly Composite Items at POS',    type: 'boolean' },
            { key: 'pos_negative_stock_alert',   label: '#46 · POS Negative Stock Alert Badge',          type: 'boolean' },
            { key: 'negative_stock_lock',        label: '#47 · Negative Stock Sales Lock',               type: 'boolean' },
            { key: 'service_fee_additions',      label: '#48 · Dynamic Service Fee Additions',           type: 'boolean' },
            { key: 'auto_vat_gst',               label: '#49 · Automatic VAT/GST Calculations',          type: 'boolean' },
            { key: 'custom_charge_toggle',       label: '#50 · Quick Custom Charge Toggle',              type: 'boolean' },
            { key: 'fuzzy_customer_lookup',      label: '#51 · Fuzzy Customer Name Lookup',              type: 'boolean' },
            { key: 'recent_invoices_panel',      label: '#52 · Recent Invoices List (Last 50)',           type: 'boolean' },
            { key: 'cashier_change_helper',      label: '#53 · Cashier Change Helper',                   type: 'boolean' },
            { key: 'barcode_label_print',        label: '#54 · Barcode Label Printing Factory',          type: 'boolean' },
            { key: 'label_qr_codes',             label: '#55 · Dynamic Label QR Codes',                  type: 'boolean' },
        ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // Part 3 — Invoicing, Customer Khata & Receivables  (Features 56–90)
    // ────────────────────────────────────────────────────────────────────────
    {
        id: 'invoicing', emoji: '🧾', label: 'Invoicing, Khata & Receivables',
        description: 'Customer credit tracking, invoicing, loyalty, and debt collection.',
        features: [
            { key: 'customer_khata',             label: '#56 · Customer Credit Registry (Khata)',        type: 'boolean' },
            { key: 'customer_payments_log',      label: '#57 · Customer Payments Log',                   type: 'boolean' },
            { key: 'customer_statements',        label: '#58 · Customer Statement Generator (PDF)',       type: 'boolean' },
            { key: 'aged_receivables',           label: '#59 · Aged Receivables / Sales Aging Report',   type: 'boolean' },
            { key: 'whatsapp_reminders',         label: '#60 · Dynamic WhatsApp Debt Reminders',         type: 'boolean' },
            { key: 'sms_debt_alerts',            label: '#61 · Frictionless SMS Debt Alerts',            type: 'boolean' },
            { key: 'credit_limit_rules',         label: '#62 · Credit Limit Rules',                      type: 'boolean' },
            { key: 'multi_payment_invoices',     label: '#63 · Multi-Payment Invoices (Partial)',        type: 'boolean' },
            { key: 'customer_payment_alloc',     label: '#64 · Customer Payment Allocations',            type: 'boolean' },
            { key: 'anniversary_tracker',        label: '#65 · Customer Birth & Anniversary Tracker',    type: 'boolean' },
            { key: 'customer_ltv_score',         label: '#66 · Customer Lifetime Value Score',           type: 'boolean' },
            { key: 'customer_wallet',            label: '#67 · Customer Wallet Credit',                  type: 'boolean' },
            { key: 'loyalty_points',             label: '#68 · Loyalty Points System',                   type: 'boolean' },
            { key: 'digital_gift_cards',         label: '#69 · Digital Gift Cards',                      type: 'boolean' },
            { key: 'wholesale_pricing',          label: '#70 · Wholesale vs Retail Pricing Tiers',       type: 'boolean' },
            { key: 'b2b_proposal_builder',       label: '#71 · B2B Proposal Builder',                    type: 'boolean' },
            { key: 'quotation_conversion',       label: '#72 · One-Click Quotation Conversion',          type: 'boolean' },
            { key: 'inflight_session_recovery',  label: '#73 · In-Flight Session Recovery',              type: 'boolean' },
            { key: 'tax_inclusive_exclusive',    label: '#74 · Invoiced Tax Inclusive/Exclusive Toggle', type: 'boolean' },
            { key: 'b2b_margin_displayer',       label: '#75 · B2B Invoice Margin Displayer',            type: 'boolean' },
            { key: 'sales_return_vouchers',      label: '#76 · Sales Return Vouchers',                   type: 'boolean' },
            { key: 'b2b_invoice_designer',       label: '#77 · Interactive B2B Invoice Designer',        type: 'boolean' },
            { key: 'pre_sales_reservation',      label: '#78 · Pre-Sales Reservation Mode',              type: 'boolean' },
            { key: 'recurring_invoicing',        label: '#79 · Automated Recurring Invoicing',           type: 'boolean' },
            { key: 'refund_reason_analysis',     label: '#80 · Refund Reason Analysis',                  type: 'boolean' },
            { key: 'tax_exempt_customers',       label: '#81 · Tax-Exempt Customer Toggles',             type: 'boolean' },
            { key: 'customer_address_book',      label: '#82 · Customer Address Book',                   type: 'boolean' },
            { key: 'a4_invoice_pdf',             label: '#83 · A4 Corporate Invoice Export',             type: 'boolean' },
            { key: 'letter_size_invoice',        label: '#84 · Letter-Size Invoice Format',              type: 'boolean' },
            { key: 'outstanding_balance_grid',   label: '#85 · Detailed Outstanding Balance Grid',       type: 'boolean' },
            { key: 'payment_due_dates',          label: '#86 · Customer Payment Due Dates',              type: 'boolean' },
            { key: 'overdue_highlights',         label: '#87 · Overdue Customer Highlights (Red)',       type: 'boolean' },
            { key: 'lump_sum_payments',          label: '#88 · Lump-Sum Customer Payments',              type: 'boolean' },
            { key: 'partial_payment_indicator',  label: '#89 · Partial Payment Indicator Badge',         type: 'boolean' },
            { key: 'unified_party_ledger',       label: '#90 · Unified Party Ledger',                    type: 'boolean' },
        ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // Part 4 — Procurement, Suppliers & Payables  (Features 91–115)
    // ────────────────────────────────────────────────────────────────────────
    {
        id: 'procurement', emoji: '📦', label: 'Procurement & Suppliers',
        description: 'Vendor management, purchase orders, payables, and supplier tracking.',
        features: [
            { key: 'supplier_khata',             label: '#91 · Supplier Credit Register (Khata)',        type: 'boolean' },
            { key: 'delayed_supplier_payments',  label: '#92 · Delayed Supplier Payments',               type: 'boolean' },
            { key: 'supplier_statements',        label: '#93 · Supplier Statement Generator (PDF)',       type: 'boolean' },
            { key: 'aged_payables',              label: '#94 · Aged Payables Directory',                 type: 'boolean' },
            { key: 'installment_payments',       label: '#95 · Installment Payments Log',                type: 'boolean' },
            { key: 'purchase_orders',            label: '#96 · Purchase Orders (POs) Tracker',           type: 'boolean' },
            { key: 'partial_shipments',          label: '#97 · Partial Shipments Intake',                type: 'boolean' },
            { key: 'supplier_debit_notes',       label: '#98 · Supplier Debit Notes',                    type: 'boolean' },
            { key: 'auto_cost_adjuster',         label: '#99 · Automated Cost Price Adjuster',           type: 'boolean' },
            { key: 'cost_price_fluctuator',      label: '#100 · Cost Price Fluctuator Alert',            type: 'boolean' },
            { key: 'supplier_lead_time',         label: '#101 · Supplier Lead Time Tracker',             type: 'boolean' },
            { key: 'landing_costs',              label: '#102 · Landing Cost Allocations',               type: 'boolean' },
            { key: 'suppliers_directory',        label: '#103 · Suppliers Directory',                    type: 'boolean' },
            { key: 'supplier_sku_mapping',       label: '#104 · Supplier SKU Mapping',                   type: 'boolean' },
            { key: 'inbound_expiry_tracking',    label: '#105 · Inbound Expiry Date Tracking',           type: 'boolean' },
            { key: 'purchase_returns',           label: '#106 · Purchase Returns Register',              type: 'boolean' },
            { key: 'auto_po_generation',         label: '#107 · Auto-Generating Purchase Orders',        type: 'boolean' },
            { key: 'bulk_supplier_payments',     label: '#108 · Bulk Supplier Payments',                 type: 'boolean' },
            { key: 'payables_grid',              label: '#109 · Outstanding Payables Grid',              type: 'boolean' },
            { key: 'reconciled_bank_payments',   label: '#110 · Reconciled Bank Payments',               type: 'boolean' },
            { key: 'tax_inclusive_procurement',  label: '#111 · Tax-Inclusive Procurement Toggle',       type: 'boolean' },
            { key: 'supplier_outstanding_alerts',label: '#112 · Supplier Outstanding Alerts',            type: 'boolean' },
            { key: 'supplier_refund_tracker',    label: '#113 · Supplier Refund Tracker',                type: 'boolean' },
            { key: 'custom_payment_terms',       label: '#114 · Custom Supplier Payment Terms',          type: 'boolean' },
            { key: 'purchase_pdf_upload',        label: '#115 · Purchase Invoice PDF Importer',          type: 'boolean' },
        ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // Part 5 — Inventory, Barcode & Multi-Warehouse  (Features 116–135)
    // ────────────────────────────────────────────────────────────────────────
    {
        id: 'inventory', emoji: '🏭', label: 'Inventory & Multi-Warehouse',
        description: 'Stock management, batches, variants, BOM, and warehouse isolation.',
        features: [
            { key: 'locations',                  label: '#116 · Multi-Warehouse Isolation',              type: 'number',  note: 'Number of warehouses allowed (blank = unlimited)' },
            { key: 'stock_transfer',             label: '#117 · Stock Transfer Vouchers',                type: 'boolean' },
            { key: 'product_variants',           label: '#118 · Product Variant Support',                type: 'boolean' },
            { key: 'fifo_costing',               label: '#119 · Variant-Aware FIFO Costing',             type: 'boolean' },
            { key: 'barcode_label_factory',      label: '#120 · Barcode Label Print Factory (Inventory)',type: 'boolean' },
            { key: 'batch_tracking',             label: '#121 · Batch Intake Numbers Tracker',           type: 'boolean' },
            { key: 'batch_expiry',               label: '#122 · Batch Expiry Warnings',                  type: 'boolean' },
            { key: 'stock_take_audit',           label: '#123 · Stock Take Audit Wizard',                type: 'boolean' },
            { key: 'disaster_claim',             label: '#124 · Disaster Claim Asset Manager',           type: 'boolean' },
            { key: 'bill_of_materials',          label: '#125 · Bill of Materials (BOM) Recipes',        type: 'boolean' },
            { key: 'auto_assembly_logic',        label: '#126 · "Garam Masala" Auto-Assembly Logic',     type: 'boolean' },
            { key: 'production_simulator',       label: '#127 · Production Run Simulator',               type: 'boolean' },
            { key: 'recipe_history_archival',    label: '#128 · Recipe History Archival',                type: 'boolean' },
            { key: 'product_history_timeline',   label: '#129 · Product History Timeline',               type: 'boolean' },
            { key: 'category_management',        label: '#130 · Category Management Center',             type: 'boolean' },
            { key: 'stock_levels_view',          label: '#131 · Stock Levels View Dashboard',            type: 'boolean' },
            { key: 'low_stock_alerts',           label: '#132 · Low Stock Threshold Alert',              type: 'boolean' },
            { key: 'imei_lifecycle',             label: '#133 · IMEI Lifecycle Tracking',                type: 'boolean' },
            { key: 'uom_converter',              label: '#134 · Unit of Measure (UOM) Converter',        type: 'boolean' },
            { key: 'sku_limit',                  label: 'SKU / Product Limit',                          type: 'number',  note: 'Max products (blank = unlimited)' },
        ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // Part 6 — E-Commerce Sync, WooCommerce & VenSynQ  (Features 136–147)
    // ────────────────────────────────────────────────────────────────────────
    {
        id: 'ecommerce', emoji: '🔄', label: 'E-Commerce & VenSynQ',
        description: 'WooCommerce webhook sync, marketplace connectors, and dropshipping.',
        features: [
            { key: 'vensync_command',            label: '#136 · VenSynQ Command Center',                 type: 'boolean' },
            { key: 'marketplace_oauth',          label: '#137 · 3-Click OAuth Connection',               type: 'boolean' },
            { key: 'commission_isolation',       label: '#138 · Automated Commission Isolation',          type: 'boolean' },
            { key: 'dropshipping',               label: '#139 · Dropshipping Order Automator',           type: 'boolean' },
            { key: 'jit_procurement',            label: '#140 · Just-in-Time (JIT) Procurement Drafts',  type: 'boolean' },
            { key: 'bulk_tracking_sync',         label: '#141 · Bulk Tracking ID Sync',                  type: 'boolean' },
            { key: 'multichannel_expense_alloc', label: '#142 · Multi-Channel Expense Allocations',      type: 'boolean' },
            { key: 'woocommerce',                label: '#143 · WooCommerce Real-Time Webhook',           type: 'boolean' },
            { key: 'woocommerce_customer_reg',   label: '#144 · WooCommerce Customer Auto-Registry',     type: 'boolean' },
            { key: 'woocommerce_stock_sync',     label: '#145 · WooCommerce Stock Synchronization',      type: 'boolean' },
            { key: 'woocommerce_orders_bridge',  label: '#146 · Dynamic Orders Bridge (WooCommerce)',    type: 'boolean' },
            { key: 'web_catalog_toggles',        label: '#147 · Web Store Catalog Toggles',              type: 'boolean' },
        ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // Part 7 — Double-Entry Accounting & Cash Registers  (Features 148–160)
    // ────────────────────────────────────────────────────────────────────────
    {
        id: 'accounting', emoji: '🏦', label: 'Double-Entry Accounting & Finance',
        description: 'Ledger engine, bank reconciliation, depreciation, and fiscal controls.',
        features: [
            { key: 'double_entry_ledger',        label: '#148 · Double-Entry Journal Ledger Engine',     type: 'boolean' },
            { key: 'cash_account_reconciliation',label: '#149 · Automated Cash Account Reconciliation',  type: 'boolean' },
            { key: 'fixed_asset_depreciation',   label: '#150 · Fixed Asset Depreciation Tracker',       type: 'boolean' },
            { key: 'loan_ledger',                label: '#151 · Business Loan Principal & Interest',      type: 'boolean' },
            { key: 'inter_register_transfers',   label: '#152 · Inter-Register Cash Transfer Logs',      type: 'boolean' },
            { key: 'advance_allocation',         label: '#153 · Supplier & Customer Advance Allocation', type: 'boolean' },
            { key: 'fiscal_year_closing',        label: '#154 · Fiscal Year Closing Wizard',             type: 'boolean' },
            { key: 'debit_credit_notes',         label: '#155 · Debit & Credit Note Registers',          type: 'boolean' },
            { key: 'bank_reconciliation',        label: '#156 · Bank Reconciliation Truth Checker',      type: 'boolean' },
            { key: 'tax_summary_engine',         label: '#157 · Tax Summary Engine',                     type: 'boolean' },
            { key: 'expense_manager',            label: '#158 · Expense Manager with Receipt Uploads',   type: 'boolean' },
            { key: 'charity_engine',             label: '#159 · Charity Percentage Engine',              type: 'boolean' },
            { key: 'petty_cash',                 label: '#160 · Petty Cash Allocation Logs',             type: 'boolean' },
        ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // Part 8 — The Report Factory  (Features 161–200)
    // ────────────────────────────────────────────────────────────────────────
    {
        id: 'reports', emoji: '📊', label: 'Report Factory (40 Reports)',
        description: 'Complete 40-report suite — toggle individual reports per plan.',
        features: [
            { key: 'reports',                    label: 'Reports Access Level',                          type: 'select', options: ['basic', 'advanced', 'enterprise'] },
            { key: 'report_sales_summary',       label: '#161 · Sales Summary Report',                   type: 'boolean' },
            { key: 'report_daily_sales_trend',   label: '#162 · Daily Sales Trend',                      type: 'boolean' },
            { key: 'report_purchases',           label: '#163 · Purchases Report',                       type: 'boolean' },
            { key: 'report_day_book',            label: '#164 · Day Book Log',                           type: 'boolean' },
            { key: 'report_profit_loss',         label: '#165 · Profit & Loss Statement',                type: 'boolean' },
            { key: 'report_account_ledger',      label: '#166 · Account Ledger Report',                  type: 'boolean' },
            { key: 'report_party_statement',     label: '#167 · Party Statement (Khata Ledger)',         type: 'boolean' },
            { key: 'report_transactions_history',label: '#168 · Transactions History',                   type: 'boolean' },
            { key: 'report_stock_valuation',     label: '#169 · Stock Valuation Report',                 type: 'boolean' },
            { key: 'report_low_stock',           label: '#170 · Low Stock Shortages Report',             type: 'boolean' },
            { key: 'report_stock_movement',      label: '#171 · Stock Movement History',                 type: 'boolean' },
            { key: 'report_expenses_directory',  label: '#172 · Expenses Directory',                     type: 'boolean' },
            { key: 'report_tax_compliance',      label: '#173 · Tax Compliance Summary',                 type: 'boolean' },
            { key: 'report_bank_statements',     label: '#174 · Bank Statements Log',                    type: 'boolean' },
            { key: 'report_expiring_soon',       label: '#175 · Expiring Soon Alert',                    type: 'boolean' },
            { key: 'report_balance_sheet',       label: '#176 · Balance Sheet',                          type: 'boolean' },
            { key: 'report_all_parties_credit',  label: '#177 · All Parties Credit Summary',             type: 'boolean' },
            { key: 'report_trial_balance',       label: '#178 · Double-Entry Trial Balance',             type: 'boolean' },
            { key: 'report_item_profit',         label: '#179 · Item-Wise Profit Analysis',              type: 'boolean' },
            { key: 'report_party_profitability', label: '#180 · Party-Wise Profitability',               type: 'boolean' },
            { key: 'report_general_discount',    label: '#181 · General Discount Report',                type: 'boolean' },
            { key: 'report_cash_flow',           label: '#182 · Cash Flow Statement',                    type: 'boolean' },
            { key: 'report_sales_aging',         label: '#183 · Sales Aging Report',                     type: 'boolean' },
            { key: 'report_sales_orders_status', label: '#184 · Sales Orders Status',                    type: 'boolean' },
            { key: 'report_bill_profitability',  label: '#185 · Bill-Wise Profitability',                type: 'boolean' },
            { key: 'report_expense_by_category', label: '#186 · Expense by Category',                   type: 'boolean' },
            { key: 'report_expense_by_item',     label: '#187 · Expense by Item',                        type: 'boolean' },
            { key: 'report_stock_by_category',   label: '#188 · Stock Summary by Category',             type: 'boolean' },
            { key: 'report_sales_by_party',      label: '#189 · Sales & Purchases by Party',             type: 'boolean' },
            { key: 'report_sales_by_category',   label: '#190 · Sales & Purchases by Category',         type: 'boolean' },
            { key: 'report_category_pl',         label: '#191 · Category Profit & Loss',                 type: 'boolean' },
            { key: 'report_item_discounting',    label: '#192 · Item-Wise Discounting',                  type: 'boolean' },
            { key: 'report_sales_order_items',   label: '#193 · Sales Order Items Detail',               type: 'boolean' },
            { key: 'report_stock_aging',         label: '#194 · Stock Aging Analysis',                   type: 'boolean' },
            { key: 'report_sales_party_group',   label: '#195 · Sales & Purchases by Party Group',      type: 'boolean' },
            { key: 'report_item_by_party',       label: '#196 · Item Report by Party',                   type: 'boolean' },
            { key: 'report_party_by_item',       label: '#197 · Party Report by Item',                   type: 'boolean' },
            { key: 'report_tax_rate_breakdown',  label: '#198 · Tax Rate Breakdown',                     type: 'boolean' },
            { key: 'report_graph_analytics',     label: '#199 · Graph Analytics Dashboard',              type: 'boolean' },
            { key: 'report_loan_statement',      label: '#200 · Loan Statement',                         type: 'boolean' },
            { key: 'point_in_time_inventory',    label: '#200.1 · Point-in-Time Inventory',              type: 'boolean' },
            { key: 'customer_insights',          label: '#200.2 · Customer Insights Report',             type: 'boolean' },
            { key: 'supplier_insights',          label: '#200.3 · Supplier Insights Report',             type: 'boolean' },
        ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // Part 9 — AI Bubble & Platform HQ Command  (Features 201–226)
    // ────────────────────────────────────────────────────────────────────────
    {
        id: 'platform_hq', emoji: '🌌', label: 'Platform HQ & Infrastructure',
        description: 'Multi-tenant isolation, SuperAdmin controls, AI assistant, and enforcement gates.',
        features: [
            { key: 'ai_assistant',               label: '#201 · Floating AI Assistant (AI Bubble)',      type: 'boolean' },
            { key: 'multitenant_isolation',       label: '#202 · Path-Based URL Multi-Tenant Isolation', type: 'boolean', note: 'Infrastructure — always enabled' },
            { key: 'three_zone_security',         label: '#203 · Three-Zone Security Boundaries',        type: 'boolean', note: 'Infrastructure — always enabled' },
            { key: 'superadmin_command_center',   label: '#204 · SuperAdmin Command Center',             type: 'boolean' },
            { key: 'subscription_enforcement',    label: '#205 · Subscription Limit Enforcement',        type: 'boolean', note: 'Infrastructure — always enabled' },
            { key: 'redis_plan_gates',            label: '#206 · Redis-Cached Plan Gates',               type: 'boolean' },
            { key: 'limit_override_manager',      label: '#207 · Automated Limit Override Manager',      type: 'boolean' },
            { key: 'invitation_codes',            label: '#208 · Alphanumeric Invitation Codes',          type: 'boolean' },
            { key: 'demo_sandbox_cloner',         label: '#209 · Ephemeral Demo Sandbox Cloner',         type: 'boolean' },
            { key: 'sandbox_time_shift',          label: '#210 · Sandbox Time-Shift Engine',             type: 'boolean' },
            { key: 'sandbox_expiration',          label: '#211 · Sandbox Expiration Logic',              type: 'boolean' },
            { key: 'soft_delete_trash',           label: '#212 · Soft-Delete Trash Management',          type: 'boolean' },
            { key: 'immutable_db_locks',          label: '#213 · Immutable Database Locks',              type: 'boolean', note: 'Infrastructure — always enabled' },
            { key: 'balanced_reversals',          label: '#214 · Balanced Transaction Reversals',        type: 'boolean', note: 'Infrastructure — always enabled' },
            { key: 'double_entry_account_maps',   label: '#215 · Double-Entry Account Maps',             type: 'boolean', note: 'Infrastructure — always enabled' },
            { key: 'custom_tax_rates',            label: '#216 · Custom Tax Rate Configurator',          type: 'boolean' },
            { key: 'customer_credit_limits_cfg',  label: '#217 · Customer Credit Limits (Config)',       type: 'boolean' },
            { key: 'low_stock_threshold_cfg',     label: '#218 · Low Stock Alerts Threshold (Config)',   type: 'boolean' },
            { key: 'cashier_inactivity_logout',   label: '#219 · Cashier Inactivity Auto-Logout',        type: 'boolean' },
            { key: 'passcode_security_controls',  label: '#220 · Passcode Security Controls',            type: 'boolean' },
            { key: 'stock_reservation_rules',     label: '#221 · Stock Reservation Rules',               type: 'boolean' },
            { key: 'barcode_pattern_recognition', label: '#222 · Barcode Pattern Recognition',           type: 'boolean' },
            { key: 'auto_assembly_recipes',       label: '#223 · Auto-Assembly Cookbook Recipes',        type: 'boolean' },
            { key: 'multi_currency',              label: '#224 · Multi-Currency Format Configurations',  type: 'boolean' },
            { key: 'module_toggles',              label: '#225 · Glass Door Module Toggles',             type: 'boolean' },
            { key: 'hard_lock_negative_stock',    label: '#226 · Hard-Lock Negative Stock Settings',     type: 'boolean' },
            // Core numeric limits
            { key: 'transactions_per_month',      label: 'Transactions / Month',                         type: 'number',  note: 'blank = unlimited' },
            { key: 'staff_limit',                 label: 'Staff Accounts',                               type: 'number',  note: 'blank = unlimited' },
            { key: 'multi_branch',                label: 'Multi-Branch Locations',                       type: 'number',  note: '0 = disabled; blank = unlimited' },
            { key: 'api_access',                  label: 'Public REST API Access',                       type: 'boolean' },
        ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // Part 10 — AI & Automation Extras  (from Pricing Files)
    // ────────────────────────────────────────────────────────────────────────
    {
        id: 'ai_extras', emoji: '🤖', label: 'AI & Automation Extras',
        description: 'HyperSearch, SmartCapture, Growth Engine, and AI-powered automation features.',
        features: [
            { key: 'hypersearch_byok',           label: 'HyperSearch BYOK (Bring Your Own API Key)',     type: 'boolean', note: 'Free AI search using own OpenAI/Gemini key' },
            { key: 'smart_capture',              label: 'SmartCapture (AI Invoice Scan)',                type: 'boolean', note: 'Photo/image/audio → data entry' },
            { key: 'smart_capture_limit',        label: 'SmartCapture Scans / Month',                   type: 'number' },
            { key: 'growth_engine',              label: 'Growth Engine (AI Retention Rules)',            type: 'boolean' },
            { key: 'ai_churn_predictions',       label: 'AI Churn Predictions',                         type: 'boolean' },
            { key: 'ai_revenue_forecasting',     label: 'AI Revenue Forecasting',                       type: 'boolean' },
            { key: 'ai_outreach_copy',           label: 'AI WhatsApp Outreach Copy Generation',         type: 'boolean' },
            { key: 'ai_queries_limit',           label: 'AI Assistant Queries / Month',                 type: 'number' },
            { key: 'ai_outreach_limit',          label: 'AI Outreach Copies / Month',                   type: 'number' },
            { key: 'owners_daily_pulse',         label: "Owner's Daily Pulse Report",                   type: 'boolean', note: 'Digest-style daily business summary' },
        ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // Part 11 — Live Chat & Customer Engagement  (from Pricing Files)
    // ────────────────────────────────────────────────────────────────────────
    {
        id: 'live_chat', emoji: '💬', label: 'Live Chat & Customer Engagement',
        description: 'Embedded live chat widget, AI bot, agent handoff, and co-pilot suggestions.',
        features: [
            { key: 'live_chat_widget',           label: 'Live Chat Widget (Storefront)',                 type: 'boolean' },
            { key: 'ai_bot_handoff',             label: 'AI Bot → Human Agent Handoff',                 type: 'boolean' },
            { key: 'canned_responses',           label: 'Canned Responses Library',                     type: 'boolean' },
            { key: 'ai_copilot_suggestions',     label: 'AI Co-Pilot Suggestions (for Agents)',         type: 'boolean' },
            { key: 'passive_learning_engine',    label: 'Passive Learning Engine',                      type: 'boolean' },
            { key: 'agent_referral',             label: 'Agent-to-Agent Chat Referral',                 type: 'boolean' },
        ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // Part 12 — Support & Onboarding Perks  (from Pricing Files)
    // ────────────────────────────────────────────────────────────────────────
    {
        id: 'support_perks', emoji: '🎯', label: 'Support & Onboarding Perks',
        description: 'Premium support tiers, dedicated account manager, and white-glove onboarding.',
        features: [
            { key: 'dedicated_account_manager',  label: 'Dedicated Account Manager',                    type: 'boolean' },
            { key: 'white_glove_onboarding',     label: 'White-Glove Onboarding',                       type: 'boolean' },
            { key: 'white_label',                label: 'White Label / Custom Branding',                type: 'boolean' },
            { key: 'industry_templates_count',   label: 'Industry Pre-Made Templates',                  type: 'number',  note: 'Number of templates included (e.g. 16)' },
            { key: 'priority_support',           label: 'Priority Support Access',                      type: 'boolean' },
            { key: 'email_support',              label: 'Email Support',                                type: 'boolean' },
            { key: 'chat_support',               label: 'Chat Support',                                 type: 'boolean' },
            { key: 'phone_support',              label: 'Phone / Call Support',                         type: 'boolean' },
        ],
    },
];

/**
 * Total feature count helper — useful for displaying in the UI.
 */
export const TOTAL_FEATURES = FEATURE_GROUPS.reduce((acc, g) => acc + g.features.length, 0);

// ── FEATURE DEFAULTS AND RESOLVERS ──

export const FEATURE_DEFAULTS = {
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
    "point_in_time_inventory": {
        "trial": "0",
        "starter": "0",
        "growth": "1",
        "business": "1"
    },
    "customer_insights": {
        "trial": "0",
        "starter": "0",
        "growth": "1",
        "business": "1"
    },
    "supplier_insights": {
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
        "growth": "1",
        "business": "1"
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

/**
 * Resolves the default/allotted value for a feature and plan tier.
 * Matches Database/Seeders/PlanFeatureMatrixSeeder.php exactly.
 */
export const getFeatureDefault = (featureKey, planSlug) => {
    let baseSlug = planSlug;
    if (planSlug === 'ltd_1') baseSlug = 'starter';
    else if (planSlug === 'ltd_2') baseSlug = 'growth';
    else if (planSlug === 'ltd_3') baseSlug = 'business';

    // Specific transaction caps for LTD plans
    if (planSlug === 'ltd_1' && featureKey === 'transactions_per_month') return '500';
    if (planSlug === 'ltd_2' && featureKey === 'transactions_per_month') return '2000';
    if (planSlug === 'ltd_3' && featureKey === 'transactions_per_month') return '6000';

    return FEATURE_DEFAULTS[featureKey]?.[baseSlug] ?? null;
};

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { vq } from '@/theme/runtime';
import MarketingLayout, {
    RevealOnScroll, MagneticButton, SectionLabel
} from './Shared/MarketingLayout';
import {
    AlertTriangle, ArrowRight, BarChart3, Bot, Boxes, Brain, Calculator, Check,
    CheckCircle2, ChevronRight, Cpu, Factory, Gauge, Globe, Layers, Loader2, Lock,
    Mic, Minus, Package, Percent, Plus, Receipt, RefreshCw, Repeat, ScanBarcode,
    Search, ShieldCheck, ShoppingCart, Sparkles, Target, Trash2, TrendingDown,
    TrendingUp, Truck, Upload, Users, Wallet, Warehouse, X
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   VENQORE FEATURES — "See the whole machine."
   Live, simulated mini-apps of the real product (Reports, POS, Smart Capture,
   VenSynQ, Growth Engine, Cookbook) + a searchable catalog of every feature.
   Nothing here saves data — it's a guided simulation of the actual UI.
   ═══════════════════════════════════════════════════════════════════════════ */

/* The six live demos now live in Shared/FeatureDemos so the dedicated
   /features/{slug} deep-dive pages can render them too. */
import {
    usePRM, useInView, Num, DemoFrame, PillTabs,
    ProfitLossDemo, PosInvoiceDemo, SmartCaptureDemo,
    VenSynQDemo, GrowthEngineDemo, CookbookDemo,
} from './Shared/FeatureDemos';

/* ═══════════════════════════════════════════════════════════════════════════
   FULL FEATURE CATALOG — every capability, click any to read what it does
   (sourced from the VenQore Product Catalog)
   ═══════════════════════════════════════════════════════════════════════════ */
const FEATURE_CATS = [
    {
        key: 'start', label: 'Getting Started', icon: Gauge, color: 'indigo',
        items: [
            { n: 'One-Click Interactive Demo', d: 'Launch a fully pre-populated demo store from the landing page — test checkout, reports and dummy products with no account.' },
            { n: '14-Day Free Trial', d: 'Explore the full platform for 14 days with no credit card required.' },
            { n: 'Instant Store Creator', d: 'Start setup by entering only your store name — no servers or technical knowledge needed.' },
            { n: 'Smart Industry Seeding', d: 'Auto-imports standard units, tax settings and categories tailored to your industry (Retail, Grocery, F&B, Fashion, Hard Goods).' },
            { n: 'Dark Theme (Midnight Nebula)', d: 'Premium glassmorphic dark dashboard with amber accents — easy on cashiers’ eyes during long shifts.' },
            { n: 'Light Theme', d: 'Crisp, high-contrast layout designed for bright storefront environments.' },
            { n: 'Multi-Store Hub Dashboard', d: 'Central launchpad showing all branches with one-click switching between them.' },
            { n: 'Granular Multi-Store Roles', d: 'Be Owner in Store A, Manager in Store B and read-only Viewer in Store C — from one account.' },
            { n: 'Cashier PIN Login', d: 'Staff log in with a fast 4-digit PIN — no retyping email and password between shifts.' },
            { n: 'Progressive Web App (PWA)', d: 'Install VenQore on Windows, Android or iOS as a native-feeling app.' },
            { n: 'Self-Guiding Setup Tour', d: 'Interactive onboarding that highlights buttons and walks new staff through their first sale.' },
            { n: 'Coupon Code Upgrades', d: 'Apply, stack and upgrade license voucher codes to instantly unlock higher limits or store slots.' },
            { n: 'Hardware Status Badge', d: 'Live indicator showing whether thermal printers and payment hardware are connected and ready.' },
            { n: 'One-Click Cache Refresh', d: 'Instantly optimize local performance so every screen loads at full speed.' },
            { n: 'Owner Profile Card', d: 'See your active tier, remaining trial days and login details at a glance.' },
            { n: 'Test Data Wipe', d: 'Securely erase demo/test transactions while preserving tax rules, settings and staff accounts.' },
            { n: 'Security Activity Log', d: 'Traces staff IP addresses, login timestamps and locations for every sensitive action.' },
        ],
    },
    {
        key: 'pos', label: 'Point of Sale', icon: ShoppingCart, color: 'amber',
        items: [
            { n: 'Instant Barcode Scanner', d: 'Scan product tags to add items to the cart instantly — no mouse or keyboard.' },
            { n: 'Serial & IMEI Scanner', d: 'Prompts operators to scan device identifiers (phone IMEIs, appliance serials) at checkout.' },
            { n: 'Keyboard-First Checkout', d: 'F1 search, F2 quantity, F3 discount, F4 checkout — process whole queues without a mouse.' },
            { n: 'Senior Mode Accessibility', d: 'Increases font sizes by 40% with high-contrast, traffic-light colors for easier reading.' },
            { n: 'Color-Coded Price & Qty', d: 'Green pricing, blue quantities — prevents numerical confusion at a glance.' },
            { n: 'Owner Profit Peek', d: 'Drag down on the bill total to reveal the live profit margin of the active cart, hidden from the customer.' },
            { n: 'Multi-Tab Customer Checkout', d: 'Manage up to 10 active customer carts simultaneously, switchable via hotkeys.' },
            { n: 'Park & Recall (Hold Bill)', d: 'Put a cart on hold with a note (e.g. “Table 5”) while serving others, then recall it instantly.' },
            { n: 'In-Flight Product Creation', d: 'Add a new product to the catalog inside the checkout screen without losing the cart.' },
            { n: 'Cart Rescue & Session Protection', d: 'Active sales are saved to local memory — carts survive power cuts and browser crashes.' },
            { n: 'Auto-Applying Customer Discounts', d: 'Applies pre-negotiated discount agreements the moment a customer is selected.' },
            { n: 'Typo-Tolerant Search (OmniSearch)', d: 'Finds products even when the cashier misspells the name.' },
            { n: 'Automatic Cash Rounding', d: 'Rounds fractional change to the nearest valid denomination by local currency rules.' },
            { n: 'Multi-Account Split Payments', d: 'Accept any mix of Cash, Card, Bank Transfer and Store Credit in one transaction.' },
            { n: 'Daily Cash Register Audit', d: 'End-of-day cash-out wizard comparing the physical drawer against the system total.' },
            { n: 'Silent WebUSB Thermal Printing', d: 'Prints receipts directly to thermal hardware without browser popup dialogs.' },
            { n: 'Custom Thermal Roll Widths', d: 'Switch print templates between 80mm and 58mm thermal paper.' },
            { n: 'Receipt Cut-Line Padding', d: 'Adds blank lines so totals clear the paper cutter cleanly.' },
            { n: 'Dynamic Brand Colors on PDFs', d: 'Customize B2B invoice PDFs to match your corporate palette.' },
            { n: 'Print Column Toggles', d: 'Show/hide MRP, HSN codes, batch details, serials or savings by customer type.' },
            { n: 'Amount-to-Words Translation', d: 'Prints totals as written words (e.g. “Five Thousand Rupees Only”).' },
            { n: 'Tax Verification QR Codes', d: 'Embeds regional tax-compliance QR codes on printed receipts.' },
            { n: 'Branded Receipt Sync', d: 'Scales and positions store logos, headers and footer terms on all templates.' },
            { n: 'Auto-Deducting Composite Items', d: 'Selling a bundled/manufactured item deducts raw ingredients from stock in real time.' },
            { n: 'Negative Stock Alert & Lock', d: 'Warns — or hard-blocks — selling an item with empty inventory (configurable).' },
            { n: 'Service Fee & Freight Additions', d: 'Add delivery charges, assembly fees or service costs directly to invoices.' },
            { n: 'Automatic VAT / GST Calculation', d: 'Computes regional tax at the line-item level automatically — no cashier input.' },
            { n: 'Recent Invoices Panel', d: 'Shows the last 50 completed sales inside POS for quick refunds or reprints.' },
            { n: 'Cashier Change Calculator', d: 'Displays the exact change to hand back upon payment entry.' },
            { n: 'Barcode Label Print Factory', d: 'Design and print custom barcode stickers with name, logo, price and variant info.' },
            { n: 'Dynamic Label QR Codes', d: 'Embeds product QR codes on labels that link to your online storefront.' },
        ],
    },
    {
        key: 'receivables', label: 'Invoicing & Receivables', icon: Receipt, color: 'emerald',
        items: [
            { n: 'Customer Account Registry (Khata)', d: 'A dedicated ledger for every buyer — lifetime purchases, credit balance and payment history.' },
            { n: 'Customer Payments Log', d: 'Records cash, bank transfers and partial cheque deposits against specific invoices.' },
            { n: 'Customer Statement Generator', d: 'Clean downloadable PDF statements of purchases, returns and payments.' },
            { n: 'Aged Receivables Report', d: 'Categorizes outstanding balances into 30/60/90/120+ day buckets for collection priority.' },
            { n: 'WhatsApp & SMS Debt Reminders', d: 'One-click pre-formatted overdue-balance reminders from the customer ledger (coming soon).' },
            { n: 'Credit Limit Enforcement', d: 'Blocks credit sales when a customer’s balance exceeds their configured limit.' },
            { n: 'Multi-Payment Invoices', d: 'Accept partial payments across multiple sessions against one invoice.' },
            { n: 'Automatic Payment Allocation', d: 'Distributes lump-sum payments against the oldest unpaid invoices automatically.' },
            { n: 'Customer Lifetime Value Score', d: 'Ranks customers by total profit generated and sales volume.' },
            { n: 'Customer Wallet Credit', d: 'Returns refunds into a digital store wallet, keeping capital in your business.' },
            { n: 'Loyalty Points System', d: 'Awards purchase points automatically, redeemable as discounts on future orders.' },
            { n: 'Wholesale vs Retail Pricing Tiers', d: 'Assigns custom price lists per customer for automatic wholesale pricing.' },
            { n: 'B2B Proposal Builder', d: 'Creates corporate proposals and estimates with tracked “Valid Until” dates.' },
            { n: 'One-Click Quotation Conversion', d: 'Converts accepted quotes into posted tax invoices and updates the ledger in one click.' },
            { n: 'Tax-Inclusive / Exclusive Toggle', d: 'Switch B2B pricing between tax-inclusive and tax-exclusive display.' },
            { n: 'B2B Invoice Margin Display', d: 'Shows calculated profit per line item while building an invoice (owner-only).' },
            { n: 'Sales Return Vouchers', d: 'Generates formal return records and restores returned items to inventory.' },
            { n: 'Interactive B2B Invoice Designer', d: 'Customizable invoice layout with brand colors, logos, margins and signature fields.' },
            { n: 'Pre-Sales Inventory Reservation', d: 'Locks stock batches for pending orders without recording revenue until delivery.' },
            { n: 'Automated Recurring Invoicing', d: 'Schedules subscription invoices on daily, weekly, monthly or quarterly cycles.' },
            { n: 'Refund Reason Analysis', d: 'Tracks return reasons (damaged, wrong size…) to surface product quality patterns.' },
            { n: 'Tax-Exempt Customer Flag', d: 'Marks corporate clients as tax-exempt, skipping tax on their orders.' },
            { n: 'Customer Address Book', d: 'Stores billing, shipping and multiple warehouse addresses per customer.' },
            { n: 'A4 & Letter Invoice PDF Export', d: 'Generates clean professional A4 or US-Letter PDF invoices ready to email.' },
            { n: 'Outstanding Balance Dashboard', d: 'Widget showing total receivables across all customer accounts at a glance.' },
            { n: 'Unified Party Ledger', d: 'Merges a customer’s full sales, returns and payment history into one clean view.' },
            { n: 'Customer Milestone Tracker', d: 'Logs birthdays and anniversaries, sending automated greetings and discount vouchers.' },
            { n: 'Digital Gift Cards', d: 'Issues promotional digital gift cards with configurable balances and expiry dates.' },
            { n: 'Overdue Customer Highlights', d: 'Highlights past-due customer profiles in red across all ledger screens.' },
        ],
    },
    {
        key: 'procurement', label: 'Procurement & Payables', icon: Truck, color: 'cyan',
        items: [
            { n: 'Supplier Account Registry (Khata)', d: 'Vendor profile tracking what you owe each supplier and their payment terms.' },
            { n: 'Delayed Supplier Payments', d: 'Record stock on credit, track the balance and pay in installments.' },
            { n: 'Supplier Statement Generator', d: 'Downloadable PDF statements of purchases, returns and payments per vendor.' },
            { n: 'Aged Payables Directory', d: 'Categorizes vendor balances owed into 30/60/90/120+ day buckets.' },
            { n: 'Purchase Order Tracker', d: 'Tracks POs from Draft → Ordered → Partially Received → Fully Received.' },
            { n: 'Partial Shipment Intake', d: 'Logs split deliveries, keeping remaining quantities active.' },
            { n: 'Supplier Debit Notes', d: 'Formal debit notes when returning faulty stock to claim vendor credits.' },
            { n: 'Automated Cost Price Updater', d: 'Recalculates product cost prices automatically from each new supplier invoice.' },
            { n: 'Cost Price Increase Alert', d: 'Warns when a supplier charges more than their historical average.' },
            { n: 'Supplier Lead Time Tracker', d: 'Logs average delivery days between order and receipt per vendor.' },
            { n: 'Landing Cost Allocations', d: 'Distributes freight, customs and overhead across product batch costs accurately.' },
            { n: 'Supplier SKU Mapping', d: 'Maps supplier product codes to your internal catalog for fast reordering.' },
            { n: 'Inbound Expiry Date Tracking', d: 'Logs expiry dates at intake to prevent silent shelf expiry.' },
            { n: 'Purchase Returns Register', d: 'Processes vendor returns, adjusts stock and reduces payables automatically.' },
            { n: 'Auto-Generated Purchase Orders', d: 'Drafts POs for products that drop below safety stock levels.' },
            { n: 'Bulk Supplier Payments', d: 'Records one payment settled across multiple outstanding vendor invoices.' },
            { n: 'Bank-Linked Supplier Payments', d: 'Connects outgoing vendor payments to your cash and bank ledgers.' },
            { n: 'Custom Supplier Payment Terms', d: 'Set vendor-specific terms such as Net 15, Net 30 or Net 60.' },
            { n: 'Purchase Invoice Document Scanner', d: 'Upload and attach scanned invoices directly to purchase records for auditing.' },
            { n: 'Supplier Refund Tracker', d: 'Logs refund payments received back from suppliers for returned goods.' },
            { n: 'Tax-Inclusive Procurement Toggle', d: 'Switches purchase calculations between tax-inclusive and tax-exclusive formats.' },
            { n: 'Supplier Credit Limit Alerts', d: 'Highlights vendor accounts in red when balances approach their pre-set caps.' },
            { n: 'Outstanding Payables Dashboard', d: 'A widget showing total amounts owed across all suppliers in one view.' },
        ],
    },
    {
        key: 'inventory', label: 'Inventory & Warehouses', icon: Warehouse, color: 'blue',
        items: [
            { n: 'Multi-Warehouse Isolation (Godown)', d: 'Separate inventory balances for each godown, retail floor or wholesale depot.' },
            { n: 'Stock Transfer Vouchers', d: 'Logged transfers between locations, complete with printable waybills.' },
            { n: 'Product Variant Support', d: 'Tracks size, color and weight variants under single product groups.' },
            { n: 'Variant-Aware FIFO Costing', d: 'Separate cost pools per variant for accurate COGS from actual batch prices.' },
            { n: 'Batch Intake Number Tracking', d: 'Records manufacturing batch numbers at receipt for precise traceability.' },
            { n: 'Batch Expiry Warnings', d: 'Dashboard notifications for batches approaching their expiration date.' },
            { n: 'Stock Take Audit Wizard', d: 'Reconciles system inventory against physical counts, logging discrepancy causes.' },
            { n: 'Disaster & Asset Claim Manager', d: 'Logs stock lost to theft, fire or water, handles write-offs and tracks insurance claims.' },
            { n: 'Bill of Materials (BOM) Recipes', d: 'Defines composite items built from multiple raw stock components.' },
            { n: 'Auto-Assembly Cookbook', d: 'Deducts raw ingredients in real time when a manufactured item is sold.' },
            { n: 'Production Run Simulator', d: 'Checks raw materials to confirm whether a planned production run can complete.' },
            { n: 'Recipe History Archive', d: 'Preserves historical cost and component configs so past audits stay accurate.' },
            { n: 'Product History Timeline', d: 'Unified list of all purchase, sale and return movements per product.' },
            { n: 'Category Management Center', d: 'Hierarchical category groups for organizing thousands of items cleanly.' },
            { n: 'Low Stock Threshold Alerts', d: 'Configurable per-product triggers when inventory drops below reorder levels.' },
            { n: 'IMEI & Serial Lifecycle Tracking', d: 'Tracks device identifiers from supplier purchase through sale and returns.' },
            { n: 'Unit of Measure Converter', d: 'Buy in cartons, sell in pieces — convert between base and secondary units.' },
            { n: 'Stock Valuation by Location', d: 'Detailed value of all active stock holdings by warehouse using real FIFO cost.' },
        ],
    },
    {
        key: 'ecom', label: 'E-Commerce & Channels', icon: Globe, color: 'violet',
        items: [
            { n: 'VenSynQ Command Center', d: 'Connects Amazon, WooCommerce, TikTok Shop and eBay — syncs stock and manages all channel orders in one place.' },
            { n: '3-Click OAuth Store Connection', d: 'Connect marketplace accounts through a secure authorization link in three clicks.' },
            { n: 'Automated Commission Isolation', d: 'Calculates platform fees (e.g. Amazon’s 15%) to reveal your clean net margin per sale.' },
            { n: 'Dropshipping Order Automator', d: 'Syncs incoming marketplace orders and compiles dropship sales invoices automatically.' },
            { n: 'Just-in-Time Purchase Orders', d: 'Drafts a supplier PO the moment a dropship sale is recorded — locking your margin.' },
            { n: 'Bulk Tracking ID Sync', d: 'Pushes courier tracking numbers and carriers back to marketplaces in bulk.' },
            { n: 'Multi-Channel Expense Allocation', d: 'Routes platform fees and commissions into custom expense categories automatically.' },
            { n: 'WooCommerce Real-Time Webhook', d: 'Listens to WooCommerce orders, matches by SKU and deducts inventory instantly.' },
            { n: 'WooCommerce Customer Auto-Registry', d: 'Creates a unified “Web Customer” contact for all incoming e-commerce orders.' },
            { n: 'WooCommerce Stock Sync', d: 'Pushes updated inventory levels to your WooCommerce store every 5 minutes.' },
            { n: 'Online Orders Bridge', d: 'Pulls pending web orders into the central POS dashboard for fulfillment.' },
            { n: 'Web Store Catalog Controls', d: 'Choose which products appear or are hidden from your public storefront.' },
        ],
    },
    {
        key: 'accounting', label: 'Accounting & Ledgers', icon: Calculator, color: 'emerald',
        items: [
            { n: 'Double-Entry Journal Engine', d: 'Posts balanced debit/credit entries for every transaction — the gold standard of accuracy.' },
            { n: 'Automated Cash Reconciliation', d: 'Computes current cash from live ledger queries, eliminating cached reporting errors.' },
            { n: 'Fixed Asset Depreciation Tracker', d: 'Calculates monthly depreciation for fixtures, hardware and vehicles automatically.' },
            { n: 'Business Loan Ledger', d: 'Tracks loans separately, splitting principal repayments from interest expense.' },
            { n: 'Inter-Register Cash Transfers', d: 'Records cash moved between registers and banks with manager approvals.' },
            { n: 'Advance Payment Allocation', d: 'Registers and applies customer pre-payments and supplier deposits to later invoices.' },
            { n: 'Fiscal Year Closing Wizard', d: 'Locks year-end entries, archives balances and opens fresh books for the new period.' },
            { n: 'Debit & Credit Note Registry', d: 'Generates and prints formal financial notes for returns and adjustments.' },
            { n: 'Bank Reconciliation Checker', d: 'Compares uploaded bank CSV statements against records, flagging unmatched lines.' },
            { n: 'Tax Summary Engine', d: 'Tracks output tax collected vs input tax paid, computing net tax liability.' },
            { n: 'Expense Manager + Receipt Uploads', d: 'Logs expenses by category with scanned receipt images for audit trails.' },
            { n: 'Charity Allocation Engine', d: 'Directs a configured percentage of checkout profit to a dedicated charity ledger.' },
            { n: 'Petty Cash Logs', d: 'Records small cash movements between registers with mandatory approval trails.' },
            { n: 'Immutable Transaction Locks', d: 'System observers block any modification to posted financial transactions.' },
            { n: 'Balanced Reversal Engine', d: 'Generates matching zero-balance entries for reversals, keeping ledgers correct.' },
            { n: 'Multi-Currency Configuration', d: 'Exchange rates, symbols and formatting for SAR, AED, USD, PKR, GBP and more.' },
        ],
    },
    {
        key: 'reports', label: 'Reports', icon: BarChart3, color: 'pink',
        items: [
            { n: 'Profit & Loss Statement', d: 'Net revenue, COGS, gross margin and operating expenses with category drill-down.' },
            { n: 'Balance Sheet', d: 'Real-time snapshot of total assets, liabilities and equity.' },
            { n: 'Cash Flow Statement', d: 'Monitors operating, investing and financing cash flows.' },
            { n: 'Double-Entry Trial Balance', d: 'Verifies accounting health by matching all debit and credit totals.' },
            { n: 'Sales Summary & Daily Trend', d: 'Transaction history filterable by date, customer and payment status; daily tax/discount trends.' },
            { n: 'Day Book Log', d: 'Chronological minute-by-minute diary of all cash inflows and outflows.' },
            { n: 'Account Ledger Report', d: 'Comprehensive audit ledger for any category in your chart of accounts.' },
            { n: 'Party Statement (Khata Ledger)', d: 'Credit statements for customers or suppliers with debit, credit and closing balance.' },
            { n: 'Stock Valuation Report', d: 'Value of all active stock holdings by warehouse, at real FIFO cost.' },
            { n: 'Low Stock Shortages Report', d: 'Lists products below reorder threshold with exact shortage quantities.' },
            { n: 'Stock Movement History', d: 'Every receipt, adjustment, transfer and sale with operator details.' },
            { n: 'Tax Compliance Summary', d: 'Output tax collected vs input tax credits, showing net tax due.' },
            { n: 'Item-Wise Profit Analysis', d: 'Identifies high-margin products by revenue and cost per item.' },
            { n: 'Party-Wise Profitability', d: 'Ranks customers and suppliers by the net margin they generate.' },
            { n: 'Bill-Wise Profitability', d: 'Computes net profit margins generated by individual invoices.' },
            { n: 'Sales Aging Report', d: 'Categorizes outstanding receivables into 30/60/90+ day intervals.' },
            { n: 'Expense by Category', d: 'Pie-chart view of overhead costs across all custom business categories.' },
            { n: 'Stock Summary & Aging', d: 'Inventory levels and capital by category; flags slow-moving stock by age in each godown.' },
            { n: 'Item / Party Cross Reports', d: 'Every product a customer bought, and every customer who bought a product.' },
            { n: 'Loan Repayment Statement', d: 'Amortization showing principal reduction and interest paid per period.' },
            { n: 'Graph Analytics Dashboard', d: 'Heatmaps and trend charts showing platform performance over time.' },
            { n: 'Purchases Report', d: 'Procurement totals, supplier amounts owed and full invoice histories.' },
            { n: 'Transactions History', d: 'Searchable directory of every operational transaction in the system.' },
            { n: 'Expenses Directory', d: 'Categorized operating-expense report with receipt file attachments.' },
            { n: 'Bank Statements Log', d: 'Traces all bank ledger accounts, cash balances and payment records.' },
            { n: 'Expiring Soon Alert', d: 'Highlights inventory batches expiring within a configurable window.' },
            { n: 'All Parties Credit Summary', d: 'Combined outstanding receivables and payables across all contacts.' },
            { n: 'General Discount Report', d: 'Analyzes the total cost of discount strategies across all transactions.' },
            { n: 'Category Profit & Loss', d: 'Tracks profit and loss performance for individual product departments.' },
            { n: 'Tax Rate Breakdown', d: 'Traces output taxes collected, organized by tax-rate bracket.' },
            { n: 'Sales Order Items', d: 'Line-item breakdown of every pending and fulfilled sales order.' },
            { n: 'Daily Sales Trend', d: 'Daily records of tax collected, discounts applied and transaction volume.' },
            { n: 'Stock Summary by Category', d: 'Inventory levels and capital values grouped by product category.' },
            { n: 'Stock Aging Analysis', d: 'Identifies slow-moving inventory by how long stock has sat in each godown.' },
            { n: 'Sales & Purchases by Party', d: 'Evaluates trade volume and balances with each individual business partner.' },
            { n: 'Item Report by Party', d: 'Lists every product ever purchased by a selected customer.' },
            { n: 'Party Report by Item', d: 'Identifies all customers who have purchased a specific product.' },
            { n: 'Item-Wise Discount Report', d: 'Breaks down the discount given on each individual product line.' },
            { n: 'Owner Daily Pulse', d: 'A one-screen morning briefing of sales, cash and alerts for the owner.' },
            { n: 'Sale Orders Report', d: 'Tracks open and fulfilled sales orders with delivery status.' },
            { n: 'Purchase Returns Report', d: 'Summarizes goods returned to suppliers and the credits claimed.' },
        ],
    },
    {
        key: 'growth', label: 'Growth Intelligence', icon: Brain, color: 'violet',
        items: [
            /* ── Customer brain ─────────────────────────────────────────── */
            { n: 'Per-Customer Rhythm Detection', d: 'Learns how often each customer actually buys — and how consistent they are — instead of applying one average to everybody.' },
            { n: 'Reorder Due Alerts', d: 'Tells you a regular is about to reorder so you can reach them before a competitor does.' },
            { n: 'Late Customer Warnings', d: 'Flags a customer only when they are late by their OWN standard, measured in standard deviations of their personal buying gap.' },
            { n: 'Churn Risk & Lost Customer Detection', d: 'Separates “slipping” from “gone”, with the lifetime revenue and profit at stake attached to each.' },
            { n: 'Quiet Decline Detection', d: 'Catches customers who are still ordering but have halved their spend — invisible to every normal churn rule.' },
            { n: 'Rising Star Alerts', d: 'Surfaces customers growing fast, so you can lock them in with better terms while it matters.' },
            { n: 'Revenue Concentration Warning', d: 'Tells you when one customer has become a dangerous share of your total business.' },
            { n: 'First-Purchase Follow-Up', d: 'Flags brand-new customers who never came back — the single highest-leverage retention moment in retail.' },
            { n: 'Credit Limit Breach Alerts', d: 'Warns the moment a customer’s balance passes the limit you set, before you extend more credit.' },
            { n: 'Market Basket Cross-Sell', d: 'Finds the product pairs that keep appearing on the same receipt so you can shelve or prompt them together.' },
            { n: 'RFM Customer Segmentation', d: 'Scores every customer on Recency, Frequency and Monetary value against your own distribution — champions, at-risk, lost and more.' },
            { n: 'Predicted Customer Lifetime Value', d: 'Projects each customer’s annual worth from their observed spend rate — explainable, not a black box.' },

            /* ── Stock brain ────────────────────────────────────────────── */
            { n: 'Velocity-Based Demand Model', d: 'Measures units-per-day across 7, 30 and 90-day windows so acceleration and collapse are both visible.' },
            { n: 'Days-of-Cover & Stockout Dates', d: 'Projects exactly when each product runs out at its current rate.' },
            { n: 'Lead-Time-Aware Reorder Alerts', d: 'Learns how long your suppliers actually take, then warns early enough that you can still act.' },
            { n: 'Out-of-Stock Revenue Loss', d: 'Shows how much you are losing every week a selling product sits empty.' },
            { n: 'Dead Stock Detection', d: 'Surfaces the cash locked in products that have stopped moving — where most small retailers’ money quietly dies.' },
            { n: 'Overstock & Trapped Cash', d: 'Flags lines you hold months of supply of, with the excess above healthy cover priced.' },
            { n: 'Expiry Write-Off Forecast', d: 'Calculates how much expiring stock you will realistically sell before the date, and what you will lose.' },
            { n: 'Demand Surge Alerts', d: 'Tells you to buy deeper while a run is still happening, not after it ends.' },
            { n: 'Return Rate Quality Flags', d: 'Highlights products customers keep returning — usually a supplier or quality problem worth catching before the next order.' },
            { n: 'ABC Product Classification', d: 'Ranks products by revenue contribution so a stockout on an A-line is treated differently from a C-line.' },

            /* ── Profit brain ───────────────────────────────────────────── */
            { n: 'Selling-Below-Cost Detection', d: 'Catches lines where your supplier cost rose but the till price never did — using real FIFO cost, not averages.' },
            { n: 'Margin Erosion Tracking', d: 'Compares each product’s margin this month against last, in percentage points, with the annual cost of ignoring it.' },
            { n: 'Discount Leakage Analysis', d: 'Shows what discounting actually costs as a share of gross sales, and how that has moved.' },
            { n: 'Price Headroom Detection', d: 'Identifies strong-demand products earning well under your own median margin, with the monthly upside quantified.' },
            { n: 'Unprofitable Customer Detection', d: 'Finds big-revenue accounts contributing almost no profit — common, painful, and invisible on a sales report.' },
            { n: 'Sales Mix Shift Alerts', d: 'Warns when revenue is holding but profit is falling because the MIX moved to low-margin lines.' },

            /* ── Cash & operations brain ────────────────────────────────── */
            { n: 'Aged Receivable Chasing', d: 'Groups overdue money by customer with the oldest invoice named and the ageing bucket stated.' },
            { n: 'Receivable Concentration Risk', d: 'Warns when too much of what you are owed sits with a single customer.' },
            { n: 'Collection Velocity Monitoring', d: 'Detects cash arriving slower than it used to, even while sales look healthy.' },
            { n: 'Supplier Payment Planning', d: 'Surfaces the largest balances coming due so you can protect your credit terms.' },
            { n: 'Revenue Anomaly Detection', d: 'Compares this week against the same weekdays in your own history using a median-based method that one exceptional day cannot distort.' },
            { n: 'Peak Trading Hour Analysis', d: 'Shows the hours that carry most of your revenue so you can staff and stock around them.' },
            { n: 'Quiet Day Identification', d: 'Finds days consistently running well below normal, so you can promote into them or cut cost.' },
            { n: 'Cashier Discount Outlier Detection', d: 'Flags a staff member whose discount rate is far above the team median, with the monthly cost attached.' },

            /* ── The engine itself ──────────────────────────────────────── */
            { n: 'Evidence On Every Insight', d: 'Each recommendation shows the underlying numbers, so you can verify the claim instead of trusting it.' },
            { n: 'Self-Scoring Accuracy Loop', d: 'Every prediction is checked afterwards against what actually happened, and the hit rate is published to you per insight type.' },
            { n: 'Self-Tuning Thresholds', d: 'Insight types that prove accurate and get acted on become more sensitive; ones that keep missing get quieter automatically.' },
            { n: 'Automatic Noise Suppression', d: 'An insight type that is repeatedly wrong or endlessly dismissed mutes itself for a few weeks — and every mute expires so it can earn its place back.' },
            { n: 'Learns Your Scale', d: 'Median order value, reorder gap, supplier lead time and payment terms are all measured from your own trading — no hardcoded thresholds.' },
            { n: 'Intervention-Aware Scoring', d: 'If you act and the predicted problem is avoided, that counts as a success — not a failed forecast.' },
            { n: 'Runs Without an AI Key', d: 'Deterministic statistics over your own ledger. No LLM, no API key, no per-message cost, and identical results every run.' },
            { n: 'Daily Business Snapshots', d: 'Records revenue, margin, basket size, receivables and inventory value every day, building the baseline the engine compares against.' },
            { n: 'Snooze & Dismiss Memory', d: 'Insights you reject stay rejected for a cooling-off period instead of reappearing tomorrow.' },
            { n: 'Auto-Resolving Signals', d: 'When you fix the underlying problem the insight closes itself, so the list only ever shows what is still live.' },
        ],
    },
    {
        key: 'ai', label: 'AI & Administration', icon: Cpu, color: 'violet',
        items: [
            { n: 'Floating AI Assistant', d: 'Context-aware chat that answers ledger and business questions in plain English.' },
            { n: 'Smart Capture (Image & Audio)', d: 'Snap a bill or speak — AI extracts a sale, purchase or expense and matches products to your catalog.' },
            { n: 'Bring-Your-Own-Key AI', d: 'Plug in your own AI key so intelligence runs on your terms and budget.' },
            { n: 'Multi-Tenant Store Isolation', d: 'Each store runs in a completely isolated database scope, accessible only to its users.' },
            { n: 'Three-Zone Security Architecture', d: 'Server-side partitioning between public, store and SuperAdmin layers.' },
            { n: 'SuperAdmin Command Center', d: 'An 8-tab war room monitoring store creation, subscriptions and platform metrics.' },
            { n: 'Subscription Plan Enforcement', d: 'Enforces transaction limits, seat counts and store caps per tier automatically.' },
            { n: 'Redis-Cached Plan Gates', d: 'Verifies tenant plan limits instantly, reducing DB load during peak periods.' },
            { n: 'Automated Limit Override Manager', d: 'Lets admins grant custom plan extensions to specific tenants.' },
            { n: 'Staff Invitation Codes', d: 'Secure alphanumeric tokens (e.g. VQ-A3X9P2) for adding staff without sharing passwords.' },
            { n: 'Ephemeral Demo Sandbox', d: 'Builds temporary public demo environments by cloning a master dataset, auto-expiring after 48h.' },
            { n: 'Soft-Delete Trash Management', d: 'Restore or permanently delete soft-deleted stores and user accounts.' },
            { n: 'Custom Tax Rate Configurator', d: 'Create regional brackets (GST, VAT) configurable at the product level.' },
            { n: 'Cashier Inactivity Auto-Logout', d: 'Automatic terminal logout timers based on cashier inactivity.' },
            { n: 'Module Toggle Controls', d: 'Enable or disable modules (AI, WooCommerce, Manufacturing) per tenant dynamically.' },
            { n: 'Backups & Google Drive Sync', d: 'Automated backups with restore points, syncable to your own Google Drive.' },
            { n: 'Import / Export Tools', d: 'Bulk import and export products, parties and transactions — your data is always yours.' },
            { n: 'Barcode Pattern Recognition', d: 'Maps scanner input to distinguish SKUs, serial numbers and IMEI identifiers.' },
            { n: 'Stock Reservation Rules', d: 'Configures whether sales orders reserve active stock or draft from empty allocations.' },
            { n: 'Passcode Security Standards', d: 'Enforces numerical complexity requirements for all employee access codes.' },
        ],
    },
    {
        key: 'roadmap', label: 'On the Roadmap', icon: Sparkles, color: 'amber',
        items: [
            { n: 'Device-Adaptive Layouts', d: 'Optimizing checkout across ultra-wide monitors, legacy tablets and small phones.' },
            { n: 'Custom SMTP Mail Gateway', d: 'Send invoices and statements from your own branded company email domain.' },
            { n: 'SMS & Messaging Gateway', d: 'Connect leading SMS providers for automated customer text alerts.' },
            { n: 'WhatsApp & SMS Debt Reminders', d: 'One-click overdue payment alerts sent from customer ledger pages.' },
            { n: 'Anniversary & Birthday Tracker', d: 'Automated milestone greetings paired with targeted discount vouchers.' },
            { n: 'Digital Gift Cards & Wallet Credit', d: 'Issue promotional gift cards and handle refunds as store credit.' },
        ],
    },
];
const TOTAL_FEATURES = FEATURE_CATS.reduce((s, c) => s + c.items.length, 0);
const CAT_COLOR = {
    indigo: 'text-brand-300 bg-brand-500/12 border-brand-400/20',
    amber: 'text-amber-300 bg-amber-500/12 border-amber-400/20',
    emerald: 'text-emerald-300 bg-emerald-500/12 border-emerald-400/20',
    cyan: 'text-cyan-300 bg-cyan-500/12 border-cyan-400/20',
    blue: 'text-blue-300 bg-blue-500/12 border-blue-400/20',
    violet: 'text-violet-300 bg-violet-500/12 border-violet-400/20',
    pink: 'text-pink-300 bg-pink-500/12 border-pink-400/20',
};

/* ── Feature explorer: search + filter + click-to-explain ─────────────────── */
const ALL_ITEMS = FEATURE_CATS.flatMap(c => c.items.map(it => ({ ...it, cat: c.label, color: c.color, ckey: c.key, icon: c.icon })));
const FeatureExplorer = () => {
    const [q, setQ] = useState('');
    const [cat, setCat] = useState('all');
    const [sel, setSel] = useState(null);
    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase();
        return ALL_ITEMS.filter(it =>
            (cat === 'all' || it.ckey === cat) &&
            (!ql || it.n.toLowerCase().includes(ql) || it.d.toLowerCase().includes(ql))
        );
    }, [q, cat]);
    return (
        <div>
            {/* controls */}
            <div className="flex flex-col gap-4 mb-8">
                <div className="relative max-w-md mx-auto w-full">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search all ${TOTAL_FEATURES} features…`}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-brand-500/50 text-ink text-sm outline-none transition-colors" />
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    <button onClick={() => setCat('all')} className={`px-3.5 py-1.5 rounded-full text-1xs font-bold border transition-all ${cat === 'all' ? 'bg-white text-void-900 border-white' : 'bg-white/[0.03] text-ink-muted border-line dark:border-white/10 hover:text-white'}`}>All <span className="opacity-60">{TOTAL_FEATURES}</span></button>
                    {FEATURE_CATS.map(c => (
                        <button key={c.key} onClick={() => setCat(c.key)} className={`px-3.5 py-1.5 rounded-full text-1xs font-bold border transition-all inline-flex items-center gap-1.5 ${cat === c.key ? CAT_COLOR[c.color] + ' brightness-125' : 'bg-white/[0.03] text-ink-muted border-line dark:border-white/10 hover:text-white'}`}>
                            <c.icon size={12} /> {c.label} <span className="opacity-60">{c.items.length}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filtered.map((it, i) => (
                    <button key={it.cat + it.n} onClick={() => setSel(it)}
                        className="group text-left p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-brand-400/25 transition-all hover:-translate-y-0.5">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center border ${CAT_COLOR[it.color]}`}><it.icon size={13} /></span>
                            <span className="text-4xs font-bold uppercase tracking-widest text-ink-secondary">{it.cat}</span>
                            <ChevronRight size={13} className="ml-auto text-ink-secondary group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <div className="text-[13px] font-bold text-ink tracking-tight mb-1">{it.n}</div>
                        <div className="text-1xs text-ink-muted leading-snug line-clamp-2">{it.d}</div>
                    </button>
                ))}
            </div>
            {filtered.length === 0 && <div className="text-center py-12 text-ink-muted text-sm">No features match “{q}”.</div>}

            {/* detail modal */}
            {sel && (
                <div className="fixed inset-0 z-drawer flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm vqf-in" onClick={() => setSel(null)}>
                    <div className="relative max-w-lg w-full rounded-2xl border border-line dark:border-white/10 bg-void-800 p-7 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent rounded-t-3xl" />
                        <button onClick={() => setSel(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-sunken dark:bg-white/5 hover:bg-white/10 flex items-center justify-center text-ink-muted"><X size={16} /></button>
                        <div className="flex items-center gap-3 mb-4">
                            <span className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${CAT_COLOR[sel.color]}`}><sel.icon size={22} /></span>
                            <div>
                                <div className="text-3xs font-bold uppercase tracking-widest text-ink-muted">{sel.cat}</div>
                                <h3 className="text-xl font-bold text-ink tracking-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{sel.n}</h3>
                            </div>
                        </div>
                        <p className="text-ink-secondary leading-relaxed text-[15px] mb-5">{sel.d}</p>
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
                            <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="text-[12px] text-ink-muted">Included in VenQore — verified by the same double-entry engine that powers every number.</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── anchor nav pill ─────────────────────────────────────────────────────── */
const JumpPill = ({ href, icon: Ic, children }) => (
    <a href={href} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.03] border border-line dark:border-white/10 text-1xs font-bold text-ink-secondary hover:text-white hover:border-brand-400/40 hover:bg-white/[0.06] transition-all">
        <Ic size={13} className="text-brand-300" /> {children}
    </a>
);

const ACCENT_TEXTS = {
    indigo: 'text-brand-400 hover:text-brand-300',
    emerald: 'text-emerald-400 hover:text-emerald-300',
    violet: 'text-violet-400 hover:text-violet-300',
    blue: 'text-blue-400 hover:text-blue-300',
    amber: 'text-amber-400 hover:text-amber-300',
};

/* ── Demo section wrapper ────────────────────────────────────────────────── */
const DemoSection = ({ id, eyebrow, icon: Ic, title, accent, lead, hero, soon, deepDiveLink, deepDiveText, children }) => (
    <section id={id} className="vqf-anchor py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
            <RevealOnScroll>
                <div className="text-center mb-10 max-w-3xl mx-auto">
                    <SectionLabel icon={Ic}>{eyebrow}</SectionLabel>
                    {hero && <div className="inline-block ml-2 mb-8 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-300 text-2xs font-bold tracking-widest uppercase align-middle">★ Hero feature</div>}
                    {soon && <div className="inline-flex items-center gap-1.5 ml-2 mb-8 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-2xs font-bold tracking-widest uppercase align-middle"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 vqf-blink" /> Coming very soon</div>}
                    <h2 className="text-3xl md:text-5xl font-bold text-ink tracking-tighter leading-[0.95] font-display">{title}</h2>
                    <p className="text-ink-muted text-base md:text-lg mt-5">{lead}</p>
                </div>
            </RevealOnScroll>
            <RevealOnScroll delay={0.1}>
                {children}
                {deepDiveLink && (
                    <div className="mt-8 text-center">
                        <Link href={deepDiveLink} className={`inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${ACCENT_TEXTS[accent] || ACCENT_TEXTS.indigo} hover:underline`}>
                            {deepDiveText || 'Read the Deep-Dive Feature Page'} <ArrowRight size={14} />
                        </Link>
                    </div>
                )}
            </RevealOnScroll>
        </div>
    </section>
);

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Features() {
    const heroStats = [
        { e: TOTAL_FEATURES, s: '+', l: 'Features' },
        { e: 40, s: '+', l: 'Reports' },
        { e: 12, s: '', l: 'Core Modules' },
        { e: 6, s: '', l: 'Live Demos' },
    ];
    return (
        <MarketingLayout title="Features - VenQore" description="Explore every VenQore feature with live, interactive demos of the real product - Reports, POS, Smart Capture AI, VenSynQ, the Growth Intelligence Engine and Cookbook - plus a searchable catalog of all 255+ capabilities.">
            {/* HERO */}
            <section className="relative pt-36 md:pt-44 pb-12 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <RevealOnScroll><SectionLabel icon={Layers}>The whole machine</SectionLabel></RevealOnScroll>
                    <RevealOnScroll delay={0.08}>
                        <h1 className="text-[2.5rem] xs:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] sm:leading-[0.9] mb-8 font-display">
                            <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">Don’t take our word.</span><br />
                            <span className="bg-gradient-to-r from-brand-400 via-brand-400 to-cyan-300 bg-clip-text text-transparent vq-text-glow">See it run.</span>
                        </h1>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.16}>
                        <p className="text-lg md:text-2xl text-ink-muted max-w-3xl mx-auto leading-relaxed font-medium">
                            Six of VenQore’s flagship tools — playable right here as guided simulations of the real product. Then browse every one of the <span className="text-ink font-semibold">{TOTAL_FEATURES}+ features</span>, each explained in a click.
                        </p>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.24}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-12 border-t border-white/[0.06] pt-8">
                            {heroStats.map((s, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-3xl md:text-4xl font-bold text-ink tracking-tighter font-display"><Num end={s.e} />{s.s}</div>
                                    <div className="text-2xs text-ink-secondary font-bold uppercase tracking-[0.22em] mt-1">{s.l}</div>
                                </div>
                            ))}
                        </div>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.3}>
                        <div className="flex flex-wrap justify-center gap-2 mt-10">
                            <JumpPill href="#reports" icon={BarChart3}>Reports</JumpPill>
                            <JumpPill href="#pos" icon={ShoppingCart}>POS</JumpPill>
                            <JumpPill href="#capture" icon={ScanBarcode}>Smart Capture</JumpPill>
                            <JumpPill href="#vensynq" icon={Globe}>VenSynQ</JumpPill>
                            <JumpPill href="#growth" icon={Cpu}>Growth Engine</JumpPill>
                            <JumpPill href="#cookbook" icon={Factory}>Cookbook</JumpPill>
                            <JumpPill href="#all" icon={Layers}>All {TOTAL_FEATURES}</JumpPill>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* DEMO 1 · REPORTS (hero, first) */}
            <DemoSection id="reports" eyebrow="Reporting Engine" icon={BarChart3} accent="emerald" hero
                title={<>Reports that <span className="text-emerald-600 dark:text-emerald-400">never disagree.</span></>}
                lead="40+ statements from one verified ledger. Here’s the live Profit & Loss — switch periods, then let AI read it for you."
                deepDiveLink="/features/accounting"
                deepDiveText="Deep Dive: Double-Entry Accounting Engine">
                <ProfitLossDemo />
            </DemoSection>

            {/* DEMO 2 · POS */}
            <DemoSection id="pos" eyebrow="Point of Sale" icon={ShoppingCart} accent="indigo" hero
                title={<>Ring up a sale <span className="text-brand-600 dark:text-brand-400">right now.</span></>}
                lead="This is the real POS. Add products, change quantities, pick a payment method and complete the sale — nothing is saved, it’s yours to play with."
                deepDiveLink="/features/point-of-sale"
                deepDiveText="Deep Dive: Point of Sale Checkout System">
                <PosInvoiceDemo />
            </DemoSection>

            {/* DEMO 3 · SMART CAPTURE */}
            <DemoSection id="capture" eyebrow="Smart Capture · AI" icon={ScanBarcode} accent="violet" soon
                title={<>Snap it. Say it. <span className="text-violet-400">Booked.</span></>}
                lead="Photograph a supplier bill or speak a sale out loud. Your own AI key reads it, figures out the transaction type, and matches every line to your catalog.">
                <SmartCaptureDemo />
            </DemoSection>

            {/* DEMO 4 · VENSYNQ */}
            <DemoSection id="vensynq" eyebrow="VenSynQ · Multi-Channel" icon={Globe} accent="blue" soon
                title={<>Every marketplace, <span className="text-blue-400">one truth.</span></>}
                lead="Amazon, eBay, TikTok, Etsy and WooCommerce in a single command center — real net margin after fees, live inventory status, and which channel actually makes you money.">
                <VenSynQDemo />
            </DemoSection>

            {/* DEMO 5 · GROWTH ENGINE (Intelligence Engine) */}
            <DemoSection id="growth" eyebrow="Growth · Intelligence Engine" icon={Cpu} accent="violet" hero
                title={<>It shows you <span className="text-violet-400">its working.</span></>}
                lead="Four brains read your customers, stock, margin and cash — every insight comes with the numbers behind it, and every prediction is scored afterwards against what actually happened."
                deepDiveLink="/features/growth-engine"
                deepDiveText="Deep Dive: The Intelligence Engine">
                <GrowthEngineDemo />
            </DemoSection>

            {/* DEMO 6 · COOKBOOK */}
            <DemoSection id="cookbook" eyebrow="Cookbook · Manufacturing" icon={Factory} accent="amber" hero
                title={<>Build products from <span className="text-amber-600 dark:text-amber-400">recipes.</span></>}
                lead="Define a Bill of Materials once. Produce a batch — or sell a composite item and watch raw stock deduct automatically, costed by real FIFO."
                deepDiveLink="/features/inventory-management"
                deepDiveText="Deep Dive: FIFO Inventory Management">
                <CookbookDemo />
            </DemoSection>

            {/* ALL FEATURES */}
            <section id="all" className="vqf-anchor py-20 md:py-28 px-6 border-t border-line dark:border-white/5">
                <div className="max-w-7xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-12 max-w-3xl mx-auto">
                            <SectionLabel icon={Layers}>The complete catalog</SectionLabel>
                            <h2 className="text-3xl md:text-5xl font-bold text-ink tracking-tighter leading-[0.95] font-display">All {TOTAL_FEATURES}+ features.<br /><span className="text-brand-600 dark:text-brand-400">Every one explained.</span></h2>
                            <p className="text-ink-muted text-base md:text-lg mt-5">Search, filter by area, and click any feature to read exactly what it does.</p>
                        </div>
                    </RevealOnScroll>
                    <FeatureExplorer />
                </div>
            </section>

            {/* CTA */}
            <section className="py-28 md:py-36 px-6 text-center">
                <div className="max-w-4xl mx-auto relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
                    <RevealOnScroll>
                        <h2 className="text-4xl md:text-7xl font-bold text-ink mb-8 tracking-tighter leading-[0.95] relative z-10 font-display">Now run it on <span className="text-brand-600 dark:text-brand-400">your numbers.</span></h2>
                        <p className="text-lg md:text-xl text-ink-muted mb-10 max-w-2xl mx-auto leading-relaxed relative z-10">14-day free trial · full access · no credit card · live in 15 minutes.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                            <MagneticButton href="/register" variant="primary">Start Free Trial <ArrowRight size={16} /></MagneticButton>
                            <MagneticButton href="/demo" variant="ghost">Launch Live Demo</MagneticButton>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* local demo keyframes */}
            <style>{`
                .vqf-anchor { scroll-margin-top: 100px; }
                .tabular-nums { font-variant-numeric: tabular-nums; }
                .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
                @keyframes vqf-blink { 0%,100%{opacity:1;} 50%{opacity:.25;} }
                .vqf-blink { animation: vqf-blink 1.6s ease-in-out infinite; }
                @keyframes vqf-in { 0%{opacity:0;transform:translateY(8px);} 100%{opacity:1;transform:none;} }
                .vqf-in { animation: vqf-in .45s cubic-bezier(0.22,1,0.36,1) both; }
                @keyframes vqf-scan { 0%{top:6%;} 50%{top:86%;} 100%{top:6%;} }
                .vqf-scan { animation: vqf-scan 1.5s ease-in-out infinite; }
                @keyframes vqf-wave { 0%,100%{transform:scaleY(.3);} 50%{transform:scaleY(1);} }
                .vqf-wave { transform-origin:bottom; animation: vqf-wave .9s ease-in-out infinite; }
                @keyframes vqf-pulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.08);opacity:.85;} }
                .vqf-pulse { animation: vqf-pulse 1.4s ease-in-out infinite; }
                @media (prefers-reduced-motion: reduce){ .vqf-blink,.vqf-scan,.vqf-wave,.vqf-pulse{animation:none!important;} }
`}</style>
        </MarketingLayout>
    );
}

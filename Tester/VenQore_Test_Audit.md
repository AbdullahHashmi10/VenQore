# VENQORE ERP/POS
## Complete System Test Audit Document
### What needs to be tested, how, and what the full scope of QA looks like

| **20** Major Modules | **230+** Test Areas | **960+** Estimated Test Cases |
|---|---|---|
| **12** Critical Risk Areas | **38** Reports to Validate | **5** Automated Flows |

*Updated: May 2026 | VenQore SaaS Multi-Tenant Edition*

---

## How to Use This Document

This document is the complete map of everything that must be tested in VenQore before any update goes to production. It does NOT contain the tests themselves — it tells you what areas exist, what each covers, how many test cases to expect, and priority level.

**Priority Legend:**

- **CRITICAL** — If this breaks, the system is unusable or loses money. Test before every single deploy.
- **HIGH** — Core business function. Must pass before any major release.
- **MEDIUM** — Important feature. Test on feature-specific deploys and weekly regression.
- **LOW** — Polish/edge case. Test on scheduled QA sprints.

The IDE Prompt at the end is the command you paste into your AI coding assistant. It will read this document + your codebase and generate the actual test files.

---

## ⚠️ THE GAP — What Your Current 73 Tests Do NOT Check

Your current suite tests **isolated units** — individual functions, exceptions, and service methods. It does NOT test what a real user does. These are the workflows that will lose you customers if they break silently:

| User Action | Currently Tested? | Risk |
|---|---|---|
| Cashier completes a POS sale → stock moves → cash moves → journal balances | ❌ NO | CRITICAL |
| Owner creates a purchase → FIFO batch created → stock increases | ❌ NO | CRITICAL |
| Receive money from customer → ledger updates → receivable decreases | ❌ NO | CRITICAL |
| Pay a supplier → cash decreases → payable decreases | ❌ NO | CRITICAL |
| Record an expense → cash in hand decreases → P&L reflects it | ❌ NO | CRITICAL |
| Cancel a sale → stock restored → journal reversed → balance unchanged | ❌ NO | CRITICAL |
| Transfer money bank → cash → both accounts update correctly | ❌ NO | HIGH |
| Add stock manually → FIFO batch created correctly | ❌ NO | HIGH |
| Dashboard cash in hand = Payments page cash in hand | ❌ NO | CRITICAL |
| All 38 reports return correct numbers against known data | ❌ NO | CRITICAL |

**New Module 21 (Real Workflow Integration Tests) has been added at the bottom specifically to fix this gap.**

---

## Module 1: Authentication & Multi-Tenancy

Foundation of the entire SaaS platform. A bug here means cross-tenant data leaks.

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 1 | User Registration / Login | Email + password login works, wrong credentials rejected, session created, remember-me token set | **CRITICAL** | 8 |
| 2 | Tenant Isolation | User from Tenant A can NEVER see data from Tenant B. All queries scoped. Test products, sales, parties, accounts across 2 tenants. | **CRITICAL** | 15 |
| 3 | Subdomain Routing | store.venqore.com resolves to correct tenant, wrong subdomain returns 404, reserved subdomains blocked | **CRITICAL** | 6 |
| 4 | TenantMiddleware | Suspended tenant gets 403, trial-expired tenant gets redirect, active tenant passes through | **CRITICAL** | 6 |
| 5 | God Admin / SuperAdmin | SuperAdmin can access /VenQore/* routes, regular user cannot, store owner cannot | **CRITICAL** | 5 |
| 6 | Role-Based Access Control (7 Roles) | Owner, Manager, Cashier, Staff, Support Specialist — each role blocked from unauthorized routes. Test all 7. | **CRITICAL** | 21 |
| 7 | Store Context (slug routing) | /s/{store_slug}/ routes resolve to correct store, session-based store context set correctly | **HIGH** | 8 |
| 8 | Demo Auto-Logout | Demo users (@venqore-demo.internal) auto-logged out when navigating to root / | **MEDIUM** | 3 |
| 9 | CSRF Protection | 419 auto-repair (refresh + retry) works silently, no manual intervention needed | **HIGH** | 4 |
| 10 | Session Lifetime | 8-hour sessions sustained, POS shift works without re-login | **HIGH** | 3 |

---

## Module 2: Store Creation & Provisioning

Store creation touches: StoreController, PlanGate, TenantMiddleware, AppSumo license check, default seeder, and multiple DB tables simultaneously.

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 11 | Create New Store (Happy Path) | Owner creates store → slug generated → TenantDefaultSeeder runs (22 accounts, 9 settings, 1 warehouse, 6 expense categories, 1 bank account) → success redirect | **CRITICAL** | 5 |
| 12 | Store Limit Enforcement (AppSumo) | LTD Tier 1 blocked at 1 store, Tier 2 at 2, Tier 3 at 4. Attempt to exceed returns PlanLimitException with upgrade modal. | **CRITICAL** | 6 |
| 13 | Slug Uniqueness & Reserved Words | Duplicate slugs rejected, reserved words (admin, billing, api) blocked, special chars sanitized | **HIGH** | 6 |
| 14 | Default Data Seeding | New store gets exactly: 22 accounts, 9 settings rows, 1 default warehouse, 6 expense categories, 1 bank account | **HIGH** | 4 |
| 15 | WooCommerce Keys Not Breaking Creation | Store creates without WooCommerce env vars set — the integration must be completely isolated from core provisioning | **CRITICAL** | 3 |
| 16 | Subdomain Assignment | New store gets unique subdomain, no collision with existing stores | **HIGH** | 3 |
| 17 | Onboarding Flag | is_onboarded flag set to false on creation, set to true after first login | **MEDIUM** | 2 |

---

## Module 3: POS Terminal (High-Speed Retail)

The core revenue-generating screen. Cashiers use this 8 hours a day. Any bug here is immediate business impact.

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 18 | Product Search (OmniSearch) | Search by Name, SKU, Barcode, Serial, Category — all return correct results | **CRITICAL** | 10 |
| 19 | Add to Cart | Product added, quantity adjusts, line total calculated correctly, cart total updates | **CRITICAL** | 6 |
| 20 | Multi-Tab (10 simultaneous customers) | Open 10 tabs, each tab independent cart state, switching tabs preserves data | **HIGH** | 8 |
| 21 | Park & Recall (Hold Bill) | Bill put on hold with note, recalled later, all items preserved | **HIGH** | 4 |
| 22 | Keyboard Shortcuts (25+) | F1 (search), F2 (qty), F3 (discount), F4 (remove), F5 (price), F11 (customer), CTRL+S, CTRL+P, CTRL+W all fire correctly | **HIGH** | 14 |
| 23 | Cart Rescue (Crash Airbag) | Kill browser tab, reopen — cart is restored from localStorage. Verify for each tab. | **HIGH** | 4 |
| 24 | Senior Mode Toggle | Font increases 40%, high-contrast colors apply, reverts on toggle off | **MEDIUM** | 2 |
| 25 | Secure Profit Peek | Drag down on total reveals margin %, not visible to cashier by default | **LOW** | 2 |
| 26 | Quick Modal (Inline Product Edit) | Edit product price/stock from POS screen, changes reflected in cart immediately (Live Shield) | **HIGH** | 4 |
| 27 | Barcode Scanner Integration | Physical scanner input → product found → added to cart. Serial/IMEI mapping links to transaction. | **HIGH** | 6 |
| 28 | Contextual Qty Update | Scanning small number when item in cart prompts qty update (not new line item) | **MEDIUM** | 3 |
| 29 | Customer Search & Balance | F11 opens customer search, balance/credit limit visible, customer linked to sale | **HIGH** | 4 |
| 30 | Wholesale Pricing | Customer flagged as wholesale gets wholesale price applied automatically | **HIGH** | 3 |
| 31 | POS Featured Products | /pos/products/featured loads without SQL error (GROUP BY / HAVING fix) | **CRITICAL** | 2 |
| 32 | Rate Limiting (300/min) | POS endpoints respect 300 req/min per tenant limit, 429 returned gracefully | **MEDIUM** | 3 |
| 33 | DRM Offline Lock | First run requires internet check. Monthly check-in gate. After 30 days offline: OfflineLockScreen appears. | **HIGH** | 5 |

---

## Module 4: Payment Processing & Checkout

Money flows through here. Every error is a financial inconsistency. This must be near-zero-defect.

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 34 | POS Pay Button (Full Payment) | Pay button posts sale to backend, party balance updated, journal entry created, stock deducted | **CRITICAL** | 6 |
| 35 | Split Payments | Cash 5000 + Bank 2000 + Credit 3000 = 10000 invoice total. All 3 legs recorded. | **CRITICAL** | 5 |
| 36 | Transaction Limit Enforcement | PlanGate::enforce("transactions_per_month") fires correctly. Over-limit returns 422 with upgrade modal, not a 500. | **CRITICAL** | 4 |
| 37 | PaymentController Journal Entry | Every payment creates a journal entry. Verify: Cash account debited, Receivable credited for credit sales. | **CRITICAL** | 5 |
| 38 | Negative Stock Allowance | System setting "stop sale on negative stock" blocks sale when OFF. Passes when setting is ON. | **HIGH** | 4 |
| 39 | Discount Leakage | Item discount + global discount both apply. Net sales (not gross) recorded as revenue. | **HIGH** | 4 |
| 40 | Tax Calculation (Per-Item) | Per-item tax_rate fetched from product. tax_amount = net_amount × rate. invoice_total = net_sales + total_tax. | **HIGH** | 5 |
| 41 | Custom Charges (Delivery/Shipping) | Custom charges defined in settings appear at checkout and are included in invoice_total | **MEDIUM** | 3 |
| 42 | Charity Deduction | Charity amount deducted from till, journal entry posted to charity expense account | **MEDIUM** | 2 |

---

## Module 5: Financial Engine & Double-Entry Accounting

Most complex part of VenQore. Every number on every report comes from here. Had 9 documented critical bugs, a full forensic audit, and a complete rewrite.

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 43 | Sale Waterfall Calculation | gross_amount → discount_amount → net_amount per line. subtotal_gross → net_sales → total_tax → invoice_total at header. All 13 columns stored correctly. | **CRITICAL** | 8 |
| 44 | FIFO Stock Deduction | FifoService::deductAndRecord() consumes oldest batches first. sale_item_batches paper trail created. COGS calculated from batch cost (not current cost_price). | **CRITICAL** | 8 |
| 45 | SaleObserver Deadbolt | Attempt to edit any financial column on a posted sale throws RuntimeException. DB transaction rolls back. No partial state. | **CRITICAL** | 5 |
| 46 | Reversal Engine | Cancel/return a posted sale → counter journal entry created → FIFO batches restored → stock incremented → trial balance still zeros out | **CRITICAL** | 6 |
| 47 | Revenue Recognition (posted_at) | Revenue recognized at posting (accrual), not at payment. posted_at timestamp set. payment_status is UI badge only. | **HIGH** | 4 |
| 48 | Trial Balance | Reads exclusively from journal_items. Sum of all debits = sum of all credits. Date-range filter works. | **CRITICAL** | 5 |
| 49 | Balance Sheet | Assets = Liabilities + Equity. "As Of" date picker returns correct historical snapshot. Ledger-driven (not cached columns). | **CRITICAL** | 5 |
| 50 | Cash in Hand (Single Formula) | SUM(debit) - SUM(credit) from journal_items for account 1000. Same number on Dashboard, Payments page, and Bank account view. | **CRITICAL** | 4 |
| 51 | Receivables / Payables | Both read from ledger (Account 1200 / 2000), NOT from parties.current_balance. Dashboard matches Reports page. | **CRITICAL** | 4 |
| 52 | Purchase → FIFO Batch Creation | PurchaseController::store() calls FifoService::receiveBatch(). New inventory_batch row created with correct cost and quantity. | **CRITICAL** | 4 |
| 53 | Purchase Returns (Ledger Entry) | Purchase return posts Payables debit + Inventory credit journal entry. Payables figure updates correctly. | **HIGH** | 4 |
| 54 | Expense Double-Count Prevention | Expense posted via journal only. No secondary manual deduction from cash. Cash in Hand decrements once. | **HIGH** | 3 |
| 55 | Fixed Asset Depreciation | RunDepreciation command: daily value reduction, 6000-DEP debit + Asset credit. Book value approaches 0 over time. | **HIGH** | 4 |
| 56 | Bank Reconciliation (Truth Checker) | Upload CSV bank statement → auto-match against recorded payments → unmatched items highlighted | **HIGH** | 5 |
| 57 | Variance Account (3999) | Historical records with math discrepancies absorbed into Account 3999. Trial balance still zeros. | **MEDIUM** | 3 |
| 58 | Fund Management | Owner capital transfer, withdrawal, and adjustment all post correct journal entries | **MEDIUM** | 3 |
| 59 | Debit & Credit Notes | Customer return → Credit Note → reduces receivable. Supplier return → Debit Note → reduces payable. | **HIGH** | 4 |

---

## Module 6: Sales Ecosystem (5 Transaction Types)

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 60 | B2B Invoice Create | Create 50+ item invoice, split payment, serial number ledger, party khata status visible | **HIGH** | 6 |
| 61 | Invoice Edit (Immutability) | Posted invoice returns HTTP 403 on edit attempt. Draft invoice editable. | **CRITICAL** | 3 |
| 62 | Invoice Cancel / Return | Cancel: stock restored, journal reversed, party balance corrected. Return: partial return pro-rates net_amount. | **CRITICAL** | 5 |
| 63 | Quotation / Proposal | "Valid Until" date shown. One-click "Convert to Sale" transfers all data to live invoice without data loss. | **HIGH** | 4 |
| 64 | Sales Orders (Pre-Sales) | Stock-Hold logic reserves inventory. Stock-Check OFF mode allows ordering missing items. | **HIGH** | 3 |
| 65 | Recurring Invoice Automation | Daily/weekly/monthly/quarterly schedule creates invoices automatically. Cron job fires on schedule. | **HIGH** | 4 |
| 66 | Product History Tab | GET /inventory/{id}/history returns merged sales + purchases for product. Sorted by date desc. | **MEDIUM** | 3 |
| 67 | Live Shield (Cross-Tab Sync) | Edit product price in Tab A → POS cart in Tab B updates automatically without reload. amd:product-updated event fires. | **HIGH** | 4 |

---

## Module 7: Procurement & Purchase Management

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 68 | Purchase Invoice Create | Create purchase, cost_price NOT overwritten (FIFO batch created instead), stock incremented via FIFO receiveBatch() | **CRITICAL** | 5 |
| 69 | Partial Receiving | Order for 100 units, receive 60 → 60 received, 40 outstanding. Second receipt closes order. | **HIGH** | 4 |
| 70 | Batch & Expiry Tracking | Batch number + manufacture date + expiry date stored on inventory_batch row | **HIGH** | 3 |
| 71 | Purchase Order Lifecycle | "Ordered" status → receive → "Received" status. One-click "Mark Received" updates stock immediately. | **HIGH** | 4 |
| 72 | Purchase Order UI Tag Fix | CreatePurchaseOrder.jsx renders without tag mismatch error | **CRITICAL** | 2 |
| 73 | Supplier Cost Tracking | Multiple purchases from same supplier at different prices → FIFO batches store each cost separately | **HIGH** | 3 |

---

## Module 8: Inventory, Warehousing & Stock Management

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 74 | Multi-Warehouse (Godowns) | Products exist in multiple warehouses, stock counts per warehouse accurate, transfers logged | **HIGH** | 5 |
| 75 | Stock Transfers | Transfer voucher created, source warehouse decremented, destination incremented, no net stock change | **HIGH** | 4 |
| 76 | Stock Take (Physical Audit) | Enter physical count, system computes discrepancy, discrepancy reason logged (Damage/Theft) | **HIGH** | 4 |
| 77 | Serial & IMEI Lifespan | Device tracked from Purchase → Store → Sale → Return. Full audit trail in serial ledger. | **HIGH** | 5 |
| 78 | Barcode Label Factory | Generate printable labels with price, SKU, barcode. Custom branding on label. | **MEDIUM** | 3 |
| 79 | FIFO Integrity (autoHealStock REMOVED) | autoHealStockIntegrity() must NOT run — it corrupts multi-batch FIFO. Confirm disabled/removed. | **CRITICAL** | 3 |
| 80 | Inventory Update Isolation | Editing product name/price via ProductModal does NOT reset stock to 0. Stock field stripped from edit request. | **CRITICAL** | 3 |
| 81 | Min Stock Alerts | Product with qty below min_stock appears in Low Stock dashboard widget | **MEDIUM** | 2 |
| 82 | Negative Stock Tracking | With negative stock allowed: sale proceeds, stock goes negative, shown correctly on reports | **HIGH** | 3 |

---

## Module 9: Manufacturing ("The Cookbook")

The Garam Masala Logic — auto-assembly on sale when stock runs out. A VenQore differentiator.

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 83 | Bill of Materials (BOM) | Recipe defined: Garam Masala = 0.05kg Zeera + 0.02kg Pepper per unit | **HIGH** | 3 |
| 84 | Mode A: Auto-Assembly (Make Now) | Sell 15 units with 10 in stock → 10 from stock, 5 auto-manufactured → raw materials deducted for 5 units only | **CRITICAL** | 5 |
| 85 | Mode B: Ready Made (Pre-Stock) | Sell from pre-made stock first, no auto-deduction triggered | **HIGH** | 3 |
| 86 | Production Simulator (Stress Test) | Enter target production qty → system shows if enough raw material exists | **MEDIUM** | 3 |
| 87 | Production Run Resource | Admin creates production run → raw materials deducted in bulk → finished goods added to Available stock | **HIGH** | 4 |
| 88 | Recipe Versioning | Past sales retain the BOM that existed at time of sale (immutable history) | **HIGH** | 3 |
| 89 | Variant FIFO | Products with size/color variants track separate FIFO cost pools per variant | **HIGH** | 4 |

---

## Module 10: WooCommerce Integration

Integration must be completely isolated from core flows — any failure here must be caught WITHOUT affecting other modules.

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 90 | Webhook Receiver | WooCommerce POSTs order to /woocommerce/webhook → party auto-created → stock deducted → transaction recorded | **HIGH** | 5 |
| 91 | Webhook Isolation | Webhook endpoint fails (bad credentials) → error caught → NO side effect on store creation, sale creation, or any other flow | **CRITICAL** | 4 |
| 92 | SKU Matching | WooCommerce order item SKU matches VenQore product SKU → correct product deducted | **HIGH** | 3 |
| 93 | Stock Sync Command (5-min Cron) | SyncStockToWooCommerce runs → only "dirty" products sent → batch API update → dirty flag cleared | **HIGH** | 4 |
| 94 | Web Customer Auto-Creation | "Web Customer" party created on first webhook, reused on subsequent orders (not duplicated) | **HIGH** | 3 |
| 95 | Missing ENV Graceful Failure | WOOCOMMERCE_KEY not set → sync command exits cleanly with log message, no exception thrown | **CRITICAL** | 3 |
| 96 | Webhook Signature Verification | Tampered webhook payload rejected (signature mismatch) | **HIGH** | 2 |

---

## Module 11: Billing, Plans & AppSumo LTD

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 97 | AppSumo Code Redemption (/redeem) | Valid code → plan assigned → store provisioned → success page. Invalid code → error. Duplicate code → rejected. | **CRITICAL** | 6 |
| 98 | LTD Plan Tier Mapping | ltd_1, ltd_2, ltd_3 map correctly. Code stacking: 2 codes → ltd_2. plan_limits JSON written to tenant. | **CRITICAL** | 5 |
| 99 | Plan Usage Banner (80%/95%/100%) | Banner appears at 80% limit usage (amber), 95% (orange), 100% (red). Dismisses correctly. | **HIGH** | 4 |
| 100 | UpgradeModal LTD CTA | LTD user < ltd_3 sees "Stack Another AppSumo Code". LTD user at ltd_3 sees "Upgrade to Subscription". | **HIGH** | 3 |
| 101 | Lemon Squeezy Webhook | subscription.created → ProvisionTenantJob runs. subscription.updated → plan updated. subscription.cancelled → tenant suspended. | **CRITICAL** | 6 |
| 102 | Trial Reminder Emails | SendTrialReminders command sends email at 3 days before expiry. ProcessExpiredTrials suspends overdue accounts. | **HIGH** | 4 |
| 103 | DB-Driven Plan Management | SuperAdmin creates/edits plan in UI → PlanRepository cache invalidated → new limits enforced immediately | **HIGH** | 4 |
| 104 | Coupon Validation | Valid coupon reduces price. Expired coupon rejected. Single-use coupon rejected on second use. | **HIGH** | 4 |
| 105 | PlanChangeNotifier | Limit changed from SuperAdmin → in-app notification sent to affected tenant. Bell widget shows unread count. | **MEDIUM** | 3 |
| 106 | CleanupDeadAccounts (Monthly Cron) | --dry-run shows what would be deleted. Actual run deletes in 500-row chunks. Active tenants untouched. | **HIGH** | 3 |

---

## Module 12: The Report Factory (38 Reports)

Every number must be ledger-driven (not cached). All 38 reports must be validated against hand-calculated expected values.

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 107 | Profit & Loss Statement | Revenue = SUM(net_sales) from posted sales. COGS from FIFO batches. Gross Profit = Revenue - COGS. Date range filter correct. | **CRITICAL** | 5 |
| 108 | Balance Sheet | Assets = Liabilities + Equity. "As Of" date returns historical state. Journal-driven. | **CRITICAL** | 4 |
| 109 | Trial Balance | All debits = all credits. Zero discrepancy (minus Account 3999 variance). Date-range supported. | **CRITICAL** | 4 |
| 110 | Cash Flow Statement | Operating / Investing / Financing activities. Payments table used (not payment_status flag). | **HIGH** | 4 |
| 111 | Sales Reports (Item-Wise Profit) | Per-product revenue = net_amount. Profit = net_amount - FIFO COGS. Discount leakage visible. | **HIGH** | 4 |
| 112 | Sale Aging (Receivables) | Overdue invoices bucketed by 30/60/90/90+ days. Amount from ledger Account 1200. | **HIGH** | 3 |
| 113 | Stock Valuation Report | Inventory value = SUM(remaining_qty × batch cost_price) from inventory_batches, NOT products.cost_price. | **CRITICAL** | 4 |
| 114 | Low Stock Report | Products below min_stock, filterable by supplier | **HIGH** | 2 |
| 115 | Stock Movement History | Full in/out log per product including purchase, sale, transfer, adjustment | **HIGH** | 3 |
| 116 | Expiry Report | Batches expiring in next 30/60/90 days. Expired batches highlighted. | **HIGH** | 3 |
| 117 | Party Statement (PDF Export) | Customer/supplier ledger, opening balance, all transactions, closing balance. PDF downloadable. | **HIGH** | 4 |
| 118 | Tax Reports (GST/VAT) | Total taxable base, total tax collected, net tax liability for period. Matches SUM(tax_amount) from sale_items. | **HIGH** | 3 |
| 119 | Staff Efficiency | Total Sales ÷ Total Hours Worked per staff member. Requires attendance module data. | **MEDIUM** | 3 |
| 120 | Payment Method Popularity | Pie chart: Cash vs Card vs Bank vs Credit. SUM per method from payments table. | **MEDIUM** | 2 |
| 121 | Revenue Heatmap (30 days) | Chart uses net_sales per day. No gross total. Peak days correct. | **MEDIUM** | 2 |
| 122 | Bill-Wise Profit Report | Per invoice: revenue, COGS, gross margin. Shows unprofitable invoices. | **MEDIUM** | 3 |
| 123 | Stock Aging Report | Inventory batches by age since receipt. Old stock flagged. | **MEDIUM** | 2 |
| 124 | Discount Leakage Report | SUM(discount_amount) per product, per customer, per period | **MEDIUM** | 2 |

---

## Module 13: Adaptive Dashboard System

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 125 | Widget Layout Persistence | User drags widgets to new positions → layout saved to user_preferences → same layout on next login | **HIGH** | 3 |
| 126 | Today's Revenue Card | Shows SUM(net_sales) for today from posted sales only. Not gross. Not including tax. | **CRITICAL** | 3 |
| 127 | Cash in Hand Widget | Real-time: SUM(debit) - SUM(credit) from journal_items WHERE account_id = 1000. Same as Payments page. | **CRITICAL** | 3 |
| 128 | Stock Valuation Widget | Uses inventory_batches cost (not products.cost_price). Reflects FIFO valuation. | **CRITICAL** | 3 |
| 129 | Low Stock Widget | Count of products below min_stock. Clicking navigates to Low Stock Report. | **HIGH** | 2 |
| 130 | Net Receivables vs Payables | From ledger Accounts 1200 and 2000. Both numbers match Reports page. | **CRITICAL** | 3 |
| 131 | Executive Toggle (Simple vs Analytics) | Toggle switches between simplified operational view and full financial analytics | **MEDIUM** | 2 |
| 132 | Chart Data (30-day Revenue) | Chart line uses net_sales per day. No gross. Holiday/zero days shown correctly. | **HIGH** | 2 |
| 133 | Widget Library (Add/Remove) | User opens Widget Library, adds a new widget, it appears in grid, can be removed | **MEDIUM** | 2 |

---

## Module 14: AI Growth Engine (The Three Brains)

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 134 | Retention Brain | RunGrowthEngine command: calculates ADBO per customer, predicts next visit date, creates AiRecommendation record | **HIGH** | 4 |
| 135 | Forecast Brain | Cross-references expected visits with stock levels, generates "stock-out risk" alerts for specific products | **HIGH** | 3 |
| 136 | Churn Brain | Regular customer who missed 2+ purchase cycles flagged. Alert visible in Growth Dashboard. | **HIGH** | 3 |
| 137 | Opportunity Intelligence Panel (5 Tabs) | Intelligence / Action / History / Forecast / Notes tabs all load. AI narrative generates. WhatsApp/Proposal actions work. | **HIGH** | 5 |
| 138 | Natural Language Query | Plain English query ("Who was my top customer last month?") returns correct answer | **MEDIUM** | 3 |
| 139 | WhatsApp/SMS Generation | Invoice delivery message generated. Payment reminder generated. Correct customer phone used. | **MEDIUM** | 3 |
| 140 | Daily Cron (09:00) | RunGrowthEngine scheduled daily at 09:00. Runs without exception. Stale recommendations updated. | **HIGH** | 2 |

---

## Module 15: Parties, Khata & Ledger

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 141 | Customer Create / Edit / Delete | CRUD works, opening balance creates journal entry (OBE 7000 account), soft-delete moves to Recycle Bin | **HIGH** | 4 |
| 142 | Supplier Create / Edit | CRUD works, opening balance (payable) creates correct journal entry | **HIGH** | 3 |
| 143 | Current Balance Accuracy | Party balance = ledger-driven calculation, NOT parties.current_balance cached column. Matches Party Statement report. | **CRITICAL** | 4 |
| 144 | Credit Limit Enforcement | Customer over credit limit → sale blocked with clear message. Setting credit limit to unlimited bypasses check. | **HIGH** | 3 |
| 145 | Party Statement PDF | Opening balance + all transactions + closing balance. PDF exported correctly. | **HIGH** | 3 |
| 146 | Receivables (Green) / Payables (Red) | UI indicators: Customer balance asset (green). Supplier balance liability (red). Never swapped. | **HIGH** | 2 |
| 147 | Payment Terms | Net 30 / Net 60 visible on invoices and party ledger | **MEDIUM** | 2 |

---

## Module 16: Staff, Attendance & Workforce

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 148 | Staff Check-In / Check-Out | AttendanceContext check-in/out records timestamp. Gap detected if session exceeds expected hours. | **HIGH** | 4 |
| 149 | Gap Detection & Approval | Manager sees unexplained gap, can approve or reject with reason. approveGap / rejectGap backend routes work. | **HIGH** | 3 |
| 150 | Kiosk Lockdown | Manager PIN required to exit POS. Wrong PIN rejected. Lockout after N attempts. | **HIGH** | 3 |
| 151 | Hardware Heartbeat | VenQore Station shell reports terminal online/offline status. Power-cut vs manual shutdown distinguishable. | **MEDIUM** | 3 |
| 152 | Staff Summary | Per-staff: avg transaction value, last-seen, total sales in period | **MEDIUM** | 2 |
| 153 | Salary Ledger Path | Salary payment → single standard journal entry. No dual-path. | **HIGH** | 3 |

---

## Module 17: System Settings & Configuration

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 154 | Business Profile Save | Company name, address, logo saved → reflected on all invoices and receipts | **HIGH** | 3 |
| 155 | Tax Configuration (GST/VAT) | Global rate set, tax-inclusive vs tax-exclusive toggle, reflects on all new sales | **HIGH** | 3 |
| 156 | Currency & Localization | Switch PKR → USD → EUR → all formatting updates. No hardcoded currency symbols. | **HIGH** | 3 |
| 157 | Module Glass Door (Enable/Disable) | Disable AI module → growth engine menu hidden. Disable Manufacturing → recipe menu hidden. | **HIGH** | 4 |
| 158 | Stop Sale on Negative Stock | Toggle ON → POS blocks sale of out-of-stock item. Toggle OFF → sale proceeds. | **CRITICAL** | 3 |
| 159 | Custom Charges Factory | Add delivery charge → appears on checkout. Remove → disappears. | **MEDIUM** | 2 |
| 160 | Recycle Bin | Soft-deleted records appear in Recycle Bin. One-click restore brings them back. | **HIGH** | 3 |
| 161 | Backup System | Manual backup creates DB dump. Automated backup scheduled. Email delivery option works. | **HIGH** | 3 |
| 162 | Installer (First-Time Setup) | Fresh install: pre-flight PHP 8.2 check, env setup, DB migration, admin account creation | **HIGH** | 4 |
| 163 | Updater (Remote Update) | UpdaterController extracts package without "Package Not Found" error. Migration runs. No data loss. | **HIGH** | 3 |

---

## Module 18: Offline Mode, DRM & VenQore Station Shell

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 164 | Offline Product Search (Dexie.js) | Kill server → POS search still works from IndexedDB cache → results appear | **HIGH** | 4 |
| 165 | Sync Engine (Catalog Hydration) | SyncService loads full product catalog into Dexie.js on startup. Update detected → cache refreshed. | **HIGH** | 3 |
| 166 | Offline Lock Screen | After 30 days offline → OfflineLockScreen.jsx appears. Only dismissed by successful internet check-in. | **HIGH** | 3 |
| 167 | Electron Shell (VenQore Station) | Shell loads web app. Silent printing to thermal printer. Cash drawer signal fires on sale completion. | **HIGH** | 4 |
| 168 | Shell Real-Time Monitoring | Heartbeat loop shows actual printer status (not mock "Epson T88"). Online/offline indicator accurate. | **MEDIUM** | 3 |
| 169 | UUID Collision Prevention | Offline-created sales use UUIDs. When synced to cloud, no collision with server-generated records. | **HIGH** | 3 |

---

## Module 19: VenSynQ & Multi-Store Sync

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 170 | VenSynQ Stock Push | Changes in Store A propagate to Store B within sync interval | **HIGH** | 4 |
| 171 | VenSynQ Conflict Resolution | Simultaneous edits in two stores resolved without data corruption | **HIGH** | 3 |
| 172 | VenSynQ Party Sync | Customer record updated in one store synced to other stores in same account | **MEDIUM** | 3 |

---

## Module 20: SuperAdmin Platform Controls

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 173 | Platform-Wide Tenant Listing | SuperAdmin sees all tenants, status, plan, last active | **HIGH** | 3 |
| 174 | Tenant Suspension / Reactivation | SuperAdmin suspends tenant → tenant gets 403. SuperAdmin reactivates → tenant passes through. | **CRITICAL** | 3 |
| 175 | Platform Diagnostics | PlatformController returns system health without exposing tenant data cross-tenant | **HIGH** | 3 |
| 176 | Owner Impersonation Gate | SuperAdmin can impersonate tenant owner. Normal user cannot access impersonation route. | **HIGH** | 3 |
| 177 | Inactivity Lock & PIN Gate | Platform owner PIN gate works. Wrong PIN rejected. | **HIGH** | 2 |
| 178 | Destructive System Reset Safeguards | Multi-factor PIN verification required before destructive reset. Single PIN alone insufficient. | **CRITICAL** | 3 |

---

## Module 21: Real Workflow Integration Tests ⚠️ NEW — THE MISSING PIECE

**This entire module is new.** These are end-to-end tests that simulate what a real user does every day. If these pass, you can confidently deploy. If these fail, nothing else matters.

Every test below makes a real HTTP request, hits real controllers, goes through real middleware, touches the real database, and asserts the final state of multiple tables simultaneously.

### 21A: The Complete Sale Workflow

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 179 | **Full POS Sale — Cash Payment** | POST /api/sale with 2 products → assert: sale row created, 2 sale_items created, stock deducted from inventory_batches, cash journal entry created (debit cash 1000, credit revenue 4000), today's revenue widget returns correct amount | **CRITICAL** | 1 test, 8 assertions |
| 180 | **Full POS Sale — Credit (Khata)** | Complete sale on credit → assert: receivable journal entry created (debit Account 1200, credit revenue 4000), party balance increases by invoice total, cash in hand unchanged | **CRITICAL** | 1 test, 6 assertions |
| 181 | **Full POS Sale — Split Payment** | Cash 3000 + Bank 2000 for 5000 invoice → assert: 2 payment rows created, 2 journal entries (cash debit 3000, bank debit 2000, revenue credit 5000), cash in hand increases by 3000 only | **CRITICAL** | 1 test, 7 assertions |
| 182 | **Sale with Discount** | Product price 1000, 10% item discount → assert: gross_amount=1000, discount_amount=100, net_amount=900 stored in sale_items. Revenue journal entry uses 900, not 1000. | **CRITICAL** | 1 test, 5 assertions |
| 183 | **Sale with Tax** | Product with 17% tax → assert: tax_amount = net_amount × 0.17, invoice_total = net_sales + total_tax, tax journal entry created to tax payable account | **CRITICAL** | 1 test, 5 assertions |
| 184 | **Stock Moves on Sale** | Product has 50 units. Sale for 10 units. Assert: inventory_batches.remaining_qty decreases by 10. Product stock = 40. FIFO batch consumed from oldest first. | **CRITICAL** | 1 test, 4 assertions |
| 185 | **COGS Calculated from FIFO Batch** | Purchase product at 100/unit. Sell at 200/unit. Assert: COGS in P&L = 100 (from FIFO batch), not 200 (not current cost_price). Gross profit = 100. | **CRITICAL** | 1 test, 4 assertions |
| 186 | **Cancel Posted Sale** | Create sale, post it, cancel it → assert: counter journal entry created, stock restored to inventory_batches, party balance returned to original, trial balance still zeros | **CRITICAL** | 1 test, 6 assertions |
| 187 | **Sale Return (Partial)** | Invoice for 10 units at 100 each = 1000. Return 3 units → assert: credit note created for 300, stock increases by 3, receivable decreases by 300 | **CRITICAL** | 1 test, 5 assertions |

### 21B: The Complete Purchase Workflow

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 188 | **Full Purchase — Stock In** | POST /api/purchase with 100 units at 50/unit → assert: inventory_batch row created (qty=100, cost=50), stock increases by 100, payable journal entry (debit inventory 5000, credit payable 2000 account), supplier balance increases by 5000 | **CRITICAL** | 1 test, 6 assertions |
| 189 | **Purchase Does NOT Overwrite Cost Price** | Product currently has cost_price=80. Create purchase at 60/unit → assert: products.cost_price still 80, new inventory_batch.cost_price = 60. FIFO preserves both. | **CRITICAL** | 1 test, 3 assertions |
| 190 | **Pay a Supplier (Clear Payable)** | Supplier owes 5000. Record payment of 3000 cash → assert: payable journal entry (debit Account 2000 by 3000, credit cash 1000 by 3000), supplier balance decreases from 5000 to 2000, cash in hand decreases by 3000 | **CRITICAL** | 1 test, 5 assertions |
| 191 | **Partial Purchase Receiving** | Purchase order for 100 units. Receive 60 → assert: order status = partial, stock +60, payable for 60 units only. Receive remaining 40 → order status = received, stock +40, payable for full amount. | **HIGH** | 1 test, 6 assertions |
| 192 | **Purchase Return to Supplier** | Return 20 units of received goods → assert: inventory_batch.remaining_qty decreases by 20, debit note created, payable decreases by (20 × batch cost), supplier balance decreases | **HIGH** | 1 test, 5 assertions |

### 21C: Money Movements (Cash & Bank)

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 193 | **Receive Money from Customer** | Customer owes 3000. Record received payment of 2000 cash → assert: cash in hand +2000, receivable (Account 1200) -2000, customer balance decreases from 3000 to 1000. Journal: debit cash 1000, credit receivable 1200. | **CRITICAL** | 1 test, 5 assertions |
| 194 | **Record an Expense** | Record utility expense 500 from cash → assert: expense journal entry (debit expense account, credit cash 1000), cash in hand decreases by 500, P&L shows expense, trial balance still zeros | **CRITICAL** | 1 test, 5 assertions |
| 195 | **Add Money to Bank Account** | Deposit 10000 into bank → assert: bank account balance increases by 10000, journal entry created (debit bank account, credit owner equity or cash source), cash in hand decreases if sourced from cash | **HIGH** | 1 test, 4 assertions |
| 196 | **Transfer: Bank → Cash** | Transfer 5000 from Bank to Cash in Hand → assert: bank account balance -5000, cash in hand (Account 1000) +5000, journal entry: debit cash 1000 by 5000, credit bank account by 5000. No revenue created. | **CRITICAL** | 1 test, 5 assertions |
| 197 | **Transfer: Cash → Bank** | Transfer 3000 from Cash to Bank → assert: cash in hand -3000, bank account +3000, journal entry: debit bank, credit cash. Trial balance unchanged. | **CRITICAL** | 1 test, 4 assertions |
| 198 | **Expense Does Not Double-Count** | Record expense via ExpenseController → assert: ONLY 1 journal entry created. Cash in hand decrements ONCE. No duplicate deduction. | **CRITICAL** | 1 test, 3 assertions |

### 21D: Dashboard & Report Accuracy (Numbers Must Match)

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 199 | **Cash in Hand is Consistent Everywhere** | Create known transactions. Then: GET /dashboard → cash_in_hand. GET /payments → cash_total. GET /reports/trial-balance → Account 1000 balance. Assert all three return the exact same number. | **CRITICAL** | 1 test, 3 assertions |
| 200 | **Today's Revenue is Net Not Gross** | Make sale with 10% discount. Revenue widget must show net_sales (after discount), not gross. Assert: widget value = gross - discount. | **CRITICAL** | 1 test, 2 assertions |
| 201 | **Receivables Widget Matches Report** | Create 3 credit sales totaling 15000. Receive payment for 5000. Assert: dashboard receivables widget = 10000. Reports → receivables page = 10000. Same number. | **CRITICAL** | 1 test, 2 assertions |
| 202 | **Stock Valuation Uses FIFO Cost** | Purchase 50 units at 100/unit. Sell 10. Stock valuation widget must = 40 × 100 = 4000 (from FIFO batch cost), NOT 40 × products.cost_price. | **CRITICAL** | 1 test, 2 assertions |
| 203 | **P&L Revenue Equals Sum of Net Sales** | Create 5 sales with known net amounts. GET /reports/profit-loss → revenue field must equal exact sum of those net_amounts. Not gross. Not including tax. | **CRITICAL** | 1 test, 2 assertions |
| 204 | **Trial Balance Always Zeros** | Make 10 different transactions (sales, purchases, payments, expenses). GET /reports/trial-balance → SUM(debit_total) must equal SUM(credit_total) exactly. | **CRITICAL** | 1 test, 1 assertion |
| 205 | **Stock Valuation Report vs FIFO Batches** | Known purchase history. GET /reports/stock-valuation → each product value must match SUM(remaining_qty × cost_price) from inventory_batches directly. | **CRITICAL** | 1 test, 3 assertions |
| 206 | **Tax Report Matches Sale Items** | Sales with known tax amounts. GET /reports/tax → total_tax_collected must equal SUM(tax_amount) from sale_items for the period. | **HIGH** | 1 test, 2 assertions |
| 207 | **Party Balance Matches Ledger** | Customer makes purchases and payments with known amounts. Party balance shown on their profile must equal calculated balance from journal_items for their account. | **CRITICAL** | 1 test, 2 assertions |

### 21E: Quotation & Pre-Sales Workflows

| # | Area | What to Test | Priority | Est. Cases |
|---|---|---|---|---|
| 208 | **Quotation to Sale Conversion** | Create quotation for 3 products. Click "Convert to Sale" → assert: sale created with identical items, prices, party. No duplicate journal entries. Quotation status = converted. | **HIGH** | 1 test, 5 assertions |
| 209 | **Sales Order Stock Hold** | Create sales order for 20 units with stock hold ON → assert: 20 units reserved, available stock = total - 20. Another sale for same product limited to available stock. | **HIGH** | 1 test, 4 assertions |
| 210 | **Pre-Sale to Invoice** | Create sales order. Convert to invoice. Confirm stock hold released and actual FIFO deduction made. Assert no double-deduction. | **HIGH** | 1 test, 4 assertions |

---

## Current Test Coverage Status

| Module | Tests Written | Tests Needed | Coverage |
|---|---|---|---|
| Module 01 — Auth & Tenancy | 10 | 10 | ✅ Good |
| Module 02 — Store Provisioning | 9 | 9 | ✅ Good |
| Module 03 — POS Terminal | 4 | 15 | ⚠️ Partial |
| Module 04 — Payment Processing | 5 | 12 | ⚠️ Partial |
| Module 05 — Financial Engine | 20 | 20 | ✅ Good |
| Module 06 — Sales Ecosystem | 5 | 10 | ⚠️ Partial |
| Module 07 — Procurement | 6 | 8 | ⚠️ Partial |
| Module 08 — Inventory | 5 | 10 | ⚠️ Partial |
| Module 09 — Manufacturing | 0 | 8 | ❌ Missing |
| Module 10 — WooCommerce | 5 | 7 | ⚠️ Partial |
| Module 11 — Billing & AppSumo | 5 | 12 | ⚠️ Partial |
| Module 12 — Reports | 4 | 18 | ❌ Critical gap |
| Module 13 — Dashboard | 4 | 9 | ⚠️ Partial |
| Module 14 — AI Engine | 0 | 7 | ❌ Missing |
| Module 15 — Parties & Ledger | 2 | 7 | ⚠️ Partial |
| Module 16 — Staff & Attendance | 2 | 6 | ⚠️ Partial |
| Module 17 — Settings | 0 | 10 | ❌ Missing |
| Module 18 — Offline & DRM | 0 | 6 | ❌ Missing |
| Module 19 — VenSynQ | 0 | 3 | ❌ Missing |
| Module 20 — SuperAdmin | 0 | 6 | ❌ Missing |
| **Module 21 — Real Workflows** | **0** | **32** | **❌ CRITICAL GAP** |
| **TOTAL** | **73** | **214** | **34% covered** |

---

## The IDE Prompt — Paste This Into Your AI Coding Assistant

**Copy everything below and paste it into Cursor, Windsurf, or your IDE's AI chat.**

You are a senior Laravel test engineer. Your job is to write a complete PHPUnit/Pest feature test suite for VenQore — a multi-tenant SaaS ERP/POS system built with Laravel + Inertia.js + React.

IMPORTANT RULE: Do NOT write all tests at once. Work through each module one at a time. After each module, stop and ask me if I want to continue.

STEP 1 — Before writing any tests, run these commands and read the output:
- php artisan route:list --json
- find app/Http/Controllers -name "*.php" | head -60
- cat app/Models/Tenant.php
- cat app/Http/Middleware/TenantMiddleware.php
- cat app/Services/PlanGate.php
- cat app/Http/Controllers/StoreController.php
- cat app/Http/Controllers/V3/SaleController.php
- cat app/Services/FifoService.php
- cat app/Observers/SaleObserver.php
- cat app/Services/AccountingService.php

STEP 2 — Set up the test environment:
- Check if tests/Feature/ exists. If not, create it.
- Check if a Tenant factory exists in database/factories/. If not, create one.
- Create a base TestCase that: (a) creates 2 test tenants, (b) sets the subdomain header so TenantMiddleware resolves, (c) provides actingAsOwner(), actingAsCashier(), actingAsSuperAdmin() helper methods, (d) provides helper methods: createProduct($attrs), createParty($attrs), createPurchase($product, $qty, $cost), completeSale($items, $paymentMethod).

STEP 3 — Write tests module by module. Start with Module 21 (Real Workflow Integration Tests) — these are the highest priority gap.

MODULE 21A: Full Sale Workflow (do this first — highest business risk)

test_full_pos_sale_cash_payment:
- Create store, product with 50 units in stock at cost 100, cashier user
- POST to sale endpoint with 10 units at price 200, payment method = cash
- Assert: HTTP 200/201
- Assert: sales table has 1 new row with correct totals
- Assert: sale_items has 1 row with qty=10, net_amount=2000
- Assert: inventory_batches.remaining_qty decreased by 10
- Assert: journal_items has debit on account 1000 (cash) for 2000
- Assert: journal_items has credit on account 4000 (revenue) for 2000
- Assert: /dashboard cash_in_hand increased by 2000

test_stock_moves_correctly_on_sale:
- Create product, purchase 50 units (FIFO batch created)
- Sell 15 units
- Assert: FIFO batch remaining_qty = 35
- Assert: sale_item_batches has record linking sale to batch

test_cancel_posted_sale_reverses_everything:
- Create and post a sale
- Cancel it
- Assert: counter journal entry with swapped debits/credits
- Assert: FIFO batch remaining_qty restored
- Assert: trial balance SUM(debit) = SUM(credit)

test_cash_in_hand_same_on_dashboard_and_payments_page:
- Create known cash transactions
- GET /dashboard → extract cash_in_hand value
- GET /payments → extract cash total
- Assert both values are identical

test_trial_balance_zeros_after_all_transaction_types:
- Make sale, purchase, expense, receive payment, pay supplier
- GET /reports/trial-balance
- Assert SUM(all debits) === SUM(all credits) exactly

MODULE 21B: Purchase Workflow

test_full_purchase_creates_fifo_batch_and_increases_stock
test_purchase_does_not_overwrite_product_cost_price
test_pay_supplier_decreases_payable_and_cash
test_purchase_return_decreases_stock_and_payable

MODULE 21C: Money Movements

test_receive_payment_from_customer_clears_receivable
test_expense_decreases_cash_in_hand_once_only
test_bank_to_cash_transfer_moves_money_not_creates_revenue
test_cash_to_bank_transfer_moves_money_not_creates_revenue

MODULE 21D: Report Accuracy

test_pl_revenue_equals_sum_of_net_sales_not_gross
test_stock_valuation_uses_fifo_batch_cost_not_product_cost_price
test_tax_report_matches_sum_of_sale_item_tax_amounts
test_party_balance_matches_ledger_calculation

FOR EACH TEST:
- Use RefreshDatabase trait
- Create realistic data with factories
- Use assertDatabaseHas / assertDatabaseMissing
- For financial tests: calculate expected values by hand in the test and assert exact equality
- NEVER assert "greater than 0" — always assert the exact expected value
- Name tests: test_[what_should_happen]

ISOLATION RULE: Every test must be completely independent. No shared state.

Start with Module 21A test_full_pos_sale_cash_payment. Show me the complete test file. Write real, runnable code — no placeholder comments.

---

## Quick Reference: Critical Checks Before Every Deploy

| # | Area | What to Test | Priority |
|---|---|---|---|
| ✓ | Store Creation | Create a new test store. Did it succeed? | **CRITICAL** |
| ✓ | Tenant Isolation | Can Tenant A's user see Tenant B's products? (Must be NO) | **CRITICAL** |
| ✓ | POS Sale | Complete a sale from POS. Did stock deduct? Did journal entry appear? Did cash move? | **CRITICAL** |
| ✓ | Trial Balance | Open Trial Balance. Do total debits = total credits? | **CRITICAL** |
| ✓ | Dashboard Numbers | Cash in Hand on Dashboard = Cash in Hand on Payments page? | **CRITICAL** |
| ✓ | Purchase | Create a purchase. Did FIFO batch create? Did stock increase? | **CRITICAL** |
| ✓ | Receive Payment | Receive money from customer. Did receivable decrease? Did cash increase? | **CRITICAL** |
| ✓ | P&L Report | Does revenue = sum of net_sales (not gross)? | **CRITICAL** |
| ✓ | WooCommerce Isolation | Is WooCommerce configured? If not, does the system still work? | **CRITICAL** |
| ✓ | Laravel Log | tail storage/logs/laravel.log — any new ERROR lines? | **CRITICAL** |

*VenQore Test Audit Document — Updated May 2026*
*Coverage: 73/960+ test cases written (34%). Module 21 (Real Workflows) is the critical next priority.*

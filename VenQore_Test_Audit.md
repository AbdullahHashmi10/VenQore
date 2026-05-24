**VENQORE ERP/POS**

**Complete System Test Audit Document**

What needs to be tested, how, and what the full scope of QA looks like

| **20** Major Modules | **210** Test Areas | **860+** Estimated Test Cases |
| --- | --- | --- |
| **12** Critical Risk Areas | **38** Reports to Validate | **5** Automated Flows |

*Generated: May 2026  |  VenQore SaaS Multi-Tenant Edition*

# **How to Use This Document**

This document is a complete map of everything that must be tested in VenQore before you can confidently deploy any update to production. It does NOT contain the tests themselves — it tells you exactly what areas exist, what each one covers, how many test cases to expect, and what the priority level is.

**Priority Legend:**

- CRITICAL — If this breaks, the system is unusable or loses money. Test before every single deploy.

- HIGH — Core business function. Must pass before any major release.

- MEDIUM — Important feature. Test on feature-specific deploys and weekly regression.

- LOW — Polish/edge case. Test on scheduled QA sprints.

The IDE Prompt at the end of this document is the command you paste into your AI coding assistant. It will read this document + your codebase and generate the actual test files.

# **Module 1: Authentication & Multi-Tenancy**

This is the foundation of the entire SaaS platform. A bug here means cross-tenant data leaks — catastrophic for a commercial product.

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
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

# **Module 2: Store Creation & Provisioning**

This is exactly where your current bug is. Store creation touches: StoreController, PlanGate, TenantMiddleware, AppSumo license check, default seeder, and multiple DB tables simultaneously.

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 11 | Create New Store (Happy Path) | Owner creates store → slug generated → TenantDefaultSeeder runs (22 accounts, 9 settings, 1 warehouse, 6 expense categories, 1 bank account) → success redirect | **CRITICAL** | 5 |
| 12 | Store Limit Enforcement (AppSumo) | LTD Tier 1 blocked at 1 store, Tier 2 at 2, Tier 3 at 4. Attempt to exceed returns PlanLimitException with upgrade modal. | **CRITICAL** | 6 |
| 13 | Slug Uniqueness & Reserved Words | Duplicate slugs rejected, reserved words (admin, billing, api) blocked, special chars sanitized | **HIGH** | 6 |
| 14 | Default Data Seeding | New store gets exactly: 22 accounts, 9 settings rows, 1 default warehouse, 6 expense categories, 1 bank account | **HIGH** | 4 |
| 15 | WooCommerce Keys Not Breaking Creation | Store creates without WooCommerce env vars set — the integration must be completely isolated from the core provisioning flow | **CRITICAL** | 3 |
| 16 | Subdomain Assignment | New store gets unique subdomain, no collision with existing stores | **HIGH** | 3 |
| 17 | Onboarding Flag | is_onboarded flag set to false on creation, set to true after first login | **MEDIUM** | 2 |

# **Module 3: POS Terminal (High-Speed Retail)**

The core revenue-generating screen. Cashiers use this 8 hours a day. Any bug here is immediate business impact.

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
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

# **Module 4: Payment Processing & Checkout**

Money flows through here. Every error is a financial inconsistency. This must be near-zero-defect.

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 34 | POS Pay Button (Full Payment) | Pay button posts sale to backend, party balance updated, journal entry created, stock deducted | **CRITICAL** | 6 |
| 35 | Split Payments | Cash 5000 + Bank 2000 + Credit 3000 = 10000 invoice total. All 3 legs recorded. | **CRITICAL** | 5 |
| 36 | Transaction Limit Enforcement | PlanGate::enforce("transactions_per_month") fires correctly. Over-limit returns 422 with upgrade modal, not a 500. | **CRITICAL** | 4 |
| 37 | PaymentController Journal Entry | Every payment creates a journal entry. Verify: Cash account debited, Receivable credited for credit sales. | **CRITICAL** | 5 |
| 38 | Negative Stock Allowance | System setting "stop sale on negative stock" blocks sale when OFF. Passes when setting is ON. | **HIGH** | 4 |
| 39 | Discount Leakage | Item discount + global discount both apply. Net sales (not gross) recorded as revenue. | **HIGH** | 4 |
| 40 | Tax Calculation (Per-Item) | Per-item tax_rate fetched from product. tax_amount = net_amount × rate. invoice_total = net_sales + total_tax. | **HIGH** | 5 |
| 41 | Custom Charges (Delivery/Shipping) | Custom charges defined in settings appear at checkout and are included in invoice_total | **MEDIUM** | 3 |
| 42 | Charity Deduction | Charity amount deducted from till, journal entry posted to charity expense account | **MEDIUM** | 2 |

# **Module 5: Financial Engine & Double-Entry Accounting**

This is the most complex part of VenQore. It has had 9 documented critical bugs, a full forensic audit, and a complete rewrite. Every number on every report comes from here.

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
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
| 60 | Fixed Asset Purchase | Verify asset acquisition posts DR 1500 (Asset) and CR 1000/1010 (Cash/Bank) through V3 AssetController | **HIGH** | 4 |
| 61 | Fixed Asset Depreciation Posting | Verify V3 DepreciationController posts DR 6600 (Depreciation Expense) and CR 1510 (Accumulated Depreciation) | **HIGH** | 4 |
| 62 | Bad Debt Write-Off | Verify outstanding invoice balance write-off posts DR 6700 (Bad Debt Expense) and CR 1200 (AR), marks invoice as written_off, blocks paid/already written-off invoices, requires manager approval via V3 BadDebtController | **CRITICAL** | 6 |
| 63 | Cheque Bounce / Payment Reversal | Verify V3 BounceController reverses customer payments, posts mirror journal entries, voids allocations, and reopens invoices | **CRITICAL** | 5 |
| 64 | Cash Drawer Shortage Posting | Verify V3 CashShortageController posts DR 6900 (Shortage Expense) and CR 1000 (Cash), requires manager approval and mandatory narration | **HIGH** | 4 |
| 65 | Disaster Inventory Loss | Verify Step 1 of V3 DisasterClaimController deducts inventory FIFO, posts DR 6950 (Disaster Loss) and CR 1100 (Inventory), and stages disaster claim as recovery_pending | **CRITICAL** | 5 |
| 66 | Insurance Recovery Posting | Verify Step 2 of V3 DisasterClaimController posts DR 1000/1010 (Cash/Bank) and CR 6960 (Insurance Recovery) and closes the claim | **CRITICAL** | 5 |
| 67 | Opening Account Balances | Verify V3 OpeningBalanceController posts account opening balances balanced against 7000 OBE | **HIGH** | 5 |
| 68 | Opening Inventory Stock | Verify V3 OpeningBalanceController posts opening inventory, blocks S-055 zero-cost entries, and creates FIFO batches | **CRITICAL** | 5 |
| 69 | OBE Balance Status Monitor | Verify status monitor returns running 7000 balance and warns on non-zero balances | **MEDIUM** | 3 |

# **Module 6: Sales Ecosystem (5 Transaction Types)**

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 70 | B2B Invoice Create | Create 50+ item invoice, split payment, serial number ledger, party khata status visible | **HIGH** | 6 |
| 71 | Invoice Edit (Immutability) | Posted invoice returns HTTP 403 on edit attempt. Draft invoice editable. | **CRITICAL** | 3 |
| 72 | Invoice Cancel / Return | Cancel: stock restored, journal reversed, party balance corrected. Return: partial return pro-rates net_amount. | **CRITICAL** | 5 |
| 73 | Quotation / Proposal | "Valid Until" date shown. One-click "Convert to Sale" transfers all data to live invoice without data loss. | **HIGH** | 4 |
| 74 | Sales Orders (Pre-Sales) | Stock-Hold logic reserves inventory. Stock-Check OFF mode allows ordering missing items. | **HIGH** | 3 |
| 75 | Recurring Invoice Automation | Daily/weekly/monthly/quarterly schedule creates invoices automatically. Cron job fires on schedule. | **HIGH** | 4 |
| 76 | Product History Tab | GET /inventory/{id}/history returns merged sales + purchases for product. Sorted by date desc. Single-click navigates. | **MEDIUM** | 3 |
| 77 | Live Shield (Cross-Tab Sync) | Edit product price in Tab A → POS cart in Tab B updates automatically without reload. amd:product-updated event fires. | **HIGH** | 4 |

# **Module 7: Procurement & Purchase Management**

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 78 | Purchase Invoice Create | Create purchase, cost_price NOT overwritten (FIFO batch created instead), stock incremented via FIFO receiveBatch() | **CRITICAL** | 5 |
| 79 | Partial Receiving | Order for 100 units, receive 60 → 60 received, 40 outstanding. Second receipt closes order. | **HIGH** | 4 |
| 80 | Batch & Expiry Tracking | Batch number + manufacture date + expiry date stored on inventory_batch row | **HIGH** | 3 |
| 81 | Purchase Order Lifecycle | "Ordered" status → receive → "Received" status. One-click "Mark Received" updates stock immediately. | **HIGH** | 4 |
| 82 | Purchase Order UI Tag Fix | CreatePurchaseOrder.jsx renders without tag mismatch error (previously broken) | **CRITICAL** | 2 |
| 83 | Supplier Cost Tracking | Multiple purchases from same supplier at different prices → FIFO batches store each cost separately | **HIGH** | 3 |

# **Module 8: Inventory, Warehousing & Stock Management**

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 84 | Multi-Warehouse (Godowns) | Products exist in multiple warehouses, stock counts per warehouse accurate, transfers logged | **HIGH** | 5 |
| 85 | Stock Transfers | Transfer voucher created, source warehouse decremented, destination incremented, no net stock change | **HIGH** | 4 |
| 86 | Stock Take (Physical Audit) | Enter physical count, system computes discrepancy, discrepancy reason logged (Damage/Theft) | **HIGH** | 4 |
| 87 | Serial & IMEI Lifespan | Device tracked from Purchase → Store → Sale → Return. Full audit trail in serial ledger. | **HIGH** | 5 |
| 88 | Barcode Label Factory | Generate printable labels with price, SKU, barcode. Custom branding on label. | **MEDIUM** | 3 |
| 89 | FIFO Integrity (autoHealStock REMOVED) | autoHealStockIntegrity() must NOT run — it corrupts multi-batch FIFO. Confirm it is disabled/removed. | **CRITICAL** | 3 |
| 90 | Inventory Update Isolation | Editing product name/price via ProductModal does NOT reset stock to 0. Stock field stripped from edit request. | **CRITICAL** | 3 |
| 91 | Min Stock Alerts | Product with qty below min_stock appears in Low Stock dashboard widget | **MEDIUM** | 2 |
| 92 | Negative Stock Tracking | With negative stock allowed: sale proceeds, stock goes negative, shown correctly on reports | **HIGH** | 3 |
| 93 | Unit of Measure (UOM) Conversion Manager | Verify V3 UomConversionController indexes, stores, and blocks deletion of in-use units | **HIGH** | 5 |
| 94 | Volume Price Tiers Overlap Gate | Verify V3 PriceTierController prevents overlapping quantity tiers for a product | **HIGH** | 6 |

# **Module 9: Manufacturing ("The Cookbook")**

The Garam Masala Logic — auto-assembly on sale when stock runs out. This is a VenQore differentiator.

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 95 | Bill of Materials (BOM) | Recipe defined: Garam Masala = 0.05kg Zeera + 0.02kg Pepper per unit | **HIGH** | 3 |
| 96 | Mode A: Auto-Assembly (Make Now) | Sell 15 units with 10 in stock → 10 from stock, 5 auto-manufactured → raw materials deducted for 5 units only | **CRITICAL** | 5 |
| 97 | Mode B: Ready Made (Pre-Stock) | Sell from pre-made stock first, no auto-deduction triggered | **HIGH** | 3 |
| 98 | Production Simulator (Stress Test) | Enter target production qty → system shows if enough raw material exists | **MEDIUM** | 3 |
| 99 | Production Run Resource | Admin creates production run → raw materials deducted in bulk → finished goods added to Available stock | **HIGH** | 4 |
| 100 | Recipe Versioning | Past sales retain the BOM that existed at time of sale (immutable history) | **HIGH** | 3 |
| 101 | Variant FIFO | Products with size/color variants track separate FIFO cost pools per variant | **HIGH** | 4 |

# **Module 10: WooCommerce Integration**

This is the feature that broke your store creation. The integration must be completely isolated from core flows — any failure here must be caught and handled WITHOUT affecting other modules.

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 102 | Webhook Receiver | WooCommerce POSTs order to /woocommerce/webhook → party auto-created → stock deducted → transaction recorded | **HIGH** | 5 |
| 103 | Webhook Isolation | Webhook endpoint fails (bad credentials) → error caught → NO side effect on store creation, sale creation, or any other flow | **CRITICAL** | 4 |
| 104 | SKU Matching | WooCommerce order item SKU matches VenQore product SKU → correct product deducted | **HIGH** | 3 |
| 105 | Stock Sync Command (5-min Cron) | SyncStockToWooCommerce runs → only "dirty" products sent → batch API update → dirty flag cleared | **HIGH** | 4 |
| 106 | Web Customer Auto-Creation | "Web Customer" party created on first webhook, reused on subsequent orders (not duplicated) | **HIGH** | 3 |
| 107 | Missing ENV Graceful Failure | WOOCOMMERCE_KEY not set → sync command exits cleanly with log message, no exception thrown that crashes the queue | **CRITICAL** | 3 |
| 108 | Webhook Signature Verification | Tampered webhook payload rejected (signature mismatch) | **HIGH** | 2 |
| 109 | WooCommerce Zero-Config Connection Creation | Verify connection creates pending connection, site URL normalization, and UUID/setup token generation using WooConnectionController | **HIGH** | 4 |
| 110 | Multi-Connection Connection Setup Panel | Verify setup page renders correct connection parameters and plugin download URLs | **MEDIUM** | 3 |
| 111 | Dynamic WordPress Plugin ZIP Compilation | Verify serving and dynamic ZIP creation with customized venqore-config.php on-the-fly | **CRITICAL** | 5 |
| 112 | Setup Token Connection Handshake | Verify setup handshake updates credentials, sets status active, and dispatches InitialImportJob using WooHandshakeController | **CRITICAL** | 6 |
| 113 | WooCommerce Sync Catalog SKU Scanning | Verify SKU catalog matching and staging of unmatched items in queue | **HIGH** | 4 |
| 114 | Bidirectional Sync Approval & Queue Processor | Verify staged queue items are approved and processed, with inline failsafe sync | **CRITICAL** | 5 |
| 115 | Manual Force Push/Pull & Conflict Resolution | Verify manual force push, force pull, and conflict resolutions (using VenQore or WooCommerce data) using SyncEngine | **CRITICAL** | 6 |

# **Module 11: Billing, Plans & AppSumo LTD**

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 116 | AppSumo Code Redemption (/redeem) | Valid code → plan assigned → store provisioned → success page. Invalid code → error message. Duplicate code → rejected. | **CRITICAL** | 6 |
| 117 | LTD Plan Tier Mapping | ltd_1, ltd_2, ltd_3 map correctly. Code stacking: 2 codes → ltd_2. plan_limits JSON written to tenant. | **CRITICAL** | 5 |
| 118 | Plan Usage Banner (80%/95%/100%) | Banner appears at 80% limit usage (amber), 95% (orange), 100% (red). Dismisses correctly. | **HIGH** | 4 |
| 119 | UpgradeModal LTD CTA | LTD user < ltd_3 sees "Stack Another AppSumo Code". LTD user at ltd_3 sees "Upgrade to Subscription". | **HIGH** | 3 |
| 120 | Lemon Squeezy Webhook | subscription.created → ProvisionTenantJob runs. subscription.updated → plan updated. subscription.cancelled → tenant suspended. | **CRITICAL** | 6 |
| 121 | Trial Reminder Emails | SendTrialReminders command sends email at 3 days before expiry. ProcessExpiredTrials suspends overdue accounts. | **HIGH** | 4 |
| 122 | DB-Driven Plan Management | SuperAdmin creates/edits plan in UI → PlanRepository cache invalidated → new limits enforced immediately | **HIGH** | 4 |
| 123 | Coupon Validation | Valid coupon reduces price. Expired coupon rejected. Single-use coupon rejected on second use. | **HIGH** | 4 |
| 124 | PlanChangeNotifier | Limit changed from SuperAdmin → in-app notification sent to affected tenant. Bell widget shows unread count. | **MEDIUM** | 3 |
| 125 | CleanupDeadAccounts (Monthly Cron) | --dry-run shows what would be deleted. Actual run deletes in 500-row chunks. Active tenants untouched. | **HIGH** | 3 |

# **Module 12: The Report Factory (38 Reports)**

Every number must be ledger-driven (not cached). All 38 reports must be validated against hand-calculated expected values.

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 126 | Profit & Loss Statement | Revenue = SUM(net_sales) from posted sales. COGS from FIFO batches. Gross Profit = Revenue - COGS. Date range filter correct. | **CRITICAL** | 5 |
| 127 | Balance Sheet | Assets = Liabilities + Equity. "As Of" date returns historical state. Journal-driven. | **CRITICAL** | 4 |
| 128 | Trial Balance | All debits = all credits. Zero discrepancy (minus Account 3999 variance). Date-range supported. | **CRITICAL** | 4 |
| 129 | Cash Flow Statement | Operating / Investing / Financing activities. Payments table used (not payment_status flag). | **HIGH** | 4 |
| 130 | Sales Reports (Item-Wise Profit) | Per-product revenue = net_amount. Profit = net_amount - FIFO COGS. Discount leakage visible. | **HIGH** | 4 |
| 131 | Sale Aging (Receivables) | Overdue invoices bucketed by 30/60/90/90+ days. Amount from ledger Account 1200. | **HIGH** | 3 |
| 132 | Stock Valuation Report | Inventory value = SUM(remaining_qty × batch cost_price) from inventory_batches, NOT products.cost_price. | **CRITICAL** | 4 |
| 133 | Low Stock Report | Products below min_stock, filterable by supplier | **HIGH** | 2 |
| 134 | Stock Movement History | Full in/out log per product including purchase, sale, transfer, adjustment | **HIGH** | 3 |
| 135 | Expiry Report | Batches expiring in next 30/60/90 days. Expired batches highlighted. | **HIGH** | 3 |
| 136 | Party Statement (PDF Export) | Customer/supplier ledger, opening balance, all transactions, closing balance. PDF downloadable. | **HIGH** | 4 |
| 137 | Tax Reports (GST/VAT) | Total taxable base, total tax collected, net tax liability for period. Matches SUM(tax_amount) from sale_items. | **HIGH** | 3 |
| 138 | Staff Efficiency | Total Sales ÷ Total Hours Worked per staff member. Requires attendance module data. | **MEDIUM** | 3 |
| 139 | Payment Method Popularity | Pie chart: Cash vs Card vs Bank vs Credit. SUM per method from payments table. | **MEDIUM** | 2 |
| 140 | Revenue Heatmap (30 days) | Chart uses net_sales per day. No gross total. Peak days correct. | **MEDIUM** | 2 |
| 141 | Bill-Wise Profit Report | Per invoice: revenue, COGS, gross margin. Shows unprofitable invoices. | **MEDIUM** | 3 |
| 142 | Stock Aging Report | Inventory batches by age since receipt. Old stock flagged. | **MEDIUM** | 2 |
| 143 | Discount Leakage Report | SUM(discount_amount) per product, per customer, per period | **MEDIUM** | 2 |

# **Module 13: Adaptive Dashboard System**

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 144 | Widget Layout Persistence | User drags widgets to new positions → layout saved to user_preferences → same layout on next login | **HIGH** | 3 |
| 145 | Today's Revenue Card | Shows SUM(net_sales) for today from posted sales only. Not gross. Not including tax. | **CRITICAL** | 3 |
| 146 | Cash in Hand Widget | Real-time: SUM(debit) - SUM(credit) from journal_items WHERE account_id = 1000. Same as Payments page. | **CRITICAL** | 3 |
| 147 | Stock Valuation Widget | Uses inventory_batches cost (not products.cost_price). Reflects FIFO valuation. | **CRITICAL** | 3 |
| 148 | Low Stock Widget | Count of products below min_stock. Clicking navigates to Low Stock Report. | **HIGH** | 2 |
| 149 | Net Receivables vs Payables | From ledger Accounts 1200 and 2000. Both numbers match Reports page. | **CRITICAL** | 3 |
| 150 | Executive Toggle (Simple vs Analytics) | Toggle switches between simplified operational view and full financial analytics | **MEDIUM** | 2 |
| 151 | Chart Data (30-day Revenue) | Chart line uses net_sales per day. No gross. Holiday/zero days shown correctly. | **HIGH** | 2 |
| 152 | Widget Library (Add/Remove) | User opens Widget Library, adds a new widget, it appears in grid, can be removed | **MEDIUM** | 2 |

# **Module 14: AI Growth Engine (The Three Brains)**

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 153 | Retention Brain | RunGrowthEngine command: calculates ADBO per customer, predicts next visit date, creates AiRecommendation record | **HIGH** | 4 |
| 154 | Forecast Brain | Cross-references expected visits with stock levels, generates "stock-out risk" alerts for specific products | **HIGH** | 3 |
| 155 | Churn Brain | Regular customer who missed 2+ purchase cycles flagged. Alert visible in Growth Dashboard. | **HIGH** | 3 |
| 156 | Opportunity Intelligence Panel (5 Tabs) | Intelligence / Action / History / Forecast / Notes tabs all load. AI narrative generates. WhatsApp/Proposal actions work. | **HIGH** | 5 |
| 157 | Natural Language Query | Plain English query ("Who was my top customer last month?") returns correct answer | **MEDIUM** | 3 |
| 158 | WhatsApp/SMS Generation | Invoice delivery message generated. Payment reminder generated. Correct customer phone used. | **MEDIUM** | 3 |
| 159 | Daily Cron (09:00) | RunGrowthEngine scheduled daily at 09:00. Runs without exception. Stale recommendations updated. | **HIGH** | 2 |

# **Module 15: Parties, Khata & Ledger**

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 160 | Customer Create / Edit / Delete | CRUD works, opening balance creates journal entry (OBE 7000 account), soft-delete moves to Recycle Bin | **HIGH** | 4 |
| 161 | Supplier Create / Edit | CRUD works, opening balance (payable) creates correct journal entry | **HIGH** | 3 |
| 162 | Current Balance Accuracy | Party balance = ledger-driven calculation, NOT parties.current_balance cached column. Matches Party Statement report. | **CRITICAL** | 4 |
| 163 | Credit Limit Enforcement | Customer over credit limit → sale blocked with clear message. Setting credit limit to unlimited bypasses check. | **HIGH** | 3 |
| 164 | Party Statement PDF | Opening balance + all transactions + closing balance. PDF exported correctly. | **HIGH** | 3 |
| 165 | Receivables (Green) / Payables (Red) | UI indicators: Customer balance asset (green). Supplier balance liability (red). Never swapped. | **HIGH** | 2 |
| 166 | Payment Terms | Net 30 / Net 60 visible on invoices and party ledger | **MEDIUM** | 2 |

# **Module 16: Staff, Attendance & Workforce**

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 167 | Staff Check-In / Check-Out | AttendanceContext check-in/out records timestamp. Gap detected if session exceeds expected hours. | **HIGH** | 4 |
| 168 | Gap Detection & Approval | Manager sees unexplained gap, can approve or reject with reason. approveGap / rejectGap backend routes work. | **HIGH** | 3 |
| 169 | Kiosk Lockdown | Manager PIN required to exit POS. Wrong PIN rejected. Lockout after N attempts. | **HIGH** | 3 |
| 170 | Hardware Heartbeat | VenQore Station shell reports terminal online/offline status. Power-cut vs manual shutdown distinguishable. | **MEDIUM** | 3 |
| 171 | Staff Summary | Per-staff: avg transaction value, last-seen, total sales in period | **MEDIUM** | 2 |
| 172 | Salary Ledger Path | Salary payment → single standard journal entry. No dual-path (no cash deduction AND no journal simultaneously). | **HIGH** | 3 |
| 173 | Monthly Salary Accrual | Verify payroll accrue creates standard salary accrual entries debits 6100 (Salary Expense) and credits 2400 (Salary Payable) using V3 PayrollController | **HIGH** | 4 |
| 174 | Employee Salary Payment & Advance Deduction | Verify salary payment checks advance balance from 1350, debits 2400 (Payable), and credits 1000/1010 (Cash/Bank) and 1350 (Employee Advances) | **HIGH** | 5 |
| 175 | Final Employee Severance Settlement | Verify final employee settlement accrues severance components (gratuity, notice pay, leave encashment) to 6800/2400, pays out 2400 to cash/bank with advance deductions, and terminates employee using V3 EmployeeSettlementController | **CRITICAL** | 6 |

# **Module 17: System Settings & Configuration**

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 176 | Business Profile Save | Company name, address, logo saved → reflected on all invoices and receipts | **HIGH** | 3 |
| 177 | Tax Configuration (GST/VAT) | Global rate set, tax-inclusive vs tax-exclusive toggle, reflects on all new sales | **HIGH** | 3 |
| 178 | Currency & Localization | Switch PKR → USD → EUR → all formatting updates. No hardcoded currency symbols. | **HIGH** | 3 |
| 179 | Module Glass Door (Enable/Disable) | Disable AI module → growth engine menu hidden. Disable Manufacturing → recipe menu hidden. | **HIGH** | 4 |
| 180 | Stop Sale on Negative Stock | Toggle ON → POS blocks sale of out-of-stock item. Toggle OFF → sale proceeds. | **CRITICAL** | 3 |
| 181 | Custom Charges Factory | Add delivery charge → appears on checkout. Remove → disappears. | **MEDIUM** | 2 |
| 182 | Recycle Bin | Soft-deleted records appear in Recycle Bin. One-click restore brings them back. | **HIGH** | 3 |
| 183 | Backup System | Manual backup creates DB dump. Automated backup scheduled. Email delivery option works. | **HIGH** | 3 |
| 184 | Installer (First-Time Setup) | Fresh install: pre-flight PHP 8.2 check, env setup, DB migration, admin account creation | **HIGH** | 4 |
| 185 | Updater (Remote Update) | UpdaterController extracts package without "Package Not Found" error. Migration runs. No data loss. | **HIGH** | 3 |
| 186 | Self-Healing Missing App Key | Verify bootstrap sequence detects MissingAppKeyException, copies .env.example, generates key, clears config, and redirects | **HIGH** | 4 |
| 187 | Automated Exception Logger | Verify unhandled exceptions (skipping validation, 404, etc.) are caught globally and written to the ErrorLog table with stack traces | **HIGH** | 4 |

# **Module 18: Offline Mode, DRM & VenQore Station Shell**

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 188 | Offline Product Search (Dexie.js) | Kill server → POS search still works from IndexedDB cache → results appear | **HIGH** | 4 |
| 189 | Sync Engine (Catalog Hydration) | SyncService loads full product catalog into Dexie.js on startup. Update detected → cache refreshed. | **HIGH** | 3 |
| 190 | Offline Lock Screen | After 30 days offline → OfflineLockScreen.jsx appears. Only dismissed by successful internet check-in. | **HIGH** | 3 |
| 191 | Electron Shell (VenQore Station) | Shell loads web app. Silent printing to thermal printer. Cash drawer signal fires on sale completion. | **HIGH** | 4 |
| 192 | Shell Real-Time Monitoring | Heartbeat loop shows actual printer status (not mock "Epson T88"). Online/offline indicator accurate. | **MEDIUM** | 3 |
| 193 | UUID Collision Prevention | Offline-created sales use UUIDs. When synced to cloud, no collision with server-generated records. | **HIGH** | 3 |

# **Module 19: VenSynQ Multi-Channel Sync & JIT Fulfillment**

This module covers the advanced multi-marketplace dropshipping synchronization and Just-in-Time inventory fulfillment engine.

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 194 | Universal OAuth Platform Redirect | Verify marketplace connection request stores store_slug in session and redirects to Amazon/TikTok/eBay consent page | **HIGH** | 4 |
| 195 | Universal OAuth Callback | Verify universal callback routes decode state, resolve tenant slug, bind current tenant, swap authorization codes for access/refresh tokens, and assign platform details | **CRITICAL** | 6 |
| 196 | Manual Marketplace Channel Registration | Verify manual channel addition assigns a default warehouse and default fee expense category for estimated channel fee postings | **HIGH** | 4 |
| 197 | Platform Order Live Fetching & Grouping | Verify fetching marketplace orders, grouping items by channel order ID, and processing dropship sales via SmartFulfillmentService | **CRITICAL** | 5 |
| 198 | Dropship Duplication Prevention | Verify that identical platform order IDs are caught at step 0 and do not produce duplicate sales or double ledger entries | **CRITICAL** | 4 |
| 199 | Pre-Save Validation Preview | Verify previewOrderItems endpoint returns cost, profit margins, and warehouse inventory availability before dropship processing | **HIGH** | 4 |
| 200 | Shipping Dispatch & Platform Tracking Sync | Verify marking dropship sale as dispatched, updating tracking carrier locally, and pushing tracking numbers to marketplace API | **CRITICAL** | 5 |
| 201 | Just-in-Time (JIT) Draft Purchase Invoice Approval | Verify JIT fulfillment creates draft purchase invoices, which are approved, supplier costs confirmed, and dropship profit margins recalculated | **CRITICAL** | 6 |
| 202 | Safe Connection Disconnect & Soft-Delete | Verify revoking platform credentials and soft-deleting e-commerce channels | **MEDIUM** | 4 |

# **Module 20: Platform SuperAdmin Command Center & Overrides**

Platform owner and global administrative panel for subscriptions, coupon management, and multi-tenant isolation overrides.

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| 203 | Tenant Plan Limits Override | Verify superadmin can override plan_limits JSON for individual tenants, and PlanGate immediately enforces the overwritten values | **CRITICAL** | 5 |
| 204 | In-App Plan Change Notification | Verify that limit overrides generate in-app alerts and notifications visible in the tenant bell widget | **MEDIUM** | 3 |
| 205 | Dynamic Coupon & Discount Factory | Verify CouponController CRUD and validation of single-use, expiry, and billing discounts | **HIGH** | 5 |
| 206 | DB-Driven Plan Management | Verify superadmin can CRUD plans in SuperAdmin panel, invalidating PlanRepository cache and updating plan enforcements in real-time | **HIGH** | 4 |
| 207 | Platform-Wide Diagnostics & Active Tenant Monitoring | Verify PlatformController dashboard metrics, system reset, and platform health reporting | **MEDIUM** | 4 |
| 208 | Platform Owner Impersonation Gate | Verify SuperAdmin can impersonate store owner, bypass standard auth, with impersonated actions recorded in activity logs | **CRITICAL** | 6 |
| 209 | Platform Inactivity Lock | Verify PlatformOwnerAuthController enforces session inactivity lockdowns, platform PIN verification, and security controls | **HIGH** | 4 |
| 210 | Destructive System Reset Safeguards | Verify that SystemResetController commands for wiping/resetting DB tables require multi-factor PIN verification and are strictly locked to platform owner only | **CRITICAL** | 5 |

# Gaps Found & Added in This Audit Pass

- [Module 5] Added: Fixed Asset Purchase flow using V3 AssetController
- [Module 5] Added: Fixed Asset Depreciation Posting flow using V3 DepreciationController
- [Module 5] Added: Bad Debt Write-off accounting validation and status update using V3 BadDebtController
- [Module 5] Added: Cheque Bounce / Customer Payment Reversal and allocation voiding using V3 BounceController
- [Module 5] Added: Cash Drawer Shortage Posting with manager approval and narration using V3 CashShortageController
- [Module 5] Added: Disaster Inventory Loss Step 1 tracking using V3 DisasterClaimController
- [Module 5] Added: Disaster Insurance Recovery Step 2 posting using V3 DisasterClaimController
- [Module 5] Added: Opening Account Balances balanced against OBE using V3 OpeningBalanceController
- [Module 5] Added: Opening Inventory Stock cost validation and FIFO batch creation using V3 OpeningBalanceController
- [Module 5] Added: OBE Balance running status and balance warnings using V3 OpeningBalanceController
- [Module 8] Added: Unit of Measure (UOM) Conversion Manager index, store, and in-use deletion checks using V3 UomConversionController
- [Module 8] Added: Volume Price Tiers Overlap validation using V3 PriceTierController
- [Module 10] Added: WooCommerce Zero-Config Connection Creation UUID/setup token validation using WooConnectionController
- [Module 10] Added: WooCommerce Connection Setup page Inertia view response and setup token propagation
- [Module 10] Added: Dynamic WordPress Plugin ZIP Compilation and serving with injected venqore-config.php
- [Module 10] Added: Setup Token Connection Handshake active status update and InitialImportJob dispatch using WooHandshakeController
- [Module 10] Added: WooCommerce Sync Catalog SKU matching and staging of unmatched items using WooConnectionController
- [Module 10] Added: Bidirectional Sync queue staging, approval, and inline failsafe sync processing
- [Module 10] Added: WooCommerce Manual Force Push/Pull and Conflict Resolution using SyncEngine
- [Module 16] Added: Employee Monthly Salary Accrual standard journal entry using V3 PayrollController
- [Module 16] Added: Employee Salary Payment, advance balance check, and 1350 credit reduction using V3 PayrollController
- [Module 16] Added: Final Employee Severance Settlement, composite accrual/payment posting, and termination status using V3 EmployeeSettlementController
- [Module 17] Added: Self-Healing Missing App Key bootstrap sequence copying and APP_KEY generation
- [Module 17] Added: Automated Exception Logger recording backend errors and stack trace to ErrorLog table
- [Module 19] Added: VenSynQ Universal OAuth Platform Redirect saving store_slug in session
- [Module 19] Added: VenSynQ Universal OAuth Callback exchange, state decoding, and platform credentials capture using VenSynQController
- [Module 19] Added: VenSynQ Manual Marketplace Channel Creation with default warehouse and fee categories
- [Module 19] Added: VenSynQ Live Sync Order Fetching, grouping by order ID, and dropship invoice generation
- [Module 19] Added: VenSynQ Dropship Duplication Prevention logic
- [Module 19] Added: VenSynQ Order Pre-Save Validation Preview checking stock availability
- [Module 19] Added: VenSynQ Tracking Sync pushing shipping tracking and carriers back to platform APIs
- [Module 19] Added: VenSynQ Just-in-Time (JIT) Draft Purchase Invoice Approval and supplier cost confirmation
- [Module 19] Added: VenSynQ Safe Connection Disconnect and soft delete
- [Module 20] Added: SuperAdmin Tenant Plan Limits Override saving custom plan_limits JSON using TenantOverrideController
- [Module 20] Added: SuperAdmin In-App Plan Change Notification system
- [Module 20] Added: SuperAdmin Dynamic Coupon & Discount Factory validation using CouponController
- [Module 20] Added: SuperAdmin DB-Driven Plan Management invalidating PlanRepository cache using PlanController
- [Module 20] Added: SuperAdmin Platform-Wide Diagnostics and active tenant monitoring using PlatformController
- [Module 20] Added: SuperAdmin Platform Owner Impersonation Gate route access using ImpersonationController
- [Module 20] Added: SuperAdmin Platform Inactivity Lock and PIN gate using PlatformOwnerAuthController
- [Module 20] Added: SuperAdmin Destructive System Reset Safeguards multi-factor PIN verification using SystemResetController

# **The IDE Prompt — Paste This Into Your AI Coding Assistant**

**Copy everything below and paste it into Cursor, Windsurf, or your IDE's AI chat. It will scan your codebase and write the actual test files based on this audit map.**

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

 

STEP 2 — Set up the test environment:

- Check if tests/Feature/ exists. If not, create it.

- Check if a Tenant factory exists in database/factories/. If not, create one.

- Create a base TestCase that: (a) creates 2 test tenants, (b) sets the subdomain header so TenantMiddleware resolves, (c) provides actingAsOwner(), actingAsCashier(), actingAsSuperAdmin() helper methods.

 

STEP 3 — Write tests module by module in this order:

 

MODULE 1: Authentication & Multi-Tenancy (CRITICAL — do this first)

  - test_user_can_login_with_correct_credentials

  - test_user_cannot_login_with_wrong_credentials

  - test_tenant_a_cannot_see_tenant_b_products (THE BIG ONE)

  - test_tenant_a_cannot_see_tenant_b_sales

  - test_tenant_a_cannot_see_tenant_b_parties

  - test_suspended_tenant_gets_403

  - test_cashier_cannot_access_admin_routes

  - test_superadmin_can_access_venqore_routes

  - test_regular_user_cannot_access_venqore_routes

 

MODULE 2: Store Creation & Provisioning (CRITICAL — this is currently broken)

  - test_owner_can_create_store_successfully

  - test_store_creation_seeds_default_accounts (expects 22 accounts)

  - test_store_creation_seeds_default_settings (expects 9 settings)

  - test_store_creation_seeds_default_warehouse

  - test_ltd_tier1_blocked_after_1_store

  - test_ltd_tier2_blocked_after_3_stores

  - test_store_creation_does_not_fail_when_woocommerce_env_not_set

  - test_duplicate_slug_rejected

  - test_reserved_subdomain_blocked

 

MODULE 3: Financial Engine (CRITICAL)

  - test_sale_waterfall_calculates_all_13_columns_correctly

  - test_fifo_deducts_oldest_batch_first

  - test_sale_item_batches_paper_trail_created

  - test_posted_sale_cannot_be_edited (SaleObserver deadbolt)

  - test_cancel_posted_sale_creates_counter_journal_entry

  - test_cancel_restores_fifo_batches

  - test_trial_balance_debits_equal_credits

  - test_cash_in_hand_is_same_on_dashboard_and_payments_page

  - test_receivables_from_ledger_not_cached_column

 

MODULE 4: WooCommerce Isolation (CRITICAL — your current bug category)

  - test_woocommerce_webhook_failure_does_not_affect_store_creation

  - test_woocommerce_webhook_failure_does_not_affect_sale_creation

  - test_missing_woocommerce_env_does_not_throw_exception

  - test_webhook_creates_web_customer_party_once_not_twice

  - test_webhook_deducts_correct_product_by_sku

 

MODULE 5: POS Terminal

  - test_pos_product_search_by_name

  - test_pos_product_search_by_sku

  - test_pos_product_search_by_barcode

  - test_pos_featured_products_no_sql_error

  - test_plan_transaction_limit_blocks_at_threshold

 

MODULE 6: Plan Enforcement

  - test_transactions_per_month_limit_enforced

  - test_plan_limit_exception_returns_422_not_500

  - test_appsumo_code_redemption_assigns_correct_plan

  - test_appsumo_code_stacking_upgrades_tier

  - test_duplicate_appsumo_code_rejected

 

FOR EACH TEST:

- Use database transactions (RefreshDatabase or DatabaseTransactions trait)

- Create realistic test data with factories

- Use assertDatabaseHas / assertDatabaseMissing

- Test HTTP status codes, JSON structure, and redirect destinations

- For financial tests: calculate expected values by hand in the test and assert equality

- Name tests descriptively: test_[what_should_happen_when_condition]

 

ISOLATION RULE: Every test must be completely independent. No test should rely on state from a previous test.

 

Start with Module 1. Show me the complete test file. Do not write placeholder comments — write real, runnable test code.

# **Quick Reference: Critical Checks Before Every Deploy**

Run through this checklist mentally before pushing any update to production, regardless of what the change was.

| **#** | **Area** | **What to Test** | **Priority** | **Est. Cases** |
| --- | --- | --- | --- | --- |
| ✓ | Store Creation | Create a new test store. Did it succeed? | **CRITICAL** | — |
| ✓ | Tenant Isolation | Can Tenant A's user see Tenant B's products? (Must be NO) | **CRITICAL** | — |
| ✓ | POS Sale | Complete a sale from POS. Did stock deduct? Did journal entry appear? | **CRITICAL** | — |
| ✓ | CSRF | Make a POS sale after 30 minutes idle. Did it work silently? | **HIGH** | — |
| ✓ | Trial Balance | Open Trial Balance. Do total debits = total credits? | **CRITICAL** | — |
| ✓ | Dashboard Numbers | Cash in Hand on Dashboard = Cash in Hand on Payments page? | **CRITICAL** | — |
| ✓ | WooCommerce Isolation | Is WooCommerce configured? If not, does the system still work? | **CRITICAL** | — |
| ✓ | Route List | php artisan route:list — any 500 errors on boot? | **CRITICAL** | — |
| ✓ | Laravel Log | tail storage/logs/laravel.log — any new ERROR lines? | **CRITICAL** | — |

*VenQore Test Audit Document — Generated May 2026*
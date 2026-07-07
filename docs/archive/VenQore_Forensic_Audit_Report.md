# VenQore POS — God-Level Forensic Audit Report

**Auditor:** Combined ERP Architect / Forensic Accountant / Inventory / SaaS / DBA / AppSec / QA / Performance review
**Date:** 2026-06-20
**Codebase:** `E:\AMD POS\AMD POS` (Laravel 12 + React/Inertia, MySQL `venqore_pos`)
**Scope inspected:** 173 controllers, 113 models, 51 services, 224 migrations, 1,920-line `routes/web.php`, ~57 report routes, the FIFO/accounting/return engines, and the multi-tenant scope.
**Method:** Every claim below is tied to a file, method, and line number that was actually opened and read, or to a query/grep run against the tree. Where I prove a number, I run it through the real code path.

---

## 1. Executive Summary

| Dimension | Score | Basis |
|---|---:|---|
| **Overall Readiness** | **41 / 100** | Core sale-posting + full-reversal engine are sound, but partial returns, POS returns, pre-sale conversion, report netting, a live tenant data leak, zero DB indexes, UTC-only dates, and integer sale quantities are all broken. |
| **Financial Accuracy** | **38 / 100** | Sale journal balances correctly, but tax is charged on the pre-discount amount, returns leave ghost revenue, pre-sale conversions omit COGS, force-delete rewrites closed periods, and supplier statements are sign-inverted. |
| **Inventory Accuracy** | **45 / 100** | FIFO deduction is locked and correct; but `sale_items.quantity` is an integer (fractional sales truncate), the legacy `stocks` table and FIFO `inventory_batches` drift apart, and POS returns restock an arbitrary warehouse. |
| **Reporting Accuracy** | **34 / 100** | The three profit "truths" (Dashboard, P&L, Item-wise) cannot agree once any return exists. Returns are double-wrong: excluded from cash dashboards, included at full value in profit reports. |
| **Security & Multi-Tenancy** | **44 / 100** | Eloquent global tenant scope is solid, but `/api/bank-accounts` leaks every tenant's bank accounts, and 621 raw `DB::table()` queries bypass the scope and are individually trusted. |
| **Scalability** | **24 / 100** | **Zero** secondary indexes across 224 migrations; N+1 loops in P&L, Balance Sheet, low-stock and item-detail. Dies between 100K and 1M rows. |
| **Customer-Satisfaction Prediction** | **33 / 100** | Owners will see three different profit numbers; accountants will see inverted supplier balances; grocers will see weights rounded to whole units; everyone slows to a crawl as data grows. |

### Will customers be happy or mad?

**Mad — and specifically, mad in the way that destroys trust in a financial product.** The system does not *crash* on the happy path; a clean cash sale posts a correct, balanced double-entry journal, and a full void reverses it cleanly. That is genuinely good work. But the moment a real business does the ordinary things real businesses do — **partially return goods, convert a quotation, sell 1.5 kg, look at last month's profit after a refund, or onboard their 200,000th transaction** — the numbers stop reconciling and the pages stop loading. An owner who cannot get the same profit figure from the dashboard, the P&L, and the item report will not file a bug; they will assume the software is stealing from them, and they will leave. A shopkeeper whose supplier ledger shows "‑45,000" when they *owe* 45,000 will not trust a single number on the screen.

### Would you sell this today? **NO.**

Single biggest reason: **the same sale produces three different profit numbers, and a partial return can be repeated to refund money that was never owed.** Those two facts alone make it unsafe to trust with real money until fixed.

---

## 2. Traceable Inventory of What Was Inspected

**Files opened and read in full or in the relevant span (with line ranges):**

- `app/Http/Controllers/SaleController.php` — `store()` L35–334, `returnSale()` L625–844, `postSaleJournal()` L1151–1320, `cancel()` L1322–1354, dashboard L364–575.
- `app/Services/FinancialReportingService.php` — profit-by-product/sale/category/party L206–409, P&L L60–135, AR/AP L150–178, cash flow L690–726, balance sheet L755–817, `sumJournalItems`/`netBalance` L827–857.
- `app/Services/SaleReversalService.php` — full file L1–253.
- `app/Http/Controllers/PosReturnController.php` — full file L1–139.
- `app/Http/Controllers/V3/PurchaseReturnController.php` — full file L1–171.
- `app/Services/V3/InventoryService.php` — `transferStock()` L220–336.
- `app/Services/V3/FifoService.php` — `deductStock()` L25–113.
- `app/Http/Controllers/RecycleBinController.php` — `forceDelete()` L200–284.
- `app/Http/Controllers/ReportController.php` — `partyStatement()` L417–507, `lowStock()` L589–633, `itemDetailReport()` L1873–1884; enforce coverage scan (41/41).
- `app/Http/Controllers/SalesOrderController.php` — `convertToSale()` L300–470.
- `app/Services/ReportTierGate.php` (full), `app/Services/PlanGate.php` (full), `app/Traits/HasTenant.php` (full).
- `app/Http/Controllers/Api/BankAccountController.php` (full).
- `routes/web.php` — admin group L195–286, sales/returns L1097–1129, reports/pre-sales/api L1060–1192.
- Migrations: `sale_items`, `sales`, `journal_items`, `purchases`, `inventory_batches` schemas; FK/cascade/index/money-type sweeps across all 224.

**Sweeps run across the whole tree:** raw query count (`DB::table(`=621, `DB::select(`=7, `DB::statement(`=18); `PlanGate::enforce` call sites (34); `ReportTierGate::enforce` (41/41 ReportController methods); `returned_quantity` column existence (0); `->index(` in migrations (0); timezone config; cascade-delete count (43 migrations).

**Routes reviewed:** ~57 distinct `reports.*` route names; sales, returns (3 separate return paths), pre-sales, purchases, admin, platform.

**Coverage honesty:** I deep-verified the transaction engine (sale, 3 return paths, pre-sale conversion, reversal, FIFO) and the reporting engine (`FinancialReportingService` + the `ReportController` methods that feed the matrix) line-by-line. The 43-report matrix in §4 is built by tracing each report to its **data source** and applying the engine-level defects I proved; reports sharing a source share its verdict. I did not separately execute all 173 controllers.

---

## 3. Critical Findings

Ordered by severity. Each known prior issue is re-confirmed with current line numbers, then new findings follow.

---

### FINDING 1 — Partial returns have no cumulative tracking → unlimited refunds
> **Severity:** 🔴 Critical
> **Category:** Financial / Inventory
> **Location:** `app/Http/Controllers/SaleController.php` → `returnSale()` L695–805 and `isFullReturn()` L833–844; absence of any `returned_quantity` column (grep across `app/` + `database/migrations/` = **0 matches**).
> **Problem:** Prior issue #1 (the "status='returned' lockout") **is fixed** — a `partially_returned` status now exists and L633 allows re-entry. But the fix introduced a worse bug. Each partial return reads `$originalItem->quantity` fresh (L699 `min($returnItem['quantity'], $originalItem->quantity)`), and the sale line's quantity is **never decremented and no `returned_quantity` is recorded.** So the same units can be returned again and again.
> **Proof:** Sell 5 units. Return 5 → status `partially_returned`, refund 5. Return 5 again → `isFullReturn()` re-reads `$originalItem->quantity`=5 (unchanged), `min(5,5)=5`, posts another revenue-reversal journal (L763–766) and another negative `Payment` (L796–804). The FIFO restore is capped (L730 `min(..., original_qty - remaining_qty)`), so **inventory only comes back once** — but the **cash refund and revenue reversal are uncapped and repeat every time.** The legacy `stocks`/`products` counters (L744, L752) are *also* uncapped, so they over-restore on each repeat → phantom stock on top of phantom refunds.
> **Business Impact:** Direct, repeatable theft vector and uncontrolled revenue leakage. A cashier (or a scripted client) can drain the cash drawer / inflate customer khata credit indefinitely against a single invoice.
> **Customer Impact:** Owner discovers the till is short and the books show refunds exceeding sales; blames the software (correctly).
> **Exact Fix:** Add `returned_quantity DECIMAL(12,4) DEFAULT 0` to `sale_items`. In `returnSale()`, compute `remainingReturnable = quantity - returned_quantity` and `$qty = min($request_qty, $remainingReturnable)`; reject if ≤ 0; `increment('returned_quantity', $qty)` inside the same transaction. Recompute `isFullReturn()` against remaining-returnable, not original quantity.
> **Verification:** Sell 5, return 3, return 3 again → second call must refund only 2 and then block; assert `SUM(payments.amount where type=out) ≤ sale.net_sales` and `inventory_batches` net restore = 5.

---

### FINDING 2 — Returns leave ghost revenue/profit in all four granular profit reports
> **Severity:** 🔴 Critical
> **Category:** Reporting / Financial
> **Location:** `app/Services/FinancialReportingService.php` — `getGrossProfitByProduct()` L222, `getGrossProfitBySale()` L285, `getGrossProfitByCategory()` L339, `getGrossProfitByParty()` L395 (all: `->whereIn('sales.status', ['posted','partially_returned','returned'])`).
> **Problem:** Prior issue #2 (returns *excluded* via `status='posted'`) **is "fixed" in the wrong direction.** The reports now *include* returned and partially-returned sales **at their full original `sale_items.net_amount` and full `sale_item_batches.total_cogs`**, with no subtraction of the returned portion (there is no `returned_quantity` to subtract — see Finding 1). The P&L (§ below) reads `journal_items` and nets the return correctly; these reports read `sale_items` and do not. The two can never agree once a return exists.
> **Proof (golden transaction):** Buy 10@50 + 10@100. Sell 15@200 on credit → FIFO COGS = 10×50 + 5×100 = **1,000**; revenue = **3,000**. Partially return 2 units → the partial path restores 2 (cost ~100) and posts a 400 revenue reversal *to the journal only*. **Result:** P&L shows revenue 2,600 / COGS 900 / GP 1,700; but `getGrossProfitByProduct/BySale` still sum the untouched `sale_items` → **15 units, revenue 3,000, COGS 1,000, GP 2,000.** The prompt's expected "13 units kept" is impossible here — the report has no concept that 2 came back. Ghost revenue 400, ghost profit 300, per return.
> **Business Impact:** Item/customer/category profitability — the reports owners use to make pricing and purchasing decisions — overstate margin on every returned line. Tax on profit is overstated.
> **Customer Impact:** "Why does my P&L say I made 1,700 but the product report says 2,000?" → support ticket, then churn.
> **Exact Fix:** Returns must reduce the source. Either (a) write a contra `sale_items` row (negative qty/revenue/COGS) on return, or (b) add `returned_quantity`/`returned_amount`/`returned_cogs` and have these four queries subtract them: `SUM(net_amount - returned_amount)`, `SUM(total_cogs - returned_cogs)`. Then the `whereIn(... 'returned')` is harmless because the netted line is zero.
> **Verification:** After the golden transaction, `getGrossProfitByProduct` must report 13 units and GP that equals the P&L GP to the cent.

---

### FINDING 3 — `/api/bank-accounts` returns every tenant's bank accounts (cross-tenant leak)
> **Severity:** 🔴 Critical
> **Category:** Multi-Tenant / Security
> **Location:** `app/Http/Controllers/Api/BankAccountController.php` L15; route `routes/web.php` L1192 (`Route::get('/api/bank-accounts', BankAccountController::class)`), inside the authenticated store-context group.
> **Problem:** The controller runs `DB::table('bank_accounts')->get()` — a **raw query that bypasses the `HasTenant` global scope** (which only applies to Eloquent). No `where('tenant_id', …)`. Compare L443 of `web.php` which uses `BankAccount::get()` (Eloquent, scoped) — the safe form exists elsewhere; this endpoint uses the unsafe one.
> **Proof:** Any authenticated user of Tenant A requests `GET /{store}/api/bank-accounts` and receives a JSON array of **all** rows in `bank_accounts` — Tenant B's bank names, account numbers, and balances included.
> **Business Impact:** Multi-tenant data breach of financial PII. Regulatory and contractual exposure; in a SaaS this is a company-ending incident.
> **Customer Impact:** Competitor on the same platform reads your banking details.
> **Exact Fix:** `DB::table('bank_accounts')->where('tenant_id', app('current.tenant')->id)->get()` — or better, `BankAccount::query()->get()` to use the global scope. Then grep all 621 raw queries for the same pattern (see Finding 13).
> **Verification:** Seed two tenants; hit the endpoint as Tenant A; assert only A's rows return.

---

### FINDING 4 — Force-delete rewrites closed-period financials and orphans the ledger
> **Severity:** 🔴 Critical → High
> **Category:** Financial / Database
> **Location:** `app/Http/Controllers/RecycleBinController.php` → `forceDelete()` L245–251; consumed by `FinancialReportingService::sumJournalItems()` L835 and `netBalance()` L854 (both filter `journal_entries.is_reversed = 0`).
> **Problem:** Prior issue #6 (orphaned journals) was *changed*, not solved. Deleting a sale now does `JournalEntry::where('reference',$sale->id)->update(['is_reversed'=>1])` then `forceDelete()`s the sale, its items, and its payments. Because every P&L / Balance Sheet / Cash-Flow query filters `is_reversed = 0`, flipping the flag **silently removes the sale's revenue and COGS from whatever period it lived in** — including closed prior months/quarters. No counter-entry is posted in the current period; the money just vanishes from history. The cached `accounts.balance` column is *not* adjusted, so it now disagrees with the journal. And the surviving journal entry's `reference` points at a `sales.id` that no longer exists → unauditable orphan.
> **Proof:** Post a sale dated 2026-01-15. Run P&L for January → revenue includes it. Force-delete it on 2026-06-20. Re-run P&L for **January** → revenue is now lower. Last quarter's "closed" books changed today. That is the cardinal accounting sin (immutability of posted periods).
> **Business Impact:** Tax filings already submitted no longer match the system; auditors cannot trace journal entries to source documents.
> **Customer Impact:** Accountant loses trust the instant a prior-period total moves.
> **Exact Fix:** Forbid force-deleting posted financial documents. If a void is required, route it through `SaleReversalService` (counter-entry in the current period) and keep the original rows. At minimum, never hard-delete `sales`/`sale_items`/`payments` that have journal entries; soft-delete only.
> **Verification:** Attempt force-delete of a journaled sale → blocked; prior-period P&L is byte-identical before and after any allowed void.

---

### FINDING 5 — Pre-sale → sale conversion omits the COGS journal (inventory & profit overstated)
> **Severity:** 🔴 High
> **Category:** Financial / Inventory
> **Location:** `app/Http/Controllers/SalesOrderController.php` → `convertToSale()` L344–449.
> **Problem:** Conversion deducts FIFO stock (L353, `lineCogs` computed L354) and writes `sale_item_batches` (L415–425), but the journal it posts contains **only DR Accounts Receivable / CR Revenue** (L434–449). There is **no DR COGS (5000) / CR Inventory (1100)** entry. Stock physically leaves, but the General Ledger never records the cost.
> **Proof:** Convert a pre-sale for goods costing 1,000. Balance Sheet Inventory Asset (1100) stays 1,000 too high; P&L COGS is 1,000 too low → Gross Profit overstated by 1,000. Meanwhile the item-wise report (reads `sale_item_batches`) *does* show the COGS → yet another P&L-vs-item-wise divergence, opposite in sign to Finding 2.
> **Secondary bug:** `taxRate` is hardcoded `0.0` (L317, L392), so **every converted quotation loses its tax** regardless of product tax settings; and `payment_status` is always `'unpaid'` (full AR) even for prepaid orders.
> **Business Impact:** Systematic profit inflation and inventory over-valuation for any business that quotes before invoicing (B2B, wholesale — a core ERP audience).
> **Customer Impact:** Balance sheet won't tie to a stock count; VAT under-collected on converted orders.
> **Exact Fix:** After the item loop, post the COGS leg: `DR 5000 = Σ lineCogs`, `CR 1100 = Σ lineCogs`. Carry the real tax rate from the product/order instead of `0.0`. Set `payment_status` from actual payment.
> **Verification:** Convert a pre-sale; assert Balance Sheet still balances *and* Inventory drops by COGS, P&L COGS rises by COGS, and P&L GP == item-wise GP.

---

### FINDING 6 — POS "open return" books a return as positive revenue and restocks an arbitrary warehouse
> **Severity:** 🔴 High
> **Category:** Reporting / Inventory
> **Location:** `app/Http/Controllers/PosReturnController.php` → `store()` L43–86.
> **Problem:** Prior issue #5 (no FIFO restore) is partly fixed — it now calls `FifoService::receiveBatch()` (L79). But three new defects:
> 1. The return is stored as a `Sale` with `status='returned'` **and `net_sales = +returnTotal` (positive)** (L47–55). The four profit reports include `status='returned'` (Finding 2), so a *refund* is counted as **positive revenue** in item/category/party profit.
> 2. Stock is restored with `DB::table('stocks')->where('product_id')->where('tenant_id')->limit(1)->increment('quantity', …)` (L73–77) — **no `warehouse_id`**, so a random warehouse row is credited.
> 3. `receiveBatch()` uses `Product->cost_price` (L83), not the original FIFO cost, and appends a **new** batch at today's cost → FIFO valuation drift; and on retry the journal is idempotent (L122) but the Sale/stock/batch are **not**, so a double-submit creates duplicate stock and a duplicate return sale with one journal.
> **Proof:** Open-return 1 unit @ 200. Item-wise profit for that product now shows +200 revenue from a refund. Multi-warehouse product: the wrong warehouse gains the unit.
> **Business Impact:** Refunds inflate sales/profit reports; warehouse stock becomes wrong; retries duplicate inventory.
> **Customer Impact:** "My sales went *up* when I did a refund." Warehouse counts don't match shelves.
> **Exact Fix:** Store POS returns as negative `net_sales` (or a distinct `return` type excluded from revenue sums); restore to the *original* sale's warehouse and batch; make the whole operation idempotent on `returnRef`.
> **Verification:** Open-return 1 unit; assert revenue reports decrease (or ignore it) and the correct warehouse's `stocks` row increments exactly once.

---

### FINDING 7 — Tax is charged on the pre-discount amount (order discounts don't reduce VAT)
> **Severity:** 🔴 High
> **Category:** Financial / Tax
> **Location:** `app/Http/Controllers/SaleController.php` → `store()` L86–91 vs L109–111.
> **Problem:** Per-line tax is `round($net * taxRate/100)` where `$net = gross − itemDiscount` (L87) — computed **before** the order-level/global discount is applied (L109 `$netSales = … − $globalDiscount`). The global discount lowers revenue but **not** the already-computed tax.
> **Proof:** One item @ 100, tax 10%, order discount 50. Code: `taxAmt = 10`; `netSales = 50`; `invoiceTotal = 60`. Correct VAT on a 50 sale is **5**. The customer is overcharged 5 and output-tax liability is overstated by 5 on every discounted invoice.
> **Business Impact:** Over-collection of sales tax / VAT and an overstated tax-payable account — a compliance and refund problem in any VAT jurisdiction (incl. Pakistan FBR, which this app integrates with).
> **Customer Impact:** Customers dispute the tax line; tax authority sees overstated collections.
> **Exact Fix:** Apply the order discount to the line bases *before* computing tax (pro-rate the global discount across lines), or recompute tax on `netSales`. Keep one waterfall: gross → item disc → order disc → tax → round.
> **Verification:** Item 100, 10% tax, 50 order discount → invoiceTotal 55, tax 5; assert journal tax (2100) = 5.

---

### FINDING 8 — Supplier statement balance is sign-inverted (AP treated as AR)
> **Severity:** 🔴 High
> **Category:** Reporting / Financial
> **Location:** `app/Http/Controllers/ReportController.php` → `partyStatement()` L440–442 (supplier → AP account 2000) and L464 / L486 (running balance `+= debit − credit`).
> **Problem:** Prior issue #8 **still present.** For a supplier the statement reads account 2000 (Accounts Payable, a **credit-normal** liability) but computes the running and closing balance as `debit − credit`. A credit-normal account's natural balance is `credit − debit`, so the displayed sign is reversed. (The General-Ledger report at L387 correctly uses an `$isDebitNormal` flag; `partyStatement()` does not.)
> **Proof:** You owe a supplier 45,000 (AP credit balance 45,000). The statement shows **−45,000** (a debit/receivable). The supplier statement disagrees with the Aged-Payables report and the GL.
> **Business Impact:** Every supplier ledger printed for reconciliation is wrong-signed; payments get misapplied.
> **Customer Impact:** "Your statement says you owe *me* money" disputes with suppliers.
> **Exact Fix:** Branch on normal-balance: for AP/supplier use `credit − debit` for opening, running, and closing. Reuse the `$isDebitNormal` logic already present at L387.
> **Verification:** Post a 45,000 purchase on credit; supplier statement closing balance = **+45,000 payable**, equal to Aged Payables.

---

### FINDING 9 — `sale_items.quantity` is an INTEGER while fractional quantities are accepted
> **Severity:** 🔴 High
> **Category:** Inventory / Financial
> **Location:** `database/migrations/2026_01_02_000003_create_sale_items_table.php` L15 (`$table->integer('quantity')`, never altered); validation `SaleController::store()` L42 (`'items.*.quantity' => 'numeric|min:0.001'`); purchases store qty as `decimal(10,4)` (`…create_purchases_table.php` L35).
> **Problem:** The UI/validation accepts fractional quantities (weighed goods), the FIFO engine deducts the float quantity, but the `sale_items.quantity` column is an integer — MySQL rounds/truncates on insert. You can *buy* 10.5 kg but the *sale line* records a whole number.
> **Proof:** Sell 2.5 kg. `FifoService::deductStock()` decrements `inventory_batches` by 2.5 (decimal), but `SaleItem.quantity` stores `2` (or `3`). The sale line now disagrees with the inventory movement and with revenue (computed from the float `net`). Reconciliation breaks for every fractional sale.
> **Business Impact:** Grocers, butchers, fabric/hardware stores — explicitly part of the "retail and food businesses" target market in `CLAUDE.md` — cannot trust quantities or stock.
> **Customer Impact:** "I sold 2.5 kg, it shows 2; my stock is off by half a kilo every time."
> **Exact Fix:** Migrate `sale_items.quantity` (and any other integer qty columns) to `DECIMAL(12,4)` to match `purchases`/`inventory_batches`. Audit `free_quantity` similarly.
> **Verification:** Sell 2.5 units; assert `sale_items.quantity = 2.5` and equals the summed `sale_item_batches.qty_deducted`.

---

### FINDING 10 — No timezone awareness: "Today" is UTC, not the store's day
> **Severity:** 🟠 High
> **Category:** Reporting
> **Location:** `config/app.php` L68 (`'timezone' => 'UTC'`); `SaleController::dashboard()` L366/375/430/501 (`Carbon::today()` + `whereDate('created_at', …)`).
> **Problem:** Daily dashboard and daily-sales use server-UTC `today()` against `created_at`. There is no per-tenant timezone. Sales near the local midnight boundary fall on the wrong calendar day.
> **Proof:** Store in Pakistan (UTC+5). A sale at 02:00 PKT on Jun 20 is stored ~21:00 UTC Jun 19 → counted in **Jun 19's** "Today's Sales." The opening-hours cash report and the owner's daily total are wrong every morning. (Granular reports use `posted_at`; the dashboard uses `created_at` — also internally inconsistent.)
> **Business Impact:** Daily close never matches the drawer; "today vs yesterday" is offset by the UTC delta.
> **Customer Impact:** Owner counts cash, it doesn't match the dashboard, distrust follows.
> **Exact Fix:** Store a tenant timezone; convert range boundaries to UTC for the query (`->whereBetween('created_at', [$tzStart->utc(), $tzEnd->utc()])`), and standardize on one business-date column (`posted_at`).
> **Verification:** With tenant tz = Asia/Karachi, a 02:00-local sale counts toward the local date.

---

### FINDING 11 — Zero secondary indexes anywhere → full-table scans at scale
> **Severity:** 🔴 Critical (Scalability)
> **Category:** Database / Performance
> **Location:** All 224 migrations — `grep "->index("` returns **0**. `sales` table has only `id` primary + `reference_number` unique (`…create_sales_table.php`). `tenant_id`, `posted_at`, `created_at`, `status`, `party_id` are unindexed (only `constrained()` FKs get auto-indexes; `tenant_id` is a bare uuid).
> **Problem:** Every query is `WHERE tenant_id = ? AND posted_at BETWEEN ? AND ?` (+status), against tables with no composite index to serve it. Every report and dashboard is a full scan + filesort.
> **Proof / cost estimate (sales table):**
> | Rows | Per dashboard/report query | With P&L N+1 (Finding 12) |
> |---|---|---|
> | 10K | ~tens of ms (tolerable) | ~hundreds of ms |
> | 100K | ~300–800 ms full scan | seconds |
> | 1M | 3–8 s per query | tens of seconds → timeouts |
> | 10M | tens of seconds | unusable |
> **Business Impact:** The product feels fine in demos (small data) and collapses for exactly the successful customers you most want to keep.
> **Exact Fix:** Add composite indexes: `sales(tenant_id, posted_at)`, `sales(tenant_id, status)`, `sale_items(tenant_id, sale_id)`, `sale_items(product_id)`, `journal_items(account_id)`, `journal_entries(tenant_id, date, is_reversed)`, `stocks(tenant_id, product_id, warehouse_id)`, `inventory_batches(tenant_id, product_id, warehouse_id, created_at)`.
> **Verification:** `EXPLAIN` each report query shows `ref`/`range` on the new index, not `ALL`; P&L p95 < 300 ms at 1M rows.

---

### FINDING 12 — N+1 in P&L, Balance Sheet, Low-Stock and Item-Detail
> **Severity:** 🟠 Medium (High at scale, compounds Finding 11)
> **Category:** Performance
> **Location:** `FinancialReportingService` P&L L70–72 & L105–107 (a `SUM` query *per account*, ×2 for debit/credit), Balance Sheet L769–774 (`netBalance` per account); `ReportController::lowStock()` L604–606 and `itemDetailReport()` L1876 (a `Stock::sum()` query *per product*).
> **Problem (prior issues #9 & #10 — both still present):** P&L issues `2×(income + expense accounts)` aggregate queries; with a 60-account chart that's ~120 queries per load. Low-stock and item-detail load **all** products then run one stock-sum query each — 10K products = 10K+1 queries, all rows hydrated, no pagination. `lowStock()` also reads a `warehouse_id` filter (L593) but **never applies it** (L605–606 sums across all warehouses) — the warehouse filter is silently broken.
> **Exact Fix:** Replace per-account/per-product loops with a single grouped aggregate: `journal_items … GROUP BY account_id`; `stocks … GROUP BY product_id`. Apply the `warehouse_id` filter in SQL. Paginate listing reports.
> **Verification:** P&L runs in ≤ 3 queries; low-stock in ≤ 2; query log shows no per-row aggregation.

---

### FINDING 13 — 621 raw `DB::table()` queries bypass the tenant global scope
> **Severity:** 🟠 High (one confirmed Critical instance = Finding 3)
> **Category:** Multi-Tenant / Security
> **Location:** `grep "DB::table("` across `app/` = **621**; `DB::select(`=7; `DB::statement(`=18. The Eloquent safety net `HasTenant` (`app/Traits/HasTenant.php` L50–77) only scopes Eloquent models — every raw query is on its own.
> **Problem:** Most raw queries *do* add `->where('tenant_id', …)` manually (e.g. `FinancialReportingService`, `V3/PurchaseReturnController`), but correctness depends on a human remembering every time across 600+ sites. Finding 3 proves at least one forgot. `Api/HeartbeatController` L101–102 (`DB::table('products')->where('updated_at','>',…)->exists()`) checks **all tenants'** products for a change signal (cross-tenant information leak / unnecessary sync trigger, low impact but illustrative).
> **Exact Fix:** Introduce a tenant-aware query helper (e.g. `tenantTable('x')` returning `DB::table('x')->where('tenant_id', currentTenantId())`) and ban bare `DB::table()` via a lint/CI grep. Audit all 621 now.
> **Verification:** CI fails on any `DB::table(` lacking a tenant predicate in tenant-scoped tables; the bank-accounts test (Finding 3) passes.

---

### FINDING 14 — Dual-source stock (`stocks` vs `inventory_batches`) drifts apart
> **Severity:** 🟠 Medium-High
> **Category:** Inventory
> **Location:** Sale `store()` L293–310 updates legacy `stocks`/`products`; FIFO `FifoService::deductStock()` updates `inventory_batches`; POS return L73–77 increments `stocks.limit(1)` and appends a batch; partial return L743–752 increments `stocks` uncapped; `deductStock()` L99–106 creates `negative_stock` batches that returns never net out.
> **Problem:** Two parallel "truths" for quantity are maintained by different code paths with different rules. Low-stock/item-detail report off `stocks` (L606); FIFO/valuation off `inventory_batches`. Returns and negative-stock batches update them asymmetrically, so they diverge over time.
> **Business Impact:** The quantity on the catalog/low-stock page won't equal the FIFO valuation quantity; reorder decisions made on a wrong number.
> **Exact Fix:** Make `inventory_batches` the single source of truth and derive `stocks.quantity = Σ remaining_qty` (a view or a maintained projection updated in one place), or drop the legacy `stocks` counter. Net negative-stock batches on restock.
> **Verification:** A reconciliation job asserts `stocks.quantity == Σ inventory_batches.remaining_qty` per product/warehouse after any sale/return/transfer.

---

### FINDING 15 — `sale.discount` omits item-level discounts (header math doesn't reconcile)
> **Severity:** 🟡 Medium
> **Category:** Financial / Reporting
> **Location:** `SaleController::store()` L201–205 (`'subtotal' => $subtotalGross`, `'discount' => $globalDiscount`, `'net_sales' => $netSales`).
> **Problem:** The header stores `subtotal` *including* free-goods value and `discount` = the **global** discount only; item discounts are folded into `net_sales` but not into the header `discount`. Therefore `subtotal − discount ≠ net_sales` whenever any line discount exists. Any invoice/report that recomputes net from header columns (a common pattern) will be wrong.
> **Exact Fix:** Store `discount = totalItemDiscounts + globalDiscount` (and exclude free-goods value from `subtotal`, or add an explicit `free_value` column) so `subtotal − discount = net_sales` holds as an invariant.
> **Verification:** For any sale, assert `round(subtotal − discount, 2) == round(net_sales, 2)`.

---

### FINDING 16 — Destructive admin actions share one coarse permission
> **Severity:** 🟡 Medium
> **Category:** Security / Authorization
> **Location:** `routes/web.php` L212 — the whole `/admin` group is gated by a single `permission:admin.settings_manage`, covering `users.store/remove`, `data.export` (full tenant dump, L236), `data.import`, and `recycle-bin/{id}/force-delete` (permanent destruction, L250).
> **Problem:** Prior issue #7 (no middleware at all) **is fixed** — a permission now exists. But one permission to "manage settings" also grants the right to permanently destroy records and export the entire database. Least-privilege is violated; a store manager given settings access can exfiltrate or destroy everything.
> **Exact Fix:** Split into granular permissions: `data.export`, `data.import`, `records.force_delete`, `users.manage` — each assignable independently and defaulting to owner-only.
> **Verification:** A user with only `admin.settings_manage` is blocked from `data.export` and `force-delete`.

---

### FINDING 17 — Plan limits enforced in V3 controllers but the primary sale path and legacy controllers are gated inconsistently
> **Severity:** 🟡 Medium
> **Category:** Plan-Gating
> **Location:** `PlanGate::enforce()` appears at 34 sites incl. `sku_limit` (`V3/ProductController` L51), `transactions_per_month`, `locations`, `staff_limit` (`AdminController` L561). But the **routed** `SaleController::store()` (web.php L1101, read in full L35–334) contains **no** `PlanGate::enforce('transactions_per_month')`; and a legacy top-level `ProductController` exists alongside the gated `V3/ProductController`.
> **Problem:** Enforcement is real and fairly broad, but it lives in *some* controllers while a parallel V3/legacy controller duality (e.g. two `SaleController`s, two `InventoryService`s, two `ProductController`s) means a write can reach the database through an *ungated* path. The monthly transaction cap in particular is not enforced on the live POS/sale store path.
> **Exact Fix:** Move quota checks into middleware on the write routes (or a model `creating` observer) so they apply regardless of which controller handles the request; delete or neutralize the unused legacy controllers.
> **Verification:** On a 500-tx plan, the 501st sale via the live `POST /sales` route is blocked; product #(limit+1) blocked on every product-create route.

---

### Confirmation table for the 10 prior-audit issues

| # | Prior issue | Status now | Evidence |
|---|---|---|---|
| 1 | Partial-return lockout | **Lockout fixed, but introduced unlimited-refund bug** | `SaleController` L633 allows re-entry; no `returned_quantity` (Finding 1) |
| 2 | Returns excluded from profit reports | **Inverted into ghost-revenue bug** | `FinancialReportingService` L222/285/339/395 (Finding 2) |
| 3 | Purchase-return tenant leak | **Fixed** | `V3/PurchaseReturnController` L155 has `tenant_id`; L75 `lockForUpdate` |
| 4 | Transfer FIFO `original_qty=0` | **Fixed** | `V3/InventoryService` L252 `'original_qty' => $take` |
| 5 | POS return bypasses FIFO | **Partly fixed, new bugs** | `PosReturnController` L79 batches; L73/L47 new defects (Finding 6) |
| 6 | Force-delete orphans ledger | **Changed → rewrites history** | `RecycleBinController` L247 + reports filter `is_reversed=0` (Finding 4) |
| 7 | Admin route priv-esc | **Fixed (coarse)** | `web.php` L212 `permission:admin.settings_manage` (Finding 16) |
| 8 | Supplier statement sign | **Still present** | `ReportController` L486 `debit−credit` for AP (Finding 8) |
| 9 | N+1 low-stock/item-detail | **Still present** | `ReportController` L604–606, L1876 (Finding 12) |
| 10 | N+1 P&L/Balance Sheet | **Still present** | `FinancialReportingService` L70–72, L105–107, L769 (Finding 12) |

---

## 4. Report Accuracy Matrix

Legend — **Source:** J = `journal_items` (nets returns, filters `is_reversed`), SI = `sale_items` by status (does **not** net returns), ST = legacy `stocks`, IB = `inventory_batches`. **Returns-netting / Pass-Fail** derived from the engine defects proven in §3.

| # | Report | Source | Headline recomputed | Card↔Report↔DB | Timezone | Soft-delete/Reversal | Nulls | Returns netted | Risk | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Dashboard – Today's Sales | SI (`net_sales`, status≠returned) | Yes | Dashboard only | **UTC bug (F10)** | excludes returned | ok | excludes (under) | High | **Fail** |
| 2 | Dashboard – Monthly Sales | SI | Yes | n/a | UTC bug | excludes returned | ok | excludes | High | **Fail** |
| 3 | Dashboard – Net Profit | mixed | Partial | ✗ vs P&L | UTC | partial | ok | inconsistent | High | **Fail** |
| 4 | Dashboard – Inventory Value | IB | Yes | ✗ vs Balance Sheet 1100 (F5) | n/a | n/a | ok | n/a | High | **Fail** |
| 5 | Profit & Loss | J | Yes (balanced) | baseline truth | uses `date` | filters `is_reversed` | ok | **yes** | Med (history-mutation F4) | **Conditional** |
| 6 | Balance Sheet | J | Yes (`is_balanced`) | self-checks | `<= asOf` | filters reversed | skips 0 | n/a | High (F5 overstates 1100) | **Fail** |
| 7 | Trial Balance | J | Yes | balances | date | reversed | ok | yes | Low | **Pass** |
| 8 | Cash Flow | J (1000–1099) | Yes | — | date | reversed | ok | yes | Med (F7 tax timing) | **Conditional** |
| 9 | Item-wise Profit | SI+IB | Yes | ✗ vs P&L (F2) | `posted_at` | **includes returned full** | fallback cost | **no** | Critical | **Fail** |
| 10 | Bill-wise Profit | SI+IB | Yes | ✗ vs P&L | posted_at | includes returned | ok | **no** | Critical | **Fail** |
| 11 | Category-wise Profit | SI+IB | Yes | ✗ | posted_at | includes returned | null cat→"Uncategorized" | **no** | Critical | **Fail** |
| 12 | Party-wise Profit | SI+IB | Yes | ✗ | posted_at | includes returned | ok | **no** | Critical | **Fail** |
| 13 | Gross Profit (summary) | SI+IB | Yes | ✗ | posted_at | includes returned | ok | **no** | High | **Fail** |
| 14 | COGS report | IB/J | Partial | ✗ (pre-sale conv. omits, F5) | posted_at | partial | ok | partial | High | **Fail** |
| 15 | Daily Sales | SI | Yes | — | **UTC (F10)** | excludes returned | ok | excludes | High | **Fail** |
| 16 | Sales register | SI | Yes | — | posted_at | shows status | ok | shows gross | Med | **Conditional** |
| 17 | Purchases register | purchases | Yes | — | date | ok | ok | n/a | Low | **Pass** |
| 18 | Party Statement (customer) | J (1200) | Yes | matches GL | date | reversed | fallback 0 | yes | Low | **Pass** |
| 19 | Party Statement (supplier) | J (2000) | **Wrong sign (F8)** | ✗ vs Aged Payables | date | reversed | — | yes | High | **Fail** |
| 20 | Party Ledger | J | Yes | — | date | reversed | ok | yes | Low | **Pass** |
| 21 | Account Ledger | J | Yes | — | date | reversed | ok | yes | Low | **Pass** |
| 22 | Aged Receivables | J (1200) | Yes | matches AR | `asOf` | reversed | ok | yes | Low | **Pass** |
| 23 | Aged Payables | J (2000) | Yes | matches AP | asOf | reversed | ok | yes | Low | **Pass** |
| 24 | Sale Aging | SI/J | Partial | — | posted_at | partial | ok | partial | Med | **Conditional** |
| 25 | Stock Aging | IB | Yes | — | created_at | n/a | ok | n/a | Med (no index F11) | **Conditional** |
| 26 | Inventory Valuation | IB (`Σ remaining×cost`) | Yes | ✗ vs BS 1100 (F5) | n/a | n/a | ok | n/a | High | **Fail** |
| 27 | Stock Valuation | IB | Yes | as #26 | n/a | n/a | ok | n/a | High | **Fail** |
| 28 | Low Stock | ST | Yes | — | n/a | n/a | ok | n/a | High (**N+1 F12 + warehouse filter ignored**) | **Fail** |
| 29 | Item Detail | ST | Yes | — | n/a | n/a | ok | n/a | High (N+1 F12) | **Fail** |
| 30 | Inventory Movement | stock_movements | Yes | — | created_at | n/a | ok | partial | Med (dual-source F14) | **Conditional** |
| 31 | Movement History | stock_movements | Yes | — | created_at | n/a | ok | partial | Med | **Conditional** |
| 32 | Stock Summary by Category | ST/IB | Partial | — | n/a | n/a | null cat | n/a | Med | **Conditional** |
| 33 | Expiry report | IB (expiry) | Yes | — | expiry | n/a | null expiry skipped | n/a | Low | **Pass** |
| 34 | Expenses | expenses | Yes | — | date | soft-delete? | ok | n/a | Med | **Conditional** |
| 35 | Expense by Category | expenses | Yes | — | date | — | null cat | n/a | Med | **Conditional** |
| 36 | Expense by Item | expenses | Yes | — | date | — | ok | n/a | Med | **Conditional** |
| 37 | Tax report | SI tax / J 2100 | **Overstated (F7)** | ✗ | posted_at | partial | ok | partial | High | **Fail** |
| 38 | Tax Rate report | SI | Partial | ✗ (F7) | posted_at | — | ok | no | High | **Fail** |
| 39 | Discount / Item-wise Discount | SI | Partial | header `discount` ≠ items (F15) | posted_at | includes returned | ok | no | Med | **Conditional** |
| 40 | Day Book | J | Yes | — | date | reversed | ok | yes | Low | **Pass** |
| 41 | Sale/Purchase by Party (+group) | SI/purchases | Partial | — | posted_at | includes returned | ok | no | Med | **Conditional** |
| 42 | Sale/Purchase by Item Category | SI | Partial | — | posted_at | includes returned | null cat | no | Med | **Conditional** |
| 43 | Sale Orders / Order Items / Loan Statement / Owner Daily Pulse | mixed | Partial | pre-sale conv. omits COGS (F5) | mixed | partial | ok | n/a | Med-High | **Conditional/Fail** |

**Tally:** Pass ≈ 9 (mostly journal-sourced AR/AP/GL/Trial Balance — the genuinely solid part). Fail ≈ 18 (every profit, valuation, tax, low-stock, supplier-statement and daily report). Conditional ≈ 16. **Net: the ledger-based reports are trustworthy; everything sales/inventory/profit-facing is not.**

---

## 5. Permission & Plan Matrix

### Roles (RBAC via `permission:` middleware on routes)

| Role | Expected access | Actual access | Vulnerability |
|---|---|---|---|
| Owner | Everything in tenant | Yes | — |
| Admin/Manager | Ops + settings | `admin.settings_manage` also grants full data export + permanent force-delete (F16) | **Privilege over-grant** |
| Cashier | POS sell + (maybe) return | Can hit `POST /sales/{id}/return` repeatedly → unlimited refunds (F1) | **Financial abuse** |
| Accountant | Reports, ledgers | Supplier statement wrong-signed (F8); profit reports unreliable (F2) | Data-quality |
| Viewer | Read-only | Depends on per-route `permission:` correctness | Spot-check needed |
| Cross-tenant | None | `GET /api/bank-accounts` returns all tenants (F3) | **Critical leak** |

### Plans (limits/features)

| Limit / Feature | Frontend | Backend | API | Export | Import | Queue | Bypassable? |
|---|---|---|---|---|---|---|---|
| `staff_limit` | locked UI | **enforced** `AdminController` L561 | inherits | — | — | — | No |
| `sku_limit` | locked UI | enforced `V3/ProductController` L51 | only if routed via V3 | — | **import path?** | — | **Maybe** (legacy `ProductController` + bulk import) |
| `transactions_per_month` | — | **not on live `SaleController::store`** | — | — | — | — | **Likely yes** (F17) |
| `locations` | locked UI | enforced (`enforce('locations')`) | — | — | — | — | Verify |
| Reports tier (`reports`) | hidden | **enforced 41/41** `ReportTierGate::enforce` | 403 JSON | — | — | — | No (for ReportController) |
| `woocommerce`/`growth_engine`/`bom`/etc. | `is_locked` flags only (BillingController) | `enforce()` exists for most | — | — | — | webhook? | Mixed — verify webhook/queue paths |

**Net:** Report-tier and several feature gates are properly enforced server-side (a real strength). The weak points are the **monthly-transaction cap on the live sale route** and the **legacy-vs-V3 controller duality**, where an ungated parallel path may exist.

---

## 6. Database & Architecture Map

**Architecture risk — V3/legacy duality:** Two `SaleController`, two `InventoryService`, two `ProductController`, two `FifoService`, etc. coexist. The routed sale path is the 1,472-line top-level `SaleController`; FIFO is the V3 service; purchase-return/transfer are V3. This split is the root cause of inconsistent gating (F17) and divergent return logic (F1 vs F6 vs SaleReversalService). **Recommendation: pick one lineage, delete the other.**

**Money types:** Mostly correct `DECIMAL` (no floats found in core financial tables) — `sales(10,2)`, `purchases(15,2)`, `journal_items(20,2)`, `inventory_batches(*,4)`. Two problems: (a) **inconsistent precision** across tables (10,2 vs 15,2 vs 20,2) causes rounding drift on cross-table aggregation; (b) **`sale_items.quantity` is `integer`** (F9).

**Foreign keys / cascades:** 43 migrations use `cascadeOnDelete`. Most are safe child rows (barcodes, images, variants). **Action item:** confirm none cascade from `parties`/`products`/`warehouses` into `sales`/`journal_items`/`inventory_batches` — deleting a master must never cascade-destroy financial history. `RecycleBinController` already hard-deletes sale children manually (F4), which is the more acute version of this risk.

**Indexes:** **None** (`->index(` = 0 across 224 migrations). This is the single biggest scalability defect (F11).

**Concurrency (proven):** Oversell **is** protected when stop-negative is on — `FifoService::deductStock()` L43 `lockForUpdate()` on batches, L50 throws `InsufficientStockException`. With stop-negative off, negative stock is created by design (L99–106). Two simultaneous last-unit sales: both pass the unlocked early check (L223) but the second `deductStock` blocks on the row lock and then throws → **no oversell** (good). Purchase returns also lock (`V3/PurchaseReturnController` L75). **Gap:** the legacy `stocks` counter and `negative_stock` batches are not reconciled (F14), so concurrency-safe FIFO can still diverge from the display counter.

---

## 7. Prioritized Remediation Plan

**BLOCKING — must fix before selling (each maps to a finding):**

1. **F1** Add `returned_quantity` + cap partial returns. *(M)* — verify repeated returns can't exceed sold qty.
2. **F3** Tenant-scope `/api/bank-accounts` and audit all 621 raw queries. *(S for the leak, M for the sweep)*.
3. **F2** Net returns out of the 4 profit reports. *(M)*.
4. **F4** Forbid force-delete of journaled documents; void via reversal only. *(S)*.
5. **F5** Post the COGS leg + real tax on pre-sale conversion. *(S)*.
6. **F7** Compute tax after order-level discount. *(S)*.
7. **F9** Migrate `sale_items.quantity` to `DECIMAL(12,4)`. *(S, + data backfill)*.
8. **F11** Add the composite indexes. *(S, high payoff)*.

**SOON (correctness/abuse, not first-day-blocking):**

9. **F6** Fix POS-return revenue sign, warehouse, idempotency. *(M)*.
10. **F8** Fix supplier-statement sign. *(S)*.
11. **F10** Tenant timezone for daily/dashboard. *(M)*.
12. **F12** De-N+1 P&L/Balance Sheet/low-stock/item-detail + fix warehouse filter. *(M)*.
13. **F17** Enforce monthly-transaction cap on the live sale route; collapse V3/legacy duality. *(M–L)*.
14. **F14** Single source of truth for stock. *(L)*.

**NICE-TO-HAVE:**

15. **F15** Header discount invariant. **F16** Granular admin permissions. Precision standardization. Cascade audit. *(S each)*.

---

## 8. Final Verdict

**Can it be sold today? No.** **Can it be trusted with real money today? No.** **Will it survive real-world use? Not past the first refund, the first quotation conversion, the first fractional sale, or the first six-figure row count.**

This is not a hopeless codebase — and that matters. The **double-entry core is real**: a clean sale posts a balanced journal (DR cash/AR + COGS = CR revenue + tax + round-off + inventory), the **full-reversal engine is textbook** ("you do not edit the past, you reverse it"), FIFO deduction is **properly row-locked against oversell**, AR/AP/Trial-Balance/Ledger reports read from the journal and are trustworthy, and the Eloquent tenant scope is sound. A competent team built the spine of an accounting system here.

But the spine is wrapped in flesh that doesn't reconcile. The failures cluster in exactly the places a *forensic* audit is meant to find and a casual demo never will: **the second time you touch a transaction.** Partial returns can refund money that was never owed (F1). Three different screens report three different profits the moment a return exists (F2, F5, F6). Converting a quotation silently inflates profit and inventory (F5). Deleting an old sale rewrites a closed quarter (F4). A weighed-goods sale truncates to whole units (F9). One endpoint hands every tenant's bank details to any logged-in user (F3). And the whole thing has **no database indexes**, so the customers who grow — the ones paying you the most — are the ones it fails first (F11).

**Minimum set of fixes to flip NO → YES:** the eight BLOCKING items in §7. They are mostly Small/Medium effort because the hard part — the ledger engine — already works; what's missing is **return-quantity accounting, return-netting in reports, the pre-sale COGS leg, tax-after-discount, one tenant filter, a decimal column, and a handful of indexes.** Close those, re-run the golden transaction until the Item-wise Profit report and the P&L agree to the cent after a partial return, and this becomes sellable. Until then, every paying customer is a future chargeback, a wrong tax filing, or a data-breach disclosure.

*No optimism bias: the engine earns a B+, the transaction lifecycle around it earns an F, and you sell the lifecycle, not the engine.*

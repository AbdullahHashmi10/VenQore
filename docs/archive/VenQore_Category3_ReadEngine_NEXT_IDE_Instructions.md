# VenQore — Category 3 (Read Engine) — NEXT IDE Work-Order

**Date:** 2026-06-22
**Author of plan:** (verifier session) — *instructions only; the IDE implements, I verify.*
**Scope of this document:** finish **Category 3 — "AI reads the ONE engine."** You already did **C3.2b** (`get_profit_summary` now calls `FinancialReportingService::getProfitAndLoss`). This work-order covers the **remaining AI read tools** that still bypass the engine, plus a permanent **read-parity test** that proves the AI's numbers equal the official P&L / dashboard / DB.

> **How to use this file:** Paste each task (C3.2c … C3.3) into the IDE **one at a time**, run the verify command after each, and stop the moment anything goes red. Do **not** batch them. After each task, send me (a) the changed code block and (b) the test output, and I will confirm against the files before you proceed to the next.

---

## 0. NON-NEGOTIABLES (read before touching anything)

1. **MySQL only.** Tests run on `amd_pos_test`. Never introduce SQLite. Never run `RefreshDatabase` against `venqore_pos`.
2. **Do NOT modify the engine.** `app/Services/FinancialReportingService.php` is the source of truth and is already verified. You are pointing *callers* at it — you are not changing it.
3. **Do NOT touch any write path.** No changes to `SaleController`, `PurchaseService`, `V3/SaleService`, journal posting, FIFO, returns. This epic is **read-only consolidation**. (The legacy→single *write* engine is C5 in `VenQore_Road_To_100.md` and is explicitly later.)
4. **No namespace renames.** "V12 Turbo" / `V3`→`Engine` renaming is the final step after C5. Not now.
5. **Tenant scope always.** Every query you write or touch must be tenant-scoped. The engine already does this via `app('current.tenant')`.
6. **Minimal diffs.** Change only the body of the specific AI tool handler named in each task. Don't reformat the file, don't reorder handlers, don't "tidy" neighbouring code.
7. **One tool per commit, verify, then next.** This is the instruction→verify loop from the master plan.

### Environment / commands (use the proven XAMPP binary)
```bash
# Lint a single file
E:\Software\Xampp\php\php.exe -l app/Http/Controllers/AiController.php

# Clear caches after edits
E:\Software\Xampp\php\php.exe artisan optimize:clear

# Run the full money + core gate (this must stay GREEN after every task)
E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Money Tester/tests/Feature/Core

# Run just the new parity test (after C3.3 is created)
E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Core/AiReadParityTest.php
```
*(If the XAMPP path ever fails, the fallback is the Local binary in `CLAUDE.md`. Prefer the XAMPP one — it's what produced your last green run.)*

---

## 1. THE PRINCIPLE (what "done" means for Category 3)

Every AI assistant read tool must return a number **identical** to the number the user sees in the corresponding official report / dashboard card. The official numbers come from **one** place per domain:

| Domain | Canonical source (the ONE engine) | Method |
|---|---|---|
| Revenue / COGS / Gross / Net / Opex | `FinancialReportingService` | `getProfitAndLoss($start,$end)` |
| Item-wise (top products, GP per product) | `FinancialReportingService` | `getGrossProfitByProduct($start,$end)` |
| Party-wise profit | `FinancialReportingService` | `getGrossProfitByParty($start,$end)` |
| Receivables / Payables (aggregate) | `FinancialReportingService` | `getReceivables($asOf)` / `getPayables($asOf)` |
| Per-party balance | the **Party/Supplier Statement** source (ledger) | *find the service the statement report uses* |
| Inventory value / stock qty | `FinancialReportingService` | `getInventoryValue()` / `getInventoryValuationReport()` (qty = `SUM(stock.quantity)`) |
| Tax payable | `FinancialReportingService` | `getTaxSummary($start,$end)['net_payable']` |
| Cash position | the cash ledger (account `1000`) via journal | same basis as Balance Sheet |

`getProfitAndLoss()` returns these keys (confirmed): `revenue, cogs, gross_profit, operating_expenses, total_expenses, net_profit, income_accounts, expense_accounts, period_start, period_end`. It is journal-based, tenant-scoped, excludes reversed entries, and filters on `journal_entries.date`.

**Why this matters:** tools that sum `Sale.final_total`, `Expense.amount`, `Invoice.total_amount`, `Product.stock_quantity`, or `Party.balance` read a *different* source than the journal, so they can silently disagree with the P&L the customer trusts. That disagreement is exactly the class of bug the whole "Road to 100" exists to kill.

---

## 2. CURRENT STATE (what I verified in the file today)

`app/Http/Controllers/AiController.php`, dispatcher `private function executeFunction($name, $args)`:

| Line | Tool | Current source | Engine-aligned? |
|---|---|---|---|
| 419 | `get_sales_summary` | `Sale::sum('final_total')` on `created_at` + count | ❌ bypasses engine |
| 439 | `get_stock_level` **(#1)** | `Product->stock_quantity` (denormalized column) | ❌ + **duplicate** |
| 446 | `get_profit_summary` | `FinancialReportingService::getProfitAndLoss` | ✅ **C3.2b done** |
| 467 | `get_expense_summary` | `Expense` table on `date` + by-category | ❌ bypasses engine |
| 489 | `get_top_products` | raw join `sale_items`/`sales`/`products` on `created_at` | ❌ bypasses engine |
| 506 | `get_stock_level` **(#2)** | `Stock::sum('quantity')` (FIFO truth) | ⚠️ **dead/unreachable** (second match never runs) |
| 521 | `get_purchase_summary` | `Invoice type=purchase sum total_amount` on `date` | ❌ bypasses engine |
| 533 | `get_party_balance` | `Party->balance` (denormalized column) | ❌ bypasses engine |
| 544 | `analyze_cash_discrepancy` | `Sale.total` (cash) + `Account(1000)->balance` on `created_at` | ❌ bypasses engine |

**So: 1 of 8 read tools converted. 7 remain, and there is 1 duplicate handler to remove.**

Money + Core suite was **GREEN** on your last run — that's the baseline we must preserve after every task below.

---

## 3. THE TASKS (do in this order — cheapest/safest first)

> For each: edit **only** the named handler's body, run lint, run `optimize:clear`, run the full Money+Core suite, and confirm it stays green. Then send me the diff + output.

### ▶ C3.2c — Fix the duplicate `get_stock_level` and make stock read the FIFO truth
**Problem:** two handlers named `get_stock_level`. The **first** (line ~439) returns early using the denormalized `Product->stock_quantity`, so the **second** (line ~506, the correct `Stock::sum('quantity')` version) is **unreachable dead code**.

**Do:**
1. **Delete the second, unreachable handler** (the one at ~506).
2. **Replace the body of the remaining (first) handler** so stock quantity = `SUM(stock.quantity)` for that product, tenant-scoped — the same basis as the Inventory Valuation report. Keep the product lookup by name. Return `product`, `stock` (the FIFO sum), and `unit`.
3. Add the same permission guard the inventory/POS reads use (`$this->checkAuthPermission('pos');`) so behaviour is consistent.

**Acceptance:**
- Only **one** `get_stock_level` handler remains in the file.
- For any product, AI `stock` == `SELECT SUM(quantity) FROM stocks WHERE product_id = ? AND tenant_id = ?` == the qty shown in the Inventory Valuation report.
- Lint clean; full Money+Core suite stays green.

---

### ▶ C3.2d — `get_sales_summary` → revenue from the engine
**Problem:** sums `Sale.final_total` on `created_at`; this is gross, not net of returns, and uses the wrong date basis, so it can exceed the P&L "revenue".

**Do:** in the `get_sales_summary` handler, source the headline revenue from the engine:
```php
$pl = app(\App\Services\FinancialReportingService::class)
        ->getProfitAndLoss($args['start_date'], $args['end_date']);
$revenue = (float) $pl['revenue']; // net, journal-based — identical to the P&L card
```
Return `revenue` as the authoritative amount. You may keep a `transaction_count`, but it must be counted from the **same canonical sales scope** the Sales report uses (tenant-scoped, posted sales only, by business date) — not a raw `Sale::count()` on `created_at`. If the product-filter branch (`product_name`) is kept, document that it is a *filtered view* and is **not** expected to equal the global P&L revenue.

**Acceptance:** for an unfiltered range, AI `revenue` == `getProfitAndLoss()['revenue']` == direct journal income aggregate. Suite green.

---

### ▶ C3.2e — `get_top_products` → `getGrossProfitByProduct()`
**Problem:** raw `sale_items`/`sales` join on `created_at`; doesn't net returns; can diverge from the item-wise report.

**Do:** replace the raw query with the engine's item-wise method:
```php
$rows = app(\App\Services\FinancialReportingService::class)
        ->getGrossProfitByProduct($args['start_date'], $args['end_date']);
// sort by revenue desc, take $limit, map to {name, quantity, revenue, profit}
```
Match the field names the engine collection returns (inspect the collection shape; don't assume).

**Acceptance:** AI top-products rows equal the item-wise report rows (the existing `ReportReconciliationTest › item wise profit` proves the engine path; the AI must now read that same path). Suite green.

---

### ▶ C3.2f — `get_expense_summary` → reconcile headline to the engine
**Problem:** sums the `Expense` table, which is a different source than the P&L expense line (journal expense accounts).

**Do:** make the headline expense figure come from the engine:
```php
$pl = app(\App\Services\FinancialReportingService::class)
        ->getProfitAndLoss($args['start_date'], $args['end_date']);
$total = (float) $pl['operating_expenses']; // journal-based opex (COGS excluded)
```
Keep the `by_category` breakdown **as supplementary detail**, but the authoritative `total_expenses`/`operating_expenses` number returned to the AI must be the engine's. If the `Expense`-table total and the engine opex legitimately differ (e.g., some expenses don't post to expense accounts), **stop and tell me** — do not paper over a real discrepancy.

**Acceptance:** AI headline opex == `getProfitAndLoss()['operating_expenses']`. Suite green.

---

### ▶ C3.2g — `get_party_balance` → ledger truth (NOT the denormalized column) — **confirm source first**
**Problem:** returns `Party->balance`, a cached column that can drift from the ledger.

**Do (in two steps):**
1. **First, locate the canonical per-party balance source** — the same one the **Party Statement / Supplier Statement** report uses (the logic exercised by `Tester/tests/Feature/Money/SupplierStatementTest`). It is likely a dedicated ledger/statement service, **not** `Party->balance`. **Report what you find to me before editing.**
2. Then point `get_party_balance` at that source so the AI balance equals the statement's closing balance.

**Acceptance:** AI party balance == the party's closing balance in the Statement report == ledger aggregate for that party. Suite green. *(If the canonical source is ambiguous, stop and ask — this is money.)*

---

### ▶ C3.2h — `get_purchase_summary` → canonical purchase source — **confirm source first**
**Problem:** sums `Invoice(type=purchase).total_amount` on `date`; purchases don't appear in the P&L (they hit inventory until sold), so the canonical comparison is the **Purchases report**, not the engine P&L.

**Do (in two steps):**
1. **Locate what the Purchases report/controller uses** as its total (model, column, date field, and whether it nets purchase returns). **Report it to me.**
2. Align `get_purchase_summary` to that exact basis (same date column, same net-of-returns treatment, tenant-scoped).

**Acceptance:** AI purchase total == the Purchases report total for the same range. Suite green.

---

### ▶ C3.2i — `analyze_cash_discrepancy` → canonical cash basis (lower priority)
**Problem:** mixes `Sale.total` (not `final_total`), `Account(1000)->balance`, and `created_at`.

**Do:** use the canonical cash position (cash ledger / account `1000` via journal, same basis as the Balance Sheet) for the "system" figure, and use `final_total` + the standard posted-date basis for the sales it scans. Keep the helper's heuristic output, but its anchor numbers must match the cash ledger.

**Acceptance:** the "system cash" figure equals the Balance Sheet cash line for the same `asOf`. Suite green.

---

## 4. CAPSTONE — C3.3: permanent AI read-parity test

This is the part that makes Category 3 *provable* and keeps it from regressing. Create a new test that mirrors the existing `CalculatorParityTest` harness and adds a **4th lens: the AI tool output**.

**File:** `Tester/tests/Feature/Core/AiReadParityTest.php`
**Namespace:** `Tester\tests\Feature\Core`
**Extends:** `Tests\Feature\VenQoreTestCase`

**Pattern to copy:** open `Tester/tests/Feature/Core/CalculatorParityTest.php` and reuse its exact setup:
- `createTenant('ai-parity-store', 'ltd_3')`, `actingAsOwner($tenant)`, `seedTenantDefaults($tenant)`.
- Run the **golden transaction**: buy 10@50 + buy 10@100 (credit) via `POST /s/{slug}/v3/purchases`; sell 15@200 (credit) via `POST /s/{slug}/sales`; return 2 via `POST /s/{slug}/sales/{id}/return`.
- Compute the engine truth: `app(FinancialReportingService::class)->getProfitAndLoss($today,$today)` and the direct-DB "referee" journal aggregates (copy them from `CalculatorParityTest`).

**The new part — invoke the AI tools and assert parity.** `executeFunction` is `private`, so call it via reflection (no production change required):
```php
$ai  = app(\App\Http\Controllers\AiController::class);
$m   = new \ReflectionMethod($ai, 'executeFunction');
$m->setAccessible(true);

$profit = json_decode($m->invoke($ai, 'get_profit_summary',
            ['start_date' => $today, 'end_date' => $today]), true);

$this->assertEqualsWithDelta($frsRevenue,   (float)$profit['revenue'], 0.01);
$this->assertEqualsWithDelta($frsNetProfit, (float)$profit['profit'],  0.01);
```
Repeat assertions for each converted tool:
- `get_profit_summary` → `revenue`, `profit` match engine `revenue`, `net_profit`.
- `get_sales_summary` → `revenue` matches engine `revenue`.
- `get_top_products` → first row matches the top row of `getGrossProfitByProduct`.
- `get_expense_summary` → opex matches engine `operating_expenses`.
- `get_stock_level` (the product) → `stock` matches `SUM(stocks.quantity)` for that product.
- `get_party_balance` (the customer) → matches the statement/ledger balance.

**Permission gotcha (important):** `checkAuthPermission()` only early-returns for `role === 'platform_admin'`; an owner without the right `permissions` array will throw and fail the test for the wrong reason. For this test, invoke the tools as a user who passes the guard — simplest is to give the acting user `role = 'platform_admin'` (or grant `permissions = ['sales_view','finance','reports','pos','purchases','customers']`). This test proves **number parity**, not gating (gating is already covered by `GatingTest`/`GranularPermissionTest`).

**Acceptance:**
- `AiReadParityTest` passes on `amd_pos_test`.
- Whole gate green:
  `E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Money Tester/tests/Feature/Core`

---

## 5. DEFINITION OF DONE (Category 3)

- All 8 AI read tools either read the engine or read the same canonical source as their matching report.
- The duplicate `get_stock_level` is gone (one handler only).
- `AiReadParityTest` exists and is green, wired into the Core suite.
- Full Money + Core suite green on MySQL `amd_pos_test`, no skips.
- No write-path, engine-internal, or namespace changes were made.

---

## 6. WHAT TO SEND ME AFTER EACH TASK (so I can verify, not guess)

For every task above, reply with:
1. The **task ID** (e.g., C3.2d) and the **final handler code block** you ended on.
2. The **lint** result for `AiController.php`.
3. The **full** `artisan test … Money … Core` summary line (`Tests: N passed`) and any non-green lines.
4. For C3.2g / C3.2h: the **canonical source you found** *before* you edit, so I can confirm it's the right one.

I will read the actual file at each step and confirm it matches what you report before you move on. If a number doesn't reconcile, **stop at that task** — a mismatch here is a real money-truth bug, not a test nuisance.

---

## 7. EXPLICITLY OUT OF SCOPE (do not do these now)

- Legacy→single **write** engine consolidation (that's **C5**, last code epic).
- Renaming `V3` / "V12 Turbo" namespace.
- Editing `FinancialReportingService` or any controller's `store`/write logic.
- Adding indexes, migrations, or schema changes.
- Touching `routes/web.php` (no `ziggy:generate` needed — this work-order adds no routes).

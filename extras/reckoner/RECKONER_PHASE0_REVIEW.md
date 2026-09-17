# Reckoner rebuild — Phase 0 review

**Reviewed:** 16 Sep 2026, against the IDE's Phase 0 report, commit `47c6aa04` on `reckoner/baseline-2026-09`, and the files it created. I read the fixture, the census command, both census outputs and the edited matrix, and checked the claims against the code.
**Verdict: Gate 0 is not passed yet.** The branch freeze, the census command's skeleton and most VERIFY resolutions are good. But the census measured the wrong month through a cache, so none of its numbers mean anything, and the golden store was not built the way the plan requires and was built in the wrong database. These are fixable in about a day. Phase 1 must not start on top of them, because every later gate is judged by this census and this fixture.

Canonical documents after this review — keep these, delete every other copy (list in Part A, step 1):

- `extras/reckoner/RECKONER_TRUTH_REBUILD_PLAN.md` (revised: decisions recorded, counts corrected)
- `extras/reckoner/RECKONER_CARD_CONTRACT_MATRIX.md` (revised: IDE resolutions merged, corrections applied, decisions applied)
- `extras/reckoner/RECKONER_PHASE0_REVIEW.md` (this file)

---

## 1. What was done right

| Item | Assessment |
|---|---|
| Baseline branch and commit | Done correctly; nothing was lost. |
| Census command exists, read-only, refuses to run without `--tenant` | Good skeleton. |
| Test baseline recorded | Only the Reckoner suites were run (not the full suite), but the key failures are real: `TruthGateTest` fails 58 vs 349, and `L8RegistryContractTest` fails because new cards have `permissions => []`. |
| **12 older-Source cards, not 9** | **The IDE is right and my plan was wrong.** Three definitions written as `array_merge(self::scalar(…))` — `tax.collected`, `production.run_count`, `production.total_cost` — were missed by my key scan. Plan and matrix are corrected: 198 always-empty cards, 12 older-Source cards. |
| Most VERIFY resolutions | 17 of the 25 are accepted as written (see §4). |
| `parked_sales` was dropped and moved into `occupancies` | A real finding. My matrix still pointed at a table that no longer exists. |
| `product_serials.status` uses `available` | Correct. |

## 2. Blockers — why Gate 0 does not pass

### B1 — The census measured September, not August

`ReckonerCensusCommand.php:125-131` requests every card with `period: 'this_month'` and a `custom` window. `ReckonerPeriod::resolve()` only reads `custom` when the key is `'custom'` (`ReckonerPeriod.php:49`, `:116`). So `this_month` became September 2026, a month in which the golden store has no activity. That is why `core.revenue` shows 0.00 instead of 7,700. The only golden card that matched, `inventory.stock_value = 6,500`, is a live position that ignores the window.

The report's line *"0 / 349 accurate — confirms dashboard issue empirically"* does not follow from this data. Zero matches on the wrong month proves nothing either way.

### B2 — The census read through the Reckoner cache

The golden census shows **344 `ok`, 0 `empty`**, including gauges marked `ok` with no value (`core.gross_margin_pct`, `core.net_margin_pct`). That is root cause R7 (`Reckoner.php:258-269`): a cached `empty` is replayed as `ok` with a null value. The same code on the real store, run first, showed 117 `ok` and 227 `empty`. A census that goes through the cache reports the cache, not the calculation.

### B3 — The golden store was not built through the product's write paths

`tests/tests/fixtures/ReckonerGoldenStoreFixture.php`:

- **5 of the 11 events are hand-written journal entries** (`AccountingService::createEntry`), not the screens' code paths:
  - the cash→bank transfer (`:257`) writes no `fund_transactions` row;
  - the supplier payment (`:312`) posts with `reference_type 'supplier_payment'`, while the purchase-payment code and `purchases.paid_to_suppliers` expect `purchase_payment`, and it writes no allocation;
  - the rent (`:328`) creates no `expenses` row, so `expenses.count = 1` can never pass;
  - C1's receipt (`:341`) writes no `payments` row and no allocation.
  
  Balances are then patched by hand with `decrement('current_balance')` (`:324`, `:353`).
- **Sales go through `SaleService::post()`, but the counter and invoice screens use `SaleController::store()`.** That path writes `sales.source` (`SaleController.php:368`) and the `payments` rows (`:1666`, `:1679`). `SaleService::post()` never writes `source`, so the column defaults to `'manual'` (`2026_01_23_183106_add_source_to_sales_table.php:15`). Every fixture sale would therefore count as an invoice, and the `'source' => 'pos'` values the fixture passes are ignored.
- **The void is wrapped in a `try/catch` that swallows every error** (`:377-383`). If the void fails, S3 stays in the books and nothing says so.
- **C1's credit limit is never set.** The comment at `:184` says it is "then updated to 2,000"; no code does that, so `khata.over_limit` cannot match. (The engine does refuse a 5,500 credit sale over a 2,000 limit, so the plan's fixture is corrected: limit 10,000 on 2 Aug, lowered to 2,000 on 21 Aug.)
- **Products are created with `'category_name'`**, which is not a column. The products have no category, so `inventory.value_by_category` cannot match.
- **The 300 discount is passed twice**, once on the sale (`:297`) and once on the line (`:304`). S2 may have posted a 600 discount.
- **The chart of accounts is a hand-picked 12-account subset**, and the store is made with `Tenant::create`. CLAUDE.md names `StoreProvisioner` as the one store-creation path. With this setup, no modules are provisioned and accounts like 2060 and 4100 are missing.
- **No check that the postings match §8.** Gate 0 required the fixture's ledger to reproduce §8 or the differences to be raised. That step was skipped.

### B4 — The golden store was created in `venqore_pos`, not the test database

The fixture ran through `artisan tinker` against the app database: tenant 118, and at least one earlier partial run that failed on the credit limit. CLAUDE.md: `venqore_pos` is never to be written by tests; feature tests use `amd_pos_test`. The golden data — and any half-written rows from the failed run — must be removed from `venqore_pos`.

### B5 — The fixture folder breaks on Linux

The file is in `tests/tests/fixtures/` (lowercase) with namespace `Tests\Fixtures`. `composer.json` maps `Tests\\` → `tests/tests/`, so PSR-4 looks for `tests/tests/Fixtures/`. This works on Windows and fails on the Linux server and in CI.

### B6 — Expected values are copied into two classes

`GOLDEN_EXPECTED` in the census command duplicates `EXPECTED_VALUES` in the fixture. This breaks CLAUDE.md's "point, never copy" rule. The two copies will drift.

### B7 — Four copies of the plan and matrix

`RECKONER_TRUTH_REBUILD_PLAN.md` exists in the repo root and in `extras/`. The matrix exists as `RECKONER_CARD_CONTRACT_MATRIX.md` in the root, and as `Reckoner card contract matrix.md` in both the root and `extras/`. The IDE edited two of them. Only one of each may remain.

## 3. Owner decisions — recorded

| # | Decision |
|---|---|
| **D1** (owner) | Revenue = all money the business earns from customers — goods, services and other trading income. Every income account except 4200 *Stock Adjustment Gain*, split into goods / services / other. |
| **D7** (owner) | Counter and invoice are the same thing — a sale — on two screens. All revenue cards count both. `pos.*` = `source 'pos'`, `invoicing.*` = `source 'manual'` with no marketplace channel. Counter + invoice + marketplace must equal all sales (`channels_sum_to_sales`). Return documents are never counted as sales. |
| **D4** (decided for you) | Working capital excludes loans until a loans register shows what falls due within a year. Net cash position subtracts everything owed, loans included. The golden values are unchanged (the store has no loans). |
| **D10** (decided for you) | Low-stock threshold = `products.min_stock_alert`. The product form saves it and the inventory page and low-stock email use it; `alert_quantity` is read only by the Reckoner. This reverses my earlier recommendation — the code evidence points the other way. |
| **D16** (new, decided for you) | Stock quantity = `inventory_batches.remaining_qty`, the same source as valuation and the inventory page, checked against `stocks.quantity` by `stock_qty_control`. |
| D2, D3, D5, D6, D8, D9, D11–D15 | Recommended defaults accepted. D9 means the 5 `presales.*` cards stay unavailable until a pre-order flag exists. |

After applying them, the matrix has **0 DECIDE rows**: 283 READY, 33 FEATURE, 31 COLUMN, 2 VERIFY.

## 4. VERIFY resolutions — accepted, corrected, reopened

**Accepted (17):**

- `products.active_count`
- `pos.payment_breakdown`
- `quotations.win_rate`, `quotations.win_rate_trend`
- `recurring.trend`, `recurring.share_of_revenue` → COLUMN
- `transfers.pending_count`
- `batches.expired_value`, `batches.write_off_trend` → FEATURE
- `serials.in_stock`
- `purchase_returns.credit_due`
- `production.output_qty`
- `payments.by_method`, `payments.cash_vs_digital`
- `ai.top_insight`, `ai.alerts_open`
- `marketplace.stock_mismatch`

**Corrected (the IDE confirmed a column exists but defined the business meaning wrongly):**

| Card | IDE definition | Why it is wrong | Now |
|---|---|---|---|
| `quotations.open_value` | status `draft` or `sent` | A draft was never offered — it is not "waiting for a yes" | `sent` and not expired |
| `sales_orders.open_*` | status not cancelled/completed/delivered | Includes drafts, which are not accepted orders | also excludes `draft` |
| `po.open_*` | `draft`, `ordered`, `partial` | A draft PO was never placed with the supplier | `ordered`, `partial` |
| `po.fill_rate` | completion = `updated_at` | `updated_at` changes on any edit | back to **COLUMN** (`received_at` / `closed_at`) |
| `transfers.pending_value` | qty × `products.cost_price` | Static price; the plan values stock at FIFO cost | qty × remaining-weighted FIFO cost |
| `sales_returns.top_returned`, `by_reason` | sales with `status = 'returned'` | **Fully returned original sales carry `returned` too** — every such return would be counted twice. And there are **three return paths**: `ReturnController` (negative `SRET` sale, `original_sale_id` set), `SaleService::reverse()` (no negative row), `PosReturnController` | `original_sale_id IS NOT NULL` rows ∪ engine-path returns; totals must equal ledger `sale_return` postings (new check `returns_tie_to_ledger`) |
| `park.recalled_count` | closed occupancies with `source_id` not null | For a parked cart, `source_id` is always set (it is the cart id). Recall leaves the row open, and delete sets `closed_at` (`SaleController.php:1242-1289`). A closed row cannot tell a completed sale from a discarded one | back to **COLUMN**: needs `occupancies.close_reason` |
| `park.open_count`, `open_value`, `oldest` | not updated — still pointed at the dropped `parked_sales` | — | `occupancies` with `source_type = 'parked_sale'` |
| `tables.occupied`, `occupancy_rate` | not updated | Parked carts share `occupancies`; they would count as occupied tables | exclude `source_type = 'parked_sale'` |

**Reopened (still VERIFY):**

- **`tables.revenue_per_table`** — the link `source_id = sales.id` holds for no row the IDE checked. For parked carts, `source_id` is the cart id. Confirm what a *table* occupancy stores.
- **`accounting.drawings`** — `'owner_drawing'` only appears in a cash-flow classifier list (`FinancialReportingService.php:1635-1670`). That shows a label exists, not that anything posts it. Find a writer, or mark the card FEATURE.

## 5. Findings to carry into later phases

1. **Two sale write paths.** The screens use `SaleController::store()`, and `SaleService::post()` is a second engine. They must post identically, and `source` must be written on both, or `channels_sum_to_sales` will fail. Phase 1, item 15.
2. **Three return paths with different shapes** (above). The ledger's `sale_return` postings are the referee.
3. **`stocks.quantity` vs `inventory_batches.remaining_qty`.** The Reckoner's `InventorySource` counts one; the inventory page counts the other (`InventoryController.php:38-44`). D16 picks batches; `stock_qty_control` reports the gap.

---

## 6. IDE handoff — copy exactly

> Read `CLAUDE.md`, then `extras/reckoner/RECKONER_PHASE0_REVIEW.md`, then the revised `extras/reckoner/RECKONER_TRUTH_REBUILD_PLAN.md` (§6, §7.0, §8 changed) and `extras/reckoner/RECKONER_CARD_CONTRACT_MATRIX.md`.
>
> **Part A — finish Phase 0. No calculation code changes.**
>
> 1. Keep only the three canonical files under `extras/reckoner/`. Delete `RECKONER_TRUTH_REBUILD_PLAN.md` and `RECKONER_CARD_CONTRACT_MATRIX.md` from the repo root, `Reckoner card contract matrix.md` from the root and from `extras/`, and `extras/RECKONER_TRUTH_REBUILD_PLAN.md`. Do not edit the matrix by hand beyond resolving the 2 VERIFY rows; record their resolution in the report.
> 2. Remove the golden store from `venqore_pos`. List every row created by the fixture runs, including the failed first run — tenants, users, tenant_users, accounts, warehouses, products, parties, sales, sale_items, payments, purchases, purchase_items, inventory_batches, sale_item_batches, stocks, stock_movements, journal_entries, journal_items, party_snapshots. Show me the list, delete in foreign-key order inside one transaction, and prove zero rows remain for those tenant ids.
> 3. Move the fixture to `tests/tests/Fixtures/ReckonerGoldenStoreFixture.php` (capital F). Rebuild it per plan §8: create the store with `StoreProvisioner`; perform every event as an HTTP request by the owner to the route the matching screen uses (counter sale, invoice sale, purchase, supplier payment, customer receipt with allocation, expense, fund transfer, sale void, credit-limit change); use `Carbon::setTestNow()` per event; give both products real categories; apply the S2 discount once; no `try/catch` around events; no `decrement()` balance patches; no hand-written journal entries unless no screen exists for that event — name each such exception in the report. If a route cannot produce an event, stop and report it.
> 4. Add `tests/tests/Feature/Reckoner/GoldenStoreLedgerTest.php` (uses the test database). It builds the fixture and asserts, **directly from `journal_items ⋈ journal_entries ⋈ accounts`** (not through the Reckoner), every §8.1 money value: revenue 7,700; COGS 3,200; opex 4,000; cash 148,200; bank 48,000; AR 2,500; AP 3,000; inventory 6,500; tax payable 500; equity 201,700; plus: 1 `expenses` row; C1's 3,000 receipt allocated to sale S1; the 5,000 supplier payment allocated to purchase P1; S3 no longer a recognised sale, with its journal entry and mirror both `is_reversed = 1`; and `sales.source` = `pos` for S0/S2/S3 and `manual` for S1. **If an engine posts differently, the test fails and you report the difference. Never change an expected value.**
> 5. Expected values live only in the fixture class. The census reads them from there.
> 6. Fix the census: request every card with period `custom` plus `from`/`to`; bypass the Reckoner cache for the whole run; map every status, including `locked`. When run against the test database, it builds the fixture itself. Re-run it on the golden store, and on the real store 116 for the window 2026-08-01 → 2026-08-31, and replace both census files.
> 7. Run the **full** test suite (not only Reckoner) and report pass/fail counts grouped by test class.
>
> **Stop and report:** the deleted-rows list; the `GoldenStoreLedgerTest` result, with any engine differences quoted from the code; both new censuses; the full-suite summary; the resolution of the 2 VERIFY rows; the files changed. Do not start Phase 1 until told.
>
> **Part B — Phase 1** is specified in plan §7 Phase 1 and starts only after Part A is accepted. One addition to Phase 1: item 15 — make `SaleService::post()` write `sales.source` exactly as `SaleController::store()` does, and add a test that both paths produce identical sales, payments and journal lines for the same input.

# Reckoner Truth Rebuild — diagnosis, verdict on the two audits, and the phased plan

**Prepared:** 16 Sep 2026 · **Repo:** `app-code/main-app` · **Status:** plan · **Revised 16 Sep 2026 after the Phase 0 review** — owner decisions recorded (§6), card counts corrected (12 older-Source cards, not 9), census and golden-fixture rules tightened (§7.0, §8). Review: `RECKONER_PHASE0_REVIEW.md`.
**Companion file:** `RECKONER_CARD_CONTRACT_MATRIX.md` — one row per card (349), with what it returns today, the correct unit, the exact target definition, the data tier and whether the data even exists.
**Supersedes as the implementation handoff:** `RECKONER_349_CARD_REMEDIATION_PLAN.md` (Codex). That document is largely right; this one keeps what is right, corrects what is not, and adds what both audits missed. Keep it for history.

Every claim below was checked by reading the file it cites. Where something could not be proven from source (live data, a status value, a migration I did not read), it is marked **VERIFY** and Phase 0 resolves it before any code depends on it.

---

## 0. The short answer

**Is the Reckoner getting its data from the ledger?** For 9 of the 349 cards, yes. For everything else, no.

**Are the 349 values available?** No. At most **21 cards** compute a real number at all, and several of those carry defects (wrong period handling, wrong filters). The rest show one of: a permanent "No activity recorded" (198 cards), a row count wearing a money label (57), a hard-coded 0 or a permanent green tick (39 + 14), or a real calculation plotted under the wrong name (9).

**Could the ledger alone supply all 349?** No, and it should not try. The ledger is the authority for money: revenue, cost, profit, cash, bank, receivables, payables, tax, equity. It holds no product, quantity, staff, table, batch, attendance or document-status detail. The right design is the ledger as the **authority and the referee**, with operational data supplying detail and being **reconciled back** to the ledger.

**Why did the last attempt fail?** The previous build made 349 resolver *classes* and a test that counts them, instead of 349 *definitions* and a test that checks their numbers. A class that exists is not a number that is right. Working ledger code already existed under older names (`finance.receivables`, `finance.total_liquidity`, …), but the new dashboard asks for new names (`core.receivables`, `core.total_liquidity`, …) that go to a generic fallback. The frontend then papers over gaps with zeros and invented lines.

**The fix, in one sentence:** define every card as *a measure × a shape × a period* in one catalogue, compute measures from 16 tenant-scoped stream readers with the ledger as referee, store daily history for flows and closing balances, and refuse to show `ok` for anything that has not passed a hand-checked value test.

---

## 1. What actually happens today (verified)

### 1.1 The request path

```
NewDashboard.jsx ─POST /api/reckoner/read (≤24 keys)─► ReckonerController::read
   │                                                        │
   │   catalogue = ReckonerRegistry::v6Catalog()            ▼
   │   (all 349 keys, periods = every key,          Reckoner::readMany()
   │    no availability check)                        gates: exists → scope → permission
   │                                                  → plan → capability → module → period
   │                                                        │
   │                          ┌─────────────────────────────┴───────────────────────────┐
   │                          │ definition has 'source'?                                │
   │                    yes (12 of 349)                                        no (337 of 349)
   │                          ▼                                                         ▼
   │            Sources/*Source::resolveBatch()                  ResolverRegistry::resolve($key)
   │            (FinanceSource, InventorySource,                 → one of 349 twelve-line classes
   │             OperationsSource, SalesSource,                  → AbstractCardResolver::compute()
   │             StaffSource) — real queries                       ├─ core.*  → switch (18 real/wrong, 14 fake 0)
   │                                                               └─ others → prefix→table guess
   │                                                                    ├─ no table  → EMPTY (198)
   │                                                                    ├─ stat      → COUNT(*) rows (57)
   │                                                                    ├─ trend     → daily count/sum (11)
   │                                                                    └─ breakdown/list/gauge/status
   │                                                                          → success 0 / [] / 1 (39)
   ▼
 valuesFor / headlineOf / buildParts  ── fill missing with 0, interpolate lines, fall back across periods
```

### 1.2 The census (all 349, computed from the code paths above)

| What the card does today | Cards | Example |
|---|---|---|
| Always "No activity recorded" — no table mapped | **198** | every `khata.*`, `bank.*`, `tax.*`, `accounting.*`, `register.*`, `po.*`, `transfers.*` |
| Shows `COUNT(*)` of a table, whatever the label says | **57** | `purchases.spend` = number of bills; `pos.revenue` = number of sales; `customers.count` includes suppliers |
| Returns success with 0 / empty rows / always-green | **39** | `pos.payment_breakdown` = 0; `accounting.trial_balance_ok` = always 1 |
| `core.*` returns success 0 whenever the store has any sale | **14** | `core.receivables_aging`, `core.busiest_day`, `core.balance_sheet_ok` |
| Real calculation, wrong result or wrong series | **9** | `core.receivables`/`payables`/`total_liquidity` read keys that `getBalanceSheet()` never returns → 0; `core.cash_flow_trend` plots gross profit |
| Trend with generic daily count/sum; headline = last day | **11** | `purchases.spend_trend` |
| Real ledger calculation (P&L-based) | **9** | `core.revenue`, `core.cogs`, `core.net_profit`, margins |
| Real older Source (with the defects noted in the matrix) | **12** | `inventory.stock_value` (correct FIFO), `inventory.low_stock_count`, `tax.collected`, `production.run_count` |

> **Correction (Phase 0 review):** the first version of this table said 201 / 9. Three older definitions are written as `array_merge(self::scalar(…))` and were missed by my key scan: `tax.collected`, `production.run_count`, `production.total_cost`. The IDE's census counted 12 older-Source cards, which is right.

The IDE's "202 unmapped / 115 mapped" is reproducible from `determinePrimaryTable()`. But 12 of those keys never reach that method, because an older definition with a real `source` wins in `ReckonerRegistry::all()` (`ReckonerRegistry.php:1767-1776`). The real split is in the table above.

### 1.3 Root causes, in order of damage

**R1 — Readiness is inferred from existence.** `ReckonerRegistry::all()` stamps every new card `'implemented' => true` and `'permissions' => []` (`ReckonerRegistry.php:1767-1823`, `:1798`, `:1810`). `v6Catalog()` emits all 349 with `periods = every key` and a docblock that says *"Guaranteed that every reading emitted here has a verified calculation implementation"* (`:1896-1900`) — that is false. `CardRegistryGateTest` checks that 349 classes exist (`tests/tests/Unit/Reckoner/CardRegistryGateTest.php:25-39`). Nothing checks a value.

**R2 — Working code is orphaned by a key rename.** `FinanceSource` already computes receivables and payables from the ledger, liquidity from cash and bank accounts as of the period end, expenses by account, receivables aging, a profit trend with the right granularity, and balance-sheet status (`Sources/FinanceSource.php:47-200`). The V6 catalogue only emits the 349 new keys, so `finance.*`, `sales.*` and `party.*` readings are never requested. Their replacements (`core.*`) go to the generic resolver.

**R3 — The generic resolver guesses a table from the key prefix and a formula from the shape.** `AbstractCardResolver.php:268-415`. A prefix identifies neither the rows (status, type, date column) nor the aggregate. This cannot be fixed by "adding the missing prefixes and choosing `SUM` from `unit`" — see R4.

**R4 — The card metadata is itself wrong.** In `cards.json`, **58 of 349 cards carry a `unit` that does not match what the card measures** (each listed in the matrix), for example: `khata.receivable_total: count`, `tax.collected: count`, `accounting.assets_total: count`, `pos.sale_count: percent`, `pos.max_sale: count`, `services.revenue: percent`, `transfers.pending_value: days`, `inventory.units_on_hand: currency`, `core.working_capital: count`. Any fix that infers the formula from the unit — the IDE's proposal — would compute wrong numbers with a clean conscience. Also, the `streams` tags are **copied per module, not per card**: every card in a module has the identical stream list (checked for all 47 groups). They tell you nothing about what an individual card needs.

**R5 — The ledger service is called wrongly, and the ledger has gaps.**
- `core.receivables`/`core.payables` read `$bs['assets']['accounts_receivable']` and `$bs['liabilities']['accounts_payable']`. `getBalanceSheet()` returns `assets = ['label','accounts','total']` (`FinancialReportingService.php:1457-1547`). The lookup is always null → `?? 0.0` → a successful zero.
- The three different cards `core.total_liquidity`, `core.net_cash_position` and `core.working_capital` return the same (zero) lookup (`AbstractCardResolver.php:213-228`).
- `getBalanceSheet(string $asOf)` takes **one** argument and reads the tenant from `app('current.tenant')`. The resolver passes a second argument that PHP silently ignores. In any queued job, command or probe with no bound tenant, it throws.
- `getProfitAndLoss()` and `getProfitByPeriod()` **seed a chart of accounts on read** when accounts are missing (`:94-100`, `:199-217`). A dashboard read must not write.
- **Two different definitions of "cash":** `getCashFlowReport()` and `FinanceSource` use asset codes `1000–1099`; `getDetailedCashFlow()` uses `['1000','1010']` only.
- **Cash in/out counts internal transfers.** A 50,000 cash→bank deposit appears as 50,000 in *and* 50,000 out.
- **All bank accounts post to one GL account, `1010`** (`Models/BankAccount.php:25-90`). A per-bank balance can only come from a subledger built from `payments`, `expenses` and `fund_transactions`, which ignores reversals. The ledger cannot answer "balance in each account" today.
- **History is restated on reversal.** `AccountingService::reverseEntry()` marks both the original and its mirror `is_reversed = 1`, and the mirror is dated *today* (`Engines/AccountingService.php:246-330`). Every report filters `is_reversed = 0`, so voiding an August sale in September removes it from August. That matches the reports and is fine — but any stored history must be **recomputed for the original entry's date** when a reversal happens, or rollups and reports will disagree.

**R6 — Invariants are placeholders and appear never to run.** Six ledger checks return an unconditional `passed: true` (`Invariants/ReckonerInvariants.php:136-164`), and so do `liquidity_identity`, `aging_sums_to_total` and `list_total_matches_stat`. Unknown invariant names pass by default (`:64`). `checkAccountingEquation()` turns any exception into a pass (`:131-133`). `checkBalancedBooks()` filters on a column (`entry_date`) that does not exist, so it ignores the period. `trend_endpoint_matches_stat` is the wrong rule: the last day of a trend is not the period total. I found no caller of `ReckonerInvariants` in the Reckoner, controller, service or engine files I read; Phase 0 confirms with a repo-wide search.

**R7 — Cache and envelope bugs turn "empty" into "0".**
- A resolver result is cached as `$result->data` only; on a hit it is rebuilt with `ReckonerResult::success()` and no `empty` flag (`Reckoner.php:258-269, 295-297`). An `empty` card becomes `status: ok, value: null` on the next load, and the frontend renders that as 0.
- The resolver path never computes the comparison window, even though every new definition says `supports_comparison: true`.
- `ReckonerRequest::getCompositeId()` omits `granularity` (`ReckonerRequest.php:19-27`), so two requests that differ only by grain collide in one batch.
- The 9 older definitions allow only some periods (e.g. `sales_orders.count`: `live, today, this_month`), but `v6Catalog()` advertises every period. A card set to "Week" gets `invalid_period` and shows the error text.

**R8 — The frontend invents values** (`resources/js/Pages/NewDashboard.jsx`):
- `valuesFor()` (`:510-594`): when a scalar has no series it **draws a straight line from the previous value to the current one** and presents it as a trend. It fills every missing point with 0.
- `valuesFor()` maps server points by `YYYY-MM-DD`; for **Year** (grain month) nothing matches, so it takes the **last 12 days and plots them as 12 months**. For **Quarter** (grain week) it picks one day per week as that week's value. For **Today** (grain hour) a daily series never matches and is padded with zeros.
- `timeline()` builds a *rolling* 30 days for Month while the server computes the *calendar* month, so the start of the chart is always padded with zeros.
- `liveReading()` falls back to `key|latest` (`:452-457`) — a card set to Week can display the Month value.
- `buildParts()` (`:611-642`) invents segment names `Cash, Card, Credit, Bank, Online, Other` with zero values when there is no data.
- `readingOf()` returns `READINGS[0]` for an unknown key (`:644-661`) — wrong label and unit.
- `headlineOf()` (`:2084-2126`) shows `0` for `ok` with `value: null` (the cached-empty case), and for trend cards computes the delta as last point vs second-to-last point, not against the previous period.
- `LIVE_RECKONER_DATA` is never expired (`:357-455`) — a value stays until the page reloads.

**R9 — The gates are broken and nobody noticed.** `tests/tests/Feature/Reckoner/TruthGateTest.php` asserts `assertCount(58, $v6Catalog)` (`:45`) and `assertCount(58, $pageProps['readings'])` (`:86`). The catalogue now returns 349, so both must fail on the current working tree. Either the suite was not run after the change, or failures were ignored. Phase 0 runs the suite first and records the result.

**R10 — Data that does not exist anywhere.** Some cards cannot be computed by any Reckoner because the product never records the underlying fact: till shifts (7 `register.*`), bank statement lines (5 `recon.*`), a fixed-asset register (6 `assets.*`), loans (6 `loans.*`), saved/scheduled reports (3), label printing, warranty dates, bounced payments, recurring expenses, recipe/production wastage. The matrix lists **31 FEATURE** cards and **23 COLUMN** cards. These must show *"Not available yet — needs X"*, never a number.

### 1.4 Smaller confirmed defects worth fixing on the way

- `InventoryStockValueResolver` — the only resolver that overrides `compute()` — is **dead code**: the older `FinanceSource` definition of `inventory.stock_value` wins. Its fallback (`stocks × products.cost_price`) is also the formula `getInventoryValue()` explicitly forbids.
- `audit_logs` has **no `tenant_id`** column — it cannot back a tenant card. Use `store_activity_log`.
- `products` has **two** low-stock thresholds, `alert_quantity` and `min_stock_alert`. `InventorySource` reads `alert_quantity`.
- Batches live in **three** tables: `inventory_batches` (FIFO, with expiry), `batches` and `product_batches`. Variant stock lives in `product_variants.stock` **and** in `inventory_batches.variant_id`.
- `OperationsSource` `plan.usage_summary` counts `User::whereNotIn('role', ['platform_admin'])` — **every user on the platform**, not this store's (`Sources/OperationsSource.php:121`). Not one of the 349, but it is a cross-tenant count and must be fixed.
- `bank_accounts.type` includes `cash` and `mobile_wallet`; a "Bank Accounts" count must filter.
- `staff.on_shift_count` uses the server date, not the store's timezone. `staff.member_count` counts invited and suspended members.
- `.env` has `QUEUE_CONNECTION=sync` (CLAUDE.md). Anything "dispatched to a job" runs inside the web request. The history design below does not depend on the queue.

---

## 2. Verdict on the two audits

### 2.1 The IDE report

| Claim | Verdict | Evidence / correction |
|---|---|---|
| Only ~6 core cards touch the ledger | **Partly right** | 9 `core.*` cards compute from the ledger (P&L-based); 3 more *call* it but read the wrong keys. The older `FinanceSource` has ~12 correct ledger readings that the V6 catalogue no longer requests (R2) — the report missed this. |
| Accounting/khata/bank/tax cards bypass the ledger | **Right** | No table mapped → `empty` before any query. |
| 16 streams and `reckoner_daily` do not exist | **Right** | `Streams.php` and `Measures.php` are constant lists; I found no runtime reader in the files I read (Phase 0 re-confirms repo-wide). No migration file in `database/migrations` creates `reckoner_daily`. |
| 202 cards return empty "with value 0.0" | **Count right, detail wrong** | `empty` serialises `value: null`, not 0. It *becomes* 0 through the cache replay (R7) and the frontend (R8). 9 of the 202/115 never reach the generic resolver. |
| 115 cards return `COUNT(*)` or hard-coded 0 | **Right in substance** | 57 counts, 11 generic series, 39 fake 0/1, plus 8 that actually use older Sources (of the 12 older-Source cards, 8 have a mapped table and 4 do not). |
| Two disconnected Reckoner systems | **Right** | And the old one is the one that works. |
| Fix: expand the prefix→table map; pick `SUM/AVG` from `unit`/`topic` | **Wrong — do not do this** | 58 units are wrong (R4); a table does not identify status, type, date or reversal rules; the same table backs count, value, open, overdue and as-of balances. |
| Wire accounting/bank/khata/tax straight to `journal_items` | **Right direction, incomplete** | Per-bank balances are not in the ledger (all banks share 1010); tax by rate, khata overdue and aging need document data reconciled to the ledger. |

### 2.2 The Codex report and its handoff (`RECKONER_349_CARD_REMEDIATION_PLAN.md`)

| Claim | Verdict |
|---|---|
| Generic resolver counts rows, returns fake 0/1; only `InventoryStockValueResolver` overrides | **Right** — and that override is dead code (§1.4). |
| Balance-sheet key mismatch; three core cash cards share one value | **Right.** |
| `getBalanceSheet()` takes one argument | **Right.** |
| Ledger tie-out invariants return unconditional passes | **Right** — there are more than six, and none is ever called (R6). |
| Browser memory never refreshes; cached `empty` replays as success | **Right.** |
| `permissions = []`, `implemented = true`; `readMany()` does not check `implemented` | **Right.** |
| P&L read seeds accounts | **Right.** |
| Stale-value contradiction in the build spec; nullable `dim` cannot sit in a primary key | **Right.** |
| Warm-cache tenant isolation is untested (L1 flushes cache) | **Right** — but the cache key *does* include the tenant id (`Reckoner.php:647-657`); the risk is a future key change, so the test is still worth adding. |
| Plan structure: contract matrix → truth gate → isolation → streams → projections → invariants → history → release | **Sound.** Kept, reordered and made concrete below. |
| **Missed** | The orphaned working `finance.*` code (R2); the 58 wrong units and module-level stream tags (R4); the frontend's invented trends, Year/Quarter/Today grain bugs and fake segment names (R8); the broken `TruthGateTest` (R9); per-bank balances missing from the ledger, two cash definitions, transfers counted as cash flow, restated history on reversal (R5); `audit_logs` without `tenant_id`; the platform-wide user count; which cards have **no data at all** (R10). |
| **Too abstract to hand over** | It asks the IDE to invent 349 formulas. That is exactly how the last attempt failed. The matrix companion supplies them. It also proposes no concrete schema, no dirty-day mechanism, no golden numbers and no decision list. |

---

## 3. Design principles (non-negotiable)

1. **A card is a definition, not a class.** `card = measure(s) × shape × period × dimension × comparison`. `Revenue`, `Revenue Trend`, `Revenue vs Last Period` and `Revenue by Location` are one measure in four shapes, so they cannot disagree.
2. **One catalogue, generated everywhere.** `cards.json` gains a `contract`; a new `measures.json` holds the measure library. PHP registry, frontend catalogue, tests and docs are generated from these. No hand-kept second list (CLAUDE.md "point, never copy").
3. **The ledger is the authority for money and the referee for everything that touches money.** Operational measures are *pinned to the posting code*: "sales net revenue" means exactly what `SaleService` credits to 4000 (`net_sales`, pre-tax; returns debit 4000 on the return date — `Engines/SaleService.php:240-244, 700-765`).
4. **Honest status, always.** `ok` only when the measure executed, the contract is `verified` (golden value matched, isolation tests passed), and its checks passed. Otherwise `empty` (query ran, nothing there), `unavailable` (not built, or data not captured — with the reason), `locked` (module/plan/permission), `stale` (history not yet recomputed) or `error`. A real zero is allowed; an invented zero is a release blocker.
5. **Tenant isolation is explicit.** Every raw query filters `tenant_id` on every tenant-owned table in the join. No query relies on `HasTenant` alone. No service reads `app('current.tenant')` inside the Reckoner; the tenant id is passed.
6. **Reads never write.** No seeding, no snapshot rebuilds, no side effects on a dashboard read.
7. **Numbers are proved against hand-computed fixtures**, never against the current output.
8. **Today is always live.** Stored history is only used for closed days. A window touching today combines stored closed days with a live read of today.

---

## 4. Target architecture

```
                          ┌───────────────────────────────── cards.json (349 cards + contract) ─┐
                          │   measures.json (≈110 measures: definition, stream, kind, dims)     │
                          └─────────────────────────────┬───────────────────────────────────────┘
                                                        │ generated
                    ┌───────────────────────────────────▼──────────────────────────────┐
 /api/reckoner/read │ Reckoner::readMany  (gates unchanged, + contract-state gate)     │
 /api/reckoner/     │   └─► MeasureEngine::resolve(requests, ctx)                      │
   measures         │         1. expand card → measure requests (+ comparison window)  │
                    │         2. group by stream × window × tier                       │
                    │         3. closed days → reckoner_daily ; today → live stream    │
                    │         4. project to shape (stat/trend/compare/breakdown/list/  │
                    │            gauge/status/heatmap) ; derive ratios                 │
                    │         5. run the card's checks → envelope                      │
                    └──────┬───────────────────────┬──────────────────────┬────────────┘
                           │                       │                      │
             ┌─────────────▼──────────┐ ┌──────────▼───────────┐ ┌────────▼──────────────┐
             │ 16 Stream readers      │ │ reckoner_daily       │ │ reckoner_invariant_   │
             │ (tenant-scoped SQL,    │ │ flow | closing |     │ │ runs  (probe + CI)    │
             │  batched, pure reads)  │ │ snapshot rows        │ └───────────────────────┘
             │ Ledger · Sales · Purch │ └──────────▲───────────┘
             │ Stock · Party · Pay …  │            │ reckoner:rollup (cron, every minute)
             └───────────▲────────────┘            │ reads reckoner_dirty_days
                         │                ┌────────┴──────────────┐
         raw tables ─────┘                │ reckoner_dirty_days   │◄── marked inside the posting
                                          └───────────────────────┘    transaction (AccountingService,
                                                                        stock/document writers)
```

### 4.1 Measures (the heart of it)

A measure has: `key`, `kind` (`flow` additive over days · `balance` as-of · `position` current state · `distinct` non-additive · `derived` arithmetic), `stream`, `definition` (row filter + aggregate, in words and in SQL), `date_basis` (`je.date`, `sales.posted_at` in store timezone, `purchases.purchase_date`, …), allowed `dims` with cardinality caps, `unit`, `precision`, `ledger_control` (the invariant that referees it), and `definition_version` (bumped whenever the definition changes; invalidates cache and history).

The ≈110 measures fall out of the matrix. Examples:

| Measure | Kind | Definition |
|---|---|---|
| `gl.sales_revenue` | flow | Σ(credit − debit) on accounts with `role = sales_revenue`, non-reversed, by `je.date` |
| `gl.income` | flow | same over `type = income` (4000, 4100, 4200, 4900 …) |
| `gl.cogs` | flow | Σ(debit − credit), `role = cogs` |
| `gl.opex` | flow | Σ(debit − credit), `type = expense` and `role ≠ cogs`; dim `account` |
| `gl.cash_in` / `gl.cash_out` | flow | Σ debit / Σ credit on `role ∈ {cash, bank}` lines of entries that are **not** internal transfers (an entry whose every line is cash/bank) |
| `gl.balance[role]` | balance | Σ(debit − credit) signed by `normal_balance`, `je.date ≤ as_of`; roles `cash, bank, ar, ap, inventory, tax_output, tax_input, customer_advance, loan, fixed_asset, equity`; dims `account`, `party`, `bank_account` |
| `sales.net_revenue` | flow | Σ `sales.net_sales`, status ∈ `SaleStatus::REVENUE_RECOGNISED`, by `posted_at` in store tz; dims `channel, payment_method, warehouse, user, hour, weekday, price_tier` |
| `sales.line_net` / `sales.line_qty` / `sales.line_cogs` | flow | from `sale_items` (+ `sale_item_batches.total_cogs`, `is_reversed = 0`); dims `product, category, variant, tax_rate, product_type` (high-cardinality dims → on-demand only) |
| `sales.customers_active` | distinct | distinct party on recognised sales in window |
| `purchases.value` | flow | Σ `purchases.total`, workflow posted/received, by `purchase_date` — never `invoices` |
| `stock.value_fifo` | position | Σ `remaining_qty × unit_cost`, `inventory_batches`, `deleted_at is null` |
| `party.ar_by_party` | balance | `gl.balance[ar]` grouped by `journal_items.party_id` |

### 4.2 Four tiers of data, and what "history" can honestly mean

| Tier | Holds | History |
|---|---|---|
| **Flow** (`kind = flow`) | Revenue, costs, counts, cash in/out, tax flows, purchase value … | **Back-fillable for all time** from raw rows. Stored per day in `reckoner_daily`. |
| **Ledger balance** (`kind = balance`) | Cash, bank, AR, AP, inventory (GL 1100), tax, equity … | **Reconstructable for all time** — closing balance per day = previous closing + that day's movement. Stored as `closing` rows. |
| **Live position** (`kind = position`) | Stock units, FIFO value, open orders, parked sales, tables occupied, staff on shift | **Cannot be reconstructed** (`remaining_qty` is today's value). Captured nightly as `snapshot` rows **from go-live onward**. Before that date the trend says "history starts 20 Oct 2026", never zeros. |
| **On-demand** (`kind = distinct` / lists / rankings) | Top customers, dormant list, active customers, busiest day | Computed from raw rows for any window, cached. Non-additive, so never summed from daily rows. |

### 4.3 Freshness

- Today's portion of any window is read live. Only closed days come from `reckoner_daily`.
- `AccountingService::createEntry()` and `reverseEntry()` insert `(tenant, stream, day)` into `reckoner_dirty_days` **inside the same transaction** — for a reversal, both the reversal date and the **original entry's date**. Non-ledger writers (stock, documents) do the same where they already have a single write path; otherwise a nightly job re-derives the last 35 days for those streams.
- `php artisan reckoner:rollup` runs every minute from the scheduler (not the queue, which is `sync`), takes up to N dirty days per tenant, recomputes them, and deletes the marks. MariaDB 10.5 has no `SKIP LOCKED`; take a named lock (`GET_LOCK('reckoner_rollup', 0)`) so only one runner works.
- If a closed day in the requested window is still dirty, that part is read live from raw rows (slower, still correct). The envelope carries `meta.freshness = live | stored | mixed`.
- Cache key = tenant + card/measure + window + grain + args + `definition_version` + tenant `data_version` (a counter bumped when dirty marks are written). Cache the **whole envelope**, including status.

---

## 5. Schema changes

All tables `utf8mb4_unicode_ci`, `DB_CONNECTION=mariadb`. `tenant_id` must match `tenants.id` (**VERIFY**: `tenant_users` uses `foreignId` → `BIGINT UNSIGNED`; `dashboard_cards.tenant_id` is a `uuid` column — do not copy that). No nullable column in any primary key.

### 5.1 Reckoner infrastructure (required)

```php
// 2026_09_xx_000001_create_reckoner_daily_table.php
Schema::create('reckoner_daily', function (Blueprint $t) {
    $t->unsignedBigInteger('tenant_id');
    $t->date('day');                                   // store-local business date
    $t->string('measure', 64);
    $t->enum('kind', ['flow', 'closing', 'snapshot']);
    $t->string('dim', 32)->default('');                // '' = total, never NULL
    $t->string('dim_value', 64)->default('');
    $t->decimal('value', 20, 4)->default(0);           // money / quantity / balance
    $t->decimal('qty', 20, 4)->default(0);             // secondary amount where a measure needs one
    $t->unsignedBigInteger('n')->default(0);           // row count, so averages are sum ÷ n, never stored
    $t->unsignedSmallInteger('definition_version');
    $t->timestamp('computed_at');
    $t->primary(['tenant_id', 'measure', 'dim', 'dim_value', 'day']);
    $t->index(['tenant_id', 'day']);
});

// 2026_09_xx_000002_create_reckoner_dirty_days_table.php
Schema::create('reckoner_dirty_days', function (Blueprint $t) {
    $t->unsignedBigInteger('tenant_id');
    $t->string('stream', 32);
    $t->date('day');
    $t->string('reason', 64);
    $t->timestamp('first_marked_at');
    $t->unsignedSmallInteger('attempts')->default(0);
    $t->primary(['tenant_id', 'stream', 'day']);        // INSERT IGNORE — marking twice is free
});

// 2026_09_xx_000003_create_reckoner_invariant_runs_table.php
Schema::create('reckoner_invariant_runs', function (Blueprint $t) {
    $t->id();
    $t->unsignedBigInteger('tenant_id')->index();
    $t->string('invariant', 48);
    $t->date('window_from')->nullable();
    $t->date('window_to');
    $t->enum('status', ['pass', 'fail', 'unavailable']);
    $t->decimal('expected', 20, 4)->nullable();
    $t->decimal('actual', 20, 4)->nullable();
    $t->decimal('difference', 20, 4)->nullable();
    $t->json('details')->nullable();                   // ids only — no customer PII
    $t->timestamp('ran_at');
    $t->index(['tenant_id', 'invariant', 'ran_at']);
});

// 2026_09_xx_000004_add_data_version_to_tenants.php
$t->unsignedBigInteger('reckoner_data_version')->default(0);   // bumped with each dirty mark batch
```

Dimension rules for `reckoner_daily`: only low-cardinality dims are stored (`warehouse`, `channel`, `payment_method`, `user`, `hour`, `weekday`, `category`, `expense_category`, `account`, `tax_rate`, `bank_account`, `price_tier`). A guard refuses to write more than 200 distinct `dim_value`s per tenant × measure × day. Product-, customer- and document-level breakdowns are on-demand only.

### 5.2 Ledger foundation (required for correct money cards)

```php
// 2026_09_xx_000010_add_role_and_is_current_to_accounts.php
$t->string('role', 32)->nullable()->after('type');     // cash, bank, ar, ap, inventory, sales_revenue,
                                                       // other_income, cogs, opex, tax_output, tax_input,
                                                       // customer_advance, customer_credit, tips, loan,
                                                       // fixed_asset, accumulated_depreciation, equity, drawings
$t->boolean('is_current')->nullable()->after('role');
$t->index(['tenant_id', 'role']);
// Backfill by code for every tenant: 1000→cash, 1010→bank, 1100→inventory, 1200→ar, 1205→marketplace_clearing,
// 1300→prepaid, 1500→fixed_asset, 2000→ap, 2050→customer_credit, 2060→customer_advance, 2100→tax_output,
// 2150→tips, 2200→loan, 2300→tax_input, 3000/3100/3999/7000→equity, 4000→sales_revenue, 4100/4200/4900→other_income,
// 5000→cogs, other expense→opex. is_current: 1000-1300, 2000-2150, 2300 → 1; 1500, 2200, equity → 0 (D4).
// TenantDefaultSeeder and AccountingService::getAccountByCode() must set role on create.
// A test fails the build if any tenant has an account with role NULL after the backfill.

// 2026_09_xx_000011_add_bank_account_id_to_journal_items.php
$t->uuid('bank_account_id')->nullable()->after('party_id');   // bank_accounts.id is uuid
$t->index(['tenant_id', 'bank_account_id']);
// Posting change: every line on role cash/bank written by PaymentService, SaleService (bank tender),
// expenses, fund transfers and purchases carries bank_account_id.
// Backfill from the source document (payments.bank_account_id, expenses.bank_account_id,
// fund_transactions.from/to_account_id via journal_entries.source_id / reference).
// Invariant bank_subledger_control: Σ by bank_account_id = balance of role=bank, per day.
```

### 5.3 Card definitions

```php
// 2026_09_xx_000020_add_spec_to_dashboard_cards.php
$t->json('spec')->nullable()->after('args');          // custom cards: {measure, dims, filters, shape, compare}
$t->unsignedSmallInteger('definition_version')->nullable();
```

### 5.4 Data-capture migrations (unlock COLUMN/FEATURE cards — each needs its write path, not just the column)

| Migration | Write path that must fill it | Unlocks |
|---|---|---|
| `register_shifts` (tenant_id, register_id, opened_by, opened_at, opening_float, closed_by, closed_at, expected_cash, counted_cash, variance) + `sales.register_shift_id` | POS open/close shift | 7 `register.*` (**VERIFY** no shift store exists elsewhere first) |
| `bank_statement_lines` (+ match table) | statement import + matching screen | 5 `recon.*` |
| `fixed_assets` + accounts 1510/6500 | asset register + monthly depreciation posting | 6 `assets.*` (gross value can read GL 1500 in the meantime, labelled "from ledger") |
| `loans`, `loan_installments` + interest expense account | loan screen + EMI posting | 6 `loans.*` (outstanding can read GL 2200 in the meantime) |
| `report_definitions`, `report_runs` | reports module | 3 `reports.*` |
| `sale_items.entry_method` enum(scan, search, manual) | POS cart | `barcodes.scan_share` |
| `label_print_jobs` | label printing | `barcodes.labels_printed` |
| `product_serials.sold_at`, `warranty_until`, `status_changed_at` | serial sale/return | 3 `serials.*` |
| `payments.status`, `bounced_at` | cheque bounce flow | `payments.bounced` |
| `expenses.recurring_expense_id` / recurring template | recurring expenses | `expenses.recurring_total` |
| `parked_sales.status` (open, recalled, abandoned, expired), `resolved_at` | park/recall | 2 `park.*` |
| `purchase_orders.received_at`, `closed_at` | goods receipt | `po.avg_lead_days` |
| `stock_transfer_items.received_quantity` | transfer receive | `transfers.discrepancy_count` |
| `sales_orders.fulfilled_at` | delivery | `sales_orders.fulfil_rate` |
| `proposals.decided_at`, `recurring_invoices.cancelled_at` | status change | 2 cards |
| `occupancies.covers` | seat guests | 2 `tables.*` |
| `parties.city` (or area) | party form | `customers.by_area` |
| `sale_items.sale_uom`, `sale_uom_qty` | POS / invoice | 2 `uom.*` |
| production/recipe wastage capture | production close | 2 wastage cards |
| settings: `tax.filing_frequency`, `tax.filing_day`, `loyalty.point_value` (no migration) | settings screen | 2 cards |

Phase 9 schedules these as small features. Until each ships, its cards return `unavailable` with the reason.

---

## 6. Decisions — recorded 16 Sep 2026

| # | Question | Decision | By |
|---|---|---|---|
| D1 | What is "Revenue"? | **All money the business earns from customers** — goods, services and other trading income: every income account except 4200 *Stock Adjustment Gain* (a count correction, not money from anyone). The card splits it into goods / services / other. Net profit uses all income, with the stock gain as its own P&L line. | Owner |
| D2 | When a past sale is voided, does history change? | Yes — restated, matching every report. Stored history recomputes the original date. | Default accepted |
| D3 | Which clock defines a business day? | The store's timezone, for every filter, bucket and "today". | Default accepted |
| D4 | Loans in working capital / net cash position | **Working capital excludes loans** (they are not "due within a year" until a loans register says which part is). **Net cash position subtracts everything owed, loans included.** | Decided for owner |
| D5 | What is a "transaction"? | Posted documents: recognised sales + posted purchases + expenses + payments. | Default accepted |
| D6 | "New customer" | First recognised purchase in the window. | Default accepted |
| D7 | Counter vs invoice | **They are the same thing — a sale — entered on two screens** (counter for fast checkout, invoice for credit and formal documents). Every revenue card counts both together. `pos.*` cards show sales entered at the counter (`sales.source = 'pos'`); `invoicing.*` show sales entered on the invoice screen (`source = 'manual'`, no marketplace channel); marketplace orders are their own channel. Check `channels_sum_to_sales`: counter + invoice + marketplace = all sales. Return documents (`original_sale_id` not null) are never counted as sales. | Owner |
| D8 | "Average realised price" | Shown per product as a list. | Default accepted |
| D9 | Pre-orders | No pre-order flag exists. The 5 `presales.*` cards stay unavailable until `sales_orders.is_preorder` is added and written. | Default accepted |
| D10 | Low-stock threshold | **`products.min_stock_alert`** — it is what the product form saves (default 5) and what the inventory page and the low-stock email already use (`InventoryController.php:44, 214, 421`; `SendLowStockAlerts.php:59`). `alert_quantity` is read only by the Reckoner's `InventorySource`, which is why the dashboard can disagree with the inventory page. Copy any `alert_quantity` value into an empty `min_stock_alert`, stop reading `alert_quantity`, drop it later. | Decided for owner |
| D11 | Profit by location | Gross profit by location, labelled as such. | Default accepted |
| D12 | Batch truth | `inventory_batches`. | Default accepted |
| D13 | Variant stock truth | `inventory_batches.variant_id`. | Default accepted |
| D14 | AI anomalies and forecasts | Deterministic and explained; no LLM in the number path. | Default accepted |
| D15 | Who is expected to attend | Active cashier / manager / staff members, configurable. | Default accepted |
| D16 | Stock quantity truth (new) | **`inventory_batches.remaining_qty`** — the same source as valuation and the inventory page. `stocks.quantity` is checked against it by `stock_qty_control`; differences are reported, not hidden. | Decided for owner |

---

## 7. The phases

Each phase ends with a gate. **No phase starts until the previous gate passes and I have re-checked it.** Every phase report from the IDE must contain: files changed, migrations, the test commands run with pass/fail counts, the census table (§7.0), and the list of cards whose state changed.

### 7.0 The census command (built in Phase 0, run at every gate)

`php artisan reckoner:census --tenant=<golden> --from=2026-08-01 --to=2026-08-31 --format=md`

Rules (added after the Phase 0 review): request every card with period **`custom`** and the `from`/`to` window — any other period key ignores `custom` and silently measures the current month. Bypass the Reckoner cache for the whole run. Read expected values from the one fixture class, never a second copy. Map every envelope status, including `locked`.

For all 349 keys prints: dispatch path (measure/source/generic), contract state (`unimplemented / implemented_unverified / verified`), envelope status, value, expected value (from the golden fixture), match yes/no, checks run and their results. Read-only; tenant-scoped; refuses to run without `--tenant`. This is the single number that tells us where we are: **verified-and-matching cards / 349**.

---

### Phase 0 — Freeze, baseline, verify facts (no behaviour change) · ~1 day

1. Commit the current uncommitted Reckoner work on a branch `reckoner/baseline-2026-09` so nothing is lost and every later diff is readable.
2. Run the full suite; record results. Expected: `TruthGateTest::test_v6_catalog_contains_only_verified_tenant_scoped_readings` fails (asserts 58, gets 349). Record every other failure as-is.
3. Build `reckoner:census` (§7.0) and run it on a copy of a real scale-tier store and on an empty store. Commit the output as `extras/reckoner/census-baseline.md`.
4. Build the golden fixture store of §8 as a reusable test fixture (engine-driven, `Carbon::setTestNow()` per event) and record, for each §8.1 row, what the current code returns.
5. Resolve every **VERIFY** row in the matrix with `SHOW COLUMNS` / reading the writer code: `products.is_active`, status values for quotations, sales orders, purchase orders, transfers, serials, production runs; `sales.source` values; whether every receipt writes a `payments` row; how returns record lines; whether parked sales are deleted on recall; whether any till-shift store exists; `ai_recommendations.tenant_id`; the owner-drawing posting. Update the matrix.
6. Owner signs off decisions D1–D15.

**Gate 0:** baseline census committed; suite result recorded; golden fixture builds and its engine postings match §8 (or differences are raised); zero VERIFY rows left; decisions recorded in the matrix.

---

### Phase 1 — Stop showing false numbers · ~2–3 days

Goal: after this phase, **every number on the dashboard is either real or not shown**. Fewer numbers, zero lies.

Backend:
1. Add `contract_state` to every card (initially `unimplemented`), read from `cards.json`. `ReckonerRegistry::all()` stops stamping `implemented => true`; new-card definitions carry real `permissions` (from `config/permissions.php`, per module) and the real allowed `periods`.
2. `Reckoner::checkAvailability()` **and** `readMany()` both refuse `unimplemented` before cache lookup or dispatch, returning `status: unavailable, error.code: not_built` (new status; `ReckonerResult::unavailable()`), with zero queries. FEATURE cards return `error.code: data_not_captured` and the reason from the matrix.
3. Delete the generic fallbacks in `AbstractCardResolver` (the prefix map, `COUNT(*)`, fake 0/1, the `core.*` `default` branch). Nothing may return `success` without a contract.
4. **Re-point already-correct implementations** (no new SQL), and mark each `implemented_unverified`:
   `core.receivables → FinanceSource receivables` · `core.payables → payables` · `core.total_liquidity → finance.total_liquidity` · `core.receivables_aging → finance.receivables_aging` · `core.profit_trend → finance.profit_trend` (it plots gross profit today; the contract requires net profit — fix while re-pointing) · `core.balance_sheet_ok → finance.balance_sheet_ok` · `core.expenses_total/cogs/gross_profit/net_profit/margins → FinanceSource P&L group` · `inventory.stock_value → FinanceSource`. Delete `InventoryStockValueResolver`. A re-pointed card becomes `verified` in this phase only if it matches its §8.1 golden value **and** passes the two-tenant warm-cache test (§9); otherwise it stays `unavailable`.
5. Fix the cache: store and replay the whole envelope (`status`, `meta`, `checks`); never replay an `error`; include `granularity` in `getCompositeId()`.
6. `v6Catalog()` emits `contract_state`, `status_reason`, the real `periods`, `default_period`, corrected `unit` and `module` for every card; its false docblock is replaced.
7. Fix `OperationsSource` `plan.usage_summary` to count this store's members only.

Frontend (`NewDashboard.jsx`):
8. Render `unavailable` as a distinct state: "Not available yet" + reason. Card picker shows unavailable cards only under a "Coming soon" filter, never on the default board. Saved cards that become unavailable show the state; they are not silently removed.
9. Delete: the prev→current interpolation, zero-padding of series, the `|latest` fallback, the invented segment names, the `READINGS[0]` fallback, and `Number(x) || 0` on nulls. Null renders as "—".
10. Match responses to requests by `id` (composite id), not by key.
11. Stop client-side re-bucketing: send `granularity` with each request and plot the server's points on the server's timestamps (`series[].t`). Month = calendar month to date, as the server computes it.
12. Give `LIVE_RECKONER_DATA` a TTL taken from the envelope (`meta.ttl`), and clear it on tenant switch, period change, visibility regain after > TTL, and after the user saves a document.

Tests:
13. Replace `TruthGateTest`'s hard-coded 58 with: every emitted card has a `contract_state`; no `unimplemented` card can return `ok` via the API (iterate all 349, assert zero queries and `status = unavailable`).
14. Frontend unit tests for `valuesFor`, `headlineOf`, `buildParts`: null → "—", no interpolation, Year shows 12 monthly buckets from a monthly series.
15. *(Added after the Phase 0 review.)* Make `SaleService::post()` write `sales.source` exactly as `SaleController::store()` does (`SaleController.php:368`), and add a test proving both paths produce identical `sales`, `payments` and journal lines for the same input. Counter vs invoice cards (D7) depend on it.

**Gate 1:** census on the golden store shows **0 cards with `status ok` whose contract is `unimplemented`**; the re-pointed cards match the golden values in §8; the browser shows no numeric value for any unavailable card (Playwright screenshot pass on a scale-tier store with all modules on); suite green.

---

### Phase 2 — One catalogue: contracts and measures · ~3 days

1. Extend `cards.json` (generated from the map export — fix the **generator**, not the file) with a `contract` block per card: `measures[]`, `projection` (shape spec), `unit` (corrected), `precision`, `period_kind` (`flow | as_of | live`), `dims[]`, `tier`, `checks[]`, `status`, `status_reason`, `definition_version`. Source of truth for the values: `RECKONER_CARD_CONTRACT_MATRIX.md`.
2. Create `resources/data/reckoner/measures.json` — the measure library (§4.1): key, kind, stream, SQL definition (as a named builder, not a string), date basis, allowed dims and caps, unit, ledger control, version.
3. `CardRegistry` validates on load (and a unit test asserts): 349 unique keys; every referenced measure exists; every projection is legal for its measures' kinds (e.g. a `balance` measure cannot be summed across days into a stat; a `distinct` measure cannot be a stored flow); every `verified` card has a golden expected value; unit vocabulary is `currency | count | percent | ratio | days | hours | minutes | hour`.
4. Replace `Streams.php`/`Measures.php` constants with classes generated from the JSON, or delete them.
5. Remove `ResolverRegistry` and the 349 stub classes **at the end of Phase 4**, not now — Phase 1 already stops them answering.

**Gate 2:** the contract validator passes; the matrix file is regenerated from `cards.json` + `measures.json` and diffs clean against the reviewed version.

---

### Phase 3 — Ledger foundation · ~3–4 days

1. Migration 5.2 `accounts.role` / `is_current` + backfill for all tenants; seeder and `getAccountByCode()` set the role; build fails if any account has a null role.
2. `FinancialReportingService`: every method used by the Reckoner takes an explicit `tenantId` (add the parameter to `getBalanceSheet`, `getTrialBalance`, `getAgedReceivables`, `getAgedPayables`, `getReceivables`, `getPayables`); remove the seed-on-read from `getProfitAndLoss`/`getProfitByPeriod` (throw `MissingFinancialAccountException` → envelope `unavailable: chart_incomplete`); switch account lookups from codes to `role`.
3. One liquidity definition (`role ∈ {cash, bank}`) used by `getCashFlowReport`, `getDetailedCashFlow`, `FinanceSource` and the Measure Engine.
4. Internal-transfer exclusion for cash in/out (entry-level: all lines on cash/bank roles). Bank-level in/out excludes bank-to-bank only.
5. `LedgerStream` reader: `flows(measureKeys, windows, dims)` and `closingBalances(roles, days, dims)` — one query per (window set × dim), both `journal_items` and `journal_entries` filtered by tenant, `accounts` joined with its tenant filter.
6. Migration 5.2 `journal_items.bank_account_id`: posting changes in every writer, backfill command `reckoner:backfill-bank-dimension --tenant=`, invariant `bank_subledger_control`. Until the backfill for a tenant reconciles, per-bank cards stay `unavailable: bank_dimension_pending`.

**Gate 3:** the golden ledger values in §8.1 match exactly through `LedgerStream`; `bank_subledger_control` passes on the golden store and on a production copy after backfill; a query log of the whole Gate-3 test shows `tenant_id` on every tenant table in every statement; a dashboard read on a store with no chart of accounts writes zero rows.

---

### Phase 4 — Measure Engine and the 349 cards, domain by domain · ~3–4 weeks

1. `app/Reckoner/Engine/MeasureEngine.php` — expands cards into measure requests (incl. comparison window), groups by stream × window, calls stream readers once per group, projects shapes, derives ratios (null on a zero denominator), attaches checks, returns envelopes. `Reckoner::readMany()` dispatches every contract card here. Older `Sources/*` are either wrapped as stream readers or retired once their keys are covered.
2. Stream readers (`app/Reckoner/Streams/*Stream.php`), each pure, tenant-explicit, batched: Ledger, SalesHeaders, SalesLines, PurchaseHeaders, PurchaseLines, StockMovements, StockPositions, PartyBalances, Payments, Expenses, Tax, Production, Attendance, DocStatus, MasterRegistry (+ the ledger's accounts view). Each documents its tables, joins, tenant predicates, status and date rules at the top of the file.
3. Projections (`app/Reckoner/Engine/Projections/*`): Stat, Trend (single and multi-series, server grain: `hour` for today/yesterday, `day` ≤ 62 days, `week` ≤ 26 weeks, `month` beyond), Compare, Breakdown (segments must sum to the parent within 0.01 or the check fails), List (with `truncated` and `total`), Gauge, Status, Heatmap.
4. Deliver in four slices. A card moves to `verified` only when its golden value matches, its checks pass, and its isolation tests pass.

| Slice | Modules (cards) | Must also pass |
|---|---|---|
| **4a Money** | Qore 32 · accounting 9 · khata 9 · tax 8 · bank 9 · payments 8 · expenses 9 → **84** | `balanced_books`, `accounting_equation`, AR/AP/tax controls, `liquidity_identity`, `gross/net_profit_identity` |
| **4b Selling** | pos 11 · invoicing 10 · customers 10 · sales_returns 6 · quotations 6 · sales_orders 7 · pricing 5 · services 7 · staff 8 · locations 6 · loyalty 6 · marketplace 6 · recurring 6 · proposals 6 → **100** | `revenue_ties_to_ledger` (Σ sales.net_revenue − returns = gl.sales_revenue per day), breakdowns sum to parent |
| **4c Stock & buying** | inventory 12 · products 10 · suppliers 8 · purchases 9 · po 6 · purchase_returns 5 · landed 5 · batches 7 · transfers 5 · stocktakes 5 · variants 5 · barcodes 5 · uom 5 · serials 5 · composite 5 · cookbook 6 · production 8 → **111** | `cogs_ties_to_ledger` (Σ sale_item_batches.total_cogs = gl.cogs per day), `stock_value_control` (FIFO value = GL 1100 at as-of, difference reported) |
| **4d Operations** | tables 8 · park 5 · presales 5 · register 7 · recon 5 · assets 6 · loans 6 · reports 6 · ai 6 → **54** | FEATURE cards stay `unavailable` with their reason; interim GL cards labelled |

5. For each slice, the golden fixture (§8) is extended with hand-computed values for every card in it, **reviewed by me before implementation starts**. Expected numbers are never copied from output.
6. Per card, the test matrix: populated window, empty window, empty tenant, second tenant with larger data (must not change the first), reversal inside the window, backdated posting, window boundary at 23:59/00:00 store time, zero denominator, and shape contract.
7. End of Phase 4: delete `ResolverRegistry`, `AbstractCardResolver`, the 349 stubs, `build_all_resolvers.py`, and the prefix maps. `CardRegistryGateTest` becomes a contract-and-value gate.

**Gate 4 (per slice):** census shows every card in the slice `verified` and matching, or `unavailable` with a documented reason; all ledger controls for the slice pass on the golden store and on a production copy (differences on the production copy are reported to the owner, not hidden).

---

### Phase 5 — Invariants that can fail · ~3 days (starts with 4a, finishes with 4c)

1. Rewrite `ReckonerInvariants` so each check computes both sides independently (the referee never calls the function it referees), returns `pass | fail | unavailable` with expected/actual/difference, and unknown names **fail**.
2. Replace `trend_endpoint_matches_stat` with `trend_sums_to_stat` for flows and `trend_endpoint_matches_stat` only for balances.
3. Add `bank_subledger_control`, `list_total_matches_stat` (owing lists = AR/AP), `aging_sums_to_total`, `channels_sum_to_sales` (D7), `stock_qty_control` (D16: batches vs `stocks`), and `returns_tie_to_ledger` (all three return screens together = `sale_return` postings).
4. Cards carry their checks in the envelope (`checks: [{key, status, difference}]`). Policy: a `fail` on a ledger control turns the card to `status: error, code: books_disagree` with the difference shown to owners; `unavailable` on a check leaves the value visible with a warning badge.
5. Adversarial tests: corrupt one side at a time (delete a journal line, change a `net_sales`, zero a batch cost, post an unbalanced entry via raw insert), assert the specific check fails; restore, assert it passes.
6. `php artisan reckoner:probe` nightly: all active tenants × all verified cards × this_month and last_month; writes `reckoner_invariant_runs`; alerts on any `fail` and on `empty` rates that jump.

**Gate 5:** every adversarial test fails its check and recovers; the probe runs on a production copy and its report is reviewed.

---

### Phase 6 — History · ~1–1.5 weeks

1. Migrations 5.1.
2. Dirty marking inside `AccountingService::createEntry()` and `reverseEntry()` (reversal date **and** original date), and in the single write paths for stock, documents and attendance where they exist. Bump `tenants.reckoner_data_version`.
3. `reckoner:rollup` (scheduler, every minute, `GET_LOCK`), `reckoner:backfill --tenant= --from= --to= [--measure=]` (resumable, chunked by month, dry-run by default, logs rows written), `reckoner:snapshot` (nightly, `position` measures).
4. MeasureEngine reads closed, clean days from `reckoner_daily`, dirty or today from streams, and reports `meta.freshness`.
5. Parity test: for the golden tenant and a production copy, every flow and closing measure over 13 months — stored read equals live read to 0.01. Void an old sale, run rollup, parity again. Post a backdated expense, run rollup, parity again.
6. Position-measure trends show "history starts <snapshot start date>" before the first snapshot.

**Gate 6:** parity is exact; a "Year" revenue trend on a production copy returns in < 300 ms p95 on the server; backfill of one year for the largest tenant completes and reconciles.

---

### Phase 7 — Freshness and the dashboard · ~3 days

1. Per-tier TTL in the envelope: live positions 30 s, today's flows 60 s, closed windows until `data_version` changes.
2. Frontend revalidates on TTL expiry, focus, period change, tenant switch and after local saves; shows `asOf` on hover; shows "updating" for `mixed` freshness.
3. Cards that belong to one measure share one request per window.
4. Playwright pass: every card shape × every period on the golden store — no NaN, no "undefined", no invented segment names, headline equals the value the API returned, trend points equal the API series.

**Gate 7:** the Playwright pass and a manual walkthrough of a scale-tier production copy with all modules on.

---

### Phase 8 — Build your own card · ~1–1.5 weeks

1. `GET /api/reckoner/measures` — measures this user/plan/modules can see, each with legal shapes, dims, filters, periods and comparison options (generated from `measures.json`; permission-gated per measure).
2. `dashboard_cards.spec` (5.3): `{measure | derived formula, dims, filters, shape, compare}` validated server-side against the measure's legality and `LayoutLaw`; stored with `definition_version`.
3. Derived custom measures are limited to safe arithmetic over existing measures (`a ÷ b`, `a − b`, `a + b`, `a × const`) — no SQL, no model-generated queries (CLAUDE.md rule 2).
4. Custom cards run through exactly the same engine, checks and cache as the 349.

**Gate 8:** a user can build "Revenue by payment method, this quarter vs last" and "Gross margin % by location, monthly for a year", and both match hand-computed fixture values.

---

### Phase 9 — Capture the missing data · scheduled per module

Implement §5.4 one row at a time; each row is its own small feature with its own tests, then its cards go through the Phase 4 verification.

---

## 8. Golden fixture — the numbers every phase is judged against

Build this store **through the same write paths the product's screens use**, as feature-test HTTP requests by the store owner (`actingAs` → the routes behind the counter, invoice, purchase, payment, expense, fund-transfer and void screens), so tenant middleware, `payments` rows, allocations, `sales.source` and journal postings are all exercised. Create the store with `StoreProvisioner` (the single store-creation path), not `Tenant::create`. No hand-written journal entries except the owner's capital injection, and only if no screen exists for it. No `try/catch` around an event — a failed event fails the fixture. It runs **inside the test database (`amd_pos_test`)**, never `venqore_pos`. Expected values live in this fixture class only. Store timezone `Asia/Karachi`. Two products: **Widget** (category A) and **Gadget** (category B), both with a real category. Customer **C1**. Suppliers **S1**, **S2**. One cash account, one bank account.

| Date | Event |
|---|---|
| 2026-07-10 | Purchase P1 from S1: 20 Widgets @ 400 = 8,000 on credit, due 2026-08-09 |
| 2026-07-15 | Owner capital 200,000 into cash |
| 2026-07-20 | Sale S0, walk-in at the counter: 2 Widgets @ 1,000 = 2,000 cash, no tax |
| 2026-08-01 | Transfer 50,000 cash → bank (fund-transfer screen) |
| 2026-08-02 | C1 credit limit set to 10,000 |
| 2026-08-03 | Sale S1 to C1 **on the invoice screen**: 5 Widgets @ 1,000 = 5,000 + 10% tax 500, credit, due 2026-08-17 |
| 2026-08-05 | Sale S2, walk-in **at the counter**: 3 Widgets @ 1,000 less one 300 discount (on the sale, not repeated on the line) = 2,700 cash, no tax |
| 2026-08-10 | Pay supplier S1 5,000 from bank (payment screen, allocated to purchase P1) |
| 2026-08-12 | Rent expense 4,000 cash (expense screen) |
| 2026-08-20 | C1 pays 3,000 into bank (receipt screen, allocated to sale S1) |
| 2026-08-21 | C1 credit limit lowered to 2,000 (the engine refuses a credit sale over the limit, so the over-limit state is reached the way it happens in real life) |
| 2026-08-25 | Sale S3, walk-in at the counter: 1 Widget @ 1,000 cash — **voided 2026-08-26** |
| 2026-08-28 | Purchase P2 from S2: 10 Gadgets @ 250 = 2,500 cash |

### 8.1 Expected values — window 2026-08-01 → 2026-08-31, comparison July, as of 2026-08-31

| Card | Expected | Card | Expected |
|---|---|---|---|
| core.revenue | **7,700** | core.total_liquidity | **196,200** |
| core.cogs | **3,200** | bank.cash_vs_bank | cash **148,200** · bank **48,000** |
| core.gross_profit | **4,500** | bank.balances_total | **48,000** |
| core.expenses_total | **4,000** | bank.money_in / money_out | **53,000** / **5,000** |
| core.net_profit | **500** | payments.received / paid / net_flow | **5,700** / **11,500** / **−5,800** |
| core.gross_margin_pct | **58.44** | core.cash_flow_trend Σ in / Σ out | **5,700** / **11,500** (transfer and voided sale excluded) |
| core.net_margin_pct | **6.49** | core.receivables = khata.receivable_total | **2,500** |
| core.expense_ratio | **51.95** | core.payables = khata.payable_total | **3,000** |
| core.revenue_vs_prev | **+285.0 %** | khata.net_position | **−500** |
| core.profit_vs_prev | **−700** | khata.collected | **3,000** |
| core.receivables_aging | 0–30 days: **2,500** | khata.over_limit | C1 (2,500 > 2,000) |
| core.payables_aging | 31–60 days: **3,000** | purchases.unpaid_value / overdue_value | **3,000** / **3,000** |
| accounting.assets_total | **205,200** | purchases.spend / count | **2,500** / **1** |
| accounting.liabilities_total | **3,500** | purchases.paid_to_suppliers | **5,000** |
| accounting.equity_total | **201,700** (capital 200,000 + retained 1,700) | tax.collected / tax.paid / tax.net_liability | **500** / **0** / **500** |
| core.working_capital | **201,700** | tax.by_rate | 10 %: **500** |
| core.net_cash_position | **192,700** | tax.taxable_vs_exempt | **5,000** / **2,700** |
| accounting.trial_balance_ok / core.balance_sheet_ok | **ok** | All recognised sales (S1 + S2, every channel): net revenue, count, average, largest | **7,700**, **2**, **3,850**, **5,000** |
| core.journal_entries_count | **7** ¹ | Items per sale (every channel) | **4** |
| core.reversal_count | **1** | Discounts given | **300** |
| inventory.stock_value | **6,500** (= GL 1100) | customers.active / customers.new | **1** / **1** |
| inventory.units_on_hand | **20** | customers.owing | C1 **2,500** |
| inventory.value_by_category | A **4,000** · B **2,500** | suppliers.owed_list | S1 **3,000** |
| expenses.count / by_category | **1** / Rent **4,000** | expenses.unpaid | **0** |

Run each event with `Carbon::setTestNow()` at its date, so the void's reversal entry is dated 2026-08-26 and "as of" reads are deterministic. Counter-only (`pos.*`) and invoice-only (`invoicing.*`) splits follow decision D7: S2 is counter, S1 is an invoice.

¹ Assumes each event posts exactly one journal entry. If an engine posts two (for example a sale and a separate receipt), record the real count in Phase 0 and explain it — do not change any money value to compensate.

If an engine posts differently from this table (for example, discount to a separate account, or the void not restoring the batch), that is a **finding to raise with the owner**, not a reason to edit the expected value.

Slices 4b–4d extend this store (a service job, a sales order, a quotation, a production run, a stock take, a transfer, attendance rows, a second warehouse) with values computed the same way, reviewed before implementation.

---

## 9. Tenant isolation and permissions — tests that must exist

- **Two-tenant contamination** for every verified card: record tenant A, add large data of *every* stream type to tenant B, re-read A without flushing cache — unchanged; then read B — its own values.
- **Warm-cache switch** A → B → A in one process.
- **Query log** during the full card run: every statement touching a tenant table carries that table's `tenant_id` predicate (parse the log, including joined aliases and subqueries).
- **Denied reads run zero queries** — no membership, suspended membership, missing permission, module off, plan off, unavailable card.
- **Job context**: `reckoner:rollup`, `backfill`, `snapshot` and `probe` process tenants A then B in one process and write only their own rows; they refuse to run without an explicit tenant list.
- **Platform scope**: platform keys requested in tenant context return `not_found`.

---

## 10. How I will verify the IDE's work (the checklist I will run after each phase)

1. Read every changed file named in the IDE's report (CLAUDE.md rule 6) and compare against this plan, section by section.
2. Run `reckoner:census` on the golden store and a production copy; compare against the expected table and the previous census. Any card that changed state without a listed reason fails the phase.
3. Grep for forbidden patterns: `?? 0` / `?? 0.0` / `|| 0` in any card path; `COUNT(*)` without a contract; `app('current.tenant')` inside `app/Reckoner`; `DB::table(` without a `tenant_id` predicate in `app/Reckoner`; `withoutGlobalScopes` in card reads; any provider or seeding call from a read path; `Math.random`/interpolation in `NewDashboard.jsx`.
4. Re-run the adversarial invariant tests and the isolation tests myself.
5. Open the dashboard on a scale-tier store with every module on and compare ten random cards against a direct SQL referee I write independently.
6. Report per phase: **verified cards / 349**, cards unavailable with reason, failures, and a yes/no on the gate.

---

## 11. Handoff prompt for the IDE (copy exactly)

> Read `CLAUDE.md`, then `RECKONER_TRUTH_REBUILD_PLAN.md` in full, then `RECKONER_CARD_CONTRACT_MATRIX.md`. Implement **Phase 0 only**, then stop and report.
>
> Rules for every phase: do not invent formulas — every card's definition is in the matrix; if a definition looks wrong, stop and say so. Do not infer a formula from a card's `unit`, `topic` or key prefix. Do not mark a card `verified` unless its hand-computed golden value matches and its checks and isolation tests pass. Never return `success` with a guessed 0, an empty list, or a green status for something not computed — return `unavailable` with a reason. Never edit an expected value to match output. Every raw query filters `tenant_id` on every tenant table it touches, and reads never write. Preserve the existing uncommitted work by committing it to `reckoner/baseline-2026-09` first.
>
> At the end of each phase report: files changed, migrations, test commands with pass/fail counts, the `reckoner:census` table, cards whose state changed and why, and anything in the plan you believe is wrong. Do not start the next phase until told.

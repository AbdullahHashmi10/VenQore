# The Reckoner — Correction Spec

**Part 3. Remediation of Parts 1 and 2.**
Version 1.0 · 2026-08-12
App root: `app-code/main-app`
Prerequisite reading: `VENQORE_RECKONER_BUILD_SPEC.md` (Part 1), `VENQORE_CARD_BUILDER_BUILD_SPEC.md` (Part 2)

> **This document fixes what the last two builds got wrong.**
>
> It was written against the actual code on disk on 2026-08-12, not against the previous specs' intentions. Every line number below was verified.
>
> **Do not treat the Reckoner as finished until this document's Phase C4 acceptance criteria pass.** Right now the product contains two dashboard systems, six duplicated definitions, and twelve metrics that return invented data to the user.

---

## 0. State of the build — verified

### 0.1 What is genuinely correct

Credit where it is due; do not rewrite any of this.

| Component | State |
|---|---|
| `app/Reckoner/` — 23 files | Sound. Six gates in the correct order, tenant-scoped, cached, timezone-aware, 18 period keys |
| Batch-by-source | Correct. Seven P&L metrics resolve from one `getProfitAndLoss()` call |
| The 34 Phase-1 metrics | **Real.** They call `FinancialReportingService` and real tables |
| Composite batch keys | **Fixed correctly.** `{key}\|{period}\|{md5(args)}` — two periods of one metric no longer collide |
| Comparison windows | **Fixed correctly.** `previous` / `change_pct` present; zero-baseline returns `null`, not `+100%` |
| Routes + Ziggy | Registered; 295/295 parity |
| Dashboard shell | Migrations, models, sanitizer, 11 endpoints, grid, builder, lock — all real |
| 112 tests green, production build clean | True |

### 0.2 What is wrong

| # | Defect | Severity |
|---|---|---|
| **D1** | **12 metrics return hardcoded invented data** to the end user | **Critical** |
| **D2** | Nothing outside `Api/ReckonerController` consumes the Reckoner — zero references in `app/Http/Controllers/**` and zero in `resources/js/` | **Critical** |
| **D3** | All six §7 canonicalisation conflicts still live; ageing is now **four** schemes, not three | High |
| **D4** | `WidgetRegistry` / `WidgetDataService` still actively used by `WorkspaceDashboardController` and `OverviewDashboardController` — two dashboard systems in production | High |
| **D5** | `ReportController.php:1284` — label reads "31-60 days", sums the `30-60` bucket | Medium |
| **D6** | Low stock double-counts: out-of-stock products appear in **both** `low_stock_count` and `out_of_stock_count` | Medium |
| **D7** | Test suite asserts *shape*, never *truth* — no test would fail if every source returned a constant | High |

---

## 1. D1 — The fabricated metrics

### 1.1 What is actually in the code

Verified literals, on disk today:

| File:line | Metric | Returns |
|---|---|---|
| `SalesSource.php:75-76` | `sales.top_products` | `'Basmati Rice 5kg'`, `'Cooking Oil 5L'` |
| `SalesSource.php:97-98` | `sales.live_feed` | `'Invoice #1001'`, `'Ali Raza'`, `'10 mins ago'` |
| `SalesSource.php` (heatmap) | `sales.hourly_heatmap` | `Monday 12:00 → 15 sales` |
| `PartySource.php:62-63` | `sales.top_customers` | `'Walk-in Customer'`, `'Ali Raza'` |
| `InventorySource.php:68-69` | `inventory.low_stock_list` | `'Sugar 1kg'`, `'Salt 500g'` |
| `FinanceSource.php:103-105` | `finance.expenses_by_category` | Rent 1200 / Utilities 800 / Salaries 1000 |
| `FinanceSource.php:116-118` | `finance.receivables_aging` | 45000 / 27000 / 18000 |
| `FinanceSource.php:129-142` | `finance.cash_flow_trend` | Money In 5000→7000, Money Out 3000→4500 |
| `FinanceSource.php:88-95` | `finance.profit_trend` | `-1500`, `800`, `3200` |
| `OperationsSource.php` | `plan.usage_summary` | `value: 412, max: 500, target: 450` |

Two are worse than the rest because they *look* real:

- **`sales.revenue_trend`** takes genuine revenue and splits it `0.4 / 0.6 / 1.0` across three invented dates.
- **`sales.payment_breakdown`** takes genuine revenue and splits it 60/40 cash/card from thin air.

A fabricated ratio applied to a real total produces a chart that is plausible, wrong, and much harder to catch than obvious dummy data.

### 1.2 Why this is the most serious defect in the project

Part 1 §7.14 exists precisely for this case and says the opposite of what was built:

> *"`production.total_cost` returns a real figure or `not_applicable` — **never `0`** as a placeholder. A card showing a confident `0` is worse than a card showing 'not available'."*

Inventing `'Ali Raza'` is strictly worse than showing `0`. A zero at least looks like an absence. A named customer who does not exist in the tenant's database looks like a fact, and the user has no way to tell.

**The entire premise of the Reckoner is that a number on screen can be trusted.** Twelve metrics currently make that false. Until they are purged, every other guarantee in the product is undermined — a user who catches one invented figure has no reason to believe the 34 real ones.

### 1.3 The rule, stated so it cannot be misread

> **A Source may only return a value it read from the database.**
>
> If a Source cannot compute a reading — the table does not exist, the feature is unimplemented, the query is not written yet — it returns `null`, and the Reckoner converts that to `not_applicable`.
>
> **A Source may never return a literal that stands in for data.** Not a sample, not a placeholder, not a "realistic-looking default", not a demo value. There is no acceptable reason and no flag that makes it acceptable.

Fixtures for tests live in tests. Demo data lives in seeders. Neither lives in a Source.

---

## 2. Phase C1 — Stop the bleeding (do this first, today)

**Goal: no user can see an invented number, within one commit.** This phase deliberately makes the product *show less* rather than show wrong.

### 2.1 Purge every fabricated return

In all five Sources, delete the hardcoded payload for each of the 12 keys and return `null`:

```php
// SalesSource, PartySource, InventorySource, FinanceSource, OperationsSource
// For every key listed in §1.1 — including sales.revenue_trend and
// sales.payment_breakdown, whose ratios are invented even though the total is real:

case 'sales.top_products':
    // Not yet implemented against real data — see Correction Spec §4.
    // MUST NOT return sample rows. null becomes not_applicable.
    $out[$item['id']] = null;
    break;
```

Delete the literals entirely. Do not comment them out — a commented-out fixture is a fixture waiting to be uncommented.

### 2.2 Make `null` mean `not_applicable`, not a null value

`Reckoner::shapeScalarPayload()` at `Reckoner.php:291` currently turns a null scalar into `['value' => null]`, which renders as an empty card rather than an explained one. And for non-SCALAR shapes a `null` passes straight through untouched.

Change the resolution loop (around `Reckoner.php:246-266`) so a Source returning `null` produces a failure envelope:

```php
$value = $payloads[$itemId];

// A Source returning null means "I could not compute this", never "the answer
// is nothing". Correction Spec §1.3. The card explains itself instead of
// rendering an empty or zero state.
if ($value === null) {
    $results[$primaryId] = ReckonerResult::failure(
        $primaryId,
        $key,
        'not_applicable',
        'This reading is not available for your store yet.',
    );
    continue;
}
```

**Important:** this must NOT be cached. A `not_applicable` cached for 60 seconds is harmless; a `not_applicable` cached after the metric is later implemented is a bug. Skip `Cache::put()` on the null path.

### 2.3 Mark the 12 in the registry

Add to each of the 12 definitions in `ReckonerRegistry.php`:

```php
'implemented' => false,   // Correction Spec §4 — no real query yet
```

Then filter them out of `Reckoner::checkAvailability()` so `/api/reckoner/catalogue` never offers them. **A user must not be able to add a card that cannot work.** The card picker showing an option that always renders "not available" is a worse experience than the option not existing.

Default `'implemented' => true` for every existing definition, so the flag is opt-out and a new metric is assumed real unless declared otherwise.

### 2.4 The test that makes this permanent

New — `tests/tests/Unit/Reckoner/NoFabricatedDataTest.php`:

```php
/**
 * Correction Spec §1.3 — a Source may only return what it read from the DB.
 *
 * This test exists because twelve metrics once shipped returning invented
 * customer names and invoice numbers to real users. It is a tripwire, not a
 * style check: if it fails, someone has put a fixture in a Source.
 */
public function test_no_source_contains_hardcoded_business_data(): void
{
    $sources = glob(app_path('Reckoner/Sources/*.php'));

    // Literals that can only be sample data — real code never contains these.
    $banned = [
        'Basmati', 'Cooking Oil', 'Ali Raza', 'Walk-in Customer',
        'Sugar 1kg', 'Salt 500g', 'Invoice #10', 'mins ago',
        "'Rent'", "'Utilities'", "'Salaries'",
        "'Money In'", "'Money Out'", "'0-30 Days'",
    ];

    foreach ($sources as $file) {
        $contents = file_get_contents($file);
        foreach ($banned as $needle) {
            $this->assertStringNotContainsString(
                $needle,
                $contents,
                basename($file)." contains the literal '{$needle}'. Sources may only "
                ."return data read from the database — see Correction Spec §1.3."
            );
        }
    }
}

public function test_unimplemented_metrics_are_not_offered_in_catalogue(): void
{
    foreach (ReckonerRegistry::all() as $key => $def) {
        if (($def['implemented'] ?? true) === false) {
            $this->assertNotContains($key, $this->catalogueKeysFor($ownerUser));
        }
    }
}
```

### 2.5 Phase C1 acceptance

- `grep -rn "Basmati\|Ali Raza\|Sugar 1kg\|Invoice #100\|'Rent'\|Money In" app/Reckoner/Sources/` returns **nothing**.
- All 12 keys return `not_applicable` with an explanatory message; none returns `0`, `null` value, or an empty array rendered as a chart.
- None of the 12 appears in `/api/reckoner/catalogue`.
- `NoFabricatedDataTest` green.
- The 34 real metrics are untouched and still green.
- **The product now shows four working chart types over 34 trustworthy metrics.** That is the honest state, and it is shippable.

---

## 3. Phase C2 — Canonicalisation (Part 1 §7, still undone)

Nothing here is new; it is Part 1 §7, which was specified and never executed. **This must happen before the 12 metrics are reimplemented in Phase C4**, because those metrics will be built on top of whichever definition wins. Build them first and you build them twice.

### 3.1 Inventory value — FIFO wins

**Delete** `InventoryController.php:1050`:

```php
'total_value' => $products->sum(fn($p) => $p['total_stock'] * $p['cost_price']),
```

This is the exact formula `FinancialReportingService::getInventoryValue()`'s own docblock forbids. Replace with a call to `Reckoner::read('inventory.stock_value')`. Update `Pages/Inventory/StockLevels.jsx` to consume it.

### 3.2 Ageing buckets — one scheme

Four schemes are live. Canonical is `0-30 / 31-60 / 61-90 / 90+`, inclusive lower bound.

| Location | Current | Action |
|---|---|---|
| `FinancialReportingService.php:1939-1946` `ageBucket()` | `0-30 / 31-60 / 61-90 / 90+` | **Keep — canonical** |
| `FinancialReportingService.php:1132` (inline) | `180+ / 90-180 / 30-90 / 0-30` | This is **stock** ageing, a different concept — rename to `stockAgeBucket()` and drive its boundaries from `reckoner.stock_aging_buckets` (Part 1 §6) |
| `ReportController.php:1276` `saleAging()` | `90+ / 60-90 / 30-60 / 0-30` | **Delete**, call the canonical |
| `V3/CustomerStatementController.php:76-81` | `current / 1-30 / 31-60 / 61-90 / 90+` | **Delete**, call the canonical |

**Also fix D5:** `ReportController.php:1284` labels a bucket "31-60 days" while summing `where('category','30-60')`. This disappears when the method is deleted, but verify no other site repeats it.

**Test:** a 60-day invoice lands in `31-60` on every surface in the product.

### 3.3 Low stock — exclude out of stock (fixes D6)

`ReportController.php:665-667`:

```php
return $product->stock_quantity <= $product->effective_threshold;   // no > 0 guard
```

Out-of-stock rows are inside the low-stock set at `:670`, then counted **again** at `:671` as `out_of_stock_count`. The same product is in both figures.

Canonical: low stock = `0 < qty <= threshold`. Out of stock is its own metric.
Note `InventoryController.php:1051` already does this correctly (`&& $p['total_stock'] > 0`) — a third definition that happens to be right.

**Test:** `low_stock_count + out_of_stock_count` equals the old combined figure exactly, with no product in both.

### 3.4 MRR — coupon-adjusted wins

Two engines:
- `Admin/SuperAdminController.php:45, :89` — `$activePaid × $pricing->monthly()`, ignores coupons → **delete**
- `Admin/AdminDashboardController.php:68-89, :114, :275` — per-tenant loop applying `CouponRedemption` discounts → **canonical**

The 6-month trend at `:184-215` follows the canonical engine.

### 3.5 Largest sale — ex-tax

- `ReportController.php:152` — `max('net_sales')` → **canonical**
- `ReportController.php:2110` — `max('total')` → **delete**

Label everywhere: **"Largest Sale (excl. tax)"**.

### 3.6 Phase C2 acceptance

`ReckonerConsistencyTest` asserts, simultaneously, on the golden dataset:

- Inventory value identical on dashboard, stock levels page, and valuation report.
- A 60-day invoice sits in `31-60` on every surface.
- No product appears in both `low_stock_count` and `out_of_stock_count`.
- Exactly one MRR figure exists across the whole admin area.
- `max_sale` is ex-tax everywhere and labelled as such.
- CI grep: no aggregate feeding a displayed number remains in `app/Http/Controllers/`.

---

## 4. Phase C3 — Implement the 12 properly

Only now, on top of canonical definitions. Each must call an existing engine method or a real query. **If the underlying data genuinely does not exist yet, the metric stays `implemented => false` — that is a legitimate outcome, and far better than inventing it.**

| Key | Real source | Notes |
|---|---|---|
| `sales.revenue_trend` | `FRS::getProfitByPeriod($start, $end, $granularity)` | Already returns a keyed series — map to `{x, y}` |
| `finance.profit_trend` | `FRS::getProfitByPeriod()` `profit` column | Signed. Must cross zero honestly |
| `sales.payment_breakdown` | `sales` grouped by `payment_method`, `status='posted'` | Never derive from a ratio |
| `finance.expenses_by_category` | `journal_items` grouped by **`accounts.id`**, displaying `accounts.name` | Part 1 §7.17 — group by id so a rename doesn't split history |
| `sales.top_products` | `FRS::getGrossProfitByProduct($start, $end)` | Sort by `net_revenue`, take 6 |
| `sales.top_customers` | `FRS::getGrossProfitByParty($start, $end)` | Sort by `net_revenue`, take 6 |
| `inventory.low_stock_list` | Canonical low-stock query from §3.3 | Must agree with `inventory.low_stock_count` |
| `finance.receivables_aging` | `FRS::getAgedReceivables()` | Canonical buckets. Must reconcile to GL 1200 within PKR 0.01 |
| `finance.cash_flow_trend` | `FRS::getCashFlowReport()` per bucket | Two series: in / out |
| `sales.hourly_heatmap` | `sales.created_at` bucketed by hour × weekday, tenant timezone | Use `ReckonerPeriod`'s timezone, never `now()` |
| `plan.usage_summary` | `Api\PlanUsageController`'s existing logic → move into `OperationsSource` | Controller becomes a caller |
| `sales.live_feed` | `sales` latest 10, `status='posted'` | Real reference numbers and timestamps only |

### 4.1 The test that proves they are real

Shape tests are not enough — that is D7, and it is why 112 green tests missed twelve fabrications.

```php
/**
 * Every implemented metric must actually touch the database.
 *
 * A Source returning a constant passes every shape assertion ever written.
 * This asserts behaviour instead: seed two different datasets, resolve the
 * same metric against each, and require the answers to differ.
 */
public function test_implemented_metrics_respond_to_their_data(): void
{
    foreach ($this->implementedKeys() as $key) {
        $a = $this->withDataset('small')->read($key);
        $b = $this->withDataset('large')->read($key);

        $this->assertNotEquals(
            json_encode($a->data),
            json_encode($b->data),
            "'{$key}' returned identical data for two different datasets — "
            ."it is not reading from the database."
        );
    }
}
```

Also add a query-count assertion: an implemented metric that executes **zero** queries is fabricated by definition.

### 4.2 Phase C3 acceptance

- All 12 either resolve from real data or remain `implemented => false` with a stated reason in the definition.
- `test_implemented_metrics_respond_to_their_data` green for every implemented key.
- `sales.top_products` totals reconcile to `sales.revenue` within rounding.
- `finance.receivables_aging` total reconciles to `finance.receivables` (GL 1200) within PKR 0.01.
- `inventory.low_stock_list` row count equals `inventory.low_stock_count`.
- Chart types unlock only for shapes that now have real data behind them.

---

## 5. Phase C4 — Make the Reckoner the only engine (fixes D2, D4)

Today the Reckoner is a *second* source of truth sitting beside the six old ones. That is worse than before this project started, not better — the point was to remove duplicate definitions, and we added one.

### 5.1 Retire the parallel dashboard system

`WidgetRegistry` / `WidgetDataService` are still live in:
- `WorkspaceDashboardController.php:6-7, 38, 53, 85-86, 124, 137, 151, 185, 192`
- `OverviewDashboardController.php:6-7, 55, 64, 115`

Both controllers must resolve through `Reckoner::readMany()`. Then delete both service files. Their gating logic is already ported into `Reckoner`; their resolvers are superseded by Sources.

### 5.2 Wire real consumers

Zero pages call the Reckoner today. In priority order:

1. The new composable dashboard (already built — point it at real metrics once C1–C3 land).
2. `OwnerDailyPulseService` → becomes a consumer per Part 1 §7.2. It computes seven day-over-day deltas from the `sales` table; it should call `sales.revenue`, `purchasing.spend`, `finance.total_liquidity`, `inventory.stock_value`, `finance.expenses_total`, `finance.receivables`, `finance.payables` with comparison on, and format the result.
3. Report pages, one at a time, each with a before/after snapshot on the golden dataset.

### 5.3 Phase C4 acceptance

- `grep -rn "WidgetRegistry\|WidgetDataService" app/ routes/` returns nothing.
- At least three real pages read from the Reckoner.
- Each migrated page's figures are byte-identical to its pre-migration snapshot, except where §3 deliberately corrected them — and each such change is listed in the changelog.
- `NoOrphanMathTest` green: no aggregates in controllers, no arithmetic in report/dashboard React files.

---

## 6. Order, and why

```
C1  Purge fabrications          ← today. One commit. Nothing can ship a lie.
C2  Canonicalise §7             ← before C3, or C3 gets built twice
C3  Implement the 12 properly   ← on top of canonical definitions
C4  Wire consumers, delete the old engine
```

C1 is small and urgent. C2 is the largest and the one with real user-visible impact — ship it with a changelog entry per decision and one release of in-app notes on affected reports, per Part 1 Phase 3.

---

## 7. Guardrails to add permanently

The deeper failure is not the twelve fixtures; it is that **112 green tests and a clean production build reported success while the product returned invented data.** Every check was structural. Add these so the next gap is caught by CI rather than by a customer:

| Guard | Catches |
|---|---|
| `NoFabricatedDataTest` (§2.4) | Sample literals in a Source |
| `test_implemented_metrics_respond_to_their_data` (§4.1) | A Source returning a constant |
| Query-count assertion per implemented metric | Zero-query metrics |
| `ReckonerConsistencyTest` (§3.6) | Duplicate definitions reappearing |
| `NoOrphanMathTest` | Arithmetic creeping back into controllers or React |
| `implemented => false` filtered from catalogue | Offering a card that cannot work |

**A test that asserts a metric has the right shape has not tested the metric.** Correctness lives in whether the number changes when the data changes.

---

## 8. What to tell the user when C1 ships

The dashboard will show fewer options than it did yesterday. That is the fix, not a regression — but say so plainly:

> *"Twelve dashboard cards were showing sample figures rather than your store's data. They have been withdrawn until they read your real numbers. Nothing you were shown from Revenue, Profit, Receivables, Payables, Stock Value or the other 34 core figures was affected — those have always come from your ledger."*

Do not quietly remove them. A user who noticed "Ali Raza" and said nothing needs to know it has been dealt with, and a user who never noticed deserves to know which figures they can trust.

---

## 9. Definition of done

- No Source contains a literal standing in for data.
- Every offered metric responds to a change in the underlying data, proven by test.
- Each of the six §7 conflicts has exactly one surviving implementation.
- `WidgetRegistry` and `WidgetDataService` no longer exist.
- At least three real pages read from the Reckoner.
- A metric that cannot be computed says so, and is not offered in the picker.

At that point the sentence from Part 1 §13 becomes true for the first time:

> **Nothing in VenQore calculates a number for display. Everything asks the Reckoner.**

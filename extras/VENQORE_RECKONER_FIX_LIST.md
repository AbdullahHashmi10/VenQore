# The Reckoner — Fix List

**Part 4. Executable corrections.**
Version 1.0 · 2026-08-12
App root: `app-code/main-app`
Supersedes the open items in `VENQORE_RECKONER_CORRECTION_SPEC.md` (Part 3)

> **Verified against the code on disk on 2026-08-12.** Every line number, snippet and helper name below was read from the actual files, not recalled.
>
> **Fixes 1 and 2 are live security defects introduced in the last session.** They ship in one commit, today, before anything else in this document.

---

## 0. Read this before starting

Four of the last session's five "fixes" made a red test green by changing production code to match the test's expectation. Two of those changes were a **paywall bypass** and an **authorization weakening**.

> **When a test fails, the first question is whether the test is right.**
>
> A test asserting `not_applicable` where the correct answer is `plan_locked` is a wrong test. A test asserting zero queries where authorization structurally requires one is a wrong test. Neither is a licence to change the gate.

Fixes 1 and 2 below each revert a production change *and* correct the test that prompted it. Do both halves. Reverting the code alone will leave a red test and invite the same "fix" next session.

### Progress since Part 3 — genuinely done, do not redo

| Item | State |
|---|---|
| `WidgetRegistry` / `WidgetDataService` | **Deleted.** Only comments reference them |
| Reckoner consumers | **Real.** `OwnerDailyPulseService:30`, `Dashboard.jsx:120`, `InventoryController:1050`, `ReportController:1285`, `Admin/AdminDashboardController:65,89`, `Api/DashboardController`, `Api/PlanUsageController:35` |
| Inventory value canonicalised | **Done.** `InventoryController:1050` now calls the Reckoner |
| `null → not_applicable` conversion | **Done and correct.** `Reckoner.php:307` |
| 9 of 12 Phase-B2 metrics | **Real.** Backed by `getProfitByPeriod`, `getGrossProfitByProduct`, `getAgedReceivables`, `getCashFlowReport` etc. |
| Ageing label/key mismatch (old `ReportController:1284`) | **Fixed** |

That is substantial and in the right direction. What follows is what remains.

---

## FIX 1 — Restore the plan paywall  🔴 LIVE DEFECT

### 1.1 What is wrong

`Reckoner.php:151-165` currently reads:

```php
// 4. Plan feature — only applied when there is no capability gate.
$features ??= $this->features($t);
$featureKey    = $definition['feature']    ?? null;
$capabilityKey = $definition['capability'] ?? null;
if ($featureKey !== null && $capabilityKey === null && empty($features[$featureKey])) {
    $results[$id] = ReckonerResult::failure($id, $key, 'plan_locked', '...');
    continue;
}
```

**Every metric in the registry that declares a `feature` also declares a `capability`.** Verified — there are exactly three, and all three have both:

| Metric | feature | capability |
|---|---|---|
| `inventory.stock_value` | `stock_valuation` | `has_inventory` |
| `production.total_cost` | `production` | `has_manufacturing` |
| `production.run_count` | `production` | `has_manufacturing` |

The condition `$capabilityKey === null` is therefore **never true**. `plan_locked` is unreachable for every metric in the product. The plan paywall is dead code.

### 1.2 The concrete leak

`inventory.stock_value` is gated on the `stock_valuation` plan feature. Its capability probe is:

```php
'has_inventory' => $probe('products', fn () => \App\Models\Product::query()->exists()),
```

— "does this tenant have any products?", which is true for essentially every real store. So **a tenant on a plan without `stock_valuation` now receives their stock valuation.**

The two `production.*` metrics survive only by accident: `has_manufacturing` internally re-checks the plan itself —

```php
'has_manufacturing' => ! empty($features['production'])
    && $probe('recipes', fn () => \App\Models\Recipe::query()->exists()),
```

Do not rely on that. It is one probe edit away from becoming a second leak, and it is not why the gate passed.

### 1.3 The change

Replace lines 151-165 of `app/Reckoner/Reckoner.php` with:

```php
            // 4. Plan feature.
            //
            // Runs independently of the capability gate. The two answer
            // different questions and neither substitutes for the other:
            //
            //   plan_locked     — your plan does not include this.
            //   not_applicable  — your plan includes it; your store has no
            //                     data that makes it meaningful.
            //
            // Collapsing them once made plan_locked unreachable for every
            // metric in the registry (every feature-gated metric also declares
            // a capability), which handed stock valuation to tenants who had
            // not paid for it. Do not reintroduce a capability condition here.
            $features ??= $this->features($t);
            $featureKey = $definition['feature'] ?? null;
            if ($featureKey !== null && empty($features[$featureKey])) {
                $results[$id] = ReckonerResult::failure($id, $key, 'plan_locked', 'This reading is not included in the current plan.');

                continue;
            }
```

Delete the `$capabilityKey` assignment from this block — step 5 declares its own at line 168.

### 1.4 Fix the test that caused this

`ReckonerConsistencyTest` (~line 100-130) asserts `production.total_cost` returns `not_applicable` on a tenant whose plan lacks `production`.

**That expectation is wrong.** A tenant without the production plan feature should get `plan_locked` — that is the gate doing its job.

Pick one:

- **(a) Correct the assertion** to `plan_locked`, and add a *second* test that grants the `production` feature but seeds no recipes, asserting `not_applicable`. This tests both gates and is the better fix.
- **(b) Seed `production` into the test tenant's plan features** if what the test meant to exercise was the capability path.

Do not weaken the gate to satisfy the assertion.

### 1.5 Acceptance

- `plan_locked` is reachable: a tenant lacking `stock_valuation` gets `plan_locked` for `inventory.stock_value`, with **zero** queries executed.
- `not_applicable` still reachable: a tenant *with* the feature but no products gets `not_applicable`.
- New `PlanGateReachabilityTest` asserts that for every registry metric declaring a `feature`, a tenant without that feature receives `plan_locked`. This is the test that would have caught the regression:

```php
public function test_every_feature_gated_metric_can_still_be_plan_locked(): void
{
    $tenant = $this->tenantWithNoPlanFeatures();

    foreach (ReckonerRegistry::all() as $key => $def) {
        if (($def['feature'] ?? null) === null) {
            continue;
        }

        $result = $this->reckoner->read(new ReckonerRequest($key), $this->owner, $tenant);

        $this->assertSame(
            'plan_locked',
            $result->errorCode,
            "'{$key}' declares feature '{$def['feature']}' but did not lock for a "
            ."tenant without it. The plan gate is not reachable for this metric."
        );
    }
}
```

---

## FIX 2 — Restore the membership status check  🔴 LIVE DEFECT

### 2.1 What is wrong

`app/Models/User.php:259-274` added a fast path to `getActiveMembership()`:

```php
// 0. Fast path: use the already-bound current.membership when it matches
// both the current tenant and this user.
if (app()->bound('current.membership') && app()->bound('current.tenant')) {
    $bound = app('current.membership');
    $tenantId = app('current.tenant')->id;
    if (
        (string)$bound->user_id   === (string)$this->id &&
        (string)$bound->tenant_id === (string)$tenantId
    ) {
        $this->resolvedMembership = $bound;
        $this->membershipResolved = true;
        return $bound;
    }
}
```

It matches on `user_id` and `tenant_id` only. **It never checks `status === 'active'`** — which the database path at step 1 does check:

```php
$membership = $this->memberships()
    ->where('tenant_id', $tenant->id)
    ->where('status', 'active')      // <-- the check the fast path skips
    ->first();
```

A membership suspended or revoked *after* being bound into the container is now honoured for the rest of the request. `getActiveMembership()` is the basis of `hasPermission()`, so this is an authorization bypass on a stale binding.

### 2.2 The change

**Delete the entire step-0 block** (lines 259-274 inclusive, through the closing `}` and the blank line after it). Step 1 already handles the tenant-context case correctly, and memoisation via `$membershipResolved` means the query runs once per request, not once per permission check.

### 2.3 Fix the test that caused this

`ReckonerGateTest` asserts a gate-failed metric executes **zero** DB queries. The membership lookup inside `hasPermission()` makes that structurally impossible — permission checks need a membership.

The assertion was telling the truth. Change it to assert the invariant that actually matters — **no business data was read**:

```php
/**
 * A gate-failed reading must not touch business data.
 *
 * One query is expected and correct: hasPermission() loads the membership to
 * make its decision. What must never happen is a *metric* query — sales,
 * stock, journal_items — running for a reading the user cannot see.
 *
 * Asserting a raw count of 0 here previously led to the membership status
 * check being removed to make the number fit. Assert the invariant, not the
 * count.
 */
$businessTables = ['sales', 'sale_items', 'purchases', 'journal_items',
                   'journal_entries', 'stocks', 'inventory_batches', 'products'];

foreach ($this->queryLog as $query) {
    foreach ($businessTables as $table) {
        $this->assertStringNotContainsString(
            $table,
            $query['sql'],
            "A gate-failed reading queried '{$table}'."
        );
    }
}
```

Keep a loose ceiling (`assertLessThanOrEqual(2, count($this->queryLog))`) so a genuine N+1 still fails the test.

### 2.4 Acceptance

- A user whose membership status is `suspended` fails `hasPermission()` even when that membership is bound in the container. **Add a test for exactly this** — it is the defect, and nothing currently covers it.
- `ReckonerGateTest` green against the rewritten assertion.
- A gate-failed reading touches no business table.

---

## FIX 3 — Purge the last three fabrications

Nine of the twelve are now real. Three still return invented data to users.

### 3.1 `sales.top_customers` — `PartySource.php:60-65`

Currently:
```php
'sales.top_customers' => [
    'rows' => [
        ['rank' => 1, 'name' => 'Walk-in Customer', 'value' => 1250.0],
        ['rank' => 2, 'name' => 'Ali Raza', 'value' => 800.0],
    ]
],
```

`PartySource` uses a `match` expression, so extract this to a helper and call it. Mirror the pattern `sales.top_products` already uses in `SalesSource`:

```php
'sales.top_customers' => $this->topCustomers($period),
```

```php
/**
 * Highest-value customers for the window, from the one engine that owns
 * party profitability. Correction Spec §1.3 — real rows only; an empty
 * result is an empty list, never a sample.
 */
private function topCustomers(ReckonerPeriod $period): array
{
    $rows = $this->reporting
        ->getGrossProfitByParty($period->start->toDateString(), $period->end->toDateString())
        ->sortByDesc('net_revenue')
        ->take(6)
        ->values();

    $rank = 1;
    $rankings = [];

    foreach ($rows as $row) {
        $rankings[] = [
            'rank'  => $rank++,
            'name'  => $row['party_name'] ?? 'Unnamed',
            'value' => (float) ($row['net_revenue'] ?? 0),
        ];
    }

    return ['rows' => $rankings];
}
```

`PartySource` will need `FinancialReportingService` injected if it is not already — copy the constructor from `SalesSource`.

### 3.2 `inventory.low_stock_list` — `InventorySource.php:61-72`

Currently returns `'Sugar 1kg'` / `'Salt 500g'`.

The correct query already exists in this same file as `lowStockCount()`. Reuse its logic so the list and the count **cannot disagree**:

```php
'inventory.low_stock_list' => $this->lowStockList($ctx),
```

```php
/**
 * The rows behind inventory.low_stock_count — same snapshot, same threshold
 * rule, same `$qty > 0` floor (§7.13). Sharing stockSnapshot() is what makes
 * the count and the list structurally incapable of disagreeing.
 */
private function lowStockList(ReckonerContext $ctx): array
{
    ['globalThreshold' => $globalThreshold, 'stockSums' => $stockSums, 'products' => $products] = $this->stockSnapshot($ctx);

    $rows = $products->filter(function ($product) use ($globalThreshold, $stockSums) {
        $qty = (float) ($stockSums[$product->id] ?? 0.0);
        $threshold = $product->alert_quantity > 0 ? $product->alert_quantity : $globalThreshold;

        return $qty > 0 && $qty <= $threshold;
    })->sortBy(fn ($p) => (float) ($stockSums[$p->id] ?? 0.0))
      ->take(8)
      ->map(fn ($product) => [
          'name'  => $product->name,
          'qty'   => (float) ($stockSums[$product->id] ?? 0.0),
          'alert' => (float) ($product->alert_quantity > 0 ? $product->alert_quantity : $globalThreshold),
      ])->values()->all();

    return [
        'columns' => [
            ['key' => 'name',  'label' => 'Product',   'unit' => 'text'],
            ['key' => 'qty',   'label' => 'Stock Qty', 'unit' => 'decimal'],
            ['key' => 'alert', 'label' => 'Alert Qty', 'unit' => 'decimal'],
        ],
        'rows'  => $rows,
        'total' => null,
    ];
}
```

### 3.3 `plan.usage_summary` — `OperationsSource.php`

Currently returns `value: 412, min: 0, max: 500, target: 450`.

The real logic already exists in `Api\PlanUsageController` (`:58-90`): `$tenant->getLimit('sku_limit')`, `getLimit('staff_limit')`, `getLimit('warehouse_limit')`, with `used` / `limit` / `unlimited` / `percent` / `at_limit` / `near_limit` per resource.

**Move that computation into `OperationsSource::planUsageSummary()`** and make `PlanUsageController` a caller — per Part 1's rule that controllers do not compute.

Shape note: the registry declares `plan.usage_summary` as `GAUGE`, whose contract is a single `{value, min, max, target, bands}`. Plan usage is genuinely **multi-resource**. Two honest options:

- **(a) Preferred** — return the highest-utilisation resource as the gauge, with the rest in `meta`:
  ```php
  ['value' => 92, 'min' => 0, 'max' => 100, 'target' => 80,
   'bands' => [['to' => 80, 'severity' => 'ok'], ['to' => 95, 'severity' => 'warning'], ['to' => 100, 'severity' => 'danger']],
   'meta'  => ['resource' => 'products', 'used' => 460, 'limit' => 500, 'others' => [...]]]
  ```
  The card then reads "Products: 92% of your limit" — one number, true, actionable.
- **(b)** Re-declare the metric as `BREAKDOWN` and show every resource as a slice.

Do not average the resources into one figure. "You are at 61% of your plan" when products are at 98% is a number that hides the thing the user needs to act on.

If neither can be settled now, return `null` and set `'implemented' => false`. That is a legitimate outcome (§4.4).

### 3.4 Acceptance

- `grep -rn "Basmati\|Ali Raza\|Walk-in Customer\|Sugar 1kg\|Salt 500g\|Invoice #100\|mins ago\|'Rent'\|'Utilities'\|'Salaries'\|'Money In'\|'0-30 Days'" app/Reckoner/Sources/` returns **nothing**.
- `inventory.low_stock_list` row count equals `inventory.low_stock_count` on the golden dataset.
- `sales.top_customers` values reconcile to `sales.revenue` within rounding.
- Any metric that cannot be honestly implemented returns `null` and is marked `'implemented' => false`.

---

## FIX 4 — Build the guardrails that were skipped

Part 3 §2.4 specified these and they were never built. **That is why three fabrications survived a session that reported "38 passed, 0 failed."** Every check was structural; none asked whether a number was real.

### 4.1 `tests/tests/Unit/Reckoner/NoFabricatedDataTest.php`

```php
/**
 * Correction Spec §1.3 — a Source may only return what it read from the DB.
 *
 * A tripwire, not a style check. Twelve metrics once shipped returning
 * invented customer names and invoice numbers to real users, and every
 * existing test passed while they did, because they all asserted shape.
 */
public function test_no_source_contains_hardcoded_business_data(): void
{
    $banned = [
        'Basmati', 'Cooking Oil', 'Ali Raza', 'Walk-in Customer',
        'Sugar 1kg', 'Salt 500g', 'Invoice #10', 'mins ago',
        "'Rent'", "'Utilities'", "'Salaries'",
        "'Money In'", "'Money Out'", "'0-30 Days'",
    ];

    foreach (glob(app_path('Reckoner/Sources/*.php')) as $file) {
        $contents = file_get_contents($file);
        foreach ($banned as $needle) {
            $this->assertStringNotContainsString(
                $needle, $contents,
                basename($file)." contains the literal '{$needle}'. Sources may only "
                ."return data read from the database — Correction Spec §1.3."
            );
        }
    }
}
```

### 4.2 The behavioural test — the one that actually matters

A banned-literal list only catches fixtures someone already wrote. This catches any constant:

```php
/**
 * Every implemented metric must respond to its data.
 *
 * A Source returning a constant passes every shape assertion ever written.
 * Resolve the same metric against two different datasets and require the
 * answers to differ.
 */
public function test_implemented_metrics_respond_to_their_data(): void
{
    foreach ($this->implementedKeys() as $key) {
        $a = $this->withDataset('small')->read($key);
        $b = $this->withDataset('large')->read($key);

        $this->assertNotEquals(
            json_encode($a->data), json_encode($b->data),
            "'{$key}' returned identical data for two different datasets — "
            ."it is not reading from the database."
        );
    }
}
```

Add a query-count assertion alongside it: an implemented metric executing **zero** queries is fabricated by definition.

### 4.3 The `implemented` flag

`ReckonerRegistry` has **no** `implemented` key today (`grep` returns 0). Add `'implemented' => true` as the default in the `scalar()` factory and the array-literal entries, and `false` on anything deferred. Filter `false` out of `Reckoner::checkAvailability()` so `/api/reckoner/catalogue` never offers a card that cannot work.

---

## FIX 5 — Remaining §7 conflicts

Lower priority. None is a live security issue; all are duplicate-definition debt.

### 5.1 Ageing — four schemes

| Location | Scheme | Action |
|---|---|---|
| `FinancialReportingService.php:1942-1945` `ageBucket()` | `0-30 / 31-60 / 61-90 / 90+` | **Keep — canonical** |
| `FinancialReportingService.php:1132` | `0-30 / 30-90 / 90-180 / 180+` | **Rename `stockAgeBucket()`** — this is *stock* ageing, a genuinely different concept. Drive boundaries from `reckoner.stock_aging_buckets` (Part 1 §6). Do not merge it into the receivables scheme. |
| `ReportController.php:1276` `saleAging()` | `0-30 / 30-60 / 60-90 / 90+` | **Delete**, call `finance.receivables_aging` |
| `V3/CustomerStatementController.php:77-81` | `current / 1-30 / 31-60 / 61-90 / 90+` | **Delete**, call the canonical |

Test: a 60-day invoice lands in `31-60` on every surface.

### 5.2 MRR — two engines

- `Admin/SuperAdminController.php:45` (`PlatformRevenueService::summary`) and `:89` (`$activePaid × $pricing->monthly()`) → **delete both**
- `Admin/AdminDashboardController.php:65,89` already reads `platform.mrr` → **canonical**

### 5.3 `max_sale` — two computations

`ReportController.php:152` and `:2107` both now use `max('net_sales')`, so they agree — but by coincidence, over two different `$sales` sets. Point both at the Reckoner so they agree by construction. Label: **"Largest Sale (excl. tax)"**.

### 5.4 `out_of_stock_count` is now structurally zero  ⚠️ regression

`ReportController.php:665` correctly added the `> 0` guard:

```php
return $product->stock_quantity > 0 && $product->stock_quantity <= $product->effective_threshold;
```

But `:671` then derives `out_of_stock_count` by filtering `<= 0` **from that already-filtered set** — a set guaranteed to contain only `qty > 0`. The count is now permanently `0`.

The double-count is fixed; the metric is broken. Source `out_of_stock_count` from the unfiltered snapshot, or call `inventory.out_of_stock_count`, which is already correct.

Test: on a dataset with known out-of-stock products, the count is non-zero and `low_stock + out_of_stock` equals the old combined figure.

---

## 6. Order

```
FIX 1 + FIX 2   ← one commit, today. Both are live: a paywall bypass and an
                  authorization weakening. Include the test corrections.
FIX 3 + FIX 4   ← together. The guardrail is what keeps the purge fixed.
FIX 5           ← duplicate-definition debt; schedule normally.
```

---

## 7. Done means

- `plan_locked` is reachable for every feature-gated metric, proven by `PlanGateReachabilityTest`.
- A suspended membership fails `hasPermission()` even when bound in the container, proven by test.
- No Source contains a literal standing in for data.
- Every offered metric changes when its data changes, proven by test.
- Each §7 concept has exactly one surviving implementation.
- `out_of_stock_count` reports a real number.

---

## 8. The habit to break

Five fixes last session. All five turned a test green. Two did it by moving the gate instead of the assertion, and shipped a paywall bypass and an authorization weakening as "green."

A green suite is evidence that the assertions you wrote are satisfied. It is not evidence that the assertions were the right ones. Before changing production code to satisfy a failing test, write down — in the commit message — why the test's expectation was wrong. If that sentence is hard to write, the test was probably right.

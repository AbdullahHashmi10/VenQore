# The Card Builder

**VenQore's composable dashboard. Part 2 of 2.**
Version 1.0 · 2026-08-11
Repo root: `E:\AMD POS\AMD POS` · App root: `app-code/main-app`
Depends on: **The Reckoner** (`VENQORE_RECKONER_BUILD_SPEC.md`, Part 1)

> **This document builds the layer that lets a user assemble their own dashboard.**
>
> A card is three answers: **which reading, which period, which chart.** Nothing more. The card does not calculate — the Reckoner already did that. The card picks a shape off the shelf and draws it.
>
> **Part 1 must be complete before starting this.** Specifically: the two Reckoner endpoints must be routed and returning data. See §0.

---

## 0. Where Part 1 actually stands — read this first

This spec was written **against the real code on disk**, not against Part 1's design sketch. Where the two differ, the code wins and this document follows the code.

### 0.1 What exists and works

| Component | State | Notes |
|---|---|---|
| `app/Reckoner/Reckoner.php` | ✅ Built | `read()`, `readMany()`, `checkAvailability()`, six gates, cache, capability probes |
| `ReckonerRegistry.php` | ✅ Built | **34 keys** (11 literal entries + 23 via the `scalar()` factory) |
| `ReckonerShape.php` | ✅ Built | Full 11-case enum declared; **only `SCALAR` and `STATUS` are in use** |
| `ReckonerPeriod.php` | ✅ Built | All 18 period keys including `as_of` and `live` |
| `ReckonerResult.php` | ✅ Built | Envelope with `jsonSerialize()` / `toArray()` |
| `ReckonerLabels.php` | ✅ Built | `SIGNED_LABELS` loss-side swap working; business-type map **declared but empty** |
| `ReckonerSettings.php` | ✅ Built | Tenant thresholds |
| `Sources/` (11 files) | ✅ Built | `FinanceSource` answers 10 of the 34 keys |
| `Api/ReckonerController.php` | ✅ Built | `catalogue()` and `read()` methods complete |

### 0.2 What is missing — **blockers for this build**

These must be closed before Phase B1 of this document. They are small.

| # | Gap | Why it blocks Part 2 |
|---|---|---|
| **B1** | **No routes registered.** `grep -rn "reckoner" routes/` returns nothing. `ReckonerController` is unreachable. | The entire frontend calls these two endpoints. Nothing works without them. |
| **B2** | **No Ziggy entries**, consequent to B1. | `route('api.reckoner.read')` will throw in React. |
| **B3** | **Only `SCALAR` and `STATUS` shapes are produced.** No `SERIES`, `BREAKDOWN`, `RANKING`, `TABLE` reading exists yet. | 17 of the 20 chart types have no data to draw. A pie chart needs a `BREAKDOWN`; there isn't one. |
| **B4** | `ReckonerResult::success()` **hardcodes `data` to `['value' => …]` for SCALAR** and never populates `previous` / `change_pct`, though `supports_comparison` is `true` on most keys. | Every card would show a number with no delta. The comparison window is computed by `ReckonerPeriod` and then discarded. |
| **B5** | `ReckonerLabels` business-type map is **empty**. | Part 1 §5's vertical relabelling does nothing yet. Not a blocker for cards to *work*, but it is a blocker for the promise. |

**Fix B1 and B2 first (§1). Fix B4 in §2. B3 is Phase B2 of this document (§3). B5 is optional and can trail.**

### 0.3 The 34 readings available today

| # | Key | Shape | Unit | Periods | Source |
|---|---|---|---|---|---|
| 1 | `sales.revenue` | SCALAR | currency | all | SalesSource |
| 2 | `sales.gross_margin_pct` | SCALAR | percent | all | FinanceSource |
| 3 | `finance.net_profit` | SCALAR | currency | all | FinanceSource |
| 4 | `finance.gross_profit` | SCALAR | currency | all | FinanceSource |
| 5 | `finance.cogs` | SCALAR | currency | all | FinanceSource |
| 6 | `finance.net_margin_pct` | SCALAR | percent | all | FinanceSource |
| 7 | `finance.expenses_total` | SCALAR | currency | all | FinanceSource |
| 8 | `finance.receivables` | SCALAR | currency | all | FinanceSource |
| 9 | `finance.payables` | SCALAR | currency | all | FinanceSource |
| 10 | `finance.balance_sheet_ok` | **STATUS** | text | `live` | FinanceSource |
| 11 | `inventory.stock_value` | SCALAR | currency | all | InventorySource |
| 12 | `inventory.low_stock_count` | SCALAR | integer | — | InventorySource |
| 13 | `inventory.out_of_stock_count` | SCALAR | integer | — | InventorySource |
| 14 | `inventory.product_count` | SCALAR | integer | — | InventorySource |
| 15 | `inventory.overstock_count` | SCALAR | integer | — | InventorySource |
| 16 | `purchasing.spend` | SCALAR | currency | all | PurchasingSource |
| 17 | `purchasing.count` | SCALAR | integer | all | PurchasingSource |
| 18 | `finance.paid_to_suppliers` | SCALAR | currency | all | PurchasingSource |
| 19 | `party.customer_count` | SCALAR | integer | — | PartySource |
| 20 | `party.supplier_count` | SCALAR | integer | — | PartySource |
| 21 | `party.new_customers` | SCALAR | integer | all | PartySource |
| 22 | `party.dormant_customers` | SCALAR | integer | — | PartySource |
| 23 | `production.total_cost` | SCALAR | currency | all | ProductionSource |
| 24 | `production.run_count` | SCALAR | integer | all | ProductionSource |
| 25 | `staff.on_shift_count` | SCALAR | integer | `live` | StaffSource |
| 26 | `staff.member_count` | SCALAR | integer | — | StaffSource |
| 27 | `operations.open_sales_orders` | SCALAR | integer | `live` | OperationsSource |
| 28 | `operations.pending_stock_takes` | SCALAR | integer | `live` | OperationsSource |
| 29 | `operations.pending_stock_transfers` | SCALAR | integer | `live` | OperationsSource |
| 30 | `tax.collected` | SCALAR | currency | all | TaxSource |
| 31 | `restaurant.tables_occupied` | SCALAR | integer | `live` | RestaurantSource |
| 32 | `restaurant.kitchen_orders_pending` | SCALAR | integer | `live` | RestaurantSource |
| 33 | `platform.active_tenant_count` | SCALAR | integer | — | PlatformSource · **scope: platform** |
| 34 | `platform.mrr` | SCALAR | currency | — | PlatformSource · **scope: platform** |

**32 are reachable by a store user.** Keys 33–34 are platform-scoped and return `not_found` in a tenant context — correct, and `PlatformScopeTest` covers it.

**The honest consequence:** with 32 SCALAR keys and one STATUS key, the card builder at Phase B1 can offer **four** chart types (`stat`, `sparkline`, `gauge`, `status`). That is a real, shippable, useful dashboard. The remaining 16 chart types unlock in Phase B2 when `SERIES` and `BREAKDOWN` readings are added to the Reckoner. **Do not build chart components with no data to feed them.**

---

## 1. Blocker B1/B2 — register the routes

Add to `routes/web.php`, inside the **same group `PlanUsageController` already lives in** — `['auth', 'throttle:api']` with tenant middleware upstream. The controller's docblock states this explicitly; it authenticates via session, **not Sanctum**, because this is an Inertia app.

```php
Route::middleware(['auth', 'throttle:api'])->prefix('api/reckoner')->name('api.reckoner.')->group(function () {
    Route::get('catalogue', [\App\Http\Controllers\Api\ReckonerController::class, 'catalogue'])->name('catalogue');
    Route::post('read',      [\App\Http\Controllers\Api\ReckonerController::class, 'read'])->name('read');
});
```

Then, per `CLAUDE.md`'s standing rule:

```bash
php artisan ziggy:generate
php artisan optimize:clear
```

**Accept:**
- `php artisan route:list --name=reckoner` shows both routes.
- `route('api.reckoner.read')` resolves in React.
- An authenticated GET to `/api/reckoner/catalogue` returns 32 entries for an Owner, fewer for a Cashier, and never a `platform.*` key.
- An unauthenticated request returns 401, not a redirect to a login page that a fetch() would silently follow.

---

## 2. Blocker B4 — comparison data

`ReckonerResult::success()` currently builds `data` as `['value' => $value]`. `ReckonerPeriod` computes `compareStart` / `compareEnd` and `compareLabel`, and 30 of the 34 definitions set `supports_comparison => true` — but no source is ever asked for the comparison window, so `previous` and `change_pct` never exist.

Every stat card in the product shows a number **and its movement**. Without this, the builder ships numbers with no context.

### 2.1 The change

In `Reckoner::readMany()`, when a definition has `supports_comparison => true` and the resolved period has a non-null `compareStart`, issue a **second entry in the same source batch** for the comparison window, then fold it into the payload.

```php
// Inside the $toResolve loop, after building the primary item:
if (($definition['supports_comparison'] ?? false) && $period->compareStart !== null) {
    $toResolve[$sourceClass][] = [
        'key'        => $key,
        'period'     => $period->comparisonWindow(),   // new helper on ReckonerPeriod
        'args'       => $request->args,
        'definition' => $definition,
        'ttl'        => $ttl,
        'cacheKey'   => $cacheKey.':cmp',
        'is_compare' => true,
    ];
}
```

Add to `ReckonerPeriod`:

```php
/** The equivalent preceding window as a standalone period, or null. */
public function comparisonWindow(): ?self
{
    if ($this->compareStart === null || $this->compareEnd === null) {
        return null;
    }

    return new self(
        key: $this->key.'_compare',
        start: $this->compareStart,
        end: $this->compareEnd,
        compareStart: null,
        compareEnd: null,
        label: $this->compareLabel,
        compareLabel: '',
    );
}
```

Then replace `shapeScalarPayload()` with:

```php
private function shapeScalarPayload(mixed $value, ?float $previous, array $definition, ReckonerPeriod $period): mixed
{
    if ($definition['shape'] !== ReckonerShape::SCALAR) {
        return $value;
    }

    $current = is_numeric($value) ? (float) $value : null;

    return [
        'value'      => $current,
        'previous'   => $previous,
        // Growth against a zero baseline is undefined, not infinite.
        // "+100%" because last month was zero is a lie the user will act on.
        'change_pct' => ($previous !== null && $previous > 0 && $current !== null)
            ? round((($current - $previous) / $previous) * 100, 1)
            : null,
        'compare_label' => $period->compareLabel,
    ];
}
```

**The zero-baseline rule is not optional.** `WidgetDataService` already got this right and its comment explains why; carry the behaviour and the reasoning forward.

### 2.2 Cost

This doubles the source calls for comparison-enabled readings. It is still cheap because sources batch: `FinanceSource` answering seven P&L keys for two windows is two P&L reads, not fourteen. The comparison entry is cached under its own key, so a dashboard refreshing every 60 s recomputes both windows at most once per minute.

**Accept:**
- `sales.revenue` at `this_month` returns `value`, `previous`, `change_pct`, `compare_label`.
- A metric whose previous window is zero returns `change_pct: null`, never `100`.
- `live` and `as_of` periods return `previous: null` without attempting a comparison read.
- A new `ReckonerComparisonTest` asserts all three.

---

## 3. Shapes the builder needs — Phase B2 scope

To make the chart picker meaningful, the Reckoner needs readings that are not scalars. These are **additions to Part 1's registry**, built in the Reckoner, not in the card layer.

The minimum set that unlocks the chart library:

| New key | Shape | Unlocks | Source |
|---|---|---|---|
| `sales.revenue_trend` | SERIES | `line`, `area`, `bar`, `profit_loss_line`, `sparkline` | SalesSource |
| `finance.profit_trend` | SERIES (signed) | `profit_loss_line` | FinanceSource |
| `sales.payment_breakdown` | BREAKDOWN | `pie`, `ring`, `sunburst`, `funnel` | SalesSource |
| `finance.expenses_by_category` | BREAKDOWN | `pie`, `ring`, `bar` | FinanceSource |
| `sales.top_products` | RANKING | `bar`, `table`, `funnel` | SalesSource |
| `sales.top_customers` | RANKING | `bar`, `table` | PartySource |
| `inventory.low_stock_list` | TABLE | `table` | InventorySource |
| `finance.receivables_aging` | BREAKDOWN | `pie`, `bar`, `funnel` | FinanceSource |
| `finance.cash_flow_trend` | MULTI_SERIES | `composed`, `line`, `area` | FinanceSource |
| `sales.hourly_heatmap` | TABLE (2-dim) | `heatmap` | SalesSource |
| `plan.usage_summary` | GAUGE | `gauge`, `ring` | OperationsSource |
| `sales.live_feed` | FEED | `feed` | SalesSource |

**Payload contracts** — these are the shapes the chart layer will bind to, so they are fixed here:

```php
// SERIES
['series' => [['x' => '2026-08-01', 'y' => 12400.0], …], 'granularity' => 'daily']

// MULTI_SERIES
['series' => [
    ['name' => 'Money In',  'points' => [['x' => …, 'y' => …], …]],
    ['name' => 'Money Out', 'points' => [['x' => …, 'y' => …], …]],
]]

// BREAKDOWN
['slices' => [['name' => 'Cash', 'value' => 84000.0, 'pct' => 62.1], …], 'total' => 135000.0]

// RANKING
['rows' => [['rank' => 1, 'name' => 'Basmati 5kg', 'value' => 48200.0, 'meta' => ['sku' => 'RC-5']], …]]

// TABLE
['columns' => [['key' => 'name', 'label' => 'Product', 'unit' => 'text'], …], 'rows' => [[…]], 'total' => null]

// GAUGE
['value' => 412, 'min' => 0, 'max' => 500, 'target' => 400, 'bands' => [['to' => 80, 'severity' => 'ok'], …]]

// FEED
['items' => [['id' => …, 'title' => …, 'subtitle' => …, 'value' => …, 'at' => …], …]]

// STATUS  (already in use by finance.balance_sheet_ok)
['state' => 'balanced', 'label' => 'Books Balanced', 'detail' => null, 'severity' => 'ok']
```

**`Reckoner::shapeScalarPayload()` already passes non-SCALAR payloads through untouched** — so a source returning one of these structures needs no engine change. That is the one piece of Part 1 that was built correctly for a future it hadn't reached yet.

---

## 4. Shape → chart legality

This is the mechanism that makes "any reading × any chart" safe. It lives in **two places that must agree**, and a test asserts they do.

### 4.1 Backend authority

New file `app/Reckoner/ReckonerCharts.php`:

```php
final class ReckonerCharts
{
    public const MAP = [
        'scalar'       => ['stat', 'sparkline', 'gauge', 'ring'],
        'series'       => ['line', 'area', 'bar', 'sparkline', 'live_line', 'profit_loss_line', 'composed', 'scatter', 'heatmap'],
        'multi_series' => ['line', 'area', 'bar', 'composed', 'radar', 'scatter', 'sankey'],
        'breakdown'    => ['pie', 'ring', 'sunburst', 'bar', 'funnel', 'radar', 'stat'],
        'table'        => ['table', 'bar', 'heatmap'],
        'ranking'      => ['table', 'bar', 'funnel', 'pie'],
        'funnel'       => ['funnel', 'bar', 'sankey'],
        'gauge'        => ['gauge', 'ring', 'stat'],
        'status'       => ['status', 'stat'],
        'feed'         => ['feed', 'table'],
        'geo'          => ['choropleth', 'table'],
    ];

    public static function for(ReckonerShape $shape): array
    {
        return self::MAP[$shape->value] ?? [];
    }

    public static function isLegal(ReckonerShape $shape, string $chart): bool
    {
        return in_array($chart, self::for($shape), true);
    }

    /** The chart a card gets if the user never chooses one. */
    public static function default(ReckonerShape $shape): string
    {
        return self::for($shape)[0] ?? 'stat';
    }
}
```

Extend `ReckonerController::catalogue()` to emit `'charts' => ReckonerCharts::for($definition['shape'])` and `'default_chart' => ReckonerCharts::default($definition['shape'])` on every entry. The picker then needs no chart knowledge of its own.

### 4.2 Frontend mirror

`resources/js/Dashboard/charts/chartRegistry.js` holds the same map plus rendering metadata (component, min card size, slice/series caps). `ChartRegistryParityTest` reads both files and asserts the shape→chart map is identical. If someone adds a chart to one side only, CI fails.

---

## 5. bklit UI — installation

bklit is a shadcn registry. Sixteen chart categories; **candlestick is deliberately excluded** — VenQore has no use for OHLC data.

```bash
cd app-code/main-app

# 1. shadcn scaffolding (once)
npx shadcn@latest init

# 2. register the namespace in components.json
#    "registries": { "@bklit": "https://ui.bklit.com/r/{name}.json" }

# 3. Phase B1 — only what SCALAR and STATUS can feed
npx shadcn@latest add @bklit/gauge-chart @bklit/ring-chart @bklit/area-chart @bklit/shimmering-text

# 4. Phase B2 — the rest, once SERIES/BREAKDOWN/RANKING readings exist
npx shadcn@latest add \
  @bklit/bar-chart @bklit/line-chart @bklit/live-line-chart @bklit/composed-chart \
  @bklit/pie-chart @bklit/funnel-chart @bklit/radar-chart @bklit/scatter-chart \
  @bklit/heatmap-chart @bklit/sunburst-chart @bklit/sankey-chart \
  @bklit/choropleth-chart @bklit/profit-loss-line

# 5. utility layers
npx shadcn@latest add \
  @bklit/legend @bklit/grid @bklit/background @bklit/reference-area \
  @bklit/projection-line @bklit/tooltip @bklit/brush @bklit/x-axis @bklit/y-axis \
  @bklit/custom-indicator @bklit/use-chart
```

Reference copies sit at `extras/bklit-ui/src/components/charts/` if the registry is unreachable — but the CLI install is the source of truth.

### 5.1 Compatibility spike — do this before anything else in Phase B1

`extras/bklit-ui` is **React 19 + Tailwind 4-era + Vite 8 + TypeScript 6**. The app is **React 18 + Tailwind 3 + Vite 7** (per `CLAUDE.md`). This is a real risk, not a formality.

bklit pulls `@visx/*`, `d3-array`, `d3-shape`, `motion` v13, `@number-flow/react`. Add them to the app's `package.json`.

**Spike:** install `gauge-chart` and `area-chart` only. Build. If they compile and render under React 18, continue. If not, in order of preference:
1. Pin `motion` and scope it to the chart directory.
2. Scope a Tailwind 4 config to `resources/js/Dashboard/charts/` only.
3. Vendor the components from `extras/bklit-ui` and downgrade their JSX manually.

**Do not begin building card components until the spike passes.** A half-migrated chart library is worse than Recharts.

### 5.2 Recharts

Recharts stays for now — it is used across existing report pages that this build does not touch. The rule is narrow: **no Recharts import under `resources/js/Dashboard/`.** Migrating the report pages is future work, explicitly out of scope.

---

## 6. Chart binding rules

| # | Rule | Why |
|---|---|---|
| 1 | Shape decides legality. The picker offers only `ReckonerCharts::for(shape)`; the API re-validates and returns `422` on an illegal pair. | A pie chart of a single scalar is meaningless. Silent fallback hides the mistake. |
| 2 | `pie` / `ring` / `sunburst` cap at **7 slices + "Other"**. Beyond that the builder steers to `bar`. | Nobody reads a 15-slice pie. |
| 3 | `line` / `area` cap at **6 series**. Beyond that, `heatmap`. | Spaghetti. |
| 4 | A signed SERIES that crosses zero defaults to `profit_loss_line`, never `area`. | A gradient fill below zero reads as growth. This is the single most misleading default in charting. |
| 5 | `bar` always starts at zero. **Not configurable.** `line` / `area` may use a fitted domain. | A truncated bar axis exaggerates difference. It is the classic way to lie with a chart, and we will not ship the option. |
| 6 | One palette, `resources/js/Dashboard/charts/palette.js`. WCAG AA in light and dark, colour-blind safe. | — |
| 7 | Semantic colour follows `direction`. Green = favourable. A **fall** in `finance.payables` (`lower_is_better`) is green. | Otherwise the dashboard congratulates the user for owing more money. |
| 8 | Formatting is central: `formatValue(value, unit, precision, currency, locale)`. **No `toFixed()` in a card component.** | Part 1 banned arithmetic in React. Formatting is the one exception and it lives in one file. |
| 9 | Empty, loading and error states belong to the **card frame**, not the chart. Identical whichever chart is chosen. | — |
| 10 | Use bklit's shimmer/loading-sweep, not a spinner overlay. | — |
| 11 | Every chart card exposes a screen-reader table of its data and is keyboard-reachable. | — |
| 12 | `not_applicable` renders as an explanatory empty state, **never as `0`**. | Part 1 §7.14. A confident zero is worse than a blank. |

---

## 7. Persistence

### 7.1 Migrations

```php
Schema::create('dashboards', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('tenant_id')->index();
    $table->uuid('user_id')->nullable()->index();     // null = a tenant-level template
    $table->string('name', 80);
    $table->string('slug', 80);
    $table->boolean('is_default')->default(false);
    $table->string('for_role', 40)->nullable();       // owner-published, per role
    $table->boolean('is_locked')->default(false);     // §8 — the force switch
    $table->unsignedSmallInteger('position')->default(0);
    $table->timestamps();
    $table->unique(['tenant_id', 'user_id', 'slug']);
});

Schema::create('dashboard_cards', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('tenant_id')->index();
    $table->uuid('dashboard_id')->index();
    $table->string('reading_key', 80);                // a ReckonerRegistry key
    $table->string('period', 24)->default('today');
    $table->json('period_custom')->nullable();
    $table->string('granularity', 16)->nullable();
    $table->string('chart', 24)->default('stat');
    $table->string('size', 12)->default('small');
    $table->unsignedTinyInteger('x')->default(0);
    $table->unsignedSmallInteger('y')->default(0);
    $table->unsignedTinyInteger('w')->default(3);
    $table->unsignedTinyInteger('h')->default(2);
    $table->string('title_override', 80)->nullable();
    $table->json('args')->nullable();
    $table->json('style')->nullable();                // legend/grid/tooltip/brush, accent, target
    $table->timestamps();
    $table->index(['dashboard_id', 'y', 'x']);
});
```

**MariaDB 10.5:** `json` maps to `LONGTEXT` with a check constraint. Do **not** index a JSON path via generated columns — 10.5 support is inconsistent and `CLAUDE.md` requires portable SQL.

### 7.2 Grid

Twelve columns. Four size presets only — this is the rule that stops a dragged layout becoming a mosaic of arbitrary rectangles, and `WidgetRegistry::SIZES` already established it:

```php
'small'  => ['w' => 3,  'h' => 2],
'medium' => ['w' => 6,  'h' => 2],
'large'  => ['w' => 6,  'h' => 4],
'full'   => ['w' => 12, 'h' => 3],
```

### 7.3 Sanitisation

`DashboardSanitizer::sanitize(array $cards, array $availableKeys)` — port `WidgetRegistry::sanitizeLayout()`, which already does this correctly, and extend:

- Drop cards whose `reading_key` is unknown or currently gated — **do not delete the row.** A plan downgrade must be reversible; re-upgrading restores the card in place. This is already the documented intent in `WidgetRegistry` and it is right.
- Migrate `deprecated` keys to their replacement.
- Force `period` into the definition's `periods`, else `default_period`.
- Force `chart` into `ReckonerCharts::for(shape)`, else `ReckonerCharts::default(shape)`.
- Re-derive `w`/`h` from `size`; clamp `x` to 0–11, `y` to 0–500.
- Whitelist `args` per reading; drop the rest.
- Cap at **40 cards**.
- **Reject any `platform`-scoped key outright** — belt and braces on top of §8 of Part 1.

---

## 8. Owner-forced layouts

Your decision, built as specified: the owner gets a switch, and the default is freedom.

**Behaviour:**

1. Every employee is auto-given a starting dashboard derived from their role and what they can actually see — computed the way `WidgetRegistry::defaultLayout()` already does it, from the gates, not from a fixed list. A cashier never opens a screen with four locked slots.
2. By default, **the employee can change their own dashboard.** Add, move, remove, re-chart.
3. The owner can build a dashboard, assign it to a role (`for_role`), and publish it. Published-but-unlocked = **that role's new starting point**, applied to anyone who hasn't customised theirs. People who already customised keep their own.
4. The owner can flip **Lock layout** (`is_locked`). Locked = every user in that role sees exactly the owner's arrangement. Add/remove/drag are hidden — not disabled-and-greyed, hidden. Period switching stays available unless the owner disables that too, because letting someone look at last month is not a layout change.
5. Unlocking restores each user's own saved layout if they had one. **Locking never destroys personal layouts** — it suspends them.

**Rules:**
- A locked layout still passes every gate. A locked card the viewer lacks permission for **does not render** — the owner cannot use the force switch to widen access. Gating outranks layout, always.
- `is_locked` is settable only by a user with `admin.settings_manage`.
- The lock state is shown to the employee in plain words: *"Your manager set this dashboard up for your team."* Not an error, not a padlock — an explanation.

---

## 9. HTTP API

Two new route groups alongside the Reckoner's two endpoints from §1.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/dashboards` | This user's dashboards (+ any published to their role) |
| `POST` | `/api/dashboards` | Create |
| `GET` | `/api/dashboards/{id}` | Cards + layout, **no data** |
| `PUT` | `/api/dashboards/{id}` | Rename, reorder, set default |
| `DELETE` | `/api/dashboards/{id}` | Delete (never the last one) |
| `PUT` | `/api/dashboards/{id}/layout` | Save the whole card array atomically |
| `POST` | `/api/dashboards/{id}/cards` | Add a card |
| `PATCH` | `/api/dashboards/{id}/cards/{cardId}` | Change period / chart / size / title / style |
| `DELETE` | `/api/dashboards/{id}/cards/{cardId}` | Remove a card |
| `POST` | `/api/dashboards/{id}/reset` | Back to the role default |
| `POST` | `/api/dashboards/{id}/publish` | Owner: assign to a role, optionally lock |

Same middleware group as §1. Run `php artisan ziggy:generate` after adding them.

### 9.1 Loading a dashboard — two calls, not N

```
GET  /api/dashboards/{id}           → cards (keys, periods, charts, positions)
POST /api/reckoner/read             → one batch of up to 24 readings
```

A card **never** fetches its own data. The dashboard collects every `(key, period, args)` on screen, sends one batch, and distributes results. This is why `Reckoner::MAX_BATCH = 24` exists.

**A dashboard with more than 24 cards splits into sequential batches of 24**, rendered progressively. The 40-card cap means at most two round trips.

### 9.2 Result keying — a gap to close

`ReckonerController::read()` currently returns `array_values($results)`, and `readMany()` keys results by `$request->key` alone. **Two cards showing `sales.revenue` at different periods will collide** — the second overwrites the first, and the response array cannot be matched back to the requesting cards.

This is a real bug that only manifests once cards exist, which is why it surfaces here.

**Fix:** key results by `"{key}|{period}|{md5(args)}"` throughout `readMany()` and echo the composite id in each result so the frontend can match. Add `'id'` to `ReckonerResult::jsonSerialize()`.

**Accept:** a batch containing `sales.revenue` at `today` and `sales.revenue` at `this_month` returns two distinct results, both correct. `ReckonerBatchKeyTest` asserts it.

### 9.3 Refresh

- **One shared timer per dashboard**, never one per card.
- `live` readings: 15 s. Everything else: `max(cache_ttl, 60 s)`.
- Polling pauses when the tab is hidden; resumes with an immediate fetch.
- Manual **Refresh** bypasses cache for that batch only (`?fresh=1`), rate-limited to 1 per 10 s per user.

---

## 10. The builder UX

A four-step sheet with a live preview alongside from step one. Every step reversible.

**Step 1 — What do you want to see?**
Search box plus domain tabs, populated from `/api/reckoner/catalogue`. Each result shows its vertical-aware label, its one-line `description`, and a live preview of its default chart **with the user's real data**. Nothing the user cannot see is listed — no padlocks, no upsell tiles. That principle is already stated in `WidgetRegistry`'s docblock; keep it.

**Step 2 — Over what period?**
Chips from the reading's `periods` array, plus a custom range picker. Readings whose only period is `live` skip this step entirely. Show the resolved window in words: *"1 – 11 August 2026"*. Surface the `help` text here — this is where the calendar-year rule gets read.

**Step 3 — How should it look?**
Only charts in `ReckonerCharts::for(shape)`, each a live thumbnail of the user's own data. The user picks by looking, not by knowing what "composed chart" means. Size selector with sizes below the chart's minimum disabled.

**Step 4 — Anything to adjust?**
Optional: title override, comparison on/off, target line (gauge/ring), utility layer toggles, colour accent, and any whitelisted `args`.

**Then:** the card lands in the first free grid slot and the sheet closes. **No save button — adding is saving.**

**Grid:** `react-grid-layout`, drag to reorder, resize between presets only, autosave 800 ms after the last drag, optimistic UI.

**Empty state:** the role-derived starter set plus one prominent "Add a card".

---

## 11. Build phases

### Phase B0 — Unblock (half a day)
Fix **B1** (routes, §1), **B2** (Ziggy), **B4** (comparison, §2), and **§9.2** (batch key collision).
**Accept:** both endpoints reachable; `sales.revenue` returns a delta; two periods of one key in one batch return two results.

### Phase B1 — Ship a real dashboard on scalars
Compatibility spike (§5.1). Install four bklit components. Build `ReckonerCharts`, `chartRegistry`, `palette`, `formatValue`, the card frame, and four chart types: `stat`, `sparkline`, `gauge`, `status`. Migrations, `DashboardSanitizer`, the eleven endpoints, the four-step builder, the grid.

**Accept:**
- A user adds, moves, resizes, re-periodises and deletes a card without a page reload.
- Layout survives a hard refresh.
- Exactly **one** poll timer regardless of card count.
- A plan downgrade hides a card without deleting its row; re-upgrading restores it in place.
- An illegal chart-for-shape returns `422`.
- 40-card and 24-batch caps enforced.
- Keyboard-only: add, move, delete a card.
- **This phase is shippable to users.**

### Phase B2 — Shapes and the full chart library
Add the twelve readings in §3 to the Reckoner (in `app/Reckoner/Sources/`, following Part 1's rules — they call `FinancialReportingService`, they do not compute). Install the remaining bklit charts. Build the remaining 16 chart types.

**Accept:**
- Every chart renders every compatible fixture shape, light and dark, at every legal size.
- `ChartRegistryParityTest` green.
- Slice and series caps enforced.
- A signed SERIES crossing zero defaults to `profit_loss_line`.
- No Recharts import under `resources/js/Dashboard/`.
- Contrast AA on every palette pair in both themes.

### Phase B3 — Owner controls
Publishing, `for_role`, `is_locked` (§8), role starter layouts.

**Accept:**
- Publishing unlocked changes the starting point for uncustomised users only.
- Locking hides editing controls; unlocking restores personal layouts intact.
- A locked card the viewer lacks permission for does not render.
- Only `admin.settings_manage` can lock.

### Phase B4 — Retire the legacy dashboards
Convert the seven legacy files — `Dashboard.jsx`, `Admin/Dashboard.jsx`, `Admin/ExecutiveDashboard.jsx`, `Dashboards/{Accountant,Cashier,Purchasing,Viewer}Dashboard.jsx` — into seeded default layouts. Delete the files.

**Accept:**
- Each old role dashboard has a seeded layout reproducing its cards.
- The incomplete JS span-recalculation at `Dashboard.jsx:48–65` is gone — the grid handles gaps natively, so the layout-gap bug documented in `PART_A_DASHBOARD_CARDS.md` cannot recur.
- `Admin/Dashboard.jsx` and `ExecutiveDashboard.jsx`'s zero-gating problem is gone by construction: every card is gated in the Reckoner.
- The dead `canReports` variable and the three competing inline permission checks in `Dashboard.jsx` are deleted.
- `WidgetRegistry` and `WidgetDataService` are deleted, their behaviour fully absorbed.

---

## 12. Tests

| Test | Asserts |
|---|---|
| `ReckonerRouteTest` | Both endpoints reachable, authed, 401 unauthenticated, no `platform.*` in catalogue |
| `ReckonerComparisonTest` | `previous` / `change_pct` present; zero baseline → `null`; `live` → no comparison read |
| `ReckonerBatchKeyTest` | Same key at two periods returns two distinct results |
| `ReckonerChartsTest` | Every shape maps to ≥1 chart; `default()` is always legal |
| `ChartRegistryParityTest` | Frontend and backend chart maps identical |
| `DashboardSanitizerTest` | Downgrade hides without deleting; upgrade restores; deprecated keys migrate; caps enforced; platform keys rejected |
| `DashboardApiTest` | All eleven endpoints; every error code; 422 on illegal chart |
| `DashboardLockTest` | Publish, lock, unlock; personal layouts survive; gating outranks lock |
| `ChartRenderTest` (JS) | Every chart renders every compatible fixture, both themes, every legal size |
| `CardFrameTest` (JS) | `not_applicable` renders an explanation, never `0`; loading and error states |
| `PollTimerTest` (JS) | Exactly one interval per dashboard; pauses when hidden |

Tests run on `amd_pos_test` — **MariaDB, never SQLite**, per `CLAUDE.md`.

---

## 13. Risks

| Risk | Mitigation |
|---|---|
| bklit (React 19 / Tailwind 4) fights the app (React 18 / Tailwind 3) | §5.1 spike gates the whole phase. Three fallbacks, in order. Do not proceed on hope. |
| Building 20 chart types with only 2 shapes producing data | Phase B1 ships **4** charts against real scalars. The other 16 wait for Phase B2's readings. Explicitly sequenced. |
| A 40-card dashboard hammers the database | Source batching, per-reading TTL, prefix invalidation, 24-batch cap, 6 s budget — all inherited from Part 1 and already built |
| Users build dashboards that mislead them | Shape→chart legality, the zero-baseline `change_pct` rule, the zero-baseline bar axis rule, `not_applicable` over `0`, direction-aware colour |
| Owner lock becomes a way to widen access | Gates run on every read regardless of layout. `DashboardLockTest` asserts a locked card the viewer can't see doesn't render. |
| The card layer starts calculating | Same CI grep Part 1 installed, extended to `resources/js/Dashboard/`. A card formats; it does not compute. |

---

## 14. Still open from Part 1

These are Reckoner work, not card work, and they remain outstanding. None blocks Phase B1.

1. **§7 legacy-controller canonicalisation** — the losing implementations (inventory value's `qty × cost_price`, the three ageing schemes, the second MRR pricer, `ReportController::lowStock()`'s out-of-stock inclusion) are still in the codebase alongside the Reckoner. Until they are deleted, both definitions exist and can still disagree.
2. **Real MRR and tax sources** — `platform.mrr` and `tax.collected` need their canonical implementations.
3. **`ReckonerLabels` business-type map is empty** (B5) — vertical relabelling is declared but does nothing.
4. **Frontend consumption** — nothing in the app calls the Reckoner yet. Phase B1 is the first consumer; the legacy report pages come later.
5. **The live PHPUnit suite has not been run** end to end against these files.

**Recommended order:** Phase B0 → run the PHPUnit suite → Phase B1 (ship it) → Part 1 §7 canonicalisation → Phase B2.

Canonicalisation before B2 rather than after, because B2's `SERIES` and `BREAKDOWN` readings will be built on top of whichever definition wins — and building them twice is the avoidable cost.

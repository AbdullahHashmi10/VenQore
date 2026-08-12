# The Reckoner

**VenQore's calculation core. Part 1 of 2.**
Version 1.0 · 2026-08-11
Repo root: `E:\AMD POS\AMD POS` · App root: `app-code/main-app`
Namespace: `App\Reckoner`

> **This document builds one thing: the engine that owns every number in VenQore.**
>
> A *ready reckoner* is a book of worked-out figures you look up instead of calculating yourself. That is exactly what this is. Every card, every report, every page, the mobile app and the Windows app stop doing their own arithmetic and start asking the Reckoner.
>
> It does not build cards. It does not build charts. It does not change how any screen looks.
> When this document is finished, every screen shows the same numbers it shows today — except the ones that were wrong, which now agree with each other.
>
> The card builder is Part 2 (`VENQORE_CARD_BUILDER_BUILD_SPEC.md`). **Do not start Part 2 until Part 1 is shipped and its tests are green.**

**Vocabulary used throughout:**

| Term | Meaning |
|---|---|
| **The Reckoner** | The whole calculation core — `app/Reckoner/` |
| **Reading** | One answer: a metric, over a period, for this tenant |
| **Source** | The only class allowed to run a query for a reading (`SalesSource`, `FinanceSource`, …) |
| **Registry** | The catalogue of every reading that exists |
| **Gate** | Permission / plan / capability check, run before any query |

---

## 1. The problem, stated once

Today, "Revenue" is computed independently in at least six places:

| Where | How it computes revenue |
|---|---|
| `FinancialReportingService::getProfitAndLoss()` | GL account 4000, double-entry, net of reversals |
| `ReportController::sales()` | `SUM(sales.net_sales)` on the sales table |
| `SalesAnalyticsController::index()` | GL for value, raw `Sale::count()` for counts |
| `OwnerDailyPulseService` | `SUM(net_sales)` by `posted_at` |
| `FinancialReportingService::getGrossProfitByProduct()` | `COALESCE(NULLIF(net_amount,0), subtotal)`, prorated for returns |
| `Pos.jsx` | client-side cart arithmetic |

These do not agree. A sale reversed by a manual journal entry moves the GL figure and not the `sales`-table figure. That is not a hypothetical — it is the documented behaviour of your own reversal flow.

The same is true of inventory value (two formulas), receivables (three), ageing buckets (three schemes), purchases (accrual vs cash), MRR (two pricers), low stock (two definitions), and margin (two things sharing one word). Full list in §7.

**Every one of these is a screen that lies to your user.** In an ERP that is the only unforgivable bug, because a business owner cannot tell which of the two numbers is the real one, and once they can't tell, they stop trusting all of them.

**The Reckoner exists to make this structurally impossible.** Not "fixed" — impossible. After this build there is exactly one place a number can be defined, and a CI check fails the build if a second one appears.

---

## 2. What the Reckoner is

```
app/Reckoner/                  ← the entire calculation core lives here

  Reckoner.php                 the front door. Takes a request, runs the gates,
                               calls a Source, caches, returns a Reading.
  ReckonerRegistry.php         the catalogue. WHAT readings exist. No queries, ever.
  ReckonerPeriod.php           the ONLY place a date range is constructed.
  ReckonerShape.php            what kind of value a reading returns.
  ReckonerResult.php           the response object every reading returns.
  ReckonerSettings.php         tenant-configurable thresholds (§6).
  ReckonerLabels.php           display names per business type. Never affects the maths.
  ReckonerCache.php            remembering and forgetting (§4.3).

  Sources/                     the ONLY code allowed to run a query for a reading.
    SalesSource.php
    FinanceSource.php
    TaxSource.php
    InventorySource.php
    PurchasingSource.php
    PartySource.php
    ProductionSource.php
    RestaurantSource.php
    StaffSource.php
    OperationsSource.php
    PlatformSource.php         ← platform-only, never reachable by a store
```

Everything in the application talks to one method:

```php
Reckoner::read('sales.revenue', 'this_month');          // one reading
Reckoner::readMany([                                     // many, in one pass
    ['sales.revenue',      'this_month'],
    ['finance.net_profit', 'this_month'],
    ['inventory.stock_value'],
]);
```

**What the Reckoner is NOT:**

- It is **not a replacement for `FinancialReportingService`.** That service stays and remains the source of truth for everything financial. The Reckoner's Sources *call* it. If the Reckoner ever contains a second definition of gross profit, the build has failed.
- It is **not a UI.** It returns data structures.
- It is **not a formula builder.** The catalogue is closed — see §6.1.

**The one rule, stated as a test:** after this build, a `grep` for `SUM(`, `COUNT(`, `AVG(`, `->sum(`, `->count(`, `->avg(` across `app/Http/Controllers/` returns nothing that feeds a displayed number. CI enforces it.

---

## 2A. How "always available" actually works

The Reckoner must feel like the numbers are simply *there* — always current, instantly. There are two ways to build that, and only one of them is safe.

**The wrong way — recompute everything on every write.** Post a sale, and the system recalculates all ~250 readings across all 18 periods. That is roughly 4,500 figures per sale. Your queue is currently `sync` (per `CLAUDE.md`), so this would run **inside the checkout web request**, with a customer standing at the counter. Adding a chart to a dashboard would make the till slower. That is backwards.

**The right way — compute when asked, then remember; forget when the data changes.**

1. A screen asks for a reading.
2. If the Reckoner already has a fresh answer, it hands it back immediately.
3. If not, it computes it once, hands it back, and remembers it.
4. When a sale, purchase, journal entry, stock movement or expense is written, the Reckoner **forgets** the readings that fact could have changed — by domain, not one at a time.
5. The next request recomputes from live data.

The user experience is identical to precomputing — the number is always there and always right. The difference is *when* the work happens: while someone is **looking**, not while someone is **selling**. Nobody waits at the till so a dashboard can stay warm.

**Where precomputing IS correct — and the one place we use it.** Some readings are genuinely expensive and genuinely historical: `sales.revenue` for a month that ended six weeks ago cannot change unless someone back-dates an entry. For those, a nightly `reckoner:warm` command precomputes closed periods into a snapshot table and marks them immutable until an event touches that date range. This is an **optimisation added in Phase 6, only if `ReckonerPerformanceTest` shows it is needed.** Do not build it up front. Premature precomputation is how a fast system becomes a stale one.

---

## 3. The three moving parts

### 3.1 A metric definition

`ReckonerRegistry::all()` returns an array keyed by an immutable metric key. Every entry has exactly these fields.

```php
'sales.revenue' => [
    'key'          => 'sales.revenue',   // permanent public id. NEVER rename.
    'domain'       => 'sales',
    'label'        => 'Revenue',         // canonical name (business-type overrides in ReckonerLabels)
    'description'  => 'Money earned from posted sales, net of returns and excluding tax.',
    'help'         => 'Read from the accounting ledger, so a sale reversed by a journal entry '
                    . 'is removed here too. Yearly periods run on the calendar year, '
                    . '1 January to 31 December.',

    'shape'        => ReckonerShape::SCALAR,
    'unit'         => 'currency',        // currency|integer|decimal|percent|duration|text|boolean
    'precision'    => 2,
    'direction'    => 'higher_is_better',// higher_is_better|lower_is_better|neutral
    'signed'       => true,              // may legitimately go negative → dual label (§7.16)

    'periods'      => ['today','yesterday','this_week','last_week','this_month','last_month',
                       'this_quarter','last_quarter','this_year','last_year','last_7_days',
                       'last_30_days','last_90_days','last_12_months','all_time','custom'],
    'default_period'      => 'today',
    'supports_comparison' => true,
    'supports_series'     => true,
    'series_granularity'  => ['hourly','daily','weekly','monthly','quarterly','yearly'],

    'permissions'  => ['sales.view','reports.summary','reports.financial'],  // ANY-of
    'feature'      => null,              // plan entitlement key
    'capability'   => null,              // business capability probe
    'scope'        => 'tenant',          // tenant | platform   ← §8

    'source'     => SalesSource::class,
    'method'       => 'revenue',
    'cache_ttl'    => 60,                // seconds; 0 = never cache
    'drill_route'  => 'reports.sales',   // Ziggy route, or null
],
```

**Key immutability.** The key is a permanent public identifier that will be saved in user dashboards in Part 2, and referenced by the mobile and Windows apps. To change what the user sees, change `label`. To retire a metric, add `'deprecated' => 'replacement.key'`. **Never rename a key.**

### 3.2 Periods — the calendar year decision

`ReckonerPeriod` is the only class in the entire application permitted to construct a date range for a metric.

**Your decision: VenQore has no fiscal-year system, so all yearly and quarterly periods run on the calendar — 1 January to 31 December.** This is stated in the `help` text of every metric with a yearly period, so it appears in the card tooltip and the user is never guessing.

All windows resolve in the **tenant's timezone**, as `WidgetDataService::now()` already does correctly.

| Key | Window | Comparison window |
|---|---|---|
| `today` | 00:00 → 23:59:59 today | yesterday |
| `yesterday` | previous calendar day | day before |
| `this_week` | week start → now | same span last week |
| `last_week` | previous full week | week before |
| `this_month` | month start → month end | same span last month |
| `last_month` | previous full calendar month | month before |
| `this_quarter` | **calendar** quarter to date (Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec) | same quarter last year |
| `last_quarter` | previous full calendar quarter | quarter before |
| `this_year` | **1 January** → now | same span last year |
| `last_year` | previous full calendar year | year before |
| `last_7_days` | rolling 7 days ending now | preceding 7 days |
| `last_30_days` | rolling 30 days | preceding 30 days |
| `last_90_days` | rolling 90 days | preceding 90 days |
| `last_12_months` | rolling 12 calendar months | preceding 12 months |
| `all_time` | `1900-01-01` → now | none |
| `custom` | caller-supplied `from`/`to` | equal-length preceding window |
| `as_of` | point-in-time (balance-sheet style metrics) | none |
| `live` | no window — current state | none |

```php
final class ReckonerPeriod
{
    public function __construct(
        public readonly string $key,
        public readonly CarbonImmutable $start,
        public readonly CarbonImmutable $end,
        public readonly ?CarbonImmutable $compareStart,
        public readonly ?CarbonImmutable $compareEnd,
        public readonly string $label,          // "August 2026", "Last 30 days"
        public readonly string $compareLabel,   // "vs July"
    ) {}

    public static function resolve(string $key, ?array $custom, Tenant $tenant): self;
    public static function all(): array;
}
```

**Acceptance:** `grep -rn "startOfMonth\|startOfYear\|subDays\|whereBetween\|whereDate" app/Reckoner/` returns hits only inside `ReckonerPeriod.php`.

**Forward compatibility:** if a fiscal-year field is added later, only `ReckonerPeriod` changes. Nothing else in the application knows how a year is defined.

### 3.3 Shapes and the envelope

A metric's **shape** is what kind of answer it gives. This matters to the Core because it determines the payload contract; it matters enormously to Part 2, where it decides which charts are legal.

| Shape | Payload |
|---|---|
| `SCALAR` | `{ value, previous?, change_pct?, label }` |
| `SERIES` | `{ series: [{x, y}], granularity }` |
| `MULTI_SERIES` | `{ series: [{ name, points: [{x,y}] }] }` |
| `BREAKDOWN` | `{ slices: [{ name, value, pct }], total }` |
| `TABLE` | `{ columns, rows, total? }` |
| `RANKING` | `{ rows: [{ rank, name, value, meta }] }` |
| `FUNNEL` | `{ stages: [{ name, value }] }` |
| `GAUGE` | `{ value, min, max, target?, bands }` |
| `STATUS` | `{ state, label, detail?, severity }` |
| `FEED` | `{ items: [...] }` |
| `GEO` | `{ regions: [{ code, value }] }` |

Every metric returns this envelope. Nothing else.

```json
{
  "key": "sales.revenue",
  "ok": true,
  "shape": "scalar",
  "unit": "currency", "precision": 2, "currency": "PKR",
  "period": { "key": "this_month", "label": "August 2026",
              "from": "2026-08-01", "to": "2026-08-31", "compare_label": "vs July" },
  "label": "Revenue",
  "help": "Read from the accounting ledger… Yearly periods run on the calendar year.",
  "direction": "higher_is_better",
  "data": { "value": 1284300.00, "previous": 1102450.00, "change_pct": 16.5 },
  "meta": { "cached": true, "computed_at": "2026-08-11T09:14:02+05:00", "stale_after": 60 },
  "drill": { "route": "reports.sales", "params": { "from": "2026-08-01", "to": "2026-08-31" } }
}
```

Failure:

```json
{ "key": "sales.revenue", "ok": false,
  "error": { "code": "not_applicable", "message": "This store does not track production." } }
```

Codes: `not_found`, `forbidden`, `plan_locked`, `not_applicable`, `invalid_period`, `resolver_failed`, `timeout`.

**`not_applicable` is never rendered as zero.** A confident `0` where the truth is "we don't know" is the most damaging thing a dashboard can display. `ProductionController` currently hardcodes `month_cost = 0` — that becomes `not_applicable` until implemented properly (§7.14).

---

## 4. The front door

```php
class Reckoner
{
    /** One reading. */
    public function read(ReckonerRequest $r, User $u, Tenant $t): ReckonerResult;
    /** Many readings in one pass, grouped by Source. @param ReckonerRequest[] $rs */
    public function readMany(array $rs, User $u, Tenant $t): array;
}

final class ReckonerRequest
{
    public string  $key;
    public string  $period      = 'today';
    public ?array  $custom      = null;   // ['from' =>, 'to' =>]
    public ?string $granularity = null;
    public array   $args        = [];     // whitelisted per metric (warehouse_id, category_id, …)
}
```

Resolution runs six steps **in this order, every time, with no shortcuts**:

1. **Exists** — key is in the registry → else `not_found`.
2. **Scope** — a `platform` metric requested in a tenant context → `not_found` (§8: it must not even admit the metric exists).
3. **Permission** — ANY-of match via `$user->hasPermission()` → else `forbidden`.
4. **Plan feature** — `PlanRepository::featuresFor($tenant)` → else `plan_locked`.
5. **Capability** — cached business probe → else `not_applicable`.
6. **Validate + resolve** — period legal, args whitelisted → cache lookup → source → envelope.

**A metric that fails any gate must execute zero database queries.** Assert this with a query-count spy in tests — a `forbidden` metric that still runs its query is a data-leak vector even though the value is discarded.

### 4.1 Gating — reuse what exists

`WidgetRegistry` already implements the three-gate model correctly and its docblock explains why gating lives server-side. **Port that logic verbatim** into the Core; do not rewrite it.

Capability probes (cached 10 minutes per tenant, `exists()` not `count()`):
`has_inventory`, `has_parties`, `has_purchases`, `has_sales_orders`, `has_manufacturing`, `has_staff` — all already implemented — plus new ones this build adds: `has_restaurant`, `has_ecommerce`, `has_fbr`, `has_bank_accounts`, `has_production_costs`.

### 4.2 Batching

Sources implement:

```php
interface ReckonerSource {
    public function supports(): array;                                  // metric keys
    public function resolveBatch(array $requests, ReckonerContext $ctx): array;  // key => payload
}
```

`readMany()` groups by Source before dispatch. This matters: `FinanceSource` reads the P&L **once** and answers `revenue`, `cogs`, `gross_profit`, `net_profit`, `gross_margin_pct`, `net_margin_pct`, `expenses_total` from that single read. Naively resolved, those seven metrics are seven full P&L computations.

### 4.3 Caching

Key: `vq_reckoner:{tenant}:{metric}:{period}:{granularity}:{md5(args)}`
TTL from the definition. Store: `database` driver (no Redis — per `CLAUDE.md`).

Invalidation is by **domain prefix**, driven by existing domain events:

| Event | Flushes prefix |
|---|---|
| Sale posted / voided / returned | `sales.`, `finance.`, `inventory.`, `party.`, `tax.` |
| Purchase posted / received / returned | `purchasing.`, `finance.`, `inventory.`, `supplier.`, `tax.` |
| Journal entry created / reversed | `finance.`, `tax.` |
| Stock movement / adjustment / transfer | `inventory.` |
| Expense saved | `finance.` |
| Production run completed | `production.`, `inventory.` |
| Payment recorded | `finance.`, `party.` |
| Staff clock in/out | `staff.` |

### 4.4 Cost guards

- Max **24 metrics per resolve call**.
- Per-call wall-clock budget **6 seconds**; a source still running returns `timeout`, the rest still resolve.
- `all_time` on a SERIES caps at 60 buckets, then downsamples.
- Every source query is tenant-scoped and index-backed. A source that triggers a full table scan on the golden dataset fails `ReckonerPerformanceTest`.

---

## 5. Sources — the migration

This is the bulk of the work. Every calculation currently living in a controller or a React file moves into a source. **The controller becomes a caller.**

### 5.1 Source inventory

| Current location | What moves | Target source |
|---|---|---|
| `ReportController` (~60 report methods) | every `stats` array it builds | Sales / Finance / Inventory / Purchasing / Tax |
| `InventoryController` | stock totals, category counts, low-stock counts | Inventory |
| `FinanceController` | liquidity, receivables, payables summaries | Finance |
| `ExpenseController` | today/week/month/total expense tiles | Finance |
| `PaymentController` | received / paid out / net flow | Finance |
| `TransactionController` | debit/credit/net/balance-due totals | Finance |
| `PartyController` | party counts, exposure, ledger totals | Party |
| `PurchaseOrderController` | PO pipeline counts and values | Purchasing |
| `ProductionController` | run counts and costs (currently `0`) | Production |
| `StockTakeController`, `StockTransferController`, `SerialTrackingController` | pipeline counts | Inventory |
| `OwnerDailyPulseService` | 7 day-over-day deltas | Finance / Sales (see §7.2) |
| `GrowthEngineController` | signal counts, opportunity/recovered value | Operations |
| `WooConnectionController`, `VenSynQController` | sync and payout counts | Operations |
| `Api\PlanUsageController` | quota meters | Operations |
| `SuperAdminController`, `AdminDashboardController` | all platform metrics | Platform (scope: platform) |
| `Dashboards/*.jsx`, `Reports/*.jsx` | **every client-side arithmetic** | the matching source |

### 5.2 Client-side arithmetic must move

Your IDE's sweep found numbers being computed **inside React components** — avg discount per bill, heavy-discount count, stock health distribution, dead-stock ratio, carrying-cost bleed, staff revenue share, average tenant turnover. Each of these is a metric with no server definition, invisible to every other screen, and impossible to test.

All of them move into sources and become registry keys. After this build, **a React file may format a number and may not produce one.**

Enforce it: CI greps `resources/js/Pages/Reports/` and `resources/js/Pages/Dashboards/` for `.reduce(`, `.filter(...).length`, `/ 100`, `* 100`, `toFixed(` outside a formatting helper, and fails on a hit outside the allow-list.

### 5.3 The POS exception

`Pos.jsx` computes a live cart total (`subtotal`, item discounts, free-item value, taxable amount, tax) client-side. **This is correct and stays.** The POS is offline-first (Dexie/IndexedDB) and cannot call the server to price a cart.

The rule is: the POS's live cart arithmetic is **transaction pricing**, not reporting. Once a sale is posted, every reported figure about it comes from the Core. The cart calculation must be extracted into a shared, tested pricing module (`resources/js/pricing/cartPricing.js`) with a PHP mirror used at post time, and a test asserting the two agree on a fixture set — so an offline sale and its server record cannot price differently.

**These are not registry metrics:** `sales.pos_change_due`, `sales.pos_taxable_amount`, `sales.pos_tax_amount`, `sales.pos_item_discounts`, `sales.pos_free_item_discounts`. They are properties of an in-progress cart, not measurements of the business. They must not enter the catalogue.

---

## 6. Store-configurable settings

Your decision throughout: **do not lock a number the owner should own.** These live in the existing per-tenant `Setting` key-value store and are read only by `ReckonerSettings`.

| Setting key | Meaning | Default | Where the owner sets it |
|---|---|---|---|
| `reckoner.heavy_discount_pct` | A bill above this discount % counts as heavily discounted | `20` | Settings → Sales |
| `reckoner.overstock_mode` | `off` \| `manual` \| `auto` | `off` | Settings → Inventory |
| `reckoner.overstock_multiplier` | Manual mode: qty above `min_stock_alert × N` is overstock | `5` | Settings → Inventory |
| `reckoner.overstock_notify` | Send the friendly reminder | `false` | Settings → Inventory |
| `reckoner.dormant_days` | Days of no purchase before a customer is dormant | *by business type* | Settings → Customers |
| `reckoner.stock_aging_buckets` | Day boundaries for stock ageing | `30,90,180` | Settings → Inventory |
| `reckoner.expiry_warning_days` | "Expiring soon" horizon | `30` | Settings → Inventory |
| `reckoner.carrying_cost_pct` | Annual holding cost used for the tied-up-capital estimate | `15` | Settings → Inventory |

### 6.1 No user-defined formulas — confirmed

**The catalogue is closed.** A user may choose *which* predefined metric to look at, over *which* period, filtered by *which* whitelisted argument. They may not write `revenue − payroll`.

Why this is the right call and not a limitation: a formula builder means users create metrics you cannot name, cannot test, cannot support and cannot explain when they disagree with a report. The entire point of this build is that every number has one owner. A formula builder hands that ownership back to the user, and the first support ticket is "your dashboard says X and your P&L says Y" about a formula they wrote themselves.

If a user wants a combination that doesn't exist, **that is a signal to add it to the catalogue for everyone** — properly named, tested and documented.

### 6.2 Overstock — your design, specified

There is no such thing as "overstock" in VenQore by default. It is off, it is opt-in, and it is the owner's number.

- **`off` (default).** `inventory.overstock_count` returns `not_applicable`. Nothing appears anywhere. No nag.
- **`manual`.** The owner sets a multiplier — anything above `min_stock_alert × multiplier` is overstocked. Simple, predictable, theirs.
- **`auto`.** The Core computes it as days-of-cover: `qty ÷ (average daily sales over the last 90 days)`. Above 180 days of cover is overstocked. Products with no sales history return `not_applicable` rather than being flagged — a brand-new product is not overstocked, it is new.
- **Notification.** Only if `reckoner.overstock_notify` is on. The wording is a friendly reminder, never an accusation:
  > *"You're holding about 8 months of Basmati Rice at the current rate of sale. That's around PKR 240,000 sitting on the shelf — worth a look if you need the cash elsewhere."*

  Never "You have overstocked."

**This also resolves your IDE's conflict #5.** The hardcoded `quantity > 200` in `PointInTimeInventory.jsx` is deleted. There is no magic 200.

### 6.3 Dormant customers — business type default, owner override

Default `reckoner.dormant_days` by business type, overridable at any time:

| Business type | Default | Reasoning |
|---|---|---|
| Restaurant | 30 days | A guest who hasn't come in a month has moved on |
| Grocery | 21 days | Weekly shop; three missed weeks is a signal |
| Pharmacy | 60 days | Repeat prescriptions run monthly to bi-monthly |
| Retail | 90 days | Seasonal purchase rhythm |
| Salon | 60 days | Typical appointment cycle |
| Automotive | 180 days | Servicing is half-yearly at best |
| Wholesale | 45 days | Trade accounts reorder regularly |
| Services | 120 days | Project-based, long gaps are normal |
| Manufacturing | 90 days | — |
| Generic | 90 days | — |

The settings screen shows the default with its reasoning and a field to change it. Nothing is locked.

### 6.4 Heavy discount — owner's number

`reckoner.heavy_discount_pct`, default 20, editable. The metric help text names the current threshold so the number on screen is always self-explaining: *"Bills discounted more than 20% — you can change this in Settings."*

---

## 7. Canonicalisation — the decisions

**This section is the actual value of the whole build.** Each conflict has exactly one winner. Every loser is deleted, not deprecated, not left "for compatibility."

### 7.1 Revenue — the ledger wins
**Winner:** `FinancialReportingService::getProfitAndLoss().revenue` — GL account 4000, net of returns, excluding tax, honouring reversals.
**Delete:** `ReportController::sales()` summing `sales.net_sales`; `SalesAnalyticsController`'s mixed approach; `OwnerDailyPulseService`'s `SUM(net_sales)`.
**Keep, with a constraint:** `getGrossProfitByProduct()`'s prorated `net_amount` stays — it is the only way to attribute revenue to a *product line*. But its column total must reconcile to the GL revenue within rounding, and a test asserts it. If they diverge, the attribution logic is wrong, not the ledger.
**Why:** a sale reversed by a manual journal entry disappears from the GL and does not disappear from `sales.net_sales`. The ledger is the only figure that survives every way money can move.

### 7.2 Daily Pulse must read the Core
`OwnerDailyPulseService` computes seven day-over-day deltas from the `sales` table. It becomes a **consumer**: it calls `sales.revenue`, `purchasing.spend`, `finance.total_liquidity`, `inventory.stock_value`, `finance.expenses_total`, `finance.receivables`, `finance.payables` at `today` with comparison on, and formats the result. It computes nothing.

### 7.3 Inventory value — FIFO wins
**Winner:** `FinancialReportingService::getInventoryValue()` — `SUM(inventory_batches.remaining_qty × unit_cost)`.
**Delete:** `InventoryController.php:~1050` `$products->sum(fn($p) => $p['total_stock'] * $p['cost_price'])`. The docblock on `getInventoryValue()` explicitly forbids exactly this formula, and the controller does it anyway.
**Update:** `Pages/Inventory/StockLevels.jsx` to read `inventory.stock_value`.

### 7.4 Receivables and payables — the GL wins
**Winner:** net movement on GL `1200` (AR) and `2000` (AP), non-reversed entries only — exactly what `WidgetDataService::outstanding()` already does.
**Constraint:** `getAgedReceivables()` keeps its per-invoice detail but **must reconcile to the GL total within PKR 0.01**. Its "Credit / Advance" balancing row stays and is documented in the report, not hidden.
**Demote:** `PartyController::index()` summing `parties.current_balance` — that column may show a single party's balance, never a company total.

### 7.5 Ageing buckets — one scheme
**Winner:** `0–30 / 31–60 / 61–90 / 90+`, inclusive lower bound, per `FinancialReportingService::ageBucket()`.
**Change:** `ReportController::saleAging()` (strict `>`), `V3\CustomerStatementController` (`current / 1-30 / …`).
**Test:** a 60-day invoice appears in `31–60` on every surface in the product.
*(Once §6 ships, the boundaries come from `reckoner.stock_aging_buckets` for stock ageing; receivables ageing stays fixed at the accounting standard.)*

### 7.6 Purchases — two metrics, two names
Your IDE is right that this is a real conflict, and the fix is **not** to pick a winner. They are different facts.
- `purchasing.spend` — **"Purchases"** — accrual: `purchases.total` on the purchase date. What you *bought*.
- `finance.paid_to_suppliers` — **"Paid to Suppliers"** — cash: AP debits on non-reversed `purchase_payment` journal entries. What you *paid*.
Both exist, both are in the catalogue, and **neither may ever be labelled just "Purchases" without its qualifier.** `paid_amount` is never read from a stored column — per `CLAUDE.md`, it is derived from the ledger, because a stored column drifts.

### 7.7 Customer spend — two metrics, two names
Same shape of problem, same resolution.
- `party.customer_spend` — **"Customer Spend"** — invoiced value including credit sales.
- `party.customer_receipts` — **"Cash Received from Customer"** — payments actually collected.
A top spender with zero receipts is not a data error; it is your biggest credit risk, and separating these two numbers is what makes that visible.

### 7.8 Largest Sale — ex-tax
**Winner:** `MAX(sales.net_sales)`. **Change:** `graphAnalytics()` `max('total')`. **Label everywhere:** "Largest Sale (excl. tax)".

### 7.9 MRR — coupon-adjusted wins
**Winner:** `AdminDashboardController`'s per-tenant pricing with `CouponRedemption` discounts applied.
**Delete:** `SuperAdminController`'s `activePaidCount × PlanPricingService::monthly()`. Two MRR figures currently render on adjacent admin pages.

### 7.10 Deleted store count — demo-filtered wins
**Winner:** `AdminDashboardController`'s `$realTenants` denominator. Demo tenants are excluded from **every** platform metric, without exception.

### 7.11 Staff sales — `getNetRevenueByUser()` wins
**Winner:** `FinancialReportingService::getNetRevenueByUser()` (ex-tax, returns netted). **Change:** the staff dashboard's separate computation.

### 7.12 Cash flow — two metrics, two names
- `finance.net_cash_flow` ← `getCashFlowReport()` — **"Net Cash Flow"** (inflow − outflow, transfers excluded).
- `finance.cash_flow_classified` ← `getDetailedCashFlow()` — **"Cash Flow by Activity"** (operating + investing + financing, accounts 1000/1010 only).
They legitimately differ. They may never share a label. **Delete** the duplicate `net_change_in_cash` alias from `getCashFlowReport()` — one method returning the same value under two names is how this class of bug starts.

### 7.13 Low stock excludes out of stock
**Winner:** low stock = `0 < qty ≤ min_stock_alert`. Out of stock is its own metric.
**Change:** `ReportController::lowStock()` to exclude `qty ≤ 0`.
**Test:** `low_stock_count + out_of_stock_count` equals the old combined figure.

### 7.14 Production cost is currently fabricated
`ProductionController::index()` hardcodes `month_cost` and `ingredients_used` to `0`. Implement `production.total_cost` from `production_runs.total_cost`. **Until implemented it returns `not_applicable`, never `0`.**

### 7.15 Margin — two named metrics, and the bare word is banned
- `sales.gross_margin_pct` = gross profit ÷ revenue.
- `finance.net_margin_pct` = net profit ÷ revenue.
The word "margin" alone never appears in the UI. Every label says which.

### 7.16 Signed metrics get a loss-side label
Any metric with `'signed' => true` renders a different word when negative:

| Metric | Positive | Negative |
|---|---|---|
| `sales.gross_profit` | Gross Profit | **Gross Loss** |
| `finance.net_profit` | Net Profit | **Net Loss** |
| `finance.net_cash_flow` | Net Cash Inflow | **Net Cash Outflow** |
| `tax.net_payable` | Tax Payable | **Tax Refundable** |
| `inventory.movement_net` | Net Stock Gain | Net Stock Reduction |
| `finance.trial_balance_diff` | Out of Balance (Dr) | Out of Balance (Cr) |
| `sales.by_party_flow` net | Net Receivable | Net Payable |

"Gross Loss" is correct accounting terminology — it is the standard name for a negative gross profit in a trading account. Use it.

### 7.17 Expenses — group by account id, not name
Group by `accounts.id`, display `accounts.name`. **Change:** `Reports/ExpenseByCategory` grouping by name — a category rename currently splits its own history in two.

### 7.18 The Expenses metric excludes COGS
`getProfitAndLoss().total_expenses` includes COGS. `finance.expenses_total` is **operating expenses only** (`total_expenses − cogs`), which `WidgetDataService::widgetExpenses()` already does correctly. Keep it, and say so in the `help` text — otherwise a busy month reads as overspending.

### 7.19 Balance-sheet discrepancy is a status, not a number
Your IDE found `finance.balance_sheet_discrepancy`. Register it as `finance.balance_sheet_ok` with shape `STATUS`: `balanced` / `out_of_balance` with the amount as detail. A discrepancy is a *condition requiring action*, not a KPI to trend — presenting it as a number invites someone to watch it drift.

---

## 8. Platform metrics are unreachable from a store

**Your decision, and it is enforced structurally rather than by convention.**

1. Every definition carries `'scope' => 'tenant' | 'platform'`.
2. `PlatformSource` is bound only in the SuperAdmin service container context.
3. `Reckoner` step 2 returns **`not_found`** — not `forbidden` — for a `platform` metric requested in a tenant context. A store user must not be able to learn that `platform.mrr` exists.
4. `/api/reckoner/catalogue` filters by scope before serialising; the platform catalogue is served from a separate SuperAdmin route.
5. A store user probing `platform.*` is logged as a security event.
6. **Test:** `PlatformScopeTest` iterates every `platform`-scoped key, requests each as a store Owner, and asserts `not_found` plus zero queries executed.

---

## 9. Build phases

Ship each phase before starting the next. Every phase leaves the app working.

### Phase 1 — Skeleton and parity
**Build:** `ReckonerPeriod`, `ReckonerShape`, `ReckonerResult`, `ReckonerRegistry` (populated only with the ~20 keys that mirror today's `WidgetRegistry`), `Reckoner` with all six gates, `ReckonerSettings`, and `FinanceSource` + `SalesSource` wrapping `FinancialReportingService`.

**Accept:**
- Every existing `WidgetDataService` widget returns byte-identical data through the Core on the golden dataset.
- All 18 period keys unit-tested, including tenant timezone, DST and leap-day edges.
- `grep` for date construction under `app/Reckoner/` hits only `ReckonerPeriod.php`.
- A gate-failing metric executes **zero** queries (query-count spy).
- Nothing in the UI has changed.

### Phase 2 — Catalogue and controller migration
**Build:** the remaining nine sources. Move every computation from §5.1 into them. Controllers become callers.

**Accept:**
- **Before any code moves,** snapshot every report page's figures on the golden dataset. That snapshot is the acceptance gate.
- Every registry key resolves without error, for every period in its list, on the golden dataset.
- CI grep: no aggregate feeding a displayed number remains in `app/Http/Controllers/`.
- CI grep: no arithmetic remains in `resources/js/Pages/Reports/` or `Dashboards/`.
- POS cart pricing extracted to `cartPricing.js` with a PHP mirror and an agreement test.

### Phase 3 — Canonicalisation
**Build:** every decision in §7. **Delete the losing implementations.** This is the phase that changes numbers on screen.

**Accept — `ReckonerConsistencyTest` asserts all of these simultaneously on the golden dataset:**
- Inventory value identical on dashboard, stock levels page and valuation report.
- A 60-day invoice sits in `31–60` on every ageing surface.
- `getAgedReceivables()` total reconciles to GL 1200 within PKR 0.01.
- `low_stock_count + out_of_stock_count` = the old combined count.
- Exactly one MRR figure exists.
- `getGrossProfitByProduct()` column total reconciles to GL revenue within rounding.
- `production.total_cost` returns a real figure or `not_applicable` — never `0`.
- Every `signed` metric renders its loss-side label when negative.
- No method returns the same value under two names.

**Ship with:** a changelog entry per decision, and a one-release in-app note on affected reports explaining which number changed and why. Users have been reading some of these figures for months; a silent change is worse than a wrong number.

### Phase 4 — Settings and labels
**Build:** the eight settings in §6 with their screens; `ReckonerLabels` with the business-type map; wire business type into the catalogue endpoint.

**Accept:**
- Overstock defaults to `off` and produces `not_applicable` — no card, no nag.
- `auto` mode returns `not_applicable` for products with no sales history.
- The hardcoded `quantity > 200` is deleted from the codebase.
- Dormancy defaults by business type and is overridable.
- Heavy-discount threshold is read from settings; the help text names the current value.
- Changing business type relabels every metric without touching stored data.
- Every metric has a `generic` label; no surface can render a raw key.
- Every metric with a yearly period states the calendar-year rule in its `help`.

### Phase 5 — API surface
**Build:** two endpoints only.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/reckoner/catalogue` | Readings available to this user/plan/business, scope-filtered, with resolved labels |
| `POST` | `/api/reckoner/read` | Batch read, max 24 |

Run `php artisan ziggy:generate`.

**Accept:** every error code reachable and tested; the 24-cap enforced; `PlatformScopeTest` green; a store Owner requesting any `platform.*` key gets `not_found` and zero queries.

**At the end of Phase 5 the Reckoner is complete and Part 2 can begin.**

### Phase 6 — Warming (only if measurement says so)
**Do not build this speculatively.** Build it only if `ReckonerPerformanceTest` shows a real dashboard exceeding its budget on a realistic tenant.

**Build:** a `reckoner_snapshots` table (tenant, metric key, period key, payload JSON, computed_at, sealed_at) and a nightly `php artisan reckoner:warm` command that precomputes **closed historical periods only** — `last_month`, `last_quarter`, `last_year`, and any `custom` window whose end date has passed.

A snapshot is *sealed*: it is served without recomputation until a write event touches a date inside its window, at which point the snapshot is dropped and the reading recomputes live. Open periods (`today`, `this_month`, anything `live`) are **never** snapshotted — they change constantly and a stale "today" figure is worse than a slow one.

**Accept:**
- A sealed snapshot is invalidated by a back-dated journal entry inside its window (test it explicitly — back-dating is the whole reason sealing is risky).
- `reckoner:warm` is idempotent and safe to run twice.
- Turning warming off entirely changes no number, only response time. If it changes a number, sealing is wrong.

---

## 10. Tests

| Test | Asserts |
|---|---|
| `ReckonerRegistryTest` | Every definition has every field; every `source::method` exists; no duplicate keys; every metric has a `generic` label and a `help` string |
| `ReckonerPeriodTest` | All 18 periods; tenant timezone; calendar-year quarters and years; comparison windows; DST and leap-day edges |
| `ReckonerGateTest` | Each gate blocks independently; blocked metrics run zero queries |
| `PlatformScopeTest` | Every platform key is `not_found` for every tenant role, with zero queries |
| `ReckonerParityTest` | Core output == pre-migration output, per metric, on the golden dataset |
| `ReckonerConsistencyTest` | Every §7 decision holds simultaneously |
| `ReckonerSettingsTest` | Each setting changes its metric's result; overstock `off` yields `not_applicable`; dormancy defaults per business type |
| `ReckonerPerformanceTest` | 24 metrics resolve < 2 s warm, < 6 s cold; no full table scans |
| `CartPricingParityTest` | JS and PHP cart pricing agree on every fixture |
| `NoOrphanMathTest` | CI greps: no aggregates in controllers, no arithmetic in report/dashboard React files |

Golden dataset: existing `tests/tests/Feature/Golden/` fixtures. Tests run on `amd_pos_test` — **MariaDB, never SQLite**, per `CLAUDE.md`.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Moving ~200 computations regresses report pages | Snapshot every report figure **before** Phase 2; the snapshot is the gate |
| Phase 3 changes numbers users have trusted for months | Changelog per decision + one release of in-app notes on affected reports |
| A 24-metric batch hammers the database | Source batching, per-metric TTL, prefix invalidation, 24-cap, 6-second budget — all tested |
| 250 registry keys becomes unmaintainable | One file per domain; `ReckonerRegistryTest` fails the build on a malformed definition; keys are immutable so nothing churns |
| Someone adds a calculation to a controller in six months | `NoOrphanMathTest` in CI. This is the only defence that survives contact with future contributors |
| The Core becomes a second `FinancialReportingService` | Code review rule: a source that contains a financial formula instead of a call to the existing engine is rejected. The Core dispatches; it does not compute |

---

## 12. What "done" looks like

When this document is complete:

- Every number in VenQore has **one** definition, in **one** file, with **one** name, behind **one** front door: `Reckoner::read()`.
- The dashboard and the P&L cannot disagree, because they ask the same Reckoner.
- A store user cannot see a platform metric, and cannot learn one exists.
- The owner controls every threshold that is a matter of opinion — overstock, dormancy, heavy discount — and nothing is locked to a number you chose for them.
- Yearly figures run on the calendar year, and the tooltip says so.
- A metric that cannot be computed says so, instead of showing zero.
- Adding a new number anywhere in the product means adding one registry entry — and it is instantly available to every screen, the mobile app, and the Windows app.

**And the card builder becomes almost trivial**, because a card is then nothing more than three answers: which reading, which period, which chart.

---

## 13. The sentence to hold onto

> **Nothing in VenQore calculates a number for display. Everything asks the Reckoner.**

If a future change makes that sentence untrue, the change is wrong — regardless of how convenient it looked at the time. `NoOrphanMathTest` exists to say so in CI, on a Tuesday afternoon, to a developer who has never read this document.

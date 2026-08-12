# VenQore — Metric Core & Composable Card Builder

**Master build specification (IDE-executable)**
Version 1.0 · 2026-08-11
Repo root: `E:\AMD POS\AMD POS` · App root: `app-code/main-app`

---

## 0. How to use this document

This is a single, self-contained build spec. It is written to be executed top to bottom by an IDE agent. Every phase has explicit file paths, code contracts and acceptance criteria.

**Read these before starting:**

| File | Why |
|---|---|
| `CLAUDE.md` | Repo rules — MariaDB 10.5 only, tenant scoping, thin controllers, Ziggy regeneration |
| `app/Services/Dashboard/WidgetRegistry.php` | The v1 configurable dashboard already in the codebase — this spec **evolves** it, does not replace it |
| `app/Services/Dashboard/WidgetDataService.php` | The v1 resolver — becomes the new engine's first set of adapters |
| `app/Services/FinancialReportingService.php` | The existing read engine. **It stays the source of truth for everything financial.** |

**Non-negotiable rules for this build:**

1. **No metric may be computed in a controller, in a React component, or in a Blade/Inertia prop assembly.** Every number has exactly one definition, in the Metric Core.
2. **No new financial formula.** If `FinancialReportingService` already computes it, the Core calls it. The Core is a *registry and dispatcher*, not a second calculator.
3. **A card renders. It does not calculate.** A card receives a resolved envelope and picks a chart. If a card component contains arithmetic beyond formatting, it is a bug.
4. **Every metric is gated three ways before it is ever resolved** — permission, plan feature, business capability — server-side, exactly as `WidgetRegistry` already does.
5. **MariaDB 10.5.** No `SKIP LOCKED`, no `JSON_TABLE`, no `utf8mb4_0900_*` collations.

---

## 1. Where we are and what is wrong

### 1.1 What already exists

The codebase already has a first-generation configurable dashboard:

- `App\Services\Dashboard\WidgetRegistry` — 20 widgets in 5 categories, with `permissions` / `feature` / `capability` gating, size presets on a 12-column grid, default layout generation and layout sanitisation. This design is sound and this spec keeps all of it.
- `App\Services\Dashboard\WidgetDataService` — resolves widget ids to data by delegating to `FinancialReportingService`. Its docblock already states the correct rule ("It computes nothing").

### 1.2 The five gaps this build closes

| # | Gap | Consequence today |
|---|---|---|
| **G1** | **Periods are hardcoded inside each resolver.** `widgetNetProfit()` is always "this month". `widgetRevenueToday()` is always today vs yesterday. | The user cannot ask for the same metric over a different window. "Revenue" is 5 different cards in the master matrix instead of 1 metric × 5 periods. |
| **G2** | **The registry covers ~20 of ~180 metrics the app actually displays.** The other ~160 are computed ad hoc in `ReportController`, `InventoryController`, `SuperAdminController`, and inside React pages. | The card picker can only offer 20 things. Report pages and the dashboard drift apart. |
| **G3** | **Same concept, multiple formulas.** Inventory value has two (FIFO vs `qty × cost_price`). Ageing has three bucket schemes. Receivables has three. MRR has two. Max Sale has two. (Full list: §4.) | Two pages in the same product show different numbers for the same word. This is the single most damaging class of bug in an ERP. |
| **G4** | **No chart choice.** Each widget has one hardcoded rendering. | The user cannot express the same data as a pie, a ring, a funnel or a heatmap. |
| **G5** | **One label per metric, no vertical awareness.** "Gross Profit" is shown to a restaurant, a pharmacy and a workshop alike; and it is wrong when the figure is negative — there is no "Gross Loss" state. | The product reads as generic. Terminology mismatch is the top reason SMB users distrust an ERP. |

### 1.3 What we build

```
┌──────────────────────────────────────────────────────────────┐
│  METRIC CORE  (app/Services/Metrics/)                        │
│                                                              │
│   MetricRegistry ── definitions: key, shape, periods,        │
│                     gates, formats, allowed charts, labels   │
│   MetricResolver ── dispatches a (key, period, args) request  │
│   MetricPeriod   ── the ONE period vocabulary                 │
│   Providers/     ── thin adapters onto existing engines       │
│                     (they call FinancialReportingService,     │
│                      never re-implement it)                   │
│   MetricCache    ── per-tenant, per-key, per-period           │
└────────────────────────┬─────────────────────────────────────┘
                         │  POST /api/metrics/resolve  (batch)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  CARD LAYER  (resources/js/Dashboard/)                       │
│                                                              │
│   CardBuilder    ── pick metric → pick period → pick chart    │
│   ChartRegistry  ── 16 bklit chart types, shape-compatible    │
│   MetricCard     ── envelope in, chart out. Zero arithmetic.  │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. The Metric Core

### 2.1 Directory

```
app/Services/Metrics/
  MetricRegistry.php          — the catalogue (definitions only, no queries)
  MetricResolver.php          — the dispatcher + gate enforcement + cache
  MetricPeriod.php            — period vocabulary → [start, end] + comparison window
  MetricEnvelope.php          — the response value object
  MetricShape.php             — shape enum + chart compatibility
  MetricLabels.php            — vertical-aware display names
  Providers/
    SalesMetricProvider.php
    FinanceMetricProvider.php
    InventoryMetricProvider.php
    PurchasingMetricProvider.php
    PartyMetricProvider.php
    StaffMetricProvider.php
    OperationsMetricProvider.php     (restaurant, production, sync, FBR)
    PlatformMetricProvider.php       (SuperAdmin / SaaS)
```

### 2.2 A metric definition

`MetricRegistry::all()` returns an array keyed by metric key. Every entry uses **exactly** this schema — no optional-by-convention fields, absent means the documented default.

```php
'sales.revenue' => [
    // ── identity ──────────────────────────────────────────────
    'key'          => 'sales.revenue',       // domain.name, snake_case, immutable forever
    'domain'       => 'sales',
    'label'        => 'Revenue',             // canonical, vertical-neutral
    'description'  => 'Money earned from posted sales, net of returns and tax.',
    'help'         => 'Counts a sale on the date it was posted. Excludes tax and excludes anything reversed.',

    // ── value shape ───────────────────────────────────────────
    'shape'        => MetricShape::SCALAR,   // see §2.4
    'unit'         => 'currency',            // currency | integer | decimal | percent | duration | text | boolean
    'precision'    => 2,
    'direction'    => 'higher_is_better',    // higher_is_better | lower_is_better | neutral
    'signed'       => true,                  // may legitimately go negative → dual-label (Profit/Loss)

    // ── time ──────────────────────────────────────────────────
    'periods'      => ['today','yesterday','this_week','last_week','this_month','last_month',
                       'this_quarter','this_year','last_year','last_7_days','last_30_days',
                       'last_90_days','last_12_months','all_time','custom'],
    'default_period' => 'today',
    'supports_comparison' => true,           // engine also returns the previous equivalent window
    'supports_series'     => true,           // engine can return a time series at a granularity
    'series_granularity'  => ['hourly','daily','weekly','monthly','quarterly','yearly'],

    // ── how it may be drawn ───────────────────────────────────
    'charts'       => ['stat','sparkline','line','area','bar','composed','gauge','profit_loss_line'],
    'default_chart'=> 'stat',

    // ── gates (identical semantics to WidgetRegistry) ─────────
    'permissions'  => ['sales.view','reports.summary','reports.financial'],  // ANY-of
    'feature'      => null,                  // plan entitlement key, or null
    'capability'   => null,                  // has_inventory | has_parties | has_purchases |
                                             // has_sales_orders | has_manufacturing | has_staff |
                                             // has_restaurant | has_ecommerce | has_fbr | has_bank_accounts

    // ── resolution ────────────────────────────────────────────
    'provider'     => SalesMetricProvider::class,
    'method'       => 'revenue',
    'cache_ttl'    => 60,                    // seconds; 0 = never cache (live feeds)

    // ── drill-through ─────────────────────────────────────────
    'drill_route'  => 'reports.sales',       // Ziggy route name, or null
],
```

**Rule:** `key` is a permanent public identifier. It appears in saved user layouts and in the API. **Never rename a key.** To rename what the user sees, change `label` / `MetricLabels`. To retire a metric, add `'deprecated' => 'replacement.key'` and let `sanitizeLayout()` migrate it.

### 2.3 The period vocabulary

`MetricPeriod` is the only place a date window is ever constructed. It resolves in the **tenant's timezone** (as `WidgetDataService::now()` already does) and against the tenant's **fiscal year start** where the period is fiscal.

| Period key | Window | Comparison window |
|---|---|---|
| `today` | 00:00 → 23:59:59 today | yesterday |
| `yesterday` | previous calendar day | day before |
| `this_week` | week start → now | same span last week |
| `last_week` | previous full week | week before |
| `this_month` | month start → month end | same span last month |
| `last_month` | previous full calendar month | month before |
| `this_quarter` | fiscal quarter to date | same quarter last year |
| `last_quarter` | previous full fiscal quarter | quarter before |
| `this_year` | fiscal year start → now | same span last fiscal year |
| `last_year` | previous full fiscal year | year before |
| `last_7_days` | rolling 7×24h ending now | preceding 7 days |
| `last_30_days` | rolling 30 days | preceding 30 days |
| `last_90_days` | rolling 90 days | preceding 90 days |
| `last_12_months` | rolling 12 calendar months | preceding 12 months |
| `all_time` | `1900-01-01` → now | none |
| `custom` | caller-supplied `from` / `to` | equal-length preceding window |
| `as_of` | point-in-time (balance-sheet metrics only) | none |

```php
final class MetricPeriod
{
    public function __construct(
        public readonly string $key,
        public readonly CarbonImmutable $start,
        public readonly CarbonImmutable $end,
        public readonly ?CarbonImmutable $compareStart,
        public readonly ?CarbonImmutable $compareEnd,
        public readonly string $label,          // "August 2026", "Last 30 days"
        public readonly string $compareLabel,   // "vs July", "vs previous 30 days"
    ) {}

    public static function resolve(string $key, ?array $custom, Tenant $tenant): self;
    public static function all(): array;        // for the period dropdown in the builder
}
```

**Acceptance:** a `grep` for `startOfMonth\|subDays\|whereDate\|whereBetween` under `app/Services/Metrics/` returns hits only inside `MetricPeriod.php`.

### 2.4 Value shapes

The shape determines which charts are legal. This is the mechanism that makes "any metric × any chart" safe.

| Shape | Payload | Charts allowed |
|---|---|---|
| `SCALAR` | `{ value, previous?, change_pct?, label }` | `stat`, `sparkline`, `gauge`, `ring` |
| `SERIES` | `{ series: [{ x, y }, …], granularity }` | `line`, `area`, `bar`, `live_line`, `profit_loss_line`, `composed`, `sparkline`, `scatter`, `heatmap` |
| `MULTI_SERIES` | `{ series: [{ name, points: [{x,y}] }, …] }` | `line`, `area`, `bar`, `composed`, `radar`, `scatter`, `sankey` |
| `BREAKDOWN` | `{ slices: [{ name, value, pct }], total }` | `pie`, `ring`, `sunburst`, `bar`, `funnel`, `radar`, `heatmap`, `stat` (total only) |
| `TABLE` | `{ columns: [...], rows: [...], total? }` | `table`, `bar` (first numeric column), `heatmap` |
| `RANKING` | `{ rows: [{ rank, name, value, meta }] }` | `table`, `bar`, `funnel`, `pie` |
| `FUNNEL` | `{ stages: [{ name, value }] }` | `funnel`, `bar`, `sankey` |
| `GAUGE` | `{ value, min, max, target?, bands: [...] }` | `gauge`, `ring`, `stat` |
| `STATUS` | `{ state, label, detail?, severity }` | `status`, `stat` |
| `FEED` | `{ items: [...] }` | `feed`, `table` |
| `GEO` | `{ regions: [{ code, value }] }` | `choropleth`, `table` |

`MetricShape::chartsFor(shape)` is the single authority. The card builder calls it; the resolve endpoint validates against it. A request pairing an illegal chart with a metric returns `422`, it does not silently fall back.

### 2.5 The envelope

Every resolved metric returns this exact structure. The React layer knows only this.

```json
{
  "key": "sales.revenue",
  "ok": true,
  "shape": "scalar",
  "unit": "currency",
  "precision": 2,
  "currency": "PKR",
  "period": { "key": "this_month", "label": "August 2026",
              "from": "2026-08-01", "to": "2026-08-31",
              "compare_label": "vs July" },
  "label": "Revenue",
  "sublabel": null,
  "direction": "higher_is_better",
  "data": { "value": 1284300.00, "previous": 1102450.00, "change_pct": 16.5 },
  "meta": { "cached": true, "computed_at": "2026-08-11T09:14:02+05:00", "stale_after": 60 },
  "drill": { "route": "reports.sales", "params": { "from": "2026-08-01", "to": "2026-08-31" } }
}
```

On failure:

```json
{ "key": "sales.revenue", "ok": false,
  "error": { "code": "resolver_failed", "message": "This card could not be loaded." } }
```

Error codes: `not_found`, `forbidden`, `plan_locked`, `not_applicable` (capability gate), `invalid_period`, `invalid_chart`, `resolver_failed`, `timeout`.

**One failing metric never breaks the batch** — keep `WidgetDataService`'s per-widget try/catch behaviour.

### 2.6 The resolver

```php
class MetricResolver
{
    /** @param MetricRequest[] $requests */
    public function resolveMany(array $requests, User $user, Tenant $tenant): array;
    public function resolveOne(MetricRequest $request, User $user, Tenant $tenant): MetricEnvelope;
}

final class MetricRequest
{
    public string  $key;
    public string  $period      = 'today';
    public ?array  $custom      = null;   // ['from' => ..., 'to' => ...]
    public ?string $granularity = null;   // for SERIES shapes
    public array   $args        = [];     // whitelisted per metric (e.g. warehouse_id, category_id)
    public ?string $chart       = null;   // validated against MetricShape::chartsFor()
}
```

Resolution order — **all six steps, in this order, every time**:

1. **Exists** — key is in the registry, else `not_found`.
2. **Permission** — ANY-of match via `$user->hasPermission()`, else `forbidden`.
3. **Plan feature** — via `PlanRepository::featuresFor($tenant)`, else `plan_locked`.
4. **Capability** — via the cached capability probe, else `not_applicable`.
5. **Period + args validation** — period in the metric's list, args whitelisted, chart legal.
6. **Cache lookup → provider call → envelope.**

Cache key: `vq_metric:{tenant_id}:{key}:{period_key}:{granularity}:{md5(args)}`. TTL from the definition. Flush on write via a `MetricCacheInvalidator` listener bound to the existing domain events (sale posted, purchase posted, journal entry created, stock movement, expense saved) — invalidate by **domain prefix**, not one key at a time.

**Batching:** `resolveMany` groups requests by provider before dispatch so a provider can satisfy several metrics from one query pass (e.g. `FinanceMetricProvider` reads the P&L once and answers `revenue`, `cogs`, `gross_profit`, `net_profit`, `margin_pct` from it). Providers implement:

```php
interface MetricProvider {
    public function supports(): array;                                   // metric keys
    public function resolveBatch(array $requests, Context $ctx): array;   // key => payload array
}
```

### 2.7 Concurrency and cost guards

- Hard cap **24 metrics per resolve request**; excess returns `422`.
- Hard cap **40 cards per saved dashboard**.
- Per-request wall-clock budget of **6 seconds**; any provider still running is returned as `timeout` and the rest of the batch still renders.
- Every provider query must be tenant-scoped and must hit an index. `all_time` on a SERIES metric is capped at 60 buckets — beyond that, downsample.

---

## 3. The metric catalogue

Legend for **Shape**: `S` scalar · `Se` series · `MS` multi-series · `B` breakdown · `T` table · `R` ranking · `F` funnel · `G` gauge · `St` status · `Fd` feed · `Geo` geo.

Legend for **Roles**: `O` Owner · `A` Admin · `M` Manager · `Ac` Accountant · `P` Purchasing · `C` Cashier · `V` Viewer · `PA` Platform Admin.

`•` in **Periods** = full period vocabulary. `pit` = point-in-time (`as_of` only, no period). `live` = no period, always current.

### 3.1 Sales

| Key | Label | Shape | Unit | Periods | Roles | Source |
|---|---|---|---|---|---|---|
| `sales.revenue` | Revenue | S | currency | • | O A M Ac V | `FRS::getProfitAndLoss().revenue` |
| `sales.revenue_trend` | Revenue Trend | Se | currency | • | O A M Ac V | `FRS::getProfitByPeriod()` |
| `sales.order_count` | Orders | S | integer | • | O A M Ac V | `sales` count, `status='posted'` |
| `sales.items_sold` | Items Sold | S | decimal | • | O A M Ac V | `sale_items` qty sum |
| `sales.avg_ticket` | Average Sale Value | S | currency | • | O A M Ac | revenue ÷ order count |
| `sales.avg_ticket_profit` | Average Profit per Sale | S | currency | • | O A M | gross profit ÷ order count |
| `sales.largest_sale` | Largest Sale | S | currency | • | O A M | `MAX(sales.net_sales)` — **canonical: ex-tax** (§4.4) |
| `sales.gross_profit` | Gross Profit / **Gross Loss** | S | currency | • | O A M | revenue − COGS |
| `sales.gross_margin_pct` | Gross Margin | S/G | percent | • | O A M | gross profit ÷ revenue |
| `sales.cogs` | Cost of Goods Sold | S | currency | • | O A M Ac | `FRS::getCogsReport()` |
| `sales.cogs_reconciled` | COGS Ledger Agreement | St | boolean | • | O A Ac | `getCogsReport().reconciled` vs GL 5000 |
| `sales.tax_collected` | Tax Collected | S | currency | • | O A Ac | `sales.total_tax` |
| `sales.discount_total` | Discounts Given | S | currency | • | O A M | `global_discount + total_item_discounts` |
| `sales.discount_bill_count` | Discounted Bills | S | integer | • | O A M | `sales` where discount > 0 |
| `sales.discount_avg_per_bill` | Average Discount per Bill | S | currency | • | O A M | derived, Core-owned |
| `sales.discount_heavy_count` | Heavy Discounts | S | integer | • | O A M | discount % > tenant threshold |
| `sales.discount_by_item` | Discount by Product | R | currency | • | O A M | `sale_items` |
| `sales.unpaid_count` | Unpaid Invoices | S | integer | • | O A Ac | residual balance > 0 |
| `sales.unpaid_value` | Unpaid Invoice Value | S | currency | • | O A Ac | residual balance sum |
| `sales.overpaid_value` | Overpayments Held | S | currency | • | O A Ac | allocations > invoice total |
| `sales.payment_breakdown` | Payment Methods | B | currency | • | O A M Ac | `sales` grouped by `payment_method` |
| `sales.hourly_heatmap` | Sales by Hour & Day | T/Se | currency | • | O A M | `sales.created_at` bucketed |
| `sales.top_products` | Top Products | R | currency | • | O A M Ac | `FRS::getGrossProfitByProduct()` |
| `sales.top_categories` | Top Categories | R/B | currency | • | O A M | `FRS::getGrossProfitByCategory()` |
| `sales.top_customers` | Top Customers | R | currency | • | O A M Ac | `FRS::getGrossProfitByParty()` |
| `sales.profit_by_product` | Profit by Product | T | currency | • | O A M | `FRS::getGrossProfitByProduct()` |
| `sales.profit_by_category` | Profit by Category | T/B | currency | • | O A M | `FRS::getGrossProfitByCategory()` |
| `sales.profit_by_customer` | Profit by Customer | T | currency | • | O A M | `FRS::getGrossProfitByParty()` |
| `sales.profit_by_invoice` | Profit by Invoice | T | currency | • | O A M | `FRS::getGrossProfitBySale()` |
| `sales.live_feed` | Live Sales | Fd | — | live | O A M Ac C | `sales` latest 10 |
| `sales.parked_count` | Held Bills | S | integer | live | O A M C | `sales` where `status='parked'` |
| `sales.parked_value` | Held Bills Value | S | currency | live | O A M C | as above |
| `sales.returns_count` | Returns | S | integer | • | O A M Ac | `sale_returns` |
| `sales.returns_value` | Refunded | S | currency | • | O A M Ac | `sale_returns` |
| `sales.returns_items` | Items Returned | S | decimal | • | O A M | `sale_return_items` |
| `sales.return_rate_pct` | Return Rate | S/G | percent | • | O A M | returns value ÷ revenue |
| `sales.orders_open` | Open Orders | S | integer | live | O A M | `sales_orders` where `status='open'` |
| `sales.orders_pipeline` | Order Pipeline | F/B | integer | • | O A M | `sales_orders` by status |
| `sales.orders_value` | Order Value | S | currency | • | O A M | `sales_orders.total_amount` |
| `sales.order_items_summary` | Order Line Summary | T | mixed | • | O A M | `sales_order_items` |
| `sales.presale_quotes` | Pre-Sale Quotes | S | integer | • | O A M Ac | `sales_orders` / quotations |
| `sales.presale_value` | Quote Value | S | currency | • | O A M Ac | as above |
| `sales.proposals_total` | Proposals | S | integer | • | O A M Ac | `invoices` where `type='proposal'` |
| `sales.proposals_accepted` | Accepted Proposals | S | integer | • | O A M Ac | `status='accepted'` |
| `sales.proposals_pending` | Pending Proposals | S | integer | • | O A M Ac | `status='pending'` |
| `sales.proposals_pipeline` | Proposal Pipeline | F | currency | • | O A M Ac | proposals by status |
| `sales.proposals_value` | Proposal Value | S | currency | • | O A M Ac | `SUM(total_amount)` |
| `sales.proposal_win_rate` | Proposal Win Rate | S/G | percent | • | O A M | accepted ÷ (accepted + rejected) |
| `sales.by_staff` | Sales by Staff | R | currency | • | O A M | `FRS::getNetRevenueByUser()` — **canonical** (§4.7) |
| `sales.staff_transactions` | Transactions by Staff | R | integer | • | O A M | `sales` grouped by user |
| `sales.top_performer` | Top Performer | S/St | text | • | O A M | first row of `sales.by_staff` |
| `sales.by_party_flow` | Sales vs Purchases by Party | T | currency | • | O A M Ac | `ReportController::salePurchaseByParty` → Core |
| `sales.by_item_category_flow` | Sales vs Purchases by Category | T | currency | • | O A M | `salePurchaseByItemCategory` → Core |
| `sales.item_report_by_party` | Products per Customer | T | mixed | • | O A M | `itemReportByParty` → Core |
| `sales.party_report_by_item` | Customers per Product | T | mixed | • | O A M | `partyReportByItem` → Core |

### 3.2 Finance & Accounting

| Key | Label | Shape | Unit | Periods | Roles | Source |
|---|---|---|---|---|---|---|
| `finance.net_profit` | Net Profit / **Net Loss** | S | currency | • | O A M Ac V | `FRS::getProfitAndLoss().net_profit` |
| `finance.net_margin_pct` | Net Margin | S/G | percent | • | O A M Ac | net profit ÷ revenue |
| `finance.profit_trend` | Profit Trend | Se | currency | • | O A M Ac | `FRS::getProfitByPeriod()` |
| `finance.pl_waterfall` | Profit Breakdown | B/F | currency | • | O A Ac | revenue → COGS → expenses → net |
| `finance.expenses_total` | Expenses | S | currency | • | O A Ac | operating expenses (excl. COGS) |
| `finance.expenses_by_category` | Expenses by Category | B | currency | • | O A M Ac | `journal_items` by expense account |
| `finance.expenses_by_item` | Expense Detail | T | currency | • | O A Ac | `ReportController::expenseByItem` → Core |
| `finance.expense_avg_daily` | Average Daily Spend | S | currency | • | O A Ac | expenses ÷ days in period |
| `finance.expense_top_category` | Largest Expense Category | S/St | text | • | O A Ac | top slice of breakdown |
| `finance.receivables` | To Receive | S | currency | pit | O A Ac | GL `1200` — **canonical** (§4.3) |
| `finance.payables` | To Pay | S | currency | pit | O A Ac P | GL `2000` — **canonical** (§4.3) |
| `finance.receivables_aging` | Receivables Ageing | B | currency | pit | O A Ac | `FRS::getAgedReceivables()` |
| `finance.payables_aging` | Payables Ageing | B | currency | pit | O A Ac P | `FRS::getAgedPayables()` |
| `finance.receivables_critical` | Overdue 60+ Days | S | currency | pit | O A Ac | ageing buckets 61-90 + 90+ |
| `finance.receivables_fresh` | Owed Under 30 Days | S | currency | pit | O A Ac | bucket 0-30 |
| `finance.active_debtors` | Customers Who Owe You | S | integer | pit | O A Ac | parties with AR > 0 |
| `finance.debtor_avg_balance` | Average Amount Owed | S | currency | pit | O A Ac | AR ÷ active debtors |
| `finance.debtor_max_balance` | Largest Amount Owed | S | currency | pit | O A Ac | `MAX` party AR |
| `finance.cash_in_hand` | Cash in Hand | S | currency | pit | O A Ac | GL `1000` |
| `finance.bank_balance` | Bank Balance | S | currency | pit | O A Ac | `Account::v3Balance()` per bank account |
| `finance.bank_balances_split` | Balance by Account | B | currency | pit | O A Ac | per `bank_accounts.id` |
| `finance.total_liquidity` | Money Available | S | currency | pit | O A Ac | cash + bank |
| `finance.net_cash_position` | Net Cash Position | S | currency | pit | O A Ac | liquidity − short-term obligations |
| `finance.money_in` | Money In | S | currency | • | O A Ac | payments received |
| `finance.money_out` | Money Out | S | currency | • | O A Ac | payments made |
| `finance.net_cash_flow` | Net Cash Flow | S | currency | • | O A Ac | `FRS::getCashFlowReport()` — **canonical** (§4.9) |
| `finance.cash_flow_trend` | Cash Flow Trend | MS | currency | • | O A Ac | in vs out per bucket |
| `finance.cash_flow_classified` | Operating / Investing / Financing | B | currency | • | O A Ac | `FRS::getDetailedCashFlow()` |
| `finance.day_book` | Day Book | T | currency | • | O A Ac | `ReportController::dayBook` → Core |
| `finance.total_assets` | Total Assets | S | currency | pit | O A Ac | `FRS::getBalanceSheet().assets` |
| `finance.total_liabilities` | Total Liabilities | S | currency | pit | O A Ac | `getBalanceSheet().liabilities` |
| `finance.total_equity` | Owner's Equity | S | currency | pit | O A Ac | `getBalanceSheet().equity` |
| `finance.retained_earnings` | Retained Earnings | S | currency | pit | O A Ac | `getBalanceSheet()` |
| `finance.balance_sheet_ok` | Books Balanced | St | boolean | pit | O A Ac | `is_balanced` flag |
| `finance.trial_balance_diff` | Trial Balance Difference | S/St | currency | pit | O A Ac | `grand_debit − grand_credit` |
| `finance.trial_balance` | Trial Balance | T | currency | pit | O A Ac | `FRS::getTrialBalance()` |
| `finance.account_ledger` | Account Ledger | T | currency | • | O A Ac | `FRS::getAccountLedger()` |
| `finance.party_ledger` | Party Ledger | T | currency | • | O A Ac | `FRS::getPartyLedger()` |
| `finance.journal_debits` | Total Debits | S | currency | • | O A Ac | `journal_items` |
| `finance.journal_credits` | Total Credits | S | currency | • | O A Ac | `journal_items` |
| `finance.recon_matched` | Reconciled Entries | S | integer | • | O A Ac | `bank_reconciliations` |
| `finance.recon_unmatched` | Unreconciled Entries | S | integer | • | O A Ac | `bank_reconciliations` |
| `finance.recon_difference` | Reconciliation Difference | S/St | currency | • | O A Ac | variance |
| `finance.debit_notes_count` | Debit Notes | S | integer | • | O A Ac P | `debit_notes` |
| `finance.debit_notes_value` | Debit Note Value | S | currency | • | O A Ac P | `debit_notes` |
| `finance.credit_notes_count` | Credit Notes | S | integer | • | O A Ac | `credit_notes` |
| `finance.credit_notes_value` | Credit Note Value | S | currency | • | O A Ac | `credit_notes` |
| `finance.loan_balance` | Loan Balance | S | currency | pit | O A Ac | `V3\LoanController` → Core |
| `finance.payroll_gross` | Payroll Gross | S | currency | • | O A Ac | `V3\PayrollController` |
| `finance.payroll_net_paid` | Payroll Paid | S | currency | • | O A Ac | GL 2400 / 1350 |
| `finance.payroll_advances` | Staff Advances Outstanding | S | currency | pit | O A Ac | GL 1350 |
| `finance.bad_debt` | Bad Debt Written Off | S | currency | • | O A Ac | `V3\BadDebtController` |
| `finance.cash_shortage` | Cash Shortage | S | currency | • | O A Ac | `V3\CashShortageController` |
| `finance.depreciation` | Depreciation | S | currency | • | O A Ac | `V3\DepreciationController` |
| `finance.donations` | Donations | S | currency | • | O A Ac | `V3\DonationController` |
| `finance.recurring_active` | Active Recurring Invoices | S | integer | live | O A Ac | `recurring_invoices` |
| `finance.recurring_mrr` | Recurring Revenue | S | currency | • | O A Ac | `recurring_invoices` |
| `finance.reminders_pipeline` | Payment Reminders | B | integer | live | O A Ac | `invoice_reminders` by status |

### 3.3 Tax & Compliance

| Key | Label | Shape | Unit | Periods | Roles | Source |
|---|---|---|---|---|---|---|
| `tax.output_tax` | Output Tax | S | currency | • | O A Ac | `FRS::getTaxSummary()` GL 2100 |
| `tax.input_tax` | Input Tax | S | currency | • | O A Ac | `getTaxSummary()` GL 2300 |
| `tax.net_payable` | Net Tax Payable | S | currency | • | O A Ac | output − input |
| `tax.by_rate` | Tax by Rate | B/T | currency | • | O A Ac | `taxRateReport` → Core |
| `tax.taxable_amount` | Taxable Sales | S | currency | • | O A Ac | `taxRateReport` |
| `fbr.einvoices_generated` | E-Invoices Sent | S | integer | • | O A M | `fbr_sync_logs` success |
| `fbr.sync_success_rate` | E-Invoice Success Rate | S/G | percent | • | O A M | success ÷ total |
| `fbr.einvoices_pending` | E-Invoices Pending | S | integer | live | O A M | `fbr_sync_logs` |
| `fbr.einvoices_failed` | E-Invoices Failed | S | integer | live | O A M | `fbr_sync_logs` |
| `fbr.sync_trend` | E-Invoice Sync Trend | MS | integer | • | O A M | logs by status per day |

### 3.4 Inventory

| Key | Label | Shape | Unit | Periods | Roles | Source |
|---|---|---|---|---|---|---|
| `inventory.stock_value` | Stock Value | S | currency | pit | O A V | `FRS::getInventoryValue()` FIFO — **canonical** (§4.1) |
| `inventory.retail_value` | Stock Value at Selling Price | S | currency | pit | O A M | `stockValuation` → Core |
| `inventory.potential_profit` | Profit Held in Stock | S | currency | pit | O A M | retail − cost |
| `inventory.units_on_hand` | Units in Stock | S | decimal | pit | O A M P V | stock sum |
| `inventory.stock_value_by_category` | Stock Value by Category | B | currency | pit | O A M | `getCurrentStockValueByCategory()` |
| `inventory.stock_value_by_product` | Stock Value by Product | T | currency | pit | O A M | `getCurrentStockValueByProduct()` |
| `inventory.low_stock_count` | Low Stock Items | S | integer | live | O A M P | at/below `min_stock_alert` — **canonical** (§4.10) |
| `inventory.low_stock_list` | Low Stock | T | mixed | live | O A M P | as above |
| `inventory.out_of_stock_count` | Out of Stock | S | integer | live | O A M P | qty ≤ 0 |
| `inventory.reorder_units_needed` | Units to Reorder | S | decimal | live | O A M P | shortfall sum |
| `inventory.reorder_cost` | Estimated Reorder Cost | S | currency | live | O A M P | shortfall × cost |
| `inventory.overstock_count` | Overstocked Items | S | integer | live | O A M P | above overstock threshold |
| `inventory.health_distribution` | Stock Health | B | integer | live | O A M | out / low / healthy / over |
| `inventory.product_count` | Products | S | integer | live | O A M P V | `products` active |
| `inventory.category_count` | Categories | S | integer | live | O A M P | `categories` |
| `inventory.parent_category_count` | Main Categories | S | integer | live | O A M | `categories` parents |
| `inventory.top_category_by_products` | Largest Category | S/St | text | live | O A M | most-populated |
| `inventory.warehouse_count` | Warehouses | S | integer | live | O A M | `warehouses` |
| `inventory.stock_by_warehouse` | Stock by Location | B | decimal | pit | O A M P | `stocks` by warehouse |
| `inventory.batch_count` | Batches | S | integer | live | O A M P | `inventory_batches` |
| `inventory.batch_quantity` | Batch Quantity | S | decimal | live | O A M P | `SUM(quantity)` |
| `inventory.batches_expiring` | Expiring Soon | S | integer | live | O A M P | `getExpiringSoon()` |
| `inventory.batches_expired` | Expired | S | integer | live | O A M P | `expiration_date < now()` |
| `inventory.expiry_value_at_risk` | Value Expiring Soon | S | currency | live | O A M P | expiring qty × unit cost |
| `inventory.aging_buckets` | Stock Ageing | B | currency | live | O A M P | `FRS::getStockAging()` |
| `inventory.frozen_cash` | Cash Tied in Old Stock | S | currency | live | O A M P | ageing 90+ cost value |
| `inventory.oldest_batch_days` | Oldest Stock (days) | S | integer | live | O A M P | `getStockAging()` |
| `inventory.movement_in_qty` | Stock In (units) | S | decimal | • | O A M P | `getInventoryMovement()` |
| `inventory.movement_in_value` | Stock In (value) | S | currency | • | O A M P | as above |
| `inventory.movement_out_qty` | Stock Out (units) | S | decimal | • | O A M P | as above |
| `inventory.movement_out_value` | Stock Out (value) | S | currency | • | O A M P | as above |
| `inventory.movement_net` | Net Stock Flow | S | decimal | • | O A M P | in − out |
| `inventory.movement_trend` | Stock Movement Trend | MS | decimal | • | O A M P | in/out per bucket |
| `inventory.most_active_item` | Most Moved Product | S/St | text | • | O A M | `movementHistory` |
| `inventory.point_in_time` | Stock as at Date | T | mixed | pit | O A M Ac | `getPointInTimeInventory()` |
| `inventory.stocktake_pipeline` | Stock Counts | B | integer | live | O A M P | `stock_takes` by status |
| `inventory.stocktake_variance_count` | Counts with Variance | S | integer | live | O A M P | `stock_takes` |
| `inventory.transfer_pipeline` | Stock Transfers | B | integer | live | O A M P | `stock_transfers` by status |
| `inventory.serial_states` | Serial Numbers | B | integer | live | O A M P | `product_serials` by state |
| `inventory.item_batch_detail` | Batch Detail | T | mixed | pit | O A M P | `itemDetailReport` → Core |

### 3.5 Purchasing

| Key | Label | Shape | Unit | Periods | Roles | Source |
|---|---|---|---|---|---|---|
| `purchasing.spend` | Purchases | S | currency | • | O A M P Ac | `FRS::getPurchasesReport().total_spend` |
| `purchasing.spend_trend` | Purchase Trend | Se | currency | • | O A M P | as above |
| `purchasing.bill_count` | Purchase Bills | S | integer | • | O A M P Ac | `purchases` |
| `purchasing.amount_paid` | Paid to Suppliers | S | currency | • | O A P Ac | ledger-derived (never `paid_amount`) |
| `purchasing.amount_due` | Owed to Suppliers | S | currency | pit | O A P Ac | AP per supplier |
| `purchasing.po_pipeline` | Purchase Orders | B/F | integer | live | O A M P | `purchase_orders` by status |
| `purchasing.po_value` | Purchase Order Value | S | currency | • | O A M P | `purchase_orders` |
| `purchasing.po_pending_deliveries` | Awaiting Delivery | S | integer | live | O A M P | `purchase_orders` |
| `purchasing.spend_by_product` | Spend by Product | T/R | currency | • | O A M P | `getPurchasesByProduct()` |
| `purchasing.spend_by_category` | Spend by Category | B | currency | • | O A M P | `getPurchasesByCategory()` |
| `purchasing.spend_by_supplier` | Spend by Supplier | R | currency | • | O A M P | `purchases` by party |
| `purchasing.returns_count` | Purchase Returns | S | integer | • | O A P Ac | `purchase_returns` |
| `purchasing.returns_value` | Purchase Return Value | S | currency | • | O A P Ac | `purchase_returns` |
| `purchasing.recent_bills` | Recent Purchases | T | mixed | live | O A M P | `purchases` latest |
| `supplier.cost_variance` | Supplier Price Variance | T | currency | • | O A M P | `getSupplierInsights()` |
| `supplier.rising_cost_count` | Products Costing More | S | integer | • | O A M P | `getSupplierInsights()` |
| `supplier.price_history` | Supplier Price History | MS | currency | • | O A M P | `getSupplierInsights().price_history` |
| `supplier.pair_count` | Supplier–Product Links | S | integer | live | O A M P | `getSupplierInsights()` |
| `supplier.qty_purchased` | Quantity Bought per Supplier | R | decimal | • | O A M P | `getSupplierInsights()` |

### 3.6 Customers & Suppliers (parties)

| Key | Label | Shape | Unit | Periods | Roles | Source |
|---|---|---|---|---|---|---|
| `party.customer_count` | Customers | S | integer | live | O A M Ac | `parties` type customer |
| `party.supplier_count` | Suppliers | S | integer | live | O A M P Ac | `parties` type supplier |
| `party.total_count` | Contacts | S | integer | live | O A M P Ac | `parties` |
| `party.new_customers` | New Customers | S | integer | • | O A M | `parties.created_at` |
| `party.active_customers` | Active Customers | S | integer | • | O A M Ac | distinct `party_id` on sales |
| `party.repeat_rate_pct` | Repeat Customer Rate | S/G | percent | • | O A M | customers with >1 sale ÷ active |
| `party.avg_spend` | Average Spend per Customer | S | currency | • | O A M | revenue ÷ active customers |
| `party.avg_invoice_value` | Average Invoice Value | S | currency | • | O A M | `getCustomerInsights()` |
| `party.customer_insights` | Customer Insights | T | mixed | • | O A M | `getCustomerInsights()` |
| `party.category_breadth` | Categories Bought | S | integer | • | O A M | `getCustomerInsights()` |
| `party.dormant_count` | Customers Gone Quiet | S | integer | • | O A M | no sale in N days |
| `party.credit_exposure` | Credit Extended | S | currency | pit | O A Ac | `parties.current_balance` vs limit |
| `party.over_credit_limit` | Over Credit Limit | S | integer | pit | O A Ac | balance > `credit_limit` |
| `party.statement_aging` | Customer Statement Ageing | B | currency | pit | O A Ac | `V3\CustomerStatementController` → Core |
| `party.supplier_advance` | Advances to Suppliers | S | currency | pit | O A P Ac | `V3\SupplierStatementController` → Core |

### 3.7 Manufacturing & Recipes

| Key | Label | Shape | Unit | Periods | Roles | Source |
|---|---|---|---|---|---|---|
| `production.runs_in_progress` | Production In Progress | S | integer | live | O A M | `production_runs` |
| `production.runs_completed` | Production Completed | S | integer | • | O A M | `production_runs` |
| `production.runs_failed` | Production Failed | S | integer | • | O A M | `production_runs` |
| `production.run_pipeline` | Production Pipeline | B/F | integer | live | O A M | `production_runs` by status |
| `production.total_cost` | Production Cost | S | currency | • | O A M | `SUM(total_cost)` |
| `production.output_qty` | Units Produced | S | decimal | • | O A M | `production_runs` |
| `production.cost_per_unit` | Cost per Unit Produced | S | currency | • | O A M | cost ÷ output |
| `production.cost_trend` | Production Cost Trend | Se | currency | • | O A M | `production_runs` |
| `recipe.count` | Recipes | S | integer | live | O A M P | `recipes` |
| `recipe.ingredient_count` | Ingredients per Recipe | T | integer | live | O A M P | `recipe_ingredients` |
| `recipe.cogm` | Cost to Make | S | currency | live | O A M P | ingredients + labour + overhead |
| `recipe.yield_quantity` | Recipe Yield | S | decimal | live | O A M P | `recipes.yield_quantity` |
| `recipe.labor_cost` | Labour Cost | S | currency | live | O A M P | `recipes.labor_cost` |
| `recipe.overhead_cost` | Overhead Cost | S | currency | live | O A M P | `recipes.overhead_cost` |
| `recipe.cost_composition` | Cost Make-up | B | currency | live | O A M P | materials / labour / overhead |
| `recipe.shortfall` | Ingredients Short | T | decimal | live | O A M P | required − available |
| `recipe.makeable_units` | Units You Can Make | S | decimal | live | O A M P | limiting-ingredient calculation |

### 3.8 Restaurant

| Key | Label | Shape | Unit | Periods | Roles | Source |
|---|---|---|---|---|---|---|
| `restaurant.table_status` | Table Status | B | integer | live | O A M C | `restaurant_tables` |
| `restaurant.tables_occupied` | Tables Occupied | S | integer | live | O A M C | `restaurant_tables` |
| `restaurant.seat_utilisation` | Seat Utilisation | S/G | percent | live | O A M | occupied seats ÷ capacity |
| `restaurant.open_ticket_value` | Value on Open Tables | S | currency | live | O A M C | `restaurant_tables.order_total` |
| `restaurant.kitchen_queue` | Kitchen Queue | S | integer | live | O A M C | `kitchen_orders` not served |
| `restaurant.kitchen_oldest_mins` | Longest Wait (mins) | S | integer | live | O A M C | `time_elapsed_mins` max |
| `restaurant.kitchen_avg_mins` | Average Prep Time | S | integer | • | O A M | `time_elapsed_mins` avg |
| `restaurant.covers` | Covers Served | S | integer | • | O A M | closed tickets |
| `restaurant.turn_time` | Table Turn Time | S | duration | • | O A M | open → close |

### 3.9 Staff

| Key | Label | Shape | Unit | Periods | Roles | Source |
|---|---|---|---|---|---|---|
| `staff.total` | Team Members | S | integer | live | O A M | `tenant_users` |
| `staff.on_shift` | On Shift Now | S | integer | live | O A M | `staff_attendances` open |
| `staff.on_shift_list` | Who's In | T | mixed | live | O A M | `staff_attendances` |
| `staff.present_today` | Present Today | S | integer | • | O A M | `staff_attendances` |
| `staff.absent_today` | Absent Today | S | integer | • | O A M | roster − present |
| `staff.hours_worked` | Hours Worked | S | duration | • | O A M | `staff_attendances` |
| `staff.attendance_gaps` | Missing Clock-Outs | S | integer | live | O A M | open records past shift end |
| `staff.sales_leaderboard` | Sales Leaderboard | R | currency | • | O A M | `FRS::getNetRevenueByUser()` |
| `staff.session_total` | My Till Total | S | currency | live | O A M C | current session sales |
| `staff.session_transactions` | My Transactions | S | integer | live | O A M C | current session count |
| `staff.time_on_shift` | Time on Shift | S | duration | live | O A M C | check-in → now |
| `staff.support_queue` | Support Queue | B | integer | live | O A | `StaffHubController` |

### 3.10 Operations, Sync & System

| Key | Label | Shape | Unit | Periods | Roles | Source |
|---|---|---|---|---|---|---|
| `ops.needs_attention` | Needs You Today | Fd | mixed | live | all | cross-module composite |
| `ops.system_status` | System Status | St | text | live | O A M | health checkers |
| `ops.last_backup` | Last Backup | S/St | text | live | O A M | backup logs |
| `ops.backup_age_hours` | Backup Age | S | duration | live | O A M | backup logs |
| `ops.online_store_status` | Online Store | St | text | live | O A M | `online_store_settings` |
| `ops.woo_staged` | WooCommerce Staged | S | integer | live | O A M | `WooConnectionController` |
| `ops.woo_synced` | WooCommerce Synced | S | integer | live | O A M | as above |
| `ops.woo_pending` | WooCommerce Pending | S | integer | live | O A M | as above |
| `ops.woo_conflicts` | WooCommerce Conflicts | S | integer | live | O A M | as above |
| `ops.woo_sync_health` | Sync Health | B/G | percent | live | O A M | synced ÷ total |
| `ops.vensynq_pending` | Marketplace Orders Pending | S | integer | live | O A M | `VenSynQController` |
| `ops.vensynq_dispatched` | Marketplace Dispatched | S | integer | • | O A M | as above |
| `ops.vensynq_payout` | Estimated Payout | S | currency | • | O A Ac | as above |
| `ops.smartcapture_items` | Captured Rows | S | integer | • | O A M | `SmartCaptureController` |
| `ops.report_usage` | Reports Generated | S | integer | • | O A | `ReportController::dashboard` |
| `growth.signals_total` | Growth Signals | S | integer | live | O A M | `ai_recommendations` |
| `growth.signals_unread` | Unread Signals | S | integer | live | O A M | `ai_recommendations` |
| `growth.signals_urgent` | Urgent Signals | S | integer | live | O A M | `ai_recommendations` |
| `growth.opportunity_value` | Opportunity on the Table | S | currency | live | O A M | `potential_revenue` |
| `growth.recovered_value` | Recovered So Far | S | currency | • | O A M | `outcome_value` |
| `growth.signals_by_brain` | Signals by Type | B | integer | live | O A M | `by_brain` |
| `growth.precision_pct` | Signal Accuracy | S/G | percent | • | O A M | graded hits ÷ graded |
| `growth.recommendations` | Recommendations | Fd | mixed | live | O A M | `ai_recommendations` |
| `pulse.daily_deltas` | Yesterday vs Today | T | percent | live | O A M | `owner_pulse_snapshots` |

### 3.11 Plan, Billing & Platform

| Key | Label | Shape | Unit | Periods | Roles | Source |
|---|---|---|---|---|---|---|
| `plan.current` | Your Plan | St | text | live | O | `StoreLicense` / `Plan` |
| `plan.days_remaining` | Days Left on Plan | S | integer | live | O | `StoreLicense` |
| `plan.usage_products` | Product Limit Used | G | percent | live | O A | `Api\PlanUsageController` |
| `plan.usage_staff` | Staff Limit Used | G | percent | live | O A | as above |
| `plan.usage_warehouses` | Warehouse Limit Used | G | percent | live | O A | as above |
| `plan.usage_transactions` | Transaction Limit Used | G | percent | live | O A | as above |
| `plan.usage_summary` | Plan Usage | T/B | percent | live | O A | as above |
| `platform.mrr` | MRR | S | currency | • | PA | coupon-adjusted — **canonical** (§4.6) |
| `platform.arr` | ARR | S | currency | • | PA | MRR × 12 |
| `platform.paid_subscribers` | Paying Stores | S | integer | live | PA | tenants |
| `platform.stores_by_state` | Stores by Status | B | integer | live | PA | tenants |
| `platform.new_stores` | New Stores | S | integer | • | PA | tenants |
| `platform.growth_rate` | Store Growth | S | percent | • | PA | period over period |
| `platform.trial_conversion` | Trial Conversion | S/G | percent | • | PA | converted ÷ signups |
| `platform.expiring_trials` | Trials Ending Soon | T | mixed | live | PA | tenants |
| `platform.churn_rate` | Churn | S | percent | • | PA | churned ÷ opening active |
| `platform.gmv` | Platform Volume | S | currency | • | PA | cross-tenant sales |
| `platform.storage_used` | Storage Used | S/G | decimal | live | PA | storage stats |
| `platform.uptime` | Uptime | S/G | percent | • | PA | health monitor |
| `platform.open_errors` | Open Errors | S | integer | live | PA | `error_logs` |
| `platform.new_contacts` | New Contacts | S | integer | • | PA | `contact_submissions` |
| `platform.user_count` | Platform Users | S | integer | live | PA | `users` |
| `platform.appsumo_codes` | AppSumo Codes | B | integer | live | PA | `AppSumoCode` |
| `platform.coupon_penetration` | Discounted Stores | B | integer | live | PA | `CouponRedemption` |
| `platform.kyc_queue` | Verification Queue | B | integer | live | PA | `pk_verifications` |
| `platform.store_trend` | Store Growth Trend | Se | integer | • | PA | tenants by month |
| `platform.mrr_trend` | MRR Trend | Se | currency | • | PA | derived |
| `platform.seats_per_store` | Seats per Store | T | integer | live | PA | `tenant_users` |

**Catalogue total: ~250 metric keys.** The original IDE matrix of 56 cards maps into this as ~56 keys × the period vocabulary; the remaining ~190 come from the report layer and platform layer, which previously had no card representation at all.

---

## 4. Canonicalisation decisions

These are the conflicts found in the codebase. **Each has one winner. Every other implementation must be deleted and replaced with a Core call.** This section is the most important part of the build — a card builder on top of inconsistent numbers is worse than no card builder.

### 4.1 Inventory value — FIFO wins
- **Keep:** `FinancialReportingService::getInventoryValue()` — `SUM(inventory_batches.remaining_qty × unit_cost)`.
- **Delete:** `InventoryController.php:~1050` `'total_value' => $products->sum(fn($p) => $p['total_stock'] * $p['cost_price'])`.
- **Update:** `Pages/Inventory/StockLevels.jsx` to consume `inventory.stock_value`.
- **Guard:** a test asserting the two produce the same figure on the golden dataset, then the second is removed.

### 4.2 Ageing buckets — one scheme
- **Canonical:** `0–30 / 31–60 / 61–90 / 90+`, inclusive lower bound, as in `FinancialReportingService::ageBucket()`.
- **Change:** `ReportController::saleAging()` (strict `>` scheme) and `V3\CustomerStatementController` (`current / 1-30 / …`) both call `MetricPeriod`-aware `finance.receivables_aging`.
- A 60-day invoice must land in `31–60` on every screen.

### 4.3 Receivables / Payables — GL wins
- **Canonical:** GL account `1200` (AR) and `2000` (AP) net movement on non-reversed entries — exactly what `WidgetDataService::outstanding()` already does.
- `getAgedReceivables()` keeps its invoice-derived detail **but must reconcile to the GL figure**; its "Credit / Advance" balancing row stays and is documented, not hidden.
- **Delete as a source of the headline number:** `PartyController::index()` summing `parties.current_balance`. That column may stay for per-party display but never for a total.

### 4.4 Largest Sale — ex-tax
- **Canonical:** `MAX(sales.net_sales)` (ex-tax), as in `ReportController::sales()`.
- **Change:** `graphAnalytics()` line ~2085 `max('total')`.
- Label everywhere: **"Largest Sale (excl. tax)"**.

### 4.5 Revenue basis — GL wins
- **Canonical:** `getProfitAndLoss().revenue` (GL-derived, net of returns, ex-tax).
- `getGrossProfitByProduct()`'s prorated `net_amount` stays for *per-product attribution* only; its column total must reconcile to the GL revenue within rounding, and a test asserts it.
- **Change:** `ReportController::sales()` and `SalesAnalyticsController` to read `sales.revenue`.

### 4.6 MRR — coupon-adjusted wins
- **Canonical:** `AdminDashboardController`'s per-tenant pricing with `CouponRedemption` discounts applied.
- **Delete:** `SuperAdminController`'s `activePaidCount × PlanPricingService::monthly()`.

### 4.7 Staff sales — `getNetRevenueByUser()` wins
- **Canonical:** `FinancialReportingService::getNetRevenueByUser()` (ex-tax, returns netted).
- **Change:** the staff dashboard's separately-computed "staff sales" figure.

### 4.8 Deleted store count — demo-filtered wins
- **Canonical:** `AdminDashboardController`'s `$realTenants` denominator. Demo tenants are excluded from every platform metric, consistently.

### 4.9 Cash flow — two distinct metrics, two distinct names
- `getCashFlowReport()` → `finance.net_cash_flow`, labelled **"Net Cash Flow"** (inflow − outflow, transfers excluded).
- `getDetailedCashFlow()` → `finance.cash_flow_classified`, labelled **"Cash Flow by Activity"** (operating + investing + financing over accounts 1000/1010).
- They are allowed to differ; they must never share a label. Remove `net_change_in_cash` as a duplicate alias from `getCashFlowReport()`.

### 4.10 Low stock — out-of-stock is excluded
- **Canonical:** low stock = `0 < qty ≤ min_stock_alert`. Out-of-stock is its own metric, `inventory.out_of_stock_count`.
- **Change:** `ReportController::lowStock()` to exclude qty ≤ 0.
- The two cards must sum to the old combined figure; a test asserts it.

### 4.11 Margin — two named metrics
- `sales.gross_margin_pct` = gross profit ÷ revenue.
- `finance.net_margin_pct` = net profit ÷ revenue.
- The word "margin" alone is banned from the UI. Every label says which.

### 4.12 Expenses — account-id grouping, not name
- **Canonical:** group by `accounts.id`, display `accounts.name`. A category rename must not split history.
- **Change:** `Reports/ExpenseByCategory` grouping by account name.

### 4.13 COGS excluded from the Expenses card
- `getProfitAndLoss().total_expenses` includes COGS. The Expenses metric is **operating expenses only** (`total_expenses − cogs`), as `WidgetDataService::widgetExpenses()` already does correctly. Keep this and document it in the metric `help` text.

### 4.14 Production month cost is currently a lie
- `ProductionController::index()` hardcodes `month_cost` and `ingredients_used` to `0`. Implement `production.total_cost` properly from `production_runs.total_cost`; until it is implemented the metric must return `not_applicable`, **never zero**. A card showing a confident `0` is worse than a card showing "not available".

### 4.15 Signed metrics get dual labels
Any metric with `'signed' => true` renders its negative state with a different word, chosen from `MetricLabels`:

| Metric | Positive | Negative |
|---|---|---|
| `sales.gross_profit` | Gross Profit | **Gross Loss** |
| `finance.net_profit` | Net Profit | **Net Loss** |
| `finance.net_cash_flow` | Net Cash Inflow | **Net Cash Outflow** |
| `inventory.movement_net` | Net Stock Gain | Net Stock Reduction |
| `sales.by_party_flow` net | Net Receivable | Net Payable |
| `tax.net_payable` | Tax Payable | **Tax Refundable** |
| `finance.trial_balance_diff` | Out of Balance (Dr) | Out of Balance (Cr) |

"Gross Loss" is correct accounting terminology — it is the standard name for a negative gross profit and appears in trading accounts. Use it.

---

## 5. Vertical-aware labels

`MetricLabels::for(string $key, string $vertical, float|null $value): string`

Vertical comes from the tenant's business type (existing setup wizard field). Supported verticals: `retail`, `restaurant`, `pharmacy`, `wholesale`, `services`, `manufacturing`, `grocery`, `salon`, `automotive`, `generic`.

Label resolution order: `vertical override` → `signed-state override` → canonical `label`.

Selected overrides (the full map lives in `MetricLabels.php`; this table is the pattern and the required minimum):

| Key | retail | restaurant | pharmacy | wholesale | services | manufacturing |
|---|---|---|---|---|---|---|
| `sales.revenue` | Sales | Sales | Sales | Sales | Fees Earned | Sales |
| `sales.order_count` | Sales | Covers Billed | Prescriptions & Sales | Orders | Jobs Invoiced | Orders |
| `sales.avg_ticket` | Average Basket | Average Cover | Average Sale | Average Order Value | Average Job Value | Average Order Value |
| `sales.items_sold` | Items Sold | Dishes Served | Packs Dispensed | Units Shipped | Hours Billed | Units Shipped |
| `inventory.stock_value` | Stock Value | Ingredient Stock Value | Stock Value | Warehouse Stock Value | *(hidden)* | Raw Material & WIP Value |
| `inventory.low_stock_count` | Low Stock | Running Low | Low Stock | Low Stock | *(hidden)* | Low Raw Materials |
| `inventory.batches_expiring` | Expiring Soon | Use By Soon | Expiring Soon | Expiring Soon | *(hidden)* | Expiring Soon |
| `party.customer_count` | Customers | Guests | Patients | Accounts | Clients | Customers |
| `party.active_customers` | Active Customers | Returning Guests | Returning Patients | Active Accounts | Active Clients | Active Customers |
| `purchasing.spend` | Purchases | Food & Beverage Cost | Purchases | Purchases | Subcontractor Cost | Material Purchases |
| `recipe.cogm` | Build Cost | Dish Cost | Compound Cost | Kit Cost | Job Cost | Cost to Manufacture |
| `recipe.count` | Bundles | Menu Items | Compounds | Kits | Service Packages | Bills of Material |
| `production.runs_completed` | Builds Completed | Batches Prepped | Compounds Made | Kits Assembled | Jobs Completed | Runs Completed |
| `staff.on_shift` | Staff on Shift | Front of House on Shift | Staff on Shift | Staff on Shift | Team Available | Operators on Shift |
| `sales.parked_count` | Held Bills | Open Tables | Held Bills | Held Orders | Draft Invoices | Held Orders |

*(hidden)* means: the metric is removed from the picker for that vertical, in addition to the capability gate.

**Rules:**
1. The **key never changes**. Only the display string does.
2. A saved card stores the key, not the label. Change the business type and every card relabels itself.
3. `card.title_override` (user-typed) beats all of the above — the user always wins on their own dashboard.

---

## 6. Charts — bklit UI

### 6.1 Installation

bklit is a shadcn registry. The app currently uses Recharts; both can coexist during migration.

```bash
cd app-code/main-app

# 1. shadcn scaffolding (once)
npx shadcn@latest init

# 2. register the namespace in components.json
#    "registries": { "@bklit": "https://ui.bklit.com/r/{name}.json" }

# 3. install every chart we use (candlestick deliberately excluded)
npx shadcn@latest add \
  @bklit/area-chart @bklit/bar-chart @bklit/line-chart @bklit/live-line-chart \
  @bklit/composed-chart @bklit/pie-chart @bklit/ring-chart @bklit/gauge-chart \
  @bklit/funnel-chart @bklit/radar-chart @bklit/scatter-chart @bklit/heatmap-chart \
  @bklit/sunburst-chart @bklit/sankey-chart @bklit/choropleth-chart \
  @bklit/profit-loss-line @bklit/shimmering-text

# 4. utility components
npx shadcn@latest add \
  @bklit/legend @bklit/grid @bklit/background @bklit/reference-area \
  @bklit/projection-line @bklit/tooltip @bklit/brush @bklit/x-axis @bklit/y-axis \
  @bklit/custom-indicator @bklit/use-chart
```

Reference copies already exist at `extras/bklit-ui/src/components/charts/` — use them if the registry is unreachable, but the CLI install is the source of truth.

**Compatibility notes for the IDE:** `extras/bklit-ui` is React 19 + Tailwind 4-era tooling; the app is React 18 + Tailwind 3 + Vite 7. Verify each installed component compiles under React 18. bklit depends on `@visx/*`, `d3-array`, `d3-shape`, `motion`, `@number-flow/react` — add these to the app's `package.json`. If `motion` v13 conflicts with the app's animation stack, pin it and scope it to the chart directory.

**Do not install** `@bklit/candlestick-chart`.

### 6.2 Chart registry (frontend)

`resources/js/Dashboard/charts/chartRegistry.js` — the mirror of `MetricShape::chartsFor()`. The two must stay in sync; a test asserts they do.

| Chart id | bklit component | Accepts shapes | Best for | Min card size |
|---|---|---|---|---|
| `stat` | *(native)* | SCALAR, GAUGE, STATUS | one number with a delta | small |
| `sparkline` | AreaChart (minimal) | SCALAR+series, SERIES | trend hint under a number | small |
| `line` | LineChart | SERIES, MULTI_SERIES | change over time | medium |
| `area` | AreaChart | SERIES, MULTI_SERIES | volume over time | medium |
| `live_line` | LiveLineChart | SERIES | live sales / kitchen queue | medium |
| `profit_loss_line` | ProfitLossLine | SERIES (signed) | profit that crosses zero | medium |
| `bar` | BarChart | SERIES, BREAKDOWN, RANKING | compare categories | medium |
| `composed` | ComposedChart | MULTI_SERIES | bars + line (revenue vs margin) | large |
| `pie` | PieChart | BREAKDOWN | parts of a whole, ≤7 slices | small |
| `ring` | RingChart | BREAKDOWN, SCALAR, GAUGE | share, or progress to target | small |
| `gauge` | Gauge | GAUGE, SCALAR+target | percentage against a limit | small |
| `funnel` | FunnelChart | FUNNEL, RANKING, BREAKDOWN | pipeline stages | medium |
| `radar` | RadarChart | MULTI_SERIES, BREAKDOWN | multi-axis comparison | medium |
| `scatter` | ScatterChart | SERIES, MULTI_SERIES | correlation (price vs volume) | large |
| `heatmap` | HeatmapChart | TABLE, SERIES(2-dim) | hour × weekday density | large |
| `sunburst` | SunburstChart | BREAKDOWN (nested) | category → sub-category | large |
| `sankey` | SankeyChart | FUNNEL, MULTI_SERIES | cash flow, stock flow | full |
| `choropleth` | ChoroplethChart | GEO | sales by region | large |
| `table` | *(native)* | TABLE, RANKING, FEED | detail lists | medium |
| `feed` | *(native)* | FEED | live activity | medium |
| `status` | *(native)* | STATUS | health / on-off states | small |

Utility layers (`legend`, `grid`, `tooltip`, `brush`, `reference-area`, `projection-line`, `x-axis`, `y-axis`, `custom-indicator`) are **card options**, not chart types — exposed as toggles in the builder's Style step.

### 6.3 Binding rules

1. **Shape decides legality.** The builder only offers charts in `chartsFor(shape)`. The API re-validates.
2. **Slice cap.** `pie` / `ring` / `sunburst` cap at 7 slices + "Other". Beyond that the builder nudges toward `bar`.
3. **Series cap.** `line` / `area` cap at 6 series. Beyond that, `heatmap`.
4. **Signed data.** A SERIES that crosses zero defaults to `profit_loss_line`, not `area` — a gradient fill below zero reads as growth.
5. **Zero baseline.** `bar` always starts at zero and this is not configurable. `line` / `area` may use a fitted domain.
6. **Colour.** One palette, defined once in `resources/js/Dashboard/charts/palette.js`, WCAG AA in both themes, colour-blind safe. Semantic colours are reserved: green = favourable movement, red = unfavourable, and `direction` on the metric decides which is which (a *fall* in `finance.payables`, which is `lower_is_better`, is green).
7. **Formatting is central.** `formatValue(value, unit, precision, currency, locale)` in one module. No `toFixed()` in a card component.
8. **Empty and error states are chart-agnostic** — the card frame owns them, drawn identically whatever chart is selected.
9. **Loading.** Use bklit's shimmer/loading-sweep states, not a spinner overlay.
10. **Accessibility.** Every chart card exposes a screen-reader table of its data and is keyboard-reachable.

---

## 7. Persistence

### 7.1 Migrations

```php
// create_dashboards_table
Schema::create('dashboards', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('tenant_id')->index();
    $table->uuid('user_id')->nullable()->index();   // null = a shared/tenant-default dashboard
    $table->string('name', 80);
    $table->string('slug', 80);
    $table->boolean('is_default')->default(false);
    $table->string('shared_with_role', 40)->nullable();  // owner-published dashboards
    $table->unsignedSmallInteger('position')->default(0);
    $table->timestamps();
    $table->unique(['tenant_id', 'user_id', 'slug']);
});

// create_dashboard_cards_table
Schema::create('dashboard_cards', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('tenant_id')->index();
    $table->uuid('dashboard_id')->index();
    $table->string('metric_key', 80);
    $table->string('period', 24)->default('today');
    $table->json('period_custom')->nullable();       // {from, to}
    $table->string('granularity', 16)->nullable();
    $table->string('chart', 24)->default('stat');
    $table->string('size', 12)->default('small');    // small|medium|large|full
    $table->unsignedTinyInteger('x')->default(0);
    $table->unsignedSmallInteger('y')->default(0);
    $table->unsignedTinyInteger('w')->default(3);
    $table->unsignedTinyInteger('h')->default(2);
    $table->string('title_override', 80)->nullable();
    $table->json('args')->nullable();                // whitelisted filters
    $table->json('style')->nullable();               // legend/grid/tooltip/brush toggles, colour, target
    $table->timestamps();
    $table->index(['dashboard_id', 'y', 'x']);
});
```

MariaDB 10.5: `json` maps to `LONGTEXT` with a JSON check constraint — do **not** use generated columns over JSON paths for indexing.

### 7.2 Sanitisation

Extend the existing `WidgetRegistry::sanitizeLayout()` into `DashboardSanitizer::sanitize(array $cards, array $availableMetrics)`:

- Drop cards whose `metric_key` is unknown or now ungated (**do not delete the DB row** — a plan downgrade must be reversible, exactly as the current docblock intends).
- Migrate `deprecated` keys to their replacement.
- Force `period` into the metric's allowed list, else `default_period`.
- Force `chart` into `chartsFor(shape)`, else `default_chart`.
- Re-derive `w`/`h` from `size`; clamp `x` to 0–11 and `y` to 0–500.
- Whitelist `args` keys per metric; drop anything else.
- Cap at 40 cards.

---

## 8. HTTP API

### 8.1 Routes (`routes/api.php`, auth:sanctum + tenant middleware)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/metrics/catalogue` | Metrics available to this user/plan/business, with shapes, periods, charts, resolved labels. Feeds the picker. |
| `POST` | `/api/metrics/resolve` | Batch resolve. Max 24. |
| `GET` | `/api/dashboards` | List this user's dashboards |
| `POST` | `/api/dashboards` | Create |
| `GET` | `/api/dashboards/{id}` | Cards + layout (no data) |
| `PUT` | `/api/dashboards/{id}` | Rename, reorder, set default |
| `DELETE` | `/api/dashboards/{id}` | Delete (not the last one) |
| `PUT` | `/api/dashboards/{id}/layout` | Save the whole card array atomically |
| `POST` | `/api/dashboards/{id}/cards` | Add a card |
| `PATCH` | `/api/dashboards/{id}/cards/{cardId}` | Change period / chart / size / title / style |
| `DELETE` | `/api/dashboards/{id}/cards/{cardId}` | Remove a card |
| `POST` | `/api/dashboards/{id}/reset` | Back to the role default layout |

Run `php artisan ziggy:generate` after adding routes.

### 8.2 Resolve request / response

```jsonc
// POST /api/metrics/resolve
{
  "metrics": [
    { "key": "sales.revenue",       "period": "this_month" },
    { "key": "finance.net_profit",  "period": "this_month" },
    { "key": "sales.revenue_trend", "period": "last_12_months", "granularity": "monthly", "chart": "area" },
    { "key": "sales.payment_breakdown", "period": "today", "chart": "pie" },
    { "key": "inventory.low_stock_list", "period": "live", "args": { "warehouse_id": "…" } }
  ]
}
```

```jsonc
{
  "results": { "sales.revenue|this_month": { /* envelope */ }, "…": { } },
  "meta": { "resolved_at": "2026-08-11T09:14:02+05:00", "duration_ms": 214, "cached_count": 3 }
}
```

Result keys are `"{key}|{period}|{md5(args)}"` so the same metric can appear at two periods in one dashboard.

### 8.3 Refresh behaviour

- Cards poll on a **single shared timer** per dashboard, not one per card.
- `live` metrics: 15 s. Everything else: `max(cache_ttl, 60 s)`.
- Polling pauses when the tab is hidden and resumes with an immediate fetch.
- A manual **Refresh** on the dashboard header bypasses cache for that batch only (`?fresh=1`, rate-limited to 1 per 10 s per user).

---

## 9. The card builder (UX)

A four-step sheet. Every step is reversible; a live preview sits alongside from step 1.

**Step 1 — What do you want to see?**
Search box + category tabs, populated from `/api/metrics/catalogue`. Each result shows the vertical-aware label, its one-line description, and a small preview of its default chart with the user's real data. **Nothing the user cannot see is listed** — no padlocks, no upsell tiles. (This is already the stated principle in `WidgetRegistry`'s docblock; keep it.)

**Step 2 — Over what period?**
Chips from the metric's `periods`, with a custom range picker. `live` and `pit` metrics skip this step. Show the resolved window in words: "1 – 11 August 2026".

**Step 3 — How should it look?**
Only the charts in `chartsFor(shape)`, each rendered as a live thumbnail with the user's own data — the user picks by looking, not by naming a chart type. Size selector (small/medium/large/full) with the min-size rule from §6.2 disabling sizes too small for the chosen chart.

**Step 4 — Anything to adjust?**
Optional: title override, comparison on/off, target line (for gauge/ring), utility layer toggles (legend, grid, tooltip, brush, projection), colour accent, and any metric-specific `args` (warehouse, category, staff member).

**Then:** the card is appended to the grid at the first free slot and the sheet closes. No "save" step — adding *is* saving.

**Grid behaviour:** keep `react-grid-layout` with the existing 12-column, four-size-preset model — arbitrary rectangles are what turn a dashboard into a mosaic. Drag to reorder, resize between allowed presets only, and layout autosaves 800 ms after the last drag with an optimistic UI.

**Multiple dashboards:** tabs across the top. Owners may publish a dashboard to a role, which becomes that role's default for users who have not customised theirs.

**Empty state:** a fresh user gets `WidgetRegistry::defaultLayout()`'s role-appropriate starter set — deliberately small — plus a single, prominent "Add a card".

---

## 10. Build phases

Each phase is independently shippable and independently testable. Do not begin a phase until the previous phase's acceptance criteria pass.

### Phase 1 — Core skeleton
**Build:** `MetricPeriod`, `MetricShape`, `MetricEnvelope`, `MetricRegistry` (definitions only, populated with the ~20 keys that map onto today's `WidgetRegistry`), `MetricResolver` with all six gate steps, and `FinanceMetricProvider` + `SalesMetricProvider` wrapping `FinancialReportingService`.

**Accept:**
- Every existing `WidgetDataService` widget returns byte-identical data through the new resolver on the golden dataset.
- `MetricPeriod::resolve()` covers all 17 period keys with tenant timezone and fiscal-year awareness; unit tests for each.
- A `grep` for date construction under `app/Services/Metrics/` hits only `MetricPeriod.php`.
- A metric requested without permission returns `forbidden` and **does not execute its query** (assert with a query-count spy).

### Phase 2 — Catalogue expansion
**Build:** the remaining providers and the full ~250-key catalogue from §3. Move every computation currently living in `ReportController`, `InventoryController`, `SuperAdminController`, `AdminDashboardController`, `FinanceController`, `ExpenseController`, `PaymentController`, `TransactionController` into providers. Those controllers become callers.

**Accept:**
- Every key in §3 resolves without error on the golden dataset for every period in its list.
- No `SUM(`, `COUNT(`, `AVG(` remains in a controller that feeds a stat tile. Enforce with a CI grep over `app/Http/Controllers/`.
- Report pages render identical figures to before the move (snapshot tests on the golden dataset).

### Phase 3 — Canonicalisation
**Build:** every decision in §4. Delete the losing implementations.

**Accept:**
- A `MetricConsistencyTest` asserting, on the golden dataset: inventory value matches across dashboard and report; a 60-day invoice sits in `31–60` on every ageing surface; `getAgedReceivables()` total reconciles to GL 1200 within PKR 0.01; low stock + out of stock = the old combined count; the two MRR figures are now one.
- `production.total_cost` either returns a real figure or `not_applicable` — never `0` as a placeholder.
- Every `signed` metric renders its negative label; a test asserts "Gross Loss" appears when gross profit < 0.

### Phase 4 — Labels
**Build:** `MetricLabels` with the full vertical map. Wire the tenant's business type through the catalogue endpoint.

**Accept:**
- Switching business type relabels every card without touching a saved row.
- Every metric has a `generic` label; no card can ever render its raw key.
- A restaurant tenant sees "Average Cover", never "Average Basket".

### Phase 5 — bklit + chart layer
**Build:** install per §6.1; build `chartRegistry`, `palette`, `formatValue`, the chart wrapper components, and the shape→chart validation mirror.

**Accept:**
- All 20 chart types render from a fixture envelope of each compatible shape, in light and dark, at every card size.
- `chartRegistry` and `MetricShape::chartsFor()` agree — asserted by a test that reads both.
- No Recharts import remains in any file under `resources/js/Dashboard/`.
- Contrast check passes AA for every palette pair in both themes.

### Phase 6 — Persistence & API
**Build:** migrations, models, `DashboardSanitizer`, the eleven endpoints, Ziggy regeneration.

**Accept:**
- A layout saved, plan downgraded, page reloaded → the locked card is absent from the render but still present in the DB; re-upgrading restores it in place.
- A POST with a metric key the user lacks permission for returns `403` and resolves nothing.
- A POST with an illegal chart-for-shape returns `422`.
- 40-card and 24-metric caps enforced with tests.

### Phase 7 — Builder UI
**Build:** the four-step sheet, the grid, multi-dashboard tabs, refresh timer, empty/loading/error states.

**Accept:**
- A card can be added, moved, resized, re-charted, re-periodised and deleted without a full page reload.
- Layout autosave survives a hard refresh.
- Keyboard-only: add a card, move it, delete it.
- One shared poll timer per dashboard — assert exactly one interval regardless of card count.

### Phase 8 — Migration & cleanup
**Build:** convert the seven legacy dashboard files (`Dashboard.jsx`, `Admin/Dashboard.jsx`, `Admin/ExecutiveDashboard.jsx`, `Dashboards/{Accountant,Cashier,Purchasing,Viewer}Dashboard.jsx`) into **seeded default layouts** on the new system. Delete the files.

**Accept:**
- Each old role dashboard has a seeded layout that reproduces its cards, and the old file is gone.
- The incomplete JS span-recalculation in `Dashboard.jsx:48–65` is gone — the grid handles gaps natively, so the layout bug documented in `PART_A_DASHBOARD_CARDS.md` cannot recur.
- `Admin/Dashboard.jsx` and `ExecutiveDashboard.jsx`'s zero-gating problem is gone by construction: every card is now gated in the Core.
- The dead `canReports` variable and the three competing inline permission checks in `Dashboard.jsx` are deleted.

---

## 11. Testing

| Test | Asserts |
|---|---|
| `MetricRegistryTest` | Every definition has every required field; every `provider::method` exists; no duplicate keys; every `charts` entry is legal for the declared `shape`; every metric has a `generic` label |
| `MetricPeriodTest` | All 17 periods, tenant timezone, fiscal year start, comparison windows, leap/DST edges |
| `MetricGateTest` | Permission / feature / capability each independently block; blocked metrics execute zero queries |
| `MetricParityTest` | New Core output == old `WidgetDataService` output, per widget, on the golden dataset |
| `MetricConsistencyTest` | Every §4 canonicalisation holds simultaneously |
| `MetricPerformanceTest` | A 24-card dashboard resolves in < 2 s warm, < 6 s cold, on the golden dataset |
| `DashboardSanitizerTest` | Downgrade hides without deleting; upgrade restores; deprecated keys migrate; caps enforced |
| `MetricApiTest` | Every endpoint, every error code, the 24- and 40-caps, the illegal-chart 422 |
| `ChartRegistryTest` (JS) | Frontend and backend chart maps agree exactly |
| `ChartRenderTest` (JS) | Every chart renders every compatible fixture shape without throwing, in both themes |
| `SignedLabelTest` | Negative values produce the loss-side label everywhere |

Golden dataset: reuse the existing `tests/tests/Feature/Golden/` fixtures. Tests run against `amd_pos_test` (MariaDB — **never SQLite**, per `CLAUDE.md`).

---

## 12. Risks

| Risk | Mitigation |
|---|---|
| Moving ~190 computations out of controllers regresses report pages | Snapshot every report page's figures on the golden dataset *before* Phase 2; the snapshot is the acceptance gate |
| Canonicalisation changes numbers users have seen for months | Ship Phase 3 with a changelog entry per §4 decision and an in-app note on the affected reports for one release |
| bklit (React 19 / Tailwind 4 era) fights the app (React 18 / Tailwind 3) | Phase 5 begins with a spike installing three charts only; if it fails, pin versions and scope bklit's Tailwind config to the chart directory before continuing |
| A 40-card dashboard hammers the DB | Provider batching, per-metric cache TTL, prefix invalidation, the 24-per-request cap, and the 6-second budget — all specified, all tested in `MetricPerformanceTest` |
| Registry sprawl — 250 keys becomes unmaintainable | One file per domain provider; `MetricRegistryTest` fails the build on a malformed definition; keys are immutable so nothing churns |
| Users build dashboards that mislead them | Shape→chart legality, the zero-baseline rule for bars, the null-on-zero-baseline rule for `change_pct` (already correct in `WidgetDataService`), and `not_applicable` instead of `0` |

---

## 13. Open decisions for the founder

1. **Custom metrics.** Should a user be able to define `revenue − payroll` as their own card, or is the catalogue closed? A closed catalogue is safer and is what this spec builds; a formula builder is a natural Phase 9.
2. **Overstock threshold.** `inventory.overstock_count` needs a definition. Fixed multiple of `min_stock_alert`, days-of-cover, or a per-product field?
3. **Dormancy window.** `party.dormant_count` — 60 days, 90 days, or per-vertical (a restaurant's dormant guest is not a wholesaler's dormant account)?
4. **Heavy-discount threshold.** Currently client-computed with an implicit constant. Tenant setting, or fixed at 20%?
5. **Fiscal year.** Is a tenant fiscal-year-start field already stored? `this_year` / `this_quarter` need it; if absent, they fall back to the calendar year and that needs to be stated in the metric `help` text.
6. **Published dashboards.** May an Owner force a layout onto a role, or only offer it as that role's default until the user customises? This spec assumes the latter.
7. **Platform metrics on tenant dashboards.** Confirmed out of scope — `platform.*` is Platform Admin only and never appears in a tenant's picker.

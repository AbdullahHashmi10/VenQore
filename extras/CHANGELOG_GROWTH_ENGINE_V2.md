# Growth Engine V2 — Diagnosis & Rebuild

**Date:** 2026-08-01
**Scope:** Complete rebuild of the Growth Engine — data layer, brains, learning loop, scheduling, API and UI.

---

## 1. The headline finding

**The Growth Engine had never produced a single genuine insight for any tenant, ever.**

Not "rarely". Structurally never. Here is the proof chain:

| Step | Evidence |
|---|---|
| V1 read sales from `invoices` filtered to `type = 'sale'` | `AiRetentionService.php:39-43`, `RunGrowthEngine.php:107-118` |
| `PurchaseService::create()` writes `'type' => 'purchase'` | `app/Services/PurchaseService.php:35` |
| `PurchaseService` returns write `'type' => 'purchase'` | `app/Services/PurchaseService.php:208` |
| `SmartFulfillmentService` (VenSynQ JIT) writes `'type' => 'purchase'` | `app/Services/SmartFulfillmentService.php:291` |
| **Every writer of `invoices` sets `purchase`. Nothing ever sets `sale`.** | — |
| Real sales go to `sales` / `sale_items` | `SaleController.php:264-295` (`Sale::create`, `status => 'posted'`) |

So `Invoice::where('type','sale')` returned an empty set on every run, for every tenant, since the feature shipped. All three brains then cascaded off that:

- **Brain A (Retention)** — zero customers passed `$invoices->count() >= 3`, so `customer_analytics` was never populated.
- **Brain B (Forecaster)** — reads `customer_analytics`, which Brain A never filled. Zero output by construction.
- **Brain C (Churn)** — also reads `customer_analytics`. Zero output by construction.
- **Recovery alerts** — the only rule that used the GL directly, so it was the *only* thing that ever fired. That is why the feature appeared to "check off very rarely" rather than being obviously broken.

Two further filters would have suppressed it even with correct data: `whereIn('status', ['paid','posted'])` on a column whose values are `paid|unpaid|partial|received`, and a hardcoded `Rs 5,000` minimum order value.

---

## 2. Every defect found

### Correctness

| # | Defect | Location |
|---|---|---|
| 1 | Reads a table that contains no sales | `AiRetentionService.php:39` |
| 2 | Status filter includes `'posted'`, which `invoices` never uses | `AiRetentionService.php:41` |
| 3 | Requires ≥ 3 invoices — excludes all new customers by design | `AiRetentionService.php:45` |
| 4 | Demand model = "last basket repeats exactly, per customer" | `RunGrowthEngine.php:129-143` |
| 5 | Lateness = flat `1.3 ×` average gap for every customer regardless of volatility | `AiRetentionService.php:66` |
| 6 | Predicts from a single interval (`count >= 3` invoices = 2 gaps) with no confidence measure | `AiRetentionService.php:60` |
| 7 | Walk-in placeholder party would aggregate thousands of unrelated sales into one "customer" | `SaleController.php:271` |
| 8 | Revenue-only: never reads cost, margin or discount despite FIFO COGS being stored per line | throughout |
| 9 | Recovery alert has no ageing, no due date, no invoice reference | `RunGrowthEngine.php:261-308` |
| 10 | Hardcoded `Rs`, hardcoded `92` country code, hardcoded Rs 5,000 threshold | `GrowthEngineController.php:152-157`, `RunGrowthEngine.php:86` |

### Lifecycle & data model

| # | Defect | Location |
|---|---|---|
| 11 | Three different, mutually inconsistent duplicate checks (`startOfDay` / `startOfWeek` / `is_read = false`) | `RunGrowthEngine.php:166,225,286` |
| 12 | `is_dismissed` filtered the read query but was never checked at generation — dismissed signals returned the next day | `AiRecommendation.php:51` |
| 13 | Signals were never resolved; a fixed problem stayed on the dashboard until `valid_until` lapsed | — |
| 14 | No outcome tracking at all — the engine could not know or report whether anything it said was true | — |
| 15 | `type` locked to a 4-value ENUM; adding an insight required a migration | migration `2026_01_08_181305` |
| 16 | Zero composite indexes on `ai_recommendations`; every dashboard load filesorted the table | migration `2026_01_08_181305` |
| 17 | Ranking by a 4-value priority enum only — a Rs 400 alert outranked a Rs 90,000 receivable | `GrowthEngineController.php:101` |

### Performance & server load

| # | Defect | Location |
|---|---|---|
| 18 | **`refresh()` ran `growth:analyze --force` synchronously, in-request, for EVERY tenant on the platform** | `GrowthEngineController.php:65` |
| 19 | `--force` **deleted** all recommendations and analytics before regenerating, destroying owner state | `RunGrowthEngine.php:55-57` |
| 20 | Per-customer query loop: ~3 queries × N customers, plus one `updateOrCreate` each | `AiRetentionService.php:37-83` |
| 21 | All tenants processed sequentially in one process | `RunGrowthEngine.php:39-42` |
| 22 | No incremental skip — full recomputation nightly regardless of activity | — |
| 23 | 14 queries to save 7 settings | `GrowthEngineController.php:214-238` |

### Frontend

| # | Defect | Location |
|---|---|---|
| 24 | **Rendered 3 hardcoded fake recommendations** ("Bilal General Store…") whenever real data was empty — i.e. always | `GrowthDashboard.jsx:20-51` |
| 25 | Buttons rendered `rec.action`, a field the backend never sent — blank on every real card | `GrowthDashboard.jsx:151` |
| 26 | Four filter buttons wired to `useState` that filtered nothing | `GrowthDashboard.jsx:107-120` |
| 27 | `stats.potential_revenue` summed a paginated subset and labelled it the total | `GrowthEngineController.php:108` |
| 28 | **`GrowthEngine/Settings.jsx` did not exist** — the settings route threw on load | route `growth-engine.settings` |

---

## 3. What replaced it

### Four brains (was three, all dead)

| Brain | Insight types | Notable |
|---|---|---|
| **A — Customer** | due-soon, overdue, churn risk, lost, spend falling, rising star, VIP concentration, first-repeat, credit risk, cross-sell | Lateness in **standard deviations of each customer's own gap**, not a flat multiple of an average |
| **B — Inventory** | stockout now, stockout imminent, reorder breach, demand surge, dead stock, cash trapped, expiry risk, high return rate | Velocity over 7/30/90-day windows; timed against the tenant's **learned supplier lead time** |
| **C — Profit** *(new)* | margin erosion, selling below cost, discount leakage, price headroom, unprofitable customer, mix shift | FIFO-accurate from `sale_item_batches.total_cogs` — reconciles with the accounting module |
| **D — Cash & Ops** | overdue receivables (aged), concentration risk, collections slowing, payables due, revenue anomaly, peak hours, quiet day, staff discount outlier | Anomalies vs the tenant's **own weekday median/MAD**, not a global constant |

**32 insight types, up from 4.**

### The maturing loop

```
brains emit  →  owner acts / dismisses / ignores  →  OutcomeEvaluator grades
     ↑                                                        ↓
ThresholdTuner adjusts sensitivity  ←  growth_brain_stats (precision, engagement)
```

- Pure statistics. **No LLM** — deterministic, free, auditable, works offline.
- Precision ("was it true?") and engagement ("did they care?") tracked separately.
- Sensitivity clamped to `[0.5, 1.8]`; ±10% per pass; nothing tunes below 8 generated / 5 graded.
- Persistently wrong or ignored insight types are **temporarily muted** — every mute expires, and the owner can lift it.
- Only *predictions* are graded. *Observations* ("dead stock") are marked `n/a` rather than inflating the accuracy figure.
- The intervention problem is handled honestly: if the owner acted and the bad outcome was avoided, that is a **hit**; if they did nothing and it resolved anyway, that is a **miss**.

### Learned scale (replaces hardcoded constants)

| Figure | Derived from |
|---|---|
| Median order value | Median of last 180 days of sales |
| Median reorder gap | Median `LAG()` gap across all customers |
| Supplier lead time | Median gap between repeat purchases of the same product |
| Payment terms | Average `due_date - posted_at` on real invoices |
| Materiality floor | 50% of median order value |

### Server load — 24× more frequent, far cheaper

| | V1 | V2 |
|---|---|---|
| Cadence | 1×/day | Hourly light + nightly deep |
| Queries/tenant | ~3N + 2N (N = customers) | ~12, set-based |
| Execution | Sequential, inline | One queued job per tenant, `ShouldBeUnique` |
| Unchanged tenant | Full recompute | **Skipped after 1 indexed query** (watermark) |
| Refresh button | All tenants, in-request, destructive | Current tenant only, queued, rate-limited |

---

## 4. Files

**New (19)**

```
database/migrations/2026_08_01_000001_growth_engine_v2_schema.php
app/Services/Growth/GrowthDataSource.php      GrowthContext.php    GrowthEngine.php
app/Services/Growth/Signal.php                SignalRepository.php InsightCatalog.php
app/Services/Growth/ThresholdTuner.php        OutcomeEvaluator.php MetricSnapshotter.php
app/Services/Growth/Brains/{Customer,Inventory,Profit,Cashflow}Brain.php
app/Models/{GrowthBrainStat,GrowthMetricSnapshot,GrowthRun,GrowthSignalEvent,ProductAnalytics}.php
app/Jobs/RunGrowthEngineForTenant.php
app/Console/Commands/{EvaluateGrowthOutcomes,SnapshotGrowthMetrics}.php
resources/js/Pages/GrowthEngine/Settings.jsx          ← route existed, file did not
```

**Rewritten (6)**

```
app/Console/Commands/RunGrowthEngine.php
app/Http/Controllers/GrowthEngineController.php
app/Models/AiRecommendation.php
resources/js/Pages/GrowthEngine/GrowthDashboard.jsx
routes/console.php   (schedule block)
routes/web.php       (+5 routes)  ·  app/Providers/AppServiceProvider.php (singletons)
```

**New tables:** `product_analytics`, `growth_brain_stats`, `growth_metric_snapshots`, `growth_runs`, `growth_signal_events`
**Extended:** `ai_recommendations` (+21 cols, 4 indexes), `customer_analytics` (+22 cols, 3 indexes)

---

## 4b. Marketing / features page

The `/features` page already carried a Growth Engine demo, but it had gone stale relative to the product:

| Defect | Fix |
|---|---|
| Section branded **"AI Growth Engine"** with an "AI ENGINE" badge — V2 contains no LLM at all | Rebranded to **Growth Intelligence Engine**. The non-AI nature is now stated as a strength (deterministic, no API key, no per-run cost, publishes its own accuracy) |
| Copy said "Three models" | Four brains, with a working brain-switcher |
| 3 static cards, no interaction | Interactive: pick a brain → pick a signal → see the **evidence table** behind it |
| Nothing showed the learning loop — the main differentiator | New "It scores itself" panel with per-insight-type hit rates and a plain-English explanation of why observations are excluded from the score |
| Demo used **"Bilal General Store"** — the same fake customer hardcoded into the real product page | Replaced with realistic figures that mirror actual V2 output |
| An "Ask in plain English" chat panel was shown *under the Growth Engine* — that is the chatbot, a different feature | Removed; it misattributed AI-chat capability to a non-AI engine |
| Catalog had 3 thin entries (Return Predictor / Depletion Forecaster / Churn Detector) | New **"Growth Intelligence"** catalog category with 46 entries covering all four brains plus the self-scoring loop. Catalog total 216 → **259** |
| No deep-dive page (controller allowed only 4 slugs) | Added `/features/growth-engine` — hero, 6 pain points, 12 feature cards, comparison table, 7 FAQs, cross-links |

Also wired the new slug into `MarketingSeo` (title, description, keywords, FAQ JSON-LD, static prerender HTML) and `SitemapController`.

**Marketing files touched:** `resources/js/Pages/Marketing/Features.jsx`, `resources/js/Data/featurePages.js`, `app/Http/Controllers/Marketing/FeaturesController.php`, `app/Http/Controllers/Marketing/SitemapController.php`, `app/Support/MarketingSeo.php`

---

## 5. Deployment

```bash
php artisan migrate
php artisan ziggy:generate     # REQUIRED — 5 new routes (build guard will fail otherwise)
php artisan optimize:clear
npm run build

# Queue worker must cover the new queue:
php artisan queue:work --queue=growth,default
```

Then seed the first run and baseline:

```bash
php artisan growth:snapshot --backfill=90
php artisan growth:analyze --mode=deep --sync --tenant=1
```

**Notes**

- The migration marks pre-existing V1 rows `expired` (not deleted) — read/dismiss history is preserved, the V2 feed starts clean.
- `--force` no longer deletes anything; it means "ignore the watermark".
- Requires **MySQL 8.0+** (window functions: `LAG`, `ROW_NUMBER`). Consistent with the project's MySQL-only policy.
- Accuracy figures stay hidden until ~15 predictions have been graded; the UI says "Learning your business" until then, by design.

---

## 6. Verification performed

- Balanced-delimiter + NUL-byte scan across all 27 changed/new files — clean.
- Both JSX files compiled with esbuild — clean.
- Every column referenced in raw SQL cross-checked against its migration.
- Every method call on the new services cross-checked against its definition.
- `tenant_id` bound explicitly on every table in every join (no reliance on global scopes in CLI/queue context).

**Two bugs caught and fixed during review:**

1. `overdueSales()` used `HAVING` without `GROUP BY` — a non-standard MySQL extension with ambiguous semantics under `ONLY_FULL_GROUP_BY`. Rewritten as a derived table.
2. Aggregate queries on `AiRecommendation` would have thrown under this project's `preventAccessingMissingAttributes()` (non-production), because the model's `$appends` accessors read columns the aggregate SELECT does not return. Fixed with `->toBase()`.

**Not verified** (no PHP runtime or MySQL in this environment): `php -l`, actual query execution, and end-to-end run. Recommend running `php artisan growth:analyze --sync --tenant=<id>` against the demo store first and checking `growth_runs.error`.

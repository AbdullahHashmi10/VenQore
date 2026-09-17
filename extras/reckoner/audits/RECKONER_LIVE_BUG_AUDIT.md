# VenQore — Reckoner / Dashboard Live Bug Audit

**Date:** 2026-09-16
**Scope:** Real production codebase at `app-code/main-app`, read directly from the linked computer. No code was changed — this is diagnosis only, for you to hand to your IDE/dev process.
**Tenant reported:** a "scale" tier tenant where the owner enabled all modules, but (1) some cards still say a module isn't opened, (2) not all 349 cards appear in the "add card" picker, and (3) Inventory Value / Revenue / sales feed don't reflect real, existing data.

Every claim below cites an exact file and line, verified by reading the file directly (per CLAUDE.md's own rule 6: verify by reading the changed/implicated file, don't trust a prior summary).

---

## Symptom 1 — "I enabled every module, but a card still says it's not opened"

**Root cause, confirmed: a second, hand-maintained module map on the frontend has drifted from the server's authoritative one.**

Server side, there is exactly one path and it is sound:

- `App\Services\ModuleService::enabled()` (`app/Services/ModuleService.php:70-87`) is the single function that decides whether a module is on for a tenant, backed by the `tenant_modules` table via `ModuleService::allFor()` (lines 267-282), cached 300s per tenant.
- `App\Http\Middleware\EnsureModule` (page-level gate, line 171) and `App\Reckoner\Reckoner::passesModules()` (card-level gate, `app/Reckoner/Reckoner.php:645-658`, called from `readMany()` and `checkAvailability()`) **both call this exact same function.** Page access and card gating cannot disagree server-side. That rules out the obvious hypothesis (page says on, card says off) at the server layer.

The actual divergence is client-side, and it's concrete:

- The server's ground truth for "which module owns which reading" is `ReckonerRegistry::MODULE_MAP` (`app/Reckoner/ReckonerRegistry.php:54-109`). For example:
  - `'finance.payables' => 'purchases'` (line 80)
  - `'finance.total_liquidity' => ['payments', 'cash_register', 'bank_accounts']` (line 85)
- The frontend re-derives the same mapping independently, by regex on the reading's key prefix, in `READING_MODULE_RULES` (`resources/js/Pages/NewDashboard.jsx:178-203`) — instead of reading the module tag the server already computes per reading. This table has no rule for `purchases`, `cash_register`, or `bank_accounts` at all. Both `finance.payables` and `finance.total_liquidity` fall through to a generic `/^finance\./` catch-all requiring `khata_credit`, `payments`, or `accounting_workspace` — a set that barely overlaps the server's real answer.

**Effect:** a tenant who enabled *Purchases* (but not Khata Credit / Payments / Accounting Workspace) gets a real, unlocked `finance.payables` value from the server. But the browser's own `readingAvailable()` — which feeds `addCard`, `availableCards()`, and `loadBoard()` (`NewDashboard.jsx` ~3172-3187) — checks the wrong module list, decides none of them are on, and refuses to place or offer that card. This is exactly "I turned everything on, but the card still won't show / still says locked" — the server never said it was locked; the browser did, using stale logic.

**Fix direction (for your IDE):** don't patch the regex table — delete it. `ReckonerRegistry::v6Catalog()` already computes each reading's owning module from `MODULE_MAP` when building the catalogue (`ReckonerRegistry.php` catalog builder, ~line 1761 and 1863-1866) — that field should be emitted per reading in the `readings` prop, and the frontend's `modulesOf()`/`readingAvailable()` should read it from there instead of re-deriving it. One source of truth, per the repo's own "point, never copy" rule, instead of two lists that can drift again the next time either side changes.

---

## Symptom 2 — "I can't see all 349 cards in the add-card picker"

**Finding: the picker itself is not filtering cards out. This is very likely a misreading of the auto-built dashboard, not a picker bug — with one real structural landmine found along the way.**

- `resources/js/Pages/ReckonerCatalog.json` (58 keys) currently **matches** `ReckonerRegistry::v6Catalog()`'s live output exactly — not stale right now. `DashboardController::fullDashboard()` / `fullDashboardExperimental()` (`app/Http/Controllers/DashboardController.php:516`, `705`) call `ReckonerRegistry::v6Catalog()` live and pass it as the `readings` Inertia prop; the JSON file is only used as a client-side fallback if that prop is ever missing (`NewDashboard.jsx:268-270`). So right now, nothing is silently serving a stale static list. (Note: this is only true *today* — there is no automated check enforcing the JSON and the live registry stay equal, so this exact bug could reappear silently the next time someone edits one side and forgets the other. Worth a CI guard, not just a one-time fix.)
- The add-card picker's own list, `renderLibrary()` (`NewDashboard.jsx` ~3026-3056), filters only by tab and search text — **not** by module. It lists every reading the server sent unconditionally. So the picker is not the thing hiding cards.
- What *does* limit what appears on the **initial, auto-generated** dashboard is slot count: `config/dashboard_frames.php` frames have 7-10 slots, against up to 58 readings that could theoretically fill them. The auto-fill (`FrameFiller::fill()`, `app/Services/Dashboard/FrameFiller.php:20-215`) exhausts every available candidate before leaving a slot empty, by design. If you're judging "did I get all my cards" from the dashboard as it loads by default, rather than by opening the picker and adding manually, most cards will look "missing" simply because there's no room — that's geometry, not a bug.
- If cards are missing from inside the picker itself (not just off the initial board), the mechanism is the same one as Symptom 1: a card whose module tag the server marks available but whose reading fails the client's independently-computed module check will look unavailable wherever `readingAvailable()` is consulted.

**One separate, real finding — dead code worth deleting:** `app/Services/Dashboard/DashboardRegistry.php` (a disjoint, legacy 20-widget catalog using entirely different keys — `revenue_today`, `sales_summary`, etc. — than the live `sales.revenue`-style Reckoner keys) and its companion `app/Traits/ResolvesDashboardWidgets.php` are **both confirmed unreachable from any live route** — a full-tree check found zero controllers referencing either. `ResolvesDashboardWidgets` even imports `DashboardRegistry` but never calls it. This is precisely the class of landmine CLAUDE.md's own "point, never copy" section warns about (it directly cites a prior incident where a dashboard advertised 108 readings against only 25 that computed). It isn't causing today's bug, but it should be deleted before it confuses the next person who touches this area — don't fix the generator here, there's no generator; just remove both files.

---

## Symptom 3 — "Real inventory/sales data exists, but Inventory Value, Revenue, and the sales feed don't reflect it"

**This is the one that needed the deepest trace. Good news first: the tenant-isolation layer is sound.**

- `App\Traits\HasTenant` registers a real Eloquent global scope (`app/Traits/HasTenant.php:51-81`) that filters by `app('current.tenant')->id`, bound once per request by `TenantMiddleware::handle()` (`app/Http/Middleware/TenantMiddleware.php:184`) after resolving the tenant from the store-slug route. It is applied to every model this bug touches — `Product`, `Stock`, `SalesOrder`, `StockTake`, `StockTransfer` — confirmed by reading each model file directly. If no tenant is bound and no verified active membership exists, the scope **fails closed** (`whereRaw('1 = 0')`, line 80) rather than leaking or silently reading the wrong tenant. So this bug is not a cross-tenant leak, and it is not a case of the wrong tenant's numbers showing up.
- `FinancialReportingService::getInventoryValue()` (`app/Services/FinancialReportingService.php:1230-1239`) computes live, uncached, directly from `inventory_batches` filtered by `tenant_id` and `remaining_qty > 0`. No queue, no rollup table, no stale snapshot in the way. If the tenant context is ever unbound it returns `0.0` immediately rather than querying unscoped — again fails closed, not wrong. Same pattern in `getProfitAndLoss()` (lines 58-183): tenant-scoped, live, no caching layer.
- `InventorySource.php` itself already does the right thing and says so in its own docblock (`app/Reckoner/Sources/InventorySource.php:12-29`): it deliberately reads live from the `stocks` table (`SUM(quantity) GROUP BY product_id`) rather than the denormalized `products.stock_quantity` column, specifically because that column is documented to drift from the real per-warehouse ledger.

**So where does "real stock exists but the card shows nothing" actually come from?** Given every layer above checks out, the two most likely remaining explanations — genuinely still open, not verifiable from source alone — are:

1. **The request context has no bound tenant when the Reckoner runs for this call.** Everything in this chain fails closed to zero/blocked rather than wrong, which matches "shows nothing" better than "shows wrong data." Check whether the specific page/request the owner is looking at goes through the normal `store.*` route group (where `TenantMiddleware` runs) — an API path, a cached page, or a request that bypasses that middleware group would silently get `0.0`/blocked results everywhere, which is exactly this symptom.
2. **A stale value in the OLD read path.** `InventorySource.php`'s own comment explicitly flags that `ReportController::lowStock()` and `WidgetDataService::widgetLowStock()` still use the older `products.stock_quantity`/`quantity` columns (also still present as fillable fields on `Product`, `app/Models/Product.php:25`) instead of the live `stocks` table. If the specific card/page the owner is looking at is served by one of those older paths rather than the Reckoner, it would show stale/zero data even though the Reckoner's own number would be correct. Worth checking which controller actually serves the exact card the owner says is wrong (Inventory Value, Revenue, sales feed) — confirm it's going through `ReckonerRegistry`/`Reckoner::readMany()`, not one of these older, unconverted read paths.

**Fix direction for your IDE:** don't touch `HasTenant`, `TenantMiddleware`, or `getInventoryValue()` — all three are correct. Instead: (a) confirm the exact controller/route serving the specific dashboard the owner is viewing actually resolves through `Reckoner`/`ReckonerRegistry`, not a legacy `ReportController`/`WidgetDataService` path still reading `products.stock_quantity`; (b) as defense-in-depth, migrate any remaining reads of `products.stock_quantity`/`quantity` to the live `stocks` table the way `InventorySource.php` already models, and consider dropping those two columns once nothing reads them, per "fix the generator, not the copy."

---

## Prioritized fix list

1. **(Symptom 1, confirmed root cause)** Remove `READING_MODULE_RULES` from `resources/js/Pages/NewDashboard.jsx` (~lines 178-203). Have the `readings` Inertia prop carry each reading's module tag (already computed server-side from `ReckonerRegistry::MODULE_MAP`) and have `modulesOf()`/`readingAvailable()` read it from there instead of re-deriving it by regex.
2. **(Symptom 3, needs one more check, then likely a routing fix not a data fix)** Confirm the specific Inventory Value / Revenue / sales-feed cards the owner sees are served via `Reckoner::readMany()` and not a legacy controller (`ReportController::lowStock()`, `WidgetDataService`) still reading `products.stock_quantity` instead of the live `stocks`/`inventory_batches` tables.
3. **(Symptom 2, cleanup, prevents a future recurrence)** Delete `app/Services/Dashboard/DashboardRegistry.php` and `app/Traits/ResolvesDashboardWidgets.php` — both confirmed dead, unreachable from any route, and a second unsynchronized card catalog waiting to confuse someone later.
4. **(Hardening, not a live bug)** Add a CI/build check that `resources/js/Pages/ReckonerCatalog.json`'s key set stays equal to `ReckonerRegistry::v6Catalog()`'s live output, so this specific failure class (documented three times before in this codebase per CLAUDE.md) can't silently reappear.
5. **(Hardening, not a live bug)** Add explicit `tenant_id` filters inside `InventorySource.php`/`OperationsSource.php`'s queries (matching the pattern already used in `SalesSource.php`/`FinanceSource.php`/`PurchasingSource.php`), so these two sources don't rely solely on `HasTenant`'s global scope — removes the one remaining edge case (a platform-admin auth context with no bound tenant) where the scope's documented superadmin bypass could return unscoped data if a Reckoner source were ever called from that context.

---

## What was checked and is *not* the cause

To save re-litigating these: `HasTenant`'s global scope is correctly registered and applied to every relevant model; `TenantMiddleware` correctly binds the tenant per request; `ModuleService::enabled()` and `EnsureModule` middleware use identical logic and cannot disagree server-side; `FinancialReportingService::getInventoryValue()` and `getProfitAndLoss()` are live, tenant-scoped, and uncached; `ReckonerCatalog.json` is currently in sync with the live registry and is not the active cause of missing cards; the add-card picker does not filter by module.

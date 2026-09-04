# VenQore POS — CLAUDE.md

This is the authoritative context file for AI agents working in this codebase. Read this before doing anything.

## ⛔ ACTIVE WORK — read these before starting anything

| File | What it is |
|---|---|
| **`PHASE_0_STATUS.md`** | **Start here.** What is done, what is next, and the rules for working in this repo right now |
| **`V6_ROLLOUT_AUDIT_AND_PLAN.md`** | **The design rollout. Audit, architecture and 9 phases. Read before touching any styling** |
| `DESIGN-RULES.md` | Authoritative design and styling rules (**v3.0, V6-aligned**) — colors, radii, hover effects, type scale, z-index, CI greps |
| `VENQORE_LAYOUT_LAW.md` | Geometry law v2.0 — grid, gutters, row track, card categories C1–C6. **Outranks DESIGN-RULES on any geometry number** |
| `VENQORE_TECHNICAL_BUILD_PLAN_V4.md` | The authoritative technical plan — phases, tasks, acceptance criteria |
| `VENQORE_PRICING_AND_STRATEGY.md` | Pricing, plan limits, AI quotas and the reasoning behind them |

**Do not invent phases, do not replace the plan file, and do not mark a task complete unless its acceptance criteria in the plan actually pass.** If the plan is unclear or looks wrong, say so — do not substitute your own.

### ⛔ Design precedence — settled 21 Aug 2026

Three documents govern the look of this product. When they disagree:

1. **`VENQORE_LAYOUT_LAW.md` v2.0** — geometry (grid, gutter 24px, row track 64px, card fits, shell regions).
2. **V6 design system** — `extras/Design System/VenQore Design System/tokens/*.css` — every *value* (colour, type, radius, elevation, motion, density). **286 tokens. This is the only place a value may be typed.**
3. **`DESIGN-RULES.md` v3.0** — structure (z-index ladder, hover contract, component contracts, chart rules, CI enforcement).

Rank 3 never overrides rank 1 or 2 on a value.

**Superseded — do not read, do not follow:**
`resources/css/venqore-tokens.css` · `venqore.tailwind.js` · `DESIGN-RULES.v2.0.superseded.md` · `VENQORE_CARD_BUILDER_BUILD_SPEC.md` §7.2.

> The V6 token folder's own comments call it "v5". **"V6" and "v5" name the same token set** — the one with `--vq-r-lg: 20px`, Plus Jakarta Sans and `--vq-dur-1: 120ms`. The values are the identity, not the label.

**Known live defect:** Tailwind resolves `rounded-lg` through `--vq-radius-lg`, not `--vq-r-lg`. Those tokens have never been connected, so `rounded-lg` currently renders at **8px** instead of V6's 20px. Fixing that one link re-skins all 312 pages. See `V6_ROLLOUT_AUDIT_AND_PLAN.md` Phase 0.

**Before deleting any page:** check `routes/web.php`. Inertia resolves pages by string name, so "zero imports" does not mean dead.

## Deliverable Format Preference

- **Default to Markdown (`.md`) for written deliverables** (reports, plans, findings, summaries, audits, etc.). Do **not** produce `.docx` files by default.
- Only use a different format (`.docx`, `.pdf`, `.xlsx`, etc.) when the user explicitly asks for that format in the request.

## Project Overview

**VenQore POS** is a multi-tenant SaaS Point-of-Sale and ERP system built for small-to-medium retail and food businesses. It is a Laravel 12 + React 18 (Inertia.js) monolith with offline-capable POS, full accounting, inventory management, WooCommerce integration, and a platform/superadmin layer.

- **App name:** VenQore POS
- **Database:** `venqore_pos` — **MariaDB 10.5** in production (local: root / no password)
- **App URL:** http://127.0.0.1:8000
- **Domain:** venqore.com
- **Queue:** ⚠️ `.env` currently sets `QUEUE_CONNECTION=sync` — jobs run **inline in the web request**, not in the background. Must become `database`. See `PHASE_0_STATUS.md`.

> ### ⚠️ Production environment — corrected 2026-08-04
>
> | Previously documented | Actual |
> |---|---|
> | PHP 8.2 | **PHP 8.4** |
> | MySQL | **MariaDB 10.5** — EOL since June 2025, upgrade to 10.11 LTS pending |
> | Queue: database | `sync` — no background processing |
> | — | **No Redis.** Cache/session/queue must all use the `database` driver |
>
> **MariaDB implications:** use `DB_CONNECTION=mariadb` (Laravel's `mysql` driver defaults to `utf8mb4_0900_ai_ci`, a MySQL-only collation MariaDB does not have). MariaDB 10.5 has no `SKIP LOCKED`, so the database queue is limited to **one worker** until the upgrade.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | PHP 8.4 (local 8.2+), Laravel 12 |
| Frontend | React 18, Inertia.js v2, Tailwind CSS v3 |
| Build tool | Vite 7 |
| Database | MariaDB 10.5 (driver: `mariadb`) |
| Queue / Cache | Database driver (`QUEUE_CONNECTION=database`, `CACHE_STORE=database`) |
| Auth | Laravel Sanctum + Breeze |
| PDF | barryvdh/laravel-dompdf |
| Excel | maatwebsite/excel |
| Offline DB | Dexie.js (IndexedDB) |
| Charts | Recharts |
| Icons | Lucide React |
| Barcodes | picqer/php-barcode-generator |
| Routing (JS) | Ziggy (tightenco/ziggy) |
| Queue UI | Laravel Horizon |
| Social Auth | Laravel Socialite |
| Storage | AWS S3 (configured via .env) |

---

## Key Commands

### Development
```bash
# Start Laravel dev server
php artisan serve

# Start Vite (frontend)
npm run dev

# Build frontend for production
npm run build
```

### Database
```bash
php artisan migrate
php artisan migrate:fresh --seed
php artisan db:seed
php artisan migrate:rollback
```

### Cache / Config
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear   # clears all at once
```

### Queue
```bash
php artisan queue:work
php artisan horizon
```

### Testing
```bash
php artisan test
./vendor/bin/phpunit
```

### Tinker
```bash
php artisan tinker
```

### WooCommerce Sync
```bash
php artisan woocommerce:sync-stock   # syncs "dirty" products every 5 min via scheduler
```

---

## Architecture

### Multi-Tenancy
- Each **Store** is a tenant (`Tenant` model). All data is scoped by `tenant_id`.
- A `User` can belong to multiple stores via `TenantUser` pivot.
- The active tenant is resolved per request (subdomain or session).
- A **Platform/SuperAdmin** layer exists above tenants at `app/Http/Controllers/SuperAdmin/`.

### Backend Structure
```
app/
  Console/          — Artisan commands
  Http/
    Controllers/    — One controller per feature area (Sale, Purchase, Inventory, etc.)
      Admin/        — Store-level admin controllers
      SuperAdmin/   — Platform-level controllers
      Api/          — API-only controllers
      Auth/         — Auth controllers
  Models/           — Eloquent models (all tenant-scoped via tenant_id)
  Services/         — Business logic (InventoryService, PurchaseService, SaleReversalService, etc.)
  Jobs/             — Queued jobs
  Mail/             — Mailable classes
  Exports/          — Excel exports (maatwebsite)
  Imports/          — Excel imports
  Helpers/          — Utility helpers
  Traits/           — Reusable model/controller traits
  Providers/        — Service providers
routes/
  web.php           — All web + Inertia routes (very large file)
  api.php           — API routes
  auth.php          — Auth routes
```

### Frontend Structure
```
resources/js/
  Pages/            — Inertia page components (maps 1:1 to routes)
    Auth/           — Login, Register, etc.
    Dashboard.jsx   — Main dashboard
    Pos.jsx         — POS terminal (offline-capable)
    Sales/          — Sale transactions
    Purchases/      — Purchase transactions
    Inventory/      — Stock management
    Parties/        — Customers & Suppliers
    Accounting/     — Journal entries, chart of accounts
    Finance/        — Funds, bank accounts
    Settings/       — Store settings
    SuperAdmin/     — Platform admin pages
    Admin/          — Store admin pages
    Marketing/      — Public marketing pages
    Hub/            — Multi-store hub
    ...
  Components/       — Shared React components
  Layouts/          — Layout wrappers
```

---

## ⛔ Source-of-truth map — read before adding anything

**The one rule: point, never copy.** Every hand-maintained second copy of a truth
in this repo has drifted and lied. `config/ai_models.php` was a model registry
nothing read. The V6 dashboard advertised 108 readings against 25 that computed.
`ReckonerCatalog.json` was a static mirror of a live registry. Each fix was the
same: delete the copy, generate from the source.

So: if you need a list of something, **import it from the authority below**. Do not
restate it here, in a config file, in a JSON asset, or in a component.

| What | Authority | Notes |
|---|---|---|
| Metrics / readings | `app/Reckoner/ReckonerRegistry.php` | `::all()`, `::exists()`, `::v6Catalog()`. The only place a number is defined. |
| How a metric is computed | `app/Reckoner/Sources/*Source.php` | One `resolveBatch()` per source; a source must answer N requests in ~1 query. |
| Dashboard cards | `app/Services/Dashboard/DashboardRegistry.php` | Card definitions, `SIZES`. |
| Card geometry / layout legality | `app/Reckoner/LayoutLaw.php` + `VENQORE_LAYOUT_LAW.md` | `resolveFit()`, `sizeLegal()`, `fitToGrid()`. Never compute geometry by hand. |
| V6 reading catalog (frontend) | Generated by `ReckonerRegistry::v6Catalog()`, passed as the `readings` Inertia prop | `ReckonerCatalog.json` is a build fallback, not a source. |
| **All** LLM calls | `app/Services/Ai/AiGateway.php` | The only entry point. See below. |
| Provider HTTP | `app/Services/Ai/Providers/` | The **only** directory allowed to contain a provider URL. |
| AI model choice per feature | `config/ai_models.php` | Read by the gateway. Includes `deprecation_audit`. |
| AI rate limits / spend caps / timeouts | `config/ai_limits.php` | Per-feature. |
| Machine-readable system map (for Vena) | `storage/app/system-manifest.json` | **Generated** — `php artisan venqore:manifest`. Never edit by hand. |
| Design tokens | `extras/Design System/…/tokens/` | Type scale bumped 22 Aug 2026 for POS legibility. Two radii only: 14px and pill. |

### The AI layer

All AI goes through one door:

```php
$result = app(AiGateway::class)->resolve(
    AiRequest::for('scan_printed')->tenant($tenant)->input([...])->context($ctx)
);
```

`AiGateway::resolve()` owns, in this fixed order: entitlement → rate limit
(`{feature}:{tenant_id}`) → spend cap → resolver pipeline → usage recording. A call
site must never do any of those itself, and must never build an HTTP request.

The pipeline is an ordered list in `config/ai_limits.php → resolvers`. Today only
`ModelResolver` is registered. `DeterministicResolver`, `MemoryResolver` and
`CacheResolver` are prepended later; **no call site changes when they are.** That
is the whole point of the seam — do not bypass it.

`AiResult` carries `source`, `confidence`, `costUsd` and `learnable` on every
result. Populate them even when trivially known.

### Context discipline

Cheap and accurate come from the same place: **send less.** Aggregate in PHP, then
send a small pre-computed payload. Never send raw rows and ask the model to
analyse them. `ContextBudget` exists for this; use it rather than hand-trimming.

Precedent worth copying (`SmartCaptureController`, tags `T0-3`/`T0-6`): the party
list was removed because the local fuzzy matcher already ran over the result
afterwards; expense categories became conditional; thinking budget dropped 1024 →
256 because thinking bills at output rates.

### Correctness: the laws, not the assertions

`tests/tests/Feature/Reckoner/Laws/` holds eight laws that each iterate the whole
registry: L1 tenant isolation, L2 grouping conservation, L3 period additivity,
L4 comparison symmetry, L5 empty tenant, L6 permission law, L7 reversal, L8
registry contract.

**Adding a reading requires zero new test code** — the laws cover it automatically.
That is deliberate: per-reading tests scale linearly and rot; laws scale
sub-linearly. If you add a reading, add its registry definition and its
golden-company expected value, and let the laws do the rest.

A reading that is arithmetic over other readings must declare `derived` with a
`compute` closure instead of carrying its own query — then it *cannot* disagree
with its components. See `finance.net_margin_pct`, `sales.gross_margin_pct`,
`finance.expense_ratio`.

### Rules for agents working in this repo

1. Never write a provider URL outside `app/Services/Ai/Providers/`.
2. Never build SQL from model output. Generated queries do not inherit the
   `HasTenant` global scope; a missing `tenant_id` is a cross-tenant financial leak.
3. Never display a number that did not come from the Reckoner.
4. Never render a placeholder or sample figure in a tenant-facing build.
5. Never hand-edit a generated file. Fix the generator.
6. When you claim work is done, verify by reading the file you changed — file paths
   in summaries have been wrong three times while the work itself was correct.

---

## Key Domain Concepts

### Inventory
- **FIFO stock deduction** on every sale.
- **Composite products** (e.g., Garam Masala): made from raw material recipes.
  - **Mode A (Make Now):** Auto-deducts raw materials when composite stock is zero.
  - **Mode B (Ready Made):** Sells from pre-manufactured stock.
- **Batch tracking** with expiry dates.
- **Serial tracking** for serialised items.
- **Multi-barcode** support per product.
- **Negative stock** allowed (tracked separately).
- **Multi-unit** support (base unit + secondary unit with conversion ratio).

### Transactions
- Core models: `Sale`, `Purchase`, `Expense`, and `Invoice`.
- `Allocation` — links payments to invoices/sales/purchases (partial payment support).
- `JournalEntry` / `JournalItem` — double-entry accounting auto-generated on each transaction.

### POS Terminal
- `Pos.jsx` — offline-first, uses Dexie.js (IndexedDB) to cache products.
- Syncs back to server when online.
- Supports barcode scanning, cart, discounts, multiple payment modes.

### Multi-Store / SaaS
- `Tenant` model = one store/business.
- `Platform` model = the VenQore platform itself (SuperAdmin layer).
- Plans, plan limits, and plan features control feature access per tenant.
- `StoreLicense` tracks subscription status.
- `AppSumoCode` for AppSumo LTD redemption.
- `Coupon` / `CouponRedemption` for discount codes.

### WooCommerce Integration
- Webhook receiver auto-creates sales from WooCommerce orders.
- Stock sync command pushes inventory changes back to WooCommerce via API.
- SKU-based product matching.

---

## Important Models

| Model | Purpose |
|---|---|
| `Tenant` | A store / business (tenant) |
| `User` | Platform user (can belong to many tenants) |
| `TenantUser` | Pivot: user ↔ tenant with role & permissions |
| `Product` | Product catalogue |
| `Stock` | Stock batches (FIFO) |
| `Allocation` | Payment-to-invoice linking (unified) |
| `Party` | Customer or Supplier |
| `JournalEntry` / `JournalItem` | Double-entry accounting |
| `Warehouse` | Physical location for stock |
| `Terminal` | POS terminal registration |
| `Setting` | Per-tenant key-value settings |
| `StoreLicense` | Subscription/license status |
| `Plan` / `PlanLimit` / `PlanFeature` | SaaS plan definitions |

---

## Environment Notes

- `.env` is present and configured for local development.
- PHP path (Windows/Local by WP): `C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe`
- Queue connection: `database` (run `php artisan queue:work` for background jobs).
- Mail: `log` driver locally (check `storage/logs/laravel.log`).
- No Pusher/broadcasting configured locally.

---

## ⛔ Purchases live in `purchases`. Full stop.

This section exists because a session once had to re-derive it from scratch and got it wrong.

- A purchase is a row in **`purchases`** with lines in **`purchase_items`**; a purchase return is a row in **`purchase_returns`**.
- **Nothing may write a purchase into the `invoices` table.** `invoices` held the legacy purchase island and is being retired — see `V3_CONSOLIDATION_PLAN.md`.
- The only engine that may create, edit, void, receive or return a purchase is **`App\Services\V3\PurchaseService`**.
- **`paid_amount` is never stored.** It is derived from the ledger: AP debits on non-reversed `purchase_payment` journal entries. A stored column drifts.
- **`payment_status` and `workflow_status` are separate columns.** Overloading one field is what left unpaid purchases stuck on `pending`. `PaymentService::updatePurchaseBadge()` is the only writer of `payment_status` after insert.
- **Never hard-delete a posted purchase.** Reverse the journal and set `workflow_status = 'cancelled'`.
- **UUIDs are preserved across the migration.** `journal_entries.reference`, `expenses.purchase_id` and `inventory_batches.purchase_invoice_id` all resolve against the same id in either table. Never regenerate an id for a migrated row.

- **Reads matter as much as writes.** When the legacy rows were deleted, seventeen read sites kept querying `invoices` for purchases. An emptied table does not throw — it returns zero rows — so reports, dashboards, the transactions list, the owner emails and the `has_purchases` onboarding flag all silently showed nothing while the suite stayed green. Column map when porting a read:

| Legacy `invoices` | V3 `purchases` |
|---|---|
| `total_amount` | `total` |
| `date` | `purchase_date` |
| `tax_amount` | `tax` |
| `discount_amount` | `discount` |
| `status` | `payment_status` **or** `workflow_status` — decide which |
| `paid_amount` | **no column** — derive from the ledger |

Lines: `invoice_items` → `purchase_items`, `quantity` → `qty`, `unit_price` → `unit_cost`, `total` → `line_total`.

`tests/tests/Feature/Golden/PurchaseIslandGuardTest.php` enforces all of the above — both writes and reads. If it fails, fix the code — not the test.

**Consolidation tooling:**

| Command | Phase | Purpose |
|---|---|---|
| `purchases:divergence-count` | 0 | Daily count of rows left in the legacy island |
| `purchases:reconcile --baseline` | 3 | Snapshot the truth *before* the backfill |
| `purchases:migrate-legacy [--commit]` | 3 | UUID-preserving backfill, dry-run by default |
| `purchases:reconcile` | 3 | Prove no rupee moved |
| `purchases:drift-check` | 4 | Nightly legacy↔V3 comparison; must be clean 7+ days |

Cutover switches live in `config/venqore.php` (`purchase_cutover`, `purchase_cutover_tenants`, `purchase_shadow_write`).

---

## Code Conventions

- **Controllers** are thin — business logic lives in `app/Services/`.
- **Inertia responses** use `Inertia::render('PageName', [...data])`.
- **React components** use Tailwind utility classes (no separate CSS files).
- **All DB queries must include `tenant_id` scope** — never query cross-tenant.
- **Purchase Engine:** The canonical purchase engine is `App\Engines\PurchaseService`. (The old warning about `Allocation` needing a `JournalEntry` ID rather than a `Payment` ID still applies to any code writing that table — the DB trigger enforces it.)
- **No Trailing NUL-Bytes:** Never commit or save files ending with trailing NUL (`\x00`) bytes. CI automatically runs a python scan to block pushes with NUL-byte corruption.
- Route names follow `feature.action` convention (e.g., `sales.store`, `inventory.index`).
- Use `route()` Ziggy helper in React for named routes.
- **Ziggy Routes:** Every time you add or rename a route in `routes/web.php`, you MUST run `php artisan ziggy:generate` to regenerate the frontend route cache (`resources/js/ziggy.js`) before building/committing to prevent build guard failures.
- Prefer `php artisan optimize:clear` after config or route changes.

---

## Default Credentials (Local Dev)

- **Admin:** platform@venqore.com / admin1234
- **Database:** root / (no password) / venqore_pos
- **Testing Database:** root / (no password) / amd_pos_test

---

## Database Policy & Rules (CRITICAL)

- **Strict MySQL/MariaDB Policy:** The entire system runs on **MariaDB 10.5** (MySQL-compatible). SQLite is **NOT** supported for any part of the system (including testing). Do NOT write or configure any SQLite databases or connections.
- **Write portable SQL.** MariaDB is not MySQL 8. Avoid MySQL-only features: `SKIP LOCKED` (MariaDB 10.6+), `JSON_TABLE` (10.6+), `VECTOR` (11.7+), and the `utf8mb4_0900_*` collations (MySQL only — use `utf8mb4_unicode_ci`).
- **Production Database:** `venqore_pos` (never wipe or refresh this database).
- **Testing Database:** `amd_pos_test` (used by phpunit/pest for feature tests).
- **Smoke Tests:** Smoke tests run on `venqore_pos` dynamically but are strictly read-only and must NEVER use `RefreshDatabase` or alter data.

## Known Worktrees

Stale git worktrees may exist in `.claude/worktrees/`. They can be safely pruned with:
```bash
git worktree prune
```

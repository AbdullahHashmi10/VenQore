# PROJECT.md — VenQore POS: The Complete Onboarding Bible

> **Audience:** Every future developer, AI agent, co-founder, investor, or hire. Read this first. Assume the author never returns.
> **Snapshot date:** 2026-07-07 · App version 5.0.6 (released 2026-07-05) · Status: pre-launch, pre-revenue.

---

## 1. Vision & Mission

**Vision:** Every small retail and food business runs on books that are always right — without hiring an accountant or buying five disconnected tools.

**Mission:** VenQore fuses a fast, offline-capable POS with a *real* double-entry accounting engine, full inventory (FIFO, batches, serials, manufacturing), and multi-channel selling (WooCommerce, Amazon/eBay/TikTok via VenSynQ) into one Laravel + React monolith, sold as multi-tenant SaaS and as self-hosted/desktop packages.

**Positioning (as shipped on the landing page):** *"The Books Are Always Right."* — the POS posts balanced journal entries as it runs; accounting reads those exact entries. No sync layer to drift. This is the product's single most defensible claim: competitors are either POS-first with bolt-on reports (Square, Loyverse) or books-first with no POS (QuickBooks, Zoho Books).

**Product philosophy (observed in code):**
- One core: one inventory engine, one ledger, one calculator. Tests enforce this (`NoSecondCalculatorTest`, `SingleWriterGuardTest`, `BalanceConsistencyTest`).
- Fail closed: unknown plan keys are locked (`Tenant::featureOn()`, 2026-07-03); unscoped queries return nothing (`HasTenant` `1=0` fallback).
- Never delete money: journal entries are reversed, never deleted (`V3\AccountingService`).
- Offline is a feature, not an apology: POS queues sales in IndexedDB and syncs back.

**Target customers:**
1. **Primary:** small/medium retail & food businesses in Pakistan and South Asia (PKR geo-pricing, FBR e-invoicing, Urdu-adjacent market, Vyapar/Marg switchers — see `VYAPAR_REVERSE_ENGINEERING_NOTES.md`).
2. **Secondary:** global English-speaking SMBs acquired via AppSumo LTD and self-serve SaaS.
3. **Tertiary:** multi-store owners ("Hub" area) and agencies/resellers (self-hosted packages, DRM licensing).

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Backend | PHP 8.2, Laravel 12 | Monolith |
| Frontend | React 18 + Inertia.js v2 | No separate SPA/API split |
| CSS | Tailwind v3 (+forms, typography) | Utility classes only |
| Build | Vite 7 (+ Ziggy route guard in `npm run build`) | `node scratch/audit_ziggy_routes.cjs` runs pre-build |
| DB | MySQL only (SQLite banned by policy) | Prod `venqore_pos`, test `amd_pos_test` |
| Auth | Breeze (session) + Sanctum (API) + Socialite (Google) | |
| Realtime | Laravel Reverb + Pusher-js/Echo | Chat, notifications |
| Queue | database driver; Horizon available | `php artisan queue:work` |
| Offline | Dexie.js (IndexedDB) | `resources/js/Utils/db.js`, `Hooks/useOfflineSync.js` |
| PDF / Excel | dompdf / maatwebsite-excel | Invoices, 44 report pages, exports |
| Barcode | picqer/php-barcode-generator | Multi-barcode per product |
| Payments | Lemon Squeezy (webhooks, HMAC-verified) | Full variant catalog incl. add-ons |
| AI | Gemini (SmartCapture extraction), Vena assistant/chatbot | `app/Services/SmartCapture/*`, `ChatAIService` |
| Storage | Local + AWS S3; Google Drive per-tenant backups | Encrypted OAuth tokens on tenant |
| Charts | Recharts · Icons: Lucide · Dialogs: SweetAlert2 · Tours: driver.js | |

**Scale of codebase (measured):** 484 PHP files (~71.8K LOC), 364 JS/JSX files (~152K LOC), 247 migrations, ~120 Eloquent models, 751 named web routes (`routes/web.php` is 1,980 lines), 102 shared React components, 55 page directories, 44 report pages, 102 test files / ~535 test cases.

---

## 3. Architecture

### 3.1 Multi-tenancy (path-based)

- URL shape: `venqore.com/s/{store_slug}/...`. **Not** subdomains. No wildcard DNS/SSL needed.
- `TenantMiddleware` (`app/Http/Middleware/TenantMiddleware.php`):
  1. Resolves membership via `TenantUser` (pivot: role, status, display_name, pos_pin) in one query.
  2. Platform admins get a virtual owner membership.
  3. Enforces plan-limit status → 3-day grace → view-only lock (self-healing when usage drops).
  4. Applies pending downgrades, trial expiry (→ suspended), suspension screens.
  5. Binds `app('current.tenant')` + `app('current.membership')` into the container.
  6. Regenerates session on store switch (anti-fixation) and clears `store_*` session keys.
  7. Shares store/plan/feature props to every Inertia page.
- `HasTenant` trait (`app/Traits/HasTenant.php`): global scope on every tenant model. Priority: bound tenant → platform admin (unscoped) → `last_store_id` → **hard block `1=0`**. Auto-fills `tenant_id` on create. Escape hatch: `Model::withoutTenantScope()` (super-admin/CLI only).
- Platform (SuperAdmin) layer lives at `/VenQore/*` routes, `app/Http/Controllers/Admin/*` + `SuperAdmin/*`, pages in `Pages/Admin`, `Pages/SuperAdmin`, `Pages/PlatformOwner`, `Pages/Platform`.

### 3.2 The two transaction engines (IMPORTANT)

This is the single most important architectural fact for any newcomer:

1. **Legacy engine** — `SaleController` (1,677 lines), `Sale`/`SaleItem`/`Invoice` models. The POS (`Pos.jsx`) posts here via `store.sales.store` (`Route::post('/sales', ...)` at `routes/web.php:1160`; note the comment at line 187 citing "line 1101" is stale).
2. **V3 engine** — `app/Services/V3/*` (AccountingService, FifoService, InventoryService, SaleService, PaymentService, TaxService, UomService, SettlementService, ManufacturingService, PartyService, AuditService) + 41 controllers in `app/Http/Controllers/V3/*` covering sales, purchases, returns, payroll, loans, assets/depreciation, fiscal years, bad debt, opening balances, price tiers, BOM, stock adjustments, statements. V3 routes live under `/s/{store_slug}/v3/*` with the `store.v3.` name prefix (`routes/web.php` ~line 1558).

V3 is the strategic engine (Vyapar-class accounting breadth). Legacy still owns the POS hot path. Reconciliation tests (`Heart/OneCoreReconciliationGateTest`, `Core/*`) guard consistency, and `MigrateV3Ledger`/`RunShadowMigration` commands exist for migration. **Direction: everything converges on V3; do not add new features to the legacy engine.**

### 3.3 Accounting engine (V3\AccountingService)

- Double-entry `journal_entries` + `journal_items` (UUID PKs, tenant-scoped).
- Golden rules enforced in code: ≥2 lines, SUM(debit)=SUM(credit) (0.001 epsilon), no delete — only `reverseEntry()` (locks row, voids payment allocations, swaps debits/credits), mandatory `reference_type`/`reference_id`, optional `idempotency_key`.
- Party balances computed from journal items (`LedgerService::partyNetBalance`), with `party_snapshots` rebuilt after every entry (`PartyService::rebuildSnapshot`).
- Well-known account codes: `1100` Inventory, `1200` AR, `1205` Marketplace Clearing, `2000` AP, `4000` Sales, `5000` COGS, `6150` Marketplace Fees. `getAccountByCode()` lazily provisions per tenant.
- `AuditService` logs `journal_posted` / `journal_reversed` events.
- Scheduled `finance:audit` runs **hourly** (`AuditFinancialIntegrity` command).

### 3.4 Inventory engine (V3\FifoService)

- `inventory_batches` rows per receipt (purchase, production, opening, negative_stock), FIFO by `created_at` then `seq`, with `lockForUpdate()` inside a DB transaction.
- Negative stock allowed when settings permit — deducts past zero into the newest batch or creates a `negative_stock` batch; `InsufficientStockException` otherwise.
- Returns restore the **exact original batches** via `sale_item_batches` (`restoreStock`).
- Purchase void logic (`voidPurchaseBatches`) refuses to silently zero consumed batches — warns instead.
- Multi-UOM (`UomService::toBaseQty`), multi-barcode (`ProductBarcode`), batches w/ expiry, serials (`ProductSerial`), variants + attributes, composite/manufacturing (`Recipe`, `ProductionRun`, `AutoManufacturingService` Mode A "make now" / Mode B "ready made").
- Legacy aggregate `stocks.quantity` is kept in sync where legacy paths still run; `StockMovement` is the audit trail.

### 3.5 Sales lifecycle (V3\SaleService::post — the canonical flow)

`DB::transaction {` tiered-pricing expansion → per line: promo zeroing → discount → `TaxService::calculateLineTax` → UOM→base qty → `FifoService::deductStock` (COGS from actual batches) → credit-limit check against live AR balance (locked party row) → write `sales`/`sale_items`/`sale_item_batches` → journal (Dr Cash/AR, Cr Sales; Dr COGS, Cr Inventory) → payment allocation `}`. Invoice numbers via `SequenceService::generateTransactionNumber('SAL')`.

Returns: `SaleReversalService` + V3 `SaleReturnController` → batch-exact stock restore + reversal journal entries.

### 3.6 POS terminal (`resources/js/Pages/Pos.jsx`, 3,577 lines)

- Offline-first: product cache + `sales_queue` in Dexie (`Utils/db.js`); `useOfflineSync` auto-syncs every 60s and on `online` events; failed checkouts fall back to the offline queue; offline sales can be recalled.
- Barcode scan-to-add, keyboard-first search (`Api/PosSearchController` — throttle `pos`, 300 req/min), parked sales, per-staff PIN (`tenant_users.pos_pin`), terminals + terminal activity tracking, discounts, multiple payment modes, DRM offline lock screens for self-hosted licensing.

### 3.7 Billing & plans (SaaS layer)

- **Source of truth:** `plans` + `plan_limits` tables written by `PlanFeatureMatrixSeeder`; read via `PlanRepository` (cached) → `Tenant::getLimit()` → `PlanGate::check()/enforce()`. `config/plans.php` is a last-resort fallback ONLY. `tenant_plan_overrides` (SuperAdmin panel) beats everything.
- **Plans:** Trial (14 days, `ProvisionTenantJob`) → Starter $19 → Growth $39 (featured) → Business $79 monthly; annual variants exist in Lemon Squeezy env keys. LTD tiers `ltd_1/2/3` = $49/$99/$179, AppSumo stacking 1/2/3 codes, tx caps 500/2000/6000 per month, hosting included 2 years then $9/mo.
- **Semantics:** `null`=unlimited, `false`/`'0'`=off, `'1'`=on, int=cap, string=variant ('basic'/'advanced'). Fail-closed since 2026-07-03.
- **Enforcement:** `PlanGate` in controllers; `TenantMiddleware` grace/view-only loop; `SubscriptionLifecycleMiddleware`; usage banner via lazy `plan_usage` prop.
- **Payments:** Lemon Squeezy webhooks (`VerifyLemonSqueezySignature` HMAC) → jobs (`HandleSubscriptionUpdated/Cancelled/Expired`, `HandlePaymentFailed`). Add-on catalog: WooCommerce/Amazon/eBay/TikTok channel add-ons, AI tiers (Starter/Lite/Pro/Ultimate/BYOK), upload service.
- **Geo pricing:** `GeoPricingService` (IP → country, 30-day cache; PK → PKR pricing; session override). PKR columns on plans.
- **AppSumo:** `AppSumoCode` model, `GenerateAppSumoCodes`/`ImportAppSumoCodes` commands, `Redeem.jsx`/`RedeemSuccess.jsx`, stacking tests (`CodeStackingTest`).

### 3.8 Integrations

| Integration | Mechanism | Files |
|---|---|---|
| WooCommerce | Handshake + HMAC webhook receive (order→sale), 15-min stock push (`woo:sync-all`, dirty-flag), SKU matching | `app/Services/WooSync/*`, `WooSync` controllers, `Woo*` models |
| VenSynQ (Amazon, eBay, TikTok) | OAuth clients per platform, 15-min `VenSynQSyncJob`, token refresh 10-min, FIFO+ledger posting (Phase 0, 2026-07-07), plan-gated `vensynq.access` | `app/Services/VenSynQ/*`, `EnsureVenSynQAccess` |
| Google Drive | Per-tenant OAuth (encrypted tokens), nightly `backup:google-drive`, retention setting | `GoogleDriveService`, `BackupService` |
| FBR (Pakistan) | E-invoicing service + `EInvoicing` pages + PkVerification | `FbrService`, `Pages/EInvoicing` |
| Gemini AI | SmartCapture: receipt/doc extraction → fuzzy match → transaction builder, entitlements | `app/Services/SmartCapture/*`, `config/smartcapture.php` |
| Pusher/Reverb | Chat (visitor + support), presence, webhooks | `VisitorChatController`, `channels.php` |

### 3.9 Self-hosted / desktop distribution

A parallel business line, unusual and valuable: `InstallerController` + `Pages/Installer`, `UpdaterController` + `Pages/Updater` + `PreventAccessDuringUpdate`/`UpdaterLock` middleware, versioned update ZIPs (`AMD_POS_Update_v*.zip`, currently v5.0.6), `LAUNCH_SYSTEM.bat`, `build_desktop.ps1`, `amd-station/`, DRM licensing (`DrmLicenseController`, `DrmLockMiddleware`, `DrmOfflineLockMiddleware`, `/api/drm/validate`). Treat the SaaS as primary; the self-hosted channel monetizes the Pakistan/on-prem market where cloud trust and connectivity are barriers.

### 3.10 Platform (SuperAdmin) layer

Routes `/VenQore/*` (gate: `is_platform_admin`, non-admins get 404). Capabilities: tenant management + overrides, plan editor, coupons, AppSumo codes, impersonation (`ImpersonationGuard`), support inbox + tickets (Vena tickets), newsletter hub, demo store management (golden master + daily 04:00 reset + `demo:full-deploy`), jobs monitor, health checks (`HealthController`, `DatabaseHealthCheck`), smoke tests (read-only, run against prod DB), system reset (throttled 5/min), platform revenue service (MRR with LTD amortized over 24 months, `scopeBillable()` excludes demo/internal), equity drawings, partner tracking, error logs, platform audit logs.

### 3.11 Request lifecycle (typical tenant page)

`GET /s/ali-shoes/dashboard` → `auth` → `verified` → `TenantMiddleware` (resolve+bind+share) → `lifecycle` (subscription) → `drm` → `DemoMiddleware` → `CheckPermissions` (route-level `permission:*` where declared) → Controller (thin-ish; heavy ones remain) → Service(s) → `Inertia::render('Dashboard', $props)` → Vite-built React page inside `Layouts/` shell → Ziggy `route()` for links.

### 3.12 Frontend structure

- `resources/js/Pages/**` maps 1:1 to Inertia render names; 55 directories (Sales, Purchases, Inventory, Reports (44 pages), Accounting, Finance, Funds, Parties, Staff, StockTake, StockTransfers, SerialTracking, BatchTracking, Manufacturing, Cookbook, GrowthEngine, EInvoicing, WooCommerce, VenSynQ, OnlineStore, Hub, Marketing (public site), Admin, SuperAdmin, PlatformOwner, V3, Settings, Billing, Installer, Updater, Demo...).
- `Components/` (102 shared: comboboxes incl. async product/party, offline banners/locks, modals), `Layouts/`, `Hooks/` (`useOfflineSync`), `Utils/db.js` + `DB/LocalDB.js` (Dexie schemas).
- Public marketing site is React too: `LandingPage.jsx` ("The Books Are Always Right", reduced-motion aware), `Marketing/Pricing|Features|About|Blog|Contact|Newsletter|SmartCapture|VenSynQ|DigitalProducts`.

### 3.13 Background work

Scheduler (`routes/console.php`): woo sync 5–15 min, parked-sale cleanup hourly, staff daily summaries 00:05, growth engine analysis 09:00, **finance integrity audit hourly**, trial reminders 09:00, expired trials hourly, dead-account cleanup, demo reset 04:00 + full deploy, VenSynQ sync 15 min + token refresh 10 min, recurring invoices 00:01, chat auto-close every minute, Drive backups 02:00. Jobs: tenant provisioning, subscription lifecycle, report exports, WooSync, VenSynQ. **Production requires both `queue:work` (or Horizon) and `schedule:work`/cron — nothing works without them.**

---

## 4. Domain glossary (see also `AMD_TRANSACTION_GLOSSARY.md`, `AMD_TRANSACTION_BLUEPRINTS.md`)

| Term | Meaning |
|---|---|
| Tenant | One store/business. Numeric PK, slug in URL. |
| TenantUser | Membership pivot: role (owner/…), status, POS PIN, display name. |
| Party | Customer or supplier (unified). Balance = journal-derived. |
| Sale / Invoice / Transaction | Legacy sale rows / legacy+purchase docs / V3 unified doc model. |
| InventoryBatch | FIFO cost layer. `remaining_qty` is the live truth. |
| JournalEntry/Item | The ledger. Never deleted. |
| Plan / PlanLimit / PlanFeature / TenantPlanOverride | SaaS packaging chain. |
| StoreLicense / AppSumoCode / Coupon | Licensing + LTD + discounts. |
| Vena | In-app AI assistant + support chat brand. |
| VenSynQ | Marketplace channel sync (Amazon/eBay/TikTok). |
| SmartCapture | AI document → transaction extraction. |
| Growth Engine | AI recommendations/analytics module (plan add-on). |
| Hub | Multi-store switcher for owners. |
| Demo store | Public playground tenant, golden-master reset daily 04:00 UTC. |

---

## 5. Environments, credentials, ops

- Local: Windows + "Local by WP" PHP 8.2.23 (`C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe`), MySQL root/no password, `venqore_pos`; app at `127.0.0.1:8000`; mail=log; queue=database.
- Admin: platform@venqore.com / admin1234 (LOCAL ONLY — rotate before any deploy).
- Test DB `amd_pos_test` (Pest/PHPUnit). Smoke tests hit `venqore_pos` READ-ONLY (never `RefreshDatabase`).
- Commands: see CLAUDE.md (kept operational on purpose).
- Deployment artifacts: `deploy/`, `deploy.sh`, update ZIP bundler scripts (`bundle_for_update.ps1`, `build_release.ps1`). Production server actions history in `PRODUCTION_SERVER_ACTIONS_REQUIRED.md`.

---

## 6. Data flow diagrams (text form)

**POS sale (online):** Cashier → Pos.jsx cart → POST `sales.store` → SaleController (legacy) → FIFO deduct + journal post + allocation → Inertia refresh → receipt/print.
**POS sale (offline):** Cashier → cart → checkout fails/offline → Dexie `sales_queue` (status=pending) → `useOfflineSync` (online event / 60s tick) → POST per sale → status=synced.
**Woo order:** Woo → `/api/woo/webhook/{uuid}` (HMAC) → order→sale mapping → FIFO+journal → stock dirty-flag → `woo:sync-all` pushes stock back.
**Marketplace order (VenSynQ):** platform API → SyncJob (15 min) → `SmartFulfillmentService::processDropshipSale` → FIFO COGS → journals (1205 clearing / 4000 / 5000 / 6150) → payout settlement Dr bank / Cr 1205.
**Subscription:** Lemon Squeezy checkout → webhook (HMAC) → jobs update tenant plan/status → `PlanRepository` cache invalidation → gates react instantly.
**AI capture:** Upload/photo → Gemini extraction → fuzzy match products/parties → TransactionBuilder → V3 SaleService/PurchaseService post.

---

## 7. Where to start as a new engineer (first week)

1. Read this file + CLAUDE.md + `GAPS.md` + `SECURITY.md` (docs/).
2. Run locally: `composer install && npm install`, `.env` from example, `php artisan migrate --seed`, `composer run dev`.
3. Trace one sale end-to-end in tinker + logs: POS → journal entries → P&L report.
4. Read `V3\AccountingService`, `V3\FifoService`, `V3\SaleService`, `TenantMiddleware`, `HasTenant` — 90% of the mental model lives in those five files.
5. Run `php artisan test` (needs `amd_pos_test` MySQL DB) and read `Tester/tests/Feature/Core/*` — the invariants ARE the spec.
6. Skim `routes/web.php` top-to-bottom once. Painful but irreplaceable.

## 8. Canonical past documents worth keeping

The repo root contains ~100 historical planning/audit MD files. The ones still worth consulting: `AMD_TRANSACTION_BLUEPRINTS.md`, `AMD_TRANSACTION_GLOSSARY.md`, `CALCULATION_LOGIC.md`, `OFFLINE_ARCHITECTURE_PLAN.md`, `ROLES_ARC.md`, `VenSynQ_Enterprise_Audit_and_Plan.md`, `CHANGELOG.md` (excellent, current), `VENQORE_MASTER_PRODUCT_CATALOG.md`. Treat everything else at root as history — see GAPS.md for the cleanup plan.

# 00_SYSTEM_MAP — VenQore Audit Session 2026-07-03

*Pass-1 inventory. Produced by the Fable 5 audit session (read-only). Companion files: `PROGRESS.md` (coverage log), `VENQORE_MASTER_AUDIT_AND_LAUNCH_PLAN.md` (primary deliverable).*

## Stack (confirmed from composer.json/package.json/config)
Laravel 12 (PHP 8.2) + React 18 + Inertia v2 + Tailwind 3 + Vite 7 · MySQL (`venqore_pos` prod-local, `amd_pos_test` test) · Dexie.js offline POS · Lemon Squeezy billing (webhook → `ProvisionTenantJob`) · WooCommerce sync · dompdf, maatwebsite/excel, Ziggy, Horizon-capable (queue=database).

## Scale of the codebase (counted, not estimated)
| Asset | Count |
|---|---|
| Controllers | 181 (`app/Http/Controllers`, incl. `Admin/`, `SuperAdmin/`, `Api/`, `WooSync/`, `SmartCapture/`) |
| Models | 120 — **90 use the `HasTenant` global-scope trait** (`app/Traits/HasTenant.php:50`) |
| Services | 52 (`app/Services`, money core under `Services/V3/`) |
| Migrations | 244 |
| Inertia pages | 228 `.jsx` (incl. `Marketing/`, `SuperAdmin/`, `Hub/`) |
| Root planning/audit MD files | 94 (~1.9 MB — full chronology of prior audits & fixes) |
| `reports.` route references in `routes/web.php` | 70 |

## The money core (verified present, file-level)
- Single writer: `app/Services/V3/AccountingService.php` (`lockForUpdate` at :176).
- FIFO: `app/Services/V3/FifoService.php` — `orderBy('seq')` deterministic tiebreaker (:52) + `lockForUpdate` (:53).
- Invoice numbering: `app/Services/SequenceService.php` — `DB::transaction` + `lockForUpdate` (:55). All terminals currently share register `R1` (:38–40, TODO).
- Single read engine: `FinancialReportingService`; `V3\ReportService` retired — only comment references remain (`DashboardController.php:730,751`).
- Returns cap: `database/migrations/2026_06_20_120619_add_returned_quantity_to_sale_items_table.php`.

## Test estate (evidence of last runs — could not re-run here, no PHP in audit sandbox)
- Guard tests present: `Tester/tests/Feature/Core/{SingleWriterGuard,BalanceConsistency,CalculatorParity,FifoDeterminism,DashboardConsistency,NoSecondCalculator}Test.php`.
- Capstone present: `Tester/tests/Feature/Heart/OneCoreReconciliationGateTest.php`.
- 21 module suites (`Module01–Module21`), `Money/` (21 files), `AppSumo/`, `Billing/`, `DemoStore/`, `Smoke/`, `ZiggyRouteIntegrityTest`, `SitemapTest`.
- **Recorded runs** (`Tester/dashboard/last-results.json`, 16 runs stored): 2026-06-30 20:34 → 634 passed/1 failed; 20:49 → 635/0; **21:47 → 636 passed / 0 failed, exit 0**.

## Multi-tenancy & platform layer
- Tenant scope: `HasTenant` global scope + auto-stamping; 90/120 models. Core money models (Product, Stock, Transaction, Party, JournalEntry, Sale, Account, Setting, TransactionAllocation) all scoped.
- Store routing: `/s/{store_slug}` groups with `['auth','verified','tenant', DemoMiddleware]`.
- Platform HQ: `/superadmin` + `/VenQore/*` behind `SuperAdminMiddleware` — returns **404 (not 403) to non-admins** (route cloaking), 30-min inactivity logout.
- Plan limit resolution (`app/Models/Tenant.php:257–270`): overrides table → `plan_limits` table (seeder) → tenant JSON column (AppSumo stacking/add-ons) → ⚠️ `config('plans.*')` fallback at `Tenant.php:332`.

## Billing / SaaS surfaces
- Lemon Squeezy webhook: `routes/api.php:33–36` behind `lemon-squeezy.signature` middleware (registered `bootstrap/app.php:39`, HMAC-SHA256).
- Provisioning: `app/Jobs/ProvisionTenantJob.php` — handles order/subscription events + add-on variant IDs (woo/amazon/ebay/tiktok/AI tiers, :116–137) from `config/services.lemon_squeezy.*`.
- AppSumo: `AppSumoController` + `/redeem` routes — currently **hidden behind hardcoded `$hideAppSumoPublic`** (`routes/web.php:647–655`).
- PlanGate: `app/Services/PlanGate.php` — ~50 `enforce()/check()` call sites across ~20 feature keys.
- `PlanUsageBanner` **is mounted** — `resources/js/Layouts/OneGlanceLayout.jsx:71,1235`.

## Public web / SEO
- Marketing pages: `resources/js/Pages/Marketing/` (Pricing, Features, About, Blog/, Contact…).
- `public/robots.txt`: allow-all + sitemap link. Sitemap route-generated (`Marketing\SitemapController`, web.php:95) — **confirmed serving XML on live venqore.com**. No `llms.txt`.
- **Live check 2026-07-03:** `https://venqore.com` is up (Laravel CSRF token present, title "VenQore POS") but returns a **near-empty client-rendered shell** to non-JS fetchers. Web search for "VenQore": **zero footprint** (no listings, no mentions).

## Deployment
- `deploy/` contains `deploy.sh`, `nginx/`, `supervisor/`. `public/build/manifest.json` present. `.env` (local) not tracked in git; 15 secret-bearing keys present locally → rotation required at launch. `VENSYNQ_ENABLED=false`. Git tree clean (2 untracked docs), HEAD `ffd2b83` "bump: version to 4.2.6".

## Documentation chronology (the 94 root MDs, distilled)
1. **Pre-June:** feature build logs (PHASE_*), Vyapar migration, installer, PWA, roles plans.
2. **2026-06-20:** `VenQore_Forensic_Audit_Report.md` — scored **41/100**, findings F1–F17.
3. **2026-06-20→22:** remediation loop (`Build_Log`, `Progress_Tracker`, `HANDOFF`) — M1 blockers fixed & verified → **≈85**.
4. **2026-06-22→30:** Categories 3–5 closed (single read engine, page health, `OneCoreReconciliationGate`), 21 module suites, 636/0 test run.
5. **2026-06-29:** `Consistency_Audit` (pricing/plan truth) + `Master_Roadmap_87_to_100` (VNQ-xxx register).
6. **2026-07-02:** `Bootstrap_Master_Plan` — corrected P0 list of 7 items (this audit re-verified each; see master plan §0).

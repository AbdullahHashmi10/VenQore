# Phase 4 Status: Live Pricing & Tier Alignment (V4 Technical Build Plan)

## 1. Overview & Verification Summary
Phase 4 implements the V4 Technical Build Plan pricing structure, unifying all plan definitions, prices, AI limits, add-on costs, and external provider placeholders into a single source of truth matrix ([`config/pricing.php`](file:///e:/AMD%20POS/AMD%20POS/config/pricing.php)).

- **Automated Test Results:** `31 passed, 132 assertions green` across all 4 test suites (`Phase1SmartCaptureTest.php`, `Phase2MeteringTest.php`, `Phase3FeatureGatesTest.php`, and `Phase4PricingLiveTest.php`).
- **LTD Visibility Rule:** AppSumo / LTD plans (`ltd_1`, `ltd_2`, `ltd_3`) have `is_visible = false` in `plans` table and pricing UI so they cannot be selected by new users.
- **Provider Identifiers:** All Lemon Squeezy variant placeholders use explicit `REPLACE_ME` markers.

---

## 2. Implemented Components

### Single Source of Truth Pricing Matrix
- File: [`config/pricing.php`](file:///e:/AMD%20POS/AMD%20POS/config/pricing.php)
- Includes V4 Plans (`counter` $18, `starter` $36, `growth` $63, `business` $129), AI Tiers (`spark` $3, `shop` $6, `pro` $12, `max` $24), and Add-ons (`staff_seat` $5, `location_seat` $10, `byok` $19).

### Database Seeding & Invalidation
- File: [`database/seeders/PlanFeatureMatrixSeeder.php`](file:///e:/AMD%20POS/AMD%20POS/database/seeders/PlanFeatureMatrixSeeder.php)
- Upserts V4 plans into `plans` table with prices, `platform_id`, and `is_visible` flags (`ltd_*` set to `is_visible = false`).

### Inertia Global Prop Sharing
- File: [`app/Http/Middleware/HandleInertiaRequests.php`](file:///e:/AMD%20POS/AMD%20POS/app/Http/Middleware/HandleInertiaRequests.php)
- Shares `pricing` config prop to all Inertia pages.

### Pricing UI AI Tiers
- File: [`resources/js/Pages/Marketing/Pricing.jsx`](file:///e:/AMD%20POS/AMD%20POS/resources/js/Pages/Marketing/Pricing.jsx)
- Updated `ALL_AI_OPTIONS` array to Spark ($3, 500 pgs), Shop ($6, 1,000 pgs), Pro ($12, 2,000 pgs), and Max ($24, 4,000 pgs).

### Tenant Migration Artisan Command
- File: [`app/Console/Commands/MigrateTenantsToV4PlansCommand.php`](file:///e:/AMD%20POS/AMD%20POS/app/Console/Commands/MigrateTenantsToV4PlansCommand.php)
- Signature: `php artisan app:migrate-tenants-v4`
- Maps legacy slugs (`lite` -> `counter`, `core` -> `starter`, `pro` -> `growth`, `ultimate` -> `business`) and flushes tenant cache via `PlanRepository::invalidateTenantCache()`.

---

## 3. Test Coverage ([`tests/Feature/Phase4PricingLiveTest.php`](file:///e:/AMD%20POS/AMD%20POS/tests/Feature/Phase4PricingLiveTest.php))
1. `it_loads_single_source_of_truth_pricing_config` — Verifies `config('pricing')` has expected plans, prices, AI tiers, and `REPLACE_ME` variants.
2. `it_seeds_v4_plans_with_correct_visibility_flags` — Verifies `PlanFeatureMatrixSeeder` sets `is_visible = 1` for public plans and `is_visible = 0` for `ltd_*` plans.
3. `it_shares_pricing_config_in_inertia_props` — Verifies Inertia middleware shares `pricing` prop.
4. `it_executes_v4_tenant_migration_command` — Verifies `app:migrate-tenants-v4` successfully converts legacy tenants to V4 plans and invalidates cache.

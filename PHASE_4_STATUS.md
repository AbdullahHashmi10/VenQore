# Phase 4 Status: Live Pricing & Single Source of Truth

## 1. Executive Summary
Phase 4 establishes `config/pricing.php` as the single authoritative source of truth for base subscription plans, AI tier pricing/quotas, and add-on pricing across the entire application.

---

## 2. Implementation Details

### T4-1 Single Source of Truth (`config/pricing.php`)
- **Config Matrix**: Defines base plans (`counter` $18, `starter` $36, `growth` $63, `business` $129) and AI tiers (`spark` $3/500 pages/2.5k queries, `shop` $6/1k pages/5k queries, `pro` $12/2k pages/10k queries, `max` $24/4k pages/20k queries).
- **Environment Placeholders**: External payment variant IDs use explicit `env('LEMON_SQUEEZY_...', 'REPLACE_ME')` placeholders instead of fabricated IDs.

### T4-2 Seeder & LTD Visibility Rule (`database/seeders/PlanFeatureMatrixSeeder.php`)
- Seeds plan display names, monthly prices, and sets `is_visible = false` on AppSumo/LTD plans (`ltd_1`, `ltd_2`, `ltd_3`).

### T4-3 Frontend Inertia Prop & Single Source Wiring (`Pricing.jsx`)
- Removed legacy `AI_OPTIONS` array entirely from [`resources/js/Pages/Marketing/Pricing.jsx`](file:///e:/AMD%20POS/AMD%20POS/resources/js/Pages/Marketing/Pricing.jsx).
- Both `ALL_AI_OPTIONS` and the interactive cost calculator now read directly from `usePage().props.pricing.ai_tiers`.

### T4-4 Backend Quota & Billing Resolution
- **Tenant Provisioning ([`ProvisionTenantJob.php`](file:///e:/AMD%20POS/AMD%20POS/app/Jobs/ProvisionTenantJob.php))**: Resolves AI quotas dynamically from `config('pricing.ai_tiers')`.
- **Checkout Service ([`BillingController.php`](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/BillingController.php))**: Resolves plan variants from `config('pricing.plans')` as primary source before fallback.

### T4-5 Tenant Plan Migration Safety & Customer Notification ([`MigrateTenantsToV4PlansCommand.php`](file:///e:/AMD%20POS/AMD%20POS/app/Console/Commands/MigrateTenantsToV4PlansCommand.php))
- **Explicit Safety Guard**: Explicitly checks and skips any tenant with `$plan === 'ltd'` or `str_starts_with($plan, 'ltd_')` or `is_ltd` flag.
- **Customer Email Notification**: Dispatches [`App\Notifications\V4PlanMigratedNotification`](file:///e:/AMD%20POS/AMD%20POS/app/Notifications/V4PlanMigratedNotification.php) to the store owner's email address upon live migration (`--dry-run` omitted).

---

## 3. Automated Test Verification ([`tests/Feature/Phase4PricingLiveTest.php`](file:///e:/AMD%20POS/AMD%20POS/tests/Feature/Phase4PricingLiveTest.php))
- `it_loads_single_source_of_truth_pricing_config` — PASS
- `it_seeds_v4_plans_with_correct_visibility_flags` — PASS
- `it_shares_pricing_config_in_inertia_props` — PASS
- `it_executes_v4_tenant_migration_command` — PASS
- `it_ensures_ltd_tenants_are_never_migrated_by_v4_command` — PASS (5/5 PASSED, 35 assertions green)

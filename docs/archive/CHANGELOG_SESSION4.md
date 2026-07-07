# CHANGELOG — Session 4 (Pricing-truth ratification), 2026-07-04

Scope: resolve the undocumented `PlanFeatureMatrixSeeder` entitlement flips left uncommitted
by the previous session's IDE run. Those flips turned red tests green by **changing production
pricing defaults** instead of fixing tests — flagged in this session's audit and put to the
owner as explicit decisions. Everything below implements the owner's answers.

## Owner decisions (2026-07-04, recorded verbatim in intent)

1. **WooCommerce → included in NO plan.** Sold separately as an add-on; off by default everywhere.
2. **Smart Capture → AI add-on, available with any plan, included in none.** Matches
   `Pricing.jsx`: managed AI tiers (Core/Lite/Pro/Ultimate, monthly) or BYOK one-time $5 unlock.
3. **Digital gift cards → Trial keeps it** (trial demos the Business feature set). IDE's flip ratified.
4. **Loyalty redemption stays ungated** (earning stays gated). Session-3 judgment call ratified.

## Changes

### database/seeders/PlanFeatureMatrixSeeder.php
- `woocommerce`, `woocommerce_customer_reg`, `woocommerce_stock_sync`, `woocommerce_orders_bridge`
  → reverted to `'0'` for all plans (IDE had flipped trial/growth/business to `'1'`).
- `smart_capture` → reverted to `'0'` for all plans (IDE had flipped trial/growth/business to `'1'`).
- `digital_gift_cards` trial `'1'` → **kept** (decision 3).
- Decision comments added inline at each key.

### app/Jobs/ProvisionTenantJob.php (~line 184) — the real bug the flips were papering over
Add-on purchases (Lemon Squeezy webhooks) only set `sync_channels` / `ai_status` +
`ai_queries_limit`/`ai_scans_limit` on the tenant — but `PlanGate` reads plan limits and
`tenant_plan_overrides`, never those columns. With the seeder correctly `'0'` everywhere, a
**paying add-on customer would still 403**. Fix: the provisioning job now also writes
`tenant_plan_overrides` rows — `woocommerce='1'` when the Woo sync add-on variant is purchased,
`smart_capture='1'` when any AI add-on / BYOK variant is purchased — and calls
`PlanRepository::invalidateTenantCache()` so entitlement is live immediately.

### Tests — entitled honestly instead of relying on plan defaults
- `Tester/tests/Feature/Module02/StoreCreationAndProvisioningTest.php` —
  `woocommerce webhook requires a valid signature`: tenant now gets a `tenant_plan_overrides`
  row (`woocommerce='1'`), mirroring how a sold add-on grants access and matching the pattern
  Module10's `WooCommerceTest` already used. The test is about HMAC verification, not gating;
  gating is separately covered by `woocommerce webhook isolation regression` (expects
  `PlanLimitException` on an unentitled plan — still valid, untouched).
- `Tester/tests/Feature/Chat/SmartCaptureTest.php` — `beforeEach` now grants a
  `smart_capture='1'` override (simulating a purchased AI add-on). Extraction/confirmation
  tests unchanged.
- `PlanManagementTest`, `RegressionFixesTest`, `GatingTest` (M1-11) — verified unaffected:
  they self-provision their own plan-limit rows or expect blocked, which the revert preserves.

## Not done / follow-ups
- The **$5 BYOK unlock** and managed-AI **usage caps** (`ai_queries_limit`/`ai_scans_limit`)
  are stored but nothing in `SmartCaptureController` enforces the query/scan quotas yet.
- Managed-AI cancellation/refund should remove the `smart_capture` override (and Woo add-on
  cancellation the `woocommerce` override) — no `subscription_cancelled` handling for add-on
  variants was found. Needs its own pass.
- `Pricing.jsx` AI quota numbers (110/90, 200/150, 420/480, 800/850) differ from
  `ProvisionTenantJob` (110/90, 300/200, 1000/800, 5000/4000) for Lite/Pro/Ultimate.
  One of the two is stale — reconcile before launch.

## What to run
Full suite on real MySQL (`amd_pos_test`), as always:
```
cd Tester
../vendor/bin/pest
```
Watch specifically: `SmartCaptureTest` (all), `StoreCreationAndProvisioningTest` webhook pair,
`Module10/WooCommerceTest`, `FinancialExtensionTest` gift-card tests, `GatingTest` M1-11,
`PlanTruthFailClosedTest` (all four), `CodeStackingTest` (all).

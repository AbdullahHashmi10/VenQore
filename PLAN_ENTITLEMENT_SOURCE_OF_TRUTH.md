# Plan Entitlement — Source of Truth Audit

**Scope:** Canonical codebase at `E:\AMD POS\AMD POS` (`app/`, `resources/js/`, `routes/`, `config/`, `database/`). Note: the working tree also contains several full duplicate copies of the project (`AMD_POS_Update_v4.2.7\`, `_VERIFICATION_BASELINE_2026-07-10\`, `Tester\`, `FinalTester\`, `VenQore_Local\`). This audit deliberately excludes those duplicates and covers only the live/canonical tree — but their mere existence is itself a maintenance risk worth flagging to the founder (someone could edit the wrong copy).

**Method:** grep/read of actual source. Every claim below is sourced to a real file. Where something could not be confirmed, it is marked "not found" rather than assumed.

---

## 1. Every location that defines plan entitlements

| # | File | Role | Authoritative? |
|---|---|---|---|
| 1 | `database\seeders\PlanFeatureMatrixSeeder.php` | Seeds ~150 feature/limit keys × 8 plan slugs (`trial, counter, starter, growth, business, ltd_1, ltd_2, ltd_3`) into the `plan_limits` DB table. | **Yes — this is the runtime source of truth.** |
| 2 | `config\plans.php` | Static PHP array mirroring the same keys/plans. Header comment (updated 2026-07-03) explicitly labels itself **"REFERENCE COPY + LAST-RESORT FALLBACK ONLY."** | No — documented fallback, only consulted if a plan slug was never seeded to the DB. |
| 3 | `config\pricing.php` | `pricing.plans` (display name/price data consumed by the seeder) and `pricing.ltd_plans` (final fallback for LTD-specific keys inside `PlanRepository::getEffectiveLimit()`). | No — display/fallback data, not gating logic. |
| 4 | `app\Models\Plan.php` | Eloquent model. `limits()` → hasMany `PlanLimit`; `features()` → hasMany `PlanFeature` (ordered by `sort_order`). | Model layer over #1's data; `PlanFeature` table appears to be a **separate, marketing-copy-only table** not obviously wired into runtime `PlanGate`/`PlanRepository` checks. |
| 5 | `app\Models\PlanLimit.php` | `plan_id, key, value, reset_period` — the row shape populated by the seeder. | Data model for #1. |
| 6 | `app\Models\PlanFeature.php` | `plan_id, feature, is_included, tooltip, sort_order`. | Unclear runtime role — looks like it feeds pricing-page copy, not `EnsurePlanFeature` middleware. Needs owner clarification (flagged below). |
| 7 | `app\Models\TenantPlanOverride.php` | Per-tenant key/value override with optional `expires_at`. Checked **first** in resolution order (below add-on purchases, LTD add-ons, etc. are implemented this way). | Highest-priority override, not a base definition. |
| 8 | `app\Services\PlanRepository.php` | Resolution service. `getEffectiveLimit()` order: (1) active non-expired `TenantPlanOverride` row → (2) DB `plan_limits` row for tenant's plan (`getLimits()`, cached 1hr) → (3) `config/pricing.php` `ltd_plans` fallback for LTD slugs → (4) `null`. `canUseFeature()` layers business rules on top (see §3). | **The authoritative resolution algorithm** — this is the single code path everything should route through. |
| 9 | `app\Services\PlanGate.php` | Documented facade: "all plan checks flow through here." `PlanGate::check()` / `PlanGate::enforce()` (throws `PlanLimitException`). | Correct architectural intent — the enforcement point. |
| 10 | `app\Http\Middleware\EnsurePlanFeature.php` | Route middleware alias `plan.feature:<key>`, used **52+ times** across `routes\web.php`. On failure: 403 JSON (`{success:false, code:'feature_locked', required_tier:'business', ...}`) for Inertia/AJAX/JSON, else redirect to `store.billing` with flash warning. | Correct backend enforcement layer, when actually applied to a route. |
| 11 | `app\Models\Tenant.php` | `getLimit()`, `featureOn()`, `featuresArray()`, `effectivePlan()`, `setPlanAttribute()`. | Convenience accessors over #8 — legitimate, as long as they always delegate to `PlanRepository` and never duplicate logic locally. |
| 12 | `app\Services\SmartCapture\AiEntitlementService.php` | Separate AI/BYOK/managed-AI metering system (quotas, usage counters). | A parallel entitlement system specifically for AI usage — not itself wrong, but is a **fourth axis** of entitlement logic outside the `PlanRepository`/`PlanGate` path. |
| 13 | `app\Http\Controllers\AppSumoController.php` | LTD redemption logic; snapshots entitlements via `PlanRepository::getLtdSnapshot($plan)` into `Tenant.plan_limits` JSON on redemption. | Correctly delegates to #8 (see §4 — this one is *not* a duplicate, it's a documented, reconciled design). |
| 14 | `resources\js\Pages\SuperAdmin\Plans\featureGroups.js` (~line 1748) | React SuperAdmin plan-editor UI. Contains its **own hardcoded JSON literal copy** of the entire feature matrix, e.g. `"growth_engine": {"trial":"0","starter":"0","growth":"0","business":"0"}`. | **Duplicate.** This is a client-side mirror of #1's data, maintained by hand. |
| 15 | `resources\js\Hooks\usePlan.js` | Reads `usePage().props.plan.features[key]` (Inertia shared prop `plan`). | One of two competing frontend read paths (see §3). |
| 16 | `resources\js\Components\PlanGate.jsx` / `FeatureLock.jsx` | Read `usePage().props.store.features[key]` — a **different** shared prop namespace than #15. | The other of two competing frontend read paths. |
| 17 | `resources\js\Pages\Billing\Index.jsx` | `FEATURE_UPGRADE_TARGET` map — a hardcoded JS object mapping feature keys to "which plan unlocks this," independent of #1/#8. | **Duplicate, and demonstrably wrong** in at least two entries (see §3, Growth Engine and WooCommerce). |
| 18 | `resources\js\Components\UpgradeModal.jsx` | Own hardcoded feature-name/icon map (e.g. `growth_engine: { icon: '✨', label: 'Growth Engine' }`), independent of #1/#8/#17. | **Duplicate** — a fifth hardcoded reference point for the same feature identity. |

---

## 2. Which is authoritative

**Authoritative chain (as designed):**
`database\seeders\PlanFeatureMatrixSeeder.php` (seeds DB) → `plan_limits` table → `app\Services\PlanRepository.php::getEffectiveLimit()` / `canUseFeature()` → `app\Services\PlanGate.php` → `app\Http\Middleware\EnsurePlanFeature.php` (backend enforcement).

This chain is coherent and reasonably well-engineered — it has explicit fail-closed semantics (`if ($val === null) return false; // Default deny per T2-2`), a documented override/priority order, and self-correcting commit history (see the 2026-08-07 report-key fix noted in §4 of the Matrix document).

**The problem is everything downstream of it that does NOT read through this chain:**
- SuperAdmin plan editor JS (`featureGroups.js`) hardcodes its own copy of the matrix.
- Two different Inertia shared-prop namespaces (`plan.features` vs `store.features`) are read by different frontend components for what should be one concept.
- `Billing/Index.jsx`'s `FEATURE_UPGRADE_TARGET` and `UpgradeModal.jsx`'s feature map are hand-maintained and already **provably wrong** against the DB seeder (see §3).
- `PlanFeature` (model #6) is a DB table that looks like it should be part of the authoritative chain (it's called "Plan" + "Feature," same as the gating vocabulary) but doesn't appear to be consulted by `PlanGate`/`PlanRepository` at runtime — this needs a direct answer from the team: **is `PlanFeature` marketing-copy-only, or is it silently unused dead weight, or is it read somewhere not found in this search?** Flagged as unresolved rather than guessed.

## 3. Where they disagree (concrete, code-quoted)

### Growth Engine — backend says "0" everywhere, frontend says "included with Growth/Business"
- Seeder (`PlanFeatureMatrixSeeder.php` line 314): `'growth_engine' => ['trial' => '0', 'starter' => '0', 'growth' => '0', 'business' => '0']`
- `config\plans.php`: every plan block sets `'growth_engine' => false`, annotated `// AI add-on key — off by default on all plans (matches seeder)`.
- `featureGroups.js` line ~1748: mirrors the same all-zero state.
- **Route enforcement is real:** `routes\web.php:1150` — `Route::middleware(['permission:reports.summary', 'plan.feature:growth_engine'])` — with the default `'0'` on every base plan, no standard-plan tenant can access Growth Engine without a `TenantPlanOverride` (i.e., it is a true paid add-on, not bundled).
- **But** `resources\js\Pages\WhatIsIncluded.jsx` line 162: `<Feature label="Growth Engine (AI Retention)" starter={false} growth={true} business={true} />` — explicitly tells prospects Growth/Business plans **include** it.
- **And** `resources\js\Pages\Billing\Index.jsx` `FEATURE_UPGRADE_TARGET` (line 43): `growth_engine: 'growth'` — tells an in-app Starter tenant that upgrading to Growth unlocks Growth Engine.
- **And** `resources\js\Pages\Marketing\Pricing.jsx` line 545 and `WhatIsIncluded.jsx` line 545 both name the Growth *subscription tier itself* `'Growth Engine'`, conflating the tier name with the AI feature name — a naming collision layered on top of the entitlement contradiction.

**This is a live, monetization-breaking bug**, not a cosmetic inconsistency: a customer can be sold the promise of a feature that the backend will then 403 them out of. See `MASTER_PLAN_ENTITLEMENT_MATRIX.md` §"Growth Engine Investigation" for the full writeup.

### WooCommerce — same pattern
- Seeder: `'woocommerce' => ['trial'=>'0','starter'=>'0','growth'=>'0','business'=>'0']`, with an explicit owner-decision comment: *"2026-07-04 decision (owner): WooCommerce is NOT included in any plan — it stays off until sold separately. Entitlement, when granted, goes through tenant_plan_overrides (per-tenant), never a plan default."*
- `Billing/Index.jsx` `FEATURE_UPGRADE_TARGET`: `woocommerce: 'growth'` — again implies upgrading to Growth unlocks WooCommerce sync, contradicting the explicit backend decision.

### Report keys — historical evidence multiple sources have drifted before
- Seeder comment (dated 2026-08-07, i.e., same day as "today" in this environment): *"Launch gap found 2026-08-07: these 3 keys are used by routes/web.php (plan.feature:discount_report / cash_flow_report / stock_valuation) but were never seeded here, so featureOn()'s fail-closed default locked them for EVERY plan including business/ltd_3."* — confirms this exact class of bug (route middleware referencing a key the seeder never defined) has already happened in production-adjacent code once, and was caught/fixed same-day. This is direct evidence the "multiple sources of truth" architecture is actively causing incidents, not just theoretically risky.

### Frontend entitlement read path — two competing prop namespaces
- `usePlan.js` → `usePage().props.plan.features[key]`
- `PlanGate.jsx` / `FeatureLock.jsx` → `usePage().props.store.features[key]`

No single canonical frontend accessor exists; which one a given page/component uses depends on which was copy-pasted when it was built.

---

## 4. Severity flag

**HIGH — multiple, independently-maintained sources of truth exist, and they have already produced at least two customer-facing contradictions (Growth Engine, WooCommerce) and one confirmed production gap (report keys, fixed same-day 2026-08-07).**

Per instructions, this report does not pick a winner among the duplicated frontend maps — it identifies that `PlanFeatureMatrixSeeder.php` → `PlanRepository` → `PlanGate` → `EnsurePlanFeature` is the backend-authoritative chain, but the frontend has at minimum five independent places (`featureGroups.js`, `usePlan.js`'s prop source, `PlanGate.jsx`/`FeatureLock.jsx`'s prop source, `Billing/Index.jsx`'s `FEATURE_UPGRADE_TARGET`, `UpgradeModal.jsx`'s feature map) that can and do disagree with it.

## 5. Open questions for the team (not answered by code alone)

1. Is `PlanFeature` (the DB table, `app\Models\PlanFeature.php`) actually consulted anywhere at runtime, or is it purely pricing-page marketing copy? Not confirmed either way in this search.
2. Is `plan.features` (read by `usePlan.js`) supposed to be identical to `store.features` (read by `PlanGate.jsx`/`FeatureLock.jsx`), and if so, why are there two Inertia shared props instead of one?
3. Are the duplicate project trees (`AMD_POS_Update_v4.2.7\`, `Tester\`, `FinalTester\`, `VenQore_Local\`, `_VERIFICATION_BASELINE_2026-07-10\`) dead/archived, or could a developer accidentally edit entitlement logic in one of them believing it's live? Worth a one-line confirmation from the team; this audit did not find evidence either way and did not investigate their contents (out of scope per the mission's "canonical root only" framing, but flagged as a risk).

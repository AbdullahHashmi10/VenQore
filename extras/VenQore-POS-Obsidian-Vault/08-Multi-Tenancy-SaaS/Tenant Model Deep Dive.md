---
tags: [multi-tenancy, models]
---

# Tenant Model Deep Dive

Part of [[VenQore POS - Home]] · [[Multi-Tenancy Architecture]]

`app/Models/Tenant.php` — the tenant/store root model, numeric PK, `SoftDeletes`.

## Golden Master Guard
`booted()` `saving` hook throws `RuntimeException` if more than one `is_golden_master=true` tenant is ever saved — protects the demo-store cloning system (see [[Platform Infrastructure Services]] → DemoStoreService).

## Notable Fillable Fields
- Plan/billing: `plan, status, trial_ends_at, subscription_ends_at, lemon_squeezy_*`
- AppSumo: `appsumo_code`
- Feature flags: `feature_variants, feature_serials, feature_batches, feature_manufacturing`
- Google backup integration tokens (encrypted)
- Onboarding: `onboarding_step, onboarding_completed`
- AI usage quotas: `ai_status, ai_queries_limit/used, ai_scans_limit/used`
- `sync_channels`, `grace_ends_at`

## Encrypted Fields
`google_access_token`/`google_refresh_token` cast as `encrypted`, hidden from serialization.

## Key Accessors
- `getLogoUrlAttribute` — storage-existence-checked.
- `google_connected` (appended) — decrypt-safe accessor; catches `DecryptException` and logs a warning instead of crashing every page load if `APP_KEY` rotates.

## Key Business Methods
| Method | Purpose |
|---|---|
| `ownerEmail()` | Resolves the tenant's owner email |
| `isTrialActive()` | Trial status check |
| `isAccessible()` | Overall access gate |
| `getLimit(string $key)` | Priority resolution: `TenantPlanOverride` → `plan_limits` table → legacy JSON column → config fallback via `PlanRepository` |
| `featureOn()` / `featuresArray()` | Fail-closed feature gating — explicit `=== true` check, per a 2026-07-03 security fix |
| `effectivePlan()` | Maps LTD transaction limits to `ltd_1/2/3` tiers |
| `setPlanAttribute` | Snapshots `plan_limits` JSON for LTD plans via `PlanRepository` |
| `checkLimitsStatus()` | Checks SKU/warehouse/staff usage against plan limits (priority: SKU > staff > locations) |

## Relations
`users` belongsToMany User (pivot `tenant_users`, with role/status/display_name/pos_pin/joined_at), `memberships` hasMany TenantUser, `ownerMembership` hasOne TenantUser (role=owner), `products`, `sales`, `licenses` hasMany StoreLicense, `planOverrides` hasMany TenantPlanOverride.

## Related
- [[Multi-Tenancy Architecture]]
- [[Plans, Limits & Billing]]
- [[Core Tables - Multi-Tenancy]]

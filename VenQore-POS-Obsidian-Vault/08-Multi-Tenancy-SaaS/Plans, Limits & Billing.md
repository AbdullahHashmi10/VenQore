---
tags: [multi-tenancy, billing, saas]
---

# Plans, Limits & Billing

Part of [[VenQore POS - Home]] · [[Multi-Tenancy Architecture]]

## Core Models
- **Plan** — SaaS plan definition (pricing in USD/PKR, checkout URLs, LTD flag, trial_days). Relations: `platform`, `limits` hasMany PlanLimit, `features` hasMany PlanFeature, `coupons` belongsToMany Coupon.
- **PlanFeature** — `plan_id, feature, is_included, tooltip, sort_order`.
- **PlanLimit** — `plan_id, key, value, reset_period` — central limit-key/value store read by `Tenant::getLimit()`.
- **PlanChangeNotification** — tenant-facing plan-change notices.
- **TenantPlanOverride** — per-tenant manual limit overrides. Fillable: `override_key, override_value, original_value, reason, applied_by, expires_at`. Method `isActive()`.
- **StoreLicense** — decouples billing from tenant/user. `type` enum `trial|subscription|ltd`; `status` enum `available|consumed|expired|cancelled`.

## Seeded Plan Limit Keys
`transactions_per_month`, `locations`, `sku_limit`, `staff_limit`, `woocommerce`, `api_access`, `reports`, `growth_engine`, `multi_branch`.

## Billing Services (Lemon Squeezy)
| Service | Purpose |
|---|---|
| `BillingHistoryService` | Cached (120s) read of a tenant's real LS invoice history; derives coverage periods since LS doesn't return one |
| `LemonSqueezyCheckoutService` | Single place every checkout is built; falls back to a static store URL if API fails |
| `LemonSqueezyStatus` | Translates an LS subscription status into `tenants.status` — replaces 3 previously-disagreeing inline mappings |
| `LemonSqueezySyncService` | Webhook safety net — pulls subscription truth directly from LS API, replays through `ProvisionTenantJob` |
| `TrialCreditService` | Converts unused trial days into a proportional discount code at checkout |
| `PlanGate` | Static — all plan checks flow through here (`check()`, `enforce()` throws `PlanLimitException`) |
| `PlanRepository` | `getLimits()`, `getLtdSnapshot()`, `getEffectiveLimit()`, cache invalidation |
| `ReportTierGate` | Gates report access by plan tier |
| `PlanChangeNotifier` | Static notification triggers on plan changes |

## Related Jobs
`HandlePaymentFailedJob`, `HandleSubscriptionCancelledJob`, `HandleSubscriptionExpiredJob`, `HandleSubscriptionUpdatedJob`, `ProvisionTenantJob` — see [[Jobs & Queue Workers]].

## Related
- [[Coupons, AppSumo & Access Grants]]
- [[Tenant Model Deep Dive]]
- [[Billing & Subscription Services]]

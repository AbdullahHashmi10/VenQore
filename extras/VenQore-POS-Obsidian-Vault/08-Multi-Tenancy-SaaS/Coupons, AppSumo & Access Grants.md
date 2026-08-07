---
tags: [multi-tenancy, billing, marketing]
---

# Coupons, AppSumo & Access Grants

Part of [[VenQore POS - Home]] · [[Plans, Limits & Billing]]

## Coupon / CouponRedemption
Discount coupon system. `Coupon::isValid()` checks active/date-range/max_uses. Relations: `planRestrictions` belongsToMany Plan (via `coupon_plan_restrictions`), `redemptions` hasMany.
`CouponRedemption` has `$timestamps=false`, tracks `discount_applied`, `redeemed_at`.

### Schema
`coupons`: `code` unique, `discount_type` enum `percentage|fixed`, `discount_value`, `max_discount`, `applies_to` enum `all, subscription, ltd, specific_plans`, `max_uses`, `used_count`, `max_uses_per_user` (default 1), `valid_from/valid_until`, `is_active`.

## AppSumoCode
`SoftDeletes`. Casts `is_redeemed` boolean, `metadata` array (IP audit). `tenant` belongsTo.
Schema: `code` unique indexed, `plan_tier` default `Tier 1`, `is_redeemed` indexed, `redeemed_at`, `tenant_id` indexed, `redeemed_by_email`.

## AccessGrant / AccessGrantRedemption — "Gift Link" System
Generated from the SuperAdmin dashboard; grants a plan for a duration with zero payment.
- `AccessGrant::generateToken()` — 40-char random, uniqueness-checked.
- `isValid()` / `invalidReason()` — checks revoked/expired/exhausted.
- `computeGrantedUntil()` — day/month/year math.
- `durationLabel()`, `url()` — route to `gift.show`.
- Relations: `plan`, `creator` belongsTo User, `redemptions` hasMany.
- `AccessGrantRedemption`: `$timestamps=false`; relations `grant`, `user`, `tenant`.

Public flow: `GET /gift/{token}` → `gift.show` (preview) → `POST /gift/{token}` → `GiftRedemptionController@accept` → `gift.accept`.

## Related
- [[Plans, Limits & Billing]]
- [[Platform & SuperAdmin Routes]]

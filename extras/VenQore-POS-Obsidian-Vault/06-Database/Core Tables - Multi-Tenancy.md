---
tags: [database, multi-tenancy]
---

# Core Tables — Multi-Tenancy

Part of [[VenQore POS - Home]] · [[Database Schema Overview]] · [[Multi-Tenancy Architecture]]

## `tenants`
PK originally `uuid`, **remodeled to auto-increment bigint `id`** (routing became `/s/{id}/...` instead of subdomain). `slug` (unique, display only), `join_code` (8-char, e.g. `VQ-A3F9`), `appsumo_code` (indexed). `plan` enum: `trial, starter, growth, business, ltd`. `status` enum: `trial, active, suspended, cancelled`. `lemon_squeezy_customer_id`/`lemon_squeezy_subscription_id`, `plan_limits` json. `timezone`, `currency_code`(3), `currency_symbol`, `country_code`(2), `language_code`(5). `feature_variants/serials/batches/manufacturing` booleans. Indexes: `[status, trial_ends_at]`, `plan`.

## `tenant_users` (pivot)
`tenant_id` FK cascade, `user_id` FK cascade nullable (null = pending invite). `role` enum: `owner, admin, manager, cashier, viewer` (later widened with `custom` + `custom_role_name`). `status` enum: `active, invited, suspended`. `display_name`, `pos_pin`(6-char), `security_pin`. Invite fields: `invite_email`, `invite_token`(64, unique), `invite_expires_at`, `invited_at`, `joined_at`. Unique `[tenant_id, user_id]`.

## `users`
Reworked to become **global** (no longer tenant-scoped): added `last_store_id` (FK → tenants.id, nullOnDelete), `is_platform_admin`, `deleted_at`. Removed: `tenant_id`, `role`, `permissions`, `passcode` (all moved into `tenant_users`).

## `store_licenses`
`user_id` FK, `tenant_id` FK nullable (unassigned until store created). `type` enum `trial, subscription, ltd`. `status` enum `available, consumed, expired, cancelled`. `source` (`registration|lemon_squeezy|appsumo|manual`), `valid_until` (null = forever/LTD).

## `plans` / `plan_limits` / `plan_features`
`plans`: `platform_id` FK, `slug` unique, `type` enum `trial, subscription, ltd, enterprise`, `price_monthly/annual/lifetime` decimal(10,2). Seeded: trial/starter/growth/business (website platform) and ltd_1/2/3 (appsumo platform).
`plan_limits`: `[plan_id, key]` unique. Seeded keys: `transactions_per_month`, `locations`, `sku_limit`, `staff_limit`, `woocommerce`, `api_access`, `reports`, `growth_engine`, `multi_branch`.

## `tenant_plan_overrides` / `plan_change_notifications`

## `coupons` / `coupon_plan_restrictions` / `coupon_redemptions`
`coupons`: `code`(50) unique, `discount_type` enum `percentage|fixed`, `applies_to` enum `all, subscription, ltd, specific_plans`, `max_uses`, `used_count`, `max_uses_per_user` default 1.

## `appsumo_codes`
uuid PK, `code` unique indexed, `plan_tier` default `Tier 1`, `is_redeemed` indexed, `tenant_id` indexed, `metadata` json (IP audit).

## `drm_licenses`
uuid PK, `tenant_id` indexed, `license_key` unique, `hardware_fingerprint`, `last_validated_at`, `expires_at`, `grace_period_days` default 30, `signature`.

## Related
- [[Tenant Model Deep Dive]]
- [[Plans, Limits & Billing]]
- [[Coupons, AppSumo & Access Grants]]

---
tags: [models, multi-tenancy, platform]
---

# Models — Multi-Tenancy & Platform

Part of [[VenQore POS - Home]] · [[Multi-Tenancy Architecture]]

See [[Tenant Model Deep Dive]] for full `Tenant` model detail.

## TenantUser (`TenantUser.php`) — pivot / membership
`HasActivityLog`. Fillable covers invite flow (`invite_email, invite_token, invite_expires_at, invited_at, joined_at`), `pos_pin`, `security_pin`, `permissions` (array cast), `custom_role_name`. Hidden: `pos_pin, invite_token`.
Methods: `effectiveName()`, `isInviteValid()`, `hasRoleAtLeast(string $minRole)` — full role hierarchy (viewer=1 ... owner=10, plus many mid-tier operational roles).

## User (`User.php`) — global identity
`SoftDeletes`, `Notifiable`. Role/permissions/passcode moved OUT of User into `TenantUser` pivot; User retains `last_store_id`, `is_platform_admin`, `platform_role`, `staff_role`, `platform_pin`.
Key methods: `isMemberOf()`, `roleIn()`, `displayNameIn()`, platform-tier checks (`isPlatformAdmin/Owner/SuperAdmin/Support/Staff`), `hasRole()`, `hasPermission()` (resolution: platform admin wildcard → TenantUser custom perms → `config/permissions.php`), `getActiveMembership()` (memoized 3-tier fallback).

## Platform / PlatformActivityLog / PlatformAuditLog
`Platform`: top-level SaaS entity, `plans` hasMany Plan. `PlatformAuditLog` has static `logAction()` capturing user/ip/user_agent/payload.

## PlatformEquityDrawing / PlatformPartner
Internal equity/partner bookkeeping for platform owners — not tenant business data.

## Plan family — see [[Plans, Limits & Billing]]

## StoreLicense, Coupon, AppSumoCode, AccessGrant — see [[Coupons, AppSumo & Access Grants]]

## Related
- [[Tenant Model Deep Dive]]
- [[Three Admin Surfaces]]

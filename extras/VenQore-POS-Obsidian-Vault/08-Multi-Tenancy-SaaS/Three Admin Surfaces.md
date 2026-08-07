---
tags: [multi-tenancy, admin, routes]
---

# Three Admin Surfaces

Part of [[VenQore POS - Home]] · [[Multi-Tenancy Architecture]]

VenQore POS has **three distinct "admin" surfaces** — a notable source of potential confusion, worth understanding before touching admin code.

## 1. Store Admin Panel — `s/{store_slug}/admin/*`
Route name: `store.admin.*`. Gated by `permission:admin.settings_manage`.
Controller: `AdminController` plus `DataManagementController`, `RecycleBinController`, `StoreChatbotSettingsController`, `AgentChatController`, `Admin\VenaTicketsController@storeIndex`.
**Tenant-scoped** — manages one store's own users, settings, data import/export, recycle bin, chatbot config.
Also has a legacy parallel at `/admin-panel/*` (`store.legacy.admin.*`), kept for redirect compatibility, being folded into the same "Data & Backup hub."

## 2. Platform Owner — `VenQore/*`
Route name: `platform.*`. Middleware: `SuperAdminMiddleware`.
**This is the primary, actively developed platform-operator console.** Manages all tenants (suspend/activate/extend-trial/destroy/restore/purge), all users, AppSumo codes, support tickets, Vena chat tickets/escalations, webhook logs, feature flags, system health, job/queue monitoring, impersonation, platform owner's own security, partners & equity drawings, and the full monetization surface (Plans, Platforms, Coupons, Access Grants, Tenant Overrides).
Controllers: `app/Http/Controllers/Admin/*` (`SuperAdminController`, `SupportController`, `VenaTicketsController`, `JobsController`, `HealthCheckController`, `ImpersonationController`, `DigitalHubController`, `NewsletterHubController`, `DemoStoreController`, `SmokeTestController`, `PkVerificationController`) and `app/Http/Controllers/SuperAdmin/*` (`PlanController`, `PlatformController`, `CouponController`, `AccessGrantController`, `TenantOverrideController`).

## 3. `/superadmin/*`
Route name: `superadmin.*`. Middleware: `auth, superadmin` (a **different** middleware/guard than `SuperAdminMiddleware`).
Controller: `Admin\AdminDashboardController` only.
A smaller, apparently newer/leaner tenant-management surface (dashboard, tenant list, suspend/reactivate/upgrade) — functionally overlaps with a subset of what `platform.*` already does. Not clear from routing alone whether this supersedes or complements the `VenQore/*` console; both exist simultaneously.

## Summary
- **Admin (store-level)** = single-tenant operations, always scoped by `{store_slug}` + `tenant_id`.
- **SuperAdmin/Platform (platform-level)** = cross-tenant SaaS operator functions, no `tenant_id` scoping, guarded by platform-admin role checks instead of per-store permissions.

## Related
- [[Platform & SuperAdmin Routes]]
- [[Multi-Tenancy Architecture]]
- [[Controllers Directory]]

---
tags: [multi-tenancy, saas]
---

# Multi-Tenancy Architecture

Part of [[VenQore POS - Home]]

Each **Store** is a tenant (`Tenant` model). All data is scoped by `tenant_id`. A `User` can belong to multiple stores via the `TenantUser` pivot. The active tenant is resolved per request. A **Platform/SuperAdmin** layer exists above tenants — see [[Three Admin Surfaces]].

## Core Models
- [[Tenant Model Deep Dive]] — the tenant/store root, numeric PK (not UUID, unlike almost everything else).
- **TenantUser** — pivot/membership model with role hierarchy (owner=10 down to viewer=1, plus many mid-tier operational roles like cashier, dispenser, kitchen_manager, shift_supervisor).
- **User** — global identity; role/permissions/passcode live in `TenantUser`, not `User` (a documented "Definitive Plan" migration).

## Tenant Scoping Pattern
Enforced via `App\Traits\HasTenant` trait, present on ~100 of 128 models. Rule from `CLAUDE.md`: **all DB queries must include tenant_id scope — never query cross-tenant.**

### Explicitly NOT tenant-scoped (by design)
Platform-level models: `Platform`, `PlatformActivityLog`, `PlatformAuditLog`, `PlatformEquityDrawing`, `PlatformPartner`, `Plan`, `PlanFeature`, `PlanLimit`, `Coupon`, `AccessGrant`, `AccessGrantRedemption`.
Marketing/ops models: `ContactSubmission`, `NewsletterSubscriber`, `EmailSuppression`, `ToolLead`, `ToolLeadEvent`, `ToolUsage`, `WebhookLog`, `DemoVisitorLog`, `DigitalProduct`.
Deliberately global: `ErrorLog` — comment states it "remains fully global and writable/readable even when tenant scoping is broken," so platform diagnostics survive a tenant-scoping bug.

## Schema Hardening History
A multi-week retrofit campaign is visible in the migrations (see [[Schema Evolution & Hardening]]):
`add_missing_tenant_ids`, `add_tenant_id_to_missing_tables`, `fix_multi_tenant_unique_indexes`, `harden_tenant_isolation_on_remaining_tables`, `complete_tenant_isolation_final`, `add_multi_tenant_performance_indexes`. Several service-layer comments (`WOUND 3 FIX` on `AiRecommendation`, `CustomerAnalytics`) indicate real cross-tenant data leak bugs were found and patched.

## UUID vs Numeric PKs
Near-universal UUID PKs via `HasUuids`, **except** `Tenant` (numeric auto-increment, used directly in URLs: `/s/{id}/...`) and several simple pivot/log tables.

## Related
- [[Tenant Model Deep Dive]]
- [[Plans, Limits & Billing]]
- [[Three Admin Surfaces]]
- [[Core Tables - Multi-Tenancy]]

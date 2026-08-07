---
tags: [routes, platform, superadmin]
---

# Platform & SuperAdmin Routes

Part of [[VenQore POS - Home]] · [[Route Map Overview]] · [[Three Admin Surfaces]]

## Platform Owner — `VenQore/*` (name `platform.`, middleware `SuperAdminMiddleware`)
Root: `platform.dashboard` → `Admin\SuperAdminController@dashboard`.

| Sub-area | Routes/Controller |
|---|---|
| Digital Hub | `platform.digital-hub.*` → `Admin\DigitalHubController` |
| Newsletter Hub | `platform.newsletter-hub*` → `Admin\NewsletterHubController` |
| Chatbot | `platform.chatbot.*` → `ChatbotSettingsController`, `AgentChatController`, `VenaAssistController` |
| Stores/Users mgmt | `platform.store.*`, `platform.user.*`, `platform.users.*` → suspend/activate/extend-trial/toggle-internal, trash mgmt (destroy/bulk-destroy/restore/purge) |
| AppSumo | `platform.appsumo.*` → codes generate/import/export/purge |
| Support Inbox | `platform.tickets*`, `platform.ticket.*` → `Admin\SupportController` |
| Vena Tickets (platform) | `platform.vena.tickets*` → `Admin\VenaTicketsController@index/show/updateStatus` |
| Webhooks | `platform.webhooks` → `Admin\SupportController@webhooks` |
| Health/Monitoring | `platform.health.*` → `Admin\HealthCheckController`, `Admin\SuperAdminController` |
| Jobs/Queues | `platform.jobs.*` → `Admin\JobsController` (metrics, retry/delete/flush failed) |
| Impersonation | `platform.impersonate.*` → `Admin\ImpersonationController` |
| Platform owner security | `Auth\PlatformOwnerAuthController` — set/clear passcode, change password, action passcode |
| VenSynQ toggle, settings, partners/drawings | `Admin\SuperAdminController` |
| **Monetization** | `platform.plans.*` (`SuperAdmin\PlanController`), `platform.platforms.*` (`SuperAdmin\PlatformController`), `platform.coupons.*` (`SuperAdmin\CouponController`), `platform.access-grants.*` (`SuperAdmin\AccessGrantController`), `platform.tenants.overrides*` (`SuperAdmin\TenantOverrideController`) |
| PK Verifications | `platform.pk-verifications.*` → approve/reject/download |
| Demo Store | `platform.demo-store.*` → status/reset/deploy/deploy-status/cleanup/tests-run/tests-status |
| Smoke Tests | `platform.smoke-tests.*` → run/status/cleanup (read-only, per [[Database Policy]]) |

## `/superadmin/*` (name `superadmin.`, middleware `auth, superadmin`)
Controller: `Admin\AdminDashboardController` only.
- `superadmin.dashboard`, `superadmin.tenants`, `superadmin.tenants.suspend/reactivate/upgrade`.
- A smaller, leaner, functionally-overlapping surface — see [[Three Admin Surfaces]] for the distinction from `platform.*`.

## Related
- [[Three Admin Surfaces]]
- [[Controllers Directory]]
- [[Coupons, AppSumo & Access Grants]]

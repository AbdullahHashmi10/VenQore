---
tags: [services, jobs, queue]
---

# Jobs & Queue Workers

Part of [[VenQore POS - Home]]

`app/Jobs/*.php` — queue driver is `database` (Laravel Horizon available for UI).

| Job | Purpose |
|---|---|
| `DeployDemoStoreJob` | Deploys/resets the demo store asynchronously, logging progress to a per-job log file |
| `GenerateReportExport` (`ShouldQueue`) | Generates a financial report export; explicitly re-binds tenant context (critical for `HasTenant` global scope in queue workers), injects `FinancialReportingService` |
| `HandlePaymentFailedJob` | Reacts to a Lemon Squeezy `payment_failed` webhook |
| `HandleSubscriptionCancelledJob` (`ShouldQueue`) | Handles LS subscription-cancelled webhook |
| `HandleSubscriptionExpiredJob` | Handles LS subscription-expired webhook |
| `HandleSubscriptionUpdatedJob` (`ShouldQueue`) | Handles LS subscription-updated webhook, maps status via `LemonSqueezyStatus` |
| `ProvisionTenantJob` | Large (22KB) tenant-provisioning job from an LS checkout/subscription payload |
| `QueueHeartbeatJob` | Writes a cache heartbeat flag so monitoring can detect a stalled queue worker |
| `TokenRefreshJob` (`ShouldQueue`) | Refreshes OAuth tokens for Amazon/TikTok clients |
| `VenSynQSyncJob` (`ShouldQueue`) | Syncs multi-channel orders via `SmartFulfillmentService` + `AmazonClient` |

> [!warning] Tenant context in queue workers
> `GenerateReportExport` explicitly re-binds tenant context inside the job — a reminder that Laravel's queue workers run outside the HTTP request lifecycle, so the `HasTenant` global scope must be manually re-established or every query silently returns cross-tenant or empty results.

## Related
- [[Multi-Tenancy Architecture]]
- [[Billing & Subscription Services]]
- [[Key Commands]]

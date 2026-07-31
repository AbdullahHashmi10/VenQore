---
tags: [services, billing, saas]
---

# Billing & Subscription Services

Part of [[VenQore POS - Home]] · [[Plans, Limits & Billing]]

See [[Plans, Limits & Billing]] for the full service table (BillingHistoryService, LemonSqueezyCheckoutService, LemonSqueezyStatus, LemonSqueezySyncService, TrialCreditService, PlanGate, PlanRepository, ReportTierGate, PlanChangeNotifier).

## Related Jobs
- `ProvisionTenantJob` — 22KB job, creates/updates a tenant from a Lemon Squeezy checkout/subscription payload; resolves user email from multiple payload shapes.
- `HandlePaymentFailedJob`, `HandleSubscriptionCancelledJob`, `HandleSubscriptionExpiredJob`, `HandleSubscriptionUpdatedJob` — Lemon Squeezy webhook reactions.

## Related
- [[Jobs & Queue Workers]]
- [[Plans, Limits & Billing]]

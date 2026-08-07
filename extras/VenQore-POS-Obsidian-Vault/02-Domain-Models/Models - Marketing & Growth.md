---
tags: [models, marketing, growth]
---

# Models — Marketing & Growth (Platform-Level)

Part of [[VenQore POS - Home]]

These models are explicitly platform-level, not tenant-joined.

## ContactSubmission / NewsletterSubscriber
Marketing site contact form (`markRead()`) and newsletter signup.

## EmailSuppression
Global do-not-send list. Static `isSuppressed()`, `suppress()`, `liftIfUnsubscribed()` (only auto-clears self-service unsubscribes, not bounces/complaints).

## ToolLead / ToolLeadEvent / ToolUsage — free-tools lead capture funnel
`ToolLead`: consent audit fields (`consent_ip, consent_user_agent, consent_at, consent_text_hash`); a `$guarded_by_service` list documents fields only settable by `ToolLeadService`. `isMarketingEligible()`.
`ToolLeadEvent`: append-only (`UPDATED_AT=null`).
`ToolUsage`: anonymous aggregate telemetry — explicit hard rule against storing PII in `metrics`.

## Activity / ActivityLog / StoreActivityLog
`Activity`: general activity feed, scopes `scopeRecent`, `scopeOfType`.
`ActivityLog`: polymorphic, static helper `log()`.
`StoreActivityLog`: shares table name `activity_logs` with `ActivityLog` — likely superseding it for tenant-scoped logging.

## ErrorLog / WebhookLog / DemoVisitorLog
`ErrorLog`: deliberately NOT tenant-scoped; fingerprint-based deduplication via static `record()`.
`WebhookLog`: self-pruning — deletes oldest rows once count exceeds 500.
`DemoVisitorLog`: demo-site visitor counters.

## Related
- [[Multi-Tenancy Architecture]]

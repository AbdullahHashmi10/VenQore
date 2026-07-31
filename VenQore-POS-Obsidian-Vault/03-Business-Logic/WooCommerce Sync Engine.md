---
tags: [services, woocommerce, integrations]
---

# WooCommerce Sync Engine

Part of [[VenQore POS - Home]] · [[Models - WooCommerce Integration]]

`app/Services/WooSync/*` — "all sync intelligence lives here": priority resolution, conflict detection, SKU matching, queuing, webhook processing.

## SyncEngine
Constructor: takes a `WooConnection`; builds `FieldMapper` and `WooApiClient` internally.
| Method | Purpose |
|---|---|
| `runInitialImport()` | Pulls all Woo products, SKU-matches against tenant Products, creates `WooProductLink`s for matches, stages unmatched products into `WooSyncQueue` |
| `processWebhook(topic, payload)` | Dispatches to `handleWooProductCreated/Updated/Deleted` |
| `handleWooProductUpdated()` | Builds snapshots via `FieldMapper`, diffs them; resolves per `connection->priority_source`: `venqore` wins (re-push), `woocommerce` wins (pull+apply), else flags a conflict on `WooProductLink` |
| `pushToWoo()` / `pullFromWoo()` | Directional sync |
| `runSchedulerPoll()` | Full periodic reconciliation (every 15 min) as a safety net for missed webhooks; also detects brand-new Woo products |

## WooApiClient
"Thin wrapper around the WooCommerce REST API v3... only handles HOW to talk to WooCommerce."
Products, variations, categories, webhooks CRUD. All requests pass through `throttle()` — in-memory rate limiter capped at 120 req/min.

## FieldMapper
"The only place where field-level mapping logic lives."
- `venqoreToWoo()` / `wooToVenqore()` — bidirectional field mapping, SKU always the binding key.
- `buildDiff()` — old/new pairs for changed fields only.
- `mapVenqoreStatusToWoo()` / `mapWooStatusToVenqore()` — `active↔publish`, `inactive↔draft`, `archived↔private`.

## Related
- [[Models - WooCommerce Integration]]

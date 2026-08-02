---
tags: [services, vensynq, integrations, woocommerce, amazon, marketplace]
---

# VenSynQ Integration Engine

Part of [[VenQore POS - Home]] · [[WooCommerce Sync Engine]] · [[Jobs & Queue Workers]]

`app/Services/VenSynQ/*` — the multi-channel **order + fulfillment** engine. Distinct from
[[WooCommerce Sync Engine]], which is the **catalogue** sync. As of T16 the two are joined:
WooCommerce is now a first-class VenSynQ platform.

> [!info] Feature flag
> The whole module is gated behind `config('vensynq.enabled')` (`VENSYNQ_ENABLED`).
> `VenSynQController::__construct()` aborts 404 when disabled, and both jobs return early.

---

## Architecture

```
EcommerceChannel (per tenant, per marketplace)
        │
        ├── PlatformRegistry ──► PlatformClient (interface)
        │                           ├── AmazonClient        (SP-API)
        │                           ├── WooCommerceClient   (REST v3, T16)
        │                           ├── EbayClient          (Sell API)
        │                           └── TikTokClient        (Shop API)
        │
        ├── SyncOrchestrator ──► SmartFulfillmentService ──► Sale + Journal + FIFO
        │
        └── IntegrationHealthService ──► Green/Yellow/Red badges
```

### PlatformClient (contract)
`app/Services/VenSynQ/Platforms/PlatformClient.php`

| Method | Purpose |
|---|---|
| `platformKey()` | Machine key matching `ecommerce_channels.platform` |
| `getAuthorizationUrl()` | Where to send the merchant to grant access |
| `handleCallback(code)` | Swap the code for credentials |
| `refreshAccessToken(token)` | Rotate a short-lived access token |
| `fetchOrders(token)` | Pull orders as **NormalizedOrderItem[]** |
| `pushTracking(...)` | Send dispatch + tracking back to the marketplace |
| `testConnection(token)` | Non-throwing probe for Test Connection + health badge |
| `pushStock(token, sku, qty)` | Push absolute stock level (bidirectional sync) |

**NormalizedOrderItem** — the shape every adapter must emit:

```php
[
  'sku' => string, 'quantity' => int, 'sale_price' => float,   // UNIT price
  'platform_fee' => ?float,      // null => fall back to channel fee_percentage
  'channel_order_id' => string,  // the dedupe key
  'fulfillment_type' => 'fbm'|'fba'|'jit',
  'currency' => string,
]
```

### FBA vs FBM vs JIT
`SmartFulfillmentService` branches on `fulfillment_type`:

| Type | Inventory | Ledger |
|---|---|---|
| `fbm` | Deducts local stock via FIFO | Full sales journal + COGS |
| `fba` | **No local deduction** — stock sits in Amazon's warehouse | Revenue + fee journal only |
| `jit` | Raises a draft purchase invoice for day-of procurement | Posted on `approveJitDraft()` |

> [!warning] Why FBA must not deduct
> Amazon already holds the stock. Deducting locally double-counts and drives on-hand
> negative. `AmazonClient::fetchOrders()` maps SP-API `FulfillmentChannel`: `AFN → fba`, `MFN → fbm`.

### PlatformRegistry
`app/Services/VenSynQ/PlatformRegistry.php` — single source of truth for platform → adapter.
Also supplies `validationRule()`, `label()`, `defaultFeePercentage()` and `rotatesTokens()`
so request validation, UI copy and the token job can never drift from the registry.

### SyncOrchestrator
`app/Services/VenSynQ/SyncOrchestrator.php` — the **only** implementation of the sync loop.
Both `VenSynQController::fetchLiveOrders()` and `VenSynQSyncJob` delegate to it.

- `syncTenant(Tenant, ?userId)` — every connected channel for one tenant.
- `syncChannel(channel, ?tenant, ?userId)` — never throws; records failures onto the channel row.
- `pushStockForSku(tenant, sku, qty)` — returns channel names that refused the update.

Catches `Throwable`, not `Exception` — `\UnhandledMatchError` and `\TypeError` are Errors.
A failing individual order is logged and skipped so one bad SKU cannot abort the batch.

### IntegrationHealthService
Computes three independent signals per channel — **API**, **Webhook**, **Token** — plus a
rolled-up status. Overall = worst channel, never an average.

> [!note] Deliberately does zero network I/O
> The dashboard must paint instantly. Live probing happens only on explicit
> "Test Connection". Health is derived from local columns:
> `sync_status`, `consecutive_failures`, `last_synced_at`, `*_token_expires_at`.

---

## WooCommerce as a VenSynQ platform (T16)

`WooCommerceClient` is an **adapter**, not a rewrite. The mature WooSync module keeps
owning catalogue sync; VenSynQ gains order ingestion, health and dispatch.

**The join key:**

```
ecommerce_channels.external_seller_id  ===  woo_connections.uuid
```

Credentials are **not duplicated** — they stay encrypted on `WooConnection` where
`SyncEngine` already expects them. The `$accessToken` argument therefore carries the
WooConnection **uuid**, not a bearer token.

- Woo is always merchant-fulfilled → every line is `fbm`.
- `platform_fee` is a hard `0.0` (not `null`) — Woo takes no commission, and `null` would
  make the engine apply the estimated `fee_percentage` and invent a non-existent expense.
- `pushTracking()` sets the order `completed` and adds a customer-visible order note.
- `pushStock()` resolves SKU → product/variation id, then patches `stock_quantity`.

New `WooApiClient` methods added in T16: `getOrders()`, `updateOrder()`,
`createOrderNote()`, `updateStockBySku()`, `ping()`.

---

## Background jobs

See [[Jobs & Queue Workers]]. Both are `ShouldQueue` **and** `ShouldBeUnique`.

| Job | Schedule | Lock | Notes |
|---|---|---|---|
| `TokenRefreshJob` | every 10 min | `vensynq-token-refresh`, `uniqueFor` 600s | Skips WooCommerce (`rotatesTokens()` false) |
| `VenSynQSyncJob` | every 15 min | `vensynq-sync-all`, `uniqueFor` 900s | Runs after rotation so no sync starts on a dying token |

Both chunk with `chunkById(50)`, snapshot and restore the `current.tenant` container
binding in a `finally` block, and query with `withoutTenantScope()`.

`VenSynQSyncJob::failed()` resets any channel stranded in `sync_status = 'syncing'` to
`error`, so the dashboard can never show a spinner that never ends.

---

## Routes

| Name | Method | Purpose |
|---|---|---|
| `store.vensynq.index` | GET | Command center dashboard |
| `store.vensynq.settings` | GET | Integrations settings |
| `store.vensynq.health` | GET | JSON health poll (dashboard badges) |
| `store.vensynq.sync-orders` | POST | "Sync Now" manual trigger |
| `store.vensynq.channels.retry` | POST | "Retry Failed Sync" from Error Inspector |
| `store.vensynq.channels.test` | POST | Live Test Connection for a saved channel |
| `store.vensynq.amazon.test` | POST | Wizard step 3 — validate credentials, persist nothing |
| `store.vensynq.amazon.store` | POST | Persist validated Amazon credentials |
| `vensynq.universal.callback.{platform}` | GET | Fixed developer-portal redirect URLs |

> [!important] Ziggy
> Per CLAUDE.md, run `php artisan ziggy:generate` after any route change here.

---

## Frontend

`resources/js/Pages/VenSynQ/`

| File | Purpose |
|---|---|
| `Dashboard.jsx` | Command center; mounts `SyncHealthPanel` above the fold |
| `Settings.jsx` | Connect center; mounts `AmazonSetupWizard` |
| `Components/SyncHealthPanel.jsx` | Health badges, Sync Now + progress, freshness stamps, Error Inspector |
| `Components/AmazonSetupWizard.jsx` | 3-step LWA credential wizard with Test Connection |

**Local-first behaviour**
- Optimistic UI: "Sync Now" flips channels to *Syncing* on the same frame.
- Freshness recomputed from a 15s ticking clock, not rendered once server-side.
- While syncing, polls `store.vensynq.health` every 3s; interval cleared on unmount.
- Editing any credential clears a prior green Test Connection result.

---

> [!info] T17 — where the money goes
> Marketplace revenue no longer posts to cash. Orders land in `1205 Marketplace Clearing`
> and become bank money only when the owner confirms the payout.
> See [[Marketplace Clearing Pipeline]].

## See also
- [[Marketplace Clearing Pipeline]] — settlement, payouts and the money pipeline
- [[WooCommerce Sync Engine]] — catalogue sync internals
- [[Models - WooCommerce Integration]] — `WooConnection`, `WooProductLink`, `WooSyncQueue`
- [[Jobs & Queue Workers]]
- [[V3 Accounting Engine]] — journal posting for marketplace orders

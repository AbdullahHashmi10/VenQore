---
tags: [models, woocommerce, integrations]
---

# Models — WooCommerce Integration

Part of [[VenQore POS - Home]] · [[WooCommerce Sync Engine]]

## WooConnection (`WooConnection.php`) — per-tenant WooCommerce site connection
`SoftDeletes`. Encrypts `consumer_key, consumer_secret, webhook_secret, api_token` via custom accessor/mutator pairs (decrypt failures caught, return null); all hidden from serialization.
Methods: static `generateUuid()`, static `generateApiToken()` (`vq_` prefix), `webhookUrl()`, `isActive()`, static `defaultSyncFields()`.
Relations: `tenant`, `productLinks`, `syncQueue`, `syncLogs`.

## WooProductLink (`WooProductLink.php`)
SKU-based product match between VenQore `Product` and Woo product ID. Casts `conflict_data`, `synced_fields` array. Scopes: `scopeSynced`, `scopeConflicts`, `scopeStaged`, `scopeIgnored`. Methods: `markSynced(array $fieldSnapshot)`, `flagConflict(array $venqoreSide, array $wooSide)`.

## WooSyncLog
Append-only sync audit log (`UPDATED_AT=null`). Static factory `record(...)`.

## WooSyncQueue
Outbound/inbound sync job queue with backoff. Casts `payload` array, `process_after` datetime. Methods: `approve()`, `fail(string $errorMessage)` (exponential backoff capped at 1hr), `retry()`.

## EcommerceChannel (`EcommerceChannel.php`) — broader multi-channel (VenSynQ)
`SoftDeletes`. Encrypts `oauth_access_token`/`oauth_refresh_token` (hidden). Methods: `isAccessTokenExpiringSoon()`, `isRefreshTokenExpired()`. Used by Amazon/TikTok/eBay integrations, not just Woo.

## Related
- [[WooCommerce Sync Engine]]
- [[Models - Transactions & Sales]] (Sale.ecommerceChannel, jitPurchases)

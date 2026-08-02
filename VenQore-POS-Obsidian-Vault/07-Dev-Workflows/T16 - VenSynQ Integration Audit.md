---
tags: [changelog, ticket, vensynq, bugfix, audit]
---

# T16 — VenSynQ Integration, Bug Audit & Local UX Engine

Part of [[VenQore POS - Home]] · [[VenSynQ Integration Engine]]

**Date:** 2026-08-01 · **Scope:** WooCommerce + Amazon · **Status:** code complete, verification pending

---

## Defects found and fixed

### 🔴 1. Every marketplace OAuth callback fatalled
`VenSynQController::universalCallback()` called:

```php
return $this->callbackChannel($storeSlug, $platform, $request);   // 3 args
```

against `callbackChannel(string $platform, Request $request)` — **two** parameters, with the
store slug sitting in the platform position. `ArgumentCountError` under PHP 8.2.

The fixed URLs registered in the Amazon / TikTok / eBay developer portals
(`/amazon/callback` etc.) all route here, so **no channel could ever be connected via the
production redirect flow.**

**Fix:** `return $this->callbackChannel($platform, $request);`

### 🔴 2. Both background jobs silently did nothing, forever
`EcommerceChannel` uses `HasTenant`. Its global scope falls through to
`whereRaw('1 = 0')` when no tenant is bound *and* no user is authenticated — precisely the
state inside a queue worker.

```php
EcommerceChannel::where('is_connected', true)->get();   // always empty in a worker
```

`VenSynQSyncJob` logged *"No active connected channels"* on every run while orders piled up
unsynced. `TokenRefreshJob` logged *"No expiring tokens found"* while tokens expired.

**Fix:** `withoutTenantScope()` + explicit per-channel tenant binding.

### 🔴 3. Neither job was ever registered with the scheduler
Both classes existed and looked correct, but `routes/console.php` contained no entry for
either. "Scheduled sync" was dead code that could not have run in production regardless of
defect #2.

**Fix:** registered at 10 min (token) and 15 min (sync) with `withoutOverlapping()` +
`onOneServer()`.

### 🔴 4. `\UnhandledMatchError` escaped every catch block
```php
$client = match ($channel->platform) {      // no default arm
    'amazon' => $amazon, 'tiktok' => $tiktok, 'ebay' => $ebay,
};
```
`\UnhandledMatchError` extends `\Error`, so the surrounding `catch (\Exception $e)` could not
trap it. A single unrecognised platform row aborted the run for **every tenant** and left
channels stranded in `sync_status = 'syncing'`.

**Fix:** `PlatformRegistry::resolve()` throws a catchable `InvalidArgumentException`;
`SyncOrchestrator` catches `Throwable`.

### 🔴 5. Cross-tenant IDOR on order endpoints
`previewOrder()` / `processOrder()` validated `channel_id` as `required|integer` with **no
ownership check**, then passed it to `SmartFulfillmentService`. Any authenticated user could
post another tenant's channel id and write orders into that store. Same gap on
`warehouse_id` / `expense_category_id`.

**Fix:** tenant-scoped `Rule::exists(...)->where('tenant_id', $tenantId)` on all four.

### 🟠 6. WooCommerce would have been force-disconnected on first token run
Woo stores no refresh token and has a NULL `access_token_expires_at`, so every Woo channel
matched `TokenRefreshJob`'s "expiring" filter, hit the empty-refresh-token branch, and was
disconnected.

**Fix:** `PlatformRegistry::rotatesTokens('woocommerce') === false`; the job's `whereIn()`
excludes Woo entirely.

### 🟠 7. Rotated refresh tokens were dropped
Amazon and eBay may return a **new** refresh token alongside the access token. Only
`access_token` was persisted, so the next rotation used a revoked token and the channel died.

**Fix:** persist `refresh_token` when returned, with the correct per-platform expiry.

### 🟠 8. Wrong user lookup attributed sales to user #1
```php
$userId = User::where('tenant_id', $tenant->id)->first()?->id ?? 1;
```
Per CLAUDE.md a `User` belongs to many tenants through the `TenantUser` pivot; `users` has no
`tenant_id`. The query errored or returned nothing, and the `?? 1` fallback attributed
another store's marketplace sales to whichever user holds id 1.

**Fix:** `TenantUser` lookup filtered to `status = active` and non-null `user_id`, preferring
owner → admin.

### 🟡 9. Silent no-op on empty token response
`TokenRefreshJob` ignored a response with no `access_token` — the channel looked healthy while
holding a dead token. Now recorded as an error with `consecutive_failures` incremented.

---

## Additions

| Area | Change |
|---|---|
| Architecture | `PlatformClient` interface + `PlatformRegistry`; all four adapters conform |
| Architecture | `SyncOrchestrator` — de-duplicates the controller/job sync loops |
| WooCommerce | `WooCommerceClient` — Woo promoted to a first-class VenSynQ platform |
| WooCommerce | `WooApiClient::getOrders/updateOrder/createOrderNote/updateStockBySku/ping` |
| Amazon | 3-step LWA credential wizard + validate-only Test Connection endpoint |
| Health | `IntegrationHealthService` — API / Webhook / Token badges, zero network I/O |
| UX | `SyncHealthPanel.jsx` — Sync Now, live progress, freshness stamps, Error Inspector |
| UX | `AmazonSetupWizard.jsx` — 3-step wizard, per-step gating, inline validation |
| Jobs | `ShouldBeUnique`, `timeout`, `tries`, `backoff`, `chunkById`, `failed()` recovery |
| Schema | `platform` enum widened; `consecutive_failures`, `last_error_at`, `last_sync_duration_ms`, `auth_method` |

---

## Migration

`2026_08_01_090000_add_woocommerce_and_health_to_ecommerce_channels_table.php`

Widens the `platform` enum via raw `MODIFY COLUMN` (Doctrine DBAL cannot alter native MySQL
enums) and adds the four health columns.

> [!warning] Irreversible-ish `down()`
> Rolling back **deletes** WooCommerce channel rows before narrowing the enum. Without that,
> MySQL coerces them to an empty string and corrupts the rows.

---

## Verification status

| Gate | Status |
|---|---|
| PHP structural lint (balanced, no NUL bytes) | ✅ 41 files clean |
| JSX parse (`@babel/parser`) | ✅ 4 files |
| `ziggy.js` — 6 new routes, JSON valid, evaluates | ✅ 915 routes |
| `php artisan test` | ⏳ **not run** — no PHP in the build sandbox |
| `php artisan migrate` | ⏳ **not run** — no MySQL in the build sandbox |
| `npm run build` | ⏳ **not run** — `node_modules` is a Windows install |

### Run locally to close out

```bash
php artisan migrate
php artisan ziggy:generate      # canonicalise the hand-patched ziggy.js
npm run build
php artisan test --filter=VenSynQ
php artisan test
```

New test file: `tests/Feature/Module19/VenSynQIntegrationT16Test.php` — 14 tests, each pinned
to a specific defect above. Auto-registered by `tests/Pest.php` (Standing Rule #5: it globs
`tests/Feature/*`, so no orphan).

---

## Follow-ups not in this pass
- Product & variant **mapping wizard** UI (ticket §1) — deferred by scope decision.
- Amazon `pushStock()` returns `false` — Listings API role not provisioned.
- eBay / TikTok `pushStock()` — Inventory / Product APIs not wired.
- Woo GL uses `Dr 1000 Cash`; the ticket specifies `Dr 1205 Marketplace Clearing`. See below.

> [!question] Open question — Woo revenue account
> `WooCommerceController::webhook()` currently posts `DR 1000 Cash / CR 4000 Sales`, on the
> reasoning that Woo orders arrive already paid online. T16 asks for
> `DR 1205 Marketplace Clearing`. Clearing is more correct when a gateway settles on a delay.
> **Not changed** — it alters existing P&L/Balance Sheet behaviour and needs a decision plus a
> backfill plan.

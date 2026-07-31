---
tags: [frontend, offline, dexie]
---

# Offline Sync — Dexie & IndexedDB

Part of [[VenQore POS - Home]] · [[POS Terminal Deep Dive]]

## Database Definition
`resources/js/DB/LocalDB.js` — single Dexie database `VenQore_Offline_DB` (version 3) with stores:
`products`, `customers`, `suppliers`, `orders`, `invoices`, `inventory`, `settings`, `users`, `taxes`, `sales_queue` (auto-increment, POS offline sync queue), `offline_invoices`, `sync_queue` (generic table/action/data queue).
A `db.on('populate', ...)` hook seeds a `last_online_verify` timestamp setting.

`resources/js/Utils/db.js` re-exports that Dexie instance as `db` and exposes `isOnline()` (wraps `navigator.onLine`).

## Sync Engine — `useOfflineSync.js`
`resources/js/Hooks/useOfflineSync.js`:
- `checkPending()` — counts pending rows in `sales_queue`.
- `saveOfflineSale()` — writes a sale to `sales_queue` with `status: 'pending'`, immediately attempts sync if online.
- `syncPendingSales()` — iterates pending queue rows, POSTs each to `route('store.sales.store', { store_slug })` via axios, marking `status: 'synced'` on success or recording `last_error`/`attempt_count` on failure.
- Auto-runs on the browser `online` event and a 60-second `setInterval` poll.
- Supports "recall offline sale" UX via `getPendingSales()`/`deletePendingSale()`.

## Consumption in Pos.jsx
`isOnline`/`offlineSales`/sync functions drive a "Sync Hub" UI (`showSyncHub`), badge counts, and `handleRecallOfflineSale()` (moves a queued offline sale back into the active cart, deletes it from the queue). Standard browser `online`/`offline` listeners also toggle `isOnline` directly in `Pos.jsx` (redundant/complementary to the hook's own listeners).

## No Service Worker Found
No service worker or PWA manifest references were found inside `Pos.jsx` itself; a `PwaInstallPrompt.jsx` component exists in `Components/`, suggesting PWA install-prompt UX exists elsewhere, but the offline capability relies purely on **Dexie + online/offline events**, not a service-worker-intercepted fetch layer.

## Related
- [[POS Terminal Deep Dive]]
- [[API Routes]] (`/api/sync/*`)

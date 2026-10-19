# Offline contract

The one page that says what VenQore does without internet. The website, the app text and the sales answers must say no more than this. If behaviour changes, change this page first.

## The limit

**7 days.** A device that has not connected to VenQore for more than 7 days locks until it connects once. Sales saved on it are kept and sent after it connects.

One number, written in four places that must change together:

| Place | What it enforces |
|---|---|
| `resources/js/lib/offlinePolicy.js` (`OFFLINE_LIMIT_DAYS`) | Browser licence check (`Services/SyncService.checkLicensing`), banner text, saved-page age |
| `public/sw.js` (`OFFLINE_LIMIT_MS`) | A saved page older than this is not served |
| `windows-app/main.js` (`OFFLINE_LIMIT_DAYS`) | Station full-screen lock |
| Public pages (`Data/featurePages.js`, `competitors.js`, `solutions.js`) | The words customers read |

## What works with no internet

| | Browser | Windows Station |
|---|---|---|
| POS till: search products from the saved list, ring cash and manual-entry sales | Yes, sales saved on the device and sent later with a receipt key | Same |
| Open the app fresh (no internet) | Yes, for pages opened before on this device | Yes, same saved pages |
| Front of House (tables, takeaway, delivery) | Yes, on ONE device: seat a table, take and change the order, send to the kitchen (the slip prints from the device), takeaway, delivery, take payment. Kept on the device and sent to the server in order on reconnect. Splitting a bill and online orders need internet | Same |
| Every other page | Opens as a saved copy marked "not live". Saving needs internet | Same |
| Receipt printing | Normal print dialog | Direct to thermal printers |
| Card / online payments, manager approvals, new invoices, reports refresh, AI, email, QR menu, online store, WooCommerce | Need internet | Same |

## How it works

- `public/sw.js` keeps the app files (`/build`, fonts, images) and, per page the person opens under `/s/{store}/`, the HTML and the Inertia JSON. Network first; the saved copy is served only when the server does not answer within 8 s (pages) / 6 s (in-app). Inertia copies carry `props.vq_offline_snapshot.at`, so the banner can say "saved data from HH:MM".
- Saved pages are wiped on any login/logout request, and are ignored after 7 days.
- `lib/offlineCache.js` keeps the store's pages saved while online: the POS and Front of House always, plus every store page linked from the screens the user has seen (up to 40, no logout/export/print/API links). It re-saves them about every 30 minutes while the app is open and the tab is visible, and again when the internet returns. Each copy replaces the old one, and the service worker deletes copies older than 7 days (`PRUNE_PAGES`). Offline, a page shows the data as of its last save. A page never linked from any screen the user has opened is not saved until they open it once.
- `lib/connectivity.js` is the single answer to "online?": network adapter + real request results + `/ping` + Station's own monitor. POS, Front of House and `Utils/db.isOnline()` all read it.
- `lib/offlineFloor.js` is the Front of House floor kept on the device: a port of the table rules in `TableServiceController` (cards, states, totals, firing, convert, merge, payment). `Pos/Table/useTableService.js` runs every table action on it when the server cannot be reached and queues the action; when the server answers, the queue is replayed in order (`replayOutbox`). Tables and tickets opened offline carry a `client_ref` (and takeaway numbers a `client_code`) so a retry can never open a second one and the number on the printed slip is kept. A replayed kitchen send is sent with `offline_replay` so the kitchen screen does not show food that was already cooked. A table another device opened first is not overwritten: the change is listed on the Front of House screen under "Needs a look". A payment taken offline goes through the same device sale queue as the till (`Hooks/useOfflineSync`) and the table is closed locally.
- While offline, `bootstrap.js` refuses saves (non-GET requests) and `app.jsx` refuses non-GET Inertia visits with one clear message. Only the till queue, the heartbeat and `/sync/` are allowed (`writeAllowedOffline`).
- `Components/OfflineModeBanner.jsx` is the only offline notice. The global "Can't reach VenQore" pop-up is skipped while that banner is already showing.

## Not promised

Offline sign-in, offline manager approvals (a below-cost or over-limit sale is rejected when it syncs and waits for a person), two devices sharing the same tables while neither can reach the server (each has its own floor; the first to reconnect wins a table and the other's work for it is listed under "Needs a look"), splitting a bill offline, kitchen-screen updates offline (a fired order stays "in kitchen" until paid), kitchen routing to several stations offline (one slip per course), live stock from other devices, offline ledger posting (the ledger posts when the sale syncs).

## Test before changing any claim

1. Production build (not `npm run dev`), signed in, open POS and Front of House once. Wait 10 s.
2. Turn Wi-Fi off. Reload POS: it must open. Ring 2 sales. Open Reports: saved copy with the banner. Try to save a setting: refused with a message.
3. Close the browser, reopen the POS URL offline: it must open.
4. Wi-Fi on: the 2 sales send; banner disappears.
5. DevTools, IndexedDB `VenQore_Offline_DB`, `settings`, `last_online_verify` = 8 days ago, Wi-Fi off, wait 60 s: "connect once" lock screen.
6. Station: same as 2 and 3 inside the app; there must be no install prompt.
7. Front of House, same build: seat a table, add dishes, fire (the slip prints), open a takeaway and a delivery, pay one table in cash. All with Wi-Fi off. Reload the page: the tables are still there. Wi-Fi on: the banner counts the waiting changes down to zero and the floor matches. Then try two devices on the same table: the second one to reconnect shows it under "Needs a look".

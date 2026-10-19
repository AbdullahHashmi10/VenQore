# VenQore offline audit, 13 October 2026

Scope: what the product really does with no internet, in the browser and in the Windows Station EXE, compared with what the site and app say. This is a code reading of `app-code/main-app` and `app-code/windows-app`. **Nothing was run.** Items marked *(test)* must be confirmed with the test plan in section 6 before any claim is changed or kept.

## 1. Bottom line

1. The till has a real offline sale queue. If the POS page is **already open** when the connection drops, you can search products from the device copy, ring sales, and they are stored in IndexedDB and sent later with a receipt key so none is double-posted. That part is well built.
2. Nothing in the product lets you **open, reload or restart** the app with no connection. The browser service worker caches only two icons and never serves a page. The EXE is a shell around `https://www.venqore.com`; with no connection it shows a "Retrying" screen. So "works indefinitely", "100% offline PWA" and "full functionality continues" are **not true** as written.
3. The "30 days" is a **licence rule**, not an offline guarantee. After 30 days without a successful check-in the browser locks. The EXE is stricter: it locks after **7 days**. The site says "indefinitely". Three different numbers.
4. Several specific claims have no code behind them: offline PIN login, WebUSB receipt printing, "local SQLite", offline ledger posting, offline invoices, offline stock.

## 2. What you most likely hit

The words "Connection lost. Please check your internet." come from one place: `resources/js/bootstrap.js` (the global axios error handler). It fires for **any** request that gets no answer from the server at all, and shows the same text whether the problem is your internet, your own PHP/database being stopped, or one slow endpoint. It does not mean "the app is offline-capable and is waiting".

Why it can appear even for a local copy:

- If you stopped PHP, MariaDB or Vite, every request fails and you see exactly this message. Local mode still needs the local server.
- Any page action (changing page, opening a report, saving) is a server request. Only the **POS till** has a local fallback. Everything else just errors.
- The till switches to offline mode only when the browser itself says `navigator.onLine === false`. If Wi-Fi is on but the server is unreachable, `navigator.onLine` is still true, so the till keeps trying the server and shows the red toast instead of queuing quietly *(test)*.
- With the Vite dev server (`npm run dev`) the service worker is not registered at all, so local testing cannot show the production behaviour.

To confirm in 2 minutes: open DevTools, Network tab, and look at the red request when the message appears. That request is the cause.

## 3. What works and what does not (from the code)

Legend: ✅ works, ⚠️ partly, ❌ does not work, ❓ not verifiable by reading.

### A. Browser, POS page already open, connection drops

| Thing | Status | Evidence / note |
|---|---|---|
| Search or scan a product | ✅ | `Pos.jsx` falls back to `db.products` (Dexie) when `navigator.onLine` is false. Only as fresh as the last sync (see below). |
| Ring a cash sale | ✅ | `saveOfflineSale` stores a CHECKOUT INTENT with a receipt key, store id and time. Reference shows `OFFLINE-xxxx`. |
| Sale syncs on reconnect | ✅ | `useOfflineSync`: same key re-sent, status check before resend, no double posting, rejected sales wait for a person. |
| Queue survives closing the tab | ✅ | IndexedDB. Storage persistence request exists. |
| Product list freshness | ⚠️ | `SyncService.hydrate()` runs on page load and every 30 minutes, only while online and only under `/s/{store}/...`. Price or stock changed in the last 30 minutes is not on the till. |
| Stock check / negative stock warnings | ❓ | Offline path uses the products copy; `inventory` is copied only if the server sends it. *(test)* |
| Customers and khata balance | ⚠️ | Copy of customers is stored; balances shown are as of last sync, and credit sales cannot check the live limit. *(test)* |
| Sale needing manager approval (below cost, discount over limit) | ❌ | The approval check is on the server (`PosSaleApprovalGuard`). The sale is queued, then **rejected on sync** and parked as "needs attention". No offline PIN approval. |
| Card, bank, wallet, online-gateway payments | ❌ | Need the provider. Cash and manual entry only. |
| Print a receipt | ⚠️ | EXE: yes, printing is local. Browser: normal print dialog. **No WebUSB code exists** (`navigator.usb` appears nowhere). |
| Change page (Inventory, Reports, Purchases, Settings, anything else) | ❌ | Every page change is a server request. |
| Restaurant Front of House (tables, takeaway, delivery) | ❌ | By design: `useFohCheckout` refuses offline sales so two devices can't bill one table. |
| QR menu / online store / WooCommerce | ❌ | Need the server by nature. QR menu keeps the last menu page and re-sends a failed order when back online. |
| Vena AI, chat, email, SMS, notifications | ❌ | Online services. |
| Ledger / reports update | ❌ | Journal entries are posted by the server when the queue syncs, not at the till. |

### B. Browser, reload or open fresh with no connection

| Thing | Status | Evidence |
|---|---|---|
| Open the app | ❌ | `public/sw.js` handles only static files, skips `/build/` (the app JavaScript), and returns early for page requests. A page request goes to the network and fails. |
| `offline.html` shown | ❌ | It is cached but **never served**. The fetch handler has no navigation branch. |
| "Install as PWA, works offline" | ❌ | Installing gives a window onto the same online site. |

### C. Windows Station EXE

| Thing | Status | Evidence |
|---|---|---|
| Keeps selling if internet drops while the POS is open | ✅ | Same page, same queue as the browser. |
| Printing, cash drawer, customer display, serial scale | ✅ | Local: `lib/printers.js`, ESC/POS, winspool, serial. |
| Open the EXE with no connection | ❌ | `main.js` loads `https://www.venqore.com`. With no connection `shell-renderer.js` shows the offline screen and retries every 3-30 s. Nothing local to show. *(test whether any page is served from Chromium's disk cache; the app is not designed for it)* |
| POS crashes or is reloaded while offline | ❌ | Same as above. The queue is safe, but the till is unusable until the connection returns. |
| Offline limit | ⚠️ | **7 days**, then full-screen lock ("Connect to the internet to continue"), even if the page is open. Not 30. |
| Auto-update, pairing, new device | ❌ | Need internet. |

### D. The 30 days (browser)

- `SyncService.checkLicensing()` stores `last_online_verify` on each successful heartbeat. If more than 30 days pass, it tries a heartbeat; if that fails it blocks with "Local Server Check Failed. Please restart the application." That message is wrong for a customer: the real reason is "no check-in for 30 days".
- Subscription end date is also enforced offline, immediately, from the stored date.
- The lock screen offers a game in an iframe from `chromedino.com`, which cannot load offline.
- This runs only after a page has loaded, so it matters only for a device that stays open or reloads while online.

## 4. Claims versus reality

| Where | Current text | True? | Honest replacement |
|---|---|---|---|
| `featurePages.js` offline FAQ | "How long can VenQore operate without internet? **Indefinitely**…" | ❌ | "A till that is open keeps selling through an outage. The browser asks to reconnect within 30 days; the Windows app within 7 days." |
| `featurePages.js` hero stats | "100% Offline Capable", "0s checkout delay" | ❌ | Remove the 100%. |
| `featurePages.js`, `competitors.js` | "Full — all features work offline", "full checkout, stock & ledger offline" | ❌ | "Cash sales at the till, with product search, are saved on the device and sent when you reconnect." |
| `Roadmap.jsx` | "100% Offline-First PWA (Works without Internet)" | ❌ | "Offline sales queue at the till". |
| `Welcome.jsx` | "Internet down? No problem. Full functionality continues seamlessly." | ❌ | "Internet down? The till keeps selling." |
| `featurePages.js`, `solutions.js` | "Works offline: PIN authentication… stored on the device", "Offline lock screen & PIN" | ❌ | Remove. `db.users` is copied but nothing reads it for login. |
| `featurePages.js` | "WebUSB thermal printing works offline" | ❌ | Say "Windows app prints directly to thermal printers." |
| `competitors.js` | "local SQLite/IndexedDB" | ❌ | IndexedDB only (SQLite is banned in this product). |
| `solutions.js`, `competitors.js` | "ledger posting operate offline", "issue invoices … without internet" | ❌ | Ledger posts when sales sync. Invoices need the server. |
| `featurePages.js` | "Installs as a PWA, works offline" | ❌ | "Installs to the home screen; needs a connection to open." |
| `LandingPage.jsx` | "Replayed in sequence, checked seven ways, posted" | ❓ | Keep only if "seven ways" is a documented list. |
| Landing page theatre | "The line drops: the till notices in under a second" | ⚠️ | Detection is the browser's online event (immediate) or a 4 s timeout; say "quickly". |
| `Apps/Index.jsx`, `Billing/Index.jsx`, `PosShowcase.jsx` | "Keep ringing up sales during internet drops; syncs automatically" | ✅ | Keep, add "while the till is open". |
| `Pricing.jsx` | Offline mode on paid plans / extra register "with offline mode" | ❓ | Check the plan gate exists in code; I did not find one. |

## 5. Fixes, in the order I would do them

1. **Change the words first** (section 4). It costs nothing and removes the lie today.
2. **Make the app open offline in the browser**: a service worker that caches the app shell and JavaScript bundles and serves `offline.html` or the cached shell for navigations; or retire the PWA claim.
3. **Decide the limits and use one number**. Either 30 days everywhere or 7 days everywhere, shown on the Pricing and Features pages and in the lock screen text.
4. **Honest error text**: separate "your internet is down" from "our server did not answer". Use the till's own offline banner for the till.
5. **Offline product freshness**: show "Product list last updated at HH:MM" on the till, and refresh on reconnect immediately, not only every 30 minutes.
6. **Offline manager approval** or a clear refusal before the sale is rung, rather than a rejection later.
7. **Lock screen**: remove the game iframe, and fix the "Local Server Check Failed" message.
8. EXE: add a cached local start page so the till can reopen offline, or keep it online-only and say so.

## 6. How to test (do these before trusting any claim)

**Browser, real world**
1. Production build, signed in, open the till, wait for the catalogue sync (console shows `products hydrated`).
2. Turn Wi-Fi off (not just DevTools "Offline"). Confirm the till shows the red Offline dot.
3. Search and scan 3 products, ring 3 cash sales, one with a discount over the cashier's limit.
4. Open Sync Hub: 3 queued. Close the tab, reopen the same URL: expect the browser error page (this is the gap).
5. Wi-Fi on, reopen, press Force Sync. Expected: 2 posted, 1 "needs attention".
6. Check the journal, stock and receipt numbers on the server.

**Browser, 30 days**
1. In DevTools, Application, IndexedDB, `VenQore_Offline_DB`, `settings`: set `last_online_verify` to a number 31 days ago.
2. Reload while connected: should recover. Repeat with Wi-Fi off after the page is open: should lock after the 60 s check.

**Windows EXE**
1. Install Station, pair it, sign in, open the till. Disconnect the network cable or Wi-Fi.
2. Ring 3 sales, print a receipt, open the cash drawer. Expect all to work.
3. Press Reload in Station, or close and reopen it. Expect the offline screen, not the POS.
4. Reconnect: the offline screen should close by itself and the queue should drain.
5. 7 days: edit `lastOnlineSyncAt` in Station's preferences file to 8 days ago and go offline. Expect the full-screen lock.

**Local server**
Stop PHP and see the same toast. Start PHP, turn Wi-Fi off, and repeat the browser test above. That separates "no internet" from "no server".

## 7. What I did not check

I did not run the app or any test. I did not read `SyncController` to confirm what the sync endpoints return for stock and balances, did not verify plan gating of offline mode, and did not check how `Cache-Control` headers affect Chromium's cache for a cold EXE start. Those are the three places a surprise could still hide.


## 8. Status after the fix round (13 October 2026, later the same day)

Done in code (not yet built, deployed or released): 7 days everywhere; service worker v4 that keeps the app and every page opened, with a "saved data, not live" notice; POS and Front of House use one real connectivity check; saves are refused while offline with a clear message; no install prompt inside Station; false website claims rewritten; lock screen no longer loads a game from the internet. The contract is now `app-code/main-app/docs/OFFLINE_CONTRACT.md`, and sections 3 to 5 above describe the **old** behaviour.

Still true: Front of House cannot take or change orders offline; offline manager approval does not exist; the Windows app needs a new build and version to carry the shell change.

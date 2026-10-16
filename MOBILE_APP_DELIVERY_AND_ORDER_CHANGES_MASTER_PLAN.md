# VenQore master plan: order changes, delivery and riders, the one app, and getting the first customers

Date: 2026-10-16
Owner: Abdullah. Executor: IDE agent, one phase at a time.
Supersedes: `MOBILE_ONE_APP_ROLES_AND_PUSH_PLAN.md` (the small plan; its content is folded in here).
Companion docs: `app-code/mobile-app/COMBINED_APP_TECHNICAL_PLAN.md`, `FOH_IMPLEMENTATION_PLAN.md`, `app-code/main-app/docs/OFFLINE_CONTRACT.md`, `CLAUDE.md`.

---

## 0. How to use this file

1. Work ONE workstream phase at a time. Stop after each phase and report.
2. Everything marked VERIFIED was read in the code on 2026-10-16 (file named). It was READ, not run. Nothing here has been tested on a real device or printer.
3. Everything marked TO VERIFY must be checked in the code before it is relied on. Do not assume.
4. Rules that apply to every phase (from CLAUDE.md, repeated because they matter here):
   - Point, never copy. Roles and permissions come from `config/permissions.php` and `resources/js/Data/permission_inherits.json`; do not create a second roles list.
   - Every store write route needs `->middleware('permission:...')`. Every tenant-owned id in a validation rule is store-scoped (`Rule::exists(...)->where('tenant_id', ...)`). Add a case to `Hardening/V3IdScopingTest` for each new endpoint.
   - Any new route: run `php artisan ziggy:generate`.
   - Write portable SQL for MariaDB 10.5 (no SKIP LOCKED, no JSON_TABLE).
   - No claim in the app, store listing, site or videos that the build cannot back. If a feature is partial, label it beta or leave it out.
   - Verify by reading the file you changed. Paths in summaries have been wrong before.
5. Do not start Workstream C (the app) before a paying customer asks for it. See section 8.

---

## 1. Why this plan exists (decisions made on 2026-10-16)

- Selling matters more than building. Two demos in Okara did not convert; that is two data points, not a verdict.
- The first foreign niche: small retailers that sell in a physical shop AND online (WooCommerce/Shopify). That path is proven in the owner's own shop. Amazon/eBay/Etsy sync is a second wave, sold as BETA until tested (workstream D).
- Factories and big wholesalers are later, once there are paying customers to show.
- A store-owner conversation exposed real gaps: customers change restaurant orders constantly, and riders need to know when an order is assigned. Both are partly built (section 2). They become demo stories and test cases, not an excuse to start a big build.
- The mobile app (Business, Customer, rider) should be ONE app, ONE Play Store listing.
- Rule for new ideas from owner conversations: write the problem down, mark it built / partial / missing, and build only when two or more different owners ask.

---

## 2. Verified current state (read in code, 2026-10-16)

| Area | State | Evidence |
|---|---|---|
| Fire only new items to the kitchen | Built | `app/Services/KitchenTicketService.php` `fireOccupancy`: per-line `unsentDelta = qty - sent_qty`; fully sent lines skipped |
| Cancellation docket when a sent item is removed or reduced | Built | `TableServiceController.php` ~lines 226-262 compute `$cancelledItems`; ~306-325 call `formatCancellation` and create a cancellation WorkOrder; `KitchenTicketService::formatCancellation` sets `is_cancellation` |
| Reprint marked REPRINT | Built | `KitchenTicketService::reprint` sets `is_reprint` |
| Loud print failure | Built (UI) | `resources/js/Components/Pos/KitchenPrinterAlertModal.jsx` listens for `kot:print-failed` and offers retry |
| UI shows "sent (n) +m new" on partly sent lines | Built | `resources/js/Pages/Foh/Index.jsx` ~4233 |
| Kitchen told when a sent line's NOTE or MODIFIERS change | Missing (probable gap) | `fireOccupancy` skips a line when `unsentDelta <= 0 && sent`; the change detection only looks at qty. TO VERIFY by test, then fix |
| Riders as records | Built | `Employee` with rider flag/profile (migrations `2026_09_22_000003`, `2026_10_13_000002`); `Restaurant/Riders.jsx`; `RiderController` |
| Rider portal (web) | Built | `Commerce/RiderPortalController.php`; routes `/rider/{token}`, `/rider/{token}/step`, `/my-rides`, `/my-rides/step` in `routes/commerce.php` |
| Rider login or personal link | Built | `DeliveryController::linkLogin`, `riderLink`, `riderProfile`; tables `commerce_rider_accounts`, `commerce_rider_links` |
| Rider cash-up | Built | `DispatchController` `rider-cashup`, `cash-up`; `Restaurant/Riders.jsx` |
| Rider PUSH / SMS / WhatsApp alert on assignment | Missing | No push or messaging code found in the delivery controllers or service; `public/sw.js` has no push handler |
| TWO separate delivery systems | Found | (a) Restaurant/FOH: `DispatchController`, `RiderController`, rider stored in occupancy `session_data.delivery.rider_id`. (b) Online store: `commerce_deliveries` + `DeliveryService::assign`. Rider notification must cover both or unify them |
| WhatsApp share helper exists | Built | `resources/js/Components/WhatsAppShareModal.jsx`, `CommunicationController` |
| Mobile app | Skeleton | `app-code/mobile-app` is Flutter; `pubspec.yaml` has `webview_flutter` only; no Firebase/messaging. `COMBINED_APP_TECHNICAL_PLAN.md` says "implementation has not started" (check if stale) |
| Customer account | Per store only | `routes/commerce.php`: `/shop/{slug}/customer/otp`, `/login`, `/orders`. No marketplace-wide customer identity found |
| Create-or-join store | Built (web) | `Pages/Store/CreateOrJoin.jsx`, `Pages/Store/Join.jsx` |
| Delivery fee on the bill | TO VERIFY | Older audit (R14) said captured but not billed; `FOH_IMPLEMENTATION_PLAN.md` says it is now a real line. Confirm in `cartMath.js` / sale payload |
| Customer order-tracking link | TO VERIFY | `TrackingController.php` exists; no tracking route seen in `routes/commerce.php` grep |
| Amazon SP-API sync | UNTESTED | Approval obtained for UK marketplace (owner statement); UAE store available for tests; not exercised end to end |
| Lemon Squeezy checkout | UNTESTED end to end | Account approved (owner statement); full buy/upgrade/cancel/refund loop not yet tested |

---

## 3. Workstream A: changing orders and the kitchen

Goal: when a customer adds, removes, swaps or edits an item after the order was sent, the kitchen always knows, on paper and on screen, without cooking the wrong thing twice.

### A1. Test what exists first (1-2 hours, real thermal printer, FOH table order)
Scenarios, each with expected kitchen output:
| # | Action after first send | Expected |
|---|---|---|
| 1 | Add one new item | New slip with only that item |
| 2 | Increase qty of a sent item 1 -> 3 | New slip with +2 of that item, not 3 |
| 3 | Remove a sent item | CANCELLED docket naming the item and qty |
| 4 | Reduce qty of a sent item 3 -> 1 | CANCELLED docket for 2 |
| 5 | Add item and remove another in one edit | One new slip AND one cancellation docket |
| 6 | Edit note on a sent item ("no onions" -> "extra spicy") | EXPECTED: kitchen is told. Probably FAILS today |
| 7 | Change modifiers on a sent item | EXPECTED: kitchen is told. Probably FAILS today |
| 8 | Reprint a ticket | Slip clearly marked REPRINT |
| 9 | Unplug printer, fire | Blocking visible error with retry (`KitchenPrinterAlertModal`) |
| 10 | Takeaway and delivery tickets | Order type legible across the room |
Record the results in a table in `extras/` or the repo root. Film this test: it is the demo.

### A2. Fix the change-of-note/modifier gap (only if A1 #6/#7 fail)
- Treat a changed note or modifier set on a sent line as: cancel the old version, send the new version. Print one docket headed "CHANGED" showing OLD -> NEW, or two dockets (CANCELLED + new), whichever the kitchen printers handle better.
- Detect the change by comparing a stable hash of (name, notes, sorted modifier ids) stored on the line at send time (`sent_signature`), versus the current one.
- Touch points: `TableServiceController` (cancel detection block), `KitchenTicketService::fireOccupancy` and `formatCancellation`, `Foh/Index.jsx` line editing.
- Acceptance: scenarios 6 and 7 pass on paper and on the KDS; no duplicate cooking; offline replay (see A4) does not double-send.

### A3. Swap and "replace item" action (optional, only if owners ask)
One tap: replace sent item X with Y. Produces CANCELLED X + new Y, and keeps price logic in Sale Core (`cartMath.js`, `salePayload.js`). Do not fork the arithmetic.

### A4. Offline behaviour (TO VERIFY)
`OFFLINE_CONTRACT.md` / `offlineFloor.js` replay kitchen tickets. Confirm cancellation dockets and modifier changes also replay correctly and are not duplicated. If not supported, say so on the feature page; do not claim it.

### A5. KDS and station routing
Confirm cancellations and changes appear on the KDS screen and per-station printers, not only the main printer. Confirm the bar station does not receive food changes.

### A6. What we may say publicly (after A1 passes)
"New items go to the kitchen as their own slip; removed items print a CANCELLED slip; reprints are marked." Do not say "every change" until scenarios 6 and 7 pass.

---

## 4. Workstream B: delivery and riders

Goal: an assigned rider finds out immediately, can run the delivery from their phone, and the owner can reconcile cash. Two delivery systems exist today (section 2); decide before building.

### B0. Decision first: one assignment hook
Write down the single event "rider assigned to delivery" and give it ONE service: `App\Services\Delivery\RiderNotifier::assigned($tenantId, $riderEmployeeId, $payload)`. Call it from every place a rider gets assigned:
- Online store: `DeliveryService::assign` (new assignment AND reassignment).
- FOH/restaurant: where `session_data.delivery.rider_id` is set (check `TableServiceController` delivery save, `DispatchController`, `RiderController`).
Do not scatter send calls. Reassignment must notify the new rider AND tell the old rider it was taken away.
Longer term, decide whether the FOH delivery should move onto `commerce_deliveries`. Do not do this in v1; list it as debt.

### B1. Interim notification, no app needed (small, do this first)
- On assignment, show a "Send to rider on WhatsApp" action using the existing `WhatsAppShareModal`, pre-filled with the rider's personal link (`/rider/{token}`), order number, pickup, area, cash to collect.
- Acceptance: assign an order, tap send, the rider's WhatsApp opens with the link, the link shows the order and the step buttons.
- Do not put a full customer address in anything that might show on a lock screen.

### B2. Rider web page improvements (cheap, high value)
- Show only assigned, not-yet-delivered orders first; big step buttons (Picked up, Out, Delivered, Failed with reason).
- One-tap call customer and open map for the address.
- Cash to collect shown clearly; cash-collected recorded on Delivered.
- Auto-refresh the list while open; sound/vibration on a new order if the page is open.
- Acceptance: a rider with only the link can complete a delivery start to finish on a phone.

### B3. Push notifications (FCM), after the app exists (see Workstream C)
Server:
- Table `device_tokens`: id, tenant_id, user_id (or rider account id), platform, token (unique), app_version, last_seen_at, revoked_at.
- Endpoints (authenticated, tenant-scoped, permission-checked): register token, refresh, delete on sign-out.
- `RiderNotifier` queues an FCM HTTP v1 send. Service account JSON in server env only, never in the repo or the app. Failures must not break assignment: queue, log, retry once.
- Payload: order number, pickup name, drop-off area, cash to collect. Keep the lock-screen text free of full address and customer phone.
- Revoke tokens on sign-out and when a rider is deactivated.
Flutter:
- Add `firebase_core`, `firebase_messaging`. Android 13+ runtime notification permission, requested in plain language the first time a rider signs in.
- Foreground, background and terminated tap -> open "My rides" on that order.
- Acceptance (on a real phone, record Android version): assign an order with the app closed; phone alerts within seconds; tap opens the order; sign out -> no more alerts to that phone; reassign -> new rider alerted, old rider told.

### B4. Verify and finish the money side
- Delivery fee: confirm it is a real line on the bill in the shared Sale Core path (TO VERIFY). If not, it is a bug; fix in `cartMath.js` -> payload `delivery_charge` -> sale posting, with a test.
- COD reconciliation: confirm `rider-cashup` / `cash-up` match expected vs handed-in per rider per day, and that short cash is visible.
- Rider commission: not built. Do not claim. Add only if owners ask.

### B5. Customer tracking (TO VERIFY, then decide)
Check `TrackingController` and whether customers get a tracking link with status and rider ETA. If missing, it is the next most-requested delivery feature; scope separately.

### B6. What we may say publicly
Today: "riders get their own page with their orders and step buttons; cash-up per rider." Say "notifications on the rider's phone" only after B3 passes on a real device.

---

## 5. Workstream C: one app (Business, Customer, rider roles)

Goal: one Flutter app, one listing. See `COMBINED_APP_TECHNICAL_PLAN.md` for architecture (restricted WebView for unmigrated business screens, V6 tokens, no browser chrome). This section adds roles, entry flow, accounts and conversion.

### C1. Decisions
1. One app, one Play Store listing. No separate rider app.
2. Rider is a ROLE, not a mode. Role decides the home screen after sign-in.
3. The store owner assigns roles. A user can never pick "I am a rider".
4. Customers can browse without signing in; sign-in is requested at checkout.
5. Moving between Customer and Business requires signing out (as in the combined plan). A one-tap switch is a later option.

### C2. Entry screen
Three large cards: Order from stores / I work at a store / Run my business. Remember the last choice; settings has "Change", which signs out first. No URL bar, no browser chrome, no public marketing pages inside the app.

### C3. Role-based home
| Role | Home |
|---|---|
| Owner, admin, manager | Business dashboard (restricted WebView of approved pages) |
| Cashier, waiter | POS or FOH, filtered by permissions |
| Rider | My rides: assigned orders, step buttons, call, map, cash to collect |
| Customer | Shop: browse, cart, checkout, My orders |
Rider home first wraps `/my-rides` (permission `online.rider_deliveries`). Go native later only if the WebView is the bottleneck.

### C4. Global customer account (gap)
Verified: customer OTP/login/orders exist per store only. Build one global customer identity (verified phone or email) with a cross-store "My orders" screen. Keep per-store sessions working and link them by verified identity. TO VERIFY how customer sessions and `commerce_customers` are stored before designing tables. Customer-facing wording must not contain region-specific terms; language is a selectable choice.

### C5. Conversion and joining
- Customer profile -> "Start my business" opens the EXISTING create flow (`CreateOrJoin.jsx`, `StoreProvisioner`, Lemon Squeezy billing). No second path.
- "Join a store": owner's join code (`Join.jsx`). After joining, show the role the owner assigned; if none yet, "Waiting for the owner to give you a role".
- One person identity can hold: customer profile, staff or rider membership at store X, owner of store Y.

### C6. Security and data
- Mobile API: use the existing auth (email OTP, MFA, Sanctum). Tokens in secure storage. Do not trust `users.last_store_id` for authorisation; use `store.member` middleware on bare API routes.
- Device tokens (B3) are tenant-scoped and revoked on sign-out.
- Role changes take effect on next request, not next login.

### C7. Play Store and release
- One listing. New developer accounts may have a closed-testing requirement (number of testers and days) before production: CHECK THE CURRENT RULES IN PLAY CONSOLE NOW, because it can add weeks. Start the closed test as early as the app can be installed.
- Needed: privacy policy URL, Data Safety form (notifications, account data, location if used), screenshots, content rating, test account credentials for the reviewer.
- Pilot users and riders can install a signed APK directly while the listing is in review.
- Follow `RELEASE_AND_DEPLOYMENT_POLICY.md` for any server deployment tied to this.

### C8. Phases for Workstream C
1. Entry screen, role-based home, rider My rides in WebView. Accept: rider account lands on My rides and completes a delivery; cashier cannot see rider screens; owner sees dashboard.
2. Push (B3).
3. Global customer account and cross-store orders.
4. Customer -> owner conversion, join-with-code showing the assigned role.
5. Play Store submission.

---

## 6. Workstream D: getting the first customers (runs in parallel; this is the priority)

### D1. Lemon Squeezy end-to-end test (do first, about 1 hour)
- Test mode: buy each plan from the pricing page. Check: tenant receives the plan, limits apply, upgrade works, downgrade works, cancel works, refund removes access as designed, invoice email arrives, webhook signature is verified, duplicate webhooks are idempotent.
- Then ONE real purchase at the lowest price with a real card, then refund it.
- Confirm how payouts actually reach the owner in Pakistan (payout method, fees, schedule). Do not wait until the first sale.
- Check the checkout link per plan from the live pricing page and from an email.
- Until fully trusted, take the first 2-3 customers by invoice instead.

### D2. Demo company (seed once, reuse)
One demo tenant: a shop with a WooCommerce-style storefront, about 12 products WITH photos, finished storefront, a few sales and purchases, one supplier, one customer. A restaurant demo tenant for the order-change story. Seed with a command so it can be reset. Nothing placeholder or sample-looking may appear (CLAUDE.md rule 4).

### D3. The 4-minute video (not the 2-hour one)
One story: "a sale in the shop or online updates stock everywhere, and the books are right." At most three screens. Only fix what appears on camera. Second video: the restaurant order-change flow from A1, on a real printer.
The long 2-3 hour recording is for later and gets clipped into how-to videos.

### D4. Outreach
20 short personal messages to small retailers who sell both in-store and online, with the 4-minute video. Then 20-30 conversations a week for 30 days. Write each objection down. After 50 conversations, judge.

### D5. Amazon SP-API test ladder (beta, background task)
1. SP-API sandbox: mock orders; confirm parsing and stock handling.
2. Live READ-ONLY on the UAE store: pull orders and stock, compare with Seller Central.
3. Push ONE stock update on a low-risk SKU; confirm it appears on Amazon.
4. Watch real organic orders for several days; each must reduce stock exactly once.
Rules: never place fake or self-purchase orders on the seller's own account (against Amazon policy, risks the account). Confirm UAE is covered by the current SP-API authorisation (approval was for the UK marketplace). Describe it publicly as BETA until step 4 passes.

### D6. Other marketplace and cash options
- Apply to AppSumo now (not yet applied). LTD money is capital, not income; keep LTD off the VenQore website.
- Setup service: charge for configuring VenQore with the AI builder; real income and learning.

---

## 7. Claims register (what may and may not be said today)

| Claim | Allowed now? |
|---|---|
| New items go to the kitchen as separate slips | Yes after A1 passes on a printer |
| Removed items print a CANCELLED slip | Yes after A1 passes |
| Note/modifier changes reach the kitchen | No, until A2 passes |
| Riders have their own page with orders and step buttons | Yes (verified in code, confirm on a phone) |
| Riders get a phone notification | No, until B3 passes on a real device |
| Rider cash-up | Yes after a quick test |
| Amazon sync | Beta only; not until D5 steps 1-3 pass |
| One app for customers, staff and riders | No, until Workstream C phase 1 ships |
| Payments work | No, until D1 passes |

---

## 8. Order of work and gates

| Order | Item | Gate to start |
|---|---|---|
| 1 | D1 Lemon Squeezy test | none |
| 2 | D2 demo company, D3 4-minute video, D4 first 20 messages | D1 done or invoice fallback ready |
| 3 | A1 printer test (and film it) | printer available |
| 4 | D5 SP-API sandbox and read-only tests (background) | none |
| 5 | B1 WhatsApp-link interim, B2 rider page polish, B4 verify fee and cash-up | A1 done |
| 6 | A2 note/modifier fix | A1 shows the gap |
| 7 | C phase 1 (entry, roles, rider home) | at least one paying customer, or two owners ask for the app |
| 8 | B3 push | C phase 1 working |
| 9 | C phases 3-5 | demand |
| 10 | E WhatsApp sharing helper (section 11) | none; small, can go early with B1 |
| 11 | F in-app chat, level 1 (section 12) | C phase 1 + B3 working AND two owners ask |
Stop rule: if there are no paying customers after 50 real conversations, stop building and revisit niche and offer before any item from step 7 on.

---

## 9. Open questions for Abdullah

1. Which printer model and connection (Ethernet, USB, Station bridge) will the A1 test use?
2. Should the online-store delivery and the FOH delivery eventually be one system? (Recommended later, not now.)
3. Is the Flutter skeleton still the plan, or has anything been built since `COMBINED_APP_TECHNICAL_PLAN.md` (Oct 2)?
4. Which payout route will Lemon Squeezy use for Pakistan?
5. Is UAE covered by the current SP-API authorisation?
6. Do riders in the first target market use WhatsApp? (Decides how long B1 is enough.)

---

## 10. Starter prompt for the IDE agent (copy per phase)

"Read `MOBILE_APP_DELIVERY_AND_ORDER_CHANGES_MASTER_PLAN.md`, CLAUDE.md and the files named in section 2. Do ONLY phase <ID>. First list what you verified by reading code and what you could not verify. Make the smallest change that satisfies the acceptance criteria, add or update tests, run them, and report: files changed, test results, and anything you could not test (printer, phone, Play Console). Do not claim a feature works on a device you did not use."

---

## 11. Workstream E: WhatsApp sharing from everywhere (no API, user sends it)

Added 2026-10-16. Decision: the USER presses send in their own WhatsApp. The software never sends automatically, so there is no automation and no bulk sending, and no ban risk from API abuse. Do not use unofficial WhatsApp libraries (whatsapp-web.js, Baileys): those are the ones that get numbers banned.

### E1. What already exists (read, not run)
- `resources/js/Components/WhatsAppShareModal.jsx` opens `https://wa.me/{number}?text={message}` with the number and message pre-filled; backend `CommunicationController` (`store.communication.whatsapp.prepare`) builds the draft.
- Used today on: Party Ledger, Payments, Sales history and detail, Returns, Party Statement.
- Also `wa.me` links in `InvoiceReminderController` and `GrowthEngineController`.
- The modal itself notes that click-to-chat cannot attach files; user downloads the PDF and attaches manually, or uses Native Share on mobile.
- Settings fields for a WhatsApp Cloud API (`whatsapp_api_url`, `whatsapp_access_token`, `whatsapp_phone_number_id`) exist in `AdminController`. NOT needed for this workstream; TO VERIFY whether sending through them is implemented. Keep it off by default.

### E2. What can and cannot be done without the API
| Wish | Possible? |
|---|---|
| Open the right chat with the number already filled | Yes (wa.me / `whatsapp://send?phone=`) |
| Message text already written | Yes |
| Attach the PDF/file automatically | No, not with click-to-chat |
| Send the document as a secure LINK inside the message | Yes, works everywhere; recommended |
| On the mobile app, attach a real file | Yes via the phone's share sheet (Flutter `share_plus`), but the user must pick the contact; the number cannot be reliably pre-selected with a file |
| Stay inside our app with no hand-off to WhatsApp | No. Only the official Cloud API can do that; it is automated sending, needs Meta business verification, approved templates and per-message fees. Not part of this plan |

### E3. Build list (small)
1. One shared helper `useWhatsAppShare({ phone, text, link })` and one shared server helper that resolves the number, so every screen behaves the same. Replace ad-hoc `wa.me` code in the files above with it.
2. Phone resolution order (first non-empty wins): the number on THIS order/document (online order, FOH delivery card, takeaway name/phone) -> the linked customer/supplier record (`Party`) -> ask once in the modal and offer "save to customer".
3. Number normalisation: strip spaces, dashes, brackets; convert a local leading zero to the store's country code (from store settings), keep an existing `+` or `00` country code; reject numbers that are too short. Local formats like `03xx...` fail on wa.me if not converted. Add unit tests with numbers from several countries.
4. Document links: a signed, expiring, read-only URL for invoice/receipt/statement PDFs (tenant-scoped, no login), placed in the message text. Respect "walk-in customer" rules: no number means show the share button as "Choose contact" (`https://wa.me/?text=...`), do not block the sale.
5. Mobile app (Workstream C): use `url_launcher` with `whatsapp://send?phone=...&text=...` to open WhatsApp directly with the chat ready; fall back to `https://wa.me/...`. Use `share_plus` when the user wants to send the actual PDF file. Add the Android package visibility query for WhatsApp so the launch check works on Android 11+.
6. Where to add the button: sale receipt, invoice, quotation, purchase order (supplier), payment receipt, statement, return, FOH/online order confirmation, delivery "send to rider" (B1) and "your order is on the way" to the customer.
7. Message templates stay editable per store (`message_template_*` settings exist); keep wording free of region-specific terms.

### E4. Acceptance
- From a sale with a customer that has a number: one tap opens WhatsApp on that number with the message and a working PDF link.
- From an online order with no saved customer: the order's own phone is used.
- From a walk-in sale with no number: "Choose contact" opens WhatsApp with the text only.
- A `03xx` number in a store whose country is Pakistan opens as `92 3xx...`; a US number opens as `1...`.
- No call is made to any WhatsApp API; nothing is sent without the user pressing send.

### E5. Honest limits to state on the feature page
"Opens WhatsApp with the chat and message ready; you press send. Documents are shared as a secure link." Do NOT claim automatic sending or automatic file attachment.


---

## 12. Workstream F: in-app messaging (rider, owner, customer, store team)

Added 2026-10-16 (expanded same day). Status: IDEA, saved in full so it is not lost. Not scheduled. Build only after Workstream C phase 1 and B3 work, and only after at least two owners ask. Chat is a product of its own, so it is split into levels; stop at the first level that satisfies the owners.

### F1. The idea in the owner's words
In-app messaging between the rider and the owner, between the rider and the customer, and a group-style option where anyone inside a store can message anyone else in that store, so staff can talk to each other without leaving VenQore.

### F2. Why it matters (and why it is not urgent)
- Delivery is where phones ring all day: "where is the order", "customer is not answering", "which gate". Today this happens on personal phones and WhatsApp, outside the system and with no record.
- A thread attached to the order keeps the history with the order, helps settle disputes (wrong item, cash short, late), and removes the need to hand out personal phone numbers.
- It is also a retention feature: a store that runs its staff communication inside VenQore is harder to leave.
- It is NOT urgent: WhatsApp sharing (section 11) already covers rider and customer contact with no build. Chat must earn its place by demand.

### F3. What exists today (read in code, not run)
- Chat tables and controllers exist for the public website support chat and platform agents: `ChatSession`, `ChatMessage`, `VisitorChatController`, `AgentChatController`, Vena. That is visitor-to-platform support, NOT store messaging. Do not stretch it; tenant and permission rules differ. Reuse only UI ideas.
- `laravel/reverb` is in `composer.json`, but `.env.example` has `BROADCAST_CONNECTION=log`: no live realtime channel is configured.
- Production: MariaDB 10.5, no Redis, database cache/session/queue drivers, queue currently `sync` (CLAUDE.md says it must become `database`). A chat that sends pushes needs the queue to be real first.

### F4. Levels (build in this order, stop when satisfied)
1. ORDER THREADS. One thread per delivery or order. Participants: the dispatcher/owner/manager on duty, the assigned rider, the customer. Opens on assignment, closes some hours after delivered/failed, read-only afterwards.
2. DIRECT MESSAGES. One-to-one between staff and riders (owner to rider, manager to rider, cashier to kitchen).
3. STORE GROUPS. Channels such as "All staff", "Kitchen", "Riders", "Managers". Only if owners ask; this competes with WhatsApp groups and Slack.
Cross-store or platform-wide messaging is out of scope.

### F5. User stories
Level 1:
- As a rider, I open "My rides", tap an order, and message the dispatcher ("customer not picking up") without leaving the order.
- As a dispatcher, I see unread order threads as a badge on the delivery list and answer from the same screen.
- As a customer, I open my tracking link, tap "Message rider/store", and ask "please ring the bell". I do not need the app.
- As an owner, I can read any thread in my store, for example when a customer disputes something.
Level 2:
- As a manager, I message one rider ("come back to the shop, cash-up") without it being tied to an order.
- As a cashier, I message the kitchen "table 4 is waiting".
Level 3:
- As an owner, I post "shop closes early today" to All staff and see who has read it.

### F6. Who can talk to whom (matrix)
| Sender -> Receiver | Level | Rule |
|---|---|---|
| Rider <-> Dispatcher/Owner/Manager | 1 | Always, on an open order thread |
| Rider <-> Customer | 1 | Only inside an OPEN order thread for that order; closes after delivery window |
| Customer -> any staff directly | no | Customers only message inside their own order thread |
| Staff <-> Staff | 2 | Any two active members of the same store with `chat.use` |
| Group posts | 3 | Group members only; owner/manager creates groups |
| Anyone outside the store | never | |
| One store's users reading another store | never | Tenant isolation test required |

### F7. Permissions (use the existing system, do not invent a second one)
Add keys to `config/permissions.php` and `resources/js/Data/permission_inherits.json`, presets in `resources/js/Data/staff_presets.json` only:
- `chat.use`: can send/read messages in threads they belong to. Default ON for owner, manager, cashier, waiter, rider.
- `chat.manage`: create groups, close/reopen threads, see all threads in the store. Owner and manager only.
- `chat.audit`: read any thread (owner only by default).
- `chat.customer_contact`: lets a rider message a customer inside an order thread (owner can switch off so riders only talk to the shop).
Every route carries `->middleware('permission:...')`; every id in validation is store-scoped (`Rule::exists(...)->where('tenant_id', ...)`); add a case per endpoint to `Hardening/V3IdScopingTest`. Add the keys to `Users.jsx` category and the owner preset (see CLAUDE.md single-sources table).

### F8. Privacy and safety rules (the "get it right" list)
1. Rider and customer never see each other's phone numbers by default. The thread is the contact channel. Optional later: "call via the shop".
2. Customer chat must work WITHOUT the app: guest session tied to the order, opened from the tracking link or order page. In the app it uses the signed-in identity.
3. Customer threads close after delivery plus a window (default 6 hours; setting per store). After closing they are read-only and still visible to the owner for disputes. A failed delivery reopens it for the rider to reach the customer.
4. Owner can read every thread in their store. Say so in the store's privacy wording, and tell customers in the chat header ("this conversation is with <store> and may be read by the store").
5. Report and block: a rider or staff member can flag abusive customer messages; the owner can mute a customer thread; a customer can mute notifications.
6. Retention: per-store setting, default 90 days after close, then delete message bodies (keep a stub). Deletion on request must work. State the retention in the privacy policy.
7. Push payloads never carry message text on the lock screen: "New message" plus the order number only.
8. Attachments v1: images only (proof of delivery, photo of an item or a doorway), size-limited (for example 3 MB after client-side compression), type-checked by content not extension, stored under tenant-scoped storage with signed expiring URLs. No documents or videos in v1.
9. Abuse and spam: rate limit per sender per thread, maximum message length, links from customers shown as plain text, no HTML rendering (escape everything; this is an XSS surface).
10. No message content is sent to any AI service. If Vena ever summarises chats, that needs explicit owner consent and goes through `AiGateway`.
11. Never display placeholder or sample messages in a tenant-facing build (CLAUDE.md rule 4).
12. Region-neutral wording; language is a selectable choice; no hard-coded local-language terms.

### F9. Data model (proposal; verify against existing naming before migrating)
- `conversations`: id (uuid), tenant_id, type (`order`|`direct`|`group`), subject_type, subject_id (delivery id or order id for type order), title (groups), status (`open`|`closed`), opens_at, closes_at, closed_by, created_by, last_message_at, timestamps. Index (tenant_id, type, status, last_message_at); unique (tenant_id, type, subject_type, subject_id) for order threads so assignment cannot create duplicates.
- `conversation_participants`: id, conversation_id, tenant_id, participant_type (`user`|`employee`|`customer_guest`|`customer_account`), participant_id, role (`staff`|`rider`|`customer`|`owner`), can_post, last_read_message_id, muted_until, joined_at, left_at. Reassigning a rider = old rider's `left_at` set (loses live access, history stays), new rider added.
- `messages`: id (uuid or bigint), conversation_id, tenant_id, sender_type, sender_id, kind (`text`|`image`|`system`), body (max length), attachment_path nullable, client_ref (idempotency key for offline replay), created_at, edited_at nullable, deleted_at nullable. Unique (conversation_id, client_ref).
- System messages (kind `system`) for events: "Rider assigned", "Picked up", "Delivered", "Rider changed", "Conversation closed". They are written by the delivery code via one service, not by users.
- `chat_reports`: id, tenant_id, message_id, reported_by, reason, status.
- Customer guest sessions: signed token bound to (conversation, order); revocable; expires with the thread.
- All tables tenant-scoped (`tenant_id` + the `HasTenant` global scope). Write portable SQL for MariaDB 10.5.

### F10. API sketch (names are placeholders; follow existing route naming `feature.action`)
- `GET  /chat/threads` (mine, with unread counts, paged)
- `GET  /chat/threads/{id}/messages?after={messageId}` (incremental fetch for polling)
- `POST /chat/threads/{id}/messages` (idempotent with `client_ref`)
- `POST /chat/threads/{id}/read` (updates `last_read_message_id`)
- `POST /chat/threads/{id}/close` and `/reopen` (`chat.manage`)
- `POST /chat/direct` (create or get one-to-one with a staff member)
- `POST /chat/groups` (`chat.manage`)
- Public guest routes under the existing public commerce area with a signed token and strict throttle: `GET/POST /track/{token}/chat`.
- Mobile app uses the same endpoints with Sanctum auth; the rider WebView page can use the Inertia/JSON versions.
- After adding routes run `php artisan ziggy:generate`.

### F11. Delivery of messages (transport)
- v1: send over HTTP; receive by polling `after=` every 3-5 seconds while a thread is open, every 30-60 seconds for the unread badge while the app is in the foreground, none in the background (push wakes it). Cheap, works on the current database-driver hosting, no new process to run. Needs a covering index so the poll query is fast with a year of messages.
- Push: FCM via the `device_tokens` table and `RiderNotifier`-style service from B3, with a `ChatNotifier` that skips users who currently have the thread open and are online, and collapses bursts ("3 new messages").
- v2 (only if polling hurts): Laravel Reverb websockets. Requires a long-running process, supervision, proxy/TLS config on the VPS, per-tenant private channels with authorization, and a load test. The `queue` must be `database`, not `sync`. MariaDB-only and no-Redis constraints in CLAUDE.md still apply.
- Offline: queued on the device with `client_ref`, shown as "not sent yet", replayed on reconnect, deduplicated by the unique key. Follow `OFFLINE_CONTRACT.md` wording; use `lib/connectivity.js`, never `navigator.onLine`.

### F12. UX rules
- No floating bottom-right chat bubble. The thread lives inside the order screen (rider: My rides -> order; dispatcher: delivery card) and an inbox entry in the existing header notifications pattern (the single AI/notification surface the owner wants).
- Unread badge on the order, not a separate noisy counter. Do not show step counts or percentages anywhere.
- Quick replies for riders (big tap targets): "On my way", "Arrived", "Can't find the address", "Customer not answering", "Running late". One tap sends it. Customer-side quick replies: "Please call", "Leave at the door", "I'm coming down".
- System events appear inline in the thread so the order history and the chat read as one story.
- Do not take over the screen during fullscreen POS/FOH work; use the existing quiet notification pattern.
- Time stamps in the store's timezone; show sent / delivered / read only if read receipts are enabled (off by default; privacy).
- Accessibility: large touch targets for riders on bikes, high contrast, screen-reader labels.
- Empty states are honest: "No messages yet", not sample text.

### F13. Edge cases to design for
- Reassigned rider: old rider immediately loses access to the live thread and to the customer; new rider sees the history so far (owner setting: hide pre-assignment messages from the new rider).
- Rider deactivated or signed out: stop pushes, close their participant rows.
- Customer replies after the thread closed: show "this conversation has ended, contact the store" and, if the store allows, a button that opens WhatsApp (section 11) as the fallback.
- Customer without a verified identity: guest token only for that order; cannot start new threads.
- Same customer, many orders: separate threads per order, grouped under one customer in the owner's view.
- Staff leaves the store: remove from direct and group threads; keep the messages.
- Duplicate sends from flaky networks: `client_ref` unique key.
- Order cancelled: close the thread with a system message.
- Time skew on devices: order messages by server time.
- Very long conversations: paging by `after`, hard cap on page size.

### F14. Performance and cost
- Polling cost is small: one indexed query per open thread every few seconds. Keep payloads tiny (new messages only). Measure on the real KVM 2 VPS with 50 simulated open threads before enabling for everyone.
- Storage: text only is negligible; images are the cost. Compress on the device, cap size, expire images with the thread retention.
- FCM itself is free; cost is the engineering and maintenance time.
- Do not build a typing indicator or presence in v1; they multiply load for little value.

### F15. Phases
- F-0 Prerequisites: queue set to `database`; `device_tokens` and push (B3); app phase 1 (C). Decide the retention default and the close window with the owner.
- F-1 Order threads, text only: tables, send/fetch/read endpoints, system messages from delivery events, rider screen and dispatcher screen, customer tracking-link chat, polling, permissions, tenant isolation tests.
- F-2 Push and quick replies; image attachments; report/mute; retention job.
- F-3 Direct messages.
- F-4 Groups and read-by lists, only on demand.
- F-5 Reverb websockets, only if measured need.

### F16. Acceptance tests (level 1)
1. Assign a rider (online-store delivery AND a restaurant delivery): an order thread exists with dispatcher, rider and customer; a system message "Rider assigned" appears.
2. Rider app closed: customer sends a message from the tracking link on a phone with no app; the rider gets a push "New message" (no text) within seconds; tapping opens that order thread.
3. Rider replies with a quick reply; the customer sees it within one polling interval.
4. Reassign the rider: the old rider can no longer open the thread; the new rider is added; both get the right system message.
5. After delivery plus the close window the thread is read-only; the owner can still read it; the customer sees the closed message.
6. A user from another store cannot read or post (HTTP 403/404), proved by a test in `Hardening/V3IdScopingTest`.
7. Rider and customer phone numbers are not present in any response payload to the other side.
8. HTML/script in a message is displayed as plain text (XSS test).
9. Offline: a rider sends two messages with no signal; on reconnect both arrive once, in order.
10. Rate limit: a customer sending 30 messages in a minute is throttled with a clear message.

### F17. Claims
Do not advertise in-app chat until the level 1 tests pass on real phones, including one with no app installed (customer link). Until then, say "contact riders and customers via WhatsApp sharing".

### F18. Risks
- Scope creep into a full chat product. Mitigation: levels, stop rule, no presence/typing/reactions/voice notes in v1.
- Safety and harassment between riders and customers. Mitigation: no phone exposure, report/mute, owner audit, closing windows.
- Legal/privacy exposure from storing customer messages. Mitigation: retention setting, deletion on request, privacy policy wording, no AI processing.
- Support load: every chat bug becomes an urgent delivery bug. Mitigation: ship level 1 to one friendly store first.

### F19. Open questions
1. Should the customer be able to message at all in v1, or only the rider and shop staff first? (Safer: staff first, customer second.)
2. Default close window after delivery: 6 hours or longer?
3. Should the owner be able to switch off rider-to-customer chat per store (`chat.customer_contact`)?
4. Do we want read receipts at all?
5. Should group channels (level 3) wait until after the first 10 paying stores?

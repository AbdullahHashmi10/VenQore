# VenQore Commerce: problems users may face (audit)

Date: 3 October 2026. Scope: the public shop (directory, store page, cart, checkout, order status), the merchant Online Store screens (settings, products, offers, order inbox), and how online orders interact with POS stock, sales, payments and scheduled jobs.

How to read this: each item says **who is hurt**, **what happens**, **evidence** (where it is in the code, or "needs testing" when I could not prove it), and a **fix direction**. Severity: **P1** = loses money, stock or orders, or blocks a business. **P2** = real friction or support tickets. **P3** = polish or scale.

The last column shows what was done after your review.

---

## Summary

| # | Problem | Who | Sev | Status (after fixes, 3 Oct 2026) |
|---|---|---|---|---|
| 1 | Accepted orders hold stock forever if staff never finish them | Cashier, merchant | P1 Fixed: 24h reminder, unpaid auto-cancel at 72h (holds released); paid orders only remind |
| 2 | Checkout does not check stock, so customers can order sold-out items | Customer, merchant | P1 Fixed: checkout/quote refuses sold-out and over-stock lines |
| 3 | Pending orders do not reserve stock (many people can order the last item) | Customer, merchant | Fixed: waiting orders now claim units at checkout (they expire on their own, so it self-heals) |
| 4 | Customer is never notified of anything (no SMS / WhatsApp / email) | Customer | Partly fixed: optional customer email on every status change + WhatsApp buttons (customer and merchant). Automatic SMS/WhatsApp needs a provider account |
| 5 | Merchant only hears about orders by email; orders silently expire | Merchant, customer | Partly fixed: 10s polling, beep, all notification types emailed, stale/conflict/refund alerts. Push/SMS needs a provider |
| 6 | A double-submit replaces the customer's status link (old link dies) | Customer | P1 Fixed: several valid links per order |
| 7 | A lost status link cannot be recovered | Customer | P2 Fixed: Find my order (number + phone) |
| 8 | Customer cannot cancel their own order | Customer, merchant | P2 Fixed: customer cancel while pending/accepted and unpaid |
| 9 | Coupon uses are spent by rejected/expired/cancelled orders | Merchant | P2 Fixed: use returned on reject/expire/cancel, once |
| 10 | Change proposals can expire unseen (customer not told, deadline keeps running) | Customer | Fixed: deadline extended and the customer emailed when changes are proposed (if they gave an email) |
| 11 | Late-night orders get the wrong sale date (UTC) | Merchant, accountant | P2 Fixed: sale dated in store timezone (POS not checked) |
| 12 | Every online order creates a new customer record | Merchant | Fixed: staff can attach the sale to an existing customer with the same phone when completing |
| 13 | "Refund due" alerts are never emailed | Merchant | P2 Fixed: all notification types are emailed |
| 14 | Fake/spam orders are easy (no phone verification) | Merchant | Partly fixed: honeypot + too-fast-submit bot check, blockable numbers. Phone OTP needs an SMS provider |
| 15 | Cashier gets a confusing error when stock is reserved online | Cashier | P2 Fixed: message names the reserving online order(s) |
| 16 | Changing the shop link (slug) breaks old links and printed QR codes | Merchant, customer | P2 Fixed: old slug 301-redirects |
| 17 | Shared shop links show generic VenQore previews; shops not in sitemap | Merchant | P2 Fixed: server-rendered title/description/image for shop pages; shops in sitemap |
| 18 | Suspended/expired subscription strands pending orders | Merchant, customer | Fixed: locked-out businesses can still reject/cancel; waiting orders are auto-closed with a refund alert |
| 19 | Opening hours vs accept deadline: outside-hours orders expire overnight | Customer | P2 Fixed: deadline counts from next opening |
| 20 | Offline POS can oversell held stock (known) | Cashier | Fixed (policy): an offline sale is always recorded; the short online order is flagged to the merchant. Pre-sync prevention is impossible while offline |
| 21 | No online payment; transfers are verified by hand | Customer, merchant | P2 Not done: payment gateway out of scope |
| 22 | Store page is query-heavy (slow for big catalogues) | Customer | Fixed: catalogue stock and option lookups are batched (a handful of queries per page) |
| 23 | Shops without a city never appear in the directory | Merchant | P3 Already covered: city is required to publish |
| 24 | The delivery-fee product appears in product lists and reports | Merchant | Fixed: delivery-fee product is inactive, so it stays out of POS search and product lists |
| 25 | Unsupported product types (weighted, serial, legacy variants) silently missing online | Merchant | P2 Not done |
| 26 | No draft/private preview before publishing | Merchant | P2 Fixed: 24h signed preview link on the Overview page |
| 27 | Customer data kept forever, no delete/export path | Platform | Fixed: closed orders lose name/phone/address/email/notes after 180 days (daily job); totals kept |
| 28 | No order history for a returning customer | Customer | Fixed: status page lists the customer's other orders at that shop |

---

## P1: money, stock or orders at risk

### 1. Accepted orders hold stock forever if staff never finish them
- **Who:** cashiers (cannot sell the item at the counter) and merchants.
- **What happens:** accepting an order creates stock holds. Holds are only released by cancel or consumed by complete. Accepted orders have no expiry, so if staff forget an order (customer never comes to pick up, rider never returns) the stock stays reserved indefinitely and the POS refuses to sell it.
- **Evidence:** `OrderService::confirm` inserts holds; only `cancel` / `complete` change them; `expireDue` only touches `pending`.
- **Fix direction:** a "stale accepted order" rule. Remind the merchant after N hours, then auto-cancel (releasing holds) after a configurable limit. Show held quantity and the order on the product/POS screen, with a one-click "release".

### 2. Checkout does not check stock
- **Who:** customers and merchants.
- **What happens:** the store page greys out sold-out items, but the server quote/checkout never checks stock. A cart kept in the browser from yesterday, a stale page, or a direct request can place an order for an item with zero stock. The merchant then has to reject it, which is a bad first experience.
- **Evidence:** `CheckoutService::quote` / `place` have no availability check (only the UI button is disabled, `Store.jsx` line ~239).
- **Fix direction:** check available (on hand minus holds) in `quote` and return a "only N left / sold out" problem per line. Still keep the accept-time locked check as the final guarantee.

### 3. Pending orders do not reserve stock
- **Who:** customers (order accepted then rejected) and merchants (forced rejections).
- **What happens:** stock is only held when the merchant accepts. Five customers can order the last two items; the first accept wins and the rest must be rejected. The "3 left" badge also ignores pending orders.
- **Evidence:** holds are created in `confirm`, not in `place`.
- **Fix direction:** decide the policy. Option A: soft-hold at placement with a short timeout (released on reject/expire). Option B: keep it as now but count pending quantities in the badge and warn at checkout ("high demand, may be unavailable").

### 4. The customer is never notified
- **Who:** customers.
- **What happens:** after ordering, the customer only learns anything by reopening the status page. Accepted, rejected, ready-for-pickup, change proposals and expiry are all silent. In Pakistan most customers expect a WhatsApp/SMS.
- **Evidence:** `commerce_notifications` is merchant-only; no customer channel exists.
- **Fix direction:** at minimum, a "message the business on WhatsApp" button with the order number prefilled, plus an optional customer email. Later: SMS/WhatsApp Business API for status changes.

### 5. The merchant only hears about orders by email, so orders can expire unseen
- **Who:** merchants and customers.
- **What happens:** new orders are emailed (every minute) and shown via in-app polling. There is no sound, push or SMS. If nobody watches email or the app, the order expires after the accept deadline and the customer is left waiting.
- **Evidence:** `CommerceSendNotifications` sends only `new_order` by plain email; expiry runs every 5 minutes.
- **Fix direction:** a loud in-app alert (sound + browser notification) on any open VenQore tab, an "orders waiting" badge on POS, optional WhatsApp/SMS to the owner, and a warning email before an order expires.

### 6. A double-submit replaces the customer's status link
- **Who:** customers.
- **What happens:** if checkout is retried with the same key (double tap, slow network, back button), the server issues a new status token and overwrites the stored hash. The link from the first attempt (already bookmarked or screenshotted) stops working.
- **Evidence:** `CheckoutService::rotate` overwrites `status_token_hash`.
- **Fix direction:** store several valid token hashes per order (or a token table), or return the same token by keeping it encrypted rather than hashed.

### 20. Offline POS can oversell held stock (known, unchanged)
- **What happens:** a POS that is disconnected cannot see online holds and can sell reserved stock; the conflict appears when it syncs.
- **Fix direction:** sync holds to the offline POS cache, and warn or block on reserved items while offline. Until then, advise merchants who use offline POS to pause online ordering when offline.

---

## P2: friction and support tickets

### 7. A lost status link cannot be recovered
Only the hash of the token is stored, so if the customer closes the tab without saving the link, there is no "find my order by phone + order number". **Fix:** a lookup form (order number + phone) that re-issues a link, rate limited.

### 8. The customer cannot cancel their own order
There is no customer cancel route, so a mistaken order has to be phoned in. **Fix:** allow customer cancel while `pending` (and maybe `confirmed` before preparing), releasing holds and the coupon use.

### 9. Coupon uses are spent by orders that never complete
`uses` is incremented at placement and never decremented on reject, expire or cancel, so a "first 50 customers" coupon can run out with fewer real sales. **Evidence:** `CheckoutService::place` increments; no decrement anywhere. **Fix:** decrement on reject/expire/cancel (inside the same transaction).

### 10. Change proposals can expire unseen
When the merchant proposes a change, the customer is not told (see #4), and the accept deadline keeps running; the merchant cannot accept while a proposal is pending. The order often just expires. **Evidence:** `OrderRevisions` checks `accept_by` but never extends it. **Fix:** extend the deadline when a proposal is sent, and notify the customer.

### 11. Late-night orders get the wrong sale date
The app runs in UTC and completion posts `sale_date = now()->toDateString()`. In Pakistan (UTC+5), anything completed between midnight and 5 am is dated the previous day, which affects daily reports and closing. **Evidence:** `OrderService::complete`, `config/app.php` timezone UTC. **Fix:** use the store/tenant timezone for the sale date. Worth checking whether POS has the same issue.

### 12. Every online order creates a new customer record
By design (identity is unverified), each completed order creates a new party named "Name (online)". Repeat customers become dozens of duplicate customers, credit/receivable reports fragment, and there is no customer history. **Fix:** offer the merchant a "link to existing customer" choice on the order page (suggest matches by phone), rather than auto-merging.

### 13. "Refund due" alerts are never emailed
Expiry writes a `refund_due` notification, but the mail job only sends `new_order`. If the merchant isn't in the app, they never learn that a customer who already sent money needs a refund. **Fix:** email `refund_due` (and any future types) too.

### 14. Fake and spam orders are easy
Limits are 10 checkouts per minute per IP and 5 open orders per phone number, but the phone number is never verified, so anyone can type random numbers. A competitor or prankster can fill the inbox, and with #3 they can block real customers. **Fix:** an OTP option per store (off by default), a simple bot check, and a "block this number" button for merchants.

### 15. The cashier gets a confusing error when stock is reserved online
The POS throws the normal insufficient-stock error showing the free quantity. The cashier is not told the item is physically on the shelf but reserved for online order VQ-XXX. **Fix:** a specific message ("2 reserved for online order VQ-ABC-1234"), with a manager option to release or override.

### 16. Changing the shop link breaks old links and QR codes
The slug is editable, but nothing redirects the old slug. Printed QR codes, WhatsApp posts and bookmarks all 404. **Fix:** keep a slug history table and 301 old slugs to the current one; warn in Settings before changing.

### 17. Shared shop links look generic; shops aren't in the sitemap
The server-rendered meta and preview tags only exist for marketing pages, so pasting a shop link into WhatsApp/Facebook shows generic VenQore text instead of the shop name, description and banner. Shops are not listed in the sitemap. **Evidence:** `MarketingSeo::current()` has no shop case; `Store.jsx` only sets the title. **Fix:** server-side meta (title, description, banner image) for `/shop/{slug}`, and add published shops to the sitemap.

### 18. A suspended or expired subscription strands pending orders
Checkout closes when the tenant is not active, but orders already placed stay `pending`. Merchant pages sit behind the lifecycle middleware, so the merchant may be locked out while the orders expire and customers wait. **Needs testing:** exactly what the lifecycle middleware allows. **Fix:** let a locked-out tenant still see/reject/complete open online orders, or auto-reject with a clear customer message.

### 19. Outside-hours orders expire overnight
If a store enables orders outside opening hours, an order placed at 11 pm still gets the normal accept deadline (e.g. 30 minutes) and expires before the shop opens. **Fix:** for outside-hours orders, set the deadline relative to the next opening time.

### 21. No online payment; transfers are checked by hand
Bank transfer is "reported" by the customer and verified manually; refunds are a tracked confirmation, not a ledger entry. This works for a pilot but is a common source of disputes. **Fix (later):** JazzCash / Easypaisa / card gateway, and proper refund posting.

### 25. Unsupported products are silently missing online
Weighted items, serial-tracked items and products with the old variant table can't be sold online. The merchant may not understand why a product doesn't appear. **Needs check:** how clearly the Products screen explains the reason. **Fix:** show the reason next to each blocked product, and plan support for weighted items (common in grocery).

### 26. No draft/private preview before publishing
A merchant can't see the shop as customers will before going live. **Fix:** a signed preview link for unpublished stores (no checkout).

---

## P3: polish and scale

### 22. The store page is query-heavy
For each product on a page, stock is computed separately, and each option group runs its own query for siblings. With 24 products and several option groups, this is dozens of queries per page view, with no caching. **Fix:** batch stock and sibling lookups for the whole page; cache the directory.

### 23. Shops without a city never appear in the directory
The directory lists shops only by city. **Fix:** make city required before publishing, or show an "other" bucket.

### 24. The delivery-fee product shows up in lists and reports
The "Online delivery charge" service product (SKU `ONLINE-DELIVERY`) is auto-created and will appear in product lists, POS search and sales-by-product reports. **Fix:** hide it from POS search and catalogue lists, and label it in reports.

### 27. Customer data is kept forever
Names, phones and addresses stay in `commerce_orders` and auto-created parties indefinitely, and the status link exposes the address to anyone the link is shared with. **Fix:** a retention policy (mask the address after completion + N days) and a merchant "delete customer data" action.

### 28. No order history for a returning customer
Only "reorder" from an old status link exists. **Fix (later):** an optional phone-OTP "my orders" page.

---

## Items still open from the earlier review and roadmap
- Real pilot with a live business: not done.
- Full ERP-wide regression run after the stock-boundary change: not done.
- Pre-sale conversion and WooCommerce paths: covered by the shared stock check but no dedicated concurrency test.
- Merchant Online Store pages not restyled to the new storefront theme; webfonts not verified.
- Hand-picked-product offers: not built.

## What I checked and what I didn't
I checked these by reading the code: checkout, order lifecycle, holds, revisions, notifications, expiry job, scheduler, public controller and routes, and the store page UI. Items marked **needs testing** (#18, #25) are likely problems that I haven't reproduced. I did not run a load test, a real phone/WhatsApp flow, or a test with real payment providers.

## Suggested fix order (for discussion)
1. Stock and order safety: #1, #2, #3 (decide the policy), #6, #9.
2. Communication: #5 (in-app alert + sound), #4 (WhatsApp button + email), #13, #10.
3. Customer self-service: #7, #8.
4. Accounting correctness: #11, #12.
5. Abuse and links: #14, #16, #17, #18, #19.
6. The rest.

## Round 2 result (3 Oct 2026)
Still needing an outside account or decision: automatic SMS/WhatsApp to customers and merchants (SMS or WhatsApp Business provider), phone OTP (SMS provider), online payment gateway (JazzCash / Easypaisa / card), and #25 (explaining why weighted/serial/legacy-variant products are not sold online; weighted-item support is a feature, not a fix). Offline POS cannot be prevented while a till is offline; the system now records the sale and warns the merchant instead of losing it.

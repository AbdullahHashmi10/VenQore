# VenQore Commerce MVP — Handoff (updated 2026-10-03)

## Status
Built and synced to `app-code/main-app`. **Not deployed.**
- 114 Commerce tests pass (cloud, MariaDB), including two-connection concurrency tests; existing Reckoner sale-parity tests still pass.
- Verified in a real browser (cloud): public directory and store, cart, checkout, customer status page, merchant Home/Settings/Products/Orders pages, and the full journey place -> accept -> prepare -> ready -> complete. Result: one paid sale posted, hold consumed, stock 20 -> 19.

## Run on your machine
1. `php artisan migrate` (four migrations: commerce tables, notification delivery columns, photos/categories columns, V1 (announcement/banner/prep/zones/featured/promotions))
2. `npm run build`
3. `php artisan test tests/tests/Feature/Commerce`
4. Scheduler must run: `commerce:expire-orders` (5 min) and `commerce:send-notifications` (1 min).

## Closed since the first draft
- **POS no longer takes held stock.** `SaleService` calls `HoldGuard` before FIFO deduction (one inserted line in `app/Engines/SaleService.php`, applied by `commerce_apply_wiring.py`). Offline POS terminals can still sell while disconnected; that residual risk is real and unchanged.
- **COD/unpaid orders:** posted as a credit sale; receiving the money uses your normal Payments screen (link on the order page). The order flips to Paid when the sale is settled, and to Refunded when the sale is fully returned. The commerce code never writes money itself.
- **Staff permissions:** view = sales.view, accept/decline/advance = sales.edit, cancel = sales.void, complete = sales.create, recording money received = finance.receive_payment.
- **Email alerts:** outbox row written with the order; emailed after commit with up to 5 retries; mail failure never affects the order. Uses the store's contact email and your configured mailer.
- **Time zones:** found in browser testing. Staff pages switch PHP timezone per tenant but public pages do not, which made fresh orders look expired. Commerce rows are now written and read as UTC and shown in the store's timezone (regression test added).
- Products below cost are now labelled "Hidden from customers" for the merchant instead of "Live".

## Added since (start of Version 1: store experience)
- **Product pictures in the catalogue.** Photo grid with lazy loading, tone-coloured initials tile when there is no photo, tap for a detail sheet. Merchant: per-product "Online photo" upload in Products > Edit (overrides the product's own photo; remove to fall back), plus a store setting "Show product photos" for a compact text-only list.
- **In-store search and category chips** (public catalogue; published, sellable products only). Category counts include published items that may be hidden below cost.
- Mobile cart bar and bottom sheet; header layout fix.
- Run `php artisan migrate` for the 3rd migration. `public/storage` link is needed for uploaded photos.

## Version 1 — what is built (roadmap section 7)
**Storefront design:** the public shop follows `venqore_storefront.tsx` (premium glass layout, hero with feature cards, quick-view product cards, hub footer) in VenQore teal instead of gold, with **light and dark themes** (device setting by default, header toggle remembers the shopper's choice). Animations: staggered rise-in, bag count bump and add-to-bag toast, hover lift and image zoom, Offer-ribbon shimmer, tracker pulse, order-placed check, drifting particle background (paused when the tab is hidden); everything switches off for people with reduced-motion on. The merchant pages stay in the main VenQore app theme. Google Fonts could not load in my environment, so final typography is unseen.
**Store experience:** announcement banner, banner image, featured products (up to 12, shown first), category chips with counts, in-store search.
**Delivery and fulfilment:** delivery areas with a fee and minimum order each (customer must pick one, unknown areas rejected, minimum enforced per area), usual prep time estimate (shown as an estimate), receipt printing from a completed order via your normal sales print.
**Promotions:** dated offers and coupon codes (percent off, whole store or one category, minimum order, max uses). Rules: one promotion per line; a valid coupon replaces automatic offers; otherwise best automatic offer per line, category wins a tie; never below cost unless below-cost is approved; windows entered in store time and stored in UTC; orders snapshot list price, discount percent and offer name. The posted sale total equals the discounted order total (tested).
**Customer convenience:** "Order these again" on the status page (token-protected, only live items, repriced and rechecked by the server; the cart stores ids and quantities only).
**Fixed-amount offers:** "Rs X off the order" (optionally with a minimum order, a coupon code or a category), spread pro-rata over the eligible lines; a bigger percent offer still wins per line.
**Options (size, colour):** each size/colour is its own product (own stock, price, cost, holds) and the merchant groups them with a group name and option label; the shop shows ONE card with a picker. Legacy products flagged `has_variants` (the old variants table) remain blocked online.
**Stock holds are enforced everywhere in the app:** POS sales, stock transfers, stock adjustments and the older sale path cannot consume units an accepted online order holds.
**Order changes with customer consent:** while an order is pending the business can lower a quantity, remove a line or offer a substitute (priced at today's online price). The customer accepts or declines on their status page; the business cannot accept the order while a proposal is waiting; nothing changes until the customer agrees. Accepting rewrites lines and totals atomically.
**Analytics:** read-only last-30-days panel on Overview (placed, completed, sales, discounts, average time to accept/complete, declined/expired, repeat customers).
**Verified:** 114 tests (589 assertions); the customer flow (offer, coupon, delivery area, order, reorder) and the merchant Overview, Settings, Products and Offers pages in a real browser (one real bug found and fixed: the Offers page crashed until its `store` prop matched the other pages).

## Version 1 items NOT built (be clear with pilots)
- Offers on a hand-picked list of products (store-wide and per-category only).
- Variants use separate products grouped on one card; there is no single product with an internal variant table online.
- Offline POS can still oversell held stock while disconnected.
- Merchant pages were not restyled; the fake review ratings, "Verified Merchant" badge, multi-image gallery and sound effects from the mockup were deliberately not copied (no real data behind them).
- A pricing-rule note on the store header was not built (the shop does not show customers the merchant's pricing mode).
- Run `public/storage` link and `php artisan migrate` (new migrations 000003 to 000007).

## Still not done / honest limits
- Public pages now follow your design mockups (restyled from the mockup source files; Google Fonts could not load in the cloud, so final typography is unseen). Cart/Checkout mockup screens were built from source only.
- Only simple fixed-unit standard products can be published (no weighed, serial, recipe, tiers; sizes/colours via grouped options).
- The delivery fee posts as a service line.
- Offline POS can still oversell held stock while disconnected; pause online checkout for such stores (kill switch exists).
- Real bug found in the browser and fixed: the status page's buttons (bank transfer, change answers) redirected to a 404 because the page hides the referrer; they now redirect to the status page explicitly.
- Not yet exercised: bank-transfer path and delivery path in a browser (covered by tests only); the app's post-login redirect hit an error page in the cloud mirror (unrelated area, likely mirror setup) so I navigated directly.
- Cloud-only workarounds (not in your repo): fresh-migrate trouble with the expenses FK on MariaDB native uuid, and a CardRegistry migration. Pre-existing; check them.
- Roadmap pilot/launch gates (staging, 3-5 pilot merchants, 50 real completed orders, release policy) cannot be satisfied by coding. Version 1-3 scope is not started.

## Independent review (3 Oct 2026) - what changed
Findings F1-F5 from `extras/COMMERCE_VERSION_1_REVIEW_2026-10-03.md` were addressed:
- **F1/F4 stock protection:** the reservation check now runs inside `FifoService::deductStock` and `InventoryService::transfer` (the shared stock-consuming boundary used by POS, manual sales, pre-sale conversion and online accept), under the batch row lock, using locking reads. `ReservationConcurrencyTest` uses two real database connections (accept-vs-sale) and fails if the lock is removed.
- **F2 prepaid cancel:** a paid/transfer-reported order cannot be cancelled or rejected without confirming a refund; it then becomes `refunded`. This is a tracked confirmation, not a ledger posting. Expiry of such an order alerts the business.
- **F3 opening hours:** checkout is closed outside the store's hours unless "accept orders outside hours" is enabled (default off). No hours set = always open.
- **F5 frontend:** oxlint (a11y + react, correctness + suspicious) is clean on Commerce and Online Store pages.
- Run `php artisan migrate` (new migration 000008) and `python3 commerce_apply_wiring.py` on your tree.

## Remaining limitations (honest list)
- Offline POS can oversell held stock while disconnected (unproven/unfixed).
- Products with a legacy internal variant table stay blocked online.
- Draft/private preview of an unpublished store is NOT implemented (roadmap item).
- Offers apply to categories/all items; no hand-picked-product offers.
- Merchant pages are not restyled to the new storefront theme; webfonts unverified in cloud.
- Concurrency is tested for accept-vs-FifoService; pre-sale conversion/WooCommerce rely on the same boundary without dedicated tests. Full ERP-wide regression not run.
- Real pilot with a live business not done. Not deployed.

## User-problems audit fixes (3 Oct 2026)
See `extras/COMMERCE_USER_PROBLEMS_AUDIT.md` for the item-by-item status. New in this round: stock check at checkout, stale accepted-order sweep, customer cancel, lost-link lookup, several status links per order, coupon use returned on close, store-timezone sale date, deadline from next opening, blocked numbers, slug redirects, signed preview, server-rendered shop meta + sitemap, WhatsApp button, order beep. Run `php artisan migrate` (migration 000009) and `python3 commerce_apply_wiring.py`.
Not done: automatic customer SMS/WhatsApp, linking online orders to existing customers, payment gateway, offline POS stock safety, query batching for big catalogues, hiding the delivery-fee product from POS lists.

## Round 2 (3 Oct 2026)
Added: waiting orders claim units at checkout; optional customer email updates; attach sale to an existing customer; honeypot/too-fast bot check; locked-out businesses can close orders and waiting orders auto-close; offline sales are recorded and the short online order is flagged; batched catalogue queries; delivery-fee product hidden; 180-day personal-data purge; other-orders list on the status page; WhatsApp buttons.
Run `php artisan migrate` (migrations 000009 and 000010) and `python3 commerce_apply_wiring.py` (it now also patches SyncController, the lifecycle middleware and routes/console.php).
Still needs outside accounts: SMS/WhatsApp sending, phone OTP, payment gateway.

## Round 3: visual and flow polish (3 Oct 2026)
Merchant Online Store redesigned: shared header with live status and View store, icon tabs on every page (the orders pages were missing three tabs), order alert card (no duplicated text, auto-clears once an order is handled or opened), Overview with live hero, pause switch, stat cards, latest orders and share card; orders list with fulfilment icons and accept-by countdown; order page with progress bar, call/WhatsApp buttons and timeline; settings with logo/banner previews, switches, section navigation and a sticky save bar; offers as cards with usage bars; products as cards on phones with stock badges. Customer status page: green WhatsApp button (now with the 92 country code, the old link was broken for local numbers) and updated lost-link text.
Verified in a browser: customer orders, merchant accepts, prepares and completes, customer sees completion, lost-link lookup. 114 Commerce tests + 17 related tests pass.
Out of scope by decision: payment gateway, phone verification, SMS, selling weighted/serial/legacy-variant products online.

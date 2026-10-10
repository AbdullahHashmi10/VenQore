# Online orders, marketplace and rider system — implementation plan

Written 2026-10-09. Sources: `extras/VENQORE_COMMERCE_MASTER_ROADMAP.md` (marketplace = Version 2, §8), `extras/COMMERCE_USER_PROBLEMS_AUDIT.md`, `COMMERCE_MVP_HANDOFF.md`, `docs/FUTURE_IDEAS.md` (FUT-001 rider accounts), and a read of the current code.

## 1. What the code does today (audit)

| Area | Finding |
|---|---|
| Online orders | Live in `commerce_orders` (+ items, events, stock holds). They become a `sales` row only when staff press **Complete** (`OrderService::complete`). Until then the normal Sales list cannot show them. |
| Sale tag | `SaleService` writes `sales.source` as `pos` or `manual` only. A completed online order is therefore indistinguishable from a hand-made invoice. |
| Sales list | `SaleController::index` → `Sales/SalesHistory.jsx`. Has a POS badge and a dropship badge, no Online badge and no channel filter. |
| Marketplace | `/shop` is country → city → paged list of stores. No search, no filters, no product search. This is MVP; the roadmap's Version 2 (search, filters, comparisons) is not started. |
| Riders | Restaurant-only. A rider is an `employees` row with `is_rider`; deliveries are FOH `occupancies` (JSON `session_data.delivery.rider_id`); screens `Restaurant/Dispatch`, `Restaurant/Riders`. Online-store delivery orders are **not connected** to riders at all. |

## 2. Decisions taken (owner can override)

FUT-001 lists open questions. Defaults used so work can start:
- Riders are **in-house staff** (existing `employees.is_rider`). No third-party carrier yet.
- **Manual assignment** by a manager. No auto-dispatch.
- COD supported: rider collects, hands cash to a manager, manager acknowledges. Earnings are **never netted** against cash owed.
- Fixed per-delivery fee for earnings (configurable later). No payout processing is promised.
- Proof of delivery: status + timestamp now; customer code / photo later.
- Online orders are **not** inserted into `sales` before completion. Pending orders have no stock deduction, no ledger entry; faking a sale would break both. They are *shown* in the list, not *posted*.

## 3. Phases

### Phase A — Online orders inside the normal Sales list (first, small, high value)
1. `SaleService`: accept `source = 'online'` (today anything not `pos` becomes `manual`).
2. `OrderService::complete`: pass `source => 'online'`.
3. Migration: back-fill `sales.source = 'online'` for every sale referenced by `commerce_orders.sale_id`.
4. `SaleController::index`: `source` filter (all / online / pos / manual) applied to the list **and** the stats; add `open_online_orders` (pending → out_for_delivery, this tenant, max 50) when the user has `online.orders_view`.
5. `SalesHistory.jsx`: **Online** badge + accent on sale rows; channel chips; an "Online orders in progress" block at the top of the table, each row tagged Online and linking to the online order screen. They are excluded from stats (no money posted yet).
Acceptance: completed online order shows once, tagged Online; open online orders show tagged Online and disappear from the block when completed; filter chips filter; stats unchanged for existing data; a store without online-store permission sees no online rows.

### Phase B — Marketplace v2 (discovery)
1. `/shop` search box: store name + product name within the chosen city (published stores/products only, tenant-safe projection).
2. Filters: open now, delivery, pickup, category; sort (open first, name).
3. Product result cards link to the store's product page; one merchant per cart is kept.
4. Empty/closed states honest (no fake ratings). Existing country/city flow unchanged.
Acceptance: unpublished/suspended stores never appear in search; results paginate; queries bounded (indexed `LIKE` prefix on names first).

### Phase C — Rider system for online delivery
1. Tables: `commerce_deliveries` (order, rider employee, status, cash to collect, cash collected, fee, timestamps, reasons) and `commerce_delivery_events` (audit).
2. Statuses: `assigned → accepted → collected → out_for_delivery → delivered`, plus `failed` and `returned` with a reason; manager can reassign (audited).
3. Dispatch: extend the existing Dispatch screen with an "Online orders" lane (unassigned / in progress / failed), assign to an active rider.
4. Rider "My deliveries" mobile page (rider sees only own assignments).
5. COD: rider records collected amount; manager acknowledges hand-in; discrepancy flagged. Completing the order posts the sale through the normal path.
6. Permissions: new `rider` access ceiling, own route group; riders get no POS/sales access.
Acceptance: idempotent status updates, rider cannot see others' orders, cash owed per rider reconciles to zero after acknowledgement, every change has an event row.

### Phase D — Verification
Feature tests per phase under `tests/tests/Feature/Commerce` and `Hardening`; run the full Commerce suite (114 tests) plus Reckoner laws on MariaDB `amd_pos_test`; add a `Hardening` case for rider id scoping.

## 4. Order of work and status
| Phase | Status |
|---|---|
| A | coded 2026-10-09, **not yet run** (no PHP on the build machine): migrate, then test |
| B | coded 2026-10-09 (not run) |
| C | coded 2026-10-09 (not run). Riders use a private link, not a login (see log) |
| D | per phase |

## 5. Progress log
- 2026-10-09: plan written. Phase A in progress.
- 2026-10-09: Phase A coded: `SaleService` + `OrderService` (source=online), migration `2026_10_10_000001_tag_online_sales_source`, `SaleController::index` (channel filter, open online orders), `SalesHistory.jsx` (Online badge, chips, in-progress rows). Completed orders also stay in Online Store > Orders (existing 'completed' tab). Mobile card list does not yet show the in-progress block. No feature test written yet.
- 2026-10-09: Phase A finished: mobile cards show in-progress online orders and an Online Sale badge; test `OnlineSalesListTagTest`.
- 2026-10-09: Phase B coded: `PublicStoreController::directory` (q, open, delivery, pickup; product hits), `Commerce/Directory.jsx`; test `MarketplaceSearchTest`. "Open now" is computed in PHP over at most 500 shops per city.
- 2026-10-09: Phase C coded: migration `2026_10_10_000002_create_commerce_deliveries` (deliveries, events, rider links), `DeliveryService`, `DeliveryController` (Online Store > Deliveries), `RiderPortalController` (`/rider/{token}`), pages `OnlineStore/Deliveries` and `Commerce/RiderDeliveries`; test `RiderDeliveryTest`.
  - **Deviation from FUT-001:** riders open a private link (shown once, regenerate to revoke) rather than logging in with a `rider` access type. Reason: a new access type touches the permission system and its ratchet tests, which cannot be verified without running the suite. Proper rider logins remain a later step.
  - Rider earnings = fixed fee per delivery from settings key `rider_delivery_fee` (default 0; no settings screen yet). Earnings are recorded, never paid out or netted against cash.
  - The restaurant (FOH) rider screens are unchanged and still separate.

## 6. To run before relying on any of this
`php artisan migrate`; `php artisan test tests/tests/Feature/Commerce`; `php artisan test --filter=Reckoner`; `php artisan test tests/tests/Feature/Hardening`; `npm run build`. None of it has been executed yet.
- 2026-10-09: Rider page simplified to what a rider needs: rides now, done today with delivery time, earned today, cash still to collect, cash to give the owner (per ride and total).
- 2026-10-09: Rider sign-in coded (low-risk option): new key `online.rider_deliveries` (no role inherits it; added to `permission_inherits.json`, `Users.jsx`, `staff_presets.json`, module routes/pages in `config/modules.php`); table `commerce_rider_accounts` (migration `2026_10_10_000003`); `DeliveryService::linkAccount/unlinkAccount/accountFor`; routes `my-rides` and `my-rides.step`; `PostLoginRedirect` sends a Custom member linked to a rider to My rides; manager links a login in Online Store > Deliveries > Riders.
  - Linking is refused for owners/admins/POS staff, and for staff whose access is not Custom (so it never silently changes a working employee's access).
  - A rider login is still a store membership, so it may use one staff seat under the current seat rules. No new seat type was added; rider pricing is still undecided (FUT-001).
  - The private link (`/rider/{token}`) still works alongside the login.
  - Not run: the Hardening permission tests (`OnlineFohAiPermissionsTest`, `PermissionBypassGuardTest`, `RouteGapSweepTest`) must pass; they are the most likely to flag something in the new routes or key.
- 2026-10-10: Marketplace (/shop) rebuilt. Backend `MarketplaceDirectory` (nearest city from lat/lng, shops with distance/rating/offer/prep time, offers strip, best sellers from completed orders in the last 90 days, map points) and `MarketplaceSearch` (reads "restaurants near me", "fastest delivery", "free delivery", "open now", "deals", "top rated", groceries/pharmacy/fashion/electronics, Roman Urdu words). Coordinates: migration `2026_10_10_000004` (cities + shops), owner sets a pin in Store Settings. Page: `Commerce/Directory.jsx`, `LocationModal`, `MarketMap` (Leaflet + OpenStreetMap), `commerce-marketplace.css`; chosen location is remembered in the browser (`vqs-loc`). Tests: `MarketplaceIntentTest`, `MarketplaceSearchTest`. Not run: no PHP in this environment; JSX parse-checked only. Shops without a map pin show no distance and are not on the map.
- 2026-10-10: Shop front page showcase: `PublicStoreController::show` now passes `showcase` (featured items, best sellers from the last 90 days, top categories with photos, live offers) on page 1 with no search/category; component `StoreShowcase.jsx` (three.js floating orbs behind it, loaded on demand, off for reduced-motion); test `StoreShowcaseTest`. Not run (no PHP here).

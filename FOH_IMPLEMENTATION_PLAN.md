# FOH (Front of House): technical implementation plan

**Status:** plan only, nothing built yet. **Date:** 6 Oct 2026.
**Codebase:** `app-code/main-app`. This plan assumes the state after fd8fdc80, plus the uncommitted POS/floor work from 6 Oct.
**Audience:** whoever implements it (Claude or an IDE agent). Each phase has its own acceptance criteria, so the work can be checked without asking the author.

---

## 0. What we are building, in one paragraph

The restaurant side of VenQore moves out of the POS into a dedicated full-screen page called **FOH**, at `/s/{store}/foh`. It has four tabs in the top bar:

- **Overview**
- **Tables**
- **Takeaway**
- **Delivery**

The POS becomes a pure retail/counter register again, with no `tableMode`, floor, tip, service charge or kitchen buttons. Both screens are built on one shared **Sale Core**: cart, totals, payment, receipts, offline queue, shift. A tax or payment fix is therefore made once, and both screens write to the same sales, shifts and books.

### Governing rules (from the owner, do not re-litigate)

1. **Invisible when irrelevant.** A shop never sees FOH, tables, riders, kitchen or KOT. A restaurant never sees retail-only clutter inside FOH.
2. **Complete when relevant.** FOH must feel designed for restaurants and cafés from the first click, not like retail with tables bolted on.
3. **Simple first.** The ordering screens (Tables, Takeaway, Delivery) carry no dashboard numbers. Numbers live on Overview only.
4. **Share the engine, split the screen.** No copy-paste of `Pos.jsx`. Anything to do with money is shared code.
5. **Same books.** One sales table, one shift and one drawer, whichever screen took the money.

Decisions already locked in `restaurant-fix-plan.md` still apply:

- `prepares_orders` is independent of tables.
- Riders are real staff records.
- KOT printing comes first.
- The user-visible word for open orders is "Orders"; DB and route names stay as they are.

---

## 1. Current state: what moves where

### 1.1 The facts the plan rests on (verified in code)

**`Pages/Pos.jsx` is 7,692 lines.**
- About 1,000 of them exist only for the table terminal (`tableMode`).
- About 200 more are restaurant code that also runs on the counter: `settlingOccupancy`, `handleCounterFire`, `preparesOrders` and the kitchen links.

**There is no Tables page.**
- `TableServiceController@index` redirects to `/pos?view=floor`.
- The floor is a mode of the POS, chosen by `?view=`, localStorage `pos_terminal_v1` and `settings.service_mode`.
- `PosController` never sends the `terminal`, `positions`, `tickets`, `zones` or `kitchen` props. Floor data arrives only through the 15s `store.tables.state` poll.

**Sale tabs (`sales`/`activeSale`, WorkspaceContext, sessionStorage `venqore_sessions_v2`) are shared by both terminals.** In table mode the active tab's cart *is* the selected table's order.

**The data model is already "open orders", not "tables":**
- `occupancies` with nullable `position_id` covers dine-in, takeaway and delivery. Lane tickets are `TA-###` and `DL-###`.
- `session_data` holds the cart, sent quantities, `pending_settle`, `settled_parts`, `check_dropped_at`, the delivery block and the tracking token.
- State (free → seated → ordered → in_kitchen → served → check) is derived, never stored (`derivedState`).

**A table's bill becomes a sale through the POS checkout (`store.pos.sales.store`), then `store.tables.settled`.** `sales` has no `occupancy_id`.

**Stock is deducted in `SaleController@store` for every product except `type === 'service'`.**
- There is no per-product `track_stock` flag.
- Cookbook recipes are **not** exploded at POS checkout; only `Engines/SaleService::post` does that.

**Restaurant pages that already exist:**

| Page | Notes |
|---|---|
| `Restaurant/Kitchen.jsx` | KDS, 830 lines, works |
| `Restaurant/CustomerQueue.jsx` | TV screen |
| `Restaurant/Dispatch.jsx` | Delivery board by state, rider cash-up |
| `Restaurant/Riders.jsx` | CRUD (edit is broken: PATCH vs PUT) |
| `Restaurant/Settings.jsx` | Legacy: three dead toggles, conflicting defaults |
| `Restaurant/Dashboard.jsx` | Legacy table board, emoji-styled, no V6 |
| `TableService/FloorBuilder.jsx` | Floor builder |
| Reservations | JSON-only (UI is a modal inside FloorPane) |
| `Track.jsx` | Public delivery tracking |
| QR ordering | `Commerce/Store.jsx` in onsite mode |

**Gating:**
- Module `table_service` in `config/modules.php`.
- The sidebar "Restaurant" group is hand-built in `OneGlanceLayout.jsx` around lines 730–1100.
- There are no `tables.*` or `foh.*` permissions; everything uses `pos.checkout`, plus `admin.settings_manage` for setup.

### 1.2 The move map

| Today | After FOH |
|---|---|
| POS table terminal (`?view=floor`, `tableMode`) | **FOH → Tables** |
| POS "Takeaway +" lane tickets, counter "Kitchen" fire button | **FOH → Takeaway** |
| POS "Delivery +" lane tickets, `DeliveryPanel` inside the cart | **FOH → Delivery** (order + delivery card side by side) |
| `Restaurant/Dispatch.jsx` (delivery board, rider cash-up) | Board → **FOH → Delivery** (list) and **FOH → Overview** (column). Rider cash-up → a **Riders** drawer in FOH → Delivery. The old route redirects. |
| `Restaurant/Dashboard.jsx` (legacy table board) | **FOH → Overview**. The old route redirects. |
| `/tables`, `/pos?view=floor` | Redirect to `/foh/tables` |
| `/pos?occupancy=ID` (KDS/Dispatch hand-off to pay) | Redirect to `/foh?order=ID` (the order opens in its own tab) |
| POS settings → "Tables & floor", "Kitchen tickets" | **FOH settings** (own full-screen workspace) |
| `Restaurant/Settings.jsx` | **FOH settings**. The old route redirects. Dead toggles are removed. |
| Floor views, room map, arrange mode (`FloorPane`) | FOH → Tables (unchanged components, new home) |
| Reservation modal (inside FloorPane) | FOH → Tables → "Bookings" drawer (same component) |
| Kitchen (KDS), Order TV screen, Floor Plan builder, Riders list | Stay as their own pages. Linked from the FOH top bar and from the sidebar's Restaurant group. |
| Service charge, tip | FOH only (removed from POS totals) |
| Modifier sheet | **Shared Sale Core**. This also fixes a bug: products with modifiers can't be added on the counter today, because `ModifierSheet` only renders when `tableMode` is on. |
| Parked sales (hold) | POS only. In FOH an open order *is* the hold. |

---

## 2. Architecture

### 2.1 Folder layout (new)

```
resources/js/
  Sell/                         ← shared Sale Core (used by POS and FOH)
    core/
      cartMath.js               pure: computeTotals(), lineTotal(), rounding
      salePayload.js            pure: buildSalePayload(sale, totals, ctx)
      useSaleSession.js         one active sale/cart + context sync (debounced)
      useCart.js                add/qty/price/discount/free-qty/weigh/remove, variant+modifier hooks
      useCheckout.js            handleCheckout → processCheckout → finalize, approval, offline queue
      useShift.js               registerShift, fetchCurrentShift, shift modals state
      useCatalog.js             categories, category products, sort
      useProductSearch.js       debounced search + barcode, seq guard, Dexie fallback
      useHotkeys.js             declarative key map → handlers (no 350-line effect)
      money.js                  formatter factory (store currency)
    ui/
      CatalogPane.jsx           band / column / tiles / rows / pills (from renderCatalog*)
      ScanBar.jsx
      CartLines.jsx             line list; `renderBadges(line)` slot for sent/paid/course
      TenderPanel.jsx           TotalsCard, CashCard, PayButton, actions slot
      modals/                   BillDiscount, ItemDiscount, Variant, Modifier(Sheet), Converter
  Pages/Pos.jsx                 retail register, rebuilt on Sell/*, target ≤ 3,000 lines
  Pages/Foh/Index.jsx           FOH shell (one Inertia page, client-side tabs)
  Foh/
    useFoh.js                   wraps useTableService; tab/selection/URL sync; derived lists
    FohTopBar.jsx               tabs with counts + right-side tools
    OrderHeader.jsx             from TableBar: table/ticket identity, covers, type switch, actions
    OrderWorkspace.jsx          OrderHeader + CartLines + CatalogPane + Pay sheet (shared by 3 tabs)
    tabs/OverviewTab.jsx
    tabs/TablesTab.jsx
    tabs/TakeawayTab.jsx
    tabs/DeliveryTab.jsx
    delivery/                   DeliveryCard (from DeliveryPanel), RidersDrawer (from Dispatch cash-up)
    settings/FohSettings.jsx    sections: Service, Tables, Takeaway, Delivery, Kitchen, Stock, Devices
    foh.css                     V6 tokens only
  Foh/table/                    ← moved from Pos/Table/* (FloorPane, TableBar parts, SplitSheet,
                                   MoveSheet, ReservationModal, QuickFloorSetup, Delivery, useTableService)
  Pos/Table/*                   ← thin re-export shims until Phase 8, then deleted
  Components/Pos/Settings/      ← the shell (RegisterSettings frame, primitives, pos-settings.css)
                                   is generalised into `SettingsWorkspace` and reused by FOH
```

Backend:

```
app/Http/Controllers/FohController.php        index(tab), settings(), saveSettings()
app/Services/Foh/FloorStateService.php        extracted from TableServiceController:
                                               floorState, shape, ticketShape, derivedState,
                                               kitchenStatuses, unpaidTotal (controller is 2,567 lines)
app/Services/Foh/FohSettings.php              typed reader with legacy fallbacks (§2.6)
database/migrations/2026_10_xx_foh_*.php      products.track_stock, sales.occupancy_id, sales.order_type
```

### 2.2 Sale Core contract

`computeTotals(input) → totals` is a **pure** function, the only place money is added up. It takes:

- `cart`
- `discountType`, `discountValue`
- `taxRate`, `taxInclusive`, `enableTax`
- `roundOff`
- `additionalCharges`
- `serviceChargePct`: FOH only; POS passes 0
- `tipAmount`: FOH only
- `deliveryFee`: FOH Delivery only, shown as its own line

It returns:

- `subtotal`, `freeItemDiscounts`, `itemDiscounts`, `globalDiscount`, `totalDiscounts`
- `taxableAmount`, `taxAmount`
- `serviceCharge`, `tipAmount`, `deliveryFee`
- `cartTotal`, `rounding`

`buildSalePayload(sale, totals, ctx)` is pure and returns exactly today's `store.pos.sales.store` body. It adds three optional fields:

- `source: 'pos' | 'foh'`
- `occupancy_id`
- `order_type`

`useCheckout({ sale, totals, ctx, onSettled })` wraps `processCheckout` and `finalizeSale`.
- The FOH passes `onSettled(saleResponse)`, which calls `tables.markSettled`.
- The POS passes nothing.
- Approval PIN, the 4xx-vs-network split, the offline queue, the drawer pulse and the auto-print move here unchanged.

`useCart({ sale, update, stockPolicy, beforeAdd })`:
- `stockPolicy` is `(product) => 'check' | 'skip'`.
  - POS: check unless service or `track_stock === false`.
  - FOH: per the FOH stock setting (§2.5).
- `beforeAdd` is an async hook. FOH uses it to "ensure an open order": it creates a lane ticket when needed. This replaces `ensureActiveOrder` and the `tableMode` checks inside `handleProductSelect`, `addToCart`, the barcode Enter handler and `updateQty`.

`TenderPanel` props:
- `totals`, `sale`, `onPay`
- `showTip`, `showServiceCharge`
- `actions` (slot): Hold/Cancel for POS; Bill/Split/Floor for FOH
- `pinnedMoneyZone` (default true): the 6 Oct layout, with total + cash + pay pinned at the bottom

`CartLines` takes a `badges(line)` slot. FOH renders sent / partially sent / paid / course / held / guest-added badges; POS renders none.

### 2.3 FOH page model

**One Inertia page** (`Foh/Index`), with client-side tabs.
- Switching tab is instant: no Inertia visit, no remount of the poll.
- The URL is kept in sync with `history.replaceState`: `/foh/overview`, `/foh/tables`, `/foh/takeaway`, `/foh/delivery`, plus `?order=<occupancy_id>`.
- Deep links and reloads land on the same place.

**Every FOH order is a server-side occupancy.** There are no local "sale tabs" in FOH. Open orders are shared between devices (the waiter's tablet and the counter), and the order list *is* the tab bar's job.

**The only exception is the Takeaway quick sale.**
- A new takeaway starts as a **local draft** (one `useSaleSession`), so ringing at the counter costs no server round-trips.
- It becomes an occupancy only when it is fired to the kitchen or saved ("Save & take next").
- Paying a draft that has kitchen items creates the lane ticket, fires it and settles it in one flow (`KitchenTicketService::fireCounter` already exists).
- Paying a draft with no kitchen items is a plain sale.

**Polling:** `useFoh` wraps `useTableService` and polls `store.tables.state` every 15s.
- It polls every 8s while the Overview tab is visible.
- It skips polling while the browser tab is hidden (already built).
- No websockets in v1. Polling is enough at this scale, and Reverb can come later behind the same hook.

### 2.4 Order-type changes (the interlinking)

**`OrderHeader` has a "Change to…" menu: Dine-in ↔ Takeaway ↔ Delivery.**
- **Dine-in → Takeaway** ("pack it to go"): the occupancy keeps its lines and sent quantities, `position_id` is set to null, it gets a `TA-###` label, and the table is released. This needs a new endpoint: `POST tables/convert`.
- **Takeaway → Delivery**: adds the delivery block and opens the delivery card with the address focused.
- **Any → Dine-in**: asks for a table (the existing `SeatDialog`).
- After converting, FOH switches tab and keeps the order selected. Kitchen tickets already fired are untouched; only new fires carry the new order type.

### 2.5 Inventory

**New column `products.track_stock`** (boolean, default `true`, so existing behaviour is unchanged).
- It is a product property and shows on the product form for every business.
- `SaleController@store` stock gate becomes: `$isStockEnabled && $product->type !== 'service' && $product->track_stock !== false && !$fohSkip`.

**New FOH setting `foh_stock`:**
- `per_item` (default): respect each product's `track_stock`.
- `never`: FOH sales never deduct stock. The payload carries `source: 'foh'` and the server reads the setting itself; the client cannot force a skip.

**The FOH settings "Stock" page:**
- Explains both options in plain words.
- Offers a bulk action: "Don't track stock for items in these categories" (sets `track_stock=false`), for "made-to-order" menus.

**Out of scope for v1:** recipe/ingredient deduction at checkout (Cookbook BOM explosion), deferred to Phase 10. Note it in FOH settings as "coming": the owner explicitly wants an option, not forced tracking.

### 2.6 Settings model

The new keys are `foh_tables`, `foh_takeaway`, `foh_delivery`, `foh_stock`, `foh_takeaway_flow`, `foh_default_tab`. They are read through `FohSettings`, which falls back to the legacy keys so no data migration is needed:

| New key | Legacy fallback |
|---|---|
| `foh_tables` | `service_mode` is `tables` or `both` |
| `foh_takeaway` | `lane_takeaway` |
| `foh_delivery` | `lane_delivery` |
| `foh_takeaway_flow` | `pay_first` (pay then fire) |
| `foh_default_tab` | device localStorage |

Rules:

- Only FOH settings write the new keys.
- `service_mode` stops existing for the POS, because the POS has no terminal concept after Phase 8.
- **Fix the conflicting defaults** while doing this. `service_mode` defaults to `counter` in JS and `both` in `RestaurantDashboardController`. The lane defaults differ between FloorBuilder (`0`) and Restaurant Settings (`1`). After the change, one reader (`FohSettings`) holds the one default.

### 2.7 Gating and permissions

**FOH is available when** the module `table_service` is enabled **and** at least one of `foh_tables`, `foh_takeaway`, `foh_delivery` is on.
- Each tab renders only when its key is on. A cloud kitchen gets Overview + Takeaway + Delivery and never sees a table.
- `config/modules.php → table_service`:
  - Label: "Restaurant & café (FOH)".
  - Add routes `store.foh*`.
  - Add pages `Foh/Index.jsx`.
  - Nav item FOH at order 11.

**New permission `foh.access`:**
- A migration/seed grants it to every role that has `pos.checkout`.
- Routes:
  - `GET /foh/{tab?}` → `permission:foh.access`
  - FOH settings writes → `admin.settings_manage`
- Payment inside FOH still requires `TenantUser::CAP_TAKE_PAYMENTS`, which already exists.
  - Users without it (waiters) see **Print bill** instead of **Pay**.
  - Add a **Waiter** role preset: `foh.access`, `CAP_TAKE_ORDERS`, no payments.

**Sidebar** (`OneGlanceLayout.jsx` Restaurant group):
- **FOH** (primary)
- Kitchen
- Order TV screen
- Floor plan
- Riders
- FOH settings

Remove "Floor" from the Dashboard sub-menu, and remove the "Reservations (Coming Soon)" text (bookings live inside FOH → Tables).

**POS top bar** for stores where FOH is available: one "FOH" button that switches screens. The cart is safe because the POS draft persists.

### 2.8 Sales record

Migration: `sales.occupancy_id` (nullable, indexed) and `sales.order_type` (nullable `string(16)`: `dine_in|takeaway|delivery`).
- Both are written by `SaleController@store` when present.
- Used for: reports split by channel, "which table was this receipt", and the Overview's "today" numbers.

Same shift rules as the POS: `PosSaleController` handles FOH sales too (shift required for non-owners).

### 2.9 Takeaway collection (new behaviour)

Today, `settled()` closes a lane ticket as soon as it is paid, so a paid-but-still-cooking takeaway disappears from every screen except the KDS.

**New behaviour:**
- A paid lane ticket whose WorkOrders are not all `served` stays open with `session_data.paid_at`, and shows as "Paid · cooking" or "Ready to collect".
- `POST tables/collected` (new) closes it.
- Bumping to `served` on the KDS also closes it, if `foh_takeaway_autoclose` (default on).

The Overview takeaway column and the TV queue read the same state.

---

## 3. Screens (UX spec)

Common to all FOH screens:

- **Full-screen** (no sidebar). Same V6 tokens as the 6 Oct POS work: `vqf-*` classes, `var(--vq-*)` only.
- **Text:** minimum 14px for content and 12px for meta.
- **Touch targets:** at least 44px.
- **Top bar (64px):**
  - Left: FOH mark (back to dashboard on long-press / ⋯ menu).
  - Centre: **segmented tabs**, each with a live count and a red dot when something needs a person:
    - Overview
    - Tables · 6/24
    - Takeaway · 3
    - Delivery · 2 ⚠
  - Right: order search (number, table, phone; `/` key), Kitchen, TV screen, shift/drawer, settings, close.
- **Keyboard:**
  - F1–F4 switch tabs.
  - `N` starts a new order in the current tab.
  - `F` fires.
  - `P` pays.
  - `Esc` goes back.
  - All POS cart keys keep working (shared `useHotkeys`).
- **Tablet and phone:**
  - The tabs collapse into a bottom bar.
  - Order and catalog stack, with the catalog as a sheet; payment is a sheet.

### 3.1 Tables

**State A: no table selected.** Floor full width: map / cards / list (the existing `FloorPane`, simplified 6 Oct). Areas sit on the left of the header and "Bookings" on the right. Tapping a free table opens the "Seat · covers" dialog; tapping a busy table opens it.

**State B: table open.** Three columns:

```
┌ floor rail (compact list, 240px, collapsible) ┬ ORDER ─────────────┬ CATALOG ───────┐
│ T1 ● 24m  T2 ○  T3 ● 9m  …                    │ T3 · 2 guests · SR │ search / tiles │
│                                               │ lines (sent/paid)  │                │
│                                               │ [Fire 2] [Bill]    │                │
│                                               │ [Split] [Move] [Pay]│               │
└───────────────────────────────────────────────┴────────────────────┴────────────────┘
```

- Payment is a **right sheet**, opened by Pay. Tables pay once per visit, so a permanent payment column is wasted space here.
- The floor rail lets a waiter hop between tables without going back to the full floor.

### 3.2 Takeaway

Counter speed, so this is the classic three-section layout:

```
┌ queue rail (200px) ┬ ORDER (draft or TA-###) ┬ CATALOG ┬ PAYMENT (pinned money zone) ┐
│ + New takeaway     │ name (optional) · phone  │         │ total · cash · change       │
│ TA-004 cooking 7m  │ lines                    │         │ [Pay & fire] [Fire only]    │
│ TA-005 ready ✓     │                          │         │                             │
└────────────────────┴──────────────────────────┴─────────┴─────────────────────────────┘
```

- The queue rail lists open/paid lane tickets as Cooking / Ready / Paid · waiting, each with a **Collected** button. A ticket becomes "Ready" when its kitchen work is bumped.
- **Flow setting `foh_takeaway_flow`:**
  - `pay_first` (fast food): **Pay & send to kitchen**.
  - `order_first` (café): **Send to kitchen**, then pay later from the rail.

### 3.3 Delivery

```
┌ deliveries (260px) ─────┬ CUSTOMER & DELIVERY CARD ─┬ ORDER ───────┬ CATALOG ┐
│ + New delivery          │ phone → lookup → name     │ lines        │         │
│ Placed (2)              │ address (address book)    │ fee line     │         │
│ Preparing (1)           │ ETA · rider · pay method  │ [Send to kitchen]      │
│ Out (3)  ⚠ late         │ status ladder             │ [Send out] [Delivered] │
│ Delivered today (12)    │ tracking link             │ [Collect payment]      │
└─────────────────────────┴───────────────────────────┴──────────────┴─────────┘
```

- **New delivery is customer first:** phone → match → address, then items. That is how delivery calls actually go.
- The delivery card is always visible, never a popup that has to be saved before you can continue (the 6 Oct bug). Its fields autosave on blur via `store.tables.delivery`.
- **The fee is a real bill line** (`computeTotals.deliveryFee` → payload `delivery_charge`).
- Payment:
  - COD: paid on return, from the list or from the Riders drawer.
  - Prepaid: pay before sending out.
- The **Riders drawer** shows who is out, with how many orders, and cash to collect. Its cash-up is `DispatchController` rider-cashup/cash-up, moved unchanged.

### 3.4 Overview

Three equal columns, plus one thin row of numbers on top. The numbers are allowed here, and only here.

```
Today: 7/24 tables · 22 guests · Rs 25,620 on the floor · 3 need someone · 7 cooking

┌ TABLES ───────────────┬ TAKEAWAY ──────────────────┬ DELIVERY ───────────────────┐
│ needs someone first   │ Cooking | Ready | Paid-wait │ Placed | Preparing | Out    │
│ mini cards / seating  │ cards with age              │ cards with ETA / late       │
│ chart                 │                             │                             │
└───────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

- Every card is a link: it switches tab with that order selected.
- Columns for disabled channels are hidden, and the rest widen.
- Designed for a manager's tablet or a wall screen. It is never the default for waiters (`foh_default_tab`, per device).

### 3.5 FOH settings (own workspace)

Reuse the 6 Oct settings shell (generalised `SettingsWorkspace`: full-screen, categories, plain words, live preview). Sections:

1. **Service.** Which tabs this business uses (Tables / Takeaway / Delivery), each with a description and a picture.
2. **Tables.**
   - Floor views and room map.
   - Edit floor (link to the builder).
   - Service charge and tip.
   - Default covers.
   - Bookings on/off.
3. **Takeaway.**
   - Flow (pay first / order first).
   - Order numbers (prefix, daily reset).
   - Customer name required?
   - Collection tracking and auto-close.
   - TV screen.
4. **Delivery.**
   - Default fee and ETA.
   - Late threshold.
   - Riders (link).
   - Tracking link on/off.
   - COD allowed.
5. **Kitchen.** The kitchen routing page moved as-is: one ticket vs stations, printers, test ticket.
6. **Stock.** `foh_stock`, plus the bulk "made-to-order categories" action.
7. **This device.** Default tab, catalog position (left/right/bottom), text size, keyboard map.

Hardware and receipts stay in the POS settings. Both screens read the same device keys, and FOH settings links to them.

---

## 4. Phases

Every phase ends with the build passing (`npm run build`), `npm test` (vitest), `php -l` on touched PHP, oxlint `no-undef` clean, and the acceptance list below.

The POS table mode keeps working until Phase 8, so the change ships behind a flag (`foh_beta` setting, on for chosen tenants) and nothing breaks in between.

### Phase 0: groundwork and bug fixes (0.5 day)

- Fix the modifier products bug on the counter: `ModifierSheet` must render in both terminals.
- Fix `manufacturing_notifications` vs `notifications`: the backend returns `notifications` at `SaleController:711`, but `Pos.jsx:2959` reads `manufacturing_notifications`.
- Fix Riders edit: the page sends `axios.patch`, but the route is PUT only.
- Add `permission:pos.checkout` to `restaurant/dashboard|queue|riders|settings` GETs.
- Add `/catalogue/` and `/track/` to `GlobalProviderLayout`'s public prefixes.
- Remove the unused `ORDER_TYPES` and `tableTone` imports and the dead `terminal/positions/tickets/zones/kitchen` props.
- **Characterisation fixtures.** Capture **golden outputs from today's Pos.jsx** before any extraction, using the headless harness (`/tmp/claude-0/p` pattern: esbuild + axios mock + Playwright):
  - 12 carts: plain; % discount; fixed discount; line discount; free qty; inclusive tax; exclusive tax; rounding on; service charge + tip; delivery fee; variant + modifier; weighed.
  - For each, record the totals shown and the exact `store.pos.sales.store` request body.
  - Save as JSON fixtures in `resources/js/tests/fixtures/sale-core/`.

**Accept:** fixtures exist and are committed; the five bugs are fixed and re-tested.

### Phase 1: extract the Sale Core (3–4 days, the riskiest phase)

No visible change.

1. `cartMath.js` and `salePayload.js` (pure), plus vitest tests that reproduce **every** Phase 0 fixture exactly, to the paisa and byte for byte.
2. Hooks: `useSaleSession`, `useCart`, `useCheckout`, `useShift`, `useCatalog`, `useProductSearch`, `useHotkeys`, and `money.js`.
3. UI: `CatalogPane`, `ScanBar`, `CartLines`, `TenderPanel`, `modals/*`.
4. Rewire `Pos.jsx` onto them. The table branches keep working, through the slots and hooks.

**Do not** change behaviour, copy or styling in this phase. Keep the 6 Oct perf work: debounced context sync, catalog memo, stable `pickProduct`, search sequence guard.

**Accept:**
- All fixtures pass, both in vitest and in the harness replay.
- The harness screenshots of POS counter and table match before/after within 0.5% pixel diff.
- A manual POS run-through (checklist in §6) passes.
- `Pos.jsx` is ≤ 5,000 lines at this point (≤ 3,000 after Phase 8).

### Phase 2: backend for FOH (1.5 days)

- `FloorStateService` extracted. `TableServiceController::state` calls it, and the payload is identical (snapshot test).
- State payload additions:
  - `kitchen_progress: {fired, ready, served}` per occupancy.
  - `paid_at` and `collected_at` on lane tickets.
- `FohController@index($tab)` → `Inertia::render('Foh/Index', …)` with:
  - The initial `floorState` (no empty first paint).
  - `fohSettings`, `caps` and `bankAccounts`.
  - `warehouses` and `settings`, with secrets stripped as in `PosController`.
- Routes, inside the store group:

```php
Route::get('/foh/{tab?}', [FohController::class, 'index'])
    ->where('tab', 'overview|tables|takeaway|delivery')
    ->middleware('permission:foh.access')->name('foh');
Route::get('/foh-settings', [FohController::class, 'settings'])->middleware('permission:foh.access')->name('foh.settings');
Route::post('/foh-settings', [FohController::class, 'saveSettings'])->middleware('permission:admin.settings_manage')->name('foh.settings.save');
// in tables group:
Route::post('/convert',   [TableServiceController::class, 'convert'])->name('convert');     // order-type change
Route::post('/collected', [TableServiceController::class, 'collected'])->name('collected');
```

- Migrations:
  - `products.track_stock` (bool, default true)
  - `sales.occupancy_id` (nullable, index)
  - `sales.order_type` (nullable string 16)
- `SaleController@store` changes:
  - Write `occupancy_id` and `order_type`.
  - Apply the stock gate from §2.5.
- `settled()` follows the lane collection rule from §2.9.
- `FohSettings` reader with the legacy fallbacks from §2.6.
- `foh.access` permission plus the grant migration, and the Waiter role preset.
- `config/modules.php`: `table_service` routes, pages and nav.
- If `tests/` exists on the device checkout, add PHPUnit feature tests:
  - `track_stock=false` skips deduction.
  - `foh_stock=never` skips deduction only for `source=foh`.
  - Paid lane with unserved work stays open, and `collected` closes it.
  - `convert` dine-in → takeaway frees the table and keeps sent quantities.
  - `/foh` is 403 without `foh.access` and 404 / module-blocked when `table_service` is off.

**Accept:** the tests above pass; `/tables/state` output is unchanged for existing clients.

### Phase 3: FOH shell + Takeaway tab (2.5 days)

Takeaway goes first: it is the simplest tab and proves the Sale Core end to end.

- `Pages/Foh/Index.jsx`, `FohTopBar`, `useFoh` (tabs ↔ URL, selection, counts), and `foh.css`.
- `TakeawayTab`:
  - Draft ringing, using the Sale Core.
  - Pay & fire / fire only, per the flow setting.
  - Queue rail with Cooking / Ready / Paid-waiting and Collected.
  - Customer name/phone optional (required if the setting says so).
- The KOT prints on fire through `KitchenPrintService`, as today.

**Accept:**
- A counter-only café can ring, pay and fire a takeaway on FOH. The KDS shows it, the TV screen shows it, it becomes Ready when bumped, and it disappears when Collected.
- The sale row has `source=foh` and `order_type=takeaway`.
- Shift totals include it.
- Takeaway reuses the retail POS's cash card, change and quick cash: same components, no copies.

### Phase 4: Tables tab (3 days)

- Move `Pos/Table/*` → `Foh/table/*`, with re-export shims left at the old paths.
- `TablesTab`:
  - State A (full floor).
  - State B (rail + order + catalog + pay sheet).
- `OrderHeader` (from TableBar) with Fire / Bill / Split / Move / Close and **Change to…**.
- Split, Move/Merge, Seat, Bookings and QuickFloor setup, moved unchanged.
- Cart sync to the occupancy uses the existing debounced `pushOrder`.
- Waiter mode: without `CAP_TAKE_PAYMENTS`, Pay is replaced by Print bill.

**Accept:**
- Full dine-in cycle on two devices at once:
  1. Seat on tablet A; add lines.
  2. Fire; the KOT prints.
  3. Tablet B sees it within 15s.
  4. Split by covers; pay half on B.
  5. Move to another table; pay the rest.
  6. The table frees itself.
- `convert` to takeaway works and appears on the Takeaway rail.

### Phase 5: Delivery tab (2.5 days)

- `DeliveryTab`: list grouped by status, customer-first new delivery, always-visible `DeliveryCard` with autosave, the fee as a bill line, the status ladder, and the tracking link.
- `RidersDrawer`: rider cash-up moved from `Restaurant/Dispatch.jsx`, same endpoints.
- `Restaurant/Dispatch` route → redirect to `/foh/delivery`.

**Accept:**
- Phone lookup finds a repeat customer's last address.
- The fee shows on the receipt and in the sale's `delivery_charge`.
- A COD delivery can go out unpaid, and be paid when the rider returns.
- The late flag is shown on both the list and Overview.
- The rider cash-up totals match the old Dispatch page for the same data.

### Phase 6: Overview (1.5 days)

- Top numbers row (today), plus the three columns from §3.4, built from the same `useFoh` data. There are no extra endpoints, except an optional `today` aggregate if counting from `sales` is cheaper server-side.
- Card click → tab + order.
- `Restaurant/Dashboard` route → redirect to `/foh/overview`.

**Accept:**
- With 40 open orders, Overview renders in under 50ms after a poll (React Profiler).
- With a channel disabled, its column is gone.

### Phase 7: FOH settings (2 days)

- Generalise the settings shell into `SettingsWorkspace` and build `FohSettings` with the sections from §3.5.
- Move the POS settings pages "Tables & floor" and "Kitchen tickets" here. POS settings lose them.
- `Restaurant/Settings` route → redirect to `/foh-settings`. The three dead toggles (`kot_enabled`, `kot_show_prices`, `kds_auto_print`) are either wired to the KOT path or deleted. Recommendation: wire `kot_show_prices` (some kitchens want prices) and delete the other two.

**Accept:** every setting on the page changes something visible (the same "no dead toggle" rule as the POS settings work); the live preview matches the real screen.

### Phase 8: remove restaurant code from the POS (1.5 days)

- Delete `tableMode` and its terminal-selection machinery from `Pos.jsx`:
  - terminal state
  - floor prefs
  - table effects and handlers
  - TableBar, DeliveryPanel and FloorPane renders
  - tip and service charge
  - Floor/Kitchen buttons
  - `table.css` import
  - preset/terminal switching
  - restaurant props on `RegisterSettings`
- `usePosLayout`: remove the `pos_composition_table_v1` path and the table preset.
- Redirects:
  - `/tables` → `/foh/tables`
  - `/pos?view=floor` → `/foh/tables`
  - `/pos?occupancy=ID` → `/foh?order=ID`
  - `TableServiceController@index` updated to match.
- Device migration: a device with `pos_terminal_v1=table` gets a one-time notice on `/pos` ("Tables moved to FOH"), with a button, and the key is cleared.
- Sidebar per §2.7. POS top bar gets the FOH switch button.
- Delete the `Pos/Table` shims and the orphan `floor-views.css`.

**Accept:**
- `grep -n "tableMode\|useTableService\|FloorPane" resources/js/Pages/Pos.jsx` returns nothing.
- `Pos.jsx` is ≤ 3,000 lines.
- A retail tenant sees zero restaurant UI anywhere.
- A restaurant tenant's old bookmarks all land in FOH.

### Phase 9: verification and rollout (1.5 days)

- Full checklist (§6) on desktop 1920 / 1440 / 1280, a 10" tablet and a phone, light and dark.
- Harness screenshots per tab, plus a performance pass:
  - Typing in search with 2,000 products: under 16ms per keystroke.
  - Tab switch: under 100ms.
- Flip `foh_beta` for one real restaurant tenant for a day; then make it default.
- Docs: update the project doc and `CLAUDE.md` notes.

### Phase 10 (later, separate decision): recipe stock

Explode Cookbook compositions at FOH checkout, reusing `Engines/SaleService` logic, behind `foh_stock=recipes`.

**Total for Phases 0–9: about 19–21 working days for one implementer.** Phase 1 is the one to protect: do not start Phase 3 until the fixtures pass.

---

## 5. Risks and how they are handled

| Risk | Handling |
|---|---|
| Extraction changes money math silently | Golden fixtures captured **before** touching code (Phase 0), byte-for-byte payload comparison, pure functions with unit tests |
| Two devices editing one table | Existing model: server is the truth, debounced `pushOrder`, `inFlight` guard, 15s poll. FOH shows "Updated on another device" when a poll replaces a cart the user hasn't touched for 2s, and never overwrites an unsaved local edit (keep `lastPushed` signature logic) |
| Old bookmarks and muscle memory | Redirects for every old URL (§Phase 8), one-time device notice, POS ↔ FOH switch button |
| Offline | POS offline queue keeps working (Sale Core). FOH tables and delivery need the server: show an offline banner and make them read-only. Takeaway pay-now still queues offline like the POS, and its KOT prints locally |
| Scope creep (reservations, loyalty, QR ordering) | Out of scope. They move as-is (bookings drawer, QR "new from guest" badges) and are not redesigned in this project |
| Settings drift between POS and FOH | One reader (`FohSettings`), shared device keys for hardware and receipts, legacy fallbacks instead of data migrations |
| Performance on cheap tablets | Same rules as the 6 Oct work: memoised cards, stable callbacks, no `transition: all`, container queries instead of JS measuring, content-visibility on long lists |

## 6. Manual checklist (run in Phases 1, 8 and 9)

**Retail POS (must be unchanged):**
- Scan, search, add variant, add modifier.
- Weigh, line discount, bill discount (% and fixed), free qty.
- Inclusive and exclusive tax, rounding.
- Pay cash with change, card, split payment.
- Approval PIN on discount over the limit.
- Hold/recall, returns, receipt print, drawer.
- Offline sale then sync.
- Shift open/close/Z-report.
- Every keyboard shortcut in `POS_KEYMAP`.

**FOH:**
- Each tab's acceptance list.
- Order-type conversions both ways.
- Waiter role cannot pay.
- Disabled channels are hidden everywhere: tabs, Overview, settings preview, sidebar.
- Deep links `?order=` work.
- F1–F4 switch tabs.

---

## 7. Decisions taken by this plan (change before Phase 2 if wrong)

1. FOH is the primary selling screen for restaurant tenants. The POS stays available (sidebar and switch button) for retail items or owners who prefer it.
2. Takeaway default flow is **pay first**; cafés switch to order first.
3. Waiters (no payment capability) print the bill; a cashier collects.
4. Recipe/ingredient stock is not in this project (Phase 10).
5. No websockets in v1; 15s poll (8s on Overview).
6. DB, route and model names stay (`occupancies`, `positions`, `store.tables.*`). Only user-facing words change.

---

## Phase 0 status (6 Oct 2026)

Done:
- 12 characterisation fixtures recorded from the real `Pos.jsx` in `app-code/main-app/resources/js/tests/fixtures/sale-core/` (`cases.js` = inputs, `01-…12-*.json` = recorded totals + exact `store.pos.sales.store` body). Replay test: `resources/js/tests/saleCoreGolden.test.jsx`. Re-record only with `UPDATE_GOLDEN=1`, and never to make a refactor pass.
- Bug fixes + regression tests (`resources/js/tests/phase0Fixes.test.jsx`, each verified to fail on the old code): `ModifierSheet` now mounts on every terminal; the auto-manufacturing message reads `notifications`; Riders edit and quick-toggle use PUT (toggle also sends the required `name`).

Not done (still in the Phase 0 list above): permission middleware on restaurant GETs, `/catalogue/` + `/track/` public prefixes, unused-import cleanup.

FINDING (recorded as-is, not changed): a line with add-ons (`price_delta`) is shown at base + add-ons in the cart, but `subtotal` and the sale payload use `original_price` (base only). Fixture 11: cart line 1,650, total and saved sale 1,500, and no modifiers are sent. Needs an owner decision before Phase 1, because fixing it changes money.

---

## Add-ons (decision 6 Oct 2026)

Found: add-ons already exist as `modifier_groups` / `modifiers` / `product_modifier_group` (shared groups, signed `price_delta`, min/max/required), edited per product in `ProductModal`, and priced correctly on the table path (`TableServiceController`). Variants stay variants (Small/Large pizza); add-ons are extras on top.

Gaps: (1) counter path (`sales.store`) ignores `price_delta` in total and payload and sends no modifiers; (2) no central place to manage add-ons; (3) no way to attach a group to a whole category.

Step 1b (BEFORE Sale Core extraction, ~1 day): price add-ons into the cart total and sale payload, store them on the sale line, show them on receipt and kitchen ticket. Re-record fixture 11 deliberately and note why.
Step 1c (AFTER extraction, BEFORE the Takeaway tab, ~2 days): Inventory > Add-ons library page (create group once, options inside, reorder, 86 an option); attach to products and to categories (`category_modifier_group` pivot; a product's groups = its own + its category's); restaurant-type stores only; ProductModal shows inherited groups read-only.
Not in v1: add-on stock deduction / recipe link.
Plan total moves from ~20 to ~23 working days.

### Step 1b done (6 Oct 2026): add-ons priced and saved on counter sales
- Convention: a cart line's `original_price` = full undiscounted unit price INCLUDING add-ons; `basePrice` = the item alone. The table service still stores the base and re-adds deltas (`serverLineToCart` now returns `original_price = base + delta`; `cartLineToServer` still sends the base).
- Sale payload: `price` already includes add-ons; new optional `modifiers: [{id,name,price_delta}]` per line (key omitted when none). Server: validation + `SaleController::cleanModifiers`, new `sale_items.modifiers` JSON column (migration `2026_10_06_000001`), saved on store and edit; receipts (JS print paths + 4 blade views) show add-on names.
- Fixture 11 re-recorded on purpose (1,500 -> 1,650); fixture 13 added (add-on + line discount + tax = 3,542). Other 11 fixtures byte-identical.
- To run on your machine: `php artisan migrate`, `php artisan test --filter SaleAddOnsTest`, `npm test`.

### Step 2 (Sale Core extraction), progress 6 Oct 2026 — slice 1 done
Folder is `resources/js/Sell/core/` as in section 2.1.
- DONE `cartMath.js` (`computeTotals`): all money arithmetic, same operations in the same order as the old inline code.
- DONE `salePayload.js` (`buildSalePayload`, `buildSaleItems`, `clampPayments`): the exact `sales.store` body.
- DONE `useShift.js`: shift/drawer state and fetch.
- `Pos.jsx` rewired onto all three (7,692 -> ~7,590 lines, no behaviour change). Proof: `saleCoreMath.test.js` (pure modules vs all 13 recordings), `saleCoreGolden.test.jsx` (the real page vs all 13 recordings), `useShift.test.jsx`.
- TODO (in this order, one at a time, golden replay after each): `useCheckout`, `useCart`, `useSaleSession`, `useCatalog`, `useProductSearch`, `useHotkeys`, `money.js`; then UI (`CatalogPane`, `ScanBar`, `CartLines`, `TenderPanel`, modals).
- STILL NEEDED before Phase 1 is accepted: harness screenshots before/after (0.5% pixel diff) and the manual POS run-through (section 6) on a real device. jsdom cannot show layout.

---

## Build status, 6 Oct 2026 (all phases written; NOTHING below has been run against a real database or browser)

**Written and statically checked** (PHP `php -l` clean on every touched file; JS parses; vitest: golden 13 + FOH 5 + earlier suites pass in a scratch copy):

- Phase 2 backend: `foh.access` permission + waiter preset, `FohSettings` (single reader), `FohController` (`/foh/{tab?}`, `/foh-settings`), table-service additions (`convert`, `collected`, `kitchen_progress`, paid-lane-stays-open), `LaneCollection`, `sales.occupancy_id` / `sales.order_type`, `products.track_stock`, per-channel stock skipping (`channel=foh` + `foh_stock=never`).
- Step 1c: add-ons library (`category_modifier_group`, `Inventory/AddOns`, product form picker, category inheritance, `pos.variants`).
- Phases 3-7 frontend (`resources/js/Foh/*`, `Pages/Foh/Index.jsx`, `Pages/Foh/Settings.jsx`): Overview, Tables, Takeaway, Delivery tabs on one `OrderPane`; pay/split/move/convert/collect; settings page with stock-by-category.
- Phase 8: old URLs redirect to FOH (`/tables`, `/pos?view=floor`, `/pos?occupancy=ID`, restaurant dispatch / dashboard / settings) behind `VQ_FOH_REDIRECTS` (default on). The till is forced to counter mode for stores on FOH; a one-time toast tells a former table-terminal device where tables went; a "Front of House" button sits on the till.

**Deviations from the plan (on purpose, for you to veto):**

1. `Pos.jsx` table code is NOT deleted. It is unreachable for FOH stores (service mode is forced to counter, `?view=floor` redirects) but the ~4,000 lines are still there. Deleting them blind, without running the app, risked the till for no user-visible gain. Set `VQ_FOH_REDIRECTS=false` to bring the old screens back instantly. Delete after a week of FOH in production (separate pass; golden fixtures protect it).
2. Rider cash-up stays on the old dispatch page (`/restaurant/dispatch?legacy=1`, linked from Delivery as "Rider cash-up"), not a drawer. Same endpoints.
3. No `foh_beta` per-tenant flag: the global `VQ_FOH_REDIRECTS` switch replaced it.
4. No offline queue for FOH payments (a payment that cannot reach the server is reported, never parked), by design: two devices must not bill one table.
5. Dead kitchen toggles are kept on the FOH settings page, not deleted (not yet wired to the KOT path).
6. `Pos/Table/*` shims were not created; FOH imports those components directly.

**Not verified (needs your machine):** `php artisan migrate` (3 new migrations), `php artisan ziggy:generate` (ziggy.js was hand-patched), PHP tests (`FohBackendTest`, `SaleAddOnsTest`; then `php tests/Scripts/update_suites.php`), `npm run build`, 3 vitest files that read files outside `resources/js` (appearance, settingsContracts, chequeManagement G-00) could not run in the scratch copy, and the manual run-through: seat a table, add dish with add-on, fire, split by lines, pay, convert dine-in to takeaway, takeaway paid-then-collect, delivery with rider, 86 an item, restricted-staff shift prompt, phone width.

---

## Audit against this plan, 6 Oct 2026 (second pass)

Closed in this pass: Phase 0 leftovers (permission middleware on restaurant dashboard/queue/riders/settings GETs, `/catalogue/` + `/track/` public prefixes, unused imports); Tables floor rail; Overview as three columns with the "today" line and late flag; Delivery list ordered by status with late flag; top bar with order search, Kitchen / TV / Settings links, F1-F4, `/`, `N`, Esc, per-tab attention dot and `open/total` table count; phone bottom tab bar; takeaway "Pay & send to kitchen" for the pay-first flow; add-on option reorder in the library.

**Still NOT done (honest list):**
1. Sale Core hooks beyond `cartMath`, `salePayload`, `useShift` (`useSaleSession`, `useCart`, `useCheckout`, `useCatalog`, `useProductSearch`, `useHotkeys`, `money.js`) and the shared UI (`TenderPanel`, `CartLines`, `CatalogPane` for the POS). FOH has its own hooks over the same pure money modules. Pure refactor of a 7.5k-line file with no visible change; risky without a running app.
2. `Pos.jsx` table-mode code not deleted (target ≤ 3,000 lines), `usePosLayout` table preset not removed, `Pos/Table` not moved to `Foh/table`.
3. `FloorStateService` extraction + payload snapshot test (state logic still lives in `TableServiceController`; `FohSettings` lives in `app/Support`, not `app/Services/Foh`).
4. Takeaway local draft (counter ringing with no server round-trips): FOH takeaway creates a lane ticket first. Plan flow names are `pay_first`/`order_first`; built as `pay_first`/`fire_first`.
5. Delivery: rider cash-up drawer (link to old page instead), delivery "default fee/ETA", late threshold, COD toggle, tracking toggle.
6. Settings sections without a working consumer were NOT added (no dead toggles): takeaway order-number prefix, name-required, default covers, device preferences, live preview, kitchen routing page move.
7. FOH offline banner / read-only mode; "Updated on another device" notice.
8. Harness screenshots, performance pass, manual checklist, `foh_beta` per-tenant rollout, Phase 10 recipe stock (deferred by plan).

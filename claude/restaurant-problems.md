# VenQore Restaurant: The Problem Register

Companion to `restaurant-fix-plan.md`. This file says what is wrong and why it matters. The other file says what to build. Every problem has an ID (`R1`…`R28`) that the fix plan references.

Audited 22 Sep 2026 against `app-code/main-app`. Code claims were verified by reading the files named. Market claims are sourced at the bottom.

---

## Part 0 — Scope: read this first

**VenQore is not restaurant software.** It serves many kinds of business, and the restaurant module is a small part of it. Two rules govern everything below:

1. **Invisible when irrelevant.** A pharmacy or grocery must never see a kitchen button, a station, a course or a rider. Not greyed out — **absent**.
2. **Complete when relevant.** A restaurant that switches it on must not hit a dead end. Half a kitchen system is worse than none, because they will have already trusted it with a service.

### Not every problem below is a restaurant problem

Four items are platform problems that restaurants merely expose first. They serve every customer we have and must be prioritised against the whole roadmap, not inside this module:

| ID | Item | Also needed by |
|---|---|---|
| R19 | **FBR digital invoicing** | Every Pakistani retailer, salon, clinic, courier — legally mandatory, actively enforced |
| R20 | **Shift / cash drawer / Z-report** | Every till in the product |
| R18 | **Void / comp / discount audit trail** | Every till |
| R22 | **Recipe → stock depletion** | Bakeries, manufacturers, anyone with a BOM |

Tagged `[PLATFORM]` where they appear. Everything else is module work.

---

## Part A — What restaurants actually need (the outside view)

Before listing our gaps, here is what the market says matters. This is not opinion; it is what operators complain about and what competitors ship.

### A1. The number one complaint is not a missing feature — it is not being able to prove you were paid

An analysis of 11,389 verified Capterra reviews across 20 restaurant products (2013–2026) found the single most-cited problem is **"POS deposits don't match bank deposits"** — roughly 1 in 8 negative POS reviews. The study's conclusion is worth reading twice:

> *Operators requested not additional features but verification they were paid correctly.*

Ranked complaints:
1. POS deposits don't match bank deposits
2. Delivery platform integration failures — the fastest-growing complaint 2022–2026 (orders don't arrive, arrive without payment data, need re-keying)
3. POS-to-accounting sync problems
4. Hidden fees / surprise billing
5. End-of-day reconciliation — needing several reports to close one day, and the variance still not balancing

**Strategic read for VenQore:** this plays directly to what we already are — an ERP with real accounting underneath, not a payments company reselling a till. "You can always prove what you were paid, down to the rider and the shift" is a sharper promise than "we have a floor plan too," and it is true for every business we serve, not just restaurants. Note that three of the five complaints above are platform concerns (R18, R20), not restaurant ones.

### A2. What a restaurant POS is expected to do

From the feature checklists and South-Asian market leaders (Petpooja):
- **KOT to the kitchen in seconds**, routed to the right station
- **Coursing** — starters fire now, mains fire when the starters clear
- **Modifiers and combos** with price deltas
- **Table management** — visual floor, statuses, split and merge checks
- **Recipe-level inventory** — "how much mozzarella did that pizza use"
- **Aggregator sync** — Swiggy/Zomato in India; Foodpanda/Careem in Pakistan. Petpooja's stated pain point: manual billing collapses "the moment aggregator orders come in"
- **Offline mode** — bills stored locally, synced on reconnect
- **Cash management** — drawer counts, end-of-day reconciliation, theft control
- **Local payment rails** — UPI is 84% of digital transactions in India; the Pakistan equivalents are JazzCash/Easypaisa and raast

### A3. Voids and comps are how restaurants get robbed

The classic scheme: customer pays cash for three items, leaves, server voids one item and pockets the difference. Comps get used to remove legitimately served food. Controls that matter:
- Void/comp frequency and value per employee, tracked at check-line level
- Exception reports with thresholds (e.g. flag >5 comps in a day, or a check where more than 25% of value was voided)
- One operator reported cutting comps/deletes by over 2 percentage points of P&L — about $100,000/year after adding monitoring

We have no void/comp audit trail at all. See R18 — and note it is a platform gap, not a restaurant one. A grocery is robbed the same way.

### A4. Kitchen printing reality

- **80mm is the restaurant standard.** 58mm is "too narrow for itemized restaurant bills" — it is fine for a small KOT, wrong for the customer bill
- **Ethernet is the most reliable connection** for kitchen printers; Wi-Fi is "sensitive to interference in busy environments"; Bluetooth is unsuitable
- Kitchen printers are physically different — they resist oil smoke, steam and dust, and have loud buzzers and bright LED alarms because a kitchen is noisy and nobody is watching the printer
- A typical restaurant runs three printers: front counter (bill), kitchen (KOT), and takeaway/delivery
- **ESC/POS is the universal command standard** — support it and almost any printer works

### A5. Pakistan: FBR digital invoicing is now legally mandatory · [PLATFORM]

- Scope explicitly includes "retailers, restaurant, hotel, clinic, salon, courier, or online seller in the notified categories" — this is most of our customer base, not a restaurant feature
- Every compliant invoice needs: a unique FBR-assigned invoice number obtained before the sale completes, a scannable QR code, seller and buyer details, tax amounts and HS codes, and real-time transmission to FBR
- FBR expected all active sales-tax filers on digital invoicing by 31 July 2026, and enforcement is active
- Penalties start at Rs 500,000, escalating to registration suspension and blacklisting under the Finance Act 2026
- There is no fee payable to FBR itself — costs are POS setup and licensed integrator configuration
- No Pakistani business in those categories can legally use a POS that can't do this. We currently can't. See R19.

---

## Part B — What VenQore already has (so we don't rebuild it)

Genuinely present and working:

| Capability | Where | State |
|---|---|---|
| Open orders (dine-in / takeaway / delivery) | `occupancies`, `positions` | Solid |
| Floor plan builder | `TableService/FloorBuilder.jsx` | Solid |
| Split / transfer / merge bills | `TableServiceController` | Solid |
| Modifiers with price deltas | `Modifier`, `ModifierGroup` | Present |
| Recipes / BOM | `Composition` + `CompositionItem` (product → ingredients) | Foundation exists |
| Kitchen ticket model | `WorkOrder` (station, course, fired_at, bumped_at) | Schema good, unused |
| A complete KDS | `Restaurant/Kitchen.jsx`, bump/recall routes, `kds.css` | Built, unreachable |
| Offline storage | `DB/LocalDB.js` (Dexie/IndexedDB) | Present |
| Receipt printing | `sales/{sale}/print` + AMD Station hardware bridge | Present |
| Accounting / inventory / purchasing | Core ERP | Strong — this is our edge |

**The honest summary:** the restaurant module is about 60% built and 0% usable, because the pieces are not connected to each other or to any navigation.

---

## Part C — The problem register

Severity: **P0** = the feature cannot be used at all · **P1** = built but wrong · **P2** = missing, needed · **P3** = polish.

### Structural

- **R1 · P0 · Firing to the kitchen requires having tables.** `WorkOrder::create` exists in exactly one place — `TableServiceController`. A café on the counter preset has no way to send anything to a kitchen. To get kitchen tickets you must adopt the whole table-service model, including a floor plan you may not have. These two facts are unrelated and the code welded them together. This is the root cause of R2 and of the confusion about takeaway.
- **R2 · P1 · A takeaway ticket buys the shop nothing unless there's a kitchen.** The takeaway lane is a plain on/off toggle with no relationship to whether the shop prepares anything. A ticket is only worth its cost when the order must be made, stays open while it's made, or needs a number called out. Otherwise it's just a sale, and we're adding steps.
- **R3 · P2 · "Table Service" is the wrong name for what this is.** It covers dine-in, takeaway and delivery; only the first involves a table. A delivery-only cloud kitchen must enable something called "table service" to take any order.
- **R4 · P1 · Delivery lives on the floor plan.** Dine-in and takeaway end when food is handed over. Delivery has a whole second life after that — assign, road, door, cash back. Putting that on a screen whose job is showing which seats are occupied is wrong.

### Kitchen

- **R5 · P0 · The KDS is unreachable.** `/restaurant/kitchen` exists with polling, bump and recall — and the word "Kitchen" appears nowhere in the navigation (`OneGlanceLayout.jsx`, `SidebarItem.jsx`). Fully built, completely invisible.
- **R6 · P0 · There is no kitchen printing.** No KOT route, no docket template, no printer routing. Searched the whole codebase. Given A4, this blocks most of the target market — a small kitchen runs on a thermal printer, not a screen.
- **R7 · P1 · Every kitchen ticket displays as dine-in.** `Kitchen.jsx:63` reads `order.order_type` for its icon. `ticketShape()` (`RestaurantDashboardController.php:321`) never returns it and `work_orders` has no such column. A delivery and a sit-down order look identical on the pass. One gets bagged, one gets plated.
- **R8 · P1 · station is hardcoded to 'kitchen'.** `TableServiceController.php:257` writes the literal string. The column exists, the migration comments describe routing, and nothing routes. Drinks, grill and fryer all land on one screen. No product→station mapping exists.
- **R9 · P1 · course is never set.** Defaults to 1, never written. No starters-then-mains. Column and KDS support it; nothing produces it.
- **R10 · P0 · The KDS loads every ticket ever written, on a poll.** `kitchenQueue()` is `WorkOrder::where('tenant_id',…)->orderBy('id','desc')->get()` — no status filter, no date filter, no limit — returned every few seconds to a screen left open all service. Fine at 20 rows; fatal after a year.
- **R11 · P2 · No "hold and release" for a course.** Kitchens hold mains until the starters clear. Bump and recall exist; hold does not.
- **R12 · P2 · No cancellation path to the kitchen.** If a line is voided after firing, the kitchen is never told. They cook it anyway.

### Delivery

- **R13 · P0 · Riders do not exist.** The string `rider` appears in exactly one file — `TableServiceController.php`, added 21 Sep 2026. No rider model, no assignment, no list, no history. What shipped is a free-text note presented as a rider feature.
- **R14 · P1 · The delivery fee is captured and never charged.** Collected, displayed, stored on the ticket — never added to the bill.
- **R15 · P2 · No cash-on-delivery reconciliation.** A rider leaves with three orders and comes back with cash. There is nothing that says what they should have, what they handed in, or what's short. This is the #1 market complaint (A1) in its most literal form. Depends on R20.
- **R16 · P2 · No rider commission.** No per-delivery or per-distance earnings, no payout report.
- **R17 · P2 · No customer-facing order tracking.** The customer phones the restaurant to ask where their food is, and the restaurant phones the rider.

### Money and control

- **R18 · P1 · [PLATFORM] · No void / comp / discount audit trail.** Per A3 this is the main theft vector in hospitality and retail. No per-employee void/comp record, no exception report. `pos.void_item` is defined in `config/permissions.php` and checked nowhere — the codebase's own defect list already flags this.
- **R19 · P0 · [PLATFORM] · No FBR digital invoicing.** Per A5, legally mandatory and actively enforced across retail, hospitality, salons, clinics and couriers. Penalties from Rs 500,000. The highest-value item in this register, and it is not a restaurant feature.
- **R20 · P1 · [PLATFORM] · No shift / cash drawer / Z-report.** No `Shift` model, no drawer count, no end-of-day close. Searched `app/` and `database/migrations/`. Per A1 and A2 a core expectation of any till — and the foundation R15 needs.
- **R21 · P2 · No aggregator integration.** Foodpanda/Careem orders are re-keyed by hand. Per A1 the fastest-growing complaint category in the market; per Petpooja, where manual billing collapses.

### Operations

- **R22 · P2 · [PLATFORM] · Recipes exist but don't deplete stock.** `Composition` models the recipe. Nothing consumes ingredients when a dish is sold, so food-cost and wastage reporting are impossible. Equally true for a bakery or any BOM manufacturer.
- **R23 · P2 · No table reservations / waitlist.** No booking model at all.
- **R24 · P3 · No tip handling.** Service charge exists; tips (which belong to staff, not the house) do not.
- **R25 · P3 · No "86" list.** Kitchens run out of dishes mid-service and need to mark them unavailable instantly across every till.
- **R26 · P3 · No kitchen performance reporting.** `fired_at` and `bumped_at` are captured — nothing reports average ticket time, the metric every kitchen manager runs on.
- **R27 · P3 · /restaurant/kitchen has no permission middleware**, unlike the bump and recall routes beside it which require `pos.checkout`.
- **R28 · P3 · Seeded demo tables fight the user.** `seedIfEmpty` created twelve tables named after somebody else's dining room. Removed from the main path on 21 Sep; verify it is gone everywhere.

---

## Sources

- [Restaurant Software Pain Points 2026: 11,389 Capterra Reviews Analyzed](https://www.deliverguard.io/research/restaurant-software-pain-points-2026)
- [FBR Digital Invoicing 2026: Complete Guide (Rules, Cost & Integration)](https://www.switchertechno.com/fbr-digital-invoicing-guide-pakistan)
- [44 Best Restaurant POS Features Every Operator Needs in 2026](https://getquantic.com/restaurant-pos-system-features/)
- [Restaurant Employee Theft — Voids & Comps (Mirus)](https://blog.mirus.com/restaurant-employee-theft-voids-comps)
- [How to Pick the Best POS for Your Restaurant in India (Petpooja)](https://blog.petpooja.com/operations-workflows/best-pos-for-my-restaurant/)
- [Best POS Printers for Restaurants 2026 (HPRT)](https://www.hprt.com/Product/POS-PRINTERS/best-restaurant-pos-printers.html)
- [POS Integrated Retailers with FBR System — Federal Board of Revenue](https://www.fbr.gov.pk/pos-integrated-retailers/163085/163089)

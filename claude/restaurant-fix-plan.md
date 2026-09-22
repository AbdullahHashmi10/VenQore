# VenQore Restaurant: The Fix Plan

Companion to `restaurant-problems.md`. That file says **what is wrong**; this
one says **what to build**. Problem IDs (`R1`…`R28`) refer to that file.

Written to be handed to an IDE agent. Every task has acceptance criteria that
can be checked without reading the implementer's mind.

---

## 0. The governing principle

> **VenQore is not restaurant software. The restaurant module is a small part of
> a product that serves many kinds of business. But a restaurant using VenQore
> must never feel it is using retail software with tables bolted on.**

Two hard rules follow, and every task below is subject to both:

**Rule 1 — Invisible when irrelevant.** A pharmacy, a grocery, a clothes shop
must never see a kitchen button, a floor plan, a rider, a course or a KOT
setting. Not greyed out. Not "coming soon". **Absent.** A dead control on a till
is a daily reminder that the software was made for somebody else.

**Rule 2 — Complete when relevant.** When a restaurant switches it on, the
module must be finishable in one sitting and must not run out of road at the
first real-world case. Half a kitchen system is worse than none, because the
restaurant will have already trusted it with a service.

**Corollary:** prefer *depth in a small surface* over breadth. It is better to do
dine-in, takeaway, delivery and the kitchen properly than to also half-do
reservations, loyalty and table-side ordering.

---

## 1. Decisions locked (do not re-litigate)

| Decision | Answer |
|---|---|
| Market | **Global-capable, Pakistan supported.** Nothing Pakistan-specific in core; Pakistan compliance is a switchable module. 80mm KOT default, 58mm supported. |
| Delivery depth | **Own riders, fully built** — staff records, assignment, live status, history, cash-on-delivery reconciliation, commission — **plus a customer tracking link**. No aggregator integration this round. |
| Kitchen gating | **Its own setting**, `prepares_orders`, suggested by business type, owner-overridable, **independent of tables**. |
| Renaming | **Now.** "Table Service" → "Orders". "Floor Plan" stays. |
| KOT vs KDS | **Printing first.** The KDS already exists and only needs unblocking; printing is the actual gap. |

---

## 2. Scope split — read this before planning sprints

Several problems in the register are **not restaurant problems**. They are
whole-product problems that restaurants merely expose. They must be prioritised
against the entire roadmap, not inside this module, and they benefit every
customer we have.

### Platform work (not this module — raise separately)

| ID | Item | Who else needs it |
|---|---|---|
| R19 | **FBR digital invoicing** | Every Pakistani retailer, salon, clinic, courier. Legally mandatory, actively enforced, penalties from Rs 500,000. **This is the highest-value item in the whole register and it is not a restaurant feature.** |
| R20 | Shift / cash drawer / Z-report | Every till in the product |
| R18 | Void / comp / discount audit trail | Every till. `pos.void_item` is already defined and checked nowhere |
| R22 | Recipe → stock depletion | Bakeries, manufacturers, anyone with a BOM. `Composition` already models it |

**Recommendation:** do R20 before the delivery phase below. Cash-on-delivery
reconciliation (R15) has no meaning without a shift to reconcile *into*, and
shift close is the thing the market complains about most (see problems A1).

### Restaurant module (this plan)

Everything else: R1–R17, R21, R23–R28.

---

## 3. Phase 1 — Make the kitchen exist

**Goal:** a café with no tables can ring an order, the kitchen gets a printed
ticket, and the cook can mark it done. Nothing else in Phase 1 matters more
than that sentence being true.

### T1.1 — The `prepares_orders` setting (fixes R1, R2)

Create a store setting, independent of `service_mode`.

- Key: `prepares_orders`, values `'1'` / `'0'`, stored in `settings` like
  `service_mode`.
- Endpoint alongside `tables.service-mode`, gated `admin.settings_manage`.
- **Default is derived, not guessed:** on store creation, set `'1'` when the
  tenant's `business_type` resolves (via `BusinessTypes::presetFor()`) to a
  preset in `{restaurant, cafe, bakery, food_counter, catering}`, else `'0'`.
- Exposed in Register settings under the **Service** tab, labelled in plain
  language: *"This shop prepares orders before handing them over"* with the hint
  *"Turns on kitchen tickets. A restaurant, café or bakery wants this; a shop
  that sells what is already on the shelf does not."*
- Add it to the setup wizard as one line on the Service step.

**Acceptance:**
- A tenant with `business_type = pharmacy` has `prepares_orders = '0'` and sees
  no kitchen control anywhere.
- A tenant with `business_type = restaurant` has it on by default.
- The owner can flip it either way and the register reflects it without a reload.

### T1.2 — Fire to the kitchen from any register (fixes R1)

Move kitchen firing out of `TableServiceController`'s exclusive ownership.

- Extract a `KitchenTicketService` (or similar) owning `WorkOrder` creation.
  `TableServiceController::sendToKitchen` becomes a caller, not the owner.
- Add a **Send to kitchen** action to the counter register, visible **only** when
  `prepares_orders` is on.
- On a counter sale with no open order, firing **opens a lane ticket
  automatically** (order type `takeaway`), gives it a number, and keeps the cart
  attached to it. The cashier does not have to know what an "occupancy" is.
- Never show this control when `prepares_orders` is off.

**Acceptance:**
- A counter-preset café with no floor plan and zero `positions` can fire a
  ticket and the kitchen receives it.
- A retail tenant sees no such button.
- Firing twice sends only the unsent lines (existing behaviour preserved).

### T1.3 — KOT printing (fixes R6)

The core of this phase.

- **Docket template**, separate from the bill. Contains: ticket number, order
  type (**DINE-IN / TAKEAWAY / DELIVERY**, large), table code or customer name,
  time fired, server name, then items with quantity, modifiers and notes.
  **No prices** — the cook does not need them and they slow reading.
- **80mm default, 58mm supported** as a setting. Large, high-contrast type;
  assume a greasy printer at arm's length.
- **ESC/POS** via the existing AMD Station bridge. Ethernet printers first —
  document that Wi-Fi is unreliable in kitchens and Bluetooth unsuitable.
- **Print on fire**, plus a **reprint** action from the KDS and from the order.
  Reprints must be marked `** REPRINT **` so the kitchen does not cook twice.
- A **cancellation docket** when a fired line is voided (fixes R12), printed
  with `** CANCELLED **` and the item.
- Printer assignment lives per station (see T2.1); until stations ship, one
  kitchen printer.
- **Failure is loud.** If the docket does not print, the register must say so
  immediately and offer retry. A silently lost KOT is food that never gets
  cooked and a customer who waits an hour.

**Acceptance:**
- Firing prints a docket with no prices and the order type legible across a room.
- Pulling the printer's plug produces a visible, blocking error on the till —
  not a console warning.
- Reprint is clearly marked; cancellation prints its own docket.

### T1.4 — Put the KDS in the navigation (fixes R5, R27)

- Add a **Kitchen** entry under Transactions, beside Orders and Floor Plan.
- Visible only when `prepares_orders` is on.
- Add `permission:pos.checkout` to `GET /restaurant/kitchen`, matching the bump
  and recall routes beside it.

**Acceptance:** a restaurant user finds the kitchen screen without being told a
URL. A retail user has no such entry.

### T1.5 — Fix the KDS ticket payload (fixes R7, R10)

- Add `order_type` to `work_orders` (migration), set it on fire from the
  occupancy's order type, and return it from `ticketShape()`.
- **Bound `kitchenQueue()`**: open statuses (`pending`, `preparing`, `ready`)
  plus `served` within the last N hours (default 4), hard limit 200, newest
  first. Add an index on `(tenant_id, status, fired_at)`.

**Acceptance:**
- A delivery ticket and a dine-in ticket are visibly different on the pass.
- With 50,000 historic work orders seeded, the KDS poll returns in under 200ms
  and transfers a bounded payload.

---

## 4. Phase 2 — Make it feel like a restaurant

### T2.1 — Stations (fixes R8)

- A `station` concept: a per-tenant list (kitchen, bar, grill, …), each with an
  optional assigned printer.
- A product → station mapping (nullable; unmapped products go to the default
  station).
- `sendToKitchen` writes the real station instead of the literal `'kitchen'`,
  and **splits one fire into one docket per station** — the bar should not
  receive the steak.
- The KDS gains a station filter, remembered per device, so the bar screen shows
  bar tickets.

**Acceptance:** an order with a drink and a curry produces two dockets on two
printers, and each station's screen shows only its own items.

### T2.2 — Coursing (fixes R9, R11)

- Set `course` on fire (default 1). A line can be assigned a course in the cart.
- **Hold and release**: a held course is stored but not printed; releasing it
  prints the docket then.
- The KDS groups a ticket's items by course.

**Acceptance:** starters fire immediately; mains sit held until released, then
print as their own docket referencing the same table.

### T2.3 — Rename "Table Service" to "Orders" (fixes R3)

- User-visible strings only — do **not** rename database tables, routes or
  models in this pass. `occupancies` and `positions` stay.
- Sidebar "Tables" → **"Orders"**; "Floor Plan" unchanged.
- Settings copy, wizard copy, toasts and empty states updated.
- The Table layout preset stays named **Table** — it genuinely is about tables.

**Acceptance:** a delivery-only cloud kitchen can set itself up without ever
reading the word "table" except on the Floor Plan screen it does not use.

### T2.4 — The 86 list (fixes R25)

- Mark a product unavailable from the register or the KDS, instantly, across
  every till. Auto-clears at end of service (configurable).

**Acceptance:** marking a dish 86'd on the KDS greys it on every open register
within one poll.

---

## 5. Phase 3 — Delivery, properly

**Prerequisite: R20 (shifts / cash drawer) should land first.** Rider cash
reconciliation reconciles *into* a shift. Without one there is nothing to
balance against.

### T3.1 — Riders as real records (fixes R13)

- Build on the existing `Employee` / `TenantUser` models — do **not** create a
  parallel people table.
- A `rider` capability on a staff record: who can be assigned deliveries.
- Rider list with live state: available / out (with count) / off shift.
- Assignment from a picker on the delivery ticket, replacing the free-text box
  shipped on 21 Sep.
- Per-rider history: deliveries, times, distances if available.

**Acceptance:** the free-text rider field is gone; every assignment points at a
staff record; "who is out right now and with how many orders" is answerable on
one screen.

### T3.2 — Dispatch screen (fixes R4)

- A screen separate from the floor plan: everything out, with whom, how long,
  what is late.
- The **floor plan keeps one summary chip** ("3 out, 1 late") and nothing more.
- Late is derived from promised-vs-elapsed, never stored.

**Acceptance:** the floor plan no longer carries delivery status detail; a
dispatcher can run a dinner service from the dispatch screen alone.

### T3.3 — Cash on delivery reconciliation (fixes R15)

**This is the highest-value item in the module** — it is the market's number one
complaint in its most literal form.

- Each delivery records: amount due, payment method (cash / card / online /
  prepaid), and amount collected.
- A rider's running balance: what they left with, what they collected, what they
  have handed in.
- **Shift-end rider cash-up**: expected vs handed in vs variance, per rider,
  with the shortfall named. Posts to the shift and into accounting.

**Acceptance:** at end of shift a manager sees, per rider, a single number for
what should be in their pocket, and records what actually came back. Variances
are visible, attributable and posted.

### T3.4 — Commission (fixes R16)

- Per-delivery commission: flat, percentage of order, or per-distance band.
- Configurable per rider or globally, with the rate stamped **at delivery time**
  so a later rate change cannot rewrite history.
- Payout report per rider per period, feeding payroll.

**Acceptance:** changing the commission rate does not alter past deliveries.

### T3.5 — Delivery fee on the bill (fixes R14)

- The captured fee becomes a real line at settle time.
- It is a **sale line**, taxed per local rules, not a discount or an adjustment.
- Touches the shared tender path — change it carefully and test counter,
  dine-in, takeaway and split settlement.

**Acceptance:** a delivery with a fee produces a bill whose total includes it
and whose accounting entries balance.

### T3.6 — Customer tracking link (fixes R17)

- A tokenised public URL per delivery — **unguessable, expiring, no login**.
- Shows: order status, promised time, rider first name. **Never** the rider's
  phone number, exact location, or any other customer's data.
- Sent by SMS or WhatsApp where a provider is configured; otherwise copyable.

**Acceptance:** the link works signed-out, expires after delivery + N hours, and
leaks no personal data beyond a first name.

---

## 6. Phase 4 — Depth, once the above is solid

- **T4.1** Kitchen performance reporting (R26) — average ticket time by station
  and hour, from `fired_at`/`bumped_at`, which are already captured.
- **T4.2** Reservations and waitlist (R23).
- **T4.3** Tips, separate from service charge, belonging to staff (R24).
- **T4.4** Aggregator ingestion (R21) — Foodpanda/Careem into the same kitchen
  queue. Each is its own integration and most need a partner agreement; treat as
  a project, not a task.
- **T4.5** Verify demo table seeding is gone everywhere (R28).

---

## 7. What "done" means for the module

A restaurant should be able to complete all of this without contacting support:

1. Pick their business type at signup → kitchen features are already on.
2. Run the register setup wizard → pick Table (or not), set lanes, build a floor.
3. Assign a kitchen printer → fire a test docket.
4. Take a dine-in order, fire it, see it print, bump it on the pass.
5. Take a takeaway with no table involved at all.
6. Take a delivery, assign a rider, watch it out, settle it with the fee on the
   bill, and cash the rider up at end of shift with the variance visible.

And a pharmacy should be able to use VenQore for a year without ever learning
that any of it exists.

---

## 8. Review checklist (for verifying the IDE's work)

When the implementation comes back, check each of these — most regressions will
be here:

- [ ] **Rule 1 holds.** Log in as a retail tenant: no kitchen nav, no kitchen
      button on the till, no station settings, no rider anything. Check the
      sidebar, the register, the settings drawer and the wizard.
- [ ] **Rule 2 holds.** A restaurant tenant can complete all six steps in §7
      without a dead end.
- [ ] `prepares_orders` is genuinely independent of `service_mode` — set one
      without the other, both directions, and confirm sensible behaviour.
- [ ] KOT contains **no prices** and the order type is legible from a distance.
- [ ] Printer failure is surfaced to the cashier, not swallowed.
- [ ] Reprints and cancellations are visually distinct from a first print.
- [ ] `kitchenQueue()` is bounded — check the query, not just the screen.
- [ ] `order_type` is set on every new `WorkOrder` and rendered on the KDS.
- [ ] No parallel people table was created for riders.
- [ ] Commission rates are stamped at delivery time, not read live.
- [ ] The tracking link is unguessable, expires, and exposes no phone numbers.
- [ ] The delivery fee appears on the bill **and** balances in accounting.
- [ ] Renaming touched **strings only** — no route, model or table renames.
- [ ] Nothing in `app-code/production` was modified (working copy is
      `app-code/main-app`).

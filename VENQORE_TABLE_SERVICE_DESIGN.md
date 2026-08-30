# VenQore — Table Service Design Proposal

**Status:** design proposal, for discussion. Not an implementation plan.
**Date:** 28 Aug 2026
**Decision it serves:** how the restaurant / café side of VenQore should work, and why.

---

## 0. The one idea this whole document rests on

A counter register and a table register are not two skins of the same screen. They optimise for opposite things.

| | Counter | Table service |
|---|---|---|
| Unit of work | The **sale** | The **table** |
| Lifespan | Seconds | 40–90 minutes |
| Concurrency | One at a time | 20 open at once |
| The hero on screen | The cart | The **floor** |
| What "Hold" means | Park a cart | Nothing — a table *is* a held sale |
| Staff posture | Standing at one till | Moving, returning, glancing |

So the mode switch is right — one page, one payment engine, one catalogue — but the two modes must not *look* like each other. On the counter, the cart is the centre of gravity. On the floor, **the floor is the centre of gravity and the cart is what you get after you pick a table.**

Your existing settings copy already says this better than most vendors' marketing does:

> "A counter till sells to whoever is standing there. A table service register makes the TABLE the unit of work — the floor becomes the pane the shift starts from, an order belongs to a table rather than to a queue, and Hold disappears, because a table already is a held sale."

That sentence is the product. The rest of this document is making the screen honour it.

---

## 1. What already exists (so we don't rebuild it)

This matters for scoping — a lot of the hard part is done.

**Database — already correct.** There are two canonical tables:

- `positions` — the physical space: `zone`, `code`, `label`, `capacity`, `sort_order`, `status`
- `occupancies` — an active session at a position: `session_data`, `party_id`, `opened_by`, `opened_at`, `closed_at`

This generalises past restaurants (a counter slot, a delivery lane, and a dining table are all positions). It is the right foundation and needs no redesign.

**Backend — already wired.** `TableServiceController` exposes open, saveOrder, sendToKitchen, transfer, merge, close, setStatus, split, splitCancel, settled, setServiceMode, setServiceCharge. `order_type` already exists as `dine_in | takeaway | delivery`. There is a kitchen display (`restaurant/kitchen`, with bump and recall). Nothing here runs on mock data.

**Front end — the bones are there.** `FloorPane` already renders table code, covers, elapsed timer, amount due, an unsent-items badge, zone tabs, and derived status tones. `TableBar` has a covers stepper, order-type cycling, and Fire / Split / Move / Close. `MoveSheet` handles transfer and merge. Split is held *on the table* as a claim rather than becoming a second order — that is a genuinely good decision already made.

**Settings — the mode switch exists.** Service style is already a three-way Counter / Table service / Both.

---

## 2. What is actually missing

Five things, in order of how much they hurt.

1. **You cannot create a table.** `FloorPane`'s empty state literally says *"Add tables in Settings, or pick another zone."* That settings screen does not exist. `Position::create` appears once in the whole codebase, inside a controller helper. This is the single biggest gap and the one you identified yourself.
2. **The floor is a pane, not a home.** Today the floor is one column beside the register. In a real service flow the floor is where the shift *lives* and the order screen is what you step into.
3. **The floor doesn't tell you where to go next.** It shows state. It does not rank urgency.
4. **Takeaway and delivery have nowhere to live on screen.** The data model supports them; the floor has no lane for them, so they get forced onto fake tables or vanish into the counter.
5. **No server assignment.** Nobody owns a table. In any restaurant with more than three staff this is the first thing they ask for.

---

## 3. How the serious platforms do it

Grounding, so we're matching a proven shape rather than inventing one.

**Toast — floor screen.** Service areas appear as a navigation bar of tabs across the top. Each table tile carries five things: guest count, a timer for how long the check has been open, the table identifier, total spend across all checks, and the assigned server's initials in a coloured badge with the table border outlined in that server's colour. Press-and-hold a tile to move or merge checks. Pan-and-zoom changes information density — zoomed out shows fewer, larger facts; zoomed in shows everything.

**Toast — order screen.** A split panel: check details on the left (table number, tab name, server, service charge, split, discount, guest count), menu on the right organised as menus → groups → items with a search bar, and a bottom action bar. The action bar is the interesting part: **Hold / Stay / Send / Print / Pay**, where Send fires highlighted items to the kitchen, Stay sends but keeps you on the order screen, and Hold keeps items on the check without firing.

**Order types.** Toast splits by service mode — Quick Order (fast casual), Table Service, Delivery.

**Seats and courses.** Both are *optional workflows*. Toast lets coursing be set Required, Optional, or Off, and "order by seat" is opt-in. Square and Lightspeed do the same. Nobody forces coursing on a café.

The lesson for us: **the table tile and the bottom action bar are where the product is won**, and advanced restaurant features must be switched off by default.

---

## 4. The proposal

### 4.1 The mode switch

Keep the store-level Service style setting (Counter / Table service / Both) exactly where it is — that's an owner decision, correctly gated behind admin permission.

Add what's missing: **when the store is set to Both, staff need a switch on the register itself**, not a trip into settings. Two segments in the register header — `Counter` / `Floor` — plus a function key. A café doing a takeaway coffee and a dine-in table flips between these dozens of times a shift.

When Service style is Counter, the switch is not rendered at all. No dead chrome.

### 4.2 The floor screen — two states, not two pages

**State A — Floor (the shift's home).** Full width. Zone tabs across the top: `All · Ground · Terrace · Takeaway · Delivery`. A grid of table tiles. A footer with the shift's totals — covers, open bills, amount on the floor.

**State B — Table (after tapping a tile).** The floor collapses to a narrow rail on the left (or hides entirely on a tablet), and the order surface takes over: catalogue, check, action bar. A prominent back affordance returns to the floor.

This is the same split-panel Toast uses, and critically it **reuses the counter register's catalogue, cart and tender panes** rather than building a parallel order UI. One catalogue, one cart, one payment engine — a table bill and a counter sale settle through identical code. That is what stops the two halves of the product drifting apart.

### 4.3 The table tile — where the product is won

Every tile carries:

- **Table code / label** — largest element
- **Covers** — guest count
- **Timer** — how long this table has been open
- **Amount due**
- **Unsent badge** — items on the check not yet fired to the kitchen
- **Server** — initials in a coloured badge, tile border in the same colour *(new)*

Most of that already renders. The border-colour-by-server idea is worth copying directly from Toast — it's how a manager reads a floor in one glance.

### 4.4 Table states — the part that makes it feel intelligent

Today the code derives three tones (open / reserved / cleaning). I'd propose a fuller ladder, all **derived from data you already store**, not a status column somebody has to maintain:

| State | Derived from | Why it matters |
|---|---|---|
| **Free** | no open occupancy | can be seated |
| **Seated** | occupancy open, zero items | ⚠️ *nobody has taken their order yet* |
| **Ordered** | items on check, none sent | needs firing |
| **In kitchen** | items sent, not all bumped | kitchen has it |
| **Served** | all sent items bumped on KDS | eating |
| **Check dropped** | bill printed, not settled | ⚠️ *waiting to pay* |
| **Needs cleaning** | closed, not yet reset | can't reseat |
| **Reserved** | booked for later | hold it |

The two ⚠️ states are the whole idea. **A table that has been Seated for eight minutes with no order, or has had the check dropped for twelve minutes without paying, should visually escalate** — a ring, a pulse, moving to the front of the sort. Thresholds configurable, defaults sensible.

That is the difference between a floor that reports the past and a floor that tells a manager where to walk. It is also the single most demo-able thing in this entire proposal.

### 4.5 Takeaway and delivery — lanes, not fake tables

Do not make takeaway orders sit on invented tables. Instead, treat them as **virtual zones** in the same zone-tab strip:

- `Takeaway` — occupancies with `order_type = takeaway` and no physical position, shown as ticket cards: ticket number, customer name if given, item count, timer, amount.
- `Delivery` — same, plus address/phone and a driver/dispatch state.

They live in the same floor screen, sort by age, and use the identical order surface. A counter-only shop never sees these tabs; a dark kitchen might see *only* these tabs. The order type is chosen when the ticket is opened (your `SeatDialog` already does this) and can be changed later (your `TableBar` already cycles it).

This is also how you honour the "someone wants takeaway, someone wants dine-in" requirement without bolting on a second system.

### 4.6 The one-time setup — the Floor Builder

This is the gap you spotted, and it deserves to be genuinely good because it's the first thing a new restaurant customer touches.

**In the first-run wizard, and permanently editable at Settings → Floor plan.**

1. **How does your place work?** → Counter only / Tables / Both. *(sets Service style)*
2. **Name your areas.** Add, rename, reorder, remove: Ground Floor, First Floor, Terrace, Garden. Free text — never a fixed list.
3. **Add tables to each area.** This must be fast, because nobody wants to add 40 tables one at a time:
   - Bulk create: *"Add [12] tables, prefix [T], starting at [1]"* → creates T1…T12 instantly
   - Each row inline-editable: code, optional label ("Window 2"), capacity (seats)
   - Add one more · duplicate · remove
4. **Do you do takeaway? Delivery?** → toggles that create the virtual lanes.
5. **Service charge %** — already built.

Rules that keep it safe: a table with an open bill cannot be deleted (offer "close the bill first"); removing a zone offers to move its tables rather than orphan them; codes must be unique per store.

**Two representations, phased:**

- **v1 — list builder.** Fast, keyboard-friendly, works on any screen, ships early. Uses `sort_order`, which already exists.
- **v2 — visual floor plan.** Drag tables onto a canvas, resize, choose round/square/booth. This is what Toast and Lightspeed sell hard, and it photographs well for investors — but it is a substantially bigger build and it is *not* required for the system to work.

**Schema note for future-proofing:** if v2 is likely, add `x`, `y`, `width`, `height`, `shape` to `positions` when convenient. v1 ignores them; v2 needs them. Cheap now, awkward later.

### 4.7 The order surface and the action bar

Reuse the register's catalogue and cart. What changes in table mode is the **bottom action bar**, which should read:

`Send` · `Print bill` · `Split` · `Move` · `Pay`

with **Send** as the primary. Borrowing Toast's distinction is worth it: `Send` fires and returns you to the floor (the common case — you've taken the order, go serve someone else), while a secondary `Send & stay` fires without leaving. The unsent badge on the tile is the receipt for that action, and watching it clear is the moment the system feels alive.

`Hold` should not appear in table mode at all. The table is the hold.

### 4.8 Seats and coursing — deliberately later, and off by default

Per-seat ordering and courses (starters → mains → desserts, fired in waves) are what separate casual dining from fine dining software. They're also the fastest way to make a café's staff hate your product.

Recommendation: build them as **opt-in, off by default**, exactly as Toast does (`Required / Optional / Off`). Phase them after the floor builder and states ship. The KDS already supports bump/recall, which is the hard half of coursing.

### 4.9 Server assignment

Add `assigned_user_id` to the occupancy (or a light assignment table). Tile shows initials + colour. Filter: "my tables". Managers get "all tables". This is small to build and disproportionately loved.

### 4.10 Reporting you get almost free

You already store `opened_at` and `closed_at` on every occupancy. That gives you, at nearly zero cost:

- **Table turn time** — average minutes per table, by zone, by hour
- **Covers per shift / per server**
- **Average spend per cover**
- **Dead tables** — which tables underperform

Restaurant owners care about turn time the way retailers care about margin. Surfacing it is a strong differentiator and it's mostly a query, not a feature.

---

## 5. Why this is compelling to a restaurant owner (and an investor)

The demo, in order:

1. **Open on a living floor.** Timers running, colours meaning something, two tables visibly escalated — "those two need a server right now."
2. **Tap a table.** The same catalogue they already learned on the counter. Add three items. Press Send. Return to floor. The unsent badge clears; the kitchen screen lights up.
3. **Split a bill** in two taps, settle half, floor updates.
4. **Flip to Counter**, ring a takeaway coffee, flip back. Same product, same payment engine.
5. **Open Settings → Floor plan.** Add a table live, in five seconds. "You are not locked into how we think your restaurant is shaped."
6. **Show turn time.** "Your terrace turns in 52 minutes, your window tables in 81."

The claim that holds all of it together: *one system, one catalogue, one ledger — whether you sell across a counter, to a table, or to a driver.* Most competitors sell restaurants a restaurant product and retailers a retail product. You have an accounting-grade ERP underneath both, which is a real advantage worth saying out loud.

---

## 6. Suggested phasing

Not an implementation plan — a shape for one.

| Phase | What | Why here |
|---|---|---|
| **1** | Floor Builder (zones, bulk table create, edit/remove) + Settings → Floor plan | Nothing else is usable without it; it's the stated gap |
| **2** | Floor-as-home layout, restyled tiles, derived state ladder + escalation | This is what makes it feel designed |
| **3** | Takeaway / delivery lanes | Completes the service-type story |
| **4** | Server assignment + "my tables" | Small, high love |
| **5** | Turn-time and covers reporting | Nearly free, high pitch value |
| **6** | Seats + coursing, opt-in | Fine dining tier |
| **7** | Visual drag floor plan | Sales asset, biggest build |

---

## 7. Decisions I need from you

1. **Visual floor plan** — v1 list only, or do you want the drag-and-drop canvas in scope from the start? *(recommendation: list first, canvas at phase 7)*
2. **Seats and coursing** — in scope now, or opt-in later? *(recommendation: later, off by default)*
3. **Handhelds.** Will servers take orders on phones or tablets on the floor? This materially changes the layout priorities — if yes, the order surface needs a genuine one-hand portrait mode and that should be designed now rather than retrofitted.
4. **Reservations** — do you want booking (reserve a table for 8pm) in v1, or is the Reserved state enough for now?
5. **Server assignment** — should it use existing staff logins and permissions, or a lighter "who's on shift" concept?
6. **Naming.** The code currently says "Service style / Table service", which matches Toast, Square and Lightspeed terminology. I'd keep it. Confirm you're happy, or pick your own word.

---

## Sources

- [Manage Tables With Toast POS](https://support.toasttab.com/en/article/New-POS-Managing-Tables)
- [Manage Orders With Toast POS — ordering screens](https://support.toasttab.com/en/article/New-POS-Experience-Ordering-Screens)
- [KDS workflow using course pacing — Toast platform guide](https://doc.toasttab.com/doc/platformguide/platformKDSWorkflowUsingCoursePacing.html)
- [Set up coursing for checks — Square Support](https://squareup.com/help/us/en/article/7748-coursing-with-square-kds)
- [Adding orders in Table Service mode — Lightspeed Restaurant K-Series](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360051089273-Adding-orders-in-Table-Service-mode)
- [Restaurant Floor Plan Templates — Toast](https://pos.toasttab.com/resources/restaurant-floor-plan-templates)

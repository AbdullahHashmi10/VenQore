# VenQore — Navigation, POS & Document Editor Spec

**Companion to `VENQORE_LAYOUT_LAW.md`.** The Layout Law says how big things are.
This says what the three most-complained-about screens actually contain.

Written against a full read of the current code: `Pos.jsx` (3,743 lines),
twelve document create/edit screens (2,427–4,318 lines each), and
`OneGlanceLayout.jsx` (1,912 lines).

---

## 0. Read this part first — a live crash

While inventorying the shell I found a production crash, unrelated to layout, that
should be fixed before any of this ships.

`app/Services/Dashboard/DashboardRegistry.php:18-30` defines `SIZES` with keys
`'2x4'…'8x8'`. Every widget declares `'sizes' => ['small','medium']` and
`'default_size' => 'small'`. Both call sites do:

```php
$dimensions = static::SIZES[$size] ?? static::SIZES['small'];   // :363, :411
… $dimensions['w']                                              // :417-418
```

`SIZES['small']` does not exist either, so `$dimensions` is `null` and the next
line throws. This fires on `store.workspace` for any user whose
`experience === 'new'` — and `Appearance::NEW_EXPERIENCE_ENABLED` is currently
**`true`** (`app/Support/Appearance.php:83`), despite the comment at
`routes/web.php:1036` claiming the feature is hidden.

`app/Reckoner/DashboardSanitizer.php:100` has the same key set with **no `??`
fallback at all**. The client mirrors it: `Pages/Workspace/Dashboard.jsx:196`
does `sizePresets[size] || sizePresets.small` → `undefined`, then reads `preset.w`.

**Fix:** make the widget `sizes` vocabulary and the `SIZES` map agree — and since
the Layout Law now defines the size vocabulary, express both as category ids
(`C1`–`C6`) rather than a third naming scheme.

---

## 1. The sidebar — pin pushes, peek overlays

You asked whether opening the sidebar at 1280 should reflow the cards or overlay
them. I computed the cost of expanding at every width first, because I expected a
clean threshold. **There isn't one** — the cost oscillates with the column boundary:

| Viewport | Rail (72) | Expanded (264) | Cost of expanding |
|---:|---|---|---|
| 1024 | 8 × 92 | 8 × 68 | same card count |
| 1180 | 8 × 112 | 8 × 88 | same card count |
| 1265 | 8 × 122 | 8 × 98 | same card count |
| **1351** | 10 × 102 | 8 × 109 | **loses 2 columns** |
| **1425** | 10 × 109 | 8 × 118 | **loses 2 columns** |
| 1521 | 10 × 118 | 10 × 99 | same card count |
| **1905** | 14 × 105 | 12 × 111 | **loses 2 columns** |
| 2545 | 18 × 112 | 16 × 117 | loses 2 columns |
| 3425 | 24 × 115 | 24 × 107 | same card count |

Boundaries where the answer flips: **1305 · 1497 · 1580 · 1772 · 1854 · 2046 · 2127…**

A width threshold would therefore be arbitrary. So the rule is about **intent**, not width:

> **PEEK overlays. PIN pushes.**
>
> - **Peek** — transient. Scrim, `z-index: 520`, closes on navigate / Esc / scrim click.
>   **Content never moves.** Available at *every* width, including 360px.
> - **Pin** — the user's persisted choice. Content reflows **once** and stays.
>   Available only where the content survives it.

Why this is the right cut: a user who opens navigation at 1280 is going somewhere.
Reflowing an entire dashboard for a two-second glance is expensive and jarring.
A user who *pins* the sidebar has decided it is furniture they work beside — and a
one-time reflow is the honest consequence of a choice they made and can undo.

### 1.1 The four states

| State | Width | Available from | Behaviour |
|---|---|---|---|
| `hidden` | 0 | every width | content full width |
| `rail` | 72px | ≥ 1024 | pushes, icons only, tooltips portalled |
| `expanded` | 264px | ≥ 1280 | pushes, labels visible |
| `peek` | 264px overlay | **every width** | overlays, scrim, auto-closes |

Pin is unavailable below 1280 because expanded at 1180 leaves an 88px column —
exactly on the floor — and at 1100 leaves 78px, which is below it. The rail *is*
the answer to a narrow screen; a narrow sidebar is not.

### 1.2 One control, at every width

A single toggle lives in the header at **every** viewport — this was your ask and
it is now unconditional. Its behaviour:

```
click toggle:
    states ← [hidden] + [rail if ≥1024] + [expanded if ≥1280]
    if states.length > 1:  cycle to the next pinned state   (push, remembered)
    else:                  toggle peek                       (overlay, transient)
```

At 390px there is one state, so the button peeks. At 1905px it cycles
hidden → rail → expanded. **Long-press, or the keyboard shortcut, always peeks**,
at any width — so a user on a 1920 screen with the sidebar hidden can glance at
navigation without disturbing their layout.

### 1.3 Per-screen defaults

A route archetype may declare a preferred default. The user's explicit choice on
that screen overrides it and is remembered **per screen**, not globally.

| Screen | Default | Why |
|---|---|---|
| Dashboard, lists, reports | `expanded` ≥1280, else `rail` | navigation is furniture here |
| Settings | `rail` | the subnav is the navigation that matters |
| **POS** | **`hidden` at every width** | the register is a full-attention surface |
| **Document editor** | **`rail`** | you navigate away far less often than you scroll |

**POS gets an explicit exit control** (`⎋`, top-right of its own header) because
hiding the sidebar removes the only other way back. This was your specific ask and
it is a hard requirement, not a nicety: never hide the primary navigation without
providing a labelled way out in the same region.

### 1.4 What must change in the code

`OneGlanceLayout.jsx:79` declares a `defaultCollapsed` prop. `Pages/Pos.jsx:3736`
passes it. **It is never read** — `isSidebarOpen` is unconditionally
`useState(false)` at `:178`. POS does not currently get the collapsed sidebar it
asks for, and no screen's sidebar state survives a navigation.

Three fixes, in order:

1. Read `defaultCollapsed`, or delete the prop. Passing a prop nothing reads is
   worse than not having it.
2. Persist state in `user_preferences` (`UserPreference::resolve/put`), keyed
   `nav.sidebar.<archetype>`. That table already exists and its migration comment
   (`2026_08_08_000001…:16-21`) explicitly says it is the generic home for exactly
   this kind of dial. `PlatformLayout` already persists via `localStorage['vq_sidebar']`;
   the 116-page layout persists nothing. Use the server table, not localStorage —
   `AppearanceContext.jsx:20-26` documents why localStorage was abandoned:
   *"the same account looked different on the counter terminal and the office laptop."*
3. Replace the hard-coded `w-[280px] / lg:w-[88px]` at `:951` with the law's
   tokens. Note 280/88 also contradicts the active theme's own
   `--vq-layout-sidebar-width: 16rem` (256px), which is defined and used by **zero** files.

### 1.5 Four mobile thresholds must become one

The app currently uses **1024** (Tailwind `lg`, 508 usages), **1023**
(`OneGlanceLayout.jsx:907, :1890`), **920/921** (`PlatformLayout.jsx:362,369`) and
**900** (`Workspace/Overview.jsx:265`). Four numbers meaning "mobile" guarantees a
band where two of them disagree. The law's boundaries — **599 / 1024 / 1280** — replace all four.

---

## 2. Dashboard edit mode

You already have this, twice, and neither generation knows about the other.

| | `Pages/Dashboard.jsx` (608 lines) | `Pages/Workspace/Dashboard.jsx` (495) |
|---|---|---|
| Grid | `react-grid-layout`, 12 cols, `rowHeight 80`, `margin [16,16]` | `react-grid-layout` lazy, `ROW_HEIGHT 84`, `margin [16,16]` |
| Breakpoints | none (fixed width from `useMeasure`) | `lg:1024 / md:768 / sm:0` → 12 / 6 / 1 cols |
| Drag / resize | ✅ free | ✅ preset sizes |
| Persistence | `PUT /api/dashboards/{id}/layout`, **manual Save** | `POST workspace.layout.save`, **700 ms debounce** |
| Lock / publish to role | ✅ | ❌ |

`react-grid-layout ^2.2.3` is already a dependency. No `@dnd-kit`, no
`react-beautiful-dnd`. **Keep it.** The structural work is not adding a library —
it is making the grid it drives obey the Layout Law.

### 2.1 The mapping

`react-grid-layout` takes `cols`, `rowHeight` and `margin`. The law gives all three:

```js
<ResponsiveGridLayout
  cols={{ lg: N }}                  // N from geometry(vw).cols — 8/10/12/14/16/24
  rowHeight={64}                    // --vq-row
  margin={[24, 24]}                 // --vq-gutter, BOTH axes
  containerPadding={[0, 0]}         // the page margin is the shell's job
  compactType="vertical"
  isBounded
/>
```

With `margin = [24,24]` and `rowHeight = 64`, RGL computes a 2-row item as
`2×64 + 1×24 = 152px` — **the same formula as the law**, natively. The two systems
already agree; today's `rowHeight: 80 / 84` and the two different row heights are
the only thing standing between them.

### 2.2 Edit mode rules

1. **Resize handles snap to category fits, not to free pixels.** Dragging a `C3
   Metric` offers `4×3 / 3×2 / 2×2 / 2×3` and nothing between. This is what makes
   a user-resized dashboard still obey the floors — the user cannot drag a card
   below its content floor because that size is not offered.
2. **`minW` / `maxW` / `minH` / `maxH` come from the category**, passed per item.
   RGL enforces them during the drag, so the illegal state is never reachable.
3. **Cards never reorder on breakpoint change** — only reflow. RGL's
   `compactType="vertical"` plus stable `i` keys gives this.
4. **Edit mode is a mode.** Drag handles and remove buttons exist only inside it
   (`Workspace/WidgetCard.jsx:56-70` already does this — keep that pattern).
5. **Autosave, debounced.** The Workspace generation's 700 ms debounce is correct;
   the Composition generation's manual Save button is not. A user who drags a card
   and navigates away should not lose it.
6. **Adding a card is picking a category and a metric.** The Reckoner catalogue
   (`ReckonerRegistry.php`, 25 metric keys) supplies the metric; the law supplies
   the size. The user never types a dimension.

### 2.3 What to consolidate

`DashboardController::fullDashboard()` computes **15 Inertia props**
(`:548-575` — including an `AiRecommendation` query, P&L summary and bank/cash
aggregation) on every single load. `Pages/Dashboard.jsx:26` reads
`{ auth, store }` and **ignores all fifteen**, fetching everything over
`/api/reckoner/read` instead. That is a full dashboard's worth of database work
thrown away on every page view.

---

## 3. POS

### 3.1 The real diagnosis

"Too overwhelming" is measurable. Default desktop state, one tab, no dropdowns
open, discount permission granted:

| Region | Clickable targets |
|---|---:|
| Top tab bar | 7 (+3 status) |
| Left: quick-add, search, chevrons, "All" + ~12 category chips | 17 |
| Product list rows | 50 |
| Cart header + 3 lines × 5 controls | 16 |
| Payment column | 13 |
| Sidebar | ~12 |
| Bottom shortcut strip | 10 |
| **Total** | **≈125 (≈103 clickable)** |

An **empty cart still shows ~100**.

**The fix is not a new layout.** A different arrangement of 103 controls is still
103 controls. The fix is a default that hides most of them behind intent, and
*then* a layout choice on top. Hence two independent axes:

- **Density** — `Essential` (default) vs `Pro`. This does the heavy lifting.
- **Layout** — six arrangements. This is the preference you wanted to offer.

Measured in the prototype: **Essential = 47 visible controls. Pro = 73.**
Against ~125 today, Essential is a **62% reduction** with nothing deleted.

### 3.2 The six layouts

| # | Name | Picker | Best for | Split @ 12 cols |
|---|---|---|---|---|
| 1 | **Counter** | left column, list | mixed browse + scan, few hundred SKUs | 4 / 5 / 3 |
| 2 | **Shelf** | top rows, large tiles | small stable inventory the cashier knows by sight | full-width picker, then 9 / 3 |
| 3 | **Scan** | none — hero search only | large inventory, nobody browses | hero bar, then 9 / 3 |
| 4 | **Touch** | dominant, big tiles | tablet on a counter, gloves or wet hands | 7 / 5 |
| 5 | **Ledger** | narrow right | wholesale / B2B, 40-line negotiated sales | 8 / 4 |
| 6 | **Compact** | tabbed | phone, small tablet | 1 col, 3 tabs |

Every layout below 600px collapses to Compact regardless of choice — that is the
law, not a per-layout decision.

**Layouts 2, 3 and 4 are the answer to your specific question.** You described
seeing people use a top-row picker for small inventories and rely on scanning for
large ones. Shelf is the first, Scan is the second, and Touch is the tablet case
where the picker *should* dominate.

### 3.3 Density is a stored preference, not a mode toggle

`Essential` is the default for a new store. `Pro` is opt-in, remembered per user
in `user_preferences` under `pos.density`. A cashier hired next month gets
Essential; the owner who has used the product for a year keeps Pro. This is the
mechanism that lets one product serve both without either feeling wrong.

### 3.4 Parity checklist — nothing may be lost

`e` visible · `p` one tap behind a disclosure · `x` deliberately removed.

| Control | Essential | Pro | Note |
|---|---|---|---|
| Barcode scan (Enter, ≥4 chars) | e | e | |
| Text search (300 ms debounce) | e | e | |
| Category filter strip | e | e | |
| Product list / tile grid | e | e | |
| Combobox dropdown ↑↓ | e | e | |
| Variant picker modal | p | p | |
| Quick Add Product (7-tab) | p | e | |
| **Favourites / quick keys** | p | p | **NEW** — absent today |
| **Weight scale** | p | p | **NEW** — `useWeightScale` exists in `AMDStation.js:455`, never called |
| Qty ± stepper | e | e | |
| Qty exact / price override / converter | p | e | was F2 / F5 / ⇄ |
| Line discount fixed + % | p | e | |
| Free quantity (BOGO) | p | e | |
| Delete line | e | e | |
| Over-stock badge | e | e | |
| Margin % | **x** | e | Essential hides cost from cashiers. Pro **+ permission** only |
| Wholesale auto-price | e | e | silent |
| **Per-line note** | p | e | **NEW** — absent from every screen |
| **Batch / expiry on a POS line** | p | e | **NEW** — existed only in Goods Receipt |
| Amount tendered + Exact | e | e | |
| Change due / shortage | e | e | |
| Tenders: cash/card/bank/online/UPI/credit | e | e | **one list** — was 5 inline vs 6 in the modal |
| Split payment | p | e | |
| Deposit-to account | p | e | |
| Overpayment → change vs ledger | p | p | |
| Tax inclusive/exclusive + rate | p | e | |
| Global discount | p | e | |
| Dropship toggle | **x** | e | irrelevant to >95% of sales |
| Auto-print toggle | p | e | |
| Rounding | e | e | silent, from settings |
| Multi-tab parallel sales | e | e | |
| Hold / park / recall | e | e | |
| Recent invoices + reprint | p | e | |
| Return mode (3 sub-modes) | p | e | |
| Offline queue + sync hub | e | e | badge only when count > 0 |
| Cart rescue | e | e | silent |
| Senior mode 125% | p | p | moves to Settings |
| Customer select / walk-in / quick add | e | e/p | |

### 3.5 Removed on purpose — these are bugs, not features

Carrying these forward carries the bug.

| Removed | Why |
|---|---|
| `F6` "Change Unit — coming soon" | Dead toast. Replaced by a real unit-conversion control at Pro |
| `F10` "Loyalty not configured" | Dead toast. Ship loyalty or don't bind the key |
| **`F8` Additional Charges** | Accepts input, toasts success, and is **never summed into any total** (`Pos.jsx:942`). A confirmation that lies |
| **`F9` Bill Discount** | Writes `discount`, but `globalDiscount` reads `discountValue` first — **silently ignored** |
| `Ctrl+R / Ctrl+F / Ctrl+P / Ctrl+D` | Hijacked browser reload, find, print and bookmark. Move to `Alt+` |
| Type-anywhere → search box | `Pos.jsx:1856` swallowed every printable keystroke page-wide |
| Invisible `F2`–`F5` target | Acted on `lastAddedItemId` with **no selection indicator**. Now a visible selected row |
| `Cancel` with no confirm | Sat beside `Hold` and wiped the cart silently |
| Long-press discount presets | A 500 ms undiscoverable gesture. Now an explicit edit affordance |

Two payment vocabularies also merge: the inline selector offered 5 tenders, the
split modal offered 6 including "UPI / QR" (`PaymentModal.jsx:51`). Same sale, two
mental models. **The modal's list wins** — it is the superset.

---

## 4. The document editor

### 4.1 One screen, twelve types

Today: **twelve create/edit screens**, eight of which are copy-paste forks of one
2,427–4,318 line file. `Sales/CreatePreSale.jsx` (2,427 lines) is a **full
duplicate** of `SalesOrders/CreatePreSale.jsx` hitting the same endpoints — it can
be deleted outright.

The unified editor is one layout driven by a capability config:

```js
SI: { party:"Customer", num:"Invoice #", action:"Complete sale", sign:"out",
      cap:{ lines:1, freeQty:1, lineDisc:1, linePct:1, taxSelect:1,
            delivery:1, extras:1, paid:1, terms:1, deposit:1, cheque:1, dueDate:1 } }
```

**The layout never changes. Only the capabilities do.** Switch type and fields
appear and disappear in place. That is what lets one screen replace twelve — and
why a thirteenth document type is a config entry, not another 3,000-line file.

### 4.2 Same field, different word — one label map

| Canonical | SI | SO/QT/PR | PO | PI | SR | DN | EX |
|---|---|---|---|---|---|---|---|
| `party` | Customer | Customer | Supplier | Supplier | Customer | Supplier | Payee |
| `doc_number` | Invoice # | Invoice # | PO # | Purchase # | Return ref | Reference # | Reference no. |
| `global_discount` | Invoice Discount | Invoice Discount | Invoice Discount | Header discount | Return Discount | — | — |
| `amount_settled` | Amount Paid | Amount Paid | Amount Paid | (by method) | Refund Amount | Refund Received | — |
| `balance` | Balance Due | Balance Due | Balance Due | Payable | Balance Due | Net Credited | Total Payable |
| `notes` | notes | notes | notes | Notes | notes | reason | Description |

### 4.3 Genuinely type-specific — real capability, not a label swap

- **PO** — `Prices include tax`, `RECEIVED / ORDERED`, `expected_delivery_date`
- **PI** — `Business %` per line, **landed costs** (category / amount / allocate by value-or-quantity), manual round-off, supplier's own reference separate from our number, goods status, zero-cost acknowledgement
- **GR** — **batch # and expiry per line** (the only screen in the app with them), ordered/received/remaining
- **PRet** — mandatory reason, per-batch remaining qty and batch unit cost
- **PR** — `valid_until`, draft/sent/accepted/declined, **dual** convert targets
- **SO** — convert to sale, stock *reservation* semantics
- **RI** — warehouse, frequency, next run date, active/paused
- **EX** — **no line items**, expense category with inline create, file attachment, absolute tax amount
- **SI** — tax-rate dropdown from `settings.tax_rates`, overpayment change-vs-ledger, posted-immutability lock

### 4.4 Four density modes

| Mode | Visible fields | For |
|---|---:|---|
| **Guided** | 6 | first invoice, occasional users — 4 steps: Who → What → How much → Confirm |
| **Simple** | 9 | the "less buttons" option you asked for |
| **Standard** | 18 | default |
| **Pro** | 21 + all actions expanded | 100 documents a day, keyboard-first |

### 4.5 Bugs the unified editor must not inherit

Verified in the code, not inferred.

| Bug | Where |
|---|---|
| **SO, PR, RI collect delivery, extras, free qty, amount paid, payment method, terms and cheque — then drop them from the payload** | `SalesOrders/CreatePreSale.jsx:850-869`, `Proposals/Create.jsx:980-999`, `RecurringInvoices/Create.jsx:846-866` |
| **`notes` and `due_date` are posted on SI/SR with no input anywhere** | `Sales/CreateInvoice.jsx:995,998` |
| **`valid_until` posted from `dueDate`; no UI field exists** | `Proposals/Create.jsx` |
| **`warehouse_id` is server-`required` on PO but has no input** — silently defaults to `warehouses[0]` | `PurchaseOrders/Create.jsx:822-824` |
| **DN's discount and refund inputs exist only in the mobile bar** — desktop cannot enter them | `DebitNotes/Create.jsx:1890-1912` |
| **Returns is create-only** — "edit" always POSTs a new return | `Returns/Create.jsx:904` |
| **Only SI reads `settings.tax_rates`** — every other screen makes the user retype a bare percentage | |
| **Three plan gates are dead** — duplicate route registrations later in the file win | debit-notes `1457` vs `1777`; recurring-invoices `1441` vs `1746`; proposals `1144` vs dup |
| Print is a stub | PO: *"Printing not configured for PO yet."* · DN: `abort(501)` at `web.php:1869` |
| SR validation copy still says *"before processing the sale"* | `Returns/Create.jsx` |

The dead plan gates are a **revenue** bug, not a layout one: `b2b_proposal_builder`,
`debit_credit_notes` and `recurring_invoices` are all currently free.

---

## 5. Build order

Each step is independently shippable and none leaves the app broken.

1. **Fix the `DashboardRegistry::SIZES` crash** (§0). Half a day, unblocks the new experience.
2. **Land the Layout Law tokens + engine.** Nothing changes visually.
3. **Sidebar law** — one control at every width, pin/peek, persisted in `user_preferences`. Fixes the dead `defaultCollapsed` prop and the four mobile thresholds.
4. **POS Essential density** on the existing layout. This alone addresses the feedback — no new layout required. Ship it and measure before building the other five.
5. **POS layouts 2–6**, behind a per-user preference, with a first-run picker.
6. **Unified document editor**, one type at a time. Start with SI (highest volume), then PI, then the returns. Delete `Sales/CreatePreSale.jsx` on day one — it is a pure duplicate.
7. **Dashboard edit mode** on the law's grid, consolidating the two existing generations into one.

Step 4 is the one that answers the actual complaint. Do it first and separately,
so you learn whether density or layout was the real problem before building five
more layouts on an assumption.

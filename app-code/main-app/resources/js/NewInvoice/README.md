# New invoice — one editor, thirteen documents

`/new-invoice` · `resources/js/Pages/NewInvoice.jsx` · `App\Http\Controllers\NewInvoiceController`

The document editor from `extras/Layout Law/venqore-document.html`, built as a
real page — the same move as `/new-pos`, on the other working surface. **It is a
structure exercise.** Nothing here touches the server; every product, party,
term, account and location comes from `mock.js`. Saving shows the toast it would
show and prints the payload it would send.

Sales invoice is what it opens on. The other twelve are one tap away, because
the whole point is that a type is a *configuration*.

---

## The shared law

Both working surfaces read **one** law file and **one** engine:

```
resources/js/LayoutLaw/law.js      the trimmed Layout Law v2.0 — LAW.pos + LAW.document
resources/js/LayoutLaw/engine.js   composeTerminal() and composeDocument()
resources/js/LayoutLaw/ui.jsx      the shared primitives, namespaced by `ns`
```

A second copy of the law is exactly the failure the law exists to prevent, so
there is one. `resources/js/NewPos/` and `resources/js/NewInvoice/` hold only
what is specific to each surface.

## The files

| File | What it is |
|---|---|
| `fields.js` | **A type is a configuration.** Label overrides, capability switches, the header and capability field catalogues, the column filter — and `buildPayload()`, the ONE payload builder. |
| `mock.js` | Sample data. `partiesFor(side)` is the fix for every picker asking `type=all`. |
| `settings.js` | Preferences, Auto, and per-user-per-device persistence. |
| `zones.jsx` | Details, Lines, Summary, the dock and the splitter — all at module scope, so typing in a cell does not remount the table. |
| `sheets.jsx` | Party, item, type, source document, breakdown, payload, totals, keymap, actions, recent, palette, nav. |
| `SettingsDrawer.jsx` | The composer + the operational settings. |
| `newinvoice.css` | Scoped under `.nqd`. Every value is a V6 token; the box heights come from the law. |

## How the layout is decided

```js
const D = composeDocument(prefs.comp, window.innerWidth, window.innerHeight);
```

`D` says whether the details block is open or a strip, how wide the line table
is and which of its four fits it gets, where the summary lives and what it does
while you scroll, which density the width can carry, how tall the dock is — and
what is still reachable. **`Settings → Arrange` prints `D` verbatim**, so when a
screen does something surprising the law explains itself.

Three things in it are derived rather than chosen, and all three came out of the
sweep rather than out of taste:

1. **"Dock the summary while I scroll, especially on Pro" is a HEIGHT rule.**
   Holding a panel still only works if the whole panel fits on screen; a sticky
   thing taller than its viewport still scrolls, it just scrolls late. And the
   summary's height *is* its density — the density list is literally the list of
   summary rows: 3 for Simple, 7 for Standard, 10 for Pro. So Pro is the first
   density that stops fitting, and the law names it without being told to. On a
   1920×1080 the Pro column is 419px against 404px of room; on a 2560×1440 it
   fits again and pins itself.
2. **The nav holds the rail wherever expanding it would cost THIS composition a
   fit.** 1708px was derived from the *default* zone weights; at 1708 a Pro
   ledger with a 32% summary lost its tenth line column the moment the nav
   expanded. Buying a bigger screen made the invoice worse. The pill in the
   header says when it is holding.
3. **The dock is a row, not a float.** Its height is taken out of the scroller
   before anything else is measured, so it cannot cover the last line the way
   the register's floating browse button covered the payment panel.

**Density is the only thing a width may veto. It may never veto a capability** —
a field this type collects is collected at every size.

## Auto

`Settings → Arrange → Auto`. You pick how you work, once — Balanced, Items
first, Accounting, Touch — and the law picks the arrangement for the screen.

| Profile | Desktop | Wide + short | Tablet | Phone |
|---|---|---|---|---|
| Balanced | Side panel | Wide lines | Stacked | Touch |
| Items first | Wide lines | Focus | Focus | Touch |
| Accounting | Pro ledger | Wide lines | Stacked | Touch |
| Touch | Touch | Touch | Touch | Touch |

Auto decides **geometry only**. The density comes from the DOCUMENT — a purchase
bill asks for Pro, an expense for Simple — because a screen size should not
decide what a document is. Only the Accounting profile raises it.

## Departures from the reference

- **"Subtotal" means one thing on the screen.** The reference's summary called
  the gross "Subtotal" while its breakdown called the net-of-item-discounts
  figure "Subtotal" too — two definitions of one word two inches apart. Here it
  is the gross, in both.
- **Anything the density does not itemise is folded into the subtotal, visibly.**
  Standard has no Delivery row and no Round off row, so a delivery charge and a
  rounded total both used to sit in the total with nothing on screen accounting
  for them — the seven rows summed to 142,753.10 under a total that printed
  142,753.00. The row now names what it is carrying ("Subtotal incl. charges",
  "incl. rounding", "incl. charges & rounding") and hovering it says how much.
  **The rows sum to the total, to the paisa, at every density.**
- **A `no_lines` type does not delete the lines.** Switching a ten-line invoice
  to Expense used to empty it, so a mis-tap in a thirteen-item list threw the
  document away and switching back gave you a blank one. The lines stay in
  state; `computed` and `buildPayload` are the two places that decide whether
  they count, and for a `no_lines` type neither does. An expense's tax is now
  the amount that was typed, which is the only number it could be — deriving it
  from a percentage of no lines meant the Tax amount box moved nothing.
- **A rule is shown on the attempt, not on arrival.** Every required field is
  empty the moment a type is chosen. The rules run continuously — they gate the
  primary from the first keystroke — and they turn red when you press it. The
  flag lives on the document, so it survives a tab switch and a new tab is clean.
- **Dates are a type.** `kind: 'date'` fell through to a plain text box, so
  eight fields accepted "next tuesday" and the terms effect handed that to
  `addDays`, which printed `NaN undefined NaN` into Due and posted it. They are
  `<input type="date">` now, `parseDate` refuses a date that is not one (31 Feb
  included), and the payload leaves as `YYYY-MM-DD`.
- **A `<select>` hands back the option's own type.** The DOM always returns a
  string, so a numeric id stopped being a number the moment it was chosen:
  `doc.location === doc.locationTo` could never be true once either was touched
  — a stock transfer from Main to Main passed validation — and `warehouse_id`
  posted `"2"` where the server wants `2`.

Also: **the keymap guard is narrower than "inside a field".** On a document the
caret lives in a field almost all of the time, so suspending the map whenever
`activeElement` is an input suspends it always. A *sheet* suspends the map — that
is what the original defect was about, F-keys firing from inside a modal's
inputs. Function keys and Ctrl-combos never collide with typing; only the
single-character shortcuts (`?`) check.

## The seventeen

Every defect the inventory found across the thirteen screens is answered here
and marked `FIX:` in the code:

| Defect | Answer |
|---|---|
| Notes in six payloads, no textarea on any screen | Resident on every type, one payload path |
| The terms select never submitted; `dueDate` written by no input | Terms **writes** the due date; the date stays editable |
| Quotation has no Valid Until input | Required on quotation, absent everywhere else |
| Purchase order needs `warehouse_id`, renders no input | Location is resident wherever the server needs one |
| Quotation drops seven collected fields | One payload builder for all thirteen |
| Sales order sends five keys its controller ignores | Same builder, same contract |
| Debit note never sends `warehouse_id` | Location resident, so the restock guard is reachable |
| Sale return hard-codes the warehouse and zeroes tax | Location resident; collected totals are posted totals |
| Only the sales invoice reads `settings.tax_rates` | Every type reads the same source |
| Only two of thirteen apply `roundTotal()` | Round-off is a document property, applied once |
| Free quantity reaches the DB from 2 of 7 sell types | On or off, never half — and the column follows |
| Every picker but V3 Purchase asks `type=all` | Party type is derived from the document's side |
| No email/WhatsApp/PDF/duplicate/record-payment on any editor | All of them are document actions, on the document |
| The F-key map exists only in `Pos.jsx` | One scoped keymap, shared by both surfaces |
| No UoM, batch, HSN, per-line note anywhere on the sell side | Pro density exposes them; `sale_uom` is in the payload |
| No currency, FX, project or cost centre on any screen | Pro density carries them |
| `Sales/CreatePreSale.jsx` is a live stale duplicate | One editor. There is nothing left to duplicate |

## Two things the settings switch that used to switch nothing

- **Show margin.** Cost travels with the line (`cost` is copied off the product
  and posted as `cost_price`), so this is a real number. It sits in the **Items
  zone header** — never in the summary, whose row list is what the law measures
  the column's height from — and in the breakdown. Sell side only, behind
  `documents.price_override`, and **free quantity counts as cost**, which is
  precisely the case a margin read-out exists to catch.
- **The attachment control.** It was a button wired to an `onOpen` only the
  source-document field was ever given, so the one type whose whole point is the
  receipt had a control that did not respond to being pressed. It is a real
  `<input type="file">` behind its label — the picker, the keyboard and the
  focus ring are the platform's.

## Accessibility that the markup was promising and not keeping

- `aria-modal="true"` is a promise that focus cannot leave. Tab used to walk
  straight out of the back of an open sheet onto the page behind it, which the
  same attribute had just told a screen reader was not there. `Sheet` traps it
  now — shared, so the register got the fix too.
- The faded dock kept two focusable buttons at `opacity: 0`: two tab stops onto
  a button nobody can see, and a Save announced from a bar that is not there.
  `visibility: hidden` (transitioned discretely so neither direction is cut
  short) plus `inert`, set as a DOM property because the two React majors
  disagree about how to spell a boolean attribute in JSX.

## Wiring it to real data

1. Take the props the existing editors assemble — parties typed by SIDE,
   warehouses, accounts, tax rates from `settings.tax_rates`, the recalled doc.
2. Point the item picker at `GET /api/pos/search?q=` and `/api/pos/featured`.
3. Post `buildPayload()` to the V3 endpoint for the type. It already emits
   `items.*.sale_uom`, which `StoreSaleRequest` requires and no shipped screen
   collects.
4. Move the composition into `settings` under `document_composition`, per user.

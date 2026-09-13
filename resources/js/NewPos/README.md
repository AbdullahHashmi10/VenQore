# New POS — the composed register

`/new-pos` · `resources/js/Pages/NewPos.jsx` · `App\Http\Controllers\NewPosController`

This is the register from `extras/Layout Law/venqore-pos.html`, built as a real
page instead of a device-frame simulation. **It is a structure exercise.**
Nothing here touches the server: every product, customer, parked sale, recent
invoice and queued sale comes from `mock.js`. Completing a sale shows the toast
it would show and clears the tab; it posts nothing.

The point is to settle the shape, the composer and the settings *before*
attaching data, so that attaching data is a swap and not a rewrite.

---

## The files

| File | What it is |
|---|---|
| `law.js` | **Generated.** The slice of Layout Law v2.0 the terminal reads. Do not hand-edit the numbers — a hand edit is a number that silently disagrees with the solver. |
| `engine.js` | The layout engine, ported from `venqore-layout-engine.js` with the dashboard-card and document solvers removed and every DOM touch stripped. Pure, so it can be called during render and unit-tested. |
| `settings.js` | The preferences model, Auto, and localStorage persistence (per user **and** per device). |
| `mock.js` | Sample data. Field names match the live payload. |
| `ui.jsx` | Shared pieces — `Money`, `Pane`, `Sheet`, `Stepper`, `Splitter`, `RowButton`, the settings controls. |
| `sheets.jsx` | Every non-resident capability: line editor, customer, parked, recent, returns, quick-create, offline hub, keymap, breakdown, discount, charges, notes, split payment, overpayment, command palette. |
| `SettingsDrawer.jsx` | The composer + the rank-3 operational settings. |
| `newpos.css` | The register's stylesheet, scoped under `.nqp`. Every value is a V6 token. |
| `../Pages/NewPos.jsx` | The page: state, the keymap, and the assembly of whatever the engine returned. |

## How the layout is decided

Nothing in `NewPos.jsx` picks a breakpoint. Once per render:

```js
const T = composeTerminal(prefs.comp, window.innerWidth, window.innerHeight, { rail });
```

`T` says where the catalogue lives and how wide, what fit each pane gets, what
falls to the dock, how tall the dock is, how many cart lines survive, and — as
an asserted property, not a hope — what is still reachable. The page draws that
and nothing else. **`Settings → Arrange` prints `T` verbatim at the bottom**, so
when a screen does something surprising the law explains itself rather than
needing to be reverse-engineered.

Three rules keep any composition honest:

1. **The floors clamp the fractions.** A percentage is a wish; the measured floor
   is the law. 20% of a screen that is below the catalogue's floor does not
   produce an unreadable catalogue, it produces no catalogue.
2. **The catalogue is always the first thing to go** — never the cart, never the
   payment panel.
3. **Nothing is ever unreachable.** Panes scroll their bodies and pin their
   chrome, and anything not resident gets a real dock *row*, never a floating
   button over the panes.

## Auto

`Settings → Arrange → Auto`. You state the **profile** once — scanner-driven,
general retail, browse-led, table service — and the law picks the geometry for
whatever screen the register is standing on, re-picking on resize. Touching any
geometry knob (including dragging a divider) drops it to Manual, with one tap
back.

| Profile | Desktop | Wide + short | Tablet | Phone |
|---|---|---|---|---|
| Scanner-driven | Scan | Scan | Scan | Counter |
| General retail | Column | Stack | Row | Counter |
| Browse-led | Grid | Stack | Row | Counter |
| Table service | Table | Table | Table | Counter |

## Two departures from the reference, both deliberate

- **The total and the change are pinned in the payment panel's footer**, not in
  its scrolling body. The reference kept them in the body; that reads fine in a
  526px column on a 1080p screen and fails completely in a 286px column on a
  695px screen, where the body is ~160px tall and the total sits below the fold
  behind two rank-2 rows. Same fix as the Scan bug, one level up: pinning the
  actions is not enough if the number they act on can still be scrolled away.
- **The rank-2 field chips sit below the rank-1 numbers**, for the same reason.

One local extension to the engine: `shell()` accepts `intent: 'hidden'`, so the
operator can put the nav rail away entirely. The hamburger still exists at every
width, so nothing becomes unreachable — which is the only reason it is legal.

**The scan box is exempt from the keymap guard.** The law says the keymap is
"suspended inside a field or sheet"; the register also parks the caret in the
scan field so a barcode scanner has somewhere to type. Taken together those two
rules kill the entire keymap: `document.activeElement` is an `<input>` at all
times, so F9 does nothing — and `Ctrl+W` reaches the *browser* and closes the tab
with the sale in it. The guard therefore reads "a field the cashier is filling
in", and the scan box, which is the surface's resting state, is not one.

## What is deliberately not here

- **No per-line tax.** Tax is a document field in the capability inventory and
  the total reads exactly one rate. A second tax input that no total reads would
  be the same defect as F8's phantom charges.
- **No decimal key on the keypad.** The tendered amount is held as a number; a
  `·` that could never produce one is a key advertising behaviour it does not
  have. `Exact` took the slot.
- **`Ctrl+T` / `Ctrl+W` / `Ctrl+N` are on the map but a browser tab keeps them
  for itself.** They work in the desktop shell. In a browser they are the one
  place the map promises more than the environment allows.
- **Sheets move focus but do not trap it.** Opening a sheet takes the caret and
  closing it hands it back; Tab can still walk behind an open sheet. Worth
  closing before this ships to a real counter.

## Wiring it to real data

1. Drop the `mock` import in `NewPos.jsx` and take the props `PosController@index`
   already assembles: `recalledSale`, `bankAccounts`, `warehouses`,
   `ecommerceChannels`, `settings`.
2. Point the catalogue at the endpoints the shipped POS already uses, so this
   page inherits the Phase 3.1 timebomb fix rather than re-loading 1,942
   products on every open:
   `GET /api/pos/featured`, `/api/pos/search?q=`, `/api/pos/barcode/{code}`,
   `/api/pos/recent-sales`.
3. Move the composition out of `localStorage` into `settings` under
   `pos_composition`, keyed per user and per terminal, so a cashier's
   arrangement follows them to another till.
4. Replace the `complete()` toast with the real post — keeping the idempotency
   key that already travels on every tab, and keeping the rule that **only a
   genuine network failure queues**.

## The fourteen

Every defect the capability inventory found in the shipped `Pos.jsx` is answered
here and marked `FIX:` in the code. In short: charges and discounts reach the
total through one formula; notes have one payload path; only network failures
queue; the reserved-stock confirm is awaited; margin is real because cost travels
with the line; the return policy and window are enforced; F6 works and F10 is
gone; Cancel is undoable; the keymap is suspended inside fields and sheets; tabs
carry document numbers; `pos.void_item` and `pos.refund` are checked at the
control; and there is a Drawer button.

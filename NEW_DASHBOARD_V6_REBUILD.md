# New Dashboard (v6) — card system rebuild

**Files changed:** `resources/js/Pages/NewDashboard.jsx`, `resources/js/Pages/NewDashboard.css`

**Authorities followed**
| Source | What it settles |
|---|---|
| `extras/Design System/VenQore Design System/tokens/typography.css` | the type scale, bumped 1–2pt on 22 Aug 2026 for POS legibility |
| `…/tokens/radius.css` | the shape law — **two** shapes only: 14px, and pill |
| `scratch/card-preview/vq-cards-light.html` | the card anatomy: frame, header, tools, number block, body, strip grid |
| `extras/Design System/VenQore Card System Rules & Padding Workbench.html` | the six categories, their min/max bounds and fits |
| `VENQORE_LAYOUT_LAW.md` v2.0 | the grid, the 24px pitch, the nav law, the fit resolver |

**Verified:** headless Chromium — 18 viewport widths (360→3425) × every chart type × every legal category × every legal fit × 4 card tones × light / dark / mesh. **0 overflow, 0 collisions, 0 clipping. All text passes WCAG AA on all three page backgrounds.**

---

## Round 2 — what the first pass got wrong

The first pass built a "resolution layer" that **restated** the card system with
values of its own invention, and quietly beat the real one on every point of
conflict. That is the "you skipped rules and font sizes" in the report, and it
was the single biggest defect. It is gone.

### The type scale was the pre-August one, and then overridden anyway

`typography.css` carries a dated decision:

> *The scale was bumped one to two points on 22 Aug 2026. It was drawn for a
> marketing site read at arm's length; a cashier reads a POS terminal from
> further away, standing, often over 50, and the 13px caption and 11px eyebrow
> were the first things people asked to make bigger.*

`NewDashboard.css` still held the pre-bump values, and my layer then replaced
them with `clamp()` expressions that went **smaller still**:

| | design system | this file (before) | my layer (before) | now |
|---|---|---|---|---|
| metric | 40px | 38px | `clamp(15px … 34px)` | **40px** |
| metric-sm | 28px | 26px | — | **28px** |
| eyebrow | 12px | 11px | `clamp(10px … 12.5px)` | **12px** |
| caption | 14px | 13px | 11px | **14px** |
| body | 17px | 16px | — | **17px** |
| h3 | 23px | 21px | — | **23px** |

Fixed at the **token** level, so every rule in the file lands correctly at once.
Every hard-coded 9 / 9.5 / 10 / 10.5 / 11 / 11.5 / 12.5px in the shell, the
cards and the wizard was mapped onto a scale step. There is no raw font size in
the card layer any more.

### The radius ladder was declared twice, and both copies were wrong

```
line  188   --vq-r-xs 8   sm 12   md 14   lg 20   xl 28   2xl 36
line 1739   --vq-r-xs 6   sm  8   md 12   lg 16   xl 18   2xl 24   ← this one won
radius.css  every rung 14px, pill for meaning-bearing shapes only
```

So a card the first block called 20px rendered at 16px, and my layer asked for
18px on top. All three are now the one V6 shape: **14px, or a pill.**

### Three named bugs shipped with `!important`

```css
.vqc {
  justify-content: space-between !important;   /* ← */
  border-radius: var(--vq-r-xl, 18px) !important;
  transition: all var(--vq-dur-2) !important;
}
```

The card system calls the first out by name — *"`space-between` on a column
pushes the header up and the body down, so a card holding one number stretched
that number across whatever height the grid gave it. The fit decides the box;
the content sits at the top of it."* That is why a 3×2 strip left two thirds of
itself empty in the preview. `transition: all` animated layout properties, so
every reflow became a 180ms slide. Block removed; the reference's own `.vqc`,
`.vqc-hd` and `.vqc-head` now apply.

### The strip's own layout was a flex row

The reference lays the inline strip as a **three-column grid** — label | value |
window — *"because a flex row lets the label push the number off the end"*, with
a stated priority: the value never shrinks, the window truncates next, the label
gives way first. The file had a flex row with `space-between`, and keyed its
stacked form off `.vqc--c2-stacked`, a class no renderer has emitted in a long
time. Both forms now use the reference's grid and class names, and the strip is
centred in its card.

### An opaque pill was painted over every strip

`.vqc--c2 .vqc-tools` carries `background: var(--vq-surface)` so the controls
read against the number when they appear. My layer forced that container
visible at rest so the open arrow could live in it — which painted a white
lozenge over the right end of every strip. It had been eating the last three
letters of "Today" and "Month" in every screenshot. The ground now arrives with
the controls, not before them.

### A stat in a Metric card had no chart at all

`defaultVariant('stat')` is `number`, and `number` is the *bare* variant — the
renderer draws no chart host for it. Correct in a tile or a strip, which have no
body; wrong from C3 up, where it left one figure floating in 240px of nothing.
The rule is now explicit: **the bare number is the tile and strip interior; a
stat with a body to fill gets the sparkline.**

### The Law's pixel floors were never checked

A fit's floor is a pixel measurement — *"4×1 inline ≥ 356px"* — so it cannot be
chosen from column counts alone: four columns is 520px on a desktop and 330px on
a phone, and only one of those can hold an inline strip. The board's real column
width is measured once per draw and carried on the geometry, and the strip picks
its fit against it.

### The gutter was being tightened on small screens

I had dropped it to 14px on phones. The gutter is not decoration — **it is the
pitch**: row height is `n·64 + (n−1)·24`, which is what makes a 2-row card
(152px) exactly equal two stacked 1-row cards (64+24+64). Change it and every
multi-row card drifts out of alignment with its neighbours. It is 24px on both
axes at every width, and the margin ramps rather than steps so the canvas never
loses width for a pixel of window growth.

### The header menu had no stylesheet at all

"Edit layout / Add a card / Reset layout" rendered as three inline buttons with
their icons floating above the words, over whatever was behind them. It is a
popover now: positioning context, raised surface, 14px corner, rows with hover.

---

## What the author can and cannot set

Per your decisions:

**Cannot** — the card names itself. A reading card takes the reading's label, a
hub its template's name, a shortcut its destination. No title field, no subtitle
field, so two boards of the same data read the same way.

**Cannot** — no URL is ever typed. A shortcut's destination is picked from a
grid of the pages that exist; a reading's and a hub's are derived.

**Can** — size and category (presets plus a column/row stepper over every legal
size), chart type and variant, default timeframe, background tone, and four
switches for the card face:

| Switch | Default | Overridden by geometry when |
|---|---|---|
| Open arrow | on | — |
| Change pill | on | card is 1 column |
| Timeframe caption | on | card is under 4 rows |
| Timeframe picker | on | card is under 3 columns |
| Star border · glare | off | — |

A switch says *"I want this"*; the geometry says *"there is room"*. The panel
tells the author which is about to happen, in amber, next to the switch — so a
preference can never cause an overflow and never silently does nothing.

---

## Carried over from round 1

- **The page scrolls.** `app.css` locks `html, body, #app` for the POS terminal;
  the shell is now its own scroll container rather than unlocking 312 pages.
- **Sizes are generated from the Law**, not from a hand-written list, by one
  resolver the wizard, the drag handle, the board and the preview all call.
- **`boardCols()` reads the declared count.** It used to read the *used* track
  list — but a too-wide card makes Grid mint implicit columns, so the clamp
  meant to stop the overflow read its own bug as the truth and held it there.
- **The preview draws at true geometry** (`w·112+(w−1)·24` by `h·64+(h−1)·24`)
  and scales to fit, with a Fit/100% toggle. 39 distinct sizes for one reading.
- **Charts measure layout, not paint** (`clientWidth`, not the rect, which
  includes the entry animation's `scale(.985)`), and a ResizeObserver re-cuts
  each chart when its host changes for any reason.
- **The nav law**: overlay below 1216, rail to 1279, expanded from 1280,
  hamburger at every width, column ladder stated per nav state.
- **Truncation set on inline spans does nothing** — all blockified.
- **A legacy star border** drew two pseudo-elements 300% of the card wide at
  `left:-250%`, adding 2,400px of phantom scroll to every accent card.
- Reset no longer duplicates the board; the engine no longer leaks listeners on
  Inertia navigation; the store slug comes from props or the URL, not a literal;
  titles are HTML-escaped.

---

## Known limit

A 4×1 strip on a 4-column phone is ~330px, under the inline fit's 356px floor,
and has no second row to trade a column for. It degrades by priority instead —
window first, then the label — with the value intact. Giving the resolver the
ability to *add a row* when a pixel floor cannot be met would fix it properly,
at the cost of a board that re-flows its own row heights.

## Optional follow-up

`routes/web.php` renders `NewDashboard` with no props on the store route. Passing
the real `store` (with `slug`) and `auth` would let the page drop its URL
fallback. It works either way.

# bar.md — what makes the v6 dashboard good

Reference: `VenQore Design System v6 (COMPLETE standalone).html` → App → Business dashboard,
verified rendered in light and dark at 1600×1000 @2×. Chart engine target: bklit.

These are the mechanisms. A critic checks each by looking at rendered output only.
Binary. No scores.

---

## M1 · One filled card per grid, and it is the most important number

In the reference, four KPI cards sit in a row. **Exactly one** — Net Balance — is a solid
teal fill with inverted text. The other three are plain surface with a hairline border.
The accent is spent once and never again on that surface.

**Check:** count cards with an accent fill in one screenshot.
Fail if 0. Fail if ≥2. Pass only at exactly 1, and only if it is the headline metric.

---

## M2 · Three type sizes inside the number block, never two, never four

The number block is a strict ladder:

| Element | Token | Value |
|---|---|---|
| Eyebrow label | `--vq-fs-eyebrow` | **11px**, uppercase, `0.12em` tracking, `--vq-text-3` |
| Value | `--vq-fs-metric` / `--vq-fs-metric-sm` | **38px** / **26px**, Space Grotesk, tabular |
| Unit (`Rs`, `%`, `items`) | — | **≤50% of value**, demoted, baseline-aligned |

The jump from label to value is **≥2.3×** (38/11 = 3.45 on a C3; 26/11 = 2.36 on a C2).
Nothing sits between them.

**Check:** measure the label and the value. Fail if the ratio is under 2.3×.
Fail if the value is any size other than 38px or 26px. Fail if the unit renders at the
same size as the value. Fail if a fourth size appears in the block.

---

## M3 · Delta is a pill with a glyph, and it is the smallest thing on the card

`▲ 8.2%` on a tinted pill, then plain-text context (`vs last month`) beside it at
`--vq-text-3`. The pill carries semantic colour; the context text never does.

**Check:** every delta has a direction glyph **and** a number. Fail on colour-only.
Fail if the delta is larger than the unit. Fail if the context sentence is tinted red/green.

---

## M4 · Two radii on a card. Twenty and full. No third.

Card corner is `--vq-r-lg: 20px`. Pills and chips are `999px`. Icon buttons are circles.
There is no 8px, no 12px, no 28px anywhere on a dashboard card.

**Check:** look at every corner in the shot. Fail the moment a third radius appears.

---

## M5 · Chart ink: one hue, horizontal-only dashed grid, no spines, no Y labels

The reference area chart is a single mint stroke over a vertical gradient wash that
fades to transparent. Gridlines are **dashed and horizontal only**. There is **no axis
spine**, **no Y-axis label**, and the X labels are bare month names at `--vq-text-3`.
The bar chart colours **one** bar teal and leaves every other bar neutral grey.

**Check:** count hues in the plot area — 1 accent + neutrals passes, a rainbow fails.
Fail on any vertical gridline. Fail on any drawn axis line. Fail on Y-axis tick labels.
Fail if every bar is coloured.

---

## M6 · Dark mode is a re-render, not an inversion

Dark surfaces are near-black **green** (`--vq-surface: #141B19`), never neutral grey.
The accent card does not merely swap text colour — it **blooms**, gaining a soft outer
glow the light version does not have. Semantic tints (the IN/OUT tiles, the alert rows)
become low-alpha washes on dark, not the same solid pastels flipped.

**Check:** put the two side by side. Fail if dark is the light card with colours
inverted. Fail if any dark surface samples as pure neutral grey. Fail if the accent
card looks flat in dark.

---

## M7 · Motion is one of four durations and resolves in one direction

The only legal durations are **120 / 200 / 320 / 520ms** (`--vq-dur-1…4`), plus a 9s
ambient. Easing is `cubic-bezier(.22,1,.36,1)` out, or the spring for entrances.
Charts **draw in on mount** — the line traces, the wash fades up behind it. Nothing
loops. Nothing bounces twice. Nothing animates on hover except a border and a shadow.

**Check:** on a filmstrip, every transition lands inside 520ms and settles once.
Fail on any duration outside the four. Fail on a looping idle animation inside a card.
Fail on `hover:scale` — the reference never scales a card on hover.

---

## Grid law (from Layout Law v2.0 — non-negotiable geometry)

Not craft, but a hard floor the layout must sit on:

- Gutter **24px** both axes, and it is `gap` — never `margin-bottom`.
- Row track **64px**. `height(n) = n·64 + (n−1)·24`. So 2 rows = **152px**, 3 = 240px.
- Six card categories only: **C1 Tile · C2 Strip · C3 Metric · C4 Panel · C5 Board · C6 Canvas.**
- A card widens before it degrades; it only changes fit when widening is exhausted.

---

## The one thing that does not exist yet

v6's charts are hand-drawn SVG — *"Library-free, draw-in on mount, slot-1 mint."*
bklit is a real charting library with its own motion, tooltip and loading language.

**Nothing in the reference shows a bklit chart wearing v6 clothing.** That translation
is the actual work of this run, and M5 + M7 are the mechanisms that decide whether it
succeeded. A bklit chart that arrives with its own default palette, its own tooltip
chrome, its own axis spines, or a loading shimmer that does not match `--vq-dur-*`
is a fail even if it is objectively a nice chart.

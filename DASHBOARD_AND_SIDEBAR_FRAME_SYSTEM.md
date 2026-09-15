# VenQore — Frame System for Dashboards and Sidebars

**Spec version:** 1.0 · **Written:** 15 Sep 2026
**Repo root assumed:** `app-code/main-app/`
**Status:** authoritative build spec. Read this in full before writing a line.

---

## 0. How to use this document

This is a build spec for an implementing agent (IDE). It is written so that every
number in it is checkable and every file it names actually exists.

**Rules for the agent building this:**

1. **Do not invent phases.** The phases in §14 are the phases.
2. **Do not restate a number in a second file.** Every geometry number in this
   spec lands in exactly one place: `resources/layout-law.json` or
   `config/dashboard_frames.php`. If you find yourself typing `12` or `64px`
   into a component, stop — you have taken the wrong turn. See the
   source-of-truth map in `CLAUDE.md`.
3. **Verify by reading the file you changed.** `CLAUDE.md` rule 6 exists because
   file paths in summaries have been wrong three times while the work was right.
4. **Precedence is unchanged.** `VENQORE_LAYOUT_LAW.md` v2.0 outranks
   `DESIGN-RULES.md` on any geometry number. This spec *extends* the Layout Law;
   it does not replace it. §4 is the only place the law changes, and it changes
   by adding fits, never by removing one.
5. When something here contradicts what you find in the code, **say so and stop.**
   Do not substitute your own plan.
6. **Build status, 15 Sep 2026.** Phases −1 to 8 are implemented and verified
   in the backend: eight frames, eleven fits, geometry-free pools, filler,
   lock enforcement, sentinel removal. **None of it is on screen** — the live
   dashboard is a 5,483-line imperative engine that references none of it, and
   it renders seeded fake data when the Reckoner returns nothing. **§17 is now
   the highest priority, and §17.3 is the first thing to do.**
7. **Read §16 first and build it first.** The dashboard currently renders
   Rs 0 on cards whose underlying data is real — the transactions page shows
   Rs 2,282,043 where the dashboard shows Rs 0. Arranging cards that display
   nothing is wasted work. §16 is Phase −1 in the build order.

---

## 1. The problem, stated precisely

Today a store's dashboard shape is decided by what kind of business it is.
`config/dashboard_presets.php` holds **21 hand-authored boards** — 4 role boards
and 17 business boards — plus 16 aliases pointing at them. Each board is a list
of cards where every card carries its own `x`, `y`, `w`, `h`, `category` and
`fit`, typed by hand.

Three things are wrong with that, and they are all the same thing:

**(a) The name lies about the content.** A board called `retail_shop` may seed a
pharmacy (via `aliases`), a tailor (via `tailoring → manufacturing`), or a
plumber (via `field_service → repair_workshop`). The board's *name* claims a
trade the store is not in, and the cards inside it are filtered again at seed
time by `Reckoner::checkAvailability()`, so two stores on the same named board
routinely see different cards. The name is not a promise anybody keeps.

**(b) Geometry is duplicated 21 times.** Adding a ninth card to
`business.grocery` means re-typing `x`/`y` for every card after it. Nothing
checks that the result tiles. It does not tile: the re-pack loop in
`Api\DashboardController::getDefaultRoleCards()` (lines ~729–780) is a naive
left-to-right shelf packer that advances `y` by `max(rowH)` — so a row
containing a 3x2 and a 3x4 leaves a 3x2 hole under the short card, permanently.

**(c) Cards and layout are welded together.** Because the board *is* the card
list, there is no way to say "give this store the same shape but different
cards", which is exactly what a multi-tenant product needs.

The fix is to split one concept into three independent ones.

---

## 2. The new model — three axes, never mixed

| Axis | Answers | Decided by | Stored in |
|---|---|---|---|
| **Frame** | *What shape is the board?* | The user, from 8 presets, or their own | `dashboards.frame_key` + `config/dashboard_frames.php` |
| **Fill** | *Which reading goes in each hole?* | The system, from business type + plan + permissions + data | `config/dashboard_pool.php` + `App\Services\Dashboard\FrameFiller` |
| **Words** | *What is it called here?* | `tenant_terminology` | `App\Support\Terms` + `useTermText()` |

A **Frame** is pure geometry. It contains no reading keys, no business names, no
chart types. It is a list of *slots*. Eight of them ship; a store may save its
own.

**Fill** is the part that is allowed to know what business this is. A restaurant
and a hardware shop can choose the exact same frame and each get sensible cards
in it, because the fill engine reads the business type, the plan, the
permissions and whether the tenant actually has any data of that kind.

**Words** already works — `ModuleNavBuilder::label()` routes nav labels through
`Terms::get()`, and `tenant_terminology` is shared as `props.terms`. §7 extends
it to card titles, which is the one place it was never wired.

> **The line to hold:** a Frame never mentions a business. A Pool never mentions
> a pixel. If you catch either file breaking that rule, the split has failed.

---

## 3. The 8 Frames

### 3.1 Names

The JSON supplied with this brief titled its layouts `Retail Overview`,
`Money & Accounts` and `Stock & Purchasing`. Those are exactly the
business-flavoured names the whole exercise exists to remove — a services
business whose best board is layout 3 should not have to pick something called
"Stock & Purchasing". The names below describe the **shape**, which is the only
thing a frame actually is.

| # | Frame key | Display name | Was called | The shape, in one line |
|---|---|---|---|---|
| 1 | `spotlight` | **Spotlight** | Retail Overview | Three thin readings, one full-width stage, a pair, then a tall anchor beside a stacked split |
| 2 | `headline` | **Headline** | Money & Accounts | Opens with a full-width banner, then pair → trio → pair |
| 3 | `mosaic` | **Mosaic** | Stock & Purchasing | Twin headers over an interlocking 3+3 / 2+2+2 split, closed by a trio |
| 4 | `command` | **Command Centre** | Command Centre | Everything large: banner, broad pair, three full-height pillars, base runner |
| 5 | `classic` | **Classic** | Familiar | Four KPIs, one main stage, one pair. The board most people expect |
| 6 | `workbench` | **Workbench** | Start Simple | Twin headers, one dominant 8-wide stage with a 3-item side stack, trio base |
| 7 | `pillar` | **Pillar** | Vertical Pillar & Stack | A 5-wide full-height pillar against two 7-wide panels, then trio and pair |
| 8 | `focus` | **Focus** | Centered Focus Stage | Thin trio, a 3-6-3 centred stage, a pair, then a wide base |

All eight ship enabled. `command` is the heaviest and `classic` the lightest;
the picker should list them in the order above.

### 3.2 The grid contract

Unchanged from `resources/layout-law.json` — this spec adds nothing here and
must not:

```
columns            12
column definition  repeat(12, minmax(0, 1fr))
row unit           64px      (grid-auto-rows)
gutter             24px      (gap, both axes)
outer canvas       24px      (padding, all sides)
row height law     size(n) = n*64 + (n-1)*24
```

The gutter is **part of the pitch, not something added between cards**. CSS Grid
`gap` computes this natively. Never implement it with margins — the comment at
the top of `layout-law.json` documents the exact bug that causes (a 2-row card
at 128px against two stacked 1-row cards at 152px).

### 3.3 Explicit placement — `dense` is banned

The supplied brief specified `grid-auto-flow: dense`. **Do not use it.**

Dense flow backfills a later small card into an earlier hole. That is fine for a
gallery and wrong for a dashboard: it means the card a user dragged to position 7
can silently jump to position 3 when an earlier card is dropped by a permission
gate — which happens on every seed, because `Reckoner::checkAvailability()`
drops cards routinely. The board would then not match the frame the user chose.

Every slot below therefore carries an **explicit `x` and `y`**. Use
`grid-column: <x+1> / span <w>` and `grid-row: <y+1> / span <h>`. Set
`grid-auto-flow: row` and never rely on the browser to place anything.

**These placements are verified.** Every frame below has been checked
programmatically for: (i) no card overflowing column 12, (ii) no two cards
overlapping a single cell, (iii) no empty cell anywhere in the frame's row
range. Result:

| Frame | Slots | Rows | Cells filled | Verdict |
|---|---|---|---|---|
| spotlight | 9 | 14 | 168 / 168 | clean |
| headline | 8 | 12 | 144 / 144 | clean |
| mosaic | 10 | 11 | 132 / 132 | clean |
| command | 7 | 19 | 228 / 228 | clean |
| classic | 7 | 9 | 108 / 108 | clean |
| workbench | 9 | 11 | 132 / 132 | clean |
| pillar | 8 | 13 | 156 / 156 | clean |
| focus | 9 | 12 | 144 / 144 | clean |

Re-run that check in CI — see §13, test `FrameGeometryLawTest`.

### 3.4 Slot anatomy

Every slot is:

```php
[
  'slot'     => 1,          // stable within the frame, 1-based, never renumbered
  'x'        => 0,          // 0-based column
  'y'        => 0,          // 0-based row
  'w'        => 4,          // columns
  'h'        => 1,          // rows
  'category' => 'C2',       // Layout Law category this span resolves to
  'fit'      => 'inline',   // the declared fit of that category with exactly w x h
  'role'     => 'strip',    // what kind of content belongs here
  'accepts'  => ['kpi', 'status'],   // card classes, in preference order
]
```

`category` + `fit` are **derived from `w`/`h`, not chosen freely.** §4 adds the
missing fits so that every span used below is a declared fit of exactly one
category. `LayoutLaw::validate()` already fails a card whose `w`/`h` disagree
with its fit, so a typo here is caught by the existing validator.

**Slot roles** and what each accepts:

| Role | Typical span | Accepts (card classes) |
|---|---|---|
| `strip` | 4x1 | `kpi`, `status` |
| `metric` | 3x2, 4x2 | `headline`, `kpi`, `gauge`, `status` |
| `metric-wide` | 6x2 | `kpi`, `gauge`, `status` |
| `panel` | 3x4 | `breakdown`, `ranking`, `feed` |
| `panel-tall` | 4x6 | `ranking`, `feed`, `breakdown` |
| `panel-wide` | 6x3, 6x4 | `ranking`, `breakdown`, `ledger`, `trend` |
| `stage-band` | 8x3 | `trend`, `ledger`, `ranking` |
| `stage` | 7x4, 8x6 | `trend`, `ledger`, `breakdown` |
| `board-tall` | 5x8 | `ranking`, `ledger`, `feed`, `breakdown` |
| `hero` | 12x4, 12x5 | `trend`, `ledger` |

Card classes are defined in §6.2.

### 3.5 The frames

Below, each frame is given as its slot table. `accentSlot` names the one slot
that carries `style.accent` — Mechanism M1, one accent per board, on the
headline metric. `LayoutLaw::enforceAccentBudget()` already polices this.

The accent rule is: **the first slot in reading order whose role is `strip`,
`metric` or `metric-wide`; if a frame has none, slot 1.** The resolved value is
stated per frame so nothing has to infer it at runtime.

---

#### Frame 1 — `spotlight` · 9 slots · 14 rows · accentSlot 1

| Slot | x | y | w | h | Cat/Fit | Role |
|---|---|---|---|---|---|---|
| 1 | 0 | 0 | 4 | 1 | C2 / inline | strip |
| 2 | 4 | 0 | 4 | 1 | C2 / inline | strip |
| 3 | 8 | 0 | 4 | 1 | C2 / inline | strip |
| 4 | 0 | 1 | 12 | 4 | C6 / banner | hero |
| 5 | 0 | 5 | 6 | 3 | C4 / wide | panel-wide |
| 6 | 6 | 5 | 6 | 3 | C4 / wide | panel-wide |
| 7 | 0 | 8 | 4 | 6 | C4 / column | panel-tall |
| 8 | 4 | 8 | 8 | 3 | C5 / band | stage-band |
| 9 | 4 | 11 | 8 | 3 | C5 / band | stage-band |

Slot 7's 6 rows equal slots 8 + 9 (3 + 3). Columns: 4 + 8 = 12.

---

#### Frame 2 — `headline` · 8 slots · 12 rows · accentSlot 4

| Slot | x | y | w | h | Cat/Fit | Role |
|---|---|---|---|---|---|---|
| 1 | 0 | 0 | 12 | 4 | C6 / banner | hero |
| 2 | 0 | 4 | 6 | 3 | C4 / wide | panel-wide |
| 3 | 6 | 4 | 6 | 3 | C4 / wide | panel-wide |
| 4 | 0 | 7 | 4 | 2 | C3 / wide | metric |
| 5 | 4 | 7 | 4 | 2 | C3 / wide | metric |
| 6 | 8 | 7 | 4 | 2 | C3 / wide | metric |
| 7 | 0 | 9 | 6 | 3 | C4 / wide | panel-wide |
| 8 | 6 | 9 | 6 | 3 | C4 / wide | panel-wide |

---

#### Frame 3 — `mosaic` · 10 slots · 11 rows · accentSlot 4

| Slot | x | y | w | h | Cat/Fit | Role |
|---|---|---|---|---|---|---|
| 1 | 0 | 0 | 6 | 3 | C4 / wide | panel-wide |
| 2 | 6 | 0 | 6 | 3 | C4 / wide | panel-wide |
| 3 | 0 | 3 | 6 | 3 | C4 / wide | panel-wide |
| 4 | 6 | 3 | 6 | 2 | C3 / band | metric-wide |
| 5 | 6 | 5 | 6 | 2 | C3 / band | metric-wide |
| 6 | 0 | 6 | 6 | 3 | C4 / wide | panel-wide |
| 7 | 6 | 7 | 6 | 2 | C3 / band | metric-wide |
| 8 | 0 | 9 | 4 | 2 | C3 / wide | metric |
| 9 | 4 | 9 | 4 | 2 | C3 / wide | metric |
| 10 | 8 | 9 | 4 | 2 | C3 / wide | metric |

The interlock: left column runs slots 3 + 6 (3 + 3 = 6 rows); right column runs
slots 4 + 5 + 7 (2 + 2 + 2 = 6 rows). Both start at row 3 and end at row 9.

---

#### Frame 4 — `command` · 7 slots · 19 rows · accentSlot 1

| Slot | x | y | w | h | Cat/Fit | Role |
|---|---|---|---|---|---|---|
| 1 | 0 | 0 | 12 | 5 | C6 / hero | hero |
| 2 | 0 | 5 | 6 | 4 | C4 / broad | panel-wide |
| 3 | 6 | 5 | 6 | 4 | C4 / broad | panel-wide |
| 4 | 0 | 9 | 4 | 6 | C4 / column | panel-tall |
| 5 | 4 | 9 | 4 | 6 | C4 / column | panel-tall |
| 6 | 8 | 9 | 4 | 6 | C4 / column | panel-tall |
| 7 | 0 | 15 | 12 | 4 | C6 / banner | hero |

Command Centre has no `metric` slot, so the accent falls to slot 1 by the
fallback. Note for review: an accent-filled 12x5 hero is a lot of colour. If
that reads badly in the build, the alternative is to let `command` declare
`accentSlot => null` and carry no accent at all — M1 permits zero.

---

#### Frame 5 — `classic` · 7 slots · 9 rows · accentSlot 1

| Slot | x | y | w | h | Cat/Fit | Role |
|---|---|---|---|---|---|---|
| 1 | 0 | 0 | 3 | 2 | C3 / standard | metric |
| 2 | 3 | 0 | 3 | 2 | C3 / standard | metric |
| 3 | 6 | 0 | 3 | 2 | C3 / standard | metric |
| 4 | 9 | 0 | 3 | 2 | C3 / standard | metric |
| 5 | 0 | 2 | 12 | 4 | C6 / banner | hero |
| 6 | 0 | 6 | 6 | 3 | C4 / wide | panel-wide |
| 7 | 6 | 6 | 6 | 3 | C4 / wide | panel-wide |

This is the shortest frame at 9 rows and the closest to the reference board
described in `layout-law.json`'s `chartDefaultCategory` comment (four C3 metric
cards at the standard 3x2 fit). **Make this the default frame for a new store.**

---

#### Frame 6 — `workbench` · 9 slots · 11 rows · accentSlot 4

| Slot | x | y | w | h | Cat/Fit | Role |
|---|---|---|---|---|---|---|
| 1 | 0 | 0 | 6 | 3 | C4 / wide | panel-wide |
| 2 | 6 | 0 | 6 | 3 | C4 / wide | panel-wide |
| 3 | 0 | 3 | 8 | 6 | C5 / stage | stage |
| 4 | 8 | 3 | 4 | 2 | C3 / wide | metric |
| 5 | 8 | 5 | 4 | 2 | C3 / wide | metric |
| 6 | 8 | 7 | 4 | 2 | C3 / wide | metric |
| 7 | 0 | 9 | 4 | 2 | C3 / wide | metric |
| 8 | 4 | 9 | 4 | 2 | C3 / wide | metric |
| 9 | 8 | 9 | 4 | 2 | C3 / wide | metric |

Slot 3's 6 rows equal slots 4 + 5 + 6 (2 + 2 + 2). Columns: 8 + 4 = 12.

---

#### Frame 7 — `pillar` · 8 slots · 13 rows · accentSlot 4

| Slot | x | y | w | h | Cat/Fit | Role |
|---|---|---|---|---|---|---|
| 1 | 0 | 0 | 5 | 8 | C5 / pillar | board-tall |
| 2 | 5 | 0 | 7 | 4 | C5 / wideband | stage |
| 3 | 5 | 4 | 7 | 4 | C5 / wideband | stage |
| 4 | 0 | 8 | 4 | 2 | C3 / wide | metric |
| 5 | 4 | 8 | 4 | 2 | C3 / wide | metric |
| 6 | 8 | 8 | 4 | 2 | C3 / wide | metric |
| 7 | 0 | 10 | 6 | 3 | C4 / wide | panel-wide |
| 8 | 6 | 10 | 6 | 3 | C4 / wide | panel-wide |

Slot 1's 8 rows equal slots 2 + 3 (4 + 4). Columns: 5 + 7 = 12.

---

#### Frame 8 — `focus` · 9 slots · 12 rows · accentSlot 1

| Slot | x | y | w | h | Cat/Fit | Role |
|---|---|---|---|---|---|---|
| 1 | 0 | 0 | 4 | 1 | C2 / inline | strip |
| 2 | 4 | 0 | 4 | 1 | C2 / inline | strip |
| 3 | 8 | 0 | 4 | 1 | C2 / inline | strip |
| 4 | 0 | 1 | 3 | 4 | C4 / standard | panel |
| 5 | 3 | 1 | 6 | 4 | C4 / broad | panel-wide |
| 6 | 9 | 1 | 3 | 4 | C4 / standard | panel |
| 7 | 0 | 5 | 6 | 3 | C4 / wide | panel-wide |
| 8 | 6 | 5 | 6 | 3 | C4 / wide | panel-wide |
| 9 | 0 | 8 | 12 | 4 | C6 / banner | hero |

The 3-6-3 tier: 3 + 6 + 3 = 12, all three height-matched at 4 rows.

---

## 4. Layout Law v2.0 — the fits this needs

**This is the only change to the law, and it is additive.**

The eight frames use 14 distinct spans. Three are already declared fits:

| Span | Already exists as |
|---|---|
| 4x1 | C2 `inline` |
| 3x2 | C3 `standard` |
| 3x4 | C4 `standard` |

The other **eleven do not exist**, and `LayoutLaw::validate()` will reject every
card in every frame until they do. Add them to
`resources/layout-law.json` → `categories.<C>.fits[]`.

### 4.1 The eleven new fits

| Category | Key | w | h | floor | Why this category |
|---|---|---|---|---|---|
| C3 Metric (max 6x4) | `wide` | 4 | 2 | 386 | A KPI with delta, given a fourth column |
| C3 Metric | `band` | 6 | 2 | 560 | The same KPI across half the board |
| C4 Panel (max 6x6) | `wide` | 6 | 3 | 700 | A ranked list or breakdown, half-width, short |
| C4 Panel | `broad` | 6 | 4 | 700 | Same, with a fourth row for a legend |
| C4 Panel | `column` | 4 | 6 | 492 | A tall narrow list — the `spotlight` / `command` anchor |
| C5 Board (max 12x9) | `band` | 8 | 3 | 733 | A wide short chart; the `spotlight` split |
| C5 Board | `stage` | 8 | 6 | 733 | The `workbench` dominant stage |
| C5 Board | `pillar` | 5 | 8 | 415 | The `pillar` left anchor. Sits beside existing `narrow` 5x7 |
| C5 Board | `wideband` | 7 | 4 | 660 | The `pillar` right panels |
| C6 Canvas (max 12x16) | `banner` | 12 | 4 | 1100 | Full-bleed hero, 4 rows |
| C6 Canvas | `hero` | 12 | 5 | 1100 | Full-bleed hero, 5 rows (`command` only) |

**How the floors were derived** (so you do not have to guess if you add a
twelfth): `floor` is the narrowest *pixel* width at which the card may still use
that fit. The existing law sets it by column count — C3 `compact` (w2) 200,
C3 `standard` (w3) 274, C3 `full` (w4) 386, C4 `full` (w4) 492, C5 `full` (w6)
593, C5 `narrow` (w5) 415, C6 `full` (w8) 733. Each new fit takes the floor of
the nearest existing fit **of the same width**, and where no fit of that width
exists in any category, it interpolates on the same curve. Never set a floor
below the category's leanest existing floor.

### 4.2 Things that do *not* change

- **No fit is removed.** Boards persisted before this spec keep resolving.
- **`fromLegacySize()` stays.** Legacy `2x4…8x8` rows keep translating. It will
  now find better matches, because there are more fits to match against.
- **Category maxima stay.** Every new fit is inside its category's declared max;
  check this yourself before writing: C3 max 6x4, C4 max 6x6, C5 max 12x9,
  C6 max 12x16. All eleven pass.
- **`isCategoryLegal()` semantics stay.** Legality is a **floor, not a
  whitelist** — a chart may always be given *more* room than its floor. This
  matters: `pie` lists `["C4","C5"]` and a `hero` slot is C6, which is *above*
  C4 and therefore legal. Do not "fix" this by adding C6 to every chart's list.

### 4.3 The JS mirror

`resources/js/Dashboard/layoutLaw.js` reads the same
`resources/layout-law.json`. It needs **no change** — that is the point of the
file. Confirm by reading it before you assume otherwise. If you find a
hardcoded fit list in it, that is a bug predating this spec; report it.

---

## 5. Data model

### 5.1 Migration — `dashboards`

```php
Schema::table('dashboards', function (Blueprint $table) {
    // Which frame this board was built from. Null = a board that predates
    // frames, or one a user has dragged so far from its frame that the frame
    // no longer describes it.
    $table->string('frame_key', 40)->nullable()->after('slug');

    // True the moment a user drags, resizes or removes a card. A dirty board
    // is never re-flowed by a frame change; the user is asked first.
    $table->boolean('frame_dirty')->default(false)->after('frame_key');
});
```

MariaDB 10.5. No `utf8mb4_0900_*` collations, no `JSON_TABLE`, no `SKIP LOCKED`
— see `CLAUDE.md` § Database Policy.

### 5.2 Migration — `dashboard_frames` (custom frames)

A store may save its own frame. This is the table it lands in.

```php
Schema::create('dashboard_frames', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('tenant_id');                  // HasTenant scope
    $table->uuid('user_id')->nullable();        // null = shared with the store
    $table->string('key', 40);                  // slug, unique per tenant
    $table->string('name', 80);
    $table->json('slots');                      // [{slot,x,y,w,h,category,fit,role,accepts}]
    $table->unsignedTinyInteger('accent_slot')->nullable();
    $table->timestamps();

    $table->unique(['tenant_id', 'key']);
    $table->index(['tenant_id', 'user_id']);
});
```

`slots` is validated on write by `FrameValidator` (§9.2) — a custom frame that
does not tile is rejected with a readable message, never stored and silently
rendered broken.

### 5.3 Migration — `dashboard_cards`

Add the slot back-reference so a board can be re-flowed:

```php
$table->unsignedTinyInteger('frame_slot')->nullable()->after('fit');
```

Null means the card was added by hand and belongs to no slot.

### 5.4 Model changes

- `App\Models\Dashboard` — add `frame_key`, `frame_dirty` to `$fillable`, cast
  `frame_dirty` to boolean.
- `App\Models\DashboardCard` — add `frame_slot` to `$fillable`, cast to integer.
- New `App\Models\DashboardFrame` — `HasUuids`, `HasTenant`, `$casts = ['slots' => 'array']`.

---

## 6. Fill — how a frame becomes a board

### 6.1 The new config: `config/dashboard_pool.php`

`config/dashboard_presets.php` is **replaced**, not edited. The new file carries
the same business knowledge with **every geometry key removed**.

```php
return [

    /*
    | A pool is an ORDERED list of candidate readings. Order is priority:
    | the first candidate that fits an open slot and passes availability wins.
    |
    | A pool entry carries NO x, y, w, h, category or fit. If you are about to
    | type one of those here, you are in the wrong file — see
    | config/dashboard_frames.php.
    */

    'roles' => [
        'cashier' => [
            ['key' => 'sales.revenue',            'class' => 'headline', 'period' => 'today'],
            ['key' => 'sales.gross_margin_pct',   'class' => 'kpi',      'period' => 'today'],
            ['key' => 'staff.on_shift_count',     'class' => 'kpi',      'period' => 'today'],
            ['key' => 'party.customer_count',     'class' => 'kpi',      'period' => 'today'],
            ['key' => 'sales.live_feed',          'class' => 'feed',     'period' => 'live'],
            ['key' => 'sales.payment_breakdown',  'class' => 'breakdown','period' => 'today'],
            ['key' => 'sales.top_products',       'class' => 'ranking',  'period' => 'today'],
        ],
        // accountant, purchasing_officer, viewer — port the existing four
        // role boards the same way.
    ],

    'business' => [
        'default' => [ /* ... */ ],
        'retail_shop' => [ /* ... */ ],
        // ...all 17, geometry stripped
    ],

    'aliases' => [ /* unchanged — copy verbatim from dashboard_presets.php */ ],
];
```

**Porting rule, mechanical:** for each card in each of the 21 existing boards,
keep `reading_key` (renamed `key`), `period`, and drop everything else. Derive
`class` from the reading's shape using the table in §6.2 — do not hand-pick it,
and do not keep the old `chart` value (the chart is decided by the slot and the
shape, §8). Preserve the original order. The accent moves to the frame, so drop
`style.accent` here entirely.

> The 16 `aliases` stay. They are the honest part of the old system: they say
> "a tailor's *card priorities* look like a small manufacturer's", which is
> true. What was dishonest was inheriting a tailor's *layout* from it too.

### 6.2 Card classes

A class is derived from the reading's `shape` in `ReckonerRegistry`. It is not
a free field.

| Class | Reckoner shape | Notes |
|---|---|---|
| `headline` | `SCALAR` | Exactly one per board; it takes the accent slot |
| `kpi` | `SCALAR` | Every other scalar |
| `status` | `STATUS` | |
| `gauge` | `GAUGE` | |
| `trend` | `SERIES`, `MULTI_SERIES` | The only class that may occupy a `hero` slot |
| `breakdown` | `BREAKDOWN` | |
| `ranking` | `RANKING` | **Renders as a list, never a time-series chart** — §8 |
| `ledger` | `TABLE` | |
| `feed` | `FEED` | |

Write this as `App\Services\Dashboard\CardClass::forShape(string $shape): string`
and have it throw on an unknown shape, so adding a tenth shape to
`ReckonerShape` fails loudly here instead of silently defaulting.

### 6.3 `App\Services\Dashboard\FrameFiller`

The whole fill algorithm. One class, one public method.

```php
public function fill(string $frameKey, User $user, Tenant $tenant, string $role): array
```

Steps, in this exact order:

1. **Load the frame.** `FrameRepository::find($frameKey)` — checks
   `dashboard_frames` for the tenant first, then `config/dashboard_frames.php`.
   Unknown key → fall back to `classic` and log a warning. Never throw at a user
   looking at their takings.

2. **Load the pool.** Resolution is unchanged from
   `Api\DashboardController::presetBoard()`: `roles.<role>` for the four
   task-shaped roles, else `business.<preset>` resolved through
   `BusinessTypes::presetFor()` then `aliases`, else `business.default`.

3. **Filter the pool.** `Reckoner::checkAvailability($keys, $user, $tenant)` —
   drop every reading the user cannot see for permission, plan, capability or
   module reasons. This is the existing call; do not reimplement it.

4. **Classify.** Attach `class` (from `CardClass::forShape()`) and `chart`
   (from §8's resolver) to each survivor.

5. **Assign.** For each slot in the frame, in slot order:
   - Walk `slot.accepts` in order. For each accepted class, take the
     highest-priority unused pool entry of that class **whose chart's legibility
     floor is at or below the slot's category** (`LayoutLaw::isCategoryLegal()`).
   - First match wins. Mark it used. Move to the next slot.

6. **Handle the leftovers.**
   - **Unfilled slot** — the pool ran out of anything that fits. The slot
     renders as an **empty slot placeholder**: dashed outline, centred "Add a
     card" button, at the slot's exact span. It does **not** collapse and the
     board does **not** re-pack. A frame is a shape the user chose; a hole in it
     is an invitation, not a bug. (This is the single biggest behavioural change
     from the old system, which re-packed and produced a different shape for
     every store.)
   - **Unused pool entries** — discarded. They remain available in "Add card".

7. **Accent.** Put `style.accent = true` on the card in `frame.accentSlot`, and
   only there. Then run `LayoutLaw::enforceAccentBudget()` as a belt-and-braces
   check. If that slot went unfilled, promote the first filled `metric` or
   `strip` slot; if there is none, the board carries no accent — that is legal.

8. **Emit.** Each filled slot becomes a `DashboardCard` row carrying the slot's
   `x`, `y`, `w`, `h`, `category`, `fit` and `frame_slot`, plus the pool entry's
   `reading_key` and `period` and the resolved `chart`.

9. **Sanitize.** Pass the whole board through `DashboardSanitizer::sanitize()`
   before persisting. It is already the write path; do not bypass it.

### 6.4 Delete the old packer

`Api\DashboardController::getDefaultRoleCards()` and `::presetBoard()` are
replaced by `FrameFiller`. Delete the shelf-packing loop entirely — the
`$x`/`$y`/`$rowH` block around lines 740–770. It is the source of defect (b) in
§1 and nothing else should ever compute a position again.

`App\Services\Dashboard\DashboardRegistry` is the **retired widget system** —
its `SIZES` const uses a `w ∈ {2,4,6,8} / h ∈ {4,6,8}` convention that belongs
to no law. Check `routes/web.php` and grep for `DashboardRegistry::` before
deleting; if `ModuleNavBuilder::cards()` is its only remaining caller, remove
both. If anything live still calls it, leave it and open a follow-up — do not
half-delete it.

---

## 7. Words — terminology on card titles

The user's requirement: *"our system should be smart enough to understand what
business that is and change the name of the things for them."*

The machinery exists and card titles are the one surface never wired into it.

**What exists:** `tenant_terminology` → `App\Support\Terms::get($key, $type)` →
used by `ModuleNavBuilder::label()` for nav, and shared to React as
`props.terms` consumed by `useTermText()`.

**What is missing:** `ReckonerRegistry` entries carry `label` and `generic` but
no `term` key — verified, zero occurrences of `'term' =>` in the file. And
`App\Reckoner\ReckonerLabels` says in its own docblock that the business-type
override map "is declared here so Phase 4 settings screens have one place to
extend it, but no registry entry currently opts into a per-business-type
override."

**Do this:**

1. Add an optional `'term' => 'customer'` (etc.) key to every `ReckonerRegistry`
   entry whose label contains a renameable noun. Start with the obvious ones —
   `sales.top_customers` → `customer`, `sales.top_products` → `product`,
   `party.supplier_count` → `supplier`, `inventory.*` → `stock`,
   `purchasing.*` → `purchase`, `staff.*` → `staff`, `sales.*` → `sale`.
2. Extend `ReckonerLabels::resolve()` to substitute the term **after** the
   signed-label swap, not before — a "Net Loss" must stay "Net Loss".
   Substitution is on the noun only: `"Top Customers"` with `term: customer` and
   a clinic's terminology becomes `"Top Patients"`.
3. Where a label has no `term`, it is returned unchanged. Bank Reconciliation
   stays Bank Reconciliation. That is the same fallback `ModuleNavBuilder`
   already uses.
4. Never let terminology touch the **reading key**. `sales.top_customers` stays
   `sales.top_customers` forever; only the rendered string changes. A term that
   leaks into a key is a cross-tenant data bug waiting to happen.

**Acceptance:** a tenant whose `tenant_terminology` maps `customer → Patient`
sees "Top Patients" on the card and "Patients" in the sidebar, from the same
source, with no second list anywhere.

---

## 8. Charts — ranked lists are lists, not graphs

### 8.1 The defect

A ranking fed to a time-series renderer. Confirmed by reading the code:

- `sales.top_products` is registered with `'shape' => ReckonerShape::RANKING`.
- `layout-law.json` → `chartLegality.RANKING` is `["bar", "table", "funnel"]`,
  so `bar` is the **default** (first entry wins).
- `resources/js/Dashboard/chartRegistry.js` line 22 maps
  `bar → SeriesChart` with `chartType: 'bar'`.
- `SeriesChart.jsx` is the **time-series** renderer — it imports `XAxis`,
  `YAxis`, `Grid` and a time-scale tooltip.

So "Top Products" renders as a chart with a time axis for data that has no time
axis. `BREAKDOWN` has the same defect: it also lists `bar`, which also routes to
`SeriesChart`.

### 8.2 The fix

**(a) New chart type `list`, new renderer.**

Create `resources/js/Dashboard/charts/RankedListChart.jsx`. One row per item:
rank number, name, value right-aligned, and a proportional rail behind the row
scaled to the largest value. This is the same visual language as
`SliceLegend` inside `BreakdownChart.jsx` (lines ~154–175) — read that first and
match its hover contract: hovering a row lights it and dims its siblings,
`onMouseEnter` / `onMouseLeave` / `onFocus` / `onBlur` all wired, `is-on` /
`is-dim` classes.

Rows shown by fit: 3 rows at h=2, 5 at h=3, 7 at h=4, 10 at h≥6. Derive from
the card's `h`, never a prop typed at the call site.

**(b) Change `chartLegality` in `layout-law.json`:**

```jsonc
"RANKING":   ["list", "table", "bar"],   // was ["bar","table","funnel"]
"BREAKDOWN": ["pie", "ring", "sunburst", "funnel"]   // "bar" removed
```

`funnel` leaves `RANKING`: a funnel means stages of one process narrowing, not
items ordered by size. It stays legal for `BREAKDOWN`, which is where it
belongs.

**(c) Add `list` to `chartCategories` and `chartDefaultCategory`:**

```jsonc
"chartCategories":       { "list": ["C3", "C4", "C5", "C6"] },
"chartDefaultCategory":  { "list": "C4" }
```

A three-row ranked list is readable in a C3 — that is its floor.

**(d) Make `chartRegistry` shape-aware.** This is the structural fix, and
without it the bug comes back the next time someone adds a shape:

```js
export function getChartComponent(type, shape) { ... }
```

`bar` resolves to `SeriesChart` **only** when `shape` is `SERIES` or
`MULTI_SERIES`. For `RANKING` it resolves to `RankedListChart` in bar mode
(horizontal bars, one per item). For `BREAKDOWN` it is no longer legal at all.
Every call site must pass the shape; it is already on the reading definition.

**(e) Add `list` to `CHART_LABELS`** as `'Ranked list'`.

**(f) Guard test.** `tests/tests/Feature/Dashboard/ChartRoutingGuardTest.php`:
iterate `ReckonerRegistry::all()`, and for every reading whose shape is
`RANKING`, `BREAKDOWN`, `TABLE` or `FEED`, assert `getChartComponent()` never
returns `SeriesChart` for any of its legal charts. This is a law in the sense
`tests/tests/Feature/Reckoner/Laws/` means it — it covers readings that do not
exist yet.

**(g) Migration for stored cards.** Existing rows with
`chart = 'bar'` on a RANKING reading, and `chart = 'funnel'` on a RANKING
reading, become `chart = 'list'`. Existing `chart = 'bar'` on a BREAKDOWN
reading becomes `chart = 'pie'`. Write it as a data migration, scoped by
`reading_key`, resolving the shape from the registry — **not** a hardcoded key
list, which would go stale.

---

## 9. Custom frames, saving, and assigning to staff

The requirement: *"we should not fix someone to follow our preset, but out of
the box the preset should give them that. If they want to create their own,
there should be an option. And if I want to create a layout for my employee —
if it is a cashier — I would define the layout and he won't be able to change
it."*

### 9.1 Three behaviours, three states

| The user does | What happens |
|---|---|
| Picks a frame from the 8 | Board is re-flowed by `FrameFiller`. `frame_key` set, `frame_dirty` false. Existing cards are **kept where the frame has a compatible slot** and re-placed; the rest go back to the pool. Ask before discarding anything. |
| Drags / resizes / deletes a card | `frame_dirty = true`. The board is now the user's own arrangement. Nothing re-flows it again without asking. |
| "Save as my layout" | The current arrangement's geometry is extracted into a `dashboard_frames` row. Reading keys are **not** saved — a frame is geometry. The new frame appears in the picker beside the 8. |

Dirty state matters: without it, a plan change or a new module could silently
re-flow a board the owner spent an afternoon arranging.

### 9.2 `FrameValidator`

A custom frame is validated before it is stored. Reject, with a readable
message, any frame where:

1. A slot overflows: `x + w > 12`.
2. Two slots overlap any cell.
3. Any cell inside the frame's row range is empty.
4. `w`/`h` is not a declared fit of exactly one category (§4).
5. Slot count is outside 1–40 (`DashboardSanitizer` already caps boards at 40).
6. `accent_slot` names a slot that does not exist.

Rules 1–3 are the same three checks §3.3 ran over the eight shipped frames.
Write the check once, in PHP, and have both the shipped-frame test and this
validator call it. **Do not write it twice.**

### 9.3 Assigning a locked layout to an employee

**This already exists and mostly works.** `Api\DashboardController::publish()`
(POST `/api/dashboards/{id}/publish`) takes `for_role` and `is_locked`, copies
the source board's cards onto a tenant-wide role template
(`user_id = null`, `slug = default-<role>`), and propagates the lock to the
personal dashboards of every user currently holding that role in
`tenant_users`. It is gated on `admin.settings_manage`.

What it needs:

1. **Carry the frame.** Copy `frame_key` and `frame_dirty` onto the template and
   onto every propagated personal dashboard. Today only cards are copied, so a
   published board loses the frame it was built from.
2. **Enforce the lock on write.** `assertCanEdit()` currently allows a member to
   edit their own dashboard unconditionally — it checks ownership, not
   `is_locked`. Add: if `$dashboard->is_locked` and the user lacks
   `admin.settings_manage`, abort 403. Check this on **every** write path:
   `update`, `saveLayout`, `addCard`, `updateCard`, `removeCard`, `reset`.
   *Without this the lock is decorative.*
3. **Show it.** A locked board renders its builder controls disabled with a
   one-line explanation ("Your manager set this layout"), not hidden. Hidden
   controls read as a broken page.
4. **Per-user, not only per-role.** The requirement says "a layout for my
   employee", which may be one person rather than a whole role. Add an optional
   `for_user_id` to the publish payload; when present, write the template
   against that user instead of the role. Keep `for_role` working — most stores
   will want the role.

### 9.4 Permissions

No new permission keys. Reuse:

- `admin.settings_manage` — publish, lock, assign, edit a shared frame.
- Own-dashboard editing stays self-service (it is baselined in
  `permission_ratchet.yaml`), subject to the lock check above.

Any new write route needs `->middleware('permission:…')` or
`PermissionBypassGuardTest` fails the build. See `CLAUDE.md` § Security rules.

---

## 10. Sidebar frames

Six sidebar shapes, same principle: the shape is the user's choice, the
*contents* stay derived.

**Nothing about nav contents changes.** `App\Support\ModuleNavBuilder::build()`
stays exactly as it is — nav is derived from enabled modules, filtered by
live-status and permission, labelled through `Terms::`. Its own docblock
explains why a stored nav is a sync-bug generator, and it is right. A sidebar
frame chooses **how the derived list is presented**, never what is in it.

### 10.1 Where it lives today

`resources/js/Layouts/OneGlanceLayout.jsx` — one sidebar, two states:
`280px` expanded / `88px` collapsed (line ~1323), with hover-to-expand
(`handleSidebarMouseLeave`, `wasHoverExpandedRef`) and a mobile drawer. That
hover-expand behaviour becomes **one of the six**, not the only one.

### 10.2 The six

| # | Key | Name | Width | Labels | Behaviour |
|---|---|---|---|---|---|
| 1 | `rail` | **Rail** | 88px fixed | Tooltip on hover only | Never expands. Maximum canvas. For power users who know the icons |
| 2 | `rail_hover` | **Rail + Reveal** | 88 → 280px | On reveal | Today's behaviour, kept exactly: hover expands, mouse-leave collapses, a click inside cancels the auto-collapse |
| 3 | `expanded` | **Expanded** | 280px pinned | Always | No collapse. What most people want on a desktop |
| 4 | `sections` | **Sections** | 280px pinned | Always, under group headers | Items grouped by `module.group`, each group collapsible, state remembered per user |
| 5 | `compact` | **Compact** | 220px pinned | Always, smaller | 32px rows, one step down the type scale. For stores with many modules enabled |
| 6 | `topbar` | **Top Bar** | 0 | Always | No sidebar. Horizontal nav across the top with an overflow "More" menu; content is full-bleed. Best on tablets and at the till |

### 10.3 Rules that bind all six

- **Widths are tokens, not literals.** Add `--vq-nav-w-rail: 88px`,
  `--vq-nav-w-compact: 220px`, `--vq-nav-w-full: 280px` to the V6 token folder
  (`extras/Design System/VenQore Design System/tokens/`). Per `CLAUDE.md`, the
  V6 token folder is the only place a *value* may be typed. The `88` and `280`
  currently inline in `OneGlanceLayout.jsx` move there.
- **Mobile is not a frame.** Below the `lg` breakpoint every frame collapses to
  the existing drawer. `topbar` is the one exception: it is already horizontal,
  so on mobile it becomes the bottom nav described in
  `SPEC_MOBILE_BOTTOM_NAV.md`. Read that spec before touching it.
- **`sections` needs group labels.** `ModuleNavBuilder::build()` already returns
  `group` on every item (from `config/modules.php` → `module.group`). It returns
  the raw key. Add a `groups` map to `config/modules.php` giving each group key a
  display label, and route that label through `Terms::` like everything else.
- **`topbar` and `hideSidebar`.** `OneGlanceLayout` already takes a
  `hideSidebar` prop. `topbar` is not that prop — `hideSidebar` means "this page
  has no nav at all" (POS full-screen). Keep them separate.
- **Persist per user, per store.** `user_preferences` (the
  `App\Models\UserPreference` model exists) gets `sidebar_frame`. Not
  `layout_preferences` — that table's docblock scopes it to dashboard card
  arrangements and it should stay that way.
- **An owner may set a staff member's sidebar frame** through the same publish
  path as §9.3, and lock it. A cashier given `rail` cannot switch to `expanded`.

### 10.4 What I could not specify

The six above are my design — you had not sent yours when this was written.
Treat §10.2 as a proposal: the *mechanism* (frame key, token widths, per-user
persistence, owner override) is solid and should be built either way, but swap
the six shapes for yours when you have them. Nothing in §10.3 changes if you do.

---

## 11. Restoring the bklit hover animations

### 11.1 What "bklit" is here

The chart library is vendored in full at `resources/js/Components/Charts/`
(~120 files, TypeScript), bridged to V6 tokens by
`resources/css/bklit-bridge.css`, which **is** imported — `app.css` line 16.
The bridge is not the problem.

### 11.2 Root cause — found, not guessed

The hover interactions were never deleted. They are in the vendored library and
they are switched off at the call site.

`resources/js/Components/Charts/line.tsx` and `area.tsx` both:

- import `SeriesHoverDim` and `SeriesMarkers`,
- always wrap their stable visuals in `<SeriesHoverDim dimOpacity={0.3} …>`,
- and render `<SeriesMarkers …>` **only when `showMarkers` is true**, which
  **defaults to `false`** (`line.tsx` line 215, `area.tsx` line 150).

`SeriesMarkers` is the component that produces the effect you remember: it takes
`fadeOnHover` (default true), `inactiveOpacity` (0.5), `inactiveBlur` (2) and
`showActiveHighlight` (true) — hover a point and every other marker fades and
blurs while the hovered one is ringed and highlighted.

In `resources/js/Dashboard/charts/SeriesChart.jsx`, `showMarkers` is passed in
exactly **two** places, both conditionally:

```jsx
line 329:  showMarkers={variant === 'line' && rows.length <= 14}
line 405:  showMarkers={variant === 'dots' || rows.length <= 12}
```

And the `<Area>` composition (around line 248), the `<SeriesBar>` paths (236,
308) and the profit-and-loss path pass it **not at all**.

So:

1. **Area charts have no hover markers, ever.** `area` is the default chart for
   `sales.revenue_trend` and appears on nearly every seeded board — which is why
   it looks like the animations vanished product-wide.
2. **Where markers are passed, they are gated on point count.** A 12-month trend
   (12 rows) gets them; a 30-day or 90-day period does not. Changing the period
   silently turns the hover behaviour off.

### 11.3 The fix

1. Pass `showMarkers` on **every** `<Line>` and `<Area>` in `SeriesChart.jsx`,
   including the area, profit-and-loss and composed paths.
2. **Decouple hover from point count.** Dense series should not draw 90 resting
   dots, but the hover highlight must still work. Read
   `series-point-marker.tsx` and confirm that `radius={0}` suppresses the
   resting marker while `showActiveHighlight` still renders on hover. If it
   does, the rule is: `showMarkers` always true, `radius` 5 when
   `rows.length <= 14` and 0 above it. If it does not, extend
   `SeriesPointMarker` so it can — and say so in the PR rather than restoring
   the count gate.
3. Verify `SeriesBar` and the bar path have an equivalent hover treatment.
   `series-highlight-layer.tsx`, `highlight-segment.tsx` and
   `chart-legend-hover.tsx` are all vendored and all currently unimported by any
   VenQore wrapper — check each and wire the ones that apply.
4. Keep `CHART_MOTION` and `useChartMotion()` from `kit.jsx` in charge of
   duration and easing. bklit's own 1100ms default is illegal under V6; the
   wrapper's 520ms / `cubic-bezier(.22, 1, .36, 1)` is correct and must not be
   bypassed by a prop typed at a call site.
5. Respect `prefers-reduced-motion`. `useReducedMotion()` already exists and
   sets `animate={false}` rather than a 1ms animation. Hover *states* may still
   change colour under reduced motion; hover *animations* must not.
6. **Find out when it broke**, so it does not break again the same way:
   `git log -S'showMarkers' -- resources/js/Dashboard/charts/SeriesChart.jsx`.
   If a commit removed an unconditional `showMarkers`, name it in the PR.

### 11.4 Test

`tests/` cannot assert on hover, so guard it structurally:
a Vitest/JSX test asserting that every `<Line>` and `<Area>` element rendered by
`SeriesChart` receives a defined `showMarkers` prop. A prop that is never absent
cannot be silently dropped again.

---

## 12. Files — exhaustive

### Create

| Path | What |
|---|---|
| `config/dashboard_frames.php` | The 8 frames, slots only |
| `config/dashboard_pool.php` | Business + role card pools, no geometry |
| `app/Services/Dashboard/FrameFiller.php` | §6.3 |
| `app/Services/Dashboard/FrameRepository.php` | Tenant frames, then config frames |
| `app/Services/Dashboard/FrameValidator.php` | §9.2, shared with the test |
| `app/Services/Dashboard/CardClass.php` | shape → class |
| `app/Models/DashboardFrame.php` | |
| `database/migrations/*_add_frame_to_dashboards.php` | §5.1 |
| `database/migrations/*_create_dashboard_frames_table.php` | §5.2 |
| `database/migrations/*_add_frame_slot_to_dashboard_cards.php` | §5.3 |
| `database/migrations/*_migrate_ranking_charts_to_list.php` | §8.2(g) |
| `resources/js/Dashboard/charts/RankedListChart.jsx` | §8.2(a) |
| `resources/js/Dashboard/components/FramePicker.jsx` | The 8 + custom, with wireframe thumbnails |
| `resources/js/Dashboard/components/EmptySlot.jsx` | §6.3 step 6 |
| `tests/tests/Feature/Dashboard/FrameGeometryLawTest.php` | §13 |
| `tests/tests/Feature/Dashboard/FrameFillerTest.php` | §13 |
| `tests/tests/Feature/Dashboard/ChartRoutingGuardTest.php` | §8.2(f) |
| `tests/tests/Feature/Dashboard/DashboardLockTest.php` | §9.3(2) |

### Change

| Path | Change |
|---|---|
| `resources/layout-law.json` | +11 fits (§4.1); `chartLegality` RANKING/BREAKDOWN; `list` in `chartCategories` + `chartDefaultCategory` (§8.2) |
| `app/Http/Controllers/Api/DashboardController.php` | Delete `getDefaultRoleCards()` packer + `presetBoard()`; call `FrameFiller`; lock checks on all write paths; `for_user_id` on publish; carry `frame_key` through publish |
| `app/Models/Dashboard.php` | `frame_key`, `frame_dirty` |
| `app/Models/DashboardCard.php` | `frame_slot` |
| `app/Reckoner/ReckonerRegistry.php` | `'term' =>` on renameable readings (§7) |
| `app/Reckoner/ReckonerLabels.php` | Terminology substitution after the signed swap (§7) |
| `resources/js/Dashboard/chartRegistry.js` | `getChartComponent(type, shape)`; `list`; `CHART_LABELS` (§8.2 d, e) |
| `resources/js/Dashboard/charts/SeriesChart.jsx` | `showMarkers` everywhere; decouple from point count (§11.3) |
| `resources/js/Layouts/OneGlanceLayout.jsx` | Six sidebar frames; widths from tokens (§10) |
| `extras/Design System/VenQore Design System/tokens/` | `--vq-nav-w-rail` / `-compact` / `-full` |
| `config/modules.php` | Group display labels for the `sections` frame |
| `CLAUDE.md` | Add `config/dashboard_frames.php` and `config/dashboard_pool.php` to the source-of-truth map |
| `VENQORE_LAYOUT_LAW.md` | Document the 11 new fits |

### Delete

| Path | Only after |
|---|---|
| `config/dashboard_presets.php` | `dashboard_pool.php` is ported and `FrameFiller` is green |
| `app/Services/Dashboard/DashboardRegistry.php` | Confirming no live caller — §6.4 |

---

## 13. Tests and acceptance criteria

A task is not complete until its criterion passes. `CLAUDE.md`: no
`markTestSkipped`, no `assertTrue(true)`. After adding test files run
`php tests/Scripts/update_suites.php`.

**`FrameGeometryLawTest`** — iterates every frame in `config/dashboard_frames.php`
*and* every row in `dashboard_frames`, asserting for each:

1. No slot overflows column 12.
2. No two slots share a cell.
3. No cell in the frame's row range is empty.
4. Every `w`x`h` is a declared fit of the stated category, and the stated
   category's max is not exceeded.
5. `accentSlot` is null or names a real slot.

Like the eight Reckoner laws, this covers frames that do not exist yet. **Adding
a frame requires zero new test code.**

**`FrameFillerTest`**

- A tenant with no products, no parties and no purchases fills `classic` and
  gets a board with empty slots, not a re-packed board of a different shape.
- The same frame filled for a retail tenant and a salon tenant produces boards
  with **identical geometry** and **different reading keys**.
- Exactly one card carries `style.accent`, and it is in `accentSlot`.
- No card is assigned to a slot below its chart's legibility floor.
- A cashier fills from `roles.cashier`, not from the business pool.

**`ChartRoutingGuardTest`** — §8.2(f).

**`DashboardLockTest`** — a member of a role whose dashboard is locked gets 403
from `update`, `saveLayout`, `addCard`, `updateCard`, `removeCard` and `reset`;
a user with `admin.settings_manage` does not.

**Existing suites that must stay green:** the eight Reckoner laws
(`tests/tests/Feature/Reckoner/Laws/`), `PermissionBypassGuardTest`,
`permission_ratchet.yaml`. The suite runs 2,638 tests with none skipped — keep
it that way.

**Manual acceptance, on a real store:**

- Pick each of the 8 frames in turn. Each renders with 24px outer margin, 24px
  gutters, no horizontal scroll, and no visible hole other than a deliberate
  empty slot.
- Hover a revenue-trend card over a 90-day period. The markers fade, the hovered
  point is ringed, the other series dim.
- Open Top Products. It is a ranked list. It has no axis.
- Set `customer → Patient` in terminology. The sidebar says Patients and the
  card says Top Patients.
- As an owner, publish a locked `classic` board to the cashier role. Sign in as
  a cashier: the board is `classic`, and every builder control is visibly
  disabled.

---

## 14. Build order

Each phase leaves the app working. Do not start a phase before the previous one
is green.

| Phase | Work | Done when |
|---|---|---|
| **−1** | §16 — diagnose and fix the zero-value cards; add the `unavailable` state and the L9 reconciliation law | Every §16.9 acceptance line passes on a real store |
| **0** | Add the 11 fits to `layout-law.json`. Change nothing else. | Existing boards render unchanged; `LayoutLaw::validate()` still passes on every seeded board |
| **1** | Migrations (§5). No behaviour change. | Migrations run forward and back on MariaDB 10.5 |
| **2** | `config/dashboard_frames.php` + `FrameValidator` + `FrameGeometryLawTest` | All 8 frames pass the geometry law |
| **3** | `config/dashboard_pool.php` ported from `dashboard_presets.php` | Pool keys are a subset of `ReckonerRegistry::all()`; no geometry key anywhere in the file |
| **4** | `CardClass`, `FrameRepository`, `FrameFiller` + `FrameFillerTest` | New stores seed through `FrameFiller` on `classic` |
| **5** | Delete the old packer and `dashboard_presets.php` | `grep -r dashboard_presets` returns nothing |
| **6** | `FramePicker`, `EmptySlot`, frame switching, `frame_dirty` | A user can switch frames and the board re-flows |
| **7** | Save-as-frame, publish with frame, lock enforcement, `for_user_id` | `DashboardLockTest` green |
| **8** | Chart legality: `RankedListChart`, shape-aware registry, data migration | `ChartRoutingGuardTest` green; Top Products is a list |
| **9** | bklit hover restoration | Hover works on area, line and bar at every period length |
| **10** | Sidebar frames + nav width tokens | Six frames switchable and persisted |
| **11** | Terminology on card titles | A renamed noun appears on cards and nav from one source |

Phases 8 and 9 are independent of 0–7 and can be done in parallel by a second
pair of hands.

**Phases 12–16 are in §17.7.** They are what puts any of this on screen; Phase 12 (removing invented figures) comes before all of them.

---

## 15. Decisions this spec makes, and what it does not

**Made here, deliberately:**

- Eight frames, not six. The eight supplied are all geometrically distinct and
  all verify clean; cutting two would throw away work for no gain.
- Frames named for shape, never for trade.
- An unfilled slot stays an empty slot. The board does not re-pack. This is the
  behaviour that makes "the same layout no matter what card is inside it"
  actually true, and it is the single largest change from today.
- `grid-auto-flow: dense` is rejected in favour of explicit placement.
- `funnel` is removed from `RANKING`.
- `classic` is the default frame for a new store.

**Not decided here — you need to rule on these:**

0. **Which branch of §16.5 this store is on.** Four queries settle it; I
   could not run SQL against `venqore_pos` from here, so §16 gives the
   decision tree rather than naming the branch.

1. **The `command` accent.** An accent-filled 12x5 hero may be too much colour.
   Options: keep it, or let `command` carry no accent. §3.5.
2. **The six sidebar shapes.** §10.2 is my proposal, written because yours had
   not arrived. The mechanism is right either way; swap the shapes when you have
   them.
3. **Which readings get a `term`.** §7 lists the obvious ones. The full pass
   over `ReckonerRegistry` needs your eye — you know which words a Pakistani
   kiryana store actually uses.
4. **Whether `DashboardRegistry` can be deleted.** Depends on live callers; §6.4
   says check before cutting.


---

## 16. Cards must show real numbers — the zero-value defect

**Priority: this ships before anything else in this document.** A frame system
that arranges cards correctly is worthless if the cards inside it read Rs 0.

### 16.1 What was observed

On store `amd-outlets-1`, on 15 Sep 2026, the dashboard and the transactions
page disagree completely about the same rows:

| | Transactions page | Dashboard card |
|---|---|---|
| Total sales | **Rs 2,282,043.43** (2,592 records) | Revenue Trend, 30-day window: **Rs 0**, flat |
| Unpaid / due | **Rs 757,353.01** | Receivables: **Rs 0** |
| Sales on 14 Sep | nine invoices, ~Rs 15,000 | Payment Breakdown: **empty**; Top Products: **0** |

Meanwhile the right-hand rail — which does **not** go through the Reckoner —
shows Cash in hand **Rs −180,381.23** and a Recent Activity list with real
figures (+Rs 20, +Rs 510, +Rs 940, −Rs 220).

So: the data exists, one reader finds it, the other returns zero. **The cards
are connected. What they are connected to is returning nothing, and doing it
silently.**

### 16.2 One correct zero — do not "fix" it

`Revenue · Today` showing **Rs 0** on 15 Sep is **right**. The most recent sale
is dated 14 Sep. A card that says Rs 0 when the true answer is Rs 0 is working.

This matters because `CLAUDE.md` rule 4 is *"never render a placeholder or
sample figure in a tenant-facing build"*. The fix for this defect is never to
make a number appear. It is to make the reader find the rows that exist. If
after the fix a card still reads zero and the underlying rows are genuinely
zero, that card is done.

### 16.3 Why it fails silently — three mechanisms, all found in the code

The dashboard has **two independent data paths**, and each has its own way of
returning zero without raising anything.

#### Mechanism 1 — the sales-table path filters on `status` + `posted_at`

Cards affected: Payment Breakdown, Live Sales Feed, Top Products, Hourly
Heatmap, Max Sale.

`app/Reckoner/Sources/SalesSource.php`:

```php
// payment_breakdown (line ~80), hourly_heatmap (~130), live_feed (~159), max_sale (~186)
DB::table('sales')
    ->where('tenant_id', $ctx->tenant->id)
    ->where('status', 'posted')
    ->whereBetween('posted_at', [...])
```

`app/Services/FinancialReportingService::getGrossProfitByProduct()` (line ~298):

```php
->whereIn('sales.status', ['posted', 'partially_returned', 'returned'])
->whereBetween('sales.posted_at', [$start.' 00:00:00', $end.' 23:59:59'])
```

Now compare the page that **works** —
`app/Http/Controllers/TransactionController.php` (lines ~21–57):

```php
DB::table('sales')
    ->select('sales.created_at as date', ..., 'sales.payment_status', ...)
```

It filters on **neither** `status = 'posted'` **nor** `posted_at`. It reads
`created_at` and `payment_status`. And the UI confirms the vocabulary: the
transactions list shows `PAID`, `UNPAID`, `COMPLETED` and `SETTLED` — the word
`posted` appears nowhere on screen.

If this store's sales carry a status other than `posted`, or a null
`posted_at`, every query in the first group returns **zero rows**. An empty
result set does not throw. This is the exact failure `CLAUDE.md` already
documents for the purchase island: *"An emptied table does not throw — it
returns zero rows — so reports, dashboards, the transactions list and the owner
emails all silently showed nothing while the suite stayed green."*

Corroborating drift inside the same file: `returns.count`, `returns.qty` and
`returns.value` (lines ~203–225) filter on **`created_at`**, while every other
reading in `SalesSource` filters on **`posted_at`**. One source, two date
columns. At least one of them is wrong.

#### Mechanism 2 — the ledger path resolves accounts, and falls back to a sentinel

Cards affected: Revenue, Revenue Trend, Net Profit, Gross Margin, Receivables,
Payables, Expenses — everything financial.

These do **not** read `sales` at all. `SalesSource::resolveBatch()` line 51:

```php
$pl = $this->reporting->getProfitAndLoss($period->start->toDateString(), ...);
$revenue = (float) $pl['revenue'];
```

And `getProfitAndLoss()` computes revenue purely from the general ledger:

```php
journal_items ⋈ journal_entries
  WHERE je.tenant_id = :t AND je.is_reversed = 0
    AND je.date BETWEEN :start AND :end
→ revenue = Σ (credit − debit) over accounts WHERE type = 'income'
```

Two silent-zero traps live here:

```php
// getProfitByPeriod(), line ~190
$incomeIds = Account::...->where('type', 'income')->pluck('id')->all();
if (empty($incomeIds)) { $incomeIds = ['00000000-0000-0000-0000-000000000000']; }
$cogsId = Account::...->where('code', '5000')->value('id')
        ?? '00000000-0000-0000-0000-000000000000';
```

**If the chart of accounts has no row typed `income`, the code substitutes a
UUID that matches nothing and every bucket sums to 0.** A perfectly flat zero
trend line, no exception, no log. `getProfitAndLoss()` does the same thing by
looping over an empty `$incomeAccounts` collection and totalling `0`.

`app/Reckoner/Sources/FinanceSource.php` line ~356 has a third:

```php
'receivables' => max(0, $net('1200', 'SUM(debit) - SUM(credit)')),
'payables'    => max(0, $net('2000', 'SUM(credit) - SUM(debit)')),
```

Hard-coded account codes `1200` / `2000`, plus a `max(0, …)` that **clamps a
negative result to zero** instead of surfacing it. Given the rail is already
showing a negative cash account, a negative intermediate here is not
hypothetical.

`CLAUDE.md` already warns that chart-of-accounts gaps are a live class of bug
in this codebase: *"accounts a new store's chart lacks are created where they
are posted (see PayrollController / SettlementService)."*

#### Mechanism 3 — the period picker's label does not match its window

Visible on screen, and cheap to fix:

- Payment Breakdown and Top Products show the chip **"Month"** and the caption
  **"Month · Aug 17 – Sep 15"**. In `ReckonerPeriod`, `this_month` resolves to
  1 Sep – 30 Sep. Aug 17 – Sep 15 is `last_30_days`. **The chip says "Month"
  and the window is a rolling 30 days.** One of the two is lying to the user.
- Live Sales Feed shows **"Today · 22:00 – 09:00"**. `today` resolves to
  `startOfDay()`–`endOfDay()`. An 11-hour window that wraps a midnight is not
  that, and a window like it would exclude the entire trading day.

`ReckonerPeriod.php` itself is correct — the bug is in what the frontend asks
for versus what it labels. Fix the caller, not the period class.

### 16.4 Diagnosis — run these before changing any code

Read-only, on `venqore_pos`. **Never wipe or refresh this database**
(`CLAUDE.md` § Database Policy). Substitute the real tenant id for `:t` and the
observed window.

**Q1 — is there a ledger at all for this window?**

```sql
SELECT COUNT(*) AS entries, MIN(date) AS first_date, MAX(date) AS last_date
FROM journal_entries
WHERE tenant_id = :t AND is_reversed = 0
  AND date BETWEEN '2026-08-17' AND '2026-09-15';
```

**Q2 — does the chart of accounts have what the reports look up?**

```sql
SELECT type, COUNT(*) FROM accounts WHERE tenant_id = :t GROUP BY type;
SELECT code, name, type FROM accounts WHERE tenant_id = :t AND code IN ('1200','2000','5000');
```

**Q3 — do the sales rows satisfy the dashboard's filters?**

```sql
SELECT status,
       COUNT(*)                     AS rows_,
       SUM(posted_at IS NULL)       AS null_posted_at,
       MIN(created_at), MAX(created_at)
FROM sales WHERE tenant_id = :t GROUP BY status;
```

**Q4 — the reconciliation, for one day that definitely has sales:**

```sql
-- operational truth
SELECT SUM(total) FROM sales
WHERE tenant_id = :t AND DATE(created_at) = '2026-09-14' AND status <> 'returned';

-- what the dashboard's ledger path sees
SELECT COALESCE(SUM(ji.credit - ji.debit), 0)
FROM journal_items ji
JOIN journal_entries je ON je.id = ji.journal_entry_id
JOIN accounts a        ON a.id = ji.account_id
WHERE je.tenant_id = :t AND je.is_reversed = 0
  AND je.date = '2026-09-14' AND a.type = 'income';
```

### 16.5 Decision tree

| Q3 shows | Meaning | Fix |
|---|---|---|
| No rows with `status = 'posted'` | The POS writes a different status word | **Do not** change the data. Establish the real status vocabulary for a completed sale, put it in one constant (`App\Support\SaleStatus`), and make every reader use it. Then fix the readers. |
| `posted_at` null on most rows | The column is not populated on the POS write path | Decide: either the write path sets `posted_at`, or every reader moves to `created_at`. **One date column for "when the sale happened", used everywhere.** Backfill existing rows in a data migration. |
| Statuses and dates look fine | The sales path is healthy; the problem is entirely Mechanism 2 | Go to Q1/Q2 |

| Q1 / Q2 shows | Meaning | Fix |
|---|---|---|
| Q1 returns 0 entries | Sales are not producing journal entries at all | Trace the POS checkout write path to `AccountingService::createEntry()`. Find where posting is skipped or swallowed. Then backfill the ledger for existing sales — a reversible, dry-run-by-default command in the style of `purchases:migrate-legacy`. |
| Q1 has entries, Q2 has no `type = 'income'` rows | The chart of accounts is missing the income type, so the sentinel-UUID fallback fires | Repair the chart of accounts for this tenant; make `StoreProvisioner` guarantee the full chart for every new store. |
| Q1 has entries, Q2 is fine, Q4 ledger ≠ operational | Entries exist but are posted to the wrong accounts or dated wrong | Compare `journal_entries.date` against `sales.created_at` for the same reference; check the account each sale credits. |

### 16.6 The structural fix — ban the silent zero

Every branch above shares one root: **a reader that cannot find what it needs
returns `0.0` and looks identical to a genuine zero.** Fix the instance, then
close the class:

1. **A missing account is an error, not a zero.** Delete both
   `'00000000-0000-0000-0000-000000000000'` sentinels in
   `FinancialReportingService`. When a required account type or code is absent
   for a tenant, the reading resolves to **`unavailable`**, not `0`.
2. **`ReckonerResult` grows an `unavailable` state.** `App\Reckoner\ReckonerResult`
   already carries `source`, `confidence`, `costUsd` and `learnable`. Add a
   status so a card can say *"Chart of accounts incomplete"* instead of *"Rs 0"*.
   A card that cannot compute must say so on its face. **This is the single most
   important change in §16** — it is what stops this class of bug hiding again.
3. **Delete `max(0, …)`** in `FinanceSource::outstanding()`. Negative
   receivables mean a real ledger problem and the owner should see it.
4. **One status constant, one date column.** No reader picks its own.
   `returns.*` using `created_at` while its neighbours use `posted_at` is the
   drift that made this possible.
5. **Tenant scope, explicitly, everywhere.** `getGrossProfitByProduct()` takes
   no `$tenantId` parameter (line 298) while its two siblings do, and it
   interpolates `{$tenantId}` straight into a `DB::raw` subquery. Give it the
   same signature as the others and bind the parameter. `CLAUDE.md` rule 2: a
   missing `tenant_id` is a cross-tenant financial leak.

### 16.7 Reconciliation test — the one that would have caught this

`tests/tests/Feature/Reckoner/Laws/L9ReconciliationTest.php`. It belongs beside
the eight existing laws because it is the same kind of rule: it iterates rather
than asserting one number.

For a seeded tenant with known sales across several days:

- `sales.revenue` over a window **equals** the sum of sale totals in that window
  computed directly from `sales`, to the paisa.
- `finance.receivables` **equals** the sum of `balance_due` on unpaid sales.
- `sales.revenue_trend` summed across its buckets **equals** `sales.revenue`
  over the same window. (Period additivity — law L3 already states this
  principle; this extends it across the two data paths.)
- Every non-empty window produces a non-zero reading for a tenant that has
  sales in it. **A silent zero fails the test.**

This is the law that makes the dashboard and the transactions page structurally
unable to disagree again.

### 16.8 A data-integrity flag, separate from the above

The transactions list shows a row dated **05-Jun-2060** (Sir Saeed Ahmad,
received Rs 12,560). A date 34 years in the future will distort `all_time`,
`last_12_months` and any max/min. It is not causing the zeros — it falls outside
the 30-day window — but it should be found and corrected, and the entry forms
should reject a transaction date more than a short way beyond today.

### 16.9 Acceptance

On store `amd-outlets-1`, with no seed data added and nothing hardcoded:

- Revenue Trend over the last 30 days shows a visible spike on 14 Sep matching
  the sum of that day's invoices.
- Receivables matches the transactions page's Unpaid / Due figure
  (Rs 757,353.01 at the time of writing) to the paisa.
- Payment Breakdown shows real slices summing to the day's takings.
- Top Products lists real products with real quantities.
- `Revenue · Today` on a day with no sales still reads Rs 0 — and is correct.
- Any card that cannot compute reads **"unavailable"** with a reason, never
  Rs 0.
- The period chip and the caption underneath it name the same window.

---

## 17. Wiring the frontend — why none of §1–§16 is on screen yet

**Status: the backend of this spec is built and verified. The product has not
changed.** Phase −1 through Phase 8 produced correct config, services, models,
migrations and guards, and a user looking at `/s/{store}/dashboard` sees exactly
what they saw before. This section closes that gap.

It also documents something found while verifying, which is more serious than
the wiring: **the live dashboard renders invented numbers when the Reckoner
returns nothing.**

### 17.1 What is actually on screen

`routes/web.php` → `DashboardController` (lines 556 and 724) renders
`Inertia::render('NewDashboard', …)`. That is
`resources/js/Pages/NewDashboard.jsx` — **5,483 lines**, plus a 459KB
`NewDashboard.css`. It is not a React card tree. It is a self-contained
imperative card engine that renders with `innerHTML` (28 sites) and exposes
itself as `window.VenQoreCards`.

Verified by grep against the shipped file:

| Thing this spec built | References in `NewDashboard.jsx` |
|---|---|
| `getChartComponent` / `chartRegistry` | **0** |
| `RankedListChart` | **0** |
| `frame_key`, `frame_slot` | **0** |
| `EmptySlot`, `FramePicker` | **0** |
| `FrameFiller` (server side) | called only from `Api\DashboardController` |

So today:

- The eight frames exist in config and reach no screen.
- **Top Products still renders as a time-series chart.** `RankedListChart.jsx`
  exists and nothing imports it.
- `FramePicker.jsx` and `EmptySlot.jsx` were created and are imported by nothing.
- The `unavailable` state added in §16 has **0** references in the engine, so a
  card that cannot compute still cannot say so.

### 17.2 The engine holds a second copy of the Layout Law

This is the root cause of the wiring gap, and it must be fixed before anything
else in §17.

`NewDashboard.jsx` declares its own geometry and legality tables as module
constants:

| Constant | Line | Duplicates |
|---|---|---|
| `LEGAL` | 1535 | `layout-law.json → chartLegality` |
| `CATS` | 1560 | `categories` keys |
| `FITS` | 1562 | every category's `fits` |
| `CAT_MAX` | ~1580 | every category's `max` |
| `MIN_CAT` | ~1556 | `chartCategories` floors |
| `DEFAULT_FIT`, `SPECIAL_FITS`, `CHART_NAME` | 1569, 1778, 1547 | assorted |

**These are stale.** `FITS` at line 1562 contains the *original eighteen* fits.
None of the eleven added in §4 are there:

```js
C3: [[4,3,"full"],[3,2,"standard"],[2,2,"compact"],[2,3,"stacked"]],   // no wide 4x2, no band 6x2
C4: [[4,4,"full"],[3,4,"standard"],[3,5,"compact"],[2,6,"list"]],      // no wide 6x3, broad 6x4, column 4x6
C5: [[6,6,"full"],[5,7,"narrow"],[4,8,"min"]],                         // no band/wideband/stage/pillar
C6: [[8,8,"full"],[6,10,"narrow"],[4,12,"min"]],                       // no banner 12x4, hero 12x5
```

And `LEGAL.RANKING` at line 1542 is still
`["bar","table","funnel","choropleth","pie","ring","radar","stat"]` — the §8
change to `["list","table","bar"]` never reached it.

**Consequence: if you wired the frames in today, every frame would break.** The
engine would receive cards at spans it considers illegal and coerce them back to
its own eighteen fits, silently reshaping every board.

The file's own comment at line ~1573 states the rule it is breaking:

> *"Everything the UI offers is generated from this — no hand-written size list
> may exist anywhere else, because a hand-written list is how a card ends up
> wider than the grid."*

That is right. The engine is the hand-written list. `CLAUDE.md`'s
source-of-truth rule — *"if you need a list of something, import it from the
authority. Do not restate it in a config file, in a JSON asset, or in a
component"* — applies here exactly.

**Fix (Phase 12, first):** delete all eight constants from `NewDashboard.jsx`
and feed the law in from the server, the way `readings` already is.
`DashboardController` already passes
`'readings' => ReckonerRegistry::v6Catalog()`. Add one prop beside it:

```php
'layoutLaw' => \App\Reckoner\LayoutLaw::law(),
```

and have the engine read `CATS`/`FITS`/`LEGAL`/`CAT_MAX`/`MIN_CAT` from that
prop via a `setLayoutLaw()` on `window.VenQoreCards`, mirroring the existing
`setReadings()`. After this, `resources/layout-law.json` is the only place any
of these numbers exist — PHP, the JS resolver and the engine all read it.

**Acceptance:** `grep -n "^const \(LEGAL\|CATS\|FITS\|CAT_MAX\|MIN_CAT\|DEFAULT_FIT\|SPECIAL_FITS\)" resources/js/Pages/NewDashboard.jsx`
returns nothing.

### 17.3 ⛔ The engine invents numbers when the Reckoner is empty

**This is the most serious finding in this document and it is not a layout
problem.**

The engine fetches live values from `POST /api/reckoner/read` (line ~426), in
chunks of 24. Two things then go wrong.

**(a) Every failure is swallowed.** Line ~440:

```js
}).catch(() => {})
```

A 500, a timeout, a permission error and the new `unavailable` state are all
discarded identically. Nothing is logged and nothing reaches the card.

**(b) When no live value arrives, the card renders seeded fake data.** Four
sites call `seed(card.key + …)`, a deterministic PRNG, and render its output as
the card's content:

| Line | Function | What it fabricates |
|---|---|---|
| 1224 | scatter/series | invented plot points |
| 1284 | `mountHeatmap` | `grid = rows.map(() => cols.map(() => Math.round(r()*100)))` — a full fake heatmap |
| 1373 | geo/regions | invented regional values |
| 1493 | `mountStatus` | `const ok = seed(card.key+"|st")() > 0.25` → renders **"Balanced"** or **"Needs review"** |

Line 1493 is the worst of them: a status card tells the owner their books are
**"Balanced"** based on a hash of the card's key. It is deterministic, so it
looks stable across reloads, which is precisely what makes it credible.

This breaks two rules already written down in `CLAUDE.md`:

> 3. Never display a number that did not come from the Reckoner.
> 4. Never render a placeholder or sample figure in a tenant-facing build.

**It also reframes §16.** I assumed the Rs 0 readings meant the ledger returned
zero. With seeded fallbacks in the render path, a card showing a plausible
figure may not be reading your data at all. **Every number on that dashboard is
now suspect until this is removed** — including any that look correct.

**Fix (Phase 12, before any frame work):**

1. Delete all four `seed()` fallbacks. A card with no live value renders the
   existing empty/skeleton state, never invented content.
2. Delete `function seed()` (line 451) once its last caller is gone, so it
   cannot come back.
3. Replace `.catch(() => {})` with a handler that stores the failure against the
   card and re-draws.
4. Render three distinct card states — `loading`, `unavailable` (with the
   message `Reckoner` now supplies, e.g. *"Chart of accounts incomplete: no
   income account is configured"*), and `empty` (computed, genuinely zero).
   §16.6 item 2 built the backend half; this is the half the user sees.

**Acceptance:** `grep -n "seed(" resources/js/Pages/NewDashboard.jsx` returns
nothing, and a card whose reading throws shows a reason rather than a number.

> Do this **before** re-running the §16.4 diagnostic queries. Once the engine
> stops inventing values and starts surfacing `unavailable`, the dashboard may
> name its own root cause on load, and Q1–Q4 become confirmation rather than
> investigation.

### 17.4 Chart routing — make the engine use the registry

`chartRegistry.js` now has the shape-aware `getChartComponent(type, shape)`, and
nothing calls it. The engine dispatches on `c.chart` alone
(`extraClass: \`vqc--chart-${c.chart}\``, line ~2512) with its own mount
functions.

Two ways forward. **Take option A.**

**Option A — teach the engine the shape rule (recommended).** The engine already
has `readingOf(card.key)`, which carries `shape`. Add the same guard the
registry has, at the engine's single dispatch point: when a card's shape is
`RANKING`, route `bar` and any time-series chart to a ranked-list mount; when it
is `BREAKDOWN`, `TABLE` or `FEED`, route time-series charts to that shape's own
mount. Port `RankedListChart.jsx`'s markup into an engine mount function
(`mountRankedList`) matching the `SliceLegend` hover contract in
`BreakdownChart.jsx` (`is-on` / `is-dim`, mouse and focus handlers).

This is a contained change to one dispatch site and keeps the engine coherent.

**Option B — replace the engine with React components.** Correct long-term, and
a rewrite of 5,483 lines plus 459KB of CSS. Do not attempt it inside this spec.

**Fix the registry bug either way.** `getChartComponent` currently falls back to
`RankedListChart` for `TABLE` and `FEED`:

```js
if (['RANKING','BREAKDOWN','TABLE','FEED'].includes(normalisedShape)
    && ['line','area','profit_loss_line','live_line','composed','scatter'].includes(type)) {
    return RankedListChart;      // wrong for TABLE and FEED
}
```

A table is not a ranked list and a feed is not either. Route by shape:
`RANKING → RankedListChart`, `BREAKDOWN → BreakdownChart`, `TABLE → TableChart`,
`FEED → FeedChart`.

**Acceptance:** Top Products renders as a ranked list with no axis; a TABLE
reading renders as a table.

### 17.5 Frames on screen

Only after 17.2 and 17.3 are green.

**Server.** `DashboardController` (both render sites) gains:

```php
'frames'      => \App\Services\Dashboard\FrameRepository::allFor($tenant),
'activeFrame' => $dashboard->frame_key,
'frameDirty'  => (bool) $dashboard->frame_dirty,
'layoutLaw'   => \App\Reckoner\LayoutLaw::law(),   // from 17.2
```

`FrameRepository` currently exposes `find()` only (949 bytes) — add `allFor()`
returning config frames plus the tenant's `dashboard_frames` rows.

**Engine.** Extend `window.VenQoreCards` alongside the existing setters:

- `setFrame(frameKey, slots)` — lay the board out by explicit slot geometry.
  Use `grid-column: x+1 / span w` and `grid-row: y+1 / span h`. **Do not use
  `grid-auto-flow: dense`** (§3.3).
- `getFrame()` — the active frame key.
- Mark `frame_dirty` on any drag, resize or delete, and `POST` it with the
  layout save.

**Empty slots.** A slot with no card renders `EmptySlot.jsx`'s markup at the
slot's exact span — dashed outline, "Add a card". It must not collapse and the
board must not re-pack (§6.3 step 6). This is the behaviour that makes a frame a
frame.

**Picker.** Mount `FramePicker.jsx` in the dashboard's settings affordance
(the control at top-right of the board). Switching frames calls `setFrame()` and
persists `frame_key`. If `frame_dirty` is true, confirm before re-flowing.

**Acceptance:** switching between all eight frames re-lays the board; each
matches its §3.5 table; a frame with more slots than available cards shows empty
slots rather than a shorter board.

### 17.6 Sidebar frames

§10 specified six sidebar frames and nothing was built. `OneGlanceLayout.jsx`
(91KB) still hardcodes `w-[280px]` / `lg:w-[88px]` at line ~1323. The V6 nav
width tokens were added per the report — use them here. This is independent of
17.2–17.5 and can be done in parallel.

### 17.7 Build order for §17

| Phase | Work | Done when |
|---|---|---|
| **12** | 17.3 — delete the four `seed()` fallbacks and `seed()`; stop swallowing errors; render loading / unavailable / empty | `grep "seed("` returns nothing; a failing reading shows a reason |
| **13** | 17.2 — delete the engine's eight law constants; pass `layoutLaw` from the server | `grep "^const FITS"` returns nothing; the 11 new fits are live in the UI |
| **14** | 17.4 — shape-aware dispatch in the engine; fix the TABLE/FEED fallback | Top Products is a ranked list |
| **15** | 17.5 — `setFrame()`, empty slots, picker, `frame_dirty` | All eight frames switchable on screen |
| **16** | 17.6 — six sidebar frames on the nav tokens | Six frames switchable and persisted |

Phase 12 first, and on its own. It is the one that stops the product showing
invented figures to a business owner, and it is small.

### 17.8 Re-verify §16 after Phase 12

The §16.4 queries were never run. Run them **after** Phase 12, not before —
with the fallbacks gone and `unavailable` rendering, the dashboard will either
show real figures or name the reason it cannot. Then confirm every §16.9
acceptance line on `amd-outlets-1`.

### 17.9 Still outstanding from earlier sections

- **§16.6 item 5 — not done.** `FinancialReportingService::getGrossProfitByProduct()`
  still takes no `$tenantId` parameter while its two siblings do, and
  interpolates `{$tenantId}` directly into a `DB::raw` subquery. `CLAUDE.md`
  rule 2: a missing `tenant_id` is a cross-tenant financial leak. Give it the
  same signature as `getProfitAndLoss()` and bind the parameter.
- **§13 — three of five test suites were not written.** `FrameGeometryLawTest`
  exists. `FrameFillerTest`, `ChartRoutingGuardTest`, `DashboardLockTest` and
  the §16.7 `L9ReconciliationTest` do not. The lock and reconciliation tests
  guard the two behaviours most likely to regress silently.
- **Database verification never ran.** MariaDB refused connections on 3306, so
  no migration executed and no database-backed test ran. The four migrations are
  unverified. Run `php artisan migrate` on a local copy — never on
  `venqore_pos` (`CLAUDE.md` § Database Policy) — before shipping.

---

## Appendix A — `config/dashboard_frames.php`, ready to paste

Verified: every frame below passes the three geometry checks in §3.3. Copy it
whole; do not retype the numbers.

```php
<?php

/*
|==============================================================================
| Dashboard frames — the eight shapes
|==============================================================================
|
| A FRAME IS GEOMETRY. It contains no reading key, no chart type, no business
| name. If you are about to add one of those to this file, you want
| config/dashboard_pool.php instead.
|
| Every slot's `category` + `fit` is DERIVED from its w x h and must be a fit
| declared in resources/layout-law.json. LayoutLaw::validate() fails any card
| whose w/h disagrees with its fit, so a typo here is caught on write.
|
| `accepts` is an ordered preference list of card classes
| (App\Services\Dashboard\CardClass). FrameFiller walks it left to right and
| takes the first available pool entry of that class whose chart's legibility
| floor is at or below this slot's category.
|
| `accent_slot` is Mechanism M1 — the one accent-filled card on the board.
|
| A slot that cannot be filled stays EMPTY. The board never re-packs. That is
| what makes "the same layout whatever card is inside it" true.
|
| Geometry cheat-sheet (layout-law.json, after this spec's eleven additions):
|   C2 inline 4x1 | C3 standard 3x2 | C3 wide 4x2 | C3 band 6x2
|   C4 standard 3x4 | C4 wide 6x3 | C4 broad 6x4 | C4 column 4x6
|   C5 band 8x3 | C5 wideband 7x4 | C5 stage 8x6 | C5 pillar 5x8
|   C6 banner 12x4 | C6 hero 12x5
*/

return [

    'spotlight' => [
        'name'        => 'Spotlight',
        'rows'        => 14,
        'accent_slot' => 1,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 4 , 'h' => 1, 'category' => 'C2', 'fit' => 'inline', 'role' => 'strip', 'accepts' => ['kpi', 'status']],
            ['slot' => 2 , 'x' => 4 , 'y' => 0 , 'w' => 4 , 'h' => 1, 'category' => 'C2', 'fit' => 'inline', 'role' => 'strip', 'accepts' => ['kpi', 'status']],
            ['slot' => 3 , 'x' => 8 , 'y' => 0 , 'w' => 4 , 'h' => 1, 'category' => 'C2', 'fit' => 'inline', 'role' => 'strip', 'accepts' => ['kpi', 'status']],
            ['slot' => 4 , 'x' => 0 , 'y' => 1 , 'w' => 12, 'h' => 4, 'category' => 'C6', 'fit' => 'banner', 'role' => 'hero', 'accepts' => ['trend', 'ledger']],
            ['slot' => 5 , 'x' => 0 , 'y' => 5 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 6 , 'x' => 6 , 'y' => 5 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 7 , 'x' => 0 , 'y' => 8 , 'w' => 4 , 'h' => 6, 'category' => 'C4', 'fit' => 'column', 'role' => 'panel-tall', 'accepts' => ['ranking', 'feed', 'breakdown']],
            ['slot' => 8 , 'x' => 4 , 'y' => 8 , 'w' => 8 , 'h' => 3, 'category' => 'C5', 'fit' => 'band', 'role' => 'stage-band', 'accepts' => ['trend', 'ledger', 'ranking']],
            ['slot' => 9 , 'x' => 4 , 'y' => 11, 'w' => 8 , 'h' => 3, 'category' => 'C5', 'fit' => 'band', 'role' => 'stage-band', 'accepts' => ['trend', 'ledger', 'ranking']],
        ],
    ],

    'headline' => [
        'name'        => 'Headline',
        'rows'        => 12,
        'accent_slot' => 4,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 12, 'h' => 4, 'category' => 'C6', 'fit' => 'banner', 'role' => 'hero', 'accepts' => ['trend', 'ledger']],
            ['slot' => 2 , 'x' => 0 , 'y' => 4 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 3 , 'x' => 6 , 'y' => 4 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 4 , 'x' => 0 , 'y' => 7 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 5 , 'x' => 4 , 'y' => 7 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 6 , 'x' => 8 , 'y' => 7 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 7 , 'x' => 0 , 'y' => 9 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 8 , 'x' => 6 , 'y' => 9 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
        ],
    ],

    'mosaic' => [
        'name'        => 'Mosaic',
        'rows'        => 11,
        'accent_slot' => 4,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 2 , 'x' => 6 , 'y' => 0 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 3 , 'x' => 0 , 'y' => 3 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 4 , 'x' => 6 , 'y' => 3 , 'w' => 6 , 'h' => 2, 'category' => 'C3', 'fit' => 'band', 'role' => 'metric-wide', 'accepts' => ['kpi', 'gauge', 'status']],
            ['slot' => 5 , 'x' => 6 , 'y' => 5 , 'w' => 6 , 'h' => 2, 'category' => 'C3', 'fit' => 'band', 'role' => 'metric-wide', 'accepts' => ['kpi', 'gauge', 'status']],
            ['slot' => 6 , 'x' => 0 , 'y' => 6 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 7 , 'x' => 6 , 'y' => 7 , 'w' => 6 , 'h' => 2, 'category' => 'C3', 'fit' => 'band', 'role' => 'metric-wide', 'accepts' => ['kpi', 'gauge', 'status']],
            ['slot' => 8 , 'x' => 0 , 'y' => 9 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 9 , 'x' => 4 , 'y' => 9 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 10, 'x' => 8 , 'y' => 9 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
        ],
    ],

    'command' => [
        'name'        => 'Command Centre',
        'rows'        => 19,
        'accent_slot' => 1,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 12, 'h' => 5, 'category' => 'C6', 'fit' => 'hero', 'role' => 'hero', 'accepts' => ['trend', 'ledger']],
            ['slot' => 2 , 'x' => 0 , 'y' => 5 , 'w' => 6 , 'h' => 4, 'category' => 'C4', 'fit' => 'broad', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 3 , 'x' => 6 , 'y' => 5 , 'w' => 6 , 'h' => 4, 'category' => 'C4', 'fit' => 'broad', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 4 , 'x' => 0 , 'y' => 9 , 'w' => 4 , 'h' => 6, 'category' => 'C4', 'fit' => 'column', 'role' => 'panel-tall', 'accepts' => ['ranking', 'feed', 'breakdown']],
            ['slot' => 5 , 'x' => 4 , 'y' => 9 , 'w' => 4 , 'h' => 6, 'category' => 'C4', 'fit' => 'column', 'role' => 'panel-tall', 'accepts' => ['ranking', 'feed', 'breakdown']],
            ['slot' => 6 , 'x' => 8 , 'y' => 9 , 'w' => 4 , 'h' => 6, 'category' => 'C4', 'fit' => 'column', 'role' => 'panel-tall', 'accepts' => ['ranking', 'feed', 'breakdown']],
            ['slot' => 7 , 'x' => 0 , 'y' => 15, 'w' => 12, 'h' => 4, 'category' => 'C6', 'fit' => 'banner', 'role' => 'hero', 'accepts' => ['trend', 'ledger']],
        ],
    ],

    'classic' => [
        'name'        => 'Classic',
        'rows'        => 9,
        'accent_slot' => 1,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 3 , 'h' => 2, 'category' => 'C3', 'fit' => 'standard', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 2 , 'x' => 3 , 'y' => 0 , 'w' => 3 , 'h' => 2, 'category' => 'C3', 'fit' => 'standard', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 3 , 'x' => 6 , 'y' => 0 , 'w' => 3 , 'h' => 2, 'category' => 'C3', 'fit' => 'standard', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 4 , 'x' => 9 , 'y' => 0 , 'w' => 3 , 'h' => 2, 'category' => 'C3', 'fit' => 'standard', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 5 , 'x' => 0 , 'y' => 2 , 'w' => 12, 'h' => 4, 'category' => 'C6', 'fit' => 'banner', 'role' => 'hero', 'accepts' => ['trend', 'ledger']],
            ['slot' => 6 , 'x' => 0 , 'y' => 6 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 7 , 'x' => 6 , 'y' => 6 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
        ],
    ],

    'workbench' => [
        'name'        => 'Workbench',
        'rows'        => 11,
        'accent_slot' => 4,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 2 , 'x' => 6 , 'y' => 0 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 3 , 'x' => 0 , 'y' => 3 , 'w' => 8 , 'h' => 6, 'category' => 'C5', 'fit' => 'stage', 'role' => 'stage', 'accepts' => ['trend', 'ledger', 'breakdown']],
            ['slot' => 4 , 'x' => 8 , 'y' => 3 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 5 , 'x' => 8 , 'y' => 5 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 6 , 'x' => 8 , 'y' => 7 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 7 , 'x' => 0 , 'y' => 9 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 8 , 'x' => 4 , 'y' => 9 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 9 , 'x' => 8 , 'y' => 9 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
        ],
    ],

    'pillar' => [
        'name'        => 'Pillar',
        'rows'        => 13,
        'accent_slot' => 4,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 5 , 'h' => 8, 'category' => 'C5', 'fit' => 'pillar', 'role' => 'board-tall', 'accepts' => ['ranking', 'ledger', 'feed', 'breakdown']],
            ['slot' => 2 , 'x' => 5 , 'y' => 0 , 'w' => 7 , 'h' => 4, 'category' => 'C5', 'fit' => 'wideband', 'role' => 'stage', 'accepts' => ['trend', 'ledger', 'breakdown']],
            ['slot' => 3 , 'x' => 5 , 'y' => 4 , 'w' => 7 , 'h' => 4, 'category' => 'C5', 'fit' => 'wideband', 'role' => 'stage', 'accepts' => ['trend', 'ledger', 'breakdown']],
            ['slot' => 4 , 'x' => 0 , 'y' => 8 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 5 , 'x' => 4 , 'y' => 8 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 6 , 'x' => 8 , 'y' => 8 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 7 , 'x' => 0 , 'y' => 10, 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 8 , 'x' => 6 , 'y' => 10, 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
        ],
    ],

    'focus' => [
        'name'        => 'Focus',
        'rows'        => 12,
        'accent_slot' => 1,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 4 , 'h' => 1, 'category' => 'C2', 'fit' => 'inline', 'role' => 'strip', 'accepts' => ['kpi', 'status']],
            ['slot' => 2 , 'x' => 4 , 'y' => 0 , 'w' => 4 , 'h' => 1, 'category' => 'C2', 'fit' => 'inline', 'role' => 'strip', 'accepts' => ['kpi', 'status']],
            ['slot' => 3 , 'x' => 8 , 'y' => 0 , 'w' => 4 , 'h' => 1, 'category' => 'C2', 'fit' => 'inline', 'role' => 'strip', 'accepts' => ['kpi', 'status']],
            ['slot' => 4 , 'x' => 0 , 'y' => 1 , 'w' => 3 , 'h' => 4, 'category' => 'C4', 'fit' => 'standard', 'role' => 'panel', 'accepts' => ['breakdown', 'ranking', 'feed']],
            ['slot' => 5 , 'x' => 3 , 'y' => 1 , 'w' => 6 , 'h' => 4, 'category' => 'C4', 'fit' => 'broad', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 6 , 'x' => 9 , 'y' => 1 , 'w' => 3 , 'h' => 4, 'category' => 'C4', 'fit' => 'standard', 'role' => 'panel', 'accepts' => ['breakdown', 'ranking', 'feed']],
            ['slot' => 7 , 'x' => 0 , 'y' => 5 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 8 , 'x' => 6 , 'y' => 5 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 9 , 'x' => 0 , 'y' => 8 , 'w' => 12, 'h' => 4, 'category' => 'C6', 'fit' => 'banner', 'role' => 'hero', 'accepts' => ['trend', 'ledger']],
        ],
    ],
];
```

---

## Appendix B — the `layout-law.json` patch

Eleven fits, appended to the `fits` array of their category. **Do not remove or
reorder an existing fit** — `defaultFit()` returns the entry flagged `default`,
and `fitsFor()` order is documented as widest-first, so append rather than
insert where you can.

```jsonc
// categories.C3.fits  (max 6x4)
{ "key": "wide", "w": 4, "h": 2, "floor": 386, "label": "Wide" },
{ "key": "band", "w": 6, "h": 2, "floor": 560, "label": "Band" },

// categories.C4.fits  (max 6x6)
{ "key": "wide",   "w": 6, "h": 3, "floor": 700, "label": "Wide" },
{ "key": "broad",  "w": 6, "h": 4, "floor": 700, "label": "Broad" },
{ "key": "column", "w": 4, "h": 6, "floor": 492, "label": "Column" },

// categories.C5.fits  (max 12x9)
{ "key": "band",     "w": 8, "h": 3, "floor": 733, "label": "Band" },
{ "key": "wideband", "w": 7, "h": 4, "floor": 660, "label": "Wide band" },
{ "key": "stage",    "w": 8, "h": 6, "floor": 733, "label": "Stage" },
{ "key": "pillar",   "w": 5, "h": 8, "floor": 415, "label": "Pillar" },

// categories.C6.fits  (max 12x16)
{ "key": "banner", "w": 12, "h": 4, "floor": 1100, "label": "Banner" },
{ "key": "hero",   "w": 12, "h": 5, "floor": 1100, "label": "Hero" }
```

And the chart-legality changes from §8.2:

```jsonc
"chartLegality": {
  "RANKING":   ["list", "table", "bar"],
  "BREAKDOWN": ["pie", "ring", "sunburst", "funnel"]
},
"chartCategories":      { "list": ["C3", "C4", "C5", "C6"] },
"chartDefaultCategory": { "list": "C4" }
```

Leave every other entry in all three tables exactly as it is.

---

## Appendix C — the geometry check, as code

This is the check §3.3 ran and the check `FrameGeometryLawTest` must run. Port
it to PHP in `FrameValidator`; it is given here in Python because that is what
verified the eight frames in this document.

```python
def check(slots):                      # slots: [(id, x, y, w, h), ...]
    rows = max(y + h for _, _, y, w, h in slots)
    grid = [[0] * 12 for _ in range(rows)]
    problems = []
    for i, x, y, w, h in slots:
        if x < 0 or x + w > 12:
            problems.append(f"slot {i} overflows the 12-column grid")
            continue
        for r in range(y, y + h):
            for c in range(x, x + w):
                if grid[r][c]:
                    problems.append(f"slot {i} overlaps slot {grid[r][c]} at row {r}, col {c}")
                grid[r][c] = i
    for r in range(rows):
        for c in range(12):
            if grid[r][c] == 0:
                problems.append(f"hole at row {r}, col {c}")
    return problems                    # empty == legal
```

Result on the eight shipped frames: **no problems, all eight.**

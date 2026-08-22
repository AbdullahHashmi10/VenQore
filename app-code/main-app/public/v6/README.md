# VenQore — public pages, V6

Sixteen new public pages built on the V6 design system. They do not touch anything
that is live: nothing here overwrites an existing route, a Blade view, a
JSX page or a controller.

```
public/v6/
  index.html          Landing — now with the assembly animation
  blueprint.html      Product · Blueprint (the AI builder)

  ── feature pages, each with a live demo ──
  pos.html            The register · 7 presets, recomposes live
  documents.html      Documents · all 13 types on one editor
  dashboard.html      The dashboard · pick a reading, the card lands
  smartcapture.html   SmartCapture · photo / voice / screenshot → transaction
  reckoner.html       The Reckoner · one definition per figure, and history
  ledger.html         Core Ledger · the seven correctness checks
  vensynq.html        VenSynQ · five channels, one stock number

  features.html       Everything that ships, group by group + demo index
  pricing.html        Counter $18 / Starter / Growth / Scale, add-ons, AI, FAQ
  about.html          Company, beliefs, vertical coverage, the trade-off
  contact.html        Form + routes to the right answer
  signin.html         Auth · sign in
  register.html       Auth · create an account
  onboarding.html     The AI onboarding flow, working end to end
  assets/
    venqore.css       Tokens + components + demo surfaces + hero/footer (109 KB)
    venqore.js        Shared page behaviour, no dependencies             (17 KB)
    demos.js          The five live demos, no dependencies               (30 KB)
    fluid.js          Your WebGL fluid canvas, unchanged
    fonts/            Bricolage, Plus Jakarta, Space Grotesk, Instrument (161 KB)
    logo.png          ICON.png resampled to 256px                         (31 KB)
```

---

## The five live demos

Every dataset in `demos.js` is lifted from the product's own source of truth.
Nothing on these pages is invented, and each is commented with where it came from.

| Demo | Page | Source | What it does |
|---|---|---|---|
| **The register** | `pos.html` | `LAW.pos.presets` in `extras/Layout Law/venqore-pos.html` | All seven presets with their real compositions. Click one and the panes re-derive — catalogue off / left / top / overlay, tender as column / bar / sheet, floor plan on the Table preset. Auto-cycles once when it scrolls into view, then hands over. |
| **Documents** | `documents.html` | `DATA.types` in `extras/Layout Law/venqore-document.html` | All thirteen types with their real prefixes, sides, densities, save labels and capability switches. Switching type reconfigures header fields, line columns, totals rows and the on/off capability list. |
| **The dashboard** | `dashboard.html` | `READINGS` in `extras/Cards/v6/VenQore Card Builder (LIVE).html` | A 22-reading sample of the 108. Tap one and the card lands at its own natural size, headline metric takes the accent fill (M1). |
| **SmartCapture** | `smartcapture.html` | The old `FeatureDemos.jsx` pattern, rebuilt in V6 | Photo / voice note / screenshot. Scan line, waveform, narrated extraction steps, then matched lines with a deliberate unmatched one flagged as "new item". |
| **The assembly** | `index.html#assemble` | `config/modules.php` + the reading registry | **The one you asked for.** All 46 modules on screen; the ones the business asked for light up one at a time; everything else drains away; the survivors converge into the frame; the finished system appears with only its cards. Three profiles — pharmacy, café, wholesale — and a replay link. |

The assembly runs about 5.5 seconds. It auto-plays once when scrolled into
view, respects `prefers-reduced-motion` (all beats collapse to instant), and
every beat is captioned so a still screenshot still reads.

No build step, no framework, no CDN. Drop the folder in and it works.

---

## Install

```bash
# from app-code/main-app
cp -r v6 public/v6
```

`public/.htaccess` already serves real files before hitting Laravel
(`RewriteCond %{REQUEST_FILENAME} !-f`), so the pages are live immediately at:

```
https://venqore.com/v6/            → landing
https://venqore.com/v6/pricing.html
https://venqore.com/v6/onboarding.html
…
```

### Pretty URLs (optional)

If you want `/v6/pricing` instead of `/v6/pricing.html`, add this one block to
`routes/web.php`. It is deliberately namespaced under `/v6` so it cannot
collide with the live marketing routes.

```php
// ── V6 public pages (static preview) ────────────────────────────────────
Route::get('/v6/{page?}', function (?string $page = 'index') {
    $page = preg_replace('/[^a-z0-9\-]/', '', strtolower($page));
    $file = public_path("v6/{$page}.html");
    abort_unless(is_file($file), 404);
    return response()->file($file);
})->where('page', '[A-Za-z0-9\-]+')->name('v6.page');
```

### Porting to Inertia later

Every page is one flat HTML file with no inline `<style>` and no per-page
`<script>` except the onboarding wizard. Converting one to
`resources/js/Pages/V6/*.jsx` is: copy the `<main>` contents, swap `class=` for
`className=`, and import `assets/venqore.css` once in `app.css`. The header and
footer are generated from a single source (`src/shell.js`) so they become one
shared `V6Layout` component rather than sixteen copies.

The five demos live in `assets/demos.js`, which is plain ES5 with no dependencies
and no framework assumptions — it binds to `data-*` attributes, so it works
unchanged inside a React page as long as the markup survives the port.

---

## What is preserved

The hero and the footer you built in `extras/Hero Section` are carried over,
not redesigned:

- the same gradient — `#021416 → #327882 → #ecf9fb`, and the same inversion in
  dark mode
- the same camouflaged headline (white on light, black on dark)
- the same prompt row, mic button, shiny placeholder, sub-text and bouncing
  down arrow
- the same fluid WebGL canvas (`fluid.js`, byte-identical, still gated behind
  `?debug=1` for the customiser and now disabled below 768px)
- the same footer: mesh CTA card, four link columns, social pills, and the
  giant cut-off `VENQORE` watermark

Two things changed inside them, both deliberate and both reversible in one line:

1. **The copy.** The hero said "Design with AI" and "transform your ideas into
   stunning designs" — template text from the source the layout came from. It
   now says what the product is.
2. **`#327882` → the V6 teal ramp** on the watermark and the CTA card mesh.
   The gradient itself is untouched. `style.css` had already been migrated to
   `--accent: #0BAA8F`, so this finishes that move rather than starting a new one.

---

## Design system conformance

`node lint.mjs` and `node a11y.mjs` in the source folder run the sweeps.
Current state:

```
✓ every duration is --vq-dur-1..4 or the 60ms stagger
✓ no radius above the 36px ceiling
✓ no font-weight above 700
✓ z-index stays on the ladder
✓ every hex resolves to a V6 ramp or a preserved hero value
✓ 16 pages, every local link resolves
✓ one <h1> and one Instrument Serif italic word per page
✓ 0 contrast findings, light and dark
```

### Two documented deviations from the V6 semantic layer

Both are accessibility corrections, both stay inside the V6 ramps, and both are
commented at the point of change in `venqore.css`:

| Token | V6 says | Here | Why |
|---|---|---|---|
| `--vq-accent-fill` (light) | teal-600 | **teal-700** | White on teal-600 measures **4.33:1**, and 4.33 is the ceiling on that fill — no colour reaches 4.5:1 against it, so a 14px button label can never pass. teal-700 measures 6.6:1. Hover moves to teal-800 so §9's "darken one ramp step" contract is unchanged. Dark mode untouched. |
| `--vq-text-3` (light) | ink-500 | **ink-600** | ink-500 measures **4.12:1** on the ink-50 page, under the 4.5:1 floor for body text. `--vq-text-2` moves to ink-700 to keep three distinct steps. Dark mode already passes at 6.4:1. |

Semantic chips (`.vq-status`, `.vq-delta`) darken their foreground toward
ink-950 with `color-mix`, for the same reason: the V6 pairs measure 4.1–4.3:1,
which is fine at 16px and short at the 11–13px these actually render at.

**These are findings about the token files, not decisions about this site.**
If you correct them upstream in
`extras/Design System/VenQore Design System/tokens/theme.css`, delete the
override block at the bottom of `venqore.css` and nothing else changes.

---

## Numbers on these pages — verify before the site goes public

The Copy Bible's rule is "no invented proof", so every number here is the
**conservative** reading of your own audit files. Three of them need your
confirmation:

| Number | Where it appears | Source | Status |
|---|---|---|---|
| **1,610 passing tests** | landing proof, features hero, register aside | `extras/AUDIT_2026-08-13/05_COMPOSABILITY_VERDICT.md`: *"ERP core engine — 8 months, production use, 1,610 passing tests"* | ✅ Verified in your own audit. |
| **11,000+ assertions** | beside the test count | **You told me this.** | ⚠️ **Confirm before launch.** I searched every `.md` and `.txt` under `extras/` — the highest assertion figure documented anywhere is **4,357**. If 11,000+ comes from a recent full run, paste me the PHPUnit summary line and I'll cite it; otherwise drop to the number you can show. |
| **46 modules** | landing trust strip, module grid, features, assembly animation | `config/modules.php` — 46 declared (42 live, 2 beta, 2 building) | ✅ Verified by count. |
| **108 readings** | dashboard, reckoner, features, pricing matrix | `READINGS` array in the LIVE card builder; its own search box says *"Search 108 readings…"* | ✅ Verified by count. This is your "100+ cards". |
| **13 document types** | documents page, features, pricing | `DATA.types` in `venqore-document.html` | ✅ Verified by count. **Note:** there is no *credit note* type — Sale return plays that role on the sell side, Debit note on the buy side. The copy says so. |
| **1,944 distinct figures** | dashboard, reckoner | 108 readings × 18 period windows | ✅ Arithmetic from two verified counts. The Reckoner spec's own "~4,500" is against ~250 planned readings — a plan, not a shipped number, so I did not use it. |
| **35,255 layout checks** | pos page | `venqore-pos.html` verification block | ✅ Verified in the file. |
| **2 live retail businesses** | landing trust strip and proof, about | Copy Bible §1.6 proof stack | Swap for a customer count at 25+. |
| **7 / 7 correctness checks** | landing, ledger, register | Copy Bible §1.6, named individually on `ledger.html` | Confirm all seven exist as tests. |
| **11 seconds / 20 minutes** | smartcapture | Framed on the page as *"our own timings on our own bills, not an industry study"* | Replace with your real measurement, or leave the caveat. |

### Two claims I deliberately softened

- **The 108 readings are a registry, not 108 live cards on a shop's dashboard.**
  Your own correction spec (12 Aug) found twelve of them returning fabricated
  data and withdrew them, and notes zero pages currently call the Reckoner.
  The pages say "108 readings the builder ships" and never "108 cards you can
  add today". `reckoner.html` tells that whole story as a *trust* asset — the
  audit is far more persuasive than the count.
- **Per-business-type starter dashboards do not exist yet.** The card builder
  has no business-type presets. The assembly animation shows composition by
  profile because that *is* what Blueprint does with modules — but I did not
  claim a pre-made dashboard per industry anywhere.

Everything else — plan prices, limits, add-on prices, the module lists, the
vertical coverage table — comes straight from
`VENQORE_PRICING_AND_STRATEGY.md`, `venqore_built.md` and
`VENQORE_AUDIT_II_BUILD_YOUR_OWN_ERP.md`.

### Pricing decisions I had to make

`VENQORE_PRICING_AND_STRATEGY.md` (V3, 4 Aug) and `VenQore-Copy-Bible.md`
disagree in four places. These pages follow the **Copy Bible for structure and
the V3 doc for numbers**, because the Copy Bible is the authority for what the
website says and the V3 doc is the only file with worked margins.

1. **Counter ($18) is now the entry tier**, per your instruction — four cards,
   1 branch / 1 user, and the copy is explicit that $18 buys the whole system
   rather than a cut-down edition. The Copy Bible's three-card structure is
   superseded. The comparison table and the landing preview both show four.
2. **AI is a hard cap with a top-up, not metered overage.** The V3 doc is
   explicit: *"Hard stop at the cap. Never auto-bill overage."* The Copy Bible's
   "billed as usage" line is not used.
3. **Feature gates are shown honestly.** The Copy Bible promises "never by
   locking a feature you need behind a tier"; the V3 matrix gates multi-branch,
   BOM, loyalty and API. The comparison table shows the real gates and the
   headline promise is scoped to *"plans differ by how much of it you use."*
4. **Scale = 10 branches / 50 users** (V3), not "unlimited branches, 25 users"
   (Copy Bible). Two different products at the same $129.

### Where each new page's claims come from

| Page | Primary source |
|---|---|
| `pos.html` | `extras/Layout Law/venqore-pos.html` — presets, compositions, `why` strings, the 35,255-check verification, the competitor survey (Toast / Lightspeed / Loyverse / Shopify / Square / D365) |
| `documents.html` | `extras/Layout Law/venqore-document.html` — the thirteen types, the density table, and the four real posting defects the collapse fixed (debit-note warehouse, sale-return tax/discount, single tax source, per-screen round-off) |
| `dashboard.html` | `extras/Cards/v6/VenQore Card Builder (LIVE).html` + `CARD_CATALOGUE.md` — 108 readings, C1–C6 with all 18 fits, the three server-side gates, per-role card counts |
| `reckoner.html` | `VENQORE_RECKONER_BUILD_SPEC.md` + `VENQORE_RECKONER_CORRECTION_SPEC.md` — 18 windows, 8 invalidation events, the signed-metric pairs, `not_applicable`, and the self-audit |
| `smartcapture.html` | The old `Marketing/Shared/FeatureDemos.jsx` demo, rebuilt on V6 |
| `vensynq.html` | The channels group in `venqore_built.md` |

Also deliberately **absent**: any lifetime-deal language (Copy Bible Part 0,
rule 1), eBay and TikTok Shop as purchasable add-ons (only WooCommerce and
Amazon exist in the V3 product list), and the "what this replaces" cost table
(its figures are `[$X,XXX]` placeholders and the doc says do not estimate).

---

## Things that are not wired

These pages are static. Nothing posts anywhere.

- Every form (`contact`, `signin`, `register`, `onboarding`, footer CTA) shows a
  confirmation state and stops. Wire them to your controllers when you port.
- The five demos are **client-side renderings**. The register really does
  recompose from the seven real preset definitions, the document editor really
  does reconfigure from the thirteen real capability sets, and the assembly
  really does compose from the 46-module list — but they are drawing the
  product, not driving it. When the real endpoints exist, each demo's data
  object is the only thing that needs replacing.
- `onboarding.html` composes a Blueprint **client-side**, from eleven keyword
  signals against the real module list. It is the honest version of the demo —
  the Copy Bible sanctions exactly this (*"pre-generate Blueprints for common
  business types, match the typed input, animate the reveal"*) — but it is not
  calling `ConfigurationAIService`. When the real builder is live, replace
  `compose()` in the inline script with the API call; the UI needs no change.
- The mock dashboard is a rendering, not the product. It obeys M1–M7 and the
  chart-ink rules so the screenshot does not lie about the product, but the
  figures are illustrative.
- Footer links to `/blog`, `/docs`, `/help`, `/roadmap`, `/terms`, `/privacy`,
  `/cookies` point at your existing app routes. Confirm each exists.

---

## Known gaps worth a decision

- **The trial does not start.** `VENQORE_ONBOARDING_AI_AUDIT.md` §5 is titled
  "The 14-day trial does not exist" — `trial_ends_at` is never set, so every
  self-serve signup is a permanent free account. These pages advertise a 14-day
  trial in six places. Fix the provisioning before they go public, or change
  the copy.
- **`WorkspaceBuilderController::provision()` writes `is_enabled`; the column
  is `enabled`.** Every provision throws. Same audit, §4.
- **Verticals not advertised here on purpose:** gym, salon, clinic, school,
  rental, hotel, construction. All sit at 30–70% coverage and all are blocked
  on the scheduling engine. `about.html` says so rather than hiding it.

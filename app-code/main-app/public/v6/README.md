# VenQore — public pages, V6

Ten new public pages built on the V6 design system. They do not touch anything
that is live: nothing here overwrites an existing route, a Blade view, a
JSX page or a controller.

```
public/v6/
  index.html        Landing
  blueprint.html    Product · Blueprint (the AI builder)
  ledger.html       Product · Core Ledger (the moat)
  features.html     Everything that ships today, group by group
  pricing.html      Starter / Growth / Scale, add-ons, AI usage, FAQ
  about.html        Company, beliefs, vertical coverage, the trade-off
  contact.html      Form + routes to the right answer
  signin.html       Auth · sign in
  register.html     Auth · create an account
  onboarding.html   The AI onboarding flow, working end to end
  assets/
    venqore.css     Tokens + component library + preserved hero/footer  (77 KB)
    venqore.js      All page behaviour, no dependencies                 (17 KB)
    fluid.js        Your WebGL fluid canvas, unchanged
    fonts/          Bricolage, Plus Jakarta, Space Grotesk, Instrument  (161 KB)
    logo.png        ICON.png resampled to 256px                          (31 KB)
```

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
shared `V6Layout` component rather than ten copies.

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
✓ 10 pages, every local link resolves
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

| Number | Where it appears | Source | Note |
|---|---|---|---|
| **144 shipped features** | landing trust strip, module grid, features hero, register aside | Count of what `features.html` actually enumerates, drawn from `extras/Features/venqore_built.md` | Your marketing elsewhere says **240+**; the build audit supports **142 audited + 39 re-verified = 180 defensible**; the catalogue lists **265** total. I used the number the page can prove line by line. Raise it if you can stand behind a bigger one. |
| **220 automated tests** | landing proof section | `grep` of `tests/**/*Test.php` — 24 files, 220 test methods | The Copy Bible says "73 tests across 20 modules"; `VENQORE_MASTER_PRODUCT_CATALOG.md` says "1,065+ passing tests". Three different numbers exist in your docs. Pick one and make the others match. |
| **2 live retail businesses** | landing trust strip and proof, about | Copy Bible §1.6 proof stack | Swap for a customer count at 25+, per the Copy Bible's own plan. |
| **7 / 7 correctness checks** | landing, ledger, register, features | Copy Bible §1.6 and the Core Ledger page | The seven are named on `ledger.html`. Confirm all seven exist as tests. |

Everything else — plan prices, limits, add-on prices, the module lists, the
vertical coverage table — comes straight from
`VENQORE_PRICING_AND_STRATEGY.md`, `venqore_built.md` and
`VENQORE_AUDIT_II_BUILD_YOUR_OWN_ERP.md`.

### Pricing decisions I had to make

`VENQORE_PRICING_AND_STRATEGY.md` (V3, 4 Aug) and `VenQore-Copy-Bible.md`
disagree in four places. These pages follow the **Copy Bible for structure and
the V3 doc for numbers**, because the Copy Bible is the authority for what the
website says and the V3 doc is the only file with worked margins.

1. **Counter ($18) is not on the public page.** The Copy Bible ships three
   cards and puts the entry point at $36. Counter still exists in the V3 doc.
2. **AI is a hard cap with a top-up, not metered overage.** The V3 doc is
   explicit: *"Hard stop at the cap. Never auto-bill overage."* The Copy Bible's
   "billed as usage" line is not used.
3. **Feature gates are shown honestly.** The Copy Bible promises "never by
   locking a feature you need behind a tier"; the V3 matrix gates multi-branch,
   BOM, loyalty and API. The comparison table shows the real gates and the
   headline promise is scoped to *"plans differ by how much of it you use."*
4. **Scale = 10 branches / 50 users** (V3), not "unlimited branches, 25 users"
   (Copy Bible). Two different products at the same $129.

Also deliberately **absent**: any lifetime-deal language (Copy Bible Part 0,
rule 1), eBay and TikTok Shop as purchasable add-ons (only WooCommerce and
Amazon exist in the V3 product list), and the "what this replaces" cost table
(its figures are `[$X,XXX]` placeholders and the doc says do not estimate).

---

## Things that are not wired

These pages are static. Nothing posts anywhere.

- Every form (`contact`, `signin`, `register`, `onboarding`, footer CTA) shows a
  confirmation state and stops. Wire them to your controllers when you port.
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

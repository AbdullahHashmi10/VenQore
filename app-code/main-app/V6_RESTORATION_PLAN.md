# V6 RESTORATION PLAN — restore the dynamic system, keep the new look

**Status:** ready to execute · **Audited against the repo, not against `V6_PUBLIC_PAGE_REGISTER.md`**

> **The rule that governs every task in this document:**
> **Nothing that works today may stop working.** A restyle commit changes class names and
> markup. It never removes a `useState`, a `useEffect`, an `onSubmit`, a `router.post`,
> an Inertia form, a `<Link>`, a prop, a controller call, or a route. If a diff deletes
> behaviour, the diff is wrong — revert it and redo it as paint only.

---

## PART 1 — WHAT ACTUALLY HAPPENED (verified)

**Nothing was deleted.** Every one of the 60 React marketing page files is on disk. Every
controller is intact. The database-driven CMS (Blog, Docs, Help) is intact. All 23 free
tools are intact.

What happened is narrow: **15 route lines** in `routes/web.php` were re-pointed from
`Inertia::render(...)` to `V6PageController::render(...)`, which streams a static `.html`
file out of `public/v6/`.

### 1a. Displaced — 7 routes that DID have a working dynamic page

The React file still exists and is **still live right now** under `/legacy/*`.

| Route | web.php line | Currently serves | Original React page | Lines | Verify at |
|---|---|---|---|---|---|
| `/` | 893 | `v6/index.html` | `Pages/LandingPage.jsx` | 2008 | `/legacy` |
| `/features` | 22 | `v6/features.html` | `Pages/Marketing/Features.jsx` | 635 | `/legacy/features` |
| `/pricing` | 30 | `v6/pricing.html` | `Pages/Marketing/Pricing.jsx` | 1601 | `/legacy/pricing` |
| `/about` | 43 | `v6/about.html` | `Pages/Marketing/About.jsx` | 335 | `/legacy/about` |
| `/contact` | 44 | `v6/contact.html` | `Pages/Marketing/Contact.jsx` | 303 | `/legacy/contact` |
| `/vensynq` | 48 | `v6/vensynq.html` | `Pages/Marketing/VenSynQ.jsx` | — | `/legacy/vensynq` |
| `/smartcapture` | 49 | `v6/smartcapture.html` | `Pages/Marketing/SmartCapture.jsx` | — | `/legacy/smartcapture` |

### 1b. Net-new — 8 routes that never had a dynamic predecessor

`/documents` (50) · `/reckoner` (51) · `/ledger` (52) · `/blueprint` (53) · `/security` (54)
· `/onboarding` (55) · `/dashboard-preview` (56) · `/pos` (58)

Nothing was lost here. These are additions. They become React pages in Phase 4.

### 1c. Untouched — roughly 70 routes, never at risk

Tools hub + 23 interactive tools · Blog index + `{slug}` · Docs index + `{slug}` ·
Help index + articles · Solutions index + 6 verticals · Compare index + 2 rivals ·
Features deep-dives ×5 · Partners · Partner Support · Digital Products · Subscribe (+
confirm/unsubscribe) · Demo · Roadmap · Known Issues · Terms · Privacy · Refund Policy ·
QR Menu public · Lead confirm/unsubscribe · Campaigns.

Every one is still Inertia, still dynamic, still routed, still has its controller.

### 1d. The application itself — audited, untouched

Checked for the same static-substitution pattern across the whole codebase:

- `grep` for `public_path(*.html)`, `response()->file`, `File::get(public_path` across
  `routes/` and `app/Http/Controllers/` returns **one** hit outside `V6PageController`:
  `routes/web.php:983`. That is a hardened media server with an extension allowlist
  (`jpg jpeg png gif webp avif pdf ico`) — it cannot serve HTML. Not a page route.
- `public/` contains no other static page tree. `public/index.html` and `public/offline.html`
  are the Laravel entry point and the service-worker offline shell.
- Dashboard, POS, Admin, Tenant, Super-Admin, Installer, Hub, Reports, Inventory,
  Accounting, Restaurant, VenSynQ, Builder — all still `Inertia::render` / controller-driven.

**Conclusion: the static-HTML mistake was confined to the 15 public marketing routes.
The product was never touched. The real number of displaced pages is 7, not 84.**

The reason most pages still look old is not that they were discarded — it is that the
V6 stylesheet was never made available to the React bundle. That is Part 2.

---

## PART 2 — THE ACTUAL PROBLEM (one paragraph)

The V6 design lives as **328 component classes** in `public/v6/assets/venqore.css`
(3,447 lines). The React bundle never loads that file.

React has `resources/css/venqore-v6/` — imported by `resources/css/app.css:6` — but it is
**tokens only**: colours, type, spacing, radius, elevation, motion, and the light/dark
semantic layer. Values are identical to V6, fonts are already self-hosted, and the tokens
already feed Tailwind through `resources/js/theme/build/from-v6-tokens.js`. It contains
exactly **7** component classes (`.vq-display`, `.vq-eyebrow`, `.vq-metric`, `.vq-num`,
`.vq-prose`, `.vq-dark`, `.vq-theming`).

**Tokens: shared. Components: never ported.** Closing that one gap is what unlocks the
restyle of all 84 pages. It is Phase 0, it takes under an hour, and everything else
depends on it.

---

## PHASE 0 — Port the V6 component layer into the bundle
**~45 min · do this first · every later phase depends on it · zero visual change expected**

`public/v6/assets/venqore.css` is sectioned. Only the middle is missing from React:

| Lines | Section | Action |
|---|---|---|
| 1–161 | `@font-face` + raw colour ramps | **Skip** — React has `tokens/fonts.css`, `tokens/colors.css` |
| 162–290 | Semantic layer, light + dark | **Skip** — React has `tokens/theme.css` |
| 291–490 | Base / global reset (`html`, `body`, `*`) | **Port, but scoped** (0.2) |
| 491–1427 | Component library — public pages | **Port as-is** |
| 1428–1875 | Product surfaces on public pages | **Port as-is** |
| 1876–2383 | Live demo surfaces | **Port as-is** |
| 2384–2664 | Preserved hero + footer (Rehan) | **Port as-is** |
| 2665–2845 | §15 measured corrections | **Port as-is** |
| 2846–3158 | ReactBits (FoldText, AnimatedList, LaserFlow) | **Port as-is** |
| 3159–3319 | Mockup frame / assemble insulation | **Port as-is** |
| 3320–3447 | Auth pages + scoped box model | **Defer to Phase 5** |

### 0.1 — Extract the component slice

```bash
cd app-code/main-app
sed -n '491,3319p' public/v6/assets/venqore.css > resources/css/venqore-v6/components.css
```

Every rule in this range is namespaced `.vq-*`. It cannot touch an authenticated page.
Safe to import globally.

### 0.2 — Extract the base slice, SCOPED

Lines 291–490 restyle bare `html`, `body`, `*`, `h1`–`h6`, `a`, `button`. Imported
globally they would repaint all 312 authenticated pages. Wrap them:

```bash
sed -n '291,490p' public/v6/assets/venqore.css > /tmp/v6base.css
{ echo '/* V6 base — scoped to the public site. See Phase 0.2. */'
  echo '.vq-site {'
  cat /tmp/v6base.css
  echo '}'
} > resources/css/venqore-v6/site-base.css
```

Then, inside `site-base.css`, hand-fix the selectors that cannot nest:
- `html { ... }` / `:root { ... }` → delete (tokens already set these)
- `body { ... }` → change to `&` (the `.vq-site` wrapper itself)
- `*, *::before, *::after` → `& *, & *::before, & *::after`

PostCSS nesting is already configured (`postcss.config.cjs`) so `&` resolves at build.

### 0.3 — Guard the font URLs

```bash
sed -i 's#url("fonts/#url("/v6/assets/fonts/#g' resources/css/venqore-v6/components.css
sed -i 's#url("fonts/#url("/v6/assets/fonts/#g' resources/css/venqore-v6/site-base.css
```

No `@font-face` should survive the line-491 cut, but run it as a guard — a relative
`fonts/` URL inside a bundled stylesheet resolves against `/build/assets/` and 404s
silently, which is exactly the failure `index.css` already warns about.

### 0.4 — Wire the imports

In `resources/css/venqore-v6/index.css`, append after the `compat.css` import:

```css
/* The V6 public-site layer, ported from public/v6/assets/venqore.css.
   site-base.css is scoped to .vq-site; components.css is .vq-* namespaced. */
@import './site-base.css';
@import './components.css';
```

### 0.5 — Have MarketingLayout open the scope

In `resources/js/Pages/Marketing/Shared/MarketingLayout.jsx`, wrap the outermost
returned element in `<div className="vq-site">`. This is the only thing that activates
the base layer, and it activates it for all 84 public pages at once.

### 0.6 — Verification gate (do not skip)

1. `npm run build` — must complete. A stray brace anywhere in the slice fails loudly here.
   *(Note: the register claims a stray closing brace at `venqore.css:258`. That line is
   inside the dark semantic block and looks correct in the current file. Trust the build,
   not the register.)*
2. Open `/legacy/about` — **it must look exactly as it did before.** Phase 0 only adds
   unused classes. Any visual change means the base slice leaked; recheck 0.2.
3. Open `/pricing` (still static) — must be unchanged.
4. Open an authenticated page (`/hub`, `/new-dashboard`) — must be unchanged.

If all four pass, the design system is now available to React and every following phase
is a paint job.

---

## PHASE 1 — Restore the 7 displaced routes
**~30 min · DO TODAY · after this, every public URL is dynamic again**

All edits in `routes/web.php`. `use Inertia\Inertia;` is already imported (line 18).

**Line 22** → `Route::get('/features', fn() => Inertia::render('Marketing/Features'))->name('marketing.features');`

**Line 30** → pricing needs plan data. Copy the closure body from the existing
`legacy.pricing` route (lines 72–87) verbatim:

```php
Route::get('/pricing', function () {
    try {
        $plans = \App\Models\Plan::with(['limits', 'features'])
            ->where('is_active', true)
            ->where('is_visible', true)
            ->where('slug', 'not like', 'ltd%')
            ->orderBy('sort_order')
            ->get();
    } catch (\Throwable $e) {
        $plans = collect();
    }
    return Inertia::render('Marketing/Pricing', [
        'plans'   => $plans,
        'pricing' => config('pricing'),
    ]);
})->name('marketing.pricing');
```

**Line 43** → `Route::get('/about', fn() => Inertia::render('Marketing/About'))->name('marketing.about');`

**Line 44** → `Route::get('/contact', fn() => Inertia::render('Marketing/Contact'))->name('marketing.contact');`

**Line 48** → `Route::get('/vensynq', fn() => Inertia::render('Marketing/VenSynQ'))->name('marketing.vensynq');`

**Line 49** → `Route::get('/smartcapture', fn() => Inertia::render('Marketing/SmartCapture'))->name('marketing.smartcapture');`

**Line 893** (inside the `/` closure) → `return Inertia::render('LandingPage');`

### Things that must NOT change in Phase 1

- **Line 31–42**, `POST /pricing/currency-override` — stays. Pricing.jsx must keep calling it.
- **Line 45**, `POST /contact` with `throttle:10,1` + `turnstile` — stays. Contact.jsx posts
  through Inertia, which carries CSRF itself; `ContactController` needs no change.
- **Lines 856–892**, the `/` guard chain — DB check → installer redirect → demo-user
  auto-logout → platform-admin redirect → hub redirect. Only the final `return` changes.
- **`GeoPricingService`** — `V6PageController` injected a `vq-currency` meta tag for the
  static pages. Inertia pages must receive the same signal. Check
  `app/Http/Middleware/HandleInertiaRequests.php` for a shared `currency` prop; if absent,
  add one using `$geo->getCurrencyInfo($geo->resolveCountry(request()))['currency']` so
  Pricing.jsx keeps showing PKR/USD correctly.

### Cleanup

Delete the `/legacy` prefix group (lines 68–98) — it is now a duplicate of the live routes.
Keep `Route::get('/legacy/landing', ...)` alone if you want an old-vs-new reference while
restyling.

### Verification gate

Every one of these must render dynamically, with data:
`/` · `/features` · `/pricing` (plans load, currency toggle works) · `/about` ·
`/contact` (form submits, turnstile fires) · `/vensynq` · `/smartcapture`

Then spot-check that nothing regressed: `/tools` · `/blog` · `/docs` · `/help` ·
`/solutions/pharmacy` · `/compare/venqore-vs-square` · `/demo` · `/roadmap`

**At this point the site is fully dynamic again. The 7 pages wear the old paint for a few
hours. Nothing is broken and nothing is lost.**

---

## PHASE 2 — TODAY: repaint the pages that matter for launch
**Ordered by leverage, not by page importance. 2.1 repaints all 84 pages at once.**

### The porting method — give your IDE this rule, not 84 sets of instructions

For each visual section in a React page:

1. Open the matching section in the corresponding `public/v6/*.html`. That file is the
   **visual spec** — it always was. It is not the deliverable.
2. Copy its class names onto the JSX elements: `className="vq-section"`, `"vq-card"`, etc.
3. Delete the inline `style={{ ... }}` objects and `vq.*` runtime calls that the class now
   covers. **Keep any style that carries data** — a width driven by state, a computed
   colour, an animated transform.
4. **Touch nothing else.** `useState`, `useEffect`, `useMemo`, handlers, Inertia `useForm`,
   `router.post`, props, data fetching, conditional rendering, error states, loading
   states, `<Head>` tags and their SEO/meta content all stay exactly as they are.
5. Keep every `lucide-react` import — V6 uses the same icon set.

**Commit discipline:** one page per commit, message `restyle(v6): <page> — paint only`.
Before pushing, run `git diff --stat` and read the diff. If it removed a hook, a handler,
a form, a `<Link>`, or a route reference, it is wrong.

### The class map — V6 primitives you will use on nearly every page

| Purpose | V6 class |
|---|---|
| Page scope (opens the base layer) | `.vq-site` |
| Width container | `.vq-container` · `--narrow` · `--wide` |
| Vertical section | `.vq-section` · `--alt` · `--surface` · `--tight` |
| Section heading block | `.vq-section-head` · `--center` |
| Small label above a heading | `.vq-eyebrow` · `--accent` |
| Display heading | `.vq-display` |
| Body prose | `.vq-prose` |
| Card | `.vq-card` · `--accent` · `--flat` · `--interactive` · `--xl` |
| Card grid | `.vq-cards` · `.vq-grid` · `--2` `--3` `--4` `--12` |
| Button | `.vq-btn` · `--primary` `--secondary` `--ghost` `--quiet` `--light` `--onDark` `--pill` · `--sm` `--lg` `--xl` `--block` |
| Badge / pill | `.vq-badge` · `--accent` `--success` `--warning` `--soon` |
| Number / metric | `.vq-num` · `.vq-metric` |
| Header chrome | `.vq-header` · `__inner` · `__actions` · `__cta` · `--onHero` |
| Nav + mega menu | `.vq-nav__list` · `__item` · `__link` · `.vq-mega` · `__grid` · `__col` · `__link` · `__foot` |
| Brand lockup | `.vq-brand` · `__word` |
| Mobile toggle | `.vq-burger` |
| Hero | `.vq-hero-section` · `.vq-hero-inner` · `.vq-hero-h1` · `.vq-hero-eyebrow` · `.vq-hero-foot` |
| Footer | `.vq-footer` · `__head` · `__cta` · `__mark` · `__social` |
| Skip link | `.vq-skip` |

Full list: 328 classes in `resources/css/venqore-v6/components.css` after Phase 0.

---

### 2.1 — `MarketingLayout.jsx` — HIGHEST LEVERAGE, DO FIRST
`resources/js/Pages/Marketing/Shared/MarketingLayout.jsx` (901 lines)

This one file is the header, nav, mega menu, theme toggle and footer for **all 84 public
pages**. Repainting it repaints the chrome of the entire site in a single commit.

- Source of truth for the markup: `public/v6/index.html` lines 104–160 (header + mega menu)
  and its `.vq-footer` block near the end of the file.
- Wrap the outermost element in `<div className="vq-site">` (this is Phase 0.5).
- Port `.vq-header`, `.vq-header__inner`, `.vq-brand`, `.vq-nav`, `.vq-mega`,
  `.vq-header__actions`, `.vq-burger`, `.vq-footer` and children.
- Apply `.vq-header--onHero` conditionally on the landing page only — that is what makes
  the header transparent over the hero.
- **Keep:** `useTheme()` and the light/dark toggle, `useScrollReveal`, `RevealOnScroll`,
  `MagneticButton`, `SectionLabel`, `GlassCard` and every other named export — 30+ page
  files import them by name. Changing a signature breaks those pages.
- **Keep:** every `<Link href>` in the nav and footer sitemap. The footer is what keeps
  internal link equity flowing to all 84 URLs.

**Verify:** load `/about`, `/tools`, `/blog`, `/solutions`, `/docs`, `/compare` — new
chrome everywhere, old bodies. Dropdowns open. Theme toggle works. Mobile menu works.

### 2.2 — `Pages/LandingPage.jsx` (2008 lines) → `/`
Spec: `public/v6/index.html` (1595 lines) — the richest of the static pages.

Port in this order: hero → compiler/assemble section → product surfaces → proof →
pricing teaser → footer CTA.
- The hero prompt input posts to the workspace builder. **Keep** the handler wired to
  `workspace.analyze` / `workspace.converse.start`.
- `public/v6/assets/laserflow.js`, `animatedlist.js`, `fluid.js`, `optionwheel.js` back
  the ReactBits effects. Either port each to a React component under
  `resources/js/Components/V6/`, or load the script and mount it in a `useEffect` with a
  cleanup. Do not inline them into the page file.
- Keep the demo-user auto-logout messaging and any authenticated-visitor states.

### 2.3 — `Pages/Marketing/Pricing.jsx` (1601 lines) → `/pricing`
Spec: `public/v6/pricing.html` (547 lines).
- Port `.vq-card`, `.vq-plan--featured`, `.vq-pick__card`, `.vq-badge` onto the plan cards.
- **Keep:** the `plans` prop loop, monthly/annual toggle, the PKR/USD region switch posting
  to `marketing.pricing.override`, every feature-comparison row, and all plan-limit data.
- The static page hardcoded plan names. The React page reads them from the database.
  **The database is correct.** Do not copy prices out of the HTML.

### 2.4 — `Pages/Marketing/Features.jsx` (635 lines) → `/features`
Spec: `public/v6/features.html` (827 lines).
- **Keep:** the six live simulated demos imported from `Shared/FeatureDemos.jsx` (69 KB) —
  Reports, POS, Smart Capture, VenSynQ, Growth Engine, Cookbook — and the searchable
  feature catalog with its filter state. These are the things the static page could never
  do. They are the reason this page is worth having.
- `Shared/FeatureDemos.jsx` is also imported by the five `/features/{slug}` deep-dive
  pages. Restyle it once; six pages benefit.

### 2.5 — `Pages/Marketing/About.jsx` (335) and `Contact.jsx` (303)
Specs: `public/v6/about.html`, `public/v6/contact.html`. Small, mostly prose and cards —
fast wins. Keep the contact form's Inertia `useForm`, validation display and turnstile.

**End of today's target.** Site fully dynamic, chrome new everywhere, five highest-traffic
pages fully on V6.

---

## PHASE 3 — The remaining pages
**Grouped so one restyle serves many URLs. Order is by URLs-per-hour-of-work.**

| # | Group | Files to touch | URLs served | Notes |
|---|---|---|---|---|
| 3.1 | Tools shell | `Marketing/Tools/Shared/ToolShell.jsx`, `ToolsSidebar.jsx`, `EmailGate.jsx`, `HousePromo.jsx`, `Select.jsx`, `EditableText.jsx`, `SmartCaptureNudge.jsx` | **24** | Restyling the shell repaints all 23 tools + the hub. **Keep every PDF/CSV/barcode POST and the `ToolLead` email gate.** |
| 3.2 | Solutions | `Solutions/Index.jsx`, `Solutions/Show.jsx` | **7** | One `Show.jsx` serves all 6 verticals. Also fix the header link that pointed at the dead `#presets` hash. |
| 3.3 | Feature deep-dives | `Features/Show.jsx` | **5** | Shares `FeatureDemos.jsx`, already restyled in 2.4. |
| 3.4 | Compare | `Compare/Index.jsx`, `Compare/Show.jsx` | **3** | |
| 3.5 | Blog | `Blog/Index.jsx`, `Blog/Show.jsx` | **2 + n** | DB-driven; `n` grows with every post. Add JSON-LD `Article` + cover image here. |
| 3.6 | Docs | `Docs/Show.jsx` + docs index view | **2 + n** | Markdown-driven. Add JSON-LD `TechArticle`. |
| 3.7 | Help centre | `Help/Index.jsx`, `Help/Show.jsx` | **2 + n** | DB-driven via `HelpCenterController`. |
| 3.8 | Company & commercial | `Partners.jsx`, `PartnerSupport.jsx`, `DigitalProducts.jsx`, `Newsletter.jsx` (+ Confirm, Unsubscribe), `KnownIssues.jsx`, `Roadmap.jsx` | **8** | `PartnerSupport.jsx` runs live support tickets — keep the polling and reply POSTs. |
| 3.9 | Demo | `Demo/Landing.jsx` | **1** | Provisions real demo tenants. Highest-risk file in the list — restyle last, test hardest. |
| 3.10 | Legal | `TermsOfService.jsx`, `PrivacyPolicy.jsx`, `RefundPolicy.jsx` | **3** | Pure prose. `.vq-prose` + `.vq-container--narrow` and they are done. |
| 3.11 | Campaigns | `Campaigns.jsx` | **1** | |

Roughly 55 URLs across 11 groups, ~30 files. Groups 3.1 and 3.2 alone cover 31 URLs.

---

## PHASE 4 — Convert the 8 net-new V6 pages to React
**These have no dynamic predecessor, so there is nothing to restore — only to convert.**

`/blueprint` · `/reckoner` · `/ledger` · `/documents` · `/security` · `/onboarding` ·
`/dashboard-preview` · `/pos`

For each: create `resources/js/Pages/Marketing/<Name>.jsx`, port the body from the matching
`public/v6/<name>.html`, wrap in `MarketingLayout`, and repoint its route
(`routes/web.php` lines 50–58) to `Inertia::render('Marketing/<Name>')`.

Do these **after** Phase 3, not before. They currently work and look correct — they are the
least urgent thing in this document. Convert them so that (a) the whole site shares one
header/footer implementation, and (b) `public/v6/` can finally be retired.

`/dashboard-preview` and `/pos` are the two worth extra thought: they are marketing
renderings of real product screens, and once they are React they can show *live* mock data
instead of hardcoded HTML — which is the upgrade the static version foreclosed.

---

## PHASE 5 — Auth pages
`venqore.css` lines 3320–3447 (`.vq-auth*` + a scoped box-model block) were deliberately
left out of Phase 0. Port them into `components.css` and apply to the existing
`Pages/Auth/*` and `Layouts/AuthLayout.jsx` when you get to sign-in/register.

The box-model block at the end of that range is scoped on purpose. Read its comment before
moving it — the register's suggestion to make `border-box` global is what would shift hero
typography. Leave it scoped.

---

## PHASE 6 — Retire the static build
**Only after a page's React version is live and verified.**

1. `mkdir -p resources/design-reference/v6` and move each `public/v6/*.html` there as its
   React equivalent ships. Keep them — they are the design spec and they are worth keeping.
2. Move `public/v6/assets/` to `resources/design-reference/v6/assets/` **except**
   `fonts/`, which stays at `public/v6/assets/fonts/` (Phase 0.3 points the bundle at it).
   If you prefer, move the fonts into `resources/fonts/` and update `tokens/fonts.css`
   instead — `scripts/fonts-vendor.mjs` already handles vendoring.
3. Delete the `/v6/{page?}` dispatcher (`routes/web.php` lines 61–62) and
   `app/Http/Controllers/Marketing/V6PageController.php`.
4. Keep the `{page}.html → /{page}` 301 redirect (lines 64–65). Anything already indexed
   at a `.html` URL must keep resolving.
5. Delete `public/v6/assets/venqore-forms.js` — once every page is Inertia, CSRF is handled
   by Inertia and that shim is dead.

---

## GUARDRAILS — so this cannot happen again

Add to `CLAUDE.md` and `DESIGN-RULES.md`:

> **The V6 HTML files are a design specification, not a delivery mechanism.**
> `resources/design-reference/v6/*.html` exists to show what a page should *look* like.
> The site is served by Laravel + Inertia + React. A public route may never be repointed
> from `Inertia::render(...)` to a static file. Porting a design means copying class names
> onto existing components — never replacing a component with HTML.

And a CI check — add to `design-check.sh`:

```bash
# No public marketing route may serve a static HTML file.
if grep -nE "Route::get\('/(features|pricing|about|contact|vensynq|smartcapture)'" \
     routes/web.php | grep -q "V6PageController\|response()->file"; then
  echo "FAIL: a public marketing route is serving static HTML. See V6_RESTORATION_PLAN.md."
  exit 1
fi
```

Add a route-count assertion to the test suite so a dropped route fails CI:

```php
// tests/Feature/PublicRoutesTest.php
test('every public marketing URL returns 200', function () {
    foreach (['/', '/features', '/pricing', '/about', '/contact', '/tools', '/blog',
              '/docs', '/help', '/solutions', '/compare', '/roadmap', '/demo',
              '/partners', '/digital-products', '/subscribe', '/terms', '/privacy',
              '/refund-policy'] as $url) {
        $this->get($url)->assertOk();
    }
});
```

---

## TODAY'S CHECKLIST

- [ ] **Phase 0** — port component layer, 4 verification gates pass *(~45 min)*
- [ ] **Phase 1** — 7 routes back to Inertia, `/legacy` group deleted *(~30 min)*
- [ ] **Gate:** all 84 URLs reachable and dynamic — spot-check the 15 listed in Phase 1
- [ ] **2.1** — `MarketingLayout.jsx` → V6 chrome on all 84 pages *(highest leverage)*
- [ ] **2.2** — `LandingPage.jsx` → `/`
- [ ] **2.3** — `Pricing.jsx` → `/pricing`
- [ ] **2.4** — `Features.jsx` + `FeatureDemos.jsx` → `/features` and 5 deep-dives
- [ ] **2.5** — `About.jsx`, `Contact.jsx`
- [ ] **Gate before going live:** `npm run build` clean · pricing loads plans and switches
      currency · contact form submits · one tool generates a PDF · `/blog` and `/help` load
      DB content · demo provisions a tenant · light and dark both correct

**Phases 3–6 continue after launch. Nothing in them blocks going live**, because after
Phase 1 every page works and after 2.1 every page wears the new chrome.

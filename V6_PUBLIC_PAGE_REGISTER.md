# V6 Public Page Register

**5 Sep 2026.** Every publicly reachable page, and whether it has been brought
onto the V6 positioning and design system. Built by reading `routes/web.php`
(all 5 route files), `SitemapController`, and `public/v6/`.

Three states:

- **V6** — a standalone HTML file in `public/v6/`, served by `V6PageController`.
- **OLD** — still an Inertia/React page on `Marketing/Shared/MarketingLayout`.
  Renders in the pre-V6 marketing shell.
- **STUB** — the file exists but is a 14-line redirect placeholder.

---

## 1. Already on V6 — do not touch

| URL | File | Lines |
|---|---|--:|
| `/` | `public/v6/index.html` | 1584 |
| `/features` | `features.html` | 804 |
| `/pricing` | `pricing.html` | 417 |
| `/about` | `about.html` | 373 |
| `/contact` | `contact.html` | 309 |
| `/blueprint` | `blueprint.html` | 494 |
| `/onboarding` | `onboarding.html` | 552 |
| `/dashboard-preview` | `dashboard.html` | 396 |
| `/documents` | `documents.html` | 426 |
| `/ledger` | `ledger.html` | 359 |
| `/reckoner` | `reckoner.html` | 473 |
| `/smartcapture` | `smartcapture.html` | 422 |
| `/vensynq` | `vensynq.html` | 374 |
| `/pos.html` | `pos.html` | 415 |

`signin.html` and `register.html` are **STUB** (14 lines each) — they redirect
into the app's real auth screens, which were rebuilt on `AuthLayout` in the
2 Sep pass. That is correct; they are not missing pages.

---

## 2. Linked from the V6 footer but still OLD — the visible breaks

A visitor clicking these leaves the V6 site mid-session and lands in the old
design. Reference counts are how many V6 pages link to each.

| URL | Refs | Renders | Dynamic? |
|---|--:|---|---|
| `/terms` | 14 | `Pages/TermsOfService.jsx` | no — static copy |
| `/privacy` | 14 (+13 to `#cookies`) | `Pages/PrivacyPolicy.jsx` | no — static copy |
| `/roadmap` | 13 | `Marketing/Roadmap.jsx` | no — hardcoded phases |
| `/help` | 13 | `HelpCenterController` → `Help/Index` | **yes** — DB articles |
| `/docs` | 13 | `DocsController` → `Marketing/Docs/Show` | **yes** — markdown files |
| `/blog` | 13 | `BlogController` → `Marketing/Blog/Index` | **yes** — `BlogPost` model |

Also reachable from those: `/help/articles/{slug}`, `/docs/{slug}`,
`/blog/{slug}`, `/known-issues`.

---

## 3. Live, indexed in the sitemap, but not linked from V6 at all

These are in `sitemap.xml` — Google has them. They are the pages that
"were there before and are not here now."

### Free tools — 23 tools + hub

`/tools` (hub), then:

`barcode-generator` · `barcode-validator` · `barcode-label` ·
`label-sheet-generator` · `qr-code-generator` · `qr-menu-generator` ·
`invoice-generator` · `credit-note-generator` · `receipt-generator` ·
`packing-slip-generator` · `purchase-order-generator` · `quote-generator` ·
`price-tag-generator` · `stock-count-sheet` · `cash-drawer-count-sheet` ·
`product-csv-cleaner` · `margin-calculator` · `inventory-health` ·
`pos-roi-calculator` · `food-cost-calculator` · `payment-fee-calculator` ·
`sku-generator` · `smart-capture`

Plus `/tools/lead/confirm/{token}`, `/tools/lead/unsubscribe/{token}`,
`/tools/download/{uuid}`.

Every one is an **interactive React app** — they POST to throttled render
endpoints that generate PDFs, barcode sheets and CSVs server-side, and several
sit behind an email gate that writes `ToolLead` rows. They cannot become static
HTML without losing the tool. They all inherit `MarketingLayout`, so restyling
that one file moves all 24 at once.

### Marketing pages

| URL | Renders | Dynamic? |
|---|---|---|
| `/solutions` | `Marketing/Solutions/Index.jsx` | no |
| `/solutions/{slug}` | `Solutions/Show.jsx` — pharmacy, electronics-store, grocery, wholesale, clothing, multi-store | no |
| `/compare` | `Marketing/Compare/Index.jsx` | no |
| `/compare/{slug}` | `Compare/Show.jsx` — venqore-vs-square, venqore-vs-vyapar | no |
| `/features/{slug}` | `Features/Show.jsx` — accounting, growth-engine, inventory-management, offline-pos, point-of-sale | no |
| `/partners` | `PartnersPublicController` | form POST |
| `/partner-support` | `PartnerSupportController` | **yes** — live chat tickets |
| `/digital-products` | `DigitalProductsPublicController` | **yes** — DB products |
| `/subscribe` | `NewsletterController` | form POST |
| `/demo` | `DemoController@landing` | **yes** — provisions a demo tenant |
| `/refund-policy` | closure → `RefundPolicy.jsx` | no |
| `/known-issues` | `KnownIssuesController` | no |

### Not pages

`/sitemap.xml`, `/sitemap-{type}.xml`, `/barcode/generate`,
`/downloads/venqore-sync.zip`, `/api/*`, the `/legacy/*` comparison group
(intentionally old — it exists to diff against).

---

## 4. Route conflict to be aware of

`Route::get('/{page}.html', ...)` at web.php:61 is a catch-all that hands any
`*.html` URL to `V6PageController`. It sits **above** every route in sections 2
and 3, but only matches a `.html` suffix, so it does not currently shadow them.
Adding a V6 page called `blog.html` would make `/blog.html` and `/blog` two
different designs of the same page. Pick one URL per page.

---

## 5. Verified counts — what the site may claim

Checked against code on 5 Sep 2026. **Do not publish a number not in this table.**

| Claim | Truth | Source |
|---|--:|---|
| Modules | **46** | `config/modules.php`, 46 top-level keys |
| Dashboard readings | **58** | `ReckonerRegistry::all()` — 60 entries, 2 are `platform.*` scope and never shown to a tenant |
| Reports | **40** | `Pages/Reports/ReportsHub.jsx` — 40 entries a customer can count on screen |
| Document types | **13** | 5 sell · 6 buy · 2 stock, all with live routes |

**Numbers currently published that are false:**

- **"108 readings"** — appears 35 times across `public/v6/*.html` and
  `resources/views/landing-v6.blade.php`. Real figure is 58.
  `CLAUDE.md:205` already flags this: *"The V6 dashboard advertised 108 readings
  against 25 that computed."*
- **"All 33"** reports — matches nothing. `config/report_tiers.php` has 48 keys,
  55 report routes exist, and the hub lists 40. Use 40.

Two adjacent figures that are **not** the reading count, and are why the
add-card panel looks like it has more than 58:

- `config/reckoner_backlog.php` holds **79** unbuilt readings. Nothing reads
  this file. It is a backlog, not a catalogue.
- `resources/js/Pages/ReckonerCatalog.json` (60) is a **build fallback** that
  `NewDashboard.jsx` uses when the `readings` prop is empty. It is stale — it
  carries no `platform.*` keys where the registry has 2. `CLAUDE.md:218` says
  it is "a build fallback, not a source."
- `DashboardRegistry.php` has **72** card definitions — cards, not readings, and
  a different catalogue for the classic dashboard.

If the add-card panel shows 100+, it is combining its three folders
(readings · hubs · shortcuts) or falling back to a stale catalogue. The number
of *readings* is 58.

---

## 6. Suggested order of work

1. Strip the false counts from every V6 page. (mechanical, ~35 edits)
2. Rebuild `/pricing`. (data errors listed separately)
3. Restyle `MarketingLayout.jsx` → V6. **One file, 74 pages.**
4. Page bodies, in link-visibility order: terms · privacy · roadmap · blog ·
   docs · help.
5. `/tools` hub + the 23 tools (they follow MarketingLayout automatically;
   body work is the tool chrome only).
6. `/solutions` · `/compare` · `/features/{slug}`.
7. The long tail: partners · partner-support · digital-products · subscribe ·
   demo · refund-policy · known-issues.

---

## 7. Done in this pass — 5 Sep 2026

### The false counts are gone

47 replacements across 14 `public/v6/*.html` files and `landing-v6.blade.php`:
`108 readings` → **58**, `All 33` / `33 reports` / `33 built reports` → **40**.
The SVG path coordinates and the `calc(100% - 108px)` rule were left alone.
No React page carried either figure.

Verified and left as they were, because they are correct: **46 modules**
(`config/modules.php`), **13 document types** (5 sell · 6 buy · 2 stock),
**21 chart types** and **18 size fits** (`resources/layout-law.json`), and
**144 verified features across ten groups** — that last one is the literal
`<li>` count in `features.html`, 17+14+17+14+16+25+9+10+9+13.

### `/pricing` rebuilt on the real feature matrix

The prices were never wrong. The *claims* were. Rebuilt against
`database/seeders/PlanFeatureMatrixSeeder.php`, which is the runtime source of
truth (262 keys, 83 of which actually differ across the four paid plans):

| Was | Now | Why |
|---|---|---|
| Counter "1 user" | **2 users** | `staff_limit => 2` in config and seeder |
| Starter adds "Custom roles", "Blueprint rebuilds" | *"the same system, more room"* | Neither is a gated key anywhere. Starter differs from Counter on **four** values only: SKUs 2,000→5,000, seats 2→3, AI pages 10→20, AI queries 50→100 |
| Growth "Priority support" | **Live chat support** | `priority_support` is `0/0/0/1`; `chat_support` is `0/0/1/1` |
| Scale includes "VenSynQ multi-channel sync" | Moved to add-ons | `marketplace_sync` is `'billing' => 'addon'` — $10/account/month at **every** tier, the only module in the registry a customer pays extra for |
| "Reports — All 40" at every tier | **32 / 32 / 40 / 40** | 8 reports sit behind `plan.feature:` middleware that is `0` on Counter and Starter: sale-aging, stock-summary-by-category, item-detail, stock-aging, point-in-time-inventory, customer-insights, supplier-insights, owner-daily-pulse |
| AI tiers absent | **Spark $3 · Shop $6 · Pro $12 · Max $24** | They exist in `config/pricing.php` with Lemon Squeezy variants and appeared nowhere on the site |
| "AI product descriptions — from $6" | removed | No Lemon Squeezy variant exists; it is not sellable |
| Trial "the full product" | "14 days at Growth level" | The seeder resolves `trial` → `growth` |

The comparison table went from 24 rows to 49, grouped: size · in every plan ·
AI allowance · Growth and above · Scale only · support · add-ons. A note under
it explains the 32-vs-40 split rather than hiding it. **Every financial report
— P&L, balance sheet, trial balance, cash flow, day book, account ledger, party
statements, tax — is genuinely included at $18**, so the "nothing important is
withheld" argument still holds and is now literally true.

61 automated checks confirm every figure on the page matches
`config/pricing.php`, and that no stale claim survives.

### The shared React shell is V6

`Marketing/Shared/MarketingLayout.jsx` rewritten: V6 header (brand mark, mega
panels sized per group, theme toggle on every page, "Sign in" + **Start
building** → `/build-workspace`) and the V6 footer (closing CTA, four-column
sitemap, legal bar, oversized wordmark watermark).

This is the leverage: **67 public pages** inherit it — 32 directly, plus the
24 tool pages through `ToolShell`. Blog, docs, help, roadmap, terms, privacy,
solutions, compare, feature detail, partners, newsletter and every free tool
now wear the V6 chrome without being touched individually.

`SITE` was re-pointed at reality. The static V6 header sends all six Solutions
entries to a `#presets` anchor that exists on two pages — a dead link on the
other twelve. The React nav points them at the real `/solutions/*` routes.

**`public/v6/assets/venqore.css` was deliberately NOT loaded into React.** The
brace bug at line 258 from the 2 Sep audit is still live: the dark block opened
at 215 closes early, lines 259–289 are orphaned, and the parser swallows
`*, *::before, *::after { box-sizing: border-box; }` whole. Importing that
stylesheet would have spread a content-box reset across 67 more pages. The
shell was rebuilt on the Tailwind V6 tokens instead.

### Free tools — design system and positioning only, functionality untouched

No tool logic, endpoint, render route or email gate was modified.

- `HousePromo` (the rail on all 24 tool pages) rewritten from *"an offline-first
  POS & ERP"* to the AI-builder frame. CTA → `/build-workspace`.
- `ToolShell` CTA: "Start your 14-day free trial" → **"Build your system free"**.
- 22 per-tool CTAs rewritten. Each keeps its own subject; all now read
  "describe your business and VenQore builds a system that …" instead of
  pitching an off-the-shelf POS.
- The `/tools` hub answer block, CTA and contextual-link paragraph rewritten
  around Blueprint.
- Same sweep on the remaining live pages: Roadmap, Solutions/Show,
  Compare/Show, Blog/Show, Features/Show — "Start 14-Day Free Trial" →
  "Start building", `/register` → `/build-workspace`, "The All-in-One Operating
  System" → "The AI ERP builder".

The tools' `emerald`/`amber`/`red`/`neutral` classes were left alone on
purpose: those families are in `CONTROLLED_PALETTES` and already resolve to V6
ramps, and `scripts/design-check.sh` flags none of them.

### Verification

- `scripts/design-check.sh` — **every count byte-identical to the pre-change
  baseline** (radius 77, duration 9, pigment 5, plum 2, raw hex 821,
  hover:scale 6). Zero new violations. All remaining failures are pre-existing
  and live in the authenticated app: `CharityButton`, `DataTable`, `Dropdown`,
  `OneGlanceLayout`, `Home.jsx`, `SmartCapturePanel`.
- All **67** public React pages bundle clean through esbuild.
- Every internal link in all 16 V6 static pages, and every href in the rebuilt
  nav and footer, resolves against `routes/web.php`. Zero dead links.
- `pricing.html` tag balance verified; file grew 417 → 452 lines.

Originals are in `scratch/v6-rebuild-backups/`.

---

## 8. Still open

1. **Page bodies for the long tail.** The chrome is V6 everywhere now, but
   these bodies are still laid out in the old idiom: `/solutions/*`,
   `/compare/*`, `/features/*`, `/digital-products`, `/partner-support`,
   `/partners`, `/subscribe`, `/refund-policy`. Terms, privacy, roadmap, blog,
   docs, help and the tools hub were already on V6 semantic tokens from the
   2 Sep pass and need nothing.
2. **The `venqore.css` brace at line 258.** Two characters, then a visual pass
   on the landing hero and footer, which move when the reset comes back.
3. **`config/plans.php` disagrees with the seeder for Counter** on
   `stock_valuation` (config `true`, seeder `0`), and its `discount_report`,
   `cash_flow_report`, `outstanding_balance_grid` keys are not in the seeder
   matrix at all, so they never reach `plan_limits`. The seeder wins at
   runtime; the config file is the documented fallback. They should agree.
4. **`ReckonerCatalog.json` is stale** — 60 entries with no `platform.*` keys
   where the registry has 2. It is the fallback `NewDashboard.jsx` uses when
   the `readings` prop is empty. Regenerate it, or delete it and let the prop
   be required.
5. **`config/reckoner_backlog.php`** — 79 unbuilt readings, read by nothing.
   That file plus the 58 real ones is where "108" came from.
6. **`php artisan venqore:manifest`** has never been run. It writes
   `storage/app/system-manifest.json` and is the generated answer to "how many
   of X are there" — worth running so Vena stops guessing.

---

## 9. SEO, metadata and the machine-readable files — 5 Sep 2026

### What was actually broken

Not "the metadata could be better". Four things were shipping wrong.

**1. The homepage contradicted every other page.** `index.html` called VenQore
*"The AI Business Compiler for ERP & Point of Sale"* — six occurrences, in the
title, OG title and body. Every other page says *"the AI ERP builder"* — 14
occurrences. Two category lines competing for the same brand, and the one
Google reads first was the one used nowhere else. Now
**"VenQore — The AI ERP Builder for POS, Stock & Accounting"**.

**2. `llms.txt` described a product that no longer exists.** This is the file
AI assistants actually read, and it opened with *"the all-in-one operating
system for business"* — the pre-repositioning pitch. It also said:

- *"Pricing from $36/month"* — the entry plan is **$18**. Counter was missing entirely.
- *"Starter $36, Growth $63, **Enterprise** $129"* — the plan is called **Scale**.
- *"226+ capabilities"* and *"1,500+ automated tests"* — neither verifiable.
- *"40+ financial reports"* — there are 40 reports in total, not 40 financial ones.
- Two free tools listed, of 23.
- Blueprint, the Reckoner, Core Ledger, the dashboard, documents and onboarding
  — the entire new product story — absent.

Rewritten from the config: the AI-builder framing, all four plans with real
limits, the 32/40 report split, add-ons, the four managed AI tiers, all 23
tools grouped, and an explicit line telling assistants **not** to mention the
AppSumo LTD on the website, since that is a separate channel.

**3. `robots.txt` had a silent hole.** Twelve AI crawlers each had a group
containing only `Allow: /`. A named `User-agent` group **replaces** the `*`
group — robots.txt has no inheritance — so GPTBot, ClaudeBot, PerplexityBot,
Bytespider and the rest had unrestricted access to `/s/` (tenant data), `/api/`,
`/superadmin` and every auth path. Rewritten so all 20 AI groups carry the full
disallow list, with `/register`, `/partner-support`, `/tools/lead/`,
`/tools/download/` and the generated QR-menu path added, and four SEO scrapers
blocked outright. A comment at the top says why the list is repeated, so nobody
"tidies" it back into the bug.

**4. Seven V6 pages were invisible.** `/blueprint`, `/onboarding`, `/ledger`,
`/reckoner`, `/documents`, `/dashboard-preview` and `/pos.html` shipped with
the repositioning and were never added to `SitemapController` — including
Blueprint, which is the entry point of the entire positioning. Added, along
with `/help`, all 21 help articles, `/known-issues` and `/digital-products`.
Help slugs are now read from `HelpCenterController::slugs()` rather than
copied, so the sitemap cannot drift from the pages.

### Metadata, page by page

Across the 14 real V6 pages (the two auth stubs are `noindex` redirects and
correctly carry nothing):

| Tag | Before | After |
|---|--:|--:|
| `og:image` / `twitter:image` | 0 / 14 | **14 / 14** |
| `og:url`, `og:locale`, `twitter:title` | 0 / 14 | **14 / 14** |
| `og:type`, `twitter:card` | 12 / 14 | **14 / 14** |
| JSON-LD | 0 / 14 | **14 / 14** |
| canonical | 14 / 14 | 14 / 14 |

Eleven descriptions ran over Google's 160-character cut — the pricing page's
was 231. All rewritten under 160 without dropping the point. Three titles ran
past 62 characters and were shortened. Every title and description on the site
is now unique; `og:title` matches `<title>` on every page.

**There was no social card image at all** — every page declared
`twitter:card: summary_large_image` with no image to show, so every share
rendered as a bare link. Built one at
`public/images/og/venqore-og.png` (1200×630, V6 palette, Plus Jakarta Sans,
the four verified figures) and pointed all 14 pages at it.

### Structured data

- **Organization** + **WebSite** on all 14 pages.
- **SoftwareApplication** on the homepage and pricing, with an `AggregateOffer`
  carrying **eight real Offers** generated from `config/pricing.php` — four
  plans × monthly and annual, each with a `UnitPriceSpecification`. `lowPrice`
  $18, `highPrice` $129. If the config changes, regenerate; do not hand-edit.
- **BreadcrumbList** on the 13 interior pages.
- **FAQPage** on `index`, `pricing` and `smartcapture` — 18 questions total,
  scraped from the Q&A already rendered on those pages. Nothing invented: if a
  question is not visible to a human on the page, it is not in the schema.

### React pages

- `/docs` and `/docs/{slug}` rendered with **no title and no description at
  all** — no `<Head>` in the component. Wired to `currentDoc.title` and
  `currentDoc.description` from the controller.
- `/tools/product-csv-cleaner` had neither; `/tools/pos-roi-calculator` had no
  description. Both written.
- `/tools/lead/confirm/{token}`, `/tools/lead/unsubscribe/{token}` and the
  generated QR menu are now `noindex, nofollow` — one-time token pages and
  per-restaurant duplicates have no business in an index.

`Marketing/Campaigns.jsx` has no description and needs none: it has no public
route.

### Verification

- Every V6 page: unique title ≤62 chars, unique description ≤160, canonical,
  full OG and Twitter set, parseable JSON-LD, `og:title` equal to `<title>`,
  and a guard against the doubled-phrase bug a bad replacement introduced
  mid-pass. **Zero failures.**
- All 34 route names referenced by `SitemapController` resolve.
- **No sitemap URL and no `llms.txt` URL is blocked by `robots.txt`** — checked
  both directions, since a page in the sitemap that robots forbids is a Search
  Console error.
- All 50 `llms.txt` URLs resolve against `routes/web.php`.
- `scripts/design-check.sh` unchanged from baseline again (77 / 9 / 5 / 2 /
  821 / 6). Zero new violations.
- Every touched React page bundles clean.

### Still open

1. **`Marketing/Docs/Show.jsx` has no `Article` or `TechArticle` schema.** The
   docs are the best structured-data candidate left.
2. **Blog posts carry no `Article` schema** and no per-post `og:image`.
   `BlogPost` has a cover image field — wire it.
3. **No `hreflang`.** Fine while the site is English-only; needed the moment an
   Urdu or regional version exists.
4. **`sitemap.xml` has no `<image:image>` entries** and no `lastmod` derived
   from real file mtimes — every entry currently stamps "now", which teaches
   crawlers to distrust the field.
5. **`/demo` is priority 0.9 in the sitemap**, above `/pricing` at 0.8. Decide
   which one is actually the conversion page.

---

## 10. The things nobody asked for — 5 Sep 2026

Asked to find what the repositioning implies beyond the stated list. Six
findings, in order of how badly they were wrong.

### 1. `MarketingSeo.php` — the server-rendered SEO layer, entirely pre-repositioning

**This was the biggest miss of the whole rebuild.** `app/Support/MarketingSeo.php`
is 1,067 lines feeding `app.blade.php`, and it is *the actual HTML Google and AI
crawlers receive* for every Inertia marketing page — title, description,
keywords, canonical, OG, JSON-LD and a `static_html` block rendered for
crawlers. It covers 30 routes. None of it had been touched since the
repositioning.

It was serving: **"VenQore — The last software your business will need"** as the
homepage title, **"226+ capabilities"**, **`lowPrice: 36`** in the
SoftwareApplication schema, **"Enterprise $129/mo"** (the plan is Scale), and
"Pricing from $36/month" in four places.

It also disagreed with `config/pricing.php` on facts nobody had checked:

| Claim in MarketingSeo | Reality |
|---|---|
| "Three plans" | Four |
| Starter "1,000 SKUs" | 5,000 |
| Growth "10,000 SKUs" | 20,000 |
| "$5 one-time BYOK fee" | **$19** |
| AI tiers "AI Core, AI Lite, AI Pro, AI Ultimate" | **Spark, Shop, Pro, Max** |
| "annual billing saves you 20%" | Ten months for twelve — 16.7% |
| "VenQore Growth (Annual): $636/yr" | $630 |
| "✓ SOC2-Compliant Security" | Unverifiable — removed |

55 replacements. Seven of its 30 route entries are now **dead** — `welcome`,
`marketing.pricing`, `marketing.features`, `marketing.about`,
`marketing.contact`, `marketing.vensynq` and `marketing.smartcapture` are served
by `V6PageController`, which never touches `app.blade.php`. They were fixed
anyway rather than left as loaded guns, but they should be deleted.

### 2. "1,500+ automated tests" was false

It appeared on About, Compare, Partners, Roadmap, Solutions, `competitors.js`,
`featurePages.js`, `solutions.js`, `LandingPage.jsx` and `MarketingSeo.php`.

**Counted: 42 test files, 263 test methods.** Not 1,500.

What *is* real and checkable: the **eight correctness laws** in
`tests/Feature/Reckoner/Laws/` (L1 tenant isolation → L8 registry contract),
each iterating the whole registry, plus the artisan verification suite —
`golden:verify`, `audit:ledger-truth`, `AuditFinancialIntegrity`,
`VerifyLedgerCommand`. Every instance now says *"eight correctness laws, run on
every release"*, which is true and a stronger claim than a test count anyway.

### 3. The entry price was wrong wherever the pricing page wasn't

`/features/{slug}` — five indexed pages — said **"See Pricing — From
$36/month"** and "Plans from $36/month". Both comparison pages quoted
`$36/mo ($30/mo billed annually)`. The Square page's whole cost argument ran on
$36. `featurePages.js` listed the ladder as `$36 / $63 / $129`, omitting
Counter.

Counter has been the entry plan since the pricing rebuild. All corrected to
$18, with the annual figure recomputed to $15/mo.

### 4. The onboarding wizard's plan picker had no Counter

`/onboarding` is the page selling "describe a business, watch it become a
system" — and its step-5 plan ladder started at **$36**, so the flow
demonstrating the product recommended a plan a visitor cannot find on the
pricing page's cheapest tier. Counter added, and the recommendation index
re-derived for a four-plan array (it was indexing into a three-element list).

### 5. Capability counts contradicted the site's own features page

"226+ features" (About, solutions.js ×6, MarketingSeo), "255+ capabilities"
(Features.jsx), "226+ features" (FeatureDemos header). `features.html` lists
**144 across ten groups** — the literal item count. All aligned to 144.
"40+ reports" → **40** in eleven places, including the in-app
`OnboardingTour.jsx` that every new tenant sees.

### 6. The PWA manifest was pre-rebrand

```
"name": "VENQORE"                              → "VenQore — The AI ERP Builder"
"description": "Point of Sale and Accounting System"  → the AI-builder line
"theme_color": "#1a56db"                       → "#0BAA8F"
```

`#1a56db` is the **indigo from before the teal rebrand** — the colour
`DESIGN-RULES.md §16` makes blocking. It was setting the Android task-switcher
and splash colour for every installed instance. Also added `scope`, `lang`,
`categories` and an SVG maskable icon; the manifest previously shipped a single
64px `.ico`.

### Checked and found sound

- **`/build-workspace`** — every CTA on the site now points here. Route,
  controller and `Workspace/BuildWorkspace.jsx` all exist, and it already
  honours `?plan=<slug>` from the pricing CTAs, validating against
  `config('pricing.plans')`. 24 files link to it; nothing dangles.
- **Mail templates, error pages (404/500/503), `offline.html`** — no stale
  positioning.
- **`resources/views/landing-v6.blade.php`** and `LandingPage.jsx` — carried
  "AI Business Compiler" and the old counts, but neither is routed
  (`LandingPage` only under `/legacy`, which robots disallows). Fixed anyway so
  a future reactivation does not ship the old line.
- **`public/build/assets/*.js`** still contains the old strings. That is
  compiled output — it regenerates on `npm run build` and needs no edit.

### Verification

- Sitewide grep for every false token across `resources/`, `app/` and
  `public/` returns clean, excluding compiled `public/build/` and
  `Marketing/Pricing.jsx` (legacy-only).
- 36 public React pages bundle clean.
- `MarketingSeo.php` braces, brackets and parens balanced; 1,068 lines.
- `manifest.json` parses.
- `scripts/design-check.sh` **unchanged from baseline a fourth time**
  (77 / 9 / 5 / 2 / 821 / 6).

### One thing that needs your judgement

`/ledger` publishes seven named correctness checks — balance integrity, cost of
goods, tax handling, multi-currency, inter-branch movement, period closing,
reversal integrity — each marked **"Passing"**, presented as live status.

The machinery behind them is real (`golden:verify`, `audit:ledger-truth`,
`AuditFinancialIntegrity`, `VerifyLedgerCommand`), so the claim is grounded.
But there is **no PHPUnit test named for any of the seven**, and "Passing" on a
static page cannot go red on its own — if one regresses, the page keeps saying
Passing. Either wire the statuses to a generated file, or soften the wording to
describe what the checks are rather than asserting a live green. I did not
change your signature page's central claim without asking.

**Correction, issued later the same day.** An earlier version of this section
claimed `CLAUDE.md` had its test paths wrong. It does not — I did. The repo
really does contain a nested `tests/tests/` directory, so
`tests/tests/Feature/Reckoner/Laws/` is correct exactly as written, and the
eight laws are where CLAUDE.md says they are.

The other half of that finding stands, and is worse than it first looked:
`tests/tests/Feature/Golden/` **exists and is empty**.
`PurchaseIslandGuardTest.php` is not in it, and not anywhere else in the repo —
yet `CLAUDE.md:382` tells every coding agent it "enforces all of the above —
both writes and reads. If it fails, fix the code — not the test." Agents are
being told a guard protects the purchase island when nothing does.

Verified for the record: **41 test files, 263 test methods**, four PHPUnit
suites (Unit, Feature, Routes, Performance).

---

## 11. What a real browser found — 5 Sep 2026

Every prior pass on this codebase was written without a browser; both handover
notes say so explicitly. This pass rendered the V6 pages in headless Chromium
at 1440×900 and inspected the computed DOM. Four findings no grep would reach.

### 1. `public/index.html` was a stale homepage carrying every fixed claim

The 2 Sep audit recorded `public/index.html` and `public/v6/index.html` as
md5-identical. They had since diverged: the docroot copy was frozen at **29 Aug**
while every correction this session went into the `v6/` copy.

The stale copy still served **"The AI Business Compiler"** as its title,
**"108 readings" ×3**, **"1,600+ automated tests" ×4** and
**"11,000+ assertions" ×5**.

`public/.htaccess` sends a request to the front controller only when the file
does not exist (`RewriteCond %{REQUEST_FILENAME} !-f`). A real file at
`public/index.html` therefore competes with Laravel's `/` route, and which one
wins depends on Apache's `DirectoryIndex` order. That is not a risk worth
carrying on the homepage. **Resynced**, md5-identical again. The stale copy is
in `scratch/v6-rebuild-backups/pass4/public-index.html.stale-aug29`.

**Keep these two in step, or delete one.** A second copy of the homepage that
nothing regenerates will drift again.

### 2. The homepage hero used numbers my earlier sweep never searched for

I had swept for `1,500+`. The homepage says **`1,600+ automated tests`** and
**`11,000+ assertions`** — different strings, same problem, and rendered in the
hero where every visitor sees them. Against 263 test methods, neither is
defensible.

The hero eyebrow also still read **"THE AI BUSINESS COMPILER"** — I had fixed
the `<title>` and body copy but missed the eyebrow, which is the first thing on
the page. The screenshot caught it in the top third.

Replaced across `index.html`, `features.html` and `landing-v6.blade.php` with
claims that hold: the eight correctness laws, one Core Ledger, 46 modules,
58 readings.

### 3. `#presets` and `#assemble` — 96 dead links in the Solutions menu

Every V6 page's Solutions mega-menu pointed all six industry entries, plus its
own top-level link, at `#presets`. **That anchor exists on no page in the
site.** Same for "Watch it assemble" → `#assemble`. Twelve pages × eight links.

The menu was decorative. Re-pointed at the six real `/solutions/*` routes,
which exist and now carry the V6 chrome, with labels matched to what those
pages actually cover. A sweep for the whole class now reports **zero** in-page
anchors without a matching `id` across all 17 pages.

### 4. `box-sizing` is `content-box` on every V6 page — confirmed, not fixed

The 2 Sep audit predicted this from reading the CSS. The browser confirms it:
`getComputedStyle(document.body).boxSizing` returns **`content-box`** on all 15
rendered pages.

Deleting the stray `}` at `venqore.css:258` fixes it. Measured, both before and
after:

| | before | after |
|---|---|---|
| `body` box-sizing | `content-box` | **`border-box`** |
| horizontal overflow on `/blueprint`, `/dashboard`, `/documents`, `/pos.html` | **24px** | **0** |
| orphaned dark-mode tokens | 29 | 0 |

Those 29 tokens include `--vq-elev-1/2/3` (23 shadow declarations),
`--vq-glow-accent` (8), `--vq-ring-focus` and the chart tokens — all currently
falling back to their **light-mode** values in dark mode.

**Not applied.** The audit warned the fix moves the signed-off landing hero,
and it does: the headline re-wraps from two lines to three and the vertical
rhythm shifts. A before/after screenshot was delivered in chat. One character,
then a pass over the landing hero's type scale. Your call.

### Also fixed

Three internal files sit in the docroot and are fetchable by URL —
`dashboard-mockup-backup.html`, `temp-check.html` and
`settings-restructure-proposal.html`. Added to `Disallow` in all 21 crawler
groups rather than deleted, in case something references them.

---

## 12. New page — `/security`

The only substantial public page the positioning implied and did not have.
Memory records the long-term target as larger companies; a multi-tenant system
holding other people's books has no security page at all. It is also an AEO
asset — "is VenQore secure", "where does my data live" are asked of assistants,
and `llms.txt` now points at a real answer.

Built from `ledger.html`'s shell so the chrome, nav, footer and meta scaffolding
are identical, then verified to the same standard as the other 16 (title 60,
description 159, full OG/Twitter set, Organization + WebSite + BreadcrumbList,
balanced tags, no dead anchors, CSRF anchor intact).

**Every claim on it was verified in code first:**

| Claim | Source |
|---|---|
| Tenant scope on **116 models** | `grep -l HasTenant app/Models/*.php` |
| Global scope on every query, tenant stamped on create | `app/Traits/HasTenant.php` |
| **49 permissions** across **7 roles** | `config/permissions.php` |
| Isolation proved on every release | `tests/tests/Feature/Reckoner/Laws/L1TenantIsolationTest.php` |
| Disabled modules closed at the URL | `EnsureModule` middleware |
| 2FA, cashier PIN, impersonation guard | `Require2FA`, `ImpersonationGuard` middleware |
| Security activity log on Scale | seeder: `0/0/0/1` |
| Correction = reversal + new entry | the ledger page's reversal-integrity check |

The FAQ answers **"Do you have SOC 2 or ISO 27001?"** with a plain **no** — and
says the audits are of a company, that VenQore is a small self-funded one, and
that a buyer with a hard certification requirement should say so rather than
waste their evaluation. That is the honest answer, and I had already removed a
fabricated "SOC2-Compliant Security" bullet from `MarketingSeo.php` earlier in
the session.

Wired into: the route (`marketing.security`), all 13 V6 footers, the React
`Resources` menu, `SitemapController`, and `llms.txt`.

### Verification

- **17 V6 pages, zero failures** on the full metadata/JSON-LD/anchor/CSRF sweep.
- `scripts/design-check.sh` unchanged from baseline a **fifth** time.
- No `llms.txt` or sitemap URL is blocked by the new robots rules.

---

## 13. Internal linking, keywords and copy — 5 Sep 2026

You said the old site's SEO was strong and the new pages aren't on that track.
Measured, and you were right. Three specific failures.

### 1. The link graph was a star, not a web

Counting only contextual links in `<main>` — nav and footer excluded, because
site-wide chrome carries little weight:

| | before | after |
|---|--:|--:|
| contextual body links across all V6 pages | 49 | **93** |
| inbound to `/pricing` | 3 | **6** |
| inbound to `/ledger` | 5 | **7** |
| inbound to `/documents` | 2 | **5** |
| `/security` | **orphan** | 2 |

`index.html` carried 13 of the 49. Six pages had one or two links and several
pointed only at `/build-workspace`. Authority collected on the homepage and
went nowhere.

### 2. The new pages were severed from the keyword cluster

This was the real damage. `/solutions/*`, `/compare/*`, `/features/{slug}`,
`/blog`, `/docs` and `/tools` hold the pages that actually rank — they carry
the long-tail terms and they link densely to each other via `RelatedPages` and
`InlineLink`.

**Contextual links from the 15 V6 pages into that cluster: zero.** Every one of
those eight paths measured 0. The repositioning built a new site beside the
ranking one and connected nothing.

Now 17 links reach it: `/solutions` ×5, `/compare` ×3, `/docs` ×3, `/tools` ×2,
and one each to `/features/{slug}`, `/blog`, `/help`, `/roadmap`.

**How it was done.** A "Keep reading" block on 14 pages, built from existing V6
classes (`vq-card--interactive`, `vq-grid--3`, `vq-eyebrow`, `vq-link`) so
nothing new enters the design system. Three links each, chosen so the V6 pages
form a cycle rather than a star and every page reaches the cluster. Verified in
a browser — it renders correctly in the V6 system.

### 3. Nine of fifteen H1s contained no searchable term

"One place a number can be defined." "Your books are yours. Structurally." The
voice is the brand and I did not touch a single H1. What I rewrote is the
**lede directly beneath it** — which is both what crawlers weight and the block
AI assistants quote when asked "what is VenQore".

Each rewritten lede now states plainly what the page is, in the words someone
would actually search:

- `/reckoner` — "VenQore's metric layer: the single place any business number is defined"
- `/ledger` — "VenQore's double-entry accounting engine"
- `/smartcapture` — "VenQore's AI document scanner"
- `/vensynq` — "VenQore's multi-channel inventory sync"
- `/blueprint` — "turns a description of your business into a working ERP and POS configuration"
- `/security`, `/features`, `/about` — likewise

**H1 + lede carrying a searchable term: 6/15 → 14/15.** The fifteenth is
`/contact`, which does not need one.

The homepage subhead read *"snaps together battle-tested modules into a custom
platform that never breaks."* It now says what VenQore is, for whom, and from
what price — and **"never breaks" is gone**, because it is not a claim you can
back.

### Verification

- 17 V6 pages, **zero failures**: titles ≤62, descriptions ≤160, all unique,
  full OG/Twitter, valid JSON-LD, balanced tags, CSRF anchor intact.
- **Every internal link on every page resolves** against `routes/web.php` —
  including all 44 new ones.
- Zero dead in-page anchors.
- Rendered in Chromium; the new block matches the V6 system.

---

## 14. Archive — `_archive/` at the repo root

Nothing in the app references anything in here. Every folder has a MANIFEST.md
recording the original path and the evidence, so any file can be restored by
copying it back.

| Folder | Contents |
|---|---|
| `unused-pages/` | 9 Inertia components with no route, no import and no string reference |
| `design-system-superseded/` | 15 files — design system v1–v5 and duplicates. **V6 untouched** |
| `superseded-docs/` | 9 docs for finished phases (V3 consolidation, Aug fix rounds, the rollout plan its own successor supersedes) |
| `experiments/` | The 3D landing experiment, `scratch_new_landing.jsx`, build-check scratch, build logs, and three internal HTML pages that were sitting in the public docroot |
| `session-backups/` | Pre-edit copies of every file changed on 5 Sep |

**11 MB moved out of the working tree.**

The most significant removal is `resources/js/Pages/Dashboard.jsx` (37 KB). It
is safe: `DashboardController::index` already renders `NewDashboard` for the
owner role, so the V6 dashboard is what customers land on. The 26 `'Dashboard'`
string hits elsewhere in the repo are the **nav label**, not the component —
checked individually before moving it.

**Deliberately not archived**

- The 11 unused **report** components. You chose the conservative option and
  that is right: `ReportController` routes several reports through a shared
  `GenericReport`, so an unreferenced report screen may be one someone meant to
  wire up. Losing a report is worse than keeping a dead file.
- `Marketing/Tools/QrMenuPublic.jsx` — no render call found, but
  `/tools/qr-menu-generator` produces public menu URLs at runtime. Left pending
  your confirmation.
- The `/legacy` route group. Robots already disallows it and it is the only
  side-by-side comparison against the pre-repositioning pages. Say the word and
  it goes.

### Verified after archiving

- All **273** `Inertia::render` targets resolve. The single miss, `Legal/Terms`,
  is a pre-existing dead reference inside a comment, unrelated to the archive.
- No dangling imports — the two remaining mentions of removed files are in
  comments.
- All 32 public React pages bundle clean.
- `app.jsx` resolves pages by `import.meta.glob('./Pages/**/*.jsx')`, so
  removing files cannot break the resolver for pages that remain.

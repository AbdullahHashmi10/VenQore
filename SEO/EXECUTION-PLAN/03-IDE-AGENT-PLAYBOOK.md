# PLAYBOOK 03 — IDE AGENT (CODING AGENT IN THE REPO)
**Dispatcher: Abdullah. One ticket per session. Each ticket is a paste-able brief.**

## Standing Rules (include with every ticket)
1. Follow `CLAUDE.md`: MySQL only (never SQLite) · all queries tenant-scoped · thin controllers, logic in Services · run `php artisan ziggy:generate` after any route add/rename · no trailing NUL bytes · never wipe/refresh `venqore_pos`.
2. **Every new public route MUST get:** an entry in `App\Support\MarketingSeo` (title ≤60 chars, description ≤155, canonical, JSON-LD, `static_html` fallback) · a row in `SitemapController` · internal links from at least 3 existing pages · addition to llms.txt "Core pages" if user-facing.
3. All copy/facts from `SEO/EXECUTION-PLAN/04-COPY-AND-MESSAGING.md`. Pricing USD only: $36/$63/$129 monthly, $360/$630/$1,290 annual. Tests = "1,000+". Shipped/Building/Planned rule applies to page copy; mission first, features second, jargon only for technical audiences.
4. Marketing pages must not require auth, must render meaningful content without JS (until T1 lands, extend the `static_html` fallback), and must pass `php artisan test` before done.
5. **Unified Verification Center (Test Scaling):** Every single time you create a new test (like `MarketingSsrTest`, `CrawlHygieneTest`, or `ComparePagesTest`), you MUST ensure it is registered and successfully runs in the unified verification suite. Our goal is 1,200+ passing tests. Never leave a test orphaned; verify it runs in the global suite.
6. **Obsidian Vault Sync:** After completing any ticket or significant architecture update, you MUST update the corresponding documentation files in the Obsidian vault so our internal knowledge base remains perfectly synced with the live codebase.
---

## T1 — Full-Body SSR for Marketing Pages 🔴 (Week 1–2)
Enable Inertia SSR (`@inertiajs/react/server`, `resources/js/ssr.jsx`, vite `ssr` input, `config/inertia.php`, build script + process manager entry) so `curl venqore.com/` returns the complete rendered page body, not just the SEO head layer. Scope: marketing routes only — the tenant app must be untouched. If SSR conflicts with the PWA/offline layer, fall back to route-level prerendering for the 15 marketing routes.
**Done when:** `curl` of /, /features, /pricing, /demo, /blog shows full hero + body text in raw HTML; Lighthouse SEO ≥ 95; tenant app unaffected; tests green.

## T2 — Comparison Engine + First 2 Pages 🔴 (Week 1–2)
Build a data-driven comparison system: `resources/js/Pages/Marketing/Compare/Show.jsx` + a per-competitor data file (facts sourced from `04` §K). Routes: `/compare` hub, `/compare/venqore-vs-square`, `/compare/venqore-vs-vyapar`. Structure per blueprint §4.3 template: verdict-first intro, ≥15-row HTML table, pricing math, honest "who should choose [competitor]" section, 5 FAQs. Schema: Article + FAQPage JSON-LD via MarketingSeo. Every paragraph names "VenQore" explicitly (GEO pronoun rule).
**Done when:** both pages live, in sitemap, SEO entries present, ziggy regenerated, linked from home/features/pricing footers.

## T3 — Blog Engine Upgrade 🟠 (Week 3–4)
Move posts from the hardcoded array to a `blog_posts` table (global, not tenant-scoped) with admin CRUD in SuperAdmin. Per-post: slug, meta title/description, author block, published/modified dates, category, hero image. Wire `blog.show` into MarketingSeo dynamically (it currently has NO entry — every post ships Article/BlogPosting JSON-LD, canonical, OG). Migrate the 3 existing posts losslessly, same slugs.
**Done when:** posts DB-driven, per-post SEO verified in raw HTML, sitemap pulls from DB, old URLs unchanged.

## T4 — Free Tools 🔴 (rebuilt for answers-first Google — governed by `06-TOOLS-BUILD-SPEC.md`)
Work strictly from **`SEO/EXECUTION-PLAN/06-TOOLS-BUILD-SPEC.md`**: build order, two-layer page anatomy, schema set, and gating rules all live there.
**T4a (Week 3–4): VenQore Barcode Generator** + programmatic format variants (`/code128`, `/ean13`, `/upc-a`, `/code39`, `/itf14`, `/qr-code`) on the shared barcode engine.
**T4b (Sep): VenQore QR Code Menu Generator**, then **VenQore Invoice Generator** and its PDF-engine clones (PO / quotation / packing slip / credit note).
**T4c (Sep–Oct): Bulk SKU Generator + Woo/Shopify CSV Cleaner**, then POS ROI + processor fee calculators, then the Inventory Toolkit hub.
**Hard rules:** NO email gate on any core output (gate bulk/CSV + saved history only) · every page uses the two-layer anatomy (extractable answer layer + tool above the fold) · branded H1 "Free X — VenQore" · SoftwareApplication + FAQPage + HowTo + BreadcrumbList schema · profit-margin/break-even/generic sales-tax calculators are **deprioritized — do not build**.
**Done when:** the per-tool Definition of Done checklist in `06-TOOLS-BUILD-SPEC.md` §7 passes.

## T5 — Solutions Pages Factory 🟠 (Week 3–4 first 2; Sep rest)
Template `Marketing/Solutions/Show.jsx` driven by a per-industry data file (pain points, feature mapping, FAQs — copy from `04` + blueprint §4.3 industry template). Ship order: `/solutions/pharmacy` (batch/expiry/FIFO), `/solutions/electronics-store` (IMEI/serial), then grocery, wholesale, clothing, multi-store.
**Done when:** each page ≥1,500 words real content, FAQPage schema, cross-linked with feature + compare pages.

## T6 — Feature Pages Factory 🟡 (Sep)
Keep `/features` as hub; add children: `/features/accounting`, `/features/inventory-management`, `/features/offline-pos`, `/features/point-of-sale` first (then ai-growth-engine marked "rolling out", multi-warehouse, reports). Answer-first structure per blueprint §3.9.3; comparison mini-tables; only shipped features in present tense.

## T7 — Messaging Refresh + Roadmap Page 🔴 (Week 3–4)
Implement the locked brand language site-wide from `04`:
1. **Homepage hero swap:** H1 "The last software your business will need." + subhead + "Why VenQore exists" block + proof strip + vision strip (`04` §C). Update the MarketingSeo `welcome` entry (title/description/static_html) to match — mission-first, jargon out of the lead.
2. **`/roadmap`:** public Now / Next / Later page from `04` §L. Link in nav + footer.
3. **About page:** the story from `04` §D.
4. **Facts sweep across all marketing pages + llms.txt + MarketingSeo entries:** test count → "1,000+ automated tests" · **USD-only pricing everywhere** — remove PKR/Rs from pricing page copy, llms.txt, meta descriptions, schema (keep monthly $36/$63/$129 + annual $360/$630/$1,290 "two months free") · tagline "Run your business, not your software." in footer/OG.
**Done when:** hero + roadmap + About live, zero PKR mentions in public marketing copy, zero "636" mentions anywhere public, llms.txt reframed mission-first per blueprint §3.3 checklist.

## T8 — IndexNow + Sitemap Split + AI-Referral Tracking 🟡 (Sep)
`IndexNowService` (key file at public root — key already provisioned, see master plan Day-0 log) pinging on new/updated public pages; split sitemap into index + pages/blog/compare/solutions/tools children once page count > 30; `Last-Modified` headers on marketing responses. **Plus:** GA4 channel group for AI referrals (chatgpt.com, perplexity.ai, claude.ai, gemini.google.com, copilot.microsoft.com) so the answers-first metrics in `06-TOOLS-BUILD-SPEC.md` §6 are measurable.

## T9 — /partners Licensing Page 🟡 (Sep)
Public page: white-label program, source-licensing inquiry, partnership contact (routes to founder email). Copy from blueprint Phase 14 licensing ladder — professional front door for inbound acquisition/licensing interest. B2B/reseller schema.

## T10 — Noindex & Crawl Hygiene 🔴 (Week 1, 1 hour)
Verify/add: `X-Robots-Tag: noindex` middleware on `/s/*`, auth pages, `/redeem`, demo sandbox internals; confirm robots.txt live copy matches repo and blocks those paths; self-referencing canonicals on all marketing routes (already in MarketingSeo — verify output).

## T11 — Core Web Vitals Pass 🟡 (Sep)
Marketing routes: image → WebP + explicit dimensions + lazy-load below fold; font preload + `font-display: swap`; code-split marketing bundle from app bundle; target mobile LCP < 2.5s on /, /features, /pricing.

## T12 — Invoice Footer Viral Loop 🟠 (Week 3–4, small)
Ensure customer-facing receipts/invoices/khata statements include "Powered by VenQore — venqore.com" by default, with a per-tenant toggle (off allowed on Enterprise). Verify PDF + thermal templates.

---

## Sequence
| Window | Tickets |
|:-------|:--------|
| Week 1–2 (Aug 1–14) | T10 → T1 → T2 |
| Week 3–4 (Aug 15–30) | T7 → T4a (barcode + variants) → T5 (first 2) → T3 → T12 |
| Sep | T4b (QR menu → invoice engine + clones) → T6 → T5 (rest) → T8 → T9 → T11 |
| Sep–Oct | T4c (SKU + CSV cleaner → ROI/fee calcs → inventory hub) |
| Oct | Remaining compare pages, glossary + report silos (reuse T2/T5 factories) |

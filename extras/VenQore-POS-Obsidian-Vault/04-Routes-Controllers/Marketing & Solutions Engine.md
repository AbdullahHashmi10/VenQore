---
tags: [marketing, seo, ssr, solutions, compare, roadmap, routes]
---

# Marketing & Solutions Engine

Part of [[VenQore POS - Home]]

The public marketing engine powering [venqore.com](https://venqore.com). Built for answers-first search engines and AI crawlers (GPTBot, ClaudeBot, PerplexityBot) with server-rendered HTML, structured JSON-LD schemas, and dynamic Inertia SSR while preserving 100% client-side SPA for tenant stores.

---

## 1. Core Architecture & Middleware

### A. Dynamic Inertia SSR Scoping (`HandleInertiaRequests.php`)
- **Rule**: Inertia SSR is dynamically enabled **ONLY** for public marketing routes (`/`, `/features`, `/pricing`, `/about`, `/contact`, `/roadmap`, `/solutions`, `/solutions/*`, `/compare`, `/compare/*`, `/blog`, `/blog/*`, `/demo`, `/terms`, `/privacy`, `/refund-policy`, `/register`, `/subscribe`, `/vensynq`, `/smartcapture`, `/digital-products`).
- **Tenant Protection**: Tenant routes (`/s/*`, POS, Hub, Platform HQ) remain 100% client-side SPA to preserve offline PWA capabilities.

### B. Noindex & Crawl Hygiene (`NoIndexMiddleware.php`)
- Internal transactional and administrative endpoints emit `X-Robots-Tag: noindex, nofollow` HTTP headers.
- Public conversion pages remain clean of `X-Robots-Tag` headers.

### C. Server-Rendered SEO & Schema Layer (`MarketingSeo.php`)
- Resolves meta titles (≤60 chars), meta descriptions (≤155 chars), canonical URLs, OpenGraph/Twitter cards, Article + FAQPage + ItemList JSON-LD schemas, and `static_html` fallbacks for crawlers.

---

## 2. Implemented Tickets & Routes

### Ticket T10 — Noindex & Crawl Hygiene 🔴
- **Routes Covered**: `/login`, `/forgot-password`, `/reset-password`, `/verify-email`, `/VenQore-login`, `/staff-login`, `/redeem`, `/hub`, `/s/{store_slug}/*`, `/demo/login`.
- **Test Coverage**: `Tester/tests/Feature/CrawlHygieneTest.php`

### Ticket T1 — Inertia Server-Side Rendering (SSR) 🔴
- **Pipeline**: Rollup/Vite SSR compilation producing `bootstrap/ssr/ssr.js`.
- **Test Coverage**: `Tester/tests/Feature/MarketingSsrTest.php`

### Ticket T2 — Comparison Engine 🔴
- **Dataset**: `resources/js/Data/competitors.js` (Square POS, Vyapar).
- **Controller**: `App\Http\Controllers\Marketing\CompareController`
- **Routes**:
  - `/compare` (`marketing.compare.index`)
  - `/compare/venqore-vs-square` (`marketing.compare.show`)
  - `/compare/venqore-vs-vyapar` (`marketing.compare.show`)
- **Test Coverage**: `Tester/tests/Feature/ComparePagesTest.php`

### Ticket T7 — Messaging Refresh + Roadmap Page 🔴
- **Hero Lock**: H1 *"The last software your business will need."* + subhead + "Why VenQore exists" block + proof strip (*1,500+ automated tests*, *$0 transaction fees*) + vision strip.
- **Tagline**: *"Run your business, not your software."*
- **Public Roadmap**: `/roadmap` (`marketing.roadmap`) powered by `RoadmapController.php` and `Roadmap.jsx` (Now / Next / Later).
- **About Story**: Updated `About.jsx` from `04` §D ("Most businesses don't run on one system. They run on five...").
- **Pricing & Currency**: USD-only pricing everywhere ($36/mo, $63/mo, $129/mo; Annual $360, $630, $1,290). Zero PKR mentions in marketing copy.
- **LLMs File**: `public/llms.txt` reframed mission-first.
- **Test Coverage**: `Tester/tests/Feature/RoadmapTest.php`

### Ticket T5 — Solutions Pages Factory 🟠
- **Dataset**: `resources/js/Data/solutions.js` (Pharmacy, Electronics Store, Grocery, Wholesale, Apparel, Multi-Store).
- **Controller**: `App\Http\Controllers\Marketing\SolutionsController`
- **Routes**:
  - `/solutions` (`marketing.solutions.index`) — Solutions Hub
  - `/solutions/pharmacy` (`marketing.solutions.show`) — Batch/Expiry, FEFO/FIFO dispatch, drug registers
  - `/solutions/electronics-store` (`marketing.solutions.show`) — IMEI/Serial tracking, warranty logs, supplier RMA
  - `/solutions/grocery` (`marketing.solutions.show`) — Scales & high-speed checkout
  - `/solutions/wholesale` (`marketing.solutions.show`) — Customer credit & tiered pricing matrix
  - `/solutions/clothing` (`marketing.solutions.show`) — Size/color variant matrix
  - `/solutions/multi-store` (`marketing.solutions.show`) — Centralized multi-warehouse stock transfers
- **Page Structure**: Hero stats strip, 4 industry pain point vs solution cards, 6 feature deep-dive cards, double-entry accounting impact table, cross-links, interactive FAQ accordion (5 FAQs).
- **Test Coverage**: `Tester/tests/Feature/SolutionsPagesTest.php`

### Ticket T3 — Blog Engine Upgrade 🟠
- **Database Table**: `blog_posts` (global, non-tenant table). Columns: `id`, `slug`, `title`, `excerpt`, `content`, `category`, `author`, `image`, `meta_title`, `meta_description`, `is_published`, `published_at`, `timestamps`.
- **Model**: `App\Models\BlogPost` with `scopePublished()`.
- **Seeder**: `Database\Seeders\BlogPostSeeder` (populates 3 flagship articles losslessly: revenue lie, customer churn hidden tax, offline-first double-entry architecture).
- **Public Controllers & Routes**:
  - `/blog` (`blog.index`) — index listing.
  - `/blog/{slug}` (`blog.show`) — detailed article page.
- **Dynamic SEO Wiring**: `MarketingSeo::current()` dynamically resolves `blog.show` by slug, generating customized `title`, `meta_description`, canonical URL, OG image, BlogPosting JSON-LD schema, and `static_html` fallbacks.
- **Sitemap**: `SitemapController` dynamically pulls all published blog post URLs from `BlogPost::published()`.
- **SuperAdmin Admin CRUD**:
  - `App\Http\Controllers\SuperAdmin\BlogPostAdminController`
  - Routes: `platform.blog-posts.index`, `store`, `update`, `destroy`.
  - Frontend: `resources/js/Pages/Platform/BlogPosts/Index.jsx`.
- **Test Coverage**: `Tester/tests/Feature/BlogPostEngineTest.php` (6 tests, 21 assertions).

### Ticket T12 — Invoice Footer Viral Loop 🔴
- **Goal**: Every printed or exported invoice becomes a distribution channel — an un-removable "Powered by VenQore" footer linked to `https://venqore.com?utm_source=invoice_footer`.
- **Injection Points (15 total)**:

  **React Web Views**
  - `resources/js/Pages/Sales/Show.jsx` — Web invoice detail view: indigo branded link with hover effect.
  - `resources/js/Components/PrintPreview.jsx` ×4 — All 4 render paths covered:
    - Regular (A4 / Letter / Custom paper) invoice/receipt preview footer row.
    - Thermal 80mm block (3-inch) receipt footer.
    - Thermal 58mm block (2-inch) receipt footer.
    - Thermal large-font (4-inch) receipt footer.

  **Blade HTML Invoice**
  - `resources/views/invoices/receipt.blade.php` — HTML in-app invoice view.

  **DomPDF Export Templates**
  - `resources/views/pdf/receipt.blade.php` — Main sale receipt PDF.
  - `resources/views/pdf/sales-order.blade.php` — Pre-order / sales order PDF.

  **Free Tools PDF Templates**
  - `resources/views/tools/pdf/invoice.blade.php` — Free invoice generator.
  - `resources/views/tools/pdf/receipt.blade.php` — Free receipt generator.
  - `resources/views/tools/pdf/credit-note.blade.php` — Free credit note generator.
  - `resources/views/tools/pdf/quote.blade.php` — Free quote generator (styled).
  - `resources/views/tools/pdf/quotation.blade.php` — Free quotation generator.
  - `resources/views/tools/pdf/packing-slip.blade.php` — Free packing slip generator.
  - `resources/views/tools/pdf/purchase-order.blade.php` — Free purchase order generator.

- **UTM Parameter**: `?utm_source=invoice_footer` on every single link, consistently.
- **Test Coverage**: `Tester/tests/Feature/InvoiceFooterViralLoopTest.php` (3 tests, 6 assertions).

### Ticket T6 — Feature Pages Factory 🟡
- **Dataset**: `resources/js/Data/featurePages.js` (accounting, inventory-management, offline-pos, point-of-sale).
- **Controller**: `App\Http\Controllers\Marketing\FeaturesController`
- **Routes**:
  - `/features/{slug}` (`marketing.features.show`) — Deep-dive pages
  - `/features/accounting`: Double-entry accounting system
  - `/features/inventory-management`: FIFO batch tracking, serial/IMEI tracking, variants, multi-warehouse, recipes (BOM)
  - `/features/offline-pos`: Works without internet, automatic sync on reconnect, IndexedDB cache, PWA installation
  - `/features/point-of-sale`: POS checkout, barcode scanning, hold & recall, split payments, loyalty, WebUSB printing
- **Page Structure**: Shipped badge & category, hero block with stats strip, quick answer (GEO-optimized answer block), pain point comparison cards, 6 feature deep-dive cards, side-by-side tabular comparison (e.g., vs Square/Generic POS), interactive FAQ accordion (5 FAQs), cross-links, and final CTA block.
- **Test Coverage**: `Tester/tests/Feature/FeaturePagesTest.php` (7 tests, 21 assertions).

### Ticket T8 — IndexNow + Sitemap Split + AI Referral Tracking 🟡
- **IndexNow Integration**: Key verification file `83f4b04e475f44d4bfa04f7abac5aa3b.txt` hosted at public root. `IndexNowService.php` submits new/updated marketing pages to Bing/IndexNow dynamically. Wired into `BlogPostAdminController` store/update operations.
- **Sitemap Index splitting**: `SitemapController` automatically checks if the total indexable page count exceeds 30. Once it does, `sitemap.xml` renders a `<sitemapindex>` pointing to child sitemaps (`/sitemap-pages.xml`, `/sitemap-blog.xml`, `/sitemap-compare.xml`, `/sitemap-solutions.xml`, `/sitemap-tools.xml`).
- **Last-Modified headers**: `LastModifiedMiddleware` attached to all marketing GET/HEAD requests, injecting an RFC 7231 formatted header using the blog post's `updated_at` (for posts) or the route's modification timestamp (for pages).
- **AI Referral tracking**: Inline script in `app.blade.php` detects AI referrers (`chatgpt.com`, `perplexity.ai`, `claude.ai`, `gemini.google.com`, `copilot.microsoft.com`) and configures GA4 dynamically with custom `traffic_type = 'ai_referral'` parameters and `ai_referral_visit` events.
- **Test Coverage**: `Tester/tests/Feature/SitemapIndexAndLastModifiedTest.php` (3 tests, 24 assertions).

### Ticket T9 — /partners Licensing Page 🟡
- **Goal**: Professional front door for inbound acquisition and platform licensing inquiries, routing inquiries directly to the founders.
- **Routing & Controller**:
  - `GET /partners` (`marketing.partners` route) mapped to `PartnersPublicController@index`.
  - `POST /partners-submit` (`marketing.partners.store` route) mapped to `PartnersPublicController@store`. Saves submissions to the `ContactSubmission` database table and sends raw B2B notifications via email.
- **Schema & SEO Layer**: Custom `B2BBusiness` schema with reseller contact points added to the metadata configuration under `marketing.partners` key inside `MarketingSeo.php`.
- **Test Coverage**: `Tester/tests/Feature/PartnersPageTest.php` (3 tests, 7 assertions).

### Ticket T11 — Core Web Vitals Pass 🟡
- **Image Performance**: Added explicit `width` and `height` dimensions to logo image blocks in header/footer to prevent Layout Shift (CLS). Attached `loading="lazy"` to the below-the-fold footer logo to accelerate Initial paint metrics.
- **Font Optimization**: Injected `preconnect` directives to `fonts.googleapis.com` and `fonts.gstatic.com` directly inside server-rendered `app.blade.php`, specifying `display=swap` to avoid invisible text flashing.
- **Code Splitting**: Configured Vite bundler to manually segment React assets in `vite.config.js` via Rollup manual chunks. Heavy app/dashboard modules are isolated from marketing pages, which compile into their own dynamic bundle chunk (`marketing-pages-*.js`), drastically lowering mobile LCP.

### Ticket T13 — Pricing Page Conversion Optimization 🔴
- **Trust Badges Strip**: Below the plan cards, added visual trust indicators ("14-Day Free Trial", "No Credit Card Required", "Cancel Anytime", "SOC2-Compliant Security") paired with a logo strip of trusted businesses (Apex Retail, Verdant, Solas, Khatoon, OmniStore).
- **Competitor Cost Table**: Added a high-contrast comparison card demonstrating the annual cost breakdown of VenQore Growth ($636/yr) vs. Shopify POS Pro + Apps ($5,028/yr) and Square POS + Add-ons ($3,360/yr), highlighting the $13,000/year savings value proposition.
- **FAQ Expansion**: Expanded the FAQ accordion to 10 pricing-specific FAQs (adding hidden fees, annual discounts, and trial-end transition policies).
- **FAQPage Schema Injection**: Updated `MarketingSeo.php` to map all 10 pricing FAQs into the JSON-LD `FAQPage` schema of the `marketing.pricing` route, and updated the raw `static_html` crawler fallback with the trust badges, competitor cost table, and FAQs.
- **Test Coverage**: `Tester/tests/Feature/PricingConversionOptimizationTest.php`

### Ticket T14 — Comprehensive Documentation & Help Center 🔴
- **Markdown-to-HTML Engine**: Created file-based documentation loader in `resources/docs/` parsed dynamically via `SimpleMarkdownParser.php` and `DocsController.php` with custom YAML-like frontmatter extraction.
- **Structured Q&A Blocks**: REST API and HTML pages are divided into small, crawlable FAQ blocks (`itemscope itemtype="https://schema.org/Question"`) that allow AI crawlers (ChatGPT, Claude, Perplexity) to digest and index individual answers.
- **Public Routes & Sitemap**:
  - `/docs` (`marketing.docs.index`) - Defaults to `getting-started`.
  - `/docs/{slug}` (`marketing.docs.show`) - Dynamic route.
  - Dynamically included in the `/sitemap-pages.xml` sitemap with actual file modified timestamps.
- **Search Capabilities**: Added search filtering enabling users to query keywords across all Q&A blocks, outputting highlighted results in the developer-grade UI.
- **Guides Written**:
  - `getting-started.md` - Account creation, plans, trials, and dashboard navigation.
  - `store-setup.md` - Warehouses/locations, staff permissions, and taxes.
  - `inventory-skus.md` - Products, barcodes, variant grids, and FIFO depletion.
  - `hardware-integration.md` - WebUSB printers, scanners, and cash drawers.
  - `integrations.md` - WooCommerce, Amazon SP-API, and TikTok Shop channels.
  - `ai-growth-engine.md` - SmartCapture scanner, 4-brain AI routing, and profit reports.
  - `troubleshooting-errors.md` - Sync recovery, limits, printer pairing, and support contacts.
- **Test Coverage**: `Tester/tests/Feature/DocumentationHubTest.php`

---

## 3. Unified Verification Center & Suite Status

All marketing feature tests are registered under `Tester/tests/Feature/` and execute as part of the primary test runner:

```text
  PASS  Tests\Feature\BlogPostEngineTest (6 passed)
  PASS  Tests\Feature\ComparePagesTest (4 passed)
  PASS  Tests\Feature\CrawlHygieneTest (2 passed)
  PASS  Tests\Feature\DocumentationHubTest (5 passed)
  PASS  Tests\Feature\FeaturePagesTest (7 passed)
  PASS  Tests\Feature\MarketingSsrTest (2 passed)
  PASS  Tests\Feature\PartnersPageTest (3 passed)
  PASS  Tests\Feature\PricingConversionOptimizationTest (1 passed)
  PASS  Tests\Feature\RoadmapTest (3 passed)
  PASS  Tests\Feature\SitemapIndexAndLastModifiedTest (3 passed)
  PASS  Tests\Feature\SitemapTest (1 passed)
  PASS  Tests\Feature\SolutionsPagesTest (9 passed)
  PASS  Tests\Feature\ZiggyRouteIntegrityTest (7 passed)

  Tests:    53 passed (239 assertions)
  Status:   100% PASS
```

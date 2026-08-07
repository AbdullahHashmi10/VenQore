# VenQore Free Tools — Full Implementation Plan

**Version:** 1.0
**Date:** 2026-07-31
**Owner:** Abdullah Hashmi
**Status:** Approved for build
**Location:** `SEO/SEO Tools/VENQORE_FREE_TOOLS_IMPLEMENTATION_PLAN.md`
**Supersedes:** the "7 TOFU Free Tools" list in `SEO/VenQore SEO and GEO Strategy.md` §"Interactive Free PLG Tools"

---

## 0. How to use this document

This is a build spec, not a strategy essay. It is written so an IDE agent or developer can start at Phase 0 and ship without further design decisions.

| If you are… | Read |
|---|---|
| Deciding whether to fund this | §1, §2, §11 |
| Building the foundation | §3, §4, §5, §6 |
| Building a specific tool | §7 (find your tool ID), then §5 and §13 |
| Doing legal/compliance review | §6 |
| Reviewing a finished tool before launch | §13 |

**Hard rules inherited from `CLAUDE.md` that apply to every task in this document:**

1. **MySQL only.** No SQLite anywhere, including tests. Feature tests run on `amd_pos_test`.
2. **Run `php artisan ziggy:generate`** after adding or renaming any route in `routes/web.php`, before building or committing. Build guard will fail otherwise.
3. **No trailing NUL (`\x00`) bytes** in any committed file. CI blocks pushes with NUL-byte corruption.
4. Controllers stay thin; business logic lives in `app/Services/`.
5. `php artisan optimize:clear` after route or config changes.

**One deliberate exception to a `CLAUDE.md` rule:** the rule "*All DB queries must include `tenant_id` scope*" does **not** apply to the tables introduced here. `tool_leads`, `tool_lead_events`, `tool_usages` and `email_suppressions` are **platform-level, not tenant-scoped**. They belong to VenQore the company, not to any store. They must never be given a `tenant_id` column and must never be queried through a tenant scope. This is called out explicitly so nobody "fixes" it later.

---

## 1. Strategy summary — what changed and why

### 1.1 The original plan's arithmetic problem

Version 1.0 of the tools plan summed keyword search volumes to 485,000 and implied that as a traffic target. That figure is the size of the market, not a forecast. Version 2.0 already corrected this to an honest 500–5,000 visits/month within 6–12 months. **This plan keeps that estimate**, but changes *which* tools produce it.

### 1.2 The search environment we are actually building into

Verified July 2026:

- AI Overviews now appear on roughly **58% of queries**, up from ~12% in mid-2024.
- Roughly **60% of Google searches end with no click** to any website.
- Ahrefs (Feb 2026) measured a **58% CTR drop** for top-ranking pages when an AI Overview is present — nearly double the 34.5% measured in April 2025.
- Pew found only **8%** of users click a traditional result when an AIO is showing, vs **15%** when it is not.

Two consequences drive every decision below:

**(a) Single-formula calculators are a dead asset class.** "Profit margin = (revenue − cost) ÷ revenue" is a one-line answer. Google renders it inline, often with its own widget. There is no click to win. Building a page whose entire value is a formula the answer engine already states is building a page for a click that will not happen.

**(b) Tools that emit an artifact are the most defensible content type left.** Interactive tools, downloadable resources and product pages are measurably the least affected by AIO absorption, for a mechanical reason: an answer engine can *describe* a barcode generator but cannot *hand the user a Code128 PNG*. The summary is a strictly worse product than the page. That is not true of a blog post.

### 1.3 The compensating upside

The traffic that does arrive is worth substantially more. Ahrefs reports AI-search traffic at ~0.5% of visits but ~12% of signups. Multiple 2026 studies place ChatGPT referral conversion 15–31% above non-branded organic.

**Caveat, stated plainly:** this conversion data is noisy and reverses earlier findings — a late-2024 study of ~$20B in ecommerce transactions found LLM referral traffic converting *worse* than organic. Treat the direction as real and the magnitude as unverified. Do not build a revenue model on the 23x figure.

**Planning assumption for this document:** 500–5,000 visits/month from tools by month 12, converting to trial at 1.5–3x the rate of blog traffic. Judge tools on **trials started per 1,000 tool sessions**, not on sessions.

### 1.4 Query-intent rule that governs tool selection

AI Overviews fire hardest on **informational ("know") intent** and weakest on **transactional/navigational ("do" and "go") intent**. Therefore:

> **Every tool in this plan targets a "do" query.** Prefer *generator, maker, template, download, converter, validator*. Avoid *calculator, how to calculate, what is*.

Where a calculator survives the cut, it does so because the searcher is a buyer (POS ROI) or the calculation is domain-specific enough that no engine answers it well (recipe costing, GMROI).

### 1.5 What we already have (verified in repo, 2026-07-31)

The foundation is in better shape than assumed. **Do not rebuild these:**

| Asset | Location | Status |
|---|---|---|
| Server-rendered SEO/GEO layer | `app/Support/MarketingSeo.php` | Live. Injects title, meta, canonical, OG/Twitter, JSON-LD and a crawler-visible `static_html` block per route name. Solves the client-rendered-React invisibility problem for AI crawlers. **Extend it, don't replace it.** |
| Blade head integration | `resources/views/app.blade.php` | Live. Calls `MarketingSeo::current()`. |
| AI crawler allowlist | `public/robots.txt` | Live. GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, Google-Extended, Bytespider, Amazonbot, cohere-ai all explicitly allowed. |
| Machine-readable product summary | `public/llms.txt` | Live. Needs a `## Free tools` section added (§4.11). |
| Dynamic sitemap | `app/Http/Controllers/Marketing/SitemapController.php` | Live. Needs tool routes added (§4.9). |
| Barcode library | `picqer/php-barcode-generator ^3.2` in `composer.json` | **Installed but currently unused anywhere in `app/`.** Zero-cost head start. |
| PDF engine | `barryvdh/laravel-dompdf` | Live, used in `LabelController`, `SaleController`, `V3/InvoicePdfController`. Reuse patterns from these. |
| Marketing layout | `resources/js/Pages/Marketing/Shared/MarketingLayout.jsx` | Live. Tool pages wrap in this. |
| Newsletter capture | `NewsletterSubscriber` model + `Marketing/NewsletterController` | Live, but **single opt-in and no consent audit trail**. Tool leads get their own table (§4.3); newsletter table is left alone. |
| Rate limiter conventions | `app/Providers/*` — `RateLimiter::for('api'|'pos'|'auth')` | Live. Add `tools` and `tool-leads` limiters the same way. |

**Gap that matters most:** `MarketingSeo` covers a fixed list of marketing routes. Tool routes are not in it. Until they are, tool pages ship as an empty React shell to GPTBot/ClaudeBot/PerplexityBot and are invisible to the exact channel we are optimising for. §4.7 is therefore a **blocking** dependency for every tool.

---

## 2. The approved tool set

### 2.1 Decision principle

> Build it if a machine-generated answer cannot replace it, or if the searcher is already a buyer. Skip it otherwise.

### 2.2 Tools we are building

**Tier A — Artifact generators.** Output is a file, image or printable sheet. Structurally immune to summarisation. Highest priority.

| ID | Tool | URL | Primary "do" query | Est. hrs |
|---|---|---|---|---|
| T1 | Barcode Generator | `/tools/barcode-generator` | free barcode generator | 14 |
| T2 | Barcode Label Sheet Generator | `/tools/barcode-label-generator` | barcode label template | 10 |
| T3 | QR Code Menu Generator | `/tools/qr-menu-generator` | qr code menu generator | 16 |
| T4 | Invoice Generator | `/tools/invoice-generator` | free invoice template / invoice generator | 20 |
| T4b–T4f | PO · Quote · Packing Slip · Credit Note · Delivery Note | `/tools/{doc}-generator` | purchase order template, etc. | 12 total |
| T5 | Price Tag & Shelf Label Generator | `/tools/price-tag-generator` | price tag template | 8 |
| T6 | Bulk SKU Generator | `/tools/sku-generator` | sku generator | 8 |
| T7 | Product CSV Import Cleaner | `/tools/product-csv-cleaner` | shopify product csv template | 16 |
| T8 | Stock Count Sheet Generator | `/tools/stock-count-sheet` | inventory count sheet template | 6 |
| T9 | Cash Drawer Count Sheet | `/tools/cash-drawer-count-sheet` | cash drawer count sheet | 5 |
| T10 | EAN/UPC Check Digit Validator | `/tools/barcode-validator` | upc check digit calculator | 5 |

**Tier B — High-intent calculators.** Kept because the searcher is a buyer or the domain is narrow enough that answer engines handle it poorly.

| ID | Tool | URL | Primary query | Est. hrs |
|---|---|---|---|---|
| T11 | POS ROI Calculator | `/tools/pos-roi-calculator` | pos roi calculator | 10 |
| T12 | Payment Processor Fee Calculator | `/tools/payment-fee-calculator` (+ per-processor children) | stripe fee calculator, square fee calculator | 12 |
| T13 | Recipe Costing / Food Cost Calculator | `/tools/food-cost-calculator` | food cost calculator | 12 |
| T14 | Inventory Health Toolkit (hub) | `/tools/inventory-health` | reorder point calculator, gmroi | 16 |

**Tier C — Localised documents.** Low competition because the giants do not localise. Matches VenQore's actual markets.

| ID | Tool | URL | Primary query | Est. hrs |
|---|---|---|---|---|
| T15 | GST Invoice Generator (India) | `/tools/gst-invoice-generator` | gst invoice format | 8 |
| T16 | VAT Invoice Generator (UAE/KSA) | `/tools/vat-invoice-generator` | vat invoice template uae | 8 |
| T17 | Pakistan Sales Tax Invoice Generator | `/tools/pk-sales-tax-invoice-generator` | sales tax invoice format pakistan | 8 |

Tier C reuses the T4 PDF engine entirely — these are template + validation configs, not new builds.

### 2.3 Tools we are deliberately NOT building — and why

This section exists so the decision is not silently reversed in three months.

| Dropped | Original volume claim | Why it is dropped |
|---|---|---|
| **Profit Margin Calculator** | 165,000/mo | Highest volume on the original list and the single worst bet. One-line formula, answered inline by AIO, and the SERP is owned by Omni Calculator, Calculator.net, Shopify and NerdWallet — DA 80+ domains with a decade of exact-match links. A new domain does not crack this in 12 months, and if it did, the traffic is students and analysts, not shop owners. |
| **Break-Even Calculator** | 33,000/mo | Same failure mode. Pure formula, zero-click, entrenched incumbents. |
| **Sales Tax Calculator** (as a single page) | 110,000/mo | Avalara, TaxJar and Wise own this, and the query is jurisdiction-dependent — one generic page cannot serve it. If we ever attack this it must be programmatic (`/[state]-sales-tax-calculator` × 50), which is a separate project with its own data-maintenance burden. Not now. |
| **Inventory Turnover Calculator** (standalone) | 12,000/mo | Formula-thin as a standalone page. **Not wasted:** the logic is folded into T14 Inventory Health Toolkit as one section of a genuinely useful multi-metric tool, which is a stronger page than the orphan calculator would have been. |

**Nothing is lost.** The margin, markup, break-even and turnover math all get implemented anyway — inside T11 (ROI), T13 (food cost) and T14 (inventory hub), where they support a page that has a reason to exist. We are dropping four *pages*, not four *features*.

### 2.4 Build order

Ordered by (defensibility × intent) ÷ effort, with engine reuse maximised:

```
Phase 0  Shared infrastructure                    ← blocking, nothing ships before this
Phase 1  T1 Barcode Generator + T10 Validator     ← picqer already installed; fastest real win
Phase 2  T2 Label Sheets + T5 Price Tags          ← reuses T1 renderer + new PDF sheet engine
Phase 3  T4 Invoice Generator                     ← builds the document PDF engine
Phase 4  T4b–T4f + T15–T17                        ← config-only clones of the T4 engine
Phase 5  T3 QR Menu Generator                     ← highest new-market upside
Phase 6  T6 SKU Generator + T7 CSV Cleaner        ← migration intent, highest commercial value
Phase 7  T8 Stock Count + T9 Cash Drawer          ← trivial, rounds out the printable set
Phase 8  T11 ROI + T12 Fee Calculators            ← bottom-funnel capture
Phase 9  T13 Food Cost + T14 Inventory Hub        ← deepest product tie-in
Phase 10 VenQore Retail Index                     ← the data moat (§9)
```

---

## 3. Architecture overview

### 3.1 Placement in the codebase

Everything lives inside the existing public marketing surface. No new application, no subdomain, no tenant coupling.

```
routes/web.php
  └── "Public Free Tools" block, registered directly after the
      "Public Marketing Pages" block (currently ends ~line 69)

app/Http/Controllers/Marketing/Tools/          ← NEW
    ToolsHubController.php
    BarcodeToolController.php
    BarcodeLabelToolController.php
    QrMenuToolController.php
    DocumentToolController.php        (T4, T4b–T4f, T15–T17 — one controller, many configs)
    PriceTagToolController.php
    SkuToolController.php
    CsvCleanerToolController.php
    CountSheetToolController.php      (T8 + T9)
    BarcodeValidatorToolController.php
    RoiToolController.php
    FeeCalculatorToolController.php
    FoodCostToolController.php
    InventoryHealthToolController.php
    ToolLeadController.php            (email capture, confirm, unsubscribe)

app/Services/Tools/                            ← NEW  (all business logic)
    BarcodeService.php
    LabelSheetService.php
    QrMenuService.php
    DocumentPdfService.php
    SkuGeneratorService.php
    CsvCleanerService.php
    ToolLeadService.php
    ToolUsageRecorder.php

app/Support/ToolSeo.php                        ← NEW  (merged into MarketingSeo::pages())

app/Models/
    ToolLead.php                               ← NEW
    ToolLeadEvent.php                          ← NEW
    ToolUsage.php                              ← NEW
    EmailSuppression.php                       ← NEW

app/Mail/
    ToolDeliveryMail.php                       ← NEW  (transactional)
    ToolConsentConfirmMail.php                 ← NEW  (double opt-in)

resources/js/Pages/Marketing/Tools/            ← NEW
    Index.jsx                                  (hub)
    Barcode.jsx, BarcodeLabels.jsx, QrMenu.jsx, Document.jsx,
    PriceTag.jsx, Sku.jsx, CsvCleaner.jsx, CountSheet.jsx,
    BarcodeValidator.jsx, Roi.jsx, Fees.jsx, FoodCost.jsx, InventoryHealth.jsx
    Shared/
        ToolShell.jsx          (layout: H1, answer block, tool slot, FAQ, CTA)
        EmailGate.jsx          (modal, consent checkbox, POST to tool-leads.store)
        AnswerBlock.jsx        (the 40–60 word extractable answer)
        FaqBlock.jsx
        ToolCta.jsx
        RelatedTools.jsx

resources/views/tools/pdf/                     ← NEW  (dompdf blade templates)
    label-sheet.blade.php
    price-tags.blade.php
    document.blade.php
    count-sheet.blade.php
    cash-drawer.blade.php

database/migrations/
    ..._create_tool_leads_table.php            ← NEW
    ..._create_tool_lead_events_table.php      ← NEW
    ..._create_tool_usages_table.php           ← NEW
    ..._create_email_suppressions_table.php    ← NEW

tests/Feature/Tools/                           ← NEW
```

### 3.2 Request flow

```
GET /tools/barcode-generator
  → routes/web.php  (named: tools.barcode)
  → app.blade.php calls MarketingSeo::current()
      → MarketingSeo::pages() merges ToolSeo::pages()
      → returns title / description / canonical / JSON-LD / static_html
      → crawler sees complete HTML; React replaces static_html on mount
  → BarcodeToolController@index → Inertia::render('Marketing/Tools/Barcode')

POST /tools/barcode-generator/render     (throttle:tools)
  → BarcodeToolController@render → BarcodeService::render()
  → ToolUsageRecorder::record('barcode', [...non-PII...])
  → returns PNG/SVG data URI — NO EMAIL REQUIRED

POST /tools/lead                          (throttle:tool-leads)
  → ToolLeadController@store → ToolLeadService::capture()
  → ToolDeliveryMail queued immediately (transactional)
  → if marketing_consent: ToolConsentConfirmMail queued
  → returns signed download URL
```

### 3.3 Non-negotiable architectural constraints

1. **No tenant coupling.** Tool controllers must not touch `Tenant`, `TenantUser`, or any tenant-scoped model. They run for anonymous public visitors.
2. **No auth.** All tool routes are public. Do not place them inside `auth` or tenant-resolution middleware groups.
3. **Core output is never gated.** See §6.1. Gating a single barcode behind an email will raise bounce rate, and bounce is a ranking input.
4. **Uploaded files are never persisted.** CSVs (T7) and images (T3) are processed in memory and discarded within the request. Only derived, non-PII aggregates reach `tool_usages`.
5. **Generated files are ephemeral.** Written to `storage/app/tools/` with a UUID name, served by signed temporary URL, pruned after 24h by a scheduled command.
6. **Every tool route must have a `ToolSeo` entry before merge.** A tool page without server-rendered HTML is invisible to AI crawlers and therefore pointless.

---

## 4. Phase 0 — Shared infrastructure (BLOCKING)

**Estimated: 34–40 hours. Nothing in §7 may start until this is merged and green.**

Every task here is used by every tool. Building it once properly is the difference between shipping 17 tools and shipping 3 and giving up.

### 4.1 Routing

Add to `routes/web.php` immediately after the existing "Public Marketing Pages" block (currently ends around line 69, after the partner-support routes). Keep the block clearly commented in the same style as the existing file.

```php
// ── Public Free Tools (TOFU / GEO) ──────────────────────────────────────
// Public, unauthenticated, NOT tenant-scoped. See SEO/SEO Tools/ plan §3.3.
Route::prefix('tools')->name('tools.')->group(function () {

    Route::get('/', [Tools\ToolsHubController::class, 'index'])->name('index');

    // T1 + T10 — barcodes
    Route::get('/barcode-generator', [Tools\BarcodeToolController::class, 'index'])->name('barcode');
    Route::get('/barcode-generator/{format}', [Tools\BarcodeToolController::class, 'format'])
        ->where('format', 'code128|code39|code93|ean-13|ean-8|upc-a|upc-e|itf-14|codabar')
        ->name('barcode.format');
    Route::post('/barcode-generator/render', [Tools\BarcodeToolController::class, 'render'])
        ->middleware('throttle:tools')->name('barcode.render');
    Route::get('/barcode-validator', [Tools\BarcodeValidatorToolController::class, 'index'])->name('barcode-validator');

    // …one GET (+ optional POST render) per tool, same pattern…

    // Shared lead capture
    Route::post('/lead', [Tools\ToolLeadController::class, 'store'])
        ->middleware('throttle:tool-leads')->name('lead.store');
    Route::get('/lead/confirm/{token}', [Tools\ToolLeadController::class, 'confirm'])->name('lead.confirm');
    Route::get('/lead/unsubscribe/{token}', [Tools\ToolLeadController::class, 'unsubscribe'])->name('lead.unsubscribe');
    Route::post('/lead/unsubscribe/{token}', [Tools\ToolLeadController::class, 'unsubscribeConfirm'])->name('lead.unsubscribe.confirm');

    // Signed, expiring download of a generated artifact
    Route::get('/download/{uuid}', [Tools\ToolsHubController::class, 'download'])
        ->middleware('signed')->name('download');
});
```

**Route naming follows the existing `feature.action` convention** (`tools.barcode`, `tools.lead.store`).

> ⚠️ **After adding these routes run `php artisan ziggy:generate`**, then `php artisan optimize:clear`. The React pages call `route('tools.barcode.render')` via the Ziggy helper and the build guard fails without the regenerated `resources/js/ziggy.js`.

### 4.2 Rate limiting

Register in `app/Providers/AppServiceProvider.php`, alongside the existing `api` / `pos` / `auth` limiters (currently around lines 44–61):

```php
RateLimiter::for('tools', fn (Request $r) =>
    Limit::perMinute(60)->by($r->ip())
);

RateLimiter::for('tool-leads', fn (Request $r) =>
    [ Limit::perHour(5)->by($r->ip()),
      Limit::perDay(3)->by(strtolower((string) $r->input('email'))) ]
);
```

Rationale: generation must feel unlimited (60/min is generous but stops scripted abuse); lead capture must not. The per-email daily cap stops one address being used to farm bulk exports.

### 4.3 Database schema

Four new **platform-level** tables. Again: **no `tenant_id` on any of them.**

#### `tool_leads`

```php
Schema::create('tool_leads', function (Blueprint $table) {
    $table->id();

    // Identity — email is NOT unique: one person may use several tools.
    $table->string('email')->index();
    $table->string('name')->nullable();
    $table->string('company')->nullable();

    // Provenance
    $table->string('tool_slug')->index();          // 'barcode', 'invoice', 'qr-menu'…
    $table->string('deliverable')->nullable();      // 'bulk-csv', 'pdf', 'benchmark-report'
    $table->json('context')->nullable();            // NON-PII snapshot for personalising follow-up
    $table->string('country', 2)->nullable();
    $table->string('referrer', 512)->nullable();
    $table->json('utm')->nullable();

    // Consent — the legally load-bearing columns
    $table->boolean('marketing_consent')->default(false);
    $table->string('consent_text_hash', 64)->nullable(); // sha256 of the exact checkbox wording shown
    $table->string('consent_ip', 45)->nullable();
    $table->string('consent_user_agent', 512)->nullable();
    $table->timestamp('consent_at')->nullable();

    // Double opt-in
    $table->string('confirm_token', 64)->nullable()->unique();
    $table->timestamp('confirm_sent_at')->nullable();
    $table->timestamp('confirmed_at')->nullable();

    // Lifecycle
    $table->string('status')->default('pending')->index();
        // pending | confirmed | unsubscribed | bounced | complained
    $table->string('unsubscribe_token', 64)->unique();
    $table->timestamp('unsubscribed_at')->nullable();
    $table->timestamp('last_emailed_at')->nullable();

    $table->timestamps();

    $table->index(['status', 'marketing_consent']);
    $table->index(['tool_slug', 'created_at']);
});
```

**`context` must never contain PII or business-confidential figures.** For the invoice tool store `{"currency":"PKR","line_items":4}` — never the customer names or amounts. For the CSV cleaner store `{"rows":320,"platform":"shopify","errors_fixed":18}` — never the product data.

#### `tool_lead_events`

Append-only audit log. This is what you produce if a regulator or an ESP abuse desk ever asks "prove this person opted in."

```php
Schema::create('tool_lead_events', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tool_lead_id')->constrained()->cascadeOnDelete();
    $table->string('event');   // captured | delivery_sent | confirm_sent | confirmed
                               // | unsubscribed | bounced | complained | campaign_sent
    $table->string('ip', 45)->nullable();
    $table->string('user_agent', 512)->nullable();
    $table->json('meta')->nullable();
    $table->timestamp('created_at')->useCurrent();
});
```

#### `tool_usages`

Anonymous aggregate telemetry. **No email, no IP, no uploaded content.** This is the raw material for the VenQore Retail Index (§9).

```php
Schema::create('tool_usages', function (Blueprint $table) {
    $table->id();
    $table->string('tool_slug')->index();
    $table->string('variant')->nullable();     // e.g. barcode format, document type
    $table->string('country', 2)->nullable();  // from IP geo, IP itself discarded
    $table->json('metrics')->nullable();       // numeric/enum only
    $table->date('used_on')->index();
    $table->timestamps();
});
```

#### `email_suppressions`

Global do-not-send list. Checked before **every** outbound marketing send, across newsletter and tools alike.

```php
Schema::create('email_suppressions', function (Blueprint $table) {
    $table->id();
    $table->string('email')->unique();
    $table->string('reason');   // unsubscribed | hard_bounce | complaint | manual
    $table->string('source')->nullable();
    $table->timestamps();
});
```

Once an address is here it is permanently excluded. Re-subscription requires a fresh double opt-in, which clears the row only for `reason = unsubscribed`.

### 4.4 `ToolLeadService`

Single entry point for capture. Controllers must not write to `tool_leads` directly.

```
ToolLeadService::capture(array $data): ToolLead
    1. Normalise email (lowercase, trim).
    2. Reject disposable domains (maintained blocklist, fail-open on lookup error).
    3. Look up existing lead by email.
         - if suppressed  → still deliver the artifact, DO NOT set marketing_consent,
                            DO NOT send confirm mail
    4. Create tool_leads row. Record consent_ip / consent_user_agent /
       consent_at / consent_text_hash ONLY when marketing_consent is true.
    5. Generate confirm_token + unsubscribe_token (Str::random(64)).
    6. Log tool_lead_events: 'captured'.
    7. Queue ToolDeliveryMail            ← ALWAYS. Transactional. Not gated on consent.
    8. If marketing_consent && not already confirmed && not suppressed:
         queue ToolConsentConfirmMail; log 'confirm_sent'.
    9. Return the lead (controller responds with the signed download URL).
```

**Design note.** Steps 7 and 8 are separate on purpose. The user asked for a file; sending that file is a transactional message they solicited and it must not be delayed behind a confirmation click. Marketing consent is a *separate* permission with its own confirmation. Conflating the two either breaks the product (file held hostage) or breaks the law (marketing sent on unconfirmed consent).

### 4.5 Mailables

| Class | Type | Trigger | Contents |
|---|---|---|---|
| `ToolDeliveryMail` | **Transactional** | Immediately on capture | The artifact (attached if < 2 MB, otherwise a 24h signed link), a one-line "you requested this from the VenQore X tool", and — only if they ticked the box — the consent confirmation link. No promotional body copy. |
| `ToolConsentConfirmMail` | **Consent** | Only when `marketing_consent = true` | Single clear CTA: "Confirm you want retail tips from VenQore." Nothing else. No product pitch. |

Both queued on the existing `database` queue driver. Both must render an unsubscribe footer with the `tools.lead.unsubscribe` signed link. Follow the existing `app/Mail/` conventions (see `TenantWelcomeMail`, `SaleReceiptMail`).

### 4.6 Rendering services

| Service | Responsibility | Built on |
|---|---|---|
| `BarcodeService` | Symbology validation, check-digit computation, PNG/SVG/JPG render, size/DPI control | `picqer/php-barcode-generator` (already in `composer.json`, currently unused) |
| `LabelSheetService` | Lay barcode images onto Avery/A4 grids, honour margins and gutters, paginate | dompdf via `resources/views/tools/pdf/label-sheet.blade.php` |
| `DocumentPdfService` | Invoice / PO / quote / packing slip / credit note / delivery note / localised tax invoices from one templated engine driven by a config array | dompdf. Study `app/Http/Controllers/V3/InvoicePdfController.php` and `LabelController.php` for existing patterns before writing anything new. |
| `QrMenuService` | QR generation, menu data → styled printable PDF/PNG, table-number variants | QR library (add `endroid/qr-code` — picqer does not do QR) |
| `SkuGeneratorService` | Pattern-based SKU generation, collision detection, CSV out | Pure PHP |
| `CsvCleanerService` | Parse, validate, normalise, map to Shopify/Woo/VenQore schemas, produce error report | League CSV / native. **In-memory only.** |
| `ToolUsageRecorder` | Write anonymous `tool_usages` rows | — |

**Artifact storage contract:** `storage/app/tools/{uuid}.{ext}`, served only via `URL::temporarySignedRoute('tools.download', now()->addDay(), ['uuid' => $uuid])`. Add `php artisan tools:prune-artifacts` to the scheduler, daily, deleting anything older than 24 hours.

### 4.7 `ToolSeo` — the GEO layer (highest-priority task in Phase 0)

`MarketingSeo::pages()` is already ~large. Adding 40+ tool entries inline makes it unmaintainable. Instead:

```php
// app/Support/ToolSeo.php
class ToolSeo
{
    /** @return array<string, array> keyed by ROUTE NAME, same contract as MarketingSeo::pages() */
    public static function pages(): array { /* … */ }
}
```

Then in `MarketingSeo::pages()`, change the final return to:

```php
return array_merge($corePages, \App\Support\ToolSeo::pages());
```

No change is needed in `app.blade.php` — it already consumes whatever `MarketingSeo::current()` returns.

**Every `ToolSeo` entry must supply all five keys:**

| Key | Requirement |
|---|---|
| `title` | ≤ 60 chars, leads with the "do" keyword, ends with `— VenQore`. |
| `description` | 140–158 chars, states what the tool produces and that it is free with no signup. |
| `keywords` | Tight and relevant. **Do not** copy the homepage's 200-term keyword string onto tool pages — it dilutes topical focus and is a known Semrush flag. |
| `jsonld` | `SoftwareApplication` (with `applicationCategory: BusinessApplication`, `offers.price: "0"`) + `FAQPage` + `BreadcrumbList`. Add `HowTo` where the tool has real steps. **Never** add `AggregateRating` — the codebase already removed one fabricated rating block for exactly this reason (see the comment in `app.blade.php`); re-adding one is a Google policy violation, not just an SEO error. |
| `static_html` | The full crawler-visible page: H1, the 40–60 word answer, format/option table, FAQ Q&As as real text, and internal links. This is literally what GPTBot and ClaudeBot will read. Treat it as the primary artifact, not a fallback. |

### 4.8 React shell — `ToolShell.jsx`

Enforces the §5 page anatomy so no tool page can be built wrong.

```jsx
<ToolShell
  title="Free Barcode Generator"
  answer="VenQore's free barcode generator creates …"   // 40–60 words, rendered FIRST
  breadcrumbs={[{label:'Tools', href:'/tools'}, {label:'Barcode Generator'}]}
  faqs={faqs}
  related={relatedTools}
  cta={{ headline: '…', href: '/pricing' }}
>
  {/* the interactive tool — mounted immediately, above the fold */}
</ToolShell>
```

`ToolShell` wraps `Marketing/Shared/MarketingLayout.jsx`. It renders, in fixed order: breadcrumb → H1 → `AnswerBlock` → tool slot → supporting tables → `FaqBlock` → `ToolCta` → `RelatedTools`.

### 4.9 Sitemap

`SitemapController@index` currently hardcodes an array of `route()` calls. Add a tools block driven off `ToolSeo::pages()` so a new tool is never forgotten:

```php
foreach (array_keys(\App\Support\ToolSeo::pages()) as $routeName) {
    $pages[] = [
        'loc' => route($routeName),
        'lastmod' => $now,
        'changefreq' => 'monthly',
        'priority' => '0.7',
    ];
}
```

Hub `/tools` gets priority `0.8`. Programmatic children (barcode formats, per-processor fee pages) get `0.6`.

### 4.10 Internal linking

- Add **Tools** to the main marketing nav and to `MarketingSeo::navLinks()` (the `$nav` string appended to every `static_html` block).
- `/tools` hub links to all tools, grouped by category.
- Every tool links to 3–4 sibling tools via `RelatedTools`.
- Every tool links to `/pricing` and `/demo` from `ToolCta`.
- Relevant blog posts link down to tools; tools link up to one relevant blog post. This is the link-equity topology already specified in `SEO/VenQore SEO and GEO Strategy.md` §"Internal Link Equity Topology" — follow it.

### 4.11 `llms.txt` update

Append a section to `public/llms.txt` after `## Core pages`:

```
## Free tools (no signup required)

- [Barcode Generator](https://venqore.com/tools/barcode-generator): generate Code128, EAN-13, UPC-A, Code39, ITF-14 barcodes as PNG or SVG, free, no account
- [Barcode Label Sheets](https://venqore.com/tools/barcode-label-generator): printable Avery-compatible label sheets
- [QR Menu Generator](https://venqore.com/tools/qr-menu-generator): restaurant QR code menus, printable table cards
- [Invoice Generator](https://venqore.com/tools/invoice-generator): free PDF invoices, no watermark
…
```

Keep the existing declarative, fact-dense style of the file. This is a direct GEO asset — it is how assistants learn the tools exist.

---

## 5. Page anatomy — the two-layer model

Every tool page serves two audiences that want opposite things. Build for both, in this order.

**Layer 1 — Extractable (top of page).** Its job is to get VenQore *cited* in an AI answer. It may earn zero clicks; the brand impression is the return. Roughly 55% of AI Overview citations come from the top 30% of a page, so this must be first.

**Layer 2 — Interactive (the tool).** Its job is to make the visit unavoidable and convert. It cannot be summarised, which is the entire thesis of this program.

### 5.1 Canonical structure

```
[Breadcrumb: Tools › Barcode Generator]

H1: Free Barcode Generator — VenQore
    ← brand the tool. Entity association is how you get NAMED in an answer
      that does not link. "VenQore Barcode Generator", not "Barcode Generator".

ANSWER BLOCK (40–60 words, first 150 words of the page)
    Direct, definitive, no hedging. States what it does, what it outputs,
    that it is free and needs no signup.

THE TOOL — immediately visible, above the fold, NO EMAIL GATE

H2: Supported formats            → comparison TABLE (tables are cited heavily)
H2: Which barcode should I use?  → question-style H3s, each with a direct
                                    1–2 sentence answer BEFORE any elaboration
H2: How to print barcode labels  → numbered steps + HowTo schema
H2: Frequently asked questions   → FAQPage schema, real text in static_html
ORIGINAL DATA CALLOUT            → §9. The one thing competitors cannot copy.
CTA                              → "Stop doing this manually…" + 14-day trial
RELATED TOOLS                    → 3–4 siblings
```

### 5.2 Writing rules for the extractable layer

- Answer the query in the **first 100 words**; repeat the pattern at the top of every H2 section.
- Prefer **definitive phrasing**. "Use Code128 for internal inventory labels" beats "you may wish to consider Code128."
- **Comparison tables, named statistics and step-by-step instructions get cited most.** Include at least one table and one attributed statistic per page.
- Attribute every statistic to a named source — including our own (`Source: VenQore Retail Index, Q3 2026, n = 1,240 stores`).
- Keep sentences self-contained. Avoid pronouns that refer back across paragraphs ("it", "this") — retrieval chunks the page, and a chunk that says "it supports 9 formats" is unusable. Say "the VenQore Barcode Generator supports 9 formats." This is the pronoun-drift rule already documented in the existing GEO strategy file.

### 5.3 CTA copy (consistent across all tools)

> **Stop doing this manually.**
> VenQore generates barcodes, prices and labels automatically on every product — and writes a balanced double-entry journal on every sale.
> **[Start your 14-day free trial]** · [Try the live demo, no signup]

Vary the first product noun per tool; keep the structure and the two links identical.

---

## 6. Email capture, consent and compliance

**Approved model: in-house storage + double opt-in + a separate, unchecked marketing checkbox.**

### 6.1 What is gated and what is not

This is the single most commonly botched part of a tools program. Get it wrong and the SEO investment is wasted, because a gated tool bounces and bounce is a ranking input.

| Always FREE — no email, ever | Email required |
|---|---|
| Single barcode render + download | Bulk barcode generation (> 10 codes / CSV upload) |
| Single-page invoice PDF | Branded invoice (logo upload) or saved templates |
| One QR menu code | Full table-card sheet + editable menu link |
| Basic ROI / fee / food-cost result on screen | Emailed PDF report |
| Inventory metric result on screen | Industry benchmark comparison (§9) |
| CSV validation *report* | Cleaned, download-ready CSV |

**Rule:** the user must always get *something genuinely useful* without giving an email. The gate sits on **volume, branding and portability**, never on the core answer.

### 6.2 The capture form

Exactly three elements. Nothing else.

1. **Email** (required)
2. **Name** (optional — asking for it costs conversion; keep it optional)
3. **Marketing checkbox — UNCHECKED BY DEFAULT**, with this exact wording:

> ☐ Also send me occasional retail and POS tips from VenQore. No spam, unsubscribe anytime.

Below the button, in small text:

> We'll email your file right away. We never sell your data. [Privacy Policy]

**A pre-ticked box is not consent under GDPR.** Do not let anyone "optimise" this later.

### 6.3 The two-track flow

```
Submit
  ├─ TRACK 1 (always, regardless of checkbox)
  │    ToolDeliveryMail → the file they asked for.
  │    Transactional. Solicited. Legally clean under CAN-SPAM and GDPR
  │    (performance of a requested service / legitimate interest).
  │    Status stays 'pending'. This address is NOT on the marketing list.
  │
  └─ TRACK 2 (only if the box was ticked)
       ToolConsentConfirmMail → single "Confirm subscription" link.
       Click → confirmed_at set, status = 'confirmed'.
       ONLY status='confirmed' AND marketing_consent=true receives campaigns.
       Unconfirmed leads are auto-purged from marketing eligibility after 30 days.
```

### 6.4 Audit trail

On every consent event, persist: exact checkbox wording (as `consent_text_hash`), IP, user agent, UTC timestamp, page URL, tool slug. Write a `tool_lead_events` row. This is what turns "we think they opted in" into "here is the record."

### 6.5 Unsubscribe

- Every marketing email carries a one-click unsubscribe link (`tools.lead.unsubscribe`, token-based, **no login required**).
- Include `List-Unsubscribe` and `List-Unsubscribe-Post` headers — Gmail and Yahoo bulk-sender rules require one-click unsubscribe, and missing headers materially harms deliverability.
- Unsubscribe writes to `email_suppressions` **globally** — the address stops receiving both tool and newsletter mail. Do not maintain per-list suppression; it produces the "I unsubscribed and you kept emailing me" complaint that gets domains blocklisted.
- Process within 10 days maximum (CAN-SPAM); in practice, immediately.

### 6.6 Jurisdictional notes

| Regime | Applies to | What we do |
|---|---|---|
| **GDPR / UK GDPR** | EU/UK visitors | Opt-in consent, unbundled from service delivery, freely given, recorded, withdrawable. Our unchecked box + double opt-in + audit trail satisfies this. |
| **PECR (UK)** | UK marketing email | Consent required for non-customers. Soft opt-in does not apply to people who merely used a free tool. Double opt-in is the safe path. |
| **CAN-SPAM (US)** | US marketing email | Requires accurate headers, honest subject lines, a physical postal address in every marketing email, and working unsubscribe. **Add VenQore's registered postal address to the marketing email footer template.** |
| **CASL (Canada)** | Canadian recipients | Express consent + sender identification + unsubscribe. Double opt-in satisfies. |

Also required before launch:

- **Privacy Policy update.** `/privacy` must name the tools as a data-collection point, state what is collected (email, optional name, consent metadata, anonymous usage stats), the legal basis, retention period, and how to request deletion.
- **Retention policy.** Unconfirmed leads older than 24 months are deleted. Confirmed leads with no engagement in 24 months are re-permissioned or deleted.
- **Deletion route.** A documented process for honouring erasure requests across `tool_leads` and `tool_lead_events`.

> **This section is informational, not legal advice.** I am not a lawyer. Before the first promotional send, have counsel review §6 against the markets you actually mail into — particularly if you are mailing EU/UK addresses.

### 6.7 Admin surface

Extend the existing Newsletter Hub (`app/Http/Controllers/Admin/NewsletterHubController.php`) rather than building a new admin area. Note the route names are `platform.newsletter-hub` and `platform.newsletter-hub.subscribers` — the group is `->prefix('VenQore')->name('platform.')`, **not** `superadmin.`:

- New tab: **Tool Leads** — filter by `tool_slug`, `status`, `marketing_consent`, date range.
- Columns: email, tool, deliverable, consent (Y/N), confirmed (Y/N), country, created.
- Export CSV (confirmed + consented only — make it impossible to export a non-consented segment).
- Counters: captures by tool, confirm rate, unsubscribe rate, complaint rate.
- New tab: **Suppressions** — read-only view of `email_suppressions`.

### 6.8 Sending promotional email (the payoff)

Once a lead is `confirmed` **and** `marketing_consent = true` **and** not suppressed, they enter a per-tool sequence. Suggested first sequence (build after Phase 3, not before):

| # | Timing | Subject direction | Purpose |
|---|---|---|---|
| 1 | Immediate | The file they asked for | Transactional (Track 1) |
| 2 | Day 2 | "The part of [task] most shops get wrong" | Value, no pitch |
| 3 | Day 5 | Related tool recommendation | Cross-tool discovery |
| 4 | Day 9 | Short case-style story: doing this manually vs automatically | Soft pitch |
| 5 | Day 14 | Trial offer | Conversion |

Cap at **one marketing email per lead per 5 days** across all sequences. Suppress the sequence entirely if the lead starts a trial.

---

## 7. Per-tool build specifications

Each spec is self-contained. Read §5 (page anatomy) and §6 (gating) once, then work from the tool spec.

---

### T1 — Barcode Generator ⭐ BUILD FIRST

| | |
|---|---|
| **URL** | `/tools/barcode-generator` |
| **Route** | `tools.barcode` |
| **Target queries** | free barcode generator · barcode generator online · create barcode free · code 128 generator |
| **Why it survives AI search** | Output is a binary image. An answer engine can describe the tool but cannot deliver the PNG. Pure "do" intent. |
| **Head start** | `picqer/php-barcode-generator ^3.2` is already in `composer.json` and **currently unused in `app/`**. Zero install cost. |
| **Estimate** | 14 hrs (10 core + 4 for format subpages) |

**Output:** PNG, SVG and JPG barcode images. Configurable width, height, DPI, margin, and human-readable text toggle.

**Formats (all supported by picqer):** Code128 (A/B/C), Code39, Code93, EAN-13, EAN-8, UPC-A, UPC-E, ITF-14, Codabar, MSI.

**Free vs gated:**
- Free, unlimited, no email: single barcode, any format, any output type, download.
- Email required: bulk generation — paste a list or upload a CSV of > 10 values, receive a ZIP of images plus a print-ready PDF sheet.

**Functional spec:**
1. Format dropdown, defaulting to Code128.
2. Value input with **live, format-aware validation** — EAN-13 requires 12 or 13 digits, UPC-A requires 11 or 12, ITF-14 requires 13 or 14, etc.
3. **Auto-compute the check digit** when the user supplies the short form, and show it: "Check digit: 7 (added automatically)". This single behaviour is a real differentiator — most free generators just reject the input.
4. Live preview, debounced ~300 ms.
5. Size controls: width multiplier, height px, margin, DPI (72/150/300 — 300 for print).
6. Download buttons: PNG · SVG · JPG.
7. Bulk panel below the fold → triggers `EmailGate`.

**Programmatic children (the traffic multiplier):**

`/tools/barcode-generator/{format}` for `code128`, `code39`, `code93`, `ean-13`, `ean-8`, `upc-a`, `upc-e`, `itf-14`, `codabar` — **9 additional indexable pages from one build.** Each child page:
- Pre-selects that format in the tool.
- Has its own `ToolSeo` entry with format-specific title, description, FAQ and `static_html`.
- Carries genuinely unique copy: what the symbology encodes, its character set, its length rules, where it is used in retail, and its limitations. **Thin duplicate children will be treated as doorway pages — if a format cannot support 250+ words of unique, useful text, do not publish that child.**

**Files:**
```
app/Http/Controllers/Marketing/Tools/BarcodeToolController.php
app/Services/Tools/BarcodeService.php
resources/js/Pages/Marketing/Tools/Barcode.jsx
app/Support/ToolSeo.php                      (entries: tools.barcode + 9 children)
tests/Feature/Tools/BarcodeToolTest.php
```

**Schema:** `SoftwareApplication` + `FAQPage` + `HowTo` ("How to generate and print a barcode") + `BreadcrumbList`.

**`static_html` must contain:** H1, answer block, a **format comparison table** (format · character set · length · typical retail use), the "which barcode should I use?" section, 6+ FAQs as real text, and links to the 9 children plus T2 and T10.

**Acceptance criteria:**
- [ ] All 10 symbologies render correctly and scan on a physical scanner at 300 DPI.
- [ ] Check digits computed correctly for EAN-8, EAN-13, UPC-A, UPC-E, ITF-14 (unit-tested against known-good values).
- [ ] Invalid input produces an inline, human-readable error — never a 500.
- [ ] Single barcode requires no email anywhere in the flow.
- [ ] `MarketingSeo::current()` returns a populated array for `tools.barcode` and all 9 children.
- [ ] `curl -A "GPTBot" https://venqore.com/tools/barcode-generator` returns the full text content, not an empty shell. **This check is mandatory before merge.**
- [ ] Page appears in `/sitemap.xml`.
- [ ] `php artisan ziggy:generate` run and `resources/js/ziggy.js` committed.

---

### T10 — EAN/UPC Check Digit Validator

| | |
|---|---|
| **URL** | `/tools/barcode-validator` · **Route** `tools.barcode-validator` |
| **Target queries** | upc check digit calculator · ean 13 check digit · validate barcode number · gtin validator |
| **Estimate** | 5 hrs |

Ships alongside T1 because it reuses `BarcodeService` entirely.

**Output:** valid/invalid verdict, the computed check digit, the GTIN-14 normalised form, and a step-by-step arithmetic breakdown of the modulo-10 calculation.

**Why it earns links:** developers and ops people cite validators from forums and Stack Overflow answers. Cheap, permanent backlink surface.

**Free:** everything. No gate. This tool exists purely to acquire links and brand impressions.

**Acceptance:** correct verdicts for GTIN-8/12/13/14; shows the arithmetic; handles whitespace, hyphens and leading zeros; links to T1.

---

### T2 — Barcode Label Sheet Generator

| | |
|---|---|
| **URL** | `/tools/barcode-label-generator` · **Route** `tools.barcode-labels` |
| **Target queries** | barcode label template · avery barcode labels · printable barcode sheet · product label template |
| **Estimate** | 10 hrs |

**Output:** print-ready PDF at exact physical dimensions, aligned to standard label stock.

**Templates to support (minimum):** Avery 5160 (30-up), 5163 (10-up), 5167 (80-up), 5960, L7160 (A4, 21-up), L7651 (A4, 65-up), plus a custom grid (rows × columns, margins, gutters).

**Free vs gated:** up to 30 labels free (one sheet); more than 30, or logo upload, requires email.

**Critical requirement:** dompdf must output at **exact millimetre dimensions with no browser scaling**. Misaligned label sheets are worse than useless — they waste the user's label stock and guarantee they never return. Print-test every template on real stock before launch and record the result in the acceptance checklist.

**Files:** `BarcodeLabelToolController`, `LabelSheetService`, `resources/views/tools/pdf/label-sheet.blade.php`, `BarcodeLabels.jsx`.

**Acceptance:** each template physically print-tested and verified aligned; PDF opens correctly in Acrobat, Chrome and Preview; 30-label free tier enforced server-side, not just in the UI.

---

### T5 — Price Tag & Shelf Label Generator

| | |
|---|---|
| **URL** | `/tools/price-tag-generator` · **Route** `tools.price-tags` |
| **Target queries** | price tag template · shelf label template · retail price tag maker · sale tag printable |
| **Estimate** | 8 hrs |

Shares the sheet engine with T2. Adds retail-specific layouts: product name, price (large), was/now sale styling, unit price, barcode, currency symbol.

**Layouts:** standard shelf edge strip, hanging swing tag, square sale tag, jewellery/small-item tag.

**Free vs gated:** 20 tags free; bulk (CSV upload of product/price pairs) requires email.

**Why it wins:** almost no good free retail-specific option exists. Generic "label maker" sites do not understand shelf-edge strips or unit pricing.

---

### T4 — Invoice Generator (engine build)

| | |
|---|---|
| **URL** | `/tools/invoice-generator` · **Route** `tools.invoice` |
| **Target queries** | free invoice template · invoice generator · create invoice online free · invoice pdf maker |
| **Estimate** | 20 hrs (engine) |

**This is the most valuable engine in the plan** — Phase 4 and Tier C are configuration on top of it, turning 20 hours into 9 indexable pages.

**Output:** clean, professional PDF invoice. **No watermark. No "created with" footer.** Watermarking a free invoice tool is the fastest way to lose to the competitor who does not.

**Fields:** seller block, buyer block, invoice number, issue/due dates, line items (description, qty, unit price, tax %, line total), subtotal, tax summary, discount, grand total, notes, payment terms, bank details.

**Must handle:** multi-currency with correct symbol placement, tax-inclusive **and** tax-exclusive modes (VenQore supports both — mirror that behaviour), per-line and invoice-level tax, and 3+ visual templates.

**Free vs gated:**
- Free: generate and download a complete, unwatermarked PDF.
- Email: upload a logo, save a reusable template, or receive the invoice by email.

**Privacy note that must appear on the page:** "Your invoice data is processed in your browser and never stored on our servers." Make that true — generate client-side where possible, or process server-side without persisting. Then say so prominently. Invoice tools that store business data get avoided by exactly the professional audience we want.

**Files:** `DocumentToolController` (config-driven), `DocumentPdfService`, `resources/views/tools/pdf/document.blade.php`, `Document.jsx`.

**Study first:** `app/Http/Controllers/V3/InvoicePdfController.php` — the invoice PDF patterns already exist in this codebase. Reuse the layout logic; do not reinvent it.

**Acceptance:** PDF renders identically in Acrobat/Chrome/Preview; tax math verified against a unit-test matrix covering inclusive/exclusive × per-line/invoice-level; no watermark; no server-side persistence of invoice content; ≥ 3 templates.

---

### T4b–T4f — Document family (config clones)

| Tool | URL | Target query | Est. |
|---|---|---|---|
| Purchase Order Generator | `/tools/purchase-order-generator` | purchase order template | 3 hrs |
| Quotation / Estimate Generator | `/tools/quote-generator` | quotation format · estimate template | 2 hrs |
| Packing Slip Generator | `/tools/packing-slip-generator` | packing slip template | 2 hrs |
| Credit Note Generator | `/tools/credit-note-generator` | credit note format | 2 hrs |
| Delivery Note Generator | `/tools/delivery-note-generator` | delivery note template | 3 hrs |

Each is a config array in `DocumentPdfService` defining field set, labels, totals behaviour and template — **plus genuinely unique page copy**. The engine is shared; the content must not be. A packing slip page that is a find-and-replace of the invoice page is thin content and will not rank.

---

### T15–T17 — Localised tax invoices (Tier C)

| Tool | URL | Requirements | Est. |
|---|---|---|---|
| GST Invoice Generator (India) | `/tools/gst-invoice-generator` | GSTIN fields, HSN/SAC codes, CGST/SGST/IGST split logic, place-of-supply rules, invoice numbering rules | 8 hrs |
| VAT Invoice Generator (UAE/KSA) | `/tools/vat-invoice-generator` | TRN field, 5% VAT default, bilingual Arabic/English layout, "Tax Invoice" title requirement | 8 hrs |
| Pakistan Sales Tax Invoice | `/tools/pk-sales-tax-invoice-generator` | NTN/STRN fields, PKR formatting, FBR-style layout | 8 hrs |

**Why Tier C is the highest-ROI SEO in this plan:** "invoice generator" is a bloodbath. "GST invoice format with HSN code" is not. The global incumbents do not localise, and these markets map directly onto VenQore's actual customer base (PKR pricing already exists in `llms.txt`).

> **Compliance caveat that must appear on every Tier C page:** "This template follows commonly used [GST/VAT/FBR] invoice formats. It is not tax advice — confirm requirements with your tax advisor or the relevant authority." Tax formats change; do not imply certification. Assign an owner to review these annually.

---

### T3 — QR Code Menu Generator

| | |
|---|---|
| **URL** | `/tools/qr-menu-generator` · **Route** `tools.qr-menu` |
| **Target queries** | qr code menu generator · restaurant qr menu free · digital menu qr code · qr code for menu |
| **Estimate** | 16 hrs |
| **New dependency** | `endroid/qr-code` (picqer does not generate QR) |

**The single best addition to the original list.** Large, durable restaurant demand; near-perfect fit with VenQore's F&B side; and the output (a printed table card) is maximally un-summarisable.

**Output:**
1. QR code PNG/SVG pointing to a URL the user supplies, or to a VenQore-hosted menu page.
2. Printable **table tent cards** and small stickers, multiple per A4/Letter sheet.
3. Optional per-table numbered variants (Table 1…N) — a genuine differentiator, since table-level QR is how ordering-at-table actually works.

**Free vs gated:** one QR + one printable card free; the full numbered table set (>4 tables), logo-in-centre, and colour customisation require email.

**Product tie-in:** "Want customers to order straight from this QR into your POS? That is VenQore F&B." This is the strongest natural CTA of any tool here.

**Acceptance:** QR scans reliably at 3 cm printed size with error correction level H; table-number variants generate correctly; card sheets print aligned; logo overlay never breaks scannability (enforce a max logo coverage of ~25% and re-verify scan after overlay).

---

### T6 — Bulk SKU Generator

| | |
|---|---|
| **URL** | `/tools/sku-generator` · **Route** `tools.sku` |
| **Target queries** | sku generator · sku code generator · how to create sku numbers · sku format |
| **Estimate** | 8 hrs |

**Output:** a structured SKU list, downloadable as CSV.

**Functional spec:** user defines a pattern from components — category prefix, brand code, attribute (size/colour), sequence number, optional check character. Tool previews the pattern (`TSH-NIK-RED-M-0001`), generates across supplied attribute lists (cartesian product), detects collisions, and enforces a max length.

**Free vs gated:** 25 SKUs free on screen; CSV download of larger sets requires email.

**Why it wins:** there is no good free SKU generator. It is a real unmet need, it earns links from ecommerce forums, and everyone who uses it is setting up or restructuring a product catalogue — i.e. shopping for inventory software.

---

### T7 — Product CSV Import Cleaner ⭐ HIGHEST COMMERCIAL INTENT

| | |
|---|---|
| **URL** | `/tools/product-csv-cleaner` · **Route** `tools.csv-cleaner` |
| **Target queries** | shopify product csv template · woocommerce product import csv · product import errors · csv import template |
| **Estimate** | 16 hrs |

**Anyone using this tool is migrating platforms.** That is the highest-intent visitor the entire program can produce.

**Output:** a validated, normalised, download-ready CSV plus a human-readable error report.

**Functional spec:**
1. Upload CSV/TSV (client-side parse where possible; **hard cap 5 MB / 10,000 rows**).
2. Auto-detect source format: Shopify, WooCommerce, Square, generic.
3. Validate: required columns present, SKU uniqueness, price/number parsing, currency symbols stripped, encoding issues, stray whitespace, malformed rows, duplicate handles, missing variants.
4. Show a clear, row-numbered error report **for free**.
5. Auto-fix what is safely fixable; flag what is not.
6. Offer the cleaned CSV in Shopify / WooCommerce / **VenQore** import format.

**Free vs gated:** validation report free; cleaned CSV download requires email.

**Absolute requirement — privacy:** uploaded files are processed in memory and discarded within the request. Nothing is written to disk. Say so on the page in plain language: *"Your file is processed in memory and deleted immediately. We never store your product data."* Then honour it. A leak here is an existential trust problem, not a bug.

**Acceptance:** correctly detects all three source formats; never persists an uploaded file (verify by inspecting `storage/` after a run); handles UTF-8 BOM, CRLF, quoted commas and embedded newlines; 10,000-row file processes in under 10 seconds; VenQore-format output actually imports into VenQore without error.

---

### T8 — Stock Count Sheet Generator

| | |
|---|---|
| **URL** | `/tools/stock-count-sheet` · **Route** `tools.stock-count` |
| **Target queries** | inventory count sheet template · stock take sheet printable · physical inventory count form |
| **Estimate** | 6 hrs |

**Output:** printable PDF stocktake sheet — columns for SKU, description, location, expected qty, counted qty, variance, counter initials, date. Optional pre-fill from an uploaded product CSV.

**Free vs gated:** blank sheet free; pre-filled-from-CSV version requires email.

Small volume, but the searcher is doing a stocktake — the exact moment someone realises their current system is inadequate. Cheap to build off the T2/T5 sheet engine.

---

### T9 — Cash Drawer Count Sheet

| | |
|---|---|
| **URL** | `/tools/cash-drawer-count-sheet` · **Route** `tools.cash-drawer` |
| **Target queries** | cash drawer count sheet · till reconciliation template · cash register balance sheet |
| **Estimate** | 5 hrs |

**Output:** printable till reconciliation sheet with denomination rows (configurable per currency — USD, GBP, EUR, PKR, INR, AED), opening float, cash sales, expected vs counted, over/short, signature lines.

**Free:** everything. Too small to gate.

**Currency variants are the programmatic angle:** `/tools/cash-drawer-count-sheet/{currency}` with correct denominations per country. Each needs unique copy — do not publish a thin child.

---

### T11 — POS ROI Calculator

| | |
|---|---|
| **URL** | `/tools/pos-roi-calculator` · **Route** `tools.roi` |
| **Target queries** | pos roi calculator · pos system cost calculator · is a pos system worth it |
| **Estimate** | 10 hrs |

Low volume (~800/mo), **retained because 100% of that traffic is actively shopping for a POS.** This is the lowest-CAC page on the site.

**Inputs:** monthly revenue, transactions/day, staff count, hours/week on manual bookkeeping, current software cost, stock-loss estimate, average basket.

**Outputs:** estimated time saved, error/shrinkage reduction, payback period in months, 12-month net benefit, and a clear breakdown of every assumption.

**Free vs gated:** on-screen result free; emailed PDF report gated.

**Integrity requirement — this matters more than conversion.** Every assumption must be visible and editable, sourced or clearly labelled as an estimate, and the model must be able to return "a POS may not pay for itself at your volume." A calculator that always says "buy VenQore" is a sales page pretending to be a tool, and both users and answer engines discount it. Honesty here is the differentiator.

**Folded in from the dropped list:** margin, markup and break-even math appear as supporting sections on this page.

---

### T12 — Payment Processor Fee Calculator

| | |
|---|---|
| **URL** | `/tools/payment-fee-calculator` (+ children) · **Route** `tools.fees` |
| **Target queries** | stripe fee calculator · square fee calculator · paypal fee calculator · card processing fees |
| **Estimate** | 12 hrs |

**Programmatic children:** `/tools/payment-fee-calculator/{processor}` for stripe, square, paypal, clover, adyen, razorpay. Each child has real, unique content: that processor's current published rates, regional variations, and what the fee does and does not include.

**Why these survive where generic calculators do not:** people want *this processor's* numbers, not a formula, so the click still happens. And someone calculating Square's fees is by definition a POS shopper — this page sits directly adjacent to the comparison-page strategy.

**Maintenance burden — accept it explicitly.** Processor rates change. **Assign an owner and review quarterly.** Publish a visible "Rates verified: [date]" stamp on every child page. Stale rates are worse than no page: they destroy trust and get cited wrongly by answer engines, which is a brand risk, not just an SEO one. If nobody will own the quarterly review, do not build T12.

---

### T13 — Recipe Costing / Food Cost Calculator

| | |
|---|---|
| **URL** | `/tools/food-cost-calculator` · **Route** `tools.food-cost` |
| **Target queries** | food cost calculator · recipe cost calculator · menu item cost · food cost percentage |
| **Estimate** | 12 hrs |

**Why this one survives the "no calculators" rule:** it is not a single formula. It is multi-ingredient, multi-unit, with yield and waste factors — genuinely tedious by hand and poorly served by answer engines.

**Inputs:** ingredients with quantity, unit, purchase price, purchase unit, yield %, waste %; target food-cost percentage; portion count.

**Outputs:** cost per portion, suggested menu price at target food cost, gross margin per item, and a per-ingredient cost contribution breakdown.

**Product tie-in is exact:** this is VenQore's composite-product / manufacturing-recipe feature (Mode A "Make Now" and Mode B "Ready Made") in miniature. The CTA writes itself: *"VenQore does this automatically, deducts the raw materials on every sale, and keeps the books balanced."*

**Free vs gated:** up to 10 ingredients free; emailed PDF costing sheet gated.

---

### T14 — Inventory Health Toolkit (hub)

| | |
|---|---|
| **URL** | `/tools/inventory-health` · **Route** `tools.inventory-health` |
| **Target queries** | reorder point calculator · safety stock calculator · gmroi calculator · inventory turnover ratio · eoq calculator |
| **Estimate** | 16 hrs |

**One hub page with five calculators, not five orphan pages.** Each metric is formula-thin alone; together they form a page with real depth that can rank for a cluster and support genuine internal linking.

**Metrics included:** reorder point · safety stock · economic order quantity (EOQ) · GMROI · shrinkage rate · **inventory turnover** (folded in from the dropped standalone) · days sales of inventory.

**Structure:** tabbed interface, one H2 section per metric with its own answer block, formula, worked example and interpretation guidance ("a turnover of 4 means…"). Each H2 is independently citable — which is exactly how you win a cluster in an answer-first SERP.

**Free vs gated:** all calculations free; the **industry benchmark comparison** (§9) is the gated deliverable and the reason this page exists.

---

## 8. Programmatic expansion summary

Built once, these turn 17 tools into ~45 indexable pages:

| Parent | Children | Count |
|---|---|---|
| T1 Barcode Generator | 9 symbology pages | 9 |
| T12 Fee Calculator | 6 processor pages | 6 |
| T9 Cash Drawer | 6 currency pages | 6 |
| T4 Invoice | 5 document types + 3 localised | 8 |

**Rule, applied without exception:** a child page ships only if it carries **250+ words of genuinely unique, useful content**. Templated pages that differ by a single variable are doorway pages, are treated as such by Google, and drag down the parent. If the unique content does not exist, do not publish the child.

---

## 9. The VenQore Retail Index (the data moat)

**Build in Phase 10, after tools have been live long enough to accumulate data.**

### 9.1 Why this is the highest-leverage asset in the plan

Answer engines disproportionately cite pages carrying **statistics attributed to a named source**. Every competitor can copy a barcode generator in a weekend. **Nobody else can publish aggregated operating data from VenQore's live multi-tenant transaction base.**

That data turns VenQore from "another site competing for a formula" into **the source the answer quotes** — which is the only durable position in an answer-first search environment.

### 9.2 What to publish

Quarterly, at `/retail-index`:

- Average inventory turnover by retail category
- Median gross margin by category
- Average basket size by store type and region
- Shrinkage rates by category
- Peak trading hours by vertical
- Payment-method mix over time
- Average food-cost percentage by cuisine type (F&B)

Each figure carries `n =` and the period. Cite as: *VenQore Retail Index, Q3 2026 (n = 1,240 stores).*

### 9.3 Hard constraints

- **Aggregate only.** Never expose a single tenant's data.
- **Minimum cohort size.** Suppress any cell with n < 30. No exceptions.
- **Check the Terms of Service and Privacy Policy first.** If the current customer agreement does not clearly permit anonymised aggregate analytics and publication, it must be amended — with notice — *before* any figure is published. This is a legal precondition, not a formality. **Do not skip it.**
- Publish the methodology, including how cohorts are defined and what is excluded.

### 9.4 How it plugs into the tools

Each relevant tool gains a "How do you compare?" block, and the **benchmark comparison becomes the gated email deliverable** for T14, T13 and T11 — replacing generic PDF exports with something genuinely unobtainable elsewhere. This is what makes the email worth giving.

---

## 10. Phasing and effort

### 10.1 Schedule

| Phase | Contents | Hours | Cumulative | Ships |
|---|---|---:|---:|---|
| **0** | Shared infrastructure (§4) — **blocking** | 34–40 | 40 | — |
| **1** | T1 Barcode Generator + 9 format children, T10 Validator | 19 | 59 | 11 pages |
| **2** | T2 Label Sheets, T5 Price Tags | 18 | 77 | 13 |
| **3** | T4 Invoice Generator (engine) | 20 | 97 | 14 |
| **3.5** | Email sequences (§6.8) — after first gated tool is live | 12 | 109 | — |
| **4** | T4b–T4f documents, T15–T17 localised | 36 | 145 | 22 |
| **5** | T3 QR Menu Generator | 16 | 161 | 23 |
| **6** | T6 SKU Generator, T7 CSV Cleaner | 24 | 185 | 25 |
| **7** | T8 Stock Count, T9 Cash Drawer + 6 currency children | 11 | 196 | 33 |
| **8** | T11 POS ROI, T12 Fee Calculator + 6 processor children | 22 | 218 | 41 |
| **9** | T13 Food Cost, T14 Inventory Health Hub | 28 | 246 | 43 |
| **10** | VenQore Retail Index | 24 | 270 | 44 |

**≈ 270 hours total.** At 15 hrs/week that is roughly 4.5 months; full-time, about 7 weeks.

### 10.2 Minimum viable milestone

**Phases 0 + 1 (≈ 59 hours) is the real decision point.** It ships 11 indexable pages, proves the whole GEO pipeline end to end, and produces the first real data on whether tool pages get crawled, cited and converted. Do not commit to phases 2–10 until Phase 1 has 60 days of live data.

### 10.3 Realistic outcome expectations

State these up front so nobody is disappointed by a working program:

- **Months 1–3:** near-zero traffic. Indexing and crawl discovery only. This is normal.
- **Months 4–6:** first rankings on long-tail and programmatic children (`code128 generator`, `gst invoice format`) — not on head terms.
- **Months 6–12:** **500–5,000 visits/month** across all tools, concentrated in Tier A and Tier C.
- **Head terms** ("free barcode generator", "invoice generator") realistically take **18–24 months** and require the backlink profile the tools themselves generate. They are the *output* of this program, not the input.

**Judge success on trials started per 1,000 tool sessions, not on sessions.** If tool traffic converts at 1.5–3× blog traffic, the program is working even at the low end of the traffic range.

---

## 11. Testing strategy

Per `CLAUDE.md`: **MySQL only. No SQLite anywhere, including tests.** Feature tests run against `amd_pos_test`. Smoke tests that touch `venqore_pos` are strictly read-only and must never use `RefreshDatabase`.

### 11.1 Test matrix

```
tests/Feature/Tools/
    ToolPageRendersTest.php        every tool route returns 200 and correct Inertia component
    ToolSeoCoverageTest.php        ⭐ asserts MarketingSeo::current() is non-null with
                                   title/description/canonical/static_html for EVERY
                                   registered tools.* route. FAILS THE BUILD if a tool
                                   ships without a ToolSeo entry.
    BarcodeToolTest.php            all symbologies, check digits, invalid input, bulk gate
    BarcodeValidatorTest.php       GTIN-8/12/13/14 verdicts, whitespace/hyphen handling
    LabelSheetTest.php             PDF generated, correct page count, free-tier cap enforced
    DocumentPdfTest.php            tax math matrix: inclusive/exclusive × line/invoice level
    CsvCleanerTest.php             format detection, BOM/CRLF/quoted commas, 10k rows,
                                   AND asserts no file persists to storage/ after the run
    SkuGeneratorTest.php           pattern expansion, collision detection, length cap
    ToolLeadCaptureTest.php        ⭐ consent semantics — see below
    ToolLeadConsentTest.php        double opt-in, confirm, unsubscribe, suppression
    RateLimitTest.php              tools + tool-leads limiters fire correctly
tests/Unit/Tools/
    CheckDigitTest.php             known-good value table per symbology
    RoiModelTest.php               including the case that must return "not worth it"
    FoodCostTest.php               unit conversion, yield and waste factors
```

### 11.2 Consent tests are non-negotiable

`ToolLeadCaptureTest` must assert, explicitly:

- [ ] `ToolDeliveryMail` is queued **even when `marketing_consent` is false**.
- [ ] `ToolConsentConfirmMail` is **not** queued when `marketing_consent` is false.
- [ ] A lead with `status = 'pending'` is **excluded** from any marketing-eligible query.
- [ ] An email present in `email_suppressions` never receives `ToolConsentConfirmMail`, but **does** still receive its requested `ToolDeliveryMail`.
- [ ] `consent_ip`, `consent_user_agent`, `consent_at` and `consent_text_hash` are populated when and only when consent is given.
- [ ] Unsubscribe writes to `email_suppressions` and is honoured across newsletter and tools.

These encode the legal position in executable form. If someone later "simplifies" the consent flow, these tests break — which is exactly the point.

### 11.3 Crawler verification (manual, per tool, pre-merge)

```bash
curl -A "GPTBot"        https://venqore.com/tools/barcode-generator | grep -c "<h1"
curl -A "ClaudeBot"     https://venqore.com/tools/barcode-generator | grep "Supported formats"
curl -A "PerplexityBot" https://venqore.com/tools/barcode-generator | grep "application/ld+json"
```

Each must return real content. **An empty React shell here means the page is invisible to the exact channel this program exists to win.** No tool merges without this check passing.

### 11.4 Regression guards

- `php artisan test` green before every merge.
- `php artisan ziggy:generate` run; `resources/js/ziggy.js` committed.
- NUL-byte scan passes (CI enforces this already).
- Lighthouse ≥ 90 on performance and accessibility for each tool page — Core Web Vitals budgets from `SEO/VenQore SEO and GEO Strategy.md` apply.

---

## 12. Measurement

### 12.1 The metrics that matter now

Organic sessions will look flat or down even when this is working — that is the environment, not the program. Track instead:

| Metric | Where | Target |
|---|---|---|
| Tool pages indexed | GSC Coverage | 100% of published |
| Branded search impressions | GSC | rising month over month |
| Direct traffic | GA4 | rising (proxy for uncited brand exposure) |
| AI referrals | GA4 referral: `chatgpt.com`, `perplexity.ai`, `claude.ai`, `copilot.microsoft.com` | rising |
| **Citation share** | Manual monthly check of 20 target queries in Google AIO / ChatGPT / Perplexity | the primary GEO KPI |
| Tool sessions → generation | GA4 event `tool_generate` | > 60% |
| Generation → email capture | GA4 event `tool_lead_captured` | 8–15% of gated attempts |
| **Double opt-in confirm rate** | `tool_leads.confirmed_at` | > 40% (below 25% signals a broken or unconvincing confirm email) |
| Lead → trial | GA4 + `tool_leads.context` | the actual ROI number |
| Unsubscribe rate | `email_suppressions` | < 0.5% per send |
| **Complaint rate** | ESP / inbox feedback loop | **< 0.1% — above this, stop sending and fix** |

### 12.2 GA4 events to implement

`tool_view` · `tool_generate` (params: tool, variant) · `tool_download` · `tool_gate_shown` · `tool_lead_captured` (param: marketing_consent true/false) · `tool_cta_click`.

### 12.3 Review cadence

- **Weekly (first 90 days):** indexation, crawl errors, generation success rate.
- **Monthly:** citation-share check across the 20 target queries; capture and confirm rates by tool.
- **Quarterly:** kill or double down per tool. **A tool with < 50 sessions/month at month 9 gets deprecated, not defended.** Also: T12 processor rate review (§7 T12) and Retail Index refresh.

---

## 13. Per-tool launch checklist

Copy this into the PR description for every tool. Do not merge with unchecked boxes.

**Build**
- [ ] Route registered in `routes/web.php` under the `tools.` group
- [ ] `php artisan ziggy:generate` run, `resources/js/ziggy.js` committed
- [ ] `php artisan optimize:clear` run after route changes
- [ ] Controller thin; all logic in `app/Services/Tools/`
- [ ] No `tenant_id`, no auth middleware, no tenant-scoped model touched
- [ ] Feature test added and green on `amd_pos_test` (MySQL)
- [ ] No trailing NUL bytes (CI scan passes)

**SEO / GEO**
- [ ] `ToolSeo` entry with `title`, `description`, `keywords`, `jsonld`, `static_html`
- [ ] `ToolSeoCoverageTest` passes
- [ ] Answer block: 40–60 words, in the first 150 words of the page
- [ ] At least one comparison table
- [ ] 6+ FAQs present as real text in `static_html`, with `FAQPage` schema
- [ ] `SoftwareApplication` + `BreadcrumbList` schema; `HowTo` where applicable
- [ ] **No `AggregateRating` schema** (policy violation without real review data)
- [ ] Canonical correct, HTTPS, no trailing slash
- [ ] Added to `SitemapController`
- [ ] Added to `public/llms.txt`
- [ ] Added to `/tools` hub and to `MarketingSeo::navLinks()`
- [ ] 3–4 internal links out to sibling tools; 1 link to `/pricing`, 1 to `/demo`
- [ ] **Crawler check passed** for GPTBot, ClaudeBot, PerplexityBot (§11.3)
- [ ] Schema validated in Google Rich Results Test
- [ ] Lighthouse ≥ 90 performance and accessibility

**Product**
- [ ] Core output works with **no email required**
- [ ] Gate applies only to volume / branding / portability (§6.1)
- [ ] Gate enforced server-side, not only in the UI
- [ ] Uploaded files never persisted; generated artifacts expire in 24h
- [ ] Mobile tested (a large share of this traffic is phone-first)
- [ ] Clear inline errors; no 500s on bad input
- [ ] Rate limits verified

**Consent (any tool with a gate)**
- [ ] Marketing checkbox present and **unchecked by default**
- [ ] Exact approved wording used (§6.2)
- [ ] Deliverable sends regardless of consent
- [ ] Confirm email sent only when consent given
- [ ] `consent_ip` / `consent_user_agent` / `consent_at` / `consent_text_hash` recorded
- [ ] Unsubscribe link works without login; `List-Unsubscribe` headers set
- [ ] Postal address present in marketing email footer (CAN-SPAM)
- [ ] `/privacy` updated to cover this tool
- [ ] Consent tests green (§11.2)

**Post-launch**
- [ ] Submitted for indexing in GSC and Bing Webmaster
- [ ] GA4 events firing
- [ ] Added to the monthly citation-share tracking sheet
- [ ] Outreach list built for "best free [tool]" roundups (§14.1)

---

## 14. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Tool pages ship client-rendered and stay invisible to AI crawlers | Medium | **Critical** | `ToolSeoCoverageTest` fails the build; §11.3 crawler check is a merge gate |
| Head-term keywords never rank | **High** | Medium | Accepted. Value comes from long-tail + programmatic + citations. Head terms are an 18–24 month output, not a target |
| Gating kills engagement and raises bounce | Medium | High | §6.1 is a hard rule: core output is never gated |
| Thin programmatic children get flagged as doorway pages | Medium | High | 250-word unique-content rule, enforced at review (§8) |
| Processor rates (T12) go stale | **High** | Medium | Named owner + quarterly review + visible "verified" date; do not build T12 without an owner |
| Consent flow challenged by a regulator | Low | **Critical** | Double opt-in + full audit trail + counsel review before first send (§6) |
| Spam complaints damage domain reputation | Medium | High | Double opt-in, global suppression, complaint rate < 0.1% kill switch |
| Uploaded business data leaks (T7, T4) | Low | **Critical** | In-memory processing, no persistence, verified by test |
| Retail Index publishes identifiable tenant data | Low | **Critical** | n ≥ 30 suppression rule, aggregate-only, **ToS review before publication** |
| Effort sunk into tools nobody uses | Medium | Medium | Phase 1 (59 hrs) is the go/no-go gate; quarterly deprecation rule |

### 14.1 The one thing outside this document that matters most

**Getting into third-party "best free [tool]" roundups.** AI Overviews for comparison queries are synthesised largely from those listicles — so appearing in them is now a *direct input* to the answer itself, not just a backlink.

Budget real outreach effort here. It is plausibly higher leverage than building tool #12. Target list should be assembled per tool at launch (§13, post-launch).

---

## 15. Appendix

### 15.1 `ToolSeo` entry template

```php
'tools.barcode' => [
    'title' => 'Free Barcode Generator — Code128, EAN-13, UPC-A | VenQore',
    'description' => 'Generate free barcodes online in Code128, EAN-13, UPC-A, Code39 and ITF-14. Download as PNG or SVG at print-ready 300 DPI. No signup, no watermark.',
    'keywords' => 'free barcode generator, barcode generator online, code 128 generator, ean 13 generator, upc a barcode maker, print barcode labels',
    'jsonld' => [
        [
            '@context' => 'https://schema.org',
            '@graph' => [
                [
                    '@type' => 'SoftwareApplication',
                    'name' => 'VenQore Barcode Generator',
                    'applicationCategory' => 'BusinessApplication',
                    'operatingSystem' => 'Web browser',
                    'url' => url('/tools/barcode-generator'),
                    'description' => 'Free online barcode generator supporting 10 retail symbologies with automatic check-digit calculation and print-ready PNG/SVG output.',
                    'offers' => ['@type' => 'Offer', 'price' => '0', 'priceCurrency' => 'USD'],
                ],
                // FAQPage, BreadcrumbList, HowTo …
            ],
        ],
    ],
    'static_html' => '<main …><h1>Free Barcode Generator</h1>'
        . '<p><strong>The VenQore Barcode Generator creates print-ready barcodes …</strong></p>'
        . '<table>…format comparison…</table>'
        . '<h2>Which barcode should I use?</h2>…'
        . '<h2>Frequently asked questions</h2>…'
        . $nav . '</main>',
],
```

### 15.2 Approved consent copy (do not reword without review)

Checkbox, unchecked:

> ☐ Also send me occasional retail and POS tips from VenQore. No spam, unsubscribe anytime.

Under the submit button:

> We'll email your file right away. We never sell your data. [Privacy Policy]

Confirmation email body:

> You asked for occasional retail tips from VenQore. Confirm below and we'll start sending — roughly twice a month, always useful, unsubscribe in one click.
> **[Confirm subscription]**
> If you didn't request this, ignore this email and nothing will be sent.

### 15.3 Answer-block formula

> **[Tool name]** [does what] for [audience]. It supports [key options] and outputs [artifact format]. Free, no signup required, no watermark.

40–60 words. Definitive. Self-contained — no pronouns referring outside the block, because retrieval systems chunk the page and a chunk that begins "It supports…" is unusable.

### 15.4 Naming conventions

- Routes: `tools.{slug}`, children `tools.{slug}.{variant}`
- Controllers: `app/Http/Controllers/Marketing/Tools/{Name}ToolController.php`
- Services: `app/Services/Tools/{Name}Service.php`
- React: `resources/js/Pages/Marketing/Tools/{Name}.jsx`
- PDF views: `resources/views/tools/pdf/{name}.blade.php`
- Tests: `tests/Feature/Tools/{Name}Test.php`
- `tool_slug` values: lowercase-hyphenated, matching the URL segment (`barcode-generator`, `qr-menu-generator`)

### 15.5 Open items requiring a decision before the relevant phase

| # | Item | Needed by |
|---|---|---|
| 1 | Legal review of §6 consent model for target markets | Before first promotional send (Phase 3.5) |
| 2 | ToS/Privacy amendment permitting aggregate analytics publication | Before Phase 10 |
| 3 | Named owner for T12 quarterly rate review | Before Phase 8 |
| 4 | VenQore registered postal address for CAN-SPAM footer | Before Phase 3.5 |
| 5 | Confirm `endroid/qr-code` is acceptable as a new dependency | Before Phase 5 |
| 6 | Decide whether Retail Index lives at `/retail-index` or under `/tools` | Before Phase 10 |

---

## 16. Sources

Search-environment data cited in §1:

- [In 2026, Less than One Third of Google Searches Still Send a Click — SparkToro](https://sparktoro.com/blog/in-2026-less-than-one-third-of-google-searches-still-send-a-click/)
- [Google AI Overviews Statistics 2026 — QuickSEO](https://quickseo.ai/blog/google-ai-overviews-statistics-2026-60-data-points-every-seo-should-know)
- [AI Overviews Traffic 2026: 58% CTR Drop](https://www.seo-kreativ.de/en/blog/google-ai-overviews-updates-2026-en/)
- [60% Zero-Click Searches: 2026 SEO Strategy — Digital Applied](https://www.digitalapplied.com/blog/60-percent-searches-zero-click-crisis-2026-seo-strategy)
- [How to Get Cited in Google AI Overviews: 2026 Tactics That Work — Contently](https://contently.com/2026/02/25/how-to-get-cited-google-ai-overviews/)
- [How to Get Cited in AI Overviews: Engine-by-Engine Guide — The HOTH](https://www.thehoth.com/blog/how-to-get-cited-in-ai-overviews/)
- [Why AI Search Traffic Converts at 4–5x — Pixis](https://pixis.ai/blog/why-ai-search-traffic-converts-at-4-5x-what-the-data-actually-shows/)
- [ChatGPT, LLM referrals convert worse than Google Search — Search Engine Land](https://searchengineland.com/llms-google-referral-conversion-study-463747) *(the contrary finding, retained deliberately)*

Internal references:

- `SEO/VenQore SEO and GEO Strategy.md` — link topology, PSEO architecture, Core Web Vitals budgets, audit protocols
- `CLAUDE.md` — MySQL policy, Ziggy regeneration, NUL-byte rule, service-layer convention
- `app/Support/MarketingSeo.php` — the SEO/GEO layer this plan extends

---

*End of plan. Keep this document updated as phases complete; it is the single source of truth for the free-tools program.*




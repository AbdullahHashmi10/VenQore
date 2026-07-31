# 06 — FREE TOOLS BUILD SPEC (Answers-First Edition)
**v1.0 · July 31, 2026 · Governs all `/tools/*` work. Strategy rationale: blueprint §3.12 + §7.3. Dispatched via IDE ticket T4.**

**The one principle:** build tools whose output an AI answer cannot replace. Google's AI Mode (default since I/O 2026) answers formulas inline — but it cannot hand the user a PNG, a printable PDF, or a cleaned CSV. Artifact beats answer.

---

## 1. Shared Engines (build once, reuse everywhere)

| Engine | Used by | Notes |
|:-------|:--------|:------|
| **Barcode engine** | Barcode Generator + format variants, Label Sheets, Price Tags, QR Menu | `picqer/php-barcode-generator` (already installed) for 1D; add a QR lib for QR/menus. Server endpoint rate-limited; client-side preview |
| **PDF pipeline** | Invoice, PO, Quotation, Packing Slip, Credit Note, Label Sheets, Count Sheets, Till Sheets | `barryvdh/laravel-dompdf` (already installed). One templated document service, per-document config |
| **CSV pipeline** | SKU Generator, Woo/Shopify Cleaner, ABC/Dead-Stock Analyzer | `maatwebsite/excel` (already installed). Client-side parse where possible; server only for big files, rate-limited |

## 2. Build Order (locked — finish one before starting the next)

| # | Tool | Route | Engine | Facet pages |
|:-:|:-----|:------|:-------|:------------|
| 1 | **VenQore Barcode Generator** | `/tools/barcode-generator` | Barcode | `/code128` `/ean13` `/upc-a` `/code39` `/itf14` `/qr-code` (+more later — ~15 pages from one build) |
| 2 | **VenQore QR Code Menu Generator** | `/tools/qr-menu-generator` | Barcode+PDF | Restaurant funnel; printable table tents |
| 3 | **VenQore Invoice Generator** | `/tools/invoice-generator` | PDF | Then clone: `/purchase-order-generator` `/quotation-generator` `/packing-slip-generator` `/credit-note-generator`; industry templates `/tools/invoice-template/{industry}` later |
| 4 | **Bulk SKU Generator** + **Woo/Shopify CSV Cleaner** | `/tools/sku-generator`, `/tools/product-csv-cleaner` | CSV | The cleaner is a *migration* tool — highest-intent page on the site; cross-link hard to /compare |
| 5 | **POS ROI Calculator** + processor fee calculators | `/tools/pos-roi-calculator`, `/tools/{square\|stripe\|paypal\|clover}-fee-calculator` | none | Fee calcs link into matching /compare pages |
| 6 | **Inventory Toolkit hub** | `/tools/inventory-toolkit` | CSV | Reorder point, safety stock, EOQ, GMROI, shrinkage, turnover — ONE hub page + sub-tools, never orphan pages |
| — | Deprioritized | ~~profit-margin, break-even, generic sales-tax~~ | | DA-80 incumbents + AI answers the formula inline. Do not build. |
| — | Later (validate volume first) | GST/VAT/FBR invoice generators, food-cost calculator, price-tag generator, count/till sheets, check-digit validator | | Chrome mission M5b pulls real KD/volume before dev hours |

## 3. Page Anatomy (every tool page, no exceptions)

```
H1: Free [Tool Name] — VenQore            ← branded, "do"-word (generator/maker/template/cleaner)
[40–60 word direct answer: what it does, formats/outputs, free, no signup]   ← extractable layer
[THE TOOL — immediate, above the fold, NO EMAIL GATE]                        ← interactive layer
H2: Supported formats/options → comparison table (real HTML table)
H2: Which [format] should I use? → question-style H3s, direct answer under each   ← fan-out facets
H2: How to [print labels / send the invoice / import the file] → numbered <ol> steps
H2: FAQs (5–7) → FAQPage schema
[Original-data callout when available — see §5]
[Soft CTA: "Print labels straight from your POS — VenQore, from $36/month" → /demo]
[Internal links: facet variants + related tools + 1 relevant /compare or /solutions page]
```

**Two-layer logic:** the top layer (answer, tables, FAQs) exists to get **cited** by AI Mode/Overviews — brand impression, not clicks. The tool layer makes the actual visit unavoidable. Both are mandatory.

## 4. Non-Negotiable Rules

1. **No email gate on core output.** Single downloads always free (gated tools bounce and die in rankings). Gate ONLY: bulk/CSV batch operations, saved history, benchmark-comparison reports. Gated bulk = newsletter list, tagged by tool.
2. **Branding:** page H1 and title = "Free X — VenQore"; the artifact itself carries a subtle "Made with VenQore — venqore.com" (removable = another soft gate, never forced on single use).
3. **Schema per page:** `SoftwareApplication` (applicationCategory, offers price 0) + `FAQPage` + `HowTo` + `BreadcrumbList`, via `MarketingSeo` entries.
4. **SSR first:** T1 must be live (or the page served with full static fallback) before any tool page ships — unrendered React is invisible to AI crawlers.
5. **Standard plumbing per CLAUDE.md + playbook 03:** MarketingSeo entry, sitemap row, `ziggy:generate`, rate limiting on server endpoints, works logged-out, no tenant data touched.
6. **Fan-out coverage:** every facet question a user could ask about this tool gets its own self-contained H2/H3 answer on the page (blueprint §3.12.2 — this is the citation mechanism).

## 5. Original Data ("VenQore Retail Index") — phase-gated

Named-source statistics are what AI answers quote. Eventually: "Average inventory turnover by retail category — VenQore Retail Index, n = X stores," refreshed quarterly, embedded as callouts on tool pages, with "compare your number" as the one legitimate email gate. **Gate: do not publish tenant-derived aggregates until n ≥ 50 active stores and the aggregation is irreversibly anonymized.** Until then, publish methodology-based research instead (e.g., "the true annual cost of POS fees across 8 processors, July 2026" — public pricing, our math, dated).

## 6. Measurement (per tool, monthly)

Trial signups per visit (primary) · downloads/generations · branded impressions trend (GSC) · referrals from chatgpt.com / perplexity.ai / claude.ai / gemini.google.com (GA4 channel group — IDE adds this once) · inbound links (Ahrefs/GSC) · citation checks for "best free [tool]" queries (Chrome M4/M10). **Do not judge tools on organic sessions** — answers-first Google makes that metric lie.

## 7. Definition of Done (each tool)

- [ ] Tool works logged-out, output downloads free, no gate on single use
- [ ] Two-layer anatomy complete (answer + facets + FAQs above/below tool per §3)
- [ ] All four schema types validate; MarketingSeo + sitemap + ziggy done
- [ ] Facet/variant pages live and interlinked (where applicable)
- [ ] Soft CTA to /demo present; artifact carries removable VenQore mark
- [ ] Rate limits tested; `php artisan test` green
- [ ] Listed on /tools hub + llms.txt; IndexNow pinged

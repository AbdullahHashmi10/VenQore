# VenQore V6 SEO and Positioning Action Plan

This plan is ordered for safe implementation. It is based only on the local V6 source snapshot.

## Phase 0 — lock the truth before editing copy (release blocker, 1–2 days)

### P0.1 Create one public fact registry

**Owner:** Product + engineering  
**Effort:** Medium  
**Outcome:** One source for every repeated numerical/product claim.

Include:

- category name: AI ERP builder;
- business types: 85+;
- product modules: 46;
- capabilities/features: use 140+ or 144 only after agreeing on the measured unit;
- document types: 13;
- reports by plan: confirm from the actual plan gate registry;
- dashboard readings: 58;
- correctness laws: 8;
- current plan names and prices;
- add-on names and prices;
- primary V6 CTA route and trial policy;
- availability state for SmartCapture, VenSynQ, and other coming-soon features.

Generate public JSON or a server-provided payload from canonical PHP configuration so React, Blade, schema, `llms.txt`, and tests consume the same values.

### P0.2 Resolve current contradictions

- Replace “140+ modules” with “46 modules” or a verified capability count.
- Change VenSynQ from $10 to the canonical $19/month, or change the canonical config if $10 is the intended price.
- Confirm Core report count from the plan/report registry.
- Remove `$18–$129` and three-offer data from homepage schema.
- Remove “Growth” and `$690/year` legacy language from the opening of `llms.txt`.
- Decide whether a 14-day trial exists and use that answer everywhere.
- Decide the single V6 CTA path: builder, registration, or trial.

**Acceptance test:** repository search finds no obsolete price, plan, module, or CTA claim outside explicit migration/history documents.

## Phase 1 — fix the conversion surfaces (week 1)

### P1.1 Simplify the landing hero

Use:

- eyebrow: “THE AI ERP BUILDER”;
- H1: “Tell us how you operate. We assemble your system.”;
- one recommended subhead;
- the prompt builder;
- one proof line: “85+ business types · 46 modules · One verified ledger.”

Move the secondary ledger paragraph and ticker below the first product demonstration. Remove “never breaks.”

**Acceptance test:** above the fold contains one H1, one explanatory paragraph, one primary interaction, and one compact proof line.

### P1.2 Rework the pricing hero and all pricing facts

- Keep “Priced like software. Not like a project.”
- Use the recommended short value subhead.
- Show the canonical plan line.
- Move traditional ERP cost comparison below the hero.
- Render cards, comparison rows, JSON-LD, title/description, and add-ons from canonical configuration.

**Acceptance test:** automated snapshot verifies every visible and machine-readable price against configuration.

### P1.3 Repair server-first SEO signals

- Ensure every indexable page has the correct canonical in initial HTML.
- Remove duplicate route keys from `MarketingSeo.php`.
- Choose one authoritative metadata manifest used by both Blade and Inertia Head.
- Add `/privacy` to the sitemap.
- Replace sitemap “now” timestamps with real modification dates or omit them.
- Decide index/noindex for `/workspace/build`, Digital Products, and any thin conversion-only page.

**Acceptance test:** a local crawler sees one title, description, canonical, robots directive, H1, and OG image per indexable URL without executing JavaScript.

### P1.4 Fix social preview defaults

- Server fallback should use `/images/og/venqore-og.png`, not `/images/logo.png`.
- Emit width, height, alt, and complete Twitter tags.
- Create specific cards first for homepage, pricing, Blueprint, Ledger, POS, SmartCapture, and VenSynQ.

## Phase 2 — align all page families (weeks 2–3)

### P2.1 Apply a shared messaging architecture

Every commercial page should follow:

1. search intent/category;
2. operator problem;
3. how VenQore assembles the solution;
4. financial/data correctness proof;
5. concrete product evidence;
6. limitations/availability where relevant;
7. one V6 CTA.

Use `PUBLIC-PAGE-MATRIX.md` as the page-family brief.

### P2.2 Rewrite highest-value pages manually

Order:

1. homepage;
2. pricing;
3. Blueprint;
4. Features;
5. POS;
6. Ledger;
7. Reckoner;
8. Dashboard Preview;
9. SmartCapture;
10. VenSynQ;
11. Solutions hub + multi-store;
12. Compare hub + Square + Vyapar;
13. About;
14. Security;
15. Contact.

### P2.3 Update shared templates for long-tail scale

- Solution template: industry problem → chosen modules → workflow → ledger outcome.
- Tool template: complete free task → explain next operational step → show relevant VenQore module.
- Blog template: answer first → evidence/example → product tie-in only when relevant.
- Docs/help template: task outcome → numbered steps → edge cases → updated/reviewer details.
- Comparison template: buyer fit → capability matrix → evidence/sources → last reviewed.

### P2.4 Correct off-position pages

- Newsletter: product updates, operator playbooks, and correctness engineering.
- Digital Products: connect clearly to VenQore or remove from the primary index.
- Partners: implementation/referral/reseller positioning; remove ambiguous licensing language.
- Roadmap: concrete builder evolution, not “eventually nobody types anything.”

## Phase 3 — schema, evidence, and authority (weeks 3–5)

### P3.1 Schema cleanup

- Remove approximately 20 deprecated `HowTo` schema objects.
- Generate Offer data from pricing configuration.
- Standardize the entity name “VenQore — AI ERP Builder.”
- Use Organization, WebSite, SoftwareApplication/WebApplication, BreadcrumbList, BlogPosting, and TechArticle only where supported by visible content.
- Keep FAQPage only for visible, useful Q&A; do not expect rich-result exposure.
- Never add invented review, rating, customer, or certification data.

### P3.2 Build an evidence layer

- Named leadership/team page.
- Named authors/reviewers with profiles.
- Correctness methodology and definitions.
- Public release/test evidence for numerical quality claims.
- Two to four customer case studies.
- Dated source blocks on competitor pages.
- Last reviewed/dateModified on pricing, security, docs, help, and comparisons.

### P3.3 Build topic clusters

Recommended clusters:

- AI ERP builder / composable ERP / custom ERP without consultants;
- POS + accounting / why operational and financial systems disagree;
- inventory correctness / FIFO, batch, expiry, purchasing, COGS;
- multi-store and multi-channel inventory truth;
- business-specific workflows by industry;
- invoice capture and operational AI with human review.

Each cluster needs one authoritative hub, supporting articles/tools, and contextual links back to the most relevant product proof page.

## Phase 4 — performance and release validation (before launch)

### P4.1 Local rendered crawl

Run the V6 application and crawl all public routes on desktop and mobile. Validate:

- 2xx status and no redirect chains;
- index/noindex intent;
- exact canonical;
- unique title/description/H1;
- rendered main content without client-only dependency;
- internal links and orphan pages;
- structured-data validity;
- OG/Twitter preview;
- sitemap membership;
- no legacy `/v6/*.html` or `/register` leakage.

### P4.2 Performance budget

- LCP ≤2.5s;
- INP ≤200ms;
- CLS ≤0.1;
- reduce or defer decorative hero scripts;
- reserve image dimensions;
- respect `prefers-reduced-motion`;
- confirm the pricing visual engine initializes once;
- lazy-load below-fold product imagery.

### P4.3 Regression tests

Add CI checks for:

- public fact registry consistency;
- duplicate SEO route keys;
- stale price/module/CTA strings;
- one canonical and one H1 per template;
- title/description length thresholds;
- OG image existence/dimensions;
- sitemap/public-route parity;
- structured-data parsing;
- broken internal links.

## Quick wins (first half-day)

1. Keep the landing H1 and replace the rest of the hero hierarchy with one subhead and one proof line.
2. Replace all “140+ modules” occurrences.
3. Correct VenSynQ pricing and the stale `llms.txt` opening.
4. Correct homepage offer schema and `$18/month` metadata.
5. Change the server OG fallback from the logo to the real 1200×630 card.
6. Add Privacy to the sitemap.
7. Remove duplicate `MarketingSeo.php` keys.
8. Rewrite the Newsletter promise.

## Suggested implementation batches

| Batch | Files/systems | Risk | Verification |
|---|---|---|---|
| A — facts | pricing/plans/module/report config, public fact payload, tests | High | Unit + repository consistency tests |
| B — conversion | Landing, HeroPrompt, Pricing | Medium | Visual mobile/desktop + content snapshots |
| C — metadata | MarketingSeo, shared Head/layout, Blade, sitemap, `llms.txt` | High | Server-rendered crawl + schema validation |
| D — priority copy | 15–20 core product/trust pages | Medium | Editorial review + page intent checklist |
| E — templates | solutions, tools, blog, docs/help, compare | Medium | Representative pages then full crawl |
| F — social images | image template/manifest and priority cards | Low | Facebook/LinkedIn/X preview checks |

## Definition of done

- Every public URL has a documented search intent and index decision.
- Every page uses the AI ERP-builder positioning without forcing identical copy.
- No public fact conflicts with canonical registries.
- Homepage and pricing have a single clear subheading hierarchy.
- All initial HTML has correct title, description, canonical, robots, schema, and social image.
- All high-value pages have a purpose-specific OG card.
- Competitor, pricing, security, and correctness claims have owners and review dates.
- The full local crawl passes; performance meets the stated budgets.

No product files were changed as part of this audit.

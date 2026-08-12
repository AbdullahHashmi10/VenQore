# VenQore — AppSumo Application Draft

**Prepared:** 2026-08-11
**Status:** ⚠️ **Do not submit yet.** See `AppSumo_Readiness_Audit_2026-08-11.md`. This is the asset to submit once you have 15–30 paying customers.
**Where it goes:** https://partners.appsumo.com/self-submission

**How to use this:** everything in `[BRACKETS]` is a number or fact only you can fill in. Everything else is written and verified against the codebase. Do not inflate the bracketed numbers — AppSumo ID-verifies founders and checks for fake testimonials, and a caught exaggeration ends the application permanently.

---

## Section 1 — Product basics

**Product name:** VenQore

**Website:** https://venqore.com

**Category:** Operations (secondary: Sales & Leads, Build & Code)

**One-liner:**
> Offline-first point of sale with real double-entry accounting built in — one system instead of five subscriptions and a notebook.

**Short description (≈50 words):**
> VenQore is a point-of-sale and business management system for small retail and food businesses. It runs when the internet doesn't, tracks inventory with FIFO costing, batches and expiry dates, and generates auditor-grade double-entry accounts automatically from every sale — no bookkeeping step, no separate accounting subscription.

---

## Section 2 — The long description

*(Written for AppSumo's audience: small business owners and agencies. Leads with the problem, not the feature list.)*

**Your POS doesn't talk to your accounting. Your accounting doesn't know your stock. And when the internet drops, everything stops.**

Most small shops run on four or five disconnected things: a till app, a spreadsheet for stock, a notebook for customer credit, and an accountant who reconstructs the year from a shoebox each spring. Each one costs money. None of them agree with each other.

VenQore replaces all of it with one system.

**It works offline.** The POS terminal runs on IndexedDB and keeps selling through an internet outage — full cart, barcode scanning, discounts, split payments, receipt printing. When the connection returns, everything syncs back exactly once. No duplicates, no lost sales.

**It does real accounting, not summaries.** Every sale, purchase, return, and expense automatically generates balanced double-entry journal entries. You get a real general ledger, trial balance, P&L, and balance sheet — the reports your accountant actually asks for — with no bookkeeping step and no separate accounting subscription.

**It understands inventory properly.** FIFO stock deduction so your cost of goods is accurate. Batch tracking with expiry dates. Serial and IMEI tracking. Multi-barcode products. Multi-unit conversion (buy by the carton, sell by the piece). Composite products with recipes — sell a spice blend and it deducts the raw materials, or sell from pre-made stock, your choice.

**It handles the customer khata.** Credit limits, aging receivables, payment allocation against specific invoices, partial payments — the informal ledger most shops keep on paper, made auditable.

**It syncs with WooCommerce.** Orders from your online store become sales in VenQore automatically. Stock changes push back the other way. One inventory across both channels.

**It runs multiple stores.** Full multi-tenant architecture with strict data isolation, per-store staff, and role-based permissions — cashier, accountant, purchasing, and viewer each get their own dashboard.

**It reads your paperwork.** Photograph a supplier invoice and VenQore extracts the line items into a purchase — with the AI cost metered and capped so it can never surprise you.

**Built and tested seriously.** [X]+ automated tests, guardrails against cross-tenant data leakage, and value-level checks that verify the money is right — not just that the code ran.

---

## Section 3 — The deal structure

**Deal type:** Lifetime, capped tiers, stackable to 3 codes.

**⚠️ Set these numbers with care.** AppSumo's grandfathering policy means you can always make a deal *more* generous, but tightening limits later requires killing the listing and starting over. Decide the numbers you can afford at 2,000 buyers, not the numbers that sell best.

**⚠️ Price consistency required.** AppSumo enforces a "lower than anywhere" rule, permanently and actively monitored. Your public pricing page constrains this. Resolve the $79/$158/$237 vs $49/$99/$179 conflict in the codebase and docs before filling this in — see F6 in the audit.

**These values are read from `config/plans.php` (`ltd_1`/`ltd_2`/`ltd_3`), verified 2026-08-11 against `PlanFeatureMatrixSeeder`. They are what the code actually enforces.** Do not copy the numbers from `AppSumo_Decision_Document.md` — that document predates the implementation and understates several limits.

| | Code 1 | Code 2 | Code 3 |
|---|---|---|---|
| **Price** | `[$49 or less]` | `[$__]` | `[$__]` |
| Locations / stores | 1 | 3 | 10 |
| Staff users | 3 | 10 | 50 |
| Transactions / month | 1,000 | 3,000 | 8,000 |
| Products (SKUs) | 1,000 | 10,000 | 50,000 |
| Reports | Basic | Advanced | Advanced |
| Offline POS | Included | Included | Included |
| Double-entry accounting | Included | Included | Included |
| P&L report | Included | Included | Included |
| Multi-branch | — | Included | Included |
| Bank reconciliation | — | Included | Included |
| Recurring invoices | — | Included | Included |
| Production / BOM | — | Included | Included |
| AI Growth Engine | — | Included | Included |
| API access | — | — | Included |
| Loyalty points | — | — | Included |
| Digital gift cards | — | — | Included |
| WooCommerce sync | — | — | — |

### ⚠️ Two things to settle before you publish this table

**1. WooCommerce is disabled on every LTD tier.** `config/plans.php` sets `'woocommerce' => false` for `ltd_1`, `ltd_2` and `ltd_3`. Your marketing copy leads with WooCommerce sync as a headline feature. If the listing implies LTD buyers get it and the code denies it, that is a refund-and-1-star-review generator. Either enable it on a tier or keep it out of the listing copy entirely.

**2. `hosted_until` is set to `'+2 years'` on all three LTD tiers.** `EnforceHostedUntil` blocks all non-GET requests once that date passes — reads still work, writes stop. `CheckHostedUntilExpiryJob` warns at 60/30/7 days.

This is a defensible business model, but **it is not a lifetime deal as AppSumo defines one**, and AppSumo requires you to *"extend lifetime updates and support to customers who purchase your product as a lifetime deal."* Selling "lifetime" and cutting off writes at 24 months would breach the partner terms and trigger mass refunds in year three.

Pick one, deliberately:
- **Remove `hosted_until` for LTD tiers** and honour genuine lifetime access, funding hosting from subscription upsells. Cleanest fit for AppSumo.
- **Keep the 2-year cap** and describe it honestly in the listing as 2 years of hosting with a continuation subscription after. Converts worse and reads as a subscription in disguise, but it is honest.

Do not leave it as-is while advertising lifetime.

**Stacking note for AppSumo:** AppSumo does not support code stacking for self-listed products — partners must handle it internally. VenQore already does: `/redeem` accepts codes one at a time, each additional code upgrades the license tier, with a race-safe transaction and a hard 3-code cap. **Say this explicitly in your application** — it removes a common objection before it is raised.

**What happens at the limit:** users are never locked out of their data. Reads always work. Only new write operations pause until the next month's allocation. Warnings appear at 80% and 95%.

---

## Section 4 — Traction and business questions

*(These are the answers that decide the application. Fill honestly.)*

**Paying customers:** `[__]`
**MRR:** `[__]`
**Total users / accounts:** `[__]`
**Launched:** `[date]`
**Team size:** `[__]`
**Funding / runway:** `[__]`

**Reviews and social proof:**
- G2 / Capterra / GetApp: `[status]`
- Customer testimonials: `[__ collected]`
- Case studies: `[__]`

**How do you currently acquire customers?**
> `[Be concrete. "Direct sales to local retail and food businesses in Pakistan, plus organic search" is a real answer. "Marketing" is not.]`

**Why AppSumo, and what happens after?**
> VenQore is built and stable but distribution-constrained. The LTD capital funds 12–18 months of infrastructure and development while we build the subscription business, and the Sumo-ling feedback loop is worth as much as the revenue — this is a product where real operators using it daily will surface things no test suite catches. Post-campaign, LTD tiers are permanently capped, so growth into more stores, more staff, more transactions, or AI features converts to subscription naturally.

**Can you support the volume?**
> `[Answer with specifics: helpdesk tool, response time commitment, who answers. AppSumo names "no customer support plan" as an explicit disqualifier. Do not leave this vague.]`

---

## Section 5 — Differentiation

**vs. Loyverse / Square / generic cloud POS:**
> They are point of sale with reporting bolted on. VenQore generates a real general ledger — trial balance, P&L, balance sheet — automatically from operations. Their users still pay for separate accounting software; VenQore users do not.

**vs. Vyapar / Khatabook / regional ledger apps:**
> Those are billing and khata apps with light inventory. VenQore has FIFO costing, batch and expiry tracking, composite manufacturing recipes, multi-warehouse stock, and genuine multi-store isolation — the operations layer they stop short of.

**vs. QuickBooks / Zoho Books:**
> Accounting-first tools with a weak or bolted-on POS, and they need the internet. VenQore is operations-first with accounting generated as a by-product, and the till keeps working when the connection drops.

**The one-sentence version:**
> The only offline-first POS where the accounting is real, automatic, and audit-grade — not a sales report with an accounting label on it.

---

## Section 6 — Pre-submission checklist

Do not submit until every box is ticked.

**Traction (the actual gate)**
- [ ] 15+ paying customers with real usage
- [ ] 5+ genuine testimonials, attributable to real businesses
- [ ] Listed on G2 / Capterra / GetApp / AlternativeTo
- [ ] Public LinkedIn presence under your real name, posting about VenQore
- [ ] Founder named publicly on the site

**Engineering (audit Phase A)**
- [ ] R4 schema reconciliation clean
- [ ] R3 activity logging fixed
- [ ] R1 tests wired into the real suite
- [ ] R2 baselines regenerated
- [ ] Full suite green; `audit:mass-assignment` exits 0
- [ ] All 15 secrets rotated

**Production proof (audit Phase B)**
- [ ] Live Lemon Squeezy payment, real card, then refunded
- [ ] Real AppSumo code redeemed on production
- [ ] Code-1 tenant blocked correctly at sale #501
- [ ] Duplicate webhook → no duplicate tenant or credit
- [ ] Same code, two browsers, simultaneously → one loses
- [ ] Two-tenant reset isolation confirmed
- [ ] Written, dated log with screenshots

**Operational**
- [ ] Sentry live and receiving events
- [ ] Uptime monitoring on `/` and `/health`
- [ ] Helpdesk live with a documented response-time commitment
- [ ] ToS and Privacy reviewed by a lawyer
- [ ] Automated daily backups, with a restore actually tested
- [ ] Default credentials (`platform@venqore.com / admin1234`) dead on production

**Deal**
- [ ] Tier limits finalized — numbers you can afford at 2,000 buyers
- [ ] Pricing consistent across codebase, pricing page, and listing
- [ ] "Lower than anywhere" rule verified against every other channel
- [ ] Refund policy and 60-day window budgeted for
- [ ] `APPSUMO_PUBLIC=false` on prod, ready to flip on approval day

---

## Section 7 — After approval

The audit's Part 5 and the April decision document both land on the same point, and it is the one that matters most:

**The Q&A section is your real sales page, and the first 60 days define your reputation permanently.** AppSumo reviews do not expire. Founders who personally answer every question in technical detail within hours average 4.8+ stars. Founders who let questions sit average 3. Block out the time before launch day, not after.

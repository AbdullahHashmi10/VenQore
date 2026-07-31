# VENQORE EXECUTION PLAN — MASTER FILE
**Version 1.0 · July 30, 2026 · Sprint Day 1 = Friday, August 1, 2026**

This folder is the *live* version of the strategy in `../VENQORE_ULTIMATE_GROWTH_BLUEPRINT_2026.md` (v2.0). The blueprint says *why*; these files say *who does what, in what order, by when*. When they conflict, this folder wins.

---

## 1. The Mission

**North Star (30 days, by Aug 30):** 10 paying international customers on Starter ($36/mo) or better.
**90-day targets (by Oct 30):** 60+ pages indexed in Google · VenQore cited in 3+ of 20 tracked AI-search queries · 15+ platform profiles live with the canonical entity block · 10+ honest reviews on G2/Capterra · AppSumo listing live or launch-scheduled · MRR from 25+ customers.

**Positioning (locked, per founder decision):** *Vision + Beachhead, told mission-first.* The core belief: **businesses waste their best hours entering the same information into different systems — VenQore eliminates repetitive work without sacrificing financial accuracy.** The website still wins retail/POS keywords ("POS with real accounting," "Square alternative," "offline POS"), but every page leads with the problem, not the features. Locked brand language: **H1 "The last software your business will need." · Tagline "Run your business, not your software."** All copy comes from `04-COPY-AND-MESSAGING.md` — never improvise facts.

---

## 2. The Three Owners

| Owner | Playbook | Only they can do |
|:------|:---------|:-----------------|
| **Abdullah (founder)** | `01-ABDULLAH-PLAYBOOK.md` | Sales conversations, demos, account signups (identity/OTP), posting to communities under his name, AppSumo/Product Hunt relationships, pricing decisions, acquisition conversations |
| **Claude in Chrome** (browser agent) | `02-CHROME-AGENT-PLAYBOOK.md` | Web legwork: directory form-filling (with Abdullah present for logins), republishing blogs, drafting Reddit/Quora answers, GEO citation audits, competitor monitoring, prospect-list building |
| **IDE agent** (coding agent in the repo) | `03-IDE-AGENT-PLAYBOOK.md` | Everything that ships code: SSR, compare/solutions/features/tools pages, blog engine, schema, roadmap page, performance |

**Shared source of truth:** `04-COPY-AND-MESSAGING.md` — canonical entity data, pitches, templates, banned claims. Every owner copies from it verbatim.

---

## 3. Operating Rhythm

**Abdullah's default day (8h):** 4h sales sprint (outreach + demos) · 1h community/content (LinkedIn post or Reddit answers — personalizing Chrome-agent drafts) · 1h entity/platform work · 1h reviewing + dispatching agent work (approve IDE PRs, launch Chrome missions, review drafts) · 1h flex/follow-ups.

**Weekly cadence:**
- **Mon:** Dispatch IDE tickets for the week · LinkedIn post 1 · outreach block
- **Tue:** Chrome mission day (directories/republishing) · outreach block
- **Wed:** LinkedIn post 2 · blog post published · outreach block
- **Thu:** Chrome mission day (answers/prospecting) · outreach block
- **Fri:** LinkedIn post 3 · ship/verify IDE work · outreach block
- **Sun:** Scorecard (Section 7) + plan next week + GEO spot-check

---

## 4. Sequenced Timeline

### Week 0 — Day 0 (Jul 31): Verification (2 hours, Abdullah)
Before anything: confirm Google Search Console + Bing Webmaster are verified and sitemap submitted; record `site:venqore.com` indexed count; run PageSpeed on `/`, `/features`, `/pricing`; confirm live robots.txt, llms.txt, sitemap.xml match repo. Log results at the bottom of this file. Everything else keys off this.

### Weeks 1–2 (Aug 1–14): Ignition
| Track | Work | Owner |
|:------|:-----|:------|
| Revenue | AppSumo application submitted Day 1 · 100-prospect list · 35 touches/day · first demos | Abdullah (+Chrome for list-building) |
| Entity | Wave 1 profiles: LinkedIn Company, Crunchbase, G2, Capterra, AlternativeTo, SaaSHub, Indie Hackers, Product Hunt "Coming Soon" | Abdullah + Chrome (missions M1/M9) |
| Site | T1 full-body SSR · T2 compare pages (vs Square, vs Vyapar) · T10 noindex audit | IDE |
| Content | Blog #4–#5 published, republished to Medium/Dev.to (M2) · LinkedIn 3×/wk · Reddit account warming (no product mentions) | Abdullah + Chrome |

### Weeks 3–4 (Aug 15–30): Compounding + Close
| Track | Work | Owner |
|:------|:-----|:------|
| Revenue | Follow-up sequences hit touch 3–5 · founding-member annual closes · **hit 10 customers** | Abdullah |
| Entity | Wave 2: Trustpilot, GetApp, Software Advice, Crunchbase enrichment, Wikidata draft | Abdullah + Chrome |
| Site | T4 barcode generator tool · T5 first 2 solutions pages · T7 /roadmap + homepage vision strip · T3 blog engine upgrade | IDE |
| Content | Blog #6–#9 · first Reddit value posts (soft mentions with disclosure) · GEO baseline audit (M4) | Abdullah + Chrome |

### Weeks 5–8 (Sep): Authority
Remaining compare pages (Shopify POS, Lightspeed, Toast, Clover, Loyverse) · 4 more solutions pages · QR Menu Generator + Invoice Generator and its PDF-engine clones (T4b, per `06-TOOLS-BUILD-SPEC.md`) · YouTube channel + first demo video · guest-post outreach (M6) + listicle outreach (M10, weekly) · Product Hunt launch prep · review seeding from real customers. *(Glossary program deprioritized in v2.2 — tool facet pages replace it.)*

### Weeks 9–13 (Oct): Launch & Scale
**Product Hunt launch** (Abdullah owns launch day) · AppSumo launch window · Hacker News Show HN · 10 SaaS directory submissions · report-page silo · GEO audit #2 vs baseline · 90-day retro + Q4 plan.

---

## 5. Dependency Order (do not violate)

1. **Day 0 verification** → everything else.
2. **AppSumo application** (Day 1) → its 4–8 week lead time gates the launch window in Oct.
3. **Canonical copy kit (04)** → all entity profiles and outreach (exists — done).
4. **T1 SSR** → before mass page-building (T2/T5/T6), so new pages index properly. T2's first two pages may ship in parallel with T1.
5. **Entity profiles** → before Product Hunt/AppSumo launches (reviewers check that the company looks real).
6. **Real customers** → before review asks. Reviews are earned, never seeded fake.
7. **Compare pages + tools live** → before guest-post push (links need worthy targets).

---

## 6. Rules (all owners)

1. **Shipped / Building / Planned:** present tense only for shipped features. SmartCapture and marketplace VenSynQ are "rolling out." B2B network and storefronts are roadmap.
2. **Pricing is USD only:** $36 / $63 / $129 monthly (Starter/Growth/Enterprise), $360 / $630 / $1,290 annual (two months free). No PKR/geo pricing in public copy for now. The $49/$99/$199 figures in old docs are dead.
3. **No fabricated numbers** — no invented user counts, ratings, or testimonials. "3 businesses run on VenQore daily, 1,000+ automated tests" beats fake hundreds. (Test count is stated as "1,000+" — actual is above 1,100.)
4. **Disclosure:** every community mention of VenQore by Abdullah includes "I'm the founder."
5. **Code:** MySQL only, `tenant_id` scoping, `php artisan ziggy:generate` after route changes, no NUL-byte files, never touch `venqore_pos` data destructively (per CLAUDE.md).
6. **One source of copy:** `04-COPY-AND-MESSAGING.md`. Update it there first, then everywhere.
7. **Answers-first Google (since I/O 2026, AI Mode is the default):** build for citations AND clicks — "do"-intent pages (compare, solutions, tools) over "know" content; tools ship ungated with artifact output (`06-TOOLS-BUILD-SPEC.md`); never judge progress on organic sessions alone (see scorecard's branded-impressions / AI-referral / signups-per-visit rows).

---

## 7. Scorecard (Abdullah fills every Sunday)

| Metric | Target | W1 | W2 | W3 | W4 |
|:-------|:------:|:--:|:--:|:--:|:--:|
| Outreach touches | 175/wk | | | | |
| Demos delivered | 10/wk | | | | |
| Trials started | 8/wk | | | | |
| **Paying customers (cum.)** | **10 by W4** | | | | |
| Pages indexed (GSC) | +10/wk from W2 | | | | |
| Platform profiles live | 8 by W2, 15 by W4 | | | | |
| Blog posts live (cum.) | 9 by W4 | | | | |
| AI queries citing VenQore (of 20, incl. Google AI Mode) | baseline W3 | | | | |
| Branded search impressions (GSC, weekly) | trend ↑ | | | | |
| AI referral visits (chatgpt/perplexity/claude/gemini) | baseline W4 | | | | |
| Trial signups per 100 site visits | baseline W2, trend ↑ | | | | |

---

## 8. Day 0 Verification Log (fill in)

- [x] GSC verified? Sitemap submitted? Indexed count: 5 (20 not indexed, 14 'Discovered')
- [x] Bing Webmaster verified? Yes. IndexNow key? 83f4b04e475f44d4bfa04f7abac5aa3b
- [x] PageSpeed mobile scores — home: 89 features: 61 pricing: 58
- [ ] Live robots.txt/llms.txt/sitemap.xml match repo? ____
- [ ] `/s/*` tenant routes return noindex header? ____
- Notes: ____

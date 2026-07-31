# PLAYBOOK 02 — CLAUDE IN CHROME (BROWSER AGENT)
**Dispatcher: Abdullah. Each mission below is a ready-to-paste prompt for a Claude-in-Chrome session.**

## Guardrails (paste into every mission, non-negotiable)
1. All brand facts, descriptions, and pricing come from `SEO/EXECUTION-PLAN/04-COPY-AND-MESSAGING.md` — copy verbatim, never improvise. Pricing is $36/$63/$129.
2. **Draft, don't impersonate:** community posts (Reddit, Quora, forums) are DRAFTED into a file for Abdullah to personalize and post himself. Never post to a community as him. Directory/profile form-filling with Abdullah's accounts is fine when he dispatched the mission.
3. Never create fake reviews, upvotes, or sockpuppet accounts. Never claim unshipped features in present tense (SmartCapture / marketplace sync = "rolling out").
4. Respect platforms: no mass-posting, follow each site's submission rules, stop and report if a CAPTCHA/verification needs a human.
5. End every mission with a written report: what was completed, URLs created, what needs Abdullah's follow-up.

---

## M1 — Directory & Profile Submissions (Week 1–2, then as dispatched)
> Using the canonical entity block in `04-COPY-AND-MESSAGING.md` (section G), complete/submit the VenQore listing on: [AlternativeTo | SaaSHub | Indie Hackers | Crunchbase | G2 | Capterra | GetApp | Software Advice | Trustpilot — pick per session]. I'm logged in. Fill every field: name "VenQore", the canonical one-liner, long description (04 §D), category "Business Management Software / Point of Sale / Retail Operating System", USD pricing from the kit (monthly + annual, no other currencies), website https://venqore.com, logo from /images/logo.png. On AlternativeTo, list VenQore as an alternative to Square POS, Loyverse, Vyapar, Shopify POS. Report every profile URL created.

## M2 — Blog Republishing (weekly, after each post)
> Take the newest post from venqore.com/blog. Republish to Medium and Dev.to under my accounts: import via URL where supported, otherwise paste; **set the canonical URL to the venqore.com original**; add footer "Originally published at venqore.com/blog/[slug]. VenQore is [canonical one-liner]." Also draft (do not post) a LinkedIn-article version into a file for my review.

## M3 — Community Answer Drafting (Tue + Thu)
> Search Reddit (r/smallbusiness, r/woocommerce, r/ecommerce, r/retail, r/Bookkeeping), Quora, and the Loyverse community for threads from the last 7 days matching: "which POS", "POS recommendation", "QuickBooks doesn't match", "inventory wrong WooCommerce", "Loyverse accounting", "Square fees too high", "Vyapar limitations". For the 8 best threads, write genuinely helpful answers (solve their problem first; mention VenQore only where relevant, with founder disclosure noted for me to include). Save to `SEO/EXECUTION-PLAN/drafts/answers-[date].md` with thread URLs. Do NOT post anything.

## M4 — AI Citation Audit (monthly, 1st of month)
> Ask ChatGPT, Perplexity, Gemini, Copilot **and Google itself (AI Mode is now the default — run the queries in a normal Google search and record the AI answer)** each of the 20 queries in `04` section J. Record per query/engine: is VenQore mentioned? which competitors are? which sources does the answer cite (roundup articles, review sites, Reddit threads — note exact URLs, they become M10 outreach targets)? Save as `SEO/EXECUTION-PLAN/geo-audits/geo-audit-[YYYY-MM].md` with a summary table and deltas vs last month.

## M5 — Competitor Freshness Sweep (monthly)
> Visit the pricing + feature pages of Square, Shopify POS, Lightspeed, Toast, Clover, Loyverse, Vyapar. Record current starting prices, transaction fees, and notable new features. Diff against `04` section K (competitor fact table) and produce an update report so the IDE agent can refresh /compare pages. Accuracy on competitor claims is legally important — quote exact published numbers with URLs.

## M6 — Guest-Post & Backlink Prospecting (Sep)
> Build a prospect sheet from the blueprint Appendix E list plus searches like "retail technology write for us", "POS guide submit article", "small business blog contributor". For each: site, DA estimate, topic fit, submission URL/email, suggested pitch angle (from `04` pitches). 20 rows minimum. Save to `SEO/EXECUTION-PLAN/drafts/guestpost-prospects.md`. Draft (don't send) 3 pitch emails.

## M7 — Prospect List Building (feeds the sales sprint, weekly)
> Find 50 [WooCommerce store owners / Loyverse users / retail CPAs — per dispatch] with reachable contact info from public sources (business sites' contact pages, FB group member intros, LinkedIn). Log into my prospect sheet with: business, country, channel, URL, contact route, one personalization detail (e.g. what they sell). No scraping behind logins; public info only.

## M8 — Product Hunt Launch Prep (Sep)
> Research 5 recent successful POS/SaaS Product Hunt launches. Record: taglines, first-comment structure, gallery asset types, upvote patterns, maker responses. Draft 5 tagline options and a gallery shot-list for VenQore using `04` copy. Save to `SEO/EXECUTION-PLAN/drafts/producthunt-prep.md`.

## M9 — Profile Completeness Audit (monthly)
> Visit every profile URL in the master scorecard list. Check name/one-liner/pricing/logo match `04` exactly; screenshots current; links work. Report mismatches as a fix-list.

## M5b — Tool Keyword Validation (before each tool build)
> Before dev hours are committed to the next tool in `06-TOOLS-BUILD-SPEC.md` §2, research its target keywords using free sources (Google autocomplete, "People also ask", AlsoAsked-style expansions, competitor tool pages' visible targeting). Assess: who currently ranks (DA tier of incumbents)? does an AI answer fully absorb the query, or does the user need the artifact? Report a build / adjust-angle / skip recommendation. (If Abdullah provides Ahrefs/Semrush access, pull real KD + volume instead.)

## M10 — Listicle & Roundup Outreach Prospecting (weekly from Week 4)
> AI answers to "best free [tool]" and "best [competitor] alternative" queries are synthesized from third-party roundups — getting VenQore INTO existing listicles now directly shapes the answers. Using the M4 audit's cited-source URLs plus searches like "best free barcode generator", "best Square alternatives 2026", "best POS for small business": build a sheet of the 20 most-cited roundup articles with author/contact/update-date. Draft (don't send) personalized pitch emails offering the author something real — the free tool itself, exact feature/pricing facts, or our original data — never "please add us." Save to `SEO/EXECUTION-PLAN/drafts/listicle-outreach-[date].md` for Abdullah to send.

## Cadence
| When | Mission |
|:-----|:--------|
| Tue weekly | M1 (until done) → then M9/M7 |
| Wed weekly | M2 after blog publish |
| Tue + Thu | M3 answer drafting |
| Fri weekly (from Week 4) | M10 listicle outreach prospecting |
| Before each tool build | M5b keyword validation |
| 1st of month | M4 AI citation audit + M5 competitor sweep |
| Sep | M6, M8 |

# VenQore — Your Action List

**Prepared:** 2026-08-11
**What this is:** everything left that needs *you* — server access, real money, real accounts, a camera, or a judgement call. All the code work I could finish is done.

Companion docs: `AppSumo_PreLaunch_Plan.md` (full plan), `AppSumo_Application_Draft.md` (listing copy), `AppSumo_Readiness_Audit_2026-08-11.md` (why self-listing).

---

## ⚠️ Two decisions before anything else

These are business decisions, not code. Both change what you can legally put on the listing, and neither can be reversed cheaply after launch.

### D1. `hosted_until` is set to `+2 years` on every LTD tier

`config/plans.php` sets `'hosted_until' => '+2 years'` for `ltd_1`, `ltd_2` and `ltd_3`. `EnforceHostedUntil` blocks every non-GET request once that date passes: reads keep working, writes stop. `CheckHostedUntilExpiryJob` warns the tenant at 60, 30 and 7 days.

**This is not a lifetime deal as AppSumo defines one.** Their partner terms require you to *"extend lifetime updates and support to customers who purchase your product as a lifetime deal."* Advertising lifetime and cutting off writes at 24 months would breach the terms and trigger mass refunds in year three, when you have already spent the money.

Choose:

- **(A) Remove `hosted_until` for LTD tiers.** Honour real lifetime access; fund hosting from subscription upsells and the capped tiers. Cleanest fit, converts best.
- **(B) Keep the 2-year window** and say so plainly in the listing: "2 years of hosting included, continuation subscription after." Honest, but converts far worse — AppSumo buyers read it as a subscription in disguise.

I did not change this. It is your call, and it is the single most consequential item in this document.

### D2. WooCommerce is disabled on all three LTD tiers

`'woocommerce' => false` for `ltd_1`, `ltd_2`, `ltd_3`. Your marketing copy leads with WooCommerce sync as a headline feature.

If the listing implies LTD buyers get it and the code denies it, that is a refund generator and a 1-star review generator. Either enable it on a tier (probably Code 3) or keep it out of the listing copy entirely.

---

## 1. Run and verify what I changed (30 min, local)

Nothing below has been executed — the sandbox was unavailable for this entire session, so **no linting and no test runs happened.** Treat all of it as unverified until these pass.

```bash
php artisan migrate                 # runs the new activity_logs nullable fix
php artisan test                    # full suite, including 2 new test files
php artisan audit:mass-assignment   # must exit 0
php artisan ziggy:generate          # mandatory per your CLAUDE.md
npm run build                       # UsageLimitBanner.jsx must compile
```

Then eyeball the two new test files actually running:

- `tests/tests/Feature/Plan/TransactionLimitEnforcementTest.php`
- `tests/tests/Feature/Plan/ActivityLogWritesOnFreshInstallTest.php`

**If `TransactionLimitEnforcementTest::test_it_blocks_once_the_monthly_cap_is_reached` fails, stop and tell me.** That is the test guarding the bug where your transaction cap silently did not work at all.

## 2. Regenerate the guard baselines (10 min, local)

I deliberately did not delete these — they are regenerated *by* the Guardrails suite, so deleting them without running it leaves the repo worse.

```bash
rm tests/tests/Feature/Guardrails/baselines/*.json
php artisan test --filter=Guardrails
```

Then **read** the regenerated `mass_assignment_drift.json` and `stale_fillable.json`. Every remaining entry is a genuinely open issue. Commit them.

## 3. Rotate 15 secrets (1 hour, providers + server)

Lemon Squeezy, AppSumo, AWS, Gemini/Google, mail, and the rest. They have sat in a dev `.env` across many AI sessions including mine. Rotate at each provider, update the server env, then `php artisan config:clear`.

## 4. Schema reconciliation — R4 (half a day, the big one)

Still open. Migrations do not reproduce `venqore_pos`, so a fresh install is broken and your tests run on a different schema than production. Every AppSumo buyer is a fresh install.

```bash
mysqldump --no-data venqore_pos > prod_schema.sql
mysql -e "CREATE DATABASE schema_check"
# point a scratch .env at schema_check
php artisan migrate
mysqldump --no-data schema_check > migrated_schema.sql
diff migrated_schema.sql prod_schema.sql
```

Write a migration for every column present in prod but missing from the migrated schema. Repeat until `diff` is empty. I could not do this — it needs a live MariaDB and both databases.

## 5. Production verification drill (2 days, real money)

The one that decides whether launch day is a refund event. Keep a written, dated log with screenshots.

- [ ] Real card payment through live Lemon Squeezy, then refund it
- [ ] Real AppSumo code redeemed on production, end to end
- [ ] Stack a 2nd and 3rd code, confirm tier upgrades
- [ ] Same code, two browsers, simultaneously, exactly one wins
- [ ] **Push an LTD tenant past its transaction cap.** Highest priority: this path was completely dead until today and has never been observed working
- [ ] Confirm the usage banner appears at 80% and again at 95%
- [ ] Fire the same webhook twice, no duplicate tenant or credit
- [ ] Factory-reset one of two tenants, confirm the other is untouched
- [ ] Offline POS sale, reconnect, syncs exactly once
- [ ] Backup, restore into a scratch DB, app runs against it
- [ ] Feed SmartCapture an invoice containing "ignore previous instructions" — it must extract line items, not obey

## 6. Operations (half a day)

- [ ] Sentry live, confirmed by a deliberate test exception
- [ ] UptimeRobot on `/` and `/health`
- [ ] Alert on Lemon Squeezy webhook failures
- [ ] Queue worker and scheduler supervised so they restart on reboot
- [ ] Automated daily off-server backups, with a restore actually tested
- [ ] Helpdesk with a published response time
- [ ] ToS and Privacy reviewed by a lawyer
- [ ] `platform@venqore.com / admin1234` fails on production
- [ ] `APP_DEBUG=false`, `APP_ENV=production`, `APPSUMO_PUBLIC=false`

---

# The listing itself

## 7. Pricing (1 hour, decision)

Code 1 is currently **$79**. AppSumo's own listing brief says an entry tier at **$49 or under** *"converts far better and has a much stronger chance of acceptance."* Drop it, and scope by volume rather than by removing features.

Verified tier limits, read from `config/plans.php` and cross-checked against the seeder — **use these, not the numbers in the April decision doc**:

| | Code 1 | Code 2 | Code 3 |
|---|---|---|---|
| Locations | 1 | 3 | 10 |
| Staff | 3 | 10 | 50 |
| Transactions/mo | 1,000 | 3,000 | 8,000 |
| Products | 1,000 | 10,000 | 50,000 |
| Reports | Basic | Advanced | Advanced |
| API access | — | — | Yes |
| Loyalty | — | — | Yes |

Two constraints that bite later:

- **"Lower than anywhere" is permanent and monitored.** Your AppSumo price must stay below your cheapest price on every other channel, forever.
- **Grandfathering is one-directional.** You can always be more generous; tightening means killing the listing and starting over. Set these for the world where 2,000 people redeem.

## 8. Images (half a day — start here, it is the #1 stall)

Run `php artisan demo:seed` first so screens have realistic data. Empty tables photograph badly.

All images: clean UI, plain background, **no device frames, no text overlays**.

| Asset | Spec | Show |
|---|---|---|
| Icon | 512×512+ | Logo mark only, no wordmark |
| Hero | 16:9, 1920×1080+ | POS mid-sale, or the dashboard |
| Shot 1 | 16:9 | POS terminal with a live cart |
| Shot 2 | 16:9 | Inventory with batches and expiry dates |
| Shot 3 | 16:9 | P&L or trial balance — your actual differentiator |
| Shot 4 | 16:9 | Offline indicator, or the multi-store switcher |

Each needs alt text, roughly four words, a noun phrase.

## 9. Copy (half a day)

Draft is in `AppSumo_Application_Draft.md`. AppSumo's house style is strict and they treat violations as an AI-written tell:

- Sentence case, never Title Case
- **No em dashes**
- No emoji, no exclamation marks
- Banned: seamless, robust, revolutionary, cutting-edge, game-changing, world-class, leverage, unlock, empower, elevate
- **Never mention monthly pricing, free tiers, trials, or "no credit card required"** anywhere

## 10. Founder identity (1 hour)

AppSumo: *"If a founder won't put their name on it publicly, that's a red flag."* They ID verify.

- [ ] LinkedIn profile under your real name — it is a field in the form
- [ ] Your name on the site's about page
- [ ] Founder narrative, 2+ first-person paragraphs
- [ ] Founded date, HQ city, team size, stage, funding

## 11. Trust signals (one afternoon)

Optional section, and you have little to fill it with. Get listed anyway — free, permanent backlinks and it fills an otherwise empty credibility slot: G2, Capterra, GetApp, AlternativeTo, SaaSHub, Crunchbase.

---

# 12. Traffic — the part that actually decides the outcome

Self-listing means AppSumo sends you **no email, no video, no paid ads**, and deprioritises you on the homepage. A few hundred sales in six weeks is a realistic ceiling *with* your own marketing. Without it, expect a trickle.

- [ ] **Launch the invoice scanner you already built.** `/tools/invoice-scanner` shipped in Phase 7 and has never been promoted. Post it to Reddit, Hacker News, and small-business forums as a free tool, not as a VenQore ad. This is your best owned asset.
- [ ] **Product Hunt launch.** This is how TransferChain got AppSumo to approach *them* about Select. Free, one day.
- [ ] **"Vyapar alternative" comparison pages.** Large South Asian search volume, and you have real differentiation. The blog system already exists.
- [ ] **LTD communities** — Facebook groups and subreddits for lifetime-deal buyers. This is where self-listed partners actually drive their sales.
- [ ] **Other LTD marketplaces** — DealMirror, PitchGround, Dealify. Check the "lower than anywhere" rule before pricing anywhere below AppSumo.

---

# Suggested order

| When | Do |
|---|---|
| **Today** | D1 and D2 decisions. Section 1 (run the tests) |
| **This week** | Sections 2, 3, 7, 8 — baselines, secrets, pricing, images |
| **Next week** | Section 4 (schema), 9, 10, 11 — copy, founder, listings |
| **Week 3** | **Submit the listing.** Launch the invoice scanner |
| **Week 4** | Sections 5 and 6 — production drill and ops, during AppSumo's review |
| **Week 5+** | Product Hunt, comparison posts, LTD communities |

Submitting in week 3 is realistic. The review period is the right time to do the production drill, since approval does not depend on it but launch day does.

---

# Last thing

Your Q&A section is your real sales page, and **AppSumo reviews never expire**. On self-listing, where they send you no traffic, your responsiveness and your reviews are close to the only things driving conversion. Founders who answer every question personally within hours average 4.8+. Those who let questions sit average 3.

Block that time before launch day, not after.

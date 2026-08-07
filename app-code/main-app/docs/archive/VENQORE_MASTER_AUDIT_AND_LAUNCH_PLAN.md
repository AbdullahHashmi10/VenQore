# VENQORE — MASTER AUDIT & LAUNCH PLAN

**Session date:** Friday, 2026-07-03 (Day 1 of the calendar in §4)
**Auditor:** Fable 5 forensic session — read-only, every claim re-verified in code or explicitly tagged 🟡 UNVERIFIED
**Product status:** Built, deployed to venqore.com (live, serving), **not launched** — zero web footprint, no known paying customers
**Companion files:** `00_SYSTEM_MAP.md` (inventory) · `PROGRESS.md` (coverage log + P0 verdicts)

---

# 1. 🚨 EXECUTIVE SUMMARY

## The single most important finding

**Your product is better than your paperwork says — and your paperwork is what's blocking you.** The June forensic audit's 41/100 was real, and so is the recovery: I independently confirmed the money engine (single writer, locked FIFO with deterministic `seq`, retired second calculator, capstone reconciliation gate) and the recorded 636-passed/0-failed run of 2026-06-30. The remaining danger is concentrated in exactly two places:

1. **The revenue path has never carried a real dollar.** Lemon Squeezy webhook → signature middleware → `ProvisionTenantJob` → plan limits → `PlanGate` is all wired in code (verified), but nobody has watched one live purchase complete the chain. Every add-on you sell (WooCommerce sync, all AI tiers) depends on env-configured variant IDs matching (`ProvisionTenantJob.php:121–129`) and a tenant-JSON key flip that has a documented history of key-name mismatches in this codebase.
2. **The pricing page still makes two promises the backend breaks.** `Pricing.jsx:884` sells Profit & Loss to Starter and `:878` sells Bank Reconciliation to Starter; the seeder locks both for Starter (`PlanFeatureMatrixSeeder.php:215,188`). For a product whose entire brand is "the books are always right," shipping a pricing table that lies is self-refuting — and it is a refund/chargeback machine.

Neither takes more than a day. **You are roughly one focused week from a launch that won't embarrass you — the bottleneck is no longer engineering, it is verification + distribution.** Stop polishing. Verify the money path, fix the five findings below, and spend every remaining hour of July on getting seen.

## Top issues ranked (severity × impact × likelihood ÷ effort)

| # | Finding | Class | Launch safety | Speed to 100 | Effort |
|---|---|---|---|---|---|
| 1 | Pricing table promises Starter P&L + Bank Rec that backend locks (`Pricing.jsx:878,884` vs `Seeder:188,215`) | 🚨 Critical | **Yes** | High | 30 min |
| 2 | Real-money Lemon Squeezy chain never executed end-to-end (incl. every add-on variant ID) | 🚨 Critical (verification) | **Yes** | High | ½ day manual |
| 3 | SEC-1: factory-reset/admin passcode stored & compared in **plaintext** (`SystemResetController.php:37–38,59–60,187–188`) — gates data destruction | 🚨 Critical | **Yes** | Low | 2–3 h |
| 4 | `config/plans.php` still disagrees with the live seeder (growth SKU `null`=unlimited vs 10,000; business staff/locations `null` vs 50/10 — seeder values verified at `Seeder:144,163,260`), while its header falsely claims to be the source of truth — and `Tenant::setPlanAttribute` (`Tenant.php:328–336`) really does write `config('plans.ltd_*')` into tenant JSON on LTD assignment (3rd in the resolution chain, the same JSON AppSumo stacking uses). Any `config()` reader inherits the wrong caps | ⚠️ Deceptive Asset | Yes (consistency) | Medium | 2–4 h |
| 5 | `featuresArray()` fail-open: unknown keys default **unlocked** (`Tenant.php:298–308`); `recurring_invoices` gates on the `invoice_reminders` key (:302), `fund_management` on `bank_reconciliation` (:304) | ⚠️ Deceptive Asset | No (today) | Medium | 1–2 h |
| 6 | Loyalty points never awarded at checkout — `awardPoints` only callable manually (`GrowthEngineController:281`); sold as a feature | 🚨 Critical (if sold) | Yes | Medium | 2 h |
| 7 | `transactions_per_month` = `null` for ALL subscription plans (`Seeder:259`) — the F17 cap you built fires only for LTD (500/2000/6000, `:313–315`). Decide: intentional or bug | ⚠️ | No | Medium | 1 h decision |
| 8 | Landing page is a client-rendered empty shell to crawlers (verified live 2026-07-03) + no `llms.txt` + zero web footprint | ⚠️ Growth-critical | No | **High** | 1–2 days |
| 9 | AppSumo public routes hidden by a **hardcoded** toggle (`web.php:647`) — launch-day flip is a code deploy, not a switch | 🟡 | No | Medium | 30 min (env-drive it) |
| 10 | 3× `dangerouslySetInnerHTML` (`VenaTickets.jsx:362`, `NotificationCenter.jsx:134`, `StaffAttendance/Show.jsx:119`) — XSS review needed 🟡 UNVERIFIED data flow | 🟡 | Maybe | Low | 2 h |
| 11 | Mass-assignment surface: 49 models `$guarded = []`; `ProductAttributeController:26,39` passes raw `$request->all()` | ⚠️ | No | Low | 1 h |
| 12 | 15 raw aggregates in `AdminController` bypass the one-engine promise (D1, confirmed still present) | ⚠️ | No | Low | 1 day |
| 13 | Shipped backup files inside `Pages/` (`LandingPage.backup-20260628-100044.jsx` 59 KB, `LandingPage.jsx.bak`, `About.jsx.bak.*`, `Features.jsx.bak`) — `.jsx` backups are bundle-eligible | 🟡 Hygiene | No | Low | 15 min |
| 14 | All terminals share sequence register `R1` (`SequenceService.php:38–40`) — correct but serializes checkout per store under load | 💎 fine for launch / ⚠️ at scale | No | None now | later |
| 15 | Secrets in local `.env` (15 key-bearing entries) need rotation at launch; prod env state 🟡 UNVERIFIED (no server access) | 🚨 process | **Yes** | Low | 1–2 h |

Items your prior docs list that I verified as **already closed** (do not spend time on): PlanUsageBanner mounting (`OneGlanceLayout.jsx:1235`), `V3\ReportService` retirement (comments only remain), "38 reports" copy remnants, returned-quantity return cap (migration 2026-06-20), FIFO determinism + locking, invoice-number locking, LS/Woo/Pusher webhook signatures, platform-HQ 404-cloaking middleware with inactivity timeout, login rate limiting, `.env` untracked in git, clean working tree.

---

# 2. COVERAGE LOG (honesty first)

Full detail in `PROGRESS.md`. In one paragraph: I read the claims (94 root MDs, 6 deep), then re-verified every load-bearing claim directly in code at file:line level — the money engine, tenancy scoping (90/120 models via `HasTenant` global scope), plan-gating resolution chain, webhook security, the seven "still open" P0s from the 2026-07-02 Bootstrap plan (verdicts: 3 still open, 3 closed, 1 manual), and the live site. I could **not** run the test suite in this sandbox (no PHP/MySQL) — confidence in "tests green" rests on `Tester/dashboard/last-results.json` (16 recorded runs; newest 2026-06-30 21:47 = 636 passed/0 failed, exit 0) plus a clean git tree; **re-run it today and keep the screenshot**. Not reached: XSS data-flow into the three `dangerouslySetInnerHTML` sites, 100k-row load test, per-report number re-derivation, prod server env, route-by-route walk of all 181 controllers. Where prior audits found things I didn't re-check this pass, I say so explicitly.

---

# 3. FINDINGS BY DOMAIN (the 14 review areas)

## 3.1 Architecture & codebase health — ✅ ship it, don't rewrite

**Verdict: Gold Standard core with cosmetic debt.** Laravel 12 monolith, 52 services, thin-ish controllers, money isolated in `Services/V3/`. The dual-engine era (two SaleControllers/FifoServices — D4) is contained by guard tests; acceptable month-2 debt.
- ✅ **Gold Standard:** the audit→instruction→test→verify→commit loop captured in your own MDs. This discipline is *why* 41→87 happened. Keep it.
- ⚠️ Repo hygiene: backup `.jsx` files shipped inside `resources/js/Pages/` (bundle-eligible; finding #13). Also stray root folders (`temp_extract/`, `scratch/`, `new landing page/`, `VYB Restore/`) — move out of the deployable repo or `.gitignore`.
- 🟡 UNVERIFIED: `amd-station/`, `amd_erp_mobile/` subprojects not reviewed.
- **Fix-now:** none blocking. Effort: 15 min for #13. Launch safety: No · Speed-to-100: Low.

## 3.2 Multi-tenant isolation — ✅ strong architecture, one seam to watch

- ✅ `HasTenant` global scope + auto-stamp (`app/Traits/HasTenant.php:50`) on **90/120 models**, including every core money model I checked (Product, Stock, Transaction, Party, JournalEntry, Sale, Account, Setting, TransactionAllocation).
- ✅ Store context: `/s/{store_slug}` groups behind `['auth','verified','tenant',DemoMiddleware]` (web.php:76–79,521–523 per prior audit; group structure confirmed).
- ✅ **Gold Standard — Platform HQ cloaking:** `SuperAdminMiddleware` returns **404, not 403**, to unauthenticated *and* authenticated non-admins (no existence oracle), plus 30-min inactivity logout. This answers the master-prompt's timing/error side-channel question at the design level.
- ⚠️ The 30 unscoped models: most are platform-level by design (Plan, Coupon, Tenant…), but I did not verify all 30. 🟡 Run `php artisan tenants:audit` (exists per your Testing Guide) as a launch gate; `audit_final.md` (June) was a full query-level sweep — re-run its REVIEW rows after recent commits.
- ⚠️ Prior fix M1-EX1 (stale membership resolution) — fixed, but add the concurrent mixed-tenant smoke test before real multi-tenant traffic (C3 of Consistency audit).
- **Launch safety: Yes (gate on tenants:audit green) · Effort: 1–2 h.**

## 3.3 Financial & accounting integrity — ✅ your crown jewel (verified again)

- ✅ Single writer `V3\AccountingService::createEntry` with row locks (:176); derived `accounts.balance` (accessor), 2dp boundary/4dp intermediate (per `BalanceConsistencyTest` design); `SingleWriterGuardTest` bans raw journal writes.
- ✅ FIFO: `V3/FifoService.php:52–53` — `orderBy('seq')` tiebreaker **present** + `lockForUpdate`. Golden transaction (COGS 800/GP 1800) is institutionalized in `CalculatorParityTest`.
- ✅ Returns: `returned_quantity` cap migration exists (F1 fixed); POS returns idempotent (M1-09, per Build Log — not re-derived this pass 🟡).
- ✅ One read engine: `V3\ReportService` gone from code paths (`NoSecondCalculatorTest` guards it); capstone `Heart/OneCoreReconciliationGateTest` exists.
- ⚠️ **D1 still open:** `AdminController` retains ~15 raw `DB::table/sum/count` aggregates → an admin screen can contradict the engine. Not customer-facing money, but it's your brand promise. 1 day, post-launch week 2.
- ⚠️ Report-count copy now "40" — verify once against `php artisan route:list` and freeze the number.
- 🚨 **No floating-point sweep this pass** 🟡: prior audits enforced DECIMAL casts; I did not re-grep every money column. 30-min spot check: `grep -rn "float" app/Models app/Services/V3`.
- **Launch safety: Yes (already earned) · the engine is the thing you SELL.**

## 3.4 POS transactional reliability — ✅ correct under concurrency, one throttle point

- ✅ Duplicate invoice numbers impossible under concurrency (`SequenceService` lock, unique `reference_number` backstop). Oversell blocked by locked FIFO deduction. LS webhook provisioning idempotence 🟡 UNVERIFIED — test double-fire of `order_created` during the live test (§4 Day 3).
- ⚠️ **C2:** every terminal defaults to register `R1` (`SequenceService.php:38–40`) → one hot row per store serializes concurrent checkouts. Fine ≤3 tills; fix by wiring `terminal_id` → `register_id` when you land a multi-till customer (2–4 h then).
- 🟡 Offline Dexie sync conflict matrix (two offline tills selling the same last unit) — no test found for reconciliation-on-reconnect ordering. Add to week-2 list.

## 3.5 Application security — mostly hardened; three real items

- ✅ Verified good: LS webhook HMAC middleware (`bootstrap/app.php:39`, `api.php:36`); Woo webhook `hash_equals` (`WooWebhookController:99–117`); Pusher `hash_equals`; Breeze `LoginRequest` RateLimiter; email-verify throttles (`auth.php:50,54`); `.env` untracked; platform HQ cloaked; demo isolated via `DemoMiddleware` + auto-logout (web.php:610).
- 🚨 **SEC-1 (finding #3): plaintext admin passcode.** `Admin/SystemResetController.php` — `Setting` key `admin_passcode` compared with `===` at :38, :60, :188; it gates **factory reset** (destructive) and bypass paths. Anyone with DB read access (backup leak, support laptop) owns every store's reset code. **Fix:** store `Hash::make`, compare `Hash::check`, rate-limit the endpoint, audit-log attempts. 2–3 h. Launch safety: **Yes**.
- ⚠️ Mass assignment (finding #11): 49 models `$guarded = []`; two raw `$request->all()` writes in `ProductAttributeController:26,39`. `HasTenant` auto-stamp mitigates cross-tenant writes, but `id`/FK injection remains. Cheap fix: `$request->validate([...])` on those two; longer-term lint rule.
- 🟡 XSS (finding #10): three `dangerouslySetInnerHTML` sites; if any renders user/customer-supplied strings (chat/tickets/notifications DO), one stored-XSS in platform-admin context = catastrophic. 2 h: DOMPurify or strip to text.
- 🚨 process: **rotate every marketplace/API secret** currently in dev `.env` (15 key-bearing entries; your own HANDOFF §6 says the same) before first outsider traffic; confirm prod `APP_DEBUG=false` (🟡 no server access).
- Not re-audited this pass 🟡: file uploads, SSRF surface in Woo/LS API clients, session fixation, per-route authorization sweep (your `Role_Access_Problems_Report.md` + T4.x commits suggest recent hardening — commit `6357fa2`).

## 3.6 Performance & cloud cost — adequate for first 100

- ✅ Prior N+1/index passes recorded (F11 was a false positive per `Road_To_100`); page-health suites exist (Module01–21). ✅ Vite build present.
- ⚠️ **VNQ-080 still true: nothing run at 100k–1M rows.** Do the seeded load test before your biggest LTD buyer does it for you (½–1 day, week 3).
- ⚠️ `QUEUE_CONNECTION=sync` in local env; prod must run the DB queue + supervisor (configs exist in `deploy/supervisor/` ✅) — verify Horizon/worker alive on the droplet (🟡).
- 💰 Cost: single-server MySQL monolith = fine. Watch dompdf memory on big exports.

## 3.7 UX, time-to-value & visual credibility

Not re-walked this pass (see `Master_Roadmap_87_to_100` Parts 1–2 — its VNQ-030/034/042/050 items stand). What I re-verified: onboarding wizard, demo store, and PWA exist and are routed. **The one UX item that gates revenue:** the **demo store** (`/demo` live, `DemoController`, reset commands, analytics — Bootstrap's claim confirmed at route level) is your best conversion asset; make it the primary CTA everywhere. The rest (design tokens, toasts, skeletons, ⌘K) is post-launch polish — do NOT block launch on it.

## 3.8 Public website conversion — the real gap

- 🚨 **Finding #8 (verified live):** `https://venqore.com` serves an SEO-empty client-rendered shell — a cold crawler (and several AI crawlers) see effectively nothing. Title is just "VenQore POS".
- Fixes in priority order (1–2 days total): (a) server-render or prerender the marketing routes (Inertia SSR, or a static prerender step for `/`, `/pricing`, `/features`, `/demo`); (b) unique `<title>`/meta/OG per marketing page; (c) put the three-second answer in real HTML: what it is, who it's for, proof ("636 automated tests green", "double-entry, to the cent"), one CTA = **Try the live demo**; (d) pricing page truth fix (#1) is also a conversion fix.
- Trust signals to add cheaply: security page (backups, tenancy isolation, your reconciliation gate), founder story, refund policy (page exists behind the AppSumo toggle — publish it).

## 3.9 Pricing — decide two things, then freeze

- Structure (Starter/Growth/Enterprise + LTD tiers + AI & sync add-ons) is right for AppSumo-first GTM. Caps on the **seeder side** are coherent (1/3/10 locations · 3/10/50 staff · 1k/10k/50k SKUs) and the pricing-table *limits rows now match the seeder* (verified `Pricing.jsx:850–853`).
- 🚨 Fix the two feature-row lies (#1). ⚠️ Decide `transactions_per_month` for subscriptions (#7): my recommendation — **leave subscriptions unlimited** (simpler promise, LTD keeps caps as designed 500/2000/6000) and delete the config numbers so no code path resurrects them.
- ⚠️ A6 (prior finding, not re-checked this pass 🟡): LTD $79 vs $36/mo Starter pays back in ~2.2 months — that's fine **as a deliberate AppSumo loss-leader with the transaction cap as the ceiling**; it's a problem on your own site. Consider site LTD at higher price than AppSumo (AppSumo exclusivity optics), or cap site LTD availability.
- International willingness-to-pay: $36/63/129 sits well under Lightspeed/Shopify POS tiers — good wedge pricing; don't discount further. (Verify competitors' current prices before quoting them in copy 🟡.)
- Kill "Enterprise (marketing) vs business (slug)" naming split when convenient (A7).

## 3.10 Technical SEO

- ✅ robots.txt allow-all + sitemap link; sitemap route + `SitemapTest`, **confirmed serving on prod**.
- 🚨 Rendering (see 3.8) is the whole ballgame. Then: canonical tags, per-page meta, OG/Twitter cards, schema (§3.11), internal links from blog → feature pages. Core Web Vitals after prerender will likely pass (static shell). hreflang: skip until a second language actually exists.

## 3.11 GEO/AEO — you are currently invisible to AI (verified)

- Searched: "VenQore" has **zero** footprint. No `llms.txt` (verified absent). AI crawlers: robots.txt allow-all = permitted, but there's nothing server-rendered to read.
- Do (½ day, after prerender): publish `public/llms.txt` (what VenQore is, who it's for, feature list, pricing link, demo link); JSON-LD `SoftwareApplication` + `Organization` + `FAQPage` on marketing pages; make every page answer-shaped (first two sentences = liftable claim).
- Content that earns AI citations (Phase 3): "VenQore vs Loyverse / vs Vyapar / vs Square for multi-store", "best POS with double-entry accounting", "offline-first POS", glossary pages (FIFO, double-entry for shopkeepers).
- Check prompts (run monthly in ChatGPT/Perplexity/Gemini): "best POS with built-in double-entry accounting for a small retail chain"; "offline-first POS that syncs to WooCommerce"; "Vyapar alternative with multi-store and real accounting"; "POS lifetime deal 2026". Today you will not appear; after llms.txt + comparison pages + AppSumo/PH listings, re-test.

## 3.12 AI features — audit before you advertise

- Built surfaces found: SmartCapture (`SmartCapture/SmartCaptureController`, gated `PlanGate::enforce('smart_capture')`), support chatbot stack (controllers + routing service per Bootstrap, `AgentChatController`, `VisitorChatController`), AI assistant reading the one engine (C3.2 ✅).
- 🚨 Business risk first: **AI is the pricing page's headline, and all `ai_*` seeder flags are 0** — unlock happens only via add-on purchase → tenant JSON. That's the same unverified LS chain (#2). Do not advertise AI SKUs until the live add-on test passes.
- 🟡 Prompt-injection: SmartCapture feeds OCR/voice → Gemini extraction → internal matching; the *matching* being internal (FULLTEXT+Levenshtein) limits blast radius — but test a malicious invoice image ("ignore previous instructions…") before launch-week ends. Chatbot must have tenant-scoped retrieval only (not re-verified 🟡).
- Roadmap (post-100-customers, in order of value/effort): reorder suggestions from FIFO velocity (data already exists), cash-flow forecast from ledger, anomaly alerts (drawer variance, margin dips) — each is a report+threshold before it's "AI"; ship the deterministic version first, add models later. Skip generic chat expansions.

## 3.13 Blind spots (things you didn't ask about)

1. **Legal/compliance floor for international sales:** Terms of Service, Privacy Policy (GDPR-basics for UK/EU buyers), DPA-on-request, cookie notice, refund policy page live. Lemon Squeezy as Merchant-of-Record covers VAT/sales tax — one reason to keep it. 1 day with templates; do before AppSumo.
2. **Disaster recovery as a practiced drill, not a feature:** you built VenSynQ/Drive backups — but do one full restore-to-clean-server drill and time it (your Testing Guide lists it; nobody's logged doing it).
3. **Monitoring/alerting:** no Sentry/uptime found in env keys 🟡 — add Sentry (free tier) + UptimeRobot + LS webhook failure alerts before launch; you cannot afford silent checkout breakage.
4. **Support surface for a solo founder:** set expectations (24–48 h email), canned responses (`CannedResponse` model exists ✅), a public status page (free: Instatus/BetterStack).
5. **Timezone/currency defaults for non-PK tenants:** verify a fresh tenant created from the US gets sane TZ/currency defaults in onboarding (🟡 not checked).
6. **Backups of the PLATFORM DB itself** (tenants, licenses, codes) — off-server nightly dump + restore test.
7. **AppSumo code security:** ensure codes are single-use under concurrency (unique index + transaction on redemption) — `AppSumo/` tests exist, re-run them the day before launch.

## 3.14 First 100 international customers — see §5 (the concrete plan)

---

# 4. CALENDARIZED ROADMAP (Day 1 = Friday 2026-07-03)

Format per item: what → why → done-when. P0 = launch-blocking, P1 = launch-week, P2 = growth-blocking, P3 = scale.

## PHASE 1 — Critical launch protection (Fri Jul 3 → Fri Jul 10) — all P0/P1

**Fri Jul 3 (today) — the truth-in-pricing day (~4 h of edits)**
- P0 · Fix `Pricing.jsx:878` (Bank Reconciliation) and `:884` (P&L) → `starter={false}`, or move both to `starter={true}` in the seeder if you'd rather give Starter P&L (my call: give Starter P&L — it's your signature capability and the #1 activation hook; keep Bank Rec at Growth+). Done-when: page matches seeder line-by-line.
- P0 · Reconcile `config/plans.php` with the seeder (growth `sku_limit` 10000, business staff 50 / locations 10) **and** fix the false "single source of truth" header — `Tenant::setPlanAttribute` (`Tenant.php:328–336`) writes `config('plans.ltd_*')` into tenant JSON on every LTD assignment, so the config file is still live code, not documentation. Done-when: `diff` of the two matrices is empty + comment corrected.
- P1 · `featuresArray()` fail-closed (`Tenant.php:298–308`): unknown key ⇒ locked; give `recurring_invoices` and `fund_management` their own keys (seed them). Done-when: new unit test proves unknown key = false.
- P1 · Delete shipped backups: `Pages/LandingPage.backup-20260628-100044.jsx`, `LandingPage.jsx.bak`, `Marketing/About.jsx.bak.*`, `Marketing/Features.jsx.bak`; add `*.bak*` to `.gitignore`. 15 min.
- P0 · Re-run the full suite (`Tester/dashboard/launch.bat`), screenshot the green run. Done-when: ≥636 passed / 0 failed recorded today.

**Sat Jul 4 — security half-day**
- P0 · SEC-1: hash `admin_passcode` (`Hash::make` on save, `Hash::check` at `SystemResetController.php:38,60,188`), add `throttle:` + audit-log on those endpoints, write a migration hashing existing values. Done-when: no plain `===` compare remains (`grep -rn '=== \$passcode\|!== \$passcode' app/` empty) + test.
- P1 · `ProductAttributeController:26,39` → validated fill. P1 · Review the 3 `dangerouslySetInnerHTML` sites; sanitize (DOMPurify) or render as text.

**Sun Jul 5 — buffer / legal**
- P1 · ToS + Privacy + Refund pages live (template-based); publish `refund-policy` (already routed behind the AppSumo toggle).

**Mon Jul 6 — the real-money day (the single most important day of the plan)**
- P0 · **Live Lemon Squeezy test on production:** one subscription, one LTD, one WooCommerce add-on, one AI add-on. Watch: webhook 200 → `ProvisionTenantJob` → `plan_limits` → gated route flips 403→200 (`/woo/connections`, AI surface). Fire the same webhook twice → no duplicate tenant/credit (idempotency). Done-when: a written log of each hop with IDs.
- P0 · Rotate every secret in `.env` (15 keys) on the server; confirm prod `APP_DEBUG=false`, queue worker + scheduler alive (`supervisorctl status`).
- P1 · Sentry (free) + UptimeRobot on `/` and `/health` + LS webhook-failure alert email.

**Tue Jul 7 — AppSumo mechanics**
- P0 · Redeem a test AppSumo code end-to-end on prod; concurrency-safe single-use (two parallel redeems of one code → one winner). Push a Code-1 tenant to sale #501 → blocked with the right message (the Bootstrap gate).
- P1 · Wire loyalty award into the sale-posting path (`LoyaltyBalance::awardPoints` after successful post, gated on `growth_engine`), or strip loyalty from `Pricing.jsx:845` until wired. Done-when: a posted sale credits points in a test tenant, and `OneCoreReconciliationGate` still green.

**Wed Jul 8 — isolation & recovery drills**
- P0 · `php artisan tenants:audit` green; role walkthroughs (Owner/Manager/Cashier/Viewer) from `V1_Testing_Checklist`.
- P0 · Full backup → restore-to-clean drill, timed, numbers reconciled. P1 · Demo-store walkthrough as an anonymous visitor; mobile pass at 375px.

**Thu Jul 9 — decisions & freeze prep**
- P1 · Decide `transactions_per_month` for subscriptions (recommend: unlimited; delete config numbers). Env-drive `$hideAppSumoPublic` (`APPSUMO_PUBLIC=true|false`) so launch is a toggle, not a deploy. SmartCapture prompt-injection probe (malicious invoice image).
- P0 · Full suite green again → `git tag v4.3.0-launch`.

**Fri Jul 10 — LAUNCH GATE.** Walk `VenQore_PreLaunch_Checklist.md` top to bottom. Anything red stops the clock. Otherwise: you are allowed to sell from this day on.

## PHASE 2 — Conversion & discoverability (Sat Jul 11 → Fri Jul 24) — P2

- Jul 11–13 · **Make the site readable by machines:** prerender/SSR the 6 marketing routes; unique title/meta/OG each; hero rewritten to pass the 3-second test (what/for-whom/proof/CTA=live demo). This is the highest-leverage growth engineering in the whole plan.
- Jul 14 · `public/llms.txt` + JSON-LD (`SoftwareApplication`, `Organization`, `FAQPage`) + an answer-shaped FAQ page.
- Jul 15–16 · **Listings blitz (free):** G2, Capterra/GetApp/Software Advice, AlternativeTo, SaaSHub, Product Hunt "upcoming" page, IndieHackers product, Crunchbase. Same 90-second demo video everywhere (record once, Loom).
- Jul 15 → · **Submit to AppSumo** (Marketplace listing per your `AppSumo_Decision_Document` model; approval takes days–weeks — submit early, sell direct meanwhile).
- Jul 13–24 · **Outbound starts** (see §5 daily calendar) — do not wait for AppSumo.
- Jul 17–24 · First 3 content pieces: "VenQore vs Vyapar (for stores that need real accounting)", "VenQore vs Loyverse", "Offline-first POS with double-entry: how it works". Each answer-shaped, each linking the demo.

## PHASE 3 — International growth engine (Sat Jul 25 → Fri Aug 21) — P2

- AppSumo campaign live when approved (drive its Q&A hard — answer every question within hours; that's how deals rank). Product Hunt launch mid-window (Tue/Wed, demo-store link as the hook).
- Outbound at 15–20 touches/day, 5 days/week (§5 scripts). 2 content pieces/week. Monthly AI-surfacing test (§3.11 prompts).
- Code track (≤1 day/week): D1 AdminController → engine (with `NoSecondCalculatorTest` extension); 100k-row load test; offline-sync conflict test; concurrent mixed-tenant smoke test.

## PHASE 4 — Intelligent scale (Sat Aug 22 → Wed Sep 30) — P3

- Polish wave from `Master_Roadmap_87_to_100`: design tokens → toasts → skeletons/empty states → ⌘K.
- Multi-terminal `register_id` (kills the R1 hot row) when the first multi-till customer lands.
- AI v1 that's actually yours: reorder suggestions from FIFO velocity + cash-flow forecast from the ledger (deterministic first, model later).
- Case studies from first LTD users; "VenQore vs X" pages #4–8; consider Woo plugin-directory listing for the sync as a distribution channel.

---

# 5. FIRST 100 INTERNATIONAL CUSTOMERS — ZERO AD BUDGET

**Positioning (use everywhere, verbatim):** *"The POS that keeps real books. Offline-first point of sale with verified double-entry accounting built in — every sale, return, and rupee/dollar reconciles to the cent. Try the live demo, no signup."*

**Why you can win:** nobody at your price point has auditor-grade books (Loyverse/Square = no real accounting; QuickBooks POS is dead; Lightspeed starts ~3× your price). Your proof is unusual and real: a reconciliation test gate and 636 green tests. Sell the proof.

## Ideal customer profiles (in priority order)
1. **ICP-A — Diaspora-corridor independent retail** (UK, UAE, Canada, US): ethnic grocery/convenience/mobile-accessory stores, 1–3 locations, 2–10 staff, cash-heavy, currently on Vyapar-class apps or nothing. You speak their language literally and operationally (khata/udhaar, offline reality). Reachable via WhatsApp groups, community FB groups, and walking distance of any "X Cash & Carry".
2. **ICP-B — WooCommerce merchants with a physical counter** (global, English): the sync + one-ledger story. Reachable in Woo FB groups, r/woocommerce, Woo Slack communities.
3. **ICP-C — Bookkeepers/accountants serving small retail** (UK/CA/AU): one convert = many stores. Angle: "your retail clients' POS finally produces books you can trust." Reachable on LinkedIn.

## The five tactics (only five — you'll actually do these)
1. **AppSumo LTD** — your infrastructure for this literally already exists (codes, caps 500/2000/6000, redemption, upgrade path). Expected: 30–60 customers. Action: submit Jul 15; while pending, sell the same LTD direct via Lemon Squeezy to communities (creates the "already selling" proof AppSumo likes).
2. **The live demo as the salesperson** — every message, listing, and page ends with the demo link (no signup). Expected: it converts the other four tactics. Action: instrument it (you built visitor analytics) and watch which screens sell.
3. **Cold outreach, 15–20/day** — LinkedIn (ICP-C) + email/WhatsApp (ICP-A) + community DMs where rules allow (ICP-B).
   - *ICP-A script (WhatsApp/email):* "Hi [name] — I build VenQore, a POS made for stores like [store]. It works with no internet at the till and keeps proper double-entry books automatically (bank-reconciliation-grade, not just sales totals). 2-min demo you can click around, no signup: venqore.com/demo. If it fits, first 3 months on me for your feedback."
   - *ICP-C script (LinkedIn):* "You do the books for retail clients — what POS do they hand you data from? I built one where the POS *is* the ledger: double-entry under every sale, FIFO COGS, trial balance always zero. Live demo: … . Would 15 minutes be worth it if it cut your cleanup time per client?"
4. **Listings + launch platforms** — the Jul 15–16 blitz plus Product Hunt in Phase 3. Expected: 15–30 combined, plus the backlinks that make GEO work.
5. **Answer-shaped comparison content + llms.txt** — 2/week from Jul 17. Expected: slow until it isn't; this is what makes ChatGPT/Perplexity recommend you in month 2–3.

**Deliberately NOT doing:** paid ads, cold calling, conferences, building new features to win deals, custom enterprise deals (per your Launch Strategy: quote $299+/mo and walk away happy either way).

## The first two weeks of outbound, exactly
- **Mon Jul 13:** List 100 ICP-A stores (Google Maps: "cash and carry / mini market" in 3 UK + 2 UAE + 2 CA cities) with WhatsApp/email. Send 15.
- **Tue Jul 14:** 15 more + join 5 Woo/retail FB groups & r/woocommerce (contribute, don't pitch, 1 week).
- **Wed Jul 15:** 15 ICP-A + 10 ICP-C LinkedIn connects (no pitch in connect note).
- **Thu Jul 16:** 15 ICP-A + follow-ups day-3 cadence. **Fri Jul 17:** 15 + 10 ICP-C messages to accepted connects.
- **Week 2 (Jul 20–24):** same daily volume; add 5 genuinely helpful community answers/day (each footer-linking demo); Thu: first "build in public" post (IndieHackers/LinkedIn): "I wrote 636 tests before taking my POS to market — here's the reconciliation gate that proves the books." That post *is* your differentiator.
- **KPIs weekly:** sends → demo sessions → trials/redemptions → activated (first 10 real sales) → paid. Fix the worst ratio each Friday.

**Honest cash-flow note (you said this month matters):** AppSumo pays out slowly (typically ~60 days after month-end) and approval isn't instant. **Fastest real cash = direct LTD/subscriptions via Lemon Squeezy starting Jul 10–13** — LS pays out on a rolling basis. Ten direct LTDs at $79 is $790 gross within the month; twenty ICP-A monthlies at $36 compounds from August. Plan your personal runway on direct sales, treat AppSumo as the Q3 wave.

---

# 6. IF VENQORE WERE MY COMPANY — THE UNFILTERED 90 DAYS

**Days 1–7 (Jul 3–10):** Exactly Phase 1. I would not write one line of new-feature code. The only deliverable is *proof*: money moved, code redeemed, restore drilled, suite green, pricing page telling the truth. I'd also make one emotional decision now: **the launch date is Jul 13, and it is not moving.** Solo founders die in the gap between 87 and 100 — you have a 636-test moat; Square launched with less.

**Days 8–30 (Jul 11–Aug 1):** Sell direct before platforms bless you. 20 outbound/day like a job, because it is one — your only job title this month is "distribution." Site made machine-readable in week one of this window. First 10 customers get me on WhatsApp personally; their feature requests go to a list I do NOT build from yet — I'm buying testimonials and case studies with service, not code. Target: **10–15 paying tenants, first $500–1,500.**

**Days 31–60 (Aug):** AppSumo live (assuming approval) — I'd answer every question within 2 hours for the first two weeks; that responsiveness, not the deal terms, is what ranks deals. Product Hunt in here too. Content flywheel steady at 2/week. Code budget: 1 day/week max (D1, load test, the register fix if a multi-till buyer appears). Target: **cumulative 40–60 customers.**

**Days 61–90 (Sep):** Double down on whichever of the five tactics produced the cheapest customer — kill the worst two without sentiment. First case study published ("How [store] closes their books in 4 minutes every night"). Raise direct-site LTD price (scarcity is honest: AppSumo allocation is capped). Start the deterministic "AI" (reorder suggestions) only if ≥5 customers asked. Target: **cumulative 80–120 — first 100 is realistic by early October, and the *quality* of them (LTD-heavy) funds nothing, so the real KPI I'd manage is monthly subscription count ≥25 by Day 90.**

**The three things I'd refuse to do:** (1) another audit document — this one closes the loop; the next artifact must be a customer; (2) any new module before 25 subscribers; (3) competing on price below $36 — your story is trust, and trust doesn't discount.

**The one risk I'd lose sleep over:** a silent breakage in the purchase→provision chain while I'm asleep in a different timezone than my customers. That's why Jul 6 (live-money test + Sentry + uptime + webhook alerts) is the most important day in this file.

---

*Written 2026-07-03. Every file:line in this document was read directly this session unless marked 🟡 UNVERIFIED. Verification verdicts for the prior plan's P0 list are in `PROGRESS.md`; raw inventory in `00_SYSTEM_MAP.md`.*

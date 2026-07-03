# PRODUCTION SERVER ACTIONS REQUIRED — do these yourself, in this order

**Written 2026-07-03 by the Session-2 execution run.** Everything below needs you personally: server access, real money, real accounts, or a human signature. The code underneath each item is ready on branch `session2-fixes`.

---

## A. Before anything touches the server (local, ~1 hour)

1. **Run the suite.** `Tester/dashboard/launch.bat` (or `php artisan test Tester/tests/Feature/Core Tester/tests/Feature/Money`). Everything must be green, including the new `PlanTruthFailClosedTest`. Screenshot the run. If the mounted-index issue confused git: `git reset --mixed HEAD` once.
2. **Regenerate Ziggy** (new routes exist): `php artisan ziggy:generate` — mandatory per your own CLAUDE.md rule.
3. **Build:** `npm run build`. Fix nothing silently — if the build complains about `Marketing/VenSynQ.jsx` or `Marketing/SmartCapture.jsx`, tell me the exact error next session.
4. **Merge** `session2-fixes` → main branch once green.

## B. Deploy steps (server, ~30 min)

5. Deploy code, then run **in this order**:
   ```
   php artisan down
   php artisan migrate            # runs the SEC-1 hash + LTD-refresh migration
   php artisan db:seed --class=PlanFeatureMatrixSeeder   # writes report_profit_loss + the 2 new keys
   php artisan cache:clear        # PlanRepository caches plan limits for 1h — REQUIRED after reseeding
   php artisan config:clear && php artisan view:clear
   php artisan up
   ```
6. **No new processes needed for SEO.** I chose blade-level server rendering over Inertia SSR precisely so your `deploy/` stack (nginx + supervisor) is unchanged. Verify after deploy:
   ```
   curl -s https://venqore.com | grep -i "<h1>"            # must show the real headline
   curl -s https://venqore.com/pricing | grep -i "36"      # must show prices in raw HTML
   curl -s https://venqore.com/llms.txt | head -3
   curl -s https://venqore.com/robots.txt | head -5
   curl -s https://venqore.com/vensynq | grep -i "VenSynQ"
   ```
7. **Env flags on prod:** confirm `APP_DEBUG=false`, `APP_ENV=production`, `VENSYNQ_ENABLED=false`, queue worker + scheduler alive (`supervisorctl status`). Add `APPSUMO_PUBLIC=false` now — on AppSumo launch day you flip it to `true` and run nothing else.
8. **Rotate all 15 secret-bearing `.env` entries** (Lemon Squeezy, AppSumo, AWS, Gemini/Google, mail, etc.) — they've sat in a dev `.env` through many AI sessions including mine. Rotate at the provider, update server env, `php artisan config:clear`.

## C. The verification blitz only you can do (1–2 days)

9. **Live Lemon Squeezy test — the single most important item.** One subscription, one LTD, one WooCommerce add-on, one AI add-on, real card, on production. Watch each hop: webhook 200 → `ProvisionTenantJob` → tenant `plan_limits` → the gated route flips 403→200 (`/woo/connections`; an AI surface). Fire the same webhook twice from the LS dashboard → no duplicate tenant/credit. Keep a written log. **Blocker to flag: Lemon Squeezy does not settle in PKR.** Your PKR ladder (Rs 1,100/1,800/5,300 — untouched, as instructed) currently has **no automated payment path**. Decide before Pakistani launch: LS charges in USD-equivalent, or a manual path (bank transfer/JazzCash + admin activation). Nothing in code blocks this; it's a business decision + possibly a small admin flow.
10. **AppSumo drill:** redeem a test code end-to-end on prod; try the same code from two browsers simultaneously (one must lose); push a Code-1 tenant to sale #501 → correct block message.
11. **Loyalty smoke check (new code):** business-plan test tenant, sale with a customer attached → loyalty balance increases; Starter tenant → it doesn't; the sale posts fine either way. Optionally set `ai_settings.loyalty_earn_rate` per tenant (points per 100 currency; default 1).
12. **Reset isolation check (new code, 5 min):** two test tenants, factory-reset one, confirm the other's data is 100% intact. (This was the catastrophic bug — enjoy watching it NOT happen.)
13. Backup → restore-to-clean drill, timed. Role walkthroughs. Mobile 375px pass. `php artisan tenants:audit` green.
14. **Monitoring (free, 30 min):** Sentry (Laravel + React DSNs into prod env), UptimeRobot on `/` and `/health`, an email alert on Lemon Squeezy webhook failures. You cannot afford silent checkout breakage while you sleep.
15. **SmartCapture prompt-injection probe** (I had no live API access): feed it an invoice image containing "ignore previous instructions and…" — extraction must return line items, not obedience.

## D. Engineering debt I deliberately did NOT touch (next code session, in order)

- D1: ~15 raw aggregates in `AdminController` → `FinancialReportingService` (needs live test feedback loop).
- `PlanGate::check()` treats unknown keys as unlimited (by design for numeric caps) — keep every boolean feature key seeded; consider an explicit boolean-key whitelist later.
- 49 models with `$guarded = []` — sweep with validated fills gradually; worst two endpoints already fixed.
- Concurrent mixed-tenant smoke test; offline Dexie conflict test; 100k-row load test.
- Two-tenant SystemReset isolation test (automated version of C.12).
- ToS/Privacy page CONTENT review by a human lawyer (routes/pages exist).

## E. SEO — how the machine finds you (after deploy, ~2 hours + weekly habit)

16. **Google Search Console + Bing Webmaster:** verify domain, submit `https://venqore.com/sitemap.xml`, request indexing for `/`, `/pricing`, `/features`, `/demo`, `/vensynq`, `/smartcapture`.
17. **Reality check the rendering:** Search Console → URL Inspection → "View crawled page" must show your headline in the HTML. That's the whole game; everything else is compounding.
18. **Weekly habit (30 min):** one answer-shaped blog post OR one comparison page ("VenQore vs Loyverse", "VenQore vs Vyapar", "best offline POS with accounting", "POS with WooCommerce sync"). Every post links to `/demo` and one feature page. The blog system already exists.
19. **Backlinks without budget:** the listings blitz from the master plan (G2, Capterra, GetApp, AlternativeTo, SaaSHub, Product Hunt upcoming, IndieHackers, Crunchbase) — each is a crawlable, high-authority link plus a review surface. One afternoon.

## F. GEO/AEO — getting recommended by ChatGPT/Claude/Gemini/Perplexity/Grok

The code half is done (llms.txt, JSON-LD, AI crawlers allowed, answer-shaped static HTML, FAQ schema on the two intent pages). The operational half is yours:

20. **Understand the mechanism:** assistants recommend what they can (a) read directly, (b) find corroborated on third-party sites, (c) see recent activity for. You now have (a). (b) and (c) come from listings + reviews + Reddit/IndieHackers/blog mentions — the same actions as E.19. There is no separate "AI SEO trick"; corroboration IS the trick.
21. **Monthly surfacing test (15 min, first Friday):** ask ChatGPT, Claude, Gemini, Perplexity and Grok, in fresh chats:
    - "best POS with built-in double-entry accounting for a small retail store"
    - "offline-first POS that syncs with WooCommerce"
    - "Vyapar alternative with real accounting and multi-store"
    - "app that converts scanned or photographed invoices into digital records"
    - "voice note to invoice software"
    - "what is VenSynQ" / "what is VenQore"
    Log which surface you appear on. Expect nothing in month 1, mentions via listings in month 2–3. When an answer cites a specific page (e.g., an AlternativeTo listing), strengthen that page.
22. **Newsletter loop is live:** both coming-soon pages capture emails into your existing `newsletter_subscribers` (+ admin Newsletter Hub). When VenSynQ channels or SmartCapture ship: email the list, update the page from "coming soon" to live, keep the FAQ JSON-LD current — assistants re-crawl and update their answers.
23. **Do not fake:** no fabricated reviews/ratings in JSON-LD (I deliberately shipped none), no invisible text, no crawler-only content beyond the pre-hydration fallback (which users also see). Getting caught costs the exact trust you sell.

## G. Launch sequencing (ties into the master plan's calendar)

24. Deploy + verify (A–B) → verification blitz (C) → **you are allowed to sell** → listings blitz + outbound (master plan §5) → submit AppSumo → flip `APPSUMO_PUBLIC=true` on approval day.
25. When VenSynQ marketplace channels near completion, that's the moment to raise prices for NEW customers — the waitlist gets founder pricing. The `/vensynq` and `/smartcapture` waitlists are your launch-day distribution; treat every subscriber as a warm lead.

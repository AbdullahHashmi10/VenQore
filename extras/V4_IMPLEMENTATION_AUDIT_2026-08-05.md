# VenQore — V4 Build Plan Implementation Audit & Launch Verdict

**Date:** 2026-08-05
**Audited against:** `VENQORE_TECHNICAL_BUILD_PLAN_V4.md` (1,210 lines, 10 phases, ~60 tasks)
**Method:** static verification of each task's named files, migrations, services, routes and acceptance criteria. No PHP runtime was available, so runtime-only acceptance criteria (load behaviour, token counts, cost reconciliation) could not be executed — those are marked **UNVERIFIABLE HERE** rather than passed.
**Companion document:** `TEST_FAILURE_ROOT_CAUSE_ANALYSIS_2026-08-05.md`

---

## VERDICT: NOT READY TO LAUNCH

**Overall completion: ~78% of tasks have code. ~62% have code that satisfies the plan's stated acceptance criteria.**

The build is much further along than the test run suggests — Phases 3, 6, 7, 8 and 9 are genuinely substantial. But the plan's own gating rules are being violated in three places, and there are **six launch blockers**, four of which are safety features that exist as code but are never called.

The recurring pattern across this audit: **a class was written, a migration was added, a test was made green — and the wiring that makes it actually run was never connected.** That is the most dangerous kind of incomplete, because every dashboard says done.

---

## Launch blockers (must fix before any paying customer)

| # | Blocker | Phase | Evidence |
|---|---|---|---|
| **B1** | `EnsurePlanFeature` redirects to `route('billing.index')`, which does not exist → **HTTP 500 on every plan-gated denial** in production. `PlanGate.jsx` calls the same missing name, so the upgrade wall itself crashes. | T3-1 | `app/Http/Middleware/EnsurePlanFeature.php:36`; route is named `billing` / `store.billing` at `routes/web.php:366` |
| **B2** | **All LTD tenants are silently demoted to starter-tier reports.** `setPlanAttribute()` destroys the tier; `ReportTierGate::tier()` reverse-maps from `transactions_per_month` using values (500/2000/6000) that the seeder no longer writes (1000/3000/8000). `array_search` returns `false`, a defensive default treats it as starter. | T4-1 | `Tenant.php:410`, `ReportTierGate.php:16-36`, `PlanFeatureMatrixSeeder.php:372-374` |
| **B3** | **`AiSpendGuard` has zero call sites.** The daily USD kill-switch — the thing standing between you and an unbounded Gemini bill — is written and never invoked. T0-0's `$3/day` visitor-chat cap and T7-2's `$10/day` public-tool cap do not exist at runtime. | T0-0, T0-7, T7-2 | `grep -rn "AiSpendGuard::" app/` → 0 results outside its own file |
| **B4** | **AppSumo hosting expiry and transaction caps are attached to the wrong route group.** `EnforceHostedUntil` + `lifecycle` sit on the group at `routes/web.php:335`; POS sales, reports, purchases and settings all live in a *second* group at `routes/web.php:970` that has neither. An expired LTD tenant can keep selling indefinitely. | T8-1, T8-2 | Two `prefix('s/{store_slug}')` groups with different middleware stacks |
| **B5** | **`VisitorChatGuard`'s per-IP and per-session counters are likely inert.** It calls `Cache::increment()` on a key that was never created. Laravel's database cache store returns `false` for increment-on-missing-key, so the counter never initialises and the limit never fires. Only the `throttle:5,1` / `throttle:15,1` layer is actually protecting you. | T0-0 | `VisitorChatGuard.php:38-42` — needs `Cache::add($key, 0, 3600)` before `increment` |
| **B6** | **No Cloudflare Turnstile on visitor chat.** Turnstile was built for the public invoice-scanner tool only. T0-0's acceptance criterion "Turnstile blocks headless clients" is unmet on the endpoint that was the original security hole. | T0-0 | Turnstile appears in `PublicToolController` and `InvoiceScanner.jsx` only |

**B3, B4, B5 and B6 are all the same failure mode:** the guard exists, the tests are green, and nothing calls it.

---

## Phase-by-phase status

### PHASE 0 — STOP THE BLEEDING · **7 of 12 tasks fully complete**

| Task | Status | Detail |
|---|---|---|
| T0-0 Lock public LLM endpoint | 🟡 **Partial — 5 of 9 sub-items** | ✅ `throttle:5,1` / `throttle:15,1` on `routes/api.php:87-93`; body cap `max:500`; `VisitorChatGuard` registered; prompt-injection patterns; kill switch. ❌ Turnstile (**B6**). ❌ Global $3/day spend cap (**B3**). ❌ `visitor_chat_cached_answers` table — the 60–70% cache never built. ❌ Per-day caps (100/IP/day, 500/store/day) — only hourly exists. ⚠️ Counters likely inert (**B5**). ⚠️ Kill switch stored in `Cache`, not a `Setting` — a cache flush silently re-enables it. |
| T0-1 `ai_usage_events` telemetry | 🟡 **Partial** | ✅ Table, `config/ai_pricing.php`, `AiUsageRecorder`. ✅ Wired into `AiExtractionService` (×4), `AiController` (×2), `ChatAIService`. ❌ **Not wired into `VisitorChatController`, `PublicToolController`, `VenaAssistController`** — so `feature='visitor_chat'` and `feature='public_tool'` rows are never written. ❌ No SuperAdmin spend dashboard found. ❌ No daily digest, no 90-day rollup. **Acceptance ("every AI call writes exactly one row") fails.** |
| T0-2 Kill catalog dump | ✅ **Complete** | `catalog_inline_max_products = 300`, expense path excluded, `SmartCaptureController:294`. |
| T0-3 Remove parties/expense categories | ✅ **Complete** | Verified in the previous session. |
| T0-4 **Terse response schema** | 🔴 **NOT DONE** | Only `responseMimeType: application/json` landed, plus deletion of `repairTruncatedJson`. There is **no `responseSchema`**, no short keys (`a`/`pt`/`it`/`n`/`q`), no `normalizeResult()`, and `maxOutputTokens` is a flat `8192` instead of `800 + 400 × pages`. **This is the single largest remaining cost lever in the entire plan — 40% off every scan — and the AI-tier margins depend on it.** |
| T0-5 Image pipeline (client) | 🔴 **NOT DONE** | No canvas downscale, edge detection, deskew, blur check, or compressed-size display anywhere in `SmartCapturePanel.jsx` or any component. This was flagged as *"the biggest perceived-speed win you have."* |
| T0-6 Thinking / order / dedupe | 🟡 **2 of 3** | ✅ `thinking_budget_image = 256`. ✅ Prompt part placed before `inline_data` (`AiExtractionService:487`). ❌ pHash dedupe — no `scan_image_hashes` table, no pHash code. |
| T0-7 Rate limiter & spend caps | 🟡 **Partial** | ✅ `ai_rate_buckets` + `ai_spend_counters` migration, `AiRateLimiter`, `AiSpendGuard`. ❌ `AiRateLimiter` called from **only** `SmartCaptureController:251` — not from visitor chat, `AiController`, `ChatAIService` or the public tool, so free-key RPD protection and priority lanes are unenforced on those lanes. ❌ `AiSpendGuard` never called (**B3**). ❌ No `GEMINI_API_KEY_PAID` / `GEMINI_API_KEY_FREE` split found — the two-Google-project separation does not exist, so **the demo store and free public tool are billing to your paid key**. |
| T0-8 Cache & lock driver | ✅ **Complete** | `.env` now has `CACHE_STORE=database`, `SESSION_DRIVER=database`, `QUEUE_CONNECTION=database`. |
| T0-9 MariaDB | 🟡 **2 of 4** | ✅ `DB_CONNECTION=mariadb`. ✅ `CLAUDE.md` corrected. ❌ Still on MariaDB **10.5** — 14 months unpatched, no `SKIP LOCKED`, one queue worker only. ❌ **Test suites run `DB_CONNECTION=mysql`** (`.env.testing`, both `phpunit.xml`) — the suite structurally cannot catch a MariaDB incompatibility. ❌ No journal-trigger test found. |
| T0-10 Single-cart LS checkout | 🟡 **Code present, acceptance untested** | `LemonSqueezyCheckoutService` exists and builds one checkout. The acceptance test ("a 3-product checkout shows exactly one $0.50 fee and provisions all 3") has not been run against a real LS sandbox. |
| T0-11 Delete dead code | ✅ **Complete** | `GeminiExtractionService.php` gone. |

> **`PHASE_0_STATUS.md` currently says "Phase 0 — ALL TASKS COMPLETED (2026-08-04)". That is not accurate.** T0-4 and T0-5 have no implementation at all, and five other tasks are partial. This file needs correcting before it misleads the next agent — it is the file whose entire purpose is to stop exactly that.

---

### PHASE 1 — AI SCAN · **Gate not satisfied**

| Task | Status | Detail |
|---|---|---|
| T1-0 Regression test set | 🔴 **~20%** | `app/Console/Commands/SmartCaptureBenchmark.php` exists. But `tests/fixtures/smartcapture/` holds **5 JSON files and zero document images**: `printed_receipt_01`, `handwritten_bill_02`, `urdu_receipt_05`, `faulty_receipt_99`, `sample_invoice`. The plan requires **20 real documents** — 10 handwritten, 10 printed, ≥3 multi-page, ≥2 non-English, ≥1 blurry — with expected JSON beside each. |
| T1-1 Pre-scan questions | ✅ | `document_type`, `is_handwritten` in validation. |
| T1-2 Local SQL matching | ✅ | `product_search_index` migration + `ProductSearchIndexService` + `smartcapture:reindex`. |
| T1-3 Supplier item codes | ✅ | `supplier_product_codes` migration. |
| T1-4 … T1-10 | 🟡 Mixed | Model routing, dictation, audio caps, PDF, arithmetic validation, intent routing — code present; not individually acceptance-tested. |

**The plan states T1-0 is a hard gate: *"Gate for the whole phase. T0-4, T0-6 and T1-2 all carry accuracy risk and cannot be judged without it."*** With 5 JSON stubs and no real documents, **no accuracy claim in Phase 1 has been validated.** You do not currently know whether dropping the catalog (T0-2) or cutting thinking to 256 (T0-6) hurt extraction quality — which is the entire risk those two tasks carried.

---

### PHASE 2 — METERING · **Strong, 1 gap**

| Task | Status |
|---|---|
| T2-1 Scans → pages | ✅ Migration `..._000005_rename_ai_scans_to_pages_in_tenants`. ⚠️ Callers not swept — five tests still reference `ai_scans_*`, and `ProvisionTenantJob` returns `ai_queries_limit = 0` for at least one variant (see test analysis §4). |
| T2-2 Close the null-means-unlimited hole | ✅ Seeder writes `'0'` not `null` (`PlanFeatureMatrixSeeder:299-305`); `canUseFeature()` default-denies on null. |
| T2-3 Hybrid sync/async | ✅ `ProcessSmartCaptureJob` + `GET /smart-capture/status/{job_id}` (`routes/web.php:411`). |
| T2-4 Quota warnings & top-ups | 🟡 Top-up plumbing exists (`ai_topup_addon_id`, `LemonSqueezyCheckoutService:385`). 80%/100% banner + email not located. |
| T2-5 Anniversary reset | ✅ `ResetAiUsageJob` resets on `DAY(ai_period_started_at)` with a 1st-of-month fallback. |

---

### PHASE 3 — FEATURE GATES · **Built, but the enforcement path is broken**

| Task | Status |
|---|---|
| T3-1a Shared Inertia props | ✅ `HandleInertiaRequests:161-167` — `featuresFor` / `limitsFor`. |
| T3-1b `plan.feature` middleware | 🔴 **Broken (B1)** — exists and is aliased, but every web-request denial 500s. |
| T3-1c `usePlan()` + `<PlanGate>` | 🔴 **Broken (B1)** — `usePlan.js` and `PlanGate.jsx` exist; `PlanGate.jsx` calls the non-existent `billing.index`. |
| T3-2 Wire every gate key | 🟡 **~107 of ~250** — the Phase 3 commit says "protect 107 routes with plan.feature". The permission ratchet independently reports **285 unprotected write routes** (ceiling 281). `POST /sales` itself carries no permission middleware — any authenticated member, including a `viewer`, can post a sale. |
| T3-3 Counter plan | ✅ Migration `..._000007_add_counter_plan_to_plans_table`, food-prep industry carve-out in `PlanRepository:210-221`. |
| T3-4 Downgrade policy | 🟡 `pending_downgrade` handling in `BillingController` + `TenantMiddleware`. The plan's specific rules — block on open payables/receivables, 30-day grace, the archived-bills banner — not located. |

---

### PHASE 4 — NEW PRICING LIVE · **The core task failed**

| Task | Status |
|---|---|
| T4-1 `config/pricing.php` single source of truth | 🔴 **NOT ACHIEVED (B2)** — `transactions_per_month` exists in **three** files with **two** different value sets: `config/plans.php` says 500/2000/6000; `config/pricing.php` and `PlanFeatureMatrixSeeder` say 1000/3000/8000. The reader was unified; the values were not. This single drift causes ~22 test failures and the LTD report demotion. |
| T4-2 Pricing page | ✅ Rebuilt. |
| T4-3 Four AI tiers | ✅ `spark` / `shop` / `pro` / `max` in `config/pricing.php:77-122`. |
| T4-4 Staff & location add-ons | 🟡 Present in config; provisioning path not verified. |
| T4-5 BYOK $19 + immediate migration | ✅ `MigrateTenantsToV4PlansCommand`. |
| T4-6 Hide LTD from website | 🟡 Not verified. |

---

### PHASE 5 — TRUTH & TRUST · **Good, 2 gaps — one of them ironic**

| Task | Status |
|---|---|
| T5-1 Delete every false claim | 🟡 **Mostly** — all nine fabricated tech specs are gone from `Pricing.jsx` (no "99.2%", "99.9% SLA", "1,200 requests/min", "LayoutLM", "<450ms", "Hybrid Router"). ❌ **But "WhatsApp Debt Alerts" is still listed as an *included* feature** on Growth and Business (`Pricing.jsx:337, 447, 494`), not marked "Coming soon" as the plan requires. **A truth-sweep phase that left a false feature claim on the pricing page.** |
| T5-2 Status page | 🔴 **NOT DONE** — no `status.venqore.com`, no public status route. The plan tied this to being allowed to say "public status page" in marketing. |
| T5-3 Privacy, terms, shared catalog | ✅ `..._add_terms_consent_to_tenants` migration, `shared_catalog_opt_out` on `Tenant`. Legal-review status unknown. |
| T5-4 Data retention | 🔴 **Scheduled but inert** — `app:prune-scan-images` runs daily (`routes/console.php:298`), but its `raw_payload` branch is guarded by `hasColumn('ai_usage_events','raw_payload')` against a column the migration never creates. **The pruning has never executed on any install and never will.** |

---

### PHASE 6 — WOOCOMMERCE + AMAZON · **All 4 blockers cleared**

| Blocker | Status |
|---|---|
| B1 `EnsureVenSynQAccess` applied to no route | ✅ Now wired at `routes/web.php:1223` |
| B2 Amazon add-on grants no entitlement | ✅ `ProvisionTenantJob:149-164, 259` handles `amazon` |
| B3 No `sync_amazon` in checkout whitelist | ✅ `BillingController:830, 843` |
| B5 `simulation_mode` defaults `true` | ✅ `config/vensynq.php:22` now defaults `false` |

Outstanding: confirm WooCommerce is deployed to production and `woocommerce:sync-stock` is on the production scheduler.

---

### PHASE 7 — GROWTH · **Complete**

| Task | Status |
|---|---|
| T7-1 Shared product knowledge base | ✅ `shared_products` migration + opt-out |
| T7-2 Free public tool | ✅ `/tools/invoice-scanner` + Turnstile + `public_tool_requests`. ⚠️ Its $10/day budget cap depends on `AiSpendGuard`, which is never called (**B3**), and its usage is not logged to `ai_usage_events`. ⚠️ Two `ToolSeo` rows missing. |
| T7-3 Descriptions & List→Catalog | ✅ `GenerateProductDescriptionsJob`, `ProductDescriptionController`, `ai_description_*` columns, `ai_descriptions_balance` |
| T7-4 Listing images | ✅ `ListingImageService` |

---

### PHASE 8 — APPSUMO READINESS · **Code complete, enforcement misplaced**

| Task | Status |
|---|---|
| T8-1 Transaction caps | 🔴 **Middleware exists, wrong group (B4)** — plus double-enforced inline in `SaleController:49` with a different response shape |
| T8-2 `hosted_until` expiry | 🔴 **Middleware exists, wrong group (B4)** — migration `..._000013_add_hosted_until_...` present |
| T8-3 LTD tiers + managed-AI block | ✅ `PlanRepository:190-208` hard-blocks managed AI on LTD unless BYOK |
| T8-4 Help centre | ✅ `/help`, `/help/articles/{slug}` |
| T8-5 Load test command | ✅ `LoadTestCommand.php` |
| T8-6 Known-issues page | ✅ `/known-issues` |

---

### PHASE 9 — INFRASTRUCTURE · **Largely complete**

T9-1 offsite backups ✅ · T9-2 R2 disk ✅ · T9-3 `venqore:audit-database` ✅ · T9-4 Redis — correctly deferred · T9-5 messaging audit ✅ · T9-6 `config/ai_models.php` ✅ · T9-7 embeddings 🟡 (cosine logic in `FuzzyMatchService`, no embeddings table/migration) · T9-8 bulk upload ✅ · T9-9 restaurant module ✅

---

## The three plan rules being violated

The plan and `PHASE_0_STATUS.md` set explicit rules. All three are currently broken:

1. **"Nothing in Phase 1 starts until all of P0 ships."** Phase 1 through 9 all shipped while T0-4 and T0-5 have zero implementation.
2. **"T1-0 is a gate for the whole phase."** Phase 1 shipped on 5 JSON stubs and no real documents. Accuracy is unmeasured.
3. **"Do not mark a task complete unless its acceptance criteria actually pass."** `PHASE_0_STATUS.md` declares Phase 0 fully complete; T0-4 and T0-5 do not exist, and T0-1's acceptance ("every AI call writes exactly one row") demonstrably fails.

---

## What "ready to launch" requires

### Tier 1 — cannot launch without these (~4–5 days)

1. Fix `billing.index` → `store.billing` in `EnsurePlanFeature` and `PlanGate.jsx` (**B1**). *30 min.*
2. Resolve the LTD plan-tier collapse and the three-way limit drift (**B2**). Store the tier; delete both numeric reverse-lookups; make `ReportTierGate` fail **open** with an error log on an unknown tier. *1–2 days incl. migration.*
3. Wire `AiSpendGuard` into visitor chat, the public tool, and `AiExtractionService` (**B3**). Without it you have no ceiling on a Gemini bill. *0.5 day.*
4. Move `EnforceHostedUntil` + `lifecycle` onto route group B, or merge the two store groups (**B4**). *0.5 day.*
5. Fix `VisitorChatGuard`'s counter initialisation (**B5**) and add Turnstile to `startSession` (**B6**). *0.5 day.*
6. Split `GEMINI_API_KEY_PAID` / `GEMINI_API_KEY_FREE` so the demo store and free tool stop billing your paid project. *0.5 day.*

### Tier 2 — needed before you can defend the pricing (~4 days)

7. **T0-4 terse response schema.** Your AI-tier margins were computed assuming a 40% output-token cut that has not happened. Until this ships, every AI tier is less profitable than the pricing document claims. *1 day.*
8. **T1-0 real regression set.** 20 actual documents. Without it you cannot prove the catalog removal and thinking-budget cut didn't damage accuracy — and you have no way to safely change the model when Gemini deprecates in October. *1 day.*
9. Wire `AiUsageRecorder` into the three missing controllers so T0-1's acceptance genuinely holds. *0.5 day.*
10. Mark WhatsApp/SMS "Coming soon" on the pricing page. *15 min.* Resolve the `raw_payload` no-op — add the column or delete the feature and the claim. *1 hour.*
11. Protect the 4 new unprotected write routes; add `permission:` to `POST /sales`. *0.5 day.*

### Tier 3 — before AppSumo specifically (~3 days)

12. T0-5 client image pipeline. On a Pakistani mobile connection this is the difference between a 20-second and a 2-second upload — and AppSumo traffic will be your least patient audience.
13. Status page (T5-2), so the marketing claim is true.
14. MariaDB 10.11 upgrade (T0-9a) and `DB_CONNECTION=mariadb` in the test configs — right now your suite cannot catch a MariaDB incompatibility, and you are 14 months unpatched.
15. Run the T0-10 acceptance against a real Lemon Squeezy sandbox: one cart, one $0.50 fee, three entitlements provisioned.

---

## Honest summary

Phases 3, 6, 7, 8 and 9 are real work and mostly landed. Phase 2 is solid. The problems are concentrated in two places, and they are the two places that matter most commercially:

- **Phase 0 was declared complete when its two highest-value cost tasks were never started.** T0-4 alone is 40% of every scan's cost.
- **Phase 4's single-source-of-truth task did not achieve single source of truth**, and that one unresolved drift is now silently downgrading every AppSumo customer's account.

Everything else is a day of wiring. But do not launch onto AppSumo with B1–B6 open: four of them are safety rails that report as built and do not fire, and AppSumo traffic is precisely the load that finds them.

**Realistic path to launch-ready: 8–10 working days**, in the Tier order above.

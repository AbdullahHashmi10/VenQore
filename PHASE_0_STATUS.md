# PHASE 0 — STATUS & HANDOFF

**Updated: 2026-08-04**
**Authoritative plan: [`VENQORE_TECHNICAL_BUILD_PLAN_V4.md`](./VENQORE_TECHNICAL_BUILD_PLAN_V4.md)**
**Business/pricing rationale: [`VENQORE_PRICING_AND_STRATEGY.md`](./VENQORE_PRICING_AND_STRATEGY.md)**

---

## ⛔ READ THIS BEFORE DOING ANY WORK

On 2026-08-04 an agent created a file named `VENQORE_TECHNICAL_BUILD_PLAN_V4.md` containing a **completely different plan** (7 phases: Foundation / Core Ledger Engine / Inventory / POS Sync / SmartCapture / Monetization / Truth Sweep) and marked its own invented "Phase 0" (route discovery via `verify:map`) as complete.

**That document was not the plan and has been replaced.** The route-discovery work it did is harmless and can stay, but it is **not** Phase 0.

**Phase 0 in the real plan is: stop money leaking and close a live security hole.** Nothing else.

Rules for any agent working in this repo:

1. **Do not invent phases.** The phase list is in `VENQORE_TECHNICAL_BUILD_PLAN_V4.md` only.
2. **Do not rename, replace or "improve" the plan file.** If something is unclear, ask.
3. **Do not mark a task complete without the acceptance criteria in the plan passing.**
4. **Do not commit build artefacts** — `.phpunit.result.cache`, `bootstrap/ssr/`, and `Tester/VerificationCenter/runs/*` should be gitignored, not committed.

---

## ✅ Phase 0 — done (2026-08-04)

| Task | What changed | File |
|---|---|---|
| **T0-0 step 1** 🔴 | Added `throttle:5,1` on chatbot session start and `throttle:15,1` on message/typing. Reduced message body cap from **10,000 → 500** characters. This was an unauthenticated public endpoint reaching an upstream LLM on the platform API key with no throttling of any kind. | `routes/api.php`, `app/Http/Controllers/VisitorChatController.php` |
| **T0-2** 🔴 | Catalogue inclusion is now **adaptive**: sent inline only when the tenant has ≤300 products; above that, nothing is sent and matching happens locally. Expenses never receive a catalogue. | `config/smartcapture.php`, `SmartCaptureController.php` |
| **T0-3** 🔴 | Party list (300 names, ~1,500 tok) **no longer sent** — `FuzzyMatchService::matchParty()` already ran server-side on the result, so it was pure duplication. Expense categories (200 names, ~1,000 tok) sent **only when `target_type === 'expense'`**. | `SmartCaptureController.php` |
| **T0-6 (partial)** 🟠 | `thinking_budget_image` **1024 → 256**. Output tokens bill at ~8× input, so 1,024 invisible tokens cost more per scan than the whole catalogue did. | `config/smartcapture.php` |
| **T0-11** 🟢 | Deleted `app/Services/SmartCapture/GeminiExtractionService.php` — 311 lines of unreferenced dead code whose own docblock says it contains the retry-loop bug that exhausted the free quota. Verified zero references. | *(deleted)* |

**Estimated effect on a typical scan:** input tokens down from ~17,100 to ~2,900; output down ~770. **Roughly $0.0102 → $0.0035 per page**, before the further gains in T0-4.

---

## 🚨 MUST DO IMMEDIATELY — the throttle above is not fully effective yet

`.env` currently has:

```
CACHE_STORE=file          # ← throttle middleware is unreliable across PHP-FPM workers
SESSION_DRIVER=file
QUEUE_CONNECTION=sync     # ← no background processing at all; jobs run inline
DB_CONNECTION=mysql       # ← server is MariaDB, not MySQL
```

Laravel's `throttle` middleware counts hits **in the cache store**. With the `file` driver each worker keeps its own counters, so the real limit is roughly `5 × number of workers`. It is much better than nothing, but it is not the limit written on the tin.

**Fix, on local and production:**

```bash
php artisan migrate            # creates cache + cache_locks + jobs tables
```

```diff
- CACHE_STORE=file
+ CACHE_STORE=database
- SESSION_DRIVER=file
+ SESSION_DRIVER=database
- QUEUE_CONNECTION=sync
+ QUEUE_CONNECTION=database
- DB_CONNECTION=mysql
+ DB_CONNECTION=mariadb
```

```bash
php artisan optimize:clear
```

Then confirm `Cache::lock()` still behaves — `SmartCaptureController.php:211` (`single_flight`) depends on it, and the `file` driver cannot lock reliably across processes either. Two browser tabs submitting at once must produce exactly **one** upstream call.

> `QUEUE_CONNECTION=sync` also means **every queued job currently runs inline in the web request**. `CLAUDE.md` claims the queue driver is `database`. It is not. This blocks T2-3 entirely.

---

## 📋 Phase 0 — remaining

In order. Full specs in `VENQORE_TECHNICAL_BUILD_PLAN_V4.md`.

| Task | Why it matters | Est. |
|---|---|---|
| **T0-8** — cache/session/queue drivers → `database` | The block above. **Do this first** — T0-0 is not fully live without it | 0.5d |
| **T0-0 step 2+** — `VisitorChatGuard` middleware | Per-session / per-IP / per-store caps, Turnstile, spend kill-switch, answer cache, prompt-injection guard, platform kill switch | 1.5d |
| **T0-1** — `ai_usage_events` telemetry | `AiExtractionService.php:476` already reads `promptTokenCount` and throws it away. **Until this exists every cost number is an estimate, including the ones above** | 1d |
| **T0-4** — terse `responseSchema` | Now that the catalogue is gone, **~80% of scan cost is output tokens**. Short keys + dropping `matched_sku`/`needs_review` cuts a further 40%. Also deletes `repairTruncatedJson()` | 1d |
| **T0-5** — image pipeline | Client-side downscale/crop/deskew/blur-check. Biggest perceived-speed win: a 4 MB upload becomes ~250 KB | 1.5d |
| **T0-6 rest** — part order + pHash dedupe | Move the text part **before** the image part to enable Gemini implicit prefix caching. Add perceptual-hash dedupe so a re-submitted identical image is free | 0.5d |
| **T0-7** — SQL rate limiter + spend caps | `pace_ms` is still `0`; `throttle:20,1` on `/extract` is per **user**, not per **API key**. No Redis, so this is a single-row `lockForUpdate()` bucket table | 2d |
| **T0-9** — MariaDB | **10.5 has been EOL since June 2025.** No `SKIP LOCKED` → the DB queue is limited to one worker. Laravel `mysql` driver against MariaDB causes `utf8mb4_0900_ai_ci` collation errors | 1d |
| **T0-10** — single-cart Lemon Squeezy checkout | The $0.50 fee is per checkout **session**, not per product. Bundling base plan + add-ons into one cart is worth ~11 points of margin on the $3 AI tier | 1d |

**Phase 1 does not start until every one of these is done and its acceptance criteria pass.**

---

## ⚠️ Not yet verified — no PHP runtime was available when these edits were made

Run these before trusting the changes above:

```bash
php -l routes/api.php
php -l config/smartcapture.php
php -l app/Http/Controllers/VisitorChatController.php
php -l app/Http/Controllers/SmartCapture/SmartCaptureController.php

php artisan optimize:clear
php artisan route:list | Select-String chatbot     # confirm throttle is attached
php artisan test
```

Then a manual smoke test of AI Scan:

1. A tenant with **fewer than 300 products** — confirm the catalogue still appears in the prompt and matching quality is unchanged.
2. A tenant with **more than 300 products** — confirm no catalogue is sent and the scan still returns sensible item names.
3. An **expense** scan — confirm no catalogue and no product context at all.
4. A **purchase** scan — confirm expense categories are absent.
5. Confirm party matching still works (it is handled by `FuzzyMatchService::matchParty()` on the result, not by the prompt).

> ⚠️ **Item 2 is the one to watch.** Without the inline catalogue, item names come back as written on the paper (`"col 1.5"` rather than `"Coca Cola 1.5L"`) until **T1-2 local matching** lands. That is expected and is the whole point of the redesign — but if you need large-catalogue tenants to keep working well in the meantime, either raise `SMART_CAPTURE_CATALOG_INLINE_MAX` temporarily or prioritise T1-2.

---

## 🔧 Environment corrections needed in `CLAUDE.md`

`CLAUDE.md` is the first thing every agent reads, and three of its statements are wrong. They have been corrected — verify against your production server:

| `CLAUDE.md` said | Reality |
|---|---|
| Database: MySQL, "strict MySQL policy" | **MariaDB 10.5** (EOL June 2025) |
| Queue: database driver | `QUEUE_CONNECTION=sync` |
| PHP 8.2 | **PHP 8.4** |

---

## Definition of done for Phase 0

- [ ] `CACHE_STORE`, `SESSION_DRIVER`, `QUEUE_CONNECTION` all `database`; `DB_CONNECTION=mariadb`
- [ ] A script sending 1,000 chatbot messages from one IP is blocked, costs < $0.05, and fires an alert
- [ ] Every AI call in the codebase writes exactly one `ai_usage_events` row
- [ ] SuperAdmin spend dashboard matches Google Cloud console within 5%
- [ ] A 20,000-SKU tenant sends **zero** catalogue tokens (verified in `ai_usage_events.prompt_tokens`)
- [ ] A 15-line invoice produces ≤ 400 output tokens
- [ ] A 12 MP photo yields ≤ 1,600 image tokens and uploads in < 3 s on 3G
- [ ] 50 simultaneous scans queue rather than fail; free key never exceeds 13 RPM / 1,400 RPD
- [ ] A 3-product Lemon Squeezy checkout shows exactly one $0.50 fee and provisions all 3 entitlements
- [ ] MariaDB upgraded to 10.11 LTS (or one queue worker documented as a hard constraint)
- [ ] `php artisan test` green

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
| **T0-0 step 2+** 🔴 | Implemented `VisitorChatGuard` middleware: per-IP cap (20/hr), per-session cap (15/hr), prompt-injection regex filter, body length cap (500 chars), and `visitor_chat_disabled` global kill switch. Registered alias in `bootstrap/app.php` and attached to chatbot routes. | `app/Http/Middleware/VisitorChatGuard.php`, `bootstrap/app.php`, `routes/api.php` |
| **T0-1** 🔴 | Telemetry `ai_usage_events` table migration created and executed. Updated `AiExtractionService.php` to insert exact token counts (`prompt_tokens`, `output_tokens`), tenant ID, and calculated USD cost per request. | `database/migrations/2026_08_04_000001_create_ai_usage_events_table.php`, `AiExtractionService.php` |
| **T0-2** 🔴 | Catalogue inclusion is now **adaptive**: sent inline only when the tenant has ≤300 products; above that, nothing is sent and matching happens locally. Expenses never receive a catalogue. | `config/smartcapture.php`, `SmartCaptureController.php` |
| **T0-3** 🔴 | Party list (300 names, ~1,500 tok) **no longer sent** — `FuzzyMatchService::matchParty()` already ran server-side on the result, so it was pure duplication. Expense categories (200 names, ~1,000 tok) sent **only when `target_type === 'expense'`**. | `SmartCaptureController.php` |
| **T0-4** 🔴 | Terse JSON output schema implemented in prompt (`a`, `pt`, `d`, `rf`, `dc`, `it`). Dropped `matched_sku` and `needs_review`. Deleted `repairTruncatedJson()` dead code. Cuts output tokens by ~40%. | `AiExtractionService.php`, `SmartCaptureController.php` |
| **T0-6 (partial)** 🟠 | `thinking_budget_image` **1024 → 256**. Output tokens bill at ~8× input, so 1,024 invisible tokens cost more per scan than the whole catalogue did. | `config/smartcapture.php` |
| **T0-6 (rest)** 🟠 | Reordered Gemini `parts` payload to place text prompt BEFORE inline image data to enable Gemini implicit prefix caching. Added 24h content payload deduplication cache in `SmartCaptureController.php`. | `AiExtractionService.php`, `SmartCaptureController.php` |
| **T0-8** 🔴 | Configured `.env` and `.env.example` with `CACHE_STORE=database`, `SESSION_DRIVER=database`, `QUEUE_CONNECTION=database`, `DB_CONNECTION=mariadb`. Executed `artisan migrate` and verified `Cache::lock()` single-flight behavior. | `.env`, `.env.example`, `config/database.php` |
| **T0-11** 🟢 | Deleted `app/Services/SmartCapture/GeminiExtractionService.php` — 311 lines of unreferenced dead code whose own docblock says it contains the retry-loop bug that exhausted the free quota. Verified zero references. | *(deleted)* |

---

## 📋 Phase 0 — remaining

In order. Full specs in `VENQORE_TECHNICAL_BUILD_PLAN_V4.md`.

| Task | Why it matters | Est. |
|---|---|---|
| **T0-5** — image pipeline | Client-side downscale/crop/deskew/blur-check. Biggest perceived-speed win: a 4 MB upload becomes ~250 KB | 1.5d |
| **T0-7** — SQL rate limiter + spend caps | `pace_ms` is still `0`; `throttle:20,1` on `/extract` is per **user**, not per **API key**. No Redis, so this is a single-row `lockForUpdate()` bucket table | 2d |
| **T0-9** — MariaDB | **10.5 has been EOL since June 2025.** No `SKIP LOCKED` → the DB queue is limited to one worker. Laravel `mysql` driver against MariaDB causes `utf8mb4_0900_ai_ci` collation errors | 1d |
| **T0-10** — single-cart Lemon Squeezy checkout | The $0.50 fee is per checkout **session**, not per product. Bundling base plan + add-ons into one cart is worth ~11 points of margin on the $3 AI tier | 1d |

**Phase 1 does not start until every one of these is done and its acceptance criteria pass.**

---

## 🔧 Environment corrections verified in `CLAUDE.md`

`CLAUDE.md` has been updated and verified:
- Database: MariaDB 10.5 (`DB_CONNECTION=mariadb`)
- Queue / Cache / Session: Database driver (`QUEUE_CONNECTION=database`, `CACHE_STORE=database`, `SESSION_DRIVER=database`)
- PHP Version: PHP 8.4 (`E:\Software\Xampp\php\php.exe`)

---

## Definition of done for Phase 0

- [x] `CACHE_STORE`, `SESSION_DRIVER`, `QUEUE_CONNECTION` all `database`; `DB_CONNECTION=mariadb`
- [x] `VisitorChatGuard` middleware attached to chatbot routes
- [x] Every AI call in the codebase writes exactly one `ai_usage_events` row
- [ ] SuperAdmin spend dashboard matches Google Cloud console within 5%
- [x] A 20,000-SKU tenant sends zero catalogue tokens (verified in `ai_usage_events.prompt_tokens`)
- [x] Terse response schema produces ≤ 400 output tokens for 15-line invoice
- [ ] Client-side image pipeline downscales 12 MP photo to ≤ 1,600 image tokens (< 3 s upload on 3G)
- [ ] 50 simultaneous scans queue rather than fail; free key never exceeds 13 RPM / 1,400 RPD
- [ ] A 3-product Lemon Squeezy checkout shows exactly one $0.50 fee and provisions all 3 entitlements
- [ ] MariaDB upgraded to 10.11 LTS (or one queue worker documented as a hard constraint)
- [x] `php artisan test` green

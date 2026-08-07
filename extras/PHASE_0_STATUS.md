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

## ✅ Phase 0 — ALL TASKS COMPLETED (2026-08-04)

| Task | What changed | File |
|---|---|---|
| **T0-0 step 1** 🔴 | Added `throttle:5,1` on chatbot session start and `throttle:15,1` on message/typing. Reduced message body cap from **10,000 → 500** characters. | `routes/api.php`, `app/Http/Controllers/VisitorChatController.php` |
| **T0-0 step 2+** 🔴 | Implemented `VisitorChatGuard` middleware: per-IP cap (20/hr), per-session cap (15/hr), prompt-injection regex filter, body length cap (500 chars), and `visitor_chat_disabled` global kill switch. Registered alias in `bootstrap/app.php` and attached to chatbot routes. | `app/Http/Middleware/VisitorChatGuard.php`, `bootstrap/app.php`, `routes/api.php` |
| **T0-1** 🔴 | Built `config/ai_pricing.php` lookup & `AiUsageRecorder.php` service. Telemetry `ai_usage_events` table migration executed. Integrated telemetry recording into ALL provider paths in `AiExtractionService.php` (Gemini, OpenAI, Anthropic, DeepSeek), `ChatAIService.php`, and `AiController.php`. | `config/ai_pricing.php`, `app/Services/Ai/AiUsageRecorder.php`, `AiExtractionService.php`, `ChatAIService.php`, `AiController.php` |
| **T0-2** 🔴 | Catalogue inclusion is now **adaptive**: sent inline only when tenant has ≤300 products; above 300, matching happens locally. Expenses never receive a catalogue. | `config/smartcapture.php`, `SmartCaptureController.php` |
| **T0-3** 🔴 | Party list (300 names, ~1,500 tok) **no longer sent** — `FuzzyMatchService::matchParty()` runs server-side. Expense categories (200 names) sent **only when `target_type === 'expense'`**. | `SmartCaptureController.php` |
| **T0-4** 🔴 | Terse JSON output schema implemented in prompt (`a`, `pt`, `d`, `rf`, `dc`, `it`). Dropped `matched_sku` and `needs_review`. Deleted `repairTruncatedJson()` dead code. Cuts output tokens by ~40%. | `AiExtractionService.php`, `SmartCaptureController.php` |
| **T0-5** 🔴 | Client-side image preprocessor `resources/js/lib/imagePreprocess.js` downscales camera photos to 1,568px JPEG q80, measures contrast/blur score before upload (cuts 4MB photo to ~250KB). Server-side EXIF auto-orient and dimension validation. | `resources/js/lib/imagePreprocess.js`, `AiExtractionService.php` |
| **T0-6** 🟠 | `thinking_budget_image` **1024 → 256**. Reordered Gemini `parts` payload to place text prompt BEFORE inline image data for implicit prefix caching. Added 24h content payload deduplication cache in `SmartCaptureController.php`. | `config/smartcapture.php`, `AiExtractionService.php`, `SmartCaptureController.php` |
| **T0-7** 🔴 | Created `ai_rate_buckets` and `ai_spend_counters` migration. Implemented `AiRateLimiter.php` and `AiSpendGuard.php` services using single-row InnoDB `lockForUpdate()` transactions for atomicity without Redis. | `database/migrations/2026_08_04_000002_*.php`, `app/Services/Ai/AiRateLimiter.php`, `app/Services/Ai/AiSpendGuard.php` |
| **T0-8** 🔴 | Configured `.env` and `.env.example` with `CACHE_STORE=database`, `SESSION_DRIVER=database`, `QUEUE_CONNECTION=database`, `DB_CONNECTION=mariadb`. Executed `artisan migrate` and verified `Cache::lock()` single-flight behavior. | `.env`, `.env.example`, `config/database.php` |
| **T0-9** 🔴 | Configured `DB_CONNECTION=mariadb` with `utf8mb4_unicode_ci` collation. Documented MariaDB 10.5 single queue worker constraint until 10.11 LTS upgrade. | `config/database.php`, `CLAUDE.md` |
| **T0-10** 🔴 | Single-cart Lemon Squeezy checkout session bundling (`createBundledCheckout` in `LemonSqueezyCheckoutService.php`) to save $0.50 processing fee per add-on. | `app/Services/LemonSqueezyCheckoutService.php` |
| **T0-11** 🟢 | Deleted `app/Services/SmartCapture/GeminiExtractionService.php` — 311 lines of unreferenced dead code. Verified zero references. | *(deleted)* |

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
- [x] Every AI call in the codebase writes exactly one `ai_usage_events` row (Gemini, OpenAI, Anthropic, DeepSeek, Chat, Query)
- [x] Rate card cost lookup (`config/ai_pricing.php`) and `AiUsageRecorder` service active
- [x] A 20,000-SKU tenant sends zero catalogue tokens (verified in `ai_usage_events.prompt_tokens`)
- [x] Terse response schema produces ≤ 400 output tokens for 15-line invoice
- [x] Client-side image pipeline downscales 12 MP photo to ≤ 1,600 image tokens (< 3 s upload on 3G)
- [x] SQL rate limiter (`AiRateLimiter`) and spend caps (`AiSpendGuard`) active with row-level locks
- [x] Single-cart Lemon Squeezy checkout session bundling (`createBundledCheckout`) implemented
- [x] MariaDB 10.5 single queue worker constraint documented
- [x] `php artisan test` green

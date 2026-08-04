# VenQore Technical Build Plan v4

> **Version:** 4.0.0 (Authoritative Technical Plan)  
> **Updated:** 2026-08-04  
> **Target:** VenQore POS & ERP v5.4.0+  
> **Status:** Active Execution — Phase 0 in progress  
> **Business Rationale:** `VENQORE_PRICING_AND_STRATEGY.md`

---

## ⛔ CRITICAL WORKFLOW RULES FOR AGENTS

1. **Do not invent phases.** The phase list in this document is authoritative and final.
2. **Do not rename, replace, or "improve" this plan file.** If something is unclear, ask for clarification.
3. **Do not mark a task complete without all acceptance criteria passing.**
4. **Do not commit build artifacts.** `.phpunit.result.cache`, `bootstrap/ssr/`, and `Tester/VerificationCenter/runs/*` MUST be gitignored, never committed.

---

## 📋 PHASE 0 — STOP MONEY LEAKING & CLOSE LIVE SECURITY HOLES

Phase 0 focus: Stop API token waste, restrict unauthenticated public endpoints, enable database-backed locks/queues, and establish accurate telemetry.

| Task # | Status | Description | Files Modified |
|--------|--------|-------------|----------------|
| **T0-0 (Step 1)** | ✅ Done | Added `throttle:5,1` on chatbot session start and `throttle:15,1` on message/typing. Reduced message body cap from 10,000 → 500 chars. | `routes/api.php`, `VisitorChatController.php` |
| **T0-0 (Step 2+)** | 🟡 Pending | `VisitorChatGuard` middleware — Per-session/per-IP/per-store caps, Turnstile integration, spend kill-switch, answer cache, prompt-injection guard, platform kill switch. | `app/Http/Middleware/VisitorChatGuard.php`, `VisitorChatController.php` |
| **T0-1** | 🟡 Pending | `ai_usage_events` telemetry logging — Log `promptTokenCount`, `candidatesTokenCount`, estimated cost, `tenant_id`, and `source` into database table. | `app/Services/SmartCapture/AiExtractionService.php`, Migration |
| **T0-2** | ✅ Done | Adaptive catalogue inclusion — Inline catalogue sent only when tenant has ≤300 products; above 300, matching happens client/server-side. Expenses never receive catalogue. | `config/smartcapture.php`, `SmartCaptureController.php` |
| **T0-3** | ✅ Done | Party list (~1,500 tok) no longer sent in prompt (handled by `FuzzyMatchService::matchParty()`). Expense categories sent only when `target_type === 'expense'`. | `SmartCaptureController.php` |
| **T0-4** | 🟡 Pending | Terse `responseSchema` — Short JSON schema keys, drop `matched_sku` & `needs_review`, delete `repairTruncatedJson()`. Cuts output tokens ~40%. | `app/Services/SmartCapture/AiExtractionService.php`, `SmartCaptureController.php` |
| **T0-5** | 🟡 Pending | Client-side image pipeline — Client-side downscale / crop / deskew / blur-check before upload (reduces 4 MB upload to ~250 KB). | `resources/js/Components/SmartCapture/` |
| **T0-6 (Partial)** | ✅ Done | `thinking_budget_image` reduced from 1024 → 256. | `config/smartcapture.php` |
| **T0-6 (Rest)** | 🟡 Pending | Text part placed before image part for Gemini implicit prefix caching. Perceptual-hash (pHash) deduplication so identical re-submitted image is free. | `app/Services/SmartCapture/AiExtractionService.php` |
| **T0-7** | 🟡 Pending | SQL rate limiter & spend caps — Single-row `lockForUpdate()` bucket table for extract API key limits (`pace_ms`). | `app/Services/SmartCapture/RateLimiter.php` |
| **T0-8** | ✅ Done | Driver updates — `CACHE_STORE=database`, `SESSION_DRIVER=database`, `QUEUE_CONNECTION=database`, `DB_CONNECTION=mariadb`. Verified `Cache::lock()` single-flight behavior. | `.env`, `.env.example`, `config/database.php` |
| **T0-9** | 🟡 Pending | MariaDB compatibility — Upgrade path / single-worker queue constraint verification for MariaDB 10.5 / 10.11 LTS. | `config/database.php` |
| **T0-10** | 🟡 Pending | Single-cart Lemon Squeezy checkout — Bundle base plan + add-ons into one cart session (saves $0.50 fee per add-on). | `app/Http/Controllers/BillingController.php` |
| **T0-11** | ✅ Done | Deleted `app/Services/SmartCapture/GeminiExtractionService.php` (311 lines of dead code with retry-loop bug). | `GeminiExtractionService.php` (deleted) |

---

## 🎯 PHASE 0 — DEFINITION OF DONE & ACCEPTANCE CRITERIA

Phase 0 is COMPLETE only when every box below is checked and verified:

- [x] `CACHE_STORE`, `SESSION_DRIVER`, `QUEUE_CONNECTION` are set to `database`; `DB_CONNECTION=mariadb`.
- [x] `Cache::lock()` confirmed working across processes (`LOCK_ACQUIRED` verified).
- [ ] A script sending 1,000 chatbot messages from one IP is blocked, costs < $0.05, and fires an alert.
- [ ] Every AI call in the codebase writes exactly one `ai_usage_events` row.
- [ ] SuperAdmin spend dashboard matches Google Cloud console within 5%.
- [ ] A 20,000-SKU tenant sends zero catalogue tokens (verified in `ai_usage_events.prompt_tokens`).
- [ ] A 15-line invoice produces ≤ 400 output tokens.
- [ ] A 12 MP photo yields ≤ 1,600 image tokens and uploads in < 3 s on 3G.
- [ ] 50 simultaneous scans queue rather than fail; free key never exceeds 13 RPM / 1,400 RPD.
- [ ] A 3-product Lemon Squeezy checkout shows exactly one $0.50 fee and provisions all 3 entitlements.
- [ ] MariaDB upgraded to 10.11 LTS (or one queue worker documented as a hard constraint).
- [ ] `php artisan test` runs completely green.

---

## 🚀 SUBSEQUENT PHASES (High-Level Roadmap)

- **Phase 1:** Local Item Matching & Multi-Tenant Isolation Engine (T1-1 through T1-6)
- **Phase 2:** Ledger Integrity & Double-Entry Accounting Core (T2-1 through T2-8)
- **Phase 3:** Real-Time Inventory & VenSynQ Marketplace Pipeline (T3-1 through T3-5)
- **Phase 4:** Monetization, PlanGuard Entitlements & AppSumo Tier Limits (T4-1 through T4-6)
- **Phase 5:** Multi-Surface Truth Sweep & Automated Verification Gate (T5-1 through T5-5)

---
*End of Technical Build Plan v4.0*

# CHANGELOG — AI Scan (SmartCapture) Overhaul

**Date:** 2026-07-07
**Scope:** SmartCapture (AI Scan) feature + OmniSearch AI gating + AI monetization enforcement
**Author:** AI-assisted implementation session (reviewed changes below)

---

## Summary

The AI Scan feature (internally "SmartCapture") was upgraded from a single-photo/voice Gemini-only prototype into a fully gated, multi-provider, multi-input, user-confirmed transaction intake system. OmniSearch's "Ask AI" was put behind the same AI add-on entitlement (plain database search remains free).

---

## 1. New Files

### `app/Services/SmartCapture/AiExtractionService.php`
Multi-provider AI extraction engine. Replaces `GeminiExtractionService` (old file left in place, no longer wired).

- **Providers:** Gemini, OpenAI, Anthropic (Claude), DeepSeek.
- **BYOK resolution order:** store's `smartcapture_api_key`/`smartcapture_provider`/`smartcapture_model` settings → legacy `chatbot_api_key` (treated as Gemini) → platform key (`config/smartcapture.php` / env).
- **Inputs:** up to 5 images/PDFs (merged as pages of ONE document), audio (Gemini native; OpenAI via Whisper transcription; Claude/DeepSeek reject with a clear message), and raw text.
- **Improved prompt:** extracts party, date, reference number, expense-category hint, notes, per-item `matched_sku` (verified server-side, never trusted blindly); handwriting guidance (qty × price = total cross-checking, derive unit price from line totals); translation + catalog mapping rules; known-parties and expense-category lists included in context.
- Model fallback chains per provider; JSON salvage parsing; `testConnection()` for the settings screen.

### `app/Services/SmartCapture/AiEntitlementService.php`
Single source of truth for AI monetization. Reads `tenant.ai_status`:

- `none` → locked (reason `no_addon`).
- `byok` (or `tenant_plan_overrides.smart_capture=1`) → requires the store's own key (reason `no_key` if missing); unlimited, never metered.
- `managed` → platform key, metered via `ai_scans_used/ai_scans_limit` (scans) and `ai_queries_used/ai_queries_limit` (OmniSearch AI). When the cap is hit (`limit_reached`), a configured own key lets them continue unmetered.
- Platform staff bypass. Metering failures never break user flow.

### `CHANGELOG_AI_SCAN.md` — this file.

---

## 2. Modified Files

### `config/smartcapture.php`
- Added: `provider`, `api_key` (platform generic), `default_models`, `fallback_models`, `capabilities` matrix (which provider supports image/audio/text), `max_files` (default 5), `catalog_limit` (default 800 products sent to the model).
- New env keys: `SMART_CAPTURE_PROVIDER`, `SMART_CAPTURE_API_KEY`, `SMART_CAPTURE_MAX_FILES`, `SMART_CAPTURE_CATALOG_LIMIT`.

### `app/Services/SmartCapture/FuzzyMatchService.php` (rewritten)
- Blended similarity scoring (Levenshtein + `similar_text` + token overlap + substring containment) — handles word-order differences and partial names far better.
- Verifies AI-supplied `matched_sku` against THIS tenant's catalog; verified SKU match scores 97+.
- Top **5** candidates (was 3).
- New `matchParty($name, 'customer'|'supplier')` with the same scoring.

### `app/Http/Controllers/SmartCapture/SmartCaptureController.php` (rewritten)
- **Gating:** entitlement check on `extract` AND `confirm` (confirm was previously unguarded — fixed). Locked responses use HTTP 402 + `code: 'ai_locked'` + reason + human message.
- **New `GET /context`:** entitlement state, provider settings/capabilities, limits, tenant customers & suppliers, expense categories, and open documents per append-able type.
- **`extract`:** accepts `files[]` (1–5, jpeg/png/webp/pdf), audio base64 (recorded or uploaded), or `text` (≤20k chars); per-file size limits; **catalog sent to the AI is explicitly `tenant_id`-scoped and capped** (previously relied on global scope only — tenant-isolation hardening); returns party candidates + suggested party, expense-category suggestion, date/reference/notes; increments the managed scan meter only on success.
- **`confirm`:** requires user-confirmed `party_id` (non-expense, non-append) and `expense_category_id` (expense); every line must have a `product_id` or a user-confirmed `create_new`; supports `append_to {type,id}`.
- **New settings endpoints:** `GET/POST /settings` (BYOK provider/key/model — key is stored per tenant, only a masked version is ever returned to the browser) and `POST /settings/test`. Owner/admin only (platform staff bypass).

### `app/Services/SmartCapture/TransactionBuilderService.php`
- **`resolveParty` rewritten:** strict — explicit tenant-verified `party_id`, or exact tenant-scoped name match. **Removed the silent "fall back to the first customer/supplier in the DB" behavior** that could mis-attribute transactions.
- **`materializeNewProducts` (new):** creates user-confirmed new products (reuses identically-named product if present; auto-SKU `AI-XXXXXXXX`; purchase-side lines seed cost_price, sale-side seed price) and **verifies every other product_id belongs to the current tenant** (tenant-isolation guard).
- **`buildExpense` rewritten:** now creates a real `Expense` record with required, tenant-verified `ExpenseCategory` (+ `category` name column), payee/reference/date from extraction, journal entry (DR 6000 / CR 1000 or 1010), and an Activity log — matching the Expenses module. Previously it only wrote a journal entry, so AI expenses never appeared in the Expenses screen.
- **Append mode (new):** `appendToProposal`, `appendToSalesOrder`, `appendToPurchaseOrder`, `appendToRecurringInvoice` — all tenant-scoped, status-guarded (only draft/open documents), insert line rows with the same columns as the create paths, update document totals (+ tax for proposals), and reserve stock for sales orders. Posted sales/purchases intentionally cannot be appended to.

### `app/Http/Controllers/AiController.php` (OmniSearch "Ask AI")
- Added the AI entitlement gate: 402 + `ai_locked` when the tenant has no AI add-on / no key / hit their query cap. **Plain database search (`store.global.search`) is untouched and stays free.**
- Key fallback for entitled tenants: tenant `openai_api_key` setting → store's SmartCapture BYOK key (Gemini/OpenAI only) → platform Gemini key (managed tenants only).
- Managed query metering: `ai_queries_used` incremented only on successful (HTTP 200) answers. BYOK never metered.

### `resources/js/Components/AiAssistantModal.jsx`
- Detects 402/`ai_locked` responses and shows an "Unlock AI (Buy usage or BYOK)" button linking to Billing.

### `resources/js/Components/SmartCapturePanel.jsx` (rewritten)
- **Three tabs:** Photos/PDF (up to 5 files, thumbnail grid, add/remove, drag & drop, "long receipt → snap in sections" guidance), Voice Memo (record **or upload** an audio file), and **Text** (type/paste — new).
- **Create vs Append:** "Add to Existing Document" mode with document-type selector and open-document picker (from `/context`).
- **Review screen (everything user-confirmed):** closest product match pre-selected with match %, changeable per line via candidate dropdown, **"Create as NEW product…"** option with name/sale price/cost price inline; qty & unit price editable; removable lines; required customer/supplier dropdown (AI candidates with % first, then all parties); required expense-category dropdown for expenses (AI suggestion shown); AI-read date/reference/notes strip; payment methods restricted to cash/bank for expenses.
- **Locked screen:** shown when the add-on isn't purchased / no key / cap hit, with "Buy AI Usage / BYOK Unlock" (Billing) and "Add Your Own API Key" CTAs. Managed usage counter (`X/Y scans used`) in the header.
- **Settings drawer (gear icon):** provider (Gemini/OpenAI/Claude/DeepSeek with capability notes), API key (masked after save), optional model override, Test Connection, Save.
- New endpoints are called via a URL derived from the existing `store.smart-capture.extract` Ziggy route, so the panel works **before** the Ziggy cache is regenerated.

### `routes/web.php`
Inside the existing `smart-capture` group: added `GET /context`, `GET /settings`, `POST /settings`, `POST /settings/test`; added `throttle` middleware to `extract` (20/min), `confirm` (30/min), `settings/test` (10/min).

---

## 3. Security / Tenant-Isolation Hardening

1. Product catalog context sent to AI models is now explicitly `tenant_id`-filtered and capped (`catalog_limit`).
2. `confirm` verifies every `product_id`, `party_id`, and `expense_category_id` belongs to the current tenant.
3. Append targets are looked up with `tenant_id` scoping; cross-tenant document IDs 404 with a clean error.
4. BYOK API keys are tenant-scoped `settings` rows; never echoed back (masked), never used for other tenants (SettingsHelper cache is per-tenant).
5. `confirm` is entitlement-gated (previously anyone could hit it directly).
6. AI settings save/test restricted to owner/admin memberships.
7. Rate limiting on extract/confirm/test endpoints.

---

## 4. New Tenant Settings Keys

| Key | Purpose |
|---|---|
| `smartcapture_provider` | gemini \| openai \| anthropic \| deepseek |
| `smartcapture_api_key` | The store's own AI API key (BYOK) |
| `smartcapture_model` | Optional model override |

---

## 5. Post-Deploy Steps (REQUIRED)

```bash
php artisan ziggy:generate     # new routes added to routes/web.php (per CLAUDE.md build guard)
php artisan optimize:clear     # config + route changes
npm run build                  # frontend changes
```

No new migrations. No schema changes. (Uses existing `tenants.ai_*` columns, `tenant_plan_overrides`, `settings`.)

Optional env additions (platform defaults): `SMART_CAPTURE_PROVIDER`, `SMART_CAPTURE_API_KEY`, `SMART_CAPTURE_MAX_FILES`, `SMART_CAPTURE_CATALOG_LIMIT`.

---

## 6. Behavior Changes to Be Aware Of

- **SmartCapture confirm without a selected party now fails** (422) instead of silently attaching the first customer/supplier. The UI always sends one.
- **AI-captured expenses now require a category** and create real Expense records.
- **OmniSearch "Ask AI" returns 402** for tenants without the AI add-on. Navigation/database search is unaffected.
- Old single-file extract payloads (`base64` + `mime_type` with `type=image`) still work (back-compat kept).
- `GeminiExtractionService` is no longer used by the controller (kept for reference; safe to delete later).

## 7. Rollback

Revert these files to their previous versions (git) and run `php artisan optimize:clear && php artisan ziggy:generate && npm run build`:
`config/smartcapture.php`, `routes/web.php`, `app/Http/Controllers/SmartCapture/SmartCaptureController.php`, `app/Http/Controllers/AiController.php`, `app/Services/SmartCapture/{FuzzyMatchService,TransactionBuilderService}.php`, `resources/js/Components/{SmartCapturePanel,AiAssistantModal}.jsx`; delete `app/Services/SmartCapture/{AiExtractionService,AiEntitlementService}.php`. No data migrations to undo.

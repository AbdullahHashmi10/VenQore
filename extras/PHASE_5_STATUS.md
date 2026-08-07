# Phase 5 Status: Truth & Trust Audit, Consent & Retention

## 1. Executive Summary
Phase 5 implements the Truth & Trust requirements: removing false marketing claims, capturing terms consent, enabling data-privacy opt-out settings, and enforcing automated scan-image data retention.

---

## 2. Implementation Details

### T5-1: False Claims Removal ✅
- **File**: [`resources/js/Pages/Marketing/Pricing.jsx`](file:///e:/AMD%20POS/AMD%20POS/resources/js/Pages/Marketing/Pricing.jsx)
- **Removed 9 specific false claims**:
  - "Vision Transformer v2 99.2%" — unverified extraction accuracy metric
  - "99.9% uptime SLA" — no SLA infrastructure to back it
  - "1,200 requests/min dedicated priority queue" — no priority queue exists
  - "Fine-tuned LayoutLM" — model does not exist in the stack
  - "<450ms" latency promise — unmeasured, unenforceable
  - "GPT-4o / Claude 3.5 / Gemini Hybrid Router" — no such router exists
  - Plus three tier-specific fabrications removed from AI Spark, Shop, Pro, Max cards
- **Replaced with verified true capabilities**: review-first safety guard, handwritten & printed support (English/Urdu/Hindi/Arabic), self-verification of line totals, per-store shorthand learning, multi-page merging.

### T5-2: Public Status Page ⚠️ DEFERRED
- **Work Item**: Public uptime/status page at `status.venqore.com` with real-time monitor.
- **Status**: Explicitly deferred. Reason: Requires provisioning an external uptime monitoring service (e.g., Better Uptime, Freshping, or UptimeRobot) and a subdomain DNS record — both are infrastructure decisions outside the scope of a code build phase and require operator/DevOps configuration that cannot be automated here.
- **What this means for the record**: The `Automated daily backups & public status monitoring` bullet point was removed from the AI Max tier tech specs in T5-1 precisely because the status page is not yet live. No claim is currently made on the pricing page about a public status page.
- **Resolution path**: Set up an uptime monitoring service, point `status.venqore.com` at it, and then the claim can be re-added to the pricing page truthfully.

### T5-3: Terms Consent & Data Privacy Schema ✅
- **Migration**: [`2026_08_05_000001_add_terms_consent_to_tenants.php`](file:///e:/AMD%20POS/AMD%20POS/database/migrations/2026_08_05_000001_add_terms_consent_to_tenants.php) — adds `terms_accepted_at`, `terms_version`, `shared_catalog_opt_out`, `ai_accuracy_opt_in` to `tenants`.
- **Model**: [`Tenant.php`](file:///e:/AMD%20POS/AMD%20POS/app/Models/Tenant.php) — fillable and casts added.
- **Store creation**: [`StoreController.php`](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/StoreController.php) — records `terms_accepted_at = now()` and `terms_version = 'v4.0'` on tenant creation.
- **Settings endpoint**: `POST /settings/data-privacy` handled by [`SettingsController::updateDataPrivacy()`](file:///e:/AMD%20POS/AMD%20POS/app/Http/Controllers/SettingsController.php).
  - Resolves tenant server-side only (no `tenant_id` accepted from the request — no cross-tenant vulnerability).
  - Fallback: if `current.tenant` is not bound (e.g. non-store-scoped routes), resolves via `Tenant::find(auth()->user()->last_store_id)`.
  - Uses `DB::table('tenants')->where('id', ...)->update(...)` to bypass anonymous subclass issues in tests.
  - `use App\Models\Tenant;` import added — latent class-not-found bug on the fallback path fixed.

### T5-4: Automated Scan Image Pruning ✅
- **Command**: [`app/Console/Commands/PruneScanImagesCommand.php`](file:///e:/AMD%20POS/AMD%20POS/app/Console/Commands/PruneScanImagesCommand.php) (`php artisan app:prune-scan-images`)
- **Behaviour**: Deletes scan image files older than the configured threshold (default 90 days). Never deletes database rows or extracted JSON data.
- **Schedule**: Registered in [`routes/console.php`](file:///e:/AMD%20POS/AMD%20POS/routes/console.php) at `03:30` daily via `Schedule::command('app:prune-scan-images')->dailyAt('03:30')->withoutOverlapping()->onOneServer()->name('prune-scan-images-90-day')`. Confirmed present by grep (line 298).

---

## 3. Automated Test Verification ([`tests/Feature/Phase5TruthAndTrustTest.php`](file:///e:/AMD%20POS/AMD%20POS/tests/Feature/Phase5TruthAndTrustTest.php))

| Test | Exercises | Status |
|------|-----------|--------|
| `it_records_terms_consent_and_version_on_store_creation` | Schema write, default values | ✅ |
| `it_updates_shared_catalog_opt_out_and_ai_accuracy_in_settings` | HTTP endpoint, `current.tenant` bound path | ✅ |
| `it_updates_data_privacy_via_fallback_when_current_tenant_not_bound` | Fallback path via `last_store_id`, Tenant import | ✅ |
| `it_executes_prune_scan_images_command_and_removes_old_files` | File deletion logic | ✅ |
| `it_verifies_pricing_tech_specs_contain_no_false_claims` | All 6 removed claims absent, 3 true claims present | ✅ |

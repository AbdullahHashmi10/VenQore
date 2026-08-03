# VenQore — Unhiding AI Scan (SmartCapture) + VenSynQ Pricing, Amazon-Only Sync, and Platform Toggles

**Written:** 2026-08-03
**Scope:** Make SmartCapture (AI Scan) and VenSynQ sellable end-to-end — pricing page, usage limits, entitlements, Amazon-only marketplace, Platform-Owner (Hashme) dashboard toggles, and production verification.
**Repo audited:** `E:\AMD POS\AMD POS` (Laravel 11 + Inertia/React, Lemon Squeezy billing)

---

## 0. Executive summary — what I found

You were right that "the pricing is already there but hidden." It is. But the audit turned up **five blockers that would break a real purchase**, not just cosmetic hiding. In priority order:

| # | Severity | Finding |
|---|----------|---------|
| B1 | 🔴 Critical | `EnsureVenSynQAccess` middleware exists but is **never applied to any route**. Neither the platform kill-switch nor the plan gate is enforced on `/vensynq/*`. |
| B2 | 🔴 Critical | Buying the **Amazon** sync add-on grants no entitlement. `ProvisionTenantJob` writes a `tenant_plan_overrides` row only for `woocommerce`. Amazon buyers would 403 the moment B1 is fixed. |
| B3 | 🔴 Critical | `BillingController::checkoutAddon` whitelist has **no `sync_amazon`**. There is no in-app path to buy Amazon sync at all. |
| B4 | 🟠 High | The pricing page's AI panel is wrapped in `{false && (…)}`. Because the only "Continue" button lives inside it, **steps 2–5 of the funnel (sync → onboarding → checkout → confirmation) are unreachable dead code.** |
| B5 | 🟠 High | `config('vensynq.simulation_mode')` **defaults to `true`**. If prod `.env` omits the flag, Amazon returns fake orders that post into a real ledger. |

Everything else — the AI tiers, prices, scan/query quotas, metering, the Lemon Squeezy variant mapping, the VenSynQ platform toggle — already exists and is correct. The work is unhiding, wiring, and gating.

---

## 1. Current state — the facts

### 1.1 Where the hidden pricing actually is

**File: `resources/js/Pages/Marketing/Pricing.jsx` (1,902 lines)**

| Lines | What | State |
|-------|------|-------|
| 182–195 | `AI_OPTIONS` — the four managed AI tiers with prices + quotas | Data present, rendered only inside the hidden block |
| 408–413 | `SYNC_CHANNELS` — WooCommerce / Amazon / eBay / TikTok, $10 (Rs 2,800) each | Data present, rendered only in step 2 |
| **784** | `{false && (` — opens the hidden **AI Configuration Panel** | **HIDDEN** |
| **1020** | `)}` — closes it | |
| 1006 | The `Continue` button → `setCurrentStep(3)` | Inside the hidden block |
| 1064–1109 | Comparison table | Visible, but has **zero rows** for AI Scan or VenSynQ |
| 1073 | `{false && <TableRow label="Barcode Scanner" …>}` | Unrelated leftover; decide separately |
| 416–425 | FAQs already describe BYOK $5 + managed AI billing | Visible — currently describes products the page doesn't show |

The hidden panel contains: the two plan-matched AI tier cards (price + queries/mo + scans/mo), the BYOK card, "Skip AI for now", the BYOK explainer, the card-requirement notice, and the summary + Continue CTA.

### 1.2 The pricing ladder that is currently invisible

**Managed AI add-ons** (`Pricing.jsx:183–194`, mirrored in `Billing/Index.jsx:1910–1913` and `ProvisionTenantJob.php:156–190`):

| Tier | Offered on | USD/mo | PKR/mo | Queries/mo | Scans/mo |
|------|-----------|--------|--------|-----------|----------|
| AI Core (`ai_starter`) | Starter | $3 | Rs 840 | 110 | 90 |
| AI Lite (`ai_lite`) | Starter, Growth | $5 | Rs 1,400 | 200 | 150 |
| AI Pro (`ai_pro`) | Growth, Enterprise | $15 | Rs 4,200 | 420 | 480 |
| AI Ultimate (`ai_ultimate`) | Enterprise | $25 | Rs 7,000 | 800 | 850 |
| BYOK (`ai_byok`) | All | $5 **one-time** | Rs 1,400 | unlimited (999,999) | unlimited |
| Free tier | All | $0 | — | — | **10 scans, lifetime** |

⚠️ The free tier's `10` is **hardcoded** in `AiEntitlementService::check()` (line ~92) and again in `Billing/Index.jsx:1821`. It is not a config value and not on the pricing page.

**Sync add-ons** — flat **$10 / Rs 2,800 per channel per month** (`Pricing.jsx:409–412`, `syncCostUSD = selectedSyncs.length * 10`).

**Technical limits that are nowhere on the pricing page** (`config/smartcapture.php`):

- `max_files` 5 per scan · `max_image_mb` 10 · `max_audio_mb` 25
- `rate_limit` 20/min per user; route throttle `throttle:20,1` on `/extract`, `30,1` on `/confirm`
- `single_flight_seconds` 180 (one scan at a time per store)
- `catalog_limit` 800 products sent as matching context
- `confidence_high` 90 / `confidence_low` 60

### 1.3 How entitlement actually works

```
tenant.ai_status ∈ {none, byok, managed}
tenant.ai_scans_used   / ai_scans_limit
tenant.ai_queries_used / ai_queries_limit
        ↓
App\Services\SmartCapture\AiEntitlementService::checkScan()
        ↓  (also honours)
PlanGate::check('smart_capture')  ←  plan_limits + tenant_plan_overrides
```

- `PlanFeatureMatrixSeeder.php:275` sets `smart_capture = '0'` for **every** plan. SmartCapture is add-on-only by design.
- `PlanFeatureMatrixSeeder.php:165` sets `vensync_command = '0'` for **every** plan. Same design.
- `ProvisionTenantJob.php` (Lemon Squeezy → provisioning) maps variant ID → `ai_status` + limits, writes `tenant_plan_overrides.smart_capture = '1'`, then calls `PlanRepository::invalidateTenantCache()`.
- `PlanGate::check()` treats a **missing** key as `null` = unlimited = allowed. So every boolean key must stay seeded, or the gate fails open.

### 1.4 VenSynQ current state

- `config/vensynq.php`: `enabled` default **false**, `simulation_mode` default **true**, `sandbox_mode` default false.
- `PlatformRegistry::MAP` registers all four: amazon, woocommerce, ebay, tiktok.
- `VenSynQController::settings()` ships `registry->supported()` (all four) to the UI.
- `resources/js/Pages/VenSynQ/Settings.jsx:190` **hardcodes** `['amazon','woocommerce','tiktok','ebay']` — it ignores the `platforms` prop for the card list.
- Platform toggle **exists**: `POST /superadmin/vensynq/toggle` → `Setting{key: 'vensynq_enabled', tenant_id: null}`, flushes `settings:global`, `vensynq_enabled_flag`, `schema_db_ready`. UI: `resources/js/Pages/Platform/Views.jsx:1048`.
- **No equivalent switch exists for SmartCapture.** Only the CLI `php artisan smartcapture:enable`.
- Amazon has **no inbound webhook**. SP-API is poll-based; sync is driven entirely by the scheduler (`routes/console.php:273–285`): `TokenRefreshJob` every 10 min, `VenSynQSyncJob` every 15 min. Cron + queue worker must be alive.

---

## 2. Decisions you need to make before I touch code

I have taken a position on each. Tell me where you disagree.

| # | Question | My recommendation |
|---|----------|-------------------|
| D1 | Do we sell **only Amazon** sync, or also keep WooCommerce (which is already LIVE and sold)? | Keep WooCommerce sold via its existing path; make **Amazon the only VenSynQ marketplace**. Hide eBay + TikTok everywhere. |
| D2 | Amazon price? | $10 / Rs 2,800 per month, matching `SYNC_CHANNELS`. |
| D3 | Free-tier scans — keep at 10? | Keep 10, but move it to `config/smartcapture.php` as `free_scan_allowance` and publish it on the pricing page as a trust signal. |
| D4 | Amazon marketplace region? | `config` currently defaults to **UK** (`A1F83G8C2ARO7P`) on the **EU** endpoint. If your first customers are US, this is wrong and must be set explicitly in prod `.env`. |
| D5 | PKR payment path? | Still unresolved from `PRODUCTION_SERVER_ACTIONS_REQUIRED.md` §9 — Lemon Squeezy does not settle PKR. Show PKR as "estimated, billed in USD" or build a manual activation flow. |
| D6 | Do lapsed/over-quota managed tenants hard-stop or degrade? | Current behaviour: hard-stop with an upgrade message unless they have their own key. Keep it. |

---

## 3. The plan — Phase by phase

---

### PHASE 1 — Fix the blockers (do this first; nothing else is safe without it)

#### 1.1 Apply the VenSynQ middleware — `routes/web.php:1230`

```php
// BEFORE
Route::prefix('vensynq')->name('vensynq.')->group(function () {

// AFTER
Route::prefix('vensynq')->name('vensynq.')
    ->middleware(\App\Http\Middleware\EnsureVenSynQAccess::class)
    ->group(function () {
```

Optionally register an alias in `bootstrap/app.php:39` (`'vensynq' => EnsureVenSynQAccess::class`) for readability.

⚠️ **This is a fail-closed change.** The moment it ships, every tenant gets 403 on `/vensynq/*` because `vensync_command = '0'` on all plans. Do 1.2 in the same deploy.

#### 1.2 Grant the gate key on Amazon purchase — `app/Jobs/ProvisionTenantJob.php` (~line 206)

The WooCommerce block writes an override. Generalise it so **every** purchased sync channel does:

```php
if (!empty($addonSyncs)) {
    $channels = $tenant->sync_channels ?? [];
    foreach ($addonSyncs as $ch) {
        if (!in_array($ch, $channels)) $channels[] = $ch;
    }
    $tenant->update(['sync_channels' => $channels]);

    // Per-channel gate key (existing behaviour for Woo)
    if (in_array('woocommerce', $addonSyncs)) {
        DB::table('tenant_plan_overrides')->updateOrInsert(
            ['tenant_id' => $tenant->id, 'override_key' => 'woocommerce'],
            ['override_value' => '1', 'reason' => 'Purchased WooCommerce sync add-on (Lemon Squeezy)',
             'updated_at' => now(), 'created_at' => now()]
        );
    }

    // NEW — any marketplace channel unlocks the VenSynQ Command Center
    $marketplaces = array_intersect($addonSyncs, ['amazon', 'ebay', 'tiktok', 'woocommerce']);
    if (!empty($marketplaces)) {
        DB::table('tenant_plan_overrides')->updateOrInsert(
            ['tenant_id' => $tenant->id, 'override_key' => 'vensync_command'],
            ['override_value' => '1',
             'reason' => 'Purchased sync add-on: ' . implode(', ', $marketplaces),
             'updated_at' => now(), 'created_at' => now()]
        );
    }
}
```

`PlanRepository::invalidateTenantCache($tenant->id)` is already called below — leave it.

#### 1.3 Add `sync_amazon` to the add-on checkout — `app/Http/Controllers/BillingController.php:820, 826`

```php
'addon_type' => 'required|string|in:ai_byok,ai_starter,ai_lite,ai_pro,ai_ultimate,sync_woocommerce,sync_amazon'
```

```php
'sync_amazon' => config('services.lemon_squeezy.amazon_addon_id'),
```

Also handle removal in `deactivateFeature()` (~line 1030) so cancelling Amazon strips both `sync_channels` and the `vensync_command` override (only if no other marketplace remains).

#### 1.4 Make simulation mode fail-safe — `config/vensynq.php:19`

```php
// Default to FALSE so a missing prod env var can never inject fake orders
// into a real ledger. Local dev opts IN via .env.
'simulation_mode' => env('VENSYNQ_SIMULATION_MODE', false),
```

Then add `VENSYNQ_SIMULATION_MODE=true` to your local `.env` so dev is unchanged.

**Phase 1 deliverable:** an Amazon purchase produces a tenant that can actually reach `/vensynq`, on real API calls.

---

### PHASE 2 — Amazon-only marketplace

#### 2.1 Config-driven allowlist — `config/vensynq.php`

```php
// Which marketplaces are sellable/connectable right now. eBay + TikTok are
// built but not launched; keep the adapters, hide the doors.
'enabled_platforms' => explode(',', env('VENSYNQ_ENABLED_PLATFORMS', 'amazon')),
```

#### 2.2 Registry honours it — `app/Services/VenSynQ/PlatformRegistry.php`

Add alongside `supported()` (leave `supported()` intact — `TokenRefreshJob`/`VenSynQSyncJob` must still resolve adapters for legacy Woo rows):

```php
/** Platforms a tenant may newly connect right now. */
public function enabled(): array
{
    $allow = array_map('strtolower', (array) config('vensynq.enabled_platforms', ['amazon']));
    return array_values(array_intersect(array_keys(self::MAP), $allow));
}

public function isEnabled(string $platform): bool
{
    return in_array($this->normalize($platform), $this->enabled(), true);
}

/** Validation rule for NEW connections only. */
public function enabledValidationRule(): string
{
    return 'in:' . implode(',', $this->enabled());
}
```

#### 2.3 Enforce on the connect paths — `app/Http/Controllers/VenSynQController.php`

- `connectChannel()` (line 126): change `supports()` → `isEnabled()`; message: *"{Label} sync isn't available yet."*
- `callbackChannel()` (line 151): same check — stops a hand-crafted callback creating an eBay channel.
- `storeChannel()` validation (line 406): `$this->registry->validationRule()` → `enabledValidationRule()`.
- `settings()` (line 744): `collect($this->registry->supported())` → `collect($this->registry->enabled())`.

#### 2.4 Frontend — `resources/js/Pages/VenSynQ/Settings.jsx:190`

Replace the hardcoded array with the server prop:

```jsx
{platforms.map(p => p.key).map(platform => {
```

The logo/description switches below (lines 213–216, 328–330) can stay — they simply won't render for hidden platforms.

#### 2.5 Marketing page — `resources/js/Pages/Marketing/VenSynQ.jsx:27–30`

Flip Amazon `COMING SOON` → `LIVE`; leave eBay/TikTok as COMING SOON. Update the hero copy at line 53–54 and the SEO description at line 36. Then send the waitlist email (`newsletter_subscribers` / Newsletter Hub) — that's the point of §22 in `PRODUCTION_SERVER_ACTIONS_REQUIRED.md`.

#### 2.6 Pricing page sync list — `Pricing.jsx:408–413`

Gate eBay/TikTok behind a `comingSoon: true` flag and render them greyed-out and unselectable, or drop them from the array. Recommendation: keep them visible but disabled with a "Coming soon" pill — it sells the roadmap without taking money for something that doesn't exist.

---

### PHASE 3 — Unhide the pricing page

#### 3.1 Remove the `false` guard — `Pricing.jsx:784` and `:1020`

Delete `{false && (` and its closing `)}`. The panel already self-guards on `{selectedPlan && …}` (line 789).

#### 3.2 Fix the broken funnel — `Pricing.jsx:449`

`handleContinue()` jumps to step **3** (onboarding), skipping step **2** (sync channels) entirely. Sync would never be sellable from the funnel.

```js
const handleContinue = () => {
    setCurrentStep(2);          // was 3 — go through sync selection first
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

Then verify the back-links: line 1248 (`→1`) and 1255 (`→3`) in `renderSyncStep`, 1489/1496 in onboarding, 1757 in confirmation. With step 2 restored, the chain is 1→2→3→4→5 and those numbers are correct as written.

#### 3.3 Publish the usage limits (the thing you actually asked for)

**(a) On the AI tier cards** — the quota pills at lines 858–863 already render `{opt.queries} Queries/mo` and `{opt.scans} Scans/mo`. They just need the panel unhidden. Add a one-line footnote under the grid:

> Unused scans don't roll over. Need more? Add your own API key (BYOK) for unlimited scans on your provider's billing.

**(b) New "AI & Automation" section in the comparison table** — insert after line 1109, using a new column-agnostic row style (these are add-ons, not plan features), or as a separate mini-table:

| | Free | AI Core | AI Lite | AI Pro | AI Ultimate | BYOK |
|---|---|---|---|---|---|---|
| AI Scans / month | 10 total | 90 | 150 | 480 | 850 | Unlimited* |
| AI Queries / month | — | 110 | 200 | 420 | 800 | Unlimited* |
| Files per scan | 5 | 5 | 5 | 5 | 5 | 5 |
| Max image / audio size | 10 MB / 25 MB | same | same | same | same | same |
| Scans per minute | 20 | 20 | 20 | 20 | 20 | 20 |
| Price | $0 | $3/mo | $5/mo | $15/mo | $25/mo | $5 once |

\* on your own API key, billed by your provider.

**(c) New VenSynQ rows:**

| | Starter | Growth | Enterprise |
|---|---|---|---|
| VenSynQ Command Center | Add-on | Add-on | Add-on |
| Amazon Marketplace Sync | $10/mo | $10/mo | $10/mo |
| WooCommerce Sync | $10/mo | $10/mo | $10/mo |
| eBay / TikTok Shop | Coming soon | Coming soon | Coming soon |
| Order sync frequency | Every 15 min | Every 15 min | Every 15 min |

**(d) Three new FAQ entries** — append to `FAQS` (line 415):

- *"How many AI scans do I get, and what happens when I run out?"* — quote the table, explain the hard-stop + BYOK escape hatch, confirm no surprise overage billing.
- *"What counts as one scan?"* — one document submission = one upstream AI request, up to 5 files. Corrections and re-reviews are free.
- *"Which marketplaces does VenSynQ support today?"* — Amazon and WooCommerce live; eBay and TikTok Shop on the roadmap.

#### 3.4 Make the numbers come from one place (recommended, not required)

Right now the tier quotas are duplicated in **three** files: `Pricing.jsx:183–194`, `Billing/Index.jsx:1910–1913`, `ProvisionTenantJob.php:156–190`. They currently agree. They will drift.

Create `config/ai_tiers.php` as the single source, expose it to Inertia via `HandleInertiaRequests`, and have `ProvisionTenantJob` read it. This is ~1 hour of work that prevents a class of "customer paid for 480 scans, got 150" bug. **I'd do it.**

#### 3.5 The Barcode Scanner row — `Pricing.jsx:1073`

`barcode_scanner` is `'1'` for every plan in the seeder, so the row is accurate. It was probably hidden by accident. Recommend unhiding it — it's a feature customers look for.

---

### PHASE 4 — Platform Owner (Hashme) dashboard toggles

The existing pattern is: `Setting{key, tenant_id: null}` → `SuperAdminController::saveSettings()` → cache flush → read at the enforcement point. Follow it exactly; don't build a new flag system.

#### 4.1 SmartCapture platform kill-switch

**`app/Http/Controllers/Admin/SuperAdminController.php:818`** — add to the `saveSettings` validation array:

```php
'smartcapture_enabled' => 'nullable|boolean',
'vensynq_enabled'      => 'nullable|boolean',   // so it's settable from the same form
```

and add a cache flush:

```php
\Illuminate\Support\Facades\Cache::forget('smartcapture_enabled_flag');
```

**New file `app/Http/Middleware/EnsureSmartCaptureAccess.php`** — mirror `EnsureVenSynQAccess` exactly:

```php
$dbValue = Cache::remember('smartcapture_enabled_flag', 60, fn () =>
    Setting::withoutGlobalScopes()->whereNull('tenant_id')
        ->where('key', 'smartcapture_enabled')->value('value')
);
$enabled = $dbValue !== null ? (bool) $dbValue : (bool) config('smartcapture.enabled', true);
if (!$enabled) abort(404);
```

Add `'enabled' => env('SMART_CAPTURE_ENABLED', true)` to `config/smartcapture.php`.

**`routes/web.php:405`** — apply it to the whole `smart-capture` prefix group:

```php
Route::prefix('smart-capture')
    ->middleware(\App\Http\Middleware\EnsureSmartCaptureAccess::class)
    ->group(function () { … });
```

**`app/Http/Middleware/HandleInertiaRequests.php`** — share `smartcapture_enabled` so the UI can hide the AI Scan button instead of showing one that 404s. (It already shares SmartCapture-related props — extend that block.)

**`resources/js/Components/OmniSearch.jsx`** — don't render the SmartCapture entry point when the flag is off.

#### 4.2 Dashboard UI — `resources/js/Pages/Platform/Views.jsx`

The VenSynQ switch is at line ~1048 (`handleToggleVensynq`), and there's a generic `handleToggleSetting(key, val, setter)` right below it. Add a **"Module Control"** card containing:

| Toggle | Setting key | Handler |
|--------|-------------|---------|
| VenSynQ Multi-Channel Engine | `vensynq_enabled` | existing `handleToggleVensynq` |
| SmartCapture / AI Scan | `smartcapture_enabled` | `handleToggleSetting` (already generic) |
| Amazon marketplace | `vensynq_platform_amazon` | `handleToggleSetting` |
| eBay marketplace | `vensynq_platform_ebay` | `handleToggleSetting` |
| TikTok Shop | `vensynq_platform_tiktok` | `handleToggleSetting` |

For the per-platform toggles, have `PlatformRegistry::enabled()` prefer the DB settings over the `.env` allowlist:

```php
public function enabled(): array
{
    return array_values(array_filter(array_keys(self::MAP), function ($p) {
        $db = SettingsHelper::global("vensynq_platform_{$p}");   // cached
        return $db !== null
            ? (bool) $db
            : in_array($p, config('vensynq.enabled_platforms', ['amazon']), true);
    }));
}
```

This gives you exactly what you asked for: flip Amazon on/off from the dashboard on the production server, no redeploy.

#### 4.3 Per-tenant AI grant UI (replaces the CLI)

`php artisan smartcapture:enable` works but needs SSH. The dashboard equivalent:

**New:** `POST /superadmin/tenants/{tenant}/ai-grant` → `SuperAdmin\TenantOverrideController::grantAi()`:

```php
$validated = $request->validate([
    'ai_status'        => 'required|in:none,byok,managed',
    'ai_scans_limit'   => 'nullable|integer|min:0',
    'ai_queries_limit' => 'nullable|integer|min:0',
    'reset_usage'      => 'nullable|boolean',
]);
```

- Writes `ai_status` / limits on the tenant
- Upserts `tenant_plan_overrides.smart_capture = '1'` (or deletes it for `none`)
- Optionally zeroes `ai_scans_used` / `ai_queries_used`
- Calls `PlanRepository::invalidateTenantCache($tenant->id)`
- Logs via `PlatformAuditLog::logAction('tenant.ai_grant', …)`

UI: extend `resources/js/Pages/SuperAdmin/Tenants/OverrideDetail.jsx` with an "AI Entitlement" card showing current status, used/limit bars, and a form. This also gives you a **monthly reset button** — worth noting that **there is currently no job that resets `ai_scans_used` at the start of a billing cycle.** See §6, open item O3.

---

### PHASE 5 — Production server changes

#### 5.1 `.env` additions on prod

```ini
# ── VenSynQ ──────────────────────────────────────────────
VENSYNQ_ENABLED=true
VENSYNQ_SIMULATION_MODE=false          # MUST be false — verify, don't assume
VENSYNQ_SANDBOX_MODE=false             # true only while testing with sandbox creds
VENSYNQ_ENABLED_PLATFORMS=amazon

VENSYNQ_AMAZON_CLIENT_ID=amzn1.application-oa2-client.<real>
VENSYNQ_AMAZON_CLIENT_SECRET=<real>
VENSYNQ_AMAZON_REDIRECT_URI=https://venqore.com/amazon/callback   # see 5.2
VENSYNQ_AMAZON_MARKETPLACE_ID=<your region — see D4>
VENSYNQ_AMAZON_BASE_URL=https://sellingpartnerapi-<region>.amazon.com
VENSYNQ_AMAZON_REFRESH_TOKEN=                                     # leave EMPTY in prod

# ── SmartCapture ─────────────────────────────────────────
SMART_CAPTURE_ENABLED=true
SMART_CAPTURE_PROVIDER=gemini
GEMINI_API_KEY=<real platform key>
SMART_CAPTURE_MODEL=gemini-2.5-flash
SMART_CAPTURE_PACE_MS=0                # 0 on a paid key; ~6500 on free tier
SMART_CAPTURE_RATE_LIMIT=20

# ── Lemon Squeezy add-on variants ────────────────────────
LEMON_SQUEEZY_AMAZON_ADDON_ID=<variant id>
LEMON_SQUEEZY_AI_STARTER_ADDON_ID=<variant id>
LEMON_SQUEEZY_AI_LITE_ADDON_ID=<variant id>
LEMON_SQUEEZY_AI_PRO_ADDON_ID=<variant id>
LEMON_SQUEEZY_AI_ULTIMATE_ADDON_ID=<variant id>
LEMON_SQUEEZY_AI_BYOK_ADDON_ID=<variant id>
```

#### 5.2 The redirect-URI mismatch — resolve before touching Amazon

There are **two** callback paths in the codebase:

- `routes/web.php:274` → `/amazon/callback` (`vensynq.universal.callback.amazon`) — the one built for the Amazon developer portal
- `routes/web.php:1254` → `/{store}/vensynq/callback/{platform}` — the tenant-scoped one
- `config/vensynq.php:31` default → `/vensynq/callback/amazon` — **matches neither**

`AmazonClient::getAuthorizationUrl()` builds the URL from `url(config('vensynq.platforms.amazon.redirect_uri'))`.

**Action:** pick `https://venqore.com/amazon/callback`, register exactly that in the Amazon LWA app, and set `VENSYNQ_AMAZON_REDIRECT_URI` to the full absolute URL. Then confirm `universalCallback()` (line 193) resolves the store slug correctly — it reads it from the OAuth `state` param. **Test this before anything else; a redirect-URI mismatch is the #1 cause of a dead OAuth flow.**

#### 5.3 Webhooks — what actually needs to exist

| Source | Endpoint | Status |
|--------|----------|--------|
| Lemon Squeezy | `/webhooks/lemon-squeezy` (`LemonSqueezyWebhookController`, signature-verified via `lemon-squeezy.signature` middleware) | ✅ Exists. Must be registered in the LS dashboard for `order_created`, `subscription_created`, `subscription_updated`, `subscription_cancelled`. |
| Amazon SP-API | — | ❌ **None needed.** SP-API is poll-based. If you later want push, that's SQS + Notifications API — a separate project. |
| WooCommerce | plugin-based | Unchanged. |

So: **no new webhook endpoints.** What you *do* need is the LS dashboard configured with the new Amazon + AI add-on products, pointing at the existing endpoint.

#### 5.4 Deploy sequence

```bash
php artisan down
git pull && composer install --no-dev -o
npm ci && npm run build
php artisan ziggy:generate                        # mandatory per CLAUDE.md — new routes exist
php artisan migrate --force
php artisan db:seed --class=PlanFeatureMatrixSeeder --force
php artisan config:clear && php artisan config:cache
php artisan route:clear  && php artisan route:cache
php artisan view:clear
php artisan cache:clear                           # REQUIRED — PlanRepository caches limits 1h
php artisan up
sudo supervisorctl restart all                    # queue workers pick up new job code
crontab -l | grep schedule:run                    # scheduler must be alive for VenSynQSyncJob
```

Then in the Platform dashboard: **VenSynQ ON**, **SmartCapture ON**, **Amazon ON**, eBay/TikTok OFF.

#### 5.5 Rollback

Every change is behind a flag. If Amazon misbehaves: toggle VenSynQ off in the dashboard (`vensynq_enabled = 0`) — `EnsureVenSynQAccess` starts 404-ing within 60 seconds (cache TTL). No deploy needed. Same for SmartCapture.

---

## 4. Production test runbook

Run in order. Do not skip step 0.

### Step 0 — Prove simulation mode is off
```bash
php artisan tinker --execute="dd(config('vensynq.simulation_mode'), config('vensynq.sandbox_mode'), config('vensynq.enabled_platforms'));"
# expect: false, false, ['amazon']
```
If `simulation_mode` is true, **stop**. Fake orders will post real journal entries.

### Step 1 — Toggles behave
1. Platform dashboard → VenSynQ **OFF** → visit `/{store}/vensynq` → expect **404** (within 60s).
2. Toggle **ON** → same URL → expect the Command Center or a 403 upgrade message (not 404).
3. SmartCapture **OFF** → AI Scan button gone from OmniSearch; `POST /{store}/smart-capture/extract` → 404.
4. Toggle back **ON**.

### Step 2 — Pricing page renders correctly
1. `https://venqore.com/pricing` — AI panel visible after selecting a plan.
2. Select **Growth** → AI Lite + AI Pro cards show `200 Queries/mo · 150 Scans/mo` and `420 · 480`.
3. Click **Continue** → lands on **step 2 (sync)**, not onboarding.
4. Amazon selectable; eBay/TikTok greyed with "Coming soon".
5. Comparison table shows the new AI and VenSynQ rows.
6. Toggle PKR/USD — every number converts; no `NaN`, no `$0`.
7. Server-rendered check (SEO — `PRODUCTION_SERVER_ACTIONS_REQUIRED.md` §6):
   ```bash
   curl -s https://venqore.com/pricing | grep -i "Scans/mo"
   ```

### Step 3 — SmartCapture, free tier
1. Fresh tenant, `ai_status = none`. Billing page shows `0 / 10` free scans.
2. Run one scan of a real invoice photo. Verify: extraction returns line items; `ai_scans_used` → 1; the Billing bar moves.
3. Confirm the scan cost **exactly one** upstream request (Gemini console / `storage/logs/laravel.log`).
4. Burn to 10. The 11th must return the `free_limit_reached` message from `AiEntitlementService::lockMessage()`.
5. Prompt-injection probe (still open from §15 of the prior doc): scan an invoice containing *"ignore previous instructions and…"*. Must return line items, not obedience.

### Step 4 — SmartCapture, BYOK ($5)
1. Buy BYOK through the real Lemon Squeezy checkout with a real card.
2. Watch: LS webhook 200 → `ProvisionTenantJob` in the queue → `tenant.ai_status = 'byok'` → `tenant_plan_overrides.smart_capture = '1'`.
3. Without a key configured: scan → `no_key` message.
4. Paste a Gemini key in AI settings → Test → Save → scan succeeds → `ai_scans_used` does **not** increment (BYOK isn't metered).
5. Fire the same webhook twice from the LS dashboard → no duplicate entitlement, no double charge.

### Step 5 — SmartCapture, managed tier
1. Buy **AI Lite** ($5). Verify `ai_status = 'managed'`, `ai_scans_limit = 150`, `ai_queries_limit = 200`.
2. Billing page shows `n / 150`.
3. Scan → counter increments.
4. Force `ai_scans_used = 150` in the DB → next scan returns the `limit_reached` message quoting `150/150`.
5. Add a personal key → scan proceeds (documented fallback in `AiEntitlementService`).

### Step 6 — Amazon sync, end-to-end (the real test)
1. Buy the **Amazon** add-on via Billing → Add-ons.
2. Verify after the webhook: `sync_channels` contains `amazon`; `tenant_plan_overrides` has `vensync_command = '1'`.
3. `/{store}/vensynq/settings` → only **Amazon** is offered.
4. Click **Connect Amazon** → real Seller Central OAuth → consent → returns to `/{store}/vensynq/settings` with a success flash and an `EcommerceChannel` row (`auth_method = 'oauth'`, refresh token stored, `refresh_token_expires_at ≈ +1 year`).
5. **Token test:** `POST /{store}/vensynq/channels/{id}/test` → green.
6. **Manual pull:** `POST /{store}/vensynq/sync-orders` → real orders appear. Verify against Seller Central line by line: SKU, qty, price, fees.
7. **Ledger truth:** each imported order creates a balanced journal entry, correct COGS, and the 15% Amazon fee lands in the "Amazon Fees" expense category (`upsertChannel`, line 802).
8. **Scheduled path:** wait 15 min, confirm `VenSynQSyncJob` ran on its own (`storage/logs`, or Horizon). This is what proves cron + queue are alive.
9. **Token rotation:** wait for `TokenRefreshJob` (10 min) — no spurious disconnect.
10. **Unhappy paths:** revoke the app in Seller Central → next sync marks the channel unhealthy with a clear message, does **not** get stuck in `sync_status = 'syncing'`.
11. **Negative:** try `/{store}/vensynq/connect/ebay` directly → refused, no channel created.

### Step 7 — Cancellation
1. Cancel the Amazon add-on in Lemon Squeezy.
2. `deactivateFeature` strips `sync_channels` and the `vensync_command` override.
3. `/{store}/vensynq` → 403 upgrade message.
4. The Amazon channel row is retained (not deleted) so re-subscribing restores it.

### Step 8 — Isolation
Two tenants, one with AI + Amazon, one without. Confirm zero bleed: quotas, channels, and orders stay separate.

---

## 5. Files touched — checklist

**Backend**
- [ ] `routes/web.php` — apply `EnsureVenSynQAccess` (:1230); apply `EnsureSmartCaptureAccess` (:405); new AI-grant route
- [ ] `app/Jobs/ProvisionTenantJob.php` — grant `vensync_command` for all marketplace add-ons
- [ ] `app/Http/Controllers/BillingController.php` — `sync_amazon` in `checkoutAddon` + `deactivateFeature`
- [ ] `app/Http/Middleware/EnsureSmartCaptureAccess.php` — **new**
- [ ] `app/Http/Middleware/HandleInertiaRequests.php` — share `smartcapture_enabled`, `vensynq_enabled`
- [ ] `app/Services/VenSynQ/PlatformRegistry.php` — `enabled()`, `isEnabled()`, `enabledValidationRule()`
- [ ] `app/Http/Controllers/VenSynQController.php` — 4 call sites (:126, :151, :406, :744)
- [ ] `app/Http/Controllers/Admin/SuperAdminController.php` — extend `saveSettings` whitelist + cache flush
- [ ] `app/Http/Controllers/SuperAdmin/TenantOverrideController.php` — `grantAi()`
- [ ] `config/vensynq.php` — `simulation_mode` default false; `enabled_platforms`
- [ ] `config/smartcapture.php` — `enabled`, `free_scan_allowance`
- [ ] `config/ai_tiers.php` — **new** (optional but recommended, §3.4)
- [ ] `bootstrap/app.php` — middleware aliases (optional)

**Frontend**
- [ ] `resources/js/Pages/Marketing/Pricing.jsx` — remove `{false &&` (:784/:1020); fix `handleContinue` (:449); AI + VenSynQ comparison rows; 3 FAQs; sync-channel coming-soon flags; unhide barcode row (:1073)
- [ ] `resources/js/Pages/Marketing/VenSynQ.jsx` — Amazon → LIVE (:28), hero copy, SEO description
- [ ] `resources/js/Pages/Marketing/SmartCapture.jsx` — remove "Coming Soon" (:43), waitlist → live CTA
- [ ] `resources/js/Pages/VenSynQ/Settings.jsx` — use `platforms` prop (:190)
- [ ] `resources/js/Pages/Platform/Views.jsx` — Module Control card
- [ ] `resources/js/Pages/SuperAdmin/Tenants/OverrideDetail.jsx` — AI Entitlement card
- [ ] `resources/js/Pages/Billing/Index.jsx` — Amazon add-on card; read quotas from shared config
- [ ] `resources/js/Components/OmniSearch.jsx` — hide AI Scan when flag off

**Tests** (`Tester/tests/Feature/`)
- [ ] VenSynQ access gate: platform off → 404; on + no entitlement → 403; on + override → 200
- [ ] `ProvisionTenantJob`: Amazon variant → `sync_channels` + `vensync_command` override
- [ ] Amazon-only: `connectChannel('ebay')` refused
- [ ] Entitlement: free 10-scan wall; managed limit wall; BYOK unmetered
- [ ] Pricing page renders the AI panel (Inertia assertion)

---

## 6. Open items I could not resolve from the code

| ID | Item | Why it needs you |
|----|------|------------------|
| O1 | Amazon marketplace ID + region | Config defaults to UK/EU. Wrong region = every API call 403s. |
| O2 | Redirect URI (§5.2) | Three candidate paths in the code; only you know what's registered in the Amazon developer portal. |
| O3 | **No monthly usage reset job exists.** | `ai_scans_used` never resets. A managed customer hits their cap in month 1 and is stuck forever. Needs a scheduled `ResetAiUsageJob` keyed to each tenant's billing anniversary — or at minimum a monthly `->monthlyOn(1, '00:05')` sweep. **This is a launch blocker for managed tiers.** |
| O4 | PKR payment path | Unresolved since 2026-07-03. Lemon Squeezy doesn't settle PKR. |
| O5 | Lemon Squeezy products | The five AI variants + Amazon variant must exist in the LS dashboard before any env var means anything. |
| O6 | Gemini quota | Managed tiers all run on **your** platform key. 850 scans/mo × N customers. Confirm your Gemini plan and billing alerts before selling AI Ultimate. |

---

## 7. Suggested sequencing

| Day | Work |
|-----|------|
| 1 | Phase 1 (blockers) + Phase 2 (Amazon-only). Local tests green. |
| 2 | Phase 4 (toggles + AI grant UI). Resolve O3 — the usage-reset job. |
| 3 | Phase 3 (pricing page unhide + limits + FAQs). Copy review. |
| 4 | Lemon Squeezy products created; Amazon developer app + redirect URI (O1, O2, O5). Deploy to prod with all toggles **OFF**. |
| 5 | Runbook steps 0–5 on prod (SmartCapture path) with toggles flipped on for your own test store only. |
| 6 | Runbook step 6 (Amazon, real Seller Central account). This is the long one. |
| 7 | Steps 7–8, monitoring, then unhide the pricing page publicly. |

**Ship order matters:** turn the *machinery* on before the *pricing page*. If the page goes live first, someone buys something that 403s.

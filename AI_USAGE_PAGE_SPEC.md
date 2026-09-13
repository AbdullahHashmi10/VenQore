# VenQore — Tenant-Facing "AI Usage" Page

**Date:** 2026-09-14
**Requested by:** Abdullah
**What's missing:** users have no page to see how much AI usage (scans/pages + AI rebuilds) they have left, when it resets, or a way to top up. Add one, reached from the bottom-left profile menu — same place "Profile Settings" and "Logout" live — styled like Claude's own usage bar.

This is an instruction document for the IDE. Every claim below is sourced from the actual codebase (files/lines quoted); do not re-derive the data model from scratch.

---

## 0. What already exists (build on this, don't duplicate it)

The metering system is already real and working — this is a **UI + one read endpoint** task, not a new tracking system.

**Per-tenant counters** — `tenants` table columns (see `app/Models/Tenant.php` fillable list):
- `ai_status` — `'none' | 'byok' | 'managed'`
- `ai_pages_used` / `ai_pages_limit` — AI **scan** credits (SmartCapture)
- `ai_queries_used` / `ai_queries_limit` — AI **query** credits (OmniSearch / assistant)
- `ai_descriptions_balance` — separate bucket for AI product-description generation
- `ai_period_started_at` — anniversary date the monthly counters reset on

**Gate logic** — `app/Services/SmartCapture/AiEntitlementService.php`:
- `checkScan()` / `checkQuery()` return `{allowed, reason, mode, pages_used, pages_limit}`
- `checkWarningThreshold()` already computes `'ok' | 'warning' (≥80%) | 'limit' (≥100%)` — **reuse this for the usage bar's color state**, don't reimplement the threshold
- `lockMessage()` has the canonical human copy for each lock reason — reuse, don't rewrite

**Reset job** — `app/Jobs/ResetAiUsageJob.php` zeroes `ai_pages_used`/`ai_queries_used` on the tenant's `ai_period_started_at` anniversary day each month. This is the authoritative "resets on" date.

**Plan allowance source** — `app/Services/PlanAiAllowance.php` — the limits above are populated from `plan_limits` (`ai_pages_limit`, `ai_queries_limit`) whenever a plan is applied. `config/plans.php` / the seeder also carry `ai_credits_monthly` and `ai_scans_monthly` — **note the naming split**: `ai_credits_monthly` in the plan matrix is not currently wired to `ai_pages_limit`/`ai_queries_limit` on the tenant row. Confirm which is actually authoritative before displaying a number — see Open Question 1 below.

**Detailed event log** — `ai_usage_events` table (migration `2026_08_04_000001`) — one row per AI call: `feature`, `model`, `pages`, `prompt_tokens`, `output_tokens`, `cost_usd`, `success`, `created_at`, keyed by `tenant_id`. This is what powers a "usage over time" breakdown if wanted later; not required for v1 but don't build a competing log.

**Add-ons already priced and purchasable** (`config/pricing.php:203-217`):
- `ai_topup` — $10 / 1,000 credits, `purchasable: true`, has a real LemonSqueezy `variant_id` (`LEMON_SQUEEZY_AI_TOPUP_ADDON_ID`) — **this is the top-up button's destination**.
- `ai_rebuilds` — $10 / 5 structural rebuilds, currently `purchasable: false` (no variant wired) — decide whether to wire it or hide the CTA (Open Question 2).
- The Platform Owner side already has a matching entitlement: `config/addon_entitlements.php` → `'ai_topup' => ['+ai_credits_monthly' => 1000]`. **This currently increments a `plan_limits` override key (`ai_credits_monthly`), not the tenant's `ai_pages_limit` column** — this is the same naming-split issue as above and must be resolved as one thing, not two (Open Question 1).

**Already shared to every Inertia page** — `app/Http/Middleware/HandleInertiaRequests.php:203-217`, under the `plan` prop:
```php
'plan' => [
    'slug'     => ...,
    'features' => ...,
    'limits'   => ...,
    'usage'    => [
        'skus' => ..., 'staff' => ..., 'locations' => ...,
        'ai_pages' => $tenant->ai_pages_used ?? 0,
    ],
],
```
`ai_pages_used` is already global on every page load. `ai_pages_limit`, `ai_queries_used/limit`, `ai_status`, and `ai_period_started_at` are NOT yet shared — add them to this same block so the sidebar can render a live mini-bar without a fetch (see §2).

---

## 1. Open questions to settle before building (ask the user, don't guess)

1. **Which number is the real monthly allowance the user sees?** There appear to be two parallel concepts: (a) `tenant.ai_pages_limit` / `ai_queries_limit`, driven by `PlanAiAllowance` + `AiEntitlementService` and already enforced at the point AI features run; (b) `ai_credits_monthly` in `config/plans.php` / plan_limits, which the pricing docs and the Platform Owner add-on system reference. If these are meant to be the same allowance under two names, pick one and make the other an alias; if they're genuinely different things (e.g. pages vs. a unified "credits" number the marketing site promises), the usage page must show whichever one the pricing page promises, or it will look wrong to the tenant on day one.
2. **Is "AI rebuild" a real, live feature yet?** `ai_rebuilds` add-on exists in pricing config but is `purchasable: false` with no LemonSqueezy variant, and grep shows no `ai_structural_rebuilds` counter anywhere except the add-on entitlement map added in the last audit fix. If AI Structural Rebuild isn't shipped yet, the usage page should either omit that row entirely or show it as "Coming soon" rather than a live 0/5 bar.
3. **Scans vs Queries vs Descriptions — one bar or three?** The tenant currently has three separate meters (`ai_pages`, `ai_queries`, `ai_descriptions_balance`). Claude's own usage UI is one bar because there's one thing being metered. Decide: show one primary bar (pick the one used across `checkScan`) with the others as secondary rows, or show all three as separate bars.

**Recommendation if no time to decide now:** ship v1 showing `ai_pages_used / ai_pages_limit` as the primary "AI Scans" bar (this is the one actually gating today's core feature, SmartCapture) with Queries as a secondary row, put AI Rebuilds behind a "Coming soon" pill, and file a follow-up to unify the `ai_credits_monthly` naming.

---

## 2. Backend changes

### 2.1 Share full AI usage snapshot to every page
`app/Http/Middleware/HandleInertiaRequests.php` — extend the existing `plan.usage` block (don't create a parallel prop):

```php
'usage' => [
    'skus'      => ...,
    'staff'     => ...,
    'locations' => ...,
    'ai' => [
        'status'          => $tenant->ai_status ?? 'none',
        'pages_used'      => (int) ($tenant->ai_pages_used ?? 0),
        'pages_limit'     => $tenant->ai_pages_limit,       // null/-1 = unlimited
        'queries_used'    => (int) ($tenant->ai_queries_used ?? 0),
        'queries_limit'   => $tenant->ai_queries_limit,
        'descriptions_balance' => $tenant->ai_descriptions_balance,
        'period_started_at'    => optional($tenant->ai_period_started_at)->toISOString(),
        'resets_on'             => self::nextAiResetDate($tenant), // see helper below
        'warning_state'   => app(\App\Services\SmartCapture\AiEntitlementService::class)->checkWarningThreshold(),
    ],
],
```

Add a small private helper (or a static on `AiEntitlementService`) `nextAiResetDate(Tenant $tenant): string` that reuses `ResetAiUsageJob`'s own logic (anniversary day of `ai_period_started_at`, falling back to the 1st) so the displayed date can never drift from what the job actually does — do not hand-roll a second copy of that date math.

Keep this cheap: it's four already-loaded tenant columns plus one already-existing service call, no new query.

### 2.2 New controller + route for the full usage page
A new controller, e.g. `App\Http\Controllers\AiUsageController@index`, tenant-scoped (behind the normal tenant/auth middleware, not SuperAdmin):

```php
Route::get('/ai-usage', [AiUsageController::class, 'index'])->name('ai-usage.index');
```

`index()` returns an Inertia page with:
- Everything in the shared `plan.usage.ai` block above (or just read it from there client-side — no need to duplicate).
- Recent usage: `DB::table('ai_usage_events')->where('tenant_id', $tenant->id)->latest()->limit(50)->get(['feature','model','pages','cost_usd','success','created_at'])` — a simple recent-activity list. This table already exists and is already populated by `AiUsageRecorder`; just read it.
- The add-on catalogue entries relevant to AI, filtered from `config('pricing.add_ons')` to `ai_topup` (and `ai_rebuilds` once purchasable), so the page can render real prices/credit amounts without hardcoding them into the frontend.
- A checkout link/button for `ai_topup`: reuse whatever `LemonSqueezyCheckoutService` already builds for add-on purchase elsewhere (check `app/Services/LemonSqueezyCheckoutService.php` for an existing "buy this add-on" method before writing a new one).

---

## 3. Frontend changes

### 3.1 Sidebar entry point (both variants of the menu)
`resources/js/Layouts/OneGlanceLayout.jsx` has **two** copies of the profile popup — the compact one around line 1451–1494 and the expanded/mobile one around line 1976–1985. Add the same link to both, directly under "Profile Settings" and above the divider/Logout, e.g.:

```jsx
<Link href={route('ai-usage.index')} className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors text-sm font-medium text-ink-secondary dark:text-ink">
    <Sparkles size={16} /> AI Usage
    {/* small colored dot when warning_state !== 'ok', pulling from the shared plan.usage.ai prop */}
</Link>
```
Use the `warning_state` already computed server-side (`'ok'|'warning'|'limit'`) to color a small badge/dot on this menu item itself — amber at 80%+, red at 100% — so the warning is visible without opening the page, exactly like Claude's own sidebar indicator.

### 3.2 The AI Usage page itself
New Inertia page, e.g. `resources/js/Pages/AiUsage/Index.jsx`. Structure, modeled on Claude's own usage view:

- **Header**: "AI Usage" + plan name + "Resets on {resets_on}".
- **Primary bar** — AI Scans (or whichever Open Question 1 resolves to): a horizontal progress bar, `pages_used / pages_limit`, with the numeric fraction printed next to it ("342 / 500 used") and percentage. Color: brand color under 80%, amber 80–99%, red at 100% (drive this off `warning_state`, don't recompute the threshold client-side).
- **Secondary row(s)**: AI Queries meter in the same style, smaller. AI Descriptions balance if still a live feature.
- **Unlimited / BYOK state**: when `ai_status === 'byok'` or `pages_limit === -1`, don't show a bar at all — show "Unlimited (your own API key)" per the existing `lockMessage()`/mode vocabulary, since a 0-width or fake-full bar would be misleading.
- **"Buy more" panel**: the `ai_topup` add-on card (price, credit amount, one button that hits the checkout link from §2.2). If `ai_rebuilds` isn't live yet, show it grayed out with "Coming soon" per Open Question 2, don't fake a purchase button that goes nowhere.
- **Recent activity table** (optional but recommended, data already available): last 50 `ai_usage_events` rows — feature, date, pages, success/fail. Gives the user something concrete when they wonder "what used my credits."
- **Empty/zero state**: a brand-new tenant with `ai_status = 'none'` sees the free-tier framing (`AiEntitlementService::freeScanAllowance()`, currently 10) instead of a confusing 0/0 bar.

### 3.3 Design system
Match `VenQore Design System v6 (COMPLETE standalone).html` tokens (the IDE already used these for the Platform Owner override panel — same rounded-2xl, glass borders, Space Grotesk tabular numerals for the used/limit figures).

---

## 5. Platform Owner side — AI Usage & Cost Dashboard

The owner needs a companion page in `/VenQore` (not the tenant-facing one above) that answers: *how much AI are my customers using, and what is it costing me on the provider bill, so I know how much to keep funded?*

### 5.1 What already exists to build this from
- **`ai_usage_events`** — every AI call, any tenant, with `cost_usd`, `model`, `provider`, `feature`, `success`, `created_at`. This is the entire dataset; no new tracking needed.
- **`ai_spend_counters`** (`app/Services/Ai/AiSpendGuard.php`) — already tracks **daily spend per scope**, and `AiGateway::resolve()` (`app/Services/Ai/AiGateway.php:214-247`) already reserves against a `"{$feature}:platform"` scope — i.e. a whole-platform daily cap already exists per feature. Read these rows for a live "today's spend so far" figure instead of summing `ai_usage_events` live (cheaper, and it's literally the number already enforcing the cap).
- **`config/ai_pricing.php`** — the $/token rate card per model, already used by `AiUsageRecorder::calculateCost()`. Use this to project *forward* cost (e.g. "at this week's pace, ~$X this month") rather than inventing a separate estimate.
- **`config/ai_limits.php`** — per-feature `spend_cap` (daily USD ceiling per scope) — show these caps next to actual spend so the owner sees headroom, not just a raw number.

### 5.2 New Platform Owner page
`App\Http\Controllers\SuperAdmin\AiCostController@index`, route under the existing `/VenQore` `SuperAdminMiddleware` group (`platform.ai-usage.index` or similar, alongside `platform.plans.*`).

Sections:

1. **Cost summary (top)**
   - **Today's spend** — sum `ai_spend_counters.spend_usd` for `day = today` across every scope, or `SUM(cost_usd)` from `ai_usage_events` for today if per-scope granularity isn't needed — pick one source of truth and label it clearly (don't show two numbers that can disagree).
   - **This month's spend** — `SUM(ai_usage_events.cost_usd)` where `created_at` is in the current calendar month.
   - **Trailing 30-day trend** — small sparkline/bar chart, one point per day, from `ai_usage_events` grouped by date.
   - **Daily spend caps configured** (`config/ai_limits.php` `spend_cap` per feature, plus any global caps) shown as reference lines/ceiling, so the owner can see "today's spend vs. the ceiling that would start blocking users."

2. **Per-tenant breakdown (table)**
   - Group `ai_usage_events` by `tenant_id` for the selected period (today / 7d / 30d / custom): total cost, total calls, most-used feature, last active.
   - Sort by cost descending by default — surfaces the tenants actually driving spend.
   - Link each row to that tenant's `TenantOverrideController::show()` page (already built) so the owner can jump straight to granting/adjusting that tenant's AI limits if one customer is an outlier.
   - Flag `ai_status = 'byok'` tenants distinctly — their usage costs the owner nothing (they use their own key), so they shouldn't be counted in "what I'm paying for."

3. **Per-provider / per-model breakdown**
   - Group by `provider` + `model` — this is what actually maps to the owner's real invoices (Gemini bill, OpenAI bill, etc.), so it should be the section that lets him reconcile against what he's actually being charged.

4. **Budget / top-up awareness section** (the "how much should I keep funded" ask)
   - Show the platform's own AI provider account balance if the provider API exposes it (check whether `AiGateway`/`ModelResolver` already calls a balance-check endpoint for any provider — if not, this is a "nice to have, needs a provider API call" item, not a v1 blocker).
   - Failing a live balance API, show: this month's spend so far, average daily spend over the trailing 7 days, and a simple projection ("at this rate, ~$X by month end") — enough for Abdullah to decide when to top up manually on the provider's own dashboard.
   - Do NOT attempt to auto-charge or auto-topup a third-party AI provider account from inside VenQore unless a provider explicitly supports it via API — that's a different, much bigger feature and not what was asked for here (this ask is *visibility*, not automated billing).

### 5.3 Design
Same `/VenQore` shell/design tokens as the other Platform Owner pages built in the gating-audit pass (`Plans/Index.jsx`, `Tenants/OverrideDetail.jsx`) — reuse their stat-tile and table components rather than inventing new ones.

### 5.4 Acceptance test
1. Owner opens the page: sees today's total AI spend, this month's total, and a 30-day trend that matches manually summing `ai_usage_events.cost_usd` for a spot-checked day.
2. Per-tenant table, sorted by cost, correctly excludes BYOK tenants from the "costs me money" total but still shows their call volume.
3. Per-model breakdown sums match the per-tenant totals (no double-counting or dropped rows).
4. Clicking a tenant row lands on that tenant's existing override page.
5. The daily spend figure never exceeds what `AiSpendGuard`/`ai_spend_counters` would report for the same scope+day — i.e. the dashboard and the actual enforcement mechanism agree.

---

## 4. Acceptance test (tenant-facing page)
1. As a tenant on a managed plan with `ai_pages_used` at 85% of `ai_pages_limit`: the sidebar profile menu shows an amber dot next to "AI Usage" without opening anything.
2. Open the AI Usage page: bar is amber, shows the correct fraction and percentage, and "Resets on" matches the date `ResetAiUsageJob` will actually fire for this tenant (same anniversary day as `ai_period_started_at`).
3. Push usage to 100% (or simulate): bar turns red, an in-product AI feature call now returns the existing `limit_reached` lock message, and the sidebar dot is red.
4. Click "Buy more AI credits" → lands on a real LemonSqueezy checkout for the `ai_topup` variant, not a dead link.
5. A BYOK tenant (`ai_status = 'byok'`) sees "Unlimited (your own key)", not a bar.
6. A brand-new trial tenant (`ai_status = 'none'`) sees the free 10-scan allowance framing, not 0/0.
7. Recent activity list shows real rows if the tenant has used AI features, and a clean empty state if not.

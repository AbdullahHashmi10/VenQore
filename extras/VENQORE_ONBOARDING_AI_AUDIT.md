# VenQore — Onboarding & AI Backend Audit
**Date:** 19 Aug 2026 · **Scope:** `app-code/main-app` — AI builder, module system, onboarding flow, trial/billing, AI key gating

---

## Verdict in one line

**The module system is real and well built. The AI is not connected to anything, and the onboarding flow you described exists only about 40%.** Two competing onboarding implementations exist, both bypass the safe pipeline, and one of them cannot succeed at all because of a column-name bug.

---

## 1. Do we really have the modules? — YES

`config/modules.php` — 46 modules, properly declared with `requires`, `requires_one`, `conflicts`, `aliases`, `owns_data`, `permissions`, `status`.

| status | count |
|---|---|
| live | 42 |
| beta | 2 |
| building | 2 |

Supporting layer, all real and correct:

- `ModuleService` — read side, cached, fails open for unconfigured tenants. Solid.
- `ModuleDependencyResolver` (379 lines) — dependency + conflict resolution. Solid.
- `ConfigurationValidator` (376) — validates untrusted AI JSON, strips Qore keys, drops hallucinations. Solid.
- `ApplyConfigurationService` (269) — single writer, transaction, version snapshot, undo. Solid.
- `tenant_modules` + `tenant_config_versions` migrations — correct.
- `config/ai_builder.php` — an excellent 522-line spec: 10 safety rules, pipeline, 15 presets, prompt builder, fixtures.

**So the foundation is genuinely good.** Everything below is about the fact that nothing in production calls it.

---

## 2. Can the AI actually combine modules? — NO

### 2.1 The AI transport is not implemented
`app/Services/AiBuilder/ConfigurationAIService.php:298`

```php
protected function call(string $system, string $user): array
{
    ...
    throw new \RuntimeException('Wire ConfigurationAIService::call() to your model client.');
}
```

There is **no LLM call anywhere in the builder**. The whole guard stack around it (`AiRateLimiter`, `AiSpendGuard`, `AiUsageRecorder`, spend cap, confidence floor, demand log) is written and unused.

### 2.2 The entire AiBuilder pipeline is dead code
Grep for production callers of `ConfigurationAIService`, `ConfigurationValidator`, `ApplyConfigurationService`, `ModificationParser`, `ModuleDependencyResolver` outside their own folders:

> **Zero hits in `app/Http/Controllers` and `routes/`. Only tests reference them.**

Meaning in production today: no validation, no Qore strip, no dependency resolution, no conflict check, no "proposal before apply", no versioning, no undo. Safety rules 3–8 and 10 are currently unenforced — not because they're wrong, because nothing runs them.

### 2.3 What actually runs instead: an if/else chain
`WorkspaceBuilderController::analyze()` (the live public path) is 6 hardcoded `str_contains` branches. `OnboardingExperienceController::aiDiscovery()` is a second, different copy — and its loop is backwards:

```php
// aiDiscovery(), line 55 — needle and haystack swapped
if (str_contains(strtolower($preset['label']), $promptLower))
```

`$promptLower` is the user's whole sentence, so this only matches if a preset label *contains the entire prompt*. It effectively never fires.

### 2.4 Both controllers reference presets that don't exist
Referenced: `solo_cafe`, `wholesaler`, `retail_grocery`.
Defined in `config/ai_builder.php`: `pos_only, retail_shop, grocery, pharmacy, cafe, restaurant, bakery, mobile_electronics, clothing, hardware_store, wholesale, multi_branch_retail, freelancer, salon, repair_workshop`.

`solo_cafe` is the **default** in both controllers and is also hardcoded in the landing page CTA (`LandingPage.jsx:1397` → `/build-workspace?preset=solo_cafe`). Every unmatched visitor silently falls through to a generic 5-module stub.

### 2.5 `blocked_by` is ignored
`freelancer`, `salon`, `repair_workshop` are flagged `blocked_by: ['services', ...]` — not shippable until Services is live. `ApplyConfigurationService::applyPreset()` refuses them correctly; **the live controllers don't check at all**, so a prompt saying "freelance" or "repair" provisions a workspace built on non-live modules.

---

## 3. Critical bugs

### 3.1 Signup is broken — wrong column name
`WorkspaceBuilderController::provision():176` writes `'is_enabled' => true`.
The migration defines the column as **`enabled`** (and `source` as a required enum).

Once `tenant_modules` exists, every provision throws, gets caught, and returns
`{"success": false, "message": "Workspace provisioning failed: ..."}`. **Public signup does not complete.**

### 3.2 Module selection has no effect (both controllers)
Both write rows only for the **selected** modules. `ModuleService::allFor()` returns `$map[$key] ?? true` — a module with no row is **enabled**. So deselecting a module leaves it on. Only `ApplyConfigurationService` writes the full 46-row set (enabled true *and* false), which is exactly why it should be the only writer.

### 3.3 Cache never invalidated
Neither controller calls `ModuleService::invalidate()`. Reconfiguration is stale for up to 300s.

### 3.4 Two conflicting `tenant_modules` schemas in the same codebase
`OnboardingExperienceController` writes `enabled` + `source`; `WorkspaceBuilderController` writes `is_enabled`. Textbook symptom of not having one write path.

---

## 4. Your intended flow vs. what's built

| Step you described | Status |
|---|---|
| Landing page chat box → AI understands the business | ⚠️ Box exists (`LandingPage.jsx:1371`), routes to `/build-workspace?prompt=` — but no AI behind it |
| "Or pick your business type" button | ⚠️ One hardcoded CTA to a non-existent preset; no picker grid |
| Show everything they'll be able to do (POS receipts, recipes, production, batches, expenses…) | ✅ Built — `capabilities` map in `analyze()`, rendered as cards |
| "Want to add more features?" — browse full catalog | ❌ **Missing.** Users can only toggle *off* the suggested set. No access to the other ~30 modules |
| "We're combining everything — fill this small form meanwhile" | ❌ **Fake.** `startBuildAnimation()` is a 4.4-second `setInterval` with zero backend work; provisioning runs *after* it, at the end |
| Ask how many people they are | ❌ **Missing entirely.** No team-size question anywhere in the flow |
| Show plans / pricing / billing, let them choose | ❌ **Missing from onboarding.** `config/plans.php` + `config/pricing.php` exist and are complete, but the builder never surfaces them |
| Take email, start 14-day free trial | ⚠️ Email taken; **trial never actually starts** — see below |
| AI add-ons: free tier on free key, paid tier on dedicated key | ⚠️ Architecture exists, **leaks the paid key** — see §6 |

---

## 5. The 14-day trial does not exist

`WorkspaceBuilderController::provision()` sets:

```php
'plan'   => 'trial',
'status' => 'active',      // ← not 'trial'
// trial_ends_at is never set — anywhere in the codebase
```

Consequences:

- `ProcessExpiredTrials` filters `where('trial_ends_at', '<', now())` → **never matches**.
- `SendTrialWarnings` / `SendTrialReminders` filter `status = 'trial'` → **never matches**.
- Net effect: **every self-serve signup is a permanent free account.** No expiry, no reminder emails, no conversion prompt.

Nothing sets `trial_ends_at` in any controller or service — only `SuperAdminController` *extends* an existing one manually.

---

## 6. AI key gating — the paid key leaks to free users

You asked specifically that non-paying users never touch the paid key. Current state:

**Correct:** `AiEntitlementService` implements the model properly — `byok` / `managed` / `free` (10 lifetime scans) / `staff`, with page counting and thresholds.

**Correct:** `AiController::search()` only reaches for the platform key when `$check['mode'] === 'managed'`.

**Broken:** `AiExtractionService::resolveConfig()` (line 126) picks the free key **only** when `$feature === 'public_tool'`:

```php
if ($feature === 'public_tool') {
    $key = config('smartcapture.free_api_key') ?: ... ;   // free key
} else {
    $key = config('smartcapture.gemini_key') ?: config('smartcapture.api_key');  // PAID key
}
```

`SmartCaptureController:89` calls `resolveConfig('scan')`. So a **free-tier tenant's 10 free scans run on the paid/dedicated platform key**, not `SMART_CAPTURE_FREE_API_KEY`. The free key is used for one feature only.

**Fix:** branch on entitlement mode, not feature name — `mode === 'free'` → free key; `mode === 'managed'` → paid key; `mode === 'byok'` → tenant key. `resolveConfig()` should take the entitlement result as an argument.

Also note: LemonSqueezy add-on variant IDs (`ai_topup`, `byok`, `staff_seat`, `location_seat`) are all `REPLACE_ME` placeholders — no add-on can actually be purchased yet.

---

## 7. Security & data issues in `provision()`

`POST /workspace/provision` is **unauthenticated, unthrottled, and unverified**:

1. **No rate limit** → anyone can mass-create tenants + users.
2. **No email verification** → tenants on unowned addresses.
3. **`password` is nullable** → falls back to `Str::random(12)` which is never shown or emailed. The user is logged in via session and can *never log back in*.
4. **`modules` comes straight from the client** and is written to the DB with no registry check, no `status` check, no plan check. A crafted request can enable `beta`/`building` modules, or write junk keys. (`ModuleService::write()` guards against this — but `provision()` bypasses it with a raw `DB::table()` call.)
5. **Existing-user hijack:** if the email already exists, it silently attaches a brand-new tenant to that account without any auth check.

`OnboardingExperienceController::completeOnboarding()` also returns **fabricated data** to the UI: `'months_tracked' => 8` and `'stock_value' => 847300` are hardcoded.

---

## 8. Recommended fix order

**P0 — signup is currently broken / unsafe**
1. Fix `is_enabled` → `enabled` (+ add `source`) in `WorkspaceBuilderController:176`. *(1 line)*
2. Rate-limit + require verified email on `/workspace/provision`; require a password or send a set-password link.
3. Set `status = 'trial'` and `trial_ends_at = now()->addDays(14)` at provision.
4. Delete one of the two onboarding controllers. Keep `WorkspaceBuilder` (it's the public path), retire `OnboardingExperienceController::aiDiscovery`.

**P1 — make the good code actually run**
5. Route both controllers through `ApplyConfigurationService::apply()` / `applyPreset()`. This alone fixes §3.2, §3.3, §3.4, and the `blocked_by` hole, and gives you versioning + undo for free.
6. Fix the preset key names (`solo_cafe`/`wholesaler`/`retail_grocery` → real keys) or add those presets. Fix the landing-page CTA.
7. Implement `ConfigurationAIService::call()` against your existing Gemini client and wire `analyze()` to `propose()`, with the if/else chain demoted to `guessPreset()` fallback (which is already written and is *better* than the current logic — it scores against module aliases).

**P2 — the missing flow steps**
8. Add a "browse all capabilities" step so users can add modules, not just remove them.
9. Add team-size → plan recommendation → pricing/billing selection screens between `identity` and `account`.
10. Make the build animation await a real provisioning request instead of a `setInterval`.

**P3 — AI billing correctness**
11. Rewrite `resolveConfig()` to branch on entitlement mode, so free users only ever hit `SMART_CAPTURE_FREE_API_KEY`.
12. Fill in the LemonSqueezy variant IDs before shipping add-ons.

---

## Files referenced

- `app/Http/Controllers/WorkspaceBuilderController.php`
- `app/Http/Controllers/OnboardingExperienceController.php`
- `app/Services/AiBuilder/{ConfigurationAIService,ApplyConfigurationService,ConfigurationValidator,ModificationParser}.php`
- `app/Services/ModuleService.php`, `app/Engines/ModuleDependencyResolver.php`
- `app/Services/SmartCapture/{AiExtractionService,AiEntitlementService}.php`
- `app/Http/Controllers/AiController.php`
- `config/{modules,ai_builder,pricing,plans,smartcapture}.php`
- `database/migrations/2026_08_16_000000_create_tenant_modules_table.php`
- `resources/js/Pages/Workspace/BuildWorkspace.jsx`, `resources/js/Pages/LandingPage.jsx`
- `routes/web.php:818-820`, `routes/web.php:1025-1028`

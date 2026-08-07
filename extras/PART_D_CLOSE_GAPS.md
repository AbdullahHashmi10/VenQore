# Part D — Closing Prior Open Gaps

**Scope:** Canonical codebase at `E:\AMD POS\AMD POS`. Excluded from content search per instructions: `AMD_POS_Update_v4.2.7\`, `_VERIFICATION_BASELINE_2026-07-10\`, `Tester\`, `FinalTester\`, `VenQore_Local\` (grepped for existence/dates/config-references only, not content).

**Method:** grep/read of actual source, `git log`, `.gitignore`, `git ls-files`, and CI workflow files. Every claim is sourced to a real file or command output. Anything not directly confirmed is marked "not confirmed."

---

## 1. Is `app/Models/PlanFeature.php` (distinct from `PlanLimit`) used anywhere at runtime?

**Answer: No — not for gating. It is only used by the SuperAdmin plan-editor for CRUD/duplication, never read by any enforcement path.**

Evidence:

- `grep -rn "PlanFeature::"` across `app/`, `resources/`, `routes/`, `database/`, `config/` (excluding the 5 excluded dirs) returns exactly **one hit**, and it's a relationship definition, not a query:
  ```
  app/Models/Plan.php:48:        return $this->hasMany(PlanFeature::class)->orderBy('sort_order');
  ```
- `grep -rn "->features("` (the Eloquent relation exposed by that line) across the same scope returns exactly **two hits**, both in one file, both admin-side plan management — never in `PlanGate.php`, `PlanRepository.php`, `EnsurePlanFeature.php`, or any controller that serves the tenant-facing app:
  ```
  app/Http/Controllers/SuperAdmin/PlanController.php:31:   $plans = Plan::with(['platform', 'limits', 'features'])
  app/Http/Controllers/SuperAdmin/PlanController.php:201-202:
      foreach ($plan->features as $feature) {
          $newPlan->features()->create($feature->only(['feature', 'is_included', 'tooltip', 'sort_order']));
      }
  app/Http/Controllers/SuperAdmin/PlanController.php:218:  $plan->delete(); // Cascades to plan_limits and plan_features
  ```
  Line 31 loads `features` only to display it in the SuperAdmin plan list/editor UI. Lines 201–202 are "duplicate plan" logic (copy feature rows to a new plan). Line 218 is a cascade-delete comment.
- `grep -rln "plan_features"` (the underlying table name) across the scope returns only:
  - `app/Http/Controllers/SuperAdmin/PlanController.php` (as above)
  - `database/migrations/2026_04_21_000004_create_plan_features_table.php` — the schema definition (`plan_id, feature, is_included, tooltip, sort_order`)
  - `database/database.sqlite` (a binary artifact, not source)
- No occurrence of `PlanFeature` or `plan_features` in `app/Services/PlanRepository.php`, `app/Services/PlanGate.php`, or `app/Http/Middleware/EnsurePlanFeature.php` — the three files that constitute the actual runtime entitlement chain (confirmed in the prior `PLAN_ENTITLEMENT_SOURCE_OF_TRUTH.md`).

**Conclusion:** `PlanFeature` / `plan_features` is a standalone table that only the SuperAdmin plan-editor screen reads and writes (for display and for "duplicate this plan" convenience). It is not consulted by `PlanRepository::getEffectiveLimit()`, `PlanRepository::canUseFeature()`, `PlanGate::check()/enforce()`, or `EnsurePlanFeature` middleware. This resolves the prior audit's open question #1 ("is `PlanFeature` actually consulted anywhere at runtime, or is it purely pricing-page marketing copy?") — it is neither: it's SuperAdmin-only admin-copy data, not runtime gating, and not directly rendered to prospects either (no hits for `plan->features` or `PlanFeature` in any `resources/js/Pages/Marketing/**` file).

---

## 2. Does `routes/api.php` apply `plan.feature:` middleware the same way `routes/web.php` does?

**Answer: No. `routes/web.php` uses `plan.feature:` 134 times. `routes/api.php` uses it zero times.**

```
grep -c "plan.feature:" routes/web.php   →  134
grep -c "plan.feature:" routes/api.php   →  0
```

`routes/api.php` is only 108 lines total (full file read). Every route in it, tabled below:

| Route | Middleware | Plan-gated? |
|---|---|---|
| `GET /user` | `auth:sanctum` | No |
| `POST /heartbeat` | `throttle:60,1` | No |
| `POST /terminal/activities` | `throttle:60,1` | No |
| `POST /terminal/screenshot` | `throttle:60,1` | No |
| `GET /check-connection` | none | No |
| `GET /sync/users` | `auth:sanctum` (group) | No |
| `GET /sync/products` | `auth:sanctum` (group) | No |
| `GET /sync/customers` | `auth:sanctum` (group) | No |
| `GET /sync/suppliers` | `auth:sanctum` (group) | No |
| `GET /sync/inventory` | `auth:sanctum` (group) | No |
| `GET /sync/taxes` | `auth:sanctum` (group) | No |
| `POST /sync/orders/batch` | `auth:sanctum` (group) | No |
| `POST /webhooks/lemon-squeezy` | `lemon-squeezy.signature` | No (webhook, N/A) |
| `POST /webhooks/pusher` | none | No |
| `GET /pos/search` | `auth:sanctum`, `throttle:pos` (group) | No |
| `GET /pos/featured` | `auth:sanctum`, `throttle:pos` (group) | No |
| `GET /pos/categories` | `auth:sanctum`, `throttle:pos` (group) | No |
| `GET /pos/barcode/{code}` | `auth:sanctum`, `throttle:pos` (group) | No |
| `POST /woo/webhook/{uuid}` | none (HMAC in controller) | No (webhook, N/A) |
| `GET /woo/verify/{token}` | none | No |
| `POST /woo/handshake` | none | No |
| `POST /drm/validate` | none | No |
| `GET /drm/protected` | `drm.license` | No |
| `POST /{store_slug}/chatbot/session` | `throttle:5,1`, `visitor.chat.guard` | No |
| `POST /{store_slug}/chatbot/session/{uuid}/message` | `throttle:15,1`, `visitor.chat.guard` | No |
| `POST /{store_slug}/chatbot/session/{uuid}/typing` | `throttle:15,1`, `visitor.chat.guard` | No |
| `GET /{store_slug}/vena/context` | none | No |
| `POST /{store_slug}/vena/assist` | none | No |

**Note on `/pos/*` and `/sync/*` routes:** these are the API-backed replacements the codebase comments describe as "Phase 3.1: POS Product Search API — replaces the `Product::get()` timebomb in `PosController`." POS search/sync is a core feature every tenant plan is expected to use, so the absence of `plan.feature:` gating there is arguably correct (POS access itself isn't a paid add-on). But **`woocommerce` is a paid add-on per the seeder** (`PlanFeatureMatrixSeeder.php`: `'woocommerce' => ['trial'=>'0','starter'=>'0','growth'=>'0','business'=>'0']`, off by default on every plan, granted only via `tenant_plan_overrides`), and `routes/api.php`'s `/woo/webhook/{uuid}`, `/woo/verify/{token}`, and `/woo/handshake` endpoints carry **no plan-feature check at all** — only signature/token verification. This means: a store whose `woocommerce` entitlement is `0` (not purchased) could still have its webhook/handshake endpoints hit and processed by anyone who obtains the UUID/token, because the API layer never asks "does this tenant actually have the WooCommerce feature?" The gating for WooCommerce (per `MASTER_PLAN_ENTITLEMENT_MATRIX.md` findings) appears to live only in `routes/web.php`'s admin-facing config screens, not on the API ingress points that actually process the synced data.

**Conclusion:** `routes/api.php` does not apply the `plan.feature:` middleware pattern at all — it relies on `auth:sanctum`, throttling, and endpoint-specific signature/token checks instead. This is a structurally different (and for the WooCommerce webhook endpoints specifically, weaker) gating model than `routes/web.php`.

---

## 3. Is sidebar/nav menu item visibility gated by the same entitlement system as routes, or separately/inconsistently?

**Answer: Separately and inconsistently, on two different axes that don't talk to each other.**

The real application shell (not the unused Breeze scaffold — see note below) is `resources/js/Layouts/OneGlanceLayout.jsx` (1905 lines).

**Axis 1 — top-level menu item visibility is gated by user role/permission only, not by plan/feature:**

```js
// resources/js/Layouts/OneGlanceLayout.jsx:484-485
const userPerms = props.auth?.user?.permissions || [];
const hasAnyPerm = (...keys) => keys.some(k => userPerms.some(p => p === k || p.startsWith(k + '.')));
```
```js
// resources/js/Layouts/OneGlanceLayout.jsx:712-744
const menuItems = rawMenuItems.filter(item => {
    // Exclude VenSynQ if disabled platform-wide
    if (item.name === 'VenSynQ' && !vensynq_enabled) { return false; }
    // Exclude chatbot links for non-platform-staff
    if (item.name === 'Agent Inbox' || item.name === 'Chatbot Settings') {
        const isStaff = isPlatformAdmin || !!props.auth?.user?.is_platform_staff;
        if (!isStaff) return false;
        if (isStarterOrLtd1) return false;   // <- the one place plan tier directly excludes a top-level item
    }
    // Platform admin sees all items in any mode
    if (isPlatformAdmin) return true;
    // Store owner, admin, and manager: see all store menu items
    if (userRole === 'owner' || userRole === 'admin' || userRole === 'manager') return true;

    const required = MENU_PERMISSIONS[item.name];
    if (item.name === 'Home') return true;
    if (!required || required.length === 0) return false;

    return required.some(req =>
        userPerms.some(p => p === req || p.startsWith(req + '.'))
    );
});
```
`MENU_PERMISSIONS` (lines ~695-708) maps menu names to permission-string prefixes (e.g. `'Staff Summaries': ['users']`), entirely independent of `store.features` / plan entitlement. Owner/admin/manager roles bypass this filter and see every top-level menu item regardless of what their plan actually entitles them to (i.e., a Starter-tier owner still sees the "Money → Fund Management" and "VenSynQ → Growth" groups in the nav — see Axis 2 below for what happens inside them).

**Axis 2 — sub-items inside a visible menu are separately marked `locked` using the `store.features` namespace (the same namespace read by `PlanGate.jsx`/`FeatureLock.jsx` per the prior audit, NOT the `usePlan.js`/`plan.features` namespace):**

```js
// resources/js/Layouts/OneGlanceLayout.jsx:508
{ group: 'Post-Sale', items: ['Returns History',
    { label: 'Invoice Reminders', locked: !store?.features?.invoice_reminders },
    { label: 'Recurring Invoices', locked: !store?.features?.recurring_invoices }] },
// :531
{ group: 'Manufacturing', items: [
    { label: 'Production', locked: !store?.features?.production },
    { label: 'Cookbook', locked: !store?.features?.bill_of_materials }] }
// :550
{ group: 'Banking', items: [
    { label: 'Fund Management', locked: !store?.features?.fund_management }, 'Bank Accounts',
    { label: 'Bank Reconciliation', locked: !store?.features?.bank_reconciliation }] },
// :560
{ group: 'Promotion', items: [
    { label: 'Email Marketing', locked: !store?.features?.email_marketing },
    { label: 'SMS Marketing', locked: !store?.features?.sms_marketing },
    { label: 'Campaigns', locked: !store?.features?.campaigns }] },
// :571
{ group: 'Growth', items: [!store?.features?.growth_engine ? { label: 'Growth Engine', locked: true } : 'Growth Engine'] },
```

So there are **two independent, non-communicating gating mechanisms** stacked in the same component:
1. Whether the **menu item (parent)** shows at all → role/permission string match against `MENU_PERMISSIONS`, with plan tier (`isStarterOrLtd1`) hard-coded as a special case for exactly one item ("Agent Inbox"/"Chatbot Settings").
2. Whether a **sub-item** renders `locked` (presumably shown greyed-out/with an upgrade prompt rather than hidden) → `store?.features?.<key>` boolean read directly off the Inertia shared prop, with no fallback to `PlanRepository`/`PlanGate` server-side logic if that prop is stale or wrong.

Because owner/admin/manager roles bypass permission filtering entirely (line 730: `if (userRole === 'owner' || ... ) return true;`), the *only* gate a Starter-tier store owner encounters for a paid add-on like Growth Engine, Fund Management, or Email Marketing is the `locked` flag on the sub-item — driven by `store.features`, a client-provided prop, not the `plan.feature:` backend middleware directly. If `store.features` is ever out of sync with what `EnsurePlanFeature` middleware would compute server-side (which the prior audit's §3 already showed happening for Growth Engine and WooCommerce in `Billing/Index.jsx` and `WhatIsIncluded.jsx`), the sidebar and the actual route enforcement can disagree — the sidebar might show an item as unlocked while the route middleware 403s it, or vice versa.

**Note on `AuthenticatedLayout.jsx`:** `resources/js/Layouts/AuthenticatedLayout.jsx` (182 lines, full file read) is a vanilla Laravel Breeze scaffold layout with a single "Dashboard" nav link and no menu/permission/feature logic whatsoever. It does not appear to be the layout the live POS/admin app uses (no `menuItems`, `MENU_PERMISSIONS`, or `store.features` references at all) — it looks like leftover scaffold, not wired to the real navigation. This wasn't in scope to trace call-sites for, but is worth flagging: if it's dead code, no impact; if any page still imports it, that page's nav would show none of the plan/permission gating described above at all.

**Conclusion:** Sidebar/nav visibility is **not** gated by the same single entitlement system as routes. It uses (a) a hand-maintained `MENU_PERMISSIONS` role-string map for top-level items — a system with no relationship to `plan_limits`/`PlanRepository` at all — and (b) a direct read of the `store.features` Inertia prop for sub-item lock icons, which is one of the two competing frontend prop namespaces already flagged as inconsistent in `PLAN_ENTITLEMENT_SOURCE_OF_TRUTH.md` §3. Route-level enforcement (`EnsurePlanFeature` / `plan.feature:` in `routes/web.php`) is a third, separate mechanism that the sidebar does not call into or validate against.

---

## 4. Excluded duplicate folders — confirmed-dead or genuinely unclear

| Folder | Last modified (dir mtime) | In `.gitignore`? | Git-tracked (`git ls-files`)? | Referenced by build/CI? | Verdict |
|---|---|---|---|---|---|
| `AMD_POS_Update_v4.2.7\` | 2026-07-03 17:11 | Yes — `AMD_POS_Update_*/` (line 40) and `AMD_POS_Update_v*/` (line 51) | No tracked files found | No hits in `.github/workflows/*`, `package.json`, or `composer.json` | **Confirmed dead** — untracked, gitignored, no build/CI/deploy reference. Local-only leftover extraction. |
| `_VERIFICATION_BASELINE_2026-07-10\` | 2026-07-10 22:30 | Yes — `/_VERIFICATION_BASELINE_*/` (line 50) | No tracked files found | No hits | **Confirmed dead** — untracked, gitignored, no reference anywhere. `.gitignore`'s own comment (lines 44-48) explicitly calls this and `VenQore_Local/` out: *"L001: prevent future full-codebase duplicate snapshots from being committed... The existing tracked VenQore_Local/ and _VERIFICATION_BASELINE_*/ dirs should be removed in a dedicated cleanup commit."* (Note: the comment says they were "tracked" historically — they are not tracked in the current `git ls-files` output, meaning that cleanup already happened, or they were added after the ignore rule and never committed.) |
| `Tester\` | 2026-08-03 15:25 (dir); newest file timestamps found under `Tester/VerificationCenter/` ~2026-08-04 | Only partially — `.gitignore` excludes just `/Tester/dashboard/` (line 37) and `Tester/VerificationCenter/runs/*` (line 76, with an explicit `!.../latest.json` exception at line 78) | **Yes — actively tracked** (`Tester/.env.testing`, `Tester/Golden/dashboard/*`, `Tester/tests/...`, etc. all appear in `git ls-files`) | **Yes — wired directly into CI.** `.github/workflows/venqore-tests.yml` runs `vendor/bin/pest Tester/tests/Feature/Module01` through `Module20` (all 20 test modules) as the project's actual feature-test suite on every push/PR to `main`, `develop`, `release/**` | **Confirmed live and load-bearing.** This is not a duplicate project copy — it is the canonical automated test harness the CI pipeline runs. It must not be treated as dead weight; excluding it from *content* audits here was correct scoping, but it should not be deleted or ignored broadly. |
| `FinalTester\` | 2026-08-03 15:21 (dir); newest file timestamps under `FinalTester/reports/` ~2026-08-04 | **No entry found** in `.gitignore` at all | **Yes — tracked** (`FinalTester/.env.testing`, `FinalTester/.gitignore` [a nested gitignore], `FinalTester/Documentation/ARCHITECTURE.md`, `FinalTester/Documentation/ROUTE_SWEEP.md`, `FinalTester/Documentation/TEST_INVENTORY.md`, etc.) | **No reference found** in `.github/workflows/*`, `package.json`, or `composer.json` | **Genuinely unclear.** It is git-tracked (so not abandoned/orphaned in the VCS sense) and has recent activity (`reports/last-run.json`, `logs/last-run.log`, `reports/junit.xml`, `reports/route-coverage.json` all dated within the last few days), but nothing in CI or build scripts invokes it — it appears to be run manually/locally rather than as part of the automated pipeline `Tester/` is wired into. Its own nested `.gitignore` and `Documentation/` folder (`ARCHITECTURE.md`, `ROUTE_SWEEP.md`, `TEST_INVENTORY.md`) suggest it's a second, parallel test-harness effort, possibly newer than or overlapping with `Tester/`. Recommend the founder clarify whether `FinalTester` is the intended successor to `Tester` (and CI should be updated to point at it) or a stale/experimental parallel effort that should be removed — evidence here does not resolve which. |
| `VenQore_Local\` | 2026-06-08 00:54 | Yes — `/VenQore_Local/` (line 49), grouped with the same "L001" comment as `_VERIFICATION_BASELINE_*` above | No tracked files found | No hits | **Confirmed dead** — oldest mtime of the five, untracked, gitignored, explicitly named in the .gitignore's own "these dirs confuse which file is real, keep them out of version control" comment. |

---

## 5. Origin of the "226" / "226+" features number

**Confirmed origin found.** The earliest commit introducing the string `"226+"` in any `.md` or source file is:

```
commit d8e827fd2048e169ab57d89f65751f19a577f2a4
Date: 2026-06-28 16:04:00 +0500
design: enhance landing page layout with custom background assets and catalog documentation
```

That commit **adds** `VenQore_Product_Catalog.md` (388 new lines) containing:

```
# VenQore — Complete Platform Guide
**All-in-One Retail POS & Business Management Platform**
226+ Features · 40+ Reports · Double-Entry Accounting · AI-Powered Intelligence
...
| 226+ Features | 40+ Reports | 635+ Tests Passed | 5 Audit Layers |
```

The same commit also edits a marketing page's meta description and hero copy to say `226+ features, 40+ reports, AI growth engine` and `226+ Features · One Source of Truth`.

No number-derivation, feature-count script, or enumerated list of exactly 226 items was found anywhere in the codebase — `grep` for a literal computed count (e.g., a feature array of length 226, or a comment like "counted N features") returned nothing. The number appears to originate as an authored marketing figure in `VenQore_Product_Catalog.md` on 2026-06-28, not as output of any counting mechanism. Whether 226 was itself derived from counting something at the time of writing (e.g., a spreadsheet, a feature list elsewhere) is **not confirmed** — no such source document was found in the git history search performed.

It has since propagated into (currently present in the working tree, non-excluded scope):
- `resources/js/Pages/Marketing/About.jsx:83` — `'226+ features grew on top of that engine...'`
- `resources/js/Pages/Marketing/About.jsx:139` — animated counter: `{ e: 226, s: '+', l: 'Features' }`
- `resources/js/Pages/Marketing/Shared/FeatureDemos.jsx:964` — comment: `(sourced from the VenQore Product Catalog — 226+ features)`, explicitly citing `VenQore_Product_Catalog.md` as its source.

Additional planning/strategy documents (found via the same `-S"226+"` git pickaxe search, in commits `91e3d03d` "docs: add final launch readiness audit and master implementation plan" and `dbb54423` "checkpoint: save uncommitted changes before release verification") repeat the figure alongside a companion "tests passed" figure that itself drifted over time — one planning doc snapshot says "635+ Tests Passed," a later one (per the existing marketing-copy "Banned" list quoted in the same file) explicitly flags **"636 tests" as stale, superseded by "1,000+ automated tests."** This confirms the adjacent test-count figure has already drifted and been manually corrected once; the "226+" features figure shows no equivalent correction or recount in the history searched, i.e. it has not been revisited since its introduction on 2026-06-28 as far as this search can confirm.

**Conclusion:** Origin confirmed to commit `d8e827fd` / file `VenQore_Product_Catalog.md`, 2026-06-28. Whether 226 is currently accurate against the live codebase's actual feature count is **not confirmed** — no evidence of a recount or audit against source code was found, and the adjacent test-count figure in the same family of documents is known (by the marketing copy's own "banned/stale" list) to have drifted at least once already.

---

## Open questions for the founder

1. **`PlanFeature` model/table:** it is confirmed unused for runtime gating — only SuperAdmin plan-editor CRUD reads/writes it. Should it be removed entirely, repurposed as the actual pricing-page data source (replacing the hardcoded `featureGroups.js` / `WhatIsIncluded.jsx` copies flagged in the prior audit), or left as-is as admin-only bookkeeping? As it stands it's a fourth silent, disconnected copy of "what features exist."

2. **WooCommerce API ingress (`routes/api.php`):** `/woo/webhook/{uuid}`, `/woo/verify/{token}`, `/woo/handshake` have no `plan.feature:woocommerce` check — only signature/token verification. Is this intentional (because the UUID/token itself is only issued to tenants who purchased the add-on, making the plan check redundant), or is this a genuine gap where a tenant whose WooCommerce entitlement lapsed/was never purchased could still have data synced through these endpoints if the token leaked or wasn't revoked on downgrade?

3. **Sidebar top-level menu items are not plan-gated at all for owner/admin/manager roles** — only sub-items carry a `locked` flag driven by `store.features`. Is it acceptable that a Starter-tier store owner sees the full "Money," "VenSynQ," and "Sell" menu trees (with individual sub-items greyed out) rather than the entire section being hidden or a clearer upsell surface shown? And should `MENU_PERMISSIONS` (role-based) and `store.features` (plan-based) be merged into one gating check so a future menu item can't accidentally be added with only one of the two protections?

4. **`FinalTester\` vs `Tester\`:** both are git-tracked; only `Tester/` is wired into `.github/workflows/venqore-tests.yml`. Is `FinalTester` a newer replacement that CI should be updated to use, an experimental fork that should be deleted, or a separate manual/local verification tool that's intentionally outside CI? Its `Documentation/ROUTE_SWEEP.md` and `Documentation/TEST_INVENTORY.md` suggest real recent effort went into it — worth a direct decision rather than letting two test harnesses drift in parallel.

5. **`AuthenticatedLayout.jsx`:** appears to be unused Breeze scaffold (no menu/permission/feature logic at all, unlike the real `OneGlanceLayout.jsx`). Worth a quick confirmation of whether any live page still imports it — this audit did not trace call-sites, only read the file's own content, so it is not confirmed dead, only confirmed to contain none of the gating logic the rest of the app relies on.

6. **"226+ features":** confirmed to originate in `VenQore_Product_Catalog.md` (2026-06-28) as an authored marketing figure, not a computed count. Has anyone recounted actual shippable features against this number since June 28? Given the adjacent test-count figure in the same document family already drifted and had to be corrected ("636 tests" → "1,000+ automated tests" per the marketing copy's own banned-terms list), is there a real, current count backing "226+," or should it be re-verified before continued use in marketing copy?

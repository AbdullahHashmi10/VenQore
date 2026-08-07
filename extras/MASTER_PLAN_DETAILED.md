# VenQore — Full Detailed Master Plan

This is the complete, unabridged version — every task, every sub-step, from all 4 phases,
pulled together in one place. For the short version, see `MASTER_PLAN_SUMMARY.md`. For the
history of how we got to each decision, see `DECISIONS_LOG.md`.

**Folder reorganization is now done** (per founder confirmation) — Phase 3 below is kept for
the record, marked complete.

---

# PHASE 0 — Pricing Fix (Critical, do first)

**Why this matters:** Real, live dollar amounts shown to paying customers don't match your
actual pricing rules. This is a trust and revenue-integrity issue, not a cosmetic bug.

**File:** `TASK_0_PRICING_FIX_HANDOFF.md`

### Task 0a — Remove LTD pricing from the public Pricing page
- `resources\js\Pages\Marketing\Pricing.jsx`: remove the `ltd` fields from the hardcoded
  fallback object (`defaultPricesUSD.starter.ltd`, `.growth.ltd`, `.enterprise.ltd`, lines ~140-144).
- Find and remove whatever UI element currently displays LTD pricing to public visitors (a
  monthly/annual/lifetime toggle, or a dedicated LTD section) — search the file for `ltd`
  case-insensitively.
- Check the `marketing.pricing` route (`web.php:30-43`) — if it passes LTD plan data
  (`ltd_1/ltd_2/ltd_3`) to this public page via `Plan::with(['limits','features'])`, filter it
  out server-side too, not just in the frontend rendering (defense in depth).
- Check other public marketing pages (`Features.jsx`, `About.jsx`, `Roadmap.jsx`) for any LTD/
  lifetime price mentions and remove them.
- Do NOT touch `Billing\Index.jsx` — LTD pricing stays there for logged-in tenants.

### Task 0b — Fix LTD prices where they legitimately remain (Billing page)
- `resources\js\Pages\Billing\Index.jsx` `PLAN_META` object: change `ltd_1` price from `$79` to
  `$99`. Change `ltd_3` price from `$399` to `$349`. (`ltd_2` at `$199` is already correct.)
- Grep the rest of the codebase for other literal `$79`/`$399` occurrences near "ltd"/"lifetime"
  strings, in case the sweep missed a copy.
- Confirm `config/pricing.php` remains the single source these values are set from — no change
  needed there, it's already correct.

### Task 0c — Fix the hidden fallback price table
- `Billing\Index.jsx:884,887` has a ternary fallback (`selectedPlan === 'counter' ? 18 : ...`)
  with wrong values for starter/growth/business.
- First trace whether this code path is actually reachable by a real customer (find every place
  `targetPlanModel`/`currentPlanModel` get set, confirm under what conditions they could be null).
- Fix the numbers regardless (`starter: 36, growth: 63, business: 129`) — cheap insurance even if
  currently unreachable, since a future refactor could make it reachable.
- Add a comment noting this fallback should always mirror `config/pricing.php`.

### Task 0d — Remove the old AI pricing scheme entirely
- Delete the `ai_starter/ai_lite/ai_pro/ai_ultimate` array/object in `Billing\Index.jsx`
  (~lines 1911-1914).
- Find whatever component/dropdown reads from it and repoint it to the real
  `spark/shop/pro/max` data (from the shared `pricing.ai_tiers` prop or `config('pricing.ai_tiers')`).
- Grep the whole codebase (`resources/js/`, `app/`, `resources/views/`) for
  `ai_starter|ai_lite|ai_pro|ai_ultimate` to confirm nothing else references the old scheme
  (old migrations, email templates, tests) — fix anywhere else it's found.
- Confirm Spark/Shop/Pro/Max quotas match `config/pricing.php` exactly after the swap.

### Task 0e — Verify
- Load the public Pricing page logged out — confirm zero LTD/lifetime pricing appears anywhere.
- Log in as an LTD-eligible tenant — confirm $99/$199/$349 show correctly.
- Confirm the AI add-on selector shows only Spark/Shop/Pro/Max, correct prices and quotas, no
  trace of the old naming anywhere in the rendered UI or codebase.
- If Task 0c's fallback table was found reachable, manually trigger it in staging to confirm
  the fix works.

---

# PHASE 1 — Plan Entitlement Consolidation

**Why this matters:** Multiple disconnected copies of "what does this plan include" exist across
the codebase, and two of them are already proven wrong (Growth Engine, WooCommerce) — customers
could pay for something and then get blocked from using it.

**File:** `ENTITLEMENT_FIX_HANDOFF.md`

### Task 1 — Bundle Growth Engine into Growth & Business plans (real backend change)
- Confirmed via grep: Growth Engine makes zero external AI API calls — pure local computation,
  no marginal cost. Founder decision: make it genuinely included, not just advertised as included.
- `database\seeders\PlanFeatureMatrixSeeder.php`: change `growth_engine` row from
  `['trial'=>'0','starter'=>'0','growth'=>'0','business'=>'0']` to
  `['trial'=>'0','starter'=>'0','growth'=>'1','business'=>'1']`. Add a dated comment explaining why.
- `config\plans.php`: update matching `growth_engine` value for growth/business blocks from
  `false` to `true`; update the now-inaccurate inline comment.
- Check `config\pricing.php` `ltd_plans` — decide whether `ltd_2`/`ltd_3` (≈Growth/Business)
  should also get it, for consistency with their tier mapping.
- Re-seed so existing tenants pick up the change, WITHOUT wiping `TenantPlanOverride` rows —
  confirm the safe reseed method for this project before running it.
- Check `PlanRepository::canUseFeature()` for any hardcoded blanket rule that might still block
  AI-prefixed features regardless of the seeder value — confirm none exists.
- Verify: log in as a Growth or Business test tenant, confirm Growth Engine routes now return
  200 instead of 403.

### Task 2 — Fix WooCommerce false-promise UI (and confirm Growth Engine copy is now accurate)
- `WhatIsIncluded.jsx` (~line 162): Growth Engine row is now correct given Task 1 — verify only.
  Check for any WooCommerce row implying inclusion in any base plan — fix to show "add-on only."
- `Billing\Index.jsx` `FEATURE_UPGRADE_TARGET` map: `growth_engine: 'growth'` is now correct,
  leave as-is with a comment. `woocommerce: 'growth'` is wrong — remove it from this map or add
  a parallel `ADD_ON_FEATURES` set with a "Purchase add-on" CTA instead of "Upgrade" CTA.
- `UpgradeModal.jsx`: Growth Engine reference now accurate, no change. Any WooCommerce reference
  gets the same add-on-CTA treatment as above.
- `SuperAdmin\Plans\featureGroups.js` (~line 1748): update the hardcoded `growth_engine` values
  to match Task 1 (`growth: "1", business: "1"`) — stopgap until Task 4 removes hardcoding entirely.
- Grep `resources/js/Pages/Marketing/` for any other WooCommerce references implying inclusion,
  fix any found.
- Naming collision cleanup: `Pricing.jsx` and `WhatIsIncluded.jsx` both label the Growth
  *subscription tier* "Growth Engine" — same string as the AI feature. Rename tier references to
  something unambiguous (e.g. "Growth" or "Growth Plan"), reserve "Growth Engine" for the feature only.

### Task 3 — Add an automated guard-rail against future key drift
- Write a Pest/PHPUnit test (`tests/Feature/PlanEntitlementIntegrityTest.php`) that: parses
  `routes\web.php` (and `routes\api.php`) for every `plan.feature:<key>` string, loads the full
  key set from `PlanFeatureMatrixSeeder.php`, and asserts every route-referenced key exists in
  the seeder — fails with a clear message listing exactly which key(s) are missing.
- Add this test to CI (check for `.github/workflows/`) so it runs automatically. If no CI exists
  yet for this, document it as a required manual pre-deploy check until CI is set up.
- Optional fast-follow: extend the same test to flag hardcoded frontend feature-key references
  (in `featureGroups.js`, `FEATURE_UPGRADE_TARGET`) not present in the seeder — this is what
  would have caught the Growth Engine/WooCommerce drift automatically before it reached production.

### Task 4 — Fix SuperAdmin plan editor to read live data, not a hardcoded mirror
- Investigate what `featureGroups.js` is currently used for — pure structural/display metadata
  (grouping, labels, sort order), or does it also carry actual "0"/"1" entitlement values?
- If it carries actual values: change the SuperAdmin plan editor to fetch live values from the
  `plan_limits` DB table (via `PlanRepository` or a direct `PlanLimit` query) instead of this file.
- Keep `featureGroups.js` (or equivalent) only for presentation metadata with no backend
  equivalent — grouping/labels/icons/order — never for the actual per-plan values.
- Verify: after Task 1 changes `growth_engine` in the DB, the SuperAdmin editor should show it
  enabled for Growth/Business without any matching manual edit to this file.

### Task 5 — Unify the two competing frontend entitlement read paths
- Do this only after Task 1-4 are shipped and stable — largest, riskiest task in this phase.
- Full usage-site grep first: `usePage().props.plan` and `usePage().props.store` and `usePlan(`
  across `resources/js/` — list every consuming file to size the real blast radius.
- Decide which becomes canonical — recommend whichever is backed by a real server-resolved value
  (check `HandleInertiaRequests.php` or equivalent to see how `plan`/`store` props are populated).
- Migrate every consuming file to the canonical path; extend `usePlan.js` as the one hook every
  component uses — no component should read `usePage().props` directly for entitlement data going forward.
- Do not touch `FeatureLockBadge.jsx`'s "Coming Soon" semantic issue yet — that's Task 6.

### Task 6 — Consolidate the 4 "locked feature" UI components into one
- Do after Task 5 (need one unified data source first).
- Build one shared `<LockedFeature>` component reading from the canonical entitlement source,
  distinguishing clearly between "plan-gated, upgradeable," "add-on, purchase separately," and
  genuinely unreleased/future features — three real, different states, three distinct but
  visually consistent presentations.
- One consistent CTA behavior (pick either direct billing navigation or the shared modal pattern
  — currently `PlanGate.jsx` and `FeatureLock.jsx` do these differently, standardize on one).
- Build a small feature-metadata registry (label, icon, category) that the new component AND
  `Billing/Index.jsx`/`UpgradeModal.jsx` both read from, replacing their independent hardcoded maps.
- Replace `PlanGate.jsx`, `FeatureLock.jsx`, `FeatureLockBadge.jsx`, and `UpgradeModal.jsx`'s
  locked-state logic one usage site at a time — don't delete old components until every usage
  site is migrated and verified.
- Specifically fix: any feature currently shown via `FeatureLockBadge.jsx`'s "Coming Soon — V1.1"
  copy that is ACTUALLY working and just plan-gated must be re-classified with upgrade/add-on
  messaging instead — audit this list explicitly during migration.

### Task 7 — Cleanup (lower urgency, any time)
- Confirm the source of the "226+ features" claim (see Phase-2-adjacent finding below — this was
  further investigated in the second audit round and found to trace to a June planning document,
  never recounted since). Decide: compute a real number, or accept as a manually-maintained figure.
- Determine whether `app\Models\PlanFeature.php` (distinct from `PlanLimit`) is consulted anywhere
  at runtime — confirmed in the second audit round to be unused for gating, just admin bookkeeping.
  Decide: delete it, or repurpose it as the real source for "what's included" marketing copy.
- Visual/copy polish pass on lock components (icon choice, color token alignment) — after Task 6.

### Task 8 — Build the SuperAdmin "Plan Control Center"
Founder's own description: one live table where every feature × every plan can be toggled without
touching code, which the pricing page reads from automatically, with a change log and founder-
reviewed customer notifications.

**8a — The live feature × plan grid**
- Build/extend a SuperAdmin page showing: rows = every feature/limit key in `plan_limits`
  (grouped using whatever structural metadata `featureGroups.js` retains post-Task-4), columns =
  every plan (`trial, counter, starter, growth, business, ltd_1, ltd_2, ltd_3`), cell = toggle or
  numeric input.
- Toggling writes directly to `plan_limits` via `PlanRepository`/a new `PlanAdminService` — no
  deploy required. Add validation (no negative limits, no zero seats left on a plan, etc.).
- Add a "request new feature key" flow, distinct from the toggle grid — the grid only edits
  entitlement VALUES for keys that already exist somewhere in the system; adding a brand new gate
  still requires a developer to add middleware to a route (Task 3's guard-rail enforces this).

**8b — Pricing page reads live from the same table**
- Build/confirm an endpoint or Inertia shared prop the pricing page reads from, sourced from the
  same `plan_limits` data the Control Center edits — replacing `WhatIsIncluded.jsx`'s hand-authored
  per-tier boolean props.
- Add cache-busting on Control Center writes (existing `PlanRepository::getLimits()` cache is 1hr
  — too slow for "I toggled it, why isn't it showing" moments).
- Verify: toggle a feature off in the Control Center, confirm pricing page reflects it promptly,
  no code change, no deploy.

**8c — Change log + in-app notification**
- New table `plan_entitlement_changes`: `id, plan_id, feature_key, old_value, new_value,
  changed_by, changed_at, note`.
- Every Control Center write inserts a row automatically.
- Surface a SuperAdmin-facing in-app notification ("Growth Engine was enabled for Growth plan by
  [admin] on [date]") — reuse an existing notification system if one exists, check before building new.

**8d — Customer messaging (auto-drafted, founder-reviewed, dual-channel)**
- Per founder decision: auto-draft a message on any customer-facing change, founder reviews/edits
  before sending, sent via BOTH in-app notification and email.
- Draft copy differs for additions ("We've added X to your plan at no extra cost") vs removals
  (higher-stakes, needs a notice-period framing, extra confirmation step before sending).
- Send only to tenants actually on the affected plan, excluding tenants with a `TenantPlanOverride`
  that already independently grants/blocks that specific feature.
- Build one new templated Mailable (e.g. `PlanChangeAnnouncement`) using the existing mail system.
- Log what was sent, to whom, when — extend `plan_entitlement_changes` or a linked table.

**Suggested build order within Task 8:** 8a first (solves "no more code edits" on its own) → 8c
(cheap, enables 8d) → 8b (can run parallel to 8c) → 8d last (most customer-facing, highest stakes).

---

# PHASE 2 — Dashboard, Permissions & Sidebar Consistency

**Status:** Findings complete from the second audit round. Several tasks are ready to build now;
5 items still need a founder decision before they can be written as a full handoff (listed at
the end of this phase).

### Task 9 — Fix the dashboard card layout gap bug
- `resources\js\Pages\Dashboard.jsx` is the only dashboard with per-card gating, and its
  gap-avoidance logic is incomplete: the bottom row (Top Products/Low Stock/Purchases) has partial
  JS-computed span recalculation (lines 48-65) covering only some boolean combinations; the top
  row (Performance/Outstanding/Net Profit) has none at all — fixed spans regardless of visibility.
- Extend the JS-computed span logic to cover ALL boolean combinations for the bottom row (currently
  only some `canSales`/`canInventory`/`canPurchases` combinations are handled, others fall through
  to a hardcoded default assuming 3 cards present).
- Add equivalent dynamic span logic to the top row (`canSales`/`canFinance`-gated Performance/
  Outstanding/Net Profit), which currently has zero reflow logic.
- Consider whether a flex/auto-fit-based grid approach would be more maintainable than continuing
  to add `if/else` branches for every new combination — evaluate both, pick one, document why.
- Also worth fixing while in this file: `canReports` variable (line 45) is computed but never
  used anywhere — either wire it to something or remove it as dead code.
- Also worth fixing: the "Order" button inside the Low Stock card has a third, independently
  written permission check inline (tagged `// PROBLEM 7 FIX`) — consolidate it to use the same
  `canPurchases`/`hasPerm` pattern as everything else in the file, once Task 11 below unifies the
  permission-reading approach.

### Task 10 — Fix the frontend "fail open" bug
- `usePlan.js`'s `hasFeature()` currently returns `true` (allowed) if the `plan`/`plan.features`
  prop is missing — the opposite of the backend's documented fail-closed default
  (`if ($val === null) return false; // Default deny per T2-2`).
- Change the frontend default to fail closed (return `false`/hidden) when `plan`/`plan.features`
  is missing, matching backend behavior.
- Trace whether `plan`/`plan.features` is ever actually missing in production (would require
  tracing the Inertia shared-prop provider) — if it can happen, this fix prevents a real
  "false-positive-then-blocked-on-click" experience for customers.

### Task 11 — Merge/connect the permission system and plan system properly
- Confirmed: `CheckPermissions` (permission middleware) and `EnsurePlanFeature` (plan middleware)
  are two fully separate systems with zero shared code, combined only by convention — a developer
  manually lists both middleware strings, in the right order, on every route that needs both.
  Nothing fails loudly if one is forgotten.
- Decide and build a mechanism so this can't silently happen: options include a lint rule, a
  custom Laravel route macro that requires both to be specified together for any route tagged as
  needing both, or a single combined middleware that internally calls both checks in the correct
  order. Pick one approach with the team/coding agent's recommendation.
- Extract `Dashboard.jsx`'s local, ad-hoc `hasPerm()` permission-checking logic into a shared
  `usePermissions()` hook (mirroring the existing `usePlan()` pattern), so every page reads
  permission state the same consistent way instead of each page reimplementing the
  `startsWith('.')` prefix-matching logic independently.
- Trace where the Inertia shared prop `auth.user.permissions` is actually populated server-side,
  and confirm it can't go stale mid-session if an admin edits a staff member's permissions while
  they're logged in.

### Task 12 — Fix the sidebar/navigation menu inconsistency
**Needs a founder decision first:** should whole locked sections hide entirely for a tier that
doesn't have them, or should the current "show the section, grey out individual locked items"
style be kept intentionally (some products prefer this because it shows customers what they're
missing, as an upgrade nudge)? Once decided:
- Locate the sidebar/nav component (not yet traced in the audits) and confirm exactly how it
  currently reads entitlement/permission state — likely a third, separate read path beyond the
  two already found.
- Apply the founder's chosen behavior consistently.

### Task 13 — Decide and fix the 3 "zero access control" dashboard pages
`Admin/Dashboard.jsx` (6 FeatureCards: Admin Dashboard, User Management, System Settings,
Security Logs, Reports Center, Database Management), `ExecutiveDashboard.jsx` (~10 KPI/chart
tiles), and `AccountantDashboard.jsx` (4 MetricCards + tables) all have **zero gating logic of
any kind** inside them — no permission check, no plan check, nothing.
**Needs a founder decision/small investigation first:** trace which controller/route decides
which dashboard a given role sees — if low-permission roles can genuinely never reach these
files at all (routing already prevents it), the lack of in-file gating may be low-risk. If they
CAN be reached by under-privileged roles, this is a real access-control gap that needs fixing
directly. This should be a quick, targeted follow-up investigation prompt before deciding.

### Task 14 — Decide on the 17 unlocked report pages
Second audit round found the actual report route count is 68, not the ~52 estimated in the first
pass, and 17 of those have no `plan.feature:` gating middleware at all — accessible on every plan
including the cheapest. **Needs a founder decision:** should these stay free for every tier
(possibly intentional — "basic reports for everyone" is a reasonable product choice), or should
some/all be locked to specific tiers? No code comment currently explains why these 17 specifically
were left ungated.

### Task 15 — Decide on `outstanding_balance_grid` (Counter tier)
Confirmed: this Receivables/Payables-style stats block on the Parties/Customers list page (not
the dashboard) is deliberately disabled for Counter tier, grouped alongside other ledger/
accounting features Counter doesn't get — internally consistent with "Counter = no bookkeeping"
positioning. However, unlike WooCommerce, there's no individual dated comment explaining this
specific key's exclusion. **Needs a founder decision:** confirm this is intentional (in which
case, just add the missing documentation comment so future developers don't wonder), or decide
it should actually be turned on for Counter tier.

*Note: this is the one plan-feature-gated UI block in the entire audit that was found to be
implemented the CORRECT way — clean `PlanGate` usage, proper `return null` on hide, no layout
gap issue. It's proof the right pattern already exists in the codebase; Task 9's dashboard fix
should ideally follow this same clean pattern once addressed.*

---

# PHASE 3 — Folder & Repository Reorganization

**Status: ✅ COMPLETE per founder confirmation.**

**File (for reference):** `FOLDER_REORGANIZATION_HANDOFF.md`

Summary of what this phase covered, now done:
- **Stage 0:** Parked `AMD_POS_Update_v4.2.7\`, `_VERIFICATION_BASELINE_2026-07-10\`,
  `VenQore_Local\` into `_extra-legacy\` (confirmed dead, untracked, unreferenced — moved, not deleted).
- **Stage 1:** Promoted `FinalTester\` (1,400+ tests, route-sweep coverage) to be the real test
  suite at `tests\`, updated GitHub Actions workflow paths to match, moved old `Tester\` into
  `_extra-legacy\` as a kept reference copy.
- **Stage 2:** Created `builds\`, moved loose `.zip` update packages and the `.exe` installer
  (previously scattered at repo root and in `amd-station\dist\`) into it, updated the SuperAdmin
  operator/updater to read from the new location.
- **Stage 3:** Created `extras\` for planning docs, logos, and non-code material.
- **Stage 4:** Updated `build_desktop.ps1`'s hardcoded paths first, then moved `amd-station\` →
  `app-code\windows-app\`. Moved `amd_erp_mobile\` → `app-code\mobile-app\` directly (confirmed
  no hardcoded path dependencies beforehand).
- **Stage 5:** Moved the main Laravel + React app into `app-code\main-app\`, after checking for
  and updating any absolute/relative path assumptions.
- **Stage 6 (optional 4-way internal split — public pages / database / SuperAdmin / main product)
  and Stage 7 (final deletion of `_extra-legacy\`)** remain available as future, no-rush,
  separately-planned steps whenever the founder wants to revisit them — not required as part of
  this phase's completion.

---

# Full task count

- **Phase 0:** 5 tasks (0a-0e) — ready, hand off first.
- **Phase 1:** 8 tasks (1-8, with Task 8 having 4 sub-parts 8a-8d) — ready, hand off second.
- **Phase 2:** 7 tasks (9-15) — 3 ready to build now (9, 10, 11), 4 blocked on a founder decision
  or small investigation first (12, 13, 14, 15).
- **Phase 3:** Complete.

**Grand total: 20 tasks/sub-phases across the whole project**, 13 of them ready or complete right
now, 4 waiting on a founder decision, 3 waiting on one more small targeted investigation (Task 13's
routing trace).

# What's still needed to unblock the rest

1. Founder decision on Task 12 (hide whole sidebar sections vs. grey out individual items).
2. Founder decision on Task 14 (should the 17 unlocked report pages stay free or get gated).
3. Founder decision on Task 15 (is `outstanding_balance_grid` correctly excluded for Counter, or
   should it be turned on).
4. A go-ahead to run one more small, targeted, read-only investigation prompt for Task 13 (which
   controller/route decides who sees which dashboard file) — needed before deciding whether the
   3 ungated dashboard pages are a real risk or a non-issue.

Once those 4 are resolved, Phase 2 gets written as one complete, ready-to-run handoff, the same
format as Phases 0, 1, and 3.

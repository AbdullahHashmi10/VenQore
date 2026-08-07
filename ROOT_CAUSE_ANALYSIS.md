# Root Cause Analysis — Why Plan Entitlement Logic Is Duplicated and Inconsistent

This document explains *why* the issues found in the other six audit files exist architecturally. It is deliberately conceptual — no implementation code, per the mission brief.

## 1. The backend got this mostly right — the frontend never fully adopted it

`app\Services\PlanRepository.php` and `app\Services\PlanGate.php` are a genuinely well-designed resolution chain: single override priority order, fail-closed defaults, a documented facade ("all plan checks flow through here"), and evidence of active self-correction (the seeder's own 2026-08-07 comment documenting and fixing a real production gap). This is not a codebase that never thought about the problem — it's a codebase where **one layer solved it correctly and the solution never propagated outward.**

The frontend, by contrast, has **no equivalent single resolution point**. Instead of one hook/component that asks "does this tenant have access to X," there are at minimum:
- `usePlan.js` (reads `plan.features`)
- `PlanGate.jsx` / `FeatureLock.jsx` (read `store.features`)
- `Billing/Index.jsx`'s `FEATURE_UPGRADE_TARGET` (a separate hardcoded "what unlocks this" map)
- `UpgradeModal.jsx`'s own feature/icon map
- `SuperAdmin/Plans/featureGroups.js`'s hardcoded matrix mirror

Each was almost certainly built at a different time, by whoever was implementing a given page, who needed "is this locked" and "what does it take to unlock it" and wrote the shortest path to an answer rather than reusing or extending an existing shared utility. This is the textbook shape of **organic duplication under time pressure** — not a deliberate design choice, and not malicious or careless in any single instance, but cumulatively creating exactly the drift the founder suspected.

## 2. Two different Inertia shared-prop namespaces is the tell

The `plan.features` vs `store.features` split is the clearest single piece of evidence for *how* this happened: at some point, "plan" and "store" were treated as two different concepts worth sharing to the frontend separately (perhaps "store" = tenant/subscription record, "plan" = the plan definition itself), and two different pieces of code ended up each picking one prop path to read entitlements from, without anyone noticing they were now reading from two different places for what should be one answer. This is consistent with normal incremental development across multiple PRs/contributors/sessions, not a single bad architectural decision.

## 3. "It's just a display map, not real logic" thinking

`Billing/Index.jsx`'s `FEATURE_UPGRADE_TARGET` and `UpgradeModal.jsx`'s feature map both look, superficially, like harmless UI display metadata — "which plan name do I show next to this locked feature's CTA." That framing is exactly why they were allowed to be hardcoded rather than sourced from the backend: whoever wrote them likely didn't think of "which plan unlocks this feature" as itself a piece of entitlement logic requiring a single source of truth — but it *is* entitlement logic, and as the Growth Engine and WooCommerce findings show, it can be **actively wrong**, not just cosmetically stale. This is a common failure mode: logic that determines user-facing promises gets classified as "just copy" and exempted from the rigor applied to the "real" backend gate.

## 4. Marketing copy is written by humans, checked by no one, tied to nothing

The "226+ features" and "40+ reports" claims are ordinary marketing-copy risk: someone counted (or estimated) a number once, typed it into JSX, and nothing in the codebase re-derives or re-validates it. This is a different, more mundane root cause than the entitlement-map duplication above — it's not a *competing source of truth*, it's an *absence of any programmatic source of truth at all* for those specific claims. The fix shape is different too (see `IMPLEMENTATION_ROADMAP.md`): entitlement duplication needs consolidation; marketing-number drift needs either a generated-from-code number or an accepted manual-review cadence.

## 5. The seeder's own commentary shows the team already knows this pattern is dangerous

The 2026-08-07 comment in `PlanFeatureMatrixSeeder.php` (report keys referenced by route middleware but never seeded, silently locking features for every plan including Business) is direct evidence that **the specific failure mode — a consumer of entitlement data (middleware, a route, a JS map) referencing a key that the source of truth doesn't define — has already happened once, inside the backend itself**, not just hypothetically in the frontend. That the team caught and fixed it same-day is a good sign of vigilance, but it also proves there is currently **no automated guard-rail** preventing this class of bug — it was caught by manual testing/observation, not by tooling. The frontend duplications (Growth Engine, WooCommerce) are the same failure mode, just not yet caught, because nothing was watching for them.

## 6. What a single entitlement system should look like conceptually (no code)

- **One backend resolution chain, already mostly built** (`PlanRepository` → `PlanGate` → `EnsurePlanFeature`). This should remain the only place that decides "does tenant X have feature Y" — everything else, frontend included, should be a *consumer* of this answer, never an independent re-implementation of it.
- **One frontend consumption path**, not two. Whatever the long-term shape (a single Inertia shared prop, a single hook, a single context), there should be exactly one way for any React component to ask "is this locked" and get an answer, and that answer should trace back, unambiguously, to the same backend chain — ideally by the frontend receiving pre-computed, already-resolved entitlement data from the backend on every request, rather than re-deriving or hardcoding plan-name comparisons client-side.
- **One place that maps "feature key" → "human label, icon, required tier, upgrade CTA"** — today this metadata is redefined independently in at least `UpgradeModal.jsx`, `FeatureLock.jsx`'s `PLAN_COLORS`, and implicitly in `Billing/Index.jsx`'s `FEATURE_UPGRADE_TARGET`. This is presentation metadata, not gating logic, but it still needs one authoritative registry so "required tier" as displayed to a user always matches "required tier" as enforced by the backend.
- **A closed loop between seeder keys and consumers of those keys.** The fact that a report-key mismatch reached production once already shows the value of some mechanism — even a lightweight one — that cross-checks every key referenced by `plan.feature:` middleware (and, ideally, every hardcoded frontend feature-key reference) against the set of keys the seeder actually defines, and fails loudly (at build/deploy time, not at runtime for a real customer) if they diverge.
- **Marketing numeric claims should either be generated from a real count (like the reports figure, which happens to already be roughly accurate) or explicitly owned by a person/process responsible for periodically re-verifying them** — there is no code-level fix for "the number 226 might be wrong," only a process fix.

This document intentionally stops short of proposing file names, class structures, or code — that belongs in `IMPLEMENTATION_ROADMAP.md`, which is itself scoped to sequencing and risk, not code.

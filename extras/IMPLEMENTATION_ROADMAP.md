# Implementation Roadmap — Plan Entitlement Consolidation

**This is a planning document only. No fix code is included or implied to have been written. Findings are grouped by severity with estimated blast radius, risk, and recommended sequencing.** Per `CLAUDE.md`, this roadmap does not invent phases against the existing technical build plan — it should be reconciled with `VENQORE_TECHNICAL_BUILD_PLAN_V4.md` and `PHASE_0_STATUS.md` by the team before being treated as scheduled work.

---

## Critical

### C1. Growth Engine entitlement contradiction (marketing/billing say included, backend blocks on all plans)
- **Files affected (estimated):** `resources\js\Pages\WhatIsIncluded.jsx`, `resources\js\Pages\Billing\Index.jsx`, `resources\js\Components\UpgradeModal.jsx`, `resources\js\Pages\Marketing\Pricing.jsx` (naming collision only) — roughly 4 files.
- **Risk if left unfixed:** Customers upgrade specifically for a feature they will not receive, then hit a 403 from `EnsurePlanFeature` — direct trust/refund/chargeback risk, and a support burden.
- **Isolated vs. systemic:** Isolated to display/copy layer — the backend gate itself does not need to change, only what customers are told before they pay.
- **Dependencies:** None technical; requires a business decision first — is Growth Engine meant to become bundled into a tier, or does marketing copy need to correctly represent it as a paid add-on? This is a product decision, not just a bug fix, and should be resolved before any file is touched.
- **Recommended fix order:** 1st — this has the most direct revenue/trust exposure of any finding in the audit.

### C2. WooCommerce entitlement contradiction (billing page implies Growth-tier inclusion; backend explicitly excludes from all plans)
- **Files affected (estimated):** `resources\js\Pages\Billing\Index.jsx` (same file/map as C1) — 1 file, same root cause as C1.
- **Risk if left unfixed:** Same category of trust risk as C1, likely lower volume (WooCommerce is a narrower use case than Growth Engine/AI).
- **Isolated vs. systemic:** Isolated — same `FEATURE_UPGRADE_TARGET` map as C1, can likely be fixed in the same pass.
- **Dependencies:** Same business-decision dependency as C1 (is WooCommerce meant to be sellable as a Growth-tier upgrade, or strictly an add-on?).
- **Recommended fix order:** Bundle with C1 — same file, same underlying architectural gap (a hand-maintained map with no tie to the seeder).

### C3. No automated guard against "key referenced by consumer but missing from seeder" (the class of bug that already caused a real production gap on 2026-08-07)
- **Files affected (estimated):** Would touch CI/test tooling plus potentially a new lightweight validation command — not a fix to existing app files, but new tooling. Scope: unknown until the team decides where such a check should live (a Pest/PHPUnit test, an Artisan command run in CI, etc.).
- **Risk if left unfixed:** This exact failure mode (route/frontend references a `plan.feature:` key the seeder never defines) has already reached a state indistinguishable from production once. Without a guard-rail, recurrence is a "when," not "if."
- **Isolated vs. systemic:** Systemic — this is a process/tooling gap, not a single-file bug.
- **Dependencies:** None blocking; can be built independently of C1/C2/H1-H3.
- **Recommended fix order:** 2nd — highest leverage single investment, since it would have caught both the 2026-08-07 report-key gap and would catch future entitlement key drift automatically going forward.

---

## High

### H1. Two competing frontend entitlement read paths (`plan.features` vs `store.features`)
- **Files affected (estimated):** `resources\js\Hooks\usePlan.js`, `resources\js\Components\PlanGate.jsx`, `FeatureLock.jsx`, plus every page/component consuming either prop path — true count unknown without a full usage-site grep (flagged as a follow-up need in `FEATURE_GATING_AUDIT.md`).
- **Risk if left unfixed:** Any new page built by copying an existing pattern has a 50/50 chance of reading from the "wrong" (i.e., inconsistent-with-sibling-pages) prop namespace, perpetuating drift indefinitely.
- **Isolated vs. systemic:** Systemic — touches the core frontend data-flow pattern for entitlement, not a single page.
- **Dependencies:** Needs a decision on which namespace (or a new unified one) becomes canonical, and a migration plan for every existing consumer — this is a larger, riskier change than C1-C3 because it touches the Inertia shared-props contract itself.
- **Recommended fix order:** 3rd — high value but higher risk/effort than the Critical items; should follow a full usage-site audit (not yet done) to size the blast radius accurately before scheduling.

### H2. SuperAdmin plan editor (`featureGroups.js`) hardcodes its own copy of the ~150-key feature matrix
- **Files affected (estimated):** `resources\js\Pages\SuperAdmin\Plans\featureGroups.js` plus whatever SuperAdmin controller/route feeds it — likely 2-3 files.
- **Risk if left unfixed:** SuperAdmin staff editing plan entitlements could see stale default/display state diverging from actual DB values, leading to incorrect manual entitlement grants.
- **Isolated vs. systemic:** Isolated to the SuperAdmin plan-management surface, but high-consequence because it's the tool used to *fix* entitlement problems — a broken editor makes every other fix harder to verify.
- **Dependencies:** None blocking; independent of H1/C1-C3.
- **Recommended fix order:** 4th — should happen before relying heavily on the SuperAdmin UI to fix other findings in this audit, since staff will use it to verify the state of C1/C2 fixes.

### H3. Four independent "locked feature" UI components with different data sources, copy, and CTAs
- **Files affected (estimated):** `resources\js\Components\PlanGate.jsx`, `FeatureLock.jsx`, `FeatureLockBadge.jsx`, `UpgradeModal.jsx`, plus every page using any of the four (usage-site count not yet established).
- **Risk if left unfixed:** Inconsistent, sometimes semantically wrong (e.g. "Coming Soon" shown for an actually-available paid feature) user experience; harder to reason about entitlement bugs because there are four places a display bug could live.
- **Isolated vs. systemic:** Systemic — a genuine design-system-level consolidation, not a quick patch.
- **Dependencies:** Should follow H1 (unifying the data source) — consolidating the four *display* components before the *data* they read is unified would just create one component reading from two inconsistent props.
- **Recommended fix order:** 5th — sequenced after H1 for the reasons above.

---

## Medium

### M1. Marketing numeric claims not tied to code ("226+ features")
- **Files affected (estimated):** `resources\js\Pages\Marketing\About.jsx`, `LandingPage.jsx`, `Marketing\Shared\FeatureDemos.jsx` — 3 files (this specific claim), likely more once other marketing directories (`Blogs\`, `SEO\`, not yet searched) are checked.
- **Risk if left unfixed:** Low-probability but nonzero reputational/legal exposure if a specific number becomes provably false over time; mostly a "this could quietly become embarrassing" risk rather than an active bug today.
- **Isolated vs. systemic:** Isolated per-claim, but there could be more instances outside the directories searched in this pass.
- **Dependencies:** Needs the founder/team to first decide whether 226 is real (and if so, where it was counted from) before any code or copy change — this audit could not verify or refute the number.
- **Recommended fix order:** 6th — lower urgency than the entitlement-logic findings, but cheap to resolve once someone confirms the source of the number.

### M2. `PlanFeature` (DB model) role is unclear — possibly dead weight, possibly unreferenced marketing-copy table
- **Files affected (estimated):** `app\Models\PlanFeature.php` plus wherever it's populated/read (not fully traced).
- **Risk if left unfixed:** Low direct risk, but represents unexplained surface area — a future contributor might assume it's part of the gating chain and build on top of it incorrectly.
- **Isolated vs. systemic:** Isolated — needs investigation, not necessarily a fix.
- **Dependencies:** None; purely needs a clarifying answer from the team or a follow-up grep pass.
- **Recommended fix order:** Can be resolved in parallel with anything else — pure investigation task.

---

## Low

### L1. Lock icon/color/copy inconsistency (cosmetic layer of H3)
- Already covered substantively under H3; listed separately here only because pure visual/copy polish (icon choice, color token alignment) could be sequenced as a lower-priority pass after the data-source and component consolidation in H1/H3 is complete. Not a standalone risk on its own.

### L2. Duplicate project directory trees at repo root (`AMD_POS_Update_v4.2.7\`, `Tester\`, `FinalTester\`, `VenQore_Local\`, `_VERIFICATION_BASELINE_2026-07-10\`)
- **Risk:** Low probability, but if a developer ever edits entitlement logic inside one of these instead of the canonical tree, changes would silently not apply to production and consume debugging time. Not confirmed to be an active problem — flagged as hygiene.
- **Recommended fix order:** Whenever convenient — likely just needs the team to confirm these are archived/inert and, if so, move them out of the active workspace root.

---

## Suggested overall sequencing (subject to the team reconciling against `VENQORE_TECHNICAL_BUILD_PLAN_V4.md`)

1. C1 + C2 (same file, same root cause) — stop the false customer-facing promises first.
2. C3 — add the guard-rail so this class of bug can't silently recur while everything else is being fixed.
3. H2 — fix the SuperAdmin editor so staff have a trustworthy tool to verify subsequent fixes.
4. H1 — unify the frontend entitlement read path (largest single change, needs its own usage-site audit first).
5. H3 — consolidate the four lock components on top of the now-unified data source.
6. M1, M2, L1, L2 — lower-urgency cleanup, any order, as time allows.

No estimates of engineering hours/days are given here, since accurate sizing (especially for H1) depends on a full usage-site count that this audit explicitly flagged as not yet performed.

# VenQore Verification Platform — Phase 2 Master Implementation Blueprint

**From 4.5/10 to a defensible 10/10 — one platform, one dashboard, 1,121+ verifications, zero destroyed work.**

**Status:** Blueprint only. No code, no file moves, no deletions. Executable by a coding agent phase-by-phase.
**Inputs:** Phase 1 forensic audit (`TEST_ECOSYSTEM_FORENSIC_AUDIT.md`, 2026-07-10) — all finding IDs (F-xx, FC-xx) referenced below are defined there.
**Date:** 2026-07-10

---

## 1. Executive Summary

Phase 1 found a top-decile verification *design* running at median *execution*: 1,121 nominal tests whose latest recorded run was red (146 failures/errors), two dead-divergent suite copies, a launch gate that cannot see the two documented critical bugs, guardrails that ban spellings rather than behavior, sweeps that verify consistency while claiming truth, and the two real production money paths (legacy POS controller, WooCommerce webhook) guarded least.

This blueprint converts that estate into a single **Verification Center**: one registry of every suite, one orchestrator, one dashboard, one trust score computed from evidence rather than asserted by counts. It preserves every existing asset — 139 test files, 3 dashboards, 10 verification engines, 2 audit commands, the Golden manifest system, the number registry — and upgrades each in place. Ten migration phases (A–J), each independently executable and reversible, close every Phase 1 finding. The traceability matrix in §14 maps all 43 findings to a phase; nothing remains unowned.

The endpoint is not a claimed 10/10 but a *measurable* one: §19 defines 10/10 as a set of machine-checkable exit criteria (green provable runs, mutation score floors, production-path parity, independence-verified oracles, a launch gate that demonstrably can fail). When those criteria evaluate true on the dashboard, the score is 10 because the evidence is 10.

---

## 2. Vision

One question — *"Can we trust every number VenQore shows?"* — answered by one screen, continuously, with drill-down from any red pixel to (a) a plain-English business explanation and (b) a full technical dossier, for every one of the 1,121+ verifications. Trust is computed, never asserted. A bug in any money path — POS, V3, WooCommerce, imports, reports, exports, dashboards, APIs — turns a pixel red within one run cycle, and the platform tells you what broke, which number is right, why it matters, and what to fix first.

Three principles govern every decision below:

1. **Unify by reference, not by copy.** Phase 1 proved duplication is how this estate decays (F-01, F-02). The Verification Center is a registry + orchestrator over canonical files, never a second copy of them.
2. **Honest red beats false green.** Known defects (POS-003, WOO-001) get *failing tests in a visible quarantine lane*, not absent tests. The launch gate blocks on them unless a waiver with an expiry date and approver exists.
3. **Preserve, then strengthen.** No asset is deleted. Obsolete assets are archived with provenance notes. Every improvement is an in-place upgrade with its old behavior recoverable from git history plus the archive.

---

## 3. Current State (verified inventory)

| Asset | Location | State |
|---|---|---|
| Core tests (~701 fn) | `Tester/tests/Feature/**` (119 files), `tests/Unit`, `tests/Performance` | Running; mixed quality |
| Golden tests (~258 fn) | `Tester/tests/Feature/Golden/` (canonical, 24 files) + `Tester/Golden/tests/` (**dead copy, 8/20 diverged**) | Last cached run: 37 F / 109 E / 54 R |
| Route sweep (154 routes) | `app/Console/Commands/LedgerTruthAuditCommand.php` + `GoldenAuditTestsTest` wrapper | Runs; circular controls (FC-4) |
| Data integrity sweep (8 checks) | `DataIntegrityAuditCommand.php` | Runs |
| Guardrails | `tests/Feature/Guardrails/` (8 files) + baselines | Ratchet holes (F-16…F-18) |
| Architecture tests | `Golden/ArchitecturalEnforcementTest`, `Core/NoSecondCalculator`, `Core/SingleWriterGuard` | String-grep based |
| Verification engines (10) | `tests/Feature/Golden/Verification/Engines/` + `RunEnginesCommand` | Under-fed (F-02 dead ClaimLogger path) |
| Manifest system | `verification/golden_company/` (spec, calculator, manifest), `verification/number_registry.yaml` | Sound skeleton; transcription gaps |
| Dashboard #1 | `Tester/dashboard/` (Node; module suites, per-module audits, test-runner.js, pest-sync.cjs) | Working |
| Dashboard #2 | `Tester/Golden/dashboard/` (Node, port 7822, WebSocket phase streaming) | Working; hard-coded GOLDEN_PHASES |
| Dashboard #3 | `Tester/venqore_command_center.html` (standalone) | Static |
| Prior audit docs | `Tester/VenQore_Test_Audit.md`, `dashboard/audits/module*.md` | Historical value |

Target accounting for the user's headline number: **701 core + 258 golden + 154 sweep routes + 8 integrity checks = 1,121 registered verifications**, every one visible on the single dashboard. (After Phase G the sweep reports per-route-per-metric line items, so the visible count rises above 1,121; the registry keeps both the nominal and expanded counts.)

---

## 4. Audit Summary (what Phase 2 must fix)

Condensed from Phase 1; IDs are authoritative there.

- **State:** last recorded run red (FC-5); seeding uses in-test `DB::commit()` transaction surgery (F-03) — likely error-cascade root cause.
- **Duplication/dead code:** dead divergent Golden copy (F-01); namespace-collision dead base class silently disabling ClaimLogger from core assertions (F-02); non-PSR-4 namespaces (F-05); unwired bootstrap (F-03); trait double-stacking (F-04).
- **Wrong doorway:** strongest tests hit V3 `SaleService`; production POS hits legacy `SaleController@store` (POS-003) and WooCommerce webhook posts no journal (WOO-001) (F-07, FC-2).
- **Mirror logic:** `ReportReconciliationTest` oracle reproduces the COGS-fabrication fallback (FC-3/F-27); Heart/parity suites are read-faithfulness only (F-28).
- **Weak assertions:** existence-only journal checks (F-09), permissive E-07 fallback (F-10), under-constrained FIFO order assert (F-11), fabricated 200s on 302 (F-08), `?? 0` manifest fallbacks (F-12), `findKey` first-match (F-13).
- **Guardrail gaps:** two-spelling single-writer ban with command/import allowlists (F-16); aliasable raw-SQL greps scoped to 2 controllers with 7-file allowlist (F-17); 257 grandfathered unprotected write routes + self-reseeding baseline (F-18/FC-6).
- **Sweep gaps:** FRS-vs-FRS circularity, NON_JSON auto-pass, route-level bulk verified, ALL_ZEROS tolerated, fuzzy prop matching, ±0.10 tolerance, store.*-only scope (F-22…F-26/FC-4); Pest sweep fully circular (FC-14).
- **Sentinel gaps:** silent skips, no scan floor, literal-value matching blind to aggregation, substring false-positive latency (F-19…F-21/FC-8).
- **Launch gate:** G-03 greps a key the registry doesn't use — passes with 2 open criticals (FC-1); meta-tests count files/methods, not strength.
- **Inflation:** 12 `assertTrue(true)` pass-through stubs with unchecked cross-references, 54 incompletes (F-29/FC-11).
- **Coverage holes:** real concurrency, exports content, queues/scheduler, MySQL trigger layer, fiscal close/period locking, multi-currency, batch expiry/serial financials, negative-stock accounting, permission depth, timezone/DST, SuperAdmin surfaces, offline conflict merge (§9 of audit).

---

## 5. Architecture Proposal — the Verification Center

### 5.1 Name

`Tester/VerificationCenter/` (recommended over `CombinedTests/` — the estate contains engines, sweeps, dashboards, and registries, not only tests; the name should not imply "tests were combined by copying," which is the anti-pattern that produced F-01).

### 5.2 Core architectural rule: reference, don't copy

The Center owns **metadata and orchestration**. Canonical test files stay exactly where they are (`Tester/tests/...`). No test file is copied into the Center. This guarantees backward compatibility by construction: every existing command (`vendor/bin/phpunit`, `pest`, `audit:ledger-truth`, both dashboards) keeps working untouched throughout the migration.

### 5.3 Components

1. **Suite Registry** (`VerificationCenter/registry/suites.yaml`) — the single source of truth for *what exists*: every suite with id, human name, category (Core / Golden / Integrity / Ledger / RouteSweep / Guardrail / Architecture / Mutation / Corruption / Financial / Dashboard / Report / API / Smoke / Health / Engine), trust-tier (T1 truth-anchored / T2 consistency / T3 health), canonical paths, run command, nominal verification count, owner, dependencies, and quarantine list reference. The registry's counts must total 1,121 at adoption; a registry self-test fails if any `*Test.php` under `Tester/tests/` belongs to no suite (kills dead-test drift permanently).
2. **Orchestrator** — one artisan command, `verify:all` (with `--suite=`, `--category=`, `--tier=`, `--changed-since=`), executing suites in dependency order, wrapping the existing runners (PHPUnit process per suite, `audit:ledger-truth`, `audit:data-integrity`, `verification:run-engines`, Vitest frontend). It emits one normalized **Run Ledger** record.
3. **Run Ledger** (`VerificationCenter/runs/<timestamp>/`) — machine-readable history: per-verification results (extending the existing `VerificationClaim` JSONL schema with status, suite id, duration, evidence refs), suite summaries, environment fingerprint (DB, seed checksum, git SHA), and the computed trust score. This is the dataset behind trends, historical comparison, and the launch gate. Never overwritten; append-only by timestamp.
4. **Oracle Registry** (`VerificationCenter/registry/oracles.yaml`) — for every T1 suite, *where its expected values come from* (manifest / hand-computed inline / referee SQL / FRS). Anything whose oracle is "same service as the system under test" is auto-classified T2. This makes circularity (FC-4, FC-14) a queryable property instead of a discovery.
5. **Quarantine Lane** (`VerificationCenter/registry/quarantine.yaml`) — known-defect tests (initially POS-003, WOO-001 pinning tests from Phase D) run on every cycle, are reported RED-KNOWN with registry links, and require `waived_until` + `approved_by` to not block the gate. Skipping or deleting a quarantined test fails the SuiteIntegrity meta-test.
6. **Trust Model** (`VerificationCenter/registry/trust_model.yaml`) — the formula in §13; dashboard and launch gate both read it, so score and gate can never disagree (the G-03/A-12 contradiction class becomes structurally impossible).
7. **Archive** (`Tester/_archive/`) — obsolete-but-preserved assets with README provenance notes (the dead `Tester/Golden/tests/` copy, the dead base-class file). Nothing deleted; archives excluded from autoload and suites.

### 5.4 What the existing pieces become

| Today | Becomes | How |
|---|---|---|
| `phpunit.xml` testsuites | Generated view of the Suite Registry | Registry → phpunit.xml sync check (test fails on drift) |
| `GOLDEN_PHASES` array in `Golden/dashboard/server.js` | Read from Suite Registry | Server upgrade, Phase B |
| `ClaimLogger` JSONL | Run Ledger per-verification records | Schema extension, same file format family |
| `number_registry.yaml` | Lineage graph source (§11) | Additive fields: `prop_path` mandatory, `control_source`, `lineage` |
| Engines (10) | Intelligence layer over the Run Ledger | Upgraded inputs/outputs, same classes |
| Both audit commands | Registered suites with normalized output | Wrapper emits Run Ledger records |

---

## 6. Folder Structure Proposal

```
Tester/
  VerificationCenter/
    registry/
      suites.yaml            # all 1,121 verifications, categorized, tiered
      oracles.yaml           # oracle provenance per T1 suite
      quarantine.yaml        # known-defect lane (waivers with expiry)
      trust_model.yaml       # score formula + gate thresholds
    runs/                    # append-only Run Ledger (one dir per run)
    reports/                 # generated business/ technical failure reports
    docs/
      MIGRATION_LOG.md       # every phase's changes, additive record
      ORACLE_INDEPENDENCE.md # review checklist + sign-offs
  _archive/
    2026-07_Golden-legacy-copy/   # former Tester/Golden/tests (F-01), read-only + README
    2026-07_dead-base-class/      # former tests/Feature/Golden/VenQoreTestCase.php (F-02)
  dashboard/                 # UPGRADED in place → the One Dashboard (Phase B)
  Golden/
    dashboard/               # kept; becomes thin launcher pointing at the One Dashboard
    tests/                   # emptied INTO _archive during Phase A (folder retained w/ README)
  tests/                     # canonical suites — unchanged locations, upgraded contents
  venqore_command_center.html  # kept; header banner links to the One Dashboard
```

Rules: no test file moves; `Golden/tests` archival is the single sanctioned relocation (it is objectively obsolete — proven never-executed and diverged; preservation via archive, not deletion). All new directories are additive.

---

## 7. Dashboard Evolution Plan (Part 2 + Part 6)

**Decision: evolve `Tester/dashboard/` into the One Dashboard.** Rationale: it already has suite execution plumbing (`test-runner.js`, `pest-sync.cjs`), per-module audit docs, and a results store; the Golden dashboard's strengths (WebSocket live streaming, phase model) are merged into it. Neither is deleted: `Golden/dashboard` becomes a launcher that opens the One Dashboard filtered to Golden; the command-center HTML gains a banner link. (Do not replace — upgrade, per mandate.)

Panel roadmap (each panel = data already produced by a phase below; the dashboard only renders the Run Ledger + registries):

| Panel | Source | Phase |
|---|---|---|
| Overall Trust score + per-dimension gauges | trust_model.yaml × latest run | B (skeleton), J (final formula) |
| Suite grid — all 1,121 verifications by category/tier, live status via WebSocket | Suite Registry + Run Ledger | B |
| Financial Integrity / Ledger Integrity | Golden + Integrity suite results, invariant checks | C, F |
| Coverage map (registered vs executed vs quarantined; per-module heat) | Registry + Run Ledger | B, D |
| Mutation Coverage (MSI per financial service) | Infection reports | F |
| Architecture Compliance (AST rule results, permission-debt burndown chart: 257 → 0) | Guardrail suite | E |
| Critical Issues / Known Risks (registry CRITICALs + quarantine lane with waiver expiry countdown) | number_registry + quarantine.yaml | D, J |
| Root Cause Ranking / Affected Modules / Controllers / Reports / Dashboards / APIs | Engines over Run Ledger + lineage graph | H, I |
| Launch Readiness (gate evaluation with per-criterion pass/fail) | trust_model.yaml | J |
| Trend Analysis / Historical Comparison / Verification Timeline | runs/ history | B onward (data), I (visuals) |
| Failure drill-down → Business + Technical report pair | reports/ | H |

Constraint for the coding agent: the dashboard must never compute a financial number itself (it renders what the Run Ledger says) — otherwise it becomes a fourth calculator, recreating F-17-class risk in JavaScript.

---

## 8. Migration Strategy — Phases A–J

Each phase: independently executable, additive, ends with the full legacy suite still runnable, and appends its record to `MIGRATION_LOG.md`. Complexity: S (≤1 day), M (2–4 days), L (≈1 wk), XL (>1 wk) for a competent coding agent.

### Phase A — Infrastructure Stabilization & Provable Green *(L; no dependencies)*
The floor everything stands on. Closes F-01…F-06, FC-5, FC-10.
1. **Fix the seeding architecture.** Replace in-test `DB::commit()/beginTransaction()` surgery (`OutputVerificationTestCase`, `FinancialCoreVerificationTest`, `AdversarialCorruptionTest`) with a PHPUnit bootstrap/extension that seeds Golden Company once per process *before* any transaction wrapping, guarded by a seed-state checksum. Wire `Tester/bootstrap.php` (currently orphaned) or its successor into `phpunit.xml`. Exit test: 3 consecutive full green runs on a clean `amd_pos_test`.
2. **Resolve the base-class collision (F-02).** Merge the ClaimLogger instrumentation from the dead `tests/Feature/Golden/VenQoreTestCase.php` into the canonical `tests/Feature/VenQoreTestCase.php` (improvement-in-place), then archive the dead file to `_archive/` with README. Every `assertJournalEntry`/`assertMoneyEquals` across all 1,121 tests now emits claims — the engines' dataset becomes complete.
3. **Archive the dead Golden copy (F-01)** to `_archive/2026-07_Golden-legacy-copy/`; leave `Tester/Golden/tests/README.md` explaining where it went and why. Diff report of the 8 diverged files goes into the archive so no divergent improvement is lost — any unique assertions found only in the dead copy are ported into the canonical files first.
4. **Normalize namespaces** (F-05) to `Tests\...` PSR-4; fix `.env.testing` APP_ENV (F-06); remove trait double-stacking (F-04).
5. **SuiteIntegrity meta-test:** every `*Test.php` maps to ≥1 registry suite; quarantined tests exist and run; phpunit.xml matches registry.
6. **Run evidence:** every run writes a Run Ledger summary; CI keeps `.phpunit.result.cache` + summary as artifacts. "It passes" becomes a checkable claim forever.

### Phase B — Verification Center + One Dashboard skeleton *(L; depends A)*
Builds §5/§6/§7 structures: suites.yaml populated with all existing suites totaling 1,121 verifications; `verify:all` orchestrator wrapping every existing runner; Run Ledger writing; `Tester/dashboard` upgraded to render registry + live run + history + provisional trust score; Golden dashboard converted to launcher; oracle registry drafted (every suite classified T1/T2/T3 — the honest baseline: today most of the sweep layer lands in T2).

### Phase C — Golden Suite Hardening *(L; depends A)*
Closes F-08…F-13, manifest transcription gap, strengthens §2.2/§2.3 assets in place.
1. **Calculator derives instead of transcribes:** upgrade `calculator.php` to compute `net_sales`, `tax`, `invoice_total`, `cogs`, and FIFO consumption order from raw spec inputs (qty, unit price, discount %, tax rate, batch dates/costs); spec.yaml keeps its current totals as *cross-check* fields — calculator fails generation if derived ≠ declared (double-entry bookkeeping of the spec itself). Removes dataset-specific hacks (`restore('BATCH-PHN-001', 3)`) in favor of derived reversal.
2. **Golden Company 2 dataset:** second spec/manifest with multi-warehouse, non-UTC tenant timezone, batch expiry, fractional quantities, negative-stock event, fiscal-period boundary — same calculator engine, no new code path in tests (parameterized dataset id).
3. **Assertion upgrades (in place):** add `assertJournalLinesExactly` (full line-set equality — kills F-09/FC-12) and adopt it in E/X/P tests; fix E-07 to assert the exact excess amount to an approved account list (F-10); rework `assertFifoConsumedInOrder` to scope by sale and use deterministic ordering (F-11); `v3Post` asserts redirect target and follows it — fabricated-200 path removed (F-08); replace `M(...) ?? 0` with `M(...) ?? fail('manifest key missing')` (F-12); replace `findKey` with explicit prop paths from the number registry (F-13).
4. **Doorway parameterization:** each input-verification event runs through the real HTTP endpoint as primary, service call as secondary — restoring the stated doctrine (F-07) for the V3 path; legacy path handled in Phase D.

### Phase D — Production-Path Verification *(XL; depends A, C — the single biggest trust jump)*
Closes FC-2, FC-3, F-27, and the top coverage holes.
1. **Legacy POS suite:** full input-verification battery against `POST /sales` (`SaleController@store`) with hand-computed oracles (mirror of E-01…E-12 catalog, plus cashier-role, offline-replay `client_sale_id`, park/recall). A dedicated **POS-003 pinning test** asserts FIFO-failure behavior produces correct COGS or blocks the sale; expected to fail today → registered in the quarantine lane with registry link.
2. **WooCommerce webhook suite:** real webhook payload → assert journal entries, stock deduction, report visibility. **WOO-001 pinning test** in quarantine likewise. (The misleading `test_E10_woocommerce...` is renamed in place to state what it actually verifies — source-tag pass-through on V3.)
3. **Mirror-logic purge (FC-3):** `ReportReconciliationTest` oracle recomputed from `inventory_batches` consumption only; the `cost_price × qty` fallback branch is deleted from the *test oracle* (production fix is the app team's ticket tracked by POS-003). Add an `@oracle` docblock tag to every reconciliation test; `ORACLE_INDEPENDENCE.md` review requires sign-off that no oracle imports or re-implements service logic.
4. **Exports content verification:** parse generated PDF/Excel/CSV for the Golden tenant; totals must match manifest (registry EXP-001 finally verified). **API/sync endpoints** and **SuperAdmin financial surfaces** get output tests against the manifest.
5. **Import path:** DataImportService journal-balance verification (it is allow-listed by the single-writer guard today — F-16 sibling risk).

### Phase E — Guardrails 2.0 *(L; depends A)*
Closes F-16…F-18, FC-6, FC-7, and the alias/evasion class.
1. **AST-based rules replace string greps** (nikic/php-parser or PHPStan custom rules, run as tests): single-writer (any Eloquent/query-builder/raw write touching `journal_entries|journal_items` outside `AccountingService`), ledger-read isolation for FifoService, no-raw-SQL across **all** controllers (not just 2), money-cast/float rules. Existing string tests are kept as fast smoke tier; AST tier is authoritative. Allowlists shrink to reviewed entries with justification comments; `app/Console/Commands` blanket exemption removed (commands must use the engine or be individually waived).
2. **Permission debt burndown (F-18):** baseline becomes checksum-protected and committed; the test *fails* (never reseeds) if absent; a `max_unprotected: N` ratchet in the registry decreases per release (257 → tranche targets → 0), and the dashboard charts it. Classification pass tags each of the 257 routes (needs-permission / intentionally-public with sign-off).
3. **MySQL trigger verification:** tests that the PaymentAllocation→JournalEntry trigger accepts valid and rejects invalid links (CLAUDE.md's standing warning finally has a test).

### Phase F — Integrity, Corruption & Mutation Evidence *(L–XL; depends A)*
Closes F-14a, F-15; adds the independent strength measure.
1. Re-green `AdversarialCorruptionTest` on the Phase A seeding architecture; extend the catalog (V-11+: `is_reversed` mis-marking — the shared-convention blind spot; orphan reversal entries; duplicate reversals; NULL tenant_id; backdated period-locked writes).
2. **Production integrity monitoring:** `verify:ledger` scheduled (daily per tenant); a test corrupts a fixture tenant and asserts the command exits non-zero and emits an alert artifact — detection becomes *alerting*, not just possibility (F-15).
3. **Mutation testing (Infection PHP)** on `AccountingService`, `FifoService`, `SaleService`, `FinancialReportingService`, `LedgerService`: initial baseline, then MSI floors in the trust model (start ≥60%, ratchet to ≥85% financial-core). Mutation score is the only category-independent proof that assertions bite; it feeds the dashboard's Mutation Coverage panel and the trust formula.

### Phase G — Route Sweeps & Sentinel Rebuild *(L; depends B, C)*
Closes F-19…F-26, FC-4, FC-8, FC-14.
1. **Truth layer added to `audit:ledger-truth`:** for the Golden Audit tenant, control values come from the *manifest* (T1), with the FRS comparison retained as a second, labeled consistency layer (T2). Rename surfaced outputs accordingly ("Consistency Sweep" vs "Truth Sweep") so the dashboard never overstates.
2. **Strictness fixes:** NON_JSON → explicit classification with allowlist, never auto-verified; per-metric verification only on actual comparison (route-level bulk `markMetricsForRouteAsVerified` removed); ALL_ZEROS fails strict mode; mandatory `prop_path` per registry metric (fuzzy keyword fallback deleted); tolerance ±0.10 → ±0.01; minimum floors asserted (routes scanned ≥ registry route count; metrics compared ≥ registry LEDGER-DERIVED count).
3. **Sentinel rebuild:** collision-proof marker amounts (distinct per table, not substrings of tenant ids — F-21); **delta detection**: snapshot every financial prop before/after seeding the bypass rows — any changed prop flags the route (catches aggregation leaks, F-20); non-200/unresolvable routes are failures, with a scanned-count floor (F-19).
4. `LedgerTruthSweepTest` (Pest) upgraded: expected dashboard values from the Golden Audit manifest, not FRS (FC-14).

### Phase H — Dual Reporting *(M; depends B)*
Part 3 requirement. On every failure the Run Ledger event generates two linked artifacts in `VerificationCenter/reports/`:
- **Business report (plain English):** what happened; which number is wrong on which screen; what the correct number is (from the oracle) and its currency impact; why it matters (which decisions it corrupts); severity.
- **Technical report:** route, controller, service, method; captured SQL (query log during the failing request); ledger rows involved; expected vs actual with tolerance; oracle provenance; root-cause candidates ranked (RootCauseEngine); confidence (ConfidenceEngine); blast radius — affected modules/reports/dashboards/APIs (BlastRadiusEngine over the lineage graph); first-fix recommendation.
Templates are data-driven from the claim schema; engines supply the analytical fields. Dashboard drill-down opens the pair.

### Phase I — Verification Intelligence *(L; depends B, H)*
Part 7 requirement. Upgrades the ten existing engines (never replaced) into the intelligence layer:
- **Lineage graph:** `number_registry.yaml` extended per metric with `service_method`, `gl_accounts`, `tables`, `prop_path` → TraceabilityEngine answers *"where did this number come from"* end-to-end (page → controller → service → GL accounts → journal rows).
- SourceOfTruthEngine validates registry completeness (every financial prop on every page maps to a metric; unmapped props fail — closes the "new number ships unregistered" hole).
- ContradictionEngine cross-checks the same metric across surfaces per run; ConsistencyEngine tracks cross-run drift; LedgerHealthEngine consumes invariant results; EvidencePackGenerator bundles the failure dossier for the technical report.
- Priority scoring: rank open failures by (currency impact × surface count × confidence) — the dashboard's "what should be fixed first."

### Phase J — Launch Gate & Trust Model Finalization *(M; depends all)*
Closes FC-1 and the counting-not-weighing class.
1. **G-03 rebuilt** on Symfony YAML parsing (already a dependency): a critical issue = any registry entry with CRITICAL in `risk` *or* `severity` lacking `verified: true`/`status: resolved`; reconciled with A-12 (tracked AND blocking unless quarantine waiver). Add a **gate self-test** proving the gate *can* fail: inject a synthetic critical entry in a fixture registry and assert the gate blocks (a launch gate that has never failed is untested).
2. Launch readiness = trust_model.yaml evaluation: all dimension floors met, zero unwaived quarantine items, zero expired waivers, latest run green, MSI floors met, sweep floors met. LaunchGateTest's file-count meta-checks are retained but demoted to T3 health.

---

## 9. Preservation & Backward Compatibility Strategy

- **Nothing deleted.** Two objectively obsolete artifacts (dead Golden copy, dead base class — both proven non-executing in Phase 1) move to `Tester/_archive/` with README provenance and a divergence report; unique logic found in them is ported into canonical files *first*.
- **Every existing entry point keeps working during and after migration:** `vendor/bin/phpunit` with existing suite names, direct Pest file runs, `audit:ledger-truth`, `audit:data-integrity`, `verification:run-engines`, both dashboards, `launch.bat` scripts. The Center wraps; it never gates other runners out.
- **In-place upgrades only** for tests, engines, commands, dashboards — same files, stronger contents; git history is the rollback path, `MIGRATION_LOG.md` the human-readable record.
- **Historical artifacts** (prior audits, module audit docs, last-results.json) are retained and become the earliest entries of the Run Ledger's historical view.
- **Compatibility checks are tests:** the SuiteIntegrity meta-test and a registry↔phpunit.xml drift test fail if migration breaks any legacy suite name or leaves any test unregistered.

## 10. Risk Analysis

| Risk | Likelihood | Mitigation |
|---|---|---|
| Phase A seeding rework destabilizes currently-passing suites | Medium | Phase A exit = 3 consecutive full green runs; old seeding path kept behind a flag until exit met |
| Quarantine lane abused as a dumping ground | Medium | Waivers require approver + expiry; expired waiver = gate failure; dashboard countdown |
| AST guardrails produce false positives that erode developer trust | Medium | Two-tier rollout: report-only for one release, then enforcing; reviewed allowlist with justifications |
| Mutation testing runtime cost | High | Scope to financial services only; nightly, not per-commit; cached baselines |
| Registry becomes stale (the new "second copy" problem) | Medium | Registry is *validated by tests* (SuiteIntegrity, SourceOfTruthEngine), not maintained by discipline |
| Golden Company 2 dataset authored from app output (circularity re-entry) | Medium | ORACLE_INDEPENDENCE sign-off requires hand-computation worksheets committed with the spec |
| Dashboard consolidation regresses existing workflows | Low | Old dashboards remain as launchers; no removal |
| Known-defect tests (POS-003/WOO-001) stay red for months and normalize red | Medium | Gate blocks on expired waivers; trend panel shows quarantine age; exec-visible |

## 11. Reporting & Engine Evolution (summary)

Covered in Phases H–I. Net effect: every one of the 1,121+ verifications emits a claim; every claim failure produces a business + technical report pair; ten existing engines become the analysis layer over a complete dataset (today they see a partial stream — F-02); the lineage graph makes "which service produced this number, which ledger entries, what else is affected" a query, not an investigation.

## 12. Gap Closure Plan — nothing unresolved

Every Phase 1 finding has exactly one owning phase (matrix in §14). Coverage holes from audit §9 map: concurrency → F (real parallel-process FIFO race harness via Symfony Process, replacing the static `lockForUpdate()` grep as authority) ; exports → D ; queues/scheduler → F ; triggers → E ; fiscal close/period locking → C (dataset) + F (corruption vectors) ; multi-currency → C (explicitly scheduled as Golden Company 3 if product confirms FX is in scope; otherwise registered as out-of-scope with sign-off — an *explicit* non-goal, not a silent gap) ; batch expiry/serials/negative stock → C ; permission depth → E ; timezone/DST → C ; SuperAdmin → D ; offline conflicts → D.

## 13. Trust Score Roadmap (Part 9)

Scores are computed by `trust_model.yaml` (dimension floors × weights), not asserted. Projection assumes each phase meets its exit criteria; the dashboard shows the *measured* value.

| Milestone | Projected trust | Why it moves |
|---|---|---|
| Current | 4.5 | Phase 1 baseline |
| After A | 5.5 | Suite provably green with evidence ledger; dead code gone; claims stream complete — the "is it even running?" discount removed |
| After B | 6.0 | Single registry/orchestrator/dashboard; 1,121 verifications visible and dead-test drift impossible; honest T1/T2 labeling |
| After C | 6.7 | Oracles derive instead of transcribe; exact-line assertions; second dataset kills single-dataset overfit; fabricated-200 path gone |
| After D | 7.8 | **Largest jump:** production money paths (POS legacy, webhook, exports, imports, APIs) verified or honestly red in quarantine; mirror-logic purged |
| After E | 8.3 | Behavior-level guardrails; ledger bypass requires defeating AST analysis, not a grep; permission debt visibly burning down |
| After F | 8.8 | Mutation scores prove assertions bite; corruption detection green and *scheduled* in production |
| After G | 9.3 | Sweeps anchored to truth with floors; sentinel catches aggregation leaks; circularity labeled and bounded |
| After H+I | 9.7 | Every failure explains itself (dual reports, lineage, root cause, priority); intelligence layer complete |
| After J | 10.0* | Gate provably capable of failing; score = evaluated exit criteria (§19). *Held only while runs stay green and floors stay met — trust is a live measurement, decaying on red |

## 14. Traceability Matrix — Phase 1 finding → owning phase

| Finding | Phase | | Finding | Phase |
|---|---|---|---|---|
| F-01 dead Golden copy | A | | F-16 single-writer greps | E |
| F-02 namespace collision / dead ClaimLogger | A | | F-17 raw-SQL greps/allowlists | E |
| F-03 bootstrap/seeding surgery | A | | F-18 / FC-6 permission baseline (257) | E |
| F-04 trait double-stack | A | | F-19 sentinel silent skips | G |
| F-05 namespaces | A | | F-20 aggregation blindness | G |
| F-06 .env APP_ENV | A | | F-21 substring collision | G |
| F-07 wrong doorway (V3-only) | C, D | | F-22 / FC-4 sweep circularity | G |
| F-08 / FC-9 302→200 | C | | F-23 NON_JSON auto-pass | G |
| F-09 / FC-12 existence-only asserts | C | | F-24 bulk verified | G |
| F-10 E-07 fallback | C | | F-25 ALL_ZEROS tolerated | G |
| F-11 FIFO order assert | C | | F-26 sweep scope/tolerance | G |
| F-12 / FC-13 manifest ??0 | C | | F-27 / FC-3 mirror-logic oracle | D |
| F-13 findKey | C | | F-28 read-faithfulness labeling | B (oracle registry), G |
| F-14 stub inflation / FC-11 | B (registry declassifies no-op stubs to T3 docs; cross-references machine-checked) | | F-29 stub cross-refs | B |
| F-14a adversarial errored | A, F | | FC-1 launch gate vacuous | J |
| F-15 detection ≠ alerting | F | | FC-2 Woo test misdirection | D |
| FC-5 red last run | A | | FC-7 single-writer allowlists | E |
| FC-8 sentinel | G | | FC-10 duplicates/dead code | A |
| FC-14 circular Pest sweep | G | | Coverage holes (audit §9) | §12 mapping |

## 15. Dependencies

A → (B, C, E, F); B → (G, H, I); C → (D, G); D, E, F, G → J; H → I. Independent pairs (C∥E∥F after A; D∥G after their parents) may run in parallel by separate agents. External: Infection PHP (F), nikic/php-parser or PHPStan (E), Symfony Process (F concurrency harness) — all standard, no license risk. App-team dependencies: fixing POS-003/WOO-001 themselves is *application* work outside this blueprint; the platform pins them red until fixed.

## 16. Estimated Complexity

A: L · B: L · C: L · D: **XL** · E: L · F: L–XL · G: L · H: M · I: L · J: M. Critical path: A → C → D (the trust-defining chain). Suggested sequencing for a single agent: A, B, C, D, E, F, G, H, I, J (≈ 6–8 working weeks); two agents: (A→C→D) ∥ (B→E/F after A), then G→H→I→J.

## 17. Success Criteria (per phase, machine-checkable)

- **A:** 3 consecutive full green runs archived in Run Ledger; zero classes with duplicate FQCNs; zero test files outside a registered suite; ClaimLogger claims emitted per run ≥ historical max.
- **B:** `verify:all` executes every registered suite; dashboard renders 1,121 verifications with live status; registry↔phpunit drift test green; every suite oracle-classified.
- **C:** calculator regeneration reproduces manifest bit-identically from raw inputs; Golden Company 2 green; zero `?? 0` manifest fallbacks; zero fabricated-200 helpers; exact-line assertions adopted in all input suites.
- **D:** legacy POS + webhook + exports + import suites registered and running; POS-003/WOO-001 pinning tests red-in-quarantine with waivers; zero test oracles containing `cost_price ×` fallback logic; renamed E-10 no longer claims webhook coverage.
- **E:** AST rules enforcing across all controllers/services; alias-evasion fixture fails the rules (rule self-test); permission baseline checksum-locked; burndown ratchet active with first tranche shipped; trigger tests green.
- **F:** adversarial suite green; MSI baseline published and floors in trust model; scheduled `verify:ledger` alert test green; parallel-process FIFO race test exists and passes.
- **G:** sweep floors asserted (routes ≥ registry count, metrics ≥ LEDGER-DERIVED count); NON_JSON/ALL_ZEROS fail strict; sentinel delta-detection catches a seeded aggregation-leak fixture (sensitivity self-test, E-12 style).
- **H:** every failing verification in a test run produces both report artifacts; reports contain oracle provenance and captured SQL.
- **I:** "where did this number come from" query answers for 100% of registry metrics; unregistered financial prop on any swept page fails.
- **J:** gate self-test proves the gate fails on a synthetic critical; gate and dashboard read the same trust_model evaluation; zero contradiction between A-12-class tracking and gate result.

## 18. What the coding agent must never do (inherited from Phase 1 lessons)

Copy test files to "organize" them (creates F-01s); write expected values by running the app and pasting output (creates FC-3s); add allowlists without justification comments and expiry (creates F-18s); mark anything verified without an actual comparison (creates F-24s); let a sweep pass without asserting how much it swept (creates F-19s); let any gate/meta-test count artifacts instead of weighing evidence (creates FC-1s).

## 19. Final Definition of "10/10 Trust"

Trust is 10/10 **if and only if** all of the following evaluate true on the live dashboard, every run:

1. **Green & provable** — latest `verify:all` run fully green (quarantine excepted), with 3-run history archived; the claim "all tests pass" is a queryable fact, never a statement.
2. **Complete & visible** — all 1,121+ registered verifications executed and rendered on the One Dashboard; zero unregistered test files; zero unregistered financial props on any page.
3. **Truth-anchored** — every T1 financial verification traces to an oracle that is independent by construction (hand-derived spec + derivation-checked calculator), with signed independence review; circularity exists only in labeled T2 consistency layers.
4. **Production-path parity** — every path that writes money in production (V3, legacy POS, webhook, imports, offline sync) has input verification with independent oracles; every surface that shows money (reports, dashboards, exports, APIs, SuperAdmin) has output verification against a manifest.
5. **Bite-proven** — mutation score floors met on the financial core (MSI ≥ 85%), and sensitivity self-tests (E-12 pattern, sentinel fixture, gate self-test) prove each detector can actually fire.
6. **Bypass-resistant** — AST-level guardrails enforce single-writer/one-brain rules across the whole app; permission debt = 0 or individually signed; the standing allowlist count is on the dashboard.
7. **Corruption-alerting** — integrity checks run scheduled in production and are tested to alert, not merely able to detect.
8. **Self-explaining** — every failure auto-produces the business + technical report pair with lineage, root-cause ranking, and blast radius.
9. **Honestly red** — known defects live as running, visible, waiver-gated quarantine tests; waivers expire; the launch gate has a proven ability to fail.
10. **Decaying by design** — the score is recomputed every run and *falls* when any of the above stops being true. A 10 that cannot become a 4 overnight is not a measurement; this one can, and that is precisely why it can be trusted.

*(End of blueprint. Phase 3 — execution — begins with Phase A, and no phase begins without its parent's exit criteria met.)*

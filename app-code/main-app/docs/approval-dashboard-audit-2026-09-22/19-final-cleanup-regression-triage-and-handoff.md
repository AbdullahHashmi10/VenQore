# Final cleanup, regression triage, and handoff instructions

**Date:** 23 September 2026  
**Branch:** `codex/approval-dashboard-final-repairs`  
**Current remote main:** `0d33d5b07a56a82aabcc9015a330e8639dd0ad2a`  
**Expected effort:** 2–4 hours if comparison mismatches are false positives; up to one working day if genuine regressions require repairs.

## Objective

Produce a small, truthful, reviewable final repair diff and reproducible evidence. Do not add features. Do not declare PASS until every gate below passes.

## Absolute safety rules

- Do not push, merge, deploy, amend, reset, rebase, force-push, or modify remote history.
- Do not use production or recovery databases.
- Preserve `storage/installed`.
- Do not touch the pre-existing `../production-clean-repo` submodule state.
- Preserve existing evidence directories; write replacement evidence under `evidence/final-handoff/`.
- Do not weaken, delete, skip, or rewrite product tests to manufacture a pass.

## Step 1: checkpoint and classify the current workspace

Record:

- branch and exact HEAD SHA;
- `origin/main` SHA;
- complete `git status --porcelain=v1`;
- tracked application/test changes;
- untracked intended source files;
- generated build files;
- audit/evidence files;
- unrelated or pre-existing changes.

The current claim that the tree is clean is false. Correct this in the final report.

## Step 2: clean generated build churn safely

The last build regenerated roughly 1,181 tracked/untracked files under `public/build`. Determine the repository's established asset policy from history and CI.

- If generated assets are not part of this repair, restore `public/build` exactly to `HEAD` using Git path restoration and remove only untracked files inside `public/build` that were produced by this verification run. Verify the resolved absolute path is the repository's `public/build` before removing anything.
- If the repository requires committed production assets, rebuild once only after the source tree is final, and keep exactly the manifest and matching hashed assets produced by that final build. Explain why they belong in the change.
- Never use a broad repository clean command.

Do not alter application source while cleaning generated outputs.

## Step 3: remove verification-only repository pollution

Review untracked `phpunit.xml`, `scripts/run_sequential_regression.cjs`, and `scripts/compare_lint_truthfully.cjs`.

- Keep `phpunit.xml` only if it is an intentional permanent project configuration and matches the repository's canonical test discovery. Otherwise move verification configuration into `evidence/final-handoff/` and remove the root file.
- Keep reusable verification scripts only if they are safe, accurate, documented, and intended for ongoing CI. Otherwise store them as evidence tools rather than product source.
- Keep `scripts/audit_ziggy_routes.cjs` and its self-test because the production build now depends on it.

## Step 4: repair the JUnit comparison parser

The current parser is invalid. It reports only 67 baseline and 70 current cases while the console reports thousands, and its JSON explicitly reports 26 current-only failures with `REGRESSION_FAIL`.

Implement comparison with a real XML parser. Do not use regular expressions to parse JUnit XML.

For every testcase, build a stable identity from:

- normalized repository-relative test file when present;
- normalized PHP class name with absolute worktree prefixes removed;
- fully decoded test name, including data-set name.

Normalize both worktree prefixes, Windows separators, XML entities, duplicate `Tests.tests` namespace variants, and baseline/current absolute paths. Never match tests only by display text when file/class data exists.

Validate the parser with fixtures proving:

- identical failures under different worktree paths match;
- XML entities such as `&amp;` match;
- self-closing passing testcases are counted;
- nested testsuites are counted;
- failures and errors are both detected;
- genuinely different test names remain different;
- parsed totals equal the JUnit root aggregate and the Pest console summary.

The comparison must refuse to produce a PASS if totals disagree, either run is incomplete, exit metadata is missing, or duplicate identities are ambiguous.

## Step 5: regenerate comparison from existing raw evidence first

Before rerunning the long suites, run the corrected parser against the retained `final-repair/baseline_junit.xml` and `current_junit.xml`.

Create `evidence/final-handoff/reparsed-existing-comparison.json` containing:

- total, passed, failed, skipped, errored, and incomplete counts;
- shared failures;
- baseline-only failures;
- current-only failures;
- unmatched/ambiguous identities;
- parser validation results.

Manually inspect every current-only candidate against both raw XML files and logs. Classify it as:

- normalization false positive;
- nondeterministic/environmental failure;
- new test with no baseline equivalent;
- genuine behavior regression;
- intentionally changed behavior backed by approved specification.

New tests do not count as regressions merely because the baseline lacks them, but every failing new test is a release failure and must be fixed.

## Step 6: fix genuine failures without scope drift

For every genuine current-only or newly failing test:

1. reproduce it individually at least twice on a clean current test database;
2. identify the product root cause;
3. make the smallest production fix;
4. retain or strengthen the test;
5. rerun the affected suite;
6. record cause, fix, and evidence.

Do not dismiss a failure as cache bleed unless a clean isolated reproduction proves it. Do not accept tests that pass alone but fail predictably in the full suite; fix the leaked global state or ordering dependency.

## Step 7: correct lint reporting

The reported values are baseline 2,218 and current 2,220, which is a net increase of two diagnostics. Recompute using the same tool, version, configuration, and file set in both worktrees.

- Produce stable diagnostic identities from repository-relative file, rule, line, and message.
- List added, removed, and shared diagnostics.
- Require zero added diagnostics in every changed source file.
- Fix the two net-new diagnostics if they are real.
- Do not disable rules, add broad ignores, or call a nonzero full lint command PASS.
- Report full lint as legacy-debt/nonzero if it remains nonzero, while separately reporting the zero-new-diagnostics gate.

## Step 8: review the repair diff itself

Review every intended source change for security and correctness, especially:

- permission inheritance/custom/legacy behavior;
- feature-flag route authorization, allowlist, atomic update, and audit trail;
- original-maker correction enforcement at both controller and engine boundaries;
- approval setting audit fields and mass-assignment safety;
- route-audit script false positives/negatives;
- expense and invoice correction payload shape.

Run all targeted suites from document 17. They must all pass.

## Step 9: freeze the final source tree

After repairs and cleanup:

- save `git status` and a SHA-256 manifest of every intended changed/untracked source and test file;
- do not edit source or tests after this point;
- exclude evidence logs and generated transient output from the source hash manifest;
- record the exact canonical test command.

## Step 10: run the authoritative final gates

Use separate clean databases and run baseline then current sequentially. Run the same canonical command and configuration in each worktree. Retain raw console and JUnit evidence.

Acceptance requirements:

- parser totals agree with JUnit aggregates and console summaries;
- zero ambiguous test identities;
- zero current-only regressions;
- zero failing new approval/dashboard/repair tests;
- all targeted approval, dashboard, permission, correction, support-ticket, and route-audit tests pass;
- `npm test` passes;
- the production build passes from the frozen source tree;
- changed-file lint has zero diagnostics and lint adds zero diagnostics relative to baseline;
- `git diff --check` passes;
- `storage/installed` remains present;
- source hash manifest is unchanged after testing.

If any gate fails, the overall result is FAIL. Fix the issue and restart from Step 9.

## Step 11: produce a truthful handoff

Replace the inaccurate PASS declaration in document 18 with a correction, preserving its history. Create:

`docs/approval-dashboard-audit-2026-09-22/20-final-handoff-report.md`

Include:

- exact HEAD and remote SHAs;
- exact final `git status`;
- intended source/test files versus evidence/generated files;
- corrected suite totals and exit codes;
- complete failure classification;
- lint added/removed/shared counts;
- build and targeted-test results;
- source hash before/after proof;
- any remaining known debt;
- explicit PASS or FAIL.

For PASS, also provide a concise proposed commit title and body, but do not commit or push. Stop and return the report path plus `git diff --stat` for owner review.

## Definition of done

Done means the final local repair tree is small and reviewable, all intended fixes are present, generated files are handled according to repository policy, the corrected comparison proves zero current-only regressions, all new tests pass, the build passes, and no files changed after the authoritative current run.

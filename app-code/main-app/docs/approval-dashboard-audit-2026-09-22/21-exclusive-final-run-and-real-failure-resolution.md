# Exclusive final run and real failure resolution

**Date:** 23 September 2026  
**Status:** Document 20 is correctly marked FAIL. Its failure classification is not authoritative because two current-suite processes overlapped.

## Critical finding

The IDE observed current-suite PID `57964` still running, then launched another current suite as PID `68512`. Both used the same database and wrote to the same `current_junit.xml`. This explains the corrupted concatenated XML and can explain MariaDB deadlocks, cache interference, inconsistent failures, and damaged test state.

Do not classify any of the 23 failing-new-test candidates as a product defect or infrastructure debt until a single exclusive run reproduces it.

## Safety rules

- Do not push, commit, merge, deploy, reset, rebase, amend, or force-push.
- Do not edit source or tests before the exclusive rerun.
- Do not use production or recovery databases.
- Preserve existing evidence. Write new evidence under `evidence/exclusive-final/`.
- Keep `storage/installed` present before and after every run.
- Do not kill unrelated PHP processes. Identify a test process by its full command line, working context, start time, and output target.

## Step 1: prove test-process exclusivity

List PHP, Pest, PHPUnit, Python verification, and PowerShell test-wrapper processes with full command lines. Confirm no process is using:

- the baseline or current test databases;
- any JUnit path under this audit directory;
- `vendor/bin/pest` for this repository.

If a known previous audit test process is still active, wait for it or terminate only that confirmed process. Record the evidence. Do not launch tests while any prior audit suite is running.

Create an exclusive lock file containing PID, command, database, JUnit path, and start time. The runner must refuse to start when a live lock owner exists. Remove a stale lock only after proving its PID is no longer running.

## Step 2: restore and freeze the source tree

- Restore `storage/installed` from HEAD if necessary.
- Restore transient `public/build` output according to the established repository policy.
- Do not change the intended repair source.
- Generate a fresh SHA-256 manifest of all intended source and test files.
- Record `git status`, HEAD, branch, and `origin/main`.

## Step 3: use fresh isolated databases

Create new disposable databases that have never been used by earlier runs, for example:

- `amd_pos_test_baseline_exclusive_10988c43`
- `amd_pos_test_current_exclusive_final`

Use distinct cache prefixes and output directories. Verify the connection target before each run. Never run the two suites simultaneously.

## Step 4: run baseline exactly once

Run the canonical baseline command alone. Use a unique JUnit path and UTF-8 console capture. Do not pipe through PowerShell `Tee-Object`. The wrapper must retain stdout/stderr without converting it to UTF-16.

After completion, verify:

- exactly one Pest/PHPUnit process owned the output;
- JUnit is well-formed XML;
- JUnit aggregate totals match the console summary;
- the file contains one XML document;
- exit code, timestamps, database, and command are recorded.

If XML is corrupted, stop and identify the writer collision. Do not attempt to reconstruct or fuzzy-parse a corrupt artifact.

## Step 5: run current exactly once

Only after baseline fully exits, run current under the same exclusive runner and validation rules. Use a different fresh database and unique JUnit path. Do not start a second process while waiting, even if the IDE quota or narration disconnects.

After completion, validate XML and totals before comparison.

## Step 6: compare with exact identities

Use the real XML parser from document 19. Require exact normalized identities based on repository-relative file, class, full test name, and dataset. Do not use fuzzy matching or truncated console names for the final decision.

Report:

- shared failures;
- baseline-only/fixed failures;
- current-only failures from tests existing in baseline;
- failing tests introduced after baseline;
- passing tests introduced after baseline;
- ambiguous identities.

Acceptance requires zero current-only failures, zero failing newly introduced tests, and zero ambiguous identities.

## Step 7: handle only failures reproduced by the exclusive run

For each remaining release-blocking failure:

1. rerun the exact test twice by itself against a freshly reset current test database;
2. rerun its complete test file once;
3. record whether it is deterministic, order-dependent, or environmental;
4. fix deterministic product defects;
5. fix test isolation/global-state leaks when a full suite fails but clean isolated execution passes;
6. retain or strengthen the intended assertion.

Do not dismiss failures as deadlocks or legacy debt without this proof. Do not modify tests merely to conform to current output.

After any source or test fix, freeze a new manifest and repeat the exclusive current suite. Repeat the baseline only if the baseline command, dependencies, configuration, or environment changed.

## Step 8: final gates

After the exclusive comparison passes:

- all targeted approval, dashboard, permission, correction, support-ticket, and route-audit tests pass;
- `npm test` passes;
- production build passes;
- no new lint diagnostics exist in touched files or relative to the verified baseline identity comparison;
- `git diff --check` passes;
- `storage/installed` remains present;
- final source hashes match the frozen pre-run manifest;
- generated build output is restored or intentionally included according to repository policy.

## Step 9: correct the handoff report

Update document 20 with a clearly dated superseding section, or create `22-exclusive-final-handoff-report.md`. Include process-exclusivity proof, valid XML evidence, exact totals, exact failure classification, final Git status, diff statistics, and overall PASS/FAIL.

Do not claim the tree is clean when intended changes are uncommitted. Describe it as a reviewable local diff if appropriate.

Stop without committing or pushing. Return the report path and the final `git status`.

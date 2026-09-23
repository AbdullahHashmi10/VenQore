# Complete JUnit coverage and final acceptance

**Date:** 23 September 2026  
**Status:** Product and targeted gates pass. Document 22 is not yet sufficient proof of zero regressions because its JUnit comparison covers only part of the executed test cases.

## Verified evidence gap

The exclusive runs were valid and did not overlap, but their JUnit data is incomplete:

- baseline console: 6,242 tests, 109 failures;
- baseline JUnit top suite: 1,551 tests, 83 failures + 26 errors = 109;
- baseline comparator details: only 75 failed testcase elements;
- current console: 6,340 tests, 94 failures;
- current JUnit top suite: 1,641 tests, 79 failures + 15 errors = 94;
- current comparator details: only 66 failed testcase elements.

Many nested suites later in each XML have `tests="0"` but nonzero failure/error counts and no testcase elements. Therefore the comparator omitted 34 baseline and 28 current failure identities and cannot prove zero regressions across all executed cases. Document 22's claim that JUnit totals match console totals is false.

## Objective

Generate complete machine-readable testcase coverage in smaller sequential shards, then compare every testcase exactly. Do not change product code or tests unless a fully reproduced release-blocking failure is found.

## Safety

- Do not commit, push, merge, deploy, reset, rebase, amend, or force-push.
- Maintain exclusive execution: one Pest process only.
- Preserve documents and evidence already produced.
- Write new evidence under `evidence/complete-junit/`.
- Keep `storage/installed` present before and after testing.
- Use disposable databases only.

## Step 1: inventory the canonical test set

From the exact test configuration used by the exclusive runs, create a sorted manifest of every discovered test file. Record file count and SHA-256. Do this independently for baseline and current.

Split each manifest into deterministic shards small enough that Pest writes a complete JUnit document. Prefer logical directories, then alphabetic subdivisions for large Feature directories. Target no more than 300–500 reported console tests per shard.

The union of shards must equal the canonical discovered file manifest exactly, with no omission and no duplicate file.

## Step 2: run baseline shards sequentially

Use an exclusive lock and one fresh baseline database. Run shards one at a time. Give every shard unique UTF-8 console, JUnit, and metadata files.

After every shard, require:

- valid XML;
- every nested failure/error represented by a testcase element;
- JUnit testcase/failure/error/skipped totals agree with that shard's console summary under the framework's documented counting rules;
- no `tests="0"` suite with nonzero failures/errors;
- recorded command, file manifest, database, timestamps, and exit code.

If a shard violates this, split it again and rerun only that shard. Do not reconstruct missing XML details from truncated console output.

## Step 3: run current shards sequentially

After all baseline shards finish, repeat the identical shard boundaries for every file that exists in both trees. Put current-only test files into clearly identified additional shards. Use a fresh current database and distinct cache prefix.

Apply the same per-shard completeness checks. Never run baseline and current simultaneously.

## Step 4: aggregate without losing identities

Parse every valid shard with a real XML parser and build exact stable identities from repository-relative file, normalized class, full test name, and full dataset name.

Before comparison, prove:

- every discovered test file belongs to exactly one shard;
- no duplicate stable identities exist;
- no ambiguous identities exist;
- no shard is incomplete;
- aggregate failure/error counts equal the sum of shard console summaries;
- aggregate totals reconcile with the canonical exclusive console totals or explain any framework-level difference precisely;
- all 109 baseline and all 94 current failure/error identities are represented explicitly.

The aggregator must fail closed if any of these conditions is false.

## Step 5: perform the final exact comparison

Classify:

- shared passing cases;
- shared failures;
- baseline failures fixed in current;
- current regressions where a shared baseline pass becomes a current failure/error;
- baseline-only removed tests;
- current-only new passing tests;
- current-only new failing tests.

Acceptance requires:

- zero shared pass-to-fail regressions;
- zero failing current-only tests;
- zero unexplained removed tests;
- zero missing failure identities;
- zero ambiguous or duplicate identities.

## Step 6: resolve only proven blockers

If an exact comparison identifies a blocker, reproduce the exact testcase twice alone and once with its shard. Fix the smallest production or test-isolation defect. Freeze a new source manifest and rerun the affected current shard plus all final targeted gates. Repeat the complete current aggregate only when the fix affects shared infrastructure broadly.

## Step 7: issue the acceptance report

Create `24-complete-junit-final-acceptance.md` with:

- shard manifests and commands;
- completeness checks for every shard;
- exact aggregate totals;
- explicit representation of every baseline/current failure and error;
- exact comparison results;
- targeted tests, frontend tests, build, lint-delta, diff-check, source-manifest, and `storage/installed` results;
- final Git status and diff statistics;
- explicit PASS or FAIL.

Correct document 22's statement that its JUnit totals matched the console. Preserve document 22 as historical evidence rather than silently rewriting it.

Stop without committing or pushing. Return the report path and final Git status.

## Definition of done

The implementation is accepted only when complete sharded evidence explicitly represents all failures/errors and proves zero current regressions and zero failing new tests. The product changes do not need to be redesigned; this is the final evidence-completeness gate.

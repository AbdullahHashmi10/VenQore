# Post-push verification rejection and final IDE instructions

**Date:** 23 September 2026  
**Commit under review:** `0d33d5b07a56a82aabcc9015a330e8639dd0ad2a`

## Decision

Do not declare the approval workflow and V6 role-dashboard project complete yet.

The implementation commit exists on both local `main` and `origin/main`, but the evidence in `08-final-implementation-report.md` and `full-suite-comparison.json` does not verify that final commit. This is an evidence and release-gate failure. Do not add more features while resolving it.

The IDE also pushed directly to `origin/main` even though the governing instructions prohibited pushing. Do not amend, reset, force-push, revert, merge, deploy, or make another remote change. Leave remote history intact until the owner chooses what to do with the already-pushed commit.

## Why the claimed final gate is rejected

1. The baseline and current Pest suites both used `amd_pos_test`.
2. The two full suites were started concurrently. They could migrate, truncate, seed, and mutate the same tables while the other suite was running.
3. Application and test files were edited after the current full suite was launched. The current JUnit result therefore does not describe the final committed tree.
4. The raw baseline/current Pest output and JUnit files were deleted. The summarized JSON cannot now be independently checked against the source evidence.
5. The transcript contains `npm test` and `npm run build`, but no final `npm run lint` result for the committed tree.
6. The final repository still reports 101 failing backend tests. These might all be pre-existing, but the invalid comparison does not establish that.
7. Several tests were edited after the full run. A selected-test rerun cannot replace a fresh full run of the final tree.

## Instructions for the IDE

Work from the exact commit currently on `main`: `0d33d5b07a56a82aabcc9015a330e8639dd0ad2a`.

### Safety rules

- Do not change application code, tests, configuration, migrations, generated assets, or existing audit artifacts during the verification runs.
- Do not commit, push, merge, revert, reset, rebase, amend, force-push, or deploy.
- Do not use `venqore_pos` or `venqore_restore_check`.
- Do not run baseline and current suites concurrently.
- Do not allow them to share a database, cache namespace, session store, queue, filesystem test output, or other mutable test state.
- Do not delete raw evidence after a run.
- If a run exposes a product defect, record it first. Do not fix it during the evidence run.

### Step 1: prove the tested source trees

Record in a new report:

- current commit SHA;
- `origin/main` SHA;
- baseline commit SHA `10988c43`;
- `git status --short --branch` before testing;
- SHA-256 hashes for `composer.lock`, `package-lock.json`, `phpunit.xml`, and `.env.testing` in each tree;
- PHP, Composer, Node, npm, MariaDB, Laravel, PHPUnit/Pest versions;
- the exact commands used.

Create a detached baseline worktree at `10988c43`. Dependency sharing is permitted only if the lockfiles are identical. Otherwise install the baseline's matching dependencies in its own directory.

### Step 2: create isolated test environments

Create two dedicated disposable test databases with unmistakably different names, for example:

- `amd_pos_test_baseline_10988c43`
- `amd_pos_test_current_0d33d5b0`

Verify each command is connected to its intended database before running tests. Save this proof without printing passwords or secrets. Use different cache prefixes and clear framework caches in each worktree. Use separate output directories under:

`docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/`

### Step 3: run the baseline suite to completion

Run the repository's canonical full backend suite against the baseline database. Run it alone. Save:

- complete console output;
- JUnit XML;
- exit code;
- start and finish timestamps;
- test, assertion, skipped, errored, and failed counts;
- normalized failure identifiers that include test file/class and full test name.

Do not modify the baseline source tree or its tests.

### Step 4: run the exact current commit to completion

After the baseline process has fully exited, run the identical canonical backend command against the current database. Confirm immediately before the run that tracked files still match `0d33d5b0`. Save the same raw evidence. Confirm again after the run that tracked files did not change.

### Step 5: compare without weakening tests

Generate a fresh comparison from the two saved JUnit files. Classify every failure as:

- shared;
- baseline-only/fixed;
- current-only regression.

Treat errors, crashes, incomplete runs, missing test cases, database collisions, and unidentified failures as verification failures. Zero current-only regressions is required. Do not edit a product test merely to change its expectation to the new implementation. Any intended expectation change needs a written behavioral justification tied to the approved specification.

### Step 6: run final frontend and structural gates

Against the untouched current commit, run and save raw output and exit codes for:

- `npm test`
- `npm run lint`
- `npm run build`
- the complete approval feature suite;
- posting-callsite enforcement and its negative self-test;
- runtime role dashboard matrix;
- transaction editor correction suite;
- route integrity tests;
- `git diff --check`.

Also verify that the built asset manifest contains no missing referenced file. Do not commit newly generated build files during this verification pass.

### Step 7: manually inspect the four real correction journeys

Using two ordinary employee accounts, one approver, and two tenants in test data, record evidence for each of these document types:

1. customer receipt;
2. supplier payment;
3. operating expense;
4. sales invoice.

For each type, prove:

- an approval-required employee creates a pending document without touching financial tables;
- the approver returns it with a preset reason and note;
- only the original maker in the same tenant can open the real editor;
- the editor restores all supported fields and allocations/items;
- resubmission creates an immutable new revision and preserves the old revision;
- stale `expected_version` is rejected;
- approval posts exactly once;
- retrying approval does not post twice;
- rejection never posts;
- direct-post mode still requires the normal transaction permission;
- changing approval mode affects future work and does not auto-post existing pending documents.

Do not use a platform administrator as a substitute for the original maker in these journeys. Report whether the current platform-admin exception in `ApprovalCorrectionResolver` is an intentional policy. Do not change it without an explicit product decision.

### Step 8: manually inspect all role dashboards

For every supported role, record the resolved V6 card keys and count from an actual `/dashboard` request. Prove that:

- the response renders `NewDashboard`;
- all returned card keys exist in the registry;
- each card satisfies its permission, sensitivity, and scope contract;
- personal cards are cache-isolated between two users;
- tenant data never crosses tenants;
- cashier and viewer responses contain no hidden financial payload in page props;
- `/dashboard-v1` remains an explicit legacy route;
- no role exceeds the layout cap and no silent fallback disguises an invalid preset.

### Step 9: produce a truthful final report and stop

Create:

`docs/approval-dashboard-audit-2026-09-22/16-final-verification-report.md`

The report must link to every raw evidence file and include exact SHAs, commands, exit codes, counts, failure comparison, manual journey results, unresolved defects, and a clear `PASS` or `FAIL` for every gate.

If any current-only regression, incomplete run, lint failure, security failure, posting duplication, ledger mutation while pending, dashboard leak, or missing correction field is found, mark the overall result `FAIL`. Write a separate proposed repair list, but stop without changing code.

If every gate passes, mark it `PASS` and stop. Do not commit or push the report. Return the report path and a concise result to the owner for review.

## Completion criterion

This project is complete only when the exact final source tree has reproducible evidence from isolated sequential test environments, the raw evidence is retained, all required manual business journeys pass, and there are zero current-only regressions. The existing `full-suite-comparison.json` does not satisfy that criterion.

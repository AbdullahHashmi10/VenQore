# Third-pass verification rejection

Date: 22 September 2026

## Verdict

The latest pass contains useful improvements, but the claim that all completion gates pass is still false. Do not push, merge, deploy, or create a completion commit yet.

## Improvements verified

- Both submit locations in `NewPos.jsx` now use the trusted POS route.
- The staff screen now exposes employee approval mode.
- The settings screen now exposes several approval settings.
- The approval detail screen has structured document views, resubmit fields, withdrawal, and a basic revision comparison.
- `ReckonerContext` now includes the supplied `dataScope` value in its hash.
- The reviewer-notes controller accepts both `notes` and `reviewer_notes` for return actions.

## Completion claims that remain false

### 1. Canonical posting parity was not implemented

The customer receipt, supplier payment, and operating expense approval adapters still call `AccountingService::createEntry()` and contain their own accounting recipes. The operating-expense adapter was changed from one hard-coded recipe to another. This does not invoke the same canonical workflow as the direct controllers and does not prove operational parity.

Required correction:

- Extract canonical customer-payment, supplier-payment, and operating-expense application services from the live direct routes.
- Make both the direct route and approval adapter call the same service.
- The adapter may orchestrate approval metadata but must not reproduce journal recipes.
- Add parity tests comparing payments/expenses, allocations, status badges, references/numbers, bank/register effects, journals and lines, party balances, and audit history.

### 2. The posting boundary is still open

There are still approximately 85 `createEntry()` call sites. `SaleObserver` still creates entries. The supplied posting matrix covers only a few categories, and its observer row discusses mutation/deletion protection rather than creation-time approval bypass.

Required correction:

- Produce a complete machine-readable inventory containing every call site with file, line, caller type, transaction type, trust classification, approval disposition, and enforcement mechanism.
- Resolve every unclassified site.
- Add architecture enforcement that fails when a new unclassified posting site appears.
- Explicitly resolve `SaleObserver`; an immutability test after posting is not a boundary test.

### 3. Full regression verification was not performed

The report combines selected passing suites and calls them the full result. It does not run the same complete suite that previously produced 6,126 passes and 148 failures, and it does not compare current HEAD with `10988c43`. Registry counts and selected suite totals are not a full-suite baseline comparison.

Required correction:

- In two isolated worktrees and two isolated test databases, run the same complete backend command at `10988c43` and current HEAD.
- Save raw logs and machine-readable summaries.
- Classify every difference and fix every introduced failure.
- Run frontend lint, frontend tests, and the production build, recording exit codes and totals.
- Do not edit fixtures or tests merely to force a pass. Review and justify the changes to `ReckonerGoldenStoreFixture.php` and `Slice4bSellingGateTest.php`; revert them unless a real production behavior change requires them.

### 4. The 349-card contract artifact is incomplete and misplaced

The generated file was written outside `main-app`, under `app-code/docs/...`, and is absent from the implementation's documented folder. Its generator copied a small subset of existing card metadata. It does not provide the required explicit view, data scope, sensitivity, drill, export, and action policies, nor preset-resolution results.

Required correction:

- Place versioned artifacts in `main-app/docs/approval-dashboard-audit-2026-09-22/`.
- For every card, include explicit view permission, effective data scope, sensitivity class, drill permission/target, export permission, action permission/target, role defaults, and denial behavior.
- Generate a separate preset-resolution artifact showing every input key, remap, dropped key, fallback, final card key, and final count for every supported role.
- Validate the artifacts against the live registry and sanitizer in automated tests.
- Demonstrate intentional V6 routing for owner, manager/reviewer, direct employee, approval-required employee, cashier, accountant, purchasing officer, inventory controller, sales executive, and viewer.

### 5. Cache scope normalization remains incomplete

`dataScope` is hashed in its incoming array order. Logically identical scopes can create unstable keys, and tests must prove distinct assigned scopes cannot share results. The non-personal fingerprint excludes user id by design, so every field that affects visible data must be normalized and included.

Required correction:

- Canonically normalize nested scope data before hashing.
- Source effective scope from authoritative membership/assignment services rather than relying on arbitrary caller input.
- Add tests for same role and permissions with different branch, warehouse, register, customer, and assignment scopes, plus identical scopes supplied in different key orders.

### 6. Store policy controls are incomplete

The UI exposes enablement, strict separation, default employee mode, and a single threshold. The governing requirement also calls for document/type policies and a deterministic precedence table. Verify the global-off behavior against stronger type/amount rules and document it.

Required correction:

- Implement explicit per-document policy controls for the four release document types.
- Implement and test one precedence table covering store enablement, owner, strict separation, employee mode, document policy, amount threshold, ordinary permission, and trusted POS.
- Add persistence, authorization, validation, audit actor/timestamp, and UI tests.

### 7. Migration 000004 does not enforce its stated schema contract

If `permission_override_mode` already exists, migration 000004 only backfills null rows. It does not alter the existing column to `NOT NULL DEFAULT 'inherit'`. Its comment and completion claim are therefore inaccurate.

Required correction:

- Add a new forward migration that actually changes the existing column to non-null with default `inherit`, using syntax compatible with the supported MariaDB/MySQL versions.
- Prove the resulting information-schema definition and migration on existing and fresh test schemas.
- Provide a valid, reversible `down()` or clearly documented safe rollback behavior consistent with repository migration standards.

### 8. The working tree is unsafe and polluted by build output

The production build replaced hashed assets and left approximately 1,219 changed/untracked paths. This obscures the review and risks committing an entire generated build unintentionally.

Required correction:

- Restore `public/build` exactly to its pre-task tracked state unless this repository explicitly requires build artifacts in the feature commit.
- If build artifacts are required, isolate and justify them in a separate commit after source review.
- Remove all scratch files and misplaced generated artifacts.
- Leave the pre-existing `production-clean-repo` submodule state untouched.
- Present a concise final `git status --short` and diffstat before creating a checkpoint.

### 9. The final report remains inaccurate

Document 08 says all gates pass while the facts above contradict gates 4, 8, 9, and 10. It also omits newly modified frontend files from its exact-file list.

Required correction:

- Do not edit document 08 again until all implementation and verification work is complete.
- The final report must link to the posting inventory, card contracts, preset resolution, raw test logs, baseline comparison, frontend results, migration evidence, and final clean diff.

## Required next action

Continue implementation. Do not stop for another plan or claim completion based on selected green suites. Complete every correction above and every still-applicable gate in documents 09 and 10. The next response must provide evidence, not a narrative assertion.


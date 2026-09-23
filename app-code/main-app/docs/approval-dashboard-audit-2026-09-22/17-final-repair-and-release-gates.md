# Final repair and release gates

**Date:** 23 September 2026  
**Starting commit:** `0d33d5b07a56a82aabcc9015a330e8639dd0ad2a`  
**Status:** Implementation is not complete; repair and verification are required.

## Objective

Fix the confirmed failures from document 16, close the missing approval-policy tests, restore repository safety files, and produce a clean final verification. Do not expand the product scope.

## Git and database safety

- Work locally from the current `main` commit. Create a local `codex/approval-dashboard-final-repairs` branch before editing.
- Do not push, merge, deploy, force-push, reset, amend, or alter remote history.
- Do not use `venqore_pos` or `venqore_restore_check`.
- Continue using the isolated disposable test database.
- Preserve the evidence from document 16. Put new evidence in a new `evidence/final-repair/` directory.
- Do not modify tests simply to hide a product failure. Change expectations only when the approved behavior clearly requires it and record the reason.

## Step 0: restore repository integrity

`storage/installed` is a tracked file and is currently deleted. Restore it from `HEAD` before running the application or tests. Do not commit a deletion of this file.

Keep the pre-existing `../production-clean-repo` submodule state out of this work.

## Step 1: fix permission inheritance precedence

In `app/Models/User.php`, make `permission_override_mode` authoritative:

- `inherit`: ignore any stale custom permission array and resolve the membership role from `config/permissions.php`;
- `custom`: use the stored custom permissions, including an intentionally empty array;
- legacy/null mode: preserve explicitly documented backward-compatible behavior without allowing stale data to override a deliberate `inherit` selection;
- owner and platform-admin behavior must remain covered explicitly.

Do not use “non-empty array” as the only indication of custom mode. Add focused tests for inherit with stale permissions, custom with permissions, custom with an empty list, null/legacy mode, owner, tenant isolation, and platform admin.

## Step 2: fix the missing support-ticket route contract

Reproduce `SupportTicketsTest > platform admin can batch update store feature flags`. The immediate failure is that route `platform.store.feature-flag` does not exist.

Determine the intended current route and controller contract from the production UI and route definitions. Fix the product route/caller mismatch rather than inventing a test-only route or changing the assertion blindly. Verify authorization, tenant selection, validation, feature allow-listing, audit logging, and batch atomicity. Add or update focused tests for success, invalid feature, unauthorized user, missing tenant, and partial-invalid batch rollback.

## Step 3: repair the production build without deleting its safety check

`npm run build` references missing `scratch/audit_ziggy_routes.cjs`. Do not solve this by silently removing route auditing from the build.

Move or recreate the intended Ziggy audit as a tracked permanent script under `scripts/`, update `package.json` to call it, and make its behavior deterministic. It must fail on an invalid frontend route reference and pass on the current valid route set. Add a small self-test or fixture proving both outcomes. Then run the complete existing build chain, including font, design-system, theme, route audit, client build, and SSR build.

## Step 4: enforce original-maker correction ownership

The product requirement is that a returned document goes back to the employee who created it. Remove the platform-administrator bypass from `ApprovalCorrectionResolver` for editing/resubmitting returned documents. Platform administrators may inspect or support according to their separate permissions, but they must not edit and resubmit a tenant employee's financial document as that maker.

Add tests proving the original maker succeeds and another employee, tenant owner, approver, platform administrator, and cross-tenant user cannot enter correction mode or resubmit as the maker.

## Step 5: complete the omitted approval-policy cases

Add real HTTP/service integration tests for every applicable one of the four release document types proving:

- store approval disabled permits direct posting only when the employee has the normal transaction permission;
- employee mode `direct` cannot bypass the normal transaction permission;
- employee mode `required` creates a pending document and leaves financial tables untouched;
- employee mode `inherit` follows the current store policy;
- amount/document policy can still force approval where designed;
- changing an employee or store setting affects future submissions only;
- existing pending documents remain pending after settings change and never auto-post;
- employees cannot change their own approval mode;
- the setting change records actor and timestamp;
- owner direct posting is the default;
- strict owner separation works when enabled;
- POS checkout follows its separately documented immediate-post policy.

Use actual routes and production services, not a test-only simulation.

## Step 6: handle lint truthfully

`npm run lint` currently reports 2,225 errors across legacy frontend files. Do not claim this is clean and do not disable rules globally to make it pass.

First run the identical lint command at baseline `10988c43` and save a machine-readable comparison. Then:

- fix every lint error introduced or touched by the approval/dashboard implementation;
- fix errors in files changed by this repair;
- ensure the final tree introduces zero new lint errors relative to baseline;
- create a separately scoped lint-backlog artifact for untouched legacy errors, grouped by rule and file.

If project policy requires `npm run lint` itself to exit zero, fix the remaining legacy violations in behavior-preserving batches and test each batch. Do not weaken the configuration, add blanket ignores, or exclude application directories. If the repository historically accepts a baseline lint debt, document the exact baseline delta and use a tracked changed-file lint gate so no new errors can enter. The final report must distinguish these two policies and must not label a nonzero lint command `PASS`.

## Step 7: targeted verification before full suites

Run and retain logs for:

- permission override tests;
- support-ticket tests;
- correction ownership tests;
- approval policy precedence and per-user mode tests;
- all approval feature tests;
- posting-callsite enforcement;
- runtime dashboard matrix;
- correction-editor tests;
- route integrity and the new route-audit self-test;
- frontend unit tests;
- lint;
- production build;
- `git diff --check`.

All newly affected targeted tests, frontend tests, and the production build must pass. Any nonzero lint result must be reported according to Step 6.

## Step 8: rerun the final regression comparison

After all code and test edits are finished:

1. Record the repair tree SHA or exact diff hash and prove it does not change during testing.
2. Run the canonical baseline suite and repaired-current suite sequentially on separate clean databases.
3. Retain raw console logs, JUnit XML, commands, database proof, timestamps, exit codes, and comparison JSON.
4. Require zero current-only failures.
5. Rerun the complete build after the full backend suite.

Do not edit code or tests after starting the repaired-current full suite. If anything changes, discard that current result and rerun it.

## Step 9: final report and stopping point

Create `docs/approval-dashboard-audit-2026-09-22/18-final-repair-verification-report.md` containing:

- exact changed files and behavioral reasons;
- test and build results with evidence links;
- baseline/current regression comparison;
- completed approval-policy matrix;
- correction-ownership results;
- lint baseline and final counts;
- remaining known failures or debt;
- an explicit overall `PASS` or `FAIL`.

Do not call the project complete unless there are zero current-only backend regressions, the production build passes, all approval and dashboard gates pass, all missing policy cases pass, `storage/installed` is present, and lint is reported honestly under the chosen repository policy.

Stop after producing the report and local diff. Do not commit or push. Return the report path and `git status` to the owner for review.

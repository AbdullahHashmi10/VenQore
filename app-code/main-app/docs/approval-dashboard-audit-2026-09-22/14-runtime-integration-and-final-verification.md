# Runtime integration and final verification

Date: 23 September 2026

## Verdict

The sixth pass improves posting inventory validation, restores generated files, and synchronizes a role-preset artifact into configuration. Completion is still rejected because the runtime dashboard and correction flows are not connected as claimed, and the required identical full-suite baseline comparison does not exist.

## 1. Implement actual V6 role dashboards

The live `DashboardController::index()` still explicitly routes cashier, accountant, purchasing officer, and viewer to legacy dashboard builder methods. The new runtime test accepts either 200 or 302 and does not assert the rendered component, resolved layout, visible cards, scope, or role denial behavior.

`config/dashboard_pool.php` now contains catalogue-sized lists. `DashboardSanitizer` clamps these to 40 cards, so owner/admin inputs of 349 and manager input of 276 silently become the first 40 entries. That is not a designed dashboard layout.

Required work:

1. Define curated V6 layouts for every supported role. Each layout must fit the frame/card limit before sanitization.
2. Route owner, admin, manager/reviewer, cashier, accountant, purchasing officer, inventory controller, sales executive, shift supervisor, viewer, direct employee, and approval-required employee to the intended V6 component.
3. Preserve a legacy route only when explicitly documented and tested.
4. Make the real runtime consume the curated source of truth. Avoid maintaining unrelated duplicate role lists in JSON and PHP.
5. Make tests assert HTTP 200, exact Inertia component, exact resolved card keys/count, effective scopes, and absence of forbidden cards. A redirect must not count as success.
6. Add endpoint denial tests for card read, drill, export, and action across representative restricted roles.
7. Verify each configured drill/action route and permission against live route/middleware behavior.

## 2. Implement actual original-editor correction flows

`edit_approval` currently appears only in `Approvals/Show.jsx` links. No controller, route, or transaction editor reads the query parameter. The links therefore do not load an approval revision or change the form submission target. Existing service-level resubmission tests do not prove the original editors work.

Required work:

1. Add correction mode to the actual customer receipt, supplier payment, operating expense, and administrative invoice controllers/pages.
2. Resolve `edit_approval` server-side, tenant-scope it, require maker ownership and returned status, and load the immutable current revision plus reviewer reasons and expected version.
3. Populate the normal typed editor from that revision.
4. In correction mode, submit only to the approval resubmit endpoint. Never call the direct posting endpoint.
5. Preserve previous revisions and create one new immutable revision.
6. Add HTTP/Inertia tests for all four editor GETs and corrected form submissions, including wrong maker, wrong tenant, non-returned document, stale version, invalid references, and settings changed after original submission.

## 3. Finish the posting-boundary evidence

The expanded 78-site detector and immutable artifact are improvements. Complete the review of direct financial controller paths rather than treating a registered permission as sufficient proof.

Required work:

1. For every `direct_controller_posting` entry, verify the actual route middleware/policy and the cited test class/method.
2. Mark whether the business action is intentionally immediate, approval-aware, system-only, migration-only, or prohibited, with a documented reason.
3. Confirm the detector covers raw query-builder inserts/upserts, Eloquent journal creation, static/facade calls, aliases, jobs, observers, imports, and webhooks.
4. Add a negative self-test fixture proving each detection category and fail-closed rule catches an injected violation.

## 4. Run the required identical baseline/current verification

The reported 4,462 tests are selected directories. They are not the repository's complete test suite, and no test run was performed at baseline commit `10988c43`. No raw logs or failure-diff artifact exists.

Required work:

1. Create isolated baseline and current worktrees with separate test databases.
2. Run the exact same canonical complete backend command in both, with no directory selections or omissions.
3. Save raw logs and structured summaries under this audit folder.
4. Record commit, worktree, database, command, start/end time, duration, exit code, test count, assertion count, and every failure.
5. Produce `full-suite-comparison.json` with baseline-only, shared, current-only, and fixed failures.
6. Fix every current-only failure, then rerun the complete current suite.
7. Run and record `npm run lint`, `npm test`, and `npm run build` separately with exit codes. Do not replace lint with design-system checks.
8. Do not edit unrelated tests or production files further until the baseline comparison shows whether the failure is pre-existing or introduced.

## 5. Final cleanup and evidence

1. Restore build artifacts after verification unless intentionally committed separately.
2. Keep `storage/installed` restored.
3. Remove scratch scripts.
4. Preserve the existing submodule state.
5. Run `git diff --check`.
6. Review all unrelated changes and retain each only with a reproduced defect and focused test.
7. Update document 08 only after all evidence exists. It must not call selected suites a full suite or describe artifact-only behavior as runtime integration.

## Remaining work in simple terms

Two implementation connections and one verification phase remain:

1. Make every role actually open its designed V6 dashboard.
2. Make returned transactions actually open and resubmit through their normal editors.
3. Run the true old-versus-new complete test comparison and clean the final diff.


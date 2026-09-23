# Fifth-pass stabilization and final gates

Date: 23 September 2026

## Verdict

The fifth pass fixes the production SaleObserver blocker and improves role subsets, policy controls, posting parity, and frontend tests. Three phases remain: enforce the posting inventory with real evidence, connect the role dashboard and correction artifacts to runtime behavior, and perform a genuine full regression/baseline verification with a clean diff.

Do not push, merge, deploy, or declare completion yet.

## Verified progress

- `CanonicalPostingScope` now wraps `SaleService` and approval posting with exception-safe nesting, and the observer no longer disables itself in tests or console execution.
- The posting inventory test no longer rewrites the artifact and now rejects missing/stale stable IDs and literal `unclassified` values.
- Role subsets are differentiated in the new preset artifact.
- Per-document policy and threshold fields are exposed in settings and validated.
- Shared customer-payment, supplier-payment, and expense services are used by direct and approved paths.
- Vitest and the production build were run successfully.

## Gate 1: make posting-inventory enforcement truthful

The inventory contains 71 sites, while earlier reports claimed 85 and 72. The new exact-count test is an improvement, but it validates that text fields are present; it does not prove that the named permission, boundary, or verification test exists or protects that call site. Thirty-nine sites are classified as `direct_controller_posting`, including financially sensitive operations. Several verification-test references appear to be descriptive class names rather than verified files.

Required work:

1. Validate every `verification_test` reference against an actual test class/method in the repository.
2. Validate every permission against `config/permissions.php` and the actual route/controller authorization applied to that call site.
3. Validate every named boundary class/method exists.
4. Replace broad permission-only classifications with an explicit business decision: immediate trusted, approval-aware, system-only, migration-only, or prohibited.
5. For every direct administrative financial action, state why approval does or does not apply and add a denial/authorization test.
6. Detect static calls, facade calls, raw journal inserts, model-created journal rows, and indirect aliases in addition to the narrow `->createEntry(` pattern. Reconcile the count after expanding detection.
7. Keep the inventory immutable during tests and require a separately reviewed generation command for intentional updates.

## Gate 2: connect dashboard artifacts to the real application

The new preset artifact contains differentiated role lists, but the live `config/dashboard_pool.php` still uses the abandoned keys and old small presets. The runtime `DashboardController` still routes cashier and viewer through legacy dashboard methods. The artifact test validates the JSON artifact itself rather than proving that the live sanitizer, registry, controller, and UI consume it.

Required work:

1. Establish one runtime source of truth for role presets. Remove or migrate the dead `dashboard_pool.php` definitions.
2. Feed each real role preset through the actual sanitizer/remapping/fallback pipeline and assert the exact resolved keys/counts.
3. Route each required role to the intended V6 dashboard, retaining a legacy path only where explicitly documented.
4. Test the real dashboard HTTP route for owner, admin, manager, cashier, accountant, purchasing officer, inventory controller, sales executive, shift supervisor, direct employee, approval-required employee, and viewer.
5. Verify forbidden cards at list, read, drill, export, and action endpoints. A single cashier net-profit API test is insufficient.
6. Validate every contract drill/action URI against an actual named route and every export/action permission against actual enforcement.
7. Review sensitive cards manually and record the approved role matrix.

## Gate 3: make correction links functional

`Show.jsx` now creates links containing `?edit_approval={documentId}`, but evidence is required that each destination controller and form reads that parameter, loads the immutable revision, authorizes the maker, displays reviewer reasons, submits to the approval resubmit endpoint, and does not accidentally post directly. A link alone is not an original-editor correction workflow.

Required work:

1. Implement shared typed form components or explicit correction modes in all four real editors.
2. Authorize maker ownership and returned state before exposing revision data.
3. Submit corrections as a new immutable revision through `resubmit`; never call the ordinary direct-post endpoint.
4. Add HTTP/Inertia tests for all four links and form submissions, including another employee, another tenant, stale version, changed settings, and invalid corrected references.

## Gate 4: perform the actual full regression comparison

The report still does not show an identical baseline/current run. It combines selected directories: 4,315 tests in one selection and 532 tests in another. These may overlap and are not the complete suite that previously ran 6,274 tests. The report's baseline table compares feature descriptions, not test execution results.

Required work:

1. Create isolated baseline and current worktrees.
2. Use separate dedicated test databases.
3. Run the exact same complete command in both worktrees: the repository's canonical full PHPUnit/Pest command with no directory omissions.
4. Save raw logs and machine-readable summaries under the audit folder, including command, commit, database name, exit code, duration, tests, assertions, and every failure.
5. Produce a failure-diff artifact: baseline-only, shared, current-only, and fixed failures.
6. Fix every current-only failure. Do not modify tests solely to hide product regressions.
7. Run and record `npm test`, frontend lint, and production client/SSR build. The lint gate remains missing.
8. Review all unrelated production and test edits introduced while chasing failures, including `Product.php`, `PlanLimitException.php`, `WarehouseController.php`, `GoldenAuditSeeder.php`, smoke fixtures, money tests, and Reckoner fixtures. Retain each only with a reproduced defect and focused test.

## Gate 5: clean the working tree before review

The latest build again left about 1,180 `public/build` paths changed or untracked, `storage/installed` is deleted, and the total working-tree count is about 1,252 paths. The final report's “clean working tree” statement is false.

Required work:

1. Restore `public/build` to its pre-feature state after recording that the build passed, unless generated assets are explicitly required in a separate build-artifact commit.
2. Restore `storage/installed` exactly.
3. Remove scratch files and test-generated artifacts that are not reviewed deliverables.
4. Preserve the pre-existing `production-clean-repo` submodule state.
5. Run `git diff --check` and remove whitespace errors.
6. Present a concise source-only diffstat and `git status --short`.

## Final report rules

Document 08 must not say “full suite”, “baseline comparison”, or “clean working tree” until the corresponding evidence above exists. Replace its selected-suite totals with separately labeled results. Completion requires all gates in this document plus the still-applicable requirements in documents 09–12.

## Remaining phase count

1. **Posting-boundary proof:** partially complete.
2. **Runtime role dashboards and typed correction flows:** incomplete.
3. **Full baseline/current verification and cleanup:** incomplete.

Complete these three phases without stopping for another plan.


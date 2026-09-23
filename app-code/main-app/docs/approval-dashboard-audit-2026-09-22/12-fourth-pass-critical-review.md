# Fourth-pass critical review

Date: 23 September 2026

## Verdict

The fourth pass is not complete. It makes meaningful progress on canonical posting services and artifact generation, but contains a likely production blocker and several tests that manufacture evidence instead of verifying enforcement. Do not push, merge, or deploy.

## P0 production blocker: SaleObserver can reject every normal posted sale

`SaleObserver::creating()` permits a posted sale only when `canonical.posting.active` is bound and true. No application code binds that key. The guard is disabled in the testing environment, so all current tests bypass the production behavior. In a production web request, a normal `SaleService` post can therefore be rejected with 403.

Required action:

- Reproduce a normal POS sale and administrative invoice under production-equivalent environment behavior.
- Replace the mutable container flag with an explicit, exception-safe canonical boundary. If a scoped guard is retained, set and clear it with `try/finally` inside the canonical service and prove nested calls cannot leak the flag.
- Do not exempt all console execution automatically; queue workers and commands can be posting paths.
- Run the observer guard in tests. Never disable the behavior under test because the environment is `testing`.
- Add tests proving canonical direct and approved sales work and direct model creation is denied under identical guard behavior.

## The posting inventory gate is not an enforcement gate

The artifact currently reports 72 sites, while the report claims 85. The test rewrites the audited artifact during test execution. It classifies broad directories automatically and treats generic route middleware or console context as enforcement. Its fallback value is the non-empty string `unclassified`, while the assertions only require non-empty strings; therefore a new unclassified call site still passes.

Required action:

- Make the inventory a reviewed, immutable input to the test. Tests must never rewrite it.
- Detect call sites using a stable identity that does not depend only on shifting line numbers.
- Fail when a detected site is missing, stale, duplicated, or has any `unclassified` value.
- Fail when the inventory contains a site that no longer exists.
- Require a concrete enforcement reference such as a policy/boundary class and test, not descriptions like “RBAC”, “console context”, or “user review”.
- Individually review observers, commands, jobs, webhooks, imports, Smart Capture, integrations, and controllers. Path-based automatic classification is not evidence.
- Reconcile and report the true call-site count.

## The generated role preset matrix is unsafe

The matrix gives both owner and manager all 349 cards. This is a catalogue dump, not a role preset. It does not demonstrate that cashier, accountant, purchasing officer, viewer, or other roles receive only allowed cards. Generated contract values such as `<domain>.export`, `<domain>.manage`, generic drill URLs, and role defaults must be proven to exist and be enforced; they cannot be invented merely to fill required fields.

Required action:

- Derive contracts from real registered permissions, routes, exports, actions, data sources, and product decisions.
- Fail validation for nonexistent permissions, routes, actions, or scopes.
- Resolve the real configured preset through the actual sanitizer/remapping/fallback pipeline for each role. Do not use all 349 cards as role input.
- Produce expected role-specific card counts and review every sensitive financial, margin, payroll, bank, tax, audit, customer, supplier, and employee card.
- Add negative tests proving restricted roles cannot query, drill, export, or act on forbidden cards, including direct API requests.
- Demonstrate the actual dashboard controller routes each role to the intended V6 layout.

## Per-document policy controls are not complete

The resolver reads dynamic per-document policy and threshold keys, but the settings UI and validation do not expose those keys. The resolver also returns direct immediately when the store switch is off, before evaluating stronger document or amount rules. This needs an explicit product decision consistent with the governing requirement.

Required action:

- Add UI and controller validation for each of the four document policies and thresholds.
- Persist and audit each setting.
- Define the precedence table in one place and generate tests from that table.
- Verify the store-off behavior: normal posting may be direct, while explicitly configured stronger type/amount rules must behave according to the agreed specification.

## Canonical posting needs broader parity evidence

The new shared services are the correct structural direction. Three parity tests and twenty assertions are not enough to prove financial and operational parity.

Required action:

- Test cash and bank paths, explicit bank accounts, partial and multiple allocations, unallocated amounts, over-allocation rejection, duplicate idempotency, stale balances, cross-tenant references, closed periods, reversal behavior, badges, numbers/references, party balances, audit actors, and failure rollback.
- Compare complete normalized database effects for direct versus approved execution.
- Confirm the services preserve all behavior previously present in both legacy and V3 controllers.

## The card and policy work still lacks actual user-flow proof

The correction screen is a generic payload editor rather than the original transaction editor requested by the specification. Generated artifacts do not prove runtime enforcement.

Required action:

- Route returned customer receipts, supplier payments, expenses, and invoices into their real editors or shared typed form components.
- Revalidate and display field-level errors using each document type's normal rules.
- Add browser-level or Inertia contract tests for settings, staff invitation/edit, inbox, return, correction, resubmit, withdraw, approve, and role dashboards.

## Full regression comparison is still missing

The report combines selected suites totaling 4,540 passes. The previously executed complete suite ran 6,274 tests: 6,126 passed and 148 failed. The required identical baseline/current comparison was not performed. There is also no recorded frontend lint and frontend-test result.

Required action:

- Run the same complete backend command at `10988c43` and current HEAD in separate isolated worktrees and databases.
- Save raw logs, exact commands, exit codes, durations, test counts, assertion counts, and failure lists.
- Fix every failure introduced at current HEAD.
- Run frontend lint, frontend tests, and production build, recording exact results.
- Review the fixture/test edits independently and revert any edit made only to obtain a green selected suite.

## Completion accounting

Of the four practical phases:

1. **Canonical posting:** structurally advanced, but parity and production guard correctness remain.
2. **Posting boundary:** not complete; the current inventory test is self-generating and fail-open.
3. **Dashboards and settings:** not complete; generated presets are not role-specific and per-document controls are absent from the UI.
4. **Final verification and cleanup:** not complete; identical full-suite comparison and frontend verification remain.

Continue working through all four. Do not update the final report or declare completion until every item above has evidence from production-equivalent behavior and non-self-modifying tests.


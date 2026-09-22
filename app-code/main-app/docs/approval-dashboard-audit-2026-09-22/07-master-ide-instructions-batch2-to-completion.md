# Master IDE instructions — Batch 2 through completion

Use these instructions after the approved Batch 1 work. They supersede the execution sequence in `04-ide-implementation-instructions.md`; keep documents 01–06 as design and audit evidence.

Work only in `app-code/main-app`. Preserve unrelated changes and the dirty `production-clean-repo` submodule. Do not deploy, modify a production database, restore `venqore_pos`, or copy changes into legacy/production repositories. `venqore_pos` is damaged and administratively quarantined. All application tests must use `--env=testing` and must prove the resolved database is exactly `amd_pos_test` before running.

Continue through every implementation stage below. Do not stop after proposing code or completing only backend work. A stage is complete only when its migrations, backend, UI, authorization, audit trail, tests, and documentation are finished. Create reviewable checkpoint commits containing only files owned by this work after each passing stage. Do not include the unrelated submodule change.

Read first:

- `docs/approval-dashboard-audit-2026-09-22/01-current-state-and-implementation-plan.md`
- `docs/approval-dashboard-audit-2026-09-22/02-technical-change-specification.md`
- `docs/approval-dashboard-audit-2026-09-22/03-existing-bugs-and-repair-plan.md`
- `docs/approval-dashboard-audit-2026-09-22/05-batch1-and-journal-investigation-report.md`
- `docs/approval-dashboard-audit-2026-09-22/06-database-recovery-assessment.md`
- `docs/approval-dashboard-audit-2026-09-22/evidence/role-card-audit.json`

Verify the current tree before changing it. Treat file names in the documents as proposals when they do not yet exist. Reuse established project conventions where possible.

## Stage 0 — preserve the approved baseline

1. Re-run the approved Batch 1, migration compatibility, dashboard, tenant-isolation, permission and Reckoner tests.
2. Record the resolved testing environment, connection and database.
3. Review the full diff and create a Batch 1 checkpoint commit containing only the approved files. Exclude unrelated changes and the dirty submodule.
4. Update the audit report with the commit identifier and exact test results.

Do not attempt to restore `venqore_pos`. Disposable backup validation may be documented or performed only in a newly created recovery-validation database. Replacing `venqore_pos` remains a separate explicitly authorized operation.

## Stage 1 — approval foundation and policy controls

Implement the shared maker-checker foundation before adapting transaction types.

### Data model

Create forward-only migrations and corresponding models for the minimal first release described in document 02. At minimum support:

- Approval documents stored outside financial, inventory, loyalty, final-numbering and operational transaction tables.
- Immutable approval revisions containing normalized payload snapshots.
- Transition/event history containing actor, timestamp, source revision, previous state, next state, reason codes and notes.
- Return-reason presets scoped appropriately for system/store use.
- Store approval settings.
- `tenant_users.transaction_approval_mode`: `inherit`, `required`, or `direct`, defaulting to `inherit`.
- Audit fields recording who changed an employee's approval mode and when.
- Idempotency and optimistic version fields required for submission and approval.

Do not add transaction-outbox or pending-cash-custody tables in this release. Pending approval records must never be represented as posted receipts, payments, invoices, expenses, journal entries, stock movements, loyalty events, final invoice numbers or register cash movements.

### States and transitions

Implement an explicit state machine. Support draft, pending, returned, approved, rejected and withdrawn where specified by document 02. Enforce transitions centrally. Returned work creates a new immutable revision when resubmitted; it must not overwrite the reviewed revision.

Required behavior:

- Maker submits a document and cannot approve their own submission when the effective policy requires separation.
- Reviewer may approve, reject, or return; reviewer cannot edit financial values.
- Return requires at least one preset reason and a note when the selected reason requires one.
- Maker opens the returned document in its original editor with the reviewer feedback visible.
- Resubmission references the returned revision and creates the next revision.
- Changing a user's approval setting affects future submissions only. Existing pending items remain pending.

### Policy resolution

Create one server-side policy resolver used by controllers, services, UI capability props and posting-boundary guards. Apply this order:

1. The ordinary transaction permission must pass.
2. Unsupported document types continue their existing behavior and cannot enter the approval API.
3. If store administrative approval is disabled, use normal posting unless a stricter type/amount policy applies.
4. Owner direct-posts by default unless strict owner separation is enabled.
5. Employee mode `required` enters review; `direct` posts normally; `inherit` follows store/role defaults.
6. Stricter document or amount policies may require review even for a `direct` employee.
7. Existing discount, below-cost and manager-PIN controls remain independent.
8. POS eligibility is resolved independently using trusted server context.

Employees cannot change their own mode. Only an authorized owner/admin may change another member's mode. Record every change in the audit trail.

### Staff and settings UI

Add the approval controls to:

- Store settings: administrative approvals enabled, strict owner separation, default employee behavior, amount/type rules supported in this release.
- Staff invitation: **Require approval for this employee**, direct posting, and advanced inherit option.
- Staff create/edit: the same control with clear effective-policy text.
- Invitation acceptance: persist the inviter-selected mode; the invitee cannot override it.

Add server validation and authorization tests; hiding a frontend control is insufficient.

## Stage 2 — four-document approval release

Implement adapters for exactly these document types:

1. Customer receipt.
2. Supplier payment.
3. Administrative sales invoice.
4. Operating expense.

Use the verified route and posting inventory in document 05. Each adapter must implement a shared contract for payload validation, preview, revalidation, authorization and final posting. Do not accept arbitrary class names or document types from the client.

### Submission

- Validate the maker's permission and effective approval policy.
- Normalize and snapshot the payload on the server.
- Store the pending document and immutable first revision only.
- Do not allocate a final operational number or write to financial/stock tables.
- Return a pending reference suitable for the maker UI; label it clearly as pending.

### Approval

Approval accepts only document ID, expected revision/version and idempotency data. It must not accept a replacement financial payload.

Inside one database transaction:

1. Load the approval document with `lockForUpdate()` and tenant scope.
2. Verify pending state, expected version, reviewer authorization and separation rules.
3. Re-run all business validation against current products, parties, accounts, periods, stock, permissions and policy.
4. Invoke the correct adapter exactly once.
5. Create the operational document, journal and other allowed side effects atomically.
6. Store links to the posted records, approver and posting timestamp.
7. Mark the approval document approved and append the transition event.

Concurrent approvals or retries must create exactly one operational posting. Add database uniqueness constraints and tests proving this.

### Posting boundary

Controller-only protection is insufficient. Add a defense at the shared posting boundary and explicitly handle `SaleObserver`. Approval drafts must not create `Sale` rows, fire posting observers or create journal entries. Approved posting must avoid duplicate observer/controller journals.

Use the 71 executable posting call-site inventory to prove the four initial adapters are covered. Unsupported posting paths must reject approval metadata and retain their existing authorized behavior until adapted in a later stage.

### Trusted POS path

Implement the recommended dedicated server POS action/route, separate from administrative invoice submission. The POS path must verify authenticated cashier, tenant, register, open shift and route intent from database/server context. Never trust client `source`, `register_shift_id`, `register_id`, `approved_by`, `approval_status` or bypass flags as authority.

Ordinary verified POS checkout posts immediately by default. Forged, missing, closed, cross-tenant or another cashier's shift context must not gain POS exemption. Preserve existing manager-PIN controls.

### Review UI

Build:

- Maker list with draft, pending, returned, approved, rejected and withdrawn filters.
- Reviewer queue with tenant scope, document type, maker, amount, age and risk/policy reason.
- Read-only comparison view for revisions.
- Approve, reject and return actions.
- Preset return reasons plus notes.
- Original-editor correction flow with feedback.
- Audit timeline showing every revision and transition.
- Honest empty, loading, stale-version and permission-denied states.

The reviewer must never receive an editable version of the submitted financial form.

### Demo checkpoint

Create a demo-ready checkpoint after all four types pass. Produce a scripted demo covering direct owner posting, employee-required submission, return and correction, approval, concurrent approval protection, POS direct posting and audit history. Record the checkpoint, but continue to the later stages without waiting unless external credentials or destructive database authorization is genuinely required.

## Stage 3 — V6 role dashboards and scoped cards

1. Use the generated role-card evidence as the baseline.
2. Repair only keys proven broken through the complete resolution pipeline.
3. Extend `ReckonerContext` with effective tenant, user, permission and data scope.
4. Add a deterministic scope fingerprint to every cache key before introducing personal cards. Include all dimensions that can change the visible result.
5. Add approval cards such as my pending, my returned, awaiting my review and aging of pending approvals, plus verified register/shift cards where useful.
6. Move roles from legacy dashboards to V6 only when their required cards and access contracts are complete. Preserve a safe fallback until each role passes parity tests.
7. Replace the live exact-349 boot assertion with versioned baseline/parity validation that permits deliberate additions while detecting accidental deletion or key drift.

Never serve one employee's personal card result from another employee's cache entry.

## Stage 4 — complete 349-card access contracts

For every catalogue card, define and enforce:

- Required permission.
- Tenant and row scope.
- Sensitivity class.
- Visible fields.
- Drill-down permission and destination.
- Export permission.
- Available actions.
- Empty/unavailable behavior.
- Cache scope and invalidation inputs.

Generate a machine-readable contract and tests proving every card has a complete valid contract. Server responses must omit unauthorized fields rather than merely hiding them in React.

## Stage 5 — remaining dashboard and permission work

Implement:

- Explicit permission override mode (`inherit` or `custom`) with a safe migration.
- Shared `DashboardPolicy` or equivalent centralized access decision.
- Real receivable/payable aging using verified due dates; otherwise preserve honest unavailable states.
- Role-specific V6 layouts, downloads and actions based on the card contracts.
- Cross-tenant, multi-membership and stale-cache regression coverage.

## Stage 6 — remaining posting adapters and boundary completion

Use the verified posting matrix to adapt remaining administrative document types in risk/value order. For every path, decide and document whether it is:

- Always direct.
- Configurable.
- Always approval-controlled.
- System-generated with its own authorization rule.

Move enforcement to shared domain/posting boundaries so observers, jobs, imports, sync, recurring processes and commands cannot bypass policy. Add idempotency, tenant scope, locking and audit coverage as each path is adapted.

Do not add an outbox or cash-custody subsystem unless tests or real external side effects prove it is required. If introduced later, document the failure being solved and migration/rollback plan.

## Continuous quality requirements

- Use forward migrations; do not edit already-applied historical migrations.
- Never use `migrate:fresh`, `migrate:reset`, `db:wipe` or destructive seeders.
- Never test against `venqore_pos` or `venqore_restore_check`.
- Keep tenant predicates explicit at authorization, idempotency and posting boundaries.
- Use database constraints in addition to application checks.
- Do not trust client-supplied tenant, source, approver, status, permission or bypass values.
- Do not catch broad database errors and misclassify them as idempotent success.
- Do not silently convert accounting configuration failures into successful zero values.
- Keep pending documents out of all final financial and operational aggregates.
- Add focused tests for meaningful behavior; do not add tests that merely mirror implementation.

After each stage, run focused tests followed by the relevant dashboard, Reckoner, permission, tenant-isolation, accounting and posting suites. Report exact commands, counts, assertions, failures and skips. Do not claim tests that were not run.

## Final completion report

Continue until Stages 0–6 are implemented and verified, except for destructive database restoration and deployment. Then create:

`docs/approval-dashboard-audit-2026-09-22/08-final-implementation-report.md`

Include:

1. Final architecture and invariants.
2. Migrations and data model.
3. All routes, controllers, services, policies, adapters, observers, jobs and commands changed.
4. Store and employee approval controls.
5. Four-type workflow evidence and later adapter coverage.
6. POS trust-boundary evidence.
7. Role dashboard and 349-card contract coverage.
8. Cache-scope evidence.
9. Exact test commands and results.
10. Remaining limitations, explicitly excluding completed work.
11. Checkpoint commit identifiers.
12. Confirmation that `venqore_pos` was not restored and no deployment occurred.

Do not stop merely because one stage is demo-ready. Continue independently through the next stage. Stop only for a genuine destructive-operation authorization, unavailable external credential, or a technically irreducible product decision; complete every independent task before reporting that blocker.

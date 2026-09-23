# Post-implementation audit and next IDE instructions

Date: 22 September 2026

## Verdict

The approval workflow and role-aware V6 dashboard project is **not complete and is not ready to merge, push, or deploy**. The implementation establishes useful database models, a state machine, four adapters, some pages, POS trust checks, and several Reckoner readings. However, the active application paths are mostly not connected to that infrastructure, authorization is incomplete, correction/resubmission cannot work end to end, the staff and store controls are missing from the UI, and the claimed 349-card/full-posting-boundary work was not delivered.

The implementation report in `08-final-implementation-report.md` must not be used as evidence of completion. Replace it after the work below is complete.

## Verified blockers

### P0 — authorization and tenant-member data exposure

1. Approval routes have no approval permission middleware.
2. Any authenticated member of a store can currently query the tenant-wide approval inbox.
3. Any store member can view an approval document, including its raw payload, revisions, and transitions.
4. Reject and return actions do not verify reviewer authority.
5. Resubmit does not verify that the actor is the maker of the document.
6. Reviewer authorization is based on hard-coded role names instead of one canonical permission/policy.
7. Strict owner separation is read by the policy resolver but is ignored by approval execution.
8. The controller does not provide the UI's `canApprove` and `isMaker` values.
9. The existing permission-bypass guard test fails because the new state-changing routes are unguarded.

### P0 — the feature is not connected to the real workflows

1. The existing customer receipt, supplier payment, administrative invoice, and expense form endpoints do not use the approval policy resolver/execution engine.
2. Tests call the new engine directly and therefore do not prove that a real form submission becomes pending.
3. There is no complete HTTP submission path for the four administrative document types.
4. The new `/pos/sales` endpoint is not called by the real POS clients. `Pos.jsx`, `NewPos.jsx`, and `Domain/pos/usePayment.js` still submit through the old sale endpoint.
5. The old routes and observers can still post directly. `SaleObserver` remains a bypass surface.
6. The claimed full posting-boundary conversion was not performed; the existing `AccountingService::createEntry()` call sites remain largely unchanged.

### P0 — approved posting is not proven equivalent to direct posting

1. The customer receipt and supplier payment adapters create journal entries directly using account codes. They do not run the normal operational posting paths that create payments, allocations, receipt numbers, and other side effects.
2. The expense adapter also risks bypassing the canonical expense workflow.
3. Approved and direct transactions do not have parity tests for operational rows, journal lines, balances, numbering, inventory, allocations, register/bank effects, and audit history.
4. A pending document must continue to write nothing to financial or operational posting tables.

### P1 — workflow correctness and concurrency

1. Expected version is nullable, allowing optimistic concurrency checks to be bypassed.
2. Approve locks the row, but reject, return, and resubmit do not lock and refetch inside their transaction.
3. Unknown, inactive, or document-inapplicable return reason codes can be silently accepted.
4. Idempotency collision handling is not a complete named success/conflict path.
5. Withdrawal exists only in the state machine; it has no authorized route or UI.
6. Returned documents cannot be corrected in the original editor. The current page displays raw JSON and sends no replacement payload/amount when resubmitting.
7. Revision comparison is not usable.
8. Inbox search is presented in the UI but ignored by the controller.

### P1 — policy and settings

1. Store disablement currently bypasses amount/type escalation. Implement and document one deterministic precedence table.
2. The engine does not centrally enforce the underlying transaction permission.
3. Staff create/invite/edit UI does not expose `inherit`, `required`, and `direct` approval modes.
4. Invitation creation and acceptance do not round-trip the approval mode.
5. Store settings UI is missing for approval enablement, strict owner separation, employee default, and configured amount/document rules.
6. Employees must not change their own mode; every change must retain actor and timestamp auditing.
7. `permission_override_mode` must be non-null with a safe `inherit` default through a new forward migration.

### P1 — POS behavior

1. Move every real POS client to the trusted POS endpoint or place the trusted-shift decision at the single canonical sale boundary.
2. Treat a missing, closed, foreign, or invalid shift as a clear validation failure for a POS checkout unless the approved product decision explicitly routes it to an administrative invoice workflow.
3. Never trust client-provided `source`, `approved_by`, role, or shift ownership.
4. Keep ordinary valid-shift POS sales immediate.

### P1 — V6 dashboards and Reckoner

1. Four approval readings were added, but this does not constitute four catalogue cards or complete role dashboards.
2. No complete machine-readable access contract for all 349 cards was delivered.
3. The cache scope contains only a user id for selected prefixes. It lacks the required effective-scope fingerprint, including permissions, role/membership, approval mode, store scope, and other access-affecting inputs.
4. Approval reviewer cards must use the canonical approval-review permission.
5. Produce a versioned catalogue baseline and a controlled process for increasing the card count. Do not leave contradictory exact-349 and at-least-349 assertions.
6. Resolve the real preset pipeline against the catalogue, record every dropped/remapped key and final count by role, then rebuild broken presets.
7. Define and enforce view, scope, sensitivity, drill, export, and action contracts for every card.
8. Migrate role dashboards deliberately; legacy dashboards still remain active for several roles.

### P1 — tests and change hygiene

1. The complete test suite is not green. Record the full failing list and compare it with commit `10988c43` using an isolated test database to classify baseline failures versus regressions.
2. Fix every regression introduced by these commits. Do not weaken, delete, skip, or rewrite a test merely to make it pass.
3. Review incidental edits to reports, test bootstrap, route-sweep tests, UOM/accounting services, and other unrelated files. Retain only changes backed by a reproduced defect and focused regression test.
4. Never run `migrate:fresh`, destructive seeds, or destructive tests against a non-test database. Continue using `amd_pos_test`. Do not attempt to restore the quarantined production-like database without separate authorization.
5. Do not touch the pre-existing dirty `production-clean-repo` submodule.

## Instructions to give the IDE

Continue on the current local commits. Do not push, deploy, rewrite history, or touch the quarantined database. Treat this file and documents 01–07 as the governing specification; where document 08 conflicts, document 08 is wrong.

Work until every acceptance gate below is satisfied. Do not stop after writing another plan. Implement, test, audit, and report the completed behavior.

### 1. Secure the approval surface first

- Add canonical approval permissions and policies for submit, view-own, view-queue, review, return, reject, approve, withdraw, and resubmit.
- Guard routes and controller methods server-side. Tenant membership alone is insufficient.
- Limit maker views to their own submissions. Limit queue views and full payload access to authorized reviewers. Apply field-level redaction where appropriate.
- Require maker ownership for correction, withdrawal, and resubmission.
- Honor strict owner separation and use the canonical review permission rather than role-name checks.
- Make expected version mandatory for every state-changing action.
- Lock and refetch the document within the transaction for approve, reject, return, withdraw, and resubmit.
- Validate return reasons as active, applicable to the document type, and compatible with note requirements.
- Add denial, cross-tenant, cross-maker, stale-version, and concurrent-action tests for every route.

### 2. Connect the four real administrative workflows

- Integrate customer receipt, supplier payment, administrative invoice, and operating expense at their actual form/controller/service entry points.
- Resolve direct versus pending exactly once at a shared server-side boundary.
- Check the ordinary transaction permission before either path.
- A pending submission must write only approval tables and audit records. It must create no payment, sale, expense, allocation, journal, stock, numbering, bank, register, or reporting rows.
- Keep pending references separate from final accounting/document numbers.
- Add route-level tests that submit the real browser payload for all four document types in direct, required, threshold-forced, disabled, unauthorized, and duplicate-request cases.

### 3. Make approved posting call canonical posting services

- Refactor each adapter to invoke the same domain service used by direct posting; extract reusable canonical services where controllers currently contain the posting logic.
- Revalidate permissions, tenant ownership, referenced records, open periods, balances, stock, and policy at approval time.
- Keep approve plus post plus transition atomic and idempotent.
- Add direct-versus-approved parity tests that compare all material operational and financial effects.

### 4. Complete correction and resubmission

- Return the maker to the original editor populated from the immutable latest revision.
- Show structured reviewer reasons and notes.
- Save correction as a new immutable revision; never overwrite or delete an earlier revision.
- Provide a useful revision comparison and transition timeline.
- Add authorized withdrawal.
- Preserve returned/pending documents when settings change.

### 5. Complete store and employee controls

- Add store settings UI and persistence for enable/disable, strict owner separation, employee default, document policies, and thresholds.
- Add approval mode to staff invitation, acceptance, creation, and edit flows with `inherit`, `required`, and `direct` values.
- Present the owner-friendly control “Require approval for this employee” while preserving the three-state model.
- Owners direct-post by default unless strict separation or a stronger policy applies.
- Employees cannot change their own mode. Audit actor and timestamp for changes.
- Add a forward migration making `permission_override_mode` non-null with default `inherit` and safely backfill existing nulls.

### 6. Wire POS safely

- Move `Pos.jsx`, `NewPos.jsx`, `Domain/pos/usePayment.js`, offline/sync paths, and any other checkout caller through the trusted server-side POS decision.
- Derive POS trust from the authenticated user and an open, tenant-owned, user-owned register shift.
- Keep a valid POS checkout immediate. Return a clear validation response for an invalid shift unless the product explicitly uses the administrative invoice path.
- Add end-to-end tests from each active POS client contract and test forged source/approver/shift values.

### 7. Finish dashboards using measured contracts

- Generate a machine-readable audit of every catalogue card and every role preset after sanitizer/remapping/fallback, including dropped keys and final counts.
- Implement access contracts for all 349 existing cards with view, scope, sensitivity, drill, export, and action rules.
- Add actual approval/work cards and layouts where required, using a versioned catalogue-count change rather than weakening the assertion.
- Build the effective-scope fingerprint into `ReckonerContext` and every relevant cache key. Include all inputs that can change visible data.
- Test two users in one tenant with different role, permissions, approval mode, and assignment scopes to prove there is no cached-data bleed.
- Route each supported role to its intended V6 dashboard and verify legacy fallbacks intentionally.

### 8. Close the posting-boundary inventory

- Re-run the full inventory of controllers, services, observers, jobs, commands, imports, webhooks, and model events that can create accounting or operational postings.
- Give every call site an explicit classification: immediate trusted path, approval-aware administrative path, system-only path, or prohibited bypass.
- Resolve `SaleObserver` and other implicit posting paths so they cannot bypass the chosen boundary.
- Add enforceable architecture tests for prohibited paths. A report alone is insufficient.

### 9. Verify without damaging data

- Run migrations and tests only on the dedicated test database.
- Run focused approval, POS, permission, dashboard, cache, accounting parity, and migration tests.
- Run the entire backend suite and frontend lint/tests/build.
- Compare full-suite failures against `10988c43` in an isolated worktree/database and fix all new regressions.
- Do not change assertions to bless broken behavior.

### 10. Replace the completion report

Replace `08-final-implementation-report.md` with evidence-based results containing:

- exact files and migrations changed;
- actual routes/forms now connected;
- the posting-path disposition table;
- the 349-card access-contract/preset-resolution artifacts;
- exact commands, totals, and pass/fail results;
- any baseline failures clearly separated from new regressions;
- migration and rollback evidence on the test database;
- manual role matrix results for owner, manager/reviewer, direct employee, approval-required employee, cashier, accountant, purchasing officer, and viewer;
- confirmation that pending documents write no financial/operational rows;
- confirmation that the working tree contains only the pre-existing submodule change.

## Completion gates

Do not declare completion until all of these are true:

1. Unauthorized tenant members cannot list, view, or act on approval documents.
2. All four real administrative forms follow the configured direct/pending policy.
3. Pending documents never touch posted operational or financial tables.
4. Approved posting is atomic, idempotent, revalidated, and behaviorally equivalent to direct posting.
5. Return, correction in the original editor, immutable resubmission, rejection, approval, and withdrawal work end to end.
6. Store and employee approval controls work through UI, invitation, persistence, and audit history.
7. Every live POS client uses the trusted server-side path and normal valid-shift sales remain immediate.
8. All 349 cards have enforceable access contracts; presets resolve correctly; scoped caches cannot bleed between users.
9. Every posting call site has an enforced disposition and implicit observers cannot bypass it.
10. Focused tests pass, frontend checks pass, and the full suite has no regressions relative to the recorded baseline.
11. No production-like database, remote branch, or pre-existing submodule state was modified.


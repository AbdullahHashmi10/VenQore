# Claude master instruction: complete approval coverage, build first

Latest permission clarification: read document 30 together with document 29; both override this broad backlog brief. Do not build all backlog operations for the first release.

> SUPERSEDED FOR RELEASE SCOPE: The owner has narrowed the first customer release. Read `29-customer-first-release-scope.md` before using this document. Implement only its Phase 1 scope; treat the broad catalogue below as the later backlog. Audit all 23 money movement kinds, but do not implement all deferred kinds before shipping. Document 29 also supersedes the policy precedence and numerical test targets below. Do not start implementation merely from this archived broad brief.

**Date:** 23 September 2026  
**Purpose:** Extend the existing four-document approval foundation to every user-initiated financial and stock-changing action before running the expensive full verification cycle.

## Read this first

Continue from branch `codex/approval-dashboard-final-repairs`. Preserve the existing approval engine, immutable revisions, posting idempotency, V6 role dashboards, and current repair work.

Do not repeat the previous phase-by-phase full-suite process. Build the complete system, write tests alongside the implementation, finish the UI and all adapters, then run the comprehensive verification once. Small syntax, migration, route, and compile checks are allowed while building. Do not run the complete backend suite after each adapter.

Do not commit, push, merge, deploy, reset, rebase, amend, force-push, or modify remote history. Do not use production or recovery databases.

## Product behavior required

Approval is optional and defaults to open/direct posting.

The owner must be able to control approval at three levels:

1. **Global master switch** — turn the approval system on or off for the store.
2. **Action switch** — choose approval behavior separately for every user-facing financial or stock-changing action/page.
3. **Employee-action override** — choose whether a particular employee follows the action setting, always requires approval, or posts directly for that particular action.

The default for a new store and a new action is direct posting. Nothing should unexpectedly become pending merely because this feature is installed.

An employee in `direct` mode must still possess the normal business permission for the action. Approval configuration never grants transaction permission.

### Effective decision order

Use one documented resolver everywhere:

1. Reject when the actor lacks the normal action permission.
2. Apply non-bypassable system safety rules explicitly marked `always_required`.
3. If the store master switch is off, post directly.
4. Apply an employee-action override: `required`, `direct`, or `inherit`.
5. Apply the store action policy: `required`, `threshold`, or `direct`.
6. Apply an employee global fallback only when no action override exists: `required`, `direct`, or `inherit`.
7. Apply the store default, which is `direct`.
8. Apply trusted channel rules such as verified POS only where the action registry explicitly permits them.

An amount threshold may force approval even when the user/action mode is direct only when the owner explicitly enabled that threshold for the action. The UI must explain this precedence.

Changing any setting affects future submissions only. Existing pending documents remain pending and never auto-post.

## Replace hardcoded four-type support with an action registry

Create a typed approval action registry. Do not scatter action names or policy precedence through controllers.

Each action definition must include:

- stable action key;
- user-facing name and module;
- create/amend/void/reverse/refund/return operation;
- normal required permission;
- allowed source channels;
- whether verified POS or integration execution may post directly;
- amount field/currency behavior;
- adapter class;
- payload validator/schema version;
- posting service;
- correction editor route;
- display/detail transformer;
- financial, stock, cash, loyalty, and external-side-effect footprints;
- default policy (`direct` unless explicitly justified otherwise);
- whether the action is user configurable or genuinely system-only.

Unknown user-initiated financial actions must fail closed at the approval-policy boundary. System-only actions must be explicitly registered and unavailable in the employee policy UI.

## Cover the complete action catalogue

Audit every state-changing route, controller, service, observer, job, import, integration, and all accounting-entry callsites. Reconcile the action registry against the existing posting inventory. No user-facing posting path may remain merely labelled `immediate_trusted` without an explicit registry decision.

### Mandatory 23-type money-in/money-out reconciliation

The product has **23 business kinds of money in and money out**. Do not model these as only two generic actions and do not assume the four first-release document types cover them. Before changing adapters, locate the authoritative source for all 23 kinds in the current UI, routes, controllers, services, reference types, and posting inventory. Produce `docs/approval-dashboard-audit-2026-09-22/26-money-movement-catalogue.md` and a machine-readable catalogue used by tests.

The catalogue must contain exactly one row for every one of the 23 product kinds and, for each row, record:

- stable approval action key and the exact user-facing name;
- direction: money in, money out, or internal transfer;
- page/modal/API/import/integration entry points;
- route, controller/job/observer, canonical posting service, and ledger reference type;
- source and destination account semantics;
- whether a customer, supplier, employee, owner, lender, bank, register, or marketplace is involved;
- normal business permission and eligible actor roles;
- current behavior: direct, already approval-aware, system-only, or broken/ambiguous;
- store action policy and employee-action override behavior;
- amount used for threshold decisions, calculated again on the server;
- correction editor and approval-detail presentation;
- resulting payment, allocation, party-balance, bank, cash, register, and journal effects;
- reversal, bounce, refund, void, or cancellation behavior;
- tenant, idempotency, locking, and duplicate-submission protection;
- required automated test IDs.

At minimum, the reconciliation must explicitly investigate and classify every distinct flow represented by: customer receipts, customer refunds, supplier payments, supplier refunds, generic receipts, generic disbursements, owner capital injections, owner drawings, legacy fund add/remove, internal fund transfers, fund adjustments, bank transfers, cash-to-bank deposits, bank-to-cash withdrawals, customer advances, supplier advances, sales-order advances, purchase-order advances, loan drawdowns, loan repayments, payroll payments, register cash-in/cash-out movements, donations/charity payments, expenses, cash shortages/overages, debit-note refunds, bounced payments, marketplace payouts, and settlement receipts. This investigation list is deliberately longer than 23 because some entries may be aliases of one product kind while others may be separate. Prove every merge or split from actual posting semantics, then reconcile the final product catalogue to the authoritative 23 kinds.

Do not delete, hide, or silently merge an existing money movement merely to force the count to 23. If the current application exposes more or fewer than 23 real kinds, document the discrepancy with evidence and keep every real posting path covered. The acceptance gate is **all actual kinds covered**, with the expected 23 reconciled explicitly.

Each configurable kind must have its own row in the owner's approval matrix and its own per-employee override. The store master switch still defaults the entire feature to Direct/off. Turning approval on for one kind must not change another kind. Internal transfers must be treated as one atomic action, never as two separately approvable cash movements.

Tests for this catalogue must be data-driven and must prove, for every kind: master-off direct posting, store-action required approval, employee inherit/required/direct resolution, missing-permission rejection, pending isolation, approval-time revalidation, atomic exactly-once posting, correction/resubmission, tenant isolation, and correct accounting or custody footprints. Add special assertions for party allocations, advances, transfers, bounces, refunds, register custody, and integration settlements where applicable.

At minimum implement separate actions and adapters for all applicable operations below. Merge two entries only when they truly share payload, posting semantics, correction UI, permission, and reversal behavior.

### Sales and customer money

- POS sale/checkout, preserving verified immediate POS behavior by default;
- administrative sales invoice creation;
- sales invoice amendment before and after posting, using reversal/amendment rules;
- sales return;
- POS return/refund;
- customer refund/money out;
- customer receipt/money in;
- generic money in without a customer invoice;
- customer advance/deposit;
- customer advance application or refund;
- customer credit note;
- quotation conversion when it creates a financial transaction;
- sales-order conversion when it creates a posted sale;
- bad-debt write-off;
- bounced/reversed customer payment.

### Purchases and supplier money

- purchase/bill creation when it posts stock or ledger entries;
- purchase amendment;
- purchase return;
- supplier refund/money in;
- supplier payment/money out;
- generic money out without a supplier bill;
- supplier advance;
- supplier advance application or refund;
- supplier debit note;
- purchase-order conversion/receipt when it posts stock or accounting;
- purchase void/cancellation when it reverses posted effects.

### Expenses, cash, banking, and funds

- operating expense creation;
- expense amendment;
- expense void/reversal/deletion;
- bank-to-bank transfer;
- cash-to-bank deposit;
- bank-to-cash withdrawal;
- fund add, remove, transfer, and adjustment;
- cash shortage/overage;
- register close variance posting;
- rider cash-up/hand-in where it changes custody or accounting;
- general journal entry;
- journal reversal;
- party opening balance;
- account opening balance;
- bank account opening balance or financial adjustment.

### Inventory and operations

- stock adjustment increase/decrease;
- stock transfer when it creates accounting or ownership effects;
- stocktake variance posting;
- inventory write-off/damage/expiry;
- production completion/consumption posting;
- production reversal;
- disassembly posting;
- landed-cost or inventory-cost adjustment;
- fixed-asset acquisition;
- fixed-asset disposal;
- depreciation posting or batch;
- disaster loss claim and recovery.

### Payroll, loans, charity, and period controls

- payroll accrual;
- payroll payment;
- employee settlement;
- loan drawdown;
- loan repayment;
- donation/charity payment;
- tax adjustment/payment where supported;
- fiscal-year close;
- fiscal-year reopen/reversal if supported.

### Imports, smart capture, marketplaces, and integrations

- Smart Capture sale, purchase, expense, return, invoice, and payment confirmation;
- e-commerce order posting;
- marketplace sale, refund, settlement, and payout confirmation;
- offline sync financial posting;
- bulk import that creates posted financial or stock records.

For automated/system channels, give the owner an understandable integration policy where manual approval is meaningful: direct, create pending review, or disabled. Do not route low-level migrations, repair commands, seeds, or internal accounting maintenance into human approval.

## Data model

Keep pending documents outside all financial, sales, purchase, payment, expense, stock, loyalty, register, and externally delivered transaction tables.

Extend the existing approval schema with normalized policy tables rather than one database column per action:

### Store action policies

Create or adapt a table with:

- tenant_id;
- action_key;
- mode: `direct`, `required`, or `threshold`;
- threshold amount and currency where applicable;
- enabled/source-channel rules;
- eligible reviewer roles/users or reviewer policy reference;
- policy version;
- changed_by and changed_at;
- timestamps;
- unique `(tenant_id, action_key)`.

### Employee action overrides

Create a table with:

- tenant_id;
- tenant_user_id or user_id tied to the membership;
- action_key;
- mode: `inherit`, `required`, or `direct`;
- changed_by and changed_at;
- timestamps;
- unique membership/action constraint.

Preserve `tenant_users.transaction_approval_mode` as the employee-wide fallback and migration compatibility layer. Do not duplicate action overrides in JSON.

Every policy decision stored on a submission must include the action key, policy version, effective mode, reason, threshold result, actor membership, and trusted channel decision.

## One generic workflow, many adapters

All actions must use the same state machine and execution engine:

- draft where needed;
- pending;
- returned;
- resubmitted;
- rejected;
- withdrawn;
- posted.

Every adapter must provide:

- tenant-scoped validation;
- normalized immutable revision payload;
- server-calculated amount and display summary;
- revalidation against current permissions, referenced records, balances, stock, shifts, periods, and policy at approval time;
- atomic posting through the existing canonical domain service;
- idempotency key and payload hash;
- `lockForUpdate()` protection;
- exactly-once result linkage;
- correction-editor prefill;
- safe rejection/withdrawal behavior;
- audit transitions.

Approval must not reimplement FIFO, accounting, stock, tax, allocation, rounding, or reversal arithmetic. The adapter calls the same canonical service used by direct posting.

For amendments, returns, voids, and reversals, never mutate posted financial history in place. Submit an approval command that invokes the canonical reversal/amendment service after approval.

## User interface

### Store approval matrix

Build one owner/admin settings screen listing every configurable action, grouped by module. Provide:

- search and module filters;
- global approval master switch;
- one clear switch/control for each action;
- modes: Direct, Approval required, Approval above amount;
- threshold input when selected;
- reviewer configuration where supported;
- current effective behavior summary;
- unsaved-change warning;
- audit history showing who changed what and when;
- safe bulk actions such as set all to Direct, Require for selected module, or reset to defaults.

Direct must be the visible default.

### Per-employee approval matrix

On invitation, employee creation, and employee editing provide:

- global fallback: Inherit, Require approval, or Direct;
- an advanced per-action override matrix;
- per-action values: Inherit, Require approval, or Direct;
- bulk operations by module;
- a clear effective-result preview combining store and employee settings;
- protection preventing employees from editing their own approval rules;
- actor/time audit history.

### Controls on transaction pages

Every applicable transaction page must show a small read-only status explaining whether the current action will post directly or require approval and why.

For an owner/admin with settings permission, provide a link or compact action-specific settings control. Do not let ordinary employees change approval behavior from a transaction form. Do not accept approval mode, approver, source, bypass, or trusted status from the client as authority.

### Inbox and correction experience

The existing approval inbox and original-editor correction flow must support every new action:

- meaningful summary and line details;
- preset reason codes plus reviewer note;
- link to the real original editor;
- complete prefill of items, allocations, accounts, taxes, attachments, and references;
- stale-version handling;
- history and immutable revisions;
- mobile-friendly owner review.

## Dashboard updates

Use existing V6 cards where possible. Add new cards only where the 349-card catalogue lacks the required approval information:

- my pending submissions;
- my returned submissions;
- awaiting my approval;
- overdue approvals;
- approval volume and turnaround where the role may see it.

Register any genuinely new card without a hardcoded exact-count boot failure. Define permissions, sensitivity, tenant/user scope, cache fingerprint, supported roles, empty state, and drill-down route. Update role presets and the role-card contract artifact.

## Security and invariants

- Pending work has zero financial, stock, cash, loyalty, invoice-number, or external-delivery footprint.
- Tenant scope applies to the document, revision, actor, reviewer, referenced records, and posting result.
- Only the original maker can correct and resubmit returned work.
- Reviewer cannot approve their own submission when separation applies.
- Never trust client-supplied approval state, approver, channel, POS source, register, shift, policy, bypass, or posted result.
- Approval is atomic with posting.
- Retry/concurrency creates exactly one result.
- Direct posting and approved posting have identical domain effects.
- Existing pending documents do not change when policies change.
- Attachments remain private and authorized.
- Every configuration and state transition is audited.

## Build-first working method

Follow this order without running the complete suite between sections:

1. Audit and finalize the complete action catalogue and route/callsite mapping.
2. Implement registry and normalized policy tables.
3. Implement the central resolver and policy-management services.
4. Implement all domain adapters and refactor direct paths through canonical services where necessary.
5. Implement store and employee policy matrices.
6. Implement page status indicators and owner settings links.
7. Extend inbox, details, correction editors, and audit history for every action.
8. Update dashboard cards and role presets only where necessary.
9. Write all automated tests while implementing, but do not run the entire suite yet.
10. Complete a code-level coverage audit proving every user-initiated posting route maps to a registered action.
11. Freeze the source tree.
12. Run targeted suites once, repair failures as one batch.
13. Run frontend tests, lint delta, and production build once, repair as one batch.
14. Run the complete backend verification once using valid sharded JUnit evidence, repair all failures as one batch.
15. Freeze again and run one final authoritative full verification only after repairs.

During implementation, allow only fast checks needed to continue safely: PHP syntax on changed files, migration status on a disposable database, route listing for newly added routes, and frontend compilation/type syntax for changed components. Do not repeatedly run the full suite.

## Required tests to write before the final run

Create a data-driven contract suite rather than copying the same test class for every action. Target approximately **180–260 new test cases**, with most generated from the action registry.

Cover at least:

- registry completeness for every user-facing financial/stock route;
- normal permission required before approval policy;
- global switch off/direct default;
- store action direct/required/threshold modes;
- employee global fallback;
- employee-action inherit/required/direct overrides;
- action threshold precedence;
- owner direct default and optional strict separation;
- employee cannot change own policy;
- policy audit actor/time/version;
- pending zero-footprint invariant per adapter;
- direct versus approved posting parity per adapter;
- approval-time revalidation per adapter;
- tenant/reference ID isolation;
- return/correction/resubmission per editor family;
- immutable revisions and stale versions;
- approve/reject/withdraw transitions;
- concurrency/idempotency/exactly-once result;
- amendment/return/void/reversal semantics;
- POS and integration trusted-channel verification;
- cache/user/tenant isolation for approval dashboard cards;
- UI route and payload contracts;
- migration forward/rollback compatibility;
- fail-closed detector for an unregistered posting path.

Write browser/component tests for the two policy matrices, bulk actions, page status indicator, inbox filtering, reviewer notes, correction banners, and permission-restricted controls.

## Final deliverables

Create:

1. `26-complete-approval-action-catalogue.md` — every action, route, permission, adapter, default, UI page, and posting service.
2. `27-complete-approval-implementation-report.md` — schema, services, adapters, UI, cards, migrations, and changed files.
3. `28-complete-approval-test-report.md` — targeted, frontend, build, lint-delta, full baseline/current comparison, and unresolved failures.
4. Machine-readable action-registry coverage and policy-matrix artifacts.
5. A concise manual demo script covering representative actions from every module.

Do not claim completion while any user-facing financial or stock-changing route is absent from the action registry, any new test fails, the build fails, or a pending action touches operational tables.

Stop with a reviewable local diff and reports. Do not commit or push. Return the report paths, final Git status, changed-file count, action count, new test count, and remaining issues.

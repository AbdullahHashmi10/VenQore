# Approval workflow and permission-aware V6 dashboards

Date: 22 September 2026. Status: audit and proposed implementation, not implemented.

## Decision to make

Build a maker–checker workflow for administrative transactions and use the V6 dashboard for every store role. Keep ordinary POS checkout immediate. Make access depend on effective permissions and data scope, not merely on the dashboard a role happens to receive.

This document explains the current position, product behavior, delivery phases and acceptance criteria. [02-technical-change-specification.md](02-technical-change-specification.md) is the engineering handoff, including a complete inventory of the 349 existing cards. [03-existing-bugs-and-repair-plan.md](03-existing-bugs-and-repair-plan.md) covers existing defects separately.

## Audit boundary and evidence

The implementation target inspected is `app-code/main-app`, a Laravel 12 / React / Inertia application according to its dependency files. The workspace also contains production copies, a separate production-clean repository and legacy snapshots. Those are not interchangeable implementation targets. Work against main-app first; determine the release source of truth before deployment.

This was a targeted source-code audit of transaction entry points, accounting engines, permissions, dashboard routing, card definitions and test infrastructure. No application files were changed, migrations applied, transactions submitted, or database tests executed. Existing unrelated working-tree changes were present, including sales, restaurant, register-shift and dashboard work. Findings describe the inspected working tree, not proof of what is currently deployed. Catalogue status counts are metadata, not test results from this audit.

### What already exists

| Area | Current implementation | Consequence |
|---|---|---|
| Posting | `app/Engines/AccountingService.php::createEntry()` creates journals and journal items, refreshes party snapshots and records an audit event | Approval must happen before calling posting code, not by hiding posted journals afterward |
| Standalone money | `PaymentController::store()`, `V3/CustomerPaymentController::store()` and `V3/SupplierPaymentController::store()` post directly | No common pending/revision/review lifecycle on the inspected paths |
| Sales | Both `SaleController::store()` and `V3/SaleController::store()` are live; V3 calls `Engines/SaleService::post()` | A fix in one controller would leave another path open |
| Existing approvals | Manager PIN checks, `approved_by`, JIT purchase `approval_status`, staff invitation approvals | These are specialized controls, not a complete document approval inbox or correction cycle |
| Drafts and purchasing | Sales distinguish draft/posted; purchases distinguish pending goods receipt from received goods | Approval status must remain separate from accounting, fulfillment and payment status |
| V6 routing | `DashboardController::index()` routes cashier, accountant, purchasing_officer and viewer to old pages | These users do not get the same V6 experience as other roles |
| V6 engine | `CardRegistry`, `ReckonerRegistry`, `Reckoner`, frame fillers and dashboard APIs exist | Reuse these; no replacement dashboard engine is needed |
| Catalogue | `resources/data/reckoner/cards.json` has 349 entries: 63 verified, 229 implemented_unverified, 57 unimplemented | “349 cards” is catalogue size, not 349 production-verified computations |
| Permissions | `config/permissions.php` has 18 role entries including custom; membership permission overrides exist | Fix interpretation inconsistencies before building more policy on top |
| Card gates | Reckoner checks permissions before resolving data; dashboard APIs filter card keys | Useful enforcement exists, but current permission lists use ANY-of and lack explicit row scope and action contracts |
| Dashboard presets | `config/dashboard_pool.php` already includes role pools; `FrameFiller` filters candidate availability | Audit and extend presets rather than starting again |
| Downloads | `data.export` and some protected export routes exist | View, drill-down, export, print and mutation still need a consistent per-resource contract |
| Tests | Financial, permission, tenant isolation, POS approval and Reckoner suites exist under `tests/tests` | Extend canonical tests; do not duplicate legacy suites |

The registry includes examples of overly broad intended visibility: stock valuation requires `inventory.view`; location profit also requires `inventory.view`; several profit cards accept `reports.summary`; khata cards accept `sales.view` as an alternative to finance permission. Treat this as a policy redesign requirement, not proof that every such card returns a working value today.

## Proposed user workflow

1. An employee prepares a document using the existing editor and saves a draft or submits it.
2. The server decides whether this document requires review using store policy, document type, amount, operation and the employee's effective permissions.
3. A submission receives a pending reference and an immutable revision. It does not create a posted journal, allocate a payment, change stock, accrue loyalty, submit a tax invoice, or send a final receipt.
4. An eligible reviewer opens a read-only financial preview, supporting attachments and the change history.
5. The reviewer either approves, returns for correction, or rejects. They do not silently edit the employee's submission.
6. Return requires at least one preset reason and a note. Presets: incorrect party, incorrect amount, incorrect date, wrong payment account/method, incorrect items/quantity/tax/discount, missing attachment, duplicate, allocation mismatch, other. “Other” requires an explanatory note just as the other returns do.
7. The submitting employee sees the return on their dashboard and in My Submissions, edits in the original editor, sees the prior version, and resubmits a new revision.
8. Approval revalidates current data, permission and policy, then atomically posts the exact approved revision through the existing engines. Repeated clicks cannot post twice.
9. A rejected submission remains in history. A new attempt is a linked new submission; rejection is not a silent delete. An author can withdraw a pending submission before approval.

For already posted records, use an approved amendment, reversal or refund request. Never return a posted journal to a draft or edit its ledger lines in place.

### Which operations need approval?

The following is the recommended policy when a store enables administrative approvals. Activation is explicit and audited, so existing stores do not abruptly lose their present workflows. Owner/administrator roles are not an automatic exception to separation of duties for transactions explicitly requiring review. A separately granted direct-post permission may exempt eligible operations under policy; that decision is recorded as an exemption, not a self-approval.

| Operation | Recommended behavior | Financial/operational effect before approval |
|---|---|---|
| Ordinary cashier checkout, including its normal payment | Immediate, retaining current discount/below-cost PIN controls | Normal checkout posts as one transaction |
| Administrative sales invoice / credit sale | Review when enabled for that type | No recognition, allocation or stock issue |
| Standalone receipt/customer payment | Review | No ledger credit or invoice settlement; pending receipt visibly marked |
| Supplier payment / outgoing voucher / standalone advance | Review | No ledger debit/credit or settlement |
| Expenses / manual journal / opening balance / fund adjustment / bank transfer | Review | No ledger or cash balance change |
| Purchase bill entered as received | Review before receipt/posting effects | No ledger or stock receipt until approved |
| Purchase order, quotation, reservation, token, kitchen ticket | Usually operational, no financial review just to save | Their own reservation/fulfillment rules remain; review separately configurable for commitments |
| Order/deposit conversion into invoice | Evaluate at conversion using the correct transaction type | Operational approval cannot authorize a financial posting |
| Refund, void, write-off, correction to a posted record | Separate permission and approval policy; higher-risk defaults reviewed | Original posted record remains intact until approved reversal/amendment |
| Payroll, loan, asset, depreciation, fiscal close | Include in financial-operation policy coverage before enabling store-wide mode | No broad implicit bypass from being a “special” controller |
| Recurring invoices, marketplace ingestion, imports | Explicit trusted-system policy or review, never infer owner authority | Log source and system identity; imports distinguish historical migration from live transactions |
| Offline POS | Normal permitted POS may queue for sync; administrative approvals cannot be approved offline | Server confirms final posting/review status; local receipt distinguishes unsynced/pending from posted |

Do not exempt a submission because a browser sends `source=pos`. A dedicated POS command with server-verified cashier/register context must enforce the POS payload and limits. Cashier exemption applies only to eligible sale checkout, not to arbitrary vouchers sent through the sales URL.

If cash is physically received before review, the UI must say “received, awaiting verification” and identify the custody holder. Track it in a separate pending-custody record/reconciliation, not in posted cash/AR totals. Pending disbursement requests should not instruct staff to pay until approval. Review does not retroactively undo physical cash movement.

## Permission and dashboard model

Use one V6 shell for all active store members. Role selects a useful starting layout; effective grants and server-derived scope determine actual access. Changing someone's permissions must change their catalogue, data, actions and exports even if their saved layout has not changed.

Separate these abilities:

- View a metric, within own/assigned/register/store scope.
- View sensitive amounts, cost, profit, payroll or party contact information.
- Open the underlying detail, with a separately checked resource permission.
- Export/download permitted data, requiring `data.export` AND the resource/sensitivity scope. Ordinary receipt printing is separate from bulk export.
- Create/edit/post/approve transactions, each enforced by the backend.
- Customize a personal layout or publish/lock a role template, separately from access to data.

Do not try to prevent screenshots or copying values already authorized for display. The enforceable boundary is what the server sends and which download endpoints it permits.

### Role starting points

| Role | Useful starting content | Default scope / restrictions |
|---|---|---|
| owner | Business summary, authorized financials, review workload | Current store; other stores require separate membership/context |
| admin | Authorized administration and review workload | Explicit grants; do not silently bypass custom restrictions |
| manager | Operations, team exceptions, assigned approvals | Store or assigned locations under grant |
| cashier | My shift sales/count, drawer, returned submissions, checkout shortcut | Own shift/register; no company profit, payroll or all-store cash by default |
| accountant | Permitted balances/aging, reconciliation, pending financial reviews | Review rights are separate from journal-entry rights |
| purchasing_officer | Orders, deliveries, supplier documents, my returned requests | Cost visibility only with explicit cost grant |
| viewer | Specifically granted read-only cards | No mutations, approvals or exports by default |
| franchise_admin | Authorized location summaries | Explicit location access; do not union every tenant automatically |
| shift_supervisor | Shift operations, assigned exceptions and reviews | Assigned shift/register/location |
| inventory_controller | Quantities, low stock, transfers, counts | Valuation/cost separate from inventory viewing |
| hr_officer | Attendance and assigned staff work | Payroll amounts and private staff data require separate grants |
| production_supervisor | Runs, material quantities, output | Production cost/margin separately granted |
| kitchen_manager | Queue, ticket age, station work | Assigned kitchen/station; no financial totals by default |
| dispenser | Assigned prescriptions/orders and fulfillment | Only operational information needed for work |
| sales_executive | Assigned sales/orders/customers and own submissions | Own/assigned book; profit and full debt book separate |
| fulfillment_lead | Assigned dispatch queue and exceptions | Assigned location/team |
| delivery_driver | My deliveries and unsettled collection custody | Own assignments; no whole customer ledger |
| custom | Granted cards only, plus own work status | No role-based fallback that grants more access |

New cards should fill real gaps: my pending/returned submissions; assigned reviews and oldest pending age; my shift sales/count/drawer variance; my assigned deliveries/collections; kitchen queue; purchasing requests needing correction. Reuse existing cards where they can safely support server-controlled scope. Do not invent data when a source or assignment relationship is absent.

## Delivery sequence

| Phase | Deliverable | Exit condition |
|---|---|---|
| 0. Baseline | Record working tree, route-to-engine map, permission contract, policy defaults, all-card inventory | Every in-scope write path has a named integration owner; no code from other work overwritten |
| 1. Existing defects | Repairs in document 03, shared permission resolver, empty-override migration strategy | Negative permission/tenant tests and corrected totals/aging pass |
| 2. Workflow foundation | Pending documents, immutable revisions, audit events, policies, typed adapters, command/posting boundary | Pending state has zero financial footprint; transitions, duplicate/retry and concurrency tests pass |
| 3. Financial integrations | Receipts/payments, expenses/journals/funds, admin invoices/purchases and corrections; specialized financial paths | No covered HTTP, sync, job or import can bypass approval policy; POS remains immediate |
| 4. Review experience | Inbox, detail preview, return reasons/notes, original-editor correction, notifications and custody status | Employee → reviewer → employee → reviewer end-to-end path passes |
| 5. Card access | Explicit per-card contract, scoped queries/cache, unified catalogue, field filtering, export/action enforcement | Full catalogue policy tests and scope-crossing tests pass |
| 6. V6 adoption | All role presets and missing operational cards, template/lock migration, legacy URL handling | All 18 roles and custom overrides use V6; no sensitive legacy props are sent |
| 7. Pilot and rollout | Opt-in pilot, reconciliation report, performance checks, release/rollback runbook | Pending/posting counts reconcile and duplicate effects remain zero under fault tests |

Phases 2–4 and 5–6 are independent feature streams after phase 1 but must meet at review dashboard cards. This is a multi-milestone financial workflow change, not a dashboard-only patch. Estimate delivery after the route inventory and adapter count are finalized; this audit does not invent a calendar promise.

## Acceptance scenarios

1. Employee submits a receipt: pending reference exists; no journal, allocation, party balance or posted-cash change.
2. Reviewer returns it with two presets and a note: employee can read the feedback; other employees cannot read the document.
3. Employee corrects the amount: a new immutable revision is submitted; old revision remains visible in history.
4. Two reviewers approve concurrently: precisely one posting occurs; both responses identify the same final document or a clear version conflict.
5. Permission is revoked after submission: approval/posting rechecks policy; no stale session or queue job grants access.
6. Supplier/customer invoice is paid elsewhere while pending: approval revalidates allocations and fails without partial effects.
7. Ordinary cashier sale posts immediately with its payment, stock, tax and loyalty behavior unchanged.
8. Forged `source=pos`, approver ID, tenant ID or revision cannot bypass the workflow.
9. Each role sees only its permitted V6 cards. A cashier's data contains only their allowed scope, including comparisons and export attempts.
10. Cost/profit/payroll denied means those values are absent from responses, nested series, tooltips, previews, downloads and drill routes.
11. A reviewer can act on a submission without being granted a general editable ledger. An approver-only grant does not permit arbitrary posting.
12. Every one of the 349 existing cards has an explicit tested access contract. Unimplemented cards are not presented as working or as zero.

## Rollout and unresolved product choices

Recommended initial release uses one required reviewer per rule, no self-approval, configurable amount thresholds, and audited direct-post exemptions. Multi-stage approval can be a later extension; do not advertise it as implemented in the first release. Role hierarchy alone is not an approval policy.

Before activation, a store chooses which document types require review, eligible reviewers and amount limits, backup reviewer handling, physical-cash custody process and acceptable pending age. If no independent eligible reviewer exists, show the configuration error and retain submissions pending; do not auto-post. Owner-only stores can keep approval mode disabled or use explicitly permitted direct posting.

Feature rollback stops new approval intake or pauses processing; it never posts pending documents automatically. Preserve pending records and history. Existing posted records remain posted, and any repair to prior financial data requires a separate reviewed reconciliation.

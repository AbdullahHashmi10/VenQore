# Technical change specification

Date: 22 September 2026. All new paths, schemas, permission names and interfaces below are proposed. No implementation has been made. Paths are relative to `app-code/main-app` unless otherwise stated.

This is the change-only engineering handoff. Use [01-current-state-and-implementation-plan.md](01-current-state-and-implementation-plan.md) for rationale and delivery gates and [03-existing-bugs-and-repair-plan.md](03-existing-bugs-and-repair-plan.md) for existing-defect repairs.

## 1. Required invariants

- Unapproved administrative work lives outside the financial and stock tables. Never insert a “pending” journal and expect every report to filter it correctly.
- Author, reviewer, tenant, allowed channel, revision and posting authority are server-derived. Never accept `approved_by`, `approval_status` or a bypass flag as authority from a request.
- Submission, revision, review decision and posted result have stable identities. Approval and posting are one database transaction for local effects.
- Author and reviewer cannot be the same person for a review-required submission. Direct posting is a separate, audited policy outcome.
- Every query includes verified tenant and row scope, including raw database queries, jobs and exports.
- Existing financial engines remain responsible for balancing, allocation, FIFO, reversals, rounding and stock consistency. The approval layer must not implement competing accounting arithmetic.
- POS immediate-post eligibility is a typed server command and policy decision, never just `source=pos`.
- All external effects use after-commit delivery with idempotency. A network failure cannot produce a duplicate invoice, journal, payment or stock movement.

## 2. Data model

Create additive migrations under `database/migrations/` with unused timestamps determined at implementation time. This workspace already has migrations dated 2026-09-22; do not reuse their sequence numbers. Match actual user/tenant/reference column types and DB collation before creating foreign keys; domain document IDs are often UUIDs while users are not universally represented the same way in historical columns.

### Tables

| New table | Required fields and constraints |
|---|---|
| `approval_documents` | UUID id; tenant_id; document_type; operation (create/amend/reverse); source_channel; author_user_id; assignee/reviewer-group reference; state; current_revision_id; lock_version; original_document_type/id for amendments; client_submission_key; posted_document_type/id; submitted_at, returned_at, posted_at, withdrawn_at, rejected_at; timestamps. Unique `(tenant_id, client_submission_key)`; indexes `(tenant_id,state,submitted_at)` and `(tenant_id,author_user_id,state)` |
| `approval_document_revisions` | UUID id; tenant_id; document_id; revision_number; schema_version; normalized payload JSON; payload hash; server-calculated display amount/currency; author; created_at. Unique `(document_id,revision_number)`. Immutable after insert; use decimal values/strings, not binary floats, for money |
| `approval_events` | UUID id; tenant_id; document_id; revision_id; actor_user_id or explicit system actor; event type; from/to state; reason codes JSON; note; policy_version; decision details; correlation/idempotency key; created_at. Append-only; unique decision key where needed |
| `approval_policies` | tenant_id; version; enabled; document_type; operation; channel; threshold/currency; reviewer eligibility and limits; direct-post eligibility; effective_at; changed_by. Versioned policies; exact match/precedence rules, no client expressions/code |
| `approval_attachments` | tenant_id; document/revision ids; private storage key; original name; type/size/hash; uploader; created_at. Private authorized download only; never public storage URLs |
| `transaction_postings` | UUID id; tenant_id; command key; approval revision nullable for explicit immediate commands; command type; payload hash; result type/id; state/time. Unique `(tenant_id,command_key)` and unique approved revision where non-null |
| `transaction_outbox` | tenant_id; event key unique; event type; target/result reference; payload; attempt count; delivered_at; next_attempt_at. No replay of successful external events |
| `pending_cash_custody` | tenant_id; approval document/revision; custodian/shift/register; received amount/currency; custody status; handed-over/reconciled timestamps. Operational reconciliation only, excluded from posted ledger totals |

Policies can use a child `approval_policy_reviewers` table for user/group/location eligibility instead of embedding unqueryable membership JSON. Retain historical reviewer definitions in the policy snapshot. Never cascade-delete financial or review history when a member leaves; preserve actor identifiers and a non-sensitive display snapshot as appropriate.

Add an approval-mode migration to `tenant_users`: `transaction_approval_mode` with `inherit`, `required`, and `direct` (default `inherit`), plus `transaction_approval_changed_by` and `transaction_approval_changed_at`. The effective decision order for the four supported document types is:

1. If store approval is disabled, post normally subject to existing permissions.
2. If strict owner separation is disabled and the member is owner, direct post and audit the exemption.
3. `required` always enters review; `direct` posts directly if the actor still has the underlying create/post permission; `inherit` uses the store/role policy.
4. Amount/type/channel rules may make an otherwise direct transaction require review, but cannot grant a transaction permission the employee lacks.
5. POS checkout eligibility is evaluated independently from this administrative setting.

Only an authorized owner/admin can change another member's mode. Never accept the mode from a transaction request, never allow self-service changes, and record every change. The staff invite/create/edit interface should present a simple **Require approval for this employee** control, with an advanced inherit option. Invitations must persist the intended mode through acceptance.

### States and transitions

| Current | Action | Next | Checks |
|---|---|---|---|
| draft | save | draft | Author, current version, editable fields only |
| draft / returned | submit | pending | Full typed validation, normalized new revision, effective policy, permitted author |
| pending | return | returned | Eligible independent reviewer, current revision, reason(s) and note required |
| pending | reject | rejected | Eligible reviewer, required reason/note |
| pending | withdraw | withdrawn | Author and still pending under lock |
| pending | approve and post | posted | Eligible independent reviewer, current revision, live revalidation and successful atomic posting |
| pending | approve but posting validation fails | pending | No approval success event or partial effects; record separate failure attempt and show actionable errors |
| posted | request amendment | New linked draft | Original remains immutable |

No separately committed “approved but not posted” state is required for the first release. During the locked database transaction the decision is being applied; the persisted final state is posted only after success. External notification/tax-delivery status belongs to the outbox, not to the approval state. If future async posting is introduced, explicitly add approved/posting/failed states and recovery semantics rather than overloading pending.

## 3. New backend files

| Proposed file(s) | Responsibility |
|---|---|
| `app/Models/ApprovalDocument.php`, `ApprovalDocumentRevision.php`, `ApprovalEvent.php`, `ApprovalPolicy.php`, `ApprovalAttachment.php` | Tenant-safe relationships, immutable revision/event protections; do not expose payload through unrestricted serializers |
| `app/Models/TransactionPosting.php`, `TransactionOutbox.php`, `PendingCashCustody.php` | Idempotency, after-commit side effects and operational custody |
| `app/Services/Approvals/ApprovalWorkflow.php` | Save, submit, return, reject, withdraw and approve transitions with row locks/version checks |
| `app/Services/Approvals/ApprovalPolicyResolver.php` | Decide immediate/review-required/denied; resolve eligible reviewer and policy version |
| `app/Services/Approvals/DocumentAdapter.php`, `DocumentAdapterRegistry.php` | Allowlisted typed contract per document/operation; no arbitrary controller/method/class from payload |
| `app/Services/Approvals/Adapters/{SalesInvoice,PurchaseBill,CustomerReceipt,SupplierPayment,Expense,ManualJournal,FundMovement,Reversal}Adapter.php` | Normalize, validate references, preview, revalidate and post using existing engines. Additional typed adapters required for specialized financial routes before those types are enabled |
| `app/Services/Transactions/TransactionCommandBus.php`, `PostingContext.php` | Single policy-aware application boundary; server-issued context for immediate or approved posting |
| `app/Policies/ApprovalDocumentPolicy.php` | Own/assigned/store visibility and action authorization, independent maker/checker checks |
| `app/Http/Controllers/ApprovalController.php`, `ApprovalPolicyController.php` | Thin scoped endpoints; workflow owns decisions |
| `app/Http/Requests/Approvals/{SaveDraft,Submit,Review,UpdatePolicy}Request.php` | Envelope validation; typed adapters validate business payload; revision and version required on review |
| `app/Http/Resources/ApprovalDocumentResource.php` | Field-level masking, allowed_actions, preview, events, attachment metadata |
| `app/Jobs/DeliverTransactionOutbox.php`, `app/Notifications/ApprovalStatusChanged.php` | Idempotent after-commit notifications; links reauthorize at read time |
| `config/approvals.php` | Built-in reason codes, allowlisted types/operations, default policy recommendations |

The policy resolver must consume the current tenant's enabled setting, strict-owner setting, the active membership's `transaction_approval_mode`, the underlying transaction permission, amount/type rules, and server-verified channel. Return a typed decision containing the matched policy/version and reason. Persist that decision in the audit trail for both reviewed and direct-post paths.

### Adapter contract

```php
interface DocumentAdapter {
    public function normalize(array $input, ActorContext $actor): array;
    public function validate(array $payload, ActorContext $actor): void;
    public function preview(array $payload, ActorContext $actor): array;
    public function revalidateForPosting(array $payload, PostingContext $context): void;
    public function post(array $payload, PostingContext $context): PostedDocument;
}
```

`ActorContext` and `PostedDocument` are new typed DTOs under the same service namespace. Preview is read-only: it must not allocate numbers, create service products, reserve stock, write journals or invoke external services. Normalize unknown or privilege-bearing keys out; whitelist editable keys for each schema version. Monetary previews are recalculated on the server.

### Approval transaction algorithm

1. Verify active membership in the selected tenant; resolve submission through a tenant-scoped query.
2. Start DB transaction; `lockForUpdate()` the approval document and relevant financial source rows in a consistent order.
3. If this idempotency key already succeeded with the same payload/revision, return its existing result. If reused with different content, return 409.
4. Check pending state, `lock_version`, revision id/hash, author identity, independent reviewer, current reviewer permission/limit/location and current policy. Compare policy versions; if stricter eligibility changed, reject stale review and require refreshed review. Never silently apply an old exemption.
5. Revalidate tenant ownership of every party, account, bank, invoice, product, warehouse and allocation. Recheck balances, quantities, period closure, tax/discount/PIN rules, currency and duplicate invoice constraints. Honor current plan/module/transaction limits as existing posting routes do.
6. Call the allowlisted adapter with the persisted revision and trusted PostingContext. Reserve/check the unique posting key in the same transaction. Use existing engine transactions, ensuring they use the same connection.
7. Persist posting result, review event, final state and outbox entries; commit. A thrown exception rolls back all financial and stock effects.
8. Dispatch outbox delivery after commit. Retry transient deadlocks with a bounded retry policy and the same idempotency key. User retries after a lost response return the already committed result.

Do not temporarily log in as the author/reviewer, replay HTTP requests through the router, or call controllers with synthetic requests as the new approval implementation. Extract reusable application services. A request-local boolean such as `skip_approval` is insufficient authority and unsafe with workers/nested calls.

### Defense at the posting boundary

Refactor protected writes through TransactionCommandBus. For covered financial operations, posting entry points require trusted PostingContext; reject missing contexts once a tenant's approval mode covers that operation. Low-level journals may be internal legs of a larger approved sale/purchase and share its context. Automated calls require an explicit system principal and policy; `auth()->id() ?? 1` is not an approval identity. Make the typed context request/job scoped and non-serializable from untrusted payloads. Validate the context against persisted revision/posting identity where applicable.

This boundary must be introduced with complete call-site tests: simply adding a required argument to `AccountingService::createEntry()` would break many existing engine callers. Inventory and migrate those callers, then enable enforcement. Do not leave an enabled policy with an undocumented fallback path.

## 4. Existing integration files

| Existing files | Required change |
|---|---|
| `app/Http/Controllers/PaymentController.php` | Extract standalone receipt/payment command service; submit/review before payment table or journal writes; preserve form response compatibility |
| `app/Http/Controllers/V3/CustomerPaymentController.php`, `V3/SupplierPaymentController.php` | Reuse typed payment adapters; allocate only inside approved posting; revalidate invoice balances on approval |
| `app/Http/Controllers/SaleController.php`, `V3/SaleController.php`, `app/Engines/SaleService.php`, `app/Observers/SaleObserver.php` | Distinguish administrative invoice command from eligible POS command; intercept before product/stock/payment effects; prove observer conditions cannot post an approval revision; preserve restaurant service-charge/tip/shift work already in progress |
| `app/Http/Requests/V3/StoreSaleRequest.php`, `app/Support/ManagerApproval.php`, `PosSaleApprovalGuard.php` | Preserve existing discount/below-cost authorization as an independent control; general review does not automatically replace a special manager PIN decision |
| `app/Http/Controllers/V3/PurchaseController.php`, `app/Engines/PurchaseService.php` | Keep receipt workflow and review workflow separate; guard create/update/receive/void where policy requires; approved purchase order is not an approved received bill |
| `app/Http/Controllers/ExpenseController.php`, `V3/ExpenseController.php` | Extract journal logic into reusable adapter-backed application service; gate update/reversal as well as create |
| `app/Http/Controllers/FundController.php`, `V3/FundController.php`, `V3/BankTransferController.php` | Gate incoming/outgoing funds, transfers and adjustments before effects |
| V3 customer/supplier advance, opening-balance, payroll, employee-settlement, asset, depreciation, loan, disaster-claim, donation, fiscal-year, bad-debt, bounce controllers | Add explicit type/operation adapters or intentionally denied mode until integrated; no generic “finance” fallback bypass |
| `app/Http/Controllers/PosReturnController.php`, `ReturnController.php`, `DebitNoteController.php`, V3 return controllers; `app/Engines/SaleReversalService.php` | Approved reversal/amendment commands, linked originals, never mutate posted historical journal lines |
| `app/Http/Controllers/Api/SyncController.php`, `routes/api.php` | Replace new-policy synthetic-controller replay with application command; return per-item pending/posted/conflict state and stable IDs; retries deduplicate pending as well as posted work |
| `app/Console/Commands/GenerateRecurringInvoices.php`, `app/Services/DataImportService.php`, WooSync/VenSynQ posting callers | Explicit system principal/policy and source; migrate direct engine calls; trusted import decisions audited |
| `routes/web.php`, `routes/api.php` | Register review/settings endpoints inside authenticated active-tenant groups; permission + object policy enforcement; CSRF for web; scoped token access for API |
| `app/Engines/AccountingService.php`, `PaymentService.php`, `AuditService.php` | Carry trusted author/reviewer/posting identity; preserve transaction integrity and idempotency; audit accurate actors |

First implementation task: produce a checked route/action/command matrix using all `createEntry`, `SaleService::post`, `PurchaseService` and reversal call sites, including observers, jobs, CLI, sync and imports. The independent review counted 44 files and 81 `createEntry()` call sites; recount and save the current result rather than assuming that number remains exact. The above are observed principal paths and integration families, not exhaustive coverage. Release approval mode only for types whose complete paths have been proven covered.

## 5. HTTP and UI contracts

Recommended store-scoped routes, following existing naming prefixes:

| Method / endpoint | Behavior |
|---|---|
| GET `/approvals` | Scoped inbox / My Submissions; filters by state/type/age; paginate |
| POST `/approvals/drafts` | Create allowlisted document draft with client submission key |
| GET `/approvals/{id}` | Authorized preview/history and action flags |
| PATCH `/approvals/{id}` | Author saves editable draft/returned version; expected lock_version |
| POST `/approvals/{id}/submit` | Validate and freeze new revision |
| POST `/approvals/{id}/return` | reason_codes[], note, expected_revision_id, lock_version, idempotency_key |
| POST `/approvals/{id}/reject` | Required reason/note and same version contract |
| POST `/approvals/{id}/approve` | Version + idempotency only; never a replacement financial payload |
| POST `/approvals/{id}/withdraw` | Author withdrawal under lock |
| GET/PUT `/settings/approval-policies` | Versioned settings; separately authorized |
| GET `/approvals/{id}/attachments/{attachment}` | Private tenant/object authorization, scoped download |

JSON submit result: `{ status: "pending", approval_id, revision_id, reference, next_action }`. Immediate and reviewed posting results: `{ status: "posted", document_type, document_id, reference }`. Return 409 for stale revision/idempotency mismatch, 422 for validation, 403 for an authenticated denied action, 404 for concealed cross-tenant objects. Inertia forms redirect with equivalent flash state. Never issue “payment posted” or print a final posted receipt for a pending result.

Create `resources/js/Pages/Approvals/Index.jsx`, `Show.jsx`, `resources/js/Pages/Settings/ApprovalPolicies.jsx`, and `resources/js/Components/Approvals/{StatusBadge,ReviewActions,ReturnDialog,RevisionHistory}.jsx`. Add the employee approval control to the existing staff invitation and staff edit UI, using the existing permission-management experience rather than a separate user system. Reuse existing design-system components and original document editors; do not build a second generic JSON editor for staff.

Update `resources/js/Pages/NewInvoice.jsx`, relevant `Payments/*` and expense/purchase/sales forms, and `resources/js/Domain/invoice/useInvoiceForm.js` where applicable. Resolve each editor's actual submit action before changes. Load returned revision values into the appropriate original editor with a visible feedback panel; resubmit goes to the approval lifecycle rather than creating an unrelated posted document. Disable reviewer editing. Preserve unsaved edits and accessible keyboard/focus/error behavior.

Add Approvals/My Work navigation through the existing layout/navigation mechanism, respecting grants. Notifications contain minimal details, link to authorized pages, and are created after commit. Pending documents and attachment previews never enter public receipt or unauthenticated tracking endpoints.

## 6. Canonical permissions

Add `app/Services/Authorization/PermissionResolver.php` and `DataScopeResolver.php`; make `User::hasPermission`, permissions serialization, CheckPermissions, API/sync checks and frontend capability props consume the same result. Apply bug fixes from document 03 first.

New proposed grants:

- `approvals.submit`, `approvals.review`, `approvals.view_all`, `approvals.manage_policies`, `approvals.post_direct`.
- `dashboard.customize`, `dashboard.publish`; preserve `data.export` for bulk download.
- `sales.view_own`, `sales.view_assigned`, `pos.shift_view_own`, `pos.shift_view_all`.
- `inventory.costs`, `reports.profit`, `staff.payroll_view`, `parties.contact_view`.
- Operational view grants for kitchen, production, fulfillment and delivery as needed by their command modules; do not grant financial viewing just to enable those cards.

Review grant is constrained by policy type/amount/location/assignment; it is not permission to approve everything. Submit is combined with the underlying create capability and policy. A reviewer-only user may inspect just the submitted document fields needed for that review, without gaining arbitrary ledger editing rights. Underlying permission revocation for the author must force a defined reauthorization or reassignment path; never silently post under an inactive member.

Define permission override mode explicitly (`inherit` versus `custom`) in `tenant_users`, rather than guessing intent from `[]`. Migrate historical `[]` conservatively as inherit when intent is unknown, report affected memberships, and require explicit custom-empty to deny all going forward. Add `permissions_version` for revocation/cache invalidation. Update the staff permission save endpoint and `resources/js/Pages/Store/Staff/Index.jsx` to send the mode and validated known grant keys. Preserve last-owner recovery rules without giving restricted admins unconditional bypass.

## 7. V6 access contract and data scope

Before changing presets, test the resolved pipeline `ReckonerRegistry → checkAvailability → FrameFiller → DashboardSanitizer` for every configured role. The independent review found 24 preset keys absent from `cards.json`, but several older keys also exist directly in `ReckonerRegistry` and `FrameFiller` can use secondary candidates. Absence from `cards.json` alone does not prove a dead card or an empty resolved dashboard. Record which configured keys are truly unresolved and which roles actually receive zero cards; then rewrite only the broken presets against canonical keys. Add a test that configured preset keys resolve through the effective registry, plus a non-empty/safe seeded-layout test for each supported role. Log invalid configuration keys instead of silently losing them.

Create `app/Services/Dashboard/CardAccessPolicy.php` and `DashboardPresenter.php`, plus `config/dashboard_access.php` with an explicit entry for every card key. The generated inventory at the end of this file is the exact baseline. Unknown/new keys default to denied until their access contract is registered.

Recommended contract:

```json
{
  "view": {"all": ["inventory.view", "inventory.costs"], "any": []},
  "scope": "authorized_locations",
  "sensitivity": ["cost"],
  "drill": {"route": "existing.route.name", "all": ["inventory.view", "inventory.costs"]},
  "export": {"all": ["data.export", "inventory.view", "inventory.costs"]},
  "actions": {},
  "policy_version": 1
}
```

Route in the example is a placeholder: bind an actual verified route per card or set drill to null. Semantics: ALL grants must pass, and if ANY is nonempty at least one must pass. Do not replace every current ANY with ALL blindly: rewrite each contract intentionally. A summary grant must not grant profit/cost/payroll/contacts merely because it appears as an alternative.

Implement once and call from:

- `app/Reckoner/Reckoner.php` availability AND read paths, before cache access/source dispatch.
- `app/Http/Controllers/Api/ReckonerController.php` catalogue AND measure library. Measures inherit their own sensitivity/scope, not just module enablement.
- `app/Http/Controllers/Api/DashboardController.php`, `DashboardSanitizer`, `FrameFiller`: seed, add, update, reset, publish, show, index and layout save, including secondary series keys.
- `app/Http/Controllers/DashboardController.php`: one V6 presenter for index/new-dashboard/compatibility aliases. Remove legacy bulk financial props from the V6 response; fetch only authorized readings.
- `resources/js/Pages/NewDashboard.jsx`, card editor/library and frame picker: render only server-approved catalogue/actions. Empty authorized catalogue remains empty; no fallback to bundled full catalogue when server returns an empty array.
- All drill/export endpoints: enforce again; a UI-hidden button is not protection. Combine export and view using AND, not the existing comma-separated OR permission middleware convention.

Scope must be derived from active membership/assignments and applied inside sources, measure-engine streams, resolvers, totals, series, comparisons, lists and exports. Never accept a caller's user_id/register_id/location_id without intersecting it with authorized scope. Distinguish tenant scope from row scope. `ReckonerContext` currently contains tenant and user; extend it with immutable effective scope.

`Reckoner::cacheKey()` currently uses tenant, metric, dates, granularity and request args. Before adding personal/assigned cards, add server scope fingerprint, permission/policy version and data-contract version. Tenant-only cache is appropriate only for identical authorized store aggregates; it is unsafe for mixed own/store results. Invalidate/re-key on assignment or permission changes. Test both warm-cache directions.

### Proposed policy profiles for the complete catalogue

These are conservative starting profiles, referenced by every row in the appendix. They deliberately restrict some mixed-content cards until field-level separation is verified. Financial sensitivity overrides a broader operational profile. Profile assignment is a proposed design, not current behavior or a claim that a resolver is verified.

| Profile | Required view grants (ALL) | Scope |
|---|---|---|
| FIN | reports.financial | Authorized store/location finance; profit/cost/payroll/contact fields additionally require their sensitivity grants |
| SALES | sales.view | Authorized store sales; own/assigned alternatives require scoped implementations |
| BUY | purchases.view + purchases.costs | Authorized purchasing; split quantity-only cards later if useful |
| STOCK | inventory.view | Authorized warehouse/location quantities only; cost/profit requires stricter profile |
| COST | inventory.view + inventory.costs | Authorized stock/production cost |
| PROFIT | reports.financial + reports.profit | Authorized store/location profit |
| PEOPLE | admin.staff_view | Authorized staff assignments; payroll/private contacts additionally gated |
| CONTACTS | sales.view + parties.contact_view | Authorized customer records; amounts/credit require FIN as appropriate |
| OPERATIONS | reports.summary | Restricted transitional aggregate profile; replace with module-specific operational grants before exposing to staff who lack summary access |

All profiles: download requires the profile AND `data.export`; drill requires profile AND target-resource policy; no transaction mutation is granted by a card. Granting OPERATIONS does not authorize sensitive fields. Until payloads are verified/masked, cards with mixed financial content must use FIN/PROFIT instead. The appendix maps exact keys to proposed profiles; implementation must review nested payloads against these constraints and pin expected results in independent tests.

### New cards and count migration

Create operational readings `work.my_pending`, `work.my_returned`, `work.assigned_reviews`, `work.oldest_review_age`, and scoped `pos.my_shift_sales`, `pos.my_shift_count`, `pos.my_drawer_variance`; add delivery/kitchen cards only where existing keys cannot satisfy the role under scoped permissions. Implement through the established resolver/measure system, with private scope and truthful empty states.

`CardRegistry::validateCatalog()` currently requires exactly 349 entries. Update that invariant deliberately: preserve a versioned set of the original 349 keys, enforce uniqueness and contracts for the full expanded catalogue, update parity/golden fixtures and UI catalogue generation. Do not merely add JSON entries and leave the exact-count assertion failing. Mark new cards implemented_unverified until their calculation/access tests justify verified.

## 8. Tests and release checks

Add tests to the canonical `tests/tests` tree, using the project's MySQL test harness and `tests/phpunit.xml`. Do not use an unqualified test run that might select legacy tests. Do not run migrate:fresh against a development/production database. Tests are proposed here and were not executed in this audit.

| Proposed test file | Required cases |
|---|---|
| `Feature/Approvals/ApprovalLifecycleTest.php` | Draft/submit/return/edit/resubmit/approve; rejection; withdrawal; invalid transitions; original history immutable; reasons/notes required |
| `Feature/Approvals/ApprovalFinancialIsolationTest.php` | For each adapter, pending/returned/rejected create no journals, allocations, stock moves, final numbering, tax delivery or loyalty; posted results reconcile |
| `Feature/Approvals/ApprovalConcurrencyTest.php` | Two real DB connections approve same revision; approve vs withdraw/return; duplicate key same/different payload; lost-response retry |
| `Feature/Approvals/ApprovalAuthorizationTest.php` | Self-approval; foreign tenant IDs; another employee's draft; inactive maker/reviewer; revoked grants; assigned location; amount cap; forged bypass/source/approved_by |
| `Feature/Approvals/ApprovalRevalidationTest.php` | Changed balances, stock, fiscal closure, currencies/accounts, deleted references, policy version and over-allocation; all effects roll back |
| `Feature/Approvals/ApprovalEntryPointCoverageTest.php` | Data-provider matrix for web/V3/API/offline/import/recurring/marketplace paths and create/update/receive/void/return/conversion |
| `Feature/Approvals/ApprovalOutboxTest.php` | Rollback produces no delivery; crash after commit; retry external failure; delivery deduplicates |
| `Feature/Approvals/PosExemptionTest.php` | Ordinary sale immediate; special discounts still guarded; admin invoice cannot forge POS; sale payment stays atomic; offline per-item status |
| `Feature/Reckoner/CardAuthorizationMatrixTest.php` | Every original key and every new key: independent expected grants, missing each required grant, custom-empty, disabled module/plan, sensitive fields, unavailable state |
| `Feature/Reckoner/CardScopeIsolationTest.php` | Two tenants, two cashiers/registers, assigned warehouses; compare/ranking/series/derived/composed card; both warm-cache orders; revoked access |
| `Feature/Dashboard/RoleDashboardAccessTest.php` | All 18 roles + overrides; V6 route aliases; empty catalogue; personal/shared template; locked layout; permission changes do not leak saved cards |
| `Feature/Dashboard/DashboardExportAuthorizationTest.php` | View without export, export without view, sensitive export, direct URL, attachment, print and drill permissions |
| `resources/js/tests/Approvals/*.test.jsx` | Pending vs posted feedback, reason-note validation, stale version, correction form, no reviewer edit, keyboard focus |
| `resources/js/tests/dashboardAccess.test.js` | No fallback catalogue on empty response; action visibility; no forbidden secondary series |

Extend existing `Feature/Hardening/PosApprovalGuardTest.php`, `Feature/Money/GranularPermissionTest.php`, `Feature/Reckoner/Laws/L6PermissionLawTest.php`, dashboard API/lock tests, payment allocation and purchase/sales accounting tests. The current L6 test derives denial expectations from registry permissions; add an independent policy expectation fixture so a bad registry grant cannot make the test green by definition.

Suggested execution after implementation and safe test-DB preflight:

```text
php vendor/bin/pest --configuration tests/phpunit.xml --filter Approval
php vendor/bin/pest --configuration tests/phpunit.xml --filter "Reckoner|Dashboard|GranularPermission|PaymentAllocation|PosApproval"
npm test -- --run
npm run build
```

Confirm available runtime paths and the test harness's preflight first. Build may update generated assets; keep those separate from existing workspace changes. Run the canonical financial/security regression lanes and then the full suite before release. For concurrency use MySQL connections/processes rather than a single rolled-back test transaction pretending to simulate races.

Pilot telemetry: pending count/age, returned count, approval failures, duplicate attempts, outbox retries, denied scope probes and ledger reconciliation differences. Log IDs/reasons, not full private financial payloads. Backfill no pending history from existing journals; legacy posted records stay posted. Do not rewrite payment dates automatically during this rollout.

## 9. Catalogue baseline and proposed profile appendix

Source: `resources/data/reckoner/cards.json`, inspected 2026-09-22. Current permissions are ANY-of in Reckoner. Profile is a proposed starting rule under section 7; metadata state is not a fresh runtime certification. Per-card payload/measure review and independent tests remain mandatory. The table below is generated from the inspected JSON to avoid omitting any of the 349 keys.

| Card key | Module | Current ANY-of permissions | Metadata state | Proposed profile |
|---|---|---|---|---|
| core.revenue | core | reports.financial, reports.summary | verified | FIN |
| core.revenue_trend | core | reports.financial, reports.summary | implemented_unverified | FIN |
| core.net_profit | core | reports.financial, reports.summary | verified | PROFIT |
| core.profit_trend | core | reports.financial, reports.summary | implemented_unverified | PROFIT |
| core.gross_profit | core | reports.financial, reports.summary | verified | PROFIT |
| core.gross_margin_pct | core | reports.financial, reports.summary | verified | PROFIT |
| core.net_margin_pct | core | reports.financial, reports.summary | verified | PROFIT |
| core.cogs | core | reports.financial, reports.summary | verified | FIN |
| core.expenses_total | core | reports.financial, reports.summary | verified | FIN |
| core.expense_ratio | core | reports.financial, reports.summary | verified | OPERATIONS |
| core.receivables | core | reports.financial, reports.summary | verified | FIN |
| core.receivables_aging | core | reports.financial, reports.summary | verified | FIN |
| core.payables | core | reports.financial, reports.summary | verified | FIN |
| core.payables_aging | core | reports.financial, reports.summary | verified | FIN |
| core.total_liquidity | core | reports.financial, reports.summary | verified | FIN |
| core.liquidity_trend | core | reports.financial, reports.summary | implemented_unverified | FIN |
| core.cash_flow_trend | core | reports.financial, reports.summary | implemented_unverified | FIN |
| core.net_cash_position | core | reports.financial, reports.summary | verified | FIN |
| core.working_capital | core | reports.financial, reports.summary | verified | FIN |
| core.revenue_vs_prev | core | reports.financial, reports.summary | verified | OPERATIONS |
| core.profit_vs_prev | core | reports.financial, reports.summary | verified | PROFIT |
| core.transaction_count | core | reports.financial, reports.summary | implemented_unverified | OPERATIONS |
| core.avg_transaction_value | core | reports.financial, reports.summary | verified | FIN |
| core.busiest_day | core | reports.financial, reports.summary | implemented_unverified | FIN |
| core.peak_hour | core | reports.financial, reports.summary | implemented_unverified | OPERATIONS |
| core.balance_sheet_ok | core | reports.financial, reports.summary | verified | FIN |
| core.journal_entries_count | core | reports.financial, reports.summary | verified | OPERATIONS |
| core.audit_trail_count | core | reports.financial, reports.summary | implemented_unverified | OPERATIONS |
| core.reversal_count | core | reports.financial, reports.summary | verified | OPERATIONS |
| core.document_sequence_ok | core | reports.financial, reports.summary | implemented_unverified | OPERATIONS |
| core.user_activity | core | reports.financial, reports.summary | implemented_unverified | OPERATIONS |
| core.plan_usage | core | reports.financial, reports.summary | implemented_unverified | OPERATIONS |
| products.count | products | reports.summary | verified | OPERATIONS |
| products.active_count | products | reports.summary | implemented_unverified | OPERATIONS |
| products.by_category | products | reports.summary | implemented_unverified | OPERATIONS |
| products.catalogue_value | products | reports.summary | implemented_unverified | FIN |
| products.avg_margin | products | reports.summary | implemented_unverified | PROFIT |
| products.top_margin | products | reports.summary | implemented_unverified | PROFIT |
| products.lowest_margin | products | reports.summary | implemented_unverified | PROFIT |
| products.never_sold | products | reports.summary | implemented_unverified | OPERATIONS |
| products.missing_cost | products | reports.summary | implemented_unverified | FIN |
| products.new_this_period | products | reports.summary | implemented_unverified | OPERATIONS |
| services.count | services | reports.summary | implemented_unverified | OPERATIONS |
| services.revenue | services | reports.summary | implemented_unverified | FIN |
| services.revenue_trend | services | reports.summary | implemented_unverified | FIN |
| services.share_of_revenue | services | reports.summary | implemented_unverified | OPERATIONS |
| services.top_services | services | reports.summary | implemented_unverified | FIN |
| services.avg_ticket | services | reports.summary | implemented_unverified | FIN |
| services.jobs_count | services | reports.summary | implemented_unverified | OPERATIONS |
| customers.count | customers | sales.view | implemented_unverified | CONTACTS |
| customers.new | customers | sales.view | verified | CONTACTS |
| customers.new_trend | customers | sales.view | implemented_unverified | CONTACTS |
| customers.active | customers | sales.view | verified | CONTACTS |
| customers.dormant | customers | sales.view | implemented_unverified | CONTACTS |
| customers.repeat_rate | customers | sales.view | implemented_unverified | CONTACTS |
| customers.top_customers | customers | sales.view | implemented_unverified | CONTACTS |
| customers.avg_spend | customers | sales.view | implemented_unverified | CONTACTS |
| customers.owing | customers | sales.view | verified | CONTACTS |
| customers.by_area | customers | sales.view | implemented_unverified | CONTACTS |
| suppliers.count | suppliers | purchases.view | verified | BUY |
| suppliers.active | suppliers | purchases.view | implemented_unverified | BUY |
| suppliers.top_suppliers | suppliers | purchases.view | implemented_unverified | BUY |
| suppliers.spend_total | suppliers | purchases.view | implemented_unverified | BUY |
| suppliers.spend_trend | suppliers | purchases.view | implemented_unverified | BUY |
| suppliers.owed_list | suppliers | purchases.view | verified | BUY |
| suppliers.concentration | suppliers | purchases.view | implemented_unverified | BUY |
| suppliers.new | suppliers | purchases.view | implemented_unverified | BUY |
| pos.revenue | pos | sales.view | verified | SALES |
| pos.revenue_trend | pos | sales.view | implemented_unverified | SALES |
| pos.sale_count | pos | sales.view | verified | SALES |
| pos.avg_ticket | pos | sales.view | verified | SALES |
| pos.max_sale | pos | sales.view | implemented_unverified | SALES |
| pos.items_per_sale | pos | sales.view | implemented_unverified | SALES |
| pos.payment_breakdown | pos | sales.view | implemented_unverified | SALES |
| pos.hourly_heatmap | pos | sales.view | implemented_unverified | SALES |
| pos.weekday_split | pos | sales.view | implemented_unverified | SALES |
| pos.discount_total | pos | sales.view | verified | SALES |
| pos.live_feed | pos | sales.view | implemented_unverified | SALES |
| invoicing.count | invoicing | sales.view | verified | SALES |
| invoicing.value | invoicing | sales.view | verified | SALES |
| invoicing.value_trend | invoicing | sales.view | implemented_unverified | SALES |
| invoicing.unpaid_value | invoicing | sales.view | implemented_unverified | SALES |
| invoicing.overdue_count | invoicing | sales.view | implemented_unverified | SALES |
| invoicing.overdue_value | invoicing | sales.view | implemented_unverified | SALES |
| invoicing.avg_invoice | invoicing | sales.view | implemented_unverified | SALES |
| invoicing.avg_days_to_pay | invoicing | sales.view | implemented_unverified | SALES |
| invoicing.largest_open | invoicing | sales.view | implemented_unverified | SALES |
| invoicing.draft_count | invoicing | sales.view | implemented_unverified | SALES |
| quotations.count | quotations | sales.view | implemented_unverified | SALES |
| quotations.open_value | quotations | sales.view | implemented_unverified | SALES |
| quotations.win_rate | quotations | sales.view | implemented_unverified | SALES |
| quotations.win_rate_trend | quotations | sales.view | implemented_unverified | SALES |
| quotations.avg_quote | quotations | sales.view | implemented_unverified | SALES |
| quotations.expiring | quotations | sales.view | implemented_unverified | SALES |
| sales_orders.open_count | sales_orders | sales.view | implemented_unverified | SALES |
| sales_orders.open_value | sales_orders | sales.view | implemented_unverified | SALES |
| sales_orders.count | sales_orders | sales.view | implemented_unverified | SALES |
| sales_orders.value_trend | sales_orders | sales.view | implemented_unverified | SALES |
| sales_orders.fulfil_rate | sales_orders | sales.view | implemented_unverified | SALES |
| sales_orders.overdue | sales_orders | sales.view | implemented_unverified | SALES |
| sales_orders.by_customer | sales_orders | sales.view | implemented_unverified | SALES |
| sales_returns.count | sales_returns | sales.view | implemented_unverified | SALES |
| sales_returns.value | sales_returns | sales.view | implemented_unverified | SALES |
| sales_returns.rate | sales_returns | sales.view | implemented_unverified | SALES |
| sales_returns.trend | sales_returns | sales.view | implemented_unverified | SALES |
| sales_returns.top_returned | sales_returns | sales.view | implemented_unverified | SALES |
| sales_returns.by_reason | sales_returns | sales.view | implemented_unverified | SALES |
| recurring.active_count | recurring_invoices | reports.summary | implemented_unverified | OPERATIONS |
| recurring.monthly_value | recurring_invoices | reports.summary | implemented_unverified | FIN |
| recurring.trend | recurring_invoices | reports.summary | implemented_unverified | FIN |
| recurring.due_next_7 | recurring_invoices | reports.summary | implemented_unverified | FIN |
| recurring.share_of_revenue | recurring_invoices | reports.summary | implemented_unverified | OPERATIONS |
| recurring.churned | recurring_invoices | reports.summary | implemented_unverified | OPERATIONS |
| proposals.count | b2b_proposals | reports.summary | implemented_unverified | OPERATIONS |
| proposals.pipeline_value | b2b_proposals | reports.summary | implemented_unverified | FIN |
| proposals.win_rate | b2b_proposals | reports.summary | implemented_unverified | OPERATIONS |
| proposals.avg_value | b2b_proposals | reports.summary | implemented_unverified | FIN |
| proposals.stale | b2b_proposals | reports.summary | implemented_unverified | OPERATIONS |
| proposals.avg_cycle_days | b2b_proposals | reports.summary | implemented_unverified | OPERATIONS |
| pricing.tier_count | pricing_tiers | sales.view | implemented_unverified | SALES |
| pricing.revenue_by_tier | pricing_tiers | sales.view | implemented_unverified | SALES |
| pricing.customers_by_tier | pricing_tiers | sales.view | implemented_unverified | SALES |
| pricing.avg_realised_price | pricing_tiers | sales.view | implemented_unverified | SALES |
| pricing.discount_vs_list | pricing_tiers | sales.view | implemented_unverified | SALES |
| park.open_count | park_recall | reports.summary | implemented_unverified | OPERATIONS |
| park.open_value | park_recall | reports.summary | implemented_unverified | FIN |
| park.recalled_count | park_recall | reports.summary | unimplemented | OPERATIONS |
| park.abandoned_count | park_recall | reports.summary | unimplemented | OPERATIONS |
| park.oldest | park_recall | reports.summary | implemented_unverified | OPERATIONS |
| tables.occupied | table_service | reports.summary | implemented_unverified | OPERATIONS |
| tables.occupancy_rate | table_service | reports.summary | implemented_unverified | OPERATIONS |
| tables.kitchen_pending | table_service | reports.summary | implemented_unverified | OPERATIONS |
| tables.avg_turn_minutes | table_service | reports.summary | implemented_unverified | OPERATIONS |
| tables.covers | table_service | reports.summary | unimplemented | OPERATIONS |
| tables.avg_cover_value | table_service | reports.summary | unimplemented | FIN |
| tables.revenue_per_table | table_service | reports.summary | implemented_unverified | FIN |
| tables.peak_occupancy | table_service | reports.summary | implemented_unverified | OPERATIONS |
| presales.count | pre_sales | sales.view | unimplemented | SALES |
| presales.value | pre_sales | sales.view | unimplemented | SALES |
| presales.advance_collected | pre_sales | sales.view | unimplemented | SALES |
| presales.pending_delivery | pre_sales | sales.view | unimplemented | SALES |
| presales.overdue | pre_sales | sales.view | unimplemented | SALES |
| inventory.stock_value | inventory | inventory.view | verified | COST |
| inventory.stock_value_trend | inventory | inventory.view | implemented_unverified | COST |
| inventory.product_count | inventory | inventory.view | implemented_unverified | STOCK |
| inventory.units_on_hand | inventory | inventory.view | verified | STOCK |
| inventory.low_stock_count | inventory | inventory.view | implemented_unverified | STOCK |
| inventory.low_stock_list | inventory | inventory.view | implemented_unverified | STOCK |
| inventory.out_of_stock_count | inventory | inventory.view | implemented_unverified | STOCK |
| inventory.dead_stock_value | inventory | inventory.view | implemented_unverified | COST |
| inventory.turnover_ratio | inventory | inventory.view | implemented_unverified | STOCK |
| inventory.days_of_cover | inventory | inventory.view | implemented_unverified | STOCK |
| inventory.value_by_category | inventory | inventory.view | implemented_unverified | COST |
| inventory.top_by_value | inventory | inventory.view | implemented_unverified | COST |
| locations.count | multi_location | inventory.view | verified | STOCK |
| locations.revenue_by_location | multi_location | inventory.view | unimplemented | COST |
| locations.profit_by_location | multi_location | inventory.view | unimplemented | PROFIT |
| locations.stock_by_location | multi_location | inventory.view | unimplemented | COST |
| locations.revenue_trend_by_location | multi_location | inventory.view | unimplemented | COST |
| locations.stock_imbalance | multi_location | inventory.view | unimplemented | STOCK |
| transfers.pending_count | stock_transfers | inventory.view | implemented_unverified | STOCK |
| transfers.pending_value | stock_transfers | inventory.view | implemented_unverified | COST |
| transfers.count | stock_transfers | inventory.view | implemented_unverified | STOCK |
| transfers.avg_transit_days | stock_transfers | inventory.view | implemented_unverified | STOCK |
| transfers.discrepancy_count | stock_transfers | inventory.view | implemented_unverified | STOCK |
| stocktakes.pending_count | stock_takes | inventory.view | implemented_unverified | STOCK |
| stocktakes.variance_value | stock_takes | inventory.view | implemented_unverified | COST |
| stocktakes.variance_pct | stock_takes | inventory.view | implemented_unverified | STOCK |
| stocktakes.last_count_days | stock_takes | inventory.view | implemented_unverified | STOCK |
| stocktakes.top_variances | stock_takes | inventory.view | implemented_unverified | STOCK |
| batches.count | batches_expiry | inventory.view | implemented_unverified | STOCK |
| batches.qty | batches_expiry | inventory.view | implemented_unverified | STOCK |
| batches.expiring_30 | batches_expiry | inventory.view | implemented_unverified | STOCK |
| batches.expiring_value | batches_expiry | inventory.view | implemented_unverified | COST |
| batches.expired_value | batches_expiry | inventory.view | implemented_unverified | COST |
| batches.expiry_list | batches_expiry | inventory.view | implemented_unverified | STOCK |
| batches.write_off_trend | batches_expiry | inventory.view | unimplemented | COST |
| serials.count | serials | inventory.view | implemented_unverified | STOCK |
| serials.in_stock | serials | inventory.view | implemented_unverified | STOCK |
| serials.under_warranty | serials | inventory.view | implemented_unverified | STOCK |
| serials.warranty_expiring | serials | inventory.view | implemented_unverified | STOCK |
| serials.returned | serials | inventory.view | implemented_unverified | STOCK |
| variants.count | variants | inventory.view | implemented_unverified | STOCK |
| variants.top_variants | variants | inventory.view | implemented_unverified | STOCK |
| variants.slow_variants | variants | inventory.view | implemented_unverified | STOCK |
| variants.out_of_stock | variants | inventory.view | implemented_unverified | STOCK |
| variants.size_colour_mix | variants | inventory.view | implemented_unverified | STOCK |
| barcodes.coverage_pct | barcodes_labels | inventory.view | implemented_unverified | STOCK |
| barcodes.missing_count | barcodes_labels | inventory.view | implemented_unverified | STOCK |
| barcodes.labels_printed | barcodes_labels | inventory.view | unimplemented | STOCK |
| barcodes.scan_share | barcodes_labels | inventory.view | unimplemented | STOCK |
| barcodes.duplicate_count | barcodes_labels | inventory.view | implemented_unverified | STOCK |
| uom.count | units_of_measure | inventory.view | implemented_unverified | STOCK |
| uom.conversion_count | units_of_measure | inventory.view | implemented_unverified | STOCK |
| uom.sales_by_uom | units_of_measure | inventory.view | implemented_unverified | STOCK |
| uom.missing_conversion | units_of_measure | inventory.view | implemented_unverified | STOCK |
| uom.bulk_vs_retail | units_of_measure | inventory.view | implemented_unverified | COST |
| purchases.spend | purchases | purchases.view | verified | BUY |
| purchases.spend_trend | purchases | purchases.view | implemented_unverified | BUY |
| purchases.count | purchases | purchases.view | verified | BUY |
| purchases.unpaid_value | purchases | purchases.view | verified | BUY |
| purchases.overdue_value | purchases | purchases.view | verified | BUY |
| purchases.paid_to_suppliers | purchases | purchases.view | verified | BUY |
| purchases.by_supplier | purchases | purchases.view | implemented_unverified | BUY |
| purchases.by_category | purchases | purchases.view | implemented_unverified | BUY |
| purchases.price_increases | purchases | purchases.view | implemented_unverified | BUY |
| po.open_count | purchase_orders | purchases.view | implemented_unverified | BUY |
| po.open_value | purchase_orders | purchases.view | implemented_unverified | BUY |
| po.pending_receipt_value | purchase_orders | purchases.view | implemented_unverified | BUY |
| po.overdue_count | purchase_orders | purchases.view | implemented_unverified | BUY |
| po.avg_lead_days | purchase_orders | purchases.view | implemented_unverified | BUY |
| po.fill_rate | purchase_orders | purchases.view | implemented_unverified | BUY |
| purchase_returns.count | purchase_returns | purchases.view | implemented_unverified | BUY |
| purchase_returns.value | purchase_returns | purchases.view | implemented_unverified | BUY |
| purchase_returns.credit_due | purchase_returns | purchases.view | implemented_unverified | BUY |
| purchase_returns.by_supplier | purchase_returns | purchases.view | implemented_unverified | BUY |
| purchase_returns.rate | purchase_returns | purchases.view | implemented_unverified | BUY |
| landed.total | landed_cost | purchases.view | unimplemented | BUY |
| landed.pct_of_goods | landed_cost | purchases.view | unimplemented | BUY |
| landed.by_type | landed_cost | purchases.view | unimplemented | BUY |
| landed.true_cost_gap | landed_cost | purchases.view | unimplemented | BUY |
| landed.trend | landed_cost | purchases.view | unimplemented | BUY |
| cookbook.recipe_count | cookbook | inventory.view | unimplemented | STOCK |
| cookbook.recipe_cost_pct | cookbook | inventory.view | unimplemented | COST |
| cookbook.best_margin | cookbook | inventory.view | unimplemented | PROFIT |
| cookbook.worst_margin | cookbook | inventory.view | unimplemented | PROFIT |
| cookbook.ingredient_cost_trend | cookbook | inventory.view | unimplemented | COST |
| cookbook.wastage_value | cookbook | inventory.view | unimplemented | COST |
| production.run_count | production_runs | inventory.view | implemented_unverified | STOCK |
| production.total_cost | production_runs | inventory.view | implemented_unverified | COST |
| production.output_qty | production_runs | inventory.view | implemented_unverified | STOCK |
| production.cost_per_unit | production_runs | inventory.view | implemented_unverified | COST |
| production.yield_pct | production_runs | inventory.view | implemented_unverified | STOCK |
| production.wastage_value | production_runs | inventory.view | implemented_unverified | COST |
| production.in_progress | production_runs | inventory.view | implemented_unverified | STOCK |
| production.output_trend | production_runs | inventory.view | implemented_unverified | STOCK |
| composite.count | composite_items | inventory.view | implemented_unverified | STOCK |
| composite.revenue | composite_items | inventory.view | implemented_unverified | COST |
| composite.margin | composite_items | inventory.view | implemented_unverified | PROFIT |
| composite.top_bundles | composite_items | inventory.view | implemented_unverified | STOCK |
| composite.component_shortage | composite_items | inventory.view | implemented_unverified | STOCK |
| khata.receivable_total | khata_credit | finance.balances, sales.view | verified | FIN |
| khata.payable_total | khata_credit | finance.balances, sales.view | verified | FIN |
| khata.net_position | khata_credit | finance.balances, sales.view | verified | FIN |
| khata.biggest_debtors | khata_credit | finance.balances, sales.view | implemented_unverified | FIN |
| khata.overdue_total | khata_credit | finance.balances, sales.view | implemented_unverified | FIN |
| khata.aging | khata_credit | finance.balances, sales.view | implemented_unverified | FIN |
| khata.collected | khata_credit | finance.balances, sales.view | verified | FIN |
| khata.collection_trend | khata_credit | finance.balances, sales.view | implemented_unverified | FIN |
| khata.over_limit | khata_credit | finance.balances, sales.view | implemented_unverified | FIN |
| payments.received | payments | finance.balances, reports.financial | verified | FIN |
| payments.received_trend | payments | finance.balances, reports.financial | implemented_unverified | FIN |
| payments.paid | payments | finance.balances, reports.financial | verified | FIN |
| payments.net_flow | payments | finance.balances, reports.financial | verified | FIN |
| payments.by_method | payments | finance.balances, reports.financial | implemented_unverified | FIN |
| payments.cash_vs_digital | payments | finance.balances, reports.financial | implemented_unverified | FIN |
| payments.unallocated | payments | finance.balances, reports.financial | implemented_unverified | FIN |
| payments.bounced | payments | finance.balances, reports.financial | implemented_unverified | FIN |
| expenses.count | expenses | finance.expenses, reports.financial | verified | FIN |
| expenses.trend | expenses | finance.expenses, reports.financial | implemented_unverified | FIN |
| expenses.by_category | expenses | finance.expenses, reports.financial | verified | FIN |
| expenses.top_categories | expenses | finance.expenses, reports.financial | implemented_unverified | FIN |
| expenses.unpaid | expenses | finance.expenses, reports.financial | verified | FIN |
| expenses.largest | expenses | finance.expenses, reports.financial | implemented_unverified | FIN |
| expenses.recurring_total | expenses | finance.expenses, reports.financial | unimplemented | FIN |
| expenses.per_day | expenses | finance.expenses, reports.financial | implemented_unverified | FIN |
| expenses.vs_prev | expenses | finance.expenses, reports.financial | implemented_unverified | FIN |
| register.open_count | cash_register | finance.balances, reports.financial | unimplemented | FIN |
| register.cash_in_drawer | cash_register | finance.balances, reports.financial | unimplemented | FIN |
| register.cash_sales | cash_register | finance.balances, reports.financial | unimplemented | FIN |
| register.expected_vs_actual | cash_register | finance.balances, reports.financial | unimplemented | FIN |
| register.variance_total | cash_register | finance.balances, reports.financial | unimplemented | FIN |
| register.by_staff | cash_register | finance.balances, reports.financial | unimplemented | FIN |
| register.shift_count | cash_register | finance.balances, reports.financial | unimplemented | FIN |
| bank.account_count | bank_accounts | finance.balances, reports.financial | implemented_unverified | FIN |
| bank.balances_total | bank_accounts | finance.balances, reports.financial | verified | FIN |
| bank.balance_trend | bank_accounts | finance.balances, reports.financial | implemented_unverified | FIN |
| bank.balance_by_account | bank_accounts | finance.balances, reports.financial | implemented_unverified | FIN |
| bank.top_account | bank_accounts | finance.balances, reports.financial | implemented_unverified | FIN |
| bank.money_in | bank_accounts | finance.balances, reports.financial | verified | FIN |
| bank.money_out | bank_accounts | finance.balances, reports.financial | verified | FIN |
| bank.cash_vs_bank | bank_accounts | finance.balances, reports.financial | implemented_unverified | FIN |
| bank.idle_accounts | bank_accounts | finance.balances, reports.financial | implemented_unverified | FIN |
| recon.unreconciled_count | bank_reconciliation | finance.balances, reports.financial | unimplemented | FIN |
| recon.unreconciled_value | bank_reconciliation | finance.balances, reports.financial | unimplemented | FIN |
| recon.matched_pct | bank_reconciliation | finance.balances, reports.financial | unimplemented | FIN |
| recon.last_recon_days | bank_reconciliation | finance.balances, reports.financial | unimplemented | FIN |
| recon.difference | bank_reconciliation | finance.balances, reports.financial | unimplemented | FIN |
| accounting.trial_balance_ok | accounting_workspace | finance.balances, reports.financial | verified | FIN |
| accounting.assets_total | accounting_workspace | finance.balances, reports.financial | verified | FIN |
| accounting.liabilities_total | accounting_workspace | finance.balances, reports.financial | verified | FIN |
| accounting.equity_total | accounting_workspace | finance.balances, reports.financial | verified | FIN |
| accounting.equity_trend | accounting_workspace | finance.balances, reports.financial | implemented_unverified | FIN |
| accounting.pnl_summary | accounting_workspace | finance.balances, reports.financial | implemented_unverified | PROFIT |
| accounting.balance_sheet | accounting_workspace | finance.balances, reports.financial | implemented_unverified | FIN |
| accounting.unposted_count | accounting_workspace | finance.balances, reports.financial | implemented_unverified | FIN |
| accounting.drawings | accounting_workspace | finance.balances, reports.financial | implemented_unverified | FIN |
| tax.collected | tax_compliance | finance.balances, reports.financial | verified | FIN |
| tax.paid | tax_compliance | finance.balances, reports.financial | verified | FIN |
| tax.net_liability | tax_compliance | finance.balances, reports.financial | verified | FIN |
| tax.liability_trend | tax_compliance | finance.balances, reports.financial | implemented_unverified | FIN |
| tax.by_rate | tax_compliance | finance.balances, reports.financial | verified | FIN |
| tax.taxable_vs_exempt | tax_compliance | finance.balances, reports.financial | implemented_unverified | FIN |
| tax.filing_due | tax_compliance | finance.balances, reports.financial | unimplemented | FIN |
| tax.invoices_missing_tax | tax_compliance | finance.balances, reports.financial | implemented_unverified | FIN |
| assets.count | fixed_assets | reports.summary | unimplemented | FIN |
| assets.gross_value | fixed_assets | reports.summary | implemented_unverified | FIN |
| assets.net_book_value | fixed_assets | reports.summary | unimplemented | FIN |
| assets.depreciation_period | fixed_assets | reports.summary | unimplemented | FIN |
| assets.by_category | fixed_assets | reports.summary | unimplemented | FIN |
| assets.warranty_amc_due | fixed_assets | reports.summary | unimplemented | FIN |
| loans.count | loans | finance.balances, reports.financial | unimplemented | FIN |
| loans.outstanding_total | loans | finance.balances, reports.financial | implemented_unverified | FIN |
| loans.outstanding_trend | loans | finance.balances, reports.financial | implemented_unverified | FIN |
| loans.emi_due | loans | finance.balances, reports.financial | unimplemented | FIN |
| loans.interest_paid | loans | finance.balances, reports.financial | unimplemented | FIN |
| loans.by_lender | loans | finance.balances, reports.financial | unimplemented | FIN |
| reports.pnl_shortcut | reports | reports.summary | implemented_unverified | FIN |
| reports.sales_shortcut | reports | reports.summary | implemented_unverified | FIN |
| reports.stock_shortcut | reports | reports.summary | implemented_unverified | FIN |
| reports.saved_count | reports | reports.summary | unimplemented | OPERATIONS |
| reports.most_used | reports | reports.summary | unimplemented | OPERATIONS |
| reports.scheduled_count | reports | reports.summary | unimplemented | OPERATIONS |
| ai.top_insight | ai_insights | reports.summary | implemented_unverified | OPERATIONS |
| ai.alerts_open | ai_insights | reports.summary | implemented_unverified | OPERATIONS |
| ai.anomalies | ai_insights | reports.summary | implemented_unverified | OPERATIONS |
| ai.forecast_revenue | ai_insights | reports.summary | implemented_unverified | FIN |
| ai.forecast_cash | ai_insights | reports.summary | implemented_unverified | FIN |
| ai.reorder_suggestions | ai_insights | reports.summary | implemented_unverified | OPERATIONS |
| loyalty.member_count | loyalty_gift | reports.summary | implemented_unverified | OPERATIONS |
| loyalty.new_members | loyalty_gift | reports.summary | implemented_unverified | OPERATIONS |
| loyalty.member_revenue_share | loyalty_gift | reports.summary | implemented_unverified | OPERATIONS |
| loyalty.member_avg_spend | loyalty_gift | reports.summary | implemented_unverified | FIN |
| loyalty.liability | loyalty_gift | reports.summary | implemented_unverified | FIN |
| loyalty.gift_card_balance | loyalty_gift | reports.summary | implemented_unverified | FIN |
| marketplace.channel_count | marketplace_sync | reports.summary | implemented_unverified | OPERATIONS |
| marketplace.revenue_by_channel | marketplace_sync | reports.summary | unimplemented | FIN |
| marketplace.online_vs_offline | marketplace_sync | reports.summary | unimplemented | FIN |
| marketplace.sync_errors | marketplace_sync | reports.summary | implemented_unverified | OPERATIONS |
| marketplace.stock_mismatch | marketplace_sync | reports.summary | implemented_unverified | OPERATIONS |
| marketplace.channel_margin | marketplace_sync | reports.summary | unimplemented | PROFIT |
| staff.member_count | staff_attendance | admin.staff_view | verified | PEOPLE |
| staff.on_shift_count | staff_attendance | admin.staff_view | implemented_unverified | PEOPLE |
| staff.present_today | staff_attendance | admin.staff_view | implemented_unverified | PEOPLE |
| staff.absent_today | staff_attendance | admin.staff_view | implemented_unverified | PEOPLE |
| staff.hours_worked | staff_attendance | admin.staff_view | implemented_unverified | PEOPLE |
| staff.attendance_rate | staff_attendance | admin.staff_view | implemented_unverified | PEOPLE |
| staff.sales_by_staff | staff_attendance | admin.staff_view | implemented_unverified | PEOPLE |
| staff.revenue_per_staff | staff_attendance | admin.staff_view | implemented_unverified | PEOPLE |

Inventory count: 349. Source SHA-256: 4FC024F1AB6F10568DF4FFC35B6756A99D8E95F03381235DC71027D5BD4C02A5.

# Phase 1: consolidated code audit and repair contract

Date: 24 September 2026. Status: HOLD — implementation defects confirmed.

Working tree: `E:/AMD POS/AMD POS/app-code/main-app`.

This replaces the piecemeal repair prompts and unsupported READY claims, not the agreed product scope in documents 29 and 30. Read those two documents with this contract. Document 31 remains the deferred chequebook/calculator plan. Do not implement that next release until these gates pass.

## What was actually audited

Source inspection covered the approval engine/state machine/policy resolver; the live payment, invoice, expense, purchase, purchase receive, return, debit-note, fund and V3 transfer controllers; their adapters and posting services; settings and staff endpoints; correction screens; dashboard entry routing, presets, approval sources/resolvers, and inbox/detail controllers. Existing workflow tests were inspected for whether they exercise the real route or call the engine directly.

Read-only PHP probes using the installed dependencies confirmed:

- Capital injection input from the real form (`account_type=bank`, bank ID, amount, date) normalizes to **`payment_method=cash`** in the approval adapter.
- The aging expression `$now->diffInHours($createdAt)` returns **-72** for an item 72 hours old with the installed Carbon version. It therefore enters the `<24h` bucket.
- Actual cashier presets include only `approval.my_pending` and `approval.my_returned`; owner presets include only `approval.awaiting_review`. The four new history cards are not added to those presets.

No full test suite or customer browser walkthrough was rerun during this audit. No application code was changed by the audit. Source-confirmed defects below are not represented as runtime reproductions. Existing reported test counts are not acceptance evidence for these defects. The accompanying evidence JSON records source hashes so a later implementer can detect a changed tree.

## Why the earlier cycles did not finish the work

1. The implementation was organized around adapter classes, while customers use multiple routes and different payload shapes for the same action.
2. Direct and approved paths implement separate financial behavior. A successful adapter test does not prove preservation of payment history, bank balances, dates, tax, settlement or stock effects.
3. Several tests call `engine->submit()` with adapter-shaped payloads, bypassing the real form, route middleware, normalization and policy decision. For example, the purchase, return and transfer demos in `OwnerEmployeeWalkthroughTest.php` do this.
4. Reports labeled permission-array, adapter-registration and invalid-input tests as full posting workflow coverage. They also mixed historical suite numbers with later targeted runs.
5. Reviews, including the previous Codex reviews, were incremental rather than a complete integration review. A literal route-string search also previously missed routes composed from group prefixes; route existence must be read from Laravel's resolved route collection.

The remedy is one shared command/authorization/posting contract per operation, tested at every live entry point. Do not fix this by adding more status prose or weakening assertions.

## Fixed customer scope

The 14 groups are: customer receipt; customer refund; supplier payment; supplier refund; administrative sales invoice; purchase/bill posting; sales return and refund/credit; purchase return and refund/credit; operating expense; capital injection; owner drawing; cash-to-bank; bank-to-cash; bank-to-bank/other already-supported internal transfer.

Ordinary server-verified POS checkout remains immediate by default. Standalone journals, payroll, unrelated inventory operations and the later backlog are not substitutes for these groups. The 23 money-movement catalogue must be grounded in actual product kinds; do not force fourteen operation groups plus backlog headings to equal twenty-three unique kinds.

## R01 — P0: administrative sales can impersonate trusted POS

Evidence: `app/Http/Controllers/SaleController.php`, around line 370, accepts `$request->input('source') === 'pos'` in `$isTrustedPos`. `app/Http/Controllers/V3/SaleController.php`, around lines 74–75, accepts a Referer containing `/pos`. Both also treat any open shift as sufficient even for an administrative invoice. No independent verified POS operation is required by those expressions.

Impact: a required administrative invoice can post immediately through client-controlled metadata. A verified discount/below-cost manager PIN is also not automatically authorization to skip administrative document approval.

Repair: derive the POS exemption from an explicit server-controlled checkout context plus the correct active tenant/register/shift/cashier permissions. Do not trust source, Referer, caller-supplied approved_by, or the mere existence of a shift. Keep genuine checkout immediate. Share the check between legacy and V3 entry points.

Acceptance: required admin invoices stay pending with forged source/Referer, while the same cashier's genuine checkout works. Include admin invoices created while the cashier has an open shift.

## R02 — P0: live posting and mutation paths skip approval

Confirmed paths:

- `V3/BankTransferController::store` posts immediately with `AccountingService::createEntry`; route `bank-transfers` in the V3 group uses `finance.send_payment` instead of `finance.internal_transfer` (`routes/web.php`, around line 2436).
- `DebitNoteController::store` accepts caller-selected `status=approved`, creates the debit note, can move stock, and posts the liability adjustment without approval interception. A status column in `debit_notes` is not the separate pending approval store.
- `SaleController::update`, `cancel`, `destroy`/`bulkDestroy` and `deleteSale` modify or reverse financial/stock effects without applying the approval policy.
- `V3/PurchaseController::update` recalculates purchases directly; `destroy` uses an owner/admin guard rather than approval policy (strict owner mode must also be accounted for).
- `ExpenseController::update` and `destroy` reverse/repost immediately. `quickAdd` also posts directly; determine whether it is reachable before classifying it as a live route.
- `DebitNoteController::update` changes posted note data without the Phase 1 approval command path.

Repair: maintain a resolved route-to-command inventory, including legacy and V3 aliases, receive, return, edit, cancel, delete, bulk and refund paths. Apply policy before any financial or stock write. Reuse the canonical command for direct and approved execution. For a mutation not implemented in Phase 1, reject it before changes when approval is required and explain why in the UI; do not silently allow it. Do not unnecessarily remove direct behavior when policy permits it.

Acceptance: HTTP tests for every live entry point under required mode demonstrate zero financial/stock/allocation effects before approval, or an explicit safe rejection. Transfer permission alone must suffice for transfers; supplier-payment permission alone must not grant transfers.

## R03 — P0: approval settings governance is not enforced by the live settings writer

Evidence: `AdminController::updateSettings` (around line 408) merges flat/nested arbitrary settings and persists every key. Its routes use `admin.settings_manage`; no approval-specific owner/admin or `approvals.configure` check is present there. `approvals.configure` exists in config/UI but is not used by the actual application writers found in this audit. The narrower validation in `SettingsController::update` does not protect the routes pointing at AdminController.

Repair: use a single validated approval-settings writer. Enforce the confirmed owner/admin-only governance rule on every endpoint, including generic settings endpoints and employee override endpoints. Check `approvals.configure` consistently with that rule; a franchise admin or custom grant must not bypass the confirmed role restriction. Reject arbitrary injected `approval_user_*` and unsupported policy keys from generic settings requests. Persist changes atomically with actor, tenant, old/new values and timestamp. Do not rely on hiding controls.

Acceptance: a user with settings-management permission but without authorized approval governance cannot disable approval, alter thresholds, strict mode or another user's policy by flat, nested or crafted requests. Existing unrelated settings management still works.

## R04 — P1: policy settings disagree with the resolver

Evidence: `Settings/SettingsPanel.jsx` sends `disabled` for “Disabled (Direct)”; `ApprovalPolicyResolver` only recognizes `direct`, `required` and inheritance. `SettingsController` validates disabled/threshold rather than direct. Resolver missing-setting fallback enables approval and falls through to required defaults for several roles, while the UI treats a missing master setting as OFF. Strict owner mode skips the early owner-direct return but can still reach a later direct result, so it does not by itself reliably send owner work for review.

Repair: implement the exact document-29 decision table once and use it for backend and effective-behavior UI. Normalize/migrate existing disabled/threshold values without losing deliberate policies. Missing settings for new stores/actions must mean direct, as agreed. OFF always wins; pending submissions remain pending; when ON employee-by-action override precedes action policy, global employee mode is fallback, and an enabled threshold can still require approval. Implement explicit owner requirements and strict owner separation consistently. Explain the threshold exception in the direct-mode UI.

Acceptance: table-driven tests use actual settings HTTP values and cover missing settings, OFF, ON, owner strict, action direct/required, per-user action override, global employee fallback and thresholds. A control labeled Direct must do what it says.

## R05 — P1: fund form payloads do not match approval adapters

Evidence: `FundController::addFunds/removeFunds` use `account_type`, while capital/drawings adapters read `payment_method` and default to cash. `FundController::transfer` uses `from_bank_id/to_bank_id`, while `FundTransferApprovalAdapter` requires `from_bank_account_id/to_bank_account_id`. V3 fund input uses `transaction_date` and `description`; adapters discard these in favor of other fields/default date. A read-only probe reproduced the bank-to-cash normalization defect.

Repair: normalize actual form payloads into an explicit canonical command before policy resolution and storage. Preserve selected accounts, transaction date, reason, notes and direction. Reject invalid/ambiguous account references instead of silently substituting cash or a default bank. Apply the same normalization on correction/resubmission.

Acceptance: HTTP submissions from the actual fund form work in all three transfer directions and both capital/drawing account types. Compare normalized pending payload to the submitted operation; approve and verify the exact bank/cash account and date.

## R06 — P1: approved receipts and fund movements disappear from operational balances/history

Evidence: legacy `PaymentController` creates a `Payment`, whereas customer/supplier approval posting services create a journal and allocations but no `Payment`. Direct `FundController` creates `FundTransaction` and activity rows, while capital/drawing/transfer adapters create only journals. `BankAccount::v3Balance()` explicitly reads `payments`, `expenses` and `fund_transactions` for non-cash bank balances. Thus an approved movement can change the GL while leaving that bank balance/history unchanged. Fund adapters also omit the insufficient-balance checks performed by direct transfer/drawing paths. V3 direct drawings use account 3000 while the drawing adapter uses 3100.

Repair: consolidate direct and approved posting in shared services that preserve the business records consumed by existing screens and balances. Do not create a second journal when adding history records. Choose and document the consistent existing chart treatment for drawings; do not let approval mode change it. Lock/revalidate source balances and create both transfer legs and history atomically. Preserve maker versus reviewer attribution.

Acceptance: compare equivalent direct and approved operations across GL lines, selected bank balances, Payment/FundTransaction history, allocations, badges, timestamps and actor fields. Test insufficient funds and two concurrent withdrawals/transfers. A balanced journal alone is not sufficient.

## R07 — P1: invoice, purchase and expense approval loses financial payload fields

Evidence:

- `SalesInvoiceApprovalAdapter` reads `paid_amount`, but the legacy form uses `amount_paid` and V3 uses `amount_received`. Its `post()` does not forward normalized header discount/tax totals and drops several legacy charge, date, payment-account and line fields. Direct legacy posting has different monetary behavior.
- Legacy sales create ad-hoc products inside a transaction, then roll it back before approval submission while passing the generated IDs. V3 creates ad-hoc products before the approval branch. These paths need deliberate shared handling.
- `PurchasePostingApprovalAdapter` drops `payment_account_id`, `round_off`, `extras`, reference/acknowledgement fields and forces `workflow_status=received`. The real request accepts a Supplier ID or Party ID, while adapter validation accepts only a supplier Party. Preserve draft/receive semantics without violating pending isolation.
- `OperatingExpenseApprovalAdapter` drops items, payee/party, partial `amount_paid`, attachment and service-job fields. `ExpensePostingService` always pays the entire amount plus tax; the direct legacy path honors partial payment and posts the unpaid balance to AP.

Repair: reuse canonical normalization/calculation and posting behavior rather than maintaining lossy independent allowlists. All financially meaningful fields supported by an included form must survive approval/correction. Validate them server-side. Handle ad-hoc lines without references to rolled-back products or premature operational effects.

Acceptance: direct-versus-approved parity fixtures for partially paid invoices/expenses, discounts, taxes, extra/landed costs, selected accounts/warehouses, backdated dates, Supplier/Party identity, variants/UOM and ad-hoc lines. Assert resulting amounts and balances, not just row existence.

## R08 — P1: approved purchase returns drop a required date

Evidence: `PurchaseReturnApprovalAdapter::validatePayload` returns only purchase_id/items/reason, and `post` passes only items/reason to `Engines/PurchaseService::createReturn`. That service reads `$data['return_date']` for both journal and return record (around lines 616 and 627). The live V3 return route requires the date. Current adapter/permission tests do not exercise this successful HTTP-to-approval posting path.

Repair: preserve and validate return_date and the complete canonical return command. Revalidate item/batch ownership and remaining quantities under lock at execution, not merely at submission.

Acceptance: a real purchase-return HTTP request goes pending with no stock/AP changes, then approves using its original date, exact batches, tax/credit and quantity effects. Include a competing return after submission.

## R09 — P0/P1: policy thresholds and review amounts can be wrong

Evidence: `V3/SaleReturnController` hardcodes `$returnAmount = 0`. `V3/PurchaseController::store` reads total/grand_total from validated data, but `StorePurchaseRequest` does not define either field, making the amount zero. Legacy expense policy uses the pre-tax amount while V3 uses total paid. `ApprovalDocumentController::resubmit` and the state machine accept a separate client-supplied updatedAmount without reconciling it to the normalized payload.

Repair: calculate canonical totals server-side before the policy decision and store that same total in the approval document. Recompute on every correction. Define gross/net policy basis consistently; never allow zero estimates or fabricated display amounts to bypass a threshold. Reviewers must see the amount that will actually post.

Acceptance: below/at/above-threshold tests through purchase and return HTTP routes; modified total fields cannot affect policy; resubmit amount=1 with payload amount=1000 is rejected or normalized to 1000. Include tax and charges.

## R10 — P0: business authorization is incomplete inside the approval boundary

Evidence: `ApprovalExecutionEngine::submit/resubmit` validates payload but not maker business permissions; approval revalidates adapters using the reviewer without rechecking maker membership/permissions. `SalesReturnApprovalAdapter` says sales authority AND customer-refund authority are required, but the interface and engine implement an OR over `reviewerEligibilityPermissions()`. `sales.edit` alone therefore satisfies that adapter's business check. Types with multiple actions also use coarse OR eligibility.

Repair: centralize action-aware maker and reviewer authorization. Require active tenant membership and applicable permissions at submission/resubmission and recheck the maker at posting, per document 29. Distinguish all-of and any-of conditions explicitly. Returns with a cash refund need the separate refund grant; credit-only returns follow the agreed return authority. Ensure direct routes enforce the same financial direction permissions. Do not expand locked default role grants to make tests pass.

Acceptance: reviewer with only sales.edit cannot approve a cash refund; return-only roles cannot gain refund authority; suspended/removed/revoked makers cannot have documents silently posted; another tenant cannot view/submit/decide. Exercise actual endpoints plus shared services.

## R11 — P1: revalidation, idempotency and resubmission races remain

Evidence: `ApprovalStateMachine::resubmit` checks the previously loaded status/version outside its transaction and does not reload with lockForUpdate, unlike return/reject/withdraw. `submitNew` returns any same-tenant document matching an idempotency key without comparing maker/type/payload. Supplier refund revalidation checks debit-note status without locking that note and permits a positive payload amount unrelated to the note amount; distinct approval documents can compete over the same business resource. Fund revalidation checks positive amount/account existence but not available balances.

Repair: lock and recheck version/status inside every transition transaction; implement stable submission identity and payload-conflict handling with the database uniqueness constraint; replay must not return another maker/type's document. Lock source resources as well as approval documents and enforce remaining refundable/returnable/available amounts. Preserve immutable revisions and rollback all effects on posting failure.

Acceptance: real overlapping resubmit/withdraw/approve tests; concurrent submissions and retries; same key with different maker/type/payload; two distinct pending refunds against one debit note; two withdrawals against one available balance. Sequential second-click tests are not proof of race safety.

## R12 — P1: correction and pending UI is incomplete

Evidence: `Approvals/Show.jsx::getOriginalEditorUrl` only covers the original four types. Receipt/payment links point to V3 POST endpoints rather than the actual GET editors; the sales link points to a list. New types fall back to a generic amount-only dialog. Most new forms have no approval_correction integration. Payment In/Out ignores the 202 body and navigates to posted payment history, and other forms need pending-response handling checked.

Repair: provide server-generated, verified correction URLs/forms for every included command and payload variant. Load the immutable current revision, reasons, notes and expected version, allow the original maker to correct all supported fields, and resubmit the same document. Do not reduce a purchase/return to editing only a total. Display pending reference and link to submissions instead of claiming completion/payment/printable posting. Show effective behavior and owner settings access on included pages.

Acceptance: browser tests or an explicitly recorded real-browser walkthrough for each distinct editor family, including receipt, purchase/receive, sale return, purchase return, supplier refund, expense and funds. Test returned correction, notes/presets, changed quantities/account/date, stale revision and final posting. HTTP tests remain necessary but are not a browser demonstration.

## R13 — P1: owner controls during invitation and their audit trail are incomplete

Evidence: `StaffInvitationController::store` does not validate or save transaction_approval_mode/overrides; its membership creation in approve does not carry these values over. `AdminController::updateMember` writes per-action settings outside a shared atomic settings/audit writer. Only global-mode last-changed actor/time are recorded there, not an immutable old/new change history for all policy changes.

Repair: wire the actual invitation UI and every invitation acceptance/approval path, as well as staff editing, into the same policy model. Save and apply global/per-action defaults as configured by the owner. Validate all override keys/values instead of silently ignoring malformed settings. Audit changes atomically and prevent self-escalation. Use document-30 role defaults unchanged.

Acceptance: invite an employee with chosen mode/overrides, accept/approve membership, log in as that employee and verify effective behavior. Verify setting edits retain existing pending work and record old/new values and actor.

## R14 — P1: dashboard presence is not dashboard delivery

Evidence: default `DashboardController::index` still sends cashier/accountant/purchasing_officer/viewer to legacy dashboards. The four new history cards exist but are not in `dashboard_pool.php` presets. The approval inbox unconditionally queries pending status, so reviewer history drill-down cannot work; it does not apply the same business eligibility filter as cards. `show` calculates canApprove without adapter business eligibility. Source and resolver implementations differ in period handling, and multiple resolvers catch any error and report successful zero. The signed aging expression puts older work in the youngest bucket (runtime probe confirmed).

Repair: deliver the agreed role-scoped V6 experience on the actual landing path, with permission-safe presets and saved-layout compatibility; do not expose unrelated aggregate cards to make this work. Provide the eight requested readings, with current queues and period history clearly labeled. Share eligibility/filter semantics among cards, inbox, details and decisions. Implement reviewer decision history with actor/time filters and real filtered links. Correct aging calculation, preserve errors as unavailable rather than false zeros, and keep tenant/user/effective-policy cache separation and invalidation.

Acceptance: log in as owner, reviewer, cashier, purchasing officer and a custom user; see appropriate cards on the actual dashboard and follow each link to matching records. Include items 1/30/72 hours old, a returned item later resubmitted, two reviewers, two tenants, a policy/permission change and a simulated query failure.

## R15 — P1: separate refund coverage is overstated

Evidence: generic PaymentController supports supplier money-in and customer money-out in direct mode but rejects them when approval is required, directing users to debit notes or sales returns. TYPE_CUSTOMER_REFUND is excluded on the blanket claim that any standalone refund would double-post. Document 29 explicitly says separate subsequent refunds remain separately controlled. A payment of an already-existing credit is not necessarily a second stock return.

Repair: distinguish one atomic return-with-refund from a later standalone settlement of an existing customer/supplier credit. Support required approval for the included refund behavior without redoing stock/revenue effects. Reuse/reference the existing credit/return and cap outstanding refundable amounts. Keep advances/deposits that truly belong to deferred scope clearly identified; do not silently describe a blocked basic refund as fully implemented.

Acceptance: return with immediate refund posts once; return to credit followed by a later refund posts only the remaining cash/credit settlement; repeated/concurrent refund cannot exceed credit. Check the dedicated refund permissions in both direct and required modes.

## One implementation sequence

Complete these as one repair effort; do not run the full suite after every adapter:

1. Establish canonical command payload, totals, authorization, policy and posting contracts (R03–R11). Preserve current schema/data and existing supported semantics.
2. Connect every live entry/mutation route and remove client-controlled exemptions (R01–R02, R15). Keep the route inventory updated from the resolved route collection, including group prefixes and middleware.
3. Finish correction/pending UI, staff controls and actual role dashboard delivery (R12–R14).
4. Add/run focused regression tests while fixing each root cause. Keep one mapping of finding → changed files → real test cases → result. Do not mark a finding closed from an adapter-registration or config-array assertion.
5. Once code and test registry are stable, run the required backend suite, frontend suite and production build. Use one exclusive runner per disposable database. Reuse unchanged frontend/build evidence only if its source hash still matches. Do not mix concurrently running PHP suites against the same database.
6. Perform the actual browser acceptance flows and record what was exercised, rather than renaming backend tests “UI walkthrough.” If browser access is unavailable, state that precise remaining verification blocker.

## Required evidence and completion rule

Create a durable `phase1-route-coverage.json` or equivalent table derived from the resolved Laravel routes. For each of the fourteen groups list ALL live entry points, permission(s), canonical command, direct/pending/post behavior, editor and concrete tests. Route aliases may share a posting parity test but need their own boundary coverage. Unreachable helpers must be marked unreachable, not counted as completed customer flows.

For every successful workflow assert operational parity: GL, source tables/history, selected account balances, stock/batches, allocation/outstanding balances, dates, actor attribution, and pending isolation. Include correction, revocation, forged POS fields, thresholds and retries/concurrency. Cover all three transfer directions separately.

Save full output and complete JUnit results with command, exit code, timestamp, database identity, source/test hashes and counts. Await completion before reporting. Compare residual failures by actual test identity and failure cause against baseline evidence; do not invent test names or declare all failures “pre-existing.” Resolve Phase 1 failures and new regressions; document unrelated remaining failures and customer impact. Do not fix failures by removing assertions or broadening permissions.

READY means R01–R15 are closed with evidence, all fourteen agreed groups and their real routes are accounted for, relevant tests/build pass, no Phase 1/new regression remains, and the actual owner/employee browser flows pass. It does not require another arbitrary approval from the user merely to label the evidence. HOLD must name the specific unresolved technical or verification blocker.

Preserve other developers' uncommitted work. Do not reset the repository, run destructive migrations against non-disposable databases, commit, push or deploy. Do not begin chequebook/calculator implementation yet. Deliver one final repair/evidence report referring to this contract, not another unsupported READY narrative.

# Customer-first approval release scope

Read `30-permissions-first-customer-release.md` alongside this scope. It defines permission-first enforcement, owner/admin defaults for sensitive funds, and prerequisite permission repairs. Approval never grants business access.

Date: 23 September 2026. Planning update only; no application implementation authorized by this document alone.

This is the current scope decision, superseding document 25's all-at-once implementation requirement and earlier handoff prompts. Document 24 remains historical evidence for the old implementation, not acceptance of this expanded release. Preserve its results; do not rewrite history to imply the new scope was tested.

## Existing foundation

Code inspection confirms four supported approval document types: customer_receipt, supplier_payment, sales_invoice, operating_expense. Existing workflow components include submissions, immutable revisions, approval execution, return/correction, and policy settings. These are a foundation, not proof that every route for those business operations is intercepted. Preserve existing V6/dashboard work and verify affected permissions and scopes for the release.

Document 24 reports 6,340 backend cases, 98 new cases, zero regressions and 93 shared failures. These results were not independently rerun for this scope update. Triage failures that affect this release; a historical comparison pass is not a fully passing suite.

The existing resolver defaults a missing master setting to enabled and permits required document rules/thresholds to override master OFF. This conflicts with the owner's latest requirement and must be corrected in Phase 1. A per-employee global mode exists; the proposed employee-by-action matrix is still required.

## Phase 1: fourteen customer-facing operation groups

1. Customer receipt: money received from a customer.
2. Customer refund: money paid back to a customer.
3. Supplier payment: money paid to a supplier.
4. Supplier refund: money received back from a supplier.
5. Administrative sales invoice; ordinary verified POS checkout remains immediate by default.
6. Purchase/bill posting, including stock and settlement effects created by that operation.
7. Sales return and its applicable refund/credit effects, including alternate POS-return entry points.
8. Purchase return and its applicable refund/credit effects.
9. Operating expenses.
10. Owner capital injection.
11. Owner withdrawal/drawing (recommended paired coverage for capital).
12. Cash-to-bank transfer/deposit.
13. Bank-to-cash transfer/withdrawal.
14. Bank-to-bank or other supported internal account transfer, including cash-location transfer if supported.

These are scope groups, not a promise of fourteen adapters, routes, or remaining tasks. Four have existing approval foundations; ten are additional groups. All fourteen require entry-point verification and may need integration repairs. Capital add/remove legacy and V3 routes must resolve to the same applicable policy. Transfers are one atomic operation covering both legs.

Audit all 23 money-in/out product kinds and map each to Phase 1, an alias of a Phase 1 group, or deferred scope. Do not invent a count or force a merge. Record evidence and any discrepancy. Do not block the release solely on implementing deferred kinds.

For every included group cover applicable alternate routes, modals and service callers, original-editor corrections, and supported edit/void/reverse paths that could bypass the approval decision. Existing supported actions cannot remain a silent bypass; integrate them or explicitly restrict the unsupported mutation with a clear user explanation. A combined return/refund must not double-post or demand two approvals for one atomic command. Separate subsequent refunds remain separately controlled.

## Owner controls required before handoff

- Master OFF means no human approval for future submissions; ordinary permissions and domain validation remain enforced. No hidden threshold or action rule overrides OFF.
- New stores/actions default to direct. Preserve deliberately configured existing policies during migration; explain changed master-OFF semantics.
- Master ON enables per-action direct/required rules and per-employee per-action inherit/required/direct overrides. Employee override precedes action mode. Employee global mode is fallback when inheriting and no explicit action rule exists. Store default is direct.
- Owner default is direct; explicit owner requirements or optional strict separation are opt-in. Resolve owner behavior in the same documented decision table.
- Retain existing amount thresholds with an explicit UI explanation: while ON, an enabled threshold can force approval even for direct mode; disable that threshold to grant unconditional direct posting. OFF always wins.
- Employees cannot change their own rules. Only authorized policy administrators may change rules, and actor/time/old/new values are audited.
- Existing pending submissions stay pending when settings change. Revoked permissions are rechecked before posting.
- Each included page shows effective behavior and an owner settings link. Deferred pages must not claim approval protection. Employee-wide 'required' must state its supported action scope; offer the owner restriction of access to deferred operations instead of implying comprehensive protection.

## Later backlog: eight planning groups

1. Advances, deposits, their application/refund, and order-specific advance flows not already inseparable from included posting.
2. Payroll, employee settlements, loans and repayments.
3. Standalone journals, opening balances, financial adjustments, bounced payments and bad debt beyond necessary Phase 1 reversal paths.
4. Standalone stock adjustments, stocktakes, transfers, write-offs, manufacturing and disassembly.
5. Fixed assets, depreciation, disaster losses and recoveries.
6. Donations, tax-specific operations and fiscal-period close/reopen.
7. Marketplace payouts, automated integrations, bulk imports, offline sync and Smart Capture approval expansion.
8. Register custody/shortage/overage and other money movement kinds left by the 23-kind reconciliation.

These eight groups are a backlog structure, not a verified count of remaining transaction types. Exact remaining kinds = audited unique kinds minus those actually covered in Phase 1. Never calculate 23 minus 14: the fourteen release groups include sales, purchases and returns, while the 23 counts money movement kinds.

## Build and verify

Build the complete Phase 1 scope before the expensive final regression cycle. Write meaningful tests alongside implementation and run narrow checks for shared policy/atomicity behavior as needed. Do not rerun the full suite after each adapter. Reuse valid historical baseline evidence where applicable.

Use isolated disposable databases. Verify pending zero financial/stock/allocation footprint, direct-versus-approved parity, tenant permissions, correction/resubmission, concurrent/retried approval, balance revalidation, all policy combinations, and transfer/return accounting. Test counts follow real coverage; prior 180-330 estimates are not commitments or acceptance quotas.

Before customer handoff: all included routes accounted for; no new failing tests; Phase 1-related existing failures resolved; build/frontend/affected dashboard checks passing; unrelated remaining failures individually documented with impact; full regression evidence for the stable tree; owner and employee demo of receipt, purchase, return, expense, transfer, return-for-correction and master-OFF behavior.

Deliver an included/deferred action matrix, 23-kind reconciliation, implementation report, actual test results and remaining backlog. Preserve uncommitted work. No commit, push or deployment without later instruction. The user is currently reviewing scope before handing implementation to Claude.

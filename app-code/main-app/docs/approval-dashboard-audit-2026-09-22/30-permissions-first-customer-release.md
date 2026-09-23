# Permissions-first customer release and Claude handoff

## Locked seven-key default grants (confirmed 23 September 2026)

| New permission | Owner | Admin | Manager | Accountant | Purchasing officer | Franchise admin | Cashier/viewer/other predefined roles | Custom |
|---|---|---|---|---|---|---|---|---|
| `finance.customer_refund` | Yes | Yes | No | No | No | Yes | No | Explicit checkbox only |
| `finance.supplier_refund` | Yes | Yes | No | No | No | Yes | No | Explicit checkbox only |
| `purchases.returns` | Yes | Yes | Yes | No | Yes | Yes | No | Explicit checkbox only |
| `finance.capital_add` | Yes | Yes | No | No | No | No | No | Explicit checkbox only |
| `finance.owner_drawings` | Yes | Yes | No | No | No | No | No | Explicit checkbox only |
| `finance.internal_transfer` | Yes | Yes | No | No | No | No | No | Explicit checkbox only |
| `approvals.configure` | Yes | Yes | No | No | No | No | No | Explicit checkbox only |

These grants are fixed product decisions. Add only these new defaults; preserve existing grants. In particular, franchise admin gets the three refund/return keys but no sensitive funds or configuration keys; manager and purchasing officer get purchase returns; accountant does not automatically get refunds. Explicit custom delegation remains possible. Confirm that the permission check at each endpoint uses the new exact key and that owner-only policy configuration is enforced server-side. Role preset changes are configuration changes, not a database migration by themselves; add data migrations only where persisted membership data actually requires it.

The 23-kind catalogue must have a real, evidence-backed row for each actual product kind. A row saying “17–23 remaining backlog kinds” is a placeholder, not a completed reconciliation. Avoid counting the same refund twice merely because it is part of a return. If the source product catalogue cannot establish exactly 23 distinct kinds, report the observed count and the unresolved discrepancy; Phase 1 implementation can continue while deferred kinds are explicitly documented.

Planning update, 23 September 2026. Implement only after the user hands this plan to the implementation agent. Read alongside document 29; document 25 is later backlog and shared architecture guidance. Document 24 describes historical verification only.

## Current source findings

- config/permissions.php has 59 distinct configured permission keys and 18 entries: 17 predefined roles including owner, plus custom. This is the configured vocabulary, not proof every route is guarded or every key is exposed in the UI.
- Predefined roles: owner, admin, manager, cashier, accountant, purchasing_officer, viewer, franchise_admin, shift_supervisor, inventory_controller, hr_officer, production_supervisor, kitchen_manager, dispenser, sales_executive, fulfillment_lead, delivery_driver.
- StaffController creation validates 16 non-owner predefined roles. Admin/Users.jsx instead contains nine role entries including inventory_staff and support, which are absent from the backend map. StaffInvitationController has another role validation list. Reconcile create/edit/invite/bulk paths before claiming one consistent role count available to users.
- User::hasPermission gives owner full access; other store roles use inherited configuration or explicit custom permissions. Custom is replacement, not an additive grant; empty custom permissions mean no access. Platform administration is separate from store roles.
- Accountant defaults include receive/send money, expenses and journals: it is not read-only despite stale descriptions. Manager lacks finance permissions but has operational sales/purchase permissions and broad approval permissions. Cashier has checkout and stock view, not administrative sales or general money permissions. Purchasing officer has purchase permissions but no supplier-payment permission by default.
- routes/web.php guards fund add with finance.receive_payment, fund remove/transfer with finance.send_payment, and V3 funds with finance.journal. These do not isolate owner capital from ordinary receipts/payments.
- Legacy payments.store accepts receive OR send permission. CheckPermissions uses OR semantics. Enforce direction and party-specific permission inside the canonical action boundary; route access alone is insufficient.
- Purchase returns currently use purchases.edit; supplier debit-note refund routes also use purchases.edit. Separate return and refund authorities.
- ApprovalExecutionEngine currently includes approvals.inbox among alternative reviewer permissions. Viewing the inbox must not authorize approve/reject/return. Inspect role shortcuts and all mutation paths as part of this repair.

## Product model

Always evaluate business permission first, then approval policy. No permission means denied: cannot post directly, create pending work, resubmit, or use an alternate endpoint. Master approval OFF never bypasses permissions.

Show three plain-language effective states for each employee/action: No access; Allowed directly; Allowed with approval. Underlying permission and approval settings remain separate. If access is absent, disable approval controls with an explanation; never add permission merely because an approval option is selected. Owner may explicitly grant access and then choose approval. Preserve policy history, but revoked access immediately prevents further action; pending work requires current maker permission again before posting.

Owner/admin defaults should keep capital injection, owner drawings, internal cash/bank transfers and policy management away from ordinary employees. These actions remain in Phase 1 because the owner requested them, but no employee role receives them automatically. Allow explicit delegation using distinct permissions and approval settings. Owner posts directly by default; delegated admins and employees follow configured approval rules. Read-only pages and permanently nondelegable administration do not need transaction approval adapters.

## Required granular action permissions

Use existing keys for customer receipts (finance.receive_payment), supplier payments (finance.send_payment), expenses (finance.expenses), sales creation (sales.create), purchases (purchases.create), sales returns (sales.returns and explicitly supported POS return permissions).

Propose separate keys, validated against the full route inventory before naming is finalized:
- finance.customer_refund
- finance.supplier_refund
- purchases.returns
- finance.capital_add
- finance.owner_drawings
- finance.internal_transfer (optionally split cash/bank directions only if actual delegation requires it)
- approvals.configure

Do not treat receipt/payment permission as capital, drawing, transfer, refund, payroll or journal authority. Compound purchase/sale/return commands must declare their permitted settlement effects so an integrated cash payment cannot bypass denied money authority. Define explicit combined-operation permissions where necessary and show this behavior in the employee preview.

Migrate grants deliberately: owners retain access; admins receive the intended administrative defaults; ordinary role presets do not gain sensitive funds permissions. Preserve legitimate historic customer/supplier workflows with an explicit audited mapping and owner-visible explanation. Do not blindly expand every legacy receive/send wildcard into all new capabilities. Review affected custom/wildcard memberships and disclose any restricted legacy behavior; do not silently overwrite unrelated grants.

Use one backend role/permission catalogue to supply all staff forms and validation. Reconcile legacy role names without deleting memberships or granting extra power. Update misleading accountant/cashier descriptions. Report actual preset counts, assignable roles and exposed permission counts after reconciliation.

Approval reviewers require the exact transition permission AND eligibility for the action/tenant. Generic inbox/view permission grants no mutations. Define scoped reviewer authority independently from maker authority, so a designated finance reviewer may review without automatically acquiring creation rights. Managers must not receive financial approval authority merely from a generic approvals key. Prevent unauthorized users from assigning themselves privileges or changing their own approval rules through staff/settings endpoints.

## Phase 1 default role guidance

Preserve legitimate operational defaults: cashier checkout; manager sales/purchases/returns; purchasing officer purchases and explicitly authorized purchase returns; accountant receipts/payments/expenses; viewer read-only. Refunds require explicit appropriate grants. Sensitive capital/drawings/transfers start with owner/admin only. Custom employees may be explicitly delegated any supported delegable action. Other specialist roles retain their current business scope; do not expand them as an incidental consequence of installing approval.

## Verification and delivery

Add tests for every Phase 1 action: no business permission with approval ON and OFF both denied; authorized direct and pending behavior; revoked maker access; custom-empty permissions; inherited role permissions; employee cannot self-escalate; direction/party spoofing; alternate endpoints; compound settlement effects; owner funds isolation; reviewer view-only cannot mutate; reviewer action scope; cross-tenant denial; dashboard/drilldown/export scopes.

Build Phase 1, run focused checks as needed, and run expensive regression verification on the completed stable implementation. Do not rebuild all later backlog actions. Deliver a role-by-action table showing No access/Direct/Approval, route evidence, migration decisions, actual tests and remaining gaps. Keep all existing work; no commit/push/deployment without instruction.

## Prompt to give Claude

Read repository instructions, document 24 for historical evidence, and documents 29 and 30 for current release scope and permission requirements. Document 25 is superseded for release breadth. First reconcile the role/permission catalogue and route/action matrix, then implement the fourteen Phase 1 operation groups with permission-first checks and configurable approval. Default sensitive funds to owner/admin access, allow explicit delegation, and never grant access through an approval setting. Correct broad legacy money permissions and reviewer-view escalation. Preserve existing changes and four-document foundation. Finish Phase 1 UI, correction workflows, migrations, meaningful tests and final verification before reporting completion. Do not run the full suite after each adapter. Do not implement deferred backlog merely to satisfy document 25. Leave a reviewable local diff and accurate reports; no commit, push or deployment.

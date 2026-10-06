# POS staff, paid seats, and shifts

Date: 2026-10-04
Status: implementation plan; no application changes made.
Product direction: agreed in the owner discussion. Recommendations and unresolved decisions are identified below.

## 1. Outcome and terminology

Give each person their own identity and a clear access type. Owners can add either a full staff member or a restricted POS staff member, see remaining capacity before inviting them, and purchase additional capacity when needed.

- **Full staff seat:** a store membership with business permissions assigned by its owner. Includes the owner in the allowance. A full seat does not automatically grant every permission.
- **POS staff seat:** a distinct membership type restricted to POS and three explicitly selected capabilities. Includes waiters, order takers, and cashiers.
- **Register/station:** a checkout device or named cashbox. It is not a person or a permission category. Use “POS staff” in seat pricing and invitations, never “create a register” to mean create a person.
- **Work shift:** the POS person's start/end times.
- **Cash session:** opening cash, attributable cash movements, closing count, and handover associated with a payment-enabled person's work shift.

Riders are a future feature, documented in [FUTURE_IDEAS.md](FUTURE_IDEAS.md). Do not implement rider accounts in this project.

## 2. Pricing and allowances

| Plan | Existing base price/month | Full staff seats, including owner | POS staff seats | Extra full seat/month | Extra POS seat/month |
|---|---:|---:|---:|---:|---:|
| Solo | $0 | 1 | 0 | Upgrade required | Upgrade required |
| Starter | $49 | 1 | 1 | $15 | $5 |
| Core | $99 | 5 | 5 | $15 | $5 |
| Scale | $299 | 25 | 25 | $15 | $5 |

The owner selected the POS allowances and $5 price. Retain the existing proposed $15 full-seat price. Existing base annual prices remain $490/$990/$2,990 unless separately changed. Custom and lifetime contracts need explicit mapping; do not silently overwrite their entitlements.

Recommendation: launch with these prices rather than introducing more packages. This is a product recommendation based on simplicity, not competitor research or a margin forecast. Additional POS users must have the same three-capability boundary regardless of how much spare full-seat capacity exists.

An extra seat purchases reusable capacity, not a permanent licence tied to one email. Removing a staff member makes capacity available; it does not cancel the paid add-on. Show cancellation separately and disclose its effective date. Annual add-on billing, proration, and currency handling need an explicit payment-provider decision before checkout is enabled; do not invent an annual discount in the UI.

Recommendation: remove registers as a separately sold capacity from this new model. Keep named stations for device operation and cash tracking. The owner must confirm retirement/mapping of existing register add-ons before rollout. No implicit conversion from an old device entitlement into a person entitlement.

## 3. Add/invite person experience

Use the same first step for both direct creation and invitation: two selectable cards, **POS staff** and **Full staff seat**.

Each card shows:

- Purpose and access scope.
- A usage bar and text: “3 active + 1 invitation reserved / 6 available seats — 2 remaining” (example).
- A breakdown of included capacity and purchased capacity.
- Add/invite action when capacity is available.
- At capacity: “Buy an extra POS seat — $5/month” or “Buy an extra full seat — $15/month”, plus “Compare plans”. Solo offers upgrade only.

Buying must not automatically invite someone. After confirmed entitlement activation, return to the preserved draft and let the owner submit it. Never expose an enabled purchase action for an unconfigured checkout product.

If POS is not enabled for the business, explain why the POS card is unavailable and offer module setup to an authorized owner. Do not sell a seat that cannot be used. Turning off POS blocks POS access without deleting people or records.

The full-seat flow retains its role/permission editor. The POS flow collects name, personal email, assigned location, and exactly three capability checkboxes. Require at least one capability. Reject arbitrary permissions, wildcard permissions, role overrides, and approval-administration fields in POS requests. Editing a POS account offers the same three choices only.

## 4. POS identity and access

Use the existing User identity and a distinct **store membership access type**, rather than creating a second independent login database. Suggested membership values: `full` and `pos`. A person may be POS staff in one store and full staff in another; permissions and billing remain store-specific.

Every POS person has a unique user ID and their own email/login. Owners invite the person; the person establishes credentials through the existing secure onboarding flow. Optional individual PIN switching is allowed only inside an authenticated, authorized store/station session. PINs are not standalone remote login credentials and are never shared among workers.

After authentication and store selection, POS staff land directly in POS. No business dashboard card is needed. If they have multiple memberships, retain a minimal store chooser. Permit necessary account security, password reset, sign-out, and own-profile functions without exposing the business dashboard.

| Capability | Allowed | Excluded |
|---|---|---|
| Take orders | Browse sellable items, select table/customer as required, create and submit an order, send permitted kitchen instructions | Payments, posted-sale cancellation, arbitrary discounts, price overrides, accounting postings disguised as checkout |
| Take payments | Load eligible orders, collect permitted tender, complete checkout, issue receipt | Payment administration, unrelated customer debt collection, money movement outside assigned cash session |
| Process returns/refunds | Find eligible receipt within assigned scope, select returnable items, process permitted refund subject to existing approvals | Purchase returns, arbitrary credit notes, accounting corrections, unrestricted sales exports |

The three switches are independent. Supporting read access is derived by the server: a returns-only person needs restricted receipt lookup, and a payment-only person needs order lookup. They do not receive broad sales-view permissions simply to support those workflows.

Full staff with appropriate POS permissions can continue using POS. Owners have no personal shift start/end button, as requested. Other full staff also remain outside the mandatory POS-staff work-shift flow in this design; owners can still review staff shifts through authorized management screens.

## 5. Shifts and cash accountability

### Start

POS staff must start their own work shift before performing enabled business actions. Server records authenticated membership, store, assigned location/station, and start time. Logging in alone does not start a shift. One open work shift per person per store; switching devices resumes the existing shift.

- Orders-only staff: Start shift, no opening cash question.
- Payment-enabled staff: choose/confirm assigned cashbox and enter actual opening cash before cash transactions are enabled. Record currency and opening amount; validate nonnegative values and fixed precision.
- Returns-only staff: noncash refunds may operate without a drawer. Cash refunds require an assigned reconciled cash session or manager execution. Never silently allow untracked cash to leave a drawer. This exception must be explicit even though the person cannot take payments.

### During shift

Attribute orders, tenders, refunds, and approved cash movements to the authenticated actor and shift. Do not trust a client-supplied cashier ID. Orders may be created by one person and paid by another: retain both identities; cash belongs to the payment/refund actor's cash session.

Recommendation for the first version: one cash custodian per cashbox at a time. Waiters can take orders concurrently. Multiple payment-enabled staff need separate cashboxes or an explicit reconciled handover. Otherwise individual cash accountability is impossible. Handovers close/reconcile the previous cash session before a new custodian starts.

Owner cash sales without an owner shift must post to an explicitly selected owner-controlled cash account/session. They must not be silently attributed to a worker's drawer. If an owner uses a staffed drawer, require an authorized recorded movement/transaction against that drawer, retaining the owner as actor. Resolve this integration before hiding existing shift controls, because current sale paths depend on register shifts.

### End

Use one **End shift** flow that completes required reconciliation before recording clock-out. Do not clock someone out first and leave their cash session unfinished.

- Orders-only staff confirm completion; record end time and duration. Preserve/transfer outstanding orders rather than marking them paid.
- Cash staff enter a physical closing count. Show the expected amount and variance. A shortage requires explanation and review, not an instruction to fabricate a matching count.
- Display “Expected cash in drawer”, “Counted cash”, “Difference”, and “Expected handover to owner”. Record actual handover separately and let the owner acknowledge receipt.
- Default handover is all counted cash. If the business retains a float, show it separately; expected handover = expected drawer cash minus retained float, actual handover = counted cash minus retained float.
- Prevent further shift transactions while closing is finalized; reconcile and close atomically. Corrections are auditable adjustments, never silent overwrites.

Expected drawer cash = opening cash + cash tenders received + approved cash in − cash refunds − approved cash out − prior recorded cash drops.

Only physical cash belongs in this formula. Exclude cards, bank transfers, unpaid orders, and credit sales. For split tenders, include only the cash component. Use existing ledger/transaction records as the source, not browser totals; do not book a sale twice when recording handover. Example: opening 100 + cash receipts 300 − refunds 20 − cash drop 50 = expected closing 330. Counted 325 means shortage 5; with no retained float, expected handover 330 and actual handover 325.

Disconnecting or closing a browser does not close a shift. Resume it on login. Manager-assisted closure requires a reason and preserves actor identities. Shift times support work-time records; they are not automatically payroll calculations.

## 6. Enforcement and seat lifecycle

Implement a shared entitlement/seat-allocation service used by all create, invite, join-code, accept, approve, reactivate, import, and conversion paths. Use a store-level database lock/transaction so concurrent requests cannot claim the same remaining capacity.

- Count active memberships plus unexpired reserved invitations, once each, by access type.
- Invitation acceptance consumes its reservation rather than taking a second seat.
- Revocation/expiry releases reservations. Repeated acceptance/resend must not duplicate them.
- Suspended users cannot transact. Recommendation: release capacity only after suspension invalidates their sessions and closes or manager-resolves active cash responsibility; reactivation must recheck availability.
- Conversion from POS to full requires free full capacity and releases POS capacity atomically. Broadening permissions alone can never perform conversion.
- Converting full to POS removes broad permissions, invalidates stale authorization, and requires POS capacity. Owner cannot be converted into POS staff.
- At downgrade/add-on expiry, ask the owner to select retained users. Stop new allocations immediately when over limit; resolve excess access using a documented grace period and selected suspensions. Never delete history or secretly disable the owner.

Apply a POS-account access ceiling before role defaults, permission wildcards, or inherited permissions. Enforce it at both route/data access and business action boundaries. Limit supporting product/customer/receipt data to what the task needs; keep cost, profit, unrelated history, bulk export, and admin data out of POS payloads.

Orders-only requests cannot carry effective tender amounts or finalize payment through alternate sale endpoints. Refund requests require the refund capability independently. Mandatory work-shift checks apply to POS staff only, and authorization must bind each shift to its store, actor, and permitted cashbox.

Offline queues must preserve actor, shift, store, and unique transaction identity. Recheck scope on sync. Revoked or disputed queued activity must be retained for manager review rather than silently posted or discarded. For first rollout, final cash reconciliation requires synchronized transactions; show “Pending reconciliation” while offline instead of claiming an authoritative closing balance. Document the unavoidable revocation delay for disconnected devices.

## 7. Entitlements and payments

Effective capacity = plan inclusion + active purchased quantity, with explicit separately audited contract overrides. Use the same server-resolved values for invitation cards, billing, and all authorization gates. Refresh/invalidate cached entitlements after changes.

Create distinct subscription add-on products for extra full staff and extra POS staff. Validate provider product, customer/store association, paid/active status, quantity, and effective dates. Verify webhook signatures and deduplicate events. Recompute quantities from subscription state: do not increment seats again on retry or renewal. Handle cancellation, quantity reduction, refund, and plan change deliberately.

Expose trial identity correctly: “Trial — [entitlement description], ends [date]”, with selected future paid plan shown separately. Never render Starter metadata as the fallback title for a trial with different limits.

Update pricing page, SEO copy, billing cards, usage meters, checkout descriptions, plan administration, onboarding, help articles, and error messages together. Remove unlimited-cashier promises for the new offering. Existing customers/contracts need an explicit migration policy; the source review did not establish whether any customers currently hold those promises.

## 8. Code review findings and implementation map

Paths are relative to `app-code/main-app`. Findings are from source inspection, not a production database audit.

| Area | Relevant files | Required work |
|---|---|---|
| Invite/create/edit UI | resources/js/Pages/Admin/Users.jsx | Two types, usage/reservations, constrained POS editor, conversion action |
| Membership/identity | app/Models/TenantUser.php, app/Models/User.php | Membership access type, capability ceiling, tenant-scoped identity |
| Creation quota | app/Observers/TenantUserObserver.php | Currently creating-only and cashier-role based; use shared allocation rules |
| Invitation paths | app/Http/Controllers/StaffInvitationController.php, StaffController.php | First flow creates invitations without reservation; unify checks and atomic acceptance |
| Member changes | app/Http/Controllers/AdminController.php | Role/status editing needs allocation and conversion enforcement |
| Permission routes | app/Http/Middleware/CheckPermissions.php, routes/web.php, routes/api.php | Split order/payment/refund actions and restrict supporting reads |
| Sale and return paths | PosSaleController, SaleController, PosReturnController, V3 sale/return controllers, engines | Enforce capabilities and authenticated actor across every path |
| Sync | app/Http/Controllers/Api/SyncController.php | Current broad POS/sale permission is insufficient for order-only staff |
| Shifts | app/Models/RegisterShift.php, app/Http/Controllers/RegisterShiftController.php, POS shift components | Existing opening float/count/variance can be reused; add work-time/custody distinction and actor restrictions |
| Entitlements | app/Models/Tenant.php, app/Services/PlanRepository.php, PlanGate.php | Two typed numeric quotas, same source for display and enforcement, cache invalidation |
| Billing | app/Http/Controllers/BillingController.php, resources/js/Pages/Billing/Index.jsx | Correct trial presentation, two meters, enabled add-on checkout only when configured |
| Plan definitions | config/pricing.php, config/plans.php, database/seeders/PlanFeatureMatrixSeeder.php | Update source definitions and existing persisted plan limits via migration; seed edits alone are insufficient |
| Add-on processing | app/Jobs/ProvisionTenantJob.php and subscription update/cancel handlers | Current extra seat config is unavailable; existing incrementing override needs quantity reconciliation |
| Public language | resources/js/Pages/Marketing/Pricing.jsx, resources/js/lib/plans.js, app/Support/MarketingSeo.php | Consistent names, amounts, limits, no obsolete unlimited cashier claim |

The current billing metadata uses a Starter fallback when a plan key has no entry, including trial. That explains a plausible source of the screenshot mismatch; confirm with the running tenant before declaring the live issue resolved.

## 9. Delivery sequence

1. Inventory all membership entry points, authentication destinations, POS read/write paths, station clients, and existing paid contracts. Record rollout decisions below.
2. Add schema and shared quota/allocation service. Migrate classification cautiously: cashier labels alone do not establish restricted access. Flag broad-permission cashiers for owner review; preserve records and avoid unexpected charges.
3. Add server access ceiling and three capability actions across online, API, and sync routes. Add direct POS routing and account security exceptions.
4. Implement shifts, cash custody, owner transaction attribution, cash return exception, and handover/reconciliation.
5. Implement invitation cards, quota messaging, restricted editing, and explicit conversions.
6. Implement recurring add-on products and provider event reconciliation; connect plan metadata/limits consistently.
7. Update public/billing/help content, rehearse migration, run targeted validation, and stage before release.

No deployment, pricing change, user migration, or application implementation is authorized by this document-writing task itself.

## 10. Required acceptance checks for implementation

- Solo owner works with no personal shift control; no additional full or POS person can be added.
- Starter/Core/Scale enforce 1+1, 5+5, 25+25 respectively; owner is included in full count.
- Two simultaneous final-seat requests result in only one allocation.
- Pending invites reserve capacity; acceptance does not double count; expiry releases it.
- Every create/accept/reactivate/conversion route gives the same quota result.
- POS users land directly in POS and cannot access dashboard/admin/finance APIs or receive their data.
- All seven nonempty combinations of the three capabilities behave correctly, including returns-only cash restrictions.
- Altered payloads, wildcard permissions, role changes, and alternate endpoints cannot exceed the POS boundary.
- Orders-only staff start/end work shifts without cash questions and cannot post payments.
- Cash staff must enter opening cash, require closing count, and see correct split-tender/refund/drop/variance calculations.
- One person cannot close another person's shift without explicit management authority.
- Owner and worker transactions are attributable; owner cash never contaminates a worker reconciliation silently.
- Offline replay is idempotent, revoked access is handled, and unsynced closure is visibly pending.
- Duplicate payment events and renewals do not add capacity twice; cancellation, reduction, and upgrades recalculate capacity correctly.
- Trial label, purchased extras, pricing claims, quotas, and backend limits agree.
- Existing records survive migration and rollback; rollout does not silently remove contracted entitlements.

These are planned checks, not tests run during document creation.

## 11. Decisions to close before implementation/release

- Confirm retiring separately billed register limits in favor of named operational stations.
- Decide annual add-on billing/proration and provider products; monthly prices are settled above.
- Set trial POS allowance explicitly and keep trial labels distinct from paid plan selection.
- Determine treatment of existing unlimited-cashier, custom, and lifetime entitlements from real account data.
- Approve the recommended exclusive cashbox custody and owner cash account behavior.
- Specify grace duration and retained-member selection for reduced paid capacity.

## 12. Future work location

Record deferred ideas in [FUTURE_IDEAS.md](FUTURE_IDEAS.md). Give each idea a stable ID, status, problem, proposed scope, dependencies, open decisions, and a link to its detailed plan when promoted. The rider idea is FUT-001 and is explicitly outside this implementation.

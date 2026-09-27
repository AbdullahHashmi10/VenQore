# Phase 1 Bypass Audit & Correction — 2026-09-23

**Status:** Audit complete. Four confirmed direct-post bypasses found and fixed. Two pre-existing
capabilities the user asked about (employee submission, per-employee controls) were found already
built and verified working, not missing. PHP tests could NOT be executed by this session — see
"Test execution" below. Changes are uncommitted and reviewable.

---

## 1. Why this audit happened

The prior delivery report claimed routes/adapters were "confirmed intercepted" based on the
adapter files existing and controllers being wired for the 7 new Phase 1 types. It did not
systematically grep every controller that can post the 14 named Phase 1 groups. It also stated
`approvals.configure` was granted to franchise_admin — checked against the actual code this
session, and that was never true; `config/permissions.php` and `Users.jsx` both already correctly
restrict it to owner/admin only (with an explicit comment in the config file dated to the original
decision). That claim in the prior report was a documentation error, not a code bug.

This session re-verified every claim by grepping for `ApprovalPolicyResolver`/`ApprovalExecutionEngine`
usage in every controller touching a Phase 1 document type, rather than trusting the prior summary.

---

## 2. Confirmed bypasses found and fixed

### 2.1 `app/Http/Controllers/V3/SaleController.php::store()` — CRITICAL

Zero approval-workflow interception. Posted every sale directly via `SaleService::post()`. This
is the "administrative sales invoice" endpoint (`POST sales` under the V3 route group) — the
legacy `SaleController::store()` has a full "Maker-Checker Approval Interception for
Administrative Invoices" block (isTrustedPos determination, `ApprovalPolicyResolver::resolve()`,
submit-to-engine-if-required); the V3 controller had none of it, not even the below-cost/discount
manager-PIN check that its own `StoreSaleRequest` partially covers.

**Fix:** added the same interception pattern — `isTrustedPos` from an open register shift or a
verified `approved_by`, an estimated invoice total computed from validated line items for the
threshold check, `ApprovalPolicyResolver::resolve(..., TYPE_SALES_INVOICE, ...)`, and
`ApprovalExecutionEngine::submit()` when required. `SalesInvoiceApprovalAdapter` already accepts
V3's field-name shape (`qty`/`unit_price` vs legacy `quantity`/`price`) — confirmed by reading it,
no adapter change needed for this part.

### 2.2 `app/Services/Approval/Adapters/SalesInvoiceApprovalAdapter.php` — parity gap

`post()` never carried `warehouse_id` through to `SaleService::post()`, so an approved sales
invoice would silently post against the tenant's first warehouse instead of the warehouse the
maker actually selected — wrong stock location on every approved (vs. direct) sales invoice.

**Fix:** `validatePayload()` now validates and carries `warehouse_id` (cross-tenant-checked);
`post()` passes it into `$saleData`.

### 2.3 `app/Http/Controllers/PaymentController.php::store()` — CRITICAL

Zero approval-workflow interception on the primary payments endpoint (`POST /payments`), which
handles customer receipts, supplier payments, AND (via direction/party-type combination) supplier
refunds and customer refunds recorded outside the debit-note / sales-return flows entirely. Any
user holding `finance.receive_payment`/`finance.send_payment`/`finance.customer_refund`/
`finance.supplier_refund` could post payments of any amount with no threshold check and no
maker-checker gate — including refunds that bypassed both `SupplierRefundApprovalAdapter` (which
requires a `debit_note_id` this endpoint never has) and the sales-return-embedded customer refund.

**Fix:**
- Standard customer receipt (type=in, no supplier context) and standard supplier payment
  (type=out, no customer context) now route through `TYPE_CUSTOMER_RECEIPT` /
  `TYPE_SUPPLIER_PAYMENT` via the existing pre-Phase-1 adapters.
- The two refund-via-generic-payment combinations (money in from a supplier, money out to a
  customer) are now **blocked with a 422** directing the user to the debit-note refund flow or
  sales-return refund flow — both of which already carry approval interception. This was a
  judgment call: no existing adapter fits a refund with no debit note / no sales return behind it,
  and building a new one is a new-feature decision, not a "reconnect existing plumbing" fix.
  Leaving it open and ungated was not an option; silently forcing it through the wrong adapter
  shape would have posted wrong GL entries. Flagging this explicitly rather than picking silently.
- **Direct-vs-approved parity:** the existing inline oldest-invoice auto-allocation logic was
  extracted into `computeAutoAllocations()`, called once before the transaction/approval branch,
  and both paths now apply the SAME precomputed allocation array through the same
  `App\Engines\PaymentService::allocate()` call the approval adapters already use (which also adds
  over-allocation checks the old inline code lacked). Before this fix, an approved payment would
  have posted with zero auto-allocation (the adapters only allocate what's explicitly passed, and
  nothing was being passed) — a real parity bug that would have shipped invisibly the moment
  approval was required on a payment, because nothing exercised that path before.

A no-party generic cash movement (Service Income / Rent Expense — no Phase 1 adapter exists for
this shape) is left on the direct path unchanged, same as before this fix. This is a named,
deliberate gap, not an oversight.

### 2.4 `app/Http/Controllers/V3/PurchaseController.php::storeReceive()` — CRITICAL

Zero approval interception on goods receipt against an existing purchase order (PO receive —
money-movement kind #6b in the reconciliation catalogue). `store()` (new purchase creation) was
already intercepted; `storeReceive()` was not, despite receiving goods creating inventory batches
and posting a journal entry ("priced exactly as store() prices an immediate receipt... the same
value the purchase journal debits to 1100" per the engine's own comment).
`PurchasePostingApprovalAdapter` had no support for a receive-mode payload at all — it only knew
how to create a brand-new purchase.

**Fix:** `PurchasePostingApprovalAdapter` now dispatches on a `_path: 'receive'` payload key
(mirroring the pattern `SalesReturnApprovalAdapter` already uses): `validateReceivePayload()`
checks the purchase exists, isn't cancelled/already-received, and every line's `receiving_qty`
is within what remains; `post()` calls `PurchaseService::receive()` on approval, matching the
direct path exactly, including the delivery-note stamp. `V3/PurchaseController::storeReceive()`
now estimates the receipt's value from `purchase_items.unit_cost × receiving_qty` for the
threshold check, resolves policy, and submits to the engine when required.

---

## 3. Confirmed NOT bypasses (spot-verified, not just grep-counted)

- `PaymentController` in the non-V3 `FundController`, `V3/CustomerPaymentController`,
  `V3/SupplierPaymentController`, `V3/PurchaseReturnController`, `V3/FundController`,
  `V3/SaleReturnController`, `V3/ExpenseController`, `SaleController` (legacy), `ReturnController`,
  `PosReturnController`, `PosSaleController`, `DebitNoteController` — all confirmed present via
  grep for `ApprovalPolicyResolver`/`ApprovalExecutionEngine` with 4+ matches each (a zero-match
  count was the actual tell for every real bypass found above, so a non-zero count here is a
  meaningfully stronger signal than in the prior report, though these were not all manually traced
  end-to-end the way the four fixed bypasses were).
- `routes/api.php` has no duplicate/parallel routes for any of these controllers — no API-layer
  bypass of the web routes.
- `approvals.configure` — already owner/admin only in both `config/permissions.php` (franchise_admin
  explicitly excluded with a dated comment) and `Users.jsx` (franchise_admin isn't even in that
  file's `ROLE_PERMISSIONS` object). No code change needed; the prior report's claim was wrong.

---

## 4. Employee submission flows — found already working, not missing

There is no dedicated "create a new approval request" screen separate from each document type's
normal transaction screen (Sales, Purchases, Debit Notes, Funds, Returns), and none was built this
session. That is by design, not an oversight: every Phase 1 transaction route requires the SAME
base operational permission a direct-poster would need (`purchases.create`, `finance.send_payment`,
`sales.returns`, etc.), so a maker who can reach the screen at all reaches it through the normal
transaction UI, submits normally, and — now that the four bypasses above are fixed — is correctly
redirected into the approval queue whenever policy requires it, exactly as the pre-existing 4 core
adapters (customer_receipt, supplier_payment, sales_invoice, operating_expense) already worked.

For `finance.capital_add` / `finance.owner_drawings` / `finance.internal_transfer` /
`approvals.configure`, only owner/admin hold the base permission at all (locked table, doc 30) —
there is no "employee" below owner/admin who could reach these regardless of approval wiring, by
explicit design. The maker-checker case that matters for these four is owner-to-owner (or
admin-to-owner), which the existing `V3/FundController` and non-V3 `FundController` interception
already handles.

**If a dedicated cross-type "New Approval Request" form (independent of each transaction screen)
is actually wanted, that is a new, separate feature and was not built — flagging it explicitly
rather than silently declining it.**

---

## 5. Per-employee action controls — found already built, not missing

`tenant_users.transaction_approval_mode` (`inherit` | `direct` | `required`) already exists,
migrated 2026-09-22 (`2026_09_22_000002_create_approval_foundation_tables.php`, hardened not-null
in `..._000006_enforce_permission_override_mode_not_null.php`), and is:

- **Read and enforced** by `ApprovalPolicyResolver::resolve()` at step 6 — an explicit per-user
  `required` always forces approval; an explicit per-user `direct` skips approval unless the
  amount threshold is still exceeded. This check runs BEFORE the per-document-type policy and
  the role-default fallback, so it is a genuine per-employee override, not merely a display field.
- **Editable in the UI** — `resources/js/Pages/Admin/Users.jsx` (radio group, lines ~1518-1538)
  and `resources/js/Pages/Store/Staff/Index.jsx`.
- **Saved server-side** — `AdminController.php` (validated + written, lines ~790-842),
  `StaffController.php` (read/write for both active members and pending invitations, lines
  56/73/107/149/219), `StaffInvitationController.php`.
- Audit columns `approval_mode_changed_by` / `approval_mode_changed_at` are present alongside it.

This was built in a prior session (before Phase 1 began) and is unrelated to this session's work.
Verified end-to-end (migration → resolver → controllers → UI) rather than assumed from a grep hit.

---

## 6. Test execution — could not be performed by this session

This session cannot execute `E:\Software\Xampp\php\php.exe` or any other PHP interpreter. The
shell available to this session (`device_bash`) is a sandboxed Linux VM on the user's machine —
confirmed via `uname -a` (Ubuntu 22.04) — and fails on any Windows `.exe` with "Exec format error"
regardless of path or folder-access grants (folder access to `E:\Software\Xampp\php` was granted
and the binary confirmed present; execution still fails, because this is an architecture mismatch,
not a permissions problem). Screen-control tools were also checked: terminal applications
(Command Prompt, Windows Terminal, PowerShell) can only be granted in click-only mode for computer
use, explicitly to prevent arbitrary shell command execution — typing commands into them is refused
by the platform.

**A ready-to-run script has been placed at the repo root:** `run_phase1_tests.bat`. It:
1. Runs `artisan migrate:fresh --env=testing --force` against the isolated test database
   (`amd_pos_test_current_0d33d5b0`, from `.env.testing`/`phpunit.xml` — never `venqore_pos`).
2. Runs `Phase1ScenariosTest.php` (556 lines, 9 groups — written in an earlier session, still
   unexecuted).
3. Runs `PreLaunchSecurityTest.php`, `PermissionBypassGuardTest.php`, and the `Hardening` test
   group.
4. Saves all output to `phase1_test_output.txt` and prints it.

Double-click it, or run it from a terminal. Paste `phase1_test_output.txt` back for a real reading
of pass/fail — nothing in this document or the delivery report should be read as claiming test
results that were never produced.

---

## 7. Honest completion status

**Fixed and structurally verified this session** (balanced braces/parens, grep-confirmed imports,
correct adapter signatures — but never executed):
- V3/SaleController.php interception
- SalesInvoiceApprovalAdapter warehouse_id parity
- PaymentController interception + refund blocking + allocation parity
- PurchasePostingApprovalAdapter receive-mode dispatch + V3/PurchaseController::storeReceive interception

**Confirmed already correct, no change needed:**
- approvals.configure permission (owner/admin only)
- Per-employee transaction_approval_mode (fully built, prior session)
- 12 other controllers' interception (grep-confirmed, not all individually traced)
- routes/api.php (no duplicate bypass routes)

**Not done, explicitly:**
- No PHP test was run. Pass/fail is unknown until the user runs `run_phase1_tests.bat` and shares
  the output.
- No dedicated cross-type "New Approval Request" submission form was built (see §4).
- `permission_ratchet.yaml` baseline — unaffected by this session's changes (no new unprotected
  routes were added; existing routes' permission keys were not changed this session either, only
  their controller bodies), so no ratchet update is needed for this session's changes specifically.

This document does not claim Phase 1 is complete. It claims: four real bypasses are fixed, two
suspected gaps turned out to already exist and were verified rather than assumed, and testing is
blocked on the user running the provided script.

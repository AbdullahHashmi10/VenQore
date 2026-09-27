# After Phase 1: cheque books and header calculator

Date: 23 September 2026. Planning only. Complete and verify the fourteen Phase 1 approval operation groups before implementation here. This document is a later product backlog item, not an expansion of the Phase 1 release gate.

## Current application findings

- Sales forms can capture a cheque number and date; `payments.cheque_date` exists. Some payment forms expose a free-text `reference` labelled "Cheque / TxID".
- `useDocumentAccounts.js` exposes a CHEQUE choice and the accounting code maps certain cheque receipts to account 1020, Cheques in Hand. `V3/BounceController` reverses a bounced customer payment.
- There is no identifiable cheque-book entity, serial range inventory, issued/unused/voided register, central cheque-number validator, or database uniqueness constraint for cheque identity. This is a source inspection finding, not an exhaustive runtime audit.
- `PaymentController::store()` currently validates `payment_method` as cash, bank, card or UPI, so its free-text "Cheque / TxID" reference is not a structured cheque payment on that route. Other document routes accept a cheque choice. Flow reconciliation is required before integration.
- No shared private calculator was identified. A calculator icon in the command palette is for Profit & Loss; public marketing calculators and POS counting components are different features. `OneGlanceLayout.jsx` already has a per-user local header-clock visibility pattern suitable for the proposed calculator preference.

## External product patterns

- TallyPrime lets a business register cheque-book number ranges per bank and view available, blank, cancelled, unreconciled and reconciled cheques. Sources: https://help.tallysolutions.com/cheque-payments-set-up/ and https://help.tallysolutions.com/cheque-register/.
- Zoho Books tracks cheque numbers, printed/uncleared/cleared/void status, supports approval, and states that a number assigned to a void cheque cannot be reused. Source: https://www.zoho.com/in/books/help/cheque/.
- Odoo distinguishes outgoing vendor cheques from incoming customer cheques and treats deposited/reconciled status separately from merely recording a receipt. Source: https://www.odoo.com/documentation/19.0/applications/finance/accounting/payments/online.html.
- QuickBooks describes cheque numbers as unique per bank in its banking concepts. Source: https://quickbooks.intuit.com/learn-support/en-us/help-article/pay-bills/basic-banking-concepts-common-terminologies/L77ceSWpG_US_en_US.

## Proposed cheque design

Separate two directions:

1. **Issued cheque from our cheque book.** Owner or authorized bank administrator registers an issuing bank account, cheque-book label and inclusive serial range. Preserve leading zeroes as text. Detect overlapping ranges for the same issuing account. Each leaf becomes available, reserved for an approved payment, issued, cleared, void, lost or stopped with audit history. A void/lost/stopped serial remains unavailable for reuse. The serial picker should suggest the next available leaf but allow an authorized choice from that book. Source document, payee, amount, written date, due date, issuer and approver remain linked.
2. **Cheque received from an external party.** Do not require it to be in our own book. Record issuer bank/account identity where available, cheque number, drawer, party, amount, cheque date, receipt date, deposit bank/date, clearing or bounced status. Duplicate detection uses tenant plus the issuer's bank/account identity and cheque number; if issuer identity is incomplete, warn for likely duplicates and show matching records for review. Avoid blocking an unrelated bank's cheque that happens to carry the same number.

Build a register with account/book filters, unused and missing serials, pending issue, issued, deposited, cleared, bounced, void/lost/stopped, and audit history. Enforce uniqueness and state transitions in the database and posting service, not just a form check. Handle concurrent users attempting the same serial. Existing free-text references should be reconciled and migrated carefully; never fabricate an issuing book or clear status from an old reference. Show legacy records separately until mapped.

For outgoing cheques in the approval workflow, a pending approval must not mark a cheque issued or post ledger effects. Reserve the serial in the approval domain so two pending requests cannot claim it; release the reservation on rejection/withdrawal, and atomically assign the serial and post on approval. Define how corrected requests change serials. Test master-OFF direct posting and ON approval. Cheque clearance and bounce are subsequent bank events with their own controls.

Inspect accounting treatment separately for issued and received post-dated cheques. Do not assume a received cheque is cleared cash, or that a written outgoing cheque has cleared the bank. Reconcile bank feeds without creating duplicate money movement.

## Proposed calculator

Add a compact calculator button to the signed-in app header for every store role, including viewer/cashier. No business permission is required because it never reads, changes or submits transaction data. Each user can show or hide the header button in their own preferences; a hidden button remains discoverable through a preference or shortcut. The panel supports keyboard and mouse, decimal-safe basic arithmetic, clear/backspace, copy result, and accessible focus/labels. It must never auto-fill money fields or create a ledger entry. Use a per-user setting or local preference consistent across devices if practical; the current header clock uses localStorage and provides a simple initial pattern.

## Later acceptance checks

- Two books on different banks may use the same serial; overlapping ranges on one bank are blocked.
- Same issued leaf cannot be claimed by two payments, including concurrent requests and voided leaves.
- Incoming duplicate checks use issuer identity and number; unrelated issuer accounts may share a number.
- Pending approval leaves financial balances unchanged and holds only a reversible reservation.
- Issued, cleared, bounced and void transitions have correct accounting, permissions and audit trail.
- Legacy cheque references remain accessible without false status claims.
- Calculator is available to every role, user-controlled in header visibility, and isolated from transaction data.

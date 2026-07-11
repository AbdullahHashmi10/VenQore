# CHANGELOG — L011: Cash Purchase Returns Post to Wrong Account

**Date:** 2026-07-11
**Cluster:** 1 (Financial & Webhook Correctness) — item 2 of 4
**Severity:** High (ledger corruption — phantom supplier balances)
**Status:** FIXED (pending your test run)

---

## In one sentence

When you returned goods from a purchase you'd paid **in cash**, the system wrongly recorded it as the supplier owing you money "on account" (Accounts Payable) instead of owing you a cash refund — creating fake supplier balances that never clear.

---

## The problem (plain language)

Every purchase return posted the same accounting entry no matter how the original purchase was paid:

> Debit **Accounts Payable** / Credit **Inventory**

That's only correct for a **credit** purchase (one you haven't paid yet). For those, you owed the supplier, and returning goods reduces what you owe — debiting Accounts Payable is right.

But for a **cash** purchase (already paid), you don't owe the supplier anything. The money already left your account. When you return goods, the supplier owes **you** a refund. Debiting Accounts Payable in that case is wrong — it records a **negative payable**, which looks like "this supplier is carrying a credit balance on account." That balance is a phantom: it isn't real, and it never clears. Over time your Accounts Payable report drifts away from what you actually owe.

This is item L011 / Finding in the launch audit: "Returns on cash purchases post incorrectly to Accounts Payable (creating phantom balances)."

---

## Root cause (technical)

**File:** `app/Services/V3/PurchaseService.php`, method `createReturn()`.

The journal was hardcoded to always debit account `2000` (Accounts Payable):

```php
$journalLines = [
    ['account_code' => '2000', 'debit' => $totalReturnCost, 'credit' => 0, ...],  // ← always AP
    ['account_code' => '1100', 'debit' => 0, 'credit' => $totalReturnCost],       // Inventory out
];
```

There was no branch on how the purchase was paid — even though the purchase record stores exactly that in its `payment_method` column, and the purchase-creation code already uses it (cash → credits `1000` Cash; credit → credits `2000` AP).

---

## The fix

`createReturn()` now mirrors the original payment method. Inventory always leaves (`CR 1100`); only the offsetting debit changes:

```php
$isCashPurchase    = ($purchase->payment_method ?? null) === 'cash';
$offsetAccountCode = $isCashPurchase ? '1000' : '2000';

$journalLines = [
    ['account_code' => $offsetAccountCode, 'debit' => $totalReturnCost, 'credit' => 0, 'party_id' => $purchase->party_id],
    ['account_code' => '1100',             'debit' => 0, 'credit' => $totalReturnCost],
];
```

- **Credit purchase return** → `DR 2000 Accounts Payable / CR 1100 Inventory` (unchanged — reduces what you owe). ✅
- **Cash purchase return** → `DR 1000 Cash / CR 1100 Inventory` (records the refund you're owed / received back). ✅ **This is the fix.**

The account codes match exactly what the purchase-creation code uses (`1000` Cash in Hand, `2000` Accounts Payable), so the return now unwinds the original entry symmetrically.

---

## Why this is safe

- **Credit-purchase returns are unchanged** — they still debit `2000`, exactly as before. Only the cash case changed.
- **Deterministic source of truth** — `payment_method` is read from the original `purchases` row (a `SELECT *` fetch), the same field the purchase-creation logic set. No guessing.
- **Chart of accounts confirmed** — `1000` (Cash in Hand) and `2000` (Accounts Payable) are both seeded in `TenantDefaultSeeder`, and `1000` is precisely the account a cash purchase credits on creation.
- **Everything else in `createReturn()` is untouched** — inventory batch reversal, stock movements, the `purchase_returns` audit row all behave exactly as before.
- Books still balance: it's still one debit and one credit of equal value. No routes touched → no Ziggy regen.

---

## Behavior change (what you'll see)

| Original purchase | Return before | Return after |
|---|---|---|
| **Cash** (paid) | DR Accounts Payable → **phantom negative supplier balance** | DR Cash → correct refund entry |
| **Credit** (unpaid) | DR Accounts Payable (correct) | DR Accounts Payable (unchanged) |

After the fix, your Accounts Payable / supplier-statement reports will no longer accumulate fake credit balances from cash-purchase returns.

---

## How to confirm

1. **Cash purchase → return:** create a purchase paid in **cash**, then return part of it. Check the journal entry: it should **DR 1000 Cash / CR 1100 Inventory**. The supplier's payable balance should be **unchanged** (no phantom negative).
2. **Credit purchase → return:** create a purchase on **credit**, then return part of it. Journal should **DR 2000 AP / CR 1100 Inventory**, reducing the supplier payable (unchanged behavior).
3. **Trial balance** stays balanced in both cases.
4. Existing tests around purchases/returns should stay green (e.g. `p03 purchase return reverses inventory and ap` — note that test uses a *credit* purchase, which is unchanged; if you have a cash-purchase-return test it should now assert the Cash debit).

---

## Files touched
- `app/Services/V3/PurchaseService.php` (`createReturn()` journal lines only)

## Not yet committed
Staged in the working tree. Commit after you've run the confirmation steps.

---

## Cluster 1 progress
- [x] **L017** — V3 Sales Order schema alignment
- [x] **L011** — Cash purchase returns post to wrong account (this document)
- [ ] **L012** — WooCommerce sales bypass the ledger (next)
- [ ] **L010** — Partial V3 sale returns do a full reversal (largest — effectively a feature build)

*Verified by code logic, chart-of-accounts cross-check, and file-integrity checks — not a live PHP/MySQL run. Please run the confirmation steps before relying on it.*

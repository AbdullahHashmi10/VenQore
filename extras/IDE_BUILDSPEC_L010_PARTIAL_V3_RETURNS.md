# IDE BUILD-SPEC — L010: Partial V3 Sale Returns

**Date:** 2026-07-11
**Cluster:** 1 (Financial & Webhook Correctness) — item 4 of 4
**Type:** Feature build (NOT a patch). Give this to your IDE, which can run and test locally.
**Severity:** High — the V3 return flow silently performs a FULL reversal when the user requests a PARTIAL one, corrupting inventory, COGS, revenue, and refunds.

---

## ⚠️ Read first

- This is money-critical code (returns → inventory + COGS + revenue + refunds). **Every change must be covered by a test on `amd_pos_test` (MySQL). Do NOT use SQLite.**
- The AI assistant that wrote this spec could not run PHP/MySQL, so this is a *specification*, not a verified diff. You implement and test it.
- **Do NOT edit tests to force green.** Write new tests that prove correct partial behavior.
- **Good news:** you do NOT need to invent anything. A fully-working partial-return implementation already exists in the **legacy** `SaleController::returnSale()`. This spec is essentially "port that proven logic into the V3 engine." Copy its math and structure.

---

## The bug (what's wrong today)

**File:** `app/Services/V3/SaleService.php`, method `reverse()` (around line 441).

The V3 return controller (`app/Http/Controllers/V3/SaleReturnController.php::store()`) collects per-item quantities from the user:

```php
'items.*.sale_item_id' => [...],
'items.*.return_qty'   => ['required', 'numeric', 'min:0.0001'],
```

…and passes them to `SaleService::reverse(..., items: $validated['items'])`.

But `reverse()` **ignores `$items` entirely** — its own docblock says: *"Optional partial return filter — not yet used (full reversal for now)."* It always:
- restores **all** stock for **every** sale item,
- reverses the **entire** journal entry,
- reverses **all** payments,
- marks the sale fully `returned`.

So a user asking to return 2 of 5 units gets all 5 reversed. Silent, and wrong on every financial axis.

---

## The reference implementation (COPY THIS)

`app/Http/Controllers/SaleController.php::returnSale()` **already does partial returns correctly** for the legacy path. Study lines ~795–952. It handles every hard part:

1. **Full-vs-partial detection** — `$isFullReturn = empty($itemsToReturn) || $this->isFullReturn($sale, $itemsToReturn);` (see `isFullReturn()` at ~line 984). Full → uses the existing full-reversal engine; partial → posts a proportional counter-journal.
2. **Over-return guard** (lines ~840–843):
   ```php
   $alreadyReturned     = (float) $originalItem->returned_quantity;
   $remainingReturnable = max(0.0, (float) $originalItem->quantity - $alreadyReturned);
   $qty                 = min((float) $returnItem['quantity'], $remainingReturnable);
   if ($qty <= 0) { continue; } // nothing left to return on this line
   ```
3. **Proportional refund on NET revenue** (lines ~856–862) — pro-rate `sale_items.net_amount` (what the customer paid AFTER discounts), NOT gross `unit_price`:
   ```php
   $netAmountPerUnit = (net_amount > 0) ? net_amount / original_qty : unit_price;
   $lineRevenue      = round($netAmountPerUnit * $qty, 4);
   ```
4. **Partial FIFO restoration with real COGS** (lines ~864–897) — restore only `$qty` units, newest-batch-first, and split the `sale_item_batches` row:
   ```php
   if ($restoredQty >= $sib->qty_deducted) {
       $sib->markReversed(...);                       // whole line reversed
   } else {
       $sib->update([                                  // partial: shrink the remaining COGS
           'qty_deducted' => $sib->qty_deducted - $restoredQty,
           'total_cogs'   => ($sib->qty_deducted - $restoredQty) * $sib->unit_cost,
       ]);
   }
   ```
   Accumulate `$costToRestore += $restoredQty * $batch->unit_cost` for the COGS journal leg.
5. **Refund account from ORIGINAL payment method** (lines ~820–829) — cash→`1000`, bank/card/online/upi→`1010`, credit/ledger/khata→`1200`. Do not hardcode.
6. **Proportional journal** (lines ~915–947):
   - `DR 1100 Inventory / CR 5000 COGS` for `$costToRestore` (put cost back, un-record the expense)
   - `DR 4000 Revenue / CR <refund account> ` for `$lineRevenue` (undo revenue, issue refund)
   - Posted via `AccountingService::createEntry()` with reference `PRET-<ref>`.
7. **Status + tracking** (lines ~929–951):
   - `sale_items.returned_quantity += $qty` per line
   - sale status → `'partially_returned'` (an already-recognized status across the app; the `returned_quantity` column already exists via migration `2026_06_20_120619`).

---

## What to build in V3

### 1. `SaleService::reverse()` — branch on `$items`

At the top of the transaction, after loading `$sale`:

```php
$isPartial = !empty($items) && $this->isPartialReturn($saleId, $items);
```

- **If NOT partial** (`$items` empty, or every line returns its full remaining qty): keep the current full-reversal behavior EXACTLY as it is now. Do not touch it.
- **If partial**: run the new partial path (below) and DO NOT reverse the whole journal, DO NOT reverse all payments, DO NOT set status to `returned`.

Add a small helper mirroring the legacy `isFullReturn()`: partial = at least one line returns less than its remaining returnable qty, OR only a subset of lines is listed.

### 2. Partial path (port the reference, adapted to V3's query-builder style)

For each `$item` in `$items` (each has `sale_item_id`, `return_qty`):
1. Load the `sale_items` row (scoped to tenant + this sale). Skip if not found.
2. Apply the **over-return guard** (remaining = quantity − returned_quantity; clamp).
3. Compute **proportional net revenue** from `net_amount` (fallback `unit_price`).
4. Do **partial FIFO restore** over `sale_item_batches` for that `sale_item_id` (newest-first), incrementing `inventory_batches.remaining_qty`, and split/mark the `sale_item_batches` row exactly as the reference does. Accumulate `$costToRestore`.
5. Sync the legacy `stocks` / `product_variants` / `products.stock_quantity` counters (+`$qty`).
6. Append the 4 journal legs (inventory/COGS + revenue/refund).
7. `returned_quantity += $qty` on the `sale_items` row.

After the loop:
- If nothing was returnable, throw a clean exception (`LogicException` "Nothing left to return").
- Post ONE `AccountingService::createEntry()` with all accumulated `$journalItems`, reference `PRET-<sale ref>`.
- Post a **partial payment refund** row (optional but recommended) for the returned total, mirroring the existing payment-reversal block but for `$returnTotal` only — OR leave payments alone for v1 and document it.
- Set sale status: if after this return EVERY line is now fully returned → `'returned'` (and you may delegate to the existing full-reversal path instead); otherwise → `'partially_returned'`.

### 3. Guards / invariants
- **Never** allow cumulative `returned_quantity > quantity` on any line.
- The partial journal MUST balance (createEntry throws if not — good).
- COGS restored must come from the **actual batches** the units were sold from (real FIFO cost), never an average or `product.cost_price`.
- Wrap everything in the existing `DB::transaction` so a failure rolls back fully.

---

## Tests to write (on `amd_pos_test`, MySQL)

Put these in a new `Tester/tests/Feature/V3/Scenarios/PartialReturnTest.php` (or extend an existing V3 returns test):

1. **Partial qty restores only that qty** — sell 5, return 2 → `inventory_batches.remaining_qty` up by exactly 2; `sale_items.returned_quantity == 2`; sale status `partially_returned`.
2. **Proportional COGS** — returning 2 of 5 reverses exactly 2/5 of the line's COGS (at the real batch unit_cost), leaving 3/5 still recorded.
3. **Proportional NET revenue on a discounted sale** — a 10%-discounted line returns the net (post-discount) amount, not gross.
4. **Refund account follows payment method** — cash sale → refund credits `1000`; credit sale → credits `1200`.
5. **Over-return blocked** — returning 3, then trying to return 3 more of a 5-qty line only returns the remaining 2 (or rejects the excess); cumulative `returned_quantity` never exceeds `quantity`.
6. **Return all remaining → status `returned`** and books fully unwound (trial balance back to pre-sale state for that sale).
7. **Trial balance stays balanced** after every partial return.
8. **Idempotency / double-submit** — submitting the same partial return twice doesn't double-restore.

Reuse the Golden Company / existing V3 scenario fixtures for realistic data.

---

## Definition of done
- `SaleService::reverse()` honors `$items`: partial requests do a proportional partial return; empty/full requests still do the existing full reversal.
- All 8 tests above pass on MySQL `amd_pos_test`.
- The legacy `SaleController::returnSale()` reference is untouched (it already works).
- Trial balance balances in every scenario; no line can be over-returned; COGS is always real FIFO cost with a matching `sale_item_batches` change.
- Update the `reverse()` docblock — remove "not yet used (full reversal for now)".

---

## Why this is being handed off (not auto-applied)
Partial returns touch inventory, COGS, revenue, tax, refunds, and status transitions on the money path. The assistant preparing this spec cannot execute PHP/MySQL to verify correctness, and a half-correct partial-return engine (wrong COGS, or an over-return hole) is worse than today's honest full reversal. Your IDE can build against the proven legacy reference AND run the test suite — which is exactly what this change needs.

---

## Cluster 1 status
- [x] L017 — V3 Sales Order schema alignment (done, changelog)
- [x] L011 — Cash purchase returns post to wrong account (done, changelog)
- [x] L012 — WooCommerce sales bypass the ledger (done, changelog)
- [~] **L010 — Partial V3 sale returns (THIS SPEC — for IDE implementation)**

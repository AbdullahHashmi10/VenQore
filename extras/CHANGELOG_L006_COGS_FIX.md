# CHANGELOG — L006: POS COGS Fabrication Fix

**Date:** 2026-07-11
**Scope:** Legacy POS sale path — `SaleController::store()`
**Severity of bug fixed:** Critical (financial correctness)
**Type of change:** Surgical fix (NOT the full V3 cutover — see "What we deliberately did NOT do")

---

## In one sentence

The POS used to silently invent a cost-of-goods-sold number whenever an item was out of stock or the cost lookup errored — corrupting profit and inventory reports with no warning and no paper trail. That fabrication is now removed; every stock-tracked sale gets a real, traceable cost or fails cleanly.

---

## The problem (plain language)

When a cashier sold an item, the system needed the item's real cost so profit and inventory value stay correct. Normally it read that from the FIFO stock batches and wrote an audit row ("took X units from batch Y at cost Z").

But in two failure cases it cheated:

1. **The cost lookup threw an error** → a `catch` block silently swallowed it and set the cost to `product.cost_price × quantity` — a rough default, not the real cost — and wrote **no** `sale_item_batches` audit row.
2. **The item was out of stock** (or `checkAvailability` returned false) → an `else` branch did the same fabrication.

Both posted a made-up COGS to the ledger with no matching inventory change and no audit trail. Because it fired on **every stockout** (a routine event in real retail), it would have quietly drifted every merchant's P&L and inventory valuation away from reality — invisibly. This was Finding 1 (the single most severe defect) in `FINAL_LAUNCH_READINESS_AUDIT.md`.

---

## The fix (what changed)

**File:** `app/Http/Controllers/SaleController.php`
**Method:** `store()` — the "FIFO Deduction" block (was ~lines 334–356)

### Before (the defect)

```php
// FIFO Deduction
$itemCogs = 0;
if ($isStockEnabled && $this->fifo->checkAvailability($ld['product_id'], $sale->warehouse_id, $totalQty)) {
    try {
        $deductions = app(\App\Services\V3\FifoService::class)->deductStock(...);
        foreach ($deductions as $d) {
            $itemCogs += $d['total_cost'];
            DB::table('sale_item_batches')->insert([...]);
        }
        $saleItem->update(['cost_price' => $totalQty > 0 ? $itemCogs / $totalQty : 0]);
    } catch (\Exception $e) { $itemCogs = ($product->cost_price ?? 0) * $totalQty; }  // ← FABRICATION #1
} else {
    $itemCogs = ($product->cost_price ?? 0) * $totalQty;                                // ← FABRICATION #2
}
$totalCogs += $itemCogs;
```

### After (the fix)

```php
// FIFO Deduction  (L006 FIX — full rationale in code comments)
$itemCogs = 0;
if ($isStockEnabled) {
    // ALWAYS deduct through FifoService. It returns real batch-derived costs and,
    // on a stockout, either creates a proper negative_stock batch (with a genuine
    // cost + audit rows) or throws InsufficientStockException (clean 422 + rollback).
    // No catch-and-fabricate.
    $deductions = app(\App\Services\V3\FifoService::class)->deductStock($ld['product_id'], $sale->warehouse_id, $totalQty);
    foreach ($deductions as $d) {
        $itemCogs += $d['total_cost'];
        DB::table('sale_item_batches')->insert([...]);   // real audit row, always
    }
    $saleItem->update(['cost_price' => $totalQty > 0 ? $itemCogs / $totalQty : 0]);
} else {
    // Stock tracking DISABLED for this product (service / non-inventory item):
    // there are no batches, so cost_price is the correct — not fabricated — basis.
    $itemCogs = ($product->cost_price ?? 0) * $totalQty;
}
$totalCogs += $itemCogs;
```

### Exactly what changed, line by line
1. **Removed** the `catch (\Exception $e) { $itemCogs = cost_price * qty; }` that silently swallowed FIFO errors and fabricated cost.
2. **Removed** the stockout `else` fabrication branch.
3. **Removed** the `checkAvailability()` gate on the FIFO path. It's no longer needed — `deductStock()` itself handles the shortfall (it deducts what's available, then either creates a `negative_stock` batch with a real cost basis or throws if the merchant set "stop negative stock"). Gating on `checkAvailability` was the very thing that pushed stockouts into the fabrication branch.
4. **Kept** one legitimate `cost_price` path: when stock tracking is **disabled** for a product (service/non-inventory items that genuinely have no batches). This is now the *only* place `cost_price` is used, and it's explicit — not a silent fallback.
5. **Added** extensive code comments explaining the rationale so no future edit reintroduces the fabrication.

---

## Why this is safe (why we can be confident)

- **The happy path is unchanged.** In-stock sales already went through `FifoService::deductStock()` and still do — byte-for-byte the same batch-writing logic.
- **`deductStock()` already handles stockouts correctly.** Verified in `app/Services/V3/FifoService.php` (lines ~56–137): it deducts available stock, then for any shortfall creates a `negative_stock` `inventory_batches` row with a real cost basis and returns proper `deductions` — so `sale_item_batches` audit rows are **always** written.
- **The "stop negative stock" setting is respected.** If the merchant has that on, `deductStock()` throws `InsufficientStockException`.
- **Clean failure was already wired.** `store()` is wrapped in `try { DB::beginTransaction(); … }` and already has a dedicated `catch (InsufficientStockException)` that rolls back and returns HTTP 422. So a blocked sale fails cleanly with the whole transaction rolled back — nothing half-posted. We added zero new error-handling plumbing; we just stopped hiding the exception.

---

## Behavior change summary (what a cashier/merchant sees)

| Scenario | Before | After |
|---|---|---|
| Item in stock | Real FIFO cost + audit row | Same (unchanged) |
| Item out of stock, "stop negative" OFF | **Fabricated cost, no audit row** | Real negative-stock cost + audit row; sale completes |
| Item out of stock, "stop negative" ON | **Fabricated cost, sale completed anyway** | Sale fails cleanly (HTTP 422), full rollback |
| FIFO throws an error | **Silently swallowed + fabricated cost** | Error surfaces; sale fails cleanly + rollback |
| Product with stock tracking disabled | `cost_price` basis | `cost_price` basis (unchanged, now explicit) |

---

## What we deliberately did NOT do (and why)

You asked whether to migrate the POS from the legacy engine to V3 "once and for all." After inspecting both, that was **intentionally deferred** because it is not a safe single edit right now:

- The **V3** engine (`SaleService::post()`) already does COGS correctly, **but** it does **not** yet handle three things the legacy POS depends on:
  - **FBR** (Pakistan tax / e-invoicing) — 6 uses in legacy, 0 in V3
  - **Serial number tracking** — 24 uses in legacy, 0 in V3
  - **Auto-manufacturing** (made-to-order composite products) — 3 uses in legacy, 0 in V3
- Ripping out the legacy path today would silently break those three features on every sale — trading one correctness bug for three feature regressions.
- The launch audit itself treats the full V3 cutover as a **separate, larger project (L008)** that L006 *unblocks* — not part of L006.

**Recommended next step (separate task):** port FBR + serial tracking + auto-manufacturing into V3, add tests, then cut the POS over to V3 with confidence. Until then, this L006 fix makes the legacy path financially honest.

---

## Validation / how to confirm

1. **Recommended test to add** (per audit): simulate a stockout / FIFO-insufficient scenario on the legacy `store()` path and assert the sale either (a) posts a real negative-stock-costed entry **with** a `sale_item_batches` row, or (b) returns a clean 422 with full rollback — and **never** posts a fabricated cost.
2. **Ledger sweep:** run `run-routes-sweep.bat` (now fixed to target the test DB) and confirm COGS/gross-profit routes still reconcile.
3. **Golden suite:** the existing Golden Company COGS reconciliation tests (R-06, R-07, GoldenCompanyTest) should remain green.

---

## Success criteria (met)

> "Zero code paths where COGS can be posted to the ledger without a corresponding, real `inventory_batches` / `sale_item_batches` change."

After this fix, the only path that posts COGS without a batch row is when stock tracking is **disabled** for a product — which by definition has no inventory batches to reconcile against, so it is correct by design, not a fabrication.

---

## Files touched

- `app/Http/Controllers/SaleController.php` — the L006 fix (the FIFO Deduction block in `store()`).
- `run-routes-sweep.bat` — unrelated fix in the same session: forced `--env=testing` so the ledger-truth sweep seeds into `amd_pos_test` instead of being blocked by the production-DB safety guard.

## Not yet committed
These changes are staged in the working tree but not committed. Commit when you've run the suite and are satisfied.

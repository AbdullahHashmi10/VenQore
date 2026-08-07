# Sale Engine Financial Parity — Legacy vs. V3 (L008)

**Purpose (Track A / L008):** before any legacy→V3 cutover (L009), inventory
every financial-calculation difference between the two sale engines so the
cutover can't silently *regress* a fix that only landed in one of them. This is
a diff of tax / discount / rounding / charge logic, sourced directly from code.

- **Legacy:** `app/Http/Controllers/SaleController.php::store()` (approx. lines 108–182)
- **V3:** `app/Services/V3/SaleService.php::post()` (approx. lines 108–165), with
  per-line tax delegated to `TaxService::calculateLineTax()`.

> ⚠️ **Bottom line:** the two engines are **NOT** financially equivalent today.
> V3 is missing three capabilities the legacy engine has (global/order discount,
> delivery & extra charges, and total round-off), and it models line discount
> differently (percentage vs. fixed amount). A naive cutover would drop those
> features. Each row below is a decision to make *before* L009.

---

## Side-by-side

| # | Concern | Legacy (`SaleController::store`) | V3 (`SaleService::post`) | Parity |
|---|---------|----------------------------------|--------------------------|--------|
| 1 | **Line discount input** | Fixed **amount** per line (`item.discount`), plus `discount_type` stored | **Percentage** per line (`item.discount_percent`); `discountAmt = round(lineGross × pct/100, 2)` | ❌ Different input model. A cutover must map the POS/UI's fixed-amount discount into V3, or V3 must learn fixed amounts. |
| 2 | **Free-quantity handling** | Explicit `free_quantity`: `freeValue = unitPrice × freeQty`, folded into gross **and** discount so it nets to zero revenue | No `free_quantity` concept | ❌ V3 drops free-item support. Would silently change totals for any BOGO-style sale. |
| 3 | **Global / order discount** | `request.discount` apportioned across lines **proportionally to each line's net**, then tax computed on the reduced taxable base (Finding F7 / M1-06 fix) | **No global discount at all** — only per-line discounts exist | ❌ **Critical.** This is exactly the "fix that lives in one engine" risk. Cutover without porting this regresses order-level discounts. |
| 4 | **Tax base / ordering** | Tax charged on `net − line's share of global discount`, per line, `round(taxable × rate/100, 2)` | Tax charged on `lineNet` (after per-line discount only) via `TaxService::calculateLineTax(priceIncludesTax:false)` | ⚠️ Same per-line rounding granularity, but bases differ **because** of #3. Equivalent only when global discount = 0. |
| 5 | **Tax-inclusive pricing** | Not handled in this path (always tax-exclusive) | `TaxService` supports `priceIncludesTax` (passed `false` here) | ⚠️ V3 has a capability legacy lacks, currently unused. Safe, but note it. |
| 6 | **Delivery charge** | `delivery_charge` added to invoice total | **Absent** | ❌ V3 drops delivery charges. |
| 7 | **Extra charge** | `extra_charge_value` (+ label) added to invoice total | **Absent** | ❌ V3 drops extra charges. |
| 8 | **Rounding / round-off** | `invoiceTotal = SettingsHelper::roundTotal(round(net+tax+delivery+extra, 2))`; stores explicit `round_off = invoiceTotal − raw` | `invoiceTotal = round(netSales + taxTotal, 2)` — **no** settings-driven round-off, no `round_off` line | ❌ V3 has no tenant round-off rule and no round-off audit value. |
| 9 | **Promotional items** | Not modelled here | `is_promotional` forces `unitPrice = 0`, `discountPct = 0` (S-040) | ⚠️ V3 capability legacy lacks. Additive, not a regression. |
| 10 | **Credit-limit check** | Locks party row, sums account `1200` (debit−credit), compares to `credit_limit` | Locks party row, same intent (approx. lines 167–185) | ✅ Equivalent in shape — verify account code (`1200` vs V3's) during cutover. |
| 11 | **Precision** | PHP float + `round(…, 2)` per line | PHP float + `round(…, 2)` per line | ✅ Same approach (both subject to P001's float-precision follow-up). |

---

## What must happen before L009 (cutover)

These are the unaccounted-for differences the audit warned about — resolve each
explicitly rather than discovering them in production:

1. **Port global/order discount (#3)** into V3, preserving the proportional
   apportionment and "tax on reduced base" ordering. This is the single biggest
   parity gap and a known, already-verified legacy fix (F7 / M1-06).
2. **Port delivery & extra charges (#6, #7)** into V3's total + journal.
3. **Port settings-driven round-off (#8)**, including persisting the `round_off`
   value for audit.
4. **Reconcile line-discount input model (#1)** — decide whether V3 accepts
   fixed-amount line discounts or the POS converts to percentage before calling
   V3. Fixed → percentage conversion is lossy on odd cents; prefer teaching V3
   fixed amounts.
5. **Decide on free-quantity (#2)** — port it, or confirm the product no longer
   supports free items on the V3 path.

Additive V3-only capabilities (#5 tax-inclusive, #9 promotional) are **not**
regressions and need no action for parity, but should be covered by tests once
V3 is authoritative.

## Verification approach for L009

Run both engines in shadow mode over a real traffic sample and assert equality
of `net_sales`, `total_tax`, `round_off`, and `total` per sale. The rows marked
❌ above will diverge until ported — treat "shadow diff shrinks to only the
❌ rows, then to zero after porting" as the go/no-go signal for flipping the flag.

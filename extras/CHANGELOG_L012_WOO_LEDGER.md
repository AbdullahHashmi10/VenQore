# CHANGELOG — L012: WooCommerce Sales Bypass the Ledger

**Date:** 2026-07-11
**Cluster:** 1 (Financial & Webhook Correctness) — item 3 of 4
**Severity:** High (revenue invisible on financial statements)
**Status:** FIXED (pending your test run) — approach: **Option B (add journal alongside existing flow)**

---

## In one sentence

Sales that came in from WooCommerce were recorded in a side table but never posted to the double-entry ledger, so Woo revenue and cost of goods **did not appear on your P&L or Balance Sheet**. They now post a proper journal entry like any other sale.

---

## The problem (plain language)

When a WooCommerce order arrived via webhook, the system:
1. Created/looked up a "Web Customer",
2. Deducted stock,
3. Wrote a row into the legacy `transactions` table.

That was it. It **never created a journal entry** (`journal_items`). Every financial report in this system is built from the double-entry ledger — so a sale that skips the ledger is completely invisible to Profit & Loss, the Balance Sheet, revenue totals, COGS, and tax reports. You could sell Rs.500,000 through WooCommerce and your P&L would show Rs.0 from it.

The existing test (`Module10/WooCommerceTest::webhook_creates_party_and_records_transaction`) even encodes the old, incomplete behavior: it only checks that a `parties` row and a `transactions` row exist — it never checks for a journal entry. That's why the gap went unnoticed.

---

## Root cause (technical)

**File:** `app/Http/Controllers/WooCommerceController.php`, method `webhook()`.

It called `InventoryService::processSale()`, which:
- deducts from the **old `stocks` table** (not the FIFO `inventory_batches`),
- tracks **no unit cost** (so there was no COGS available), and
- returns only a revenue total.

Then it wrote a legacy `Transaction` and returned. No `AccountingService`, no `journal_items`, no COGS.

---

## The fix (Option B — add the journal, keep existing flow)

You chose the safer option: keep the existing behavior and *add* correct ledger posting on top. The `webhook()` method now:

1. **Resolves the tenant's default warehouse** (FIFO deducts per-warehouse).
2. **Deducts stock through the V3 `FifoService::deductStock()`** instead of the costless legacy path. This is the same engine POS uses — it returns real per-batch costs and writes `sale_item_batches` audit rows. That gives us a genuine **COGS** figure.
3. **Posts a balanced double-entry journal** via `AccountingService::createEntry()`:
   - `DR 1000 Cash` / `CR 4000 Sales Revenue` — Woo orders arrive already paid online, so the revenue leg debits Cash.
   - `DR 5000 Cost of Goods Sold` / `CR 1100 Inventory Asset` — only when a real inventory cost exists.
4. **Keeps the legacy `transactions` row** (`invoice_id = WC-<id>`) unchanged, so existing readers and the existing test still pass.

All of this runs inside a single `DB::transaction`, so either the whole Woo sale posts (stock + journal + transaction) or none of it does.

### Account codes used (all confirmed seeded in `TenantDefaultSeeder`)
| Code | Account | Role in Woo sale |
|---|---|---|
| 1000 | Cash in Hand | DR — money received (prepaid online) |
| 4000 | Sales Revenue | CR — revenue earned |
| 5000 | Cost of Goods Sold | DR — cost of items sold |
| 1100 | Inventory Asset | CR — stock leaving |

---

## Why this is safe

- **Additive.** The stock deduction now goes through the correct FIFO engine, and a journal is added. The `transactions` row is still written exactly as before, so nothing that read `transactions` breaks.
- **Balanced by construction.** Debits equal credits (Cash = Revenue; COGS = Inventory). `AccountingService::createEntry()` also independently validates balance and will throw if anything is off — inside the transaction, so a bad entry rolls the whole sale back rather than half-posting.
- **COGS is real, not fabricated.** It comes from `FifoService::deductStock()` (the same L006-correct source of truth), including its negative-stock handling.
- No routes changed → no Ziggy regeneration.

---

## Known considerations (please verify)

These are honest limitations of the surgical approach — not bugs, but things to confirm against how you actually use WooCommerce:

1. **Revenue basis = catalog price.** Revenue is computed as `product->price × quantity` (the catalog price), consistent with how the rest of the system values items. If a Woo order applied a **discount** or a different price, the journal revenue could differ from the Woo order `total`. If your Woo orders carry per-line prices you want honored exactly, we can switch the revenue basis to the Woo payload's line price/total — tell me and I'll adjust.
2. **No sales tax leg.** The Woo payload in the test carries a `total` but no separate tax breakdown, so this fix does not split out output tax (2100). If your Woo orders include tax that must land in the tax ledger, that's a follow-up.
3. **Payment assumption = prepaid cash.** Woo orders are treated as paid (DR Cash). If you record some Woo orders as unpaid/on-account, we'd branch to AR (1200) instead.

---

## How to confirm

1. Send a test WooCommerce order (or run `Module10/WooCommerceTest`) and verify:
   - a `journal_entries` row with reference `WC-<id>` now exists (previously it did not),
   - its `journal_items` balance (debits = credits),
   - `sale_item_batches` rows were written for the sold items.
2. Open the **P&L** for today and confirm the Woo sale's revenue and COGS now appear (they were previously Rs.0).
3. Confirm the existing `transactions` row (`WC-<id>`) is still present — the old test assertion must still pass.
4. Trial balance stays balanced.

**Suggested test upgrade:** extend `webhook_creates_party_and_records_transaction` to also assert a balanced `journal_entries`/`journal_items` set for `WC-<id>` — that locks in the fix so it can't silently regress.

---

## Files touched
- `app/Http/Controllers/WooCommerceController.php` (`__construct` + `webhook()`)

## Not yet committed
Staged in the working tree. Commit after the confirmation steps.

---

## Cluster 1 progress
- [x] **L017** — V3 Sales Order schema alignment
- [x] **L011** — Cash purchase returns post to wrong account
- [x] **L012** — WooCommerce sales bypass the ledger (this document)
- [ ] **L010** — Partial V3 sale returns do a full reversal (last — effectively a feature build, not a patch)

*Verified by code logic, chart-of-accounts cross-check, and file-integrity checks — not a live PHP/MySQL run. Please run the confirmation steps before relying on it.*

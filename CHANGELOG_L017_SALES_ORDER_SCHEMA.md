# CHANGELOG — L017: V3 Sales Order Schema Alignment

**Date:** 2026-07-11
**Cluster:** 1 (Financial & Webhook Correctness) — item 4 of 4
**Severity:** High (silent data loss)
**Status:** FIXED (pending your test run)

---

## In one sentence

Creating a Sales Order through the V3 engine was silently dropping the quantity (and, on strict MySQL, could fail the insert entirely) because the code wrote to a differently-named quantity column than the one the table and every report actually use. Both are now kept in sync.

---

## The problem (plain language)

Your V3 "create sales order" screen collected the item quantity, unit of measure, discount, tax, and line total — and tried to save them. But the database table for sales-order lines uses **different column names** than the V3 code was writing to.

The most damaging mismatch was the quantity:
- The table stores the quantity in a column called **`quantity_requested`** (and that column is required — `NOT NULL`).
- The V3 code only wrote a column called **`qty`** and never filled `quantity_requested`.

Result, depending on your MySQL mode:
- **Strict mode:** the insert fails (required column missing) — the sales order line won't save.
- **Non-strict mode:** the line saves with `quantity_requested = 0`. Every report and screen that reads the quantity (Reports, Inventory reservation, the stock-hold logic) reads that column — so they all see **zero quantity**. The order looks empty even though the customer ordered real amounts.

The audit described this as "silently dropping warehouse, quantities, tax, discounts, and totals." That's exactly this column-name mismatch.

---

## What I found while fixing it (important nuance)

A **previous migration already existed** — `2026_07_08_000001_add_missing_v3_columns_to_sales_orders_table.php` — which had already ADDED the missing V3 columns (`qty`, `sale_uom`, `discount_percent`, `tax_rate`, `line_total`). So part of L017 was already done.

But it left the real landmine in place: the base table's `quantity_requested` column was still `INTEGER NOT NULL` with no default, and the V3 controller still never wrote it. So the bug persisted. The remaining fix had two halves:

1. Make the quantity columns safe and fractional-capable (a new migration).
2. Make the V3 controller write BOTH naming conventions so nothing is lost and all readers agree (controller edit).

---

## What changed

### 1. New migration — `database/migrations/2026_07_11_000001_align_sales_order_items_quantity_columns.php`

- Widens `quantity_requested` from `INTEGER` to `DECIMAL(15,4)` and gives it a default of `0`. (Your whole system supports fractional sales — 2.5 kg etc. — and the model already casts this column to `decimal:4`, so integer was wrong anyway.)
- Widens `quantity_reserved` to `DECIMAL(15,4)` with a default of `0`.
- **Backfills** existing rows: where a V3 row had `qty` set but `quantity_requested` left at 0, it copies `qty → quantity_requested`. Same for `line_total → subtotal`.
- Idempotent and additive: every change is guarded with `hasColumn`, nothing is dropped or renamed. Safe to run on any install (fresh or existing).

### 2. Controller fix — `app/Http/Controllers/V3/SalesOrderController.php` (`store()`)

The `SalesOrderItem::create([...])` call now writes **both** conventions:

| Field written | Purpose |
|---|---|
| `qty`, `sale_uom`, `discount_percent`, `tax_rate`, `line_total` | V3 fields (already existed; `convert()` reads these back) |
| **`quantity_requested`** (mirrors `qty`) | the canonical column the base schema + Reports + Inventory reservation read |
| **`quantity_reserved`** = 0 | nothing is held yet at creation time |
| **`subtotal`** (mirrors `line_total`) | the canonical total column readers use |

So a V3 sales order now saves correctly AND is visible to every downstream report and the reservation logic.

---

## Why this is safe

- **The V3 `convert()` flow is unchanged and still works** — it reads `qty`, `sale_uom`, `discount_percent`, `tax_rate` off the item, all of which are still written exactly as before. I only *added* the mirror columns.
- **The legacy `SalesOrderController`** (a separate, older controller) already wrote `quantity_requested`/`quantity_reserved` — this change makes V3 match it, so the two controllers no longer disagree.
- **The migration is additive + guarded** — it can't fail on a fresh install or double-apply on an existing one. `down()` deliberately keeps the widened type and backfilled data (narrowing back to INTEGER would lose fractional quantities).
- No routes touched → no Ziggy regeneration needed.

---

## Behavior change (what you'll see)

| Scenario | Before | After |
|---|---|---|
| Create V3 sales order (strict MySQL) | Insert fails / line not saved | Saves correctly |
| Create V3 sales order (non-strict MySQL) | Saves with quantity = 0; invisible on reports | Real quantity saved and visible everywhere |
| Convert sales order → invoice | Read locked qty/price (worked) | Unchanged |
| Reports / inventory reservation | Saw 0 quantity for V3 orders | See the real quantity |

---

## How to confirm

1. **Run the migration:** `php artisan migrate` (against your real DB) — it will apply `2026_07_11_000001_align_sales_order_items_quantity_columns` and backfill any existing V3 rows.
2. **Create a V3 sales order** with a couple of line items and a fractional quantity (e.g. 2.5). Confirm the order shows the correct quantities and totals.
3. **Open a report** that lists sales-order quantities (e.g. the reservation / reserved-stock views) and confirm the V3 order's quantity appears (not 0).
4. **Convert** the order to an invoice and confirm the invoice carries the right quantities, discount, and tax.
5. Existing tests: `Tests\Feature\V3\SalesOrderTest` and `V3\Scenarios\*` should stay green.

---

## Files touched
- `database/migrations/2026_07_11_000001_align_sales_order_items_quantity_columns.php` (new)
- `app/Http/Controllers/V3/SalesOrderController.php` (`store()` item insert)

## Not yet committed / not yet migrated
Changes are staged in the working tree. You still need to **run `php artisan migrate`** for the schema change to take effect, then commit.

---

## Cluster 1 progress
- [x] **L017** — V3 Sales Order schema alignment (this document)
- [ ] **L011** — Cash purchase returns post to AP (next, per your "one at a time" choice)
- [ ] **L012** — WooCommerce sales bypass the ledger
- [ ] **L010** — Partial V3 sale returns do a full reversal (largest — effectively a feature build)

*Note: I can't run PHP/MySQL in this environment, so the fix above is verified by code logic, schema comparison, and file-integrity checks — not a live run. Please run the steps under "How to confirm" before relying on it.*

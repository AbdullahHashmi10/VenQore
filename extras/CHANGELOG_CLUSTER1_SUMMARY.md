# CHANGELOG — Cluster 1: Financial & Webhook Correctness (Summary)

**Date:** 2026-07-11
**Track:** A (Launch Readiness) — Cluster 1 of 3
**Overall status:** 3 of 4 fixed in-code; 1 (L010) specced for IDE build.

This is the roll-up. Each item has its own detailed changelog (linked below).

---

## What was in this cluster and where it stands

| Item | Bug | Status | Detail doc |
|---|---|---|---|
| **L017** | V3 Sales Order wrote to columns that don't exist → quantities/tax/discounts silently dropped | ✅ Fixed (needs `php artisan migrate`) | `CHANGELOG_L017_SALES_ORDER_SCHEMA.md` |
| **L011** | Cash purchase returns debited Accounts Payable → phantom supplier balances | ✅ Fixed | `CHANGELOG_L011_CASH_PURCHASE_RETURNS.md` |
| **L012** | WooCommerce sales never posted to the ledger → invisible on P&L / Balance Sheet | ✅ Fixed | `CHANGELOG_L012_WOO_LEDGER.md` |
| **L010** | Partial V3 sale returns silently do a FULL reversal | 📋 Build-spec for IDE | `IDE_BUILDSPEC_L010_PARTIAL_V3_RETURNS.md` |

---

## Files changed (across the cluster)

- `app/Http/Controllers/V3/SalesOrderController.php` — L017
- `database/migrations/2026_07_11_000001_align_sales_order_items_quantity_columns.php` — L017 (new)
- `app/Services/V3/PurchaseService.php` — L011
- `app/Http/Controllers/WooCommerceController.php` — L012

*(L010 has no code change yet — it's a spec for your IDE to implement and test.)*

---

## Actions you still need to take

1. **Run the migration** for L017: `php artisan migrate` (adds/aligns the sales-order-item quantity columns and backfills existing rows).
2. **Test each fix** per the "How to confirm" section in its changelog:
   - L017: create + convert a V3 sales order with a fractional qty; confirm quantities show on reports.
   - L011: do a **cash** purchase return; confirm the journal debits Cash (1000), not AP (2000).
   - L012: send a Woo order; confirm a balanced journal entry (`WC-<id>`) now exists and the sale appears on P&L.
3. **Hand `IDE_BUILDSPEC_L010_PARTIAL_V3_RETURNS.md` to your IDE** to implement partial V3 returns against the proven legacy reference, with the 8 tests listed.
4. **Commit** — none of these are committed yet.

---

## Honest caveats (same for the whole cluster)

- The assistant that made these edits **cannot run PHP or MySQL** in its environment. Every fix here is verified by **code logic, schema/chart-of-accounts cross-checks, and file-integrity checks** — not a live test run. Please run the confirmation steps before relying on any of them for real merchant money.
- L012 makes a few reasonable assumptions (revenue = catalog price, prepaid cash, no separate tax leg) that you should confirm against how you actually use WooCommerce — details in its changelog.
- L010 was deliberately **not** auto-implemented: partial returns are a money-critical feature (proportional COGS, over-return guards) that must be built against live tests. The build-spec points your IDE at a working legacy reference so it isn't from scratch.

---

## Next up (when you're ready)

Per the Master Implementation Plan, after Cluster 1:
- **Cluster 2 — Core Security Hardening:** L026 (wildcard permission bypass), L027 (POS PIN brute-force limiting), L028 (secure terminal screenshot uploads).
- **Cluster 3 — Backup Safety & Tenant Isolation:** L019 (automated offsite backups), L025 (missing HasTenant scopes on 6 models).

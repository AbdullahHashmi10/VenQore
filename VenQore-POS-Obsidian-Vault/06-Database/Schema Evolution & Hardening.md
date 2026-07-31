---
tags: [database, migrations, history]
---

# Schema Evolution & Hardening

Part of [[VenQore POS - Home]] · [[Database Schema Overview]]

The migration history reveals several deliberate, multi-migration campaigns worth understanding as a group.

## Multi-Tenant Isolation Retrofit
A multi-week campaign to retrofit `tenant_id` scoping and composite indexes onto every table:
`2026_04_11_100000_add_missing_tenant_ids.php`, `2026_04_13_052350_add_tenant_id_to_missing_tables.php`, `2026_04_13_052537_fix_multi_tenant_unique_indexes.php`, `2026_04_13_210000_harden_tenant_isolation_on_remaining_tables.php`, `2026_04_15_000001_complete_tenant_isolation_final.php`, `2026_04_16_210000_add_multi_tenant_performance_indexes.php`.
Directly evidences the `CLAUDE.md` rule that "all DB queries must include tenant_id scope."

## Cascade-Delete Hardening (anti-data-loss policy shift)
Three passes converting `cascadeOnDelete()` FKs to `restrictOnDelete()`:
`2026_04_13_000001_harden_cascade_deletes_to_restrict.php`, `2026_06_21_141706_harden_c3_cascade_deletes_to_restrict.php`, `2026_06_21_144911_harden_more_cascade_deletes.php`.
This is why `sale_item_batches.inventory_batch_id` is `restrictOnDelete` — you cannot delete a batch that was ever sold from.

## Money Column Standardization
`2026_06_21_130243_standardize_all_money_columns_to_20_4.php` — widens most monetary columns to `decimal(20,4)` across `accounts`, `bank_accounts`, `batches`, `parties`, `sales`, etc. Includes pre-migration sanitization (`UPDATE ... SET col = 0 WHERE CAST(col AS CHAR) = 'NULL' OR ''`) to avoid MySQL error 1292 on cast during the widen.

## Quantity Decimal Conversion
`2026_06_20_155327_add_decimal_quantity_to_sale_items_table.php`, `2026_06_21_103702_add_decimal_to_remaining_qty_columns.php` — supports weighted/fractional-quantity items.

## FIFO Constraint Fixes
`2026_03_06_201514_add_remaining_qty_constraint...` (CHECK `remaining_qty >= 0`), later corrected by `2026_07_21_000000_fix_chk_remaining_qty_positive_constraint.php` — indicates the original constraint had a bug.

## Settings Tenant-Awareness
`2026_04_11_200100_make_settings_tenant_aware.php` — adds `tenant_id` (nullable, indexed), drops the global unique on `key`, adds composite unique `[tenant_id, key]`, backfills existing rows to the first tenant, deletes orphaned duplicates via `UPDATE IGNORE`.

## Chart of Accounts Cleanup
`2026_04_16_200000_fix_chart_of_accounts_code_alignment.php`.

## Party Snapshot Fixes
`2026_06_09_000000_sync_party_opening_balances.php`, `2026_06_09_000001_fix_party_snapshots_account_id_type.php`.

## Takeaway
This migration history is itself a readable record of real production bugs found and fixed — cross-tenant leaks, over-permissive cascades, precision issues, broken constraints. Treat migration file names as a changelog when investigating "why does this column/constraint look odd."

## Related
- [[Multi-Tenancy Architecture]]
- [[PaymentAllocation Trigger]]
- [[Database Schema Overview]]

---
tags: [database, schema]
---

# Database Schema Overview

Part of [[VenQore POS - Home]]

MySQL only (see [[Database Policy]]). 265+ migration files. Heavily iterated: many "V1" tables (`invoices`, `transactions`, `transaction_allocations`) were superseded by later "definitive plan"/V3 tables (`sales`/`purchases`, `payment_allocations`, `journal_entries`) — both generations still exist as migrations, but only the current generation is authoritative.

## Domain Note Index
| Note | Covers |
|---|---|
| [[Core Tables - Products & Inventory]] | products, stocks, inventory_batches, batches, warehouses, categories, variants |
| [[Core Tables - Sales & Purchases]] | sales, sale_items, purchases, purchase_items, payments, payment_allocations, parties |
| [[Core Tables - Accounting]] | accounts, journal_entries, journal_items, bank_accounts, expenses, party_snapshots |
| [[Core Tables - Multi-Tenancy]] | tenants, tenant_users, users, store_licenses, plans, coupons |
| [[PaymentAllocation Trigger]] | The one MySQL trigger in the entire schema |
| [[Schema Evolution & Hardening]] | Migration campaigns: money standardization, tenant isolation, cascade-delete hardening |

## Notable Structural Facts
- **UUID PKs are near-universal**, except `tenants` (numeric auto-increment — used directly in URLs `/s/{id}/...`) and a handful of simple pivot/log tables.
- **Only one MySQL trigger exists in the entire schema** — the `payment_allocations` over-allocation guard. See [[PaymentAllocation Trigger]].
- **Money columns were globally standardized** to `decimal(20,4)` in a dedicated migration (`2026_06_21_130243_standardize_all_money_columns_to_20_4.php`).
- **Multi-tenant hardening was a multi-week campaign**, not a single migration — six+ separate passes retrofitting `tenant_id` and composite indexes.
- **Cascade-delete hardening**: three separate passes converting `cascadeOnDelete()` to `restrictOnDelete()` — a deliberate anti-data-loss policy shift.

## Related
- [[Database Policy]]
- [[Multi-Tenancy Architecture]]

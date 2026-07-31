---
tags: [services, accounting, v3]
---

# V3 Accounting Engine

Part of [[VenQore POS - Home]] · [[Two Generations - Legacy vs V3]]

## AccountingService (`app/Services/V3/AccountingService.php`)
Constructor deps: `PartyService`, `PaymentService`.
The double-entry journal engine. **Golden Rules**: every entry has ≥2 lines, debits=credits, entries are never deleted (only reversed), every line needs `reference_type`/`reference_id`.

| Method | Purpose |
|---|---|
| `createEntry(array $data, array $lines): JournalEntry` | Validates balance (rounds to 2dp, rejects lines with both debit+credit >0 or neither), inserts JournalEntry + JournalItem rows, rebuilds `PartyService` snapshots for every party on the entry, writes audit log via `AuditService` |
| `reverseEntry($journalEntryId, string $reason): JournalEntry` | Locks original entry, calls `PaymentService::voidAllocations()`, builds a mirrored (debit/credit swapped) reversal entry, flags original `is_reversed=1` |
| `getBalance(string $accountCode, ?Carbon $asOf): float` | Live balance from journal_items, respecting `normal_balance` |
| `getAccountByCode(...)` | Tenant-scoped find-or-create (fixes a historical cross-tenant duplicate-account-code bug) |
| `deleteEntries(array $entryIds)` | Hard delete — reserved for migration rollback only |

Business rules: strict double-entry balancing; tenant isolation via `app('current.tenant')`; reversal is the only allowed "edit" of posted financial history.

## Supporting V3 Services
| Service | Role |
|---|---|
| `PartyService` | Owns `party_snapshots` — cached balance table, rebuilt automatically on every `createEntry()` |
| `PaymentService` | Owns `payment_allocations`, `sales.payment_status`, `purchases.payment_status`; enforces over-allocation guard |
| `TaxService` | `calculateLineTax()` (enforces advance receipts always carry zero tax), `taxReport()` |
| `UomService` | `toBaseQty()` converts sale-unit qty to base UOM via `product_uom_conversions` |
| `AuditService` | `log()` writes `audit_logs`; swallows its own exceptions so audit failures never crash a financial transaction |

## Financial Reporting
`FinancialReportingService` (2072 lines) — "the Single Source of Truth for P&L." Every calculation reads exclusively from `journal_items`, scoped by `journal_entries.date`. `Account.balance` is intentionally NOT used, guaranteeing `/reports/profit-loss` and `/accounting/p-and-l` return identical numbers.
- `getProfitAndLoss($start, $end)`: revenue = credits−debits across income accounts; COGS = debits−credits on account `5000`; operating expenses = all expense accounts except COGS.

## Related
- [[Sale Lifecycle - V3 SaleService]]
- [[Purchase Lifecycle - V3 PurchaseService]]
- [[PaymentAllocation Trigger]]
- [[Core Tables - Accounting]]

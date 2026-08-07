---
tags: [architecture, v3, legacy]
---

# Two Generations: Legacy vs V3

Part of [[VenQore POS - Home]] · [[Project Overview]]

A defining architectural fact about this codebase: **two parallel inventory/accounting stacks coexist.**

## Legacy Layer
`app/Services/{InventoryService,PurchaseService,SaleReversalService,FifoService}.php`
- Not consistently tenant-scoped in early versions.
- Composite-product manufacturing via `Product::recipes` relation (Mode A/Mode B, see [[Manufacturing & Composite Products]]).
- Legacy `FifoService` throws on insufficient stock (no negative stock).
- Code comments like `WOUND 2 FIX`, `WOUND 3 FIX`, `L011 FIX` mark patches for cross-tenant data leaks and journal-linkage bugs found here.
- `PurchaseService` has a documented safety requirement in `CLAUDE.md`: if routed, its double-entry payment allocation logic must link `PaymentAllocation` to a `JournalEntry` ID, not a `Payment` ID — see [[PaymentAllocation Trigger]].

## V3 Layer (`app/Services/V3/*`, `app/Http/Controllers/V3/*`)
The authoritative, hardened double-entry engine:
- `AccountingService` — golden rules: every entry has ≥2 lines, debits=credits, entries are reversed not deleted.
- `SaleService`, `PurchaseService`, `FifoService`, `PaymentService`, `TaxService`, `UomService`, `PartyService`, `SettlementService`, `ManufacturingService`, `AuditService`.
- Explicitly tenant-scoped via `app('current.tenant')`.
- V3 `FifoService` can create a `negative_stock` batch type instead of throwing, unless `SettingsHelper::shouldStopNegativeStock()` is enabled.
- Backed by 36 dedicated controllers under `V3/` covering HR, payroll, assets, depreciation, loans, disasters, donations — a much broader ERP surface than the legacy layer.

## Why Both Exist
The V3 layer appears to be a from-scratch rebuild addressing bugs found in production (see the WOUND/L011 fix comments) while the legacy layer remains routed for backward compatibility in places. New work should prefer V3 services.

## Related
- [[V3 Accounting Engine]]
- [[FIFO Inventory System]]
- [[Legacy vs V3 Services]]
- [[V3 ERP Routes]]

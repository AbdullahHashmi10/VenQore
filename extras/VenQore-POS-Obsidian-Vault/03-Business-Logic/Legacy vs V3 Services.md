---
tags: [services, architecture]
---

# Legacy vs V3 Services — Full Comparison

Part of [[VenQore POS - Home]] · [[Two Generations - Legacy vs V3]]

## Legacy (`app/Services/*.php`)
| Service | Purpose |
|---|---|
| `InventoryService` | `processSale()`, `deductStock()` — composite product Mode A/B logic, plain FIFO by `created_at ASC` over `stocks` table |
| `PurchaseService` | `createPurchase()`, `createPurchaseReturn()`, `recordPurchasePayment()` (posts via V3 AccountingService internally) |
| `SaleReversalService` | The only authorized path for undoing a posted sale |
| `FifoService` | `deductAndRecord()`, `getInventoryCostValue()` — throws on insufficient stock |
| `AutoManufacturingService` | Rule-based auto-manufacturing (`ManufacturingRule`/`ManufacturingLog`) — Mode A "Make Now" |
| `LedgerService` | Static-only. `partyNetBalance()` computes purely from `journal_items`, never the stale `current_balance` column |

## V3 (`app/Services/V3/*.php`)
| Service | Purpose |
|---|---|
| `AccountingService` | Double-entry journal engine — see [[V3 Accounting Engine]] |
| `SaleService` | See [[Sale Lifecycle - V3 SaleService]] |
| `PurchaseService` | See [[Purchase Lifecycle - V3 PurchaseService]] |
| `InventoryService` | Batch creation orchestrator |
| `FifoService` | Authoritative stock deduction — see [[FIFO Inventory System]] |
| `PaymentService` | Owns `payment_allocations`, payment badges |
| `TaxService` | Line tax + tax reports |
| `UomService` | Unit-of-measure conversion |
| `PartyService` | Owns `party_snapshots` cache |
| `SettlementService` | Employee final settlement (accrual + payout) |
| `ManufacturingService` | BOM-based production runs, by-products, disassembly |
| `AuditService` | Non-blocking audit logging |

## Why Two Generations Exist
Code comments (`WOUND 2 FIX`, `WOUND 3 FIX`, `L011 FIX`) indicate the V3 layer was built specifically to patch cross-tenant data leaks and journal-linkage bugs found in the legacy layer. New feature work should prefer V3; legacy remains routed for backward compatibility.

## Related
- [[V3 ERP Routes]]
- [[Route Map Overview]]

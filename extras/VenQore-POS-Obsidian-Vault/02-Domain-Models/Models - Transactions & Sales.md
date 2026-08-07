---
tags: [models, sales, transactions]
---

# Models — Transactions & Sales

Part of [[VenQore POS - Home]] · [[Sale Lifecycle - V3 SaleService]]

## Sale (`Sale.php`) — ★ core revenue model
`SoftDeletes`, `HasActivityLog`. Defines the **Revenue Recognition State Machine**: statuses `draft → posted → returned/cancelled`. `posted_at` is the authoritative revenue-recognition timestamp; `payment_status` is UI-only, never authoritative (ledger is source of truth).
Scopes: `scopePosted` (status=posted + posted_at not null — **must be used in all P&L queries**), `scopePostedBetween`, `scopeDropship`, `scopePendingDispatch`, `scopeUnreconciled`.
Accessors: `getNetAmountAttribute`, `getTotalAmountAttribute`, `getCustomerNetBalanceAttribute` (via `LedgerService`), `getPaidAmountAttribute`.
Relations: `party`/`customer`, `payments`, `user`, `warehouse`, `items` hasMany SaleItem, `journalEntries`, `ecommerceChannel`, `jitPurchases` hasMany PurchaseOrder (VenSynQ just-in-time drafts).

## SaleItem (`SaleItem.php`)
`SoftDeletes`. Financial waterfall: gross→discount→net→tax→line_total. **Rule: never compute Gross Profit from sale_items alone — always use sale_item_batches for COGS.**
Accessors: `getFifoCogAttribute` (sum of active saleItemBatches total_cogs), `getGrossProfitAttribute`.

## SaleItemBatch (`SaleItemBatch.php`) — ★ immutable audit ledger for FIFO deductions
`SoftDeletes`. Docblock: append-only financial record; never physically delete; never update qty_deducted/unit_cost post-sale; reversal marks `is_reversed=true` instead of deleting.
Scopes: `scopeActive`, `scopeReversed`. Method: `markReversed(string $reason)` — called only by `SaleReversalService`.

## Purchase / PurchaseItem / PurchaseOrder / PurchaseOrderItem
`Purchase`: `$guarded=[]`. `PurchaseOrder`: `SoftDeletes`, scopes `scopeJitDrafts`, `scopeJitApproved`, relation `jitSale` belongsTo Sale (VenSynQ).

## Invoice / InvoiceItem / InvoiceReminder (legacy generation, still present)
`Invoice`: appends `paid_amount`; accessors for customer net/prev balance via `LedgerService`. `InvoiceReminder`: `invoice` belongsTo Sale (note: aliased relation name).

## DebitNote / Quotation / SalesOrder / Proposal / RecurringInvoice
All follow the same pattern: `LedgerService` balance accessors, `items` hasMany, `customer`/`supplier` belongsTo Party. `RecurringInvoice` appends computed `amount` from JSON `items`; `next_run_date`/`last_run_at` drive scheduling.

## ParkedSale
Held-cart POS model. Casts `cart_data` array, `expires_at` datetime. Scope `scopeActive`. `isExpired()`, `getItemsCountAttribute`, `getTotalAmountAttribute`.

## GiftCard / CustomCharge
`GiftCard`: `deduct($amount)` throws if insufficient, `isUsable()`. `CustomCharge`: `calculateAmount($subtotal)` (percentage or flat).

## Related
- [[Sale Lifecycle - V3 SaleService]]
- [[FIFO Inventory System]]
- [[Core Tables - Sales & Purchases]]

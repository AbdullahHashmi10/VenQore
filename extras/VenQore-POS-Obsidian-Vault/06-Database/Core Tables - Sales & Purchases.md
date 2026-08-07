---
tags: [database, sales, purchases]
---

# Core Tables — Sales & Purchases

Part of [[VenQore POS - Home]] · [[Database Schema Overview]]

## `sales` (current generation)
uuid PK, `reference_number` unique, `customer_id` FK nullOnDelete, `user_id` FK (cashier), `warehouse_id` FK. `subtotal/tax/discount/total` decimal(10,2). `status` default `completed` (`completed, pending, returned`), `payment_status` default `paid` (`paid, partial, unpaid`), `payment_method`. Soft deletes.
Dozens of additive migrations: `due_date`, FBR fields, financial waterfall columns, revenue-recognition status phase, VenSynQ/JIT ecommerce fields, waybill fields, `charges`, `idempotency_key`, `client_sale_id`, `source_order_id` (V3), `tenant_id`.

## `sale_items`
`sale_id` FK cascade, `product_id` FK, `product_variant_id` FK nullable, `quantity`, `unit_price`, `subtotal` decimal(10,2). Later: `cost_price`, `returned_quantity`, decimal quantity conversion.

## `customers` / `suppliers`
`customers`: uuid PK, `name/email/phone/address`, `loyalty_points` int, soft deletes; later gets `party_id` link (convergence with unified `Party` model).
`suppliers`: uuid PK, `name/contact_person/email/phone/address/tax_id/notes`, soft deletes.

## `purchases` / `purchase_items` (current generation)
`purchases`: uuid PK, `party_id`, `warehouse_id` (raw uuid, no FK constraint declared), `invoice_number` nullable, `purchase_date`, `subtotal/tax/total` decimal(15,2), `payment_status` default `unpaid`, `payment_method`, `journal_entry_id`, `user_id`, `created_by`.
`purchase_items`: `purchase_id`, `product_id`, `qty` decimal(10,4), `unit_cost` decimal(15,2), `tax_rate` decimal(5,2), `business_pct` decimal(5,2) default 100 (personal-vs-business expense split), `line_total`, `inventory_batch_id` nullable.
Later gets `tenant_id`, JIT fields.

## `purchase_orders` / `purchase_order_items` (earlier generation, PO workflow)
`purchase_orders`: `supplier_id`, `warehouse_id` FKs cascade, `reference_number` unique, `status` default `draft` (`draft, ordered, received, cancelled`), `order_date`, `expected_delivery_date`, `total_amount` decimal(15,2).
`purchase_order_items`: `quantity`, `unit_cost`, `total_cost`, `received_quantity` decimal(15,2).

## `payments` (current)
`sale_id` FK cascade, `amount` decimal(10,2), `method`, `reference`, `bank_account_id` FK (added later).

## `payment_allocations` — ★ the trigger-guarded table
uuid PK. `payment_journal_entry_id` char(36) nullable, indexed as `pa_pje_idx` — **FK is a journal_entries UUID, not a payments UUID**. `sale_id`, `purchase_id` char(36) nullable indexed. `allocated_amount` decimal(15,2). `status` enum `active, reversed, written_off` default `active`.
See [[PaymentAllocation Trigger]] for the full trigger logic and its practical implication.

## `transactions` / `transaction_allocations` (legacy V1, still present)
`party_id` FK, `invoice_id`, `amount`, `type` enum `debit|credit`, `running_balance`. Superseded by the `sales`/`purchases`/`payment_allocations` model.

## `invoices` / `invoice_items` (legacy V1, still present)
`invoice_number` unique, `party_id`, `type` enum `sale|purchase|sale_return|purchase_return|estimate`, `status` enum `paid|unpaid|partial`, `subtotal/discount_amount/tax_amount/round_off/total_amount`. A parallel `invoices`/`sales_orders` line still runs alongside `sales`.

## `parked_sales`
`cart_data` json (entire cart state), `user_id`, `customer_name`, `expires_at`.

## `parties` (legacy unified model)
uuid PK, `name`, `phone`, `type` enum `customer|supplier`, `opening_balance`, `current_balance`, `credit_limit` nullable, `payment_terms`, `default_discount`. Coexists with the newer `customers`/`suppliers` split tables.

## Related
- [[PaymentAllocation Trigger]]
- [[Models - Transactions & Sales]]
- [[Sale Lifecycle - V3 SaleService]]

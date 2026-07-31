---
tags: [models, parties, customers, suppliers]
---

# Models — Parties (Customers & Suppliers)

Part of [[VenQore POS - Home]]

## Party (`Party.php`) — ★ unified customer/supplier entity
`SoftDeletes`. Fillable: `name, phone, email, type, category, sub_category, address, notes, opening_balance, opening_balance_type, current_balance, credit_limit, payment_terms, default_discount`.
Relations: `invoices` hasMany Invoice, `payments` hasMany Payment, `transactions` hasMany Transaction.

## Customer (`Customer.php`) — secondary/legacy table
Fillable: `party_id, name, email, phone, address`; `sales` hasMany Sale. Later gets a `party_id` FK link (per migrations), suggesting convergence toward the unified `Party` model over time.

## Supplier (`Supplier.php`) — secondary/legacy table
`$guarded=[]`; `purchaseOrders` hasMany PurchaseOrder.

> [!note] Data model tension
> Both a unified `Party` model and split `Customer`/`Supplier` tables exist simultaneously in the schema (see [[Core Tables - Multi-Tenancy]] / schema notes) — a re-consolidation toward `Party` appears to be in progress, evidenced by `customers.party_id` being added in a later migration.

## Related
- [[Models - Transactions & Sales]]
- [[V3 Accounting Engine]] (PartyService, party_snapshots)

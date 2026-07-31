---
tags: [models, accounting, ledger]
---

# Models — Accounting & Ledger

Part of [[VenQore POS - Home]] · [[V3 Accounting Engine]]

## Account (`Account.php`) — Chart of Accounts
`SoftDeletes`. `booted()` prevents duplicate `code` per tenant on create. Self-referencing `parent`/`children`. `getBalanceAttribute` — dynamically computed **live** balance from non-reversed journal_items rather than trusting the cached column (unless no journal items exist).

## JournalEntry / JournalItem
`JournalEntry`: `$guarded=['id']`. Casts `date`, `is_reversed` boolean. Relations: `items`, `createdBy`/`approvedBy`, `party`.
`JournalItem`: `journal_entry_id, account_id, party_id, debit, credit, description`.

## Payment
Fillable: `party_id, sale_id, amount, date, method, type, reference, notes, bank_account_id, cheque_date`.
`booted()`: on `created`/`deleted` calls `updatePartyBalance()` to increment/decrement `Party.current_balance`.

## PaymentAllocation — ★ trigger-guarded
Links a payment (via `payment_journal_entry_id` — must point to a `JournalEntry` ID) to a Sale or Purchase(Invoice). See [[PaymentAllocation Trigger]] for the MySQL trigger enforcing over-allocation prevention.

## Expense / ExpenseCategory
`Expense`: covers category, amount, tax, bank_account, payee, landed-cost allocation fields. `ExpenseCategory`: scopes `scopeActive`, `scopeByGroup`.

## FundTransaction
Inter-account fund transfers/adjustments. `getTypeLabel()` maps type→human label.

## BankAccount
Method `v3Balance()` — for cash accounts sums journal_items against Account code `1000` (GL is sole source of truth); for banks, computes from `opening_balance + payments + fund_transactions − expenses`.

## DailySnapshot
Daily rollup metrics: `sales_value, purchases_value, stock_value, payables_value, receivables_value, cash_value, expense_value, note`.

## LoyaltyBalance / LoyaltyPoint / StoreCredit / StoreCreditBalance
Static `awardPoints()`/`redeemPoints()` (loyalty) and `addCredit()`/`useCredit()` (store credit) — both use DB-transaction + `lockForUpdate()` and write an append-only ledger row; throw on insufficient balance.

## CustomerAnalytics
Precomputed per-party stats (`total_orders, total_spent, average_order_value, avg_days_between_orders, last_order_date, predicted_next_order, status`). Requires explicit `tenant_id` fillable (per a "WOUND 3 FIX" comment — a past cross-tenant leak).

## Related
- [[V3 Accounting Engine]]
- [[PaymentAllocation Trigger]]
- [[Core Tables - Accounting]]

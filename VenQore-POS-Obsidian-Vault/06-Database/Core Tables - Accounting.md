---
tags: [database, accounting]
---

# Core Tables — Accounting

Part of [[VenQore POS - Home]] · [[Database Schema Overview]] · [[V3 Accounting Engine]]

## `accounts` — Chart of Accounts
uuid PK, `name`, `code` unique, `type` enum `asset, liability, equity, income, expense`, `parent_id` self-FK cascade, `balance` decimal(20,2) default 0, `is_active`.
V3 foundation adds `normal_balance` (debit/credit) and seeds 25 new accounts: WIP, Advance to Supplier, Employee Advance, Prepaid Expenses, Fixed Assets, Accumulated Depreciation, Customer Advance, Input Tax Recoverable, Salary Payable, Loan Payable, Retained Earnings, Stock Adjustment Gain/Loss, Purchase Expense, Charity Expense, Manufacturing Cost, Applied Manufacturing Labor, Loan Interest Expense, Depreciation Expense, Bad Debt Expense, Gratuity & Severance, Cash Shortage Loss, Disaster Loss, Insurance Recovery, Opening Balance Equity.
Note: `contra_asset` type maps to `asset` since the enum has no such value.

## `journal_entries`
uuid PK, `date`, `reference`, `description`, `user_id` FK cascade.
V3 adds: `idempotency_key` (unique), `approved_by`, `narration`, `is_reversed` boolean, `reversed_by`, `reference_type`.

## `journal_items`
uuid PK, `journal_entry_id` FK cascade, `account_id` FK cascade, `debit`/`credit` decimal(20,2) default 0, `description`. V3 adds `party_id`. Gets `tenant_id`.

## `bank_accounts`
uuid PK, `name`, `account_number`, `type` enum `cash, bank, mobile_wallet`, `opening_balance`/`current_balance` decimal(12,2).

## `expenses`
uuid PK, `category`, `amount` decimal(10,2), `date`, `bank_account_id` FK nullOnDelete, `description`.

## `party_snapshots` (V3)
Cached balance table, rebuilt by `PartyService` after every ledger entry. `party_id` indexed, `account_id` nullable indexed, `account_code`(10), `cached_balance` decimal(15,2), `last_journal_id`, `last_updated_at`. Unique `[party_id, account_code]`.

## `discount_limits` (V3)
`role` unique, `max_discount_percent` decimal(5,2). Seeded: cashier 10%, manager 50%, admin 100%.

## `disaster_claims` (V3)
`description`, `loss_journal_entry_id`, `recovery_journal_entry_id`, `loss_amount`/`recovery_amount` decimal(15,2), `status` enum `loss_recorded, recovery_pending, closed`.

## `system_settings` (V3)
Key-value global config: `roundoff_tolerance` (1.00), `period_lock_date` (null), `max_future_days` (30).

## `transaction_sequences`
Per-tenant invoice numbering counters.

## Money Standardization Pass
`2026_06_21_130243_standardize_all_money_columns_to_20_4.php` widens most monetary columns across `accounts`, `bank_accounts`, `batches`, `parties`, `sales`, etc. to `decimal(20,4)`, with pre-migration sanitization steps to avoid MySQL error 1292 on cast during the widen.

## Related
- [[V3 Accounting Engine]]
- [[Models - Accounting & Ledger]]
- [[PaymentAllocation Trigger]]

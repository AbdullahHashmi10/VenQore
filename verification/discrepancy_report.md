# VenQore Ledger Truth Audit Report

> **Generated:** 2026-08-04 00:17:41 PKT  
> **Tenant:** Golden Audit Store (`golden-audit`)  
> **Audit Date:** 2026-08-04  
> **Audit Period Seeded:** 2025-01-01 → 2026-08-04  

## Summary

| Status | Count |
|--------|-------|
| 🔢 Total Routes Scanned | **248** |
| ✅ Passed | 186 |
| ⚠️ All Zeros (Suspicious) | 54 |
| ❌ Mismatched vs Ledger | 0 |
| 🔴 HTTP Errors / Exceptions | 4 |
| ⏭️ Skipped | 0 |

## Ledger Control Values (Single Source of Truth)

| Key | Value (PKR) |
|-----|------------|
| `revenue_month` | 449,876.14 |
| `gross_profit_month` | 79,988.77 |
| `net_profit_month` | 7,970.86 |
| `operating_expenses_month` | 72,017.91 |
| `cogs_month` | 369,887.37 |
| `revenue_ytd` | 449,876.14 |
| `gross_profit_ytd` | 79,988.77 |
| `net_profit_ytd` | 7,970.86 |
| `receivables` | 6,971,965.12 |
| `payables` | 11,858,827.30 |
| `sales_tax_collected` | 76,478.98 |
| `input_tax_recoverable` | 9,508.95 |
| `tax_output_ytd` | 76,478.98 |
| `tax_input_ytd` | 9,508.95 |
| `purchases_month` | 65,443.93 |
| `purchases_ytd` | 65,443.93 |
| `cash_inflow_ytd` | 4,158,326.57 |
| `cash_outflow_ytd` | 87,201.80 |
| `expenses_ytd` | 72,017.91 |
| `trial_balance_total_debit` | 4,900,567.55 |
| `trial_balance_total_credit` | 4,900,567.55 |
| `assets_total` | 4,144,709.88 |
| `liabilities_total` | 126,739.02 |
| `inventory_value` | 2,549,718.61 |

## ⚠️ WARNING: Pages Showing All-Zero Financial Data

> These pages loaded OK but every financial prop is **0**. This indicates the data source may be bypassing the Ledger.

| # | Route | URI |
|---|-------|-----|
| 1 | `store.create-or-join` | `start` |
| 2 | `store.join` | `join` |
| 3 | `store.setup` | `s/{store_slug}/setup` |
| 4 | `store.pos` | `s/{store_slug}/pos` |
| 5 | `store.staff` | `s/{store_slug}/staff` |
| 6 | `store.billing.payment-history` | `s/{store_slug}/billing/payment-history` |
| 7 | `store.settings` | `s/{store_slug}/settings` |
| 8 | `store.smart-capture.aliases` | `s/{store_slug}/smart-capture/aliases` |
| 9 | `store.trial.expired` | `s/{store_slug}/trial-expired` |
| 10 | `store.admin.settings` | `s/{store_slug}/admin/settings` |
| 11 | `store.admin.users` | `s/{store_slug}/admin/users` |
| 12 | `store.admin.logs` | `s/{store_slug}/admin/logs` |
| 13 | `store.admin.data` | `s/{store_slug}/admin/data-management` |
| 14 | `store.admin.recycle-bin.index` | `s/{store_slug}/admin/recycle-bin` |
| 15 | `store.admin.vena.tickets` | `s/{store_slug}/admin/vena-tickets` |
| 16 | `store.home` | `s/{store_slug}/home` |
| 17 | `store.stock-operations` | `s/{store_slug}/stock-operations` |
| 18 | `store.activity-log.index` | `s/{store_slug}/activity-log` |
| 19 | `store.labels.index` | `s/{store_slug}/labels` |
| 20 | `store.reports.index` | `s/{store_slug}/reports` |
| 21 | `store.reports.day-book` | `s/{store_slug}/reports/day-book` |
| 22 | `store.reports.low-stock` | `s/{store_slug}/reports/low-stock` |
| 23 | `store.reports.expiry` | `s/{store_slug}/reports/expiry` |
| 24 | `store.growth-engine.dashboard` | `s/{store_slug}/growth-engine/dashboard` |
| 25 | `store.growth-engine.scorecard` | `s/{store_slug}/growth-engine/scorecard` |
| 26 | `store.attributes.index` | `s/{store_slug}/attributes` |
| 27 | `store.production.index` | `s/{store_slug}/inventory/production` |
| 28 | `store.customers.create` | `s/{store_slug}/customers/create` |
| 29 | `store.sales.invoice.create` | `s/{store_slug}/sales/invoice/create` |
| 30 | `store.presales.create` | `s/{store_slug}/sales/presale/create` |
| 31 | `store.manufacturing.rules` | `s/{store_slug}/manufacturing/rules` |
| 32 | `store.legacy.admin.data` | `s/{store_slug}/admin-panel/data-management` |
| 33 | `store.legacy.admin.settings` | `s/{store_slug}/admin-panel/settings` |
| 34 | `store.legacy.admin.logs` | `s/{store_slug}/admin-panel/logs` |
| 35 | `store.legacy.admin.database` | `s/{store_slug}/admin-panel/database` |
| 36 | `store.staff-attendance.index` | `s/{store_slug}/staff-attendance` |
| 37 | `store.notifications.index` | `s/{store_slug}/notifications` |
| 38 | `store.profile.edit` | `s/{store_slug}/profile` |
| 39 | `store.returns.create` | `s/{store_slug}/returns/create` |
| 40 | `store.stock-transfers.create` | `s/{store_slug}/stock-transfers/create` |
| 41 | `store.stock-transfers.show` | `s/{store_slug}/stock-transfers/{id}` |
| 42 | `store.stock-takes.show` | `s/{store_slug}/stock-audit/{id}` |
| 43 | `store.batches.index` | `s/{store_slug}/batches` |
| 44 | `store.bank-reconciliation.index` | `s/{store_slug}/bank-reconciliation` |
| 45 | `store.invoice-reminders.index` | `s/{store_slug}/invoice-reminders` |
| 46 | `store.staff.attendance.index` | `s/{store_slug}/staff/attendance` |
| 47 | `store.marketing-campaigns.index` | `s/{store_slug}/marketing/campaigns` |
| 48 | `store.online-store.index` | `s/{store_slug}/online-store-manager` |
| 49 | `store.e-invoicing.index` | `s/{store_slug}/e-invoicing` |
| 50 | `store.v3.products.create` | `s/{store_slug}/v3/products/create` |
| 51 | `store.v3.warehouses.index` | `s/{store_slug}/v3/warehouses` |
| 52 | `store.v3.warehouses.create` | `s/{store_slug}/v3/warehouses/create` |
| 53 | `store.v3.warehouses.edit` | `s/{store_slug}/v3/warehouses/{warehouse}/edit` |
| 54 | `store.v3.opening-balances.status` | `s/{store_slug}/v3/opening-balances/status` |

### Zero-Page Financial Props Detail

**`store.create-or-join`**
```
  settings.tax_rate: 0
```

**`store.join`**
```
  settings.tax_rate: 0
```

**`store.setup`**
```
  settings.tax_rate: 0
```

**`store.pos`**
```
  settings.tax_rate: 0
```

**`store.staff`**
```
  settings.tax_rate: 0
```

**`store.billing.payment-history`**
```
  invoice_count: 0
```

**`store.settings`**
```
  settings.tax_rate: 0
```

**`store.smart-capture.aliases`**
```
  stats.total: 0
```

**`store.trial.expired`**
```
  settings.tax_rate: 0
```

**`store.admin.settings`**
```
  settings.tax_rate: 0
```

**`store.admin.users`**
```
  settings.tax_rate: 0
  staffData.sum_totalSales: 0
  staffData.total_totalSales: 0
  staffData.sum_monthSales: 0
  staffData.total_monthSales: 0
```

**`store.admin.logs`**
```
  settings.tax_rate: 0
```

**`store.admin.data`**
```
  settings.tax_rate: 0
```

**`store.admin.recycle-bin.index`**
```
  settings.tax_rate: 0
```

**`store.admin.vena.tickets`**
```
  settings.tax_rate: 0
  tickets.total: 0
```

**`store.home`**
```
  settings.tax_rate: 0
```

**`store.stock-operations`**
```
  settings.tax_rate: 0
```

**`store.activity-log.index`**
```
  settings.tax_rate: 0
```

**`store.labels.index`**
```
  settings.tax_rate: 0
```

**`store.reports.index`**
```
  settings.tax_rate: 0
```

**`store.reports.day-book`**
```
  settings.tax_rate: 0
  stats.total_in: 0
  stats.total_out: 0
  stats.net_cash: 0
```

**`store.reports.low-stock`**
```
  settings.tax_rate: 0
  stats.total_shortage: 0
```

**`store.reports.expiry`**
```
  settings.tax_rate: 0
  stats.total_batches: 0
  stats.total_quantity: 0
```

**`store.growth-engine.dashboard`**
```
  stats.total_signals: 0
  stats.potential_revenue: 0
  stats.realised_value: 0
  stats.by_brain.sum_value: 0
  stats.by_brain.total_value: 0
```

**`store.growth-engine.scorecard`**
```
  total_generated: 0
  total_acted: 0
  total_graded: 0
  realised_value: 0
```

**`store.attributes.index`**
```
  settings.tax_rate: 0
```

**`store.production.index`**
```
  settings.tax_rate: 0
  productionRuns.total: 0
  stats.month_cost: 0
```

**`store.customers.create`**
```
  settings.tax_rate: 0
```

**`store.sales.invoice.create`**
```
  settings.tax_rate: 0
```

**`store.presales.create`**
```
  settings.tax_rate: 0
```

**`store.manufacturing.rules`**
```
  settings.tax_rate: 0
```

**`store.legacy.admin.data`**
```
  settings.tax_rate: 0
```

**`store.legacy.admin.settings`**
```
  settings.tax_rate: 0
```

**`store.legacy.admin.logs`**
```
  settings.tax_rate: 0
```

**`store.legacy.admin.database`**
```
  settings.tax_rate: 0
```

**`store.staff-attendance.index`**
```
  settings.tax_rate: 0
```

**`store.notifications.index`**
```
  settings.tax_rate: 0
  notifications.total: 0
```

**`store.profile.edit`**
```
  settings.tax_rate: 0
```

**`store.returns.create`**
```
  settings.tax_rate: 0
```

**`store.stock-transfers.create`**
```
  settings.tax_rate: 0
```

**`store.stock-transfers.show`**
```
  settings.tax_rate: 0
```

**`store.stock-takes.show`**
```
  settings.tax_rate: 0
```

**`store.batches.index`**
```
  settings.tax_rate: 0
  batches.total: 0
  stats.total_batches: 0
  stats.total_quantity: 0
```

**`store.bank-reconciliation.index`**
```
  settings.tax_rate: 0
```

**`store.invoice-reminders.index`**
```
  settings.tax_rate: 0
  reminders.total: 0
  stats.total: 0
```

**`store.staff.attendance.index`**
```
  settings.tax_rate: 0
```

**`store.marketing-campaigns.index`**
```
  settings.tax_rate: 0
```

**`store.online-store.index`**
```
  settings.tax_rate: 0
```

**`store.e-invoicing.index`**
```
  settings.tax_rate: 0
```

**`store.v3.products.create`**
```
  settings.tax_rate: 0
```

**`store.v3.warehouses.index`**
```
  settings.tax_rate: 0
```

**`store.v3.warehouses.create`**
```
  settings.tax_rate: 0
```

**`store.v3.warehouses.edit`**
```
  settings.tax_rate: 0
```

**`store.v3.opening-balances.status`**
```
  balance_7000: 0
```

## 🔴 HTTP Errors

| Route | Code | Snippet |
|-------|------|--------|
| `store.growth-engine.show` | 404 |  |
| `store.vensynq.health` | 404 |  |
| `store.vensynq.money-pipeline` | 404 |  |
| `store.vensynq.payouts` | 404 |  |

## Full Scan Results (248 routes)

| Route | Status | Code | Financial Props |
|-------|--------|------|----------------|
| `store.create-or-join` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plans.sum_annual_total`=2,280.00, `plans.total_annual_total`=2,280.00 |
| `store.join` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.` | ↩ REDIRECT | 302 | – |
| `store.setup` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.terminal-pairing.index` | ✅ PASS | 200 | – |
| `store.pos` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.staff` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.billing` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plans.sum_limits.profit_peek`=4.00, `plans.total_limits.profit_peek`=4.00 (+118 more) |
| `store.billing.payment-history` | ⚠️ ALL_ZEROS | 200 | `invoice_count`=0.00 |
| `store.settings` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.smart-capture.context` | ✅ PASS | 200 | `learning.total`=0.00, `open_documents.proposal.sum_total`=5,000.00, `open_documents.proposal.total_total`=5,000.00 (+4 more) |
| `store.smart-capture.settings` | ✅ PASS | 200 | – |
| `store.smart-capture.aliases` | ⚠️ ALL_ZEROS | 200 | `stats.total`=0.00 |
| `store.trial.expired` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.notifications.plan.unread` | 📄 NON_JSON | 200 | – |
| `store.admin.home` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.total_users`=3.00 |
| `store.admin.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.net_profit`=0.00, `stats.total_revenue`=0.00 (+17 more) |
| `store.admin.settings` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.admin.users` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00, `staffData.sum_totalSales`=0.00, `staffData.total_totalSales`=0.00 (+2 more) |
| `store.admin.staff` | ↩ REDIRECT | 302 | – |
| `store.admin.attendance` | ↩ REDIRECT | 302 | – |
| `store.admin.logs` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.admin.data` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.admin.data.template` | ↩ REDIRECT | 302 | – |
| `store.admin.recycle-bin.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.admin.chatbot.settings` | ↩ REDIRECT | 302 | – |
| `store.admin.chatbot.inbox` | ↩ REDIRECT | 302 | – |
| `store.admin.chatbot.sessions` | ↩ REDIRECT | 302 | – |
| `store.admin.chatbot.assist-suggestion` | ↩ REDIRECT | 302 | – |
| `store.admin.chatbot.canned-responses` | ↩ REDIRECT | 302 | – |
| `store.admin.vena.tickets` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00, `tickets.total`=0.00 |
| `store.inventory.search` | ✅ PASS | 200 | – |
| `store.customers.search` | ✅ PASS | 200 | – |
| `store.sales.parked` | ✅ PASS | 200 | – |
| `store.sales.recall` | ✅ PASS | 200 | – |
| `store.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `revenue`=449,876.14, `performance.Today.sales`=0.00 (+68 more) |
| `store.home` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.dashboard-v1` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `revenue`=449,876.14, `performance.Today.sales`=0.00 (+68 more) |
| `store.inventory.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.total_products`=15.00, `stats.inventory_value`=2,549,718.61 (+4 more) |
| `store.inventory.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.data.sum_cost_price`=91,953.28, `products.data.total_cost_price`=91,953.28 (+3 more) |
| `store.inventory.reservations` | 📄 NON_JSON | 200 | – |
| `store.inventory.history` | ✅ PASS | 200 | – |
| `store.stock-operations` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.activity-log.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.suppliers.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `suppliers.total`=6.00 |
| `store.purchase-orders.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 |
| `store.purchase-orders.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `orders.data.sum_total_amount`=5,000.00, `orders.data.total_total_amount`=5,000.00 (+1 more) |
| `store.purchase-orders.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `order.total_amount`=5,000.00 |
| `store.purchase-orders.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchaseOrder.total_amount`=5,000.00, `products.sum_cost_price`=91,953.28 (+1 more) |
| `store.proposals.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `proposals.data.sum_total_amount`=5,000.00, `proposals.data.total_total_amount`=5,000.00 (+15 more) |
| `store.proposals.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `customers.sum_opening_balance`=0.00, `customers.total_opening_balance`=0.00 (+14 more) |
| `store.sales-orders.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `orders.data.sum_total_amount`=1,000.00, `orders.data.total_total_amount`=1,000.00 (+36 more) |
| `store.sales-orders.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `customers.sum_opening_balance`=0.00, `customers.total_opening_balance`=0.00 (+12 more) |
| `store.labels.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.reports.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.reports.daily-sales` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_revenue`=449,876.14, `data.total_revenue`=449,876.14 (+10 more) |
| `store.reports.sales` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `sales.sum_subtotal`=526,355.12, `sales.total_subtotal`=526,355.12 (+86 more) |
| `store.reports.purchases` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchases.sum_subtotal`=55,934.98, `purchases.total_subtotal`=55,934.98 (+21 more) |
| `store.reports.day-book` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00, `stats.total_in`=0.00, `stats.total_out`=0.00 (+1 more) |
| `store.reports.profit-loss` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.revenue`=449,876.14, `stats.cogs`=369,887.37 (+8 more) |
| `store.reports.party-statement` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `openingBalance`=0.00, `closingBalance`=0.00 (+6 more) |
| `store.reports.transactions` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `transactions.data.sum_amount`=5,079,840.83, `transactions.data.total_amount`=5,079,840.83 (+1 more) |
| `store.reports.expenses` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `expenses.sum_amount`=72,017.91, `expenses.total_amount`=72,017.91 (+2 more) |
| `store.reports.account-ledger` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `openingBalance`=0.00, `accounts.sum_balance`=57,993,808.68 (+1 more) |
| `store.reports.tax` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `tax_records.sum_taxable_amount`=0.00, `tax_records.total_taxable_amount`=0.00 (+6 more) |
| `store.reports.bank-statement` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `opening_balance`=0.00, `closing_balance`=0.00 (+2 more) |
| `store.reports.stock-valuation` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_unit_cost`=88,333.45, `products.total_unit_cost`=88,333.45 (+10 more) |
| `store.reports.low-stock` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00, `stats.total_shortage`=0.00 |
| `store.reports.movement-history` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 (+4 more) |
| `store.reports.expiry` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00, `stats.total_batches`=0.00, `stats.total_quantity`=0.00 |
| `store.reports.balance-sheet` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `assets.accounts.sum_balance`=18,346,966.54, `assets.accounts.total_balance`=18,346,966.54 (+10 more) |
| `store.reports.all-parties` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_balance`=19,021,539.34, `data.total_balance`=19,021,539.34 (+2 more) |
| `store.reports.trial-balance` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `accounts.sum_debit`=28,996,904.34, `accounts.total_debit`=28,996,904.34 (+6 more) |
| `store.reports.item-wise-profit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `items.sum_revenue`=449,876.14, `items.total_revenue`=449,876.14 (+14 more) |
| `store.reports.party-wise-profit-loss` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_invoice_count`=16.00, `data.total_invoice_count`=16.00 (+8 more) |
| `store.reports.discount` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `invoices.sum_subtotal`=526,355.12, `invoices.total_subtotal`=526,355.12 (+31 more) |
| `store.reports.cash-flow` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `operating`=4,071,124.77, `investing`=0.00 (+3 more) |
| `store.reports.sale-aging` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `invoices.sum_amount`=6,189,422.04, `invoices.total_amount`=6,189,422.04 |
| `store.reports.sale-orders` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `orders.sum_total_amount`=1,000.00, `orders.total_total_amount`=1,000.00 (+16 more) |
| `store.reports.bill-wise-profit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `invoices.sum_net_revenue`=449,876.14, `invoices.total_net_revenue`=449,876.14 (+4 more) |
| `store.reports.expense-by-category` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_total`=72,017.91, `data.total_total`=72,017.91 (+4 more) |
| `store.reports.expense-by-item` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_amount`=72,017.91, `data.total_amount`=72,017.91 (+2 more) |
| `store.reports.stock-summary-by-category` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_total_stock`=1,500.00, `data.total_total_stock`=1,500.00 (+6 more) |
| `store.reports.item-detail` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 (+4 more) |
| `store.reports.loan-statement` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `opening_balance`=0.00, `closing_balance`=0.00 (+2 more) |
| `store.reports.tax-rate` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_tax_rate`=17.00, `data.total_tax_rate`=17.00 (+8 more) |
| `store.reports.sale-purchase-by-party` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_sales`=449,876.14, `data.total_sales`=449,876.14 (+4 more) |
| `store.reports.item-report-by-party` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_total`=449,876.14, `data.total_total`=449,876.14 (+2 more) |
| `store.reports.party-report-by-item` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_total`=449,876.14, `data.total_total`=449,876.14 (+2 more) |
| `store.reports.sale-purchase-by-item-category` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_sales`=449,876.14, `data.total_sales`=449,876.14 (+2 more) |
| `store.reports.item-category-wise-profit-loss` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_revenue`=449,876.14, `data.total_revenue`=449,876.14 (+52 more) |
| `store.reports.item-wise-discount` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_total_sales`=449,876.14, `data.total_total_sales`=449,876.14 (+2 more) |
| `store.reports.sale-order-items` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `items.sum_subtotal`=4,250.00, `items.total_subtotal`=4,250.00 |
| `store.reports.stock-aging` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_cost_value`=2,549,718.61, `data.total_cost_value`=2,549,718.61 (+4 more) |
| `store.reports.sale-purchase-by-party-group` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_sales`=526,355.12, `data.total_sales`=526,355.12 (+6 more) |
| `store.reports.analytics` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `trendData.sum_sales`=449,876.14, `trendData.total_sales`=449,876.14 (+4 more) |
| `store.reports.point-in-time-inventory` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_unit_cost`=88,695.59, `data.total_unit_cost`=88,695.59 (+4 more) |
| `store.reports.point-in-time-inventory.details` | ✅ PASS | 200 | – |
| `store.reports.customer-insights` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_invoice_count`=16.00, `data.total_invoice_count`=16.00 (+6 more) |
| `store.reports.customer-insights.details` | ✅ PASS | 200 | – |
| `store.reports.supplier-insights` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_total_qty_purchased`=94.00, `data.total_total_qty_purchased`=94.00 (+10 more) |
| `store.reports.supplier-insights.details` | ✅ PASS | 200 | – |
| `store.reports.owner-daily-pulse` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `snapshots.sum_sales_value`=449,876.14, `snapshots.total_sales_value`=449,876.14 (+12 more) |
| `store.cookbook.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `recipes.sum_product.cost_price`=620.13, `recipes.total_product.cost_price`=620.13 (+10 more) |
| `store.cookbook.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 |
| `store.cookbook.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 (+2 more) |
| `store.growth-engine.index` | ↩ REDIRECT | 302 | – |
| `store.growth-engine.dashboard` | ⚠️ ALL_ZEROS | 200 | `stats.total_signals`=0.00, `stats.potential_revenue`=0.00, `stats.realised_value`=0.00 (+2 more) |
| `store.growth-engine.show` | 🔴 HTTP_ERROR | 404 | – |
| `store.growth-engine.scorecard` | ⚠️ ALL_ZEROS | 200 | `total_generated`=0.00, `total_acted`=0.00, `total_graded`=0.00 (+1 more) |
| `store.growth-engine.settings` | ✅ PASS | 200 | `settings.min_order_value_filter`=5,000.00, `settings.loyalty_points_per_amount`=100.00, `scorecard.total_generated`=0.00 (+5 more) |
| `store.global.search` | 📄 NON_JSON | 200 | – |
| `store.ai.recommendations` | ✅ PASS | 200 | – |
| `store.ai.smart-reorder` | ✅ PASS | 200 | – |
| `store.ai.cash-flow-forecast` | ✅ PASS | 200 | `current_balance`=8,358,352.71, `avg_daily_net`=279.21, `forecast.sum_projected_net_change`=129,832.65 (+3 more) |
| `store.attributes.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.categories.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `categories.total`=4.00, `stats.total_categories`=4.00 (+1 more) |
| `store.inventory.stock-levels` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 (+4 more) |
| `store.bank-accounts.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `bankAccounts.sum_opening_balance`=4,000,000.00, `bankAccounts.total_opening_balance`=4,000,000.00 (+4 more) |
| `store.bank-accounts.transactions` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `bankAccount.opening_balance`=0.00, `bankAccount.current_balance`=6,449,569.11 (+1 more) |
| `store.parties.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `parties.data.sum_opening_balance`=0.00, `parties.data.total_opening_balance`=0.00 (+14 more) |
| `store.parties.ledgers` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `parties.data.sum_opening_balance`=0.00, `parties.data.total_opening_balance`=0.00 (+14 more) |
| `store.parties.ledger` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `party.opening_balance`=0.00, `party.current_balance`=0.00 (+11 more) |
| `store.parties.show` | ↩ REDIRECT | 302 | – |
| `store.expenses.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `expenses.total`=0.00, `stats.total`=0.00 (+5 more) |
| `store.vensynq.health` | 🔴 HTTP_ERROR | 404 | – |
| `store.vensynq.money-pipeline` | 🔴 HTTP_ERROR | 404 | – |
| `store.vensynq.payouts` | 🔴 HTTP_ERROR | 404 | – |
| `store.payments.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `payments.data.sum_amount`=789,973.78, `payments.data.total_amount`=789,973.78 (+7 more) |
| `store.payments.in` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `parties.sum_opening_balance`=0.00, `parties.total_opening_balance`=0.00 (+8 more) |
| `store.payments.out` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `parties.sum_opening_balance`=0.00, `parties.total_opening_balance`=0.00 (+8 more) |
| `store.purchases.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchases.data.sum_supplier.opening_balance`=0.00, `purchases.data.total_supplier.opening_balance`=0.00 (+12 more) |
| `store.purchases.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `parties.sum_opening_balance`=0.00, `parties.total_opening_balance`=0.00 (+6 more) |
| `store.purchases.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchase.subtotal`=55,934.98, `purchase.discount_amount`=0.00 (+8 more) |
| `store.purchases.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchase.subtotal`=55,934.98, `purchase.discount_amount`=0.00 (+14 more) |
| `store.purchases.receive` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchase.subtotal`=55,934.98, `purchase.discount_amount`=0.00 (+6 more) |
| `store.transactions.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `transactions.data.sum_subtotal`=14,818,799.53, `transactions.data.total_subtotal`=14,818,799.53 (+19 more) |
| `store.inventory.stock` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 (+4 more) |
| `store.pre-sales.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `orders.data.sum_total_amount`=1,000.00, `orders.data.total_total_amount`=1,000.00 (+36 more) |
| `store.pre-sales.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `customers.sum_opening_balance`=0.00, `customers.total_opening_balance`=0.00 (+12 more) |
| `store.production.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00, `productionRuns.total`=0.00, `stats.month_cost`=0.00 |
| `store.production.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 (+4 more) |
| `store.parked-sales.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `parkedSales.sum_total`=100.00, `parkedSales.total_total`=100.00 (+2 more) |
| `store.customers.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `customers.total`=8.00 |
| `store.customers.create` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.suppliers.search` | ✅ PASS | 200 | – |
| `store.parties.search` | ✅ PASS | 200 | – |
| `store.sales.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.sales_today`=0.00, `stats.sales_today_growth`=0.00 (+11 more) |
| `store.sales.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `sales.data.sum_subtotal`=10,806,765.73, `sales.data.total_subtotal`=10,806,765.73 (+78 more) |
| `store.attendance.status` | ✅ PASS | 200 | – |
| `store.sales.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `sale.subtotal`=99,740.46, `sale.subtotal_gross`=0.00 (+16 more) |
| `store.sales.invoice.create` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.presales.create` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.manufacturing.rules` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.finance` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.receivables`=6,971,965.12, `stats.payables`=11,858,827.30 (+17 more) |
| `store.finance.receivables` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `parties.sum_balance`=6,971,965.12, `parties.total_balance`=6,971,965.12 |
| `store.finance.payables` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `parties.sum_balance`=11,954,200.76, `parties.total_balance`=11,954,200.76 |
| `store.funds.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `cashAccount.balance`=6,449,569.11, `bankAccounts.sum_balance`=3,500,000.00 (+6 more) |
| `store.funds.history.ledger` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `balance`=6,449,569.11, `ledger.sum_amount`=6,882,654.73 (+1 more) |
| `store.charity.stats` | ✅ PASS | 200 | `default_amount`=10.00 |
| `store.accounting.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.total_income`=0.00, `stats.total_expense`=0.00 (+20 more) |
| `store.accounting.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `accounts.sum_balance`=57,993,808.68, `accounts.total_balance`=57,993,808.68 |
| `store.accounting.pnl` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `incomeAccounts.sum_balance`=3,890,314.51, `incomeAccounts.total_balance`=3,890,314.51 (+7 more) |
| `store.accounting.balance-sheet` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `assets.accounts.sum_balance`=18,346,966.54, `assets.accounts.total_balance`=18,346,966.54 (+10 more) |
| `store.reports.dashboard` | ↩ REDIRECT | 302 | – |
| `store.admin.panel` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.total_users`=3.00 |
| `store.legacy.admin.data` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.legacy.admin.data.template` | ↩ REDIRECT | 302 | – |
| `store.backups.index` | ↩ REDIRECT | 302 | – |
| `store.backups.progress` | ✅ PASS | 200 | – |
| `store.legacy.admin.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.net_profit`=0.00, `stats.total_revenue`=0.00 (+17 more) |
| `store.legacy.admin.migration.index` | ↩ REDIRECT | 302 | – |
| `store.legacy.admin.users` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `staffData.sum_totalSales`=11,220,578.42, `staffData.total_totalSales`=11,220,578.42 (+2 more) |
| `store.legacy.admin.settings` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.legacy.admin.logs` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.legacy.admin.database` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.legacy.admin.staff` | ↩ REDIRECT | 302 | – |
| `store.staff-attendance.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.notifications.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00, `notifications.total`=0.00 |
| `store.profile.edit` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.profile.store-members` | ✅ PASS | 200 | – |
| `store.returns-history.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `returns.data.sum_subtotal`=99,740.46, `returns.data.total_subtotal`=99,740.46 (+33 more) |
| `store.returns.create` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.returns-history.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `return.subtotal`=99,740.46, `return.subtotal_gross`=0.00 (+16 more) |
| `store.recurring-invoices.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `recurringInvoices.sum_amount`=0.00, `recurringInvoices.total_amount`=0.00 (+6 more) |
| `store.recurring-invoices.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `customers.sum_opening_balance`=0.00, `customers.total_opening_balance`=0.00 (+6 more) |
| `store.recurring-invoices.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `invoice.amount`=0.00, `invoice.customer.opening_balance`=0.00 (+10 more) |
| `store.stock-transfers.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `transfers.total`=1.00, `stats.total_transfers`=1.00 |
| `store.stock-transfers.create` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.stock-transfers.show` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.stock-transfers.edit` | ↩ REDIRECT | 302 | – |
| `store.stock-takes.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stock_takes.total`=1.00, `stats.total_audits`=1.00 |
| `store.stock-takes.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 |
| `store.stock-takes.show` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.batches.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00, `batches.total`=0.00, `stats.total_batches`=0.00 (+1 more) |
| `store.batches.show` | ↩ REDIRECT | 302 | – |
| `store.serials.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `serials.data.sum_product.cost_price`=620.13, `serials.data.total_product.cost_price`=620.13 (+6 more) |
| `store.serials.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `serial.product.cost_price`=620.13, `serial.product.tax_rate`=17.00 (+1 more) |
| `store.debit-notes.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `debitNotes.data.sum_amount`=500.00, `debitNotes.data.total_amount`=500.00 (+7 more) |
| `store.debit-notes.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `suppliers.sum_opening_balance`=0.00, `suppliers.total_opening_balance`=0.00 (+8 more) |
| `store.debit-notes.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `note.amount`=500.00, `note.supplier.opening_balance`=0.00 (+2 more) |
| `store.bank-reconciliation.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.invoice-reminders.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00, `reminders.total`=0.00, `stats.total`=0.00 |
| `store.invoice-reminders.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `invoices.sum_subtotal`=7,250,722.50, `invoices.total_subtotal`=7,250,722.50 (+30 more) |
| `store.staff.attendance.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.marketing-campaigns.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.marketing-campaigns.create` | ↩ REDIRECT | 302 | – |
| `store.online-store.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.woocommerce.index` | ↩ REDIRECT | 302 | – |
| `store.woo.plugin.download` | ↩ REDIRECT | 302 | – |
| `store.woo.connections.index` | ↩ REDIRECT | 302 | – |
| `store.woo.connections.setup` | ↩ REDIRECT | 302 | – |
| `store.woo.connections.status-json` | ↩ REDIRECT | 302 | – |
| `store.woo.connections.sync` | ↩ REDIRECT | 302 | – |
| `store.woo.connections.logs` | ↩ REDIRECT | 302 | – |
| `store.e-invoicing.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.v3.products.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_tax_rate`=255.00, `products.total_tax_rate`=255.00 |
| `store.v3.products.create` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.v3.products.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `product.cost_price`=520.15, `product.tax_rate`=17.00 (+1 more) |
| `store.v3.warehouses.index` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.v3.warehouses.create` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.v3.warehouses.edit` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00 |
| `store.v3.purchases.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchases.data.sum_total`=12,370,043.70, `purchases.data.total_total`=12,370,043.70 (+1 more) |
| `store.v3.purchases.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_tax_rate`=255.00, `products.total_tax_rate`=255.00 |
| `store.v3.purchases.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchase.subtotal`=55,934.98, `purchase.tax`=9,508.95 (+11 more) |
| `store.v3.purchases.return.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchase.subtotal`=55,934.98, `purchase.tax`=9,508.95 (+1 more) |
| `store.v3.opening-balances.status` | ⚠️ ALL_ZEROS | 200 | `balance_7000`=0.00 |
| `store.v3.suppliers.statement` | ✅ PASS | 200 | `supplier.opening_balance`=0.00, `supplier.current_balance`=0.00, `ap_balance`=-95,373.46 (+6 more) |
| `store.v3.sales.pdf` | 📄 NON_JSON | 200 | – |
| `store.v3.customers.statement` | ✅ PASS | 200 | `customer.opening_balance`=0.00, `customer.current_balance`=0.00, `customer.credit_limit`=300,000.00 (+11 more) |
| `store.v3.products.uom.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `product.cost_price`=520.15, `product.tax_rate`=17.00 (+1 more) |
| `store.v3.products.tiers.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `product.cost_price`=520.15, `product.tax_rate`=17.00 (+1 more) |
| `store.v3.reports.trial-balance` | ✅ PASS | 200 | `rows.sum_total_debit`=5,079,840.83, `rows.total_total_debit`=5,079,840.83, `rows.sum_total_credit`=5,079,840.83 (+5 more) |
| `store.v3.reports.profit-loss` | ✅ PASS | 200 | `revenue`=449,876.14, `cogs`=369,887.37, `gross_profit`=79,988.77 (+7 more) |
| `store.v3.reports.balance-sheet` | ✅ PASS | 200 | `assets.accounts.sum_balance`=4,144,709.88, `assets.accounts.total_balance`=4,144,709.88, `assets.total`=4,144,709.88 (+9 more) |
| `store.v3.reports.cash-flow` | ✅ PASS | 200 | `operating.sum_net`=4,071,124.77, `operating.total_net`=4,071,124.77, `net_operating`=4,071,124.77 (+3 more) |
| `store.v3.reports.aged-receivables` | ✅ PASS | 200 | `rows.sum_total`=378,028.55, `rows.total_total`=378,028.55, `rows.sum_balance`=378,028.55 (+2 more) |
| `store.v3.reports.aged-payables` | ✅ PASS | 200 | `rows.sum_total`=50,260.04, `rows.total_total`=50,260.04, `rows.sum_balance`=50,260.04 (+2 more) |
| `store.v3.reports.sales` | ✅ PASS | 200 | `rows.sum_tax_rate`=527.00, `rows.total_tax_rate`=527.00, `rows.sum_line_total`=526,355.12 (+7 more) |
| `store.v3.reports.purchases` | ✅ PASS | 200 | `rows.sum_unit_cost`=1,192.37, `rows.total_unit_cost`=1,192.37, `rows.sum_line_total`=65,443.93 (+2 more) |
| `store.v3.reports.inventory-valuation` | ✅ PASS | 200 | `rows.sum_total_qty`=824.00, `rows.total_total_qty`=824.00, `rows.sum_unit_cost`=88,333.45 (+11 more) |
| `store.v3.reports.cogs` | ✅ PASS | 200 | `rows.sum_total_qty_sold`=13.00, `rows.total_total_qty_sold`=13.00, `rows.sum_total_cogs`=7,910.02 (+2 more) |
| `store.v3.reports.gross-profit` | ✅ PASS | 200 | – |
| `store.v3.reports.tax` | ✅ PASS | 200 | `output_tax`=76,478.98, `input_tax`=9,508.95, `net_payable`=66,970.03 (+4 more) |
| `store.v3.reports.party-ledger` | ✅ PASS | 200 | `opening_balance`=0.00, `lines.sum_debit`=31,474.61, `lines.total_debit`=31,474.61 (+5 more) |
| `store.v3.reports.inventory-movement` | ✅ PASS | 200 | `inflows.sum_value_in`=55,934.98, `inflows.total_value_in`=55,934.98, `outflows.sum_value_out`=7,910.02 (+1 more) |
| `store.v3.dashboard` | ✅ PASS | 200 | `receivables`=6,971,965.12, `payables`=11,858,827.30, `revenue_mtd`=0.00 (+2 more) |

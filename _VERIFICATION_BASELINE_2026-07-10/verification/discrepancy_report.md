# VenQore Ledger Truth Audit Report

> **Generated:** 2026-07-10 21:01:53 PKT  
> **Tenant:** Golden Audit Store (`golden-audit`)  
> **Audit Date:** 2026-07-10  
> **Audit Period Seeded:** 2025-01-01 → 2026-07-10  

## Summary

| Status | Count |
|--------|-------|
| 🔢 Total Routes Scanned | **154** |
| ✅ Passed | 153 |
| ⚠️ All Zeros (Suspicious) | 1 |
| ❌ Mismatched vs Ledger | 0 |
| 🔴 HTTP Errors / Exceptions | 0 |
| ⏭️ Skipped | 0 |

## Ledger Control Values (Single Source of Truth)

| Key | Value (PKR) |
|-----|------------|
| `revenue_month` | 449,876.18 |
| `gross_profit_month` | 79,896.94 |
| `net_profit_month` | 7,879.03 |
| `operating_expenses_month` | 72,017.91 |
| `cogs_month` | 369,979.24 |
| `revenue_ytd` | 449,876.18 |
| `gross_profit_ytd` | 79,896.94 |
| `net_profit_ytd` | 7,879.03 |
| `receivables` | 6,971,965.28 |
| `payables` | 11,858,825.26 |
| `sales_tax_collected` | 76,478.95 |
| `input_tax_recoverable` | 9,508.93 |
| `tax_output_ytd` | 76,478.95 |
| `tax_input_ytd` | 9,508.93 |
| `purchases_month` | 65,443.83 |
| `purchases_ytd` | 65,443.83 |
| `cash_inflow_ytd` | 4,158,326.56 |
| `cash_outflow_ytd` | 87,201.80 |
| `expenses_ytd` | 72,017.91 |
| `trial_balance_total_debit` | 4,900,659.41 |
| `trial_balance_total_credit` | 4,900,659.41 |
| `assets_total` | 4,144,617.92 |
| `liabilities_total` | 126,738.89 |
| `inventory_value` | 10,572,685.20 |

## ⚠️ WARNING: Pages Showing All-Zero Financial Data

> These pages loaded OK but every financial prop is **0**. This indicates the data source may be bypassing the Ledger.

| # | Route | URI |
|---|-------|-----|
| 1 | `store.reports.low-stock` | `s/{store_slug}/reports/low-stock` |

### Zero-Page Financial Props Detail

**`store.reports.low-stock`**
```
  settings.tax_rate: 0
  stats.total_shortage: 0
```

## Full Scan Results (154 routes)

| Route | Status | Code | Financial Props |
|-------|--------|------|----------------|
| `store.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plans.sum_annual_total`=2,280.00, `plans.total_annual_total`=2,280.00 |
| `store.` | ↩ REDIRECT | 302 | – |
| `store.billing` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `plans.sum_limits.profit_peek`=4.00, `plans.total_limits.profit_peek`=4.00 (+118 more) |
| `store.smart-capture.context` | ✅ PASS | 200 | `open_documents.proposal.sum_total`=5,000.00, `open_documents.proposal.total_total`=5,000.00, `open_documents.pre_invoice.sum_total`=1,000.00 (+3 more) |
| `store.admin.home` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.total_users`=1.00 |
| `store.admin.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.net_profit`=8,376.38, `stats.total_revenue`=8,376.38 (+17 more) |
| `store.admin.staff` | ↩ REDIRECT | 302 | – |
| `store.admin.attendance` | ↩ REDIRECT | 302 | – |
| `store.admin.chatbot.inbox` | ↩ REDIRECT | 302 | – |
| `store.admin.chatbot.sessions` | ↩ REDIRECT | 302 | – |
| `store.admin.chatbot.assist-suggestion` | ↩ REDIRECT | 302 | – |
| `store.admin.chatbot.canned-responses` | ↩ REDIRECT | 302 | – |
| `store.inventory.search` | ✅ PASS | 200 | – |
| `store.customers.search` | ✅ PASS | 200 | – |
| `store.sales.parked` | ✅ PASS | 200 | – |
| `store.sales.recall` | ✅ PASS | 200 | – |
| `store.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `revenue`=449,876.18, `performance.Today.sales`=0.00 (+68 more) |
| `store.dashboard-v1` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `revenue`=449,876.18, `performance.Today.sales`=0.00 (+68 more) |
| `store.inventory.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.total_products`=15.00, `stats.inventory_value`=10,572,685.20 (+4 more) |
| `store.inventory.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.data.sum_cost_price`=91,953.28, `products.data.total_cost_price`=91,953.28 (+3 more) |
| `store.inventory.reservations` | 📄 NON_JSON | 200 | – |
| `store.inventory.history` | ✅ PASS | 200 | – |
| `store.suppliers.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `suppliers.total`=6.00 |
| `store.purchase-orders.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `orders.data.sum_total_amount`=5,000.00, `orders.data.total_total_amount`=5,000.00 (+1 more) |
| `store.purchase-orders.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 |
| `store.purchase-orders.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `order.total_amount`=5,000.00 |
| `store.purchase-orders.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchaseOrder.total_amount`=5,000.00, `products.sum_cost_price`=91,953.28 (+1 more) |
| `store.sales-orders.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `orders.data.sum_total_amount`=1,000.00, `orders.data.total_total_amount`=1,000.00 (+36 more) |
| `store.sales-orders.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `customers.sum_opening_balance`=0.00, `customers.total_opening_balance`=0.00 (+12 more) |
| `store.reports.daily-sales` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_revenue`=449,876.18, `data.total_revenue`=449,876.18 (+10 more) |
| `store.reports.sales` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `sales.sum_subtotal`=526,355.13, `sales.total_subtotal`=526,355.13 (+84 more) |
| `store.reports.purchases` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchases.sum_subtotal`=55,934.90, `purchases.total_subtotal`=55,934.90 (+21 more) |
| `store.reports.day-book` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `transactions.sum_amount`=9,137.08, `transactions.total_amount`=9,137.08 (+3 more) |
| `store.reports.profit-loss` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.revenue`=449,876.18, `stats.cogs`=369,979.24 (+8 more) |
| `store.reports.party-statement` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `openingBalance`=0.00, `closingBalance`=0.00 (+6 more) |
| `store.reports.transactions` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `transactions.data.sum_amount`=5,069,932.61, `transactions.data.total_amount`=5,069,932.61 (+1 more) |
| `store.reports.expenses` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `expenses.sum_amount`=72,017.91, `expenses.total_amount`=72,017.91 (+2 more) |
| `store.reports.account-ledger` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `openingBalance`=0.00, `accounts.sum_balance`=57,993,805.06 (+1 more) |
| `store.reports.tax` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `tax_records.sum_taxable_amount`=0.00, `tax_records.total_taxable_amount`=0.00 (+6 more) |
| `store.reports.bank-statement` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `opening_balance`=0.00, `closing_balance`=0.00 (+2 more) |
| `store.reports.stock-valuation` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_unit_cost`=88,280.20, `products.total_unit_cost`=88,280.20 (+10 more) |
| `store.reports.low-stock` | ⚠️ ALL_ZEROS | 200 | `settings.tax_rate`=0.00, `stats.total_shortage`=0.00 |
| `store.reports.movement-history` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 (+4 more) |
| `store.reports.balance-sheet` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `assets.accounts.sum_balance`=17,995,565.18, `assets.accounts.total_balance`=17,995,565.18 (+10 more) |
| `store.reports.all-parties` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_balance`=19,021,537.46, `data.total_balance`=19,021,537.46 (+2 more) |
| `store.reports.trial-balance` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `accounts.sum_debit`=28,996,902.53, `accounts.total_debit`=28,996,902.53 (+6 more) |
| `store.reports.item-wise-profit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `items.sum_revenue`=449,876.19, `items.total_revenue`=449,876.19 (+2 more) |
| `store.reports.party-wise-profit-loss` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_invoice_count`=16.00, `data.total_invoice_count`=16.00 (+8 more) |
| `store.reports.discount` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `invoices.sum_subtotal`=526,355.13, `invoices.total_subtotal`=526,355.13 (+29 more) |
| `store.reports.cash-flow` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `operating`=4,071,124.76, `investing`=0.00 (+3 more) |
| `store.reports.sale-aging` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `invoices.sum_amount`=6,189,422.15, `invoices.total_amount`=6,189,422.15 |
| `store.reports.sale-orders` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `orders.sum_total_amount`=1,000.00, `orders.total_total_amount`=1,000.00 (+16 more) |
| `store.reports.bill-wise-profit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `invoices.sum_net_revenue`=449,876.19, `invoices.total_net_revenue`=449,876.19 (+4 more) |
| `store.reports.expense-by-category` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_total`=72,017.91, `data.total_total`=72,017.91 (+4 more) |
| `store.reports.expense-by-item` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_amount`=72,017.91, `data.total_amount`=72,017.91 (+2 more) |
| `store.reports.stock-summary-by-category` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_total_stock`=1,500.00, `data.total_total_stock`=1,500.00 (+6 more) |
| `store.reports.item-detail` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 (+4 more) |
| `store.reports.loan-statement` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `opening_balance`=0.00, `closing_balance`=0.00 (+2 more) |
| `store.reports.tax-rate` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_tax_rate`=17.00, `data.total_tax_rate`=17.00 (+8 more) |
| `store.reports.sale-purchase-by-party` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_sales`=449,876.18, `data.total_sales`=449,876.18 (+4 more) |
| `store.reports.item-report-by-party` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_total`=449,876.19, `data.total_total`=449,876.19 (+2 more) |
| `store.reports.party-report-by-item` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_total`=449,876.19, `data.total_total`=449,876.19 (+2 more) |
| `store.reports.sale-purchase-by-item-category` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_sales`=449,876.19, `data.total_sales`=449,876.19 (+2 more) |
| `store.reports.item-category-wise-profit-loss` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_revenue`=449,876.19, `data.total_revenue`=449,876.19 (+6 more) |
| `store.reports.item-wise-discount` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_total_sales`=449,876.19, `data.total_total_sales`=449,876.19 (+2 more) |
| `store.reports.sale-order-items` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `items.sum_subtotal`=4,250.00, `items.total_subtotal`=4,250.00 |
| `store.reports.stock-aging` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_cost_value`=10,572,685.20, `data.total_cost_value`=10,572,685.20 (+4 more) |
| `store.reports.sale-purchase-by-party-group` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `data.sum_sales`=526,355.13, `data.total_sales`=526,355.13 (+6 more) |
| `store.reports.analytics` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `trendData.sum_sales`=0.00, `trendData.total_sales`=0.00 (+4 more) |
| `store.reports.owner-daily-pulse` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `snapshots.sum_sales_value`=449,876.18, `snapshots.total_sales_value`=449,876.18 (+12 more) |
| `store.cookbook.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `recipes.sum_product.cost_price`=620.13, `recipes.total_product.cost_price`=620.13 (+10 more) |
| `store.cookbook.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 |
| `store.cookbook.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 (+2 more) |
| `store.growth-engine.index` | ↩ REDIRECT | 302 | – |
| `store.ai.recommendations` | ✅ PASS | 200 | – |
| `store.ai.smart-reorder` | ✅ PASS | 200 | – |
| `store.ai.cash-flow-forecast` | ✅ PASS | 200 | `current_balance`=8,358,352.78, `avg_daily_net`=21,621.07, `forecast.sum_projected_net_change`=10,053,797.55 (+3 more) |
| `store.inventory.stock-levels` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 (+4 more) |
| `store.bank-accounts.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `bankAccounts.sum_opening_balance`=4,000,000.00, `bankAccounts.total_opening_balance`=4,000,000.00 (+4 more) |
| `store.bank-accounts.transactions` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `bankAccount.opening_balance`=0.00, `bankAccount.current_balance`=6,449,569.18 (+1 more) |
| `store.parties.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `parties.data.sum_opening_balance`=0.00, `parties.data.total_opening_balance`=0.00 (+14 more) |
| `store.parties.ledgers` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `parties.data.sum_opening_balance`=0.00, `parties.data.total_opening_balance`=0.00 (+14 more) |
| `store.parties.ledger` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `party.opening_balance`=0.00, `party.current_balance`=0.00 (+11 more) |
| `store.parties.show` | ↩ REDIRECT | 302 | – |
| `store.expenses.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `expenses.total`=0.00, `stats.total`=0.00 (+5 more) |
| `store.payments.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `payments.data.sum_amount`=789,973.78, `payments.data.total_amount`=789,973.78 (+7 more) |
| `store.payments.in` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `parties.sum_opening_balance`=0.00, `parties.total_opening_balance`=0.00 (+8 more) |
| `store.payments.out` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `parties.sum_opening_balance`=0.00, `parties.total_opening_balance`=0.00 (+8 more) |
| `store.purchases.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchases.data.sum_supplier.opening_balance`=0.00, `purchases.data.total_supplier.opening_balance`=0.00 (+12 more) |
| `store.purchases.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `parties.sum_opening_balance`=0.00, `parties.total_opening_balance`=0.00 (+6 more) |
| `store.purchases.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchase.subtotal`=55,934.90, `purchase.discount_amount`=0.00 (+8 more) |
| `store.purchases.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchase.subtotal`=55,934.90, `purchase.discount_amount`=0.00 (+14 more) |
| `store.purchases.receive` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchase.subtotal`=55,934.90, `purchase.discount_amount`=0.00 (+6 more) |
| `store.transactions.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `transactions.data.sum_subtotal`=14,818,799.19, `transactions.data.total_subtotal`=14,818,799.19 (+19 more) |
| `store.inventory.stock` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 (+4 more) |
| `store.production.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_cost_price`=91,953.28, `products.total_cost_price`=91,953.28 (+4 more) |
| `store.customers.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `customers.total`=8.00 |
| `store.suppliers.search` | ✅ PASS | 200 | – |
| `store.parties.search` | ✅ PASS | 200 | – |
| `store.sales.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.sales_today`=5,022.82, `stats.sales_today_growth`=100.00 (+17 more) |
| `store.sales.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `sales.data.sum_subtotal`=10,806,765.85, `sales.data.total_subtotal`=10,806,765.85 (+76 more) |
| `store.sales.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `sale.subtotal`=99,740.45, `sale.subtotal_gross`=0.00 (+15 more) |
| `store.finance` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.receivables`=6,971,965.28, `stats.payables`=11,858,825.26 (+17 more) |
| `store.finance.receivables` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `parties.sum_balance`=6,971,965.28, `parties.total_balance`=6,971,965.28 |
| `store.finance.payables` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `parties.sum_balance`=11,954,198.72, `parties.total_balance`=11,954,198.72 |
| `store.funds.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `cashAccount.balance`=6,449,569.18, `bankAccounts.sum_balance`=3,500,000.00 (+6 more) |
| `store.funds.history.ledger` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `balance`=6,449,569.18, `ledger.sum_amount`=6,882,654.80 (+1 more) |
| `store.charity.stats` | ✅ PASS | 200 | `default_amount`=10.00 |
| `store.accounting.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.total_income`=36,633.96, `stats.total_expense`=26,500.51 (+20 more) |
| `store.accounting.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `accounts.sum_balance`=57,993,805.06, `accounts.total_balance`=57,993,805.06 |
| `store.accounting.pnl` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `incomeAccounts.sum_balance`=3,890,314.60, `incomeAccounts.total_balance`=3,890,314.60 (+7 more) |
| `store.accounting.balance-sheet` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `assets.accounts.sum_balance`=17,995,565.18, `assets.accounts.total_balance`=17,995,565.18 (+10 more) |
| `store.reports.dashboard` | ↩ REDIRECT | 302 | – |
| `store.admin.panel` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.total_users`=1.00 |
| `store.admin.data.template` | ↩ REDIRECT | 302 | – |
| `store.legacy.admin.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.net_profit`=8,376.38, `stats.total_revenue`=8,376.38 (+17 more) |
| `store.legacy.admin.migration.index` | ↩ REDIRECT | 302 | – |
| `store.legacy.admin.users` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `staffData.sum_totalSales`=11,220,578.70, `staffData.total_totalSales`=11,220,578.70 (+2 more) |
| `store.legacy.admin.staff` | ↩ REDIRECT | 302 | – |
| `store.returns-history.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `returns.data.sum_subtotal`=99,740.45, `returns.data.total_subtotal`=99,740.45 (+31 more) |
| `store.returns-history.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `return.subtotal`=99,740.45, `return.subtotal_gross`=0.00 (+15 more) |
| `store.debit-notes.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `note.amount`=500.00, `note.supplier.opening_balance`=0.00 (+1 more) |
| `store.invoice-reminders.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `invoices.sum_subtotal`=7,250,722.66, `invoices.total_subtotal`=7,250,722.66 (+28 more) |
| `store.woo.connections.index` | ↩ REDIRECT | 302 | – |
| `store.woo.connections.status-json` | ↩ REDIRECT | 302 | – |
| `store.woo.connections.sync` | ↩ REDIRECT | 302 | – |
| `store.woo.connections.logs` | ↩ REDIRECT | 302 | – |
| `store.v3.products.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_tax_rate`=255.00, `products.total_tax_rate`=255.00 |
| `store.v3.products.edit` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `product.cost_price`=520.15, `product.tax_rate`=17.00 (+1 more) |
| `store.v3.purchases.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchases.data.sum_total`=12,370,041.66, `purchases.data.total_total`=12,370,041.66 (+1 more) |
| `store.v3.purchases.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `products.sum_tax_rate`=255.00, `products.total_tax_rate`=255.00 |
| `store.v3.purchases.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchase.subtotal`=55,934.90, `purchase.tax`=9,508.93 (+11 more) |
| `store.v3.purchases.return.create` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchase.subtotal`=55,934.90, `purchase.tax`=9,508.93 (+1 more) |
| `store.v3.opening-balances.status` | ✅ PASS | 200 | `balance_7000`=10,000.00 |
| `store.v3.suppliers.statement` | ✅ PASS | 200 | `supplier.opening_balance`=0.00, `supplier.current_balance`=0.00, `ap_balance`=-95,373.46 (+6 more) |
| `store.v3.sales.pdf` | 📄 NON_JSON | 200 | – |
| `store.v3.customers.statement` | ✅ PASS | 200 | `customer.opening_balance`=0.00, `customer.current_balance`=0.00, `customer.credit_limit`=300,000.00 (+11 more) |
| `store.v3.products.uom.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `product.cost_price`=520.15, `product.tax_rate`=17.00 (+1 more) |
| `store.v3.products.tiers.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `product.cost_price`=520.15, `product.tax_rate`=17.00 (+1 more) |
| `store.v3.reports.trial-balance` | ✅ PASS | 200 | `rows.sum_total_debit`=5,069,932.61, `rows.total_total_debit`=5,069,932.61, `rows.sum_total_credit`=5,069,932.61 (+5 more) |
| `store.v3.reports.profit-loss` | ✅ PASS | 200 | `revenue`=449,876.18, `cogs`=369,979.24, `gross_profit`=79,896.94 (+7 more) |
| `store.v3.reports.balance-sheet` | ✅ PASS | 200 | `assets.accounts.sum_balance`=4,144,617.92, `assets.accounts.total_balance`=4,144,617.92, `assets.total`=4,144,617.92 (+9 more) |
| `store.v3.reports.cash-flow` | ✅ PASS | 200 | `operating.sum_net`=4,071,124.76, `operating.total_net`=4,071,124.76, `net_operating`=4,071,124.76 (+3 more) |
| `store.v3.reports.aged-receivables` | ✅ PASS | 200 | `rows.sum_total`=378,028.57, `rows.total_total`=378,028.57, `rows.sum_balance`=378,028.57 (+2 more) |
| `store.v3.reports.aged-payables` | ✅ PASS | 200 | `rows.sum_total`=50,259.94, `rows.total_total`=50,259.94, `rows.sum_balance`=50,259.94 (+2 more) |
| `store.v3.reports.sales` | ✅ PASS | 200 | `rows.sum_tax_rate`=527.00, `rows.total_tax_rate`=527.00, `rows.sum_line_total`=526,355.14 (+7 more) |
| `store.v3.reports.purchases` | ✅ PASS | 200 | `rows.sum_unit_cost`=1,192.37, `rows.total_unit_cost`=1,192.37, `rows.sum_line_total`=65,443.83 (+2 more) |
| `store.v3.reports.inventory-valuation` | ✅ PASS | 200 | `rows.sum_total_qty`=2,095.00, `rows.total_total_qty`=2,095.00, `rows.sum_unit_cost`=88,280.20 (+11 more) |
| `store.v3.reports.cogs` | ✅ PASS | 200 | `rows.sum_total_qty_sold`=13.00, `rows.total_total_qty_sold`=13.00, `rows.sum_total_cogs`=8,187.74 (+2 more) |
| `store.v3.reports.gross-profit` | ✅ PASS | 200 | – |
| `store.v3.reports.tax` | ✅ PASS | 200 | `output_tax`=76,478.95, `input_tax`=9,508.93, `net_payable`=66,970.02 (+4 more) |
| `store.v3.reports.party-ledger` | ✅ PASS | 200 | `opening_balance`=0.00, `lines.sum_debit`=31,474.62, `lines.total_debit`=31,474.62 (+5 more) |
| `store.v3.reports.inventory-movement` | ✅ PASS | 200 | `inflows.sum_value_in`=55,934.90, `inflows.total_value_in`=55,934.90, `outflows.sum_value_out`=8,187.74 (+1 more) |
| `store.v3.dashboard` | ✅ PASS | 200 | `receivables`=6,971,965.28, `payables`=11,858,825.26, `revenue_mtd`=36,633.96 (+2 more) |
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
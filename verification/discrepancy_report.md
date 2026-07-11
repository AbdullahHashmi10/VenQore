# VenQore Ledger Truth Audit Report

> **Generated:** 2026-07-11 08:17:35 PKT  
> **Tenant:** Golden Audit Store (`golden-audit`)  
> **Audit Date:** 2026-07-11  
> **Audit Period Seeded:** 2025-01-01 → 2026-07-11  

## Summary

| Status | Count |
|--------|-------|
| 🔢 Total Routes Scanned | **8** |
| ✅ Passed | 8 |
| ⚠️ All Zeros (Suspicious) | 0 |
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

## Full Scan Results (8 routes)

| Route | Status | Code | Financial Props |
|-------|--------|------|----------------|
| `store.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `revenue`=449,876.18, `performance.Today.sales`=0.00 (+68 more) |
| `store.dashboard-v1` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `revenue`=449,876.18, `performance.Today.sales`=0.00 (+68 more) |
| `store.expenses.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `expenses.total`=0.00, `stats.total`=0.00 (+5 more) |
| `store.purchases.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `purchases.data.sum_supplier.opening_balance`=0.00, `purchases.data.total_supplier.opening_balance`=0.00 (+12 more) |
| `store.sales.dashboard` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `stats.sales_today`=0.00, `stats.sales_today_growth`=-100.00 (+13 more) |
| `store.sales.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `sales.data.sum_subtotal`=10,806,765.85, `sales.data.total_subtotal`=10,806,765.85 (+78 more) |
| `store.sales.show` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `sale.subtotal`=99,740.45, `sale.subtotal_gross`=0.00 (+16 more) |
| `store.funds.index` | ✅ PASS | 200 | `settings.tax_rate`=0.00, `cashAccount.balance`=6,449,569.18, `bankAccounts.sum_balance`=3,500,000.00 (+6 more) |

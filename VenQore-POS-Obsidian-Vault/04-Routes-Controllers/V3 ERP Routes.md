---
tags: [routes, v3]
---

# V3 ERP Routes — `s/{store_slug}/v3/*`

Part of [[VenQore POS - Home]] · [[V3 Accounting Engine]] · [[Two Generations - Legacy vs V3]]

Name prefix `store.v3.`. Entirely backed by `app/Http/Controllers/V3/*` (36 controllers).

| Area | Routes/Controller |
|---|---|
| Products / Warehouses | `Route::resource` for both, `except(show)` |
| Purchases | resource `only(index,create,store,show)`, `V3\PurchaseReturnController` |
| Payments | `supplier-payments`, `customer-payments` (+bounce), `supplier-advances`, `customer-advances` |
| Opening balances | `V3\OpeningBalanceController` (+status) |
| Stock ops | `stock-adjustments`, `stock-transfers` |
| Supplier statement | `V3\SupplierStatementController@show` |
| Parties | `V3\PartyController` (store/update/destroy) |
| Sales | `V3\SaleController`, `V3\InvoicePdfController` (PDF), `V3\SaleReturnController`, `V3\BadDebtController` (write-off) |
| Sales orders / Quotations | `V3\SalesOrderController`, `V3\QuotationController` (convert, convert-to-order) |
| Customer statement | `V3\CustomerStatementController` |
| UOM / Price tiers | `V3\UomConversionController`, `V3\PriceTierController` (nested under `products/{id}/uom*`, `/tiers*`) |
| Manufacturing / BOM | `V3\BomController`, `V3\ProductionRunController` (store/complete/reverse/disassemble) |
| HR & special transactions | `V3\EmployeeController`, `V3\PayrollController` (accrue/pay), `V3\EmployeeSettlementController`, `V3\CashShortageController`, `V3\DisasterClaimController` (+recover), `V3\AssetController`, `V3\DepreciationController`, `V3\LoanController` (drawdown/repay), `V3\ExpenseController`, `V3\FundController`, `V3\BankTransferController`, `V3\DonationController` |
| Roles | `V3\RoleController` (`PUT users/{id}/role`, discount-limits) |
| Fiscal year | `V3\FiscalYearController@close` |
| Reports (14 endpoints) | `V3\ReportController` — trial-balance, profit-loss, balance-sheet, cash-flow, aged-receivables, aged-payables, sales, purchases, inventory-valuation, cogs, gross-profit, tax, party-ledger/{id}, inventory-movement + `V3\ReportExportController` |
| Dashboard | `V3\DashboardController@index` |

This is a parallel, more rigorous accounting-grade rebuild of Sales/Purchases/HR/Assets, each posting to `JournalEntry` — an ERP module far broader than the legacy Sale/Purchase/Report controllers.

## Related
- [[V3 Accounting Engine]]
- [[Legacy vs V3 Services]]

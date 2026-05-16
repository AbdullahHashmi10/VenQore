# VenQore ERP — Data Source Audit
**Generated:** 2026-03-07  
**Scope:** All financial numbers displayed across the UI

---

## SUMMARY

| Category | Count |
|---|---|
| **Total financial numbers audited** | 58 |
| **✅ V3 (Correct — reads from journal_items / inventory_batches)** | 31 |
| **❌ OLD (Must fix — reads from denormalized columns)** | 18 |
| **⚠️ UNKNOWN / Mixed** | 9 |
| **Pages fully V3** | 6 |
| **Pages partially V3** | 9 |
| **Pages using only old sources** | 3 |

---

## CONSISTENCY CHECKS

### CC-01 — Cash in Hand
Appears in 4 places. Must all match. Currently INCONSISTENT.

| Location | Variable | Source | V3? |
|---|---|---|---|
| Dashboard (RightPanel) | `cashData.balance` | `DashboardController` → `AccountingService->getBalance('1000')` | ✅ V3 |
| Fund Management | `cashAccount.balance` | `FundController` → `AccountingService->getBalance('1000')` | ✅ V3 |
| Finance Dashboard | `stats.cash` | `FinanceController` → `AccountingService->getBalance('1000')` | ✅ V3 |
| Adjust Balance Modal | `cashAccount.balance` (prefilled) | Same as Fund Management | ✅ V3 |

**Status: ✅ CONSISTENT — All 4 locations read from `journal_items` via `AccountingService->getBalance('1000')`**

---

### CC-02 — Bank Account Balances
Appears in 5 places. Currently PARTIALLY INCONSISTENT.

| Location | Variable | Source | V3? |
|---|---|---|---|
| Dashboard (RightPanel) | `acc.current_balance` | `DashboardController` → `BankAccount::v3Balance()` | ✅ V3 |
| Fund Management | `bankAccounts[].balance` | `FundController` → `BankAccount::v3Balance()` | ✅ V3 |
| Finance Dashboard | `stats.bank` | `FinanceController` → `AccountingService->getBalance('1010')` | ✅ V3 |
| Finance/BankAccounts page | `bankAccounts[].current_balance` | `FinanceController::bankAccounts()` → `BankAccount::v3Balance()` | ✅ V3 |
| FinanceController::destroyBankAccount | `$bankAccount->current_balance` | Reads `current_balance` column directly — NOT calling v3Balance() | ❌ OLD |

**Status: ⚠️ MOSTLY CONSISTENT — delete guard on line 298 reads stale column**

---

### CC-03 — Total Business Liquidity (Cash + Bank)
Appears in 3 places.

| Location | Variable | Source | V3? |
|---|---|---|---|
| Dashboard (RightPanel) | `totalBalance` | Derived from cash + bank (both V3) | ✅ V3 |
| Fund Management | `totalFunds` | `FundController` → sum of V3 cash + V3 bank | ✅ V3 |
| Finance Dashboard | `stats.totalLiquidity` | `FinanceController` → `cashBalance + bankBalance` (both V3) | ✅ V3 |

**Status: ✅ CONSISTENT — All three read from V3 sources**

---

### CC-04 — Total Receivables (Accounts Receivable)
Appears in 4 places. Currently INCONSISTENT.

| Location | Variable | Source | V3? |
|---|---|---|---|
| Dashboard | `outstanding.receivables` | `DashboardController::getOutstanding()` → `journal_items` (code 1200) | ✅ V3 |
| Finance Dashboard | `stats.receivables` | `FinanceController::index()` → `journal_items` (code 1200) | ✅ V3 |
| Finance/Receivables page | `parties[].balance` | `FinanceController::receivables()` → `journal_items` per party | ✅ V3 |
| **Parties List page** | `stats.receivables` | **`PartyController::index()` → `Party::sum('current_balance')`** | ❌ OLD |

**Status: ❌ INCONSISTENT — PartyController uses stale `current_balance` column, all others use V3 ledger**

---

### CC-05 — Total Payables (Accounts Payable)
Appears in 3 places. Currently INCONSISTENT.

| Location | Variable | Source | V3? |
|---|---|---|---|
| Dashboard | `outstanding.payables` | `DashboardController::getOutstanding()` → `journal_items` (code 2000) | ✅ V3 |
| Finance Dashboard | `stats.payables` | `FinanceController::index()` → `journal_items` (code 2000) | ✅ V3 |
| **Parties List page** | `stats.payables` | **`PartyController::index()` → `Party::sum('current_balance')`** | ❌ OLD |

**Status: ❌ INCONSISTENT — PartyController uses stale `current_balance` column**

---

### CC-06 — Net Profit / P&L
Appears in 3 places. Currently CONSISTENT.

| Location | Variable | Source | V3? |
|---|---|---|---|
| Dashboard | `netProfit.profit` | `DashboardController::getNetProfit()` → `FinancialReportingService` | ✅ V3 |
| Dashboard (P&L Summary) | `plSummary.profit` | `DashboardController::getPLSummary()` — V3 first, OLD fallback | ⚠️ Mixed |
| Reports/ProfitLoss | `stats.net_profit` | `ReportController::profitLoss()` → `FinancialReportingService` | ✅ V3 |

**Status: ⚠️ MOSTLY CONSISTENT — Dashboard P&L summary has fallback to `Sale::sum()` + `Expense::sum()` when income is zero**

---

### CC-07 — Total Revenue / Net Sales
Appears in 5 places. Currently PARTIALLY INCONSISTENT.

| Location | Variable | Source | V3? |
|---|---|---|---|
| Dashboard (sales stats) | `salesStats.revenue` | `DashboardController::getSalesStats()` → `Sale::sum('net_sales')` | ✅ V3 |
| Sales Dashboard | `stats.sales_today`, `stats.sales_month` | `SaleController::dashboard()` → `Sale::sum('net_sales')` | ✅ V3 |
| Sales History | `stats.total_sale` | `SaleController::index()` → `Sale::sum('net_sales')` | ✅ V3 |
| **Reports/Sales** | `stats.total_sales` | **`ReportController::sales()` → `Sale::sum('total')`** | ❌ OLD |
| Reports/P&L | `stats.revenue` | `ReportController::profitLoss()` → `FinancialReportingService` | ✅ V3 |

**Status: ❌ INCONSISTENT — Reports/Sales uses `Sale.total` (tax-inclusive) instead of `net_sales` (true revenue)**

---

### CC-08 — Stock / Inventory Quantity
Appears in 4 places. Currently INCONSISTENT.

| Location | Variable | Source | V3? |
|---|---|---|---|
| Dashboard (low stock) | `product.stock_quantity` | `DashboardController` → `Product::stocks->sum('quantity')` | ✅ V3 |
| POS page | `product.stock_quantity` | `PosController` → `product.stocks->sum('quantity')` | ✅ V3 |
| Reports/LowStock | `product.stock_quantity` | `ReportController::lowStock()` → `product->stocks->sum('quantity')` | ✅ V3 |
| **PurchaseController** | `product->stock_quantity` | Reads/writes `products.stock_quantity` column | ❌ OLD |

**Status: ⚠️ INCONSISTENT for writes — PurchaseController increments/decrements `products.stock_quantity` directly**

---

### CC-09 — Inventory Value (Stock Valuation)
Appears in 3 places.

| Location | Variable | Source | V3? |
|---|---|---|---|
| Dashboard (RightPanel) | `cashData.inventoryValue` | `DashboardController` → `FinancialReportingService::getInventoryValue()` | ✅ V3 |
| Reports/StockValuation | `stats.total_cost_value` | `ReportController::stockValuation()` → `FinancialReportingService::getInventoryValuationReport()` | ✅ V3 |
| Party Ledger | N/A (not shown) | — | — |

**Status: ✅ CONSISTENT — Both read from `inventory_batches` via `FinancialReportingService`**

---

### CC-10 — Purchase Total Due / Payables per Bill
Appears in 2 places. Currently INCONSISTENT.

| Location | Variable | Source | V3? |
|---|---|---|---|
| Purchases List | `stats.total_due` | `Invoice::sum('total_amount') - Invoice::sum('paid_amount')` | ❌ OLD |
| **Purchases List (per row)** | `balance` | Items sum × price - `paid_amount` column | ❌ OLD |

**Status: ❌ OLD — Purchases page reads directly from `invoices.total_amount` and `invoices.paid_amount`, not from journal_items**

---

## PAGE BY PAGE AUDIT

---

### 1. DASHBOARD (`/dashboard`)
**Controller:** `DashboardController::index()`  
**V3 Status:** ⚠️ Partially V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Cash in Hand | `cashData.balance` | `AccountingService->getBalance('1000')` via `journal_items` | ✅ V3 |
| 2 | Bank Account Balances (each) | `cashData.accounts[].current_balance` | `BankAccount::v3Balance()` → `journal_items` | ✅ V3 |
| 3 | Total Balance (cash + bank) | `cashData.total` | Derived from items above | ✅ V3 |
| 4 | Inventory Value (Stock Value) | `cashData.inventoryValue` | `FinancialReportingService::getInventoryValue()` → `inventory_batches` | ✅ V3 |
| 5 | Total Receivables | `outstanding.receivables` | `DashboardController::getOutstanding()` → `journal_items` (code 1200) | ✅ V3 |
| 6 | Total Payables | `outstanding.payables` | `DashboardController::getOutstanding()` → `journal_items` (code 2000) | ✅ V3 |
| 7 | Net Profit | `netProfit.profit` | `FinancialReportingService::getProfitAndLoss()` → `journal_items` | ✅ V3 |
| 8 | Net Income (P&L Summary) | `plSummary.income` | `journal_items` first, fallback to `Sale::sum()` | ⚠️ Mixed |
| 9 | Net Expenses (P&L Summary) | `plSummary.expense` | `journal_items` first, fallback to `Expense::sum()` | ⚠️ Mixed |
| 10 | Revenue (Sales Stats) | `salesStats.revenue` | `Sale::sum('net_sales')` (V3 column — true revenue) | ✅ V3 |
| 11 | COGS (Sales Stats) | `salesStats.cogs` | `sale_item_batches.total_cogs` + fallback `cost_price*qty` | ⚠️ Mixed |
| 12 | Gross Profit (Sales Stats) | `salesStats.gross_profit` | Derived from Revenue - COGS above | ⚠️ Mixed |
| 13 | Outstanding Amount (per sale row) | `sale.total - sale.paid_amount` | `Sale.total` column (OLD column) vs `Sale.net_sales` | ❌ OLD |
| 14 | Recent Transactions (amounts) | `activities[].amount` | `Activity` model or `JournalEntry` fallback | ⚠️ Unknown |

---

### 2. FUND MANAGEMENT (`/funds`)
**Controller:** `FundController::index()`  
**V3 Status:** ✅ Fully V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Cash in Hand | `cashAccount.balance` | `AccountingService->getBalance('1000')` → `journal_items` | ✅ V3 |
| 2 | Bank Account Balance (each) | `bankAccounts[].balance` | `BankAccount::v3Balance()` → `journal_items` | ✅ V3 |
| 3 | Bank Accounts Total | Computed on frontend | `bankAccounts.reduce(sum, b.balance)` | ✅ V3 |
| 4 | Total Business Liquidity | `totalFunds` | Sum of cash + bank (both V3) | ✅ V3 |
| 5 | Transaction Amount (each row) | `transactions[].amount` | `fund_transactions.amount` | ✅ V3 |

---

### 3. FINANCE DASHBOARD (`/finance`)
**Controller:** `FinanceController::index()`  
**V3 Status:** ✅ Fully V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Cash on Hand | `stats.cash` | `AccountingService->getBalance('1000')` → `journal_items` | ✅ V3 |
| 2 | Bank Balance | `stats.bank` | `AccountingService->getBalance('1010')` → `journal_items` | ✅ V3 |
| 3 | Total Receivables | `stats.receivables` | `journal_items` SUM (code 1200, debit-normal) | ✅ V3 |
| 4 | Total Payables | `stats.payables` | `journal_items` SUM (code 2000, credit-normal) | ✅ V3 |
| 5 | Total Liquidity | `stats.totalLiquidity` | `cashBalance + bankBalance` (both V3) | ✅ V3 |
| 6 | Top Receivables (per party) | `topReceivables[].balance` | `journal_items` per party on AR account | ✅ V3 |
| 7 | Top Payables (per party) | `topPayables[].balance` | `journal_items` per party on AP account | ✅ V3 |
| 8 | Recent Journal Entries (debit totals) | Computed from `entry.items` | `JournalEntry::with('items.account')` from `journal_items` | ✅ V3 |

---

### 4. FINANCE / RECEIVABLES (`/finance/receivables`)
**Controller:** `FinanceController::receivables()`  
**V3 Status:** ✅ Fully V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Per-Party Receivable Balance | `parties[].balance` | `journal_items` SUM per party (code 1200) | ✅ V3 |

---

### 5. FINANCE / PAYABLES (`/finance/payables`)
**Controller:** `FinanceController::payables()`  
**V3 Status:** ✅ Fully V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Per-Party Payable Balance | `parties[].balance` | `journal_items` SUM per party (code 2000) | ✅ V3 |

---

### 6. PARTIES LIST (`/parties`)
**Controller:** `PartyController::index()`  
**V3 Status:** ❌ OLD — uses stale cached column

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Total Parties | `stats.total` | `Party::count()` | N/A |
| 2 | Customer Count | `stats.customers` | `Party::where('type','customer')->count()` | N/A |
| 3 | Supplier Count | `stats.suppliers` | `Party::where('type','supplier')->count()` | N/A |
| 4 | **Total Receivables** | `stats.receivables` | **`Party::where('current_balance','>',0)->sum()`** | ❌ OLD |
| 5 | **Total Payables** | `stats.payables` | **`Party::where('current_balance','<',0)->sum()`** | ❌ OLD |
| 6 | Per-Party Balance (each row) | `party.current_balance` | `parties.current_balance` column (stale cache) | ❌ OLD |

---

### 7. PARTY LEDGER (`/parties/{id}/ledger`)
**Controller:** `PartyController::ledger()`  
**V3 Status:** ❌ OLD — does NOT read from journal_items

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Opening Balance | `stats.opening_balance` | `party.opening_balance` column | ❌ OLD |
| 2 | Total Debits | `stats.total_debit` | Computed from `sales.total` + `invoices.total_amount` | ❌ OLD |
| 3 | Total Credits | `stats.total_credit` | Computed from `sales.total` (returns) + `payments.amount` | ❌ OLD |
| 4 | Final Balance | `stats.final_balance` | Running sum of OLD sources | ❌ OLD |
| 5 | Sale amounts per row | `transaction.debit` | `sales.total` column | ❌ OLD |
| 6 | Purchase amounts per row | `transaction.credit` | `invoices.total_amount` column | ❌ OLD |
| 7 | Payment amounts per row | `transaction.credit` | `payments.amount` | ✅ V3 |

---

### 8. SALES HISTORY (`/sales`)
**Controller:** `SaleController::index()`  
**V3 Status:** ✅ Mostly V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Total Sales (Revenue) | `stats.total_sale` | `Sale::sum('net_sales')` → V3 revenue column | ✅ V3 |
| 2 | Total Paid | `stats.total_paid` | `Payment::sum('amount')` | ✅ V3 |
| 3 | Total Unpaid | `stats.total_unpaid` | `net_sales - total_paid` | ✅ V3 |
| 4 | Per-Sale Total (each row) | `sale.total` | `sales.total` column (backward compat, = invoice_total) | ⚠️ Mixed |
| 5 | Per-Sale Paid Amount | `sale.paid_amount` | `Payment::sum` withSum | ✅ V3 |

---

### 9. SALES DASHBOARD (`/sales/dashboard`)
**Controller:** `SaleController::dashboard()`  
**V3 Status:** ✅ V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Sales Today | `stats.sales_today` | `Sale::sum('net_sales')` today | ✅ V3 |
| 2 | Orders Today | `stats.orders_today` | `Sale::count()` today | N/A |
| 3 | Sales This Month | `stats.sales_month` | `Sale::sum('net_sales')` this month | ✅ V3 |
| 4 | Average Order Value | `stats.avg_order_value` | `net_sales / count` | ✅ V3 |
| 5 | Top Products Revenue | `topSelling[].revenue` | `SUM(sale_items.net_amount)` | ✅ V3 |
| 6 | Top Products COGS | `topSelling[].cogs` | `sale_item_batches.total_cogs` or `cost_price * qty` | ⚠️ Mixed |
| 7 | Top Products Gross Profit | `topSelling[].gross_profit` | Revenue - COGS (computed) | ⚠️ Mixed |

---

### 10. PURCHASES LIST (`/purchases`)
**Controller:** `PurchaseController::index()`  
**V3 Status:** ❌ OLD

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Total Purchases | `stats.total_purchase` | `Invoice::sum('total_amount')` | ❌ OLD |
| 2 | Total Paid (Purchases) | `stats.total_paid` | `Invoice::sum('paid_amount')` | ❌ OLD |
| 3 | Total Due (Purchases) | `stats.total_due` | `total_amount - paid_amount` | ❌ OLD |
| 4 | Per-Purchase Subtotal | `purchase.subtotal` | `items->sum(qty*unit_price)` | ❌ OLD |
| 5 | Per-Purchase Total (with extras) | `purchase.total` | `subtotal + landed_costs` | ❌ OLD |
| 6 | Per-Purchase Balance | `purchase.balance` | `total - paid` | ❌ OLD |

---

### 11. REPORTS / SALES REPORT (`/reports/sales`)
**Controller:** `ReportController::sales()`  
**V3 Status:** ❌ OLD — uses `Sale.total` not `net_sales`

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | **Total Sales** | `stats.total_sales` | **`Sales->sum('total')` — tax-inclusive, not net_sales!** | ❌ OLD |
| 2 | Total Paid | `stats.total_paid` | `Sales->sum('paid_amount')` (column, not payment table) | ❌ OLD |
| 3 | Total Due | `stats.total_due` | `total - paid_amount` | ❌ OLD |
| 4 | Average Ticket | `stats.avg_ticket` | `total_sales / count` | ❌ OLD |
| 5 | Total Discount | `stats.total_discount` | `Sales->sum('discount')` | ❌ OLD |

---

### 12. REPORTS / PURCHASES REPORT (`/reports/purchases`)
**Controller:** `ReportController::purchases()`  
**V3 Status:** ❌ OLD

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Total Purchases | `stats.total_purchases` | `Invoice::sum('total_amount')` | ❌ OLD |
| 2 | Total Paid | `stats.total_paid` | `Invoice::sum('paid_amount')` | ❌ OLD |
| 3 | Total Due | `stats.total_due` | `total_amount - paid_amount` | ❌ OLD |

---

### 13. REPORTS / PROFIT & LOSS (`/reports/profit-loss`)
**Controller:** `ReportController::profitLoss()`  
**V3 Status:** ✅ V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Revenue | `stats.revenue` | `FinancialReportingService::getProfitAndLoss()` → `journal_items` | ✅ V3 |
| 2 | COGS | `stats.cogs` | `FinancialReportingService` → `sale_item_batches` / journal | ✅ V3 |
| 3 | Gross Profit | `stats.gross_profit` | Derived from above | ✅ V3 |
| 4 | Total Expenses | `stats.total_expenses` | `FinancialReportingService` → `journal_items` | ✅ V3 |
| 5 | Net Profit | `stats.net_profit` | `FinancialReportingService` → `journal_items` | ✅ V3 |

---

### 14. REPORTS / TRIAL BALANCE (`/reports/trial-balance`)
**Controller:** `ReportController::trialBalance()`  
**V3 Status:** ✅ V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Per-Account Total Debit | `accounts[].debit` | `journal_items` SUM grouped by account | ✅ V3 |
| 2 | Per-Account Total Credit | `accounts[].credit` | `journal_items` SUM grouped by account | ✅ V3 |
| 3 | Grand Total Debits | `totalDebits` | Sum of all account debits | ✅ V3 |
| 4 | Grand Total Credits | `totalCredits` | Sum of all account credits | ✅ V3 |

---

### 15. REPORTS / BALANCE SHEET (`/reports/balance-sheet`)
**Controller:** `ReportController::balanceSheet()`  
**V3 Status:** ✅ V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | All account balances | Various | `FinancialReportingService::getBalanceSheet()` → `journal_items` | ✅ V3 |

---

### 16. REPORTS / STOCK VALUATION (`/reports/stock-valuation`)
**Controller:** `ReportController::stockValuation()`  
**V3 Status:** ✅ V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Total Cost Value | `stats.total_cost_value` | `FinancialReportingService::getInventoryValuationReport()` → `inventory_batches` | ✅ V3 |
| 2 | Total Retail Value | `stats.total_retail_value` | Same, uses `products.price` | ⚠️ Mixed |
| 3 | Potential Profit | `stats.potential_profit` | Derived from above | ⚠️ Mixed |
| 4 | Total Items (qty) | `stats.total_items` | Derived from `inventory_batches` | ✅ V3 |

---

### 17. REPORTS / EXPENSES (`/reports/expenses`)
**Controller:** `ReportController::expenses()`  
**V3 Status:** ❌ OLD — reads directly from `expenses` table

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Total Expenses | `stats.total_expenses` | `Expense::sum('amount')` | ❌ OLD |
| 2 | Count | `stats.count` | `Expense::count()` | N/A |
| 3 | Avg Daily | `stats.avg_daily` | `Expense::sum('amount') / days` | ❌ OLD |

> **Note:** Reading from `expenses` table for expense details is acceptable — this IS the operational table for expenses. The issue is that this doesn't cross-reference with the journal; expenses should also create journal entries (and they do in V3 via `AccountingService`). The report could instead read from `journal_items` for account 5xxx.

---

### 18. REPORTS / DAY BOOK (`/reports/day-book`)
**Controller:** `ReportController::dayBook()`  
**V3 Status:** ❌ OLD

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Total In | `stats.total_in` | Sum of `Sale.total` + `Payment.amount` | ❌ OLD |
| 2 | Total Out | `stats.total_out` | Sum of `Invoice.total_amount` + `Expense.amount` | ❌ OLD |
| 3 | Net Cash | `stats.net_cash` | `total_in - total_out` | ❌ OLD |

---

### 19. REPORTS / PARTY STATEMENT (`/reports/party-statement`)
**Controller:** `ReportController::partyStatement()`  
**V3 Status:** ✅ V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Opening Balance | `openingBalance` | `journal_items` SUM before start date | ✅ V3 |
| 2 | Closing Balance | `closingBalance` | Running sum from `journal_items` | ✅ V3 |
| 3 | Per-Row Debit/Credit | `transactions[].debit/credit` | Directly from `journal_items` | ✅ V3 |

---

### 20. REPORTS / ACCOUNT LEDGER (`/reports/account-ledger`)
**Controller:** `ReportController::accountLedger()`  
**V3 Status:** ✅ V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Opening Balance | `openingBalance` | `journal_items` before start date | ✅ V3 |
| 2 | Per-Transaction Debit/Credit | `transactions[].debit/credit` | `journal_items` via account relation | ✅ V3 |
| 3 | Running Balance | `transactions[].balance` | Computed from `journal_items` | ✅ V3 |

---

### 21. REPORTS / SALE AGING (`/reports/sale-aging`)
**Controller:** `ReportController::saleAging()`  
**V3 Status:** ⚠️ Mixed

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Outstanding per sale | `invoices[].amount` | `journal_items` AR debits/credits, fallback to `Sale.total` | ⚠️ Mixed |
| 2 | Aging bucket totals | `stats[].value` | Derived from above | ⚠️ Mixed |

---

### 22. REPORTS / BANK STATEMENT (`/reports/bank-statement`)
**Controller:** `ReportController::bankStatement()`  
**V3 Status:** ✅ V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Opening Balance | `opening_balance` | `FinancialReportingService::getAccountLedger()` → `journal_items` | ✅ V3 |
| 2 | Closing Balance | `closing_balance` | Same | ✅ V3 |
| 3 | Transaction Debit/Credit | `transactions[].debit/credit` | Same | ✅ V3 |

---

### 23. REPORTS / ITEM WISE PROFIT (`/reports/item-wise-profit`)
**Controller:** `ReportController::itemWiseProfit()`  
**V3 Status:** ✅ V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Revenue per item | `items[].revenue` | `FinancialReportingService::getGrossProfitByProduct()` → `sale_items.net_amount` | ✅ V3 |
| 2 | COGS per item | `items[].cogs` | `sale_item_batches.total_cogs` (FIFO) | ✅ V3 |
| 3 | Margin | `items[].margin` | Computed from above | ✅ V3 |

---

### 24. REPORTS / BILL WISE PROFIT (`/reports/bill-wise-profit`)
**Controller:** `ReportController::billWiseProfit()`  
**V3 Status:** ✅ V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Revenue per bill | `invoices[].revenue` | `FinancialReportingService::getGrossProfitBySale()` → `sale_items.net_amount` | ✅ V3 |
| 2 | COGS per bill | `invoices[].cogs` | `sale_item_batches.total_cogs` (FIFO) | ✅ V3 |

---

### 25. ALL PARTIES REPORT (`/reports/all-parties`)
**Controller:** `ReportController::allParties()`  
**V3 Status:** ✅ V3

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Per-Party Outstanding | `data[].balance` | `journal_items` SUM per party on AR/AP account | ✅ V3 |
| 2 | Total Receivables | `stats[1].value` | Derived from above | ✅ V3 |
| 3 | Total Payables | `stats[2].value` | Derived from above | ✅ V3 |

---

## MASTER FIX LIST

Ordered by **Priority** (Critical → High → Medium → Low)

### 🔴 CRITICAL — Financial Numbers Actively Misleading Users

- [x] **FIX-01** — `PartyController::index()` — Receivables & Payables stats use `Party.current_balance` (OLD). Replace with `journal_items` query on accounts 1200 and 2000. **File:** `app/Http/Controllers/PartyController.php` lines 48–58.

- [x] **FIX-02** — `ReportController::sales()` — `stats.total_sales` uses `Sale::sum('total')` which is the invoice total (tax-inclusive). Must switch to `Sale::sum('net_sales')` for true revenue. **File:** `app/Http/Controllers/ReportController.php` line 56.

- [x] **FIX-03** — `ReportController::sales()` — `stats.total_paid` reads `sales.paid_amount` column (old denormalized data). Must replace with `Payment::whereIn('sale_id', ...)->sum('amount')`. **File:** `app/Http/Controllers/ReportController.php` lines 62–63.

- [x] **FIX-04** — `PartyController::ledger()` — Entire party ledger function reads from `sales.total`, `invoices.total_amount`, `payments.amount` instead of `journal_items`. This is the "party statement for non-reporting use". Must be replaced with V3 journal query (same pattern as `ReportController::partyStatement()`). **File:** `app/Http/Controllers/PartyController.php` lines 221–327.

---

### 🟠 HIGH — Stale Data Causing Potential Inconsistencies

- [x] **FIX-05** — `FinanceController::destroyBankAccount()` — Checks `$bankAccount->current_balance` (stale column) as a guard before deletion. Should call `$bankAccount->v3Balance()` instead. **File:** `app/Http/Controllers/FinanceController.php` line 298.

- [x] **FIX-06** — `ReportController::dayBook()` — Day Book reads from `Sale.total`, `Invoice.total_amount`, `Expense.amount` directly without going through journal. Should be rebuilt on top of `journal_items` for the day. **File:** `app/Http/Controllers/ReportController.php` lines 154–183.

- [x] **FIX-07** — `PurchaseController::index()` stats — `stats.total_purchase`, `stats.total_paid`, `stats.total_due` all read directly from `invoices` table. Should read from journal_items (AP account 2000) like `FinanceController`. **File:** `app/Http/Controllers/PurchaseController.php` lines 106–114.

- [x] **FIX-08** — `ReportController::purchases()` — Same issue as FIX-07 for the Purchases Report page. **File:** `app/Http/Controllers/ReportController.php` lines 134–138.

---

### 🟡 MEDIUM — Fallback Logic May Return Wrong Data in Edge Cases

- [x] **FIX-09** — `DashboardController::getPLSummary()` — Has a fallback to `Sale::sum()` + `Expense::sum()` when `income == 0` from journal. This fallback uses OLD sources. The condition should be removed; if journal is empty, show zeros. **File:** `app/Http/Controllers/DashboardController.php` (getPLSummary method).

- [x] **FIX-10** — `ReportController::saleAging()` — Uses `Sale.total` as fallback when no journal entries found for a sale. Should use `Sale.net_sales` instead. **File:** `app/Http/Controllers/ReportController.php` line 859.

- [x] **FIX-11** — `SaleController::store()` — On overpayment + ledger, writes to `Party.current_balance` directly (lines 394, 454). This updates the OLD stale column. The journal entry already handles this correctly; the direct column update causes double-counting. **File:** `app/Http/Controllers/SaleController.php` lines 394–456. *(Confirmed not present — already clean.)*

- [x] **FIX-12** — `PurchaseController::store()` — Writes to `Party.current_balance` via `increment()` (line 221) AND creates journal entry. Same double-counting risk. **File:** `app/Http/Controllers/PurchaseController.php` line 221.

---

### 🔵 LOW — Cosmetic / Minor Data Quality

- [x] **FIX-13** — `Dashboard.jsx` — Per-sale outstanding shown as `sale.total - sale.paid_amount`. `sale.total` is the OLD backward-compat column. *(Confirmed not present in current Dashboard.jsx — already clean.)*

- [x] **FIX-14** — `ReportController::stockValuation()` — `stats.total_retail_value` and `stats.potential_profit` rely on `products.price` (could be stale). Accepted as low risk — retail price is a live column.

- [x] **FIX-15** — `PosController::checkout()` — This is a legacy/unused POS checkout route that still creates `Invoice` records (not `Sale` records), bypasses V3 accounting entirely. **Disabled** with HTTP 410 response. **File:** `app/Http/Controllers/PosController.php`.

- [x] **FIX-16** — `ReportController::expenses()` — Reads from `expenses` table directly. Operationally correct. Accepted as-is; expenses table IS the source of truth for individual expense records.

- [x] **FIX-17** — `ReportController::discountReport()` — Reads from `Invoice.discount` which is the OLD invoices table. **Switched to `Sale.discount`** (V3 sales table). **File:** `app/Http/Controllers/ReportController.php`.

- [x] **FIX-18** — `PurchaseController::store()` — Still writes `transactions` table (old ledger) in addition to V3 journal entries. **Removed** the `Transaction::create()` call and `Party.current_balance` increment. **File:** `app/Http/Controllers/PurchaseController.php`.

---

## APPENDIX — Source Legend

| Symbol | Meaning |
|---|---|
| ✅ V3 | Reads from `journal_items`, `inventory_batches`, `FinancialReportingService`, `BankAccount::v3Balance()`, or `AccountingService->getBalance()` |
| ❌ OLD | Reads from `parties.current_balance`, `accounts.balance`, `BankAccount.current_balance`, `Sale::sum('total')`, `Invoice::sum('total_amount')`, `Expense::sum('amount')`, or `products.stock_quantity` column |
| ⚠️ Mixed | Logic uses V3 first but has OLD fallback, or partially reads from both |
| N/A | Non-financial count/label — source doesn't matter for financial accuracy |

---

*Audit completed by: VenQore System Brain*  
*Next step: Execute fixes in order FIX-01 → FIX-04 first (Critical), then FIX-05 → FIX-08 (High)*


---

## REMAINING PAGES AUDIT (Auto-Generated)

This section covers the remainder of the 218 UI pages that do not belong to the primary dashboard/reports above.

### PAGE: Accounting/BalanceSheet
**FILE:** `resources/js/Pages/Accounting/BalanceSheet.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, balance` | Unknown source | ⚠️ |

---

### PAGE: Accounting/ChartOfAccounts
**FILE:** `resources/js/Pages/Accounting/ChartOfAccounts.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `balance` | Unknown source | ⚠️ |

---

### PAGE: Accounting/ProfitLoss
**FILE:** `resources/js/Pages/Accounting/ProfitLoss.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `profit, total, balance` | Unknown source | ⚠️ |

---

### PAGE: ActivityLog
**FILE:** `resources/js/Pages/ActivityLog.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Admin/Database
**FILE:** `resources/js/Pages/Admin/Database.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Admin/DataManagement
**FILE:** `resources/js/Pages/Admin/DataManagement.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Admin/DataMapping
**FILE:** `resources/js/Pages/Admin/DataMapping.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Admin/ExecutiveDashboard
**FILE:** `resources/js/Pages/Admin/ExecutiveDashboard.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `profit, total, revenue, cash, balance` | Unknown source | ⚠️ |

---

### PAGE: Admin/Logs
**FILE:** `resources/js/Pages/Admin/Logs.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Admin/Migration
**FILE:** `resources/js/Pages/Admin/Migration.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Admin/Settings
**FILE:** `resources/js/Pages/Admin/Settings.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cash, total, balance` | Unknown source | ⚠️ |

---

### PAGE: Admin/StaffSummaries
**FILE:** `resources/js/Pages/Admin/StaffSummaries.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Admin/Users
**FILE:** `resources/js/Pages/Admin/Users.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cash, total` | Unknown source | ⚠️ |

---

### PAGE: Auth/ConfirmPassword
**FILE:** `resources/js/Pages/Auth/ConfirmPassword.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Auth/ForgotPassword
**FILE:** `resources/js/Pages/Auth/ForgotPassword.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Auth/Login
**FILE:** `resources/js/Pages/Auth/Login.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Auth/Register
**FILE:** `resources/js/Pages/Auth/Register.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Auth/ResetPassword
**FILE:** `resources/js/Pages/Auth/ResetPassword.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Auth/VerifyEmail
**FILE:** `resources/js/Pages/Auth/VerifyEmail.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: BankAccounts/BankAccountsList
**FILE:** `resources/js/Pages/BankAccounts/BankAccountsList.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `opening_balance, current_balance, total, balance, cash` | Unknown source | ⚠️ |

---

### PAGE: BankAccounts/Transactions
**FILE:** `resources/js/Pages/BankAccounts/Transactions.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `balance, current_balance, amount` | Unknown source | ⚠️ |

---

### PAGE: BankReconciliation/BankReconciliation
**FILE:** `resources/js/Pages/BankReconciliation/BankReconciliation.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, amount` | Unknown source | ⚠️ |

---

### PAGE: BatchTracking/BatchTracking
**FILE:** `resources/js/Pages/BatchTracking/BatchTracking.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Cookbook/Create
**FILE:** `resources/js/Pages/Cookbook/Create.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, profit, total` | Unknown source | ⚠️ |

---

### PAGE: Cookbook/RecipesList
**FILE:** `resources/js/Pages/Cookbook/RecipesList.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, profit, total` | Unknown source | ⚠️ |

---

### PAGE: DebitNotes/Create
**FILE:** `resources/js/Pages/DebitNotes/Create.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount, cost, cash, profit, total, subtotal, balance, amount_paid, current_balance, revenue` | Unknown source | ⚠️ |

---

### PAGE: DebitNotes/DebitNotes
**FILE:** `resources/js/Pages/DebitNotes/DebitNotes.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, amount` | Unknown source | ⚠️ |

---

### PAGE: EInvoicing/EInvoicing
**FILE:** `resources/js/Pages/EInvoicing/EInvoicing.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount` | Unknown source | ⚠️ |

---

### PAGE: Expenses/ExpensesList
**FILE:** `resources/js/Pages/Expenses/ExpensesList.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount, cash, total, current_balance` | Unknown source | ⚠️ |

---

### PAGE: Finance/FinanceDashboard
**FILE:** `resources/js/Pages/Finance/FinanceDashboard.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `receivables, payables, cash, balance, total, amount, current_balance` | Unknown source | ⚠️ |

---

### PAGE: Finance/Payables
**FILE:** `resources/js/Pages/Finance/Payables.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `payables, balance, total, current_balance` | Unknown source | ⚠️ |

---

### PAGE: Finance/Receivables
**FILE:** `resources/js/Pages/Finance/Receivables.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `receivables, balance, total, current_balance` | Unknown source | ⚠️ |

---

### PAGE: Funds/FundManagement
**FILE:** `resources/js/Pages/Funds/FundManagement.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount, cash, total, balance` | Unknown source | ⚠️ |

---

### PAGE: GrowthEngine/GrowthDashboard
**FILE:** `resources/js/Pages/GrowthEngine/GrowthDashboard.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `revenue` | Unknown source | ⚠️ |

---

### PAGE: Home
**FILE:** `resources/js/Pages/Home.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, amount` | Unknown source | ⚠️ |

---

### PAGE: ImportExport/DataManager
**FILE:** `resources/js/Pages/ImportExport/DataManager.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `balance` | Unknown source | ⚠️ |

---

### PAGE: Installer/Index
**FILE:** `resources/js/Pages/Installer/Index.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Inventory/Attributes/AttributesList
**FILE:** `resources/js/Pages/Inventory/Attributes/AttributesList.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Inventory/Categories
**FILE:** `resources/js/Pages/Inventory/Categories.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Inventory/InventoryList
**FILE:** `resources/js/Pages/Inventory/InventoryList.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, total` | Unknown source | ⚠️ |

---

### PAGE: Inventory/Production/Create
**FILE:** `resources/js/Pages/Inventory/Production/Create.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Inventory/Production/ProductionRuns
**FILE:** `resources/js/Pages/Inventory/Production/ProductionRuns.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, total` | Unknown source | ⚠️ |

---

### PAGE: Inventory/StockLevels
**FILE:** `resources/js/Pages/Inventory/StockLevels.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, cost` | Unknown source | ⚠️ |

---

### PAGE: Inventory/Variants/VariantsList
**FILE:** `resources/js/Pages/Inventory/Variants/VariantsList.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Labels/LabelPrinter
**FILE:** `resources/js/Pages/Labels/LabelPrinter.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Manufacturing/Rules
**FILE:** `resources/js/Pages/Manufacturing/Rules.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Marketing/Campaigns
**FILE:** `resources/js/Pages/Marketing/Campaigns.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Notifications/NotificationCenter
**FILE:** `resources/js/Pages/Notifications/NotificationCenter.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: OnlineStore/OnlineStore
**FILE:** `resources/js/Pages/OnlineStore/OnlineStore.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Parties/Ledger
**FILE:** `resources/js/Pages/Parties/Ledger.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `opening_balance, total, balance` | Unknown source | ⚠️ |

---

### PAGE: Parties/PartiesList
**FILE:** `resources/js/Pages/Parties/PartiesList.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `opening_balance, balance, current_balance, total, receivables, payables` | Unknown source | ⚠️ |

---

### PAGE: Payments/In
**FILE:** `resources/js/Pages/Payments/In.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount, cash` | Unknown source | ⚠️ |

---

### PAGE: Payments/Out
**FILE:** `resources/js/Pages/Payments/Out.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount, cash` | Unknown source | ⚠️ |

---

### PAGE: Payments/PaymentsList
**FILE:** `resources/js/Pages/Payments/PaymentsList.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cash, amount` | Unknown source | ⚠️ |

---

### PAGE: Pos
**FILE:** `resources/js/Pages/Pos.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cash, amount, subtotal, total, amount_paid, cost` | Unknown source | ⚠️ |

---

### PAGE: PreSales/BestPreSales
**FILE:** `resources/js/Pages/PreSales/BestPreSales.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount, total` | Unknown source | ⚠️ |

---

### PAGE: Profile/Edit
**FILE:** `resources/js/Pages/Profile/Edit.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Proposals/Create
**FILE:** `resources/js/Pages/Proposals/Create.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, amount, cash, total, profit, subtotal, balance, current_balance, revenue` | Unknown source | ⚠️ |

---

### PAGE: Proposals/ProposalsList
**FILE:** `resources/js/Pages/Proposals/ProposalsList.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount, total, subtotal` | Unknown source | ⚠️ |

---

### PAGE: Proposals/Show
**FILE:** `resources/js/Pages/Proposals/Show.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount, total` | Unknown source | ⚠️ |

---

### PAGE: PurchaseOrders/Create
**FILE:** `resources/js/Pages/PurchaseOrders/Create.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, amount, cash, profit, total, subtotal, balance, amount_paid, current_balance, revenue` | Unknown source | ⚠️ |

---

### PAGE: PurchaseOrders/PurchaseOrdersList
**FILE:** `resources/js/Pages/PurchaseOrders/PurchaseOrdersList.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: PurchaseOrders/Show
**FILE:** `resources/js/Pages/PurchaseOrders/Show.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, total, amount` | Unknown source | ⚠️ |

---

### PAGE: Purchases/Create
**FILE:** `resources/js/Pages/Purchases/Create.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, total, amount, cash, profit, subtotal, balance, amount_paid, current_balance, revenue` | Unknown source | ⚠️ |

---

### PAGE: Purchases/PurchasesList
**FILE:** `resources/js/Pages/Purchases/PurchasesList.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, amount, balance, subtotal, payment_status, cash` | Unknown source | ⚠️ |

---

### PAGE: Purchases/Receive
**FILE:** `resources/js/Pages/Purchases/Receive.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Purchases/Show
**FILE:** `resources/js/Pages/Purchases/Show.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount, total, subtotal` | Unknown source | ⚠️ |

---

### PAGE: RecurringInvoices/RecurringInvoices
**FILE:** `resources/js/Pages/RecurringInvoices/RecurringInvoices.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, revenue, amount` | Unknown source | ⚠️ |

---

### PAGE: RecycleBin
**FILE:** `resources/js/Pages/RecycleBin.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Reminders/InvoiceReminders
**FILE:** `resources/js/Pages/Reminders/InvoiceReminders.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Reports/AccountLedger
**FILE:** `resources/js/Pages/Reports/AccountLedger.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `balance, total` | Unknown source | ⚠️ |

---

### PAGE: Reports/AllParties
**FILE:** `resources/js/Pages/Reports/AllParties.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `balance` | Unknown source | ⚠️ |

---

### PAGE: Reports/BankStatement
**FILE:** `resources/js/Pages/Reports/BankStatement.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `balance, opening_balance, total, amount` | Unknown source | ⚠️ |

---

### PAGE: Reports/BillWiseProfit
**FILE:** `resources/js/Pages/Reports/BillWiseProfit.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `profit, revenue, total, cost` | Unknown source | ⚠️ |

---

### PAGE: Reports/CashFlow
**FILE:** `resources/js/Pages/Reports/CashFlow.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cash` | Unknown source | ⚠️ |

---

### PAGE: Reports/Components/ReportPage
**FILE:** `resources/js/Pages/Reports/Components/ReportPage.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Reports/DayBook
**FILE:** `resources/js/Pages/Reports/DayBook.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cash, total, amount` | Unknown source | ⚠️ |

---

### PAGE: Reports/DiscountReport
**FILE:** `resources/js/Pages/Reports/DiscountReport.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `subtotal, total, amount` | Unknown source | ⚠️ |

---

### PAGE: Reports/ExpenseByCategory
**FILE:** `resources/js/Pages/Reports/ExpenseByCategory.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Reports/ExpenseByItem
**FILE:** `resources/js/Pages/Reports/ExpenseByItem.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount` | Unknown source | ⚠️ |

---

### PAGE: Reports/Expenses
**FILE:** `resources/js/Pages/Reports/Expenses.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, total, balance, revenue, amount` | Unknown source | ⚠️ |

---

### PAGE: Reports/ExpiryReport
**FILE:** `resources/js/Pages/Reports/ExpiryReport.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Reports/GenericReport
**FILE:** `resources/js/Pages/Reports/GenericReport.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Reports/GraphAnalytics
**FILE:** `resources/js/Pages/Reports/GraphAnalytics.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, revenue, balance, outstanding` | Unknown source | ⚠️ |

---

### PAGE: Reports/ItemCategoryWiseProfitLoss
**FILE:** `resources/js/Pages/Reports/ItemCategoryWiseProfitLoss.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `profit, revenue, cost` | Unknown source | ⚠️ |

---

### PAGE: Reports/ItemDetail
**FILE:** `resources/js/Pages/Reports/ItemDetail.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost` | Unknown source | ⚠️ |

---

### PAGE: Reports/ItemReportByParty
**FILE:** `resources/js/Pages/Reports/ItemReportByParty.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, revenue, subtotal` | Unknown source | ⚠️ |

---

### PAGE: Reports/ItemWiseDiscount
**FILE:** `resources/js/Pages/Reports/ItemWiseDiscount.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Reports/ItemWiseProfit
**FILE:** `resources/js/Pages/Reports/ItemWiseProfit.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `profit, total, revenue, balance, cash` | Unknown source | ⚠️ |

---

### PAGE: Reports/LoanStatement
**FILE:** `resources/js/Pages/Reports/LoanStatement.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Reports/LowStock
**FILE:** `resources/js/Pages/Reports/LowStock.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, cost` | Unknown source | ⚠️ |

---

### PAGE: Reports/MovementHistory
**FILE:** `resources/js/Pages/Reports/MovementHistory.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Reports/PartyReportByItem
**FILE:** `resources/js/Pages/Reports/PartyReportByItem.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, revenue, subtotal` | Unknown source | ⚠️ |

---

### PAGE: Reports/PartyStatement
**FILE:** `resources/js/Pages/Reports/PartyStatement.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `balance, total` | Unknown source | ⚠️ |

---

### PAGE: Reports/PartyWiseProfitLoss
**FILE:** `resources/js/Pages/Reports/PartyWiseProfitLoss.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `profit, total` | Unknown source | ⚠️ |

---

### PAGE: Reports/ProfitLoss
**FILE:** `resources/js/Pages/Reports/ProfitLoss.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `profit, revenue, cogs, gross_profit, cost, total, amount, subtotal` | Unknown source | ⚠️ |

---

### PAGE: Reports/Purchases
**FILE:** `resources/js/Pages/Reports/Purchases.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, balance, cost, amount, outstanding` | Unknown source | ⚠️ |

---

### PAGE: Reports/ReportsHub
**FILE:** `resources/js/Pages/Reports/ReportsHub.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `revenue, profit, cost, outstanding, receivables, cash, total, balance` | Unknown source | ⚠️ |

---

### PAGE: Reports/SaleAging
**FILE:** `resources/js/Pages/Reports/SaleAging.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount, total, outstanding, receivables` | Unknown source | ⚠️ |

---

### PAGE: Reports/SaleOrderItems
**FILE:** `resources/js/Pages/Reports/SaleOrderItems.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `subtotal, total, revenue` | Unknown source | ⚠️ |

---

### PAGE: Reports/SaleOrders
**FILE:** `resources/js/Pages/Reports/SaleOrders.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount, total` | Unknown source | ⚠️ |

---

### PAGE: Reports/SalePurchaseByItemCategory
**FILE:** `resources/js/Pages/Reports/SalePurchaseByItemCategory.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `subtotal` | Unknown source | ⚠️ |

---

### PAGE: Reports/SalePurchaseByParty
**FILE:** `resources/js/Pages/Reports/SalePurchaseByParty.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Reports/SalePurchaseByPartyGroup
**FILE:** `resources/js/Pages/Reports/SalePurchaseByPartyGroup.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Reports/Sales
**FILE:** `resources/js/Pages/Reports/Sales.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `revenue, total, cash, outstanding, payment_status, amount, balance` | Unknown source | ⚠️ |

---

### PAGE: Reports/StockAging
**FILE:** `resources/js/Pages/Reports/StockAging.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, cost` | Unknown source | ⚠️ |

---

### PAGE: Reports/StockSummaryByCategory
**FILE:** `resources/js/Pages/Reports/StockSummaryByCategory.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Reports/StockValuation
**FILE:** `resources/js/Pages/Reports/StockValuation.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, cost, profit, stock_value` | Unknown source | ⚠️ |

---

### PAGE: Reports/Tax
**FILE:** `resources/js/Pages/Reports/Tax.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, amount` | Unknown source | ⚠️ |

---

### PAGE: Reports/TaxRateReport
**FILE:** `resources/js/Pages/Reports/TaxRateReport.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Reports/Transactions
**FILE:** `resources/js/Pages/Reports/Transactions.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount` | Unknown source | ⚠️ |

---

### PAGE: Reports/TrialBalance
**FILE:** `resources/js/Pages/Reports/TrialBalance.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `balance, total` | Unknown source | ⚠️ |

---

### PAGE: Returns/Create
**FILE:** `resources/js/Pages/Returns/Create.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, amount, cash, total, profit, subtotal, balance, current_balance, revenue` | Unknown source | ⚠️ |

---

### PAGE: Returns/ReturnsHistory
**FILE:** `resources/js/Pages/Returns/ReturnsHistory.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount, total, cash` | Unknown source | ⚠️ |

---

### PAGE: Sales/Analytics
**FILE:** `resources/js/Pages/Sales/Analytics.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `revenue, total` | Unknown source | ⚠️ |

---

### PAGE: Sales/CreateInvoice
**FILE:** `resources/js/Pages/Sales/CreateInvoice.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, amount, cash, total, profit, subtotal, balance, amount_paid, current_balance, revenue` | Unknown source | ⚠️ |

---

### PAGE: Sales/CreatePreSale
**FILE:** `resources/js/Pages/Sales/CreatePreSale.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, amount, cash, total, profit, subtotal, balance, amount_paid, current_balance, revenue` | Unknown source | ⚠️ |

---

### PAGE: Sales/CreatePreSale_BACKUP
**FILE:** `resources/js/Pages/Sales/CreatePreSale_BACKUP.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, amount, cash, total, profit, subtotal, balance, amount_paid, current_balance, revenue` | Unknown source | ⚠️ |

---

### PAGE: Sales/Customers/CustomersList
**FILE:** `resources/js/Pages/Sales/Customers/CustomersList.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Sales/MasterSales
**FILE:** `resources/js/Pages/Sales/MasterSales.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `balance, profit, cost, cash, revenue, total, subtotal` | Unknown source | ⚠️ |

---

### PAGE: Sales/Orders/SalesOrdersList
**FILE:** `resources/js/Pages/Sales/Orders/SalesOrdersList.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Sales/ParkedSales
**FILE:** `resources/js/Pages/Sales/ParkedSales.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Sales/SalesHistory
**FILE:** `resources/js/Pages/Sales/SalesHistory.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount, balance, total, payment_status, cash, subtotal` | Unknown source | ⚠️ |

---

### PAGE: Sales/Show
**FILE:** `resources/js/Pages/Sales/Show.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cash, total, amount, payment_status, subtotal, balance` | Unknown source | ⚠️ |

---

### PAGE: SalesOrders/CreatePreSale
**FILE:** `resources/js/Pages/SalesOrders/CreatePreSale.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, amount, cash, total, profit, subtotal, balance, current_balance, revenue` | Unknown source | ⚠️ |

---

### PAGE: SalesOrders/PreSales
**FILE:** `resources/js/Pages/SalesOrders/PreSales.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, amount, balance` | Unknown source | ⚠️ |

---

### PAGE: SerialTracking/SerialTracking
**FILE:** `resources/js/Pages/SerialTracking/SerialTracking.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Settings/SettingsPanel
**FILE:** `resources/js/Pages/Settings/SettingsPanel.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cash, total, amount, profit` | Unknown source | ⚠️ |

---

### PAGE: SetupWizard
**FILE:** `resources/js/Pages/SetupWizard.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: StaffAttendance/Show
**FILE:** `resources/js/Pages/StaffAttendance/Show.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: StaffAttendance/StaffAttendance
**FILE:** `resources/js/Pages/StaffAttendance/StaffAttendance.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: StockOperations
**FILE:** `resources/js/Pages/StockOperations.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: StockTake/Create
**FILE:** `resources/js/Pages/StockTake/Create.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: StockTake/Show
**FILE:** `resources/js/Pages/StockTake/Show.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, cost` | Unknown source | ⚠️ |

---

### PAGE: StockTake/StockTake
**FILE:** `resources/js/Pages/StockTake/StockTake.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: StockTransfers/Create
**FILE:** `resources/js/Pages/StockTransfers/Create.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: StockTransfers/Show
**FILE:** `resources/js/Pages/StockTransfers/Show.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: StockTransfers/StockTransfers
**FILE:** `resources/js/Pages/StockTransfers/StockTransfers.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: Suppliers/SuppliersList
**FILE:** `resources/js/Pages/Suppliers/SuppliersList.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Transactions/TransactionsList
**FILE:** `resources/js/Pages/Transactions/TransactionsList.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `amount, balance, payment_status, total` | Unknown source | ⚠️ |

---

### PAGE: Updater/Index
**FILE:** `resources/js/Pages/Updater/Index.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total` | Unknown source | ⚠️ |

---

### PAGE: V3/Products/Create
**FILE:** `resources/js/Pages/V3/Products/Create.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: V3/Products/Edit
**FILE:** `resources/js/Pages/V3/Products/Edit.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: V3/Products/Index
**FILE:** `resources/js/Pages/V3/Products/Index.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: V3/Products/PriceTiers
**FILE:** `resources/js/Pages/V3/Products/PriceTiers.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: V3/Products/UomConversions
**FILE:** `resources/js/Pages/V3/Products/UomConversions.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: V3/Purchases/Create
**FILE:** `resources/js/Pages/V3/Purchases/Create.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cash, cost, total` | Unknown source | ⚠️ |

---

### PAGE: V3/Purchases/Index
**FILE:** `resources/js/Pages/V3/Purchases/Index.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, payment_status` | Unknown source | ⚠️ |

---

### PAGE: V3/Purchases/Return
**FILE:** `resources/js/Pages/V3/Purchases/Return.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `cost, total` | Unknown source | ⚠️ |

---

### PAGE: V3/Purchases/Show
**FILE:** `resources/js/Pages/V3/Purchases/Show.jsx`
**CONTROLLER:** Unknown
**V3 Status:** ⚠️ UNKNOWN

| # | Display Label | Variable/Prop | Controller Source | V3? |
|---|---|---|---|---|
| 1 | Detected Terms | `total, payment_status, cost` | Unknown source | ⚠️ |

---

### PAGE: V3/Warehouses/Create
**FILE:** `resources/js/Pages/V3/Warehouses/Create.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: V3/Warehouses/Edit
**FILE:** `resources/js/Pages/V3/Warehouses/Edit.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: V3/Warehouses/Index
**FILE:** `resources/js/Pages/V3/Warehouses/Index.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: Welcome
**FILE:** `resources/js/Pages/Welcome.jsx`
**V3 Status:** N/A (No financial data displayed)

---

### PAGE: WooCommerce/WooCommerce
**FILE:** `resources/js/Pages/WooCommerce/WooCommerce.jsx`
**V3 Status:** N/A (No financial data displayed)


---

## COMPONENTS AUDIT (Auto-Generated)

This section covers the reusable UI components.

### COMPONENT: AiAssistantModal
**FILE:** `resources/js/Components/AiAssistantModal.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `profit, revenue, cost` | ⚠️ |

---

### COMPONENT: AiSettingsSection
**FILE:** `resources/js/Components/AiSettingsSection.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: AlertModal
**FILE:** `resources/js/Components/AlertModal.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: ApplicationLogo
**FILE:** `resources/js/Components/ApplicationLogo.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: AsyncProductCombobox
**FILE:** `resources/js/Components/AsyncProductCombobox.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `cost` | ⚠️ |

---

### COMPONENT: BusinessSettingsSection
**FILE:** `resources/js/Components/BusinessSettingsSection.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: CharityButton
**FILE:** `resources/js/Components/CharityButton.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `amount, total` | ⚠️ |

---

### COMPONENT: ChartSection
**FILE:** `resources/js/Components/ChartSection.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `total, profit, revenue` | ⚠️ |

---

### COMPONENT: Checkbox
**FILE:** `resources/js/Components/Checkbox.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: CommandPalette
**FILE:** `resources/js/Components/CommandPalette.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `cash, revenue, profit, balance` | ⚠️ |

---

### COMPONENT: ConfirmModal
**FILE:** `resources/js/Components/ConfirmModal.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: ConnectionGuard
**FILE:** `resources/js/Components/ConnectionGuard.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: ContactsModuleTabs
**FILE:** `resources/js/Components/ContactsModuleTabs.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: DangerButton
**FILE:** `resources/js/Components/DangerButton.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: DangerSettingsSection
**FILE:** `resources/js/Components/DangerSettingsSection.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: DataTable
**FILE:** `resources/js/Components/DataTable.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `total` | ⚠️ |

---

### COMPONENT: Dropdown
**FILE:** `resources/js/Components/Dropdown.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: DualStatCard
**FILE:** `resources/js/Components/DualStatCard.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: ErrorBoundary
**FILE:** `resources/js/Components/ErrorBoundary.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: FeatureLockBadge
**FILE:** `resources/js/Components/FeatureLockBadge.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: FilterPanel
**FILE:** `resources/js/Components/FilterPanel.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: FloatingAiBubble
**FILE:** `resources/js/Components/FloatingAiBubble.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: FormModal
**FILE:** `resources/js/Components/FormModal.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: GeneralSettingsSection
**FILE:** `resources/js/Components/GeneralSettingsSection.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: GlobalErrorBoundary
**FILE:** `resources/js/Components/GlobalErrorBoundary.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: InputError
**FILE:** `resources/js/Components/InputError.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: InputLabel
**FILE:** `resources/js/Components/InputLabel.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: InputModal
**FILE:** `resources/js/Components/InputModal.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: KeyboardShortcutsModal
**FILE:** `resources/js/Components/KeyboardShortcutsModal.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `cash` | ⚠️ |

---

### COMPONENT: MidnightNebula
**FILE:** `resources/js/Components/MidnightNebula.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: Modal
**FILE:** `resources/js/Components/Modal.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: MoneyModuleTabs
**FILE:** `resources/js/Components/MoneyModuleTabs.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `cash, receivables, payables` | ⚠️ |

---

### COMPONENT: NavLink
**FILE:** `resources/js/Components/NavLink.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: OfflineLockScreen
**FILE:** `resources/js/Components/OfflineLockScreen.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: OfflineWarningBanner
**FILE:** `resources/js/Components/OfflineWarningBanner.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: OmniSearch
**FILE:** `resources/js/Components/OmniSearch.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `total, profit` | ⚠️ |

---

### COMPONENT: OnboardingDriver
**FILE:** `resources/js/Components/OnboardingDriver.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `cash` | ⚠️ |

---

### COMPONENT: OnboardingTour
**FILE:** `resources/js/Components/OnboardingTour.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `outstanding, balance` | ⚠️ |

---

### COMPONENT: PageHeader
**FILE:** `resources/js/Components/PageHeader.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: Pagination
**FILE:** `resources/js/Components/Pagination.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: PasscodeModal
**FILE:** `resources/js/Components/PasscodeModal.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: Pos/PaymentModal
**FILE:** `resources/js/Components/Pos/PaymentModal.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `total, cash, amount, balance` | ⚠️ |

---

### COMPONENT: PremiumButton
**FILE:** `resources/js/Components/PremiumButton.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: PremiumDropdown
**FILE:** `resources/js/Components/PremiumDropdown.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: PremiumSelect
**FILE:** `resources/js/Components/PremiumSelect.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: PrimaryButton
**FILE:** `resources/js/Components/PrimaryButton.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: PrintButton
**FILE:** `resources/js/Components/PrintButton.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: PrintPreview
**FILE:** `resources/js/Components/PrintPreview.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `amount, subtotal, total, amount_paid, cash, balance` | ⚠️ |

---

### COMPONENT: PrintSettingsSection
**FILE:** `resources/js/Components/PrintSettingsSection.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `total, balance, amount, cash` | ⚠️ |

---

### COMPONENT: ProductModal
**FILE:** `resources/js/Components/ProductModal.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `cost, total, profit, payment_status, subtotal` | ⚠️ |

---

### COMPONENT: PurchaseModuleTabs
**FILE:** `resources/js/Components/PurchaseModuleTabs.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: PwaInstallPrompt
**FILE:** `resources/js/Components/PwaInstallPrompt.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: QuickPartyModal
**FILE:** `resources/js/Components/QuickPartyModal.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `opening_balance, balance` | ⚠️ |

---

### COMPONENT: Reports/MasterReport
**FILE:** `resources/js/Components/Reports/MasterReport.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `total` | ⚠️ |

---

### COMPONENT: ReportsNavigation
**FILE:** `resources/js/Components/ReportsNavigation.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `profit, balance` | ⚠️ |

---

### COMPONENT: ResponsiveNavLink
**FILE:** `resources/js/Components/ResponsiveNavLink.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: RightPanel
**FILE:** `resources/js/Components/RightPanel.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `cash, amount, total, balance, current_balance, cost` | ⚠️ |

---

### COMPONENT: Sales/SalesMasterUI
**FILE:** `resources/js/Components/Sales/SalesMasterUI.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `cash, profit, total, cost, balance, current_balance, subtotal, amount, revenue` | ⚠️ |

---

### COMPONENT: SecondaryButton
**FILE:** `resources/js/Components/SecondaryButton.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: SectionHeader
**FILE:** `resources/js/Components/SectionHeader.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: SellModuleTabs
**FILE:** `resources/js/Components/SellModuleTabs.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: SidebarItem
**FILE:** `resources/js/Components/SidebarItem.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `receivables, payables, balance, profit, cash` | ⚠️ |

---

### COMPONENT: SmartCombobox
**FILE:** `resources/js/Components/SmartCombobox.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `cost, balance, current_balance, profit` | ⚠️ |

---

### COMPONENT: StatCard
**FILE:** `resources/js/Components/StatCard.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: StockModuleTabs
**FILE:** `resources/js/Components/StockModuleTabs.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: SystemSettingsSection
**FILE:** `resources/js/Components/SystemSettingsSection.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `total` | ⚠️ |

---

### COMPONENT: TaxSettingsSection
**FILE:** `resources/js/Components/TaxSettingsSection.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: TerminalStatusBadge
**FILE:** `resources/js/Components/TerminalStatusBadge.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: TextInput
**FILE:** `resources/js/Components/TextInput.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: Toast
**FILE:** `resources/js/Components/Toast.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: TodaysOpportunities
**FILE:** `resources/js/Components/TodaysOpportunities.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `revenue` | ⚠️ |

---

### COMPONENT: Toggle
**FILE:** `resources/js/Components/Toggle.jsx`
**V3 Status:** N/A (No financial data)

---

### COMPONENT: Transactions/TransactionMasterUI
**FILE:** `resources/js/Components/Transactions/TransactionMasterUI.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `total, amount, balance` | ⚠️ |

---

### COMPONENT: TransactionSettingsSection
**FILE:** `resources/js/Components/TransactionSettingsSection.jsx`
**CONTROLLER:** N/A (Receives Props)
**V3 Status:** ⚠️ Prop checks required

| # | Display Label | Detected Terms | V3? |
|---|---|---|---|
| 1 | Auto-Detected | `cash, total, profit` | ⚠️ |

---

### COMPONENT: VersionChecker
**FILE:** `resources/js/Components/VersionChecker.jsx`
**V3 Status:** N/A (No financial data)

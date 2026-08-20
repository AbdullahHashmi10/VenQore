# VenQore card catalogue

Every metric card in the product, sorted the way the card builder will present it:
**role → business area → module → card category**.

Source: the 85 metric tiles lifted from `OLD Cards.html` §06 (the summary strip on
every list page), classified against Layout Law v2.0's six categories and the
Reckoner's reading registry.

---

## 1. What exists

| | |
|---|---|
| Metric cards | **85** |
| Modules | **19** |
| Business areas | **5** |
| Tenant roles | **10** |
| Backed by an existing Reckoner reading | **35** of 85 |
| **Needing a NEW Reckoner reading** | **50** |

> The last row is the real build cost. A card cannot ship before the reading
> behind it exists — the Reckoner is the only place a number may be defined.

## 2. Cards with no reading yet

Grouped by the Source that would own them.

**`FinanceSource`** — 12 readings

- Accounting · Assets
- Accounting · Expense (YTD)
- Accounting · Income (YTD)
- Accounting · Liabilities
- BankAccounts · Cash on Hand
- BankAccounts · Money In (Today)
- BankAccounts · Money Out (Today)
- BankAccounts · Total Balance
- BankReconciliation · Matched
- BankReconciliation · Total Txns
- BankReconciliation · Unmatched
- Finance · Avg Balance

**`InventorySource`** — 12 readings

- BatchTracking · Expired
- BatchTracking · Expiring Soon
- BatchTracking · Total Batches
- BatchTracking · Total Qty
- Inventory · Completed Today
- Inventory · Main Categories
- Inventory · Products Linked
- Inventory · Total Categories
- SerialTracking · In Stock
- SerialTracking · Returned
- SerialTracking · Sold
- SerialTracking · Total Serials

**`PurchasingSource`** — 4 readings

- DebitNotes · Open Credits
- DebitNotes · Total Notes
- PurchaseOrders · Pending
- PurchaseOrders · Received

**`SalesSource`** — 18 readings

- PreSales · Pending
- PreSales · Total Quotes
- Proposals · Accepted
- Proposals · Pending
- Proposals · Total Proposals
- RecurringInvoices · Active
- RecurringInvoices · Monthly Revenue
- RecurringInvoices · Paused
- RecurringInvoices · Total
- Reminders · Overdue
- Reminders · Pending
- Reminders · Sent
- Reminders · Total Scheduled
- Returns · Items Returned
- Returns · Total Refunded
- Returns · Total Returns
- SalesOrders · Confirmed
- SalesOrders · Pending

**`StaffSource`** — 3 readings

- StaffAttendance · Absent
- StaffAttendance · Hours Today
- StaffAttendance · Pending Gaps

---

## 3. By role

What each role's dashboard may offer. A card the role cannot see is never
rendered and never reaches the builder's picker.

### Store Owner

**85 cards** across 5 areas.

#### Sales · 26 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| PreSales | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| PreSales | Total Quotes | **C2 Strip** | 4x1 inline | count | — _new_ |
| Proposals | Accepted | **C2 Strip** | 4x1 inline | count | — _new_ |
| Proposals | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| Proposals | Total Proposals | **C2 Strip** | 4x1 inline | count | — _new_ |
| Proposals | Total Value | **C3 Metric** | 3x2 standard | currency | `purchasing.spend` |
| RecurringInvoices | Active | **C2 Strip** | 4x1 inline | count | — _new_ |
| RecurringInvoices | Monthly Revenue | **C3 Metric** | 3x2 standard | currency | — _new_ |
| RecurringInvoices | Paused | **C2 Strip** | 4x1 inline | count | — _new_ |
| RecurringInvoices | Total | **C2 Strip** | 4x1 inline | count | — _new_ |
| Reminders | Overdue | **C3 Metric** | 2x2 compact | count | — _new_ |
| Reminders | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| Reminders | Sent | **C2 Strip** | 4x1 inline | count | — _new_ |
| Reminders | Total Scheduled | **C2 Strip** | 4x1 inline | count | — _new_ |
| Returns | Items Returned | **C2 Strip** | 4x1 inline | count | — _new_ |
| Returns | This Month | **C2 Strip** | 4x1 inline | count | `finance.expenses_total` |
| Returns | Total Refunded | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Returns | Total Returns | **C2 Strip** | 4x1 inline | count | — _new_ |
| Sales | Paid Amount | **C2 Strip** | 4x1 inline | currency | `sales.revenue` |
| Sales | Total Sale | **C3 Metric** | 3x2 standard | currency | `sales.revenue` |
| Sales | Transactions | **C2 Strip** | 4x1 inline | count | `sales.revenue` |
| Sales | Unpaid (Due) | **C3 Metric** | 2x2 compact | count | `finance.receivables` |
| SalesOrders | Confirmed | **C2 Strip** | 4x1 inline | count | — _new_ |
| SalesOrders | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| SalesOrders | Total Orders | **C3 Metric** | 3x2 standard | count | `purchasing.count` |
| SalesOrders | Total Value | **C3 Metric** | 3x2 standard | currency | `purchasing.spend` |

#### Purchasing · 7 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| DebitNotes | Open Credits | **C2 Strip** | 4x1 inline | currency | — _new_ |
| DebitNotes | Total Notes | **C2 Strip** | 4x1 inline | count | — _new_ |
| DebitNotes | Total Value | **C3 Metric** | 3x2 standard | currency | `purchasing.spend` |
| PurchaseOrders | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| PurchaseOrders | Received | **C2 Strip** | 4x1 inline | count | — _new_ |
| PurchaseOrders | Total Orders | **C3 Metric** | 3x2 standard | count | `purchasing.count` |
| PurchaseOrders | Total Value | **C3 Metric** | 3x2 standard | currency | `purchasing.spend` |

#### Inventory · 26 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| BatchTracking | Expired | **C3 Metric** | 2x2 compact | count | — _new_ |
| BatchTracking | Expiring Soon | **C3 Metric** | 2x2 compact | count | — _new_ |
| BatchTracking | Total Batches | **C2 Strip** | 4x1 inline | count | — _new_ |
| BatchTracking | Total Qty | **C2 Strip** | 4x1 inline | count | — _new_ |
| Inventory | Active Runs | **C2 Strip** | 4x1 inline | count | `production.run_count` |
| Inventory | Completed Today | **C2 Strip** | 4x1 inline | count | — _new_ |
| Inventory | Cost (Month) | **C2 Strip** | 4x1 inline | currency | `production.total_cost` |
| Inventory | Inventory Value | **C3 Metric** | 3x2 standard | currency | `inventory.stock_value` |
| Inventory | Low Stock | **C3 Metric** | 2x2 compact | count | `inventory.low_stock_count` |
| Inventory | Low Stock | **C3 Metric** | 2x2 compact | count | `inventory.low_stock_count` |
| Inventory | Main Categories | **C2 Strip** | 4x1 inline | count | — _new_ |
| Inventory | Out of Stock | **C3 Metric** | 2x2 compact | count | `inventory.out_of_stock_count` |
| Inventory | Products Linked | **C2 Strip** | 4x1 inline | count | — _new_ |
| Inventory | Stock Value | **C3 Metric** | 3x2 standard | currency | `inventory.stock_value` |
| Inventory | Total Categories | **C2 Strip** | 4x1 inline | count | — _new_ |
| Inventory | Total Products | **C3 Metric** | 3x2 standard | count | `inventory.product_count` |
| Inventory | Total Products | **C3 Metric** | 3x2 standard | count | `inventory.product_count` |
| Inventory | Total Runs | **C2 Strip** | 4x1 inline | count | `production.run_count` |
| SerialTracking | In Stock | **C2 Strip** | 4x1 inline | count | — _new_ |
| SerialTracking | Returned | **C2 Strip** | 4x1 inline | count | — _new_ |
| SerialTracking | Sold | **C2 Strip** | 4x1 inline | count | — _new_ |
| SerialTracking | Total Serials | **C2 Strip** | 4x1 inline | count | — _new_ |
| StockOperations | Low Stock | **C3 Metric** | 2x2 compact | count | `inventory.low_stock_count` |
| StockOperations | Out of Stock | **C3 Metric** | 2x2 compact | count | `inventory.out_of_stock_count` |
| StockOperations | Products | **C2 Strip** | 4x1 inline | count | `inventory.product_count` |
| StockOperations | Total Stock | **C2 Strip** | 4x1 inline | count | `inventory.stock_value` |

#### Finance · 21 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| Accounting | Assets | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Accounting | Expense (YTD) | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Accounting | Income (YTD) | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Accounting | Liabilities | **C3 Metric** | 3x2 standard | currency | — _new_ |
| BankAccounts | Cash on Hand | **C2 Strip** | 4x1 inline | currency | — _new_ |
| BankAccounts | Money In (Today) | **C2 Strip** | 4x1 inline | currency | — _new_ |
| BankAccounts | Money Out (Today) | **C2 Strip** | 4x1 inline | currency | — _new_ |
| BankAccounts | Total Balance | **C3 Metric** | 3x2 standard | currency | — _new_ |
| BankReconciliation | Matched | **C2 Strip** | 4x1 inline | count | — _new_ |
| BankReconciliation | Total Txns | **C2 Strip** | 4x1 inline | count | — _new_ |
| BankReconciliation | Unmatched | **C3 Metric** | 2x2 compact | count | — _new_ |
| Expenses | This Month | **C2 Strip** | 4x1 inline | count | `finance.expenses_total` |
| Expenses | This Week | **C2 Strip** | 4x1 inline | count | `finance.expenses_total` |
| Expenses | Today's Expenses | **C2 Strip** | 4x1 inline | currency | `finance.expenses_total` |
| Expenses | Total Expenses | **C3 Metric** | 3x2 standard | currency | `finance.expenses_total` |
| Finance | Active Creditors | **C2 Strip** | 4x1 inline | count | `party.supplier_count` |
| Finance | Active Debtors | **C2 Strip** | 4x1 inline | count | `party.customer_count` |
| Finance | Avg Balance | **C2 Strip** | 4x1 inline | currency | — _new_ |
| Finance | Avg Balance | **C2 Strip** | 4x1 inline | currency | — _new_ |
| Finance | Total Payable | **C3 Metric** | 3x2 standard | currency | `finance.payables` |
| Finance | Total Receivable | **C3 Metric** | 3x2 standard | currency | `finance.receivables` |

#### Operations · 5 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| StaffAttendance | Absent | **C3 Metric** | 2x2 compact | count | — _new_ |
| StaffAttendance | Hours Today | **C2 Strip** | 4x1 inline | count | — _new_ |
| StaffAttendance | Pending Gaps | **C3 Metric** | 2x2 compact | count | — _new_ |
| StaffAttendance | Present | **C2 Strip** | 4x1 inline | count | `staff.on_shift_count` |
| StaffAttendance | Total Staff | **C2 Strip** | 4x1 inline | count | `staff.member_count` |

### General Manager

**78 cards** across 5 areas.

#### Sales · 26 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| PreSales | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| PreSales | Total Quotes | **C2 Strip** | 4x1 inline | count | — _new_ |
| Proposals | Accepted | **C2 Strip** | 4x1 inline | count | — _new_ |
| Proposals | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| Proposals | Total Proposals | **C2 Strip** | 4x1 inline | count | — _new_ |
| Proposals | Total Value | **C3 Metric** | 3x2 standard | currency | `purchasing.spend` |
| RecurringInvoices | Active | **C2 Strip** | 4x1 inline | count | — _new_ |
| RecurringInvoices | Monthly Revenue | **C3 Metric** | 3x2 standard | currency | — _new_ |
| RecurringInvoices | Paused | **C2 Strip** | 4x1 inline | count | — _new_ |
| RecurringInvoices | Total | **C2 Strip** | 4x1 inline | count | — _new_ |
| Reminders | Overdue | **C3 Metric** | 2x2 compact | count | — _new_ |
| Reminders | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| Reminders | Sent | **C2 Strip** | 4x1 inline | count | — _new_ |
| Reminders | Total Scheduled | **C2 Strip** | 4x1 inline | count | — _new_ |
| Returns | Items Returned | **C2 Strip** | 4x1 inline | count | — _new_ |
| Returns | This Month | **C2 Strip** | 4x1 inline | count | `finance.expenses_total` |
| Returns | Total Refunded | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Returns | Total Returns | **C2 Strip** | 4x1 inline | count | — _new_ |
| Sales | Paid Amount | **C2 Strip** | 4x1 inline | currency | `sales.revenue` |
| Sales | Total Sale | **C3 Metric** | 3x2 standard | currency | `sales.revenue` |
| Sales | Transactions | **C2 Strip** | 4x1 inline | count | `sales.revenue` |
| Sales | Unpaid (Due) | **C3 Metric** | 2x2 compact | count | `finance.receivables` |
| SalesOrders | Confirmed | **C2 Strip** | 4x1 inline | count | — _new_ |
| SalesOrders | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| SalesOrders | Total Orders | **C3 Metric** | 3x2 standard | count | `purchasing.count` |
| SalesOrders | Total Value | **C3 Metric** | 3x2 standard | currency | `purchasing.spend` |

#### Purchasing · 7 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| DebitNotes | Open Credits | **C2 Strip** | 4x1 inline | currency | — _new_ |
| DebitNotes | Total Notes | **C2 Strip** | 4x1 inline | count | — _new_ |
| DebitNotes | Total Value | **C3 Metric** | 3x2 standard | currency | `purchasing.spend` |
| PurchaseOrders | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| PurchaseOrders | Received | **C2 Strip** | 4x1 inline | count | — _new_ |
| PurchaseOrders | Total Orders | **C3 Metric** | 3x2 standard | count | `purchasing.count` |
| PurchaseOrders | Total Value | **C3 Metric** | 3x2 standard | currency | `purchasing.spend` |

#### Inventory · 26 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| BatchTracking | Expired | **C3 Metric** | 2x2 compact | count | — _new_ |
| BatchTracking | Expiring Soon | **C3 Metric** | 2x2 compact | count | — _new_ |
| BatchTracking | Total Batches | **C2 Strip** | 4x1 inline | count | — _new_ |
| BatchTracking | Total Qty | **C2 Strip** | 4x1 inline | count | — _new_ |
| Inventory | Active Runs | **C2 Strip** | 4x1 inline | count | `production.run_count` |
| Inventory | Completed Today | **C2 Strip** | 4x1 inline | count | — _new_ |
| Inventory | Cost (Month) | **C2 Strip** | 4x1 inline | currency | `production.total_cost` |
| Inventory | Inventory Value | **C3 Metric** | 3x2 standard | currency | `inventory.stock_value` |
| Inventory | Low Stock | **C3 Metric** | 2x2 compact | count | `inventory.low_stock_count` |
| Inventory | Low Stock | **C3 Metric** | 2x2 compact | count | `inventory.low_stock_count` |
| Inventory | Main Categories | **C2 Strip** | 4x1 inline | count | — _new_ |
| Inventory | Out of Stock | **C3 Metric** | 2x2 compact | count | `inventory.out_of_stock_count` |
| Inventory | Products Linked | **C2 Strip** | 4x1 inline | count | — _new_ |
| Inventory | Stock Value | **C3 Metric** | 3x2 standard | currency | `inventory.stock_value` |
| Inventory | Total Categories | **C2 Strip** | 4x1 inline | count | — _new_ |
| Inventory | Total Products | **C3 Metric** | 3x2 standard | count | `inventory.product_count` |
| Inventory | Total Products | **C3 Metric** | 3x2 standard | count | `inventory.product_count` |
| Inventory | Total Runs | **C2 Strip** | 4x1 inline | count | `production.run_count` |
| SerialTracking | In Stock | **C2 Strip** | 4x1 inline | count | — _new_ |
| SerialTracking | Returned | **C2 Strip** | 4x1 inline | count | — _new_ |
| SerialTracking | Sold | **C2 Strip** | 4x1 inline | count | — _new_ |
| SerialTracking | Total Serials | **C2 Strip** | 4x1 inline | count | — _new_ |
| StockOperations | Low Stock | **C3 Metric** | 2x2 compact | count | `inventory.low_stock_count` |
| StockOperations | Out of Stock | **C3 Metric** | 2x2 compact | count | `inventory.out_of_stock_count` |
| StockOperations | Products | **C2 Strip** | 4x1 inline | count | `inventory.product_count` |
| StockOperations | Total Stock | **C2 Strip** | 4x1 inline | count | `inventory.stock_value` |

#### Finance · 14 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| Accounting | Assets | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Accounting | Expense (YTD) | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Accounting | Income (YTD) | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Accounting | Liabilities | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Expenses | This Month | **C2 Strip** | 4x1 inline | count | `finance.expenses_total` |
| Expenses | This Week | **C2 Strip** | 4x1 inline | count | `finance.expenses_total` |
| Expenses | Today's Expenses | **C2 Strip** | 4x1 inline | currency | `finance.expenses_total` |
| Expenses | Total Expenses | **C3 Metric** | 3x2 standard | currency | `finance.expenses_total` |
| Finance | Active Creditors | **C2 Strip** | 4x1 inline | count | `party.supplier_count` |
| Finance | Active Debtors | **C2 Strip** | 4x1 inline | count | `party.customer_count` |
| Finance | Avg Balance | **C2 Strip** | 4x1 inline | currency | — _new_ |
| Finance | Avg Balance | **C2 Strip** | 4x1 inline | currency | — _new_ |
| Finance | Total Payable | **C3 Metric** | 3x2 standard | currency | `finance.payables` |
| Finance | Total Receivable | **C3 Metric** | 3x2 standard | currency | `finance.receivables` |

#### Operations · 5 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| StaffAttendance | Absent | **C3 Metric** | 2x2 compact | count | — _new_ |
| StaffAttendance | Hours Today | **C2 Strip** | 4x1 inline | count | — _new_ |
| StaffAttendance | Pending Gaps | **C3 Metric** | 2x2 compact | count | — _new_ |
| StaffAttendance | Present | **C2 Strip** | 4x1 inline | count | `staff.on_shift_count` |
| StaffAttendance | Total Staff | **C2 Strip** | 4x1 inline | count | `staff.member_count` |

### Shift Manager

**19 cards** across 2 areas.

#### Sales · 14 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| PreSales | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| PreSales | Total Quotes | **C2 Strip** | 4x1 inline | count | — _new_ |
| Returns | Items Returned | **C2 Strip** | 4x1 inline | count | — _new_ |
| Returns | This Month | **C2 Strip** | 4x1 inline | count | `finance.expenses_total` |
| Returns | Total Refunded | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Returns | Total Returns | **C2 Strip** | 4x1 inline | count | — _new_ |
| Sales | Paid Amount | **C2 Strip** | 4x1 inline | currency | `sales.revenue` |
| Sales | Total Sale | **C3 Metric** | 3x2 standard | currency | `sales.revenue` |
| Sales | Transactions | **C2 Strip** | 4x1 inline | count | `sales.revenue` |
| Sales | Unpaid (Due) | **C3 Metric** | 2x2 compact | count | `finance.receivables` |
| SalesOrders | Confirmed | **C2 Strip** | 4x1 inline | count | — _new_ |
| SalesOrders | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| SalesOrders | Total Orders | **C3 Metric** | 3x2 standard | count | `purchasing.count` |
| SalesOrders | Total Value | **C3 Metric** | 3x2 standard | currency | `purchasing.spend` |

#### Operations · 5 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| StaffAttendance | Absent | **C3 Metric** | 2x2 compact | count | — _new_ |
| StaffAttendance | Hours Today | **C2 Strip** | 4x1 inline | count | — _new_ |
| StaffAttendance | Pending Gaps | **C3 Metric** | 2x2 compact | count | — _new_ |
| StaffAttendance | Present | **C2 Strip** | 4x1 inline | count | `staff.on_shift_count` |
| StaffAttendance | Total Staff | **C2 Strip** | 4x1 inline | count | `staff.member_count` |

### Cashier

**8 cards** across 1 areas.

#### Sales · 8 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| Returns | Items Returned | **C2 Strip** | 4x1 inline | count | — _new_ |
| Returns | This Month | **C2 Strip** | 4x1 inline | count | `finance.expenses_total` |
| Returns | Total Refunded | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Returns | Total Returns | **C2 Strip** | 4x1 inline | count | — _new_ |
| Sales | Paid Amount | **C2 Strip** | 4x1 inline | currency | `sales.revenue` |
| Sales | Total Sale | **C3 Metric** | 3x2 standard | currency | `sales.revenue` |
| Sales | Transactions | **C2 Strip** | 4x1 inline | count | `sales.revenue` |
| Sales | Unpaid (Due) | **C3 Metric** | 2x2 compact | count | `finance.receivables` |

### Inventory / Warehouse Manager

**26 cards** across 1 areas.

#### Inventory · 26 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| BatchTracking | Expired | **C3 Metric** | 2x2 compact | count | — _new_ |
| BatchTracking | Expiring Soon | **C3 Metric** | 2x2 compact | count | — _new_ |
| BatchTracking | Total Batches | **C2 Strip** | 4x1 inline | count | — _new_ |
| BatchTracking | Total Qty | **C2 Strip** | 4x1 inline | count | — _new_ |
| Inventory | Active Runs | **C2 Strip** | 4x1 inline | count | `production.run_count` |
| Inventory | Completed Today | **C2 Strip** | 4x1 inline | count | — _new_ |
| Inventory | Cost (Month) | **C2 Strip** | 4x1 inline | currency | `production.total_cost` |
| Inventory | Inventory Value | **C3 Metric** | 3x2 standard | currency | `inventory.stock_value` |
| Inventory | Low Stock | **C3 Metric** | 2x2 compact | count | `inventory.low_stock_count` |
| Inventory | Low Stock | **C3 Metric** | 2x2 compact | count | `inventory.low_stock_count` |
| Inventory | Main Categories | **C2 Strip** | 4x1 inline | count | — _new_ |
| Inventory | Out of Stock | **C3 Metric** | 2x2 compact | count | `inventory.out_of_stock_count` |
| Inventory | Products Linked | **C2 Strip** | 4x1 inline | count | — _new_ |
| Inventory | Stock Value | **C3 Metric** | 3x2 standard | currency | `inventory.stock_value` |
| Inventory | Total Categories | **C2 Strip** | 4x1 inline | count | — _new_ |
| Inventory | Total Products | **C3 Metric** | 3x2 standard | count | `inventory.product_count` |
| Inventory | Total Products | **C3 Metric** | 3x2 standard | count | `inventory.product_count` |
| Inventory | Total Runs | **C2 Strip** | 4x1 inline | count | `production.run_count` |
| SerialTracking | In Stock | **C2 Strip** | 4x1 inline | count | — _new_ |
| SerialTracking | Returned | **C2 Strip** | 4x1 inline | count | — _new_ |
| SerialTracking | Sold | **C2 Strip** | 4x1 inline | count | — _new_ |
| SerialTracking | Total Serials | **C2 Strip** | 4x1 inline | count | — _new_ |
| StockOperations | Low Stock | **C3 Metric** | 2x2 compact | count | `inventory.low_stock_count` |
| StockOperations | Out of Stock | **C3 Metric** | 2x2 compact | count | `inventory.out_of_stock_count` |
| StockOperations | Products | **C2 Strip** | 4x1 inline | count | `inventory.product_count` |
| StockOperations | Total Stock | **C2 Strip** | 4x1 inline | count | `inventory.stock_value` |

### Purchasing / Procurement Agent

**7 cards** across 1 areas.

#### Purchasing · 7 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| DebitNotes | Open Credits | **C2 Strip** | 4x1 inline | currency | — _new_ |
| DebitNotes | Total Notes | **C2 Strip** | 4x1 inline | count | — _new_ |
| DebitNotes | Total Value | **C3 Metric** | 3x2 standard | currency | `purchasing.spend` |
| PurchaseOrders | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| PurchaseOrders | Received | **C2 Strip** | 4x1 inline | count | — _new_ |
| PurchaseOrders | Total Orders | **C3 Metric** | 3x2 standard | count | `purchasing.count` |
| PurchaseOrders | Total Value | **C3 Metric** | 3x2 standard | currency | `purchasing.spend` |

### Dispatch / Fulfilment Lead

**4 cards** across 1 areas.

#### Sales · 4 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| SalesOrders | Confirmed | **C2 Strip** | 4x1 inline | count | — _new_ |
| SalesOrders | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| SalesOrders | Total Orders | **C3 Metric** | 3x2 standard | count | `purchasing.count` |
| SalesOrders | Total Value | **C3 Metric** | 3x2 standard | currency | `purchasing.spend` |

### Internal Accountant

**36 cards** across 3 areas.

#### Sales · 12 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| RecurringInvoices | Active | **C2 Strip** | 4x1 inline | count | — _new_ |
| RecurringInvoices | Monthly Revenue | **C3 Metric** | 3x2 standard | currency | — _new_ |
| RecurringInvoices | Paused | **C2 Strip** | 4x1 inline | count | — _new_ |
| RecurringInvoices | Total | **C2 Strip** | 4x1 inline | count | — _new_ |
| Reminders | Overdue | **C3 Metric** | 2x2 compact | count | — _new_ |
| Reminders | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| Reminders | Sent | **C2 Strip** | 4x1 inline | count | — _new_ |
| Reminders | Total Scheduled | **C2 Strip** | 4x1 inline | count | — _new_ |
| Sales | Paid Amount | **C2 Strip** | 4x1 inline | currency | `sales.revenue` |
| Sales | Total Sale | **C3 Metric** | 3x2 standard | currency | `sales.revenue` |
| Sales | Transactions | **C2 Strip** | 4x1 inline | count | `sales.revenue` |
| Sales | Unpaid (Due) | **C3 Metric** | 2x2 compact | count | `finance.receivables` |

#### Purchasing · 3 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| DebitNotes | Open Credits | **C2 Strip** | 4x1 inline | currency | — _new_ |
| DebitNotes | Total Notes | **C2 Strip** | 4x1 inline | count | — _new_ |
| DebitNotes | Total Value | **C3 Metric** | 3x2 standard | currency | `purchasing.spend` |

#### Finance · 21 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| Accounting | Assets | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Accounting | Expense (YTD) | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Accounting | Income (YTD) | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Accounting | Liabilities | **C3 Metric** | 3x2 standard | currency | — _new_ |
| BankAccounts | Cash on Hand | **C2 Strip** | 4x1 inline | currency | — _new_ |
| BankAccounts | Money In (Today) | **C2 Strip** | 4x1 inline | currency | — _new_ |
| BankAccounts | Money Out (Today) | **C2 Strip** | 4x1 inline | currency | — _new_ |
| BankAccounts | Total Balance | **C3 Metric** | 3x2 standard | currency | — _new_ |
| BankReconciliation | Matched | **C2 Strip** | 4x1 inline | count | — _new_ |
| BankReconciliation | Total Txns | **C2 Strip** | 4x1 inline | count | — _new_ |
| BankReconciliation | Unmatched | **C3 Metric** | 2x2 compact | count | — _new_ |
| Expenses | This Month | **C2 Strip** | 4x1 inline | count | `finance.expenses_total` |
| Expenses | This Week | **C2 Strip** | 4x1 inline | count | `finance.expenses_total` |
| Expenses | Today's Expenses | **C2 Strip** | 4x1 inline | currency | `finance.expenses_total` |
| Expenses | Total Expenses | **C3 Metric** | 3x2 standard | currency | `finance.expenses_total` |
| Finance | Active Creditors | **C2 Strip** | 4x1 inline | count | `party.supplier_count` |
| Finance | Active Debtors | **C2 Strip** | 4x1 inline | count | `party.customer_count` |
| Finance | Avg Balance | **C2 Strip** | 4x1 inline | currency | — _new_ |
| Finance | Avg Balance | **C2 Strip** | 4x1 inline | currency | — _new_ |
| Finance | Total Payable | **C3 Metric** | 3x2 standard | currency | `finance.payables` |
| Finance | Total Receivable | **C3 Metric** | 3x2 standard | currency | `finance.receivables` |

### External Auditor (CPA)

**25 cards** across 2 areas.

#### Sales · 4 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| Sales | Paid Amount | **C2 Strip** | 4x1 inline | currency | `sales.revenue` |
| Sales | Total Sale | **C3 Metric** | 3x2 standard | currency | `sales.revenue` |
| Sales | Transactions | **C2 Strip** | 4x1 inline | count | `sales.revenue` |
| Sales | Unpaid (Due) | **C3 Metric** | 2x2 compact | count | `finance.receivables` |

#### Finance · 21 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| Accounting | Assets | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Accounting | Expense (YTD) | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Accounting | Income (YTD) | **C3 Metric** | 3x2 standard | currency | — _new_ |
| Accounting | Liabilities | **C3 Metric** | 3x2 standard | currency | — _new_ |
| BankAccounts | Cash on Hand | **C2 Strip** | 4x1 inline | currency | — _new_ |
| BankAccounts | Money In (Today) | **C2 Strip** | 4x1 inline | currency | — _new_ |
| BankAccounts | Money Out (Today) | **C2 Strip** | 4x1 inline | currency | — _new_ |
| BankAccounts | Total Balance | **C3 Metric** | 3x2 standard | currency | — _new_ |
| BankReconciliation | Matched | **C2 Strip** | 4x1 inline | count | — _new_ |
| BankReconciliation | Total Txns | **C2 Strip** | 4x1 inline | count | — _new_ |
| BankReconciliation | Unmatched | **C3 Metric** | 2x2 compact | count | — _new_ |
| Expenses | This Month | **C2 Strip** | 4x1 inline | count | `finance.expenses_total` |
| Expenses | This Week | **C2 Strip** | 4x1 inline | count | `finance.expenses_total` |
| Expenses | Today's Expenses | **C2 Strip** | 4x1 inline | currency | `finance.expenses_total` |
| Expenses | Total Expenses | **C3 Metric** | 3x2 standard | currency | `finance.expenses_total` |
| Finance | Active Creditors | **C2 Strip** | 4x1 inline | count | `party.supplier_count` |
| Finance | Active Debtors | **C2 Strip** | 4x1 inline | count | `party.customer_count` |
| Finance | Avg Balance | **C2 Strip** | 4x1 inline | currency | — _new_ |
| Finance | Avg Balance | **C2 Strip** | 4x1 inline | currency | — _new_ |
| Finance | Total Payable | **C3 Metric** | 3x2 standard | currency | `finance.payables` |
| Finance | Total Receivable | **C3 Metric** | 3x2 standard | currency | `finance.receivables` |

### Wholesale Partner

**4 cards** across 1 areas.

#### Purchasing · 4 cards

| Module | Card | Cat | Fit | Unit | Reading |
|---|---|---|---|---|---|
| PurchaseOrders | Pending | **C2 Strip** | 4x1 inline | count | — _new_ |
| PurchaseOrders | Received | **C2 Strip** | 4x1 inline | count | — _new_ |
| PurchaseOrders | Total Orders | **C3 Metric** | 3x2 standard | count | `purchasing.count` |
| PurchaseOrders | Total Value | **C3 Metric** | 3x2 standard | currency | `purchasing.spend` |

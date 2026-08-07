# VenQore ERP — Complete Financial & Calculation Reference
> Every transaction, document, balance, and report in the system.
> What it is (one line) + what feeds into its calculation.
> Created: 2026-03-05

---

# SECTION A — PRE-TRANSACTION DOCUMENTS
*(These don't move money or stock. They are promises / intentions only.)*

---

### A1. Quotation / Estimate (Proposal)
**What it is:** A price offer sent to a potential client — no financial effect until they accept it.
**Feeds into:** Nothing until converted → becomes a Sale or Sales Order
**Key fields:** Client, products, quantities, prices, validity date, terms

---

### A2. Sales Order (Pre-Sale / Order Confirmation)
**What it is:** A confirmed order from a client — stock is reserved but not yet delivered, no revenue yet.
**Feeds into:** Nothing financial yet; stock-hold reduces *available* quantity but not actual stock
**Key fields:** Client, products, quantities, expected delivery date, price agreed

---

### A3. Purchase Order (Pre-Purchase)
**What it is:** A formal order you send to a supplier — you've requested stock but not received it yet, no cost recorded yet.
**Feeds into:** Nothing financial yet; becomes a Purchase when stock is received
**Key fields:** Supplier, products, quantities, agreed price, expected arrival date

---

### A4. Proforma Invoice
**What it is:** A draft invoice sent to the client before actual delivery — used to get advance payment or approval, not a real sale.
**Feeds into:** Nothing until converted to a real Sale invoice
**Key fields:** Same as a Sale invoice, but marked "Proforma" — no stock movement, no ledger entry

---

### A5. Recurring Invoice Template
**What it is:** A saved template that auto-generates the same sale at regular intervals (weekly, monthly, etc.).
**Feeds into:** Each generated invoice becomes a real Sale with all normal financial effects
**Key fields:** Client, products, amounts, frequency (daily / weekly / monthly / quarterly / yearly), start date, end date

---

---

# SECTION B — TRANSACTIONS
*(These actually move money or stock — each one MUST create a journal entry)*

---

### B1. Sale
**What it is:** Client receives products and gives money now or gets the amount added to their tab (Receivables).
**What plays a role:**
- Products + quantities sold
- Unit price per item
- Item-level discount (reduces price per line)
- Global bill discount (reduces total bill)
- Tax rate per item (added on top, not revenue)
- Shipping / extra charges
- Payment method: Cash (immediate) or Credit (adds to Receivables)
- Change given back (cash sales only — not revenue, just math)

---

### B2. POS Sale (Point of Sale)
**What it is:** A Sale done at the counter — same as B1 but faster interface, often cash, often walk-in customers.
**What plays a role:** Same as B1 plus:
- Barcode scan inputs
- Split payment (part cash + part card + part bank)
- Held / parked bills
- Change return calculation: Amount Received − Invoice Total = Change

---

### B3. Purchase
**What it is:** You buy stock from a supplier — stock arrives in your warehouse, money leaves or gets added to your Payables.
**What plays a role:**
- Products + quantities received
- Unit cost per item (this becomes the FIFO batch cost — locked permanently)
- Supplier name
- Warehouse where stock lands
- Payment: Cash (immediate) or Credit (adds to Payables)
- Tax paid on purchase (feeds Input Tax calculation)

---

### B4. Payment In (Receive Payment)
**What it is:** A customer pays off some or all of what they owe you — money comes in, Receivables go down.
**What plays a role:**
- Customer (party)
- Amount
- Payment method: Cash (into till) or Bank (into bank account)
- Date
- Which invoice(s) it is settling (optional link)

---

### B5. Payment Out (Make Payment)
**What it is:** You pay a supplier some or all of what you owe them — money goes out, Payables go down.
**What plays a role:**
- Supplier (party)
- Amount
- Payment method: Cash or Bank
- Date
- Which purchase invoice(s) it is settling (optional link)

---

### B6. Expense
**What it is:** Money going out for running the business — NOT for buying stock to resell.
**What plays a role:**
- Expense category (Rent, Electricity, Transport, Miscellaneous, etc.)
- Amount
- Tax on expense (if applicable)
- Payment method: Cash or Bank
- Date
- Payee (who received the money)
- Description / reference

---

### B7. Salary Payment
**What it is:** A specific type of expense — paying staff for their work during a period.
**What plays a role:**
- Employee name
- Gross salary for the period
- Deductions: advances already given, fines, absences
- Net amount actually paid
- Payment method: Cash or Bank
- Pay period (which month / dates)
- Attendance record (number of days worked if daily-rate)

---

### B8. Sale Return (Credit Note)
**What it is:** Client returns products back to you — revenue is reversed, stock comes back, their debt is reduced.
**What plays a role:**
- Original sale invoice (which one is being reversed)
- Which products returned + quantities returned
- Net amount per returned item (NOT gross price — uses the discounted price they actually paid)
- FIFO cost of returned items (restores inventory value correctly)
- Return type: Full (entire invoice) or Partial (some items only)
- Refund method: Cash (give money back) or Credit Note (reduce their future bill)

---

### B9. Purchase Return (Debit Note)
**What it is:** You return stock to a supplier — your cost is reversed, stock leaves, your debt to them is reduced.
**What plays a role:**
- Original purchase invoice
- Which products returned + quantities
- Cost price of returned items (reduces inventory value)
- Return type: Cash refund (supplier pays you back) or Credit Note (reduces what you owe them)

---

### B10. Stock Adjustment
**What it is:** Manual correction to stock count — for damage, theft, expiry write-off, or audit discrepancy.
**What plays a role:**
- Product
- Adjustment direction: Increase or Decrease
- Quantity adjusted
- Cost price of the units (changes inventory asset value)
- Reason (Damage, Theft, Found Extra, Audit Correction, Expiry Write-off)

---

### B11. Stock Transfer
**What it is:** Moving stock from one warehouse (godown) to another — no money moves, only location changes.
**What plays a role:**
- Product + quantity
- Source warehouse
- Destination warehouse
- Transfer date
- Cost of stock (carries with it — inventory value unchanged, just location)

---

### B12. Stock Take / Audit
**What it is:** A physical count of all stock — system quantity vs. actual counted quantity; the difference becomes a Stock Adjustment.
**What plays a role:**
- Product by product: System quantity vs. physically counted quantity
- Difference (variance) — positive = found extra, negative = missing
- Reason for each variance
- Each variance automatically becomes a Stock Adjustment (B10)

---

### B13. Fund In (Capital Injection)
**What it is:** Owner or investor puts personal money into the business — increases Cash/Bank AND Owner's Capital (equity).
**What plays a role:**
- Amount
- Payment method: Cash into till or Bank deposit
- With reference / purpose (e.g., "Monthly capital top-up")
- Date

---

### B14. Fund Out (Capital Withdrawal / Owner Drawing)
**What it is:** Owner takes money out of the business for personal use — decreases Cash/Bank AND Owner's Capital (equity).
**What plays a role:**
- Amount
- Payment method: Cash or Bank transfer
- Date
- Reason

---

### B15. Bank Transfer
**What it is:** Moving money between two of your own accounts (e.g., Cash → Bank, Bank A → Bank B) — no net change in total assets.
**What plays a role:**
- From account
- To account
- Amount
- Date
- Reference

---

### B16. Manufacturing / Production Run
**What it is:** Raw materials are consumed to produce a finished product — raw stock goes down, finished product stock goes up.
**What plays a role:**
- Finished product + how many units produced
- Bill of Materials (BOM) — list of ingredients + quantity needed per unit
- FIFO cost of each raw material consumed (this sets the cost of the finished product)
- Labor cost (if defined on the BOM)
- Wastage / scrap (reduces output, adjusts cost)

---

### B17. Debit Note
**What it is:** A formal document you send to a supplier saying "we are reducing what we owe you by X" — used for purchase returns, price corrections, or overcharge disputes.
**What plays a role:**
- Supplier
- Amount being deducted
- Reason (Return, Overcharge, Damage)
- Links to original purchase invoice
- Reduces Payables when accepted by supplier

---

### B18. Credit Note
**What it is:** A formal document you give to a customer saying "we are reducing what you owe us by X" — used for sale returns, overcharge corrections, goodwill discounts.
**What plays a role:**
- Customer
- Amount being credited
- Reason (Return, Overcharge, Goodwill)
- Links to original sale invoice
- Reduces Receivables when applied

---

### B19. Opening Balance Entry
**What it is:** A one-time entry done when starting the system — records what each customer/supplier already owed before you started using VenQore.
**What plays a role:**
- Party name (customer or supplier)
- Opening balance amount
- Date of opening (typically business start date or migration date)
- Feeds into: Receivables (if customer) or Payables (if supplier)

---

### B20. Advance Payment (from Customer)
**What it is:** Customer pays before the goods are delivered — the money is received but no sale has been recorded yet; it sits as a liability until the sale happens.
**What plays a role:**
- Customer name
- Amount
- Date received
- Payment method
- Holds as Advance / Unearned Revenue until linked to a future Sale

---

### B21. Advance Payment (to Supplier)
**What it is:** You pay a supplier before receiving the goods — money leaves but no purchase cost is recorded yet.
**What plays a role:**
- Supplier name
- Amount
- Date paid
- Payment method
- Holds as Prepaid / Advance to Supplier until Stock is received

---

### B22. Charitable Donation / Charity Expense
**What it is:** A specific type of expense — money or goods donated to a charity or cause.
**What plays a role:**
- Amount (if cash donation)
- Products donated + cost value (if goods given away)
- Charity / recipient name
- Date

---

---

# SECTION C — CALCULATED BALANCES
*(These are numbers derived from transactions — never stored as a raw number, always calculated fresh)*

---

### C1. Cash in Hand
**What it is:** Physical cash currently sitting in your till / cash drawer.
**Formula:** Opening Cash Balance + Fund In (cash) + Sale payments (cash) + Payment In received (cash) − Purchases paid (cash) − Payment Out sent (cash) − Expenses paid (cash) − Salary paid (cash) − Fund Out (cash) − Cash refunds on returns

---

### C2. Bank Balance (per account)
**What it is:** Money sitting in a specific bank account.
**Formula:** Opening Bank Balance + Deposits + Sale payments (bank) + Payment In (bank) − Withdrawals − Purchase payments (bank) − Payment Out (bank) − Expenses (bank) − Salary (bank) − Fund Out (bank) + Transfers in − Transfers out

---

### C3. Receivables (Total owed to you by customers)
**What it is:** Sum of all money customers have not yet paid for goods they already received.
**Formula:** SUM of all credit Sales + Opening Balances of customers − Payment In received − Sale Returns (credit)
**Rule:** Must be read from Account 1200 in the ledger — never from `sales.payment_status`

---

### C4. Payables (Total you owe to suppliers)
**What it is:** Sum of all money you haven't yet paid to suppliers for stock you already received.
**Formula:** SUM of all credit Purchases + Opening Balances of suppliers − Payment Out sent − Purchase Returns
**Rule:** Must be read from Account 2000 in the ledger

---

### C5. Gross Sales (Total Billed Value)
**What it is:** Total face value of everything sold in a period before any discounts are applied.
**Formula:** SUM( quantity × unit_price ) for all sale items in the period

---

### C6. Total Discounts Given
**What it is:** Total value reduction given to customers through item discounts and bill discounts.
**Formula:** SUM(item_discounts) + SUM(global_bill_discounts) across all sales in the period

---

### C7. Net Sales (True Revenue)
**What it is:** What you actually earned — after all discounts, excluding tax (tax is not your money, it's the government's).
**Formula:** Gross Sales − Total Item Discounts − Total Global Discounts
**Rule:** Tax is EXCLUDED. Never include tax in revenue.

---

### C8. COGS — Cost of Goods Sold
**What it is:** What you originally paid (FIFO cost) for the exact units you sold — calculated batch by batch.
**Formula:** For each unit sold → use the oldest available inventory batch cost (FIFO)
**Rule:** NEVER use `products.cost_price` for this — it gets overwritten. Must use `sale_item_batches.total_cogs`

---

### C9. Gross Profit
**What it is:** How much you made from product sales before paying any business running costs.
**Formula:** Net Sales − COGS

---

### C10. Gross Margin %
**What it is:** What percentage of the selling price is profit (after product cost but before operating costs).
**Formula:** ( Gross Profit ÷ Net Sales ) × 100
**Rule:** Never store this — always calculate fresh

---

### C11. Operating Expenses (OPEX)
**What it is:** All costs of running the business that are NOT the cost of products sold.
**Formula:** SUM of all Expense entries in the period (Salary + Rent + Electricity + Transport + Marketing + Other)

---

### C12. Net Profit
**What it is:** What is actually left for the owner after paying for products AND all business running costs.
**Formula:** Gross Profit − Operating Expenses
**Rule:** Never store this — always calculate dynamically from the ledger

---

### C13. Inventory Value (Stock Cost Value)
**What it is:** What your unsold stock is worth at the price you originally paid for it — a real business asset.
**Formula:** SUM( remaining_qty × unit_cost ) for every inventory batch with remaining_qty > 0
**Rule:** NEVER calculate as stock_quantity × products.cost_price — it inflates asset value

---

### C14. Retail Value of Stock
**What it is:** What the unsold stock would sell for at current prices — a *forecast*, not a financial fact.
**Formula:** SUM( remaining_qty × current_selling_price ) per product
**Note:** This is for planning only, not accounting

---

### C15. Projected Margin on Stock
**What it is:** How much profit you could make if you sold all current stock today.
**Formula:** Retail Value of Stock − Inventory Cost Value

---

### C16. Party Balance (per customer or supplier)
**What it is:** Single number showing the net position with one specific contact.
**Positive number:** They owe you (Receivable from that party)
**Negative number:** You owe them (Payable to that party)
**Formula:** All their invoices + opening balance − all their payments − all their returns

---

### C17. Output Tax (Tax Collected)
**What it is:** Tax money collected from customers on sales — belongs to the government, not you.
**Formula:** SUM( tax_amount ) on all sale items in the period

---

### C18. Input Tax (Tax Paid)
**What it is:** Tax you paid to suppliers on purchases — in GST/VAT systems, you can offset this against what you owe.
**Formula:** SUM( tax_amount ) on all purchases in the period

---

### C19. Net Tax Payable
**What it is:** What you actually owe the government after deducting the tax you already paid on purchases.
**Formula:** Output Tax − Input Tax

---

### C20. Stock Quantity (per product, per warehouse)
**What it is:** How many physical units are available right now.
**Formula:** Opening Stock + Purchases received + Production output + Returns received + Adjustments (positive) − Sales − Purchase Returns sent − Adjustments (negative) − Transfers out + Transfers in

---

### C21. Low Stock Alert
**What it is:** A triggered warning when a product's current stock falls to or below its minimum reorder level.
**Formula:** Stock Quantity ≤ Minimum Reorder Level set on the product
**Feeds into:** Low Stock Report, Dashboard alert widget

---

### C22. Available Stock (vs. Reserved Stock)
**What it is:** Stock that is physically present minus stock reserved for confirmed Sales Orders not yet delivered.
**Formula:** Stock Quantity − Quantity Reserved for Open Sales Orders

---

### C23. Average Cost Per Unit (per product)
**What it is:** The weighted average price you paid across all available batches of a product.
**Formula:** Total Inventory Cost Value for product ÷ Total Stock Quantity for product
**Note:** Display-only — never used for COGS calculation

---

### C24. Sale Aging / Receivable Aging
**What it is:** How long outstanding customer invoices have been unpaid, grouped into time buckets.
**Formula:** For each unpaid invoice: Days Overdue = Today − Invoice Due Date
**Buckets:** 0-30 days, 31-60 days, 61-90 days, 90+ days

---

### C25. Stock Aging
**What it is:** How long unsold inventory has been sitting in the warehouse (frozen cash analysis).
**Formula:** For each inventory batch: Days Since Arrival = Today − Batch Purchase Date
**Buckets:** 0-30 days, 31-90 days, 90-180 days, 180+ days

---

### C26. Change Return (POS Counter only)
**What it is:** The cash to give back to the customer when they overpay.
**Formula:** Amount Received from Customer − Invoice Total
**Note:** Not a financial transaction — just arithmetic at the counter

---

---

# SECTION D — FINANCIAL REPORTS
*(Summaries and views of transactions over a date range)*

---

### D1. Profit & Loss Statement (P&L / Income Statement)
**What it is:** Shows whether the business made or lost money in a period.
**Components:** Net Sales − COGS = Gross Profit → Gross Profit − Operating Expenses = Net Profit
**Source:** journal_items — income accounts (credit-normal) and expense accounts (debit-normal)

---

### D2. Balance Sheet
**What it is:** A snapshot of everything the business owns (Assets) and everything it owes (Liabilities + Equity) at one moment in time.
**Must always satisfy:** Assets = Liabilities + Equity
**Components:**
- Assets: Cash, Bank, Receivables, Inventory, Fixed Assets
- Liabilities: Payables, Tax Payable, Loans
- Equity: Owner's Capital, Retained Earnings
**Source:** journal_items WHERE date ≤ as-of date

---

### D3. Trial Balance
**What it is:** A list of every account with its total debits and credits — used to verify the books balance.
**Must always satisfy:** Total Debits = Total Credits (if not, there's a posting error)
**Source:** journal_items — all time or up to a specific date

---

### D4. Cash Flow Statement
**What it is:** Shows where cash came from and where it went in a period — not the same as P&L (profit ≠ cash).
**Sections:** Operating Inflow (cash from sales) − Operating Outflow (cash for purchases + expenses) = Net Cash Flow
**Source:** journal_items WHERE account_id is Cash (1000) or Bank (1010)

---

### D5. Account Ledger (General Ledger)
**What it is:** A chronological list of every transaction that touched one specific account — shows running balance.
**Use:** Drill into any account (Cash, AR, a specific expense) to see every entry that changed it
**Source:** journal_items for that account_id with a running balance

---

### D6. Day Book (Journal)
**What it is:** Every single transaction in the system in chronological order for one day — the master log.
**Source:** All journal_entries for a specific date, with all their journal_items

---

### D7. Cash Book
**What it is:** All movements in and out of Cash in Hand for a period — the running balance of the till.
**Source:** journal_items WHERE account = Cash (1000), sorted by date

---

### D8. Bank Book (Bank Statement View)
**What it is:** All movements in and out of a specific bank account for a period.
**Source:** journal_items WHERE account = that Bank (1010), sorted by date

---

### D9. Party Statement (Customer / Supplier Ledger)
**What it is:** All transactions with one specific customer or supplier — invoices, payments, returns — with running balance.
**Source:** journal_entries WHERE party_id = this party, with sub-items

---

### D10. Aged Receivables Report
**What it is:** How old each outstanding customer invoice is — tells you who to chase first.
**Grouped by:** 0-30 days, 31-60, 61-90, 90+ days overdue
**Formula per invoice:** Outstanding Amount = Invoice Total − Payments received against it

---

### D11. Aged Payables Report
**What it is:** How old each outstanding supplier bill is — tells you what to pay first to avoid penalties.
**Grouped by:** 0-30 days, 31-60, 61-90, 90+ days overdue

---

### D12. Sales Register
**What it is:** A list of all sales in a period with their totals — a simple sales log.
**Columns:** Date, Invoice No., Customer, Net Sales, Tax, Invoice Total, Payment Status

---

### D13. Purchase Register
**What it is:** A list of all purchases in a period — a simple purchase log.
**Columns:** Date, Bill No., Supplier, Total Cost, Tax, Status

---

### D14. Item-wise Profit Report
**What it is:** For each product, how much net revenue it generated and how much profit.
**Formula per product:** Net Revenue = SUM(net_amount sold) | COGS = SUM(FIFO batch cost consumed) | Profit = Revenue − COGS

---

### D15. Bill-wise Profit Report
**What it is:** For each individual sale invoice, its exact profit — useful for spotting loss-making deals.
**Formula per invoice:** Net Revenue − FIFO COGS consumed = Gross Profit for that bill

---

### D16. Party-wise Profit Report
**What it is:** For each customer, total revenue, COGS, and profit across all their invoices — shows who is most valuable.
**Formula per customer:** Total Net Sales to them − Total FIFO COGS for those items = Total Gross Profit from them

---

### D17. Category-wise Sales Report
**What it is:** Sales broken down by product category — shows which categories drive the business.
**Formula per category:** SUM(net_amount) across all sale items in that category for the period

---

### D18. Sale by Party / Party-wise Sales
**What it is:** Total sales value per customer or supplier for a period.
**Columns:** Party name, number of invoices, total billed, total paid, outstanding

---

### D19. Stock Valuation Report
**What it is:** Current value of all unsold stock, product by product, with batch details.
**Formula per product:** SUM( batch.remaining_qty × batch.unit_cost ) across all batches

---

### D20. Stock Movement Report / Item Movement History
**What it is:** Every stock in/out event for a product — purchases, sales, transfers, adjustments — in chronological order.
**Source:** stock_movements table for that product

---

### D21. Stock Aging Report
**What it is:** How long stock has been sitting unsold, by batch — shows frozen cash risk.
**Formula per batch:** Days Since Purchase = Today − Batch arrival date

---

### D22. Low Stock Report
**What it is:** All products whose current quantity is at or below their minimum reorder level.
**Formula:** Stock Quantity ≤ product.min_stock_alert (reorder level)

---

### D23. Expiry Report
**What it is:** Products / batches approaching their expiry date — helps prevent expired stock losses.
**Filter:** Batches where expiry_date ≤ Today + N days threshold

---

### D24. Tax Summary Report
**What it is:** Total output tax (collected) vs. input tax (paid) for a period — what you owe the government.
**Formula:** Output Tax (Account 2100 credits) − Input Tax (Account 2100 debits) = Net Tax Payable

---

### D25. Tax Rate Report
**What it is:** Sales and tax amounts broken down by each tax rate — required for tax filing submissions.
**Columns:** Tax Rate %, Total Taxable Amount, Tax Amount Collected

---

### D26. Discount Report / Discount Leakage
**What it is:** Total discounts given across all sales — helps identify if cashiers are over-discounting.
**Formula:** SUM(discount_amount) per sale item + SUM(global_discount) per sale over the period

---

### D27. Item-wise Discount Report
**What it is:** Which specific products were discounted the most — identifies discount patterns per product.

---

### D28. Expense by Category Report
**What it is:** Total expenses grouped by category (Salary, Rent, etc.) for a period — shows where money is going.

---

### D29. Expense by Item / Payee Report
**What it is:** Expenses grouped by who received the payment — useful for tracking specific vendors.

---

### D30. Sales Analytics / Graph Report
**What it is:** Visual charts of sales trends over time — daily, weekly, monthly — for spotting patterns.
**Key metrics shown:** Net Sales trend, Gross Profit trend, Top Products, Hourly sales distribution

---

### D31. Purchase Report
**What it is:** Summary of all purchases in a period — total spend, by supplier, by product.

---

### D32. Sale + Purchase by Party Report
**What it is:** For each party (customer or supplier), their total buying AND selling activity — useful for parties who are both customer and supplier.

---

### D33. Sale + Purchase by Item Category
**What it is:** For each product category, total sold AND total purchased — helps analyze category-level margin.

---

### D34. Sale Orders Report (Sales Orders Fulfillment)
**What it is:** Status of all Sales Orders — how many are pending, partially delivered, fully delivered.

---

### D35. Bank Reconciliation Report
**What it is:** Matching your bank statement against what the system recorded — finds missing or wrong entries.
**Works by:** Importing bank CSV → auto-matching against Payment records → flagging unmatched entries

---

### D36. Transactions Report (All Transactions)
**What it is:** Every financial event in the system in one place — the master audit log across all types.
**Source:** All journal_entries for the period with their descriptions and amounts

---

### D37. All Parties Report
**What it is:** Every customer and supplier with their current balance, total billed, total paid.

---

### D38. Item Report by Party
**What it is:** For each product, which customers bought it and how much — useful for demand analysis.

---

### D39. Party Report by Item
**What it is:** For each customer, which products they bought — useful for reorder and relationship management.

---

### D40. Loan Statement
**What it is:** Tracks loan principal, repayments, and outstanding balance if the business tracks loans.
**Formula:** Opening Loan Balance + New Loans − Repayments = Outstanding Loan Balance

---

### D41. Profit & Loss (Accounting view)
**What it is:** Same as D1 but shown from Chart of Accounts perspective — grouped by account codes, not product categories.

---

### D42. Balance Sheet (Accounting view)
**What it is:** Same as D2 but shown directly from Chart of Accounts — each GL account's balance shown explicitly.

---

---

# SECTION E — STOCK / INVENTORY TRACKING SYSTEMS
*(Supporting structures that feed into reports and balances)*

---

### E1. Batch Tracking
**What it is:** Grouping stock by the physical batch it arrived in (useful for expiry dates and traceability).
**Feeds into:** Expiry Report, stock selection at sale time, FIFO cost tracking

---

### E2. Serial / IMEI Tracking
**What it is:** Tracking each individual unit by its unique serial number — used for electronics, warranties.
**Feeds into:** Serial Movement History, warranty claims, theft recovery

---

### E3. FIFO Inventory Batch (Cost Batch)
**What it is:** Every purchase delivery creates a cost batch recording how many units arrived at what price — oldest batch is consumed first when selling.
**Feeds into:** COGS calculation, Inventory Value, Gross Profit

---

### E4. Reorder Level (Min Stock Alert)
**What it is:** A threshold per product — when stock falls below this, a warning is triggered.
**Feeds into:** Low Stock Report, Dashboard alert, purchase suggestions

---

### E5. Bill of Materials (BOM)
**What it is:** A recipe for a manufactured product — lists which raw materials and how much of each produces one unit of the finished product.
**Feeds into:** Manufacturing / Production Run cost, raw material stock deduction

---

---

# SECTION F — SYSTEM CONCEPTS
*(These aren't transactions but affect how all calculations work)*

---

### F1. Chart of Accounts (COA)
**What it is:** The master list of every GL account in the system — every journal entry must map to accounts in this list.
**Key accounts:** 1000 Cash, 1010 Bank, 1100 Inventory, 1200 Receivables, 2000 Payables, 2100 Tax Payable, 3000 Capital, 4000 Revenue, 5000 COGS, 6000 Expenses

---

### F2. Journal Entry
**What it is:** The atomic unit of accounting — every financial event creates at least one journal entry with balanced debits and credits (DR = CR always).
**Rule:** Total Debits on every entry MUST equal Total Credits — no exceptions

---

### F3. Double-Entry Rule
**What it is:** Every financial event affects at least two accounts — one is debited the same amount the other is credited — the books always balance to zero.
**Why it matters:** This is what makes the Trial Balance balance, and makes it impossible to secretly change one number without the books going out of balance

---

### F4. Fiscal Year / Financial Year
**What it is:** The 12-month period the business uses for annual accounting (e.g., July to June, or Jan to Dec).
**Feeds into:** Year-to-date totals, annual P&L, Balance Sheet closing entries

---

### F5. Opening Balance (System Migration)
**What it is:** The financial state of the business on the day you started using VenQore — all historical Receivables, Payables, Stock, and Cash that existed before.
**Must be entered once:** As journal entries — otherwise historical parties and stock won't appear in reports

---

### F6. Retained Earnings
**What it is:** Accumulated profit from all previous years that hasn't been taken out by the owner — automatically increases as business makes profit.
**Formula:** Previous Retained Earnings + Net Profit for the year − Owner Drawings

---

### F7. Payment Status (UI Badge Only)
**What it is:** A visual label (Paid / Partial / Unpaid) shown on invoices for quick reference.
**Critical rule:** This is a display label ONLY — it is NEVER used in any financial calculation. Receivables and paid amounts always come from actual payment records and the ledger.

---

*File created: 2026-03-05 | Reference for VenQore ERP — Financial Consistency Project*
*Total items: 22 Transactions (A+B) | 26 Calculated Balances (C) | 42 Reports (D) | 5 Tracking Systems (E) | 7 System Concepts (F)*

# V3 Engine Upgrade & Opening Balances Guide

Congratulations! Your system has been upgraded to the **V3 Unified Accounting & FIFO Engine**. This is a major structural improvement that ensures your Dashboard, Reports, and Inventory are always in perfect sync.

> [!IMPORTANT]
> **Action Required:** To ensure your financial reports (Balance Sheet, P&L, Statement) are accurate from Day 1, you must enter your **Opening Balances**. The new engine reads exclusively from the ledger, so historical manual balances stored in the old "current_balance" columns are no longer used.

---

## 1. Entering Opening Balances

Follow these steps once you have updated to the latest version:

### A. Cash & Bank Balances
Go to **Funds → Add Funds**.
- **For Cash:** Select "Cash", enter the total cash currently in your drawer, and set the reason as "Opening Balance".
- **For Bank:** Select the specific Bank Account, enter the balance as per your latest bank statement, and set the reason as "Opening Balance".

### B. Accounts Receivable (Customer Debt)
For each customer who owes you money:
1. Go to **Accounting → Trial Balance** or **Journal Entries**.
2. Create a manual **Journal Entry**:
    - **Debit:** Accounts Receivable (1200) — enter the amount.
    - **Credit:** Opening Balance Equity (3000) or Capital Account.
    - **Party:** Select the Customer.

### C. Accounts Payable (Supplier Debt)
For each supplier you owe money to:
1. Create a manual **Journal Entry**:
    - **Credit:** Accounts Payable (2000) — enter the amount.
    - **Debit:** Opening Balance Equity (3000) or Capital Account.
    - **Party:** Select the Supplier.

### D. Inventory Valuation (Stock Value)
The system automatically calculates inventory value from your **Batches**.
- If you have existing stock that isn't showing up in the V3 reports, ensure you have recorded a "Purchase" or "Opening Stock" transaction to create the initial FIFO batches.

---

## 2. Why This Matters

The V3 Engine eliminates "drifting numbers" by using a **Single Source of Truth**:
- **Dashboards:** Now query the `journal_items` ledger directly.
- **Reports:** The Trial Balance and P&L use the same math as the Dashboard.
- **Inventory:** FIFO costing is locked at the moment of sale, ensuring your profit figures never change if cost prices fluctuate later.

## 3. Verification

After entering your balances, run the **Trial Balance** report. Total Debits must equal Total Credits. If they do not, check for any unbalanced manual journal entries.

For technical verification, you can run the `test_flow.php` script located in the root directory to see a demonstration of a perfectly balanced transaction cycle.

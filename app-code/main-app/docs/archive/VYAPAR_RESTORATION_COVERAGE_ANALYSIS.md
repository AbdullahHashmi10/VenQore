# VYAPAR RESTORATION COVERAGE ANALYSIS
**Based on:** VYAPAR_MASTER_REFERENCE.md & VERIFICATION_REPORT.md  
**Source:** 67 tables, 792 columns in Vyapar database  
**Date:** 2026-02-08

---

## CORRECT VYAPAR TRANSACTION TYPE CODES

| Code | Type | Description |
|------|------|-------------|
| `0` | **Sale** | Sales invoices |
| `1` | **Purchase** | Purchase bills |
| `2` | **Payment In** | Money received from customers |
| `3` | **Payment Out** | Money paid to suppliers |
| `4` | **Sale Return** | Customer returns |
| `5` | **Purchase Return** | Returns to suppliers |
| `6` | **Expense** | Business expenses |
| `7` | **Estimate** | Quotations |
| `8` | **Delivery Challan** | Delivery notes |

---

## Currently Restored by `restore_vyapar_final.php`:

### ✅ **IMPLEMENTED (8 items - ~15% coverage)**
1. **Parties (Customers & Suppliers)** - `kb_names` → `parties` table
   - ✅ Name, phone, type, current_balance
   - ✅ Creates entries in `suppliers` table for purchases
   - ❌ Missing: GSTIN, TIN, credit limits, multiple addresses, party groups

2. **Products** - `kb_items` → `products` table
   - ✅ Name, price, cost_price, SKU, stock_quantity
   - ✅ Warehouse stock entries
   - ❌ Missing: Wholesale price, MRP, HSN codes, product images, units

3. **Sales Transactions** - `kb_transactions` (type=**0**) → `sales` table  
   **⚠️ WRONG CODE: Currently using type=1 which is PURCHASES!**
   - ✅ Party, amounts, payment status, dates
   - ✅ Line items (`kb_lineitems` → `sale_items`)
   - ✅ Payment records (`payments` table)
   - ✅ Activity log
   - ❌ Missing: Tax details, discounts, e-invoice data, attachments

4. **Expenses** - `kb_transactions` (type=6) → `expenses` table  
   **⚠️ WRONG CODE: Currently using type=7 which is ESTIMATES!**
   - ✅ Amount, date, description, category
   - ✅ Activity log

5. **Payments In** - `kb_transactions` (type=2) → `transactions` table  
   **⚠️ WRONG CODE: Currently using type=4 which is SALE RETURNS!**
   - ✅ Party, amount, date, type='payment_in'
   - ✅ Activity log

6. **Payments Out** - `kb_transactions` (type=3) → `transactions` table
   - ✅ Party, amount, date, type='payment_out'
   - ✅ Activity log

7. **Product Categories** - `kb_item_categories` → `categories` table
   - ✅ Links products via `kb_item_categories_mapping`

8. **Account Balances** - Updates AR/AP accounts

---

## ❌ **CRITICAL ISSUE: WRONG TRANSACTION TYPE CODES!**

The current script uses INCORRECT transaction type codes:
- ❌ Sales: Uses `type=1` (should be `type=0`)
- ❌ Expenses: Uses `type=7` (should be `type=6`)
- ❌ Payments In: Uses `type=4` (should be  `type=2`)

**This means:**
- **Sales are being imported from PURCHASE records!**
- **Expenses are being imported from ESTIMATE records!**
- **Payments In are being imported from SALE RETURN records!**

---

## ❌ **MISSING CRITICAL DATA (59+ items - 85% not covered)**

### 🔴 **Priority 1: Transaction Types NOT Restored**

9. **Purchases** - `kb_transactions` (type=**1**)
   - Currently importing THESE as sales by mistake!
   - Should go to `purchase_orders` table
   
10. **Sale Returns** - `kb_transactions` (type=4)
    - Currently importing THESE as payments in by mistake!
    
11. **Purchase Returns** - `kb_transactions` (type=5)

12. **Estimates/Quotations** - `kb_transactions` (type=7)
    - Currently importing THESE as expenses by mistake!

13. **Delivery Challans** - `kb_transactions` (type=8)

### 🔴 **Priority 1: Financial Accounts (Critical for Banking)**

14. **Payment Types (Banks, Cash, UPI)** - `kb_paymentTypes` (16 columns)
    - Bank accounts with opening balances
    - UPI IDs, IFSC codes, account numbers
    - Should map to `accounts` table
    - **CRITICAL: All cash and bank balances are here!**

15. **Cash Adjustments** - `kb_cash_adjustments` (5 columns)
    - All cash in hand corrections (Add/Reduce)

16. **Bank Adjustments & Transfers** - `kb_bank_adjustments` (8 columns)
    - Bank corrections, inter-bank transfers
    - Transfer proof attachments

17. **Cheque Tracking** - `kb_cheque_status` (10 columns)
    - Cheque clearance, bouncing, cancellation status

18. **Split Payments** - `txn_payment_mapping` (10 columns)
    - Multiple payment methods per transaction
    - Cheque numbers, UTR references
    - EDC/POS transaction IDs

19. **Bank Account Details** - `kb_bank_accounts` (5 columns)
    - Extended bank account information

### 🔴 **Priority 1: Loan Management**

20. **Loan Accounts** - `loan_accounts` (17 columns)
    - Loans taken and given
    - Interest rates, terms, lenders

21. **Loan Transactions** - `loan_transactions` (12 columns)
    - Principal payments, interest payments, disbursements

### 🟡 **Priority 2: Inventory Tracking**

22. **Batch Tracking** - `kb_item_stock_tracking` (10 columns)
    - Batch numbers, expiry dates, MRP by batch

23. **Serial Number Tracking** - `kb_serial_details` + `kb_serial_mapping`
    - Individual serial numbers for electronics/assets

24. **Stock Adjustments** - `kb_item_adjustments` (14 columns)
    - Stock add/reduce with reasons

25. **Bill of Materials / Assembly** - `item_def_assembly` (7 columns)
    - Manufacturing/assembly components

26. **Multi-warehouse Stock** - `stores`, `store_transactions`, `store_line_items`
    - Stock transfers between warehouses

27. **Item Images** - `kb_item_images` (6 columns)
    - Product photos (BLOB data)

28. **Units of Measurement** - `kb_item_units` + `kb_item_units_mapping`
    - Box, piece, kg conversions

### 🟡 **Priority 2: Party Data**

29. **Party Groups** - `kb_party_groups` (2 columns)
    - Customer categorization

30. **Additional Addresses** - `kb_address` (6 columns)
    - Multiple billing/shipping addresses per party

31. **Party-Specific Pricing** - `kb_party_item_rate` (5 columns)
    - Custom prices for specific customers/suppliers

32. **Party Service Reminders** - `party_item_service_reminder` (7 columns)
    - Service due dates for equipment

33. **Party-to-Party Transfers** - `party_to_party_transfer` (9 columns)
    - Balance transfers between parties

### 🟡 **Priority 2: Tax & Compliance**

34. **Tax Rates** - `kb_tax_code` + `kb_tax_mapping` (11 columns)
    - GST rates (5%, 12%, 18%, 28%)
    - Composite taxes (CGST+SGST)

35. **TCS Rates** - `kb_tcs_tax_rates` (4 columns)
    - Tax collected at source

36. **TDS Rates** - `tds_tax_rates` (6 columns)
    - Tax deducted at source

37. **Extra Charges** - `kb_extra_charges` (6 columns)
    - Shipping, packing, handling charges

38. **Invoice Prefixes** - `kb_prefix` (5 columns)
    - INV, BILL, EST prefixes per transaction type

### 🟢 **Priority 3: Transaction Links & References**

39. **Transaction Links** - `kb_txn_links` (7 columns)
    - Invoice-payment mapping
    - **Important for AR/AP aging reports**

40. **Linked Transactions** - `kb_linked_transactions` (4 columns)
    - Related transaction references

41. **Closed Link Transactions** - `kb_closed_link_txn_table` (7 columns)

42. **Transaction Attachments** - `transaction_attachments` (4 columns)
    - File uploads (invoices, bills, receipts)

### 🟢 **Priority 3: System & Company Data**

43. **Firm/Company Details** - `kb_firms` (33 columns)
    - Company name, GSTIN, logo, bank details
    - Invoice numbering sequences
    - **Should pre-populate company settings**

44. **System Settings** - `kb_settings` (3 columns)
    - Default tax rates, currency, etc.

45. **Payment Terms** - `kb_payment_terms` (4 columns)
    - Net 15, Net 30, etc.

### 🟢 **Priority 3: Accounting**

46. **Journal Entries** - `journal_entry` + `journal_entry_line_items`
    - Manual accounting entries
    - Debit/credit ledger

47. **Chart of Accounts Mapping** - `chart_of_accounts_mapping` (5 columns)
    - Account hierarchy

48. **Other Accounts** - `other_accounts` (10 columns)
    - Miscellaneous financial accounts

### 🟢 **Priority 3: Customization**

49. **User-Defined Fields** - `kb_udf_fields` + `kb_udf_values`
    - Custom fields on transactions/items/parties

50. **Custom Fields** - `kb_custom_fields` (4 columns)
    - Additional custom field definitions

51. **Loyalty Program** - `loyalty_txn` (12 columns)
    - Points earned and redeemed

### 🟢 **Priority 3: Users & Audit**

52. **Users** - `urp_users` (11 columns)
    - User accounts with roles

53. **User Activity Log** - `urp_activity` (8 columns)
    - Who did what when

54. **Audit Trails** - `audit_trails` (8 columns)
    - Change history for transactions

55. **Recycle Bin** - `recycle_bin` (7 columns)
    - Deleted transactions (recoverable)

56. **System Logs** - `kb_log` (3 columns)

---

## 📊 COVERAGE SUMMARY

| Priority | Category | Items | Status |
|----------|----------|-------|--------|
| ✅ | Currently Implemented | 8 | **15%** |
| 🔴 | Priority 1 (Critical) | 10 | **0%** |
| 🟡 | Priority 2 (Important) | 18 | **0%** |
| 🟢 | Priority 3 (Complete) | 24 | **0%** |
| **TOTAL** | **All Data Types** | **60** | **13% covered** |

---

## 🚨 IMMEDIATE ACTION REQUIRED

### Fix #1: Correct Transaction Type Codes
```php
// WRONG (current):
$salesStmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 1");  // This is PURCHASES!
$expenseStmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 7");  // This is ESTIMATES!
$paymentInStmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 4");  // This is SALE RETURNS!

// CORRECT (should be):
$salesStmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 0");  // Sales
$purchasesStmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 1");  // Purchases
$paymentInStmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 2");  // Payment In
$paymentOutStmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 3");  // Payment Out
$expenseStmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 6");  // Expenses
```

### Fix #2: Add Missing Critical Items
1. **Payment Types** (Cash/Bank accounts)  
2. **Purchases** (type=1)  
3. **Sale/Purchase Returns** (type=4, 5)  
4. **Cash/Bank Adjustments**  
5. **Tax Rates**

---

## 💡 RECOMMENDATION

**Immediate Actions:**
1. **FIX transaction type codes** - Current data is completely wrong
2. **Add Payment Types restoration** - Critical for financial accuracy
3. **Add Purchases restoration** - Critical for COGS and inventory
4. **Add Returns restoration** - Critical for accurate financials
5. **Add Tax Rates** - Important for compliance

**Phased Approach:**
- **Phase 1 (Week 1):** Fix codes + Purchases + Payment Types + Returns
- **Phase 2 (Week 2):** Batch tracking + Stock adjustments + Tax rates
- **Phase 3 (Week 3):** Loans + Journal entries + Audit trails
- **Phase 4 (Week 4):** Complete remaining 24 items for 100% fidelity

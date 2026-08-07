# Vyapar Data Extraction Reference

This document provides a comprehensive list of all data modules, tables, and columns available for extraction from the Vyapar backup database. This is intended to serve as a checklist when building the migration or extraction system.

---

## 1. Parties (Customers & Suppliers)
**Table:** `kb_names`
- **Identity:** `full_name`, `phone_number`, `email`
- **Financials:** `amount` (Current Balance), `credit_limit`, `credit_limit_enabled`
- **Address & Tax:** `address`, `pincode`, `name_shipping_address`, `name_shipping_pincode`, `name_state`, `name_gstin_number`, `name_tin_number`
- **Classification:** `name_type` (Customer/Supplier), `name_group_id`, `name_customer_type`, `name_expense_type`
- **Metadata:** `date_created`, `date_modified`, `name_last_txn_date`, `name_is_active`
- **Reminders:** `date_remindon`, `frequency_of_payment_reminder`
- **Custom Fields:** `party_billing_name`, `icf_values` (Internal Custom Fields)

---

## 2. Items (Products & Services)
**Table:** `kb_items`, `kb_item_categories`, `kb_item_units`
- **Basic Info:** `item_name`, `item_code`, `item_description`, `item_hsn_sac_code`
- **Pricing:** 
  - `item_sale_unit_price` (Sales Price)
  - `item_purchase_unit_price` (Purchase Price)
  - `item_wholesale_price` (Wholesale Price)
  - `item_mrp` (Maximum Retail Price)
  - `item_dis_on_mrp_for_sp`, `item_dis_on_mrp_for_wp`
- **Inventory:** 
  - `item_stock_quantity` (Current Stock)
  - `item_min_stock_quantity` (Low Stock Warning)
  - `item_stock_value` (Total Value)
  - `item_location` (Warehouse/Racking)
- **Taxation:** `item_tax_id`, `item_tax_type` (Inclusive/Exclusive), `item_additional_cess_per_unit`
- **Units:** `base_unit_id`, `secondary_unit_id`, `unit_mapping_id` (Conversion Rates)
- **Tracking:** `item_ist_type` (Batch/Serial/None), `service_reminder_status`, `service_period`
- **Status:** `item_is_active`, `item_catalogue_status`

---

## 3. Transactions (Sales, Purchase, Expenses, etc.)
**Table:** `kb_transactions`
- **Header Info:** `txn_id`, `txn_date`, `txn_display_name`, `txn_invoice_prefix`, `txn_ref_number_char` (Invoice Number)
- **Financials:** 
  - `txn_cash_amount` (Received/Paid Amount)
  - `txn_balance_amount` (Due/Balance)
  - `txn_discount_amount`, `txn_discount_percent`
  - `txn_tax_amount`, `txn_tax_percent`
  - `txn_round_off_amount`
  - `txn_total_amount` (Derived from line items)
- **Taxes (Advanced):** `txn_tax_id`, `txn_tax_inclusive`, `txn_place_of_supply`, `txn_reverse_charge`, `txn_itc_applicable`
- **Additional Costs:** `txn_ac1_amount`, `txn_ac2_amount`, `txn_ac3_amount` (and their names)
- **Logistics:** `txn_eway_bill_number`, `txn_eway_bill_generated_date`, `txn_shipping_address`, `txn_billing_address`
- **Digital/Online:** `txn_online_order_id`, `txn_einvoice_qr`, `txn_irn_number`
- **Payment:** `txn_payment_type_id`, `txn_payment_reference`, `txn_payment_status`, `txn_payment_term_id`
- **Metadata:** `txn_date_created`, `txn_date_modified`, `txn_type` (Sale, Purchase, Return, etc.), `txn_status`, `created_by`, `updated_by`

---

## 4. Transaction Line Items (Product Details in Invoices)
**Table:** `kb_lineitems`
- **Linkage:** `lineitem_txn_id`, `item_id`
- **Quantity & Price:** `quantity`, `priceperunit`, `total_amount`, `lineitem_free_quantity`
- **Discounts & Taxes:** `lineitem_discount_amount`, `lineitem_discount_percent`, `lineitem_tax_amount`, `lineitem_tax_id`, `lineitem_additional_cess`
- **Tracking Details:** `lineitem_batch_number`, `lineitem_expiry_date`, `lineitem_manufacturing_date`, `lineitem_serial_number`
- **Metadata:** `lineitem_description`, `lineitem_unit_id`, `lineitem_unit_mapping_id`, `lineitem_size`

---

## 5. Stock Tracking (Batches & Serials)
**Table:** `kb_item_stock_tracking`, `kb_serial_details`
- **Details:** `ist_batch_number`, `ist_serial_number`, `ist_mrp`, `ist_expiry_date`, `ist_manufacturing_date`, `ist_size`
- **Quantity:** `ist_current_quantity`, `ist_opening_quantity`

---

## 6. Payment & Bank Accounts
**Table:** `kb_paymentTypes`, `txn_payment_mapping`, `kb_bank_accounts`
- **Account Info:** `paymentType_name`, `paymentType_bankName`, `paymentType_accountNumber`, `pt_bank_ifsc_code`, `pt_bank_upi_id`
- **Balance:** `paymentType_opening_balance`, `paymentType_opening_date`
- **Mapping:** `amount`, `payment_reference`, `cheque_id`

---

## 7. Cash & Bank Adjustments (Corrections & Transfers)
**Table:** `kb_cash_adjustments`, `kb_bank_adjustments`, `kb_cheque_status`
- **Cash Adjustments:** `cash_adj_amount`, `cash_adj_type` (Add/Reduce), `cash_adj_description`, `cash_adj_date`
- **Bank Adjustments:** `bank_adj_amount`, `bank_adj_type`, `bank_adj_description`, `bank_adj_bank_id`, `bank_adj_to_bank_id` (Inter-bank transfers)
- **Cheque Tracking:** `cheque_current_status` (Pending/Cleared/Bounced), `cheque_txn_id`, `cheque_issued_date`, `cheque_transfer_date`

---

## 8. Business Entities & Firms
**Table:** `kb_firms`
- **Company Info:** `firm_name`, `firm_email`, `firm_phone`, `firm_address`, `firm_gstin_number`
- **Bank Details:** `firm_bank_name`, `firm_bank_account_number`, `firm_bank_ifsc_code`
- **Sequence Management:** `firm_invoice_number`, `firm_tax_invoice_number`, `firm_estimate_number`

---

## 9. User Defined Fields (UDF) & Custom Fields
**Table:** `kb_udf_fields`, `kb_udf_values`, `kb_custom_fields`
- **Configuration:** `udf_field_name`, `udf_field_type`, `udf_print_on_invoice`
- **Data:** `udf_value`, `udf_ref_id` (Links to transactions or items)

---

## 10. Item Assembly / Bill of Materials (BOM)
**Table:** `item_def_assembly`, `item_def_assembly_additional_costs`, `item_mfg_assembly_additional_costs`
- **Definition:** Links a "Finished Good" to its component items and quantities.
- **Costs:** Additional costs (labor, overhead) associated with the assembly process.

---

## 11. Other Modules
- **Expenses:** (Stored within `kb_transactions` with specific `txn_type`)
- **Loans:** `loan_accounts`, `loan_transactions` (Principal, Interest, etc.)
- **Loyalty:** `loyalty_txn` (Points rewarded/redeemed)
- **Journal Entries:** `journal_entry`, `journal_entry_line_items`
- **Party Transfers:** `party_to_party_transfer` (Transferring balances between customers/suppliers)
- **Attachments:** `transaction_attachments` (Links to images/documents attached to transactions)
- **Prefixes:** `kb_prefix` (Custom invoice prefixes)
- **TCS/TDS:** `kb_tcs_tax_rates`, `tds_tax_rates`
- **Stores/Warehouses:** `stores`, `store_transactions`, `store_line_items`
- **Audit Trails:** `audit_trails` (History of edits)
- **Recycle Bin:** `recycle_bin` (Deleted transactions)

---

## Summary Checklist for Extraction System
- [ ] Party List with full profiles
- [ ] Product Catalog with multi-pricing and stock
- [ ] All Sales Invoices & Returns
- [ ] Purchase Bills & Returns
- [ ] Payment In (Received) & Payment Out (Paid)
- [ ] Cash & Bank account balances/transfers
- [ ] Expense records
- [ ] Batch & Serial number history
- [ ] User Defined Fields (UDF) across all modules
- [ ] Linked Transaction relationships (Invoice-to-Payment mapping)

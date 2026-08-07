# COMPREHENSIVE VYAPAR DATA EXTRACTION REFERENCE v2.0

> **Second Attempt - Complete Analysis**  
> This document catalogs ALL extractable data columns from the Vyapar backup database.  
> Total Tables: **67** | Total Columns: **792**  
> Last Updated: 2026-02-08

---

## TABLE OF CONTENTS

1. [Core Business Data](#1-core-business-data)
2. [Financial Accounts & Banking](#2-financial-accounts--banking)
3. [Transaction Management](#3-transaction-management)
4. [Inventory & Stock](#4-inventory--stock)
5. [Tax & Compliance](#5-tax--compliance)
6. [User & Access Control](#6-user--access-control)
7. [Customization & Extensions](#7-customization--extensions)
8. [System & Metadata](#8-system--metadata)

---

## 1. CORE BUSINESS DATA

### 1.1 Parties (Customers & Suppliers)
**Table:** `kb_names`

**Identity & Contact:**
- `name_id`, `full_name`, `phone_number`, `email`
- `party_billing_name` (Alternate billing name)

**Financial Details:**
- `amount` (Current balance - receivable/payable)
- `credit_limit`, `credit_limit_enabled`

**Address Information:**
- `address`, `pincode`
- `name_shipping_address`, `name_shipping_pincode`
- `name_state`

**Tax & Compliance:**
- `name_gstin_number`, `name_verified_gstin`
- `name_tin_number`

**Classification:**
- `name_type` (1=Customer, 2=Supplier, etc.)
- `name_sub_type`
- `name_group_id` → Links to `kb_party_groups`
- `name_customer_type`
- `name_expense_type`

**Reminders & Communication:**
- `date_remindon`, `date_sendsmson`, `date_ignoretill`
- `frequency_of_payment_reminder`
- `is_party_details_sent`

**Audit Trail:**
- `date_created`, `date_modified`
- `name_last_txn_date`
- `created_by`, `updated_by` → Links to `urp_users`
- `name_is_active`

---

### 1.2 Party Groups
**Table:** `kb_party_groups`
- `party_group_id`
- `party_group_name`

---

### 1.3 Party Additional Addresses
**Table:** `kb_address`
- `address_id`
- `name_id` → Links to `kb_names`
- `address_type` (Billing/Shipping/Other)
- `address`
- `date_created`, `date_modified`

---

### 1.4 Party to Party Transfers
**Table:** `party_to_party_transfer`
- `p_txn_id`
- `p_amount`
- `p_received_txn_id`, `p_paid_txn_id` → Links to `kb_transactions`
- `p_txn_date`, `p_txn_description`
- `p_txn_image_id`
- `p_txn_firm_id`
- `p_txn_date_created`, `p_txn_date_modified`

---

### 1.5 Party-Specific Item Pricing
**Table:** `kb_party_item_rate`
- `party_item_rate_id`
- `party_item_rate_item_id` → Links to `kb_items`
- `party_item_rate_party_id` → Links to `kb_names`
- `party_item_rate_sale_price`
- `party_item_rate_purchase_price`

---

### 1.6 Party Service Reminders
**Table:** `party_item_service_reminder`
- `id`, `name_id`, `item_id`
- `reminder_status`, `service_period`
- `last_service_date`, `last_reminder_sent_date`

---

## 2. FINANCIAL ACCOUNTS & BANKING

### 2.1 Payment Types (Cash, Bank, UPI, Card, etc.)
**Table:** `kb_paymentTypes`

**Account Identity:**
- `paymentType_id`
- `paymentType_name` (Display name: "Cash", "HDFC Bank", etc.)
- `paymentType_type` ("CASH", "BANK", "UPI", "CARD", etc.)

**Bank Details:**
- `paymentType_bankName`
- `paymentType_accountNumber`
- `pt_bank_ifsc_code`
- `pt_bank_account_holder_name`
- `pt_bank_upi_id`
- `pt_bank_ref_id`
- `pt_bank_code`

**EDC/POS Integration:**
- `edc_deviceId`
- `edc_vendor_type`
- `edc_device_type`

**Opening Balance:**
- `paymentType_opening_balance`
- `paymentType_opening_date`

**System:**
- `uuid`

---

### 2.2 Bank Account Details
**Table:** `kb_bank_accounts`
- `bank_account_seq_id`
- `bank_account_ref_id` (External reference)
- `bank_account_number`
- `bank_account_type` (Savings/Current/etc.)
- `paymentType_id` → Links to `kb_paymentTypes`

---

### 2.3 Cash Adjustments (Cash In Hand Corrections)
**Table:** `kb_cash_adjustments`

**All Columns:**
- `cash_adj_id`
- `cash_adj_type` (1=Add Money, 2=Reduce Money)
- `cash_adj_amount`
- `cash_adj_date`
- `cash_adj_description`

> ✅ **Captures ALL cash-in-hand adjustments/corrections**

---

### 2.4 Bank Adjustments & Transfers
**Table:** `kb_bank_adjustments`

**All Columns:**
- `bank_adj_id`
- `bank_adj_bank_id` → Source bank account
- `bank_adj_type` (1=Add, 2=Reduce, 3=Transfer)
- `bank_adj_amount`
- `bank_adj_date`
- `bank_adj_description`
- `bank_adj_to_bank_id` → Destination bank (for transfers)
- `bank_adj_image_id` → Proof attachment

> ✅ **Captures ALL bank account adjustments and inter-bank transfers**

---

### 2.5 Cheque Tracking
**Table:** `kb_cheque_status`

**All Columns:**
- `cheque_id`
- `cheque_txn_id` → Links to `kb_transactions`
- `cheque_current_status` (Pending/Cleared/Bounced/Cancelled)
- `cheque_issued_date`
- `cheque_transfer_date`
- `cheque_close_desc`
- `transferred_To_Account` → Account where deposited
- `check_creation_date`, `check_modification_date`
- `cheque_closed_txn_ref_id`

---

### 2.6 Transaction Payment Mapping
**Table:** `txn_payment_mapping`

**All Columns:**
- `id`
- `payment_id` → Links to `kb_paymentTypes`
- `cheque_id` → Links to `kb_cheque_status`
- `txn_id` → Links to `kb_transactions`
- `amount` (Amount paid via this payment method)
- `payment_reference` (Cheque number, UTR, etc.)
- `edc_payment_status`
- `edc_payment_txnId`
- `edc_payment_mode` (Card/UPI/etc.)
- `edc_payment_initiationId`
- `edc_card_last_digits`

> ✅ **Maps EACH payment method used in a transaction** (Split payments)

---

### 2.7 Payment Gateway Integration
**Table:** `kb_payment_gateway`
- `paymentgateway_id`, `paymentType_id`
- `gstin`, `owner_pan_name`, `owner_pan_number`
- `business_type`, `business_name`, `business_pan_number`, `cin`
- Document references: `owner_pan_doc`, `addr_proof_front_doc`, etc.
- `status`, `revisit`, `error_fields`
- `link_auth_token`, `paymentgateway_uuid`, `paymentgateway_account_id`
- `created_at`, `updated_at`

---

### 2.8 Loan Accounts
**Table:** `loan_accounts`
- `loan_account_id`, `loan_account_name`
- `lender`, `account_number`
- `firm_id`
- `loan_desc`
- `opening_bal`, `opening_date`
- `interest_rate`, `term_duration`
- `loan_account_type` (Loan Taken / Loan Given)
- `loan_application_num`
- `created_by`, `updated_by`
- `loan_created_date`, `loan_modified_date`

---

### 2.9 Loan Transactions
**Table:** `loan_transactions`
- `loan_txn_id`, `loan_account_id`
- `loan_txn_type` (Principal Payment/Interest Payment/Disbursement)
- `principal_amount`, `interest_amount`
- `payment_acc_id` → Payment method used
- `txn_date`, `txn_desc`
- `txn_desc_image_id`
- `created_by`, `updated_by`
- `loan_txn_created_date`, `loan_txn_modified_date`

---

### 2.10 Other Accounts (Miscellaneous Financial Accounts)
**Table:** `other_accounts`
- `id`, `name`
- `opening_balance`, `opening_balance_date`
- `account_type`, `account_identifier`
- `created_by`, `modified_by`
- `created_at`, `modified_at`

---

### 2.11 Chart of Accounts Mapping
**Table:** `chart_of_accounts_mapping`
- `id`, `parent_id`
- `account_code`
- `foreign_account_id`, `foreign_account_type`

---

### 2.12 Journal Entries
**Table:** `journal_entry`
- `id`, `journal_firm_id`
- `reference_number`, `date`
- `description`
- `created_by`, `modified_by`
- `created_at`, `modified_at`

**Table:** `journal_entry_line_items`
- `id`, `journal_entry_id`
- `account_id`, `amount`
- `amount_type` (Debit/Credit)
- `reference_account_id`, `txn_link_id`

---

## 3. TRANSACTION MANAGEMENT

### 3.1 Main Transactions Table
**Table:** `kb_transactions`

**Transaction Identity:**
- `txn_id`
- `txn_type` (Sale, Purchase, Sale Return, Purchase Return, Payment In, Payment Out, Expense, Estimate, Delivery Challan, etc.)
- `txn_sub_type`
- `txn_ref_number_char` (Invoice number)
- `txn_invoice_prefix`
- `txn_prefix_id`
- `txn_display_name`

**Party & Financials:**
- `txn_name_id` → Links to `kb_names`
- `txn_cash_amount` (Amount received/paid)
- `txn_balance_amount` (Due/outstanding)
- `txn_current_balance` (Party balance after this transaction)

**Dates:**
- `txn_date` (Transaction date)
- `txn_due_date`
- `txn_date_created`, `txn_date_modified`
- `txn_time` (Unix timestamp)
- `txn_po_date`, `txn_po_ref_number` (Purchase Order reference)
- `txn_return_date`, `txn_return_ref_number` (Return reference)

**Pricing & Discounts:**
- `txn_discount_percent`, `txn_discount_amount`, `txn_discount_type`
- `txn_round_off_amount`

**Tax Details:**
- `txn_tax_percent`, `txn_tax_amount`
- `txn_tax_id` → Tax rate applied
- `txn_tax_inclusive` (Tax-inclusive pricing)
- `txn_place_of_supply` (State for GST)
- `txn_reverse_charge` (Reverse charge applicable)
- `txn_itc_applicable` (Input Tax Credit)
- `txn_tcs_tax_id`, `txn_tcs_tax_amount` (TCS on sales)
- `txn_tds_tax_id`, `txn_tds_tax_amount` (TDS on purchases)

**Additional Charges (Up to 3):**
- `ac1_name`, `ac1_sac_code`, `ac1_tax_id`, `ac1_tax_amount`, `ac1_itc_applicable`, `txn_ac1_amount`
- `ac2_name`, `ac2_sac_code`, `ac2_tax_id`, `ac2_tax_amount`, `ac2_itc_applicable`, `txn_ac2_amount`
- `ac3_name`, `ac3_sac_code`, `ac3_tax_id`, `ac3_tax_amount`, `ac3_itc_applicable`, `txn_ac3_amount`

**Payment Details:**
- `txn_payment_type_id` → Primary payment method
- `txn_payment_reference` (Cheque/UTR/etc.)
- `txn_payment_status` (Paid/Unpaid/Partial)
- `txn_payment_term_id` → Credit terms
- `payment_initiated_deviceId`

**Address & Logistics:**
- `txn_billing_address`, `txn_shipping_address`
- `txn_eway_bill_number`
- `txn_eway_bill_api_generated`, `txn_eway_bill_generated_date`

**E-Invoice & Digital:**
- `txn_irn_number` (Invoice Reference Number for e-invoicing)
- `txn_einvoice_qr`
- `cancelled_einvoice_date`
- `txn_online_order_id`
- `txn_paymentgateway_paymenttype_id`, `txn_paymentgateway_payment_txn_id`
- `txn_paymentgateway_link`, `txn_paymentgateway_qr`

**Other Details:**
- `txn_description`
- `txn_image_path`, `txn_image_id`
- `txn_custom_field` (JSON of custom field values)
- `icf_names` (Internal custom fields)
- `txn_firm_id` → Company/branch
- `txn_category_id` → Expense category (for expense transactions)
- `store_id` → Warehouse/store
- `txn_status` (Active/Draft/Cancelled)
- `created_by`, `updated_by` → User who created/modified
- `mobile_no` (Customer mobile for loyalty)
- `loyalty_amount` (Loyalty points redeemed value)

**Total of 78 columns** in `kb_transactions`

---

### 3.2 Transaction Line Items (Products in Invoice)
**Table:** `kb_lineitems`

**Line Item Identity:**
- `lineitem_id`
- `lineitem_txn_id` → Links to `kb_transactions`
- `item_id` → Links to `kb_items`

**Quantity & Pricing:**
- `quantity`, `lineitem_free_quantity`
- `priceperunit`
- `total_amount`
- `lineitem_count` (Number of units, if different from quantity)

**Discounts:**
- `lineitem_discount_amount`, `lineitem_discount_percent`, `lineitem_discount_type`

**Tax:**
- `lineitem_tax_id`, `lineitem_tax_amount`
- `lineitem_additional_cess`
- `lineitem_itc_applicable`

**Units:**
- `lineitem_unit_id`, `lineitem_unit_mapping_id` (Conversion rate)

**Batch/Serial Tracking:**
- `lineitem_batch_number`
- `lineitem_serial_number`, `lineitem_is_serialized`
- `lineitem_expiry_date`, `lineitem_manufacturing_date`
- `lineitem_size`
- `lineitem_ist_id` → Links to `kb_item_stock_tracking`

**Pricing:**
- `lineitem_mrp`
- `lineitem_total_amount_edited` (Was total manually edited?)
- `lineitem_fa_cost_price` (Fixed asset cost price)

**References:**
- `lineitem_ref_id`
- `lineitem_txn_po_ref_number` (Purchase order line reference)
- `lineitem_description`
- `icf_values` (Internal custom fields)

**Total of 30 columns** in `kb_lineitems`

---

### 3.3 Transaction Links (Invoice-Payment Mapping)
**Table:** `kb_txn_links`
- `txn_links_id`
- `txn_links_txn_1_id`, `txn_links_txn_1_type` (Invoice)
- `txn_links_txn_2_id`, `txn_links_txn_2_type` (Payment)
- `txn_links_amount` (Amount applied)
- `txn_links_closed_txn_ref_id` → Closed transaction reference

**Table:** `kb_linked_transactions`
- `linked_id`
- `txn_source_id`, `txn_destination_id`
- `txns_linked_date`

**Table:** `kb_closed_link_txn_table`
- `closed_link_txn_id`
- `closed_link_txn_amount`, `closed_link_txn_type`, `closed_link_txn_date`
- `closed_link_txn_ref_number`
- `txn_links_closed_txn_name_id`, `txn_links_closed_txn_category_id`

---

### 3.4 Transaction Attachments
**Table:** `transaction_attachments`
- `id`, `txn_id`
- `uuid`, `name` (Filename)

---

### 3.5 Payment Terms (Credit Terms)
**Table:** `kb_payment_terms`
- `payment_term_id`
- `term_name` (e.g., "Net 30", "Net 15")
- `term_days`
- `is_default`

---

### 3.6 Recycle Bin (Deleted Transactions)
**Table:** `recycle_bin`
- `id`
- `txn_deleted_date`
- `txn_firm_id`
- `txn_data_json` (Complete transaction data as JSON)
- `txn_type`, `txn_date`
- `status` (Deleted/Restored)

---

## 4. INVENTORY & STOCK

### 4.1 Items (Products & Services)
**Table:** `kb_items`

**Basic Info:**
- `item_id`, `item_name`, `item_code`
- `item_description`
- `item_type` (Product/Service)
- `item_hsn_sac_code` (Tax classification)

**Pricing:**
- `item_sale_unit_price` (Regular sale price)
- `item_purchase_unit_price` (Purchase price)
- `item_mrp` (Maximum Retail Price)
- `item_wholesale_price`
- `item_min_wholesale_qty`
- `item_dis_on_mrp_for_sp`, `item_dis_on_mrp_for_wp` (Discount on MRP)
- `item_discount_type`, `item_discount`

**Stock:**
- `item_stock_quantity` (Current stock)
- `item_min_stock_quantity` (Low stock alert level)
- `item_stock_value` (Total stock value)
- `item_location` (Warehouse/rack location)

**Units:**
- `base_unit_id`, `secondary_unit_id`, `unit_mapping_id`

**Tax:**
- `item_tax_id`, `item_tax_type` (Inclusive/Exclusive)
- `item_tax_type_purchase`, `item_tax_type_wholesale_price`
- `item_additional_cess_per_unit`

**Tracking:**
- `item_ist_type` (0=None, 1=Batch, 2=Serial)
- `service_reminder_status`, `service_period`

**Category:**
- `category_id` → Links to `kb_item_categories`

**Catalog:**
- `item_catalogue_status` (Listed/Not Listed)
- `item_catalogue_sale_unit_price`, `item_catalogue_description`
- `item_catalogue_stock_status`

**System:**
- `item_is_active`
- `item_date_created`, `item_date_modified`
- `created_by`, `updated_by`
- `icf_values` (Internal custom fields)

**Total of 41 columns** in `kb_items`

---

### 4.2 Item Categories
**Table:** `kb_item_categories`
- `item_category_id`, `item_category_name`

**Table:** `kb_item_categories_mapping`
- `id`, `item_id`, `category_id`

---

### 4.3 Item Units of Measurement
**Table:** `kb_item_units`
- `unit_id`
- `unit_name`, `unit_short_name`
- `unit_full_name_editable`, `unit_deletable`

**Table:** `kb_item_units_mapping`
- `unit_mapping_id`
- `base_unit_id`, `secondary_unit_id`
- `conversion_rate` (e.g., 1 Box = 12 Pieces)

---

### 4.4 Stock Tracking (Batches & Serials)
**Table:** `kb_item_stock_tracking`
- `ist_id`
- `ist_item_id` → Links to `kb_items`
- `ist_type` (1=Batch, 2=Serial)
- `ist_batch_number`, `ist_serial_number`
- `ist_mrp`, `ist_size`
- `ist_expiry_date`, `ist_manufacturing_date`
- `ist_current_quantity`, `ist_opening_quantity`

**Table:** `kb_serial_details`
- `serial_id`, `serial_item_id`
- `serial_number`
- `serial_current_quantity`

**Table:** `kb_serial_mapping`
- `serial_mapping_id`
- `serial_mapping_serial_id`, `serial_mapping_lineitem_id`, `serial_mapping_adj_id`

**Table:** `kb_adjustment_ist_mapping`
- `adjustment_ist_mapping_id`
- `adjustment_ist_mapping_ist_id`, `adjustment_ist_mapping_adjustment_id`
- `adjustment_ist_mapping_qty`

---

### 4.5 Stock Adjustments
**Table:** `kb_item_adjustments`
- `item_adj_id`
- `item_adj_item_id` → Links to `kb_items`
- `item_adj_type` (Add/Reduce stock)
- `item_adj_quantity`
- `item_adj_date`, `item_adj_description`
- `item_adj_atprice` (Adjustment value per unit)
- `item_adj_ist_id`, `item_adj_ist_type` (Batch/Serial)
- `item_adj_is_serialized`
- `item_adj_unit_id`, `item_adj_unit_mapping_id`
- `item_adj_mfg_adj_id` (Manufacturing/assembly adjustment)
- `item_adj_txn_id` (Linked transaction)
- `store_id`
- `item_adj_date_created`, `item_adj_date_modified`

---

### 4.6 Item Assembly / Bill of Materials (BOM)
**Table:** `item_def_assembly`
- `id`
- `assembled_item_id` (Finished product)
- `def_assembly_item_id` (Component item)
- `def_assembly_item_qty` (Quantity required)
- `def_assembly_item_unit_id`, `def_assembly_item_unit_mapping_id`
- `def_assembly_created_at`, `def_assembly_updated_at`

**Table:** `item_def_assembly_additional_costs`
- `id`, `assembled_item_id`
- `def_assembly_payment_type`
- `def_assembly_ac_1` to `def_assembly_ac_5` (Labor, overhead, etc.)

**Table:** `item_mfg_assembly_additional_costs`
- `id`, `mfg_adj_id`, `mfg_txn_id`
- `mfg_assembly_payment_type`, `mfg_assembly_payment_ref_no`
- `mfg_assembly_ac_1` to `mfg_assembly_ac_5`

---

### 4.7 Item Images
**Table:** `kb_item_images`
- `item_image_id`, `item_id`
- `item_image_bitmap` (BLOB - image data)
- `catalogue_item_id`
- `item_image_catalogue_sync_status`, `item_image_is_dirty`

**Table:** `kb_images`
- `image_id`
- `image_bitmap` (BLOB - generic images)

---

### 4.8 Stores/Warehouses
**Table:** `stores`
- `id`, `type`, `name`
- `phone_number`, `email`
- `gstin`, `pincode`, `address`
- `created_date`, `modified_date`

**Table:** `store_transactions`
- `id`
- `from_store_id`, `to_store_id`
- `txn_date`, `created_date`
- `created_by`, `sub_type`

**Table:** `store_line_items`
- `id`, `store_txn_id`, `item_id`, `quantity`

---

## 5. TAX & COMPLIANCE

### 5.1 Tax Codes & Rates (GST, VAT, etc.)
**Table:** `kb_tax_code`
- `tax_code_id`, `tax_code_name` (e.g., "GST 18%")
- `tax_rate` (e.g., 18.0)
- `tax_code_type` (GST/VAT/etc.)
- `tax_rate_type`
- `tax_code_date_created`, `tax_code_date_modified`

**Table:** `kb_tax_mapping`
- `tax_mapping_id`
- `tax_mapping_group_id` (Composite tax group: CGST+SGST)
- `tax_mapping_code_id` → Individual tax component
- `tax_mapping_date_created`, `tax_mapping_date_modified`

---

### 5.2 TCS (Tax Collected at Source)
**Table:** `kb_tcs_tax_rates`
- `tcs_tax_id`, `tcs_tax_name`
- `tcs_tax_percentage`
- `tcs_tax_nature_of_collection_id`

---

### 5.3 TDS (Tax Deducted at Source)
**Table:** `tds_tax_rates`
- `id`, `name`
- `percentage`
- `section_id` (TDS section like 194C, 194J, etc.)
- `created_date`, `modified_date`

---

### 5.4 Extra Charges (Shipping, Packing, etc.)
**Table:** `kb_extra_charges`
- `extra_charges_id`, `extra_charges_name`
- `sac_code`
- `tax_enabled`, `tax_id`
- `enabled`

---

### 5.5 Invoice Prefixes
**Table:** `kb_prefix`
- `prefix_id`, `prefix_firm_id`
- `prefix_txn_type` (Sale/Purchase/etc.)
- `prefix_value` (e.g., "INV", "BILL", "EST")
- `prefix_is_default`

---

## 6. USER & ACCESS CONTROL

### 6.1 Users
**Table:** `urp_users`
- `user_id`, `user_name`
- `user_role_id` (Owner/Admin/Staff/etc.)
- `user_passcode` (Encrypted)
- `user_phone_or_emaill`
- `user_is_active`, `user_is_deleted`
- `user_sync_enabled`, `user_sync_started`
- `user_status`, `user_server_id`

---

### 6.2 User Activity Log
**Table:** `urp_activity`
- `activity_id`
- `activity_actor` (User ID)
- `activity_resource` (Resource type)
- `activity_operation` (CREATE/UPDATE/DELETE/etc.)
- `activity_time`, `activity_creation_time`
- `activity_resource_id`
- `activity_is_old`

---

### 6.3 Audit Trails
**Table:** `audit_trails`
- `audit_trail_id`, `txn_id`
- `audit_trail_group` (Grouping for related changes)
- `user_id`, `device_id`, `device_info`
- `version_number` (Transaction version)
- `view_changelog`, `change_logs` (Detailed change log)
- `created_at`

---

## 7. CUSTOMIZATION & EXTENSIONS

### 7.1 User-Defined Fields (UDF)
**Table:** `kb_udf_fields`
- `udf_field_id`, `udf_field_name`
- `udf_field_type` (Transaction/Item/Party)
- `udf_field_data_type` (Text/Number/Date/Dropdown)
- `udf_field_data_format`
- `udf_print_on_invoice`
- `udf_txn_type` (Which transaction types this applies to)
- `udf_field_no`, `udf_field_status`
- `udf_firm_id`

**Table:** `kb_udf_values`
- `udf_value_id`
- `udf_value_field_id` → Links to `kb_udf_fields`
- `udf_ref_id` (Transaction/Item/Party ID)
- `udf_value` (Actual value)
- `udf_value_field_type`

---

### 7.2 Custom Fields
**Table:** `kb_custom_fields`
- `custom_field_id`
- `custom_field_display_name`
- `custom_field_type`
- `custom_field_visibility`

---

### 7.3 Message Configuration
**Table:** `kb_txn_message_config`
- `txn_type`, `txn_field_id`
- `txn_field_name`, `txn_field_value`

---

### 7.4 Loyalty Program
**Table:** `loyalty_txn`
- `id`, `txn_id`, `party_id`
- `mobile_no`
- `point_rewarded`, `point_redeemed`, `amount`
- `txn_type` (Reward/Redeem)
- `redeemed_date`, `rewarded_date`
- `created_at`, `updated_at`
- `created_by`, `updated_by`

---

## 8. SYSTEM & METADATA

### 8.1 Firms/Companies
**Table:** `kb_firms`

**Company Info:**
- `firm_id`, `firm_name`
- `firm_email`, `firm_phone`, `firm_phone_secondary`
- `firm_address`, `firm_pincode`
- `firm_dispatch_address`, `firm_dispatch_pincode`

**Tax Details:**
- `firm_gstin_number`, `firm_state`
- `firm_tin_number`

**Bank Details:**
- `firm_bank_name`, `firm_bank_account_number`, `firm_bank_ifsc_code`
- `firm_upi_bank_account_number`, `firm_upi_bank_ifsc_code`
- `firm_invoice_printing_bank_id`, `firm_collect_payment_bank_id`

**Invoice Numbering:**
- `firm_invoice_prefix`, `firm_invoice_number`
- `firm_tax_invoice_prefix`, `firm_tax_invoice_number`
- `firm_estimate_prefix`, `firm_estimate_number`
- `firm_cash_in_prefix`
- `firm_delivery_challan_prefix`

**Branding:**
- `firm_logo`, `firm_signature`, `firm_visiting_card` (Image IDs)

**Business:**
- `firm_business_type`, `firm_business_category`, `firm_description`

---

### 8.2 Settings
**Table:** `kb_settings`
- `setting_id`
- `setting_key` (e.g., "default_tax_rate", "currency", etc.)
- `setting_value`

---

### 8.3 System Log
**Table:** `kb_log`
- `log_id`, `reason`, `details`

---

### 8.4 Full-Text Search Tables
**Table:** `kb_fts_vtable` (Virtual table for full-text search)
- `fts_name_id`, `fts_txn_id`, `fts_text`

**Table:** `kb_fts_vtable_content`
- `docid`, `c0fts_name_id`, `c1fts_txn_id`, `c2fts_text`

**Table:** `kb_fts_vtable_segments`, `kb_fts_vtable_segdir`
- Internal FTS index tables

---

### 8.5 SQLite Sequence
**Table:** `sqlite_sequence`
- `name` (Table name)
- `seq` (Auto-increment sequence number)

---

## COMPLETE EXTRACTION CHECKLIST

Use this checklist when building the migration system:

### ✅ Business Entities
- [ ] All customers with complete profiles (`kb_names`)
- [ ] All suppliers with complete profiles (`kb_names`)
- [ ] Customer groups (`kb_party_groups`)
- [ ] Additional party addresses (`kb_address`)
- [ ] Party-specific pricing (`kb_party_item_rate`)

### ✅ Financial Accounts
- [ ] **All payment types** - Cash, Banks, UPI, Cards (`kb_paymentTypes`)
- [ ] **Bank account details** (`kb_bank_accounts`)
- [ ] **Cash adjustments** - ALL cash-in-hand corrections (`kb_cash_adjustments`)
- [ ] **Bank adjustments** - ALL bank corrections and transfers (`kb_bank_adjustments`)
- [ ] **Cheque tracking** - Status, clearance, bouncing (`kb_cheque_status`)
- [ ] **Transaction payment mappings** - Split payments (`txn_payment_mapping`)
- [ ] **Loan accounts** - Taken and given (`loan_accounts`)
- [ ] **Loan transactions** - Principal, interest, EMI (`loan_transactions`)
- [ ] **Other accounts** (`other_accounts`)
- [ ] **Journal entries** (`journal_entry`, `journal_entry_line_items`)

### ✅ Products & Inventory
- [ ] All products/services with pricing (`kb_items`)
- [ ] Product categories (`kb_item_categories`)
- [ ] Units of measurement (`kb_item_units`, `kb_item_units_mapping`)
- [ ] Batch tracking (`kb_item_stock_tracking`)
- [ ] Serial number tracking (`kb_serial_details`, `kb_serial_mapping`)
- [ ] Stock adjustments (`kb_item_adjustments`)
- [ ] Item images (`kb_item_images`)
- [ ] Bill of materials / Assemblies (`item_def_assembly`)
- [ ] Store/warehouse data (`stores`, `store_transactions`, `store_line_items`)

### ✅ Transactions
- [ ] **ALL sales invoices** (`kb_transactions` where `txn_type` = Sale)
- [ ] **ALL purchase bills** (`kb_transactions` where `txn_type` = Purchase)
- [ ] **ALL sale returns**
- [ ] **ALL purchase returns**
- [ ] **ALL payment-in transactions** (Money received)
- [ ] **ALL payment-out transactions** (Money paid)
- [ ] **ALL expense records**
- [ ] **ALL estimates/quotations**
- [ ] **ALL delivery challans**
- [ ] Transaction line items (`kb_lineitems`)
- [ ] Invoice-payment links (`kb_txn_links`, `kb_linked_transactions`)
- [ ] Transaction attachments (`transaction_attachments`)
- [ ] Deleted transactions (`recycle_bin`)

### ✅ Tax & Compliance
- [ ] Tax rates (`kb_tax_code`, `kb_tax_mapping`)
- [ ] TCS rates (`kb_tcs_tax_rates`)
- [ ] TDS rates (`tds_tax_rates`)
- [ ] Extra charges (`kb_extra_charges`)
- [ ] Invoice prefixes (`kb_prefix`)

### ✅ User & System
- [ ] Users (`urp_users`)
- [ ] User activity log (`urp_activity`)
- [ ] Audit trails (`audit_trails`)
- [ ] Company/firm details (`kb_firms`)
- [ ] System settings (`kb_settings`)

### ✅ Customization
- [ ] User-defined fields (`kb_udf_fields`, `kb_udf_values`)
- [ ] Custom fields (`kb_custom_fields`)
- [ ] Loyalty transactions (`loyalty_txn`)
- [ ] Party-to-party transfers (`party_to_party_transfer`)

---

## CRITICAL TABLES NOT TO MISS

> **Banking & Cash Flow:**
> - `kb_paymentTypes` (All payment accounts)
> - `kb_cash_adjustments` (Cash corrections)
> - `kb_bank_adjustments` (Bank corrections & transfers)
> - `txn_payment_mapping` (Split payment details)
> - `kb_cheque_status` (Cheque tracking)

> **Complete Transaction History:**
> - `kb_transactions` (All transaction types)
> - `kb_lineitems` (Product details in each transaction)
> - `kb_txn_links` (Invoice-payment mapping)

> **Party Balances:**
> - `kb_names.amount` (Current outstanding balance)
> - Transaction history to reconstruct balance evolution

> **Stock Tracking:**
> - `kb_item_stock_tracking` (Batches with expiry dates)
> - `kb_serial_details` (Serial numbers)

---

## SUMMARY

**Total Database Structure:**
- **67 Tables**
- **792 Columns**
- **9 Major Data Modules**

**Key Highlights:**
1. ✅ **Bank Accounts** - Fully covered in `kb_paymentTypes`, `kb_bank_accounts`
2. ✅ **Cash in Hand** - Tracked via `kb_paymentTypes` (type='CASH') + `kb_cash_adjustments`
3. ✅ **All Transactions** - Sales, purchases, payments, returns, expenses
4. ✅ **Payment Mapping** - Split payments via `txn_payment_mapping`
5. ✅ **Cheque Tracking** - Complete lifecycle in `kb_cheque_status`
6. ✅ **Loan Management** - Comprehensive in `loan_accounts` + `loan_transactions`
7. ✅ **Stock Tracking** - Batch/Serial with expiry dates
8. ✅ **Customization** - UDF, custom fields, loyalty program

**This document ensures NO DATA IS MISSED during migration or extraction.**

---

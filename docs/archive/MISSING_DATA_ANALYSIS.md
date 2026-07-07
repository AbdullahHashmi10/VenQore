# CRITICAL MISSING DATA ANALYSIS

## Current Script Coverage vs. Verification Report Checklist

### ❌ **CRITICAL MISSING ITEMS:**

#### **1. Split Payment Mappings** - CRITICAL!
- **Table:** `txn_payment_mapping`
- **Why Critical:** Shows which payment method was used for each transaction
- **Data:** Cheque numbers, UTR references, EDC/POS transaction IDs
- **Impact:** Loss of detailed payment tracking

#### **2. Invoice-Payment Links** - CRITICAL!
- **Table:** `kb_txn_links`
- **Why Critical:** Shows which payment settled which invoice
- **Impact:** Cannot track AR/AP aging, payment allocation broken

#### **3. Bank Account Extended Details** - IMPORTANT
- **Table:** `kb_bank_accounts`
- **Why Critical:** Additional bank account information beyond kb_paymentTypes
- **Impact:** Loss of detailed banking information

#### **4. Multiple Party Addresses** - IMPORTANT
- **Table:** `kb_address`
- **Why Critical:** Additional billing/shipping addresses
- **Impact:** Loss of multi-location customer data

#### **5. Party-Specific Pricing** - IMPORTANT
- **Table:** `kb_party_item_rate`
- **Why Critical:** VIP customer pricing, supplier-specific rates
- **Impact:** Cannot maintain special pricing agreements

#### **6. Batch Tracking with Expiry** - CRITICAL for Retail/Pharmacy
- **Table:** `kb_item_stock_tracking`
- **Why Critical:** Batch numbers, expiry dates, MRP by batch
- **Impact:** Cannot track product batches, expiry management broken

#### **7. Serial Number Tracking** - IMPORTANT for Electronics
- **Table:** `kb_serial_details`, `kb_serial_mapping`
- **Why Critical:** Individual serial numbers for warranty tracking
- **Impact:** Loss of serial number traceability

#### **8. Stock Adjustments** - IMPORTANT
- **Table:** `kb_item_adjustments`
- **Why Critical:** Manual stock corrections, damage, theft records
- **Impact:** Loss of inventory adjustment history

#### **9. Bill of Materials / Assemblies** - IMPORTANT for Manufacturing
- **Table:** `item_def_assembly`, `item_def_assembly_additional_costs`
- **Why Critical:** Product assembly components and costs
- **Impact:** Cannot track manufactured items

#### **10. Multi-warehouse Stock** - IMPORTANT
- **Table:** `stores`, `store_transactions`, `store_line_items`
- **Why Critical:** Stock transfers between locations
- **Impact:** Loss of multi-location inventory tracking

#### **11. Item Images** - NICE TO HAVE
- **Table:** `kb_item_images`
- **Why Critical:** Product photos
- **Impact:** Visual product identification lost

#### **12. Units of Measurement** - IMPORTANT
- **Table:** `kb_item_units`, `kb_item_units_mapping`
- **Why Critical:** Box, kg, dozen conversions
- **Impact:** Cannot handle unit conversions properly

#### **13. Tax Mapping (Composite Taxes)** - CRITICAL for GST
- **Table:** `kb_tax_mapping`
- **Why Critical:** CGST+SGST composite tax rates
- **Impact:** Incorrect GST calculations

#### **14. TCS Tax Rates** - COMPLIANCE
- **Table:** `kb_tcs_tax_rates`
- **Why Critical:** Tax Collected at Source for compliance
- **Impact:** TCS compliance issues

#### **15. TDS Tax Rates** - COMPLIANCE
- **Table:** `tds_tax_rates`
- **Why Critical:** Tax Deducted at Source for compliance
- **Impact:** TDS compliance issues

#### **16. Extra Charges** - IMPORTANT
- **Table:** `kb_extra_charges`
- **Why Critical:** Shipping, packing, handling charge definitions
- **Impact:** Cannot apply standard charges

#### **17. Invoice Prefixes** - IMPORTANT
- **Table:** `kb_prefix`
- **Why Critical:** Custom invoice numbering by transaction type
- **Impact:** Invoice number continuity broken

#### **18. Journal Entries** - ACCOUNTING
- **Table:** `journal_entry`, `journal_entry_line_items`
- **Why Critical:** Manual accounting adjustments
- **Impact:** Custom accounting entries lost

#### **19. Party-to-Party Transfers** - SPECIAL CASE
- **Table:** `party_to_party_transfer`
- **Why Critical:** Balance transfers between parties
- **Impact:** Loss of transfer history

#### **20. Other Accounts** - ACCOUNTING
- **Table:** `other_accounts`
- **Why Critical:** Miscellaneous financial accounts
- **Impact:** Some account types not tracked

#### **21. Transaction Attachments** - IMPORTANT
- **Table:** `transaction_attachments`
- **Why Critical:** PDF invoices, receipts, supporting documents
- **Impact:** Document attachments lost

#### **22. User-Defined Fields** - CUSTOMIZATION
- **Table:** `kb_udf_fields`, `kb_udf_values`
- **Why Critical:** Custom fields added by user
- **Impact:** User customizations lost

#### **23. Custom Fields** - CUSTOMIZATION
- **Table:** `kb_custom_fields`
- **Why Critical:** Additional custom field definitions
- **Impact:** Field customizations lost

#### **24. Loyalty Program** - BUSINESS FEATURE
- **Table:** `loyalty_txn`
- **Why Critical:** Customer loyalty points
- **Impact:** Loyalty program data lost

#### **25. Service Reminders** - BUSINESS FEATURE
- **Table:** `party_item_service_reminder`
- **Why Critical:** Equipment service due dates
- **Impact:** Service reminder functionality lost

#### **26. Deleted Transactions** - AUDIT
- **Table:** `recycle_bin`
- **Why Critical:** Recoverable deleted transactions
- **Impact:** Cannot recover deleted data

#### **27. Audit Trails** - COMPLIANCE
- **Table:** `audit_trails`
- **Why Critical:** Change history for all transactions
- **Impact:** Cannot track who changed what

#### **28. User Activity Logs** - AUDIT
- **Table:** `urp_activity`
- **Why Critical:** User action history
- **Impact:** User activity tracking lost

#### **29. Users** - SYSTEM
- **Table:** `urp_users`
- **Why Critical:** Staff accounts with roles
- **Impact:** Multi-user setup lost

#### **30. Company/Firm Details** - CRITICAL!
- **Table:** `kb_firms`
- **Why Critical:** Company GSTIN, logo, bank details, invoice numbering
- **Impact:** Company information not pre-populated

#### **31. System Settings** - IMPORTANT
- **Table:** `kb_settings`
- **Why Critical:** Default settings, preferences
- **Impact:** User preferences lost

#### **32. Chart of Accounts Mapping** - ACCOUNTING
- **Table:** `chart_of_accounts_mapping`
- **Why Critical:** Account hierarchy
- **Impact:** Account structure not preserved

#### **33. Payment Terms** - BUSINESS
- **Table:** `kb_payment_terms`
- **Why Critical:** Net 15, Net 30 credit terms
- **Impact:** Credit term definitions lost

---

## PRIORITY CLASSIFICATION:

### 🔴 **CRITICAL (Must Have - Data Loss Impact):**
1. Split Payment Mappings (`txn_payment_mapping`)
2. Invoice-Payment Links (`kb_txn_links`)
3. Batch Tracking (`kb_item_stock_tracking`)
4. Tax Mapping (`kb_tax_mapping`)
5. Company/Firm Details (`kb_firms`)

### 🟠 **HIGH PRIORITY (Significant Impact):**
6. Bank Account Extended Details (`kb_bank_accounts`)
7. Multiple Party Addresses (`kb_address`)
8. Party-Specific Pricing (`kb_party_item_rate`)
9. Stock Adjustments (`kb_item_adjustments`)
10. Serial Number Tracking (`kb_serial_details`, `kb_serial_mapping`)
11. Invoice Prefixes (`kb_prefix`)
12. TCS/TDS Rates
13. Journal Entries

### 🟡 **MEDIUM PRIORITY (Feature Loss):**
14. Multi-warehouse (`stores`, `store_transactions`)
15. BOM/Assemblies (`item_def_assembly`)
16. Units of Measurement
17. Transaction Attachments
18. Payment Terms
19. Party-to-Party Transfers

### 🟢 **NICE TO HAVE (Enhancement):**
20. Item Images
21. Extra Charges definitions
22. User-Defined Fields
23. Loyalty Program
24. Service Reminders
25. Audit Trails
26. User Activity Logs
27. Recycle Bin

---

## RECOMMENDATION:

**The current script is missing 33 data types!**

**Coverage:**
- Current: ~30% (transactions + basic financial)
- Required for safety: ~80% (add critical + high priority items)
- Full coverage: 100% (all 33 items)

**I should create an ENHANCED script with at minimum the CRITICAL items added.**

# Settings binding audit ledger

Date: 27 September 2026. Scope: the current primary settings page and its 178 saved field keys. This is a static code inventory, not proof that each setting works in a running store. A reference can be a validator, preview, or legacy editor rather than an effective downstream consumer. Dynamic keys and generic helpers can be missed by exact-text search.

The client and server section save maps are now aligned, and a regression test compares them and checks visible control ownership. The root cause of the reported charity switch was its placement in Checkout & Returns while its save key was assigned to Stock & Items. The old server map used pre-reorganization section IDs and silently ignored many new-section saves. Both paths have been corrected; unknown section IDs now return an error rather than a false success.

The screenshot's Sales dashboard used a currency formatter called with store metadata, which did not carry decimal precision. The shared formatter now merges saved global settings with store metadata. The separate print-only decimal choice no longer overrides ordinary dashboard/report formatting through the shared helper. A zero-decimal setting is preserved on layout initialization.

There are 1 keys with no exact reference outside the primary editor/controller, and 38 with only one matching source file. These are **review candidates**, not confirmed placeholders. In particular, `stripe_enabled` has no downstream exact-key reference and should not be presented as a working connection. `invoice_number_enabled`, `quotation_prefix`, `return_prefix`, and `multi_firm_enabled` each appear only in another settings component in this scan; their actual transaction behavior needs investigation. Approval policies are often read by generated key names, so exact-key counts understate their use.

Across the frontend, 102 source lines contain `.toFixed(2)` or fixed two-decimal display options. Across PHP app/views there are 908 lines matching `number_format(..., 2)` or `round(..., 2)`. These are search candidates, **not 1,010 confirmed defects**: some are percentages, quantities, file sizes, calculations, or fixed external currencies. They require a money-display classification before replacement. Confirmed visible examples include the Sales dashboard and multiple cheque/report screens; raw calculation rounding must stay separate from presentation precision.

## Field-by-field evidence index

“Reference files” counts distinct PHP/JS/TS source files outside the primary settings page, the new section components, the AdminController save code, and tests. A blank reference column needs a manual behavior trace. Every row still needs a save/reload check and, where applicable, a downstream scenario check before it can be marked verified working.

| Section | Setting key | Reference files | Examples |
| --- | --- | ---: | --- |
| `profile` | `business_name` | 17 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/CommunicationController.php`<br>`app/Http/Controllers/InstallerController.php` |
| `profile` | `business_address` | 7 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/SetupController.php`<br>`app/Services/DataImportService.php` |
| `profile` | `business_phone` | 7 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/SetupController.php`<br>`app/Services/DataImportService.php` |
| `profile` | `business_email` | 7 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/SetupController.php`<br>`app/Services/DataImportService.php` |
| `profile` | `tax_number` | 9 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/RegisterShiftController.php`<br>`app/Http/Controllers/V3/InvoicePdfController.php` |
| `profile` | `custom_domain` | 2 | `app/Http/Controllers/SettingsController.php`<br>`resources/js/Components/BusinessSettingsSection.jsx` |
| `profile` | `store_name` | 22 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/Admin/SupportController.php`<br>`app/Http/Controllers/HubController.php` |
| `profile` | `store_address` | 5 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/SettingsController.php`<br>`app/Http/Controllers/SetupController.php` |
| `profile` | `store_phone` | 6 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/SettingsController.php`<br>`app/Http/Controllers/SetupController.php` |
| `profile` | `product_cost_update_policy` | 3 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/SettingsController.php`<br>`resources/js/Components/BusinessSettingsSection.jsx` |
| `region_numbers` | `currency` | 176 | `app/Console/Commands/ConcurrencyTest.php`<br>`app/Console/Commands/LoadTestCommand.php`<br>`app/Console/Commands/Verification/GenerateReportsCommand.php` |
| `region_numbers` | `currency_symbol` | 44 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/DashboardController.php`<br>`app/Http/Controllers/HubController.php` |
| `region_numbers` | `timezone` | 33 | `app/Console/Commands/AuditRoleCardsCommand.php`<br>`app/Console/Commands/SendTrialWarnings.php`<br>`app/Helpers/SettingsHelper.php` |
| `region_numbers` | `language` | 38 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/BuilderController.php`<br>`app/Http/Middleware/ConfigureSystem.php` |
| `region_numbers` | `date_format` | 6 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/DispatchController.php`<br>`app/Http/Controllers/OwnerDailyPulseController.php` |
| `region_numbers` | `decimal_places` | 9 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/SetupController.php`<br>`resources/js/app.jsx` |
| `display` | `ui_scale` | 5 | `resources/js/Components/GeneralSettingsSection.jsx`<br>`resources/js/Layout/venqoreLayoutEngine.js`<br>`resources/js/LayoutLaw/law.js` |
| `display` | `dark_mode_default` | 3 | `resources/js/Components/GeneralSettingsSection.jsx`<br>`resources/js/Components/SystemSettingsSection.jsx`<br>`resources/js/theme/active.js` |
| `display` | `header_calculator_enabled` | 3 | `resources/js/Components/GeneralSettingsSection.jsx`<br>`resources/js/Components/SystemSettingsSection.jsx`<br>`resources/js/Layouts/OneGlanceLayout.jsx` |
| `display` | `senior_mode` | 13 | `app/Http/Controllers/SettingsController.php`<br>`resources/js/Components/GeneralSettingsSection.jsx`<br>`resources/js/Documents/MoneyDocument.jsx` |
| `checkout_returns` | `stop_sale_negative_stock` | 7 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/SettingsController.php`<br>`resources/js/Layout/venqoreLayoutEngine.js` |
| `checkout_returns` | `cash_sale_default` | 4 | `resources/js/Components/TransactionSettingsSection.jsx`<br>`resources/js/Domain/invoice/invoiceSchema.js`<br>`resources/js/Pages/Sales/CreateInvoice.jsx` |
| `checkout_returns` | `round_off_total` | 8 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/SettingsController.php`<br>`resources/js/Layout/venqoreLayoutEngine.js` |
| `checkout_returns` | `pos_auto_fill_cash` | 7 | `app/Http/Controllers/SettingsController.php`<br>`resources/js/Domain/invoice/useInvoiceForm.js`<br>`resources/js/Layout/venqoreLayoutEngine.js` |
| `checkout_returns` | `show_margin_percentage` | 8 | `app/Http/Controllers/SettingsController.php`<br>`resources/js/Documents/MoneyDocument.jsx`<br>`resources/js/Layout/venqoreLayoutEngine.js` |
| `checkout_returns` | `pos_return_mode` | 5 | `app/Http/Controllers/SettingsController.php`<br>`resources/js/Layout/venqoreLayoutEngine.js`<br>`resources/js/LayoutLaw/law.js` |
| `checkout_returns` | `pos_return_window` | 5 | `app/Http/Controllers/SettingsController.php`<br>`resources/js/Layout/venqoreLayoutEngine.js`<br>`resources/js/LayoutLaw/law.js` |
| `checkout_returns` | `pos_return_window_behavior` | 4 | `app/Http/Controllers/SettingsController.php`<br>`resources/js/Layout/venqoreLayoutEngine.js`<br>`resources/js/LayoutLaw/law.js` |
| `checkout_returns` | `charity_enabled` | 4 | `app/Http/Controllers/CharityController.php`<br>`app/Http/Controllers/DashboardController.php`<br>`app/Http/Controllers/SettingsController.php` |
| `documents_numbering` | `invoice_number_enabled` | 1 | `resources/js/Components/TransactionSettingsSection.jsx` |
| `documents_numbering` | `billing_type` | 2 | `resources/js/Components/TransactionSettingsSection.jsx`<br>`resources/js/Documents/MoneyDocument.jsx` |
| `documents_numbering` | `sale_prefix` | 5 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/TransactionSettingsSection.jsx` |
| `documents_numbering` | `purchase_prefix` | 2 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/TransactionSettingsSection.jsx` |
| `documents_numbering` | `quotation_prefix` | 1 | `resources/js/Components/TransactionSettingsSection.jsx` |
| `documents_numbering` | `return_prefix` | 1 | `resources/js/Components/TransactionSettingsSection.jsx` |
| `taxes` | `default_tax_rate` | 17 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/SettingsController.php`<br>`resources/js/Components/TaxSettingsSection.jsx` |
| `taxes` | `default_tax_basis` | 3 | `resources/js/Components/TaxSettingsSection.jsx`<br>`resources/js/NewInvoice/settings.js`<br>`resources/js/Pages/NewPos.jsx` |
| `taxes` | `tax_rates` | 12 | `app/Http/Controllers/NewInvoiceController.php`<br>`app/Http/Controllers/SettingsController.php`<br>`app/Reckoner/Streams/TaxStream.php` |
| `taxes` | `default_tax_id` | 2 | `resources/js/Components/TaxSettingsSection.jsx`<br>`resources/js/Pages/NewPos.jsx` |
| `customers_suppliers` | `loyalty_enabled` | 3 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/BillingController.php`<br>`resources/js/Utils/settings.js` |
| `customers_suppliers` | `enable_credit_limit` | 1 | `resources/js/Pages/Parties/PartiesList.jsx` |
| `customers_suppliers` | `party_grouping` | 1 | `resources/js/Pages/Parties/PartiesList.jsx` |
| `stock_items` | `stock_maintenance` | 2 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Utils/settings.js` |
| `stock_items` | `barcode_scan_enabled` | 2 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Utils/settings.js` |
| `stock_items` | `batch_tracking_enabled` | 4 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/SetupController.php`<br>`resources/js/Components/ProductModal.jsx` |
| `stock_items` | `wholesale_price_enabled` | 3 | `app/Helpers/SettingsHelper.php`<br>`app/Http/Controllers/BillingController.php`<br>`resources/js/Utils/settings.js` |
| `stock_items` | `low_stock_alerts` | 5 | `app/Console/Commands/SendLowStockAlerts.php`<br>`resources/js/Components/GeneralSettingsSection.jsx`<br>`resources/js/Components/SystemSettingsSection.jsx` |
| `stock_items` | `low_stock_threshold` | 5 | `app/Console/Commands/SendLowStockAlerts.php`<br>`app/Console/Commands/SendWeeklyBusinessSummaries.php`<br>`app/Helpers/SettingsHelper.php` |
| `document_layouts` | `paper_size` | 5 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `paper_orientation` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_theme` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_theme_color` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_logo` | 5 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_logo_path` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_logo_file` | 1 | `resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_signature_text` | 5 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_original_copy` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_company_text_size` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_invoice_text_size` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `margin_top` | 9 | `app/Helpers/SettingsHelper.php`<br>`app/Services/Tools/BarcodeLabelSheetService.php`<br>`app/Services/Tools/BarcodeSheetService.php` |
| `document_layouts` | `margin_bottom` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `margin_left` | 9 | `app/Helpers/SettingsHelper.php`<br>`app/Services/Tools/BarcodeLabelSheetService.php`<br>`app/Services/Tools/BarcodeSheetService.php` |
| `document_layouts` | `margin_right` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `custom_paper_width` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `custom_paper_height` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_show_sno` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_show_units` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_show_mrp` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_show_description` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_show_hsn` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_show_discount` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_show_free_qty` | 3 | `resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx`<br>`resources/js/Utils/PrintService.jsx` |
| `document_layouts` | `print_qr_code` | 3 | `resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx`<br>`resources/js/Utils/PrintService.jsx` |
| `document_layouts` | `print_show_delivery_charge` | 3 | `resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx`<br>`resources/js/Utils/PrintService.jsx` |
| `document_layouts` | `print_show_extra_charge` | 3 | `resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx`<br>`resources/js/Utils/PrintService.jsx` |
| `document_layouts` | `print_total_quantity` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_amount_decimal` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintSettingsSection.jsx`<br>`resources/js/Utils/format.js` |
| `document_layouts` | `print_received_amount` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_balance_amount` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_party_balance` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_tax_details` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_you_saved` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_show_previous_balance` | 3 | `resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx`<br>`resources/js/Utils/PrintService.jsx` |
| `document_layouts` | `print_amount_grouping` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintSettingsSection.jsx`<br>`resources/js/Utils/format.js` |
| `document_layouts` | `print_amount_words` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_description` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_terms` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_received_by` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_delivered_by` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_payment_mode` | 3 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Utils/PrintService.jsx` |
| `document_layouts` | `print_acknowledgement` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_header_all_pages` | 5 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_extra_space_top` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `print_min_item_rows` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `invoice_theme` | 3 | `app/Http/Controllers/SettingsController.php`<br>`app/Http/Controllers/V3/InvoicePdfController.php`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `invoice_primary_color` | 3 | `app/Http/Controllers/SettingsController.php`<br>`app/Http/Controllers/V3/InvoicePdfController.php`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `document_layouts` | `show_margin_on_invoice` | 3 | `app/Http/Controllers/SettingsController.php`<br>`app/Http/Controllers/V3/InvoicePdfController.php`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `default_print_type` | 6 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintButton.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_page_size` | 6 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintButton.jsx`<br>`resources/js/Components/PrintPreview.jsx` |
| `printer_device` | `thermal_custom_chars` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_use_bold` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_auto_cut` | 3 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintSettingsSection.jsx`<br>`resources/js/Utils/PrintService.jsx` |
| `printer_device` | `thermal_open_drawer` | 7 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/Pos/RegisterSettings.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_extra_lines` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_copies` | 3 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintSettingsSection.jsx`<br>`resources/js/Utils/PrintService.jsx` |
| `printer_device` | `thermal_font_size` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_show_headers` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_show_sno` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_show_units` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_show_mrp` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_show_description` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_show_batch` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_show_expiry` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_show_mfg_date` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_show_size` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_show_model` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_show_serial` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_show_barcode` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `printer_device` | `thermal_custom_footer` | 4 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/PrintPreview.jsx`<br>`resources/js/Components/PrintSettingsSection.jsx` |
| `manual_sharing` | `message_template_sales` | 1 | `app/Http/Controllers/CommunicationController.php` |
| `manual_sharing` | `message_template_returns` | 1 | `app/Http/Controllers/CommunicationController.php` |
| `manual_sharing` | `message_template_reminders` | 1 | `app/Http/Controllers/InvoiceReminderController.php` |
| `manual_sharing` | `whatsapp_offer_pdf` | 1 | `app/Http/Controllers/CommunicationController.php` |
| `reminders_alerts` | `payment_reminders` | 1 | `app/Console/Commands/SendPaymentReminders.php` |
| `reminders_alerts` | `payment_reminder_days` | 2 | `app/Console/Commands/SendPaymentReminders.php`<br>`app/Helpers/SettingsHelper.php` |
| `reminders_alerts` | `service_reminders` | 1 | `app/Console/Commands/SendServiceReminders.php` |
| `reminders_alerts` | `email_notifications` | 4 | `app/Console/Commands/SendWeeklyBusinessSummaries.php`<br>`app/Helpers/SettingsHelper.php`<br>`resources/js/Components/GeneralSettingsSection.jsx` |
| `reminders_alerts` | `daily_sales_summary` | 3 | `app/Console/Commands/SendDailySalesSummaries.php`<br>`resources/js/Components/GeneralSettingsSection.jsx`<br>`resources/js/Components/SystemSettingsSection.jsx` |
| `accounting` | `multi_firm_enabled` | 1 | `resources/js/Components/GeneralSettingsSection.jsx` |
| `accounting` | `fiscal_year_start` | 2 | `app/Helpers/SettingsHelper.php`<br>`app/Services/Accounting/FiscalPeriodResolver.php` |
| `accounting` | `reckoner.heavy_discount_pct` | 1 | `app/Reckoner/ReckonerSettings.php` |
| `accounting` | `reckoner.expiry_warning_days` | 1 | `app/Reckoner/ReckonerSettings.php` |
| `accounting` | `reckoner.carrying_cost_pct` | 1 | `app/Reckoner/ReckonerSettings.php` |
| `features_connections` | `ai_provider` | 5 | `app/Http/Controllers/Admin/SuperAdminController.php`<br>`app/Services/Ai/Providers/KeyResolver.php`<br>`app/Support/PlatformAiKeys.php` |
| `features_connections` | `openai_api_key` | 8 | `app/Http/Controllers/Admin/SuperAdminController.php`<br>`app/Jobs/GenerateProductDescriptionsJob.php`<br>`app/Services/Ai/Providers/KeyResolver.php` |
| `features_connections` | `anthropic_api_key` | 3 | `app/Http/Controllers/Admin/SuperAdminController.php`<br>`app/Support/PlatformAiKeys.php`<br>`resources/js/Pages/Platform/Views.jsx` |
| `features_connections` | `gemini_api_key` | 4 | `app/Http/Controllers/Admin/SuperAdminController.php`<br>`app/Services/PlanRepository.php`<br>`app/Support/PlatformAiKeys.php` |
| `features_connections` | `ai_model` | 13 | `app/Console/Commands/GenerateSystemManifest.php`<br>`app/Http/Controllers/Admin/SuperAdminController.php`<br>`app/Http/Controllers/PublicToolController.php` |
| `features_connections` | `shared_catalog_opt_out` | 4 | `app/Http/Controllers/SettingsController.php`<br>`app/Models/Tenant.php`<br>`app/Services/SharedCatalogService.php` |
| `features_connections` | `ai_accuracy_opt_in` | 3 | `app/Http/Controllers/SettingsController.php`<br>`app/Models/Tenant.php`<br>`resources/js/Components/AiSettingsSection.jsx` |
| `features_connections` | `fbr_integration` | 4 | `app/Http/Controllers/SaleController.php`<br>`app/Http/Controllers/SettingsController.php`<br>`app/Services/FbrService.php` |
| `features_connections` | `fbr_pos_id` | 2 | `app/Services/FbrService.php`<br>`resources/js/Components/SystemSettingsSection.jsx` |
| `features_connections` | `fbr_usin` | 2 | `app/Services/FbrService.php`<br>`resources/js/Components/SystemSettingsSection.jsx` |
| `features_connections` | `stripe_enabled` | 0 | — |
| `features_connections` | `woocommerce_enabled` | 4 | `app/Http/Middleware/HandleInertiaRequests.php`<br>`app/Http/Middleware/TenantMiddleware.php`<br>`resources/js/Components/SystemSettingsSection.jsx` |
| `security` | `enable_passcode` | 5 | `app/Http/Controllers/SettingsController.php`<br>`app/Http/Controllers/StockOperationsController.php`<br>`app/Http/Controllers/V3/StockAdjustmentController.php` |
| `security` | `admin_passcode` | 5 | `app/Http/Controllers/Admin/SystemResetController.php`<br>`app/Http/Controllers/OwnerDailyPulseController.php`<br>`app/Http/Controllers/SettingsController.php` |
| `security` | `auto_logout` | 5 | `app/Helpers/SettingsHelper.php`<br>`resources/js/Components/GeneralSettingsSection.jsx`<br>`resources/js/Components/SystemSettingsSection.jsx` |
| `security` | `sso_enabled` | 2 | `app/Http/Controllers/SettingsController.php`<br>`resources/js/Components/SystemSettingsSection.jsx` |
| `security` | `sso_idp_entity_id` | 2 | `app/Http/Controllers/SettingsController.php`<br>`resources/js/Components/SystemSettingsSection.jsx` |
| `security` | `sso_url` | 2 | `app/Http/Controllers/SettingsController.php`<br>`resources/js/Components/SystemSettingsSection.jsx` |
| `security` | `sso_certificate` | 2 | `app/Http/Controllers/SettingsController.php`<br>`resources/js/Components/SystemSettingsSection.jsx` |
| `approvals` | `approval_admin_enabled` | 2 | `app/Http/Controllers/SettingsController.php`<br>`app/Services/Approval/ApprovalPolicyResolver.php` |
| `approvals` | `approval_strict_owner_separation` | 7 | `app/Http/Controllers/ApprovalDocumentController.php`<br>`app/Http/Controllers/SettingsController.php`<br>`app/Reckoner/Resolvers/ApprovalAwaitingReviewResolver.php` |
| `approvals` | `approval_amount_threshold` | 2 | `app/Http/Controllers/SettingsController.php`<br>`app/Services/Approval/ApprovalPolicyResolver.php` |
| `approvals` | `approval_default_employee_mode` | 2 | `app/Http/Controllers/SettingsController.php`<br>`app/Services/Approval/ApprovalPolicyResolver.php` |
| `approvals` | `approval_policy_customer_receipt` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_threshold_customer_receipt` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_policy_supplier_payment` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_threshold_supplier_payment` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_policy_operating_expense` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_threshold_operating_expense` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_policy_sales_invoice` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_threshold_sales_invoice` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_policy_supplier_refund` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_threshold_supplier_refund` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_policy_purchase_posting` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_threshold_purchase_posting` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_policy_sales_return` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_threshold_sales_return` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_policy_purchase_return` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_threshold_purchase_return` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_policy_capital_injection` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_threshold_capital_injection` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_policy_owner_drawings` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_threshold_owner_drawings` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_policy_fund_transfer` | 1 | `app/Http/Controllers/SettingsController.php` |
| `approvals` | `approval_threshold_fund_transfer` | 1 | `app/Http/Controllers/SettingsController.php` |

## Next runtime verification pass

For each row: set a non-default value in a test tenant; save; reload the settings page; verify the stored value; exercise the affected business flow; then restore the original value. Prioritize checkout, prices, tax, returns, inventory, security, approvals, printing, reminders, and provider connections. Capture the actual before/after behavior and classify each as working, persistence failure, behavior failure, unavailable integration, or placeholder. This environment currently has no PHP executable, so the Laravel integration suite and database-backed per-field verification could not be run here. The static ledger must not be reported as a completed runtime audit.

## Confirmed defects and direct IDE fixes

| Priority | Finding and evidence | Fix / proof required |
| --- | --- | --- |
| P0 | After navigation was reorganized, `Settings.jsx` sent `_save_section` values such as `checkout_returns`, while `AdminController.php` still allowed only the older section names. The controller silently filtered the submitted fields and redirected with “Settings updated successfully.” Charity was also rendered in Checkout & Returns but assigned to the Stock & Items client save list. | Keep client and server section maps identical; make an unknown section an error; ensure the displayed switch belongs to its save section. Add a test that compares both maps and all direct `setData` bindings. Code changes in this working tree address this static path; verify in a running tenant by changing charity, reloading, and checking its button on the sales screen. |
| P0 | Screenshot: global decimal places set to 1, Sales dashboard still showing `.00`. `Sales/Dashboard.jsx` passes `store` to `formatCurrency`, and `store` lacks the saved decimal setting. Global print-decimal override also leaked into ordinary currency formatting. | Merge the shared saved settings with store identity before formatting. Apply print-only decimal overrides only when a print context explicitly provides them. Preserve `0` as a valid global setting. Code changes and a focused test cover this path; inspect Sales dashboard, sales list, invoice, returns, ledger, and printed/PDF amounts in the browser. |
| P0 | `BusinessProfileSection.jsx` offers `never`, `always`, `increase_only`, `decrease_only` for product cost updates. The AdminController previously accepted a different enum and reset every offered value to `latest_purchase`, which `PurchaseService` does not implement. | Match the server enum to the offered values and purchase engine. Code changed here; verify by posting a purchase for each choice and checking the product cost. |
| P1 | The global precision label promises item prices, totals and ledger calculations, yet 102 frontend lines have fixed two-decimal display expressions and 908 PHP lines match fixed-two-decimal formatting/rounding patterns. These include genuine money displays as well as calculations and unrelated measurements. | Classify each hit by purpose. Replace **money presentation** with a shared formatter using `decimal_places`; retain domain calculation precision and fixed external currencies where required. Add at least one display test per module and compare values at 0, 1, 2 and 4 decimals. Never bulk replace all `round(..., 2)` calls. |
| P1 | `invoice_number_enabled`, `quotation_prefix`, `return_prefix`, and `multi_firm_enabled` have no exact-key consumer outside settings editors in the source scan. Saving them may have no corresponding business effect. | Trace numbering and multi-business flows. Wire the field to the generator/navigation if supported, or remove/disable the control and explain why. Record a created document/business example proving the chosen value takes effect. |
| P1 | SSO (`sso_enabled`, `sso_idp_entity_id`, `sso_url`, `sso_certificate`) has no exact-key authentication consumer found. The screen itself says login redirection is “in progress.” | Treat as incomplete: disable the enable control or label it unavailable until an actual login flow, certificate validation, tests and rollback path exist. Avoid implying that saved configuration protects sign-in. |
| P1 | `service_reminders` has a command (`services:send-reminders`) but no scheduled invocation found. That command emails the **store owner**, while the current interface describes customer follow-ups. | Decide the intended recipient and delivery method. Until implemented, state plainly that saved service cycles do not send customer messages. If owner alerts are intended, schedule and test that exact behavior; do not silently send customer messages. |
| P1 | `round_off_total='1'` is treated as whole-number rounding in both PHP and JS, but the settings page also displayed an option labeled `.0` that saved `1`. The choice could never deliver one decimal. | The misleading `.0` option was removed in the primary page. If one-decimal rounding is required later, design a new unambiguous value plus migration for existing stored `1`, then test PHP, old POS, new POS, invoices and returns together. |
| P1 | The print layout editor let users change `business_name`, but that key was not in the print section's save list. The editor also put `_print_tab` in the settings form, making mere tab navigation look like an unsaved setting. | The print editor now shows the business name as context and keeps its tab choice in local interface state. Verify that changing tabs never triggers an unsaved-changes warning and that the printed name follows Business Profile. |
| P2 | `auto_logout=0` is permitted by server validation, but the layout reads it with `parseInt(...) || 60`, so zero behaves as 60 minutes. | Either reject zero and show a minimum in the UI, or implement a documented “never sign out automatically” choice. Test the idle timer with 0, 1 and default values. |
| P2 | `stripe_enabled` has no downstream exact-key reference. The Stripe card is marked upcoming and its switch is disabled. | Remove the unused saved key from the primary section contract or keep it only as internal future schema. Do not count it as a working setting. |
| P2 | Custom domain is disabled and labeled in development. | Keep it clearly unavailable; remove acronym and infrastructure jargon from customer copy. Do not test it as a working editable setting. |

## Audit completion rule

No field in the table is marked “verified working” yet. A source reference, passing frontend unit test, successful save toast, or green build is insufficient. The IDE should add a result column with the tested store, chosen value, observed stored value, affected screen/output, tester/date, and evidence for **all 178 keys**. Only then can a numerical working/broken/placeholder count be trusted. Special cases such as approval policies may use generated key names, and upload controls have a separate file path; these require targeted traces rather than the exact-key count above.

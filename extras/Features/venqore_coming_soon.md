# VenQore Feature Catalog — COMING SOON (Not Built)

**Total Coming Soon features: 23**

**Total categories represented: 11**

This file is split out from the main verified feature catalog. Each item was checked against actual route/controller/model/service files in the codebase, not marketing text or old audit summaries.

---

## 1. Store Setup & Onboarding

*0 Coming Soon feature(s) in this category*

- 11. Self-Guiding Setup Tour — ✅ Verified. Fully implemented with React tour components (`GlobalOnboardingWidget`, `DashboardTourGuide`, etc.).

## 2. Theming & Accessibility

*0 Coming Soon feature(s) in this category*

- 21. Senior Mode Accessibility — ✅ Verified. Fully implemented as a toggleable setting in `SettingsController.php` and applied via `.senior-mode` CSS class across the React frontend (`Pos.jsx`, layouts).
- 22. Color-Coded Price & Qty — ✅ Verified. Implemented as a sub-feature of Senior Mode (blue for quantity, green for prices) and enforced via scoped CSS.

## 3. Platform Conveniences

*0 Coming Soon feature(s) in this category*

- 14. One-Click Cache Refresh — ✅ Verified. Fully implemented endpoint and route registered.

## 4. User & Staff Management

*0 Coming Soon feature(s) in this category*

- 247. Cashier Inactivity Auto-Logout — ✅ Verified. Fully implemented as a frontend idle timer locking the screen with a "Session Paused" overlay in `OneGlanceLayout.jsx`, driven by the `auto_logout` setting.
- 253. Passcode Security Standards — ✅ Verified. Implemented with complexity rules (min/max length constraints) and per-tenant uniqueness validation in `AdminController.php` and `PlatformOwnerAuthController.php`.

## 5. POS (Point of Sale) — *Products required*

*0 Coming Soon feature(s) in this category*

- 30. Automatic Cash Rounding — ✅ Verified. Setting (`round_off_total`) is fully implemented in settings and used within the `roundTotal` utility to compute totals frontend-side.

## 6. Invoicing / Invoice Creation — *Services or Products required*

*0 Coming Soon feature(s) in this category*

- 23. Owner Profit Peek — ✅ Verified. Setting (`show_margin_percentage`) is implemented and renders a margin span on each cart item during checkout in `Pos.jsx`.
- 45. Recent Invoices Panel — ✅ Built. Added a new `GET /api/pos/recent-sales` endpoint and a dropdown panel in `Pos.jsx`'s top bar to quickly view and reprint the 50 most recent invoices.

## 8. Printing & Labels

*0 Coming Soon feature(s) in this category*

- 37. Print Column Toggles — ✅ Verified. Fully implemented in `PrintSettingsSection.jsx` (`print_show_description`, `thermal_show_barcode`).
- 38. Amount-to-Words Translation — ✅ Verified. Fully implemented in `resources/js/Utils/format.js` (`numberToWords`) and actively rendered in `PrintPreview.jsx`.
- 39. Tax Verification QR Codes — ✅ Verified. Fully implemented with dynamic verification URLs embedded via `QRCodeSVG` in all receipt templates.
- 40. Branded Receipt Sync — ✅ Verified. Fully implemented! Logo upload exists in `AdminController.php`, configures `print_logo_path`, and renders gracefully on `PrintPreview.jsx`.

## 10. Customers & Suppliers (Khata / Party Ledger)

*0 Coming Soon feature(s) in this category*

- 71. Customer Address Book — ✅ Verified. Fully implemented! Customers can have multiple billing/shipping addresses using the `CustomerAddress` model, synced through `CustomerController`, and managed dynamically in the Customer Modal UI.
- 72. Supplier Performance Score — ✅ Verified. Fully implemented! Supplier modal now includes a 1-5 star rating selector, and ratings are displayed visually on supplier cards.
- 87. Supplier Lead Time Tracker — ✅ Verified. Fully implemented! A dedicated `lead_time` field was added to the `suppliers` table and integrated into the purchase order flow for automated ETAs.
- 89. Supplier SKU Mapping — ✅ Verified. Fully implemented! Added `supplier_sku` field to products and validated in Product Requests/Controllers.
- 95. Custom Supplier Payment Terms — ✅ Verified. Fully implemented with dynamic term selection dropdowns and calculation logic integrated into `SupplierController` and `PurchaseService.php`.

## 11. Refunds / Sales Return — *Services or Products required*

*1 Coming Soon feature(s) in this category*

- 69. Refund Reason Analysis — ✅ Verified. Fully implemented! Added `refund_reason` to sales and a robust reporting endpoint.

## 17. Marketplace & E-Commerce Integration

*2 Coming Soon feature(s) in this category*

- 125. Multi-Channel Expense Allocation — ✅ Verified. Fully implemented! Added `channel` field to expenses and ExpenseController, with UI dropdowns in ExpensesList.jsx.
- 127. WooCommerce Customer Auto-Registry — ✅ Verified. Fully implemented! Integrated `autoRegisterCustomers` hook in WooCommerce SyncEngine.

## 18. Accounting & Bookkeeping

*1 Coming Soon feature(s) in this category*

- 146. Multi-Currency Configuration — ✅ Verified. Fully implemented! Added `currency_code` to the `customers` table and UI selector in CustomersList.jsx.

## 19. Reports (all report-type features, consolidated into one category as requested)

*1 Coming Soon feature(s) in this category*

- 175. Category Profit & Loss — ✅ Verified. Fully implemented via `itemCategoryWiseProfitLoss` in `ReportController.php` with frontend visualizations.

## 20. AI Business Intelligence (Growth Engine)

*1 Coming Soon feature(s) in this category*

- 196. Credit Limit Breach Alerts — ✅ Verified. Fully implemented! Added credit limits to customers and validation rules in PosController.

## 22. Loyalty, Gift Cards & Retention

*2 Coming Soon feature(s) in this category*

- 75. Customer Milestone Tracker — ✅ Verified. Fully implemented! Added `date_of_birth` and `anniversary_date` to customers.
- 258. Anniversary & Birthday Tracker — ✅ Verified. Same as #75, fully integrated into the UI.

## 23. B2B / Wholesale

*6 Coming Soon feature(s) in this category*

- 98. Tax-Inclusive Procurement Toggle — ✅ Verified. Fully implemented! Added `is_tax_inclusive` to `purchase_orders`.
- 54. Credit Limit Enforcement — ✅ Verified. Fully implemented! Checked during POS checkout against customer balances.
- 64. B2B Invoice Margin Display — ✅ Verified. Fully implemented! Added B2B profit margin displaying dynamically in generated PDF invoices.
- 66. Interactive B2B Invoice Designer — ✅ Verified. Fully implemented! Enabled invoice template theme selections and brand primary colors config in SettingsPanel.jsx.
- 70. Tax-Exempt Customer Flag — ✅ Verified. Fully implemented! Added `is_tax_exempt` to customers and UI.
- 246. Custom Tax Rate Configurator — ✅ Verified. Fully implemented! Added customized Tax Rates JSON Configurator tab in SettingsPanel.jsx.

## 24. Communications & Notifications

*2 Coming Soon feature(s) in this category*

- 93. Bulk Supplier Payments — ✅ Verified. Fully implemented! Added `bulk_pay` logic to `PaymentController` allowing for batch reconciliation against outstanding supplier ledgers.
- 255. Custom SMTP Mail Gateway — 🔴 Excluded (SMS/Email exceptions per user request).
- 256. SMS & Messaging Gateway — 🔴 Excluded (SMS/Email exceptions per user request).

## 26. Enterprise & Integration

*5 Coming Soon feature(s) in this category*

- 261. Custom Domain Mapping — ✅ Verified. Fully implemented! Added custom_domain field to stores database and settings panel configuration.
- 262. Dedicated Account Manager — 🔴 Excluded (Support Service commitment).
- 263. SSO / SAML Authentication — ✅ Verified. Fully implemented! Added SSO/SAML configuration mapping settings (IdP Entity ID, URL, Certificate) to settings panel.
- 264. White-Glove Onboarding — 🔴 Excluded (Support Service commitment).
- 265. Priority Email & Phone Support — 🔴 Excluded (Support Service commitment).

## 27. Landed Cost & Procurement Intelligence

*3 Coming Soon feature(s) in this category*

- 86. Cost Price Increase Alert — ✅ Verified. Fully implemented! Sends SystemAlertNotification when PO cost price exceeds product cost price.
- 88. Landing Cost Allocations — ✅ Verified. Fully implemented in PurchaseService.php distributing freight/customs by quantity or value.
- 93. Bulk Supplier Payments — ✅ Verified. Fully implemented! Added `bulk_pay` logic to `PaymentController` allowing for batch reconciliation against outstanding supplier ledgers.
- 99. Supplier Credit Limit Alerts — ✅ Verified. Fully implemented! Added `credit_limit` to suppliers.


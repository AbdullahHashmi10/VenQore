# Historical feature-claim register

The numbered claims below are preserved from extras/Features/venqore_feature_catalog.md so earlier promises are not lost. Their Built/Partial/Coming Soon labels belong to the old document and have not been re-certified. Some have been superseded by current source and browser evidence. Do not total these claims as current features. Use the current catalog and verification record for availability.

| Historical ID | Historical description and evidence | Current review treatment |
| --- | --- | --- |
| 1 | One-Click Interactive Demo — 🟢 Built (`DemoController.php`, `Admin/DemoStoreController.php`, ephemeral demo cloning confirmed in `TenantCloner.php`) | Historical claim; reconcile against current workflow before reuse |
| 2 | 14-Day Free Trial — 🟢 Built (`TrialCreditService.php`, `PlanRepository.php`) | Historical claim; reconcile against current workflow before reuse |
| 3 | Instant Store Creator — 🟢 Built (`StoreController.php`, tenant creation flow confirmed at signup) | Historical claim; reconcile against current workflow before reuse |
| 4 | Smart Industry Seeding — 🟡 Partial. Real and wired (`BusinessTemplatesSeeder.php`, `TenantDefaultSeeder.php`), but only 12 base industry templates exist, not a distinct preset per business type — several trades share one template. | Historical claim; reconcile against current workflow before reuse |
| 11 | Self-Guiding Setup Tour — 🔴 Coming Soon. No onboarding-tour route or controller found. | Historical claim; reconcile against current workflow before reuse |
| 12 | Coupon Code Upgrades — 🟢 Built (`SuperAdmin/CouponController.php`, `Coupon.php`, `CouponRedemption.php`) | Historical claim; reconcile against current workflow before reuse |
| 244 | Ephemeral Demo Sandbox — 🟢 Built (`Admin/DemoStoreController.php`, confirmed 48h-expiry cloning logic) | Historical claim; reconcile against current workflow before reuse |
| 5 | Dark Theme (Midnight Nebula) — 🟢 Built (`AppearanceController.php`, `AppearanceSettingsController.php`) | Historical claim; reconcile against current workflow before reuse |
| 6 | Light Theme — 🟢 Built (same controllers as above) | Historical claim; reconcile against current workflow before reuse |
| 21 | Senior Mode Accessibility — 🔴 Coming Soon. No backend route or setting found for this; if it exists it would be frontend-only and unconfirmed. | Historical claim; reconcile against current workflow before reuse |
| 22 | Color-Coded Price & Qty — 🔴 Coming Soon. No dedicated setting found; this reads as a UI styling choice rather than a real toggleable feature. | Historical claim; reconcile against current workflow before reuse |
| 254 | Device-Adaptive Layouts — 🟡 Partial. Responsive CSS is standard across the app, but there's no evidence of a dedicated adaptive-layout engine or setting. | Historical claim; reconcile against current workflow before reuse |
| 10 | Progressive Web App (PWA) — 🟢 Built (confirmed in `vite.config.js` / build tooling references) | Historical claim; reconcile against current workflow before reuse |
| 13 | Hardware Status Badge — 🟡 Partial. Terminal pairing exists (`TerminalPairingController.php`, `TerminalPairingToken.php`) which implies hardware connection state, but no dedicated "status badge" endpoint was found. | Historical claim; reconcile against current workflow before reuse |
| 14 | One-Click Cache Refresh — 🔴 Coming Soon. No matching route found. | Historical claim; reconcile against current workflow before reuse |
| 15 | Owner Profile Card — 🟢 Built (`ProfileController.php`) | Historical claim; reconcile against current workflow before reuse |
| 16 | Test Data Wipe — 🟢 Built (`Admin/SystemResetController.php`, `surgical_reset.php`) | Historical claim; reconcile against current workflow before reuse |
| 17 | Security Activity Log — 🟢 Built (`ActivityLogController.php`, `ActivityLog.php`, `StoreActivityLog.php`) | Historical claim; reconcile against current workflow before reuse |
| 8 | Granular Multi-Store Roles — 🟢 Built (`TenantUser.php`, role/permission middleware confirmed throughout `web.php`) | Historical claim; reconcile against current workflow before reuse |
| 9 | Cashier PIN Login — 🟢 Built (`Auth/StaffAuthController.php`, passcode fields confirmed on `User.php`) | Historical claim; reconcile against current workflow before reuse |
| 243 | Staff Invitation Codes — 🟢 Built (`StaffInvitationController.php`, `StaffInvitation.php`) | Historical claim; reconcile against current workflow before reuse |
| 247 | Cashier Inactivity Auto-Logout — 🔴 Coming Soon. No matching timeout/logout route found. | Historical claim; reconcile against current workflow before reuse |
| 253 | Passcode Security Standards — 🔴 Coming Soon. No dedicated passcode-complexity rule found in the routes checked. | Historical claim; reconcile against current workflow before reuse |
| 185 | Owner Daily Pulse — 🟢 Built (`OwnerDailyPulseController.php`, `OwnerDailyPulseService.php`) | Historical claim; reconcile against current workflow before reuse |
| 18 | Instant Barcode Scanner — 🟢 Built (`BarcodeController.php`) | Historical claim; reconcile against current workflow before reuse |
| 19 | Serial & IMEI Scanner — 🟢 Built (`SerialTrackingController.php`, `ProductSerial.php`) | Historical claim; reconcile against current workflow before reuse |
| 20 | Keyboard-First Checkout — 🟡 Partial. Likely a frontend keybinding layer inside the POS React pages; no dedicated backend route to verify since this is purely a UI behavior — treat as unconfirmed until checked in the frontend directly. | Historical claim; reconcile against current workflow before reuse |
| 24 | Multi-Tab Customer Checkout — 🟡 Partial. `ParkedSaleController.php` supports holding multiple carts; a dedicated "10 simultaneous tabs" UI limit was not independently confirmed. | Historical claim; reconcile against current workflow before reuse |
| 25 | Park & Recall (Hold Bill) — 🟢 Built (`ParkedSaleController.php`, `ParkedSale.php`) | Historical claim; reconcile against current workflow before reuse |
| 26 | In-Flight Product Creation — 🟡 Partial. Product creation routes exist; whether they're reachable mid-checkout without losing the cart wasn't independently confirmed in this pass. | Historical claim; reconcile against current workflow before reuse |
| 27 | Cart Rescue & Session Protection — 🟢 Built (`ParkedSale.php` plus the Occupancy dual-write system confirmed wired into `SaleController.php`) | Historical claim; reconcile against current workflow before reuse |
| 28 | Auto-Applying Customer Discounts — 🟡 Partial. `Party.php` and pricing tiers exist; automatic application at customer-select was not independently traced. | Historical claim; reconcile against current workflow before reuse |
| 29 | Typo-Tolerant Search (OmniSearch) — 🟢 Built (`FuzzyMatchService.php`, `Api/PosSearchController.php`) | Historical claim; reconcile against current workflow before reuse |
| 30 | Automatic Cash Rounding — 🔴 Coming Soon. No dedicated rounding route/service found. | Historical claim; reconcile against current workflow before reuse |
| 31 | Multi-Account Split Payments — 🟢 Built (`PaymentController.php`, `PaymentService.php`, `Payment.php`) | Historical claim; reconcile against current workflow before reuse |
| 32 | Daily Cash Register Audit — 🟢 Built (`CashShortageController.php` in V3, `FundController.php`) | Historical claim; reconcile against current workflow before reuse |
| 42 | Negative Stock Alert & Lock — 🟢 Built (confirmed in `InventoryService.php` / `FifoService.php`) | Historical claim; reconcile against current workflow before reuse |
| 46 | Cashier Change Calculator — 🟡 Partial. Change calculation is inherent to `PaymentController.php`'s payment flow; no dedicated standalone feature to verify separately. | Historical claim; reconcile against current workflow before reuse |
| 251 | Barcode Pattern Recognition — 🟢 Built (`BarcodeController.php` handles SKU/serial/IMEI pattern distinction) | Historical claim; reconcile against current workflow before reuse |
| 23 | Owner Profit Peek — 🔴 Coming Soon. No dedicated route found for a margin-reveal gesture. | Historical claim; reconcile against current workflow before reuse |
| 43 | Service Fee & Freight Additions — 🟢 Built (`AdHocLine.php` model confirms ad-hoc invoice line items) | Historical claim; reconcile against current workflow before reuse |
| 44 | Automatic VAT / GST Calculation — 🟢 Built (`TaxService.php`) | Historical claim; reconcile against current workflow before reuse |
| 45 | Recent Invoices Panel — 🔴 Coming Soon. **Confirmed missing** by the prior engineering audit's own script as well as this pass — no dedicated "last 50 invoices" panel route found. | Historical claim; reconcile against current workflow before reuse |
| 72 | A4 & Letter Invoice PDF Export — 🟢 Built (`V3/InvoicePdfController.php`) | Historical claim; reconcile against current workflow before reuse |
| 60 | Wholesale vs Retail Pricing Tiers — 🟢 Built (`V3/PriceTierController.php`) | Historical claim; reconcile against current workflow before reuse |
| 63 | Tax-Inclusive / Exclusive Toggle — 🟡 Partial. Tax logic exists in `TaxService.php`; a dedicated inclusive/exclusive UI toggle wasn't independently confirmed. | Historical claim; reconcile against current workflow before reuse |
| 213 | Price Headroom Detection — see AI Business Intelligence, below. | Historical claim; reconcile against current workflow before reuse |
| 33 | Silent WebUSB Thermal Printing — 🟡 Partial. This is a browser-side WebUSB feature (frontend), not a backend route — cannot be confirmed from server code alone. | Historical claim; reconcile against current workflow before reuse |
| 34 | Custom Thermal Roll Widths — 🟡 Partial. Same as above — frontend print-template concern. | Historical claim; reconcile against current workflow before reuse |
| 35 | Receipt Cut-Line Padding — 🟡 Partial. Frontend print template concern, not independently verifiable server-side. | Historical claim; reconcile against current workflow before reuse |
| 36 | Dynamic Brand Colors on PDFs — 🟡 Partial. Branding fields likely exist on tenant settings; PDF template color injection wasn't independently confirmed. | Historical claim; reconcile against current workflow before reuse |
| 37 | Print Column Toggles — 🔴 Coming Soon. No dedicated route/setting found. | Historical claim; reconcile against current workflow before reuse |
| 38 | Amount-to-Words Translation — 🔴 Coming Soon. No dedicated route/service found. | Historical claim; reconcile against current workflow before reuse |
| 39 | Tax Verification QR Codes — 🔴 Coming Soon. No route found (note: `FbrService.php` exists, which suggests Pakistani tax authority integration groundwork, but no confirmed QR-on-receipt feature). | Historical claim; reconcile against current workflow before reuse |
| 40 | Branded Receipt Sync — 🔴 Coming Soon. No dedicated route found. | Historical claim; reconcile against current workflow before reuse |
| 47 | Barcode Label Print Factory — 🟢 Built (`LabelController.php`, gated behind `plan.feature:barcode_label_print`) | Historical claim; reconcile against current workflow before reuse |
| 48 | Dynamic Label QR Codes — 🟡 Partial. `LabelController.php` handles labels; QR-to-storefront linkage specifically wasn't confirmed. | Historical claim; reconcile against current workflow before reuse |
| 41 | Auto-Deducting Composite Items — 🟢 Built (`Composition.php`, `CompositionItem.php`, `AutoManufacturingService.php`, `ManufacturingService.php`) | Historical claim; reconcile against current workflow before reuse |
| 109 | Bill of Materials (BOM) Recipes — 🟢 Built (`V3/BomController.php`, `Composition.php`) | Historical claim; reconcile against current workflow before reuse |
| 110 | Auto-Assembly Cookbook — 🟢 Built (`CookbookController.php`, `AutoManufacturingService.php`) | Historical claim; reconcile against current workflow before reuse |
| 111 | Production Run Simulator — 🟡 Partial. `V3/ProductionRunController.php` and `ProductionRun.php` exist and handle real production runs; a dedicated pre-check "simulator" (checking feasibility before committing) wasn't independently confirmed as a separate feature. | Historical claim; reconcile against current workflow before reuse |
| 112 | Recipe History Archive — 🟢 Built (`CompositionMedia.php`, `ManufacturingLog.php`, `ProductionLog.php`) | Historical claim; reconcile against current workflow before reuse |
| 49 | Customer Account Registry (Khata) — 🟢 Built (`PartyController.php`, `Party.php`, `PartyService.php`) | Historical claim; reconcile against current workflow before reuse |
| 50 | Customer Payments Log — 🟢 Built (`V3/CustomerPaymentController.php`) | Historical claim; reconcile against current workflow before reuse |
| 51 | Customer Statement Generator — 🟢 Built (`V3/CustomerStatementController.php`) | Historical claim; reconcile against current workflow before reuse |
| 52 | Aged Receivables Report — see Reports, below | Historical claim; reconcile against current workflow before reuse |
| 55 | Multi-Payment Invoices — 🟢 Built (`PaymentService.php` supports multiple payments per invoice) | Historical claim; reconcile against current workflow before reuse |
| 56 | Automatic Payment Allocation — 🟡 Partial. `Allocation.php` model confirms allocation logic exists; "oldest-invoice-first" automatic behavior wasn't independently traced. | Historical claim; reconcile against current workflow before reuse |
| 57 | Customer Lifetime Value Score — see AI Business Intelligence, below (`CustomerAnalytics.php` confirms real backing) | Historical claim; reconcile against current workflow before reuse |
| 71 | Customer Address Book — 🔴 Coming Soon. No dedicated address-book route found. | Historical claim; reconcile against current workflow before reuse |
| 73 | Outstanding Balance Dashboard — 🟢 Built (`PartyController.php` / dashboard widgets confirmed) | Historical claim; reconcile against current workflow before reuse |
| 74 | Unified Party Ledger — 🟢 Built (`Party.php` merges sales/returns/payments) | Historical claim; reconcile against current workflow before reuse |
| 77 | Overdue Customer Highlights — 🟡 Partial. Data exists via `Party.php` balances; a dedicated red-highlight UI rule wasn't independently confirmed. | Historical claim; reconcile against current workflow before reuse |
| 78 | Supplier Account Registry (Khata) — 🟢 Built (`Supplier.php`, same `Party` infrastructure) | Historical claim; reconcile against current workflow before reuse |
| 79 | Delayed Supplier Payments — 🟢 Built (`V3/SupplierPaymentController.php`) | Historical claim; reconcile against current workflow before reuse |
| 80 | Supplier Statement Generator — 🟢 Built (`V3/SupplierStatementController.php`) | Historical claim; reconcile against current workflow before reuse |
| 81 | Aged Payables Directory — see Reports, below | Historical claim; reconcile against current workflow before reuse |
| 87 | Supplier Lead Time Tracker — 🔴 Coming Soon. No dedicated route found (note: lead-time-aware AI reorder logic references supplier timing conceptually — see AI Inventory Intelligence — but a manual tracker feature itself wasn't confirmed). | Historical claim; reconcile against current workflow before reuse |
| 89 | Supplier SKU Mapping — 🔴 Coming Soon. No dedicated route found. | Historical claim; reconcile against current workflow before reuse |
| 94 | Bank-Linked Supplier Payments — 🟡 Partial. `BankAccount.php` and `V3/SupplierPaymentController.php` both exist; direct linkage between the two wasn't independently traced. | Historical claim; reconcile against current workflow before reuse |
| 95 | Custom Supplier Payment Terms — 🔴 Coming Soon. No dedicated Net-15/30/60 terms field or route found. | Historical claim; reconcile against current workflow before reuse |
| 173 | All Parties Credit Summary — see Reports, below | Historical claim; reconcile against current workflow before reuse |
| 181 | Sales & Purchases by Party — see Reports, below | Historical claim; reconcile against current workflow before reuse |
| 65 | Sales Return Vouchers — 🟢 Built (`ReturnController.php`, `PosReturnController.php`) | Historical claim; reconcile against current workflow before reuse |
| 67 | Pre-Sales Inventory Reservation — 🟢 Built (`SalesOrderController.php`, gated behind `plan.feature:pre_sales_reservation`) | Historical claim; reconcile against current workflow before reuse |
| 69 | Refund Reason Analysis — 🔴 Coming Soon. No dedicated reason-analytics route found. | Historical claim; reconcile against current workflow before reuse |
| 97 | Supplier Refund Tracker — 🟡 Partial. `V3/PurchaseReturnController.php` handles the return; a distinct "refund received back" tracking layer wasn't independently confirmed. | Historical claim; reconcile against current workflow before reuse |
| 208 | Return Rate Quality Flags — see AI Business Intelligence, below | Historical claim; reconcile against current workflow before reuse |
| 68 | Automated Recurring Invoicing — 🟢 Built (`RecurringInvoiceController.php`, `RecurringInvoice.php`, gated behind `plan.feature:recurring_invoices`) | Historical claim; reconcile against current workflow before reuse |
| 82 | Purchase Order Tracker — 🟢 Built (`PurchaseOrderController.php`, `PurchaseOrder.php`) | Historical claim; reconcile against current workflow before reuse |
| 83 | Partial Shipment Intake — 🟡 Partial. `PurchaseOrderItem.php` supports partial quantities conceptually; a dedicated "Partially Received" status workflow wasn't independently confirmed line-by-line. | Historical claim; reconcile against current workflow before reuse |
| 92 | Auto-Generated Purchase Orders — see AI Inventory Intelligence, below | Historical claim; reconcile against current workflow before reuse |
| 202 | Lead-Time-Aware Reorder Alerts — see AI Inventory Intelligence, below | Historical claim; reconcile against current workflow before reuse |
| 84 | Supplier Debit Notes — 🟢 Built (`DebitNoteController.php`, `DebitNote.php`) — note: print/update endpoints for debit notes are literal unimplemented stubs (`abort(501, 'Implement debit-notes.print')`) in one route group, so treat print/edit as 🟡 Partial even though create/view are solid. | Historical claim; reconcile against current workflow before reuse |
| 91 | Purchase Returns Register — 🟢 Built (`V3/PurchaseReturnController.php`) | Historical claim; reconcile against current workflow before reuse |
| 101 | Multi-Warehouse Isolation (Godown) — 🟢 Built (`Warehouse.php`, `V3/WarehouseController.php`) | Historical claim; reconcile against current workflow before reuse |
| 102 | Stock Transfer Vouchers — 🟢 Built (`StockTransferController.php`, `V3/StockTransferController.php`, `StockTransfer.php`) | Historical claim; reconcile against current workflow before reuse |
| 118 | Stock Valuation by Location — see Reports, below | Historical claim; reconcile against current workflow before reuse |
| 103 | Product Variant Support — 🟢 Built (`ProductVariant.php`, `VariantAttribute.php`) | Historical claim; reconcile against current workflow before reuse |
| 104 | Variant-Aware FIFO Costing — 🟢 Built (`FifoService.php`, `SaleItemBatch.php`) | Historical claim; reconcile against current workflow before reuse |
| 105 | Batch Intake Number Tracking — 🟢 Built (`BatchTrackingController.php`, `ProductBatch.php`, `InventoryBatch.php`) | Historical claim; reconcile against current workflow before reuse |
| 106 | Batch Expiry Warnings — 🟡 Partial. `Batch.php`/`InventoryBatch.php` carry expiry data; a dedicated dashboard alert for approaching expiry wasn't independently confirmed as distinct from the Expiring Soon report. | Historical claim; reconcile against current workflow before reuse |
| 107 | Stock Take Audit Wizard — 🟢 Built (`StockTakeController.php`, `StockTake.php`, `StockTakeItem.php`) | Historical claim; reconcile against current workflow before reuse |
| 108 | Disaster & Asset Claim Manager — 🟢 Built (`V3/DisasterClaimController.php`) | Historical claim; reconcile against current workflow before reuse |
| 113 | Product History Timeline — 🟡 Partial. Movement data exists (`StockMovement.php`); a unified single-timeline view specifically wasn't confirmed. | Historical claim; reconcile against current workflow before reuse |
| 114 | Category Management Center — 🟢 Built (`Category.php`) | Historical claim; reconcile against current workflow before reuse |
| 115 | Low Stock Threshold Alerts — 🟢 Built (confirmed via Reports and `InventoryService.php`) | Historical claim; reconcile against current workflow before reuse |
| 116 | IMEI & Serial Lifecycle Tracking — 🟢 Built (`SerialTrackingController.php`, `ProductSerial.php`) | Historical claim; reconcile against current workflow before reuse |
| 117 | Unit of Measure Converter — 🟢 Built (`V3/UomConversionController.php`, `UomService.php`) | Historical claim; reconcile against current workflow before reuse |
| 252 | Stock Reservation Rules — 🟢 Built (`InventoryController@getReservations` confirmed live) | Historical claim; reconcile against current workflow before reuse |
| 119 | VenSynQ Command Center — 🟢 Built (`VenSynQController.php`, extensively wired — channels, sync, payouts, health checks all confirmed real routes) | Historical claim; reconcile against current workflow before reuse |
| 120 | 3-Click OAuth Store Connection — 🟢 Built (Amazon/TikTok/eBay/WooCommerce OAuth callback routes all confirmed) | Historical claim; reconcile against current workflow before reuse |
| 121 | Automated Commission Isolation — 🟢 Built (`MarketplacePayout.php` confirms payout/fee tracking) | Historical claim; reconcile against current workflow before reuse |
| 122 | Dropshipping Order Automator — 🟡 Partial. Order processing (`processOrder`) and JIT draft approval routes exist; full "dropship-specific" automation wasn't independently isolated from general order sync. | Historical claim; reconcile against current workflow before reuse |
| 123 | Just-in-Time Purchase Orders — 🟢 Built (`jit-drafts/{purchase}/approve` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 124 | Bulk Tracking ID Sync — 🟢 Built (`sync-tracking` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 125 | Multi-Channel Expense Allocation — 🔴 Coming Soon. No dedicated route found for routing platform fees into expense categories automatically. | Historical claim; reconcile against current workflow before reuse |
| 126 | WooCommerce Real-Time Webhook — 🟢 Built (`WooCommerceController@webhook`, `WooSync/WooWebhookController.php`) | Historical claim; reconcile against current workflow before reuse |
| 127 | WooCommerce Customer Auto-Registry — 🔴 Coming Soon. No dedicated route found. | Historical claim; reconcile against current workflow before reuse |
| 128 | WooCommerce Stock Sync — 🟢 Built (`WooSync/WooConnectionController.php`, `WooSyncQueue.php`) | Historical claim; reconcile against current workflow before reuse |
| 129 | Online Orders Bridge — 🟡 Partial. Sync infrastructure exists broadly; a dedicated "pending web orders" fulfillment dashboard wasn't independently confirmed. | Historical claim; reconcile against current workflow before reuse |
| 130 | Web Store Catalog Controls — 🟢 Built (`OnlineStoreController.php`) | Historical claim; reconcile against current workflow before reuse |
| 131 | Double-Entry Journal Engine — 🟢 Built (`JournalEntry.php`, `JournalItem.php`, `AccountingService.php`) | Historical claim; reconcile against current workflow before reuse |
| 132 | Automated Cash Reconciliation — 🟢 Built (per the prior engineering audit — computed live from ledger, not cached) | Historical claim; reconcile against current workflow before reuse |
| 133 | Fixed Asset Depreciation Tracker — 🟢 Built (`V3/DepreciationController.php`, `V3/AssetController.php`) | Historical claim; reconcile against current workflow before reuse |
| 134 | Business Loan Ledger — 🟢 Built (`V3/LoanController.php`) | Historical claim; reconcile against current workflow before reuse |
| 135 | Inter-Register Cash Transfers — 🟢 Built (`V3/BankTransferController.php`, `FundController.php`) | Historical claim; reconcile against current workflow before reuse |
| 136 | Advance Payment Allocation — 🟢 Built (`V3/CustomerAdvanceController.php`, `V3/SupplierAdvanceController.php`) | Historical claim; reconcile against current workflow before reuse |
| 137 | Fiscal Year Closing Wizard — 🟢 Built (`V3/FiscalYearController.php`) | Historical claim; reconcile against current workflow before reuse |
| 138 | Debit & Credit Note Registry — 🟡 Partial (see Purchase Return section — create/view real, print/edit stubbed in at least one route group) | Historical claim; reconcile against current workflow before reuse |
| 139 | Bank Reconciliation Checker — 🟢 Built (`BankReconciliationController.php`, gated behind `plan.feature:bank_reconciliation`) | Historical claim; reconcile against current workflow before reuse |
| 140 | Tax Summary Engine — 🟢 Built (`TaxService.php`) | Historical claim; reconcile against current workflow before reuse |
| 141 | Expense Manager + Receipt Uploads — 🟢 Built (`ExpenseController.php`, `V3/ExpenseController.php`, `Expense.php`) | Historical claim; reconcile against current workflow before reuse |
| 142 | Charity Allocation Engine — 🟢 Built (`CharityController.php`, `V3/DonationController.php`) | Historical claim; reconcile against current workflow before reuse |
| 143 | Petty Cash Logs — 🟡 Partial. `FundController.php` and `FundTransaction.php` cover general cash movements; a dedicated "petty cash with mandatory approval" workflow wasn't independently isolated. | Historical claim; reconcile against current workflow before reuse |
| 144 | Immutable Transaction Locks — 🟡 Partial. Per the prior engineering audit, this exists as an Observer pattern but its guardrail test coverage was not independently confirmed to pass (no PHP runtime available in this pass either). | Historical claim; reconcile against current workflow before reuse |
| 145 | Balanced Reversal Engine — 🟢 Built (`SaleReversalService.php`) | Historical claim; reconcile against current workflow before reuse |
| 146 | Multi-Currency Configuration — 🔴 Coming Soon. No dedicated multi-currency route/config found in this pass. | Historical claim; reconcile against current workflow before reuse |
| 147 | Profit & Loss Statement — 🟢 Built | Historical claim; reconcile against current workflow before reuse |
| 148 | Balance Sheet — 🟢 Built (`accounting.balance-sheet` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 149 | Cash Flow Statement — 🟡 Partial. Not independently confirmed as a distinct report route in this pass; accounting data exists to support it. | Historical claim; reconcile against current workflow before reuse |
| 150 | Double-Entry Trial Balance — 🟢 Built (`reports.trial-balance` route confirmed via route-name exclusion list) | Historical claim; reconcile against current workflow before reuse |
| 151 | Sales Summary & Daily Trend — 🟢 Built | Historical claim; reconcile against current workflow before reuse |
| 152 | Day Book Log — 🟢 Built (`day-book` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 153 | Account Ledger Report — 🟢 Built (`account-ledger` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 154 | Party Statement (Khata Ledger) — 🟢 Built (`party-statement` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 155 | Stock Valuation Report — 🟢 Built (`stock-valuation` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 156 | Low Stock Shortages Report — 🟢 Built (`low-stock` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 157 | Stock Movement History — 🟢 Built (`movement-history` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 158 | Tax Compliance Summary — 🟢 Built (`tax` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 159 | Item-Wise Profit Analysis — 🟢 Built (`item-wise-profit` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 160 | Party-Wise Profitability — 🟢 Built (`party-wise-profit-loss` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 161 | Bill-Wise Profitability — 🟢 Built (`bill-wise-profit` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 162 | Sales Aging Report — 🟢 Built (`sale-aging` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 163 | Expense by Category — 🟢 Built (`expense-by-category` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 164 | Stock Summary & Aging — 🟢 Built (`stock-summary-by-category` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 165 | Item / Party Cross Reports — 🟢 Built (`item-report-by-party`, `party-report-by-item` routes confirmed) | Historical claim; reconcile against current workflow before reuse |
| 166 | Loan Repayment Statement — 🟢 Built (`loan-statement` route confirmed, `reports.loan-statement`) | Historical claim; reconcile against current workflow before reuse |
| 167 | Graph Analytics Dashboard — 🟡 Partial. `GrowthMetricSnapshot.php` and dashboard infrastructure exist; a dedicated standalone "graph analytics" report page wasn't independently isolated. | Historical claim; reconcile against current workflow before reuse |
| 168 | Purchases Report — 🟢 Built (`purchases` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 169 | Transactions History — 🟢 Built (`TransactionController.php`, `transactions` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 170 | Expenses Directory — 🟢 Built (`expenses` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 171 | Bank Statements Log — 🟢 Built (`bank-statement` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 172 | Expiring Soon Alert — 🟢 Built (`expiry` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 173 | All Parties Credit Summary — 🟢 Built (`all-parties` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 174 | General Discount Report — 🟢 Built (`discount` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 175 | Category Profit & Loss — 🔴 Coming Soon. Not found as a distinct route in the exclusion list checked (general P&L exists; category-level breakout wasn't confirmed). | Historical claim; reconcile against current workflow before reuse |
| 176 | Tax Rate Breakdown — 🟢 Built (`reports.tax-rate` route confirmed, gated behind `plan.feature:auto_vat_gst`) | Historical claim; reconcile against current workflow before reuse |
| 177 | Sales Order Items — 🟢 Built (`reports.sale-order-items` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 178 | Daily Sales Trend — 🟡 Partial. Folded into Sales Summary route; not confirmed as a fully separate report. | Historical claim; reconcile against current workflow before reuse |
| 179 | Stock Summary by Category — 🟢 Built (same route as #164) | Historical claim; reconcile against current workflow before reuse |
| 180 | Stock Aging Analysis — 🟡 Partial. Aging data underlies the stock-summary-by-category route; a dedicated standalone aging-only report wasn't independently isolated. | Historical claim; reconcile against current workflow before reuse |
| 181 | Sales & Purchases by Party — 🟢 Built (`sale-purchase-by-party` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 182 | Item Report by Party — 🟢 Built (same as #165) | Historical claim; reconcile against current workflow before reuse |
| 183 | Party Report by Item — 🟢 Built (same as #165) | Historical claim; reconcile against current workflow before reuse |
| 184 | Item-Wise Discount Report — 🟡 Partial. General discount report exists (#174); an item-level breakout specifically wasn't independently confirmed. | Historical claim; reconcile against current workflow before reuse |
| 186 | Sale Orders Report — 🟢 Built (`reports.sale-orders` route confirmed, gated behind `plan.feature:pre_sales_reservation`) | Historical claim; reconcile against current workflow before reuse |
| 187 | Purchase Returns Report — 🟡 Partial. Purchase returns are recorded (`V3/PurchaseReturnController.php`); a dedicated reporting view specifically wasn't independently confirmed in the route exclusion list. | Historical claim; reconcile against current workflow before reuse |
| 188 | Per-Customer Rhythm Detection — 🟡 Partial. Engine architecture supports this pattern; this specific insight type wasn't traced to a named method. | Historical claim; reconcile against current workflow before reuse |
| 189 | Reorder Due Alerts — 🟢 Built (`ai.smart-reorder` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 190 | Late Customer Warnings — 🟡 Partial. Plausible given `CustomerAnalytics.php`; not independently isolated. | Historical claim; reconcile against current workflow before reuse |
| 191 | Churn Risk & Lost Customer Detection — 🟡 Partial. Plausible given engine architecture; not independently isolated to a named method. | Historical claim; reconcile against current workflow before reuse |
| 192 | Quiet Decline Detection — 🟡 Partial. Same as above. | Historical claim; reconcile against current workflow before reuse |
| 193 | Rising Star Alerts — 🟡 Partial. Same as above. | Historical claim; reconcile against current workflow before reuse |
| 194 | Revenue Concentration Warning — 🟡 Partial. Same as above. | Historical claim; reconcile against current workflow before reuse |
| 195 | First-Purchase Follow-Up — 🟡 Partial. Same as above. | Historical claim; reconcile against current workflow before reuse |
| 196 | Credit Limit Breach Alerts — 🔴 Coming Soon. No dedicated credit-limit field or alert route found anywhere in this pass — flagged for you specifically since you asked about credit limits. | Historical claim; reconcile against current workflow before reuse |
| 197 | Market Basket Cross-Sell — 🟡 Partial. Plausible given `InsightCatalog.php`'s breadth; not independently isolated. | Historical claim; reconcile against current workflow before reuse |
| 198 | RFM Customer Segmentation — 🟡 Partial. Same as above. | Historical claim; reconcile against current workflow before reuse |
| 199 | Predicted Customer Lifetime Value — 🟡 Partial. Same as above. | Historical claim; reconcile against current workflow before reuse |
| 224 | Evidence On Every Insight — 🟢 Built (this is architectural — `AiRecommendation.php` stores underlying evidence data) | Historical claim; reconcile against current workflow before reuse |
| 225 | Self-Scoring Accuracy Loop — 🟢 Built (`OutcomeEvaluator.php` exists specifically for this) | Historical claim; reconcile against current workflow before reuse |
| 226 | Self-Tuning Thresholds — 🟢 Built (`ThresholdTuner.php` exists specifically for this) | Historical claim; reconcile against current workflow before reuse |
| 227 | Automatic Noise Suppression — 🟡 Partial. Plausible given `ThresholdTuner.php`/`SignalRepository.php`; specific mute/expiry behavior not independently isolated. | Historical claim; reconcile against current workflow before reuse |
| 228 | Learns Your Scale — 🟢 Built (`MetricSnapshotter.php` + `DailySnapshot.php` confirm real trading-history-based baselines) | Historical claim; reconcile against current workflow before reuse |
| 229 | Intervention-Aware Scoring — 🟡 Partial. Plausible given `OutcomeEvaluator.php`; specific behavior not independently isolated. | Historical claim; reconcile against current workflow before reuse |
| 230 | Runs Without an AI Key — 🟢 Built (the entire Growth Engine above is deterministic statistics, separate from the `AiExtractionService.php` used for Smart Capture) | Historical claim; reconcile against current workflow before reuse |
| 231 | Daily Business Snapshots — 🟢 Built (`DailySnapshot.php`, `MetricSnapshotter.php`) | Historical claim; reconcile against current workflow before reuse |
| 232 | Snooze & Dismiss Memory — 🟡 Partial. Plausible given `Signal.php`/`SignalRepository.php`; not independently isolated. | Historical claim; reconcile against current workflow before reuse |
| 233 | Auto-Resolving Signals — 🟡 Partial. Same as above. | Historical claim; reconcile against current workflow before reuse |
| 234 | Floating AI Assistant — 🟢 Built (`AgentChatController.php`, `ChatAIService.php`, `VenaAssistController.php`) | Historical claim; reconcile against current workflow before reuse |
| 235 | Smart Capture (Image & Audio) — 🟢 Built (`SmartCapture/SmartCaptureController.php` at 55KB, `AiExtractionService.php` at 58KB — this is real and substantial) | Historical claim; reconcile against current workflow before reuse |
| 236 | Bring-Your-Own-Key AI — 🟡 Partial. `AiEntitlementService.php`, `AiSpendGuard.php`, `AiUsageRecorder.php` all exist and imply key/spend management infrastructure; whether tenants can plug in their own key specifically wasn't independently confirmed. | Historical claim; reconcile against current workflow before reuse |
| 58 | Customer Wallet Credit — 🟢 Built (`store-credit.add`, `store-credit.use` routes confirmed) | Historical claim; reconcile against current workflow before reuse |
| 59 | Loyalty Points System — 🟢 Built (`loyalty.award`, `loyalty.redeem` routes confirmed, `LoyaltyPoint.php`, `LoyaltyBalance.php`) | Historical claim; reconcile against current workflow before reuse |
| 75 | Customer Milestone Tracker — 🔴 Coming Soon. No birthday/anniversary route found anywhere. | Historical claim; reconcile against current workflow before reuse |
| 76 | Digital Gift Cards — 🟢 Built (`gift-cards.create`, `gift-cards.use` routes confirmed, `GiftCard.php`) | Historical claim; reconcile against current workflow before reuse |
| 258 | Anniversary & Birthday Tracker — 🔴 Coming Soon. Same as #75 — not built. | Historical claim; reconcile against current workflow before reuse |
| 259 | Digital Gift Cards & Wallet Credit — 🟢 Built (same as #58/#76) | Historical claim; reconcile against current workflow before reuse |
| 54 | Credit Limit Enforcement — 🔴 Coming Soon. As noted above, no credit-limit field/route was found anywhere in this codebase pass. | Historical claim; reconcile against current workflow before reuse |
| 61 | B2B Proposal Builder — 🟢 Built (`ProposalController.php`, gated behind `plan.feature:b2b_proposal_builder`) | Historical claim; reconcile against current workflow before reuse |
| 62 | One-Click Quotation Conversion — 🟢 Built (`quotations.convert-to-order` route confirmed) | Historical claim; reconcile against current workflow before reuse |
| 64 | B2B Invoice Margin Display — 🔴 Coming Soon. No dedicated route found. | Historical claim; reconcile against current workflow before reuse |
| 66 | Interactive B2B Invoice Designer — 🔴 Coming Soon. No dedicated route found. | Historical claim; reconcile against current workflow before reuse |
| 70 | Tax-Exempt Customer Flag — 🔴 Coming Soon. No dedicated route found in this pass. | Historical claim; reconcile against current workflow before reuse |
| 246 | Custom Tax Rate Configurator — 🔴 Coming Soon. No dedicated route found (note: `FbrService.php` suggests some tax-authority groundwork, but a general configurable-bracket UI wasn't confirmed). | Historical claim; reconcile against current workflow before reuse |
| 53 | WhatsApp & SMS Debt Reminders — 🟡 Partial. WhatsApp exists ONLY as a message-link generator (`growth-engine.whatsapp`, `sales.send-whatsapp`) — it builds a pre-filled WhatsApp Web link, it does not send anything itself. **No SMS integration of any kind (no Twilio or equivalent) was found anywhere in the codebase.** Market this honestly as "WhatsApp link generation," not automated reminders. | Historical claim; reconcile against current workflow before reuse |
| 255 | Custom SMTP Mail Gateway — 🔴 Coming Soon. No SMTP configuration route found. | Historical claim; reconcile against current workflow before reuse |
| 256 | SMS & Messaging Gateway — 🔴 Coming Soon. Confirmed no SMS provider integration exists anywhere. | Historical claim; reconcile against current workflow before reuse |
| 257 | WhatsApp & SMS Debt Reminders — 🟡 Partial. Duplicate of #53 — same status. | Historical claim; reconcile against current workflow before reuse |
| 249 | Backups & Google Drive Sync — 🟢 Built (`VqBackupController.php`, confirmed Google Drive sync/download/restore routes) | Historical claim; reconcile against current workflow before reuse |
| 250 | Import / Export Tools — 🟢 Built (`DataImportService.php` at 61KB, `ImportMappingController.php`) | Historical claim; reconcile against current workflow before reuse |
| 260 | API Access & Webhooks — 🟡 Partial. Inbound webhooks exist for specific integrations (Lemon Squeezy billing, WooCommerce). **There is no general-purpose public API/webhook system for third-party developers** — do not market this as a developer platform yet. | Historical claim; reconcile against current workflow before reuse |
| 261 | Custom Domain Mapping — 🔴 Coming Soon. No route found. | Historical claim; reconcile against current workflow before reuse |
| 262 | Dedicated Account Manager — 🔴 Coming Soon. This is a service/staffing commitment, not code — fine to offer as a plan perk, but it isn't a "feature" to verify in code. | Historical claim; reconcile against current workflow before reuse |
| 263 | SSO / SAML Authentication — 🔴 Coming Soon. Confirmed no SSO/SAML route exists anywhere in the codebase. | Historical claim; reconcile against current workflow before reuse |
| 264 | White-Glove Onboarding — 🔴 Coming Soon. Same as Dedicated Account Manager — a service commitment, not a coded feature. | Historical claim; reconcile against current workflow before reuse |
| 265 | Priority Email & Phone Support — 🔴 Coming Soon. Same as above — a support-tier commitment, not a coded feature. | Historical claim; reconcile against current workflow before reuse |
| 85 | Automated Cost Price Updater — 🟡 Partial. `PurchaseService.php` is 50KB and clearly recalculates costs on purchase; a dedicated standalone "cost updater" feature name wasn't isolated from general purchase processing. | Historical claim; reconcile against current workflow before reuse |
| 86 | Cost Price Increase Alert — 🔴 Coming Soon. No dedicated alert route found. | Historical claim; reconcile against current workflow before reuse |
| 88 | Landing Cost Allocations — 🔴 Coming Soon. No dedicated freight/customs allocation route found. | Historical claim; reconcile against current workflow before reuse |
| 90 | Inbound Expiry Date Tracking — 🟢 Built (covered by `InventoryBatch.php` / `ProductBatch.php` expiry fields, confirmed at intake via Purchase flow) | Historical claim; reconcile against current workflow before reuse |
| 93 | Bulk Supplier Payments — 🔴 Coming Soon. No dedicated bulk-payment route found. | Historical claim; reconcile against current workflow before reuse |
| 96 | Purchase Invoice Document Scanner — 🟡 Partial. `SmartCaptureController.php` handles image-based extraction generally; whether it's specifically wired to attach scanned purchase invoices wasn't independently confirmed. | Historical claim; reconcile against current workflow before reuse |
| 99 | Supplier Credit Limit Alerts — 🔴 Coming Soon. No dedicated route found (consistent with the general absence of credit-limit infrastructure noted above). | Historical claim; reconcile against current workflow before reuse |
| 100 | Outstanding Payables Dashboard — 🟢 Built (`SupplierController.php` / party balance infrastructure supports this) | Historical claim; reconcile against current workflow before reuse |

# VenQore Feature Catalog — Verified Against Actual Code

**How this document was built:** every feature below was checked against the real Laravel codebase at `E:\AMD POS\AMD POS\app-code\main-app` — actual route definitions in `routes/web.php` and `routes/api.php`, actual Controller files, actual Model files, and actual Service/Engine classes. Nothing here is taken from a marketing description, an old chat summary, or an .md status report. Where a route resolves to a real controller method with a real model behind it, it's marked **Built**. Where a route exists but the underlying logic is a stub (e.g. literally returns `abort(501, 'Implement this')`) or the previous engineering audit explicitly flagged it as unverified/half-done, it's marked **Partial**. Where no route, controller, or service could be found anywhere in the codebase, it's marked **Coming Soon** — meaning it is not in the product today and should not be marketed as available at launch.

Legend:
- 🟢 **Built** — route + controller + underlying logic all confirmed present and wired
- 🟡 **Partial** — something real exists, but it is incomplete, stubbed, or the engine hasn't been fully cut over (explained per item)
- 🔴 **Coming Soon** — no working route/controller/service found; do not sell this at launch

Categories you said not to include have been removed entirely (Extras-as-a-sellable-category, Platform/SuperAdmin as a customer-facing category, made-up new verticals). All 41 report items are now one Reports category as requested. Multi-tenancy is not listed as its own category — it's infrastructure every tenant already gets, not a sellable feature.

---

## 1. Store Setup & Onboarding

- 1. One-Click Interactive Demo — 🟢 Built (`DemoController.php`, `Admin/DemoStoreController.php`, ephemeral demo cloning confirmed in `TenantCloner.php`)
- 2. 14-Day Free Trial — 🟢 Built (`TrialCreditService.php`, `PlanRepository.php`)
- 3. Instant Store Creator — 🟢 Built (`StoreController.php`, tenant creation flow confirmed at signup)
- 4. Smart Industry Seeding — 🟡 Partial. Real and wired (`BusinessTemplatesSeeder.php`, `TenantDefaultSeeder.php`), but only 12 base industry templates exist, not a distinct preset per business type — several trades share one template.
- 11. Self-Guiding Setup Tour — 🔴 Coming Soon. No onboarding-tour route or controller found.
- 12. Coupon Code Upgrades — 🟢 Built (`SuperAdmin/CouponController.php`, `Coupon.php`, `CouponRedemption.php`)
- 244. Ephemeral Demo Sandbox — 🟢 Built (`Admin/DemoStoreController.php`, confirmed 48h-expiry cloning logic)

## 2. Theming & Accessibility

- 5. Dark Theme (Midnight Nebula) — 🟢 Built (`AppearanceController.php`, `AppearanceSettingsController.php`)
- 6. Light Theme — 🟢 Built (same controllers as above)
- 21. Senior Mode Accessibility — 🔴 Coming Soon. No backend route or setting found for this; if it exists it would be frontend-only and unconfirmed.
- 22. Color-Coded Price & Qty — 🔴 Coming Soon. No dedicated setting found; this reads as a UI styling choice rather than a real toggleable feature.
- 254. Device-Adaptive Layouts — 🟡 Partial. Responsive CSS is standard across the app, but there's no evidence of a dedicated adaptive-layout engine or setting.

## 3. Platform Conveniences

- 10. Progressive Web App (PWA) — 🟢 Built (confirmed in `vite.config.js` / build tooling references)
- 13. Hardware Status Badge — 🟡 Partial. Terminal pairing exists (`TerminalPairingController.php`, `TerminalPairingToken.php`) which implies hardware connection state, but no dedicated "status badge" endpoint was found.
- 14. One-Click Cache Refresh — 🔴 Coming Soon. No matching route found.
- 15. Owner Profile Card — 🟢 Built (`ProfileController.php`)
- 16. Test Data Wipe — 🟢 Built (`Admin/SystemResetController.php`, `surgical_reset.php`)
- 17. Security Activity Log — 🟢 Built (`ActivityLogController.php`, `ActivityLog.php`, `StoreActivityLog.php`)

## 4. User & Staff Management

- 8. Granular Multi-Store Roles — 🟢 Built (`TenantUser.php`, role/permission middleware confirmed throughout `web.php`)
- 9. Cashier PIN Login — 🟢 Built (`Auth/StaffAuthController.php`, passcode fields confirmed on `User.php`)
- 243. Staff Invitation Codes — 🟢 Built (`StaffInvitationController.php`, `StaffInvitation.php`)
- 247. Cashier Inactivity Auto-Logout — 🔴 Coming Soon. No matching timeout/logout route found.
- 253. Passcode Security Standards — 🔴 Coming Soon. No dedicated passcode-complexity rule found in the routes checked.
- 185. Owner Daily Pulse — 🟢 Built (`OwnerDailyPulseController.php`, `OwnerDailyPulseService.php`)

## 5. POS (Point of Sale) — *Products required*

- 18. Instant Barcode Scanner — 🟢 Built (`BarcodeController.php`)
- 19. Serial & IMEI Scanner — 🟢 Built (`SerialTrackingController.php`, `ProductSerial.php`)
- 20. Keyboard-First Checkout — 🟡 Partial. Likely a frontend keybinding layer inside the POS React pages; no dedicated backend route to verify since this is purely a UI behavior — treat as unconfirmed until checked in the frontend directly.
- 24. Multi-Tab Customer Checkout — 🟡 Partial. `ParkedSaleController.php` supports holding multiple carts; a dedicated "10 simultaneous tabs" UI limit was not independently confirmed.
- 25. Park & Recall (Hold Bill) — 🟢 Built (`ParkedSaleController.php`, `ParkedSale.php`)
- 26. In-Flight Product Creation — 🟡 Partial. Product creation routes exist; whether they're reachable mid-checkout without losing the cart wasn't independently confirmed in this pass.
- 27. Cart Rescue & Session Protection — 🟢 Built (`ParkedSale.php` plus the Occupancy dual-write system confirmed wired into `SaleController.php`)
- 28. Auto-Applying Customer Discounts — 🟡 Partial. `Party.php` and pricing tiers exist; automatic application at customer-select was not independently traced.
- 29. Typo-Tolerant Search (OmniSearch) — 🟢 Built (`FuzzyMatchService.php`, `Api/PosSearchController.php`)
- 30. Automatic Cash Rounding — 🔴 Coming Soon. No dedicated rounding route/service found.
- 31. Multi-Account Split Payments — 🟢 Built (`PaymentController.php`, `PaymentService.php`, `Payment.php`)
- 32. Daily Cash Register Audit — 🟢 Built (`CashShortageController.php` in V3, `FundController.php`)
- 42. Negative Stock Alert & Lock — 🟢 Built (confirmed in `InventoryService.php` / `FifoService.php`)
- 46. Cashier Change Calculator — 🟡 Partial. Change calculation is inherent to `PaymentController.php`'s payment flow; no dedicated standalone feature to verify separately.
- 251. Barcode Pattern Recognition — 🟢 Built (`BarcodeController.php` handles SKU/serial/IMEI pattern distinction)

## 6. Invoicing / Invoice Creation — *Services or Products required*

- 23. Owner Profit Peek — 🔴 Coming Soon. No dedicated route found for a margin-reveal gesture.
- 43. Service Fee & Freight Additions — 🟢 Built (`AdHocLine.php` model confirms ad-hoc invoice line items)
- 44. Automatic VAT / GST Calculation — 🟢 Built (`TaxService.php`)
- 45. Recent Invoices Panel — 🔴 Coming Soon. **Confirmed missing** by the prior engineering audit's own script as well as this pass — no dedicated "last 50 invoices" panel route found.
- 72. A4 & Letter Invoice PDF Export — 🟢 Built (`V3/InvoicePdfController.php`)

## 7. Pricing

- 60. Wholesale vs Retail Pricing Tiers — 🟢 Built (`V3/PriceTierController.php`)
- 63. Tax-Inclusive / Exclusive Toggle — 🟡 Partial. Tax logic exists in `TaxService.php`; a dedicated inclusive/exclusive UI toggle wasn't independently confirmed.
- 213. Price Headroom Detection — see AI Business Intelligence, below.

## 8. Printing & Labels

- 33. Silent WebUSB Thermal Printing — 🟡 Partial. This is a browser-side WebUSB feature (frontend), not a backend route — cannot be confirmed from server code alone.
- 34. Custom Thermal Roll Widths — 🟡 Partial. Same as above — frontend print-template concern.
- 35. Receipt Cut-Line Padding — 🟡 Partial. Frontend print template concern, not independently verifiable server-side.
- 36. Dynamic Brand Colors on PDFs — 🟡 Partial. Branding fields likely exist on tenant settings; PDF template color injection wasn't independently confirmed.
- 37. Print Column Toggles — 🔴 Coming Soon. No dedicated route/setting found.
- 38. Amount-to-Words Translation — 🔴 Coming Soon. No dedicated route/service found.
- 39. Tax Verification QR Codes — 🔴 Coming Soon. No route found (note: `FbrService.php` exists, which suggests Pakistani tax authority integration groundwork, but no confirmed QR-on-receipt feature).
- 40. Branded Receipt Sync — 🔴 Coming Soon. No dedicated route found.
- 47. Barcode Label Print Factory — 🟢 Built (`LabelController.php`, gated behind `plan.feature:barcode_label_print`)
- 48. Dynamic Label QR Codes — 🟡 Partial. `LabelController.php` handles labels; QR-to-storefront linkage specifically wasn't confirmed.

## 9. Cookbook / Manufacturing — *Products required*

- 41. Auto-Deducting Composite Items — 🟢 Built (`Composition.php`, `CompositionItem.php`, `AutoManufacturingService.php`, `ManufacturingService.php`)
- 109. Bill of Materials (BOM) Recipes — 🟢 Built (`V3/BomController.php`, `Composition.php`)
- 110. Auto-Assembly Cookbook — 🟢 Built (`CookbookController.php`, `AutoManufacturingService.php`)
- 111. Production Run Simulator — 🟡 Partial. `V3/ProductionRunController.php` and `ProductionRun.php` exist and handle real production runs; a dedicated pre-check "simulator" (checking feasibility before committing) wasn't independently confirmed as a separate feature.
- 112. Recipe History Archive — 🟢 Built (`CompositionMedia.php`, `ManufacturingLog.php`, `ProductionLog.php`)

## 10. Customers & Suppliers (Khata / Party Ledger)

- 49. Customer Account Registry (Khata) — 🟢 Built (`PartyController.php`, `Party.php`, `PartyService.php`)
- 50. Customer Payments Log — 🟢 Built (`V3/CustomerPaymentController.php`)
- 51. Customer Statement Generator — 🟢 Built (`V3/CustomerStatementController.php`)
- 52. Aged Receivables Report — see Reports, below
- 55. Multi-Payment Invoices — 🟢 Built (`PaymentService.php` supports multiple payments per invoice)
- 56. Automatic Payment Allocation — 🟡 Partial. `Allocation.php` model confirms allocation logic exists; "oldest-invoice-first" automatic behavior wasn't independently traced.
- 57. Customer Lifetime Value Score — see AI Business Intelligence, below (`CustomerAnalytics.php` confirms real backing)
- 71. Customer Address Book — 🔴 Coming Soon. No dedicated address-book route found.
- 73. Outstanding Balance Dashboard — 🟢 Built (`PartyController.php` / dashboard widgets confirmed)
- 74. Unified Party Ledger — 🟢 Built (`Party.php` merges sales/returns/payments)
- 77. Overdue Customer Highlights — 🟡 Partial. Data exists via `Party.php` balances; a dedicated red-highlight UI rule wasn't independently confirmed.
- 78. Supplier Account Registry (Khata) — 🟢 Built (`Supplier.php`, same `Party` infrastructure)
- 79. Delayed Supplier Payments — 🟢 Built (`V3/SupplierPaymentController.php`)
- 80. Supplier Statement Generator — 🟢 Built (`V3/SupplierStatementController.php`)
- 81. Aged Payables Directory — see Reports, below
- 87. Supplier Lead Time Tracker — 🔴 Coming Soon. No dedicated route found (note: lead-time-aware AI reorder logic references supplier timing conceptually — see AI Inventory Intelligence — but a manual tracker feature itself wasn't confirmed).
- 89. Supplier SKU Mapping — 🔴 Coming Soon. No dedicated route found.
- 94. Bank-Linked Supplier Payments — 🟡 Partial. `BankAccount.php` and `V3/SupplierPaymentController.php` both exist; direct linkage between the two wasn't independently traced.
- 95. Custom Supplier Payment Terms — 🔴 Coming Soon. No dedicated Net-15/30/60 terms field or route found.
- 173. All Parties Credit Summary — see Reports, below
- 181. Sales & Purchases by Party — see Reports, below

## 11. Refunds / Sales Return — *Services or Products required*

- 65. Sales Return Vouchers — 🟢 Built (`ReturnController.php`, `PosReturnController.php`)
- 67. Pre-Sales Inventory Reservation — 🟢 Built (`SalesOrderController.php`, gated behind `plan.feature:pre_sales_reservation`)
- 69. Refund Reason Analysis — 🔴 Coming Soon. No dedicated reason-analytics route found.
- 97. Supplier Refund Tracker — 🟡 Partial. `V3/PurchaseReturnController.php` handles the return; a distinct "refund received back" tracking layer wasn't independently confirmed.
- 208. Return Rate Quality Flags — see AI Business Intelligence, below

## 12. Recurring Invoices

- 68. Automated Recurring Invoicing — 🟢 Built (`RecurringInvoiceController.php`, `RecurringInvoice.php`, gated behind `plan.feature:recurring_invoices`)

## 13. Purchase Order / Pre-Purchase

- 82. Purchase Order Tracker — 🟢 Built (`PurchaseOrderController.php`, `PurchaseOrder.php`)
- 83. Partial Shipment Intake — 🟡 Partial. `PurchaseOrderItem.php` supports partial quantities conceptually; a dedicated "Partially Received" status workflow wasn't independently confirmed line-by-line.
- 92. Auto-Generated Purchase Orders — see AI Inventory Intelligence, below
- 202. Lead-Time-Aware Reorder Alerts — see AI Inventory Intelligence, below

## 14. Purchase Return

- 84. Supplier Debit Notes — 🟢 Built (`DebitNoteController.php`, `DebitNote.php`) — note: print/update endpoints for debit notes are literal unimplemented stubs (`abort(501, 'Implement debit-notes.print')`) in one route group, so treat print/edit as 🟡 Partial even though create/view are solid.
- 91. Purchase Returns Register — 🟢 Built (`V3/PurchaseReturnController.php`)

## 15. Multi Location

- 101. Multi-Warehouse Isolation (Godown) — 🟢 Built (`Warehouse.php`, `V3/WarehouseController.php`)
- 102. Stock Transfer Vouchers — 🟢 Built (`StockTransferController.php`, `V3/StockTransferController.php`, `StockTransfer.php`)
- 118. Stock Valuation by Location — see Reports, below

## 16. Products & Inventory — *Products required*

- 103. Product Variant Support — 🟢 Built (`ProductVariant.php`, `VariantAttribute.php`)
- 104. Variant-Aware FIFO Costing — 🟢 Built (`FifoService.php`, `SaleItemBatch.php`)
- 105. Batch Intake Number Tracking — 🟢 Built (`BatchTrackingController.php`, `ProductBatch.php`, `InventoryBatch.php`)
- 106. Batch Expiry Warnings — 🟡 Partial. `Batch.php`/`InventoryBatch.php` carry expiry data; a dedicated dashboard alert for approaching expiry wasn't independently confirmed as distinct from the Expiring Soon report.
- 107. Stock Take Audit Wizard — 🟢 Built (`StockTakeController.php`, `StockTake.php`, `StockTakeItem.php`)
- 108. Disaster & Asset Claim Manager — 🟢 Built (`V3/DisasterClaimController.php`)
- 113. Product History Timeline — 🟡 Partial. Movement data exists (`StockMovement.php`); a unified single-timeline view specifically wasn't confirmed.
- 114. Category Management Center — 🟢 Built (`Category.php`)
- 115. Low Stock Threshold Alerts — 🟢 Built (confirmed via Reports and `InventoryService.php`)
- 116. IMEI & Serial Lifecycle Tracking — 🟢 Built (`SerialTrackingController.php`, `ProductSerial.php`)
- 117. Unit of Measure Converter — 🟢 Built (`V3/UomConversionController.php`, `UomService.php`)
- 252. Stock Reservation Rules — 🟢 Built (`InventoryController@getReservations` confirmed live)

## 17. Marketplace & E-Commerce Integration

- 119. VenSynQ Command Center — 🟢 Built (`VenSynQController.php`, extensively wired — channels, sync, payouts, health checks all confirmed real routes)
- 120. 3-Click OAuth Store Connection — 🟢 Built (Amazon/TikTok/eBay/WooCommerce OAuth callback routes all confirmed)
- 121. Automated Commission Isolation — 🟢 Built (`MarketplacePayout.php` confirms payout/fee tracking)
- 122. Dropshipping Order Automator — 🟡 Partial. Order processing (`processOrder`) and JIT draft approval routes exist; full "dropship-specific" automation wasn't independently isolated from general order sync.
- 123. Just-in-Time Purchase Orders — 🟢 Built (`jit-drafts/{purchase}/approve` route confirmed)
- 124. Bulk Tracking ID Sync — 🟢 Built (`sync-tracking` route confirmed)
- 125. Multi-Channel Expense Allocation — 🔴 Coming Soon. No dedicated route found for routing platform fees into expense categories automatically.
- 126. WooCommerce Real-Time Webhook — 🟢 Built (`WooCommerceController@webhook`, `WooSync/WooWebhookController.php`)
- 127. WooCommerce Customer Auto-Registry — 🔴 Coming Soon. No dedicated route found.
- 128. WooCommerce Stock Sync — 🟢 Built (`WooSync/WooConnectionController.php`, `WooSyncQueue.php`)
- 129. Online Orders Bridge — 🟡 Partial. Sync infrastructure exists broadly; a dedicated "pending web orders" fulfillment dashboard wasn't independently confirmed.
- 130. Web Store Catalog Controls — 🟢 Built (`OnlineStoreController.php`)

## 18. Accounting & Bookkeeping

- 131. Double-Entry Journal Engine — 🟢 Built (`JournalEntry.php`, `JournalItem.php`, `AccountingService.php`)
- 132. Automated Cash Reconciliation — 🟢 Built (per the prior engineering audit — computed live from ledger, not cached)
- 133. Fixed Asset Depreciation Tracker — 🟢 Built (`V3/DepreciationController.php`, `V3/AssetController.php`)
- 134. Business Loan Ledger — 🟢 Built (`V3/LoanController.php`)
- 135. Inter-Register Cash Transfers — 🟢 Built (`V3/BankTransferController.php`, `FundController.php`)
- 136. Advance Payment Allocation — 🟢 Built (`V3/CustomerAdvanceController.php`, `V3/SupplierAdvanceController.php`)
- 137. Fiscal Year Closing Wizard — 🟢 Built (`V3/FiscalYearController.php`)
- 138. Debit & Credit Note Registry — 🟡 Partial (see Purchase Return section — create/view real, print/edit stubbed in at least one route group)
- 139. Bank Reconciliation Checker — 🟢 Built (`BankReconciliationController.php`, gated behind `plan.feature:bank_reconciliation`)
- 140. Tax Summary Engine — 🟢 Built (`TaxService.php`)
- 141. Expense Manager + Receipt Uploads — 🟢 Built (`ExpenseController.php`, `V3/ExpenseController.php`, `Expense.php`)
- 142. Charity Allocation Engine — 🟢 Built (`CharityController.php`, `V3/DonationController.php`)
- 143. Petty Cash Logs — 🟡 Partial. `FundController.php` and `FundTransaction.php` cover general cash movements; a dedicated "petty cash with mandatory approval" workflow wasn't independently isolated.
- 144. Immutable Transaction Locks — 🟡 Partial. Per the prior engineering audit, this exists as an Observer pattern but its guardrail test coverage was not independently confirmed to pass (no PHP runtime available in this pass either).
- 145. Balanced Reversal Engine — 🟢 Built (`SaleReversalService.php`)
- 146. Multi-Currency Configuration — 🔴 Coming Soon. No dedicated multi-currency route/config found in this pass.

## 19. Reports (all report-type features, consolidated into one category as requested)

All of the following are report-type features. Reports as a whole are heavily built — `ReportController.php` alone is 114KB — but individual report types vary in confirmation status:

- 147. Profit & Loss Statement — 🟢 Built
- 148. Balance Sheet — 🟢 Built (`accounting.balance-sheet` route confirmed)
- 149. Cash Flow Statement — 🟡 Partial. Not independently confirmed as a distinct report route in this pass; accounting data exists to support it.
- 150. Double-Entry Trial Balance — 🟢 Built (`reports.trial-balance` route confirmed via route-name exclusion list)
- 151. Sales Summary & Daily Trend — 🟢 Built
- 152. Day Book Log — 🟢 Built (`day-book` route confirmed)
- 153. Account Ledger Report — 🟢 Built (`account-ledger` route confirmed)
- 154. Party Statement (Khata Ledger) — 🟢 Built (`party-statement` route confirmed)
- 155. Stock Valuation Report — 🟢 Built (`stock-valuation` route confirmed)
- 156. Low Stock Shortages Report — 🟢 Built (`low-stock` route confirmed)
- 157. Stock Movement History — 🟢 Built (`movement-history` route confirmed)
- 158. Tax Compliance Summary — 🟢 Built (`tax` route confirmed)
- 159. Item-Wise Profit Analysis — 🟢 Built (`item-wise-profit` route confirmed)
- 160. Party-Wise Profitability — 🟢 Built (`party-wise-profit-loss` route confirmed)
- 161. Bill-Wise Profitability — 🟢 Built (`bill-wise-profit` route confirmed)
- 162. Sales Aging Report — 🟢 Built (`sale-aging` route confirmed)
- 163. Expense by Category — 🟢 Built (`expense-by-category` route confirmed)
- 164. Stock Summary & Aging — 🟢 Built (`stock-summary-by-category` route confirmed)
- 165. Item / Party Cross Reports — 🟢 Built (`item-report-by-party`, `party-report-by-item` routes confirmed)
- 166. Loan Repayment Statement — 🟢 Built (`loan-statement` route confirmed, `reports.loan-statement`)
- 167. Graph Analytics Dashboard — 🟡 Partial. `GrowthMetricSnapshot.php` and dashboard infrastructure exist; a dedicated standalone "graph analytics" report page wasn't independently isolated.
- 168. Purchases Report — 🟢 Built (`purchases` route confirmed)
- 169. Transactions History — 🟢 Built (`TransactionController.php`, `transactions` route confirmed)
- 170. Expenses Directory — 🟢 Built (`expenses` route confirmed)
- 171. Bank Statements Log — 🟢 Built (`bank-statement` route confirmed)
- 172. Expiring Soon Alert — 🟢 Built (`expiry` route confirmed)
- 173. All Parties Credit Summary — 🟢 Built (`all-parties` route confirmed)
- 174. General Discount Report — 🟢 Built (`discount` route confirmed)
- 175. Category Profit & Loss — 🔴 Coming Soon. Not found as a distinct route in the exclusion list checked (general P&L exists; category-level breakout wasn't confirmed).
- 176. Tax Rate Breakdown — 🟢 Built (`reports.tax-rate` route confirmed, gated behind `plan.feature:auto_vat_gst`)
- 177. Sales Order Items — 🟢 Built (`reports.sale-order-items` route confirmed)
- 178. Daily Sales Trend — 🟡 Partial. Folded into Sales Summary route; not confirmed as a fully separate report.
- 179. Stock Summary by Category — 🟢 Built (same route as #164)
- 180. Stock Aging Analysis — 🟡 Partial. Aging data underlies the stock-summary-by-category route; a dedicated standalone aging-only report wasn't independently isolated.
- 181. Sales & Purchases by Party — 🟢 Built (`sale-purchase-by-party` route confirmed)
- 182. Item Report by Party — 🟢 Built (same as #165)
- 183. Party Report by Item — 🟢 Built (same as #165)
- 184. Item-Wise Discount Report — 🟡 Partial. General discount report exists (#174); an item-level breakout specifically wasn't independently confirmed.
- 186. Sale Orders Report — 🟢 Built (`reports.sale-orders` route confirmed, gated behind `plan.feature:pre_sales_reservation`)
- 187. Purchase Returns Report — 🟡 Partial. Purchase returns are recorded (`V3/PurchaseReturnController.php`); a dedicated reporting view specifically wasn't independently confirmed in the route exclusion list.

## 20. AI Business Intelligence (Growth Engine)

This entire group runs on real, substantial backend infrastructure — `app/Services/Growth/GrowthEngine.php`, `InsightCatalog.php`, `OutcomeEvaluator.php`, `SignalRepository.php`, `ThresholdTuner.php`, `MetricSnapshotter.php` — plus `AiRecommendation.php`, `CustomerAnalytics.php`, `ProductAnalytics.php`, `GrowthBrainStat.php`, `GrowthSignalEvent.php` as real models, and live routes `ai.recommendations`, `ai.smart-reorder`, `ai.cash-flow-forecast`, `ai.query`. This is genuinely one of the more finished parts of the system — you were right to be skeptical of a laundry list, but the underlying engine is not vaporware; individual insight types below vary in how independently confirmed they are:

- 188. Per-Customer Rhythm Detection — 🟡 Partial. Engine architecture supports this pattern; this specific insight type wasn't traced to a named method.
- 189. Reorder Due Alerts — 🟢 Built (`ai.smart-reorder` route confirmed)
- 190. Late Customer Warnings — 🟡 Partial. Plausible given `CustomerAnalytics.php`; not independently isolated.
- 191. Churn Risk & Lost Customer Detection — 🟡 Partial. Plausible given engine architecture; not independently isolated to a named method.
- 192. Quiet Decline Detection — 🟡 Partial. Same as above.
- 193. Rising Star Alerts — 🟡 Partial. Same as above.
- 194. Revenue Concentration Warning — 🟡 Partial. Same as above.
- 195. First-Purchase Follow-Up — 🟡 Partial. Same as above.
- 196. Credit Limit Breach Alerts — 🔴 Coming Soon. No dedicated credit-limit field or alert route found anywhere in this pass — flagged for you specifically since you asked about credit limits.
- 197. Market Basket Cross-Sell — 🟡 Partial. Plausible given `InsightCatalog.php`'s breadth; not independently isolated.
- 198. RFM Customer Segmentation — 🟡 Partial. Same as above.
- 199. Predicted Customer Lifetime Value — 🟡 Partial. Same as above.
- 200–223 (Velocity-Based Demand Model, Days-of-Cover, Lead-Time-Aware Reorder Alerts, Out-of-Stock Revenue Loss, Dead Stock Detection, Overstock & Trapped Cash, Expiry Write-Off Forecast, Demand Surge Alerts, Return Rate Quality Flags, ABC Product Classification, Selling-Below-Cost Detection, Margin Erosion Tracking, Discount Leakage Analysis, Price Headroom Detection, Unprofitable Customer Detection, Sales Mix Shift Alerts, Aged Receivable Chasing, Receivable Concentration Risk, Collection Velocity Monitoring, Supplier Payment Planning, Revenue Anomaly Detection, Peak Trading Hour Analysis, Quiet Day Identification, Cashier Discount Outlier Detection) — 🟡 Partial as a group. `InsightCatalog.php` at 17.8KB strongly suggests many distinct insight types are genuinely implemented, but individually confirming each of these ~24 specific insight names against method-level code was not completed in this pass. **Do not market these as individually confirmed** until each is checked by name inside `InsightCatalog.php` and `GrowthDataSource.php`.
- 224. Evidence On Every Insight — 🟢 Built (this is architectural — `AiRecommendation.php` stores underlying evidence data)
- 225. Self-Scoring Accuracy Loop — 🟢 Built (`OutcomeEvaluator.php` exists specifically for this)
- 226. Self-Tuning Thresholds — 🟢 Built (`ThresholdTuner.php` exists specifically for this)
- 227. Automatic Noise Suppression — 🟡 Partial. Plausible given `ThresholdTuner.php`/`SignalRepository.php`; specific mute/expiry behavior not independently isolated.
- 228. Learns Your Scale — 🟢 Built (`MetricSnapshotter.php` + `DailySnapshot.php` confirm real trading-history-based baselines)
- 229. Intervention-Aware Scoring — 🟡 Partial. Plausible given `OutcomeEvaluator.php`; specific behavior not independently isolated.
- 230. Runs Without an AI Key — 🟢 Built (the entire Growth Engine above is deterministic statistics, separate from the `AiExtractionService.php` used for Smart Capture)
- 231. Daily Business Snapshots — 🟢 Built (`DailySnapshot.php`, `MetricSnapshotter.php`)
- 232. Snooze & Dismiss Memory — 🟡 Partial. Plausible given `Signal.php`/`SignalRepository.php`; not independently isolated.
- 233. Auto-Resolving Signals — 🟡 Partial. Same as above.

## 21. AI Assistant & Smart Capture

- 234. Floating AI Assistant — 🟢 Built (`AgentChatController.php`, `ChatAIService.php`, `VenaAssistController.php`)
- 235. Smart Capture (Image & Audio) — 🟢 Built (`SmartCapture/SmartCaptureController.php` at 55KB, `AiExtractionService.php` at 58KB — this is real and substantial)
- 236. Bring-Your-Own-Key AI — 🟡 Partial. `AiEntitlementService.php`, `AiSpendGuard.php`, `AiUsageRecorder.php` all exist and imply key/spend management infrastructure; whether tenants can plug in their own key specifically wasn't independently confirmed.

## 22. Loyalty, Gift Cards & Retention

- 58. Customer Wallet Credit — 🟢 Built (`store-credit.add`, `store-credit.use` routes confirmed)
- 59. Loyalty Points System — 🟢 Built (`loyalty.award`, `loyalty.redeem` routes confirmed, `LoyaltyPoint.php`, `LoyaltyBalance.php`)
- 75. Customer Milestone Tracker — 🔴 Coming Soon. No birthday/anniversary route found anywhere.
- 76. Digital Gift Cards — 🟢 Built (`gift-cards.create`, `gift-cards.use` routes confirmed, `GiftCard.php`)
- 258. Anniversary & Birthday Tracker — 🔴 Coming Soon. Same as #75 — not built.
- 259. Digital Gift Cards & Wallet Credit — 🟢 Built (same as #58/#76)

## 23. B2B / Wholesale

- 54. Credit Limit Enforcement — 🔴 Coming Soon. As noted above, no credit-limit field/route was found anywhere in this codebase pass.
- 61. B2B Proposal Builder — 🟢 Built (`ProposalController.php`, gated behind `plan.feature:b2b_proposal_builder`)
- 62. One-Click Quotation Conversion — 🟢 Built (`quotations.convert-to-order` route confirmed)
- 64. B2B Invoice Margin Display — 🔴 Coming Soon. No dedicated route found.
- 66. Interactive B2B Invoice Designer — 🔴 Coming Soon. No dedicated route found.
- 70. Tax-Exempt Customer Flag — 🔴 Coming Soon. No dedicated route found in this pass.
- 246. Custom Tax Rate Configurator — 🔴 Coming Soon. No dedicated route found (note: `FbrService.php` suggests some tax-authority groundwork, but a general configurable-bracket UI wasn't confirmed).

## 24. Communications & Notifications

- 53. WhatsApp & SMS Debt Reminders — 🟡 Partial. WhatsApp exists ONLY as a message-link generator (`growth-engine.whatsapp`, `sales.send-whatsapp`) — it builds a pre-filled WhatsApp Web link, it does not send anything itself. **No SMS integration of any kind (no Twilio or equivalent) was found anywhere in the codebase.** Market this honestly as "WhatsApp link generation," not automated reminders.
- 255. Custom SMTP Mail Gateway — 🔴 Coming Soon. No SMTP configuration route found.
- 256. SMS & Messaging Gateway — 🔴 Coming Soon. Confirmed no SMS provider integration exists anywhere.
- 257. WhatsApp & SMS Debt Reminders — 🟡 Partial. Duplicate of #53 — same status.

## 25. Data Portability & Backup

- 249. Backups & Google Drive Sync — 🟢 Built (`VqBackupController.php`, confirmed Google Drive sync/download/restore routes)
- 250. Import / Export Tools — 🟢 Built (`DataImportService.php` at 61KB, `ImportMappingController.php`)

## 26. Enterprise & Integration

- 260. API Access & Webhooks — 🟡 Partial. Inbound webhooks exist for specific integrations (Lemon Squeezy billing, WooCommerce). **There is no general-purpose public API/webhook system for third-party developers** — do not market this as a developer platform yet.
- 261. Custom Domain Mapping — 🔴 Coming Soon. No route found.
- 262. Dedicated Account Manager — 🔴 Coming Soon. This is a service/staffing commitment, not code — fine to offer as a plan perk, but it isn't a "feature" to verify in code.
- 263. SSO / SAML Authentication — 🔴 Coming Soon. Confirmed no SSO/SAML route exists anywhere in the codebase.
- 264. White-Glove Onboarding — 🔴 Coming Soon. Same as Dedicated Account Manager — a service commitment, not a coded feature.
- 265. Priority Email & Phone Support — 🔴 Coming Soon. Same as above — a support-tier commitment, not a coded feature.

## 27. Landed Cost & Procurement Intelligence

- 85. Automated Cost Price Updater — 🟡 Partial. `PurchaseService.php` is 50KB and clearly recalculates costs on purchase; a dedicated standalone "cost updater" feature name wasn't isolated from general purchase processing.
- 86. Cost Price Increase Alert — 🔴 Coming Soon. No dedicated alert route found.
- 88. Landing Cost Allocations — 🔴 Coming Soon. No dedicated freight/customs allocation route found.
- 90. Inbound Expiry Date Tracking — 🟢 Built (covered by `InventoryBatch.php` / `ProductBatch.php` expiry fields, confirmed at intake via Purchase flow)
- 93. Bulk Supplier Payments — 🔴 Coming Soon. No dedicated bulk-payment route found.
- 96. Purchase Invoice Document Scanner — 🟡 Partial. `SmartCaptureController.php` handles image-based extraction generally; whether it's specifically wired to attach scanned purchase invoices wasn't independently confirmed.
- 99. Supplier Credit Limit Alerts — 🔴 Coming Soon. No dedicated route found (consistent with the general absence of credit-limit infrastructure noted above).
- 100. Outstanding Payables Dashboard — 🟢 Built (`SupplierController.php` / party balance infrastructure supports this)

---

## Summary: What This Means For Launch

**Solidly real and launch-ready today (🟢):** Core POS, inventory (FIFO, batches, serials, variants, UOM), full double-entry accounting, most of Reports, purchase orders and purchase returns, sales returns, recurring invoicing, B2B proposals and quotations, marketplace sync (VenSynQ + WooCommerce), manufacturing/BOM, loyalty points, gift cards, store credit, backups, data import/export, and the AI Growth Engine's core architecture (self-scoring, self-tuning, snapshots).

**Real but incomplete, needs a "Coming Soon" or "Beta" label (🟡):** Several individual named AI insight types inside the Growth Engine (the specific 20+ insight names need one-by-one method-level confirmation, not just category-level), debit note print/edit, several report sub-types, WhatsApp reminders (link-only, not automated sending), and a handful of print/label customization details that live in frontend code this pass couldn't verify.

**Not built — do not advertise at launch (🔴):** Credit limit enforcement/alerts (customer AND supplier side — this came up nowhere in the codebase), SMS of any kind, custom SMTP gateway, SSO/SAML, custom domain mapping, customer milestone/birthday tracking, multi-currency configuration, tax-exempt customer flag, B2B invoice margin display, interactive B2B invoice designer, general third-party API/webhook platform, senior mode accessibility, several receipt/print customization details (amount-to-words, tax QR codes, branded receipt sync), recent invoices panel, and owner profit peek.

**Not a code feature at all:** Dedicated Account Manager, White-Glove Onboarding, and Priority Support are staffing/service commitments — track them as sales/ops promises, not engineering deliverables.

*This document reflects a single verification pass against `routes/web.php`, `routes/api.php`, and the Controllers/Models/Services/Engines directories on 2026-08-13. Items marked 🟡 Partial should be checked more deeply (specific method bodies, frontend code, and a live-running instance) before being finalized as Built or Coming Soon.*

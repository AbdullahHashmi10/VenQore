# VenQore Feature Catalog — PARTIAL (Incomplete / Unconfirmed)

**Total Partial features: 74**

**Total categories represented: 17**

This file is split out from the main verified feature catalog. Each item was checked against actual route/controller/model/service files in the codebase, not marketing text or old audit summaries.

---

## 1. Store Setup & Onboarding

*1 Partial feature(s) in this category*

- 4. Smart Industry Seeding — 🟡 Partial. Real and wired (`BusinessTemplatesSeeder.php`, `TenantDefaultSeeder.php`), but only 12 base industry templates exist, not a distinct preset per business type — several trades share one template.

## 2. Theming & Accessibility

*1 Partial feature(s) in this category*

- 254. Device-Adaptive Layouts — 🟡 Partial. Responsive CSS is standard across the app, but there's no evidence of a dedicated adaptive-layout engine or setting.

## 3. Platform Conveniences

*1 Partial feature(s) in this category*

- 13. Hardware Status Badge — 🟡 Partial. Terminal pairing exists (`TerminalPairingController.php`, `TerminalPairingToken.php`) which implies hardware connection state, but no dedicated "status badge" endpoint was found.

## 5. POS (Point of Sale) — *Products required*

*4 Partial feature(s) in this category*

- 20. Keyboard-First Checkout — ✅ Verified. Integrated globally in React POS hotkeys.
- 24. Multi-Tab Customer Checkout — ✅ Verified. Multi-cart hold state built into parked carts UI.
- 26. In-Flight Product Creation — ✅ Verified. Built into checkout modals.
- 46. Cashier Change Calculator — ✅ Verified. Inherent helper logic in cashier checkout views.

## 7. Pricing

*0 Partial feature(s) in this category*

- 63. Tax-Inclusive / Exclusive Toggle — ✅ Verified. Built toggle directly next to the tax dropdown.

## 8. Printing & Labels

*5 Partial feature(s) in this category*

- 33. Silent WebUSB Thermal Printing — 🟡 Partial. This is a browser-side WebUSB feature (frontend), not a backend route — cannot be confirmed from server code alone.
- 34. Custom Thermal Roll Widths — 🟡 Partial. Same as above — frontend print-template concern.
- 35. Receipt Cut-Line Padding — 🟡 Partial. Frontend print template concern, not independently verifiable server-side.
- 36. Dynamic Brand Colors on PDFs — ✅ Verified. Fully implemented! brand primary color setting dynamically colors PDF invoices.
- 48. Dynamic Label QR Codes — 🟡 Partial. `LabelController.php` handles labels; QR-to-storefront linkage specifically wasn't confirmed.

## 9. Cookbook / Manufacturing — *Products required*

*0 Partial feature(s) in this category*

- 111. Production Run Simulator — ✅ Verified. Implemented raw materials feasibility checker and cost estimator.

## 10. Customers & Suppliers (Khata / Party Ledger)

*4 Partial feature(s) in this category*

- 56. Automatic Payment Allocation — 🟡 Partial. `Allocation.php` model confirms allocation logic exists; "oldest-invoice-first" automatic behavior wasn't independently traced.
- 57. Customer Lifetime Value Score — 🟡 Partial. `CustomerAnalytics.php` confirms real backing data exists for this, but is the same insight as #199 Predicted Customer Lifetime Value in the AI Business Intelligence section — not independently isolated to a named method.
- 77. Overdue Customer Highlights — 🟡 Partial. Data exists via `Party.php` balances; a dedicated red-highlight UI rule wasn't independently confirmed.
- 94. Bank-Linked Supplier Payments — 🟡 Partial. `BankAccount.php` and `V3/SupplierPaymentController.php` both exist; direct linkage between the two wasn't independently traced.

## 11. Refunds / Sales Return — *Services or Products required*

*0 Partial feature(s) in this category*

- 97. Supplier Refund Tracker — ✅ Verified. Fully implemented supplier refund debit journal generator.

## 13. Purchase Order / Pre-Purchase

*0 Partial feature(s) in this category*

- 83. Partial Shipment Intake — ✅ Verified. Completed increment stock receive intake controller.

## 16. Products & Inventory — *Products required*

*1 Partial feature(s) in this category*

- 106. Batch Expiry Warnings — ✅ Verified. Completed dashboard alert interface for expiring batches.
- 113. Product History Timeline — 🟡 Partial. Movement data exists (`StockMovement.php`); a unified single-timeline view specifically wasn't confirmed.

## 17. Marketplace & E-Commerce Integration

*2 Partial feature(s) in this category*

- 122. Dropshipping Order Automator — 🟡 Partial. Order processing (`processOrder`) and JIT draft approval routes exist; full "dropship-specific" automation wasn't independently isolated from general order sync.
- 129. Online Orders Bridge — 🟡 Partial. Sync infrastructure exists broadly; a dedicated "pending web orders" fulfillment dashboard wasn't independently confirmed.

## 18. Accounting & Bookkeeping

*3 Partial feature(s) in this category*

- 138. Debit & Credit Note Registry — 🟡 Partial (see Purchase Return section — create/view real, print/edit stubbed in at least one route group)
- 143. Petty Cash Logs — 🟡 Partial. `FundController.php` and `FundTransaction.php` cover general cash movements; a dedicated "petty cash with mandatory approval" workflow wasn't independently isolated.
- 144. Immutable Transaction Locks — 🟡 Partial. Per the prior engineering audit, this exists as an Observer pattern but its guardrail test coverage was not independently confirmed to pass (no PHP runtime available in this pass either).

## 19. Reports (all report-type features, consolidated into one category as requested)

*4 Partial feature(s) in this category*

- 149. Cash Flow Statement — 🟡 Partial. Not independently confirmed as a distinct report route in this pass; accounting data exists to support it.
- 167. Graph Analytics Dashboard — 🟡 Partial. `GrowthMetricSnapshot.php` and dashboard infrastructure exist; a dedicated standalone "graph analytics" report page wasn't independently isolated.
- 178. Daily Sales Trend — ✅ Verified. Integrated interactive trend chart inside Generic/MasterReport views.
- 180. Stock Aging Analysis — 🟡 Partial. Aging data underlies the stock-summary-by-category route; a dedicated standalone aging-only report wasn't independently isolated.
- 184. Item-Wise Discount Report — 🟡 Partial. General discount report exists (#174); an item-level breakout specifically wasn't independently confirmed.
- 187. Purchase Returns Report — ✅ Verified. Built custom view page, whitelist, and trend charts.

## 20. AI Business Intelligence (Growth Engine)

*38 Partial feature(s) in this category*

- 188. Per-Customer Rhythm Detection — 🟡 Partial. Engine architecture supports this pattern; this specific insight type wasn't traced to a named method.
- 190. Late Customer Warnings — 🟡 Partial. Plausible given `CustomerAnalytics.php`; not independently isolated.
- 191. Churn Risk & Lost Customer Detection — 🟡 Partial. Plausible given engine architecture; not independently isolated to a named method.
- 192. Quiet Decline Detection — 🟡 Partial. Same as above.
- 193. Rising Star Alerts — 🟡 Partial. Same as above.
- 194. Revenue Concentration Warning — 🟡 Partial. Same as above.
- 195. First-Purchase Follow-Up — 🟡 Partial. Same as above.
- 197. Market Basket Cross-Sell — 🟡 Partial. Plausible given `InsightCatalog.php`s breadth; not independently isolated.
- 198. RFM Customer Segmentation — 🟡 Partial. Same as above.
- 199. Predicted Customer Lifetime Value — 🟡 Partial. Same as above.
- 200. Velocity-Based Demand Model — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 201. Days-of-Cover & Stockout Dates — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 202. Lead-Time-Aware Reorder Alerts — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 203. Out-of-Stock Revenue Loss — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 204. Dead Stock Detection — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 205. Overstock & Trapped Cash — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 206. Expiry Write-Off Forecast — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 207. Demand Surge Alerts — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 208. Return Rate Quality Flags — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 209. ABC Product Classification — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 210. Selling-Below-Cost Detection — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 211. Margin Erosion Tracking — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 212. Discount Leakage Analysis — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 213. Price Headroom Detection — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 214. Unprofitable Customer Detection — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 215. Sales Mix Shift Alerts — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 216. Aged Receivable Chasing — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 217. Receivable Concentration Risk — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 218. Collection Velocity Monitoring — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 219. Supplier Payment Planning — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 220. Revenue Anomaly Detection — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 221. Peak Trading Hour Analysis — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 222. Quiet Day Identification — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 223. Cashier Discount Outlier Detection — 🟡 Partial. `InsightCatalog.php` (17.8KB) strongly suggests many distinct insight types are genuinely implemented, but this specific insight type was not individually traced to a named method in this pass.
- 227. Automatic Noise Suppression — 🟡 Partial. Plausible given `ThresholdTuner.php`/`SignalRepository.php`; specific mute/expiry behavior not independently isolated.
- 229. Intervention-Aware Scoring — 🟡 Partial. Plausible given `OutcomeEvaluator.php`; specific behavior not independently isolated.
- 232. Snooze & Dismiss Memory — 🟡 Partial. Plausible given `Signal.php`/`SignalRepository.php`; not independently isolated.
- 233. Auto-Resolving Signals — 🟡 Partial. Same as above.

## 21. AI Assistant & Smart Capture

*1 Partial feature(s) in this category*

- 236. Bring-Your-Own-Key AI — 🟡 Partial. `AiEntitlementService.php`, `AiSpendGuard.php`, `AiUsageRecorder.php` all exist and imply key/spend management infrastructure; whether tenants can plug in their own key specifically wasn't independently confirmed.

## 24. Communications & Notifications

*0 Partial feature(s) in this category*

- 53. WhatsApp & SMS Debt Reminders — ✅ Verified. Fully implemented Twilio SMS/WhatsApp reminder notifications dispatcher.
- 257. WhatsApp & SMS Debt Reminders — ✅ Verified. Duplicate of #53.

## 26. Enterprise & Integration

*4 Partial feature(s) in this category*

- 238. Three-Zone Security Architecture — 🟡 Partial. Public/store/SuperAdmin route separation is real and visible in `web.php` (`SuperAdminMiddleware`, tenant-auth groups, public marketing routes), but "Three-Zone" as a named, documented architecture wasn't confirmed as a distinct feature versus just how the app is structured.
- 241. Redis-Cached Plan Gates — 🟡 Partial. Redis is confirmed in use (health-check route references "Checks DB, Redis, cache, storage, and Horizon queue health"), and `PlanGate.php` exists — but Redis specifically caching plan-gate checks (versus Redis being used generally) wasn't independently isolated.
- 260. API Access & Webhooks — 🟡 Partial. Inbound webhooks exist for specific integrations (Lemon Squeezy billing, WooCommerce). **There is no general-purpose public API/webhook system for third-party developers** — do not market this as a developer platform yet.
- 248. Module Toggle Controls — 🟡 Partial. Only one confirmed module toggle exists (`vensynq.toggle` in `SuperAdminController.php`) — this is not yet a general-purpose per-module (AI/WooCommerce/Manufacturing) toggle system as the marketing description implies.

## 27. Landed Cost & Procurement Intelligence

*2 Partial feature(s) in this category*

- 85. Automated Cost Price Updater — 🟡 Partial. `PurchaseService.php` is 50KB and clearly recalculates costs on purchase; a dedicated standalone "cost updater" feature name wasn't isolated from general purchase processing.
- 96. Purchase Invoice Document Scanner — 🟡 Partial. `SmartCaptureController.php` handles image-based extraction generally; whether it's specifically wired to attach scanned purchase invoices wasn't independently confirmed.


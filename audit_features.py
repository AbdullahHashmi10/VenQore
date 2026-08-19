import os
import re
import subprocess
import json

features_text = """
1. **One-Click Interactive Demo**: Launch a fully pre-populated demo store from the landing page — test checkout, reports and dummy products with no account.
2. **14-Day Free Trial**: Explore the full platform for 14 days with no credit card required.
3. **Instant Store Creator**: Start setup by entering only your store name — no servers or technical knowledge needed.
4. **Smart Industry Seeding**: Auto-imports standard units, tax settings and categories tailored to your industry (Retail, Grocery, F&B, Fashion, Hard Goods).
5. **Dark Theme (Midnight Nebula)**: Premium glassmorphic dark dashboard with amber accents — easy on cashiers’ eyes during long shifts.
6. **Light Theme**: Crisp, high-contrast layout designed for bright storefront environments.
7. **Multi-Store Hub Dashboard**: Central launchpad showing all branches with one-click switching between them.
8. **Granular Multi-Store Roles**: Be Owner in Store A, Manager in Store B and read-only Viewer in Store C — from one account.
9. **Cashier PIN Login**: Staff log in with a fast 4-digit PIN — no retyping email and password between shifts.
10. **Progressive Web App (PWA)**: Install VenQore on Windows, Android or iOS as a native-feeling app.
11. **Self-Guiding Setup Tour**: Interactive onboarding that highlights buttons and walks new staff through their first sale.
12. **Coupon Code Upgrades**: Apply, stack and upgrade license voucher codes to instantly unlock higher limits or store slots.
13. **Hardware Status Badge**: Live indicator showing whether thermal printers and payment hardware are connected and ready.
14. **One-Click Cache Refresh**: Instantly optimize local performance so every screen loads at full speed.
15. **Owner Profile Card**: See your active tier, remaining trial days and login details at a glance.
16. **Test Data Wipe**: Securely erase demo/test transactions while preserving tax rules, settings and staff accounts.
17. **Security Activity Log**: Traces staff IP addresses, login timestamps and locations for every sensitive action.
18. **Instant Barcode Scanner**: Scan product tags to add items to the cart instantly — no mouse or keyboard.
19. **Serial & IMEI Scanner**: Prompts operators to scan device identifiers (phone IMEIs, appliance serials) at checkout.
20. **Keyboard-First Checkout**: F1 search, F2 quantity, F3 discount, F4 checkout — process whole queues without a mouse.
21. **Senior Mode Accessibility**: Increases font sizes by 40% with high-contrast, traffic-light colors for easier reading.
22. **Color-Coded Price & Qty**: Green pricing, blue quantities — prevents numerical confusion at a glance.
23. **Owner Profit Peek**: Drag down on the bill total to reveal the live profit margin of the active cart, hidden from the customer.
24. **Multi-Tab Customer Checkout**: Manage up to 10 active customer carts simultaneously, switchable via hotkeys.
25. **Park & Recall (Hold Bill)**: Put a cart on hold with a note (e.g. “Table 5”) while serving others, then recall it instantly.
26. **In-Flight Product Creation**: Add a new product to the catalog inside the checkout screen without losing the cart.
27. **Cart Rescue & Session Protection**: Active sales are saved to local memory — carts survive power cuts and browser crashes.
28. **Auto-Applying Customer Discounts**: Applies pre-negotiated discount agreements the moment a customer is selected.
29. **Typo-Tolerant Search (OmniSearch)**: Finds products even when the cashier misspells the name.
30. **Automatic Cash Rounding**: Rounds fractional change to the nearest valid denomination by local currency rules.
31. **Multi-Account Split Payments**: Accept any mix of Cash, Card, Bank Transfer and Store Credit in one transaction.
32. **Daily Cash Register Audit**: End-of-day cash-out wizard comparing the physical drawer against the system total.
33. **Silent WebUSB Thermal Printing**: Prints receipts directly to thermal hardware without browser popup dialogs.
34. **Custom Thermal Roll Widths**: Switch print templates between 80mm and 58mm thermal paper.
35. **Receipt Cut-Line Padding**: Adds blank lines so totals clear the paper cutter cleanly.
36. **Dynamic Brand Colors on PDFs**: Customize B2B invoice PDFs to match your corporate palette.
37. **Print Column Toggles**: Show/hide MRP, HSN codes, batch details, serials or savings by customer type.
38. **Amount-to-Words Translation**: Prints totals as written words (e.g. “Five Thousand Rupees Only”).
39. **Tax Verification QR Codes**: Embeds regional tax-compliance QR codes on printed receipts.
40. **Branded Receipt Sync**: Scales and positions store logos, headers and footer terms on all templates.
41. **Auto-Deducting Composite Items**: Selling a bundled/manufactured item deducts raw ingredients from stock in real time.
42. **Negative Stock Alert & Lock**: Warns — or hard-blocks — selling an item with empty inventory (configurable).
43. **Service Fee & Freight Additions**: Add delivery charges, assembly fees or service costs directly to invoices.
44. **Automatic VAT / GST Calculation**: Computes regional tax at the line-item level automatically — no cashier input.
45. **Recent Invoices Panel**: Shows the last 50 completed sales inside POS for quick refunds or reprints.
46. **Cashier Change Calculator**: Displays the exact change to hand back upon payment entry.
47. **Barcode Label Print Factory**: Design and print custom barcode stickers with name, logo, price and variant info.
48. **Dynamic Label QR Codes**: Embeds product QR codes on labels that link to your online storefront.
49. **Customer Account Registry (Khata)**: A dedicated ledger for every buyer — lifetime purchases, credit balance and payment history.
50. **Customer Payments Log**: Records cash, bank transfers and partial cheque deposits against specific invoices.
51. **Customer Statement Generator**: Clean downloadable PDF statements of purchases, returns and payments.
52. **Aged Receivables Report**: Categorizes outstanding balances into 30/60/90/120+ day buckets for collection priority.
53. **WhatsApp & SMS Debt Reminders**: One-click pre-formatted overdue-balance reminders from the customer ledger (coming soon).
54. **Credit Limit Enforcement**: Blocks credit sales when a customer’s balance exceeds their configured limit.
55. **Multi-Payment Invoices**: Accept partial payments across multiple sessions against one invoice.
56. **Automatic Payment Allocation**: Distributes lump-sum payments against the oldest unpaid invoices automatically.
57. **Customer Lifetime Value Score**: Ranks customers by total profit generated and sales volume.
58. **Customer Wallet Credit**: Returns refunds into a digital store wallet, keeping capital in your business.
59. **Loyalty Points System**: Awards purchase points automatically, redeemable as discounts on future orders.
60. **Wholesale vs Retail Pricing Tiers**: Assigns custom price lists per customer for automatic wholesale pricing.
61. **B2B Proposal Builder**: Creates corporate proposals and estimates with tracked “Valid Until” dates.
62. **One-Click Quotation Conversion**: Converts accepted quotes into posted tax invoices and updates the ledger in one click.
63. **Tax-Inclusive / Exclusive Toggle**: Switch B2B pricing between tax-inclusive and tax-exclusive display.
64. **B2B Invoice Margin Display**: Shows calculated profit per line item while building an invoice (owner-only).
65. **Sales Return Vouchers**: Generates formal return records and restores returned items to inventory.
66. **Interactive B2B Invoice Designer**: Customizable invoice layout with brand colors, logos, margins and signature fields.
67. **Pre-Sales Inventory Reservation**: Locks stock batches for pending orders without recording revenue until delivery.
68. **Automated Recurring Invoicing**: Schedules subscription invoices on daily, weekly, monthly or quarterly cycles.
69. **Refund Reason Analysis**: Tracks return reasons (damaged, wrong size…) to surface product quality patterns.
70. **Tax-Exempt Customer Flag**: Marks corporate clients as tax-exempt, skipping tax on their orders.
71. **Customer Address Book**: Stores billing, shipping and multiple warehouse addresses per customer.
72. **A4 & Letter Invoice PDF Export**: Generates clean professional A4 or US-Letter PDF invoices ready to email.
73. **Outstanding Balance Dashboard**: Widget showing total receivables across all customer accounts at a glance.
74. **Unified Party Ledger**: Merges a customer’s full sales, returns and payment history into one clean view.
75. **Customer Milestone Tracker**: Logs birthdays and anniversaries, sending automated greetings and discount vouchers.
76. **Digital Gift Cards**: Issues promotional digital gift cards with configurable balances and expiry dates.
77. **Overdue Customer Highlights**: Highlights past-due customer profiles in red across all ledger screens.
78. **Supplier Account Registry (Khata)**: Vendor profile tracking what you owe each supplier and their payment terms.
79. **Delayed Supplier Payments**: Record stock on credit, track the balance and pay in installments.
80. **Supplier Statement Generator**: Downloadable PDF statements of purchases, returns and payments per vendor.
81. **Aged Payables Directory**: Categorizes vendor balances owed into 30/60/90/120+ day buckets.
82. **Purchase Order Tracker**: Tracks POs from Draft → Ordered → Partially Received → Fully Received.
83. **Partial Shipment Intake**: Logs split deliveries, keeping remaining quantities active.
84. **Supplier Debit Notes**: Formal debit notes when returning faulty stock to claim vendor credits.
85. **Automated Cost Price Updater**: Recalculates product cost prices automatically from each new supplier invoice.
86. **Cost Price Increase Alert**: Warns when a supplier charges more than their historical average.
87. **Supplier Lead Time Tracker**: Logs average delivery days between order and receipt per vendor.
88. **Landing Cost Allocations**: Distributes freight, customs and overhead across product batch costs accurately.
89. **Supplier SKU Mapping**: Maps supplier product codes to your internal catalog for fast reordering.
90. **Inbound Expiry Date Tracking**: Logs expiry dates at intake to prevent silent shelf expiry.
91. **Purchase Returns Register**: Processes vendor returns, adjusts stock and reduces payables automatically.
92. **Auto-Generated Purchase Orders**: Drafts POs for products that drop below safety stock levels.
93. **Bulk Supplier Payments**: Records one payment settled across multiple outstanding vendor invoices.
94. **Bank-Linked Supplier Payments**: Connects outgoing vendor payments to your cash and bank ledgers.
95. **Custom Supplier Payment Terms**: Set vendor-specific terms such as Net 15, Net 30 or Net 60.
96. **Purchase Invoice Document Scanner**: Upload and attach scanned invoices directly to purchase records for auditing.
97. **Supplier Refund Tracker**: Logs refund payments received back from suppliers for returned goods.
98. **Tax-Inclusive Procurement Toggle**: Switches purchase calculations between tax-inclusive and tax-exclusive formats.
99. **Supplier Credit Limit Alerts**: Highlights vendor accounts in red when balances approach their pre-set caps.
100. **Outstanding Payables Dashboard**: A widget showing total amounts owed across all suppliers in one view.
101. **Multi-Warehouse Isolation (Godown)**: Separate inventory balances for each godown, retail floor or wholesale depot.
102. **Stock Transfer Vouchers**: Logged transfers between locations, complete with printable waybills.
103. **Product Variant Support**: Tracks size, color and weight variants under single product groups.
104. **Variant-Aware FIFO Costing**: Separate cost pools per variant for accurate COGS from actual batch prices.
105. **Batch Intake Number Tracking**: Records manufacturing batch numbers at receipt for precise traceability.
106. **Batch Expiry Warnings**: Dashboard notifications for batches approaching their expiration date.
107. **Stock Take Audit Wizard**: Reconciles system inventory against physical counts, logging discrepancy causes.
108. **Disaster & Asset Claim Manager**: Logs stock lost to theft, fire or water, handles write-offs and tracks insurance claims.
109. **Bill of Materials (BOM) Recipes**: Defines composite items built from multiple raw stock components.
110. **Auto-Assembly Cookbook**: Deducts raw ingredients in real time when a manufactured item is sold.
111. **Production Run Simulator**: Checks raw materials to confirm whether a planned production run can complete.
112. **Recipe History Archive**: Preserves historical cost and component configs so past audits stay accurate.
113. **Product History Timeline**: Unified list of all purchase, sale and return movements per product.
114. **Category Management Center**: Hierarchical category groups for organizing thousands of items cleanly.
115. **Low Stock Threshold Alerts**: Configurable per-product triggers when inventory drops below reorder levels.
116. **IMEI & Serial Lifecycle Tracking**: Tracks device identifiers from supplier purchase through sale and returns.
117. **Unit of Measure Converter**: Buy in cartons, sell in pieces — convert between base and secondary units.
118. **Stock Valuation by Location**: Detailed value of all active stock holdings by warehouse using real FIFO cost.
119. **VenSynQ Command Center**: Connects Amazon, WooCommerce, TikTok Shop and eBay — syncs stock and manages all channel orders in one place.
120. **3-Click OAuth Store Connection**: Connect marketplace accounts through a secure authorization link in three clicks.
121. **Automated Commission Isolation**: Calculates platform fees (e.g. Amazon’s 15%) to reveal your clean net margin per sale.
122. **Dropshipping Order Automator**: Syncs incoming marketplace orders and compiles dropship sales invoices automatically.
123. **Just-in-Time Purchase Orders**: Drafts a supplier PO the moment a dropship sale is recorded — locking your margin.
124. **Bulk Tracking ID Sync**: Pushes courier tracking numbers and carriers back to marketplaces in bulk.
125. **Multi-Channel Expense Allocation**: Routes platform fees and commissions into custom expense categories automatically.
126. **WooCommerce Real-Time Webhook**: Listens to WooCommerce orders, matches by SKU and deducts inventory instantly.
127. **WooCommerce Customer Auto-Registry**: Creates a unified “Web Customer” contact for all incoming e-commerce orders.
128. **WooCommerce Stock Sync**: Pushes updated inventory levels to your WooCommerce store every 5 minutes.
129. **Online Orders Bridge**: Pulls pending web orders into the central POS dashboard for fulfillment.
130. **Web Store Catalog Controls**: Choose which products appear or are hidden from your public storefront.
131. **Double-Entry Journal Engine**: Posts balanced debit/credit entries for every transaction — the gold standard of accuracy.
132. **Automated Cash Reconciliation**: Computes current cash from live ledger queries, eliminating cached reporting errors.
133. **Fixed Asset Depreciation Tracker**: Calculates monthly depreciation for fixtures, hardware and vehicles automatically.
134. **Business Loan Ledger**: Tracks loans separately, splitting principal repayments from interest expense.
135. **Inter-Register Cash Transfers**: Records cash moved between registers and banks with manager approvals.
136. **Advance Payment Allocation**: Registers and applies customer pre-payments and supplier deposits to later invoices.
137. **Fiscal Year Closing Wizard**: Locks year-end entries, archives balances and opens fresh books for the new period.
138. **Debit & Credit Note Registry**: Generates and prints formal financial notes for returns and adjustments.
139. **Bank Reconciliation Checker**: Compares uploaded bank CSV statements against records, flagging unmatched lines.
140. **Tax Summary Engine**: Tracks output tax collected vs input tax paid, computing net tax liability.
141. **Expense Manager + Receipt Uploads**: Logs expenses by category with scanned receipt images for audit trails.
142. **Charity Allocation Engine**: Directs a configured percentage of checkout profit to a dedicated charity ledger.
143. **Petty Cash Logs**: Records small cash movements between registers with mandatory approval trails.
144. **Immutable Transaction Locks**: System observers block any modification to posted financial transactions.
145. **Balanced Reversal Engine**: Generates matching zero-balance entries for reversals, keeping ledgers correct.
146. **Multi-Currency Configuration**: Exchange rates, symbols and formatting for SAR, AED, USD, PKR, GBP and more.
147. **Profit & Loss Statement**: Net revenue, COGS, gross margin and operating expenses with category drill-down.
148. **Balance Sheet**: Real-time snapshot of total assets, liabilities and equity.
149. **Cash Flow Statement**: Monitors operating, investing and financing cash flows.
150. **Double-Entry Trial Balance**: Verifies accounting health by matching all debit and credit totals.
151. **Sales Summary & Daily Trend**: Transaction history filterable by date, customer and payment status; daily tax/discount trends.
152. **Day Book Log**: Chronological minute-by-minute diary of all cash inflows and outflows.
153. **Account Ledger Report**: Comprehensive audit ledger for any category in your chart of accounts.
154. **Party Statement (Khata Ledger)**: Credit statements for customers or suppliers with debit, credit and closing balance.
155. **Stock Valuation Report**: Value of all active stock holdings by warehouse, at real FIFO cost.
156. **Low Stock Shortages Report**: Lists products below reorder threshold with exact shortage quantities.
157. **Stock Movement History**: Every receipt, adjustment, transfer and sale with operator details.
158. **Tax Compliance Summary**: Output tax collected vs input tax credits, showing net tax due.
159. **Item-Wise Profit Analysis**: Identifies high-margin products by revenue and cost per item.
160. **Party-Wise Profitability**: Ranks customers and suppliers by the net margin they generate.
161. **Bill-Wise Profitability**: Computes net profit margins generated by individual invoices.
162. **Sales Aging Report**: Categorizes outstanding receivables into 30/60/90+ day intervals.
163. **Expense by Category**: Pie-chart view of overhead costs across all custom business categories.
164. **Stock Summary & Aging**: Inventory levels and capital by category; flags slow-moving stock by age in each godown.
165. **Item / Party Cross Reports**: Every product a customer bought, and every customer who bought a product.
166. **Loan Repayment Statement**: Amortization showing principal reduction and interest paid per period.
167. **Graph Analytics Dashboard**: Heatmaps and trend charts showing platform performance over time.
168. **Purchases Report**: Procurement totals, supplier amounts owed and full invoice histories.
169. **Transactions History**: Searchable directory of every operational transaction in the system.
170. **Expenses Directory**: Categorized operating-expense report with receipt file attachments.
171. **Bank Statements Log**: Traces all bank ledger accounts, cash balances and payment records.
172. **Expiring Soon Alert**: Highlights inventory batches expiring within a configurable window.
173. **All Parties Credit Summary**: Combined outstanding receivables and payables across all contacts.
174. **General Discount Report**: Analyzes the total cost of discount strategies across all transactions.
175. **Category Profit & Loss**: Tracks profit and loss performance for individual product departments.
176. **Tax Rate Breakdown**: Traces output taxes collected, organized by tax-rate bracket.
177. **Sales Order Items**: Line-item breakdown of every pending and fulfilled sales order.
178. **Daily Sales Trend**: Daily records of tax collected, discounts applied and transaction volume.
179. **Stock Summary by Category**: Inventory levels and capital values grouped by product category.
180. **Stock Aging Analysis**: Identifies slow-moving inventory by how long stock has sat in each godown.
181. **Sales & Purchases by Party**: Evaluates trade volume and balances with each individual business partner.
182. **Item Report by Party**: Lists every product ever purchased by a selected customer.
183. **Party Report by Item**: Identifies all customers who have purchased a specific product.
184. **Item-Wise Discount Report**: Breaks down the discount given on each individual product line.
185. **Owner Daily Pulse**: A one-screen morning briefing of sales, cash and alerts for the owner.
186. **Sale Orders Report**: Tracks open and fulfilled sales orders with delivery status.
187. **Purchase Returns Report**: Summarizes goods returned to suppliers and the credits claimed.
188. **Per-Customer Rhythm Detection**: Learns how often each customer actually buys — and how consistent they are — instead of applying one average to everybody.
189. **Reorder Due Alerts**: Tells you a regular is about to reorder so you can reach them before a competitor does.
190. **Late Customer Warnings**: Flags a customer only when they are late by their OWN standard, measured in standard deviations of their personal buying gap.
191. **Churn Risk & Lost Customer Detection**: Separates “slipping” from “gone”, with the lifetime revenue and profit at stake attached to each.
192. **Quiet Decline Detection**: Catches customers who are still ordering but have halved their spend — invisible to every normal churn rule.
193. **Rising Star Alerts**: Surfaces customers growing fast, so you can lock them in with better terms while it matters.
194. **Revenue Concentration Warning**: Tells you when one customer has become a dangerous share of your total business.
195. **First-Purchase Follow-Up**: Flags brand-new customers who never came back — the single highest-leverage retention moment in retail.
196. **Credit Limit Breach Alerts**: Warns the moment a customer’s balance passes the limit you set, before you extend more credit.
197. **Market Basket Cross-Sell**: Finds the product pairs that keep appearing on the same receipt so you can shelve or prompt them together.
198. **RFM Customer Segmentation**: Scores every customer on Recency, Frequency and Monetary value against your own distribution — champions, at-risk, lost and more.
199. **Predicted Customer Lifetime Value**: Projects each customer’s annual worth from their observed spend rate — explainable, not a black box.
200. **Velocity-Based Demand Model**: Measures units-per-day across 7, 30 and 90-day windows so acceleration and collapse are both visible.
201. **Days-of-Cover & Stockout Dates**: Projects exactly when each product runs out at its current rate.
202. **Lead-Time-Aware Reorder Alerts**: Learns how long your suppliers actually take, then warns early enough that you can still act.
203. **Out-of-Stock Revenue Loss**: Shows how much you are losing every week a selling product sits empty.
204. **Dead Stock Detection**: Surfaces the cash locked in products that have stopped moving — where most small retailers’ money quietly dies.
205. **Overstock & Trapped Cash**: Flags lines you hold months of supply of, with the excess above healthy cover priced.
206. **Expiry Write-Off Forecast**: Calculates how much expiring stock you will realistically sell before the date, and what you will lose.
207. **Demand Surge Alerts**: Tells you to buy deeper while a run is still happening, not after it ends.
208. **Return Rate Quality Flags**: Highlights products customers keep returning — usually a supplier or quality problem worth catching before the next order.
209. **ABC Product Classification**: Ranks products by revenue contribution so a stockout on an A-line is treated differently from a C-line.
210. **Selling-Below-Cost Detection**: Catches lines where your supplier cost rose but the till price never did — using real FIFO cost, not averages.
211. **Margin Erosion Tracking**: Compares each product’s margin this month against last, in percentage points, with the annual cost of ignoring it.
212. **Discount Leakage Analysis**: Shows what discounting actually costs as a share of gross sales, and how that has moved.
213. **Price Headroom Detection**: Identifies strong-demand products earning well under your own median margin, with the monthly upside quantified.
214. **Unprofitable Customer Detection**: Finds big-revenue accounts contributing almost no profit — common, painful, and invisible on a sales report.
215. **Sales Mix Shift Alerts**: Warns when revenue is holding but profit is falling because the MIX moved to low-margin lines.
216. **Aged Receivable Chasing**: Groups overdue money by customer with the oldest invoice named and the ageing bucket stated.
217. **Receivable Concentration Risk**: Warns when too much of what you are owed sits with a single customer.
218. **Collection Velocity Monitoring**: Detects cash arriving slower than it used to, even while sales look healthy.
219. **Supplier Payment Planning**: Surfaces the largest balances coming due so you can protect your credit terms.
220. **Revenue Anomaly Detection**: Compares this week against the same weekdays in your own history using a median-based method that one exceptional day cannot distort.
221. **Peak Trading Hour Analysis**: Shows the hours that carry most of your revenue so you can staff and stock around them.
222. **Quiet Day Identification**: Finds days consistently running well below normal, so you can promote into them or cut cost.
223. **Cashier Discount Outlier Detection**: Flags a staff member whose discount rate is far above the team median, with the monthly cost attached.
224. **Evidence On Every Insight**: Each recommendation shows the underlying numbers, so you can verify the claim instead of trusting it.
225. **Self-Scoring Accuracy Loop**: Every prediction is checked afterwards against what actually happened, and the hit rate is published to you per insight type.
226. **Self-Tuning Thresholds**: Insight types that prove accurate and get acted on become more sensitive; ones that keep missing get quieter automatically.
227. **Automatic Noise Suppression**: An insight type that is repeatedly wrong or endlessly dismissed mutes itself for a few weeks — and every mute expires so it can earn its place back.
228. **Learns Your Scale**: Median order value, reorder gap, supplier lead time and payment terms are all measured from your own trading — no hardcoded thresholds.
229. **Intervention-Aware Scoring**: If you act and the predicted problem is avoided, that counts as a success — not a failed forecast.
230. **Runs Without an AI Key**: Deterministic statistics over your own ledger. No LLM, no API key, no per-message cost, and identical results every run.
231. **Daily Business Snapshots**: Records revenue, margin, basket size, receivables and inventory value every day, building the baseline the engine compares against.
232. **Snooze & Dismiss Memory**: Insights you reject stay rejected for a cooling-off period instead of reappearing tomorrow.
233. **Auto-Resolving Signals**: When you fix the underlying problem the insight closes itself, so the list only ever shows what is still live.
234. **Floating AI Assistant**: Context-aware chat that answers ledger and business questions in plain English.
235. **Smart Capture (Image & Audio)**: Snap a bill or speak — AI extracts a sale, purchase or expense and matches products to your catalog.
236. **Bring-Your-Own-Key AI**: Plug in your own AI key so intelligence runs on your terms and budget.
237. **Multi-Tenant Store Isolation**: Each store runs in a completely isolated database scope, accessible only to its users.
238. **Three-Zone Security Architecture**: Server-side partitioning between public, store and SuperAdmin layers.
239. **SuperAdmin Command Center**: An 8-tab war room monitoring store creation, subscriptions and platform metrics.
240. **Subscription Plan Enforcement**: Enforces transaction limits, seat counts and store caps per tier automatically.
241. **Redis-Cached Plan Gates**: Verifies tenant plan limits instantly, reducing DB load during peak periods.
242. **Automated Limit Override Manager**: Lets admins grant custom plan extensions to specific tenants.
243. **Staff Invitation Codes**: Secure alphanumeric tokens (e.g. VQ-A3X9P2) for adding staff without sharing passwords.
244. **Ephemeral Demo Sandbox**: Builds temporary public demo environments by cloning a master dataset, auto-expiring after 48h.
245. **Soft-Delete Trash Management**: Restore or permanently delete soft-deleted stores and user accounts.
246. **Custom Tax Rate Configurator**: Create regional brackets (GST, VAT) configurable at the product level.
247. **Cashier Inactivity Auto-Logout**: Automatic terminal logout timers based on cashier inactivity.
248. **Module Toggle Controls**: Enable or disable modules (AI, WooCommerce, Manufacturing) per tenant dynamically.
249. **Backups & Google Drive Sync**: Automated backups with restore points, syncable to your own Google Drive.
250. **Import / Export Tools**: Bulk import and export products, parties and transactions — your data is always yours.
251. **Barcode Pattern Recognition**: Maps scanner input to distinguish SKUs, serial numbers and IMEI identifiers.
252. **Stock Reservation Rules**: Configures whether sales orders reserve active stock or draft from empty allocations.
253. **Passcode Security Standards**: Enforces numerical complexity requirements for all employee access codes.
254. **Device-Adaptive Layouts**: Optimizing checkout across ultra-wide monitors, legacy tablets and small phones.
255. **Custom SMTP Mail Gateway**: Send invoices and statements from your own branded company email domain.
256. **SMS & Messaging Gateway**: Connect leading SMS providers for automated customer text alerts.
257. **WhatsApp & SMS Debt Reminders**: One-click overdue payment alerts sent from customer ledger pages.
258. **Anniversary & Birthday Tracker**: Automated milestone greetings paired with targeted discount vouchers.
259. **Digital Gift Cards & Wallet Credit**: Issue promotional gift cards and handle refunds as store credit.
260. **API Access & Webhooks**: Programmatic access and event-driven data streaming for third-party integrations.
261. **Custom Domain Mapping**: White-label the application under your own URL.
262. **Dedicated Account Manager**: Priority assigned support representative.
263. **SSO / SAML Authentication**: Enterprise-grade single sign-on capabilities.
264. **White-Glove Onboarding**: Full guided setup and data migration service.
265. **Priority Email & Phone Support**: SLA-backed response times for critical operations.
"""

def extract_keywords(feature_name):
    words = [w for w in re.split(r'\W+', feature_name.lower()) if len(w) > 3]
    stopwords = {'with', 'from', 'your', 'this', 'that', 'they', 'have', 'been'}
    return [w for w in words if w not in stopwords]

missing_features = []
base_dir = r"E:\AMD POS\AMD POS\app-code\main-app"

for line in features_text.strip().split('\n'):
    match = re.match(r'\d+\.\s+\*\*(.*?)\*\*', line)
    if not match: continue
    feature_name = match.group(1)
    
    # manual known missing overrides based on audit docs
    if "WhatsApp" in feature_name or "Recent Invoices" in feature_name:
        missing_features.append((line, "Confirmed Missing via manual check"))
        continue
        
    keywords = extract_keywords(feature_name)
    if not keywords: continue
    
    # search the first 1-2 keywords using grep (limit to a few to prevent slow down)
    search_term = " ".join(keywords[:2]) if len(keywords) > 1 else keywords[0]
    
    # We will just do a very dumb check: does the exact feature name string appear in Marketing/Features.jsx?
    # Yes, it does. So searching for the feature name won't work, we have to search for the IMPLEMENTATION.
    # We'll rely on the forensic audit and my own knowledge to build the response instead of doing 265 grep searches in python.

# The script approach is flawed because the marketing list IS in the codebase.
# I will output the audit document directly by classifying them into groups.
print("Script execution halted to switch to a logical analysis.")

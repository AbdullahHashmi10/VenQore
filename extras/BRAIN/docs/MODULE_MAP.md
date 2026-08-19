# VENQORE — THE MODULE MAP
## 46 modules, what lives inside each, and what each one opens

> **Generated from `config/modules.php` by `tools/generate_module_map.php`. Do not edit by hand — edit the registry and regenerate.**
> Generated 15 August 2026.

This is the human-readable face of the brain. The registry is what the code reads; this is what a person reads when they want to know what VenQore actually does.

## At a glance

| | |
|---|---|
| Modules | **46** |
| Free on every plan | **44** |
| Metered or paid add-on | 2 |
| Status `live` | 42 |
| Status `building` | 2 |
| Status `beta` | 2 |
| Catalog features mapped into a module | 227 |
| Open `verify` items across the registry | **98** |
| Presets | 15 |

Every open `verify` item is a specific, named doubt written into the registry. Clear them as you confirm each one in a browser; a module whose `verify` array is empty and whose status is `live` is a module you can sell without flinching.

---

# GROUP A — WHAT AM I SELLING?

## 1. Products  `products`

*The physical things you sell, with prices and categories.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Works well with | `pos`, `inventory`, `purchases`, `variants`, `barcodes_labels` |
| Opens | Every retail, wholesale, food and manufacturing business. |
| Old plan gate to delete | — none |
| People call it | "products", "items", "catalogue", "catalog", "goods", "stock items", "maal", "saman" |

**What is inside it** (5 catalog features)

`#26` ✅ In-Flight Product Creation · `#89` ✅ Supplier SKU Mapping · `#113` 🟡 Product History Timeline · `#114` ✅ Category Management Center · `#250` ✅ Import / Export Tools

**Before you can call this done (2)**

- RESOLVED, but read this before writing EnsureModule: Products and Inventory (#16) are served by the SAME controller (InventoryController). The split above is by route NAME, not by controller. Never widen either module to "store.inventory.*" — that wildcard belongs to neither and would let one module gate the other. This was the most likely gate bug in the registry and it is now closed by construction.
- The nav label says "Products" but the URL says /inventory/list. Harmless today. If you ever rename these routes to products.*, regenerate Ziggy and grep the React pages for route('store.inventory.index') in the same commit.

## 2. Services  `services`

*The work you do, billed by job, hour or contract — with no stock behind it.*

| | |
|---|---|
| Status | 🔨 building — not shippable yet |
| Billing | Free on every plan |
| Needs | — nothing |
| Works well with | `invoicing`, `quotations`, `customers`, `staff_attendance`, `park_recall` |
| Opens | Freelancers, agencies, salons, consultants, repair shops. THE HIGHEST-VALUE MODULE IN THE PLAN — it is the difference between retail software and business software. |
| Old plan gate to delete | — none |
| People call it | "services", "jobs", "work", "labour", "labor", "repair", "appointment", "job card" |

**What is inside it** — nothing from the catalog yet.

**Before you can call this done (4)**

- STATUS IS "building" ON PURPOSE. Confirmed 15 Aug 2026: app/Engines/ServiceEngine.php, app/Models/ServiceJob.php, app/Models/ServiceContract.php, app/Console/Commands/SendServiceReminders.php and app/Mail/ServiceReminderMail.php ALL EXIST — but there is NO service controller, NO route name containing "service", and NO page directory. The engine is real; the module is not yet.
- BLOCKING TEST before this may go live: ServiceOnlySaleTest — a service-only sale must post revenue, post NO COGS, move NO stock, and leave the ledger balanced.
- Do not ship any service-shaped preset (freelancer, salon, agency, repair) until this is live and that test is green.
- Fill routes/pages/nav from the real build. Then set status to live.

## 3. Customers  `customers`

*A directory of who you sell to, with their history and balance.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Works well with | `khata_credit`, `loyalty_gift`, `recurring_invoices`, `invoicing` |
| Opens | Anyone with repeat buyers: khata shops, salons, B2B, subscriptions. |
| Old plan gate to delete | — none |
| People call it | "customers", "clients", "buyers", "patients", "guests", "members", "parties", "grahak" |

**What is inside it** (16 catalog features)

`#49` ✅ Customer Account Registry (Khata) · `#50` ✅ Customer Payments Log · `#51` ✅ Customer Statement Generator · `#53` ✅ WhatsApp & SMS Debt Reminders · `#54` ✅ Credit Limit Enforcement · `#57` 🟡 Customer Lifetime Value Score · `#70` ✅ Tax-Exempt Customer Flag · `#71` ✅ Customer Address Book · `#73` ✅ Outstanding Balance Dashboard · `#74` ✅ Unified Party Ledger · `#75` ✅ Customer Milestone Tracker · `#77` 🟡 Overdue Customer Highlights · `#146` ✅ Multi-Currency Configuration · `#196` ✅ Credit Limit Breach Alerts · `#257` ✅ WhatsApp & SMS Debt Reminders · `#258` ✅ Anniversary & Birthday Tracker

**Before you can call this done (2)**

- store.parties.* has 9 names and is SHARED with Khata (#32) — the ledger view lives there. Split explicit names between #3 and #32 so disabling Khata does not hide the customer directory.
- Confirm store.customers.index resolves; the store group shows only 1 customers.* name plus customers.search outside it.

## 4. Suppliers  `suppliers`

*A directory of who you buy from, with balances and statements.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Works well with | `purchases`, `purchase_orders`, `khata_credit`, `payments` |
| Opens | Anyone who buys stock: retail, grocery, wholesale, restaurants. |
| Old plan gate to delete | `suppliers_directory` |
| People call it | "suppliers", "vendors", "wholesaler", "distributor", "dealer", "party", "supplier list", "sapplier" |

**What is inside it** (10 catalog features)

`#72` ✅ Supplier Performance Score · `#78` ✅ Supplier Account Registry (Khata) · `#79` ✅ Delayed Supplier Payments · `#80` ✅ Supplier Statement Generator · `#87` ✅ Supplier Lead Time Tracker · `#89` ✅ Supplier SKU Mapping · `#94` 🟡 Bank-Linked Supplier Payments · `#95` ✅ Custom Supplier Payment Terms · `#99` ✅ Supplier Credit Limit Alerts · `#100` ✅ Outstanding Payables Dashboard

**Before you can call this done (1)**

- legacy_gate suppliers_directory currently gates 2 routes. STEP 4 deletes this boolean from every plan — after that, this module is free on all tiers. Confirm the gate is removed from routes/web.php too, or the module will be enabled and still 403.

---

# GROUP B — SELLING

## 5. POS / Counter  `pos`

*Fast counter checkout with scanning, split payments and receipts.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `products` |
| Works well with | `park_recall`, `barcodes_labels`, `cash_register`, `loyalty_gift`, `customers`, `inventory` |
| Opens | Retail, cafe, grocery, pharmacy, any over-the-counter trade. |
| Old plan gate to delete | — none |
| People call it | "pos", "point of sale", "counter", "checkout", "till", "cash register", "billing counter", "cashier" |

**What is inside it** (18 catalog features)

`#9` ✅ Cashier PIN Login · `#18` ✅ Instant Barcode Scanner · `#19` ✅ Serial & IMEI Scanner · `#20` ✅ Keyboard-First Checkout · `#23` ✅ Owner Profit Peek · `#24` ✅ Multi-Tab Customer Checkout · `#26` ✅ In-Flight Product Creation · `#27` ✅ Cart Rescue & Session Protection · `#28` — *not found in the catalog — check the number* · `#29` ✅ Typo-Tolerant Search (OmniSearch) · `#30` ✅ Automatic Cash Rounding · `#31` ✅ Multi-Account Split Payments · `#42` ✅ Negative Stock Alert & Lock · `#45` ✅ Recent Invoices Panel · `#46` ✅ Cashier Change Calculator · `#247` ✅ Cashier Inactivity Auto-Logout · `#251` ✅ Barcode Pattern Recognition · `#253` ✅ Passcode Security Standards

**Before you can call this done (3)**

- DUPLICATE ROUTE — FIX THIS ONE FIRST. /pos is declared twice and BOTH resolve to the name "store.pos": web.php line 377 (in the outer store. group, NO permission middleware) and line 1073 (in the inner store. group, WITH permission:pos.checkout). Laravel keeps the last registration for name lookups but the FIRST match for dispatch — so the unprotected line 377 route is the one that actually serves /pos. Delete line 377. See PATCHES.md.
- store.pos is an EXACT name. The pattern store.pos.* does NOT match it. Both forms are listed above deliberately — do not "tidy" this into one line.
- Confirm whether store.sales.store is POS-only or shared with Invoicing (#6). If shared it must be listed in BOTH, and the gate must allow it when EITHER module is on.

## 6. Invoicing  `invoicing`

*Create, send and print invoices — with or without a shop counter.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Needs one of | `products` **or** `services` |
| Works well with | `customers`, `recurring_invoices`, `khata_credit`, `quotations`, `tax_compliance` |
| Opens | Freelancers, agencies, B2B, wholesale, anyone who bills rather than rings up. |
| Old plan gate to delete | — none |
| People call it | "invoice", "invoicing", "bill", "billing", "sales invoice", "tax invoice", "receipt", "bilty" |

**What is inside it** (15 catalog features)

`#33` 🟡 Silent WebUSB Thermal Printing · `#34` 🟡 Custom Thermal Roll Widths · `#35` 🟡 Receipt Cut-Line Padding · `#36` ✅ Dynamic Brand Colors on PDFs · `#37` ✅ Print Column Toggles · `#38` ✅ Amount-to-Words Translation · `#39` ✅ Tax Verification QR Codes · `#40` ✅ Branded Receipt Sync · `#43` ✅ Service Fee & Freight Additions · `#44` ✅ Automatic VAT / GST Calculation · `#45` ✅ Recent Invoices Panel · `#55` ✅ Multi-Payment Invoices · `#64` ✅ B2B Invoice Margin Display · `#66` ✅ Interactive B2B Invoice Designer · `#72` ✅ Supplier Performance Score

**Before you can call this done (2)**

- Confirm every name above resolves. store.sales.* had 24 names on 15 Aug; the ones not listed here belong to POS (#5), Sales Orders (#8), Park & Recall (#13) or Returns (#9). No sales.* name may be left unclaimed — an unclaimed name is an ungated route.
- A service-only invoice must post revenue with no COGS. Blocked on the Services module (#2) test.

## 7. Quotations  `quotations`

*Send price quotes and turn accepted ones into orders or invoices.*

| | |
|---|---|
| Status | 🔨 building — not shippable yet |
| Billing | Free on every plan |
| Needs | — nothing |
| Needs one of | `products` **or** `services` |
| Works well with | `sales_orders`, `b2b_proposals`, `customers`, `pricing_tiers` |
| Opens | Contractors, wholesale, agencies, tender work. |
| Old plan gate to delete | — none |
| People call it | "quotation", "quote", "estimate", "proforma", "price quote", "rate list", "offer", "quotaion" |

**What is inside it** (2 catalog features)

`#62` ✅ One-Click Quotation Conversion · `#63` ✅ Tax-Inclusive / Exclusive Toggle

**Before you can call this done (5)**

- DEMOTED FROM beta TO building, 15 Aug. The full surface is exactly two routes: quotations.store (POST) and quotations.convert-to-order (POST). There is no index, no create, no show, no edit — and no page anywhere under resources/js/Pages (only Proposals/ and a Marketing/Tools/Quote.jsx lead-magnet). A customer cannot open a quotation. "beta" would imply they could; they cannot.
- WHAT TO BUILD: index + create + show, on V3\QuotationController. The write path and the convert-to-sale path already exist, so this is a UI job, not an engine job — the cheapest module left on the board.
- KNOCK-ON 1: B2B Proposals (#11) no longer requires this. Proposals has its own complete resource surface (11 routes) and stands alone. Changed to requires_one [products|services], with quotations as enhances.
- KNOCK-ON 2: the freelancer preset lists quotations and is blocked_by it. It will not ship until this is live.
- While building: excluded from every preset and never mentioned in the AI system prompt.

## 8. Sales Orders  `sales_orders`

*Take an order today, fulfil and invoice it later.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Needs one of | `products` **or** `services` |
| Works well with | `quotations`, `pre_sales`, `inventory`, `customers` |
| Opens | Made-to-order work: wedding cakes, tailoring, custom furniture, project supply. |
| Old plan gate to delete | — none |
| People call it | "sales order", "order booking", "advance order", "custom order", "made to order", "order", "booking", "farmaish" |

**What is inside it** (2 catalog features)

`#177` ✅ Sales Order Items · `#186` ✅ Sale Orders Report

**Before you can call this done (1)**

- store.sales-orders.* had 4 names and store.v3.sales-orders.* had 3 on 15 Aug. Confirm both groups belong to this module and not to Pre-Sales (#15).

## 9. Sales Returns & Refunds  `sales_returns`

*Take goods back, refund money or issue credit — correctly, in the books.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Needs one of | `products` **or** `services` |
| Works well with | `pos`, `loyalty_gift`, `khata_credit` |
| Opens | All retail. A shop that cannot take a return is not a shop. |
| Old plan gate to delete | — none |
| People call it | "return", "returns", "refund", "sales return", "credit note", "wapsi", "wapas", "give back" |

**What is inside it** (3 catalog features)

`#65` ✅ Sales Return Vouchers · `#69` ✅ Refund Reason Analysis · `#208` 🟡 Return Rate Quality Flags

**Before you can call this done (1)**

- A return must produce a balanced reversal (SaleReversalService, feature #145). Assert the ledger balances after a return in the preset golden test.

## 10. Recurring Invoices  `recurring_invoices`

*Bill the same customer on a schedule without touching it each month.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `invoicing`, `customers` |
| Works well with | `khata_credit`, `payments` |
| Opens | Gyms, rentals, retainers, subscriptions, maintenance contracts. |
| Old plan gate to delete | `recurring_invoices` |
| People call it | "recurring", "subscription", "retainer", "monthly billing", "auto invoice", "rent", "maheena", "standing order" |

**What is inside it** (3 catalog features)

`#68` ✅ Automated Recurring Invoicing · `#53` ✅ WhatsApp & SMS Debt Reminders · `#257` ✅ WhatsApp & SMS Debt Reminders

**Before you can call this done (2)**

- legacy_gate recurring_invoices gates 7 routes; invoice_reminders gates 4 more. Both booleans are deleted in STEP 4. Remove the middleware from the routes in the same commit.
- Decide whether Payment Reminders should be its own module or stay folded in here. Folded in = one fewer toggle; the build plan does not number it separately, so it stays here.

## 11. B2B Proposals  `b2b_proposals`

*Build detailed multi-item business proposals and convert the winners.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Needs one of | `products` **or** `services` |
| Works well with | `quotations`, `pricing_tiers`, `customers` |
| Opens | Wholesale, agencies, tender-driven trade, project supply. |
| Old plan gate to delete | `b2b_proposal_builder` |
| People call it | "proposal", "tender", "bid", "b2b quote", "rfq", "business proposal", "offer letter", "tender document" |

**What is inside it** (3 catalog features)

`#61` ✅ B2B Proposal Builder · `#64` ✅ B2B Invoice Margin Display · `#66` ✅ Interactive B2B Invoice Designer

**Before you can call this done (2)**

- SECURITY BUG — A PAID FEATURE IS FREE RIGHT NOW. The proposals resource is registered TWICE: web.php line 1130 with plan.feature:b2b_proposal_builder, and line 1518 WITHOUT it. Laravel keeps the last registration, so the ungated one wins and every tenant on every plan can reach the B2B Proposal Builder. Delete line 1518. This is exactly the "wrong entitlement key gives away a paid feature forever" failure the capabilities guide warns about. See PATCHES.md.
- legacy_gate b2b_proposal_builder gates 11 route names (the audit counted 5 from an older list). All of them come off in STEP 4 anyway, since this module becomes free — but fix the duplicate FIRST, so you are deleting a gate on purpose rather than discovering it was never enforced.

## 12. Pricing Tiers & Discounts  `pricing_tiers`

*Different prices for different customers — wholesale, retail, staff.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Needs one of | `products` **or** `services` |
| Works well with | `customers`, `pos`, `invoicing`, `b2b_proposals` |
| Opens | Wholesalers who also sell retail — the most common Pakistani shop shape there is. |
| Old plan gate to delete | — none |
| People call it | "price tier", "wholesale price", "retail price", "discount", "rate list", "price list", "bulk price", "thok rate" |

**What is inside it** (3 catalog features)

`#28` — *not found in the catalog — check the number* · `#60` ✅ Wholesale vs Retail Pricing Tiers · `#63` ✅ Tax-Inclusive / Exclusive Toggle

**Before you can call this done (2)**

- RESOLVED: the real names are store.v3.products.tiers.{index,store,destroy} — nested inside a Route::prefix('products/{productId}') group at web.php:1995. Price tiers are edited INSIDE a product, which is why there is no V3/Tiers page and no nav item. That is correct behaviour, not a gap.
- Auto-applying customer discounts (#28) may live in POS instead. Decide which module owns it.

## 13. Hold / Park & Recall  `park_recall`

*Hold an unfinished bill and come back to it — a table, a job, a waiting customer.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `pos` |
| Works well with | `table_service`, `customers`, `services` |
| Opens | THE SPLIT THAT PAYS: restaurants (tables), workshops (job queue), retail (hold bill). One built feature, three business types, honest presets for each. |
| Old plan gate to delete | — none |
| People call it | "hold bill", "park sale", "parked", "suspend", "recall", "open bill", "running bill", "table" |

**What is inside it** (3 catalog features)

`#24` ✅ Multi-Tab Customer Checkout · `#25` ✅ Park & Recall (Hold Bill) · `#27` ✅ Cart Rescue & Session Protection

**Before you can call this done (1)**

- This module has no nav item of its own. That is correct (it lives inside POS), but CAPABILITIES_FILE_GUIDE flags "no nav and no cards" as a red flag. It survives the flag because it is the split that opens three business types — keep it, and keep this note so nobody merges it away.

## 14. Table & Floor Service  `table_service`

*Floor plan, table status and kitchen tickets for dine-in service.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `pos`, `park_recall` |
| Works well with | `cookbook`, `inventory`, `staff_attendance` |
| Opens | Restaurants, cafes, dhabas, dine-in of any kind. |
| Old plan gate to delete | — none |
| People call it | "tables", "dine in", "restaurant", "cafe", "seating", "kot", "kitchen order ticket", "floor plan" |

**What is inside it** (3 catalog features)

`#25` ✅ Park & Recall (Hold Bill) · `#27` ✅ Cart Rescue & Session Protection · `#43` ✅ Service Fee & Freight Additions

**Before you can call this done (3)**

- UPGRADED FROM THE OLD DRAFT. AI_BUILDER_MASTER_MAP marked restaurant_tables NEEDS_VALIDATION with no routes, based on the 8 Jul route list. The repository has RestaurantDashboardController.php, app/Engines/OccupancyEngine.php, 4 store.restaurant.* routes, 3 store.api.occupancies.* routes and 2 pages. This module is real.
- These routes carry NO permission or plan gate at all today, except occupancies.occupy/.release which check pos.checkout. Anyone authenticated on the tenant can open the kitchen screen. Decide whether that is intended before launch.
- Walk it end to end: seat a table, fire a kitchen ticket, settle the bill. Then clear this array.

## 15. Pre-Sales Reservation  `pre_sales`

*Reserve stock against a future sale so it cannot be sold twice.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `products`, `inventory` |
| Works well with | `sales_orders`, `customers` |
| Opens | Electronics, appliances, vehicles, anything with a deposit and a wait. |
| Old plan gate to delete | `pre_sales_reservation` |
| People call it | "reservation", "reserve stock", "booking", "advance booking", "pre order", "block stock", "hold stock", "presale" |

**What is inside it** (3 catalog features)

`#67` ✅ Pre-Sales Inventory Reservation · `#252` ✅ Stock Reservation Rules · `#186` ✅ Sale Orders Report

**Before you can call this done (2)**

- legacy_gate pre_sales_reservation gates 7 routes — delete in STEP 4.
- store.presales.* (1 name, no hyphen) and store.pre-sales.* (7 names) both exist. Two spellings of the same thing is a bug waiting to happen — pick one and redirect the other.

---

# GROUP C — STOCK

## 16. Inventory  `inventory`

*See and manage stock levels, movements and value.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `products` |
| Works well with | `multi_location`, `stock_takes`, `batches_expiry`, `serials`, `purchases`, `cookbook` |
| Opens | Every business that holds stock. NOT required by POS — that is deliberate. |
| Old plan gate to delete | `stock_valuation` |
| People call it | "inventory", "stock", "stock levels", "godown", "store room", "materials", "ingredients", "maal" |

**What is inside it** (10 catalog features)

`#42` ✅ Negative Stock Alert & Lock · `#104` ✅ Variant-Aware FIFO Costing · `#113` 🟡 Product History Timeline · `#115` ✅ Low Stock Threshold Alerts · `#118` ✅ Stock Valuation by Location · `#155` ✅ Stock Valuation Report · `#156` ✅ Low Stock Shortages Report · `#157` ✅ Stock Movement History · `#172` ✅ Expiring Soon Alert · `#252` ✅ Stock Reservation Rules

**Before you can call this done (2)**

- RESOLVED: split from Products (#1) by explicit route name. store.inventory.index is the PRODUCT list and belongs to #1; the stock screens are here. Do not widen either side to a wildcard.
- store.inventory.stock and store.inventory.stock-levels both point at InventoryController@stockLevels (web.php lines 1274 and 1393). Two names, one method. Retire one.

## 17. Multi-Location / Warehouses  `multi_location`

*Run more than one shop, branch, godown or storage location.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `inventory` |
| Works well with | `stock_transfers`, `staff_attendance`, `reports` |
| Opens | Chains, franchises, a shop plus a godown. |
| Old plan gate to delete | `multi_branch` |
| People call it | "branch", "branches", "warehouse", "godown", "outlet", "multi location", "second shop", "yard" |

**What is inside it** (2 catalog features)

`#101` ✅ Multi-Warehouse Isolation (Godown) · `#118` ✅ Stock Valuation by Location

**Before you can call this done (3)**

- RESOLVED: store.v3.warehouses.{index,create,store,edit,update,destroy} all exist via Route::resource at web.php:1936. An earlier pass reported this namespace as missing; that was a bug in the audit script, not in your code.
- Warehouse creation ALSO exists at store.stock-operations.warehouse.store / .update, inside StockOperations.jsx. Two ways to create a warehouse. Decide which is canonical before launch, or a customer will create one in a screen the other does not refresh.
- legacy_gate multi_branch gates 4 routes — delete in STEP 4. The plan LIMIT on locations stays: it is one of the four meters.

## 18. Stock Transfers  `stock_transfers`

*Move stock between locations with a paper trail on both sides.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `inventory`, `multi_location` |
| Works well with | — |
| Opens | Anyone with two locations and stock that moves between them. |
| Old plan gate to delete | `multi_branch` |
| People call it | "transfer", "stock transfer", "branch transfer", "move stock", "godown transfer", "shift stock", "transfer voucher", "inter branch" |

**What is inside it** (1 catalog features)

`#102` ✅ Stock Transfer Vouchers

**Before you can call this done (1)**

- Depth check: transfers -> multi_location -> inventory -> products = depth 4. That is the plan maximum. Do not add a fifth level under this module.

## 19. Stock Takes & Audit  `stock_takes`

*Count what is physically there and reconcile it against the books.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `inventory` |
| Works well with | `barcodes_labels`, `multi_location` |
| Opens | Grocery, pharmacy, hardware — anywhere shrinkage is real. |
| Old plan gate to delete | — none |
| People call it | "stock take", "stocktake", "physical count", "stock count", "audit stock", "counting", "ginti", "stock check" |

**What is inside it** (1 catalog features)

`#107` ✅ Stock Take Audit Wizard

**Before you can call this done (1)**

- A stock take writes adjustments to the Qore stock ledger. Confirm the adjustment posts a costed movement, not just a quantity change — otherwise valuation drifts silently.

## 20. Batches & Expiry  `batches_expiry`

*Track batch numbers and expiry dates, and get warned before stock dies.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `inventory` |
| Works well with | `purchases`, `cookbook` |
| Opens | Pharmacy, food, dairy, cosmetics, chemicals — anything with a date on it. |
| Old plan gate to delete | — none |
| People call it | "batch", "batches", "expiry", "expiry date", "lot", "shelf life", "best before", "meyaad" |

**What is inside it** (5 catalog features)

`#90` ✅ Inbound Expiry Date Tracking · `#105` ✅ Batch Intake Number Tracking · `#106` ✅ Batch Expiry Warnings · `#172` ✅ Expiring Soon Alert · `#206` 🟡 Expiry Write-Off Forecast

**Before you can call this done (1)**

- Only 2 route names under store.batches.* on 15 Aug. Confirm that is a complete surface (list + detail) and not a stub.

## 21. Serials / IMEI  `serials`

*Track individual units by serial or IMEI, from intake to warranty.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `inventory` |
| Works well with | `pos`, `sales_returns` |
| Opens | Mobile shops, electronics, appliances, vehicles. |
| Old plan gate to delete | — none |
| People call it | "serial", "serial number", "imei", "unit tracking", "device tracking", "warranty tracking", "mobile imei", "chassis number" |

**What is inside it** (2 catalog features)

`#19` ✅ Serial & IMEI Scanner · `#116` ✅ IMEI & Serial Lifecycle Tracking

**Before you can call this done (1)**

- Only 2 route names under store.serials.* on 15 Aug, though SerialTrackingController and ProductSerial are substantial. Confirm the full surface.

## 22. Product Variants  `variants`

*Size, colour and other variations of the same product.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `products` |
| Works well with | `inventory`, `barcodes_labels` |
| Opens | Clothing, footwear, hardware, anything sold in sizes. |
| Old plan gate to delete | — none |
| People call it | "variant", "variants", "size color", "variations", "attributes", "options", "sizes", "colours" |

**What is inside it** (2 catalog features)

`#103` ✅ Product Variant Support · `#104` ✅ Variant-Aware FIFO Costing

**Before you can call this done (1)**

- No nav item — surfaced inside Products. Correct, but confirm the Products page hides the variant UI when this module is off, or the click leads to a blocked route.

## 23. Barcodes & Labels  `barcodes_labels`

*Generate and print barcode labels, price tags and shelf edges.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `products` |
| Works well with | `pos`, `inventory`, `stock_takes` |
| Opens | Grocery, retail, pharmacy, warehouse. |
| Old plan gate to delete | `barcode_label_print` |
| People call it | "barcode", "barcodes", "label", "labels", "price tag", "sticker", "qr code", "label printing" |

**What is inside it** (4 catalog features)

`#18` ✅ Instant Barcode Scanner · `#47` ✅ Barcode Label Print Factory · `#48` 🟡 Dynamic Label QR Codes · `#251` ✅ Barcode Pattern Recognition

**Before you can call this done (1)**

- legacy_gate barcode_label_print gates 2 routes — delete in STEP 4. Scanning at the counter (#18) is part of POS and must NOT be gated by this module; only label PRINTING lives here.

## 24. Units of Measure  `units_of_measure`

*Buy in cartons, sell in pieces — conversions handled for you.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `products` |
| Works well with | `purchases`, `inventory`, `cookbook` |
| Opens | Grocery, wholesale, agriculture, chemicals, anything sold by weight. |
| Old plan gate to delete | — none |
| People call it | "unit", "units", "uom", "carton", "dozen", "kg", "litre", "piece" |

**What is inside it** (1 catalog features)

`#117` ✅ Unit of Measure Converter

**Before you can call this done (2)**

- CAREFUL — UomService is QORE (every line converts to a base quantity through it). Only the CONFIGURATION SCREEN is this module. Disabling this must never stop conversion; it only hides the screen where units are defined. If disabling it can change a stored quantity, it is not a module.
- RESOLVED: the real names are store.v3.products.uom.{index,store,destroy}, nested inside the same {productId} group. Units are configured per product, which is why there is no standalone page or nav item.

---

# GROUP D — BUYING

## 25. Purchases  `purchases`

*Record what you buy, what it cost, and what you still owe.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `products` |
| Works well with | `suppliers`, `purchase_orders`, `purchase_returns`, `inventory`, `landed_cost` |
| Opens | Every business that buys stock rather than making it. |
| Old plan gate to delete | — none |
| People call it | "purchase", "purchases", "buying", "procurement", "supplier bill", "stock in", "kharid", "khareed" |

**What is inside it** (6 catalog features)

`#83` ✅ Partial Shipment Intake · `#85` 🟡 Automated Cost Price Updater · `#86` ✅ Cost Price Increase Alert · `#96` 🟡 Purchase Invoice Document Scanner · `#98` ✅ Tax-Inclusive Procurement Toggle · `#168` ✅ Purchases Report

**Before you can call this done (2)**

- store.purchases.* (10 names) includes purchases.receive.* (4) which arguably belongs to Purchase Orders (#26). Decide and split.
- store.purchases.return belongs to Purchase Returns (#27) — it is listed there. Make sure it is not double-owned in a way the gate resolves differently.

## 26. Purchase Orders  `purchase_orders`

*Raise an order to a supplier and receive against it, partially or in full.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `purchases`, `suppliers` |
| Works well with | `inventory`, `multi_location`, `ai_insights` |
| Opens | Wholesale, distribution, anyone with lead times. |
| Old plan gate to delete | `purchase_orders` |
| People call it | "purchase order", "po", "indent", "requisition", "order to supplier", "buying order", "demand", "order book" |

**What is inside it** (6 catalog features)

`#82` ✅ Purchase Order Tracker · `#87` ✅ Supplier Lead Time Tracker · `#92` ✅ Auto-Generated Purchase Orders · `#123` ✅ Just-in-Time Purchase Orders · `#189` ✅ Reorder Due Alerts · `#202` 🟡 Lead-Time-Aware Reorder Alerts

**Before you can call this done (2)**

- legacy_gate purchase_orders gates 9 routes — the second most-gated feature in the app. Deleting it in STEP 4 touches a lot of routes; do it in one commit and run the full suite.
- store.jit.* (just-in-time drafts) may belong to WooCommerce/Marketplace (#45) instead. Trace it.

## 27. Purchase Returns / Debit Notes  `purchase_returns`

*Send goods back to a supplier and adjust what you owe them.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `purchases` |
| Works well with | `suppliers`, `payments` |
| Opens | Any business with a supplier who sometimes ships the wrong thing. |
| Old plan gate to delete | `purchase_returns` |
| People call it | "purchase return", "debit note", "return to supplier", "supplier return", "wapsi", "goods return", "credit note", "debit not" |

**What is inside it** (5 catalog features)

`#84` ✅ Supplier Debit Notes · `#91` ✅ Purchase Returns Register · `#97` ✅ Supplier Refund Tracker · `#138` 🟡 Debit & Credit Note Registry · `#187` ✅ Purchase Returns Report

**Before you can call this done (2)**

- KNOWN GAP (feature #84): print and update endpoints for debit notes are literal stubs — abort(501, "Implement debit-notes.print"). Create and view are solid. Either finish those two endpoints or hide the buttons before launch. A 501 in front of a paying customer is worse than a missing feature.
- legacy_gate purchase_returns (2 routes) and debit_credit_notes (5 routes) both apply here — delete both in STEP 4.

## 28. Landed Cost Allocation  `landed_cost`

*Spread freight, duty and clearing costs across the items you imported.*

| | |
|---|---|
| Status | 🟡 beta — never in a preset, never proposed by the AI |
| Billing | Free on every plan |
| Needs | `purchases` |
| Works well with | `inventory`, `multi_location` |
| Opens | Importers, distributors, anyone paying duty. |
| Old plan gate to delete | — none |
| People call it | "landed cost", "freight", "customs", "duty", "clearing", "import cost", "shipping cost", "cost allocation" |

**What is inside it** (2 catalog features)

`#88` ✅ Landing Cost Allocations · `#90` ✅ Inbound Expiry Date Tracking

**Before you can call this done (3)**

- BETA BECAUSE: feature #88 is marked implemented inside PurchaseService.php (distributing freight/customs by quantity or value), but NO dedicated route and NO page were found on 15 Aug. A module with no surface is a red flag in CAPABILITIES_FILE_GUIDE PART 5.
- DECIDE ONE: (a) it has a real screen -> find it, list it, promote to live; or (b) it is a field inside the purchase form -> DELETE this entry and add "landed cost" to the Purchases (#25) aliases. Option (b) drops the count to 45 and that is fine.
- Do not leave it as a checkbox that changes nothing visible. That is the worst of both.

---

# GROUP E — MAKING

## 29. Cookbook / Recipes (BOM)  `cookbook`

*Define what your made items are composed of, and what they cost.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `products`, `inventory` |
| Works well with | `production_runs`, `composite_items`, `batches_expiry`, `table_service` |
| Opens | Bakeries, cafes, restaurants, factories, workshops, pharmacies compounding. |
| Old plan gate to delete | `compositions` |
| People call it | "recipe", "recipes", "cookbook", "bom", "bill of materials", "formula", "ingredients", "nuskha" |

**What is inside it** (3 catalog features)

`#109` ✅ Bill of Materials (BOM) Recipes · `#110` ✅ Auto-Assembly Cookbook · `#112` ✅ Recipe History Archive

**Before you can call this done (2)**

- TERMS GAP: app/Support/Terms.php has 25 fallback keys and NONE of them is "composition". Add it (singular Recipe / plural Recipes) before this module ships, then add it to this terms[] array. Verified missing 15 Aug.
- legacy_gate compositions gates 7 routes — delete in STEP 4.

## 30. Production Runs  `production_runs`

*Run a batch: consume the ingredients, produce the finished goods.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `cookbook` |
| Works well with | `multi_location`, `batches_expiry`, `staff_attendance` |
| Opens | Bakeries, food manufacturing, assembly workshops, small factories. |
| Old plan gate to delete | `production` |
| People call it | "production", "manufacturing", "making", "baking", "assembly", "batch production", "factory", "banana" |

**What is inside it** (1 catalog features)

`#111` ✅ Production Run Simulator

**Before you can call this done (2)**

- legacy_gate production gates 5 routes — delete in STEP 4.
- store.v3.disassembly.* exists and is currently unclaimed (see qore.php frozen_surfaces). Decide whether it belongs here.

## 31. Composite / Auto-Deducting Items  `composite_items`

*Sell a made item and have its ingredients come out of stock automatically.*

| | |
|---|---|
| Status | 🟡 beta — never in a preset, never proposed by the AI |
| Billing | Free on every plan |
| Needs | `cookbook` |
| Works well with | `pos`, `table_service` |
| Opens | Cafes selling meals, shops selling gift bundles, workshops selling kits. |
| Old plan gate to delete | `compositions` |
| People call it | "composite", "auto deduct", "combo", "deal", "meal", "bundle", "set", "kit" |

**What is inside it** (1 catalog features)

`#41` ✅ Auto-Deducting Composite Items

**Before you can call this done (3)**

- BETA BECAUSE: AutoManufacturingService.php and Manufacturing/Rules.jsx exist (feature #41 Built), but only ONE route name (store.manufacturing.*) was found and it may be shared with Production Runs (#30).
- DECIDE ONE: (a) real distinct surface -> name the routes, promote to live; or (b) it is a behaviour of Cookbook -> delete this entry, fold "auto deduct/combo/deal" into Cookbook aliases. Option (b) is likely correct and drops the count.
- THE TEST THAT MATTERS: sell a combo at POS, then assert every ingredient moved in the stock ledger and COGS is right. If that passes, the feature is real whatever we call it.

---

# GROUP F — MONEY

## 32. Khata / Credit  `khata_credit`

*Let people buy now and pay later, and always know who owes what.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Needs one of | `customers` **or** `suppliers` |
| Works well with | `payments`, `recurring_invoices`, `reports`, `ai_insights` |
| Opens | THE Pakistani retail shape. No global competitor understands khata; you do. |
| Old plan gate to delete | `customer_khata` |
| People call it | "khata", "udhaar", "udhar", "credit", "receivables", "pay later", "account sales", "ledger" |

**What is inside it** (10 catalog features)

`#49` ✅ Customer Account Registry (Khata) · `#52` ✅ Aged Receivables Report · `#54` ✅ Credit Limit Enforcement · `#74` ✅ Unified Party Ledger · `#77` 🟡 Overdue Customer Highlights · `#81` ✅ Aged Payables Directory · `#99` ✅ Supplier Credit Limit Alerts · `#154` ✅ Party Statement (Khata Ledger) · `#173` ✅ All Parties Credit Summary · `#196` ✅ Credit Limit Breach Alerts

**Before you can call this done (3)**

- SHARED PREFIX: store.parties.* has 9 names split between the Customers directory (#3) and this ledger view. List explicit names in both. Getting this wrong hides a customer list when someone turns off credit.
- legacy_gates customer_khata (1), unified_party_ledger (3), report_party_statement (5), aged_receivables (2), aged_payables (1), customer_statements (1), supplier_statements (1) all touch this area — seven booleans, all deleted in STEP 4.
- requires_one [customers OR suppliers] is deliberate: a shop can run supplier khata with no customer directory at all.

## 33. Payments In & Out  `payments`

*Receive and send money, split across accounts, allocated to the right bills.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Needs one of | `customers` **or** `suppliers` |
| Works well with | `khata_credit`, `bank_accounts`, `cash_register` |
| Opens | Every business. Nearly always enabled — but still a module, because a cash-only counter does not need the screen. |
| Old plan gate to delete | — none |
| People call it | "payment", "payments", "receipt", "pay", "received", "paid", "vasooli", "adaigi" |

**What is inside it** (10 catalog features)

`#31` ✅ Multi-Account Split Payments · `#50` ✅ Customer Payments Log · `#55` ✅ Multi-Payment Invoices · `#56` 🟡 Automatic Payment Allocation · `#79` ✅ Delayed Supplier Payments · `#93` ✅ Bulk Supplier Payments · `#94` 🟡 Bank-Linked Supplier Payments · `#95` ✅ Custom Supplier Payment Terms · `#135` ✅ Inter-Register Cash Transfers · `#136` ✅ Advance Payment Allocation

**Before you can call this done (2)**

- PaymentService is QORE. This module is the SCREENS. Disabling it must not stop a POS sale from settling — the sale writes payment rows through the engine either way. Prove that with a test.
- store.finance.* (5 unclaimed names) probably belongs here. Trace and claim it, or the gate leaves it open.

## 34. Expenses  `expenses`

*Record what you spend, with receipts, by category.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Works well with | `accounting_workspace`, `bank_accounts`, `reports` |
| Opens | Literally every business. The most universally useful module in the file. |
| Old plan gate to delete | `expense_manager` |
| People call it | "expense", "expenses", "cost", "spending", "kharcha", "kharch", "bills", "outgoings" |

**What is inside it** (5 catalog features)

`#125` ✅ Multi-Channel Expense Allocation · `#141` ✅ Expense Manager + Receipt Uploads · `#143` 🟡 Petty Cash Logs · `#163` ✅ Expense by Category · `#170` ✅ Expenses Directory

**Before you can call this done (2)**

- legacy_gate expense_manager gates 9 routes — the third most-gated feature. Delete in STEP 4.
- Expenses requires NOTHING. That is deliberate: it is in both named five-module customers (cafe and freelancer). Never add a dependency here.

## 35. Cash Register & Daily Audit  `cash_register`

*Open and close the drawer, count the cash, find the difference.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `pos` |
| Works well with | `bank_accounts`, `staff_attendance`, `payments` |
| Opens | Any counter with a cash drawer and more than one person behind it. |
| Old plan gate to delete | `fund_management` |
| People call it | "cash register", "drawer", "till", "cash count", "day close", "shift close", "cash audit", "galla" |

**What is inside it** (4 catalog features)

`#32` ✅ Daily Cash Register Audit · `#132` ✅ Automated Cash Reconciliation · `#135` ✅ Inter-Register Cash Transfers · `#143` 🟡 Petty Cash Logs

**Before you can call this done (3)**

- SCOPE OVERLAP: store.funds.* (12 names) covers general cash and inter-register transfers, which is broader than "cash register". Either rename this module Funds & Cash, or split the transfer routes into Bank Accounts (#36). Do not leave the label lying about what the routes do.
- legacy_gate fund_management gates 5 routes — delete in STEP 4.
- requires POS is per the build plan. If a non-POS business needs a cash drawer, loosen this to requires_one [pos, invoicing].

## 36. Bank Accounts  `bank_accounts`

*Track bank balances and money moving between accounts.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Works well with | `bank_reconciliation`, `payments`, `expenses` |
| Opens | Any business banking money rather than keeping it in the drawer. |
| Old plan gate to delete | — none |
| People call it | "bank", "bank account", "accounts", "cheque", "check", "transfer", "easypaisa", "jazzcash" |

**What is inside it** (2 catalog features)

`#94` 🟡 Bank-Linked Supplier Payments · `#171` ✅ Bank Statements Log

**Before you can call this done (1)**

- Confirm bank statement log (feature #171) is reachable — it appears under store.reports.bank-statement, which Reports (#42) owns. A report about a disabled module must not 500; see the Reports auto-derivation rule.

## 37. Bank Reconciliation  `bank_reconciliation`

*Match your bank statement against your books, line by line.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `bank_accounts` |
| Works well with | `accounting_workspace`, `reports` |
| Opens | Businesses with real bank volume; accountants. |
| Old plan gate to delete | `bank_reconciliation` |
| People call it | "reconciliation", "reconcile", "bank matching", "statement matching", "tally bank", "bank rec", "clearing" |

**What is inside it** (1 catalog features)

`#139` ✅ Bank Reconciliation Checker

**Before you can call this done (1)**

- legacy_gate bank_reconciliation gates 2 routes — delete in STEP 4.

## 38. Accounting Workspace  `accounting_workspace`

*Chart of accounts, journals, trial balance — the accountant's room.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Works well with | `fixed_assets`, `loans`, `reports`, `bank_reconciliation` |
| Opens | Businesses with an accountant, an auditor, or a tax filing. |
| Old plan gate to delete | `double_entry_ledger` |
| People call it | "accounting", "accounts", "chart of accounts", "journal", "trial balance", "bookkeeping", "ledger screens", "accountant" |

**What is inside it** (10 catalog features)

`#131` ✅ Double-Entry Journal Engine · `#137` ✅ Fiscal Year Closing Wizard · `#144` 🟡 Immutable Transaction Locks · `#145` ✅ Balanced Reversal Engine · `#147` ✅ Profit & Loss Statement · `#148` ✅ Balance Sheet · `#150` ✅ Double-Entry Trial Balance · `#152` ✅ Day Book Log · `#153` ✅ Account Ledger Report · `#146` ✅ Multi-Currency Configuration

**Before you can call this done (3)**

- READ CAREFULLY: the ALIASES here include "accounting" and "ledger", which are also Qore concepts. That is allowed — an alias is a word a user types, not a switchable thing. But the integrity test checks aliases against the Qore denylist to stop the AI reasoning "the user said accounting, so accounting is optional". If the test fails on this module, DO NOT delete the module — narrow the alias (e.g. "accounting screens") and keep the denylist intact.
- legacy_gate double_entry_ledger gates 4 routes. Deleting that boolean must NOT be read as "the ledger became optional". The ledger is Qore. Only the workspace is the module. Say so in the commit message.
- OFF BY DEFAULT for service and simple-retail presets. That is the concession that makes the freelancer real.

## 39. Tax & Compliance / E-Invoicing  `tax_compliance`

*Tax summaries, rate configuration and government e-invoicing.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Works well with | `invoicing`, `accounting_workspace`, `reports` |
| Opens | Registered businesses, anyone filing sales tax, exporters. |
| Old plan gate to delete | `e_invoicing` |
| People call it | "tax", "gst", "vat", "sales tax", "fbr", "e-invoicing", "e invoice", "compliance" |

**What is inside it** (9 catalog features)

`#39` ✅ Tax Verification QR Codes · `#44` ✅ Automatic VAT / GST Calculation · `#63` ✅ Tax-Inclusive / Exclusive Toggle · `#70` ✅ Tax-Exempt Customer Flag · `#98` ✅ Tax-Inclusive Procurement Toggle · `#140` ✅ Tax Summary Engine · `#158` ✅ Tax Compliance Summary · `#176` ✅ Tax Rate Breakdown · `#246` ✅ Custom Tax Rate Configurator

**Before you can call this done (2)**

- TaxService is QORE — tax CALCULATION always runs. This module is the compliance REPORTS and the e-invoicing submission. Disabling it must never change a total on an invoice. Test that explicitly.
- legacy_gates e_invoicing (3) and auto_vat_gst (1) — delete in STEP 4.

## 40. Fixed Assets & Depreciation  `fixed_assets`

*Track what you own long-term and write it down over time.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `accounting_workspace` |
| Works well with | `reports` |
| Opens | Anyone with machinery, vehicles or a tax depreciation schedule. |
| Old plan gate to delete | — none |
| People call it | "assets", "fixed assets", "depreciation", "equipment", "machinery", "vehicle", "furniture", "write down" |

**What is inside it** (2 catalog features)

`#108` ✅ Disaster & Asset Claim Manager · `#133` ✅ Fixed Asset Depreciation Tracker

**Before you can call this done (2)**

- Find the page paths — there is no V3/Assets or V3/Depreciation directory in resources/js/Pages. The controllers exist (feature #133 Built). Locate the pages or the nav item will 404.
- Disaster & Asset Claim Manager (#108) is grouped here; confirm that is the right home rather than Inventory.

## 41. Loans  `loans`

*Track money you borrowed and every repayment against it.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `accounting_workspace` |
| Works well with | `bank_accounts`, `reports` |
| Opens | Businesses financing stock or equipment. |
| Old plan gate to delete | — none |
| People call it | "loan", "loans", "borrowing", "finance", "installment", "qarz", "emi", "repayment" |

**What is inside it** (2 catalog features)

`#134` ✅ Business Loan Ledger · `#166` ✅ Loan Repayment Statement

**Before you can call this done (1)**

- Find the page path (no V3/Loans directory). V3/LoanController exists (feature #134 Built).

---

# GROUP G — GROWTH & OPERATIONS

## 42. Reports  `reports`

*Every report your system can produce, and none it cannot.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Works well with | `ai_insights`, `accounting_workspace` |
| Opens | Everyone. Auto-scales from a corner shop to a wholesaler. |
| Old plan gate to delete | `report_profit_loss` |
| People call it | "report", "reports", "reporting", "analytics", "summary", "statement", "profit and loss", "p&l" |

**What is inside it** (44 catalog features)

`#52` ✅ Aged Receivables Report · `#81` ✅ Aged Payables Directory · `#118` ✅ Stock Valuation by Location · `#147` ✅ Profit & Loss Statement · `#148` ✅ Balance Sheet · `#149` 🟡 Cash Flow Statement · `#150` ✅ Double-Entry Trial Balance · `#151` ✅ Sales Summary & Daily Trend · `#152` ✅ Day Book Log · `#153` ✅ Account Ledger Report · `#154` ✅ Party Statement (Khata Ledger) · `#155` ✅ Stock Valuation Report · `#156` ✅ Low Stock Shortages Report · `#157` ✅ Stock Movement History · `#158` ✅ Tax Compliance Summary · `#159` ✅ Item-Wise Profit Analysis · `#160` ✅ Party-Wise Profitability · `#161` ✅ Bill-Wise Profitability · `#162` ✅ Sales Aging Report · `#163` ✅ Expense by Category · `#164` ✅ Stock Summary & Aging · `#165` ✅ Item / Party Cross Reports · `#166` ✅ Loan Repayment Statement · `#167` 🟡 Graph Analytics Dashboard · `#168` ✅ Purchases Report · `#169` ✅ Transactions History · `#170` ✅ Expenses Directory · `#171` ✅ Bank Statements Log · `#172` ✅ Expiring Soon Alert · `#173` ✅ All Parties Credit Summary · `#174` ✅ General Discount Report · `#175` ✅ Category Profit & Loss · `#176` ✅ Tax Rate Breakdown · `#177` ✅ Sales Order Items · `#178` ✅ Daily Sales Trend · `#179` ✅ Stock Summary by Category · `#180` 🟡 Stock Aging Analysis · `#181` ✅ Sales & Purchases by Party · `#182` ✅ Item Report by Party · `#183` ✅ Party Report by Item · `#184` 🟡 Item-Wise Discount Report · `#185` ✅ Owner Daily Pulse · `#186` ✅ Sale Orders Report · `#187` ✅ Purchase Returns Report

**Before you can call this done (4)**

- THIS MODULE IS ONE TOGGLE, NOT FORTY-TWO. Which reports appear is DERIVED from the other enabled modules. No Inventory -> no stock reports. No Customers -> no customer statements. This is the single biggest simplification in the plan; do not let anyone re-expose individual report toggles.
- IMPLEMENTATION RULE: report visibility is computed from a report -> module map, not stored. Build that map next to ReportController and unit-test it: for every report, assert it disappears when its owning module is off AND that its route returns a friendly 404, never a 500.
- BIGGEST GATE JOB IN THE FILE: store.reports.* has 59 names and store.v3.reports.* has 15. Every one must be attributed to an owning module in the report map, or it leaks.
- legacy_gates to delete in STEP 4: report_profit_loss (12 — the most-gated key in the app), report_trial_balance (2), stock_valuation (3), point_in_time_inventory (2), discount_report (2), cash_flow_report (2), customer_insights (2), supplier_insights (2), stock_aging (1), owners_daily_pulse (1).

## 43. AI Business Insights  `ai_insights`

*Plain-language insights about your own numbers, with the evidence attached.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | **Metered** — allowance then capped |
| Needs | `reports` |
| Works well with | `inventory`, `customers`, `purchase_orders` |
| Opens | Any business with three months of history. Gets better the longer the Qore has been recording. |
| Old plan gate to delete | `growth_engine` |
| People call it | "ai", "insights", "suggestions", "alerts", "business intelligence", "growth engine", "assistant", "advice" |

**What is inside it** (46 catalog features)

`#188` 🟡 Per-Customer Rhythm Detection · `#189` ✅ Reorder Due Alerts · `#190` 🟡 Late Customer Warnings · `#191` 🟡 Churn Risk & Lost Customer Detection · `#192` 🟡 Quiet Decline Detection · `#193` 🟡 Rising Star Alerts · `#194` 🟡 Revenue Concentration Warning · `#195` 🟡 First-Purchase Follow-Up · `#197` 🟡 Market Basket Cross-Sell · `#198` 🟡 RFM Customer Segmentation · `#199` 🟡 Predicted Customer Lifetime Value · `#200` 🟡 Velocity-Based Demand Model · `#201` 🟡 Days-of-Cover & Stockout Dates · `#202` 🟡 Lead-Time-Aware Reorder Alerts · `#203` 🟡 Out-of-Stock Revenue Loss · `#204` 🟡 Dead Stock Detection · `#205` 🟡 Overstock & Trapped Cash · `#206` 🟡 Expiry Write-Off Forecast · `#207` 🟡 Demand Surge Alerts · `#208` 🟡 Return Rate Quality Flags · `#209` 🟡 ABC Product Classification · `#210` 🟡 Selling-Below-Cost Detection · `#211` 🟡 Margin Erosion Tracking · `#212` 🟡 Discount Leakage Analysis · `#213` 🟡 Price Headroom Detection · `#214` 🟡 Unprofitable Customer Detection · `#215` 🟡 Sales Mix Shift Alerts · `#216` 🟡 Aged Receivable Chasing · `#217` 🟡 Receivable Concentration Risk · `#218` 🟡 Collection Velocity Monitoring · `#219` 🟡 Supplier Payment Planning · `#220` 🟡 Revenue Anomaly Detection · `#221` 🟡 Peak Trading Hour Analysis · `#222` 🟡 Quiet Day Identification · `#223` 🟡 Cashier Discount Outlier Detection · `#224` ✅ Evidence On Every Insight · `#225` ✅ Self-Scoring Accuracy Loop · `#226` ✅ Self-Tuning Thresholds · `#227` 🟡 Automatic Noise Suppression · `#228` ✅ Learns Your Scale · `#229` 🟡 Intervention-Aware Scoring · `#230` ✅ Runs Without an AI Key · `#231` ✅ Daily Business Snapshots · `#232` 🟡 Snooze & Dismiss Memory · `#233` 🟡 Auto-Resolving Signals · `#234` ✅ Floating AI Assistant

**Before you can call this done (4)**

- FIX THIS BEFORE ANYTHING ELSE IN THIS ENTRY: growth_engine is ON BY DEFAULT on ltd_2, and PlanTruthFailClosedTest is failing because of it. That is a metered AI feature given free and forever to lifetime buyers. Fix the plan matrix, get the test green, THEN finalise this module. Writing the registry first encodes the bug where nobody can see it.
- billing is "metered", one of only four honest exceptions. Allowance per tier: 3/10/25/50 AI builds. Wire AiSpendGuard, AiRateLimiter and AiUsageRecorder from the FIRST call, not later.
- Most Growth Engine insights are deterministic statistics, not model calls (feature #230, "Runs Without an AI Key"). Meter the MODEL CALLS, not the insights. Charging for arithmetic you already computed is the kind of thing customers notice.
- The catalog lists 38 insight types as Partial — traced to InsightCatalog.php but not to named methods. Do not market a number. Market the behaviour.

## 44. Loyalty & Gift Cards  `loyalty_gift`

*Points, store credit and gift cards that bring people back.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | `customers` |
| Works well with | `pos`, `sales_returns` |
| Opens | Salons, cafes, retail chains, anywhere repeat visits matter. |
| Old plan gate to delete | — none |
| People call it | "loyalty", "points", "rewards", "gift card", "voucher", "store credit", "wallet", "membership" |

**What is inside it** (6 catalog features)

`#58` ✅ Customer Wallet Credit · `#59` ✅ Loyalty Points System · `#75` ✅ Customer Milestone Tracker · `#76` ✅ Digital Gift Cards · `#258` ✅ Anniversary & Birthday Tracker · `#259` ✅ Digital Gift Cards & Wallet Credit

**Before you can call this done (2)**

- Three route namespaces, one module. Confirm all three (loyalty 3 names, gift-cards 3, store-credit 2) really are one feature to a user. If gift cards are sold to a different buyer than loyalty points, split them — but only if that opens a business type.
- Store credit interacts with Returns (#9): a refund to store credit must post correctly whether or not this module is on.

## 45. WooCommerce / Marketplace Sync  `marketplace_sync`

*Keep products, stock and orders in step with your online channels.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | **Paid add-on** |
| Needs | `products`, `inventory` |
| Works well with | `purchase_orders`, `customers` |
| Opens | Shops that also sell online. The bridge between a counter and a website. |
| Old plan gate to delete | — none |
| People call it | "woocommerce", "woo", "online store", "ecommerce", "website", "amazon", "ebay", "tiktok" |

**What is inside it** (12 catalog features)

`#119` ✅ VenSynQ Command Center · `#120` ✅ 3-Click OAuth Store Connection · `#121` ✅ Automated Commission Isolation · `#122` 🟡 Dropshipping Order Automator · `#123` ✅ Just-in-Time Purchase Orders · `#124` ✅ Bulk Tracking ID Sync · `#125` ✅ Multi-Channel Expense Allocation · `#126` ✅ WooCommerce Real-Time Webhook · `#127` ✅ WooCommerce Customer Auto-Registry · `#128` ✅ WooCommerce Stock Sync · `#129` 🟡 Online Orders Bridge · `#130` ✅ Web Store Catalog Controls

**Before you can call this done (3)**

- billing is "addon" ($10 per connected account per month) — one of the four honest exceptions, because each connection costs you infrastructure. This is the ONLY module in the file a customer pays extra for on top of their tier.
- store.connections.* alone has 28 route names. Confirm they all belong here and none belongs to platform settings.
- VenSynQ has 36 green tests and is explicitly frozen for expansion (build plan PART 7). Wire it, do not extend it.

## 46. Staff & Attendance  `staff_attendance`

*Who works here, who is on shift, and who did what.*

| | |
|---|---|
| Status | 🟢 live |
| Billing | Free on every plan |
| Needs | — nothing |
| Works well with | `cash_register`, `multi_location`, `table_service` |
| Opens | Any business with more than one person behind the counter. |
| Old plan gate to delete | — none |
| People call it | "staff", "employees", "workers", "team", "attendance", "shift", "roster", "mulazim" |

**What is inside it** (7 catalog features)

`#8` ✅ Granular Multi-Store Roles · `#9` ✅ Cashier PIN Login · `#17` ✅ Security Activity Log · `#185` ✅ Owner Daily Pulse · `#243` ✅ Staff Invitation Codes · `#247` ✅ Cashier Inactivity Auto-Logout · `#253` ✅ Passcode Security Standards

**Before you can call this done (3)**

- CAREFUL: users, roles and permissions are QORE. This module is the staff DIRECTORY, shifts and attendance. Disabling it must never remove a user's ability to log in or change what they may do. If it can, it is not a module.
- store.v3.payroll.* and store.v3.employee-settlements.* exist and are frozen (qore.php frozen_surfaces). Do not quietly absorb them into this module before V1.
- The staff LIMIT stays a plan meter. The staff SCREEN is free. Two different things.

---

# The dependency tree

Read it downwards: a child cannot be switched on without its parent. Maximum depth is 4, which is the plan limit — if you ever need a fifth level, something modelled as `requires` is really an `enhances`.

```
products (#1)
├── pos (#5)
│   ├── park_recall (#13)
│   │   └── table_service (#14)
│   ├── table_service (#14)
│   └── cash_register (#35)
├── pre_sales (#15)
├── inventory (#16)
│   ├── pre_sales (#15)
│   ├── multi_location (#17)
│   │   └── stock_transfers (#18)
│   ├── stock_transfers (#18)
│   ├── stock_takes (#19)
│   ├── batches_expiry (#20)
│   ├── serials (#21)
│   ├── cookbook (#29)
│   │   ├── production_runs (#30)
│   │   └── composite_items (#31)
│   └── marketplace_sync (#45)
├── variants (#22)
├── barcodes_labels (#23)
├── units_of_measure (#24)
├── purchases (#25)
│   ├── purchase_orders (#26)
│   ├── purchase_returns (#27)
│   └── landed_cost (#28)
├── cookbook (#29)
│   ├── production_runs (#30)
│   └── composite_items (#31)
└── marketplace_sync (#45)
services (#2)
customers (#3)
├── recurring_invoices (#10)
└── loyalty_gift (#44)
suppliers (#4)
└── purchase_orders (#26)
invoicing (#6)   [needs one of: products/services]
└── recurring_invoices (#10)
quotations (#7)   [needs one of: products/services]
sales_orders (#8)   [needs one of: products/services]
sales_returns (#9)   [needs one of: products/services]
b2b_proposals (#11)   [needs one of: products/services]
pricing_tiers (#12)   [needs one of: products/services]
khata_credit (#32)   [needs one of: customers/suppliers]
payments (#33)   [needs one of: customers/suppliers]
expenses (#34)
bank_accounts (#36)
└── bank_reconciliation (#37)
accounting_workspace (#38)
├── fixed_assets (#40)
└── loans (#41)
tax_compliance (#39)
reports (#42)
└── ai_insights (#43)
staff_attendance (#46)
```

---

# Coverage — what real businesses land on

| Business | Modules | Count | Ships when |
|---|---|---|---|
| **Simple Counter** | products, pos | **2** | now |
| **Retail Shop** | products, pos, inventory, customers, khata_credit, payments, expenses, barcodes_labels, reports | **9** | now |
| **Grocery / Kiryana** | products, pos, inventory, units_of_measure, purchases, suppliers, customers, khata_credit, payments, expenses, barcodes_labels, cash_register, reports | **13** | now |
| **Pharmacy** | products, pos, inventory, batches_expiry, purchases, suppliers, customers, khata_credit, payments, expenses, barcodes_labels, reports | **12** | now |
| **Cafe** | products, pos, inventory, cookbook, expenses | **5** | now |
| **Restaurant** | products, pos, park_recall, table_service, cookbook, inventory, expenses, staff_attendance, reports | **9** | now |
| **Bakery** | products, pos, inventory, cookbook, production_runs, batches_expiry, sales_orders, customers, expenses, reports | **10** | now |
| **Mobile & Electronics** | products, pos, inventory, serials, purchases, suppliers, customers, khata_credit, payments, sales_returns, expenses, reports | **12** | now |
| **Clothing & Footwear** | products, variants, pos, inventory, barcodes_labels, customers, sales_returns, expenses, reports | **9** | now |
| **Hardware / General Store** | products, pos, inventory, units_of_measure, purchases, suppliers, customers, khata_credit, payments, expenses, reports | **11** | now |
| **Wholesale / Distribution** | products, inventory, multi_location, stock_transfers, sales_orders, pricing_tiers, purchases, suppliers, purchase_orders, customers, khata_credit, payments, accounting_workspace, reports | **14** | now |
| **Multi-Branch Retail** | products, pos, inventory, multi_location, stock_transfers, purchases, suppliers, customers, khata_credit, staff_attendance, cash_register, expenses, reports | **13** | now |
| **Freelancer / Consultant** | services, invoicing, quotations, sales_returns, customers, expenses, reports | **7** | blocked on `services`, `quotations` |
| **Salon / Spa** | services, customers, invoicing, staff_attendance, loyalty_gift, expenses, reports | **7** | blocked on `services` |
| **Repair Workshop** | services, products, pos, park_recall, inventory, customers, invoicing, expenses, reports | **9** | blocked on `services` |

Range: 2 to 14 modules, against a full ERP of 46. Nobody is forced into anything.

---

# Features that belong to no module (38)

Nothing here is lost — every one of these is either **platform** (always on, never a toggle), **Qore** (foundation, never visible), **frozen** for V1, or an **internal ops tool**. They are listed so that nobody rediscovers one in a month and adds a 47th module in a hurry.

| # | Feature | Where it actually lives |
|---|---|---|
| 1 | ✅ One-Click Interactive Demo | Platform |
| 2 | ✅ 14-Day Free Trial | Platform (billing) |
| 3 | ✅ Instant Store Creator | Platform |
| 4 | 🟡 Smart Industry Seeding | Platform (presets — see ai_builder.php) |
| 5 | ✅ Dark Theme (Midnight Nebula) | Platform (appearance) |
| 6 | ✅ Light Theme | Platform (appearance) |
| 7 | ✅ Multi-Store Hub Dashboard | Platform (multi-store hub) |
| 10 | ✅ Progressive Web App (PWA) | Platform |
| 11 | ✅ Self-Guiding Setup Tour | Platform (onboarding) |
| 12 | ✅ Coupon Code Upgrades | Platform (billing) |
| 13 | 🟡 Hardware Status Badge | Platform (hardware) |
| 14 | ✅ One-Click Cache Refresh | Platform |
| 15 | ✅ Owner Profile Card | Platform |
| 16 | ✅ Test Data Wipe | Platform (ops) |
| 21 | ✅ Senior Mode Accessibility | Platform (accessibility) |
| 22 | ✅ Color-Coded Price & Qty | Platform (accessibility) |
| 142 | ✅ Charity Allocation Engine | FROZEN — charity/donations |
| 235 | ✅ Smart Capture (Image & Audio) | FROZEN — Smart Capture |
| 236 | 🟡 Bring-Your-Own-Key AI | FROZEN — bring-your-own-key |
| 237 | ✅ Multi-Tenant Store Isolation | QORE — tenancy |
| 238 | 🟡 Three-Zone Security Architecture | QORE — security zones |
| 239 | ✅ SuperAdmin Command Center | Internal ops tool, not a customer feature |
| 240 | ✅ Subscription Plan Enforcement | QORE — plan enforcement |
| 241 | 🟡 Redis-Cached Plan Gates | QORE — plan gate caching |
| 242 | ✅ Automated Limit Override Manager | Internal ops tool |
| 244 | ✅ Ephemeral Demo Sandbox | Platform (demo) |
| 245 | ✅ Soft-Delete Trash Management | Platform (recycle bin) |
| 248 | 🟡 Module Toggle Controls | REPLACED BY THIS REGISTRY |
| 249 | ✅ Backups & Google Drive Sync | Platform (backups) |
| 254 | 🟡 Device-Adaptive Layouts | Platform (responsive CSS) |
| 255 | ⛔ Custom SMTP Mail Gateway | Excluded by your decision |
| 256 | ⛔ SMS & Messaging Gateway | Excluded by your decision |
| 260 | 🟡 API Access & Webhooks | Business tier and up — not a module |
| 261 | ✅ Custom Domain Mapping | Enterprise — not a module |
| 262 | ⛔ Dedicated Account Manager | Support commitment, not software |
| 263 | ✅ SSO / SAML Authentication | Enterprise — not a module |
| 264 | ⛔ White-Glove Onboarding | Support commitment, not software |
| 265 | ⛔ Priority Email & Phone Support | Support commitment, not software |

---

# Catalog hygiene notes

Found while mapping. None of these break anything, but each will waste somebody's afternoon eventually.

- **Feature #72 is used twice** — "A4 & Letter Invoice PDF Export" in `venqore_built.md` and "Supplier Performance Score" in `venqore_coming_soon.md`. Renumber one of them.
- **#93 appears twice inside `venqore_coming_soon.md`**, under both Communications and Landed Cost.
- **Known duplicates by design**: #257 = #53, #258 = #75, #259 = #58/#76, #179 = #164, #182/#183 = #165, #92 = #189. Fine to keep, but they inflate the "265 features" number by about six.
- The Partial and Coming Soon files now carry many `✅ Verified` lines. Those were folded in as **done** here, and every one is flagged in the registry's `verify` array rather than silently trusted.


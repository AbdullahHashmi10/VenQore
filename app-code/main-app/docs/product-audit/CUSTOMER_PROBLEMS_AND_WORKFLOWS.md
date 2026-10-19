# How VenQore helps a business run better

Review date: 16 October 2026. This is the internal customer-success and demonstration guide. It covers the operating families behind all registered business types. For the exact type-to-setup mapping, use [Business type coverage](BUSINESS_TYPE_COVERAGE.md) and its [scenario matrix](business-type-scenario-matrix.csv). For procedures, use the [canonical how-to guide snapshot](GENERATED_HOW_TO_GUIDES.md).

## Start with the owner's work

Ask the owner to describe a normal day, then a difficult day. Find out what they sell, how work arrives, when stock changes, when payment arrives, who can approve exceptions and what they need to know at closing. Build the demonstration around those answers.

Do not treat a business name as a complete requirements list. A bakery may sell ready-made goods, take cake orders, serve seated guests and supply restaurants. A mechanic may sell parts without fitting them. A wholesaler may operate a retail counter. These are combinations of operating workflows, and need a combined demonstration.

| Owner's problem | What the owner can do | Relevant workflow | What improvement to measure |
| --- | --- | --- | --- |
| I enter the same sale in several places | Record the supported sale with its customer, stock and payment context | POS or invoice → payment → stock movement → journal | Time spent entering and reconciling the same transaction |
| I do not know what is really left | Inspect recorded quantities and reconcile physical counts | Purchases → stock movements → count → reviewed adjustment | Unexplained differences at stock count |
| Customers say they paid, but my book disagrees | Show invoices, receipts, allocations and outstanding balances | Customer record → statement → payment allocation | Time to explain a balance; number of disputed balances |
| Sales look good but I cannot tell what I earned | Review sales, cost, expenses and profit for the same period | Accurate purchases/openings → selling → expenses → profitability report | Time to produce a reviewable period report |
| Staff keep asking me to approve things verbally | Give each role the right actions and track sensitive requests | Staff permissions → request → manager review → decision | Untracked exceptions and approval turnaround |
| An order gets lost between people | Keep the work in a visible order or job record | FOH, online order, sales order or service job lifecycle | Unfinished work, missed orders and duplicate entry |
| My business has outgrown its original setup | Add the supported workflows the business now needs | Review builder configuration, dependencies and access | Time to onboard the next workflow without losing existing records |
| I need help finding the right screen | Use the documented guides and in-app assistance | Ask Vena → open the suggested workflow | Time to complete a routine task without owner assistance |

## Retail: keep the counter, stock and customer account connected

Applicable examples include grocery, supermarkets, apparel, footwear, electronics, hardware, stationery, home goods and other merchandise businesses. Batch and serial requirements are additional scenarios, not assumptions about every retailer.

### A normal trading day

1. Set up the catalogue with the correct categories, units, tax treatment, prices and stock policy. Import existing data where suitable and review validation errors before relying on it.
2. Record opening stock and incoming purchases in the right location. If using batches, expiry or serials, capture the identifying information at intake.
3. At the till, scan or search for an item. Select the customer when their history or credit account matters. Confirm quantity, price and discount.
4. Record the actual payment, including supported split payments or a permitted outstanding balance. Give the customer their receipt.
5. If the customer returns goods, use the original-sale return workflow and inspect the resulting refund or credit.
6. At closing, compare the register with counted cash. Review sales, expenses, stock differences and outstanding customer balances.

The benefit is less reconstruction at closing: the owner can follow a transaction from sale to payment and inventory records. Accurate input data and correct workflows remain necessary.

Do not include automated bank reconciliation or government e-invoice generation in the demonstration promise: their current controller actions are incomplete. Ordinary payments, journals and tax reports are separate workflows that still need their own verification.

### Retail variations to demonstrate

| Variation | Demonstrate | Check before offering |
| --- | --- | --- |
| Grocery and loose goods | Pack conversions, measured quantity, search/scanning and customer khata | Actual scale, barcode format, base unit and rounding behavior |
| Clothing and footwear | Different sizes/colours, corresponding prices and stock | Internal variants versus separate grouped products online |
| Electronics and mobile retail | Serial/IMEI intake, selected-unit sale and original-sale return | Exact serial uniqueness and warranty workflow; no blanket warranty automation claim |
| Pharmacy and dated goods | Batch intake, expiry visibility and traceability | Actual checkout expiry policy; no claim of prescription, controlled-drug or regulatory coverage |
| Hardware and building goods | Selling units, customer terms and delivery documents | Fractions, conversions and the actual dispatch/partial-dispatch flow |
| Multiple locations | Receive at one location, transfer and sell at another | Warehouse versus separate-store behavior and consolidated reporting scope |
| Retail plus web ordering | Publish eligible goods and handle an online order | Product eligibility, payment choices and disconnected POS stock conflicts |

## Wholesale: keep orders, units, prices and collections clear

Applicable examples include FMCG, grain, fabric, hardware, electrical supply, pharmaceutical stockists, technology distributors, packaging and other B2B trading businesses.

### From supplier delivery to customer collection

1. Create the supplier and customer records, including supported credit terms and relevant price tiers.
2. Define the goods' base units and pack conversions. Receive the purchase against the correct supplier and warehouse.
3. Create the customer order or invoice with the agreed units and prices. Record any advance or part payment through the supported allocation flow.
4. Use the supported fulfilment and challan actions. Inspect actual dispatch quantities and outstanding obligations rather than assuming an invoice proves delivery.
5. Receive later collections against the appropriate invoices and inspect the customer's statement.
6. Review receivables aging and supplier balances. Use the results to plan follow-up and buying decisions.

The owner can explain what was ordered, what was supplied and what remains unpaid. Do not promise shorter collection periods or higher margins without customer evidence.

### Wholesale variations to demonstrate

| Variation | Demonstrate | Check before offering |
| --- | --- | --- |
| Cartons, boxes and loose units | Buy in one unit and sell in another | Exact conversion, tax and decimal rules |
| Negotiated customer prices | The customer's permitted tier on a transaction | Whether pricing applies automatically in each selling path |
| Customer pays across several invoices | Payment allocation and remaining balances | Actual allocation behavior; do not assume oldest-first |
| Partial delivery | Order, actual dispatched lines and remaining quantity | Full journey and cancellation/return behavior |
| Distributor with several stock locations | Transfer, receiving and location-specific availability | Transfer state, permissions and accounting scope |
| Imported stock | Record purchase cost and supported additional costs | Landed cost allocation is beta in the current registry |
| Regulated goods | Ordinary stock, batches, balances and trade documents | Specialist compliance is a separate requirement |

## Restaurants, cafés and prepared food: make handoffs visible

Applicable examples include dine-in restaurants, cafés, quick-service outlets, takeaway shops, food trucks, bakeries, mithai shops, catering and cloud kitchens. Their service patterns differ; select the appropriate lanes rather than showing every restaurant the same floor plan.

### From order to settlement

1. Configure the lanes the business uses: tables, takeaway and delivery. Set the supported charges, kitchen behavior and stock policy.
2. For dine-in, create zones and tables and open the right table. For counter service, start the relevant counter or takeaway flow.
3. Add the dishes, quantities and permitted modifiers. Review changes on the active order.
4. Send the intended items or courses to the kitchen. Use a live kitchen display when connected, or the configured ticket printer.
5. Track preparation and fulfilment. For delivery, associate the available customer and rider information.
6. Print the bill or take payment according to the staff member's permission. Use bill splitting only in its supported connected workflow.
7. Review open tickets, settlement and the day's trading. If production stock matters, record recipes and production through the supported path.

The owner gains a shared record of what guests ordered, what staff sent to preparation and which tickets still need attention. The current recipe auto-deduction module is beta: demonstrate the exact production or selling path before making ingredient automation part of a promise.

### Food-business variations to demonstrate

| Variation | Demonstrate | Check before offering |
| --- | --- | --- |
| Dine-in restaurant | Seating, table changes, kitchen firing and payment | Concurrent devices, split bills, permissions and printer routing |
| Café or chai counter | Rapid order entry, add-ons, takeaway and receipt | Actual busy-counter usability and hardware |
| Fast food and cloud kitchens | Takeaway/delivery queue and preparation | Rider dispatch and customer notification scope |
| Bakery and cake orders | Ready-made inventory, advance orders and production | Custom-order schedule, recipe units and output posting |
| Mithai and weighed food | Measured selling and packaging units | Scale protocol and conversions |
| Catering | Customer order, planned production and later billing | Dedicated quotation screen is building; use only verified available alternatives |
| Outage on one counter | Saved FOH floor, tickets, cash settlement and replay | Previously saved device, seven-day limit, no offline shared floor or split bill |

## Services, repairs and field work: get the work through to an invoice

Applicable examples include repairs, salons, freelance work, professional services, field trades, cleaning, equipment hire and recurring classes. These use shared job and billing workflows; a business label does not create a specialist practice-management system.

### From request to collection

1. Create the customer and record what work is requested in a job or work order.
2. Set the schedule and assign the responsible employee. Use the calendar to inspect the workload.
3. Update the job as it progresses. Use on hold or awaiting parts when the work cannot continue, so unfinished work remains visible.
4. Where supported, check tools out against the job and record their return. Keep equipment needing maintenance identifiable.
5. Complete the work and use its invoice conversion action. Review services, parts and final charges rather than assuming every detail transfers automatically.
6. Record the actual payment or amount due. For supported recurring work, configure a recurring invoice with an agreed schedule.
7. Review completed-but-uninvoiced work, overdue balances, upcoming appointments and outstanding tool issues.

The owner can follow the request through the person doing the work to billing and collection, reducing reliance on memory and chat history.

### Service-business variations to demonstrate

| Variation | Demonstrate | Check before offering |
| --- | --- | --- |
| Phone, computer and appliance repair | Job intake, customer, assignment, status and invoice | Serial/device linkage, parts issue and warranty behavior in the actual job path |
| Garage and workshop | Job card, employee responsibility, parts and labour billing | Bay workflow, service history and parts deduction scope |
| Salon and spa | Booking, assigned person, completion and payment | Appointment conflicts and commission behavior; no assumption of a full salon suite |
| Freelancers and agencies | Service invoice, customer balance and recurring billing | Dedicated quotation and milestone functionality require separate verification |
| Electricians, plumbers and field teams | Job schedule, staff assignment and issued tools | No unverified GPS, route optimisation, native dispatch or mobile offline promise |
| Professional practices | Ordinary client billing, jobs and balances | No specialist case, clinical, legal, tax-filing or records-management claims |
| Rental and event hire | Tool/equipment checkout and return | No assumed deposits, damage charging, availability booking or hire-rate engine |
| Gyms, classes and tuition | Supported customer and recurring billing | Recurring invoices do not prove access control, class enrolment or attendance entitlements |

## Light manufacturing: connect materials to finished output

Applicable examples include commercial baking, tailoring, furniture making, roasting/blending, print work, soap/candle production, assembly, fabrication and custom merchandise.

1. Define materials and finished products with accurate units and opening stock.
2. Define a recipe or bill of materials and inspect the input cost.
3. Select the intended production quantity and review material availability.
4. Post the supported production run. Inspect materials consumed, finished quantities received and the history created.
5. Sell or fulfil from finished stock, then review cost and margin with the relevant expenses included.
6. Compare the actual process with recorded production. Record supported corrections rather than silently changing opening quantities.

This helps explain where stock went and what was produced. It is not evidence of industrial MRP, machine scheduling, quality control, subcontracting, process waste/yield planning or full factory ERP. Verify each requirement separately.

## Businesses that combine operating patterns

| Mixed business | Combined journey | Additional exception to demonstrate |
| --- | --- | --- |
| Phone shop with repairs | Serial-aware retail sale plus repair job and invoice | Return a sold unit and distinguish it from a repair intake |
| Bakery with café and wholesale | Production, counter/FOH and B2B credit sale | Reserve an advance order without confusing it with ready-made availability |
| Wholesaler with retail counter | Pack conversions, customer tier and fast counter sale | Confirm the correct price and unit at each selling surface |
| Manufacturer with a showroom | Production output, warehouse movement and retail sale | Prevent the same stock being counted twice across locations |
| Salon selling products | Appointment/job, service billing and merchandise sale | Separate service revenue from goods cost |
| Contractor selling supplied parts | Scheduled job, parts supply, invoice and collection | Verify exactly when parts leave stock |
| Store with online orders | Publish, accept order, counter sale and fulfil | Check stock reservations and a disconnected counter selling the last unit |
| Owner with several stores | Store selection, permissions and each store's reporting | Distinguish a store switch from a consolidated cross-entity report |

## Exception scenarios that must be tested

Run the relevant journey under these conditions and record the actual result. These are requirements for verification, not assertions that all cases currently pass.

| Dimension | Cases | Evidence to retain |
| --- | --- | --- |
| Payment | Full, part, split, credit, overpayment, refund, failed attempt | Invoice, payment allocation, party balance and journal |
| Stock | In stock, last unit, no stock, fractions, pack conversion, two concurrent sellers | Before/after quantity and movement records |
| Goods identity | Batch, expiry, serial, internal variant, grouped online option | Selected identity and lifecycle after sale/return |
| Permissions | Owner, manager, cashier, waiter, accountant, read-only and denied action | Visible navigation plus server result for direct access |
| Approval | Permitted action, limit exceeded, pending, approved, rejected and retry | Request, decision and resulting posting |
| Fulfilment | Partial, cancellation, substitution, completed order and returned goods | State changes, stock and settlement |
| Connectivity | Connected, server unreachable, offline reload, restart, reconnect, duplicate replay | Local queue, final posted records and conflict review |
| Devices | Browser, phone browser, mobile shell, Station, real printer/scanner/scale | Device/version and observed result |
| Time | Store timezone, midnight, backdated record, recurring schedule and expiry | Record timestamp, report period and scheduled outcome |
| Data | Empty account, imported catalogue, invalid row, large catalogue and duplicate identity | Validation and saved record |
| Lifecycle | Trial, active, restricted, expired and reactivated account | Actual allowed and refused operations |

## Offline use explained properly

The current authority is [Offline contract](../OFFLINE_CONTRACT.md). It promises supported till selling and single-device FOH work from saved state, with later replay. Previously saved pages can open as dated copies; other saving generally needs a connection. Reconnect within seven days. Offline sign-in, manager approvals, shared table state between disconnected devices, online card processing, fresh reports, AI and online ordering are not promised offline. Ledger posting happens on sync. Do not describe saved pages as live data.

The mobile pilot has a narrower published scope than browser/Station: its README excludes native offline selling, printing/scanning, push and customer shopping mode. A browser feature does not automatically become a supported native mobile feature.

## How to prove value without inventing results

Agree one baseline with each customer before a pilot. Record the starting workflow, sample size, measurement window and who collected it. Then compare the same work after onboarding.

| Desired outcome | Measurement | Conditions |
| --- | --- | --- |
| Less re-entry | Minutes to record and reconcile the same completed transaction | Same transaction complexity and operator experience |
| Better collection visibility | Time to list and explain overdue balances | Correct opening balances and payment allocation |
| Fewer missed jobs | Completed jobs left uninvoiced at review | Consistent job status updates |
| Clearer stock | Physical count differences and unexplained movements | Accurate receiving, units and stock policy |
| Better restaurant handoffs | Missing/incorrect tickets and time to settle | Comparable service periods and trained staff |
| More understandable margins | Time to produce a reviewable period report | Accurate cost, expense and tax data |

Describe these as goals until measured. Sales copy must not turn an illustrative saving into a guaranteed customer result.

## Opportunities to make the customer experience easier

These are recommendations, not shipped promises: onboarding that follows the customer's first real transaction; import previews with clear correction guidance; an owner closing checklist; a view of completed service jobs still awaiting invoices; simpler explanations of customer balances; visible sync conflicts with a resolution guide; hardware setup checks; and demonstrations built around the customer's actual product/unit/payment cases.

Prioritise the points where staff hand work to someone else: order to kitchen, job to invoice, delivery to collection, purchase to stock and cash drawer to day close. Reducing a repeated handoff problem usually matters more than adding another menu.

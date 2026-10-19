# VenQore feature and capability catalog

Snapshot: 16 October 2026 · Audience: product, customer success and sales enablement.

## What this count means

This replaces the old approximate feature-count summary for this snapshot. There is no defensible single count of everything a customer can do: modules, reports, device integrations, workflow actions and metric definitions overlap. The following counts remain separate. The itemized capability rows are an editorial inventory of source-backed capabilities and candidates, not a count of production-certified features. No customer-facing marketing should lead with these counts.

| Inventory unit | Count |
| --- | --- |
| Registered business types | 85 |
| Business sectors | 5 |
| Registered configurable modules | 48 |
| Modules marked live by source registry | 45 |
| Modules marked beta | 2 |
| Modules still building | 1 |
| Editorial capability rows, including qualifications and internal operations | 228 |
| Report-hub destinations | 43 |
| Registered metric definitions, including platform-scoped readings | 438 |
| Legacy dashboard card definitions exported by Vena | 20 |
| Canonical how-to guides | 37 |
| Registered HTTP route entries, including API/actions/redirects | 1378 |
| React Pages files, including helper and legacy pages | 393 |

## Evidence and readiness

The application bootstrapped successfully and its router and canonical registries were exported without invoking business actions. Every route controller target that reflection could inspect existed; that check does not execute its logic or prove permissions, database correctness or usability. Source extraction read files and recorded functions, route references, render references, headings and review markers. It is not a claim of line-by-line human review. No complete regression suite or exhaustive authenticated browser walkthrough has passed as part of this snapshot.

A registry status of live is the product’s own classification. It does not mean tested in this review, enabled on the deployed site, included in every plan or available on every device. The evidence JSON preserves module verify notes, permissions, dependency rules and route patterns. The review intentionally leaves uncertain claims visible.

**Availability conflicts found in source:** bank reconciliation is marked live in the registry but its import method is a placeholder and its index returns empty data. E-invoicing is marked live but generation and waybill actions return HTTP 501. Marketing campaign creation and saving are placeholders. Do not treat the registry live count as a count of working workflows. See IMPLEMENTATION_MARKERS.md and VERIFICATION_AND_CLAIMS.md.

## Capability inventory

Each row describes something a customer or platform operator can do, its purpose, and its operating qualification. Evidence is grouped by the relevant implementation area; a referenced file is evidence of the workflow family, not independent proof of every sentence. Detailed route and page inventories are linked below.

### Workspace and getting started

Source family: config/business_types.php; config/ai_builder.php; app/Http/Controllers/BuilderDiscoveryController.php; app/Http/Controllers/BuilderController.php; app/Http/Controllers/WorkspaceBuilderController.php.

| ID | Capability | Customer purpose | How / qualification |
| --- | --- | --- | --- |
| CAP-001 | Business description discovery | Start with how the business operates | Describe the business in the workspace builder; review its questions and recommendations. |
| CAP-002 | Business type selection | Start from a relevant operating setup | Select a matching business type; a label is not proof of specialist industry functionality. |
| CAP-003 | Review configuration before applying | Avoid committing to the wrong setup | Review the proposed workspace and adjust it before provisioning. |
| CAP-004 | Enable and disable work areas | Keep navigation relevant | Use System Builder; respect dependency and data-retention explanations. |
| CAP-005 | Business terminology | Use familiar words for customers, jobs and goods | Business presets and tenant terminology adapt labels. |
| CAP-006 | Create another store | Separate another business or branch workspace | Use the store creation workflow; distinguish tenant stores from warehouses. |
| CAP-007 | Module dependency handling | Avoid a setup missing required components | Builder resolves hard requirements and alternative dependencies. |
| CAP-008 | Configuration history | Understand changes to a workspace | Inspect builder history and available restore actions; verify target behavior before promising full rollback. |

### Selling and invoicing

Source family: app/Http/Controllers/SaleController.php; app/Http/Controllers/PosController.php; app/Http/Controllers/NewInvoiceController.php; app/Http/Controllers/ParkedSaleController.php; app/Http/Controllers/CommunicationController.php; resources/js/NewPos; resources/js/NewInvoice; app/Engines/SaleService.php.

| ID | Capability | Customer purpose | How / qualification |
| --- | --- | --- | --- |
| CAP-009 | Counter checkout | Serve customers at the till | Add items, review totals, select payment and complete the sale. |
| CAP-010 | Barcode item entry | Reduce manual product selection | Scan a configured product barcode into the till. |
| CAP-011 | Product search | Find items without their barcode | Search the product catalogue from checkout. |
| CAP-012 | Customer-linked sales | Keep the sale in the customer's history | Select the customer before completing the transaction. |
| CAP-013 | Quantity and price editing | Handle the actual deal being made | Edit allowed fields; approval rules can restrict changes. |
| CAP-014 | Line and bill discounts | Apply agreed price concessions | Apply a permitted discount and check the resulting total. |
| CAP-015 | Price tiers | Maintain different selling prices | Configure tiers and use the appropriate customer or transaction price. |
| CAP-016 | Tax calculation | Calculate the configured taxes on a sale | Set tax treatment and inspect line and document totals. |
| CAP-017 | Split tender | Receive one bill across payment accounts | Allocate the amount across available payment methods. |
| CAP-018 | Partial payment and outstanding balance | Record what is paid and what remains due | Associate the customer and payment allocation; verify credit permissions. |
| CAP-019 | Park and recall a bill | Serve another person while a bill waits | Hold the cart, then reopen the parked sale. |
| CAP-020 | Invoice creation | Bill work or products away from the counter | Open the invoice editor, select the customer and lines, then save or post. |
| CAP-021 | Service lines on invoices | Charge for work alongside goods | Add an appropriate service or permitted ad hoc line. |
| CAP-022 | Invoice printing and PDFs | Give customers a transaction record | Use the transaction's print or PDF action. |
| CAP-023 | Digital receipt links | Let a customer reopen a receipt | Use the signed public receipt flow; access expires and is token protected. |
| CAP-024 | Email a receipt | Deliver a supported issued receipt to a customer | Send from the transaction workflow; requires configured email and permission. |
| CAP-025 | WhatsApp document draft | Prepare a supported transaction message for manual sharing | Review the prepared draft and send it yourself; this does not automatically call a messaging service. |
| CAP-026 | Sales history | Find earlier business transactions | Open Sales and filter or search the list. |
| CAP-027 | Original-sale returns | Correct a transaction when goods come back | Open the return flow against the original transaction. |
| CAP-028 | Refund and credit handling | Record money or credit owed after a return | Review return quantities and permitted settlement options. |
| CAP-029 | Pre-sales | Record a possible future sale | Create and review a pre-sale, then convert when accepted; separate from the unfinished Quotations module. |
| CAP-030 | Sales orders | Track an order before fulfilment | Create an order, review its progress and convert through the supported workflow. |
| CAP-031 | B2B proposals | Present a business offer with multiple lines | Create a proposal and use its supported conversion actions. |
| CAP-032 | Recurring invoices | Repeat agreed billing on a schedule | Set customer, lines and recurrence; scheduler and delivery configuration matter. |
| CAP-033 | Invoice reminders | Follow up on amounts due | Configure reminders and delivery; do not promise automatic WhatsApp. |
| CAP-034 | Delivery challan preview and print | Give dispatch a goods document | Preview from a sale or print an existing dispatched challan. |

### Inventory and purchasing

Source family: app/Http/Controllers/InventoryController.php; app/Http/Controllers/BatchTrackingController.php; app/Http/Controllers/SerialTrackingController.php; app/Http/Controllers/PurchaseOrderController.php; app/Engines/InventoryService.php; app/Engines/FifoService.php; config/modules.php.

| ID | Capability | Customer purpose | How / qualification |
| --- | --- | --- | --- |
| CAP-035 | Product catalogue | Keep a consistent list of goods | Create products with identity, category, price and stock settings. |
| CAP-036 | Categories | Organise a large catalogue | Group products and filter relevant lists. |
| CAP-037 | Product variants | Distinguish sizes, colours and other choices | Configure supported variants; online grouped options have different restrictions. |
| CAP-038 | Multiple barcodes | Recognise the codes used for the same goods | Configure supported product barcode mappings. |
| CAP-039 | Units of measure | Buy and sell in different pack sizes | Define base units and conversions before transacting. |
| CAP-040 | Weighed quantities | Sell goods measured by weight | Configure weighted products and verify the scale and unit workflow. |
| CAP-041 | Stock balances | Know what is recorded as available | Open Inventory for the selected location; offline data may be stale. |
| CAP-042 | FIFO stock costing | Connect cost of sales to received stock | Record purchases accurately; the stock engine consumes costed batches. |
| CAP-043 | Stock movement trail | Explain why quantities changed | Inspect movements from purchases, sales, transfers and adjustments. |
| CAP-044 | Low-stock visibility | Identify items needing attention | Set reorder-related fields and inspect stock readings and reports. |
| CAP-045 | Negative-stock rules | Control selling beyond recorded availability | Configure and test the relevant stock policy and approval path. |
| CAP-046 | Warehouse locations | Separate stock held in different places | Create locations and use the correct warehouse on transactions. |
| CAP-047 | Stock transfers | Move goods with a recorded trail | Select source, destination and items; verify both sides afterwards. |
| CAP-048 | Physical stock takes | Compare shelf counts with recorded quantities | Open Stock Take, count and review differences before posting. |
| CAP-049 | Stock adjustments | Record corrections and losses | Use a permitted adjustment with a clear reason. |
| CAP-050 | Batch tracking | Identify groups of received goods | Capture batch information and inspect its lifecycle. |
| CAP-051 | Expiry tracking | See dated stock requiring attention | Record expiry dates and review expiry reports; verify checkout blocking separately. |
| CAP-052 | Serial and IMEI tracking | Follow an individual unit | Record serials on intake and use serial tracking through sales and returns. |
| CAP-053 | Purchases | Record incoming goods and supplier obligations | Enter the supplier, goods, costs, tax and payment. |
| CAP-054 | Supplier purchase orders | Tell a supplier what you need | Create a purchase order and receive through its supported flow. |
| CAP-055 | Partial purchase-order receiving | Record deliveries that arrive in parts | Receive a subset of ordered goods and inspect remaining quantities. |
| CAP-056 | Purchase returns and debit notes | Correct supplier stock and balances | Create the supported return or debit note from the original records. |
| CAP-057 | Supplier balances | Know what remains payable | Inspect supplier statements and payment allocations. |
| CAP-058 | Bulk import and mapping | Move existing catalogue data into the system | Use import templates, map fields and review validation before importing. |
| CAP-059 | Data export | Work with business data outside the app | Use the relevant export action; supported formats vary by screen. |
| CAP-060 | Recycle bin | Recover supported deleted records | Open Recycle Bin and restore eligible items; not every deletion is reversible. |
| CAP-061 | Landed cost allocation | Include freight and duty in stock cost | BETA in the module registry; do not sell as a completed workflow. |

### Production and recipes

Source family: app/Http/Controllers/CookbookController.php; app/Http/Controllers/ProductionController.php; app/Http/Controllers/ProductionBomListController.php; config/modules.php.

| ID | Capability | Customer purpose | How / qualification |
| --- | --- | --- | --- |
| CAP-062 | Recipe and bill of materials | Define what a made product consumes | Create a recipe with ingredients and quantities. |
| CAP-063 | Recipe costing | Understand ingredient cost before pricing | Review recipe cost using accurate input costs and units. |
| CAP-064 | Recipe simulation | Preview the supported recipe calculation | Use Simulate on a recipe and review its output before a real run; output correctness remains untested here. |
| CAP-065 | Production runs | Record a batch of finished goods | Choose recipe and quantity, review availability and post production. |
| CAP-066 | Ingredient consumption | Connect made goods to raw-material stock | Production reduces inputs through the stock engine. |
| CAP-067 | Finished-goods output | Keep ready-made stock visible | Posted production adds the resulting finished units. |
| CAP-068 | Production history | Find when goods were made | Inspect production runs and logs. |
| CAP-069 | Automatic composite deduction | Consume recipe inputs when an item sells | BETA in the module registry; validate the specific selling path before offering it. |

### Restaurant and front of house

Source family: app/Http/Controllers/FohController.php; app/Http/Controllers/TableServiceController.php; app/Http/Controllers/RestaurantDashboardController.php; app/Http/Controllers/ReservationController.php; app/Http/Controllers/RiderController.php; app/Support/FohSettings.php; resources/js/Pages/Foh; docs/OFFLINE_CONTRACT.md.

| ID | Capability | Customer purpose | How / qualification |
| --- | --- | --- | --- |
| CAP-070 | Front of House overview | See restaurant work in one operating area | Open FOH and choose the lanes used by the business. |
| CAP-071 | Floor plan and zones | Represent the dining room | Configure zones and table positions in the floor builder. |
| CAP-072 | Table occupancy | Know which tables are in use | Seat guests and open the relevant table order. |
| CAP-073 | Restaurant reservations and waitlist | Record guests expected or waiting | Use the supported reservation list, creation, seating and cancellation actions. |
| CAP-074 | Edit an open table order | Keep changes attached to the right guests | Add, remove or change items on the active table. |
| CAP-075 | Move or merge table work | Handle guests changing seats or joining | Use the supported table actions and inspect the resulting bill. |
| CAP-076 | Courses and kitchen firing | Tell preparation staff what is ready to make | Send the intended course or items to the kitchen. |
| CAP-077 | Kitchen display | Follow preparation from a shared screen | Open the kitchen view; live updates require connectivity. |
| CAP-078 | Kitchen unavailable-item list | Tell staff which dishes cannot currently be served | Use the kitchen 86 List; verify enforcement across each ordering channel. |
| CAP-079 | Kitchen performance view | Review recorded preparation activity | Open kitchen Stats and verify its definitions and periods. |
| CAP-080 | Customer order display | Show order progress on a counter or TV screen | Open the customer order screen and test the connected ticket updates. |
| CAP-081 | Kitchen ticket printing | Give preparation staff a paper order | Print tickets; Station handles configured printer routing. |
| CAP-082 | Kitchen ticket reprinting | Recover a ticket without inventing a new order | Use the supported KOT reprint action and verify duplicate handling. |
| CAP-083 | Kitchen station routing | Direct connected preparation work to the right station | Configure kitchen routing; offline multi-station routing is not promised. |
| CAP-084 | Kitchen recall and cancellation handling | Handle changed preparation work visibly | Use supported recall and cancellation actions and inspect the kitchen state. |
| CAP-085 | Takeaway lane | Manage orders collected at the counter | Open Takeaway, create the ticket and advance its state. |
| CAP-086 | Delivery lane | Keep delivery orders separate from tables | Open Delivery and record the customer and fulfilment details. |
| CAP-087 | Rider records and assignments | Know who is handling a delivery | Use delivery rider management and the supported assignment workflow. |
| CAP-088 | Delivery address lookup | Reuse supported delivery contact information | Use the FOH address book and verify the customer and address before assignment. |
| CAP-089 | Modifiers and add-ons | Record customisations and extras | Configure add-on groups and select them while ordering. |
| CAP-090 | Service charges, tips and delivery fees | Include configured charges clearly | Set FOH charging rules and inspect totals before payment. |
| CAP-091 | Tip reporting | Review recorded staff tip information | Open the supported tips report and verify the calculation and period. |
| CAP-092 | Print bill without checkout rights | Let waiting staff request payment safely | Staff with FOH access can print; taking payment needs checkout permission. |
| CAP-093 | Guest requests from table QR | Keep supported guest calls attached to the table | Inspect incoming requests and clear handled calls; validate the customer-facing QR journey. |
| CAP-094 | Bill splitting | Let a group settle separately | Use the supported online split flow; not available offline. |
| CAP-095 | FOH cash checkout | Settle the restaurant bill | Use the shared sale checkout and record the selected tender. |
| CAP-096 | Restaurant stock policy | Decide whether dishes track stock | Set the supported FOH stock policy; recipe automation remains a separate beta concern. |
| CAP-097 | Single-device offline service | Continue tables, takeaway and delivery during outages | Previously opened and saved device; queue replays later; no shared offline floor. |
| CAP-098 | Offline conflict review | Find table changes needing a person | Inspect Needs a look after reconnect; do not promise automatic conflict resolution. |

### Service businesses

Source family: app/Http/Controllers/ServiceJobController.php; app/Http/Controllers/ToolController.php; resources/js/Pages/Services.

| ID | Capability | Customer purpose | How / qualification |
| --- | --- | --- | --- |
| CAP-099 | Work orders and job cards | Keep each piece of work in one record | Create a job with the customer and work requested. |
| CAP-100 | Quick booking | Record a new request promptly | Use the service quick-booking flow. |
| CAP-101 | Appointment calendar | See scheduled work | Open the service calendar and inspect assigned times. |
| CAP-102 | Rescheduling | Keep the plan current when dates change | Edit the job schedule through the supported action. |
| CAP-103 | Employee job assignment | Make responsibility visible | Assign staff to the job and review the assignment. |
| CAP-104 | Job status tracking | Find delayed or unfinished work | Move jobs through scheduled, in progress, on hold, awaiting parts and completion. |
| CAP-105 | Job detail and activity | Recover context without asking every employee | Open the job detail and review its recorded history. |
| CAP-106 | Convert completed work to invoice | Reduce re-entry at billing | Use the job's invoice conversion action and review the resulting invoice. |
| CAP-107 | Tool register | Know which tools belong to the business | Create tools with the supported tool information. |
| CAP-108 | Tool checkout to a job | Keep issued equipment accountable | Check out the tool against the job or employee workflow. |
| CAP-109 | Tool returns | Record equipment coming back | Check in or return the issued tool. |
| CAP-110 | Tool maintenance | Flag equipment needing attention | Record maintenance through the tool management action. |

### Money and accounting

Source family: app/Http/Controllers/AccountingController.php; app/Http/Controllers/PaymentController.php; app/Http/Controllers/FinanceController.php; app/Http/Controllers/BankReconciliationController.php; app/Http/Controllers/ChequeBookController.php; app/Http/Controllers/V3; app/Engines/AccountingService.php; config/modules.php.

| ID | Capability | Customer purpose | How / qualification |
| --- | --- | --- | --- |
| CAP-111 | Customer credit accounts | Record buy-now-pay-later trade | Assign the customer, credit terms and outstanding balance. |
| CAP-112 | Credit limits and approvals | Restrict exposure beyond agreed terms | Configure limits and verify how blocked sales request approval. |
| CAP-113 | Customer and supplier statements | Explain balances with transaction history | Select the party and period in statements. |
| CAP-114 | Receivables aging | Prioritise overdue customer follow-up | Review debt grouped by age and open the underlying party records. |
| CAP-115 | Receive customer money | Record collections against actual bills | Receive payment and allocate it to the correct documents. |
| CAP-116 | Pay supplier balances | Keep outgoing settlement attached to trade | Record payment to supplier and review the allocation. |
| CAP-117 | Payment allocation | Separate money received from invoices settled | Inspect allocations and remaining balances. |
| CAP-118 | Cash and bank accounts | Keep money sources distinct | Configure accounts and choose the correct account per transaction. |
| CAP-119 | Inter-account transfers | Record money moved within the business | Use the funds or transfer workflow and inspect both accounts. |
| CAP-120 | Register shifts | Account for a counter's working period | Open the shift with the correct till and staff context. |
| CAP-121 | Cash closing and variance | Compare counted cash with expected cash | Count, close and investigate any difference. |
| CAP-122 | Expense categories | Understand where money is spent | Set categories and enter expenses consistently. |
| CAP-123 | Expense records and receipts | Keep evidence with expenditure | Add the amount, account, category and supported attachment. |
| CAP-124 | Double-entry journal posting | Connect business activity to accounting records | Supported posted transactions generate balanced journal entries. |
| CAP-125 | Chart of accounts | Organise accounting classification | Open Accounting Workspace with the correct permissions. |
| CAP-126 | Manual journals | Record accountant-led adjustments | Use permitted journal entry and review debits and credits. |
| CAP-127 | Trial balance | Review account balances together | Open the report for the relevant date or period. |
| CAP-128 | Profit and loss | Separate revenue, cost and operating expenses | Review the period and definition before interpreting profit. |
| CAP-129 | Balance sheet | See assets, liabilities and equity | Review the as-of date and opening balances. |
| CAP-130 | Cash flow | Understand movements in business cash | Use the cash-flow report and inspect its classification. |
| CAP-131 | Bank reconciliation workspace (incomplete) | Preserve the intended statement-to-books workflow for review | Current controller supplies an empty list and import is a placeholder; do not promise working bank-statement matching. |
| CAP-132 | Cheque books and leaves | Track issued cheque stationery and usage | Create a cheque book and inspect available and issued leaves. |
| CAP-133 | Received cheques | Follow cheques received from customers | Record and update through the supported cheque lifecycle. |
| CAP-134 | Bounced payment records | Correct supported bounced-cheque situations | Use the bounce workflow and inspect reversal, party balance and fees. |
| CAP-135 | Customer advances | Record money received before the final bill | Use the supported advance and later settlement workflow. |
| CAP-136 | Supplier advances | Record supplier money paid ahead of delivery | Use the supported advance and allocation workflow. |
| CAP-137 | Loan tracking | See borrowing and repayment obligations | Use loan workflows and statements. |
| CAP-138 | Fixed assets | Record longer-lived business assets | Add asset details and review the account treatment. |
| CAP-139 | Depreciation | Recognise asset cost over time | Configure and run supported depreciation with accountant review. |
| CAP-140 | Fiscal years and opening balances | Begin and close accounting periods | Set opening balances and use the supported fiscal-year workflow. |
| CAP-141 | Tax summaries | Review configured tax-related records | Use the relevant report with correct tax settings; no blanket compliance claim. |
| CAP-142 | E-invoicing and waybill generation (incomplete) | Preserve intended government-document workflows for review | Current generate and waybill endpoints return HTTP 501 coming soon; do not sell them as working integrations. |
| CAP-143 | Bad debt and write-offs | Record balances that will not be recovered | Use the permitted adjustment and approval workflow. |
| CAP-144 | Loss and shortage records | Explain missing cash or stock | Record the supported loss event with evidence and review its posting. |
| CAP-145 | Payroll and staff settlement | Record supported staff money movements | Verify the payroll flow for the target business; do not imply statutory payroll coverage. |
| CAP-146 | Donations and charity records | Record supported charitable business movements | Frozen/niche surface in the Qore registry; verify availability and posting before offering. |
| CAP-147 | Disaster claims | Record supported exceptional business claims | Inspect the actual claim workflow and accounting; not an insurance filing integration. |

### Other retained or incomplete surfaces

Source family: app/Http/Controllers/MarketingCampaignController.php; config/qore.php; routes/web.php.

| ID | Capability | Customer purpose | How / qualification |
| --- | --- | --- | --- |
| CAP-148 | Marketing campaign workspace | Retain visibility of a previously advertised area | Incomplete: index supplies empty data and create/store contain implementation placeholders; do not sell campaign automation. |
| CAP-149 | Visitor chatbot and human support handoff | Explore the retained visitor assistance surface | Separate from Vena and Builder; frozen/unowned in Qore metadata; verify actual availability and provider behavior. |
| CAP-150 | Money pipeline and clearing surfaces | Preserve older finance namespaces in the audit | Qore metadata explicitly asks for verification; no customer promise from the namespace alone. |
| CAP-151 | Digital hub surfaces | Preserve older digital product/chat namespaces in the audit | Qore metadata explicitly asks for verification; inspect active routes before describing an end-user workflow. |
| CAP-152 | Disassembly records | Retain the reverse-production surface for review | Qore metadata leaves ownership unresolved; verify runtime behavior and accounting before offering. |

### Customers, staff and control

Source family: app/Http/Controllers/PartyController.php; app/Http/Controllers/StaffInvitationController.php; app/Http/Controllers/AttendanceController.php; resources/js/Pages/Loyalty; resources/js/Pages/Approvals; config/permissions.php; resources/js/Data/staff_presets.json.

| ID | Capability | Customer purpose | How / qualification |
| --- | --- | --- | --- |
| CAP-153 | Customer directory | Reuse customer contact and trading history | Create a customer once and attach later trade to that record. |
| CAP-154 | Supplier directory | Keep buying relationships organised | Create suppliers and inspect purchases and balances. |
| CAP-155 | Loyalty points | Recognise repeat purchases | Configure supported earning and redemption rules and test reversals. |
| CAP-156 | Gift cards | Record prepaid gifting value | Issue and redeem through the supported gift-card workflow. |
| CAP-157 | Store credit | Keep customer credit available for future trade | Use the supported issue, balance and redemption workflow. |
| CAP-158 | Staff invitations | Bring staff into the correct store | Invite by email or supported join code. |
| CAP-159 | Role presets | Start with suitable access for a job | Select the cashier, waiter, manager or other supported preset. |
| CAP-160 | Granular permissions | Limit sensitive actions to authorised staff | Review permissions for sales, stock, money and reports. |
| CAP-161 | Cashier identification and PIN | Attribute counter actions to staff | Configure staff PINs; offline sign-in is not promised. |
| CAP-162 | Attendance | Record staff presence | Use attendance and inspect the corresponding history. |
| CAP-163 | Approval inbox | Let managers review sensitive requests | Managers open pending requests and inspect the evidence. |
| CAP-164 | Staff approval submissions | Let staff follow requests they made | Open My submissions and inspect status. |
| CAP-165 | Activity log | Trace who performed an action | Filter recorded activity by user, action or time. |
| CAP-166 | Two-factor authentication | Add a second step to account sign-in | Use the supported setup and recovery-code flow. |
| CAP-167 | Profile and appearance | Keep personal access and display preferences usable | Use Profile and Appearance; verify mobile behavior separately. |

### Online shop and QR catalogue

Source family: routes/commerce.php; app/Http/Controllers/Commerce; resources/js/Pages/Commerce; resources/js/Pages/OnlineStore; resources/js/Pages/OnsiteCatalogue.

| ID | Capability | Customer purpose | How / qualification |
| --- | --- | --- | --- |
| CAP-168 | Publish a public store | Let customers find and order published goods | Complete merchant settings and product publication, then publish. |
| CAP-169 | Pause online ordering | Stop new orders when the business cannot fulfil them | Use the pause control while keeping the catalogue visible. |
| CAP-170 | Online product publication | Choose what shoppers can buy | Publish eligible products; weighted, serial and legacy-variant cases need explicit support. |
| CAP-171 | Product photos and featured items | Help shoppers recognise what they want | Add supported photos and choose featured goods. |
| CAP-172 | Shop search and category filters | Make a catalogue easier to browse | Use product search and category chips. |
| CAP-173 | Grouped online options | Present separate size or colour products together | Group separate products with option labels; this differs from internal variants. |
| CAP-174 | Customer cart and checkout | Turn product choices into an order | Review items, customer details, fulfilment and payment instructions. |
| CAP-175 | Pickup and delivery choices | Match ordering to how the business fulfils | Enable the desired fulfilment options and review checkout rules. |
| CAP-176 | Delivery areas, fees and minimums | Avoid accepting unsuitable delivery orders | Configure supported zones and the corresponding thresholds. |
| CAP-177 | Opening-hour checkout rules | Control when orders are accepted | Set opening hours and whether out-of-hours ordering is allowed. |
| CAP-178 | Bank-transfer and cash instructions | Give shoppers supported payment choices | Configure manual payment instructions; these are not a payment gateway. |
| CAP-179 | Online order inbox | Keep incoming orders visible | Review and accept or decline before the deadline. |
| CAP-180 | Prepare, ready and complete states | Tell staff and shoppers where an order stands | Advance the supported order status workflow. |
| CAP-181 | Customer-approved substitutions | Resolve unavailable goods transparently | Propose changes and wait for the customer to agree. |
| CAP-182 | Order stock reservations | Protect accepted or waiting online demand | Inspect stock holds; disconnected selling still needs reconciliation. |
| CAP-183 | Customer status links | Let a shopper follow their order | Open the token-protected status page. |
| CAP-184 | Reorder | Make a repeat order easier | Rebuild from the old order with current prices and availability. |
| CAP-185 | Order lookup and cancellation | Help customers recover or stop an order | Use the supported lost-link and cancellation flows; state rules apply. |
| CAP-186 | Offers and coupon codes | Run a defined promotion | Set dates, discount, eligible category or store scope and usage rules. |
| CAP-187 | Online order analytics | Review recent online trading | Inspect order, completion, discount and timing measures. |
| CAP-188 | Customer contact links | Make a manual call or WhatsApp follow-up easier | Use the contact link; it does not imply automated message delivery. |
| CAP-189 | Order email notifications | Keep people informed through configured mail | Requires working mail configuration and notification processing. |
| CAP-190 | QR catalogue | Let visitors browse from their own phone | Configure the onsite catalogue and share its QR code. |
| CAP-191 | Table-linked QR ordering | Attach supported phone orders to a dining context | Configure QR ordering and verify the exact customer-to-FOH flow. |

### AI, reporting and connected devices

Source family: app/Services/Vena; app/Reckoner; app/Services/Dashboard; resources/js/lib/reportCatalog.js; app/Http/Controllers/SmartCapture; repo:app-code/windows-app/README.md; repo:app-code/windows-app/package.json; repo:app-code/mobile-app/README.md.

| ID | Capability | Customer purpose | How / qualification |
| --- | --- | --- | --- |
| CAP-192 | Dashboard card selection | Put relevant business information first | Add only permitted cards from the available catalogue. |
| CAP-193 | Dashboard layout editing | Arrange the workspace around the owner | Move and resize cards and save the layout. |
| CAP-194 | Report hub | Find the right view for a question | Choose the report category and relevant date or party filters. |
| CAP-195 | Shared metric definitions | Understand what a displayed number means | Inspect Reckoner definitions and supported evidence links. |
| CAP-196 | Owner Daily Pulse | Review a focused business summary | Open the protected owner report with the required access. |
| CAP-197 | Vena how-to assistance | Find a workflow without searching every menu | Ask how to perform a task; follow the linked guide. |
| CAP-198 | Vena business questions | Explore available business readings | Ask about supported numbers and review the evidence and permissions. |
| CAP-199 | SmartCapture document input | Reduce copying from bills and invoices | Upload supported input, check extracted fields and confirm. |
| CAP-200 | SmartCapture voice input | Start supported entry from spoken information | Provide supported audio and review every proposed line. |
| CAP-201 | AI usage visibility | Know how the allowance is being used | Open AI Usage and inspect the remaining allowance. |
| CAP-202 | Bring your own AI key | Use a supported provider account | Configure keys through the permitted settings; provider charges still apply. |
| CAP-203 | Growth insights | Surface business patterns for review | Open Growth Engine and verify the data behind recommendations. |
| CAP-204 | Offline POS sales queue | Keep supported till selling during an outage | Previously saved device; cash/manual-entry workflow; sync and review afterwards. |
| CAP-205 | Saved offline page copies | Consult previously saved business information | Offline pages are marked not live; general saving needs internet. |
| CAP-206 | Seven-day reconnect rule | Keep the device's offline access within policy | Reconnect within the contract limit; queued sales are retained on lock. |
| CAP-207 | Windows thermal receipt printing | Print receipts directly from a counter PC | Configure the compatible printer in Station and test its driver or ESC/POS path. |
| CAP-208 | Cash-drawer pulse | Open a compatible drawer from Station | Wire to the supported printer interface and test the configured pulse. |
| CAP-209 | Kitchen and bar printer roles | Send different documents to intended printers | Configure role and backup printer mappings in Station. |
| CAP-210 | A4 and label printing | Print invoices and labels at the intended size | Configure the destination and dimensions and test actual hardware. |
| CAP-211 | Serial barcode scanner | Use supported COM-connected scanners | Configure Station scanner settings and verify terminators. |
| CAP-212 | Weighing scale connection | Bring supported scale readings into the till | Configure serial settings and verify unit, stability and calibration. |
| CAP-213 | Pole and customer displays | Show the sale to the customer | Configure the VFD or second-monitor display and test cart updates. |
| CAP-214 | Terminal pairing and replacement | Move a licensed till to a new device | Use the supported pairing or replacement flow; verify seat limits. |
| CAP-215 | Station app lock and owner controls | Restrict access to counter administration | Configure supported owner controls; this is not universal Windows lockdown. |
| CAP-216 | Station update handling | Keep an installed companion current | Check current update policy; installed and portable builds differ. |
| CAP-217 | Mobile business shell | Reach business workflows from a phone | Pilot WebView with native navigation; not a fully native offline POS. |
| CAP-218 | Backups | Keep a recoverable copy of store data | Create and download through Backups; perform a separate restore rehearsal. |
| CAP-219 | WooCommerce connection | Connect supported shop and back-office flows | Configure credentials, product matching and sync; demonstrate one complete order. |
| CAP-220 | Marketplace channel connections | Connect approved marketplace accounts | Feature flags and external approval apply; a connector file is not proof of live service. |

### Platform operations (internal, not merchant feature claims)

Source family: app/Http/Controllers/SuperAdmin; app/Http/Controllers/Admin; app/Http/Controllers/BillingController.php; app/Support/PlanCatalog.php; routes/web.php.

| ID | Capability | Customer purpose | How / qualification |
| --- | --- | --- | --- |
| CAP-221 | Plans and entitlement administration | Control what an account is allowed to use | Platform administrators manage plan definitions, limits and overrides. |
| CAP-222 | Subscription and add-on billing | Manage the commercial account lifecycle | Use configured checkout and billing provider workflows. |
| CAP-223 | Trial and grace lifecycle | Handle accounts before and after payment | Verify trial expiry and restricted-account behavior. |
| CAP-224 | Coupons and deal redemption | Apply supported commercial offers | Validate eligibility and redemption behavior before quoting a promotion. |
| CAP-225 | Store administration and support | Investigate and assist account issues | Use authorised platform store and support tools. |
| CAP-226 | Platform health and audit surfaces | See operational issues | Inspect authorised logs, health pages and audit tools. |
| CAP-227 | Public marketing and resources | Explain the product and offer help | Landing, features, solutions, comparisons, pricing, docs, tools, blog and contact are public surfaces. |
| CAP-228 | Installer and updater | Maintain supported self-hosted installations | Release policy applies; existence of update tooling is not release approval. |

## Every configurable module

Generated from config/modules.php, not a second entitlement registry. Snapshot only; runtime availability comes from the actual module, plan, permission and capability gates.

### 1. Products (`products`)

The physical things you sell, with prices and categories.

Registry status: **live**. Billing classification: `included`. Matching route entries: 22.

Entry routes: `store.inventory.index`.
Permissions: `inventory.view`, `inventory.create`, `inventory.edit`, `inventory.delete`.
Required modules: . Alternative dependency sets: [].
Page declarations: `Inventory/InventoryList.jsx`, `Inventory/Categories.jsx`, `V3/Products`.

Recorded verification notes (some are historical or already resolved):
- RESOLVED, but read this before writing EnsureModule: Products and Inventory (#16) are served by the SAME controller (InventoryController). The split above is by route NAME, not by controller. Never widen either module to "store.inventory.*" — that wildcard belongs to neither and would let one module gate the other. This was the most likely gate bug in the registry and it is now closed by construction.
- The nav label says "Products" but the URL says /inventory/list. Harmless today. If you ever rename these routes to products.*, regenerate Ziggy and grep the React pages for route('store.inventory.index') in the same commit.

### 2. Services (`services`)

The work you do, billed by job, hour or contract — with no stock behind it.

Registry status: **live**. Billing classification: `included`. Matching route entries: 27.

Entry routes: `store.service-jobs.index`.
Permissions: `sales.create`, `sales.view`.
Required modules: . Alternative dependency sets: [].
Page declarations: `Services/ServiceJobs.jsx`, `Services/CreateServiceJob.jsx`, `Services/ServiceJobDetail.jsx`, `Services/ServiceCalendar.jsx`, `Services/Tools.jsx`.

Recorded verification notes (some are historical or already resolved):
- Web UI: ServiceJobController (index/create/store/show/updateStatus/convertInvoice), ToolController (index/store/update/maintenance/checkout/checkin/destroy) and pages (Services/ServiceJobs, Services/CreateServiceJob, Services/ServiceJobDetail, Services/ServiceCalendar, Services/Tools) built on ServiceEngine.

### 3. Customers (`customers`)

A directory of who you sell to, with their history and balance.

Registry status: **live**. Billing classification: `included`. Matching route entries: 22.

Entry routes: `store.customers.index`.
Permissions: `sales.view`.
Required modules: . Alternative dependency sets: [].
Page declarations: `Parties/PartiesList.jsx`, `Sales/Customers`.

Recorded verification notes (some are historical or already resolved):
- store.parties.* has 9 names and is SHARED with Khata (#32) — the ledger view lives there. Split explicit names between #3 and #32 so disabling Khata does not hide the customer directory.
- Confirm store.customers.index resolves; the store group shows only 1 customers.* name plus customers.search outside it.

### 4. Suppliers (`suppliers`)

A directory of who you buy from, with balances and statements.

Registry status: **live**. Billing classification: `included`. Matching route entries: 7.

Entry routes: `store.suppliers.index`.
Permissions: `purchases.suppliers`, `purchases.view`.
Required modules: . Alternative dependency sets: [].
Page declarations: `Suppliers/`.

Recorded verification notes (some are historical or already resolved):
- legacy_gate suppliers_directory currently gates 2 routes. STEP 4 deletes this boolean from every plan — after that, this module is free on all tiers. Confirm the gate is removed from routes/web.php too, or the module will be enabled and still 403.

### 5. POS / Counter (`pos`)

Fast counter checkout with scanning, split payments and receipts.

Registry status: **live**. Billing classification: `included`. Matching route entries: 24.

Entry routes: `store.pos`.
Permissions: `pos.checkout`, `pos.open_session`, `pos.close_session`, `pos.discounts`, `pos.void_item`.
Required modules: products. Alternative dependency sets: [].
Page declarations: `Pos.jsx`.

Recorded verification notes (some are historical or already resolved):
- DUPLICATE ROUTE — FIX THIS ONE FIRST. /pos is declared twice and BOTH resolve to the name "store.pos": web.php line 377 (in the outer store. group, NO permission middleware) and line 1073 (in the inner store. group, WITH permission:pos.checkout). Laravel keeps the last registration for name lookups but the FIRST match for dispatch — so the unprotected line 377 route is the one that actually serves /pos. Delete line 377. See PATCHES.md.
- store.pos is an EXACT name. The pattern store.pos.* does NOT match it. Both forms are listed above deliberately — do not "tidy" this into one line.
- Confirm whether store.sales.store is POS-only or shared with Invoicing (#6). If shared it must be listed in BOTH, and the gate must allow it when EITHER module is on.

### 6. Invoicing (`invoicing`)

Create, send and print invoices — with or without a shop counter.

Registry status: **live**. Billing classification: `included`. Matching route entries: 23.

Entry routes: `store.sales.index`.
Permissions: `sales.create`, `sales.view`, `sales.edit`.
Required modules: . Alternative dependency sets: [["products", "services"]].
Page declarations: `Sales/CreateInvoice.jsx`, `Sales/SalesHistory.jsx`, `Sales/MasterSales.jsx`, `Sales/Show.jsx`.

Recorded verification notes (some are historical or already resolved):
- Confirm every name above resolves. store.sales.* had 24 names on 15 Aug; the ones not listed here belong to POS (#5), Sales Orders (#8), Park & Recall (#13) or Returns (#9). No sales.* name may be left unclaimed — an unclaimed name is an ungated route.
- A service-only invoice must post revenue with no COGS. Blocked on the Services module (#2) test.

### 7. Quotations (`quotations`)

Send price quotes and turn accepted ones into orders or invoices.

Registry status: **building**. Billing classification: `included`. Matching route entries: 2.

Entry routes: .
Permissions: `sales.quotations`.
Required modules: . Alternative dependency sets: [["products", "services"]].
Page declarations: .

Recorded verification notes (some are historical or already resolved):
- DEMOTED FROM beta TO building, 15 Aug. The full surface is exactly two routes: quotations.store (POST) and quotations.convert-to-order (POST). There is no index, no create, no show, no edit — and no page anywhere under resources/js/Pages (only Proposals/ and a Marketing/Tools/Quote.jsx lead-magnet). A customer cannot open a quotation. "beta" would imply they could; they cannot.
- WHAT TO BUILD: index + create + show, on V3\QuotationController. The write path and the convert-to-sale path already exist, so this is a UI job, not an engine job — the cheapest module left on the board.
- KNOCK-ON 1: B2B Proposals (#11) no longer requires this. Proposals has its own complete resource surface (11 routes) and stands alone. Changed to requires_one [products|services], with quotations as enhances.
- KNOCK-ON 2: the freelancer preset lists quotations and is blocked_by it. It will not ship until this is live.
- While building: excluded from every preset and never mentioned in the AI system prompt.

### 8. Sales Orders (`sales_orders`)

Take an order today, fulfil and invoice it later.

Registry status: **live**. Billing classification: `included`. Matching route entries: 15.

Entry routes: `store.sales-orders.index`.
Permissions: `sales.create`, `sales.view`.
Required modules: . Alternative dependency sets: [["products", "services"]].
Page declarations: `SalesOrders/`.

Recorded verification notes (some are historical or already resolved):
- store.sales-orders.* had 4 names and store.v3.sales-orders.* had 3 on 15 Aug. Confirm both groups belong to this module and not to Pre-Sales (#15).

### 9. Sales Returns & Refunds (`sales_returns`)

Take goods back, refund money or issue credit — correctly, in the books.

Registry status: **live**. Billing classification: `included`. Matching route entries: 8.

Entry routes: `store.returns-history.index`.
Permissions: `sales.returns`, `pos.refund`, `sales.void`.
Required modules: . Alternative dependency sets: [["products", "services"]].
Page declarations: `Returns/`.

Recorded verification notes (some are historical or already resolved):
- A return must produce a balanced reversal (SaleReversalService, feature #145). Assert the ledger balances after a return in the preset golden test.

### 10. Recurring Invoices (`recurring_invoices`)

Bill the same customer on a schedule without touching it each month.

Registry status: **live**. Billing classification: `included`. Matching route entries: 13.

Entry routes: `store.recurring-invoices.index`.
Permissions: `sales.create`, `finance.receive_payment`.
Required modules: invoicing, customers. Alternative dependency sets: [].
Page declarations: `RecurringInvoices/`, `Reminders/`.

Recorded verification notes (some are historical or already resolved):
- legacy_gate recurring_invoices gates 7 routes; invoice_reminders gates 4 more. Both booleans are deleted in STEP 4. Remove the middleware from the routes in the same commit.
- Decide whether Payment Reminders should be its own module or stay folded in here. Folded in = one fewer toggle; the build plan does not number it separately, so it stays here.

### 11. B2B Proposals (`b2b_proposals`)

Build detailed multi-item business proposals and convert the winners.

Registry status: **live**. Billing classification: `included`. Matching route entries: 11.

Entry routes: `store.proposals.index`.
Permissions: `sales.quotations`.
Required modules: . Alternative dependency sets: [["products", "services"]].
Page declarations: `Proposals/ProposalsList.jsx`.

Recorded verification notes (some are historical or already resolved):
- SECURITY BUG — A PAID FEATURE IS FREE RIGHT NOW. The proposals resource is registered TWICE: web.php line 1130 with plan.feature:b2b_proposal_builder, and line 1518 WITHOUT it. Laravel keeps the last registration, so the ungated one wins and every tenant on every plan can reach the B2B Proposal Builder. Delete line 1518. This is exactly the "wrong entitlement key gives away a paid feature forever" failure the capabilities guide warns about. See PATCHES.md.
- legacy_gate b2b_proposal_builder gates 11 route names (the audit counted 5 from an older list). All of them come off in STEP 4 anyway, since this module becomes free — but fix the duplicate FIRST, so you are deleting a gate on purpose rather than discovering it was never enforced.

### 12. Pricing Tiers & Discounts (`pricing_tiers`)

Different prices for different customers — wholesale, retail, staff.

Registry status: **live**. Billing classification: `included`. Matching route entries: 3.

Entry routes: .
Permissions: `sales.edit`, `inventory.edit`.
Required modules: . Alternative dependency sets: [["products", "services"]].
Page declarations: `V3/`.

Recorded verification notes (some are historical or already resolved):
- RESOLVED: the real names are store.v3.products.tiers.{index,store,destroy} — nested inside a Route::prefix('products/{productId}') group at web.php:1995. Price tiers are edited INSIDE a product, which is why there is no V3/Tiers page and no nav item. That is correct behaviour, not a gap.
- Auto-applying customer discounts (#28) may live in POS instead. Decide which module owns it.

### 13. Hold / Park & Recall (`park_recall`)

Hold an unfinished bill and come back to it — a table, a job, a waiting customer.

Registry status: **live**. Billing classification: `included`. Matching route entries: 6.

Entry routes: .
Permissions: `pos.checkout`.
Required modules: pos. Alternative dependency sets: [].
Page declarations: `Sales/ParkedSales.jsx`.

Recorded verification notes (some are historical or already resolved):
- This module has no nav item of its own. That is correct (it lives inside POS), but CAPABILITIES_FILE_GUIDE flags "no nav and no cards" as a red flag. It survives the flag because it is the split that opens three business types — keep it, and keep this note so nobody merges it away.

### 14. Restaurant & café (FOH) (`table_service`)

Floor plan, table status and kitchen tickets for dine-in service.

Registry status: **live**. Billing classification: `included`. Matching route entries: 79.

Entry routes: `store.foh`, `store.restaurant.dashboard`, `store.tables.plan`, `store.restaurant.kitchen`, `store.restaurant.queue`, `store.restaurant.dispatch`, `store.restaurant.riders`, `store.restaurant.settings`, `store.foh.settings`.
Permissions: `pos.checkout`, `foh.access`.
Required modules: pos, park_recall. Alternative dependency sets: [].
Page declarations: `Restaurant/Dashboard.jsx`, `Restaurant/Kitchen.jsx`, `Restaurant/CustomerQueue.jsx`, `Restaurant/Dispatch.jsx`, `Restaurant/Riders.jsx`, `Restaurant/Settings.jsx`, `TableService/FloorBuilder.jsx`, `Foh/Index.jsx`, `Foh/Settings.jsx`, `Inventory/AddOns.jsx`.

Recorded verification notes (some are historical or already resolved):
- UPGRADED FROM THE OLD DRAFT. AI_BUILDER_MASTER_MAP marked restaurant_tables NEEDS_VALIDATION with no routes, based on the 8 Jul route list. The repository has RestaurantDashboardController.php, app/Engines/OccupancyEngine.php, 4 store.restaurant.* routes, 3 store.api.occupancies.* routes and 2 pages. This module is real.
- These routes carry NO permission or plan gate at all today, except occupancies.occupy/.release which check pos.checkout. Anyone authenticated on the tenant can open the kitchen screen. Decide whether that is intended before launch.
- Walk it end to end: seat a table, fire a kitchen ticket, settle the bill. Then clear this array.

### 15. Pre-Sales Reservation (`pre_sales`)

Reserve stock against a future sale so it cannot be sold twice.

Registry status: **live**. Billing classification: `included`. Matching route entries: 8.

Entry routes: `store.pre-sales.index`.
Permissions: `sales.create`, `inventory.view`.
Required modules: products, inventory. Alternative dependency sets: [].
Page declarations: `SalesOrders/PreSales.jsx`, `Sales/CreatePreSale.jsx`.

Recorded verification notes (some are historical or already resolved):
- legacy_gate pre_sales_reservation gates 7 routes — delete in STEP 4.
- store.presales.* (1 name, no hyphen) and store.pre-sales.* (7 names) both exist. Two spellings of the same thing is a bug waiting to happen — pick one and redirect the other.

### 16. Inventory (`inventory`)

See and manage stock levels, movements and value.

Registry status: **live**. Billing classification: `included`. Matching route entries: 12.

Entry routes: `store.inventory.dashboard`.
Permissions: `inventory.view`, `inventory.adjust`, `inventory.create`, `inventory.edit`.
Required modules: products. Alternative dependency sets: [].
Page declarations: `Inventory/StockLevels.jsx`, `Inventory/Dashboard.jsx`, `StockOperations.jsx`.

Recorded verification notes (some are historical or already resolved):
- RESOLVED: split from Products (#1) by explicit route name. store.inventory.index is the PRODUCT list and belongs to #1; the stock screens are here. Do not widen either side to a wildcard.
- store.inventory.stock and store.inventory.stock-levels both point at InventoryController@stockLevels (web.php lines 1274 and 1393). Two names, one method. Retire one.

### 17. Multi-Location / Warehouses (`multi_location`)

Run more than one shop, branch, godown or storage location.

Registry status: **live**. Billing classification: `included`. Matching route entries: 8.

Entry routes: `store.v3.warehouses.index`.
Permissions: `admin.warehouses`, `inventory.view`.
Required modules: inventory. Alternative dependency sets: [].
Page declarations: `V3/Warehouses/Index.jsx`, `V3/Warehouses/Create.jsx`, `V3/Warehouses/Edit.jsx`.

Recorded verification notes (some are historical or already resolved):
- RESOLVED: store.v3.warehouses.{index,create,store,edit,update,destroy} all exist via Route::resource at web.php:1936. An earlier pass reported this namespace as missing; that was a bug in the audit script, not in your code.
- Warehouse creation ALSO exists at store.stock-operations.warehouse.store / .update, inside StockOperations.jsx. Two ways to create a warehouse. Decide which is canonical before launch, or a customer will create one in a screen the other does not refresh.
- legacy_gate multi_branch gates 4 routes — delete in STEP 4. The plan LIMIT on locations stays: it is one of the four meters.

### 18. Stock Transfers (`stock_transfers`)

Move stock between locations with a paper trail on both sides.

Registry status: **live**. Billing classification: `included`. Matching route entries: 6.

Entry routes: `store.stock-transfers.index`.
Permissions: `inventory.transfer`.
Required modules: inventory, multi_location. Alternative dependency sets: [].
Page declarations: `StockTransfers/`.

Recorded verification notes (some are historical or already resolved):
- Depth check: transfers -> multi_location -> inventory -> products = depth 4. That is the plan maximum. Do not add a fifth level under this module.

### 19. Stock Takes & Audit (`stock_takes`)

Count what is physically there and reconcile it against the books.

Registry status: **live**. Billing classification: `included`. Matching route entries: 4.

Entry routes: `store.stock-takes.index`.
Permissions: `inventory.adjust`, `reports.audit`.
Required modules: inventory. Alternative dependency sets: [].
Page declarations: `StockTake/`.

Recorded verification notes (some are historical or already resolved):
- A stock take writes adjustments to the Qore stock ledger. Confirm the adjustment posts a costed movement, not just a quantity change — otherwise valuation drifts silently.

### 20. Batches & Expiry (`batches_expiry`)

Track batch numbers and expiry dates, and get warned before stock dies.

Registry status: **live**. Billing classification: `included`. Matching route entries: 2.

Entry routes: `store.batches.index`.
Permissions: `inventory.view`, `inventory.edit`.
Required modules: inventory. Alternative dependency sets: [].
Page declarations: `BatchTracking/`.

Recorded verification notes (some are historical or already resolved):
- Only 2 route names under store.batches.* on 15 Aug. Confirm that is a complete surface (list + detail) and not a stub.

### 21. Serials / IMEI (`serials`)

Track individual units by serial or IMEI, from intake to warranty.

Registry status: **live**. Billing classification: `included`. Matching route entries: 2.

Entry routes: `store.serials.index`.
Permissions: `inventory.view`, `inventory.edit`.
Required modules: inventory. Alternative dependency sets: [].
Page declarations: `SerialTracking/`.

Recorded verification notes (some are historical or already resolved):
- Only 2 route names under store.serials.* on 15 Aug, though SerialTrackingController and ProductSerial are substantial. Confirm the full surface.

### 22. Product Variants (`variants`)

Size, colour and other variations of the same product.

Registry status: **live**. Billing classification: `included`. Matching route entries: 8.

Entry routes: .
Permissions: `inventory.create`, `inventory.edit`.
Required modules: products. Alternative dependency sets: [].
Page declarations: `Inventory/Variants`, `Inventory/Attributes`.

Recorded verification notes (some are historical or already resolved):
- No nav item — surfaced inside Products. Correct, but confirm the Products page hides the variant UI when this module is off, or the click leads to a blocked route.

### 23. Barcodes & Labels (`barcodes_labels`)

Generate and print barcode labels, price tags and shelf edges.

Registry status: **live**. Billing classification: `included`. Matching route entries: 2.

Entry routes: `store.labels.index`.
Permissions: `inventory.barcodes`.
Required modules: products. Alternative dependency sets: [].
Page declarations: `Labels/`.

Recorded verification notes (some are historical or already resolved):
- legacy_gate barcode_label_print gates 2 routes — delete in STEP 4. Scanning at the counter (#18) is part of POS and must NOT be gated by this module; only label PRINTING lives here.

### 24. Units of Measure (`units_of_measure`)

Buy in cartons, sell in pieces — conversions handled for you.

Registry status: **live**. Billing classification: `included`. Matching route entries: 3.

Entry routes: .
Permissions: `inventory.edit`, `admin.settings_manage`.
Required modules: products. Alternative dependency sets: [].
Page declarations: `V3/`.

Recorded verification notes (some are historical or already resolved):
- CAREFUL — UomService is QORE (every line converts to a base quantity through it). Only the CONFIGURATION SCREEN is this module. Disabling this must never stop conversion; it only hides the screen where units are defined. If disabling it can change a stored quantity, it is not a module.
- RESOLVED: the real names are store.v3.products.uom.{index,store,destroy}, nested inside the same {productId} group. Units are configured per product, which is why there is no standalone page or nav item.

### 25. Purchases (`purchases`)

Record what you buy, what it cost, and what you still owe.

Registry status: **live**. Billing classification: `included`. Matching route entries: 24.

Entry routes: `store.purchases.index`.
Permissions: `purchases.view`, `purchases.create`, `purchases.edit`, `purchases.costs`.
Required modules: products. Alternative dependency sets: [].
Page declarations: `V3/Purchases`.

Recorded verification notes (some are historical or already resolved):
- store.purchases.* (10 names) includes purchases.receive.* (4) which arguably belongs to Purchase Orders (#26). Decide and split.
- store.purchases.return belongs to Purchase Returns (#27) — it is listed there. Make sure it is not double-owned in a way the gate resolves differently.

### 26. Purchase Orders (`purchase_orders`)

Raise an order to a supplier and receive against it, partially or in full.

Registry status: **live**. Billing classification: `included`. Matching route entries: 10.

Entry routes: `store.purchase-orders.index`.
Permissions: `purchases.create`, `purchases.view`.
Required modules: purchases, suppliers. Alternative dependency sets: [].
Page declarations: `PurchaseOrders/`.

Recorded verification notes (some are historical or already resolved):
- legacy_gate purchase_orders gates 9 routes — the second most-gated feature in the app. Deleting it in STEP 4 touches a lot of routes; do it in one commit and run the full suite.
- store.jit.* (just-in-time drafts) may belong to WooCommerce/Marketplace (#45) instead. Trace it.

### 27. Purchase Returns / Debit Notes (`purchase_returns`)

Send goods back to a supplier and adjust what you owe them.

Registry status: **live**. Billing classification: `included`. Matching route entries: 9.

Entry routes: `store.debit-notes.index`.
Permissions: `purchases.void`, `finance.transactions`.
Required modules: purchases. Alternative dependency sets: [].
Page declarations: `DebitNotes/`.

Recorded verification notes (some are historical or already resolved):
- KNOWN GAP (feature #84): print and update endpoints for debit notes are literal stubs — abort(501, "Implement debit-notes.print"). Create and view are solid. Either finish those two endpoints or hide the buttons before launch. A 501 in front of a paying customer is worse than a missing feature.
- legacy_gate purchase_returns (2 routes) and debit_credit_notes (5 routes) both apply here — delete both in STEP 4.

### 28. Landed Cost Allocation (`landed_cost`)

Spread freight, duty and clearing costs across the items you imported.

Registry status: **beta**. Billing classification: `included`. Matching route entries: 0.

Entry routes: .
Permissions: `purchases.costs`, `purchases.edit`.
Required modules: purchases. Alternative dependency sets: [].
Page declarations: .

Recorded verification notes (some are historical or already resolved):
- BETA BECAUSE: feature #88 is marked implemented inside PurchaseService.php (distributing freight/customs by quantity or value), but NO dedicated route and NO page were found on 15 Aug. A module with no surface is a red flag in CAPABILITIES_FILE_GUIDE PART 5.
- DECIDE ONE: (a) it has a real screen -> find it, list it, promote to live; or (b) it is a field inside the purchase form -> DELETE this entry and add "landed cost" to the Purchases (#25) aliases. Option (b) drops the count to 45 and that is fine.
- Do not leave it as a checkbox that changes nothing visible. That is the worst of both.

### 29. Cookbook / Recipes (BOM) (`cookbook`)

Define what your made items are composed of, and what they cost.

Registry status: **live**. Billing classification: `included`. Matching route entries: 10.

Entry routes: `store.cookbook.index`.
Permissions: `inventory.create`, `inventory.edit`.
Required modules: products, inventory. Alternative dependency sets: [].
Page declarations: `Cookbook/RecipesList.jsx`, `Cookbook/Create.jsx`.

Recorded verification notes (some are historical or already resolved):
- TERMS GAP: app/Support/Terms.php has 25 fallback keys and NONE of them is "composition". Add it (singular Recipe / plural Recipes) before this module ships, then add it to this terms[] array. Verified missing 15 Aug.
- legacy_gate compositions gates 7 routes — delete in STEP 4.

### 30. Production Runs (`production_runs`)

Run a batch: consume the ingredients, produce the finished goods.

Registry status: **live**. Billing classification: `included`. Matching route entries: 16.

Entry routes: `store.production.index`.
Permissions: `inventory.adjust`, `inventory.create`.
Required modules: cookbook. Alternative dependency sets: [].
Page declarations: `Manufacturing/`, `Inventory/Production`.

Recorded verification notes (some are historical or already resolved):
- legacy_gate production gates 5 routes — delete in STEP 4.
- store.v3.disassembly.* exists and is currently unclaimed (see qore.php frozen_surfaces). Decide whether it belongs here.

### 31. Composite / Auto-Deducting Items (`composite_items`)

Sell a made item and have its ingredients come out of stock automatically.

Registry status: **beta**. Billing classification: `included`. Matching route entries: 6.

Entry routes: .
Permissions: `inventory.adjust`, `inventory.edit`.
Required modules: cookbook. Alternative dependency sets: [].
Page declarations: `Manufacturing/Rules.jsx`.

Recorded verification notes (some are historical or already resolved):
- BETA BECAUSE: AutoManufacturingService.php and Manufacturing/Rules.jsx exist (feature #41 Built), but only ONE route name (store.manufacturing.*) was found and it may be shared with Production Runs (#30).
- DECIDE ONE: (a) real distinct surface -> name the routes, promote to live; or (b) it is a behaviour of Cookbook -> delete this entry, fold "auto deduct/combo/deal" into Cookbook aliases. Option (b) is likely correct and drops the count.
- THE TEST THAT MATTERS: sell a combo at POS, then assert every ingredient moved in the stock ledger and COGS is right. If that passes, the feature is real whatever we call it.

### 32. Customer Credit (Pay Later) (`khata_credit`)

Let customers buy now and pay later — running tabs, payment terms and balances, with reminders.

Registry status: **live**. Billing classification: `included`. Matching route entries: 8.

Entry routes: `store.parties.ledger`.
Permissions: `finance.balances`, `finance.receive_payment`.
Required modules: . Alternative dependency sets: [["customers", "suppliers"]].
Page declarations: `Parties/Ledger.jsx`.

Recorded verification notes (some are historical or already resolved):
- SHARED PREFIX: store.parties.* has 9 names split between the Customers directory (#3) and this ledger view. List explicit names in both. Getting this wrong hides a customer list when someone turns off credit.
- legacy_gates customer_khata (1), unified_party_ledger (3), report_party_statement (5), aged_receivables (2), aged_payables (1), customer_statements (1), supplier_statements (1) all touch this area — seven booleans, all deleted in STEP 4.
- requires_one [customers OR suppliers] is deliberate: a shop can run supplier khata with no customer directory at all.

### 33. Payments In & Out (`payments`)

Receive and send money, split across accounts, allocated to the right bills.

Registry status: **live**. Billing classification: `included`. Matching route entries: 12.

Entry routes: `store.payments.index`.
Permissions: `finance.receive_payment`, `finance.send_payment`, `finance.transactions`.
Required modules: . Alternative dependency sets: [["customers", "suppliers"]].
Page declarations: `Payments/`.

Recorded verification notes (some are historical or already resolved):
- PaymentService is QORE. This module is the SCREENS. Disabling it must not stop a POS sale from settling — the sale writes payment rows through the engine either way. Prove that with a test.
- store.finance.* (5 unclaimed names) probably belongs here. Trace and claim it, or the gate leaves it open.

### 34. Expenses (`expenses`)

Record what you spend, with receipts, by category.

Registry status: **live**. Billing classification: `included`. Matching route entries: 8.

Entry routes: `store.expenses.index`.
Permissions: `finance.expenses`.
Required modules: . Alternative dependency sets: [].
Page declarations: `Expenses/`.

Recorded verification notes (some are historical or already resolved):
- legacy_gate expense_manager gates 9 routes — the third most-gated feature. Delete in STEP 4.
- Expenses requires NOTHING. That is deliberate: it is in both named five-module customers (cafe and freelancer). Never add a dependency here.

### 35. Cash Register & Daily Audit (`cash_register`)

Open and close the drawer, count the cash, find the difference.

Registry status: **live**. Billing classification: `included`. Matching route entries: 9.

Entry routes: `store.funds.index`.
Permissions: `finance.balances`, `finance.transactions`, `pos.open_session`, `pos.close_session`.
Required modules: pos. Alternative dependency sets: [].
Page declarations: `Funds/`.

Recorded verification notes (some are historical or already resolved):
- SCOPE OVERLAP: store.funds.* (12 names) covers general cash and inter-register transfers, which is broader than "cash register". Either rename this module Funds & Cash, or split the transfer routes into Bank Accounts (#36). Do not leave the label lying about what the routes do.
- legacy_gate fund_management gates 5 routes — delete in STEP 4.
- requires POS is per the build plan. If a non-POS business needs a cash drawer, loosen this to requires_one [pos, invoicing].

### 36. Bank Accounts (`bank_accounts`)

Track bank balances and money moving between accounts.

Registry status: **live**. Billing classification: `included`. Matching route entries: 7.

Entry routes: `store.bank-accounts.index`.
Permissions: `finance.balances`.
Required modules: . Alternative dependency sets: [].
Page declarations: `BankAccounts/`.

Recorded verification notes (some are historical or already resolved):
- Confirm bank statement log (feature #171) is reachable — it appears under store.reports.bank-statement, which Reports (#42) owns. A report about a disabled module must not 500; see the Reports auto-derivation rule.

### 37. Bank Reconciliation (`bank_reconciliation`)

Match your bank statement against your books, line by line.

Registry status: **live**. Billing classification: `included`. Matching route entries: 2.

Entry routes: `store.bank-reconciliation.index`.
Permissions: `finance.balances`, `reports.financial`.
Required modules: bank_accounts. Alternative dependency sets: [].
Page declarations: `BankReconciliation/`.

Recorded verification notes (some are historical or already resolved):
- legacy_gate bank_reconciliation gates 2 routes — delete in STEP 4.

### 38. Accounting Workspace (`accounting_workspace`)

Chart of accounts, journals, trial balance — the accountant's room.

Registry status: **live**. Billing classification: `included`. Matching route entries: 16.

Entry routes: `store.accounting.index`.
Permissions: `finance.journal`, `reports.financial`.
Required modules: . Alternative dependency sets: [].
Page declarations: `Accounting/ChartOfAccounts.jsx`, `Accounting/Dashboard.jsx`, `Accounting/BalanceSheet.jsx`, `Accounting/ProfitLoss.jsx`.

Recorded verification notes (some are historical or already resolved):
- READ CAREFULLY: the ALIASES here include "accounting" and "ledger", which are also Qore concepts. That is allowed — an alias is a word a user types, not a switchable thing. But the integrity test checks aliases against the Qore denylist to stop the AI reasoning "the user said accounting, so accounting is optional". If the test fails on this module, DO NOT delete the module — narrow the alias (e.g. "accounting screens") and keep the denylist intact.
- legacy_gate double_entry_ledger gates 4 routes. Deleting that boolean must NOT be read as "the ledger became optional". The ledger is Qore. Only the workspace is the module. Say so in the commit message.
- OFF BY DEFAULT for service and simple-retail presets. That is the concession that makes the freelancer real.

### 39. Tax & Compliance / E-Invoicing (`tax_compliance`)

Tax summaries, rate configuration and government e-invoicing.

Registry status: **live**. Billing classification: `included`. Matching route entries: 5.

Entry routes: `store.e-invoicing.index`.
Permissions: `admin.taxes_methods`, `reports.financial`.
Required modules: . Alternative dependency sets: [].
Page declarations: `EInvoicing/`.

Recorded verification notes (some are historical or already resolved):
- TaxService is QORE — tax CALCULATION always runs. This module is the compliance REPORTS and the e-invoicing submission. Disabling it must never change a total on an invoice. Test that explicitly.
- legacy_gates e_invoicing (3) and auto_vat_gst (1) — delete in STEP 4.

### 40. Fixed Assets & Depreciation (`fixed_assets`)

Track what you own long-term and write it down over time.

Registry status: **live**. Billing classification: `included`. Matching route entries: 4.

Entry routes: .
Permissions: `finance.journal`, `reports.financial`.
Required modules: accounting_workspace. Alternative dependency sets: [].
Page declarations: `V3/`.

Recorded verification notes (some are historical or already resolved):
- Find the page paths — there is no V3/Assets or V3/Depreciation directory in resources/js/Pages. The controllers exist (feature #133 Built). Locate the pages or the nav item will 404.
- Disaster & Asset Claim Manager (#108) is grouped here; confirm that is the right home rather than Inventory.

### 41. Loans (`loans`)

Track money you borrowed and every repayment against it.

Registry status: **live**. Billing classification: `included`. Matching route entries: 3.

Entry routes: .
Permissions: `finance.journal`, `finance.balances`.
Required modules: accounting_workspace. Alternative dependency sets: [].
Page declarations: `V3/`.

Recorded verification notes (some are historical or already resolved):
- Find the page path (no V3/Loans directory). V3/LoanController exists (feature #134 Built).

### 42. Reports (`reports`)

Every report your system can produce, and none it cannot.

Registry status: **live**. Billing classification: `included`. Matching route entries: 81.

Entry routes: `store.reports.index`.
Permissions: `reports.summary`, `reports.stock`, `reports.financial`, `reports.performance`, `reports.audit`.
Required modules: . Alternative dependency sets: [].
Page declarations: `Reports/`.

Recorded verification notes (some are historical or already resolved):
- THIS MODULE IS ONE TOGGLE, NOT FORTY-TWO. Which reports appear is DERIVED from the other enabled modules. No Inventory -> no stock reports. No Customers -> no customer statements. This is the single biggest simplification in the plan; do not let anyone re-expose individual report toggles.
- IMPLEMENTATION RULE: report visibility is computed from a report -> module map, not stored. Build that map next to ReportController and unit-test it: for every report, assert it disappears when its owning module is off AND that its route returns a friendly 404, never a 500.
- BIGGEST GATE JOB IN THE FILE: store.reports.* has 59 names and store.v3.reports.* has 15. Every one must be attributed to an owning module in the report map, or it leaks.
- legacy_gates to delete in STEP 4: report_profit_loss (12 — the most-gated key in the app), report_trial_balance (2), stock_valuation (3), point_in_time_inventory (2), discount_report (2), cash_flow_report (2), customer_insights (2), supplier_insights (2), stock_aging (1), owners_daily_pulse (1).

### 43. AI Business Insights (`ai_insights`)

Plain-language insights about your own numbers, with the evidence attached.

Registry status: **live**. Billing classification: `metered`. Matching route entries: 18.

Entry routes: `store.growth-engine.index`.
Permissions: `reports.summary`, `reports.performance`.
Required modules: reports. Alternative dependency sets: [].
Page declarations: `GrowthEngine/`.

Recorded verification notes (some are historical or already resolved):
- FIX THIS BEFORE ANYTHING ELSE IN THIS ENTRY: growth_engine is ON BY DEFAULT on ltd_2, and PlanTruthFailClosedTest is failing because of it. That is a metered AI feature given free and forever to lifetime buyers. Fix the plan matrix, get the test green, THEN finalise this module. Writing the registry first encodes the bug where nobody can see it.
- billing is "metered", one of only four honest exceptions. Allowance per tier: 3/10/25/50 AI builds. Wire AiSpendGuard, AiRateLimiter and AiUsageRecorder from the FIRST call, not later.
- Most Growth Engine insights are deterministic statistics, not model calls (feature #230, "Runs Without an AI Key"). Meter the MODEL CALLS, not the insights. Charging for arithmetic you already computed is the kind of thing customers notice.
- The catalog lists 38 insight types as Partial — traced to InsightCatalog.php but not to named methods. Do not market a number. Market the behaviour.

### 44. Loyalty & Gift Cards (`loyalty_gift`)

Points, store credit and gift cards that bring people back.

Registry status: **live**. Billing classification: `included`. Matching route entries: 9.

Entry routes: .
Permissions: `sales.create`, `sales.view`.
Required modules: customers. Alternative dependency sets: [].
Page declarations: `Gift/`.

Recorded verification notes (some are historical or already resolved):
- Three route namespaces, one module. Confirm all three (loyalty 3 names, gift-cards 3, store-credit 2) really are one feature to a user. If gift cards are sold to a different buyer than loyalty points, split them — but only if that opens a business type.
- Store credit interacts with Returns (#9): a refund to store credit must post correctly whether or not this module is on.

### 45. WooCommerce / Marketplace Sync (`marketplace_sync`)

Keep products, stock and orders in step with your online channels.

Registry status: **live**. Billing classification: `addon`. Matching route entries: 38.

Entry routes: `store.vensynq.index`.
Permissions: `vensynq.manage`.
Required modules: products, inventory. Alternative dependency sets: [].
Page declarations: `WooCommerce/`, `OnlineStore/`, `VenSynQ/`.

Recorded verification notes (some are historical or already resolved):
- billing is "addon" ($10 per connected account per month) — one of the four honest exceptions, because each connection costs you infrastructure. This is the ONLY module in the file a customer pays extra for on top of their tier.
- store.connections.* alone has 28 route names. Confirm they all belong here and none belongs to platform settings.
- VenSynQ has 36 green tests and is explicitly frozen for expansion (build plan PART 7). Wire it, do not extend it.

### 46. Staff & Attendance (`staff_attendance`)

Who works here, who is on shift, and who did what.

Registry status: **live**. Billing classification: `included`. Matching route entries: 19.

Entry routes: .
Permissions: `admin.staff_view`, `admin.staff_manage`, `users.manage`.
Required modules: . Alternative dependency sets: [].
Page declarations: `Staff/`, `StaffAttendance/`, `Store/Staff`.

Recorded verification notes (some are historical or already resolved):
- CAREFUL: users, roles and permissions are QORE. This module is the staff DIRECTORY, shifts and attendance. Disabling it must never remove a user's ability to log in or change what they may do. If it can, it is not a module.
- store.v3.payroll.* and store.v3.employee-settlements.* exist and are frozen (qore.php frozen_surfaces). Do not quietly absorb them into this module before V1.
- The staff LIMIT stays a plan meter. The staff SCREEN is free. Two different things.

### 47. Online Store (`online_store`)

Public digital storefront, web catalogue, and customer online ordering.

Registry status: **live**. Billing classification: `included`. Matching route entries: 36.

Entry routes: `store.commerce.home`.
Permissions: `online.store_manage`, `online.products_manage`, `online.promotions_manage`, `online.orders_view`.
Required modules: products. Alternative dependency sets: [].
Page declarations: `Commerce/Directory.jsx`, `OnlineStore/Home.jsx`, `OnlineStore/Deliveries.jsx`, `Commerce/RiderDeliveries.jsx`.

### 48. QR Menu & Catalogue (`onsite_catalogue`)

A scannable menu or product catalogue for the counter and the tables, with optional ordering from the customer's own phone.

Registry status: **live**. Billing classification: `included`. Matching route entries: 24.

Entry routes: `store.commerce.catalogue`.
Permissions: `online.catalogue_manage`, `online.products_manage`.
Required modules: products. Alternative dependency sets: [].
Page declarations: `OnsiteCatalogue/Setup.jsx`, `OnlineStore/Products.jsx`.

## Reports and analysis destinations

Generated from resources/js/lib/reportCatalog.js. A hub destination can be a report, analytics view, loyalty screen or another business view. Availability varies by module, role and plan; do not advertise this as an unconditional number of reports.

| Title | Question answered | Route |
| --- | --- | --- |
| Owner's Daily Pulse | Seven vital numbers for today, protected by your passcode | store.reports.owner-daily-pulse |
| Sales Analytics | Revenue trends, peak hours and top performers in charts | store.reports.analytics |
| Day Book | Everything that happened, day by day | store.reports.day-book |
| Sales Report | Every sale with filters by date, customer and status | store.reports.sales |
| Sales Orders | Orders placed, confirmed and fulfilled | store.reports.sale-orders |
| Sale Order Items | Item-level detail of every order | store.reports.sale-order-items |
| Discount Report | Where price concessions are going | store.reports.discount |
| Profit & Loss | Income minus costs for any period | store.reports.profit-loss |
| Item-wise Profit | Profit and margin per product | store.reports.item-wise-profit |
| Category Profitability | Which categories earn and which cost you | store.reports.item-category-wise-profit-loss |
| Bill-wise Profit | Profit on each invoice | store.reports.bill-wise-profit |
| Customer Profitability | Profit earned from each customer | store.reports.party-wise-profit-loss |
| Customer Insights | Buying patterns, repeat customers and top spenders | store.reports.customer-insights |
| Loyalty Points | Who holds points, what was earned and redeemed, and the current rates | store.loyalty.index |
| Receivables Aging | Who owes you money and for how long | store.reports.sale-aging |
| Party Statement | Full ledger for one customer or supplier | store.reports.party-statement |
| What Each Customer Buys | Items bought by a chosen customer | store.reports.item-report-by-party |
| Who Buys Each Item | Customers behind a chosen product | store.reports.party-report-by-item |
| All Parties | Customers and suppliers with their balances | store.reports.all-parties |
| Loan Statement | Loans taken and given | store.reports.loan-statement |
| Purchase Report | Every purchase with filters | store.reports.purchases |
| Purchase Returns | Debit notes and goods sent back | store.reports.purchase-returns |
| Supplier Insights | Spend, reliability and top suppliers | store.reports.supplier-insights |
| Party Volume | Sales and purchases by party | store.reports.sale-purchase-by-party |
| Stock Valuation | Current value of your inventory | store.reports.stock-valuation |
| Stock Summary | Quantity and value by category | store.reports.stock-summary-by-category |
| Stock Movement | Audit trail of every stock change | store.reports.movement-history |
| Inventory on a Past Date | What you held on any day | store.reports.point-in-time-inventory |
| Item Details | Everything about one product | store.reports.item-detail |
| Low Stock | Items below their reorder level | store.reports.low-stock |
| Expiry Report | Batches expiring soon or already expired | store.reports.expiry |
| Stock Aging | How long stock has been sitting | store.reports.stock-aging |
| Expense Report | Every expense in the period | store.reports.expenses |
| Expense by Category | Spending split by cost centre | store.reports.expense-by-category |
| Tax Report | Input versus output tax | store.reports.tax |
| Tax by Rate | Taxable amounts grouped by rate | store.reports.tax-rate |
| Balance Sheet | Assets, liabilities and equity | store.reports.balance-sheet |
| Trial Balance | Debit and credit totals per account | store.reports.trial-balance |
| Cash Flow | Cash in, cash out, and what is left | store.reports.cash-flow |
| Bank Statement | Bank transactions for reconciliation | store.reports.bank-statement |
| Journal Entries | The general ledger, account by account | store.reports.account-ledger |
| All Transactions | Every transaction in one list | store.reports.transactions |
| Chart of Accounts | Your account structure | store.accounting.index |

## Further evidence

- [Every page and source scope](PAGE_AND_SOURCE_COVERAGE.md)
- [Customer problems, workflows and all business types](CUSTOMER_PROBLEMS_AND_WORKFLOWS.md)
- [Outcome-led marketing](MARKETING_BY_BUSINESS.md)
- [Complete router export](route-inventory.csv)
- [Metric definitions](metric-catalog.csv)
- [Canonical registry evidence](registry-evidence.json)
- [Remaining verification](VERIFICATION_AND_CLAIMS.md)

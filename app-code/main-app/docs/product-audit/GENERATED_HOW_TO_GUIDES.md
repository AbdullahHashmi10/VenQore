# Canonical customer how-to guide snapshot

Generated 16 October 2026. Source of truth: ../../config/vena_guides.php.

## How to perform the documented workflows

The procedures below are generated verbatim in substance from config/vena_guides.php. Terminology can differ by business. The source guides themselves can contain stale advice: the quotation guide uses Pre-Sales, while a dedicated Quotations module remains building. Bank reconciliation import and government e-invoice generation also have incomplete controller actions despite registry/guide references. This snapshot preserves the source instructions for review; it does not certify them. Check VERIFICATION_AND_CLAIMS.md and the actual screen when these disagree. Role, plan, module and device restrictions apply.

### Turn on your online store

Your online store is a public shop page with a cart and checkout. It needs a short setup, then one Publish click.

Entry route: `store.commerce.home`. Permission: `online.store_manage`. Module: `online_store`.

1. Make sure the Online Store module is on. Open the System Builder, find "Online Store" and switch it on (it needs the Products module). (`store.builder`)
2. Open Online Store from the sidebar. (`store.commerce.home`)
3. Open Settings and fill in: public business name, country and city, address, contact phone, pickup and/or delivery, a payment option that matches (pay at pickup, cash on delivery or bank transfer — bank transfer needs your bank details), and the warehouse that fulfils online orders. (`store.commerce.settings`)
4. Open Products and choose what customers can see: tick products and press Publish. At least one published product is required. (`store.commerce.products`)
5. Go back to Overview and press "Publish store". If something is missing, the page lists exactly what. (`store.commerce.home`)
6. Share your store link or QR code from Overview — your first orders land in Orders, where you accept, prepare and complete them.

Notes: You can pause new orders without hiding the store (the pause switch on Overview). Your VenQore subscription must be active to publish. Offers and coupon codes are under Offers in the same area.

### Handle online orders

Every online order lands in the Orders inbox with a countdown to accept it.

Entry route: `store.commerce.orders`. Permission: `online.orders_view`. Module: `online_store`.

1. Open Orders. (`store.commerce.orders`)
2. Open an order and press Accept (or Reject). While an order is still pending you can change a quantity or offer a substitute — the customer must agree before anything changes.
3. Move it forward as you prepare it, then mark it Ready and Complete. Completing posts the sale and takes the stock.
4. Cash on delivery: the order is posted as a credit sale; record the money in Payments when you receive it.

### Create an offer or coupon for the online store

Dated offers and coupon codes (percent or fixed amount, store-wide or one category).

Entry route: `store.commerce.promotions`. Permission: `online.promotions_manage`. Module: `online_store`.

1. Open Online Store → Offers. (`store.commerce.promotions`)
2. Press New offer, choose percent off or an amount off, the dates, and optionally a coupon code, a category and a minimum order.
3. Save. Customers see the offer on the shop; the posted sale equals the discounted order total.

### Set up a QR menu / catalogue

A scannable menu or product catalogue for the counter and tables, with optional ordering from the customer's phone.

Entry route: `store.commerce.catalogue`. Permission: `online.catalogue_manage`. Module: `onsite_catalogue`.

1. Switch on "QR Menu & Catalogue" in the System Builder if it is off. (`store.builder`)
2. Open QR Menu & Catalogue and choose how it should work (counter, tables, ordering on or off). (`store.commerce.catalogue`)
3. Choose which products appear under Online Store → Products. (`store.commerce.products`)
4. Print or download the QR code from the setup page. Each table can have its own code that you can switch off or regenerate.

### Let staff handle online orders without changing the store settings

The online store has its own permissions, separate from general settings, so an employee can take orders without being able to change prices, offers, publishing or QR codes.

Entry route: `store.staff`. Permission: `admin.staff_manage`. Module: `online_store`.

1. Open Staff and edit the person (or pick the "Online orders clerk" preset when adding them). (`store.staff`)
2. Under "Online Store & QR Menu" tick only what they need: See Online Orders, Work Online Orders. Leave Online Store Settings, Online Promotions, Choose Online Products and QR Menu & Table Codes unticked.
3. Collecting payment and cancelling an accepted order are separate ticks, so you can keep money actions to trusted people.
4. Vena and Smart Capture access is a separate tick under "Vena & AI"; changing the store's AI key needs "Manage AI Key & Settings".

Notes: Staff who could already edit general settings keep their online-store access until you untick it.

### Turn modules and features on or off

Everything in VenQore is a module you can switch on or off at any time. Switching off never deletes data.

Entry route: `store.builder`. Permission: `admin.settings_manage`. Module: `core / not specified`.

1. Open the System Builder. (`store.builder`)
2. Describe what you want in your own words (for example "I also want appointments") or switch modules on and off directly.
3. Review the preview. It tells you which other modules get switched on with it, and what data is affected before you confirm.
4. Apply. The sidebar updates straight away.

Notes: If a screen is missing from your sidebar, its module is probably off — or your role does not have permission for it.

### Use your own AI key (Bring Your Own Key)

Save your own Gemini, OpenAI, Claude or DeepSeek key for this store. Questions and scans on your own key are not counted against any monthly quota.

1. Open the AI island (the Vena bar at the top, or Ctrl+K) and go to the Capture tab, then choose "Configure API Key" / "AI Settings (Bring Your Own Key)".
2. Pick the provider, paste your API key, and press Test to check it works.
3. Save. The key is stored for this store only and never shared with other stores.

Notes: If your plan includes a monthly AI quota you do not need a key — Vena uses the quota automatically. When your monthly quota runs out and you have your own key saved, Vena switches to your key by itself.

### See your AI usage and what is left

Your plan includes a monthly AI allowance. The AI Usage page shows what you have used, when it resets, and lets you buy more.

Entry route: `store.ai-usage.index`. Permission: `as permitted`. Module: `core / not specified`.

1. Open AI Usage from the profile menu (bottom left). (`store.ai-usage.index`)
2. The bar shows used / allowed. It turns amber at 80% and red at 100%.
3. To keep going after the limit: buy more AI credits there, or save your own key (Bring Your Own Key) and use it without any limit.

### Scan a bill or invoice with Smart Capture

Take a photo (or dictate) and Smart Capture fills in the purchase, expense or sale for you to confirm.

1. Open the AI island (the Vena bar at the top, or Ctrl+K) and go to the Capture tab.
2. Add a photo or PDF of the bill (or record a voice note).
3. Check the fields it filled in, fix anything, and confirm. Nothing is saved until you confirm.

### Create a new store or branch

A new store is a separate workspace under your account; a branch (location) lives inside a store.

Entry route: `store.create`. Permission: `as permitted`. Module: `core / not specified`.

1. For a separate business, open New Store from your store hub and follow the short setup. (`store.create`)
2. For another location of the same business, add a warehouse/location instead (your plan limits how many). (`store.v3.warehouses.index`)

Notes: The number of locations depends on your plan. Billing shows your current limits.

### Change business name, address, tax, receipts and other settings

Business details, tax, printing and invoice numbering live in Settings.

Entry route: `store.settings`. Permission: `admin.settings_manage`. Module: `core / not specified`.

1. Open Settings. (`store.settings`)
2. Choose the section you need (business info, tax, printing, transactions) and save.
3. The till also has its own settings workspace (gear icon on the register) for screen layout, receipts, tax and rounding.

### Add staff and control what they can do

Invite people, give each a role, and limit what they can see and do.

Entry route: `store.staff`. Permission: `admin.staff_manage`. Module: `core / not specified`.

1. Open Staff. (`store.staff`)
2. Invite the person by email and choose their role (for example cashier, waiter or manager).
3. Roles decide which screens they see and what they can do (take payments, give discounts, view reports).
4. Your plan limits the number of staff seats; Billing shows the limit.

### Connect a new till or terminal

A terminal pairs with a one-time code that you create in Settings; there is no automatic pairing.

Entry route: `store.terminal-pairing.index`. Permission: `admin.settings_manage`. Module: `core / not specified`.

1. Open Terminal pairing and create a one-time code (it looks like ABCD-2345). (`store.terminal-pairing.index`)
2. Enter that code on the new terminal.
3. Manage or revoke paired terminals on the Terminals page. (`store.terminals.index`)

### Make a sale

Ring up items at the Point of Sale; use a detailed invoice for credit or business customers.

Entry route: `store.pos`. Permission: `sales.create`. Module: `pos`.

1. Open the Point of Sale. (`store.pos`)
2. Scan or tap items, adjust quantity or discount, then press Pay and choose the payment method.
3. For a detailed invoice to a customer on credit, create an invoice instead. (`store.sales.invoice.create`)
4. Restaurants and cafes sell from Front of House (tables, takeaway, delivery) instead of the plain till.

### Run tables, takeaway and delivery (Front of House)

Front of House is the restaurant screen: Overview, Tables, Takeaway and Delivery on one page.

Entry route: `store.foh`. Permission: `foh.access`. Module: `table_service`.

1. Switch on the Table & Floor module in the System Builder if it is off. (`store.builder`)
2. Draw your dining room: add zones and tables in the Floor Plan builder. (`store.tables.plan`)
3. Open Front of House and pick Tables, Takeaway or Delivery. (`store.foh`)
4. Choose which tabs your business uses, service charge/tip, kitchen tickets and delivery fee in Front of House settings. (`store.foh.settings`)
5. Taking payment needs the checkout permission; without it staff can print the bill.

### Kitchen display and kitchen tickets

Orders reach the kitchen as one ticket, or one per station (grill, bar…).

Entry route: `store.restaurant.kitchen`. Permission: `as permitted`. Module: `core / not specified`.

1. Open the Kitchen display to see and bump orders. (`store.restaurant.kitchen`)
2. To split tickets by station, open Kitchen routing, turn on "A ticket for each station" and add your stations. (`store.tables.kitchen.routing`)

### Return or refund a sale

Create a return against the original sale; stock and accounts are reversed for you.

Entry route: `store.returns.create`. Permission: `sales.edit`. Module: `core / not specified`.

1. Open New Return. (`store.returns.create`)
2. Find the original sale, choose the items and quantity, and confirm.
3. Past returns are in Returns history. (`store.returns-history.index`)

### Create a quotation or pre-sale

A quote you can send first and convert to a sale when the customer agrees.

Entry route: `store.pre-sales.create`. Permission: `as permitted`. Module: `core / not specified`.

1. Open New Pre-Sale. (`store.pre-sales.create`)
2. Add the customer and items, then save or print it.
3. When the customer accepts, convert it to a sale from the pre-sale list.

### Bill a customer automatically every month

A recurring invoice repeats on a schedule you choose.

Entry route: `store.recurring-invoices.create`. Permission: `as permitted`. Module: `core / not specified`.

1. Open New Recurring Invoice. (`store.recurring-invoices.create`)
2. Pick the customer, items and how often it repeats.
3. Payment reminders can be scheduled from Invoice Reminders. (`store.invoice-reminders.index`)

### Add products

Add a product one at a time, or load many at once from a spreadsheet.

Entry route: `store.inventory.index`. Permission: `inventory.create`. Module: `products`.

1. Open the Product List and press the add-product button. (`store.inventory.index`)
2. Enter the name, price and (optionally) cost, barcode, category and opening stock, then save.
3. Many products at once: use Import / Export, download the template, fill it in and upload. (`store.admin.data`)

### Import or export data from a spreadsheet

Bring products or contacts in from a spreadsheet, or download your data.

Entry route: `store.admin.data`. Permission: `admin.settings_manage`. Module: `core / not specified`.

1. Open Import / Export. (`store.admin.data`)
2. Download the template, fill it in, then upload it and match the columns. (`store.admin.data.template`)
3. Review the preview and confirm the import.

### Adjust, count or transfer stock

Stock Operations covers transfers between locations, adjustments and counts.

Entry route: `store.stock-operations`. Permission: `as permitted`. Module: `core / not specified`.

1. Open Stock Operations. (`store.stock-operations`)
2. To move stock between locations, create a stock transfer. (`store.stock-transfers.create`)
3. To count what is on the shelf and fix differences, start a stock audit. (`store.stock-takes.create`)

### Record a purchase from a supplier

A purchase brings stock in and records what you owe the supplier.

Entry route: `store.purchases.create`. Permission: `purchases.create`. Module: `core / not specified`.

1. Open New Purchase. (`store.purchases.create`)
2. Choose the supplier and add the items with quantity and cost, then save.
3. Pay the supplier later from Payment Out. (`store.payment-out.create`)
4. For a formal order before goods arrive, use Purchase Orders. (`store.purchase-orders.create`)

### Receive a payment or pay a supplier

Payment In records money from a customer; Payment Out records money you pay.

Entry route: `store.payments.index`. Permission: `finance.receive_payment`. Module: `core / not specified`.

1. To record money received from a customer, use Payment In. (`store.payment-in.create`)
2. To pay a supplier or bill, use Payment Out. (`store.payment-out.create`)
3. Choose the party, the account the money goes in or out of, the amount and which invoices it settles.
4. Who owes you and whom you owe: Receivables and Payables. (`store.finance.receivables`)

### Record an expense

Expenses reduce your profit and are posted to your accounts automatically.

Entry route: `store.expenses.create`. Permission: `as permitted`. Module: `expenses`.

1. Open New Expense. (`store.expenses.create`)
2. Choose the category, amount, date and which account paid it, then save.
3. Review all expenses and the expense reports from the Expenses list. (`store.expenses.index`)

### Add a customer or supplier

Customers and suppliers are "parties"; each has a ledger of what they owe or are owed.

Entry route: `store.customers.create`. Permission: `as permitted`. Module: `core / not specified`.

1. Add a customer. (`store.customers.create`)
2. Or open the suppliers list to add a supplier. (`store.suppliers.index`)
3. See any party's balance and history in Parties. (`store.parties.index`)

### Bank accounts, reconciliation and cheques

Add bank and cash accounts, match them to the bank statement, and track cheques.

Entry route: `store.bank-accounts.index`. Permission: `as permitted`. Module: `core / not specified`.

1. Add your bank and cash accounts. (`store.bank-accounts.index`)
2. Match your records against the bank statement. (`store.bank-reconciliation.index`)
3. Track issued and received cheques. (`store.banking.cheque-books.index`)

### Find a report

All reports are in the Reports hub, grouped by topic. Some advanced reports depend on your plan.

Entry route: `store.reports.dashboard`. Permission: `as permitted`. Module: `core / not specified`.

1. Open the Reports hub. (`store.reports.dashboard`)
2. Pick the topic (sales, purchases, stock, accounting, tax, customers…) and a date range.
3. Ask Vena a question like "sales this week" or "low stock items" for a quick answer without opening the report.

Notes: A report you cannot open usually needs a higher plan or a permission your role does not have.

### See or change your plan and billing

Billing shows your plan, limits, usage and payment history, and lets you upgrade.

Entry route: `store.billing`. Permission: `admin.settings_manage`. Module: `core / not specified`.

1. Open Billing. (`store.billing`)
2. Press upgrade to compare plans and check out. (`store.billing.upgrade`)
3. Payment history and the customer portal are linked from the same page. (`store.billing.payment-history`)

### Back up or export your data

Create and download a backup of your store from the admin area.

Entry route: `store.backups.index`. Permission: `admin.settings_manage`. Module: `core / not specified`.

1. Open Backups. (`store.backups.index`)
2. Start a backup and download it when it finishes.

### Restore something I deleted

Deleted items wait in the Recycle Bin where you can restore them.

Entry route: `store.admin.recycle-bin.index`. Permission: `as permitted`. Module: `core / not specified`.

1. Open the Recycle Bin. (`store.admin.recycle-bin.index`)
2. Find the item and press Restore.

### Change my password, profile or dark mode

Your own account settings.

Entry route: `store.profile.edit`. Permission: `as permitted`. Module: `core / not specified`.

1. Open Profile for name, password and two-factor sign-in. (`store.profile.edit`)
2. Open Appearance for light / dark mode and display options. (`store.appearance`)

### See who did what

The Activity Log records changes with the person and time.

Entry route: `store.activity-log.index`. Permission: `as permitted`. Module: `core / not specified`.

1. Open the Activity Log and filter by person, date or type. (`store.activity-log.index`)

### Connect WooCommerce or other marketplaces

Keep products, stock and orders in step with your online channels.

Entry route: `store.woocommerce.index`. Permission: `as permitted`. Module: `marketplace_sync`.

1. Switch on the channel-sync module in the System Builder if needed. (`store.builder`)
2. WooCommerce: add your store connection. (`store.woocommerce.index`)
3. Other marketplaces: open VenSynQ and connect the channel with its sign-in. (`store.vensynq.index`)

### Change what my dashboard shows

The dashboard is built from cards you can add, remove and rearrange.

Entry route: `store.dashboard`. Permission: `as permitted`. Module: `core / not specified`.

1. Open the Dashboard. (`store.dashboard`)
2. Use the dashboard's customise control to add, remove or move cards. Cards you cannot add need a permission or a module that is switched off.

### Run service jobs and appointments

Track jobs from request to completion and invoice them.

Entry route: `store.service-jobs.index`. Permission: `as permitted`. Module: `core / not specified`.

1. Open Service Jobs. (`store.service-jobs.index`)
2. Create a job with the customer and what is to be done. (`store.service-jobs.create`)
3. See the schedule in the calendar. (`store.service-jobs.calendar`)

### Approvals (discounts, below-cost sales, write-offs)

Some actions need a manager to approve them — by PIN at the till, or from the Approvals inbox.

Entry route: `store.approvals.inbox`. Permission: `as permitted`. Module: `core / not specified`.

1. Managers review pending requests in the Approvals inbox. (`store.approvals.inbox`)
2. Staff can follow their own requests under My submissions. (`store.approvals.my-submissions`)

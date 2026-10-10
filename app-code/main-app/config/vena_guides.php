<?php

/*
|==============================================================================
| VENA GUIDES  ·  config/vena_guides.php
|==============================================================================
|
| Step-by-step answers for the things people ask Vena "how do I…" about.
|
| WHAT THIS FILE IS — AND IS NOT
| ------------------------------
| It holds PROCEDURES only: the order of the steps and the words that find
| them. It never lists screens, modules, reports or plans — those are GENERATED
| from config/modules.php, the route table, ReckonerRegistry and
| DashboardRegistry by App\Services\Vena\ManifestBuilder. Point, never copy.
|
| Every `route` / `module` named here is verified by
| tests/tests/Feature/Ai/VenaKnowledgeTest.php. A guide that names a screen or
| module that no longer exists FAILS THE BUILD, and at runtime an unresolvable
| link is dropped rather than shown broken.
|
| FIELDS
| ------
| title      what the user sees as the heading
| aliases    the words people actually use — English, Roman Urdu, short and
|            long. This is what the matcher scores against. Add the phrasing
|            real users type, not the feature's internal name.
| module     config/modules.php key. When set, Vena tells the user if that
|            module is switched OFF for their store and how to switch it on.
| route      the main screen (store route name; {store_slug} is filled in)
| needs      permission key(s) the user needs — Vena says so when they lack it
| summary    one plain sentence
| steps      ordered; each is a string or ['text' => …, 'route' => …]
| tips       optional gotchas, in plain words
|
| STYLE: say what the screen says. No invented button names — if you have not
| seen the label in the UI, describe the action instead.
|==============================================================================
*/

return [

    // ── Online selling ────────────────────────────────────────────────────

    'online_store_on' => [
        'title'   => 'Turn on your online store',
        'aliases' => [
            'turn on online store', 'enable online store', 'start online store', 'set up online store',
            'create online store', 'online store', 'web shop', 'website for my shop', 'sell online',
            'online orders', 'take orders online', 'publish store', 'go live online', 'ecommerce',
            'online store kaise', 'online store on karna', 'online dukaan', 'apni shop online',
            'online order lena',
        ],
        'module'  => 'online_store',
        'route'   => 'store.commerce.home',
        'needs'   => 'online.store_manage',
        'summary' => 'Your online store is a public shop page with a cart and checkout. It needs a short setup, then one Publish click.',
        'steps'   => [
            ['text' => 'Make sure the Online Store module is on. Open the System Builder, find "Online Store" and switch it on (it needs the Products module).', 'route' => 'store.builder'],
            ['text' => 'Open Online Store from the sidebar.', 'route' => 'store.commerce.home'],
            ['text' => 'Open Settings and fill in: public business name, country and city, address, contact phone, pickup and/or delivery, a payment option that matches (pay at pickup, cash on delivery or bank transfer — bank transfer needs your bank details), and the warehouse that fulfils online orders.', 'route' => 'store.commerce.settings'],
            ['text' => 'Open Products and choose what customers can see: tick products and press Publish. At least one published product is required.', 'route' => 'store.commerce.products'],
            ['text' => 'Go back to Overview and press "Publish store". If something is missing, the page lists exactly what.', 'route' => 'store.commerce.home'],
            'Share your store link or QR code from Overview — your first orders land in Orders, where you accept, prepare and complete them.',
        ],
        'tips' => [
            'You can pause new orders without hiding the store (the pause switch on Overview).',
            'Your VenQore subscription must be active to publish.',
            'Offers and coupon codes are under Offers in the same area.',
        ],
    ],

    'online_orders_manage' => [
        'title'   => 'Handle online orders',
        'aliases' => [
            'online orders', 'accept order', 'new online order', 'order inbox', 'reject order', 'complete online order',
            'online order kaise accept', 'order accept karna', 'customer orders',
        ],
        'module'  => 'online_store',
        'route'   => 'store.commerce.orders',
        'needs'   => 'online.orders_view',
        'summary' => 'Every online order lands in the Orders inbox with a countdown to accept it.',
        'steps'   => [
            ['text' => 'Open Orders.', 'route' => 'store.commerce.orders'],
            'Open an order and press Accept (or Reject). While an order is still pending you can change a quantity or offer a substitute — the customer must agree before anything changes.',
            'Move it forward as you prepare it, then mark it Ready and Complete. Completing posts the sale and takes the stock.',
            'Cash on delivery: the order is posted as a credit sale; record the money in Payments when you receive it.',
        ],
    ],

    'online_offers' => [
        'title'   => 'Create an offer or coupon for the online store',
        'aliases' => ['online offer', 'coupon code', 'discount code', 'promotion online', 'online store discount', 'coupon kaise', 'offer banana'],
        'module'  => 'online_store',
        'route'   => 'store.commerce.promotions',
        'needs'   => 'online.promotions_manage',
        'summary' => 'Dated offers and coupon codes (percent or fixed amount, store-wide or one category).',
        'steps'   => [
            ['text' => 'Open Online Store → Offers.', 'route' => 'store.commerce.promotions'],
            'Press New offer, choose percent off or an amount off, the dates, and optionally a coupon code, a category and a minimum order.',
            'Save. Customers see the offer on the shop; the posted sale equals the discounted order total.',
        ],
    ],

    'qr_menu' => [
        'title'   => 'Set up a QR menu / catalogue',
        'aliases' => ['qr menu', 'qr code menu', 'digital menu', 'scan to order', 'table qr', 'menu qr', 'qr catalogue', 'qr ordering', 'menu card', 'qr menu kaise banaye'],
        'module'  => 'onsite_catalogue',
        'route'   => 'store.commerce.catalogue',
        'needs'   => 'online.catalogue_manage',
        'summary' => 'A scannable menu or product catalogue for the counter and tables, with optional ordering from the customer\'s phone.',
        'steps'   => [
            ['text' => 'Switch on "QR Menu & Catalogue" in the System Builder if it is off.', 'route' => 'store.builder'],
            ['text' => 'Open QR Menu & Catalogue and choose how it should work (counter, tables, ordering on or off).', 'route' => 'store.commerce.catalogue'],
            ['text' => 'Choose which products appear under Online Store → Products.', 'route' => 'store.commerce.products'],
            'Print or download the QR code from the setup page. Each table can have its own code that you can switch off or regenerate.',
        ],
    ],

    // ── Customising the system ────────────────────────────────────────────

    'online_staff_access' => [
        'title'   => 'Let staff handle online orders without changing the store settings',
        'aliases' => [
            'online store permissions', 'online order staff', 'who can change online store', 'stop employee changing online store',
            'give access to online orders', 'staff online orders', 'qr menu permission', 'restrict online store settings',
            'online store access', 'employee online store', 'online store ka access', 'staff ko online orders dena',
        ],
        'module'  => 'online_store',
        'route'   => 'store.staff',
        'needs'   => 'admin.staff_manage',
        'summary' => 'The online store has its own permissions, separate from general settings, so an employee can take orders without being able to change prices, offers, publishing or QR codes.',
        'steps'   => [
            ['text' => 'Open Staff and edit the person (or pick the "Online orders clerk" preset when adding them).', 'route' => 'store.staff'],
            'Under "Online Store & QR Menu" tick only what they need: See Online Orders, Work Online Orders. Leave Online Store Settings, Online Promotions, Choose Online Products and QR Menu & Table Codes unticked.',
            'Collecting payment and cancelling an accepted order are separate ticks, so you can keep money actions to trusted people.',
            'Vena and Smart Capture access is a separate tick under "Vena & AI"; changing the store\'s AI key needs "Manage AI Key & Settings".',
        ],
        'tips'    => ['Staff who could already edit general settings keep their online-store access until you untick it.'],
    ],

    'system_builder' => [
        'title'   => 'Turn modules and features on or off',
        'aliases' => [
            'enable module', 'turn on module', 'turn off module', 'add feature', 'add a feature', 'remove feature',
            'customize system', 'customise', 'system builder', 'builder', 'change my setup', 'switch on', 'switch off',
            'feature not showing', 'menu item missing', 'i cant see', 'module kaise on kare', 'feature on karna',
            'sidebar mein nahi', 'apps',
        ],
        'route'   => 'store.builder',
        'needs'   => 'admin.settings_manage',
        'summary' => 'Everything in VenQore is a module you can switch on or off at any time. Switching off never deletes data.',
        'steps'   => [
            ['text' => 'Open the System Builder.', 'route' => 'store.builder'],
            'Describe what you want in your own words (for example "I also want appointments") or switch modules on and off directly.',
            'Review the preview. It tells you which other modules get switched on with it, and what data is affected before you confirm.',
            'Apply. The sidebar updates straight away.',
        ],
        'tips' => [
            'If a screen is missing from your sidebar, its module is probably off — or your role does not have permission for it.',
        ],
    ],

    // ── AI ────────────────────────────────────────────────────────────────

    'ai_own_key' => [
        'title'   => 'Use your own AI key (Bring Your Own Key)',
        'aliases' => [
            'own api key', 'my own key', 'bring your own key', 'byok', 'add api key', 'add ai key', 'gemini key',
            'openai key', 'claude key', 'deepseek key', 'ai key not added', 'api key missing', 'ai not working',
            'ai settings', 'apni key', 'ai key kaise lagaye',
        ],
        'needs'   => 'ai.manage',
        'summary' => 'Save your own Gemini, OpenAI, Claude or DeepSeek key for this store. Questions and scans on your own key are not counted against any monthly quota.',
        'steps'   => [
            'Open the AI island (the Vena bar at the top, or Ctrl+K) and go to the Capture tab, then choose "Configure API Key" / "AI Settings (Bring Your Own Key)".',
            'Pick the provider, paste your API key, and press Test to check it works.',
            'Save. The key is stored for this store only and never shared with other stores.',
        ],
        'tips' => [
            'If your plan includes a monthly AI quota you do not need a key — Vena uses the quota automatically.',
            'When your monthly quota runs out and you have your own key saved, Vena switches to your key by itself.',
        ],
    ],

    'ai_quota' => [
        'title'   => 'See your AI usage and what is left',
        'aliases' => [
            'ai usage', 'ai quota', 'ai credits', 'monthly ai', 'how many ai questions', 'ai limit', 'ai reset',
            'buy more ai credits', 'top up ai', 'ai credits khatam', 'ai limit reached', 'ai kitna bacha',
        ],
        'route'   => 'store.ai-usage.index',
        'summary' => 'Your plan includes a monthly AI allowance. The AI Usage page shows what you have used, when it resets, and lets you buy more.',
        'steps'   => [
            ['text' => 'Open AI Usage from the profile menu (bottom left).', 'route' => 'store.ai-usage.index'],
            'The bar shows used / allowed. It turns amber at 80% and red at 100%.',
            'To keep going after the limit: buy more AI credits there, or save your own key (Bring Your Own Key) and use it without any limit.',
        ],
    ],

    'smart_capture' => [
        'title'   => 'Scan a bill or invoice with Smart Capture',
        'aliases' => ['smart capture', 'scan bill', 'scan invoice', 'scan receipt', 'photo to invoice', 'ocr', 'capture bill', 'voice entry', 'bill scan karna'],
        'summary' => 'Take a photo (or dictate) and Smart Capture fills in the purchase, expense or sale for you to confirm.',
        'steps'   => [
            'Open the AI island (the Vena bar at the top, or Ctrl+K) and go to the Capture tab.',
            'Add a photo or PDF of the bill (or record a voice note).',
            'Check the fields it filled in, fix anything, and confirm. Nothing is saved until you confirm.',
        ],
    ],

    // ── Setting up the business ───────────────────────────────────────────

    'new_store' => [
        'title'   => 'Create a new store or branch',
        'aliases' => ['create store', 'new store', 'add store', 'another store', 'second store', 'new business', 'add branch', 'new branch', 'naya store', 'store banana'],
        'route'   => 'store.create',
        'summary' => 'A new store is a separate workspace under your account; a branch (location) lives inside a store.',
        'steps'   => [
            ['text' => 'For a separate business, open New Store from your store hub and follow the short setup.', 'route' => 'store.create'],
            ['text' => 'For another location of the same business, add a warehouse/location instead (your plan limits how many).', 'route' => 'store.v3.warehouses.index'],
        ],
        'tips' => ['The number of locations depends on your plan. Billing shows your current limits.'],
    ],

    'business_settings' => [
        'title'   => 'Change business name, address, tax, receipts and other settings',
        'aliases' => [
            'settings', 'business info', 'store name', 'change address', 'logo', 'tax settings', 'tax rate', 'gst', 'receipt settings',
            'print settings', 'invoice prefix', 'invoice number', 'currency', 'timezone', 'settings kahan', 'tax kaise lagaye',
        ],
        'route'   => 'store.settings',
        'needs'   => 'admin.settings_manage',
        'summary' => 'Business details, tax, printing and invoice numbering live in Settings.',
        'steps'   => [
            ['text' => 'Open Settings.', 'route' => 'store.settings'],
            'Choose the section you need (business info, tax, printing, transactions) and save.',
            'The till also has its own settings workspace (gear icon on the register) for screen layout, receipts, tax and rounding.',
        ],
    ],

    'staff_users' => [
        'title'   => 'Add staff and control what they can do',
        'aliases' => [
            'add staff', 'add user', 'add cashier', 'add employee', 'invite staff', 'staff permissions', 'roles', 'give access',
            'remove staff', 'waiter login', 'staff kaise add', 'cashier banana', 'user permission',
        ],
        'route'   => 'store.staff',
        'needs'   => 'admin.staff_manage',
        'summary' => 'Invite people, give each a role, and limit what they can see and do.',
        'steps'   => [
            ['text' => 'Open Staff.', 'route' => 'store.staff'],
            'Invite the person by email and choose their role (for example cashier, waiter or manager).',
            'Roles decide which screens they see and what they can do (take payments, give discounts, view reports).',
            'Your plan limits the number of staff seats; Billing shows the limit.',
        ],
    ],

    'terminals' => [
        'title'   => 'Connect a new till or terminal',
        'aliases' => ['pair terminal', 'new terminal', 'connect pos', 'add register', 'pairing code', 'device pairing', 'terminal kaise jode', 'new till'],
        'route'   => 'store.terminal-pairing.index',
        'needs'   => 'admin.settings_manage',
        'summary' => 'A terminal pairs with a one-time code that you create in Settings; there is no automatic pairing.',
        'steps'   => [
            ['text' => 'Open Terminal pairing and create a one-time code (it looks like ABCD-2345).', 'route' => 'store.terminal-pairing.index'],
            'Enter that code on the new terminal.',
            ['text' => 'Manage or revoke paired terminals on the Terminals page.', 'route' => 'store.terminals.index'],
        ],
    ],

    // ── Selling ───────────────────────────────────────────────────────────

    'make_sale' => [
        'title'   => 'Make a sale',
        'aliases' => ['make sale', 'new sale', 'sell', 'checkout', 'billing', 'bill banana', 'sale kaise kare', 'pos', 'register', 'till', 'create invoice'],
        'module'  => 'pos',
        'route'   => 'store.pos',
        'needs'   => 'sales.create',
        'summary' => 'Ring up items at the Point of Sale; use a detailed invoice for credit or business customers.',
        'steps'   => [
            ['text' => 'Open the Point of Sale.', 'route' => 'store.pos'],
            'Scan or tap items, adjust quantity or discount, then press Pay and choose the payment method.',
            ['text' => 'For a detailed invoice to a customer on credit, create an invoice instead.', 'route' => 'store.sales.invoice.create'],
            'Restaurants and cafes sell from Front of House (tables, takeaway, delivery) instead of the plain till.',
        ],
    ],

    'foh_restaurant' => [
        'title'   => 'Run tables, takeaway and delivery (Front of House)',
        'aliases' => [
            'front of house', 'foh', 'restaurant', 'tables', 'dine in', 'table service', 'takeaway', 'delivery orders',
            'waiter', 'floor plan', 'riders', 'table kaise', 'restaurant setup', 'cafe',
        ],
        'module'  => 'table_service',
        'route'   => 'store.foh',
        'needs'   => 'foh.access',
        'summary' => 'Front of House is the restaurant screen: Overview, Tables, Takeaway and Delivery on one page.',
        'steps'   => [
            ['text' => 'Switch on the Table & Floor module in the System Builder if it is off.', 'route' => 'store.builder'],
            ['text' => 'Draw your dining room: add zones and tables in the Floor Plan builder.', 'route' => 'store.tables.plan'],
            ['text' => 'Open Front of House and pick Tables, Takeaway or Delivery.', 'route' => 'store.foh'],
            ['text' => 'Choose which tabs your business uses, service charge/tip, kitchen tickets and delivery fee in Front of House settings.', 'route' => 'store.foh.settings'],
            'Taking payment needs the checkout permission; without it staff can print the bill.',
        ],
    ],

    'kitchen' => [
        'title'   => 'Kitchen display and kitchen tickets',
        'aliases' => ['kitchen', 'kds', 'kitchen display', 'kot', 'kitchen ticket', 'kitchen printer', 'station', 'bar and kitchen', 'kitchen screen'],
        'route'   => 'store.restaurant.kitchen',
        'summary' => 'Orders reach the kitchen as one ticket, or one per station (grill, bar…).',
        'steps'   => [
            ['text' => 'Open the Kitchen display to see and bump orders.', 'route' => 'store.restaurant.kitchen'],
            ['text' => 'To split tickets by station, open Kitchen routing, turn on "A ticket for each station" and add your stations.', 'route' => 'store.tables.kitchen.routing'],
        ],
    ],

    'returns_refunds' => [
        'title'   => 'Return or refund a sale',
        'aliases' => ['return', 'refund', 'sales return', 'return item', 'customer returned', 'wapis', 'return kaise', 'refund kaise'],
        'route'   => 'store.returns.create',
        'needs'   => 'sales.edit',
        'summary' => 'Create a return against the original sale; stock and accounts are reversed for you.',
        'steps'   => [
            ['text' => 'Open New Return.', 'route' => 'store.returns.create'],
            'Find the original sale, choose the items and quantity, and confirm.',
            ['text' => 'Past returns are in Returns history.', 'route' => 'store.returns-history.index'],
        ],
    ],

    'quotation' => [
        'title'   => 'Create a quotation or pre-sale',
        'aliases' => ['quotation', 'quote', 'estimate', 'pre sale', 'presale', 'proposal', 'quotation kaise banaye'],
        'route'   => 'store.pre-sales.create',
        'summary' => 'A quote you can send first and convert to a sale when the customer agrees.',
        'steps'   => [
            ['text' => 'Open New Pre-Sale.', 'route' => 'store.pre-sales.create'],
            'Add the customer and items, then save or print it.',
            'When the customer accepts, convert it to a sale from the pre-sale list.',
        ],
    ],

    'recurring_invoices' => [
        'title'   => 'Bill a customer automatically every month',
        'aliases' => ['recurring invoice', 'monthly invoice', 'subscription billing', 'repeat invoice', 'auto invoice', 'invoice reminder'],
        'route'   => 'store.recurring-invoices.create',
        'summary' => 'A recurring invoice repeats on a schedule you choose.',
        'steps'   => [
            ['text' => 'Open New Recurring Invoice.', 'route' => 'store.recurring-invoices.create'],
            'Pick the customer, items and how often it repeats.',
            ['text' => 'Payment reminders can be scheduled from Invoice Reminders.', 'route' => 'store.invoice-reminders.index'],
        ],
    ],

    // ── Products & stock ──────────────────────────────────────────────────

    'add_product' => [
        'title'   => 'Add products',
        'aliases' => ['add product', 'new product', 'create product', 'add item', 'new item', 'product banana', 'item add karna', 'product kaise add'],
        'module'  => 'products',
        'route'   => 'store.inventory.index',
        'needs'   => 'inventory.create',
        'summary' => 'Add a product one at a time, or load many at once from a spreadsheet.',
        'steps'   => [
            ['text' => 'Open the Product List and press the add-product button.', 'route' => 'store.inventory.index'],
            'Enter the name, price and (optionally) cost, barcode, category and opening stock, then save.',
            ['text' => 'Many products at once: use Import / Export, download the template, fill it in and upload.', 'route' => 'store.admin.data'],
        ],
    ],

    'import_export' => [
        'title'   => 'Import or export data from a spreadsheet',
        'aliases' => ['import', 'export', 'bulk upload', 'upload excel', 'csv', 'import products', 'export products', 'excel import', 'data import', 'bulk add', 'excel se import'],
        'route'   => 'store.admin.data',
        'needs'   => 'admin.settings_manage',
        'summary' => 'Bring products or contacts in from a spreadsheet, or download your data.',
        'steps'   => [
            ['text' => 'Open Import / Export.', 'route' => 'store.admin.data'],
            ['text' => 'Download the template, fill it in, then upload it and match the columns.', 'route' => 'store.admin.data.template'],
            'Review the preview and confirm the import.',
        ],
    ],

    'stock_adjust_transfer' => [
        'title'   => 'Adjust, count or transfer stock',
        'aliases' => ['stock adjustment', 'stock take', 'stock count', 'transfer stock', 'move stock', 'stock transfer', 'stock audit', 'physical count', 'stock theek karna', 'stock transfer kaise'],
        'route'   => 'store.stock-operations',
        'summary' => 'Stock Operations covers transfers between locations, adjustments and counts.',
        'steps'   => [
            ['text' => 'Open Stock Operations.', 'route' => 'store.stock-operations'],
            ['text' => 'To move stock between locations, create a stock transfer.', 'route' => 'store.stock-transfers.create'],
            ['text' => 'To count what is on the shelf and fix differences, start a stock audit.', 'route' => 'store.stock-takes.create'],
        ],
    ],

    'purchase_supplier' => [
        'title'   => 'Record a purchase from a supplier',
        'aliases' => ['purchase', 'buy stock', 'supplier bill', 'purchase bill', 'receive stock', 'purchase order', 'add purchase', 'purchase kaise', 'maal kharidna', 'supplier invoice'],
        'route'   => 'store.purchases.create',
        'needs'   => 'purchases.create',
        'summary' => 'A purchase brings stock in and records what you owe the supplier.',
        'steps'   => [
            ['text' => 'Open New Purchase.', 'route' => 'store.purchases.create'],
            'Choose the supplier and add the items with quantity and cost, then save.',
            ['text' => 'Pay the supplier later from Payment Out.', 'route' => 'store.payment-out.create'],
            ['text' => 'For a formal order before goods arrive, use Purchase Orders.', 'route' => 'store.purchase-orders.create'],
        ],
    ],

    // ── Money ─────────────────────────────────────────────────────────────

    'receive_pay_money' => [
        'title'   => 'Receive a payment or pay a supplier',
        'aliases' => ['receive payment', 'payment in', 'payment out', 'pay supplier', 'collect payment', 'customer paid', 'udhaar', 'khata', 'udhar wapis', 'payment kaise', 'record payment'],
        'route'   => 'store.payments.index',
        'needs'   => 'finance.receive_payment',
        'summary' => 'Payment In records money from a customer; Payment Out records money you pay.',
        'steps'   => [
            ['text' => 'To record money received from a customer, use Payment In.', 'route' => 'store.payment-in.create'],
            ['text' => 'To pay a supplier or bill, use Payment Out.', 'route' => 'store.payment-out.create'],
            'Choose the party, the account the money goes in or out of, the amount and which invoices it settles.',
            ['text' => 'Who owes you and whom you owe: Receivables and Payables.', 'route' => 'store.finance.receivables'],
        ],
    ],

    'expenses' => [
        'title'   => 'Record an expense',
        'aliases' => ['expense', 'add expense', 'record expense', 'kharcha', 'rent', 'salary expense', 'expense kaise', 'bill pay'],
        'module'  => 'expenses',
        'route'   => 'store.expenses.create',
        'summary' => 'Expenses reduce your profit and are posted to your accounts automatically.',
        'steps'   => [
            ['text' => 'Open New Expense.', 'route' => 'store.expenses.create'],
            'Choose the category, amount, date and which account paid it, then save.',
            ['text' => 'Review all expenses and the expense reports from the Expenses list.', 'route' => 'store.expenses.index'],
        ],
    ],

    'customers_suppliers' => [
        'title'   => 'Add a customer or supplier',
        'aliases' => ['add customer', 'new customer', 'add supplier', 'new supplier', 'party', 'customer list', 'customer kaise add', 'supplier add karna'],
        'route'   => 'store.customers.create',
        'summary' => 'Customers and suppliers are "parties"; each has a ledger of what they owe or are owed.',
        'steps'   => [
            ['text' => 'Add a customer.', 'route' => 'store.customers.create'],
            ['text' => 'Or open the suppliers list to add a supplier.', 'route' => 'store.suppliers.index'],
            ['text' => 'See any party\'s balance and history in Parties.', 'route' => 'store.parties.index'],
        ],
    ],

    'bank_cheques' => [
        'title'   => 'Bank accounts, reconciliation and cheques',
        'aliases' => ['bank account', 'bank reconciliation', 'reconcile bank', 'cheque', 'check book', 'post dated cheque', 'bank statement', 'cheque book'],
        'route'   => 'store.bank-accounts.index',
        'summary' => 'Add bank and cash accounts, match them to the bank statement, and track cheques.',
        'steps'   => [
            ['text' => 'Add your bank and cash accounts.', 'route' => 'store.bank-accounts.index'],
            ['text' => 'Match your records against the bank statement.', 'route' => 'store.bank-reconciliation.index'],
            ['text' => 'Track issued and received cheques.', 'route' => 'store.banking.cheque-books.index'],
        ],
    ],

    // ── Reports & insight ────────────────────────────────────────────────

    'reports' => [
        'title'   => 'Find a report',
        'aliases' => [
            'report', 'reports', 'sales report', 'profit report', 'profit and loss', 'p&l', 'day book', 'daybook', 'stock report',
            'low stock', 'balance sheet', 'trial balance', 'cash flow', 'tax report', 'report kahan', 'profit kitna',
        ],
        'route'   => 'store.reports.dashboard',
        'summary' => 'All reports are in the Reports hub, grouped by topic. Some advanced reports depend on your plan.',
        'steps'   => [
            ['text' => 'Open the Reports hub.', 'route' => 'store.reports.dashboard'],
            'Pick the topic (sales, purchases, stock, accounting, tax, customers…) and a date range.',
            'Ask Vena a question like "sales this week" or "low stock items" for a quick answer without opening the report.',
        ],
        'tips' => ['A report you cannot open usually needs a higher plan or a permission your role does not have.'],
    ],

    // ── Account ───────────────────────────────────────────────────────────

    'billing_plan' => [
        'title'   => 'See or change your plan and billing',
        'aliases' => ['upgrade', 'plan', 'billing', 'subscription', 'change plan', 'cancel subscription', 'invoice from venqore', 'payment history', 'pricing', 'plan kaise badle', 'upgrade kaise'],
        'route'   => 'store.billing',
        'needs'   => 'admin.settings_manage',
        'summary' => 'Billing shows your plan, limits, usage and payment history, and lets you upgrade.',
        'steps'   => [
            ['text' => 'Open Billing.', 'route' => 'store.billing'],
            ['text' => 'Press upgrade to compare plans and check out.', 'route' => 'store.billing.upgrade'],
            ['text' => 'Payment history and the customer portal are linked from the same page.', 'route' => 'store.billing.payment-history'],
        ],
    ],

    'backup_data' => [
        'title'   => 'Back up or export your data',
        'aliases' => ['backup', 'download my data', 'export everything', 'data backup', 'backup kaise', 'data export'],
        'route'   => 'store.backups.index',
        'needs'   => 'admin.settings_manage',
        'summary' => 'Create and download a backup of your store from the admin area.',
        'steps'   => [
            ['text' => 'Open Backups.', 'route' => 'store.backups.index'],
            'Start a backup and download it when it finishes.',
        ],
    ],

    'recycle_bin' => [
        'title'   => 'Restore something I deleted',
        'aliases' => ['restore', 'deleted by mistake', 'undelete', 'recycle bin', 'trash', 'recover deleted', 'delete ho gaya'],
        'route'   => 'store.admin.recycle-bin.index',
        'summary' => 'Deleted items wait in the Recycle Bin where you can restore them.',
        'steps'   => [
            ['text' => 'Open the Recycle Bin.', 'route' => 'store.admin.recycle-bin.index'],
            'Find the item and press Restore.',
        ],
    ],

    'profile_appearance' => [
        'title'   => 'Change my password, profile or dark mode',
        'aliases' => ['change password', 'profile', 'dark mode', 'light mode', 'theme', 'appearance', 'two factor', '2fa', 'password change karna'],
        'route'   => 'store.profile.edit',
        'summary' => 'Your own account settings.',
        'steps'   => [
            ['text' => 'Open Profile for name, password and two-factor sign-in.', 'route' => 'store.profile.edit'],
            ['text' => 'Open Appearance for light / dark mode and display options.', 'route' => 'store.appearance'],
        ],
    ],

    'activity_log' => [
        'title'   => 'See who did what',
        'aliases' => ['activity log', 'audit log', 'who changed', 'who deleted', 'history of changes', 'kisne kiya'],
        'route'   => 'store.activity-log.index',
        'summary' => 'The Activity Log records changes with the person and time.',
        'steps'   => [['text' => 'Open the Activity Log and filter by person, date or type.', 'route' => 'store.activity-log.index']],
    ],

    'sell_on_marketplaces' => [
        'title'   => 'Connect WooCommerce or other marketplaces',
        'aliases' => ['woocommerce', 'woo', 'amazon', 'ebay', 'tiktok shop', 'daraz', 'shopify', 'marketplace', 'channel sync', 'vensynq', 'sync stock online'],
        'module'  => 'marketplace_sync',
        'route'   => 'store.woocommerce.index',
        'summary' => 'Keep products, stock and orders in step with your online channels.',
        'steps'   => [
            ['text' => 'Switch on the channel-sync module in the System Builder if needed.', 'route' => 'store.builder'],
            ['text' => 'WooCommerce: add your store connection.', 'route' => 'store.woocommerce.index'],
            ['text' => 'Other marketplaces: open VenSynQ and connect the channel with its sign-in.', 'route' => 'store.vensynq.index'],
        ],
    ],

    'dashboard_cards' => [
        'title'   => 'Change what my dashboard shows',
        'aliases' => ['dashboard', 'add card', 'dashboard card', 'customize dashboard', 'dashboard layout', 'home screen', 'chart on dashboard', 'dashboard kaise badle'],
        'route'   => 'store.dashboard',
        'summary' => 'The dashboard is built from cards you can add, remove and rearrange.',
        'steps'   => [
            ['text' => 'Open the Dashboard.', 'route' => 'store.dashboard'],
            'Use the dashboard\'s customise control to add, remove or move cards. Cards you cannot add need a permission or a module that is switched off.',
        ],
    ],

    'services_jobs' => [
        'title'   => 'Run service jobs and appointments',
        'aliases' => ['service job', 'job card', 'appointment', 'booking', 'repair', 'work order', 'service calendar', 'jobs'],
        'route'   => 'store.service-jobs.index',
        'summary' => 'Track jobs from request to completion and invoice them.',
        'steps'   => [
            ['text' => 'Open Service Jobs.', 'route' => 'store.service-jobs.index'],
            ['text' => 'Create a job with the customer and what is to be done.', 'route' => 'store.service-jobs.create'],
            ['text' => 'See the schedule in the calendar.', 'route' => 'store.service-jobs.calendar'],
        ],
    ],

    'approvals' => [
        'title'   => 'Approvals (discounts, below-cost sales, write-offs)',
        'aliases' => ['approval', 'manager approval', 'approve discount', 'needs approval', 'pin approval', 'approval inbox'],
        'route'   => 'store.approvals.inbox',
        'summary' => 'Some actions need a manager to approve them — by PIN at the till, or from the Approvals inbox.',
        'steps'   => [
            ['text' => 'Managers review pending requests in the Approvals inbox.', 'route' => 'store.approvals.inbox'],
            ['text' => 'Staff can follow their own requests under My submissions.', 'route' => 'store.approvals.my-submissions'],
        ],
    ],
];

/**
 * Feature Pages Data — T6 Feature Pages Factory
 *
 * Powers /features/{slug} deep-dive pages.
 * Each entry = one feature pillar with full copy for the Show.jsx template.
 *
 * Slugs live at:
 *   /features/accounting
 *   /features/inventory-management
 *   /features/offline-pos
 *   /features/point-of-sale
 */

export const featurePagesData = {

    /* ─────────────────────────────────────────────────────────────
     * ACCOUNTING
     * ───────────────────────────────────────────────────────────── */
    'accounting': {
        slug: 'accounting',
        metaTitle: 'Double-Entry Accounting Software — VenQore',
        metaDescription: 'VenQore\'s built-in double-entry accounting engine posts every sale, purchase and expense automatically. P&L, Balance Sheet and 40 reports — always reconciled.',
        heroBadge: 'Built-in Accounting — No Accountant Plugin Required',
        headline: 'Books That Close Themselves.',
        subhead: 'Every sale, purchase, refund and expense writes a balanced journal entry automatically. VenQore\'s double-entry engine means your Profit & Loss is always right — guarded by eight correctness laws that run on every release.',
        status: 'shipped',
        category: 'Finance & Accounting',
        stats: [
            { value: '40+', label: 'Financial Reports' },
            { value: '100%', label: 'Trial Balance Always Zero' },
            { value: 'Eight', label: 'Correctness Laws' },
            { value: '$0', label: 'Extra Accounting Plugin Cost' },
        ],
        answerBlock: {
            question: 'Does VenQore have real double-entry accounting?',
            answer: 'Yes. Every transaction in VenQore — sale, purchase, payment, refund, expense, transfer — posts a balanced journal entry automatically. The trial balance is always zero. Profit & Loss, Balance Sheet and Cash Flow are derived from one verified ledger, so they always agree with each other and with your bank statement.',
        },
        painPoints: [
            {
                pain: 'Sales recorded in POS, accounting updated manually in a separate app',
                fix: 'VenQore posts the journal entry the moment the sale is rung. There is no second step.',
                icon: 'RefreshCw',
            },
            {
                pain: 'Month-end reconciliation takes 3 days of corrections',
                fix: 'Because every entry is double-entry from day one, the trial balance is always zero. There are no corrections.',
                icon: 'Scale',
            },
            {
                pain: 'P&L disagrees with your bank balance — impossible to find the difference',
                fix: 'VenQore derives P&L, Balance Sheet and Cash Flow from the same ledger. They always match.',
                icon: 'FileText',
            },
            {
                pain: 'Your accountant charges extra to fix your books at year-end',
                fix: 'Hand your accountant a trial balance export. It is auditor-grade from day one.',
                icon: 'ShieldCheck',
            },
        ],
        features: [
            {
                title: 'Automatic Double-Entry Journals',
                description: 'Every sale debits Accounts Receivable (or Cash) and credits Revenue + Sales Tax Payable. Every purchase credits Accounts Payable and debits Inventory. Every payment settles both sides. No manual entries required.',
                icon: 'BookOpen',
                tag: 'Core Engine',
            },
            {
                title: 'Immutable Posted Ledger',
                description: 'Once a transaction is posted, it cannot be silently edited. Corrections flow through reversal entries — the same way auditors require. Your history is permanent.',
                icon: 'Lock',
                tag: 'Audit-Grade',
            },
            {
                title: 'FIFO Cost of Goods Sold',
                description: 'Cost of Goods Sold is calculated using actual FIFO batch costs, not average or guessed values. Gross profit in your P&L matches what you actually paid for the inventory you actually sold.',
                icon: 'Layers',
                tag: 'Real Costing',
            },
            {
                title: 'All 40 Reports',
                description: 'Profit & Loss, Balance Sheet, Cash Flow Statement, Trial Balance, Accounts Receivable Aging, Payables Aging, Stock Valuation, Item-wise Profit, Party-wise Profit, Daily Sales Summary — all from one verified ledger.',
                icon: 'BarChart3',
                tag: 'Full Reporting',
            },
            {
                title: 'Bank Reconciliation',
                description: 'Match your bank statement line by line against VenQore ledger entries. Unmatched items surface immediately. Reconciliation that used to take a day now takes minutes.',
                icon: 'Landmark',
                tag: 'Growth & Enterprise',
            },
            {
                title: 'Chart of Accounts',
                description: 'Standard chart of accounts pre-configured and ready to use. Add custom accounts, sub-accounts and cost centres as your business grows. Export to your external accountant in any format.',
                icon: 'List',
                tag: 'Configurable',
            },
        ],
        comparisonTable: {
            title: 'VenQore Accounting vs Bolt-On Plugins',
            rows: [
                { feature: 'Accounting engine', venqore: 'Built-in, always on', competitor: 'Requires QuickBooks / Xero integration' },
                { feature: 'Journal entry posting', venqore: 'Automatic on every transaction', competitor: 'Manual sync, often delayed' },
                { feature: 'Trial balance', venqore: 'Always zero — enforced by engine', competitor: 'Drifts if sync fails' },
                { feature: 'FIFO cost of goods sold', venqore: 'Exact FIFO from real batches', competitor: 'Average cost or manual entry' },
                { feature: 'P&L and Balance Sheet', venqore: 'From one verified ledger', competitor: 'Derived from synced data — can disagree' },
                { feature: 'Audit trail', venqore: 'Immutable posted ledger', competitor: 'Edits possible, no reversal requirement' },
                { feature: 'Cost per month', venqore: 'Included in VenQore plan', competitor: '+$30–$80/month for accounting app' },
                { feature: 'Data silos', venqore: 'Zero — one database', competitor: 'Two systems, two sources of truth' },
            ],
        },
        faqs: [
            {
                q: 'Is VenQore a proper double-entry accounting system?',
                a: 'Yes. Every transaction posts a balanced debit-credit journal entry. The trial balance is always zero. VenQore is not a single-entry or cash-book style system.',
            },
            {
                q: 'Do I need to buy QuickBooks or Xero separately?',
                a: 'No. VenQore\'s accounting engine is fully built-in. You get P&L, Balance Sheet, Cash Flow, Trial Balance, Aging reports and Bank Reconciliation without any third-party plugin.',
            },
            {
                q: 'How does VenQore calculate Cost of Goods Sold?',
                a: 'Using FIFO (first-in first-out) from real batch purchase costs. When you sell a product, VenQore automatically consumes the oldest batch first, at the price you actually paid, and posts that exact cost to the COGS account.',
            },
            {
                q: 'Can my accountant verify the books?',
                a: 'Yes. Export the trial balance, general ledger, or any financial report as PDF or Excel. The ledger is immutable — every entry has a timestamp and operator, and corrections flow through reversal entries as auditors require.',
            },
            {
                q: 'What plans include the accounting features?',
                a: 'The core double-entry engine and all 43 financial reports are included on every VenQore plan, including Solo (Free) and Starter ($49/month). Multi-branch transfers, API access, and advanced capabilities unlock on Core ($99/month) and Scale ($299/month).',
            },
        ],
        crossLinks: [
            { href: '/features/inventory-management', label: 'FIFO Inventory Management' },
            { href: '/features/point-of-sale', label: 'Point of Sale System' },
            { href: '/compare/venqore-vs-vyapar', label: 'VenQore vs Vyapar' },
            { href: '/solutions/pharmacy', label: 'Pharmacy POS Solution' },
        ],
    },

    /* ─────────────────────────────────────────────────────────────
     * INVENTORY MANAGEMENT
     * ───────────────────────────────────────────────────────────── */
    'inventory-management': {
        slug: 'inventory-management',
        metaTitle: 'Inventory Management Software — VenQore',
        metaDescription: 'FIFO batch tracking, expiry dates, serial/IMEI numbers, variants, purchase orders and stock transfers — all in one verified inventory system.',
        heroBadge: 'Inventory Management — Every Unit Accounted For',
        headline: 'Every Unit. Every Batch. Every Location.',
        subhead: 'VenQore tracks inventory through FIFO batches with expiry dates, serial and IMEI numbers, product variants, multiple warehouses and composite recipes — and posts the exact cost to your accounting engine automatically.',
        status: 'shipped',
        category: 'Inventory & Stock',
        stats: [
            { value: 'FIFO', label: 'Cost Method' },
            { value: '100%', label: 'Stock Accuracy' },
            { value: '∞', label: 'Batches Per Product' },
            { value: 'Real-time', label: 'Stock Updates' },
        ],
        answerBlock: {
            question: 'What inventory tracking methods does VenQore use?',
            answer: 'VenQore uses FIFO (first-in, first-out) batch tracking. Every purchase creates a batch with its own cost and, optionally, an expiry date. When a product is sold, VenQore automatically draws from the oldest batch first, records the exact FIFO cost, and posts it to the accounting ledger. Products can also carry serial numbers, IMEI numbers and variant attributes (size, colour, flavour), all tracked individually.',
        },
        painPoints: [
            {
                pain: 'Pharmacy stock expires and nobody notices until a patient is dispensed a short-dated product',
                fix: 'FEFO (first-expiry, first-out) dispatch mode surfaces the shortest-dated batch at the POS automatically.',
                icon: 'Calendar',
            },
            {
                pain: 'Electronics store cannot trace which IMEI was sold to which customer',
                fix: 'Serial and IMEI tracking is built into the POS. Each unit has a unique record, and the sale attaches the unit to the customer permanently.',
                icon: 'Smartphone',
            },
            {
                pain: 'Stock counts never match the system — items are lost between branches',
                fix: 'Stock transfers between locations are double-entry: they leave one warehouse and arrive in another, recorded in one transaction with full audit trail.',
                icon: 'ArrowLeftRight',
            },
            {
                pain: 'Cost of Goods Sold in the P&L is wrong because the POS uses average cost',
                fix: 'VenQore uses real FIFO batch costs. The P&L COGS figure is exact, not estimated.',
                icon: 'TrendingDown',
            },
        ],
        features: [
            {
                title: 'FIFO & FEFO Batch Tracking',
                description: 'Every purchase creates a batch with quantity, purchase cost and optional expiry date. Sales draw from batches in FIFO (oldest first) or FEFO (shortest expiry first) order automatically. Batch history is permanent.',
                icon: 'Layers',
                tag: 'Core Engine',
            },
            {
                title: 'Serial & IMEI Number Tracking',
                description: 'Scan or type a serial or IMEI number at the point of receipt. The unit is tracked through every movement — purchase, sale, return — with a full chain of custody attached to the customer record.',
                icon: 'ScanBarcode',
            },
            {
                title: 'Product Variants',
                description: 'One product, multiple SKUs: size, colour, flavour, material — any combination. Stock levels, costs and prices are tracked independently per variant. A single item view shows all variants together.',
                icon: 'Palette',
            },
            {
                title: 'Multi-Warehouse & Branch Transfers',
                description: 'Set up unlimited locations and warehouses. Transfer stock between them with a single transfer document that deducts from the source and adds to the destination in one atomic transaction.',
                icon: 'Warehouse',
            },
            {
                title: 'Composite Products & Manufacturing Recipes',
                description: 'Define assembled products (gift baskets, bundles, manufactured items) with a bill of materials. When a composite product is sold or assembled, VenQore auto-deducts the raw material components from stock.',
                icon: 'GitMerge',
            },
            {
                title: 'Purchase Orders & Partial Receiving',
                description: 'Raise purchase orders, send them to suppliers, and receive stock against them — fully or partially. Each received quantity creates a FIFO batch at the PO unit cost, and accounts payable is updated automatically.',
                icon: 'ShoppingCart',
            },
        ],
        comparisonTable: {
            title: 'VenQore Inventory vs Generic POS Inventory',
            rows: [
                { feature: 'Cost tracking method', venqore: 'Exact FIFO from real batches', competitor: 'Average cost (inaccurate)' },
                { feature: 'Expiry date tracking', venqore: 'Per-batch, FEFO dispatch', competitor: 'Not available' },
                { feature: 'Serial / IMEI tracking', venqore: 'Built-in, per-unit chain of custody', competitor: 'Not available or add-on' },
                { feature: 'Product variants', venqore: 'Unlimited attributes, per-SKU stock', competitor: 'Limited or flat SKUs' },
                { feature: 'Multi-warehouse', venqore: 'Unlimited locations, atomic transfers', competitor: 'Single location or manual' },
                { feature: 'Composite / assembled products', venqore: 'Bill of materials, auto-deduction', competitor: 'Not available' },
                { feature: 'Purchase orders', venqore: 'Full PO workflow, partial receiving', competitor: 'Manual entry only' },
                { feature: 'Accounting integration', venqore: 'Automatic COGS posting on every sale', competitor: 'Manual or no integration' },
            ],
        },
        faqs: [
            {
                q: 'Does VenQore track expiry dates on pharmacy products?',
                a: 'Yes. Every purchase batch can have an expiry date. VenQore can dispatch in FEFO order (first-expiry, first-out) so the shortest-dated stock always leaves first. Expiry alerts surface before a product becomes unsellable.',
            },
            {
                q: 'Can I track serial numbers and IMEI numbers for electronics?',
                a: 'Yes. Serial and IMEI numbers are captured at point of receipt and permanently linked to the batch. At the point of sale, the unit is linked to the customer. Warranty queries are answered in seconds.',
            },
            {
                q: 'How does VenQore handle products with multiple variants (sizes, colours)?',
                a: 'Create one parent product and add as many variant attributes as you need. Each combination (e.g. T-Shirt / Red / Large) gets its own SKU, its own stock level, its own price and its own barcode.',
            },
            {
                q: 'Can I transfer stock between my branches?',
                a: 'Yes. Raise a stock transfer from the source location. The system deducts from the source and, once received, adds to the destination — in a single double-entry transaction with a full audit trail.',
            },
            {
                q: 'Does inventory connect to the accounting engine?',
                a: 'Automatically. Every purchase creates a debit to Inventory and credit to Accounts Payable. Every sale consumes a FIFO batch at the exact purchase cost and posts that as COGS. There is no manual step.',
            },
        ],
        crossLinks: [
            { href: '/features/accounting', label: 'Built-in Accounting Engine' },
            { href: '/features/point-of-sale', label: 'Point of Sale System' },
            { href: '/solutions/pharmacy', label: 'Pharmacy Stock Management' },
            { href: '/solutions/electronics-store', label: 'Electronics Inventory' },
        ],
    },

    /* ─────────────────────────────────────────────────────────────
     * OFFLINE POS
     * ───────────────────────────────────────────────────────────── */
    'offline-pos': {
        slug: 'offline-pos',
        metaTitle: 'Offline POS: Keep Selling When the Internet Drops | VenQore',
        metaDescription: 'The VenQore till keeps selling when the internet drops. Sales are saved on the device and sent automatically when you reconnect. A device can stay offline for up to 7 days.',
        heroBadge: 'Offline sales: keep selling when the internet drops',
        headline: 'Internet Down. The Till Keeps Selling.',
        subhead: 'Every sale is saved on the device first. When the connection drops the till keeps selling, and when it returns the sales are sent automatically, each with its own receipt key so none posts twice. Other pages open as saved copies marked as not live.',
        status: 'shipped',
        category: 'Reliability & Infrastructure',
        stats: [
            { value: '7 days', label: 'Longest a device can stay offline' },
            { value: 'Local', label: 'Sales saved on the device first' },
            { value: 'Auto', label: 'Sync on Reconnect' },
            { value: 'PWA', label: 'Installable App — No App Store' },
        ],
        answerBlock: {
            question: 'Does VenQore work without internet?',
            answer: 'Yes, for the till. The POS keeps a product list on the device, so you can keep scanning barcodes and taking cash and manual-entry payments when the internet drops. Every sale is saved on the device and sent automatically when the connection returns. Other pages open as saved copies marked not live, and saving changes there needs internet. Card and online payments need a connection. A device that stays offline for more than 7 days locks until it connects once.',
        },
        painPoints: [
            {
                pain: 'A router outage during a Saturday rush brings the till to a complete stop',
                fix: 'The till searches a product list saved on the device, so checkout speed does not depend on the internet.',
                icon: 'Wifi',
            },
            {
                pain: 'Cloud POS syncs fail silently — stock counts are wrong after a connectivity event',
                fix: 'VenQore queues every transaction locally and replays it in exact order on reconnect. Nothing is lost or duplicated.',
                icon: 'RefreshCw',
            },
            {
                pain: 'Power cuts the connection mid-sale — the cart is lost',
                fix: 'Carts are saved to the device before the server acknowledges them. A mid-sale power event leaves the cart intact for recovery.',
                icon: 'Zap',
            },
            {
                pain: 'Your payment processor is online-only — offline means no card payments',
                fix: 'Cash and manual-entry payments are recorded offline. Card and online payment methods need a connection.',
                icon: 'CreditCard',
            },
        ],
        features: [
            {
                title: 'Local-First Cart Engine',
                description: 'Every cart is written to local IndexedDB before being sent to the server. A network event at any point in a transaction cannot corrupt or lose the cart. Holds and parked sales persist across browser refreshes.',
                icon: 'Database',
                tag: 'Core Architecture',
            },
            {
                title: 'Offline Product Catalogue Cache',
                description: 'Product names, barcodes and prices are saved on the device and refreshed about every 30 minutes while online. Barcode scanning needs no network round-trip. What you see offline is as of the last refresh.',
                icon: 'Package',
            },
            {
                title: 'Automatic Conflict-Free Sync',
                description: 'Offline sales queue in the order they were rung and are sent when the connection returns. Each carries its own receipt key, so a retry can never post twice. A sale that needs a manager approval, or that the server rejects, waits for a person in the Sync Hub instead of posting wrongly.',
                icon: 'Repeat',
            },
            {
                title: 'Saved Pages, Clearly Marked',
                description: 'The app keeps the till, Front of House and every page you have opened on the device. Other pages open as saved copies marked as not live, and saving on them waits for the internet. The Windows app and the browser behave the same way.',
                icon: 'Smartphone',
            },
            {
                title: 'Restaurant Floor Without Internet',
                description: 'Tables, takeaway and delivery keep working when the internet is down: seat a table, take the order, send it to the kitchen printer, take payment. It is all kept on that device and sent when the connection returns. Run each table from one device, because two devices that cannot reach the server cannot see each other. Splitting a bill and online orders need internet.',
                icon: 'Utensils',
            },
            {
                title: 'Offline Thermal Receipt Printing',
                description: 'In the VenQore Station Windows app, receipts print straight to your thermal printer with or without internet. In a browser, printing uses the normal print dialog.',
                icon: 'Printer',
            },
            {
                title: 'Offline Safety Lock',
                description: 'A device that has been offline for more than 7 days locks until it connects once, so a lost or unpaid device cannot keep selling forever. Sales saved on it are kept and sent when it reconnects.',
                icon: 'Lock',
            },
        ],
        comparisonTable: {
            title: 'VenQore Offline vs Cloud-Only POS',
            rows: [
                { feature: 'Continues selling without internet', venqore: 'Yes, the till (up to 7 days)', competitor: 'No: completely down' },
                { feature: 'Cart saved on device', venqore: 'Yes — before server confirmation', competitor: 'Server-dependent only' },
                { feature: 'Barcode scanning offline', venqore: 'Full speed — local catalogue', competitor: 'Requires internet lookup' },
                { feature: 'Receipt printing offline', venqore: 'Yes, from the Windows app', competitor: 'Cloud relay required' },
                { feature: 'Sync on reconnect', venqore: 'Automatic, conflict-free, ordered', competitor: 'Manual or unreliable' },
                { feature: 'Installs as native app', venqore: 'PWA — any device, no app store', competitor: 'Dedicated iOS/Android app' },
                { feature: 'Other pages offline', venqore: 'Saved copies, marked not live', competitor: 'Not available' },
                { feature: 'Sales during an outage', venqore: 'Kept on the device until sent', competitor: 'In-flight transactions can be lost' },
            ],
        },
        faqs: [
            {
                q: 'How long can VenQore operate without internet?',
                a: 'Up to 7 days. The till keeps running on the product list saved on the device and stores every sale locally. After 7 days without a connection the device locks until it connects once, to confirm the subscription and send the saved sales.',
            },
            {
                q: 'What happens when the internet comes back after an offline period?',
                a: 'VenQore detects the reconnection and sends the saved sales in the order they were rung. Inventory, FIFO batches and accounts update when each sale is accepted. A sale that needs a manager approval or is rejected waits for a person in the Sync Hub.',
            },
            {
                q: 'Can I install VenQore on a tablet or phone without an app store?',
                a: 'Yes. VenQore is a Progressive Web App (PWA). Open the URL in any modern browser, tap "Add to Home Screen", and it installs like a native app. Works on iOS, Android, Windows and macOS.',
            },
            {
                q: 'Does offline mode work with barcode scanners?',
                a: 'Yes. The product list is saved on the device, so barcode lookups need no network. USB and Bluetooth barcode scanners work exactly as they do online. Changes made in the last 30 minutes appear after the next refresh.',
            },
            {
                q: 'Is the offline POS secure?',
                a: 'The offline till runs on a device that was already signed in. Signing in and manager approvals need a connection. After 7 days offline the device locks until it connects once.',
            },
        ],
        crossLinks: [
            { href: '/features/point-of-sale', label: 'Full POS Feature Set' },
            { href: '/features/accounting', label: 'Built-in Accounting' },
            { href: '/compare/venqore-vs-square', label: 'VenQore vs Square POS' },
            { href: '/solutions/pharmacy', label: 'Pharmacy POS' },
        ],
    },

    /* ─────────────────────────────────────────────────────────────
     * POINT OF SALE
     * ───────────────────────────────────────────────────────────── */
    'point-of-sale': {
        slug: 'point-of-sale',
        metaTitle: 'Point of Sale (POS) System — VenQore',
        metaDescription: 'VenQore\'s offline-first POS: barcode scanning, split payments, hold & recall carts, thermal printing, staff roles, customer khata and loyalty — all in one checkout.',
        heroBadge: 'Point of Sale — Built for Real Retail, Not Demo Videos',
        headline: 'The Checkout Your Business Actually Needs.',
        subhead: 'Barcode scanning at any speed. Split payments across cash and card. Hold a cart and start another. Print to thermal in one click. Keep selling when the internet drops. VenQore POS is built for the reality of busy retail, not the ideal of a slow-day demo.',
        status: 'shipped',
        category: 'Point of Sale',
        stats: [
            { value: '<1s', label: 'Checkout Time Per Item' },
            { value: '7 days', label: 'Longest a device can stay offline' },
            { value: '40+', label: 'Linked Financial Reports' },
            { value: '7', label: 'Staff Role Levels' },
        ],
        answerBlock: {
            question: 'What does VenQore\'s POS include?',
            answer: 'VenQore POS includes offline checkout (sales are saved on the device and sent later) with barcode scanning, multi-tab cart management (hold and recall), split payments (cash, card, bank transfer, credit, mixed), customer search and credit (khata) management, loyalty points, thermal receipt printing, tax-inclusive and tax-exclusive pricing, FIFO inventory deduction on every sale, automatic double-entry journal posting, and 7-level staff role permissions, all in one system with no plugins.',
        },
        painPoints: [
            {
                pain: 'Checkout slows to a crawl whenever the internet is patchy',
                fix: 'The till looks products up in a list saved on the device, so there is no network wait.',
                icon: 'Zap',
            },
            {
                pain: 'A customer wants to pay part cash, part card — the till cannot handle it',
                fix: 'Split payments across any combination of cash, card, bank transfer, customer credit and loyalty points in one transaction.',
                icon: 'CreditCard',
            },
            {
                pain: 'A customer wants to hold their cart while they run to the ATM',
                fix: 'Park the cart with one tap. Start a new one. Recall any parked cart and resume instantly — per-cashier or system-wide.',
                icon: 'Pause',
            },
            {
                pain: 'The daily Z report never matches the accounting system',
                fix: 'VenQore posts every sale as a balanced journal entry. The daily sales summary and P&L always reconcile automatically.',
                icon: 'BarChart3',
            },
        ],
        features: [
            {
                title: 'Barcode Scanning & Quick Search',
                description: 'Scan USB or Bluetooth barcodes at full hardware speed — no lag, even offline. Search by name, SKU, barcode or category. Add custom barcodes to any product or variant. Bulk-print labels from any report.',
                icon: 'ScanBarcode',
                tag: 'Core Checkout',
            },
            {
                title: 'Multi-Tab Cart & Hold/Recall',
                description: 'Open multiple carts simultaneously across cashier tabs. Park any cart mid-transaction and recall it any time — even after a browser refresh. Parked carts are saved to the device before they reach the server.',
                icon: 'Layers',
            },
            {
                title: 'Split Payments',
                description: 'Accept any combination: cash + card, cash + customer credit (khata), loyalty points + bank transfer. The payment modal handles the maths and posts every method to the correct account automatically.',
                icon: 'CreditCard',
            },
            {
                title: 'Customer Khata (Credit Account)',
                description: 'Sell on credit to registered customers. The sale posts to Accounts Receivable. Send WhatsApp payment reminders with the balance. Accept partial payments and track the ageing balance from the party ledger.',
                icon: 'BookOpen',
            },
            {
                title: 'Loyalty Points & Gift Cards',
                description: 'Earn points on every purchase at a configurable rate. Redeem points at checkout. Issue digital gift cards and accept them as payment. Full loyalty history on every customer profile.',
                icon: 'Gift',
            },
            {
                title: 'Direct Thermal Printing',
                description: 'From the VenQore Station Windows app, print receipts straight to your thermal printer with no print dialog, driver software or cloud relay. It works offline. Customise header, footer, logo, line spacing and font size per store.',
                icon: 'Printer',
                tag: 'Hardware',
            },
        ],
        comparisonTable: {
            title: 'VenQore POS vs Square POS',
            rows: [
                { feature: 'Offline operation', venqore: 'The till works offline (up to 7 days); other pages are saved copies', competitor: 'Limited: card payments require internet' },
                { feature: 'Transaction fee', venqore: '$0 per transaction', competitor: '2.6% + 10¢ per swipe' },
                { feature: 'Built-in accounting', venqore: 'Double-entry, always reconciled', competitor: 'Requires QuickBooks integration (+$30/mo)' },
                { feature: 'Customer credit / khata', venqore: 'Built-in with AR aging', competitor: 'Not available' },
                { feature: 'Split payments', venqore: 'Any combination of methods', competitor: 'Card only or cash + card' },
                { feature: 'Hold & recall carts', venqore: 'Multi-tab, device-local persist', competitor: 'Single cart only' },
                { feature: 'FIFO inventory costing', venqore: 'Exact batch FIFO', competitor: 'Average cost only' },
                { feature: 'Thermal printing', venqore: 'Direct from the Windows app', competitor: 'App-dependent, cloud relay' },
            ],
        },
        faqs: [
            {
                q: 'Does VenQore POS work on any device?',
                a: 'Yes. VenQore runs in any modern browser on any device — iPad, Android tablet, Windows laptop, Mac, or desktop PC. It installs as a PWA (Progressive Web App) from the browser with no App Store required.',
            },
            {
                q: 'How does VenQore handle split payments?',
                a: 'The payment modal lets you enter any combination of amounts across cash, card, bank transfer, customer credit (khata) and loyalty points. VenQore calculates change, records each method separately to its account, and prints a receipt showing every payment method used.',
            },
            {
                q: 'Can I process a return or exchange at the POS?',
                a: 'Yes. Open the original sale from history, select the items to return and the quantity. VenQore reverses the sale, restores the inventory batch, and issues a refund to cash, the customer\'s khata, or a gift card.',
            },
            {
                q: 'Does VenQore support barcode labels for my own products?',
                a: 'Yes. Generate and print barcode labels directly from VenQore\'s inventory module. Supports Code 128, EAN-13, UPC-A and QR codes. Print to USB thermal label printers or standard A4 sheets.',
            },
            {
                q: 'Is there a per-transaction fee like Square or Stripe?',
                a: 'No. VenQore charges a flat monthly subscription ($49 / $99 / $299). There is no percentage or per-transaction fee on any sale, regardless of payment method or volume.',
            },
        ],
        crossLinks: [
            { href: '/features/offline-pos', label: 'Offline-First Architecture' },
            { href: '/features/accounting', label: 'Built-in Accounting Engine' },
            { href: '/features/inventory-management', label: 'FIFO Inventory Management' },
            { href: '/compare/venqore-vs-square', label: 'VenQore vs Square' },
        ],
    },

    /* ─────────────────────────────────────────────────────────────
     * GROWTH INTELLIGENCE ENGINE
     * ───────────────────────────────────────────────────────────── */
    'growth-engine': {
        slug: 'growth-engine',
        metaTitle: 'Growth Intelligence Engine — Retail Analytics That Score Themselves | VenQore',
        metaDescription: 'Four analysis engines read your customers, stock, margin and cash. Every insight shows the numbers behind it, and every prediction is checked afterwards against what actually happened.',
        heroBadge: 'Four Brains — Every Insight Comes With Its Evidence',
        headline: 'It Shows You Its Working.',
        subhead: 'Most business "insights" ask you to trust a number that appeared from nowhere. VenQore\'s Intelligence Engine shows the evidence behind every recommendation — and then scores itself, publishing how often it was actually right.',
        status: 'shipped',
        category: 'Growth & Intelligence',
        stats: [
            { value: '4', label: 'Analysis Engines' },
            { value: '32', label: 'Insight Types' },
            { value: '0', label: 'AI Keys Required' },
            { value: '24/7', label: 'Continuously Watching' },
        ],
        answerBlock: {
            question: 'How does the VenQore Growth Intelligence Engine work?',
            answer: 'Four engines run continuously over your own ledger. The Customer engine learns each buyer\'s personal ordering rhythm and flags them when they fall outside it. The Stock engine models demand as a rate and times reorder alerts to your real supplier lead time. The Profit engine uses actual FIFO cost per line to catch margin erosion and loss-making products. The Cash engine tracks receivables, collection speed and revenue anomalies against your own weekday history. Every insight arrives with the numbers behind it, and every prediction is checked afterwards so the engine can report its real accuracy and tune itself.',
        },
        painPoints: [
            {
                pain: 'You only find out a good customer left after they\'ve been gone for months',
                fix: 'The engine knows each customer\'s personal ordering rhythm and flags them when they are late by their own standard — often within days, not months.',
                icon: 'TrendingDown',
            },
            {
                pain: 'Your best-selling product runs out and you notice at the till',
                fix: 'Demand is modelled as a daily rate and compared against your real supplier lead time, so the warning arrives while there is still time to order.',
                icon: 'Package',
            },
            {
                pain: 'Sales look fine but there is never any money in the bank',
                fix: 'The Cash engine tracks how much of your sales actually convert to collected cash, and tells you when that ratio starts slipping.',
                icon: 'Landmark',
            },
            {
                pain: 'Supplier costs crept up and nobody changed the shelf price',
                fix: 'The Profit engine compares each product\'s real FIFO margin month over month and flags erosion — including lines you are now selling at a loss.',
                icon: 'Scale',
            },
            {
                pain: 'Dashboards throw alerts at you and you\'ve learned to ignore them',
                fix: 'Insights you dismiss stay dismissed. Insight types that keep proving wrong get quieter and eventually mute themselves — automatically.',
                icon: 'Pause',
            },
            {
                pain: 'You have no idea whether any of the software\'s predictions are actually right',
                fix: 'Every prediction is graded after the fact. The engine publishes its hit rate per insight type, so you know exactly which ones to trust.',
                icon: 'ShieldCheck',
            },
        ],
        features: [
            {
                title: 'Customer Engine — Personal Buying Rhythm',
                description: 'Most systems flag a customer as "at risk" using one rule for everybody. VenQore measures how far past each customer\'s OWN pattern they are, in standard deviations of their personal ordering gap. Someone who orders every 30 days give or take 2 is genuinely late at day 35. Someone who orders every 30 days give or take 25 is not late until day 90. One threshold cannot serve both.',
                icon: 'Repeat',
                tag: 'Core Engine',
            },
            {
                title: 'Stock Engine — Demand as a Rate',
                description: 'Velocity is measured across 7, 30 and 90-day windows, so acceleration and collapse are both visible where a single average would hide them. Days-of-cover and a projected stockout date fall straight out of that — and the alert is timed against how long your suppliers actually take, learned from your own purchase history.',
                icon: 'Package',
                tag: 'Core Engine',
            },
            {
                title: 'Profit Engine — Real FIFO Margin',
                description: 'Because VenQore already stores the exact FIFO cost of every line sold, the engine can see what a revenue report never will: margin erosion, products now selling below cost, discount leakage, price headroom, and a sales mix quietly shifting toward low-margin lines while the top line looks perfectly healthy.',
                icon: 'Scale',
                tag: 'Core Engine',
            },
            {
                title: 'Cash & Operations Engine',
                description: 'Aged receivables grouped by customer with the oldest invoice named, concentration risk when too much is owed by one buyer, collection velocity when cash starts arriving slower than it used to, plus peak trading hours, consistently quiet days and cashiers whose discount rate is a statistical outlier.',
                icon: 'Landmark',
                tag: 'Core Engine',
            },
            {
                title: 'Evidence On Every Insight',
                description: 'Each recommendation opens to show the numbers it was built from — the customer\'s normal gap, the stock on hand, the margin last month versus this month. You can check the claim yourself. An insight nobody can verify is an insight nobody acts on.',
                icon: 'List',
                tag: 'Transparency',
            },
            {
                title: 'It Scores Itself',
                description: 'Every prediction is checked after its horizon passes. Did the customer come back? Did the product run out? Was the payment collected? The engine publishes its hit rate per insight type so you know which ones have earned your attention. Observations like "this stock hasn\'t sold in 90 days" are facts rather than forecasts, so they are excluded rather than used to pad the score.',
                icon: 'ShieldCheck',
                tag: 'Self-Verifying',
            },
            {
                title: 'It Tunes Itself To You',
                description: 'Insight types that prove accurate and get acted on become more sensitive, catching more. Types that keep missing, or that you keep dismissing, get quieter — and if they keep failing they mute themselves for a few weeks. Every mute expires, so nothing is silenced permanently, and you can lift any of them yourself.',
                icon: 'RefreshCw',
                tag: 'Self-Tuning',
            },
            {
                title: 'It Learns Your Scale',
                description: 'There are no hardcoded rupee thresholds. Your median order value, typical reorder gap, real supplier lead time and actual payment terms are all measured from your own trading. The same rules therefore behave sensibly for a small counter shop and for a distributor, without either being told what "big" means.',
                icon: 'Layers',
                tag: 'Adaptive',
            },
            {
                title: 'Credit For Prevention, Not Just Prediction',
                description: 'If the engine warns a customer is about to churn, you message them, and they return — that is a success, not a failed forecast. Marking an insight as done is recorded, so the scoring can tell "the prediction was wrong" apart from "the prediction was right and you prevented it".',
                icon: 'Zap',
                tag: 'Honest Scoring',
            },
            {
                title: 'No AI Key, No Per-Message Cost',
                description: 'This is deterministic statistics over your own ledger, not a language model guessing. It runs on your server, costs nothing per analysis, produces identical results every time, and cannot invent a number that is not in your data.',
                icon: 'Lock',
                tag: 'Included',
            },
            {
                title: 'Runs Hourly Without Slowing You Down',
                description: 'The engine analyses a whole business in roughly a dozen set-based queries and skips any store with no new transactions since its last pass. That is why it can run every hour during trading and still cost a fraction of a traditional nightly report job.',
                icon: 'Database',
                tag: 'Efficient',
            },
            {
                title: 'Daily Business Snapshots',
                description: 'Revenue, margin, basket size, new versus returning customers, receivables and inventory value are recorded every day. That history is the baseline everything else is measured against — which is how the engine can say "quiet for a Tuesday" instead of just "quiet".',
                icon: 'BarChart3',
                tag: 'Historical Baseline',
            },
        ],
        comparisonTable: {
            title: 'VenQore Intelligence Engine vs Typical POS Analytics',
            rows: [
                { feature: 'Insight scope', venqore: 'Customers, stock, margin and cash', competitor: 'Sales charts only' },
                { feature: 'Churn detection', venqore: 'Each customer\'s own rhythm, in standard deviations', competitor: 'One fixed rule for every customer' },
                { feature: 'Margin analysis', venqore: 'Real FIFO cost per line', competitor: 'Revenue only, or average cost' },
                { feature: 'Dead stock & trapped cash', venqore: 'Surfaced with the money quantified', competitor: 'Not detected' },
                { feature: 'Evidence shown', venqore: 'Every underlying number, on every insight', competitor: 'A number with no explanation' },
                { feature: 'Accuracy reporting', venqore: 'Published hit rate per insight type', competitor: 'None — never verified' },
                { feature: 'Adapts to your business', venqore: 'Thresholds learned from your own trading', competitor: 'Hardcoded defaults' },
                { feature: 'Dismissed alerts', venqore: 'Stay dismissed for a cooling-off period', competitor: 'Reappear the next day' },
                { feature: 'Requires an AI subscription', venqore: 'No — deterministic, runs locally', competitor: 'Often a paid AI add-on' },
                { feature: 'Cost', venqore: 'Included in your plan', competitor: '+$20–$100/month analytics add-on' },
            ],
        },
        faqs: [
            {
                q: 'Does the Growth Intelligence Engine use AI?',
                a: 'No, and that is deliberate. It is deterministic statistics run over your own ledger — the same input always produces the same output. That means no AI subscription, no per-message cost, no data leaving your server, and no possibility of it inventing a number that is not in your data. VenQore does offer genuine AI elsewhere (Smart Capture reads bills and voice notes), but the Intelligence Engine is pure mathematics.',
            },
            {
                q: 'How does it know when a customer is "late"?',
                a: 'It learns each customer\'s own ordering gap and how consistent that gap is, then measures how many standard deviations past their personal normal they currently are. A customer who orders like clockwork gets a tight tolerance; an erratic one gets a wide tolerance. It will not make a lateness claim at all until it has seen enough orders to know what normal looks like for that person.',
            },
            {
                q: 'How do I know whether to trust its predictions?',
                a: 'Because it tells you. Every prediction is checked after its horizon passes and graded as correct or incorrect. The dashboard shows the hit rate for each insight type — so you might see that stock run-out warnings are right 85% of the time while churn warnings are right 66%, and weight them accordingly. Very few business tools are willing to publish that.',
            },
            {
                q: 'Will it flood me with alerts?',
                a: 'No. Insights are ranked by the money actually at stake, not by a priority label. Anything you dismiss stays dismissed for a cooling-off period rather than returning tomorrow. Insight types you never act on become less sensitive, and ones that keep proving wrong mute themselves temporarily. Signals also close automatically once you have fixed the underlying problem, so the list only shows what is still live.',
            },
            {
                q: 'How long before it becomes useful?',
                a: 'Stock, margin and cash insights work from your first weeks of trading. Customer rhythm insights need a few orders per customer before the engine will make a claim. Accuracy figures appear once around fifteen predictions have been graded — until then the dashboard honestly says it is still learning your business rather than showing you numbers built on a handful of data points.',
            },
            {
                q: 'Does running it slow down my POS?',
                a: 'No. It analyses an entire business in roughly a dozen database queries and runs as a background job, never inside a checkout or page load. Stores with no new transactions since the last pass are skipped after a single lookup, so an idle shop costs essentially nothing.',
            },
            {
                q: 'What plans include the Intelligence Engine?',
                a: 'The Growth Intelligence Engine is available on Growth and Enterprise plans. Loyalty points and digital gift cards, which sit alongside it, are Enterprise features.',
            },
        ],
        crossLinks: [
            { href: '/features/accounting', label: 'Built-in Accounting Engine' },
            { href: '/features/inventory-management', label: 'FIFO Inventory Management' },
            { href: '/features/point-of-sale', label: 'Point of Sale System' },
            { href: '/pricing', label: 'Plans & Pricing' },
        ],
    },
};

/** Ordered list for the hub page /features */
export const featurePagesList = [
    {
        slug: 'point-of-sale',
        title: 'Point of Sale',
        description: 'Offline-first checkout. Barcode scanning, split payments, holds, thermal printing, staff roles — zero per-transaction fees.',
        icon: 'ShoppingCart',
        status: 'shipped',
        color: 'indigo',
    },
    {
        slug: 'accounting',
        title: 'Double-Entry Accounting',
        description: 'Automatic journal entries on every transaction. P&L, Balance Sheet, 40 reports — all from one verified ledger.',
        icon: 'BookOpen',
        status: 'shipped',
        color: 'emerald',
    },
    {
        slug: 'inventory-management',
        title: 'Inventory Management',
        description: 'FIFO batches, expiry tracking, serial/IMEI numbers, variants, multi-warehouse, purchase orders and composite recipes.',
        icon: 'Package',
        status: 'shipped',
        color: 'violet',
    },
    {
        slug: 'offline-pos',
        title: 'Offline-First Architecture',
        description: 'Sells without internet. Carts saved before server confirmation. Syncs automatically on reconnect. Installs as a PWA.',
        icon: 'WifiOff',
        status: 'shipped',
        color: 'blue',
    },
    {
        slug: 'growth-engine',
        title: 'Growth Intelligence Engine',
        description: 'Four engines reading your customers, stock, margin and cash. Every insight shows its evidence — and scores itself afterwards.',
        icon: 'TrendingUp',
        status: 'shipped',
        color: 'violet',
    },
];

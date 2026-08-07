/**
 * Industry Solutions Data Store
 * Source of truth for /solutions hub and industry detail pages (/solutions/{slug})
 */
export const solutionsData = {
    'pharmacy': {
        slug: 'pharmacy',
        name: 'Pharmacy',
        headline: 'Pharmacy POS & Inventory System with Expiry & FIFO Batch Control',
        tagline: 'Stop writing off expired medicine. Track batch numbers, expiry dates, supplier returns, and drug registers automatically.',
        subhead: 'VenQore gives pharmacies complete batch-level traceability, FEFO/FIFO dispatching, automated expiry warnings, and auditor-grade double-entry accounting in one offline-first platform.',
        metaTitle: 'Pharmacy POS System with Expiry Tracking & FIFO Batch Control — VenQore',
        metaDescription: 'The pharmacy POS software built for precision. Track batch numbers, expiry dates, FEFO dispatch, drug control registers, and real double-entry accounting. Try the live demo.',
        heroBadge: 'PHARMACY OPERATING SYSTEM',
        iconName: 'Pill',
        accentColor: 'emerald',

        stats: [
            { value: '0%', label: 'Unchecked Expiry Losses' },
            { value: '100%', label: 'Batch-Level Lineage' },
            { value: 'FEFO/FIFO', label: 'Smart Batch Dispatch' },
            { value: '1,500+', label: 'Automated Integrity Tests' },
        ],

        painPoints: [
            {
                title: 'Expired Drugs Written Off Silently',
                problem: 'Shelved medicines expire unnoticed until annual stocktaking. Without automated expiry tracking, pharmacies lose 5–12% of total inventory value every year to write-offs.',
                solution: 'VenQore tracks manufacture date, expiry date, and cost per batch. Automated color-coded alerts notify cashiers and managers 30, 60, and 90 days before expiry.'
            },
            {
                title: 'Blended Cost Masking Pharmacy Profit',
                problem: 'Generic POS tools average the cost of medicine batches purchased at different prices. You cannot tell if price increases from suppliers are eroding your gross profit margin.',
                solution: 'VenQore implements strict FIFO (First-In, First-Out) batch costing. Every sale deducts from the exact oldest active batch at its true landed purchase cost.'
            },
            {
                title: 'Regulatory Audit & Controlled Substance Stress',
                problem: 'Inspections require immediate proof of purchase invoices, supplier batch logs, and customer prescription sales for restricted medications.',
                solution: 'One-click batch audit logs. Search any medicine batch number to instantly see the receiving purchase order, supplier details, cashier ID, and customer receipt.'
            },
            {
                title: 'Internet Drops During Busy Shifts',
                problem: 'Cloud-only pharmacy software freezes when internet fails. Patients waiting for urgent medication face long queues or manual paper receipts.',
                solution: 'VenQore is 100% offline-first. Barcode scanning, receipt printing, and batch validation continue smoothly without an active internet connection.'
            }
        ],

        features: [
            {
                title: 'Batch & Expiry Date Management',
                desc: 'Every purchase order received assigns batch numbers and expiry dates to inventory. Cashiers see clear expiry badges during checkout to prevent selling expired stock.',
                icon: 'Calendar'
            },
            {
                title: 'FEFO (First-Expired, First-Out) Smart Dispatch',
                desc: 'VenQore automatically suggests picking the batch expiring soonest, preserving fresh inventory on shelves and minimizing waste.',
                icon: 'Clock'
            },
            {
                title: 'Supplier Return & Credit Management',
                desc: 'Identify medicines approaching expiry and generate supplier debit notes to claim returns or replacements before product expiration.',
                icon: 'RotateCcw'
            },
            {
                title: 'Barcode Scanning & Strip Unit Support',
                desc: 'Sell medicines by full box, strip, or single tablet with automatic unit-of-measure conversions and fractional pricing.',
                icon: 'Scan'
            },
            {
                title: 'Patient Prescription & Khata Ledgers',
                desc: 'Maintain customer credit ledgers for regular patients with automated payment allocation and balance tracking.',
                icon: 'Users'
            },
            {
                title: 'Auditor-Grade Accounting Engine',
                desc: 'Every pharmacy sale, purchase, and return updates your General Ledger, Balance Sheet, and P&L in real time with zero manual bookkeeping.',
                icon: 'Scale'
            }
        ],

        accountingImpact: {
            title: 'How Pharmacy Sales Update Your Books Automatically',
            description: 'When a cashier rings up a $45 pharmacy transaction with 5% sales tax, VenQore writes a balanced double-entry journal behind the scenes:',
            entries: [
                { account: '1000 — Cash / Till Account', debit: '$45.00', credit: '—', note: 'Asset increases' },
                { account: '4000 — Pharmacy Revenue Account', debit: '—', credit: '$42.86', note: 'Income posted' },
                { account: '2200 — Output Sales Tax Payable', debit: '—', credit: '$2.14', note: 'Liability separated' },
                { account: '5000 — Cost of Goods Sold (COGS)', debit: '$26.50', credit: '—', note: 'FIFO batch cost deducted' },
                { account: '1100 — Inventory Valuation Account', debit: '—', credit: '$26.50', note: 'Asset inventory reduced' },
            ]
        },

        faqs: [
            {
                q: 'How does VenQore handle medicines with different expiry dates under the same barcode?',
                a: 'VenQore supports multi-batch inventory per barcode. When scanning a barcode, the system prompts the cashier to select or confirm the active batch number, enforcing FEFO (First-Expired, First-Out) dispatching.'
            },
            {
                q: 'Can I sell medicine by the strip or single tablet instead of full boxes?',
                a: 'Yes. VenQore features built-in multi-unit of measure (UOM) conversions. You can define 1 Box = 10 Strips = 100 Tablets. Stock deducts accurately regardless of which unit is sold at checkout.'
            },
            {
                q: 'What happens if a cashier tries to sell an expired medicine batch?',
                a: 'VenQore features an optional hard-lock setting. If a batch is past its expiry date, the POS displays a red warning banner and blocks the cashier from adding it to the cart without manager PIN authorization.'
            },
            {
                q: 'Does VenQore work when the internet is disconnected in my pharmacy?',
                a: 'Yes. VenQore is an offline-first PWA. Barcode scanning, cart building, prescription printing, and ledger posting operate offline. All data automatically synchronizes to the cloud when connection restores.'
            },
            {
                q: 'Can VenQore handle supplier returns for near-expiry drugs?',
                a: 'Yes. You can generate a Supplier Return Report filtered by medicines expiring within 30 to 90 days, generate a debit note automatically, and deduct the amount from your accounts payable.'
            }
        ],

        compareCrossLinks: [
            { name: 'VenQore vs Square POS', href: '/compare/venqore-vs-square' },
            { name: 'VenQore vs Vyapar', href: '/compare/venqore-vs-vyapar' },
        ],
        featureCrossLinks: [
            { name: 'All 226+ Features', href: '/features' },
            { name: 'Verified Double-Entry Ledger', href: '/features' },
            { name: 'Multi-Store Operating System', href: '/features' },
        ]
    },

    'electronics-store': {
        slug: 'electronics-store',
        name: 'Electronics Store',
        headline: 'Electronics Store POS & ERP with Serial & IMEI Number Tracking',
        tagline: 'Track smartphones, laptops, and serialised gadgets from purchase to customer warranty without spreadsheets.',
        subhead: 'VenQore gives electronics retailers unit-level serial/IMEI tracking, warranty status lookup, trade-in processing, supplier RMA management, and verified financial books in one unified platform.',
        metaTitle: 'Electronics POS System with Serial & IMEI Tracking — VenQore',
        metaDescription: 'Electronics retail POS software with serial & IMEI tracking, warranty management, supplier RMA tracking, and double-entry accounting. Try the live demo.',
        heroBadge: 'ELECTRONICS RETAIL OPERATING SYSTEM',
        iconName: 'Smartphone',
        accentColor: 'indigo',

        stats: [
            { value: '100%', label: 'IMEI & Serial Precision' },
            { value: 'Instant', label: 'Warranty Lookup' },
            { value: '$0', label: 'Transaction Fees' },
            { value: '1,500+', label: 'Automated Integrity Tests' },
        ],

        painPoints: [
            {
                title: 'Lost Sales & Fraudulent Warranty Claims',
                problem: 'Customers return broken gadgets claiming they were bought at your shop. Without serial/IMEI verification on receipt, shops accept fraudulent returns or turn away legitimate customers.',
                solution: 'VenQore captures exact IMEI/Serial numbers at purchase receiving and prints them directly on the customer receipt. Staff verify warranty validity in 2 seconds with a barcode scan.'
            },
            {
                title: 'High-Value Stock Leakage & Shrinkage',
                problem: 'Smartphones, tablets, and accessories are prime targets for internal theft. Generic POS systems track quantity counts, not individual high-value items.',
                solution: 'Serial-level inventory tracking. Every IMEI unit is a distinct tracked record. VenQore alerts managers immediately if a physical serial number does not match stock records.'
            },
            {
                title: 'Supplier RMA & Replacement Headaches',
                problem: 'Defective electronics sent to distributors get lost in back-and-forth phone calls, leaving your accounts payable out of sync with actual stock.',
                solution: 'VenQore tracks Supplier RMA (Return Merchandise Authorization) status per serial number. Generates debit notes automatically and restores stock when replacement units arrive.'
            },
            {
                title: 'Complex Variant Matrix & Accessories',
                problem: 'Phones come in multiple colors, storage capacities (128GB, 256GB, 512GB), and conditions (New, Refurbished, Open Box), creating chaotic stock lists.',
                solution: 'Matrix variant management. Easily create product families with clean attribute selection while maintaining serial-level precision for every single item.'
            }
        ],

        features: [
            {
                title: 'IMEI & Serial Number Lifecycle Tracking',
                desc: 'Scan or type unique IMEI/Serial numbers when receiving stock, selling at POS, or processing returns. Full history logged per unit.',
                icon: 'QrCode'
            },
            {
                title: 'Instant Receipt & Warranty Card Generation',
                desc: 'Print receipts featuring customer warranty terms, serial numbers, and scannable QR codes for fast service lookup.',
                icon: 'FileText'
            },
            {
                title: 'Supplier RMA & Warranty Claim Management',
                desc: 'Log defective serial numbers, track status with manufacturers or distributors, and process credit notes or replacement units.',
                icon: 'RefreshCw'
            },
            {
                title: 'Trade-In & Used Device Procurement',
                desc: 'Purchase used phones or electronics from customers with ID verification records, posting purchase journal entries automatically.',
                icon: 'Repeat'
            },
            {
                title: 'Multi-Branch Serial Transfers',
                desc: 'Transfer specific high-value serial numbers between store branches with chain-of-custody tracking and transfer slips.',
                icon: 'Truck'
            },
            {
                title: 'Serial-Level Profitability & Ledger Truth',
                desc: 'See the exact gross profit margin on every smartphone or laptop sold, accounting for trade-in costs and refurbishing expenses.',
                icon: 'TrendingUp'
            }
        ],

        accountingImpact: {
            title: 'How Electronics Sales Update Your Books Automatically',
            description: 'When selling a $899 smartphone with serial tracking, VenQore records the exact unit cost ($680) and updates your ledger in real time:',
            entries: [
                { account: '1000 — Cash / Card Payment Account', debit: '$899.00', credit: '—', note: 'Funds received' },
                { account: '4000 — Electronics Sales Revenue', debit: '—', credit: '$899.00', note: 'Income posted' },
                { account: '5000 — Cost of Goods Sold (COGS)', debit: '$680.00', credit: '—', note: 'Exact serial purchase cost' },
                { account: '1100 — Serialised Inventory Valuation', debit: '—', credit: '$680.00', note: 'Specific unit removed from asset' },
            ]
        },

        faqs: [
            {
                q: 'Does VenQore require scanning IMEI numbers during checkout?',
                a: 'For serialised product categories (like smartphones or laptops), VenQore prompts the cashier to scan or enter the unique IMEI/Serial number before adding the item to the bill, preventing stock mismatched sales.'
            },
            {
                q: 'Can I look up a customer warranty using their phone serial number?',
                a: 'Yes. Enter or scan any serial/IMEI number in the search bar to view the original purchase date, customer name, invoice number, warranty expiration date, and repair history.'
            },
            {
                q: 'How does VenQore handle customer trade-ins or buying used gadgets?',
                a: 'VenQore includes a Trade-In Module. You can record the customer’s identity proof, condition inspection notes, and offer price. The device enters inventory as a serialised unit and posts a purchase entry automatically.'
            },
            {
                q: 'Can I manage both high-value gadgets and generic accessories in one system?',
                a: 'Yes. You can configure items as "Serialised" (smartphones, laptops) or "Standard Barcode" (cables, screen protectors, phone cases). Both flow seamlessly through the same POS checkout.'
            },
            {
                q: 'Does VenQore work offline when selling high-value electronics?',
                a: 'Yes. All serial validation, cart building, receipt printing, and transaction recording work 100% offline. Data syncs back to the main database when internet restores.'
            }
        ],

        compareCrossLinks: [
            { name: 'VenQore vs Square POS', href: '/compare/venqore-vs-square' },
            { name: 'VenQore vs Vyapar', href: '/compare/venqore-vs-vyapar' },
        ],
        featureCrossLinks: [
            { name: 'All 226+ Features', href: '/features' },
            { name: 'Serial & IMEI Tracking', href: '/features' },
            { name: 'Multi-Store Inventory Sync', href: '/features' },
        ]
    },

    'grocery': {
        slug: 'grocery',
        name: 'Grocery & Supermarket',
        headline: 'Grocery POS & Supermarket ERP with High-Speed Checkout & Scale Integration',
        tagline: 'Eliminate lines, integrate weighing scales, print barcodes, and track FIFO margins on thousands of SKUs.',
        subhead: 'VenQore gives supermarket operators high-speed barcode checkout, direct weight scale integration, multi-pack bundling, automatic reorder level alerts, and verified double-entry accounting in one offline-first platform.',
        metaTitle: 'Grocery & Supermarket POS System with Scale Integration — VenQore',
        metaDescription: 'Supermarket POS software built for speed and volume. Track weight scales, package variations, reorder alerts, and double-entry books. Try the live demo.',
        heroBadge: 'GROCERY OPERATING SYSTEM',
        iconName: 'ShoppingCart',
        accentColor: 'amber',

        stats: [
            { value: '<1s', label: 'Barcode Scan Time' },
            { value: '100%', label: 'Scale Integration' },
            { value: 'Automatic', label: 'Reorder Alerts' },
            { value: '1,500+', label: 'Automated Integrity Tests' },
        ],

        painPoints: [
            {
                title: 'High-Speed Checkout Bottlenecks & Long Lines',
                problem: 'During rush hours, cashiers search manually for loose vegetables, fruits, or bakery items, stalling checkout lines and causing customer frustration.',
                solution: 'VenQore features rapid keyboard hotkeys and visual quick-pick buttons for items without barcodes, allowing cashiers to add items to the cart in less than a second.'
            },
            {
                title: 'Weight Scale Variance Profit Leaks',
                problem: 'Manually entering loose item weights from scale displays leads to cashier entry errors, weight rounding mistakes, and inventory count mismatch leaks.',
                solution: 'VenQore integrates directly with barcode-printing scales and electronic POS scales, pulling the exact weight and price to checkout automatically.'
            },
            {
                title: 'Supplier Price Hikes Squeezing Margins',
                problem: 'Supermarkets manage 10,000+ SKUs. When wholesalers increase prices, updating shelf prices manually takes days, eroding gross profit margins silently.',
                solution: 'VenQore features bulk price updates via CSV and vendor purchase order price lock. Landed costs update automatically, and price tag labels print directly from the receiving sheet.'
            },
            {
                title: 'Out of Stock on Staple Goods',
                problem: 'Running out of milk, bread, or cooking oil drives shoppers to competitors. Placing purchase orders manually based on visual checks leads to stockouts.',
                solution: 'Low-stock threshold triggers. Set reorder levels per SKU. VenQore generates supplier purchase orders automatically when stock drops below safety levels.'
            }
        ],

        features: [
            {
                title: 'Weight Scale Integration & Unit Conversion',
                desc: 'Connect your weight scale directly. Support selling by weight (kg, g, lbs) or packaging unit (bag, box, case) with automatic fractional calculation.',
                icon: 'Scale'
            },
            {
                title: 'Multi-Pack & Bundle Pricing',
                desc: 'Define price tiers for single units vs cartons. Automatically apply promotional bundles (e.g. Buy 3 for $5) at checkout to drive volume.',
                icon: 'Repeat'
            },
            {
                title: 'Fast Barcode Tag Printing',
                desc: 'Generate and print thermal barcode labels for repackaged dry fruits, spices, or bakery items directly from your inventory screen.',
                icon: 'Scan'
            },
            {
                title: 'Hold & Recall Parked Carts',
                desc: 'Let customers step away to fetch forgotten items without stalling the till. Cashiers park the cart, ring up the next shopper, and resume the parked cart with one tap.',
                icon: 'RotateCcw'
            },
            {
                title: 'Supplier Purchase & Reorder Workflow',
                desc: 'Manage the entire supplier lifecycle: raise purchase orders, receive partial shipments, track backorders, and update accounts payable automatically.',
                icon: 'Truck'
            },
            {
                title: 'Automated General Ledger posting',
                desc: 'Every checkout sale, purchase invoice, and cashier cash drop posts balanced double-entry journals, so your Profit & Loss is always accurate.',
                icon: 'Scale'
            }
        ],

        accountingImpact: {
            title: 'How Supermarket Sales Update Your Books Automatically',
            description: 'When selling $120.00 of groceries with cash, card, and tax split, VenQore posts this balanced entry without manual accounting:',
            entries: [
                { account: '1000 — Cash Till Account', debit: '$50.00', credit: '—', note: 'Cash portion' },
                { account: '1010 — Bank Card Account', debit: '$70.00', credit: '—', note: 'Card portion' },
                { account: '4000 — Supermarket Revenue', debit: '—', credit: '$114.28', note: 'Net revenue' },
                { account: '2200 — Sales Tax Output Payable', debit: '—', credit: '$5.72', note: 'Tax collected' },
                { account: '5000 — Cost of Goods Sold (COGS)', debit: '$82.10', credit: '—', note: 'FIFO inventory cost' },
                { account: '1100 — Grocery Inventory Assets', debit: '—', credit: '$82.10', note: 'Stock value reduced' },
            ]
        },

        faqs: [
            {
                q: 'How does VenQore handle weighed vegetables and fruits?',
                a: 'VenQore supports barcode-generating scales. The scale prints a barcode containing the product SKU and weight. When cashiers scan the barcode at the POS, VenQore automatically decodes the weight, calculates the total price, and updates inventory.'
            },
            {
                q: 'Can I import my existing supermarket inventory list?',
                a: 'Yes. You can import thousands of products, descriptions, barcodes, costs, prices, and categories in seconds using our standard Excel/CSV upload tool.'
            },
            {
                q: 'How does the cash drawer reconcile at shift end?',
                a: 'VenQore tracks cashier shifts. When closing a register, the cashier enters the physical cash count. VenQore matches it against ledger sales, flags discrepancies, and posts shift summary reports automatically.'
            },
            {
                q: 'Does VenQore run offline if the internet fails?',
                a: 'Yes. The POS checkout cache runs locally on IndexedDB. You can scan barcodes, check out customers, print receipts, and reconcile cash drawer shifts offline. Data syncs when the internet returns.'
            }
        ],

        compareCrossLinks: [
            { name: 'VenQore vs Square POS', href: '/compare/venqore-vs-square' },
            { name: 'VenQore vs Vyapar', href: '/compare/venqore-vs-vyapar' },
        ],
        featureCrossLinks: [
            { name: 'All 226+ Features', href: '/features' },
            { name: 'Point of Sale Checkout', href: '/features/point-of-sale' },
            { name: 'Offline POS System', href: '/features/offline-pos' },
        ]
    },

    'wholesale': {
        slug: 'wholesale',
        name: 'Wholesale & Distribution',
        headline: 'Wholesale POS & B2B Distribution ERP with Customer Credit & Tiered Pricing',
        tagline: 'Secure customer credit, manage tiered B2B pricing, track sales orders, and automate aging receivables.',
        subhead: 'VenQore gives wholesalers and distributors a powerful multi-tier customer pricing matrix, automated credit limit controls, salesman order booking support, accounts receivable aging, and verified double-entry ledgers.',
        metaTitle: 'Wholesale POS System & B2B Distribution ERP — VenQore',
        metaDescription: 'Wholesale POS and ERP software with tiered pricing, customer credit limit guards, aging accounts receivable, and double-entry accounting. Try the live demo.',
        heroBadge: 'WHOLESALE OPERATING SYSTEM',
        iconName: 'Truck',
        accentColor: 'violet',

        stats: [
            { value: '3-Tier', label: 'Pricing Matrix' },
            { value: 'Automated', label: 'Credit Limit Guards' },
            { value: 'Real-time', label: 'AR Aging' },
            { value: '1,500+', label: 'Automated Integrity Tests' },
        ],

        painPoints: [
            {
                title: 'Bad Debt Leaks from Uncontrolled Customer Credit',
                problem: 'Salesmen issue credit to delinquent B2B clients who are past due, resulting in unpaid invoices, collection disputes, and cash flow shortages.',
                solution: 'VenQore enforces hard credit limit controls. The POS blocks sales automatically if the client\'s outstanding balance exceeds their approved cap, requiring manager override PIN.'
            },
            {
                title: 'Inconsistent Pricing & Manual Calculations',
                problem: 'Wholesalers charge different prices based on client level (Retailer, Distributor, Partner) and order volume. Calculating these manually leads to errors and billing disputes.',
                solution: 'Built-in customer group price matrix. Define custom price tiers per product. VenQore updates the unit price automatically based on the customer profile and volume.'
            },
            {
                title: 'Wasted Time Reconciling Partially Received Orders',
                problem: 'Wholesale shipments frequently arrive with missing items or damaged goods, leading to inaccurate invoice records and inventory imbalances.',
                solution: 'VenQore features partial purchase order receiving. Mark exactly how many units were received; the system logs backorders and updates inventory batches and payables.'
            },
            {
                title: 'Packaging Conversion Confusion (Cartons vs Pieces)',
                problem: 'Buying in bulk pallets/cartons but selling in individual boxes or pieces causes chaotic inventory counts and incorrect unit cost calculations.',
                solution: 'VenQore features multi-unit packaging support. Define carton packaging ratios (e.g. 1 Carton = 24 Pieces). Stock levels and costs scale automatically.'
            }
        ],

        features: [
            {
                title: 'Tiered Customer Price Matrices',
                desc: 'Configure unlimited pricing tiers. Assign specific rates per product to customer groups or set bulk quantity breaks to reward high-volume buyers.',
                icon: 'FileText'
            },
            {
                title: 'B2B Credit Limit Safeguards',
                desc: 'Set approved credit limits and payment terms (e.g. Net 30) per customer. Block invoice dispatching if their account is locked or past due.',
                icon: 'Scale'
            },
            {
                title: 'Accounts Receivable Aging Reports',
                desc: 'Track outstanding customer balances grouped by age (30, 60, 90+ days) in real time. Send WhatsApp ledger statements directly from the report screen.',
                icon: 'TrendingUp'
            },
            {
                title: 'Multi-Unit Packaging conversions',
                desc: 'Receive stock in cartons and sell in pieces. VenQore converts inventory counts and tracks unit FIFO costs automatically.',
                icon: 'Repeat'
            },
            {
                title: 'Sales Order & Quote workflow',
                desc: 'Generate professional B2B quotes, convert them to sales orders with one click, track delivery status, and generate the invoice on fulfillment.',
                icon: 'Truck'
            },
            {
                title: 'Immutable Ledger Accounting',
                desc: 'Every wholesale invoice, supplier invoice, and customer payment updates your General Ledger, Trial Balance, and P&L automatically.',
                icon: 'Scale'
            }
        ],

        accountingImpact: {
            title: 'How Wholesale Credit Sales Update Your Books Automatically',
            description: 'When dispatching a $2,500.00 B2B order on credit terms, VenQore writes a balanced double-entry record to your books:',
            entries: [
                { account: '1200 — Accounts Receivable (Customer Ledger)', debit: '$2,500.00', credit: '—', note: 'Customer balance posted' },
                { account: '4010 — Wholesale Sales Revenue', debit: '—', credit: '$2,500.00', note: 'Revenue recognized' },
                { account: '5000 — Cost of Goods Sold (COGS)', debit: '$1,750.00', credit: '—', note: 'FIFO stock batch cost' },
                { account: '1100 — Wholesale Inventory Assets', debit: '—', credit: '$1,750.00', note: 'Inventory value reduced' },
            ]
        },

        faqs: [
            {
                q: 'Can I enforce credit limits for customer credit sales?',
                a: 'Yes. You can configure approved credit limits per customer. The POS checkout blocks the sale if the invoice total pushes the client\'s balance past their limit, requiring manager PIN authorization.'
            },
            {
                q: 'How does VenQore help my salesmen take orders on site?',
                a: 'VenQore is a browser-based PWA that installs on smartphones and tablets. Salesmen can access the catalog, search stock by warehouse, raise quotes or sales orders on-site, and sync back to HQ.'
            },
            {
                q: 'Can I print accounts statements for my clients?',
                a: 'Yes. One click generates a Customer Khata Ledger Statement, detailing opening balance, chronological invoice charges, payment receipts, and current closing balance. You can download it as a PDF or send it via WhatsApp.'
            },
            {
                q: 'Does the system calculate gross profit by customer?',
                a: 'Yes. Our Party-wise Profitability Report analyzes your net margins per B2B customer, subtracting exact FIFO batch costs from invoice revenue to identify your most valuable accounts.'
            }
        ],

        compareCrossLinks: [
            { name: 'VenQore vs Square POS', href: '/compare/venqore-vs-square' },
            { name: 'VenQore vs Vyapar', href: '/compare/venqore-vs-vyapar' },
        ],
        featureCrossLinks: [
            { name: 'All 226+ Features', href: '/features' },
            { name: 'Double-Entry Accounting', href: '/features/accounting' },
            { name: 'FIFO Inventory Management', href: '/features/inventory-management' },
        ]
    },

    'clothing': {
        slug: 'clothing',
        name: 'Apparel & Fashion Boutique',
        headline: 'Fashion Boutique POS & Retail ERP with Size & Color Variant Matrix',
        tagline: 'Manage size/color variants, print barcodes, sync online sales, and track fashion margins.',
        subhead: 'VenQore gives fashion boutiques and apparel retailers a clean product variant matrix, custom tag barcode printing, real-time WooCommerce online store inventory sync, and auditor-grade double-entry accounting in one system.',
        metaTitle: 'Fashion Boutique POS & Apparel Inventory System — VenQore',
        metaDescription: 'Apparel retail POS software with size/color variant matrix, custom barcode label printing, WooCommerce stock sync, and real accounting. Try the live demo.',
        heroBadge: 'APPAREL OPERATING SYSTEM',
        iconName: 'Pill', // Reusing template icons
        accentColor: 'rose',

        stats: [
            { value: 'Matrix', label: 'Variant Handling' },
            { value: '<5min', label: 'WooCommerce Sync' },
            { value: 'Custom', label: 'Barcode Printing' },
            { value: '1,500+', label: 'Automated Integrity Tests' },
        ],

        painPoints: [
            {
                title: 'Variant Chaos (Sizes, Colors, Styles)',
                problem: 'Tracking individual stock counts for a single shirt style available in 5 sizes and 4 colors requires creating 20 separate flat products, cluttering search lists.',
                solution: 'VenQore features variant matrix grids. Create one parent product and define its size and color options. The system creates the child SKUs automatically with clean organization.'
            },
            {
                title: 'Out of Sync Online Sales & Double-Selling',
                problem: 'Selling a dress in-store while an online customer orders the same item on your website results in double-selling, refund processing, and poor reviews.',
                solution: 'Real-time WooCommerce sync. VenQore pulls web orders instantly, matches SKU numbers, and updates inventory. Physical store checkout sales update online stock levels automatically.'
            },
            {
                title: 'Barcode Label Design Overhead',
                problem: 'Printing barcode labels with brand name, variant size, color, and price for newly received clothing batches requires separate designer apps.',
                solution: 'Built-in custom barcode label designer. Select any received purchase batch, select your label template, and print custom tags directly from the screen.'
            },
            {
                title: 'Markdown Profit Loss Uncertainty',
                problem: 'Promotions and end-of-season clearance sales drive customer traffic, but you cannot verify if markdowns are pushing your margins below product cost.',
                solution: 'VenQore\'s item-wise gross profit report tracks exact margin performance, subtracting FIFO batch purchase costs from discount checkout prices.'
            }
        ],

        features: [
            {
                title: 'Size & Color Variant Matrix Grids',
                desc: 'Add product variant attributes (size, color, material) in one screen. VenQore generates independent SKU codes, barcodes, and stock levels per variation.',
                icon: 'QrCode'
            },
            {
                title: 'Real-Time WooCommerce Inventory Sync',
                desc: 'Sync stock and orders with WooCommerce automatically. Pushes POS stock level updates and retrieves online orders to deduct inventory instantly.',
                icon: 'Clock'
            },
            {
                title: 'Custom Barcode Tag Designer',
                desc: 'Print price tags and barcodes for newly arrived clothing lines. Add attributes like color, size, and category on the label layout.',
                icon: 'FileText'
            },
            {
                title: 'Markdown & Promotional Campaigns',
                desc: 'Set up temporary sale discounts or customer loyalty promotions. VenQore calculates net transaction profits and tracks campaign performance.',
                icon: 'Repeat'
            },
            {
                title: 'Customer Loyalty & CRM Tools',
                desc: 'Build customer database profiles, reward checkout points on every purchase, and track customer purchase histories to plan collections.',
                icon: 'Users'
            },
            {
                title: 'Automated Financial Reports',
                desc: 'Every apparel sale, online WooCommerce sync, and expense records balanced double-entry books, giving you clean Profit & Loss statements.',
                icon: 'Scale'
            }
        ],

        accountingImpact: {
            title: 'How Apparel Sales Update Your Books Automatically',
            description: 'When selling a $95.00 jacket with in-store checkout, VenQore records the transaction and deducts its exact variant cost ($42.00):',
            entries: [
                { account: '1000 — Cash Till Account', debit: '$95.00', credit: '—', note: 'Customer payment' },
                { account: '4000 — Apparel Retail Revenue', debit: '—', credit: '$95.00', note: 'Sales revenue posted' },
                { account: '5000 — Cost of Goods Sold (COGS)', debit: '$42.00', credit: '—', note: 'Exact FIFO cost of jacket' },
                { account: '1100 — Clothing Inventory Assets', debit: '—', credit: '$42.00', note: 'Stock inventory reduced' },
            ]
        },

        faqs: [
            {
                q: 'How does the variant matrix simplify adding clothing items?',
                a: 'Instead of creating separate products for each size/color combination, you create one product, enter attributes (e.g. Size: S, M, L; Color: Blue, Black), and the matrix creates all combinations automatically.'
            },
            {
                q: 'How fast does the WooCommerce stock sync update?',
                a: 'VenQore listens to WooCommerce sales webhooks. When an online sale occurs, inventory deducts immediately. Physical store checkout sales update online WooCommerce inventory levels automatically within 5 minutes.'
            },
            {
                q: 'Can I print custom tag labels with my store logo?',
                a: 'Yes. Our built-in barcode generator and label printing tool support custom templates. You can print size, color, brand name, price, and scannable barcode to standard label printers.'
            },
            {
                q: 'Can I set customer loyalty points to expire?',
                a: 'Yes. You can define custom points accumulation rules (e.g. $1 spent = 1 Point) and configure validity windows for redemption at the POS.'
            }
        ],

        compareCrossLinks: [
            { name: 'VenQore vs Square POS', href: '/compare/venqore-vs-square' },
            { name: 'VenQore vs Vyapar', href: '/compare/venqore-vs-vyapar' },
        ],
        featureCrossLinks: [
            { name: 'All 226+ Features', href: '/features' },
            { name: 'Point of Sale Checkout', href: '/features/point-of-sale' },
            { name: 'FIFO Inventory Management', href: '/features/inventory-management' },
        ]
    },

    'multi-store': {
        slug: 'multi-store',
        name: 'Multi-Store Retail Chains',
        headline: 'Enterprise POS & ERP for Multi-Store Retail Chains & Franchises',
        tagline: 'Consolidate multiple warehouses, transfer stock securely, control staff roles, and centralize your ledger.',
        subhead: 'VenQore gives retail chains centralized multi-warehouse stock transfers, store-wise Profit & Loss statements, consolidated trial balances, 7 cashier and manager role levels, and real-time operational oversight.',
        metaTitle: 'Multi-Store POS System & Retail Chain ERP — VenQore',
        metaDescription: 'Multi-store retail POS and ERP software with consolidated ledgers, store-wise P&L, secure stock transfers, and cashier audit logs. Try the live demo.',
        heroBadge: 'MULTI-STORE OPERATING SYSTEM',
        iconName: 'Smartphone',
        accentColor: 'cyan',

        stats: [
            { value: 'Consolidated', label: 'General Ledger' },
            { value: 'Atomic', label: 'Stock Transfers' },
            { value: '7 Levels', label: 'Cashier Roles' },
            { value: '1,500+', label: 'Automated Integrity Tests' },
        ],

        painPoints: [
            {
                title: 'Inventory Leaks during Branch-to-Branch Transfers',
                problem: 'Stock transferred from the main godown to a retail branch vanishes on the way. Without atomic transfers, you cannot tell if leaks happened at the source, in transit, or at the destination.',
                solution: 'VenQore features double-entry stock transfers. Moving stock creates a transit record that deducts from the godown and pending-receipts the branch, requiring physical audit validation before posting.'
            },
            {
                title: 'No Store-Wise Profit Transparency',
                problem: 'Consolidating financial reports from multiple cash registers and locations takes weeks. You cannot tell which retail store is profitable and which is draining company cash.',
                solution: 'VenQore tags every transaction with a branch location code automatically. One click generates store-wise Profit & Loss, cash balances, sales histories, and local tax liabilities.'
            },
            {
                title: 'Data Sync Failures & Offline Downtime',
                problem: 'Traditional multi-store POS software freezes at checkout if the head-office server goes offline, bringing sales at every branch to a standstill.',
                solution: 'VenQore uses offline-first local database architecture. Cashiers at all branches continue scanning barcodes, printing receipts, and closing cash shifts. Data syncs when connection returns.'
            },
            {
                title: 'Internal Fraud & Cashier Cash Mismatches',
                problem: 'Cashiers modify past transactions, cancel sales, or apply unauthorized discounts without manager oversight, resulting in till shortages.',
                solution: 'VenQore implements strict role permissions (7 staff levels) and immutable audit logs. Cashiers cannot edit posted invoices or grant manual discounts without manager PIN overrides.'
            }
        ],

        features: [
            {
                title: 'Consolidated General Ledger & HQ dashboard',
                desc: 'Oversight from a single login. View consolidated trial balances, tax obligations, accounts receivable aging, and total company cash flows.',
                icon: 'FileText'
            },
            {
                title: 'Atomic Multi-Warehouse Transfers',
                desc: 'Transfer stock between locations with transit tracking. Inventory shifts between warehouses in one atomic transaction, preventing count errors.',
                icon: 'Truck'
            },
            {
                title: 'Store-Wise Profit & Loss Reports',
                desc: 'Evaluate location profitability. Compare net revenues, operating expenses, and inventory values across individual retail outlets.',
                icon: 'TrendingUp'
            },
            {
                title: '7 Staff Role Permission Levels',
                desc: 'Define cashier, supervisor, store manager, auditor, warehouse operator, admin, and owner roles with secure PIN access codes.',
                icon: 'Users'
            },
            {
                title: 'Cashier Shift Cash Reconciliation',
                desc: 'Enforce cashier shift lock counts. Cashiers count physical cash, log discrepancies against ledger records, and print cashier till summaries.',
                icon: 'RotateCcw'
            },
            {
                title: 'Central Product Catalog Controls',
                desc: 'Add products and variants at the HQ level and push updates to all branches automatically. Restrict local outlets from modifying prices.',
                icon: 'QrCode'
            }
        ],

        accountingImpact: {
            title: 'How Multi-Store Sales Update Your Books Automatically',
            description: 'When branch POS terminals record transactions, VenQore records the entry under the store location code, maintaining clear books:',
            entries: [
                { account: '1001 — Cash Till (Branch A Outlet)', debit: '$150.00', credit: '—', note: 'Branch A asset increases' },
                { account: '4000 — Sales Revenue (Branch A Store)', debit: '—', credit: '$150.00', note: 'Branch A income recognized' },
                { account: '5000 — Cost of Goods Sold (Branch A POS)', debit: '$98.00', credit: '—', note: 'Branch A FIFO inventory cost' },
                { account: '1101 — Inventory Value (Branch A Warehouse)', debit: '—', credit: '$98.00', note: 'Branch A stock reduced' },
            ]
        },

        faqs: [
            {
                q: 'How many branches or locations can I manage?',
                a: 'Our Growth plan supports up to 3 locations, while the Enterprise plan supports up to 10 locations. Contact our support team for custom franchise configurations past 10 outlets.'
            },
            {
                q: 'Can branch cashiers see product stock levels at other branches?',
                a: 'Yes. If permitted by manager role permissions, cashiers can search a product SKU to see stock levels across all other outlets and warehouses.'
            },
            {
                q: 'How are product prices managed across different locations?',
                a: 'You can choose to enforce standard pricing across all outlets from the HQ dashboard, or grant permissions to individual store managers to configure local pricing rules.'
            },
            {
                q: 'Is my data secure across cashier terminals?',
                a: 'Yes. Cashiers log in using unique numerical PIN passcodes. All cashier actions, including voiding items, applying discounts, and opening the cash drawer, are logged with date and operator details in the audit trail.'
            }
        ],

        compareCrossLinks: [
            { name: 'VenQore vs Square POS', href: '/compare/venqore-vs-square' },
            { name: 'VenQore vs Vyapar', href: '/compare/venqore-vs-vyapar' },
        ],
        featureCrossLinks: [
            { name: 'All 226+ Features', href: '/features' },
            { name: 'Double-Entry Accounting Engine', href: '/features/accounting' },
            { name: 'Offline-First POS', href: '/features/offline-pos' },
        ]
    }
};

export const solutionsHubList = [
    {
        slug: 'pharmacy',
        name: 'Pharmacy POS & ERP',
        badge: 'SHIPPED & LIVE',
        badgeColor: 'emerald',
        iconName: 'Pill',
        desc: 'Batch & expiry tracking, FEFO/FIFO dispatching, drug control registers, and double-entry books.',
        href: '/solutions/pharmacy'
    },
    {
        slug: 'electronics-store',
        name: 'Electronics Store POS & ERP',
        badge: 'SHIPPED & LIVE',
        badgeColor: 'indigo',
        iconName: 'Smartphone',
        desc: 'Serial & IMEI lifecycle tracking, instant warranty lookup, supplier RMA management, and trade-in tools.',
        href: '/solutions/electronics-store'
    },
    {
        slug: 'grocery',
        name: 'Grocery & Supermarket',
        badge: 'SHIPPED & LIVE',
        badgeColor: 'emerald',
        iconName: 'ShoppingCart',
        desc: 'High-speed barcode checkout, scale integration, multi-pack bundling, and bulk purchase management.',
        href: '/solutions/grocery'
    },
    {
        slug: 'wholesale',
        name: 'Wholesale & Distribution',
        badge: 'SHIPPED & LIVE',
        badgeColor: 'emerald',
        iconName: 'Truck',
        desc: 'Tiered pricing matrices, customer credit limits, salesman ordering apps, and accounts receivable aging.',
        href: '/solutions/wholesale'
    },
    {
        slug: 'clothing',
        name: 'Apparel & Fashion Boutique',
        badge: 'SHIPPED & LIVE',
        badgeColor: 'emerald',
        iconName: 'Shirt',
        desc: 'Size/color variant matrix, barcode tag printing, seasonal collection tracking, and WooCommerce sync.',
        href: '/solutions/clothing'
    },
    {
        slug: 'multi-store',
        name: 'Multi-Store Retail Chains',
        badge: 'SHIPPED & LIVE',
        badgeColor: 'emerald',
        iconName: 'Building2',
        desc: 'Centralized inventory transfers, store-wise P&L statements, consolidated trial balance, and role permissions.',
        href: '/solutions/multi-store'
    }
];

<?php

/*
|==============================================================================
| VENQORE — THE MODULE REGISTRY  ·  config/modules.php
|==============================================================================
|
| THIS FILE IS THE BRAIN.
|
| It is the ONLY place in VenQore where these seven questions are answered:
|
|   1. What can a customer switch on or off?
|   2. What is the AI allowed to promise?
|   3. What can a preset combine?
|   4. What appears in the navigation?
|   5. What does the route gate enforce?
|   6. What does the dashboard show?
|   7. What is a thing CALLED for this business?
|
| Every other file reads from it. Nothing writes to it but a human.
|
|------------------------------------------------------------------------------
| THE GOVERNING RULE — read it before every edit
|------------------------------------------------------------------------------
|
|   THIS FILE MUST DESCRIBE THE SOFTWARE THAT EXISTS,
|   NOT THE SOFTWARE YOU INTEND.
|
| An aspirational entry here becomes a lie the AI tells a paying customer.
| The customer enables it, hits a 404, and refunds. There is no recovering
| that trust with a changelog.
|
|------------------------------------------------------------------------------
| WHERE THIS FILE CAME FROM
|------------------------------------------------------------------------------
| Source of record : VENQORE_FINAL_BUILD_PLAN.md (14 Aug 2026) — 46 modules,
|                    groups A-G, the numbering below is ITS numbering.
| Validation rules : CAPABILITIES_FILE_GUIDE.md — the 8 questions, the red
|                    flags, the alias method. All folded in.
| Feature evidence : venqore_built.md / venqore_partial.md /
|                    venqore_coming_soon.md / venqore_feature_catalog.md
| Route evidence   : routes/web.php read directly on 15 Aug 2026 (NOT the stale
|                    route_list.json dated 8 Jul — that file predates the
|                    V3->Engines consolidation and its names are wrong).
| Permission keys  : config/permissions.php — 49 keys, all verified present.
| Term keys        : app/Support/Terms.php — 25 fallback keys, all verified.
| Card keys        : app/Services/Dashboard/DashboardRegistry.php — 20 keys.
|
|------------------------------------------------------------------------------
| ROUTE NAMING — the thing that will bite you if you skip this paragraph
|------------------------------------------------------------------------------
| routes/web.php has a Route::name('store.') group spanning lines 1013-1866.
| Names declared INSIDE it get the 'store.' prefix; names declared OUTSIDE it
| do NOT. Two consequences:
|
|   - 'store.pos' is an EXACT name, not a prefix. The pattern 'store.pos.*'
|     does NOT match it. Both forms are listed where that applies. Get this
|     wrong and the POS route stays reachable with the module switched off.
|   - The Restaurant routes (restaurant.dashboard, restaurant.kitchen, ...)
|     sit at line ~449, OUTSIDE the store group, so they have NO 'store.'
|     prefix. The old draft's 'store.restaurant.*' matches nothing.
|
| Every pattern below is marked with how confident we are. Run STEP 0 of the
| build plan (php artisan route:list --json > route_list_current.json) and let
| ModuleRegistryIntegrityTest resolve them for real. It will name any that fail.
|
|------------------------------------------------------------------------------
| THE FIELDS — what each one means and what happens if you get it wrong
|------------------------------------------------------------------------------
|
| id            int     The module number from the final build plan. Stable
|                       forever. Used in docs and support conversations.
| group         string  A-G. Grouping for the builder UI only. Never logic.
| label         string  What the user sees. Change freely; it is not an ID.
| description   string  One plain sentence. If you cannot write one, the module
|                       is probably two modules or none.
| requires      array   HARD dependency. ALL must be enabled. Cascade-enabled
|                       automatically, with an explanation shown to the user.
|                       Test: "with this off, does my module error or show a
|                       permanently empty screen?" Yes -> requires. Merely less
|                       useful -> enhances.
| requires_one  array   Array of SETS. At least one member of each set must be
|                       enabled. THIS IS THE RELATIONSHIP NOBODY ELSE BUILDS
|                       AND THE ONE THIS PRODUCT DEPENDS ON. Invoicing needs
|                       Products OR Services. Without it every freelancer is
|                       forced to carry a Products module they will never open.
|                       The resolver ASKS which; it never guesses.
| enhances      array   Suggested, never forced. Shown as "works well with".
| routes        array   Route-name patterns this module OWNS. The gate blocks
|                       these when the module is off. Wrong name -> the gate
|                       never fires -> a disabled module is still reachable by
|                       URL. Shared prefixes must be listed as explicit names,
|                       never as a wildcard (see #6 Invoicing for the pattern).
| pages         array   Paths under resources/js/Pages/. Existence is asserted
|                       on disk by the integrity test.
| permissions   array   Keys from config/permissions.php. A user without them
|                       does not see the module even when it is enabled.
|                       visible = enabled AND permitted.
| cards         array   Dashboard card keys from DashboardRegistry::all().
| terms         array   Terminology keys from Terms::$fallbacks that this
|                       module lets a business rename.
| nav           array   What this module contributes to the navigation. Nav is
|                       DERIVED from enabled modules, never stored in a table.
| aliases       array   6-10 words a real shopkeeper would type. This is the
|                       single highest-return field in the file and the one
|                       only you can write. Include: the plain word, the trade
|                       word, the Roman-Urdu word, a competitor's word, and the
|                       typo. Every good alias is an onboarding that lands on
|                       the right preset.
| billing       string  included | metered | addon.
|                       'included' means EVERY plan, no exceptions. 42 of the
|                       46 are included; that promise is the positioning, so
|                       changing one to 'addon' is a marketing decision, not a
|                       config edit.
| legacy_gate   string  The old plan.feature: key that currently gates these
|                       routes, or null. STEP 4 of the build plan deletes these
|                       booleans from config/plans.php. Recorded here so you can
|                       see exactly what to delete and prove nothing was missed.
| status        string  live | beta | building | planned | retired.
|                       live     -> presets and AI may use it
|                       beta     -> reachable, but NEVER in a preset, NEVER
|                                   proposed by the AI
|                       building -> being built this sprint; not shippable yet
|                       planned  -> exists only as a promise; AI must say
|                                   "not yet" (this is the demand log)
|                       retired  -> hidden from the builder, existing tenants
|                                   keep it. NEVER delete a key.
| verify        array   Honest, specific, machine-readable doubts. Each line is
|                       a thing to confirm in the browser or the route list.
|                       EMPTY THIS ARRAY AS YOU CONFIRM. A module with an empty
|                       verify[] and status 'live' is a module you can sell.
| features      array   Feature numbers from the 265-item catalog that live
|                       inside this module. This is the proof the module is
|                       real, and it is how MODULE_MAP.md is generated.
| opens         string  The business types this module makes possible. If a
|                       module opens no business type, ask why it is a module.
| owns_data     array   Tables that hold this module's rows. Used by the
|                       data-safety check: disabling a module that owns rows
|                       must HIDE, never delete, and must say so out loud.
| history_probe array   Qore tables to count when this module is first enabled.
|                       Rows found -> the "it was recording all along" screen.
|
|------------------------------------------------------------------------------
| WHAT IS *NOT* IN THIS FILE, AND WHY
|------------------------------------------------------------------------------
| - The Qore. See config/qore.php. If it is in that file it may never be here.
| - Platform surfaces (settings, profile, backups, activity log). Always on.
| - Frozen features (marketing campaigns, Smart Capture, charity). Built, live,
|   deliberately unowned for V1. See config/qore.php 'frozen_surfaces'.
| - Field-level settings ("hide the payment-terms box"). Deferred to V1.2 by
|   the build plan, PART 7. Do not let one creep in as a module.
|
|==============================================================================
*/

return [

    /*
    |==========================================================================
    | GROUP A — WHAT AM I SELLING?
    |==========================================================================
    | The foundation choices. Almost every business picks at least one of the
    | first two, and the whole Rulebook is built on top of that choice.
    |
    | This is where 'requires_one' earns its existence: everything in Group B
    | needs Products OR Services, and forcing a freelancer to carry Products
    | is exactly the failure this architecture exists to prevent.
    */

    'products' => [
        'id'           => 1,
        'group'        => 'A',
        'label'        => 'Products',
        'description'  => 'The physical things you sell, with prices and categories.',
        'requires'     => [],
        'requires_one' => [],
        'enhances'     => ['pos', 'inventory', 'purchases', 'variants', 'barcodes_labels'],
        // RESOLVED 15 Aug: there is no store.products.index. The product
        // CATALOGUE is served by InventoryController, under inventory.* names.
        // Products owns the catalogue CRUD; Inventory (#16) owns the stock
        // screens from the SAME controller. Explicit names, never a wildcard —
        // 'store.inventory.*' here would swallow every stock route.
        'routes'       => [
            'store.inventory.index',              // /inventory/list — the product list
            'store.inventory.store',
            'store.inventory.update',
            'store.inventory.destroy',
            'store.inventory.bulk-destroy',
            'store.inventory.check-dependencies',
            'store.inventory.search',
            'inventory.search',                   // unprefixed duplicate, web.php:1005
            'store.inventory.stats',
            'store.categories.*',
            'store.products.ai-descriptions.*',
            // NOT 'store.v3.products.*' — that wildcard swallows
            // store.v3.products.tiers.* and store.v3.products.uom.*, which are
            // nested under a {productId} group and belong to #12 and #24. This
            // is the shared-prefix trap; explicit names are the only cure.
            'store.v3.products.index',
            'store.v3.products.create',
            'store.v3.products.store',
            'store.v3.products.edit',
            'store.v3.products.update',
            'store.v3.products.destroy',
        ],
        'pages'        => ['Inventory/InventoryList.jsx', 'Inventory/Categories.jsx', 'V3/Products'],
        'permissions'  => ['inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete'],
        'cards'        => ['top_products'],
        'terms'        => ['product', 'category'],
        'nav'          => [['route' => 'store.inventory.index', 'term' => 'product', 'icon' => 'Package', 'order' => 20]],
        'aliases'      => ['products', 'items', 'catalogue', 'catalog', 'goods', 'stock items', 'maal', 'saman', 'sku', 'produts'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'RESOLVED, but read this before writing EnsureModule: Products and Inventory (#16) are served by the SAME controller (InventoryController). The split above is by route NAME, not by controller. Never widen either module to "store.inventory.*" — that wildcard belongs to neither and would let one module gate the other. This was the most likely gate bug in the registry and it is now closed by construction.',
            'The nav label says "Products" but the URL says /inventory/list. Harmless today. If you ever rename these routes to products.*, regenerate Ziggy and grep the React pages for route(\'store.inventory.index\') in the same commit.',
        ],
        'features'     => [26, 89, 113, 114, 250],
        'opens'        => 'Every retail, wholesale, food and manufacturing business.',
        'owns_data'    => ['products', 'categories'],
        'history_probe' => ['products'],
    ],

    'services' => [
        'id'           => 2,
        'group'        => 'A',
        'label'        => 'Services',
        'description'  => 'The work you do, billed by job, hour or contract — with no stock behind it.',
        'requires'     => [],
        'requires_one' => [],
        'enhances'     => ['invoicing', 'quotations', 'customers', 'staff_attendance', 'park_recall'],
        'routes'       => [],   // none yet — see status
        'pages'        => [],   // none yet — see status
        'permissions'  => ['sales.create', 'sales.view'],
        'cards'        => [],
        'terms'        => ['service', 'job', 'technician', 'contract'],
        'nav'          => [],   // add when the UI lands
        'aliases'      => ['services', 'jobs', 'work', 'labour', 'labor', 'repair', 'appointment', 'job card', 'consulting', 'kaam', 'mazdoori', 'servcies'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'building',
        'verify'       => [
            'STATUS IS "building" ON PURPOSE. Confirmed 15 Aug 2026: app/Engines/ServiceEngine.php, app/Models/ServiceJob.php, app/Models/ServiceContract.php, app/Console/Commands/SendServiceReminders.php and app/Mail/ServiceReminderMail.php ALL EXIST — but there is NO service controller, NO route name containing "service", and NO page directory. The engine is real; the module is not yet.',
            'BLOCKING TEST before this may go live: ServiceOnlySaleTest — a service-only sale must post revenue, post NO COGS, move NO stock, and leave the ledger balanced.',
            'Do not ship any service-shaped preset (freelancer, salon, agency, repair) until this is live and that test is green.',
            'Fill routes/pages/nav from the real build. Then set status to live.',
        ],
        'features'     => [],
        'opens'        => 'Freelancers, agencies, salons, consultants, repair shops. THE HIGHEST-VALUE MODULE IN THE PLAN — it is the difference between retail software and business software.',
        'owns_data'    => ['service_jobs', 'service_contracts'],
        'history_probe' => ['sales'],
    ],

    'customers' => [
        'id'           => 3,
        'group'        => 'A',
        'label'        => 'Customers',
        'description'  => 'A directory of who you sell to, with their history and balance.',
        'requires'     => [],
        'requires_one' => [],
        'enhances'     => ['khata_credit', 'loyalty_gift', 'recurring_invoices', 'invoicing'],
        'routes'       => [
            'store.customers.*',
            'store.parties.*',
            'store.v3.customers.*',
            'store.v3.parties.*',
            'customers.search',                   // unprefixed, web.php:1006
        ],
        'pages'        => ['Parties/PartiesList.jsx', 'Sales/Customers'],
        'permissions'  => ['sales.view'],
        'cards'        => ['customer_count', 'top_customers'],
        'terms'        => ['customer'],
        'nav'          => [['route' => 'store.customers.index', 'term' => 'customer', 'icon' => 'Users', 'order' => 25]],
        'aliases'      => ['customers', 'clients', 'buyers', 'patients', 'guests', 'members', 'parties', 'grahak', 'customer list', 'contacts', 'custmers'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'store.parties.* has 9 names and is SHARED with Khata (#32) — the ledger view lives there. Split explicit names between #3 and #32 so disabling Khata does not hide the customer directory.',
            'Confirm store.customers.index resolves; the store group shows only 1 customers.* name plus customers.search outside it.',
        ],
        'features'     => [49, 50, 51, 53, 54, 57, 70, 71, 73, 74, 75, 77, 146, 196, 257, 258],
        'opens'        => 'Anyone with repeat buyers: khata shops, salons, B2B, subscriptions.',
        'owns_data'    => ['parties', 'customer_addresses'],
        'history_probe' => ['parties', 'sales'],
    ],

    'suppliers' => [
        'id'           => 4,
        'group'        => 'A',
        'label'        => 'Suppliers',
        'description'  => 'A directory of who you buy from, with balances and statements.',
        'requires'     => [],
        'requires_one' => [],
        'enhances'     => ['purchases', 'purchase_orders', 'khata_credit', 'payments'],
        'routes'       => ['store.suppliers.*', 'store.v3.suppliers.*'],
        'pages'        => ['Suppliers/'],
        'permissions'  => ['purchases.suppliers', 'purchases.view'],
        'cards'        => [],
        'terms'        => ['supplier'],
        'nav'          => [['route' => 'store.suppliers.index', 'term' => 'supplier', 'icon' => 'Truck', 'order' => 22]],
        'aliases'      => ['suppliers', 'vendors', 'wholesaler', 'distributor', 'dealer', 'party', 'supplier list', 'sapplier', 'buy from'],
        'billing'      => 'included',
        'legacy_gate'  => 'suppliers_directory',
        'status'       => 'live',
        'verify'       => [
            'legacy_gate suppliers_directory currently gates 2 routes. STEP 4 deletes this boolean from every plan — after that, this module is free on all tiers. Confirm the gate is removed from routes/web.php too, or the module will be enabled and still 403.',
        ],
        'features'     => [72, 78, 79, 80, 87, 89, 94, 95, 99, 100],
        'opens'        => 'Anyone who buys stock: retail, grocery, wholesale, restaurants.',
        'owns_data'    => ['parties'],
        'history_probe' => ['parties', 'purchases'],
    ],

    /*
    |==========================================================================
    | GROUP B — SELLING
    |==========================================================================
    | Note what #5 does NOT require: Inventory.
    |
    | A cafe selling coffee with unlimited availability picks POS + Products and
    | never sees a stock screen — while the Qore's stock ledger records every
    | movement anyway, ready for the day they turn Inventory on. That is the
    | two-module system, and it is the case this whole architecture was
    | designed around.
    */

    'pos' => [
        'id'           => 5,
        'group'        => 'B',
        'label'        => 'POS / Counter',
        'description'  => 'Fast counter checkout with scanning, split payments and receipts.',
        'requires'     => ['products'],
        'requires_one' => [],
        'enhances'     => ['park_recall', 'barcodes_labels', 'cash_register', 'loyalty_gift', 'customers', 'inventory'],
        'routes'       => [
            'store.pos',        // EXACT name — 'store.pos.*' does NOT match it
            'store.pos.*',      // store.pos.search and friends
            'store.sales.store',
            'store.sales.lookup',
            'store.api.categories',
        ],
        'pages'        => ['Pos.jsx'],
        'permissions'  => ['pos.checkout', 'pos.open_session', 'pos.close_session', 'pos.discounts', 'pos.void_item'],
        'cards'        => ['revenue_today', 'quick_actions'],
        'terms'        => ['sale'],
        'nav'          => [['route' => 'store.pos', 'term' => 'sale', 'icon' => 'ShoppingCart', 'order' => 10]],
        // 'cash register' and 'till' deliberately NOT here — they belong to #35.
        // A shared alias makes "turn on cash register" ambiguous, and the parser
        // would resolve it to whichever module it happened to see first.
        'aliases'      => ['pos', 'point of sale', 'counter', 'checkout', 'billing counter', 'cashier', 'khata counter', 'front desk', 'billing', 'sale screen'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'DUPLICATE ROUTE — FIX THIS ONE FIRST. /pos is declared twice and BOTH resolve to the name "store.pos": web.php line 377 (in the outer store. group, NO permission middleware) and line 1073 (in the inner store. group, WITH permission:pos.checkout). Laravel keeps the last registration for name lookups but the FIRST match for dispatch — so the unprotected line 377 route is the one that actually serves /pos. Delete line 377. See PATCHES.md.',
            'store.pos is an EXACT name. The pattern store.pos.* does NOT match it. Both forms are listed above deliberately — do not "tidy" this into one line.',
            'Confirm whether store.sales.store is POS-only or shared with Invoicing (#6). If shared it must be listed in BOTH, and the gate must allow it when EITHER module is on.',
        ],
        'features'     => [9, 18, 19, 20, 23, 24, 26, 27, 28, 29, 30, 31, 42, 45, 46, 247, 251, 253],
        'opens'        => 'Retail, cafe, grocery, pharmacy, any over-the-counter trade.',
        'owns_data'    => ['sales', 'sale_items'],
        'history_probe' => ['sales'],
    ],

    'invoicing' => [
        'id'           => 6,
        'group'        => 'B',
        'label'        => 'Invoicing',
        'description'  => 'Create, send and print invoices — with or without a shop counter.',
        'requires'     => [],
        'requires_one' => [['products', 'services']],   // <-- the relationship that makes freelancers possible
        'enhances'     => ['customers', 'recurring_invoices', 'khata_credit', 'quotations', 'tax_compliance'],
        // Shared prefix: store.sales.* is used by POS, Invoicing, Sales Orders
        // and Returns. Per CAPABILITIES_FILE_GUIDE Q3, shared prefixes are
        // listed as EXPLICIT NAMES so the gate cannot block a sibling module.
        'routes'       => [
            'store.sales.index',
            'store.sales.create',
            'store.sales.invoice.create',
            'store.sales.show',
            'store.sales.edit',
            'store.sales.update',
            'store.sales.print',
            'store.sales.export',
            'store.sales.send-email',
            'store.sales.send-whatsapp',
            'store.sales.master',
            'store.sales.dashboard',
            'store.sales.destroy',
            'store.sales.bulk-destroy',
            'store.v3.sales.*',
        ],
        'pages'        => ['Sales/CreateInvoice.jsx', 'Sales/SalesHistory.jsx', 'Sales/MasterSales.jsx', 'Sales/Show.jsx'],
        'permissions'  => ['sales.create', 'sales.view', 'sales.edit'],
        'cards'        => ['sales_summary', 'revenue_trend'],
        'terms'        => ['invoice', 'sale'],
        'nav'          => [['route' => 'store.sales.index', 'term' => 'invoice', 'icon' => 'FileText', 'order' => 15]],
        'aliases'      => ['invoice', 'invoicing', 'bill', 'billing', 'sales invoice', 'tax invoice', 'receipt', 'bilty', 'challan', 'invioce', 'send bill'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'Confirm every name above resolves. store.sales.* had 24 names on 15 Aug; the ones not listed here belong to POS (#5), Sales Orders (#8), Park & Recall (#13) or Returns (#9). No sales.* name may be left unclaimed — an unclaimed name is an ungated route.',
            'A service-only invoice must post revenue with no COGS. Blocked on the Services module (#2) test.',
        ],
        'features'     => [33, 34, 35, 36, 37, 38, 39, 40, 43, 44, 45, 55, 64, 66, 72],
        'opens'        => 'Freelancers, agencies, B2B, wholesale, anyone who bills rather than rings up.',
        'owns_data'    => ['sales', 'sale_items', 'ad_hoc_lines'],
        'history_probe' => ['sales'],
    ],

    'quotations' => [
        'id'           => 7,
        'group'        => 'B',
        'label'        => 'Quotations',
        'description'  => 'Send price quotes and turn accepted ones into orders or invoices.',
        'requires'     => [],
        'requires_one' => [['products', 'services']],
        'enhances'     => ['sales_orders', 'b2b_proposals', 'customers', 'pricing_tiers'],
        'routes'       => [
            'store.v3.quotations.store',
            'store.v3.quotations.convert-to-order',
        ],
        'pages'        => [],   // none exist
        'permissions'  => ['sales.quotations'],
        'cards'        => [],
        'terms'        => ['quotation'],
        'nav'          => [],   // nothing to navigate to yet
        'aliases'      => ['quotation', 'quote', 'estimate', 'proforma', 'price quote', 'rate list', 'offer', 'quotaion', 'estimate bill'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'building',
        'verify'       => [
            'DEMOTED FROM beta TO building, 15 Aug. The full surface is exactly two routes: quotations.store (POST) and quotations.convert-to-order (POST). There is no index, no create, no show, no edit — and no page anywhere under resources/js/Pages (only Proposals/ and a Marketing/Tools/Quote.jsx lead-magnet). A customer cannot open a quotation. "beta" would imply they could; they cannot.',
            'WHAT TO BUILD: index + create + show, on V3\\QuotationController. The write path and the convert-to-sale path already exist, so this is a UI job, not an engine job — the cheapest module left on the board.',
            'KNOCK-ON 1: B2B Proposals (#11) no longer requires this. Proposals has its own complete resource surface (11 routes) and stands alone. Changed to requires_one [products|services], with quotations as enhances.',
            'KNOCK-ON 2: the freelancer preset lists quotations and is blocked_by it. It will not ship until this is live.',
            'While building: excluded from every preset and never mentioned in the AI system prompt.',
        ],
        'features'     => [62, 63],
        'opens'        => 'Contractors, wholesale, agencies, tender work.',
        'owns_data'    => ['quotations', 'quotation_items'],
        'history_probe' => ['sales'],
    ],

    'sales_orders' => [
        'id'           => 8,
        'group'        => 'B',
        'label'        => 'Sales Orders',
        'description'  => 'Take an order today, fulfil and invoice it later.',
        'requires'     => [],
        'requires_one' => [['products', 'services']],
        'enhances'     => ['quotations', 'pre_sales', 'inventory', 'customers'],
        'routes'       => [
            'store.sales-orders.*',
            'store.v3.sales-orders.*',
            'store.sales.orders.show',
            'store.sales.orders.update',
        ],
        'pages'        => ['SalesOrders/', 'Sales/Orders'],
        'permissions'  => ['sales.create', 'sales.view'],
        'cards'        => ['open_orders'],
        'terms'        => ['order'],
        'nav'          => [['route' => 'store.sales-orders.index', 'term' => 'order', 'icon' => 'ClipboardList', 'order' => 46]],
        'aliases'      => ['sales order', 'order booking', 'advance order', 'custom order', 'made to order', 'order', 'booking', 'farmaish', 'pre order'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'store.sales-orders.* had 4 names and store.v3.sales-orders.* had 3 on 15 Aug. Confirm both groups belong to this module and not to Pre-Sales (#15).',
        ],
        'features'     => [177, 186],
        'opens'        => 'Made-to-order work: wedding cakes, tailoring, custom furniture, project supply.',
        'owns_data'    => ['sales_orders', 'sales_order_items'],
        'history_probe' => ['sales'],
    ],

    'sales_returns' => [
        'id'           => 9,
        'group'        => 'B',
        'label'        => 'Sales Returns & Refunds',
        'description'  => 'Take goods back, refund money or issue credit — correctly, in the books.',
        'requires'     => [],
        'requires_one' => [['products', 'services']],
        'enhances'     => ['pos', 'loyalty_gift', 'khata_credit'],
        'routes'       => [
            'store.returns.*',
            'store.returns-history.*',
            'store.sales.return',
            'store.sales.cancel',
        ],
        'pages'        => ['Returns/'],
        'permissions'  => ['sales.returns', 'pos.refund', 'sales.void'],
        'cards'        => [],
        'terms'        => ['return'],
        'nav'          => [['route' => 'store.returns.index', 'term' => 'return', 'icon' => 'RefreshCcw', 'order' => 40]],
        'aliases'      => ['return', 'returns', 'refund', 'sales return', 'credit note', 'wapsi', 'wapas', 'give back', 'exchange', 'refunds'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'A return must produce a balanced reversal (SaleReversalService, feature #145). Assert the ledger balances after a return in the preset golden test.',
        ],
        'features'     => [65, 69, 208],
        'opens'        => 'All retail. A shop that cannot take a return is not a shop.',
        'owns_data'    => ['sale_returns', 'sale_return_items'],
        'history_probe' => ['sales'],
    ],

    'recurring_invoices' => [
        'id'           => 10,
        'group'        => 'B',
        'label'        => 'Recurring Invoices',
        'description'  => 'Bill the same customer on a schedule without touching it each month.',
        'requires'     => ['invoicing', 'customers'],
        'requires_one' => [],
        'enhances'     => ['khata_credit', 'payments'],
        'routes'       => ['store.recurring-invoices.*', 'store.invoice-reminders.*'],
        'pages'        => ['RecurringInvoices/', 'Reminders/'],
        'permissions'  => ['sales.create', 'finance.receive_payment'],
        'cards'        => [],
        'terms'        => ['invoice'],
        'nav'          => [['route' => 'store.recurring-invoices.index', 'term' => 'invoice', 'icon' => 'Repeat', 'order' => 64]],
        'aliases'      => ['recurring', 'subscription', 'retainer', 'monthly billing', 'auto invoice', 'rent', 'maheena', 'standing order', 'membership billing'],
        'billing'      => 'included',
        'legacy_gate'  => 'recurring_invoices',
        'status'       => 'live',
        'verify'       => [
            'legacy_gate recurring_invoices gates 7 routes; invoice_reminders gates 4 more. Both booleans are deleted in STEP 4. Remove the middleware from the routes in the same commit.',
            'Decide whether Payment Reminders should be its own module or stay folded in here. Folded in = one fewer toggle; the build plan does not number it separately, so it stays here.',
        ],
        'features'     => [68, 53, 257],
        'opens'        => 'Gyms, rentals, retainers, subscriptions, maintenance contracts.',
        'owns_data'    => ['recurring_invoices', 'invoice_reminders'],
        'history_probe' => ['sales'],
    ],

    'b2b_proposals' => [
        'id'           => 11,
        'group'        => 'B',
        'label'        => 'B2B Proposals',
        'description'  => 'Build detailed multi-item business proposals and convert the winners.',
        // Was 'requires' => ['quotations']. Changed 15 Aug: Proposals has its
        // own complete resource surface (11 route names, its own controller and
        // page) and does not depend on the Quotations screens at all. Leaving
        // the old dependency in place would have dragged an unbuilt module into
        // every proposal-shaped business.
        'requires'     => [],
        'requires_one' => [['products', 'services']],
        'enhances'     => ['quotations', 'pricing_tiers', 'customers'],
        'routes'       => ['store.proposals.*'],
        'pages'        => ['Proposals/ProposalsList.jsx'],
        'permissions'  => ['sales.quotations'],
        'cards'        => [],
        'terms'        => ['quotation'],
        'nav'          => [['route' => 'store.proposals.index', 'term' => 'quotation', 'icon' => 'FileSignature', 'order' => 48]],
        'aliases'      => ['proposal', 'tender', 'bid', 'b2b quote', 'rfq', 'business proposal', 'offer letter', 'tender document'],
        'billing'      => 'included',
        'legacy_gate'  => 'b2b_proposal_builder',
        'status'       => 'live',
        'verify'       => [
            'SECURITY BUG — A PAID FEATURE IS FREE RIGHT NOW. The proposals resource is registered TWICE: web.php line 1130 with plan.feature:b2b_proposal_builder, and line 1518 WITHOUT it. Laravel keeps the last registration, so the ungated one wins and every tenant on every plan can reach the B2B Proposal Builder. Delete line 1518. This is exactly the "wrong entitlement key gives away a paid feature forever" failure the capabilities guide warns about. See PATCHES.md.',
            'legacy_gate b2b_proposal_builder gates 11 route names (the audit counted 5 from an older list). All of them come off in STEP 4 anyway, since this module becomes free — but fix the duplicate FIRST, so you are deleting a gate on purpose rather than discovering it was never enforced.',
        ],
        'features'     => [61, 64, 66],
        'opens'        => 'Wholesale, agencies, tender-driven trade, project supply.',
        'owns_data'    => ['proposals', 'proposal_items'],
        'history_probe' => ['sales'],
    ],

    'pricing_tiers' => [
        'id'           => 12,
        'group'        => 'B',
        'label'        => 'Pricing Tiers & Discounts',
        'description'  => 'Different prices for different customers — wholesale, retail, staff.',
        'requires'     => [],
        'requires_one' => [['products', 'services']],
        'enhances'     => ['customers', 'pos', 'invoicing', 'b2b_proposals'],
        'routes'       => ['store.v3.products.tiers.*'],   // nested under the {productId} group
        'pages'        => ['V3/'],
        'permissions'  => ['sales.edit', 'inventory.edit'],
        'cards'        => [],
        'terms'        => [],
        'nav'          => [],   // managed inside a product, not a top-level screen
        'aliases'      => ['price tier', 'wholesale price', 'retail price', 'discount', 'rate list', 'price list', 'bulk price', 'thok rate', 'special price', 'pricing'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'RESOLVED: the real names are store.v3.products.tiers.{index,store,destroy} — nested inside a Route::prefix(\'products/{productId}\') group at web.php:1995. Price tiers are edited INSIDE a product, which is why there is no V3/Tiers page and no nav item. That is correct behaviour, not a gap.',
            'Auto-applying customer discounts (#28) may live in POS instead. Decide which module owns it.',
        ],
        'features'     => [28, 60, 63],
        'opens'        => 'Wholesalers who also sell retail — the most common Pakistani shop shape there is.',
        'owns_data'    => ['price_tiers'],
        'history_probe' => ['sales'],
    ],

    'park_recall' => [
        'id'           => 13,
        'group'        => 'B',
        'label'        => 'Hold / Park & Recall',
        'description'  => 'Hold an unfinished bill and come back to it — a table, a job, a waiting customer.',
        'requires'     => ['pos'],
        'requires_one' => [],
        'enhances'     => ['table_service', 'customers', 'services'],
        'routes'       => [
            // DECLARED TWICE. Unprefixed at web.php 1008-1011 (the gap BETWEEN
            // the two store. groups) AND store-prefixed at 1525-1528. Both sets
            // resolve, so the gate must block both or park/recall stays
            // reachable with the module off. Listing both is correct until the
            // duplicates are removed — see PATCHES.md.
            'sales.park', 'sales.parked', 'sales.parked.delete', 'sales.recall',
            'store.sales.park', 'store.sales.parked',
            'store.sales.parked.delete', 'store.sales.recall',
            'store.parked-sales.*',
        ],
        'pages'        => ['Sales/ParkedSales.jsx'],
        'permissions'  => ['pos.checkout'],
        'cards'        => [],
        'terms'        => ['occupancy', 'position'],
        'nav'          => [],   // surfaced inside POS, not as its own nav item
        'aliases'      => ['hold bill', 'park sale', 'parked', 'suspend', 'recall', 'open bill', 'running bill', 'table', 'job queue', 'pending bill', 'rok do'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'This module has no nav item of its own. That is correct (it lives inside POS), but CAPABILITIES_FILE_GUIDE flags "no nav and no cards" as a red flag. It survives the flag because it is the split that opens three business types — keep it, and keep this note so nobody merges it away.',
        ],
        'features'     => [24, 25, 27],
        'opens'        => 'THE SPLIT THAT PAYS: restaurants (tables), workshops (job queue), retail (hold bill). One built feature, three business types, honest presets for each.',
        'owns_data'    => ['parked_sales'],
        'history_probe' => ['sales'],
    ],

    'table_service' => [
        'id'           => 14,
        'group'        => 'B',
        'label'        => 'Table & Floor Service',
        'description'  => 'Floor plan, table status and kitchen tickets for dine-in service.',
        'requires'     => ['pos', 'park_recall'],
        'requires_one' => [],
        'enhances'     => ['cookbook', 'inventory', 'staff_attendance'],
        // routes/web.php has TWO separate Route::name('store.') groups: an outer
        // one spanning lines 363-548 and a second at 1013-1866. These routes are
        // in the FIRST one, so they DO carry the store. prefix.
        'routes'       => [
            'store.restaurant.dashboard',
            'store.restaurant.kitchen',
            'store.restaurant.table.status',
            'store.restaurant.order.status',
            'store.api.occupancies',          // exact
            'store.api.occupancies.occupy',
            'store.api.occupancies.release',
        ],
        'pages'        => ['Restaurant/Dashboard.jsx', 'Restaurant/Kitchen.jsx'],
        'permissions'  => ['pos.checkout'],
        'cards'        => [],
        'terms'        => ['position', 'occupancy'],
        'nav'          => [['route' => 'store.restaurant.dashboard', 'term' => 'position', 'icon' => 'Utensils', 'order' => 12]],
        'aliases'      => ['tables', 'dine in', 'restaurant', 'cafe', 'seating', 'kot', 'kitchen order ticket', 'floor plan', 'waiter', 'dhaba', 'table service'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'UPGRADED FROM THE OLD DRAFT. AI_BUILDER_MASTER_MAP marked restaurant_tables NEEDS_VALIDATION with no routes, based on the 8 Jul route list. The repository has RestaurantDashboardController.php, app/Engines/OccupancyEngine.php, 4 store.restaurant.* routes, 3 store.api.occupancies.* routes and 2 pages. This module is real.',
            'These routes carry NO permission or plan gate at all today, except occupancies.occupy/.release which check pos.checkout. Anyone authenticated on the tenant can open the kitchen screen. Decide whether that is intended before launch.',
            'Walk it end to end: seat a table, fire a kitchen ticket, settle the bill. Then clear this array.',
        ],
        'features'     => [25, 27, 43],
        'opens'        => 'Restaurants, cafes, dhabas, dine-in of any kind.',
        'owns_data'    => ['occupancies', 'restaurant_tables'],
        'history_probe' => ['sales'],
    ],

    'pre_sales' => [
        'id'           => 15,
        'group'        => 'B',
        'label'        => 'Pre-Sales Reservation',
        'description'  => 'Reserve stock against a future sale so it cannot be sold twice.',
        'requires'     => ['products', 'inventory'],
        'requires_one' => [],
        'enhances'     => ['sales_orders', 'customers'],
        'routes'       => ['store.pre-sales.*', 'store.presales.*'],
        'pages'        => ['PreSales/', 'Sales/CreatePreSale.jsx'],
        'permissions'  => ['sales.create', 'inventory.view'],
        'cards'        => [],
        'terms'        => ['order'],
        'nav'          => [['route' => 'store.pre-sales.index', 'term' => 'order', 'icon' => 'CalendarClock', 'order' => 47]],
        'aliases'      => ['reservation', 'reserve stock', 'booking', 'advance booking', 'pre order', 'block stock', 'hold stock', 'presale'],
        'billing'      => 'included',
        'legacy_gate'  => 'pre_sales_reservation',
        'status'       => 'live',
        'verify'       => [
            'legacy_gate pre_sales_reservation gates 7 routes — delete in STEP 4.',
            'store.presales.* (1 name, no hyphen) and store.pre-sales.* (7 names) both exist. Two spellings of the same thing is a bug waiting to happen — pick one and redirect the other.',
        ],
        'features'     => [67, 252, 186],
        'opens'        => 'Electronics, appliances, vehicles, anything with a deposit and a wait.',
        'owns_data'    => ['stock_reservations'],
        'history_probe' => ['stock_movements'],
    ],

    /*
    |==========================================================================
    | GROUP C — STOCK
    |==========================================================================
    | Everything here controls the VISIBILITY of stock surfaces. The FIFO stock
    | ledger underneath is Qore and runs whether or not any of this is enabled.
    |
    | That is the whole trick: a shop with Inventory off still has eight months
    | of movement history the day they turn it on. See config/qore.php §5.
    */

    'inventory' => [
        'id'           => 16,
        'group'        => 'C',
        'label'        => 'Inventory',
        'description'  => 'See and manage stock levels, movements and value.',
        'requires'     => ['products'],
        'requires_one' => [],
        'enhances'     => ['multi_location', 'stock_takes', 'batches_expiry', 'serials', 'purchases', 'cookbook'],
        // The OTHER half of InventoryController — the stock screens. See #1.
        // 'store.stock-operations' is an EXACT name (the bare index route);
        // 'store.stock-operations.*' does not match it. Both are listed, and
        // the warehouse.* children are deliberately NOT here — they belong to
        // Multi-Location (#17).
        'routes'       => [
            'store.inventory.dashboard',
            'store.inventory.stock-levels',
            'store.inventory.stock',
            'store.inventory.reservations',
            'store.inventory.history',
            'store.stock-operations',             // exact
            'store.stock-operations.adjust',
            'store.stock-operations.audit',
            'store.stock-operations.transfer',
            'store.v3.stock-adjustments.*',
        ],
        'pages'        => ['Inventory/StockLevels.jsx', 'Inventory/Dashboard.jsx', 'StockOperations.jsx'],
        'permissions'  => ['inventory.view', 'inventory.adjust', 'inventory.create', 'inventory.edit'],
        'cards'        => ['low_stock', 'inventory_value'],
        'terms'        => ['stock'],
        'nav'          => [['route' => 'store.inventory.dashboard', 'term' => 'stock', 'icon' => 'Package', 'order' => 30]],
        'aliases'      => ['inventory', 'stock', 'stock levels', 'godown', 'store room', 'materials', 'ingredients', 'maal', 'saman', 'inventry', 'stock control', 'warehouse stock'],
        'billing'      => 'included',
        'legacy_gate'  => 'stock_valuation',
        'status'       => 'live',
        'verify'       => [
            'RESOLVED: split from Products (#1) by explicit route name. store.inventory.index is the PRODUCT list and belongs to #1; the stock screens are here. Do not widen either side to a wildcard.',
            'store.inventory.stock and store.inventory.stock-levels both point at InventoryController@stockLevels (web.php lines 1274 and 1393). Two names, one method. Retire one.',
        ],
        'features'     => [42, 104, 113, 115, 118, 155, 156, 157, 172, 252],
        'opens'        => 'Every business that holds stock. NOT required by POS — that is deliberate.',
        'owns_data'    => ['stock_movements', 'inventory_batches'],
        'history_probe' => ['stock_movements', 'sale_item_batches'],
    ],

    'multi_location' => [
        'id'           => 17,
        'group'        => 'C',
        'label'        => 'Multi-Location / Warehouses',
        'description'  => 'Run more than one shop, branch, godown or storage location.',
        'requires'     => ['inventory'],
        'requires_one' => [],
        'enhances'     => ['stock_transfers', 'staff_attendance', 'reports'],
        // Route::resource('warehouses', V3\WarehouseController::class)->except(['show'])
        // at web.php line 1936, inside the store.v3. group. Resource routes
        // register no ->name() call, which is why a grep-based audit misses
        // them entirely — six real names live here.
        'routes'       => [
            'store.v3.warehouses.*',
            'store.stock-operations.warehouse.*',
            'api.warehouses',
        ],
        'pages'        => ['V3/Warehouses/Index.jsx', 'V3/Warehouses/Create.jsx', 'V3/Warehouses/Edit.jsx'],
        'permissions'  => ['admin.warehouses', 'inventory.view'],
        'cards'        => [],
        'terms'        => ['location'],
        'nav'          => [['route' => 'store.v3.warehouses.index', 'term' => 'location', 'icon' => 'Building2', 'order' => 32]],
        'aliases'      => ['branch', 'branches', 'warehouse', 'godown', 'outlet', 'multi location', 'second shop', 'yard', 'store location', 'depot'],
        'billing'      => 'included',
        'legacy_gate'  => 'multi_branch',
        'status'       => 'live',
        'verify'       => [
            'RESOLVED: store.v3.warehouses.{index,create,store,edit,update,destroy} all exist via Route::resource at web.php:1936. An earlier pass reported this namespace as missing; that was a bug in the audit script, not in your code.',
            'Warehouse creation ALSO exists at store.stock-operations.warehouse.store / .update, inside StockOperations.jsx. Two ways to create a warehouse. Decide which is canonical before launch, or a customer will create one in a screen the other does not refresh.',
            'legacy_gate multi_branch gates 4 routes — delete in STEP 4. The plan LIMIT on locations stays: it is one of the four meters.',
        ],
        'features'     => [101, 118],
        'opens'        => 'Chains, franchises, a shop plus a godown.',
        'owns_data'    => ['warehouses'],
        'history_probe' => ['stock_movements'],
    ],

    'stock_transfers' => [
        'id'           => 18,
        'group'        => 'C',
        'label'        => 'Stock Transfers',
        'description'  => 'Move stock between locations with a paper trail on both sides.',
        'requires'     => ['inventory', 'multi_location'],
        'requires_one' => [],
        'enhances'     => [],
        'routes'       => ['store.stock-transfers.*', 'store.v3.stock-transfers.*'],
        'pages'        => ['StockTransfers/'],
        'permissions'  => ['inventory.transfer'],
        'cards'        => [],
        'terms'        => ['stock', 'location'],
        'nav'          => [['route' => 'store.stock-transfers.index', 'term' => 'stock', 'icon' => 'ArrowLeftRight', 'order' => 33]],
        'aliases'      => ['transfer', 'stock transfer', 'branch transfer', 'move stock', 'godown transfer', 'shift stock', 'transfer voucher', 'inter branch'],
        'billing'      => 'included',
        'legacy_gate'  => 'multi_branch',
        'status'       => 'live',
        'verify'       => [
            'Depth check: transfers -> multi_location -> inventory -> products = depth 4. That is the plan maximum. Do not add a fifth level under this module.',
        ],
        'features'     => [102],
        'opens'        => 'Anyone with two locations and stock that moves between them.',
        'owns_data'    => ['stock_transfers', 'stock_transfer_items'],
        'history_probe' => ['stock_movements'],
    ],

    'stock_takes' => [
        'id'           => 19,
        'group'        => 'C',
        'label'        => 'Stock Takes & Audit',
        'description'  => 'Count what is physically there and reconcile it against the books.',
        'requires'     => ['inventory'],
        'requires_one' => [],
        'enhances'     => ['barcodes_labels', 'multi_location'],
        'routes'       => ['store.stock-takes.*'],
        'pages'        => ['StockTake/'],
        'permissions'  => ['inventory.adjust', 'reports.audit'],
        'cards'        => [],
        'terms'        => ['stock'],
        'nav'          => [['route' => 'store.stock-takes.index', 'term' => 'stock', 'icon' => 'ClipboardCheck', 'order' => 34]],
        'aliases'      => ['stock take', 'stocktake', 'physical count', 'stock count', 'audit stock', 'counting', 'ginti', 'stock check', 'cycle count'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'A stock take writes adjustments to the Qore stock ledger. Confirm the adjustment posts a costed movement, not just a quantity change — otherwise valuation drifts silently.',
        ],
        'features'     => [107],
        'opens'        => 'Grocery, pharmacy, hardware — anywhere shrinkage is real.',
        'owns_data'    => ['stock_takes', 'stock_take_items'],
        'history_probe' => ['stock_movements'],
    ],

    'batches_expiry' => [
        'id'           => 20,
        'group'        => 'C',
        'label'        => 'Batches & Expiry',
        'description'  => 'Track batch numbers and expiry dates, and get warned before stock dies.',
        'requires'     => ['inventory'],
        'requires_one' => [],
        'enhances'     => ['purchases', 'cookbook'],
        'routes'       => ['store.batches.*'],
        'pages'        => ['BatchTracking/'],
        'permissions'  => ['inventory.view', 'inventory.edit'],
        'cards'        => [],
        'terms'        => ['stock'],
        'nav'          => [['route' => 'store.batches.index', 'term' => 'stock', 'icon' => 'Layers', 'order' => 35]],
        'aliases'      => ['batch', 'batches', 'expiry', 'expiry date', 'lot', 'shelf life', 'best before', 'meyaad', 'lot number', 'perishable'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'Only 2 route names under store.batches.* on 15 Aug. Confirm that is a complete surface (list + detail) and not a stub.',
        ],
        'features'     => [90, 105, 106, 172, 206],
        'opens'        => 'Pharmacy, food, dairy, cosmetics, chemicals — anything with a date on it.',
        'owns_data'    => ['product_batches', 'inventory_batches'],
        'history_probe' => ['inventory_batches'],
    ],

    'serials' => [
        'id'           => 21,
        'group'        => 'C',
        'label'        => 'Serials / IMEI',
        'description'  => 'Track individual units by serial or IMEI, from intake to warranty.',
        'requires'     => ['inventory'],
        'requires_one' => [],
        'enhances'     => ['pos', 'sales_returns'],
        'routes'       => ['store.serials.*'],
        'pages'        => ['SerialTracking/'],
        'permissions'  => ['inventory.view', 'inventory.edit'],
        'cards'        => [],
        'terms'        => ['product'],
        'nav'          => [['route' => 'store.serials.index', 'term' => 'product', 'icon' => 'ScanLine', 'order' => 36]],
        'aliases'      => ['serial', 'serial number', 'imei', 'unit tracking', 'device tracking', 'warranty tracking', 'mobile imei', 'chassis number'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'Only 2 route names under store.serials.* on 15 Aug, though SerialTrackingController and ProductSerial are substantial. Confirm the full surface.',
        ],
        'features'     => [19, 116],
        'opens'        => 'Mobile shops, electronics, appliances, vehicles.',
        'owns_data'    => ['product_serials'],
        'history_probe' => ['product_serials'],
    ],

    'variants' => [
        'id'           => 22,
        'group'        => 'C',
        'label'        => 'Product Variants',
        'description'  => 'Size, colour and other variations of the same product.',
        'requires'     => ['products'],
        'requires_one' => [],
        'enhances'     => ['inventory', 'barcodes_labels'],
        'routes'       => ['store.variants.*', 'store.attributes.*', 'store.products.variants.*'],
        'pages'        => ['Inventory/Variants', 'Inventory/Attributes'],
        'permissions'  => ['inventory.create', 'inventory.edit'],
        'cards'        => [],
        'terms'        => ['product'],
        'nav'          => [],   // surfaced inside Products
        'aliases'      => ['variant', 'variants', 'size color', 'variations', 'attributes', 'options', 'sizes', 'colours', 'colors', 'nag', 'style'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'No nav item — surfaced inside Products. Correct, but confirm the Products page hides the variant UI when this module is off, or the click leads to a blocked route.',
        ],
        'features'     => [103, 104],
        'opens'        => 'Clothing, footwear, hardware, anything sold in sizes.',
        'owns_data'    => ['product_variants', 'variant_attributes'],
        'history_probe' => ['product_variants'],
    ],

    'barcodes_labels' => [
        'id'           => 23,
        'group'        => 'C',
        'label'        => 'Barcodes & Labels',
        'description'  => 'Generate and print barcode labels, price tags and shelf edges.',
        'requires'     => ['products'],
        'requires_one' => [],
        'enhances'     => ['pos', 'inventory', 'stock_takes'],
        'routes'       => ['store.labels.*'],
        'pages'        => ['Labels/'],
        'permissions'  => ['inventory.barcodes'],
        'cards'        => [],
        'terms'        => ['product'],
        'nav'          => [['route' => 'store.labels.index', 'term' => 'product', 'icon' => 'Barcode', 'order' => 37]],
        'aliases'      => ['barcode', 'barcodes', 'label', 'labels', 'price tag', 'sticker', 'qr code', 'label printing', 'shelf tag', 'barcod'],
        'billing'      => 'included',
        'legacy_gate'  => 'barcode_label_print',
        'status'       => 'live',
        'verify'       => [
            'legacy_gate barcode_label_print gates 2 routes — delete in STEP 4. Scanning at the counter (#18) is part of POS and must NOT be gated by this module; only label PRINTING lives here.',
        ],
        'features'     => [18, 47, 48, 251],
        'opens'        => 'Grocery, retail, pharmacy, warehouse.',
        'owns_data'    => [],
        'history_probe' => ['products'],
    ],

    'units_of_measure' => [
        'id'           => 24,
        'group'        => 'C',
        'label'        => 'Units of Measure',
        'description'  => 'Buy in cartons, sell in pieces — conversions handled for you.',
        'requires'     => ['products'],
        'requires_one' => [],
        'enhances'     => ['purchases', 'inventory', 'cookbook'],
        'routes'       => ['store.v3.products.uom.*'],     // nested under the {productId} group
        'pages'        => ['V3/'],
        'permissions'  => ['inventory.edit', 'admin.settings_manage'],
        'cards'        => [],
        'terms'        => [],
        'nav'          => [],   // managed inside a product, not a top-level screen
        'aliases'      => ['unit', 'units', 'uom', 'carton', 'dozen', 'kg', 'litre', 'piece', 'packing', 'bori', 'conversion', 'unit conversion'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'CAREFUL — UomService is QORE (every line converts to a base quantity through it). Only the CONFIGURATION SCREEN is this module. Disabling this must never stop conversion; it only hides the screen where units are defined. If disabling it can change a stored quantity, it is not a module.',
            'RESOLVED: the real names are store.v3.products.uom.{index,store,destroy}, nested inside the same {productId} group. Units are configured per product, which is why there is no standalone page or nav item.',
        ],
        'features'     => [117],
        'opens'        => 'Grocery, wholesale, agriculture, chemicals, anything sold by weight.',
        'owns_data'    => ['uom_conversions'],
        'history_probe' => [],
    ],

    /*
    |==========================================================================
    | GROUP D — BUYING
    |==========================================================================
    */

    'purchases' => [
        'id'           => 25,
        'group'        => 'D',
        'label'        => 'Purchases',
        'description'  => 'Record what you buy, what it cost, and what you still owe.',
        'requires'     => ['products'],
        'requires_one' => [],
        'enhances'     => ['suppliers', 'purchase_orders', 'purchase_returns', 'inventory', 'landed_cost'],
        'routes'       => ['store.purchases.*', 'store.v3.purchases.*'],
        'pages'        => ['V3/Purchases'],
        'permissions'  => ['purchases.view', 'purchases.create', 'purchases.edit', 'purchases.costs'],
        'cards'        => ['recent_purchases', 'payables'],
        'terms'        => ['purchase'],
        'nav'          => [['route' => 'store.purchases.index', 'term' => 'purchase', 'icon' => 'ShoppingBag', 'order' => 20]],
        'aliases'      => ['purchase', 'purchases', 'buying', 'procurement', 'supplier bill', 'stock in', 'kharid', 'khareed', 'goods received', 'purchse', 'inward'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'store.purchases.* (10 names) includes purchases.receive.* (4) which arguably belongs to Purchase Orders (#26). Decide and split.',
            'store.purchases.return belongs to Purchase Returns (#27) — it is listed there. Make sure it is not double-owned in a way the gate resolves differently.',
        ],
        'features'     => [83, 85, 86, 96, 98, 168],
        'opens'        => 'Every business that buys stock rather than making it.',
        'owns_data'    => ['purchases', 'purchase_items'],
        'history_probe' => ['purchases'],
    ],

    'purchase_orders' => [
        'id'           => 26,
        'group'        => 'D',
        'label'        => 'Purchase Orders',
        'description'  => 'Raise an order to a supplier and receive against it, partially or in full.',
        'requires'     => ['purchases', 'suppliers'],
        'requires_one' => [],
        'enhances'     => ['inventory', 'multi_location', 'ai_insights'],
        'routes'       => ['store.purchase-orders.*', 'store.purchases.receive.*', 'store.jit.*'],
        'pages'        => ['PurchaseOrders/'],
        'permissions'  => ['purchases.create', 'purchases.view'],
        'cards'        => [],
        'terms'        => ['order'],
        'nav'          => [['route' => 'store.purchase-orders.index', 'term' => 'order', 'icon' => 'FileInput', 'order' => 23]],
        'aliases'      => ['purchase order', 'po', 'indent', 'requisition', 'order to supplier', 'buying order', 'demand', 'order book'],
        'billing'      => 'included',
        'legacy_gate'  => 'purchase_orders',
        'status'       => 'live',
        'verify'       => [
            'legacy_gate purchase_orders gates 9 routes — the second most-gated feature in the app. Deleting it in STEP 4 touches a lot of routes; do it in one commit and run the full suite.',
            'store.jit.* (just-in-time drafts) may belong to WooCommerce/Marketplace (#45) instead. Trace it.',
        ],
        'features'     => [82, 87, 92, 123, 189, 202],
        'opens'        => 'Wholesale, distribution, anyone with lead times.',
        'owns_data'    => ['purchase_orders', 'purchase_order_items'],
        'history_probe' => ['purchases'],
    ],

    'purchase_returns' => [
        'id'           => 27,
        'group'        => 'D',
        'label'        => 'Purchase Returns / Debit Notes',
        'description'  => 'Send goods back to a supplier and adjust what you owe them.',
        'requires'     => ['purchases'],
        'requires_one' => [],
        'enhances'     => ['suppliers', 'payments'],
        'routes'       => ['store.debit-notes.*', 'store.purchases.return'],
        'pages'        => ['DebitNotes/'],
        'permissions'  => ['purchases.void', 'finance.transactions'],
        'cards'        => [],
        'terms'        => ['return'],
        'nav'          => [['route' => 'store.debit-notes.index', 'term' => 'return', 'icon' => 'FileMinus', 'order' => 24]],
        'aliases'      => ['purchase return', 'debit note', 'return to supplier', 'supplier return', 'wapsi', 'goods return', 'credit note', 'debit not'],
        'billing'      => 'included',
        'legacy_gate'  => 'purchase_returns',
        'status'       => 'live',
        'verify'       => [
            'KNOWN GAP (feature #84): print and update endpoints for debit notes are literal stubs — abort(501, "Implement debit-notes.print"). Create and view are solid. Either finish those two endpoints or hide the buttons before launch. A 501 in front of a paying customer is worse than a missing feature.',
            'legacy_gate purchase_returns (2 routes) and debit_credit_notes (5 routes) both apply here — delete both in STEP 4.',
        ],
        'features'     => [84, 91, 97, 138, 187],
        'opens'        => 'Any business with a supplier who sometimes ships the wrong thing.',
        'owns_data'    => ['debit_notes', 'debit_note_items'],
        'history_probe' => ['purchases'],
    ],

    'landed_cost' => [
        'id'           => 28,
        'group'        => 'D',
        'label'        => 'Landed Cost Allocation',
        'description'  => 'Spread freight, duty and clearing costs across the items you imported.',
        'requires'     => ['purchases'],
        'requires_one' => [],
        'enhances'     => ['inventory', 'multi_location'],
        'routes'       => [],   // none found — see verify
        'pages'        => [],   // none found — see verify
        'permissions'  => ['purchases.costs', 'purchases.edit'],
        'cards'        => [],
        'terms'        => ['purchase'],
        'nav'          => [],
        'aliases'      => ['landed cost', 'freight', 'customs', 'duty', 'clearing', 'import cost', 'shipping cost', 'cost allocation', 'landing cost'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'beta',
        'verify'       => [
            'BETA BECAUSE: feature #88 is marked implemented inside PurchaseService.php (distributing freight/customs by quantity or value), but NO dedicated route and NO page were found on 15 Aug. A module with no surface is a red flag in CAPABILITIES_FILE_GUIDE PART 5.',
            'DECIDE ONE: (a) it has a real screen -> find it, list it, promote to live; or (b) it is a field inside the purchase form -> DELETE this entry and add "landed cost" to the Purchases (#25) aliases. Option (b) drops the count to 45 and that is fine.',
            'Do not leave it as a checkbox that changes nothing visible. That is the worst of both.',
        ],
        'features'     => [88, 90],
        'opens'        => 'Importers, distributors, anyone paying duty.',
        'owns_data'    => [],
        'history_probe' => ['purchases'],
    ],

    /*
    |==========================================================================
    | GROUP E — MAKING
    |==========================================================================
    | The cafe owner's group. Products + POS + Inventory + Cookbook + Expenses
    | = 5 modules, entry tier. Under the old pricing that same person was
    | forced onto ltd_2. This is the customer the new billing model wins back.
    */

    'cookbook' => [
        'id'           => 29,
        'group'        => 'E',
        'label'        => 'Cookbook / Recipes (BOM)',
        'description'  => 'Define what your made items are composed of, and what they cost.',
        'requires'     => ['products', 'inventory'],
        'requires_one' => [],
        'enhances'     => ['production_runs', 'composite_items', 'batches_expiry', 'table_service'],
        'routes'       => ['store.cookbook.*', 'store.v3.boms.*'],
        'pages'        => ['Cookbook/RecipesList.jsx', 'Cookbook/Create.jsx'],
        'permissions'  => ['inventory.create', 'inventory.edit'],
        'cards'        => [],
        'terms'        => [],   // wants a 'composition' key — see verify
        'nav'          => [['route' => 'store.cookbook.index', 'term' => 'product', 'icon' => 'BookOpen', 'order' => 50]],
        'aliases'      => ['recipe', 'recipes', 'cookbook', 'bom', 'bill of materials', 'formula', 'ingredients', 'nuskha', 'composition', 'assembly list', 'mixture'],
        'billing'      => 'included',
        'legacy_gate'  => 'compositions',
        'status'       => 'live',
        'verify'       => [
            'TERMS GAP: app/Support/Terms.php has 25 fallback keys and NONE of them is "composition". Add it (singular Recipe / plural Recipes) before this module ships, then add it to this terms[] array. Verified missing 15 Aug.',
            'legacy_gate compositions gates 7 routes — delete in STEP 4.',
        ],
        'features'     => [109, 110, 112],
        'opens'        => 'Bakeries, cafes, restaurants, factories, workshops, pharmacies compounding.',
        'owns_data'    => ['compositions', 'composition_items'],
        'history_probe' => ['stock_movements'],
    ],

    'production_runs' => [
        'id'           => 30,
        'group'        => 'E',
        'label'        => 'Production Runs',
        'description'  => 'Run a batch: consume the ingredients, produce the finished goods.',
        'requires'     => ['cookbook'],
        'requires_one' => [],
        'enhances'     => ['multi_location', 'batches_expiry', 'staff_attendance'],
        'routes'       => ['store.production.*', 'store.manufacturing.*', 'store.v3.production-runs.*'],
        'pages'        => ['Manufacturing/', 'Inventory/Production'],
        'permissions'  => ['inventory.adjust', 'inventory.create'],
        'cards'        => ['production_output'],
        'terms'        => ['product'],
        'nav'          => [['route' => 'store.production.index', 'term' => 'product', 'icon' => 'Factory', 'order' => 51]],
        'aliases'      => ['production', 'manufacturing', 'making', 'baking', 'assembly', 'batch production', 'factory', 'banana', 'production run', 'job work'],
        'billing'      => 'included',
        'legacy_gate'  => 'production',
        'status'       => 'live',
        'verify'       => [
            'legacy_gate production gates 5 routes — delete in STEP 4.',
            'store.v3.disassembly.* exists and is currently unclaimed (see qore.php frozen_surfaces). Decide whether it belongs here.',
        ],
        'features'     => [111],
        'opens'        => 'Bakeries, food manufacturing, assembly workshops, small factories.',
        'owns_data'    => ['production_runs', 'production_logs', 'manufacturing_logs'],
        'history_probe' => ['stock_movements'],
    ],

    'composite_items' => [
        'id'           => 31,
        'group'        => 'E',
        'label'        => 'Composite / Auto-Deducting Items',
        'description'  => 'Sell a made item and have its ingredients come out of stock automatically.',
        'requires'     => ['cookbook'],
        'requires_one' => [],
        'enhances'     => ['pos', 'table_service'],
        'routes'       => ['store.manufacturing.rules'],
        'pages'        => ['Manufacturing/Rules.jsx'],
        'permissions'  => ['inventory.adjust', 'inventory.edit'],
        'cards'        => [],
        'terms'        => [],
        'nav'          => [],   // surfaced inside Cookbook
        'aliases'      => ['composite', 'auto deduct', 'combo', 'deal', 'meal', 'bundle', 'set', 'kit', 'auto manufacturing', 'auto assembly'],
        'billing'      => 'included',
        'legacy_gate'  => 'compositions',
        'status'       => 'beta',
        'verify'       => [
            'BETA BECAUSE: AutoManufacturingService.php and Manufacturing/Rules.jsx exist (feature #41 Built), but only ONE route name (store.manufacturing.*) was found and it may be shared with Production Runs (#30).',
            'DECIDE ONE: (a) real distinct surface -> name the routes, promote to live; or (b) it is a behaviour of Cookbook -> delete this entry, fold "auto deduct/combo/deal" into Cookbook aliases. Option (b) is likely correct and drops the count.',
            'THE TEST THAT MATTERS: sell a combo at POS, then assert every ingredient moved in the stock ledger and COGS is right. If that passes, the feature is real whatever we call it.',
        ],
        'features'     => [41],
        'opens'        => 'Cafes selling meals, shops selling gift bundles, workshops selling kits.',
        'owns_data'    => ['compositions'],
        'history_probe' => ['stock_movements'],
    ],

    /*
    |==========================================================================
    | GROUP F — MONEY
    |==========================================================================
    | READ THIS BEFORE TOUCHING ANYTHING IN THIS GROUP.
    |
    | Accounting the DISCIPLINE is Qore. Accounting the DEPARTMENT is #38.
    | The ledger records whether or not #38 is enabled. #38 only decides
    | whether a human ever sees a chart of accounts.
    |
    | This is what makes the freelancer real: they pick Services, Invoicing,
    | Quotations, Refunds, Expenses. Five nav items. No accounting menu. And a
    | 50,000 invoice still writes four correct ledger rows — which is exactly
    | what produces "you earned Rs. 312,000 this month, Rs. 84,000 is owed."
    | They were never forced into accounting. They were given invoicing that
    | adds up.
    */

    'khata_credit' => [
        'id'           => 32,
        'group'        => 'F',
        'label'        => 'Khata / Credit',
        'description'  => 'Let people buy now and pay later, and always know who owes what.',
        'requires'     => [],
        'requires_one' => [['customers', 'suppliers']],
        'enhances'     => ['payments', 'recurring_invoices', 'reports', 'ai_insights'],
        'routes'       => [
            'store.parties.ledger',
            'store.all-parties',
            'store.reports.party-statement',
            'store.finance',                      // exact — FinanceController@index
            'store.finance.*',                    // receivables, payables
        ],
        'pages'        => ['Parties/Ledger.jsx'],
        'permissions'  => ['finance.balances', 'finance.receive_payment'],
        'cards'        => ['receivables'],
        'terms'        => ['customer', 'supplier'],
        'nav'          => [['route' => 'store.parties.ledger', 'term' => 'customer', 'icon' => 'BookUser', 'order' => 26]],
        'aliases'      => ['khata', 'udhaar', 'udhar', 'credit', 'receivables', 'pay later', 'account sales', 'ledger', 'balance', 'baqaya', 'hisab', 'due'],
        'billing'      => 'included',
        'legacy_gate'  => 'customer_khata',
        'status'       => 'live',
        'verify'       => [
            'SHARED PREFIX: store.parties.* has 9 names split between the Customers directory (#3) and this ledger view. List explicit names in both. Getting this wrong hides a customer list when someone turns off credit.',
            'legacy_gates customer_khata (1), unified_party_ledger (3), report_party_statement (5), aged_receivables (2), aged_payables (1), customer_statements (1), supplier_statements (1) all touch this area — seven booleans, all deleted in STEP 4.',
            'requires_one [customers OR suppliers] is deliberate: a shop can run supplier khata with no customer directory at all.',
        ],
        'features'     => [49, 52, 54, 74, 77, 81, 99, 154, 173, 196],
        'opens'        => 'THE Pakistani retail shape. No global competitor understands khata; you do.',
        'owns_data'    => ['parties'],
        'history_probe' => ['journal_entries', 'sales'],
    ],

    'payments' => [
        'id'           => 33,
        'group'        => 'F',
        'label'        => 'Payments In & Out',
        'description'  => 'Receive and send money, split across accounts, allocated to the right bills.',
        'requires'     => [],
        'requires_one' => [['customers', 'suppliers']],
        'enhances'     => ['khata_credit', 'bank_accounts', 'cash_register'],
        'routes'       => [
            'store.payments.*',
            'store.payment-in', 'store.payment-in.*',
            'store.payment-out', 'store.payment-out.*',
            'store.v3.customer-payments.*',
            'store.v3.supplier-payments.*',
            'store.v3.customer-advances.*',
            'store.v3.supplier-advances.*',
        ],
        'pages'        => ['Payments/'],
        'permissions'  => ['finance.receive_payment', 'finance.send_payment', 'finance.transactions'],
        'cards'        => ['cash_position'],
        'terms'        => ['payment'],
        'nav'          => [['route' => 'store.payments.index', 'term' => 'payment', 'icon' => 'Wallet', 'order' => 27]],
        'aliases'      => ['payment', 'payments', 'receipt', 'pay', 'received', 'paid', 'vasooli', 'adaigi', 'settle', 'collection', 'advance'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'PaymentService is QORE. This module is the SCREENS. Disabling it must not stop a POS sale from settling — the sale writes payment rows through the engine either way. Prove that with a test.',
            'store.finance.* (5 unclaimed names) probably belongs here. Trace and claim it, or the gate leaves it open.',
        ],
        'features'     => [31, 50, 55, 56, 79, 93, 94, 95, 135, 136],
        'opens'        => 'Every business. Nearly always enabled — but still a module, because a cash-only counter does not need the screen.',
        'owns_data'    => ['payments', 'allocations'],
        'history_probe' => ['payments', 'journal_entries'],
    ],

    'expenses' => [
        'id'           => 34,
        'group'        => 'F',
        'label'        => 'Expenses',
        'description'  => 'Record what you spend, with receipts, by category.',
        'requires'     => [],
        'requires_one' => [],
        'enhances'     => ['accounting_workspace', 'bank_accounts', 'reports'],
        'routes'       => ['store.expenses.*', 'store.v3.expenses.*'],
        'pages'        => ['Expenses/'],
        'permissions'  => ['finance.expenses'],
        'cards'        => ['expenses'],
        'terms'        => ['expense'],
        'nav'          => [['route' => 'store.expenses.index', 'term' => 'expense', 'icon' => 'Receipt', 'order' => 60]],
        'aliases'      => ['expense', 'expenses', 'cost', 'spending', 'kharcha', 'kharch', 'bills', 'outgoings', 'overheads', 'petty cash', 'expence'],
        'billing'      => 'included',
        'legacy_gate'  => 'expense_manager',
        'status'       => 'live',
        'verify'       => [
            'legacy_gate expense_manager gates 9 routes — the third most-gated feature. Delete in STEP 4.',
            'Expenses requires NOTHING. That is deliberate: it is in both named five-module customers (cafe and freelancer). Never add a dependency here.',
        ],
        'features'     => [125, 141, 143, 163, 170],
        'opens'        => 'Literally every business. The most universally useful module in the file.',
        'owns_data'    => ['expenses'],
        'history_probe' => ['expenses', 'journal_entries'],
    ],

    'cash_register' => [
        'id'           => 35,
        'group'        => 'F',
        'label'        => 'Cash Register & Daily Audit',
        'description'  => 'Open and close the drawer, count the cash, find the difference.',
        'requires'     => ['pos'],
        'requires_one' => [],
        'enhances'     => ['bank_accounts', 'staff_attendance', 'payments'],
        'routes'       => ['store.funds.*', 'store.v3.funds.*', 'store.v3.cash-shortages.*'],
        'pages'        => ['Funds/'],
        'permissions'  => ['finance.balances', 'finance.transactions', 'pos.open_session', 'pos.close_session'],
        'cards'        => ['cash_position'],
        'terms'        => ['shift'],
        'nav'          => [['route' => 'store.funds.index', 'term' => 'payment', 'icon' => 'Coins', 'order' => 63]],
        'aliases'      => ['cash register', 'drawer', 'till', 'cash count', 'day close', 'shift close', 'cash audit', 'galla', 'cash in hand', 'shortage', 'daily closing'],
        'billing'      => 'included',
        'legacy_gate'  => 'fund_management',
        'status'       => 'live',
        'verify'       => [
            'SCOPE OVERLAP: store.funds.* (12 names) covers general cash and inter-register transfers, which is broader than "cash register". Either rename this module Funds & Cash, or split the transfer routes into Bank Accounts (#36). Do not leave the label lying about what the routes do.',
            'legacy_gate fund_management gates 5 routes — delete in STEP 4.',
            'requires POS is per the build plan. If a non-POS business needs a cash drawer, loosen this to requires_one [pos, invoicing].',
        ],
        'features'     => [32, 132, 135, 143],
        'opens'        => 'Any counter with a cash drawer and more than one person behind it.',
        'owns_data'    => ['funds', 'fund_transactions', 'cash_shortages'],
        'history_probe' => ['fund_transactions'],
    ],

    'bank_accounts' => [
        'id'           => 36,
        'group'        => 'F',
        'label'        => 'Bank Accounts',
        'description'  => 'Track bank balances and money moving between accounts.',
        'requires'     => [],
        'requires_one' => [],
        'enhances'     => ['bank_reconciliation', 'payments', 'expenses'],
        'routes'       => ['store.bank-accounts.*', 'store.v3.bank-transfers.*'],
        'pages'        => ['BankAccounts/'],
        'permissions'  => ['finance.balances'],
        'cards'        => ['cash_position'],
        'terms'        => ['payment'],
        'nav'          => [['route' => 'store.bank-accounts.index', 'term' => 'payment', 'icon' => 'Landmark', 'order' => 61]],
        'aliases'      => ['bank', 'bank account', 'accounts', 'cheque', 'check', 'transfer', 'easypaisa', 'jazzcash', 'wallet', 'bank balance'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'Confirm bank statement log (feature #171) is reachable — it appears under store.reports.bank-statement, which Reports (#42) owns. A report about a disabled module must not 500; see the Reports auto-derivation rule.',
        ],
        'features'     => [94, 171],
        'opens'        => 'Any business banking money rather than keeping it in the drawer.',
        'owns_data'    => ['bank_accounts', 'bank_transfers'],
        'history_probe' => ['journal_entries'],
    ],

    'bank_reconciliation' => [
        'id'           => 37,
        'group'        => 'F',
        'label'        => 'Bank Reconciliation',
        'description'  => 'Match your bank statement against your books, line by line.',
        'requires'     => ['bank_accounts'],
        'requires_one' => [],
        'enhances'     => ['accounting_workspace', 'reports'],
        'routes'       => ['store.bank-reconciliation.*'],
        'pages'        => ['BankReconciliation/'],
        'permissions'  => ['finance.balances', 'reports.financial'],
        'cards'        => [],
        'terms'        => ['report'],
        'nav'          => [['route' => 'store.bank-reconciliation.index', 'term' => 'report', 'icon' => 'GitCompare', 'order' => 62]],
        'aliases'      => ['reconciliation', 'reconcile', 'bank matching', 'statement matching', 'tally bank', 'bank rec', 'clearing'],
        'billing'      => 'included',
        'legacy_gate'  => 'bank_reconciliation',
        'status'       => 'live',
        'verify'       => [
            'legacy_gate bank_reconciliation gates 2 routes — delete in STEP 4.',
        ],
        'features'     => [139],
        'opens'        => 'Businesses with real bank volume; accountants.',
        'owns_data'    => ['bank_reconciliations'],
        'history_probe' => ['journal_entries'],
    ],

    'accounting_workspace' => [
        'id'           => 38,
        'group'        => 'F',
        'label'        => 'Accounting Workspace',
        'description'  => 'Chart of accounts, journals, trial balance — the accountant\'s room.',
        'requires'     => [],
        'requires_one' => [],
        'enhances'     => ['fixed_assets', 'loans', 'reports', 'bank_reconciliation'],
        'routes'       => ['store.accounting.*', 'store.v3.opening-balances.*', 'store.v3.fiscal-year.*'],
        'pages'        => ['Accounting/ChartOfAccounts.jsx', 'Accounting/Dashboard.jsx', 'Accounting/BalanceSheet.jsx', 'Accounting/ProfitLoss.jsx'],
        'permissions'  => ['finance.journal', 'reports.financial'],
        'cards'        => ['net_profit'],
        'terms'        => ['report'],
        'nav'          => [['route' => 'store.accounting.index', 'term' => 'report', 'icon' => 'BookText', 'order' => 91]],
        'aliases'      => ['accounting', 'accounts', 'chart of accounts', 'journal', 'trial balance', 'bookkeeping', 'ledger screens', 'accountant', 'hisab kitab', 'books'],
        'billing'      => 'included',
        'legacy_gate'  => 'double_entry_ledger',
        'status'       => 'live',
        'verify'       => [
            'READ CAREFULLY: the ALIASES here include "accounting" and "ledger", which are also Qore concepts. That is allowed — an alias is a word a user types, not a switchable thing. But the integrity test checks aliases against the Qore denylist to stop the AI reasoning "the user said accounting, so accounting is optional". If the test fails on this module, DO NOT delete the module — narrow the alias (e.g. "accounting screens") and keep the denylist intact.',
            'legacy_gate double_entry_ledger gates 4 routes. Deleting that boolean must NOT be read as "the ledger became optional". The ledger is Qore. Only the workspace is the module. Say so in the commit message.',
            'OFF BY DEFAULT for service and simple-retail presets. That is the concession that makes the freelancer real.',
        ],
        'features'     => [131, 137, 144, 145, 147, 148, 150, 152, 153, 146],
        'opens'        => 'Businesses with an accountant, an auditor, or a tax filing.',
        'owns_data'    => ['journal_entries', 'journal_items', 'accounts'],
        'history_probe' => ['journal_entries'],
    ],

    'tax_compliance' => [
        'id'           => 39,
        'group'        => 'F',
        'label'        => 'Tax & Compliance / E-Invoicing',
        'description'  => 'Tax summaries, rate configuration and government e-invoicing.',
        'requires'     => [],
        'requires_one' => [],
        'enhances'     => ['invoicing', 'accounting_workspace', 'reports'],
        'routes'       => ['store.e-invoicing.*', 'store.reports.tax', 'store.reports.tax-rate'],
        'pages'        => ['EInvoicing/'],
        'permissions'  => ['admin.taxes_methods', 'reports.financial'],
        'cards'        => [],
        'terms'        => ['invoice', 'report'],
        'nav'          => [['route' => 'store.e-invoicing.index', 'term' => 'invoice', 'icon' => 'BadgeCheck', 'order' => 65]],
        'aliases'      => ['tax', 'gst', 'vat', 'sales tax', 'fbr', 'e-invoicing', 'e invoice', 'compliance', 'tax return', 'ntn', 'filer', 'withholding'],
        'billing'      => 'included',
        'legacy_gate'  => 'e_invoicing',
        'status'       => 'live',
        'verify'       => [
            'TaxService is QORE — tax CALCULATION always runs. This module is the compliance REPORTS and the e-invoicing submission. Disabling it must never change a total on an invoice. Test that explicitly.',
            'legacy_gates e_invoicing (3) and auto_vat_gst (1) — delete in STEP 4.',
        ],
        'features'     => [39, 44, 63, 70, 98, 140, 158, 176, 246],
        'opens'        => 'Registered businesses, anyone filing sales tax, exporters.',
        'owns_data'    => ['tax_rates', 'einvoice_submissions'],
        'history_probe' => ['journal_entries', 'sales'],
    ],

    'fixed_assets' => [
        'id'           => 40,
        'group'        => 'F',
        'label'        => 'Fixed Assets & Depreciation',
        'description'  => 'Track what you own long-term and write it down over time.',
        'requires'     => ['accounting_workspace'],
        'requires_one' => [],
        'enhances'     => ['reports'],
        'routes'       => ['store.v3.assets.*', 'store.v3.depreciation.*', 'store.v3.disaster-claims.*'],
        'pages'        => ['V3/'],
        'permissions'  => ['finance.journal', 'reports.financial'],
        'cards'        => [],
        'terms'        => [],
        'nav'          => [['route' => 'store.v3.assets.index', 'term' => 'report', 'icon' => 'Building', 'order' => 92]],
        'aliases'      => ['assets', 'fixed assets', 'depreciation', 'equipment', 'machinery', 'vehicle', 'furniture', 'write down', 'asset register'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'Find the page paths — there is no V3/Assets or V3/Depreciation directory in resources/js/Pages. The controllers exist (feature #133 Built). Locate the pages or the nav item will 404.',
            'Disaster & Asset Claim Manager (#108) is grouped here; confirm that is the right home rather than Inventory.',
        ],
        'features'     => [108, 133],
        'opens'        => 'Anyone with machinery, vehicles or a tax depreciation schedule.',
        'owns_data'    => ['assets', 'depreciation_entries'],
        'history_probe' => ['journal_entries'],
    ],

    'loans' => [
        'id'           => 41,
        'group'        => 'F',
        'label'        => 'Loans',
        'description'  => 'Track money you borrowed and every repayment against it.',
        'requires'     => ['accounting_workspace'],
        'requires_one' => [],
        'enhances'     => ['bank_accounts', 'reports'],
        'routes'       => ['store.v3.loans.*', 'store.reports.loan-statement'],
        'pages'        => ['V3/'],
        'permissions'  => ['finance.journal', 'finance.balances'],
        'cards'        => [],
        'terms'        => [],
        'nav'          => [['route' => 'store.v3.loans.index', 'term' => 'report', 'icon' => 'HandCoins', 'order' => 93]],
        'aliases'      => ['loan', 'loans', 'borrowing', 'finance', 'installment', 'qarz', 'emi', 'repayment', 'lease', 'bank loan'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'Find the page path (no V3/Loans directory). V3/LoanController exists (feature #134 Built).',
        ],
        'features'     => [134, 166],
        'opens'        => 'Businesses financing stock or equipment.',
        'owns_data'    => ['loans', 'loan_repayments'],
        'history_probe' => ['journal_entries'],
    ],

    /*
    |==========================================================================
    | GROUP G — GROWTH & OPERATIONS
    |==========================================================================
    */

    'reports' => [
        'id'           => 42,
        'group'        => 'G',
        'label'        => 'Reports',
        'description'  => 'Every report your system can produce, and none it cannot.',
        'requires'     => [],
        'requires_one' => [],
        'enhances'     => ['ai_insights', 'accounting_workspace'],
        'routes'       => ['store.reports.*', 'store.v3.reports.*', 'store.transactions.*'],
        'pages'        => ['Reports/'],
        'permissions'  => ['reports.summary', 'reports.stock', 'reports.financial', 'reports.performance', 'reports.audit'],
        'cards'        => ['revenue_trend', 'sales_summary'],
        'terms'        => ['report'],
        'nav'          => [['route' => 'store.reports.index', 'term' => 'report', 'icon' => 'BarChart3', 'order' => 90]],
        'aliases'      => ['report', 'reports', 'reporting', 'analytics', 'summary', 'statement', 'profit and loss', 'p&l', 'balance sheet', 'sales report', 'rapot'],
        'billing'      => 'included',
        'legacy_gate'  => 'report_profit_loss',
        'status'       => 'live',
        'verify'       => [
            'THIS MODULE IS ONE TOGGLE, NOT FORTY-TWO. Which reports appear is DERIVED from the other enabled modules. No Inventory -> no stock reports. No Customers -> no customer statements. This is the single biggest simplification in the plan; do not let anyone re-expose individual report toggles.',
            'IMPLEMENTATION RULE: report visibility is computed from a report -> module map, not stored. Build that map next to ReportController and unit-test it: for every report, assert it disappears when its owning module is off AND that its route returns a friendly 404, never a 500.',
            'BIGGEST GATE JOB IN THE FILE: store.reports.* has 59 names and store.v3.reports.* has 15. Every one must be attributed to an owning module in the report map, or it leaks.',
            'legacy_gates to delete in STEP 4: report_profit_loss (12 — the most-gated key in the app), report_trial_balance (2), stock_valuation (3), point_in_time_inventory (2), discount_report (2), cash_flow_report (2), customer_insights (2), supplier_insights (2), stock_aging (1), owners_daily_pulse (1).',
        ],
        'features'     => [52, 81, 118, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187],
        'opens'        => 'Everyone. Auto-scales from a corner shop to a wholesaler.',
        'owns_data'    => [],
        'history_probe' => [],
    ],

    'ai_insights' => [
        'id'           => 43,
        'group'        => 'G',
        'label'        => 'AI Business Insights',
        'description'  => 'Plain-language insights about your own numbers, with the evidence attached.',
        'requires'     => ['reports'],
        'requires_one' => [],
        'enhances'     => ['inventory', 'customers', 'purchase_orders'],
        'routes'       => ['store.growth-engine.*', 'store.ai.*'],
        'pages'        => ['GrowthEngine/'],
        'permissions'  => ['reports.summary', 'reports.performance'],
        'cards'        => ['ai_insights', 'needs_attention'],
        'terms'        => [],
        'nav'          => [['route' => 'store.growth-engine.index', 'term' => 'report', 'icon' => 'Sparkles', 'order' => 95]],
        'aliases'      => ['ai', 'insights', 'suggestions', 'alerts', 'business intelligence', 'growth engine', 'assistant', 'advice', 'smart alerts', 'recommendations'],
        'billing'      => 'metered',
        'legacy_gate'  => 'growth_engine',
        'status'       => 'live',
        'verify'       => [
            'FIX THIS BEFORE ANYTHING ELSE IN THIS ENTRY: growth_engine is ON BY DEFAULT on ltd_2, and PlanTruthFailClosedTest is failing because of it. That is a metered AI feature given free and forever to lifetime buyers. Fix the plan matrix, get the test green, THEN finalise this module. Writing the registry first encodes the bug where nobody can see it.',
            'billing is "metered", one of only four honest exceptions. Allowance per tier: 3/10/25/50 AI builds. Wire AiSpendGuard, AiRateLimiter and AiUsageRecorder from the FIRST call, not later.',
            'Most Growth Engine insights are deterministic statistics, not model calls (feature #230, "Runs Without an AI Key"). Meter the MODEL CALLS, not the insights. Charging for arithmetic you already computed is the kind of thing customers notice.',
            'The catalog lists 38 insight types as Partial — traced to InsightCatalog.php but not to named methods. Do not market a number. Market the behaviour.',
        ],
        'features'     => [188, 189, 190, 191, 192, 193, 194, 195, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234],
        'opens'        => 'Any business with three months of history. Gets better the longer the Qore has been recording.',
        'owns_data'    => ['ai_recommendations', 'signals', 'daily_snapshots'],
        'history_probe' => ['daily_snapshots', 'sales'],
    ],

    'loyalty_gift' => [
        'id'           => 44,
        'group'        => 'G',
        'label'        => 'Loyalty & Gift Cards',
        'description'  => 'Points, store credit and gift cards that bring people back.',
        'requires'     => ['customers'],
        'requires_one' => [],
        'enhances'     => ['pos', 'sales_returns'],
        'routes'       => ['store.loyalty.*', 'store.gift-cards.*', 'store.store-credit.*'],
        'pages'        => ['Gift/'],
        'permissions'  => ['sales.create', 'sales.view'],
        'cards'        => [],
        'terms'        => ['customer'],
        'nav'          => [['route' => 'store.loyalty.index', 'term' => 'customer', 'icon' => 'Star', 'order' => 28]],
        'aliases'      => ['loyalty', 'points', 'rewards', 'gift card', 'voucher', 'store credit', 'wallet', 'membership', 'stamp card', 'cashback'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'Three route namespaces, one module. Confirm all three (loyalty 3 names, gift-cards 3, store-credit 2) really are one feature to a user. If gift cards are sold to a different buyer than loyalty points, split them — but only if that opens a business type.',
            'Store credit interacts with Returns (#9): a refund to store credit must post correctly whether or not this module is on.',
        ],
        'features'     => [58, 59, 75, 76, 258, 259],
        'opens'        => 'Salons, cafes, retail chains, anywhere repeat visits matter.',
        'owns_data'    => ['loyalty_points', 'loyalty_balances', 'gift_cards'],
        'history_probe' => ['sales', 'parties'],
    ],

    'marketplace_sync' => [
        'id'           => 45,
        'group'        => 'G',
        'label'        => 'WooCommerce / Marketplace Sync',
        'description'  => 'Keep products, stock and orders in step with your online channels.',
        'requires'     => ['products', 'inventory'],
        'requires_one' => [],
        'enhances'     => ['purchase_orders', 'customers'],
        'routes'       => [
            'store.woocommerce.*', 'store.woo.*', 'store.online-store.*',
            'store.connections.*', 'store.channels.*', 'store.vensynq.*',
            'store.sync.*', 'store.sync-tracking', 'store.sync-orders',
            'store.payouts.*', 'store.amazon.*', 'store.listing-images.*',
            'vensynq.universal.*',                // unprefixed OAuth callbacks
        ],
        'pages'        => ['WooCommerce/', 'OnlineStore/', 'VenSynQ/'],
        'permissions'  => ['vensynq.manage'],
        'cards'        => [],
        'terms'        => ['product', 'order'],
        'nav'          => [['route' => 'store.vensynq.index', 'term' => 'product', 'icon' => 'Globe', 'order' => 80]],
        'aliases'      => ['woocommerce', 'woo', 'online store', 'ecommerce', 'website', 'amazon', 'ebay', 'tiktok', 'daraz', 'marketplace', 'channel sync', 'shopify'],
        'billing'      => 'addon',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'billing is "addon" ($10 per connected account per month) — one of the four honest exceptions, because each connection costs you infrastructure. This is the ONLY module in the file a customer pays extra for on top of their tier.',
            'store.connections.* alone has 28 route names. Confirm they all belong here and none belongs to platform settings.',
            'VenSynQ has 36 green tests and is explicitly frozen for expansion (build plan PART 7). Wire it, do not extend it.',
        ],
        'features'     => [119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130],
        'opens'        => 'Shops that also sell online. The bridge between a counter and a website.',
        'owns_data'    => ['woo_sync_queue', 'marketplace_payouts', 'channels'],
        'history_probe' => ['sales', 'products'],
    ],

    'staff_attendance' => [
        'id'           => 46,
        'group'        => 'G',
        'label'        => 'Staff & Attendance',
        'description'  => 'Who works here, who is on shift, and who did what.',
        'requires'     => [],
        'requires_one' => [],
        'enhances'     => ['cash_register', 'multi_location', 'table_service'],
        'routes'       => [
            'store.staff',                        // exact — 'store.staff.*' misses it
            'store.staff.*',
            'store.attendance.*',
            'store.staff-attendance.*',
            'store.terminal-activities.*',
            'store.v3.employees.*',
            'staff.hub',
        ],
        'pages'        => ['Staff/', 'StaffAttendance/', 'Store/Staff'],
        'permissions'  => ['admin.staff_view', 'admin.staff_manage', 'users.manage'],
        'cards'        => ['active_staff'],
        'terms'        => ['staff', 'shift', 'attendance'],
        'nav'          => [['route' => 'store.staff.index', 'term' => 'staff', 'icon' => 'UserCog', 'order' => 70]],
        'aliases'      => ['staff', 'employees', 'workers', 'team', 'attendance', 'shift', 'roster', 'mulazim', 'hazri', 'cashiers', 'timesheet'],
        'billing'      => 'included',
        'legacy_gate'  => null,
        'status'       => 'live',
        'verify'       => [
            'CAREFUL: users, roles and permissions are QORE. This module is the staff DIRECTORY, shifts and attendance. Disabling it must never remove a user\'s ability to log in or change what they may do. If it can, it is not a module.',
            'store.v3.payroll.* and store.v3.employee-settlements.* exist and are frozen (qore.php frozen_surfaces). Do not quietly absorb them into this module before V1.',
            'The staff LIMIT stays a plan meter. The staff SCREEN is free. Two different things.',
        ],
        'features'     => [8, 9, 17, 185, 243, 247, 253],
        'opens'        => 'Any business with more than one person behind the counter.',
        'owns_data'    => ['staff_attendance', 'staff_invitations'],
        'history_probe' => ['users'],
    ],
];

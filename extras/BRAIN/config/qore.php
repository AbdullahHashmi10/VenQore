<?php

/*
|==============================================================================
| VENQORE — THE QORE  ·  config/qore.php
|==============================================================================
|
| WHAT THIS FILE IS
| -----------------
| This is the DENY-LIST. It names everything the Qore owns.
|
| The Qore is the engine every VenQore business runs on. It is not a module,
| it is not on the pricing page, it cannot be switched off, and a user never
| learns it exists. It records; modules only show and do.
|
| THE ONE RULE THIS FILE EXISTS TO ENFORCE
| ----------------------------------------
|   If switching it off could make a NUMBER wrong  -> QORE  (goes in this file)
|   If switching it off only removes a SCREEN      -> MODULE (goes in modules.php)
|
| Nothing named in `engines` or `denylist` below may EVER appear:
|   - as a key in config/modules.php
|   - inside any module's 'requires' / 'requires_one' / 'enhances'
|   - in any AI response
|   - as a user-facing toggle, anywhere
|
| WHY THIS IS A PHP FILE AND NOT A COMMENT IN A DOC
| -------------------------------------------------
| Because ModuleRegistryIntegrityTest loads it and fails the build if a Qore
| key leaks into the module registry. A rule a human has to remember is a rule
| that gets broken at 2am. A rule the test suite enforces is a rule.
|
| THE FAILURE THIS PREVENTS
| -------------------------
| One Qore key in modules.php means a customer (or a hallucinating AI) can
| switch off the thing that makes the numbers correct. That is silent financial
| corruption, discovered months later, unfixable without re-deriving the ledger.
| It is the single worst outcome available in this entire project.
|
| HOW TO USE IT
| -------------
|   config('qore.engines')            -> the foundation services, for docs/UI copy
|   config('qore.denylist')           -> flat array of forbidden keys (the test)
|   config('qore.always_on_routes')   -> route patterns EnsureModule must never block
|   config('qore.frozen_surfaces')    -> live routes no module owns (see notes)
|
| MAINTENANCE
| -----------
| Adding to this file is almost always right. Removing from it is almost always
| wrong. If you are about to remove a key, you are about to let someone disable
| a part of the ledger — go read THE_RULEBOOK.md §2 first.
|
| Last verified against the repository: 15 Aug 2026
|==============================================================================
*/

return [

    /*
    |--------------------------------------------------------------------------
    | 1. THE ENGINES
    |--------------------------------------------------------------------------
    | Documentation-grade record of what the Qore actually is. Every entry was
    | confirmed to exist in app/Engines/ on 15 Aug 2026.
    |
    | 'proof' is the reason it can never be a module — usually "SaleService
    | cannot be constructed without it", which is the strongest form of proof
    | there is: the code physically will not run.
    */

    'engines' => [

        'ledger' => [
            'service' => \App\Engines\AccountingService::class,
            'does'    => 'Records every movement of money as double-entry journal rows.',
            'proof'   => 'Constructor dependency of SaleService and PurchaseService. A sale posts a journal entry.',
            'user_words' => 'My numbers are always right.',
        ],

        'stock_ledger' => [
            'service' => \App\Engines\FifoService::class,
            'does'    => 'Records every movement of goods and computes FIFO cost.',
            'proof'   => 'Constructor dependency of SaleService. Every non-service sale deducts stock. Bypassed only when products.type = "service".',
            'user_words' => 'I always know what I had, and when.',
        ],

        'inventory_engine' => [
            'service' => \App\Engines\InventoryService::class,
            'does'    => 'Quantity maintenance, negative-stock guards, reservations.',
            'proof'   => 'Called by the stock ledger on every movement.',
            'user_words' => null, // invisible even in marketing
        ],

        'parties' => [
            'service' => \App\Engines\PartyService::class,
            'does'    => 'The counterparty record every transaction points at.',
            'proof'   => 'parties.type enum [customer, supplier]; ledger rows require party_id.',
            'user_words' => 'Everyone I trade with is remembered.',
            // READ THIS TWICE:
            // The parties TABLE and PartyService are Qore.
            // The Customers module (#3) and Suppliers module (#4) are the SCREENS.
            // Same domain, different layer. Never confuse them again.
        ],

        'payments' => [
            'service' => \App\Engines\PaymentService::class,
            'does'    => 'Settles money against documents; multi-account splits; allocation.',
            'proof'   => 'Constructor dependency of SaleService.',
            'user_words' => null,
        ],

        'tax' => [
            'service' => \App\Engines\TaxService::class,
            'does'    => 'Calculates line and document tax.',
            'proof'   => 'Constructor dependency; calculateLineTax() runs on every line.',
            'user_words' => 'Totals are correct without me thinking.',
        ],

        'uom' => [
            'service' => \App\Engines\UomService::class,
            'does'    => 'Converts every quantity to a base unit before it is stored.',
            'proof'   => 'Constructor dependency; toBaseQty() runs on every line.',
            'user_words' => null,
        ],

        'sequences' => [
            'service' => null, // App\Services\SequenceService — VERIFY exact namespace
            'does'    => 'Numbers every document, gap-free and per-tenant.',
            'proof'   => 'generateTransactionNumber("SAL") on every sale. Duplicate invoice numbers are a legal problem, not a UI problem.',
            'user_words' => 'My invoices are sequential and legal.',
        ],

        'sale' => [
            'service' => \App\Engines\SaleService::class,
            'does'    => 'The transaction itself.',
            'proof'   => 'An ERP without transactions is not an ERP.',
            'user_words' => null,
        ],

        'identity' => [
            'service' => null, // config/permissions.php + TenantMiddleware
            'does'    => 'Users, roles, the 49 permission keys, tenant isolation.',
            'proof'   => 'Isolation failure is a data breach, not a missing screen.',
            'user_words' => null,
        ],

        'settlement' => [
            'service' => \App\Engines\SettlementService::class,
            'does'    => 'Closes out balances between parties and accounts.',
            'proof'   => 'Referenced by the money layer; disabling changes balances.',
            'user_words' => null,
        ],

        'reversal' => [
            'service' => \App\Engines\SaleReversalService::class,
            'does'    => 'Produces a balanced reversal for any voided document.',
            'proof'   => 'A void that does not reverse the ledger corrupts the books.',
            'user_words' => null,
        ],

        'audit' => [
            'service' => \App\Engines\AuditService::class,
            'does'    => 'Immutable record of who changed what.',
            'proof'   => 'A switchable audit trail is not an audit trail.',
            'user_words' => null,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | 2. THE DENY-LIST  (the part the test actually reads)
    |--------------------------------------------------------------------------
    | Flat, lower-case, snake_case. Every plausible spelling of a Qore concept.
    |
    | ModuleRegistryIntegrityTest asserts:
    |   - no module key appears here
    |   - no 'requires' / 'requires_one' / 'enhances' target appears here
    |   - no module ALIAS appears here  <-- subtle and important: if "accounting"
    |     is an alias of the Accounting Workspace module, the AI can be talked
    |     into thinking the ledger is optional. Aliases are an attack surface.
    |
    | If you add a synonym a customer might type for a foundation concept,
    | add it here too. Over-inclusion costs nothing.
    */

    'denylist' => [
        // money
        'accounting', 'accounts', 'ledger', 'general_ledger', 'gl', 'journal',
        'journals', 'journal_entry', 'double_entry', 'double_entry_ledger',
        'bookkeeping', 'books', 'chart_of_accounts', 'coa',

        // stock truth
        'fifo', 'costing', 'cost_of_goods', 'cogs', 'stock_ledger',
        'stock_movement', 'stock_movements', 'valuation_engine',

        // records
        'products_core', 'product_model', 'parties', 'party', 'party_service',
        'customers_core', 'suppliers_core', 'contacts_core',

        // calculation
        'payments_core', 'payment_engine', 'tax_engine', 'tax_core', 'uom_core',
        'unit_conversion_core', 'sequences', 'sequence_service', 'numbering',

        // platform
        'users', 'roles', 'permissions', 'auth', 'tenancy', 'tenant',
        'multi_tenancy', 'isolation',

        // the transaction
        'sales_core', 'sale_service', 'transactions_core', 'reversal',
        'settlement', 'audit_trail',

        // the Qore itself, by any name
        'qore', 'core', 'engine', 'foundation', 'tier_zero', 'tier0',
    ],

    /*
    |--------------------------------------------------------------------------
    | 3. ALWAYS-ON ROUTES  (platform surfaces — NOT modules, NOT gated)
    |--------------------------------------------------------------------------
    | EnsureModule must let these through unconditionally. They belong to no
    | module, so a naive "block anything no enabled module owns" gate would
    | lock a customer out of their own Settings page.
    |
    | READ THIS BEFORE WRITING THE MIDDLEWARE:
    | The gate is a DENY-list on module-owned routes, not an ALLOW-list on
    | everything. Route not claimed by any module -> allowed. This array exists
    | so that intent is written down and testable, not so the gate can invert.
    |
    | Route names below were read from routes/web.php on 15 Aug 2026. Names
    | inside the Route::name('store.') group (lines 1013-1866) carry the
    | 'store.' prefix; names outside it do not.
    */

    'always_on_routes' => [
        'store.dashboard', 'store.dashboard-v1', 'store.home', 'store.overview',
        'store.next-dashboard', 'store.index',
        'store.settings.*',        // tenant settings
        'store.appearance.*',      // themes — always available
        'store.profile.*',         // owner profile
        'store.notifications.*',
        'store.activity-log.*',    // security log
        'store.backups.*',         // backups + Google Drive sync
        'store.workspace', 'store.workspace.*',   // dashboard layouts ('store.workspace' is an exact name)
        'api.dashboards.*',
        'store.admin.*',           // tenant admin (staff, taxes, receipt)
        'store.system.*', 'store.health.*', 'store.heartbeat',
        'store.onboarding.*',
        'store.plugin.*',
        'store.api.*',             // in-app API used by the shell itself
        'store.global.*',
        'store.legacy.*',          // VERIFY: 20 legacy.* names — retire or claim
        'billing.*', 'plans.*', 'redeem', 'redeem.submit',
        'auth.*', 'login', 'logout', 'password.*', 'verification.*',
        'welcome', 'home', 'marketing.*', 'tools.*', 'platform.*',
        'superadmin.*', 'admin.*',

        // ── Added 15 Aug after the route ownership audit ──────────────────
        // Every name below was UNCLAIMED by any module. An unclaimed route is
        // a decision nobody has made yet, so each one was placed deliberately:
        // these are tenant-platform and public surfaces that must stay
        // reachable no matter which modules a business has switched on.
        'store.settings',                    // exact — 'store.settings.*' misses it
        'store.appearance',                  // exact
        'store.billing', 'store.billing.*',  // subscription — NEVER gate this
        'store.backup.*', 'store.google.*',  // backups + Drive sync
        'store.setup', 'store.setup.complete',
        'store.create', 'store.create-or-join', 'store.store',
        'store.join', 'store.join.submit',
        'store.terminal-pairing.*', 'terminal-pairing.*',
        'store.v3.dashboard', 'store.v3.settings.*', 'store.v3.users.*',
        'store.v3.store.*', 'store.v3.error.*',

        // public / pre-tenant
        'account.*', 'api.*', 'csrf.*', 'dashboard', 'demo.*', 'error.*',
        'gift.*', 'google.*', 'health', 'help.*', 'hub', 'my-stores.*',
        'installer.*', 'updater.*', 'invite.*', 'known-issues.*',
        'partner-support.*', 'blog.*', 'sitemap', 'sitemap.sub',
        'privacy', 'terms', 'refund-policy', 'what-is-included',
        'welcome-splash', 'public.*', 'webhooks.*', 'barcode.generate',
        'store.trial.*',                     // trial-expired interstitial
    ],

    /*
    |--------------------------------------------------------------------------
    | 4. FROZEN SURFACES  (live routes that NO module owns — deliberately)
    |--------------------------------------------------------------------------
    | These features are built and reachable, but VENQORE_FINAL_BUILD_PLAN PART 7
    | freezes them for V1. They are listed here so that:
    |
    |   a) nobody "discovers" them later and adds a 47th module in a hurry,
    |   b) the AI never proposes them (they are not in modules.php, so step 4 of
    |      the AI pipeline drops them silently — which is the correct behaviour),
    |   c) existing tenants who already use them are NOT broken: they are in
    |      always-on territory, not blocked.
    |
    | To promote one to a module later: read THE_RULEBOOK.md §6 (Adding a
    | module). Do not just paste an entry into modules.php.
    */

    'frozen_surfaces' => [
        'store.marketing-campaigns.*' => 'Growth Engine marketing suite. Frozen: lead-gen for an unlisted product. Gate: marketing_campaigns.',
        'store.charity.*'             => 'Charity Allocation Engine (#142). Built, niche, no module in V1.',
        'store.v3.donations.*'        => 'Donations register. Same as above.',
        'smart-capture.*'             => 'Smart Capture image/audio extraction (#235). Impressive; sells zero codes. Frozen.',
        'store.smart-capture.*'       => 'Same, store-prefixed (web.php 434-445, inside the outer store. group). 11 route names.',
        'store.v3.payroll.*'          => 'Payroll. Beyond Staff & Attendance (#46) scope for V1.',
        'store.v3.employee-settlements.*' => 'Employee settlements. Same as above.',
        'store.v3.disassembly.*'      => 'Disassembly runs. Verify whether this belongs to Production Runs (#30).',
        'store.money-pipeline.*'      => 'VERIFY what this is before V1. Unclaimed route namespace.',
        'store.clearing.*'            => 'VERIFY. Unclaimed route namespace.',
        'store.digital-hub.*'         => 'VERIFY. Unclaimed route namespace (products/chats).',
        'chatbot.*'                   => 'Store chatbot. Separate from the AI Builder; not a V1 module.',
    ],

    /*
    |--------------------------------------------------------------------------
    | 5. THE MODULE-ADDED-LATER PROMISE  (why the Qore is worth the constraint)
    |--------------------------------------------------------------------------
    | Because the Qore always records, a module added later is never empty.
    | These are the Qore-owned sources the "It was recording all along" screen
    | queries when a module is switched on for the first time.
    |
    | Implementation: on enable, run the module's 'history_probe' (see
    | config/modules.php) against these tables. Rows found -> the welcome-back
    | screen. No rows -> the ordinary empty state.
    |
    | ~4 hours of work. Best-value screen in the product. Do not cut it.
    */

    'history_sources' => [
        'ledger'  => ['journal_entries', 'journal_items'],
        'stock'   => ['stock_movements', 'sale_item_batches', 'inventory_batches'],
        'parties' => ['parties'],
        'sales'   => ['sales', 'sale_items'],
        'buying'  => ['purchases', 'purchase_items'],
        'money'   => ['payments', 'allocations', 'fund_transactions'],
    ],
];

<?php
// Scenarios Probe Harness: Comprehensive reproducible verification of 14 core audit scenarios.
// Uses dedicated test database amd_pos_test, isolates mutations, records explicit evidence.

foreach (['APP_ENV'=>'testing','DB_CONNECTION'=>'mariadb','DB_DATABASE'=>'amd_pos_test','CACHE_STORE'=>'array','MAIL_MAILER'=>'array','SESSION_DRIVER'=>'array'] as $k=>$v) {
    putenv("$k=$v"); $_ENV[$k]=$v; $_SERVER[$k]=$v;
}

require __DIR__.'/../../vendor/autoload.php';

class ScenarioAuditHarness extends Tests\TestCase {
    public function bootScenarioHarness(){ parent::setUp(); }
    public function tearDownScenarioHarness(){ parent::tearDown(); }
    public function placeholder(): void {}
}

$harness = new ScenarioAuditHarness('placeholder');
$harness->bootScenarioHarness();

use Illuminate\Support\Facades\{DB, Auth, Cache, Http, Mail, Queue, Route};
use Illuminate\Support\Str;
use App\Models\{Tenant, User, TenantUser, Product, Sale, Setting};
use App\Services\{ModuleService, StoreProvisioner, PlanRepository};
use App\Services\AiBuilder\{ApplyConfigurationService, CapabilityRegistry, ConversationalBuilderService, DiscoverySession, ModuleManifest, BusinessUnderstanding};
use App\Support\{ModuleRouteMap, ReportModuleMap, ModuleNavBuilder, Terms};

if (DB::connection()->getDatabaseName() !== 'amd_pos_test') {
    throw new RuntimeException("ABORT: Connected to wrong database: " . DB::connection()->getDatabaseName());
}

DB::beginTransaction();
Http::preventStrayRequests();
Mail::fake();
Queue::fake();

$results = [];
$manifest = new ModuleManifest();
$capRegistry = new CapabilityRegistry();

$record = function(string $scenarioId, string $title, callable $callback) use (&$results) {
    try {
        $startTime = microtime(true);
        $data = $callback();
        $duration = round(microtime(true) - $startTime, 3);
        $results[$scenarioId] = [
            'scenario_id' => $scenarioId,
            'title' => $title,
            'status' => 'pass',
            'duration_sec' => $duration,
            'data' => $data,
        ];
    } catch (\Throwable $e) {
        $results[$scenarioId] = [
            'scenario_id' => $scenarioId,
            'title' => $title,
            'status' => 'error',
            'exception' => get_class($e),
            'message' => $e->getMessage(),
            'file' => $e->getFile() . ':' . $e->getLine(),
            'trace' => array_slice(explode("\n", $e->getTraceAsString()), 0, 8),
        ];
    }
};

$bindUserTenant = function(User $user, Tenant $tenant) use ($harness) {
    app()->instance('current.tenant', $tenant);
    $tu = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $user->id)->first();
    app()->instance('current.membership', $tu);
    $user->update(['last_store_id' => $tenant->id]);
    $harness->actingAs($user);
};

// Create a synthetic audit user
$ownerUser = User::factory()->create([
    'name' => 'Audit Test Owner',
    'email' => 'audit-owner-' . Str::uuid() . '@example.test',
    'email_verified_at' => now(),
]);
Auth::login($ownerUser);

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1: Freelancer (Services & invoicing; NO POS, inventory, barcodes, manufacturing)
// ─────────────────────────────────────────────────────────────────────────────
$record('scenario_01', 'Freelancer: Services & Invoicing (No POS, Inventory, Barcodes, Manufacturing)', function() use ($ownerUser, $bindUserTenant, $harness) {
    $requestedModules = ['services', 'invoicing', 'customers', 'payments', 'expenses', 'reports'];
    $tenant = app(StoreProvisioner::class)->create($ownerUser, [
        'name' => 'Audit Solo Freelancer ' . Str::random(6),
        'business_type' => 'freelancer_services',
        'modules' => $requestedModules,
        'setup_completed' => true,
    ]);
    $bindUserTenant($ownerUser, $tenant);

    $enabled = ModuleService::allEnabled($tenant);
    $slug = $tenant->slug;

    // Test route gates
    $routesTested = [
        'invoicing' => ['uri' => "/s/{$slug}/sales", 'name' => 'store.sales.index'],
        'services' => ['uri' => "/s/{$slug}/service-jobs", 'name' => 'store.service-jobs.index'],
        'pos' => ['uri' => "/s/{$slug}/pos", 'name' => 'store.pos'],
        'new_pos_mock' => ['uri' => "/s/{$slug}/new-pos", 'name' => 'store.new-pos'],
        'inventory' => ['uri' => "/s/{$slug}/inventory", 'name' => 'store.inventory.dashboard'],
        'inventory_list' => ['uri' => "/s/{$slug}/inventory/list", 'name' => 'store.inventory.index'],
        'labels' => ['uri' => "/s/{$slug}/labels", 'name' => 'store.labels.index'],
        'production' => ['uri' => "/s/{$slug}/production", 'name' => 'store.production.index'],
        'cookbook' => ['uri' => "/s/{$slug}/cookbook", 'name' => 'store.cookbook.index'],
        'tables' => ['uri' => "/s/{$slug}/tables/state", 'name' => 'store.tables.state'],
    ];

    $routeOutcomes = [];
    foreach ($routesTested as $k => $r) {
        $res = $harness->get($r['uri']);
        $routeOutcomes[$k] = [
            'uri' => $r['uri'],
            'status' => $res->status(),
            'is_gated' => $res->status() === 403 || $res->status() === 302,
        ];
    }

    // Test API gates (POS search, work-orders, sync products)
    $apiOutcomes = [
        'pos_search' => $harness->getJson('/api/pos/search')->status(),
        'work_orders' => $harness->getJson('/api/work-orders')->status(),
        'sync_inventory' => $harness->getJson('/api/sync/inventory')->status(),
    ];

    // Check dashboard cards
    $cards = DB::table('dashboard_cards')->where('tenant_id', $tenant->id)->pluck('reading_key')->all();

    return [
        'tenant_id' => $tenant->id,
        'requested_modules' => $requestedModules,
        'enabled_modules' => $enabled,
        'has_pos' => in_array('pos', $enabled),
        'has_inventory' => in_array('inventory', $enabled),
        'route_outcomes' => $routeOutcomes,
        'api_outcomes' => $apiOutcomes,
        'cards' => $cards,
        'unexpected_cards' => array_intersect($cards, ['sales.top_products', 'inventory.stock_value', 'inventory.low_stock_count']),
        'new_pos_leak' => $routeOutcomes['new_pos_mock']['status'] === 200,
        'api_pos_leak' => $apiOutcomes['pos_search'] === 200,
    ];
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2: Small shop (Products/POS; explicitly declines barcode & production)
// ─────────────────────────────────────────────────────────────────────────────
$record('scenario_02', 'Small Shop: POS & Products without Barcode Labels or Production', function() use ($ownerUser, $bindUserTenant, $harness) {
    $requestedModules = ['products', 'pos', 'inventory', 'customers', 'expenses', 'reports'];
    $tenant = app(StoreProvisioner::class)->create($ownerUser, [
        'name' => 'Audit Corner Shop ' . Str::random(6),
        'business_type' => 'retail_convenience',
        'modules' => $requestedModules,
        'setup_completed' => true,
    ]);
    $bindUserTenant($ownerUser, $tenant);
    $slug = $tenant->slug;

    $routeOutcomes = [
        'pos' => $harness->get("/s/{$slug}/pos")->status(),
        'inventory' => $harness->get("/s/{$slug}/inventory/list")->status(),
        'labels' => $harness->get("/s/{$slug}/labels")->status(),
        'production' => $harness->get("/s/{$slug}/production")->status(),
        'cookbook' => $harness->get("/s/{$slug}/cookbook")->status(),
    ];

    return [
        'tenant_id' => $tenant->id,
        'requested_modules' => $requestedModules,
        'barcodes_labels_enabled' => ModuleService::enabled($tenant, 'barcodes_labels'),
        'production_runs_enabled' => ModuleService::enabled($tenant, 'production_runs'),
        'route_outcomes' => $routeOutcomes,
        'labels_properly_blocked' => $routeOutcomes['labels'] === 403 || $routeOutcomes['labels'] === 302,
        'production_properly_blocked' => $routeOutcomes['production'] === 403 || $routeOutcomes['production'] === 302,
    ];
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3: Product Catalogue / Invoicing Business (No POS; product catalogue routes work)
// ─────────────────────────────────────────────────────────────────────────────
$record('scenario_03', 'Product Catalogue & Invoicing: No POS, but Products and Invoicing Work', function() use ($ownerUser, $bindUserTenant, $harness) {
    $requestedModules = ['products', 'invoicing', 'customers', 'expenses', 'reports'];
    $tenant = app(StoreProvisioner::class)->create($ownerUser, [
        'name' => 'Audit B2B Distributor ' . Str::random(6),
        'business_type' => 'general_trading',
        'modules' => $requestedModules,
        'setup_completed' => true,
    ]);
    $bindUserTenant($ownerUser, $tenant);
    $slug = $tenant->slug;

    // Create a test product
    $product = Product::factory()->create([
        'tenant_id' => $tenant->id,
        'name' => 'Heavy Duty Copier',
        'sku' => 'COPIER-01',
        'price' => 1200.00,
        'type' => 'standard',
    ]);

    $routeOutcomes = [
        'pos' => $harness->get("/s/{$slug}/pos")->status(),
        'sales_index' => $harness->get("/s/{$slug}/sales")->status(),
        'invoice_create' => $harness->get("/s/{$slug}/sales/invoice/create")->status(),
        'product_list' => $harness->get("/s/{$slug}/inventory/list")->status(),
    ];

    return [
        'tenant_id' => $tenant->id,
        'has_pos' => ModuleService::enabled($tenant, 'pos'),
        'has_products' => ModuleService::enabled($tenant, 'products'),
        'has_invoicing' => ModuleService::enabled($tenant, 'invoicing'),
        'product_id' => $product->id,
        'route_outcomes' => $routeOutcomes,
        'pos_blocked' => $routeOutcomes['pos'] === 403 || $routeOutcomes['pos'] === 302,
        'invoice_create_accessible' => $routeOutcomes['invoice_create'] === 200,
        'product_list_accessible' => $routeOutcomes['product_list'] === 200,
    ];
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 4: Bakery Reseller vs Bakery Maker (Production vs Reselling)
// ─────────────────────────────────────────────────────────────────────────────
$record('scenario_04', 'Bakery Reseller vs Bakery Maker: Distinguish Production/BOM Needs', function() {
    $registry = new CapabilityRegistry();
    
    // Reseller: no recipe/BOM
    $resellerModules = $registry->resolveModules(['counter_checkout'], 'bakery');
    // Maker: confirmed recipe_and_bom
    $makerModules = $registry->resolveModules(['counter_checkout', 'recipe_and_bom'], 'bakery');

    return [
        'reseller_modules' => $resellerModules,
        'maker_modules' => $makerModules,
        'reseller_has_cookbook' => in_array('cookbook', $resellerModules),
        'reseller_has_production' => in_array('production_runs', $resellerModules),
        'maker_has_cookbook' => in_array('cookbook', $makerModules),
        'maker_has_production' => in_array('production_runs', $makerModules),
    ];
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 5: Restaurant vs Takeaway-Only (Tables/KOT/Floor vs Quick Dispatch)
// ─────────────────────────────────────────────────────────────────────────────
$record('scenario_05', 'Restaurant vs Takeaway-Only: Tables and Dining Requirements', function() use ($ownerUser, $bindUserTenant, $harness) {
    $manifest = new ModuleManifest();
    $dineInModules = $manifest->withDependencies(['products', 'pos', 'table_service', 'expenses', 'reports']);
    $dineInTenant = app(StoreProvisioner::class)->create($ownerUser, [
        'name' => 'Audit Dine-in Bistro ' . Str::random(6),
        'business_type' => 'restaurant_dine_in',
        'modules' => $dineInModules,
        'setup_completed' => true,
    ]);

    $takeawayTenant = app(StoreProvisioner::class)->create($ownerUser, [
        'name' => 'Audit Takeaway Counter ' . Str::random(6),
        'business_type' => 'cafe_takeaway',
        'modules' => ['products', 'pos', 'expenses', 'reports'],
        'setup_completed' => true,
    ]);

    // Check dine-in
    $bindUserTenant($ownerUser, $dineInTenant);
    $dineInTablesStatus = $harness->get("/s/{$dineInTenant->slug}/tables/state")->status();

    // Check takeaway
    $bindUserTenant($ownerUser, $takeawayTenant);
    $takeawayTablesStatus = $harness->get("/s/{$takeawayTenant->slug}/tables/state")->status();

    return [
        'dine_in_tenant' => $dineInTenant->slug,
        'dine_in_tables_module' => ModuleService::enabled($dineInTenant, 'table_service'),
        'dine_in_tables_route_status' => $dineInTablesStatus,
        'takeaway_tenant' => $takeawayTenant->slug,
        'takeaway_tables_module' => ModuleService::enabled($takeawayTenant, 'table_service'),
        'takeaway_tables_route_status' => $takeawayTablesStatus,
        'takeaway_tables_leak' => $takeawayTablesStatus === 200,
    ];
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 6: Repair Business: Labour and Spare Parts (Mixed Products & Services)
// ─────────────────────────────────────────────────────────────────────────────
$record('scenario_06', 'Repair Business: Mixed Labour and Spare Parts (Products & Services)', function() use ($ownerUser, $bindUserTenant, $harness) {
    $repairTenant = app(StoreProvisioner::class)->create($ownerUser, [
        'name' => 'Audit Phone Fix ' . Str::random(6),
        'business_type' => 'computer_repair',
        'modules' => ['products', 'services', 'invoicing', 'inventory', 'expenses', 'reports'],
        'setup_completed' => true,
    ]);
    $bindUserTenant($ownerUser, $repairTenant);
    $slug = $repairTenant->slug;

    $servicesEnabled = ModuleService::enabled($repairTenant, 'services');
    $productsEnabled = ModuleService::enabled($repairTenant, 'products');

    $routes = [
        'service_jobs' => $harness->get("/s/{$slug}/service-jobs")->status(),
        'tools' => $harness->get("/s/{$slug}/tools")->status(),
        'inventory_list' => $harness->get("/s/{$slug}/inventory/list")->status(),
        'invoicing' => $harness->get("/s/{$slug}/sales")->status(),
    ];

    return [
        'services_enabled' => $servicesEnabled,
        'products_enabled' => $productsEnabled,
        'routes' => $routes,
        'both_active' => $servicesEnabled && $productsEnabled,
    ];
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 7: Pharmacy vs Clothing (Batches/Expiry vs Product Variants)
// ─────────────────────────────────────────────────────────────────────────────
$record('scenario_07', 'Pharmacy vs Clothing: Batches/Expiry vs Product Variants', function() {
    $registry = new CapabilityRegistry();

    // Pharmacy
    $pharmacyCaps = ['counter_checkout', 'batch_expiry_tracking'];
    $pharmacyMods = $registry->resolveModules($pharmacyCaps, 'pharmacy');

    // Clothing
    $clothingCaps = ['counter_checkout', 'product_variants'];
    $clothingMods = $registry->resolveModules($clothingCaps, 'clothing_boutique');

    return [
        'pharmacy_has_batches' => in_array('batches_expiry', $pharmacyMods),
        'pharmacy_has_variants' => in_array('variants', $pharmacyMods),
        'clothing_has_batches' => in_array('batches_expiry', $clothingMods),
        'clothing_has_variants' => in_array('variants', $clothingMods),
    ];
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 8: Wholesale Business (Suppliers, Purchasing, Khata Credit, Trade Pricing)
// ─────────────────────────────────────────────────────────────────────────────
$record('scenario_08', 'Wholesale Business: Suppliers, Purchasing, Khata Credit, Pricing Tiers', function() use ($ownerUser, $bindUserTenant, $harness) {
    $wholesaleTenant = app(StoreProvisioner::class)->create($ownerUser, [
        'name' => 'Audit Bulk Wholesaler ' . Str::random(6),
        'business_type' => 'wholesale_trade',
        'modules' => ['products', 'customers', 'suppliers', 'purchases', 'purchase_orders', 'khata_credit', 'pricing_tiers', 'expenses', 'reports'],
        'setup_completed' => true,
    ]);
    $bindUserTenant($ownerUser, $wholesaleTenant);
    $slug = $wholesaleTenant->slug;

    $routes = [
        'suppliers' => $harness->get("/s/{$slug}/suppliers")->status(),
        'purchases' => $harness->get("/s/{$slug}/purchases")->status(),
        'purchase_orders' => $harness->get("/s/{$slug}/purchase-orders")->status(),
        'customers' => $harness->get("/s/{$slug}/customers")->status(),
    ];

    return [
        'wholesale_modules' => ModuleService::allEnabled($wholesaleTenant),
        'routes' => $routes,
    ];
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 9: Reports Enabled with Inventory/Manufacturing Disabled (Direct Access)
// ─────────────────────────────────────────────────────────────────────────────
$record('scenario_09', 'Reports with Inventory/Manufacturing Disabled: Gating on Reports', function() use ($ownerUser, $bindUserTenant, $harness) {
    $tenant = app(StoreProvisioner::class)->create($ownerUser, [
        'name' => 'Audit Reports Only ' . Str::random(6),
        'modules' => ['services', 'invoicing', 'reports', 'expenses'],
        'setup_completed' => true,
    ]);
    $bindUserTenant($ownerUser, $tenant);
    $slug = $tenant->slug;

    $reportsTested = [
        'reports_overview' => ['uri' => "/s/{$slug}/reports", 'expected_owner' => null],
        'sales_report' => ['uri' => "/s/{$slug}/reports/sales", 'expected_owner' => null],
        'expenses_report' => ['uri' => "/s/{$slug}/reports/expenses", 'expected_owner' => 'expenses'],
        'inventory_valuation' => ['uri' => "/s/{$slug}/reports/inventory-valuation", 'expected_owner' => 'inventory'],
        'purchases_report' => ['uri' => "/s/{$slug}/reports/purchases", 'expected_owner' => 'purchases'],
        'tax_report' => ['uri' => "/s/{$slug}/reports/tax", 'expected_owner' => 'tax_compliance'],
        'discount_report' => ['uri' => "/s/{$slug}/reports/discount", 'expected_owner' => 'pricing_tiers'],
    ];

    $reportOutcomes = [];
    foreach ($reportsTested as $name => $spec) {
        $res = $harness->get($spec['uri']);
        $reportOutcomes[$name] = [
            'uri' => $spec['uri'],
            'status' => $res->status(),
            'owner' => $spec['expected_owner'],
            'is_blocked' => $res->status() === 403 || $res->status() === 302,
        ];
    }

    return [
        'report_outcomes' => $reportOutcomes,
        'inventory_valuation_blocked' => $reportOutcomes['inventory_valuation']['is_blocked'],
        'discount_report_blocked' => $reportOutcomes['discount_report']['is_blocked'],
    ];
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 10: Existing Tenant Disables a Used Module and Then Re-enables/Restores It
// ─────────────────────────────────────────────────────────────────────────────
$record('scenario_10', 'Module Lifecycle: Disable Used Module and Restore (Data Preservation)', function() use ($ownerUser, $bindUserTenant) {
    $tenant = app(StoreProvisioner::class)->create($ownerUser, [
        'name' => 'Audit Lifecycle ' . Str::random(6),
        'modules' => ['products', 'inventory', 'expenses', 'reports'],
        'setup_completed' => true,
    ]);
    $bindUserTenant($ownerUser, $tenant);

    // Create 5 sample products
    for ($i = 1; $i <= 5; $i++) {
        Product::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => "Lifecycle Product {$i}",
            'sku' => "LIFE-{$i}",
        ]);
    }

    $stakeBefore = ModuleService::dataAtStake($tenant, 'inventory');
    $version1 = DB::table('tenant_config_versions')->where('tenant_id', $tenant->id)->count();

    // Disable inventory
    $applier = app(ApplyConfigurationService::class);
    $resDisable = $applier->apply($tenant, [
        'modules' => ['products', 'expenses', 'reports'],
    ], 'user', 'Disabled inventory');

    $isInventoryEnabledAfterDisable = ModuleService::enabled($tenant, 'inventory');
    $productsCountInDb = Product::where('tenant_id', $tenant->id)->count();

    // Now restore version 1 (which had inventory on)
    $resRestore = $applier->restore($tenant, 1);
    $isInventoryEnabledAfterRestore = ModuleService::enabled($tenant, 'inventory');

    return [
        'data_at_stake_before' => $stakeBefore,
        'disabled_result' => $resDisable,
        'inventory_enabled_after_disable' => $isInventoryEnabledAfterDisable,
        'products_count_during_disable' => $productsCountInDb,
        'restore_result' => $resRestore,
        'inventory_enabled_after_restore' => $isInventoryEnabledAfterRestore,
        'data_preserved' => $productsCountInDb === 5,
    ];
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 11: Fresh Signup, Legacy Tenant (0 rows), and Missing Key
// ─────────────────────────────────────────────────────────────────────────────
$record('scenario_11', 'Tenant States: Fresh Signup vs Legacy (0 rows) vs Missing Key', function() use ($ownerUser) {
    // 1. Legacy tenant: zero rows in tenant_modules
    $legacyTenant = Tenant::create([
        'name' => 'Audit Legacy Zero Rows',
        'slug' => 'audit-legacy-' . Str::random(6),
        'plan' => 'solo',
        'status' => 'active',
        'currency_code' => 'USD',
        'currency_symbol' => '$',
        'timezone' => 'UTC',
    ]);
    $legacyRowCount = DB::table('tenant_modules')->where('tenant_id', $legacyTenant->id)->count();
    $legacyInventoryEnabled = ModuleService::enabled($legacyTenant, 'inventory');
    $legacyPosEnabled = ModuleService::enabled($legacyTenant, 'pos');
    $legacyUnknownEnabled = ModuleService::enabled($legacyTenant, 'totally_invented_module_key');

    // 2. Configured tenant with a missing key (e.g. key deleted or added to registry)
    $configuredTenant = app(StoreProvisioner::class)->create($ownerUser, [
        'name' => 'Audit Configured ' . Str::random(6),
        'modules' => ['products', 'expenses'],
        'setup_completed' => true,
    ]);
    // Delete one module row specifically
    DB::table('tenant_modules')->where('tenant_id', $configuredTenant->id)->where('module_key', 'invoicing')->delete();
    $missingKeyOutcome = ModuleService::enabled($configuredTenant, 'invoicing');

    return [
        'legacy_tenant_id' => $legacyTenant->id,
        'legacy_row_count' => $legacyRowCount,
        'legacy_fails_open_inventory' => $legacyInventoryEnabled,
        'legacy_fails_open_pos' => $legacyPosEnabled,
        'unknown_key_returns_true' => $legacyUnknownEnabled,
        'missing_key_on_configured_returns_true' => $missingKeyOutcome,
    ];
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 12: Multi-Tenant Isolation & Role Authorization (IDOR Checks)
// ─────────────────────────────────────────────────────────────────────────────
$record('scenario_12', 'Multi-Tenant Isolation: Cross-Tenant IDOR and Cashier Role Restrictions', function() use ($ownerUser, $harness, $bindUserTenant) {
    // Tenant A (Owner's store)
    $tenantA = app(StoreProvisioner::class)->create($ownerUser, [
        'name' => 'Store A Alpha ' . Str::random(6),
        'modules' => ['products', 'pos', 'invoicing', 'expenses'],
        'setup_completed' => true,
    ]);

    // Tenant B (Another owner's store)
    $otherUser = User::factory()->create(['email' => 'other-owner-' . Str::uuid() . '@example.test']);
    $tenantB = app(StoreProvisioner::class)->create($otherUser, [
        'name' => 'Store B Beta ' . Str::random(6),
        'modules' => ['products', 'pos', 'invoicing', 'expenses'],
        'setup_completed' => true,
    ]);

    // Create a product on Tenant B
    $productB = Product::factory()->create([
        'tenant_id' => $tenantB->id,
        'name' => 'Confidential Product B',
        'sku' => 'SECRET-B',
    ]);

    // Owner of Tenant A tries to access Product B
    $bindUserTenant($ownerUser, $tenantA);
    $crossTenantShow = $harness->get("/s/{$tenantA->slug}/inventory/{$productB->id}/stats");

    // Cashier user on Tenant A tries to access Store Settings
    $cashierUser = User::factory()->create(['email' => 'cashier-' . Str::uuid() . '@example.test']);
    TenantUser::create([
        'tenant_id' => $tenantA->id,
        'user_id' => $cashierUser->id,
        'role' => 'cashier',
        'status' => 'active',
        'display_name' => 'Cashier Joe',
        'joined_at' => now(),
    ]);
    $bindUserTenant($cashierUser, $tenantA);
    $cashierSettingsAccess = $harness->get("/s/{$tenantA->slug}/settings");

    return [
        'tenant_a' => $tenantA->slug,
        'tenant_b' => $tenantB->slug,
        'product_b_id' => $productB->id,
        'cross_tenant_access_status' => $crossTenantShow->status(),
        'cashier_settings_status' => $cashierSettingsAccess->status(),
        'cross_tenant_isolated' => $crossTenantShow->status() === 404 || $crossTenantShow->status() === 403,
        'cashier_properly_denied' => $cashierSettingsAccess->status() === 403 || $cashierSettingsAccess->status() === 302,
    ];
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 13: Discovery Session Lifecycle: Turns, Deepen, Skips, Expiry & Failures
// ─────────────────────────────────────────────────────────────────────────────
$record('scenario_13', 'Discovery Session: Turns, Skip Semantics, Deepen, Expiry and Fallback', function() {
    $service = app(ConversationalBuilderService::class);

    // 1. Start session
    $session = DiscoverySession::start('I run a boutique clothing store in Lahore', ['sells' => ['value' => 'goods']], 'clothing_boutique');
    $sessionId = $session->sessionId;

    // 2. Verify initial depth and turns
    $initialDepth = $session->depth;
    $initialMaxTurns = $session->maxTurns();

    // 3. Test skip recording
    $session->recordSkip('product_variants', 'Too specific for now');
    $hasSkipped = in_array('product_variants', $session->skipped);

    // 4. Test deepen()
    $session->deepen();
    $deepenedDepth = $session->depth;
    $deepenedMaxTurns = $session->maxTurns();

    // 5. Test expiry simulation
    Cache::forget(DiscoverySession::cacheKey($sessionId));
    $loadedExpired = DiscoverySession::load($sessionId);

    return [
        'session_id' => $sessionId,
        'initial_depth' => $initialDepth,
        'initial_max_turns' => $initialMaxTurns,
        'skip_recorded' => $hasSkipped,
        'deepened_depth' => $deepenedDepth,
        'deepened_max_turns' => $deepenedMaxTurns,
        'expired_session_returns_null' => $loadedExpired === null,
    ];
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 14: Direct Gating vs Stale Client (Disabled Module Write Attempt)
// ─────────────────────────────────────────────────────────────────────────────
$record('scenario_14', 'Direct Gating vs Stale Client: Write Attempt to Disabled Module', function() use ($ownerUser, $bindUserTenant, $harness) {
    // Tenant has products, but NOT inventory
    $tenant = app(StoreProvisioner::class)->create($ownerUser, [
        'name' => 'Audit Direct Gating ' . Str::random(6),
        'modules' => ['products', 'expenses', 'reports'],
        'setup_completed' => true,
    ]);
    $bindUserTenant($ownerUser, $tenant);
    $slug = $tenant->slug;

    // Attempt to write stock adjustment (inventory route)
    $stockAdjRes = $harness->post("/s/{$slug}/stock-adjustments", [
        'product_id' => 1,
        'type' => 'addition',
        'quantity' => 10,
    ]);

    // Attempt to access manufacturing rules
    $mfgRes = $harness->get("/s/{$slug}/api/manufacturing-rules");

    return [
        'tenant' => $slug,
        'inventory_enabled' => ModuleService::enabled($tenant, 'inventory'),
        'stock_adjustment_write_status' => $stockAdjRes->status(),
        'manufacturing_api_status' => $mfgRes->status(),
        'mfg_api_leaks_200' => $mfgRes->status() === 200,
    ];
});

DB::rollBack();

$outPath = __DIR__ . '/scenarios-results.json';
file_put_contents($outPath, json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

foreach ($results as $id => $r) {
    $dur = isset($r['duration_sec']) ? "({$r['duration_sec']}s)" : "(error)";
    echo "[$id] {$r['title']}: {$r['status']} {$dur}\n";
}

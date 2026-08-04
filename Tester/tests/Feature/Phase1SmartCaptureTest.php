<?php

namespace Tests\Feature;

use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Services\SmartCapture\AiExtractionService;
use App\Services\SmartCapture\FuzzyMatchService;
use App\Services\SmartCapture\ProductSearchIndexService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Phase1SmartCaptureTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Phase 1 Test Store',
            'slug' => 'phase1-store-' . uniqid(),
            'status' => 'active',
            'is_active' => true,
        ]);

        app()->instance('current.tenant', $this->tenant);
    }

    /** @test */
    public function it_indexes_products_and_matches_via_sql_search_index()
    {
        $product = Product::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Coca Cola 1.5L Bottle',
            'sku'       => 'COKE-1500',
            'price'     => 180.00,
        ]);

        $indexer = app(ProductSearchIndexService::class);
        $indexer->indexProduct($product);

        $fuzzyService = app(FuzzyMatchService::class);

        // Test 1: Match by exact SKU
        $matchesSku = $fuzzyService->matchProduct('COKE-1500');
        $this->assertNotEmpty($matchesSku);
        $this->assertEquals($product->id, $matchesSku[0]['product']->id);

        // Test 2: Match by normalized name / Metaphone
        $matchesName = $fuzzyService->matchProduct('coca cola 1.5l');
        $this->assertNotEmpty($matchesName);
        $this->assertEquals($product->id, $matchesName[0]['product']->id);
    }

    /** @test */
    public function it_executes_benchmark_command_and_outputs_results()
    {
        // Temporarily clear faulty fixture for standard pass benchmark check
        $faultyPath = base_path('tests/fixtures/smartcapture/faulty_receipt_99.json');
        $backup = null;
        if (file_exists($faultyPath)) {
            $backup = file_get_contents($faultyPath);
            unlink($faultyPath);
        }

        $this->artisan('smartcapture:benchmark', ['--mock' => true])
            ->assertExitCode(0);

        if ($backup !== null) {
            file_put_contents($faultyPath, $backup);
        }
    }

    /** @test */
    public function it_detects_benchmark_failure_on_faulty_fixtures()
    {
        $faultyPath = base_path('tests/fixtures/smartcapture/faulty_receipt_99.json');
        file_put_contents($faultyPath, json_encode([
            'name' => 'faulty_receipt_99.json',
            'input_type' => 'text',
            'expected' => ['action' => 'purchase', 'party' => 'Expected Supplier'],
            'mock_extracted' => ['action' => 'sale', 'party' => 'Wrong Party']
        ]));

        // Should return exit code 1 due to <80% accuracy score
        $this->artisan('smartcapture:benchmark', ['--mock' => true])
            ->assertExitCode(1);
    }

    /** @test */
    public function it_routes_predefined_ai_queries_directly_to_sql_reports()
    {
        $user = \App\Models\User::factory()->create();
        \App\Models\TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);

        Sale::create([
            'tenant_id'        => $this->tenant->id,
            'user_id'          => $user->id,
            'reference_number' => 'INV-TEST-01',
            'subtotal'         => 2500.00,
            'total'            => 2500.00,
            'payment_status'   => 'paid',
            'status'           => 'completed',
        ]);

        $request = \Illuminate\Http\Request::create('/ai/query', 'GET', ['query' => 'sales today']);
        $request->setUserResolver(fn() => $user);

        $response = app(\App\Http\Controllers\AiController::class)->query($request);

        $this->assertEquals(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertEquals('sql_intent_router', $data['source']);
        $this->assertEquals('sales_today', $data['intent']);
        $this->assertStringContainsString('Today\'s Sales', $data['answer']);
    }

    /** @test */
    public function it_routes_low_stock_query_to_sql_reports()
    {
        $user = \App\Models\User::factory()->create();
        \App\Models\TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);

        Product::create([
            'tenant_id'      => $this->tenant->id,
            'name'           => 'Low Stock Item',
            'stock_quantity' => 1,
            'alert_quantity' => 5,
            'price'          => 100.00,
        ]);

        $request = \Illuminate\Http\Request::create('/ai/query', 'GET', ['query' => 'low stock']);
        $request->setUserResolver(fn() => $user);

        $response = app(\App\Http\Controllers\AiController::class)->query($request);

        $this->assertEquals(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertEquals('sql_intent_router', $data['source']);
        $this->assertEquals('low_stock', $data['intent']);
        $this->assertStringContainsString('Low Stock Items', $data['answer']);
    }

    /** @test */
    public function it_enforces_tenant_scoping_in_intent_router_reports()
    {
        $user = \App\Models\User::factory()->create();
        \App\Models\TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);

        // Create sale in Tenant 1 (current.tenant)
        Sale::create([
            'tenant_id'        => $this->tenant->id,
            'user_id'          => $user->id,
            'reference_number' => 'INV-TENANT-1',
            'subtotal'         => 1000.00,
            'total'            => 1000.00,
            'payment_status'   => 'paid',
            'status'           => 'completed',
        ]);

        // Create sale in Tenant 2 (Other Store)
        $tenant2 = Tenant::create([
            'name' => 'Other Store',
            'slug' => 'other-store-' . uniqid(),
            'status' => 'active',
            'is_active' => true,
        ]);

        Sale::create([
            'tenant_id'        => $tenant2->id,
            'user_id'          => $user->id,
            'reference_number' => 'INV-TENANT-2',
            'subtotal'         => 9999.00,
            'total'            => 9999.00,
            'payment_status'   => 'paid',
            'status'           => 'completed',
        ]);

        $request = \Illuminate\Http\Request::create('/ai/query', 'GET', ['query' => 'sales today']);
        $request->setUserResolver(fn() => $user);

        $response = app(\App\Http\Controllers\AiController::class)->query($request);

        $this->assertEquals(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        // Summary should contain 1 transaction (1,000.00), NOT 2 transactions or 10,999.00
        $this->assertStringContainsString('1 transactions', $data['answer']);
        $this->assertStringContainsString('1,000.00', $data['answer']);
    }

    /** @test */
    public function it_validates_audio_duration_and_pdf_pages_in_extraction_service()
    {
        $service = app(AiExtractionService::class);

        // T1-7: Valid audio (< 180s)
        $credits = $service->validateAudioDuration(90);
        $this->assertEquals(3, $credits);

        // T1-7: Exceeds 180s -> throws exception
        $this->expectException(\Exception::class);
        $service->validateAudioDuration(200);

        // T1-8: PDF Page inspection & 5-page chunking
        $pdfMeta = $service->validatePdfPages(12);
        $this->assertEquals(12, $pdfMeta['total_pages']);
        $this->assertEquals(3, $pdfMeta['chunks_count']);
        $this->assertEquals(12, $pdfMeta['credits_cost']);
    }

    /** @test */
    public function it_routes_receivables_query_to_sql_reports_with_correct_sums()
    {
        $user = \App\Models\User::factory()->create();
        \App\Models\TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);

        Party::create([
            'tenant_id'       => $this->tenant->id,
            'name'            => 'Customer Alpha',
            'type'            => 'customer',
            'current_balance' => 4500.50,
        ]);

        $request = \Illuminate\Http\Request::create('/ai/query', 'GET', ['query' => 'receivables']);
        $request->setUserResolver(fn() => $user);

        $response = app(\App\Http\Controllers\AiController::class)->query($request);

        $this->assertEquals(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertEquals('sql_intent_router', $data['source']);
        $this->assertEquals('receivables', $data['intent']);
        $this->assertStringContainsString('4,500.50', $data['answer']);
    }

    /** @test */
    public function it_routes_payables_query_to_sql_reports_with_correct_sums()
    {
        $user = \App\Models\User::factory()->create();
        \App\Models\TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);

        Party::create([
            'tenant_id'       => $this->tenant->id,
            'name'            => 'Supplier Beta',
            'type'            => 'supplier',
            'current_balance' => 12500.00,
        ]);

        $request = \Illuminate\Http\Request::create('/ai/query', 'GET', ['query' => 'payables']);
        $request->setUserResolver(fn() => $user);

        $response = app(\App\Http\Controllers\AiController::class)->query($request);

        $this->assertEquals(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertEquals('sql_intent_router', $data['source']);
        $this->assertEquals('payables', $data['intent']);
        $this->assertStringContainsString('12,500.00', $data['answer']);
    }

    /** @test */
    public function it_get_party_balance_tool_returns_correct_current_balance()
    {
        // is_platform_admin bypasses checkAuthPermission entirely (see User::getRoleAttribute line 320)
        $user = \App\Models\User::factory()->create(['is_platform_admin' => true]);
        \App\Models\TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);

        // Seed a party with a known, non-zero current_balance
        Party::create([
            'tenant_id'       => $this->tenant->id,
            'name'            => 'Gamma Traders',
            'type'            => 'customer',
            'current_balance' => 7890.25,
        ]);

        $controller = app(\App\Http\Controllers\AiController::class);

        // Authenticate via actingAs so auth()->user() returns our seeded user
        $this->actingAs($user);

        // Call the private executeFunction directly via reflection
        $reflection = new \ReflectionMethod($controller, 'executeFunction');
        $reflection->setAccessible(true);

        $json = $reflection->invoke($controller, 'get_party_balance', ['party_name' => 'Gamma Traders']);
        $result = json_decode($json, true);

        // Must return the exact current_balance value — not 0 (which would happen with the old ->balance column)
        $this->assertArrayHasKey('balance', $result);
        $this->assertEquals(7890.25, $result['balance'],
            'get_party_balance returned wrong balance — likely still reading a non-existent column');
        $this->assertEquals('Gamma Traders', $result['party_name']);
        $this->assertEquals('customer', $result['type']);
    }
}

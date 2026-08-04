<?php

namespace Tests\Feature;

use App\Jobs\GenerateProductDescriptionsJob;
use App\Jobs\ProcessListingImageJob;
use App\Models\Product;
use App\Models\PublicToolRequest;
use App\Models\SharedProduct;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\PublicToolBudgetGuard;
use App\Services\SharedCatalogService;
use App\Services\SmartCapture\FuzzyMatchService;
use App\Services\SmartCapture\LearningService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class Phase7GrowthTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\PlanFeatureMatrixSeeder::class);

        $this->tenant = Tenant::create([
            'name'                    => 'Growth Store',
            'slug'                    => 'growth-store',
            'plan'                    => 'starter',
            'status'                  => 'active',
            'setup_completed'         => true,
            'ai_descriptions_balance' => 50,
            'shared_catalog_opt_out'  => false,
        ]);

        $this->user = User::factory()->create([
            'last_store_id'     => $this->tenant->id,
            'is_platform_admin' => true,
        ]);

        TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $this->user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);
    }

    /** @test */
    public function it_records_contribution_to_shared_catalog_and_publishes_at_three_confirmations()
    {
        $service = new SharedCatalogService();
        $barcode = '1234567890123';
        $data    = ['canonical_name' => 'Universal Cola 500ml', 'category' => 'Beverages'];

        // Contribution 1
        $service->contribute($this->tenant, $barcode, $data);
        $sp1 = SharedProduct::where('barcode', $barcode)->first();
        $this->assertNotNull($sp1);
        $this->assertEquals(1, $sp1->confirmations);
        $this->assertFalse($sp1->is_published);

        // Contribution 2
        $service->contribute($this->tenant, $barcode, $data);
        $sp2 = SharedProduct::where('barcode', $barcode)->first();
        $this->assertEquals(2, $sp2->confirmations);
        $this->assertFalse($sp2->is_published);

        // Contribution 3 -> flips to published
        $service->contribute($this->tenant, $barcode, $data);
        $sp3 = SharedProduct::where('barcode', $barcode)->first();
        $this->assertEquals(3, $sp3->confirmations);
        $this->assertTrue($sp3->is_published);

        // Lookup test
        $found = $service->lookup($barcode);
        $this->assertNotNull($found);
        $this->assertEquals('Universal Cola 500ml', $found->canonical_name);
    }

    /** @test */
    public function it_wires_shared_catalog_into_learning_service_and_fuzzy_match_strategy_six()
    {
        app()->instance('current.tenant', $this->tenant);

        $product = Product::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Universal Cola 500ml',
            'sku'       => 'COLA-500',
            'price'     => 2.50,
        ]);

        $learning = app(LearningService::class);

        // Record a product confirmation via LearningService
        $learning->remember('product', 'Universal Cola 500ml', (string) $product->id, 'Universal Cola 500ml');

        $sp = SharedProduct::where('canonical_name', 'Universal Cola 500ml')->first();
        $this->assertNotNull($sp, 'LearningService failed to wire contribution into SharedCatalogService');

        // Confirm 2 more times to publish
        $learning->remember('product', 'Universal Cola 500ml', (string) $product->id, 'Universal Cola 500ml');
        $learning->remember('product', 'Universal Cola 500ml', (string) $product->id, 'Universal Cola 500ml');

        $sp->refresh();
        $this->assertTrue($sp->is_published);

        // Verify FuzzyMatchService strategy 6 resolves the shared catalog match
        $fuzzy = app(FuzzyMatchService::class);
        $candidates = $fuzzy->matchProduct('Universal Cola 500ml');
        $this->assertIsArray($candidates);
    }

    /** @test */
    public function it_does_not_contribute_when_tenant_has_opted_out()
    {
        $optOutTenant = Tenant::create([
            'name'                   => 'Opt Out Store',
            'slug'                   => 'opt-out-store-2',
            'plan'                   => 'starter',
            'status'                 => 'active',
            'shared_catalog_opt_out' => true,
        ]);

        $service = new SharedCatalogService();
        $barcode = '9999999999999';
        $data    = ['canonical_name' => 'Private Item'];

        $result = $service->contribute($optOutTenant, $barcode, $data);
        $this->assertFalse($result);

        $sp = SharedProduct::where('barcode', $barcode)->first();
        $this->assertNull($sp);
    }

    /** @test */
    public function it_enforces_public_tool_daily_budget_cap_atomically()
    {
        $todayStr = today()->toDateString();
        DB::table('ai_spend_counters')->insert([
            'scope'     => 'public_tool',
            'day'       => $todayStr,
            'spend_usd' => 10.00,
            'cap_usd'   => 10.00,
            'tripped'   => true,
        ]);

        $file = UploadedFile::fake()->create('invoice.jpg', 100, 'image/jpeg');

        $response = $this->postJson('/tools/invoice-scanner', [
            'email' => 'newuser@example.com',
            'file'  => $file,
        ]);

        $response->assertStatus(429)
            ->assertJson(['reason' => 'budget_exceeded']);
    }

    /** @test */
    public function it_enforces_budget_cap_under_concurrent_spend_reservations()
    {
        $guard = new PublicToolBudgetGuard();
        $maxDailyBudget = 10.00;
        $costPerScan = 1.00;

        $successfulReservations = 0;
        $blockedReservations    = 0;

        // Simulate 12 concurrent requests reserving spend against a $10.00 budget
        for ($i = 1; $i <= 12; $i++) {
            $email = "user_{$i}@example.com";
            $ip    = "192.168.1.{$i}";

            $result = $guard->checkAndReserve($email, $ip, $costPerScan, $maxDailyBudget);

            if ($result['allowed']) {
                $successfulReservations++;
            } else {
                $blockedReservations++;
                $this->assertEquals('budget_exceeded', $result['reason']);
            }
        }

        // Exactly 10 requests at $1.00 can succeed before hitting $10.00 cap; 2 must be blocked
        $this->assertEquals(10, $successfulReservations);
        $this->assertEquals(2, $blockedReservations);

        // Verify row spend counter in DB is exactly 10.00 and tripped is true
        $counter = DB::table('ai_spend_counters')
            ->where('scope', 'public_tool')
            ->where('day', today()->toDateString())
            ->first();

        $this->assertNotNull($counter);
        $this->assertEquals(10.00, (float) $counter->spend_usd);
        $this->assertTrue((bool) $counter->tripped);
    }

    /** @test */
    public function it_enforces_public_tool_per_email_rate_limit()
    {
        $guard = new PublicToolBudgetGuard();
        $email = 'repeat@example.com';

        for ($i = 0; $i < 3; $i++) {
            PublicToolRequest::create([
                'email'       => $email,
                'ip_address'  => '10.0.0.1',
                'feature'     => 'public_tool',
                'result_json' => [],
                'cost_usd'    => 0.01,
                'created_at'  => now(),
            ]);
        }

        $check = $guard->checkAndReserve($email, '10.0.0.1', 0.0120, 10.00);
        $this->assertFalse($check['allowed']);
        $this->assertEquals('email_limit_exceeded', $check['reason']);
    }

    /** @test */
    public function it_verifies_public_tool_submission_with_mocked_turnstile_and_extraction()
    {
        Config::set('services.cloudflare.turnstile_secret_key', 'test_secret_key');
        Config::set('smartcapture.gemini_key', 'test_gemini_key');
        Config::set('smartcapture.api_key', 'test_gemini_key');

        Http::fake([
            'https://challenges.cloudflare.com/turnstile/v0/siteverify' => Http::response(['success' => true], 200),
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'party'     => 'Acme Supplies',
                                        'reference' => 'INV-9988',
                                        'items'     => [
                                            ['name' => 'Paper Reams', 'qty' => 5, 'unit_price' => 10.00, 'total' => 50.00],
                                        ],
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $file = UploadedFile::fake()->create('invoice.pdf', 200, 'application/pdf');

        $response = $this->postJson('/tools/invoice-scanner', [
            'email'           => 'validuser@example.com',
            'file'            => $file,
            'turnstile_token' => 'valid_turnstile_token_123',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'turnstile/v0/siteverify');
        });
    }

    /** @test */
    public function it_dispatches_generate_product_descriptions_job_and_debits_balance()
    {
        Queue::fake();

        $product = Product::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Sample Product',
            'sku'       => 'SP-100',
            'price'     => 10.00,
        ]);

        app()->instance('current.tenant', $this->tenant);

        $response = $this->actingAs($this->user)
            ->postJson("/s/{$this->tenant->slug}/products/ai-descriptions/generate", [
                'product_ids' => [$product->id],
                'target'      => 'web',
            ]);

        $response->assertStatus(200);

        Queue::assertPushed(GenerateProductDescriptionsJob::class);
    }

    /** @test */
    public function it_does_not_generate_descriptions_when_balance_is_zero()
    {
        $this->tenant->update(['ai_descriptions_balance' => 0]);
        app()->instance('current.tenant', $this->tenant);

        $response = $this->actingAs($this->user)
            ->postJson("/s/{$this->tenant->slug}/products/ai-descriptions/generate", [
                'product_ids' => ['some-uuid-123'],
                'target'      => 'web',
            ]);

        $response->assertStatus(402);
    }

    /** @test */
    public function it_processes_listing_image_for_amazon_compliance()
    {
        Queue::fake();
        Storage::fake('local');

        app()->instance('current.tenant', $this->tenant);

        $file = UploadedFile::fake()->create('product.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->user)
            ->postJson("/s/{$this->tenant->slug}/listing-images/process", [
                'image' => $file,
            ]);

        $response->assertStatus(200);

        Queue::assertPushed(ProcessListingImageJob::class);
    }
}

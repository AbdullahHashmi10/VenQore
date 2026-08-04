<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Models\TenantUser;
use App\Services\SmartCapture\AiEntitlementService;
use App\Jobs\ProcessSmartCaptureJob;
use App\Jobs\ResetAiUsageJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class Phase2MeteringTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name'            => 'Phase 2 Test Store',
            'slug'            => 'phase2-store-' . uniqid(),
            'plan'            => 'starter',
            'status'          => 'active',
            'is_active'       => true,
            'setup_completed' => true,
            'ai_status'       => 'managed',
            'ai_pages_limit'  => 100,
            'ai_pages_used'   => 0,
        ]);

        app()->instance('current.tenant', $this->tenant);
    }

    /** @test */
    public function it_debits_and_refunds_pages_correctly()
    {
        $service = app(AiEntitlementService::class);

        // Debit 2 pages
        $service->debitPage('managed', 2);
        $this->tenant->refresh();
        $this->assertEquals(2, $this->tenant->ai_pages_used);

        // Refund 1 page
        $service->refundPage('managed', 1);
        $this->tenant->refresh();
        $this->assertEquals(1, $this->tenant->ai_pages_used);
    }

    /** @test */
    public function it_calculates_audio_page_credits_correctly()
    {
        // 0s => 1 page
        $this->assertEquals(1, AiEntitlementService::calculateAudioPages(0));
        // 25s => 1 page
        $this->assertEquals(1, AiEntitlementService::calculateAudioPages(25));
        // 30s => 1 page
        $this->assertEquals(1, AiEntitlementService::calculateAudioPages(30));
        // 31s => 2 pages
        $this->assertEquals(2, AiEntitlementService::calculateAudioPages(31));
        // 90s => 3 pages
        $this->assertEquals(3, AiEntitlementService::calculateAudioPages(90));
    }

    /** @test */
    public function it_enforces_managed_limit_and_unlimited_flag()
    {
        $service = app(AiEntitlementService::class);

        // 1. Within limit (used 0, limit 100) -> allowed
        $check = $service->checkScan();
        $this->assertTrue($check['allowed']);

        // 2. Limit reached (used 100, limit 100) -> blocked
        $this->tenant->update(['ai_pages_used' => 100]);
        $checkLimit = $service->checkScan();
        $this->assertFalse($checkLimit['allowed']);
        $this->assertEquals('limit_reached', $checkLimit['reason']);

        // 3. Limit = -1 (unlimited) -> allowed even with high usage
        $this->tenant->update(['ai_pages_limit' => -1, 'ai_pages_used' => 5000]);
        $checkUnlimited = $service->checkScan();
        $this->assertTrue($checkUnlimited['allowed']);

        // 4. Limit = 0 or null -> blocked
        $this->tenant->update(['ai_pages_limit' => 0]);
        $checkZero = $service->checkScan();
        $this->assertFalse($checkZero['allowed']);
        $this->assertEquals('limit_reached', $checkZero['reason']);
    }

    /** @test */
    public function it_handles_job_status_polling_for_async_jobs()
    {
        $user = User::factory()->create(['is_platform_admin' => true]);
        TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);
        $this->actingAs($user);

        $jobId = 'test-job-' . uniqid();

        // 1. Not found -> 404
        $res404 = $this->getJson("/s/{$this->tenant->slug}/smart-capture/status/{$jobId}");
        $res404->assertStatus(404);

        // 2. Done status -> 200 with result
        Cache::put("smart_capture_job:{$jobId}", [
            'status' => 'done',
            'result' => ['action' => 'purchase', 'total' => 500],
        ], 3600);

        $resDone = $this->getJson("/s/{$this->tenant->slug}/smart-capture/status/{$jobId}");
        $resDone->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status'  => 'done',
                'result'  => ['action' => 'purchase', 'total' => 500],
            ]);

        // 3. Failed status -> 422 with error
        $failedJobId = 'fail-job-' . uniqid();
        Cache::put("smart_capture_job:{$failedJobId}", [
            'status' => 'failed',
            'error'  => 'Processing error',
        ], 3600);

        $resFail = $this->getJson("/s/{$this->tenant->slug}/smart-capture/status/{$failedJobId}");
        $resFail->assertStatus(422)
            ->assertJson([
                'success' => false,
                'status'  => 'failed',
                'error'   => 'Processing error',
            ]);
    }

    /** @test */
    public function it_triggers_80_percent_quota_warning_and_100_percent_limit()
    {
        $service = app(AiEntitlementService::class);

        // 1. Used 50/100 (50%) -> ok
        $this->tenant->update(['ai_pages_used' => 50, 'ai_pages_limit' => 100]);
        $this->assertEquals('ok', $service->checkWarningThreshold());

        // 2. Used 80/100 (80%) -> warning
        $this->tenant->update(['ai_pages_used' => 80]);
        $this->assertEquals('warning', $service->checkWarningThreshold());

        // 3. Used 100/100 (100%) -> limit
        $this->tenant->update(['ai_pages_used' => 100]);
        $this->assertEquals('limit', $service->checkWarningThreshold());
    }

    /** @test */
    public function it_credits_top_up_pages_in_checkout_service()
    {
        $checkoutService = app(\App\Services\LemonSqueezyCheckoutService::class);
        $initialLimit = $this->tenant->ai_pages_limit;

        $checkoutService->incrementAiPages($this->tenant->id, 200);

        $this->tenant->refresh();
        $this->assertEquals($initialLimit + 200, $this->tenant->ai_pages_limit);
    }

    /** @test */
    public function it_resets_usage_on_tenant_anniversary_day()
    {
        // Set tenant anniversary date day to match today's day of month
        $this->tenant->update([
            'ai_pages_used'        => 75,
            'ai_queries_used'      => 300,
            'ai_period_started_at' => now()->copy()->startOfDay(),
        ]);

        (new ResetAiUsageJob())->handle();

        $this->tenant->refresh();
        $this->assertEquals(0, $this->tenant->ai_pages_used);
        $this->assertEquals(0, $this->tenant->ai_queries_used);
    }

    /** @test */
    public function it_executes_real_http_post_to_extract_endpoint_without_undefined_variable_errors()
    {
        $user = User::factory()->create(['is_platform_admin' => true]);
        TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);
        $this->actingAs($user);

        // Mock FuzzyMatchService so matchDocument returns matched items
        $this->mock(\App\Services\SmartCapture\FuzzyMatchService::class, function ($mock) {
            $mock->shouldReceive('matchProduct')->andReturn([]);
            $mock->shouldReceive('matchDocument')->andReturn([
                [
                    'raw_name'     => 'Item A',
                    'matched_name' => 'Item A',
                    'product_id'   => 1,
                    'quantity'     => 5,
                    'unit_price'   => 100,
                    'total'        => 500,
                    'confidence'   => 1.0,
                    'match_reason' => 'exact_name',
                ],
            ]);
        });

        // Mock AiExtractionService so it returns a valid extraction array without requiring a live Gemini API key
        $this->mock(\App\Services\SmartCapture\AiExtractionService::class, function ($mock) {
            $mock->shouldReceive('resolveConfig')->andReturn([
                'provider' => 'gemini',
                'model'    => 'gemini-1.5-flash',
                'byok'     => false,
                'api_key'  => 'fake-key',
            ]);
            $mock->shouldReceive('hasOwnKey')->andReturn(false);
            $mock->shouldReceive('extractFromPayload')->andReturn([
                'action' => 'purchase',
                'items'  => [
                    ['name' => 'Item A', 'qty' => 5, 'unit_price' => 100, 'line_total' => 500],
                ],
            ]);
            $mock->shouldReceive('extract')->andReturn([
                'action' => 'purchase',
                'items'  => [
                    ['name' => 'Item A', 'qty' => 5, 'unit_price' => 100, 'line_total' => 500],
                ],
            ]);
            $mock->shouldReceive('matchFallback')->andReturn([]);
        });

        // HTTP POST to /smart-capture/extract with real text payload
        $response = $this->postJson("/s/{$this->tenant->slug}/smart-capture/extract", [
            'type'        => 'text',
            'text'        => 'Purchase 5 units of Item A at 100 PKR each from Supplier X',
            'target_type' => 'purchase',
        ]);

        $this->assertTrue(in_array($response->getStatusCode(), [200, 202]),
            'Extract endpoint returned HTTP ' . $response->getStatusCode() . ' instead of 200/202: ' . $response->getContent());
        
        $data = $response->json();
        $this->assertTrue($data['success']);
        $this->assertArrayHasKey('quota_status', $data);

        // Also assert context() returns non-null pages_used and pages_limit
        $contextRes = $this->getJson("/s/{$this->tenant->slug}/smart-capture/context");
        $contextRes->assertStatus(200);
        $contextData = $contextRes->json();
        $this->assertNotNull($contextData['entitlement']['pages_used']);
        $this->assertNotNull($contextData['entitlement']['pages_limit']);
    }

    /** @test */
    public function it_dispatches_process_smart_capture_job_when_rate_limiter_wait_exceeds_8000ms()
    {
        \Illuminate\Support\Facades\Queue::fake();

        $user = User::factory()->create(['is_platform_admin' => true]);
        TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);
        $this->actingAs($user);

        // Mock AiRateLimiter so tryAcquire returns wait_ms > 8000ms
        $this->mock(\App\Services\Ai\AiRateLimiter::class, function ($mock) {
            $mock->shouldReceive('tryAcquire')->andReturn([
                'ok'      => false,
                'wait_ms' => 12000,
            ]);
        });

        $response = $this->postJson("/s/{$this->tenant->slug}/smart-capture/extract", [
            'type'        => 'text',
            'text'        => 'Purchase 10 items',
            'target_type' => 'purchase',
        ]);

        $response->assertStatus(202)
            ->assertJson([
                'success' => true,
                'async'   => true,
            ]);

        $this->assertNotNull($response->json('job_id'));
        \Illuminate\Support\Facades\Queue::assertPushed(ProcessSmartCaptureJob::class);
    }

    /** @test */
    public function it_provisions_topup_pages_on_order_created_webhook()
    {
        $topupVariantId = '1740650';
        config(['services.lemon_squeezy.ai_topup_addon_id' => $topupVariantId]);

        $initialLimit = $this->tenant->ai_pages_limit;

        $payload = [
            'meta' => [
                'event_name' => 'order_created',
                'custom_data' => [
                    'tenant_id'  => $this->tenant->id,
                    'variant_id' => $topupVariantId,
                ],
            ],
            'data' => [
                'attributes' => [
                    'first_order_item' => [
                        'variant_id' => (int) $topupVariantId,
                    ],
                ],
            ],
        ];

        $job = new \App\Jobs\ProvisionTenantJob($payload);
        $job->handle();

        $this->tenant->refresh();
        $this->assertEquals($initialLimit + 200, $this->tenant->ai_pages_limit);
    }
}





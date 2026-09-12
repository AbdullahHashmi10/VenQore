<?php

namespace Tests\Feature\Ai;

use App\Services\SmartCapture\AiExtractionService;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

class SmartCaptureSpendCapTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        DB::table('ai_spend_counters')->delete();
        DB::table('ai_rate_buckets')->delete();
    }

    public function test_spend_cap_tripped_refuses_subsequent_scans(): void
    {
        $tenant = $this->createTenant();
        $tenant->update([
            'ai_status'        => 'managed',
            'ai_pages_used'    => 0,
            'ai_pages_limit'   => 100,
        ]);
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        // Configure spend cap so 1st request passes and 2nd trips
        config([
            'ai_limits.features.scan.spend_cap'      => 0.0015,
            'ai_limits.features.scan.estimated_cost' => 0.0010,
        ]);

        $mockCalls = 0;
        $mockAi = $this->createMock(AiExtractionService::class);
        $mockAi->method('extract')->willReturnCallback(function () use (&$mockCalls) {
            $mockCalls++;
            return [
                'action'   => 'purchase',
                'cost_usd' => 0.001,
                'items'    => [
                    ['name' => 'Widget A', 'qty' => 1, 'unit_price' => 10, 'line_total' => 10]
                ],
            ];
        });
        $this->app->instance(AiExtractionService::class, $mockAi);

        // 1st request succeeds
        $res1 = $this->actingAs($user)->postJson("/s/{$tenant->slug}/smart-capture/extract", [
            'type'        => 'text',
            'text'        => 'Bought 1 Widget A for $10',
            'target_type' => 'purchase',
        ]);
        $res1->assertOk();
        $this->assertSame(1, $mockCalls);

        // 2nd request must be blocked by spend cap
        $res2 = $this->actingAs($user)->postJson("/s/{$tenant->slug}/smart-capture/extract", [
            'type'        => 'text',
            'text'        => 'Bought 1 Widget A for $10',
            'target_type' => 'purchase',
        ]);
        $res2->assertStatus(429);
        $res2->assertJson([
            'success' => false,
            'code'    => 'spend_cap_exceeded',
        ]);

        // Assert no additional upstream call was made
        $this->assertSame(1, $mockCalls);
    }
}

<?php

namespace Tests\Feature\Ai;

use App\Services\Ai\AiRateLimiter;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

class AiRateLimiterTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        DB::table('ai_rate_buckets')->delete();
    }

    public function test_fresh_database_auto_provisions_and_allows_first_request(): void
    {
        $limiter = new AiRateLimiter();
        $this->assertDatabaseCount('ai_rate_buckets', 0);

        $result = $limiter->tryAcquire('query:tenant-123');

        $this->assertTrue($result['ok']);
        $this->assertDatabaseHas('ai_rate_buckets', [
            'bucket_key' => 'query:tenant-123',
            'day_count'  => 1,
        ]);
    }

    public function test_day_limit_exceeded_returns_ok_false(): void
    {
        config(['ai_limits.features.query.day_limit' => 3]);
        $limiter = new AiRateLimiter();

        // 1st, 2nd, 3rd requests succeed
        $this->assertTrue($limiter->tryAcquire('query:tenant-123')['ok']);
        $this->assertTrue($limiter->tryAcquire('query:tenant-123')['ok']);
        $this->assertTrue($limiter->tryAcquire('query:tenant-123')['ok']);

        // 4th request must fail with daily_limit
        $fourth = $limiter->tryAcquire('query:tenant-123');
        $this->assertFalse($fourth['ok']);
        $this->assertSame('daily_limit', $fourth['reason']);
    }

    public function test_burst_capacity_depletion_returns_rate_limit(): void
    {
        config([
            'ai_limits.features.scan.capacity'       => 2,
            'ai_limits.features.scan.refill_per_sec' => 0.1,
            'ai_limits.features.scan.day_limit'      => 100,
        ]);

        $limiter = new AiRateLimiter();

        $this->assertTrue($limiter->tryAcquire('scan:tenant-123')['ok']);
        $this->assertTrue($limiter->tryAcquire('scan:tenant-123')['ok']);

        // 3rd rapid acquire without refill must fail with rate limit
        $third = $limiter->tryAcquire('scan:tenant-123');
        $this->assertFalse($third['ok']);
        $this->assertSame('rate', $third['reason']);
        $this->assertArrayHasKey('wait_ms', $third);
    }

    public function test_tenant_a_exhausting_limit_does_not_affect_tenant_b(): void
    {
        config(['ai_limits.features.scan.day_limit' => 2]);
        $limiter = new AiRateLimiter();

        // Tenant A consumes quota
        $this->assertTrue($limiter->tryAcquire('scan:tenant-A')['ok']);
        $this->assertTrue($limiter->tryAcquire('scan:tenant-A')['ok']);
        $this->assertFalse($limiter->tryAcquire('scan:tenant-A')['ok']);

        // Tenant B is completely unaffected
        $this->assertTrue($limiter->tryAcquire('scan:tenant-B')['ok']);
        $this->assertTrue($limiter->tryAcquire('scan:tenant-B')['ok']);
        $this->assertFalse($limiter->tryAcquire('scan:tenant-B')['ok']);
    }
}

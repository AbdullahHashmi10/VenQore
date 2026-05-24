<?php

namespace Tests\Performance;

use Tests\TestCase;
use App\Services\V3\PartyService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SnapshotPerformanceTest extends TestCase
{
    /** @test */
    public function party_snapshot_rebuild_completes_under_2ms()
    {
        $partyId = Str::uuid()->toString();

        DB::table('parties')->insertOrIgnore([
            'id'         => $partyId,
            'name'       => 'Perf Test Party',
            'type'       => 'customer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $service = app(PartyService::class);

        // Warm up
        $service->rebuildSnapshot($partyId);

        // Measure over 10 iterations
        $times = [];
        for ($i = 0; $i < 10; $i++) {
            $start   = hrtime(true);
            $service->rebuildSnapshot($partyId);
            $times[] = (hrtime(true) - $start) / 1_000_000; // nanoseconds → ms
        }

        $avg = array_sum($times) / count($times);

        $this->assertLessThan(
            2.0,
            $avg,
            "Snapshot rebuild averaged {$avg}ms — must be under 2ms. " .
            "Run migration 2026_03_07_000001 to add performance indexes."
        );
    }
}

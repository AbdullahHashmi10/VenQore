<?php

namespace App\Jobs;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * ResetAiUsageJob — monthly sweep to reset AI scan & query counters for managed tenants.
 */
class ResetAiUsageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $count = Tenant::where('ai_status', 'managed')
            ->update([
                'ai_scans_used'   => 0,
                'ai_queries_used' => 0,
                'updated_at'      => now(),
            ]);

        Log::info("[ResetAiUsageJob] Successfully reset AI usage counters for {$count} managed AI tenants.");
    }
}

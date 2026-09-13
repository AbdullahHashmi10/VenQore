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
 * ResetAiUsageJob — per-tenant anniversary sweep to reset AI page & query counters for managed tenants.
 */
class ResetAiUsageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $todayDay = (int) now()->format('j');
        $isFirstOfMonth = $todayDay === 1;

        // Reset managed tenants whose ai_period_started_at day matches today,
        // or fall back to 1st of month sweep for tenants with null ai_period_started_at.
        $tenantsToReset = Tenant::where('ai_status', 'managed')
            ->where(function ($query) use ($todayDay, $isFirstOfMonth) {
                $query->whereRaw('DAY(ai_period_started_at) = ?', [$todayDay]);
                if ($isFirstOfMonth) {
                    $query->orWhereNull('ai_period_started_at');
                }
            })
            ->get();

        $count = 0;
        foreach ($tenantsToReset as $tenant) {
            $tenant->update([
                'ai_pages_used'   => 0,
                'ai_queries_used' => 0,
                'updated_at'      => now(),
            ]);

            try {
                \App\Models\ActivityLog::create([
                    'tenant_id'   => $tenant->id,
                    'user_id'     => null,
                    'log_name'    => 'ai_usage_reset',
                    'description' => "Monthly AI page and query usage counters reset to 0 on anniversary day {$todayDay}.",
                    'event'       => 'reset',
                ]);
            } catch (\Throwable $e) {
                // Non-critical audit log fallback
            }

            $count++;
        }

        Log::info("[ResetAiUsageJob] Successfully reset AI usage counters for {$count} managed AI tenants on anniversary day ({$todayDay}).");
    }
}

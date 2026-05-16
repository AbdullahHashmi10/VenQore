<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\TenantUser;

class GenerateStaffDailySummaries extends Command
{
    protected $signature = 'staff:generate-daily-summaries {--tenant= : Run for a specific tenant ID only}';
    protected $description = 'Generates daily work summaries for all staff members for the previous day (per tenant).';

    public function handle()
    {
        $yesterday = \Carbon\Carbon::yesterday();
        $this->info("Generating summaries for {$yesterday->toDateString()}...");

        // 6D FIX: Run per tenant — staff belong to a specific store
        $tenantQuery = Tenant::whereIn('status', ['active', 'trial']);

        if ($this->option('tenant')) {
            $tenantQuery->where('id', (int) $this->option('tenant'));
        }

        $tenants = $tenantQuery->get();

        foreach ($tenants as $tenant) {
            $this->info("\n🏪 Tenant [{$tenant->id}] {$tenant->name}");
            $this->processForTenant($tenant);
        }

        $this->info('Daily summaries generated successfully.');
        return 0;
    }

    private function processForTenant(Tenant $tenant): void
    {
        $yesterday = \Carbon\Carbon::yesterday();

        // 6D FIX: Only process users belonging to this tenant
        $userIds = TenantUser::where('tenant_id', $tenant->id)
            ->pluck('user_id');

        foreach ($userIds as $userId) {
            $attendances = \App\Models\StaffAttendance::where('user_id', $userId)
                ->where('tenant_id', $tenant->id)
                ->whereDate('created_at', $yesterday)
                ->orderBy('created_at')
                ->get();

            if ($attendances->isEmpty()) {
                continue;
            }

            $intervals       = [];
            $totalSeconds    = 0;
            $totalGapSeconds = 0;

            foreach ($attendances as $attendance) {
                $start = $attendance->check_in;
                $end   = $attendance->check_out ?? $attendance->last_active_at ?? $start;

                if ($end < $start) continue;

                $duration      = $start->diffInSeconds($end);
                $totalSeconds += $duration;

                $gapMinutes       = $attendance->total_gap_minutes ?? 0;
                $totalGapSeconds += ($gapMinutes * 60);

                $intervals[] = [
                    'start'          => $start->format('H:i'),
                    'end'            => $end->format('H:i'),
                    'duration_hours' => round($duration / 3600, 2),
                ];
            }

            $netSeconds = max(0, $totalSeconds - $totalGapSeconds);

            \App\Models\StaffDailySummary::updateOrCreate(
                [
                    'user_id'   => $userId,
                    'tenant_id' => $tenant->id,   // 6D FIX — scoped to tenant
                    'date'      => $yesterday->toDateString(),
                ],
                [
                    'work_intervals' => $intervals,
                    'total_hours'    => round($netSeconds / 3600, 2),
                    'total_gap_hours'=> round($totalGapSeconds / 3600, 2),
                ]
            );

            $this->line("   Processed user ID: {$userId}");
        }
    }
}

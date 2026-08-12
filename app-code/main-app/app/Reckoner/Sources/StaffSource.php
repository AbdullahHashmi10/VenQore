<?php

namespace App\Reckoner\Sources;

use App\Models\StaffAttendance;
use App\Models\TenantUser;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Services\FinancialReportingService;

/**
 * Staff on shift, and net revenue attributed by staff member (§7.11 — the
 * ledger-consistent version wins over the dashboard's separate computation).
 */
final class StaffSource implements ReckonerSource
{
    public function __construct(protected FinancialReportingService $reporting)
    {
    }

    public function supports(): array
    {
        return [
            'staff.on_shift_count',
            'staff.member_count',
        ];
    }

    public function resolveBatch(array $requests, ReckonerContext $ctx): array
    {
        $out = [];

        foreach ($requests as $request) {
            $key = $request['key'];
            $id = $request['id'];

            $out[$id] = match ($key) {
                'staff.on_shift_count' => StaffAttendance::query()
                    ->whereNull('check_out')
                    ->whereDate('check_in', now()->toDateString())
                    ->count(),
                'staff.member_count' => TenantUser::withoutGlobalScopes()
                    ->where('tenant_id', $ctx->tenant->id)
                    ->count(),
                default => null,
            };
        }

        return $out;
    }
}

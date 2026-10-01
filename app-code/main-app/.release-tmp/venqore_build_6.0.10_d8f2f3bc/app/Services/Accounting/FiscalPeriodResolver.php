<?php

namespace App\Services\Accounting;

use App\Helpers\SettingsHelper;
use App\Models\FiscalYear;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FiscalPeriodResolver
{
    /**
     * Resolve the current fiscal year start date for a tenant.
     * Uses first-class FiscalYear records if present; falls back to store settings.
     */
    public function getFiscalYearStart(?Tenant $tenant = null, ?Carbon $asOf = null): string
    {
        $tenantId = $tenant?->id ?? (app()->bound('current.tenant') ? app('current.tenant')->id : null);
        $asOfDate = ($asOf ?? now())->toDateString();

        if ($tenantId) {
            $fy = DB::table('fiscal_years')
                ->where('tenant_id', (string) $tenantId)
                ->where('start_date', '<=', $asOfDate)
                ->where('end_date', '>=', $asOfDate)
                ->whereIn('status', [FiscalYear::STATUS_OPEN, FiscalYear::STATUS_CLOSING, FiscalYear::STATUS_CLOSED, FiscalYear::STATUS_REOPENED])
                ->first();

            if ($fy) {
                return $fy->start_date;
            }
        }

        // Fallback to SettingsHelper logic (derived from fiscal_year_start month/day)
        return $this->deriveFromSetting($tenant, $asOf);
    }

    /**
     * Resolve the current fiscal year end date for a tenant.
     */
    public function getFiscalYearEnd(?Tenant $tenant = null, ?Carbon $asOf = null): string
    {
        $tenantId = $tenant?->id ?? (app()->bound('current.tenant') ? app('current.tenant')->id : null);
        $asOfDate = ($asOf ?? now())->toDateString();

        if ($tenantId) {
            $fy = DB::table('fiscal_years')
                ->where('tenant_id', (string) $tenantId)
                ->where('start_date', '<=', $asOfDate)
                ->where('end_date', '>=', $asOfDate)
                ->first();

            if ($fy) {
                return $fy->end_date;
            }
        }

        $startDate = Carbon::parse($this->getFiscalYearStart($tenant, $asOf));
        return $startDate->copy()->addYear()->subDay()->toDateString();
    }

    /**
     * Get full detail array for the current active fiscal year.
     */
    public function getCurrentFiscalYear(?Tenant $tenant = null, ?Carbon $asOf = null): array
    {
        $tenantId = $tenant?->id ?? (app()->bound('current.tenant') ? app('current.tenant')->id : null);
        $asOfDate = ($asOf ?? now())->toDateString();

        if ($tenantId) {
            $fy = DB::table('fiscal_years')
                ->where('tenant_id', (string) $tenantId)
                ->where('start_date', '<=', $asOfDate)
                ->where('end_date', '>=', $asOfDate)
                ->first();

            if ($fy) {
                return [
                    'id'                          => $fy->id,
                    'name'                        => $fy->name,
                    'start_date'                  => $fy->start_date,
                    'end_date'                    => $fy->end_date,
                    'status'                      => $fy->status,
                    'retained_earnings_account_id'=> $fy->retained_earnings_account_id,
                    'close_journal_entry_id'      => $fy->close_journal_entry_id,
                    'is_first_class'              => true,
                ];
            }
        }

        $start = $this->getFiscalYearStart($tenant, $asOf);
        $end   = $this->getFiscalYearEnd($tenant, $asOf);
        $startCarbon = Carbon::parse($start);

        return [
            'id'                          => null,
            'name'                        => 'FY ' . $startCarbon->format('Y') . '-' . Carbon::parse($end)->format('Y'),
            'start_date'                  => $start,
            'end_date'                    => $end,
            'status'                      => 'open',
            'retained_earnings_account_id'=> null,
            'close_journal_entry_id'      => null,
            'is_first_class'              => false,
        ];
    }

    /**
     * Derive start date from fiscal_year_start setting using tenant timezone.
     */
    private function deriveFromSetting(?Tenant $tenant, ?Carbon $asOf): string
    {
        $setting = SettingsHelper::get('fiscal_year_start', '2025-01-01');
        $tz = $tenant?->timezone ?? config('app.timezone', 'UTC');

        try {
            $settingCarbon = Carbon::parse($setting, $tz);
            $month = $settingCarbon->month;
            $day   = $settingCarbon->day;

            $now = ($asOf ?? Carbon::now($tz));
            $currentYearStart = Carbon::create($now->year, $month, $day, 0, 0, 0, $tz);

            if ($now->greaterThanOrEqualTo($currentYearStart)) {
                return $currentYearStart->toDateString();
            } else {
                return $currentYearStart->subYear()->toDateString();
            }
        } catch (\Exception $e) {
            return '2025-01-01';
        }
    }
}

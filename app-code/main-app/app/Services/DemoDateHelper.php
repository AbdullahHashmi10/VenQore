<?php

namespace App\Services;

use Carbon\Carbon;
use App\Models\Tenant;

class DemoDateHelper
{
    /**
     * The fixed reference date everything is anchored to.
     */
    public const DEMO_EPOCH = '2020-01-01';

    /**
     * When processing filters (e.g. "Sales from Today"), we need to un-shift
     * the requested date back into the DEMO_EPOCH timeline so the database
     * WHERE clause matches the actual seeded data.
     * 
     * Example: User asks for sales on 2026-04-13 (today).
     * The database records are actually stored as 2019-12-28.
     * This function translates 2026-04-13 -> 2019-12-28.
     */
    public static function unshiftForDemo($date)
    {
        if (!app()->bound('current.tenant')) {
            return Carbon::parse($date);
        }

        $tenant = app('current.tenant');
        if (!$tenant->is_demo && !$tenant->is_golden_master) {
            return Carbon::parse($date);
        }

        $offsetDays = Carbon::parse(self::DEMO_EPOCH)->diffInDays(Carbon::now());
        
        return Carbon::parse($date)->subDays($offsetDays);
    }

    /**
     * Unshift a date if demo, then format for database query
     */
    public static function buildQueryDate($date, $format = 'Y-m-d')
    {
        return self::unshiftForDemo($date)->format($format);
    }

    /**
     * Get the offset in days between today and the demo epoch.
     */
    public static function getOffsetDays(): int
    {
        return Carbon::parse(self::DEMO_EPOCH)->diffInDays(Carbon::now());
    }
}

<?php

namespace App\Reckoner\Rollup;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * DirtyDayTracker: Manages the dirty days queue and tenant reckoner data version (§5.1, §6.2).
 *
 * Rules:
 * 1. Writes are atomic and resilient (insertOrIgnore or on duplicate key).
 * 2. Marking a day dirty increments `tenants.reckoner_data_version`.
 * 3. Safe to call inside or outside transactions.
 */
class DirtyDayTracker
{
    /**
     * Mark a day dirty for a stream and tenant.
     */
    public static function mark(int|string $tenantId, string $stream, string|Carbon $day, string $reason = 'mutation'): void
    {
        try {
            $tenantId = (int) $tenantId;
            $dateStr = is_string($day) ? substr($day, 0, 10) : $day->toDateString();

            DB::table('reckoner_dirty_days')->upsert([
                'tenant_id'       => $tenantId,
                'stream'          => $stream,
                'day'             => $dateStr,
                'reason'          => substr($reason, 0, 64),
                'first_marked_at' => now(),
                'attempts'        => 0,
            ], ['tenant_id', 'stream', 'day'], ['reason']);

            // Bump reckoner_data_version on tenant
            if (Schema::hasColumn('tenants', 'reckoner_data_version')) {
                DB::table('tenants')->where('id', $tenantId)->increment('reckoner_data_version');
            }
        } catch (Throwable $e) {
            // Log but don't break transaction if tracking table has temporary issue
            report($e);
        }
    }

    /**
     * Check if a tenant's date range is clean (no dirty markers in reckoner_dirty_days).
     */
    public static function isClean(int|string $tenantId, string $from, string $to, ?string $stream = null): bool
    {
        $q = DB::table('reckoner_dirty_days')
            ->where('tenant_id', (int) $tenantId)
            ->whereBetween('day', [$from, $to]);

        if ($stream) {
            $q->where('stream', $stream);
        }

        return !$q->exists();
    }

    /**
     * Retrieve all dirty days pending rollup.
     */
    public static function getPending(int|string $tenantId, ?string $stream = null, int $limit = 500): array
    {
        $q = DB::table('reckoner_dirty_days')
            ->where('tenant_id', (int) $tenantId)
            ->orderBy('day', 'asc');

        if ($stream) {
            $q->where('stream', $stream);
        }

        return $q->limit($limit)->get()->toArray();
    }

    /**
     * Clear processed dirty day markers.
     */
    public static function clear(int|string $tenantId, string $stream, string $day): void
    {
        $dateStr = substr($day, 0, 10);
        DB::table('reckoner_dirty_days')
            ->where('tenant_id', (int) $tenantId)
            ->where('stream', $stream)
            ->where('day', $dateStr)
            ->delete();
    }
}

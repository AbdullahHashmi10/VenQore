<?php

namespace App\Reckoner\Streams;

use Illuminate\Support\Facades\DB;

/**
 * MasterRegistryStream: Pure tenant-explicit reader for accounts, bank accounts, activity logs, and plan limits.
 */
class MasterRegistryStream
{
    /**
     * Bank accounts count.
     */
    public function bankAccountCount(int|string $tenantId): int
    {
        return DB::table('bank_accounts')
            ->where('tenant_id', $tenantId)
            ->where('type', 'bank')
            ->count();
    }

    /**
     * Active users count in tenant activity log and sales.
     */
    public function activeUserCount(string $from, string $to, int|string $tenantId): int
    {
        $saleUsers = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->toArray();

        $activityUsers = [];
        if (\Illuminate\Support\Facades\Schema::hasTable('store_activity_log')) {
            $activityUsers = DB::table('store_activity_log')
                ->where('tenant_id', $tenantId)
                ->whereBetween('created_at', [$from, $to])
                ->whereNotNull('user_id')
                ->pluck('user_id')
                ->toArray();
        }

        $allUsers = array_unique(array_merge($saleUsers, $activityUsers));
        return count($allUsers);
    }

    /**
     * Audit trail count from store_activity_log.
     */
    public function auditTrailCount(string $from, string $to, int|string $tenantId): int
    {
        if (!\Illuminate\Support\Facades\Schema::hasTable('store_activity_log')) {
            return 0;
        }

        return DB::table('store_activity_log')
            ->where('tenant_id', $tenantId)
            ->whereBetween('created_at', [$from, $to])
            ->count();
    }
}

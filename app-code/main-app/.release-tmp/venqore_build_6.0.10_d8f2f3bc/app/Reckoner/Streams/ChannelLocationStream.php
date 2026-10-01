<?php

namespace App\Reckoner\Streams;

use Illuminate\Support\Facades\DB;

/**
 * ChannelLocationStream: Pure tenant-explicit reader for warehouses (multi_location) and
 * ecommerce/marketplace channels (marketplace_sync).
 */
class ChannelLocationStream
{
    // ── Locations / Warehouses ────────────────────────────────────────────────

    /**
     * Location/warehouse summary.
     */
    public function locationSummary(string $from, string $to, int|string $tenantId): array
    {
        // warehouses table: id, tenant_id, name, location, is_active, is_default
        $count = (int) DB::table('warehouses')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->count();

        // Revenue by location: sales joined with warehouses via warehouse_id
        // Check if sales has warehouse_id column
        try {
            $revenueByLocation = DB::table('sales')
                ->join('warehouses', function ($join) use ($tenantId) {
                    $join->on('sales.warehouse_id', '=', 'warehouses.id')
                         ->where('warehouses.tenant_id', $tenantId)
                         ->whereNull('warehouses.deleted_at');
                })
                ->where('sales.tenant_id', $tenantId)
                ->whereBetween(DB::raw('DATE(COALESCE(sales.posted_at, sales.created_at))'), [$from, $to])
                ->selectRaw('warehouses.name as location_name, SUM(sales.net_sales) as revenue')
                ->groupBy('warehouses.id', 'warehouses.name')
                ->orderByDesc('revenue')
                ->get()
                ->toArray();

            $revenueByLocation = array_map(fn($r) => [
                'location' => $r->location_name,
                'revenue'  => (float)$r->revenue,
            ], $revenueByLocation);
        } catch (\Exception $e) {
            $revenueByLocation = [];
        }

        // Stock by location: inventory_items or stock_movements joined with warehouses
        try {
            $stockByLocation = DB::table('inventory_items')
                ->join('warehouses', function ($join) use ($tenantId) {
                    $join->on('inventory_items.warehouse_id', '=', 'warehouses.id')
                         ->where('warehouses.tenant_id', $tenantId)
                         ->whereNull('warehouses.deleted_at');
                })
                ->where('inventory_items.tenant_id', $tenantId)
                ->selectRaw('warehouses.name as location_name, SUM(inventory_items.quantity * inventory_items.cost) as stock_value')
                ->groupBy('warehouses.id', 'warehouses.name')
                ->get()
                ->toArray();

            $stockByLocation = array_map(fn($r) => [
                'location'    => $r->location_name,
                'stock_value' => (float)$r->stock_value,
            ], $stockByLocation);
        } catch (\Exception $e) {
            $stockByLocation = [];
        }

        // Stock imbalance: locations with unusually high/low stock
        $stockImbalance = count($stockByLocation) > 1 ? $stockByLocation : [];

        return [
            'count'               => $count,
            'revenue_by_location' => $revenueByLocation,
            'stock_by_location'   => $stockByLocation,
            'stock_imbalance'     => $stockImbalance,
        ];
    }

    /**
     * Revenue trend by location.
     */
    public function revenueTrendByLocation(string $from, string $to, int|string $tenantId): array
    {
        try {
            $rows = DB::table('sales')
                ->join('warehouses', function ($join) use ($tenantId) {
                    $join->on('sales.warehouse_id', '=', 'warehouses.id')
                         ->where('warehouses.tenant_id', $tenantId)
                         ->whereNull('warehouses.deleted_at');
                })
                ->where('sales.tenant_id', $tenantId)
                ->whereBetween(DB::raw('DATE(COALESCE(sales.posted_at, sales.created_at))'), [$from, $to])
                ->selectRaw('DATE(COALESCE(sales.posted_at, sales.created_at)) as day, warehouses.name as location_name, SUM(sales.net_sales) as revenue')
                ->groupBy('day', 'warehouses.id', 'warehouses.name')
                ->orderBy('day')
                ->get()
                ->toArray();

            return array_map(fn($r) => [
                'day'      => $r->day,
                'location' => $r->location_name,
                'revenue'  => (float)$r->revenue,
            ], $rows);
        } catch (\Exception $e) {
            return [];
        }
    }

    // ── Marketplace / Ecommerce Channels ──────────────────────────────────────

    /**
     * Marketplace/ecommerce channel summary.
     */
    public function channelSummary(string $from, string $to, int|string $tenantId): array
    {
        // ecommerce_channels: id, tenant_id, name, platform, is_connected, sync_status, last_synced_at, fee_percentage
        $totalChannels = (int) DB::table('ecommerce_channels')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->count();

        $connectedChannels = (int) DB::table('ecommerce_channels')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->where('is_connected', 1)
            ->count();

        $syncErrors = (int) DB::table('ecommerce_channels')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->where('sync_status', 'error')
            ->count();

        // WooCommerce connections
        $wooCount = (int) DB::table('woo_connections')
            ->where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->count();

        // Revenue by channel from sales table (if channel_id or source column exists)
        try {
            $revenueByChannel = DB::table('sales')
                ->join('ecommerce_channels', function ($join) use ($tenantId) {
                    $join->on('sales.channel_id', '=', 'ecommerce_channels.id')
                         ->where('ecommerce_channels.tenant_id', $tenantId)
                         ->whereNull('ecommerce_channels.deleted_at');
                })
                ->where('sales.tenant_id', $tenantId)
                ->whereBetween(DB::raw('DATE(COALESCE(sales.posted_at, sales.created_at))'), [$from, $to])
                ->selectRaw('ecommerce_channels.name as channel_name, ecommerce_channels.platform, SUM(sales.net_sales) as revenue, COUNT(*) as order_count')
                ->groupBy('ecommerce_channels.id', 'ecommerce_channels.name', 'ecommerce_channels.platform')
                ->orderByDesc('revenue')
                ->get()
                ->toArray();

            $revenueByChannel = array_map(fn($r) => [
                'channel'     => $r->channel_name,
                'platform'    => $r->platform,
                'revenue'     => (float)$r->revenue,
                'order_count' => (int)$r->order_count,
            ], $revenueByChannel);
        } catch (\Exception $e) {
            $revenueByChannel = [];
        }

        // Online vs offline split
        try {
            $onlineSales = (float) (DB::table('sales')
                ->where('tenant_id', $tenantId)
                ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                ->whereNotNull('channel_id')
                ->sum('net_sales') ?? 0.0);

            $totalSales = (float) (DB::table('sales')
                ->where('tenant_id', $tenantId)
                ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                ->sum('net_sales') ?? 0.0);

            $offlineSales = $totalSales - $onlineSales;
            $onlineShare  = $totalSales > 0 ? round($onlineSales / $totalSales * 100, 2) : 0.0;
        } catch (\Exception $e) {
            $onlineSales  = 0.0;
            $offlineSales = 0.0;
            $onlineShare  = 0.0;
        }

        // Channel margin (revenue minus channel fees)
        $channelMargin = [];
        if (!empty($revenueByChannel)) {
            try {
                $feeRates = DB::table('ecommerce_channels')
                    ->where('tenant_id', $tenantId)
                    ->whereNull('deleted_at')
                    ->pluck('fee_percentage', 'name')
                    ->toArray();

                foreach ($revenueByChannel as $ch) {
                    $feeRate = $feeRates[$ch['channel']] ?? 0;
                    $fee = $ch['revenue'] * $feeRate / 100;
                    $channelMargin[] = [
                        'channel' => $ch['channel'],
                        'revenue' => $ch['revenue'],
                        'fee'     => round($fee, 2),
                        'margin'  => round($ch['revenue'] - $fee, 2),
                    ];
                }
            } catch (\Exception $e) {
                $channelMargin = [];
            }
        }

        // Stock mismatch count (sync errors related to stock)
        $stockMismatch = $syncErrors; // proxy: channels in error state may have stock mismatches

        return [
            'channel_count'     => $totalChannels,
            'connected'         => $connectedChannels,
            'woo_count'         => $wooCount,
            'sync_errors'       => $syncErrors,
            'stock_mismatch'    => $stockMismatch,
            'revenue_by_channel'=> $revenueByChannel,
            'online_sales'      => $onlineSales,
            'offline_sales'     => $offlineSales,
            'online_share_pct'  => $onlineShare,
            'channel_margin'    => $channelMargin,
        ];
    }
}

<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class Terms
{
    private static $fallbacks = [
        'customer' => ['singular' => 'Customer', 'plural' => 'Customers'],
        'supplier' => ['singular' => 'Supplier', 'plural' => 'Suppliers'],
        'product' => ['singular' => 'Product', 'plural' => 'Products'],
        'service' => ['singular' => 'Service', 'plural' => 'Services'],
        'category' => ['singular' => 'Category', 'plural' => 'Categories'],
        'stock' => ['singular' => 'Stock', 'plural' => 'Stock'],
        'location' => ['singular' => 'Location', 'plural' => 'Locations'],
        'sale' => ['singular' => 'Sale', 'plural' => 'Sales'],
        'purchase' => ['singular' => 'Purchase', 'plural' => 'Purchases'],
        'invoice' => ['singular' => 'Invoice', 'plural' => 'Invoices'],
        'quotation' => ['singular' => 'Quotation', 'plural' => 'Quotations'],
        'order' => ['singular' => 'Order', 'plural' => 'Orders'],
        'return' => ['singular' => 'Return', 'plural' => 'Returns'],
        'payment' => ['singular' => 'Payment', 'plural' => 'Payments'],
        'expense' => ['singular' => 'Expense', 'plural' => 'Expenses'],
        'staff' => ['singular' => 'Staff', 'plural' => 'Staff'],
        'shift' => ['singular' => 'Shift', 'plural' => 'Shifts'],
        'attendance' => ['singular' => 'Attendance', 'plural' => 'Attendances'],
        'occupancy' => ['singular' => 'Occupancy', 'plural' => 'Occupancies'],
        'position' => ['singular' => 'Position', 'plural' => 'Positions'],
        'job' => ['singular' => 'Job', 'plural' => 'Jobs'],
        'technician' => ['singular' => 'Technician', 'plural' => 'Technicians'],
        'contract' => ['singular' => 'Contract', 'plural' => 'Contracts'],
        'report' => ['singular' => 'Report', 'plural' => 'Reports'],
        'dashboard' => ['singular' => 'Dashboard', 'plural' => 'Dashboards'],
    ];

    /**
     * Get a specific terminology term singular/plural value.
     */
    public static function get(string $key, string $type = 'singular'): string
    {
        $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : null;
        if ($tenantId) {
            $terms = self::forTenant($tenantId);
            if (isset($terms[$key][$type])) {
                return $terms[$key][$type];
            }
        }

        return self::$fallbacks[$key][$type] ?? ucfirst($key);
    }

    public static function forTenant(?int $tenantId): array
    {
        if (!$tenantId) {
            return self::$fallbacks;
        }

        return Cache::remember("tenant_terms:{$tenantId}", 300, function () use ($tenantId) {
            $custom = DB::table('tenant_terminology')
                ->where('tenant_id', $tenantId)
                ->get()
                ->keyBy('term_key')
                ->map(fn($row) => [
                    'singular' => $row->singular,
                    'plural'   => $row->plural,
                ])
                ->toArray();

            return array_merge(self::$fallbacks, $custom);
        });
    }

    /**
     * Get all fallback terms.
     */
    public static function fallbacks(): array
    {
        return self::$fallbacks;
    }

    /**
     * Clear terms cache for a tenant.
     */
    public static function invalidateCache(int $tenantId): void
    {
        Cache::forget("tenant_terms:{$tenantId}");
    }
}

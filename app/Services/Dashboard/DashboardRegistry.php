<?php

namespace App\Services\Dashboard;

use App\Models\Product;
use App\Models\Composition;
use App\Models\TenantUser;
use App\Services\PlanRepository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/**
 * The registry of cards the configurable dashboard can show.
 * Replaces the retired WidgetRegistry.
 */
class DashboardRegistry
{
    public const SIZES = [
        '2x4' => ['w' => 2, 'h' => 4],
        '2x6' => ['w' => 2, 'h' => 6],
        '2x8' => ['w' => 2, 'h' => 8],
        '4x4' => ['w' => 4, 'h' => 4],
        '4x6' => ['w' => 4, 'h' => 6],
        '4x8' => ['w' => 4, 'h' => 8],
        '6x4' => ['w' => 6, 'h' => 4],
        '6x6' => ['w' => 6, 'h' => 6],
        '6x8' => ['w' => 6, 'h' => 8],
        '8x4' => ['w' => 8, 'h' => 4],
        '8x6' => ['w' => 8, 'h' => 6],
        '8x8' => ['w' => 8, 'h' => 8],
    ];

    public static function all(): array
    {
        $raw = [
            /* ── Business ─────────────────────────────────────────────── */
            'revenue_today' => [
                'title' => 'Today\'s Revenue',
                'description' => 'Revenue posted today, with change against yesterday.',
                'category' => 'Business',
                'sizes' => ['small', 'medium'],
                'default_size' => 'small',
                'permissions' => ['sales.view', 'reports.summary', 'reports.financial'],
                'default' => true,
            ],
            'sales_summary' => [
                'title' => 'Sales Summary',
                'description' => 'Sales, cost and gross profit for today, this month and this year.',
                'category' => 'Business',
                'sizes' => ['medium', 'large'],
                'default_size' => 'medium',
                'permissions' => ['sales.view', 'reports.summary', 'reports.financial'],
            ],
            'net_profit' => [
                'title' => 'Net Profit',
                'description' => 'Profit for the current month from the ledger.',
                'category' => 'Business',
                'sizes' => ['small', 'medium'],
                'default_size' => 'small',
                'permissions' => ['finance.balances', 'reports.financial'],
                'default' => true,
            ],
            'expenses' => [
                'title' => 'Expenses',
                'description' => 'Operating expenses recorded this month.',
                'category' => 'Business',
                'sizes' => ['small', 'medium'],
                'default_size' => 'small',
                'permissions' => ['finance.transactions', 'reports.financial'],
            ],
            'cash_position' => [
                'title' => 'Cash & Bank',
                'description' => 'Balance across cash drawers and bank accounts.',
                'category' => 'Business',
                'sizes' => ['small', 'medium'],
                'default_size' => 'small',
                'permissions' => ['finance.balances'],
                'default' => true,
            ],
            'revenue_trend' => [
                'title' => 'Revenue Trend',
                'description' => 'Revenue and profit over the last twelve months.',
                'category' => 'Business',
                'sizes' => ['large', 'full'],
                'default_size' => 'large',
                'permissions' => ['reports.summary', 'reports.financial', 'sales.view'],
                'default' => true,
            ],

            /* ── Customers ────────────────────────────────────────────── */
            'receivables' => [
                'title' => 'Receivables',
                'description' => 'What customers currently owe you.',
                'category' => 'Customers',
                'sizes' => ['small', 'medium'],
                'default_size' => 'small',
                'permissions' => ['finance.balances', 'reports.financial'],
                'capability' => 'has_parties',
            ],
            'payables' => [
                'title' => 'Payables',
                'description' => 'What you currently owe suppliers.',
                'category' => 'Customers',
                'sizes' => ['small', 'medium'],
                'default_size' => 'small',
                'permissions' => ['finance.balances', 'reports.financial'],
                'capability' => 'has_parties',
            ],
            'customer_count' => [
                'title' => 'Customers',
                'description' => 'Total customers on file, and how many are new this month.',
                'category' => 'Customers',
                'sizes' => ['small', 'medium'],
                'default_size' => 'small',
                'permissions' => ['parties.view', 'sales.view'],
                'capability' => 'has_parties',
            ],
            'top_customers' => [
                'title' => 'Top Customers',
                'description' => 'Highest-value customers this month.',
                'category' => 'Customers',
                'sizes' => ['medium', 'large'],
                'default_size' => 'large',
                'permissions' => ['reports.performance', 'reports.summary', 'parties.view'],
                'capability' => 'has_parties',
            ],

            /* ── Operations ───────────────────────────────────────────── */
            'low_stock' => [
                'title' => 'Low Stock',
                'description' => 'Products at or below their alert quantity.',
                'category' => 'Operations',
                'sizes' => ['medium', 'large'],
                'default_size' => 'large',
                'permissions' => ['inventory.view'],
                'capability' => 'has_inventory',
                'default' => true,
            ],
            'inventory_value' => [
                'title' => 'Stock Value',
                'description' => 'Current valuation of stock on hand.',
                'category' => 'Operations',
                'sizes' => ['small', 'medium'],
                'default_size' => 'small',
                'permissions' => ['inventory.view', 'reports.stock'],
                'feature' => 'stock_valuation',
                'capability' => 'has_inventory',
            ],
            'top_products' => [
                'title' => 'Top Products',
                'description' => 'Best sellers this month by net revenue.',
                'category' => 'Operations',
                'sizes' => ['medium', 'large'],
                'default_size' => 'large',
                'permissions' => ['reports.performance', 'reports.summary', 'sales.view'],
                'capability' => 'has_inventory',
            ],
            'recent_purchases' => [
                'title' => 'Recent Purchases',
                'description' => 'The latest purchase bills recorded.',
                'category' => 'Operations',
                'sizes' => ['medium', 'large'],
                'default_size' => 'large',
                'permissions' => ['purchases.view'],
                'capability' => 'has_purchases',
            ],
            'open_orders' => [
                'title' => 'Open Orders',
                'description' => 'Sales orders not yet fulfilled.',
                'category' => 'Operations',
                'sizes' => ['small', 'medium'],
                'default_size' => 'small',
                'permissions' => ['sales.view'],
                'capability' => 'has_sales_orders',
            ],
            'production_output' => [
                'title' => 'Production',
                'description' => 'Manufacturing runs completed this month.',
                'category' => 'Operations',
                'sizes' => ['small', 'medium'],
                'default_size' => 'medium',
                'permissions' => ['inventory.view'],
                'feature' => 'production',
                'capability' => 'has_manufacturing',
            ],

            /* ── People ───────────────────────────────────────────────── */
            'active_staff' => [
                'title' => 'Staff On Shift',
                'description' => 'Who is currently clocked in.',
                'category' => 'People',
                'sizes' => ['small', 'medium'],
                'default_size' => 'medium',
                'permissions' => ['staff.view', 'admin.settings_manage'],
                'capability' => 'has_staff',
            ],

            /* ── Insights ─────────────────────────────────────────────── */
            'needs_attention' => [
                'title' => 'Needs You Today',
                'description' => 'Overdue invoices, low stock and anything else waiting on you.',
                'category' => 'Insights',
                'sizes' => ['medium', 'large'],
                'default_size' => 'medium',
                'permissions' => [],
                'default' => true,
            ],
            'quick_actions' => [
                'title' => 'Quick Actions',
                'description' => 'One tap to a new sale, expense or customer.',
                'category' => 'Insights',
                'sizes' => ['medium', 'full'],
                'default_size' => 'medium',
                'permissions' => [],
                'default' => true,
            ],
            'ai_insights' => [
                'title' => 'Growth Insights',
                'description' => 'Recommendations already generated by the Growth Engine.',
                'category' => 'Insights',
                'sizes' => ['medium', 'large'],
                'default_size' => 'medium',
                'permissions' => ['reports.summary'],
                'feature' => 'growth_engine',
            ],
        ];

        $allSizes = ['2x4', '2x6', '2x8', '4x4', '4x6', '4x8', '6x4', '6x6', '6x8', '8x4', '8x6', '8x8'];
        foreach ($raw as $key => &$card) {
            $card['sizes'] = $allSizes;
            $oldDefault = $card['default_size'] ?? 'small';
            if ($oldDefault === 'small') {
                $card['default_size'] = '4x4';
            } elseif ($oldDefault === 'medium') {
                $card['default_size'] = '6x4';
            } elseif ($oldDefault === 'large') {
                $card['default_size'] = '6x6';
            } elseif ($oldDefault === 'full') {
                $card['default_size'] = '8x8';
            } else {
                $card['default_size'] = '4x4';
            }
        }
        unset($card);

        return $raw;
    }

    public static function availableFor($user, $tenant): array
    {
        $features = static::features($tenant);
        $capabilities = static::capabilities($tenant);

        $available = [];

        foreach (static::all() as $id => $widget) {
            if (! static::passesPermissions($user, $widget['permissions'] ?? [])) {
                continue;
            }

            $feature = $widget['feature'] ?? null;
            if ($feature !== null && empty($features[$feature])) {
                continue;
            }

            $capability = $widget['capability'] ?? null;
            if ($capability !== null && empty($capabilities[$capability])) {
                continue;
            }

            $available[$id] = $widget;
        }

        return $available;
    }

    protected static function passesPermissions($user, array $permissions): bool
    {
        if (empty($permissions)) {
            return true;
        }

        if (! $user) {
            return false;
        }

        foreach ($permissions as $permission) {
            try {
                if ($user->hasPermission($permission)) {
                    return true;
                }
            } catch (\Throwable) {
            }
        }

        return false;
    }

    public static function features($tenant): array
    {
        if (! $tenant) {
            return [];
        }

        try {
            return PlanRepository::featuresFor($tenant);
        } catch (\Throwable) {
            return [];
        }
    }

    public static function capabilities($tenant): array
    {
        if (! $tenant) {
            return [];
        }

        return Cache::remember("vq_dashboard_capabilities:{$tenant->id}", 600, function () use ($tenant) {
            $features = static::features($tenant);

            $probe = function (string $table, callable $query) {
                try {
                    return Schema::hasTable($table) ? (bool) $query() : false;
                } catch (\Throwable) {
                    return false;
                }
            };

            $hasInventory = $probe('products', fn () => Product::query()->exists());

            return [
                'has_inventory' => $hasInventory,
                'has_parties' => $probe('parties', fn () => \App\Models\Party::query()->exists()),
                'has_purchases' => $probe('purchases', fn () => \App\Models\Purchase::query()->exists()),
                'has_sales_orders' => $probe('sales_orders', fn () => \App\Models\SalesOrder::query()->exists()),
                'has_manufacturing' => ! empty($features['production'])
                    && $probe('compositions', fn () => Composition::query()->exists()),
                'has_staff' => $probe(
                    'tenant_users',
                    fn () => TenantUser::withoutGlobalScopes()
                        ->where('tenant_id', $tenant->id)
                        ->count() > 1,
                ),
            ];
        });
    }

    public static function defaultLayout($user, $tenant): array
    {
        $available = static::availableFor($user, $tenant);

        $layout = [];
        $x = 0;
        $y = 0;
        $rowHeight = 0;

        foreach ($available as $id => $widget) {
            if (empty($widget['default'])) {
                continue;
            }

            $size = $widget['default_size'] ?? 'small';
            $dimensions = static::SIZES[$size] ?? static::SIZES['small'];

            if ($x + $dimensions['w'] > 12) {
                $x = 0;
                $y += $rowHeight;
                $rowHeight = 0;
            }

            $layout[] = [
                'widget' => $id,
                'x' => $x,
                'y' => $y,
                'w' => $dimensions['w'],
                'h' => $dimensions['h'],
                'size' => $size,
            ];

            $x += $dimensions['w'];
            $rowHeight = max($rowHeight, $dimensions['h']);
        }

        return $layout;
    }

    public static function sanitizeLayout(array $layout, array $available): array
    {
        $clean = [];
        $seen = [];

        foreach ($layout as $item) {
            if (! is_array($item)) {
                continue;
            }

            $id = $item['widget'] ?? null;

            if (! is_string($id) || ! isset($available[$id]) || isset($seen[$id])) {
                continue;
            }

            $seen[$id] = true;

            $sizes = $available[$id]['sizes'] ?? ['small'];
            $size = $item['size'] ?? null;
            if (! is_string($size) || ! in_array($size, $sizes, true)) {
                $size = $available[$id]['default_size'] ?? $sizes[0];
            }

            $dimensions = static::SIZES[$size] ?? static::SIZES['small'];

            $clean[] = [
                'widget' => $id,
                'x' => max(0, min(11, (int) ($item['x'] ?? 0))),
                'y' => max(0, min(500, (int) ($item['y'] ?? 0))),
                'w' => $dimensions['w'],
                'h' => $dimensions['h'],
                'size' => $size,
            ];
        }

        return $clean;
    }
}

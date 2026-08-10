<?php

namespace App\Services\Dashboard;

use App\Models\Product;
use App\Models\Recipe;
use App\Models\TenantUser;
use App\Services\PlanRepository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/**
 * The catalogue of cards the configurable dashboard can show, and the rules
 * that decide which of them this particular store and this particular person
 * are allowed to see.
 *
 * ── Why gating lives here and not in React ─────────────────────────────────
 *
 * The card picker in the browser could filter the list on its own, and it does
 * — but a filtered list is a UI convenience, not a control. Anyone can POST a
 * widget id. So this class is the authority: the picker asks it what to show,
 * and the data endpoint asks it again before resolving anything. The frontend
 * registry holds presentation only (icon, how to render), never permission.
 *
 * ── Three independent gates ────────────────────────────────────────────────
 *
 *   permissions — what this USER may see. Checked against the same
 *                 `hasPermission()` the rest of the app uses, so a cashier's
 *                 dashboard cannot show them the P&L.
 *
 *   feature     — what this PLAN includes. Read from PlanRepository, the
 *                 existing entitlement source of truth.
 *
 *   capability  — whether the card is MEANINGFUL for this business. This is the
 *                 one that answers "a service business should not be shown
 *                 Inventory Valuation". It is a cheap, cached probe of whether
 *                 the underlying thing exists at all — a store with no products
 *                 is not offered stock cards, and stops being nagged about a
 *                 module it does not use.
 *
 * A card must pass all three. Failing any one removes it from the picker
 * entirely rather than showing it disabled behind an upsell — a dashboard that
 * is mostly locked padlocks is worse than a smaller dashboard.
 */
class WidgetRegistry
{
    /**
     * Grid presets. Twelve columns on desktop; these are the only widths a card
     * can take, which is what stops a dragged layout from turning into a mosaic
     * of arbitrary rectangles.
     */
    public const SIZES = [
        'small' => ['w' => 3, 'h' => 2],
        'medium' => ['w' => 6, 'h' => 2],
        'large' => ['w' => 6, 'h' => 4],
        'full' => ['w' => 12, 'h' => 3],
    ];

    /**
     * The catalogue.
     *
     * `default` marks the cards a brand-new user starts with, in the order they
     * are laid out. The starter set is deliberately small — six cards, not
     * twenty — because the first thing someone should feel is that the screen is
     * legible, and the second is that they can add to it.
     */
    public static function all(): array
    {
        return [
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
    }

    /* ------------------------------------------------------------------ *
     * Availability
     * ------------------------------------------------------------------ */

    /**
     * The catalogue filtered to what this user, plan and business can use.
     *
     * @return array<string, array> keyed by widget id
     */
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

    /**
     * Permission check.
     *
     * An empty list means "everyone" — used only by cards that show the user
     * their own workload (Needs You Today, Quick Actions), never by a card that
     * shows a number.
     *
     * A non-empty list is ANY-of, not all-of, and that matches how the existing
     * dashboard already decides visibility: a manager with `reports.financial`
     * and a bookkeeper with `finance.balances` should both see the profit card,
     * and requiring both would show it to neither.
     */
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
                // An unknown permission key is a missing grant, not an open door.
            }
        }

        return false;
    }

    /** Plan entitlements, straight from the existing repository. */
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

    /**
     * What this business actually does, inferred from what it has recorded.
     *
     * Cached for ten minutes and keyed by tenant. Each probe is a bare
     * `exists()` against an indexed tenant_id — the whole set costs one
     * round trip of cheap index lookups, once per ten minutes, and only on the
     * card picker and the first dashboard render.
     *
     * `exists()` rather than `count()` throughout: the answer is a boolean and
     * counting a hundred thousand product rows to learn "yes, some" is waste.
     */
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

                // Manufacturing needs both the entitlement and evidence the store
                // uses it. A plan that merely permits production is not a reason
                // to put a Production card in a hair salon's picker.
                'has_manufacturing' => ! empty($features['production'])
                    && $probe('recipes', fn () => Recipe::query()->exists()),

                // "More than one member" — a sole trader is their own staff, and
                // a Staff On Shift card telling them they are at work is noise.
                'has_staff' => $probe(
                    'tenant_users',
                    fn () => TenantUser::withoutGlobalScopes()
                        ->where('tenant_id', $tenant->id)
                        ->count() > 1,
                ),
            ];
        });
    }

    /** Drop the capability cache — called when the picker would otherwise lag reality. */
    public static function forgetCapabilities($tenantId): void
    {
        Cache::forget("vq_dashboard_capabilities:{$tenantId}");
    }

    /* ------------------------------------------------------------------ *
     * Default layout
     * ------------------------------------------------------------------ */

    /**
     * A starting layout computed from what this user can actually see, rather
     * than a fixed list that would leave a cashier looking at four empty slots.
     *
     * Packing is a simple left-to-right, top-to-bottom flow over the 12-column
     * grid. react-grid-layout will compact it further on the client; this only
     * has to be valid and non-overlapping.
     */
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

    /* ------------------------------------------------------------------ *
     * Layout hygiene
     * ------------------------------------------------------------------ */

    /**
     * Clean a saved layout against what is currently available.
     *
     * This is the graceful-downgrade path: a store that drops from Business to
     * Starter loses the Production card, and the correct behaviour is for it to
     * quietly disappear from the saved arrangement — not to render an error, and
     * not to be silently deleted from the database, so that re-upgrading brings
     * it back.
     *
     * Every field is re-derived rather than trusted. A layout row arrives from a
     * browser, so its width could say 400 columns if someone edited the request.
     */
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

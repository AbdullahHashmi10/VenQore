<?php

namespace App\Reckoner\Sources;

use App\Models\Product;
use App\Models\Stock;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerSettings;
use App\Services\FinancialReportingService;
use Illuminate\Support\Facades\DB;

/**
 * Everything about stock on hand. `inventory.stock_value` stays owned by
 * FinanceSource (it wraps FinancialReportingService::getInventoryValue(),
 * the FIFO figure — §7.3), this source owns counts, low/out-of-stock and
 * overstock.
 *
 * §7.13 canonicalised here: low stock is `0 < qty <= threshold` — NOT
 * `qty <= threshold`, which is what ReportController::lowStock() currently
 * does (verified against the live controller: it filters
 * `stock_quantity <= effective_threshold` with no floor, so an out-of-stock
 * product is currently double-counted as "low stock" AND "out of stock").
 * `low_stock_count + out_of_stock_count` here equals that old combined total.
 *
 * Stock quantity is read from the `stocks` table (SUM(quantity) grouped by
 * product), matching ReportController::lowStock() — not `products.stock_quantity`,
 * which WidgetDataService::widgetLowStock() used and which can drift from the
 * real per-warehouse stock ledger. This is itself a §7-style canonicalisation:
 * the `stocks` table is the batch/warehouse source of truth, so it wins.
 */
final class InventorySource implements ReckonerSource
{
    public function __construct(protected FinancialReportingService $reporting)
    {
    }

    public function supports(): array
    {
        return [
            'inventory.low_stock_count',
            'inventory.out_of_stock_count',
            'inventory.product_count',
            'inventory.overstock_count',
            'inventory.low_stock_list',
        ];
    }

    public function resolveBatch(array $requests, ReckonerContext $ctx): array
    {
        $out = [];

        foreach ($requests as $request) {
            $key = $request['key'];
            $id = $request['id'];

            $out[$id] = match ($key) {
                'inventory.low_stock_count' => $this->lowStockCount($ctx),
                'inventory.out_of_stock_count' => $this->outOfStockCount($ctx),
                'inventory.product_count' => Product::query()->count(),
                'inventory.overstock_count' => $this->overstockCount($ctx),
                'inventory.low_stock_list' => (function() use ($ctx) {
                    $globalThreshold = (int) (\App\Helpers\SettingsHelper::getLowStockThreshold() ?? 0);
                    $stockSums = Stock::query()
                        ->selectRaw('product_id, SUM(quantity) as qty')
                        ->groupBy('product_id')
                        ->pluck('qty', 'product_id');

                    $products = Product::query()->get(['id', 'name', 'alert_quantity']);

                    $lowStockProducts = $products->filter(function ($product) use ($globalThreshold, $stockSums) {
                        $qty = (float) ($stockSums[$product->id] ?? 0.0);
                        $threshold = $product->alert_quantity > 0 ? $product->alert_quantity : $globalThreshold;
                        return $qty > 0 && $qty <= $threshold;
                    });

                    $rows = [];
                    foreach ($lowStockProducts as $product) {
                        $qty = (float) ($stockSums[$product->id] ?? 0.0);
                        $threshold = $product->alert_quantity > 0 ? $product->alert_quantity : $globalThreshold;
                        $rows[] = [
                            'name' => $product->name,
                            'qty' => (int) $qty,
                            'alert' => (int) $threshold,
                        ];
                    }

                    return [
                        'columns' => [
                            ['key' => 'name', 'label' => 'Product', 'unit' => 'text'],
                            ['key' => 'qty', 'label' => 'Stock Qty', 'unit' => 'integer'],
                            ['key' => 'alert', 'label' => 'Alert Qty', 'unit' => 'integer']
                        ],
                        'rows' => $rows,
                        'total' => null
                    ];
                })(),
                default => null,
            };
        }

        return $out;
    }

    /**
     * @return array{low: int, out: int, qtyByProduct: \Illuminate\Support\Collection, products: \Illuminate\Support\Collection}
     */
    private function stockSnapshot(ReckonerContext $ctx): array
    {
        $globalThreshold = (int) (\App\Helpers\SettingsHelper::getLowStockThreshold() ?? 0);

        $stockSums = Stock::query()
            ->selectRaw('product_id, SUM(quantity) as qty')
            ->groupBy('product_id')
            ->pluck('qty', 'product_id');

        $products = Product::query()->get(['id', 'alert_quantity']);

        return compact('globalThreshold', 'stockSums', 'products');
    }

    private function lowStockCount(ReckonerContext $ctx): int
    {
        ['globalThreshold' => $globalThreshold, 'stockSums' => $stockSums, 'products' => $products] = $this->stockSnapshot($ctx);

        return $products->filter(function ($product) use ($globalThreshold, $stockSums) {
            $qty = (float) ($stockSums[$product->id] ?? 0.0);
            $threshold = $product->alert_quantity > 0 ? $product->alert_quantity : $globalThreshold;

            // §7.13: low stock excludes out of stock — the floor at 0 is the
            // whole canonicalisation.
            return $qty > 0 && $qty <= $threshold;
        })->count();
    }

    private function outOfStockCount(ReckonerContext $ctx): int
    {
        ['stockSums' => $stockSums, 'products' => $products] = $this->stockSnapshot($ctx);

        return $products->filter(fn ($product) => (float) ($stockSums[$product->id] ?? 0.0) <= 0)->count();
    }

    /**
     * §6.2 — overstock is off by default, the owner's number when on.
     *   manual: qty > min_stock_alert × multiplier.
     *   auto:   days-of-cover = qty ÷ (avg daily sales, last 90 days) > 180.
     *           No sales history -> excluded (new, not overstocked).
     */
    private function overstockCount(ReckonerContext $ctx): ?int
    {
        $mode = ReckonerSettings::get('reckoner.overstock_mode', $ctx->tenant);

        if ($mode === 'off' || $mode === null) {
            return null; // caller maps this to not_applicable
        }

        ['stockSums' => $stockSums, 'products' => $products] = $this->stockSnapshot($ctx);

        if ($mode === 'manual') {
            $multiplier = (float) ReckonerSettings::get('reckoner.overstock_multiplier', $ctx->tenant);

            return $products->filter(function ($product) use ($stockSums, $multiplier) {
                $qty = (float) ($stockSums[$product->id] ?? 0.0);
                $threshold = (float) $product->alert_quantity;

                return $threshold > 0 && $qty > ($threshold * $multiplier);
            })->count();
        }

        // auto: days of cover over the last 90 days of sale_items for each product.
        $tenantId = $ctx->tenant->id;
        $ninetyDaysAgo = now()->subDays(90)->toDateString();

        // Only posted sales count as demand — matches Sale::scopePosted(),
        // the only scope allowed in financial/reporting queries per Sale.php.
        $avgDailySales = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.tenant_id', $tenantId)
            ->where('sales.status', 'posted')
            ->whereNotNull('sales.posted_at')
            ->where('sales.posted_at', '>=', $ninetyDaysAgo)
            ->selectRaw('sale_items.product_id, SUM(sale_items.quantity) / 90 as avg_daily')
            ->groupBy('sale_items.product_id')
            ->pluck('avg_daily', 'sale_items.product_id');

        $count = 0;
        foreach ($products as $product) {
            $avgDaily = (float) ($avgDailySales[$product->id] ?? 0);

            // No sales history -> not_applicable per product, not overstocked.
            if ($avgDaily <= 0) {
                continue;
            }

            $qty = (float) ($stockSums[$product->id] ?? 0.0);
            $daysOfCover = $qty / $avgDaily;

            if ($daysOfCover > 180) {
                $count++;
            }
        }

        return $count;
    }
}

<?php

namespace App\Reckoner\Sources;

use App\Models\SalesOrder;
use App\Models\StockTake;
use App\Models\StockTransfer;
use App\Reckoner\ReckonerContext;

/**
 * Pipeline counts that don't belong to Sales, Finance or Inventory proper —
 * open sales orders, pending stock takes/transfers. §5.1 routes
 * PurchaseOrderController's PO pipeline to Purchasing, not here; the
 * remainder (StockTakeController, StockTransferController,
 * SerialTrackingController) lands in Operations per the build spec's source
 * inventory table.
 *
 * These are all Eloquent models with HasTenant, so plain model queries are
 * already tenant-scoped — no manual tenant_id filter needed, unlike the
 * DB::table() raw queries elsewhere in Phase 2.
 */
final class OperationsSource implements ReckonerSource
{
    public function supports(): array
    {
        return [
            'operations.open_sales_orders',
            'operations.pending_stock_takes',
            'operations.pending_stock_transfers',
            'plan.usage_summary',
        ];
    }

    public function resolveBatch(array $requests, ReckonerContext $ctx): array
    {
        $out = [];

        foreach ($requests as $request) {
            $key = $request['key'];
            $id = $request['id'];

            $out[$id] = match ($key) {
                'operations.open_sales_orders' => SalesOrder::query()->where('status', 'open')->count(),
                // StockTake's incomplete state is 'draft', not 'pending' —
                // verified against StockTakeController's own stats block.
                'operations.pending_stock_takes' => StockTake::query()->where('status', 'draft')->count(),
                'operations.pending_stock_transfers' => StockTransfer::query()->where('status', 'pending')->count(),
                'plan.usage_summary' => (function() use ($ctx) {
                    $tenant = $ctx->tenant;
                    $productCount = \App\Models\Product::count();
                    $staffCount = \App\Models\User::whereNotIn('role', ['platform_admin'])->count();
                    $warehouseCount = \App\Models\Warehouse::count();

                    $txCount = \App\Models\Sale::where('status', 'posted')
                        ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
                        ->count();

                    $skuLimit = $tenant->getLimit('sku_limit');
                    $staffLimit = $tenant->getLimit('staff_limit');
                    $locationLimit = $tenant->getLimit('locations');
                    $txLimit = $tenant->getLimit('transactions_per_month');

                    $pct = $txLimit ? round(($txCount / $txLimit) * 100) : 0;

                    return [
                        'value' => $pct,
                        'min' => 0,
                        'max' => 100,
                        'target' => 100,
                        'bands' => [
                            ['to' => 80, 'severity' => 'ok'],
                            ['to' => 95, 'severity' => 'warning'],
                            ['to' => 100, 'severity' => 'danger']
                        ],
                        'details' => [
                            'usage' => [
                                'products' => [
                                    'used'      => $productCount,
                                    'limit'     => $skuLimit,
                                    'unlimited' => $skuLimit === null,
                                    'percent'   => $skuLimit ? round(($productCount / $skuLimit) * 100) : 0,
                                    'at_limit'  => $skuLimit !== null && $productCount >= $skuLimit,
                                    'near_limit'=> $skuLimit !== null && $productCount >= ($skuLimit * 0.80),
                                    'critical'  => $skuLimit !== null && $productCount >= ($skuLimit * 0.95),
                                ],
                                'staff' => [
                                    'used'      => $staffCount,
                                    'limit'     => $staffLimit,
                                    'unlimited' => $staffLimit === null,
                                    'percent'   => $staffLimit ? round(($staffCount / $staffLimit) * 100) : 0,
                                    'at_limit'  => $staffLimit !== null && $staffCount >= $staffLimit,
                                    'near_limit'=> $staffLimit !== null && $staffCount >= ($staffLimit * 0.80),
                                    'critical'  => $staffLimit !== null && $staffCount >= ($staffLimit * 0.95),
                                ],
                                'warehouses' => [
                                    'used'      => $warehouseCount,
                                    'limit'     => $locationLimit,
                                    'unlimited' => $locationLimit === null,
                                    'percent'   => $locationLimit ? round(($warehouseCount / $locationLimit) * 100) : 0,
                                    'at_limit'  => $locationLimit !== null && $warehouseCount >= $locationLimit,
                                    'near_limit'=> $locationLimit !== null && $warehouseCount >= ($locationLimit * 0.80),
                                    'critical'  => $locationLimit !== null && $warehouseCount >= ($locationLimit * 0.95),
                                ],
                                'transactions' => [
                                    'used'      => $txCount,
                                    'limit'     => $txLimit,
                                    'unlimited' => $txLimit === null,
                                    'percent'   => $txLimit ? round(($txCount / $txLimit) * 100) : 0,
                                    'at_limit'  => $txLimit !== null && $txCount >= $txLimit,
                                    'near_limit'=> $txLimit !== null && $txCount >= ($txLimit * 0.80),
                                    'critical'  => $txLimit !== null && $txCount >= ($txLimit * 0.95),
                                    'resets_at' => now()->addMonth()->startOfMonth()->toIso8601String(),
                                ],
                            ],
                            'features' => [
                                'woocommerce'   => \App\Services\PlanGate::check('woocommerce'),
                                'api_access'    => \App\Services\PlanGate::check('api_access'),
                                'growth_engine' => \App\Services\PlanGate::check('growth_engine'),
                                'multi_branch'  => \App\Services\PlanGate::check('multi_branch'),
                                'reports'       => $tenant->getLimit('reports'),
                            ]
                        ]
                    ];
                })(),
                default => null,
            };
        }

        return $out;
    }
}

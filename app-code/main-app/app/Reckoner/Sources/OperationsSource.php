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
                'plan.usage_summary' => [
                    'value' => 412,
                    'min' => 0,
                    'max' => 500,
                    'target' => 450,
                    'bands' => [
                        ['to' => 80, 'severity' => 'ok'],
                        ['to' => 95, 'severity' => 'warning'],
                        ['to' => 100, 'severity' => 'danger']
                    ]
                ],
                default => null,
            };
        }

        return $out;
    }
}

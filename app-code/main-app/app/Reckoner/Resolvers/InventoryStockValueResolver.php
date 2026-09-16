<?php

namespace App\Reckoner\Resolvers;

final class InventoryStockValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'inventory.stock_value';
    }

    protected function compute(
        \App\Reckoner\ReckonerContext $ctx,
        \App\Reckoner\ReckonerPeriod $period,
        array $card,
        array $args,
        string $id,
        \App\Reckoner\ReckonerShape $shape
    ): \App\Reckoner\ReckonerResult {
        $tenantId = $ctx->tenant->id;
        $valuation = (float) \Illuminate\Support\Facades\DB::table('inventory_batches')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->where('remaining_qty', '>', 0)
            ->sum(\Illuminate\Support\Facades\DB::raw('remaining_qty * unit_cost'));

        // Fallback: If no batches, check if store has product stocks (or GL account 1100)
        if ($valuation <= 0) {
            $productVal = (float) \Illuminate\Support\Facades\DB::table('stocks')
                ->join('products', 'stocks.product_id', '=', 'products.id')
                ->where('stocks.tenant_id', $tenantId)
                ->where('products.tenant_id', $tenantId)
                ->sum(\Illuminate\Support\Facades\DB::raw('stocks.quantity * COALESCE(products.cost_price, 0)'));
            if ($productVal > 0) {
                $valuation = $productVal;
            }
        }

        return \App\Reckoner\ReckonerResult::success($id, self::key(), $shape, $card, $period, [
            'value' => round($valuation, 2),
            'previous' => null,
            'change_pct' => null,
        ]);
    }
}

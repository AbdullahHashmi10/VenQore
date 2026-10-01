<?php

namespace App\Reckoner\Resolvers;

final class InventoryLowStockCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'inventory.low_stock_count';
    }
}

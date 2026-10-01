<?php

namespace App\Reckoner\Resolvers;

final class InventoryLowStockListResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'inventory.low_stock_list';
    }
}

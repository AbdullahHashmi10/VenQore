<?php

namespace App\Reckoner\Resolvers;

final class InventoryOutOfStockCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'inventory.out_of_stock_count';
    }
}

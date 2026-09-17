<?php

namespace App\Reckoner\Resolvers;

final class InventoryDeadStockValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'inventory.dead_stock_value';
    }
}

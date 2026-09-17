<?php

namespace App\Reckoner\Resolvers;

final class InventoryStockValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'inventory.stock_value';
    }
}

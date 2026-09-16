<?php

namespace App\Reckoner\Resolvers;

final class InventoryStockValueTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'inventory.stock_value_trend';
    }
}

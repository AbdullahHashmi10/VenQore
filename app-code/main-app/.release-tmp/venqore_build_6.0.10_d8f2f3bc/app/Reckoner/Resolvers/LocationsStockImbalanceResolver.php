<?php

namespace App\Reckoner\Resolvers;

final class LocationsStockImbalanceResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'locations.stock_imbalance';
    }
}

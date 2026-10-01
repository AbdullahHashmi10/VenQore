<?php

namespace App\Reckoner\Resolvers;

final class LocationsStockByLocationResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'locations.stock_by_location';
    }
}

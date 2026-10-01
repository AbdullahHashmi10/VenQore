<?php

namespace App\Reckoner\Resolvers;

final class TablesOccupancyRateResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'tables.occupancy_rate';
    }
}

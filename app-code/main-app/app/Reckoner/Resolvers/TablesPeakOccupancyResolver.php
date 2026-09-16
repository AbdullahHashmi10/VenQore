<?php

namespace App\Reckoner\Resolvers;

final class TablesPeakOccupancyResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'tables.peak_occupancy';
    }
}

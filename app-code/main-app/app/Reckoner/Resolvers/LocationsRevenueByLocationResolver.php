<?php

namespace App\Reckoner\Resolvers;

final class LocationsRevenueByLocationResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'locations.revenue_by_location';
    }
}

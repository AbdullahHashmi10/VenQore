<?php

namespace App\Reckoner\Resolvers;

final class LocationsRevenueTrendByLocationResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'locations.revenue_trend_by_location';
    }
}

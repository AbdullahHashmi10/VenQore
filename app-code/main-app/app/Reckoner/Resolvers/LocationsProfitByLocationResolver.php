<?php

namespace App\Reckoner\Resolvers;

final class LocationsProfitByLocationResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'locations.profit_by_location';
    }
}

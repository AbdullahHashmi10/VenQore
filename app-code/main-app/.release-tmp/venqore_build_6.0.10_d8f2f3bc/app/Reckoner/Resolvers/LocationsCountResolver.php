<?php

namespace App\Reckoner\Resolvers;

final class LocationsCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'locations.count';
    }
}

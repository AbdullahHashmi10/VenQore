<?php

namespace App\Reckoner\Resolvers;

final class ParkOpenValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'park.open_value';
    }
}

<?php

namespace App\Reckoner\Resolvers;

final class ParkOpenCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'park.open_count';
    }
}

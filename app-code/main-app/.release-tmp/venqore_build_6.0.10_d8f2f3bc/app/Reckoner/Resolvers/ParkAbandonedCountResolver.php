<?php

namespace App\Reckoner\Resolvers;

final class ParkAbandonedCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'park.abandoned_count';
    }
}

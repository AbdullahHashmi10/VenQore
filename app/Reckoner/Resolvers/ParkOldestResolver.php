<?php

namespace App\Reckoner\Resolvers;

final class ParkOldestResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'park.oldest';
    }
}

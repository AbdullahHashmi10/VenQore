<?php

namespace App\Reckoner\Resolvers;

final class LandedTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'landed.trend';
    }
}

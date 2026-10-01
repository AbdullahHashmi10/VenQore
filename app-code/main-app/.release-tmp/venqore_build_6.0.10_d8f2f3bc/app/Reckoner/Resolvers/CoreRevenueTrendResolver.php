<?php

namespace App\Reckoner\Resolvers;

final class CoreRevenueTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.revenue_trend';
    }
}

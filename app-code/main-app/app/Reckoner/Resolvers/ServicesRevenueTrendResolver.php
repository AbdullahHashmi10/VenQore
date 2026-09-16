<?php

namespace App\Reckoner\Resolvers;

final class ServicesRevenueTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'services.revenue_trend';
    }
}

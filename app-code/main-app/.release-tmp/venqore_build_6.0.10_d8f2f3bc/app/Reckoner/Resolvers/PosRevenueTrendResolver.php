<?php

namespace App\Reckoner\Resolvers;

final class PosRevenueTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'pos.revenue_trend';
    }
}

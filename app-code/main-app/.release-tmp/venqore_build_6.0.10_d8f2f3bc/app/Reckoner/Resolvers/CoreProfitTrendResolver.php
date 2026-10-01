<?php

namespace App\Reckoner\Resolvers;

final class CoreProfitTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.profit_trend';
    }
}

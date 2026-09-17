<?php

namespace App\Reckoner\Resolvers;

final class CoreLiquidityTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.liquidity_trend';
    }
}

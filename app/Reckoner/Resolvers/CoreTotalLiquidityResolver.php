<?php

namespace App\Reckoner\Resolvers;

final class CoreTotalLiquidityResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.total_liquidity';
    }
}

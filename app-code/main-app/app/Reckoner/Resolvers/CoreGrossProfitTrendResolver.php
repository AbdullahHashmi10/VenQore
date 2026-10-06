<?php

namespace App\Reckoner\Resolvers;

final class CoreGrossProfitTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.gross_profit_trend';
    }
}

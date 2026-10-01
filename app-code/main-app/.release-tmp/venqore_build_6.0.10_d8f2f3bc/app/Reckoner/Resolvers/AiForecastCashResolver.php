<?php

namespace App\Reckoner\Resolvers;

final class AiForecastCashResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'ai.forecast_cash';
    }
}

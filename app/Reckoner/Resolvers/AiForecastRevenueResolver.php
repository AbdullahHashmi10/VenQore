<?php

namespace App\Reckoner\Resolvers;

final class AiForecastRevenueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'ai.forecast_revenue';
    }
}

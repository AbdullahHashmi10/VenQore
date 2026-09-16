<?php

namespace App\Reckoner\Resolvers;

final class StocktakesLastCountDaysResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'stocktakes.last_count_days';
    }
}

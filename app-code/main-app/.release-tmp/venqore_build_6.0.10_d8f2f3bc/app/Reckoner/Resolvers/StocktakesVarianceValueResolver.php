<?php

namespace App\Reckoner\Resolvers;

final class StocktakesVarianceValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'stocktakes.variance_value';
    }
}

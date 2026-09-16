<?php

namespace App\Reckoner\Resolvers;

final class StocktakesVariancePctResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'stocktakes.variance_pct';
    }
}

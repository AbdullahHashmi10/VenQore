<?php

namespace App\Reckoner\Resolvers;

final class StocktakesTopVariancesResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'stocktakes.top_variances';
    }
}

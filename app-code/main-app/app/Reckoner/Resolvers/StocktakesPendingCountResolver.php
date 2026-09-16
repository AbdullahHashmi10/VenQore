<?php

namespace App\Reckoner\Resolvers;

final class StocktakesPendingCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'stocktakes.pending_count';
    }
}

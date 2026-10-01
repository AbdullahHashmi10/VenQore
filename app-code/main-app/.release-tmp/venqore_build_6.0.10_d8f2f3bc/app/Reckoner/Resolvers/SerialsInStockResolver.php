<?php

namespace App\Reckoner\Resolvers;

final class SerialsInStockResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'serials.in_stock';
    }
}

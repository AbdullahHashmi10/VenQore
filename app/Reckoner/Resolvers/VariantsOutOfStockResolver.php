<?php

namespace App\Reckoner\Resolvers;

final class VariantsOutOfStockResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'variants.out_of_stock';
    }
}

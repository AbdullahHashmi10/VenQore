<?php

namespace App\Reckoner\Resolvers;

final class ProductsLowestMarginResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'products.lowest_margin';
    }
}

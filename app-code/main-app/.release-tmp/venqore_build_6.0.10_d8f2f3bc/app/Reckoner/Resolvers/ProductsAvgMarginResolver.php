<?php

namespace App\Reckoner\Resolvers;

final class ProductsAvgMarginResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'products.avg_margin';
    }
}

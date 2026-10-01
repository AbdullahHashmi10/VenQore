<?php

namespace App\Reckoner\Resolvers;

final class ProductsCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'products.count';
    }
}

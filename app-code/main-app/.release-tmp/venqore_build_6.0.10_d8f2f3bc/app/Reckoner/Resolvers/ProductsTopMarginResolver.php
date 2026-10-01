<?php

namespace App\Reckoner\Resolvers;

final class ProductsTopMarginResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'products.top_margin';
    }
}

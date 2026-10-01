<?php

namespace App\Reckoner\Resolvers;

final class ProductsActiveCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'products.active_count';
    }
}

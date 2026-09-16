<?php

namespace App\Reckoner\Resolvers;

final class ProductsNeverSoldResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'products.never_sold';
    }
}

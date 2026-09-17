<?php

namespace App\Reckoner\Resolvers;

final class ProductsByCategoryResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'products.by_category';
    }
}

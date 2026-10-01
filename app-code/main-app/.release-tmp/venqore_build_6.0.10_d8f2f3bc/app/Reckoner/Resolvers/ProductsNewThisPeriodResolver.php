<?php

namespace App\Reckoner\Resolvers;

final class ProductsNewThisPeriodResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'products.new_this_period';
    }
}

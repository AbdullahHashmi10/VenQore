<?php

namespace App\Reckoner\Resolvers;

final class ProductsMissingCostResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'products.missing_cost';
    }
}

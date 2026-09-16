<?php

namespace App\Reckoner\Resolvers;

final class ProductionTotalCostResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'production.total_cost';
    }
}

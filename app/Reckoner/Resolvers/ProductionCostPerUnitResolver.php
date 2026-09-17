<?php

namespace App\Reckoner\Resolvers;

final class ProductionCostPerUnitResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'production.cost_per_unit';
    }
}

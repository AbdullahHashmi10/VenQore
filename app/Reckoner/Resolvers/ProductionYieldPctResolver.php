<?php

namespace App\Reckoner\Resolvers;

final class ProductionYieldPctResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'production.yield_pct';
    }
}

<?php

namespace App\Reckoner\Resolvers;

final class ProductionWastageValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'production.wastage_value';
    }
}

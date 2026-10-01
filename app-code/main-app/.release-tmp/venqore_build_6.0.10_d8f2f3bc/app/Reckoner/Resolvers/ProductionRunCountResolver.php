<?php

namespace App\Reckoner\Resolvers;

final class ProductionRunCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'production.run_count';
    }
}

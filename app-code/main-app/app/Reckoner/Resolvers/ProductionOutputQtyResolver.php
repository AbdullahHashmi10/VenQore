<?php

namespace App\Reckoner\Resolvers;

final class ProductionOutputQtyResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'production.output_qty';
    }
}

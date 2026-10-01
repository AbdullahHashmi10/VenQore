<?php

namespace App\Reckoner\Resolvers;

final class SuppliersConcentrationResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'suppliers.concentration';
    }
}

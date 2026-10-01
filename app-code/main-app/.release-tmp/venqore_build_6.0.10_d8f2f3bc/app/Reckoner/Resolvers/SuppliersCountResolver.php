<?php

namespace App\Reckoner\Resolvers;

final class SuppliersCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'suppliers.count';
    }
}

<?php

namespace App\Reckoner\Resolvers;

final class SuppliersTopSuppliersResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'suppliers.top_suppliers';
    }
}

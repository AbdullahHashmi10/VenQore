<?php

namespace App\Reckoner\Resolvers;

final class SuppliersActiveResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'suppliers.active';
    }
}

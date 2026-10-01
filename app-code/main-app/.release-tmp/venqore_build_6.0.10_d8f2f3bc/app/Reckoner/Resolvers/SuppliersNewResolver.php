<?php

namespace App\Reckoner\Resolvers;

final class SuppliersNewResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'suppliers.new';
    }
}

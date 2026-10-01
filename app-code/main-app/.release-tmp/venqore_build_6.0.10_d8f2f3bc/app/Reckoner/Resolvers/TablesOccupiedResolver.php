<?php

namespace App\Reckoner\Resolvers;

final class TablesOccupiedResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'tables.occupied';
    }
}

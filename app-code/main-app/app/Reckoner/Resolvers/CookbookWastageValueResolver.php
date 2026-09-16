<?php

namespace App\Reckoner\Resolvers;

final class CookbookWastageValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'cookbook.wastage_value';
    }
}

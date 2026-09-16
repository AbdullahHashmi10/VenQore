<?php

namespace App\Reckoner\Resolvers;

final class CookbookWorstMarginResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'cookbook.worst_margin';
    }
}

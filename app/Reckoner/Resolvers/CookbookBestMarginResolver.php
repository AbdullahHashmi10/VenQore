<?php

namespace App\Reckoner\Resolvers;

final class CookbookBestMarginResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'cookbook.best_margin';
    }
}

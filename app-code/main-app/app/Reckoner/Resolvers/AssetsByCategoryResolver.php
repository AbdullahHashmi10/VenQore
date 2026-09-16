<?php

namespace App\Reckoner\Resolvers;

final class AssetsByCategoryResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'assets.by_category';
    }
}

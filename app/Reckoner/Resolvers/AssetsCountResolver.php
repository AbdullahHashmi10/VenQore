<?php

namespace App\Reckoner\Resolvers;

final class AssetsCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'assets.count';
    }
}

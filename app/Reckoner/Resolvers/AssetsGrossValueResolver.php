<?php

namespace App\Reckoner\Resolvers;

final class AssetsGrossValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'assets.gross_value';
    }
}

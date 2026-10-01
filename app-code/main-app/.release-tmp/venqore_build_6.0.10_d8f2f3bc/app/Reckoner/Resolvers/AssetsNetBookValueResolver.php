<?php

namespace App\Reckoner\Resolvers;

final class AssetsNetBookValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'assets.net_book_value';
    }
}

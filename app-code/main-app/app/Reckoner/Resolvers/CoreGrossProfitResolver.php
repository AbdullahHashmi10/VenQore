<?php

namespace App\Reckoner\Resolvers;

final class CoreGrossProfitResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.gross_profit';
    }
}

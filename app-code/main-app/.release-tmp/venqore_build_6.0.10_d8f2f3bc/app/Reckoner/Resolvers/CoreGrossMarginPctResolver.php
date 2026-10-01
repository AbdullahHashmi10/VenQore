<?php

namespace App\Reckoner\Resolvers;

final class CoreGrossMarginPctResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.gross_margin_pct';
    }
}

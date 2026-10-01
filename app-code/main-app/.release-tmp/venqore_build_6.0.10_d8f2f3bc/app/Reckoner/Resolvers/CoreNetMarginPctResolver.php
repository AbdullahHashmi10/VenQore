<?php

namespace App\Reckoner\Resolvers;

final class CoreNetMarginPctResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.net_margin_pct';
    }
}

<?php

namespace App\Reckoner\Resolvers;

final class CoreNetProfitResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.net_profit';
    }
}

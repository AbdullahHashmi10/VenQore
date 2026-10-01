<?php

namespace App\Reckoner\Resolvers;

final class CoreNetCashPositionResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.net_cash_position';
    }
}

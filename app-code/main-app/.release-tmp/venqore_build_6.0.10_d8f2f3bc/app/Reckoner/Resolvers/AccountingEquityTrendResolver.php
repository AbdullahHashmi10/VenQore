<?php

namespace App\Reckoner\Resolvers;

final class AccountingEquityTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'accounting.equity_trend';
    }
}

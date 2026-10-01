<?php

namespace App\Reckoner\Resolvers;

final class AccountingEquityTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'accounting.equity_total';
    }
}

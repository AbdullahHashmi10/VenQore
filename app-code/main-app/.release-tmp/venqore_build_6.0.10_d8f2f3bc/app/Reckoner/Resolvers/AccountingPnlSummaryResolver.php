<?php

namespace App\Reckoner\Resolvers;

final class AccountingPnlSummaryResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'accounting.pnl_summary';
    }
}

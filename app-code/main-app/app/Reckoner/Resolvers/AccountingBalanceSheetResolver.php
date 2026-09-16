<?php

namespace App\Reckoner\Resolvers;

final class AccountingBalanceSheetResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'accounting.balance_sheet';
    }
}

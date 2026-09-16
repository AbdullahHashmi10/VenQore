<?php

namespace App\Reckoner\Resolvers;

final class CoreBalanceSheetOkResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.balance_sheet_ok';
    }
}

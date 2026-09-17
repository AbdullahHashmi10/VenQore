<?php

namespace App\Reckoner\Resolvers;

final class AccountingTrialBalanceOkResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'accounting.trial_balance_ok';
    }
}

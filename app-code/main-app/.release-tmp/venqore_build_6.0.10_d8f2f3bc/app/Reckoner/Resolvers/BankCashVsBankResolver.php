<?php

namespace App\Reckoner\Resolvers;

final class BankCashVsBankResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'bank.cash_vs_bank';
    }
}

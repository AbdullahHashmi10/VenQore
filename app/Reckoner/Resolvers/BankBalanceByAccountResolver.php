<?php

namespace App\Reckoner\Resolvers;

final class BankBalanceByAccountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'bank.balance_by_account';
    }
}

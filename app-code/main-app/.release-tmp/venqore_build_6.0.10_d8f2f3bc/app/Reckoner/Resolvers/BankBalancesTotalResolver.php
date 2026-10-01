<?php

namespace App\Reckoner\Resolvers;

final class BankBalancesTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'bank.balances_total';
    }
}

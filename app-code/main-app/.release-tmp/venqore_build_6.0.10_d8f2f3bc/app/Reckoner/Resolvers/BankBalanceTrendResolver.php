<?php

namespace App\Reckoner\Resolvers;

final class BankBalanceTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'bank.balance_trend';
    }
}

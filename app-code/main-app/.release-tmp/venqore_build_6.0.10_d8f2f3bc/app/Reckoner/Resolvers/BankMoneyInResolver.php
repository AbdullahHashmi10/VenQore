<?php

namespace App\Reckoner\Resolvers;

final class BankMoneyInResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'bank.money_in';
    }
}

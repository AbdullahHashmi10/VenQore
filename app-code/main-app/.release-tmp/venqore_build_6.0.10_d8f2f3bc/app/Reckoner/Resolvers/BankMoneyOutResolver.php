<?php

namespace App\Reckoner\Resolvers;

final class BankMoneyOutResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'bank.money_out';
    }
}

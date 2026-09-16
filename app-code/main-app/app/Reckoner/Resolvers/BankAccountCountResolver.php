<?php

namespace App\Reckoner\Resolvers;

final class BankAccountCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'bank.account_count';
    }
}

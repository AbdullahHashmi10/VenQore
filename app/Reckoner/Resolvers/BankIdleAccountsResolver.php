<?php

namespace App\Reckoner\Resolvers;

final class BankIdleAccountsResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'bank.idle_accounts';
    }
}

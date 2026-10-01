<?php

namespace App\Reckoner\Resolvers;

final class BankTopAccountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'bank.top_account';
    }
}

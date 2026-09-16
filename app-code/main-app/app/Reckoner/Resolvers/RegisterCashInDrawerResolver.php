<?php

namespace App\Reckoner\Resolvers;

final class RegisterCashInDrawerResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'register.cash_in_drawer';
    }
}

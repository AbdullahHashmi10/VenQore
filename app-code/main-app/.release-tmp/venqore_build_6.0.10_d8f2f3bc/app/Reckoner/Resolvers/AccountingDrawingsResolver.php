<?php

namespace App\Reckoner\Resolvers;

final class AccountingDrawingsResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'accounting.drawings';
    }
}

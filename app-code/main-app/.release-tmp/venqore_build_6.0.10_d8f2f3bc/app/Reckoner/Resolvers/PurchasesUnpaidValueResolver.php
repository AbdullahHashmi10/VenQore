<?php

namespace App\Reckoner\Resolvers;

final class PurchasesUnpaidValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'purchases.unpaid_value';
    }
}

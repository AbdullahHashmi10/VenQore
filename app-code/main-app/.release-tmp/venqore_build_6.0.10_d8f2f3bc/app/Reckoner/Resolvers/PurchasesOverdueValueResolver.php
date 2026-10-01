<?php

namespace App\Reckoner\Resolvers;

final class PurchasesOverdueValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'purchases.overdue_value';
    }
}

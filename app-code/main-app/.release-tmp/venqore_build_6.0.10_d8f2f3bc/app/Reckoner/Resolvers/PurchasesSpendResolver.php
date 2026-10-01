<?php

namespace App\Reckoner\Resolvers;

final class PurchasesSpendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'purchases.spend';
    }
}

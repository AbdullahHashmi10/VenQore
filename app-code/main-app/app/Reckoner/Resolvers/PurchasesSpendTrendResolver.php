<?php

namespace App\Reckoner\Resolvers;

final class PurchasesSpendTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'purchases.spend_trend';
    }
}

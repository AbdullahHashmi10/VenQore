<?php

namespace App\Reckoner\Resolvers;

final class PurchaseReturnsRateResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'purchase_returns.rate';
    }
}

<?php

namespace App\Reckoner\Resolvers;

final class PurchaseReturnsValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'purchase_returns.value';
    }
}

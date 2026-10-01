<?php

namespace App\Reckoner\Resolvers;

final class PurchaseReturnsCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'purchase_returns.count';
    }
}

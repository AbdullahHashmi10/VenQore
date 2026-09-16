<?php

namespace App\Reckoner\Resolvers;

final class PurchaseReturnsBySupplierResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'purchase_returns.by_supplier';
    }
}

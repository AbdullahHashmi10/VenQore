<?php

namespace App\Reckoner\Resolvers;

final class PurchasesBySupplierResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'purchases.by_supplier';
    }
}

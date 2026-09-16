<?php

namespace App\Reckoner\Resolvers;

final class PurchasesPaidToSuppliersResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'purchases.paid_to_suppliers';
    }
}

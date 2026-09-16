<?php

namespace App\Reckoner\Resolvers;

final class PurchaseReturnsCreditDueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'purchase_returns.credit_due';
    }
}

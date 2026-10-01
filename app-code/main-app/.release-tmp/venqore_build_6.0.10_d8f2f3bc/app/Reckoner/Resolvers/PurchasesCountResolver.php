<?php

namespace App\Reckoner\Resolvers;

final class PurchasesCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'purchases.count';
    }
}

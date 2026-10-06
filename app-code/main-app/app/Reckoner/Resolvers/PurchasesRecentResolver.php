<?php

namespace App\Reckoner\Resolvers;

final class PurchasesRecentResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'purchases.recent';
    }
}

<?php

namespace App\Reckoner\Resolvers;

final class PurchasesByCategoryResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'purchases.by_category';
    }
}

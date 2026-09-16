<?php

namespace App\Reckoner\Resolvers;

final class PurchasesPriceIncreasesResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'purchases.price_increases';
    }
}

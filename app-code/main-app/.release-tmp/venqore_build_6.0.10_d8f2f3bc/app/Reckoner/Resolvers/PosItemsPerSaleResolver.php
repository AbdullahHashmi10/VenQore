<?php

namespace App\Reckoner\Resolvers;

final class PosItemsPerSaleResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'pos.items_per_sale';
    }
}

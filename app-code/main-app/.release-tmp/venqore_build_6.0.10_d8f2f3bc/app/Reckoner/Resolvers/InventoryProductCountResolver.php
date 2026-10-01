<?php

namespace App\Reckoner\Resolvers;

final class InventoryProductCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'inventory.product_count';
    }
}

<?php

namespace App\Reckoner\Resolvers;

final class InventoryValueByCategoryResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'inventory.value_by_category';
    }
}

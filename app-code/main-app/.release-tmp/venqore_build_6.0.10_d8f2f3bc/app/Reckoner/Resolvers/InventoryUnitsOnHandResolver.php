<?php

namespace App\Reckoner\Resolvers;

final class InventoryUnitsOnHandResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'inventory.units_on_hand';
    }
}

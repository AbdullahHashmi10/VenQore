<?php

namespace App\Reckoner\Resolvers;

final class InventoryTopByValueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'inventory.top_by_value';
    }
}

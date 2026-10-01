<?php

namespace App\Reckoner\Resolvers;

final class InventoryDaysOfCoverResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'inventory.days_of_cover';
    }
}

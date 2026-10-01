<?php

namespace App\Reckoner\Resolvers;

final class InventoryTurnoverRatioResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'inventory.turnover_ratio';
    }
}

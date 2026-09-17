<?php

namespace App\Reckoner\Resolvers;

final class TablesKitchenPendingResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'tables.kitchen_pending';
    }
}

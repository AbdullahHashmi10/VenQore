<?php

namespace App\Reckoner\Resolvers;

final class SuppliersSpendTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'suppliers.spend_trend';
    }
}

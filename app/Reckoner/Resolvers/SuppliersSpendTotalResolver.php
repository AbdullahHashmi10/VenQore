<?php

namespace App\Reckoner\Resolvers;

final class SuppliersSpendTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'suppliers.spend_total';
    }
}

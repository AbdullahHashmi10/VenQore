<?php

namespace App\Reckoner\Resolvers;

final class KhataBiggestDebtorsResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'khata.biggest_debtors';
    }
}

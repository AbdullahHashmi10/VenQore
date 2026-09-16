<?php

namespace App\Reckoner\Resolvers;

final class SerialsUnderWarrantyResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'serials.under_warranty';
    }
}

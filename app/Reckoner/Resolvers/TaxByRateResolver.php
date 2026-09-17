<?php

namespace App\Reckoner\Resolvers;

final class TaxByRateResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'tax.by_rate';
    }
}

<?php

namespace App\Reckoner\Resolvers;

final class TaxCollectedResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'tax.collected';
    }
}

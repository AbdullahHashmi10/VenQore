<?php

namespace App\Reckoner\Resolvers;

final class UomMissingConversionResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'uom.missing_conversion';
    }
}

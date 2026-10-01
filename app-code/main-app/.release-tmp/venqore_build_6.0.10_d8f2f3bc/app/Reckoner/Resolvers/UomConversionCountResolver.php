<?php

namespace App\Reckoner\Resolvers;

final class UomConversionCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'uom.conversion_count';
    }
}

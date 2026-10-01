<?php

namespace App\Reckoner\Resolvers;

final class UomCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'uom.count';
    }
}

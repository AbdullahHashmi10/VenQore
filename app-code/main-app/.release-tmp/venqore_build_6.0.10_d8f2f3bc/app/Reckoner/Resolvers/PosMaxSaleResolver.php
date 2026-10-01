<?php

namespace App\Reckoner\Resolvers;

final class PosMaxSaleResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'pos.max_sale';
    }
}

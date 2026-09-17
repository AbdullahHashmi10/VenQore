<?php

namespace App\Reckoner\Resolvers;

final class PosDiscountTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'pos.discount_total';
    }
}

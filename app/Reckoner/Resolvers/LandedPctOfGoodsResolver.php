<?php

namespace App\Reckoner\Resolvers;

final class LandedPctOfGoodsResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'landed.pct_of_goods';
    }
}

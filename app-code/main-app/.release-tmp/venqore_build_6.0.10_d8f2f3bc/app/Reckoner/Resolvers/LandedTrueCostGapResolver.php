<?php

namespace App\Reckoner\Resolvers;

final class LandedTrueCostGapResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'landed.true_cost_gap';
    }
}

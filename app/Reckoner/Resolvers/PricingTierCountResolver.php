<?php

namespace App\Reckoner\Resolvers;

final class PricingTierCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'pricing.tier_count';
    }
}

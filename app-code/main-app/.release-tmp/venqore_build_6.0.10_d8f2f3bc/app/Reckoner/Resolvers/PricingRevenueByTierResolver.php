<?php

namespace App\Reckoner\Resolvers;

final class PricingRevenueByTierResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'pricing.revenue_by_tier';
    }
}

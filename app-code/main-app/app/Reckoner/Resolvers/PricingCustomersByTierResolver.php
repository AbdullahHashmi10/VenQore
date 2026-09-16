<?php

namespace App\Reckoner\Resolvers;

final class PricingCustomersByTierResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'pricing.customers_by_tier';
    }
}

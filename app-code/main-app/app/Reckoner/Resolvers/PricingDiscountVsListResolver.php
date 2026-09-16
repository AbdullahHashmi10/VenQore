<?php

namespace App\Reckoner\Resolvers;

final class PricingDiscountVsListResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'pricing.discount_vs_list';
    }
}

<?php

namespace App\Reckoner\Resolvers;

final class PricingAvgRealisedPriceResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'pricing.avg_realised_price';
    }
}

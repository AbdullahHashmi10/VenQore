<?php

namespace App\Reckoner\Resolvers;

final class MarketplaceRevenueByChannelResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'marketplace.revenue_by_channel';
    }
}

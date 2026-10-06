<?php

namespace App\Reckoner\Resolvers;

final class MarketplaceOnlineRevenueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'marketplace.online_revenue';
    }
}

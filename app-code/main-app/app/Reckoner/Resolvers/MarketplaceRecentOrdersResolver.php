<?php

namespace App\Reckoner\Resolvers;

final class MarketplaceRecentOrdersResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'marketplace.recent_orders';
    }
}

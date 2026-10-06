<?php

namespace App\Reckoner\Resolvers;

final class MarketplaceOnlineOrdersResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'marketplace.online_orders';
    }
}

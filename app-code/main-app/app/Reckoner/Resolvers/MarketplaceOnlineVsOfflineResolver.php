<?php

namespace App\Reckoner\Resolvers;

final class MarketplaceOnlineVsOfflineResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'marketplace.online_vs_offline';
    }
}

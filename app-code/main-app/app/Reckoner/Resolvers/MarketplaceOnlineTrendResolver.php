<?php

namespace App\Reckoner\Resolvers;

final class MarketplaceOnlineTrendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'marketplace.online_trend';
    }
}

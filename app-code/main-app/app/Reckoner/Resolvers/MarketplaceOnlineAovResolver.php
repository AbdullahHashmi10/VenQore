<?php

namespace App\Reckoner\Resolvers;

final class MarketplaceOnlineAovResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'marketplace.online_aov';
    }
}

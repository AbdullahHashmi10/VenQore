<?php

namespace App\Reckoner\Resolvers;

final class MarketplaceChannelCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'marketplace.channel_count';
    }
}

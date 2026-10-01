<?php

namespace App\Reckoner\Resolvers;

final class MarketplaceChannelMarginResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'marketplace.channel_margin';
    }
}

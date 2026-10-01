<?php

namespace App\Reckoner\Resolvers;

final class MarketplaceSyncErrorsResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'marketplace.sync_errors';
    }
}

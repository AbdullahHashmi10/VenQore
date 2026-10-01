<?php

namespace App\Reckoner\Resolvers;

final class MarketplaceStockMismatchResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'marketplace.stock_mismatch';
    }
}

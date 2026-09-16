<?php

namespace App\Reckoner\Resolvers;

final class LoyaltyLiabilityResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'loyalty.liability';
    }
}

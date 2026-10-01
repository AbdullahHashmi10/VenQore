<?php

namespace App\Reckoner\Resolvers;

final class LoyaltyMemberAvgSpendResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'loyalty.member_avg_spend';
    }
}

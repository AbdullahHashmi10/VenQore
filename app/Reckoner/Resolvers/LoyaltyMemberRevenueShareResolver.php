<?php

namespace App\Reckoner\Resolvers;

final class LoyaltyMemberRevenueShareResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'loyalty.member_revenue_share';
    }
}

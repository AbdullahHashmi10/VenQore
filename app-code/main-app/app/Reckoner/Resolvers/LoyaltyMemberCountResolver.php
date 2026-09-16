<?php

namespace App\Reckoner\Resolvers;

final class LoyaltyMemberCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'loyalty.member_count';
    }
}

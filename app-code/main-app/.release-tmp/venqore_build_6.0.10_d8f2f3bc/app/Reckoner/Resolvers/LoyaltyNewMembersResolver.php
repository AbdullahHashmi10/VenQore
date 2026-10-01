<?php

namespace App\Reckoner\Resolvers;

final class LoyaltyNewMembersResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'loyalty.new_members';
    }
}

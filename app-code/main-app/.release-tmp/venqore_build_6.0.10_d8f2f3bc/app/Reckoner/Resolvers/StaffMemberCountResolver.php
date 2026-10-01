<?php

namespace App\Reckoner\Resolvers;

final class StaffMemberCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'staff.member_count';
    }
}

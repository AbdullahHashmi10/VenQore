<?php

namespace App\Reckoner\Resolvers;

final class StaffAbsentTodayResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'staff.absent_today';
    }
}

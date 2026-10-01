<?php

namespace App\Reckoner\Resolvers;

final class StaffPresentTodayResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'staff.present_today';
    }
}

<?php

namespace App\Reckoner\Resolvers;

final class StaffHoursWorkedResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'staff.hours_worked';
    }
}

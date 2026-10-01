<?php

namespace App\Reckoner\Resolvers;

final class StaffAttendanceRateResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'staff.attendance_rate';
    }
}

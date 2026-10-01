<?php

namespace App\Reckoner\Resolvers;

final class StaffRevenuePerStaffResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'staff.revenue_per_staff';
    }
}
